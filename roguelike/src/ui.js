// UI - Status bar, message log, and overlays
var UI = (function() {
  'use strict';

  var MAX_MESSAGES = 5;

  function UI(statusEl, logEl) {
    this.statusEl = statusEl;
    this.logEl = logEl;
    this.messages = [];
  }

  UI.prototype.addMessage = function(text) {
    this.messages.push(text);
    if (this.messages.length > MAX_MESSAGES) {
      this.messages.shift();
    }
    this.logEl.textContent = this.messages.join('\n');
  };

  UI.prototype.updateStatus = function(game) {
    var player = game.player;
    var enemyCount = game.livingEnemyCount();
    this.statusEl.textContent = player.floor + 'F | HP: ' + player.hp + '/' + player.maxHp +
      ' | Lv.' + player.level + ' | Exp: ' + player.exp + ' | 敵: ' + enemyCount;
  };

  UI.prototype.showGameOver = function(floor, level) {
    var overlay = document.getElementById('game-over-overlay');
    if (overlay) {
      var floorSpan = overlay.querySelector('.go-floor');
      var levelSpan = overlay.querySelector('.go-level');
      if (floorSpan) floorSpan.textContent = floor + 'F';
      if (levelSpan) levelSpan.textContent = 'Lv.' + level;
      overlay.style.display = 'flex';
    }
  };

  return UI;
})();
