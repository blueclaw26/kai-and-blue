// Player - extends Entity
var Player = (function() {
  'use strict';

  var MAX_INVENTORY = B('player.maxInventory', 20);
  // EXP curve: ~1.4x multiplier for levels beyond the table
  var EXP_THRESHOLDS = [0, 10, 25, 50, 90, 150, 230, 340, 480, 650, 910, 1274, 1784, 2498, 3497, 4896, 6854, 9596, 13434, 18808];

  function Player(x, y) {
    Entity.call(this, x, y, '@', '#4fc3f7', 'Player');
    this.hp = B('player.startHp', 15);
    this.maxHp = B('player.startHp', 15);
    this.baseAttack = B('player.startAttack', 2);
    this.attack = B('player.startAttack', 2);
    this.baseDefense = B('player.startDefense', 1);
    this.defense = B('player.startDefense', 1);
    this.level = 1;
    this.exp = 0;
    this.floor = 1;
    this.satiety = B('player.startSatiety', 100);
    this.maxSatiety = B('player.maxSatiety', 100);
    this._satietyAccum = 0;
    this._hungryWarned = false;

    // Strength system
    this.strength = B('player.startStrength', 8);
    this.maxStrength = B('player.maxStrength', 8);

    // Gold
    this.gold = 0;

    // Stats tracking for victory screen
    this.totalTurns = 0;
    this.enemiesKilled = 0;
    this.itemsCollected = 0;

    // Inventory
    this.inventory = [];
    this.weapon = null;
    this.shield = null;
    this.bracelet = null;

    // Buffs
    this.powerupTurns = 0;

    // Sleep state
    this.sleepTurns = 0;

    // Doskoi state (ドスコイ)
    this.doskoi = false;

    // God mode (debug) — use isGodMode()/setGodMode() instead of direct access
    this._godMode = false;

    // Status effects: [{type: 'confused'|'slowed'|'strengthened', turnsLeft: N}]
    this.statusEffects = [];
    this._slowedSkip = false; // toggle for slowed: skip every other turn
  }

  Player.prototype = Object.create(Entity.prototype);
  Player.prototype.constructor = Player;

  // God mode accessors — only functional when DEBUG_MODE is enabled
  Player.prototype.isGodMode = function() { return DEBUG_MODE && this._godMode; };
  Player.prototype.setGodMode = function(val) { if (DEBUG_MODE) this._godMode = !!val; };

  // Legacy getter for backward compatibility (returns false in production)
  Object.defineProperty(Player.prototype, 'godMode', {
    get: function() { return this.isGodMode(); },
    set: function(val) { this.setGodMode(val); }
  });

  Player.prototype._recalcStats = function() {
    var weaponAtk = this.weapon ? this.weapon.getEffectiveAttack() : 0;
    var shieldDef = this.shield ? this.shield.getEffectiveDefense() : 0;
    // Blessed weapon/shield bonus: +3
    if (this.weapon && this.weapon.blessed) weaponAtk += 3;
    if (this.shield && this.shield.blessed) shieldDef += 3;
    this.attack = this.baseAttack + (this.strength || 8) + weaponAtk + (this.level - 1);
    this.defense = this.baseDefense + shieldDef + Math.floor((this.level - 1) / 2);
    if (this.powerupTurns > 0) {
      this.attack += B('combat.powerupAttackBonus', 5);
    }
    // Doskoi attack boost
    if (this.doskoi) {
      this.attack += 10;
    }
    // Bracelet: strength boost
    if (this.bracelet && this.bracelet.effect === 'strength_boost') {
      this.attack += B('combat.powerupAttackBonus', 5);
    }
    // Strengthened status effect
    if (this.hasStatusEffect('strengthened')) {
      this.attack = Math.floor(this.attack * B('combat.strengthenedMultiplier', 1.5));
    }
  };

  // --- Status Effect System ---

  Player.prototype.addStatusEffect = function(type, turns, ui) {
    // Stack: refresh duration if already present
    for (var i = 0; i < this.statusEffects.length; i++) {
      if (this.statusEffects[i].type === type) {
        this.statusEffects[i].turnsLeft = turns;
        return;
      }
    }
    this.statusEffects.push({ type: type, turnsLeft: turns });
    this._recalcStats();
  };

  Player.prototype.hasStatusEffect = function(type) {
    for (var i = 0; i < this.statusEffects.length; i++) {
      if (this.statusEffects[i].type === type) return true;
    }
    return false;
  };

  Player.prototype.tickStatusEffects = function(ui) {
    var removed = [];
    for (var i = this.statusEffects.length - 1; i >= 0; i--) {
      this.statusEffects[i].turnsLeft--;
      if (this.statusEffects[i].turnsLeft <= 0) {
        var effectType = this.statusEffects[i].type;
        this.statusEffects.splice(i, 1);
        removed.push(effectType);
      }
    }
    // Messages for removed effects
    for (var j = 0; j < removed.length; j++) {
      var msg = '';
      switch (removed[j]) {
        case 'confused': msg = '混乱が解けた'; break;
        case 'slowed': msg = '鈍足が解けた'; break;
        case 'strengthened': msg = '力が元に戻った'; break;
        case 'invincible': msg = '無敵状態が解けた'; break;
      }
      if (msg && ui) ui.addMessage(msg, 'system');
    }
    if (removed.length > 0) {
      this._recalcStats();
    }
  };

  // Check if slowed player should skip this turn
  Player.prototype.isSlowedSkip = function() {
    if (!this.hasStatusEffect('slowed')) {
      this._slowedSkip = false;
      return false;
    }
    this._slowedSkip = !this._slowedSkip;
    return this._slowedSkip;
  };

  Player.prototype.getStatusEffectText = function() {
    var parts = [];
    for (var i = 0; i < this.statusEffects.length; i++) {
      switch (this.statusEffects[i].type) {
        case 'confused': parts.push('[混乱]'); break;
        case 'slowed': parts.push('[鈍足]'); break;
        case 'strengthened': parts.push('[強化]'); break;
        case 'invincible': parts.push('[無敵]'); break;
      }
    }
    if (this.sleepTurns > 0) parts.push('[睡眠]');
    if (this.doskoi) parts.push('[ドスコイ]');
    if (this.bracelet) parts.push('[' + this.bracelet.name + ']');
    return parts.join(' ');
  };

  // --- Sleep System ---

  Player.prototype.isSleeping = function() {
    return this.sleepTurns > 0;
  };

  Player.prototype.tickSleep = function(ui) {
    if (this.sleepTurns > 0) {
      this.sleepTurns--;
      if (this.sleepTurns <= 0) {
        if (ui) ui.addMessage('目が覚めた', 'system');
      }
    }
  };

  Player.prototype.wakeUp = function(ui) {
    if (this.sleepTurns > 0) {
      this.sleepTurns = 0;
      if (ui) ui.addMessage('攻撃を受けて目が覚めた！', 'damage');
    }
  };

  // --- End Status Effects ---

  Player.prototype.gainExp = function(amount, ui) {
    this.exp += amount;
    var lvHpGain = B('player.levelUpHp', 3);
    var lvAtkGain = B('player.levelUpAttack', 1);
    while (this.level < EXP_THRESHOLDS.length && this.exp >= EXP_THRESHOLDS[this.level]) {
      this.level++;
      this.maxHp += lvHpGain;
      this.hp = Math.min(this.hp + lvHpGain, this.maxHp);
      this.baseAttack += lvAtkGain;
      this.baseDefense += (this.level % 2 === 0) ? 1 : 0;
      // Max satiety bonus at milestone levels
      if (this.level === 5 || this.level === 10 || this.level === 15 || this.level === 20) {
        this.maxSatiety = (this.maxSatiety || 100) + 5;
      }
      this._recalcStats();
      if (ui) {
        Sound.play('levelup');
        ui.addMessage('レベルが上がった！ Lv.' + this.level + ' シレンは強くなった気がする', 'levelup');
        // Floating text effect
        if (window._game) {
          window._game.addFloatingText(this.x, this.y, 'Lv UP!', '#e8a44a');
        }
      }
    }
  };

  // Check and update doskoi state based on satiety thresholds
  Player.prototype.checkDoskoi = function(ui) {
    var threshold150 = Math.floor(this.maxSatiety * 1.5);
    var threshold120 = Math.floor(this.maxSatiety * 1.2);

    if (!this.doskoi && this.satiety >= threshold150) {
      this.doskoi = true;
      this._recalcStats();
      if (ui) ui.addMessage('ドスコイ状態になった！', 'levelup');
      if (window._game) window._game.addFloatingText(this.x, this.y, 'ドスコイ！', '#ffd700');
    } else if (this.doskoi && this.satiety <= threshold120) {
      this.doskoi = false;
      this._recalcStats();
      if (ui) ui.addMessage('ドスコイ状態が解けた...', 'system');
    }
  };

  Player.prototype.tickSatiety = function(ui) {
    // Check for hunger seal (腹) on shield — halves hunger rate
    // Hunger rate: 1 satiety per 10 turns (0.1 per turn). Hunger seal halves it. Hunger bracelet doubles it.
    var hasHungerSeal = this.shield && this.shield.seals && this.shield.seals.indexOf('hunger') !== -1;
    var rawRate = B('player.hungerRate', 0.1);
    var baseHungerRate = hasHungerSeal ? rawRate * B('player.hungerSealMultiplier', 0.5) : rawRate;
    var hungerRate = (this.bracelet && this.bracelet.effect === 'hunger') ? baseHungerRate * B('player.hungerBraceletMultiplier', 2) : baseHungerRate;
    this._satietyAccum += hungerRate;
    if (this._satietyAccum >= 1) {
      this._satietyAccum -= 1;
      this.satiety = Math.max(0, this.satiety - 1);
    }

    // Hunger threshold messages
    if (this.satiety === 50 && !this._hunger50Warned) {
      this._hunger50Warned = true;
      if (ui) ui.addMessage('少しお腹が空いてきた', 'system');
    }
    if (this.satiety <= 30 && this.satiety > 10 && !this._hunger30Warned) {
      this._hunger30Warned = true;
      if (ui) ui.addMessage('お腹が減ってきた...', 'damage');
    }
    if (this.satiety <= 10 && this.satiety > 0 && !this._hungryWarned) {
      this._hungryWarned = true;
      if (ui) ui.addMessage('お腹がペコペコだ！', 'damage');
    }

    if (this.satiety > 50) {
      this._hunger50Warned = false;
    }
    if (this.satiety > 30) {
      this._hunger30Warned = false;
    }
    if (this.satiety > 10) {
      this._hungryWarned = false;
    }

    if (this.satiety <= 0) {
      if (ui) ui.addMessage('お腹が空いて力が出ない...', 'damage');
      if (!this.godMode) {
        this.hp -= B('player.starvationDamage', 1);
        if (this.hp <= 0) {
          this.hp = 0;
          return 'dead';
        }
      }
    }

    // Check doskoi state on every satiety tick
    this.checkDoskoi(ui);

    return 'ok';
  };

  Player.prototype.canPickUp = function() {
    return this.inventory.length < MAX_INVENTORY;
  };

  Player.prototype.pickUp = function(item) {
    // Arrow stacking: merge with existing stack of same type
    if (item.type === 'arrow') {
      for (var i = 0; i < this.inventory.length; i++) {
        if (this.inventory[i].type === 'arrow' && this.inventory[i].dataKey === item.dataKey) {
          this.inventory[i].count = (this.inventory[i].count || 1) + (item.count || 1);
          this.itemsCollected++;
          return true;
        }
      }
    }
    if (!this.canPickUp()) return false;
    this.inventory.push(item);
    this.itemsCollected++;
    return true;
  };

  Player.prototype.removeFromInventory = function(item) {
    var idx = this.inventory.indexOf(item);
    if (idx !== -1) {
      this.inventory.splice(idx, 1);
    }
  };

  Player.prototype.equip = function(item, ui) {
    if (item.type === 'weapon') {
      if (this.weapon === item) {
        if (item.cursed) {
          ui.addMessage('呪われていて外せない！', 'damage');
          return false;
        }
        this.weapon = null;
        this._recalcStats();
        ui.addMessage(item.name + 'を外した', 'system');
      } else {
        this.weapon = item;
        this._recalcStats();
        Sound.play('equip');
        ui.addMessage(item.name + 'を装備した', 'pickup');
      }
      return true;
    } else if (item.type === 'shield') {
      if (this.shield === item) {
        if (item.cursed) {
          ui.addMessage('呪われていて外せない！', 'damage');
          return false;
        }
        this.shield = null;
        this._recalcStats();
        ui.addMessage(item.name + 'を外した', 'system');
      } else {
        this.shield = item;
        this._recalcStats();
        Sound.play('equip');
        ui.addMessage(item.name + 'を装備した', 'pickup');
      }
      return true;
    }
    if (item.type === 'bracelet') {
      if (this.bracelet === item) {
        if (item.cursed) {
          ui.addMessage('呪われていて外せない！', 'damage');
          return false;
        }
        this.bracelet = null;
        this._recalcStats();
        ui.addMessage(item.name + 'を外した', 'system');
      } else {
        this.bracelet = item;
        this._recalcStats();
        Sound.play('equip');
        ui.addMessage(item.name + 'を装備した', 'pickup');
      }
      return true;
    }
    ui.addMessage('それは装備できない', 'system');
    return false;
  };

  Player.prototype.sortInventory = function() {
    var self = this;
    var typeOrder = {
      'weapon': 0,
      'shield': 1,
      'bracelet': 2,
      'arrow': 3,
      'grass': 4,
      'scroll': 5,
      'staff': 6,
      'pot': 7,
      'food': 8,
      'incense': 9
    };

    this.inventory.sort(function(a, b) {
      // Equipped weapon first
      if (self.weapon === a) return -1;
      if (self.weapon === b) return 1;
      // Equipped shield second
      if (self.shield === a) return -1;
      if (self.shield === b) return 1;
      // Equipped bracelet third
      if (self.bracelet === a) return -1;
      if (self.bracelet === b) return 1;

      var typeA = typeOrder[a.type] !== undefined ? typeOrder[a.type] : 6;
      var typeB = typeOrder[b.type] !== undefined ? typeOrder[b.type] : 6;

      if (typeA !== typeB) return typeA - typeB;

      // Within same type, sort by relevant stat or name
      if (a.type === 'weapon') {
        return (b.getEffectiveAttack() || 0) - (a.getEffectiveAttack() || 0); // descending
      }
      if (a.type === 'shield') {
        return (b.getEffectiveDefense() || 0) - (a.getEffectiveDefense() || 0); // descending
      }
      // Staff, grass, scroll, food: by name
      return (a.name || '').localeCompare(b.name || '');
    });
  };

  // Shiren 6 natural HP recovery per turn
  // Fast recovery: scales with level, makes deep-floor recovery viable
  Player.prototype.naturalHeal = function() {
    if (this.hp < this.maxHp && this.hp > 0 && this.satiety > 0) {
      var healRate = Math.max(1, Math.floor(this.level / 7) + 1);
      // Regen bracelet doubles heal rate
      if (this.bracelet && this.bracelet.effect === 'regen') {
        healRate *= 2;
      }
      this.hp = Math.min(this.hp + healRate, this.maxHp);
    }
  };

  Player.prototype.tickBuffs = function() {
    if (this.powerupTurns > 0) {
      this.powerupTurns--;
      if (this.powerupTurns === 0) {
        this._recalcStats();
      }
    }
  };

  return Player;
})();
