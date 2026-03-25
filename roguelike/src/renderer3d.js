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

  // Ease in-out quad
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
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
    // Front-facing quarter view: camera behind and above, looking down Z axis
    this.camera.position.set(0, 18, 12);
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
    // Remove floor announcement if present
    var announce = document.getElementById('floor-announce-3d');
    if (announce && announce.parentNode) announce.parentNode.removeChild(announce);
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
        a.mesh.position.y = a.baseY + Math.sin(t * Math.PI) * 0.15;
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
        // Random idle phase for each enemy
        enemyModel.userData._idlePhase = Math.random() * Math.PI * 2;
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
        ee.mesh.position.y = Math.sin(now * 0.002 + (ee.mesh.userData._idlePhase || 0)) * 0.04;
      }

      // Sleeping overlay: scale down slightly
      if (enemy.sleeping) {
        ee.mesh.scale.setScalar(0.8);
      } else {
        ee.mesh.scale.setScalar(1.0);
      }

      ee.mesh.visible = true;
    }

    // --- Items (as 3D objects with rotation) ---
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

    if (this.cameraX < 0) {
      this._smoothCamX = tx;
      this._smoothCamZ = tz;
      this.cameraX = 0;
    }

    // Smooth camera follow (lerp)
    var lerpSpeed = 0.08;
    this._smoothCamX += (tx - this._smoothCamX) * lerpSpeed;
    this._smoothCamZ += (tz - this._smoothCamZ) * lerpSpeed;

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

    // Front-facing quarter view: camera behind and above player, looking down Z
    // Q/E rotate in 90° increments around the player
    var radius = this._cameraRadius;
    var height = this._cameraHeight;
    this.camera.position.x = cx + Math.sin(this._cameraAngle) * radius;
    this.camera.position.z = cz + Math.cos(this._cameraAngle) * radius;
    this.camera.position.y = height;

    // Camera shake offset
    if (this._shakeStart) {
      var shakeElapsed = performance.now() - this._shakeStart;
      if (shakeElapsed < this._shakeDuration) {
        var shakeT = 1 - shakeElapsed / this._shakeDuration;
        this.camera.position.x += (Math.random() - 0.5) * this._shakeIntensity * shakeT;
        this.camera.position.y += (Math.random() - 0.5) * this._shakeIntensity * shakeT;
      } else {
        this._shakeStart = null;
      }
    }

    this.camera.lookAt(cx, 0, cz);

    // Player torch
    this.playerLight.position.set(cx, 3, cz);

    // Move directional light to follow roughly
    this.directionalLight.position.set(cx + 10, 20, cz + 10);
    this.directionalLight.target.position.set(cx, 0, cz);
    this.directionalLight.target.updateMatrixWorld();
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

    // Village scene: fall back to 2D for now (village is simple)
    if (game.scene === 'village') {
      // Hide 3D canvas, show 2D for village
      var el3d = document.getElementById('game-canvas-3d');
      if (el3d) el3d.style.display = 'none';
      if (this.css2dRenderer) this.css2dRenderer.domElement.style.display = 'none';
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
    if (this.css2dRenderer) this.css2dRenderer.domElement.style.display = '';
    this.canvas2d.style.display = 'none';

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

    // Camera follow
    this._updateCamera(game.player.x, game.player.y);

    // Render 3D scene
    this.webglRenderer.render(this.scene, this.camera);

    // Render CSS2D overlay (damage popups)
    if (this.css2dRenderer) {
      this.css2dRenderer.render(this.scene, this.camera);
    }

    // Minimap (reuses 2D canvas)
    this._renderMinimap(game);
  };

  Renderer3D.prototype._clearEntities = function() {
    // Remove all entity meshes
    for (var key in this.entityMeshes) {
      this.entityGroup.remove(this.entityMeshes[key].mesh);
    }
    this.entityMeshes = {};
    this._itemMeshes = {};
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

    switch (this._floorTransition.phase) {
      case 'fadeOut': // 0→300ms: fade to black
        var t1 = Math.min(elapsed / 300, 1);
        if (overlay) overlay.material.opacity = t1;
        if (t1 >= 1) {
          this._floorTransition.phase = 'black';
          this._floorTransition.startTime = performance.now();
          // Rebuild during blackout
          this._clearEntities();
          this._buildTileMap(game);
        }
        break;

      case 'black': // 100ms hold black
        if (elapsed >= 100) {
          this._floorTransition.phase = 'fadeIn';
          this._floorTransition.startTime = performance.now();
          // Show floor announcement
          this._showFloorAnnouncement(game);
        }
        break;

      case 'fadeIn': // 0→300ms: fade from black
        var t2 = Math.min(elapsed / 300, 1);
        if (overlay) overlay.material.opacity = 1 - t2;
        if (t2 >= 1) {
          if (overlay) this.scene.remove(overlay);
          this._floorTransition = null;
        }
        break;
    }
  };

  Renderer3D.prototype._showFloorAnnouncement = function(game) {
    // Create DOM overlay for floor text
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
    div.textContent = floorNum + 'F ' + zoneName;
    div.style.cssText = 'position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);' +
      'font-size:36px;font-weight:bold;color:#ffd700;text-shadow:2px 2px 8px rgba(0,0,0,0.8);' +
      'pointer-events:none;z-index:100;opacity:1;transition:opacity 1.5s ease-out 0.5s;' +
      'font-family:"Noto Sans JP",sans-serif;';

    var canvasArea = document.getElementById('canvas-area');
    if (canvasArea) {
      canvasArea.appendChild(div);
      // Trigger fade out after a brief moment
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          div.style.opacity = '0';
        });
      });
      // Remove after animation
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
