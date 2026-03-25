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

      // Start in village
      game.initVillage(ui);

      // Initial render
      renderer.render(game);
      ui.updateStatus(game);

      // Start BGM (village calm tune)
      if (Sound.bgm) {
        Sound.bgm.play('village');
      }

      // Expose globals for debug/autoplay
      window._game = game;
      window._renderer = renderer;
      window._ui = ui;
      window._turnManager = turnManager;
      window._autoPlayer = new AutoPlayer(game, turnManager, ui, renderer);

      // Bind input
      var inputHandler = new Input(turnManager, game);

      // Animation loop for water/lava shimmer (re-renders every 500ms if dungeon has pools)
      var lastAnimFrame = 0;
      function animLoop(ts) {
        if (ts - lastAnimFrame > 500 && game.scene === 'dungeon' && !game.gameOver && !game.victory) {
          lastAnimFrame = ts;
          renderer.render(game);
        }
        requestAnimationFrame(animLoop);
      }
      requestAnimationFrame(animLoop);

      // Restart button → return to village
      var restartBtn = document.getElementById('restart-btn');
      if (restartBtn) {
        restartBtn.addEventListener('click', function() {
          var goEl = document.getElementById('game-over-overlay');
          if (goEl) goEl.style.display = 'none';
          game.returnToVillage();
          renderer.render(game);
          ui.updateStatus(game);
          if (Sound.bgm) Sound.bgm.switchTrack('village');
        });
      }

      var victoryRestartBtn = document.getElementById('victory-restart-btn');
      if (victoryRestartBtn) {
        victoryRestartBtn.addEventListener('click', function() {
          var voEl = document.getElementById('victory-overlay');
          if (voEl) voEl.style.display = 'none';
          game.returnToVillage();
          renderer.render(game);
          ui.updateStatus(game);
          if (Sound.bgm) Sound.bgm.switchTrack('village');
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
