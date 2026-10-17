/* Zungga Story Studio — Indian home props (real sizes). Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box, logoTex, mascotTex, decal, label, cyl, sphere } = ZA;

  /* ---------- small local helpers ---------- */
  const V3 = (x, y, z) => new T.Vector3(x, y, z);
  const asMat = (c) => (typeof c === 'number' ? mat(c) : c);
  function tube(pts, r, c, parent, closed = false, seg = 48, rad = 8) {
    const curve = new T.CatmullRomCurve3(pts.map((p) => V3(...p)), closed);
    return mesh(new T.TubeGeometry(curve, seg, r, rad, closed), asMat(c), parent);
  }
  function lathe(prof, c, parent, x = 0, y = 0, z = 0, seg = 32) {
    const m = asMat(c); m.side = T.DoubleSide;
    return mesh(new T.LatheGeometry(prof.map(([r, h]) => new T.Vector2(r, h)), seg), m, parent, x, y, z);
  }
  function rod(a, b, r, c, parent, seg = 12) {   // cylinder from point a to point b
    const A = V3(...a), B = V3(...b), d = B.clone().sub(A), m = cyl(r, r, d.length(), 0, parent, 0, 0, 0, seg);
    m.material = asMat(c); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); return m;
  }
  const steel = () => mat(0xdfe5ec, { metalness: 0.55, roughness: 0.25 });
  const withMap = (m, t, rx = 1, ry = 1) => { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); m.material = new T.MeshStandardMaterial({ map: t, roughness: 0.9 }); return m; };

  // a simple wooden chair, front faces +z, seat at 0.45 m
  function chair(parent, x, z, ry, cushion = Z.orange, wood = Z.woodDark) {
    const c = new T.Group(); c.position.set(x, 0, z); c.rotation.y = ry; parent.add(c);
    box(0.42, 0.035, 0.42, wood, c, 0, 0.43, 0, 0.01);
    box(0.38, 0.04, 0.38, cushion, c, 0, 0.465, 0.005, 0.018);
    for (const [lx, lz] of [[-0.18, 0.18], [0.18, 0.18]]) box(0.035, 0.43, 0.035, wood, c, lx, 0.215, lz, 0.008);
    for (const lx of [-0.18, 0.18]) box(0.035, 0.9, 0.035, wood, c, lx, 0.45, -0.18, 0.008);      // back legs run up into the backrest
    box(0.4, 0.1, 0.025, wood, c, 0, 0.83, -0.18, 0.01);
    box(0.36, 0.05, 0.02, wood, c, 0, 0.66, -0.18, 0.008);
    box(0.34, 0.025, 0.025, wood, c, 0, 0.14, 0.18, 0.006); box(0.34, 0.025, 0.025, wood, c, 0, 0.14, -0.18, 0.006);   // stretchers
    return c;
  }

  /* ---------- single bed ---------- */
  function bed() {
    const g = new T.Group(), W = 0.95, L = 1.95;
    box(W + 0.06, 0.2, L + 0.04, Z.wood, g, 0, 0.3, 0, 0.02);
    for (const x of [-1, 1]) for (const z of [-1, 1]) box(0.07, 0.22, 0.07, Z.woodDark, g, x * (W / 2 - 0.01), 0.11, z * (L / 2 - 0.01), 0.01);
    box(W, 0.14, L - 0.02, 0xf8fafc, g, 0, 0.47, 0.01, 0.05);                                                        // mattress
    const sheetT = tex((c, W2, H2) => {
      c.fillStyle = '#fdf2dc'; c.fillRect(0, 0, W2, H2);
      const flower = (x, y, col, r) => { c.fillStyle = col; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; c.beginPath(); c.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.75, r * 0.45, a, 0, 7); c.fill(); } c.fillStyle = '#f59e0b'; c.beginPath(); c.arc(x, y, r * 0.5, 0, 7); c.fill(); };
      for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) flower(k * 128 + (r % 2 ? 64 : 0) + 32, r * 128 + 64, r % 2 ? '#1d4ed8' : '#dc2626', 18);
      c.fillStyle = '#16a34a'; for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(k * 128 + (r % 2 ? 0 : 64) + 32, r * 128, 7, 0, 7); c.fill(); }
    }, 512, 512);
    withMap(box(W + 0.02, 0.09, L, 0, g, 0, 0.5, 0.01, 0.03), sheetT, 3, 3);                                         // block-print bedsheet
    const pillowT = tex((c, W2, H2) => { c.fillStyle = '#fbcfe8'; c.fillRect(0, 0, W2, H2); c.fillStyle = '#f9a8d4'; for (let x = 0; x < W2; x += 32) c.fillRect(x, 0, 14, H2); }, 256, 256);
    const pillow = withMap(box(0.62, 0.12, 0.36, 0, g, 0, 0.6, -L / 2 + 0.27, 0.055), pillowT, 4, 4); pillow.scale.y = 0.9;
    const blanketT = tex((c, W2, H2) => {
      c.fillStyle = '#7c3aed'; c.fillRect(0, 0, W2, H2);
      c.fillStyle = 'rgba(250,204,21,0.85)'; for (let i = 0; i < 4; i++) { c.fillRect(i * 64 + 20, 0, 10, H2); c.fillRect(0, i * 64 + 20, W2, 10); }
      c.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 4; i++) { c.fillRect(i * 64 + 44, 0, 4, H2); c.fillRect(0, i * 64 + 44, W2, 4); }
    }, 256, 256);
    withMap(box(W + 0.04, 0.08, 0.5, 0, g, 0, 0.585, L / 2 - 0.33, 0.035), blanketT, 3, 3);                         // folded blanket at the foot
    box(W + 0.12, 0.85, 0.06, Z.woodDark, g, 0, 0.6, -L / 2 - 0.02, 0.025);                                          // headboard
    box(W - 0.15, 0.4, 0.02, Z.wood, g, 0, 0.75, -L / 2 + 0.015, 0.015);
    box(W + 0.12, 0.38, 0.05, Z.woodDark, g, 0, 0.39, L / 2 + 0.03, 0.02);                                           // footboard
    return { group: g, phys: { shape: 'box', size: [W + 0.12, 0.6, L + 0.1], mass: 0, yOffset: 0.3 } };
  }

  /* ---------- study table + chair + lamp + books; setOn lights the lamp ---------- */
  function studyTable() {
    const g = new T.Group(), top = 0.75;
    box(1.0, 0.035, 0.55, Z.wood, g, 0, top - 0.0175, 0, 0.01);
    box(0.36, top - 0.035, 0.5, Z.woodDark, g, 0.3, (top - 0.035) / 2, 0, 0.01);                                     // drawer pedestal
    for (let i = 0; i < 3; i++) { box(0.32, 0.2, 0.02, Z.wood, g, 0.3, 0.13 + i * 0.22, 0.25, 0.008); box(0.08, 0.018, 0.02, 0xe2e8f0, g, 0.3, 0.17 + i * 0.22, 0.268, 0.006); }
    box(0.03, top - 0.035, 0.5, Z.woodDark, g, -0.475, (top - 0.035) / 2, 0, 0.008);
    box(0.62, 0.32, 0.02, Z.woodDark, g, -0.16, top - 0.2, -0.24, 0.006);                                            // modesty panel
    chair(g, -0.14, 0.42, Math.PI, Z.blue, Z.wood);
    // lamp
    const lamp = new T.Group(); lamp.position.set(-0.36, top, -0.13); g.add(lamp);
    const metal = mat(Z.purple, { roughness: 0.35, metalness: 0.2 });
    cyl(0.07, 0.075, 0.025, 0, lamp, 0, 0.0125, 0, 28).material = metal;
    rod([0, 0.02, 0], [0.04, 0.3, -0.03], 0.008, metal, lamp);
    sphere(0.014, Z.ink, lamp, 0.04, 0.3, -0.03, 12);
    rod([0.04, 0.3, -0.03], [0.17, 0.35, 0.06], 0.008, metal, lamp);
    const head = new T.Group(); head.position.set(0.17, 0.35, 0.06); head.rotation.set(0.25, 0, -0.35); lamp.add(head);
    sphere(0.016, Z.ink, head, 0, 0, 0, 12);
    mesh(new T.CylinderGeometry(0.025, 0.07, 0.09, 28, 1, true), new T.MeshStandardMaterial({ color: Z.purple, side: T.FrontSide, roughness: 0.35 }), head, 0, -0.05, 0);
    const inner = mesh(new T.CylinderGeometry(0.024, 0.069, 0.089, 28, 1, true), new T.MeshStandardMaterial({ color: 0xfff7e0, side: T.BackSide, emissive: 0xffe9a8, emissiveIntensity: 0 }), head, 0, -0.05, 0);
    const bulb = sphere(0.022, 0xfffbeb, head, 0, -0.07, 0, 16); bulb.material.emissive = new T.Color(0xffe08a); bulb.castShadow = false;
    const light = new T.PointLight(0xffe2a8, 0, 2.2, 2); light.position.set(0, -0.11, 0); head.add(light);
    // books + notebook + pen stand
    [[0xdc2626, 0.03], [0x16a34a, 0.035], [0x1d4ed8, 0.028]].reduce((y, [col, h], i) => { const b = box(0.2, h, 0.15, col, g, 0.3, y + h / 2, -0.13, 0.004); b.rotation.y = 0.12 - i * 0.1; box(0.19, h * 0.8, 0.005, 0xfff7e6, g, 0.3, y + h / 2, -0.13, 0.001).visible = false; return y + h; }, top);
    const pages = tex((c, W, H) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); c.strokeStyle = '#93c5fd'; c.lineWidth = 3; for (let y = 40; y < H; y += 26) { c.beginPath(); c.moveTo(10, y); c.lineTo(W - 10, y); c.stroke(); } c.fillStyle = '#ef4444'; c.fillRect(W / 2 - 2, 0, 4, H); c.fillStyle = '#334155'; c.font = `500 26px ${FONT}`; c.fillText('2 + 3 = 5', 30, 64); c.fillText('4 + 4 = 8', 30, 116); c.fillText('A for Apple', W / 2 + 26, 64); }, 512, 360);
    box(0.32, 0.008, 0.22, 0xf97316, g, -0.12, top + 0.004, 0.08, 0.003).rotation.y = 0.05;
    const nb = mesh(new T.PlaneGeometry(0.3, 0.21), new T.MeshStandardMaterial({ map: pages, roughness: 0.9 }), g, -0.12, top + 0.0085, 0.08); nb.rotation.set(-Math.PI / 2, 0, 0.05);
    const pencil = cyl(0.0035, 0.0035, 0.16, Z.yellow, g, -0.02, top + 0.012, 0.16, 8); pencil.rotation.set(0, 0, Math.PI / 2); pencil.rotation.y = 0.4;
    cyl(0.03, 0.03, 0.09, Z.pink, g, 0.12, top + 0.045, -0.17, 20);
    for (const [col, dx, dz, h] of [[0x16a34a, -0.01, 0.008, 0.15], [Z.blue, 0.012, -0.004, 0.14], [0xdc2626, -0.004, -0.012, 0.13]]) cyl(0.004, 0.004, h, col, g, 0.12 + dx, top + h / 2 + 0.01, -0.17 + dz, 8);
    g.userData.setOn = (on) => { bulb.material.emissiveIntensity = on ? 3 : 0; inner.material.emissiveIntensity = on ? 0.9 : 0; light.intensity = on ? 1.4 : 0; };
    g.userData.setOn(false);
    return { group: g, phys: { shape: 'box', size: [1.0, top, 0.55], mass: 0, yOffset: top / 2 } };
  }

  /* ---------- dining set: table, 4 chairs, steel jug + plates ---------- */
  function diningSet() {
    const g = new T.Group(), top = 0.75;
    box(1.2, 0.04, 0.8, Z.wood, g, 0, top - 0.02, 0, 0.012);
    box(1.08, 0.08, 0.68, Z.woodDark, g, 0, top - 0.08, 0, 0.008);
    for (const x of [-0.54, 0.54]) for (const z of [-0.34, 0.34]) box(0.06, top - 0.04, 0.06, Z.woodDark, g, x, (top - 0.04) / 2, z, 0.01);
    for (const x of [-0.3, 0.3]) { chair(g, x, 0.56, Math.PI, Z.orange); chair(g, x, -0.56, 0, Z.orange); }
    const st = steel();
    lathe([[0, 0], [0.055, 0], [0.062, 0.012], [0.064, 0.08], [0.052, 0.15], [0.044, 0.19], [0.05, 0.205], [0.046, 0.205], [0.04, 0.19]], st, g, 0, top, 0, 32);   // steel jug
    tube([[0.055, top + 0.17, 0], [0.11, top + 0.16, 0], [0.11, top + 0.06, 0], [0.06, top + 0.04, 0]], 0.006, st, g, false, 24, 6);
    const sp = mesh(new T.ConeGeometry(0.014, 0.05, 12, 1, true), st, g, -0.06, top + 0.19, 0); sp.rotation.z = Math.PI / 2 + 0.6;
    for (const x of [-0.3, 0.3]) for (const s of [-1, 1]) {
      lathe([[0, 0], [0.1, 0], [0.13, 0.016], [0.128, 0.018], [0.098, 0.004], [0, 0.004]], steel(), g, x, top, s * 0.24, 32);   // steel plates
      lathe([[0, 0], [0.028, 0], [0.034, 0.1], [0.031, 0.1], [0.026, 0.004], [0, 0.004]], steel(), g, x + 0.17, top, s * 0.2, 24);   // tumblers
    }
    return { group: g, phys: { shape: 'box', size: [1.2, top, 0.8], mass: 0, yOffset: top / 2 } };
  }

  /* ---------- TV on a low cabinet; screen shows a cartoon ---------- */
  function tvStand() {
    const g = new T.Group(), ch = 0.45;
    box(1.4, ch - 0.04, 0.4, Z.woodDark, g, 0, 0.04 + (ch - 0.04) / 2, 0, 0.015);
    for (const x of [-0.65, 0.65]) for (const z of [-0.16, 0.16]) cyl(0.02, 0.016, 0.04, Z.ink, g, x, 0.02, z, 12);
    for (const x of [-0.47, 0.47]) { box(0.42, 0.32, 0.02, Z.wood, g, x, 0.245, 0.2, 0.008); box(0.14, 0.016, 0.02, 0xe2e8f0, g, x, 0.36, 0.218, 0.006); }
    box(0.5, 0.32, 0.01, 0x3b2414, g, 0, 0.245, 0.196, 0.004);                                                         // open middle shelf (dark back)
    box(0.24, 0.05, 0.18, 0x111827, g, 0, 0.14, 0.09, 0.008);                                                        // set-top box
    const led = sphere(0.004, 0x22c55e, g, 0.09, 0.15, 0.181, 8); led.material.emissive = new T.Color(0x22c55e); led.material.emissiveIntensity = 1.2;
    const cartoon = tex((c, W, H) => {
      const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#60a5fa'); sky.addColorStop(1, '#bae6fd'); c.fillStyle = sky; c.fillRect(0, 0, W, H);
      ['#ef4444', '#fb923c', '#facc15', '#22c55e', '#38bdf8', '#7c3aed'].forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 22; c.beginPath(); c.arc(W * 0.62, H * 0.95, 420 - i * 22, Math.PI, 2 * Math.PI); c.stroke(); });
      c.fillStyle = '#fde047'; c.beginPath(); c.arc(W * 0.12, H * 0.18, 60, 0, 7); c.fill();
      c.strokeStyle = '#fde047'; c.lineWidth = 10; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; c.beginPath(); c.moveTo(W * 0.12 + Math.cos(a) * 75, H * 0.18 + Math.sin(a) * 75); c.lineTo(W * 0.12 + Math.cos(a) * 100, H * 0.18 + Math.sin(a) * 100); c.stroke(); }
      c.fillStyle = '#ffffff'; for (const [x, y, s] of [[0.35, 0.15, 1], [0.82, 0.12, 0.8]]) { for (const [dx, dy, r] of [[0, 0, 40], [45, -15, 50], [95, 0, 38]]) { c.beginPath(); c.arc(W * x + dx * s, H * y + dy * s, r * s, 0, 7); c.fill(); } }
      c.fillStyle = '#4ade80'; c.beginPath(); c.ellipse(W * 0.25, H * 1.05, W * 0.45, H * 0.35, 0, 0, 7); c.fill();
      c.fillStyle = '#22c55e'; c.beginPath(); c.ellipse(W * 0.85, H * 1.1, W * 0.45, H * 0.38, 0, 0, 7); c.fill();
      // house
      c.fillStyle = '#fef3c7'; c.fillRect(W * 0.78, H * 0.55, 140, 110); c.fillStyle = '#dc2626'; c.beginPath(); c.moveTo(W * 0.78 - 20, H * 0.55); c.lineTo(W * 0.78 + 70, H * 0.55 - 80); c.lineTo(W * 0.78 + 160, H * 0.55); c.fill(); c.fillStyle = '#8a5a33'; c.fillRect(W * 0.78 + 50, H * 0.55 + 45, 40, 65);
      // round purple hero, jumping with joy
      const hx = W * 0.42, hy = H * 0.58;
      c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(hx, H * 0.86, 80, 16, 0, 0, 7); c.fill();
      c.strokeStyle = '#6d28d9'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(hx - 80, hy); c.lineTo(hx - 140, hy - 70); c.moveTo(hx + 80, hy); c.lineTo(hx + 140, hy - 70); c.stroke();
      c.fillStyle = '#7c3aed'; c.beginPath(); c.arc(hx, hy, 105, 0, 7); c.fill();
      c.fillStyle = '#fff'; for (const dx of [-36, 36]) { c.beginPath(); c.ellipse(hx + dx, hy - 25, 26, 32, 0, 0, 7); c.fill(); }
      c.fillStyle = '#1f1a33'; for (const dx of [-30, 40]) { c.beginPath(); c.arc(hx + dx, hy - 20, 13, 0, 7); c.fill(); }
      c.fillStyle = '#f9a8d4'; for (const dx of [-62, 62]) { c.beginPath(); c.arc(hx + dx, hy + 22, 14, 0, 7); c.fill(); }
      c.fillStyle = '#be123c'; c.beginPath(); c.arc(hx, hy + 22, 34, 0, Math.PI); c.fill();
      c.fillStyle = '#facc15'; for (const [x, y] of [[0.3, 0.42], [0.55, 0.38], [0.6, 0.55]]) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 9 : 22; c.lineTo(W * x + Math.cos(a) * r, H * y + Math.sin(a) * r); } c.fill(); }
      c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = `700 30px ${FONT}`; c.textAlign = 'right'; c.fillText('ZUNGGA TV', W - 24, 44);
    }, 1024, 576);
    const tv = new T.Group(); tv.position.y = ch; g.add(tv);
    for (const x of [-0.36, 0.36]) { box(0.04, 0.06, 0.16, 0x111827, tv, x, 0.03, 0.02, 0.008); }
    box(0.97, 0.565, 0.05, 0x111827, tv, 0, 0.06 + 0.2825, 0, 0.012);
    const screen = mesh(new T.PlaneGeometry(0.94, 0.53), new T.MeshStandardMaterial({ map: cartoon, emissive: 0xffffff, emissiveMap: cartoon, emissiveIntensity: 0.65, roughness: 0.3 }), tv, 0, 0.3425, 0.0255);
    screen.castShadow = false;
    const remote = box(0.045, 0.018, 0.16, 0x1f2937, g, 0.5, ch + 0.009, 0.08, 0.008); remote.rotation.y = 0.4;
    sphere(0.006, 0xef4444, g, 0.52, ch + 0.019, 0.13, 8);
    return { group: g, phys: { shape: 'box', size: [1.4, ch, 0.4], mass: 0, yOffset: ch / 2 } };
  }

  /* ---------- steel almirah (2-door wardrobe); setOn opens the doors ---------- */
  function wardrobe() {
    const g = new T.Group(), W = 0.9, H = 1.8, D = 0.5, t = 0.02;
    const shell = mat(0x9fb8c8, { metalness: 0.3, roughness: 0.45 }), inside = mat(0xdbe4ea, { roughness: 0.7 });
    const P = (w, h, d, m, x, y, z) => { const o = mesh(roundBox(w, h, d, 0.006), m, g, x, y, z); return o; };
    P(W, H - 0.08, t, shell, 0, 0.08 + (H - 0.08) / 2, -D / 2 + t / 2);
    for (const s of [-1, 1]) P(t, H - 0.08, D, shell, s * (W / 2 - t / 2), 0.08 + (H - 0.08) / 2, 0);
    P(W + 0.02, 0.035, D + 0.02, shell, 0, H - 0.0175, 0);
    P(W, 0.08, D - 0.02, mat(0x5b6b78, { metalness: 0.3, roughness: 0.5 }), 0, 0.04, -0.01);                         // plinth
    P(W - 2 * t, t, D - t, inside, 0, 0.09, 0);
    mesh(new T.PlaneGeometry(W - 2 * t, H - 0.13), inside, g, 0, 0.1 + (H - 0.13) / 2, -D / 2 + t + 0.001);
    P(t, H - 0.13, D - t, inside, 0, 0.1 + (H - 0.13) / 2, 0);                                                       // centre divider
    // right half: shelves with folded clothes
    let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const cloth = [0xef4444, 0xfacc15, 0x38bdf8, 0x22c55e, 0xec4899, 0x7c3aed, 0xfb923c, 0xf8fafc, 0x1d4ed8];
    for (const y of [0.1, 0.55, 1.0, 1.4]) {
      if (y > 0.1) P(W / 2 - 1.5 * t, t, D - t - 0.02, inside, W / 4, y, 0);
      let yy = y + t / 2;
      for (let k = 0; k < 4; k++) { const h = 0.045; box(0.3, h, 0.3, cloth[Math.floor(rnd() * cloth.length)], g, W / 4 + (rnd() - 0.5) * 0.02, yy + h / 2 + 0.002, 0.01 + (rnd() - 0.5) * 0.02, 0.015); yy += h; }
    }
    // left half: hanging rod with shirts + a saree-coloured kurta
    rod([-W / 2 + t, 1.55, 0], [-t, 1.55, 0], 0.01, mat(0xe2e8f0, { metalness: 0.6, roughness: 0.3 }), g);
    for (let i = 0; i < 6; i++) {
      const x = -W / 2 + 0.07 + i * 0.065, col = cloth[(i * 4 + 1) % cloth.length];
      mesh(new T.TorusGeometry(0.012, 0.002, 6, 12, Math.PI * 1.3), mat(0x64748b), g, x, 1.56, 0).rotation.y = Math.PI / 2;
      const shirt = box(0.03, 0.62 + (i % 3) * 0.12, 0.38, col, g, x, 1.53 - (0.62 + (i % 3) * 0.12) / 2, 0, 0.012); shirt.rotation.y = 0.06 * (i % 2 ? 1 : -1);
      box(0.034, 0.03, 0.4, col, g, x, 1.52, 0, 0.012);
    }
    // doors (hinged at the outer edges)
    const doors = [];
    for (const side of [-1, 1]) {
      const piv = new T.Group(); piv.position.set(side * W / 2, 0, D / 2 + 0.011); g.add(piv); doors.push(piv);
      const dx = -side * W / 4, dy = 0.08 + (H - 0.13) / 2 + 0.005, dh = H - 0.12;
      mesh(roundBox(W / 2 - 0.006, dh, 0.022, 0.006), shell, piv, dx, dy, 0);
      mesh(roundBox(W / 2 - 0.1, 0.62, 0.012, 0.01), shell, piv, dx, 0.5, 0.012);                                    // pressed panels
      if (side > 0) {
        mesh(new T.PlaneGeometry(W / 2 - 0.11, 0.7), new T.MeshStandardMaterial({ color: 0xdbeafe, metalness: 0.6, roughness: 0.08 }), piv, dx, 1.25, 0.0125);   // mirror
        box(W / 2 - 0.09, 0.73, 0.008, 0x7c8b96, piv, dx, 1.25, 0.008, 0.003);
        box(0.03, 0.05, 0.012, 0xcbd5e1, piv, -W / 2 + 0.035, 0.95, 0.016, 0.004);                                  // lock plate
        cyl(0.005, 0.005, 0.004, Z.ink, piv, -W / 2 + 0.035, 0.95, 0.024, 10).rotation.x = Math.PI / 2;
      } else {
        mesh(roundBox(W / 2 - 0.1, 0.7, 0.012, 0.01), shell, piv, dx, 1.25, 0.012);
        box(0.022, 0.24, 0.03, 0xe2e8f0, piv, W / 2 - 0.04, 0.95, 0.024, 0.008).material = mat(0xe2e8f0, { metalness: 0.7, roughness: 0.25 });   // handle
      }
      mesh(roundBox(W / 2 - 0.006, dh, 0.004, 0.002), inside, piv, dx, dy, -0.012);                                  // inner face
    }
    decal(label('ZUNGGA', { w: 512, h: 128, bg: 'rgba(0,0,0,0)', fg: '#ffffff', size: 90 }), 0.16, 0.04, g, 0, H - 0.1, D / 2 + 0.03).visible = false;
    g.userData.setOn = (on) => { doors[0].rotation.y = on ? -1.85 : 0; doors[1].rotation.y = on ? 1.85 : 0; };
    g.userData.setOn(false);
    return { group: g, phys: { shape: 'box', size: [W, H, D], mass: 0, yOffset: H / 2 } };
  }

  /* ---------- ceiling fan: origin at the ceiling mount, hangs down (−y) ---------- */
  function ceilingFan() {
    const g = new T.Group(), body = mat(0xf5efe3, { roughness: 0.4 }), trim = mat(0xc9a227, { metalness: 0.6, roughness: 0.3 });
    lathe([[0.04, -0.075], [0.075, -0.01], [0.075, 0], [0, 0]], body, g, 0, 0, 0, 28);                                // canopy
    cyl(0.012, 0.012, 0.28, 0, g, 0, -0.21, 0, 12).material = body;                                                  // down-rod
    const rotor = new T.Group(); rotor.position.y = -0.39; g.add(rotor);
    lathe([[0.02, 0.07], [0.07, 0.06], [0.11, 0.03], [0.115, 0], [0.11, -0.025], [0.06, -0.045], [0, -0.05]], body, rotor, 0, 0, 0, 36);   // motor housing
    mesh(new T.TorusGeometry(0.114, 0.006, 8, 40), trim, rotor).rotation.x = Math.PI / 2;
    sphere(0.025, 0, rotor, 0, -0.05, 0, 16).material = trim;
    for (let i = 0; i < 3; i++) {
      const arm = new T.Group(); arm.rotation.y = i * Math.PI * 2 / 3; rotor.add(arm);
      box(0.12, 0.012, 0.04, 0x8a8f98, arm, 0.14, -0.005, 0, 0.004).material = mat(0x8a8f98, { metalness: 0.5, roughness: 0.35 });
      const blade = mesh(roundBox(0.48, 0.008, 0.11, 0.003), body, arm, 0.36, -0.01, 0); blade.rotation.x = 0.1;
    }
    g.userData.tick = (t) => { rotor.rotation.y = t * 6; };
    g.userData.tick(0);
    return { group: g };
  }

  /* ---------- single-door fridge; setOn opens it (lit inside, full of food) ---------- */
  function fridge() {
    const g = new T.Group(), W = 0.56, H = 1.45, D = 0.62, y0 = 0.1, wall = 0.03;
    const body = mat(0x9d174d, { roughness: 0.35, metalness: 0.15 });
    const liner = new T.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5, side: T.DoubleSide, emissive: 0xfffbe6, emissiveIntensity: 0 });
    const P = (w, h, d, m, x, y, z) => mesh(roundBox(w, h, d, 0.008), m, g, x, y, z);
    P(W, H - y0, wall, body, 0, y0 + (H - y0) / 2, -D / 2 + wall / 2);
    for (const s of [-1, 1]) P(wall, H - y0, D, body, s * (W / 2 - wall / 2), y0 + (H - y0) / 2, 0);
    P(W, 0.04, D, body, 0, H - 0.02, 0);
    P(W, y0, D, mat(0x4a0b25), 0, y0 / 2, 0);                                                                         // plinth
    box(W - 0.08, 0.04, 0.01, 0x1f1a33, g, 0, 0.05, D / 2 + 0.002, 0.004);                                           // grille
    // liner (white inside walls)
    const iw = W - 2 * wall, ih = H - y0 - 0.04, ic = y0 + ih / 2, back = -D / 2 + wall;
    mesh(new T.PlaneGeometry(iw, ih), liner, g, 0, ic, back + 0.001);
    for (const s of [-1, 1]) { const p = mesh(new T.PlaneGeometry(D - wall, ih), liner, g, s * (iw / 2 - 0.001), ic, wall / 2); p.rotation.y = Math.PI / 2; }
    for (const y of [y0 + 0.001, H - 0.041]) { const p = mesh(new T.PlaneGeometry(iw, D - wall), liner, g, 0, y, wall / 2); p.rotation.x = -Math.PI / 2; }
    // freezer box at the top
    box(iw - 0.04, 0.2, D - 0.14, 0xe2e8f0, g, 0, H - 0.16, -0.04, 0.01);
    box(iw - 0.04, 0.19, 0.012, 0xcbd5e1, g, 0, H - 0.16, D / 2 - 0.11, 0.004);
    // glass shelves + crisper
    const gm = new T.MeshStandardMaterial({ color: 0xdbeafe, transparent: true, opacity: 0.55, roughness: 0.1 });
    for (const y of [0.42, 0.72, 1.0]) mesh(new T.BoxGeometry(iw, 0.008, D - 0.16), gm, g, 0, y, -0.05);
    mesh(new T.BoxGeometry(iw - 0.04, 0.2, D - 0.18), new T.MeshStandardMaterial({ color: 0xbfdbfe, transparent: true, opacity: 0.35, roughness: 0.2 }), g, 0, 0.21, -0.06);
    let s = 5; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 6; i++) sphere(0.03, 0xdc2626, g, -0.15 + rnd() * 0.12, 0.14 + rnd() * 0.03, -0.18 + rnd() * 0.25, 16);   // tomatoes
    for (let i = 0; i < 4; i++) { const c = mesh(new T.ConeGeometry(0.014, 0.16, 12), mat(Z.orange), g, 0.05 + i * 0.035, 0.14, -0.05 + rnd() * 0.08); c.rotation.set(Math.PI / 2, 0, 0.3 * (rnd() - 0.5)); }   // carrots
    // shelf 1 (0.42): milk packets + curd bowl
    for (const x of [-0.14, -0.06]) { const m = box(0.07, 0.12, 0.04, 0xf8fafc, g, x, 0.42 + 0.064, -0.05, 0.015); decal(label('MILK', { w: 256, h: 128, bg: '#2563eb', fg: '#ffffff', size: 70 }), 0.06, 0.03, m, 0, 0, 0.021); }
    lathe([[0, 0], [0.05, 0], [0.07, 0.06], [0.066, 0.06], [0.046, 0.006], [0, 0.006]], mat(0xe2e8f0, { metalness: 0.5, roughness: 0.3 }), g, 0.1, 0.425, -0.05, 24);
    sphere(0.063, 0xfffbeb, g, 0.1, 0.47, -0.05, 20).scale.y = 0.18;
    // shelf 2 (0.72): eggs tray + steel dabba
    box(0.2, 0.025, 0.1, 0xf5d7a8, g, -0.1, 0.737, 0.0, 0.006);
    for (let i = 0; i < 6; i++) sphere(0.02, 0xfef3e2, g, -0.17 + (i % 3) * 0.07, 0.765, -0.025 + Math.floor(i / 3) * 0.05, 14).scale.y = 1.25;
    cyl(0.07, 0.07, 0.09, 0, g, 0.12, 0.77, -0.08, 28).material = mat(0xdfe5ec, { metalness: 0.55, roughness: 0.25 });
    // shelf 3 (1.0): water bottles + mango
    for (const x of [-0.15, -0.08]) { const b = cyl(0.035, 0.035, 0.22, 0, g, x, 1.11, -0.12, 20); b.material = new T.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7, roughness: 0.1 }); cyl(0.015, 0.015, 0.03, Z.blue, g, x, 1.235, -0.12, 12); }
    for (const [x, z] of [[0.08, -0.02], [0.15, 0.02]]) sphere(0.045, 0xfbbf24, g, x, 1.045, z, 18).scale.set(0.85, 0.8, 1.15);
    // door
    const door = new T.Group(); door.position.set(W / 2, 0, D / 2); g.add(door);
    const dh = H - y0 - 0.01, dy = y0 + dh / 2 + 0.005;
    mesh(roundBox(W, dh, 0.05, 0.012), body, door, -W / 2, dy, 0.025);
    const floral = tex((c, W2, H2) => {
      c.fillStyle = '#9d174d'; c.fillRect(0, 0, W2, H2);
      const fl = (x, y, r, col) => { c.fillStyle = col; for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; c.beginPath(); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8, 0, 7); c.fill(); } c.fillStyle = '#fde047'; c.beginPath(); c.arc(x, y, r * 0.6, 0, 7); c.fill(); };
      c.strokeStyle = '#be185d'; c.lineWidth = 10; c.beginPath(); c.moveTo(W2 * 0.1, H2); c.bezierCurveTo(W2 * 0.9, H2 * 0.75, W2 * 0.1, H2 * 0.55, W2 * 0.75, H2 * 0.35); c.stroke();
      c.fillStyle = '#be185d'; for (const [x, y, a] of [[0.45, 0.85, 0.6], [0.3, 0.68, -0.7], [0.6, 0.55, 0.8], [0.5, 0.45, -0.5]]) { c.beginPath(); c.ellipse(W2 * x, H2 * y, 50, 20, a, 0, 7); c.fill(); }
      fl(W2 * 0.75, H2 * 0.33, 34, '#f9a8d4'); fl(W2 * 0.55, H2 * 0.63, 26, '#fbcfe8'); fl(W2 * 0.22, H2 * 0.8, 30, '#f9a8d4'); fl(W2 * 0.85, H2 * 0.75, 18, '#fbcfe8');
    }, 512, 1024);
    mesh(new T.PlaneGeometry(W - 0.06, dh - 0.12), new T.MeshStandardMaterial({ map: floral, roughness: 0.35 }), door, -W / 2 - 0.01, dy - 0.03, 0.0505);
    box(0.025, 0.3, 0.035, 0xe2e8f0, door, -W + 0.035, 1.0, 0.065, 0.01).material = mat(0xe2e8f0, { metalness: 0.7, roughness: 0.25 });   // handle
    decal(logoTex(), 0.1, 0.082, door, -W / 2, H - 0.09, 0.0515);
    // magnets
    const mg = (m) => { m.castShadow = false; return m; };
    mg(sphere(0.022, 0xdc2626, door, -0.4, 1.12, 0.056, 16)).scale.z = 0.35;                                         // apple magnet
    mg(cyl(0.002, 0.002, 0.012, 0x166534, door, -0.4, 1.146, 0.058, 6));
    const note = decal(tex((c, W2, H2) => { c.fillStyle = '#fef9c3'; c.fillRect(0, 0, W2, H2); c.fillStyle = '#1f1a33'; c.font = `600 34px ${FONT}`; c.fillText('Buy:', 18, 46); c.font = `500 30px ${FONT}`; c.fillText('• milk', 22, 92); c.fillText('• eggs', 22, 132); c.fillText('• bread', 22, 172); c.fillStyle = '#ef4444'; c.beginPath(); c.arc(W2 / 2, 14, 12, 0, 7); c.fill(); }, 256, 220), 0.09, 0.077, door, -0.22, 1.12, 0.053);
    note.rotation.z = -0.08;
    const star = decal(label('★', { w: 128, h: 128, bg: 'rgba(0,0,0,0)', fg: '#facc15', size: 120 }), 0.05, 0.05, door, -0.1, 1.2, 0.054); star.rotation.z = 0.2;
    decal(label('Z', { w: 128, h: 128, bg: '#7c3aed', fg: '#ffffff', size: 100, radius: 64 }), 0.04, 0.04, door, -0.3, 0.98, 0.054);
    // inside of the door: liner + bottle bins
    mesh(new T.PlaneGeometry(W - 0.06, dh - 0.06), liner, door, -W / 2, dy, -0.001);
    for (const y of [0.35, 0.75, 1.1]) {
      mesh(new T.BoxGeometry(W - 0.1, 0.07, 0.06), new T.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.6, roughness: 0.2 }), door, -W / 2, y, -0.04);
      for (let i = 0; i < 3; i++) { const col = [0x22c55e, 0xfb923c, 0xef4444][(i + Math.round(y * 10)) % 3]; cyl(0.024, 0.024, 0.16, col, door, -W / 2 - 0.15 + i * 0.12, y + 0.06, -0.04, 16); }
    }
    const light = new T.PointLight(0xfff6e0, 0, 1.4, 2); light.position.set(0, 1.12, 0.05); g.add(light);
    g.userData.setOn = (on) => { door.rotation.y = on ? 1.9 : 0; liner.emissiveIntensity = on ? 0.35 : 0; light.intensity = on ? 0.9 : 0; };
    g.userData.setOn(false);
    return { group: g, phys: { shape: 'box', size: [W, H, D + 0.05], mass: 0, yOffset: H / 2, zOffset: 0.025 } };
  }

  /* ---------- shoe rack with shoes and slippers ---------- */
  function shoe(parent, x, y, z, col, sole, accent, len = 0.22, ry = 0) {
    const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
    box(0.085, 0.022, len, sole, g, 0, 0.011, 0, 0.009);
    box(0.078, 0.052, len * 0.86, col, g, 0, 0.044, -len * 0.05, 0.024);
    box(0.074, 0.075, len * 0.36, col, g, 0, 0.052, -len * 0.3, 0.024);
    box(0.05, 0.004, len * 0.24, 0x1f1a33, g, 0, 0.0895, -len * 0.29, 0.002);
    box(0.082, 0.012, len * 0.5, accent, g, 0, 0.035, -len * 0.05, 0.005);
    for (let i = 0; i < 3; i++) box(0.046, 0.005, 0.007, 0xf8fafc, g, 0, 0.071, len * 0.02 - i * 0.022, 0.002);
    return g;
  }
  function slipper(parent, x, y, z, strap, sole, len = 0.24, ry = 0) {
    const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
    const s = box(0.09, 0.016, len, sole, g, 0, 0.008, 0, 0.007); s.scale.x = 1;
    box(0.086, 0.004, len - 0.006, 0xf8fafc, g, 0, 0.0165, 0, 0.002);
    for (const k of [-1, 1]) tube([[k * 0.042, 0.017, -0.01], [k * 0.028, 0.034, 0.04], [0, 0.022, len * 0.3]], 0.0065, strap, g, false, 16, 6);
    return g;
  }
  function shoeRack() {
    const g = new T.Group(), W = 0.72, H = 0.62, D = 0.3;
    for (const s of [-1, 1]) box(0.025, H, D, Z.wood, g, s * (W / 2 - 0.0125), H / 2, 0, 0.006);
    for (const y of [0.03, 0.23, 0.43]) box(W - 0.04, 0.02, D - 0.01, Z.woodDark, g, 0, y, 0, 0.004);
    box(W, 0.025, D + 0.01, Z.wood, g, 0, H - 0.0125, 0, 0.006);
    box(W - 0.04, H - 0.05, 0.01, 0xd8b98f, g, 0, H / 2, -D / 2 + 0.005, 0.003);
    // bottom shelf: black school shoes + white sneakers
    shoe(g, -0.24, 0.04, 0, 0x1f2937, 0x111827, 0x111827, 0.2, 0.05); shoe(g, -0.145, 0.04, 0, 0x1f2937, 0x111827, 0x111827, 0.2, -0.03);
    shoe(g, 0.1, 0.04, 0, 0xf8fafc, 0xe2e8f0, 0x38bdf8, 0.23); shoe(g, 0.2, 0.04, 0.01, 0xf8fafc, 0xe2e8f0, 0x38bdf8, 0.23, -0.06);
    // middle shelf: pink sports shoes + sandals
    shoe(g, -0.23, 0.24, 0, Z.pink, 0xf8fafc, Z.purple, 0.19, 0.04); shoe(g, -0.135, 0.24, 0.005, Z.pink, 0xf8fafc, Z.purple, 0.19, -0.05);
    slipper(g, 0.1, 0.24, 0, 0x8a5a33, 0x5b3a22, 0.25, 0.03); slipper(g, 0.2, 0.24, 0, 0x8a5a33, 0x5b3a22, 0.25, -0.04);
    // top shelf: kids' shoes; on top: blue rubber chappals
    shoe(g, -0.2, 0.44, 0, Z.orange, 0xf8fafc, Z.yellow, 0.16, 0.05); shoe(g, -0.115, 0.44, 0, Z.orange, 0xf8fafc, Z.yellow, 0.16, -0.04);
    shoe(g, 0.12, 0.44, 0, Z.green, 0xf8fafc, 0xf8fafc, 0.17, 0.0); shoe(g, 0.205, 0.44, 0, Z.green, 0xf8fafc, 0xf8fafc, 0.17, -0.06);
    slipper(g, -0.1, H, 0.0, Z.blue, Z.blue, 0.25, 0.1); slipper(g, 0.0, H, 0.01, Z.blue, Z.blue, 0.25, -0.05);
    return { group: g, phys: { shape: 'box', size: [W, H, D], mass: 0, yOffset: H / 2 } };
  }

  /* ---------- wall clock: origin at the wall, faces +z; tick runs it from 10:10 ---------- */
  function wallClock() {
    const g = new T.Group(), R = 0.15;
    const bodyM = mat(Z.purple, { roughness: 0.35 });
    const b = cyl(R + 0.012, R + 0.012, 0.035, 0, g, 0, 0, 0.0175, 48); b.material = bodyM; b.rotation.x = Math.PI / 2;
    mesh(new T.TorusGeometry(R + 0.004, 0.012, 12, 64), mat(Z.pink, { roughness: 0.35 }), g, 0, 0, 0.037);
    const face = tex((c, W, H) => {
      c.fillStyle = '#fff7e6'; c.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, r1 = i % 5 ? W * 0.44 : W * 0.41; c.strokeStyle = i % 5 ? '#94a3b8' : '#1f1a33'; c.lineWidth = i % 5 ? 4 : 10; c.beginPath(); c.moveTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1); c.lineTo(cx + Math.sin(a) * W * 0.47, cy - Math.cos(a) * W * 0.47); c.stroke(); }
      const cols = ['#7c3aed', '#ec4899', '#fb923c', '#22c55e', '#38bdf8', '#eab308'];
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 ${W * 0.1}px ${FONT}`;
      for (let n = 1; n <= 12; n++) { const a = n * Math.PI / 6; c.fillStyle = cols[n % cols.length]; c.fillText(String(n), cx + Math.sin(a) * W * 0.33, cy - Math.cos(a) * W * 0.33 + 4); }
      c.fillStyle = '#7c3aed'; c.font = `700 ${W * 0.055}px ${FONT}`; c.fillText('ZUNGGA', cx, cy + H * 0.17);
    }, 1024, 1024);
    mesh(new T.CircleGeometry(R - 0.004, 48), new T.MeshStandardMaterial({ map: face, roughness: 0.6 }), g, 0, 0, 0.0355);
    const hand = (w, l, col, z, tail = 0.015) => { const h = new T.Group(); h.position.z = z; g.add(h); const m = box(w, l + tail, 0.003, col, h, 0, (l - tail) / 2, 0, Math.min(w / 2 - 1e-3, 0.0014)); m.castShadow = false; return h; };
    const hr = hand(0.012, 0.07, Z.ink, 0.04), mn = hand(0.008, 0.105, Z.ink, 0.0435), sc = hand(0.003, 0.118, 0xef4444, 0.047, 0.03);
    const capc = cyl(0.008, 0.008, 0.006, 0xef4444, g, 0, 0, 0.049, 16); capc.rotation.x = Math.PI / 2;
    g.userData.tick = (t) => {
      const s = 10 * 3600 + 10 * 60 + t;
      sc.rotation.z = -((s % 60) / 60) * Math.PI * 2; mn.rotation.z = -((s % 3600) / 3600) * Math.PI * 2; hr.rotation.z = -((s % 43200) / 43200) * Math.PI * 2;
    };
    g.userData.tick(0);
    return { group: g };
  }

  /* ---------- 2-burner gas stove with a pressure cooker; tick puffs steam ---------- */
  function stoveCooker() {
    const g = new T.Group(), W = 0.7, D = 0.38;
    for (const x of [-0.31, 0.31]) for (const z of [-0.15, 0.15]) cyl(0.015, 0.015, 0.012, Z.ink, g, x, 0.006, z, 10);
    box(W, 0.08, D, 0, g, 0, 0.052, 0, 0.012).material = mat(0xcfd6de, { metalness: 0.55, roughness: 0.3 });
    box(W - 0.02, 0.008, D - 0.02, 0x111827, g, 0, 0.094, 0, 0.003).material = mat(0x111827, { roughness: 0.12, metalness: 0.2 });   // glass top
    const brass = mat(0xc9a227, { metalness: 0.6, roughness: 0.3 }), enamel = mat(0x1f2937, { roughness: 0.4 });
    for (const x of [-0.17, 0.17]) {
      cyl(0.05, 0.055, 0.014, 0, g, x, 0.105, -0.01, 28).material = brass;
      cyl(0.036, 0.036, 0.01, Z.ink, g, x, 0.117, -0.01, 24);
      mesh(new T.TorusGeometry(0.09, 0.004, 6, 36), enamel, g, x, 0.104, -0.01).rotation.x = Math.PI / 2;      // pan support ring
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5, f = box(0.045, 0.014, 0.008, Z.ink, g, x + Math.cos(a) * 0.075, 0.113, -0.01 + Math.sin(a) * 0.075, 0.003); f.rotation.y = -a; f.material = enamel; }
      const k = cyl(0.02, 0.022, 0.022, Z.ink, g, x, 0.052, D / 2 + 0.011, 20); k.rotation.x = Math.PI / 2;
      box(0.004, 0.022, 0.003, 0xf8fafc, g, x, 0.058, D / 2 + 0.023, 0.001);
      const r = mesh(new T.TorusGeometry(0.024, 0.003, 6, 24), mat(0xe2e8f0, { metalness: 0.7, roughness: 0.25 }), g, x, 0.052, D / 2 + 0.002);
    }
    decal(label('ZUNGGA', { w: 512, h: 96, bg: '#cfd6de', fg: '#7c3aed', size: 70 }), 0.12, 0.022, g, 0, 0.052, D / 2 + 0.0125);
    const flame = mesh(new T.TorusGeometry(0.05, 0.007, 6, 28), new T.MeshStandardMaterial({ color: 0x60a5fa, emissive: 0x3b82f6, emissiveIntensity: 1.5, transparent: true, opacity: 0.85 }), g, -0.17, 0.118, -0.01);
    flame.rotation.x = Math.PI / 2; flame.castShadow = false;
    tube([[W / 2, 0.05, -0.12], [W / 2 + 0.04, 0.045, -0.13], [W / 2 + 0.07, 0.02, -0.16], [W / 2 + 0.08, 0.008, -0.22]], 0.008, Z.orange, g, false, 16, 8);   // gas hose
    // pressure cooker on the left burner
    const ck = new T.Group(); ck.position.set(-0.17, 0.12, -0.01); g.add(ck);
    const alu = mat(0xc7ccd3, { metalness: 0.5, roughness: 0.32 });
    lathe([[0, 0], [0.1, 0], [0.105, 0.008], [0.105, 0.14], [0.1, 0.15]], alu, ck, 0, 0, 0, 36);
    lathe([[0.108, 0.146], [0.11, 0.152], [0.092, 0.165], [0.025, 0.173], [0, 0.173]], alu, ck, 0, 0, 0, 36);
    const hg = new T.Group(); hg.rotation.y = 0.6; ck.add(hg);
    box(0.17, 0.024, 0.03, Z.ink, hg, -0.18, 0.125, 0, 0.01);
    box(0.17, 0.022, 0.032, Z.ink, hg, -0.175, 0.165, 0, 0.01);
    box(0.03, 0.012, 0.03, 0x64748b, hg, -0.1, 0.16, 0, 0.004);
    box(0.06, 0.02, 0.03, Z.ink, hg, 0.13, 0.125, 0, 0.008);                                                         // helper handle
    cyl(0.009, 0.009, 0.018, 0x64748b, ck, 0, 0.18, 0, 12);
    cyl(0.013, 0.017, 0.028, Z.ink, ck, 0, 0.202, 0, 16);                                                            // whistle weight
    sphere(0.008, Z.ink, ck, 0, 0.219, 0, 12);
    cyl(0.007, 0.007, 0.012, 0xef4444, ck, 0.05, 0.172, 0.03, 10);                                                   // safety valve
    const puffs = [];
    for (let i = 0; i < 4; i++) {
      const m = new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, roughness: 1 });
      const p = mesh(new T.SphereGeometry(1, 16, 12), m, ck, 0, 0.23, 0); p.castShadow = false; p.receiveShadow = false; puffs.push(p);
    }
    g.userData.tick = (t) => {
      puffs.forEach((p, i) => {
        const ph = (t * 0.55 + i / 4) % 1;
        p.position.set(Math.sin(ph * 5 + i) * 0.02 + ph * 0.03, 0.23 + ph * 0.2, Math.cos(ph * 4 + i) * 0.012);
        p.scale.setScalar(0.012 + ph * 0.045);
        p.material.opacity = 0.6 * (1 - ph) * Math.min(1, ph * 6);
      });
    };
    g.userData.tick(0.3);
    return { group: g, phys: { shape: 'box', size: [W, 0.1, D], mass: 0, yOffset: 0.05 } };
  }

  ZAssets.register('home', 'bed', 'Single bed', bed, ['bed', 'bedroom', 'sleep', 'pillow', 'blanket']);
  ZAssets.register('home', 'study_table', 'Study table + chair + lamp', studyTable, ['study', 'table', 'desk', 'lamp', 'homework', 'books']);
  ZAssets.register('home', 'dining_set', 'Dining table + 4 chairs', diningSet, ['dining', 'table', 'chairs', 'meal', 'steel jug']);
  ZAssets.register('home', 'tv_stand', 'TV on a cabinet', tvStand, ['tv', 'television', 'cartoon', 'living room']);
  ZAssets.register('home', 'wardrobe', 'Steel almirah (wardrobe)', wardrobe, ['almirah', 'wardrobe', 'cupboard', 'clothes']);
  ZAssets.register('home', 'ceiling_fan', 'Ceiling fan', ceilingFan, ['fan', 'ceiling', 'tick']);
  ZAssets.register('home', 'fridge', 'Fridge (single door)', fridge, ['fridge', 'refrigerator', 'kitchen', 'food']);
  ZAssets.register('home', 'shoe_rack', 'Shoe rack', shoeRack, ['shoes', 'slippers', 'chappals', 'rack']);
  ZAssets.register('home', 'wall_clock', 'Wall clock', wallClock, ['clock', 'time', 'wall', 'tick']);
  ZAssets.register('home', 'stove_cooker', 'Gas stove + pressure cooker', stoveCooker, ['stove', 'cooker', 'kitchen', 'cooking', 'steam', 'tick']);
})();
