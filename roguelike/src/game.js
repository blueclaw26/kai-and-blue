// Game State Management
var Game = (function() {
  'use strict';

  var MAX_FLOOR = 20;

  function Game() {
    this.dungeon = null;
    this.player = null;
    this.enemies = [];
    this.items = [];
    this.floorNum = 1;
    this.explored = new Set();
    this.ui = null;
    this.gameOver = false;
    this.victory = false;
    this.inventoryOpen = false;
    this.inventorySelection = 0;
  }

  Game.prototype.init = function(ui) {
    this.ui = ui;
    this.newFloor();
    ui.addMessage('ダンジョンに足を踏み入れた...');
  };

  Game.prototype.newFloor = function() {
    this.dungeon = Dungeon.generateFloor(40, 30);
    this.explored = new Set();

    if (!this.player) {
      this.player = new Player(this.dungeon.playerStart.x, this.dungeon.playerStart.y);
    } else {
      this.player.moveTo(this.dungeon.playerStart.x, this.dungeon.playerStart.y);
    }
    this.player.floor = this.floorNum;

    var startRoom = this.dungeon.rooms[0];
    this.enemies = Enemy.spawnForFloor(this.dungeon, this.floorNum, startRoom);
    this.items = Item.spawnForFloor(this.dungeon, this.floorNum, startRoom);
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
  };

  Game.prototype.pickUpItem = function() {
    var item = this.getItemAt(this.player.x, this.player.y);
    if (!item) {
      this.ui.addMessage('足元には何もない');
      return false;
    }
    if (!this.player.canPickUp()) {
      this.ui.addMessage('持ち物がいっぱいだ');
      return false;
    }
    this.player.pickUp(item);
    this.removeItem(item);
    this.ui.addMessage(item.name + 'を拾った');
    return true;
  };

  Game.prototype.dropItem = function(item) {
    if (this.getItemAt(this.player.x, this.player.y)) {
      this.ui.addMessage('ここには既にアイテムがある');
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
    this.ui.addMessage(item.name + 'を足元に置いた');
    return true;
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

  Game.prototype.movePlayer = function(dx, dy) {
    if (this.gameOver || this.victory) return false;

    var newX = this.player.x + dx;
    var newY = this.player.y + dy;

    var enemy = this.getEnemyAt(newX, newY);
    if (enemy) {
      this.playerAttack(enemy);
      return true;
    }

    if (this.player.canMoveTo(newX, newY, this.dungeon)) {
      this.player.moveTo(newX, newY);
      var item = this.getItemAt(newX, newY);
      if (item) {
        this.ui.addMessage('足元に' + item.name + 'がある（gキーで拾う）');
      }
      return true;
    }
    return false;
  };

  Game.prototype.playerAttack = function(enemy) {
    var rawDmg = this.player.attack - enemy.defense + Math.floor(Math.random() * 3) - 1;
    var damage = Math.max(1, rawDmg);
    var died = enemy.takeDamage(damage);

    this.ui.addMessage(enemy.name + 'に ' + damage + ' ダメージを与えた！');

    if (died) {
      this.player.enemiesKilled++;
      this.ui.addMessage(enemy.name + 'を倒した！ 経験値' + enemy.exp + '獲得');
      this.player.gainExp(enemy.exp, this.ui);
    }
  };

  Game.prototype.enemyAttack = function(enemy) {
    var rawDmg = enemy.attack - this.player.defense + Math.floor(Math.random() * 3) - 1;
    var damage = Math.max(1, rawDmg);
    this.player.hp -= damage;

    this.ui.addMessage(enemy.name + 'の攻撃！ ' + damage + 'ダメージを受けた');

    if (this.player.hp <= 0) {
      this.player.hp = 0;
      this.gameOver = true;
      this.ui.addMessage('倒れてしまった... ' + this.floorNum + 'Fで力尽きた');
      this.ui.showGameOver(this.floorNum, this.player.level);
    }
  };

  Game.prototype.processEnemyTurns = function() {
    if (this.gameOver || this.victory) return;

    this.player.tickBuffs();

    for (var i = 0; i < this.enemies.length; i++) {
      if (!this.enemies[i].dead) {
        this.enemies[i].act(this);
      }
      if (this.gameOver) break;
    }

    this.enemies = this.enemies.filter(function(e) { return !e.dead; });
  };

  Game.prototype.descend = function() {
    if (this.gameOver || this.victory) return false;
    var tile = this.dungeon.grid[this.player.y][this.player.x];
    if (tile === Dungeon.TILE.STAIRS_DOWN) {
      // Victory condition: descend from floor 20
      if (this.floorNum >= MAX_FLOOR) {
        this.victory = true;
        this.ui.addMessage('ダンジョンをクリアした！');
        this.ui.showVictory(this.player);
        return true;
      }
      this.floorNum++;
      this.newFloor();
      this.ui.addMessage(this.floorNum + 'Fに降りた');
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

  return Game;
})();
