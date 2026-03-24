// Player - extends Entity
var Player = (function() {
  'use strict';

  // Experience thresholds for each level
  var EXP_THRESHOLDS = [0, 10, 25, 50, 80, 120, 170, 230, 300, 400, 500];

  function Player(x, y) {
    Entity.call(this, x, y, '@', '#4fc3f7', 'Player');
    this.hp = 15;
    this.maxHp = 15;
    this.attack = 3;
    this.defense = 1;
    this.level = 1;
    this.exp = 0;
    this.floor = 1;
  }

  Player.prototype = Object.create(Entity.prototype);
  Player.prototype.constructor = Player;

  Player.prototype.gainExp = function(amount, ui) {
    this.exp += amount;
    // Check level up
    while (this.level < EXP_THRESHOLDS.length && this.exp >= EXP_THRESHOLDS[this.level]) {
      this.level++;
      this.maxHp += 3;
      this.hp = Math.min(this.hp + 3, this.maxHp);
      this.attack += 1;
      this.defense += (this.level % 2 === 0) ? 1 : 0; // +1 every 2 levels
      if (ui) {
        ui.addMessage('レベルが上がった！ Lv.' + this.level + ' (HP+3, 攻撃+1)');
      }
    }
  };

  return Player;
})();
