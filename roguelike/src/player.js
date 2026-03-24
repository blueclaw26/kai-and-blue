// Player - extends Entity
var Player = (function() {
  'use strict';

  var MAX_INVENTORY = 20;
  var EXP_THRESHOLDS = [0, 10, 25, 50, 80, 120, 170, 230, 300, 400, 500];

  function Player(x, y) {
    Entity.call(this, x, y, '@', '#4fc3f7', 'Player');
    this.hp = 15;
    this.maxHp = 15;
    this.baseAttack = 3;
    this.attack = 3;
    this.baseDefense = 1;
    this.defense = 1;
    this.level = 1;
    this.exp = 0;
    this.floor = 1;
    this.satiety = 100;

    // Inventory
    this.inventory = [];
    this.weapon = null;   // equipped weapon (Item reference)
    this.shield = null;   // equipped shield (Item reference)

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

  Player.prototype.canPickUp = function() {
    return this.inventory.length < MAX_INVENTORY;
  };

  Player.prototype.pickUp = function(item) {
    if (!this.canPickUp()) return false;
    this.inventory.push(item);
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
        // Unequip
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
