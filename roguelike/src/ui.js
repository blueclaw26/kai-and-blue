// UI - Status bar and message log
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

  UI.prototype.updateStatus = function(player) {
    this.statusEl.textContent = 'Floor: ' + player.floor + 'F | HP: ' + player.hp + '/' + player.maxHp + ' | Lv.' + player.level;
  };

  return UI;
})();
