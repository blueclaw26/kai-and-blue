// Game State Management
var Game = (function() {
  'use strict';

  var MAX_FLOOR = 20;
  var MAX_ENEMIES_PER_FLOOR = 15;

  function Game() {
    this.dungeon = null;
    this.player = null;
    this.enemies = [];
    this.items = [];
    this.traps = [];
    this.floorNum = 1;
    this.explored = new Set();
    this.ui = null;
    this.gameOver = false;
    this.victory = false;
    this.inventoryOpen = false;
    this.inventorySelection = 0;
    // Direction selection mode for staves/throw
    this.directionMode = null;
    // Identification mode (after using 識別の巻物)
    this.identifyMode = false;
    // Shop state
    this.shopRoom = null; // room object if this floor has a shop
    this.shopkeeperHostile = false;
    this.shopItems = new Set(); // track items that are shop merchandise
    this.shopDebt = 0; // total unpaid amount for picked-up shop items
    this.inShop = false; // whether player is currently in the shop room
    // Sell confirmation mode
    this.sellConfirmMode = null; // { item: Item } when awaiting y/n
    // Map revealed by あかりの巻物
    this.mapRevealed = false;
  }

  Game.prototype.init = function(ui) {
    this.ui = ui;
    // Initialize identification system
    initIdentification();
    this.newFloor();
    ui.addMessage('ダンジョンに足を踏み入れた...', 'system');
  };

  Game.prototype.newFloor = function() {
    this.dungeon = Dungeon.generateFloor(40, 30);
    this.explored = new Set();
    this.shopRoom = null;
    this.shopkeeperHostile = false;
    this.shopItems = new Set();
    this.shopDebt = 0;
    this.inShop = false;
    this.sellConfirmMode = null;
    this.mapRevealed = false;

    if (!this.player) {
      this.player = new Player(this.dungeon.playerStart.x, this.dungeon.playerStart.y);
    } else {
      this.player.moveTo(this.dungeon.playerStart.x, this.dungeon.playerStart.y);
    }
    this.player.floor = this.floorNum;

    var startRoom = this.dungeon.rooms[0];
    this.enemies = Enemy.spawnForFloor(this.dungeon, this.floorNum, startRoom);
    this.items = Item.spawnForFloor(this.dungeon, this.floorNum, startRoom);
    this.traps = Trap.spawnForFloor(this.dungeon, this.floorNum, this.items);

    // Shop generation: 20% chance per floor (not floor 1)
    if (this.floorNum > 1 && Math.random() < 0.20) {
      this._generateShop(startRoom);
    }
  };

  // --- Shop generation ---
  Game.prototype._generateShop = function(playerStartRoom) {
    // Pick a room that isn't the start room
    var candidates = [];
    for (var i = 1; i < this.dungeon.rooms.length; i++) {
      var r = this.dungeon.rooms[i];
      // Don't put shop in a tiny room
      if (r.w >= 5 && r.h >= 4) {
        candidates.push(r);
      }
    }
    if (candidates.length === 0) return;

    this.shopRoom = candidates[Math.floor(Math.random() * candidates.length)];

    // Place 4-8 shop items
    var shopCount = 4 + Math.floor(Math.random() * 5);
    var placed = 0;
    var attempts = 0;

    while (placed < shopCount && attempts < 50) {
      attempts++;
      var ix = this.shopRoom.x + 1 + Math.floor(Math.random() * (this.shopRoom.w - 2));
      var iy = this.shopRoom.y + 1 + Math.floor(Math.random() * (this.shopRoom.h - 2));

      if (this.dungeon.grid[iy][ix] === Dungeon.TILE.STAIRS_DOWN) continue;

      // Check no overlap
      var occupied = false;
      for (var j = 0; j < this.items.length; j++) {
        if (this.items[j].x === ix && this.items[j].y === iy) { occupied = true; break; }
      }
      if (occupied) continue;

      var selectedKey = Item.pickItemForFloor ? Item.pickItemForFloor(this.floorNum) : 'herb';
      // Use floor table to pick item
      var table = FLOOR_TABLE.items;
      var eligible = [];
      var totalWeight = 0;
      for (var t = 0; t < table.length; t++) {
        var entry = table[t];
        if (this.floorNum >= entry[0] && this.floorNum <= entry[1]) {
          eligible.push({ id: entry[2], weight: entry[3] });
          totalWeight += entry[3];
        }
      }
      if (eligible.length > 0) {
        var roll = Math.random() * totalWeight;
        var cumulative = 0;
        for (var e = 0; e < eligible.length; e++) {
          cumulative += eligible[e].weight;
          if (roll < cumulative) {
            selectedKey = eligible[e].id;
            break;
          }
        }
      }

      var shopItem = new Item(ix, iy, selectedKey);
      shopItem.identified = true; // shop items are always identified
      shopItem.shopItem = true;
      this.items.push(shopItem);
      this.shopItems.add(shopItem);
      placed++;
    }

    // Place shopkeeper in the room
    var skx = Math.floor(this.shopRoom.x + this.shopRoom.w / 2);
    var sky = this.shopRoom.y + 1; // top of room
    // Make sure not on another entity
    var skTemplate = ENEMY_DATA.shopkeeper;
    var sk = new Enemy(skx, sky, skTemplate, 'shopkeeper');
    sk.isShopkeeper = true;
    this.enemies.push(sk);
  };

  // Check if a position is inside the shop room
  Game.prototype.isInShop = function(x, y) {
    if (!this.shopRoom) return false;
    var r = this.shopRoom;
    return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
  };

  // Get shopkeeper enemy (alive)
  Game.prototype.getShopkeeper = function() {
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.dead && e.isShopkeeper) return e;
    }
    return null;
  };

  // Trigger theft - full Shiren-style thief mode
  Game.prototype._triggerTheft = function() {
    if (this.shopkeeperHostile) return;
    this.shopkeeperHostile = true;

    this.ui.addMessage('泥棒！！！', 'damage');

    var sk = this.getShopkeeper();
    if (sk) {
      // Shopkeeper becomes hostile with double speed
      sk.isShopkeeper = false; // acts like a normal enemy now
      sk.doubleSpeed = true; // 2 actions per turn
      sk.immuneToStatus = true; // immune to confusion/paralysis/slow
      this.ui.addMessage('店主が怒って追いかけてきた！', 'enemy_special');
    }

    // Spawn 2-3 guard dogs near stairs
    var stairsPos = this.dungeon.stairs;
    var guardData = ENEMY_DATA.guard_dog;
    var guardCount = 2 + Math.floor(Math.random() * 2); // 2-3
    var guardDirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
    var spawned = 0;

    for (var g = 0; g < guardDirs.length && spawned < guardCount; g++) {
      var gx = stairsPos.x + guardDirs[g][0];
      var gy = stairsPos.y + guardDirs[g][1];
      if (gx >= 0 && gx < this.dungeon.width && gy >= 0 && gy < this.dungeon.height &&
          this.dungeon.grid[gy][gx] !== Dungeon.TILE.WALL && !this.getEnemyAt(gx, gy)) {
        var guard = new Enemy(gx, gy, guardData, 'guard_dog');
        this.enemies.push(guard);
        spawned++;
      }
    }

    if (spawned > 0) {
      this.ui.addMessage('番犬が出現した！', 'enemy_special');
    }

    // Clear shop items flag from inventory items and reset debt
    for (var i = 0; i < this.player.inventory.length; i++) {
      this.player.inventory[i].shopItem = false;
    }
    this.shopDebt = 0;
  };

  Game.prototype.getTrapAt = function(x, y) {
    for (var i = 0; i < this.traps.length; i++) {
      var t = this.traps[i];
      if (!t.consumed && t.x === x && t.y === y) return t;
    }
    return null;
  };

  Game.prototype.getEnemyAt = function(x, y) {
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.dead && e.x === x && e.y === y) return e;
    }
    return null;
  };

  Game.prototype.getItemAt = function(x, y) {
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].x === x && this.items[i].y === y) return this.items[i];
    }
    return null;
  };

  Game.prototype.removeItem = function(item) {
    var idx = this.items.indexOf(item);
    if (idx !== -1) this.items.splice(idx, 1);
    this.shopItems.delete(item);
  };

  Game.prototype.pickUpItem = function() {
    var item = this.getItemAt(this.player.x, this.player.y);
    if (!item) {
      // If in shop with debt, 'g' pays the debt
      if (this.inShop && this.shopDebt > 0 && !this.shopkeeperHostile) {
        return this._payShopDebt();
      }
      this.ui.addMessage('足元には何もない', 'system');
      return false;
    }

    // Gold pickup
    if (item.isGold) {
      this.player.gold += item.goldAmount;
      this.removeItem(item);
      this.ui.addMessage(item.goldAmount + 'ギタンを拾った', 'pickup');
      return true;
    }

    // Shop item: pick up but track as debt (Shiren-style)
    if (item.shopItem && !this.shopkeeperHostile) {
      return this._pickUpShopItem(item);
    }

    if (!this.player.canPickUp()) {
      this.ui.addMessage('持ち物がいっぱいだ', 'system');
      return false;
    }
    this.player.pickUp(item);
    this.removeItem(item);
    this.ui.addMessage(item.getDisplayName() + 'を拾った', 'pickup');
    return true;
  };

  // Pick up shop item - add to inventory + add debt
  Game.prototype._pickUpShopItem = function(item) {
    if (!this.player.canPickUp()) {
      this.ui.addMessage('持ち物がいっぱいだ', 'system');
      return false;
    }
    var price = item.getBuyPrice();
    this.player.pickUp(item);
    this.removeItem(item);
    // Keep shopItem flag - tracks that it's unpaid
    this.shopDebt += price;
    this.ui.addMessage(item.getDisplayName() + 'を手に取った（' + price + 'ギタン）', 'pickup');
    return true;
  };

  // Pay off shop debt
  Game.prototype._payShopDebt = function() {
    if (this.shopDebt <= 0) return false;
    if (this.player.gold >= this.shopDebt) {
      this.player.gold -= this.shopDebt;
      this.ui.addMessage(this.shopDebt + 'ギタン支払った', 'pickup');
      this.shopDebt = 0;
      // Clear shopItem flag from all inventory items
      for (var i = 0; i < this.player.inventory.length; i++) {
        this.player.inventory[i].shopItem = false;
      }
      this.ui.addMessage('店主「まいどあり！」', 'system');
      return true;
    } else {
      this.ui.addMessage('ギタンが足りない！（' + this.shopDebt + 'ギタン必要）', 'damage');
      return false;
    }
  };

  Game.prototype.dropItem = function(item) {
    if (this.getItemAt(this.player.x, this.player.y)) {
      this.ui.addMessage('ここには既にアイテムがある', 'system');
      return false;
    }
    if (this.player.weapon === item) {
      this.player.weapon = null;
      this.player._recalcStats();
    }
    if (this.player.shield === item) {
      this.player.shield = null;
      this.player._recalcStats();
    }
    this.player.removeFromInventory(item);
    item.x = this.player.x;
    item.y = this.player.y;
    this.items.push(item);

    // If dropping in shop room → sell offer
    if (this.isInShop(this.player.x, this.player.y) && !this.shopkeeperHostile && this.getShopkeeper()) {
      var sellPrice = item.getSellPrice();
      this.ui.addMessage('店主「' + item.getDisplayName() + 'を' + sellPrice + 'ギタンで買い取るよ」(y/n)', 'system');
      this.sellConfirmMode = { item: item, price: sellPrice };
      return true;
    }

    this.ui.addMessage(item.getDisplayName() + 'を足元に置いた', 'system');
    return true;
  };

  // Confirm sell
  Game.prototype.confirmSell = function(accept) {
    if (!this.sellConfirmMode) return;
    var item = this.sellConfirmMode.item;
    var price = this.sellConfirmMode.price;
    this.sellConfirmMode = null;

    if (accept) {
      // Remove item from floor
      this.removeItem(item);
      this.player.gold += price;
      this.ui.addMessage(item.getDisplayName() + 'を' + price + 'ギタンで売った', 'pickup');
    } else {
      this.ui.addMessage('売るのをやめた', 'system');
    }
  };

  Game.prototype.useItem = function(item) {
    var consumed = item.use(this, this.player);
    if (consumed) {
      this.player.removeFromInventory(item);
      if (this.inventorySelection >= this.player.inventory.length) {
        this.inventorySelection = Math.max(0, this.player.inventory.length - 1);
      }
    }
    return consumed;
  };

  // Check if place-swap with shopkeeper should trigger theft
  Game.prototype.checkSwapTheft = function(enemy) {
    if (enemy.isShopkeeper && !this.shopkeeperHostile) {
      // After swap, check if player is now outside shop
      if (!this.isInShop(this.player.x, this.player.y)) {
        this.ui.addMessage('店主と場所を入れ替えた！', 'system');
        if (this.shopDebt > 0) {
          this._triggerTheft();
        }
      }
    }
  };

  Game.prototype.movePlayer = function(dx, dy) {
    if (this.gameOver || this.victory) return false;

    var newX = this.player.x + dx;
    var newY = this.player.y + dy;

    var enemy = this.getEnemyAt(newX, newY);
    if (enemy) {
      // Attacking shopkeeper triggers thief mode
      if (enemy.isShopkeeper && !this.shopkeeperHostile) {
        this.ui.addMessage('店主を攻撃した！', 'attack');
        this.ui.addMessage('店主が激怒した！', 'enemy_special');
        this._triggerTheft();
      }
      this.playerAttack(enemy);
      return true;
    }

    // Track if player was in shop before moving
    var wasInShop = this.isInShop(this.player.x, this.player.y);

    if (this.player.canMoveTo(newX, newY, this.dungeon)) {
      this.player.moveTo(newX, newY);

      // Update inShop status
      this.inShop = this.isInShop(newX, newY);

      // Check for trap
      this.checkPlayerTrap();

      // Check if player left shop with debt (thief!)
      if (wasInShop && !this.inShop && !this.shopkeeperHostile && this.shopDebt > 0) {
        this._triggerTheft();
      }

      // Auto-pickup items
      var item = this.getItemAt(newX, newY);
      if (item) {
        // Gold: always auto-pickup
        if (item.isGold) {
          this.player.gold += item.goldAmount;
          this.removeItem(item);
          this.ui.addMessage(item.goldAmount + 'ギタンを拾った', 'pickup');
        }
        // Shop items: show price instead of auto-pickup
        else if (item.shopItem && !this.shopkeeperHostile) {
          this.ui.addMessage(item.getDisplayName() + 'がある（' + item.getBuyPrice() + 'ギタン / gで手に取る）', 'system');
        }
        // Normal items: auto-pickup
        else {
          if (this.player.inventory.length < 20) {
            var idx = this.items.indexOf(item);
            if (idx !== -1) {
              this.items.splice(idx, 1);
              this.shopItems.delete(item);
              this.player.inventory.push(item);
              this.ui.addMessage(item.getDisplayName() + 'を拾った', 'pickup');
            }
          } else {
            this.ui.addMessage('持ち物がいっぱいで' + item.getDisplayName() + 'を拾えない', 'system');
          }
        }
      }
      return true;
    }
    return false;
  };

  // --- Trap triggering ---

  Game.prototype.checkPlayerTrap = function() {
    var trap = this.getTrapAt(this.player.x, this.player.y);
    if (!trap) return;

    trap.visible = true;
    this.triggerTrap(trap, this.player);
  };

  Game.prototype.checkEnemyTrap = function(enemy) {
    var trap = this.getTrapAt(enemy.x, enemy.y);
    if (!trap) return;

    if (trap.effect !== 'explosion' && trap.effect !== 'pitfall') return;

    trap.visible = true;
    this.triggerTrapOnEnemy(trap, enemy);
  };

  Game.prototype.triggerTrap = function(trap, player) {
    var ui = this.ui;

    switch (trap.effect) {
      case 'explosion':
        var blastDmg = 20;
        if (player.shield && player.shield.special === 'blast_resist') {
          blastDmg = Math.floor(blastDmg * 0.5);
          ui.addMessage('地雷が爆発した！ 盾が爆風を防いだ！ ' + blastDmg + 'ダメージ', 'damage');
        } else {
          ui.addMessage('地雷が爆発した！ ' + blastDmg + 'ダメージ', 'damage');
        }
        if (!player.godMode) player.hp -= blastDmg;
        for (var i = 0; i < this.enemies.length; i++) {
          var e = this.enemies[i];
          if (!e.dead && Math.abs(e.x - trap.x) <= 1 && Math.abs(e.y - trap.y) <= 1) {
            var died = e.takeDamage(15);
            ui.addMessage(e.name + 'に15ダメージ！', 'attack');
            if (died) {
              player.enemiesKilled++;
              ui.addMessage(e.name + 'を倒した！ 経験値' + e.exp + '獲得', 'attack');
              player.gainExp(e.exp, ui);
            }
          }
        }
        for (var j = this.items.length - 1; j >= 0; j--) {
          var it = this.items[j];
          if (Math.abs(it.x - trap.x) <= 1 && Math.abs(it.y - trap.y) <= 1) {
            ui.addMessage(it.getDisplayName() + 'が爆発で消滅した', 'system');
            this.shopItems.delete(it);
            this.items.splice(j, 1);
          }
        }
        trap.consumed = true;
        this._checkPlayerDeath();
        break;

      case 'pitfall':
        ui.addMessage('落とし穴に落ちた！', 'damage');
        if (!player.godMode) player.hp -= 5;
        if (this._checkPlayerDeath()) break;
        if (this.floorNum >= MAX_FLOOR) {
          this.victory = true;
          ui.addMessage('ダンジョンをクリアした！', 'levelup');
          ui.showVictory(player);
        } else {
          this.floorNum++;
          this.newFloor();
          ui.addMessage(this.floorNum + 'Fに落ちた', 'system');
        }
        break;

      case 'poison':
        ui.addMessage('毒矢が飛んできた！ ちからが下がった', 'damage');
        if (!player.godMode) player.hp -= 5;
        player.baseAttack = Math.max(1, player.baseAttack - 1);
        player._recalcStats();
        this._checkPlayerDeath();
        break;

      case 'sleep':
        ui.addMessage('睡眠ガスを吸い込んだ！', 'damage');
        player.sleepTurns = 5;
        break;

      case 'confuse':
        ui.addMessage('目が回った！', 'damage');
        player.addStatusEffect('confused', 10, ui);
        break;

      case 'hunger':
        ui.addMessage('デロデロの罠！ 満腹度が下がった', 'damage');
        player.satiety = Math.max(0, player.satiety - 30);
        for (var k = 0; k < player.inventory.length; k++) {
          var inv = player.inventory[k];
          if (inv.type === 'food' && (inv.dataKey === 'onigiri' || inv.dataKey === 'big_onigiri')) {
            inv.cursed = true;
            inv.name = '腐った' + inv.name;
            inv.color = '#4a6741';
            ui.addMessage(inv.name + 'が腐ってしまった！', 'damage');
          }
        }
        break;

      case 'trip':
        ui.addMessage('転んで持ち物を落としてしまった！', 'damage');
        var droppable = [];
        for (var m = 0; m < player.inventory.length; m++) {
          var item = player.inventory[m];
          if (item !== player.weapon && item !== player.shield) {
            droppable.push(item);
          }
        }
        if (droppable.length > 0) {
          var dropped = droppable[Math.floor(Math.random() * droppable.length)];
          player.removeFromInventory(dropped);
          dropped.x = player.x;
          dropped.y = player.y;
          this.items.push(dropped);
          ui.addMessage(dropped.getDisplayName() + 'を落とした', 'system');
        }
        break;

      case 'rust':
        if (player.shield) {
          var shield = player.shield;
          if (shield.plus > 0) {
            shield.plus--;
          } else {
            shield.defense = Math.max(0, shield.defense - 1);
          }
          player._recalcStats();
          ui.addMessage('盾が錆びた！ 防御力が1下がった', 'damage');
        } else {
          ui.addMessage('サビの罠を踏んだ！ しかし盾を装備していない', 'system');
        }
        break;
    }
  };

  Game.prototype.triggerTrapOnEnemy = function(trap, enemy) {
    var ui = this.ui;

    switch (trap.effect) {
      case 'explosion':
        ui.addMessage(enemy.name + 'が地雷を踏んだ！', 'attack');
        var died = enemy.takeDamage(20);
        if (died) {
          this.player.enemiesKilled++;
          ui.addMessage(enemy.name + 'を倒した！ 経験値' + enemy.exp + '獲得', 'attack');
          this.player.gainExp(enemy.exp, ui);
        }
        var px = this.player.x;
        var py = this.player.y;
        if (Math.abs(px - trap.x) <= 1 && Math.abs(py - trap.y) <= 1) {
          var blastDmg = 15;
          if (this.player.shield && this.player.shield.special === 'blast_resist') {
            blastDmg = Math.floor(blastDmg * 0.5);
          }
          if (!this.player.godMode) this.player.hp -= blastDmg;
          ui.addMessage('爆風で' + blastDmg + 'ダメージを受けた！', 'damage');
          this._checkPlayerDeath();
        }
        trap.consumed = true;
        break;

      case 'pitfall':
        ui.addMessage(enemy.name + 'が落とし穴に落ちた！', 'attack');
        enemy.dead = true;
        break;
    }
  };

  Game.prototype._checkPlayerDeath = function() {
    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.gameOver = true;
      this.ui.addMessage('倒れてしまった... ' + this.floorNum + 'Fで力尽きた', 'damage');
      this.ui.showGameOver(this.floorNum, this.player.level);
      return true;
    }
    return false;
  };

  // --- Player attack with weapon specials ---

  Game.prototype.playerAttack = function(enemy) {
    var player = this.player;
    var rawDmg = player.attack - enemy.defense + Math.floor(Math.random() * 3) - 1;
    var damage = Math.max(1, rawDmg);

    if (player.weapon && player.weapon.special) {
      var special = player.weapon.special;
      var multiplier = 1;

      switch (special) {
        case 'drain':
          if (enemy.special) multiplier = 1.5;
          break;
        case 'ghost':
          if (enemy.enemyId === 'midnighthat') multiplier = 1.5;
          break;
        case 'dragon':
          if (enemy.enemyId === 'dragon' || enemy.enemyId === 'skull_mage') multiplier = 1.5;
          break;
      }

      if (multiplier > 1) {
        damage = Math.floor(damage * multiplier);
        this.ui.addMessage('特効！ ', 'attack');
      }
    }

    var died = enemy.takeDamage(damage);

    this.ui.addMessage(enemy.name + 'に ' + damage + ' ダメージを与えた！', 'attack');

    if (died) {
      this.player.enemiesKilled++;
      this.ui.addMessage(enemy.name + 'を倒した！ 経験値' + enemy.exp + '獲得', 'attack');
      this.player.gainExp(enemy.exp, this.ui);

      // Drop loot when enemy dies
      if (!enemy.isShopkeeper) {
        var dropRoll = Math.random();
        if (dropRoll < 0.15) {
          // 15% chance: drop something
          if (Math.random() < 0.15) {
            // ~2% overall: drop gold
            var goldAmount = Math.floor(10 + Math.random() * (20 + this.floorNum * 10));
            var goldItem = this._createGoldItem(enemy.x, enemy.y, goldAmount);
            this.items.push(goldItem);
          } else {
            // ~13% overall: drop a random item
            var droppedKey = this._pickItemForFloor(this.floorNum);
            var droppedItem = new Item(enemy.x, enemy.y, droppedKey);
            this.items.push(droppedItem);
          }
        }
        // 85% chance: drop nothing
      }
    }
  };

  // Pick an item from FLOOR_TABLE weighted for given floor
  Game.prototype._pickItemForFloor = function(floorNum) {
    var table = FLOOR_TABLE.items;
    var eligible = [];
    var totalWeight = 0;

    for (var i = 0; i < table.length; i++) {
      var entry = table[i];
      if (floorNum >= entry[0] && floorNum <= entry[1]) {
        eligible.push({ id: entry[2], weight: entry[3] });
        totalWeight += entry[3];
      }
    }

    if (eligible.length === 0) return 'herb';

    var roll = Math.random() * totalWeight;
    var cumulative = 0;
    for (var j = 0; j < eligible.length; j++) {
      cumulative += eligible[j].weight;
      if (roll < cumulative) return eligible[j].id;
    }
    return eligible[eligible.length - 1].id;
  };

  // Create a gold item on the floor
  Game.prototype._createGoldItem = function(x, y, amount) {
    return {
      x: x,
      y: y,
      isGold: true,
      goldAmount: amount,
      char: '¥',
      color: '#ffd700',
      type: 'gold',
      name: amount + 'ギタン',
      getDisplayName: function() { return this.name; }
    };
  };

  Game.prototype.enemyAttack = function(enemy) {
    var player = this.player;

    player.wakeUp(this.ui);

    // Nigiri special
    if (enemy.special === 'onigiri' && Math.random() < 0.1) {
      var nonEquipped = [];
      for (var i = 0; i < player.inventory.length; i++) {
        var it = player.inventory[i];
        if (it !== player.weapon && it !== player.shield) {
          nonEquipped.push(i);
        }
      }
      if (nonEquipped.length > 0) {
        var targetIdx = nonEquipped[Math.floor(Math.random() * nonEquipped.length)];
        var targetItem = player.inventory[targetIdx];
        var oldName = targetItem.getDisplayName();
        var onigiri = new Item(0, 0, 'onigiri');
        player.inventory[targetIdx] = onigiri;
        this.ui.addMessage('にぎり見習いに' + oldName + 'をおにぎりにされた！', 'enemy_special');
        return;
      }
    }

    // Minotaur critical
    var isCritical = false;
    if (enemy.special === 'critical' && Math.random() < 0.25) {
      isCritical = true;
    }

    var rawDmg = enemy.attack - player.defense + Math.floor(Math.random() * 3) - 1;
    var damage = Math.max(1, rawDmg);

    if (isCritical) {
      damage *= 2;
      this.ui.addMessage('タウロスの痛恨の一撃！ ' + damage + 'ダメージ！', 'enemy_special');
    } else {
      this.ui.addMessage(enemy.name + 'の攻撃！ ' + damage + 'ダメージを受けた', 'damage');
    }

    if (player.godMode) damage = 0;
    player.hp -= damage;

    // Counter shield
    if (player.shield && player.shield.special === 'counter' && !enemy.dead) {
      var counterDmg = Math.max(1, Math.floor(damage * 0.3));
      var died = enemy.takeDamage(counterDmg);
      this.ui.addMessage('バトルカウンターの反撃！ ' + enemy.name + 'に' + counterDmg + 'ダメージ', 'attack');
      if (died) {
        player.enemiesKilled++;
        this.ui.addMessage(enemy.name + 'を倒した！ 経験値' + enemy.exp + '獲得', 'attack');
        player.gainExp(enemy.exp, this.ui);
      }
    }

    if (player.hp <= 0) {
      player.hp = 0;
      this.gameOver = true;
      this.ui.addMessage('倒れてしまった... ' + this.floorNum + 'Fで力尽きた', 'damage');
      this.ui.showGameOver(this.floorNum, player.level);
    }
  };

  Game.prototype.processEnemyTurns = function() {
    if (this.gameOver || this.victory) return;

    this.player.tickBuffs();
    this.player.tickSleep(this.ui);

    for (var i = 0; i < this.enemies.length; i++) {
      if (!this.enemies[i].dead) {
        // Shopkeeper doesn't act unless hostile
        if (this.enemies[i].isShopkeeper && !this.shopkeeperHostile) continue;

        var oldX = this.enemies[i].x;
        var oldY = this.enemies[i].y;
        this.enemies[i].act(this);
        if (!this.enemies[i].dead && (this.enemies[i].x !== oldX || this.enemies[i].y !== oldY)) {
          this.checkEnemyTrap(this.enemies[i]);
        }

        // Double speed: act twice per turn (hostile shopkeeper)
        if (!this.enemies[i].dead && this.enemies[i].doubleSpeed && !this.gameOver) {
          var oldX2 = this.enemies[i].x;
          var oldY2 = this.enemies[i].y;
          this.enemies[i].act(this);
          if (!this.enemies[i].dead && (this.enemies[i].x !== oldX2 || this.enemies[i].y !== oldY2)) {
            this.checkEnemyTrap(this.enemies[i]);
          }
        }
      }
      if (this.gameOver) break;
    }

    this.enemies = this.enemies.filter(function(e) { return !e.dead; });
    this.traps = this.traps.filter(function(t) { return !t.consumed; });

    // Enemy spawn chance
    if (!this.gameOver && !this.victory) {
      var livingCount = this.livingEnemyCount();
      if (livingCount < MAX_ENEMIES_PER_FLOOR && Math.random() < 0.05) {
        var newEnemy = Enemy.spawnOneEnemy(this);
        if (newEnemy) {
          this.enemies.push(newEnemy);
        }
      }
    }
  };

  Game.prototype.descend = function() {
    if (this.gameOver || this.victory) return false;
    var tile = this.dungeon.grid[this.player.y][this.player.x];
    if (tile === Dungeon.TILE.STAIRS_DOWN) {
      if (this.floorNum >= MAX_FLOOR) {
        this.victory = true;
        this.ui.addMessage('ダンジョンをクリアした！', 'levelup');
        this.ui.showVictory(this.player);
        return true;
      }
      this.floorNum++;
      this.newFloor();
      this.ui.addMessage(this.floorNum + 'Fに降りた', 'system');
      return true;
    }
    return false;
  };

  Game.prototype.isOnStairs = function() {
    return this.dungeon.grid[this.player.y][this.player.x] === Dungeon.TILE.STAIRS_DOWN;
  };

  Game.prototype.livingEnemyCount = function() {
    var count = 0;
    for (var i = 0; i < this.enemies.length; i++) {
      if (!this.enemies[i].dead) count++;
    }
    return count;
  };

  // --- Throw mechanic ---
  Game.prototype.throwItem = function(item, dx, dy) {
    var player = this.player;
    var ui = this.ui;

    if (player.weapon === item) {
      player.weapon = null;
      player._recalcStats();
    }
    if (player.shield === item) {
      player.shield = null;
      player._recalcStats();
    }
    player.removeFromInventory(item);

    var x = player.x + dx;
    var y = player.y + dy;
    var hitEnemy = null;

    while (x >= 0 && x < this.dungeon.width && y >= 0 && y < this.dungeon.height) {
      if (this.dungeon.grid[y][x] === Dungeon.TILE.WALL) break;

      var enemy = this.getEnemyAt(x, y);
      if (enemy) {
        hitEnemy = enemy;
        break;
      }
      x += dx;
      y += dy;
    }

    if (hitEnemy) {
      if (item.type === 'grass') {
        switch (item.effect) {
          case 'heal':
            hitEnemy.hp = Math.min(hitEnemy.hp + (item.value || 25), hitEnemy.maxHp);
            ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'のHPが回復した', 'attack');
            return true;
          case 'strength':
            var dmg = 2 + Math.floor(Math.random() * 4);
            var died = hitEnemy.takeDamage(dmg);
            ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'に' + dmg + 'ダメージ', 'attack');
            if (died) {
              player.enemiesKilled++;
              ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
              player.gainExp(hitEnemy.exp, ui);
            }
            return true;
          case 'cure_poison':
            var dmg = 5 + Math.floor(Math.random() * 5);
            var died = hitEnemy.takeDamage(dmg);
            ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'に' + dmg + 'ダメージ', 'attack');
            if (died) {
              player.enemiesKilled++;
              ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
              player.gainExp(hitEnemy.exp, ui);
            }
            return true;
        }
      }

      var damage = 2 + Math.floor(Math.random() * 4);
      var died = hitEnemy.takeDamage(damage);
      ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'に' + damage + 'ダメージ', 'attack');
      if (died) {
        player.enemiesKilled++;
        ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
        player.gainExp(hitEnemy.exp, ui);
      }
    } else {
      ui.addMessage(item.getDisplayName() + 'を投げた。何にも当たらなかった', 'system');
    }
    return true;
  };

  // --- Staff use ---
  Game.prototype.useStaff = function(item, dx, dy) {
    var player = this.player;
    var ui = this.ui;

    if (item.uses <= 0) {
      ui.addMessage('杖は使い切った', 'system');
      return false;
    }

    item.uses--;

    // Tunnel staff
    if (item.effect === 'tunnel') {
      var dugCount = 0;
      var tx = player.x + dx;
      var ty = player.y + dy;
      for (var i = 0; i < 10; i++) {
        if (tx < 1 || tx >= this.dungeon.width - 1 || ty < 1 || ty >= this.dungeon.height - 1) break;
        if (this.dungeon.grid[ty][tx] === Dungeon.TILE.WALL) {
          this.dungeon.grid[ty][tx] = Dungeon.TILE.CORRIDOR;
          dugCount++;
        }
        tx += dx;
        ty += dy;
      }
      if (dugCount > 0) {
        ui.addMessage('壁が崩れて通路ができた！', 'system');
      } else {
        ui.addMessage('杖を振ったが何も起きなかった', 'system');
      }
      if (item.uses === 0) {
        ui.addMessage(item.getDisplayName() + 'は使い切った', 'system');
      }
      return true;
    }

    // Find target
    var x = player.x + dx;
    var y = player.y + dy;
    var hitEnemy = null;

    while (x >= 0 && x < this.dungeon.width && y >= 0 && y < this.dungeon.height) {
      if (this.dungeon.grid[y][x] === Dungeon.TILE.WALL) break;
      var enemy = this.getEnemyAt(x, y);
      if (enemy) {
        hitEnemy = enemy;
        break;
      }
      x += dx;
      y += dy;
    }

    if (!hitEnemy) {
      ui.addMessage('杖を振ったが何も当たらなかった', 'system');
      if (item.uses === 0) {
        ui.addMessage(item.getDisplayName() + 'は使い切った', 'system');
      }
      return true;
    }

    switch (item.effect) {
      case 'knockback':
        var pushed = 0;
        var ex = hitEnemy.x;
        var ey = hitEnemy.y;
        for (var i = 0; i < 5; i++) {
          var nx = ex + dx;
          var ny = ey + dy;
          if (nx < 0 || nx >= this.dungeon.width || ny < 0 || ny >= this.dungeon.height) break;
          if (this.dungeon.grid[ny][nx] === Dungeon.TILE.WALL) {
            hitEnemy.takeDamage(5);
            ui.addMessage(hitEnemy.name + 'は壁に叩きつけられた！ 5ダメージ', 'attack');
            break;
          }
          if (this.getEnemyAt(nx, ny)) break;
          ex = nx;
          ey = ny;
          pushed++;
        }
        hitEnemy.moveTo(ex, ey);
        ui.addMessage(hitEnemy.name + 'を吹き飛ばした！', 'attack');
        if (hitEnemy.hp <= 0) {
          hitEnemy.dead = true;
          player.enemiesKilled++;
          ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
          player.gainExp(hitEnemy.exp, ui);
        }
        break;

      case 'swap':
        var oldPx = player.x;
        var oldPy = player.y;
        player.moveTo(hitEnemy.x, hitEnemy.y);
        hitEnemy.moveTo(oldPx, oldPy);
        ui.addMessage(hitEnemy.name + 'と場所を入れ替えた！', 'attack');
        // Update inShop status after swap
        this.inShop = this.isInShop(player.x, player.y);
        // Check if swapping with shopkeeper triggers theft
        this.checkSwapTheft(hitEnemy);
        break;

      case 'paralyze':
        hitEnemy.paralyzed = 10;
        ui.addMessage(hitEnemy.name + 'は金縛りになった！', 'attack');
        break;

      case 'slow':
        hitEnemy.slowed = 15;
        ui.addMessage(hitEnemy.name + 'の足が鈍くなった！', 'attack');
        break;

      case 'lightning':
        var died = hitEnemy.takeDamage(20);
        ui.addMessage('いかずちが' + hitEnemy.name + 'を直撃！ 20ダメージ', 'attack');
        if (died) {
          player.enemiesKilled++;
          ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
          player.gainExp(hitEnemy.exp, ui);
        }
        break;
    }

    if (item.uses === 0) {
      ui.addMessage(item.getDisplayName() + 'は使い切った', 'system');
    }

    return true;
  };

  return Game;
})();