// Game State Management
var Game = (function() {
  'use strict';

  function Game() {
    this.dungeon = null;
    this.player = null;
    this.floorNum = 1;
    this.explored = new Set();
    this.ui = null;
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
  };

  Game.prototype.movePlayer = function(dx, dy) {
    var newX = this.player.x + dx;
    var newY = this.player.y + dy;

    if (this.player.canMoveTo(newX, newY, this.dungeon)) {
      this.player.moveTo(newX, newY);
      return true;
    }
    return false;
  };

  Game.prototype.descend = function() {
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

  return Game;
})();
