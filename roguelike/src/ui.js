// UI - Status bar, message log, inventory overlay
var UI = (function() {
  'use strict';

  var MAX_MESSAGES = 10;
  var SLOT_LETTERS = 'abcdefghijklmnopqrst';

  // Message type colors + bullet colors
  // HTML escape helper to prevent XSS from user-controllable data (e.g. localStorage item names)
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  // Export for use in other modules
  window.escapeHtml = escapeHtml;

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

    var win = document.createElement('div');
    win.className = 'inventory-window';

    overlay.appendChild(win);
    document.body.appendChild(overlay);
    this.inventoryEl = overlay;
    this.inventoryBox = win;
  };

  // Map message types to CSS class suffixes
  var MSG_TYPE_CLASS = {
    attack: 'msg-attack',
    damage: 'msg-damage',
    heal: 'msg-heal',
    levelup: 'msg-levelup',
    pickup: 'msg-pickup',
    enemy_special: 'msg-enemy_special',
    system: 'msg-system',
    normal: 'msg-system',
    debug: 'msg-debug'
  };

  UI.prototype.addMessage = function(text, type) {
    type = type || 'normal';
    var color = MSG_COLORS[type] || MSG_COLORS.normal;
    this.messages.push({ text: text, type: type, color: color });
    if (this.messages.length > MAX_MESSAGES) {
      this.messages.shift();
    }
    this._renderLog();
  };

  UI.prototype._renderLog = function() {
    // Clear existing content
    while (this.logEl.firstChild) {
      this.logEl.removeChild(this.logEl.firstChild);
    }

    for (var i = 0; i < this.messages.length; i++) {
      var msg = this.messages[i];
      var isLatest = (i === this.messages.length - 1);
      var opacity = 0.35 + 0.65 * ((i + 1) / this.messages.length);

      var line = document.createElement('div');
      var typeClass = MSG_TYPE_CLASS[msg.type] || 'msg-system';
      line.className = 'msg-line ' + typeClass + (isLatest ? ' msg-latest' : '');
      line.style.color = msg.color;
      line.style.opacity = opacity.toFixed(2);
      line.textContent = msg.text;

      this.logEl.appendChild(line);
    }
    this.logEl.scrollTop = this.logEl.scrollHeight;
  };

  function getZoneName(floorNum) {
    if (floorNum <= 10) return '洞窟';
    if (floorNum <= 25) return '地底湖';
    if (floorNum <= 50) return '溶岩洞';
    if (floorNum <= 75) return '凍土';
    return '深淵';
  }

  UI.prototype.updateStatus = function(game) {
    var p = game.player;

    // Floor info
    var floorInfo = document.getElementById('floor-info');
    if (floorInfo) {
      if (game.scene === 'village') {
        floorInfo.textContent = '拠点の村';
        floorInfo.style.color = '#66bb6a';
      } else {
        var zoneName = getZoneName(game.floorNum);
        floorInfo.textContent = game.floorNum + 'F ' + zoneName;
        floorInfo.style.color = '#e8a44a';
      }
    }

    // HP bar
    var hpFill = document.getElementById('hp-bar-fill');
    var hpTextEl = document.getElementById('hp-text');
    if (hpFill && hpTextEl) {
      var hpPercent = Math.max(0, (p.hp / p.maxHp) * 100);
      hpFill.style.width = hpPercent + '%';
      if (hpPercent > 50) hpFill.style.background = '#66bb6a';
      else if (hpPercent > 25) hpFill.style.background = '#ffa726';
      else hpFill.style.background = '#ef5350';
      hpTextEl.textContent = p.hp + '/' + p.maxHp;
    }

    // Level
    var levelTextEl = document.getElementById('level-text');
    if (levelTextEl) levelTextEl.textContent = 'Lv.' + p.level;

    // Satiety
    var satTextEl = document.getElementById('satiety-text');
    if (satTextEl) {
      var sat = Math.floor(p.satiety);
      satTextEl.textContent = '🍙 ' + sat;
      satTextEl.style.color = sat > 30 ? '#b0b8c8' : sat > 10 ? '#ffa726' : '#ef5350';
    }

    // Gold
    var goldTextEl = document.getElementById('gold-text');
    if (goldTextEl) {
      var goldDisplay = p.gold || 0;
      if (game.shopDebt > 0) {
        goldTextEl.textContent = '💰 ' + goldDisplay + ' (未払:' + game.shopDebt + ')';
        goldTextEl.style.color = '#ef5350';
      } else {
        goldTextEl.textContent = '💰 ' + goldDisplay;
        goldTextEl.style.color = '#ffd700';
      }
    }

    // Equipment bar
    var weaponEl = document.getElementById('equip-weapon');
    var shieldEl = document.getElementById('equip-shield');
    var braceletEl = document.getElementById('equip-bracelet');
    if (weaponEl) weaponEl.textContent = '⚔ ' + (p.weapon ? p.weapon.getDisplayName() : 'なし');
    if (shieldEl) shieldEl.textContent = '🛡 ' + (p.shield ? p.shield.getDisplayName() : 'なし');
    if (braceletEl) braceletEl.textContent = '◎ ' + (p.bracelet ? p.bracelet.getDisplayName() : 'なし');

    // Status effects
    var effectsEl = document.getElementById('status-effects');
    if (effectsEl) {
      var effectText = p.getStatusEffectText ? p.getStatusEffectText() : '';
      effectsEl.textContent = effectText;
    }

    this._updateSidePanel(game);
  };

  UI.prototype._updateSidePanel = function(game) {
    var player = game.player;

    var equipEl = document.getElementById('side-equip');
    if (equipEl) {
      var slots = equipEl.querySelectorAll('.equip-slot');
      var equips = [
        { item: player.weapon, icon: '⚔', fallback: 'なし' },
        { item: player.shield, icon: '🛡', fallback: 'なし' },
        { item: player.bracelet, icon: '◎', fallback: 'なし' }
      ];
      for (var i = 0; i < slots.length && i < equips.length; i++) {
        var nameEl = slots[i].querySelector('.equip-name');
        if (nameEl) {
          var eq = equips[i];
          nameEl.textContent = eq.item ? eq.item.getDisplayName() : eq.fallback;
          nameEl.style.color = eq.item ? (eq.item.color || '#ccc') : '#666';
        }
      }
    }

    var turnEl = document.getElementById('side-turns');
    if (turnEl) {
      turnEl.textContent = player.totalTurns;
    }

    // Hide debug section if not in debug mode
    var debugSection = document.getElementById('sec-debug');
    if (debugSection && !DEBUG_MODE) {
      debugSection.style.display = 'none';
      var debugTitle = debugSection.parentElement.querySelector('.panel-title');
      if (debugTitle) debugTitle.style.display = 'none';
    }
  };

  UI.prototype.renderInventory = function(game) {
    var player = game.player;
    var sel = game.inventorySelection;
    var box = this.inventoryBox;
    var isIdentifyMode = game.identifyMode;

    var titleText = isIdentifyMode ? '識別するアイテムを選べ' : '持ち物 (' + player.inventory.length + '/20)';
    var html = '<div class="inventory-title">' + escapeHtml(titleText) + '</div>';
    html += '<div class="inv-items">';

    if (player.inventory.length === 0) {
      html += '<div class="inv-empty">持ち物はない</div>';
    } else {
      for (var i = 0; i < player.inventory.length; i++) {
        var item = player.inventory[i];
        var isSelected = (i === sel);
        var equipped = (player.weapon === item || player.shield === item || player.bracelet === item);

        html += '<div class="inv-item' + (isSelected ? ' selected' : '') + '">';
        html += '<span class="inv-slot">' + SLOT_LETTERS[i] + ')</span>';
        html += '<span class="inv-char" style="color:' + item.color + ';">' + item.char + '</span>';
        html += '<span class="inv-name">' + escapeHtml(item.getDisplayName()) + '</span>';
        if (equipped) html += '<span class="equipped-tag">[装備中]</span>';
        if (!item.identified) html += '<span class="unid-tag">[未識別]</span>';
        html += '</div>';
      }
    }
    html += '</div>';

    // Description area
    if (!isIdentifyMode && !game.potPutMode) {
      var selectedItem = player.inventory.length > 0 ? player.inventory[sel] : null;
      if (selectedItem && selectedItem.description) {
        html += '<div class="inv-desc">' + escapeHtml(selectedItem.description) + '</div>';
      }
    }

    // Action hints
    html += '<div class="inv-actions">';
    if (isIdentifyMode) {
      html += '<span>[Enter/e]</span>識別 <span>[↑↓]</span>選択 <span>[ESC]</span>キャンセル';
    } else if (game.potPutMode) {
      html += '<span>[Enter/e]</span>壺に入れる <span>[↑↓]</span>選択 <span>[ESC]</span>キャンセル';
    } else {
      var selectedItem2 = player.inventory.length > 0 ? player.inventory[sel] : null;
      var potHint = (selectedItem2 && selectedItem2.type === 'pot') ? ' <span>[p]</span>入れる <span>[o]</span>出す' : '';
      html += '<span>[e]</span>使う <span>[E]</span>装備 <span>[d]</span>置く <span>[t]</span>投げる <span>[s]</span>整理' + potHint + ' <span>[↑↓]</span>選択 <span>[ESC]</span>戻る';
    }
    html += '</div>';

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

    var html = '<div class="inventory-title" style="color:#f44336;">ねだやし - モンスターを選べ</div>';
    html += '<div class="inv-items">';

    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      var isSelected = (i === sel);
      html += '<div class="inv-item' + (isSelected ? ' selected' : '') + '" style="' + (isSelected ? 'border-left-color:#f44336;background:rgba(244,67,54,0.1);' : '') + '">';
      html += '<span class="inv-slot">' + SLOT_LETTERS[i] + ')</span>';
      html += '<span class="inv-name">' + escapeHtml(c.name) + '</span>';
      html += '</div>';
    }

    html += '</div>';
    html += '<div class="inv-actions"><span>[Enter/e]</span>決定 <span>[↑↓]</span>選択 <span>[ESC]</span>キャンセル</div>';

    box.innerHTML = html;
    this.inventoryEl.style.display = 'flex';
  };

  // Render blank scroll selection (白紙の巻物)
  UI.prototype.renderBlankScrollSelect = function(game) {
    var box = this.inventoryBox;
    var sel = game.blankScrollSelection;
    var candidates = game.blankScrollCandidates;

    var html = '<div class="inventory-title" style="color:#fafafa;">白紙の巻物 - 何を書く？</div>';
    html += '<div class="inv-items">';

    if (candidates.length === 0) {
      html += '<div class="inv-empty">書ける巻物がない（巻物を識別しよう）</div>';
    } else {
      for (var i = 0; i < candidates.length; i++) {
        var c = candidates[i];
        var isSelected = (i === sel);
        html += '<div class="inv-item' + (isSelected ? ' selected' : '') + '">';
        html += '<span class="inv-slot">' + SLOT_LETTERS[i] + ')</span>';
        html += '<span class="inv-char" style="color:#fafafa;">?</span>';
        html += '<span class="inv-name">' + escapeHtml(c.name) + '</span>';
        html += '</div>';
      }
    }

    html += '</div>';
    html += '<div class="inv-actions"><span>[Enter/e]</span>決定 <span>[↑↓]</span>選択 <span>[ESC]</span>キャンセル</div>';

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