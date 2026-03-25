// Dungeon NPC System - Friendly wandering NPCs (Shiren-style)
// NPCs: 行商人 (Merchant), 鍛冶屋 (Blacksmith), 占い師 (Fortune Teller)
(function() {
  'use strict';

  // NPC type definitions
  var DUNGEON_NPC_TYPES = {
    merchant: {
      name: '行商人',
      char: '商',
      color: '#d4a574',
      sprite: 'npc_merchant',
      minFloor: 3,
      chance: 0.15,
      dialogue: 'いらっしゃい！ 旅の品をお安くしますよ。'
    },
    blacksmith: {
      name: '鍛冶屋',
      char: '鍛',
      color: '#e07050',
      sprite: 'npc_blacksmith',
      minFloor: 5,
      chance: 0.10,
      dialogue: '武器か盾を鍛えてやろうか？ 500ギタンだ。'
    },
    fortune_teller: {
      name: '占い師',
      char: '占',
      color: '#b388ff',
      sprite: 'npc_fortune',
      minFloor: 3,
      chance: 0.10,
      dialogue: '...見えるぞ。階段とワナの位置を教えてやろう。'
    }
  };

  // Generate dungeon NPCs for the current floor
  Game.prototype._generateDungeonNPCs = function(startRoom) {
    this.dungeonNPCs = [];
    var floorNum = this.floorNum;

    for (var typeId in DUNGEON_NPC_TYPES) {
      var npcType = DUNGEON_NPC_TYPES[typeId];
      if (floorNum < npcType.minFloor) continue;
      if (Math.random() >= npcType.chance) continue;

      // Pick a room that isn't the start room
      var candidates = [];
      for (var i = 1; i < this.dungeon.rooms.length; i++) {
        var r = this.dungeon.rooms[i];
        if (r.w >= 4 && r.h >= 4) candidates.push(r);
      }
      if (candidates.length === 0) continue;

      var room = candidates[Math.floor(Math.random() * candidates.length)];
      var placed = false;
      var attempts = 0;

      while (!placed && attempts < 20) {
        attempts++;
        var nx = room.x + 1 + Math.floor(Math.random() * Math.max(1, room.w - 2));
        var ny = room.y + 1 + Math.floor(Math.random() * Math.max(1, room.h - 2));

        if (this.dungeon.grid[ny][nx] === Dungeon.TILE.WALL) continue;
        if (this.dungeon.grid[ny][nx] === Dungeon.TILE.STAIRS_DOWN) continue;
        if (this.getEnemyAt(nx, ny)) continue;
        if (this.getItemAt(nx, ny)) continue;

        // Check other dungeon NPCs
        var occupied = false;
        for (var j = 0; j < this.dungeonNPCs.length; j++) {
          if (this.dungeonNPCs[j].x === nx && this.dungeonNPCs[j].y === ny) {
            occupied = true;
            break;
          }
        }
        if (occupied) continue;

        this.dungeonNPCs.push({
          x: nx,
          y: ny,
          type: typeId,
          name: npcType.name,
          char: npcType.char,
          color: npcType.color,
          sprite: npcType.sprite,
          dialogue: npcType.dialogue
        });
        placed = true;
      }
    }
  };

  // Get dungeon NPC adjacent to player
  Game.prototype.getAdjacentDungeonNPC = function() {
    if (!this.dungeonNPCs) return null;
    var p = this.player;
    for (var i = 0; i < this.dungeonNPCs.length; i++) {
      var npc = this.dungeonNPCs[i];
      if (Math.abs(npc.x - p.x) <= 1 && Math.abs(npc.y - p.y) <= 1 &&
          !(npc.x === p.x && npc.y === p.y)) {
        return npc;
      }
    }
    return null;
  };

  // Get dungeon NPC at position (for blocking movement)
  Game.prototype.getDungeonNPCAt = function(x, y) {
    if (!this.dungeonNPCs) return null;
    for (var i = 0; i < this.dungeonNPCs.length; i++) {
      if (this.dungeonNPCs[i].x === x && this.dungeonNPCs[i].y === y) {
        return this.dungeonNPCs[i];
      }
    }
    return null;
  };

  // Interact with dungeon NPC
  Game.prototype.interactDungeonNPC = function(npc) {
    var ui = this.ui;
    var player = this.player;

    ui.addMessage(npc.name + '「' + npc.dialogue + '」', 'system');

    switch (npc.type) {
      case 'merchant':
        this._merchantInteract(npc);
        break;
      case 'blacksmith':
        this._blacksmithInteract(npc);
        break;
      case 'fortune_teller':
        this._fortuneTellerInteract(npc);
        break;
    }
    return true;
  };

  // === Merchant: sell 3-5 random items at 1.5x price ===
  Game.prototype._merchantInteract = function(npc) {
    var ui = this.ui;

    // Generate merchant stock if not already generated
    if (!npc.stock) {
      npc.stock = [];
      var count = 3 + Math.floor(Math.random() * 3); // 3-5 items
      for (var i = 0; i < count; i++) {
        var itemKey = this._pickItemForFloor(this.floorNum);
        var item = new Item(0, 0, itemKey);
        item.identified = true;
        var price = Math.floor(item.getBuyPrice() * 1.5);
        npc.stock.push({ item: item, price: price });
      }
    }

    if (npc.stock.length === 0) {
      ui.addMessage('行商人「もう品物は売り切れだよ。」', 'system');
      return;
    }

    // Enter merchant mode
    this.merchantMode = npc;
    this.merchantSelection = 0;
    this._renderMerchantUI();
  };

  Game.prototype._renderMerchantUI = function() {
    var npc = this.merchantMode;
    var ui = this.ui;
    var box = ui.inventoryBox;
    var sel = this.merchantSelection;
    var SLOT_LETTERS = 'abcdefghijklmnopqrst';

    var html = '<div style="color:#d4a574;font-size:18px;margin-bottom:12px;border-bottom:1px solid #333;padding-bottom:8px;">行商人の品物</div>';
    html += '<div style="color:#888;font-size:12px;margin-bottom:8px;">所持金: ' + this.player.gold + 'ギタン</div>';

    for (var i = 0; i < npc.stock.length; i++) {
      var entry = npc.stock[i];
      var isSelected = (i === sel);
      var bgColor = isSelected ? '#1a2a3a' : 'transparent';
      var borderLeft = isSelected ? '3px solid #d4a574' : '3px solid transparent';
      html += '<div style="padding:4px 8px;margin:2px 0;background:' + bgColor + ';border-left:' + borderLeft + ';">';
      html += '<span style="color:#888;">' + SLOT_LETTERS[i] + ')</span> ';
      html += '<span style="color:' + entry.item.color + ';">' + entry.item.char + '</span> ';
      html += '<span style="color:#e0e0e0;">' + escapeHtml(entry.item.getDisplayName()) + '</span>';
      html += ' <span style="color:#ffd700;">' + entry.price + 'G</span>';
      html += '</div>';
    }

    html += '<div style="color:#888;font-size:12px;margin-top:16px;border-top:1px solid #333;padding-top:8px;">';
    html += '[Enter/e]購入 [↑↓]選択 [ESC]閉じる';
    html += '</div>';

    box.innerHTML = html;
    ui.inventoryEl.style.display = 'flex';
  };

  // === Blacksmith: upgrade weapon or shield +1 for 500 gold ===
  Game.prototype._blacksmithInteract = function(npc) {
    var ui = this.ui;
    var player = this.player;

    if (player.gold < 500) {
      ui.addMessage('鍛冶屋「500ギタン必要だぜ。金が足りないな。」', 'system');
      return;
    }

    if (!player.weapon && !player.shield) {
      ui.addMessage('鍛冶屋「武器も盾も装備してないじゃないか。」', 'system');
      return;
    }

    // Enter blacksmith mode
    this.blacksmithMode = npc;
    this.blacksmithSelection = 0;
    this._renderBlacksmithUI();
  };

  Game.prototype._renderBlacksmithUI = function() {
    var ui = this.ui;
    var player = this.player;
    var box = ui.inventoryBox;
    var sel = this.blacksmithSelection;

    var options = [];
    if (player.weapon) options.push({ label: player.weapon.getDisplayName(), target: 'weapon' });
    if (player.shield) options.push({ label: player.shield.getDisplayName(), target: 'shield' });

    var html = '<div style="color:#e07050;font-size:18px;margin-bottom:12px;border-bottom:1px solid #333;padding-bottom:8px;">鍛冶屋 - 強化 (500ギタン)</div>';
    html += '<div style="color:#888;font-size:12px;margin-bottom:8px;">所持金: ' + player.gold + 'ギタン</div>';
    html += '<div style="color:#aaa;font-size:12px;margin-bottom:8px;">どちらを+1強化する？</div>';

    for (var i = 0; i < options.length; i++) {
      var isSelected = (i === sel);
      var bgColor = isSelected ? '#1a2a3a' : 'transparent';
      var borderLeft = isSelected ? '3px solid #e07050' : '3px solid transparent';
      html += '<div style="padding:4px 8px;margin:2px 0;background:' + bgColor + ';border-left:' + borderLeft + ';">';
      html += '<span style="color:#e0e0e0;">' + escapeHtml(options[i].label) + '</span>';
      html += '</div>';
    }

    html += '<div style="color:#888;font-size:12px;margin-top:16px;border-top:1px solid #333;padding-top:8px;">';
    html += '[Enter/e]強化 [↑↓]選択 [ESC]キャンセル';
    html += '</div>';

    box.innerHTML = html;
    ui.inventoryEl.style.display = 'flex';
  };

  // === Fortune Teller: reveal stairs + traps ===
  Game.prototype._fortuneTellerInteract = function(npc) {
    var ui = this.ui;

    // Reveal stairs on minimap
    var stairs = this.dungeon.stairs;
    if (stairs) {
      // Mark stairs tile as explored
      this.explored[stairs.y][stairs.x] = true;
      // Also explore a small area around stairs
      for (var dy = -1; dy <= 1; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          var sx = stairs.x + dx;
          var sy = stairs.y + dy;
          if (sy >= 0 && sy < this.dungeon.height && sx >= 0 && sx < this.dungeon.width) {
            this.explored[sy][sx] = true;
          }
        }
      }
      ui.addMessage('占い師「...見えた。階段の位置をミニマップに表示した。」', 'heal');
    }

    // Reveal all traps
    for (var i = 0; i < this.traps.length; i++) {
      this.traps[i].visible = true;
    }
    ui.addMessage('占い師「...すべてのワナが見えるようになった。」', 'heal');

    // Mark as used so they say something different next time
    npc.used = true;
    npc.dialogue = 'もう占ったよ。気をつけてね。';
  };

})();
