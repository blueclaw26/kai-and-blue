// Trap System
var TRAP_DATA = {
  landmine:         { name: '地雷',         color: '#f44336', effect: 'explosion' },
  pitfall:          { name: '落とし穴',     color: '#795548', effect: 'pitfall' },
  poison_arrow:     { name: '毒矢の罠',    color: '#7e57c2', effect: 'poison' },
  sleep:            { name: '睡眠ガス',     color: '#42a5f5', effect: 'sleep' },
  spin:             { name: '回転盤',       color: '#ffa726', effect: 'confuse' },
  hunger:           { name: 'デロデロの罠', color: '#66bb6a', effect: 'hunger' },
  trip:             { name: '転び石',       color: '#bdbdbd', effect: 'trip' },
  rust:             { name: 'サビの罠',     color: '#8d6e63', effect: 'rust' },
  arrow_trap_wood:  { name: '木の矢の罠',  color: '#a1887f', effect: 'arrow_wood' },
  arrow_trap_iron:  { name: '鉄の矢の罠',  color: '#78909c', effect: 'arrow_iron' }
};

var Trap = (function() {
  'use strict';

  var TRAP_KEYS = Object.keys(TRAP_DATA);

  // Trap type weights (pitfall is very rare ~3%)
  var TRAP_WEIGHTS = {
    landmine:        8,
    pitfall:         2,  // ~3% — very rare
    poison_arrow:    8,
    sleep:           10,
    spin:            10,
    hunger:          8,
    trip:            10,
    rust:            8,
    arrow_trap_wood: 8,
    arrow_trap_iron: 6
  };

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

  // Pick a weighted random trap type
  Trap.randomType = function() {
    var totalWeight = 0;
    for (var i = 0; i < TRAP_KEYS.length; i++) {
      totalWeight += (TRAP_WEIGHTS[TRAP_KEYS[i]] || 5);
    }
    var roll = Math.random() * totalWeight;
    var cumulative = 0;
    for (var j = 0; j < TRAP_KEYS.length; j++) {
      cumulative += (TRAP_WEIGHTS[TRAP_KEYS[j]] || 5);
      if (roll < cumulative) return TRAP_KEYS[j];
    }
    return TRAP_KEYS[TRAP_KEYS.length - 1];
  };

  // Spawn traps for a floor
  Trap.spawnForFloor = function(dungeon, floorNum, existingItems) {
    var traps = [];
    // Reduced trap count: F1-20: 2-4, F21-50: 3-5, F51-99: 4-6
    var minTraps, maxTraps;
    if (floorNum <= 20) { minTraps = 2; maxTraps = 4; }
    else if (floorNum <= 50) { minTraps = 3; maxTraps = 5; }
    else { minTraps = 4; maxTraps = 6; }
    var count = minTraps + Math.floor(Math.random() * (maxTraps - minTraps + 1));

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
