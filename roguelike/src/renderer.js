// Canvas Renderer with FOV and Minimap
var Renderer = (function() {
  'use strict';

  var TILE_SIZE = 24;
  var FOV_RADIUS = 6;

  var COLORS = {
    wall: '#333',
    floor: '#1a1e2e',
    corridor: '#1a1e2e',
    stairs: '#e8a44a',
    player: '#4fc3f7',
    unexplored: '#000'
  };

  var WALL_CHAR = '#';
  var STAIRS_CHAR = '>';

  function Renderer(canvas, minimapCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.miniCanvas = minimapCanvas;
    this.miniCtx = minimapCanvas.getContext('2d');
    this.viewW = 25;
    this.viewH = 18;
    canvas.width = this.viewW * TILE_SIZE;
    canvas.height = this.viewH * TILE_SIZE;

    // Minimap: 4px per tile
    this.miniTile = 4;
  }

  // Simple radius-based FOV
  function computeFOV(px, py, dungeon) {
    var visible = {};
    for (var dy = -FOV_RADIUS; dy <= FOV_RADIUS; dy++) {
      for (var dx = -FOV_RADIUS; dx <= FOV_RADIUS; dx++) {
        if (dx * dx + dy * dy <= FOV_RADIUS * FOV_RADIUS) {
          var tx = px + dx;
          var ty = py + dy;
          if (tx >= 0 && tx < dungeon.width && ty >= 0 && ty < dungeon.height) {
            // Simple line-of-sight check
            if (hasLineOfSight(px, py, tx, ty, dungeon)) {
              visible[tx + ',' + ty] = true;
            }
          }
        }
      }
    }
    return visible;
  }

  function hasLineOfSight(x0, y0, x1, y1, dungeon) {
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1;
    var sy = y0 < y1 ? 1 : -1;
    var err = dx - dy;
    var x = x0, y = y0;

    while (true) {
      if (x === x1 && y === y1) return true;
      // Wall blocks sight (but we can see the wall itself)
      if (dungeon.grid[y][x] === Dungeon.TILE.WALL && !(x === x0 && y === y0)) {
        return false;
      }
      var e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  Renderer.prototype.render = function(game) {
    var ctx = this.ctx;
    var dungeon = game.dungeon;
    var player = game.player;
    var explored = game.explored;

    // Compute FOV
    var visible = computeFOV(player.x, player.y, dungeon);

    // Mark visible tiles as explored
    for (var key in visible) {
      explored.add(key);
    }

    // Camera: center on player
    var camX = player.x - Math.floor(this.viewW / 2);
    var camY = player.y - Math.floor(this.viewH / 2);
    // Clamp
    camX = Math.max(0, Math.min(camX, dungeon.width - this.viewW));
    camY = Math.max(0, Math.min(camY, dungeon.height - this.viewH));

    // Clear
    ctx.fillStyle = COLORS.unexplored;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw tiles
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (var vy = 0; vy < this.viewH; vy++) {
      for (var vx = 0; vx < this.viewW; vx++) {
        var tx = camX + vx;
        var ty = camY + vy;
        if (tx < 0 || tx >= dungeon.width || ty < 0 || ty >= dungeon.height) continue;

        var tileKey = tx + ',' + ty;
        var isVisible = visible[tileKey];
        var isExplored = explored.has(tileKey);

        if (!isVisible && !isExplored) continue; // Black

        var tile = dungeon.grid[ty][tx];
        var drawX = vx * TILE_SIZE;
        var drawY = vy * TILE_SIZE;

        // Background
        var bgColor;
        switch (tile) {
          case Dungeon.TILE.WALL: bgColor = COLORS.wall; break;
          case Dungeon.TILE.FLOOR: bgColor = COLORS.floor; break;
          case Dungeon.TILE.CORRIDOR: bgColor = COLORS.corridor; break;
          case Dungeon.TILE.STAIRS_DOWN: bgColor = COLORS.stairs; break;
          default: bgColor = COLORS.unexplored;
        }

        if (!isVisible) {
          // Dimmed - darken the color
          ctx.globalAlpha = 0.35;
        }

        ctx.fillStyle = bgColor;
        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);

        // Draw chars for walls and stairs
        if (tile === Dungeon.TILE.WALL) {
          ctx.fillStyle = '#555';
          ctx.fillText(WALL_CHAR, drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
        } else if (tile === Dungeon.TILE.STAIRS_DOWN) {
          ctx.fillStyle = '#fff';
          ctx.fillText(STAIRS_CHAR, drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
        }

        ctx.globalAlpha = 1.0;
      }
    }

    // Draw player
    var playerScreenX = (player.x - camX) * TILE_SIZE;
    var playerScreenY = (player.y - camY) * TILE_SIZE;
    ctx.fillStyle = COLORS.player;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(player.char, playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE / 2);

    // Minimap
    this.renderMinimap(dungeon, player, explored, visible);
  };

  Renderer.prototype.renderMinimap = function(dungeon, player, explored, visible) {
    var ctx = this.miniCtx;
    var t = this.miniTile;
    this.miniCanvas.width = dungeon.width * t;
    this.miniCanvas.height = dungeon.height * t;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);

    for (var y = 0; y < dungeon.height; y++) {
      for (var x = 0; x < dungeon.width; x++) {
        var key = x + ',' + y;
        if (!explored.has(key)) continue;

        var tile = dungeon.grid[y][x];
        var isVisible = visible[key];

        if (tile === Dungeon.TILE.WALL) {
          ctx.fillStyle = isVisible ? '#555' : '#2a2a2a';
        } else if (tile === Dungeon.TILE.STAIRS_DOWN) {
          ctx.fillStyle = isVisible ? COLORS.stairs : '#7a5520';
        } else {
          ctx.fillStyle = isVisible ? '#2a3050' : '#151825';
        }

        ctx.fillRect(x * t, y * t, t, t);
      }
    }

    // Player on minimap
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(player.x * t, player.y * t, t, t);
  };

  return Renderer;
})();
