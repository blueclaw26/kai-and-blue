// Keyboard Input Handling
var Input = (function() {
  'use strict';

  var KEY_MAP = {
    'ArrowUp': [0, -1],
    'ArrowDown': [0, 1],
    'ArrowLeft': [-1, 0],
    'ArrowRight': [1, 0],
    // Vi-keys (4-dir)
    'h': [-1, 0], 'H': [-1, 0],
    'j': [0, 1],  'J': [0, 1],
    'k': [0, -1], 'K': [0, -1],
    'l': [1, 0],  'L': [1, 0],
    // Vi-keys (diagonal)
    'y': [-1, -1], 'Y': [-1, -1],
    'u': [1, -1],  'U': [1, -1],
    'b': [-1, 1],  'B': [-1, 1],
    'n': [1, 1],   'N': [1, 1],
    // Numpad 8-direction
    'Numpad8': [0, -1],
    'Numpad2': [0, 1],
    'Numpad4': [-1, 0],
    'Numpad6': [1, 0],
    'Numpad7': [-1, -1],
    'Numpad9': [1, -1],
    'Numpad1': [-1, 1],
    'Numpad3': [1, 1]
  };

  var WAIT_KEYS = ['Numpad5', '.'];
  var DESCEND_KEYS = ['>', 'Enter'];

  var PREVENT_DEFAULT = [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5',
    'Numpad6', 'Numpad7', 'Numpad8', 'Numpad9'
  ];

  var SLOT_LETTERS = 'abcdefghijklmnopqrst';

  function Input(turnManager, game) {
    this.turnManager = turnManager;
    this.game = game;
    this._bound = this.handleKey.bind(this);
    document.addEventListener('keydown', this._bound);
  }

  Input.prototype.handleKey = function(e) {
    // Village scene handling
    // Inventory takes priority over scene (works in both village and dungeon)
    if (this.game.inventoryOpen) {
      this._handleInventoryKey(e);
      return;
    }

    // Foot menu mode
    if (this.game.footMenuOpen) {
      this._handleFootMenuKey(e);
      return;
    }

    // Throw direction mode
    if (this.game.throwMode) {
      this._handleThrowModeKey(e);
      return;
    }

    // Equipment detail mode
    if (this.game.equipDetailOpen) {
      e.preventDefault();
      this.game.equipDetailOpen = false;
      this.game.ui.hideInventory();
      return;
    }

    if (this.game.scene === 'village') {
      this._handleVillageKey(e);
      return;
    }

    if (this.game.gameOver || this.game.victory) return;

    // Sell confirmation mode (y/n)
    if (this.game.sellConfirmMode) {
      this._handleSellConfirm(e);
      return;
    }

    // Merchant mode
    if (this.game.merchantMode) {
      this._handleMerchantKey(e);
      return;
    }

    // Blacksmith mode
    if (this.game.blacksmithMode) {
      this._handleBlacksmithKey(e);
      return;
    }

    // Direction selection mode (for staves/throw)
    if (this.game.directionMode) {
      this._handleDirectionKey(e);
      return;
    }

    // Blank scroll mode (白紙の巻物)
    if (this.game.blankScrollMode) {
      this._handleBlankScrollKey(e);
      return;
    }

    // Extinction mode (ねだやしの巻物)
    if (this.game.extinctionMode) {
      this._handleExtinctionKey(e);
      return;
    }

    // Inventory mode (including identify mode)
    if (this.game.inventoryOpen) {
      if (this.game.identifyMode) {
        this._handleIdentifyKey(e);
      } else {
        this._handleInventoryKey(e);
      }
      return;
    }

    var code = e.code;
    var key = e.key;

    if (PREVENT_DEFAULT.indexOf(code) !== -1) {
      e.preventDefault();
    }

    // === Debug keys (F1-F8) — only available when DEBUG_MODE is true ===
    if (DEBUG_MODE) {
      if (key === 'F1') {
        e.preventDefault();
        if (window._autoPlayer) {
          window._autoPlayer.start(50);
        }
        return;
      }
      if (key === 'F2') {
        e.preventDefault();
        if (window._autoPlayer) {
          window._autoPlayer.start(10);
        }
        return;
      }
      if (key === 'F3') {
        e.preventDefault();
        if (window._autoPlayer) {
          window._autoPlayer.stop();
        }
        return;
      }
      if (key === 'F4') {
        e.preventDefault();
        var player = this.game.player;
        player.setGodMode(!player.isGodMode());
        var ui = this.game.ui;
        ui.addMessage('DEBUG: 無敵モード ' + (player.isGodMode() ? 'ON' : 'OFF'), 'debug');
        this.turnManager.processTurn(function() { return false; });
        return;
      }
      if (key === 'F5') {
        e.preventDefault();
        // Reveal entire floor
        var dungeon = this.game.dungeon;
        for (var ry = 0; ry < dungeon.height; ry++) {
          for (var rx = 0; rx < dungeon.width; rx++) {
            this.game.explored[ry][rx] = true;
          }
        }
        this.game.ui.addMessage('DEBUG: フロア全体を表示', 'debug');
        this.turnManager.processTurn(function() { return false; });
        return;
      }
      if (key === 'F6') {
        e.preventDefault();
        var p = this.game.player;
        for (var li = 0; li < 10; li++) {
          p.gainExp(9999, this.game.ui);
        }
        this.game.ui.addMessage('DEBUG: レベル+10', 'debug');
        this.turnManager.processTurn(function() { return false; });
        return;
      }
      if (key === 'F7') {
        e.preventDefault();
        var p = this.game.player;
        var goodItems = ['dotanuki', 'kabura', 'dragon_sword', 'heavy_shield', 'dragon_shield', 'otogiriso', 'big_onigiri', 'scroll_powerup'];
        for (var gi = 0; gi < goodItems.length && p.inventory.length < 20; gi++) {
          var newItem = new Item(0, 0, goodItems[gi]);
          newItem.identified = true;
          p.inventory.push(newItem);
        }
        this.game.ui.addMessage('DEBUG: アイテム追加', 'debug');
        this.turnManager.processTurn(function() { return false; });
        return;
      }
      if (key === 'F8') {
        e.preventDefault();
        var stairs = this.game.dungeon.stairs;
        this.game.player.moveTo(stairs.x, stairs.y);
        this.game.ui.addMessage('DEBUG: 階段にテレポート', 'debug');
        this.turnManager.processTurn(function() { return false; });
        return;
      }
    }

    // Pot put mode (select item to put in pot)
    if (this.game.potPutMode) {
      this._handlePotPutKey(e);
      return;
    }

    // Pot take mode (select item to take from pot)
    if (this.game.potTakeMode) {
      this._handlePotTakeKey(e);
      return;
    }

    // Auto-explore ('x' key)
    if (key === 'x' || key === 'X') {
      e.preventDefault();
      if (this.game.autoExploring) {
        this.game.autoExploring = false;
        this.game.ui.addMessage('自動探索を中止した', 'system');
        return;
      }
      this._startAutoExplore();
      return;
    }

    // Open inventory
    if (key === 'i' || key === 'I') {
      e.preventDefault();
      this.game.inventoryOpen = true;
      this.game.inventorySelection = 0;
      this.game.ui.renderInventory(this.game);
      return;
    }

    // Foot menu (f key) - open context menu for item at feet
    if ((key === 'f' || key === 'F') && this.game.scene === 'dungeon') {
      e.preventDefault();
      var footItem = this.game.getItemAt(this.game.player.x, this.game.player.y);
      if (footItem && !footItem.isGold) {
        this.game.footMenuOpen = true;
        this.game.footMenuItem = footItem;
        this.game.footMenuOptions = this._getFootMenuOptions(footItem);
        this.game.footMenuIndex = 0;
        this.game.ui.renderFootMenu(this.game);
        return;
      } else {
        this.game.ui.addMessage('足元には何もない', 'system');
        return;
      }
    }

    // Throw gold (ギタン投げ)
    if (key === 'G' && !e.ctrlKey) {
      e.preventDefault();
      var game = this.game;
      if (game.player.gold <= 0) {
        game.ui.addMessage('ギタンを持っていない', 'system');
        return;
      }
      game.ui.addMessage('どの方向にギタンを投げる？（方向キーで選択、Escでキャンセル） [' + Math.min(game.player.gold, 999) + 'G]', 'system');
      game.directionMode = {
        callback: function(dx, dy) {
          return game.throwGold(dx, dy);
        }
      };
      return;
    }

    // Pick up item / take shop item / pay debt
    if (key === 'g' || key === ',') {
      e.preventDefault();
      var game = this.game;
      this.turnManager.processTurn(function() {
        return game.pickUpItem();
      });
      return;
    }

    // Movement (with Shift for dash)
    var dir = KEY_MAP[code] || KEY_MAP[key];
    if (dir) {
      e.preventDefault();
      var game = this.game;
      var actualDir = dir;
      if (game.player.hasStatusEffect('confused')) {
        var allDirs = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]];
        actualDir = allDirs[Math.floor(Math.random() * allDirs.length)];
      }
      var moveDx = actualDir[0];
      var moveDy = actualDir[1];

      // Shift + direction = dash
      if (e.shiftKey && !game.player.hasStatusEffect('confused')) {
        this._startDash(moveDx, moveDy);
        return;
      }

      this.turnManager.processTurn(function() {
        return game.movePlayer(moveDx, moveDy);
      });
      if (this.game.isOnStairs()) {
        this.game.ui.addMessage('階段を見つけた！ (>キーで降りる)', 'system');
      }
      return;
    }

    // Wait
    if (WAIT_KEYS.indexOf(key) !== -1 || WAIT_KEYS.indexOf(code) !== -1) {
      this.turnManager.processTurn(function() { return true; });
      return;
    }

    // Interact with dungeon NPC (Enter key, before descend)
    if (key === 'Enter') {
      var dnpc = this.game.getAdjacentDungeonNPC ? this.game.getAdjacentDungeonNPC() : null;
      if (dnpc) {
        var g2 = this.game;
        this.turnManager.processTurn(function() {
          return g2.interactDungeonNPC(dnpc);
        });
        return;
      }
    }

    // Descend
    if (DESCEND_KEYS.indexOf(key) !== -1) {
      var g = this.game;
      this.turnManager.processTurn(function() {
        return g.descend();
      });
      return;
    }
  };

  // --- Merchant mode ---
  Input.prototype._handleMerchantKey = function(e) {
    e.preventDefault();
    var game = this.game;
    var ui = game.ui;
    var key = e.key;
    var npc = game.merchantMode;
    var SLOT_LETTERS = 'abcdefghijklmnopqrst';

    if (key === 'Escape') {
      game.merchantMode = null;
      ui.inventoryEl.style.display = 'none';
      return;
    }

    if (key === 'ArrowUp' || key === 'k') {
      game.merchantSelection = Math.max(0, game.merchantSelection - 1);
      game._renderMerchantUI();
      return;
    }
    if (key === 'ArrowDown' || key === 'j') {
      game.merchantSelection = Math.min(npc.stock.length - 1, game.merchantSelection + 1);
      game._renderMerchantUI();
      return;
    }

    var letterIdx = SLOT_LETTERS.indexOf(key);
    if (letterIdx !== -1 && letterIdx < npc.stock.length) {
      game.merchantSelection = letterIdx;
      game._renderMerchantUI();
      return;
    }

    if (key === 'Enter' || key === 'e') {
      if (npc.stock.length === 0) return;
      var entry = npc.stock[game.merchantSelection];
      if (game.player.gold < entry.price) {
        ui.addMessage('行商人「金が足りないよ。」', 'system');
        return;
      }
      if (game.player.inventory.length >= 20) {
        ui.addMessage('持ち物がいっぱいだ', 'system');
        return;
      }
      game.player.gold -= entry.price;
      game.player.inventory.push(entry.item);
      ui.addMessage(entry.item.getDisplayName() + 'を' + entry.price + 'ギタンで購入した', 'pickup');
      Sound.play('shop');
      npc.stock.splice(game.merchantSelection, 1);
      if (game.merchantSelection >= npc.stock.length) {
        game.merchantSelection = Math.max(0, npc.stock.length - 1);
      }
      if (npc.stock.length === 0) {
        game.merchantMode = null;
        ui.inventoryEl.style.display = 'none';
        ui.addMessage('行商人「まいどあり！ 全部売り切れだ！」', 'system');
      } else {
        game._renderMerchantUI();
      }
      this.turnManager.processTurn(function() { return true; });
      return;
    }
  };

  // --- Blacksmith mode ---
  Input.prototype._handleBlacksmithKey = function(e) {
    e.preventDefault();
    var game = this.game;
    var ui = game.ui;
    var player = game.player;
    var key = e.key;

    var options = [];
    if (player.weapon) options.push({ target: 'weapon', item: player.weapon });
    if (player.shield) options.push({ target: 'shield', item: player.shield });

    if (key === 'Escape') {
      game.blacksmithMode = null;
      ui.inventoryEl.style.display = 'none';
      ui.addMessage('鍛冶屋「また来いよ。」', 'system');
      return;
    }

    if (key === 'ArrowUp' || key === 'k') {
      game.blacksmithSelection = Math.max(0, game.blacksmithSelection - 1);
      game._renderBlacksmithUI();
      return;
    }
    if (key === 'ArrowDown' || key === 'j') {
      game.blacksmithSelection = Math.min(options.length - 1, game.blacksmithSelection + 1);
      game._renderBlacksmithUI();
      return;
    }

    if (key === 'Enter' || key === 'e') {
      if (options.length === 0) return;
      var selected = options[game.blacksmithSelection];
      if (player.gold < 500) {
        ui.addMessage('鍛冶屋「金が足りないぜ。」', 'system');
        return;
      }
      player.gold -= 500;
      selected.item.plus = (selected.item.plus || 0) + 1;
      player._recalcStats();
      Sound.play('equip');
      ui.addMessage('鍛冶屋「よし、+1強化したぞ！ ' + selected.item.getDisplayName() + '」', 'heal');
      game.blacksmithMode = null;
      ui.inventoryEl.style.display = 'none';
      this.turnManager.processTurn(function() { return true; });
      return;
    }
  };

  Input.prototype._handleSellConfirm = function(e) {
    e.preventDefault();
    var key = e.key;
    if (key === 'y' || key === 'Y') {
      this.game.confirmSell(true);
      // Re-render
      this.turnManager.processTurn(function() { return true; });
    } else if (key === 'n' || key === 'N' || key === 'Escape') {
      this.game.confirmSell(false);
      this.turnManager.processTurn(function() { return false; });
    }
  };

  Input.prototype._handleDirectionKey = function(e) {
    e.preventDefault();
    var game = this.game;
    var key = e.key;
    var code = e.code;

    if (key === 'Escape') {
      game.directionMode = null;
      game.ui.addMessage('キャンセルした', 'system');
      return;
    }

    var dir = KEY_MAP[code] || KEY_MAP[key];
    if (dir) {
      var callback = game.directionMode.callback;
      game.directionMode = null;

      var dx = dir[0];
      var dy = dir[1];
      this.turnManager.processTurn(function() {
        return callback(dx, dy);
      });
    }
  };

  // Identify mode: select an item to identify
  Input.prototype._handleIdentifyKey = function(e) {
    e.preventDefault();
    var game = this.game;
    var player = game.player;
    var ui = game.ui;
    var key = e.key;

    // Cancel
    if (key === 'Escape') {
      game.identifyMode = false;
      game.inventoryOpen = false;
      ui.hideInventory();
      this.turnManager.processTurn(function() { return false; });
      return;
    }

    // Navigate
    if (key === 'ArrowUp' || key === 'k') {
      game.inventorySelection = Math.max(0, game.inventorySelection - 1);
      ui.renderInventory(game);
      return;
    }
    if (key === 'ArrowDown' || key === 'j') {
      game.inventorySelection = Math.min(player.inventory.length - 1, game.inventorySelection + 1);
      ui.renderInventory(game);
      return;
    }

    // Select by letter
    var letterIdx = SLOT_LETTERS.indexOf(key);
    if (letterIdx !== -1 && letterIdx < player.inventory.length) {
      game.inventorySelection = letterIdx;
      ui.renderInventory(game);
      return;
    }

    // Confirm identification with Enter or 'e'
    if (key === 'Enter' || key === 'e') {
      if (player.inventory.length === 0) return;
      var selectedItem = player.inventory[game.inventorySelection];
      if (!selectedItem) return;

      game.identifyMode = false;
      game.inventoryOpen = false;
      ui.hideInventory();

      if (selectedItem.identified) {
        ui.addMessage(selectedItem.getDisplayName() + 'は既に識別済みだ', 'system');
      } else {
        var fakeName = selectedItem.getDisplayName();
        selectedItem.identify();
        ui.addMessage('それは' + selectedItem.getRealDisplayName() + 'だった！', 'pickup');
      }
      this.turnManager.processTurn(function() { return true; });
      return;
    }
  };

  // Blank scroll mode: select scroll effect to write
  Input.prototype._handleBlankScrollKey = function(e) {
    e.preventDefault();
    var game = this.game;
    var ui = game.ui;
    var key = e.key;
    var candidates = game.blankScrollCandidates;

    if (key === 'Escape') {
      game.blankScrollMode = false;
      game.inventoryOpen = false;
      ui.hideInventory();
      ui.addMessage('白紙の巻物を使うのをやめた', 'system');
      // Don't consume the scroll (it was already removed from inventory by useItem)
      // Actually, _useScroll returns true which triggers removal, so we need to re-add...
      // The scroll was already consumed. That's fine - canceling still uses it.
      this.turnManager.processTurn(function() { return true; });
      return;
    }

    if (key === 'ArrowUp' || key === 'k') {
      game.blankScrollSelection = Math.max(0, game.blankScrollSelection - 1);
      ui.renderBlankScrollSelect(game);
      return;
    }
    if (key === 'ArrowDown' || key === 'j') {
      game.blankScrollSelection = Math.min(candidates.length - 1, game.blankScrollSelection + 1);
      ui.renderBlankScrollSelect(game);
      return;
    }

    var SLOT_LETTERS = 'abcdefghijklmnopqrst';
    var letterIdx = SLOT_LETTERS.indexOf(key);
    if (letterIdx !== -1 && letterIdx < candidates.length) {
      game.blankScrollSelection = letterIdx;
      ui.renderBlankScrollSelect(game);
      return;
    }

    if (key === 'Enter' || key === 'e') {
      if (candidates.length === 0) {
        game.blankScrollMode = false;
        game.inventoryOpen = false;
        ui.hideInventory();
        ui.addMessage('書ける巻物がない！', 'system');
        this.turnManager.processTurn(function() { return true; });
        return;
      }
      var selected = candidates[game.blankScrollSelection];

      game.blankScrollMode = false;
      game.inventoryOpen = false;
      ui.hideInventory();

      ui.addMessage('白紙の巻物に「' + selected.name + '」と書いた！', 'heal');

      // Create a temporary scroll item and use it
      var tempScroll = new Item(0, 0, selected.key);
      tempScroll.identified = true;
      // Execute the scroll's effect directly
      tempScroll._useScroll(game, game.player);

      this.turnManager.processTurn(function() { return true; });
      return;
    }
  };

  // Extinction mode: select enemy type to banish
  Input.prototype._handleExtinctionKey = function(e) {
    e.preventDefault();
    var game = this.game;
    var ui = game.ui;
    var key = e.key;
    var candidates = game.extinctionCandidates;

    if (key === 'Escape') {
      game.extinctionMode = false;
      game.inventoryOpen = false;
      ui.hideInventory();
      ui.addMessage('ねだやしをやめた', 'system');
      this.turnManager.processTurn(function() { return true; });
      return;
    }

    if (key === 'ArrowUp' || key === 'k') {
      game.extinctionSelection = Math.max(0, game.extinctionSelection - 1);
      ui.renderExtinctionSelect(game);
      return;
    }
    if (key === 'ArrowDown' || key === 'j') {
      game.extinctionSelection = Math.min(candidates.length - 1, game.extinctionSelection + 1);
      ui.renderExtinctionSelect(game);
      return;
    }

    var SLOT_LETTERS = 'abcdefghijklmnopqrst';
    var letterIdx = SLOT_LETTERS.indexOf(key);
    if (letterIdx !== -1 && letterIdx < candidates.length) {
      game.extinctionSelection = letterIdx;
      ui.renderExtinctionSelect(game);
      return;
    }

    if (key === 'Enter' || key === 'e') {
      if (candidates.length === 0) return;
      var selected = candidates[game.extinctionSelection];

      game.extinctionMode = false;
      game.inventoryOpen = false;
      ui.hideInventory();

      // Add to extinct set
      game.extinctEnemies.add(selected.id);
      ui.addMessage(selected.name + 'は絶滅した！', 'heal');

      // Kill all existing enemies of that type
      for (var i = 0; i < game.enemies.length; i++) {
        var en = game.enemies[i];
        if (!en.dead && en.enemyId === selected.id) {
          en.dead = true;
        }
      }

      this.turnManager.processTurn(function() { return true; });
      return;
    }
  };

  Input.prototype._handleInventoryKey = function(e) {
    e.preventDefault();
    var game = this.game;
    var player = game.player;
    var ui = game.ui;
    var key = e.key;

    // Close inventory
    if (key === 'Escape' || key === 'i' || key === 'I') {
      game.inventoryOpen = false;
      ui.hideInventory();
      this.turnManager.processTurn(function() { return false; });
      return;
    }

    // Navigate selection with arrow keys
    if (key === 'ArrowUp' || key === 'k') {
      game.inventorySelection = Math.max(0, game.inventorySelection - 1);
      ui.renderInventory(game);
      return;
    }
    if (key === 'ArrowDown' || key === 'j') {
      game.inventorySelection = Math.min(player.inventory.length - 1, game.inventorySelection + 1);
      ui.renderInventory(game);
      return;
    }

    // Sort inventory
    if (key === 's' && player.inventory.length > 0) {
      var currentItem = player.inventory[game.inventorySelection];
      player.sortInventory();
      // Keep selection on same item
      var newIdx = player.inventory.indexOf(currentItem);
      if (newIdx !== -1) game.inventorySelection = newIdx;
      else game.inventorySelection = 0;
      ui.addMessage('持ち物を整理した', 'system');
      ui.renderInventory(game);
      return;
    }

    // Equipment detail view (D key)
    if (key === 'D' && player.inventory.length > 0) {
      var detailItem = player.inventory[game.inventorySelection];
      if (detailItem && (detailItem.type === 'weapon' || detailItem.type === 'shield')) {
        game.inventoryOpen = false;
        ui.hideInventory();
        game.equipDetailOpen = true;
        ui.renderEquipDetail(game, detailItem);
        return;
      }
    }

    // Action keys take priority over slot selection
    if ((key === 'e' || key === 'E' || key === 'd' || key === 't') && player.inventory.length > 0) {
      var selectedItem = player.inventory[game.inventorySelection];
      if (selectedItem) {
        // Let it fall through to action handlers below
      }
    } else {
      // Select item by letter (a-t)
      var letterIdx = SLOT_LETTERS.indexOf(key);
      if (letterIdx !== -1 && letterIdx < player.inventory.length) {
        game.inventorySelection = letterIdx;
        ui.renderInventory(game);
        return;
      }
    }

    // Select by number keys 1-9, 0
    if (key >= '1' && key <= '9') {
      var numIdx = parseInt(key) - 1;
      if (numIdx < player.inventory.length) {
        game.inventorySelection = numIdx;
        ui.renderInventory(game);
      }
      return;
    }
    if (key === '0') {
      if (9 < player.inventory.length) {
        game.inventorySelection = 9;
        ui.renderInventory(game);
      }
      return;
    }

    // No item selected guard
    if (player.inventory.length === 0) return;
    var selectedItem = player.inventory[game.inventorySelection];
    if (!selectedItem) return;

    // Use item
    if (key === 'e') {
      game.inventoryOpen = false;
      ui.hideInventory();
      var item = selectedItem;
      this.turnManager.processTurn(function() {
        return game.useItem(item);
      });
      return;
    }

    // Equip item
    if (key === 'E') {
      game.inventoryOpen = false;
      ui.hideInventory();
      var item = selectedItem;
      this.turnManager.processTurn(function() {
        return player.equip(item, ui);
      });
      return;
    }

    // Drop item
    if (key === 'd') {
      game.inventoryOpen = false;
      ui.hideInventory();
      var item = selectedItem;
      this.turnManager.processTurn(function() {
        return game.dropItem(item);
      });
      return;
    }

    // Put item into pot
    if (key === 'p') {
      if (selectedItem && selectedItem.type === 'pot') {
        if (!selectedItem.contents) selectedItem.contents = [];
        if (selectedItem.contents.length >= selectedItem.capacity) {
          ui.addMessage('壺がいっぱいだ', 'system');
          return;
        }
        game.inventoryOpen = false;
        ui.hideInventory();
        // Enter pot put mode - show inventory minus the pot itself
        game.potPutMode = { pot: selectedItem };
        game.inventoryOpen = true;
        game.inventorySelection = 0;
        ui.addMessage('どのアイテムを入れる？', 'system');
        ui.renderInventory(game);
        return;
      }
      return;
    }

    // Take item out of pot
    if (key === 'o') {
      if (selectedItem && selectedItem.type === 'pot') {
        if (selectedItem.effect !== 'storage' && selectedItem.effect !== 'synthesis') {
          ui.addMessage('この壺からは取り出せない！', 'system');
          return;
        }
        if (!selectedItem.contents || selectedItem.contents.length === 0) {
          ui.addMessage('壺は空だ', 'system');
          return;
        }
        game.inventoryOpen = false;
        ui.hideInventory();
        game.potTakeMode = { pot: selectedItem };
        game.inventoryOpen = true;
        game.inventorySelection = 0;
        ui.addMessage('どのアイテムを取り出す？', 'system');
        ui.renderInventory(game);
        return;
      }
      return;
    }

    // Throw item
    if (key === 't') {
      game.inventoryOpen = false;
      ui.hideInventory();
      var item = selectedItem;
      ui.addMessage('どの方向に投げる？（方向キーで選択、Escでキャンセル）', 'system');
      game.throwMode = true;
      game.throwModeItem = item;
      return;
    }
  };

  // --- Foot menu helpers ---
  Input.prototype._getFootMenuOptions = function(item) {
    var options = [];
    switch (item.type) {
      case 'grass':
        options.push({ label: '飲む', action: 'drink' });
        options.push({ label: '投げる', action: 'throw' });
        options.push({ label: '拾う', action: 'pickup' });
        break;
      case 'scroll':
        options.push({ label: '読む', action: 'read' });
        options.push({ label: '投げる', action: 'throw' });
        options.push({ label: '拾う', action: 'pickup' });
        break;
      case 'food':
        options.push({ label: '食べる', action: 'eat' });
        options.push({ label: '投げる', action: 'throw' });
        options.push({ label: '拾う', action: 'pickup' });
        break;
      case 'staff':
        options.push({ label: '振る', action: 'use' });
        options.push({ label: '投げる', action: 'throw' });
        options.push({ label: '拾う', action: 'pickup' });
        break;
      case 'weapon':
      case 'shield':
      case 'bracelet':
        options.push({ label: '装備する', action: 'equip' });
        options.push({ label: '投げる', action: 'throw' });
        options.push({ label: '拾う', action: 'pickup' });
        break;
      case 'pot':
        options.push({ label: '入れる', action: 'put_in_pot' });
        options.push({ label: '投げる', action: 'throw' });
        options.push({ label: '拾う', action: 'pickup' });
        break;
      case 'arrow':
        options.push({ label: '撃つ', action: 'shoot' });
        options.push({ label: '投げる', action: 'throw' });
        options.push({ label: '拾う', action: 'pickup' });
        break;
      case 'incense':
        options.push({ label: '焚く', action: 'use' });
        options.push({ label: '投げる', action: 'throw' });
        options.push({ label: '拾う', action: 'pickup' });
        break;
      default:
        options.push({ label: '拾う', action: 'pickup' });
        break;
    }
    return options;
  };

  Input.prototype._handleFootMenuKey = function(e) {
    e.preventDefault();
    var game = this.game;
    var key = e.key;

    if (key === 'ArrowUp' || key === 'k') {
      game.footMenuIndex = Math.max(0, game.footMenuIndex - 1);
      game.ui.renderFootMenu(game);
      return;
    }
    if (key === 'ArrowDown' || key === 'j') {
      game.footMenuIndex = Math.min(game.footMenuOptions.length - 1, game.footMenuIndex + 1);
      game.ui.renderFootMenu(game);
      return;
    }
    if (key === 'Enter' || key === 'e') {
      var option = game.footMenuOptions[game.footMenuIndex];
      var item = game.footMenuItem;
      game.footMenuOpen = false;
      game.ui.hideInventory();
      this._executeFootMenuAction(game, option, item);
      return;
    }
    if (key === 'Escape') {
      game.footMenuOpen = false;
      game.ui.hideInventory();
      return;
    }
  };

  Input.prototype._executeFootMenuAction = function(game, option, item) {
    var ui = game.ui;
    var player = game.player;
    var self = this;

    switch (option.action) {
      case 'pickup':
        self.turnManager.processTurn(function() {
          return game.pickUpItem();
        });
        break;
      case 'drink':
      case 'read':
      case 'eat':
      case 'use':
        // Pick up the item first, then use it
        if (!player.canPickUp()) {
          ui.addMessage('持ち物がいっぱいだ', 'system');
          return;
        }
        game.removeItem(item);
        player.inventory.push(item);
        self.turnManager.processTurn(function() {
          return game.useItem(item);
        });
        break;
      case 'equip':
        // Pick up and equip
        if (!player.canPickUp()) {
          ui.addMessage('持ち物がいっぱいだ', 'system');
          return;
        }
        game.removeItem(item);
        player.inventory.push(item);
        self.turnManager.processTurn(function() {
          return player.equip(item, ui);
        });
        break;
      case 'throw':
        // Pick up and enter throw direction mode
        if (!player.canPickUp()) {
          ui.addMessage('持ち物がいっぱいだ', 'system');
          return;
        }
        game.removeItem(item);
        player.inventory.push(item);
        ui.addMessage('どの方向に投げる？（方向キーで選択、Escでキャンセル）', 'system');
        game.throwMode = true;
        game.throwModeItem = item;
        break;
      case 'shoot':
        // Pick up and shoot arrow
        if (!player.canPickUp()) {
          ui.addMessage('持ち物がいっぱいだ', 'system');
          return;
        }
        game.removeItem(item);
        player.inventory.push(item);
        ui.addMessage('どの方向に撃つ？（方向キーで選択、Escでキャンセル）', 'system');
        game.directionMode = {
          item: item,
          callback: function(dx, dy) {
            game.shootArrow(item, dx, dy);
          }
        };
        break;
      case 'put_in_pot':
        // Pick up the pot, then enter pot put mode
        if (!player.canPickUp()) {
          ui.addMessage('持ち物がいっぱいだ', 'system');
          return;
        }
        if (!item.contents) item.contents = [];
        if (item.contents.length >= item.capacity) {
          ui.addMessage('壺がいっぱいだ', 'system');
          return;
        }
        game.removeItem(item);
        player.inventory.push(item);
        game.potPutMode = { pot: item };
        game.inventoryOpen = true;
        game.inventorySelection = 0;
        ui.addMessage('どのアイテムを入れる？', 'system');
        ui.renderInventory(game);
        break;
    }
  };

  // --- Throw direction mode (8-directional) ---
  Input.prototype._handleThrowModeKey = function(e) {
    e.preventDefault();
    var game = this.game;
    var key = e.key;
    var code = e.code;

    if (key === 'Escape') {
      game.throwMode = false;
      game.throwModeItem = null;
      game.ui.addMessage('キャンセルした', 'system');
      return;
    }

    var dir = this._getDirectionFromKey(key, code);
    if (dir) {
      var item = game.throwModeItem;
      game.throwMode = false;
      game.throwModeItem = null;
      this.turnManager.processTurn(function() {
        return game.throwItem(item, dir.dx, dir.dy);
      });
    }
  };

  Input.prototype._getDirectionFromKey = function(key, code) {
    // Use KEY_MAP which already has full 8-direction support
    var dir = KEY_MAP[code] || KEY_MAP[key];
    if (dir) {
      return { dx: dir[0], dy: dir[1] };
    }
    return null;
  };

  // --- Dash movement ---
  Input.prototype._startDash = function(dx, dy) {
    var game = this.game;
    var self = this;

    function shouldStopDash(g, p, ddx, ddy) {
      var nx = p.x + ddx, ny = p.y + ddy;
      // Can't move there
      if (!p.canMoveTo(nx, ny, g.dungeon)) return true;
      // Enemy at target
      if (g.getEnemyAt(nx, ny)) return true;
      // Enemy adjacent to current position
      for (var edy = -1; edy <= 1; edy++) {
        for (var edx = -1; edx <= 1; edx++) {
          if (edx === 0 && edy === 0) continue;
          if (g.getEnemyAt(p.x + edx, p.y + edy)) return true;
        }
      }
      // Room transition
      var currentRoom = g.getRoomAt(p.x, p.y);
      var nextRoom = g.getRoomAt(nx, ny);
      if (currentRoom !== nextRoom) return true;
      // Item on next tile
      if (g.getItemAt(nx, ny)) return true;
      // Visible trap
      if (g.getVisibleTrapAt(nx, ny)) return true;
      // Stairs
      if (g.dungeon.grid[ny][nx] === Dungeon.TILE.STAIRS_DOWN) return true;
      return false;
    }

    function dashStep() {
      if (game.gameOver || game.victory) return;
      if (shouldStopDash(game, game.player, dx, dy)) return;

      self.turnManager.processTurn(function() {
        return game.movePlayer(dx, dy);
      });

      if (game.gameOver || game.victory) return;

      // Continue dash with brief delay
      setTimeout(dashStep, 30);
    }

    // First step always moves
    self.turnManager.processTurn(function() {
      return game.movePlayer(dx, dy);
    });

    if (!game.gameOver && !game.victory) {
      setTimeout(dashStep, 30);
    }
  };

  // --- Pot put mode ---
  Input.prototype._handlePotPutKey = function(e) {
    e.preventDefault();
    var game = this.game;
    var player = game.player;
    var ui = game.ui;
    var key = e.key;
    var pot = game.potPutMode.pot;

    if (key === 'Escape') {
      game.potPutMode = null;
      game.inventoryOpen = false;
      ui.hideInventory();
      return;
    }

    if (key === 'ArrowUp' || key === 'k') {
      game.inventorySelection = Math.max(0, game.inventorySelection - 1);
      ui.renderInventory(game);
      return;
    }
    if (key === 'ArrowDown' || key === 'j') {
      game.inventorySelection = Math.min(player.inventory.length - 1, game.inventorySelection + 1);
      ui.renderInventory(game);
      return;
    }

    var SLOT_LETTERS = 'abcdefghijklmnopqrst';
    var letterIdx = SLOT_LETTERS.indexOf(key);
    if (letterIdx !== -1 && letterIdx < player.inventory.length) {
      game.inventorySelection = letterIdx;
      ui.renderInventory(game);
      return;
    }

    if (key === 'Enter' || key === 'e') {
      if (player.inventory.length === 0) return;
      var selectedItem = player.inventory[game.inventorySelection];
      if (!selectedItem || selectedItem === pot) {
        ui.addMessage('それは選べない', 'system');
        return;
      }

      game.potPutMode = null;
      game.inventoryOpen = false;
      ui.hideInventory();

      var thePot = pot;
      var theItem = selectedItem;
      this.turnManager.processTurn(function() {
        return game.putItemInPot(thePot, theItem);
      });
    }
  };

  // --- Pot take mode ---
  Input.prototype._handlePotTakeKey = function(e) {
    e.preventDefault();
    var game = this.game;
    var ui = game.ui;
    var key = e.key;
    var pot = game.potTakeMode.pot;

    if (key === 'Escape') {
      game.potTakeMode = null;
      game.inventoryOpen = false;
      ui.hideInventory();
      return;
    }

    if (!pot.contents || pot.contents.length === 0) {
      game.potTakeMode = null;
      game.inventoryOpen = false;
      ui.hideInventory();
      ui.addMessage('壺は空だ', 'system');
      return;
    }

    if (key === 'ArrowUp' || key === 'k') {
      game.inventorySelection = Math.max(0, game.inventorySelection - 1);
      this._renderPotContents(pot);
      return;
    }
    if (key === 'ArrowDown' || key === 'j') {
      game.inventorySelection = Math.min(pot.contents.length - 1, game.inventorySelection + 1);
      this._renderPotContents(pot);
      return;
    }

    var SLOT_LETTERS = 'abcdefghijklmnopqrst';
    var letterIdx = SLOT_LETTERS.indexOf(key);
    if (letterIdx !== -1 && letterIdx < pot.contents.length) {
      game.inventorySelection = letterIdx;
      this._renderPotContents(pot);
      return;
    }

    if (key === 'Enter' || key === 'e') {
      var idx = game.inventorySelection;
      game.potTakeMode = null;
      game.inventoryOpen = false;
      ui.hideInventory();

      var thePot = pot;
      var theIdx = idx;
      this.turnManager.processTurn(function() {
        return game.takeItemFromPot(thePot, theIdx);
      });
    }
  };

  Input.prototype._renderPotContents = function(pot) {
    var game = this.game;
    var ui = game.ui;
    var box = ui.inventoryBox;
    var sel = game.inventorySelection;
    var SLOT_LETTERS = 'abcdefghijklmnopqrst';

    var html = '<div style="color:#e8a44a;font-size:18px;margin-bottom:12px;border-bottom:1px solid #333;padding-bottom:8px;">壺の中身</div>';

    if (!pot.contents || pot.contents.length === 0) {
      html += '<div style="color:#666;padding:16px 0;">空っぽ</div>';
    } else {
      for (var i = 0; i < pot.contents.length; i++) {
        var item = pot.contents[i];
        var isSelected = (i === sel);
        var bgColor = isSelected ? '#1a2a3a' : 'transparent';
        var borderLeft = isSelected ? '3px solid #4fc3f7' : '3px solid transparent';
        html += '<div style="padding:4px 8px;margin:2px 0;background:' + bgColor + ';border-left:' + borderLeft + ';">';
        html += '<span style="color:#888;">' + SLOT_LETTERS[i] + ')</span> ';
        html += '<span style="color:' + item.color + ';">' + escapeHtml(item.char) + '</span> ';
        html += '<span style="color:#e0e0e0;">' + escapeHtml(item.getDisplayName()) + '</span>';
        html += '</div>';
      }
    }

    html += '<div style="color:#888;font-size:12px;margin-top:16px;border-top:1px solid #333;padding-top:8px;">';
    html += '[Enter/e]取り出す [↑↓]選択 [ESC]キャンセル';
    html += '</div>';

    box.innerHTML = html;
    ui.inventoryEl.style.display = 'flex';
  };

  // === Village input handling ===
  Input.prototype._handleVillageKey = function(e) {
    var game = this.game;
    var ui = game.ui;
    var key = e.key;
    var code = e.code;

    if (PREVENT_DEFAULT.indexOf(code) !== -1) {
      e.preventDefault();
    }

    // Storage mode
    if (game.storageMode) {
      this._handleStorageKey(e);
      return;
    }

    // Dungeon entrance confirmation
    if (game.dungeonConfirm) {
      e.preventDefault();
      if (key === 'y' || key === 'Y') {
        game.dungeonConfirm = false;
        game.enterDungeon();
        if (window._renderer) window._renderer.render(game);
        if (Sound.bgm) Sound.bgm.switchTrack('dungeon');
        ui.updateStatus(game);
      } else if (key === 'n' || key === 'N' || key === 'Escape') {
        game.dungeonConfirm = false;
        ui.addMessage('やめておこう', 'system');
      }
      return;
    }

    // Village shop mode
    if (game.villageShopMode) {
      this._handleVillageShopKey(e);
      return;
    }

    // Village blacksmith mode
    if (game.villageBlacksmithMode) {
      this._handleVillageBlacksmithKey(e);
      return;
    }

    // Village dialog mode
    if (game.villageDialogMode) {
      e.preventDefault();
      var npc = game.villageDialogMode;
      game.villageDialogMode = null;
      if (npc.type === 'storage' && (key === 'y' || key === 'Y' || key === 'Enter')) {
        game.storageMode = true;
        game.storageSelection = 0;
        game.storageAction = null;
        this._renderStorageUI();
        return;
      }
      // Just dismiss
      return;
    }

    // Movement
    var dir = KEY_MAP[code] || KEY_MAP[key];
    if (dir) {
      e.preventDefault();
      game.villageMove(dir[0], dir[1]);
      if (window._renderer) window._renderer.render(game);
      ui.updateStatus(game);
      return;
    }

    // Talk to NPC (Enter key)
    if (key === 'Enter') {
      e.preventDefault();
      var npc = game.getAdjacentNpc();
      if (npc) {
        switch (npc.type) {
          case 'storage':
            ui.addMessage(npc.name + '「' + npc.dialogue + '」', 'system');
            ui.addMessage('倉庫を使いますか？ (y/n)', 'system');
            game.villageDialogMode = npc;
            break;
          case 'shop':
            ui.addMessage(npc.name + '「' + npc.dialogue + '」', 'system');
            game._villageShopInteract();
            break;
          case 'blacksmith':
            ui.addMessage(npc.name + '「' + npc.dialogue + '」', 'system');
            game._villageBlacksmithInteract();
            break;
          case 'info':
            var tips = [
              '合成の壺に同じ種類の武器を入れると合成できるぞ',
              'ドラゴンキラーはドラゴンに強いぞ',
              '店で泥棒するとえらい目に遭うぞ',
              '腹が減ると力が出ない。おにぎりを持っていけ',
              'モンスターハウスに出くわしたら逃げるのも手だ',
              '杖は敵に振ると効果があるぞ',
              '鍛冶屋で武器を鍛えれば攻撃力が上がるぞ',
              '盾も鍛えれば防御力が上がる。忘れるなよ',
              '巻物は読むと効果を発揮するぞ',
              '水路の上にレアなアイテムが落ちていることがあるぞ'
            ];
            var tip = tips[Math.floor(Math.random() * tips.length)];
            ui.addMessage(npc.name + '「' + tip + '」', 'system');
            break;
          case 'child':
            var childLines = [
              'ねーねー、冒険者さん！ 強いモンスターいた？',
              'ボクも大きくなったら冒険者になるんだ！',
              '今日はいい天気だねー！',
              'お兄ちゃん、お腹空いてない？',
              'この前、変な巻物を拾ったんだ！ ...捨てちゃったけど',
              '村長のおじいちゃんって昔は冒険者だったんだって！'
            ];
            var childLine = childLines[Math.floor(Math.random() * childLines.length)];
            ui.addMessage(npc.name + '「' + childLine + '」', 'system');
            break;
          case 'cat':
            ui.addMessage(npc.name + '「にゃー」', 'system');
            break;
          default:
            ui.addMessage(npc.name + '「' + npc.dialogue + '」', 'system');
            break;
        }
      }
      return;
    }

    // Open inventory in village
    if (key === 'i' || key === 'I') {
      e.preventDefault();
      game.inventoryOpen = true;
      game.inventorySelection = 0;
      ui.renderInventory(game);
      return;
    }
  };

  // Storage UI
  Input.prototype._handleStorageKey = function(e) {
    e.preventDefault();
    var game = this.game;
    var ui = game.ui;
    var key = e.key;

    if (key === 'Escape') {
      game.storageMode = false;
      game.storageAction = null;
      ui.hideInventory();
      game._saveStorage();
      return;
    }

    if (!game.storageAction) {
      // Main storage menu: choose put or take
      if (key === 'p' || key === 'P' || key === '1') {
        if (game.player.inventory.length === 0) {
          ui.addMessage('預けるアイテムがない', 'system');
          return;
        }
        if (game.storage.length >= 20) {
          ui.addMessage('倉庫がいっぱいだ（最大20個）', 'system');
          return;
        }
        game.storageAction = 'put';
        game.storageSelection = 0;
        this._renderStoragePutUI();
        return;
      }
      if (key === 't' || key === 'T' || key === '2') {
        if (game.storage.length === 0) {
          ui.addMessage('倉庫は空だ', 'system');
          return;
        }
        if (game.player.inventory.length >= 20) {
          ui.addMessage('持ち物がいっぱいだ', 'system');
          return;
        }
        game.storageAction = 'take';
        game.storageSelection = 0;
        this._renderStorageTakeUI();
        return;
      }
      return;
    }

    // Put/Take selection
    if (key === 'ArrowUp' || key === 'k') {
      game.storageSelection = Math.max(0, game.storageSelection - 1);
      if (game.storageAction === 'put') this._renderStoragePutUI();
      else this._renderStorageTakeUI();
      return;
    }
    if (key === 'ArrowDown' || key === 'j') {
      var maxSel = game.storageAction === 'put' ? game.player.inventory.length - 1 : game.storage.length - 1;
      game.storageSelection = Math.min(maxSel, game.storageSelection + 1);
      if (game.storageAction === 'put') this._renderStoragePutUI();
      else this._renderStorageTakeUI();
      return;
    }

    // Letter selection
    var letterIdx = SLOT_LETTERS.indexOf(key);
    if (letterIdx !== -1) {
      var maxItems = game.storageAction === 'put' ? game.player.inventory.length : game.storage.length;
      if (letterIdx < maxItems) {
        game.storageSelection = letterIdx;
        if (game.storageAction === 'put') this._renderStoragePutUI();
        else this._renderStorageTakeUI();
      }
      return;
    }

    if (key === 'Enter' || key === 'e') {
      if (game.storageAction === 'put') {
        if (game.player.inventory.length === 0) return;
        if (game.storage.length >= 20) {
          ui.addMessage('倉庫がいっぱいだ', 'system');
          return;
        }
        var item = game.player.inventory[game.storageSelection];
        if (!item) return;
        // Unequip if equipped
        if (game.player.weapon === item) { game.player.weapon = null; game.player._recalcStats(); }
        if (game.player.shield === item) { game.player.shield = null; game.player._recalcStats(); }
        if (game.player.bracelet === item) { game.player.bracelet = null; game.player._recalcStats(); }
        game.player.removeFromInventory(item);
        game.storage.push(item);
        game._saveStorage();
        ui.addMessage(item.getDisplayName() + 'を倉庫に預けた', 'pickup');
        game.storageSelection = Math.min(game.storageSelection, game.player.inventory.length - 1);
        if (game.storageSelection < 0) game.storageSelection = 0;
        this._renderStoragePutUI();
      } else if (game.storageAction === 'take') {
        if (game.storage.length === 0) return;
        if (game.player.inventory.length >= 20) {
          ui.addMessage('持ち物がいっぱいだ', 'system');
          return;
        }
        var item = game.storage[game.storageSelection];
        if (!item) return;
        game.storage.splice(game.storageSelection, 1);
        item.identified = true; // storage items are identified
        game.player.inventory.push(item);
        game._saveStorage();
        ui.addMessage(item.getDisplayName() + 'を引き出した', 'pickup');
        game.storageSelection = Math.min(game.storageSelection, game.storage.length - 1);
        if (game.storageSelection < 0) game.storageSelection = 0;
        this._renderStorageTakeUI();
      }
      return;
    }

    // Back to main storage menu
    if (key === 'Backspace' || key === 'q') {
      game.storageAction = null;
      this._renderStorageUI();
      return;
    }
  };

  Input.prototype._renderStorageUI = function() {
    var game = this.game;
    var ui = game.ui;
    var box = ui.inventoryBox;

    var html = '<div style="color:#e8a44a;font-size:18px;margin-bottom:12px;border-bottom:1px solid #333;padding-bottom:8px;">倉庫 (' + game.storage.length + '/20)</div>';
    html += '<div style="padding:8px 0;">';
    html += '<div style="padding:4px 8px;cursor:pointer;">[p/1] アイテムを預ける</div>';
    html += '<div style="padding:4px 8px;cursor:pointer;">[t/2] アイテムを引き出す</div>';
    html += '</div>';

    if (game.storage.length > 0) {
      html += '<div style="color:#888;font-size:12px;margin-top:8px;border-top:1px solid #333;padding-top:8px;">倉庫の中身:</div>';
      for (var i = 0; i < game.storage.length; i++) {
        var item = game.storage[i];
        html += '<div style="padding:2px 8px;color:#aaa;font-size:12px;">';
        html += '<span style="color:' + item.color + ';">' + escapeHtml(item.char) + '</span> ';
        html += escapeHtml(item.getDisplayName());
        html += '</div>';
      }
    }

    html += '<div style="color:#888;font-size:12px;margin-top:16px;border-top:1px solid #333;padding-top:8px;">[ESC]閉じる</div>';
    box.innerHTML = html;
    ui.inventoryEl.style.display = 'flex';
  };

  Input.prototype._renderStoragePutUI = function() {
    var game = this.game;
    var ui = game.ui;
    var box = ui.inventoryBox;
    var sel = game.storageSelection;
    var player = game.player;

    var html = '<div style="color:#e8a44a;font-size:18px;margin-bottom:12px;border-bottom:1px solid #333;padding-bottom:8px;">預けるアイテムを選べ</div>';

    for (var i = 0; i < player.inventory.length; i++) {
      var item = player.inventory[i];
      var isSelected = (i === sel);
      var equipped = '';
      if (player.weapon === item) equipped = ' <span style="color:#e8a44a;">[装備中]</span>';
      if (player.shield === item) equipped = ' <span style="color:#e8a44a;">[装備中]</span>';
      if (player.bracelet === item) equipped = ' <span style="color:#e8a44a;">[装備中]</span>';
      var bgColor = isSelected ? '#1a2a3a' : 'transparent';
      var borderLeft = isSelected ? '3px solid #4fc3f7' : '3px solid transparent';
      html += '<div style="padding:4px 8px;margin:2px 0;background:' + bgColor + ';border-left:' + borderLeft + ';">';
      html += '<span style="color:#888;">' + SLOT_LETTERS[i] + ')</span> ';
      html += '<span style="color:' + item.color + ';">' + escapeHtml(item.char) + '</span> ';
      html += escapeHtml(item.getDisplayName()) + equipped;
      html += '</div>';
    }

    html += '<div style="color:#888;font-size:12px;margin-top:16px;border-top:1px solid #333;padding-top:8px;">[Enter/e]預ける [↑↓]選択 [q]戻る [ESC]閉じる</div>';
    box.innerHTML = html;
    ui.inventoryEl.style.display = 'flex';
  };

  // --- Auto-explore ---
  Input.prototype._startAutoExplore = function() {
    var game = this.game;
    var self = this;

    game.autoExploring = true;
    game.ui.addMessage('自動探索中... (xキーで停止)', 'system');

    // Listen for any key to stop (add with delay so the initiating key doesn't trigger it)
    var stopListener = function(e) {
      if (game.autoExploring) {
        game.autoExploring = false;
        game.ui.addMessage('自動探索を中止した', 'system');
      }
      document.removeEventListener('keydown', stopListener);
      document.addEventListener('keydown', self._bound);
    };
    // Remove existing handler temporarily, add stop listener after a tick
    document.removeEventListener('keydown', self._bound);
    setTimeout(function() {
      if (game.autoExploring) {
        document.addEventListener('keydown', stopListener);
      }
    }, 100);

    function autoStep() {
      function stopAutoExplore(msg, msgType) {
        game.autoExploring = false;
        document.removeEventListener('keydown', stopListener);
        document.addEventListener('keydown', self._bound);
        if (msg) game.ui.addMessage(msg, msgType || 'system');
        if (window._renderer) window._renderer.render(game);
      }

      if (!game.autoExploring || game.gameOver || game.victory) {
        stopAutoExplore();
        return;
      }

      // Stop conditions
      var player = game.player;

      // Enemy in FOV
      for (var ei = 0; ei < game.enemies.length; ei++) {
        var en = game.enemies[ei];
        if (!en.dead && game.visible[en.y] && game.visible[en.y][en.x]) {
          stopAutoExplore('敵を発見！ 自動探索を中止した');
          return;
        }
      }

      // HP low
      if (player.hp < player.maxHp * 0.3) {
        stopAutoExplore('HPが低い！ 自動探索を中止した', 'damage');
        return;
      }

      // Satiety low
      if (player.satiety < 20) {
        stopAutoExplore('お腹が空いてきた！ 自動探索を中止した', 'damage');
        return;
      }

      // On stairs
      if (game.isOnStairs()) {
        stopAutoExplore('階段を発見！ 自動探索を中止した');
        return;
      }

      // BFS to find nearest unexplored walkable tile
      var target = self._findNearestUnexplored(game);
      if (!target) {
        stopAutoExplore('探索できる場所がない');
        return;
      }

      // Move one step toward target
      var dx = 0, dy = 0;
      if (target.firstStep) {
        dx = target.firstStep.x - player.x;
        dy = target.firstStep.y - player.y;
      }

      if (dx === 0 && dy === 0) {
        stopAutoExplore();
        return;
      }

      self.turnManager.processTurn(function() {
        return game.movePlayer(dx, dy);
      });

      // Check if we picked up an item (stop)
      var itemOnTile = game.getItemAt(player.x, player.y);
      if (itemOnTile) {
        stopAutoExplore();
        return;
      }

      // Check if trap triggered (stop)
      if (game.gameOver || !game.autoExploring) {
        stopAutoExplore();
        return;
      }

      // Continue with delay
      setTimeout(autoStep, 50);
    }

    setTimeout(autoStep, 50);
  };

  Input.prototype._findNearestUnexplored = function(game) {
    var player = game.player;
    var dungeon = game.dungeon;
    var explored = game.explored;

    var queue = [{ x: player.x, y: player.y, firstStep: null }];
    var visited = {};
    visited[player.x + ',' + player.y] = true;
    var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

    while (queue.length > 0) {
      var current = queue.shift();

      for (var d = 0; d < dirs.length; d++) {
        var nx = current.x + dirs[d][0];
        var ny = current.y + dirs[d][1];
        var key = nx + ',' + ny;

        if (visited[key]) continue;
        visited[key] = true;

        if (nx < 0 || nx >= dungeon.width || ny < 0 || ny >= dungeon.height) continue;
        var tile = dungeon.grid[ny][nx];
        if (tile === Dungeon.TILE.WALL) continue;

        var firstStep = current.firstStep || { x: nx, y: ny };

        // If this tile is unexplored, it's our target
        if (!explored[ny][nx]) {
          return { x: nx, y: ny, firstStep: firstStep };
        }

        // Check if first step is blocked by an enemy
        if (!current.firstStep) {
          // This is the immediate neighbor - check if enemy is there
          var enemyBlocking = game.getEnemyAt(nx, ny);
          if (enemyBlocking) continue;
        }

        queue.push({ x: nx, y: ny, firstStep: firstStep });
      }
    }

    return null; // No unexplored tiles reachable
  };

  // === Village Shop key handler ===
  Input.prototype._handleVillageShopKey = function(e) {
    e.preventDefault();
    var game = this.game;
    var ui = game.ui;
    var player = game.player;
    var key = e.key;
    var SLOT_LETTERS = 'abcdefghijklmnopqrst';
    var stock = [
      { key: 'onigiri', price: 100 },
      { key: 'herb', price: 200 },
      { key: 'scroll_map', price: 300 },
      { key: 'arrow_wood', price: 150, count: 5 }
    ];

    if (key === 'Escape') {
      game.villageShopMode = null;
      ui.inventoryEl.style.display = 'none';
      return;
    }

    if (key === 'ArrowUp' || key === 'k') {
      game.villageShopSelection = Math.max(0, game.villageShopSelection - 1);
      game._renderVillageShopUI();
      return;
    }
    if (key === 'ArrowDown' || key === 'j') {
      game.villageShopSelection = Math.min(stock.length - 1, game.villageShopSelection + 1);
      game._renderVillageShopUI();
      return;
    }

    var letterIdx = SLOT_LETTERS.indexOf(key);
    if (letterIdx !== -1 && letterIdx < stock.length) {
      game.villageShopSelection = letterIdx;
      game._renderVillageShopUI();
      return;
    }

    if (key === 'Enter' || key === 'e') {
      var entry = stock[game.villageShopSelection];
      if (!entry) return;
      if (player.gold < entry.price) {
        ui.addMessage('道具屋「ギタンが足りないな」', 'system');
        return;
      }
      if (player.inventory.length >= 20) {
        ui.addMessage('持ち物がいっぱいだ', 'system');
        return;
      }
      player.gold -= entry.price;
      var newItem = new Item(0, 0, entry.key);
      newItem.identified = true;
      if (entry.count) newItem.count = entry.count;
      player.inventory.push(newItem);
      Sound.play('shop');
      ui.addMessage(newItem.getDisplayName() + 'を' + entry.price + 'ギタンで購入した', 'pickup');
      game._renderVillageShopUI();
      ui.updateStatus(game);
      return;
    }
  };

  // === Village Blacksmith key handler ===
  Input.prototype._handleVillageBlacksmithKey = function(e) {
    e.preventDefault();
    var game = this.game;
    var ui = game.ui;
    var player = game.player;
    var key = e.key;

    var options = [];
    if (player.weapon) options.push({ target: 'weapon', item: player.weapon });
    if (player.shield) options.push({ target: 'shield', item: player.shield });
    options.push({ target: 'cancel' });

    if (key === 'Escape') {
      game.villageBlacksmithMode = null;
      ui.inventoryEl.style.display = 'none';
      ui.addMessage('鍛冶屋「また来いよ。」', 'system');
      return;
    }

    if (key === 'ArrowUp' || key === 'k') {
      game.villageBlacksmithSelection = Math.max(0, game.villageBlacksmithSelection - 1);
      game._renderVillageBlacksmithUI();
      return;
    }
    if (key === 'ArrowDown' || key === 'j') {
      game.villageBlacksmithSelection = Math.min(options.length - 1, game.villageBlacksmithSelection + 1);
      game._renderVillageBlacksmithUI();
      return;
    }

    if (key === 'Enter' || key === 'e') {
      var selected = options[game.villageBlacksmithSelection];
      if (!selected) return;
      if (selected.target === 'cancel') {
        game.villageBlacksmithMode = null;
        ui.inventoryEl.style.display = 'none';
        ui.addMessage('鍛冶屋「また来いよ。」', 'system');
        return;
      }
      if (player.gold < 500) {
        ui.addMessage('鍛冶屋「ギタンが足りないな。500ギタン必要だぜ。」', 'system');
        return;
      }
      player.gold -= 500;
      selected.item.plus = (selected.item.plus || 0) + 1;
      player._recalcStats();
      Sound.play('equip');
      ui.addMessage('鍛冶屋「よし、+1強化したぞ！ ' + selected.item.getDisplayName() + '」', 'heal');
      game.villageBlacksmithMode = null;
      ui.inventoryEl.style.display = 'none';
      ui.updateStatus(game);
      return;
    }
  };

  Input.prototype._renderStorageTakeUI = function() {
    var game = this.game;
    var ui = game.ui;
    var box = ui.inventoryBox;
    var sel = game.storageSelection;

    var html = '<div style="color:#e8a44a;font-size:18px;margin-bottom:12px;border-bottom:1px solid #333;padding-bottom:8px;">引き出すアイテムを選べ</div>';

    for (var i = 0; i < game.storage.length; i++) {
      var item = game.storage[i];
      var isSelected = (i === sel);
      var bgColor = isSelected ? '#1a2a3a' : 'transparent';
      var borderLeft = isSelected ? '3px solid #4fc3f7' : '3px solid transparent';
      html += '<div style="padding:4px 8px;margin:2px 0;background:' + bgColor + ';border-left:' + borderLeft + ';">';
      html += '<span style="color:#888;">' + SLOT_LETTERS[i] + ')</span> ';
      html += '<span style="color:' + item.color + ';">' + escapeHtml(item.char) + '</span> ';
      html += escapeHtml(item.getDisplayName());
      html += '</div>';
    }

    html += '<div style="color:#888;font-size:12px;margin-top:16px;border-top:1px solid #333;padding-top:8px;">[Enter/e]引き出す [↑↓]選択 [q]戻る [ESC]閉じる</div>';
    box.innerHTML = html;
    ui.inventoryEl.style.display = 'flex';
  };

  return Input;
})();
