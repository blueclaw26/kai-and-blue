// 3D Model Definitions for Characters and Enemies
// Simple geometric shapes using Three.js primitives
var Models3D = (function() {
  'use strict';

  function mat(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.emissive) params.emissive = opts.emissive;
      if (opts.transparent) { params.transparent = true; params.opacity = opts.opacity || 0.7; }
    }
    return new THREE.MeshLambertMaterial(params);
  }

  function sphere(radius, color) {
    var group = new THREE.Group();
    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 8, 8),
      mat(color)
    );
    mesh.position.y = radius;
    mesh.castShadow = true;
    group.add(mesh);
    return group;
  }

  // Brighten a color by a factor
  function brighten(color, factor) {
    var r = (color >> 16) & 0xff;
    var g = (color >> 8) & 0xff;
    var b = color & 0xff;
    r = Math.min(255, Math.round(r * factor));
    g = Math.min(255, Math.round(g * factor));
    b = Math.min(255, Math.round(b * factor));
    return (r << 16) | (g << 8) | b;
  }

  function getRankColor(baseColor, rank) {
    if (rank <= 1) return baseColor;
    if (rank === 2) return brighten(baseColor, 1.3);
    return brighten(baseColor, 1.6);
  }

  function getRankEmissive(baseColor, rank) {
    if (rank <= 2) return null;
    return brighten(baseColor, 0.3);
  }

  // === Player Model ===
  function createPlayer() {
    var group = new THREE.Group();

    // Body
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.7, 0.3),
      mat(0x2196f3)
    );
    body.position.y = 0.55;
    body.castShadow = true;
    group.add(body);

    // Head
    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      mat(0xffcc80)
    );
    head.position.y = 1.1;
    head.castShadow = true;
    group.add(head);

    // Helmet
    var helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(0x607d8b)
    );
    helmet.position.y = 1.15;
    group.add(helmet);

    // Sword
    var sword = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.5, 0.08),
      mat(0xbdbdbd)
    );
    sword.position.set(0.35, 0.7, 0);
    sword.rotation.z = -0.3;
    group.add(sword);

    // Shield
    var shield = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.3, 0.25),
      mat(0x795548)
    );
    shield.position.set(-0.3, 0.6, 0);
    group.add(shield);

    return group;
  }

  // === Enemy Models ===

  // Mamel: round blob
  function mamelShape(color) {
    return sphere(0.35, color);
  }

  // Chintala: small humanoid
  function chintalShape(color) {
    var group = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.5, 0.25),
      mat(color)
    );
    body.position.y = 0.4;
    body.castShadow = true;
    group.add(body);
    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      mat(brighten(color, 1.2))
    );
    head.position.y = 0.85;
    group.add(head);
    // Ears
    var ear1 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 4), mat(color));
    ear1.position.set(0.12, 1.0, 0);
    group.add(ear1);
    var ear2 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 4), mat(color));
    ear2.position.set(-0.12, 1.0, 0);
    group.add(ear2);
    return group;
  }

  // Dragon: box body + wings + cone head
  function dragonShape(color) {
    var group = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.5, 0.4),
      mat(color)
    );
    body.position.y = 0.45;
    body.castShadow = true;
    group.add(body);
    // Head (cone)
    var head = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.3, 6),
      mat(brighten(color, 1.1))
    );
    head.position.set(0.35, 0.65, 0);
    head.rotation.z = -Math.PI / 2;
    group.add(head);
    // Wings
    var wingMat = mat(brighten(color, 0.8));
    var wing1 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), wingMat);
    wing1.position.set(0, 0.7, 0.3);
    wing1.rotation.x = -0.3;
    group.add(wing1);
    var wing2 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), wingMat);
    wing2.position.set(0, 0.7, -0.3);
    wing2.rotation.x = 0.3;
    group.add(wing2);
    // Tail
    var tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.4, 4),
      mat(color)
    );
    tail.position.set(-0.45, 0.35, 0);
    tail.rotation.z = Math.PI / 3;
    group.add(tail);
    return group;
  }

  // Reaper: tall thin + hood
  function reaperShape(color) {
    var group = new THREE.Group();
    // Robe body (cone)
    var robe = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 1.0, 8),
      mat(color)
    );
    robe.position.y = 0.5;
    robe.castShadow = true;
    group.add(robe);
    // Hood (sphere)
    var hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      mat(brighten(color, 0.7))
    );
    hood.position.y = 1.1;
    group.add(hood);
    // Scythe handle
    var handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.8, 4),
      mat(0x5d4037)
    );
    handle.position.set(0.3, 0.7, 0);
    handle.rotation.z = -0.2;
    group.add(handle);
    // Scythe blade
    var blade = new THREE.Mesh(
      new THREE.PlaneGeometry(0.25, 0.15),
      mat(0xbdbdbd)
    );
    blade.position.set(0.35, 1.15, 0);
    group.add(blade);
    return group;
  }

  // Scorpion: flat body + pincers
  function scorpionShape(color) {
    var group = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.2, 0.35),
      mat(color)
    );
    body.position.y = 0.2;
    body.castShadow = true;
    group.add(body);
    // Pincers
    var pincer1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.08), mat(brighten(color, 1.2)));
    pincer1.position.set(0.35, 0.2, 0.12);
    group.add(pincer1);
    var pincer2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.08), mat(brighten(color, 1.2)));
    pincer2.position.set(0.35, 0.2, -0.12);
    group.add(pincer2);
    // Tail (curved up)
    var tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.35, 4),
      mat(color)
    );
    tail.position.set(-0.25, 0.45, 0);
    tail.rotation.z = 0.5;
    group.add(tail);
    // Stinger
    var stinger = new THREE.Mesh(
      new THREE.ConeGeometry(0.03, 0.1, 4),
      mat(0xff5722)
    );
    stinger.position.set(-0.3, 0.65, 0);
    group.add(stinger);
    return group;
  }

  // Nigiri: triangle (onigiri shape)
  function nigiriShape(color) {
    var group = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.6, 3),
      mat(color)
    );
    body.position.y = 0.3;
    body.castShadow = true;
    group.add(body);
    // Nori (seaweed band)
    var nori = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.15, 0.05),
      mat(0x1b5e20)
    );
    nori.position.set(0, 0.2, 0.2);
    group.add(nori);
    return group;
  }

  // Mage: cone robe + staff
  function mageShape(color) {
    var group = new THREE.Group();
    var robe = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.8, 8),
      mat(color)
    );
    robe.position.y = 0.4;
    robe.castShadow = true;
    group.add(robe);
    // Hat (cone)
    var hat = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.35, 6),
      mat(brighten(color, 0.7))
    );
    hat.position.y = 1.05;
    group.add(hat);
    // Staff
    var staff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.9, 4),
      mat(0x795548)
    );
    staff.position.set(0.3, 0.5, 0);
    group.add(staff);
    // Staff orb
    var orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      mat(0x7c4dff, { emissive: 0x3a0088 })
    );
    orb.position.set(0.3, 1.0, 0);
    group.add(orb);
    return group;
  }

  // Bull: wide box + horns
  function bullShape(color) {
    var group = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.7, 0.45),
      mat(color)
    );
    body.position.y = 0.55;
    body.castShadow = true;
    group.add(body);
    // Head
    var head = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.3, 0.3),
      mat(brighten(color, 1.1))
    );
    head.position.set(0.25, 0.95, 0);
    group.add(head);
    // Horns
    var horn1 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 4), mat(0xe0e0e0));
    horn1.position.set(0.3, 1.2, 0.15);
    horn1.rotation.z = -0.3;
    group.add(horn1);
    var horn2 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 4), mat(0xe0e0e0));
    horn2.position.set(0.3, 1.2, -0.15);
    horn2.rotation.z = -0.3;
    group.add(horn2);
    // Axe
    var axeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 4), mat(0x5d4037));
    axeHandle.position.set(-0.35, 0.7, 0);
    group.add(axeHandle);
    return group;
  }

  // Thief (pelican): round body
  function thiefShape(color) {
    var group = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      mat(color)
    );
    body.position.y = 0.4;
    body.castShadow = true;
    // Squash it vertically for seal/walrus look
    body.scale.set(1, 0.8, 0.9);
    group.add(body);
    // Beak/mouth
    var beak = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.2, 4),
      mat(0xff8f00)
    );
    beak.position.set(0.3, 0.4, 0);
    beak.rotation.z = -Math.PI / 2;
    group.add(beak);
    return group;
  }

  // Kengo: humanoid + katana
  function kengoShape(color) {
    var group = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.65, 0.3),
      mat(color)
    );
    body.position.y = 0.52;
    body.castShadow = true;
    group.add(body);
    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      mat(0xffcc80)
    );
    head.position.y = 1.05;
    group.add(head);
    // Katana (longer than knight's sword)
    var katana = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.65, 0.06),
      mat(0xe0e0e0)
    );
    katana.position.set(0.35, 0.7, 0);
    katana.rotation.z = -0.15;
    group.add(katana);
    return group;
  }

  // Slime: flattened blob
  function slimeShape(color) {
    var group = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      mat(color, { transparent: true, opacity: 0.75 })
    );
    body.position.y = 0.2;
    body.scale.set(1.2, 0.6, 1.2);
    body.castShadow = true;
    group.add(body);
    return group;
  }

  // Polygon: icosahedron
  function polygonShape(color) {
    var group = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.35),
      mat(color)
    );
    body.position.y = 0.4;
    body.castShadow = true;
    group.add(body);
    return group;
  }

  // Mazerun: pot/jar shape
  function mazerunShape(color) {
    var group = new THREE.Group();
    // Body (cylinder)
    var body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.2, 0.5, 8),
      mat(color)
    );
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);
    // Wider top rim
    var rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.25, 0.08, 8),
      mat(brighten(color, 1.2))
    );
    rim.position.y = 0.62;
    group.add(rim);
    return group;
  }

  // Cart: box on wheels
  function cartShape(color) {
    var group = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 0.35),
      mat(color)
    );
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);
    // Wheels
    var wheelMat = mat(0x424242);
    var w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8), wheelMat);
    w1.position.set(0.2, 0.12, 0.2);
    w1.rotation.x = Math.PI / 2;
    group.add(w1);
    var w2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8), wheelMat);
    w2.position.set(0.2, 0.12, -0.2);
    w2.rotation.x = Math.PI / 2;
    group.add(w2);
    var w3 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8), wheelMat);
    w3.position.set(-0.2, 0.12, 0.2);
    w3.rotation.x = Math.PI / 2;
    group.add(w3);
    var w4 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8), wheelMat);
    w4.position.set(-0.2, 0.12, -0.2);
    w4.rotation.x = Math.PI / 2;
    group.add(w4);
    // Cannon
    var cannon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.3, 6),
      mat(0x616161)
    );
    cannon.position.set(0.35, 0.4, 0);
    cannon.rotation.z = -Math.PI / 2;
    group.add(cannon);
    return group;
  }

  // Ghost warrior: floating humanoid, semi-transparent
  function ghostShape(color) {
    var group = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.7, 8),
      mat(color, { transparent: true, opacity: 0.6 })
    );
    body.position.y = 0.55;
    group.add(body);
    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      mat(brighten(color, 1.3), { transparent: true, opacity: 0.7 })
    );
    head.position.y = 1.05;
    group.add(head);
    return group;
  }

  // Radish: round body + leaves
  function radishShape(color) {
    var group = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      mat(color)
    );
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);
    // Leaves on top
    var leaf1 = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 0.3),
      mat(0x4caf50)
    );
    leaf1.position.set(0.05, 0.7, 0);
    leaf1.rotation.z = 0.2;
    group.add(leaf1);
    var leaf2 = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 0.3),
      mat(0x388e3c)
    );
    leaf2.position.set(-0.05, 0.7, 0);
    leaf2.rotation.z = -0.2;
    group.add(leaf2);
    return group;
  }

  // Toad: frog shape
  function toadShape(color) {
    var group = new THREE.Group();
    // Body (wide, squat)
    var body = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      mat(color)
    );
    body.position.y = 0.25;
    body.scale.set(1.2, 0.7, 1.0);
    body.castShadow = true;
    group.add(body);
    // Eyes (two bumps on top)
    var eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), mat(0xffeb3b));
    eye1.position.set(0.12, 0.42, 0.1);
    group.add(eye1);
    var eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), mat(0xffeb3b));
    eye2.position.set(0.12, 0.42, -0.1);
    group.add(eye2);
    return group;
  }

  // === Item Models ===

  function createItemModel(type) {
    var group = new THREE.Group();

    switch (type) {
      case 'weapon':
        // Small sword
        var blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.3, 0.06),
          mat(0xbdbdbd)
        );
        blade.position.y = 0.2;
        group.add(blade);
        var hilt = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.04, 0.04),
          mat(0x795548)
        );
        hilt.position.y = 0.05;
        group.add(hilt);
        break;
      case 'shield':
        var sh = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.25, 0.04),
          mat(0x795548)
        );
        sh.position.y = 0.15;
        sh.rotation.y = 0.3;
        group.add(sh);
        break;
      case 'scroll':
        var sc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8),
          mat(0xfff9c4)
        );
        sc.position.y = 0.08;
        sc.rotation.z = Math.PI / 2;
        group.add(sc);
        break;
      case 'grass':
        var gr = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 6, 6),
          mat(0x4caf50)
        );
        gr.position.y = 0.1;
        group.add(gr);
        break;
      case 'food':
        var fd = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 6, 6),
          mat(0xffcc80)
        );
        fd.position.y = 0.12;
        group.add(fd);
        break;
      case 'staff':
        var st = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4),
          mat(0x8d6e63)
        );
        st.position.y = 0.2;
        group.add(st);
        break;
      case 'pot':
        var po = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.1, 0.2, 8),
          mat(0x8d6e63)
        );
        po.position.y = 0.12;
        group.add(po);
        break;
      case 'bracelet':
        var br = new THREE.Mesh(
          new THREE.TorusGeometry(0.1, 0.03, 6, 12),
          mat(0xffd700)
        );
        br.position.y = 0.1;
        br.rotation.x = Math.PI / 2;
        group.add(br);
        break;
      case 'arrow':
        var ar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4),
          mat(0x8d6e63)
        );
        ar.position.y = 0.05;
        ar.rotation.z = Math.PI / 4;
        group.add(ar);
        var tip = new THREE.Mesh(
          new THREE.ConeGeometry(0.04, 0.08, 4),
          mat(0x9e9e9e)
        );
        tip.position.set(0.12, 0.17, 0);
        tip.rotation.z = Math.PI / 4;
        group.add(tip);
        break;
      default:
        // Gold coin
        var coin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 0.03, 12),
          mat(0xffd700)
        );
        coin.position.y = 0.05;
        group.add(coin);
        break;
    }

    return group;
  }

  // === Stairs Model ===
  function createStairs() {
    var group = new THREE.Group();
    var cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.3, 4),
      mat(0xffd700, { emissive: 0x665500 })
    );
    cone.position.y = 0.15;
    cone.rotation.x = Math.PI; // point down
    group.add(cone);
    // Glow ring
    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.03, 6, 12),
      mat(0xffeb3b, { emissive: 0x665500 })
    );
    ring.position.y = 0.02;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    return group;
  }

  // === Trap Model ===
  function createTrap() {
    var group = new THREE.Group();
    var base = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.05, 0.6),
      mat(0x8d6e63)
    );
    base.position.y = 0.025;
    group.add(base);
    // Warning symbol
    var mark = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.15, 3),
      mat(0xff5722)
    );
    mark.position.y = 0.1;
    group.add(mark);
    return group;
  }

  // Main create enemy dispatcher
  function createEnemy(familyType, color, rank) {
    rank = rank || 1;
    var c = getRankColor(color, rank);
    var emissive = getRankEmissive(color, rank);

    var model;
    switch (familyType) {
      case 'mamel': model = mamelShape(c); break;
      case 'chintala': model = chintalShape(c); break;
      case 'dragon': model = dragonShape(c); break;
      case 'reaper': model = reaperShape(c); break;
      case 'scorpion': model = scorpionShape(c); break;
      case 'nigiri': model = nigiriShape(c); break;
      case 'mage': model = mageShape(c); break;
      case 'bull': model = bullShape(c); break;
      case 'thief': model = thiefShape(c); break;
      case 'kengo': model = kengoShape(c); break;
      case 'slime': model = slimeShape(c); break;
      case 'polygon': model = polygonShape(c); break;
      case 'mazerun': model = mazerunShape(c); break;
      case 'cart': model = cartShape(c); break;
      case 'ghost_warrior': model = ghostShape(c); break;
      case 'radish': model = radishShape(c); break;
      case 'toad': model = toadShape(c); break;
      default: model = sphere(0.3, c); break;
    }

    // Add emissive glow for rank 3
    if (emissive) {
      model.traverse(function(child) {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.emissive = new THREE.Color(emissive);
          child.material.emissiveIntensity = 0.3;
        }
      });
    }

    return model;
  }

  // === Village NPC Models ===

  // Generic humanoid base for village NPCs
  function villageHumanoid(bodyColor, height) {
    var group = new THREE.Group();
    var scale = height || 1.0;
    // Body
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.4 * scale, 0.6 * scale, 0.3 * scale),
      mat(bodyColor)
    );
    body.position.y = 0.5 * scale;
    body.castShadow = true;
    group.add(body);
    // Head
    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.17 * scale, 8, 8),
      mat(0xffcc80)
    );
    head.position.y = 1.0 * scale;
    head.castShadow = true;
    group.add(head);
    return group;
  }

  function createVillageNPC(npcType) {
    var group;
    switch (npcType) {
      case '倉庫番':
        group = villageHumanoid(0xe8a44a);
        // Apron
        var apron = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.35, 0.05),
          mat(0xffffff)
        );
        apron.position.set(0, 0.4, 0.18);
        group.add(apron);
        break;
      case '鍛冶屋':
        group = villageHumanoid(0xe07050);
        // Hammer
        var hammerHandle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 0.35, 4),
          mat(0x5d4037)
        );
        hammerHandle.position.set(0.3, 0.6, 0);
        hammerHandle.rotation.z = -0.3;
        group.add(hammerHandle);
        var hammerHead = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.08, 0.08),
          mat(0x9e9e9e)
        );
        hammerHead.position.set(0.32, 0.8, 0);
        group.add(hammerHead);
        break;
      case '道具屋':
        group = villageHumanoid(0x66bb6a);
        // Hat
        var hat = new THREE.Mesh(
          new THREE.ConeGeometry(0.2, 0.2, 8),
          mat(0x4e342e)
        );
        hat.position.y = 1.2;
        group.add(hat);
        break;
      case '情報屋':
        group = villageHumanoid(0xb388ff);
        // Glasses
        var glass1 = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 6, 6),
          mat(0x90caf9, { transparent: true, opacity: 0.6 })
        );
        glass1.position.set(0.08, 1.0, 0.15);
        group.add(glass1);
        var glass2 = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 6, 6),
          mat(0x90caf9, { transparent: true, opacity: 0.6 })
        );
        glass2.position.set(-0.08, 1.0, 0.15);
        group.add(glass2);
        break;
      case '村長':
        group = villageHumanoid(0xffd54f, 1.15);
        break;
      case '子供':
        group = villageHumanoid(0x81d4fa, 0.7);
        break;
      case '猫':
        group = new THREE.Group();
        // Small quadruped body
        var catBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.18, 0.2),
          mat(0xffab91)
        );
        catBody.position.y = 0.22;
        catBody.castShadow = true;
        group.add(catBody);
        // Head
        var catHead = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 6, 6),
          mat(0xffab91)
        );
        catHead.position.set(0.2, 0.32, 0);
        group.add(catHead);
        // Ears (triangles)
        var catEar1 = new THREE.Mesh(
          new THREE.ConeGeometry(0.04, 0.1, 3),
          mat(0xff8a65)
        );
        catEar1.position.set(0.22, 0.45, 0.06);
        group.add(catEar1);
        var catEar2 = new THREE.Mesh(
          new THREE.ConeGeometry(0.04, 0.1, 3),
          mat(0xff8a65)
        );
        catEar2.position.set(0.22, 0.45, -0.06);
        group.add(catEar2);
        // 4 legs
        var legMat = mat(0xffab91);
        var legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.13, 4);
        var positions = [[0.12, 0.065, 0.08], [0.12, 0.065, -0.08], [-0.12, 0.065, 0.08], [-0.12, 0.065, -0.08]];
        for (var li = 0; li < 4; li++) {
          var leg = new THREE.Mesh(legGeo, legMat);
          leg.position.set(positions[li][0], positions[li][1], positions[li][2]);
          group.add(leg);
        }
        // Tail
        var catTail = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.015, 0.25, 4),
          mat(0xffab91)
        );
        catTail.position.set(-0.25, 0.32, 0);
        catTail.rotation.z = 0.6;
        group.add(catTail);
        break;
      default:
        group = villageHumanoid(0x888888);
        break;
    }
    return group;
  }

  // === Village Tree Model ===
  function createVillageTree(seed) {
    var group = new THREE.Group();
    // Trunk
    var trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.6, 6),
      mat(0x5d4037)
    );
    trunk.position.y = 0.3;
    trunk.castShadow = true;
    group.add(trunk);
    // Canopy
    var canopyScale = 0.35 + (seed % 10) * 0.01;
    var canopy = new THREE.Mesh(
      new THREE.SphereGeometry(canopyScale, 8, 8),
      mat(0x2e7d32)
    );
    canopy.position.y = 0.75;
    canopy.scale.set(1, 0.8 + (seed % 5) * 0.04, 1);
    canopy.castShadow = true;
    group.add(canopy);
    return group;
  }

  // === Village Flower Model ===
  function createVillageFlower(seed) {
    var group = new THREE.Group();
    // Stem
    var stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.2, 4),
      mat(0x4caf50)
    );
    stem.position.y = 0.1;
    group.add(stem);
    // Petals (3-4 small spheres)
    var flowerColors = [0xff80ab, 0xffeb3b, 0xce93d8, 0xff8a65];
    var petalCount = 3 + (seed % 2);
    var color = flowerColors[seed % flowerColors.length];
    for (var pi = 0; pi < petalCount; pi++) {
      var angle = (pi / petalCount) * Math.PI * 2;
      var petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 4, 4),
        mat(color)
      );
      petal.position.set(Math.cos(angle) * 0.06, 0.22, Math.sin(angle) * 0.06);
      group.add(petal);
    }
    // Center
    var center = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 4, 4),
      mat(0xffeb3b)
    );
    center.position.y = 0.22;
    group.add(center);
    return group;
  }

  return {
    createPlayer: createPlayer,
    createEnemy: createEnemy,
    createItemModel: createItemModel,
    createStairs: createStairs,
    createTrap: createTrap,
    createVillageNPC: createVillageNPC,
    createVillageTree: createVillageTree,
    createVillageFlower: createVillageFlower,
    brighten: brighten
  };
})();
