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
    if (this.game.gameOver || this.game.victory) return;

    // Sell confirmation mode (y/n)
    if (this.game.sellConfirmMode) {
      this._handleSellConfirm(e);
      return;
    }

    // Direction selection mode (for staves/throw)
    if (this.game.directionMode) {
      this._handleDirectionKey(e);
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

    // === Debug keys (F1-F8) ===
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
      player.godMode = !player.godMode;
      var ui = this.game.ui;
      ui.addMessage('DEBUG: 無敵モード ' + (player.godMode ? 'ON' : 'OFF'), 'debug');
      this.turnManager.processTurn(function() { return false; });
      return;
    }
    if (key === 'F5') {
      e.preventDefault();
      // Reveal entire floor
      var dungeon = this.game.dungeon;
      for (var ry = 0; ry < dungeon.height; ry++) {
        for (var rx = 0; rx < dungeon.width; rx++) {
          this.game.explored.add(rx + ',' + ry);
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

    // Open inventory
    if (key === 'i' || key === 'I') {
      e.preventDefault();
      this.game.inventoryOpen = true;
      this.game.inventorySelection = 0;
      this.game.ui.renderInventory(this.game);
      return;
    }

    // Pick up item / buy in shop
    if (key === 'g' || key === ',') {
      e.preventDefault();
      var game = this.game;
      this.turnManager.processTurn(function() {
        return game.pickUpItem();
      });
      return;
    }

    // Movement
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

    // Descend
    if (DESCEND_KEYS.indexOf(key) !== -1) {
      var g = this.game;
      this.turnManager.processTurn(function() {
        return g.descend();
      });
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

    // Throw item
    if (key === 't') {
      game.inventoryOpen = false;
      ui.hideInventory();
      var item = selectedItem;
      ui.addMessage('どの方向に投げる？（方向キーで選択、Escでキャンセル）', 'system');
      game.directionMode = {
        item: item,
        callback: function(dx, dy) {
          return game.throwItem(item, dx, dy);
        }
      };
      this.turnManager.processTurn(function() { return false; });
      return;
    }
  };

  return Input;
})();