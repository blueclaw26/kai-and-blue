// Player - extends Entity
var Player = (function() {
  'use strict';

  var MAX_INVENTORY = 20;
  var EXP_THRESHOLDS = [0, 10, 25, 50, 80, 120, 170, 230, 300, 400, 500, 620, 760, 920, 1100, 1300, 1520, 1760, 2020, 2300];

  function Player(x, y) {
    Entity.call(this, x, y, '@', '#4fc3f7', 'Player');
    this.hp = 20;
    this.maxHp = 20;
    this.baseAttack = 2;
    this.attack = 2;
    this.baseDefense = 1;
    this.defense = 1;
    this.level = 1;
    this.exp = 0;
    this.floor = 1;
    this.satiety = 100;
    this.maxSatiety = 100;
    this._satietyAccum = 0;
    this._hungryWarned = false;

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

    // God mode (debug)
    this.godMode = false;

    // Status effects: [{type: 'confused'|'slowed'|'strengthened', turnsLeft: N}]
    this.statusEffects = [];
    this._slowedSkip = false; // toggle for slowed: skip every other turn
  }

  Player.prototype = Object.create(Entity.prototype);
  Player.prototype.constructor = Player;

  Player.prototype._recalcStats = function() {
    var weaponAtk = this.weapon ? this.weapon.getEffectiveAttack() : 0;
    var shieldDef = this.shield ? this.shield.getEffectiveDefense() : 0;
    this.attack = this.baseAttack + weaponAtk + (this.level - 1);
    this.defense = this.baseDefense + shieldDef + Math.floor((this.level - 1) / 2);
    if (this.powerupTurns > 0) {
      this.attack += 5;
    }
    // Bracelet: strength boost
    if (this.bracelet && this.bracelet.effect === 'strength_boost') {
      this.attack += 5;
    }
    // Strengthened status effect
    if (this.hasStatusEffect('strengthened')) {
      this.attack = Math.floor(this.attack * 1.5);
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
      }
    }
    if (this.sleepTurns > 0) parts.push('[睡眠]');
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
    while (this.level < EXP_THRESHOLDS.length && this.exp >= EXP_THRESHOLDS[this.level]) {
      this.level++;
      this.maxHp += 3;
      this.hp = Math.min(this.hp + 3, this.maxHp);
      this.baseAttack += 1;
      this.baseDefense += (this.level % 2 === 0) ? 1 : 0;
      this._recalcStats();
      if (ui) {
        Sound.play('levelup');
        ui.addMessage('レベルが上がった！ Lv.' + this.level + ' シレンは強くなった気がする', 'levelup');
      }
    }
  };

  Player.prototype.tickSatiety = function(ui) {
    var hungerRate = (this.bracelet && this.bracelet.effect === 'hunger') ? 0.2 : 0.1;
    this._satietyAccum += hungerRate;
    if (this._satietyAccum >= 1) {
      this._satietyAccum -= 1;
      this.satiety = Math.max(0, this.satiety - 1);
    }

    if (this.satiety <= 10 && this.satiety > 0 && !this._hungryWarned) {
      this._hungryWarned = true;
      if (ui) ui.addMessage('お腹が減ってきた...', 'damage');
    }

    if (this.satiety > 10) {
      this._hungryWarned = false;
    }

    if (this.satiety <= 0) {
      if (ui) ui.addMessage('お腹が空いて足元がふらつく...', 'damage');
      this.hp -= 1;
      if (this.hp <= 0) {
        this.hp = 0;
        return 'dead';
      }
    }

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
      'staff': 4,
      'grass': 5,
      'scroll': 6,
      'food': 7,
      'pot': 8
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
