// Balance Configuration - Centralized tunable parameters
// Edit via balance.html, stored in localStorage
var BALANCE = (function() {
  'use strict';

  var defaults = {
    // === Player ===
    player: {
      startHp: 15,
      startAttack: 2,
      startDefense: 1,
      startSatiety: 100,
      maxSatiety: 100,
      startStrength: 8,
      maxStrength: 8,
      maxInventory: 20,
      hungerRate: 0.1,          // satiety lost per turn (1 per 10 turns)
      hungerSealMultiplier: 0.5, // hunger seal halves rate
      hungerBraceletMultiplier: 2, // hunger bracelet doubles rate
      starvationDamage: 1,
      levelUpHp: 3,             // HP gained per level
      levelUpAttack: 1,         // attack gained per level
    },

    // === Combat ===
    combat: {
      damageVariance: 3,        // random(0..N-1) added to damage
      minDamage: 1,
      critChance: 0.25,         // crit seal proc rate
      typeEffectMultiplier: 1.5, // dragon/ghost/drain seal bonus
      counterReflect: 0.3,      // counter shield reflects 30% damage
      strengthenedMultiplier: 1.5,
      powerupAttackBonus: 5,
    },

    // === Enemy Spawning ===
    enemies: {
      // [minFloor, maxFloor, minCount, maxCount]
      spawnTable: [
        [1,  5,  3, 5],
        [6,  15, 4, 6],
        [16, 30, 5, 7],
        [31, 50, 6, 9],
        [51, 75, 7, 10],
        [76, 99, 8, 12],
      ],
      maxPerFloor: 15,
      statScaleInterval: 5,     // scale stats every N floors above minFloor
      statScaleBonus: 0.1,      // +10% per interval
      visionRange: 6,           // tiles for enemy detection
      wanderChance: 0.5,        // chance to move when can't see player
      turnSpawnInterval: 30,    // spawn new enemy every N turns
    },

    // === Traps ===
    traps: {
      weights: {
        landmine: 8,
        pitfall: 2,
        poison_arrow: 8,
        sleep: 10,
        spin: 10,
        hunger: 8,
        trip: 10,
        rust: 8,
        arrow_trap_wood: 8,
        arrow_trap_iron: 6,
      },
      // [minFloor, maxFloor, minTraps, maxTraps]
      countTable: [
        [1,  20, 2, 4],
        [21, 50, 3, 5],
        [51, 99, 4, 6],
      ],
      landmineDamage: 20,
      pitfallDamage: 5,
      poisonArrowDamage: 5,
      sleepTurns: 5,
      confuseTurns: 10,
      hungerDrain: 30,
      arrowWoodDamage: 3,
      arrowIronDamage: 7,
    },

    // === Items ===
    items: {
      // weapon modifier distribution [+0, +1, +2, +3] cumulative thresholds
      modifierWeights: [0.5, 0.75, 0.9, 1.0],
      // [minFloor, maxFloor, minItems, maxItems]
      countTable: [
        [1,  10, 5, 7],
        [11, 30, 4, 6],
        [31, 60, 3, 5],
        [61, 99, 2, 4],
      ],
      grassSatietyRestore: 2,
      enemyDropRate: 0.15,      // chance enemy drops item on death
      goldDropRate: 0.15,       // within drops, chance it's gold
    },

    // === Dungeon ===
    dungeon: {
      width: 40,
      height: 30,
      maxFloor: 99,
      mazeChance: 0.05,         // chance for maze floor (F8+)
      mazeMinFloor: 8,
      bigRoomChance: 0.05,      // chance for big room (F5+)
      bigRoomMinFloor: 5,
      poolChance: 0.10,         // water/lava pool in rooms
      lavaMinFloor: 20,
      lavaChance: 0.4,          // within pool rooms, chance of lava vs water
      // Monster house chance [minFloor, maxFloor, chance]
      monsterHouseTable: [
        [3,  10, 0.08],
        [11, 30, 0.12],
        [31, 60, 0.18],
        [61, 99, 0.25],
      ],
    },

    // === Rendering ===
    render: {
      fovRadius: 6,
      tileSize: 24,
    },
  };

  // Deep clone
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Deep merge (source into target)
  function merge(target, source) {
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          merge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
  }

  // Load overrides from localStorage
  var config = clone(defaults);
  try {
    var saved = localStorage.getItem('roguelike_balance');
    if (saved) {
      var overrides = JSON.parse(saved);
      merge(config, overrides);
    }
  } catch (e) {
    console.warn('Balance config load failed, using defaults');
  }

  config._defaults = defaults;

  config.save = function() {
    try {
      // Only save diffs from defaults
      var diff = {};
      function findDiffs(def, cur, path, out) {
        for (var key in def) {
          if (key === '_defaults' || key === 'save' || key === 'reset') continue;
          if (!def.hasOwnProperty(key)) continue;
          var dk = def[key], ck = cur[key];
          if (typeof dk === 'object' && dk !== null && !Array.isArray(dk)) {
            var sub = {};
            findDiffs(dk, ck, path + '.' + key, sub);
            if (Object.keys(sub).length > 0) out[key] = sub;
          } else if (JSON.stringify(dk) !== JSON.stringify(ck)) {
            out[key] = ck;
          }
        }
      }
      findDiffs(defaults, config, '', diff);
      localStorage.setItem('roguelike_balance', JSON.stringify(diff));
    } catch (e) {
      console.warn('Balance config save failed');
    }
  };

  config.reset = function() {
    localStorage.removeItem('roguelike_balance');
    var fresh = clone(defaults);
    for (var key in fresh) {
      if (fresh.hasOwnProperty(key)) config[key] = fresh[key];
    }
  };

  return config;
})();

// Safe accessor for BALANCE values with fallback defaults.
// Usage: B('player.startHp', 15)
function B(path, defaultVal) {
  if (typeof BALANCE === 'undefined') return defaultVal;
  var parts = path.split('.');
  var obj = BALANCE;
  for (var i = 0; i < parts.length; i++) {
    if (obj === undefined || obj === null) return defaultVal;
    obj = obj[parts[i]];
  }
  return (obj !== undefined && obj !== null) ? obj : defaultVal;
}
