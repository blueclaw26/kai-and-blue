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

  // Slot letters a-t for inventory selection
  var SLOT_LETTERS = 'abcdefghijklmnopqrst';

  function Input(turnManager, game) {
    this.turnManager = turnManager;
    this.game = game;
    this._bound = this.handleKey.bind(this);
    document.addEventListener('keydown', this._bound);
  }

  Input.prototype.handleKey = function(e) {
    if (this.game.gameOver || this.game.victory) return;

    // Inventory mode
    if (this.game.inventoryOpen) {
      this._handleInventoryKey(e);
      return;
    }

    var code = e.code;
    var key = e.key;

    if (PREVENT_DEFAULT.indexOf(code) !== -1) {
      e.preventDefault();
    }

    // Open inventory
    if (key === 'i' || key === 'I') {
      e.preventDefault();
      this.game.inventoryOpen = true;
      this.game.inventorySelection = 0;
      this.game.ui.renderInventory(this.game);
      return;
    }

    // Pick up item
    if (key === 'g' || key === ',') {
      e.preventDefault();
      var game = this.game;
      this.turnManager.processTurn(function() {
        return game.pickUpItem();
      });
      return;
    }

    // Movement (removed WASD to avoid conflicts with inventory keys)
    var dir = KEY_MAP[code] || KEY_MAP[key];
    if (dir) {
      e.preventDefault();
      var game = this.game;
      // Confused: randomize movement direction
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
        this.game.ui.addMessage('階段を見つけた！ (>キーで降りる)');
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
      // Re-render game
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

    // Select item by letter (a-t)
    var letterIdx = SLOT_LETTERS.indexOf(key);
    if (letterIdx !== -1 && letterIdx < player.inventory.length) {
      game.inventorySelection = letterIdx;
      ui.renderInventory(game);
      return;
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
  };

  return Input;
})();
