// UI - Status bar, message log, inventory overlay
var UI = (function() {
  'use strict';

  var MAX_MESSAGES = 8;
  var SLOT_LETTERS = 'abcdefghijklmnopqrst';

  // Message type colors
  var MSG_COLORS = {
    attack: '#ffffff',
    damage: '#ef5350',
    heal: '#66bb6a',
    levelup: '#e8a44a',
    pickup: '#4fc3f7',
    enemy_special: '#ce93d8',
    system: '#8892b0',
    normal: '#b0b8c8',
    debug: '#e040fb'
  };

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

  UI.prototype.addMessage = function(text, type) {
    var color = MSG_COLORS[type] || MSG_COLORS.normal;
    this.messages.push({ text: text, color: color });
    if (this.messages.length > MAX_MESSAGES) {
      this.messages.shift();
    }
    this._renderLog();
  };

  UI.prototype._renderLog = function() {
    var html = '';
    for (var i = 0; i < this.messages.length; i++) {
      var msg = this.messages[i];
      var opacity = 0.4 + 0.6 * ((i + 1) / this.messages.length);
      html += '<div style="color:' + msg.color + ';opacity:' + opacity.toFixed(2) + ';">' + msg.text + '</div>';
    }
    this.logEl.innerHTML = html;
    this.logEl.scrollTop = this.logEl.scrollHeight;
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

    var hpPercent = player.hp / player.maxHp;
    var hpColor;
    if (hpPercent > 0.5) {
      hpColor = '#66bb6a';
    } else if (hpPercent > 0.25) {
      hpColor = '#ffa726';
    } else {
      hpColor = '#ef5350';
    }

    var weaponName = player.weapon ? player.weapon.name : 'なし';
    var shieldName = player.shield ? player.shield.name : 'なし';

    var statusText = player.floor + 'F | ';
    var hpText = 'HP: ' + player.hp + '/' + player.maxHp;
    var levelText = ' | Lv.' + player.level + ' | ';
    var satietyText = '満腹度:' + satiety;
    var equipText = ' | 攻:' + player.attack + '(' + weaponName + ') 防:' + player.defense + '(' + shieldName + ')';
    var goldText = ' | 所持金:' + player.gold + 'ギタン';

    var effectText = player.getStatusEffectText ? player.getStatusEffectText() : '';
    var effectHtml = effectText ? ' <span style="color:#ff8a65;">' + effectText + '</span>' : '';

    this.statusEl.innerHTML = statusText +
      '<span style="color:' + hpColor + ';">' + hpText + '</span>' +
      levelText +
      '<span style="color:' + satietyColor + ';">' + satietyText + '</span>' +
      equipText +
      '<span style="color:#ffd700;">' + goldText + '</span>' +
      effectHtml;

    this._updateSidePanel(game);
  };

  UI.prototype._updateSidePanel = function(game) {
    var player = game.player;

    var equipEl = document.getElementById('side-equip');
    if (equipEl) {
      var weaponText = player.weapon ? player.weapon.getDisplayName() : 'なし';
      var shieldText = player.shield ? player.shield.getDisplayName() : 'なし';
      equipEl.innerHTML =
        '<div class="key-group"><span class="key-label">武器</span><span class="key-value" style="color:' + (player.weapon ? player.weapon.color : '#666') + ';">' + weaponText + '</span></div>' +
        '<div class="key-group"><span class="key-label">盾</span><span class="key-value" style="color:' + (player.shield ? player.shield.color : '#666') + ';">' + shieldText + '</span></div>';
    }

    var turnEl = document.getElementById('side-turns');
    if (turnEl) {
      turnEl.textContent = player.totalTurns;
    }
  };

  UI.prototype.renderInventory = function(game) {
    var player = game.player;
    var sel = game.inventorySelection;
    var box = this.inventoryBox;
    var isIdentifyMode = game.identifyMode;

    var titleText = isIdentifyMode ? '識別するアイテムを選べ' : '持ち物 (' + player.inventory.length + '/20)';
    var html = '<div style="color:#e8a44a;font-size:18px;margin-bottom:12px;border-bottom:1px solid #333;padding-bottom:8px;">' + titleText + '</div>';

    if (player.inventory.length === 0) {
      html += '<div style="color:#666;padding:16px 0;">持ち物はない</div>';
    } else {
      for (var i = 0; i < player.inventory.length; i++) {
        var item = player.inventory[i];
        var isSelected = (i === sel);
        var equipped = '';
        if (player.weapon === item) equipped = ' <span style="color:#e8a44a;">[装備中]</span>';
        if (player.shield === item) equipped = ' <span style="color:#e8a44a;">[装備中]</span>';

        // Show unidentified indicator
        var idIndicator = '';
        if (!item.identified) {
          idIndicator = ' <span style="color:#ff8a65;">[未識別]</span>';
        }

        var bgColor = isSelected ? '#1a2a3a' : 'transparent';
        var borderLeft = isSelected ? '3px solid #4fc3f7' : '3px solid transparent';

        html += '<div style="padding:4px 8px;margin:2px 0;background:' + bgColor + ';border-left:' + borderLeft + ';cursor:pointer;">';
        html += '<span style="color:#888;">' + SLOT_LETTERS[i] + ')</span> ';
        html += '<span style="color:' + item.color + ';">' + item.char + '</span> ';
        html += '<span style="color:#e0e0e0;">' + item.getDisplayName() + '</span>';
        html += equipped;
        html += idIndicator;
        html += '</div>';
      }
    }

    if (isIdentifyMode) {
      html += '<div style="color:#888;font-size:12px;margin-top:16px;border-top:1px solid #333;padding-top:8px;">';
      html += '[Enter/e]識別 [↑↓]選択 [ESC]キャンセル';
      html += '</div>';
    } else {
      html += '<div style="color:#888;font-size:12px;margin-top:16px;border-top:1px solid #333;padding-top:8px;">';
      html += '[e]使う [E]装備 [d]置く [t]投げる [s]整理 [↑↓]選択 [ESC]戻る';
      html += '</div>';
    }

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