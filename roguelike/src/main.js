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

      // Start loading PNG sprites (non-blocking, renderer uses them when ready)
      SpriteLoader.init(function() {
        console.log('PNG sprites loaded');
      });

      var game = new Game();
      var renderer2d = new Renderer(canvas, minimapCanvas);
      var renderer3d = null; // lazy init
      var renderer = renderer2d; // active renderer
      var ui = new UI(statusEl, logEl);
      var turnManager = new TurnManager(game, renderer, ui);

      // Start in village
      game.initVillage(ui);

      // Internal cross-module references (needed for gameplay)
      window._game = game;
      window._renderer = renderer;

      // Auto-initialize 3D if default mode is 3D
      if (RENDER_MODE === '3d') {
        var canvasArea = document.getElementById('canvas-area');
        var loadingEl = document.createElement('div');
        loadingEl.id = 'loading-3d-overlay';
        loadingEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;' +
          'background:#1a1a2e;display:flex;align-items:center;justify-content:center;' +
          'color:#ffd700;font-size:24px;font-family:"Noto Sans JP",sans-serif;z-index:200;' +
          'transition:opacity 0.5s ease-out;';
        loadingEl.textContent = 'Loading 3D...';
        if (canvasArea) canvasArea.appendChild(loadingEl);

        renderer3d = new Renderer3D(canvas, minimapCanvas);
        renderer3d.init();
        renderer3d._fallback2d = renderer2d;
        renderer = renderer3d;
        window._renderer = renderer;
        turnManager.renderer = renderer;
        renderer3d.startRenderLoop(game);

        // Update toggle button
        var toggleBtn = document.getElementById('render-toggle-btn');
        if (toggleBtn) toggleBtn.textContent = '🎮 2D';

        setTimeout(function() {
          loadingEl.style.opacity = '0';
          setTimeout(function() {
            if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);
          }, 500);
        }, 100);
      }

      // Initial render
      renderer.render(game);
      ui.updateStatus(game);

      // Start BGM (village calm tune)
      if (Sound.bgm) {
        Sound.bgm.play('village');
      }

      // === 2D/3D Toggle ===
      var renderToggleBtn = document.getElementById('render-toggle-btn');
      if (renderToggleBtn) {
        renderToggleBtn.addEventListener('click', function() {
          if (RENDER_MODE === '2d') {
            // Switch to 3D
            RENDER_MODE = '3d';
            renderToggleBtn.textContent = '🎮 2D';

            if (!renderer3d) {
              // Show loading overlay
              var canvasArea = document.getElementById('canvas-area');
              var loadingEl = document.createElement('div');
              loadingEl.id = 'loading-3d-overlay';
              loadingEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;' +
                'background:#1a1a2e;display:flex;align-items:center;justify-content:center;' +
                'color:#ffd700;font-size:24px;font-family:"Noto Sans JP",sans-serif;z-index:200;' +
                'transition:opacity 0.5s ease-out;';
              loadingEl.textContent = 'Loading 3D...';
              if (canvasArea) canvasArea.appendChild(loadingEl);

              renderer3d = new Renderer3D(canvas, minimapCanvas);
              renderer3d.init();
              renderer3d._fallback2d = renderer2d;

              // Fade out loading screen
              setTimeout(function() {
                loadingEl.style.opacity = '0';
                setTimeout(function() {
                  if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);
                }, 500);
              }, 100);
            }

            renderer = renderer3d;
            window._renderer = renderer;
            turnManager.renderer = renderer;

            // Start continuous render loop for 3D
            renderer3d.startRenderLoop(game);
          } else {
            // Switch to 2D
            RENDER_MODE = '2d';
            renderToggleBtn.textContent = '🎮 3D';

            if (renderer3d) {
              renderer3d.stopRenderLoop();
              renderer3d.destroy();
              renderer3d = null;
            }

            renderer = renderer2d;
            window._renderer = renderer;
            turnManager.renderer = renderer;

            renderer.resetCamera();
            renderer.render(game);
          }
        });
      }

      // Debug-only globals (autoplay, UI/turn internals)
      var autoPlayer = new AutoPlayer(game, turnManager, ui, renderer);
      if (DEBUG_MODE) {
        window._ui = ui;
        window._turnManager = turnManager;
        window._autoPlayer = autoPlayer;
      }

      // Bind input
      var inputHandler = new Input(turnManager, game);

      // Animation loop for water/lava shimmer (re-renders every 500ms if dungeon has pools)
      var lastAnimFrame = 0;
      function animLoop(ts) {
        if (RENDER_MODE === '2d') {
          if (ts - lastAnimFrame > 500 && game.scene === 'dungeon' && !game.gameOver && !game.victory) {
            lastAnimFrame = ts;
            renderer.render(game);
          }
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

      // === Fullscreen Toggle ===
      var fullscreenBtn = document.getElementById('fullscreen-btn');
      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function() {
          var isFullscreen = document.body.classList.toggle('fullscreen-mode');
          fullscreenBtn.textContent = isFullscreen ? '🔲 ウィンドウ' : '🔲 全画面';

          setTimeout(function() {
            var canvasArea = document.getElementById('canvas-area');
            var w = canvasArea.clientWidth;
            var h = canvasArea.clientHeight;

            if (renderer2d && renderer2d.canvas) {
              renderer2d.canvas.width = w;
              renderer2d.canvas.height = h;
              renderer2d.viewW = Math.floor(w / 24);
              renderer2d.viewH = Math.floor(h / 24);
            }

            if (renderer3d) {
              renderer3d.resize(w, h);
            }

            if (window._renderer && window._game) {
              window._renderer.render(window._game);
            }
          }, 100);
        });
      }

      // === Browser Fullscreen API (double-click on canvas) ===
      var canvasAreaEl = document.getElementById('canvas-area');
      if (canvasAreaEl) {
        canvasAreaEl.addEventListener('dblclick', function() {
          if (!document.fullscreenElement) {
            document.getElementById('game-frame').requestFullscreen().catch(function() {});
          } else {
            document.exitFullscreen();
          }
        });
      }

      document.addEventListener('fullscreenchange', function() {
        setTimeout(function() {
          var event = new Event('resize');
          window.dispatchEvent(event);
        }, 100);
      });

      // === Window Resize Handler ===
      window.addEventListener('resize', function() {
        var canvasArea = document.getElementById('canvas-area');
        if (!canvasArea) return;
        var w = canvasArea.clientWidth;
        var h = canvasArea.clientHeight;

        if (RENDER_MODE === '3d' && renderer3d) {
          renderer3d.resize(w, h);
        }
      });
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
