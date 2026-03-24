// Game Initialization
(function() {
  'use strict';

  window.addEventListener('DOMContentLoaded', function() {
    var canvas = document.getElementById('game-canvas');
    var minimapCanvas = document.getElementById('minimap-canvas');
    var statusEl = document.getElementById('status-bar');
    var logEl = document.getElementById('message-log');

    var game = new Game();
    var renderer = new Renderer(canvas, minimapCanvas);
    var ui = new UI(statusEl, logEl);
    var turnManager = new TurnManager(game, renderer, ui);

    game.init(ui);

    // Initial render
    renderer.render(game);
    ui.updateStatus(game);

    // Bind input
    new Input(turnManager, game);

    // Restart button
    var restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', function() {
        window.location.reload();
      });
    }
  });
})();
