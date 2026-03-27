// Turn Management
var TurnManager = (function() {
  'use strict';

  function TurnManager(game, renderer, ui) {
    this.game = game;
    this.renderer = renderer;
    this.ui = ui;
  }

  TurnManager.prototype.processTurn = function(action) {
    var p = this.game.player;

    // Check if player is sleeping - can't act
    if (p.isSleeping()) {
      this.ui.addMessage('眠っていて動けない...', 'damage');
      p.totalTurns++;
      p.tickStatusEffects(this.ui);
      p.tickSatiety(this.ui);
      p.tickBuffs();

      if (!this.game.gameOver) {
        this.game.processEnemyTurns();
      }

      this.renderer.render(this.game);
      this.ui.updateStatus(this.game);
      return true;
    }

    // Check if player is slowed and should skip this turn
    if (p.isSlowedSkip()) {
      this.ui.addMessage('足が重くて動けない...', 'damage');
      // Still tick status effects and enemy turns
      p.totalTurns++;
      p.tickStatusEffects(this.ui);
      p.tickSatiety(this.ui);
      p.tickBuffs();

      if (!this.game.gameOver) {
        this.game.processEnemyTurns();
      }

      this.renderer.render(this.game);
      this.ui.updateStatus(this.game);
      return true;
    }

    // Player action
    var result = action();

    if (result) {
      p.totalTurns++;

      // Tick status effects
      p.tickStatusEffects(this.ui);

      // Satiety decrease
      var satietyResult = p.tickSatiety(this.ui);
      if (satietyResult === 'dead') {
        this.game.gameOver = true;
        this.ui.addMessage('空腹で倒れてしまった... ' + this.game.floorNum + 'Fで力尽きた', 'damage');
        this.ui.showGameOver(this.game.floorNum, p.level);
      }

      // Natural HP recovery (Shiren 6 style: scales with level)
      if (!this.game.gameOver) {
        p.naturalHeal();
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
