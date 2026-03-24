// Keyboard Input Handling
var Input = (function() {
  'use strict';

  var KEY_MAP = {
    // Arrow keys
    'ArrowUp': [0, -1],
    'ArrowDown': [0, 1],
    'ArrowLeft': [-1, 0],
    'ArrowRight': [1, 0],
    // WASD
    'w': [0, -1], 'W': [0, -1],
    'a': [-1, 0], 'A': [-1, 0],
    's': [0, 1],  'S': [0, 1],
    'd': [1, 0],  'D': [1, 0],
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

  function Input(turnManager, game) {
    this.turnManager = turnManager;
    this.game = game;
    this._bound = this.handleKey.bind(this);
    document.addEventListener('keydown', this._bound);
  }

  Input.prototype.handleKey = function(e) {
    if (this.game.gameOver) return;

    var code = e.code;
    var key = e.key;

    if (PREVENT_DEFAULT.indexOf(code) !== -1) {
      e.preventDefault();
    }

    // Movement
    var dir = KEY_MAP[code] || KEY_MAP[key];
    if (dir) {
      e.preventDefault();
      var game = this.game;
      this.turnManager.processTurn(function() {
        return game.movePlayer(dir[0], dir[1]);
      });
      // Check if player stepped on stairs
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

  return Input;
})();
