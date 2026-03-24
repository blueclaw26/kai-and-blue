// Canvas Renderer with FOV, Minimap, and Pixel Art Sprites
var Renderer = (function() {
  'use strict';

  var TILE_SIZE = 24;
  var FOV_RADIUS = 6;

  var COLORS = {
    wall: '#333',
    floor: '#1a1e2e',
    corridor: '#1a1e2e',
    stairs: '#90a4ae',
    player: '#4fc3f7',
    unexplored: '#000',
    shopFloor: '#252a3e' // slightly lighter for shop room
  };

  var WALL_CHAR = '#';
  var STAIRS_CHAR = '>';

  // Map enemy IDs to sprite names
  var ENEMY_SPRITE_MAP = {
    mamel: 'mamel',
    chintala: 'chintala',
    nigiri: 'nigiri',
    midnighthat: 'ghost',
    polygon: 'polygon',
    dragon: 'dragon',
    skull_mage: 'skull_mage',
    minotaur: 'minotaur',
    shopkeeper: 'shopkeeper'
  };

  // Map item types to sprite names
  var ITEM_SPRITE_MAP = {
    weapon: 'weapon',
    shield: 'shield',
    grass: 'grass',
    scroll: 'scroll',
    staff: 'staff',
    food: 'food'
  };

  function Renderer(canvas, minimapCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.miniCanvas = minimapCanvas;
    this.miniCtx = minimapCanvas.getContext('2d');
    this.viewW = 25;
    this.viewH = 18;
    canvas.width = this.viewW * TILE_SIZE;
    canvas.height = this.viewH * TILE_SIZE;

    // Crisp pixel art rendering
    this.ctx.imageSmoothingEnabled = false;

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
      if (dungeon.grid[y][x] === Dungeon.TILE.WALL && !(x === x0 && y === y0)) {
        return false;
      }
      var e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  // Export computeFOV for external use
  Renderer.computeFOV = computeFOV;

  // Check if a tile is in the shop room
  function isShopTile(game, tx, ty) {
    if (!game.shopRoom) return false;
    var r = game.shopRoom;
    return tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h;
  }

  // Draw a sprite at a position, with optional dimming for explored-but-not-visible tiles
  function drawSprite(ctx, spriteName, drawX, drawY, dimmed) {
    var sprite = Sprites.getSprite(spriteName);
    if (sprite) {
      ctx.drawImage(sprite, drawX, drawY, TILE_SIZE, TILE_SIZE);
      if (dimmed) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
      }
      return true;
    }
    return false;
  }

  Renderer.prototype.render = function(game) {
    var ctx = this.ctx;
    var dungeon = game.dungeon;
    var player = game.player;
    var explored = game.explored;
    var enemies = game.enemies;
    var items = game.items;

    // Ensure crisp pixel art each frame
    ctx.imageSmoothingEnabled = false;

    var visible = computeFOV(player.x, player.y, dungeon);
    var mapRevealed = game.mapRevealed;

    for (var key in visible) {
      explored.add(key);
    }

    var camX = player.x - Math.floor(this.viewW / 2);
    var camY = player.y - Math.floor(this.viewH / 2);
    camX = Math.max(0, Math.min(camX, dungeon.width - this.viewW));
    camY = Math.max(0, Math.min(camY, dungeon.height - this.viewH));

    ctx.fillStyle = COLORS.unexplored;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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

        if (!isVisible && !isExplored) continue;

        var tile = dungeon.grid[ty][tx];
        var drawX = vx * TILE_SIZE;
        var drawY = vy * TILE_SIZE;
        var dimmed = !isVisible && !mapRevealed;

        // Render tiles with sprites
        switch (tile) {
          case Dungeon.TILE.WALL:
            if (!drawSprite(ctx, 'wall', drawX, drawY, dimmed)) {
              // Fallback
              ctx.fillStyle = COLORS.wall;
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              if (dimmed) { ctx.globalAlpha = 0.35; }
              ctx.fillStyle = '#555';
              ctx.fillText(WALL_CHAR, drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
              ctx.globalAlpha = 1.0;
            }
            break;
          case Dungeon.TILE.STAIRS_DOWN:
            // Draw floor background first, then stairs sprite on top
            ctx.fillStyle = COLORS.floor;
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            if (!drawSprite(ctx, 'stairs', drawX, drawY, dimmed)) {
              // Fallback
              if (dimmed) { ctx.globalAlpha = 0.35; }
              ctx.fillStyle = COLORS.stairs;
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#fff';
              ctx.fillText(STAIRS_CHAR, drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
              ctx.globalAlpha = 1.0;
            }
            break;
          case Dungeon.TILE.FLOOR:
            ctx.fillStyle = isShopTile(game, tx, ty) ? COLORS.shopFloor : COLORS.floor;
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            if (dimmed) {
              ctx.fillStyle = 'rgba(0,0,0,0.5)';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            break;
          case Dungeon.TILE.CORRIDOR:
            ctx.fillStyle = COLORS.corridor;
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            if (dimmed) {
              ctx.fillStyle = 'rgba(0,0,0,0.5)';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            break;
          default:
            ctx.fillStyle = COLORS.unexplored;
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            break;
        }
      }
    }

    // Draw visible traps
    var traps = game.traps || [];
    ctx.font = 'bold 14px monospace';
    for (var i = 0; i < traps.length; i++) {
      var trap = traps[i];
      if (!trap.visible || trap.consumed) continue;
      var tKey = trap.x + ',' + trap.y;
      if (!visible[tKey] && !explored.has(tKey)) continue;

      var tScreenX = (trap.x - camX) * TILE_SIZE;
      var tScreenY = (trap.y - camY) * TILE_SIZE;
      var trapDimmed = !visible[tKey] && !mapRevealed;

      if (!drawSprite(ctx, 'trap', tScreenX, tScreenY, trapDimmed)) {
        // Fallback to text
        if (trapDimmed) { ctx.globalAlpha = 0.35; }
        ctx.fillStyle = trap.color;
        ctx.fillText(trap.char, tScreenX + TILE_SIZE / 2, tScreenY + TILE_SIZE / 2);
        ctx.globalAlpha = 1.0;
      }
    }

    // Draw items
    ctx.font = 'bold 16px monospace';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var iKey = item.x + ',' + item.y;
      if (!visible[iKey] && !mapRevealed) continue;

      var iScreenX = (item.x - camX) * TILE_SIZE;
      var iScreenY = (item.y - camY) * TILE_SIZE;

      // Try sprite first
      var itemSpriteName = ITEM_SPRITE_MAP[item.type];
      if (itemSpriteName && drawSprite(ctx, itemSpriteName, iScreenX, iScreenY, false)) {
        // Sprite drawn successfully
      } else {
        // Fallback to text
        ctx.fillStyle = item.color;
        ctx.fillText(item.char, iScreenX + TILE_SIZE / 2, iScreenY + TILE_SIZE / 2);
      }

      // Draw price tag for shop items
      if (item.shopItem && !game.shopkeeperHostile) {
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(item.getBuyPrice(), iScreenX + TILE_SIZE / 2, iScreenY + 4);
        ctx.font = 'bold 16px monospace';
      }
    }

    // Draw enemies
    ctx.font = 'bold 18px monospace';
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (enemy.dead) continue;

      var eKey = enemy.x + ',' + enemy.y;
      if (!visible[eKey] && !mapRevealed) continue;

      var eScreenX = (enemy.x - camX) * TILE_SIZE;
      var eScreenY = (enemy.y - camY) * TILE_SIZE;

      // Try sprite first
      var enemySpriteName = enemy.enemyId ? ENEMY_SPRITE_MAP[enemy.enemyId] : null;
      if (enemySpriteName && drawSprite(ctx, enemySpriteName, eScreenX, eScreenY, false)) {
        // Sprite drawn successfully
      } else {
        // Fallback to text
        ctx.fillStyle = enemy.color;
        ctx.fillText(enemy.char, eScreenX + TILE_SIZE / 2, eScreenY + TILE_SIZE / 2);
      }
    }

    // Draw player ON TOP
    var playerScreenX = (player.x - camX) * TILE_SIZE;
    var playerScreenY = (player.y - camY) * TILE_SIZE;

    if (!drawSprite(ctx, 'player', playerScreenX, playerScreenY, false)) {
      // Fallback to text
      ctx.fillStyle = COLORS.player;
      ctx.font = 'bold 18px monospace';
      ctx.fillText(player.char, playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE / 2);
    }

    // Minimap
    this.renderMinimap(game, dungeon, player, enemies, items, explored, visible, mapRevealed);
  };

  Renderer.prototype.renderMinimap = function(game, dungeon, player, enemies, items, explored, visible, mapRevealed) {
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

        var tileBright = isVisible || mapRevealed;
        if (tile === Dungeon.TILE.WALL) {
          ctx.fillStyle = tileBright ? '#3a3a3a' : '#1a1a1a';
        } else if (tile === Dungeon.TILE.STAIRS_DOWN) {
          ctx.fillStyle = tileBright ? '#90a4ae' : '#4a5560';
        } else {
          // Shop room is slightly different on minimap
          if (isShopTile(game, x, y)) {
            ctx.fillStyle = tileBright ? '#3a4060' : '#1f2535';
          } else {
            ctx.fillStyle = tileBright ? '#2a3050' : '#151825';
          }
        }

        ctx.fillRect(x * t, y * t, t, t);
      }
    }

    // Stairs
    for (var y = 0; y < dungeon.height; y++) {
      for (var x = 0; x < dungeon.width; x++) {
        if (dungeon.grid[y][x] === Dungeon.TILE.STAIRS_DOWN && explored.has(x + ',' + y)) {
          ctx.fillStyle = '#90a4ae';
          ctx.fillRect(x * t, y * t, t, t);
        }
      }
    }

    // Traps on minimap
    var traps = game.traps || [];
    for (var i = 0; i < traps.length; i++) {
      var trap = traps[i];
      if (!trap.visible || trap.consumed) continue;
      if (!explored.has(trap.x + ',' + trap.y)) continue;
      ctx.fillStyle = trap.color;
      ctx.fillRect(trap.x * t, trap.y * t, t, t);
    }

    // Items on minimap
    ctx.fillStyle = '#ffeb3b';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var iKey = item.x + ',' + item.y;
      if (!visible[iKey] && !mapRevealed) continue;
      ctx.fillRect(item.x * t, item.y * t, t, t);
    }

    // Enemies on minimap
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (enemy.dead) continue;
      var eKey = enemy.x + ',' + enemy.y;
      if (!visible[eKey] && !mapRevealed) continue;
      // Shopkeeper is gold on minimap
      ctx.fillStyle = enemy.isShopkeeper ? '#ffd700' : '#ff4444';
      ctx.fillRect(enemy.x * t, enemy.y * t, t, t);
    }

    // Player on minimap
    ctx.fillStyle = '#00e5ff';
    var px = player.x * t - 1;
    var py = player.y * t - 1;
    ctx.fillRect(px, py, 6, 6);
  };

  return Renderer;
})();
