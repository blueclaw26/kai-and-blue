// Game State Management
var Game = (function() {
  'use strict';

  var MAX_FLOOR = 99;
  var MAX_ENEMIES_PER_FLOOR = 15;

  function Game() {
    this.dungeon = null;
    this.player = null;
    this.enemies = [];
    this.items = [];
    this.traps = [];
    this.floorNum = 1;
    this.explored = [];
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
    // Room-based FOV arrays
    this.visible = null;
    // Dash movement state
    this.dashDirection = null;
    this.dashing = false;
    // Pot interaction modes
    this.potPutMode = null;  // { pot: Item } when selecting item to put in
    this.potTakeMode = null; // { pot: Item } when selecting item to take out
    // Throw animation state
    this.throwAnimating = false;
    // Monster house
    this.monsterHouseRoom = null;
    this.monsterHouseTriggered = false;
    // Sanctuary tiles (set of "x,y" strings)
    this.sanctuaryTiles = new Set();
    // Extinct enemy types (persists across floors for this run)
    this.extinctEnemies = new Set();
    // Extinction selection mode
    this.extinctionMode = false;
    this.extinctionCandidates = [];
    this.extinctionSelection = 0;
  }

  Game.prototype.init = function(ui) {
    this.ui = ui;
    // Initialize identification system
    initIdentification();
    // Reset per-run state
    this.extinctEnemies = new Set();
    this.newFloor();
    ui.addMessage('最果ての間へ... 冒険が始まる', 'system');
  };

  // Get room at position (for room-based FOV)
  Game.prototype.getRoomAt = function(x, y) {
    if (!this.dungeon || !this.dungeon.rooms) return null;
    var rooms = this.dungeon.rooms;
    for (var i = 0; i < rooms.length; i++) {
      var r = rooms[i];
      if (x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2) return r;
    }
    return null;
  };

  // Get the room the player is currently in
  Game.prototype.getPlayerRoom = function() {
    return this.getRoomAt(this.player.x, this.player.y);
  };

  // Room-based visibility update (Shiren-style)
  Game.prototype.updateVisibility = function() {
    var player = this.player;
    var dungeon = this.dungeon;

    // Reset visible array
    for (var vy = 0; vy < dungeon.height; vy++) {
      for (var vx = 0; vx < dungeon.width; vx++) {
        this.visible[vy][vx] = false;
      }
    }

    var room = this.getPlayerRoom();

    if (room) {
      // Player is in a room: reveal entire room + 1 tile border
      for (var y = room.y1 - 1; y <= room.y2 + 1; y++) {
        for (var x = room.x1 - 1; x <= room.x2 + 1; x++) {
          if (dungeon.grid[y] && dungeon.grid[y][x] !== undefined) {
            this.visible[y][x] = true;
            this.explored[y][x] = true;
          }
        }
      }
    }

    // Always reveal adjacent tiles (radius 1) - covers corridors and also room doorways
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        var nx = player.x + dx, ny = player.y + dy;
        if (ny >= 0 && ny < dungeon.height && nx >= 0 && nx < dungeon.width) {
          this.visible[ny][nx] = true;
          this.explored[ny][nx] = true;
        }
      }
    }
  };

  // Get visible trap at position
  Game.prototype.getVisibleTrapAt = function(x, y) {
    for (var i = 0; i < this.traps.length; i++) {
      var t = this.traps[i];
      if (!t.consumed && t.visible && t.x === x && t.y === y) return t;
    }
    return null;
  };

  Game.prototype.newFloor = function() {
    this.dungeon = Dungeon.generateFloor(40, 30, this.floorNum);
    this.explored = [];
    // Initialize 2D arrays for visibility
    this.visible = [];
    for (var iy = 0; iy < this.dungeon.height; iy++) {
      this.explored[iy] = [];
      this.visible[iy] = [];
      for (var ix = 0; ix < this.dungeon.width; ix++) {
        this.explored[iy][ix] = false;
        this.visible[iy][ix] = false;
      }
    }
    this.shopRoom = null;
    this.shopkeeperHostile = false;
    this.shopItems = new Set();
    this.shopDebt = 0;
    this.inShop = false;
    this.sellConfirmMode = null;
    this.mapRevealed = false;
    this.monsterHouseRoom = null;
    this.monsterHouseTriggered = false;
    this.sanctuaryTiles = new Set();

    if (!this.player) {
      this.player = new Player(this.dungeon.playerStart.x, this.dungeon.playerStart.y);
    } else {
      this.player.moveTo(this.dungeon.playerStart.x, this.dungeon.playerStart.y);
    }
    this.player.floor = this.floorNum;

    var startRoom = this.dungeon.rooms[0];
    this.enemies = Enemy.spawnForFloor(this.dungeon, this.floorNum, startRoom, this.extinctEnemies);
    this.items = Item.spawnForFloor(this.dungeon, this.floorNum, startRoom);
    this.traps = Trap.spawnForFloor(this.dungeon, this.floorNum, this.items);

    // Monster House setup
    if (this.dungeon.monsterHouseRoom) {
      this._generateMonsterHouse(this.dungeon.monsterHouseRoom);
    }

    // Special floor messages
    if (this.dungeon.floorType === 'big_room') {
      this.ui.addMessage('大部屋だ！', 'enemy_special');
    } else if (this.dungeon.floorType === 'maze') {
      this.ui.addMessage('迷路フロアだ...', 'enemy_special');
    }

    // World-building floor entry messages
    if (this.floorNum >= 75) {
      this.ui.addMessage('...空気が殺意に満ちている', 'damage');
    } else if (this.floorNum >= 50) {
      this.ui.addMessage('闇が深くなっていく...', 'enemy_special');
    } else if (this.floorNum >= 30) {
      this.ui.addMessage('ここからが本当の戦いだ...', 'system');
    }

    // Shop generation: 20% chance per floor (not floor 1, not special floors)
    if (this.floorNum > 1 && this.dungeon.floorType === 'normal' && Math.random() < 0.20) {
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

  // --- Monster House generation ---
  Game.prototype._generateMonsterHouse = function(room) {
    this.monsterHouseRoom = room;

    // Place 8-15 enemies in the room (sleeping)
    var mhEnemyCount = 8 + Math.floor(Math.random() * 8);
    var placed = 0;
    var attempts = 0;

    while (placed < mhEnemyCount && attempts < 100) {
      attempts++;
      var ex = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      var ey = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

      if (this.dungeon.grid[ey][ex] === Dungeon.TILE.STAIRS_DOWN) continue;

      var occupied = false;
      for (var j = 0; j < this.enemies.length; j++) {
        if (this.enemies[j].x === ex && this.enemies[j].y === ey) { occupied = true; break; }
      }
      if (occupied) continue;

      var enemyId = this._pickEnemyForFloor(this.floorNum);
      var template = ENEMY_DATA[enemyId];
      if (!template) continue;

      var enemy = new Enemy(ex, ey, template, enemyId);
      enemy.sleeping = true;
      this.enemies.push(enemy);
      placed++;
    }

    // Place 5-10 items in the room
    var mhItemCount = 5 + Math.floor(Math.random() * 6);
    var itemPlaced = 0;
    attempts = 0;

    while (itemPlaced < mhItemCount && attempts < 100) {
      attempts++;
      var ix = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      var iy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));

      if (this.dungeon.grid[iy][ix] === Dungeon.TILE.STAIRS_DOWN) continue;

      var itemOccupied = false;
      for (var k = 0; k < this.items.length; k++) {
        if (this.items[k].x === ix && this.items[k].y === iy) { itemOccupied = true; break; }
      }
      if (itemOccupied) continue;

      var selectedKey = this._pickItemForFloor(this.floorNum);
      var item = new Item(ix, iy, selectedKey);
      this.items.push(item);
      itemPlaced++;
    }
  };

  // Pick enemy weighted by floor table (reusable)
  Game.prototype._pickEnemyForFloor = function(floorNum) {
    var table = FLOOR_TABLE.enemies;
    var eligible = [];
    var totalWeight = 0;
    var self = this;

    for (var i = 0; i < table.length; i++) {
      var entry = table[i];
      if (floorNum >= entry[0] && floorNum <= entry[1]) {
        // Skip extinct enemies
        if (self.extinctEnemies && self.extinctEnemies.has(entry[2])) continue;
        eligible.push({ id: entry[2], weight: entry[3] });
        totalWeight += entry[3];
      }
    }

    if (eligible.length === 0) return 'mamel';

    var roll = Math.random() * totalWeight;
    var cumulative = 0;
    for (var j = 0; j < eligible.length; j++) {
      cumulative += eligible[j].weight;
      if (roll < cumulative) return eligible[j].id;
    }
    return eligible[eligible.length - 1].id;
  };

  // Trigger monster house - all sleeping enemies wake up
  Game.prototype.triggerMonsterHouse = function() {
    if (this.monsterHouseTriggered) return;
    this.monsterHouseTriggered = true;

    Sound.play('thief');
    this.ui.addMessage('モンスターハウスだ！ 敵が一斉に目を覚ました！', 'damage');
    // Switch to danger BGM
    if (typeof Sound !== 'undefined' && Sound.bgm) Sound.bgm.switchTrack('danger');

    // Wake all sleeping enemies in the room
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.dead && e.sleeping) {
        e.sleeping = false;
      }
    }
  };

  // Check if player is in monster house room
  Game.prototype.isInMonsterHouse = function(x, y) {
    if (!this.monsterHouseRoom) return false;
    var r = this.monsterHouseRoom;
    return x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2;
  };

  // Check if position is a sanctuary tile
  Game.prototype.isSanctuaryTile = function(x, y) {
    return this.sanctuaryTiles.has(x + ',' + y);
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

    Sound.play('thief');
    this.ui.addMessage('泥棒だ！！！ 許さんぞ！！！', 'damage');

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
    Sound.play('pickup');
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
      Sound.play('shop');
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
    if (this.player.bracelet === item) {
      this.player.bracelet = null;
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
      // Attacking a sleeping enemy wakes all monster house enemies
      if (enemy.sleeping && !this.monsterHouseTriggered) {
        this.triggerMonsterHouse();
      }
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
      var nowInShop = this.isInShop(newX, newY);
      if (nowInShop && !this.inShop && !this.shopkeeperHostile) {
        // Entering shop
        if (typeof Sound !== 'undefined' && Sound.bgm) Sound.bgm.switchTrack('shop');
      } else if (!nowInShop && this.inShop && !this.shopkeeperHostile) {
        // Leaving shop
        if (typeof Sound !== 'undefined' && Sound.bgm) {
          Sound.bgm.switchTrack(this.floorNum >= 50 ? 'danger' : 'dungeon');
        }
      }
      this.inShop = nowInShop;

      // Check for trap
      this.checkPlayerTrap();

      // Check for monster house trigger
      if (!this.monsterHouseTriggered && this.isInMonsterHouse(newX, newY)) {
        this.triggerMonsterHouse();
      }

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

    // Float bracelet: don't trigger traps
    if (this.player.bracelet && this.player.bracelet.effect === 'float') {
      this.ui.addMessage('浮遊の腕輪の効果で罠を回避した！', 'system');
      return;
    }

    Sound.play('trap');
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
        var hasBlastResist = (player.shield && player.shield.seals && player.shield.seals.indexOf('blast_resist') !== -1) ||
                             (player.shield && player.shield.special === 'blast_resist');
        if (hasBlastResist) {
          blastDmg = Math.floor(blastDmg * 0.5);
          ui.addMessage('地雷が爆発した！ [爆]印が爆風を防いだ！ ' + blastDmg + 'ダメージ', 'damage');
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
          ui.addMessage('最果ての間を踏破した！ あなたは真の風来人だ！', 'levelup');
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
          var hasRustProof = shield.seals && shield.seals.indexOf('rust_proof') !== -1;
          if (hasRustProof) {
            ui.addMessage('サビの罠を踏んだ！ しかし[金]印が盾を守った！', 'system');
          } else {
            if (shield.plus > 0) {
              shield.plus--;
            } else {
              shield.defense = Math.max(0, shield.defense - 1);
            }
            player._recalcStats();
            ui.addMessage('盾が錆びた！ 防御力が1下がった', 'damage');
          }
        } else {
          ui.addMessage('サビの罠を踏んだ！ しかし盾を装備していない', 'system');
        }
        break;

      case 'arrow_wood':
      case 'arrow_iron':
        var isIron = trap.effect === 'arrow_iron';
        var arrowName = isIron ? '鉄の矢' : '木の矢';
        var arrowDmg = isIron ? 7 : 3;
        var arrowDataKey = isIron ? 'arrow_iron' : 'arrow_wood';
        ui.addMessage(arrowName + 'が飛んできた！ ' + arrowDmg + 'ダメージ', 'damage');
        if (!player.godMode) player.hp -= arrowDmg;
        Sound.play('arrow');
        // Drop arrow on player's tile
        var droppedArrow = new Item(player.x, player.y, arrowDataKey);
        droppedArrow.count = 1;
        this.items.push(droppedArrow);
        ui.addMessage('足元に' + arrowName + 'が落ちた', 'system');
        this._checkPlayerDeath();
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
      Sound.play('gameover');
      // Stop BGM on death
      if (typeof Sound !== 'undefined' && Sound.bgm) Sound.bgm.stop();
      // Floor-specific game over messages
      var deathMsg;
      if (this.floorNum <= 10) {
        deathMsg = '序盤で倒れてしまった... まだ先は長い';
      } else if (this.floorNum <= 30) {
        deathMsg = '中層で力尽きた... あと少しだったのに';
      } else if (this.floorNum <= 60) {
        deathMsg = '深層で散った... 実力は確かだった';
      } else {
        deathMsg = '最果てを目前にして... 無念';
      }
      this.ui.addMessage(deathMsg, 'damage');
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

    // Apply seal effects from equipped weapon
    if (player.weapon) {
      var seals = player.weapon.seals || [];
      var sealMultiplier = 1;
      var sealMessages = [];

      for (var si = 0; si < seals.length; si++) {
        switch (seals[si]) {
          case 'dragon':
            if (DRAGON_TYPE_ENEMIES[enemy.enemyId]) {
              sealMultiplier *= 1.5;
              sealMessages.push('竜特効！');
            }
            break;
          case 'ghost':
            if (GHOST_TYPE_ENEMIES[enemy.enemyId]) {
              sealMultiplier *= 1.5;
              sealMessages.push('仏特効！');
            }
            break;
          case 'drain':
            if (enemy.special) {
              sealMultiplier *= 1.5;
              sealMessages.push('吸特効！');
            }
            break;
          case 'crit':
            if (Math.random() < 0.25) {
              sealMultiplier *= 1.5;
              sealMessages.push('会心の一撃！');
            }
            break;
        }
      }

      // Legacy special property support (for items without seals)
      if (seals.length === 0 && player.weapon.special) {
        switch (player.weapon.special) {
          case 'drain':
            if (enemy.special) sealMultiplier = 1.5;
            break;
          case 'ghost':
            if (GHOST_TYPE_ENEMIES[enemy.enemyId]) sealMultiplier = 1.5;
            break;
          case 'dragon':
            if (DRAGON_TYPE_ENEMIES[enemy.enemyId]) sealMultiplier = 1.5;
            break;
        }
        if (sealMultiplier > 1) sealMessages.push('特効！');
      }

      if (sealMultiplier > 1) {
        damage = Math.floor(damage * sealMultiplier);
        for (var mi = 0; mi < sealMessages.length; mi++) {
          this.ui.addMessage(sealMessages[mi], 'attack');
        }
      }
    }

    var died = enemy.takeDamage(damage);

    Sound.play('attack');
    this.ui.addMessage(enemy.name + 'に ' + damage + ' ダメージを与えた！', 'attack');

    if (died) {
      this.player.enemiesKilled++;
      Sound.play('kill');
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

    // Critical hit check
    var isCritical = false;
    if (enemy.special === 'critical' && Math.random() < 0.25) {
      isCritical = true;
    }

    var rawDmg = enemy.attack - player.defense + Math.floor(Math.random() * 3) - 1;
    var damage = Math.max(1, rawDmg);

    if (isCritical) {
      damage *= 2;
      this.ui.addMessage(enemy.name + 'の痛恨の一撃！ ' + damage + 'ダメージ！', 'enemy_special');
    } else {
      this.ui.addMessage(enemy.name + 'の攻撃！ ' + damage + 'ダメージを受けた', 'damage');
    }

    // Apply shield seal effects
    if (player.shield && player.shield.seals) {
      var shieldSeals = player.shield.seals;
      for (var ssi = 0; ssi < shieldSeals.length; ssi++) {
        if (shieldSeals[ssi] === 'counter' && !enemy.dead) {
          var counterDmg = Math.max(1, Math.floor(damage * 0.3));
          var counterDied = enemy.takeDamage(counterDmg);
          this.ui.addMessage('[返]印の反撃！ ' + enemy.name + 'に' + counterDmg + 'ダメージ', 'attack');
          if (counterDied) {
            player.enemiesKilled++;
            this.ui.addMessage(enemy.name + 'を倒した！ 経験値' + enemy.exp + '獲得', 'attack');
            player.gainExp(enemy.exp, this.ui);
          }
        }
      }
    }

    if (player.godMode) damage = 0;
    if (damage > 0) Sound.play('damage');
    player.hp -= damage;

    // --- New enemy specials on attack ---

    // Gamara: steal gold
    if (enemy.special === 'steal_gold' && !player.godMode && damage > 0) {
      var stealAmount = Math.min(player.gold, 10 + Math.floor(Math.random() * 41));
      if (stealAmount > 0) {
        player.gold -= stealAmount;
        this.ui.addMessage('ガマラに' + stealAmount + 'ギタンを盗まれた！', 'enemy_special');
        enemy._fleeing = true; // flag for flee AI
      }
    }

    // Nusutto-todo: steal item
    if (enemy.special === 'steal_item' && !player.godMode) {
      var nonEquipped = [];
      for (var si = 0; si < player.inventory.length; si++) {
        var sItem = player.inventory[si];
        if (sItem !== player.weapon && sItem !== player.shield && sItem !== player.bracelet) {
          nonEquipped.push(si);
        }
      }
      if (nonEquipped.length > 0 && Math.random() < 0.5) {
        var stolenIdx = nonEquipped[Math.floor(Math.random() * nonEquipped.length)];
        var stolenItem = player.inventory[stolenIdx];
        player.inventory.splice(stolenIdx, 1);
        this.ui.addMessage('ぬすっトドに' + stolenItem.getDisplayName() + 'を盗まれた！', 'enemy_special');
        // Warp away
        var warpRoom = this.dungeon.rooms[Math.floor(Math.random() * this.dungeon.rooms.length)];
        var wx = warpRoom.x + 1 + Math.floor(Math.random() * (warpRoom.w - 2));
        var wy = warpRoom.y + 1 + Math.floor(Math.random() * (warpRoom.h - 2));
        enemy.moveTo(wx, wy);
        this.ui.addMessage('ぬすっトドはどこかへ消えた！', 'enemy_special');
      }
    }

    // Kengo: disarm
    if (enemy.special === 'disarm' && !player.godMode && Math.random() < 0.2) {
      if (player.weapon && Math.random() < 0.5) {
        var disarmedItem = player.weapon;
        player.weapon = null;
        player._recalcStats();
        player.removeFromInventory(disarmedItem);
        // Place behind player
        var behindX = player.x - (enemy.x - player.x);
        var behindY = player.y - (enemy.y - player.y);
        if (behindX >= 0 && behindX < this.dungeon.width && behindY >= 0 && behindY < this.dungeon.height &&
            this.dungeon.grid[behindY][behindX] !== Dungeon.TILE.WALL) {
          disarmedItem.x = behindX;
          disarmedItem.y = behindY;
        } else {
          disarmedItem.x = player.x;
          disarmedItem.y = player.y;
        }
        this.items.push(disarmedItem);
        this.ui.addMessage('ケンゴウに武器を弾き飛ばされた！', 'enemy_special');
      } else if (player.shield) {
        var disarmedShield = player.shield;
        player.shield = null;
        player._recalcStats();
        player.removeFromInventory(disarmedShield);
        var behindX2 = player.x - (enemy.x - player.x);
        var behindY2 = player.y - (enemy.y - player.y);
        if (behindX2 >= 0 && behindX2 < this.dungeon.width && behindY2 >= 0 && behindY2 < this.dungeon.height &&
            this.dungeon.grid[behindY2][behindX2] !== Dungeon.TILE.WALL) {
          disarmedShield.x = behindX2;
          disarmedShield.y = behindY2;
        } else {
          disarmedShield.x = player.x;
          disarmedShield.y = player.y;
        }
        this.items.push(disarmedShield);
        this.ui.addMessage('ケンゴウに盾を弾き飛ばされた！', 'enemy_special');
      }
    }

    // Midoro: rust equipment
    if (enemy.special === 'rust_equipment' && !player.godMode && player.shield) {
      var rustShield2 = player.shield;
      var hasRustProofMidoro = rustShield2.seals && rustShield2.seals.indexOf('rust_proof') !== -1;
      if (hasRustProofMidoro) {
        this.ui.addMessage('ミドロの攻撃！ しかし[金]印が盾を守った！', 'system');
      } else {
        if (rustShield2.plus > 0) {
          rustShield2.plus--;
        } else {
          rustShield2.defense = Math.max(0, rustShield2.defense - 1);
        }
        player._recalcStats();
        this.ui.addMessage('ミドロの攻撃で盾が錆びた！ 防御力が下がった', 'enemy_special');
      }
    }

    // Counter shield (legacy special property check)
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
      this._checkPlayerDeath();
    }
  };

  Game.prototype.processEnemyTurns = function() {
    if (this.gameOver || this.victory) return;

    this.player.tickBuffs();
    this.player.tickSleep(this.ui);

    for (var i = 0; i < this.enemies.length; i++) {
      if (!this.enemies[i].dead) {
        // Sleeping enemies don't act
        if (this.enemies[i].sleeping) continue;
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
      // If player has shop debt and tries to descend, trigger theft
      if (this.shopDebt > 0 && !this.shopkeeperHostile) {
        this._triggerTheft();
        return true; // consume turn but don't descend
      }
      if (this.floorNum >= MAX_FLOOR) {
        this.victory = true;
        if (typeof Sound !== 'undefined' && Sound.bgm) Sound.bgm.stop();
        Sound.play('victory');
        this.ui.addMessage('最果ての間を踏破した！ あなたは真の風来人だ！', 'levelup');
        this.ui.showVictory(this.player);
        return true;
      }
      this.floorNum++;
      this.newFloor();
      Sound.play('stairs');
      this.ui.addMessage('地下' + this.floorNum + 'の間に降り立った...', 'system');
      // Start danger BGM on deep floors
      if (typeof Sound !== 'undefined' && Sound.bgm) {
        if (this.floorNum >= 50) {
          Sound.bgm.switchTrack('danger');
        } else {
          Sound.bgm.switchTrack('dungeon');
        }
      }
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

  // --- Arrow shooting ---
  Game.prototype.shootArrow = function(item, dx, dy) {
    var player = this.player;
    var ui = this.ui;
    var self = this;

    // Decrement arrow count
    item.count = (item.count || 1) - 1;
    if (item.count <= 0) {
      player.removeFromInventory(item);
    }

    Sound.play('arrow');

    // Trace arrow path
    var arrowPath = [];
    var x = player.x + dx;
    var y = player.y + dy;
    var hitEnemy = null;

    while (x >= 0 && x < this.dungeon.width && y >= 0 && y < this.dungeon.height) {
      if (this.dungeon.grid[y][x] === Dungeon.TILE.WALL) break;
      var enemy = this.getEnemyAt(x, y);
      if (enemy) {
        hitEnemy = enemy;
        arrowPath.push({ x: x, y: y });
        break;
      }
      arrowPath.push({ x: x, y: y });
      x += dx;
      y += dy;
    }

    // Animate then apply
    var arrowItem = { char: ')', color: item.color || '#a1887f' };
    this._animateThrow(arrowItem, arrowPath, function() {
      if (hitEnemy) {
        var arrowDmg = Math.max(1, (item.damage || 3) - Math.floor(hitEnemy.defense / 2));
        var died = hitEnemy.takeDamage(arrowDmg);
        ui.addMessage(item.name + 'が' + hitEnemy.name + 'に命中！ ' + arrowDmg + 'ダメージ', 'attack');
        if (died) {
          Sound.play('kill');
          player.enemiesKilled++;
          ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
          player.gainExp(hitEnemy.exp, ui);
        }
      } else {
        // Miss: 50% chance arrow lands on the ground
        var lastPos = arrowPath.length > 0 ? arrowPath[arrowPath.length - 1] : null;
        if (lastPos && Math.random() < 0.5) {
          var droppedArrow = new Item(lastPos.x, lastPos.y, item.dataKey);
          droppedArrow.count = 1;
          self.items.push(droppedArrow);
          ui.addMessage(item.name + 'は外れて地面に落ちた', 'system');
        } else {
          ui.addMessage(item.name + 'は外れた', 'system');
        }
      }
    });

    return true;
  };

  // --- Throw mechanic (improved) ---
  Game.prototype.throwItem = function(item, dx, dy) {
    var player = this.player;
    var ui = this.ui;
    var self = this;

    if (player.weapon === item) {
      player.weapon = null;
      player._recalcStats();
    }
    if (player.shield === item) {
      player.shield = null;
      player._recalcStats();
    }
    if (player.bracelet === item) {
      player.bracelet = null;
      player._recalcStats();
    }
    player.removeFromInventory(item);

    // Collect throw path for animation
    var throwPath = [];
    var x = player.x + dx;
    var y = player.y + dy;
    var hitEnemy = null;

    while (x >= 0 && x < this.dungeon.width && y >= 0 && y < this.dungeon.height) {
      if (this.dungeon.grid[y][x] === Dungeon.TILE.WALL) break;

      var enemy = this.getEnemyAt(x, y);
      if (enemy) {
        hitEnemy = enemy;
        throwPath.push({ x: x, y: y });
        break;
      }
      throwPath.push({ x: x, y: y });
      x += dx;
      y += dy;
    }

    // Animate throw then apply effect
    this._animateThrow(item, throwPath, function() {
      self._applyThrowEffect(item, hitEnemy, ui, player);
    });

    return true;
  };

  // Throw animation: item char moves tile by tile
  Game.prototype._animateThrow = function(item, path, callback) {
    if (path.length === 0) {
      callback();
      return;
    }

    var self = this;
    var renderer = window._renderer;
    var idx = 0;

    // Create a temporary overlay element for the thrown item
    var canvas = document.getElementById('game-canvas');
    var overlay = document.createElement('canvas');
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    overlay.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
    canvas.parentElement.style.position = 'relative';
    canvas.parentElement.appendChild(overlay);
    var octx = overlay.getContext('2d');
    octx.font = 'bold 16px monospace';
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';

    var TILE_SIZE = 24;
    var viewW = renderer.viewW;
    var viewH = renderer.viewH;
    var player = this.player;
    var dungeon = this.dungeon;
    var camX = player.x - Math.floor(viewW / 2);
    var camY = player.y - Math.floor(viewH / 2);
    camX = Math.max(0, Math.min(camX, dungeon.width - viewW));
    camY = Math.max(0, Math.min(camY, dungeon.height - viewH));

    function step() {
      if (idx >= path.length) {
        overlay.remove();
        callback();
        return;
      }
      octx.clearRect(0, 0, overlay.width, overlay.height);
      var p = path[idx];
      var sx = (p.x - camX) * TILE_SIZE + TILE_SIZE / 2;
      var sy = (p.y - camY) * TILE_SIZE + TILE_SIZE / 2;
      octx.fillStyle = item.color || '#fff';
      octx.fillText(item.char, sx, sy);
      idx++;
      setTimeout(step, 50);
    }
    step();
  };

  // Apply throw effect after animation
  Game.prototype._applyThrowEffect = function(item, hitEnemy, ui, player) {
    if (hitEnemy) {
      // --- Grass thrown at enemy: apply effect ---
      if (item.type === 'grass') {
        switch (item.effect) {
          case 'heal':
            hitEnemy.hp = Math.min(hitEnemy.hp + (item.value || 25), hitEnemy.maxHp);
            ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'のHPが回復した', 'attack');
            return;
          case 'strength':
            // Increases enemy attack (bad for player!)
            hitEnemy.attack += (item.value || 1);
            ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'の攻撃力が上がった！', 'enemy_special');
            return;
          case 'cure_poison':
            // Extra damage to ghost-type enemies
            var dmg = (hitEnemy.special === 'wallpass') ? 30 : 5;
            var died = hitEnemy.takeDamage(dmg);
            ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'に' + dmg + 'ダメージ', 'attack');
            if (died) {
              player.enemiesKilled++;
              ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
              player.gainExp(hitEnemy.exp, ui);
            }
            return;
        }
      }

      // --- Pot thrown: pot breaks ---
      if (item.type === 'pot') {
        ui.addMessage(item.getDisplayName() + 'を投げた。壺が割れた！', 'attack');
        // 回復の壺: heals player
        if (item.effect === 'heal') {
          var healAmount = 100;
          player.hp = Math.min(player.hp + healAmount, player.maxHp);
          ui.addMessage('回復の壺の効果でHPが回復した！', 'heal');
        }
        // Scatter contents on floor near enemy
        if (item.contents && item.contents.length > 0) {
          for (var ci = 0; ci < item.contents.length; ci++) {
            var content = item.contents[ci];
            content.x = hitEnemy.x;
            content.y = hitEnemy.y;
            this.items.push(content);
          }
          ui.addMessage('壺の中身が散らばった', 'system');
        }
        // Also deal 2 damage
        var potDied = hitEnemy.takeDamage(2);
        if (potDied) {
          player.enemiesKilled++;
          ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
          player.gainExp(hitEnemy.exp, ui);
        }
        return;
      }

      // --- Gold thrown: damage = amount / 10 ---
      if (item.isGold || item.type === 'gold') {
        var goldDmg = Math.max(1, Math.floor((item.goldAmount || 0) / 10));
        var goldDied = hitEnemy.takeDamage(goldDmg);
        ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'に' + goldDmg + 'ダメージ', 'attack');
        if (goldDied) {
          player.enemiesKilled++;
          ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
          player.gainExp(hitEnemy.exp, ui);
        }
        return;
      }

      // --- Default: 2 damage for food, scroll, staff, etc. ---
      var damage = 2;
      var died = hitEnemy.takeDamage(damage);
      ui.addMessage(item.getDisplayName() + 'を投げた。' + hitEnemy.name + 'に' + damage + 'ダメージ', 'attack');
      if (died) {
        player.enemiesKilled++;
        ui.addMessage(hitEnemy.name + 'を倒した！ 経験値' + hitEnemy.exp + '獲得', 'attack');
        player.gainExp(hitEnemy.exp, ui);
      }
    } else {
      // Pot thrown at nothing: still breaks
      if (item.type === 'pot') {
        ui.addMessage(item.getDisplayName() + 'を投げた。壺が割れた！', 'system');
        if (item.effect === 'heal') {
          var healAmt = 100;
          player.hp = Math.min(player.hp + healAmt, player.maxHp);
          ui.addMessage('回復の壺の効果でHPが回復した！', 'heal');
        }
      } else {
        ui.addMessage(item.getDisplayName() + 'を投げた。何にも当たらなかった', 'system');
      }
    }
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
        if (hitEnemy.immuneToStatus) {
          ui.addMessage(hitEnemy.name + 'には効かなかった！', 'system');
        } else {
          hitEnemy.paralyzed = 10;
          ui.addMessage(hitEnemy.name + 'は金縛りになった！', 'attack');
        }
        break;

      case 'slow':
        if (hitEnemy.immuneToStatus) {
          ui.addMessage(hitEnemy.name + 'には効かなかった！', 'system');
        } else {
          hitEnemy.slowed = 15;
          ui.addMessage(hitEnemy.name + 'の足が鈍くなった！', 'attack');
        }
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

  // --- Pot interaction ---
  Game.prototype.putItemInPot = function(pot, item) {
    var ui = this.ui;
    var player = this.player;

    if (!pot.contents) pot.contents = [];
    if (pot.contents.length >= pot.capacity) {
      ui.addMessage('壺がいっぱいだ', 'system');
      return false;
    }

    // Can't put pot in pot
    if (item.type === 'pot') {
      ui.addMessage('壺に壺は入れられない', 'system');
      return false;
    }

    // Can't put equipped items
    if (player.weapon === item || player.shield === item) {
      ui.addMessage('装備中のアイテムは入れられない', 'system');
      return false;
    }

    player.removeFromInventory(item);
    pot.contents.push(item);

    // Apply pot effect
    switch (pot.effect) {
      case 'identify':
        if (!item.identified) {
          var fakeName = item.getDisplayName();
          item.identify();
          ui.addMessage(item.getRealDisplayName() + 'だと判明した！', 'pickup');
        } else {
          ui.addMessage(item.getDisplayName() + 'を入れた', 'system');
        }
        break;
      case 'synthesis':
        // Synthesis: if 2+ weapons or shields, merge
        this._trySynthesis(pot, ui);
        break;
      case 'none':
        // ただの壺: items go in but can't come out
        ui.addMessage(item.getDisplayName() + 'を入れた', 'system');
        break;
      default:
        ui.addMessage(item.getDisplayName() + 'を入れた', 'system');
        break;
    }

    return true;
  };

  Game.prototype._trySynthesis = function(pot, ui) {
    if (!pot.contents || pot.contents.length < 2) return;

    // Find first weapon and first shield as bases
    var baseWeapon = null;
    var baseShield = null;
    for (var i = 0; i < pot.contents.length; i++) {
      if (pot.contents[i].type === 'weapon' && !baseWeapon) baseWeapon = pot.contents[i];
      if (pot.contents[i].type === 'shield' && !baseShield) baseShield = pot.contents[i];
    }

    // Synthesize weapons
    if (baseWeapon) {
      var merged = false;
      for (var w = pot.contents.length - 1; w >= 0; w--) {
        var item = pot.contents[w];
        if (item === baseWeapon) continue;
        if (item.type !== 'weapon') continue;

        // Absorb plus value
        baseWeapon.plus = (baseWeapon.plus || 0) + (item.plus || 0);

        // Transfer seals if base has room
        if (!baseWeapon.seals) baseWeapon.seals = [];
        var maxSeals = baseWeapon.slots || 3;
        if (item.seals) {
          for (var si = 0; si < item.seals.length; si++) {
            if (baseWeapon.seals.length >= maxSeals) break;
            // Don't add duplicate seals
            if (baseWeapon.seals.indexOf(item.seals[si]) === -1) {
              baseWeapon.seals.push(item.seals[si]);
            }
          }
        }

        // Remove merged item from pot
        pot.contents.splice(w, 1);
        merged = true;
      }
      if (merged) {
        ui.addMessage('合成成功！ ' + baseWeapon.getDisplayName(), 'heal');
      }
    }

    // Synthesize shields
    if (baseShield) {
      var mergedS = false;
      for (var s = pot.contents.length - 1; s >= 0; s--) {
        var sItem = pot.contents[s];
        if (sItem === baseShield) continue;
        if (sItem.type !== 'shield') continue;

        baseShield.plus = (baseShield.plus || 0) + (sItem.plus || 0);

        if (!baseShield.seals) baseShield.seals = [];
        var maxSSeals = baseShield.slots || 3;
        if (sItem.seals) {
          for (var ssi = 0; ssi < sItem.seals.length; ssi++) {
            if (baseShield.seals.length >= maxSSeals) break;
            if (baseShield.seals.indexOf(sItem.seals[ssi]) === -1) {
              baseShield.seals.push(sItem.seals[ssi]);
            }
          }
        }

        pot.contents.splice(s, 1);
        mergedS = true;
      }
      if (mergedS) {
        ui.addMessage('合成成功！ ' + baseShield.getDisplayName(), 'heal');
      }
    }
  };

  Game.prototype.takeItemFromPot = function(pot, contentIndex) {
    var ui = this.ui;
    var player = this.player;

    if (pot.effect !== 'storage' && pot.effect !== 'synthesis') {
      ui.addMessage('この壺からは取り出せない！', 'system');
      return false;
    }

    if (!pot.contents || pot.contents.length === 0) {
      ui.addMessage('壺は空だ', 'system');
      return false;
    }

    if (!player.canPickUp()) {
      ui.addMessage('持ち物がいっぱいだ', 'system');
      return false;
    }

    var item = pot.contents.splice(contentIndex, 1)[0];
    player.inventory.push(item);
    ui.addMessage(item.getDisplayName() + 'を取り出した', 'pickup');
    return true;
  };

  return Game;
})();