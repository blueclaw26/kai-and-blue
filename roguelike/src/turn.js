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

    // Future: enemy turns here
    // this.game.enemies.forEach(function(e) { e.act(); });

    // Render
    this.renderer.render(this.game);
    this.ui.updateStatus(this.game.player);

    return result;
  };

  return TurnManager;
})();
