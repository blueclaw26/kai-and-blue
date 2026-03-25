// Canvas Renderer with FOV, Minimap, and Pixel Art Sprites
var Renderer = (function() {
  'use strict';

  var TILE_SIZE = 24;
  var FOV_RADIUS = 6;

  var COLORS = {
    wall: '#333',
    floor: '#1a1e2e',
    corridor: '#22263a',
    stairs: '#90a4ae',
    player: '#4fc3f7',
    unexplored: '#000',
    shopFloor: '#252a3e',
    monsterHouseFloor: '#2e1a1a',
    sanctuaryTile: '#3a3020'
  };

  // Room color variations (cycle through)
  var ROOM_COLOR_VARIANTS = [
    '#1a1e2e', // base (blue)
    '#1e1a2e', // purple
    '#1a2e1e', // green
    '#2e1a1e', // red
    '#1a2e2e', // teal
    '#2e2e1a', // warm
    '#1a1a2e', // deep blue
    '#2e1e2a', // mauve
  ];

  // Floor zone palettes
  function getFloorPalette(floorNum) {
    if (floorNum <= 10) return { wall: '#2d1f1f', floor: '#1a1e2e', corridor: '#22263a', name: '洞窟', wallSprite: 'wall' };
    if (floorNum <= 25) return { wall: '#1f2d2d', floor: '#1a2e2e', corridor: '#223a3a', name: '地底湖', wallSprite: 'wall_aqua' };
    if (floorNum <= 50) return { wall: '#2d1f1a', floor: '#2e1a1a', corridor: '#3a2222', name: '溶岩洞', wallSprite: 'wall_lava' };
    if (floorNum <= 75) return { wall: '#1f1f2d', floor: '#1a1a2e', corridor: '#22223a', name: '凍土', wallSprite: 'wall_ice' };
    return { wall: '#15101a', floor: '#100a15', corridor: '#1a1020', name: '深淵', wallSprite: 'wall_abyss' };
  }

  // Get room floor color with room variation + zone palette
  function getRoomFloorColor(palette, roomIndex) {
    if (roomIndex < 0) return palette.corridor;
    // Blend base palette floor with room variant
    var variant = ROOM_COLOR_VARIANTS[roomIndex % ROOM_COLOR_VARIANTS.length];
    // Simple blend: average palette.floor and variant
    return blendColors(palette.floor, variant, 0.5);
  }

  function blendColors(c1, c2, t) {
    var r1 = parseInt(c1.slice(1,3), 16), g1 = parseInt(c1.slice(3,5), 16), b1 = parseInt(c1.slice(5,7), 16);
    var r2 = parseInt(c2.slice(1,3), 16), g2 = parseInt(c2.slice(3,5), 16), b2 = parseInt(c2.slice(5,7), 16);
    var r = Math.round(r1 + (r2 - r1) * t), g = Math.round(g1 + (g2 - g1) * t), b = Math.round(b1 + (b2 - b1) * t);
    return '#' + ((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  }

  var WALL_CHAR = '#';
  var STAIRS_CHAR = '>';

  // Map enemy IDs to sprite names (coded sprites fallback)
  var ENEMY_SPRITE_MAP = {
    mamel: 'mamel',
    cave_mamel: 'mamel',
    chintala: 'chintala',
    mid_chintala: 'chintala',
    big_chintala: 'big_chintala',
    nigiri: 'nigiri',
    nigiri_morph: 'nigiri',
    nigiri_master: 'nigiri',
    midnighthat: 'ghost',
    hannya: 'ghost',
    skull_apprentice: 'polygon',
    skull_mage_mid: 'polygon',
    skull_master: 'polygon',
    dragon: 'dragon',
    sky_dragon: 'dragon',
    mega_dragon: 'mega_dragon',
    minotaur: 'minotaur',
    mega_taur: 'minotaur',
    shopkeeper: 'shopkeeper',
    guard_dog: 'guard_dog',
    toad: 'toad',
    oya_toad: 'toad',
    boy_cart: 'boy_cart',
    child_tank: 'boy_cart',
    oyaji_tank: 'boy_cart',
    slug: 'slug',
    dizzy_radish: 'slug',
    chaos_radish: 'slug',
    thief_pelican: 'thief_pelican',
    green_thief: 'thief_pelican',
    iron_thief: 'thief_pelican',
    kengo: 'kengo',
    iai: 'kengo',
    shihan: 'kengo',
    curse_girl: 'curse_girl',
    odoro: 'curse_girl',
    chidoro: 'curse_girl',
    death_angel: 'death_reaper',
    death_reaper: 'death_reaper',
    dark_lord: 'death_reaper',
    poison_scorpion: 'slug',
    demon_scorpion: 'slug',
    great_scorpion: 'slug',
    spinning_polygon: 'polygon',
    singing_polygon: 'polygon'
  };

  // Map enemy IDs to PNG sprite base names (SpriteLoader)
  var ENEMY_PNG_MAP = {
    chintala: 'chintala',
    mid_chintala: 'chintala',
    big_chintala: 'chintala',
    midnighthat: 'ghost',
    hannya: 'ghost',
    death_angel: 'ghost',
    dragon: 'dragon',
    sky_dragon: 'dragon',
    mega_dragon: 'dragon',
    skull_apprentice: 'skull_mage',
    skull_mage_mid: 'skull_mage',
    skull_master: 'skull_mage',
    death_reaper: 'skull_mage',
    dark_lord: 'skull_mage',
    minotaur: 'minotaur',
    mega_taur: 'minotaur',
    shopkeeper: 'shopkeeper',
    toad: 'toad',
    oya_toad: 'toad',
    boy_cart: 'boy_cart',
    child_tank: 'boy_cart',
    oyaji_tank: 'boy_cart',
    thief_pelican: 'thief',
    green_thief: 'thief',
    iron_thief: 'thief',
    kengo: 'kengo',
    iai: 'kengo',
    shihan: 'kengo'
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

    this.miniTile = 6; // larger minimap tiles

    // Smooth camera
    this.cameraX = -1;
    this.cameraY = -1;
    this._animating = false;
  }

  Renderer.prototype.resetCamera = function() {
    this.cameraX = -1;
    this.cameraY = -1;
  };

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

  // Check if a tile is in the treasure room
  function isTreasureRoomTile(game, tx, ty) {
    if (!game.treasureRoom) return false;
    var r = game.treasureRoom;
    return tx >= r.x1 && tx <= r.x2 && ty >= r.y1 && ty <= r.y2;
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

  // Village tile colors (new expanded tile types)
  var VILLAGE_COLORS = {
    0: '#333',        // wall (legacy)
    1: '#2d5a27',     // grass (legacy)
    2: '#8b7355',     // path (legacy)
    3: '#2a4a8a',     // water (legacy)
    4: '#5a4a3a',     // building (legacy)
    5: '#1a1a2e',     // dungeon entrance
    10: '#2d5a27',    // GRASS
    11: '#8b7355',    // PATH
    12: '#1a3a6a',    // WATER
    13: '#6b5030',    // BRIDGE
    14: '#3a2a1a',    // WALL (building)
    15: '#5a4a3a',    // FLOOR (building interior)
    16: '#1a4a1a',    // TREE
    17: '#2d5a27'     // FLOWER (same base as grass)
  };

  Renderer.prototype.renderVillage = function(game) {
    var ctx = this.ctx;
    var map = game.villageMap;
    var player = game.player;
    var VT = Game.VILLAGE_TILE;

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

    var waterFrame = (Date.now() >> 9) & 1;

    for (var vy = 0; vy < this.viewH; vy++) {
      for (var vx = 0; vx < this.viewW; vx++) {
        var tx = camX + vx;
        var ty = camY + vy;
        if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) continue;
        var tile = map.grid[ty][tx];
        var drawX = vx * TILE_SIZE;
        var drawY = vy * TILE_SIZE;

        // Base color
        ctx.fillStyle = VILLAGE_COLORS[tile] || '#000';
        ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);

        // Decorations per tile type
        switch (tile) {
          case VT.WATER:
          case 3: // legacy water
            ctx.fillStyle = waterFrame ? '#1a3a6a' : '#1a4a7a';
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#4fc3f7';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('~', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
            ctx.globalAlpha = 1.0;
            ctx.font = 'bold 16px monospace';
            break;
          case VT.BRIDGE:
            // Brown bridge planks
            ctx.fillStyle = '#6b5030';
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#55401a';
            ctx.fillRect(drawX, drawY + 2, TILE_SIZE, 2);
            ctx.fillRect(drawX, drawY + TILE_SIZE - 4, TILE_SIZE, 2);
            break;
          case VT.WALL:
          case 4: // legacy building
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            // Brick pattern
            ctx.fillStyle = '#2a1a0a';
            ctx.fillRect(drawX, drawY + TILE_SIZE / 2, TILE_SIZE, 1);
            break;
          case VT.FLOOR:
            // Building interior - use PNG floor if available
            var intFloorPng = SpriteLoader.get('floor_' + (((tx + ty) % 4) + 1));
            if (intFloorPng) {
              ctx.drawImage(intFloorPng, drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = 'rgba(80,60,30,0.15)';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            } else {
              ctx.fillStyle = '#5a4a3a';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            break;
          case VT.TREE:
            // Dark green tree block
            ctx.fillStyle = '#1a4a1a';
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#0d3a0d';
            ctx.font = 'bold 18px monospace';
            ctx.fillText('♣', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
            ctx.font = 'bold 16px monospace';
            break;
          case VT.FLOWER:
            // Grass with flower
            ctx.fillStyle = '#2d5a27';
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = ((tx + ty) % 3 === 0) ? '#ff6b9d' : ((tx + ty) % 3 === 1) ? '#ffeb3b' : '#ab47bc';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('✿', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
            ctx.font = 'bold 16px monospace';
            break;
          case VT.PATH:
          case 2: // legacy path
            // Use floor PNG if available for paths
            var pathFloorPng = SpriteLoader.get('floor_' + (((tx + ty) % 8) + 1));
            if (pathFloorPng) {
              ctx.drawImage(pathFloorPng, drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            break;
          case VT.ENTRANCE:
          case 5: // dungeon entrance
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#666';
            ctx.fillText('▼', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
            break;
          case VT.GRASS:
          case 1: // legacy grass
            // Subtle grass variation
            if ((tx + ty) % 7 === 0) {
              ctx.fillStyle = '#2a5525';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            break;
        }
      }
    }

    // Draw NPCs
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
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
    var vilPlayerPng = SpriteLoader.getAnimFrame('player_idle', 4);
    if (vilPlayerPng) {
      var vilSpriteH = TILE_SIZE * (28 / 16);
      ctx.drawImage(vilPlayerPng, pScreenX, pScreenY - (vilSpriteH - TILE_SIZE), TILE_SIZE, vilSpriteH);
    } else if (!drawSprite(ctx, 'player', pScreenX, pScreenY, false, true)) {
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
    var px = player.x * t + Math.floor(t / 2) - 3;
    var py = player.y * t + Math.floor(t / 2) - 3;
    ctx.fillRect(px, py, 6, 6);
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

    // Floor palette
    var palette = getFloorPalette(game.floorNum || 1);
    var roomMap = dungeon.roomMap; // may be undefined for maze/big_room

    var targetCamX = player.x - Math.floor(this.viewW / 2);
    var targetCamY = player.y - Math.floor(this.viewH / 2);
    targetCamX = Math.max(0, Math.min(targetCamX, dungeon.width - this.viewW));
    targetCamY = Math.max(0, Math.min(targetCamY, dungeon.height - this.viewH));

    // Smooth camera interpolation
    if (this.cameraX < 0) {
      this.cameraX = targetCamX;
      this.cameraY = targetCamY;
    } else {
      this.cameraX += (targetCamX - this.cameraX) * 0.3;
      this.cameraY += (targetCamY - this.cameraY) * 0.3;
    }
    var camX = Math.round(this.cameraX);
    var camY = Math.round(this.cameraY);

    // Request animation frame for smooth camera if still interpolating
    if (Math.abs(this.cameraX - targetCamX) > 0.5 || Math.abs(this.cameraY - targetCamY) > 0.5) {
      if (!this._animating) {
        this._animating = true;
        var self = this;
        requestAnimationFrame(function() {
          self._animating = false;
          self.render(game);
        });
      }
    }

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

        // Render tiles with sprites and floor palette
        var tileRoomIdx = (roomMap && roomMap[ty]) ? roomMap[ty][tx] : -1;
        switch (tile) {
          case Dungeon.TILE.WALL:
            // Try PNG wall sprite first
            var wallPng = SpriteLoader.get('wall_mid');
            if (wallPng) {
              ctx.drawImage(wallPng, drawX, drawY, TILE_SIZE, TILE_SIZE);
              if (dimmed) {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              }
            } else if (!drawSprite(ctx, palette.wallSprite, drawX, drawY, dimmed)) {
              // Try default wall sprite fallback
              if (palette.wallSprite !== 'wall' && !drawSprite(ctx, 'wall', drawX, drawY, dimmed)) {
                // Text fallback
                ctx.fillStyle = palette.wall;
                ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                if (dimmed) { ctx.globalAlpha = 0.35; }
                ctx.fillStyle = '#555';
                ctx.fillText(WALL_CHAR, drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
                ctx.globalAlpha = 1.0;
              }
            }
            break;
          case Dungeon.TILE.STAIRS_DOWN:
            // Draw floor background under stairs
            var stairFloorPng = SpriteLoader.get('floor_' + (((tx + ty) % 8) + 1));
            if (stairFloorPng) {
              ctx.drawImage(stairFloorPng, drawX, drawY, TILE_SIZE, TILE_SIZE);
            } else {
              ctx.fillStyle = getRoomFloorColor(palette, tileRoomIdx);
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            if (!drawSprite(ctx, 'stairs', drawX, drawY, dimmed)) {
              if (dimmed) { ctx.globalAlpha = 0.35; }
              ctx.fillStyle = COLORS.stairs;
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = '#fff';
              ctx.fillText(STAIRS_CHAR, drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
              ctx.globalAlpha = 1.0;
            }
            break;
          case Dungeon.TILE.FLOOR:
            // Try PNG floor tile first (variation based on position)
            var floorIdx = ((tx + ty) % 8) + 1;
            var floorPng = SpriteLoader.get('floor_' + floorIdx);
            if (floorPng) {
              ctx.drawImage(floorPng, drawX, drawY, TILE_SIZE, TILE_SIZE);
            } else {
              var floorColor;
              if (isShopTile(game, tx, ty)) {
                floorColor = COLORS.shopFloor;
              } else if (isMonsterHouseTile(game, tx, ty)) {
                floorColor = COLORS.monsterHouseFloor;
              } else if (isTreasureRoomTile(game, tx, ty)) {
                floorColor = '#2e2a1a';
              } else {
                floorColor = getRoomFloorColor(palette, tileRoomIdx);
              }
              ctx.fillStyle = floorColor;
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            // Special overlays
            if (game.sanctuaryTiles && game.sanctuaryTiles.has(tx + ',' + ty)) {
              ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            if (isTreasureRoomTile(game, tx, ty)) {
              ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            if (isShopTile(game, tx, ty) && floorPng) {
              ctx.fillStyle = 'rgba(100, 80, 40, 0.2)';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            if (isMonsterHouseTile(game, tx, ty) && floorPng) {
              ctx.fillStyle = 'rgba(150, 30, 30, 0.15)';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            if (dimmed) {
              ctx.fillStyle = 'rgba(0,0,0,0.5)';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            break;
          case Dungeon.TILE.CORRIDOR:
            // Use PNG floor tile for corridors too (slightly darker overlay)
            var corrFloorPng = SpriteLoader.get('floor_' + (((tx + ty) % 4) + 1));
            if (corrFloorPng) {
              ctx.drawImage(corrFloorPng, drawX, drawY, TILE_SIZE, TILE_SIZE);
              ctx.fillStyle = 'rgba(0,0,0,0.15)';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            } else {
              ctx.fillStyle = palette.corridor;
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            if (dimmed) {
              ctx.fillStyle = 'rgba(0,0,0,0.5)';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            break;
          case Dungeon.TILE.WATER:
            // Animated water shimmer
            var waterFrame = (Date.now() >> 9) & 1; // alternates ~every 500ms
            ctx.fillStyle = waterFrame ? '#1a3a6a' : '#1a4a7a';
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            if (!dimmed) {
              ctx.globalAlpha = 0.3;
              ctx.fillStyle = '#4fc3f7';
              ctx.font = 'bold 14px monospace';
              ctx.fillText('~', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
              ctx.globalAlpha = 1.0;
              ctx.font = 'bold 16px monospace';
            }
            if (dimmed) {
              ctx.fillStyle = 'rgba(0,0,0,0.5)';
              ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
            break;
          case Dungeon.TILE.LAVA:
            // Animated lava shimmer
            var lavaFrame = (Date.now() >> 9) & 1;
            ctx.fillStyle = lavaFrame ? '#5a1a0a' : '#7a2a0a';
            ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
            if (!dimmed) {
              ctx.globalAlpha = 0.4;
              ctx.fillStyle = '#ff6600';
              ctx.font = 'bold 14px monospace';
              ctx.fillText('~', drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);
              ctx.globalAlpha = 1.0;
              ctx.font = 'bold 16px monospace';
            }
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
    var seeAllEnemies = (player.bracelet && player.bracelet.effect === 'see_all') || (game.sightBoost > 0);
    ctx.font = 'bold 18px monospace';
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (enemy.dead) continue;

      if (!visibleArr[enemy.y][enemy.x] && !mapRevealed && !seeAllEnemies) continue;

      // Don't render invisible enemies (unless player has see_all)
      if (enemy.invisible && !seeAllEnemies) continue;

      var eScreenX = (enemy.x - camX) * TILE_SIZE;
      var eScreenY = (enemy.y - camY) * TILE_SIZE;

      // Try PNG sprite first, then coded sprite, then text fallback
      var enemyPngName = enemy.enemyId ? ENEMY_PNG_MAP[enemy.enemyId] : null;
      var enemySpriteName = enemy.enemyId ? ENEMY_SPRITE_MAP[enemy.enemyId] : null;
      // Use hostile shopkeeper sprite when angry (coded only)
      if (enemySpriteName === 'shopkeeper' && game.shopkeeperHostile) {
        enemySpriteName = 'shopkeeper_hostile';
        enemyPngName = null; // no PNG for hostile variant
      }
      // Use decoy sprite for decoys (coded only)
      if (enemy.isDecoy) {
        enemySpriteName = 'decoy';
        enemyPngName = null;
      }
      var drawnEnemy = false;
      if (enemyPngName) {
        var enemyPng = SpriteLoader.getAnimFrame(enemyPngName, 2);
        if (enemyPng) {
          // Check if this is a tall sprite (16x28) or small (16x16)
          var isSmall = (enemyPng.naturalHeight <= 16);
          if (isSmall) {
            ctx.drawImage(enemyPng, eScreenX, eScreenY, TILE_SIZE, TILE_SIZE);
          } else {
            var eSpriteH = TILE_SIZE * (enemyPng.naturalHeight / enemyPng.naturalWidth);
            ctx.drawImage(enemyPng, eScreenX, eScreenY - (eSpriteH - TILE_SIZE), TILE_SIZE, eSpriteH);
          }
          drawnEnemy = true;
        }
      }
      if (!drawnEnemy) {
        if (enemySpriteName && drawSprite(ctx, enemySpriteName, eScreenX, eScreenY, false, true)) {
          // Coded sprite drawn
        } else {
          // Text fallback
          ctx.fillStyle = enemy.color;
          ctx.fillText(enemy.char, eScreenX + TILE_SIZE / 2, eScreenY + TILE_SIZE / 2);
        }
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

    // Draw dungeon NPCs
    if (game.dungeonNPCs) {
      for (var ni = 0; ni < game.dungeonNPCs.length; ni++) {
        var dnpc = game.dungeonNPCs[ni];
        if (!visibleArr[dnpc.y] || !visibleArr[dnpc.y][dnpc.x]) continue;

        var npcScreenX = (dnpc.x - camX) * TILE_SIZE;
        var npcScreenY = (dnpc.y - camY) * TILE_SIZE;

        // Try sprite first
        if (!drawSprite(ctx, dnpc.sprite, npcScreenX, npcScreenY, false, false)) {
          // Fallback to text
          ctx.fillStyle = dnpc.color;
          ctx.font = 'bold 18px monospace';
          ctx.fillText(dnpc.char, npcScreenX + TILE_SIZE / 2, npcScreenY + TILE_SIZE / 2);
        }

        // Name tag above NPC
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(dnpc.name, npcScreenX + TILE_SIZE / 2, npcScreenY - 4);
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
      }
    }

    // Draw player ON TOP
    var playerScreenX = (player.x - camX) * TILE_SIZE;
    var playerScreenY = (player.y - camY) * TILE_SIZE;

    // Try PNG sprite first (16x28 character sprites → scale taller)
    var playerPng = SpriteLoader.getAnimFrame('player_idle', 4);
    if (playerPng) {
      var pSpriteH = TILE_SIZE * (28 / 16);
      ctx.drawImage(playerPng, playerScreenX, playerScreenY - (pSpriteH - TILE_SIZE), TILE_SIZE, pSpriteH);
    } else if (!drawSprite(ctx, 'player', playerScreenX, playerScreenY, false, true)) {
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

    // Combat animations
    if (game.animations && game.animations.length > 0) {
      for (var ai = game.animations.length - 1; ai >= 0; ai--) {
        var anim = game.animations[ai];
        var animDrawX = (anim.x - camX) * TILE_SIZE;
        var animDrawY = (anim.y - camY) * TILE_SIZE;

        switch (anim.type) {
          case 'lunge':
            // Player lunge toward enemy
            // Handled via offset in player drawing above (not here)
            break;
          case 'white_flash':
            var flashAlpha = Math.max(0, 1 - anim.frame / anim.maxFrames);
            ctx.fillStyle = 'rgba(255,255,255,' + (flashAlpha * 0.7) + ')';
            ctx.fillRect(animDrawX, animDrawY, TILE_SIZE, TILE_SIZE);
            break;
          case 'red_tint':
            var redAlpha = Math.max(0, 1 - anim.frame / anim.maxFrames);
            ctx.fillStyle = 'rgba(255,50,50,' + (redAlpha * 0.5) + ')';
            ctx.fillRect(animDrawX, animDrawY, TILE_SIZE, TILE_SIZE);
            break;
          case 'death_fade':
            var fadeAlpha = Math.max(0, 1 - anim.frame / anim.maxFrames);
            // Draw the enemy sprite fading out
            ctx.globalAlpha = fadeAlpha;
            ctx.fillStyle = '#fff';
            ctx.fillRect(animDrawX, animDrawY, TILE_SIZE, TILE_SIZE);
            ctx.globalAlpha = 1.0;
            break;
          case 'particles':
            // Small dots scattering from position
            var particles = anim.data.particles;
            for (var pi = 0; pi < particles.length; pi++) {
              var part = particles[pi];
              var px = animDrawX + TILE_SIZE / 2 + part.vx * anim.frame;
              var py = animDrawY + TILE_SIZE / 2 + part.vy * anim.frame;
              var partAlpha = Math.max(0, 1 - anim.frame / anim.maxFrames);
              ctx.fillStyle = 'rgba(' + part.r + ',' + part.g + ',' + part.b + ',' + partAlpha + ')';
              ctx.fillRect(px, py, 2, 2);
            }
            break;
          case 'critical_text':
            var ctAlpha = Math.max(0, 1 - anim.frame / anim.maxFrames);
            var ctY = animDrawY - anim.frame * 1.5;
            ctx.globalAlpha = ctAlpha;
            ctx.font = 'bold 16px monospace';
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillText('会心の一撃！', animDrawX + TILE_SIZE / 2, ctY);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;
            ctx.font = 'bold 16px monospace';
            break;
        }

        anim.frame++;
        if (anim.frame >= anim.maxFrames) {
          game.animations.splice(ai, 1);
        }
      }

      // Request animation frame to continue animations
      if (game.animations.length > 0) {
        var self = this;
        var animGame = game;
        if (!this._combatAnimating) {
          this._combatAnimating = true;
          requestAnimationFrame(function() {
            self._combatAnimating = false;
            self.render(animGame);
          });
        }
      }
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

    var playerRoom = game.getPlayerRoom ? game.getPlayerRoom() : null;

    for (var y = 0; y < dungeon.height; y++) {
      for (var x = 0; x < dungeon.width; x++) {
        if (!exploredArr[y][x]) continue;

        var tile = dungeon.grid[y][x];
        var isVisible = visibleArr[y][x];
        var tileBright = isVisible || mapRevealed;

        if (tile === Dungeon.TILE.WALL) {
          ctx.fillStyle = tileBright ? '#3a3a3a' : '#1a1a1a';
        } else if (tile === Dungeon.TILE.STAIRS_DOWN) {
          ctx.fillStyle = tileBright ? '#ffffff' : '#7a8a9a';
        } else if (tile === Dungeon.TILE.WATER) {
          ctx.fillStyle = tileBright ? '#1a4a7a' : '#0a2a4a';
        } else if (tile === Dungeon.TILE.LAVA) {
          ctx.fillStyle = tileBright ? '#7a2a0a' : '#3a1505';
        } else {
          if (isShopTile(game, x, y)) {
            ctx.fillStyle = tileBright ? '#4a4020' : '#2a2510';
          } else if (isMonsterHouseTile(game, x, y)) {
            ctx.fillStyle = tileBright ? '#3a1818' : '#201010';
          } else {
            ctx.fillStyle = tileBright ? '#1a2030' : '#0f1520';
          }
        }

        ctx.fillRect(x * t, y * t, t, t);
      }
    }

    // Room outlines
    if (dungeon.rooms) {
      for (var ri = 0; ri < dungeon.rooms.length; ri++) {
        var rm = dungeon.rooms[ri];
        if (!rm.x1 && rm.x1 !== 0) continue;
        // Check if any tile in room is explored
        var roomExplored = false;
        for (var ry = rm.y1; ry <= rm.y2 && !roomExplored; ry++) {
          for (var rx = rm.x1; rx <= rm.x2 && !roomExplored; rx++) {
            if (exploredArr[ry] && exploredArr[ry][rx]) roomExplored = true;
          }
        }
        if (!roomExplored) continue;

        var isPlayerRoom = (playerRoom === rm);
        ctx.strokeStyle = isPlayerRoom ? '#4fc3f7' : '#333';
        ctx.lineWidth = isPlayerRoom ? 2 : 1;
        ctx.strokeRect(rm.x1 * t - 1, rm.y1 * t - 1, (rm.x2 - rm.x1 + 1) * t + 2, (rm.y2 - rm.y1 + 1) * t + 2);
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

    // Items on minimap (yellow, 3px dots centered)
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!visibleArr[item.y][item.x] && !mapRevealed) continue;
      ctx.fillStyle = '#ffeb3b';
      var ix = item.x * t + Math.floor((t - 3) / 2);
      var iy = item.y * t + Math.floor((t - 3) / 2);
      ctx.fillRect(ix, iy, 3, 3);
    }

    // Enemies on minimap (red, 4px dots centered)
    var seeAllMini = (player.bracelet && player.bracelet.effect === 'see_all') || (game.sightBoost > 0);
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (enemy.dead) continue;
      if (!visibleArr[enemy.y][enemy.x] && !mapRevealed && !seeAllMini) continue;
      ctx.fillStyle = enemy.isShopkeeper ? '#ffd700' : '#ff4444';
      var ex = enemy.x * t + Math.floor((t - 4) / 2);
      var ey = enemy.y * t + Math.floor((t - 4) / 2);
      ctx.fillRect(ex, ey, 4, 4);
    }

    // Dungeon NPCs on minimap (green, 4px dots)
    if (game.dungeonNPCs) {
      for (var ni = 0; ni < game.dungeonNPCs.length; ni++) {
        var dnpc = game.dungeonNPCs[ni];
        if (!visibleArr[dnpc.y] || !visibleArr[dnpc.y][dnpc.x]) continue;
        ctx.fillStyle = '#66bb6a';
        var dnx = dnpc.x * t + Math.floor((t - 4) / 2);
        var dny = dnpc.y * t + Math.floor((t - 4) / 2);
        ctx.fillRect(dnx, dny, 4, 4);
      }
    }

    // Player on minimap (cyan, 8px dot centered)
    ctx.fillStyle = '#00e5ff';
    var px = player.x * t + Math.floor(t / 2) - 4;
    var py = player.y * t + Math.floor(t / 2) - 4;
    ctx.fillRect(px, py, 8, 8);
  };

  return Renderer;
})();
