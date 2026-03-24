// Turn Management
var TurnManager = (function() {
  'use strict';

  function TurnManager(game, renderer, ui) {
    this.game = game;
    this.renderer = renderer;
    this.ui = ui;
  }

  TurnManager.prototype.processTurn = function(action) {
    // Player action
    var result = action();

    if (result) {
      // Enemy turns
      this.game.processEnemyTurns();
    }

    // Render
    this.renderer.render(this.game);
    this.ui.updateStatus(this.game);

    return result;
  };

  return TurnManager;
})();
