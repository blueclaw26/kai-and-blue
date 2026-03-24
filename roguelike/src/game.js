// Game State Management
var Game = (function() {
  'use strict';

  function Game() {
    this.dungeon = null;
    this.player = null;
    this.enemies = [];
    this.floorNum = 1;
    this.explored = new Set();
    this.ui = null;
    this.gameOver = false;
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

    // Spawn enemies
    var startRoom = this.dungeon.rooms[0];
    this.enemies = Enemy.spawnForFloor(this.dungeon, this.floorNum, startRoom);
  };

  Game.prototype.getEnemyAt = function(x, y) {
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      if (!e.dead && e.x === x && e.y === y) return e;
    }
    return null;
  };

  Game.prototype.movePlayer = function(dx, dy) {
    if (this.gameOver) return false;

    var newX = this.player.x + dx;
    var newY = this.player.y + dy;

    // Check for enemy at target
    var enemy = this.getEnemyAt(newX, newY);
    if (enemy) {
      this.playerAttack(enemy);
      return true; // turn consumed
    }

    if (this.player.canMoveTo(newX, newY, this.dungeon)) {
      this.player.moveTo(newX, newY);
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
    if (this.gameOver) return;

    for (var i = 0; i < this.enemies.length; i++) {
      if (!this.enemies[i].dead) {
        this.enemies[i].act(this);
      }
      if (this.gameOver) break;
    }

    // Remove dead enemies
    this.enemies = this.enemies.filter(function(e) { return !e.dead; });
  };

  Game.prototype.descend = function() {
    if (this.gameOver) return false;
    var tile = this.dungeon.grid[this.player.y][this.player.x];
    if (tile === Dungeon.TILE.STAIRS_DOWN) {
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
