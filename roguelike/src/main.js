// Game Initialization
(function() {
  'use strict';

  window.addEventListener('DOMContentLoaded', function() {
    var canvas = document.getElementById('game-canvas');
    var minimapCanvas = document.getElementById('minimap-canvas');
    var statusEl = document.getElementById('status-bar');
    var logEl = document.getElementById('message-log');
    var titleOverlay = document.getElementById('title-overlay');
    var started = false;

    function startGame() {
      if (started) return;
      started = true;

      // Hide title screen
      if (titleOverlay) titleOverlay.style.display = 'none';

      // Initialize audio context on user interaction
      Sound.init();

      var game = new Game();
      var renderer = new Renderer(canvas, minimapCanvas);
      var ui = new UI(statusEl, logEl);
      var turnManager = new TurnManager(game, renderer, ui);

      game.init(ui);

      // Initial render
      renderer.render(game);
      ui.updateStatus(game);

      // Start BGM
      if (Sound.bgm) {
        Sound.bgm.play('dungeon');
      }

      // Expose globals for debug/autoplay
      window._game = game;
      window._renderer = renderer;
      window._ui = ui;
      window._turnManager = turnManager;
      window._autoPlayer = new AutoPlayer(game, turnManager, ui, renderer);

      // Bind input
      new Input(turnManager, game);

      // Restart buttons
      var restartBtn = document.getElementById('restart-btn');
      if (restartBtn) {
        restartBtn.addEventListener('click', function() {
          window.location.reload();
        });
      }

      var victoryRestartBtn = document.getElementById('victory-restart-btn');
      if (victoryRestartBtn) {
        victoryRestartBtn.addEventListener('click', function() {
          window.location.reload();
        });
      }
    }

    // Title screen: wait for any key/click
    if (titleOverlay) {
      document.addEventListener('keydown', function titleKey() {
        startGame();
        document.removeEventListener('keydown', titleKey);
      });
      titleOverlay.addEventListener('click', startGame);
    } else {
      startGame();
    }
  });
})();
