// Trap System
var TRAP_DATA = {
  landmine:     { name: '地雷',         color: '#f44336', effect: 'explosion' },
  pitfall:      { name: '落とし穴',     color: '#795548', effect: 'pitfall' },
  poison_arrow: { name: '毒矢の罠',    color: '#7e57c2', effect: 'poison' },
  sleep:        { name: '睡眠ガス',     color: '#42a5f5', effect: 'sleep' },
  spin:         { name: '回転盤',       color: '#ffa726', effect: 'confuse' },
  hunger:       { name: 'デロデロの罠', color: '#66bb6a', effect: 'hunger' },
  trip:         { name: '転び石',       color: '#bdbdbd', effect: 'trip' },
  rust:         { name: 'サビの罠',     color: '#8d6e63', effect: 'rust' }
};

var Trap = (function() {
  'use strict';

  var TRAP_KEYS = Object.keys(TRAP_DATA);

  function Trap(x, y, type) {
    var data = TRAP_DATA[type];
    this.x = x;
    this.y = y;
    this.type = type;
    this.name = data.name;
    this.char = '▲';
    this.color = data.color;
    this.effect = data.effect;
    this.visible = false;
    this.triggered = false;  // for one-shot traps like landmine
    this.consumed = false;   // removed from floor after use
  }

  // Pick a random trap type
  Trap.randomType = function() {
    return TRAP_KEYS[Math.floor(Math.random() * TRAP_KEYS.length)];
  };

  // Spawn traps for a floor
  Trap.spawnForFloor = function(dungeon, floorNum, existingItems) {
    var traps = [];
    var count = 2 + Math.floor(Math.random() * 4); // 2-5

    // Collect occupied positions
    var occupied = {};
    // Stairs
    occupied[dungeon.stairs.x + ',' + dungeon.stairs.y] = true;
    // Player start
    occupied[dungeon.playerStart.x + ',' + dungeon.playerStart.y] = true;
    // Items
    if (existingItems) {
      for (var i = 0; i < existingItems.length; i++) {
        occupied[existingItems[i].x + ',' + existingItems[i].y] = true;
      }
    }

    for (var t = 0; t < count; t++) {
      // Try to place on a random floor/corridor tile
      var attempts = 0;
      while (attempts < 50) {
        attempts++;
        // Pick random position from rooms or corridors
        var useRoom = Math.random() < 0.7;
        var px, py;
        if (useRoom && dungeon.rooms.length > 0) {
          var room = dungeon.rooms[Math.floor(Math.random() * dungeon.rooms.length)];
          px = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
          py = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        } else {
          // Random position on any floor/corridor tile
          px = Math.floor(Math.random() * dungeon.width);
          py = Math.floor(Math.random() * dungeon.height);
        }

        if (px < 0 || px >= dungeon.width || py < 0 || py >= dungeon.height) continue;
        var tile = dungeon.grid[py][px];
        if (tile !== Dungeon.TILE.FLOOR && tile !== Dungeon.TILE.CORRIDOR) continue;

        var key = px + ',' + py;
        if (occupied[key]) continue;

        // Check no other trap here
        var trapHere = false;
        for (var j = 0; j < traps.length; j++) {
          if (traps[j].x === px && traps[j].y === py) { trapHere = true; break; }
        }
        if (trapHere) continue;

        occupied[key] = true;
        traps.push(new Trap(px, py, Trap.randomType()));
        break;
      }
    }

    return traps;
  };

  return Trap;
})();
