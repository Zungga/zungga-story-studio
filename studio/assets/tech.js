/* Zungga Story Studio — tech / gadget props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box, logoTex, mascotTex, decal, label, cyl, sphere } = ZA;

  /* ---------------- local helpers ---------------- */
  const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const LOGO_AR = 755 / 920;
  const logoAt = (w, parent, x, y, z) => decal(logoTex(), w, w * LOGO_AR, parent, x, y, z);
  const metalM = (c = 0xd1d5db) => mat(c, { metalness: 0.35, roughness: 0.35 });
  const scrMat = (t, k = 0.6) => new T.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: k, roughness: 0.25 });
  const picMat = (t, o = {}) => new T.MeshStandardMaterial({ map: t, roughness: 0.6, ...o });
  function plane(w, h, m, parent, x = 0, y = 0, z = 0) { const p = mesh(new T.PlaneGeometry(w, h), m, parent, x, y, z); p.castShadow = false; return p; }
  function flat(w, d, m, parent, x = 0, y = 0, z = 0) { const p = plane(w, d, m, parent, x, y, z); p.rotation.x = -Math.PI / 2; return p; }
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  function txt(c, s, x, y, size, col, align = 'center', weight = 700, maxW = 0) {
    c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle';
    if (maxW) fitText(c, s, maxW, size, weight); else c.font = `${weight} ${size}px ${FONT}`;
    c.fillText(s, x, y);
  }
  function star(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } c.closePath(); c.fill(); }
  // generic app icons (no brands): colour + simple glyph
  const ICONS = [['#f97316', 'sun'], ['#22c55e', 'chat'], ['#3b82f6', 'cam'], ['#ec4899', 'note'], ['#facc15', 'star'], ['#8b5cf6', 'rupee'], ['#06b6d4', 'drop'], ['#ef4444', 'heart'],
    ['#10b981', 'book'], ['#6366f1', 'clock'], ['#f43f5e', 'play'], ['#0ea5e9', 'map'], ['#a855f7', 'game'], ['#84cc16', 'leaf'], ['#f59e0b', 'mail'], ['#14b8a6', 'calc']];
  function glyph(c, kind, x, y, s) {
    c.save(); c.translate(x, y); c.fillStyle = '#ffffff'; c.strokeStyle = '#ffffff'; c.lineWidth = s * 0.1; c.lineCap = 'round'; c.lineJoin = 'round';
    const circ = (cx, cy, r, f = true) => { c.beginPath(); c.arc(cx, cy, r, 0, 6.3); f ? c.fill() : c.stroke(); };
    switch (kind) {
      case 'sun': circ(0, 0, s * 0.2); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(Math.cos(a) * s * 0.28, Math.sin(a) * s * 0.28); c.lineTo(Math.cos(a) * s * 0.38, Math.sin(a) * s * 0.38); c.stroke(); } break;
      case 'chat': rr(c, -s * 0.32, -s * 0.26, s * 0.64, s * 0.42, s * 0.14); c.fill(); c.beginPath(); c.moveTo(-s * 0.14, s * 0.14); c.lineTo(-s * 0.24, s * 0.3); c.lineTo(s * 0.02, s * 0.14); c.fill(); break;
      case 'cam': rr(c, -s * 0.34, -s * 0.2, s * 0.68, s * 0.44, s * 0.08); c.fill(); c.fillStyle = '#3b82f6'; circ(0, s * 0.02, s * 0.14); c.fillStyle = '#fff'; rr(c, -s * 0.12, -s * 0.3, s * 0.24, s * 0.12, s * 0.04); c.fill(); break;
      case 'note': circ(-s * 0.12, s * 0.2, s * 0.1); c.fillRect(-s * 0.04, -s * 0.3, s * 0.07, s * 0.5); c.fillRect(-s * 0.04, -s * 0.3, s * 0.22, s * 0.08); break;
      case 'star': star(c, 0, 0, s * 0.34, '#ffffff'); break;
      case 'rupee': c.font = `700 ${s * 0.62}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('₹', 0, s * 0.03); break;
      case 'drop': c.beginPath(); c.moveTo(0, -s * 0.32); c.quadraticCurveTo(s * 0.28, 0, s * 0.2, s * 0.14); c.arc(0, s * 0.12, s * 0.2, 0, Math.PI); c.quadraticCurveTo(-s * 0.28, 0, 0, -s * 0.32); c.fill(); break;
      case 'heart': c.beginPath(); c.moveTo(0, s * 0.3); c.bezierCurveTo(-s * 0.45, 0, -s * 0.25, -s * 0.36, 0, -s * 0.12); c.bezierCurveTo(s * 0.25, -s * 0.36, s * 0.45, 0, 0, s * 0.3); c.fill(); break;
      case 'book': rr(c, -s * 0.3, -s * 0.26, s * 0.27, s * 0.5, s * 0.04); c.fill(); rr(c, s * 0.03, -s * 0.26, s * 0.27, s * 0.5, s * 0.04); c.fill(); break;
      case 'clock': circ(0, 0, s * 0.3, false); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.18); c.moveTo(0, 0); c.lineTo(s * 0.13, s * 0.06); c.stroke(); break;
      case 'play': c.beginPath(); c.moveTo(-s * 0.16, -s * 0.26); c.lineTo(s * 0.28, 0); c.lineTo(-s * 0.16, s * 0.26); c.closePath(); c.fill(); break;
      case 'map': c.beginPath(); c.arc(0, -s * 0.08, s * 0.2, Math.PI, 0); c.lineTo(0, s * 0.32); c.closePath(); c.fill(); c.fillStyle = '#0ea5e9'; circ(0, -s * 0.08, s * 0.08); break;
      case 'game': rr(c, -s * 0.36, -s * 0.16, s * 0.72, s * 0.36, s * 0.16); c.fill(); c.fillStyle = '#a855f7'; c.fillRect(-s * 0.24, -s * 0.03, s * 0.16, s * 0.05); c.fillRect(-s * 0.185, -s * 0.085, s * 0.05, s * 0.16); circ(s * 0.18, -s * 0.02, s * 0.045); circ(s * 0.26, s * 0.06, s * 0.045); break;
      case 'leaf': c.beginPath(); c.ellipse(0, 0, s * 0.18, s * 0.32, 0.6, 0, 6.3); c.fill(); break;
      case 'mail': rr(c, -s * 0.32, -s * 0.2, s * 0.64, s * 0.42, s * 0.05); c.fill(); c.strokeStyle = '#f59e0b'; c.beginPath(); c.moveTo(-s * 0.3, -s * 0.16); c.lineTo(0, s * 0.06); c.lineTo(s * 0.3, -s * 0.16); c.stroke(); break;
      case 'calc': rr(c, -s * 0.24, -s * 0.32, s * 0.48, s * 0.64, s * 0.06); c.fill(); c.fillStyle = '#14b8a6'; c.fillRect(-s * 0.16, -s * 0.24, s * 0.32, s * 0.12); for (let i = 0; i < 6; i++) circ(-s * 0.1 + (i % 3) * s * 0.1, s * 0.0 + Math.floor(i / 3) * s * 0.14, s * 0.035); break;
    }
    c.restore();
  }
  function icon(c, i, x, y, s) { const [col, k] = ICONS[i % ICONS.length]; const gr = c.createLinearGradient(x, y, x, y + s); gr.addColorStop(0, col); gr.addColorStop(1, shade(col)); rr(c, x, y, s, s, s * 0.26); c.fillStyle = gr; c.fill(); glyph(c, k, x + s / 2, y + s / 2, s); }
  function shade(col) { const n = parseInt(col.slice(1), 16), f = 0.78; return `rgb(${((n >> 16) & 255) * f | 0},${((n >> 8) & 255) * f | 0},${(n & 255) * f | 0})`; }
  function statusBar(c, Wd, col = '#ffffff') { txt(c, '9:41', Wd * 0.1, 34, 30, col, 'left'); c.fillStyle = col; for (let i = 0; i < 4; i++) c.fillRect(Wd * 0.72 + i * 12, 44 - i * 6, 8, 6 + i * 6); rr(c, Wd * 0.84, 24, 46, 22, 6); c.fill(); }

  // a modern phone, standing vertical, screen facing +z, bottom at y = 0 of its group
  function phoneBody(screenT, col = 0x1f2937) {
    const g = new T.Group(), W = 0.072, H = 0.152, t = 0.008;
    mesh(roundBox(W, H, t, 0.0035), mat(col, { roughness: 0.3, metalness: 0.25 }), g, 0, H / 2, 0);
    plane(W - 0.005, H - 0.005, mat(0x05070d, { roughness: 0.15 }), g, 0, H / 2, t / 2 + 0.0001);
    const sp = plane(W - 0.007, H - 0.008, scrMat(screenT, 0.6), g, 0, H / 2, t / 2 + 0.0002); sp.material.roughness = 0.15;
    mesh(roundBox(0.016, 0.004, 0.0008, 0.0003), mat(0x05070d, { roughness: 0.2 }), g, 0, H - 0.008, t / 2 + 0.0004);
    for (const [y, h] of [[H * 0.72, 0.016], [H * 0.6, 0.016]]) box(0.0016, h, 0.003, col, g, -W / 2 - 0.0004, y, 0, 0.0006);
    box(0.0016, 0.022, 0.003, col, g, W / 2 + 0.0004, H * 0.68, 0, 0.0006);
    const bump = mesh(roundBox(0.028, 0.03, 0.002, 0.0008), mat(0x111827, { roughness: 0.3 }), g, -W / 2 + 0.019, H - 0.022, -t / 2 - 0.0008);
    for (const [x, y] of [[-W / 2 + 0.013, H - 0.015], [-W / 2 + 0.013, H - 0.029], [-W / 2 + 0.026, H - 0.015]]) { const l = cyl(0.0042, 0.0042, 0.0015, 0x020617, g, x, y, -t / 2 - 0.002, 16); l.rotation.x = Math.PI / 2; }
    return g;
  }
  // a small desk stand; returns the tilt group where the phone sits
  function stand(parent, w = 0.07, tilt = 0.26, col = 0xe5e7eb) {
    box(w, 0.006, 0.07, col, parent, 0, 0.003, -0.012, 0.0025);
    const back = box(w * 0.7, 0.07, 0.006, col, parent, 0, 0.036, -0.03, 0.0025); back.rotation.x = -tilt;
    box(w, 0.012, 0.006, col, parent, 0, 0.009, 0.019, 0.0025);
    const holder = new T.Group(); holder.position.set(0, 0.006, 0.01); holder.rotation.x = -tilt; parent.add(holder);
    return holder;
  }

  /* ---------------- phone ---------------- */
  function homeTex() {
    return tex((c, Wd, Hd) => {
      const gr = c.createLinearGradient(0, 0, Wd, Hd); gr.addColorStop(0, '#6d28d9'); gr.addColorStop(0.6, '#db2777'); gr.addColorStop(1, '#f59e0b'); c.fillStyle = gr; c.fillRect(0, 0, Wd, Hd);
      c.fillStyle = 'rgba(255,255,255,0.1)'; for (const [x, y, r] of [[0.2, 0.25, 160], [0.85, 0.55, 220], [0.3, 0.85, 140]]) { c.beginPath(); c.arc(Wd * x, Hd * y, r, 0, 6.3); c.fill(); }
      statusBar(c, Wd);
      txt(c, '9:41', Wd / 2, Hd * 0.13, 130, '#ffffff', 'center', 600); txt(c, 'Saturday, 17 October', Wd / 2, Hd * 0.2, 30, '#fde68a', 'center', 600);
      const s = 92, gap = (Wd - 4 * s) / 5;
      for (let i = 0; i < 12; i++) { const col = i % 4, row = Math.floor(i / 4), x = gap + col * (s + gap), y = Hd * 0.27 + row * (s + 56); icon(c, i, x, y, s);
        txt(c, ['Weather', 'Chat', 'Camera', 'Music', 'Stars', 'Savings', 'Water', 'Health', 'Books', 'Clock', 'Videos', 'Maps'][i], x + s / 2, y + s + 22, 20, '#ffffff', 'center', 600); }
      c.fillStyle = 'rgba(255,255,255,0.25)'; rr(c, 24, Hd - 170, Wd - 48, 130, 44); c.fill();
      for (let i = 0; i < 4; i++) icon(c, [1, 2, 12, 14][i], gap + i * (s + gap), Hd - 150, s);
      c.fillStyle = '#ffffff'; rr(c, Wd / 2 - 80, Hd - 22, 160, 8, 4); c.fill();
    }, 512, 1080);
  }
  function phone() {
    const g = new T.Group(), h = stand(g);
    h.add(phoneBody(homeTex()));
    return { group: g, phys: { shape: 'box', size: [0.072, 0.15, 0.08], mass: 0.2, yOffset: 0.075 } };
  }

  /* ---------------- laptop ---------------- */
  function laptop() {
    const g = new T.Group(), W = 0.32, D = 0.22, t = 0.016, silver = metalM(0xd4d8de);
    mesh(roundBox(W, t, D, 0.005), silver, g, 0, t / 2, 0);
    const kb = tex((c, Wd, Hd) => {
      c.fillStyle = '#c9ced6'; c.fillRect(0, 0, Wd, Hd);
      const kx = Wd * 0.06, kw = Wd * 0.88, rows = 5, kh = Hd * 0.09;
      for (let r = 0; r < rows; r++) { const n = 13, w = kw / n; for (let i = 0; i < n; i++) { c.fillStyle = '#1f2937'; rr(c, kx + i * w + 3, Hd * 0.08 + r * (kh + 6), w - 6, kh, 6); c.fill(); } }
      c.fillStyle = '#1f2937'; rr(c, kx + kw * 0.25, Hd * 0.08 + 5 * (kh + 6), kw * 0.5, kh, 6); c.fill();
      c.fillStyle = '#b8bec8'; rr(c, Wd * 0.33, Hd * 0.66, Wd * 0.34, Hd * 0.29, 18); c.fill(); c.strokeStyle = '#a3aab5'; c.lineWidth = 3; c.stroke();
    }, 1024, 704);
    flat(W - 0.01, D - 0.01, picMat(kb, { roughness: 0.5 }), g, 0, t + 0.0002, 0);
    const hinge = new T.Group(); hinge.position.set(0, t, -D / 2 + 0.006); hinge.rotation.x = -0.3; g.add(hinge);
    const LH = 0.21;
    mesh(roundBox(W, LH, 0.007, 0.0035), silver, hinge, 0, LH / 2, 0);
    plane(W - 0.012, LH - 0.012, mat(0x0b0f19, { roughness: 0.2 }), hinge, 0, LH / 2, 0.0037);
    const sc = tex((c, Wd, Hd) => {
      const gr = c.createLinearGradient(0, 0, Wd, Hd); gr.addColorStop(0, '#c7d2fe'); gr.addColorStop(1, '#fbcfe8'); c.fillStyle = gr; c.fillRect(0, 0, Wd, Hd);
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(0, 0, Wd, 34); txt(c, '9:41', Wd - 20, 18, 20, '#1f1a33', 'right');
      c.fillStyle = '#ffffff'; rr(c, Wd * 0.12, 70, Wd * 0.76, Hd * 0.7, 18); c.fill();
      c.fillStyle = '#7c3aed'; rr(c, Wd * 0.12, 70, Wd * 0.76, 56, [18, 18, 0, 0]); c.fill();
      for (const [i, col] of [[0, '#f87171'], [1, '#fbbf24'], [2, '#4ade80']]) { c.fillStyle = col; c.beginPath(); c.arc(Wd * 0.12 + 28 + i * 26, 98, 8, 0, 6.3); c.fill(); }
      txt(c, 'ZUNGGA LEARN · Money Quiz', Wd / 2 + 30, 98, 26, '#ffffff');
      txt(c, '₹50 + ₹20 = ?', Wd / 2, 200, 64, '#1f1a33');
      ['₹60', '₹70', '₹80'].forEach((s, i) => { const x = Wd * 0.2 + i * Wd * 0.21; rr(c, x, 260, Wd * 0.18, 70, 16); c.fillStyle = i === 1 ? '#22c55e' : '#ede9fe'; c.fill(); txt(c, s, x + Wd * 0.09, 296, 38, i === 1 ? '#ffffff' : '#5b21b6'); });
      star(c, Wd * 0.78, 372, 22, '#facc15'); star(c, Wd * 0.72, 372, 22, '#facc15'); star(c, Wd * 0.66, 372, 22, '#facc15');
      txt(c, 'Great job!', Wd * 0.22, 372, 30, '#16a34a', 'left');
      c.fillStyle = 'rgba(255,255,255,0.75)'; rr(c, Wd * 0.3, Hd - 56, Wd * 0.4, 46, 14); c.fill();
      for (let i = 0; i < 6; i++) icon(c, i, Wd * 0.3 + 14 + i * Wd * 0.064, Hd - 50, 34);
    }, 1024, 680);
    plane(W - 0.02, LH - 0.022, scrMat(sc, 0.55), hinge, 0, LH / 2 + 0.002, 0.0039);
    const lg = logoAt(0.06, hinge, 0, LH / 2, -0.0037); lg.rotation.y = Math.PI;
    return { group: g, phys: { shape: 'box', size: [W, t, D], mass: 1.4, yOffset: t / 2 } };
  }

  /* ---------------- tablet ---------------- */
  function tablet() {
    const g = new T.Group(), W = 0.245, H = 0.172, t = 0.007, tilt = 0.32;
    const cover = mat(Z.purple, { roughness: 0.75 });
    // folded cover stand
    mesh(roundBox(W, 0.004, 0.06, 0.0015), cover, g, 0, 0.002, -0.06);
    const flap = mesh(roundBox(W, 0.004, 0.11, 0.0015), cover, g, 0, 0.052, -0.072); flap.rotation.x = 1.1;
    box(W, 0.008, 0.01, 0x5b21b6, g, 0, 0.004, 0.03, 0.003);
    const tg = new T.Group(); tg.position.set(0, 0.004, 0.022); tg.rotation.x = -tilt; g.add(tg);
    mesh(roundBox(W, H, t, 0.008), mat(0x374151, { roughness: 0.3, metalness: 0.25 }), tg, 0, H / 2, 0);
    plane(W - 0.008, H - 0.008, mat(0x05070d, { roughness: 0.15 }), tg, 0, H / 2, t / 2 + 0.0001);
    const sc = tex((c, Wd, Hd) => {
      const gr = c.createLinearGradient(0, 0, 0, Hd); gr.addColorStop(0, '#7dd3fc'); gr.addColorStop(0.7, '#e0f2fe'); c.fillStyle = gr; c.fillRect(0, 0, Wd, Hd);
      c.fillStyle = '#86efac'; c.beginPath(); c.ellipse(Wd * 0.3, Hd * 0.95, Wd * 0.5, Hd * 0.25, 0, 0, 6.3); c.fill(); c.fillStyle = '#4ade80'; c.beginPath(); c.ellipse(Wd * 0.85, Hd, Wd * 0.45, Hd * 0.28, 0, 0, 6.3); c.fill();
      c.fillStyle = '#ffffff'; for (const [x, y] of [[0.15, 0.2], [0.75, 0.16]]) { c.beginPath(); c.arc(Wd * x, Hd * y, 30, 0, 6.3); c.arc(Wd * x + 36, Hd * y - 10, 36, 0, 6.3); c.arc(Wd * x + 74, Hd * y, 28, 0, 6.3); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, 0, Wd, 54); txt(c, 'Zungga Stories · Episode 3', 24, 28, 28, '#ffffff', 'left');
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, Hd - 60, Wd, 60); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(24, Hd - 44); c.lineTo(48, Hd - 30); c.lineTo(24, Hd - 16); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.4)'; rr(c, 70, Hd - 34, Wd - 190, 8, 4); c.fill(); c.fillStyle = '#ec4899'; rr(c, 70, Hd - 34, (Wd - 190) * 0.42, 8, 4); c.fill();
      c.beginPath(); c.arc(70 + (Wd - 190) * 0.42, Hd - 30, 11, 0, 6.3); c.fill(); txt(c, '2:15', Wd - 24, Hd - 30, 24, '#ffffff', 'right');
    }, 1024, 720);
    plane(W - 0.014, H - 0.014, scrMat(sc, 0.55), tg, 0, H / 2, t / 2 + 0.0002);
    decal(mascotTex(), 0.09, 0.09, tg, 0, H / 2 + 0.002, t / 2 + 0.0006);
    const cam = cyl(0.0018, 0.0018, 0.0008, 0x020617, tg, 0, H - 0.0035, t / 2 + 0.0002, 12); cam.rotation.x = Math.PI / 2;
    return { group: g, phys: { shape: 'box', size: [W, 0.17, 0.14], mass: 0.5, yOffset: 0.085 } };
  }

  /* ---------------- headphones ---------------- */
  function headphones() {
    const g = new T.Group(), inner = new T.Group(); inner.rotation.y = 0.35; g.add(inner);
    const purple = mat(Z.purple, { roughness: 0.35 }), dark = mat(0x2e1065, { roughness: 0.85 }), metal = metalM(0xcbd5e1);
    const CR = 0.044, CY = CR + 0.002, BX = 0.086, BY = 0.1;
    for (const s of [-1, 1]) {
      const cup = mesh(new T.CylinderGeometry(CR, CR * 0.92, 0.032, 32), purple, inner, s * (BX - 0.004), CY, 0); cup.rotation.z = Math.PI / 2;
      const cap = mesh(new T.CylinderGeometry(CR * 0.7, CR * 0.7, 0.004, 32), mat(0xede9fe, { roughness: 0.4 }), inner, s * (BX + 0.0135), CY, 0); cap.rotation.z = Math.PI / 2;
      const zT = tex((c, Wd, Hd) => { txt(c, 'Z', Wd / 2, Hd / 2 + 8, 200, '#7c3aed'); }, 256, 256);
      const zp = plane(0.04, 0.04, picMat(zT, { transparent: true }), inner, s * (BX + 0.0158), CY, 0); zp.rotation.y = s * Math.PI / 2;
      const cush = mesh(new T.TorusGeometry(CR * 0.72, 0.013, 14, 32), dark, inner, s * (BX - 0.026), CY, 0); cush.rotation.y = Math.PI / 2;
      mesh(new T.CircleGeometry(CR * 0.7, 24), mat(0x1e1b4b), inner, s * (BX - 0.024), CY, 0).rotation.y = -s * Math.PI / 2;
      // yoke + slider
      const yk = mesh(new T.TorusGeometry(CR * 0.98, 0.0035, 8, 24, Math.PI), metal, inner, s * (BX - 0.004), CY, 0); yk.rotation.y = Math.PI / 2;
      box(0.012, BY - CY - CR + 0.012, 0.012, Z.purple, inner, s * (BX - 0.004), CY + CR + (BY - CY - CR) / 2, 0, 0.004).material = metal;
    }
    const band = mesh(new T.TorusGeometry(BX - 0.004, 0.0075, 12, 48, Math.PI), purple, inner, 0, BY, 0);
    const pad = mesh(new T.TorusGeometry(BX - 0.012, 0.011, 12, 32, Math.PI * 0.56), dark, inner, 0, BY, 0); pad.rotation.z = Math.PI * 0.22;
    pad.scale.z = 1.2;
    return { group: g, phys: { shape: 'box', size: [0.2, 0.19, 0.09], mass: 0.25, yOffset: 0.095 } };
  }

  /* ---------------- smartwatch ---------------- */
  function smartwatch() {
    const g = new T.Group(), R = 0.031, SW = 0.022, cy = R + 0.003;
    const strap = mesh(new T.CylinderGeometry(R, R, SW, 48, 1, true), mat(Z.purple, { roughness: 0.55, side: T.DoubleSide }), g, 0, cy, 0); strap.rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) { const e = mesh(new T.TorusGeometry(R, 0.0015, 6, 48), mat(0x6d28d9, { roughness: 0.5 }), g, s * SW / 2, cy, 0); e.rotation.y = Math.PI / 2; }
    const buckle = box(SW + 0.004, 0.004, 0.012, 0xcbd5e1, g, 0, cy - R + 0.0005, -0.006, 0.0015); buckle.material = metalM();
    const a = 0.72, wb = new T.Group(); wb.position.set(0, cy + Math.cos(a) * (R + 0.006), Math.sin(a) * (R + 0.006)); wb.rotation.x = a - Math.PI / 2; g.add(wb);
    mesh(roundBox(0.04, 0.046, 0.012, 0.008), mat(0x1f2937, { roughness: 0.3, metalness: 0.3 }), wb, 0, 0, 0);
    const face = tex((c, Wd, Hd) => {
      c.fillStyle = '#000000'; rr(c, 0, 0, Wd, Hd, 90); c.fill();
      const ring = (r, col, f) => { c.lineWidth = 26; c.lineCap = 'round'; c.strokeStyle = col + '40'; c.beginPath(); c.arc(Wd / 2, Hd * 0.62, r, 0, 6.3); c.stroke(); c.strokeStyle = col; c.beginPath(); c.arc(Wd / 2, Hd * 0.62, r, -Math.PI / 2, -Math.PI / 2 + f * 6.283); c.stroke(); };
      ring(120, '#ec4899', 0.8); ring(88, '#22c55e', 0.6); ring(56, '#38bdf8', 0.9);
      txt(c, '10:30', Wd / 2, Hd * 0.17, 104, '#ffffff', 'center', 600); txt(c, 'SAT 17', Wd / 2, Hd * 0.3, 34, '#fbbf24', 'center', 600);
      star(c, Wd / 2, Hd * 0.62, 22, '#facc15');
    }, 448, 512);
    plane(0.034, 0.0395, scrMat(face, 0.7), wb, 0, 0, 0.0061);
    const crown = cyl(0.0035, 0.0035, 0.004, 0xcbd5e1, wb, 0.0215, 0.006, 0, 16); crown.rotation.z = Math.PI / 2; crown.material = metalM();
    box(0.002, 0.009, 0.004, 0xcbd5e1, wb, 0.0205, -0.008, 0, 0.0008);
    return { group: g, phys: { shape: 'box', size: [0.03, 0.075, 0.07], mass: 0.04, yOffset: 0.035 } };
  }

  /* ---------------- savings app on a phone ---------------- */
  function football(c, x, y, r) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill(); c.strokeStyle = '#1f1a33'; c.lineWidth = 3; c.stroke(); c.fillStyle = '#1f1a33';
    const pent = (px, py, pr) => { c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; c.lineTo(px + Math.cos(a) * pr, py + Math.sin(a) * pr); } c.closePath(); c.fill(); };
    pent(x, y, r * 0.32); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; c.save(); c.beginPath(); c.arc(x, y, r, 0, 6.3); c.clip(); pent(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92, r * 0.26); c.restore(); } }
  function appTex(done) {
    return tex((c, Wd, Hd) => {
      c.fillStyle = '#f5f3ff'; c.fillRect(0, 0, Wd, Hd);
      const gr = c.createLinearGradient(0, 0, Wd, 300); gr.addColorStop(0, '#7c3aed'); gr.addColorStop(1, '#a855f7'); c.fillStyle = gr; rr(c, 0, 0, Wd, 300, [0, 0, 50, 50]); c.fill();
      statusBar(c, Wd); txt(c, 'My Savings', 40, 120, 54, '#ffffff', 'left'); txt(c, 'ZUNGGA', Wd - 40, 120, 28, '#fde68a', 'right');
      txt(c, 'Total saved', 40, 190, 28, '#e9d5ff', 'left', 600); txt(c, done ? '₹150' : '₹90', 40, 245, 70, '#ffffff', 'left');
      // goal card
      c.fillStyle = '#ffffff'; c.shadowColor = 'rgba(76,29,149,0.18)'; c.shadowBlur = 24; rr(c, 30, 330, Wd - 60, 330, 34); c.fill(); c.shadowBlur = 0;
      football(c, 110, 420, 46); txt(c, 'Football', 180, 400, 46, '#1f1a33', 'left'); txt(c, 'Goal ₹150', 180, 448, 30, '#6b7280', 'left', 600);
      const f = done ? 1 : 0.6, bx = 60, bw = Wd - 120, by = 510;
      c.fillStyle = '#ede9fe'; rr(c, bx, by, bw, 44, 22); c.fill();
      const bg2 = c.createLinearGradient(bx, 0, bx + bw, 0); bg2.addColorStop(0, '#22c55e'); bg2.addColorStop(1, done ? '#facc15' : '#4ade80'); c.fillStyle = bg2; rr(c, bx, by, bw * f, 44, 22); c.fill();
      txt(c, done ? '100%' : '60%', bx + Math.max(60, bw * f - 50), by + 23, 28, '#ffffff');
      txt(c, done ? 'Goal reached!' : '₹90 saved · ₹60 to go', Wd / 2, 610, done ? 44 : 32, done ? '#16a34a' : '#4b5563', 'center', 700);
      if (done) { for (const [x, y, r, col] of [[Wd * 0.5, 820, 120, '#facc15'], [Wd * 0.2, 760, 34, '#f472b6'], [Wd * 0.82, 740, 40, '#38bdf8'], [Wd * 0.85, 920, 28, '#22c55e'], [Wd * 0.15, 930, 26, '#fb923c']]) star(c, x, y, r, col);
        txt(c, '★', Wd / 2, 830, 1, '#facc15');
        const rnd = seeded(5); for (let i = 0; i < 70; i++) { c.fillStyle = ['#ec4899', '#facc15', '#22c55e', '#38bdf8', '#a855f7', '#fb923c'][i % 6]; c.save(); c.translate(rnd() * Wd, 640 + rnd() * 420); c.rotate(rnd() * 3); c.fillRect(-9, -4, 18, 8); c.restore(); }
        txt(c, 'Well done, saver!', Wd / 2, 1000, 36, '#7c3aed');
      } else {
        // add buttons + weekly bars
        [['+ ₹10', '#7c3aed'], ['History', '#ede9fe']].forEach(([s, col], i) => { const x = 40 + i * (Wd / 2 - 20); rr(c, x, 690, Wd / 2 - 60, 80, 26); c.fillStyle = col; c.fill(); txt(c, s, x + (Wd / 2 - 60) / 2, 731, 34, i ? '#5b21b6' : '#ffffff'); });
        txt(c, 'This week', 40, 820, 30, '#1f1a33', 'left');
        [30, 50, 20, 60, 40, 70, 45].forEach((v, i) => { const x = 50 + i * 62, h = v * 2; c.fillStyle = i === 5 ? '#7c3aed' : '#c4b5fd'; rr(c, x, 1010 - h, 38, h, 10); c.fill(); txt(c, 'MTWTFSS'[i], x + 19, 1035, 22, '#6b7280', 'center', 600); });
      }
    }, 512, 1080);
  }
  function savingsAppScreen() {
    const g = new T.Group(), h = stand(g, 0.07, 0.26, 0xede9fe);
    const tA = appTex(false), tB = appTex(true), body = phoneBody(tA, 0x4c1d95); h.add(body);
    const scr = body.children[2];
    const fx = new T.Group(); h.add(fx);
    const sh = new T.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.011 : 0.025; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const st = mesh(new T.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 2 }), mat(Z.yellow, { emissive: 0xf59e0b, emissiveIntensity: 0.35, roughness: 0.3 }), fx, 0, 0.18, 0.004);
    const rnd = seeded(9), cols = [Z.pink, Z.yellow, Z.green, Z.blue, Z.purple, Z.orange], pg = new T.PlaneGeometry(0.008, 0.004);
    for (let i = 0; i < 30; i++) { const a = rnd() * 6.283, r = 0.05 + rnd() * 0.05; const p = mesh(pg, mat(cols[i % 6], { side: T.DoubleSide, roughness: 0.5 }), fx, Math.cos(a) * r, 0.08 + Math.sin(a) * r * 1.1 + 0.02, 0.01 + rnd() * 0.03); p.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); }
    g.userData.setOn = (on) => { const m = scr.material; m.map = m.emissiveMap = on ? tB : tA; m.needsUpdate = true; fx.visible = !!on; };
    g.userData.setOn(false);
    return { group: g, phys: { shape: 'box', size: [0.072, 0.15, 0.08], mass: 0.2, yOffset: 0.075 } };
  }

  /* ---------------- TV remote ---------------- */
  function tvRemote() {
    const g = new T.Group(), inner = new T.Group(); inner.rotation.y = -0.45; g.add(inner);
    const W = 0.048, t = 0.016, L = 0.19, top = t;
    mesh(roundBox(W, t, L, 0.007), mat(0x27272a, { roughness: 0.4 }), inner, 0, t / 2, 0);
    const bg = tex((c, Wd, Hd) => { c.fillStyle = '#3f3f46'; rr(c, 0, 0, Wd, Hd, 60); c.fill();
      txt(c, 'ZUNGGA', Wd / 2, Hd * 0.95, 34, '#a78bfa'); txt(c, 'VOL', Wd * 0.22, Hd * 0.5, 22, '#d4d4d8'); txt(c, 'CH', Wd * 0.78, Hd * 0.5, 22, '#d4d4d8');
      c.fillStyle = '#ef4444'; c.beginPath(); c.arc(Wd / 2, Hd * 0.03, 8, 0, 6.3); c.fill(); }, 256, 1024);
    flat(W - 0.006, L - 0.008, picMat(bg, { roughness: 0.4 }), inner, 0, top + 0.0002, 0);
    const btnM = mat(0xd4d4d8, { roughness: 0.45 });
    const key = (x, z, r, col, lab, lc = '#27272a') => { const b = cyl(r, r, 0.003, col, inner, x, top + 0.0015, z, 20); if (col === 0xd4d4d8) b.material = btnM;
      if (lab) { const lt = tex((c, Wd, Hd) => txt(c, lab, Wd / 2, Hd / 2 + 4, 90, lc), 128, 128); flat(r * 1.8, r * 1.8, picMat(lt, { transparent: true }), inner, x, top + 0.0032, z); } return b; };
    const pw = key(-0.012, -0.08, 0.0055, 0xef4444); const pt = tex((c, Wd, Hd) => { c.strokeStyle = '#fff'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.arc(64, 68, 32, -1.1, 4.25); c.stroke(); c.beginPath(); c.moveTo(64, 22); c.lineTo(64, 64); c.stroke(); }, 128, 128);
    flat(0.009, 0.009, picMat(pt, { transparent: true }), inner, -0.012, top + 0.0032, -0.08);
    key(0.012, -0.08, 0.0045, Z.purple, 'Z', '#ffffff');
    // d-pad
    const ring = mesh(new T.CylinderGeometry(0.017, 0.017, 0.003, 32), btnM, inner, 0, top + 0.0015, -0.045);
    const ar = tex((c, Wd, Hd) => { c.fillStyle = '#52525b'; for (let i = 0; i < 4; i++) { c.save(); c.translate(Wd / 2, Hd / 2); c.rotate(i * Math.PI / 2); c.beginPath(); c.moveTo(0, -Hd * 0.44); c.lineTo(18, -Hd * 0.34); c.lineTo(-18, -Hd * 0.34); c.fill(); c.restore(); } }, 256, 256);
    flat(0.034, 0.034, picMat(ar, { transparent: true }), inner, 0, top + 0.0031, -0.045);
    key(0, -0.045, 0.0075, Z.purple, 'OK', '#ffffff').position.y += 0.001;
    // vol / ch rockers
    for (const s of [-1, 1]) { mesh(roundBox(0.01, 0.004, 0.03, 0.0018), btnM, inner, s * 0.0135, top + 0.002, -0.007);
      const pm = tex((c, Wd, Hd) => { txt(c, s < 0 ? '+' : '▲', Wd / 2, Hd * 0.18, 70, '#27272a'); txt(c, s < 0 ? '−' : '▼', Wd / 2, Hd * 0.82, 70, '#27272a'); }, 128, 384);
      flat(0.009, 0.027, picMat(pm, { transparent: true }), inner, s * 0.0135, top + 0.0041, -0.007); }
    key(0, -0.007, 0.004, 0x52525b);
    // number pad
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''].forEach((n, i) => { if (!n) return; key((i % 3 - 1) * 0.0135, 0.022 + Math.floor(i / 3) * 0.0125, 0.0045, 0xd4d4d8, n); });
    return { group: g, phys: { shape: 'box', size: [W, t, L], mass: 0.1, yOffset: t / 2 } };
  }

  /* ---------------- compact camera ---------------- */
  function camera() {
    const g = new T.Group(), W = 0.105, H = 0.062, D = 0.032, cy = H / 2;
    mesh(roundBox(W, H, D, 0.009), mat(0xf1f5f9, { roughness: 0.35 }), g, 0, cy, 0);
    const grip = tex((c, Wd, Hd) => { c.fillStyle = '#6d28d9'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < Hd; y += 10) for (let x = (y / 10) % 2 ? 5 : 0; x < Wd; x += 10) c.fillRect(x, y, 4, 4); }, 128, 256);
    mesh(roundBox(0.026, H - 0.006, 0.006, 0.0025), picMat(grip, { roughness: 0.8 }), g, -W / 2 + 0.017, cy, D / 2 + 0.001);
    // lens
    const lx = 0.012, metal = metalM(0xcbd5e1);
    const l1 = mesh(new T.CylinderGeometry(0.024, 0.025, 0.008, 40), metal, g, lx, cy, D / 2 + 0.004); l1.rotation.x = Math.PI / 2;
    const l2 = mesh(new T.CylinderGeometry(0.019, 0.021, 0.014, 40), mat(0x1f2937, { roughness: 0.35 }), g, lx, cy, D / 2 + 0.014); l2.rotation.x = Math.PI / 2;
    const l3 = mesh(new T.TorusGeometry(0.0175, 0.0018, 10, 40), metal, g, lx, cy, D / 2 + 0.021);
    const glass = mesh(new T.SphereGeometry(0.016, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.32), mat(0x1e3a8a, { roughness: 0.05, metalness: 0.4 }), g, lx, cy, D / 2 + 0.006); glass.rotation.x = Math.PI / 2; glass.position.z = D / 2 + 0.021 - 0.016 * Math.cos(Math.PI * 0.32);
    sphere(0.0035, 0xffffff, g, lx + 0.005, cy + 0.005, D / 2 + 0.0245, 10).material = mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 });
    const lt = tex((c, Wd, Hd) => { c.strokeStyle = '#94a3b8'; c.lineWidth = 6; c.beginPath(); c.arc(Wd / 2, Hd / 2, Wd / 2 - 6, 0, 6.3); c.stroke(); c.save(); c.translate(Wd / 2, Hd / 2); c.font = `600 22px ${FONT}`; c.fillStyle = '#e2e8f0'; c.textAlign = 'center'; c.fillText('ZOOM 5x · 4.3–21.5', 0, -Wd * 0.39); c.restore(); }, 256, 256);
    plane(0.036, 0.036, picMat(lt, { transparent: true }), g, lx, cy, D / 2 + 0.0082);
    // flash, window, label
    box(0.016, 0.008, 0.002, 0xf8fafc, g, W / 2 - 0.014, H - 0.011, D / 2 + 0.001, 0.0008).material = mat(0xffffff, { emissive: 0xfffbeb, emissiveIntensity: 0.4, roughness: 0.1 });
    sphere(0.0025, 0xf97316, g, -W / 2 + 0.036, H - 0.01, D / 2 + 0.0005, 10);
    plane(0.036, 0.008, picMat(label('ZUNGGA', { w: 384, h: 84, bg: 'rgba(0,0,0,0)', fg: '#6d28d9', size: 64 }), { transparent: true }), g, W / 2 - 0.026, 0.008, D / 2 + 0.0002);
    // top controls
    const sh = cyl(0.006, 0.0065, 0.004, 0xcbd5e1, g, W / 2 - 0.02, H + 0.002, 0, 24); sh.material = metal;
    cyl(0.0042, 0.0042, 0.0025, Z.pink, g, W / 2 - 0.02, H + 0.005, 0, 20);
    const dial = cyl(0.008, 0.008, 0.005, 0x334155, g, W / 2 - 0.042, H + 0.0025, -0.003, 24);
    box(0.012, 0.002, 0.004, 0x94a3b8, g, -0.005, H + 0.0008, 0, 0.0008);
    // strap lug + loop
    const lug = mesh(new T.TorusGeometry(0.004, 0.0013, 8, 16), metal, g, -W / 2 - 0.002, H - 0.012, 0); lug.rotation.y = Math.PI / 2;
    const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2; pts.push(new T.Vector3(-W / 2 - 0.004 - (1 - Math.cos(a)) * 0.018, H - 0.012 - Math.sin(a) * 0.006 - (1 - Math.cos(a)) * 0.02, Math.sin(a) * 0.008)); }
    mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 48, 0.0018, 8, true), mat(Z.purple, { roughness: 0.7 }), g);
    return { group: g, phys: { shape: 'box', size: [W, H, D], mass: 0.2, yOffset: cy } };
  }

  /* ---------------- power bank + cable + charger ---------------- */
  function chargerPowerbank() {
    const g = new T.Group(), white = mat(0xf8fafc, { roughness: 0.35 });
    // power bank (lying flat, ports at the +z end)
    const pb = new T.Group(); pb.position.set(-0.05, 0, 0); pb.rotation.y = 0.12; g.add(pb);
    const PW = 0.07, PT = 0.016, PL = 0.14;
    mesh(roundBox(PW, PT, PL, 0.007), mat(Z.purple, { roughness: 0.4 }), pb, 0, PT / 2, 0);
    const tt = tex((c, Wd, Hd) => { txt(c, '10000 mAh', Wd / 2, Hd * 0.8, 60, '#ede9fe'); txt(c, 'POWER', Wd / 2, Hd * 0.88, 34, '#c4b5fd'); }, 512, 1024);
    flat(PW - 0.01, PL - 0.01, picMat(tt, { transparent: true }), pb, 0, PT + 0.0002, 0);
    logoAt(0.04, pb, 0, PT + 0.0004, -0.02).rotation.x = -Math.PI / 2;
    for (let i = 0; i < 4; i++) { const on = i < 3, l = sphere(0.0018, on ? 0x22c55e : 0x475569, pb, -0.012 + i * 0.008, PT + 0.0002, 0.058, 10); l.scale.y = 0.4; if (on) l.material = mat(0x22c55e, { emissive: 0x22c55e, emissiveIntensity: 1.2 }); }
    box(0.012, 0.005, 0.002, 0x0f172a, pb, 0.012, PT / 2, PL / 2 + 0.0005, 0.001); box(0.008, 0.003, 0.002, 0x0f172a, pb, -0.012, PT / 2, PL / 2 + 0.0005, 0.0008);
    // charger brick (Indian two-pin plug, pins pointing back)
    const ch = new T.Group(); ch.position.set(0.085, 0, -0.035); ch.rotation.y = -0.35; g.add(ch);
    mesh(roundBox(0.042, 0.042, 0.036, 0.007), white, ch, 0, 0.021, 0);
    for (const x of [-0.0095, 0.0095]) { const p = cyl(0.0022, 0.0022, 0.018, 0xcbd5e1, ch, x, 0.024, -0.026, 12); p.rotation.x = Math.PI / 2; p.material = metalM(); }
    box(0.013, 0.006, 0.002, 0x0f172a, ch, 0, 0.022, 0.0182, 0.001);
    plane(0.03, 0.008, picMat(label('ZUNGGA · 20W', { w: 384, h: 96, bg: 'rgba(0,0,0,0)', fg: '#7c3aed', size: 56 }), { transparent: true }), ch, 0, 0.034, 0.0182);
    // cable from charger port to power bank port
    const a = new T.Vector3(0, 0.022, 0.026).applyMatrix4(new T.Matrix4().compose(ch.position, ch.quaternion, new T.Vector3(1, 1, 1)));
    const b = new T.Vector3(0.012, PT / 2, PL / 2 + 0.012).applyMatrix4(new T.Matrix4().compose(pb.position, pb.quaternion, new T.Vector3(1, 1, 1)));
    const plugM = mat(0xe5e7eb, { roughness: 0.4 });
    const pa = mesh(roundBox(0.01, 0.007, 0.016, 0.002), plugM, ch, 0, 0.022, 0.026);
    const pp = mesh(roundBox(0.014, 0.0065, 0.018, 0.002), plugM, pb, 0.012, PT / 2, PL / 2 + 0.009);
    const pts = [a, new T.Vector3(a.x + 0.01, 0.006, a.z + 0.04), new T.Vector3(0.11, 0.003, 0.11), new T.Vector3(0.05, 0.003, 0.15), new T.Vector3(b.x + 0.02, 0.004, b.z + 0.05), new T.Vector3(b.x + 0.002, b.y, b.z + 0.012), b];
    mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 80, 0.0018, 10), mat(0xf8fafc, { roughness: 0.5 }), g);
    return { group: g, phys: { shape: 'box', size: [0.2, 0.04, 0.2], mass: 0.3, yOffset: 0.02 } };
  }

  /* ---------------- robot toy ---------------- */
  function robotToy() {
    const g = new T.Group(), white = mat(0xf8fafc, { roughness: 0.35 }), purple = mat(Z.purple, { roughness: 0.4 }), grey = mat(0x94a3b8, { roughness: 0.4, metalness: 0.3 });
    for (const s of [-1, 1]) {
      mesh(roundBox(0.045, 0.024, 0.062, 0.01), purple, g, s * 0.033, 0.012, 0.004);
      mesh(new T.CylinderGeometry(0.012, 0.012, 0.03, 16), grey, g, s * 0.033, 0.037, 0);
    }
    mesh(roundBox(0.11, 0.092, 0.08, 0.024), white, g, 0, 0.096, 0);
    // chest panel
    const ct = tex((c, Wd, Hd) => { c.fillStyle = '#1e1b4b'; rr(c, 0, 0, Wd, Hd, 40); c.fill(); c.fillStyle = '#ec4899';
      c.beginPath(); c.moveTo(Wd / 2, Hd * 0.72); c.bezierCurveTo(Wd * 0.15, Hd * 0.4, Wd * 0.3, Hd * 0.12, Wd / 2, Hd * 0.32); c.bezierCurveTo(Wd * 0.7, Hd * 0.12, Wd * 0.85, Hd * 0.4, Wd / 2, Hd * 0.72); c.fill(); }, 256, 200);
    plane(0.05, 0.036, scrMat(ct, 0.6), g, 0, 0.106, 0.0405);
    [[Z.yellow, -0.016], [Z.green, 0], [Z.blue, 0.016]].forEach(([col, x]) => { const b = cyl(0.0045, 0.0045, 0.004, col, g, x, 0.074, 0.04, 16); b.rotation.x = Math.PI / 2; });
    // arms
    for (const s of [-1, 1]) {
      const sh = sphere(0.014, Z.purple, g, s * 0.062, 0.122, 0, 16); sh.material = purple;
      const arm = mesh(new T.CapsuleGeometry(0.011, 0.04, 6, 14), white, g, s * 0.072, 0.098, 0.004); arm.rotation.z = s * 0.25;
      const hand = mesh(new T.TorusGeometry(0.01, 0.0045, 8, 16, Math.PI * 1.4), grey, g, s * 0.079, 0.064, 0.006); hand.rotation.set(0, Math.PI / 2, Math.PI * 0.8);
    }
    cyl(0.014, 0.016, 0.014, 0x94a3b8, g, 0, 0.147, 0, 16).material = grey;
    // head (tilts)
    const head = new T.Group(); head.position.set(0, 0.152, 0); g.add(head);
    mesh(roundBox(0.12, 0.088, 0.09, 0.028), white, head, 0, 0.046, 0);
    const ft = tex((c, Wd, Hd) => { c.fillStyle = '#0f172a'; rr(c, 0, 0, Wd, Hd, 70); c.fill();
      c.shadowColor = '#22d3ee'; c.shadowBlur = 24; c.fillStyle = '#67e8f9'; for (const x of [0.3, 0.7]) { c.beginPath(); c.ellipse(Wd * x, Hd * 0.42, 34, 44, 0, 0, 6.3); c.fill(); }
      c.strokeStyle = '#67e8f9'; c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.arc(Wd / 2, Hd * 0.62, 40, 0.3, Math.PI - 0.3); c.stroke(); c.shadowBlur = 0;
      c.fillStyle = 'rgba(244,114,182,0.6)'; for (const x of [0.16, 0.84]) { c.beginPath(); c.ellipse(Wd * x, Hd * 0.66, 22, 12, 0, 0, 6.3); c.fill(); } }, 384, 256);
    plane(0.092, 0.06, scrMat(ft, 0.8), head, 0, 0.046, 0.0455);
    for (const s of [-1, 1]) { const e = cyl(0.013, 0.013, 0.012, Z.purple, head, s * 0.064, 0.046, 0, 20); e.rotation.z = Math.PI / 2; e.material = purple; }
    cyl(0.0025, 0.0025, 0.04, 0x94a3b8, head, 0, 0.108, 0, 10).material = grey;
    cyl(0.008, 0.01, 0.006, Z.purple, head, 0, 0.091, 0, 16).material = purple;
    const bulbM = mat(0xef4444, { emissive: 0xff2d2d, emissiveIntensity: 1.5, roughness: 0.2 });
    sphere(0.0095, 0xef4444, head, 0, 0.132, 0, 18).material = bulbM;
    const tick = (t) => { head.rotation.z = Math.sin(t * 1.6) * 0.16; head.rotation.y = Math.sin(t * 0.8) * 0.1; const p = ((t % 1) + 1) % 1; bulbM.emissiveIntensity = p < 0.5 ? 2.2 : 0.1; };
    tick(0); g.userData.tick = tick;
    return { group: g, phys: { shape: 'box', size: [0.17, 0.29, 0.09], mass: 0.3, yOffset: 0.145 } };
  }

  ZAssets.register('tech', 'phone', 'Smartphone on a stand', phone, ['phone', 'mobile', 'smartphone', 'screen']);
  ZAssets.register('tech', 'laptop', 'Laptop', laptop, ['laptop', 'computer', 'screen']);
  ZAssets.register('tech', 'tablet', 'Tablet', tablet, ['tablet', 'ipad', 'screen', 'video']);
  ZAssets.register('tech', 'headphones', 'Headphones', headphones, ['headphones', 'music', 'audio']);
  ZAssets.register('tech', 'smartwatch', 'Smartwatch', smartwatch, ['watch', 'smartwatch', 'time']);
  ZAssets.register('tech', 'savings_app_screen', 'Savings app on a phone', savingsAppScreen, ['phone', 'app', 'savings', 'goal']);
  ZAssets.register('tech', 'tv_remote', 'TV remote', tvRemote, ['remote', 'tv', 'television']);
  ZAssets.register('tech', 'camera', 'Compact camera', camera, ['camera', 'photo', 'picture']);
  ZAssets.register('tech', 'charger_powerbank', 'Power bank + charger', chargerPowerbank, ['charger', 'powerbank', 'cable', 'battery']);
  ZAssets.register('tech', 'robot_toy', 'Robot toy', robotToy, ['robot', 'toy', 'gadget']);
})();
