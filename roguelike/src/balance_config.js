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
      doskoiThreshold: 150,     // % of maxSatiety to enter doskoi
      doskoiExitThreshold: 120, // % to exit doskoi
      maxSatietyCap: 200,       // max possible satiety
      eatFullSatietyBonus: 5,   // max satiety increase from eating when full
      eatFullBigBonus: 10,      // max satiety increase from big onigiri when full
    },

    // === Combat ===
    combat: {
      damageVariance: 0.125,    // ±12.5% damage variance
      minDamage: 1,
      critChance: 0.12,         // 12% per 会心 seal
      critMultiplier: 2.0,      // player critical multiplier
      enemyCritMultiplier: 1.5, // 痛恨 multiplier
      typeEffectBonus: 0.5,     // per effective seal
      typeEffectMultiplier: 1.5, // dragon/ghost/drain seal bonus (legacy)
      counterReflect: 0.3,      // counter shield reflects 30% damage
      strengthenedMultiplier: 1.5,
      powerupAttackBonus: 5,
      doskoiAttackBonus: 10,    // flat attack bonus when doskoi
      doskoiDamageMultiplier: 1.5, // damage multiplier when doskoi
      reductionSealMultiplier: 0.7, // per reduction seal

      // Damage formula coefficients
      weaponStrengthBase: 0.75, // weapon × (this + str/32)
      weaponStrengthScale: 32,  // divisor for strength scaling
      levelAttackTier1Rate: 1.5, // per level for Lv1-5
      levelAttackTier2Rate: 1.0, // per level for Lv6-13
      levelAttackTier3Rate: 0.5, // per level for Lv14+

      // Shield defense diminishing returns
      shieldDefenseCap: 20,     // full value up to this
      shieldDefenseScale: 0.6,  // per point above cap

      // HP recovery
      healDivisor: 7,           // floor(level/this) + 1 = HP per turn
      minHealRate: 1,
    },

    // === Incense ===
    incense: {
      blindEnemyVision: 1,      // enemy vision when blind incense active
      protectReduction: 0.5,    // damage multiplier when protect active
      evasionMissChance: 1.0,   // 100% miss for enemy projectiles
    },

    // === Curse/Blessing ===
    curseBlessing: {
      floorCursedChance: 0.05,  // 5% chance floor item is cursed
      floorBlessedChance: 0.03, // 3%
      cursedSellMultiplier: 0.7,
      blessedSellMultiplier: 1.3,
      blessedEffectMultiplier: 2.0,
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
      deepFloorAttackPlateau: 60, // attack stops scaling above this
      floorFireDamage: 30,      // fixed damage from floor-wide fire
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
