// Shop System - extracted from game.js
// Adds shop-related methods to Game.prototype
(function() {
  'use strict';

  // --- Shop generation ---
  Game.prototype._generateShop = function(playerStartRoom) {
    // Pick a room that isn't the start room
    var candidates = [];
    for (var i = 1; i < this.dungeon.rooms.length; i++) {
      var r = this.dungeon.rooms[i];
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

      var occupied = false;
      for (var j = 0; j < this.items.length; j++) {
        if (this.items[j].x === ix && this.items[j].y === iy) { occupied = true; break; }
      }
      if (occupied) continue;

      var selectedKey = this._pickItemForFloor(this.floorNum);
      var shopItem = new Item(ix, iy, selectedKey);
      shopItem.identified = true;
      shopItem.shopItem = true;
      this.items.push(shopItem);
      this.shopItems.add(shopItem);
      placed++;
    }

    // Place shopkeeper in the room
    var skx = Math.floor(this.shopRoom.x + this.shopRoom.w / 2);
    var sky = this.shopRoom.y + 1;
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

    Sound.play('thief');
    this.ui.addMessage('泥棒だ！！！ 許さんぞ！！！', 'damage');

    var sk = this.getShopkeeper();
    if (sk) {
      sk.isShopkeeper = false;
      sk.doubleSpeed = true;
      sk.immuneToStatus = true;
      this.ui.addMessage('店主が怒って追いかけてきた！', 'enemy_special');
    }

    // Spawn 2-3 guard dogs near stairs
    var stairsPos = this.dungeon.stairs;
    var guardData = ENEMY_DATA.guard_dog;
    var guardCount = 2 + Math.floor(Math.random() * 2);
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

  // Pick up shop item - add to inventory + add debt
  Game.prototype._pickUpShopItem = function(item) {
    if (!this.player.canPickUp()) {
      this.ui.addMessage('持ち物がいっぱいだ', 'system');
      return false;
    }
    var price = item.getBuyPrice();
    this.player.pickUp(item);
    this.removeItem(item);
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

  // Confirm sell
  Game.prototype.confirmSell = function(accept) {
    if (!this.sellConfirmMode) return;
    var item = this.sellConfirmMode.item;
    var price = this.sellConfirmMode.price;
    this.sellConfirmMode = null;

    if (accept) {
      this.removeItem(item);
      this.player.gold += price;
      this.ui.addMessage(item.getDisplayName() + 'を' + price + 'ギタンで売った', 'pickup');
    } else {
      this.ui.addMessage('売るのをやめた', 'system');
    }
  };

  // Check if place-swap with shopkeeper should trigger theft
  Game.prototype.checkSwapTheft = function(enemy) {
    if (enemy.isShopkeeper && !this.shopkeeperHostile) {
      if (!this.isInShop(this.player.x, this.player.y)) {
        this.ui.addMessage('店主と場所を入れ替えた！', 'system');
        if (this.shopDebt > 0) {
          this._triggerTheft();
        }
      }
    }
  };

})();
