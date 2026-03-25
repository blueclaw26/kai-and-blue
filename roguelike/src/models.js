// 3D Model Definitions for Characters and Enemies
// Simple geometric shapes using Three.js primitives
var Models3D = (function() {
  'use strict';

  function mat(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.emissive) params.emissive = opts.emissive;
      if (opts.transparent) { params.transparent = true; params.opacity = opts.opacity || 0.7; }
      if (opts.side) params.side = opts.side;
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

  // Helper: create a small glow ring for items on the ground
  function createItemGlowRing(color) {
    var ringGeo = new THREE.RingGeometry(0.18, 0.25, 16);
    ringGeo.rotateX(-Math.PI / 2);
    var ringMat = new THREE.MeshBasicMaterial({
      color: color, transparent: true, opacity: 0.35, side: THREE.DoubleSide
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.02;
    return ring;
  }

  // === Player Model (Issue 4: improved with cape, helmet cone, metallic sheen) ===
  function createPlayer() {
    var group = new THREE.Group();

    // Body — metallic Phong material
    var bodyMat = new THREE.MeshPhongMaterial({ color: 0x2196f3, shininess: 40, specular: 0x444444 });
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.7, 0.3),
      bodyMat
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

    // Helmet (half sphere + cone on top)
    var helmetMat = new THREE.MeshPhongMaterial({ color: 0x607d8b, shininess: 60, specular: 0x888888 });
    var helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
      helmetMat
    );
    helmet.position.y = 1.15;
    group.add(helmet);

    // Helmet cone point
    var helmetCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.2, 6),
      helmetMat
    );
    helmetCone.position.y = 1.35;
    group.add(helmetCone);

    // Sword — longer and angled, metallic
    var swordMat = new THREE.MeshPhongMaterial({ color: 0xbdbdbd, shininess: 80, specular: 0xffffff });
    var sword = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.65, 0.07),
      swordMat
    );
    sword.position.set(0.38, 0.75, 0);
    sword.rotation.z = -0.4;
    group.add(sword);

    // Sword guard
    var guard = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.04, 0.04),
      mat(0x795548)
    );
    guard.position.set(0.32, 0.48, 0);
    guard.rotation.z = -0.4;
    group.add(guard);

    // Shield
    var shieldMat = new THREE.MeshPhongMaterial({ color: 0x795548, shininess: 30, specular: 0x333333 });
    var shield = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.32, 0.28),
      shieldMat
    );
    shield.position.set(-0.3, 0.6, 0);
    group.add(shield);

    // Cape/cloak (flat plane behind body, animated with sin in render loop)
    var capeMat = new THREE.MeshLambertMaterial({ color: 0x1565c0, side: THREE.DoubleSide });
    var cape = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.55),
      capeMat
    );
    cape.position.set(0, 0.55, -0.18);
    cape.rotation.x = 0.1;
    cape.userData._isCape = true;
    group.add(cape);
    group.userData._cape = cape;

    return group;
  }

  // === Enemy Models ===

  // Mamel: squashed blob with eyes and mouth
  function mamelShape(color) {
    var group = new THREE.Group();
    // Main body: squashed sphere
    var body = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      mat(color)
    );
    body.position.y = 0.28;
    body.scale.set(1, 0.8, 1);
    body.castShadow = true;
    group.add(body);
    // Left eye (white)
    var eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), mat(0xffffff));
    eye1.position.set(0.12, 0.35, 0.28);
    group.add(eye1);
    // Right eye (white)
    var eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), mat(0xffffff));
    eye2.position.set(-0.12, 0.35, 0.28);
    group.add(eye2);
    // Pupils
    var pupil1 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), mat(0x111111));
    pupil1.position.set(0.12, 0.35, 0.33);
    group.add(pupil1);
    var pupil2 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), mat(0x111111));
    pupil2.position.set(-0.12, 0.35, 0.33);
    group.add(pupil2);
    // Mouth (thin dark box)
    var mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.02, 0.02),
      mat(0x222222)
    );
    mouth.position.set(0, 0.2, 0.32);
    group.add(mouth);
    return group;
  }

  // Chintala: upright oval with big eyes and arms
  function chintalShape(color) {
    var group = new THREE.Group();
    // Upright oval body
    var body = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 8),
      mat(color)
    );
    body.position.y = 0.4;
    body.scale.set(0.85, 1.2, 0.85);
    body.castShadow = true;
    group.add(body);
    // Large white eyes
    var eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), mat(0xffffff));
    eye1.position.set(0.1, 0.55, 0.22);
    group.add(eye1);
    var eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), mat(0xffffff));
    eye2.position.set(-0.1, 0.55, 0.22);
    group.add(eye2);
    // Small black pupils
    var pupil1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 4, 4), mat(0x111111));
    pupil1.position.set(0.1, 0.55, 0.29);
    group.add(pupil1);
    var pupil2 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 4, 4), mat(0x111111));
    pupil2.position.set(-0.1, 0.55, 0.29);
    group.add(pupil2);
    // Small arms (thin cylinders on sides)
    var armMat = mat(brighten(color, 0.9));
    var arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 4), armMat);
    arm1.position.set(0.25, 0.35, 0);
    arm1.rotation.z = -0.5;
    group.add(arm1);
    var arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 4), armMat);
    arm2.position.set(-0.25, 0.35, 0);
    arm2.rotation.z = 0.5;
    group.add(arm2);
    // Ears
    var ear1 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 4), mat(color));
    ear1.position.set(0.12, 0.75, 0);
    group.add(ear1);
    var ear2 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 4), mat(color));
    ear2.position.set(-0.12, 0.75, 0);
    group.add(ear2);
    return group;
  }

  // Dragon: box body + neck + head + wings + tail + fire glow
  function dragonShape(color) {
    var group = new THREE.Group();
    // Box body, wider than tall
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.4, 0.45),
      mat(color)
    );
    body.position.y = 0.4;
    body.castShadow = true;
    group.add(body);
    // Long neck (cylinder angled upward)
    var neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.35, 6),
      mat(brighten(color, 1.05))
    );
    neck.position.set(0.28, 0.7, 0);
    neck.rotation.z = -0.6;
    group.add(neck);
    // Head (smaller sphere at top of neck)
    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 6, 6),
      mat(brighten(color, 1.1))
    );
    head.position.set(0.4, 0.9, 0);
    group.add(head);
    // Mouth area: orange/red emissive (fire glow)
    var mouthGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 4, 4),
      mat(0xff4400, { emissive: 0xff2200 })
    );
    mouthGlow.position.set(0.52, 0.85, 0);
    group.add(mouthGlow);
    // Wings — large triangle shapes extending from sides
    var wingMat = mat(brighten(color, 0.8));
    wingMat.side = THREE.DoubleSide;
    var wingGeo1 = new THREE.BufferGeometry();
    wingGeo1.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0,
      -0.15, 0.3, 0.55,
      0.25, -0.1, 0.5
    ], 3));
    wingGeo1.computeVertexNormals();
    var wing1 = new THREE.Mesh(wingGeo1, wingMat);
    wing1.position.set(0, 0.55, 0.22);
    wing1.userData._isWing = true;
    wing1.userData._wingSide = 1;
    group.add(wing1);
    var wingGeo2 = new THREE.BufferGeometry();
    wingGeo2.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0,
      -0.15, 0.3, -0.55,
      0.25, -0.1, -0.5
    ], 3));
    wingGeo2.computeVertexNormals();
    var wing2 = new THREE.Mesh(wingGeo2, wingMat);
    wing2.position.set(0, 0.55, -0.22);
    wing2.userData._isWing = true;
    wing2.userData._wingSide = -1;
    group.add(wing2);
    // Tail (tapered cylinder behind)
    var tail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.08, 0.45, 4),
      mat(color)
    );
    tail.position.set(-0.5, 0.35, 0);
    tail.rotation.z = Math.PI / 3;
    group.add(tail);
    group.userData._isDragon = true;
    return group;
  }

  // Reaper: tall thin robes + dark hood + scythe — floating
  function reaperShape(color) {
    var group = new THREE.Group();
    var floatOffset = 0.15;
    // Shadow on ground
    var shadowGeo = new THREE.CircleGeometry(0.25, 12);
    shadowGeo.rotateX(-Math.PI / 2);
    var shadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.3
    }));
    shadow.position.y = 0.01;
    group.add(shadow);
    // Robe body (tall thin cone)
    var robe = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 1.1, 8),
      mat(color)
    );
    robe.position.y = 0.55 + floatOffset;
    robe.castShadow = true;
    group.add(robe);
    // Dark hood (sphere with dark material — no visible face)
    var hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      mat(brighten(color, 0.4))
    );
    hood.position.y = 1.2 + floatOffset;
    group.add(hood);
    // Scythe handle (long thin cylinder)
    var handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.9, 4),
      mat(0x5d4037)
    );
    handle.position.set(0.3, 0.7 + floatOffset, 0);
    handle.rotation.z = -0.2;
    group.add(handle);
    // Scythe blade (flat box at end, angled)
    var blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.12, 0.02),
      mat(0xbdbdbd)
    );
    blade.position.set(0.38, 1.18 + floatOffset, 0);
    blade.rotation.z = 0.3;
    group.add(blade);
    group.userData._isReaper = true;
    return group;
  }

  // Scorpion: flat body + L-pincers + curved tail + legs
  function scorpionShape(color) {
    var group = new THREE.Group();
    // Flat ellipsoid body
    var body = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 6),
      mat(color)
    );
    body.position.y = 0.18;
    body.scale.set(1.2, 0.5, 1.0);
    body.castShadow = true;
    group.add(body);
    // Left pincer (L-shape: two boxes)
    var pincerMat = mat(brighten(color, 1.2));
    var lp1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.06), pincerMat);
    lp1.position.set(0.32, 0.18, 0.15);
    group.add(lp1);
    var lp2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.1), pincerMat);
    lp2.position.set(0.42, 0.18, 0.1);
    group.add(lp2);
    // Right pincer
    var rp1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.06), pincerMat);
    rp1.position.set(0.32, 0.18, -0.15);
    group.add(rp1);
    var rp2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.1), pincerMat);
    rp2.position.set(0.42, 0.18, -0.1);
    group.add(rp2);
    // Curved tail (arc of small spheres going up and forward)
    var tailMat = mat(color);
    for (var ti = 0; ti < 5; ti++) {
      var angle = (ti / 5) * Math.PI * 0.7;
      var tr = 0.25;
      var ts = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), tailMat);
      ts.position.set(-0.15 - Math.cos(angle) * tr, 0.15 + Math.sin(angle) * tr, 0);
      group.add(ts);
    }
    // Stinger at end of tail
    var stinger = new THREE.Mesh(
      new THREE.ConeGeometry(0.03, 0.1, 4),
      mat(0xff5722)
    );
    stinger.position.set(-0.22, 0.55, 0);
    group.add(stinger);
    // 4 small legs on sides
    var legMat = mat(brighten(color, 0.8));
    var legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 4);
    var legPositions = [
      [0.1, 0.06, 0.22], [0.1, 0.06, -0.22],
      [-0.1, 0.06, 0.22], [-0.1, 0.06, -0.22]
    ];
    for (var li = 0; li < legPositions.length; li++) {
      var leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(legPositions[li][0], legPositions[li][1], legPositions[li][2]);
      group.add(leg);
    }
    return group;
  }

  // Nigiri: triangle onigiri shape + nori band + eyes
  function nigiriShape(color) {
    var group = new THREE.Group();
    // Triangle body (ConeGeometry with 3 sides for iconic onigiri)
    var body = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.65, 3),
      mat(color)
    );
    body.position.y = 0.32;
    body.castShadow = true;
    group.add(body);
    // Black nori band around middle
    var nori = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.15, 0.08),
      mat(0x1b5e20)
    );
    nori.position.set(0, 0.2, 0.2);
    group.add(nori);
    // Two small dot eyes
    var eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), mat(0x111111));
    eye1.position.set(0.08, 0.38, 0.28);
    group.add(eye1);
    var eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), mat(0x111111));
    eye2.position.set(-0.08, 0.38, 0.28);
    group.add(eye2);
    return group;
  }

  // Mage: cone robe + skull face + staff with glowing orb
  function mageShape(color) {
    var group = new THREE.Group();
    // Cone body (shorter than reaper)
    var robe = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.8, 8),
      mat(color)
    );
    robe.position.y = 0.4;
    robe.castShadow = true;
    group.add(robe);
    // Skull face (white sphere)
    var skull = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      mat(0xeeeeee)
    );
    skull.position.y = 0.95;
    group.add(skull);
    // Dark eye sockets (small dark spheres inset)
    var socketMat = mat(0x111111);
    var socket1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), socketMat);
    socket1.position.set(0.05, 0.97, 0.12);
    group.add(socket1);
    var socket2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), socketMat);
    socket2.position.set(-0.05, 0.97, 0.12);
    group.add(socket2);
    // Hat (cone)
    var hat = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.35, 6),
      mat(brighten(color, 0.7))
    );
    hat.position.y = 1.25;
    group.add(hat);
    // Staff in hand
    var staff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.9, 4),
      mat(0x795548)
    );
    staff.position.set(0.3, 0.5, 0);
    group.add(staff);
    // Staff orb (glowing)
    var orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      mat(0x7c4dff, { emissive: 0x3a0088 })
    );
    orb.position.set(0.3, 1.0, 0);
    group.add(orb);
    return group;
  }

  // Bull: wide muscular box + horns + thick legs + red eyes
  function bullShape(color) {
    var group = new THREE.Group();
    // Wide muscular box body
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.65, 0.5),
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
    // Two horns pointing upward and outward
    var hornMat = mat(0xe0e0e0);
    var horn1 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.28, 4), hornMat);
    horn1.position.set(0.3, 1.22, 0.18);
    horn1.rotation.z = -0.4;
    horn1.rotation.x = -0.3;
    group.add(horn1);
    var horn2 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.28, 4), hornMat);
    horn2.position.set(0.3, 1.22, -0.18);
    horn2.rotation.z = -0.4;
    horn2.rotation.x = 0.3;
    group.add(horn2);
    // Red eyes (emissive)
    var eyeMat = mat(0xff0000, { emissive: 0xff0000 });
    var eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 4, 4), eyeMat);
    eye1.position.set(0.38, 0.98, 0.1);
    group.add(eye1);
    var eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 4, 4), eyeMat);
    eye2.position.set(0.38, 0.98, -0.1);
    group.add(eye2);
    // 4 thick legs
    var legMat = mat(brighten(color, 0.8));
    var legGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.3, 6);
    var legs = [[0.18, 0.15, 0.18], [0.18, 0.15, -0.18], [-0.18, 0.15, 0.18], [-0.18, 0.15, -0.18]];
    for (var i = 0; i < legs.length; i++) {
      var leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(legs[i][0], legs[i][1], legs[i][2]);
      group.add(leg);
    }
    // Axe
    var axeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 4), mat(0x5d4037));
    axeHandle.position.set(-0.35, 0.7, 0);
    group.add(axeHandle);
    return group;
  }

  // Thief (トド系): seal/walrus body + flippers + whiskers + bag
  function thiefShape(color) {
    var group = new THREE.Group();
    // Round/oval body (seal shape)
    var body = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      mat(color)
    );
    body.position.y = 0.35;
    body.scale.set(1.1, 0.75, 0.9);
    body.castShadow = true;
    group.add(body);
    // Head area (slightly lighter)
    var headBump = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 6, 6),
      mat(brighten(color, 1.15))
    );
    headBump.position.set(0.25, 0.42, 0);
    group.add(headBump);
    // Small flippers on sides (flat ellipsoids)
    var flipperMat = mat(brighten(color, 0.85));
    var flipper1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), flipperMat);
    flipper1.position.set(0.05, 0.2, 0.32);
    flipper1.scale.set(1.5, 0.3, 1);
    group.add(flipper1);
    var flipper2 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), flipperMat);
    flipper2.position.set(0.05, 0.2, -0.32);
    flipper2.scale.set(1.5, 0.3, 1);
    group.add(flipper2);
    // Whiskers (thin cylinders near face)
    var whiskerMat = mat(0x333333);
    var wGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 3);
    var w1 = new THREE.Mesh(wGeo, whiskerMat);
    w1.position.set(0.35, 0.4, 0.08);
    w1.rotation.z = -Math.PI / 2;
    w1.rotation.y = 0.3;
    group.add(w1);
    var w2 = new THREE.Mesh(wGeo, whiskerMat);
    w2.position.set(0.35, 0.4, -0.08);
    w2.rotation.z = -Math.PI / 2;
    w2.rotation.y = -0.3;
    group.add(w2);
    // Eyes
    var eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), mat(0x111111));
    eye1.position.set(0.33, 0.47, 0.08);
    group.add(eye1);
    var eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), mat(0x111111));
    eye2.position.set(0.33, 0.47, -0.08);
    group.add(eye2);
    // Carrying a bag on back
    var bag = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      mat(0x795548)
    );
    bag.position.set(-0.2, 0.45, 0);
    group.add(bag);
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

  // Slime: organic blob with dripping effect, semi-transparent
  function slimeShape(color) {
    var group = new THREE.Group();
    var slimeMat = mat(color, { transparent: true, opacity: 0.8 });
    // Main body: multiple overlapping spheres
    var mainBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 8, 8),
      slimeMat
    );
    mainBody.position.y = 0.25;
    mainBody.scale.set(1.15, 0.7, 1.15);
    mainBody.castShadow = true;
    group.add(mainBody);
    // Secondary blob
    var blob2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 6, 6),
      slimeMat
    );
    blob2.position.set(0.12, 0.3, 0.08);
    group.add(blob2);
    // Third blob
    var blob3 = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 6, 6),
      slimeMat
    );
    blob3.position.set(-0.1, 0.28, -0.06);
    group.add(blob3);
    // Dripping effect: small spheres below main body
    var dripMat = mat(color, { transparent: true, opacity: 0.6 });
    var drip1 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), dripMat);
    drip1.position.set(0.15, 0.08, 0.1);
    group.add(drip1);
    var drip2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), dripMat);
    drip2.position.set(-0.1, 0.05, -0.08);
    group.add(drip2);
    var drip3 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 4, 4), dripMat);
    drip3.position.set(0.05, 0.03, 0.12);
    group.add(drip3);
    // Mark for jiggle animation
    group.userData._isSlime = true;
    return group;
  }

  // Polygon: icosahedron with wireframe overlay, slow rotation
  function polygonShape(color) {
    var group = new THREE.Group();
    var icoGeo = new THREE.IcosahedronGeometry(0.35);
    var body = new THREE.Mesh(icoGeo, mat(color));
    body.position.y = 0.4;
    body.castShadow = true;
    group.add(body);
    // Wireframe overlay (EdgesGeometry + LineSegments)
    var edges = new THREE.EdgesGeometry(icoGeo);
    var lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    var wireframe = new THREE.LineSegments(edges, lineMat);
    wireframe.position.y = 0.4;
    group.add(wireframe);
    // Mark for slow multi-axis rotation
    group.userData._isPolygon = true;
    return group;
  }

  // Mazerun: pot/jar with opening, eyes, and steam marker
  function mazerunShape(color) {
    var group = new THREE.Group();
    // Profile for lathe: rounded pot shape
    var points = [];
    points.push(new THREE.Vector2(0.08, 0));
    points.push(new THREE.Vector2(0.15, 0.05));
    points.push(new THREE.Vector2(0.25, 0.15));
    points.push(new THREE.Vector2(0.3, 0.3));
    points.push(new THREE.Vector2(0.28, 0.42));
    points.push(new THREE.Vector2(0.22, 0.48));
    points.push(new THREE.Vector2(0.27, 0.52));
    points.push(new THREE.Vector2(0.28, 0.55));
    var latheGeo = new THREE.LatheGeometry(points, 12);
    var body = new THREE.Mesh(latheGeo, mat(color));
    body.position.y = 0.05;
    body.castShadow = true;
    group.add(body);
    // Decorative band around belly
    var band = new THREE.Mesh(
      new THREE.TorusGeometry(0.29, 0.02, 6, 12),
      mat(brighten(color, 1.3))
    );
    band.position.y = 0.35;
    band.rotation.x = Math.PI / 2;
    group.add(band);
    // Visible dark opening at top
    var openingGeo = new THREE.CircleGeometry(0.2, 12);
    openingGeo.rotateX(-Math.PI / 2);
    var opening = new THREE.Mesh(openingGeo, mat(0x111111));
    opening.position.y = 0.6;
    group.add(opening);
    // Eyes on the pot body
    var eyeWhite1 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat(0xffffff));
    eyeWhite1.position.set(0.1, 0.35, 0.26);
    group.add(eyeWhite1);
    var eyeWhite2 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat(0xffffff));
    eyeWhite2.position.set(-0.1, 0.35, 0.26);
    group.add(eyeWhite2);
    var pupil1 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), mat(0x111111));
    pupil1.position.set(0.1, 0.35, 0.3);
    group.add(pupil1);
    var pupil2 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), mat(0x111111));
    pupil2.position.set(-0.1, 0.35, 0.3);
    group.add(pupil2);
    // Steam particles marker (small gray spheres above opening, animated in render loop)
    group.userData._isMazerun = true;
    var steamMat = mat(0xcccccc, { transparent: true, opacity: 0.4 });
    for (var si = 0; si < 3; si++) {
      var steam = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), steamMat);
      steam.position.set((si - 1) * 0.06, 0.65 + si * 0.08, 0);
      steam.userData._steamIndex = si;
      group.add(steam);
    }
    return group;
  }

  // Cart: tank hull + wheels + turret
  function cartShape(color) {
    var group = new THREE.Group();
    // Box body (tank hull)
    var hull = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.3, 0.38),
      mat(color)
    );
    hull.position.y = 0.3;
    hull.castShadow = true;
    group.add(hull);
    // Caterpillar tracks (dark boxes on sides)
    var trackMat = mat(0x333333);
    var track1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.06), trackMat);
    track1.position.set(0, 0.2, 0.22);
    group.add(track1);
    var track2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.06), trackMat);
    track2.position.set(0, 0.2, -0.22);
    group.add(track2);
    // Cylinder wheels on sides (2 per side)
    var wheelMat = mat(0x424242);
    var wGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.07, 8);
    var wheelPositions = [
      [0.18, 0.14, 0.22], [-0.18, 0.14, 0.22],
      [0.18, 0.14, -0.22], [-0.18, 0.14, -0.22]
    ];
    for (var wi = 0; wi < wheelPositions.length; wi++) {
      var w = new THREE.Mesh(wGeo, wheelMat);
      w.position.set(wheelPositions[wi][0], wheelPositions[wi][1], wheelPositions[wi][2]);
      w.rotation.x = Math.PI / 2;
      group.add(w);
    }
    // Turret: cylinder on top pointing forward
    var turretBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.1, 8),
      mat(brighten(color, 1.1))
    );
    turretBase.position.set(0, 0.5, 0);
    group.add(turretBase);
    // Cannon barrel
    var cannon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.32, 6),
      mat(0x616161)
    );
    cannon.position.set(0.2, 0.5, 0);
    cannon.rotation.z = -Math.PI / 2;
    group.add(cannon);
    return group;
  }

  // Ghost warrior (武者系): humanoid upper body + samurai helmet + sword, semi-transparent
  function ghostShape(color) {
    var group = new THREE.Group();
    var ghostMat = mat(color, { transparent: true, opacity: 0.6 });
    var ghostMatLight = mat(brighten(color, 1.3), { transparent: true, opacity: 0.7 });
    // Body (tapers to nothing below — cone)
    var body = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.7, 8),
      ghostMat
    );
    body.position.y = 0.55;
    group.add(body);
    // Torso box (upper body)
    var torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.3, 0.25),
      ghostMat
    );
    torso.position.y = 0.85;
    group.add(torso);
    // Head
    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8),
      ghostMatLight
    );
    head.position.y = 1.15;
    group.add(head);
    // Samurai helmet: cone with side flaps
    var helmetMat = mat(0x444444, { transparent: true, opacity: 0.7 });
    var helmetCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.2, 6),
      helmetMat
    );
    helmetCone.position.y = 1.35;
    group.add(helmetCone);
    // Side flaps (two small flat boxes)
    var flap1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 0.12), helmetMat);
    flap1.position.set(0.15, 1.18, 0);
    group.add(flap1);
    var flap2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 0.12), helmetMat);
    flap2.position.set(-0.15, 1.18, 0);
    group.add(flap2);
    // Sword in hand
    var swordMat = mat(0xcccccc, { transparent: true, opacity: 0.8 });
    var sword = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.5, 0.05),
      swordMat
    );
    sword.position.set(0.3, 0.75, 0);
    sword.rotation.z = -0.3;
    group.add(sword);
    return group;
  }

  // Radish (大根系): round white body + green leaves + angry eyes + stubby feet
  function radishShape(color) {
    var group = new THREE.Group();
    // Round white body
    var body = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      mat(color)
    );
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);
    // Green leaves on top (3-4 small cones pointing up)
    var leafMat = mat(0x4caf50);
    for (var li = 0; li < 4; li++) {
      var angle = (li / 4) * Math.PI * 2;
      var leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.2, 4),
        leafMat
      );
      leaf.position.set(Math.cos(angle) * 0.06, 0.7 + li * 0.02, Math.sin(angle) * 0.06);
      leaf.rotation.z = Math.cos(angle) * 0.2;
      leaf.rotation.x = Math.sin(angle) * 0.2;
      group.add(leaf);
    }
    // Angry eyes (angled dark shapes)
    var eyeMat = mat(0x111111);
    var eyeGeo = new THREE.BoxGeometry(0.08, 0.03, 0.02);
    var eye1 = new THREE.Mesh(eyeGeo, eyeMat);
    eye1.position.set(0.1, 0.42, 0.27);
    eye1.rotation.z = 0.3; // angled for angry look
    group.add(eye1);
    var eye2 = new THREE.Mesh(eyeGeo, eyeMat);
    eye2.position.set(-0.1, 0.42, 0.27);
    eye2.rotation.z = -0.3;
    group.add(eye2);
    // Stubby feet (two small cylinders)
    var footMat = mat(brighten(color, 0.9));
    var foot1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 6), footMat);
    foot1.position.set(0.1, 0.05, 0);
    group.add(foot1);
    var foot2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 6), footMat);
    foot2.position.set(-0.1, 0.05, 0);
    group.add(foot2);
    return group;
  }

  // Toad (ガマラ系): wide flat body + big protruding eyes + wide mouth + crouching legs
  function toadShape(color) {
    var group = new THREE.Group();
    // Wide, flat body
    var body = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      mat(color)
    );
    body.position.y = 0.22;
    body.scale.set(1.3, 0.6, 1.0);
    body.castShadow = true;
    group.add(body);
    // Big eyes protruding upward
    var eyeMat = mat(0xffeb3b);
    var eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), eyeMat);
    eye1.position.set(0.14, 0.4, 0.12);
    group.add(eye1);
    var eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), eyeMat);
    eye2.position.set(0.14, 0.4, -0.12);
    group.add(eye2);
    // Pupils
    var pupilMat = mat(0x111111);
    var p1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), pupilMat);
    p1.position.set(0.18, 0.42, 0.12);
    group.add(p1);
    var p2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), pupilMat);
    p2.position.set(0.18, 0.42, -0.12);
    group.add(p2);
    // Wide mouth (flat box)
    var mouthMat = mat(brighten(color, 0.6));
    var mouth = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.25), mouthMat);
    mouth.position.set(0.28, 0.15, 0);
    group.add(mouth);
    // Four legs in crouching position
    var legMat = mat(brighten(color, 0.85));
    // Front legs
    var fl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 4), legMat);
    fl1.position.set(0.2, 0.08, 0.25);
    fl1.rotation.z = 0.3;
    group.add(fl1);
    var fl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 4), legMat);
    fl2.position.set(0.2, 0.08, -0.25);
    fl2.rotation.z = 0.3;
    group.add(fl2);
    // Back legs (bent outward)
    var bl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.18, 4), legMat);
    bl1.position.set(-0.15, 0.08, 0.3);
    bl1.rotation.z = -0.2;
    bl1.rotation.x = -0.3;
    group.add(bl1);
    var bl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.18, 4), legMat);
    bl2.position.set(-0.15, 0.08, -0.3);
    bl2.rotation.z = -0.2;
    bl2.rotation.x = 0.3;
    group.add(bl2);
    return group;
  }

  // === Item Models (enlarged, floating, with glow rings) ===

  var ITEM_FLOAT_Y = 0.15;  // Items float above ground

  function createItemModel(type) {
    var group = new THREE.Group();

    switch (type) {
      case 'weapon': {
        // Sword — 1.5x scale
        var blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.09, 0.45, 0.09),
          mat(0xbdbdbd)
        );
        blade.position.y = ITEM_FLOAT_Y + 0.25;
        group.add(blade);
        var hilt = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.06, 0.06),
          mat(0x795548)
        );
        hilt.position.y = ITEM_FLOAT_Y + 0.03;
        group.add(hilt);
        // Silver glow ring
        group.add(createItemGlowRing(0xc0c0c0));
        break;
      }
      case 'shield': {
        // Shield — 1.5x scale
        var sh = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.38, 0.06),
          mat(0x795548)
        );
        sh.position.y = ITEM_FLOAT_Y + 0.2;
        sh.rotation.y = 0.3;
        group.add(sh);
        // Brown glow ring
        group.add(createItemGlowRing(0x8b4513));
        break;
      }
      case 'scroll': {
        // Scroll — 1.5x scale, white/cream colored
        var sc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, 0.3, 8),
          mat(0xfffde7)
        );
        sc.position.y = ITEM_FLOAT_Y + 0.1;
        sc.rotation.z = Math.PI / 2;
        group.add(sc);
        // End caps
        var capMat = mat(0xffe0b2);
        var cap1 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 8), capMat);
        cap1.position.set(0.15, ITEM_FLOAT_Y + 0.1, 0);
        cap1.rotation.z = Math.PI / 2;
        group.add(cap1);
        var cap2 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 8), capMat);
        cap2.position.set(-0.15, ITEM_FLOAT_Y + 0.1, 0);
        cap2.rotation.z = Math.PI / 2;
        group.add(cap2);
        // Blue glow ring
        group.add(createItemGlowRing(0x4488ff));
        break;
      }
      case 'grass': {
        // Potion/grass — 1.8x scale
        var gr = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 6, 6),
          mat(0x4caf50)
        );
        gr.position.y = ITEM_FLOAT_Y + 0.18;
        group.add(gr);
        // Leaf on top
        var leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.05, 0.12, 4),
          mat(0x2e7d32)
        );
        leaf.position.y = ITEM_FLOAT_Y + 0.35;
        leaf.rotation.z = 0.3;
        group.add(leaf);
        // Green glow ring
        group.add(createItemGlowRing(0x44cc44));
        break;
      }
      case 'food': {
        // Onigiri — 1.8x scale, triangular shape
        var fd = new THREE.Mesh(
          new THREE.ConeGeometry(0.2, 0.3, 3),
          mat(0xfffde7)
        );
        fd.position.y = ITEM_FLOAT_Y + 0.18;
        group.add(fd);
        // Nori band
        var nori = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.08, 0.04),
          mat(0x1b5e20)
        );
        nori.position.set(0, ITEM_FLOAT_Y + 0.1, 0.12);
        group.add(nori);
        // Yellow glow ring
        group.add(createItemGlowRing(0xffcc00));
        break;
      }
      case 'staff': {
        // Staff — 1.5x scale, taller
        var st = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.6, 4),
          mat(0x8d6e63)
        );
        st.position.y = ITEM_FLOAT_Y + 0.3;
        group.add(st);
        // Orb at top
        var orb = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 6, 6),
          mat(0x9c27b0, { emissive: 0x4a0066 })
        );
        orb.position.y = ITEM_FLOAT_Y + 0.63;
        group.add(orb);
        // Purple glow ring
        group.add(createItemGlowRing(0x9933cc));
        break;
      }
      case 'pot': {
        // Pot — 1.5x scale
        var po = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.15, 0.3, 8),
          mat(0x8d6e63)
        );
        po.position.y = ITEM_FLOAT_Y + 0.15;
        group.add(po);
        // Rim
        var rim = new THREE.Mesh(
          new THREE.TorusGeometry(0.17, 0.02, 6, 12),
          mat(0xa1887f)
        );
        rim.position.y = ITEM_FLOAT_Y + 0.3;
        rim.rotation.x = Math.PI / 2;
        group.add(rim);
        // Gray glow ring
        group.add(createItemGlowRing(0x888888));
        break;
      }
      case 'bracelet': {
        // Bracelet — keep similar, slight scale up
        var br = new THREE.Mesh(
          new THREE.TorusGeometry(0.14, 0.04, 6, 12),
          mat(0xffd700)
        );
        br.position.y = ITEM_FLOAT_Y + 0.12;
        br.rotation.x = Math.PI / 2;
        group.add(br);
        // Gold glow ring
        group.add(createItemGlowRing(0xffd700));
        break;
      }
      case 'arrow': {
        // Arrow — 1.5x scale
        var ar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 0.45, 4),
          mat(0x8d6e63)
        );
        ar.position.y = ITEM_FLOAT_Y + 0.05;
        ar.rotation.z = Math.PI / 4;
        group.add(ar);
        var tip = new THREE.Mesh(
          new THREE.ConeGeometry(0.06, 0.12, 4),
          mat(0x9e9e9e)
        );
        tip.position.set(0.18, ITEM_FLOAT_Y + 0.23, 0);
        tip.rotation.z = Math.PI / 4;
        group.add(tip);
        // Fletching
        var fletch = new THREE.Mesh(
          new THREE.BoxGeometry(0.01, 0.08, 0.06),
          mat(0xcc4444, { side: THREE.DoubleSide })
        );
        fletch.position.set(-0.14, ITEM_FLOAT_Y - 0.09, 0);
        fletch.rotation.z = Math.PI / 4;
        group.add(fletch);
        // Silver glow ring
        group.add(createItemGlowRing(0xc0c0c0));
        break;
      }
      default: {
        // Gold coin — 2x scale, very visible
        var coin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16),
          mat(0xffd700, { emissive: 0x886600 })
        );
        coin.position.y = ITEM_FLOAT_Y + 0.05;
        group.add(coin);
        // Dollar sign engraving (small box cross)
        var engrave = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.12, 0.06),
          mat(0xffab00)
        );
        engrave.position.y = ITEM_FLOAT_Y + 0.06;
        group.add(engrave);
        // Gold glow ring
        group.add(createItemGlowRing(0xffd700));
        break;
      }
    }

    return group;
  }

  // === Stairs Model (Issue 6: much more visible) ===
  function createStairs() {
    var group = new THREE.Group();

    // Larger cone pointing down
    var cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.45, 6),
      mat(0xffd700, { emissive: 0x886600 })
    );
    cone.position.y = 0.25;
    cone.rotation.x = Math.PI; // point down
    group.add(cone);

    // Outer glow ring (larger)
    var ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.04, 8, 16),
      mat(0xffeb3b, { emissive: 0x886600 })
    );
    ring.position.y = 0.02;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    // Inner ring
    var ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.03, 6, 12),
      mat(0xffd700, { emissive: 0x665500 })
    );
    ring2.position.y = 0.04;
    ring2.rotation.x = Math.PI / 2;
    group.add(ring2);

    // Spiral decoration around the stairs
    var spiralMat = mat(0xffd700, { emissive: 0x665500 });
    for (var si = 0; si < 8; si++) {
      var spiralAngle = (si / 8) * Math.PI * 2;
      var spiralR = 0.32;
      var spiralDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 4, 4),
        spiralMat
      );
      spiralDot.position.set(
        Math.cos(spiralAngle) * spiralR,
        0.05 + si * 0.03,
        Math.sin(spiralAngle) * spiralR
      );
      group.add(spiralDot);
    }

    // Pillar of light (tall translucent cylinder)
    var pillarMat = new THREE.MeshBasicMaterial({
      color: 0xffd700, transparent: true, opacity: 0.12
    });
    var pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.35, 4, 8),
      pillarMat
    );
    pillar.position.y = 2.0;
    group.add(pillar);

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
