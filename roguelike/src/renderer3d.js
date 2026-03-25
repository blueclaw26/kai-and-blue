// 3D Renderer using Three.js — Drop-in alternative to 2D Renderer
// Same public API: init(container), render(game), resetCamera()
var Renderer3D = (function() {
  'use strict';

  // Color-to-hex helper for CSS color strings
  function cssToHex(css) {
    if (typeof css === 'number') return css;
    if (!css || css[0] !== '#') return 0x888888;
    return parseInt(css.slice(1), 16);
  }

  // Floor zone palettes (match 2D renderer zones)
  function getZoneColors(floorNum) {
    if (floorNum <= 10) return { floor: 0x5d4037, wall: 0x3e2723, corridor: 0x4e342e };   // 洞窟
    if (floorNum <= 25) return { floor: 0x37474f, wall: 0x263238, corridor: 0x2c3e42 };   // 地底湖
    if (floorNum <= 50) return { floor: 0x4e342e, wall: 0x3e1a0e, corridor: 0x3e2a20 };   // 溶岩洞
    if (floorNum <= 75) return { floor: 0x546e7a, wall: 0x37474f, corridor: 0x455a64 };   // 凍土
    return { floor: 0x1a0033, wall: 0x0d001a, corridor: 0x15002a };                       // 深淵
  }

  // Tile geometry caches (created once)
  var _floorGeo = null;
  var _wallGeo = null;
  var _materialCache = {};

  function getFloorGeo() {
    if (!_floorGeo) {
      _floorGeo = new THREE.PlaneGeometry(1, 1);
      _floorGeo.rotateX(-Math.PI / 2);
    }
    return _floorGeo;
  }

  function getWallGeo() {
    if (!_wallGeo) {
      _wallGeo = new THREE.BoxGeometry(1, 1.5, 1);
    }
    return _wallGeo;
  }

  function getCachedMaterial(color, opts) {
    var key = color + '_' + (opts ? JSON.stringify(opts) : '');
    if (!_materialCache[key]) {
      var params = { color: color };
      if (opts && opts.transparent) {
        params.transparent = true;
        params.opacity = opts.opacity || 0.7;
      }
      if (opts && opts.emissive) {
        params.emissive = opts.emissive;
      }
      _materialCache[key] = new THREE.MeshLambertMaterial(params);
    }
    return _materialCache[key];
  }

  // === Renderer Constructor ===

  function Renderer3D(canvas, minimapCanvas) {
    // Keep reference to original 2D canvas/minimap for shared HUD
    this.canvas2d = canvas;
    this.miniCanvas = minimapCanvas;
    this.miniCtx = minimapCanvas.getContext('2d');

    this.scene = null;
    this.camera = null;
    this.webglRenderer = null;
    this.tileSize = 1;

    // Tile mesh pool
    this.tileGroup = null;
    this.entityGroup = null;
    this.itemGroup = null;
    this.tileMeshes = [];  // [y][x] -> mesh or null
    this.entityMeshes = {}; // entityKey -> { mesh, x, y, targetX, targetY }
    this.itemMeshes = {};   // key -> mesh
    this.stairsMesh = null;

    // Camera state
    this.cameraX = -1;
    this.cameraY = -1;

    // Lights
    this.playerLight = null;
    this.ambientLight = null;
    this.directionalLight = null;

    // Animation state
    this._animFrame = 0;
    this._renderLoopRunning = false;
    this._lastFloorNum = -1;
    this._lastDungeonId = null;

    // Track current floor for rebuilds
    this._builtFloor = -1;
    this._builtScene = null;

    // Smooth camera
    this._smoothCamX = 0;
    this._smoothCamZ = 0;
  }

  // === Init ===

  Renderer3D.prototype.init = function() {
    // Create the Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // Orthographic camera for isometric view
    var container = document.getElementById('canvas-area');
    var w = container ? container.clientWidth : 600;
    var h = container ? container.clientHeight : 432;
    var aspect = w / h;
    var frustumSize = 14;
    this.frustumSize = frustumSize;

    this.camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2, frustumSize * aspect / 2,
      frustumSize / 2, frustumSize / -2,
      0.1, 1000
    );
    this.camera.position.set(10, 14, 10);
    this.camera.lookAt(0, 0, 0);

    // WebGL renderer
    this.webglRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.webglRenderer.setSize(w, h);
    this.webglRenderer.setPixelRatio(window.devicePixelRatio || 1);
    this.webglRenderer.shadowMap.enabled = true;
    this.webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Replace the 2D canvas with WebGL canvas
    this.canvas2d.style.display = 'none';
    var canvasArea = document.getElementById('canvas-area');
    this.webglRenderer.domElement.id = 'game-canvas-3d';
    this.webglRenderer.domElement.style.display = 'block';
    canvasArea.appendChild(this.webglRenderer.domElement);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -20;
    this.directionalLight.shadow.camera.right = 20;
    this.directionalLight.shadow.camera.top = 20;
    this.directionalLight.shadow.camera.bottom = -20;
    this.scene.add(this.directionalLight);

    // Player torch light
    this.playerLight = new THREE.PointLight(0xffaa44, 1.5, 10);
    this.playerLight.castShadow = false; // perf: skip shadow for point light
    this.scene.add(this.playerLight);

    // Groups
    this.tileGroup = new THREE.Group();
    this.scene.add(this.tileGroup);
    this.entityGroup = new THREE.Group();
    this.scene.add(this.entityGroup);
    this.itemGroup = new THREE.Group();
    this.scene.add(this.itemGroup);

    // Handle resize
    var self = this;
    window.addEventListener('resize', function() {
      var container = document.getElementById('canvas-area');
      if (!container) return;
      var w = container.clientWidth;
      var h = container.clientHeight;
      var aspect = w / h;
      self.camera.left = self.frustumSize * aspect / -2;
      self.camera.right = self.frustumSize * aspect / 2;
      self.camera.top = self.frustumSize / 2;
      self.camera.bottom = self.frustumSize / -2;
      self.camera.updateProjectionMatrix();
      self.webglRenderer.setSize(w, h);
    });
  };

  // === Destroy (for toggling back to 2D) ===

  Renderer3D.prototype.destroy = function() {
    if (this._renderLoopRunning) {
      this._renderLoopRunning = false;
    }
    var el = document.getElementById('game-canvas-3d');
    if (el && el.parentNode) el.parentNode.removeChild(el);
    this.canvas2d.style.display = '';
    if (this.webglRenderer) {
      this.webglRenderer.dispose();
      this.webglRenderer = null;
    }
    this.scene = null;
    this.camera = null;
  };

  // === Reset Camera ===

  Renderer3D.prototype.resetCamera = function() {
    this.cameraX = -1;
    this.cameraY = -1;
  };

  // === Build 3D tile map from dungeon data ===

  Renderer3D.prototype._buildTileMap = function(game) {
    // Clear old tiles
    while (this.tileGroup.children.length > 0) {
      this.tileGroup.remove(this.tileGroup.children[0]);
    }
    this.tileMeshes = [];
    this.stairsMesh = null;

    var dungeon = game.dungeon;
    var floorNum = game.floorNum || 1;
    var zone = getZoneColors(floorNum);

    var floorMat = getCachedMaterial(zone.floor);
    var floorMatDim = getCachedMaterial(zone.floor);
    var wallMat = getCachedMaterial(zone.wall);
    var corridorMat = getCachedMaterial(zone.corridor);
    var waterMat = new THREE.MeshLambertMaterial({ color: 0x1a4a7a, transparent: true, opacity: 0.7 });
    var lavaMat = new THREE.MeshLambertMaterial({ color: 0x7a2a0a, transparent: true, opacity: 0.8, emissive: 0x3a1505 });

    var floorGeo = getFloorGeo();
    var wallGeo = getWallGeo();

    for (var y = 0; y < dungeon.height; y++) {
      this.tileMeshes[y] = [];
      for (var x = 0; x < dungeon.width; x++) {
        var tile = dungeon.grid[y][x];
        var mesh = null;

        switch (tile) {
          case 0: // WALL
            mesh = new THREE.Mesh(wallGeo, wallMat);
            mesh.position.set(x, 0.75, y);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            break;
          case 1: // FLOOR
            mesh = new THREE.Mesh(floorGeo, floorMat);
            mesh.position.set(x, 0, y);
            mesh.receiveShadow = true;
            break;
          case 2: // CORRIDOR
            mesh = new THREE.Mesh(floorGeo, corridorMat);
            mesh.position.set(x, 0, y);
            mesh.receiveShadow = true;
            break;
          case 3: // STAIRS_DOWN
            mesh = new THREE.Mesh(floorGeo, floorMat);
            mesh.position.set(x, 0, y);
            mesh.receiveShadow = true;
            // Add stairs model on top
            var stairsModel = Models3D.createStairs();
            stairsModel.position.set(x, 0, y);
            this.tileGroup.add(stairsModel);
            this.stairsMesh = stairsModel;
            break;
          case 4: // WATER
            mesh = new THREE.Mesh(floorGeo, waterMat);
            mesh.position.set(x, -0.05, y);
            mesh.receiveShadow = true;
            mesh.userData.isWater = true;
            break;
          case 6: // LAVA
            mesh = new THREE.Mesh(floorGeo, lavaMat);
            mesh.position.set(x, -0.03, y);
            mesh.receiveShadow = true;
            mesh.userData.isLava = true;
            break;
        }

        if (mesh) {
          mesh.userData.tileX = x;
          mesh.userData.tileY = y;
          mesh.userData.tileType = tile;
          mesh.userData.baseMaterial = mesh.material;
          mesh.visible = false; // FOV controls visibility
          this.tileGroup.add(mesh);
        }
        this.tileMeshes[y][x] = mesh;
      }
    }

    this._builtFloor = floorNum;
    this._builtScene = 'dungeon';
  };

  // === Update tile visibility (FOV) ===

  Renderer3D.prototype._updateTileVisibility = function(game) {
    var visible = game.visible;
    var explored = game.explored;
    var mapRevealed = game.mapRevealed;

    for (var y = 0; y < this.tileMeshes.length; y++) {
      for (var x = 0; x < (this.tileMeshes[y] ? this.tileMeshes[y].length : 0); x++) {
        var mesh = this.tileMeshes[y][x];
        if (!mesh) continue;

        var isVis = visible[y] && visible[y][x];
        var isExp = explored[y] && explored[y][x];

        if (mapRevealed || isVis) {
          mesh.visible = true;
          // Full brightness
          if (mesh.material !== mesh.userData.baseMaterial) {
            mesh.material = mesh.userData.baseMaterial;
          }
        } else if (isExp) {
          mesh.visible = true;
          // Dimmed — use darker version
          if (!mesh.userData.dimMaterial) {
            var baseMat = mesh.userData.baseMaterial;
            var dimMat = baseMat.clone();
            var c = new THREE.Color(baseMat.color.getHex());
            c.multiplyScalar(0.3);
            dimMat.color = c;
            mesh.userData.dimMaterial = dimMat;
          }
          mesh.material = mesh.userData.dimMaterial;
        } else {
          mesh.visible = false;
        }
      }
    }

    // Stairs visibility
    if (this.stairsMesh) {
      var stairsPos = this._getStairsPos(game);
      if (stairsPos) {
        var sv = visible[stairsPos.y] && visible[stairsPos.y][stairsPos.x];
        var se = explored[stairsPos.y] && explored[stairsPos.y][stairsPos.x];
        this.stairsMesh.visible = mapRevealed || sv || se;
      }
    }
  };

  Renderer3D.prototype._getStairsPos = function(game) {
    var d = game.dungeon;
    for (var y = 0; y < d.height; y++) {
      for (var x = 0; x < d.width; x++) {
        if (d.grid[y][x] === 3) return { x: x, y: y };
      }
    }
    return null;
  };

  // === Entity management ===

  Renderer3D.prototype._updateEntities = function(game) {
    var player = game.player;
    var enemies = game.enemies;
    var items = game.items;
    var visible = game.visible;
    var mapRevealed = game.mapRevealed;
    var seeAll = (player.bracelet && player.bracelet.effect === 'see_all') || (game.sightBoost > 0);

    // Track which entities are still present
    var activeKeys = {};

    // --- Player ---
    var playerKey = 'player';
    activeKeys[playerKey] = true;
    if (!this.entityMeshes[playerKey]) {
      var playerModel = Models3D.createPlayer();
      this.entityGroup.add(playerModel);
      this.entityMeshes[playerKey] = { mesh: playerModel, x: player.x, y: player.y };
    }
    var pe = this.entityMeshes[playerKey];
    // Smooth lerp to new position
    pe.x += (player.x - pe.x) * 0.25;
    pe.y += (player.y - pe.y) * 0.25;
    pe.mesh.position.set(pe.x, 0, pe.y);
    // Idle bob
    pe.mesh.position.y = Math.sin(this._animFrame * 0.05) * 0.05;
    pe.mesh.visible = true;

    // --- Enemies ---
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (enemy.dead) continue;

      var isVis = visible[enemy.y] && visible[enemy.y][enemy.x];
      if (!isVis && !mapRevealed && !seeAll) continue;
      if (enemy.invisible && !seeAll) continue;

      var eKey = 'enemy_' + i + '_' + enemy.enemyId;
      activeKeys[eKey] = true;

      if (!this.entityMeshes[eKey]) {
        var family = enemy.family || 'mamel';
        var rank = enemy.familyRank || 1;
        var color = cssToHex(enemy.color) || 0xff4444;
        var enemyModel = Models3D.createEnemy(family, color, rank);
        this.entityGroup.add(enemyModel);
        this.entityMeshes[eKey] = { mesh: enemyModel, x: enemy.x, y: enemy.y };
      }

      var ee = this.entityMeshes[eKey];
      ee.x += (enemy.x - ee.x) * 0.25;
      ee.y += (enemy.y - ee.y) * 0.25;
      ee.mesh.position.set(ee.x, 0, ee.y);
      // Idle bob (different phase per enemy)
      ee.mesh.position.y = Math.sin(this._animFrame * 0.04 + i * 1.5) * 0.04;

      // Sleeping overlay: scale down slightly
      if (enemy.sleeping) {
        ee.mesh.scale.setScalar(0.8);
      } else {
        ee.mesh.scale.setScalar(1.0);
      }

      ee.mesh.visible = true;
    }

    // --- Items ---
    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      var isItemVis = visible[item.y] && visible[item.y][item.x];
      if (!isItemVis && !mapRevealed) continue;

      var iKey = 'item_' + j + '_' + (item.dataKey || item.type || 'gold');
      activeKeys[iKey] = true;

      if (!this.entityMeshes[iKey]) {
        var itemType = item.isGold ? 'gold' : (item.type || 'gold');
        var itemModel = Models3D.createItemModel(itemType);
        this.entityGroup.add(itemModel);
        this.entityMeshes[iKey] = { mesh: itemModel, x: item.x, y: item.y };
      }

      var ie = this.entityMeshes[iKey];
      ie.mesh.position.set(item.x, 0, item.y);
      // Gentle spin for items
      ie.mesh.rotation.y = this._animFrame * 0.02;
      ie.mesh.visible = true;
    }

    // --- Traps ---
    var traps = game.traps || [];
    var seeTraps = player.bracelet && player.bracelet.effect === 'see_traps';
    for (var k = 0; k < traps.length; k++) {
      var trap = traps[k];
      if (trap.consumed) continue;
      if (!trap.visible && !seeTraps) continue;
      var isTrapVis = visible[trap.y] && visible[trap.y][trap.x];
      var isTrapExp = game.explored[trap.y] && game.explored[trap.y][trap.x];
      if (!isTrapVis && !isTrapExp) continue;

      var tKey = 'trap_' + k;
      activeKeys[tKey] = true;

      if (!this.entityMeshes[tKey]) {
        var trapModel = Models3D.createTrap();
        this.entityGroup.add(trapModel);
        this.entityMeshes[tKey] = { mesh: trapModel, x: trap.x, y: trap.y };
      }

      var te = this.entityMeshes[tKey];
      te.mesh.position.set(trap.x, 0, trap.y);
      te.mesh.visible = true;
    }

    // --- Dungeon NPCs ---
    if (game.dungeonNPCs) {
      for (var ni = 0; ni < game.dungeonNPCs.length; ni++) {
        var dnpc = game.dungeonNPCs[ni];
        var npcVis = visible[dnpc.y] && visible[dnpc.y][dnpc.x];
        if (!npcVis) continue;

        var nKey = 'npc_' + ni;
        activeKeys[nKey] = true;

        if (!this.entityMeshes[nKey]) {
          // NPCs as colored spheres with a label feel
          var npcModel = new THREE.Group();
          var npcBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8),
            new THREE.MeshLambertMaterial({ color: cssToHex(dnpc.color) })
          );
          npcBody.position.y = 0.4;
          npcModel.add(npcBody);
          var npcHead = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xffcc80 })
          );
          npcHead.position.y = 0.85;
          npcModel.add(npcHead);
          this.entityGroup.add(npcModel);
          this.entityMeshes[nKey] = { mesh: npcModel, x: dnpc.x, y: dnpc.y };
        }

        var ne = this.entityMeshes[nKey];
        ne.mesh.position.set(dnpc.x, 0, dnpc.y);
        ne.mesh.visible = true;
      }
    }

    // Clean up removed entities
    var keysToRemove = [];
    for (var key in this.entityMeshes) {
      if (!activeKeys[key]) {
        keysToRemove.push(key);
      }
    }
    for (var ri = 0; ri < keysToRemove.length; ri++) {
      var rk = keysToRemove[ri];
      this.entityGroup.remove(this.entityMeshes[rk].mesh);
      delete this.entityMeshes[rk];
    }
  };

  // === Camera follow ===

  Renderer3D.prototype._updateCamera = function(playerX, playerY) {
    var tx = playerX * this.tileSize;
    var tz = playerY * this.tileSize;

    if (this.cameraX < 0) {
      this._smoothCamX = tx;
      this._smoothCamZ = tz;
      this.cameraX = 0;
    }

    this._smoothCamX += (tx - this._smoothCamX) * 0.12;
    this._smoothCamZ += (tz - this._smoothCamZ) * 0.12;

    var cx = this._smoothCamX;
    var cz = this._smoothCamZ;

    this.camera.position.set(cx + 10, 14, cz + 10);
    this.camera.lookAt(cx, 0, cz);

    // Player torch
    this.playerLight.position.set(cx, 3, cz);

    // Move directional light to follow roughly
    this.directionalLight.position.set(cx + 10, 20, cz + 10);
    this.directionalLight.target.position.set(cx, 0, cz);
    this.directionalLight.target.updateMatrixWorld();
  };

  // === Water/Lava animation ===

  Renderer3D.prototype._animateWaterLava = function() {
    var time = this._animFrame * 0.05;
    for (var y = 0; y < this.tileMeshes.length; y++) {
      for (var x = 0; x < (this.tileMeshes[y] ? this.tileMeshes[y].length : 0); x++) {
        var mesh = this.tileMeshes[y][x];
        if (!mesh || !mesh.visible) continue;

        if (mesh.userData.isWater) {
          mesh.position.y = -0.05 + Math.sin(time + x * 0.5 + y * 0.7) * 0.03;
        } else if (mesh.userData.isLava) {
          mesh.position.y = -0.03 + Math.sin(time * 1.5 + x * 0.3 + y * 0.4) * 0.02;
          // Pulsing emissive
          if (mesh.material.emissive) {
            var pulse = 0.3 + Math.sin(time * 2) * 0.15;
            mesh.material.emissiveIntensity = pulse;
          }
        }
      }
    }
  };

  // === Minimap (reuses 2D minimap canvas) ===

  Renderer3D.prototype._renderMinimap = function(game) {
    var dungeon = game.dungeon;
    var player = game.player;
    var enemies = game.enemies;
    var items = game.items;
    var exploredArr = game.explored;
    var visibleArr = game.visible;
    var mapRevealed = game.mapRevealed;

    var ctx = this.miniCtx;
    var t = 6;
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

        if (tile === 0) {
          ctx.fillStyle = tileBright ? '#3a3a3a' : '#1a1a1a';
        } else if (tile === 3) {
          ctx.fillStyle = tileBright ? '#ffffff' : '#7a8a9a';
        } else if (tile === 4) {
          ctx.fillStyle = tileBright ? '#1a4a7a' : '#0a2a4a';
        } else if (tile === 6) {
          ctx.fillStyle = tileBright ? '#7a2a0a' : '#3a1505';
        } else {
          ctx.fillStyle = tileBright ? '#1a2030' : '#0f1520';
        }

        ctx.fillRect(x * t, y * t, t, t);
      }
    }

    // Items
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!visibleArr[item.y][item.x] && !mapRevealed) continue;
      ctx.fillStyle = '#ffeb3b';
      ctx.fillRect(item.x * t + 1, item.y * t + 1, 3, 3);
    }

    // Enemies
    var seeAll = (player.bracelet && player.bracelet.effect === 'see_all') || (game.sightBoost > 0);
    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (enemy.dead) continue;
      if (!visibleArr[enemy.y][enemy.x] && !mapRevealed && !seeAll) continue;
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(enemy.x * t + 1, enemy.y * t + 1, 4, 4);
    }

    // Player
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(player.x * t + t / 2 - 4, player.y * t + t / 2 - 4, 8, 8);
  };

  // === Main render entry point ===

  Renderer3D.prototype.render = function(game) {
    if (!this.scene || !this.webglRenderer) return;

    // Village scene: fall back to 2D for now (village is simple)
    if (game.scene === 'village') {
      // Hide 3D canvas, show 2D for village
      var el3d = document.getElementById('game-canvas-3d');
      if (el3d) el3d.style.display = 'none';
      this.canvas2d.style.display = '';
      // Use fallback 2D renderer for village if available
      if (this._fallback2d) {
        this._fallback2d.render(game);
      }
      return;
    }

    // Show 3D canvas for dungeon
    var el3d = document.getElementById('game-canvas-3d');
    if (el3d) el3d.style.display = 'block';
    this.canvas2d.style.display = 'none';

    // Update visibility
    game.updateVisibility();

    // Rebuild tile map when floor changes
    if (this._builtFloor !== (game.floorNum || 1) || this._builtScene !== 'dungeon') {
      this._clearEntities();
      this._buildTileMap(game);
    }

    this._animFrame++;

    // Update FOV
    this._updateTileVisibility(game);

    // Animate water/lava
    this._animateWaterLava();

    // Update entities
    this._updateEntities(game);

    // Camera follow
    this._updateCamera(game.player.x, game.player.y);

    // Render 3D scene
    this.webglRenderer.render(this.scene, this.camera);

    // Minimap (reuses 2D canvas)
    this._renderMinimap(game);
  };

  Renderer3D.prototype._clearEntities = function() {
    // Remove all entity meshes
    for (var key in this.entityMeshes) {
      this.entityGroup.remove(this.entityMeshes[key].mesh);
    }
    this.entityMeshes = {};
  };

  // === Continuous render loop (called from main.js) ===

  Renderer3D.prototype.startRenderLoop = function(game) {
    if (this._renderLoopRunning) return;
    this._renderLoopRunning = true;
    var self = this;

    function loop() {
      if (!self._renderLoopRunning) return;
      self.render(game);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  };

  Renderer3D.prototype.stopRenderLoop = function() {
    this._renderLoopRunning = false;
  };

  return Renderer3D;
})();
