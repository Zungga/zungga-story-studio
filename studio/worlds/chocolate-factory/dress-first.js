/* Zungga Chocolate Factory — room dressing (first floor). ZFactory.dress[<id>] = (c, spec) => { … }
 * Part 1: cf1_* library props (registered at file load, category 'factory').
 * Part 2: the room dressers (frame origin = room centre at floor level, north = −z, east = +x). */
(() => {
  'use strict';
  const D = (window.ZFactory = window.ZFactory || {}).dress = window.ZFactory.dress || {};
  const T = THREE, Z = ZA, PI = Math.PI, HP = Math.PI / 2;

  /* =====================================================================================================
   * shared helpers (materials, geometry and textures are cached so many instances stay cheap)
   * ===================================================================================================== */
  const C = {
    purple: 0x7c3aed, deep: 0x5b21b6, lilac: 0xc4b5fd, lav: 0xede9fe, yellow: 0xfacc15, gold: 0xd4a017, pink: 0xec4899, rose: 0xf9a8d4,
    choc: 0x5b3420, choc2: 0x7a4426, choc3: 0x8a5a3a, cream: 0xfff7e6, teal: 0x14b8a6, mint: 0x99f6e4, white: 0xf8fafc, ink: 0x1f1a33,
    steel: 0x94a3b8, slate: 0x475569, navy: 0x1e1b4b, red: 0xef4444, green: 0x22c55e, blue: 0x38bdf8, orange: 0xfb923c, wood: 0x6b3f22, kraft: 0xc8a165,
  };
  const MC = new Map();
  function PM(c, o) { if (c && c.isMaterial) return c; const k = c + (o ? JSON.stringify(o) : ''); let m = MC.get(k); if (!m) { m = new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55 }, o || {})); MC.set(k, m); } return m; }
  const GL = (c, k = 1.1) => PM(c, { emissive: c, emissiveIntensity: k, roughness: 0.35 });
  const MET = (c) => PM(c, { metalness: 0.55, roughness: 0.3 });
  const GOLD = MET(0xe0b232), SILVER = MET(0xd5dbe3), BRONZE = MET(0xcd7f32);
  const GLASS = PM(0xdff4ff, { transparent: true, opacity: 0.3, roughness: 0.05, depthWrite: false });
  const own = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.4 }, o || {}));   // per-instance (animated) materials

  const GC = new Map();
  const gget = (k, f) => { let g = GC.get(k); if (!g) { g = f(); GC.set(k, g); } return g; };
  const f3 = (v) => (+v).toFixed(3);
  const gBox = (w, h, d, r) => gget(`b${f3(w)},${f3(h)},${f3(d)},${r || 0}`, () => (r ? Z.roundBox(w, h, d, r, 2) : new T.BoxGeometry(w, h, d)));
  const gCyl = (rt, rb, h, s, open) => gget(`c${f3(rt)},${f3(rb)},${f3(h)},${s},${open ? 1 : 0}`, () => new T.CylinderGeometry(rt, rb, h, s, 1, !!open));
  const gSph = (r, s) => gget(`s${f3(r)},${s}`, () => new T.SphereGeometry(r, s, Math.max(6, Math.round(s * 0.7))));
  const gTor = (R, r, s, arc) => gget(`t${f3(R)},${f3(r)},${s},${arc || 0}`, () => new T.TorusGeometry(R, r, 8, s, arc || PI * 2));
  function mk(p, geo, m, x = 0, y = 0, z = 0) { const me = new T.Mesh(geo, PM(m)); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; p.add(me); return me; }
  const bx = (p, w, h, d, m, x = 0, y = 0, z = 0, r = 0) => mk(p, gBox(w, h, d, r), m, x, y + h / 2, z);      // y = bottom
  const cy = (p, rt, rb, h, m, x = 0, y = 0, z = 0, s = 18, open) => mk(p, gCyl(rt, rb, h, s, open), m, x, y + h / 2, z);
  const sp = (p, r, m, x = 0, y = 0, z = 0, s = 14) => mk(p, gSph(r, s), m, x, y, z);                       // y = centre
  const tor = (p, R, r, m, x = 0, y = 0, z = 0, s = 20, arc) => mk(p, gTor(R, r, s, arc), m, x, y, z);
  const pl = (p, w, h, m, x = 0, y = 0, z = 0, ry = 0) => { const me = mk(p, gget(`p${f3(w)},${f3(h)}`, () => new T.PlaneGeometry(w, h)), m, x, y, z); me.rotation.y = ry; me.castShadow = false; return me; };
  const flat = (p, w, d, m, x = 0, y = 0, z = 0) => { const me = pl(p, w, d, m, x, y, z); me.rotation.x = -HP; return me; };
  const grp = (p, x = 0, y = 0, z = 0, ry = 0) => { const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g); return g; };

  const TX = new Map(), XM = new Map();
  const ctex = (key, w, h, draw) => { let t = TX.get(key); if (!t) { t = Z.tex(draw, w, h); TX.set(key, t); } return t; };
  const pic = (key, w, h, draw, o) => { let m = XM.get('p' + key); if (!m) { m = new T.MeshStandardMaterial(Object.assign({ map: ctex(key, w, h, draw), roughness: 0.6 }, o || {})); XM.set('p' + key, m); } return m; };
  const scr = (key, w, h, draw, k = 0.85) => { let m = XM.get('s' + key); if (!m) { const t = ctex(key, w, h, draw); m = new T.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: k, roughness: 0.35 }); XM.set('s' + key, m); } return m; };
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  function txt(g, s, x, y, size, col, align = 'center', weight = 700, maxW = 0) { g.fillStyle = col; g.textAlign = align; g.textBaseline = 'middle'; if (maxW) Z.fitText(g, s, maxW, size, weight); else g.font = `${weight} ${size}px ${Z.FONT}`; g.fillText(s, x, y); }
  const rng = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const circ = (g, x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, PI * 2); g.fill(); };
  const labelM = (key, text, o) => pic('lbl_' + key, o.w || 512, o.h || 128, (g, W, H) => { g.fillStyle = o.bg || '#3b0764'; rr(g, 0, 0, W, H, o.radius ?? 18); g.fill(); if (o.border) { g.strokeStyle = o.border; g.lineWidth = 8; rr(g, 6, 6, W - 12, H - 12, (o.radius ?? 18) - 4); g.stroke(); } txt(g, text, W / 2, H / 2 + 3, o.size || 64, o.fg || '#ffd84a', 'center', 800, W * 0.88); });
  const starShape = (R, r, n = 5) => { const s = new T.Shape(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * PI * 2 + HP, q = i % 2 ? r : R; const x = Math.cos(a) * q, y = Math.sin(a) * q; if (i) s.lineTo(x, y); else s.moveTo(x, y); } s.closePath(); return s; };
  const gStar = (R, d) => gget(`star${f3(R)},${f3(d)}`, () => { const g = new T.ExtrudeGeometry(starShape(R, R * 0.48), { depth: d, bevelEnabled: true, bevelSize: d * 0.3, bevelThickness: d * 0.3, bevelSegments: 2 }); g.center(); return g; });
  const gCross = (s, d) => gget(`cross${f3(s)}`, () => { const a = s / 6, sh = new T.Shape(); const P = [[-a, 3 * a], [a, 3 * a], [a, a], [3 * a, a], [3 * a, -a], [a, -a], [a, -3 * a], [-a, -3 * a], [-a, -a], [-3 * a, -a], [-3 * a, a], [-a, a]]; P.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 }); g.center(); return g; });
  const reg = (id, label, fn, tags) => { if (!ZAssets.has(id)) ZAssets.register('factory', id, label, fn, tags); };

  // small reusable bits
  function cup(p, x, y, z, s = 1, m = GOLD) {    // a trophy cup ~0.38·s tall
    bx(p, 0.22 * s, 0.07 * s, 0.22 * s, C.choc, x, y, z, 0.012 * s);
    cy(p, 0.03 * s, 0.055 * s, 0.12 * s, m, x, y + 0.07 * s, z, 10);
    cy(p, 0.13 * s, 0.05 * s, 0.17 * s, m, x, y + 0.19 * s, z, 16);
    for (const sx of [-1, 1]) tor(p, 0.05 * s, 0.013 * s, m, x + sx * 0.13 * s, y + 0.29 * s, z, 10);
  }
  function chocBar(p, x, y, z, m = C.choc2, ry = 0, s = 1) { const b = bx(p, 0.22 * s, 0.03 * s, 0.11 * s, m, x, y, z, 0.008 * s); b.rotation.y = ry; return b; }
  function praline(p, x, y, z, col = C.choc) { return sp(p, 0.045, col, x, y + 0.04, z, 10); }
  function miniCake(p, x, y, z, s = 1, frost = C.pink) { cy(p, 0.12 * s, 0.12 * s, 0.12 * s, C.choc2, x, y, z, 16); cy(p, 0.125 * s, 0.125 * s, 0.035 * s, frost, x, y + 0.12 * s, z, 16); sp(p, 0.03 * s, C.red, x, y + 0.18 * s, z, 8); }
  function laptopOn(p, x, y, z, ry, sm) {   // screen faces local +z of its group
    const g = grp(p, x, y, z, ry); bx(g, 0.5, 0.03, 0.36, 0xcbd5e1, 0, 0, 0, 0.01);
    const s = grp(g, 0, 0.03, -0.17); s.rotation.x = -0.25; bx(s, 0.5, 0.34, 0.025, 0xcbd5e1, 0, 0, 0, 0.01); pl(s, 0.45, 0.29, sm, 0, 0.17, 0.014); return g;
  }
  function chairInto(p, x, z, ry, col = C.purple, legs = C.ink) {   // 4-mesh chair (front +z)
    const g = grp(p, x, 0, z, ry); bx(g, 0.5, 0.1, 0.5, col, 0, 0.42, 0, 0.04); bx(g, 0.5, 0.55, 0.09, col, 0, 0.5, -0.21, 0.04);
    for (const sx of [-1, 1]) bx(g, 0.05, 0.42, 0.42, legs, sx * 0.2, 0, 0); return g;
  }

  /* =====================================================================================================
   * canvas drawings
   * ===================================================================================================== */
  const BOOKCOLS = ['#991b1b', '#1d4ed8', '#15803d', '#a16207', '#6d28d9', '#0f766e', '#b45309', '#be185d', '#7c3aed', '#ca8a04', '#0e7490', '#9a3412', '#db2777', '#4338ca'];
  const drawBooks = (seed) => (g, W, H) => {
    const r = rng(seed); g.fillStyle = '#2a160b'; g.fillRect(0, 0, W, H); let x = 3;
    while (x < W - 8) {
      const bw = 12 + r() * 20, bh = H * (0.72 + r() * 0.27), c = BOOKCOLS[Math.floor(r() * BOOKCOLS.length)];
      g.fillStyle = c; rr(g, x, H - bh, bw - 2, bh, 3); g.fill();
      g.fillStyle = 'rgba(255,214,90,.85)'; g.fillRect(x + 2, H - bh + 9, bw - 6, 3); g.fillRect(x + 2, H - 13, bw - 6, 3);
      if (r() < 0.35) { g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x + bw / 2 - 3, H - bh * 0.62, 3, bh * 0.25); }
      x += bw; if (r() < 0.05) x += 12;
    }
  };
  function drawMapCore(g, X, Y, MW, MH, big) {
    const s = Math.min(MW / 112, MH / 76), ox = X + (MW - 112 * s) / 2, oy = Y + (MH - 76 * s) / 2;
    const R = (x, y, w, h, c, l) => { g.fillStyle = c; rr(g, ox + x * s, oy + y * s, w * s, h * s, 2 * s); g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = Math.max(1.5, 0.35 * s); g.stroke(); if (l) txt(g, l, ox + (x + w / 2) * s, oy + (y + h / 2) * s, (big ? 3.2 : 2.8) * s, '#ffffff', 'center', 800, w * s * 0.86); };
    R(2, 2, 34, 15, '#b7793f', 'LIBRARY'); R(38, 0, 36, 17, '#7c3aed', 'OFFICE'); R(76, 2, 34, 15, '#475569', 'CONTROL');
    g.fillStyle = 'rgba(217,168,108,.55)'; g.fillRect(ox + 2 * s, oy + 19 * s, 108 * s, 5 * s);
    R(2, 26, 20, 14, '#6d5bd0', 'LAB'); R(23, 26, 23, 14, '#e9a23b', 'QUALITY'); R(52, 26, 22, 14, '#a0673f', 'MEETING'); R(75, 26, 35, 14, '#334e7a', 'SECURITY');
    g.fillStyle = 'rgba(125,211,252,.45)'; rr(g, ox + 9 * s, oy + 44 * s, 94 * s, 9 * s, 2 * s); g.fill(); txt(g, 'GLASS BALCONY', ox + 56 * s, oy + 48.5 * s, 3 * s, '#e0f2fe', 'center', 800);
    R(2, 58, 20, 15, '#a0703f', 'FAME'); R(23, 58, 23, 15, '#c98a4a', 'TRAINING'); R(52, 58, 22, 15, '#16a34a', 'FIRST AID'); R(75, 58, 35, 15, '#8a6a4a', 'ARCHIVE');
    for (const [x, y, c] of [[14, 9, '#22c55e'], [56, 8, '#facc15'], [93, 9, '#22c55e'], [12, 33, '#ec4899'], [34, 33, '#22c55e'], [63, 33, '#22c55e'], [92, 33, '#38bdf8'], [56, 48, '#facc15'], [12, 65, '#22c55e'], [92, 65, '#22c55e']]) { circ(g, ox + x * s, oy + y * s, 2.2 * s, 'rgba(255,255,255,.35)'); circ(g, ox + x * s, oy + y * s, 1.3 * s, c); }
  }
  const drawMapWide = (g, W, H) => {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0b1a40'); bg.addColorStop(1, '#13104a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(56,189,248,.10)'; g.lineWidth = 1; for (let x = 0; x < W; x += 20) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 20) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    txt(g, 'LIVE FACTORY MAP', 18, 24, 24, '#facc15', 'left', 800); circ(g, 255, 24, 7, '#ef4444'); txt(g, 'LIVE', 268, 25, 18, '#fca5a5', 'left', 800);
    drawMapCore(g, 10, 40, W * 0.56, H - 48, false);
    const X = W * 0.6, items = [['Chocolate River', 0.92, '#22c55e'], ['Mixers', 0.78, '#facc15'], ['Wrapping Line', 0.85, '#38bdf8'], ['Cookie Ovens', 0.64, '#fb923c'], ['Candy Lab', 0.97, '#ec4899'], ['Happy Workers', 1, '#a78bfa']];
    txt(g, 'MACHINE STATUS', X, 24, 24, '#facc15', 'left', 800);
    items.forEach(([n, v, c], i) => { const y = 58 + i * 42; txt(g, n, X, y, 19, '#e0e7ff', 'left', 700); g.fillStyle = 'rgba(255,255,255,.12)'; rr(g, X + 190, y - 11, 170, 22, 11); g.fill(); g.fillStyle = c; rr(g, X + 190, y - 11, 170 * v, 22, 11); g.fill(); txt(g, Math.round(v * 100) + '%', X + 370, y, 17, '#ffffff', 'left', 800); });
  };
  const drawMapBoard = (g, W, H) => { g.fillStyle = '#fef3c7'; g.fillRect(0, 0, W, H); txt(g, 'FACTORY MAP · FIRST FLOOR', W / 2, 30, 30, '#5b21b6', 'center', 800); drawMapCore(g, 14, 52, W - 28, H - 62, true); };
  const drawFeeds = (seed) => (g, W, H) => {
    const r = rng(seed), cols = 4, rows = 3, cw = W / cols, ch = H / rows;
    g.fillStyle = '#05070f'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < cols * rows; i++) {
      const x = (i % cols) * cw + 4, y = Math.floor(i / cols) * ch + 4, w = cw - 8, h = ch - 8, k = Math.floor(r() * 6);
      g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
      const sky = ['#1e3a5f', '#3f2a1c', '#1f3d2b', '#2e1f4f', '#3b2f1a', '#123'][k]; g.fillStyle = sky; g.fillRect(x, y, w, h);
      if (k === 0) { g.fillStyle = '#c99a62'; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + w * 0.38, y + h * 0.45); g.lineTo(x + w * 0.62, y + h * 0.45); g.lineTo(x + w, y + h); g.fill(); g.fillStyle = '#7c3aed'; g.fillRect(x + w * 0.42, y + h * 0.25, w * 0.16, h * 0.2); }
      else if (k === 1) { g.fillStyle = '#8b4513'; for (let j = 0; j < 4; j++) { g.beginPath(); g.ellipse(x + w / 2, y + h * (0.45 + j * 0.16), w * 0.6, h * 0.08, 0, 0, PI * 2); g.fill(); } g.fillStyle = '#a0522d'; g.fillRect(x, y + h * 0.4, w, 6); }
      else if (k === 2) { g.fillStyle = '#334155'; g.fillRect(x, y + h * 0.55, w, h * 0.16); for (let j = 0; j < 5; j++) { g.fillStyle = j % 2 ? '#facc15' : '#7a4426'; rr(g, x + 10 + j * w / 5, y + h * 0.47, w / 8, h * 0.1, 3); g.fill(); } }
      else if (k === 3) { g.fillStyle = '#d9a86c'; g.beginPath(); g.ellipse(x + w / 2, y + h * 0.7, w * 0.45, h * 0.25, 0, 0, PI * 2); g.fill(); circ(g, x + w / 2, y + h * 0.66, h * 0.12, '#38bdf8'); }
      else if (k === 4) { for (let j = 0; j < 4; j++) { g.fillStyle = '#15803d'; g.beginPath(); g.arc(x + 15 + j * w / 4, y + h * 0.55, h * 0.18, 0, PI * 2); g.fill(); g.fillStyle = '#7a4426'; g.fillRect(x + 12 + j * w / 4, y + h * 0.6, 6, h * 0.3); } }
      else { g.fillStyle = '#64748b'; g.fillRect(x + w * 0.2, y + h * 0.3, w * 0.6, h * 0.7); g.fillStyle = '#facc15'; g.fillRect(x + w * 0.42, y + h * 0.55, w * 0.16, h * 0.45); }
      g.fillStyle = 'rgba(255,255,255,.05)'; for (let yy = y; yy < y + h; yy += 4) g.fillRect(x, yy, w, 1);
      g.restore();
      g.strokeStyle = '#38bdf8'; g.lineWidth = 2; g.strokeRect(x, y, w, h);
      txt(g, 'CAM ' + String(i + 1 + (seed % 3) * 12).padStart(2, '0'), x + 8, y + 14, 15, '#ffffff', 'left', 800); circ(g, x + w - 14, y + 14, 5, '#ef4444');
    }
  };
  const drawScreen = (kind) => (g, W, H) => {
    g.fillStyle = '#0b1736'; g.fillRect(0, 0, W, H);
    if (kind === 'graph') { g.strokeStyle = 'rgba(255,255,255,.15)'; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(0, i * H / 5); g.lineTo(W, i * H / 5); g.stroke(); } g.lineWidth = 5; g.strokeStyle = '#facc15'; g.beginPath(); for (let i = 0; i <= 12; i++) { const x = i * W / 12, y = H * (0.7 - 0.45 * Math.abs(Math.sin(i * 0.9))); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); g.strokeStyle = '#ec4899'; g.beginPath(); for (let i = 0; i <= 12; i++) { const x = i * W / 12, y = H * (0.8 - 0.25 * Math.abs(Math.cos(i * 0.6))); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); txt(g, 'CHOCO OUTPUT', 10, 16, 18, '#a5f3fc', 'left', 800); }
    else if (kind === 'gauge') { for (let i = 0; i < 3; i++) { const x = W * (0.18 + i * 0.32), y = H * 0.6, r = H * 0.28; g.lineWidth = 12; g.strokeStyle = 'rgba(255,255,255,.15)'; g.beginPath(); g.arc(x, y, r, PI, 2 * PI); g.stroke(); g.strokeStyle = ['#22c55e', '#facc15', '#38bdf8'][i]; g.beginPath(); g.arc(x, y, r, PI, PI + PI * (0.5 + i * 0.18)); g.stroke(); txt(g, ['TEMP', 'MIX', 'FLOW'][i], x, y + 18, 16, '#ffffff', 'center', 800); } txt(g, 'ALL SYSTEMS YUMMY', W / 2, 18, 18, '#86efac', 'center', 800); }
    else if (kind === 'bars') { for (let i = 0; i < 7; i++) { const h = H * (0.2 + 0.6 * Math.abs(Math.sin(i * 1.7 + 1))); g.fillStyle = ['#7c3aed', '#ec4899', '#facc15', '#14b8a6'][i % 4]; rr(g, 14 + i * (W - 20) / 7, H - 12 - h, (W - 20) / 7 - 8, h, 4); g.fill(); } txt(g, 'BATCH #2026', 10, 16, 18, '#fde68a', 'left', 800); }
    else { drawMapCore(g, 6, 22, W - 12, H - 26, false); txt(g, 'FLOOR 1', 10, 13, 15, '#facc15', 'left', 800); }
  };
  const drawPoster = (title, sub, bg, fg, icon) => (g, W, H) => {
    g.fillStyle = bg; rr(g, 0, 0, W, H, 20); g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 10; rr(g, 14, 14, W - 28, H - 28, 16); g.stroke();
    const cx = W / 2, cyy = H * 0.42;
    if (icon === 'bubbles') { for (const [x, y, r] of [[-60, -40, 50], [40, -60, 34], [70, 20, 44], [-30, 50, 38], [20, 10, 24]]) { circ(g, cx + x, cyy + y, r, 'rgba(255,255,255,.75)'); circ(g, cx + x - r * 0.3, cyy + y - r * 0.3, r * 0.2, '#ffffff'); } }
    else if (icon === 'heart') { g.fillStyle = '#ec4899'; g.beginPath(); g.moveTo(cx, cyy + 70); g.bezierCurveTo(cx - 140, cyy - 20, cx - 60, cyy - 120, cx, cyy - 50); g.bezierCurveTo(cx + 60, cyy - 120, cx + 140, cyy - 20, cx, cyy + 70); g.fill(); }
    else if (icon === 'bulb') { circ(g, cx, cyy - 20, 70, '#fde047'); g.fillStyle = '#94a3b8'; g.fillRect(cx - 30, cyy + 45, 60, 40); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; g.strokeStyle = '#fde047'; g.lineWidth = 8; g.beginPath(); g.moveTo(cx + Math.cos(a) * 85, cyy - 20 + Math.sin(a) * 85); g.lineTo(cx + Math.cos(a) * 110, cyy - 20 + Math.sin(a) * 110); g.stroke(); } }
    else if (icon === 'star') { g.fillStyle = '#facc15'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2 - HP, q = i % 2 ? 40 : 95; g.lineTo(cx + Math.cos(a) * q, cyy + Math.sin(a) * q); } g.fill(); }
    else if (icon === 'cap') { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(cx, cyy, 100, 60, 0, PI, 2 * PI); g.fill(); g.fillRect(cx - 110, cyy - 6, 220, 22); for (let i = -2; i <= 2; i++) circ(g, cx + i * 36, cyy - 30, 7, '#c4b5fd'); }
    else if (icon === 'drop') { g.fillStyle = '#38bdf8'; g.beginPath(); g.moveTo(cx, cyy - 100); g.bezierCurveTo(cx + 80, cyy, cx + 70, cyy + 70, cx, cyy + 70); g.bezierCurveTo(cx - 70, cyy + 70, cx - 80, cyy, cx, cyy - 100); g.fill(); circ(g, cx - 20, cyy + 20, 12, '#e0f2fe'); }
    else if (icon === 'choc') { g.fillStyle = '#7a4426'; rr(g, cx - 100, cyy - 60, 200, 120, 14); g.fill(); g.strokeStyle = '#5b3420'; g.lineWidth = 6; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(cx - 100 + i * 50, cyy - 60); g.lineTo(cx - 100 + i * 50, cyy + 60); g.stroke(); } g.beginPath(); g.moveTo(cx - 100, cyy); g.lineTo(cx + 100, cyy); g.stroke(); }
    txt(g, title, cx, H * 0.74, 56, fg, 'center', 800, W * 0.84); txt(g, sub, cx, H * 0.86, 34, fg, 'center', 700, W * 0.84);
  };

  /* =====================================================================================================
   * PROPS — Mr. Choco's office
   * ===================================================================================================== */
  reg('cf1_exec_desk', "Mr. Choco's grand desk", () => {
    const g = new T.Group();
    bx(g, 3.9, 0.12, 1.5, C.choc2, 0, 0.8, 0, 0.04); bx(g, 3.96, 0.05, 1.56, GOLD, 0, 0.77, 0, 0.02);
    for (const sx of [-1, 1]) {
      bx(g, 1.05, 0.77, 1.35, C.choc, sx * 1.35, 0, 0, 0.05);
      bx(g, 0.78, 0.52, 0.04, C.purple, sx * 1.35, 0.13, 0.68, 0.02); mk(g, gStar(0.13, 0.03), GOLD, sx * 1.35, 0.39, 0.71);
      for (let i = 0; i < 3; i++) bx(g, 0.3, 0.04, 0.04, GOLD, sx * 1.35, 0.18 + i * 0.22, -0.69);
    }
    bx(g, 1.7, 0.56, 0.08, C.choc3, 0, 0.2, 0.6, 0.03);
    pl(g, 1.3, 0.3, labelM('mrchoco', 'MR. CHOCO', { bg: '#5b21b6', fg: '#ffd84a', border: '#e0b232' }), 0, 0.5, 0.645);
    const top = 0.92;
    laptopOn(g, -0.15, top, -0.3, PI, scr('scr_graph', 256, 160, drawScreen('graph')));
    cy(g, 0.12, 0.14, 0.04, GOLD, 1.45, top, -0.35, 14); cy(g, 0.02, 0.02, 0.4, GOLD, 1.45, top + 0.04, -0.35, 8); cy(g, 0.1, 0.24, 0.18, C.teal, 1.45, top + 0.42, -0.35, 18); sp(g, 0.07, GL(0xfff1a8, 1.4), 1.45, top + 0.42, -0.35, 10);
    bx(g, 0.34, 0.07, 0.44, C.white, 0.62, top, -0.25, 0.01); bx(g, 0.34, 0.04, 0.44, 0xfef3c7, 0.66, top + 0.07, -0.22, 0.01);
    cy(g, 0.07, 0.07, 0.16, C.purple, 1.0, top, -0.5, 12); for (let i = 0; i < 3; i++) cy(g, 0.01, 0.01, 0.2, [C.yellow, C.pink, C.teal][i], 0.97 + i * 0.03, top + 0.06, -0.5, 6);
    cup(g, -1.55, top, 0.3, 1.4);
    bx(g, 0.44, 0.08, 0.32, C.pink, 0.95, top, 0.35, 0.02); for (let i = 0; i < 4; i++) praline(g, 0.83 + (i % 2) * 0.12 + Math.floor(i / 2) * 0.12, top + 0.05, 0.35, i % 2 ? C.choc : 0x3b2214);
    bx(g, 0.8, 0.16, 0.1, C.choc, 0.15, top, 0.55, 0.03); pl(g, 0.7, 0.12, labelM('boss', 'THE BIG BOSS', { bg: '#e0b232', fg: '#3b0764', radius: 8 }), 0.15, top + 0.08, 0.605);
    return { group: g };
  }, ['desk', 'office', 'boss']);

  reg('cf1_throne_chair', 'Purple high-back boss chair', () => {
    const g = new T.Group();
    cy(g, 0.42, 0.46, 0.08, GOLD, 0, 0, 0, 18); cy(g, 0.07, 0.07, 0.36, GOLD, 0, 0.08, 0, 10);
    bx(g, 0.95, 0.24, 0.85, C.purple, 0, 0.42, 0.02, 0.1); bx(g, 0.78, 0.08, 0.7, C.lilac, 0, 0.64, 0.05, 0.04);
    bx(g, 1.0, 1.75, 0.26, C.purple, 0, 0.5, -0.36, 0.12); bx(g, 1.08, 0.14, 0.34, GOLD, 0, 2.2, -0.36, 0.05);
    for (const [x, r] of [[-0.42, 0.07], [0, 0.11], [0.42, 0.07]]) sp(g, r, x ? GOLD : PM(C.yellow, { metalness: 0.3, roughness: 0.3 }), x, 2.4 + r * 0.4, -0.36, 12);
    for (let i = 0; i < 6; i++) sp(g, 0.045, C.yellow, (i % 2 ? 0.2 : -0.2), 1.05 + Math.floor(i / 2) * 0.35, -0.22, 8);
    for (const sx of [-1, 1]) bx(g, 0.2, 0.32, 0.78, C.deep, sx * 0.52, 0.62, 0.02, 0.07);
    return { group: g };
  }, ['chair', 'boss', 'throne']);

  const armchair = (col, cushion) => () => {
    const g = new T.Group();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cy(g, 0.04, 0.03, 0.12, GOLD, sx * 0.42, 0, sz * 0.36, 8);
    bx(g, 1.1, 0.36, 1.0, col, 0, 0.12, 0, 0.1); bx(g, 0.72, 0.18, 0.78, cushion, 0, 0.46, 0.08, 0.07);
    bx(g, 1.1, 0.78, 0.26, col, 0, 0.42, -0.37, 0.11); for (const sx of [-1, 1]) bx(g, 0.22, 0.34, 0.95, col, sx * 0.44, 0.44, 0.02, 0.1);
    bx(g, 0.42, 0.34, 0.14, cushion, 0, 0.64, -0.2, 0.06).rotation.x = -0.25;
    return { group: g };
  };
  reg('cf1_armchair_pink', 'Plump pink armchair', armchair(C.pink, C.rose), ['chair', 'armchair', 'sofa']);
  reg('cf1_armchair_teal', 'Plump teal armchair', armchair(C.teal, C.mint), ['chair', 'armchair', 'sofa']);

  reg('cf1_sofa', 'Comfy purple sofa', () => {
    const g = new T.Group();
    bx(g, 2.2, 0.36, 0.9, C.purple, 0, 0.08, 0, 0.1); for (const sx of [-1, 1]) cy(g, 0.04, 0.03, 0.1, GOLD, sx * 0.95, 0, 0, 8);
    for (const sx of [-1, 1]) bx(g, 0.86, 0.16, 0.66, C.lilac, sx * 0.45, 0.44, 0.08, 0.06);
    bx(g, 2.2, 0.66, 0.24, C.purple, 0, 0.42, -0.33, 0.1); for (const sx of [-1, 1]) bx(g, 0.24, 0.32, 0.9, C.deep, sx * 0.98, 0.42, 0, 0.1);
    const p1 = bx(g, 0.44, 0.38, 0.14, C.yellow, -0.55, 0.58, -0.15, 0.07); p1.rotation.set(-0.25, 0, 0.12);
    const p2 = bx(g, 0.44, 0.38, 0.14, C.pink, 0.55, 0.58, -0.15, 0.07); p2.rotation.set(-0.25, 0, -0.12);
    return { group: g };
  }, ['sofa', 'couch', 'seat']);

  reg('cf1_round_table', 'Round meeting table', () => {
    const g = new T.Group();
    cy(g, 0.5, 0.6, 0.06, C.choc, 0, 0, 0, 20); cy(g, 0.12, 0.16, 0.68, C.choc, 0, 0.06, 0, 12);
    cy(g, 1.12, 1.12, 0.03, GOLD, 0, 0.71, 0, 32); cy(g, 1.1, 1.1, 0.08, C.choc2, 0, 0.72, 0, 32);
    const y = 0.8; sp(g, 0.14, C.pink, 0, y + 0.12, 0, 14); cy(g, 0.03, 0.02, 0.14, C.pink, 0.18, y + 0.08, 0, 6).rotation.z = -0.9; tor(g, 0.07, 0.015, C.pink, -0.15, y + 0.13, 0, 10);
    for (let i = 0; i < 4; i++) { const a = i * HP + 0.4; cy(g, 0.06, 0.05, 0.08, C.white, Math.sin(a) * 0.62, y, Math.cos(a) * 0.62, 12); cy(g, 0.11, 0.11, 0.012, C.white, Math.sin(a) * 0.62, y, Math.cos(a) * 0.62, 14); }
    bx(g, 0.3, 0.02, 0.4, C.white, 0.35, y, -0.4, 0.005).rotation.y = 0.3; bx(g, 0.3, 0.02, 0.4, 0xfef3c7, -0.4, y, 0.32, 0.005).rotation.y = -0.4;
    return { group: g };
  }, ['table', 'meeting', 'tea']);

  reg('cf1_chair', 'Purple chair', () => { const g = new T.Group(); chairInto(g, 0, 0, 0); return { group: g }; }, ['chair', 'seat']);
  reg('cf1_chair_pink', 'Pink chair', () => { const g = new T.Group(); chairInto(g, 0, 0, 0, C.pink); return { group: g }; }, ['chair', 'seat']);

  // portraits (wall-mounted, centred on y = 0, face +z)
  const portrait = (key, w, h, draw) => () => {
    const g = new T.Group(); mk(g, gBox(w + 0.2, h + 0.2, 0.08, 0.03), GOLD, 0, 0, 0); mk(g, gBox(w + 0.04, h + 0.04, 0.09, 0), C.deep, 0, 0, 0.005);
    pl(g, w, h, pic(key, Math.round(256 * w / Math.max(w, h) * 2), Math.round(256 * h / Math.max(w, h) * 2), draw), 0, 0, 0.052); return { group: g };
  };
  const drawChoco = (g, W, H) => {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#a78bfa'); bg.addColorStop(1, '#5b21b6'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const cx = W / 2, cyy = H * 0.55; g.fillStyle = '#7a4426'; g.beginPath(); g.ellipse(cx, cyy, W * 0.3, H * 0.27, 0, 0, PI * 2); g.fill();
    g.strokeStyle = '#5b3420'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx, cyy - H * 0.26); g.quadraticCurveTo(cx + 20, cyy, cx, cyy + H * 0.26); g.stroke();
    circ(g, cx - W * 0.1, cyy - H * 0.05, W * 0.05, '#ffffff'); circ(g, cx + W * 0.1, cyy - H * 0.05, W * 0.05, '#ffffff'); circ(g, cx - W * 0.09, cyy - H * 0.045, W * 0.025, '#1f1a33'); circ(g, cx + W * 0.11, cyy - H * 0.045, W * 0.025, '#1f1a33');
    circ(g, cx - W * 0.18, cyy + H * 0.04, W * 0.04, 'rgba(244,114,182,.7)'); circ(g, cx + W * 0.18, cyy + H * 0.04, W * 0.04, 'rgba(244,114,182,.7)');
    g.strokeStyle = '#1f1a33'; g.lineWidth = 7; g.beginPath(); g.arc(cx, cyy + H * 0.06, W * 0.1, 0.2, PI - 0.2); g.stroke();
    g.fillStyle = '#3b2214'; g.beginPath(); g.ellipse(cx - W * 0.08, cyy + H * 0.035, W * 0.08, H * 0.018, -0.25, 0, PI * 2); g.ellipse(cx + W * 0.08, cyy + H * 0.035, W * 0.08, H * 0.018, 0.25, 0, PI * 2); g.fill();
    g.fillStyle = '#3b0764'; g.fillRect(cx - W * 0.2, cyy - H * 0.3, W * 0.4, H * 0.05); g.fillRect(cx - W * 0.13, cyy - H * 0.48, W * 0.26, H * 0.2); g.fillStyle = '#facc15'; g.fillRect(cx - W * 0.13, cyy - H * 0.33, W * 0.26, H * 0.035);
    g.fillStyle = '#e0b232'; rr(g, W * 0.18, H * 0.88, W * 0.64, H * 0.08, 10); g.fill(); txt(g, 'MR. CHOCO', cx, H * 0.92, H * 0.05, '#3b0764', 'center', 800);
  };
  const drawFactoryPic = (g, W, H) => {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#7dd3fc'); bg.addColorStop(1, '#e0f2fe'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const cols = ['#ef4444', '#fb923c', '#facc15', '#22c55e', '#38bdf8', '#a78bfa']; cols.forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 10; g.beginPath(); g.arc(W * 0.7, H * 0.75, H * 0.55 - i * 10, PI, 2 * PI); g.stroke(); });
    g.fillStyle = '#4ade80'; g.beginPath(); g.ellipse(W * 0.3, H, W * 0.5, H * 0.3, 0, 0, PI * 2); g.ellipse(W * 0.85, H, W * 0.4, H * 0.25, 0, 0, PI * 2); g.fill();
    g.fillStyle = '#8b5a3c'; g.fillRect(W * 0.22, H * 0.45, W * 0.4, H * 0.35); g.fillStyle = '#7c3aed'; g.beginPath(); g.moveTo(W * 0.2, H * 0.46); g.lineTo(W * 0.42, H * 0.3); g.lineTo(W * 0.64, H * 0.46); g.fill();
    for (const x of [0.28, 0.52]) { g.fillStyle = '#5b3420'; g.fillRect(W * x, H * 0.18, W * 0.05, H * 0.2); circ(g, W * (x + 0.03), H * 0.13, H * 0.06, '#f9a8d4'); circ(g, W * (x + 0.07), H * 0.08, H * 0.045, '#fbcfe8'); }
    g.fillStyle = '#facc15'; for (let i = 0; i < 3; i++) g.fillRect(W * (0.27 + i * 0.11), H * 0.55, W * 0.06, H * 0.08);
    g.strokeStyle = '#7a4426'; g.lineWidth = 14; g.beginPath(); g.moveTo(0, H * 0.92); g.bezierCurveTo(W * 0.3, H * 0.82, W * 0.6, H * 1.0, W, H * 0.88); g.stroke();
  };
  const drawFounder = (g, W, H) => {
    g.fillStyle = '#fde68a'; g.fillRect(0, 0, W, H); const cx = W / 2, cyy = H * 0.45;
    g.fillStyle = '#7c3aed'; g.beginPath(); g.ellipse(cx, H * 0.95, W * 0.36, H * 0.3, 0, 0, PI * 2); g.fill();
    circ(g, cx, cyy - H * 0.22, W * 0.12, '#f1f5f9'); circ(g, cx, cyy, W * 0.24, '#e8b48a');
    g.fillStyle = '#f1f5f9'; g.beginPath(); g.arc(cx, cyy - H * 0.03, W * 0.25, PI, 2 * PI); g.fill();
    g.strokeStyle = '#1f1a33'; g.lineWidth = 5; for (const sx of [-1, 1]) { g.beginPath(); g.arc(cx + sx * W * 0.09, cyy + H * 0.02, W * 0.06, 0, PI * 2); g.stroke(); }
    g.beginPath(); g.arc(cx, cyy + H * 0.07, W * 0.08, 0.3, PI - 0.3); g.stroke(); circ(g, cx - W * 0.15, cyy + H * 0.07, W * 0.035, 'rgba(244,114,182,.7)'); circ(g, cx + W * 0.15, cyy + H * 0.07, W * 0.035, 'rgba(244,114,182,.7)');
    g.fillStyle = '#e0b232'; rr(g, W * 0.12, H * 0.86, W * 0.76, H * 0.09, 10); g.fill(); txt(g, 'GRANNY COCOA · 1970', cx, H * 0.905, H * 0.05, '#3b0764', 'center', 800, W * 0.7);
  };
  reg('cf1_portrait_choco', 'Portrait of Mr. Choco', portrait('pt_choco', 1.6, 2.0, drawChoco), ['portrait', 'painting', 'wall']);
  reg('cf1_portrait_factory', 'Painting of the factory', portrait('pt_factory', 1.8, 1.2, drawFactoryPic), ['painting', 'wall']);
  reg('cf1_portrait_founder', 'Portrait of Granny Cocoa (founder)', portrait('pt_founder', 1.2, 1.5, drawFounder), ['portrait', 'painting', 'wall']);

  reg('cf1_choc_fountain', 'Chocolate fountain', () => {
    const g = new T.Group();
    const ft = ctex('flow', 64, 256, (c, W, H) => { c.fillStyle = '#6b3a1f'; c.fillRect(0, 0, W, H); for (let i = 0; i < 18; i++) { c.fillStyle = i % 2 ? 'rgba(160,96,52,.7)' : 'rgba(58,30,14,.6)'; c.fillRect((i * 13) % W, (i * 37) % H, 4 + (i % 3) * 3, 60 + (i * 11) % 90); } });
    ft.wrapS = ft.wrapT = T.RepeatWrapping; ft.repeat.set(3, 1);
    const flowM = XM.get('flowM') || new T.MeshStandardMaterial({ map: ft, color: 0xffffff, roughness: 0.18, metalness: 0.05, side: T.DoubleSide }); XM.set('flowM', flowM);
    const chocM = PM(0x6b3a1f, { roughness: 0.15 });
    cy(g, 0.78, 0.88, 0.6, C.choc3, 0, 0, 0, 28); cy(g, 0.8, 0.8, 0.07, GOLD, 0, 0.48, 0, 28);
    cy(g, 0.8, 0.55, 0.2, C.cream, 0, 0.6, 0, 28); cy(g, 0.74, 0.74, 0.02, chocM, 0, 0.78, 0, 28);
    cy(g, 0.05, 0.05, 1.05, GOLD, 0, 0.78, 0, 10);
    cy(g, 0.5, 0.26, 0.12, C.cream, 0, 1.12, 0, 24); cy(g, 0.46, 0.46, 0.02, chocM, 0, 1.24, 0, 24);
    cy(g, 0.3, 0.15, 0.1, C.cream, 0, 1.5, 0, 20); cy(g, 0.27, 0.27, 0.02, chocM, 0, 1.6, 0, 20);
    sp(g, 0.13, chocM, 0, 1.72, 0, 14); sp(g, 0.06, C.red, 0, 1.86, 0, 10);
    mk(g, gCyl(0.29, 0.47, 0.36, 24, true), flowM, 0, 1.43, 0); mk(g, gCyl(0.47, 0.72, 0.44, 28, true), flowM, 0, 1.02, 0);
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; sp(g, 0.05, i % 2 ? C.red : C.white, Math.sin(a) * 0.68, 0.84, Math.cos(a) * 0.68, 8); }
    g.userData.tick = (t) => { ft.offset.y = (t * 0.45) % 1; };
    return { group: g };
  }, ['chocolate', 'fountain', 'food']);

  reg('cf1_trophy_shelf', 'Trophy cabinet', () => {
    const g = new T.Group();
    bx(g, 3.0, 0.25, 0.5, C.choc, 0, 0, 0, 0.03); for (const sx of [-1, 1]) bx(g, 0.1, 2.3, 0.5, C.choc, sx * 1.45, 0, 0, 0.02);
    bx(g, 3.1, 0.12, 0.56, C.choc, 0, 2.2, 0, 0.03); bx(g, 2.82, 2.0, 0.04, C.purple, 0, 0.25, -0.22);
    for (const y of [0.9, 1.55]) bx(g, 2.82, 0.05, 0.44, C.choc3, 0, y, 0);
    const mats = [GOLD, SILVER, BRONZE];
    [0.25, 0.95, 1.6].forEach((y, row) => { for (let i = 0; i < 3; i++) { const x = -0.9 + i * 0.9; if ((row + i) % 3 === 1) { bx(g, 0.18, 0.05, 0.18, C.choc, x, y, 0); mk(g, gStar(0.17, 0.05), mats[(i + row) % 3], x, y + 0.27, 0); cy(g, 0.02, 0.02, 0.08, GOLD, x, y + 0.04, 0, 6); } else cup(g, x, y, 0, 1.25 + ((row + i) % 2) * 0.35, mats[(i + 2 * row) % 3]); } });
    for (const x of [-1.25, 1.25]) { tor(g, 0.07, 0.015, GOLD, x, 1.25, -0.17, 12); bx(g, 0.08, 0.2, 0.01, x < 0 ? C.pink : C.teal, x, 1.32, -0.19); }
    pl(g, 1.3, 0.24, labelM('awards', 'AWARDS', { bg: '#e0b232', fg: '#3b0764', radius: 10 }), 0, 2.26, 0.285);
    return { group: g };
  }, ['trophy', 'shelf', 'awards']);

  reg('cf1_window_seat', 'Cushioned window seat', () => {
    const g = new T.Group();
    bx(g, 4.0, 0.5, 0.9, C.cream, 0, 0, 0, 0.05); for (let i = 0; i < 4; i++) { bx(g, 0.85, 0.32, 0.03, 0xf3e3c3, -1.5 + i, 0.09, 0.45, 0.02); sp(g, 0.035, GOLD, -1.5 + i, 0.25, 0.47, 8); }
    bx(g, 3.95, 0.18, 0.86, C.purple, 0, 0.5, 0, 0.08);
    [[C.pink, -1.4], [C.yellow, -0.6], [C.teal, 0.9], [C.rose, 1.55]].forEach(([c, x], i) => { const p = bx(g, 0.55, 0.45, 0.16, c, x, 0.6, -0.28, 0.08); p.rotation.set(-0.3, 0, (i % 2 ? 1 : -1) * 0.12); });
    bx(g, 0.3, 0.06, 0.22, C.blue, 0.2, 0.68, 0.1, 0.01).rotation.y = 0.4;
    return { group: g };
  }, ['seat', 'window', 'cushion']);

  /* ---------------- control & security ---------------- */
  const SCR_KINDS = ['graph', 'gauge', 'bars', 'map'];
  const scrM = (k) => scr('scr_' + k, 256, 160, drawScreen(k));
  reg('cf1_control_console', 'Control console with screens', () => {
    const g = new T.Group();
    bx(g, 2.0, 0.72, 0.8, 0x3b3f73, 0, 0, 0, 0.05); bx(g, 2.1, 0.07, 0.95, C.navy, 0, 0.72, 0.03, 0.03); bx(g, 2.12, 0.04, 0.04, GL(C.teal, 1.4), 0, 0.73, 0.5);
    const bp = grp(g, 0, 0.79, 0.28); bp.rotation.x = 0.3; bx(bp, 1.9, 0.04, 0.34, 0x111827, 0, 0, 0, 0.01);
    const bc = [C.red, C.yellow, C.green, C.blue, C.pink]; for (let i = 0; i < 10; i++) cy(bp, 0.04, 0.04, 0.04, GL(bc[i % 5], 0.6), -0.8 + i * 0.13 + (i > 4 ? 0.25 : 0), 0.04, (i % 2) * 0.12 - 0.06, 10);
    for (let i = 0; i < 3; i++) { const s = grp(g, -0.66 + i * 0.66, 0.79, -0.24); s.rotation.x = -0.12; cy(s, 0.03, 0.05, 0.14, 0x111827, 0, 0, 0, 8); bx(s, 0.64, 0.42, 0.05, 0x111827, 0, 0.12, 0, 0.02); pl(s, 0.57, 0.36, scrM(SCR_KINDS[i]), 0, 0.33, 0.027); }
    cy(g, 0.05, 0.045, 0.1, C.pink, 0.88, 0.79, 0.25, 12); tor(g, 0.03, 0.01, C.pink, 0.94, 0.84, 0.25, 8);
    return { group: g };
  }, ['control', 'screens', 'console', 'desk']);

  reg('cf1_operator_chair', 'Swivel operator chair', () => {
    const g = new T.Group();
    bx(g, 0.62, 0.05, 0.1, C.ink, 0, 0.04, 0); bx(g, 0.1, 0.05, 0.62, C.ink, 0, 0.04, 0); for (const [x, z] of [[0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]]) sp(g, 0.04, C.ink, x, 0.04, z, 8);
    cy(g, 0.035, 0.035, 0.36, C.steel, 0, 0.08, 0, 8); bx(g, 0.58, 0.12, 0.56, C.teal, 0, 0.44, 0, 0.05);
    bx(g, 0.54, 0.62, 0.1, C.teal, 0, 0.58, -0.25, 0.05); bx(g, 0.36, 0.1, 0.06, C.yellow, 0, 1.0, -0.22, 0.03);
    for (const sx of [-1, 1]) bx(g, 0.05, 0.2, 0.36, C.ink, sx * 0.28, 0.56, 0.02, 0.02);
    return { group: g };
  }, ['chair', 'office', 'swivel']);

  reg('cf1_wall_screen', 'Giant live factory-map screen', () => {
    const g = new T.Group();
    mk(g, gBox(9.3, 3.0, 0.18, 0.08), C.ink, 0, 0, 0); pl(g, 9.0, 2.75, scr('mapwide', 1024, 312, drawMapWide, 0.9), 0, 0, 0.095);
    bx(g, 9.0, 0.05, 0.05, GL(C.teal, 1.4), 0, -1.55, 0.06);
    const bar = pl(g, 0.08, 2.7, new T.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.35, depthWrite: false }), 0, 0, 0.1);
    const dot = sp(g, 0.07, own(0xef4444, { emissive: 0xef4444, emissiveIntensity: 1.6 }), -1.85, 1.15, 0.11, 10);
    g.userData.tick = (t) => { bar.position.x = -4.4 + ((t * 0.18) % 1) * 4.6; dot.visible = Math.floor(t * 2) % 2 === 0; };
    return { group: g };
  }, ['screen', 'map', 'control', 'wall']);

  reg('cf1_lever_panel', 'Lever & dial panel', () => {
    const g = new T.Group();
    bx(g, 1.8, 1.5, 0.6, C.slate, 0, 0, 0, 0.06); bx(g, 1.86, 0.1, 0.66, C.yellow, 0, 1.5, 0, 0.03); bx(g, 1.6, 1.15, 0.03, 0x1f2937, 0, 0.22, 0.3, 0.02);
    const dialM = pic('dial', 128, 128, (c, W, H) => { circ(c, W / 2, H / 2, W / 2, '#fff7e6'); c.strokeStyle = '#1f1a33'; c.lineWidth = 4; for (let i = 0; i <= 8; i++) { const a = PI * 0.8 + i / 8 * PI * 1.4; c.beginPath(); c.moveTo(W / 2 + Math.cos(a) * 46, H / 2 + Math.sin(a) * 46); c.lineTo(W / 2 + Math.cos(a) * 58, H / 2 + Math.sin(a) * 58); c.stroke(); } c.fillStyle = '#22c55e'; c.beginPath(); c.arc(W / 2, H / 2, 40, PI * 0.8, PI * 1.4); c.lineTo(W / 2, H / 2); c.fill(); });
    for (const sx of [-1, 1]) { const d = mk(g, gCyl(0.2, 0.2, 0.05, 20), C.ink, sx * 0.45, 1.05, 0.33); d.rotation.x = HP; pl(g, 0.34, 0.34, dialM, sx * 0.45, 1.05, 0.36); bx(g, 0.03, 0.15, 0.01, C.red, sx * 0.45, 1.05, 0.365).rotation.z = sx * 0.7; }
    const levers = [];
    [C.red, C.yellow, C.teal].forEach((col, i) => { const x = -0.5 + i * 0.5; bx(g, 0.2, 0.12, 0.08, C.ink, x, 0.48, 0.32, 0.02); const pv = grp(g, x, 0.54, 0.36); cy(pv, 0.025, 0.025, 0.42, C.steel, 0, 0, 0, 8); sp(pv, 0.075, col, 0, 0.44, 0, 12); levers.push(pv); });
    for (let i = 0; i < 5; i++) sp(g, 0.04, GL([C.green, C.yellow, C.pink, C.blue, C.green][i], 1.2), -0.5 + i * 0.25, 1.36, 0.32, 8);
    g.userData.tick = (t) => { levers.forEach((l, i) => { l.rotation.x = 0.45 * Math.sin(t * 1.1 + i * 2.1); }); };
    return { group: g };
  }, ['control', 'lever', 'dials', 'machine']);

  reg('cf1_status_tower', 'Blinking status light tower', () => {
    const g = new T.Group(); cy(g, 0.3, 0.34, 0.12, C.slate, 0, 0, 0, 16); cy(g, 0.06, 0.06, 1.3, C.steel, 0, 0.12, 0, 10);
    const ms = [0x22c55e, 0xfacc15, 0xec4899].map((c) => own(c, { emissive: c, emissiveIntensity: 0.3, transparent: true, opacity: 0.9 }));
    ms.forEach((m, i) => mk(g, gCyl(0.16, 0.16, 0.24, 16), m, 0, 1.55 + i * 0.26, 0)); cy(g, 0.17, 0.17, 0.06, C.ink, 0, 2.3, 0, 16);
    g.userData.tick = (t) => { const k = Math.floor(t * 1.5) % 3; ms.forEach((m, i) => { m.emissiveIntensity = i === k ? 1.8 : 0.25; }); };
    return { group: g };
  }, ['light', 'status', 'control']);

  reg('cf1_monitor_wall', 'Security monitor wall (camera feeds)', () => {
    const g = new T.Group(); bx(g, 5.0, 0.8, 0.5, 0x1e293b, 0, 0, 0, 0.05); bx(g, 5.02, 0.05, 0.05, GL(C.teal, 1.3), 0, 0.72, 0.25);
    bx(g, 5.0, 2.7, 0.25, 0x0f172a, 0, 0.8, -0.1, 0.05); pl(g, 4.8, 2.5, scr('feeds1', 1024, 512, drawFeeds(7), 0.8), 0, 2.15, 0.032);
    bx(g, 1.4, 0.3, 0.1, C.purple, 0, 3.5, -0.1, 0.04); pl(g, 1.3, 0.24, labelM('camwall', 'CAMERAS', { bg: '#7c3aed', fg: '#ffffff', radius: 10 }), 0, 3.65, -0.045);
    return { group: g };
  }, ['security', 'screens', 'cameras']);
  reg('cf1_monitor_wall_b', 'Monitor wall (more cameras)', () => {
    const g = new T.Group(); bx(g, 5.0, 0.8, 0.5, 0x1e293b, 0, 0, 0, 0.05); bx(g, 5.02, 0.05, 0.05, GL(C.pink, 1.3), 0, 0.72, 0.25);
    bx(g, 5.0, 2.7, 0.25, 0x0f172a, 0, 0.8, -0.1, 0.05); pl(g, 4.8, 2.5, scr('feeds2', 1024, 512, drawFeeds(13), 0.8), 0, 2.15, 0.032);
    return { group: g };
  }, ['security', 'screens', 'cameras']);

  reg('cf1_key_cabinet', 'Key cabinet (wall)', () => {
    const g = new T.Group(); mk(g, gBox(1.0, 1.2, 0.16, 0.03), C.choc3, 0, 0, 0);
    pl(g, 0.88, 1.0, pic('keys', 256, 288, (c, W, H) => { c.fillStyle = '#fef3c7'; c.fillRect(0, 0, W, H); const kc = ['#ef4444', '#facc15', '#22c55e', '#38bdf8', '#ec4899', '#a78bfa']; for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) { const x = 34 + i * 62, y = 40 + r * 66; circ(c, x, y - 18, 4, '#64748b'); if ((r * 4 + i) % 5 === 3) continue; c.strokeStyle = kc[(r + i) % 6]; c.lineWidth = 6; c.beginPath(); c.arc(x, y, 11, 0, PI * 2); c.stroke(); c.fillStyle = kc[(r + i) % 6]; c.fillRect(x - 3, y + 10, 6, 26); c.fillRect(x, y + 26, 9, 5); c.fillStyle = '#1f1a33'; c.font = `700 12px ${Z.FONT}`; c.fillText(String(r * 4 + i + 1), x + 12, y - 2); } }), 0, -0.04, 0.085);
    bx(g, 0.7, 0.18, 0.04, C.yellow, 0, 0.48, 0.07, 0.02); pl(g, 0.6, 0.14, labelM('keys', 'KEYS', { bg: '#facc15', fg: '#3b0764', radius: 8 }), 0, 0.57, 0.092);
    return { group: g };
  }, ['keys', 'security', 'cabinet', 'wall']);

  reg('cf1_lockers', 'Row of colourful lockers', () => {
    const g = new T.Group(); bx(g, 3.0, 0.12, 0.55, C.ink, 0, 0, 0); bx(g, 3.0, 1.9, 0.55, 0x64748b, 0, 0.12, 0, 0.02); bx(g, 3.04, 0.08, 0.58, C.ink, 0, 2.02, 0, 0.02);
    pl(g, 2.96, 1.86, pic('lockers', 640, 400, (c, W, H) => { const cols = ['#7c3aed', '#facc15', '#ec4899', '#14b8a6', '#38bdf8']; for (let i = 0; i < 5; i++) { const x = i * W / 5; c.fillStyle = cols[i]; rr(c, x + 4, 4, W / 5 - 8, H - 8, 10); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 0; k < 4; k++) rr(c, x + 30, 30 + k * 16, W / 5 - 60, 7, 3), c.fill(); c.fillStyle = '#e2e8f0'; rr(c, x + W / 5 - 34, H / 2 - 30, 12, 60, 6); c.fill(); circ(c, x + W / 10, H * 0.72, 22, '#ffffff'); txt(c, String(i + 1), x + W / 10, H * 0.72 + 2, 30, '#1f1a33', 'center', 800); if (i % 2 === 0) { c.fillStyle = '#ffffff'; c.beginPath(); for (let j = 0; j < 10; j++) { const a = j / 10 * PI * 2 - HP, q = j % 2 ? 8 : 18; c.lineTo(x + W / 10 + Math.cos(a) * q, H * 0.4 + Math.sin(a) * q); } c.fill(); } } }), 0, 1.05, 0.28);
    return { group: g };
  }, ['lockers', 'storage']);

  reg('cf1_map_board', 'Standing factory map board', () => {
    const g = new T.Group(); for (const sx of [-1, 1]) { bx(g, 0.1, 2.7, 0.1, C.choc3, sx * 1.6, 0, 0, 0.02); bx(g, 0.5, 0.08, 0.5, C.choc3, sx * 1.6, 0, 0, 0.02); }
    bx(g, 3.2, 2.0, 0.08, C.yellow, 0, 0.7, 0, 0.04); const m = pic('mapboard', 768, 480, drawMapBoard); pl(g, 3.0, 1.85, m, 0, 1.7, 0.045); pl(g, 3.0, 1.85, m, 0, 1.7, -0.045, PI);
    [C.red, C.pink, C.teal, C.purple, C.green].forEach((c, i) => sp(g, 0.05, c, -1.1 + i * 0.55, 1.3 + (i % 2) * 0.6, 0.07, 8));
    return { group: g };
  }, ['map', 'board', 'security']);

  /* ---------------- library ---------------- */
  function bookshelf(w, h, d, seed) {
    const g = new T.Group(); for (const sx of [-1, 1]) bx(g, 0.08, h, d, C.wood, sx * (w / 2 - 0.04), 0, 0, 0.01);
    bx(g, w + 0.1, 0.1, d + 0.06, C.wood, 0, h, 0, 0.02); bx(g, w - 0.08, h, 0.04, 0x4a2a16, 0, 0, -d / 2 + 0.03);
    const n = Math.floor((h - 0.15) / 0.6);
    for (let i = 0; i <= n; i++) bx(g, w - 0.1, 0.05, d - 0.04, 0x8a5a33, 0, 0.05 + i * 0.6, 0.0);
    for (let i = 0; i < n; i++) bx(g, w - 0.18, 0.46, d * 0.6, pic('books' + ((seed + i) % 6), 512, 128, drawBooks(11 + ((seed + i) % 6) * 7)), 0, 0.1 + i * 0.6, d * 0.12);
    return g;
  }
  reg('cf1_bookshelf', 'Tall bookshelf', () => ({ group: bookshelf(2.4, 3.0, 0.48, 0) }), ['books', 'shelf', 'library']);
  reg('cf1_bookshelf_b', 'Tall bookshelf (other books)', () => ({ group: bookshelf(2.4, 3.0, 0.48, 3) }), ['books', 'shelf', 'library']);
  reg('cf1_bookshelf_narrow', 'Narrow bookshelf', () => ({ group: bookshelf(1.5, 2.6, 0.4, 1) }), ['books', 'shelf', 'library']);
  reg('cf1_bookshelf_low', 'Low bookshelf', () => { const g = bookshelf(1.6, 1.2, 0.45, 2); cy(g, 0.12, 0.12, 0.14, C.teal, -0.45, 1.3, 0, 12); sp(g, 0.13, 0x22c55e, -0.45, 1.5, 0, 10); return { group: g }; }, ['books', 'shelf', 'library']);

  reg('cf1_reading_table', 'Long reading table with lamps', () => {
    const g = new T.Group(); bx(g, 3.2, 0.08, 1.1, C.choc2, 0, 0.72, 0, 0.03); for (const sx of [-1, 1]) for (const sz of [-1, 1]) cy(g, 0.06, 0.05, 0.72, C.choc, sx * 1.45, 0, sz * 0.43, 10);
    bx(g, 2.8, 0.08, 0.06, C.choc, 0, 0.5, 0);
    const y = 0.8;
    for (const sx of [-1, 1]) { cy(g, 0.1, 0.12, 0.04, GOLD, sx * 0.95, y, -0.25, 12); cy(g, 0.015, 0.015, 0.36, GOLD, sx * 0.95, y + 0.04, -0.25, 6); cy(g, 0.08, 0.2, 0.15, 0x10b981, sx * 0.95, y + 0.36, -0.25, 16); sp(g, 0.06, GL(0xfff1a8, 1.5), sx * 0.95, y + 0.36, -0.25, 8); }
    for (const [x, z, c, r] of [[-0.3, 0.15, C.red, 0.2], [0.55, 0.05, C.blue, -0.3]]) { const b = grp(g, x, y, z, r); bx(b, 0.52, 0.02, 0.36, c, 0, 0, 0, 0.005); for (const s of [-1, 1]) { const pg = bx(b, 0.24, 0.025, 0.33, C.cream, s * 0.125, 0.015, 0, 0.004); pg.rotation.z = s * -0.06; } }
    [C.purple, C.teal, C.yellow].forEach((c, i) => bx(g, 0.34 - i * 0.03, 0.06, 0.24, c, -1.15, y + i * 0.06, 0.2, 0.01).rotation.y = i * 0.2);
    tor(g, 0.07, 0.012, GOLD, 1.25, y + 0.015, 0.25, 12).rotation.x = HP; cy(g, 0.015, 0.015, 0.14, C.choc, 1.33, y + 0.015, 0.33, 6).rotation.x = HP;
    return { group: g };
  }, ['table', 'library', 'reading']);

  reg('cf1_big_globe', 'Big spinning floor globe', () => {
    const g = new T.Group(); cy(g, 0.42, 0.5, 0.1, C.choc, 0, 0, 0, 18); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2, l = cy(g, 0.04, 0.05, 0.8, C.choc3, Math.sin(a) * 0.3, 0.05, Math.cos(a) * 0.3, 8); l.rotation.set(Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35); }
    tor(g, 0.7, 0.04, C.choc3, 0, 0.95, 0, 32).rotation.x = HP;
    const pivot = grp(g, 0, 1.15, 0); pivot.rotation.z = 0.4; tor(pivot, 0.66, 0.025, GOLD, 0, 0, 0, 32);
    const globe = sp(pivot, 0.6, pic('globe', 512, 256, (c, W, H) => { c.fillStyle = '#38bdf8'; c.fillRect(0, 0, W, H); const r = rng(5); for (let i = 0; i < 16; i++) { c.fillStyle = ['#4ade80', '#facc15', '#22c55e', '#a3e635'][i % 4]; c.beginPath(); c.ellipse(r() * W, H * 0.15 + r() * H * 0.7, 20 + r() * 50, 14 + r() * 30, r() * 3, 0, PI * 2); c.fill(); } c.fillStyle = '#7a4426'; c.beginPath(); c.ellipse(W * 0.3, H * 0.5, 16, 24, 0.4, 0, PI * 2); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, 14); c.fillRect(0, H - 14, W, 14); }), 0, 0, 0, 28);
    g.userData.tick = (t) => { globe.rotation.y = t * 0.3; };
    return { group: g };
  }, ['globe', 'library', 'map']);

  reg('cf1_rolling_ladder', 'Rolling library ladder', () => {
    const g = new T.Group(), L = grp(g, 0, 0, 0.33); L.rotation.x = -0.23;
    for (const sx of [-1, 1]) { bx(L, 0.07, 2.95, 0.07, C.choc3, sx * 0.3, 0, 0, 0.015); sp(L, 0.06, C.ink, sx * 0.3, 0.06, 0.04, 8); }
    for (let i = 0; i < 9; i++) bx(L, 0.6, 0.04, 0.08, C.choc2, 0, 0.3 + i * 0.3, 0, 0.01);
    cy(L, 0.025, 0.025, 0.7, GOLD, 0, 2.92, 0, 8).rotation.z = HP;
    return { group: g };
  }, ['ladder', 'library']);

  const drawBlueprint = (g, W, H) => {
    g.fillStyle = '#1e40af'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; for (let x = 0; x < W; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.strokeRect(W * 0.15, H * 0.35, W * 0.4, H * 0.4); g.beginPath(); g.moveTo(W * 0.2, H * 0.35); g.lineTo(W * 0.28, H * 0.12); g.lineTo(W * 0.42, H * 0.12); g.lineTo(W * 0.5, H * 0.35); g.stroke();
    for (const [x, y, r] of [[0.68, 0.45, 0.12], [0.8, 0.68, 0.08]]) { g.beginPath(); g.arc(W * x, H * y, H * r, 0, PI * 2); g.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; g.beginPath(); g.moveTo(W * x + Math.cos(a) * H * r, H * y + Math.sin(a) * H * r); g.lineTo(W * x + Math.cos(a) * H * (r + 0.03), H * y + Math.sin(a) * H * (r + 0.03)); g.stroke(); } }
    g.setLineDash([8, 6]); g.beginPath(); g.moveTo(W * 0.15, H * 0.85); g.lineTo(W * 0.55, H * 0.85); g.stroke(); g.setLineDash([]);
    txt(g, 'CHOCO-MATIC 3000', W * 0.05, H * 0.07, H * 0.07, '#ffffff', 'left', 800); txt(g, 'TOP SECRET RECIPE MACHINE', W * 0.95, H * 0.94, H * 0.045, '#bfdbfe', 'right', 700);
  };
  reg('cf1_drafting_table', 'Blueprint drafting table', () => {
    const g = new T.Group(); for (const sx of [-1, 1]) { bx(g, 0.07, 0.9, 0.7, C.choc3, sx * 0.6, 0, 0, 0.01); } bx(g, 1.2, 0.06, 0.06, C.choc3, 0, 0.3, 0);
    const b = grp(g, 0, 0.92, 0); b.rotation.x = 0.35; bx(b, 1.45, 0.05, 1.0, C.choc2, 0, -0.025, 0, 0.02); flat(b, 1.36, 0.92, pic('blueprint', 512, 352, drawBlueprint), 0, 0.03, 0);
    bx(b, 0.9, 0.02, 0.06, C.yellow, 0.1, 0.03, 0.3, 0.005).rotation.y = 0.15; cy(b, 0.012, 0.012, 0.18, C.pink, -0.5, 0.04, 0.38, 6).rotation.z = HP;
    return { group: g };
  }, ['blueprint', 'table', 'library']);

  reg('cf1_scroll_basket', 'Basket of blueprint scrolls', () => {
    const g = new T.Group(); cy(g, 0.32, 0.26, 0.5, C.kraft, 0, 0, 0, 16); tor(g, 0.32, 0.03, 0xa0763c, 0, 0.5, 0, 18).rotation.x = HP;
    for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2, r = i ? 0.15 : 0, s = cy(g, 0.045, 0.045, 0.95, i % 2 ? 0x93c5fd : C.cream, Math.sin(a) * r, 0.1, Math.cos(a) * r, 10); s.rotation.set(Math.cos(a) * 0.18, 0, -Math.sin(a) * 0.18); }
    return { group: g };
  }, ['scrolls', 'blueprints', 'library']);

  reg('cf1_archive_boxes', 'Stack of archive boxes', () => {
    const g = new T.Group(), m = pic('arcbox', 256, 160, (c, W, H) => { c.fillStyle = '#c8a165'; c.fillRect(0, 0, W, H); c.fillStyle = '#b08850'; c.fillRect(0, H * 0.45, W, 6); c.fillStyle = '#ffffff'; rr(c, W * 0.25, H * 0.2, W * 0.5, H * 0.3, 6); c.fill(); txt(c, 'RECIPES', W / 2, H * 0.3, 24, '#7c3aed', 'center', 800); txt(c, '1987', W / 2, H * 0.42, 18, '#1f1a33', 'center', 700); c.fillStyle = '#8a6a3a'; rr(c, W * 0.42, H * 0.7, W * 0.16, H * 0.1, 6); c.fill(); });
    for (const [x, y, z, r] of [[-0.33, 0, 0, 0.05], [0.33, 0, 0.02, -0.04], [0, 0.42, 0, 0.1], [-0.36, 0.42, 0.02, -0.15]]) { const b = mk(g, gBox(0.62, 0.42, 0.45, 0.01), m, x, y + 0.21, z); b.rotation.y = r; }
    return { group: g };
  }, ['boxes', 'archive', 'storage']);

  /* ---------------- innovation lab ---------------- */
  reg('cf1_tesla_coil', 'Glowing idea coil', () => {
    const g = new T.Group(); bx(g, 1.0, 0.35, 1.0, C.deep, 0, 0, 0, 0.08); bx(g, 1.04, 0.06, 1.04, C.yellow, 0, 0.29, 0, 0.02);
    cy(g, 0.18, 0.22, 1.6, MET(0xc2703d), 0, 0.35, 0, 14); for (let i = 0; i < 6; i++) tor(g, 0.22, 0.03, MET(0xa0522d), 0, 0.55 + i * 0.24, 0, 16).rotation.x = HP;
    tor(g, 0.4, 0.12, SILVER, 0, 2.05, 0, 24).rotation.x = HP;
    const om = own(0x5eead4, { emissive: 0x2dd4bf, emissiveIntensity: 1.4 }); const orb = mk(g, gSph(0.24, 18), om, 0, 2.28, 0);
    const am = new T.MeshBasicMaterial({ color: 0xc4b5fd }), arcs = grp(g, 0, 2.28, 0);
    for (let i = 0; i < 3; i++) { const a = grp(arcs, 0, 0, 0, i * 2.1); let px = 0.2, py = 0; for (let k = 0; k < 4; k++) { const nx = px + 0.15, ny = (k % 2 ? 0.1 : -0.1); const seg = mk(a, gBox(Math.hypot(nx - px, ny - py), 0.025, 0.025), am, (px + nx) / 2, (py + ny) / 2, 0); seg.rotation.z = Math.atan2(ny - py, nx - px); px = nx; py = ny; } }
    g.userData.tick = (t) => { om.emissiveIntensity = 1.0 + 0.9 * Math.abs(Math.sin(t * 3)); arcs.rotation.y = t * 2.2; arcs.children.forEach((a, i) => { a.visible = (Math.floor(t * 7) + i) % 3 !== 0; }); orb.scale.setScalar(1 + 0.05 * Math.sin(t * 6)); };
    return { group: g };
  }, ['coil', 'lab', 'science', 'glow']);

  reg('cf1_holo_table', 'Holographic chocolate table', () => {
    const g = new T.Group(); cy(g, 1.0, 1.1, 0.8, C.navy, 0, 0, 0, 32); cy(g, 1.15, 1.15, 0.08, 0x312e81, 0, 0.8, 0, 32);
    tor(g, 1.13, 0.03, GL(C.teal, 1.5), 0, 0.88, 0, 40).rotation.x = HP; cy(g, 0.35, 0.35, 0.03, GL(C.teal, 1.2), 0, 0.88, 0, 24);
    const beam = mk(g, gCyl(0.85, 0.35, 1.2, 28, true), new T.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.13, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }), 0, 1.5, 0);
    const holo = grp(g, 0, 1.55, 0), hm = new T.MeshBasicMaterial({ color: 0x67e8f9, wireframe: true }), hf = new T.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.25, depthWrite: false });
    mk(holo, gBox(0.8, 0.12, 0.42), hf); mk(holo, gBox(0.8, 0.12, 0.42), hm); for (let i = 0; i < 4; i++) mk(holo, gBox(0.17, 0.05, 0.17), hm, -0.3 + i * 0.2, 0.08, 0.1);
    const ring = tor(holo, 0.55, 0.012, new T.MeshBasicMaterial({ color: 0xf0abfc }), 0, 0, 0, 40); ring.rotation.x = 1.2;
    g.userData.tick = (t) => { holo.rotation.y = t * 0.8; holo.position.y = 1.55 + 0.06 * Math.sin(t * 2); ring.rotation.z = t * 1.5; beam.material.opacity = 0.11 + 0.04 * Math.sin(t * 5); };
    return { group: g };
  }, ['hologram', 'table', 'lab', 'future']);

  reg('cf1_flask_bench', 'Lab bench with bubbling flasks', () => {
    const g = new T.Group(); bx(g, 2.6, 0.82, 0.8, C.lav, 0, 0, 0, 0.04); bx(g, 2.7, 0.06, 0.86, C.white, 0, 0.82, 0, 0.02);
    for (let i = 0; i < 3; i++) { bx(g, 0.8, 0.6, 0.03, C.purple, -0.86 + i * 0.86, 0.1, 0.4, 0.02); sp(g, 0.03, C.yellow, -0.6 + i * 0.86, 0.5, 0.43, 8); }
    const y = 0.88, liq = [C.pink, C.teal, C.yellow, 0x22c55e, C.purple];
    [[-1.0, 0.0, 0], [-0.55, -0.15, 1], [0.6, -0.1, 2]].forEach(([x, z, k]) => { cy(g, 0.05, 0.15, 0.24, GLASS, x, y, z, 16); cy(g, 0.04, 0.04, 0.12, GLASS, x, y + 0.24, z, 10); cy(g, 0.075, 0.135, 0.13, GL(liq[k], 0.8), x, y + 0.005, z, 16); });
    [[0.1, 0.05, 3], [1.05, 0.0, 4]].forEach(([x, z, k]) => { sp(g, 0.15, GLASS, x, y + 0.15, z, 16); sp(g, 0.12, GL(liq[k], 0.8), x, y + 0.13, z, 14); cy(g, 0.04, 0.04, 0.18, GLASS, x, y + 0.27, z, 10); });
    bx(g, 0.5, 0.08, 0.14, C.choc3, -0.15, y, 0.25, 0.01); for (let i = 0; i < 5; i++) cy(g, 0.025, 0.025, 0.24, GL(liq[i], 0.7), -0.33 + i * 0.09, y + 0.02, 0.25, 8);
    const bub = grp(g, 0, 0, 0), bm = PM(0xffffff, { transparent: true, opacity: 0.6, emissive: 0xffffff, emissiveIntensity: 0.4 }), B = [];
    for (const [x, z] of [[-1.0, 0], [0.1, 0.05], [1.05, 0]]) for (let i = 0; i < 3; i++) B.push([sp(bub, 0.03 + i * 0.008, bm, x, 0, z, 8), x, z, i]);
    g.userData.tick = (t) => { for (const [m, x, z, i] of B) { const f = (t * 0.5 + i / 3 + x) % 1; m.position.set(x + Math.sin(t * 3 + i) * 0.03, y + 0.38 + f * 0.45, z); m.scale.setScalar(1 - f * 0.6); } };
    return { group: g };
  }, ['lab', 'science', 'flasks', 'bench']);

  reg('cf1_friendly_robot', 'Friendly helper robot', () => {
    const g = new T.Group();
    for (const sx of [-1, 1]) { bx(g, 0.22, 0.45, 0.25, C.lilac, sx * 0.17, 0.08, 0, 0.06); bx(g, 0.3, 0.1, 0.38, C.purple, sx * 0.17, 0, 0.04, 0.04); }
    bx(g, 0.78, 0.72, 0.52, C.white, 0, 0.5, 0, 0.16); bx(g, 0.8, 0.08, 0.54, C.purple, 0, 0.5, 0, 0.03);
    pl(g, 0.42, 0.3, scr('robochest', 128, 96, (c, W, H) => { c.fillStyle = '#0f172a'; c.fillRect(0, 0, W, H); c.fillStyle = '#f472b6'; c.beginPath(); c.moveTo(W / 2, H * 0.8); c.bezierCurveTo(W * 0.1, H * 0.45, W * 0.3, H * 0.05, W / 2, H * 0.32); c.bezierCurveTo(W * 0.7, H * 0.05, W * 0.9, H * 0.45, W / 2, H * 0.8); c.fill(); }, 1), 0, 0.9, 0.262);
    for (let i = 0; i < 3; i++) sp(g, 0.035, GL([C.yellow, C.teal, C.pink][i], 1.2), -0.12 + i * 0.12, 0.66, 0.26, 8);
    const head = grp(g, 0, 1.24, 0); cy(head, 0.08, 0.1, 0.06, C.purple, 0, -0.04, 0, 10); bx(head, 0.64, 0.48, 0.5, C.white, 0, 0, 0, 0.16);
    pl(head, 0.5, 0.32, scr('roboface', 160, 100, (c, W, H) => { c.fillStyle = '#0f172a'; rr(c, 0, 0, W, H, 16); c.fill(); circ(c, W * 0.3, H * 0.42, 16, '#5eead4'); circ(c, W * 0.7, H * 0.42, 16, '#5eead4'); circ(c, W * 0.33, H * 0.36, 5, '#ffffff'); circ(c, W * 0.73, H * 0.36, 5, '#ffffff'); c.strokeStyle = '#5eead4'; c.lineWidth = 6; c.beginPath(); c.arc(W / 2, H * 0.55, 18, 0.3, PI - 0.3); c.stroke(); circ(c, W * 0.15, H * 0.7, 7, 'rgba(244,114,182,.8)'); circ(c, W * 0.85, H * 0.7, 7, 'rgba(244,114,182,.8)'); }, 1), 0, 0.25, 0.252);
    for (const sx of [-1, 1]) { const e = mk(head, gCyl(0.08, 0.08, 0.08, 14), C.purple, sx * 0.34, 0.24, 0); e.rotation.z = HP; }
    cy(head, 0.015, 0.015, 0.22, C.steel, 0, 0.48, 0, 6); const ant = sp(head, 0.06, own(C.pink, { emissive: C.pink, emissiveIntensity: 1.2 }), 0, 0.74, 0, 10);
    const arms = [1, -1].map((sx) => { const a = grp(g, sx * 0.46, 1.08, 0); bx(a, 0.16, 0.5, 0.16, C.purple, 0, -0.52, 0, 0.06); sp(a, 0.11, C.yellow, 0, -0.58, 0, 12); return a; });
    g.userData.tick = (t) => { arms[0].rotation.z = 2.5 + 0.45 * Math.sin(t * 5); arms[1].rotation.z = -0.15 - 0.05 * Math.sin(t * 2); head.rotation.y = 0.35 * Math.sin(t * 0.9); ant.material.emissiveIntensity = 0.8 + 0.8 * Math.abs(Math.sin(t * 3)); };
    return { group: g };
  }, ['robot', 'lab', 'friend', 'helper']);

  reg('cf1_invention_machine', 'Wacky invention machine', () => {
    const g = new T.Group();
    bx(g, 1.6, 1.3, 1.3, C.teal, -0.3, 0, 0, 0.12); bx(g, 1.64, 0.12, 1.34, C.purple, -0.3, 1.25, 0, 0.04);
    bx(g, 1.2, 0.7, 0.04, C.cream, -0.3, 0.35, 0.66, 0.03);
    for (const sx of [-1, 1]) { const d = mk(g, gCyl(0.16, 0.16, 0.04, 18), C.ink, -0.3 + sx * 0.3, 0.85, 0.69); d.rotation.x = HP; pl(g, 0.26, 0.26, pic('dial', 128, 128, () => { }), -0.3 + sx * 0.3, 0.85, 0.715); }
    for (let i = 0; i < 4; i++) cy(g, 0.05, 0.05, 0.05, GL([C.red, C.yellow, C.green, C.pink][i], 0.8), -0.6 + i * 0.2, 0.5, 0.69, 10).rotation.x = HP;
    cy(g, 0.52, 0.12, 0.6, C.purple, -0.5, 1.37, 0, 20); cy(g, 0.47, 0.47, 0.02, PM(0x6b3a1f, { roughness: 0.15 }), -0.5, 1.94, 0, 20);
    const gears = [[-1.12, 0.75, 0.0, 0.34, C.yellow], [-1.12, 0.35, 0.42, 0.22, C.pink]].map(([x, y, z, r, c]) => { const ge = grp(g, x, y, z); ge.rotation.z = HP; const inner = grp(ge); cy(inner, r, r, 0.1, c, 0, -0.05, 0, 20); const n = Math.round(r * 30); for (let i = 0; i < n; i++) { const a = i / n * PI * 2; bx(inner, 0.08, 0.1, 0.08, c, Math.cos(a) * (r + 0.03), -0.05, Math.sin(a) * (r + 0.03)).rotation.y = -a; } cy(inner, 0.06, 0.06, 0.14, C.ink, 0, -0.07, 0, 10); return inner; });
    const curve = new T.CatmullRomCurve3([new T.Vector3(0.2, 1.1, 0), new T.Vector3(0.55, 1.75, 0), new T.Vector3(0.9, 1.75, 0), new T.Vector3(0.95, 1.5, 0)]);
    mk(g, new T.TubeGeometry(curve, 20, 0.07, 8, false), MET(0xc2703d));
    cy(g, 0.36, 0.42, 0.9, C.deep, 0.95, 0, 0, 20); tor(g, 0.33, 0.04, GOLD, 0.95, 0.92, 0, 20).rotation.x = HP; sp(g, 0.33, GLASS, 0.95, 1.2, 0, 20);
    const bean = sp(g, 0.13, own(C.yellow, { emissive: 0xf59e0b, emissiveIntensity: 1.2 }), 0.95, 1.18, 0, 14); bean.scale.set(0.8, 1.2, 0.7);
    bx(g, 0.5, 0.06, 0.45, C.steel, -0.3, 0.12, 0.85, 0.02); chocBar(g, -0.35, 0.18, 0.85, C.choc2, 0.3); chocBar(g, -0.2, 0.21, 0.92, C.pink, -0.2);
    cy(g, 0.03, 0.03, 0.3, C.steel, 0.2, 1.37, -0.35, 6); const bulb = sp(g, 0.12, own(0xfff3a3, { emissive: 0xfde047, emissiveIntensity: 1.2 }), 0.2, 1.78, -0.35, 12);
    g.userData.tick = (t) => { gears[0].rotation.y = t * 1.4; gears[1].rotation.y = -t * 2.2; bean.position.y = 1.18 + 0.05 * Math.sin(t * 2.5); bean.rotation.y = t; bulb.material.emissiveIntensity = Math.floor(t * 2) % 3 === 0 ? 2.2 : 0.7; };
    return { group: g };
  }, ['machine', 'invention', 'lab', 'gears']);

  reg('cf1_bubble_tank', 'Bubbling experiment tank', () => {
    const g = new T.Group(); cy(g, 0.55, 0.6, 0.35, C.deep, 0, 0, 0, 24); cy(g, 0.56, 0.56, 0.06, C.yellow, 0, 0.32, 0, 24);
    cy(g, 0.48, 0.48, 1.5, GLASS, 0, 0.38, 0, 24, true); cy(g, 0.45, 0.45, 1.2, PM(0xf472b6, { emissive: 0xdb2777, emissiveIntensity: 0.6, transparent: true, opacity: 0.6, depthWrite: false }), 0, 0.38, 0, 24);
    cy(g, 0.52, 0.52, 0.14, C.deep, 0, 1.88, 0, 24); cy(g, 0.06, 0.06, 0.4, C.steel, 0, 2.0, 0, 8); sp(g, 0.1, GL(C.teal, 1.3), 0, 2.45, 0, 10);
    const bm = PM(0xffffff, { transparent: true, opacity: 0.7, emissive: 0xfbcfe8, emissiveIntensity: 0.6 }), B = [];
    for (let i = 0; i < 8; i++) B.push([sp(g, 0.04 + (i % 3) * 0.02, bm, 0, 0, 0, 8), i]);
    g.userData.tick = (t) => { for (const [m, i] of B) { const f = (t * 0.35 + i / 8) % 1, a = i * 2.3; m.position.set(Math.cos(a) * 0.22 + Math.sin(t + i) * 0.05, 0.45 + f * 1.05, Math.sin(a) * 0.22); } };
    return { group: g };
  }, ['lab', 'bubbles', 'tank', 'science']);

  /* ---------------- quality lab ---------------- */
  reg('cf1_tasting_table', 'Tasting table with treats', () => {
    const g = new T.Group(); for (const sx of [-1, 1]) for (const sz of [-1, 1]) cy(g, 0.05, 0.05, 0.55, C.choc3, sx * 1.2, 0, sz * 0.48, 8);
    bx(g, 2.72, 0.24, 1.22, C.rose, 0, 0.52, 0, 0.03); bx(g, 2.7, 0.05, 1.2, C.cream, 0, 0.75, 0, 0.02);
    const y = 0.8;
    [[-0.85, 0.1], [0.05, -0.18], [0.9, 0.12]].forEach(([x, z], k) => { cy(g, 0.2, 0.18, 0.02, C.white, x, y, z, 20); for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; praline(g, x + Math.sin(a) * 0.1, y + 0.01, z + Math.cos(a) * 0.1, [C.choc, 0x3b2214, C.cream, C.choc2, C.pink][(i + k) % 5]); } });
    miniCake(g, -0.4, y, -0.3, 1.1); miniCake(g, 0.5, y, -0.25, 1.0, C.yellow); miniCake(g, 1.15, y, -0.32, 0.9, C.mint);
    mk(g, gget('dome', () => new T.SphereGeometry(0.22, 16, 8, 0, PI * 2, 0, HP)), GLASS, 0.05, y + 0.02, -0.18);
    chocBar(g, -1.15, y, -0.2, C.choc2, 0.4); chocBar(g, -1.1, y + 0.03, -0.18, C.pink, 0.1);
    const card = pic('stars', 128, 80, (c, W, H) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); for (let i = 0; i < 5; i++) { c.fillStyle = i < 4 ? '#facc15' : '#e5e7eb'; c.beginPath(); for (let j = 0; j < 10; j++) { const a = j / 10 * PI * 2 - HP, q = j % 2 ? 5 : 11; c.lineTo(14 + i * 25 + Math.cos(a) * q, H / 2 + Math.sin(a) * q); } c.fill(); } });
    for (const x of [-0.85, 0.05, 0.9]) { const cg = grp(g, x, y, 0.45); bx(cg, 0.22, 0.12, 0.02, card, 0, 0, 0).rotation.x = -0.25; }
    for (const x of [-0.3, 0.45]) { cy(g, 0.05, 0.045, 0.14, GLASS, x, y, 0.32, 12); cy(g, 0.043, 0.04, 0.1, C.white, x, y, 0.32, 12); }
    return { group: g };
  }, ['tasting', 'table', 'chocolate', 'cake']);

  function microscope(p, x, z, ry, s = 1.3) {
    const m = grp(p, x, 0, z, ry); m.scale.setScalar(s); bx(m, 0.22, 0.05, 0.28, C.white, 0, 0, 0, 0.02); bx(m, 0.07, 0.34, 0.08, C.teal, 0, 0.05, -0.09, 0.02);
    bx(m, 0.17, 0.02, 0.15, C.ink, 0, 0.13, 0.01); const t = grp(m, 0, 0.3, -0.02); t.rotation.x = -0.35; cy(t, 0.035, 0.04, 0.2, C.white, 0, 0, 0, 12); cy(t, 0.028, 0.028, 0.07, C.ink, 0, 0.2, 0, 10); cy(t, 0.02, 0.015, 0.06, C.steel, 0, -0.06, 0, 8);
    return m;
  }
  reg('cf1_microscope_bench', 'Microscope bench', () => {
    const g = new T.Group(); bx(g, 3.0, 0.82, 0.8, 0xe2e8f0, 0, 0, 0, 0.04); bx(g, 3.08, 0.06, 0.86, C.white, 0, 0.82, 0, 0.02);
    for (let i = 0; i < 4; i++) { bx(g, 0.68, 0.6, 0.03, C.teal, -1.1 + i * 0.73, 0.1, 0.4, 0.02); sp(g, 0.03, C.white, -1.1 + i * 0.73, 0.62, 0.43, 8); }
    const y = 0.88; for (const x of [-1.0, 0.0, 1.0]) { const m = microscope(g, x, -0.08, 0); m.position.y = y; }
    for (const [x, c] of [[-0.5, C.pink], [0.5, C.yellow], [1.32, C.green]]) { cy(g, 0.09, 0.09, 0.02, GLASS, x, y, 0.22, 16); cy(g, 0.05, 0.05, 0.012, GL(c, 0.5), x, y + 0.004, 0.22, 12); }
    bx(g, 0.26, 0.02, 0.34, C.white, -1.3, y, 0.2, 0.005).rotation.y = 0.2; bx(g, 0.26, 0.02, 0.34, C.yellow, -1.28, y + 0.02, 0.18, 0.005).rotation.y = 0.35;
    return { group: g };
  }, ['microscope', 'lab', 'science', 'bench']);

  reg('cf1_mini_conveyor', 'Small test conveyor', () => {
    const g = new T.Group(), L = 3.6;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.08, 0.72, 0.08, C.steel, sx * (L / 2 - 0.2), 0, sz * 0.3, 0.01);
    for (const sz of [-1, 1]) bx(g, L, 0.12, 0.06, C.purple, 0, 0.68, sz * 0.38, 0.02);
    const bt = ctex('belt', 256, 32, (c, W, H) => { c.fillStyle = '#1f2937'; c.fillRect(0, 0, W, H); c.fillStyle = '#374151'; for (let x = 0; x < W; x += 32) c.fillRect(x, 0, 8, H); }); bt.wrapS = bt.wrapT = T.RepeatWrapping; bt.repeat.set(6, 1);
    const beltM = XM.get('beltM') || new T.MeshStandardMaterial({ map: bt, roughness: 0.8 }); XM.set('beltM', beltM);
    bx(g, L - 0.1, 0.04, 0.7, beltM, 0, 0.72, 0); for (const sx of [-1, 1]) { const r = mk(g, gCyl(0.07, 0.07, 0.74, 12), C.steel, sx * (L / 2 - 0.05), 0.7, 0); r.rotation.x = HP; }
    for (const sz of [-1, 1]) bx(g, 0.08, 0.6, 0.08, C.yellow, 0.4, 0.76, sz * 0.43, 0.02); bx(g, 0.14, 0.12, 0.96, C.yellow, 0.4, 1.36, 0, 0.03); bx(g, 0.04, 0.03, 0.8, GL(C.red, 1.6), 0.4, 1.33, 0);
    pl(g, 0.86, 0.16, labelM('qc', 'QUALITY CHECK', { bg: '#facc15', fg: '#3b0764', radius: 8, size: 54 }), 0.4, 1.42, 0.075);
    bx(g, 0.5, 0.45, 0.6, C.teal, L / 2 + 0.3, 0, 0, 0.06); bx(g, 0.42, 0.05, 0.5, C.choc2, L / 2 + 0.3, 0.4, 0);
    const pcs = []; for (let i = 0; i < 6; i++) { const p = bx(g, 0.2, 0.05, 0.12, i % 3 === 1 ? MET(0xe0b232) : C.choc2, 0, 0.74, 0, 0.015); pcs.push(p); }
    g.userData.tick = (t) => { bt.offset.x = -(t * 0.35 * 6 / L) % 1; pcs.forEach((p, i) => { p.position.x = -L / 2 + 0.25 + ((t * 0.35 + i * (L - 0.5) / 6) % (L - 0.5)); }); };
    return { group: g };
  }, ['conveyor', 'quality', 'machine', 'chocolate']);

  reg('cf1_sample_rack', 'Sample jar rack', () => {
    const g = new T.Group(); for (const sx of [-1, 1]) for (const sz of [-1, 1]) cy(g, 0.025, 0.025, 1.8, C.steel, sx * 0.97, 0, sz * 0.22, 8);
    for (const y of [0.3, 0.9, 1.5]) bx(g, 2.0, 0.04, 0.5, C.white, 0, y, 0, 0.01);
    const cols = [C.choc2, C.pink, C.yellow, 0x3b2214, C.mint, C.orange, C.cream, C.purple];
    for (const [y, row] of [[0.94, 0], [1.54, 1]]) for (let i = 0; i < 6; i++) { const x = -0.78 + i * 0.31, c = cols[(i + row * 3) % 8]; cy(g, 0.085, 0.085, 0.22, GLASS, x, y, 0, 12); cy(g, 0.075, 0.075, 0.15, c, x, y, 0, 12); cy(g, 0.09, 0.09, 0.04, [C.purple, C.teal, C.pink][i % 3], x, y + 0.22, 0, 12); }
    for (const x of [-0.5, 0.5]) { bx(g, 0.8, 0.04, 0.42, C.yellow, x, 0.34, 0, 0.01); for (let i = 0; i < 4; i++) chocBar(g, x - 0.27 + i * 0.18, 0.38, 0, i % 2 ? C.choc2 : 0x3b2214, HP, 0.9); }
    pl(g, 1.0, 0.18, labelM('samples', 'SAMPLES', { bg: '#14b8a6', fg: '#ffffff', radius: 8 }), 0, 1.66, 0.26);
    return { group: g };
  }, ['samples', 'jars', 'shelf', 'lab']);

  reg('cf1_scale_table', 'Table with digital scales', () => {
    const g = new T.Group(); bx(g, 1.4, 0.06, 0.7, C.white, 0, 0.72, 0, 0.02); for (const sx of [-1, 1]) bx(g, 0.06, 0.72, 0.62, C.pink, sx * 0.64, 0, 0, 0.02);
    const dm = scr('scaledisp', 128, 48, (c, W, H) => { c.fillStyle = '#052e16'; c.fillRect(0, 0, W, H); txt(c, '125 g', W / 2, H / 2 + 2, 30, '#4ade80', 'center', 800); }, 1);
    for (const [x, k] of [[-0.35, 0], [0.35, 1]]) { bx(g, 0.38, 0.08, 0.42, C.white, x, 0.78, 0, 0.03); cy(g, 0.15, 0.15, 0.025, SILVER, x, 0.86, -0.03, 20); pl(g, 0.16, 0.06, dm, x, 0.82, 0.212); if (k) miniCake(g, x, 0.885, -0.03, 0.9); else chocBar(g, x, 0.885, -0.03, C.choc2, 0.3, 1.2); }
    for (let i = 0; i < 3; i++) cy(g, 0.05 - i * 0.01, 0.05 - i * 0.01, 0.05, GOLD, 0.62, 0.78 + i * 0.05, 0.22, 12);
    return { group: g };
  }, ['scale', 'weigh', 'lab']);

  /* ---------------- meeting hall ---------------- */
  reg('cf1_stage_screen', 'Stage screen with the Zungga logo', () => {
    const g = new T.Group(); mk(g, gBox(5.2, 2.9, 0.16, 0.08), C.deep, 0, 0, 0);
    pl(g, 5.0, 2.7, scr('welcome', 1024, 552, (c, W, H) => { const bg = c.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#7c3aed'); bg.addColorStop(1, '#db2777'); c.fillStyle = bg; c.fillRect(0, 0, W, H); for (let i = 0; i < 40; i++) circ(c, (i * 97) % W, (i * 53) % H, 2 + (i % 3), 'rgba(255,255,255,.5)'); c.fillStyle = 'rgba(255,255,255,.92)'; rr(c, W * 0.29, H * 0.08, W * 0.42, H * 0.66, 40); c.fill(); txt(c, 'WELCOME, TEAM ZUNGGA!', W / 2, H * 0.86, 64, '#ffd84a', 'center', 800, W * 0.9); }, 0.75), 0, 0, 0.082);
    Z.decal(Z.logoTex(), 1.8, 1.8 * 755 / 920, g, 0, 0.27, 0.09);
    return { group: g };
  }, ['screen', 'stage', 'logo', 'meeting']);

  reg('cf1_podium', 'Speaker podium', () => {
    const g = new T.Group(); bx(g, 1.0, 0.08, 0.7, C.choc, 0, 0, 0, 0.02); bx(g, 0.86, 1.0, 0.56, C.purple, 0, 0.08, 0, 0.06);
    const top = grp(g, 0, 1.1, 0); top.rotation.x = -0.25; bx(top, 1.0, 0.06, 0.66, C.choc2, 0, 0, 0, 0.02); bx(top, 0.4, 0.015, 0.3, C.white, 0, 0.06, 0, 0.004);
    mk(g, gStar(0.2, 0.04), GOLD, 0, 0.75, 0.3); pl(g, 0.7, 0.14, labelM('zpod', 'ZUNGGA', { bg: '#facc15', fg: '#5b21b6', radius: 8 }), 0, 0.38, 0.285);
    const mic = grp(g, 0.25, 1.12, 0.05); mic.rotation.x = -0.6; cy(mic, 0.012, 0.012, 0.35, C.ink, 0, 0, 0, 6); sp(mic, 0.04, C.ink, 0, 0.37, 0, 10);
    cy(g, 0.04, 0.035, 0.12, GLASS, -0.32, 1.15, 0.0, 10);
    return { group: g };
  }, ['podium', 'stage', 'speech', 'meeting']);

  /* ---------------- hall of fame ---------------- */
  const pedestal = (key, plaque, top) => () => {
    const g = new T.Group(); bx(g, 0.95, 0.12, 0.95, C.choc3, 0, 0, 0, 0.02); bx(g, 0.82, 0.9, 0.82, C.cream, 0, 0.12, 0, 0.04); bx(g, 0.92, 0.08, 0.92, GOLD, 0, 1.0, 0, 0.02); bx(g, 0.62, 0.08, 0.62, C.purple, 0, 1.08, 0, 0.03);
    pl(g, 0.62, 0.17, labelM('ped_' + key, plaque, { bg: '#e0b232', fg: '#3b0764', radius: 6, size: 52 }), 0, 0.62, 0.415);
    top(g, 1.16); return { group: g };
  };
  reg('cf1_pedestal_cup', 'Pedestal: golden cup', pedestal('cup', 'BEST TASTE 1998', (g, y) => cup(g, 0, y, 0, 2.8)), ['trophy', 'award', 'pedestal']);
  reg('cf1_pedestal_star', 'Pedestal: star award', pedestal('star', 'TEAM STAR 2010', (g, y) => { cy(g, 0.04, 0.06, 0.3, GOLD, 0, y, 0, 8); mk(g, gStar(0.36, 0.08), GOLD, 0, y + 0.62, 0); }), ['trophy', 'award', 'pedestal', 'star']);
  reg('cf1_pedestal_bar', 'Pedestal: golden chocolate bar', pedestal('bar', 'GOLDEN BAR 2019', (g, y) => { const b = grp(g, 0, y + 0.2, 0); b.rotation.x = -0.6; bx(b, 0.62, 0.08, 0.36, GOLD, 0, 0, 0, 0.02); for (let i = 0; i < 8; i++) bx(b, 0.13, 0.04, 0.15, GOLD, -0.225 + (i % 4) * 0.15, 0.08, (i < 4 ? -0.08 : 0.08), 0.015); bx(g, 0.3, 0.2, 0.2, C.choc, 0, y, 0.05, 0.02); }), ['trophy', 'award', 'pedestal', 'chocolate']);
  reg('cf1_pedestal_medal', 'Pedestal: giant medal', pedestal('medal', 'TOP INVENTOR', (g, y) => { bx(g, 0.08, 0.5, 0.06, C.choc, 0, y, -0.1); const m = mk(g, gCyl(0.28, 0.28, 0.06, 28), GOLD, 0, y + 0.55, 0); m.rotation.x = HP; mk(g, gStar(0.16, 0.03), C.purple, 0, y + 0.55, 0.05); for (const sx of [-1, 1]) { const r = bx(g, 0.14, 0.45, 0.02, sx < 0 ? C.pink : C.teal, sx * 0.12, y + 0.75, -0.02); r.rotation.z = sx * 0.4; } }), ['medal', 'award', 'pedestal']);

  reg('cf1_cocoa_statue', 'Golden cocoa-bean statue', () => {
    const g = new T.Group(); cy(g, 1.0, 1.1, 0.25, C.choc3, 0, 0, 0, 32); cy(g, 0.82, 0.88, 0.75, C.cream, 0, 0.25, 0, 32); cy(g, 0.86, 0.86, 0.08, GOLD, 0, 0.88, 0, 32); cy(g, 0.94, 0.94, 0.1, C.cream, 0, 1.0, 0, 32);
    pl(g, 0.9, 0.2, labelM('beanplq', 'THE GOLDEN COCOA BEAN', { bg: '#e0b232', fg: '#3b0764', radius: 6, size: 44 }), 0, 0.6, 0.86);
    const bean = grp(g, 0, 1.1, 0), gm = PM(0xf5c542, { metalness: 0.6, roughness: 0.25 });
    const body = sp(bean, 0.55, gm, 0, 0.78, 0, 28); body.scale.set(0.78, 1.3, 0.62);
    const ridge = tor(bean, 0.55, 0.03, MET(0xc9971f), 0, 0.78, 0, 32); ridge.scale.set(0.78, 1.3, 1); ridge.rotation.y = HP; ridge.scale.set(0.62, 1.3, 1);
    for (const sx of [-1, 1]) { sp(bean, 0.075, C.ink, sx * 0.15, 0.95, 0.3, 12); sp(bean, 0.025, C.white, sx * 0.15 + 0.02, 0.98, 0.36, 8); const ck = sp(bean, 0.06, C.rose, sx * 0.26, 0.8, 0.26, 10); ck.scale.set(1, 0.6, 0.4); }
    const sm = tor(bean, 0.1, 0.02, C.ink, 0, 0.8, 0.33, 12, PI); sm.rotation.z = PI;
    const spark = grp(g, 0, 2.0, 0), sk = GL(0xfde047, 1.6); for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; mk(spark, gget('oct', () => new T.OctahedronGeometry(0.08)), sk, Math.cos(a) * 0.85, Math.sin(i * 1.7) * 0.4, Math.sin(a) * 0.85); }
    g.userData.tick = (t) => { bean.rotation.y = 0.35 * Math.sin(t * 0.6); spark.rotation.y = t * 0.7; spark.children.forEach((s, i) => { s.rotation.y = t * 3 + i; s.scale.setScalar(0.7 + 0.4 * Math.abs(Math.sin(t * 2 + i))); }); };
    return { group: g };
  }, ['statue', 'gold', 'cocoa', 'award']);

  reg('cf1_timeline_wall', 'Our chocolate story timeline (wall)', () => {
    const g = new T.Group(); mk(g, gBox(6.2, 1.7, 0.06, 0.02), C.choc3, 0, 0, 0);
    pl(g, 6.0, 1.5, pic('timeline', 1536, 384, (c, W, H) => {
      c.fillStyle = '#fff7e6'; c.fillRect(0, 0, W, H); txt(c, 'OUR CHOCOLATE STORY', W / 2, 40, 44, '#5b21b6', 'center', 800);
      c.strokeStyle = '#7c3aed'; c.lineWidth = 12; c.beginPath(); c.moveTo(80, H * 0.52); c.lineTo(W - 80, H * 0.52); c.stroke();
      const ev = [['1970', 'First cocoa bean', '#7a4426'], ['1985', 'The factory opens', '#ec4899'], ['1999', 'Chocolate river', '#d97706'], ['2012', 'Candy Lab built', '#14b8a6'], ['2020', 'Zungga joins!', '#7c3aed'], ['TODAY', 'You are here!', '#facc15']];
      ev.forEach(([y, l, col], i) => { const x = 140 + i * (W - 280) / 5; circ(c, x, H * 0.52, 58, '#ffffff'); circ(c, x, H * 0.52, 50, col); txt(c, y, x, H * 0.52 + 2, y.length > 4 ? 26 : 32, '#ffffff', 'center', 800); txt(c, l, x, H * 0.84, 30, '#3b0764', 'center', 700, 230); });
    }), 0, 0, 0.035);
    return { group: g };
  }, ['timeline', 'history', 'wall', 'fame']);

  reg('cf1_award_frame', 'Framed award certificate (wall)', () => {
    const g = new T.Group(); mk(g, gBox(0.8, 1.0, 0.05, 0.015), GOLD, 0, 0, 0);
    pl(g, 0.66, 0.86, pic('cert', 264, 344, (c, W, H) => { c.fillStyle = '#fffbeb'; c.fillRect(0, 0, W, H); c.strokeStyle = '#7c3aed'; c.lineWidth = 8; c.strokeRect(12, 12, W - 24, H - 24); txt(c, 'CERTIFICATE', W / 2, 60, 30, '#5b21b6', 'center', 800); txt(c, 'of AWESOME', W / 2, 96, 24, '#db2777', 'center', 700); c.fillStyle = '#cbd5e1'; for (let i = 0; i < 4; i++) c.fillRect(44, 140 + i * 24, W - 88, 6); circ(c, W / 2, H - 80, 36, '#facc15'); c.fillStyle = '#ef4444'; c.fillRect(W / 2 - 26, H - 50, 16, 40); c.fillRect(W / 2 + 10, H - 50, 16, 40); circ(c, W / 2, H - 80, 22, '#f59e0b'); }), 0, 0, 0.027);
    return { group: g };
  }, ['award', 'certificate', 'wall']);

  /* ---------------- training ---------------- */
  reg('cf1_whiteboard', 'Whiteboard: how chocolate is made (wall)', () => {
    const g = new T.Group(); mk(g, gBox(3.2, 1.5, 0.06, 0.02), 0xcbd5e1, 0, 0, 0);
    pl(g, 3.05, 1.35, pic('wb', 1024, 452, (c, W, H) => {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); txt(c, 'HOW CHOCOLATE IS MADE', W / 2, 52, 54, '#7c3aed', 'center', 800);
      const st = [['BEAN', '#7a4426'], ['ROAST', '#ea580c'], ['GRIND', '#ca8a04'], ['MELT', '#db2777'], ['MOULD', '#0d9488']];
      st.forEach(([s, col], i) => { const x = 110 + i * 200; c.strokeStyle = col; c.lineWidth = 7; c.beginPath(); c.arc(x, 210, 70, 0, PI * 2); c.stroke(); txt(c, String(i + 1), x, 180, 44, col, 'center', 800); txt(c, s, x, 236, 34, col, 'center', 800); if (i < 4) { c.strokeStyle = '#64748b'; c.lineWidth = 6; c.beginPath(); c.moveTo(x + 80, 210); c.lineTo(x + 120, 210); c.lineTo(x + 108, 198); c.moveTo(x + 120, 210); c.lineTo(x + 108, 222); c.stroke(); } });
      txt(c, '= YUM!', W - 120, 360, 50, '#16a34a', 'center', 800); txt(c, 'Quiz on Friday :)', 200, 380, 38, '#ec4899', 'center', 700);
      c.strokeStyle = '#2563eb'; c.lineWidth = 5; c.beginPath(); c.arc(560, 375, 34, 0, PI * 2); c.stroke(); c.beginPath(); c.arc(560, 380, 20, 0.3, PI - 0.3); c.stroke(); circ(c, 548, 365, 4, '#2563eb'); circ(c, 572, 365, 4, '#2563eb');
    }), 0, 0, 0.032);
    mk(g, gBox(1.4, 0.05, 0.12, 0.01), 0xcbd5e1, 0, -0.78, 0.06); [C.red, C.blue, C.green].forEach((col, i) => { const m = mk(g, gCyl(0.018, 0.018, 0.14, 8), col, -0.3 + i * 0.2, -0.74, 0.08); m.rotation.z = HP; });
    return { group: g };
  }, ['whiteboard', 'training', 'school', 'wall']);

  reg('cf1_training_desk', 'Double training desk with laptops', () => {
    const g = new T.Group(); bx(g, 2.4, 0.06, 0.75, 0xd9a86c, 0, 0.72, -0.3, 0.02); for (const sx of [-1, 1]) bx(g, 0.06, 0.72, 0.7, C.purple, sx * 1.15, 0, -0.3, 0.02); bx(g, 2.3, 0.4, 0.03, C.purple, 0, 0.32, -0.64, 0.01);
    const sm = [scrM('graph'), scrM('bars')];
    [-0.6, 0.6].forEach((x, i) => { laptopOn(g, x, 0.78, -0.32, 0, sm[i]); bx(g, 0.16, 0.012, 0.22, [C.yellow, C.pink][i], x + 0.42, 0.78, -0.25, 0.004); cy(g, 0.008, 0.008, 0.16, C.blue, x - 0.4, 0.785, -0.2, 6).rotation.z = HP; chairInto(g, x, 0.45, PI, [C.teal, C.pink][i]); });
    return { group: g };
  }, ['desk', 'training', 'laptop', 'school']);

  reg('cf1_practice_machine', 'Practice wrapping machine', () => {
    const g = new T.Group(); bx(g, 1.1, 0.9, 0.7, C.yellow, 0, 0, 0, 0.08); bx(g, 1.15, 0.12, 0.75, C.purple, 0, 0.9, 0, 0.04);
    bx(g, 0.9, 0.05, 0.22, 0x1f2937, 0, 0.66, 0.36, 0.01); chocBar(g, -0.2, 0.71, 0.36, C.choc2); chocBar(g, 0.2, 0.71, 0.36, C.pink);
    const s = grp(g, 0, 1.02, -0.05); s.rotation.x = -0.3; bx(s, 0.56, 0.34, 0.05, C.ink, 0, 0, 0, 0.02); pl(s, 0.5, 0.28, scr('practice', 192, 108, (c, W, H) => { c.fillStyle = '#0f172a'; c.fillRect(0, 0, W, H); txt(c, 'PRACTICE', W / 2, 30, 28, '#facc15', 'center', 800); txt(c, 'MODE', W / 2, 60, 28, '#facc15', 'center', 800); circ(c, W / 2, 88, 10, '#22c55e'); }, 1), 0, 0.17, 0.027);
    for (const [x, c] of [[-0.38, C.red], [0.38, C.green]]) { cy(g, 0.09, 0.09, 0.05, C.ink, x, 1.02, 0.22, 14); cy(g, 0.075, 0.075, 0.06, GL(c, 0.7), x, 1.06, 0.22, 14); }
    const roll = mk(g, gCyl(0.08, 0.08, 0.7, 14), C.pink, 0, 0.55, -0.42); roll.rotation.z = HP;
    pl(g, 0.4, 0.2, labelM('tryme', 'TRY ME!', { bg: '#ec4899', fg: '#ffffff', radius: 30 }), 0, 0.4, 0.352);
    g.userData.tick = (t) => { roll.rotation.x = t * 2; };
    return { group: g };
  }, ['machine', 'training', 'practice']);

  const poster = (key, title, sub, bg, fg, icon, frame) => () => {
    const g = new T.Group(); mk(g, gBox(1.0, 1.4, 0.04, 0.015), frame, 0, 0, 0); pl(g, 0.9, 1.3, pic('poster_' + key, 360, 520, drawPoster(title, sub, bg, fg, icon)), 0, 0, 0.022); return { group: g };
  };
  reg('cf1_poster_wash', 'Poster: wash your hands', poster('wash', 'WASH HANDS!', 'bubbles = clean', '#38bdf8', '#ffffff', 'bubbles', C.white), ['poster', 'wall']);
  reg('cf1_poster_team', 'Poster: teamwork', poster('team', 'TEAMWORK', 'makes it yummy', '#7c3aed', '#ffffff', 'heart', C.yellow), ['poster', 'wall']);
  reg('cf1_poster_safety', 'Poster: hairnets on', poster('safety', 'SAFETY FIRST', 'hairnets on!', '#facc15', '#3b0764', 'cap', C.purple), ['poster', 'wall']);
  reg('cf1_poster_ideas', 'Poster: big ideas', poster('ideas', 'BIG IDEAS', 'start small', '#14b8a6', '#ffffff', 'bulb', C.purple), ['poster', 'wall']);
  reg('cf1_poster_health', 'Poster: drink water', poster('health', 'DRINK WATER', 'stretch & smile', '#86efac', '#14532d', 'drop', C.white), ['poster', 'wall']);
  reg('cf1_poster_taste', 'Poster: taste test', poster('taste', 'TASTE TEST', 'look · smell · yum', '#f9a8d4', '#5b21b6', 'choc', C.purple), ['poster', 'wall']);
  reg('cf1_poster_star', 'Poster: you are a star', poster('star', 'YOU ARE A STAR', 'keep shining', '#5b21b6', '#facc15', 'star', C.yellow), ['poster', 'wall']);

  /* ---------------- first aid ---------------- */
  reg('cf1_med_bed', 'First-aid bed', () => {
    const g = new T.Group(); for (const sx of [-1, 1]) for (const sz of [-1, 1]) sp(g, 0.05, C.ink, sx * 0.4, 0.05, sz * 0.88, 8);
    bx(g, 1.0, 0.36, 2.0, C.white, 0, 0.08, 0, 0.06); bx(g, 0.94, 0.18, 1.94, 0xe0f2fe, 0, 0.44, 0, 0.07);
    bx(g, 0.98, 0.07, 1.15, C.teal, 0, 0.6, 0.38, 0.03); bx(g, 0.98, 0.09, 0.2, C.mint, 0, 0.6, -0.22, 0.04); bx(g, 0.66, 0.14, 0.38, C.white, 0, 0.62, -0.7, 0.06);
    bx(g, 1.06, 0.95, 0.08, C.mint, 0, 0.08, -1.0, 0.04); bx(g, 1.06, 0.6, 0.06, C.mint, 0, 0.08, 1.0, 0.03);
    pl(g, 0.3, 0.3, pic('heart', 64, 64, (c, W, H) => { c.fillStyle = '#f43f5e'; c.beginPath(); c.moveTo(W / 2, H * 0.85); c.bezierCurveTo(0, H * 0.45, W * 0.2, 0, W / 2, H * 0.3); c.bezierCurveTo(W * 0.8, 0, W, H * 0.45, W / 2, H * 0.85); c.fill(); }, { transparent: true }), 0, 0.75, -0.955);
    return { group: g };
  }, ['bed', 'medical', 'first aid']);

  reg('cf1_privacy_curtain', 'Privacy curtain on a rail', () => {
    const g = new T.Group(); for (const sx of [-1, 1]) { cy(g, 0.03, 0.03, 2.3, C.white, sx * 1.2, 0, 0, 8); cy(g, 0.16, 0.18, 0.04, C.white, sx * 1.2, 0, 0, 12); }
    cy(g, 0.025, 0.025, 2.4, C.white, 0, 2.3, 0, 8).rotation.z = HP; const r = g.children[g.children.length - 1]; r.position.y = 2.3;
    for (let i = 0; i < 10; i++) bx(g, 0.25, 1.9, 0.04, i % 2 ? C.mint : 0xccfbf1, -1.08 + i * 0.24, 0.35, i % 2 ? 0.05 : -0.05);
    return { group: g };
  }, ['curtain', 'medical', 'first aid']);

  reg('cf1_med_cabinet', 'Medicine cabinet with green cross', () => {
    const g = new T.Group(); bx(g, 1.6, 2.0, 0.5, C.white, 0, 0, 0, 0.05);
    for (const y of [1.0, 1.45]) bx(g, 1.44, 0.03, 0.4, 0xe2e8f0, 0, y, 0);
    const bc = [C.red, C.blue, C.yellow, C.pink, C.green, C.orange, C.purple, C.teal];
    for (let i = 0; i < 8; i++) { const x = -0.55 + (i % 4) * 0.36, y = i < 4 ? 1.03 : 1.48; cy(g, 0.06, 0.06, 0.2, bc[i], x, y, 0, 10); cy(g, 0.065, 0.065, 0.05, C.white, x, y + 0.2, 0, 10); }
    for (const sx of [-1, 1]) { pl(g, 0.72, 0.95, GLASS, sx * 0.38, 1.4, 0.255); bx(g, 0.74, 0.8, 0.03, C.mint, sx * 0.38, 0.1, 0.255, 0.02); bx(g, 0.04, 0.18, 0.04, C.steel, sx * 0.08, 0.5, 0.28, 0.01); }
    const sign = grp(g, 0, 2.35, 0.05); const disc = mk(sign, gCyl(0.34, 0.34, 0.05, 28), C.white); disc.rotation.x = HP; mk(sign, gCross(0.5, 0.06), GL(0x22c55e, 0.8), 0, 0, 0.05);
    return { group: g };
  }, ['medicine', 'cabinet', 'first aid', 'cross']);

  reg('cf1_height_scale', 'Height & weight scale', () => {
    const g = new T.Group(); bx(g, 0.5, 0.08, 0.5, C.white, 0, 0, 0, 0.03); bx(g, 0.42, 0.02, 0.42, 0xe2e8f0, 0, 0.08, 0, 0.005);
    bx(g, 0.08, 2.0, 0.08, C.white, 0, 0.08, -0.22, 0.02);
    pl(g, 0.22, 1.7, pic('ruler', 64, 480, (c, W, H) => { c.fillStyle = '#fef08a'; c.fillRect(0, 0, W, H); for (let i = 0; i < 18; i++) { c.fillStyle = ['#7c3aed', '#ec4899', '#14b8a6'][i % 3]; c.fillRect(0, i * H / 18, i % 2 ? W * 0.5 : W * 0.8, 4); } c.fillStyle = '#f59e0b'; c.beginPath(); c.ellipse(W * 0.6, H * 0.12, 16, 22, 0, 0, PI * 2); c.fill(); }), 0, 1.15, -0.175);
    bx(g, 0.3, 0.03, 0.14, C.teal, 0, 1.75, -0.12, 0.01);
    pl(g, 0.18, 0.06, scr('kg', 96, 32, (c, W, H) => { c.fillStyle = '#052e16'; c.fillRect(0, 0, W, H); txt(c, '30 kg', W / 2, H / 2 + 1, 20, '#4ade80', 'center', 800); }, 1), 0, 0.04, 0.252);
    return { group: g };
  }, ['scale', 'height', 'medical']);

  reg('cf1_water_cooler', 'Water cooler', () => {
    const g = new T.Group(); bx(g, 0.42, 1.0, 0.42, C.white, 0, 0, 0, 0.05); cy(g, 0.17, 0.17, 0.42, PM(0x7dd3fc, { transparent: true, opacity: 0.55, roughness: 0.1, depthWrite: false }), 0, 1.0, 0, 16); cy(g, 0.09, 0.17, 0.08, PM(0x7dd3fc, { transparent: true, opacity: 0.55, depthWrite: false }), 0, 1.42, 0, 16);
    for (const [x, c] of [[-0.08, C.blue], [0.08, C.red]]) bx(g, 0.05, 0.06, 0.05, c, x, 0.7, 0.22, 0.01); bx(g, 0.3, 0.02, 0.14, C.steel, 0, 0.5, 0.2);
    cy(g, 0.035, 0.03, 0.08, C.white, 0.15, 1.0, 0.1, 8);
    return { group: g };
  }, ['water', 'cooler', 'office']);

  reg('cf1_firstaid_box', 'First-aid kit box (wall)', () => {
    const g = new T.Group(); mk(g, gBox(0.6, 0.45, 0.16, 0.04), C.white, 0, 0, 0); mk(g, gCross(0.26, 0.04), GL(0x22c55e, 0.7), 0, 0, 0.09); bx(g, 0.2, 0.04, 0.04, C.steel, 0, 0.22, 0.0, 0.01); return { group: g };
  }, ['first aid', 'kit', 'wall', 'medical']);

  reg('cf1_bean_bag', 'Squishy bean bag', () => {
    const g = new T.Group(); const b = sp(g, 0.5, C.yellow, 0, 0.3, 0, 18); b.scale.set(1.1, 0.62, 1.1); const t = sp(g, 0.32, C.yellow, 0, 0.55, -0.22, 14); t.scale.set(1.2, 0.8, 0.7); return { group: g };
  }, ['bean bag', 'seat', 'cosy']);

  /* ---------------- archive ---------------- */
  const filing = (col, front) => () => {
    const g = new T.Group(); bx(g, 0.6, 1.35, 0.7, col, 0, 0, 0, 0.03);
    for (let i = 0; i < 4; i++) { const pulled = i === 3 ? 0.28 : 0; bx(g, 0.52, 0.28, 0.03, front, 0, 0.06 + i * 0.32, 0.355 + pulled, 0.012); bx(g, 0.18, 0.03, 0.04, SILVER, 0, 0.12 + i * 0.32, 0.38 + pulled, 0.01); pl(g, 0.14, 0.06, PM(C.cream), 0, 0.26 + i * 0.32, 0.372 + pulled); }
    bx(g, 0.5, 0.26, 0.3, front, 0, 1.03, 0.22, 0.01); [C.yellow, C.pink, C.blue].forEach((c, i) => bx(g, 0.46, 0.3, 0.02, c, 0, 1.1, 0.12 + i * 0.07));
    return { group: g };
  };
  reg('cf1_filing_cabinet', 'Filing cabinet', filing(0xd6c7a1, 0xe7dcc0), ['filing', 'cabinet', 'archive', 'office']);
  reg('cf1_filing_cabinet_teal', 'Filing cabinet (teal)', filing(0x0f766e, C.teal), ['filing', 'cabinet', 'archive', 'office']);

  const drawBoxRow = (seed) => (c, W, H) => { const r = rng(seed); c.fillStyle = '#4b5563'; c.fillRect(0, 0, W, H); let x = 4; while (x < W - 30) { const w = 90 + r() * 50; c.fillStyle = r() < 0.2 ? '#e7dcc0' : '#c8a165'; rr(c, x, 6, w - 6, H - 8, 6); c.fill(); c.fillStyle = '#ffffff'; rr(c, x + w * 0.2, H * 0.25, w * 0.5, H * 0.32, 4); c.fill(); c.fillStyle = ['#7c3aed', '#ec4899', '#0d9488', '#ca8a04'][Math.floor(r() * 4)]; c.fillRect(x + w * 0.24, H * 0.33, w * 0.42, 6); c.fillRect(x + w * 0.24, H * 0.45, w * 0.3, 5); c.fillStyle = '#8a6a3a'; rr(c, x + w * 0.38, H * 0.72, w * 0.18, 10, 4); c.fill(); x += w; } };
  reg('cf1_archive_shelf', 'Archive shelving with boxes', () => {
    const g = new T.Group(), L = 3.6; for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.06, 2.4, 0.06, 0x64748b, sx * (L / 2 - 0.03), 0, sz * 0.27, 0.01);
    [0.1, 0.7, 1.3, 1.9].forEach((y, i) => { bx(g, L, 0.04, 0.6, C.steel, 0, y, 0, 0.005); bx(g, L - 0.14, 0.42, 0.5, pic('boxrow' + (i % 3), 1024, 128, drawBoxRow(21 + i * 5)), 0, y + 0.04, 0); });
    bx(g, L, 0.04, 0.6, C.steel, 0, 2.38, 0, 0.005); bx(g, 0.5, 0.25, 0.4, C.kraft, -0.9, 2.42, 0, 0.01); bx(g, 0.3, 0.06, 0.25, C.white, 0.7, 2.42, 0.05, 0.005);
    return { group: g };
  }, ['shelf', 'archive', 'boxes', 'storage']);

  reg('cf1_doc_cart', 'Document trolley', () => {
    const g = new T.Group(); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { cy(g, 0.02, 0.02, 0.9, C.steel, sx * 0.46, 0.08, sz * 0.26, 6); sp(g, 0.05, C.ink, sx * 0.46, 0.05, sz * 0.26, 8); }
    for (const y of [0.25, 0.85]) bx(g, 1.0, 0.04, 0.6, C.purple, 0, y, 0, 0.01); cy(g, 0.02, 0.02, 0.62, C.steel, 0.5, 1.0, 0, 6).rotation.x = HP; g.children[g.children.length - 1].position.set(0.5, 1.0, 0);
    [[-0.3, 0.3], [0.05, 0.18], [0.3, 0.24]].forEach(([x, h], i) => { bx(g, 0.28, h, 0.22, i === 1 ? 0xfef3c7 : C.white, x, 0.89, 0.05, 0.005); bx(g, 0.29, 0.015, 0.02, C.choc3, x, 0.89 + h * 0.5, 0.05); });
    [C.yellow, C.pink, C.teal, C.blue].forEach((c, i) => bx(g, 0.24, 0.32, 0.03, c, -0.3 + i * 0.07, 0.29, 0.0, 0.005).rotation.z = 0.1 * i);
    return { group: g };
  }, ['cart', 'documents', 'archive']);

  /* ---------------- balcony + hidden room ---------------- */
  reg('cf1_telescope', 'Coin-operated viewing telescope', () => {
    const g = new T.Group(); cy(g, 0.3, 0.35, 0.08, C.deep, 0, 0, 0, 18); cy(g, 0.07, 0.09, 1.0, C.purple, 0, 0.08, 0, 12);
    const h = grp(g, 0, 1.08, 0); bx(h, 0.26, 0.28, 0.2, C.yellow, 0, 0, 0, 0.04); pl(h, 0.06, 0.02, PM(C.ink), 0, 0.2, 0.102); pl(h, 0.2, 0.08, labelM('coin', '1 COIN', { bg: '#7c3aed', fg: '#ffffff', radius: 6, size: 70 }), 0, 0.09, 0.102);
    const tube = grp(h, 0, 0.4, 0); tube.rotation.x = 0.3; const tb = mk(tube, gCyl(0.1, 0.13, 0.8, 16), C.purple); tb.rotation.x = HP; const ln = mk(tube, gCyl(0.12, 0.12, 0.04, 16), GL(0x7dd3fc, 0.6), 0, 0, 0.42); ln.rotation.x = HP; const ep = mk(tube, gCyl(0.05, 0.06, 0.12, 12), C.ink, 0, 0, -0.45); ep.rotation.x = HP;
    for (const sx of [-1, 1]) bx(h, 0.04, 0.2, 0.08, C.yellow, sx * 0.15, 0.25, 0, 0.01);
    return { group: g };
  }, ['telescope', 'balcony', 'viewing']);

  const signProp = (key, draw) => () => {
    const g = new T.Group(); for (const sx of [-1, 1]) cy(g, 0.05, 0.06, 2.2, C.choc3, sx * 1.05, 0, 0, 10); mk(g, gBox(2.3, 1.2, 0.08, 0.05), C.deep, 0, 1.6, 0);
    const m = pic(key, 1024, 520, draw); pl(g, 2.15, 1.07, m, 0, 1.6, 0.045); pl(g, 2.15, 1.07, m, 0, 1.6, -0.045, PI); for (const sx of [-1, 1]) sp(g, 0.08, C.yellow, sx * 1.05, 2.25, 0, 10);
    return { group: g };
  };
  reg('cf1_info_sign', 'VISITOR OBSERVATION BALCONY sign', signProp('vob', (c, W, H) => { const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#7c3aed'); bg.addColorStop(1, '#4c1d95'); c.fillStyle = bg; c.fillRect(0, 0, W, H); txt(c, 'VISITOR', W / 2, 90, 92, '#ffd84a', 'center', 800); txt(c, 'OBSERVATION BALCONY', W / 2, 200, 84, '#ffd84a', 'center', 800, W * 0.92); txt(c, 'Look down at the Main Plaza!', W / 2, 310, 52, '#ffffff', 'center', 700, W * 0.9); for (let i = 0; i < 3; i++) { const x = W / 2 - 160 + i * 160; c.fillStyle = '#5eead4'; c.beginPath(); c.moveTo(x - 36, 380); c.lineTo(x + 36, 380); c.lineTo(x, 450); c.fill(); } }), ['sign', 'balcony', 'info']);
  reg('cf1_info_sign_glass', 'Glass floor info sign', signProp('glasssign', (c, W, H) => { c.fillStyle = '#0f766e'; c.fillRect(0, 0, W, H); txt(c, 'GLASS FLOOR', W / 2, 110, 110, '#ffffff', 'center', 800); txt(c, 'Super strong · safe to walk!', W / 2, 240, 58, '#ccfbf1', 'center', 700, W * 0.9); txt(c, 'Wave to the workers below', W / 2, 330, 52, '#ffd84a', 'center', 700, W * 0.9); circ(c, W / 2, 430, 50, '#ffd84a'); c.strokeStyle = '#0f766e'; c.lineWidth = 10; c.beginPath(); c.arc(W / 2, 438, 26, 0.2, PI - 0.2); c.stroke(); circ(c, W / 2 - 18, 418, 7, '#0f766e'); circ(c, W / 2 + 18, 418, 7, '#0f766e'); }), ['sign', 'balcony', 'glass']);

  reg('cf1_balcony_bench', 'Purple balcony bench', () => {
    const g = new T.Group(); for (const sx of [-1, 1]) bx(g, 0.12, 0.45, 0.5, C.deep, sx * 0.8, 0, 0, 0.03);
    bx(g, 1.9, 0.1, 0.55, C.yellow, 0, 0.45, 0, 0.04); bx(g, 1.9, 0.42, 0.08, C.purple, 0, 0.6, -0.25, 0.04); bx(g, 0.5, 0.08, 0.04, C.pink, 0, 0.78, -0.2, 0.02);
    return { group: g };
  }, ['bench', 'balcony', 'seat']);

  reg('cf1_cobweb', 'Dusty cobweb', () => {
    const g = new T.Group(), m = pic('web', 256, 256, (c, W, H) => { c.clearRect(0, 0, W, H); c.strokeStyle = 'rgba(240,240,240,.85)'; c.lineWidth = 2; for (let i = 0; i <= 6; i++) { const a = i / 6 * HP; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * W, Math.sin(a) * H); c.stroke(); } for (let r = 30; r < W; r += 34) { c.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * HP, q = r * (i % 2 ? 0.9 : 1); if (i) c.lineTo(Math.cos(a) * q, Math.sin(a) * q); else c.moveTo(Math.cos(a) * q, Math.sin(a) * q); } c.stroke(); } }, { transparent: true, side: T.DoubleSide, depthWrite: false, roughness: 1 });
    pl(g, 1.0, 1.0, m, 0, 0, 0); return { group: g };
  }, ['cobweb', 'dusty', 'old']);

  reg('cf1_old_lantern', 'Old flickering lantern', () => {
    const g = new T.Group(), dark = MET(0x3f3f46); bx(g, 0.24, 0.04, 0.24, dark, 0, 0, 0, 0.01); for (const sx of [-1, 1]) for (const sz of [-1, 1]) cy(g, 0.012, 0.012, 0.3, dark, sx * 0.1, 0.04, sz * 0.1, 6);
    cy(g, 0.1, 0.1, 0.28, PM(0xfde68a, { transparent: true, opacity: 0.35, emissive: 0xf59e0b, emissiveIntensity: 0.6, depthWrite: false }), 0, 0.05, 0, 12);
    const fm = own(0xffd27a, { emissive: 0xffa53a, emissiveIntensity: 1.6 }), fl = sp(g, 0.05, fm, 0, 0.18, 0, 10); fl.scale.set(1, 1.6, 1);
    cy(g, 0.0, 0.16, 0.12, dark, 0, 0.34, 0, 12); tor(g, 0.06, 0.012, dark, 0, 0.5, 0, 10);
    g.userData.tick = (t) => { const f = 1.3 + 0.4 * Math.sin(t * 13) + 0.2 * Math.sin(t * 29); fm.emissiveIntensity = f; fl.scale.set(1, 1.4 + 0.3 * Math.sin(t * 17), 1); };
    return { group: g };
  }, ['lantern', 'old', 'light']);

  reg('cf1_dusty_crate', 'Dusty old crate', () => {
    const g = new T.Group(); bx(g, 0.8, 0.7, 0.8, 0x8b6b4a, 0, 0, 0, 0.02); for (const y of [0.08, 0.52]) bx(g, 0.82, 0.08, 0.82, 0x6b4f35, 0, y, 0, 0.01);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.08, 0.7, 0.08, 0x6b4f35, sx * 0.37, 0, sz * 0.37, 0.01);
    bx(g, 0.76, 0.012, 0.76, PM(0xc7bfae, { roughness: 1 }), 0, 0.7, 0); return { group: g };
  }, ['crate', 'box', 'old', 'dusty']);

  reg('cf1_old_map', 'Old treasure-style map (wall)', () => {
    const g = new T.Group(); pl(g, 1.0, 0.75, pic('oldmap', 400, 300, (c, W, H) => { c.fillStyle = '#e9d5a1'; c.beginPath(); c.moveTo(8, 12); for (let x = 8; x < W; x += 40) c.lineTo(x + 20, 4 + (x % 3) * 4); c.lineTo(W - 6, 14); c.lineTo(W - 12, H - 10); for (let x = W - 12; x > 8; x -= 40) c.lineTo(x - 20, H - 4 - (x % 3) * 4); c.closePath(); c.fill(); c.strokeStyle = '#8a5a3a'; c.lineWidth = 4; c.setLineDash([10, 8]); c.beginPath(); c.moveTo(60, 230); c.bezierCurveTo(120, 120, 220, 250, 300, 110); c.stroke(); c.setLineDash([]); c.strokeStyle = '#b91c1c'; c.lineWidth = 9; c.beginPath(); c.moveTo(285, 95); c.lineTo(315, 125); c.moveTo(315, 95); c.lineTo(285, 125); c.stroke(); c.strokeStyle = '#5b3420'; c.lineWidth = 3; c.beginPath(); for (let i = 0; i < 30; i++) { const a = i * 0.5, r = 4 + i * 0.9; c.lineTo(80 + Math.cos(a) * r, 80 + Math.sin(a) * r); } c.stroke(); txt(c, 'DOWN...', 80, 140, 26, '#5b3420', 'center', 800); txt(c, '?', 340, 220, 48, '#5b3420', 'center', 800); }, { transparent: true }), 0, 0, 0.01);
    for (const [x, y] of [[-0.45, 0.32], [0.45, 0.32]]) sp(g, 0.025, MET(0x52525b), x, y, 0.02, 6);
    return { group: g };
  }, ['map', 'old', 'wall', 'treasure']);

  /* =====================================================================================================
   * room helpers
   * ===================================================================================================== */
  const WALL_IN = 0.255;   // inner wall face = half size − 0.255
  function wallPos(spec, side, along, inset) {
    const hw = spec.w / 2 - WALL_IN - inset, hd = spec.d / 2 - WALL_IN - inset;
    return side === 'n' ? [along, -hd, 0] : side === 's' ? [along, hd, PI] : side === 'w' ? [-hw, along, HP] : [hw, along, -HP];
  }
  const kit = (c, spec) => ({
    P: (id, x, z, ry = 0, s = 1, o) => c.prop(id, x, 0, z, ry, s, o),
    PY: (id, x, y, z, ry = 0, s = 1) => c.prop(id, x, y, z, ry, s, { col: false }),
    wall: (id, side, along, y, s = 1, inset = 0.05) => { const [x, z, ry] = wallPos(spec, side, along, inset); return c.prop(id, x, y, z, ry, s, { col: false }); },
    back: (id, side, along, depth, s = 1, o) => { const [x, z, ry] = wallPos(spec, side, along, depth / 2 + 0.04); return c.prop(id, x, 0, z, ry, s, o); },
    rug: (w, d, x, z, col, border, ry = 0) => { c.box(w + 0.3, 0.012, d + 0.3, x, 0.004, z, border, { col: false, cast: false, ry }); c.box(w, 0.02, d, x, 0.006, z, col, { col: false, cast: false, ry }); },
  });
  const rugPattern = (key, base, dot) => pic('rug_' + key, 256, 256, (g, W, H) => { g.fillStyle = base; g.fillRect(0, 0, W, H); g.fillStyle = dot; for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) { const x = i * 64 + 32, y = k * 64 + 32; g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x + 16, y); g.lineTo(x, y + 16); g.lineTo(x - 16, y); g.fill(); } g.strokeStyle = dot; g.lineWidth = 8; g.strokeRect(6, 6, W - 12, H - 12); });

  /* =====================================================================================================
   * ROOMS
   * ===================================================================================================== */
  // 1 · Mr. Choco's Executive Office (22 × 16; doors s 0, w +4, e +4)
  D.executive_office = (c, spec) => {
    const { P, PY, wall, rug } = kit(c, spec);
    rug(10, 6.6, 0, -3.9, rugPattern('purple', '#7c3aed', '#facc15'), C.gold);
    P('cf1_exec_desk', 0, -4.4); P('cf1_throne_chair', 0, -6.05);
    wall('cf1_portrait_choco', 'n', 0, 2.6);
    P('cf1_window_seat', -8.25, -7.05);
    P('cf1_trophy_shelf', 5.5, -7.42);
    P('cf1_round_table', -6.5, -2.8); for (const [dx, dz, r] of [[0, -1.55, 0], [0, 1.55, PI], [-1.55, 0, HP], [1.55, 0, -HP]]) P('cf1_chair', -6.5 + dx, -2.8 + dz, r);
    P('cf1_choc_fountain', 5.6, -3.0);
    P('cf1_armchair_pink', 9.65, -5.3, -HP); P('cf1_armchair_pink', 9.65, -1.4, -HP);
    c.cyl(0.36, 0.3, 0.62, 9.85, 0, -3.35, C.choc2, { seg: 18 }); c.cyl(0.4, 0.4, 0.05, 9.85, 0.62, -3.35, GOLD, { seg: 18, col: false }); PY('candy_jars', 9.85, 0.67, -3.35, -HP, 1.3);
    wall('cf1_portrait_founder', 'w', -2.6, 2.5); wall('cf1_portrait_factory', 'e', -3.3, 2.7);
    // south strip
    P('cf1_sofa', -6.0, 7.05, PI); wall('zungga_logo', 's', -6.0, 2.4, 3.2);
    c.box(3.0, 0.9, 0.6, 6.0, 0, 7.3, C.choc, { r: 0.05 }); c.box(3.06, 0.05, 0.66, 6.0, 0.9, 7.3, GOLD, { col: false });
    PY('globe', 5.0, 0.95, 7.3, PI, 1.8); PY('zungga_trophy', 6.1, 0.95, 7.3, PI, 1.8); PY('candy_jars', 7.1, 0.95, 7.3, PI, 1.4);
    P('zungga_banner', -2.1, 7.35, PI); P('zungga_banner', 2.1, 7.35, PI);
    P('plant_pot', -10.1, 7.1, 0, 1.2); P('plant_pot', 10.1, 7.1, 0, 1.2); P('plant_pot', -10.1, -7.1, 0, 1.2); P('plant_pot', 10.15, -7.1, 0, 1.2);
    wall('wall_clock', 'e', 6.4, 3.0, 2.4);
  };

  // 2 · Factory Control Room (26 × 14; doors s 0, w +3)
  D.control_room_f1 = (c, spec) => {
    const { P, wall, back } = kit(c, spec);
    wall('cf1_wall_screen', 'n', 0, 2.75, 1, 0.12);
    const R = 5.6, cz = 1.5;
    for (const deg of [-40, -20, 0, 20, 40]) { const a = deg * PI / 180; P('cf1_control_console', R * Math.sin(a), cz - R * Math.cos(a), -a); }
    for (const deg of [-30, -10, 10, 30]) { const a = deg * PI / 180; P('cf1_operator_chair', 4.4 * Math.sin(a), cz - 4.4 * Math.cos(a), PI - a); }
    // glowing floor arc in front of the desks
    { const ring = new THREE.Mesh(new THREE.RingGeometry(3.3, 3.45, 48, 1, PI * 0.25, PI * 0.5), GL(C.teal, 1.2)); ring.rotation.x = -HP; ring.position.set(0, 0.02, cz); c.g.add(ring); }
    back('cf1_lever_panel', 'e', -2.33, 0.6); back('cf1_lever_panel', 'e', 2.33, 0.6);
    P('cf1_status_tower', 12.1, -6.1); P('cf1_status_tower', -12.1, 6.1);
    // west bank: a monitor wall with two consoles
    back('cf1_monitor_wall_b', 'w', -3.6, 0.5); P('cf1_control_console', -10.15, -4.65, HP); P('cf1_control_console', -10.15, -2.55, HP);
    P('cf1_operator_chair', -8.85, -4.65, -HP); P('cf1_operator_chair', -8.85, -2.55, -HP);
    // south side
    P('cf1_map_board', 6.8, 5.6, PI); P('cf1_water_cooler', 12.15, 5.6, -HP); P('plant_pot', 2.3, 6.1, 0, 1.2); P('plant_pot', 11.9, -6.1 + 12.2, 0, 1.0);
    P('cf1_sofa', -6.5, 6.15, PI); P('plant_pot', -2.3, 6.15, 0, 1.2); P('plant_pot', -12.1, 4.7, 0, 1.1);
    wall('wall_clock', 's', -9.6, 3.2, 2.4); wall('cf1_poster_safety', 's', 9.8, 2.3);
  };

  // 3 · Recipe Research Library (26 × 14; doors s 0, e +3; hidden room in the north-west corner)
  D.recipe_library = (c, spec) => {
    const { P, back, rug } = kit(c, spec), H = spec.hidden || { x0: -13, x1: -7, z0: -7, z1: 0, shelf: { x: -7, z: -3.3 } };
    rug(9, 5.2, 2.2, -0.3, rugPattern('red', '#b91c1c', '#facc15'), C.gold);
    // north wall: tall shelves between the windows, low shelves under them
    for (const [x, k] of [[-2.6, 0], [2.6, 1], [7.8, 0]]) back(k ? 'cf1_bookshelf_b' : 'cf1_bookshelf', 'n', x, 0.48);
    for (const x of [-5.25, 0, 5.2, 10.4]) back('cf1_bookshelf_low', 'n', x, 0.45);
    back('cf1_bookshelf_narrow', 'n', 12.0, 0.4, 0.9);
    // east wall (door at z = +3)
    back('cf1_bookshelf_b', 'e', -5.0, 0.48); back('cf1_bookshelf', 'e', -2.45, 0.48); back('cf1_bookshelf_narrow', 'e', 0.15, 0.4); back('cf1_bookshelf_narrow', 'e', 5.6, 0.4);
    // south wall (door at x = 0)
    for (const [x, k] of [[-3.0, 0], [-5.6, 1], [-8.2, 0], [3.0, 1], [5.6, 0], [8.2, 1]]) back(k ? 'cf1_bookshelf_b' : 'cf1_bookshelf', 's', x, 0.48);
    // west wall south of the hidden room
    back('cf1_bookshelf', 'w', 2.35, 0.48); back('cf1_bookshelf_low', 'w', 4.67, 0.45);
    // shelves on the hidden room's own walls (the secret one hides among them)
    const hx = H.x1 + 0.125;   // east face of the hidden room's east wall
    for (const z of [H.z0 + 1.4, H.z1 - 1.05]) c.prop('cf1_bookshelf_narrow', hx + 0.24, 0, z, HP, 1);
    c.prop('cf1_bookshelf', (H.x0 + H.x1) / 2 - 0.6, 0, H.z1 + 0.125 + 0.28, 0, 1); c.prop('cf1_bookshelf_narrow', H.x1 - 1.0, 0, H.z1 + 0.125 + 0.24, 0, 1);
    // reading + study
    P('cf1_reading_table', 6.0, -2.6); for (const x of [5.2, 6.8]) { P('cf1_chair', x, -3.85, 0); P('cf1_chair', x, -1.35, PI); }
    P('cf1_big_globe', 10.0, -2.1);
    P('cf1_rolling_ladder', 7.8, -5.84);
    P('cf1_drafting_table', -2.7, -0.9, 0.2); P('cf1_scroll_basket', -3.9, -5.6);
    P('cf1_reading_table', -7.0, 3.5); for (const x of [-7.8, -6.2]) P('cf1_chair', x, 2.45, 0);
    P('cf1_armchair_teal', -10.9, 5.3, HP);
    P('cf1_archive_boxes', 4.0, 5.65, PI); P('cf1_scroll_basket', 7.6, 5.7); P('cf1_archive_boxes', 10.4, 5.65, PI, 0.9);
    P('plant_pot', 12.1, 4.5 - 0.3, 0, 1.0);
  };

  // 4 · Innovation Lab (16 × 14; doors n, s, e at 0)
  D.innovation_lab = (c, spec) => {
    const { P, wall, back, rug } = kit(c, spec);
    for (const x of [-6.2, -3.7]) { P('cf1_tesla_coil', x, -5.0); c.box(1.5, 0.015, 1.5, x, 0.004, -5.0, PM(C.yellow), { col: false, cast: false }); }
    P('cf1_invention_machine', 4.6, -4.5);
    P('cf1_holo_table', -5.2, 0.3);
    back('cf1_flask_bench', 'w', 4.5, 0.86); back('cf1_flask_bench', 's', -3.9, 0.86);
    c.cyl(0.2, 0.22, 0.62, -5.8, 0, 3.3, C.purple, { col: false }); c.cyl(0.24, 0.24, 0.08, -5.8, 0.62, 3.3, C.yellow, { col: false });
    P('cf1_friendly_robot', 3.4, 3.3, -2.36); c.cyl(0.7, 0.7, 0.03, 3.4, 0, 3.3, GL(C.teal, 0.6), { col: false, seg: 28 });
    P('cf1_bubble_tank', 6.3, 5.2); P('cf1_scroll_basket', 6.7, 2.4);
    wall('cf1_whiteboard', 's', 3.3, 1.75, 0.85);
    wall('cf1_poster_ideas', 'n', -2.4, 2.6); wall('cf1_poster_star', 'n', 2.4, 2.6); wall('cf1_poster_safety', 'e', -4.3, 2.7);
    rug(3.4, 3.4, -5.2, 0.3, PM(0x312e81), C.teal);
    P('plant_pot', 7.1, -1.9, 0, 1.0);
  };

  // 5 · Quality Testing Lab (18.5 × 14; doors on all four sides at 0)
  D.quality_lab = (c, spec) => {
    const { P, wall, back } = kit(c, spec);
    P('cf1_tasting_table', -5.0, -3.8); for (const x of [-5.8, -4.2]) { c.cyl(0.2, 0.22, 0.6, x, 0, -2.6, C.pink, { seg: 14 }); c.cyl(0.24, 0.24, 0.07, x, 0.6, -2.6, C.rose, { col: false, seg: 14 }); }
    back('cf1_microscope_bench', 'n', 5.0, 0.86); P('cf1_scale_table', 5.2, -3.0);
    P('cf1_mini_conveyor', -5.6, 4.4);
    P('cf1_tasting_table', 5.0, 3.0, PI); for (const x of [4.2, 5.8]) { c.cyl(0.2, 0.22, 0.6, x, 0, 1.85, C.teal, { seg: 14 }); c.cyl(0.24, 0.24, 0.07, x, 0.6, 1.85, C.mint, { col: false, seg: 14 }); }
    back('cf1_sample_rack', 's', 5.0, 0.5); back('fridge', 'e', 5.4, 0.7, 1.4); back('fridge', 'w', -5.6, 0.7, 1.4);
    back('cf1_sample_rack', 'n', -5.0, 0.5);
    wall('cf1_poster_taste', 'n', -2.4, 2.6); wall('cf1_poster_wash', 's', -2.4, 2.4); wall('cf1_poster_safety', 's', 2.4, 2.4);
    P('plant_pot', -8.3, -6.1, 0, 1.0); P('plant_pot', 8.35, -6.1 + 12.2, 0, 1.0);
    c.box(18.5 - 0.6, 0.012, 0.25, 0, 0.005, -1.45, PM(C.teal), { col: false, cast: false }); c.box(18.5 - 0.6, 0.012, 0.25, 0, 0.005, 1.45, PM(C.teal), { col: false, cast: false });
  };

  // 6 · Staff Meeting Hall (18 × 14; doors on all four sides at 0) — stage along the north wall (low enough to step onto)
  D.meeting_hall = (c, spec) => {
    const { wall } = kit(c, spec), hd = spec.d / 2 - WALL_IN, sw = spec.w - 0.8;
    c.box(sw, 0.24, 2.2, 0, 0, -hd + 1.15, C.choc3, { r: 0.03 }); c.box(sw, 0.2, 0.05, 0, 0.02, -hd + 2.27, C.purple, { col: false }); c.box(sw, 0.04, 0.06, 0, 0.2, -hd + 2.28, GOLD, { col: false });
    wall('cf1_stage_screen', 'n', -5.0, 2.75, 1, 0.1); wall('cf1_stage_screen', 'n', 5.0, 2.75, 1, 0.1);
    c.prop('cf1_podium', -2.7, 0.24, -hd + 1.2, 0, 1); c.prop('zungga_banner', -1.85, 0.24, -hd + 0.4, 0, 1); c.prop('zungga_banner', 1.85, 0.24, -hd + 0.4, 0, 1);
    c.prop('plant_pot', -8.1, 0.24, -hd + 0.6, 0, 1.1); c.prop('plant_pot', 8.1, 0.24, -hd + 0.6, 0, 1.1);
    // chair rows face the stage; an aisle along x = 0 and z = 0 links all four doors
    for (const z of [-2.65, 2.2, 4.2, 6.15]) for (const sx of [-1, 1]) { for (let i = 0; i < 6; i++) c.prop('cf1_chair', sx * (2.3 + i * 1.0), 0, z, PI, 1, { col: false }); c.col(5.6, 0.95, 0.5, sx * 4.8, 0, z); }
    wall('cf1_poster_team', 'w', -4.2, 2.3); wall('cf1_poster_star', 'e', -4.2, 2.3); wall('wall_clock', 's', 4.0, 3.2, 2.4); wall('zungga_logo', 's', -4.0, 2.6, 2.6);
  };

  // 7 · Security Operations Center (16.5 × 14; doors n, s, w at 0)
  D.security_center = (c, spec) => {
    const { P, wall, back } = kit(c, spec);
    back('cf1_monitor_wall', 'n', -4.65, 0.5); back('cf1_monitor_wall_b', 'n', 4.65, 0.5);
    for (const sx of [-1, 1]) for (const x of [3.55, 5.65]) { P('cf1_control_console', sx * x, -4.2, 0); P('cf1_operator_chair', sx * x, -2.9, PI); }
    P('cf1_map_board', 6.55, 0, -HP);
    back('cf1_lockers', 's', 5.0, 0.55); P('cf1_balcony_bench', 5.0, 4.35, PI);
    wall('cf1_key_cabinet', 'e', 2.35, 1.6, 1, 0.1);
    P('desk', -5.0, 3.4, PI, 1.4); c.prop('laptop', -5.0, 1.08, 3.35, 0, 1.8, { col: false }); P('cf1_operator_chair', -5.0, 4.6, PI);
    P('cf1_water_cooler', -7.4, 6.15, PI); P('plant_pot', -2.3, 6.15, 0, 1.1); P('plant_pot', -7.5, -6.1, 0, 1.0);
    wall('cf1_poster_safety', 'w', -3.6, 2.4); wall('wall_clock', 'w', 3.6, 3.0, 2.4);
    c.box(3.0, 0.012, 3.0, -4.9, 0.005, 3.8, PM(0x334e7a), { col: false, cast: false });
  };

  // 9 · Hall of Fame (16 × 12; doors n, e at 0)
  D.hall_of_fame = (c, spec) => {
    const { P, wall } = kit(c, spec);
    c.box(2.2, 0.02, 8.9, 0, 0.006, -1.45, C.red, { col: false, cast: false }); c.box(2.5, 0.012, 9.1, 0, 0.004, -1.4, GOLD, { col: false, cast: false });
    c.box(7.7, 0.02, 2.2, 3.85, 0.006, 0, C.red, { col: false, cast: false }); c.box(7.7, 0.012, 2.5, 3.85, 0.004, 0, GOLD, { col: false, cast: false });
    P('cf1_cocoa_statue', 0, 3.6, PI);
    for (const [x, z] of [[-1.6, 2.2], [1.6, 2.2]]) { c.cyl(0.05, 0.06, 0.95, x, 0, z, GOLD, { col: false, seg: 10 }); c.cyl(0.0, 0.0, 0, x, 0, z, GOLD, { col: false }); }
    { const rope = c.box(3.2, 0.06, 0.06, 0, 0.8, 2.2, C.red, { col: false }); void rope; }
    const peds = ['cf1_pedestal_cup', 'cf1_pedestal_star', 'cf1_pedestal_bar', 'cf1_pedestal_medal'];
    [[-6.0, -3.0, 0], [-3.4, -3.0, 1], [3.4, -3.0, 2], [6.0, -3.0, 3], [-6.0, 2.6, 2], [-3.4, 2.6, 3], [3.4, 2.6, 0], [6.0, 2.6, 1]].forEach(([x, z, k]) => P(peds[k], x, z, z < 0 ? 0 : PI));
    wall('cf1_timeline_wall', 'n', -4.55, 2.6, 0.95); wall('cf1_timeline_wall', 'n', 4.55, 2.6, 0.95);
    for (const z of [-4.0, -2.4, 2.4, 4.0]) wall('cf1_award_frame', 'e', z, 1.9);
    wall('cf1_portrait_founder', 'w', 0, 2.3); wall('cf1_award_frame', 's', -2.67, 2.1); wall('cf1_award_frame', 's', 2.67, 2.1);
    P('plant_pot', -7.1, -5.1, 0, 1.1); P('plant_pot', 7.1, 5.1, 0, 1.1);
  };

  // 10 · Employee Training Room (18 × 12; doors n, w, e at 0)
  D.training_room = (c, spec) => {
    const { P, wall, back } = kit(c, spec);
    wall('cf1_whiteboard', 'n', -4.6, 1.75); wall('cf1_whiteboard', 'n', 4.6, 1.75);
    for (const sx of [-1, 1]) for (const x of [3.65, 6.05]) { P('cf1_training_desk', sx * x, -2.75); P('cf1_training_desk', sx * x, 2.55); }
    back('cf1_practice_machine', 's', -4.5, 0.75); back('cf1_practice_machine', 's', 4.5, 0.75);
    P('cf1_water_cooler', 8.15, 5.2, PI); P('plant_pot', -8.1, 5.15, 0, 1.1); P('plant_pot', -8.1, -5.1, 0, 1.0); P('plant_pot', 8.1, -5.1, 0, 1.0);
    wall('cf1_poster_safety', 'w', -3.4, 2.3); wall('cf1_poster_team', 'w', 3.4, 2.3); wall('cf1_poster_wash', 'e', -3.4, 2.3); wall('cf1_poster_ideas', 'e', 3.4, 2.3);
    wall('wall_clock', 's', 0, 3.4, 2.4);
  };

  // 11 · First Aid & Wellness Room (18 × 12; doors n, w, e at 0)
  D.first_aid = (c, spec) => {
    const { P, wall, back, rug } = kit(c, spec), bz = -spec.d / 2 + WALL_IN + 1.1;
    for (const x of [-6.6, -3.2, 3.2, 6.6]) P('cf1_med_bed', x, bz);
    for (const x of [-4.9, -2.15, 2.15, 4.9]) c.prop('cf1_privacy_curtain', x, 0, bz + 0.1, HP, Math.abs(x) < 3 ? 0.6 : 0.85, { col: false });   // the inner two stay clear of the north door
    back('cf1_med_cabinet', 's', 4.5, 0.5); P('cf1_height_scale', 8.1, 5.15, PI);
    P('desk', 6.0, 2.5, PI); c.prop('laptop', 6.0, 0.77, 2.5, PI, 1.6, { col: false }); P('cf1_chair', 6.0, 3.45, PI);
    P('cf1_water_cooler', 8.3, 3.3, -HP);
    // wellness corner
    rug(5.2, 3.4, -5.3, 3.7, PM(0xa7f3d0), C.teal);
    for (const [x, col] of [[-6.6, C.purple], [-5.3, C.pink], [-4.0, C.yellow]]) c.box(0.7, 0.03, 1.8, x, 0.03, 3.6, col, { col: false, r: 0.012 });
    c.cyl(0.12, 0.12, 0.7, -2.7, 0, 5.2, C.teal, { col: false }).rotation.z = HP;
    P('cf1_bean_bag', -2.4, 3.2); P('plant_pot', -8.1, 5.1, 0, 1.2); P('plant_pot', -8.1, 1.9, 0, 1.1); P('plant_pot', -1.9, 5.15, 0, 1.0);
    wall('cf1_poster_health', 'w', 3.4, 2.3); wall('cf1_poster_wash', 'e', -3.4, 2.4); wall('cf1_firstaid_box', 'e', 1.9 + 0.2, 1.9); wall('cf1_firstaid_box', 'w', -2.0, 1.9);
  };

  // 12 · Archive Room (16 × 12; doors n, w at 0)
  D.archive_room = (c, spec) => {
    const { P, back } = kit(c, spec);
    for (const x of [2.8, 5.1]) for (const z of [-3.6, 3.6]) P('cf1_archive_shelf', x, z, HP);
    for (const z of [-5.1, -4.45, -3.8, 3.8, 4.45, 5.1]) back(z > 0 ? 'cf1_filing_cabinet_teal' : 'cf1_filing_cabinet', 'e', z, 0.7);
    P('cf1_rolling_ladder', 2.12, -3.6, -HP);
    P('cf1_reading_table', 6.6, 0, HP, 0.6);
    back('cf1_archive_shelf', 'n', -4.6, 0.6); P('cf1_reading_table', -4.6, -3.0, 0, 0.8); P('cf1_chair', -4.6, -2.1, PI);
    for (const x of [-7.0, -6.35, -5.7, -5.05]) back('cf1_filing_cabinet', 's', x, 0.7);
    P('cf1_archive_boxes', -2.8, 5.0, PI); P('cf1_doc_cart', -4.6, 2.6);
    for (const [x, z, h] of [[-2.4, 3.0, 0.3], [-2.1, 3.3, 0.18], [-6.9, 2.0, 0.24]]) { c.box(0.32, h, 0.24, x, 0, z, C.white, { col: false }); c.box(0.33, 0.015, 0.03, x, h / 2, z, C.choc3, { col: false }); }
    P('plant_pot', -7.1, -1.9, 0, 1.0);
  };

  // 8 · Visitor Observation Balcony — extras only on the walkway strips around the glass
  D.observation_balcony = (c, spec) => {
    const P = (id, x, z, ry = 0, s = 1, o) => c.prop(id, x, 0, z, ry, s, o);
    const zn = -spec.d / 2, zs = spec.d / 2;
    // north strip: benches + plants against the wall, telescopes + lamps by the railing, walkway in between
    for (const x of [-20.5, -7.0, 7.0, 20.5]) P('cf1_balcony_bench', x, zn + 0.42, 0);
    for (const x of [-24.5, -15.2, -4.6, 4.6, 15.2, 24.5]) P('plant_pot', x, zn + 0.42, 0, 1.0);
    for (const x of [-23.0, -16.6, -7.6, 7.6, 16.6, 23.0]) P('cf1_telescope', x, -3.55, 0);
    for (const x of [-19.8, -13.2, 13.2, 19.8]) P('island_lamp_post', x, -3.45, 0, 0.9);
    P('cf1_info_sign', -5.0, -3.75, 0); P('cf1_info_sign_glass', 5.0, -3.75, 0);
    // south strip: slim plants by the wall + wall signs
    for (const x of [-24.0, -18.0, -6.5, 6.5, 18.0, 24.0]) P('plant_pot', x, zs - 0.3, 0, 0.7);
    for (const [x, t] of [[-8.6, 'LOOK DOWN! MAIN PLAZA BELOW'], [8.6, 'WAVE HELLO TO THE WORKERS!'], [-21.0, 'NO RUNNING ON THE BALCONY'], [21.0, 'ENJOY THE VIEW!']]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.6), labelM('bal' + x, t, { w: 1024, h: 170, bg: '#5b21b6', fg: '#ffd84a', size: 70, border: '#facc15' })); m.position.set(x, 2.1, zs - 0.03); m.rotation.y = PI; c.g.add(m);
    }
    // the two ends beside the towers
    for (const s of [-1, 1]) {
      P('cf1_balcony_bench', s * 28.1, 1.6, -s * HP); P('cf1_info_sign', s * 30.0, 3.1, -s * HP, 0.9);
      P('cf1_telescope', s * 26.8, -0.9, -s * HP); P('island_lamp_post', s * 27.1, 3.9, 0, 0.9); P('plant_pot', s * 30.9, 1.0, 0, 1.0);
    }
  };

  // 13 · Hidden Access room (6 × 7) — only small dusty things in the corners; the spiral stairs + shelf stay clear
  D.hidden_access = (c, spec) => {
    const hw = spec.w / 2 - 0.62, hd = spec.d / 2 - 0.62;
    c.prop('cf1_dusty_crate', -hw, 0, -hd, 0.2, 0.75); c.prop('cf1_dusty_crate', -hw, 0, hd, -0.3, 0.7); c.prop('cf1_dusty_crate', hw, 0, -hd, 0.5, 0.7);
    c.prop('cf1_dusty_crate', -hw + 0.05, 0.52, -hd + 0.02, 0.9, 0.5, { col: false });
    c.prop('cf1_old_lantern', -hw, 0.78, -hd, 0, 1.2, { col: false });
    { const g = new THREE.Group(); g.position.set(hw, 0, hd); c.g.add(g); for (let i = 0; i < 4; i++) bx(g, 0.34 - i * 0.02, 0.07, 0.25, [C.choc2, 0x991b1b, 0x1d4ed8, 0x15803d][i], 0, i * 0.07, 0, 0.01).rotation.y = i * 0.3; c.col(0.4, 0.3, 0.4, hw, 0, hd); }
    tor(c.g, 0.22, 0.05, 0xa0763c, -hw + 0.1, 0.05, hd - 0.9, 14).rotation.x = HP;
    const ex = spec.w / 2 - 0.15, ez = spec.d / 2 - 0.15;
    for (const [x, z, r] of [[-ex, -ez, PI * 0.75], [ex - 0.12, -ez, -PI * 0.75], [-ex, ez - 0.12, PI * 0.25], [ex - 0.12, ez - 0.12, -PI * 0.25]]) { const w = c.prop('cf1_cobweb', x, 3.7, z, r, 1.1, { col: false }); if (w) w.rotation.z = 0; }
    c.prop('cf1_old_map', -spec.w / 2 + 0.27, 1.9, -1.6, HP, 1, { col: false });
  };
})();
