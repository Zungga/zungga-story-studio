/* Zungga Story Studio — bank props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box, logoTex, mascotTex, decal, label, cyl, sphere } = ZA;

  /* ---------------- local helpers ---------------- */
  const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const LOGO_AR = 755 / 920;
  const logoAt = (w, parent, x, y, z) => decal(logoTex(), w, w * LOGO_AR, parent, x, y, z);
  const steelM = (c = 0xc8cfd8) => mat(c, { metalness: 0.35, roughness: 0.38 });
  const scrMat = (t, k = 0.65) => new T.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: k, roughness: 0.3 });
  const picMat = (t, o = {}) => new T.MeshStandardMaterial({ map: t, roughness: 0.6, ...o });
  function plane(w, h, m, parent, x = 0, y = 0, z = 0) { const p = mesh(new T.PlaneGeometry(w, h), m, parent, x, y, z); p.castShadow = false; return p; }
  function flat(w, d, m, parent, x = 0, y = 0, z = 0) { const p = plane(w, d, m, parent, x, y, z); p.rotation.x = -Math.PI / 2; return p; }
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  function txt(c, s, x, y, size, col, align = 'center', weight = 700, maxW = 0) {
    c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle';
    if (maxW) fitText(c, s, maxW, size, weight); else c.font = `${weight} ${size}px ${FONT}`;
    c.fillText(s, x, y);
  }
  // beads along a smooth curve (one InstancedMesh)
  function beadChain(pts, n, r, color, parent) {
    const curve = new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(...p)));
    const im = new T.InstancedMesh(new T.SphereGeometry(r, 8, 6), mat(color, { metalness: 0.4, roughness: 0.35 }), n);
    const m4 = new T.Matrix4();
    for (let i = 0; i < n; i++) { m4.makeTranslation(curve.getPointAt(i / (n - 1))); im.setMatrixAt(i, m4); }
    im.castShadow = true; parent.add(im); return im;
  }
  // a ball-point pen lying along +x, centred (bottom touching y = 0 of its group)
  function pen(len = 0.14, col = Z.blue) {
    const g = new T.Group(), r = 0.0045;
    const b = cyl(r, r, len * 0.78, col, g, 0, r, 0, 16); b.rotation.z = Math.PI / 2;
    const grip = cyl(r * 1.05, r * 1.05, len * 0.16, 0x1f2937, g, len * 0.3, r, 0, 16); grip.rotation.z = Math.PI / 2;
    const tip = mesh(new T.ConeGeometry(r, len * 0.1, 16), steelM(), g, len * 0.44, r, 0); tip.rotation.z = -Math.PI / 2;
    const end = cyl(r * 0.9, r, len * 0.05, 0xf8fafc, g, -len * 0.415, r, 0, 16); end.rotation.z = Math.PI / 2;
    box(len * 0.3, 0.002, 0.003, 0xd1d5db, g, -len * 0.2, r * 2 + 0.001, 0, 0.0008);
    return g;
  }
  // share one copy of a money prop (textures built once per call site)
  const cloneOf = (id) => { const src = ZAssets.has(id) ? ZAssets.build(id).group : null; return () => (src ? src.clone() : new T.Group()); };

  /* ---------------- bank counter ---------------- */
  function bankCounter() {
    const g = new T.Group(), W = 2.4, D = 0.6, TOP = 1.05;
    box(W - 0.04, 0.08, D - 0.06, 0x3b2f5c, g, 0, 0.04, 0, 0.01);                                   // plinth
    box(W, 0.92, D, Z.wood, g, 0, 0.54, 0, 0.015);                                                    // body
    for (const x of [-0.85, 0.85]) box(0.6, 0.6, 0.012, 0xd9a86c, g, x, 0.52, D / 2 + 0.004, 0.006);   // side panels
    box(W, 0.05, 0.012, Z.purple, g, 0, 0.9, D / 2 + 0.006, 0.004);                                   // accent stripe
    box(W + 0.08, 0.05, D + 0.22, 0xece7df, g, 0, TOP - 0.025, 0.05, 0.012);                          // granite top
    // "ZUNGGA BANK" front panel with logo
    const pT = tex((c, Wd, Hd) => {
      const gr = c.createLinearGradient(0, 0, Wd, Hd); gr.addColorStop(0, '#8b5cf6'); gr.addColorStop(1, '#5b21b6');
      rr(c, 0, 0, Wd, Hd, 40); c.fillStyle = gr; c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(Hd * 0.5, Hd * 0.5, Hd * 0.38, 0, 6.3); c.fill();
      txt(c, 'ZUNGGA BANK', Wd * 0.6, Hd * 0.42, 130, '#ffffff', 'center', 700, Wd * 0.6);
      txt(c, 'Save · Grow · Smile', Wd * 0.6, Hd * 0.74, 54, '#ede9fe', 'center', 600);
    }, 1024, 400);
    const panel = box(0.92, 0.36, 0.02, 0xffffff, g, 0, 0.55, D / 2 + 0.01, 0.008); panel.material = mat(0x6d28d9);
    plane(0.9, 0.35, picMat(pT, { transparent: true }), g, 0, 0.55, D / 2 + 0.0215);
    logoAt(0.21, g, -0.45 + 0.175, 0.55, D / 2 + 0.023);
    // glass partition: steel rails, posts, header
    const st = steelM();
    const GH = 0.82, gY = TOP + 0.02;
    for (const x of [-W / 2 + 0.02, -0.33, 0.33, W / 2 - 0.02]) mesh(roundBox(0.04, GH + 0.08, 0.05, 0.008), st, g, x, gY + GH / 2, 0);
    for (const [x0, x1] of [[-W / 2, -0.33], [0.33, W / 2]]) {
      mesh(roundBox(x1 - x0, 0.035, 0.05, 0.006), st, g, (x0 + x1) / 2, gY + 0.0175, 0);
      mesh(new T.BoxGeometry(x1 - x0 - 0.04, GH - 0.04, 0.008), glassMat(), g, (x0 + x1) / 2, gY + GH / 2 + 0.01, 0);
    }
    mesh(new T.BoxGeometry(0.62, GH - 0.13, 0.008), glassMat(), g, 0, gY + 0.11 + (GH - 0.13) / 2, 0);   // centre window (gap below for the tray)
    mesh(roundBox(0.66, 0.02, 0.04, 0.005), st, g, 0, gY + 0.1, 0);
    // speak hole: steel ring + perforated disc
    const holes = tex((c, Wd, Hd) => { c.fillStyle = '#9aa3ae'; c.beginPath(); c.arc(Wd / 2, Hd / 2, Wd / 2, 0, 6.3); c.fill(); c.fillStyle = '#334155';
      for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 17) { c.beginPath(); c.arc(Wd / 2 + x * 26, Hd / 2 + y * 26, 8, 0, 6.3); c.fill(); } }, 256, 256);
    for (const s of [1, -1]) { const d = mesh(new T.CircleGeometry(0.055, 32), picMat(holes, { metalness: 0.5, transparent: true }), g, 0, gY + 0.42, s * 0.006); if (s < 0) d.rotation.y = Math.PI; }
    const ring = mesh(new T.TorusGeometry(0.058, 0.007, 10, 36), st, g, 0, gY + 0.42, 0); ring.castShadow = false;
    // cash tray dipped into the counter, passing under the glass
    mesh(roundBox(0.4, 0.012, 0.4, 0.004), st, g, 0, TOP + 0.002, 0);
    mesh(roundBox(0.36, 0.006, 0.36, 0.003), steelM(0x8e98a5), g, 0, TOP + 0.007, 0);
    // header bar + CASH sign
    box(W + 0.04, 0.12, 0.09, Z.purple, g, 0, gY + GH + 0.1, 0, 0.012);
    const hT = label('Counter 1 · Deposits & Withdrawals', { w: 1600, h: 90, bg: '#7c3aed', fg: '#ffffff', size: 58 });
    plane(W - 0.1, (W - 0.1) * 90 / 1600, picMat(hT), g, 0, gY + GH + 0.1, 0.0455);
    const sY = gY + GH + 0.25;
    box(0.56, 0.2, 0.04, Z.yellow, g, 0, sY, 0, 0.012);
    for (const x of [-0.18, 0.18]) cyl(0.006, 0.006, 0.06, 0x64748b, g, x, sY - 0.12, 0, 8);
    const cT = tex((c, Wd, Hd) => { c.fillStyle = '#facc15'; c.fillRect(0, 0, Wd, Hd); txt(c, '₹ CASH', Wd / 2, Hd / 2 + 4, 130, '#1f1a33'); }, 512, 180);
    for (const s of [1, -1]) { const p = plane(0.52, 0.18, picMat(cT), g, 0, sY, s * 0.0215); if (s < 0) p.rotation.y = Math.PI; }
    // teller side: monitor + keyboard (facing the teller, -z)
    const mon = new T.Group(); mon.position.set(0.72, TOP, -0.2); mon.rotation.y = Math.PI - 0.5; g.add(mon);
    cyl(0.07, 0.08, 0.012, 0x1f2937, mon, 0, 0.006, 0, 20);
    box(0.03, 0.16, 0.02, 0x1f2937, mon, 0, 0.09, -0.01, 0.005);
    box(0.46, 0.3, 0.03, 0x111827, mon, 0, 0.3, 0, 0.01);
    const sT = tex((c, Wd, Hd) => { c.fillStyle = '#eef2ff'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#7c3aed'; c.fillRect(0, 0, Wd, 60); txt(c, 'ZUNGGA BANK · Teller', 20, 30, 34, '#fff', 'left');
      c.fillStyle = '#c7d2fe'; for (let i = 0; i < 6; i++) { rr(c, 30, 90 + i * 50, Wd - 60, 34, 8); c.fill(); } }, 512, 340);
    plane(0.43, 0.27, scrMat(sT, 0.5), mon, 0, 0.3, 0.016);
    box(0.36, 0.015, 0.12, 0x1f2937, g, 0.55, TOP + 0.008, -0.28, 0.004).rotation.y = -0.15;
    // customer side: pen on a bead chain, held by a little base
    const px = -0.62, pz = 0.3;
    cyl(0.02, 0.024, 0.016, 0x1f2937, g, px, TOP + 0.008, pz, 20);
    const p = pen(0.14, Z.blue); p.position.set(px + 0.11, TOP, pz + 0.04); p.rotation.y = -0.3; g.add(p);
    const pe = new T.Vector3(-0.066, 0.0045, 0).applyAxisAngle(new T.Vector3(0, 1, 0), -0.3).add(p.position);
    beadChain([[px, TOP + 0.018, pz], [px + 0.02, TOP + 0.004, pz + 0.04], [pe.x - 0.015, TOP + 0.002, pe.z + 0.02], [pe.x, pe.y, pe.z]], 30, 0.0022, 0xc0c7d1, g);
    return { group: g, phys: { shape: 'box', size: [W, TOP, D], mass: 0, yOffset: TOP / 2 } };
  }

  /* ---------------- piggy bank ---------------- */
  function piggyBank() {
    const g = new T.Group(), rx = 0.085, ry = 0.078, rz = 0.11, cy = 0.105;
    const pink = new T.MeshPhysicalMaterial({ color: 0xf9a8d4, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 });
    const pinkIn = mat(0x9d174d, { side: T.BackSide, roughness: 0.8 }), deep = mat(0xec4899, { roughness: 0.4 }), black = mat(0x1f1a33, { roughness: 0.2 });
    const halves = [];
    for (const front of [true, false]) {
      const piv = new T.Group(), pz = front ? 0.074 : -0.074; piv.position.set(0, 0, pz); g.add(piv);
      const add = (m, x, y, z) => { m.position.set(x, y, z - pz); piv.add(m); return m; };
      const geo = new T.SphereGeometry(1, 36, 24, front ? 0 : Math.PI, Math.PI);
      const shell = add(new T.Mesh(geo, pink), 0, cy, 0); shell.scale.set(rx, ry, rz); shell.castShadow = shell.receiveShadow = true;
      const inn = add(new T.Mesh(geo, pinkIn), 0, cy, 0); inn.scale.set(rx * 0.99, ry * 0.99, rz * 0.99);
      for (const x of [-0.045, 0.045]) { const l = add(new T.Mesh(new T.CylinderGeometry(0.019, 0.017, 0.045, 18), pink), x, 0.0225, front ? 0.055 : -0.055); l.castShadow = true;
        add(new T.Mesh(new T.CylinderGeometry(0.017, 0.017, 0.004, 18), deep), x, 0.002, front ? 0.055 : -0.055); }
      if (front) {
        const sn = add(new T.Mesh(new T.CylinderGeometry(0.03, 0.033, 0.03, 28), pink), 0, cy - 0.008, rz - 0.002); sn.rotation.x = Math.PI / 2; sn.castShadow = true;
        const face = add(new T.Mesh(new T.CircleGeometry(0.029, 28), deep), 0, cy - 0.008, rz + 0.0135);
        for (const x of [-0.011, 0.011]) { const n = add(new T.Mesh(new T.SphereGeometry(0.006, 12, 8), black), x, cy - 0.008, rz + 0.0135); n.scale.set(0.7, 1.2, 0.4); }
        for (const x of [-0.036, 0.036]) {
          add(new T.Mesh(new T.SphereGeometry(0.0095, 16, 12), black), x, cy + 0.03, rz * 0.8);
          add(new T.Mesh(new T.SphereGeometry(0.003, 8, 6), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.4 })), x + 0.003, cy + 0.034, rz * 0.8 + 0.008);
          const ck = add(new T.Mesh(new T.SphereGeometry(0.012, 16, 8), mat(0xf472b6, { roughness: 0.5 })), x * 1.45, cy - 0.006, rz * 0.62); ck.scale.set(1, 0.65, 0.3); ck.rotation.y = x > 0 ? 0.7 : -0.7;
          const ear = add(new T.Mesh(new T.ConeGeometry(0.024, 0.04, 20), pink), x * 1.3, cy + ry * 0.86, 0.04); ear.rotation.set(0.35, 0, x > 0 ? -0.45 : 0.45); ear.scale.z = 0.55; ear.castShadow = true;
        }
      } else {
        add(new T.Mesh(roundBox(0.05, 0.006, 0.01, 0.002), black), 0, cy + ry - 0.001, -0.012);
        const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 3.2, r = 0.012 * (1 - i / 60); pts.push(new T.Vector3(Math.cos(a) * r, cy + 0.02 + Math.sin(a) * r, -rz + 0.004 - i / 40 * 0.026)); }
        const tail = add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 60, 0.0035, 8), pink), 0, 0, 0); tail.castShadow = true;
      }
      halves.push(piv);
    }
    // the spill (only when cracked)
    const spill = new T.Group(); g.add(spill);
    const mk = { c5: cloneOf('coin_5'), c10: cloneOf('coin_10'), c2: cloneOf('coin_2'), z: cloneOf('zungga_coin') }, rnd = seeded(41);
    const order = ['z', 'c5', 'c10', 'c2', 'c5', 'z', 'c10', 'c5', 'c2', 'z', 'c5', 'c10', 'c5', 'z', 'c2', 'c10'];
    order.forEach((k, i) => { const c = mk[k](); const a = rnd() * 6.28, d = 0.01 + rnd() * (i < 11 ? 0.06 : 0.16);
      c.position.set(Math.cos(a) * d * 0.9, (i % 4 === 0 ? 0.004 : 0) + 0.0005 * i, 0.015 + Math.abs(Math.sin(a)) * d); c.rotation.set(i % 4 === 0 ? 0.25 : 0, rnd() * 6, i % 5 === 0 ? 0.2 : 0); spill.add(c); });
    const shard = new T.TetrahedronGeometry(0.014);
    [[0.08, 0.06, 0.4], [-0.07, 0.09, 1.2], [0.03, -0.11, 2.2], [-0.1, -0.02, 3.1]].forEach(([x, z, r]) => { const s = mesh(shard, pink, spill, x, 0.004, z); s.scale.set(1, 0.35, 0.8); s.rotation.y = r; });
    g.userData.setOn = (on) => {
      halves[0].rotation.x = on ? 0.42 : 0; halves[0].position.z = on ? 0.1 : 0.074;
      halves[1].rotation.x = on ? -0.36 : 0; halves[1].position.z = on ? -0.1 : -0.074;
      spill.visible = !!on;
    };
    g.userData.setOn(false);
    return { group: g };
  }

  /* ---------------- ATM ---------------- */
  function atmMachine() {
    const g = new T.Group(), W = 0.8, H = 1.75, D = 0.62, F = D / 2;
    box(W, 0.1, D, 0x334155, g, 0, 0.05, 0, 0.012);
    box(W, H - 0.1, D, 0xe5e7eb, g, 0, 0.05 + H / 2, 0, 0.02);
    for (const s of [-1, 1]) box(0.012, H - 0.4, 0.06, Z.purple, g, s * (W / 2 + 0.002), 0.85, F - 0.08, 0.005);
    // header
    box(W + 0.03, 0.3, D + 0.03, Z.purple, g, 0, 1.66, 0, 0.02);
    const hT = tex((c, Wd, Hd) => { c.fillStyle = '#7c3aed'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(Hd * 0.52, Hd / 2, Hd * 0.4, 0, 6.3); c.fill();
      txt(c, 'ZUNGGA BANK', Wd * 0.6, Hd * 0.4, 96, '#ffffff', 'center', 700, Wd * 0.6); txt(c, '24 × 7 ATM', Wd * 0.6, Hd * 0.76, 52, '#fde68a'); }, 1024, 330);
    plane(W, W * 330 / 1024, picMat(hT, { emissive: 0xffffff, emissiveMap: hT, emissiveIntensity: 0.25 }), g, 0, 1.66, F + 0.0155);
    logoAt(0.17, g, -W / 2 + W * 0.162, 1.66, F + 0.017);
    // fascia
    box(W - 0.08, 0.95, 0.03, 0xcbd5e1, g, 0, 1.0, F + 0.01, 0.01);
    // screen in a tilted bezel
    const scr = new T.Group(); scr.position.set(0, 1.28, F + 0.03); scr.rotation.x = -0.1; g.add(scr);
    box(0.6, 0.44, 0.05, 0x1f2937, scr, 0, 0, 0, 0.012);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) box(0.03, 0.022, 0.02, 0x94a3b8, scr, s * 0.272, 0.1 - i * 0.07, 0.03, 0.004);
    const screenTex = (on) => tex((c, Wd, Hd) => {
      const gr = c.createLinearGradient(0, 0, 0, Hd); gr.addColorStop(0, on ? '#065f46' : '#4c1d95'); gr.addColorStop(1, on ? '#10b981' : '#8b5cf6'); c.fillStyle = gr; c.fillRect(0, 0, Wd, Hd);
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(0, 0, Wd, 80); txt(c, 'ZUNGGA BANK', Wd / 2, 42, 46, '#ffffff');
      if (!on) { txt(c, 'Welcome', Wd / 2, Hd * 0.42, 120, '#ffffff'); txt(c, 'Please insert your card', Wd / 2, Hd * 0.63, 46, '#ede9fe', 'center', 600);
        rr(c, Wd * 0.35, Hd * 0.75, Wd * 0.3, 70, 18); c.fillStyle = '#facc15'; c.fill(); txt(c, 'START', Wd / 2, Hd * 0.75 + 36, 40, '#1f1a33'); }
      else { txt(c, 'Take your cash', Wd / 2, Hd * 0.38, 92, '#ffffff'); txt(c, 'Thank you!', Wd / 2, Hd * 0.56, 52, '#d1fae5', 'center', 600);
        c.fillStyle = '#facc15'; c.beginPath(); c.moveTo(Wd / 2 - 50, Hd * 0.68); c.lineTo(Wd / 2 + 50, Hd * 0.68); c.lineTo(Wd / 2, Hd * 0.9); c.closePath(); c.fill(); }
    }, 768, 540);
    const tOff = screenTex(false), tOn = screenTex(true), sm = scrMat(tOff, 0.7);
    plane(0.5, 0.35, sm, scr, 0, 0, 0.0255);
    // keypad on a sloped shelf
    const kp = new T.Group(); kp.position.set(-0.07, 1.0, F + 0.11); kp.rotation.x = 0.32; g.add(kp);
    box(0.48, 0.04, 0.22, 0x94a3b8, kp, 0.05, 0, 0, 0.01);
    box(0.28, 0.012, 0.18, 0x475569, kp, 0, 0.022, 0, 0.004);
    const keys = ['1', '2', '3', 'CANCEL', '4', '5', '6', 'CLEAR', '7', '8', '9', 'ENTER', '', '0', '', ''];
    const keyCol = { CANCEL: '#ef4444', CLEAR: '#facc15', ENTER: '#22c55e' };
    keys.forEach((k, i) => { const col = i % 4, row = Math.floor(i / 4); const fn = col === 3; if (fn && row === 3) return;
      const kw = fn ? 0.06 : 0.042, x = fn ? 0.155 : -0.075 + col * 0.05, z = -0.06 + row * 0.042;
      const kt = tex((c, Wd, Hd) => { c.fillStyle = keyCol[k] || '#e2e8f0'; c.fillRect(0, 0, Wd, Hd); if (k) txt(c, k, Wd / 2, Hd / 2 + 2, fn ? 34 : 70, '#1f1a33', 'center', 700, Wd * 0.88); }, fn ? 192 : 128, 128);
      const key = mesh(roundBox(kw, 0.012, 0.034, 0.004), mat(keyCol[k] ? +('0x' + keyCol[k].slice(1)) : 0xe2e8f0, { roughness: 0.4 }), kp, x, 0.03, z);
      flat(kw * 0.86, 0.03, picMat(kt), kp, x, 0.0365, z); key.castShadow = false; });
    // card slot (right), receipt slot, cash slot (below)
    box(0.12, 0.06, 0.05, 0x334155, g, 0.26, 1.06, F + 0.04, 0.01);
    box(0.09, 0.008, 0.01, 0x020617, g, 0.26, 1.065, F + 0.065, 0.002);
    mesh(new T.TorusGeometry(0.008, 0.0025, 8, 16), mat(0x22c55e, { emissive: 0x22c55e, emissiveIntensity: 1.2 }), g, 0.305, 1.045, F + 0.066);
    const cardT = label('CARD', { w: 256, h: 64, bg: '#334155', fg: '#e2e8f0', size: 40 }); plane(0.06, 0.015, picMat(cardT), g, 0.26, 1.04, F + 0.0655);
    box(0.1, 0.012, 0.012, 0x020617, g, 0.26, 0.9, F + 0.026, 0.003);
    box(0.44, 0.08, 0.05, 0x475569, g, 0, 0.78, F + 0.035, 0.012);
    box(0.36, 0.014, 0.02, 0x020617, g, 0, 0.785, F + 0.054, 0.004);
    const cashT = label('CASH', { w: 256, h: 64, bg: '#475569', fg: '#e2e8f0', size: 40 }); plane(0.08, 0.02, picMat(cashT), g, 0, 0.755, F + 0.0605);
    const notes = new T.Group(); g.add(notes); const n500 = cloneOf('note_500');
    for (let i = 0; i < 4; i++) { const n = n500(); n.position.set((i - 1.5) * 0.004, 0.778 + i * 0.0018, F + 0.07 + i * 0.002); n.rotation.y = (i - 1.5) * 0.02; notes.add(n); }
    g.userData.setOn = (on) => { notes.visible = !!on; sm.map = sm.emissiveMap = on ? tOn : tOff; sm.needsUpdate = true; };
    g.userData.setOn(false);
    return { group: g, phys: { shape: 'box', size: [W, H, D], mass: 0, yOffset: H / 2 } };
  }

  /* ---------------- vault door ---------------- */
  function vaultDoor() {
    const g = new T.Group(), S = 2.3, R = 0.9, DEP = 0.36, CY = S / 2;
    const frameM = steelM(0xa7b0bb), doorM = steelM(0xc9d0d8), darkM = mat(0x1e293b, { roughness: 0.8 });
    const sh = new T.Shape(); sh.moveTo(-S / 2, -S / 2); sh.lineTo(S / 2, -S / 2); sh.lineTo(S / 2, S / 2); sh.lineTo(-S / 2, S / 2); sh.closePath();
    const hole = new T.Path(); hole.absarc(0, 0, R, 0, Math.PI * 2, true); sh.holes.push(hole);
    mesh(new T.ExtrudeGeometry(sh, { depth: DEP, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 40 }), frameM, g, 0, CY, -DEP);
    const lip = mesh(new T.TorusGeometry(R + 0.02, 0.03, 12, 48), frameM, g, 0, CY, 0.02);
    for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const b = cyl(0.035, 0.035, 0.03, 0x8e98a5, g, x * (S / 2 - 0.12), CY + y * (S / 2 - 0.12), 0.02, 16); b.rotation.x = Math.PI / 2; }
    // inside the vault: dark tunnel with a shelf of cash and gold
    const tun = mesh(new T.CylinderGeometry(R, R, 0.7, 40, 1, true), mat(0x334155, { side: T.BackSide, roughness: 0.85 }), g, 0, CY, -DEP - 0.35 + 0.02); tun.rotation.x = Math.PI / 2;
    mesh(new T.CircleGeometry(R, 40), darkM, g, 0, CY, -DEP - 0.68);
    box(1.3, 0.04, 0.4, 0x64748b, g, 0, CY - 0.35, -DEP - 0.45, 0.01);
    const gold = mat(0xf2c14e, { metalness: 0.45, roughness: 0.25 });
    for (let i = 0; i < 5; i++) { const b = mesh(roundBox(0.18, 0.06, 0.08, 0.012), gold, g, -0.45 + (i % 3) * 0.2 + (i > 2 ? 0.1 : 0), CY - 0.3 + (i > 2 ? 0.06 : 0), -DEP - 0.45); b.scale.x = 1; }
    const bundle = cloneOf('bundle_1lakh');
    for (let i = 0; i < 4; i++) { const b = bundle(); b.scale.setScalar(1.6); b.position.set(0.32 + (i % 2) * 0.26, CY - 0.33 + Math.floor(i / 2) * 0.036, -DEP - 0.45); b.rotation.y = 0.1 * i; g.add(b); }
    // the door on its hinge (right side)
    const HX = R + 0.1, hinge = new T.Group(); hinge.position.set(HX, CY, 0.16); g.add(hinge);
    const door = new T.Group(); door.position.set(-HX, 0, -0.13); hinge.add(door);
    const rings = tex((c, Wd, Hd) => { c.fillStyle = '#cfd6de'; c.fillRect(0, 0, Wd, Hd);
      for (let r = 4; r < Wd / 2; r += 3) { c.strokeStyle = `rgba(${r % 2 ? '255,255,255' : '90,100,115'},${0.08 + (r % 7) * 0.012})`; c.lineWidth = 2; c.beginPath(); c.arc(Wd / 2, Hd / 2, r, 0, 6.3); c.stroke(); } }, 1024, 1024);
    const dm = mesh(new T.CylinderGeometry(R - 0.03, R - 0.03, 0.24, 48), [doorM, new T.MeshStandardMaterial({ map: rings, metalness: 0.7, roughness: 0.3 }), doorM], door); dm.rotation.x = Math.PI / 2;
    const ringM = steelM(0x9aa3ae);
    for (const [rr2, t2] of [[R - 0.08, 0.025], [R * 0.62, 0.018]]) mesh(new T.TorusGeometry(rr2, t2, 10, 56), ringM, door, 0, 0, 0.12);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, b2 = cyl(0.04, 0.04, 0.12, 0xdde3ea, door, Math.cos(a) * (R - 0.01), Math.sin(a) * (R - 0.01), 0, 16); b2.rotation.z = a - Math.PI / 2; b2.material = steelM(0xe2e8f0); }
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + 0.2, rv = sphere(0.022, 0x8e98a5, door, Math.cos(a) * (R - 0.08), Math.sin(a) * (R - 0.08), 0.14, 12); rv.material = ringM; }
    // spoked wheel
    const wheel = new T.Group(); wheel.position.z = 0.2; door.add(wheel);
    const wm = steelM(0xe5e7eb);
    mesh(new T.TorusGeometry(0.26, 0.022, 12, 40), wm, wheel);
    for (let i = 0; i < 3; i++) { const s = mesh(new T.CylinderGeometry(0.016, 0.016, 0.52, 12), wm, wheel); s.rotation.z = i * Math.PI / 3; }
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; sphere(0.03, 0xe5e7eb, wheel, Math.cos(a) * 0.29, Math.sin(a) * 0.29, 0, 14).material = mat(Z.purple, { roughness: 0.35 }); }
    const hub = cyl(0.07, 0.08, 0.1, 0xe5e7eb, wheel, 0, 0, -0.04, 24); hub.rotation.x = Math.PI / 2; hub.material = wm;
    const hubT = tex((c, Wd, Hd) => { c.fillStyle = '#7c3aed'; c.beginPath(); c.arc(Wd / 2, Hd / 2, Wd / 2, 0, 6.3); c.fill(); txt(c, 'Z', Wd / 2, Hd / 2 + 6, 170, '#ffffff'); }, 256, 256);
    plane(0.11, 0.11, picMat(hubT, { transparent: true }), wheel, 0, 0, 0.012);
    // dial + nameplate
    const dial = cyl(0.07, 0.075, 0.04, 0x1f2937, door, 0, 0.5, 0.14, 28); dial.rotation.x = Math.PI / 2;
    const dialT = tex((c, Wd, Hd) => { c.fillStyle = '#111827'; c.beginPath(); c.arc(Wd / 2, Hd / 2, Wd / 2, 0, 6.3); c.fill(); c.strokeStyle = '#e5e7eb'; c.lineWidth = 4;
      for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283, l = i % 5 ? 14 : 30; c.beginPath(); c.moveTo(Wd / 2 + Math.cos(a) * (Wd / 2 - 6), Hd / 2 + Math.sin(a) * (Wd / 2 - 6)); c.lineTo(Wd / 2 + Math.cos(a) * (Wd / 2 - 6 - l), Hd / 2 + Math.sin(a) * (Wd / 2 - 6 - l)); c.stroke(); }
      c.fillStyle = '#9ca3af'; c.beginPath(); c.arc(Wd / 2, Hd / 2, 40, 0, 6.3); c.fill(); }, 256, 256);
    plane(0.13, 0.13, picMat(dialT, { transparent: true, metalness: 0.3 }), door, 0, 0.5, 0.161);
    const npT = label('ZUNGGA BANK · VAULT', { w: 768, h: 128, bg: '#7c3aed', fg: '#ffffff', size: 64, radius: 40 });
    plane(0.5, 0.083, picMat(npT, { transparent: true, metalness: 0.2 }), door, 0, -0.52, 0.125);
    // hinge arms + barrel
    for (const y of [0.45, -0.45]) { box(0.3, 0.1, 0.08, 0x8e98a5, hinge, -0.15, y, -0.03, 0.02).material = frameM; }
    const barrel = cyl(0.06, 0.06, 1.2, 0x8e98a5, hinge, 0, 0, -0.03, 24); barrel.material = frameM;
    g.userData.setOn = (on) => { hinge.rotation.y = on ? 1.75 : 0; };
    g.userData.setOn(false);
    return { group: g, phys: { shape: 'box', size: [S, S, DEP], mass: 0, yOffset: CY, zOffset: -DEP / 2 } };
  }

  /* ---------------- passbook ---------------- */
  function passbook() {
    const g = new T.Group(), W = 0.1, D = 0.145, t = 0.006;
    const coverT = tex((c, Wd, Hd) => {
      const gr = c.createLinearGradient(0, 0, Wd, Hd); gr.addColorStop(0, '#1d4ed8'); gr.addColorStop(1, '#1e3a8a'); c.fillStyle = gr; c.fillRect(0, 0, Wd, Hd);
      c.strokeStyle = '#facc15'; c.lineWidth = 8; c.strokeRect(28, 28, Wd - 56, Hd - 56);
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(Wd / 2, Hd * 0.24, Wd * 0.16, 0, 6.3); c.fill();
      txt(c, 'ZUNGGA BANK', Wd / 2, Hd * 0.46, 74, '#facc15', 'center', 700, Wd * 0.8);
      txt(c, 'SAVINGS', Wd / 2, Hd * 0.56, 84, '#ffffff', 'center', 700, Wd * 0.8);
      txt(c, 'PASSBOOK', Wd / 2, Hd * 0.64, 46, '#bfdbfe', 'center', 600);
      c.strokeStyle = '#bfdbfe'; c.lineWidth = 3; for (const y of [0.77, 0.85]) { c.beginPath(); c.moveTo(Wd * 0.15, Hd * y); c.lineTo(Wd * 0.85, Hd * y); c.stroke(); }
      txt(c, 'Name', Wd * 0.15, Hd * 0.75, 30, '#bfdbfe', 'left', 600); txt(c, 'A/c No.', Wd * 0.15, Hd * 0.83, 30, '#bfdbfe', 'left', 600);
    }, 512, 742);
    const blue = mat(0x1e3a8a, { roughness: 0.55 }), paper = mat(0xfdfaf2, { roughness: 0.9 });
    // closed
    const closed = new T.Group(); g.add(closed);
    mesh(roundBox(W, t, D, 0.0015), blue, closed, 0, t / 2, 0);
    box(W - 0.004, t * 0.7, D - 0.005, 0xfdfaf2, closed, 0.002, t / 2, 0, 0.0006).material = paper;
    flat(W, D, picMat(coverT), closed, 0, t + 0.0002, 0);
    logoAt(0.032, closed, 0, t + 0.0004, -D * 0.26).rotation.x = -Math.PI / 2;
    // open: printed rows across the spread
    const open = new T.Group(); g.add(open);
    const rows = [['01-06', 'Opening deposit', '', '100', '100'], ['15-06', 'Pocket money', '', '50', '150'], ['01-07', 'Birthday gift', '', '200', '350'],
      ['12-07', 'Book fair', '80', '', '270'], ['01-08', 'Interest', '', '3', '273'], ['20-08', 'Saved from snacks', '', '77', '350'], ['05-09', 'Football fund', '', '150', '500']];
    const pageT = tex((c, Wd, Hd) => {
      c.fillStyle = '#fdfaf2'; c.fillRect(0, 0, Wd, Hd);
      const half = Wd / 2; c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(half - 14, 0, 28, Hd);
      txt(c, 'ZUNGGA BANK · SAVINGS ACCOUNT', half / 2, 50, 34, '#1e3a8a'); txt(c, 'Statement of account', half * 1.5, 50, 32, '#1e3a8a', 'center', 600);
      const cols = [[40, 'DATE'], [150, 'PARTICULARS'], [half + 40, 'WITHDRAWN'], [half + 210, 'DEPOSIT'], [half + 360, 'BALANCE']];
      c.fillStyle = '#dbeafe'; c.fillRect(24, 90, half - 50, 50); c.fillRect(half + 26, 90, half - 50, 50);
      cols.forEach(([x, s]) => txt(c, s, x, 116, 24, '#1e3a8a', 'left'));
      c.strokeStyle = '#bfdbfe'; c.lineWidth = 2;
      for (let i = 0; i < 11; i++) { const y = 140 + (i + 1) * 54; c.beginPath(); c.moveTo(24, y); c.lineTo(half - 26, y); c.moveTo(half + 26, y); c.lineTo(Wd - 24, y); c.stroke(); }
      rows.forEach((r, i) => { const y = 140 + i * 54 + 30;
        txt(c, r[0], 40, y, 26, '#334155', 'left', 600); txt(c, r[1], 150, y, 26, '#334155', 'left', 600);
        txt(c, r[2], half + 130, y, 26, '#b91c1c', 'right', 600); txt(c, r[3], half + 300, y, 26, '#047857', 'right', 600); txt(c, r[4] + '.00', half + 470, y, 26, '#1f1a33', 'right', 700); });
      c.save(); c.translate(half * 1.62, Hd * 0.82); c.rotate(-0.25); c.strokeStyle = 'rgba(124,58,237,0.6)'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 60, 0, 6.3); c.stroke(); txt(c, 'ZUNGGA', 0, 0, 26, 'rgba(124,58,237,0.7)'); c.restore();
    }, 1024, 742);
    mesh(roundBox(W * 2 + 0.006, 0.0016, D + 0.004, 0.0007), blue, open, 0, 0.0008, 0);
    for (const s of [-1, 1]) {
      const leaf = mesh(new T.BoxGeometry(W, 0.003, D), paper, open, s * W / 2, 0.003, 0); leaf.rotation.z = s * -0.04;
      const geo = new T.PlaneGeometry(W, D), uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 0.5 + (s > 0 ? 0.5 : 0));
      const p = mesh(geo, picMat(pageT, { roughness: 0.9 }), open, s * W / 2, 0.0047, 0); p.castShadow = false;
      p.rotation.set(-Math.PI / 2, 0, 0); p.rotateOnWorldAxis(new T.Vector3(0, 0, 1), s * -0.04);
    }
    g.userData.setOn = (on) => { closed.visible = !on; open.visible = !!on; };
    g.userData.setOn(false);
    return { group: g, phys: { shape: 'box', size: [W, t, D], mass: 0.05, yOffset: t / 2 } };
  }

  /* ---------------- debit card ---------------- */
  function cardTex() {
    return tex((c, Wd, Hd) => {
      const gr = c.createLinearGradient(0, 0, Wd, Hd); gr.addColorStop(0, '#8b5cf6'); gr.addColorStop(0.55, '#6d28d9'); gr.addColorStop(1, '#3b0764');
      rr(c, 0, 0, Wd, Hd, 48); c.fillStyle = gr; c.fill(); c.save(); c.clip();
      c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.arc(Wd * 0.95, Hd * 0.1, Hd * 0.75, 0, 6.3); c.fill(); c.beginPath(); c.arc(Wd * 0.1, Hd * 1.05, Hd * 0.5, 0, 6.3); c.fill();
      c.fillStyle = 'rgba(236,72,153,0.35)'; c.beginPath(); c.moveTo(0, Hd * 0.8); c.bezierCurveTo(Wd * 0.3, Hd * 0.6, Wd * 0.6, Hd * 1.0, Wd, Hd * 0.7); c.lineTo(Wd, Hd); c.lineTo(0, Hd); c.fill(); c.restore();
      txt(c, 'ZUNGGA', 60, 78, 64, '#ffffff', 'left'); txt(c, 'DEBIT', Wd - 60, 78, 46, '#fde68a', 'right');
      const cg = c.createLinearGradient(80, 200, 220, 320); cg.addColorStop(0, '#fde68a'); cg.addColorStop(1, '#ca8a04'); rr(c, 80, 190, 140, 110, 18); c.fillStyle = cg; c.fill();
      c.strokeStyle = '#a16207'; c.lineWidth = 4; c.beginPath(); c.moveTo(80, 245); c.lineTo(220, 245); c.moveTo(150, 190); c.lineTo(150, 300); c.moveTo(120, 215); c.lineTo(180, 215); c.moveTo(120, 275); c.lineTo(180, 275); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 6; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(260, 245, 18 + i * 16, -0.8, 0.8); c.stroke(); }
      txt(c, '4521  0707  2026  0001', 70, 400, 62, '#ffffff', 'left', 600);
      txt(c, 'VALID THRU 08/31', 70, 480, 30, '#e9d5ff', 'left', 600); txt(c, 'ZUNGGA KID', 70, 560, 46, '#ffffff', 'left', 700);
    }, 1024, 646);
  }
  function debitCard() {
    const g = new T.Group(), W = 0.0856, D = 0.054, t = 0.0008;
    mesh(roundBox(W, t, D, 0.0003), mat(0x5b21b6, { roughness: 0.35 }), g, 0, t / 2, 0);
    flat(W, D, picMat(cardTex(), { transparent: true, roughness: 0.3, metalness: 0.1 }), g, 0, t + 0.00005, 0);
    const chip = mesh(roundBox(0.0118, 0.0003, 0.0093, 0.0001), mat(0xeab308, { metalness: 0.3, roughness: 0.35 }), g, -W / 2 + 0.0126, t + 0.00012, -D / 2 + 0.0205); chip.castShadow = false;
    const lg = logoAt(0.018, g, W / 2 - 0.013, t + 0.0002, D / 2 - 0.012); lg.rotation.x = -Math.PI / 2;
    return { group: g, phys: { shape: 'box', size: [W, t, D], mass: 0.005, yOffset: t / 2, flutter: false } };
  }

  /* ---------------- token machine ---------------- */
  function tokenMachine() {
    const g = new T.Group(), st = steelM();
    cyl(0.2, 0.23, 0.035, 0x334155, g, 0, 0.0175, 0, 32);
    mesh(new T.CylinderGeometry(0.025, 0.025, 1.62, 16), st, g, 0, 0.83, 0);
    // display
    box(0.7, 0.32, 0.1, 0x111827, g, 0, 1.78, 0, 0.02);
    const dT = tex((c, Wd, Hd) => {
      c.fillStyle = '#050505'; c.fillRect(0, 0, Wd, Hd);
      c.shadowColor = '#ff7a1a'; c.shadowBlur = 18; txt(c, 'NOW SERVING', Wd / 2, Hd * 0.2, 62, '#fbbf24');
      c.shadowColor = '#ff2222'; c.shadowBlur = 30; txt(c, '07', Wd * 0.36, Hd * 0.64, 230, '#ff3b30');
      c.shadowBlur = 14; c.shadowColor = '#22c55e'; txt(c, '→ C1', Wd * 0.76, Hd * 0.64, 84, '#4ade80'); c.shadowBlur = 0;
      c.fillStyle = 'rgba(0,0,0,0.55)'; for (let x = 0; x < Wd; x += 7) c.fillRect(x, 0, 2, Hd); for (let y = 0; y < Hd; y += 7) c.fillRect(0, y, Wd, 2);
    }, 1024, 400);
    plane(0.64, 0.25, scrMat(dT, 1.0), g, 0, 1.775, 0.0505);
    box(0.7, 0.07, 0.1, Z.purple, g, 0, 1.975, 0, 0.012);
    plane(0.64, 0.05, picMat(label('ZUNGGA BANK · TOKEN', { w: 1024, h: 80, bg: '#7c3aed', fg: '#ffffff', size: 54 })), g, 0, 1.975, 0.0505);
    // dispenser
    const dsp = new T.Group(); dsp.position.set(0, 1.02, 0.06); g.add(dsp);
    box(0.34, 0.4, 0.2, 0xf1f5f9, dsp, 0, 0, 0, 0.03);
    box(0.34, 0.06, 0.2, Z.purple, dsp, 0, 0.19, 0, 0.02);
    const fT = tex((c, Wd, Hd) => { c.fillStyle = '#f1f5f9'; c.fillRect(0, 0, Wd, Hd); txt(c, 'PRESS FOR', Wd / 2, Hd * 0.12, 54, '#1f1a33'); txt(c, 'TOKEN', Wd / 2, Hd * 0.26, 74, '#7c3aed');
      c.fillStyle = '#1f1a33'; rr(c, Wd * 0.2, Hd * 0.78, Wd * 0.6, 26, 12); c.fill(); }, 512, 560);
    plane(0.3, 0.33, picMat(fT), dsp, 0, -0.02, 0.1005);
    const btn = cyl(0.045, 0.05, 0.03, Z.green, dsp, 0, -0.03, 0.11, 28); btn.rotation.x = Math.PI / 2; btn.material = mat(Z.green, { emissive: 0x16a34a, emissiveIntensity: 0.35, roughness: 0.3 });
    const ring = mesh(new T.TorusGeometry(0.05, 0.006, 8, 28), st, dsp, 0, -0.03, 0.104);
    const tkT = tex((c, Wd, Hd) => { c.fillStyle = '#fffdf5'; c.fillRect(0, 0, Wd, Hd); txt(c, 'TOKEN', Wd / 2, Hd * 0.25, 40, '#64748b'); txt(c, '08', Wd / 2, Hd * 0.62, 110, '#1f1a33'); }, 256, 256);
    const tk = plane(0.06, 0.06, picMat(tkT, { side: T.DoubleSide }), dsp, 0, -0.165, 0.12); tk.rotation.x = -0.5;
    return { group: g, phys: { shape: 'cylinder', r: 0.23, h: 2.0, mass: 0 } };
  }

  /* ---------------- cheque book ---------------- */
  function chequeBook() {
    const g = new T.Group(), W = 0.2, D = 0.088, t = 0.009;
    mesh(roundBox(W, 0.003, D, 0.001), mat(0x1e3a8a, { roughness: 0.5 }), g, 0, 0.0015, 0);
    box(W - 0.004, t - 0.003, D - 0.004, 0xf5f3ff, g, 0, 0.003 + (t - 0.003) / 2, 0, 0.0008);
    const chT = tex((c, Wd, Hd) => {
      const gr = c.createLinearGradient(0, 0, Wd, Hd); gr.addColorStop(0, '#ede9fe'); gr.addColorStop(1, '#e0f2fe'); c.fillStyle = gr; c.fillRect(0, 0, Wd, Hd);
      c.globalAlpha = 0.25; c.strokeStyle = '#a78bfa'; c.lineWidth = 2; for (let i = 0; i < 30; i++) { c.beginPath(); c.ellipse(Wd * 0.62, Hd * 0.5, 40 + i * 14, 20 + i * 6, 0, 0, 6.3); c.stroke(); } c.globalAlpha = 1;
      c.setLineDash([8, 8]); c.strokeStyle = '#64748b'; c.beginPath(); c.moveTo(Wd * 0.2, 0); c.lineTo(Wd * 0.2, Hd); c.stroke(); c.setLineDash([]);
      txt(c, 'Date', 14, 40, 22, '#475569', 'left', 600); txt(c, 'To', 14, 110, 22, '#475569', 'left', 600); txt(c, '₹', 14, 180, 22, '#475569', 'left', 600);
      c.strokeStyle = '#94a3b8'; c.lineWidth = 2; for (const y of [55, 125, 195]) { c.beginPath(); c.moveTo(60, y); c.lineTo(Wd * 0.19, y); c.stroke(); }
      const x0 = Wd * 0.22;
      txt(c, 'ZUNGGA BANK', x0, 48, 46, '#5b21b6', 'left'); txt(c, 'Savings · Kids Branch', x0, 86, 22, '#6d28d9', 'left', 600);
      for (let i = 0; i < 8; i++) { c.strokeStyle = '#64748b'; c.strokeRect(Wd * 0.68 + i * 36, 26, 32, 40); }
      txt(c, 'D D M M Y Y Y Y', Wd * 0.68 + 140, 82, 16, '#64748b', 'center', 600);
      const line = (y, lab, x1 = Wd - 30) => { txt(c, lab, x0, y - 12, 26, '#334155', 'left', 600); c.strokeStyle = '#64748b'; c.beginPath(); c.moveTo(x0 + c.measureText(lab).width + 12, y); c.lineTo(x1, y); c.stroke(); };
      line(150, 'Pay'); txt(c, 'or Bearer', Wd - 30, 126, 22, '#475569', 'right', 600);
      line(210, 'Rupees', Wd * 0.7); line(260, '', Wd * 0.7);
      c.fillStyle = '#ffffff'; rr(c, Wd * 0.73, 186, Wd * 0.24, 62, 8); c.fill(); c.strokeStyle = '#475569'; c.stroke(); txt(c, '₹', Wd * 0.745, 218, 38, '#1f1a33', 'left');
      txt(c, 'A/c No. 0707 2026 0001', x0, 310, 22, '#334155', 'left', 600);
      c.beginPath(); c.moveTo(Wd * 0.7, 330); c.lineTo(Wd - 30, 330); c.stroke(); txt(c, 'Signature', Wd * 0.835, 352, 20, '#475569', 'center', 600);
      txt(c, '⑈000107⑈  400123456⑆  07', Wd * 0.58, 410, 30, '#1f1a33', 'center', 600);
    }, 1024, 450);
    flat(W - 0.004, D - 0.004, picMat(chT, { roughness: 0.85 }), g, 0, t + 0.0002, 0);
    // pen across the book + bead chain to a small anchor
    const p = pen(0.14, Z.purple); p.position.set(0.02, t, 0.008); p.rotation.y = 0.32; g.add(p);
    const pe = new T.Vector3(-0.066, 0.0045, 0).applyAxisAngle(new T.Vector3(0, 1, 0), 0.32).add(p.position);
    const ax = -0.13, az = -0.05;
    cyl(0.012, 0.015, 0.012, 0x1f2937, g, ax, 0.006, az, 20);
    beadChain([[ax, 0.013, az], [ax + 0.012, 0.004, az + 0.02], [pe.x - 0.025, 0.006, pe.z - 0.01], [pe.x - 0.008, t + 0.002, pe.z], [pe.x, pe.y, pe.z]], 34, 0.0016, 0xc0c7d1, g);
    return { group: g, phys: { shape: 'box', size: [W, t, D], mass: 0.08, yOffset: t / 2 } };
  }

  /* ---------------- locker box ---------------- */
  function lockerBox() {
    const g = new T.Group(), W = 0.26, H = 0.13, D = 0.42, w = 0.008, st = steelM(0xb8c0cb);
    mesh(roundBox(W, w, D, 0.003), st, g, 0, w / 2, 0);
    for (const [bw, bd, x, z] of [[W, w, 0, D / 2 - w / 2], [W, w, 0, -D / 2 + w / 2], [w, D, W / 2 - w / 2, 0], [w, D, -W / 2 + w / 2, 0]]) mesh(roundBox(bw, H, bd, 0.003), st, g, x, H / 2, z);
    mesh(new T.BoxGeometry(W - 2 * w, 0.002, D - 2 * w), mat(0x7f1d1d, { roughness: 0.95 }), g, 0, w + 0.001, 0);   // velvet lining
    // front: number plate, keyhole + key, handle
    const F = D / 2 + 0.001;
    plane(0.07, 0.03, picMat(label('207', { w: 256, h: 110, bg: '#facc15', fg: '#1f1a33', size: 80, radius: 20 }), { transparent: true, metalness: 0.3 }), g, -0.07, H * 0.62, F);
    const kp = cyl(0.016, 0.016, 0.004, 0xd4a017, g, 0.05, H * 0.55, F + 0.002, 20); kp.rotation.x = Math.PI / 2; kp.material = mat(0xd4a017, { metalness: 0.45, roughness: 0.3 });
    const brass = mat(0xe0b33b, { metalness: 0.45, roughness: 0.28 });
    const key = new T.Group(); key.position.set(0.05, H * 0.55, F + 0.004); key.rotation.z = 0.2; g.add(key);
    const sh = mesh(new T.CylinderGeometry(0.0028, 0.0028, 0.03, 10), brass, key, 0, 0, 0.012); sh.rotation.x = Math.PI / 2;
    const bow = mesh(new T.TorusGeometry(0.011, 0.0035, 10, 24), brass, key, 0, 0.018, 0.028); bow.rotation.y = 0;
    const tagT = label('207', { w: 128, h: 96, bg: '#ef4444', fg: '#ffffff', size: 56, radius: 16 });
    const tag = plane(0.024, 0.018, picMat(tagT, { transparent: true, side: T.DoubleSide }), key, 0.004, 0.0, 0.032); tag.rotation.z = -0.4;
    const handle = mesh(new T.TorusGeometry(0.035, 0.005, 10, 24, Math.PI), st, g, 0, H * 0.25, F + 0.002); handle.rotation.set(Math.PI / 2, 0, Math.PI);
    // contents
    const cBundle = cloneOf('bundle_1lakh'), cCoin = cloneOf('zungga_coin');
    const b1 = cBundle(); b1.position.set(-0.04, w + 0.002, 0.08); b1.rotation.y = Math.PI / 2 - 0.1; g.add(b1);
    const b2 = cBundle(); b2.position.set(-0.03, w + 0.024, 0.07); b2.rotation.y = Math.PI / 2 + 0.08; g.add(b2);
    for (let i = 0; i < 3; i++) { const c = cCoin(); c.position.set(0.07, w + 0.002 + i * 0.0027, -0.08 + i * 0.001); g.add(c); }
    const jb = box(0.06, 0.04, 0.06, 0xdc2626, g, 0.06, w + 0.022, 0.07, 0.008); jb.material = mat(0xb91c1c, { roughness: 0.45 });
    sphere(0.008, 0xfacc15, g, 0.06, w + 0.045, 0.07, 12).material = brass;
    const doc = box(0.12, 0.004, 0.16, 0xfef3c7, g, -0.04, w + 0.004, -0.11, 0.001); doc.rotation.y = 0.12;
    // lid hinged at the back
    const hinge = new T.Group(); hinge.position.set(0, H, -D / 2); g.add(hinge);
    mesh(roundBox(W + 0.006, 0.01, D + 0.006, 0.003), st, hinge, 0, 0.005, D / 2);
    const hd = mesh(new T.CylinderGeometry(0.006, 0.006, W * 0.8, 12), steelM(0x8e98a5), hinge, 0, 0.004, -0.002); hd.rotation.z = Math.PI / 2;
    g.userData.setOn = (on) => { hinge.rotation.x = on ? -1.85 : 0; };
    g.userData.setOn(false);
    return { group: g, phys: { shape: 'box', size: [W, H + 0.01, D], mass: 2, yOffset: (H + 0.01) / 2 } };
  }

  /* ---------------- note counting machine ---------------- */
  function countingMachine() {
    const g = new T.Group(), W = 0.28, body = 0xe2e8f0, n500 = cloneOf('note_500');
    box(W, 0.14, 0.24, body, g, 0, 0.07, 0, 0.02);
    box(W, 0.12, 0.1, body, g, 0, 0.19, -0.07, 0.02);
    box(W + 0.004, 0.02, 0.244, Z.purple, g, 0, 0.02, 0, 0.006);
    for (const s of [-1, 1]) box(0.015, 0.1, 0.09, 0x94a3b8, g, s * 0.09, 0.29, -0.06, 0.005);   // hopper guides
    // hopper: notes standing, leaning back
    const lean = 0.42, th = Math.PI / 2 - lean, nrm = new T.Vector3(0, Math.sin(lean), Math.cos(lean));
    for (let i = 0; i < 9; i++) { const n = n500(); n.rotation.x = th;   // notes face front
      const base = new T.Vector3(0, 0.25, -0.03).addScaledVector(nrm, -i * 0.0016);
      n.position.copy(base).add(new T.Vector3(0, Math.cos(lean), -Math.sin(lean)).multiplyScalar(0.033)).add(new T.Vector3(0, -0.003, 0)); g.add(n); }
    // control panel with LCD
    const pnl = new T.Group(); pnl.position.set(0, 0.145, 0.05); pnl.rotation.x = 0.3; g.add(pnl);
    box(0.22, 0.016, 0.09, 0x334155, pnl, 0, 0, 0, 0.006);
    let shown = -1; const lcdC = document.createElement('canvas'); lcdC.width = 512; lcdC.height = 200;
    const lcdT = new T.CanvasTexture(lcdC); lcdT.colorSpace = T.SRGBColorSpace;
    const draw = (n) => { if (n === shown) return; shown = n; const c = lcdC.getContext('2d'), Wd = 512, Hd = 200;
      c.fillStyle = '#a7f3d0'; c.fillRect(0, 0, Wd, Hd); txt(c, 'COUNT', 20, 40, 34, '#065f46', 'left'); txt(c, '₹500', Wd - 20, 40, 34, '#065f46', 'right');
      txt(c, String(n).padStart(3, '0'), Wd / 2, 130, 130, '#022c22'); lcdT.needsUpdate = true; };
    draw(0);
    flat(0.11, 0.043, scrMat(lcdT, 0.35), pnl, -0.03, 0.0085, -0.005);
    [[0.065, Z.green], [0.09, 0xef4444]].forEach(([x, col]) => { const b = cyl(0.009, 0.009, 0.008, col, pnl, x, 0.01, -0.01, 16); b.material = mat(col, { roughness: 0.35 }); });
    // exit slot + stacker tray
    box(0.18, 0.012, 0.01, 0x0f172a, g, 0, 0.1, 0.121, 0.003);
    box(0.2, 0.012, 0.1, 0x94a3b8, g, 0, 0.035, 0.16, 0.004);
    for (const s of [-1, 1]) box(0.008, 0.035, 0.1, 0x94a3b8, g, s * 0.096, 0.05, 0.16, 0.003);
    for (let i = 0; i < 6; i++) { const n = n500(); n.position.set((i % 2 ? 0.002 : -0.002), 0.041 + i * 0.0012, 0.16); g.add(n); }
    // flying notes (tick)
    const fly = []; for (let i = 0; i < 3; i++) { const n = n500(); g.add(n); fly.push(n); }
    const tick = (t) => {
      fly.forEach((n, i) => { const p = ((t * 2.2 + i / 3) % 1 + 1) % 1;
        n.position.set(0, 0.1 - 0.05 * p * p, 0.105 + 0.06 * Math.min(1, p * 1.4)); n.rotation.x = -0.6 * (1 - p) + 0.2 * Math.sin(p * Math.PI); n.visible = p > 0.05; });
      draw(Math.floor(Math.max(0, t) * 6.6) % 1000);
    };
    tick(0); g.userData.tick = tick;
    return { group: g, phys: { shape: 'box', size: [W, 0.25, 0.3], mass: 0, yOffset: 0.125 } };
  }

  ZAssets.register('bank', 'bank_counter', 'Bank teller counter', bankCounter, ['bank', 'counter', 'teller', 'cashier', 'glass', 'set']);
  ZAssets.register('bank', 'piggy_bank', 'Piggy bank', piggyBank, ['piggy', 'savings', 'coins', 'pig']);
  ZAssets.register('bank', 'atm_machine', 'ATM machine', atmMachine, ['atm', 'cash', 'machine', 'card']);
  ZAssets.register('bank', 'vault_door', 'Bank vault door', vaultDoor, ['vault', 'safe', 'door', 'gold']);
  ZAssets.register('bank', 'passbook', 'Savings passbook', passbook, ['passbook', 'savings', 'account', 'book']);
  ZAssets.register('bank', 'debit_card', 'Zungga debit card', debitCard, ['card', 'debit', 'atm']);
  ZAssets.register('bank', 'token_machine', 'Queue token machine', tokenMachine, ['token', 'queue', 'display', 'serving']);
  ZAssets.register('bank', 'cheque_book', 'Cheque book', chequeBook, ['cheque', 'check', 'pen', 'book']);
  ZAssets.register('bank', 'locker_box', 'Safe-deposit locker', lockerBox, ['locker', 'safe', 'key', 'box']);
  ZAssets.register('bank', 'counting_machine', 'Note counting machine', countingMachine, ['counting', 'counter', 'notes', 'machine']);
})();
