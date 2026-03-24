// UI - Status bar, message log, inventory overlay
var UI = (function() {
  'use strict';

  var MAX_MESSAGES = 10;
  var SLOT_LETTERS = 'abcdefghijklmnopqrst';

  // Message type colors + bullet colors
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

  var MSG_BULLETS = {
    attack: '#ffffff',
    damage: '#ef5350',
    heal: '#66bb6a',
    levelup: '#e8a44a',
    pickup: '#4fc3f7',
    enemy_special: '#ce93d8',
    system: '#666',
    normal: '#888',
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
    var bullet = MSG_BULLETS[type] || MSG_BULLETS.normal;
    this.messages.push({ text: text, color: color, bullet: bullet, type: type || 'normal' });
    if (this.messages.length > MAX_MESSAGES) {
      this.messages.shift();
    }
    this._renderLog();
  };

  UI.prototype._renderLog = function() {
    var html = '';
    for (var i = 0; i < this.messages.length; i++) {
      var msg = this.messages[i];
      var opacity = 0.35 + 0.65 * ((i + 1) / this.messages.length);
      var isLatest = (i === this.messages.length - 1);
      var weight = isLatest ? 'font-weight:bold;' : '';
      html += '<div class="msg-line' + (isLatest ? ' msg-latest' : '') + '" style="color:' + msg.color + ';opacity:' + opacity.toFixed(2) + ';' + weight + '">';
      html += '<span style="color:' + msg.bullet + ';">●</span> ' + msg.text;
      html += '</div>';
    }
    this.logEl.innerHTML = html;
    this.logEl.scrollTop = this.logEl.scrollHeight;
  };

  UI.prototype.updateStatus = function(game) {
    if (game.scene === 'village') {
      this.statusEl.innerHTML = '<span style="color:#66bb6a;">拠点の村</span> | ' +
        '持ち物: ' + game.player.inventory.length + '/20 | ' +
        '<span style="color:#ffd700;">所持金: ' + game.player.gold + 'ギタン</span> | ' +
        '倉庫: ' + game.storage.length + '/20';
      this._updateSidePanel(game);
      return;
    }
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

    // Zone name
    var zoneName = '';
    var fn = player.floor || 1;
    if (fn <= 10) zoneName = '洞窟';
    else if (fn <= 25) zoneName = '地底湖';
    else if (fn <= 50) zoneName = '溶岩洞';
    else if (fn <= 75) zoneName = '凍土';
    else zoneName = '深淵';

    var statusText = player.floor + 'F ' + zoneName + ' | ';
    var hpText = 'HP: ' + player.hp + '/' + player.maxHp;
    var levelText = ' | Lv.' + player.level + ' | ';
    var satietyText = '満腹度:' + satiety;
    var equipText = ' | 攻:' + player.attack + '(' + weaponName + ') 防:' + player.defense + '(' + shieldName + ')';
    var goldText = ' | 所持金:' + player.gold + 'ギタン';

    var effectText = player.getStatusEffectText ? player.getStatusEffectText() : '';
    var effectHtml = effectText ? ' <span style="color:#ff8a65;">' + effectText + '</span>' : '';

    var debtText = '';
    if (game.shopDebt > 0) {
      debtText = ' | <span style="color:#ef5350;">未払い:' + game.shopDebt + 'ギタン</span>';
    }

    this.statusEl.innerHTML = statusText +
      '<span style="color:' + hpColor + ';">' + hpText + '</span>' +
      levelText +
      '<span style="color:' + satietyColor + ';">' + satietyText + '</span>' +
      equipText +
      '<span style="color:#ffd700;">' + goldText + '</span>' +
      debtText +
      effectHtml;

    this._updateSidePanel(game);
  };

  UI.prototype._updateSidePanel = function(game) {
    var player = game.player;

    var equipEl = document.getElementById('side-equip');
    if (equipEl) {
      var weaponText = player.weapon ? player.weapon.getDisplayName() : 'なし';
      var shieldText = player.shield ? player.shield.getDisplayName() : 'なし';
      var braceletText = player.bracelet ? player.bracelet.getDisplayName() : 'なし';
      equipEl.innerHTML =
        '<div class="key-group"><span class="key-label">武器</span><span class="key-value" style="color:' + (player.weapon ? player.weapon.color : '#666') + ';">' + weaponText + '</span></div>' +
        '<div class="key-group"><span class="key-label">盾</span><span class="key-value" style="color:' + (player.shield ? player.shield.color : '#666') + ';">' + shieldText + '</span></div>' +
        '<div class="key-group"><span class="key-label">腕輪</span><span class="key-value" style="color:' + (player.bracelet ? player.bracelet.color : '#666') + ';">' + braceletText + '</span></div>';
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
        var equipped = (player.weapon === item || player.shield === item || player.bracelet === item);

        // Show unidentified indicator
        var idIndicator = '';
        if (!item.identified) {
          idIndicator = ' <span style="color:#ff8a65;">[未識別]</span>';
        }

        var bgColor = isSelected ? '#1a2a3a' : 'transparent';
        var borderLeft = isSelected ? '3px solid #4fc3f7' : '3px solid transparent';

        // Color code by item type
        var typeColors = {
          weapon: '#ef5350', shield: '#42a5f5', grass: '#66bb6a',
          scroll: '#ffd54f', staff: '#ab47bc', food: '#ffb74d',
          pot: '#78909c', bracelet: '#4fc3f7', arrow: '#8d6e63'
        };
        var nameColor = typeColors[item.type] || '#e0e0e0';

        html += '<div style="padding:4px 8px;margin:2px 0;background:' + bgColor + ';border-left:' + borderLeft + ';cursor:pointer;">';
        html += '<span style="color:#888;">' + SLOT_LETTERS[i] + ')</span> ';
        html += '<span style="color:' + item.color + ';">' + item.char + '</span> ';
        html += '<span style="color:' + nameColor + ';">' + item.getDisplayName() + '</span>';
        if (equipped) html += ' <span style="color:#ffd700;">[装備中]</span>';
        html += idIndicator;
        html += '</div>';
      }
    }

    if (isIdentifyMode) {
      html += '<div style="color:#888;font-size:12px;margin-top:16px;border-top:1px solid #333;padding-top:8px;">';
      html += '[Enter/e]識別 [↑↓]選択 [ESC]キャンセル';
      html += '</div>';
    } else if (game.potPutMode) {
      html += '<div style="color:#888;font-size:12px;margin-top:16px;border-top:1px solid #333;padding-top:8px;">';
      html += '[Enter/e]壺に入れる [↑↓]選択 [ESC]キャンセル';
      html += '</div>';
    } else {
      // Show pot commands hint if pot is selected
      var selectedItem = player.inventory.length > 0 ? player.inventory[sel] : null;
      var potHint = (selectedItem && selectedItem.type === 'pot') ? ' [p]入れる [o]出す' : '';

      // Item description
      if (selectedItem && selectedItem.description) {
        html += '<div style="color:#8892b0;font-size:11px;margin-top:8px;border-top:1px solid #222;padding-top:6px;">';
        html += selectedItem.description;
        html += '</div>';
      }

      html += '<div style="color:#888;font-size:12px;margin-top:8px;border-top:1px solid #333;padding-top:8px;">';
      html += '[e]使う [E]装備 [d]置く [t]投げる [s]整理' + potHint + ' [↑↓]選択 [ESC]戻る';
      html += '</div>';
    }

    box.innerHTML = html;
    this.inventoryEl.style.display = 'flex';
  };

  UI.prototype.hideInventory = function() {
    this.inventoryEl.style.display = 'none';
  };

  // Render extinction enemy selection (ねだやしの巻物)
  UI.prototype.renderExtinctionSelect = function(game) {
    var box = this.inventoryBox;
    var sel = game.extinctionSelection;
    var candidates = game.extinctionCandidates;

    var html = '<div style="color:#f44336;font-size:18px;margin-bottom:12px;border-bottom:1px solid #333;padding-bottom:8px;">ねだやし - モンスターを選べ</div>';

    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      var isSelected = (i === sel);
      var bgColor = isSelected ? '#2a1a1a' : 'transparent';
      var borderLeft = isSelected ? '3px solid #f44336' : '3px solid transparent';
      html += '<div style="padding:4px 8px;margin:2px 0;background:' + bgColor + ';border-left:' + borderLeft + ';">';
      html += '<span style="color:#888;">' + SLOT_LETTERS[i] + ')</span> ';
      html += '<span style="color:#e0e0e0;">' + c.name + '</span>';
      html += '</div>';
    }

    html += '<div style="color:#888;font-size:12px;margin-top:16px;border-top:1px solid #333;padding-top:8px;">';
    html += '[Enter/e]決定 [↑↓]選択 [ESC]キャンセル';
    html += '</div>';

    box.innerHTML = html;
    this.inventoryEl.style.display = 'flex';
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