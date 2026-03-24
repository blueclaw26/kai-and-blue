// Player - extends Entity
var Player = (function() {
  'use strict';

  function Player(x, y) {
    Entity.call(this, x, y, '@', '#4fc3f7', 'Player');
    this.hp = 15;
    this.maxHp = 15;
    this.attack = 3;
    this.defense = 1;
    this.level = 1;
    this.floor = 1;
  }

  Player.prototype = Object.create(Entity.prototype);
  Player.prototype.constructor = Player;

  return Player;
})();
