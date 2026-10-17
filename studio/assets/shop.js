/* Zungga Story Studio — shop props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box, logoTex, mascotTex, decal, label, cyl, sphere } = ZA;
  function shopCounter() {   // the stationery shop
    const g = new T.Group(), W = 1.6, H = 1.0, D = 0.6;
    box(W, H, D, Z.wood, g, 0, H / 2, 0, 0.02);
    box(W + 0.06, 0.04, D + 0.06, Z.woodDark, g, 0, H + 0.02, 0, 0.01);
    const front = tex((c, Wd, Hd) => { c.fillStyle = hex(Z.orange); c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 120px ${FONT}`; c.fillText('Pens · Pencils · Books', Wd / 2, Hd / 2); }, 1600, 300);
    mesh(new T.PlaneGeometry(W * 0.92, 0.2), new T.MeshStandardMaterial({ map: front }), g, 0, 0.78, D / 2 + 0.001);
    // glass display case on the counter
    const caseG = new T.Group(); caseG.position.set(0.4, H + 0.04, 0); g.add(caseG);
    mesh(new T.BoxGeometry(0.6, 0.25, 0.4), glassMat(), caseG, 0, 0.125, 0).castShadow = false;
    for (let i = 0; i < 6; i++) box(0.06, 0.03 + (i % 3) * 0.02, 0.1, [Z.pink, Z.blue, Z.green][i % 3], caseG, -0.22 + i * 0.09, 0.03, 0, 0.004);   // erasers / sharpeners
    // pencil jar + price card
    const jar = new T.Group(); jar.position.set(-0.5, H + 0.04, 0.05); g.add(jar);
    mesh(new T.CylinderGeometry(0.05, 0.045, 0.11, 24, 1, true), glassMat({ side: T.DoubleSide }), jar, 0, 0.055, 0).castShadow = false;
    for (let i = 0; i < 9; i++) { const p = ZAssets.build('pencil').group; p.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.3; p.rotation.y = i; p.position.set(Math.cos(i * 2.1) * 0.02, 0.09, Math.sin(i * 2.1) * 0.02); jar.add(p); }
    const card = tex((c, Wd, Hd) => { c.fillStyle = '#fff'; c.fillRect(0, 0, Wd, Hd); c.strokeStyle = hex(Z.ink); c.lineWidth = 8; c.strokeRect(6, 6, Wd - 12, Hd - 12); c.fillStyle = hex(Z.ink); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 70px ${FONT}`; c.fillText('Pencil ₹3', Wd / 2, Hd / 2); }, 512, 200);
    const cardM = mesh(new T.PlaneGeometry(0.16, 0.063), new T.MeshStandardMaterial({ map: card, side: T.DoubleSide }), g, -0.32, H + 0.08, 0.15); cardM.rotation.x = -0.4;
    // back shelf + signboard
    box(W, 1.5, 0.04, Z.woodDark, g, 0, 1.25, -1.03, 0.01);                                                          // open shelf: back panel
    for (const x of [-W / 2, W / 2]) box(0.04, 1.5, 0.3, Z.woodDark, g, x, 1.25, -0.89, 0.01);                     // sides
    for (let s = 0; s < 4; s++) box(W, 0.03, 0.3, Z.woodDark, g, 0, 0.52 + s * 0.38, -0.89, 0.006);               // shelves
    for (let s = 0; s < 3; s++) for (let i = 0; i < 9; i++) { const h = 0.2 + ((i * 7 + s * 3) % 5) * 0.025; box(0.13, h, 0.2, [Z.blue, Z.pink, Z.yellow, Z.green, Z.purple][(i + s) % 5], g, -0.68 + i * 0.17, 0.535 + s * 0.38 + h / 2, -0.88, 0.008); }
    const sign = tex((c, Wd, Hd) => { const gr = c.createLinearGradient(0, 0, Wd, 0); gr.addColorStop(0, hex(Z.purple)); gr.addColorStop(1, hex(Z.pink)); c.fillStyle = gr; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 150px ${FONT}`; c.fillText('STATIONERY', Wd / 2, Hd / 2); }, 1600, 300);
    box(W + 0.2, 0.34, 0.06, Z.purple, g, 0, 2.05, -0.9, 0.01);
    mesh(new T.PlaneGeometry(W + 0.12, 0.28), new T.MeshStandardMaterial({ map: sign }), g, 0, 2.05, -0.865);
    return { group: g, phys: { shape: 'box', size: [W, H + 0.04, D], mass: 0, yOffset: (H + 0.04) / 2 }, top: H + 0.04 };
  }
  ZAssets.register('shop', 'shop_counter', 'Stationery shop counter', shopCounter, ["shop", "counter", "stationery"]);
  /* ------------------------------------------------------------------ more shop props ------------------------------------------------------------------ */
  const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const std = (o) => new T.MeshStandardMaterial({ roughness: 0.7, ...o });
  const plane = (map, w, h, parent, x = 0, y = 0, z = 0, o = {}) => { const m = mesh(new T.PlaneGeometry(w, h), std({ map, ...o }), parent, x, y, z); m.castShadow = false; return m; };
  function inst(geo, m, items, parent) {   // items: { p:[x,y,z], r:[x,y,z], s:[x,y,z], c }
    const im = new T.InstancedMesh(geo, m, items.length), o = new T.Object3D(), col = new T.Color();
    items.forEach((it, i) => { o.position.set(...it.p); o.rotation.set(...(it.r || [0, 0, 0])); o.scale.set(...(it.s || [1, 1, 1])); o.updateMatrix(); im.setMatrixAt(i, o.matrix); if (it.c != null) im.setColorAt(i, col.set(it.c)); });
    im.castShadow = im.receiveShadow = true; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    if (im.computeBoundingBox) im.computeBoundingBox(); if (im.computeBoundingSphere) im.computeBoundingSphere();
    parent.add(im); return im;
  }
  const txt = (c, s, x, y, size, col = '#1f1a33', weight = 700, align = 'center', maxW = 0) => { c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle'; c.font = `${weight} ${size}px ${FONT}`; if (maxW) fitText(c, s, maxW, size, weight); c.fillText(s, x, y); };
  const PACK_COLS = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x38bdf8, 0x7c3aed, 0xec4899, 0x14b8a6, 0xa16207, 0x2563eb];
  // generic packet / label textures (greyscale; tinted by instance colour)
  const packTex = () => tex((c, W, H) => { c.fillStyle = '#d8d8d8'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(W / 2, H * 0.48, W * 0.36, H * 0.2, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8a8a8a'; c.fillRect(0, H * 0.8, W, H * 0.2); c.fillStyle = '#f2f2f2'; c.fillRect(W * 0.15, H * 0.12, W * 0.7, H * 0.1); c.fillStyle = '#b0b0b0'; for (let i = 0; i < 3; i++) c.fillRect(W * 0.3, H * 0.4 + i * H * 0.06, W * 0.4, H * 0.025); }, 256, 256);
  const bandTex = () => tex((c, W, H) => { c.fillStyle = '#9a9a9a'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffffff'; c.fillRect(0, H * 0.3, W, H * 0.4); c.fillStyle = '#c4c4c4'; for (let i = 0; i < 4; i++) c.fillRect(i * W / 4 + W * 0.05, H * 0.42, W * 0.12, H * 0.16); }, 256, 256);
  function bottleGeo() { const pts = [[0, 0], [0.034, 0], [0.036, 0.01], [0.036, 0.6], [0.03, 0.72], [0.014, 0.82], [0.012, 0.95], [0, 0.95]].map(([x, y]) => new T.Vector2(x, y * 0.26)); return new T.LatheGeometry(pts, 20); }

  // ---- 2 m metal grocery rack, stocked with generic packets / jars / bottles (InstancedMesh) ----
  function groceryShelf() {
    const g = new T.Group(), W = 1.2, H = 2.0, D = 0.45, rnd = seeded(23);
    const frame = mat(0x5b6b8c, { metalness: 0.35, roughness: 0.45 }), shelfM = mat(0xdfe4ea, { metalness: 0.3, roughness: 0.4 });
    for (const x of [-W / 2, W / 2]) for (const z of [-D / 2, D / 2]) mesh(roundBox(0.035, H, 0.035, 0.006), frame, g, x, H / 2, z);
    const peg = tex((c, Wd, Hd) => { c.fillStyle = '#e9edf2'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#b9c1cc'; for (let y = 12; y < Hd; y += 24) for (let x = 12; x < Wd; x += 24) { c.beginPath(); c.arc(x, y, 3.5, 0, Math.PI * 2); c.fill(); } }, 512, 853);
    mesh(new T.BoxGeometry(W, H - 0.05, 0.01), std({ map: peg }), g, 0, H / 2, -D / 2 + 0.01);
    const tags = tex((c, Wd, Hd) => { c.fillStyle = '#fef3c7'; c.fillRect(0, 0, Wd, Hd); const p = ['₹20', '₹45', '₹10', '₹99', '₹35', '₹60']; for (let i = 0; i < 6; i++) { c.fillStyle = '#fff'; c.fillRect(i * Wd / 6 + 14, 6, Wd / 6 - 28, Hd - 12); txt(c, p[i], i * Wd / 6 + Wd / 12, Hd / 2 + 2, Hd * 0.62, '#b91c1c'); } }, 1024, 64);
    const ys = [0.1, 0.5, 0.9, 1.3, 1.7], pack = [], jar = [], lid = [], bot = [], cap = [];
    for (const y of ys) {
      mesh(roundBox(W, 0.03, D, 0.006), shelfM, g, 0, y, 0);
      plane(tags, W - 0.04, 0.045, g, 0, y - 0.005, D / 2 + 0.017);
      let x = -W / 2 + 0.04;
      while (x < W / 2 - 0.1) {
        const k = rnd(), col = PACK_COLS[Math.floor(rnd() * PACK_COLS.length)], n = 2 + Math.floor(rnd() * 3);
        if (k < 0.45) {        // packets / boxes
          const w = 0.08 + rnd() * 0.05, h = 0.15 + rnd() * 0.13, d = 0.06 + rnd() * 0.03;
          for (let i = 0; i < n && x + w < W / 2 - 0.02; i++, x += w + 0.008) for (let row = 0; row < 2; row++) pack.push({ p: [x + w / 2, y + 0.015 + h / 2, D / 2 - 0.03 - d / 2 - row * (d + 0.02)], s: [w, h, d], r: [0, (rnd() - 0.5) * 0.08, 0], c: col });
        } else if (k < 0.72) { // jars
          const r = 0.035 + rnd() * 0.015, h = 0.09 + rnd() * 0.06, lc = [0xd4a017, 0xdc2626, 0xf8fafc, 0x16a34a][Math.floor(rnd() * 4)];
          for (let i = 0; i < n + 1 && x + 2 * r < W / 2 - 0.02; i++, x += 2 * r + 0.008) for (let row = 0; row < 2; row++) { const z = D / 2 - 0.03 - r - row * (2 * r + 0.02); jar.push({ p: [x + r, y + 0.015 + h / 2, z], s: [r, h, r], c: col }); lid.push({ p: [x + r, y + 0.015 + h + 0.008, z], s: [r * 1.04, 0.016, r * 1.04], c: lc }); }
        } else {               // bottles
          const sc = 0.85 + rnd() * 0.25, h = 0.26 * sc;
          for (let i = 0; i < n + 1 && x + 0.075 * sc < W / 2 - 0.02; i++, x += 0.075 * sc + 0.006) for (let row = 0; row < 2; row++) { const z = D / 2 - 0.05 - row * 0.09; bot.push({ p: [x + 0.037 * sc, y + 0.015, z], s: [sc, sc, sc], c: col }); cap.push({ p: [x + 0.037 * sc, y + 0.015 + h * 0.95 + 0.008, z], s: [0.014 * sc, 0.018, 0.014 * sc], c: [0xf8fafc, 0xdc2626, 0x1d4ed8][i % 3] }); }
        }
        x += 0.015;
      }
    }
    inst(new T.BoxGeometry(1, 1, 1), std({ map: packTex(), roughness: 0.6 }), pack, g);
    inst(new T.CylinderGeometry(1, 1, 1, 20), std({ map: bandTex(), roughness: 0.25 }), jar, g);
    inst(new T.CylinderGeometry(1, 1, 1, 20), mat(0xffffff, { roughness: 0.4, metalness: 0.2 }), lid.concat(cap), g);
    inst(bottleGeo(), std({ map: bandTex(), roughness: 0.2 }), bot, g);
    return { group: g, top: H };
  }

  // ---- cash register: setOn(true) = drawer slides open showing notes and coins ----
  function cashRegister() {
    const g = new T.Group(), shell = 0xe6e9ef, dark = 0x3a3f4b;
    box(0.42, 0.11, 0.42, dark, g, 0, 0.055, 0, 0.012);
    const dr = new T.Group(); g.add(dr);
    box(0.4, 0.085, 0.014, 0x4b5160, dr, 0, 0.055, 0.215, 0.004);
    box(0.12, 0.014, 0.01, 0x1f2229, dr, 0, 0.07, 0.224, 0.003);
    box(0.36, 0.008, 0.34, 0x262a33, dr, 0, 0.02, 0.04, 0.002);
    for (const x of [-0.18, -0.09, 0, 0.09, 0.18]) box(0.006, 0.05, 0.34, 0x2f343f, dr, x, 0.045, 0.04, 0.002);
    box(0.36, 0.05, 0.006, 0x2f343f, dr, 0, 0.045, 0.1, 0.002);
    const notes = [100, 50, 20, 10];
    notes.forEach((v, i) => { for (let k = 0; k < 3; k++) { if (!ZAssets.has('note_' + v)) break; const n = ZAssets.build('note_' + v).group; n.rotation.y = Math.PI / 2 + (k - 1) * 0.04; n.position.set(-0.135 + i * 0.09, 0.025 + k * 0.004, 0.02); n.scale.setScalar(0.6); dr.add(n); } });
    const coinM = mat(0xd9a521, { metalness: 0.45, roughness: 0.35 }), silver = mat(0xc9d1db, { metalness: 0.45, roughness: 0.35 });
    for (let i = 0; i < 4; i++) for (let k = 0; k < 5; k++) mesh(new T.CylinderGeometry(0.012, 0.012, 0.0022, 20), i % 2 ? silver : coinM, dr, -0.135 + i * 0.09 + (k % 2) * 0.012, 0.026 + k * 0.0023, 0.15 + (k % 3) * 0.008);
    // upper housing, keypad, printer slot
    box(0.4, 0.09, 0.3, shell, g, 0, 0.155, -0.05, 0.015);
    const kp = new T.Group(); kp.position.set(0, 0.2, 0.06); kp.rotation.x = 0.32; g.add(kp);
    box(0.36, 0.02, 0.17, shell, kp, 0, 0, 0, 0.008);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const col = c >= 4 ? [0xfacc15, 0x22c55e, 0xef4444, 0x38bdf8][r] : 0xf8fafc; box(0.04, 0.012, 0.028, col, kp, -0.13 + c * 0.052, 0.014, -0.055 + r * 0.037, 0.004); }
    mesh(new T.BoxGeometry(0.12, 0.006, 0.01), mat(0x111111), g, -0.1, 0.2, -0.17);
    const paper = mesh(new T.PlaneGeometry(0.06, 0.08, 1, 6), std({ color: 0xffffff, side: T.DoubleSide }), g, -0.1, 0.24, -0.17);
    const pp = paper.geometry.attributes.position; for (let i = 0; i < pp.count; i++) { const yy = pp.getY(i) + 0.04; pp.setZ(i, -yy * yy * 5); } paper.geometry.computeVertexNormals();
    const tag = label('ZUNGGA', { w: 512, h: 96, bg: '#7c3aed', fg: '#ffffff', size: 70, radius: 20 });
    plane(tag, 0.16, 0.03, g, 0, 0.14, 0.101);
    // customer display on a post
    cyl(0.012, 0.012, 0.12, 0x9aa3ae, g, 0.12, 0.25, -0.13);
    const disp = new T.Group(); disp.position.set(0.12, 0.33, -0.13); disp.rotation.x = -0.15; g.add(disp);
    box(0.17, 0.07, 0.03, dark, disp, 0, 0, 0, 0.008);
    const lcd = (s) => tex((c, W, H) => { c.fillStyle = '#10301f'; c.fillRect(0, 0, W, H); txt(c, s, W - 24, H / 2 + 4, H * 0.6, '#5cff9d', 700, 'right'); }, 512, 160);
    const lOff = lcd('₹ 0.00'), lOn = lcd('₹ 250.00');
    const screen = plane(lOff, 0.15, 0.05, disp, 0, 0, 0.0155, { emissive: 0xffffff, emissiveIntensity: 0.6 });
    g.userData.setOn = (on) => { dr.position.z = on ? 0.24 : 0; screen.material.map = screen.material.emissiveMap = on ? lOn : lOff; screen.material.needsUpdate = true; };
    g.userData.setOn(false);
    return { group: g, top: 0.11 };
  }

  // ---- digital shop scale: setOn(true) = tomatoes on the pan, display shows 1.250 kg ----
  function weighingScale() {
    const g = new T.Group();
    box(0.3, 0.07, 0.3, 0xf1f3f6, g, 0, 0.035, 0, 0.015);
    box(0.24, 0.05, 0.03, 0x2b2f3a, g, 0, 0.04, 0.14, 0.008);
    const lcd = (kg, rs) => tex((c, W, H) => { c.fillStyle = '#c5e8a0'; c.fillRect(0, 0, W, H); c.fillStyle = '#20301a'; c.textBaseline = 'middle'; c.textAlign = 'left'; c.font = `600 ${H * 0.18}px ${FONT}`; c.fillText('KG', 20, H * 0.25); c.fillText('₹', W * 0.62, H * 0.25);
      txt(c, kg, W * 0.56, H * 0.62, H * 0.5, '#20301a', 700, 'right'); txt(c, rs, W - 16, H * 0.62, H * 0.42, '#20301a', 700, 'right'); }, 768, 200);
    const off = lcd('0.000', '0.00'), on = lcd('1.250', '50.00');
    const scr = plane(off, 0.2, 0.034, g, -0.0, 0.045, 0.156, { emissive: 0xffffff, emissiveIntensity: 0.35 });
    [0xef4444, 0x22c55e, 0xf8fafc].forEach((c, i) => cyl(0.006, 0.006, 0.006, c, g, -0.06 + i * 0.06, 0.017, 0.156).rotation.x = Math.PI / 2);
    cyl(0.03, 0.04, 0.02, 0x9aa3ae, g, 0, 0.078, 0);
    mesh(roundBox(0.28, 0.012, 0.26, 0.004), mat(0xd7dde4, { metalness: 0.5, roughness: 0.3 }), g, 0, 0.094, 0);
    const lab = label('ZUNGGA SCALE', { w: 512, h: 80, bg: '#f1f3f6', fg: '#7c3aed', size: 54 });
    plane(lab, 0.12, 0.019, g, 0, 0.012, 0.1505);
    const load = new T.Group(); load.position.y = 0.1; g.add(load);
    const tm = mat(0xe53935, { roughness: 0.35 }), rnd = seeded(5);
    for (let i = 0; i < 9; i++) { const a = i * 2.4, rr = i < 6 ? 0.05 : 0.02, t = sphere(0.03, 0xe53935, load, Math.cos(a) * rr, 0.027 + (i < 6 ? 0 : 0.035), Math.sin(a) * rr); t.material = tm; t.scale.y = 0.85; cyl(0.006, 0.002, 0.008, 0x2e7d32, load, t.position.x, t.position.y + 0.026, t.position.z, 8); }
    g.userData.setOn = (o) => { load.visible = !!o; scr.material.map = scr.material.emissiveMap = o ? on : off; scr.material.needsUpdate = true; };
    g.userData.setOn(false);
    return { group: g, top: 0.1 };
  }

  // ---- plastic shopping basket with handles and a few items ----
  function shoppingBasket() {
    const g = new T.Group(), red = 0xe11d48, H = 0.22, tilt = 0.136;
    const holes = tex((c, W, Hd) => { c.fillStyle = '#fff'; c.fillRect(0, 0, W, Hd); for (let y = Hd * 0.16; y < Hd * 0.86; y += Hd * 0.12) for (let x = W * 0.04; x < W * 0.96 - 20; x += W * 0.065) c.clearRect(x, y, W * 0.045, Hd * 0.08); }, 512, 256);
    const wm = mat(red, { alphaMap: holes, alphaTest: 0.5, side: T.DoubleSide, roughness: 0.45 });
    for (const [ang, dist, w] of [[0, 0.135, 0.39], [Math.PI, 0.135, 0.39], [Math.PI / 2, 0.195, 0.27], [-Math.PI / 2, 0.195, 0.27]]) {
      const p = new T.Group(); p.rotation.y = ang; g.add(p);
      const m = mesh(new T.PlaneGeometry(w, H + 0.004), wm, p, 0, H / 2, dist); m.rotation.x = tilt;
    }
    box(0.36, 0.012, 0.24, red, g, 0, 0.006, 0, 0.004);
    for (const [w, d, x, z] of [[0.44, 0.018, 0, 0.15], [0.44, 0.018, 0, -0.15], [0.018, 0.3, 0.21, 0], [0.018, 0.3, -0.21, 0]]) box(w, 0.018, d, red, g, x, H, z, 0.006);
    const hm = mat(0x1f2937, { roughness: 0.5 });
    for (const s of [1, -1]) { const h = mesh(new T.TorusGeometry(0.12, 0.008, 8, 24, Math.PI), hm, g, 0, H + 0.005, s * 0.15); h.rotation.x = -s * 0.55; }
    // items
    const bread = box(0.18, 0.1, 0.1, 0xfde68a, g, -0.08, 0.13, -0.04, 0.03); bread.rotation.z = 0.5;
    const bl = label('BREAD', { w: 256, h: 96, bg: '#f59e0b', fg: '#fff', size: 60, radius: 16 }); const bp = plane(bl, 0.08, 0.03, bread, 0, 0, 0.051);
    const b = mesh(bottleGeo(), mat(0x38bdf8, { roughness: 0.2 }), g, 0.1, 0.012, -0.05); b.rotation.z = -0.2; cyl(0.014, 0.014, 0.018, 0xf8fafc, b, 0, 0.255, 0);
    sphere(0.04, 0xdc2626, g, 0.06, 0.05, 0.06); sphere(0.04, 0x84cc16, g, 0.13, 0.05, 0.05);
    const pk = box(0.12, 0.16, 0.05, 0x7c3aed, g, -0.04, 0.09, 0.07, 0.008); pk.rotation.z = -0.15;
    plane(label('RICE', { w: 256, h: 96, bg: '#ffffff', fg: '#7c3aed', size: 60, radius: 16 }), 0.08, 0.03, pk, 0, 0.03, 0.0255);
    return { group: g };
  }

  // ---- A-frame pavement board: SALE 50% OFF ----
  function saleSign() {
    const g = new T.Group(), W = 0.6, H = 0.9, a = 0.2, top = H * Math.cos(a);
    const face = tex((c, Wd, Hd) => {
      c.fillStyle = '#fde047'; c.fillRect(0, 0, Wd, Hd);
      c.fillStyle = '#ef4444'; c.beginPath(); for (let i = 0; i < 32; i++) { const ang = i / 32 * Math.PI * 2, r = i % 2 ? Wd * 0.36 : Wd * 0.46; c.lineTo(Wd / 2 + Math.cos(ang) * r, Hd * 0.6 + Math.sin(ang) * r); } c.fill();
      txt(c, 'SALE', Wd / 2, Hd * 0.17, Wd * 0.32, '#dc2626', 700, 'center', Wd * 0.86);
      txt(c, '50%', Wd / 2, Hd * 0.56, Wd * 0.3, '#ffffff', 700, 'center', Wd * 0.7);
      txt(c, 'OFF', Wd / 2, Hd * 0.72, Wd * 0.18, '#ffffff');
      txt(c, 'ZUNGGA STORE', Wd / 2, Hd * 0.93, Wd * 0.08, '#7c3aed');
    }, 600, 900);
    for (const s of [1, -1]) {
      const b = new T.Group(); b.position.set(0, top, 0); b.rotation.x = -s * a; g.add(b);
      box(W, H, 0.025, Z.woodDark, b, 0, -H / 2, s * 0.0125, 0.008);
      const p = plane(face, W - 0.06, H - 0.06, b, 0, -H / 2, s * 0.026); if (s < 0) p.rotation.y = Math.PI;
    }
    cyl(0.012, 0.012, W + 0.02, 0x9aa3ae, g, 0, top, 0).rotation.z = Math.PI / 2;
    return { group: g };
  }

  // ---- Indian vegetable thela: wooden cart, spoked wheels, piles of veg, a hanging balance ----
  function vegetableCart() {
    const g = new T.Group(), W = 1.5, D = 0.85, top = 0.8, rnd = seeded(41);
    box(W, 0.05, D, Z.wood, g, 0, top - 0.025, 0, 0.008);
    for (const [w, d, x, z] of [[W, 0.04, 0, D / 2], [W, 0.04, 0, -D / 2], [0.04, D, W / 2, 0], [0.04, D, -W / 2, 0]]) box(w, 0.07, d, Z.woodDark, g, x, top + 0.02, z, 0.008);
    for (const z of [-0.3, 0.3]) box(W + 0.1, 0.06, 0.06, Z.woodDark, g, 0, top - 0.08, z, 0.01);
    const sack = tex((c, Wd, Hd) => { c.fillStyle = '#c8a46e'; c.fillRect(0, 0, Wd, Hd); c.strokeStyle = 'rgba(110,80,40,0.35)'; c.lineWidth = 2; for (let i = 0; i < Wd; i += 6) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, Hd); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(Wd, i); c.stroke(); } }, 512, 512);
    const sk = plane(sack, W - 0.06, D - 0.06, g, 0, top + 0.002, 0); sk.rotation.x = -Math.PI / 2; sk.receiveShadow = true;
    // wheels
    const tyre = mat(0x222222, { roughness: 0.8 }), rim = mat(0xb8c0ca, { metalness: 0.45, roughness: 0.35 }), R = 0.3;
    for (const x of [-0.5, 0.5]) for (const z of [D / 2 + 0.05, -D / 2 - 0.05]) {
      const w = new T.Group(); w.position.set(x, R, z); g.add(w);
      mesh(new T.TorusGeometry(R - 0.025, 0.025, 10, 32), tyre, w);
      mesh(new T.TorusGeometry(R - 0.05, 0.008, 6, 32), rim, w);
      const hub = mesh(new T.CylinderGeometry(0.035, 0.035, 0.06, 16), rim, w); hub.rotation.x = Math.PI / 2;
      for (let i = 0; i < 10; i++) { const sp = mesh(new T.CylinderGeometry(0.003, 0.003, R - 0.06, 5), rim, w); const a2 = i / 10 * Math.PI * 2; sp.rotation.z = a2; sp.position.set(-Math.sin(a2) * (R - 0.06) / 2, Math.cos(a2) * (R - 0.06) / 2, 0); }
    }
    for (const x of [-0.5, 0.5]) { const ax = cyl(0.02, 0.02, D + 0.14, 0x555b66, g, x, R, 0, 10); ax.rotation.x = Math.PI / 2; for (const z of [-0.3, 0.3]) box(0.05, top - 0.11 - R, 0.05, Z.woodDark, g, x, R + (top - 0.11 - R) / 2, z, 0.008); }
    for (const z of [-0.3, 0.3]) { const h = cyl(0.022, 0.022, 0.5, Z.woodDark, g, -W / 2 - 0.25, top - 0.04, z, 12); h.rotation.z = Math.PI / 2 + 0.15; }
    // piles of vegetables (instanced mounds)
    const mound = (cx, w, r, layers, jit) => { const out = []; for (let L = 0; L < layers; L++) { const hw = w / 2 - r - L * r * 1.1, hd = D / 2 - 0.05 - r - L * r * 1.1; if (hw < 0 || hd < 0) break; const st = r * 1.9; for (let x = -hw; x <= hw + 1e-6; x += st) for (let z = -hd; z <= hd + 1e-6; z += st) out.push([cx + x + (rnd() - 0.5) * jit, top + r * 0.85 + L * r * 1.45, z + (rnd() - 0.5) * jit]); } return out; };
    const sec = (W - 0.08) / 4, cx = (i) => -W / 2 + 0.04 + sec * (i + 0.5);
    inst(new T.SphereGeometry(1, 16, 12), mat(0xffffff, { roughness: 0.3 }), mound(cx(0), sec, 0.035, 4, 0.01).map((p) => ({ p, s: [0.035, 0.03, 0.035], c: rnd() < 0.15 ? 0xf97316 : 0xdc2626 })), g);
    inst(new T.SphereGeometry(1, 16, 12), mat(0xffffff, { roughness: 0.45 }), mound(cx(1), sec, 0.035, 4, 0.01).map((p) => ({ p, s: [0.036, 0.032, 0.036], r: [rnd(), rnd(), rnd()], c: rnd() < 0.5 ? 0xb83280 : 0x9d2a6a })), g);
    inst(new T.SphereGeometry(1, 14, 10), mat(0xffffff, { roughness: 0.9 }), mound(cx(2), sec, 0.038, 4, 0.012).map((p) => ({ p, s: [0.045, 0.032, 0.036], r: [0, rnd() * 3, rnd() * 0.5], c: rnd() < 0.5 ? 0xb08350 : 0x9c7244 })), g);
    const leaves = []; for (let i = 0; i < 70; i++) { const x = cx(3) + (rnd() - 0.5) * (sec - 0.08), z = (rnd() - 0.5) * (D - 0.16); leaves.push({ p: [x, top + 0.03 + rnd() * 0.06, z], r: [(rnd() - 0.5) * 0.6, rnd() * 6.28, (rnd() - 0.5) * 0.6], s: [0.04, 0.012, 0.1], c: rnd() < 0.5 ? 0x15803d : 0x22a34a }); }
    inst(new T.SphereGeometry(1, 10, 6), mat(0xffffff, { roughness: 0.6 }), leaves, g);
    // price cards on sticks
    ['₹40/kg', '₹30/kg', '₹25/kg', '₹10'].forEach((s, i) => { const t = label(s, { w: 256, h: 128, bg: '#ffffff', fg: '#b91c1c', size: 72, radius: 14 }); cyl(0.003, 0.003, 0.2, 0x8a5a33, g, cx(i), top + 0.1, D / 2 - 0.12, 6); const p = plane(t, 0.1, 0.05, g, cx(i), top + 0.21, D / 2 - 0.118); p.material.side = T.DoubleSide; });
    // traditional hanging balance (taraazu) on a post at the back corner
    const bx = W / 2 - 0.08, bz = -D / 2 + 0.08, bt = top + 0.75;
    cyl(0.018, 0.018, 0.78, Z.woodDark, g, bx, top + 0.39, bz, 10);
    const beam = new T.Group(); beam.position.set(bx - 0.2, bt - 0.02, bz); g.add(beam);
    cyl(0.01, 0.01, 0.2, 0x8a8f98, g, bx - 0.1, bt, bz, 8).rotation.z = Math.PI / 2;
    const bm = cyl(0.008, 0.008, 0.36, 0x7a5c2e, beam, 0, -0.03, 0, 8); bm.rotation.z = Math.PI / 2;
    const brass = mat(0xc9a227, { metalness: 0.45, roughness: 0.35 });
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) { const a3 = k / 3 * Math.PI * 2, ox = Math.cos(a3) * 0.055, oz = Math.sin(a3) * 0.055, L = 0.3; const str = mesh(new T.CylinderGeometry(0.0015, 0.0015, L, 4), mat(0x333333), beam, s * 0.17 + ox / 2, -0.03 - L / 2, oz / 2); str.rotation.set(oz / L / 2 * -1, 0, ox / L / 2); }
      const pan = mesh(new T.CylinderGeometry(0.07, 0.05, 0.02, 24), brass, beam, s * 0.17, -0.34, 0);
    }
    const sb = label('FRESH VEGGIES', { w: 768, h: 160, bg: '#16a34a', fg: '#ffffff', size: 96, radius: 30 });
    box(0.5, 0.12, 0.02, 0xf8fafc, g, bx - 0.25, bt + 0.1, bz, 0.006); plane(sb, 0.48, 0.1, g, bx - 0.25, bt + 0.1, bz + 0.011);
    return { group: g, top };
  }

  // ---- toy shop front: window with shelves of toys and a striped "ZUNGGA TOYS" awning ----
  function toyShopWindow() {
    const g = new T.Group(), W = 2.4, H = 2.7, wx = 0.9, y0 = 0.6, y1 = 1.9, rnd = seeded(77), wall = 0xfff1d6;
    box(W, y0, 0.14, Z.purple, g, 0, y0 / 2, 0, 0.01);
    box(W, H - y1, 0.14, wall, g, 0, (H + y1) / 2, 0, 0.01);
    for (const s of [-1, 1]) box((W - 2 * wx) / 2, y1 - y0, 0.14, wall, g, s * (W / 2 + wx) / 2, (y0 + y1) / 2, 0, 0.01);
    for (const [w, h, x, y] of [[2 * wx + 0.08, 0.05, 0, y1], [2 * wx + 0.08, 0.06, 0, y0], [0.05, y1 - y0, -wx, (y0 + y1) / 2], [0.05, y1 - y0, wx, (y0 + y1) / 2], [0.03, y1 - y0, 0, (y0 + y1) / 2]]) box(w, h, 0.06, Z.yellow, g, x, y, 0.06, 0.008);
    const gl = mesh(new T.PlaneGeometry(2 * wx, y1 - y0), glassMat({ opacity: 0.18 }), g, 0, (y0 + y1) / 2, 0.05); gl.castShadow = false;
    // display box behind the glass
    const dots = tex((c, Wd, Hd) => { c.fillStyle = '#fbcfe8'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#f9a8d4'; for (let y = 20; y < Hd; y += 60) for (let x = (y / 60) % 2 ? 50 : 20; x < Wd; x += 60) { c.beginPath(); c.arc(x, y, 10, 0, Math.PI * 2); c.fill(); } }, 1024, 512);
    mesh(new T.BoxGeometry(2 * wx, y1 - y0, 0.02), std({ map: dots }), g, 0, (y0 + y1) / 2, -0.5);
    box(2 * wx, 0.03, 0.55, 0xf8fafc, g, 0, y0 + 0.015, -0.25, 0.004);
    for (const s of [-1, 1]) mesh(new T.BoxGeometry(0.02, y1 - y0, 0.55), mat(0xf5d0fe), g, s * wx, (y0 + y1) / 2, -0.25);
    const shelfY = [y0 + 0.03, 1.02, 1.42];
    for (const y of shelfY.slice(1)) box(2 * wx - 0.04, 0.025, 0.32, 0xf8fafc, g, 0, y - 0.0125, -0.3, 0.004);
    // toy makers
    const teddy = (p, col) => { const t = new T.Group(); p.add(t); sphere(0.075, col, t, 0, 0.075, 0).scale.set(1, 1.1, 0.9); sphere(0.06, col, t, 0, 0.19, 0); for (const s of [-1, 1]) { sphere(0.022, col, t, s * 0.045, 0.24, 0); sphere(0.025, col, t, s * 0.075, 0.1, 0.02); sphere(0.026, col, t, s * 0.045, 0.02, 0.04); sphere(0.008, 0x111111, t, s * 0.02, 0.205, 0.053); } sphere(0.025, 0xfde7c7, t, 0, 0.18, 0.05); sphere(0.008, 0x111111, t, 0, 0.19, 0.073); return t; };
    const ball = (p, r, a, b) => { const st = tex((c, Wd, Hd) => { for (let i = 0; i < 6; i++) { c.fillStyle = hex(i % 2 ? a : b); c.fillRect(i * Wd / 6, 0, Wd / 6, Hd); } }, 256, 128); const m = mesh(new T.SphereGeometry(r, 24, 16), std({ map: st, roughness: 0.35 }), p, 0, r, 0); m.rotation.z = 0.4; return m; };
    const blk = (p, ch, col, x, y, z, ry) => { const t = label(ch, { w: 128, h: 128, bg: hex(col), fg: '#ffffff', size: 90 }); const m = mesh(new T.BoxGeometry(0.075, 0.075, 0.075), std({ map: t }), p, x, y + 0.0375, z); m.rotation.y = ry; return m; };
    const car = (p, col) => { const t = new T.Group(); p.add(t); box(0.2, 0.05, 0.1, col, t, 0, 0.045, 0, 0.015); box(0.1, 0.045, 0.085, 0xdbeafe, t, -0.01, 0.09, 0, 0.012); for (const x of [-0.065, 0.065]) for (const z of [-0.05, 0.05]) { const w = cyl(0.022, 0.022, 0.02, 0x222222, t, x, 0.022, z, 16); w.rotation.x = Math.PI / 2; } return t; };
    const rocket = (p) => { const t = new T.Group(); p.add(t); cyl(0.04, 0.04, 0.16, 0xf8fafc, t, 0, 0.1, 0); cyl(0, 0.04, 0.07, 0xef4444, t, 0, 0.215, 0); sphere(0.018, 0x38bdf8, t, 0, 0.12, 0.036).scale.z = 0.4; for (let i = 0; i < 3; i++) { const f = box(0.01, 0.06, 0.04, 0xef4444, t, Math.sin(i * 2.094) * 0.045, 0.04, Math.cos(i * 2.094) * 0.045, 0.003); f.rotation.y = i * 2.094; } return t; };
    const robot = (p) => { const t = new T.Group(); p.add(t); box(0.09, 0.1, 0.06, 0x94a3b8, t, 0, 0.09, 0, 0.01); box(0.07, 0.06, 0.06, 0xcbd5e1, t, 0, 0.175, 0, 0.01); for (const s of [-1, 1]) { sphere(0.009, 0x22d3ee, t, s * 0.017, 0.18, 0.031); box(0.025, 0.04, 0.03, 0x64748b, t, s * 0.025, 0.02, 0, 0.006); box(0.02, 0.07, 0.025, 0x64748b, t, s * 0.06, 0.1, 0, 0.006); } cyl(0.003, 0.003, 0.03, 0x64748b, t, 0, 0.22, 0); sphere(0.01, 0xef4444, t, 0, 0.237, 0); return t; };
    const at = (fn, x, y, z, ry = 0) => { const grp = new T.Group(); grp.position.set(x, y, z); grp.rotation.y = ry; g.add(grp); fn(grp); return grp; };
    // floor of display
    at((p) => teddy(p, 0xb7793f), -0.62, shelfY[0], -0.2, 0.2);
    at((p) => ball(p, 0.1, Z.yellow, Z.pink), -0.3, shelfY[0], -0.15);
    at((p) => car(p, Z.blue), 0.05, shelfY[0], -0.1, 0.4);
    at((p) => { blk(p, 'A', 0xef4444, 0, 0, 0, 0.1); blk(p, 'B', 0x22c55e, 0.08, 0, 0, -0.1); blk(p, 'C', 0x7c3aed, 0.04, 0.075, 0, 0.2); }, 0.35, shelfY[0], -0.12);
    at((p) => teddy(p, 0xf9a8d4), 0.7, shelfY[0], -0.2, -0.3);
    // shelf 1
    at((p) => rocket(p), -0.7, shelfY[1], -0.3); at((p) => car(p, 0xef4444), -0.42, shelfY[1], -0.3, -0.3); at((p) => robot(p), -0.12, shelfY[1], -0.3);
    at((p) => ball(p, 0.06, Z.green, 0xf8fafc), 0.15, shelfY[1], -0.28); at((p) => car(p, Z.yellow), 0.42, shelfY[1], -0.3, 0.3); at((p) => rocket(p), 0.72, shelfY[1], -0.3);
    // shelf 2: plush mascot "bestseller", balls and blocks
    at((p) => { const d = decal(mascotTex(), 0.2, 0.2 * 459 / 398, p, 0, 0.115, 0); d.castShadow = false; }, 0, shelfY[2], -0.32);
    at((p) => { plane(label('BESTSELLER', { w: 512, h: 112, bg: '#ef4444', fg: '#fff', size: 70, radius: 30 }), 0.16, 0.035, p, 0, 0.012, 0.06); }, 0, shelfY[2], -0.22);
    at((p) => teddy(p, 0xc4b5fd), -0.45, shelfY[2], -0.3, 0.3); at((p) => ball(p, 0.07, Z.blue, Z.yellow), -0.72, shelfY[2], -0.28);
    at((p) => robot(p), 0.42, shelfY[2], -0.3, -0.3); at((p) => { blk(p, 'Z', Z.purple, 0, 0, 0, 0); blk(p, '1', Z.orange, 0.085, 0, 0, 0.2); }, 0.66, shelfY[2], -0.3);
    // awning
    const stripes = tex((c, Wd, Hd) => { for (let i = 0; i < 14; i++) { c.fillStyle = i % 2 ? '#ffffff' : hex(Z.purple); c.fillRect(i * Wd / 14, 0, Wd / 14 + 1, Hd); } }, 1024, 256);
    const ay0 = 2.32, ay1 = 2.02, az = 0.6, L = Math.hypot(az, ay0 - ay1), th = Math.atan2(ay0 - ay1, az);
    const aw = mesh(new T.PlaneGeometry(2.2, L), std({ map: stripes, side: T.DoubleSide, roughness: 0.8 }), g, 0, (ay0 + ay1) / 2, az / 2 + 0.07); aw.rotation.x = -Math.PI / 2 + th;
    const val = tex((c, Wd, Hd) => { c.fillStyle = hex(Z.purple); c.beginPath(); c.moveTo(0, 0); c.lineTo(Wd, 0); c.lineTo(Wd, Hd * 0.72); const n = 18; for (let i = n; i > 0; i--) c.arc((i - 0.5) * Wd / n, Hd * 0.72, Wd / n / 2, 0, Math.PI, false); c.closePath(); c.fill(); txt(c, 'ZUNGGA TOYS', Wd / 2, Hd * 0.38, Hd * 0.5, '#facc15', 700, 'center', Wd * 0.8); }, 1600, 200);
    const vm = plane(val, 2.2, 0.275, g, 0, ay1 - 0.135, az + 0.07, { transparent: true, alphaTest: 0.3, side: T.DoubleSide });
    const lg = decal(logoTex(), 0.3, 0.3 * 755 / 920, g, 0, 2.53, 0.072);
    return { group: g, phys: { shape: 'box', size: [W, H, 0.14], mass: 0, yOffset: H / 2 } };
  }

  // ---- three glass jars of colourful candies ----
  function candyJars() {
    const g = new T.Group(), rnd = seeded(13), CC = [0xef4444, 0xfacc15, 0x22c55e, 0x38bdf8, 0xec4899, 0xf97316, 0xa855f7, 0xf8fafc];
    const jars = [{ x: -0.17, h: 0.2, lid: Z.purple, kind: 0, price: '₹1' }, { x: 0, h: 0.25, lid: Z.pink, kind: 1, price: '₹2' }, { x: 0.17, h: 0.18, lid: Z.yellow, kind: 2, price: '₹5' }];
    const geos = [new T.SphereGeometry(1, 12, 8), new T.SphereGeometry(1, 12, 8), new T.SphereGeometry(1, 14, 10)];
    for (const j of jars) {
      const r = 0.068, jg = new T.Group(); jg.position.x = j.x; g.add(jg);
      const glass = mesh(new T.CylinderGeometry(r, r, j.h, 32, 1, true), glassMat({ side: T.DoubleSide, opacity: 0.3 }), jg, 0, j.h / 2 + 0.006, 0); glass.castShadow = false;
      mesh(new T.CylinderGeometry(r, r, 0.012, 32), glassMat({ opacity: 0.4 }), jg, 0, 0.006, 0).castShadow = false;
      mesh(new T.TorusGeometry(r * 0.95, 0.006, 8, 32), glassMat({ opacity: 0.5 }), jg, 0, j.h + 0.006, 0).rotation.x = Math.PI / 2;
      cyl(r * 0.97, r * 0.97, 0.03, j.lid, jg, 0, j.h + 0.02, 0, 32); sphere(0.018, j.lid, jg, 0, j.h + 0.04, 0);
      const cr = [0.011, 0.012, 0.016][j.kind], it = [];
      for (let y = cr + 0.012; y < j.h * 0.8; y += cr * 1.75) for (let ring = 0; ring * cr * 2 < r - cr; ring++) { const rr = ring * cr * 2.05, n = Math.max(1, Math.floor((2 * Math.PI * rr) / (cr * 2.1))); for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + y * 13; it.push({ p: [Math.cos(a) * rr, y + (rnd() - 0.5) * cr * 0.4, Math.sin(a) * rr], s: j.kind === 1 ? [cr * 1.5, cr * 0.9, cr * 0.9] : [cr, cr, cr], r: [0, rnd() * 6, 0], c: CC[Math.floor(rnd() * CC.length)] }); } }
      inst(geos[j.kind], mat(0xffffff, { roughness: 0.25 }), it, jg);
      const t = label(j.price, { w: 128, h: 128, bg: '#fff7e6', fg: '#b91c1c', size: 70, radius: 64 });
      plane(t, 0.045, 0.045, jg, 0, j.h * 0.45, r + 0.004, { transparent: true });
    }
    return { group: g };
  }

  // ---- brown paper bag with the Zungga logo, groceries peeking out ----
  function paperBag() {
    const g = new T.Group(), W = 0.26, H = 0.32, D = 0.16, t = 0.004;
    const kraft = tex((c, Wd, Hd) => { c.fillStyle = '#c69a62'; c.fillRect(0, 0, Wd, Hd); c.strokeStyle = 'rgba(120,80,40,0.25)'; c.lineWidth = 3; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, Hd * (0.1 + i * 0.17)); c.bezierCurveTo(Wd * 0.3, Hd * (0.12 + i * 0.17), Wd * 0.6, Hd * (0.06 + i * 0.17), Wd, Hd * (0.11 + i * 0.17)); c.stroke(); } c.fillStyle = 'rgba(120,80,40,0.2)'; c.fillRect(0, Hd * 0.06, Wd, 4); }, 256, 256);
    const km = std({ map: kraft, roughness: 0.95 });
    mesh(new T.BoxGeometry(W, t, D), km, g, 0, t / 2, 0);
    for (const [w, d, x, z] of [[W, t, 0, D / 2], [W, t, 0, -D / 2], [t, D, W / 2, 0], [t, D, -W / 2, 0]]) mesh(new T.BoxGeometry(w, H, d), km, g, x, H / 2, z);
    for (const [w, d, x, z] of [[W + 0.004, 0.008, 0, D / 2], [W + 0.004, 0.008, 0, -D / 2], [0.008, D, W / 2, 0], [0.008, D, -W / 2, 0]]) mesh(new T.BoxGeometry(w, 0.03, d), mat(0xb3884f, { roughness: 0.95 }), g, x, H - 0.015, z);
    const lg = decal(logoTex(), 0.17, 0.17 * 755 / 920, g, 0, H * 0.45, D / 2 + 0.006);
    const hm = mat(0xa87b45, { roughness: 0.9 });
    for (const s of [1, -1]) mesh(new T.TorusGeometry(0.05, 0.005, 8, 20, Math.PI), hm, g, 0, H, s * (D / 2 - 0.01));
    // peeking items
    const loaf = box(0.09, 0.2, 0.07, 0xf5d08a, g, -0.07, H - 0.02, -0.02, 0.03); loaf.rotation.z = 0.18;
    for (let i = 0; i < 6; i++) { const l = mesh(new T.SphereGeometry(1, 10, 6), mat(i % 2 ? 0x16a34a : 0x22c55e), g, 0.05 + (i % 3) * 0.02, H + 0.03 + (i % 2) * 0.03, -0.03 + i * 0.008); l.scale.set(0.02, 0.07, 0.012); l.rotation.z = -0.5 + i * 0.2; }
    const b = mesh(bottleGeo(), mat(0xf8fafc, { roughness: 0.25 }), g, 0.08, 0.06, 0.02); cyl(0.014, 0.014, 0.02, 0x2563eb, b, 0, 0.255, 0);
    plane(label('MILK', { w: 256, h: 96, bg: '#2563eb', fg: '#fff', size: 64 }), 0.05, 0.02, b, 0, 0.2, 0.037);
    return { group: g };
  }

  // ---- "Scan & Pay" QR stand card ----
  function qrStand() {
    const g = new T.Group(), rnd = seeded(99);
    const face = tex((c, W, H) => {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
      const gr = c.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, hex(Z.purple)); gr.addColorStop(1, hex(Z.pink)); c.fillStyle = gr; c.fillRect(0, 0, W, H * 0.18);
      txt(c, 'Scan & Pay', W / 2, H * 0.095, H * 0.08, '#ffffff', 700, 'center', W * 0.9);
      const N = 25, q = W * 0.72, cs = q / N, ox = (W - q) / 2, oy = H * 0.24;
      c.fillStyle = '#1f1a33';
      const finder = (fx, fy) => (fx < 7 && fy < 7) || (fx >= N - 7 && fy < 7) || (fx < 7 && fy >= N - 7);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!finder(x, y) && !(Math.abs(x - 12) < 3 && Math.abs(y - 12) < 3) && rnd() < 0.5) c.fillRect(ox + x * cs, oy + y * cs, cs + 0.5, cs + 0.5);
      for (const [fx, fy] of [[0, 0], [N - 7, 0], [0, N - 7]]) { c.fillRect(ox + fx * cs, oy + fy * cs, cs * 7, cs * 7); c.fillStyle = '#fff'; c.fillRect(ox + (fx + 1) * cs, oy + (fy + 1) * cs, cs * 5, cs * 5); c.fillStyle = '#1f1a33'; c.fillRect(ox + (fx + 2) * cs, oy + (fy + 2) * cs, cs * 3, cs * 3); }
      c.fillStyle = hex(Z.purple); c.beginPath(); c.roundRect(ox + 10 * cs, oy + 10 * cs, cs * 5, cs * 5, cs); c.fill(); txt(c, 'Z', ox + 12.5 * cs, oy + 12.6 * cs, cs * 4, '#ffffff');
      txt(c, 'ZUNGGA STORE', W / 2, H * 0.86, H * 0.05, '#1f1a33', 700, 'center', W * 0.85);
      txt(c, 'Pay with any UPI app', W / 2, H * 0.93, H * 0.032, '#6b7280', 600, 'center', W * 0.85);
    }, 512, 760);
    box(0.15, 0.02, 0.07, 0x1f1a33, g, 0, 0.01, 0, 0.006);
    const card = new T.Group(); card.position.set(0, 0.018, 0.0); card.rotation.x = -0.18; g.add(card);
    mesh(roundBox(0.13, 0.19, 0.004, 0.0015), mat(0xffffff), card, 0, 0.095, 0);
    plane(face, 0.124, 0.184, card, 0, 0.095, 0.0022);
    const back = mesh(roundBox(0.012, 0.15, 0.02, 0.003), mat(0x1f1a33), g, 0, 0.075, -0.062); back.rotation.x = 0.25;
    return { group: g };
  }

  ZAssets.register('shop', 'grocery_shelf', 'Grocery shelf', groceryShelf, ['shop', 'shelf', 'grocery', 'rack', 'supermarket']);
  ZAssets.register('shop', 'cash_register', 'Cash register', cashRegister, ['shop', 'cash', 'register', 'billing', 'drawer']);
  ZAssets.register('shop', 'weighing_scale', 'Weighing scale', weighingScale, ['shop', 'scale', 'weight', 'kg']);
  ZAssets.register('shop', 'shopping_basket', 'Shopping basket', shoppingBasket, ['shop', 'basket', 'shopping']);
  ZAssets.register('shop', 'sale_sign', 'SALE sign board', saleSign, ['shop', 'sale', 'discount', 'sign', 'offer']);
  ZAssets.register('shop', 'vegetable_cart', 'Vegetable cart (thela)', vegetableCart, ['shop', 'vegetables', 'cart', 'thela', 'market', 'street']);
  ZAssets.register('shop', 'toy_shop_window', 'Toy shop window', toyShopWindow, ['shop', 'toys', 'window', 'storefront', 'zungga']);
  ZAssets.register('shop', 'candy_jars', 'Candy jars', candyJars, ['shop', 'candy', 'sweets', 'jars', 'toffee']);
  ZAssets.register('shop', 'paper_bag', 'Paper shopping bag', paperBag, ['shop', 'bag', 'paper', 'groceries', 'zungga']);
  ZAssets.register('shop', 'qr_stand', 'Scan & Pay QR stand', qrStand, ['shop', 'qr', 'pay', 'upi', 'digital payment']);
  /*@@NEW@@*/
})();
