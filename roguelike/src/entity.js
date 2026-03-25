// Base Entity class
var Entity = (function() {
  'use strict';

  function Entity(x, y, char, color, name) {
    this.x = x;
    this.y = y;
    this.char = char;
    this.color = color;
    this.name = name;
  }

  Entity.prototype.moveTo = function(x, y) {
    this.x = x;
    this.y = y;
  };

  Entity.prototype.canMoveTo = function(x, y, dungeon) {
    if (x < 0 || x >= dungeon.width || y < 0 || y >= dungeon.height) return false;
    var tile = dungeon.grid[y][x];
    return tile !== Dungeon.TILE.WALL;
  };

  // Check if a tile is a hazard tile (water/lava)
  Entity.isWaterTile = function(tile) {
    return tile === Dungeon.TILE.WATER;
  };

  Entity.isLavaTile = function(tile) {
    return tile === Dungeon.TILE.LAVA;
  };

  return Entity;
})();
