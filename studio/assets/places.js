/* Zungga Story Studio — places (sets) added with the big asset pack. Each set is a room / outdoor spot built around
 * x = z = 0: the back wall is at −z, the camera side (+z) is open, and the middle (x −1.5…1.5, z −0.5…2) is kept free
 * for the characters. Sets reuse library props when they exist (ZAssets.has) so they get better as the library grows. */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box, logoTex, mascotTex, decal, label, cyl, sphere } = ZA;

  // ---------- shared helpers ----------
  const put = (g, id, x, y, z, ry = 0, s = 1) => { if (!ZAssets.has(id)) return null; const o = ZAssets.build(id).group; o.position.set(x, y, z); o.rotation.y = ry; o.scale.multiplyScalar(s); g.add(o); return o; };
  const seeded = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
  function floorTex(base, line, n = 8, kind = 'tiles') {
    const t = tex((c, W, H) => { c.fillStyle = base; c.fillRect(0, 0, W, H); c.strokeStyle = line; c.lineWidth = 3;
      if (kind === 'planks') for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(0, i * H / n); c.lineTo(W, i * H / n); c.stroke(); for (let k = 0; k < 3; k++) { const x = ((i * 137 + k * 211) % 512) / 512 * W; c.beginPath(); c.moveTo(x, i * H / n); c.lineTo(x, (i + 1) * H / n); c.stroke(); } }
      else for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * W / n, 0); c.lineTo(i * W / n, H); c.stroke(); c.beginPath(); c.moveTo(0, i * H / n); c.lineTo(W, i * H / n); c.stroke(); } }, 512, 512);
    t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }
  function floor(g, w, d, t, rep = [3, 2], rough = 0.8) { t.repeat.set(...rep); const f = mesh(new T.PlaneGeometry(w, d), new T.MeshStandardMaterial({ map: t, roughness: rough }), g, 0, 0.002, 0); f.rotation.x = -Math.PI / 2; return f; }
  // a room: floor, back wall, left wall, skirting; returns sizes for placing things
  function room(g, { W = 7, D = 5, H = 3, wall = 0xffe9d6, side = null, floorT, rep = [3, 2], skirting = 0xf4c9a4, right = false }) {
    floor(g, W, D, floorT, rep);
    const wm = mat(wall, { roughness: 0.95 }), sm = mat(side ?? wall, { roughness: 0.95 });
    mesh(new T.BoxGeometry(W, H, 0.12), wm, g, 0, H / 2, -D / 2);
    mesh(new T.BoxGeometry(0.12, H, D), sm, g, -W / 2, H / 2, 0);
    if (right) mesh(new T.BoxGeometry(0.12, H, D), sm, g, W / 2, H / 2, 0);
    mesh(new T.BoxGeometry(W, 0.12, 0.14), mat(skirting), g, 0, 0.06, -D / 2 + 0.01);
    return { W, D, H, back: -D / 2 + 0.06, left: -W / 2 + 0.06 };
  }
  function windowOn(g, x, y, z, w = 1.4, h = 1.3, glow = 0xffe2b0, ry = 0) {
    const wg = new T.Group(); wg.position.set(x, y, z); wg.rotation.y = ry; g.add(wg);
    box(w + 0.1, h + 0.1, 0.08, 0xffffff, wg, 0, 0, 0, 0.01);
    mesh(new T.PlaneGeometry(w - 0.06, h - 0.06), new T.MeshStandardMaterial({ color: 0xfff1d6, emissive: glow, emissiveIntensity: 1.3 }), wg, 0, 0, 0.045);
    mesh(new T.BoxGeometry(0.04, h, 0.02), mat(0xffffff), wg, 0, 0, 0.055); mesh(new T.BoxGeometry(w, 0.04, 0.02), mat(0xffffff), wg, 0, 0, 0.055);
    return wg;
  }
  function sign(g, text, x, y, z, w = 1.6, h = 0.4, bg = '#7c3aed', fg = '#ffffff', ry = 0) {
    const s = new T.Group(); s.position.set(x, y, z); s.rotation.y = ry; g.add(s);
    box(w, h, 0.05, 0xffffff, s, 0, 0, 0, 0.015);
    mesh(new T.PlaneGeometry(w * 0.94, h * 0.84), new T.MeshStandardMaterial({ map: label(text, { w: 1024, h: Math.round(1024 * h / w), bg, fg, size: 300 }), roughness: 0.6 }), s, 0, 0, 0.027);
    return s;
  }
  function logoSign(g, x, y, z, w = 0.9) { decal(logoTex(), w, w * 755 / 920, g, x, y, z); }
  function grass(g, w, d, col = '#7cc36a') {
    const t = tex((c, W, H) => { c.fillStyle = col; c.fillRect(0, 0, W, H); const r = seeded(11); for (let i = 0; i < 4000; i++) { c.fillStyle = ['#6fb85c', '#8ccf78', '#68ad55', '#97d482'][i % 4]; c.globalAlpha = 0.6; c.fillRect(r() * W, r() * H, 2, 3 + r() * 4); } c.globalAlpha = 1; }, 512, 512);
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(w / 3, d / 3);
    const f = mesh(new T.PlaneGeometry(w, d), new T.MeshStandardMaterial({ map: t, roughness: 1 }), g, 0, 0.003, 0); f.rotation.x = -Math.PI / 2; f.castShadow = false; return f;
  }
  function path(g, w, d, x, z, col = '#d8c39a') { const f = mesh(new T.PlaneGeometry(w, d), mat(new T.Color(col).getHex(), { roughness: 1 }), g, x, 0.005, z); f.rotation.x = -Math.PI / 2; f.castShadow = false; return f; }
  function ceilingLight(g, x, y, z, w = 1.0) { box(w, 0.05, 0.25, 0xffffff, g, x, y, z, 0.01).material = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6e0, emissiveIntensity: 0.9 }); }
  function plant(g, x, z, s = 1) { if (put(g, 'plant_pot', x, 0, z, 0, s * 1.4)) return; cyl(0.16, 0.12, 0.3, 0xc2703d, g, x, 0.15, z); sphere(0.28, 0x4caf50, g, x, 0.52, z); }
  function chair(g, x, z, ry = 0, c = 0x8a5a33) {
    const ch = new T.Group(); ch.position.set(x, 0, z); ch.rotation.y = ry; g.add(ch);
    box(0.42, 0.05, 0.42, c, ch, 0, 0.45, 0, 0.01); box(0.42, 0.45, 0.05, c, ch, 0, 0.7, -0.19, 0.01);
    for (const [a, b] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) box(0.04, 0.45, 0.04, c, ch, a, 0.225, b, 0.005);
    return ch;
  }
  function stringLights(g, x0, x1, y, z, sag = 0.25, n = 18, cols = [0xffd166, 0xff6b9a, 0x7cd8ff, 0xb4f08a]) {
    const pts = []; for (let i = 0; i <= 24; i++) { const k = i / 24; pts.push(new T.Vector3(x0 + (x1 - x0) * k, y - Math.sin(k * Math.PI) * sag, z)); }
    mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.006, 4), mat(0x333333), g);
    for (let i = 1; i < n; i++) { const k = i / n, c = cols[i % cols.length]; mesh(new T.SphereGeometry(0.035, 10, 8), new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2.2 }), g, x0 + (x1 - x0) * k, y - Math.sin(k * Math.PI) * sag - 0.05, z).castShadow = false; }
  }
  function bunting(g, x0, x1, y, z, sag = 0.3, n = 14) {
    const cols = [0x7c3aed, 0xec4899, 0xfacc15, 0x38bdf8, 0x22c55e, 0xfb923c];
    const pts = []; for (let i = 0; i <= 24; i++) { const k = i / 24; pts.push(new T.Vector3(x0 + (x1 - x0) * k, y - Math.sin(k * Math.PI) * sag, z)); }
    mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.005, 4), mat(0xffffff), g);
    const tri = new T.BufferGeometry().setFromPoints([new T.Vector3(-0.09, 0, 0), new T.Vector3(0.09, 0, 0), new T.Vector3(0, -0.2, 0)]); tri.computeVertexNormals();
    for (let i = 1; i < n; i++) { const k = i / n; mesh(tri, new T.MeshStandardMaterial({ color: cols[i % cols.length], side: T.DoubleSide, roughness: 0.8 }), g, x0 + (x1 - x0) * k, y - Math.sin(k * Math.PI) * sag, z); }
  }
  function bookshelf(g, x, z, w = 1.8, h = 2.4, ry = 0, seed = 3) {
    const s = new T.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s); const wood = 0x8a5a33, d = 0.34, rows = 5, r = seeded(seed);
    box(w, h, 0.03, wood, s, 0, h / 2, -d / 2 + 0.015, 0.005);
    for (const sx of [-1, 1]) box(0.04, h, d, wood, s, sx * (w / 2 - 0.02), h / 2, 0, 0.01);
    const cols = [0xef4444, 0x3b82f6, 0x22c55e, 0xfacc15, 0x7c3aed, 0xec4899, 0xfb923c, 0x14b8a6, 0xf8fafc, 0x1e3a8a], books = [];
    for (let i = 0; i <= rows; i++) {
      const y = 0.06 + i * (h - 0.1) / rows; box(w - 0.06, 0.03, d, wood, s, 0, y, 0, 0.005);
      if (i === rows) break;
      let bx = -w / 2 + 0.06; while (bx < w / 2 - 0.12) { const bw = 0.025 + r() * 0.03, bh = 0.2 + r() * 0.14; if (r() < 0.08) { bx += 0.08; continue; } books.push([bx + bw / 2, y + 0.015 + bh / 2, bw, bh, cols[Math.floor(r() * cols.length)], r() < 0.1 ? 0.18 : 0]); bx += bw + 0.004; }
    }
    const geo = new T.BoxGeometry(1, 1, 1), im = new T.InstancedMesh(geo, new T.MeshStandardMaterial({ roughness: 0.7 }), books.length), m4 = new T.Matrix4(), c = new T.Color();
    books.forEach(([bx, by, bw, bh, col, tilt], i) => { m4.compose(new T.Vector3(bx, by, 0.02), new T.Quaternion().setFromEuler(new T.Euler(0, 0, tilt)), new T.Vector3(bw, bh, d * 0.78)); im.setMatrixAt(i, m4); im.setColorAt(i, c.setHex(col)); });
    im.castShadow = true; im.receiveShadow = true; s.add(im); return s;
  }
  function diya(g, x, z, flameGeo, flameMat) {
    const d = new T.Group(); d.position.set(x, 0, z); g.add(d);
    const cup = mesh(new T.SphereGeometry(0.05, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xc2410c, { roughness: 0.8 }), d, 0, 0.05, 0); cup.scale.set(1, 0.6, 1.3);
    mesh(flameGeo, flameMat, d, 0, 0.075, -0.02).castShadow = false; return d;
  }
  function lampPost(g, x, z, on = true, h = 3.2) {
    cyl(0.05, 0.07, h, 0x374151, g, x, h / 2, z, 12); box(0.5, 0.05, 0.08, 0x374151, g, x + 0.2, h, z, 0.01);
    const head = mesh(new T.CylinderGeometry(0.08, 0.16, 0.18, 16), mat(0x374151), g, x + 0.4, h - 0.07, z);
    mesh(new T.SphereGeometry(0.1, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new T.MeshStandardMaterial({ color: 0xfff1c1, emissive: 0xffd27a, emissiveIntensity: on ? 3 : 0 }), g, x + 0.4, h - 0.16, z).castShadow = false;
    return head;
  }
  function swingSet(g, x, z, ry = 0) {
    const s = new T.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s); const steel = 0x2563eb, seats = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const leg = cyl(0.035, 0.035, 2.3, steel, s, sx * 1.0, 1.1, sz * 0.45, 10); leg.rotation.x = -sz * 0.2; }
    const top = cyl(0.04, 0.04, 2.1, steel, s, 0, 2.2, 0, 10); top.rotation.z = Math.PI / 2;
    for (const sx of [-0.45, 0.45]) { const sw = new T.Group(); sw.position.set(sx, 2.2, 0); s.add(sw); for (const cx of [-0.18, 0.18]) cyl(0.006, 0.006, 1.7, 0x9ca3af, sw, cx, -0.85, 0, 6); box(0.46, 0.04, 0.18, 0xfacc15, sw, 0, -1.7, 0, 0.01); seats.push(sw); }
    s.userData.tick = (t) => { seats.forEach((sw, i) => (sw.rotation.x = Math.sin(t * 1.6 + i * 1.3) * 0.08)); };
    return s;
  }
  function slide(g, x, z, ry = 0) {
    const s = new T.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s);
    for (const sx of [-0.3, 0.3]) for (const sz of [-0.3, 0.3]) cyl(0.04, 0.04, 1.5, 0xef4444, s, sx, 0.75, sz - 1.2, 10);
    box(0.7, 0.06, 0.7, 0xfacc15, s, 0, 1.5, -1.2, 0.02);
    for (let i = 0; i < 6; i++) box(0.5, 0.04, 0.1, 0xef4444, s, 0, 0.25 * i + 0.1, -1.6 - i * 0.02, 0.01);
    const sl = box(0.55, 0.05, 2.0, 0x22c55e, s, 0, 0.78, -0.25, 0.02); sl.rotation.x = 0.68;
    for (const sx of [-0.28, 0.28]) { const rail = box(0.04, 0.12, 2.0, 0x16a34a, s, sx, 0.84, -0.25, 0.01); rail.rotation.x = 0.68; }
    return s;
  }
  function seesaw(g, x, z, ry = 0) {
    const s = new T.Group(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s);
    const p = mesh(new T.ConeGeometry(0.18, 0.4, 4), mat(0x7c3aed), s, 0, 0.2, 0); p.rotation.y = Math.PI / 4;
    const bar = new T.Group(); bar.position.y = 0.42; s.add(bar); box(2.6, 0.06, 0.24, 0xfb923c, bar, 0, 0, 0, 0.02);
    for (const sx of [-1.1, 1.1]) { box(0.3, 0.04, 0.26, 0xfacc15, bar, sx, 0.04, 0, 0.01); const h = cyl(0.015, 0.015, 0.3, 0x374151, bar, sx * 0.86, 0.15, 0, 8); h.rotation.x = Math.PI / 2; }
    s.userData.tick = (t) => { bar.rotation.z = Math.sin(t * 1.2) * 0.18; };
    return s;
  }

  // ---------- 1. Bank ----------
  function bankSet() {
    const g = new T.Group(), R = room(g, { W: 9, D: 6, H: 3.4, wall: 0xf3eadb, side: 0xe9dcc6, floorT: floorTex('#efe8dc', '#d6cbb6', 6), rep: [4, 3], skirting: 0x9a7b5a });
    box(9, 0.9, 0.13, 0x7c6a58, g, 0, 0.45, R.back, 0.01);   // wood panel dado
    // the counter runs across the back with the teller behind it
    if (!put(g, 'bank_counter', 0, 0, R.back + 1.1)) { box(3, 1.05, 0.7, 0x8a5a33, g, 0, 0.525, R.back + 1.1, 0.03); mesh(new T.BoxGeometry(3, 0.8, 0.02), glassMat(), g, 0, 1.45, R.back + 1.1); }
    sign(g, 'ZUNGGA BANK', 0.6, 2.75, R.back + 0.02, 2.6, 0.5, '#4b2a8c', '#ffffff'); logoSign(g, -1.2, 2.75, R.back + 0.05, 0.62);
    put(g, 'vault_door', -3.4, 0, R.back + 0.25) || cyl(0.9, 0.9, 0.25, 0x9aa3ae, g, -3.4, 1.2, R.back + 0.12, 32).rotateX(Math.PI / 2);
    put(g, 'atm_machine', 3.6, 0, R.back + 0.45, 0) || box(0.8, 1.8, 0.6, 0x4b2a8c, g, 3.6, 0.9, R.back + 0.4, 0.04);
    put(g, 'token_machine', 2.4, 0, R.back + 0.35);
    // queue posts with a purple rope
    const posts = [[-1.6, 0.6], [-0.4, 0.6], [0.8, 0.6]];
    for (const [x, z] of posts) { cyl(0.025, 0.025, 0.95, 0xd4a017, g, x, 0.475, z, 12).material = mat(0xd4a017, { metalness: 0.8, roughness: 0.3 }); cyl(0.16, 0.18, 0.04, 0xd4a017, g, x, 0.02, z, 20); sphere(0.04, 0xd4a017, g, x, 0.97, z, 12); }
    for (let i = 0; i < posts.length - 1; i++) { const [a, az] = posts[i], [b] = posts[i + 1], pts = []; for (let k = 0; k <= 10; k++) pts.push(new T.Vector3(a + (b - a) * k / 10, 0.9 - Math.sin(k / 10 * Math.PI) * 0.12, az)); mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 16, 0.018, 6), mat(0x7c3aed), g); }
    // waiting chairs on the right + a plant + a notice board
    for (let i = 0; i < 3; i++) chair(g, 3.6, 0.6 + i * 0.55, -Math.PI / 2, 0x4b2a8c);
    plant(g, -4.0, 1.6); plant(g, 4.0, -0.5, 0.8);
    const nb = tex((c, W, H) => { c.fillStyle = '#c99a6b'; c.fillRect(0, 0, W, H); const r = seeded(5); for (let i = 0; i < 6; i++) { c.fillStyle = ['#fff', '#fef08a', '#bfdbfe', '#fbcfe8'][i % 4]; const x = 20 + (i % 3) * 160, y = 20 + Math.floor(i / 3) * 120; c.save(); c.translate(x + 60, y + 45); c.rotate((r() - 0.5) * 0.2); c.fillRect(-60, -45, 120, 90); c.fillStyle = '#999'; for (let l = 0; l < 4; l++) c.fillRect(-48, -30 + l * 16, 80 + r() * 16, 5); c.restore(); } }, 512, 280);
    box(1.3, 0.72, 0.04, 0x6b4a2e, g, -4.42, 1.7, -0.6, 0.01).rotation.y = Math.PI / 2;
    const nbm = mesh(new T.PlaneGeometry(1.2, 0.64), new T.MeshStandardMaterial({ map: nb }), g, -4.39, 1.7, -0.6); nbm.rotation.y = Math.PI / 2;
    for (const x of [-2.5, 0, 2.5]) ceilingLight(g, x, 3.35, 0, 1.2);
    return { group: g, size: [9, 3.4, 6] };
  }

  // ---------- 2. Kitchen ----------
  function kitchenSet() {
    const g = new T.Group(), R = room(g, { W: 7, D: 5, H: 3, wall: 0xfff1dc, side: 0xfde2c8, floorT: floorTex('#e9dfcf', '#cdbfa9', 6), rep: [3, 2] });
    const tiles = tex((c, W, H) => { c.fillStyle = '#e0f2f1'; c.fillRect(0, 0, W, H); c.strokeStyle = '#b2dfdb'; c.lineWidth = 4; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * W / 8, 0); c.lineTo(i * W / 8, H); c.stroke(); c.beginPath(); c.moveTo(0, i * H / 4); c.lineTo(W, i * H / 4); c.stroke(); } }, 512, 256);
    tiles.wrapS = T.RepeatWrapping; tiles.repeat.set(4, 1);
    mesh(new T.PlaneGeometry(5.2, 0.7), new T.MeshStandardMaterial({ map: tiles }), g, 0.6, 1.25, R.back + 0.005);
    // counter along the back wall with cabinets
    box(5.2, 0.86, 0.6, 0x2a9d8f, g, 0.6, 0.43, R.back + 0.3, 0.02); box(5.3, 0.05, 0.64, 0x37474f, g, 0.6, 0.885, R.back + 0.32, 0.01);
    for (let i = 0; i < 6; i++) { box(0.8, 0.7, 0.02, 0x34b3a3, g, -1.5 + i * 0.85, 0.42, R.back + 0.61, 0.01); box(0.12, 0.025, 0.03, 0xe5e7eb, g, -1.5 + i * 0.85, 0.65, R.back + 0.63, 0.005); }
    for (let i = 0; i < 4; i++) { box(1.0, 0.65, 0.35, 0xf8fafc, g, -0.7 + i * 1.05, 2.15, R.back + 0.18, 0.02); box(0.12, 0.025, 0.03, 0x9ca3af, g, -0.7 + i * 1.05, 1.9, R.back + 0.36, 0.005); }
    put(g, 'stove_cooker', 1.4, 0.91, R.back + 0.3) || box(0.7, 0.1, 0.4, 0x222222, g, 1.4, 0.96, R.back + 0.3, 0.02);
    // sink with a tap
    box(0.6, 0.04, 0.42, 0xcbd5e1, g, -0.6, 0.9, R.back + 0.3, 0.01); const tap = cyl(0.015, 0.015, 0.25, 0xd1d5db, g, -0.6, 1.03, R.back + 0.12, 8); tap.material = mat(0xd1d5db, { metalness: 0.8, roughness: 0.25 });
    put(g, 'fridge', -2.85, 0, R.back + 0.42) || box(0.7, 1.7, 0.65, 0xe5e7eb, g, -2.85, 0.85, R.back + 0.4, 0.05);
    windowOn(g, 2.6, 1.7, R.back + 0.06, 1.0, 0.9);
    put(g, 'wall_clock', -1.6, 2.65, R.back + 0.02);
    // small dining table on the right front with steel tumblers
    if (!put(g, 'dining_set', 2.4, 0, 1.2, 0, 0.8)) { box(1.1, 0.05, 0.7, 0xa8774f, g, 2.4, 0.72, 1.2, 0.02); for (const [a, b] of [[1.95, 0.95], [2.85, 0.95], [1.95, 1.45], [2.85, 1.45]]) box(0.05, 0.7, 0.05, 0x8a5a33, g, a, 0.35, b, 0.01); }
    // jars and a fruit bowl on the counter
    const jc = [0xfacc15, 0xef4444, 0x22c55e];
    jc.forEach((c, i) => { cyl(0.07, 0.07, 0.18, 0xffffff, g, -2.0 + i * 0.18, 1.0, R.back + 0.25, 16).material = glassMat({ color: 0xffffff }); cyl(0.065, 0.065, 0.12, c, g, -2.0 + i * 0.18, 0.97, R.back + 0.25, 16); cyl(0.075, 0.075, 0.03, 0x7c3aed, g, -2.0 + i * 0.18, 1.105, R.back + 0.25, 16); });
    put(g, 'apple', 0.25, 0.91, R.back + 0.3); put(g, 'banana', 0.42, 0.91, R.back + 0.32, 0.4); put(g, 'mango', 0.1, 0.91, R.back + 0.38);
    ceilingLight(g, 0.5, 2.95, 0.2, 1.2);
    return { group: g, size: [7, 3, 5] };
  }

  // ---------- 3. Bedroom ----------
  function bedroomSet() {
    const g = new T.Group(), R = room(g, { W: 7, D: 5, H: 3, wall: 0xdbeafe, side: 0xe0e7ff, floorT: floorTex('#c99a6b', '#b5865a', 10, 'planks'), rep: [3, 2], skirting: 0xbfdbfe });
    // a soft rug
    const rug = tex((c, W, H) => { c.fillStyle = '#f9a8d4'; c.fillRect(0, 0, W, H); c.strokeStyle = '#fff'; c.lineWidth = 14; c.strokeRect(20, 20, W - 40, H - 40); c.fillStyle = '#fde68a'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(80 + i * 90, H / 2, 22, 0, Math.PI * 2); c.fill(); } }, 512, 256);
    const rg = mesh(new T.PlaneGeometry(2.4, 1.5), new T.MeshStandardMaterial({ map: rug, roughness: 1 }), g, 0, 0.006, 0.6); rg.rotation.x = -Math.PI / 2; rg.castShadow = false;
    put(g, 'bed', -2.2, 0, R.back + 1.05, 0) || box(1.0, 0.45, 2.0, 0x60a5fa, g, -2.2, 0.225, R.back + 1.05, 0.05);
    put(g, 'study_table', 2.2, 0, R.back + 0.45, 0) || box(1.1, 0.75, 0.55, 0xa8774f, g, 2.2, 0.375, R.back + 0.35, 0.02);
    put(g, 'wardrobe', -3.15, 0, 1.4, Math.PI / 2) || box(0.6, 2.0, 1.0, 0x8a5a33, g, -3.15, 1.0, 1.4, 0.03);
    windowOn(g, 0.2, 1.75, R.back + 0.06, 1.3, 1.2, 0xfff0c8);
    const sheer = new T.MeshStandardMaterial({ color: 0xfffaf0, emissive: 0xffe6c0, emissiveIntensity: 0.4, transparent: true, opacity: 0.85, side: T.DoubleSide });
    for (const sx of [-1, 1]) mesh(new T.PlaneGeometry(0.45, 1.9), sheer, g, 0.2 + sx * 0.85, 1.6, R.back + 0.2);
    // posters: the mascot and a star chart
    box(0.62, 0.62, 0.02, 0xffffff, g, 1.6, 2.15, R.back + 0.02, 0.01); decal(mascotTex(), 0.5, 0.5, g, 1.6, 2.15, R.back + 0.04);
    box(0.5, 0.66, 0.02, 0x1e3a8a, g, -1.1, 2.1, R.back + 0.02, 0.01);
    const stars = tex((c, W, H) => { c.fillStyle = '#1e3a8a'; c.fillRect(0, 0, W, H); c.fillStyle = '#fde68a'; const r = seeded(9); for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(r() * W, r() * H, 1 + r() * 3, 0, Math.PI * 2); c.fill(); } c.beginPath(); c.arc(W * 0.7, H * 0.25, 30, 0, Math.PI * 2); c.fill(); }, 256, 340);
    mesh(new T.PlaneGeometry(0.44, 0.6), new T.MeshStandardMaterial({ map: stars }), g, -1.1, 2.1, R.back + 0.035);
    put(g, 'teddy_bear', -1.7, 0.45, R.back + 0.5, 0.3); put(g, 'blocks', 0.9, 0, 1.3, 0.4); put(g, 'toy_car', -0.8, 0, 1.4, 0.8); put(g, 'shoe_rack', 3.1, 0, 1.6, -Math.PI / 2);
    put(g, 'school_bag', 1.4, 0, R.back + 0.35, -0.3);
    ceilingLight(g, 0, 2.95, 0.2);
    return { group: g, size: [7, 3, 5] };
  }

  // ---------- 4. Park ----------
  function parkSet() {
    const g = new T.Group(); grass(g, 18, 14); path(g, 1.6, 14, 0, 0, '#e6d3a8'); path(g, 18, 1.4, 0, 2.6, '#e6d3a8');
    swingSet(g, -4.0, -2.4, 0.15); slide(g, 4.2, -1.2, -0.4); seesaw(g, -4.6, 1.6, 0.3);
    put(g, 'banyan_tree', 6.2, 0, -5.0, 0, 0.8) || put(g, 'tree_oak', 6.2, 0, -5.0, 0, 0.8);
    put(g, 'palm_tree', -7.0, 0, -4.2, 0, 0.9); put(g, 'tree_maple', 1.8, 0, -6.0, 0, 0.6); put(g, 'tree_pine', -7.5, 0, 2.5, 0, 0.6); put(g, 'tree_birch', 7.5, 0, 3.0, 0, 0.6);
    put(g, 'bench', 2.0, 0, -2.2, 0); put(g, 'pond', -1.8, 0, -4.8); put(g, 'grass_patch', 2.8, 0, 1.4); put(g, 'grass_patch', -2.6, 0, -1.2, 1);
    put(g, 'flowers', -1.4, 0, 1.6); put(g, 'flowers', 1.5, 0, 3.8); put(g, 'bush', -3.0, 0, -5.5); put(g, 'bush', 3.8, 0, -4.4); put(g, 'butterflies', 1.2, 0.6, 0.4);
    put(g, 'clouds', 0, 3.5, -8, 0, 1.4);
    // a low painted fence at the back
    for (let i = -8; i <= 8; i++) box(0.08, 0.7, 0.06, 0xffffff, g, i * 1.0, 0.35, -6.8, 0.01);
    for (const y of [0.25, 0.55]) box(17, 0.07, 0.04, 0xffffff, g, 0, y, -6.78, 0.01);
    sign(g, 'ZUNGGA PARK', -1.6, 1.4, -6.6, 1.6, 0.4, '#22c55e'); cyl(0.04, 0.04, 1.2, 0x8a5a33, g, -1.6, 0.6, -6.62, 8);
    lampPost(g, 0.9, -3.4, false);
    return { group: g, size: [18, 6, 14] };
  }

  // ---------- 5. Supermarket ----------
  function supermarketSet() {
    const g = new T.Group(), R = room(g, { W: 10, D: 7, H: 3.4, wall: 0xf8fafc, side: 0xeef2ff, floorT: floorTex('#f1f5f9', '#d9e0ea', 8), rep: [5, 3.5], skirting: 0x7c3aed });
    box(10, 0.5, 0.13, 0x7c3aed, g, 0, 3.05, R.back, 0.01);
    sign(g, 'ZUNGGA MART', 0, 3.0, R.back + 0.03, 2.4, 0.42, '#ffffff', '#7c3aed'); logoSign(g, -1.65, 3.0, R.back + 0.05, 0.42);
    // aisles of shelves (left and back), signs hanging over them
    for (const [x, z, ry] of [[-3.0, R.back + 0.35, 0], [-0.8, R.back + 0.35, 0], [1.4, R.back + 0.35, 0], [-4.6, 0.4, Math.PI / 2], [-4.6, 2.4, Math.PI / 2]])
      put(g, 'grocery_shelf', x, 0, z, ry) || box(2, 1.8, 0.45, 0x94a3b8, g, x, 0.9, z, 0.02);
    for (const [t, x, c] of [['SNACKS', -3.0, '#ec4899'], ['RICE & DAL', -0.8, '#22c55e'], ['DRINKS', 1.4, '#38bdf8']]) { sign(g, t, x, 2.45, R.back + 0.7, 1.1, 0.3, c); cyl(0.005, 0.005, 0.8, 0x9ca3af, g, x, 2.95, R.back + 0.7, 4); }
    // checkout on the right with a belt, the till and a QR stand
    box(0.7, 0.9, 2.0, 0x4b2a8c, g, 3.7, 0.45, 0.6, 0.03); box(0.5, 0.02, 1.4, 0x111827, g, 3.6, 0.91, 0.85, 0.005);
    put(g, 'cash_register', 3.8, 0.9, -0.15, -Math.PI / 2) || box(0.35, 0.25, 0.3, 0x374151, g, 3.8, 1.02, -0.15, 0.02);
    put(g, 'qr_stand', 3.55, 0.9, 0.2, -Math.PI / 2); put(g, 'candy_jars', 3.75, 0.9, 1.4, -Math.PI / 2);
    // fruit and vegetable crates near the front left, baskets, a sale sign
    for (let i = 0; i < 3; i++) { box(0.6, 0.35, 0.45, 0xc08a52, g, -2.6 + i * 0.7, 0.4, 2.3, 0.02); const fc = [0xef4444, 0xfacc15, 0x22c55e][i], r = seeded(20 + i); for (let k = 0; k < 14; k++) sphere(0.045, fc, g, -2.82 + i * 0.7 + r() * 0.44, 0.62 + r() * 0.05, 2.12 + r() * 0.36, 10); box(0.2, 0.7, 0.05, 0x8a5a33, g, -2.6 + i * 0.7, 0.2, 2.1, 0.01).visible = false; }
    put(g, 'shopping_basket', 2.6, 0, 2.6, 0.3); put(g, 'shopping_basket', 2.9, 0.14, 2.65, 0.1); put(g, 'sale_sign', 1.8, 0, 2.9, -0.4);
    for (const x of [-3, 0, 3]) for (const z of [-1, 1.5]) ceilingLight(g, x, 3.35, z, 1.4);
    return { group: g, size: [10, 3.4, 7] };
  }

  // ---------- 6. Street with a bus stop ----------
  function streetSet() {
    const g = new T.Group();
    path(g, 22, 4, 0, 1.6, '#cfcfd4');                                 // pavement (characters stand here)
    box(22, 0.15, 0.25, 0x9ca3af, g, 0, 0.075, -0.5, 0.02);           // kerb
    if (!put(g, 'road_crossing', 0, 0, -3.0)) { const rd = mesh(new T.PlaneGeometry(22, 5), mat(0x3f3f46, { roughness: 1 }), g, 0, 0.004, -3.0); rd.rotation.x = -Math.PI / 2; }
    path(g, 22, 2.4, 0, -6.7, '#cfcfd4'); box(22, 0.15, 0.25, 0x9ca3af, g, 0, 0.075, -5.5, 0.02);
    put(g, 'bus_stop', -3.6, 0, 1.0, 0) || box(2.4, 2.4, 1, 0x38bdf8, g, -3.6, 1.2, 1.0, 0.05);
    put(g, 'traffic_light', 2.6, 0, -0.2, -Math.PI / 2 + 0.3);
    put(g, 'auto_rickshaw', 4.2, 0, -2.0, -Math.PI / 2); put(g, 'car', -6.5, 0, -4.0, Math.PI / 2); put(g, 'scooter', 6.4, 0, 1.4, 0.5); put(g, 'bicycle', -1.6, 0, 2.6, 1.3);
    put(g, 'birds_wire', 0, 0, -7.4);
    // a row of colourful shop / house fronts across the road
    const cols = [0xfcd34d, 0xf9a8d4, 0x93c5fd, 0xa7f3d0, 0xfdba74, 0xc4b5fd], names = ['CHAI', 'BOOKS', 'ZUNGGA TOYS', 'SWEETS', 'MEDICAL', 'BAKERY'];
    cols.forEach((c, i) => { const x = -9 + i * 3.6, h = 3.2 + (i % 3) * 0.6; box(3.4, h, 1.2, c, g, x, h / 2, -8.6, 0.03); box(1.2, 1.6, 0.05, 0x7c4a2a, g, x - 0.6, 0.8, -7.98, 0.01); box(1.0, 0.8, 0.05, 0xbfe6ff, g, x + 0.8, 1.4, -7.98, 0.01).material = new T.MeshStandardMaterial({ color: 0xbfe6ff, emissive: 0xbfe6ff, emissiveIntensity: 0.3 }); sign(g, names[i], x, h - 0.45, -7.96, 2.4, 0.4, ['#7c3aed', '#ec4899', '#2563eb', '#16a34a', '#ef4444', '#f59e0b'][i]); for (let k = -1; k <= 1; k++) box(0.6, 0.6, 0.04, 0xffffff, g, x + k * 1.0, h - 1.2, -7.98, 0.01); });
    put(g, 'tree_oak', 6.5, 0, 2.8, 0, 0.55); put(g, 'tree_pine', -8.2, 0, 2.6, 0, 0.5); lampPost(g, 5.2, -0.1, false);
    put(g, 'school_bus', -2.0, 0, -4.3, Math.PI / 2, 0.92);
    return { group: g, size: [22, 5, 12] };
  }

  // ---------- 7. Birthday party room ----------
  function partySet() {
    const g = new T.Group(), R = room(g, { W: 7, D: 5, H: 3, wall: 0xfce7f3, side: 0xfbcfe8, floorT: floorTex('#c99a6b', '#b5865a', 10, 'planks'), rep: [3, 2], skirting: 0xf9a8d4 });
    sign(g, 'HAPPY BIRTHDAY!', 0, 2.45, R.back + 0.03, 2.8, 0.5, '#ec4899');
    bunting(g, -3.4, 3.4, 2.85, R.back + 0.2, 0.35); bunting(g, -3.4, 3.4, 2.75, R.back + 1.4, 0.25, 12);
    // party table with the cake and gifts
    box(1.8, 0.05, 0.8, 0xffffff, g, 0, 0.74, R.back + 0.8, 0.02); for (const [a, b] of [[-0.82, R.back + 0.48], [0.82, R.back + 0.48], [-0.82, R.back + 1.12], [0.82, R.back + 1.12]]) box(0.05, 0.72, 0.05, 0xf9a8d4, g, a, 0.36, b, 0.01);
    const cloth = mesh(new T.BoxGeometry(1.86, 0.3, 0.86), mat(0xfbcfe8), g, 0, 0.62, R.back + 0.8); cloth.material.side = T.DoubleSide;
    put(g, 'birthday_cake', 0, 0.765, R.back + 0.8) || cyl(0.2, 0.2, 0.25, 0xffffff, g, 0, 0.9, R.back + 0.8);
    put(g, 'zungga_gift', -0.65, 0.765, R.back + 0.75, 0.3, 0.8); put(g, 'zungga_gift', 0.65, 0.765, R.back + 0.85, -0.2, 0.65);
    put(g, 'zungga_balloons', -2.6, 0, R.back + 0.6) || [0xec4899, 0x7c3aed, 0xfacc15].forEach((c, i) => sphere(0.18, c, g, -2.6 + i * 0.3, 2.0 + i * 0.1, R.back + 0.6));
    put(g, 'zungga_balloons', 2.7, 0, R.back + 0.5, 0.8);
    // confetti on the floor
    const r = seeded(31), cc = [0x7c3aed, 0xec4899, 0xfacc15, 0x38bdf8, 0x22c55e], cg = new T.PlaneGeometry(0.03, 0.05), im = new T.InstancedMesh(cg, new T.MeshStandardMaterial({ side: T.DoubleSide }), 220), m4 = new T.Matrix4(), col = new T.Color();
    for (let i = 0; i < 220; i++) { m4.compose(new T.Vector3((r() - 0.5) * 6, 0.008, (r() - 0.5) * 4), new T.Quaternion().setFromEuler(new T.Euler(-Math.PI / 2, 0, r() * 6)), new T.Vector3(1, 1, 1)); im.setMatrixAt(i, m4); im.setColorAt(i, col.setHex(cc[i % cc.length])); }
    g.add(im);
    windowOn(g, -3.4, 1.7, -0.2, 1.1, 1.0, 0xffe2b0, Math.PI / 2);
    ceilingLight(g, 0, 2.95, 0.4);
    return { group: g, size: [7, 3, 5] };
  }

  // ---------- 8. Festival street (Diwali evening) ----------
  function festivalSet() {
    const g = new T.Group();
    path(g, 20, 14, 0, 0, '#b9a58a');
    // rangoli in the middle (characters stand around it)
    const rang = tex((c, W, H) => { c.translate(W / 2, H / 2); const ring = (r, n, col, s) => { c.fillStyle = col; for (let i = 0; i < n; i++) { c.save(); c.rotate(i * Math.PI * 2 / n); c.beginPath(); c.ellipse(r, 0, s, s * 0.45, 0, 0, Math.PI * 2); c.fill(); c.restore(); } };
      c.fillStyle = '#fde68a'; c.beginPath(); c.arc(0, 0, W * 0.47, 0, Math.PI * 2); c.fill(); ring(W * 0.38, 16, '#ec4899', 40); ring(W * 0.27, 12, '#7c3aed', 34); ring(W * 0.16, 8, '#22c55e', 30); c.fillStyle = '#f97316'; c.beginPath(); c.arc(0, 0, W * 0.07, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff'; for (let i = 0; i < 32; i++) { c.beginPath(); c.arc(Math.cos(i / 32 * 6.283) * W * 0.45, Math.sin(i / 32 * 6.283) * W * 0.45, 6, 0, Math.PI * 2); c.fill(); } }, 512, 512);
    const rm = mesh(new T.CircleGeometry(1.0, 48), new T.MeshStandardMaterial({ map: rang, transparent: true, roughness: 1 }), g, 0, 0.008, 0.9); rm.rotation.x = -Math.PI / 2; rm.castShadow = false;
    // diyas around the rangoli and along the house steps (one flame material, glowing)
    const flameGeo = new T.ConeGeometry(0.014, 0.05, 8), flameM = new T.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffa53a, emissiveIntensity: 4 }), flames = [];
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; flames.push(diya(g, Math.cos(a) * 1.15, 0.9 + Math.sin(a) * 1.15, flameGeo, flameM)); }
    // houses with string lights and hanging lanterns
    const cols = [0xfde68a, 0xfbcfe8, 0xc7d2fe, 0xa7f3d0];
    cols.forEach((c, i) => { const x = -6 + i * 4, h = 3.4 + (i % 2) * 0.5; box(3.6, h, 2.0, c, g, x, h / 2, -5.6, 0.03); box(1.0, 1.9, 0.05, 0x7c4a2a, g, x, 0.95, -4.58, 0.01); for (const k of [-1, 1]) box(0.8, 0.8, 0.05, 0xffd78a, g, x + k * 1.1, 1.7, -4.58, 0.01).material = new T.MeshStandardMaterial({ color: 0xffd78a, emissive: 0xffb54a, emissiveIntensity: 1.2 });
      box(1.6, 0.18, 0.5, 0xd6cbb6, g, x, 0.09, -4.35, 0.02); for (let k = 0; k < 4; k++) flames.push(diya(g, x - 0.6 + k * 0.4, -4.2, flameGeo, flameM));
      stringLights(g, x - 1.8, x + 1.8, h - 0.25, -4.55, 0.2, 16);
      const lan = new T.Group(); lan.position.set(x + 1.0, h - 0.8, -4.3); g.add(lan); cyl(0.003, 0.003, 0.5, 0x333333, lan, 0, 0.25, 0, 4); const body = mesh(new T.OctahedronGeometry(0.2, 0), new T.MeshStandardMaterial({ color: [0xef4444, 0xf97316, 0x7c3aed, 0xec4899][i], emissive: [0xef4444, 0xf97316, 0x7c3aed, 0xec4899][i], emissiveIntensity: 0.9 }), lan, 0, -0.1, 0); body.scale.y = 1.3; });
    // a small temple at the end of the street
    const tp = new T.Group(); tp.position.set(7.2, 0, -4.5); g.add(tp);
    box(2.2, 0.4, 2.2, 0xe7d3b0, tp, 0, 0.2, 0, 0.02); box(1.6, 1.6, 1.6, 0xfff4dc, tp, 0, 1.2, 0, 0.02); box(0.7, 1.1, 0.05, 0x9a3412, tp, 0, 0.95, 0.81, 0.01);
    for (let i = 0; i < 4; i++) box(1.4 - i * 0.3, 0.35, 1.4 - i * 0.3, 0xf59e0b, tp, 0, 2.17 + i * 0.35, 0, 0.02); sphere(0.12, 0xfacc15, tp, 0, 3.6, 0);
    // marigold garland across the street + a sweets stall
    const pts = []; for (let k = 0; k <= 24; k++) pts.push(new T.Vector3(-8 + k * 16 / 24, 3.2 - Math.sin(k / 24 * Math.PI) * 0.5, -3.2));
    const curve = new T.CatmullRomCurve3(pts); for (let k = 0; k < 60; k++) sphere(0.05, k % 2 ? 0xf97316 : 0xfacc15, g, ...curve.getPoint(k / 59).toArray(), 8);
    box(1.6, 0.9, 0.7, 0xa8774f, g, -7.2, 0.45, 0.4, 0.02); box(1.8, 0.06, 0.9, 0xef4444, g, -7.2, 2.0, 0.4, 0.02); for (const sx of [-0.8, 0.8]) cyl(0.03, 0.03, 1.1, 0x8a5a33, g, -7.2 + sx, 1.45, 0.75, 8);
    sign(g, 'MITHAI', -7.2, 2.25, 0.86, 1.2, 0.3, '#ef4444');
    for (let k = 0; k < 9; k++) sphere(0.05, [0xfacc15, 0xf97316, 0xffffff][k % 3], g, -7.6 + (k % 3) * 0.18, 0.95, 0.25 + Math.floor(k / 3) * 0.15, 10);
    // stars in the dusk sky + flame flicker
    const r = seeded(77), sg = new T.BufferGeometry(), sp = []; for (let i = 0; i < 200; i++) sp.push((r() - 0.5) * 60, 10 + r() * 14, -20 - r() * 15); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
    { const st = new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 0.12, fog: false })); st.userData.sky = true; g.add(st); }
    g.userData.tick = (t) => { flames.forEach((d, i) => { const f = d.children[1]; f.scale.set(1, 0.85 + 0.25 * Math.abs(Math.sin(t * 9 + i * 1.7)), 1); }); };
    return { group: g, size: [20, 5, 14] };
  }

  // ---------- 9. Library ----------
  function librarySet() {
    const g = new T.Group(), R = room(g, { W: 9, D: 6, H: 3.4, wall: 0xf5ecdc, side: 0xeadfca, floorT: floorTex('#a8774f', '#8f633f', 12, 'planks'), rep: [4, 3], skirting: 0x6b4a2e });
    for (let i = 0; i < 4; i++) bookshelf(g, -3.3 + i * 2.2, R.back + 0.2, 2.0, 2.6, 0, 3 + i);
    bookshelf(g, R.left + 0.2, 0.2, 2.0, 2.4, Math.PI / 2, 12); bookshelf(g, R.left + 0.2, 2.2, 1.6, 2.4, Math.PI / 2, 13);
    sign(g, 'LIBRARY · SHHH!', 0, 3.0, R.back + 0.03, 2.4, 0.4, '#6b4a2e', '#fde68a');
    // reading table with green lamps, chairs and open books
    box(2.2, 0.06, 1.0, 0x8a5a33, g, 2.4, 0.76, 1.6, 0.02); for (const [a, b] of [[1.4, 1.2], [3.4, 1.2], [1.4, 2.0], [3.4, 2.0]]) box(0.06, 0.74, 0.06, 0x6b4a2e, g, a, 0.37, b, 0.01);
    for (const x of [1.9, 2.9]) { cyl(0.01, 0.01, 0.35, 0xd4a017, g, x, 0.96, 1.4, 8); const sh = mesh(new T.CylinderGeometry(0.06, 0.13, 0.12, 16, 1, true), new T.MeshStandardMaterial({ color: 0x15803d, emissive: 0xfff2c8, emissiveIntensity: 0.15, side: T.DoubleSide }), g, x, 1.14, 1.4); mesh(new T.SphereGeometry(0.035, 10, 8), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe2a8, emissiveIntensity: 2 }), g, x, 1.1, 1.4).castShadow = false; }
    for (const [x, z, ry] of [[1.9, 0.95, 0], [2.9, 0.95, 0], [1.9, 2.25, Math.PI], [2.9, 2.25, Math.PI]]) chair(g, x, z, ry);
    for (const [x, z, c] of [[2.2, 1.7, 0xffffff], [2.7, 1.75, 0xfef9c3]]) { const b = box(0.32, 0.02, 0.22, c, g, x, 0.8, z, 0.005); b.rotation.y = 0.2; }
    put(g, 'globe', 3.2, 0.79, 1.85, 0, 0.7); windowOn(g, R.left + 0.02, 1.9, -1.8, 1.0, 1.2, 0xffe8b8, Math.PI / 2);
    // rolling ladder against the shelves + a rug + plants
    const ld = new T.Group(); ld.position.set(-1.0, 0, R.back + 0.6); ld.rotation.x = -0.18; g.add(ld); for (const sx of [-0.22, 0.22]) box(0.05, 2.5, 0.05, 0x6b4a2e, ld, sx, 1.25, 0, 0.01); for (let i = 0; i < 7; i++) box(0.44, 0.04, 0.05, 0x6b4a2e, ld, 0, 0.3 + i * 0.32, 0, 0.01);
    const rug = mesh(new T.PlaneGeometry(2.4, 1.6), mat(0x9f1239, { roughness: 1 }), g, -0.6, 0.006, 1.2); rug.rotation.x = -Math.PI / 2; rug.castShadow = false;
    plant(g, 4.0, -1.8); for (const x of [-2.5, 0, 2.5]) ceilingLight(g, x, 3.35, 0.4, 1.2);
    return { group: g, size: [9, 3.4, 6] };
  }

  // ---------- 10. Playground at night ----------
  function nightGroundSet() {
    const g = new T.Group(); grass(g, 18, 14, '#4f7a4a'); path(g, 18, 1.4, 0, 2.6, '#9c8f74');
    put(g, 'bench', 0, 0, 0) || box(1.6, 0.45, 0.45, 0x8a5a33, g, 0, 0.225, 0, 0.02);
    swingSet(g, -4.2, -2.6, 0.2); put(g, 'tree_oak', 3.6, 0, -3.2, 0, 0.7); put(g, 'tree_pine', -6.5, 0, -4.5, 0, 0.6); put(g, 'tree_birch', 6.4, 0, -1.0, 0, 0.6); put(g, 'bush', -2.4, 0, -1.8); put(g, 'bush', 2.0, 0, -1.7);
    lampPost(g, -1.6, -0.8, true); lampPost(g, 4.8, 1.8, true);
    // the moon and stars
    const moon = mesh(new T.SphereGeometry(1.4, 32, 24), new T.MeshBasicMaterial({ color: 0xfff6d5, fog: false }), g, -6, 12, -28); moon.castShadow = false; moon.userData.sky = true;
    const halo = mesh(new T.SphereGeometry(2.2, 24, 16), new T.MeshBasicMaterial({ color: 0xfff1c1, transparent: true, opacity: 0.12, fog: false, depthWrite: false }), g, -6, 12, -28.5); halo.castShadow = false; halo.userData.sky = true;
    const r = seeded(41), sg = new T.BufferGeometry(), sp = []; for (let i = 0; i < 400; i++) sp.push((r() - 0.5) * 80, 6 + r() * 22, -18 - r() * 20); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
    { const st = new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 0.14, fog: false })); st.userData.sky = true; g.add(st); }
    // fireflies that blink
    const ff = []; for (let i = 0; i < 24; i++) { const m = mesh(new T.SphereGeometry(0.025, 8, 6), new T.MeshStandardMaterial({ color: 0xeaff8a, emissive: 0xd9ff5a, emissiveIntensity: 3 }), g, (r() - 0.5) * 8, 0.4 + r() * 1.4, -3 + r() * 5); m.castShadow = false; ff.push([m, m.position.clone(), r() * 6]); }
    g.userData.tick = (t) => { for (const [m, p, ph] of ff) { m.position.set(p.x + Math.sin(t * 0.7 + ph) * 0.25, p.y + Math.sin(t * 1.1 + ph * 2) * 0.12, p.z + Math.cos(t * 0.6 + ph) * 0.2); m.material.emissiveIntensity = 1 + 2.5 * Math.max(0, Math.sin(t * 2.2 + ph * 3)); } };
    // the fence and a far wall so the night has an edge
    for (let i = -8; i <= 8; i++) box(0.08, 0.7, 0.06, 0xb8b2a8, g, i * 1.0, 0.35, -6.8, 0.01); box(17, 0.07, 0.04, 0xb8b2a8, g, 0, 0.55, -6.78, 0.01);
    return { group: g, size: [18, 6, 14] };
  }

  // ---------- places from the resume island (they use the ported props by category, so they fill in automatically) ----------
  const ofCat = (cat, re = null) => ZAssets.list.filter((a) => a.cat === cat && (!re || re.test(a.id))).map((a) => a.id);
  function sea(g, w, d, z) {   // shallow sea with moving foam lines at the shore
    const wm = new T.MeshStandardMaterial({ color: 0x38b6d6, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.92 });
    const geo = new T.PlaneGeometry(w, d, 60, 20); const water = mesh(geo, wm, g, 0, 0.02, z - d / 2); water.rotation.x = -Math.PI / 2; water.receiveShadow = true; water.castShadow = false;
    const base = geo.attributes.position.array.slice(), foam = [];
    for (let i = 0; i < 3; i++) { const f = mesh(new T.PlaneGeometry(w, 0.18), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, roughness: 0.6 }), g, 0, 0.03, z - 0.2 - i * 0.8); f.rotation.x = -Math.PI / 2; f.castShadow = false; foam.push(f); }
    return (t) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(base[i * 3] * 0.7 + t * 1.4) * 0.05 + Math.cos(base[i * 3 + 1] * 0.9 + t * 1.1) * 0.04); p.needsUpdate = true;
      foam.forEach((f, i) => { const k = ((t * 0.25 + i / 3) % 1); f.position.z = z - 2.4 + k * 2.3; f.material.opacity = 0.75 * Math.sin(k * Math.PI); }); };
  }
  function beachSet() {
    const g = new T.Group(); path(g, 22, 9, 0, 2.5, '#f2d9a6');
    const ticks = [sea(g, 30, 14, -2.0)];
    put(g, 'palm_tree', -6.5, 0, 0.5, 0, 0.75); put(g, 'palm_tree', 7.0, 0, 2.0, 0.6, 0.7); put(g, 'palm_tree', 9.5, 0, -0.5, 1.2, 0.8);
    const bp = ofCat('beach'); let x = -4.5; put(g, 'sunrise_point_deck', -13.5, 0, 0.5, 0.5);
    for (const id of bp) { if (/water|sea|shore|sand|deck|river/.test(id)) continue; const o = put(g, id, x, 0, -0.2 + (Math.abs(x) % 2), 0.3); if (o) x += Math.max(1.6, new T.Box3().setFromObject(o).getSize(new T.Vector3()).x + 0.5); if (x > 6) break; }
    const net = ofCat('sports', /badminton.*net|net.*badminton/)[0]; if (net) put(g, net, 6.5, 0, 0.6, Math.PI / 2);
    put(g, 'clouds', 0, 3.5, -10, 0, 1.6); put(g, 'birds_wire', -9, 0, 4.5, 0.5);
    g.userData.tick = (t) => ticks.forEach((f) => f(t));
    return { group: g, size: [22, 4, 14] };
  }
  function marketSet() {
    const g = new T.Group(); path(g, 24, 14, 0, 0, '#d8c39a'); path(g, 24, 3.2, 0, 0.8, '#bba98a');
    const stalls = ofCat('street', /^stall_(?!lantern)/);
    stalls.forEach((id, i) => { const back = i % 2 === 0, k = Math.floor(i / 2); const x = -9 + k * 3.2; if (x > 10) return; put(g, id, back ? x : x + 1.6, 0, back ? -3.2 : -6.4, 0); });
    const lights = ofCat('street', /string_lights/); if (lights[0]) put(g, lights[0], 0, 0, -1.4, 0); else for (let i = 0; i < 4; i++) stringLights(g, -10 + i * 5, -5 + i * 5, 3.2, -1.6, 0.3);
    put(g, 'market_arch', 0, 0, -9.5, 0, 0.8);
    const lamp = ofCat('street', /lamp/)[0]; for (const lx of [-10, 10]) lamp ? put(g, lamp, lx, 0, 2.2, 0) : lampPost(g, lx, 2.2, false);
    const bench = ofCat('street', /bench/)[0] || 'bench'; put(g, bench, 5.5, 0, 2.8, Math.PI);
    return { group: g, size: [24, 4, 14] };
  }
  function villageSet() {
    const g = new T.Group(); grass(g, 24, 16, '#86c06e'); path(g, 24, 2.4, 0, 1.0, '#cdb489');
    const homes = ofCat('village', /home|house/), huts = ofCat('village', /hut/), rest = ofCat('village', /fence/);
    homes.forEach((id, i) => put(g, id, -9 + i * 4.2, 0, -4.2, 0)); huts.forEach((id, i) => put(g, id, 2 + i * 3.4, 0, -4.0, 0));
    rest.forEach((id, i) => put(g, id, -8 + i * 2.5, 0, -1.6, 0));
    put(g, 'tree_oak', -10, 0, 3.5, 0, 0.6); put(g, 'palm_tree', 10, 0, 3.0, 0, 0.6); put(g, 'tree_maple', 6, 0, -8, 0, 0.6); put(g, 'flowers', -2.5, 0, 2.6); put(g, 'bush', 3.5, 0, 2.8);
    return { group: g, size: [24, 5, 16] };
  }
  function campSet() {
    const g = new T.Group(); grass(g, 18, 14, '#6fae5c');
    const fire = ofCat('camping', /fire/)[0]; if (fire) { const f = put(g, fire, 0, 0, -0.9, 0); if (f && f.userData.setOn) f.userData.setOn(true); }
    else { for (let i = 0; i < 6; i++) { const lg = cyl(0.05, 0.05, 0.6, 0x7c4a2a, g, 0, 0.08, -0.9, 8); lg.rotation.set(Math.PI / 2, i, 0.3); } mesh(new T.ConeGeometry(0.22, 0.6, 10), new T.MeshStandardMaterial({ color: 0xffb347, emissive: 0xff7a1a, emissiveIntensity: 3 }), g, 0, 0.35, -0.9); }
    const tents = ofCat('camping', /tent/); [[-3.2, -3.4, 0.4], [3.4, -3.2, -0.4], [0, -4.6, 0], [-5.4, -0.6, 0.9]].forEach(([x, z, r], i) => { if (tents.length) put(g, tents[i % tents.length], x, 0, z, r); });
    for (const [x, z, r] of [[-1.3, -0.3, 0.9], [1.3, -0.3, -0.9]]) { const lg = cyl(0.13, 0.13, 1.0, 0x8a5a33, g, x, 0.13, z, 12); lg.rotation.set(0, r, Math.PI / 2); }
    put(g, 'tree_pine', -7, 0, -5, 0, 0.6); put(g, 'tree_pine', 6.5, 0, -5.5, 0, 0.55); put(g, 'tree_pine', 7.5, 0, 1.0, 0, 0.5); put(g, 'tree_birch', -7.5, 0, 2.5, 0, 0.5);
    const r = seeded(51), sg = new T.BufferGeometry(), sp = []; for (let i = 0; i < 300; i++) sp.push((r() - 0.5) * 70, 9 + r() * 18, -18 - r() * 18); sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
    { const st = new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 0.13, fog: false })); st.userData.sky = true; g.add(st); }
    return { group: g, size: [18, 5, 14] };
  }
  function sportsSet() {
    const g = new T.Group(); grass(g, 26, 18, '#5fae4f');
    const lines = new T.MeshBasicMaterial({ color: 0xffffff }); for (const [w, d, x, z] of [[18, 0.08, 0, -6], [18, 0.08, 0, 4], [0.08, 10, -9, -1], [0.08, 10, 9, -1], [0.08, 10, 0, -1]]) { const l = mesh(new T.PlaneGeometry(w, d), lines, g, x, 0.01, z); l.rotation.x = -Math.PI / 2; l.castShadow = false; }
    const ring = mesh(new T.RingGeometry(1.5, 1.58, 48), lines, g, 0, 0.01, -1); ring.rotation.x = -Math.PI / 2;
    const sp = ofCat('sports'); let x = -8;
    for (const id of sp) { if (/badminton|racket|shuttle|ball$/.test(id)) continue; const o = put(g, id, x, 0, -7.5, 0); if (o) x += Math.max(1.5, new T.Box3().setFromObject(o).getSize(new T.Vector3()).x + 0.6); if (x > 11) break; }
    const goal = ofCat('sports', /goal/)[0]; if (goal) { put(g, goal, -9.5, 0, -1, Math.PI / 2); put(g, goal, 9.5, 0, -1, -Math.PI / 2); }
    put(g, 'football', 0.5, 0, 0.6);
    return { group: g, size: [26, 6, 18] };
  }
  function caveSet() {
    const g = new T.Group(); const fl = mesh(new T.CircleGeometry(12, 40), mat(0x3b3a46, { roughness: 1 }), g, 0, 0.004, 0); fl.rotation.x = -Math.PI / 2;
    const r = seeded(61), rockM = mat(0x4b4858, { roughness: 1, flatShading: true });
    for (let i = 0; i < 26; i++) { const a = -Math.PI * 0.95 + (i / 25) * Math.PI * 0.9 - Math.PI * 0.025, rad = 7 + r() * 2.5, sz = 1.4 + r() * 2.2; const rk = mesh(new T.DodecahedronGeometry(sz, 0), rockM, g, Math.cos(a) * rad, sz * 0.5, Math.sin(a) * rad); rk.rotation.set(r() * 3, r() * 3, r() * 3); rk.scale.y = 1.3 + r(); }
    for (let i = 0; i < 18; i++) { const x = (r() - 0.5) * 14, z = -7 + r() * 6, h = 0.6 + r() * 2.4; mesh(new T.ConeGeometry(0.25 + r() * 0.3, h, 7), rockM, g, x, h / 2, z); const sh = 0.5 + r() * 1.6; const st = mesh(new T.ConeGeometry(0.2 + r() * 0.2, sh, 7), rockM, g, x * 0.9, 6 - sh / 2, z); st.rotation.x = Math.PI; }
    const cv = ofCat('cave', /crystal|mushroom|stalagmite/).filter((id) => !/hologram/.test(id)); cv.forEach((id, i) => put(g, id, -5 + (i % 6) * 2, 0, -3.6 - Math.floor(i / 6) * 1.8, i * 0.7, 0.8));
    const lake = ofCat('cave', /glow_lake/)[0]; if (lake) put(g, lake, 4.5, 0, -5.5, 0, 0.5);
    if (!cv.length) for (let i = 0; i < 10; i++) { const c = [0x7c3aed, 0x38bdf8, 0xec4899][i % 3]; const cr = mesh(new T.OctahedronGeometry(0.25 + r() * 0.3, 0), new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.6, roughness: 0.2 }), g, (r() - 0.5) * 10, 0.3, -3 - r() * 4); cr.scale.y = 2; }
    const sp = ofCat('sky', /spore|firefl/)[0]; if (sp) put(g, sp, 0, 0.5, -2);
    const roof = mesh(new T.SphereGeometry(13, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0x24222c, side: T.BackSide, roughness: 1 }), g, 0, 0, 0); roof.scale.y = 0.55; roof.castShadow = false; roof.userData.sky = true;
    return { group: g, size: [24, 7, 14] };
  }

  ZAssets.register('sets', 'beach_set', 'Beach (set)', beachSet, ['set', 'beach', 'sea', 'outdoor', 'waves']);
  ZAssets.register('sets', 'market_set', 'Market street (set)', marketSet, ['set', 'market', 'stalls', 'street', 'outdoor']);
  ZAssets.register('sets', 'village_set', 'Village (set)', villageSet, ['set', 'village', 'huts', 'homes', 'outdoor']);
  ZAssets.register('sets', 'camp_set', 'Campsite at dusk (set)', campSet, ['set', 'camp', 'campfire', 'tents', 'outdoor', 'evening']);
  ZAssets.register('sets', 'sports_set', 'Sports ground (set)', sportsSet, ['set', 'sports', 'football', 'outdoor']);
  ZAssets.register('sets', 'cave_set', 'Cave (set)', caveSet, ['set', 'cave', 'crystals', 'dark']);
  ZAssets.register('sets', 'bank_set', 'Bank (set)', bankSet, ['set', 'bank', 'indoor', 'counter', 'atm']);
  ZAssets.register('sets', 'kitchen_set', 'Kitchen (set)', kitchenSet, ['set', 'kitchen', 'home', 'indoor']);
  ZAssets.register('sets', 'bedroom_set', 'Bedroom (set)', bedroomSet, ['set', 'bedroom', 'home', 'indoor']);
  ZAssets.register('sets', 'park_set', 'Park (set)', parkSet, ['set', 'park', 'outdoor', 'swings', 'slide']);
  ZAssets.register('sets', 'supermarket_set', 'Supermarket (set)', supermarketSet, ['set', 'supermarket', 'shop', 'indoor']);
  ZAssets.register('sets', 'street_set', 'Street + bus stop (set)', streetSet, ['set', 'street', 'road', 'bus stop', 'outdoor']);
  ZAssets.register('sets', 'party_set', 'Birthday party room (set)', partySet, ['set', 'party', 'birthday', 'indoor']);
  ZAssets.register('sets', 'festival_set', 'Festival street — Diwali evening (set)', festivalSet, ['set', 'festival', 'diwali', 'temple', 'outdoor', 'evening']);
  ZAssets.register('sets', 'library_set', 'Library (set)', librarySet, ['set', 'library', 'books', 'indoor']);
  ZAssets.register('sets', 'night_ground_set', 'Playground at night (set)', nightGroundSet, ['set', 'night', 'playground', 'outdoor', 'stars']);
})();
