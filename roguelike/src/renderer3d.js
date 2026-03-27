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

  // Seeded random for consistent per-tile variation
  function seededRandom(x, y, seed) {
    var n = Math.sin(x * 12.9898 + y * 78.233 + (seed || 0) * 43758.5453) * 43758.5453;
    return n - Math.floor(n);
  }

  // Multiply a hex color by a scalar factor
  function multiplyColorScalar(hex, factor) {
    var r = Math.min(255, Math.max(0, ((hex >> 16) & 0xff) * factor | 0));
    var g = Math.min(255, Math.max(0, ((hex >> 8) & 0xff) * factor | 0));
    var b = Math.min(255, Math.max(0, (hex & 0xff) * factor | 0));
    return (r << 16) | (g << 8) | b;
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
      _wallGeo = new THREE.BoxGeometry(1, 2.0, 1);
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

  // Ease out quad (no initial reverse motion, just smooth deceleration)
  function easeInOut(t) {
    return 1 - (1 - t) * (1 - t);
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
    this.css2dRenderer = null;
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

    // === Phase 2: Animation system ===
    this._animations = [];  // { mesh, startPos, endPos, startTime, duration, bounce, baseY, onComplete }
    this._prevPositions = {}; // entityKey -> { x, y }
    this._prevHP = {};        // entityKey -> hp

    // Damage popups (CSS2D)
    this._popups = [];

    // Camera rotation (Q/E) — front-facing quarter view (walls parallel to screen edges)
    this._cameraAngle = 0;   // 0 = looking straight along Z axis (front-facing)
    this._targetAngle = 0;
    this._cameraRadius = 12;
    this._cameraHeight = 18;

    // Camera zoom
    this._frustumSize = 14;
    this._targetFrustum = 14;

    // Item mesh rotation tracking
    this._itemMeshes = {};  // iKey -> mesh (for rotation in render loop)

    // === Phase 3: Particles, environment, transitions ===
    this._prevLevel = 0;
    this._waterMeshes = [];  // track water tiles for animation
    this._lavaMeshes = [];   // track lava tiles for animation
    this._lastTime = 0;

    // Floor transition
    this._floorTransition = null; // { phase, startTime }
    this._floorOverlay = null;    // THREE.Mesh for fade overlay
    this._floorAnnounce = null;   // DOM element for floor text

    // Camera shake
    this._shakeStart = null;
    this._shakeDuration = 300;
    this._shakeIntensity = 0.15;

    // Monster house tracking
    this._monsterHouseTriggered = false;

    // Shop visual tracking
    this._shopLights = [];

    // === Phase 4: Village ===
    this._villageNpcMeshes = {};  // npcName -> mesh
    this._villageFrustumSize = 19; // more zoomed out for village
    this._stairsLight = null;     // PointLight for stairs glow

    // Post-processing state
    this._vignetteOverlay = null;
    this._damageOverlay = null;
    this._damageFlashStart = null;
    this._lastTrackedHP = null;
    this._postProcessInited = false;

    // Performance monitoring
    this._fpsFrames = 0;
    this._fpsLastCheck = 0;
    this._fpsLowCount = 0;
    this._performanceDegraded = false;

    // Store game reference for room checks
    this._currentGame = null;

    // Smooth camera timing
    this._lastCamTime = 0;
    this._currentLightDist = 15;
    this._lastStairParticle = 0;
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
    var frustumSize = this._frustumSize;

    this.camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2, frustumSize * aspect / 2,
      frustumSize / 2, frustumSize / -2,
      0.1, 1000
    );
    // Camera positioned directly behind player (along Z axis) and elevated
    // Walls perfectly align with screen edges — no angle
    this.camera.position.set(0, 18, 10);
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

    // CSS2DRenderer for damage popups
    if (typeof THREE.CSS2DRenderer !== 'undefined') {
      this.css2dRenderer = new THREE.CSS2DRenderer();
      this.css2dRenderer.setSize(w, h);
      this.css2dRenderer.domElement.style.position = 'absolute';
      this.css2dRenderer.domElement.style.top = '0';
      this.css2dRenderer.domElement.style.left = '0';
      this.css2dRenderer.domElement.style.pointerEvents = 'none';
      canvasArea.style.position = 'relative';
      canvasArea.appendChild(this.css2dRenderer.domElement);
    }

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
      self._updateRendererSize();
    });

    // === Mouse wheel zoom ===
    this.webglRenderer.domElement.addEventListener('wheel', function(e) {
      e.preventDefault();
      self._targetFrustum += e.deltaY * 0.01 * 0.5;
      self._targetFrustum = Math.max(8, Math.min(40, self._targetFrustum));
    }, { passive: false });

    // === Q/E camera rotation ===
    this._keydownHandler = function(e) {
      if (typeof RENDER_MODE !== 'undefined' && RENDER_MODE !== '3d') return;
      // Only handle Q/E, don't interfere with game controls
      if (e.key === 'q' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Check if inventory or other mode is open
        var g = window._game;
        if (g && (g.inventoryOpen || g.directionMode || g.blankScrollMode || g.extinctionMode ||
                  g.merchantMode || g.blacksmithMode || g.potPutMode || g.potTakeMode ||
                  g.storageMode || g.villageShopMode || g.villageBlacksmithMode)) return;
        e.preventDefault();
        e.stopPropagation();
        self._targetAngle -= Math.PI / 2;
      }
      if (e.key === 'e' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        var g = window._game;
        if (g && (g.inventoryOpen || g.directionMode || g.blankScrollMode || g.extinctionMode ||
                  g.merchantMode || g.blacksmithMode || g.potPutMode || g.potTakeMode ||
                  g.storageMode || g.villageShopMode || g.villageBlacksmithMode)) return;
        // Don't capture 'e' in inventory (use/equip)
        e.preventDefault();
        e.stopPropagation();
        self._targetAngle += Math.PI / 2;
      }
    };
    // Use capture phase so we get Q/E before game input, but only prevent default when we handle it
    document.addEventListener('keydown', this._keydownHandler, true);
  };

  // === Update renderer size ===
  Renderer3D.prototype._updateRendererSize = function() {
    var container = document.getElementById('canvas-area');
    if (!container) return;
    var w = container.clientWidth;
    var h = container.clientHeight;
    var aspect = w / h;
    this.camera.left = this._frustumSize * aspect / -2;
    this.camera.right = this._frustumSize * aspect / 2;
    this.camera.top = this._frustumSize / 2;
    this.camera.bottom = this._frustumSize / -2;
    this.camera.updateProjectionMatrix();
    this.webglRenderer.setSize(w, h);
    if (this.css2dRenderer) {
      this.css2dRenderer.setSize(w, h);
    }
  };

  // === Destroy (for toggling back to 2D) ===

  Renderer3D.prototype.destroy = function() {
    if (this._renderLoopRunning) {
      this._renderLoopRunning = false;
    }
    // Remove Q/E handler
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler, true);
      this._keydownHandler = null;
    }
    var el = document.getElementById('game-canvas-3d');
    if (el && el.parentNode) el.parentNode.removeChild(el);
    // Remove CSS2D overlay
    if (this.css2dRenderer && this.css2dRenderer.domElement.parentNode) {
      this.css2dRenderer.domElement.parentNode.removeChild(this.css2dRenderer.domElement);
    }
    this.canvas2d.style.display = '';
    if (this.webglRenderer) {
      this.webglRenderer.dispose();
      this.webglRenderer = null;
    }
    this.css2dRenderer = null;
    this.scene = null;
    this.camera = null;
    // Clear animation state
    this._animations = [];
    this._prevPositions = {};
    this._prevHP = {};
    this._popups = [];
    this._itemMeshes = {};
    this._floorTransition = null;
    this._shakeStart = null;
    this._waterMeshes = [];
    this._lavaMeshes = [];
    this._shopLights = [];
    this._villageNpcMeshes = {};
    this._stairsLight = null;
    this._lastTrackedHP = null;
    this._damageFlashStart = null;
    // Remove post-processing overlays
    var vigEl = document.getElementById('vignette-overlay');
    if (vigEl && vigEl.parentNode) vigEl.parentNode.removeChild(vigEl);
    var dmgEl = document.getElementById('damage-overlay');
    if (dmgEl && dmgEl.parentNode) dmgEl.parentNode.removeChild(dmgEl);
    this._vignetteOverlay = null;
    this._damageOverlay = null;
    this._postProcessInited = false;
    // Remove floor announcement if present
    var announce = document.getElementById('floor-announce-3d');
    if (announce && announce.parentNode) announce.parentNode.removeChild(announce);
    // Remove loading overlay
    var loadEl = document.getElementById('loading-3d-overlay');
    if (loadEl && loadEl.parentNode) loadEl.parentNode.removeChild(loadEl);
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
    // Reset FOV cache for flicker fix (Fix 4)
    this._prevVisible = null;
    this._prevExplored = null;

    var dungeon = game.dungeon;
    var floorNum = game.floorNum || 1;
    var zone = getZoneColors(floorNum);

    var wallMat = getCachedMaterial(zone.wall);
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
            // Fix 5: Wall texture variation — alternate shades + brick lines
            var wallVariation = seededRandom(x, y, floorNum);
            var wallShade = 0.9 + wallVariation * 0.2; // 0.9 to 1.1
            var variedWallColor = multiplyColorScalar(zone.wall, wallShade);
            var variedWallMat = new THREE.MeshLambertMaterial({ color: variedWallColor });

            var wtc = variedWallColor;
            var wallTopColor = multiplyColorScalar(wtc, 0.6);
            var wallTopMat = new THREE.MeshLambertMaterial({ color: wallTopColor });
            var wallMultiMat = [variedWallMat, variedWallMat, wallTopMat, variedWallMat, variedWallMat, variedWallMat];
            mesh = new THREE.Mesh(wallGeo, wallMultiMat);
            mesh.position.set(x, 1.0, y);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.isWall = true;

            // Fix 5: Brick lines on some walls
            if (wallVariation > 0.3) {
              var brickColor = multiplyColorScalar(variedWallColor, 0.5);
              var brickMat = new THREE.MeshBasicMaterial({ color: brickColor });
              var brickGeo = new THREE.PlaneGeometry(1, 0.04);
              var brick1 = new THREE.Mesh(brickGeo, brickMat);
              brick1.position.set(0, 0.33, 0.501);
              mesh.add(brick1);
              var brick2 = new THREE.Mesh(brickGeo, brickMat);
              brick2.position.set(0, -0.33, 0.501);
              mesh.add(brick2);
            }
            break;
          case 1: // FLOOR
            // Fix 5: Floor texture variation — per-tile shade
            var floorVariation = 0.9 + seededRandom(x, y, floorNum) * 0.2;
            var variedFloorColor = multiplyColorScalar(zone.floor, floorVariation);
            var variedFloorMat = new THREE.MeshLambertMaterial({ color: variedFloorColor });
            mesh = new THREE.Mesh(floorGeo, variedFloorMat);
            mesh.position.set(x, 0, y);
            mesh.receiveShadow = true;
            // Floor tile border for depth perception
            var borderGeo1 = new THREE.EdgesGeometry(floorGeo);
            var borderMat1 = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15 });
            var border1 = new THREE.LineSegments(borderGeo1, borderMat1);
            mesh.add(border1);
            // Fix 5: Random stone crack detail on some tiles
            if (seededRandom(x + 7, y + 13, floorNum) > 0.7) {
              var crackColor = multiplyColorScalar(variedFloorColor, 0.6);
              var crackMat = new THREE.MeshBasicMaterial({ color: crackColor });
              var crackGeo = new THREE.PlaneGeometry(0.3, 0.05);
              crackGeo.rotateX(-Math.PI / 2);
              var crack = new THREE.Mesh(crackGeo, crackMat);
              var crackOffX = (seededRandom(x + 3, y + 5, floorNum) - 0.5) * 0.5;
              var crackOffZ = (seededRandom(x + 11, y + 2, floorNum) - 0.5) * 0.5;
              crack.position.set(crackOffX, 0.005, crackOffZ);
              crack.rotation.y = seededRandom(x, y + 1, floorNum) * Math.PI;
              mesh.add(crack);
            }
            break;
          case 2: // CORRIDOR
            // Fix 5: Corridor variation
            var corrVariation = 0.9 + seededRandom(x, y, floorNum + 100) * 0.2;
            var variedCorrColor = multiplyColorScalar(zone.corridor, corrVariation);
            var variedCorrMat = new THREE.MeshLambertMaterial({ color: variedCorrColor });
            mesh = new THREE.Mesh(floorGeo, variedCorrMat);
            mesh.position.set(x, 0, y);
            mesh.receiveShadow = true;
            mesh.userData.isCorridor = true;
            // Floor tile border
            var borderGeo2 = new THREE.EdgesGeometry(floorGeo);
            var borderMat2 = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12 });
            var border2 = new THREE.LineSegments(borderGeo2, borderMat2);
            mesh.add(border2);
            break;
          case 3: // STAIRS_DOWN
            var stairFloorVar = 0.9 + seededRandom(x, y, floorNum) * 0.2;
            var stairFloorMat = new THREE.MeshLambertMaterial({ color: multiplyColorScalar(zone.floor, stairFloorVar) });
            mesh = new THREE.Mesh(floorGeo, stairFloorMat);
            mesh.position.set(x, 0, y);
            mesh.receiveShadow = true;
            // Add stairs model on top
            var stairsModel = Models3D.createStairs();
            stairsModel.position.set(x, 0, y);
            this.tileGroup.add(stairsModel);
            this.stairsMesh = stairsModel;
            break;
          case 4: // WATER
            mesh = new THREE.Mesh(floorGeo, waterMat.clone());
            mesh.position.set(x, -0.05, y);
            mesh.receiveShadow = true;
            mesh.userData.isWater = true;
            this._waterMeshes.push(mesh);
            break;
          case 6: // LAVA
            mesh = new THREE.Mesh(floorGeo, lavaMat.clone());
            mesh.position.set(x, -0.03, y);
            mesh.receiveShadow = true;
            mesh.userData.isLava = true;
            this._lavaMeshes.push(mesh);
            break;
        }

        // Fix 6: Walls beyond rooms — render unexplored out-of-map or WALL tiles as solid rock
        // If tile is null (no mesh created) but is within bounds, create a wall block (solid rock)
        if (!mesh && tile === undefined) {
          // Out-of-bounds tile, treat as solid rock
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

    // Reset scene background to dungeon dark
    this.scene.background = new THREE.Color(0x1a1a2e);
    // Reset frustum to dungeon default if it was enlarged for village
    if (this._targetFrustum >= this._villageFrustumSize) {
      this._targetFrustum = 14;
    }
    // Restore dungeon player light intensity
    this.playerLight.intensity = 1.5;

    // === Stairs glow light ===
    if (this._stairsLight) {
      this.scene.remove(this._stairsLight);
      this._stairsLight = null;
    }
    var stairsPos = this._getStairsPos(game);
    if (stairsPos) {
      this._stairsLight = new THREE.PointLight(0xffd700, 2.5, 8);
      this._stairsLight.position.set(stairsPos.x, 1.5, stairsPos.y);
      this.scene.add(this._stairsLight);
    }

    // === Zone-specific fog ===
    if (floorNum <= 10) {
      this.scene.fog = null;
    } else if (floorNum <= 25) {
      this.scene.fog = new THREE.Fog(0x1a2a3a, 10, 25);
    } else if (floorNum <= 50) {
      this.scene.fog = new THREE.FogExp2(0x1a0500, 0.04);
    } else if (floorNum <= 75) {
      this.scene.fog = new THREE.Fog(0x3a4a5a, 8, 20);
    } else {
      this.scene.fog = new THREE.FogExp2(0x0a0015, 0.06);
    }

    // === Zone-specific ambient lighting ===
    if (floorNum <= 10) {
      this.ambientLight.color.setHex(0x404040);
      this.ambientLight.intensity = 0.5;
    } else if (floorNum <= 25) {
      this.ambientLight.color.setHex(0x3344aa);
      this.ambientLight.intensity = 0.4;
    } else if (floorNum <= 50) {
      this.ambientLight.color.setHex(0xff4400);
      this.ambientLight.intensity = 0.3;
    } else if (floorNum <= 75) {
      this.ambientLight.color.setHex(0x6688bb);
      this.ambientLight.intensity = 0.35;
    } else {
      this.ambientLight.color.setHex(0x330066);
      this.ambientLight.intensity = 0.2;
    }

    // Reset animation state for new floor
    this._prevPositions = {};
    this._prevHP = {};
    this._animations = [];
    this._itemMeshes = {};
    this._waterMeshes = [];
    this._lavaMeshes = [];
    this._monsterHouseTriggered = false;

    // Clear old shop lights
    for (var si = 0; si < this._shopLights.length; si++) {
      this.scene.remove(this._shopLights[si]);
    }
    this._shopLights = [];

    // Clear particles
    if (typeof ParticleSystem3D !== 'undefined') {
      ParticleSystem3D.clear(this.scene);
    }

    // Reset shop visuals flag
    this._shopVisualsBuilt = false;
  };

  // === Build Village 3D tile map ===

  Renderer3D.prototype._buildVillageTileMap = function(game) {
    // Clear old tiles
    while (this.tileGroup.children.length > 0) {
      this.tileGroup.remove(this.tileGroup.children[0]);
    }
    this.tileMeshes = [];
    this.stairsMesh = null;
    this._waterMeshes = [];
    this._lavaMeshes = [];

    var map = game.villageMap;
    if (!map) return;
    var VT = Game.VILLAGE_TILE;
    var floorGeo = getFloorGeo();

    // Village-specific geometries
    var wallGeo = new THREE.BoxGeometry(1, 1.2, 1);
    var bridgeGeo = new THREE.BoxGeometry(1, 0.1, 1);

    // Materials
    var pathMat = getCachedMaterial(0xa08060);
    var bridgeMat = getCachedMaterial(0x8b6914);
    var wallMat = getCachedMaterial(0x6d4c30);
    var floorMat = getCachedMaterial(0x8b7355);
    var waterMat = new THREE.MeshLambertMaterial({ color: 0x1a6aaa, transparent: true, opacity: 0.7 });
    var entranceMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e, emissive: 0x0a0a15 });

    for (var y = 0; y < map.height; y++) {
      this.tileMeshes[y] = [];
      for (var x = 0; x < map.width; x++) {
        var tile = map.grid[y][x];
        var mesh = null;

        switch (tile) {
          case VT.GRASS: {
            // Green plane with slight color variation
            var seed = (x * 73 + y * 137) & 0xff;
            var greenVar = 0x2d8a27 + ((seed & 0x0f) << 8);
            var grassMat = getCachedMaterial(greenVar);
            mesh = new THREE.Mesh(floorGeo, grassMat);
            mesh.position.set(x, 0, y);
            mesh.receiveShadow = true;
            break;
          }
          case VT.PATH:
            mesh = new THREE.Mesh(floorGeo, pathMat);
            mesh.position.set(x, 0.01, y);
            mesh.receiveShadow = true;
            break;
          case VT.WATER:
            mesh = new THREE.Mesh(floorGeo, waterMat.clone());
            mesh.position.set(x, -0.05, y);
            mesh.receiveShadow = true;
            mesh.userData.isWater = true;
            mesh.userData.tileX = x;
            mesh.userData.tileY = y;
            this._waterMeshes.push(mesh);
            break;
          case VT.BRIDGE:
            // Water underneath
            var underWater = new THREE.Mesh(floorGeo, waterMat.clone());
            underWater.position.set(x, -0.05, y);
            underWater.userData.isWater = true;
            underWater.userData.tileX = x;
            underWater.userData.tileY = y;
            this._waterMeshes.push(underWater);
            this.tileGroup.add(underWater);
            // Bridge planks on top
            mesh = new THREE.Mesh(bridgeGeo, bridgeMat);
            mesh.position.set(x, 0.05, y);
            mesh.receiveShadow = true;
            mesh.castShadow = true;
            break;
          case VT.WALL:
            mesh = new THREE.Mesh(wallGeo, wallMat);
            mesh.position.set(x, 0.6, y);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            break;
          case VT.FLOOR:
            mesh = new THREE.Mesh(floorGeo, floorMat);
            mesh.position.set(x, 0.01, y);
            mesh.receiveShadow = true;
            break;
          case VT.TREE: {
            // Grass base
            var treeGrass = getCachedMaterial(0x2d7a27);
            var base = new THREE.Mesh(floorGeo, treeGrass);
            base.position.set(x, 0, y);
            base.receiveShadow = true;
            this.tileGroup.add(base);
            // 3D tree model
            var treeSeed = x * 31 + y * 97;
            var treeModel = Models3D.createVillageTree(treeSeed);
            treeModel.position.set(x, 0, y);
            this.tileGroup.add(treeModel);
            // No mesh reference needed (base is the floor)
            mesh = null;
            break;
          }
          case VT.FLOWER: {
            // Grass base
            var flowerGrass = getCachedMaterial(0x2d8a27);
            var fBase = new THREE.Mesh(floorGeo, flowerGrass);
            fBase.position.set(x, 0, y);
            fBase.receiveShadow = true;
            this.tileGroup.add(fBase);
            // Flower model
            var flowerSeed = x * 53 + y * 79;
            var flowerModel = Models3D.createVillageFlower(flowerSeed);
            flowerModel.position.set(x, 0, y);
            this.tileGroup.add(flowerModel);
            mesh = null;
            break;
          }
          case VT.ENTRANCE: {
            // Dark entrance
            var entranceBox = new THREE.Mesh(
              new THREE.BoxGeometry(1, 0.8, 1),
              entranceMat
            );
            entranceBox.position.set(x, 0.4, y);
            this.tileGroup.add(entranceBox);
            // Golden glow
            var entranceLight = new THREE.PointLight(0xffd700, 1.2, 4);
            entranceLight.position.set(x, 1.0, y);
            this.tileGroup.add(entranceLight);
            // Floor base
            mesh = new THREE.Mesh(floorGeo, getCachedMaterial(0x1a1a2e));
            mesh.position.set(x, 0, y);
            break;
          }
        }

        if (mesh) {
          mesh.userData.tileX = x;
          mesh.userData.tileY = y;
          mesh.userData.tileType = tile;
          mesh.visible = true; // Village is always fully visible
          this.tileGroup.add(mesh);
        }
        this.tileMeshes[y][x] = mesh;
      }
    }

    this._builtFloor = -1; // special marker for village
    this._builtScene = 'village';

    // Village atmosphere
    this.scene.background = new THREE.Color(0x87ceeb); // sky blue
    this.scene.fog = null;
    this.ambientLight.color.setHex(0xfff8e1);
    this.ambientLight.intensity = 0.8;
    this.directionalLight.intensity = 0.7;
    this.playerLight.intensity = 0.5; // dim torch in village

    // Remove stairs light if present
    if (this._stairsLight) {
      this.scene.remove(this._stairsLight);
      this._stairsLight = null;
    }

    // Clear old village NPC meshes
    for (var nk in this._villageNpcMeshes) {
      this.entityGroup.remove(this._villageNpcMeshes[nk]);
    }
    this._villageNpcMeshes = {};

    // Reset animation state
    this._prevPositions = {};
    this._prevHP = {};
    this._animations = [];
    this._itemMeshes = {};
    this._monsterHouseTriggered = false;
    this._shopVisualsBuilt = false;

    // Clear shop lights
    for (var si = 0; si < this._shopLights.length; si++) {
      this.scene.remove(this._shopLights[si]);
    }
    this._shopLights = [];

    if (typeof ParticleSystem3D !== 'undefined') {
      ParticleSystem3D.clear(this.scene);
    }
  };

  // === Update village entities (player + NPCs) ===

  Renderer3D.prototype._updateVillageEntities = function(game) {
    var player = game.player;
    var npcs = game.villageNpcs || [];
    var now = performance.now();

    // --- Player ---
    var playerKey = 'player';
    if (!this.entityMeshes[playerKey]) {
      var playerModel = Models3D.createPlayer();
      this.entityGroup.add(playerModel);
      this.entityMeshes[playerKey] = { mesh: playerModel, x: player.x, y: player.y };
      this._prevPositions[playerKey] = { x: player.x, y: player.y };
    }
    var pe = this.entityMeshes[playerKey];

    // Movement animation
    var prevPos = this._prevPositions[playerKey];
    if (prevPos && (prevPos.x !== player.x || prevPos.y !== player.y)) {
      var isAnimating = false;
      for (var ai = 0; ai < this._animations.length; ai++) {
        if (this._animations[ai].mesh === pe.mesh) { isAnimating = true; break; }
      }
      if (!isAnimating) {
        this._addAnimation(pe.mesh, prevPos.x, prevPos.y, player.x, player.y, 200, true, 0, null);
      }
      // Face movement direction
      var vpdx = player.x - prevPos.x;
      var vpdz = player.y - prevPos.y;
      if (vpdx > 0) pe.mesh.rotation.y = -Math.PI / 2;
      else if (vpdx < 0) pe.mesh.rotation.y = Math.PI / 2;
      else if (vpdz > 0) pe.mesh.rotation.y = Math.PI;
      else if (vpdz < 0) pe.mesh.rotation.y = 0;
      pe.x = player.x;
      pe.y = player.y;
    }
    this._prevPositions[playerKey] = { x: player.x, y: player.y };

    var isPlayerAnimating = false;
    for (var ai2 = 0; ai2 < this._animations.length; ai2++) {
      if (this._animations[ai2].mesh === pe.mesh) { isPlayerAnimating = true; break; }
    }
    if (!isPlayerAnimating) {
      pe.mesh.position.x = player.x;
      pe.mesh.position.z = player.y;
      pe.mesh.position.y = Math.sin(now * 0.003) * 0.05;
    }
    pe.mesh.visible = true;

    // --- Village NPCs ---
    for (var i = 0; i < npcs.length; i++) {
      var npc = npcs[i];
      var nKey = 'vnpc_' + npc.name;
      if (!this._villageNpcMeshes[nKey]) {
        var npcModel = Models3D.createVillageNPC(npc.name);
        npcModel.position.set(npc.x, 0, npc.y);
        this.entityGroup.add(npcModel);
        this._villageNpcMeshes[nKey] = npcModel;
      }
      var nm = this._villageNpcMeshes[nKey];
      nm.position.set(npc.x, 0, npc.y);
      // Idle bob
      if (npc.name !== '猫') {
        nm.position.y = Math.sin(now * 0.002 + i * 1.5) * 0.03;
      } else {
        // Cat has a slight tail wag (rotation)
        nm.rotation.y = Math.sin(now * 0.004) * 0.15;
      }
      nm.visible = true;
    }
  };

  // === Post-processing overlay init ===

  Renderer3D.prototype._initPostProcessing = function() {
    if (this._postProcessInited) return;
    this._postProcessInited = true;

    var canvasArea = document.getElementById('canvas-area');
    if (!canvasArea) return;

    // Vignette overlay
    var vig = document.createElement('div');
    vig.id = 'vignette-overlay';
    vig.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;' +
      'pointer-events:none;z-index:10;' +
      'background:radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%);' +
      'opacity:0.3;';
    canvasArea.appendChild(vig);
    this._vignetteOverlay = vig;

    // Damage overlay
    var dmg = document.createElement('div');
    dmg.id = 'damage-overlay';
    dmg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;' +
      'pointer-events:none;z-index:11;opacity:0;' +
      'background:radial-gradient(ellipse at center, transparent 40%, rgba(255,0,0,0.5) 100%);';
    canvasArea.appendChild(dmg);
    this._damageOverlay = dmg;
  };

  // === Post-processing update ===

  Renderer3D.prototype._updatePostProcessing = function(game) {
    if (!this._vignetteOverlay || !this._damageOverlay) return;
    var player = game.player;
    var now = performance.now();

    // Detect damage
    if (this._lastTrackedHP !== null && player.hp < this._lastTrackedHP) {
      this._damageFlashStart = now;
    }
    this._lastTrackedHP = player.hp;

    // Damage flash animation (300ms)
    if (this._damageFlashStart) {
      var elapsed = now - this._damageFlashStart;
      if (elapsed < 300) {
        // 0→0.4→0 over 300ms
        var t = elapsed / 300;
        var opacity = t < 0.3 ? (t / 0.3) * 0.4 : 0.4 * (1 - (t - 0.3) / 0.7);
        this._damageOverlay.style.opacity = String(Math.max(0, opacity));
      } else {
        this._damageOverlay.style.opacity = '0';
        this._damageFlashStart = null;
      }
    }

    // Low HP warning (< 25%)
    var maxHP = player.maxHP || player.hp;
    if (player.hp < maxHP * 0.25 && player.hp > 0) {
      // Pulsing red vignette
      var pulse = (Math.sin(now * 0.006) + 1) / 2; // 0..1, ~1s period
      var vigOpacity = 0.2 + pulse * 0.2;
      this._vignetteOverlay.style.background =
        'radial-gradient(ellipse at center, transparent 50%, rgba(180,0,0,' + (0.3 + pulse * 0.15) + ') 100%)';
      this._vignetteOverlay.style.opacity = String(vigOpacity);
    } else {
      // Normal vignette
      this._vignetteOverlay.style.background =
        'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)';
      this._vignetteOverlay.style.opacity = '0.3';
    }
  };

  // === Update tile visibility (FOV) ===

  Renderer3D.prototype._updateTileVisibility = function(game) {
    var visible = game.visible;
    var explored = game.explored;
    var mapRevealed = game.mapRevealed;
    var px = game.player.x;
    var py = game.player.y;
    var updateRadius = 18;
    var h = this.tileMeshes.length;

    // Fix 4: Initialize prev visibility cache if needed
    if (!this._prevVisible) {
      this._prevVisible = [];
      this._prevExplored = [];
      for (var iy = 0; iy < h; iy++) {
        this._prevVisible[iy] = [];
        this._prevExplored[iy] = [];
      }
    }

    for (var y = 0; y < h; y++) {
      var row = this.tileMeshes[y];
      if (!row) continue;
      var w = row.length;
      for (var x = 0; x < w; x++) {
        var mesh = row[x];
        if (!mesh) continue;

        // Skip tiles far from player (unless map revealed)
        if (!mapRevealed && Math.abs(x - px) > updateRadius && Math.abs(y - py) > updateRadius) {
          continue;
        }

        var isVis = !!(visible[y] && visible[y][x]);
        var isExp = !!(explored[y] && explored[y][x]);

        // Fix 4: Only update material when visibility state actually changed
        var prevVis = this._prevVisible[y][x];
        var prevExp = this._prevExplored[y] ? this._prevExplored[y][x] : false;
        var changed = (isVis !== prevVis) || (isExp !== prevExp) || mapRevealed;

        if (!changed) continue;

        this._prevVisible[y][x] = isVis;
        if (!this._prevExplored[y]) this._prevExplored[y] = [];
        this._prevExplored[y][x] = isExp;

        if (mapRevealed || isVis) {
          mesh.visible = true;
          // Full brightness
          if (mesh.material !== mesh.userData.baseMaterial) {
            mesh.material = mesh.userData.baseMaterial;
          }
        } else if (isExp) {
          // Fix 1: Explored but not visible — dim at 30% brightness (geometry visible, entities hidden)
          mesh.visible = true;
          if (!mesh.userData.dimMaterial) {
            var baseMat = mesh.userData.baseMaterial;
            if (Array.isArray(baseMat)) {
              mesh.userData.dimMaterial = baseMat.map(function(m) {
                var dm = m.clone();
                var dc = new THREE.Color(m.color.getHex());
                dc.multiplyScalar(0.3);
                dm.color = dc;
                return dm;
              });
            } else {
              var dimMat = baseMat.clone();
              var c = new THREE.Color(baseMat.color.getHex());
              c.multiplyScalar(0.3);
              dimMat.color = c;
              mesh.userData.dimMaterial = dimMat;
            }
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

  // === Animation system (Phase 2) ===

  Renderer3D.prototype._addAnimation = function(mesh, startX, startZ, endX, endZ, duration, bounce, baseY, onComplete) {
    this._animations.push({
      mesh: mesh,
      startPos: { x: startX, z: startZ },
      endPos: { x: endX, z: endZ },
      startTime: performance.now(),
      duration: duration,
      bounce: bounce || false,
      baseY: baseY || 0,
      onComplete: onComplete || null
    });
  };

  Renderer3D.prototype._updateAnimations = function() {
    var now = performance.now();
    for (var i = this._animations.length - 1; i >= 0; i--) {
      var a = this._animations[i];
      var t = Math.min((now - a.startTime) / a.duration, 1);
      var et = easeInOut(t);

      a.mesh.position.x = a.startPos.x + (a.endPos.x - a.startPos.x) * et;
      a.mesh.position.z = a.startPos.z + (a.endPos.z - a.startPos.z) * et;

      // Bounce effect during movement
      if (a.bounce) {
        a.mesh.position.y = a.baseY;
      }

      if (t >= 1) {
        a.mesh.position.x = a.endPos.x;
        a.mesh.position.z = a.endPos.z;
        if (a.bounce) a.mesh.position.y = a.baseY;
        if (a.onComplete) a.onComplete();
        this._animations.splice(i, 1);
      }
    }
  };

  // === Damage popup system (Phase 2) ===

  Renderer3D.prototype._showDamagePopup = function(worldX, worldZ, text, color) {
    if (!this.css2dRenderer) return; // CSS2DRenderer not available

    var div = document.createElement('div');
    div.textContent = text;
    div.style.color = color || '#ff4444';
    div.style.fontSize = '20px';
    div.style.fontWeight = 'bold';
    div.style.textShadow = '1px 1px 2px black, -1px -1px 2px black';
    div.style.pointerEvents = 'none';
    div.style.whiteSpace = 'nowrap';

    var label = new THREE.CSS2DObject(div);
    label.position.set(worldX, 2, worldZ);
    this.scene.add(label);

    this._popups.push({
      label: label,
      div: div,
      startTime: performance.now(),
      startY: 2
    });
  };

  Renderer3D.prototype._updatePopups = function() {
    var now = performance.now();
    for (var i = this._popups.length - 1; i >= 0; i--) {
      var p = this._popups[i];
      var t = (now - p.startTime) / 1000; // seconds
      p.label.position.y = p.startY + t * 2; // float up
      p.div.style.opacity = String(Math.max(0, 1 - t));
      if (t > 1) {
        this.scene.remove(p.label);
        this._popups.splice(i, 1);
      }
    }
  };

  // === Attack animation (Phase 2) ===

  Renderer3D.prototype._triggerAttackAnimation = function(attackerMesh, targetMesh, attackerPos, targetPos) {
    if (!attackerMesh || !targetMesh) return;

    var dx = targetPos.x - attackerPos.x;
    var dz = targetPos.z - attackerPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist === 0) return;

    var lungeX = attackerPos.x + (dx / dist) * 0.3;
    var lungeZ = attackerPos.z + (dz / dist) * 0.3;

    var self = this;

    // Lunge forward
    this._addAnimation(attackerMesh, attackerPos.x, attackerPos.z, lungeX, lungeZ, 100, false, 0, function() {
      // At peak: flash target white
      self._flashMeshWhite(targetMesh, 80);
      // Return to original position
      self._addAnimation(attackerMesh, lungeX, lungeZ, attackerPos.x, attackerPos.z, 100, false, 0, null);
    });
  };

  Renderer3D.prototype._flashMeshWhite = function(mesh, durationMs) {
    // Store original emissive values, set to white, then restore
    var originals = [];
    mesh.traverse(function(child) {
      if (child.isMesh && child.material) {
        var origEmissive = child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0);
        originals.push({ mesh: child, emissive: origEmissive });
        if (child.material.emissive) {
          child.material = child.material.clone();
          child.material.emissive.set(0xffffff);
          child.material.emissiveIntensity = 1.0;
        }
      }
    });

    setTimeout(function() {
      for (var i = 0; i < originals.length; i++) {
        var o = originals[i];
        if (o.mesh.material && o.mesh.material.emissive) {
          o.mesh.material.emissive.copy(o.emissive);
          o.mesh.material.emissiveIntensity = o.emissive.r > 0 || o.emissive.g > 0 || o.emissive.b > 0 ? 0.3 : 0;
        }
      }
    }, durationMs);
  };

  Renderer3D.prototype._triggerDeathAnimation = function(mesh, onComplete) {
    var startTime = performance.now();
    var duration = 300;
    var originalScale = mesh.scale.clone();

    function animate() {
      var t = Math.min((performance.now() - startTime) / duration, 1);
      var s = 1 - t;
      mesh.scale.set(originalScale.x * s, originalScale.y * s, originalScale.z * s);
      mesh.position.y = mesh.position.y; // keep position
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
      }
    }
    animate();
  };

  // === Entity management ===

  Renderer3D.prototype._updateEntities = function(game) {
    var player = game.player;
    var enemies = game.enemies;
    var items = game.items;
    var visible = game.visible;
    var mapRevealed = game.mapRevealed;
    var seeAll = (player.bracelet && player.bracelet.effect === 'see_all') || (game.sightBoost > 0);
    var now = performance.now();

    // Track which entities are still present
    var activeKeys = {};

    // --- Player ---
    var playerKey = 'player';
    activeKeys[playerKey] = true;
    if (!this.entityMeshes[playerKey]) {
      var playerModel = Models3D.createPlayer();
      this.entityGroup.add(playerModel);
      this.entityMeshes[playerKey] = { mesh: playerModel, x: player.x, y: player.y };
      this._prevPositions[playerKey] = { x: player.x, y: player.y };
      this._prevHP[playerKey] = player.hp;
    }
    var pe = this.entityMeshes[playerKey];

    // Detect movement and create animation
    var prevPos = this._prevPositions[playerKey];
    if (prevPos && (prevPos.x !== player.x || prevPos.y !== player.y)) {
      // Only animate if not currently being animated
      var isAnimating = false;
      for (var ai = 0; ai < this._animations.length; ai++) {
        if (this._animations[ai].mesh === pe.mesh) { isAnimating = true; break; }
      }
      if (!isAnimating) {
        this._addAnimation(pe.mesh, prevPos.x, prevPos.y, player.x, player.y, 200, true, 0, null);
      }
      // Face movement direction
      var pdx = player.x - prevPos.x;
      var pdz = player.y - prevPos.y;
      if (pdx > 0) pe.mesh.rotation.y = -Math.PI / 2;
      else if (pdx < 0) pe.mesh.rotation.y = Math.PI / 2;
      else if (pdz > 0) pe.mesh.rotation.y = Math.PI;
      else if (pdz < 0) pe.mesh.rotation.y = 0;
      pe.x = player.x;
      pe.y = player.y;
    }
    this._prevPositions[playerKey] = { x: player.x, y: player.y };

    // Detect player HP change (took damage)
    var prevPlayerHP = this._prevHP[playerKey];
    if (prevPlayerHP !== undefined && player.hp < prevPlayerHP) {
      var dmg = prevPlayerHP - player.hp;
      this._showDamagePopup(player.x, player.y, '-' + dmg, '#ef5350');
    } else if (prevPlayerHP !== undefined && player.hp > prevPlayerHP) {
      var heal = player.hp - prevPlayerHP;
      this._showDamagePopup(player.x, player.y, '+' + heal, '#66bb6a');
    }
    this._prevHP[playerKey] = player.hp;

    // Set position from animation or directly
    var isPlayerAnimating = false;
    for (var ai = 0; ai < this._animations.length; ai++) {
      if (this._animations[ai].mesh === pe.mesh) { isPlayerAnimating = true; break; }
    }
    if (!isPlayerAnimating) {
      pe.mesh.position.x = player.x;
      pe.mesh.position.z = player.y;
      // Idle bob
      pe.mesh.position.y = Math.sin(now * 0.003) * 0.05;
    }
    pe.mesh.visible = true;

    // Doskoi visual: 1.3x scale + yellow tint
    if (player.doskoi) {
      pe.mesh.scale.setScalar(1.3);
      if (!pe.mesh.userData._doskoiTinted) {
        pe.mesh.userData._doskoiTinted = true;
        pe.mesh.traverse(function(child) {
          if (child.isMesh && child.material) {
            if (!child.userData._origColor) {
              child.userData._origColor = child.material.color ? child.material.color.clone() : null;
            }
            child.material = child.material.clone();
            child.material.emissive = new THREE.Color(0x665500);
            child.material.emissiveIntensity = 0.4;
          }
        });
      }
    } else {
      pe.mesh.scale.setScalar(1.0);
      if (pe.mesh.userData._doskoiTinted) {
        pe.mesh.userData._doskoiTinted = false;
        pe.mesh.traverse(function(child) {
          if (child.isMesh && child.material && child.userData._origColor) {
            child.material.emissive = new THREE.Color(0x000000);
            child.material.emissiveIntensity = 0;
          }
        });
      }
    }

    // Cape wave animation (Issue 4)
    if (pe.mesh.userData._cape) {
      var capeWave = Math.sin(now * 0.005) * 0.12;
      pe.mesh.userData._cape.rotation.x = 0.1 + capeWave;
    }

    // Player shadow casting (Issue 10)
    pe.mesh.traverse(function(child) {
      if (child.isMesh) child.castShadow = true;
    });

    // --- Enemies ---
    // Fix 1: Only show enemies on tiles that are currently visible (not just explored)
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
        // Random idle phase for each enemy
        enemyModel.userData._idlePhase = Math.random() * Math.PI * 2;
        // Rank visual effects
        if (rank >= 2) enemyModel.scale.multiplyScalar(1.1);
        if (rank >= 3) {
          enemyModel.scale.multiplyScalar(1.1); // total 1.21x
          enemyModel.traverse(function(child) {
            if (child.isMesh && child.material) {
              child.material = child.material.clone();
              child.material.emissive = new THREE.Color(child.material.color);
              child.material.emissiveIntensity = 0.15;
            }
          });
        }
        // Enable shadow casting on enemies (Issue 10)
        enemyModel.traverse(function(child) {
          if (child.isMesh) child.castShadow = true;
        });
        this.entityGroup.add(enemyModel);
        this.entityMeshes[eKey] = { mesh: enemyModel, x: enemy.x, y: enemy.y };
        this._prevPositions[eKey] = { x: enemy.x, y: enemy.y };
        this._prevHP[eKey] = enemy.hp;
      }

      var ee = this.entityMeshes[eKey];

      // Detect enemy movement and animate
      var ePrev = this._prevPositions[eKey];
      if (ePrev && (ePrev.x !== enemy.x || ePrev.y !== enemy.y)) {
        var isEAnimating = false;
        for (var ai2 = 0; ai2 < this._animations.length; ai2++) {
          if (this._animations[ai2].mesh === ee.mesh) { isEAnimating = true; break; }
        }
        if (!isEAnimating) {
          // Enemies slide (no bounce)
          this._addAnimation(ee.mesh, ePrev.x, ePrev.y, enemy.x, enemy.y, 200, false, 0, null);
        }
        // Face movement direction
        var edx = enemy.x - ePrev.x;
        var edz = enemy.y - ePrev.y;
        if (edx > 0) ee.mesh.rotation.y = -Math.PI / 2;
        else if (edx < 0) ee.mesh.rotation.y = Math.PI / 2;
        else if (edz > 0) ee.mesh.rotation.y = Math.PI;
        else if (edz < 0) ee.mesh.rotation.y = 0;
        ee.x = enemy.x;
        ee.y = enemy.y;
      }
      this._prevPositions[eKey] = { x: enemy.x, y: enemy.y };

      // Detect enemy HP change (took damage) -> attack animation + popup
      var ePrevHP = this._prevHP[eKey];
      if (ePrevHP !== undefined && enemy.hp < ePrevHP) {
        var eDmg = ePrevHP - enemy.hp;
        this._showDamagePopup(enemy.x, enemy.y, '-' + eDmg, '#ef5350');
        // Trigger attack animation (player attacking enemy)
        if (pe.mesh) {
          this._triggerAttackAnimation(pe.mesh, ee.mesh,
            { x: player.x, z: player.y },
            { x: enemy.x, z: enemy.y }
          );
        }
      }
      this._prevHP[eKey] = enemy.hp;

      // Set position from animation or directly
      var isEeAnimating = false;
      for (var ai3 = 0; ai3 < this._animations.length; ai3++) {
        if (this._animations[ai3].mesh === ee.mesh) { isEeAnimating = true; break; }
      }
      if (!isEeAnimating) {
        ee.mesh.position.x = enemy.x;
        ee.mesh.position.z = enemy.y;
        // Idle bob (different phase per enemy)
        var idlePhase = ee.mesh.userData._idlePhase || 0;
        ee.mesh.position.y = Math.sin(now * 0.002 + idlePhase) * 0.04;
        // Reaper floating animation (higher bob)
        if (ee.mesh.userData._isReaper) {
          ee.mesh.position.y = 0.1 + Math.sin(now * 0.003 + idlePhase) * 0.08;
        }
        // Dragon wing flap animation
        if (ee.mesh.userData._isDragon) {
          ee.mesh.traverse(function(child) {
            if (child.userData._isWing) {
              var flapAngle = Math.sin(now * 0.004 + idlePhase) * 0.25;
              child.rotation.x = flapAngle * child.userData._wingSide;
            }
          });
        }
        // Slime jiggle animation
        if (ee.mesh.userData._isSlime) {
          var jiggleX = 1.0 + Math.sin(now * 0.005 + idlePhase) * 0.06;
          var jiggleY = 1.0 + Math.sin(now * 0.005 + idlePhase + 1.5) * 0.06;
          ee.mesh.children[0].scale.set(1.15 * jiggleX, 0.7 * jiggleY, 1.15 * jiggleX);
        }
        // Polygon slow multi-axis rotation
        if (ee.mesh.userData._isPolygon) {
          ee.mesh.children[0].rotation.x = now * 0.0005 + idlePhase;
          ee.mesh.children[0].rotation.y = now * 0.0007 + idlePhase;
          if (ee.mesh.children[1]) {
            ee.mesh.children[1].rotation.x = now * 0.0005 + idlePhase;
            ee.mesh.children[1].rotation.y = now * 0.0007 + idlePhase;
          }
        }
        // Mazerun steam animation
        if (ee.mesh.userData._isMazerun) {
          ee.mesh.traverse(function(child) {
            if (child.userData._steamIndex !== undefined) {
              var si = child.userData._steamIndex;
              child.position.y = 0.65 + si * 0.08 + Math.sin(now * 0.003 + si * 2) * 0.04;
              child.material.opacity = 0.3 + Math.sin(now * 0.004 + si) * 0.15;
            }
          });
        }
      }

      // Sleeping overlay: scale down slightly (preserve rank scale)
      var baseScale = 1.0;
      var rank = enemy.familyRank || 1;
      if (rank >= 2) baseScale *= 1.1;
      if (rank >= 3) baseScale *= 1.1;
      if (enemy.sleeping) {
        ee.mesh.scale.setScalar(baseScale * 0.8);
      } else {
        ee.mesh.scale.setScalar(baseScale);
      }

      ee.mesh.visible = true;
    }

    // --- Items (as 3D objects with rotation) ---
    // Fix 1: Only show items on tiles that are currently visible (not just explored)
    this._itemMeshes = {};
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
      ie.mesh.rotation.y += 0.02;
      ie.mesh.visible = true;
      this._itemMeshes[iKey] = ie.mesh;
    }

    // --- Traps ---
    // Fix 1: Only show traps on currently visible tiles
    var traps = game.traps || [];
    var seeTraps = player.bracelet && player.bracelet.effect === 'see_traps';
    for (var k = 0; k < traps.length; k++) {
      var trap = traps[k];
      if (trap.consumed) continue;
      if (!trap.visible && !seeTraps) continue;
      var isTrapVis = visible[trap.y] && visible[trap.y][trap.x];
      if (!isTrapVis && !mapRevealed) continue;

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

    // Clean up removed entities (with death animation for enemies)
    var keysToRemove = [];
    for (var key in this.entityMeshes) {
      if (!activeKeys[key]) {
        keysToRemove.push(key);
      }
    }
    for (var ri = 0; ri < keysToRemove.length; ri++) {
      var rk = keysToRemove[ri];
      var removedEntry = this.entityMeshes[rk];
      // If it's an enemy, play death animation
      if (rk.indexOf('enemy_') === 0 && removedEntry.mesh) {
        (function(mesh, group) {
          Renderer3D.prototype._triggerDeathAnimation(mesh, function() {
            group.remove(mesh);
          });
        })(removedEntry.mesh, this.entityGroup);
      } else {
        this.entityGroup.remove(removedEntry.mesh);
      }
      delete this.entityMeshes[rk];
      delete this._prevPositions[rk];
      delete this._prevHP[rk];
    }
  };

  // === Camera follow with rotation and zoom ===

  Renderer3D.prototype._updateCamera = function(playerX, playerY) {
    var tx = playerX * this.tileSize;
    var tz = playerY * this.tileSize;

    var now = performance.now();
    var dt = this._lastCamTime ? Math.min((now - this._lastCamTime) / 1000, 0.1) : 0.016;
    this._lastCamTime = now;

    if (this.cameraX < 0) {
      this._smoothCamX = tx;
      this._smoothCamZ = tz;
      this.cameraX = 0;
    }

    // Exponential decay smoothing for buttery smooth camera (Issue 7)
    var smoothFactor = 1 - Math.pow(0.001, dt);
    this._smoothCamX += (tx - this._smoothCamX) * smoothFactor;
    this._smoothCamZ += (tz - this._smoothCamZ) * smoothFactor;

    var cx = this._smoothCamX;
    var cz = this._smoothCamZ;

    // Smooth camera angle rotation
    var angleDiff = this._targetAngle - this._cameraAngle;
    this._cameraAngle += angleDiff * 0.1;

    // Smooth zoom
    var zoomDiff = this._targetFrustum - this._frustumSize;
    if (Math.abs(zoomDiff) > 0.01) {
      this._frustumSize += zoomDiff * 0.1;
      this._updateRendererSize();
    }

    // Camera positioned directly behind player along one axis, looking STRAIGHT (Issue 1)
    // Q/E rotates which axis is "behind" in 90° increments
    var height = this._cameraHeight;  // 18
    var offset = 10;
    var camOffX = Math.sin(this._cameraAngle) * offset;
    var camOffZ = Math.cos(this._cameraAngle) * offset;
    this.camera.position.set(cx + camOffX, height, cz + camOffZ);

    // Camera shake offset
    if (this._shakeStart) {
      var shakeElapsed = now - this._shakeStart;
      if (shakeElapsed < this._shakeDuration) {
        var shakeT = 1 - shakeElapsed / this._shakeDuration;
        this.camera.position.x += (Math.random() - 0.5) * this._shakeIntensity * shakeT;
        this.camera.position.y += (Math.random() - 0.5) * this._shakeIntensity * shakeT;
      } else {
        this._shakeStart = null;
      }
    }

    // Look straight at the player position — walls align perfectly with screen edges
    this.camera.lookAt(cx, 0, cz);

    // Player torch — with flicker
    var time = now * 0.001;
    this.playerLight.intensity = 1.5 + Math.sin(time * 10) * 0.1 + Math.sin(time * 7.3) * 0.05;
    this.playerLight.position.set(cx, 3, cz);

    // Room-based light distance: corridors feel more claustrophobic (Issue 9)
    if (this._currentGame) {
      var playerRoom = this._currentGame.getRoomAt ? this._currentGame.getRoomAt(this._currentGame.player.x, this._currentGame.player.y) : null;
      var targetLightDist = playerRoom ? 15 : 4;
      if (!this._currentLightDist) this._currentLightDist = targetLightDist;
      this._currentLightDist += (targetLightDist - this._currentLightDist) * 0.05;
      this.playerLight.distance = this._currentLightDist;
    }

    // Move directional light behind camera for proper shadow casting (Issue 10)
    this.directionalLight.position.set(cx + camOffX * 0.5, 20, cz + camOffZ * 0.5);
    this.directionalLight.target.position.set(cx, 0, cz);
    this.directionalLight.target.updateMatrixWorld();

    // Wall transparency: walls between camera and player become semi-transparent (Issue 2)
    this._updateWallTransparency(cx, cz, camOffX, camOffZ);
  };

  // === Wall transparency for walls between camera and player (Issue 2) ===

  Renderer3D.prototype._updateWallTransparency = function(playerWorldX, playerWorldZ, camOffX, camOffZ) {
    // Determine the axis the camera is looking along
    // Walls that are between the player and camera should be semi-transparent
    for (var y = 0; y < this.tileMeshes.length; y++) {
      for (var x = 0; x < (this.tileMeshes[y] ? this.tileMeshes[y].length : 0); x++) {
        var mesh = this.tileMeshes[y][x];
        if (!mesh || !mesh.userData.isWall || !mesh.visible) continue;

        var wallX = mesh.position.x;
        var wallZ = mesh.position.z;

        // Check if wall is between player and camera
        // Project wall-to-player vector onto camera offset direction
        var toWallX = wallX - playerWorldX;
        var toWallZ = wallZ - playerWorldZ;
        var dot = toWallX * camOffX + toWallZ * camOffZ;
        var dist = Math.sqrt(toWallX * toWallX + toWallZ * toWallZ);

        // If dot > 0, wall is on camera side of player. Also check proximity.
        var shouldBeTransparent = dot > -0.5 && dist < 8;

        if (shouldBeTransparent) {
          if (Array.isArray(mesh.material)) {
            for (var mi = 0; mi < mesh.material.length; mi++) {
              if (!mesh.material[mi]._origOpacity) {
                mesh.material[mi] = mesh.material[mi].clone();
                mesh.material[mi]._origOpacity = 1.0;
              }
              mesh.material[mi].transparent = true;
              mesh.material[mi].opacity = 0.3;
            }
          } else {
            if (!mesh.material._origOpacity) {
              mesh.material = mesh.material.clone();
              mesh.material._origOpacity = 1.0;
            }
            mesh.material.transparent = true;
            mesh.material.opacity = 0.3;
          }
        } else {
          if (Array.isArray(mesh.material)) {
            for (var mi2 = 0; mi2 < mesh.material.length; mi2++) {
              if (mesh.material[mi2]._origOpacity) {
                mesh.material[mi2].transparent = false;
                mesh.material[mi2].opacity = 1.0;
              }
            }
          } else {
            if (mesh.material._origOpacity) {
              mesh.material.transparent = false;
              mesh.material.opacity = 1.0;
            }
          }
        }
      }
    }
  };

  // === Enemy ground indicators and health bars (Issue 5) ===

  Renderer3D.prototype._updateEnemyIndicators = function(game) {
    var now = performance.now();
    var enemies = game.enemies;
    var visible = game.visible;
    var mapRevealed = game.mapRevealed;

    for (var i = 0; i < enemies.length; i++) {
      var enemy = enemies[i];
      if (enemy.dead) continue;
      var isVis = visible[enemy.y] && visible[enemy.y][enemy.x];
      if (!isVis && !mapRevealed) continue;

      var eKey = 'enemy_' + i + '_' + enemy.enemyId;
      var ee = this.entityMeshes[eKey];
      if (!ee) continue;

      // Ground selection ring
      if (!ee.mesh.userData._groundRing) {
        var ringColor = enemy.color ? (typeof enemy.color === 'string' && enemy.color[0] === '#' ? parseInt(enemy.color.slice(1), 16) : 0xff4444) : 0xff4444;
        var ringGeo = new THREE.RingGeometry(0.35, 0.42, 24);
        ringGeo.rotateX(-Math.PI / 2);
        var ringMat = new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 0.02;
        ee.mesh.add(ring);
        ee.mesh.userData._groundRing = ring;
        ee.mesh.userData._ringMat = ringMat;
      }

      // Pulse the ring
      var pulse = (Math.sin(now * 0.004 + i * 1.3) + 1) / 2;
      ee.mesh.userData._ringMat.opacity = 0.3 + pulse * 0.3;
      ee.mesh.userData._groundRing.scale.set(1 + pulse * 0.1, 1, 1 + pulse * 0.1);

      // Health bar (only when damaged)
      var maxHP = enemy.maxHP || enemy.hp;
      if (enemy.hp < maxHP && this.css2dRenderer) {
        if (!ee.mesh.userData._healthBar) {
          var hpContainer = document.createElement('div');
          hpContainer.style.cssText = 'width:40px;height:5px;background:#333;border-radius:2px;overflow:hidden;';
          var hpFill = document.createElement('div');
          hpFill.style.cssText = 'width:100%;height:100%;background:#4caf50;transition:width 0.2s;';
          hpContainer.appendChild(hpFill);
          var hpLabel = new THREE.CSS2DObject(hpContainer);
          hpLabel.position.set(0, 1.5, 0);
          ee.mesh.add(hpLabel);
          ee.mesh.userData._healthBar = hpLabel;
          ee.mesh.userData._hpFill = hpFill;
        }
        var hpPct = Math.max(0, enemy.hp / maxHP) * 100;
        ee.mesh.userData._hpFill.style.width = hpPct + '%';
        if (hpPct < 30) ee.mesh.userData._hpFill.style.background = '#f44336';
        else if (hpPct < 60) ee.mesh.userData._hpFill.style.background = '#ff9800';
        else ee.mesh.userData._hpFill.style.background = '#4caf50';
        ee.mesh.userData._healthBar.visible = true;
      } else if (ee.mesh.userData._healthBar) {
        ee.mesh.userData._healthBar.visible = false;
      }
    }
  };

  // === Item pickup visual hint (Issue 8) ===

  Renderer3D.prototype._updateItemPickupHint = function(game) {
    var player = game.player;
    var now = performance.now();

    for (var iKey in this._itemMeshes) {
      var itemMesh = this._itemMeshes[iKey];
      if (!itemMesh || !itemMesh.visible) continue;

      var onPlayerTile = Math.round(itemMesh.position.x) === player.x && Math.round(itemMesh.position.z) === player.y;

      if (onPlayerTile) {
        // Bounce higher and glow
        itemMesh.position.y = 0.2 + Math.sin(now * 0.006) * 0.15;
        itemMesh.traverse(function(child) {
          if (child.isMesh && child.material) {
            if (!child.userData._origEmissive) {
              child.material = child.material.clone();
              child.userData._origEmissive = child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0);
            }
            var glowIntensity = (Math.sin(now * 0.008) + 1) / 2;
            child.material.emissive = new THREE.Color(0x444400);
            child.material.emissiveIntensity = 0.3 + glowIntensity * 0.4;
          }
        });
      } else {
        // Reset glow
        itemMesh.traverse(function(child) {
          if (child.isMesh && child.userData._origEmissive) {
            child.material.emissive.copy(child.userData._origEmissive);
            child.material.emissiveIntensity = 0;
          }
        });
      }
    }
  };

  // === Process game floating texts into 3D popups ===

  Renderer3D.prototype._processGameFloatingTexts = function(game) {
    // Convert game's floating text system to 3D popups
    if (game.floatingTexts && game.floatingTexts.length > 0) {
      for (var i = 0; i < game.floatingTexts.length; i++) {
        var ft = game.floatingTexts[i];
        if (ft.frame === 0 && !ft._3dHandled) {
          // New floating text - create 3D popup
          this._showDamagePopup(ft.x, ft.y, ft.text, ft.color);
          ft._3dHandled = true;
        }
      }
    }
  };

  // === Water/Lava animation ===

  Renderer3D.prototype._animateWaterLava = function() {
    var time = this._animFrame * 0.05;

    // Water tiles: gentle wave
    for (var wi = 0; wi < this._waterMeshes.length; wi++) {
      var wm = this._waterMeshes[wi];
      if (!wm.visible) continue;
      var wx = wm.userData.tileX;
      var wy = wm.userData.tileY;
      wm.position.y = -0.1 + Math.sin(time * 2 + wx * 0.5 + wy * 0.3) * 0.03;
      // Gentle color shift
      var waterT = (Math.sin(time * 1.5 + wx * 0.3) + 1) / 2;
      wm.material.opacity = 0.55 + waterT * 0.1;
    }

    // Lava tiles: pulsing glow
    for (var li = 0; li < this._lavaMeshes.length; li++) {
      var lm = this._lavaMeshes[li];
      if (!lm.visible) continue;
      var lx = lm.userData.tileX;
      var ly = lm.userData.tileY;
      lm.position.y = -0.03 + Math.sin(time * 1.5 + lx * 0.3 + ly * 0.4) * 0.02;
      // Pulsing color between orange-red
      var lavaT = (Math.sin(time * 3 + lx * 0.2) + 1) / 2;
      if (lm.material.color) {
        lm.material.color.setHex(ParticleSystem3D && ParticleSystem3D.lerpColor
          ? ParticleSystem3D.lerpColor(0xff2200, 0xff6600, lavaT) : 0xff4400);
      }
      if (lm.material.emissive) {
        lm.material.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.15;
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

    // Store game reference for camera/room checks
    this._currentGame = game;

    // Ensure post-processing overlays are created
    this._initPostProcessing();

    // Show 3D canvas
    var el3d = document.getElementById('game-canvas-3d');
    if (el3d) el3d.style.display = 'block';
    if (this.css2dRenderer) this.css2dRenderer.domElement.style.display = '';
    this.canvas2d.style.display = 'none';

    // === Village scene in 3D ===
    if (game.scene === 'village') {
      // Build village tile map if needed
      if (this._builtScene !== 'village') {
        this._clearEntities();
        this._buildVillageTileMap(game);
      }

      this._animFrame++;
      var now = performance.now();
      var dt = this._lastTime ? Math.min((now - this._lastTime) / 1000, 0.1) : 0.016;
      this._lastTime = now;

      // Animate water
      this._animateWaterLava();

      // Update animations
      this._updateAnimations();

      // Update popups
      this._updatePopups();

      // Village entities (player + NPCs)
      this._updateVillageEntities(game);

      // Village camera (slightly more zoomed out, min frustum = villageFrustumSize)
      if (this._targetFrustum < this._villageFrustumSize) {
        this._targetFrustum = this._villageFrustumSize;
      }
      this._updateCamera(game.player.x, game.player.y);

      // Post-processing
      this._updatePostProcessing(game);

      // Render
      this.webglRenderer.render(this.scene, this.camera);
      if (this.css2dRenderer) this.css2dRenderer.render(this.scene, this.camera);

      // Village minimap
      this._renderVillageMinimap(game);
      return;
    }

    // === Dungeon scene ===

    // Update visibility
    game.updateVisibility();

    // Rebuild tile map when floor changes (with transition effect)
    var currentFloor = game.floorNum || 1;
    if (this._builtFloor !== currentFloor || this._builtScene !== 'dungeon') {
      if (this._builtFloor > 0 && this._builtScene === 'dungeon' && !this._floorTransition) {
        // Trigger floor transition (fade to black → rebuild → fade in)
        this._startFloorTransition(game);
      } else {
        // First build or mid-transition rebuild
        this._clearEntities();
        this._buildTileMap(game);
      }
    }

    this._animFrame++;

    // Delta time for particles
    var now = performance.now();
    var dt = this._lastTime ? Math.min((now - this._lastTime) / 1000, 0.1) : 0.016;
    this._lastTime = now;

    // === Floor transition effect ===
    if (this._floorTransition) {
      this._updateFloorTransition(game);
      // During blackout phase, skip normal rendering
      if (this._floorTransition && this._floorTransition.phase === 'black') {
        this.webglRenderer.render(this.scene, this.camera);
        if (this.css2dRenderer) this.css2dRenderer.render(this.scene, this.camera);
        return;
      }
    }

    // Update FOV
    this._updateTileVisibility(game);

    // Animate water/lava
    this._animateWaterLava();

    // Update animations
    this._updateAnimations();

    // Update popups
    this._updatePopups();

    // Update entities (includes movement detection + attack detection)
    this._updateEntities(game);

    // Process game floating texts into 3D popups
    this._processGameFloatingTexts(game);

    // === Particle system update ===
    if (typeof ParticleSystem3D !== 'undefined') {
      ParticleSystem3D.update(dt);
    }

    // === Detect combat events for particles ===
    this._updateParticleEffects(game);

    // === Monster house entrance detection ===
    this._checkMonsterHouse(game);

    // === Shop visual effects ===
    this._updateShopVisuals(game);

    // === Enemy ground indicators and health bars (Issue 5) ===
    this._updateEnemyIndicators(game);

    // === Item pickup visual hint (Issue 8) ===
    this._updateItemPickupHint(game);

    // === Stairs glow pulse + spinning particles (Issue 6) ===
    if (this._stairsLight) {
      this._stairsLight.intensity = 2.0 + Math.sin(now * 0.003) * 0.8;
    }
    // Stair spinning golden particles
    if (this.stairsMesh && this.stairsMesh.visible && typeof ParticleSystem3D !== 'undefined') {
      if (!this._lastStairParticle || now - this._lastStairParticle > 200) {
        this._lastStairParticle = now;
        var stairPos = this.stairsMesh.position;
        ParticleSystem3D.emit(this.scene, {
          x: stairPos.x, z: stairPos.z,
          count: 2, color: 0xffd700, size: 0.04,
          speed: 0.3, lifetime: 1.5,
          gravity: 0.3, upward: true, spread: 0.4
        });
      }
    }

    // Camera follow
    this._updateCamera(game.player.x, game.player.y);

    // Post-processing
    this._updatePostProcessing(game);

    // Performance monitoring (every 2 seconds)
    this._fpsFrames++;
    if (now - this._fpsLastCheck > 2000) {
      var fps = this._fpsFrames / ((now - this._fpsLastCheck) / 1000);
      this._fpsFrames = 0;
      this._fpsLastCheck = now;
      if (fps < 30 && !this._performanceDegraded) {
        this._fpsLowCount++;
        if (this._fpsLowCount >= 2) {
          this._performanceDegraded = true;
          // Disable shadows for performance
          this.webglRenderer.shadowMap.enabled = false;
          this.directionalLight.castShadow = false;
          // Set global flag for particle system to halve counts
          window._3dPerformanceDegraded = true;
          // Reduce fog
          if (this.scene.fog && this.scene.fog.isFogExp2) {
            this.scene.fog.density *= 0.7;
          }
        }
      } else {
        this._fpsLowCount = Math.max(0, this._fpsLowCount - 1);
      }
    }

    // Render 3D scene
    this.webglRenderer.render(this.scene, this.camera);

    // Render CSS2D overlay (damage popups)
    if (this.css2dRenderer) {
      this.css2dRenderer.render(this.scene, this.camera);
    }

    // Minimap (reuses 2D canvas)
    this._renderMinimap(game);

    // BGM indicator
    var bgmIndicator = document.getElementById('bgm-indicator');
    if (bgmIndicator) {
      var bgmPlaying = typeof Sound !== 'undefined' && Sound.bgm && !Sound.bgm._muted;
      bgmIndicator.style.display = bgmPlaying ? '' : 'none';
    }
  };

  // === Village Minimap ===

  Renderer3D.prototype._renderVillageMinimap = function(game) {
    var map = game.villageMap;
    if (!map) return;
    var player = game.player;
    var VT = Game.VILLAGE_TILE;

    var ctx = this.miniCtx;
    var t = 6;
    this.miniCanvas.width = map.width * t;
    this.miniCanvas.height = map.height * t;

    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, this.miniCanvas.width, this.miniCanvas.height);

    var colorMap = {};
    colorMap[VT.GRASS] = '#2d5a27';
    colorMap[VT.PATH] = '#8b7355';
    colorMap[VT.WATER] = '#1a6aaa';
    colorMap[VT.BRIDGE] = '#6b5030';
    colorMap[VT.WALL] = '#3a2a1a';
    colorMap[VT.FLOOR] = '#5a4a3a';
    colorMap[VT.TREE] = '#1a4a1a';
    colorMap[VT.FLOWER] = '#2d5a27';
    colorMap[VT.ENTRANCE] = '#1a1a2e';

    for (var y = 0; y < map.height; y++) {
      for (var x = 0; x < map.width; x++) {
        ctx.fillStyle = colorMap[map.grid[y][x]] || '#000';
        ctx.fillRect(x * t, y * t, t, t);
      }
    }

    // NPCs
    var npcs = game.villageNpcs || [];
    for (var i = 0; i < npcs.length; i++) {
      ctx.fillStyle = npcs[i].color || '#fff';
      ctx.fillRect(npcs[i].x * t + 1, npcs[i].y * t + 1, 4, 4);
    }

    // Player
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(player.x * t + t / 2 - 4, player.y * t + t / 2 - 4, 8, 8);
  };

  Renderer3D.prototype._clearEntities = function() {
    // Remove all entity meshes
    for (var key in this.entityMeshes) {
      this.entityGroup.remove(this.entityMeshes[key].mesh);
    }
    this.entityMeshes = {};
    this._itemMeshes = {};
    // Clear village NPC meshes
    for (var nk in this._villageNpcMeshes) {
      this.entityGroup.remove(this._villageNpcMeshes[nk]);
    }
    this._villageNpcMeshes = {};
  };

  // === Phase 3: Particle effects for combat events ===

  Renderer3D.prototype._updateParticleEffects = function(game) {
    if (typeof ParticleSystem3D === 'undefined') return;
    var player = game.player;

    // Track player level for level-up effect
    if (!this._prevLevel) this._prevLevel = player.level;
    if (player.level > this._prevLevel) {
      ParticleSystem3D.levelUp(this.scene, player.x, player.y);
      this._prevLevel = player.level;
    }

    // Track player HP for heal effect (already detect damage in _updateEntities)
    var prevHP = this._prevHP['player'];
    if (prevHP !== undefined && player.hp > prevHP) {
      ParticleSystem3D.heal(this.scene, player.x, player.y);
    }

    // Attack hit particles are triggered from _updateEntities when enemy HP drops
    // (integrated below in the HP change detection)
  };

  // Override the enemy HP-change detection to also emit particles
  var _origUpdateEntities = Renderer3D.prototype._updateEntities;
  Renderer3D.prototype._updateEntities = function(game) {
    // Capture enemy HP before update for particle emission
    var enemyHPBefore = {};
    for (var i = 0; i < game.enemies.length; i++) {
      var e = game.enemies[i];
      if (!e.dead) {
        var eKey = 'enemy_' + i + '_' + e.enemyId;
        if (this._prevHP[eKey] !== undefined) {
          enemyHPBefore[eKey] = { hp: this._prevHP[eKey], x: e.x, y: e.y };
        }
      }
    }

    // Call original
    _origUpdateEntities.call(this, game);

    // Check for HP drops → attack particles
    if (typeof ParticleSystem3D !== 'undefined') {
      for (var i = 0; i < game.enemies.length; i++) {
        var e = game.enemies[i];
        if (e.dead) continue;
        var eKey = 'enemy_' + i + '_' + e.enemyId;
        var before = enemyHPBefore[eKey];
        if (before && e.hp < before.hp) {
          ParticleSystem3D.attackHit(this.scene, e.x, e.y);
        }
      }

      // Check player took damage → attack particles on player
      var pHP = this._prevHP['player'];
      // (pHP is already updated by _origUpdateEntities, so we compare with stored)
    }
  };

  // === Phase 3: Floor Transition Effect ===

  Renderer3D.prototype._startFloorTransition = function(game) {
    this._floorTransition = { phase: 'fadeOut', startTime: performance.now(), game: game };

    // Create fullscreen black overlay
    if (!this._floorOverlay) {
      var overlayGeo = new THREE.PlaneGeometry(100, 100);
      var overlayMat = new THREE.MeshBasicMaterial({
        color: 0x000000, transparent: true, opacity: 0,
        depthTest: false, depthWrite: false
      });
      this._floorOverlay = new THREE.Mesh(overlayGeo, overlayMat);
      this._floorOverlay.renderOrder = 999;
    }
    this._floorOverlay.material.opacity = 0;
    // Position overlay in front of camera
    this.scene.add(this._floorOverlay);
  };

  Renderer3D.prototype._updateFloorTransition = function(game) {
    if (!this._floorTransition) return;

    var elapsed = performance.now() - this._floorTransition.startTime;
    var overlay = this._floorOverlay;

    // Keep overlay facing camera
    if (overlay) {
      overlay.position.copy(this.camera.position);
      var dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      overlay.position.add(dir.multiplyScalar(1));
      overlay.lookAt(this.camera.position);
    }

    // Fix 7: Longer floor transition with text on black screen
    // Fade out (500ms) → Black + text (1000ms) → Fade in (500ms) = ~2s total
    switch (this._floorTransition.phase) {
      case 'fadeOut': // 0→500ms: fade to black
        var t1 = Math.min(elapsed / 500, 1);
        if (overlay) overlay.material.opacity = t1;
        if (t1 >= 1) {
          this._floorTransition.phase = 'black';
          this._floorTransition.startTime = performance.now();
          // Rebuild during blackout
          this._clearEntities();
          this._buildTileMap(game);
          // Show floor text during black phase
          this._showFloorAnnouncement(game);
        }
        break;

      case 'black': // Hold black for 1000ms (text visible on black)
        if (elapsed >= 1000) {
          this._floorTransition.phase = 'fadeIn';
          this._floorTransition.startTime = performance.now();
        }
        break;

      case 'fadeIn': // 0→500ms: fade from black
        var t2 = Math.min(elapsed / 500, 1);
        if (overlay) overlay.material.opacity = 1 - t2;
        if (t2 >= 1) {
          if (overlay) this.scene.remove(overlay);
          this._floorTransition = null;
        }
        break;
    }
  };

  Renderer3D.prototype._showFloorAnnouncement = function(game) {
    // Create DOM overlay for floor text — shown on black screen
    var existing = document.getElementById('floor-announce-3d');
    if (existing) existing.parentNode.removeChild(existing);

    var floorNum = game.floorNum || 1;
    var zoneName = '洞窟';
    if (floorNum <= 10) zoneName = '洞窟';
    else if (floorNum <= 25) zoneName = '地底湖';
    else if (floorNum <= 50) zoneName = '溶岩洞';
    else if (floorNum <= 75) zoneName = '凍土';
    else zoneName = '深淵';

    var div = document.createElement('div');
    div.id = 'floor-announce-3d';
    div.textContent = '最果ての間 ' + floorNum + 'F';
    div.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'font-size:36px;font-weight:bold;color:#ffd700;text-shadow:2px 2px 8px rgba(0,0,0,0.8);' +
      'pointer-events:none;z-index:200;opacity:0;' +
      'font-family:"Noto Sans JP",sans-serif;letter-spacing:4px;';

    // Subtitle with zone name
    var sub = document.createElement('div');
    sub.textContent = zoneName;
    sub.style.cssText = 'font-size:18px;color:#b89a5a;margin-top:8px;letter-spacing:6px;text-align:center;';
    div.appendChild(sub);

    var canvasArea = document.getElementById('canvas-area');
    if (canvasArea) {
      canvasArea.appendChild(div);
      // Fade in the text quickly
      requestAnimationFrame(function() {
        div.style.transition = 'opacity 0.3s ease-in';
        div.style.opacity = '1';
      });
      // Start fading out after 1200ms (during fade-in of scene)
      setTimeout(function() {
        div.style.transition = 'opacity 0.8s ease-out';
        div.style.opacity = '0';
      }, 1200);
      // Remove after full animation
      setTimeout(function() {
        if (div.parentNode) div.parentNode.removeChild(div);
      }, 2500);
    }
  };

  // === Phase 3: Camera Shake ===

  Renderer3D.prototype._shakeCamera = function(intensity, duration) {
    this._shakeStart = performance.now();
    this._shakeDuration = duration || 300;
    this._shakeIntensity = intensity || 0.15;
  };

  // === Phase 3: Monster House Entrance Effect ===

  Renderer3D.prototype._checkMonsterHouse = function(game) {
    if (!game.monsterHouseTriggered || this._monsterHouseTriggered) return;
    this._monsterHouseTriggered = true;

    // Camera shake
    this._shakeCamera(0.2, 400);

    // Flash all visible enemy meshes white
    for (var key in this.entityMeshes) {
      if (key.indexOf('enemy_') === 0) {
        this._flashMeshWhite(this.entityMeshes[key].mesh, 150);
      }
    }

    // Attack particles on each enemy position for dramatic effect
    if (typeof ParticleSystem3D !== 'undefined') {
      for (var key in this.entityMeshes) {
        if (key.indexOf('enemy_') === 0) {
          var em = this.entityMeshes[key];
          ParticleSystem3D.emit(this.scene, {
            x: em.mesh.position.x, z: em.mesh.position.z,
            count: 4, color: 0xff0000, size: 0.04,
            speed: 1, lifetime: 0.6, spread: 0.3,
            gravity: 0, upward: true
          });
        }
      }
    }

    // Exclamation marks above enemies using CSS2DObject
    if (typeof THREE.CSS2DObject !== 'undefined') {
      for (var key in this.entityMeshes) {
        if (key.indexOf('enemy_') === 0) {
          var em = this.entityMeshes[key];
          var excl = document.createElement('div');
          excl.textContent = '!';
          excl.style.cssText = 'color:#ff0;font-size:24px;font-weight:bold;text-shadow:1px 1px 2px #000;';
          var label = new THREE.CSS2DObject(excl);
          label.position.set(em.mesh.position.x, 2.0, em.mesh.position.z);
          this.scene.add(label);
          // Remove after 1.5s
          (function(scene, lbl, div) {
            setTimeout(function() {
              scene.remove(lbl);
            }, 1500);
          })(this.scene, label, excl);
        }
      }
    }
  };

  // === Phase 3: Shop Visual Effects ===

  Renderer3D.prototype._updateShopVisuals = function(game) {
    if (!game.shopRoom) return;

    // Only set up once per floor
    if (this._shopVisualsBuilt) return;
    this._shopVisualsBuilt = true;

    var room = game.shopRoom;

    // Replace floor tiles in shop room with red/gold carpet
    var carpetMat = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
    for (var sy = room.y + 1; sy < room.y + room.h - 1; sy++) {
      for (var sx = room.x + 1; sx < room.x + room.w - 1; sx++) {
        if (this.tileMeshes[sy] && this.tileMeshes[sy][sx]) {
          var tileMesh = this.tileMeshes[sy][sx];
          if (tileMesh.userData.tileType === 1) { // FLOOR
            tileMesh.material = carpetMat;
            tileMesh.userData.baseMaterial = carpetMat;
          }
        }
      }
    }

    // Shopkeeper golden glow
    var shopCenterX = Math.floor(room.x + room.w / 2);
    var shopCenterY = room.y + 1;
    var shopLight = new THREE.PointLight(0xffd700, 0.8, 6);
    shopLight.position.set(shopCenterX, 2, shopCenterY);
    this.scene.add(shopLight);
    this._shopLights.push(shopLight);
  };

  // === Resize (used by fullscreen toggle) ===

  Renderer3D.prototype.resize = function(w, h) {
    if (this.webglRenderer) {
      this.webglRenderer.setSize(w, h);
    }
    if (this.css2dRenderer) {
      this.css2dRenderer.setSize(w, h);
    }
    if (this.camera) {
      var aspect = w / h;
      var fs = this._frustumSize || 15;
      this.camera.left = -fs * aspect / 2;
      this.camera.right = fs * aspect / 2;
      this.camera.top = fs / 2;
      this.camera.bottom = -fs / 2;
      this.camera.updateProjectionMatrix();
    }
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
