// 3D Particle System for visual effects
// Used by renderer3d.js for combat, environment, and transition effects
var ParticleSystem3D = (function() {
  'use strict';

  var _particles = [];

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpColor(c1, c2, t) {
    var r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
    var r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
    var r = Math.round(r1 + (r2 - r1) * t);
    var g = Math.round(g1 + (g2 - g1) * t);
    var b = Math.round(b1 + (b2 - b1) * t);
    return (r << 16) | (g << 8) | b;
  }

  // Shared geometry for particles (reuse to reduce GC)
  var _sharedGeos = {};
  function getParticleGeo(size) {
    var key = Math.round(size * 100);
    if (!_sharedGeos[key]) {
      _sharedGeos[key] = new THREE.SphereGeometry(size, 4, 4);
    }
    return _sharedGeos[key];
  }

  return {
    _particles: _particles,

    emit: function(scene, config) {
      var count = config.count || 5;
      // Enforce max particle limit of 200
      if (_particles.length + count > 200) {
        count = Math.max(0, 200 - _particles.length);
        if (count === 0) return;
      }
      var size = config.size || 0.05;
      var geo = getParticleGeo(size);

      for (var i = 0; i < count; i++) {
        var mat = new THREE.MeshBasicMaterial({
          color: config.color || 0xffffff,
          transparent: true,
          opacity: 1
        });
        var mesh = new THREE.Mesh(geo, mat);

        var angle = Math.random() * Math.PI * 2;
        var speed = (config.speed || 2) * (0.5 + Math.random() * 0.5);

        mesh.position.set(
          config.x + (Math.random() - 0.5) * (config.spread || 0.3),
          config.y || 0.8,
          config.z + (Math.random() - 0.5) * (config.spread || 0.3)
        );

        scene.add(mesh);
        _particles.push({
          mesh: mesh,
          vx: Math.cos(angle) * speed,
          vy: (config.upward ? 2 : 1) * (0.5 + Math.random()),
          vz: Math.sin(angle) * speed,
          gravity: config.gravity !== undefined ? config.gravity : -5,
          life: 0,
          maxLife: config.lifetime || 0.5,
          scene: scene
        });
      }
    },

    update: function(dt) {
      for (var i = _particles.length - 1; i >= 0; i--) {
        var p = _particles[i];
        p.life += dt;
        var t = p.life / p.maxLife;

        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy += p.gravity * dt;

        // Fade out
        p.mesh.material.opacity = Math.max(0, 1 - t);
        // Shrink
        var scale = Math.max(0.01, 1 - t * 0.5);
        p.mesh.scale.set(scale, scale, scale);

        if (p.life >= p.maxLife) {
          p.scene.remove(p.mesh);
          p.mesh.material.dispose();
          _particles.splice(i, 1);
        }
      }
    },

    clear: function(scene) {
      for (var i = _particles.length - 1; i >= 0; i--) {
        var p = _particles[i];
        p.scene.remove(p.mesh);
        p.mesh.material.dispose();
      }
      _particles.length = 0;
    },

    // === Preset effects ===

    attackHit: function(scene, x, z) {
      this.emit(scene, {
        x: x, z: z, count: 8,
        color: 0xffaa00, size: 0.06,
        speed: 3, lifetime: 0.3, spread: 0.2
      });
    },

    fireBreath: function(scene, ax, az, tx, tz) {
      for (var i = 0; i < 5; i++) {
        (function(self, idx) {
          setTimeout(function() {
            var t = idx / 4;
            self.emit(scene, {
              x: lerp(ax, tx, t),
              z: lerp(az, tz, t),
              count: 3, color: 0xff4400, size: 0.08,
              speed: 1, lifetime: 0.5, gravity: -1
            });
          }, idx * 50);
        })(this, i);
      }
    },

    heal: function(scene, x, z) {
      this.emit(scene, {
        x: x, z: z, count: 12,
        color: 0x44ff44, size: 0.04,
        speed: 0.5, lifetime: 1.0,
        gravity: 0.5, upward: true, spread: 0.5
      });
    },

    levelUp: function(scene, x, z) {
      this.emit(scene, {
        x: x, z: z, count: 20,
        color: 0xffd700, size: 0.05,
        speed: 1, lifetime: 1.5,
        gravity: 0, upward: true, spread: 0.3
      });
    },

    poison: function(scene, x, z) {
      this.emit(scene, {
        x: x, z: z, count: 6,
        color: 0x9900ff, size: 0.05,
        speed: 0.3, lifetime: 0.8,
        gravity: 0.5, upward: true
      });
    },

    // Utility
    lerp: lerp,
    lerpColor: lerpColor
  };
})();
