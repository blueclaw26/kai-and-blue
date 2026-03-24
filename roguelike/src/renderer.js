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
    shopFloor: '#252a3e', // slightly lighter for shop room
    monsterHouseFloor: '#2e1a1a', // reddish tint for monster house
    sanctuaryTile: '#3a3020' // gold glow for sanctuary
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
    shopkeeper: 'shopkeeper',
    guard_dog: 'guard_dog',
    toad: 'toad',
    boy_cart: 'boy_cart',
    slug: 'slug',
    thief_pelican: 'thief_pelican',
    kengo: 'kengo',
    curse_girl: 'curse_girl',
    big_chintala: 'big_chintala',
    mega_dragon: 'mega_dragon',
    death_reaper: 'death_reaper',
    phantom: 'phantom',
    hell_dragon: 'hell_dragon',
    chaos_knight: 'chaos_knight'
  };

  // Map item types to sprite names
  var ITEM_SPRITE_MAP = {
    weapon: 'weapon',
    shield: 'shield',
    grass: 'grass',
    scroll: 'scroll',
    staff: 'staff',
    food: 'food',
    pot: 'pot',
    bracelet: 'bracelet',
    arrow: 'arrow'
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

  // computeFOV now returns the game.visible 2D array directly
  // Game.updateVisibility() must be called before render
  // Legacy computeFOV kept for scroll effect compatibility (returns object with string keys)
  function computeFOV(px, py, dungeon) {
    var visible = {};
    var FOV_R = 6;
    for (var dy = -FOV_R; dy <= FOV_R; dy++) {
      for (var dx = -FOV_R; dx <= FOV_R; dx++) {
        if (dx * dx + dy * dy <= FOV_R * FOV_R) {
          var tx = px + dx;
          var ty = py + dy;
          if (tx >= 0 && tx < dungeon.width && ty >= 0 && ty < dungeon.height) {
            visible[tx + ',' + ty] = true;
          }
        }
      }
    }
    return visible;
  }

  // Export computeFOV for external use (scroll effects)
  Renderer.computeFOV = computeFOV;

  // Check if a tile is in the shop room
  function isShopTile(game, tx, ty) {
    if (!game.shopRoom) return false;
    var r = game.shopRoom;
    return tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h;
  }

  // Check if a tile is in the monster house room
  function isMonsterHouseTile(game, tx, ty) {
    if (!game.monsterHouseRoom) return false;
    var r = game.monsterHouseRoom;
    return tx >= r.x1 && tx <= r.x2 && ty >= r.y1 && ty <= r.y2;
  }

  // Draw a sprite at a position, with optional dimming for explored-but-not-visible tiles
  // animated: if true, use 2-frame animation variant
  function drawSprite(ctx, spriteName, drawX, drawY, dimmed, animated) {
    var sprite = Sprites.getSprite(spriteName, animated);
    if (sprite) {
      // Draw 32x32 sprite scaled down to 24x24 tile for crisper pixel art
      ctx.drawImage(sprite, drawX, drawY, TILE_SIZE, TILE_SIZE);
      if (dimmed) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
      }
      return true;
    }
    return false;
  }

  // Village tile colors
  var VILLAGE_COLORS = {
    0: '#333',        // wall
    1: '#2d5a27',     // grass
    2: '#8b7355',     // path
    3: '#2a4a8a',     // water
    4: '#5a4a3a',     // building
    5: '#1a1a2e'      // dungeon entrance
  };

  Renderer.prototype.renderVillage = function(game) {
    var ctx = this.ctx;
    var map = game.villageMap;
    var player = game.player;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Camera centered on player
    var camX = player.x - Math.floor(this.viewW / 2);
    var camY = player.y - Math.floor(this.viewH / 2);
    camX = Math.max(0, Math.min(camX, map.width - this.viewW));
    camY = Math.max(0, Math.min(camY, map.height - this.viewH));

    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (var vy = 0; vy < this.viewH; vy++) {
      for (var vx = 0; vx < this.viewW; vx++) {
        var tx = camX + vx;
        var ty = camY + vy;
        if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) continue;
        var tile = map.grid[ty][tx];
        var drawX = vx * TILE_SIZE;
        var drawY = vy * TILE_SIZE;

        ctx.fillStyle = VILLAGE_COLORS[tile] || '#000';
        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);

        // Draw icons
        if (tile === 4) {
          ctx.fillStyle = '#7a6a5a';
          ctx.fillText('█', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
        } else if (tile === 5) {
          ctx.fillStyle = '#666';
          ctx.fillText('▼', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
        } else if (tile === 3) {
          ctx.fillStyle = '#4a7aba';
          ctx.fillText('~', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
        }
      }
    }

    // Draw NPCs
    ctx.font = 'bold 18px monospace';
    for (var i = 0; i < game.villageNpcs.length; i++) {
      var npc = game.villageNpcs[i];
      var nScreenX = (npc.x - camX) * TILE_SIZE;
      var nScreenY = (npc.y - camY) * TILE_SIZE;
      if (nScreenX >= 0 && nScreenX < this.canvas.width && nScreenY >= 0 && nScreenY < this.canvas.height) {
        ctx.fillStyle = npc.color;
        ctx.fillText(npc.char, nScreenX + TILE_SIZE / 2, nScreenY + TILE_SIZE / 2);
        // Name tag
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(npc.name, nScreenX + TILE_SIZE / 2, nScreenY - 4);
        ctx.font = 'bold 18px monospace';
      }
    }

    // Draw player
    var pScreenX = (player.x - camX) * TILE_SIZE;
    var pScreenY = (player.y - camY) * TILE_SIZE;
    if (!drawSprite(ctx, 'player', pScreenX, pScreenY, false, true)) {
      ctx.fillStyle = COLORS.player;
      ctx.fillText(player.char, pScreenX + TILE_SIZE / 2, pScreenY + TILE_SIZE / 2);
    }

    // Village minimap
    this._renderVillageMinimap(game, map, player);
  };

  Renderer.prototype._renderVillageMinimap = function(game, map, player) {
    var ctx = this.miniCtx;
    var t = this.miniTile;
    this.miniCanvas.width = map.width * t;
    this.miniCanvas.height = map.height * t;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);

    for (var y = 0; y < map.height; y++) {
      for (var x = 0; x < map.width; x++) {
        var tile = map.grid[y][x];
        ctx.fillStyle = VILLAGE_COLORS[tile] || '#000';
        ctx.fillRect(x * t, y * t, t, t);
      }
    }
    // NPCs
    for (var i = 0; i < game.villageNpcs.length; i++) {
      var npc = game.villageNpcs[i];
      ctx.fillStyle = npc.color;
      ctx.fillRect(npc.x * t, npc.y * t, t, t);
    }
    // Player
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(player.x * t - 1, player.y * t - 1, 6, 6);
  };

  Renderer.prototype.render = function(game) {
    // Delegate to village renderer if in village scene
    if (game.scene === 'village') {
      this.renderVillage(game);
      return;
    }

    var ctx = this.ctx;
    var dungeon = game.dungeon;
    var player = game.player;
    var visibleArr = game.visible;
    var exploredArr = game.explored;
    var enemies = game.enemies;
    var items = game.items;

    // Ensure crisp pixel art each frame
    ctx.imageSmoothingEnabled = false;

    // Update room-based visibility
    game.updateVisibility();

    var mapRevealed = game.mapRevealed;

    var camX = player.x - Math.floor(this.viewW / 2);
    var camY = player.y - Math.floor(this.viewH / 2);
    camX = Math.max(0, Math.min(camX, dungeon.width - this.viewW));
    camY = Math.max(0, Math.min(camY, dungeon.height - this.viewH));

    // Screen shake offset
    var shakeX = 0, shakeY = 0;
    if (game.shakeFrames > 0) {
      shakeX = Math.floor(Math.random() * 5) - 2;
      shakeY = Math.floor(Math.random() * 5) - 2;
      game.shakeFrames--;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    ctx.fillStyle = COLORS.unexplored;
    ctx.fillRect(-2, -2, this.canvas.width + 4, this.canvas.height + 4);

    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (var vy = 0; vy < this.viewH; vy++) {
      for (var vx = 0; vx < this.viewW; vx++) {
        var tx = camX + vx;
        var ty = camY + vy;
        if (tx < 0 || tx >= dungeon.width || ty < 0 || ty >= dungeon.height) continue;

        var isVisible = visibleArr[ty][tx];
        var isExplored = exploredArr[ty][tx];

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
            var floorColor = COLORS.floor;
            if (game.sanctuaryTiles && game.sanctuaryTiles.has(tx + ',' + ty)) {
              floorColor = COLORS.sanctuaryTile;
            } else if (isShopTile(game, tx, ty)) {
              floorColor = COLORS.shopFloor;
            } else if (isMonsterHouseTile(game, tx, ty)) {
              floorColor = COLORS.monsterHouseFloor;
            }
            ctx.fillStyle = floorColor;
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            // Sanctuary golden glow overlay
            if (game.sanctuaryTiles && game.sanctuaryTiles.has(tx + ',' + ty)) {
              ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
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

    // Draw visible traps (see_traps bracelet reveals all)
    var seeTraps = player.bracelet && player.bracelet.effect === 'see_traps';
    var traps = game.traps || [];
    ctx.font = 'bold 14px monospace';
    for (var i = 0; i < traps.length; i++) {
      var trap = traps[i];
      if (trap.consumed) continue;
      if (!trap.visible && !seeTraps) continue;
      if (!visibleArr[trap.y][trap.x] && !exploredArr[trap.y][trap.x]) continue;

      var tScreenX = (trap.x - camX) * TILE_SIZE;
      var tScreenY = (trap.y - camY) * TILE_SIZE;
      var trapDimmed = !visibleArr[trap.y][trap.x] && !mapRevealed;

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
      if (!visibleArr[item.y][item.x] && !mapRevealed) continue;

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
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#000';
        ctx.fillRect(iScreenX, iScreenY - 2, TILE_SIZE, 10);
        ctx.fillStyle = '#ffd700';
        ctx.fillText(item.getBuyPrice() + 'G', iScreenX + TILE_SIZE / 2, iScreenY + 4);
        ctx.font = 'bold 16px monospace';
      }
    }

    // Draw enemies (only visible in same room or adjacent in corridors)
    // Bracelet see_all: show all enemies on minimap and main view
    var seeAllEnemies = player.bracelet && player.bracelet.effect === 'see_all';
    ctx.font = 'bold 18px monospace';
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (enemy.dead) continue;

      if (!visibleArr[enemy.y][enemy.x] && !mapRevealed && !seeAllEnemies) continue;

      var eScreenX = (enemy.x - camX) * TILE_SIZE;
      var eScreenY = (enemy.y - camY) * TILE_SIZE;

      // Try sprite first (with animation)
      var enemySpriteName = enemy.enemyId ? ENEMY_SPRITE_MAP[enemy.enemyId] : null;
      if (enemySpriteName && drawSprite(ctx, enemySpriteName, eScreenX, eScreenY, false, true)) {
        // Sprite drawn successfully
      } else {
        // Fallback to text
        ctx.fillStyle = enemy.color;
        ctx.fillText(enemy.char, eScreenX + TILE_SIZE / 2, eScreenY + TILE_SIZE / 2);
      }

      // Sleeping enemy overlay
      if (enemy.sleeping) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(eScreenX, eScreenY, TILE_SIZE, TILE_SIZE);
        ctx.globalAlpha = 1.0;
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#90caf9';
        ctx.fillText('Z', eScreenX + TILE_SIZE - 4, eScreenY + 6);
        ctx.font = 'bold 18px monospace';
      }

      // Shopkeeper speech bubble
      if (enemy.isShopkeeper && !game.shopkeeperHostile) {
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText('店', eScreenX + TILE_SIZE / 2, eScreenY - 4);
        ctx.font = 'bold 18px monospace';
      }
    }

    // Draw player ON TOP
    var playerScreenX = (player.x - camX) * TILE_SIZE;
    var playerScreenY = (player.y - camY) * TILE_SIZE;

    if (!drawSprite(ctx, 'player', playerScreenX, playerScreenY, false, true)) {
      // Fallback to text
      ctx.fillStyle = COLORS.player;
      ctx.font = 'bold 18px monospace';
      ctx.fillText(player.char, playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE / 2);
    }

    // Flash tiles (white flash on attacked tiles)
    if (game.flashTiles && game.flashTiles.length > 0) {
      for (var fi = 0; fi < game.flashTiles.length; fi++) {
        var ft = game.flashTiles[fi];
        var ftx = (ft.x - camX) * TILE_SIZE;
        var fty = (ft.y - camY) * TILE_SIZE;
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(ftx, fty, TILE_SIZE, TILE_SIZE);
      }
      game.flashTiles = [];
    }

    // Screen flash (monster house etc)
    if (game.screenFlashFrames > 0) {
      ctx.fillStyle = game.screenFlashColor;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      game.screenFlashFrames--;
    }

    // Floating text effects
    if (game.floatingTexts && game.floatingTexts.length > 0) {
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (var fti = 0; fti < game.floatingTexts.length; fti++) {
        var ft2 = game.floatingTexts[fti];
        var ftDrawX = (ft2.x - camX) * TILE_SIZE + TILE_SIZE / 2;
        var ftDrawY = (ft2.y - camY) * TILE_SIZE + TILE_SIZE / 2 - ft2.frame * 1.2;
        var alpha = Math.max(0, 1 - ft2.frame / 20);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft2.color;
        // Shadow for readability
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText(ft2.text, ftDrawX, ftDrawY);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1.0;
      game.tickFloatingTexts();
    }

    ctx.restore(); // restore from shake translate

    // Minimap
    this.renderMinimap(game, dungeon, player, enemies, items, exploredArr, visibleArr, mapRevealed);
  };

  Renderer.prototype.renderMinimap = function(game, dungeon, player, enemies, items, exploredArr, visibleArr, mapRevealed) {
    var ctx = this.miniCtx;
    var t = this.miniTile;
    this.miniCanvas.width = dungeon.width * t;
    this.miniCanvas.height = dungeon.height * t;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);

    for (var y = 0; y < dungeon.height; y++) {
      for (var x = 0; x < dungeon.width; x++) {
        if (!exploredArr[y][x]) continue;

        var tile = dungeon.grid[y][x];
        var isVisible = visibleArr[y][x];

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
        if (dungeon.grid[y][x] === Dungeon.TILE.STAIRS_DOWN && exploredArr[y][x]) {
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
      if (!exploredArr[trap.y][trap.x]) continue;
      ctx.fillStyle = trap.color;
      ctx.fillRect(trap.x * t, trap.y * t, t, t);
    }

    // Items on minimap
    ctx.fillStyle = '#ffeb3b';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!visibleArr[item.y][item.x] && !mapRevealed) continue;
      ctx.fillRect(item.x * t, item.y * t, t, t);
    }

    // Enemies on minimap
    var seeAllMini = player.bracelet && player.bracelet.effect === 'see_all';
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (enemy.dead) continue;
      if (!visibleArr[enemy.y][enemy.x] && !mapRevealed && !seeAllMini) continue;
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
