/* Zungga Chocolate Factory — room dressing (ground floor). ZFactory.dress[<id>] = (c, spec) => { … }
 * Also registers the reusable factory props (ids cf_…) into the shared library (category 'factory'). */
(() => {
  'use strict';
  const D = (window.ZFactory = window.ZFactory || {}).dress = window.ZFactory.dress || {};
  const T = THREE, PI = Math.PI;

  /* ---------------- palette ---------------- */
  const PUR = 0x7c3aed, YEL = 0xfacc15, PNK = 0xec4899, LPK = 0xf9a8d4, PPK = 0xfbcfe8, CH1 = 0x5b3420, CH2 = 0x7a4426, CH3 = 0x8a5a3a, CRM = 0xfff7e6, TEA = 0x14b8a6,
    WHT = 0xf8fafc, STL = 0xb8c2cc, DRK = 0x334155, SLT = 0x1e293b, COP = 0xc0703a, ORG = 0xfb923c, RED = 0xef4444, BLU = 0x38bdf8, GRN = 0x22c55e, WOD = 0xc08a52, WDD = 0x8a5a33, GLD = 0xf2b632;
  const CANDY = [PNK, PUR, YEL, TEA, ORG, BLU, GRN, RED];

  /* ---------------- cached materials / geometries ---------------- */
  const MC = new Map(), GC = new Map(), LC = new Map();
  const mt = (c, o = {}) => { if (c && c.isMaterial) return c; const k = c + JSON.stringify(o); let m = MC.get(k); if (!m) { m = new T.MeshStandardMaterial({ color: c, roughness: 0.5, ...o }); MC.set(k, m); } return m; };
  // few distinct materials → the world bake merges more (fewer draw calls)
  const glow = (c) => mt(c, { emissive: c, emissiveIntensity: 0.8, roughness: 0.3 });
  const glass = () => mt(0xe6f4ff, { transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.1, depthWrite: false });
  const metal = (c = STL) => mt(c === GLD ? GLD : (c === 0x6b7280 || c === 0x475569 || c === 0x94a3b8) ? 0x7b8794 : STL, { metalness: 0.55, roughness: 0.3 });
  const gloss = (c) => mt(c);
  const geo = (k, fn) => { let g = GC.get(k); if (!g) { g = fn(); GC.set(k, g); } return g; };
  const mk = (g, m, p, x, y, z) => { const me = new T.Mesh(g, mt(m)); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; p.add(me); return me; };
  // primitives: y = BOTTOM (boxes, cylinders) · spheres / tori: y = centre
  const bx = (p, w, h, d, m, x = 0, y = 0, z = 0, r = 0) => mk(geo(`b${w},${h},${d},${r}`, () => (r ? ZA.roundBox(w, h, d, r) : new T.BoxGeometry(w, h, d))), m, p, x, y + h / 2, z);
  const cy = (p, rt, rb, h, m, x = 0, y = 0, z = 0, seg = 20, open = false) => mk(geo(`c${rt},${rb},${h},${seg},${open}`, () => new T.CylinderGeometry(rt, rb, h, seg, 1, open)), m, p, x, y + h / 2, z);
  const sp = (p, r, m, x = 0, y = 0, z = 0, seg = 16) => mk(geo(`s${r},${seg}`, () => new T.SphereGeometry(r, seg, Math.round(seg * 0.7))), m, p, x, y, z);
  const hemi = (p, r, m, x = 0, y = 0, z = 0, seg = 20) => mk(geo(`h${r},${seg}`, () => new T.SphereGeometry(r, seg, Math.round(seg / 2), 0, PI * 2, 0, PI / 2)), m, p, x, y, z);
  const tor = (p, R, r, m, x = 0, y = 0, z = 0, arc = PI * 2, seg = 24) => mk(geo(`t${R},${r},${arc},${seg}`, () => new T.TorusGeometry(R, r, 8, seg, arc)), m, p, x, y, z);
  const cone = (p, r, h, m, x = 0, y = 0, z = 0, seg = 16) => mk(geo(`k${r},${h},${seg}`, () => new T.ConeGeometry(r, h, seg)), m, p, x, y + h / 2, z);
  // a horizontal cylinder along x (y = centre)
  const rodX = (p, r, len, m, x, y, z, seg = 14) => { const me = cy(p, r, r, len, m, x, y - len / 2, z, seg); me.position.y = y; me.rotation.z = PI / 2; return me; };
  const rodZ = (p, r, len, m, x, y, z, seg = 14) => { const me = cy(p, r, r, len, m, x, y - len / 2, z, seg); me.position.y = y; me.rotation.x = PI / 2; return me; };
  // a disc facing +z (y = centre)
  const disc = (p, r, th, m, x, y, z, seg = 24) => { const me = cy(p, r, r, th, m, x, y - th / 2, z, seg); me.position.y = y; me.rotation.x = PI / 2; return me; };
  const lab = (text, o = {}) => { const k = text + JSON.stringify(o); if (!LC.has(k)) LC.set(k, ZA.label(text, { w: 512, h: 160, size: 84, radius: 30, ...o })); return LC.get(k); };
  const TMC = new Map();
  const texMat = (t, k = 0) => { const key = t.uuid + k; let m = TMC.get(key); if (!m) { m = k ? new T.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: k, roughness: 0.35 }) : new T.MeshStandardMaterial({ map: t, roughness: 0.6 }); TMC.set(key, m); } return m; };
  // a flat picture facing +z (rotate with ry), centred at (x, y, z)
  const plate = (p, t, w, h, x, y, z, ry = 0, k = 0) => { const me = new T.Mesh(geo(`p${w},${h}`, () => new T.PlaneGeometry(w, h)), texMat(t, k)); me.position.set(x, y, z); me.rotation.y = ry; p.add(me); return me; };
  const sign = (p, text, w, h, x, y, z, o = {}, ry = 0, k = 0) => { const W = w / h > 3 ? 1024 : 512, H = Math.round(W * h / w); return plate(p, lab(text, { w: W, h: H, size: Math.round(Math.min(W > 512 ? 140 : 90, H * 0.62)), radius: Math.round(H * 0.25), ...o }), w, h, x, y, z, ry, k); };
  // only these parts of an animated prop stay dynamic (the rest gets merged by the world bake)
  const mv = (g, ...objs) => { (g.userData.movers = g.userData.movers || []).push(...objs); objs.forEach((o) => o.traverse((m) => { if (m.isMesh && m.geometry.parameters && m.geometry.parameters.radius < 0.08) m.castShadow = false; })); };
  const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const reg = (id, name, fn, tags) => { if (!ZAssets.has(id)) ZAssets.register('factory', id, name, () => { const g = new T.Group(); const tick = fn(g); if (tick) { g.userData.tick = tick; g.userData.movers = g.userData.movers || []; } return { group: g }; }, ['factory', 'chocolate factory', ...tags]); };

  /* ---------------- canvas pictures ---------------- */
  const TX = {};
  const swirlTex = (a = '#ec4899', b = '#ffffff') => TX['sw' + a + b] || (TX['sw' + a + b] = ZA.tex((g, W) => {
    g.fillStyle = b; g.beginPath(); g.arc(W / 2, W / 2, W / 2, 0, PI * 2); g.fill();
    g.strokeStyle = a; g.lineWidth = W * 0.07; g.lineCap = 'round'; g.beginPath();
    for (let t = 0; t < PI * 7; t += 0.05) { const r = t / (PI * 7) * W * 0.47; g.lineTo(W / 2 + Math.cos(t) * r, W / 2 + Math.sin(t) * r); }
    g.stroke();
  }, 256, 256));
  const brickTex = () => TX.brick || (TX.brick = ZA.tex((g, W, H) => {
    g.fillStyle = '#e8c9a0'; g.fillRect(0, 0, W, H);
    const bw = 64, bh = 28; for (let r = 0; r * bh < H; r++) for (let c = -1; c * bw < W; c++) { g.fillStyle = ['#b4532a', '#c2602f', '#a8482a'][(r + c * 7) % 3]; g.fillRect(c * bw + (r % 2) * bw / 2 + 3, r * bh + 3, bw - 6, bh - 6); }
  }, 256, 256));
  const screenTex = (kind) => TX['scr' + kind] || (TX['scr' + kind] = ZA.tex((g, W, H) => {
    g.fillStyle = '#0b1640'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(56,189,248,0.18)'; g.lineWidth = 2; for (let x = 0; x < W; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const txt = (s, x, y, sz, col) => { g.fillStyle = col; g.font = `700 ${sz}px ${ZA.FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); };
    if (kind === 'map') {   // factory map: river, plaza, buildings
      g.strokeStyle = '#a0673f'; g.lineWidth = 26; g.beginPath(); g.moveTo(0, H * 0.62); g.bezierCurveTo(W * 0.3, H * 0.45, W * 0.6, H * 0.8, W, H * 0.55); g.stroke();
      g.fillStyle = '#facc15'; g.beginPath(); g.arc(W / 2, H * 0.42, 50, 0, PI * 2); g.fill();
      const cols = ['#ec4899', '#f9a8d4', '#fb923c', '#a0673f', '#22c55e', '#38bdf8', '#a78bfa', '#14b8a6'];
      [[80, 60], [200, 50], [330, 70], [420, 160], [90, 200], [380, 250], [230, 230], [160, 130]].forEach(([x, y], i) => { g.fillStyle = cols[i]; g.beginPath(); g.roundRect(x * W / 512, y * H / 320, 52, 38, 8); g.fill(); });
      txt('FACTORY MAP', W / 2, 22, 26, '#fef08a');
    } else if (kind === 'graph') {
      txt('CHOCOLATE FLOW', W / 2, 24, 26, '#fef08a');
      const bars = [0.5, 0.8, 0.6, 0.9, 0.7, 0.95, 0.65]; bars.forEach((v, i) => { g.fillStyle = ['#ec4899', '#facc15', '#22c55e', '#38bdf8'][i % 4]; g.fillRect(40 + i * 64, H - 30 - v * (H - 80), 40, v * (H - 80)); });
    } else if (kind === 'pipes') {
      txt('MIXING VATS', W / 2, 24, 26, '#fef08a');
      for (let i = 0; i < 3; i++) { const x = 100 + i * 156; g.fillStyle = '#7a4426'; g.beginPath(); g.roundRect(x - 50, 110, 100, 130, 24); g.fill(); g.fillStyle = '#c0703a'; g.fillRect(x - 50, 110, 100, 28); txt(['72%', '88%', '64%'][i], x, 190, 34, '#fff'); }
      g.strokeStyle = '#38bdf8'; g.lineWidth = 10; g.beginPath(); g.moveTo(50, 80); g.lineTo(462, 80); g.stroke();
    } else if (kind === 'train') {
      txt('CHOCOLATE EXPRESS', W / 2, 24, 26, '#fef08a');
      g.strokeStyle = '#a78bfa'; g.lineWidth = 12; g.beginPath(); g.roundRect(60, 70, W - 120, H - 110, 60); g.stroke();
      g.fillStyle = '#facc15'; g.beginPath(); g.arc(W - 60, H / 2, 16, 0, PI * 2); g.fill(); g.fillStyle = '#22c55e'; g.beginPath(); g.arc(60, H / 2, 12, 0, PI * 2); g.fill();
    } else if (kind === 'temp') {
      txt('OVEN TEMP', W / 2, 24, 26, '#fef08a');
      g.strokeStyle = '#fb923c'; g.lineWidth = 8; g.beginPath(); for (let x = 20; x < W - 20; x += 8) g.lineTo(x, H / 2 + Math.sin(x / 30) * 50 + Math.sin(x / 11) * 12); g.stroke();
      txt('180°', W / 2, H - 40, 40, '#fff');
    } else {   // smiley status
      txt('ALL GOOD!', W / 2, H - 50, 40, '#86efac');
      g.fillStyle = '#facc15'; g.beginPath(); g.arc(W / 2, H * 0.4, 70, 0, PI * 2); g.fill(); g.fillStyle = '#1f1a33'; g.beginPath(); g.arc(W / 2 - 25, H * 0.35, 9, 0, PI * 2); g.arc(W / 2 + 25, H * 0.35, 9, 0, PI * 2); g.fill(); g.lineWidth = 8; g.strokeStyle = '#1f1a33'; g.beginPath(); g.arc(W / 2, H * 0.42, 38, 0.2, PI - 0.2); g.stroke();
    }
  }, 512, 320));
  const blueprintTex = () => TX.bp || (TX.bp = ZA.tex((g, W, H) => {
    g.fillStyle = '#1d4ed8'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1; for (let x = 0; x < W; x += 24) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.strokeStyle = '#fff'; g.lineWidth = 4;
    const gear = (x, y, r, n) => { g.beginPath(); for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * PI * 2, rr = i % 2 ? r : r * 0.8; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.stroke(); g.beginPath(); g.arc(x, y, r * 0.25, 0, PI * 2); g.stroke(); };
    gear(110, 120, 70, 10); gear(205, 165, 40, 7);
    g.strokeRect(290, 70, 180, 90); g.beginPath(); g.moveTo(290, 160); g.lineTo(330, 210); g.lineTo(430, 210); g.lineTo(470, 160); g.stroke();
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(310 + i * 38, 230, 12, 0, PI * 2); g.stroke(); }
    g.fillStyle = '#fff'; g.font = `700 30px ${ZA.FONT}`; g.textAlign = 'left'; g.fillText('PUMP + WATERFALL PLAN', 24, 300);
  }, 512, 320));
  const portraitTex = (kind) => TX['pt' + kind] || (TX['pt' + kind] = ZA.tex((g, W, H) => {
    if (kind === 'choco') {   // Mr. Choco: a happy chocolate drop with a top hat and a moustache
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#c4b5fd'); bg.addColorStop(1, '#7c3aed'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.fillStyle = '#7a4426'; g.beginPath(); g.moveTo(W / 2, H * 0.2); g.bezierCurveTo(W * 0.95, H * 0.62, W * 0.8, H * 0.95, W / 2, H * 0.95); g.bezierCurveTo(W * 0.2, H * 0.95, W * 0.05, H * 0.62, W / 2, H * 0.2); g.fill();
      g.fillStyle = '#1f1a33'; g.fillRect(W * 0.32, H * 0.06, W * 0.36, H * 0.2); g.fillRect(W * 0.24, H * 0.24, W * 0.52, H * 0.05); g.fillStyle = '#facc15'; g.fillRect(W * 0.32, H * 0.2, W * 0.36, H * 0.04);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(W * 0.4, H * 0.58, 22, 0, PI * 2); g.arc(W * 0.6, H * 0.58, 22, 0, PI * 2); g.fill(); g.fillStyle = '#1f1a33'; g.beginPath(); g.arc(W * 0.41, H * 0.59, 10, 0, PI * 2); g.arc(W * 0.61, H * 0.59, 10, 0, PI * 2); g.fill();
      g.beginPath(); g.ellipse(W * 0.43, H * 0.7, 30, 12, -0.3, 0, PI * 2); g.ellipse(W * 0.57, H * 0.7, 30, 12, 0.3, 0, PI * 2); g.fill();
      g.strokeStyle = '#1f1a33'; g.lineWidth = 6; g.beginPath(); g.arc(W / 2, H * 0.74, 28, 0.3, PI - 0.3); g.stroke();
    } else {   // the chocolate river landscape
      g.fillStyle = '#bae6fd'; g.fillRect(0, 0, W, H); g.fillStyle = '#86efac'; g.fillRect(0, H * 0.5, W, H * 0.5);
      g.fillStyle = '#a78bfa'; g.beginPath(); g.moveTo(0, H * 0.5); g.lineTo(W * 0.25, H * 0.2); g.lineTo(W * 0.5, H * 0.5); g.lineTo(W * 0.75, H * 0.25); g.lineTo(W, H * 0.5); g.fill();
      g.fillStyle = '#7a4426'; g.beginPath(); g.moveTo(W * 0.4, H * 0.5); g.bezierCurveTo(W * 0.2, H * 0.7, W * 0.8, H * 0.8, W * 0.35, H); g.lineTo(W * 0.75, H); g.bezierCurveTo(W, H * 0.8, W * 0.4, H * 0.7, W * 0.55, H * 0.5); g.fill();
      g.fillStyle = '#facc15'; g.beginPath(); g.arc(W * 0.8, H * 0.15, 30, 0, PI * 2); g.fill();
      [[0.15, 0.7, '#ec4899'], [0.85, 0.65, '#fb923c'], [0.2, 0.88, '#38bdf8']].forEach(([x, y, c]) => { g.fillStyle = '#fff'; g.fillRect(W * x - 3, H * y, 6, 50); g.fillStyle = c; g.beginPath(); g.arc(W * x, H * y, 22, 0, PI * 2); g.fill(); });
    }
  }, 256, 320));
  const menuTex = () => TX.menu || (TX.menu = ZA.tex((g, W, H) => {
    g.fillStyle = '#1f2a24'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fde68a'; g.font = `700 64px ${ZA.FONT}`; g.textAlign = 'center'; g.fillText('MENU', W / 2, 70);
    const rows = [['Hot Chocolate', '3', '#f9a8d4'], ['Cookie Stack', '2', '#fde68a'], ['Marshmallow Cocoa', '4', '#ffffff'], ['Cupcake', '2', '#a7f3d0'], ['Candy Milkshake', '5', '#bae6fd']];
    g.font = `600 36px ${ZA.FONT}`; rows.forEach(([n, p, c], i) => { g.fillStyle = c; g.textAlign = 'left'; g.fillText('• ' + n, 36, 140 + i * 54); g.textAlign = 'right'; g.fillText(p + ' Z', W - 36, 140 + i * 54); });
  }, 512, 420));
  const timetableTex = () => TX.tt || (TX.tt = ZA.tex((g, W, H) => {
    g.fillStyle = '#111827'; g.fillRect(0, 0, W, H); g.fillStyle = '#facc15'; g.fillRect(0, 0, W, 64);
    g.fillStyle = '#3b0764'; g.font = `700 40px ${ZA.FONT}`; g.textAlign = 'center'; g.fillText('DEPARTURES', W / 2, 46);
    const rows = [['Candy Lab', '10:00'], ['Cookie Bakery', '10:15'], ['Marshmallow Hill', '10:30'], ['Chocolate River', '10:45'], ['Main Plaza', '11:00']];
    g.font = `600 32px ${ZA.FONT}`; rows.forEach(([n, t], i) => { g.fillStyle = i % 2 ? '#fde68a' : '#a7f3d0'; g.textAlign = 'left'; g.fillText(n, 28, 112 + i * 46); g.textAlign = 'right'; g.fillText(t, W - 28, 112 + i * 46); });
  }, 512, 340));

  /* ---------------- shared builders ---------------- */
  function gearGeo(r, n, th) {
    return geo(`gear${r},${n},${th}`, () => {
      const s = new T.Shape(), st = PI * 2 / n, ri = r * 0.8;
      for (let i = 0; i < n; i++) { const a = i * st, pts = [[ri, a], [r, a + st * 0.15], [r, a + st * 0.45], [ri, a + st * 0.6]]; pts.forEach(([rr, aa], k) => { const x = Math.cos(aa) * rr, y = Math.sin(aa) * rr; if (i === 0 && k === 0) s.moveTo(x, y); else s.lineTo(x, y); }); }
      s.closePath(); const h = new T.Path(); h.absarc(0, 0, r * 0.22, 0, PI * 2, true); s.holes.push(h);
      const g = new T.ExtrudeGeometry(s, { depth: th, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 1, curveSegments: 10 }); g.translate(0, 0, -th / 2); g.computeVertexNormals(); return g;
    });
  }
  const gear = (p, r, n, th, m, x, y, z) => { const me = new T.Mesh(gearGeo(r, n, th), mt(m)); me.position.set(x, y, z); me.castShadow = true; p.add(me); return me; };
  // a sack (lathe) with an optional label on the front
  const sackGeo = () => geo('sack', () => new T.LatheGeometry([[0, 0], [0.3, 0.01], [0.38, 0.12], [0.4, 0.4], [0.36, 0.62], [0.25, 0.74], [0.16, 0.8], [0.2, 0.86], [0.24, 0.9], [0.0, 0.9]].map(([a, b]) => new T.Vector2(a, b)), 14));
  function sack(p, text, col, fg, x = 0, y = 0, z = 0, s = 1, ry = 0) {
    const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); p.add(g);
    mk(sackGeo(), mt(col, { roughness: 0.95 }), g, 0, 0, 0); tor(g, 0.17, 0.035, 0xb45309, 0, 0.8, 0, PI * 2, 12).rotation.x = PI / 2;
    if (text) { const pl = plate(g, lab(text, { w: 320, h: 160, bg: '#ffffff', fg, size: 70, radius: 24 }), 0.48, 0.24, 0, 0.36, 0.405); pl.rotation.x = -0.05; }
    return g;
  }
  function cookie(p, x, y, z, r = 0.09, col = 0xd9a05b, chips = 2) {
    cy(p, r, r, r * 0.35, col, x, y, z, 14);
    for (let i = 0; i < chips; i++) { const a = i * 2.4 + x * 7; sp(p, r * 0.18, CH1, x + Math.cos(a) * r * 0.5, y + r * 0.35, z + Math.sin(a) * r * 0.5, 6); }
  }
  function marsh(p, x, y, z, col = WHT, r = 0.13, ry = 0) { const me = cy(p, r, r, r * 1.5, col, x, y, z, 14); me.rotation.y = ry; return me; }
  // conveyor belt along local x, length len; items ride on top (animated)
  function conveyor(g, len, itemFn, n, belt = 0x334155, rail = YEL) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.1, 0.72, 0.1, DRK, sx * (len / 2 - 0.25), 0, sz * 0.35);
    for (const sz of [-1, 1]) bx(g, len, 0.16, 0.08, rail, 0, 0.72, sz * 0.45, 0.03);
    bx(g, len - 0.1, 0.06, 0.8, belt, 0, 0.74, 0);
    for (const sx of [-1, 1]) rodZ(g, 0.08, 0.84, metal(), sx * (len / 2 - 0.05), 0.77, 0, 14);
    for (let i = -2; i <= 2; i++) bx(g, 0.03, 0.005, 0.78, 0x475569, i * len / 5.5, 0.8, 0);
    bx(g, 0.4, 0.5, 0.35, PUR, len / 2 - 0.3, 0.88, -0.6, 0.06); sp(g, 0.06, glow(GRN), len / 2 - 0.4, 1.38, -0.6, 10); sp(g, 0.06, glow(RED), len / 2 - 0.2, 1.38, -0.6, 10);
    bx(g, 0.1, 0.88, 0.1, DRK, len / 2 - 0.3, 0, -0.6);
    // items: built once as groups of identical structure, then drawn as one InstancedMesh per part (a handful of draw calls)
    const items = []; for (let i = 0; i < n; i++) { const it = new T.Group(); itemFn(it, i); it.updateMatrixWorld(true); items.push(it); }
    const ims = items[0].children.map((m0, k) => { const im = new T.InstancedMesh(m0.geometry, mt(0xffffff, { roughness: m0.material.roughness }), n); im.frustumCulled = false; im.castShadow = true; items.forEach((it, i) => im.setColorAt(i, it.children[k].material.color)); g.add(im); return { im, local: items[0].children[k].matrix.clone() }; });
    const M4 = new T.Matrix4(), M5 = new T.Matrix4(), V = new T.Vector3(), Q = new T.Quaternion(), S = new T.Vector3();
    return (t) => { for (let i = 0; i < n; i++) { const u = (t * 0.18 + i / n) % 1, e = Math.max(0.01, Math.min(1, u * 10, (1 - u) * 10)); V.set(-len / 2 + 0.2 + u * (len - 0.4), 0.8, 0); S.setScalar(e); M4.compose(V, Q, S); for (const { im, local } of ims) { M5.multiplyMatrices(M4, local); im.setMatrixAt(i, M5); } } for (const { im } of ims) im.instanceMatrix.needsUpdate = true; };
  }
  // a rolling rack of trays (cookies / chocolate moulds)
  function rack(g, itemFn) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { cy(g, 0.03, 0.03, 1.9, metal(), sx * 0.55, 0.08, sz * 0.3, 8); sp(g, 0.06, DRK, sx * 0.55, 0.06, sz * 0.3, 8); }
    for (let i = 0; i < 6; i++) { const y = 0.35 + i * 0.3; bx(g, 1.14, 0.03, 0.62, metal(0xd1d5db), 0, y, 0); for (let k = 0; k < 6; k++) itemFn(g, -0.36 + (k % 3) * 0.36, y + 0.03, -0.14 + Math.floor(k / 3) * 0.28, i * 6 + k); }
    bx(g, 1.2, 0.05, 0.66, metal(), 0, 1.98, 0);
  }

  /* =============================== PROPS =============================== */
  /* ---- candy lab ---- */
  reg('cf_syrup_tubes', 'Bubbling syrup tubes machine', (g) => {
    bx(g, 1.8, 0.9, 0.8, PUR, 0, 0, 0, 0.08); bx(g, 1.9, 0.3, 0.9, PNK, 0, 2.5, 0, 0.08); sp(g, 0.12, glow(YEL), 0, 2.92, 0, 12);
    sign(g, 'SYRUP', 0.9, 0.28, 0, 0.55, 0.41, { bg: '#facc15', fg: '#3b0764' });
    const cols = [PNK, TEA, YEL], bub = [];
    cols.forEach((c, i) => {
      const x = -0.55 + i * 0.55;
      cy(g, 0.2, 0.2, 1.6, glass(), x, 0.9, 0, 18, true); cy(g, 0.17, 0.17, 1.1 + i * 0.15, glow(c, 0.7), x, 0.9, 0, 16);
      tor(g, 0.21, 0.035, metal(), x, 0.92, 0, PI * 2, 16).rotation.x = PI / 2; tor(g, 0.21, 0.035, metal(), x, 2.48, 0, PI * 2, 16).rotation.x = PI / 2;
      for (let k = 0; k < 2; k++) bub.push([sp(g, 0.05, glow(WHT, 0.6), x, 1, 0, 8), i * 0.3 + k * 0.5, x]);
      disc(g, 0.08, 0.04, WHT, x, 0.3, 0.41, 14); sp(g, 0.05, glow([RED, GRN, BLU][i]), x + 0.17, 0.3, 0.42, 8);
    });
    mv(g, ...bub.map((b) => b[0]));
    return (t) => bub.forEach(([b, ph, x], j) => { const u = (t * 0.45 + ph) % 1; b.position.set(x + Math.sin(t * 3 + j) * 0.06, 0.95 + u * 1.25, 0); });
  }, ['candy', 'lab', 'syrup', 'machine', 'tubes']);

  reg('cf_lollipop_press', 'Lollipop press machine', (g) => {
    bx(g, 1.4, 0.8, 1.0, YEL, 0, 0, 0, 0.08); for (const sx of [-1, 1]) cy(g, 0.07, 0.07, 1.7, metal(), sx * 0.55, 0.8, 0, 12);
    bx(g, 1.5, 0.4, 0.7, PUR, 0, 2.4, 0, 0.08); sign(g, 'LOLLIPOPS', 1.2, 0.3, 0, 2.6, 0.36, { bg: '#ec4899', fg: '#fff' });
    bx(g, 0.9, 0.06, 0.6, metal(0xe5e7eb), 0, 0.8, 0); const mold = cy(g, 0.3, 0.3, 0.08, PNK, 0, 0.86, 0, 20);
    const pist = new T.Group(); g.add(pist); cy(pist, 0.08, 0.08, 0.9, metal(), 0, 1.5, 0, 10); bx(pist, 0.7, 0.2, 0.7, PNK, 0, 1.3, 0, 0.05);
    bx(g, 1.2, 0.05, 0.5, metal(0xe5e7eb), 0, 0.78, 0.72); bx(g, 0.1, 0.78, 0.1, DRK, 0.5, 0, 0.85); bx(g, 0.1, 0.78, 0.1, DRK, -0.5, 0, 0.85);
    [PNK, TEA, ORG].forEach((c, i) => { const x = -0.35 + i * 0.35; disc(g, 0.13, 0.04, gloss(c), x, 0.95, 0.7, 18); rodX(g, 0.012, 0.25, WHT, x, 0.85, 0.85).rotation.set(PI / 2, 0, 0); });
    void mold; mv(g, pist);
    return (t) => { pist.position.y = -0.4 * Math.max(0, Math.sin(t * 2.2)); };
  }, ['candy', 'lollipop', 'press', 'machine']);

  reg('cf_swirl_machine', 'Giant swirl-candy machine', (g) => {
    cy(g, 0.9, 1.0, 1.0, PUR, 0, 0, 0, 28); tor(g, 0.95, 0.06, YEL, 0, 1.0, 0, PI * 2, 28).rotation.x = PI / 2;
    cy(g, 0.6, 0.75, 0.9, LPK, 0, 1.0, 0, 24); cy(g, 0.12, 0.12, 0.8, WHT, 0, 1.9, 0, 12);
    const top = new T.Group(); top.position.set(0, 2.85, 0); g.add(top);
    disc(top, 0.85, 0.22, gloss(PNK), 0, 0, 0, 36);
    const sw = swirlTex('#ec4899', '#fff7e6'); for (const sd of [1, -1]) { const f = new T.Mesh(geo('circ0.8', () => new T.CircleGeometry(0.8, 36)), new T.MeshStandardMaterial({ map: sw, roughness: 0.25 })); f.position.z = sd * 0.115; f.rotation.y = sd < 0 ? PI : 0; top.add(f); }
    const lights = []; for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; lights.push(sp(g, 0.07, glow(CANDY[i % 4]), Math.sin(a) * 0.93, 0.6, Math.cos(a) * 0.93, 8)); }
    sign(g, 'SWIRL-O-MATIC', 1.0, 0.3, 0, 0.5, 1.0, { bg: '#facc15', fg: '#3b0764' }); mv(g, top);
    return (t) => { top.rotation.z = t * 1.4; };
  }, ['candy', 'swirl', 'machine', 'lollipop']);

  reg('cf_candy_shelf', 'Shelf of candy jars', (g) => {
    for (const sx of [-1, 1]) bx(g, 0.08, 2.4, 0.6, PNK, sx * 1.16, 0, 0, 0.02); bx(g, 2.4, 2.4, 0.04, LPK, 0, 0, -0.28);
    for (const y of [0.05, 0.75, 1.45, 2.15]) bx(g, 2.3, 0.06, 0.58, WHT, 0, y, 0);
    const rnd = seeded(5);
    for (let s = 0; s < 3; s++) for (let i = 0; i < 4; i++) { const x = -0.82 + i * 0.55, y = 0.11 + s * 0.7, c = CANDY[Math.floor(rnd() * 8)]; cy(g, 0.17, 0.17, 0.42, glass(0xffffff, 0.35), x, y, 0, 14); cy(g, 0.15, 0.15, 0.3, gloss(c), x, y + 0.01, 0, 14); cy(g, 0.18, 0.18, 0.06, [PUR, YEL, PNK][(s + i) % 3], x, y + 0.42, 0, 14); }
    sign(g, 'CANDY', 0.9, 0.24, 0, 2.29, 0.3, { bg: '#7c3aed', fg: '#facc15' });
  }, ['candy', 'shelf', 'jars', 'shop']);

  reg('cf_lab_bench', 'Candy lab bench with flasks', (g) => {
    bx(g, 2.3, 0.85, 0.85, LPK, 0, 0, 0, 0.04); bx(g, 2.4, 0.08, 0.95, WHT, 0, 0.85, 0, 0.03);
    for (let i = 0; i < 3; i++) { bx(g, 0.66, 0.6, 0.02, PPK, -0.75 + i * 0.75, 0.12, 0.43); sp(g, 0.035, YEL, -0.75 + i * 0.75, 0.62, 0.45, 8); }
    const y = 0.93;
    [[-0.85, PNK], [-0.45, TEA], [0.6, PUR]].forEach(([x, c]) => { cy(g, 0.05, 0.18, 0.3, glass(0xffffff, 0.35), x, y, 0, 16); cy(g, 0.06, 0.15, 0.16, glow(c, 0.6), x, y, 0, 16); cy(g, 0.05, 0.05, 0.14, glass(0xffffff, 0.35), x, y + 0.3, 0, 12); });
    sp(g, 0.16, glass(0xffffff, 0.35), 0.15, y + 0.16, -0.15, 16); sp(g, 0.12, glow(YEL, 0.6), 0.15, y + 0.14, -0.15, 14); cy(g, 0.04, 0.04, 0.18, glass(0xffffff, 0.35), 0.15, y + 0.28, -0.15, 10);
    bx(g, 0.5, 0.06, 0.16, WOD, 1.0, y, 0.15); for (let i = 0; i < 5; i++) cy(g, 0.025, 0.025, 0.24, glow(CANDY[i], 0.5), 0.82 + i * 0.09, y + 0.02, 0.15, 8);
    sp(g, 0.09, gloss(PNK), -0.2, y + 0.09, 0.25, 12); sp(g, 0.07, gloss(YEL), -0.05, y + 0.07, 0.3, 12);
  }, ['candy', 'lab', 'science', 'flask', 'table']);

  reg('cf_candy_conveyor', 'Candy conveyor belt', (g) => conveyor(g, 4, (it, i) => { const c = CANDY[i % 8]; sp(it, 0.11, gloss(c), 0, 0.11, 0, 14); for (const s of [-1, 1]) { const k = cone(it, 0.08, 0.14, gloss(c), s * 0.17, 0.04, 0, 10); k.rotation.z = s * PI / 2; k.position.y = 0.11; } }, 7), ['candy', 'conveyor', 'belt', 'machine']);

  /* ---- marshmallow workshop ---- */
  reg('cf_marshmallow_puffer', 'Marshmallow puffer machine', (g) => {
    cy(g, 1.0, 1.05, 0.7, PUR, 0, 0, 0, 28); tor(g, 1.0, 0.07, YEL, 0, 0.7, 0, PI * 2, 28).rotation.x = PI / 2;
    const dome = hemi(g, 0.88, mt(0xfde7f2, { roughness: 0.85 }), 0, 0.7, 0, 28);
    cy(g, 0.14, 0.2, 0.4, PNK, 0, 1.5, 0, 14); tor(g, 0.15, 0.04, YEL, 0, 1.9, 0, PI * 2, 14).rotation.x = PI / 2;
    const puffs = [0, 1, 2].map((i) => marsh(g, 0, 2.0, 0, [WHT, PPK, 0xd9f99d][i], 0.1));
    bx(g, 0.7, 0.45, 0.12, PNK, 0, 0.15, 1.02, 0.04); [RED, YEL, GRN].forEach((c, i) => sp(g, 0.05, glow(c), -0.2 + i * 0.2, 0.42, 1.09, 8)); mv(g, dome, ...puffs);
    return (t) => { const s = 0.5 + 0.5 * Math.sin(t * 1.6); dome.scale.set(1 + 0.06 * s, 1 + 0.14 * s, 1 + 0.06 * s); puffs.forEach((p, i) => { const u = (t * 0.35 + i / 3) % 1; p.position.set(Math.sin(i * 2 + t) * 0.25 * u, 2.0 + u * 1.0, Math.cos(i * 2 + t) * 0.25 * u); p.scale.setScalar(Math.min(1, (1 - u) * 4)); }); };
  }, ['marshmallow', 'machine', 'puffer']);

  reg('cf_marshmallow_pile', 'Giant marshmallow pile', (g) => {
    const rnd = seeded(11), cols = [WHT, WHT, PPK, 0xfde68a, 0xd9f99d, 0xbae6fd];
    const lay = [[7, 0.62, 0], [6, 0.42, 0.3], [4, 0.22, 0.6], [1, 0, 0.9]];
    lay.forEach(([n, r, y]) => { for (let i = 0; i < n; i++) { const a = i / n * PI * 2 + y; const me = marsh(g, Math.cos(a) * r, y, Math.sin(a) * r, cols[Math.floor(rnd() * cols.length)], 0.2, rnd() * 3); me.rotation.z = (rnd() - 0.5) * 0.4; } });
    for (let i = 0; i < 6; i++) { const a = i * 1.1; marsh(g, Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95, cols[i % cols.length], 0.13).rotation.set(PI / 2, 0, a); }
  }, ['marshmallow', 'pile', 'sweets']);

  reg('cf_roasting_stand', 'Marshmallow roasting stand', (g) => {
    cy(g, 0.55, 0.45, 0.55, 0xb91c1c, 0, 0, 0, 20); tor(g, 0.55, 0.05, metal(0x6b7280), 0, 0.57, 0, PI * 2, 20).rotation.x = PI / 2;
    const coal = new T.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff5a00, emissiveIntensity: 1, roughness: 0.6 });
    const coals = []; for (let i = 0; i < 7; i++) { const a = i * 0.9, r = i ? 0.3 : 0; coals.push(sp(g, 0.11, coal, Math.cos(a) * r, 0.55, Math.sin(a) * r, 8)); }
    for (let i = 0; i < 4; i++) rodX(g, 0.012, 1.0, metal(), 0, 0.68, -0.3 + i * 0.2);
    for (let i = 0; i < 3; i++) { const a = -0.6 + i * 0.6, sk = new T.Group(); sk.position.set(Math.sin(a) * 0.5, 0.75, Math.cos(a) * 0.5); sk.rotation.y = a; g.add(sk); const st = cy(sk, 0.012, 0.012, 1.0, WDD, 0, -0.5, 0, 6); st.rotation.x = 1.2; st.position.set(0, 0.1, -0.1); marsh(sk, 0, 0.1, -0.55, 0xf5d0a0, 0.07).rotation.x = 1.2; }
    sign(g, 'ROAST ME!', 0.7, 0.22, 0, 0.3, 0.53, { bg: '#fde68a', fg: '#7c2d12' });
    return (t) => { coal.emissiveIntensity = 0.8 + Math.sin(t * 7) * 0.15 + Math.sin(t * 13) * 0.1; };
  }, ['marshmallow', 'roasting', 'grill']);

  reg('cf_cushion', 'Big squishy cushion', (g) => { const me = sp(g, 0.5, mt(LPK, { roughness: 0.9 }), 0, 0.25, 0, 20); me.scale.set(1, 0.5, 1); sp(g, 0.06, PNK, 0, 0.5, 0, 10); }, ['cushion', 'pouf', 'soft', 'marshmallow']);
  reg('cf_marshmallow_conveyor', 'Marshmallow conveyor belt', (g) => conveyor(g, 4, (it, i) => { marsh(it, -0.12, 0, 0, i % 2 ? WHT : PPK, 0.12); marsh(it, 0.14, 0, 0.1, i % 3 ? WHT : 0xd9f99d, 0.12); }, 7, 0xf472b6, WHT), ['marshmallow', 'conveyor', 'belt']);

  /* ---- sacks (shared) ---- */
  [['cf_sack_cocoa', 'Cocoa sack', 'COCOA', 0x9a6b45, '#5b3420'], ['cf_sack_sugar', 'Sugar sack', 'SUGAR', 0xf1ede4, '#db2777'], ['cf_sack_milk', 'Milk powder sack', 'MILK', 0xe0f2fe, '#1d4ed8'],
    ['cf_sack_nuts', 'Nuts sack', 'NUTS', 0xd6b57f, '#7c2d12'], ['cf_flour_sack', 'Flour sack', 'FLOUR', 0xf5f0e6, '#b45309'], ['cf_marshmallow_sack', 'Marshmallow sack', 'MALLOWS', 0xfdf2f8, '#db2777']]
    .forEach(([id, name, text, col, fg]) => reg(id, name, (g) => { sack(g, text, col, fg); if (id === 'cf_marshmallow_sack') { marsh(g, 0, 0.88, 0, WHT, 0.1); marsh(g, 0.1, 0.9, 0.05, PPK, 0.09); } }, ['sack', 'ingredient', text.toLowerCase()]));

  /* ---- bakery ---- */
  reg('cf_brick_oven', 'Big brick oven', (g) => {
    const bm = new T.MeshStandardMaterial({ map: brickTex(), roughness: 0.9 });
    bx(g, 2.4, 2.0, 1.8, bm, 0, 0, 0); bx(g, 2.6, 0.22, 1.95, CRM, 0, 2.0, 0, 0.06); cy(g, 0.26, 0.3, 1.1, bm, 0.6, 2.2, -0.4, 14); cy(g, 0.32, 0.32, 0.12, CH2, 0.6, 3.3, -0.4, 14);
    const hot = new T.MeshStandardMaterial({ color: 0xff8a2a, emissive: 0xff6a00, emissiveIntensity: 1.0, roughness: 0.5 });
    bx(g, 1.3, 0.75, 0.04, 0x2a1408, 0, 0.55, 0.9); bx(g, 1.2, 0.68, 0.03, hot, 0, 0.58, 0.915);
    const arch = new T.Mesh(geo('ovarch', () => new T.CylinderGeometry(0.6, 0.6, 0.05, 20, 1, false, -PI / 2, PI)), hot); arch.rotation.x = PI / 2; arch.position.set(0, 1.26, 0.915); g.add(arch);
    tor(g, 0.68, 0.06, GLD, 0, 1.28, 0.93, PI, 20); bx(g, 1.5, 0.12, 0.12, GLD, 0, 0.45, 0.93);
    bx(g, 0.9, 0.03, 0.45, metal(), 0, 0.62, 1.05); for (let i = 0; i < 3; i++) cookie(g, -0.28 + i * 0.28, 0.65, 1.05, 0.1);
    disc(g, 0.16, 0.05, WHT, 0.95, 1.55, 0.93, 16); bx(g, 0.02, 0.12, 0.02, RED, 0.95, 1.55, 0.96);
    return (t) => { hot.emissiveIntensity = 0.85 + Math.sin(t * 5) * 0.12 + Math.sin(t * 11.3) * 0.08; };
  }, ['bakery', 'oven', 'brick', 'cookies']);

  reg('cf_cookie_rack', 'Rolling rack of cookie trays', (g) => rack(g, (p, x, y, z, i) => cookie(p, x, y, z, 0.1, i % 7 ? 0xd9a05b : 0x7a4426, i % 2)), ['bakery', 'cookies', 'rack', 'trays']);
  reg('cf_cookie_tray', 'Tray of cookies', (g) => { bx(g, 0.7, 0.03, 0.45, metal(), 0, 0, 0); for (const s of [-1, 1]) bx(g, 0.7, 0.04, 0.02, metal(), 0, 0.02, s * 0.22); for (let i = 0; i < 6; i++) cookie(g, -0.22 + (i % 3) * 0.22, 0.03, -0.1 + Math.floor(i / 3) * 0.2, 0.085); }, ['bakery', 'cookies', 'tray']);

  reg('cf_dough_table', 'Dough rolling table', (g) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.1, 0.85, 0.1, WDD, sx * 1.1, 0, sz * 0.5); bx(g, 2.2, 0.06, 1.0, WDD, 0, 0.25, 0);
    bx(g, 2.4, 0.1, 1.2, 0xe8c48f, 0, 0.85, 0, 0.03); const y = 0.95;
    bx(g, 1.0, 0.03, 0.65, 0xf6e1b8, -0.3, y, 0, 0.01); const pin = rodX(g, 0.06, 0.6, 0xe5b97a, -0.3, y + 0.1, 0.05); void pin; for (const s of [-1, 1]) rodX(g, 0.025, 0.14, WDD, -0.3 + s * 0.37, y + 0.1, 0.05);
    const blob = sp(g, 0.22, 0xf6e1b8, 0.65, y + 0.06, -0.2, 16); blob.scale.set(1, 0.5, 1);
    [PNK, TEA, YEL].forEach((c, i) => tor(g, 0.07, 0.015, gloss(c), -0.65 + i * 0.25, y + 0.05, 0.42, PI * 2, 6).rotation.x = PI / 2);
    hemi(g, 0.2, PPK, 0.75, y, 0.3, 16).rotation.x = PI; cy(g, 0.17, 0.17, 0.02, 0xfff3d6, 0.75, y + 0.0, 0.3, 16);
    for (let i = 0; i < 4; i++) cookie(g, 0.2 + (i % 2) * 0.22, y + 0.03, 0.2 + Math.floor(i / 2) * 0.2, 0.08, 0xf2d3a0, 1);
  }, ['bakery', 'dough', 'table', 'rolling pin']);

  reg('cf_cookie_display', 'Cookie display counter', (g) => {
    bx(g, 2.6, 0.95, 0.9, CRM, 0, 0, 0, 0.05); bx(g, 2.62, 0.18, 0.92, PNK, 0, 0.55, 0, 0.04);
    bx(g, 2.5, 0.45, 0.8, glass(0xffffff, 0.25), 0, 0.95, 0); bx(g, 2.6, 0.05, 0.9, WOD, 0, 1.4, 0, 0.02);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const x = -1.0 + i * 0.4, z = -0.18 + r * 0.32; if ((i + r) % 3 === 2) { cy(g, 0.08, 0.06, 0.1, [PNK, TEA, YEL][i % 3], x, 0.96, z, 12); sp(g, 0.085, CRM, x, 1.1, z, 10); sp(g, 0.025, RED, x, 1.19, z, 6); } else { cookie(g, x, 0.96, z, 0.1, i % 2 ? 0xd9a05b : CH2, 2); cookie(g, x, 1.0, z, 0.1, 0xd9a05b, 1); } }
    sign(g, 'FRESH COOKIES', 1.4, 0.3, 0, 0.3, 0.46, { bg: '#7c3aed', fg: '#facc15' });
  }, ['bakery', 'cookies', 'counter', 'display', 'shop']);

  reg('cf_giant_cookie_sign', 'Giant cookie sign', (g) => {
    disc(g, 1.0, 0.2, mt(0xd9a05b, { roughness: 0.7 }), 0, 1.0, 0, 32);
    for (let i = 0; i < 11; i++) { const a = i * 2.4, r = 0.2 + (i % 4) * 0.2; hemi(g, 0.1, CH1, Math.cos(a) * r, 1.0 + Math.sin(a) * r, 0.1, 8).rotation.x = PI / 2; }
    sign(g, 'COOKIES!', 1.3, 0.38, 0, -0.05, 0.12, { bg: '#ec4899', fg: '#ffffff' });
  }, ['bakery', 'cookie', 'sign', 'wall']);
  reg('cf_cookie_conveyor', 'Cookie conveyor belt', (g) => conveyor(g, 4, (it, i) => { cookie(it, -0.12, 0, 0, 0.12, 0xd9a05b, 3); cookie(it, 0.18, 0, 0.12, 0.12, i % 2 ? CH2 : 0xd9a05b, 2); }, 6, 0x6b7280, ORG), ['bakery', 'cookies', 'conveyor']);

  /* ---- chocolate kitchen ---- */
  reg('cf_choco_vat', 'Chocolate mixing vat', (g) => {
    for (let i = 0; i < 4; i++) { const a = PI / 4 + i * PI / 2; cy(g, 0.07, 0.09, 0.62, metal(0x6b7280), Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8, 10); }
    cy(g, 1.12, 0.92, 1.35, mt(COP, { metalness: 0.65, roughness: 0.28 }), 0, 0.6, 0, 32);
    tor(g, 1.12, 0.08, mt(0xe0a060, { metalness: 0.7, roughness: 0.25 }), 0, 1.95, 0, PI * 2, 32).rotation.x = PI / 2; tor(g, 1.03, 0.04, mt(0xe0a060, { metalness: 0.7, roughness: 0.25 }), 0, 1.2, 0, PI * 2, 32).rotation.x = PI / 2;
    const surf = new T.Mesh(geo('vatsurf', () => new T.CircleGeometry(1.05, 32)), mt(0x4a2614, { roughness: 0.15 })); surf.rotation.x = -PI / 2; surf.position.y = 1.88; g.add(surf);
    for (const sx of [-1, 1]) cy(g, 0.06, 0.06, 0.8, metal(), sx * 1.05, 1.95, 0, 10);
    bx(g, 2.3, 0.22, 0.3, PUR, 0, 2.7, 0, 0.06); cy(g, 0.28, 0.28, 0.45, YEL, 0, 2.9, 0, 18); sp(g, 0.08, glow(GRN), 0, 3.4, 0, 10);
    const pad = new T.Group(); pad.position.y = 1.5; g.add(pad); cy(pad, 0.05, 0.05, 1.25, metal(), 0, 0, 0, 10); for (let i = 0; i < 2; i++) { const b = bx(pad, 1.4, 0.35, 0.05, metal(0xd1d5db), 0, 0.05, 0, 0.02); b.rotation.y = i * PI / 2; }
    const ring = tor(g, 0.5, 0.03, mt(0x6b3a1f, { roughness: 0.2 }), 0, 1.9, 0, PI * 2, 24); ring.rotation.x = PI / 2;
    rodZ(g, 0.08, 0.35, metal(0xd1d5db), 0, 0.85, 1.05); cy(g, 0.06, 0.08, 0.15, metal(), 0, 0.65, 1.2, 10);
    sign(g, 'MIX!', 0.6, 0.18, 0, 2.81, 0.16, { bg: '#facc15', fg: '#3b0764' }); mv(g, pad, ring);
    return (t) => { pad.rotation.y = t * 1.3; const u = (t * 0.4) % 1; ring.scale.setScalar(0.3 + u * 1.6); ring.material.opacity = 1; };
  }, ['chocolate', 'vat', 'mixer', 'kitchen', 'machine']);

  reg('cf_tempering_table', 'Chocolate tempering table', (g) => {
    bx(g, 2.3, 0.82, 0.9, CH3, 0, 0, 0, 0.04); for (let i = 0; i < 3; i++) { bx(g, 0.68, 0.6, 0.02, CH2, -0.75 + i * 0.75, 0.1, 0.45); sp(g, 0.035, GLD, -0.75 + i * 0.75, 0.6, 0.47, 8); }
    bx(g, 2.4, 0.1, 1.0, 0xf1ece4, 0, 0.82, 0, 0.03); const y = 0.92;
    const pud = cy(g, 0.38, 0.38, 0.015, mt(0x4a2614, { roughness: 0.15 }), -0.6, y, 0, 24); pud.scale.set(1.3, 1, 0.9);
    bx(g, 0.3, 0.01, 0.12, metal(), -0.2, y + 0.01, 0.15); bx(g, 0.04, 0.03, 0.2, WOD, -0.2, y + 0.015, 0.3);
    for (const tx of [0.35, 0.95]) { bx(g, 0.5, 0.04, 0.4, 0xdb2777, tx, y, -0.1, 0.01); for (let i = 0; i < 6; i++) hemi(g, 0.06, CH1, tx - 0.15 + (i % 3) * 0.15, y + 0.04, -0.2 + Math.floor(i / 3) * 0.2, 10); }
    for (let i = 0; i < 3; i++) bx(g, 0.32, 0.04, 0.15, CH2, 0.6, y + i * 0.04, 0.32, 0.01);
    bx(g, 0.24, 0.045, 0.16, GLD, 0.6, y + 0.12, 0.32, 0.01);
  }, ['chocolate', 'tempering', 'table', 'kitchen', 'molds']);

  reg('cf_choco_mold_rack', 'Rack of chocolate moulds', (g) => rack(g, (p, x, y, z, i) => { if (i % 3 === 1) bx(p, 0.3, 0.04, 0.14, i % 2 ? CH2 : CH1, x, y, z, 0.01); else hemi(p, 0.08, i % 4 ? CH1 : 0xf5e6d0, x, y, z, 10); }), ['chocolate', 'molds', 'rack', 'kitchen']);
  reg('cf_choco_bar_conveyor', 'Chocolate bar conveyor belt', (g) => conveyor(g, 4, (it) => { bx(it, 0.42, 0.08, 0.22, CH2, 0, 0, 0, 0.015); bx(it, 0.2, 0.085, 0.225, GLD, 0.11, 0, 0, 0.01); bx(it, 0.06, 0.087, 0.226, PUR, -0.02, 0, 0, 0.005); }, 8), ['chocolate', 'bar', 'conveyor', 'kitchen']);

  reg('cf_wall_pipes', 'Wall pipes with valves', (g) => {
    const cm = mt(COP, { metalness: 0.6, roughness: 0.3 });
    rodX(g, 0.12, 4.2, cm, 0, 3.4, 0.15); rodX(g, 0.08, 4.2, mt(0x94a3b8, { metalness: 0.5, roughness: 0.3 }), 0, 3.05, 0.12);
    for (const x of [-1.8, 0, 1.8]) { sp(g, 0.16, cm, x, 3.4, 0.15, 12); cy(g, 0.11, 0.11, 1.4, cm, x, 2.0, 0.15, 12); tor(g, 0.17, 0.035, RED, x, 2.6, 0.32, PI * 2, 14); bx(g, 0.04, 0.2, 0.04, metal(), x, 2.5, 0.27); }
    disc(g, 0.17, 0.06, WHT, 0.9, 3.4, 0.3, 18); bx(g, 0.02, 0.13, 0.02, RED, 0.9, 3.38, 0.34);
  }, ['pipes', 'valves', 'wall', 'factory']);

  /* ---- warehouse ---- */
  function crate(p, x, y, z, s = 0.8, ry = 0, label = '') {
    const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g);
    bx(g, s, s, s, mt(0xd9a066, { roughness: 0.9 }), 0, 0, 0);
    for (const sz of [-1, 1]) { bx(g, s + 0.02, 0.08, 0.04, WDD, 0, 0.04, sz * s / 2); bx(g, s + 0.02, 0.08, 0.04, WDD, 0, s - 0.12, sz * s / 2); bx(g, 0.04, 0.08, s + 0.02, WDD, sz * s / 2, s / 2 - 0.04, 0); }
    if (label) sign(g, label, s * 0.7, s * 0.25, 0, s * 0.5, s / 2 + 0.025, { bg: '#e9be86', fg: '#5b3420' });
    return g;
  }
  reg('cf_storage_rack', 'Tall storage rack with sacks', (g) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.1, 4.0, 0.1, 0x2563eb, sx * 1.75, 0, sz * 0.48);
    const levels = [0.12, 1.4, 2.68]; for (const y of [...levels, 3.94]) { for (const sz of [-1, 1]) bx(g, 3.6, 0.12, 0.08, ORG, 0, y - 0.06, sz * 0.48); bx(g, 3.5, 0.05, 1.0, WOD, 0, y, 0); }
    const S = [['COCOA', 0x9a6b45, '#5b3420'], ['SUGAR', 0xf1ede4, '#db2777'], ['MILK', 0xe0f2fe, '#1d4ed8'], ['NUTS', 0xd6b57f, '#7c2d12']];
    for (let i = 0; i < 3; i++) crate(g, -1.2 + i * 1.2, levels[0] + 0.05, 0, 0.85, 0, ['CANDY', 'COCOA', 'NUTS'][i]);
    for (let l = 1; l < 3; l++) for (let i = 0; i < 4; i++) { const s = S[(i + l) % 4]; sack(g, s[0], s[1], s[2], -1.3 + i * 0.86, levels[l] + 0.025, 0.05, 1.05); }
    for (let i = 0; i < 3; i++) bx(g, 0.9, 0.5, 0.7, [PNK, YEL, TEA][i], -1.1 + i * 1.1, 3.97, 0, 0.04);
  }, ['warehouse', 'rack', 'shelf', 'sacks', 'storage']);
  reg('cf_crate_stack', 'Stack of wooden crates', (g) => { crate(g, -0.45, 0, 0, 0.85, 0.05, 'COCOA'); crate(g, 0.45, 0, 0.05, 0.85, -0.08, 'SUGAR'); crate(g, 0, 0.85, 0, 0.85, 0.2, 'NUTS'); }, ['crate', 'box', 'warehouse', 'storage']);
  reg('cf_milk_cans', 'Milk cans', (g) => {
    [[-0.3, 0], [0.3, 0.05], [0, -0.45]].forEach(([x, z]) => { cy(g, 0.22, 0.22, 0.55, metal(0xe5e7eb), x, 0, z, 18); cy(g, 0.12, 0.22, 0.18, metal(0xe5e7eb), x, 0.55, z, 18); cy(g, 0.12, 0.12, 0.12, metal(0xe5e7eb), x, 0.73, z, 14); cy(g, 0.15, 0.15, 0.06, BLU, x, 0.85, z, 14); cy(g, 0.225, 0.225, 0.1, BLU, x, 0.3, z, 18); for (const s of [-1, 1]) tor(g, 0.07, 0.015, metal(), x + s * 0.2, 0.62, z, PI, 8).rotation.set(0, PI / 2, s * PI / 2); });
    sign(g, 'MILK', 0.3, 0.12, -0.3, 0.36, 0.226, { bg: '#ffffff', fg: '#1d4ed8' });
  }, ['milk', 'can', 'churn', 'warehouse', 'dairy']);
  reg('cf_forklift', 'Little forklift', (g) => {
    bx(g, 1.1, 0.7, 1.5, YEL, 0, 0.25, -0.1, 0.12); bx(g, 1.0, 0.5, 0.45, DRK, 0, 0.35, -0.85, 0.08);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = rodX(g, 0.25, 0.22, 0x1f2937, sx * 0.55, 0.25, sz * 0.5 - 0.1, 16); void w; rodX(g, 0.1, 0.24, metal(), sx * 0.55, 0.25, sz * 0.5 - 0.1, 10); }
    bx(g, 0.5, 0.12, 0.5, PUR, 0, 0.95, -0.35, 0.05); bx(g, 0.5, 0.5, 0.1, PUR, 0, 1.0, -0.6, 0.04);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cy(g, 0.03, 0.03, 1.15, DRK, sx * 0.48, 0.95, -0.15 + sz * 0.55, 8); bx(g, 1.05, 0.06, 1.2, ORG, 0, 2.1, -0.15, 0.03);
    rodZ(g, 0.03, 0.3, DRK, 0, 1.3, 0.15); disc(g, 0.15, 0.04, DRK, 0, 1.35, 0.3, 14);
    for (const sx of [-1, 1]) bx(g, 0.08, 2.1, 0.08, DRK, sx * 0.4, 0.1, 0.72);
    for (const sx of [-1, 1]) bx(g, 0.12, 0.05, 0.9, metal(0x9ca3af), sx * 0.25, 0.32, 1.15);
    bx(g, 0.9, 0.12, 0.8, WOD, 0, 0.37, 1.15); crate(g, 0, 0.49, 1.15, 0.7, 0, 'SUGAR');
    sp(g, 0.06, glow(ORG), 0, 2.2, -0.15, 8);
  }, ['forklift', 'warehouse', 'vehicle', 'truck']);
  reg('cf_hand_truck', 'Hand truck with sacks', (g) => {
    for (const sx of [-1, 1]) { const r = bx(g, 0.05, 1.3, 0.05, RED, sx * 0.25, 0.1, -0.15); r.rotation.x = -0.25; rodX(g, 0.14, 0.08, 0x1f2937, sx * 0.3, 0.14, -0.05, 14); }
    rodX(g, 0.03, 0.6, metal(), 0, 1.35, -0.45); bx(g, 0.6, 0.03, 0.3, metal(), 0, 0.02, 0.05);
    sack(g, 'SUGAR', 0xf1ede4, '#db2777', 0, 0.04, -0.05, 0.6, 0); sack(g, 'COCOA', 0x9a6b45, '#5b3420', 0, 0.56, -0.15, 0.55, 0);
  }, ['hand truck', 'trolley', 'warehouse']);
  reg('cf_rolling_ladder', 'Rolling warehouse ladder', (g) => {
    const H = 3.0, L = 0.9, a = Math.atan2(L, H), len = Math.hypot(L, H);
    for (const sx of [-1, 1]) { const r = bx(g, 0.07, len, 0.07, YEL, sx * 0.3, 0, 0); r.position.set(sx * 0.3, H / 2, 0); r.rotation.x = -a; sp(g, 0.08, DRK, sx * 0.3, 0.08, L / 2, 8); sp(g, 0.08, DRK, sx * 0.3, 0.08, -L / 2 - 0.3, 8); bx(g, 0.05, H, 0.05, YEL, sx * 0.3, 0, -L / 2 - 0.3); }
    for (let i = 1; i <= 9; i++) { const y = i * H / 10, z = L / 2 - y / H * L; bx(g, 0.62, 0.04, 0.16, metal(0x9ca3af), 0, y, z); }
    bx(g, 0.66, 0.05, 0.5, metal(0x9ca3af), 0, H, -L / 2 - 0.05); for (const sx of [-1, 1]) cy(g, 0.025, 0.025, 0.8, YEL, sx * 0.3, H, -L / 2 - 0.25, 8); rodX(g, 0.025, 0.62, YEL, 0, H + 0.8, -L / 2 - 0.25);
  }, ['ladder', 'warehouse', 'library']);

  /* ---- machine workshop ---- */
  reg('cf_workbench', 'Workbench with tools', (g) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(g, 0.08, 0.9, 0.08, DRK, sx * 1.1, 0, sz * 0.38); bx(g, 2.2, 0.05, 0.75, metal(0x94a3b8), 0, 0.25, 0);
    bx(g, 2.4, 0.1, 0.9, 0xc9a06a, 0, 0.9, 0, 0.02); bx(g, 2.4, 1.3, 0.05, 0x5eead4, 0, 1.0, -0.42, 0.02);
    const y = 1.6, z = -0.38;
    // spanner, screwdrivers, tape measure on the pegboard
    bx(g, 0.05, 0.4, 0.02, metal(), -0.9, y - 0.2, z); tor(g, 0.07, 0.02, metal(), -0.9, y + 0.25, z, PI * 1.5, 10).rotation.z = -PI / 4;
    [[-0.6, RED], [-0.45, BLU], [-0.3, YEL]].forEach(([x, c]) => { cy(g, 0.03, 0.03, 0.14, c, x, y + 0.05, z, 8); cy(g, 0.008, 0.008, 0.2, metal(), x, y - 0.15, z, 6); });
    disc(g, 0.09, 0.05, YEL, 0.0, y + 0.1, z + 0.02, 14); bx(g, 0.04, 0.24, 0.02, metal(), 0.35, y - 0.1, z); bx(g, 0.2, 0.05, 0.02, metal(), 0.35, y + 0.04, z);
    bx(g, 0.5, 0.25, 0.04, PUR, 0.8, y + 0.2, z + 0.02, 0.02);
    bx(g, 0.5, 0.25, 0.3, RED, 0.7, 1.0, 0.05, 0.04); tor(g, 0.1, 0.02, DRK, 0.7, 1.27, 0.05, PI, 8);
    bx(g, 0.25, 0.18, 0.2, 0x475569, -0.8, 1.0, 0.2, 0.02); bx(g, 0.3, 0.06, 0.12, 0x475569, -0.8, 1.18, 0.2);
    for (let i = 0; i < 5; i++) cy(g, 0.03, 0.03, 0.04, metal(GLD), -0.2 + i * 0.09, 1.0, 0.25, 6);
    gear(g, 0.14, 8, 0.05, metal(0x94a3b8), 0.15, 1.03, 0.1).rotation.x = PI / 2;
  }, ['workbench', 'tools', 'workshop', 'spanner']);
  reg('cf_wall_gears', 'Turning wall gears', (g) => {
    bx(g, 3.4, 2.4, 0.1, 0x334155, 0, 0, 0, 0.04);
    const a = gear(g, 0.95, 12, 0.14, mt(GLD, { metalness: 0.6, roughness: 0.3 }), -0.6, 1.2, 0.14), b = gear(g, 0.56, 7, 0.14, mt(TEA, { metalness: 0.4, roughness: 0.3 }), 0.83, 1.55, 0.14), c = gear(g, 0.45, 6, 0.14, mt(PNK, { metalness: 0.4, roughness: 0.3 }), 0.95, 0.5, 0.14);
    for (const q of [a, b, c]) cy(g, 0.1, 0.1, 0.25, DRK, q.position.x, 0, 0.14, 10).rotation.x = PI / 2;
    g.children.slice(-3).forEach((m, i) => { const q = [a, b, c][i]; m.position.set(q.position.x, q.position.y, 0.2); }); mv(g, a, b, c);
    return (t) => { a.rotation.z = t * 0.5; b.rotation.z = -t * 0.5 * 12 / 7 + 0.2; c.rotation.z = -t * 0.5 * 12 / 6; };
  }, ['gears', 'machine', 'wall', 'workshop', 'cogs']);
  reg('cf_robot_arm', 'Robot arm', (g) => {
    cy(g, 0.55, 0.6, 0.3, DRK, 0, 0, 0, 24); sp(g, 0.06, glow(YEL), 0.45, 0.2, 0.3, 8);
    const yaw = new T.Group(); yaw.position.y = 0.3; g.add(yaw); cy(yaw, 0.35, 0.4, 0.3, ORG, 0, 0, 0, 20);
    const sh = new T.Group(); sh.position.y = 0.45; yaw.add(sh); sp(sh, 0.2, DRK, 0, 0, 0, 14); bx(sh, 0.28, 1.2, 0.28, ORG, 0, 0, 0, 0.08);
    const el = new T.Group(); el.position.y = 1.2; sh.add(el); sp(el, 0.17, DRK, 0, 0, 0, 14); const up = bx(el, 0.22, 1.0, 0.22, YEL, 0, 0, 0, 0.07); void up;
    const hd = new T.Group(); hd.position.y = 1.0; el.add(hd); cy(hd, 0.14, 0.14, 0.15, DRK, 0, 0, 0, 14); for (const s of [-1, 1]) bx(hd, 0.05, 0.25, 0.1, metal(), s * 0.08, 0.12, 0); sp(hd, 0.05, glow(TEA), 0, 0.08, 0.13, 8); mv(g, yaw);
    return (t) => { yaw.rotation.y = Math.sin(t * 0.6) * 0.9; sh.rotation.x = 0.3 + Math.sin(t * 0.9) * 0.25; el.rotation.x = 0.9 + Math.sin(t * 0.9 + 1) * 0.3; hd.rotation.y = t; };
  }, ['robot', 'arm', 'machine', 'workshop']);
  reg('cf_pump_machine', 'Water pump with a pipe to the roof', (g) => {
    bx(g, 1.6, 0.3, 1.2, DRK, 0, 0, 0, 0.05); cy(g, 0.5, 0.55, 1.3, TEA, -0.25, 0.3, 0, 22); hemi(g, 0.5, TEA, -0.25, 1.6, 0, 22);
    bx(g, 0.55, 0.55, 0.6, PUR, 0.45, 0.3, 0, 0.06); const fw = new T.Group(); fw.position.set(0.45, 0.6, 0.38); g.add(fw); tor(fw, 0.26, 0.04, YEL, 0, 0, 0, PI * 2, 18); for (let i = 0; i < 3; i++) bx(fw, 0.5, 0.04, 0.03, YEL, 0, -0.02, 0).rotation.z = i * PI / 3;
    const pm = mt(0x60a5fa, { metalness: 0.4, roughness: 0.3 }); cy(g, 0.15, 0.15, 3.9, pm, -0.25, 1.9, 0, 14); cy(g, 0.22, 0.22, 0.1, metal(), -0.25, 2.6, 0, 14); cy(g, 0.22, 0.22, 0.1, metal(), -0.25, 5.6, 0, 14);
    disc(g, 0.16, 0.06, WHT, -0.25, 1.2, 0.53, 16); const nd = bx(g, 0.02, 0.12, 0.02, RED, -0.25, 1.15, 0.57); tor(g, 0.18, 0.035, RED, -0.25, 2.2, 0.2, PI * 2, 14);
    sign(g, 'PUMP → WATERFALL', 1.0, 0.25, -0.25, 0.8, 0.56, { bg: '#14b8a6', fg: '#ffffff' }); mv(g, fw, nd);
    return (t) => { fw.rotation.z = -t * 3; nd.rotation.z = Math.sin(t * 2) * 0.5; };
  }, ['pump', 'water', 'pipe', 'machine', 'workshop']);
  reg('cf_blueprint_board', 'Blueprint board', (g) => { bx(g, 2.3, 1.5, 0.06, WDD, 0, 0, 0, 0.02); plate(g, blueprintTex(), 2.15, 1.35, 0, 0.75, 0.035); for (const s of [-1, 1]) sp(g, 0.04, RED, s * 1.0, 1.38, 0.05, 8); }, ['blueprint', 'plan', 'wall', 'workshop']);
  reg('cf_conveyor_parts', 'Pile of spare conveyor parts', (g) => {
    for (let i = 0; i < 4; i++) rodZ(g, 0.09, 0.9, metal(), -0.3 + i * 0.2, 0.09, 0); for (let i = 0; i < 3; i++) rodZ(g, 0.09, 0.9, metal(0x94a3b8), -0.2 + i * 0.2, 0.26, 0);
    const roll = cy(g, 0.32, 0.32, 0.5, 0x1f2937, 0.75, 0, 0.1, 20); roll.rotation.x = PI / 2; roll.position.y = 0.32; cy(g, 0.12, 0.12, 0.52, YEL, 0.75, 0.06, 0.1, 12).rotation.x = PI / 2;
    g.children[g.children.length - 1].position.set(0.75, 0.32, 0.1);
    gear(g, 0.35, 8, 0.08, mt(GLD, { metalness: 0.6, roughness: 0.3 }), -0.1, 0.42, 0.25).rotation.x = -PI / 2 + 0.3;
    bx(g, 0.4, 0.25, 0.3, BLU, -0.75, 0, 0.3, 0.03); for (let i = 0; i < 4; i++) cy(g, 0.03, 0.03, 0.06, metal(GLD), -0.85 + (i % 2) * 0.15, 0.25, 0.25 + Math.floor(i / 2) * 0.1, 6);
  }, ['parts', 'conveyor', 'workshop', 'spare']);
  reg('cf_tool_cabinet', 'Rolling tool cabinet', (g) => {
    bx(g, 1.0, 1.1, 0.55, RED, 0, 0.1, 0, 0.05); for (let i = 0; i < 5; i++) { bx(g, 0.9, 0.17, 0.02, 0xdc2626, 0, 0.18 + i * 0.2, 0.28); bx(g, 0.4, 0.03, 0.03, metal(), 0, 0.3 + i * 0.2, 0.3); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) sp(g, 0.06, DRK, sx * 0.4, 0.06, sz * 0.2, 8);
    bx(g, 0.3, 0.1, 0.1, YEL, -0.2, 1.2, 0, 0.02); cy(g, 0.06, 0.06, 0.12, BLU, 0.25, 1.2, 0, 10);
  }, ['tools', 'cabinet', 'workshop']);

  /* ---- office ---- */
  reg('cf_boss_desk', "Mr. Choco's big desk", (g) => {
    const dw = mt(0x6b3a1f, { roughness: 0.4 });
    for (const sx of [-1, 1]) bx(g, 0.6, 0.8, 1.05, dw, sx * 1.0, 0, 0, 0.04); bx(g, 1.5, 0.6, 0.06, PUR, 0, 0.18, 0.47, 0.02); tor(g, 0.16, 0.03, GLD, 0, 0.48, 0.51, PI * 1.6, 16).rotation.z = 0.6;
    bx(g, 2.7, 0.1, 1.25, dw, 0, 0.8, 0, 0.04); bx(g, 2.72, 0.03, 1.27, GLD, 0, 0.79, 0);
    for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) sp(g, 0.035, GLD, sx * 1.0, 0.3 + i * 0.3, 0.54, 8);
    const y = 0.9;
    cy(g, 0.1, 0.12, 0.04, GLD, -1.0, y, -0.3, 14); cy(g, 0.015, 0.015, 0.35, GLD, -1.0, y + 0.04, -0.3, 6); const sh = cy(g, 0.12, 0.12, 0.3, glow(0x22c55e, 0.4), -1.0, y + 0.42, -0.22, 14, false); sh.rotation.x = PI / 2; sh.scale.set(1, 1, 0.5);
    bx(g, 0.4, 0.01, 0.3, WHT, -0.3, y, 0.05); bx(g, 0.38, 0.01, 0.3, 0xfef3c7, -0.28, y + 0.012, 0.07);
    bx(g, 0.45, 0.08, 0.3, PNK, 0.5, y, 0.0, 0.02); for (let i = 0; i < 6; i++) sp(g, 0.04, CH1, 0.36 + (i % 3) * 0.14, y + 0.1, -0.06 + Math.floor(i / 3) * 0.12, 8);
    sign(g, 'MR. CHOCO', 0.5, 0.12, 0.1, y + 0.08, 0.5, { bg: '#facc15', fg: '#5b3420' });
    cy(g, 0.05, 0.05, 0.12, GLD, 1.05, y, 0.3, 10);
  }, ['office', 'desk', 'boss', 'mr choco']);
  reg('cf_boss_chair', 'Fancy velvet boss chair', (g) => {
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2, l = bx(g, 0.06, 0.05, 0.36, GLD, Math.sin(a) * 0.18, 0.04, Math.cos(a) * 0.18); l.rotation.y = a; }
    cy(g, 0.04, 0.04, 0.4, GLD, 0, 0.05, 0, 8); const vel = mt(0x6d28d9, { roughness: 0.85 });
    bx(g, 0.65, 0.16, 0.6, vel, 0, 0.45, 0, 0.07); bx(g, 0.68, 1.1, 0.16, vel, 0, 0.55, -0.3, 0.08); tor(g, 0.2, 0.04, GLD, 0, 1.6, -0.3, PI, 12);
    for (let i = 0; i < 6; i++) sp(g, 0.025, GLD, -0.15 + (i % 3) * 0.15, 0.95 + Math.floor(i / 3) * 0.3, -0.21, 6);
    for (const sx of [-1, 1]) bx(g, 0.08, 0.06, 0.5, GLD, sx * 0.36, 0.78, 0, 0.02);
  }, ['office', 'chair', 'boss', 'throne']);
  reg('cf_bookshelf', 'Tall bookshelf', (g) => {
    const w = mt(0x7a4426, { roughness: 0.6 }); for (const sx of [-1, 1]) bx(g, 0.07, 2.6, 0.45, w, sx * 0.88, 0, 0); bx(g, 1.8, 2.6, 0.04, CH1, 0, 0, -0.21); bx(g, 1.84, 0.08, 0.48, w, 0, 2.6, 0, 0.02);
    const rnd = seeded(17), cols = [PUR, PNK, TEA, YEL, RED, BLU, ORG, GRN, 0x1e3a8a];
    for (let s = 0; s < 5; s++) { const y = 0.05 + s * 0.52; bx(g, 1.72, 0.04, 0.42, w, 0, y, 0); let x = -0.8; while (x < 0.72) { const bw = 0.06 + rnd() * 0.06, bh = 0.28 + rnd() * 0.14; if (rnd() < 0.08 && x < 0.5) { const b = bx(g, bw, bh, 0.28, cols[Math.floor(rnd() * 9)], x + 0.12, y + 0.04, 0, 0.01); b.rotation.z = -0.35; x += 0.25; continue; } bx(g, bw, bh, 0.3, cols[Math.floor(rnd() * 9)], x + bw / 2, y + 0.04, 0.02, 0.008); x += bw + 0.008; } }
  }, ['office', 'bookshelf', 'books', 'library']);
  [['cf_portrait_choco', "Portrait of Mr. Choco", 'choco'], ['cf_painting_river', 'Chocolate river painting', 'river']].forEach(([id, name, k]) => reg(id, name, (g) => { bx(g, 1.15, 1.42, 0.08, mt(GLD, { metalness: 0.5, roughness: 0.3 }), 0, 0, 0, 0.03); plate(g, portraitTex(k), 0.95, 1.2, 0, 0.71, 0.045); }, ['painting', 'portrait', 'wall', 'office']));
  reg('cf_trophy_cabinet', 'Chocolate trophy cabinet', (g) => {
    const w = mt(0x6b3a1f, { roughness: 0.45 }); bx(g, 1.7, 0.4, 0.55, w, 0, 0, 0, 0.03); bx(g, 1.7, 0.08, 0.55, w, 0, 2.1, 0, 0.03); for (const sx of [-1, 1]) bx(g, 0.06, 1.7, 0.55, w, sx * 0.82, 0.4, 0); bx(g, 1.6, 1.7, 0.03, PUR, 0, 0.4, -0.25);
    bx(g, 1.6, 1.7, 0.02, glass(0xffffff, 0.18), 0, 0.4, 0.26);
    const gm = mt(GLD, { metalness: 0.7, roughness: 0.25 });
    for (let s = 0; s < 3; s++) { const y = 0.4 + s * 0.58; bx(g, 1.6, 0.03, 0.5, glass(0xffffff, 0.4), 0, y, 0); for (let i = 0; i < 3; i++) { const x = -0.5 + i * 0.5; if ((s + i) % 2) { bx(g, 0.3, 0.06, 0.14, CH2, x, y + 0.03, 0, 0.01); bx(g, 0.18, 0.065, 0.145, gm, x + 0.05, y + 0.03, 0, 0.01); } else { cy(g, 0.07, 0.08, 0.05, CH1, x, y + 0.03, 0, 12); cy(g, 0.02, 0.02, 0.1, gm, x, y + 0.08, 0, 8); cy(g, 0.11, 0.05, 0.16, gm, x, y + 0.18, 0, 14); for (const sd of [-1, 1]) tor(g, 0.04, 0.012, gm, x + sd * 0.11, y + 0.28, 0, PI, 8).rotation.z = sd * PI / 2; } } }
  }, ['office', 'trophy', 'cabinet', 'awards']);
  reg('cf_rug', 'Fancy oval rug', (g) => {
    const a = cy(g, 1, 1, 0.02, mt(0x7c3aed, { roughness: 1 }), 0, 0, 0, 40); a.scale.set(1.7, 1, 1.1); a.castShadow = false;
    const b = cy(g, 0.85, 0.85, 0.025, mt(GLD, { roughness: 1 }), 0, 0, 0, 40); b.scale.set(1.7, 1, 1.1); b.castShadow = false;
    const c = cy(g, 0.78, 0.78, 0.03, mt(0xa78bfa, { roughness: 1 }), 0, 0, 0, 40); c.scale.set(1.7, 1, 1.1); c.castShadow = false;
  }, ['rug', 'carpet', 'office', 'floor']);
  reg('cf_choco_fountain', 'Chocolate fountain', (g) => {
    cy(g, 0.5, 0.6, 0.75, WHT, 0, 0, 0, 22); cy(g, 0.65, 0.5, 0.1, metal(), 0, 0.75, 0, 22); const ch = mt(0x5b2e16, { roughness: 0.15 });
    cy(g, 0.6, 0.6, 0.02, ch, 0, 0.85, 0, 22);
    const tiers = [[0.42, 1.25], [0.28, 1.6], [0.16, 1.9]], curt = [];
    tiers.forEach(([r, y], i) => { cy(g, r, r * 0.6, 0.08, metal(), 0, y, 0, 18); curt.push(cy(g, r * 0.95, r + 0.15, y - (i ? tiers[i - 1][1] + 0.08 : 0.86), mt(0x6b3a1f, { roughness: 0.15, transparent: true, opacity: 0.88 }), 0, i ? tiers[i - 1][1] + 0.08 : 0.86, 0, 18, true)); });
    cy(g, 0.03, 0.03, 1.15, metal(), 0, 0.85, 0, 8); sp(g, 0.08, ch, 0, 2.02, 0, 10);
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; if (i % 2) marsh(g, Math.cos(a) * 0.56, 0.85, Math.sin(a) * 0.56, WHT, 0.05); else sp(g, 0.05, RED, Math.cos(a) * 0.56, 0.9, Math.sin(a) * 0.56, 8); }
    mv(g, ...curt);
    return (t) => curt.forEach((m, i) => { m.rotation.y = t * (1 + i * 0.3); m.scale.x = m.scale.z = 1 + Math.sin(t * 4 + i) * 0.03; });
  }, ['chocolate', 'fountain', 'party', 'office']);

  /* ---- control room ---- */
  const BLINK = [PNK, YEL, TEA, GRN].map((c) => new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.6, roughness: 0.3 }));
  reg('cf_control_desk', 'Control console desk', (g) => {
    bx(g, 2.0, 0.85, 0.8, SLT, 0, 0, 0, 0.06); bx(g, 2.02, 0.06, 0.82, PUR, 0, 0.82, 0, 0.02);
    const tp = bx(g, 1.9, 0.06, 0.55, 0x0f172a, 0, 0.9, 0.08, 0.02); tp.rotation.x = 0.28;
    const btn = BLINK; for (let i = 0; i < 10; i++) { const m = BLINK[i % 4]; const b = cy(g, 0.045, 0.045, 0.04, m, -0.75 + (i % 5) * 0.18, 0.92 + (i < 5 ? 0.06 : 0.02), -0.05 + (i < 5 ? -0.05 : 0.12), 10); b.rotation.x = 0.28; }
    for (let i = 0; i < 2; i++) { const lv = cy(g, 0.015, 0.015, 0.22, metal(), 0.45 + i * 0.25, 0.94, 0.1, 6); lv.rotation.x = -0.4; sp(g, 0.045, [RED, YEL][i], 0.45 + i * 0.25, 1.15, 0.03, 10); }
    for (let i = 0; i < 2; i++) { bx(g, 0.84, 0.54, 0.06, 0x0f172a, -0.45 + i * 0.9, 1.0, -0.3, 0.03); plate(g, screenTex(['graph', 'ok'][i]), 0.76, 0.46, -0.45 + i * 0.9, 1.27, -0.265, 0, 0.8); cy(g, 0.04, 0.04, 0.12, DRK, -0.45 + i * 0.9, 0.88, -0.3, 8); }
    return (t) => btn.forEach((m, i) => { m.emissiveIntensity = (Math.sin(t * 3 + i * 1.7) > 0.2) ? 1.0 : 0.25; });
  }, ['control', 'console', 'desk', 'screens', 'buttons']);
  function monitor(g, kind, w = 2.6, h = 1.6) { bx(g, w, h, 0.12, SLT, 0, 0, 0, 0.05); plate(g, screenTex(kind), w - 0.16, h - 0.16, 0, h / 2, 0.065, 0, 0.85); }
  reg('cf_big_monitor', 'Big wall monitor (factory map)', (g) => monitor(g, 'map'), ['monitor', 'screen', 'control', 'map']);
  reg('cf_operator_chair', 'Operator swivel chair', (g) => {
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2, l = bx(g, 0.05, 0.04, 0.3, DRK, Math.sin(a) * 0.15, 0.04, Math.cos(a) * 0.15); l.rotation.y = a; }
    cy(g, 0.035, 0.035, 0.38, metal(), 0, 0.05, 0, 8); bx(g, 0.5, 0.1, 0.48, TEA, 0, 0.43, 0, 0.05); bx(g, 0.48, 0.55, 0.08, TEA, 0, 0.58, -0.24, 0.04); bx(g, 0.3, 0.06, 0.02, YEL, 0, 0.95, -0.2);
  }, ['chair', 'office', 'control', 'swivel']);
  reg('cf_lever_panel', 'Big lever panel', (g) => {
    bx(g, 1.4, 2.0, 0.45, 0x475569, 0, 0, 0, 0.06); bx(g, 1.2, 0.5, 0.02, 0x0f172a, 0, 1.35, 0.23); plate(g, screenTex('pipes'), 1.1, 0.44, 0, 1.6, 0.245, 0, 0.8);
    const lv = []; for (let i = 0; i < 3; i++) { const p = new T.Group(); p.position.set(-0.4 + i * 0.4, 0.85, 0.25); g.add(p); cy(p, 0.025, 0.025, 0.4, metal(), 0, 0, 0, 8); sp(p, 0.07, [RED, YEL, GRN][i], 0, 0.42, 0, 12); bx(g, 0.12, 0.5, 0.04, DRK, -0.4 + i * 0.4, 0.6, 0.24); lv.push(p); }
    for (let i = 0; i < 4; i++) sp(g, 0.04, glow(CANDY[i]), -0.45 + i * 0.3, 0.3, 0.24, 8); mv(g, ...lv);
    return (t) => lv.forEach((p, i) => { p.rotation.x = Math.sin(t * 0.8 + i * 2) * 0.5; });
  }, ['control', 'levers', 'panel', 'machine']);

  /* ---- café ---- */
  reg('cf_coffee_machine', 'Coffee machine', (g) => {
    bx(g, 0.62, 0.5, 0.42, metal(0xdc2626), 0, 0, 0, 0.05); bx(g, 0.6, 0.08, 0.4, metal(), 0, 0.5, 0, 0.02); bx(g, 0.5, 0.02, 0.15, metal(), 0, 0.02, 0.18);
    for (const sx of [-1, 1]) { cy(g, 0.05, 0.04, 0.08, metal(), sx * 0.14, 0.3, 0.22, 10); cy(g, 0.05, 0.04, 0.08, WHT, sx * 0.14, 0.04, 0.2, 10); }
    for (let i = 0; i < 3; i++) cy(g, 0.045, 0.035, 0.08, [PNK, YEL, TEA][i], -0.15 + i * 0.15, 0.58, 0, 10);
    disc(g, 0.05, 0.02, WHT, 0, 0.4, 0.22, 12); sp(g, 0.025, glow(GRN), 0.22, 0.42, 0.21, 6);
  }, ['cafe', 'coffee', 'machine', 'kitchen']);
  reg('cf_cake_display', 'Cake display dome', (g) => { cy(g, 0.06, 0.1, 0.12, WHT, 0, 0, 0, 12); cy(g, 0.26, 0.26, 0.03, WHT, 0, 0.12, 0, 20); cy(g, 0.17, 0.17, 0.1, PPK, 0, 0.15, 0, 18); cy(g, 0.17, 0.17, 0.05, CH2, 0, 0.25, 0, 18); cy(g, 0.17, 0.17, 0.05, WHT, 0, 0.3, 0, 18); sp(g, 0.03, RED, 0, 0.37, 0, 8); hemi(g, 0.25, glass(0xffffff, 0.25), 0, 0.15, 0, 18); sp(g, 0.025, metal(), 0, 0.41, 0, 8); }, ['cafe', 'cake', 'display', 'dessert']);
  reg('cf_cafe_table_set', 'Café table with chairs', (g) => {
    cy(g, 0.05, 0.05, 0.72, DRK, 0, 0, 0, 10); cy(g, 0.25, 0.25, 0.04, DRK, 0, 0, 0, 14); cy(g, 0.48, 0.48, 0.05, CRM, 0, 0.72, 0, 24); tor(g, 0.48, 0.02, PNK, 0, 0.745, 0, PI * 2, 24).rotation.x = PI / 2;
    cy(g, 0.05, 0.04, 0.08, WHT, 0.12, 0.77, 0.05, 10); cy(g, 0.04, 0.04, 0.01, CH2, 0.12, 0.85, 0.05, 10); cy(g, 0.12, 0.12, 0.01, WHT, -0.15, 0.77, -0.05, 14); cy(g, 0.06, 0.06, 0.06, PPK, -0.15, 0.78, -0.05, 12);
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + 0.4, ch = new T.Group(); ch.position.set(Math.sin(a) * 0.78, 0, Math.cos(a) * 0.78); ch.rotation.y = a + PI; g.add(ch); cy(ch, 0.2, 0.2, 0.06, [PNK, YEL, TEA][i], 0, 0.44, 0, 16); for (const sx of [-1, 1]) for (const sz of [-1, 1]) cy(ch, 0.018, 0.018, 0.44, DRK, sx * 0.13, 0, sz * 0.13, 6); bx(ch, 0.36, 0.34, 0.04, [PNK, YEL, TEA][i], 0, 0.5, -0.19, 0.02); }
  }, ['cafe', 'table', 'chairs', 'dining']);
  reg('cf_menu_board', 'Café menu board', (g) => { bx(g, 2.0, 1.66, 0.06, WOD, 0, 0, 0, 0.03); plate(g, menuTex(), 1.86, 1.52, 0, 0.83, 0.035); }, ['cafe', 'menu', 'board', 'wall']);
  reg('cf_hot_choco_dispenser', 'Hot chocolate dispenser', (g) => {
    bx(g, 1.0, 1.1, 0.7, CH2, 0, 0, 0, 0.06); bx(g, 0.7, 0.35, 0.05, 0x3b1f12, 0, 0.3, 0.34); bx(g, 0.5, 0.03, 0.2, metal(), 0, 0.3, 0.4);
    cy(g, 0.05, 0.05, 0.1, metal(), 0, 0.55, 0.38, 8); cy(g, 0.06, 0.045, 0.1, WHT, 0, 0.33, 0.42, 10);
    cy(g, 0.36, 0.36, 0.75, glass(0xffffff, 0.3), 0, 1.1, 0, 20, true); const lq = cy(g, 0.33, 0.33, 0.55, mt(0x6b3a1f, { roughness: 0.15 }), 0, 1.12, 0, 20); cy(g, 0.38, 0.38, 0.08, YEL, 0, 1.85, 0, 20);
    const st = cy(g, 0.015, 0.015, 0.6, metal(), 0, 1.25, 0, 6);
    sign(g, 'HOT CHOCOLATE', 0.9, 0.24, 0, 0.85, 0.355, { bg: '#ec4899', fg: '#ffffff' }, 0, 0.3);
    void lq; mv(g, st); return (t) => { st.rotation.y = t * 4; st.rotation.z = Math.sin(t * 4) * 0.15; };
  }, ['cafe', 'hot chocolate', 'drink', 'dispenser']);
  reg('cf_cafe_counter', 'Café counter', (g) => { bx(g, 4.2, 0.92, 0.85, mt(0x9a6b45), 0, 0, 0, 0.04); bx(g, 4.0, 0.5, 0.02, PUR, 0, 0.2, 0.43); bx(g, 4.3, 0.06, 1.0, CRM, 0, 0.92, 0, 0.02); for (let i = 0; i < 5; i++) sp(g, 0.05, glow(YEL, 0.5), -1.6 + i * 0.8, 0.8, 0.44, 8); }, ['cafe', 'counter', 'shop']);

  /* ---- station / garden / outdoor ---- */
  reg('cf_luggage_cart', 'Luggage cart with suitcases', (g) => {
    bx(g, 1.3, 0.06, 0.75, metal(), 0, 0.22, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) rodX(g, 0.11, 0.06, 0x1f2937, sx * 0.5, 0.11, sz * 0.3, 12);
    for (const sx of [-1, 1]) cy(g, 0.025, 0.025, 0.9, metal(), -0.62, 0.25, sx * 0.3, 8); rodZ(g, 0.03, 0.66, RED, -0.62, 1.15, 0);
    bx(g, 0.8, 0.45, 0.6, PUR, 0.1, 0.28, 0, 0.06); bx(g, 0.6, 0.35, 0.5, YEL, 0.15, 0.73, 0, 0.05); bx(g, 0.3, 0.6, 0.25, TEA, 0.45, 0.73, 0.1, 0.05); tor(g, 0.08, 0.02, DRK, 0.15, 1.08, 0, PI, 8);
  }, ['station', 'luggage', 'cart', 'suitcase', 'travel']);
  reg('cf_timetable_board', 'Train timetable board', (g) => { for (const sx of [-1, 1]) cy(g, 0.05, 0.06, 2.2, DRK, sx * 0.85, 0, 0, 10); bx(g, 1.9, 1.3, 0.12, 0x3b0764, 0, 1.5, 0, 0.05); plate(g, timetableTex(), 1.76, 1.17, 0, 2.15, 0.065, 0, 0.85); plate(g, timetableTex(), 1.76, 1.17, 0, 2.15, -0.065, PI, 0.85); }, ['station', 'timetable', 'board', 'train']);
  reg('cf_vending_machine', 'Snack vending machine', (g) => {
    bx(g, 1.0, 1.9, 0.75, PNK, 0, 0, 0, 0.07); bx(g, 0.62, 1.2, 0.02, 0x1f2937, -0.12, 0.55, 0.37); bx(g, 0.62, 1.2, 0.02, glass(0xffffff, 0.25), -0.12, 0.55, 0.39);
    for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) bx(g, 0.1, 0.16, 0.06, CANDY[(r * 4 + i) % 8], -0.36 + i * 0.16, 0.6 + r * 0.28, 0.36, 0.015);
    bx(g, 0.2, 0.5, 0.03, 0x0f172a, 0.33, 1.1, 0.38); for (let i = 0; i < 6; i++) sp(g, 0.025, glow(YEL, 0.6), 0.28 + (i % 2) * 0.1, 1.2 + Math.floor(i / 2) * 0.1, 0.4, 6);
    bx(g, 0.6, 0.15, 0.03, 0x111827, -0.12, 0.2, 0.38); sign(g, 'SNACKS', 0.8, 0.22, 0, 1.75, 0.38, { bg: '#facc15', fg: '#7c3aed' }, 0, 0.4);
  }, ['vending', 'machine', 'snacks', 'station']);
  reg('cf_candy_flower', 'Candy flower', (g) => {
    const rnd = seeded(23); for (let k = 0; k < 3; k++) { const x = (k - 1) * 0.22, h = 0.5 + k % 2 * 0.2, c = CANDY[k * 3 % 8]; cy(g, 0.015, 0.015, h, 0x16a34a, x, 0, 0, 6); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; sp(g, 0.06, gloss(c), x + Math.cos(a) * 0.08, h, Math.sin(a) * 0.08 * 0.3, 8); } sp(g, 0.05, gloss(YEL), x, h, 0.03, 8); const lf = sp(g, 0.06, 0x22c55e, x + 0.05, h * 0.4, 0, 8); lf.scale.set(1, 0.3, 0.6); void rnd; }
  }, ['flower', 'candy', 'garden', 'plant']);
  reg('cf_garden_sign', 'Chocolate Garden sign', (g) => { for (const sx of [-1, 1]) bx(g, 0.12, 1.4, 0.12, WDD, sx * 0.8, 0, 0); bx(g, 1.9, 0.6, 0.1, WOD, 0, 0.9, 0, 0.04); sign(g, 'CHOCOLATE GARDEN', 1.75, 0.46, 0, 1.2, 0.055, { bg: '#7a4426', fg: '#facc15' }); sign(g, 'CHOCOLATE GARDEN', 1.75, 0.46, 0, 1.2, -0.055, { bg: '#7a4426', fg: '#facc15' }, PI); sp(g, 0.12, gloss(PNK), -0.8, 1.5, 0, 10); sp(g, 0.12, gloss(TEA), 0.8, 1.5, 0, 10); }, ['sign', 'garden', 'chocolate']);
  reg('cf_candy_bench', 'Candy-striped bench', (g) => {
    for (let i = 0; i < 5; i++) bx(g, 1.6, 0.05, 0.09, i % 2 ? WHT : PNK, 0, 0.45, -0.2 + i * 0.1, 0.02);
    for (let i = 0; i < 3; i++) { const b = bx(g, 1.6, 0.09, 0.05, i % 2 ? WHT : PNK, 0, 0.6 + i * 0.13, -0.27, 0.02); b.rotation.x = -0.15; }
    for (const sx of [-1, 1]) { bx(g, 0.07, 0.45, 0.45, PUR, sx * 0.7, 0, 0, 0.02); bx(g, 0.07, 0.5, 0.07, PUR, sx * 0.7, 0.45, -0.25, 0.02); sp(g, 0.07, gloss(YEL), sx * 0.7, 1.0, -0.26, 10); }
  }, ['bench', 'candy', 'garden', 'park', 'seat']);
  reg('cf_giant_lollipop', 'Giant lollipop', (g) => {
    cy(g, 0.09, 0.09, 3.0, WHT, 0, 0, 0, 12); const top = new T.Group(); top.position.y = 3.6; g.add(top); disc(top, 0.85, 0.24, gloss(PNK), 0, 0, 0, 36);
    const sw = swirlTex('#ec4899', '#fff7e6'); for (const sd of [1, -1]) { const f = new T.Mesh(geo('circ0.8', () => new T.CircleGeometry(0.8, 36)), new T.MeshStandardMaterial({ map: sw, roughness: 0.25 })); f.position.z = sd * 0.125; f.rotation.y = sd < 0 ? PI : 0; top.add(f); }
    for (const s of [-1, 1]) { const b = cone(g, 0.14, 0.35, gloss(PUR), s * 0.2, 2.7, 0, 10); b.rotation.z = s * PI / 2; b.position.y = 2.75; } sp(g, 0.08, gloss(PUR), 0, 2.75, 0, 10);
  }, ['lollipop', 'candy', 'giant', 'outdoor']);


  /* ---- extra pieces that fill the middle of the rooms ---- */
  reg('cf_gumball_machine', 'Giant gumball machine', (g) => {
    cy(g, 0.42, 0.5, 0.2, RED, 0, 0, 0, 22); cy(g, 0.28, 0.36, 0.8, RED, 0, 0.2, 0, 22); bx(g, 0.3, 0.3, 0.1, metal(), 0, 0.55, 0.3, 0.03); disc(g, 0.08, 0.05, metal(), 0, 0.7, 0.37, 14);
    cy(g, 0.4, 0.4, 0.12, RED, 0, 1.0, 0, 22); sp(g, 0.62, glass(), 0, 1.68, 0, 24);
    const rnd = seeded(31); for (let i = 0; i < 26; i++) { const a = rnd() * PI * 2, r = Math.sqrt(rnd()) * 0.48, y = 1.18 + rnd() * 0.55 * (1 - r); sp(g, 0.09, CANDY[i % 8], Math.cos(a) * r, y, Math.sin(a) * r, 8); }
    cy(g, 0.14, 0.2, 0.12, RED, 0, 2.28, 0, 14); sp(g, 0.09, YEL, 0, 2.45, 0, 10);
  }, ['candy', 'gumball', 'machine', 'sweets']);
  reg('cf_cotton_candy_machine', 'Cotton candy machine', (g) => {
    bx(g, 1.1, 0.85, 0.8, TEA, 0, 0, 0, 0.08); bx(g, 1.14, 0.12, 0.84, WHT, 0, 0.85, 0, 0.04); for (let i = 0; i < 4; i++) bx(g, 0.2, 0.85, 0.02, WHT, -0.39 + i * 0.26, 0, 0.405);
    cy(g, 0.42, 0.3, 0.3, metal(), 0, 0.97, 0, 22); const fl = new T.Group(); fl.position.y = 1.35; g.add(fl);
    [PPK, LPK, 0xc4b5fd].forEach((c, i) => { const f = sp(fl, 0.26 - i * 0.03, mt(c, { roughness: 1 }), Math.cos(i * 2.1) * 0.12, i * 0.06, Math.sin(i * 2.1) * 0.12, 14); f.scale.y = 0.75; });
    for (let i = 0; i < 2; i++) { cone(g, 0.04, 0.35, WHT, 0.4 + i * 0.12, 0.97, -0.25, 8); const cc = sp(g, 0.13, mt([PPK, 0xbae6fd][i], { roughness: 1 }), 0.4 + i * 0.12, 1.4, -0.25, 12); cc.scale.y = 1.2; }
    sign(g, 'COTTON CANDY', 0.9, 0.22, 0, 0.6, 0.42, { bg: '#ec4899', fg: '#fff' }); mv(g, fl);
    return (t) => { fl.rotation.y = t * 2.5; };
  }, ['candy', 'cotton candy', 'machine', 'fair']);
  reg('cf_marshmallow_tower', 'Tower of giant marshmallows', (g) => {
    const cols = [WHT, PPK, WHT, 0xd9f99d, WHT];
    cols.forEach((c, i) => { const m = cy(g, 0.45 - i * 0.04, 0.45 - i * 0.04, 0.5, mt(c, { roughness: 0.9 }), (i % 2) * 0.06, i * 0.5, 0, 22); m.rotation.y = i; });
    sp(g, 0.12, PNK, 0.04, 2.6, 0, 12);
  }, ['marshmallow', 'tower', 'stack', 'sweets']);
  reg('cf_stand_mixer', 'Giant dough mixer', (g) => {
    cy(g, 0.5, 0.55, 0.25, PNK, 0, 0, 0, 22); bx(g, 0.35, 1.5, 0.35, PNK, 0, 0.25, -0.4, 0.08); bx(g, 0.5, 0.4, 1.0, PNK, 0, 1.6, -0.1, 0.12); sp(g, 0.06, glow(YEL), 0.26, 1.8, -0.3, 8);
    cy(g, 0.45, 0.32, 0.6, metal(), 0, 0.3, 0.05, 24); const dough = sp(g, 0.36, 0xf6e1b8, 0, 0.82, 0.05, 16); dough.scale.y = 0.4;
    const wh = new T.Group(); wh.position.set(0, 1.3, 0.05); g.add(wh); cy(wh, 0.03, 0.03, 0.5, metal(), 0, -0.5, 0, 8); for (let i = 0; i < 3; i++) { const lp = tor(wh, 0.12, 0.015, metal(), 0, -0.5, 0, PI * 2, 12); lp.rotation.y = i * PI / 3; }
    mv(g, wh); return (t) => { wh.rotation.y = t * 3; };
  }, ['bakery', 'mixer', 'dough', 'kitchen', 'machine']);
  reg('cf_cookie_jar', 'Giant cookie jar', (g) => {
    cy(g, 0.42, 0.38, 0.9, glass(), 0, 0, 0, 22); cy(g, 0.46, 0.46, 0.14, PUR, 0, 0.9, 0, 22); sp(g, 0.1, YEL, 0, 1.1, 0, 10);
    for (let i = 0; i < 10; i++) { const k = cy(g, 0.15, 0.15, 0.05, i % 3 ? 0xd9a05b : CH2, Math.cos(i * 2.2) * 0.18, 0.04 + i * 0.08, Math.sin(i * 2.2) * 0.18, 14); k.rotation.set(i * 0.4, 0, i * 0.3); }
    sign(g, 'COOKIES', 0.5, 0.16, 0, 0.55, 0.43, { bg: '#ec4899', fg: '#fff' });
  }, ['bakery', 'cookies', 'jar']);
  reg('cf_cocoa_grinder', 'Cocoa bean grinder', (g) => {
    bx(g, 1.0, 0.9, 0.8, CH3, 0, 0, 0, 0.06); cy(g, 0.5, 0.2, 0.7, mt(COP, { metalness: 0.6, roughness: 0.3 }), 0, 0.9, 0, 20);
    const bean = mt(0x6b3a1f, { roughness: 0.5 }); for (let i = 0; i < 12; i++) { const a = i * 2.39, r = 0.12 + (i % 3) * 0.12, b = sp(g, 0.07, bean, Math.cos(a) * r, 1.6, Math.sin(a) * r, 8); b.scale.set(1, 0.6, 1.4); }
    const cr = new T.Group(); cr.position.set(0.52, 0.6, 0); g.add(cr); rodX(cr, 0.03, 0.15, metal(), 0.07, 0, 0); bx(cr, 0.04, 0.4, 0.04, metal(), 0.15, -0.02, 0); sp(cr, 0.06, RED, 0.15, 0.38, 0, 10);
    bx(g, 0.5, 0.08, 0.35, metal(), 0, 0.15, 0.55); cy(g, 0.14, 0.12, 0.1, CH1, 0, 0.23, 0.55, 14); sign(g, 'COCOA', 0.6, 0.18, 0, 0.6, 0.41, { bg: '#facc15', fg: '#5b3420' });
    mv(g, cr); return (t) => { cr.rotation.x = t * 2; };
  }, ['chocolate', 'cocoa', 'grinder', 'kitchen']);
  reg('cf_choco_bar_stack', 'Stack of giant chocolate bars', (g) => {
    for (let l = 0; l < 6; l++) for (let i = 0; i < 2; i++) { const r = l % 2 ? PI / 2 : 0, o = (i - 0.5) * 0.42; const x = r ? 0 : o, z = r ? o : 0, g2 = new T.Group(); g2.position.set(x, l * 0.13, z); g2.rotation.y = r; g.add(g2); bx(g2, 0.85, 0.12, 0.4, CH2, 0, 0, 0, 0.02); bx(g2, 0.45, 0.125, 0.405, [GLD, PUR, PNK][(l + i) % 3], 0.2, 0, 0, 0.02); }
  }, ['chocolate', 'bars', 'stack', 'kitchen']);
  reg('cf_pallet_sacks', 'Pallet of sacks', (g) => {
    bx(g, 1.4, 0.14, 1.1, WOD, 0, 0, 0); for (let i = -1; i <= 1; i++) bx(g, 1.4, 0.04, 0.12, WDD, 0, 0.14, i * 0.45);
    const S = [['COCOA', 0x9a6b45, '#5b3420'], ['SUGAR', 0xf1ede4, '#db2777'], ['NUTS', 0xd6b57f, '#7c2d12'], ['MILK', 0xe0f2fe, '#1d4ed8']];
    S.forEach((q, i) => sack(g, q[0], q[1], q[2], (i % 2 - 0.5) * 0.65, 0.18, (Math.floor(i / 2) - 0.5) * 0.5, 0.75, i * 0.3));
    sack(g, 'COCOA', 0x9a6b45, '#5b3420', 0, 0.82, 0, 0.75, 0.2);
  }, ['warehouse', 'pallet', 'sacks', 'ingredient']);
  reg('cf_sofa', 'Velvet sofa', (g) => {
    const v = mt(0x6d28d9, { roughness: 0.85 }); bx(g, 2.0, 0.42, 0.85, v, 0, 0.08, 0, 0.1); bx(g, 2.0, 0.6, 0.25, v, 0, 0.45, -0.32, 0.1); for (const sx of [-1, 1]) bx(g, 0.25, 0.65, 0.85, v, sx * 0.95, 0.08, 0, 0.1);
    for (const sx of [-1, 1]) bx(g, 0.8, 0.14, 0.6, mt(0x8b5cf6, { roughness: 0.85 }), sx * 0.42, 0.5, 0.05, 0.06); bx(g, 0.4, 0.35, 0.12, YEL, -0.55, 0.62, -0.15, 0.08); bx(g, 0.4, 0.35, 0.12, PNK, 0.55, 0.62, -0.15, 0.08);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cy(g, 0.04, 0.03, 0.08, GLD, sx * 0.9, 0, sz * 0.35, 8);
  }, ['sofa', 'couch', 'office', 'living room']);
  reg('cf_coffee_table', 'Low coffee table with sweets', (g) => {
    cy(g, 0.5, 0.5, 0.06, mt(0x6b3a1f, { roughness: 0.4 }), 0, 0.38, 0, 24); cy(g, 0.08, 0.15, 0.38, GLD, 0, 0, 0, 12);
    cy(g, 0.2, 0.2, 0.02, WHT, 0, 0.44, 0, 16); for (let i = 0; i < 5; i++) sp(g, 0.035, CH1, Math.cos(i * 1.26) * 0.12, 0.48, Math.sin(i * 1.26) * 0.12, 8);
    cy(g, 0.05, 0.04, 0.09, WHT, 0.3, 0.44, 0.1, 10); cy(g, 0.04, 0.04, 0.01, CH2, 0.3, 0.53, 0.1, 10);
  }, ['table', 'coffee table', 'office', 'living room']);
  reg('cf_pendant_lamp', 'Hanging pendant lamp', (g) => { cy(g, 0.01, 0.01, 1.0, DRK, 0, 0.3, 0, 6); cone(g, 0.28, 0.3, YEL, 0, 0.05, 0, 18); sp(g, 0.1, glow(0xfff1c9), 0, 0.03, 0, 10); }, ['lamp', 'light', 'ceiling', 'cafe']);
  reg('cf_cupcake_tower', 'Cupcake tower', (g) => {
    cy(g, 0.02, 0.02, 0.6, metal(), 0, 0, 0, 6); [[0.3, 0.02], [0.22, 0.24], [0.14, 0.46]].forEach(([r, y], k) => { cy(g, r, r, 0.015, WHT, 0, y, 0, 18); const n = 6 - k * 2; for (let i = 0; i < n; i++) { const a = i / n * PI * 2, x = Math.cos(a) * r * 0.65, z = Math.sin(a) * r * 0.65; cy(g, 0.045, 0.035, 0.05, [PNK, TEA, YEL][i % 3], x, y + 0.015, z, 10); sp(g, 0.045, [CRM, PPK, 0xc4b5fd][(i + k) % 3], x, y + 0.08, z, 8); } });
  }, ['cupcake', 'cafe', 'dessert', 'party']);
  reg('cf_floor_globe', 'Big floor globe', (g) => {
    const w = mt(0x6b3a1f, { roughness: 0.4 }); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2, l = bx(g, 0.06, 0.6, 0.06, w, Math.sin(a) * 0.25, 0, Math.cos(a) * 0.25); l.rotation.z = Math.sin(a) * 0.2; l.rotation.x = -Math.cos(a) * 0.2; }
    tor(g, 0.32, 0.03, w, 0, 0.6, 0, PI * 2, 24).rotation.x = PI / 2; sp(g, 0.42, 0x38bdf8, 0, 1.0, 0, 24);
    for (const [a, b, s2] of [[0.3, 0.2, 0.2], [2.0, -0.1, 0.25], [3.6, 0.4, 0.16], [4.8, -0.35, 0.14]]) { const c2 = sp(g, s2, 0x22c55e, Math.cos(a) * 0.33 * Math.cos(b), 1.0 + Math.sin(b) * 0.36, Math.sin(a) * 0.33 * Math.cos(b), 10); c2.scale.set(1, 0.7, 0.5); c2.lookAt(0, 1.0, 0); }
    tor(g, 0.48, 0.025, GLD, 0, 1.0, 0, PI * 1.3, 24).rotation.set(0, PI / 2, -PI * 0.65);
  }, ['globe', 'office', 'world', 'map']);

  /* =============================== ROOMS =============================== */
  // floor decal (no collider): a coloured disc or rectangle just above the floor
  function floorDisc(c, r, col, x, z, sx = 1, sz = 1, y = 0.012) { const me = new T.Mesh(geo(`fd${r}`, () => new T.CircleGeometry(r, 40)), mt(col, { roughness: 0.9 })); me.rotation.x = -PI / 2; me.scale.set(sx, sz, 1); me.position.set(x, y, z); me.receiveShadow = true; c.g.add(me); return me; }
  function floorRect(c, w, d, col, x, z, y = 0.012) { const me = new T.Mesh(geo(`fr${w},${d}`, () => new T.PlaneGeometry(w, d)), mt(col, { roughness: 0.9 })); me.rotation.x = -PI / 2; me.position.set(x, y, z); me.receiveShadow = true; c.g.add(me); return me; }
  const wallSign = (c, text, w, h, x, y, z, ry, o) => sign(c.g, text, w, h, x, y, z, o, ry);
  // library glass uses transmission (an extra full-scene render pass) → swap it for plain see-through glass
  const noTransmission = (obj) => { if (obj) obj.traverse((m) => { if (m.isMesh && m.material && m.material.transmission > 0) m.material = glass(); }); return obj; };
  const unmerge = (obj) => { noTransmission(obj); if (obj && obj.userData.movers) { obj.userData.dynamic = false; obj.userData.movers.forEach((m) => { m.userData.dynamic = true; }); } return obj; };
  const P = (c, id, x, z, ry = 0, s = 1, o = {}) => unmerge(c.prop(id, x, o.y || 0, z, ry, s, o));
  const PY = (c, id, x, y, z, ry = 0, s = 1, o = {}) => unmerge(c.prop(id, x, y, z, ry, s, o));
  const W = { n: 0, s: PI, e: -PI / 2, w: PI / 2 };   // ry so a prop's front (+z) faces into the room from that wall

  D.candy_lab = (c, spec) => {
    const hw = spec.w / 2, hd = spec.d / 2;
    floorDisc(c, 2.6, 0xfbcfe8, 0, 0); floorDisc(c, 1.9, 0xf9a8d4, 0, 0, 1, 1, 0.014); floorDisc(c, 1.1, 0xffffff, 0, 0, 1, 1, 0.016);
    floorRect(c, 2.4, hd, 0xfce7f3, 0, hd / 2);
    P(c, 'cf_swirl_machine', 0, -hd + 1.6, 0, 1.1);
    P(c, 'cf_candy_shelf', -4.6, -hd + 0.5, 0); P(c, 'cf_candy_shelf', 4.6, -hd + 0.5, 0);
    P(c, 'cf_syrup_tubes', -hw + 0.6, -3.4, W.w); P(c, 'cf_syrup_tubes', -hw + 0.6, -0.6, W.w);
    P(c, 'cf_lollipop_press', hw - 0.75, -3.6, W.e); P(c, 'cf_lab_bench', hw - 0.65, 0.4, W.e);
    P(c, 'cf_candy_conveyor', -4.4, 4.0, 0); P(c, 'cf_lab_bench', 4.4, hd - 0.7, PI);
    P(c, 'candy_jars', 4.4, hd - 0.7, PI, 1, { y: 0.93, col: false });
    P(c, 'candy_jars', hw - 0.6, 1.1, W.e, 1, { y: 0.93, col: false });
    P(c, 'cf_giant_lollipop', -hw + 0.8, hd - 0.8, 0.6, 0.8); P(c, 'cf_giant_lollipop', hw - 0.8, -hd + 2.2, -0.6, 0.7);
    P(c, 'cf_marshmallow_pile', -hw + 1.2, -hd + 1.0, 0, 0.6);
    P(c, 'cf_gumball_machine', 3.9, 4.0, 0, 1.1); P(c, 'cf_gumball_machine', 5.6, 4.4, 0, 0.8); P(c, 'cf_cotton_candy_machine', -4.0, 0.6, 0.4);
    for (const [x, z, k] of [[-3, -2.5, 0], [3, -2.5, 1], [-3, 2.5, 2], [3, 2.5, 3], [0, -4, 4]]) { const lp = new T.Group(); lp.position.set(x, 3.6, z); c.g.add(lp); cy(lp, 0.01, 0.01, 1.1, WHT, 0, 0.3, 0, 6); disc(lp, 0.3, 0.08, glow(CANDY[k]), 0, 0, 0, 20); c.tick((t) => { lp.rotation.y = t * 0.6 + k; }, lp); }
    wallSign(c, 'CANDY LAB', 3, 0.7, 0, 3.9, -hd + 0.15, 0, { bg: '#ec4899', fg: '#ffffff' });
    P(c, 'zungga_banner', 0, -hd + 0.2, 0, 1, { y: 0, col: false });
    // glowing tubes along the ceiling, from the syrup machines to the swirl machine
    rodZ(c.g, 0.12, 5.6, glow(PNK, 0.6), -hw + 0.45, 4.1, -4.5); rodX(c.g, 0.12, 6.4, glow(TEA, 0.6), -4.0, 4.3, -hd + 0.45); rodZ(c.g, 0.12, 6.0, glow(YEL, 0.6), hw - 0.45, 4.1, -2.5); rodX(c.g, 0.12, 6.4, glow(PUR, 0.6), 4.0, 4.3, -hd + 0.45);
  };

  D.marshmallow_workshop = (c, spec) => {
    const hw = spec.w / 2, hd = spec.d / 2;
    floorDisc(c, 2.5, 0xfdf2f8, 0, 0); floorDisc(c, 1.6, 0xfbcfe8, 0, 0, 1, 1, 0.014);
    P(c, 'cf_marshmallow_puffer', 0, -hd + 1.5, 0); P(c, 'cf_marshmallow_puffer', -4.8, -hd + 1.5, 0); P(c, 'cf_marshmallow_puffer', 4.8, -hd + 1.5, 0);
    P(c, 'cf_marshmallow_conveyor', -hw + 1.0, -0.2, W.w);
    P(c, 'cf_marshmallow_pile', -hw + 1.6, hd - 1.7, 0, 1); P(c, 'cf_marshmallow_pile', 4.8, hd - 1.4, 0, 0.8);
    P(c, 'cf_marshmallow_sack', -4.2, hd - 0.7, 0.3); P(c, 'cf_marshmallow_sack', -3.4, hd - 0.6, -0.4); P(c, 'cf_marshmallow_sack', -3.8, hd - 1.3, 0.1, 0.9);
    P(c, 'cf_marshmallow_sack', hw - 0.6, hd - 2.9, 0); P(c, 'cf_marshmallow_sack', hw - 0.7, hd - 3.7, 0.5);
    // the roasting corner
    floorDisc(c, 1.9, 0xfcd34d, hw - 2.3, 0.4); P(c, 'cf_roasting_stand', hw - 2.3, 0.4, -PI / 2);
    P(c, 'cf_cushion', hw - 0.75, 0.4, 0); P(c, 'cf_cushion', hw - 2.3, -1.3, 0, 0.9); P(c, 'cf_cushion', hw - 2.4, 2.1, 0, 0.9);
    P(c, 'cf_cushion', -3.6, 2.6, 0, 0.8); P(c, 'cf_cushion', -2.8, 3.4, 0, 0.7);
    P(c, 'cf_marshmallow_tower', -3.8, -2.4, 0); P(c, 'cf_marshmallow_tower', 3.4, 4.6, 0.5, 0.8); P(c, 'cf_marshmallow_tower', -2.6, -3.6, 1, 0.6);
    P(c, 'cf_marshmallow_sack', 2.6, -3.6, 0.4); P(c, 'cf_marshmallow_sack', 3.2, -3.0, -0.6, 0.9);
    wallSign(c, 'MARSHMALLOW WORKSHOP', 4, 0.6, 0, 4.0, -hd + 0.15, 0, { bg: '#f9a8d4', fg: '#7c3aed' });
    // fluffy clouds hanging from the ceiling
    for (let i = 0; i < 6; i++) { const x = -5 + (i % 3) * 5, z = -2 + Math.floor(i / 3) * 4.5; for (let k = 0; k < 3; k++) { const s = sp(c.g, 0.45 - k * 0.08, mt(0xffffff, { roughness: 1 }), x + (k - 1) * 0.45, 4.2, z, 14); s.castShadow = false; } }
  };

  D.cookie_bakery = (c, spec) => {
    const hw = spec.w / 2, hd = spec.d / 2;
    floorRect(c, spec.w - 0.4, spec.d - 0.4, 0xf5deb3); for (let i = 0; i < 6; i++) floorRect(c, spec.w - 0.4, 0.5, 0xeccb95, 0, -hd + 1.2 + i * 2.2, 0.014);
    P(c, 'cf_brick_oven', -4.4, -hd + 1.15, 0); P(c, 'cf_brick_oven', 4.4, -hd + 1.15, 0);
    P(c, 'cf_dough_table', 0, -hd + 1.6, 0); P(c, 'cf_giant_cookie_sign', 0, -hd + 0.25, 0, 0.9, { y: 2.6, col: false });
    P(c, 'cf_cookie_rack', -hw + 0.55, -1.6, W.w); P(c, 'cf_cookie_rack', -hw + 0.55, -0.35, W.w);
    P(c, 'cf_cookie_display', hw - 0.65, -0.6, W.e); P(c, 'cash_register', hw - 0.6, -1.5, W.e, 1, { y: 1.45, col: false });
    P(c, 'cf_cookie_conveyor', -4.3, 3.6, 0);
    P(c, 'cf_flour_sack', -hw + 0.6, hd - 0.6, 0.4); P(c, 'cf_flour_sack', -hw + 1.4, hd - 0.55, -0.3); P(c, 'cf_flour_sack', -hw + 0.6, hd - 1.4, 0.2, 0.95);
    P(c, 'cf_dough_table', hw - 1.4, hd - 1.2, PI, 0.85); P(c, 'cf_cookie_tray', hw - 1.6, hd - 1.2, PI, 1, { y: 0.81, col: false });
    P(c, 'cf_stand_mixer', -4.2, 0.8, 0.6); P(c, 'cf_dough_table', 3.8, 3.0, 0); P(c, 'cf_cookie_tray', 3.4, 3.0, 0.2, 1, { y: 0.95, col: false }); P(c, 'cf_cookie_jar', 3.1, -3.0, 0, 1);
    P(c, 'cf_cookie_jar', -3.0, -3.3, 0.5, 0.8);
    P(c, 'birthday_cake', hw - 0.65, 0.2, 0, 0.6, { col: false, y: 1.45 });
    wallSign(c, 'COOKIE BAKERY', 3, 0.6, -hw + 0.15, 3.6, 2.0, PI / 2, { bg: '#b45309', fg: '#fde68a' });
  };

  D.chocolate_kitchen = (c, spec) => {
    const hw = spec.w / 2, hd = spec.d / 2;
    floorRect(c, spec.w - 0.4, spec.d - 0.4, 0xd6b18a); floorDisc(c, 2.4, 0xb98a5e, 0, 0);
    P(c, 'cf_choco_vat', -4.8, -hd + 2.1, 0); P(c, 'cf_choco_vat', 0, -hd + 1.9, 0.5); P(c, 'cf_choco_vat', 4.8, -hd + 2.1, 1);
    P(c, 'cf_wall_pipes', -3.6, -hd + 0.15, 0, 1, { col: false }); P(c, 'cf_wall_pipes', 3.6, -hd + 0.15, 0, 1, { col: false });
    P(c, 'cf_wall_pipes', -hw + 0.15, 1.5, W.w, 1, { col: false }); P(c, 'cf_wall_pipes', hw - 0.15, 1.5, W.e, 1, { col: false });
    P(c, 'cf_tempering_table', -hw + 0.7, 0.5, W.w); P(c, 'cf_tempering_table', hw - 0.7, 0.5, W.e);
    P(c, 'cf_choco_bar_conveyor', -4.6, 5.0, 0); P(c, 'cf_choco_mold_rack', hw - 0.6, 4.6, W.e); P(c, 'cf_choco_mold_rack', hw - 0.6, 6.0, W.e);
    P(c, 'cf_sack_cocoa', -hw + 0.6, hd - 0.7, 0.3); P(c, 'cf_sack_cocoa', -hw + 1.4, hd - 0.6, -0.4); P(c, 'cf_sack_sugar', -hw + 0.6, hd - 1.5, 0.1);
    P(c, 'cf_cocoa_grinder', -4.3, -2.4, 0.5); P(c, 'cf_choco_fountain', 4.2, -2.2, 0); P(c, 'cf_choco_bar_stack', 4.2, 2.6, 0.3); P(c, 'cf_choco_bar_stack', 4.6, 3.6, -0.2, 0.8); P(c, 'cf_sack_cocoa', -3.6, 2.4, 0.3); P(c, 'cf_sack_cocoa', -4.4, 2.8, -0.6);
    P(c, 'chocolate_bar', -hw + 0.7, 0.9, W.w, 1.6, { y: 0.92, col: false });
    wallSign(c, 'CHOCOLATE KITCHEN', 3.6, 0.6, 0, 4.6, -hd + 0.15, 0, { bg: '#5b3420', fg: '#facc15' });
  };

  D.ingredient_warehouse = (c, spec) => {
    const hw = spec.w / 2, hd = spec.d / 2;
    floorRect(c, 2.4, spec.d - 0.4, 0xfacc15, 0, 0); floorRect(c, 2.0, spec.d - 0.4, 0xd8c0a0, 0, 0, 0.014);
    P(c, 'cf_storage_rack', -4.0, -hd + 0.75, 0); P(c, 'cf_storage_rack', 4.0, -hd + 0.75, 0);
    P(c, 'cf_storage_rack', -hw + 0.75, -1.4, W.w); P(c, 'cf_storage_rack', -hw + 0.75, 3.4, W.w);
    P(c, 'cf_storage_rack', hw - 0.75, -1.6, W.e);
    P(c, 'cf_rolling_ladder', -hw + 2.1, -1.4, W.w);
    P(c, 'cf_forklift', 4.4, 3.4, -2.4); P(c, 'cf_crate_stack', hw - 1.0, hd - 1.0, 0.2); P(c, 'cf_crate_stack', -hw + 1.0, hd - 0.9, -0.1, 0.9);
    P(c, 'cf_milk_cans', 2.6, -hd + 2.4, 0); P(c, 'cf_pallet_sacks', 4.0, -2.6, 0.2); P(c, 'cf_pallet_sacks', -4.0, 3.9, -0.15); P(c, 'cf_crate_stack', -3.8, -2.6, 0.4, 0.9); P(c, 'cf_hand_truck', -2.6, hd - 1.2, 0.5);
    P(c, 'cf_sack_cocoa', -2.5, -hd + 2.2, 0.4); P(c, 'cf_sack_nuts', -1.8, -hd + 2.0, -0.3);
    wallSign(c, 'INGREDIENTS', 3, 0.6, 0, 4.9, -hd + 0.15, 0, { bg: '#4d7c3a', fg: '#fef08a' });
  };

  D.machine_workshop = (c, spec) => {
    const hw = spec.w / 2, hd = spec.d / 2;
    floorRect(c, spec.w - 0.4, spec.d - 0.4, 0xcbd5e1); for (let i = -3; i <= 3; i++) floorRect(c, 0.25, 1.6, i % 2 ? 0x1f2937 : YEL, i * 0.3, hd - 1.0, 0.014);
    P(c, 'cf_wall_gears', -1.0, -hd + 0.2, 0, 1, { y: 2.6, col: false });
    P(c, 'cf_workbench', -4.6, -hd + 0.6, 0); P(c, 'cf_pump_machine', hw - 1.0, -hd + 1.0, 0); P(c, 'cf_robot_arm', 1.6, -hd + 1.4, 0);
    P(c, 'cf_workbench', -hw + 0.6, 0.6, W.w); P(c, 'cf_blueprint_board', -hw + 0.18, 3.6, W.w, 1, { y: 2.6, col: false });
    P(c, 'cf_blueprint_board', hw - 0.18, 2.6, W.e, 1, { y: 2.6, col: false });
    P(c, 'cf_tool_cabinet', hw - 0.5, -2.4, W.e); P(c, 'cf_conveyor_parts', hw - 1.0, 0.6, W.e);
    P(c, 'cf_candy_conveyor', 4.6, hd - 1.6, 0, 1); P(c, 'cf_workbench', 4.2, 2.4, PI); P(c, 'cf_swirl_machine', -4.2, 4.2, 0.5, 0.9); P(c, 'cf_tool_cabinet', -2.8, 5.6, 0.3); P(c, 'cf_robot_arm', 4.6, -3.0, -0.8, 0.9); P(c, 'cf_crate_stack', -hw + 1.0, hd - 1.0, 0.3);
    // pipe from the pump along the ceiling, out through the wall (it feeds the aqueduct)
    const pm = mt(0x60a5fa, { metalness: 0.4, roughness: 0.3 }); rodX(c.g, 0.15, 1.2, pm, hw - 0.65, 5.45, -hd + 1.0); sp(c.g, 0.18, pm, hw - 1.25, 5.45, -hd + 1.0, 12);
    wallSign(c, 'MACHINE WORKSHOP', 3.4, 0.55, -1.0, 5.4, -hd + 0.16, 0, { bg: '#3b4a7a', fg: '#fde68a' });
  };

  D.choco_office = (c, spec) => {
    const hw = spec.w / 2, hd = spec.d / 2;
    if (spec.pillar && ZFactory.holed) ZFactory.holed(c, spec.w - 0.4, spec.d - 0.4, { ...spec.pillar, r: spec.pillar.r + 0.05 }, (ww, dd, x, z) => floorRect(c, ww, dd, 0xd9b48a, x, z)); else floorRect(c, spec.w - 0.4, spec.d - 0.4, 0xd9b48a);
    P(c, 'cf_boss_desk', -5.4, -2.2, 0); P(c, 'cf_boss_chair', -5.4, -3.6, 0);
    P(c, 'cf_bookshelf', -7.7, -hd + 0.45, 0); P(c, 'cf_bookshelf', -3.4, -hd + 0.45, 0);
    P(c, 'cf_portrait_choco', -5.4, -hd + 0.18, 0, 1, { y: 2.3, col: false });
    P(c, 'cf_rug', -5.0, 1.4, 0, 1, { col: false });
    P(c, 'cf_floor_globe', -hw + 0.9, 2.4, 0.5, 1.1); P(c, 'cf_sofa', 5.6, -2.7, 0); P(c, 'cf_coffee_table', 5.6, -1.2, 0); P(c, 'cf_rug', 5.6, -1.6, 0, 0.8, { col: false }); P(c, 'plant_pot', -hw + 0.6, hd - 0.6, 0, 1.3); P(c, 'plant_pot', hw - 0.6, hd - 0.6, 0, 1.3);
    P(c, 'cf_trophy_cabinet', hw - 0.45, -1.6, W.e); P(c, 'cf_bookshelf', hw - 1.6, -hd + 0.45, 0);
    P(c, 'cf_painting_river', hw - 0.18, 2.2, W.e, 1, { y: 2.2, col: false });
    P(c, 'cf_choco_fountain', 6.0, 2.6, 0, 0.9);
    P(c, 'cf_rug', 6.0, 2.6, 0, 0.75, { col: false });
    P(c, 'wall_clock', 4.0, hd - 0.2, PI, 1.4, { y: 2.8, col: false });
    P(c, 'zungga_logo', -hw + 0.2, -1.7, W.w, 1, { y: 2.6, col: false });
    wallSign(c, "MR. CHOCO'S OFFICE", 3.2, 0.55, 5.6, 4.2, -hd + 0.15, 0, { bg: '#6d28d9', fg: '#fde68a' });
  };

  D.control_room = (c) => {
    const R = 3.6;
    floorDisc(c, 7.5, 0x3b2a4a, 0, 0); floorDisc(c, 2.6, 0x7c3aed, 0, 0, 1, 1, 0.014); floorDisc(c, 2.2, 0x5b21b6, 0, 0, 1, 1, 0.016);
    for (let i = 0; i < 8; i++) { const a = 0.95 + i * 0.6; PY(c, 'cf_control_desk', Math.sin(a) * R, 0, Math.cos(a) * R, a + PI, 1); if (i % 2 === 0) PY(c, 'cf_operator_chair', Math.sin(a) * (R - 1.0), 0, Math.cos(a) * (R - 1.0), a, 1); }
    // a curved wall of big monitors around the back half
    const kinds = ['graph', 'pipes', 'map', 'train', 'temp', 'ok'];
    for (let i = 0; i < 6; i++) { const a = PI * 0.62 + i * (PI * 0.76 / 5), r = 7.35, g = new T.Group(); g.position.set(Math.sin(a) * r, 2.1, Math.cos(a) * r); g.rotation.y = a + PI; c.g.add(g); monitor(g, kinds[i], 2.4, 1.5); }
    for (let i = 0; i < 6; i++) { const a = PI * 0.62 + i * (PI * 0.76 / 5); c.box(2.0, 1.0, 0.6, Math.sin(a) * 7.0, 0, Math.cos(a) * 7.0, 0x334155, { ry: a + PI, r: 0.05 }); for (let k = 0; k < 3; k++) sp(c.g, 0.05, glow(CANDY[(i + k) % 8]), Math.sin(a) * 6.68 + Math.cos(a) * (k - 1) * 0.5, 0.75, Math.cos(a) * 6.68 - Math.sin(a) * (k - 1) * 0.5, 8); }
    PY(c, 'cf_lever_panel', Math.sin(1.35) * 6.6, 0, Math.cos(1.35) * 6.6, 1.35 + PI); PY(c, 'cf_lever_panel', Math.sin(-1.35) * 6.6, 0, Math.cos(-1.35) * 6.6, -1.35 + PI);
    PY(c, 'cf_big_monitor', 0, 3.75, -7.3, 0, 1.0, { col: false });
    // a slowly turning hologram of the factory above the free centre
    const holo = new T.Group(); holo.position.set(0, 3.4, 0); c.g.add(holo);
    const hm = mt(0x67e8f9, { emissive: 0x22d3ee, emissiveIntensity: 0.9, transparent: true, opacity: 0.55, depthWrite: false });
    tor(holo, 0.9, 0.04, hm, 0, 0, 0, PI * 2, 32).rotation.x = PI / 2; bx(holo, 0.4, 0.5, 0.4, hm, -0.35, -0.2, 0.1); bx(holo, 0.3, 0.8, 0.3, hm, 0.3, -0.3, -0.2); cy(holo, 0.2, 0.25, 0.4, hm, 0.15, -0.2, 0.4, 12);
    void hm;
    c.tick((t) => { holo.rotation.y = t * 0.5; holo.position.y = 3.4 + Math.sin(t * 1.5) * 0.1; }, holo);
  };

  D.workers_cafe = (c, spec) => {
    const hw = spec.w / 2, hd = spec.d / 2;
    { const t = TX.check || (TX.check = ZA.tex((g, w, h) => { for (let i = 0; i < 8; i++) for (let k = 0; k < 8; k++) { g.fillStyle = (i + k) % 2 ? '#e8cfae' : '#f6e7d2'; g.fillRect(i * 32, k * 32, 32, 32); } }, 256, 256)); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(spec.w / 4.4, spec.d / 4.4); const fl = new T.Mesh(new T.PlaneGeometry(spec.w - 0.4, spec.d - 0.4), new T.MeshStandardMaterial({ map: t, roughness: 0.8 })); fl.rotation.x = -PI / 2; fl.position.y = 0.012; fl.receiveShadow = true; c.g.add(fl); }
    P(c, 'cf_cafe_counter', -2.0, -hd + 0.65, 0);
    P(c, 'cf_coffee_machine', -3.3, -hd + 0.55, 0, 1, { y: 0.98, col: false }); P(c, 'cf_cake_display', -1.8, -hd + 0.65, 0, 1, { y: 0.98, col: false }); P(c, 'cf_cake_display', -1.1, -hd + 0.6, 0, 0.9, { y: 0.98, col: false });
    P(c, 'cash_register', -0.3, -hd + 0.65, 0, 1, { y: 0.98, col: false }); P(c, 'cf_cookie_tray', -2.6, -hd + 0.75, 0, 0.9, { y: 0.98, col: false });
    P(c, 'cf_menu_board', -2.0, -hd + 0.18, 0, 1, { y: 2.0, col: false });
    P(c, 'cf_hot_choco_dispenser', 3.2, -hd + 0.55, 0);
    P(c, 'cf_cafe_table_set', -4.1, -1.5, 0.3, 1.1); P(c, 'cf_cafe_table_set', 4.1, -1.6, 1.2, 1.1); P(c, 'cf_cafe_table_set', -4.1, 2.9, 2.0, 1.1); P(c, 'cf_cafe_table_set', 4.1, 2.9, 0.8, 1.1);
    P(c, 'cf_candy_shelf', -hw + 0.45, 0.7, W.w, 0.9); P(c, 'cf_candy_shelf', hw - 0.45, 0.7, W.e, 0.9); P(c, 'cf_cupcake_tower', 0.6, -hd + 0.6, 0, 1, { y: 0.98, col: false });
    for (const [x, z] of [[-4.1, -1.5], [4.1, -1.6], [-4.1, 2.9], [4.1, 2.9], [0, 0.5], [-2, -3.2], [2.4, -3.2]]) PY(c, 'cf_pendant_lamp', x, 3.15, z, 0, 1, { col: false }); P(c, 'cf_cafe_table_set', 5.3, -hd + 1.1, 0.5, 0.85);
    P(c, 'plant_pot', -hw + 0.55, hd - 0.55, 0, 1.3); P(c, 'plant_pot', hw - 0.55, hd - 0.55, 0, 1.3); P(c, 'plant_pot', -hw + 0.55, -hd + 0.55, 0, 1.2);
    P(c, 'wall_clock', -hw + 0.15, 0.5, W.w, 1.2, { y: 3.0, col: false });
    wallSign(c, "WORKERS' CAFÉ", 2.8, 0.55, hw - 0.15, 3.55, 0.5, -PI / 2, { bg: '#d9622b', fg: '#fff7e6' });
  };

  D.express_station = (c) => {   // platform top at y = 0.5
    const y = 0.5;
    PY(c, 'cf_timetable_board', -2.4, y, 0.6, 0, 1); PY(c, 'cf_vending_machine', -3.9, y, -1.2, 0, 1);
    PY(c, 'cf_luggage_cart', 0.6, y, 1.0, 0.3, 1); PY(c, 'cf_luggage_cart', 6.6, y, 1.2, -0.4, 1);
    PY(c, 'plant_pot', -8.0, y, 0.6, 0, 1.2); PY(c, 'plant_pot', 3.6, y, 1.6, 0, 1.1); PY(c, 'plant_pot', 8.0, y, 0.8, 0, 1.2);
    PY(c, 'cf_giant_lollipop', -8.2, y, -1.4, 0.4, 0.5); PY(c, 'cf_sack_cocoa', 1.8, y, -1.5, 0.3, 0.8);
  };

  D.choco_garden = (c) => {
    PY(c, 'cf_candy_bench', -4.15, 0, -2.0, PI / 2 + PI, 1); PY(c, 'cf_candy_bench', -4.15, 0, 2.0, PI / 2 + PI, 1);
    PY(c, 'cf_garden_sign', -0.3, 0, 6.15, 0, 0.9);
    for (const [x, z] of [[-3.5, -6.0], [-1.0, -6.1], [1.6, -6.0], [3.3, -6.0], [-1.0, 2.0], [7.6, 0.4], [-1.0, -2.0], [7.8, -1.8]]) PY(c, 'cf_candy_flower', x, 0, z, x, 2, { col: false });
    PY(c, 'cf_giant_lollipop', -7.8, 0, -5.8, 0.6, 0.6);
  };

  /* ---------------- exterior extras (outside the walls, door side stays free) ---------------- */
  D.candy_lab_ext = (f, spec) => { const hd = spec.d / 2; PY(f, 'cf_giant_lollipop', -3.8, 0, hd + 1.1, 0, 1.3); PY(f, 'cf_giant_lollipop', 3.8, 0, hd + 1.1, 0, 1.1); PY(f, 'cf_candy_flower', -5.4, 0, hd + 0.8, 0, 1.4, { col: false }); PY(f, 'cf_candy_flower', 5.4, 0, hd + 0.8, 1, 1.4, { col: false }); };
  D.marshmallow_workshop_ext = (f, spec) => { const hd = spec.d / 2; PY(f, 'cf_marshmallow_pile', -4.2, 0, hd + 1.2, 0, 1); PY(f, 'cf_marshmallow_sack', 3.6, 0, hd + 0.8, 0.4, 1.2); PY(f, 'cf_marshmallow_sack', 4.5, 0, hd + 1.0, -0.3, 1.1); };
  D.cookie_bakery_ext = (f, spec) => { const hd = spec.d / 2; PY(f, 'cf_giant_cookie_sign', -4.0, 1.0, hd + 1.0, 0, 1.2, { col: false }); f.box(0.2, 1.0, 0.2, -4.0, 0, hd + 1.0, WDD); PY(f, 'cf_flour_sack', 3.6, 0, hd + 0.7, 0.3, 1.1); PY(f, 'cf_flour_sack', 4.4, 0, hd + 0.9, -0.4, 1); };
  D.chocolate_kitchen_ext = (f, spec) => { const hd = spec.d / 2; PY(f, 'cf_sack_cocoa', -3.6, 0, hd + 0.8, 0.2, 1.2); PY(f, 'cf_sack_cocoa', -4.5, 0, hd + 1.0, -0.5, 1.1); PY(f, 'cf_milk_cans', 4.0, 0, hd + 0.9, 0, 1.2); };
  D.ingredient_warehouse_ext = (f, spec) => { const hd = spec.d / 2; PY(f, 'cf_crate_stack', -4.2, 0, hd + 1.0, 0.2, 1); PY(f, 'cf_hand_truck', 3.6, 0, hd + 1.0, -0.5, 1.1); PY(f, 'cf_sack_sugar', 4.8, 0, hd + 0.8, 0.3, 1.1); };
  D.machine_workshop_ext = (f, spec) => { const hd = spec.d / 2; PY(f, 'cf_conveyor_parts', -4.2, 0, hd + 1.0, 0.3, 1); PY(f, 'cf_tool_cabinet', 4.0, 0, hd + 0.8, 0, 1); };
  D.choco_office_ext = (f, spec) => { const hd = spec.d / 2; PY(f, 'plant_pot', -2.9, 0, hd + 0.8, 0, 1.6); PY(f, 'plant_pot', 2.9, 0, hd + 0.8, 0, 1.6); PY(f, 'cf_giant_lollipop', -5.5, 0, hd + 1.0, 0.3, 1.1); };
  D.workers_cafe_ext = (f, spec) => { const hd = spec.d / 2; PY(f, 'cf_menu_board', 6.0, 0, hd + 0.8, 0, 0.7, { y: 0.4 }); f.box(0.12, 0.5, 0.12, 6.0, 0, hd + 0.8, WDD, { col: false }); };
})();
