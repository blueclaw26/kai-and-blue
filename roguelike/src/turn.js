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
      var p = this.game.player;
      p.totalTurns++;

      // Satiety decrease
      var satietyResult = p.tickSatiety(this.ui);
      if (satietyResult === 'dead') {
        this.game.gameOver = true;
        this.ui.addMessage('空腹で倒れてしまった... ' + this.game.floorNum + 'Fで力尽きた');
        this.ui.showGameOver(this.game.floorNum, p.level);
      }

      // Natural HP regen only when satiety > 0
      if (!this.game.gameOver && p.satiety > 0 && p.hp < p.maxHp && p.hp > 0) {
        if (!p._regenCounter) p._regenCounter = 0;
        p._regenCounter++;
        var regenRate = Math.max(2, Math.floor(p.maxHp / 5));
        if (p._regenCounter >= regenRate) {
          p.hp = Math.min(p.maxHp, p.hp + 1);
          p._regenCounter = 0;
        }
      }

      // Enemy turns
      if (!this.game.gameOver) {
        this.game.processEnemyTurns();
      }
    }

    // Render
    this.renderer.render(this.game);
    this.ui.updateStatus(this.game);

    return result;
  };

  return TurnManager;
})();
