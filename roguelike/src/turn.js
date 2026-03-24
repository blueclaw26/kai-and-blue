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
      // Natural HP regen (1 HP per turn, ~1/200 maxHp equivalent feel)
      var p = this.game.player;
      if (p.hp < p.maxHp && p.hp > 0) {
        // Regen counter: heal 1 HP every few turns based on maxHp
        if (!p._regenCounter) p._regenCounter = 0;
        p._regenCounter++;
        var regenRate = Math.max(2, Math.floor(p.maxHp / 5)); // heal 1 HP every N turns
        if (p._regenCounter >= regenRate) {
          p.hp = Math.min(p.maxHp, p.hp + 1);
          p._regenCounter = 0;
        }
      }

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
