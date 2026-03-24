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
    this._satietyAccum = 0; // accumulator for fractional satiety decrease
    this._hungryWarned = false; // track if we showed the hungry warning

    // Stats tracking for victory screen
    this.totalTurns = 0;
    this.enemiesKilled = 0;
    this.itemsCollected = 0;

    // Inventory
    this.inventory = [];
    this.weapon = null;
    this.shield = null;

    // Buffs
    this.powerupTurns = 0;
  }

  Player.prototype = Object.create(Entity.prototype);
  Player.prototype.constructor = Player;

  Player.prototype._recalcStats = function() {
    this.attack = this.baseAttack + (this.weapon ? this.weapon.attack : 0) + (this.level - 1);
    this.defense = this.baseDefense + (this.shield ? this.shield.defense : 0) + Math.floor((this.level - 1) / 2);
    if (this.powerupTurns > 0) {
      this.attack += 5;
    }
  };

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
        ui.addMessage('レベルが上がった！ Lv.' + this.level + ' (HP+3, 攻撃+1)');
      }
    }
  };

  // Process satiety decrease per turn. Returns messages to display.
  Player.prototype.tickSatiety = function(ui) {
    this._satietyAccum += 0.1;
    if (this._satietyAccum >= 1) {
      this._satietyAccum -= 1;
      this.satiety = Math.max(0, this.satiety - 1);
    }

    // Warning at satiety <= 10
    if (this.satiety <= 10 && this.satiety > 0 && !this._hungryWarned) {
      this._hungryWarned = true;
      if (ui) ui.addMessage('お腹が減ってきた...');
    }

    // Reset warning flag when satiety goes above 10
    if (this.satiety > 10) {
      this._hungryWarned = false;
    }

    // Starvation damage
    if (this.satiety <= 0) {
      if (ui) ui.addMessage('お腹が空いて足元がふらつく...');
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
        ui.addMessage(item.name + 'を外した');
      } else {
        this.weapon = item;
        this._recalcStats();
        ui.addMessage(item.name + 'を装備した');
      }
      return true;
    } else if (item.type === 'shield') {
      if (this.shield === item) {
        this.shield = null;
        this._recalcStats();
        ui.addMessage(item.name + 'を外した');
      } else {
        this.shield = item;
        this._recalcStats();
        ui.addMessage(item.name + 'を装備した');
      }
      return true;
    }
    ui.addMessage('それは装備できない');
    return false;
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
