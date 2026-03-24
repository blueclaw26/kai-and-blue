// UI - Status bar, message log, inventory overlay
var UI = (function() {
  'use strict';

  var MAX_MESSAGES = 5;
  var SLOT_LETTERS = 'abcdefghijklmnopqrst';

  function UI(statusEl, logEl) {
    this.statusEl = statusEl;
    this.logEl = logEl;
    this.messages = [];
    this.inventoryEl = null;
    this._createInventoryOverlay();
  }

  UI.prototype._createInventoryOverlay = function() {
    var overlay = document.createElement('div');
    overlay.id = 'inventory-overlay';
    overlay.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;' +
      'background:rgba(0,0,0,0.85);z-index:9999;display:none;align-items:center;justify-content:center;';

    var box = document.createElement('div');
    box.id = 'inventory-box';
    box.style.cssText = 'background:#0d1117;border:2px solid #e8a44a;border-radius:12px;' +
      'padding:24px 32px;min-width:400px;max-width:500px;max-height:80vh;overflow-y:auto;' +
      'font-family:"Courier New",monospace;color:#ccc;';

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    this.inventoryEl = overlay;
    this.inventoryBox = box;
  };

  UI.prototype.addMessage = function(text) {
    this.messages.push(text);
    if (this.messages.length > MAX_MESSAGES) {
      this.messages.shift();
    }
    this.logEl.textContent = this.messages.join('\n');
  };

  UI.prototype.updateStatus = function(game) {
    var player = game.player;
    var satiety = Math.floor(player.satiety);
    var satietyColor;
    if (satiety > 30) {
      satietyColor = '#66bb6a';
    } else if (satiety > 10) {
      satietyColor = '#ffa726';
    } else {
      satietyColor = '#ef5350';
    }

    // Build status bar with HTML for colored satiety
    var statusText = player.floor + 'F | HP: ' + player.hp + '/' + player.maxHp +
      ' | Lv.' + player.level + ' | ';
    var satietyText = '満腹度: ' + satiety + '/' + player.maxSatiety;
    var afterText = ' | 攻:' + player.attack + ' 防:' + player.defense;

    this.statusEl.innerHTML = statusText +
      '<span style="color:' + satietyColor + ';">' + satietyText + '</span>' +
      afterText;
  };

  UI.prototype.renderInventory = function(game) {
    var player = game.player;
    var sel = game.inventorySelection;
    var box = this.inventoryBox;
    var html = '<div style="color:#e8a44a;font-size:18px;margin-bottom:12px;border-bottom:1px solid #333;padding-bottom:8px;">持ち物 (' + player.inventory.length + '/20)</div>';

    if (player.inventory.length === 0) {
      html += '<div style="color:#666;padding:16px 0;">持ち物はない</div>';
    } else {
      for (var i = 0; i < player.inventory.length; i++) {
        var item = player.inventory[i];
        var isSelected = (i === sel);
        var equipped = '';
        if (player.weapon === item) equipped = ' <span style="color:#e8a44a;">[装備中]</span>';
        if (player.shield === item) equipped = ' <span style="color:#e8a44a;">[装備中]</span>';

        var bgColor = isSelected ? '#1a2a3a' : 'transparent';
        var borderLeft = isSelected ? '3px solid #4fc3f7' : '3px solid transparent';

        html += '<div style="padding:4px 8px;margin:2px 0;background:' + bgColor + ';border-left:' + borderLeft + ';cursor:pointer;">';
        html += '<span style="color:#888;">' + SLOT_LETTERS[i] + ')</span> ';
        html += '<span style="color:' + item.color + ';">' + item.char + '</span> ';
        html += '<span style="color:#e0e0e0;">' + item.getDisplayName() + '</span>';
        html += equipped;
        html += '</div>';
      }
    }

    html += '<div style="color:#888;font-size:12px;margin-top:16px;border-top:1px solid #333;padding-top:8px;">';
    html += '[e]使う [E]装備 [d]置く [↑↓]選択 [ESC]戻る';
    html += '</div>';

    box.innerHTML = html;
    this.inventoryEl.style.display = 'flex';
  };

  UI.prototype.hideInventory = function() {
    this.inventoryEl.style.display = 'none';
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

  UI.prototype.showVictory = function(player) {
    var overlay = document.getElementById('victory-overlay');
    if (overlay) {
      overlay.querySelector('.victory-turns').textContent = player.totalTurns;
      overlay.querySelector('.victory-kills').textContent = player.enemiesKilled;
      overlay.querySelector('.victory-items').textContent = player.itemsCollected;
      overlay.querySelector('.victory-level').textContent = 'Lv.' + player.level;
      overlay.style.display = 'flex';
    }
  };

  return UI;
})();
