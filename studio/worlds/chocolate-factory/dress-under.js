/* Zungga Chocolate Factory — room dressing (under floor). ZFactory.dress[<id>] = (c, spec) => { … }
 * "The Forgotten Foundation": ancient, secret, magical and warm — glowing crystals, old machinery that still turns,
 * carved stone. New library props (category 'factory', ids cfu_*) are registered at the top; the rooms below place them.
 * Frames: origin = room centre at floor level, world axes (north −z, east +x). */
(() => {
  'use strict';
  const T = THREE;
  const D = (window.ZFactory = window.ZFactory || {}).dress = window.ZFactory.dress || {};

  // ---------- palette ----------
  const P = { purple: 0x6d28d9, violet: 0x7c3aed, blue: 0x1e3a8a, brown: 0x3b2a20, bronze: 0xb8860b, gold: 0xd4a017, teal: 0x14b8a6, cyan: 0x22d3ee, cream: 0xf5e6c8,
    wood: 0x7a5232, woodDark: 0x4a3220, stone: 0x8f8478, stoneDark: 0x5e554d, copper: 0xb87333, iron: 0x4b4a52, flame: 0xffa133 };

  // ---------- shared materials / geometries ----------
  const MC = new Map();
  const mat = (c, o = {}) => { const k = c + JSON.stringify(o); if (!MC.has(k)) MC.set(k, new T.MeshStandardMaterial({ color: c, roughness: 0.75, ...o })); return MC.get(k); };
  const glow = (c, i = 1.4) => mat(c, { emissive: c, emissiveIntensity: i, roughness: 0.4 });
  const metal = (c, r = 0.35) => mat(c, { metalness: 0.3, roughness: Math.max(0.4, r), emissive: c, emissiveIntensity: 0.12 });
  const GC = new Map();
  const geo = (k, fn) => { if (!GC.has(k)) GC.set(k, fn()); return GC.get(k); };
  const boxG = (w, h, d) => geo(`b${w},${h},${d}`, () => new T.BoxGeometry(w, h, d));
  const cylG = (rt, rb, h, s = 16, open = false) => geo(`c${rt},${rb},${h},${s},${open}`, () => new T.CylinderGeometry(rt, rb, h, s, 1, open));
  const sphG = (r, s = 14) => geo(`s${r},${s}`, () => new T.SphereGeometry(r, s, Math.max(6, Math.round(s * 0.7))));
  const torG = (r, t, rs = 8, ts = 24, arc = Math.PI * 2) => geo(`t${r},${t},${rs},${ts},${arc}`, () => new T.TorusGeometry(r, t, rs, ts, arc));
  const coneG = (r, h, s = 12) => geo(`k${r},${h},${s}`, () => new T.ConeGeometry(r, h, s));
  const octG = (r) => geo(`o${r}`, () => new T.OctahedronGeometry(r, 0));
  const planeG = (w, h) => geo(`p${w},${h}`, () => new T.PlaneGeometry(w, h));
  function add(parent, g, m, x = 0, y = 0, z = 0, o = {}) {
    const me = new T.Mesh(g, m); me.position.set(x, y, z);
    if (o.rx) me.rotation.x = o.rx; if (o.ry) me.rotation.y = o.ry; if (o.rz) me.rotation.z = o.rz; if (o.s) (Array.isArray(o.s) ? me.scale.set(...o.s) : me.scale.setScalar(o.s));
    me.castShadow = !!o.cast; me.receiveShadow = true; parent.add(me); return me;
  }
  const B = (p, w, h, d, m, x, y, z, o) => add(p, boxG(w, h, d), m, x, y, z, o);          // y = centre
  const C = (p, rt, rb, h, m, x, y, z, o = {}) => add(p, cylG(rt, rb, h, o.seg || 16), m, x, y, z, o);
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  // ---------- canvas textures (cached) ----------
  const TX = {};
  const tx = (k, fn) => TX[k] || (TX[k] = fn());
  const glyphTex = (ch, col = '#fde68a') => tx('g' + ch + col, () => ZA.tex((g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 22; g.font = '700 150px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, w / 2, h / 2 + 8); g.fillText(ch, w / 2, h / 2 + 8); }, 256, 256));
  const textTex = (text, o = {}) => tx('t' + text + JSON.stringify(o), () => ZA.tex((g, w, h) => {
    if (o.bg) { g.fillStyle = o.bg; g.beginPath(); g.roundRect(0, 0, w, h, o.radius || 0); g.fill(); } else g.clearRect(0, 0, w, h);
    if (o.border) { g.strokeStyle = o.border; g.lineWidth = 10; g.beginPath(); g.roundRect(10, 10, w - 20, h - 20, o.radius || 8); g.stroke(); }
    g.fillStyle = o.fg || '#f5d77a'; g.shadowColor = o.glow || 'rgba(0,0,0,0)'; g.shadowBlur = o.glow ? 16 : 0; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = String(text).split('\n'), size = o.size || 70;
    lines.forEach((ln, i) => { ZA.fitText(g, ln, w * 0.86, i === 0 ? size : size * 0.6, 800); g.fillText(ln, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 0.95 + 4); });
  }, o.w || 512, o.h || 160));
  const webTex = () => tx('web', () => ZA.tex((g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(235,235,245,0.75)'; g.lineWidth = 2; const cx = 8, cy = 8, n = 9;
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * w, cy + Math.sin(a) * h); g.stroke(); }
    for (let r = 30; r < w; r += 28) { g.beginPath(); for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2, rr = r + Math.sin(i * 2.1) * 4; const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; if (i) g.quadraticCurveTo(cx + Math.cos(a - 0.08) * (rr - 6), cy + Math.sin(a - 0.08) * (rr - 6), x, y); else g.moveTo(x, y); } g.stroke(); }
  }, 256, 256));
  const veinTex = () => tx('vein', () => { const r = rng(7); const t = ZA.tex((g, w, h) => {
    g.clearRect(0, 0, w, h); g.lineCap = 'round';
    for (let k = 0; k < 9; k++) { const c = ['#a855f7', '#22d3ee', '#f0abfc', '#5eead4'][k % 4]; g.strokeStyle = c; g.shadowColor = c; g.shadowBlur = 10; g.lineWidth = 1.5 + r() * 2.5; g.globalAlpha = 0.5 + r() * 0.4;
      let x = r() * w, y = h * (0.75 + r() * 0.25); g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 4; s++) { const nx = x + (r() - 0.5) * 160, ny = y - 30 - r() * 50; g.quadraticCurveTo(x + (r() - 0.5) * 120, (y + ny) / 2, nx, ny); x = nx; y = ny;
        if (r() < 0.5) { g.moveTo(x, y); g.quadraticCurveTo(x + (r() - 0.5) * 60, y - 20, x + (r() - 0.5) * 90, y - 30 - r() * 30); g.moveTo(x, y); } }
      g.stroke(); g.globalAlpha = 0.9; g.fillStyle = c; for (let d = 0; d < 3; d++) { g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 4, 0, 7); g.fill(); } }
  }, 512, 256); t.wrapS = T.RepeatWrapping; return t; });
  const runeStripTex = (col = '#c4b5fd') => tx('rs' + col, () => { const t = ZA.tex((g, w, h) => {
    g.clearRect(0, 0, w, h); const ch = 'ᚠᚱᛟᚨᛉᛞ☀☾★♦✿♥ᚲᛗᛊᛏ'; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 14; g.font = '700 64px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 16; i++) g.fillText(ch[i], (i + 0.5) * w / 16, h / 2 + 4);
    g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 6); g.lineTo(w, 6); g.moveTo(0, h - 6); g.lineTo(w, h - 6); g.stroke();
  }, 1024, 96); t.wrapS = T.RepeatWrapping; return t; });
  const carvingTex = (kind) => tx('cv' + kind, () => ZA.tex((g, w, h) => {
    g.fillStyle = '#5a4f47'; g.fillRect(0, 0, w, h); const r = rng(kind.length * 31);
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${70 + r() * 40 | 0},${60 + r() * 30 | 0},${52 + r() * 30 | 0},0.6)`; g.fillRect(r() * w, r() * h, 3 + r() * 9, 3 + r() * 9); }
    g.strokeStyle = '#3a322c'; g.lineWidth = 14; g.strokeRect(12, 12, w - 24, h - 24);
    const line = (c) => { g.strokeStyle = c; g.shadowColor = c; g.shadowBlur = 16; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; };
    if (kind === 'tree') {   // the first cocoa tree
      line('#5eead4'); g.beginPath(); g.moveTo(w / 2, h - 60); g.lineTo(w / 2, h * 0.45); g.stroke();
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(w / 2, h * 0.6); g.quadraticCurveTo(w / 2 + s * 60, h * 0.5, w / 2 + s * 110, h * 0.42); g.stroke(); }
      g.beginPath(); g.arc(w / 2, h * 0.33, 120, 0, Math.PI * 2); g.stroke();
      line('#fbbf24'); for (const [x, y] of [[-60, 0.36], [50, 0.3], [0, 0.22], [80, 0.4], [-90, 0.28]]) { g.beginPath(); g.ellipse(w / 2 + x, h * y, 14, 24, 0.3, 0, 7); g.stroke(); }
      g.beginPath(); g.arc(w - 70, 70, 30, 0, 7); g.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(w - 70 + Math.cos(a) * 40, 70 + Math.sin(a) * 40); g.lineTo(w - 70 + Math.cos(a) * 54, 70 + Math.sin(a) * 54); g.stroke(); }
      line('#c4b5fd'); for (const x of [0.18, 0.82]) { g.beginPath(); g.arc(w * x, h - 150, 18, 0, 7); g.moveTo(w * x, h - 132); g.lineTo(w * x, h - 80); g.moveTo(w * x - 26, h - 115); g.lineTo(w * x + 26, h - 115); g.moveTo(w * x, h - 80); g.lineTo(w * x - 18, h - 50); g.moveTo(w * x, h - 80); g.lineTo(w * x + 18, h - 50); g.stroke(); }
    } else if (kind === 'machine') {   // the first chocolate machine
      line('#fbbf24'); for (const [x, y, rr] of [[0.35, 0.35, 70], [0.62, 0.5, 46], [0.42, 0.66, 36]]) { g.beginPath(); g.arc(w * x, h * y, rr, 0, 7); g.stroke(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; g.beginPath(); g.moveTo(w * x + Math.cos(a) * rr, h * y + Math.sin(a) * rr); g.lineTo(w * x + Math.cos(a) * (rr + 14), h * y + Math.sin(a) * (rr + 14)); g.stroke(); } }
      line('#5eead4'); g.beginPath(); g.moveTo(40, h - 80); g.lineTo(w - 40, h - 80); g.stroke(); for (let i = 0; i < 4; i++) g.strokeRect(70 + i * 90, h - 130, 50, 30);
    } else {   // stars & moon: the founders' night sky
      line('#c4b5fd'); g.beginPath(); g.arc(w / 2, h * 0.3, 70, 0.6, Math.PI * 2 - 0.6); g.stroke();
      line('#fde68a'); const star = (x, y, rr) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? rr * 0.45 : rr; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); g.stroke(); };
      star(w * 0.22, h * 0.55, 34); star(w * 0.78, h * 0.5, 40); star(w * 0.5, h * 0.72, 54); star(w * 0.3, h * 0.85, 20); star(w * 0.72, h * 0.86, 24);
    }
    g.shadowBlur = 0; g.fillStyle = '#d6c7a8'; g.font = '700 30px serif'; g.textAlign = 'center'; g.fillText('ᚠ ᚱ ᛟ ᚨ ᛉ ᛞ ᚲ', w / 2, h - 26);
  }, 512, 640));
  const footTex = () => tx('foot', () => ZA.tex((g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = '#facc15'; g.shadowColor = '#fbbf24'; g.shadowBlur = 10;
    g.beginPath(); g.ellipse(w / 2, h * 0.62, w * 0.26, h * 0.3, 0, 0, 7); g.fill();
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(w * (0.3 + i * 0.1), h * (0.22 - Math.sin(i / 4 * Math.PI) * 0.06) + Math.abs(i - 1.5) * 4, w * (0.075 - i * 0.008), 0, 7); g.fill(); }
  }, 64, 128));
  const bannerTex = () => tx('banner', () => ZA.tex((g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5b21b6'); gr.addColorStop(1, '#3b0f80'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#e8b923'; g.lineWidth = 14; g.strokeRect(22, 22, w - 44, h - 44); g.lineWidth = 4; g.strokeRect(44, 44, w - 88, h - 88);
    const cx = w / 2, cy = h * 0.4; g.fillStyle = '#f2c230'; g.shadowColor = '#fde68a'; g.shadowBlur = 24;
    g.beginPath(); g.arc(cx, cy, 150, 0, 7); g.lineWidth = 12; g.strokeStyle = '#f2c230'; g.stroke();
    g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 50 : 125; g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } g.closePath(); g.fill();
    g.font = '800 92px "Fredoka", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ZUNGGA', cx, h * 0.68);
    g.shadowBlur = 0; g.font = '700 40px "Fredoka", system-ui, sans-serif'; g.fillStyle = '#fde68a'; g.fillText('THE FOUNDERS · EST. 1888', cx, h * 0.78);
    g.fillStyle = '#e8b923'; g.beginPath(); g.moveTo(22, h - 22); g.lineTo(w / 2, h - 90); g.lineTo(w - 22, h - 22); g.closePath(); g.globalAlpha = 0.35; g.fill(); g.globalAlpha = 1;
  }, 512, 700));
  const plaqueTex = () => tx('plaque', () => ZA.tex((g, w, h) => {
    g.fillStyle = '#8f8478'; g.fillRect(0, 0, w, h); const cx = w / 2, cy = h / 2;
    g.strokeStyle = '#d4a017'; g.lineWidth = 10; g.beginPath(); g.arc(cx, cy, w * 0.46, 0, 7); g.stroke(); g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, w * 0.33, 0, 7); g.stroke();
    g.fillStyle = '#f2c230'; g.shadowColor = '#fde68a'; g.shadowBlur = 12; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 34 : 86; g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } g.closePath(); g.fill();
    g.font = '700 30px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; const msg = '· HERE THE FIRST ZUNGGA CHOCOLATE WAS MADE · 1888 · SIX FRIENDS · ONE DREAM ';
    for (let i = 0; i < msg.length; i++) { const a = (i / msg.length) * Math.PI * 2 - Math.PI / 2; g.save(); g.translate(cx + Math.cos(a) * w * 0.4, cy + Math.sin(a) * w * 0.4); g.rotate(a + Math.PI / 2); g.fillText(msg[i], 0, 0); g.restore(); }
  }, 512, 512));
  const beltTex = () => tx('belt', () => { const t = ZA.tex((g, w, h) => { g.fillStyle = '#2b2321'; g.fillRect(0, 0, w, h); g.fillStyle = '#4a3c36'; for (let i = 0; i < 8; i++) g.fillRect(i * w / 8, 0, w / 16, h); }, 256, 32); t.wrapS = T.RepeatWrapping; t.repeat.set(4, 1); return t; });
  const sparkTex = () => tx('spark', () => ZA.tex((g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(200,180,255,0.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, 64, 64));
  const gaugeTex = () => tx('gauge', () => ZA.tex((g, w, h) => { g.fillStyle = '#f5e6c8'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 4, 0, 7); g.fill(); g.strokeStyle = '#3b2a20'; g.lineWidth = 6; g.stroke(); g.lineWidth = 3; for (let i = 0; i <= 10; i++) { const a = Math.PI * 0.75 + i * Math.PI * 0.15; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * w * 0.38, h / 2 + Math.sin(a) * h * 0.38); g.lineTo(w / 2 + Math.cos(a) * w * 0.3, h / 2 + Math.sin(a) * h * 0.3); g.stroke(); } g.fillStyle = '#b91c1c'; g.beginPath(); g.arc(w / 2 + w * 0.3, h / 2 - h * 0.1, 6, 0, 7); g.fill(); }, 128, 128));

  const decalMat = (map, o = {}) => new T.MeshStandardMaterial({ map, transparent: true, depthWrite: false, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, side: o.side ?? T.FrontSide, emissive: o.emissive ?? 0x000000, emissiveMap: o.emissive ? map : null, emissiveIntensity: o.ei ?? 1 });
  const DM = new Map();
  const decalM = (key, map, o) => { if (!DM.has(key)) DM.set(key, decalMat(map, o)); return DM.get(key); };
  const addBasic = (p, g, map, color, x, y, z, o = {}) => { const m = new T.MeshBasicMaterial({ map, color, transparent: true, depthWrite: false, blending: o.additive === false ? T.NormalBlending : T.AdditiveBlending, side: T.DoubleSide, opacity: o.opacity ?? 1 }); return add(p, g, m, x, y, z, o); };

  // ---------- gear geometry ----------
  function gearGeo(r, teeth, depth) {
    return geo(`gear${r},${teeth},${depth}`, () => {
      const s = new T.Shape(), ri = r * 0.85, st = Math.PI * 2 / teeth;
      for (let i = 0; i < teeth; i++) { const a = i * st; const pts = [[a, ri], [a + st * 0.12, r], [a + st * 0.42, r], [a + st * 0.54, ri]]; pts.forEach(([aa, rr], k) => { const x = Math.cos(aa) * rr, y = Math.sin(aa) * rr; if (i === 0 && k === 0) s.moveTo(x, y); else s.lineTo(x, y); }); }
      s.closePath();
      const hub = new T.Path(); hub.absarc(0, 0, r * 0.1, 0, Math.PI * 2, true); s.holes.push(hub);
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5, h = new T.Path(); h.absarc(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52, r * 0.19, 0, Math.PI * 2, true); s.holes.push(h); }
      const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: Math.min(0.03, depth * 0.3), bevelThickness: Math.min(0.03, depth * 0.3), bevelSegments: 1, curveSegments: 6 });
      g.translate(0, 0, -depth / 2); return g;
    });
  }
  // a gear (axis = local z) with a hub boss; returns the spinning group
  function gear(parent, r, teeth, depth, m, x, y, z) {
    const g = new T.Group(); g.position.set(x, y, z); parent.add(g);
    add(g, gearGeo(r, teeth, depth), m);
    add(g, cylG(r * 0.2, r * 0.2, depth + 0.12, 16), metal(0x6b5a3a), 0, 0, 0, { rx: Math.PI / 2 });
    add(g, cylG(r * 0.08, r * 0.08, depth + 0.2, 10), glow(P.cyan, 1.2), 0, 0, 0, { rx: Math.PI / 2 });
    return g;
  }
  // translucent steam puffs rising from (x, y, z); returns tick(t)
  function steam(parent, x, y, z, n = 4, rise = 1.6, size = 0.28, speed = 0.45, seed = 1) {
    const puffs = [];
    for (let i = 0; i < n; i++) { const m = new T.MeshStandardMaterial({ color: 0xf2efe9, transparent: true, opacity: 0.4, roughness: 1, depthWrite: false }); const me = add(parent, sphG(1, 10), m, x, y, z); puffs.push(me); }
    return (t) => puffs.forEach((me, i) => { const f = (t * speed + i / n + seed * 0.37) % 1; me.position.set(x + Math.sin(i * 2.3 + t) * 0.12 * f, y + f * rise, z + Math.cos(i * 1.7 + t) * 0.12 * f); me.scale.setScalar(size * (0.5 + f * 1.4)); me.material.opacity = 0.45 * Math.sin(f * Math.PI); });
  }
  // flickering flame cones
  function flame(parent, x, y, z, s = 1) {
    const g = new T.Group(); g.position.set(x, y, z); parent.add(g);
    const outer = add(g, coneG(0.09 * s, 0.3 * s, 10), glow(0xff9a2e, 2.2), 0, 0.15 * s, 0);
    const inner = add(g, coneG(0.05 * s, 0.18 * s, 8), glow(0xfff1a8, 2.5), 0, 0.1 * s, 0);
    const seed = x * 3.1 + z * 1.7;
    return (t) => { const k = 1 + Math.sin(t * 13 + seed) * 0.12 + Math.sin(t * 7.3 + seed * 2) * 0.08; outer.scale.set(1 / k, k, 1 / k); inner.scale.set(1, 1 + Math.sin(t * 11 + seed) * 0.15, 1); };
  }
  const lathe = (pts, seg = 20) => new T.LatheGeometry(pts.map(([x, y]) => new T.Vector2(x, y)), seg);
  const R = (id, label, fn, tags) => { if (!ZAssets.has(id)) ZAssets.register('factory', id, label, fn, tags); };
  const ticker = (group, fns) => { group.userData.tick = (t) => { for (const f of fns) f(t); }; };

  // =====================================================================================================
  //  LIBRARY PROPS
  // =====================================================================================================

  // --- machinery ---
  R('cfu_ancient_gear', 'Ancient bronze gear on a stand', () => {
    const g = new T.Group(); B(g, 0.9, 0.3, 0.7, mat(P.stoneDark), 0, 0.15, 0); C(g, 0.1, 0.12, 1.2, metal(P.iron), 0, 0.85, 0);
    const gr = gear(g, 0.9, 16, 0.18, metal(P.bronze), 0, 1.45, 0.05);
    ticker(g, [(t) => { gr.rotation.z = t * 0.5; }]); return { group: g };
  }, ['gear', 'ancient', 'machine', 'bronze']);

  R('cfu_gear_wall', 'Wall of meshing ancient gears', () => {
    const g = new T.Group(), plate = mat(0x4a3b2e, { roughness: 0.9 });
    B(g, 4.4, 3.8, 0.2, plate, 0, 2.1, 0.1); B(g, 4.6, 0.2, 0.3, metal(P.bronze), 0, 4.05, 0.15); B(g, 4.6, 0.2, 0.3, metal(P.bronze), 0, 0.2, 0.15);
    for (const x of [-2.1, 2.1]) for (const y of [0.6, 1.8, 3.0, 3.7]) add(g, sphG(0.05, 8), metal(P.gold), x, y, 0.22);
    const a = gear(g, 1.3, 20, 0.2, metal(P.bronze), -0.8, 2.0, 0.42), b2 = gear(g, 0.8, 12, 0.2, metal(P.gold), 1.06, 2.68, 0.42), c2 = gear(g, 0.55, 9, 0.2, metal(P.copper), 1.3, 1.45, 0.66);
    const d2 = gear(g, 0.45, 8, 0.16, metal(P.bronze), -1.65, 0.62, 0.66);
    C(g, 0.08, 0.08, 4.2, metal(P.copper), 1.95, 2.1, 0.35);
    ticker(g, [(t) => { a.rotation.z = t * 0.4; b2.rotation.z = -t * 0.4 * 1.3 / 0.8 + 0.12; c2.rotation.z = t * 0.4 * 1.3 / 0.55; d2.rotation.z = -t * 0.4 * 1.3 / 0.45; }]);
    return { group: g };
  }, ['gear', 'gears', 'wall', 'machine', 'ancient']);

  R('cfu_gear_tower', 'Giant gear tower (ancient machine)', () => {
    const g = new T.Group(), st = mat(P.stoneDark, { roughness: 0.95 }), br = metal(P.bronze);
    for (const x of [-2.0, 2.0]) { B(g, 0.6, 5.4, 0.9, st, x, 2.7, 0); B(g, 0.8, 0.3, 1.1, br, x, 0.15, 0); B(g, 0.8, 0.3, 1.1, br, x, 5.3, 0); add(g, octG(0.22), glow(P.cyan, 1.6), x, 4.6, 0.5, { s: [1, 1.6, 1] }); }
    B(g, 4.8, 0.5, 1.0, st, 0, 5.6, 0); B(g, 4.8, 0.12, 1.05, br, 0, 5.4, 0);
    C(g, 0.12, 0.12, 4.0, metal(P.iron), 0, 2.7, 0, { rz: Math.PI / 2 });
    const big = gear(g, 1.9, 26, 0.3, br, 0, 2.7, 0.15), small = gear(g, 0.75, 11, 0.24, metal(P.gold), 1.35, 1.0, 0.5);
    const core = add(g, sphG(0.32, 16), glow(P.cyan, 2), 0, 2.7, 0.42);
    B(g, 4.6, 0.25, 1.1, st, 0, 0.12, 0);
    ticker(g, [(t) => { big.rotation.z = t * 0.25; small.rotation.z = -t * 0.25 * 1.9 / 0.75 + 0.2; core.scale.setScalar(1 + Math.sin(t * 2) * 0.12); }]);
    return { group: g };
  }, ['gear', 'tower', 'giant', 'machine', 'ancient']);

  R('cfu_piston', 'Steam piston press', () => {
    const g = new T.Group(), br = metal(P.bronze), ir = metal(P.iron, 0.5);
    B(g, 1.4, 0.7, 1.4, mat(0x3a2f28), 0, 0.35, 0); B(g, 1.5, 0.1, 1.5, br, 0, 0.72, 0);
    C(g, 0.36, 0.36, 1.4, metal(P.copper), 0, 1.47, 0); for (const y of [0.85, 1.5, 2.1]) add(g, torG(0.37, 0.04, 6, 20), br, 0, y, 0, { rx: Math.PI / 2 });
    for (const x of [-0.6, 0.6]) C(g, 0.07, 0.07, 3.0, ir, x, 2.2, 0);
    B(g, 1.4, 0.2, 0.3, ir, 0, 3.7, 0);
    const rod = C(g, 0.11, 0.11, 1.3, metal(0xd9d4c7, 0.2), 0, 2.6, 0), head = B(g, 1.0, 0.28, 0.7, br, 0, 3.2, 0);
    const fw = new T.Group(); fw.position.set(0.82, 1.4, 0); fw.rotation.y = Math.PI / 2; g.add(fw); const wheel = gear(fw, 0.55, 10, 0.12, metal(P.gold), 0, 0, 0);
    const st = steam(g, -0.4, 2.2, 0.4, 3, 1.4, 0.2, 0.6, 2);
    ticker(g, [(t) => { const k = (Math.sin(t * 2.4) + 1) / 2; rod.position.y = 2.3 + k * 0.4; head.position.y = 3.05 + k * 0.4; wheel.rotation.z = t * 2.4; }, st]);
    return { group: g };
  }, ['piston', 'press', 'steam', 'machine']);

  R('cfu_boiler', 'Copper boiler with glowing firebox', () => {
    const g = new T.Group(), cu = metal(P.copper, 0.3), br = metal(P.bronze), brick = mat(0x6b3a2a, { roughness: 0.95 });
    B(g, 2.4, 0.8, 2.4, brick, 0, 0.4, 0);
    const fire = B(g, 0.9, 0.45, 0.05, glow(0xff7a1a, 1.8), 0, 0.42, 1.22);
    B(g, 1.1, 0.6, 0.06, metal(P.iron), 0, 0.42, 1.2).scale.set(1, 1, 0.5);
    C(g, 1.1, 1.1, 2.6, cu, 0, 2.1, 0, { seg: 24 }); add(g, sphG(1.1, 20), cu, 0, 3.4, 0, { s: [1, 0.45, 1] });
    for (const y of [1.0, 2.1, 3.2]) add(g, torG(1.12, 0.05, 6, 32), br, 0, y, 0, { rx: Math.PI / 2 });
    C(g, 0.18, 0.18, 1.6, metal(P.iron), 0.4, 4.4, 0); C(g, 0.24, 0.2, 0.25, br, 0.4, 5.2, 0);
    const gm = new T.MeshStandardMaterial({ map: gaugeTex(), roughness: 0.4 });
    for (const [x, y] of [[-0.4, 2.4], [0.4, 2.6]]) { const gg = add(g, cylG(0.22, 0.22, 0.08, 20), br, x, y, 1.1, { rx: Math.PI / 2 }); void gg; add(g, planeG(0.36, 0.36), gm, x, y, 1.15); }
    const needle = B(g, 0.02, 0.14, 0.02, mat(0xb91c1c), -0.4, 2.45, 1.17);
    for (const x of [-1.25, 1.25]) { C(g, 0.12, 0.12, 0.9, br, x, 2.6, 0, { rz: Math.PI / 2 }); }
    const st = steam(g, 0.4, 5.3, 0, 5, 1.6, 0.3, 0.35, 1);
    ticker(g, [(t) => { fire.material.emissiveIntensity = 1.6 + Math.sin(t * 9) * 0.3 + Math.sin(t * 23) * 0.15; needle.rotation.z = Math.sin(t * 0.8) * 0.8; }, st]);
    fire.material = fire.material.clone();
    return { group: g };
  }, ['boiler', 'steam', 'copper', 'machine']);

  R('cfu_conveyor', 'Old conveyor belt with cocoa blocks', () => {
    const g = new T.Group(), ir = metal(P.iron, 0.5), br = metal(P.bronze), L = 6;
    const beltM = new T.MeshStandardMaterial({ map: beltTex(), roughness: 0.9 });
    B(g, L, 0.08, 1.0, beltM, 0, 0.92, 0); for (const z of [-0.55, 0.55]) B(g, L + 0.2, 0.22, 0.1, br, 0, 0.92, z);
    for (const x of [-2.7, -0.9, 0.9, 2.7]) for (const z of [-0.5, 0.5]) B(g, 0.12, 0.82, 0.12, ir, x, 0.41, z);
    for (const x of [-L / 2, L / 2]) C(g, 0.16, 0.16, 1.1, ir, x, 0.92, 0, { rx: Math.PI / 2 });
    // hopper + stamping arch
    const hop = mat(0x5b4636); add(g, cylG(0.7, 0.25, 0.8, 4, false), hop, -2.6, 1.9, 0, { ry: Math.PI / 4 }); for (const z of [-0.45, 0.45]) B(g, 0.1, 1.1, 0.1, ir, -2.6, 1.3, z);
    for (const z of [-0.6, 0.6]) B(g, 0.16, 2.0, 0.16, br, 0.6, 1.0, z); B(g, 0.4, 0.3, 1.4, br, 0.6, 2.1, 0);
    const stamp = B(g, 0.5, 0.3, 0.6, metal(P.gold), 0.6, 1.6, 0);
    const blocks = []; const choco = mat(0x5a3220, { roughness: 0.5 }), pod = mat(0xc2702d, { roughness: 0.6 });
    for (let i = 0; i < 6; i++) blocks.push(i % 2 ? B(g, 0.42, 0.16, 0.3, choco, 0, 1.04, 0) : add(g, sphG(0.16, 10), pod, 0, 1.12, 0, { s: [1.5, 0.9, 0.9] }));
    ticker(g, [(t) => { beltM.map.offset.x = -(t * 0.12) % 1; blocks.forEach((b, i) => { const f = (t * 0.08 + i / 6) % 1; b.position.x = -L / 2 + 0.4 + f * (L - 0.8); }); stamp.position.y = 1.55 + Math.max(0, Math.sin(t * 3)) * 0.3; }]);
    return { group: g };
  }, ['conveyor', 'belt', 'machine', 'factory']);

  R('cfu_lever_panel', 'Control panel with levers and dials', () => {
    const g = new T.Group(), br = metal(P.bronze), wd = mat(P.woodDark);
    B(g, 2.4, 1.0, 0.8, wd, 0, 0.5, 0); B(g, 2.5, 0.08, 0.9, br, 0, 1.02, 0);
    const desk = new T.Group(); desk.position.set(0, 1.06, 0.05); desk.rotation.x = -0.35; g.add(desk); B(desk, 2.3, 0.08, 0.6, mat(0x3b2f2a), 0, 0, 0);
    const blink = [];
    [P.cyan, 0x22c55e, 0xfacc15, 0xef4444, P.violet, P.cyan].forEach((col, i) => { const m = new T.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.4 }); add(desk, cylG(0.06, 0.06, 0.05, 12), m, -0.9 + i * 0.36, 0.06, 0.12); blink.push(m); });
    const levers = [];
    for (let i = 0; i < 3; i++) { const lv = new T.Group(); lv.position.set(-0.6 + i * 0.6, 0.04, -0.15); desk.add(lv); C(lv, 0.025, 0.025, 0.5, metal(0xd9d4c7, 0.2), 0, 0.25, 0); add(lv, sphG(0.07, 10), mat([0xef4444, 0xfacc15, 0x22c55e][i], { roughness: 0.3 }), 0, 0.52, 0); levers.push(lv); }
    B(g, 2.4, 1.5, 0.15, wd, 0, 1.85, -0.35); B(g, 2.5, 0.1, 0.25, br, 0, 2.62, -0.35);
    const gm = new T.MeshStandardMaterial({ map: gaugeTex(), roughness: 0.4 }); const needles = [];
    for (const x of [-0.75, 0, 0.75]) { add(g, cylG(0.3, 0.3, 0.06, 24), br, x, 1.95, -0.26, { rx: Math.PI / 2 }); add(g, planeG(0.5, 0.5), gm, x, 1.95, -0.22); needles.push(B(g, 0.025, 0.2, 0.02, mat(0xb91c1c), x, 1.95, -0.2)); }
    const lbl = new T.MeshStandardMaterial({ map: textTex('MAIN CONTROL', { bg: '#3b2a20', fg: '#f5d77a', w: 512, h: 96, size: 56 }), roughness: 0.6 }); add(g, planeG(1.4, 0.26), lbl, 0, 2.45, -0.26);
    ticker(g, [(t) => { blink.forEach((m, i) => { m.emissiveIntensity = 0.4 + (Math.sin(t * (2 + i * 0.7) + i) > 0 ? 1.4 : 0); }); levers.forEach((lv, i) => { lv.rotation.x = Math.sin(t * 0.9 + i * 1.7) * 0.45; }); needles.forEach((n, i) => { n.rotation.z = Math.sin(t * (0.7 + i * 0.4) + i) * 1.1; }); }]);
    return { group: g };
  }, ['control', 'panel', 'lever', 'dial', 'machine']);

  // --- mine & storage ---
  R('cfu_mine_cart', 'Old mine cart with crystals', () => {
    const g = new T.Group(), wd = mat(0x6b4426), ir = metal(P.iron, 0.55);
    add(g, cylG(0.78, 0.6, 0.62, 4), wd, 0, 0.67, 0, { ry: Math.PI / 4, s: [1.15, 1, 0.75] });
    for (const y of [0.45, 0.9]) add(g, cylG(0.79 - (y - 0.36) * 0.29, 0.79 - (y - 0.36) * 0.29, 0.06, 4), ir, 0, y, 0, { ry: Math.PI / 4, s: [1.16, 1, 0.76] });
    for (const x of [-0.45, 0.45]) for (const z of [-0.36, 0.36]) C(g, 0.17, 0.17, 0.08, ir, x, 0.17, z, { rx: Math.PI / 2, seg: 14 });
    const r = rng(9); for (let i = 0; i < 9; i++) add(g, octG(0.13 + r() * 0.08), glow([P.violet, P.cyan, 0xf0abfc][i % 3], 1.5), (r() - 0.5) * 0.9, 1.0 + r() * 0.12, (r() - 0.5) * 0.5, { s: [1, 1.8, 1], rz: (r() - 0.5) * 0.8 });
    add(g, sphG(0.3, 10), mat(0x3f3a3a, { roughness: 1, flatShading: true }), 0.1, 0.92, 0, { s: [2.2, 0.5, 1.2] });
    for (const z of [-0.36, 0.36]) B(g, 2.2, 0.06, 0.07, ir, 0, 0.03, z);
    return { group: g };
  }, ['mine', 'cart', 'crystal', 'rails']);

  R('cfu_rails', 'Mine-cart rails (4 m)', () => {
    const g = new T.Group(), ir = metal(0x6e6a6a, 0.5), wd = mat(0x5a3b24);
    for (const z of [-0.36, 0.36]) B(g, 4, 0.06, 0.07, ir, 0, 0.05, z);
    for (let i = 0; i < 8; i++) B(g, 0.2, 0.04, 1.0, wd, -1.75 + i * 0.5, 0.02, 0);
    return { group: g };
  }, ['rails', 'mine', 'track']);

  R('cfu_cobweb', 'Dusty cobweb (corner)', () => {
    const g = new T.Group(); const m = decalM('web', webTex(), { side: T.DoubleSide }); add(g, planeG(1.2, 1.2), m, 0.6, 0.6, 0); return { group: g };
  }, ['cobweb', 'web', 'dusty', 'old']);

  R('cfu_barrel', 'Ancient wooden barrel', () => {
    const g = new T.Group(); add(g, geo('barrelG', () => lathe([[0, 0], [0.32, 0], [0.4, 0.25], [0.42, 0.5], [0.4, 0.75], [0.32, 1.0], [0, 1.0]], 18)), mat(0x7a4a2a, { roughness: 0.85 }));
    for (const y of [0.15, 0.85]) add(g, torG(0.37, 0.025, 6, 22), metal(P.iron, 0.6), 0, y, 0, { rx: Math.PI / 2 });
    add(g, torG(0.42, 0.025, 6, 22), metal(P.iron, 0.6), 0, 0.5, 0, { rx: Math.PI / 2 });
    add(g, cylG(0.3, 0.3, 0.02, 16), mat(0x9a6a40), 0, 1.0, 0); add(g, cylG(0.3, 0.3, 0.005, 16), mat(0xd8cfc0, { roughness: 1 }), 0, 1.013, 0);
    return { group: g };
  }, ['barrel', 'old', 'storage', 'wood']);

  R('cfu_crate', 'Dusty wooden crate', () => {
    const g = new T.Group(), wd = mat(0x8a6038), dk = mat(0x5e3e22);
    B(g, 0.9, 0.9, 0.9, wd, 0, 0.45, 0);
    for (const s of [-1, 1]) { B(g, 0.94, 0.1, 0.94, dk, 0, s > 0 ? 0.86 : 0.05, 0); B(g, 0.1, 0.9, 0.94, dk, s * 0.42, 0.45, 0); }
    add(g, planeG(0.7, 0.3), decalM('crateLbl', textTex('ZUNGGA · COCOA\n1888', { fg: '#3b2a20', w: 256, h: 112, size: 40 })), 0, 0.5, 0.46);
    B(g, 0.92, 0.01, 0.92, mat(0xc9bfae, { roughness: 1 }), 0, 0.915, 0);
    return { group: g };
  }, ['crate', 'box', 'old', 'storage']);

  R('cfu_sack', 'Sack of cocoa beans', () => {
    const g = new T.Group(), sk = mat(0xc4a06a, { roughness: 1 });
    add(g, sphG(0.36, 14), sk, 0, 0.36, 0, { s: [1, 1.05, 0.85] }); add(g, coneG(0.2, 0.3, 10), sk, 0, 0.8, 0, { rx: Math.PI });
    add(g, torG(0.12, 0.03, 6, 14), mat(0x7a5a33), 0, 0.72, 0, { rx: Math.PI / 2 }); add(g, sphG(0.13, 10), sk, 0, 0.98, 0, { s: [1.3, 0.6, 1.3] });
    add(g, planeG(0.4, 0.2), decalM('sackLbl', textTex('COCOA', { fg: '#5b3a1e', w: 256, h: 96, size: 60 })), 0, 0.42, 0.31);
    const bean = mat(0x5a3220); for (let i = 0; i < 5; i++) add(g, sphG(0.04, 6), bean, 0.3 + i * 0.07, 0.03, 0.3 - i * 0.04, { s: [1.4, 0.7, 1] });
    return { group: g };
  }, ['sack', 'cocoa', 'beans', 'storage']);

  R('cfu_clay_jar', 'Ancient clay jar', () => {
    const g = new T.Group(), cl = mat(0xb5653a, { roughness: 0.9 });
    add(g, geo('jarG', () => lathe([[0, 0], [0.16, 0], [0.3, 0.18], [0.34, 0.42], [0.26, 0.68], [0.12, 0.8], [0.12, 0.9], [0.17, 0.95], [0, 0.95]], 18)), cl);
    for (const s of [-1, 1]) add(g, torG(0.1, 0.025, 6, 12, Math.PI), cl, s * 0.2, 0.72, 0, { rz: s * Math.PI / 2 });
    add(g, torG(0.31, 0.015, 4, 24), mat(0x3b2a20), 0, 0.42, 0, { rx: Math.PI / 2 }); add(g, torG(0.33, 0.015, 4, 24), mat(0xe8c48a), 0, 0.5, 0, { rx: Math.PI / 2 });
    return { group: g };
  }, ['jar', 'clay', 'pot', 'amphora', 'ancient']);

  R('cfu_ingredient_shelf', 'Dusty shelf of glowing ingredient jars', () => {
    const g = new T.Group(), wd = mat(0x5e3e22), r = rng(4);
    for (const x of [-1.15, 1.15]) B(g, 0.1, 2.4, 0.5, wd, x, 1.2, 0); B(g, 2.4, 2.4, 0.04, mat(0x4a3220), 0, 1.2, -0.23);
    const cols = [0xa855f7, P.cyan, 0xfacc15, 0xf472b6, 0x4ade80, 0xfb923c];
    for (const [i, y] of [0.08, 0.8, 1.52, 2.26].entries()) { B(g, 2.3, 0.05, 0.48, wd, 0, y, 0); B(g, 2.3, 0.006, 0.46, mat(0xbdb2a0, { roughness: 1 }), 0, y + 0.03, 0);
      if (i === 3) continue; let x = -1.0;
      while (x < 0.95) { const h = 0.22 + r() * 0.2, rr = 0.07 + r() * 0.05, col = cols[(r() * cols.length) | 0];
        add(g, cylG(rr * 0.85, rr * 0.85, h * 0.7, 10), glow(col, 1.2), x + rr, y + 0.03 + h * 0.35, 0.02);
        add(g, cylG(rr, rr, h, 10), mat(0xdfe8ea, { transparent: true, opacity: 0.35, roughness: 0.1 }), x + rr, y + 0.03 + h / 2, 0.02);
        add(g, cylG(rr * 0.8, rr * 0.8, 0.05, 10), mat(0x7a5232), x + rr, y + 0.05 + h, 0.02); x += rr * 2 + 0.08 + r() * 0.08; } }
    return { group: g };
  }, ['shelf', 'jars', 'ingredients', 'glow', 'storage']);

  R('cfu_scale', 'Old brass balance scale', () => {
    const g = new T.Group(), br = metal(P.gold, 0.3), wd = mat(0x6b4426);
    B(g, 1.2, 0.08, 0.8, wd, 0, 0.82, 0); for (const x of [-0.5, 0.5]) for (const z of [-0.3, 0.3]) B(g, 0.08, 0.8, 0.08, wd, x, 0.4, z);
    C(g, 0.12, 0.16, 0.06, br, 0, 0.89, 0); C(g, 0.03, 0.03, 0.8, br, 0, 1.3, 0);
    const beam = new T.Group(); beam.position.set(0, 1.7, 0); g.add(beam); B(beam, 0.9, 0.04, 0.04, br, 0, 0, 0); add(beam, sphG(0.05, 10), br);
    const pans = [-0.45, 0.45].map((x, i) => { const pn = new T.Group(); pn.position.set(x, 0, 0); beam.add(pn); for (const a of [0, 2.1, 4.2]) C(pn, 0.006, 0.006, 0.42, br, Math.cos(a) * 0.08, -0.21, Math.sin(a) * 0.08, { rz: Math.cos(a) * 0.2, rx: -Math.sin(a) * 0.2 });
      add(pn, sphG(0.17, 14), br, 0, -0.42, 0, { s: [1, 0.25, 1] });
      if (i) for (let k = 0; k < 4; k++) add(pn, sphG(0.04, 6), mat(0x5a3220), (k - 1.5) * 0.05, -0.38, 0); else C(pn, 0.06, 0.07, 0.08, metal(P.gold), 0, -0.36, 0);
      return pn; });
    ticker(g, [(t) => { const a = Math.sin(t * 0.7) * 0.12; beam.rotation.z = a; pans.forEach((p) => { p.rotation.z = -a; }); }]);
    return { group: g };
  }, ['scale', 'balance', 'brass', 'old']);

  R('cfu_hanging_lantern', 'Hanging lantern on a chain', () => {
    const g = new T.Group(), pivot = new T.Group(); pivot.position.y = 1.4; g.add(pivot); const ir = metal(0x3a3330, 0.5);
    C(pivot, 0.015, 0.015, 0.9, ir, 0, -0.45, 0);
    const L = new T.Group(); L.position.y = -1.15; pivot.add(L);
    add(L, coneG(0.2, 0.18, 6), ir, 0, 0.32, 0); B(L, 0.26, 0.04, 0.26, ir, 0, -0.2, 0);
    B(L, 0.22, 0.4, 0.22, glow(0xffc46b, 1.8), 0, 0.02, 0);
    for (const [x, z] of [[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]]) B(L, 0.03, 0.44, 0.03, ir, x, 0.02, z);
    add(L, torG(0.05, 0.012, 6, 12), ir, 0, 0.45, 0);
    const seed = Math.random() * 6;   // phase only
    ticker(g, [(t) => { pivot.rotation.z = Math.sin(t * 1.2 + seed) * 0.06; pivot.rotation.x = Math.sin(t * 0.9 + seed) * 0.04; }]);
    return { group: g };
  }, ['lantern', 'hanging', 'light', 'old']);

  R('cfu_stone_sign', 'Stone sign: THE FORGOTTEN FOUNDATION', () => {
    const g = new T.Group(), st = mat(0x6e645b, { roughness: 0.95 }), br = metal(P.bronze);
    B(g, 3.9, 0.5, 0.7, st, 0, 0.25, 0); B(g, 3.6, 1.5, 0.35, st, 0, 1.25, 0); B(g, 3.8, 0.12, 0.45, br, 0, 2.05, 0);
    add(g, coneG(0.5, 0.45, 4), st, 0, 2.33, 0, { ry: Math.PI / 4, s: [1.6, 1, 0.5] });
    const m = new T.MeshStandardMaterial({ map: textTex('THE FORGOTTEN\nFOUNDATION', { bg: '#4a3f38', fg: '#f5d77a', glow: '#fbbf24', border: '#b8860b', w: 1024, h: 400, size: 150, radius: 20 }), emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.8 });
    m.emissiveMap = m.map; add(g, planeG(3.3, 1.3), m, 0, 1.27, 0.18);
    for (const s of [-1, 1]) { add(g, octG(0.2), glow(P.violet, 1.6), s * 1.75, 2.75, 0, { s: [1, 2, 1] }); add(g, octG(0.13), glow(P.cyan, 1.6), s * 1.55, 2.6, 0.1, { s: [1, 2, 1], rz: s * 0.4 }); }
    return { group: g };
  }, ['sign', 'stone', 'forgotten', 'foundation', 'secret']);

  const runeColTex = (col) => tx('rc' + col, () => ZA.tex((g, w, h) => { g.clearRect(0, 0, w, h); const ch = 'ᚠᚱᛟᚨᛉᛞᚲᛗ'; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 12; g.font = '700 52px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 0; i < 8; i++) g.fillText(ch[i], w / 2, (i + 0.5) * h / 8); }, 64, 512));
  const pillarRuneM = () => tx('pillarRuneM', () => new T.MeshStandardMaterial({ map: runeColTex('#c4b5fd'), emissiveMap: runeColTex('#c4b5fd'), emissive: 0xffffff, emissiveIntensity: 1, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  function runePillar(h) {
    return () => {
      const g = new T.Group(), st = mat(0x6f655c, { roughness: 0.95 }), cap = mat(0x5a514a), gm = pillarRuneM();
      B(g, 1.0, 0.35, 1.0, cap, 0, 0.175, 0); B(g, 0.8, h - 0.7, 0.8, st, 0, h / 2, 0); B(g, 1.0, 0.35, 1.0, cap, 0, h - 0.175, 0);
      for (const y of [0.55, h - 0.55]) B(g, 0.86, 0.08, 0.86, metal(P.bronze), 0, y, 0);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; add(g, planeG(0.3, h - 1.4), gm, Math.sin(a) * 0.41, h / 2, Math.cos(a) * 0.41, { ry: a }); }
      ticker(g, [(t) => { gm.emissiveIntensity = 0.8 + Math.sin(t * 1.5) * 0.4; }]);
      return { group: g };
    };
  }
  R('cfu_rune_pillar', 'Carved stone pillar with glowing runes', runePillar(3.4), ['pillar', 'runes', 'stone', 'carved', 'magic']);

  R('cfu_hanging_chain', 'Old hanging chains', () => {
    const g = new T.Group(), ir = metal(0x4a4545, 0.55);
    for (const [x, n, off] of [[0, 16, 0], [0.35, 11, 0.6]]) { for (let i = 0; i < n; i++) add(g, torG(0.06, 0.016, 5, 10), ir, x, 3 - off - i * 0.16, 0, { ry: i % 2 ? Math.PI / 2 : 0, rx: Math.PI / 2 * 0, s: [1, 1.5, 1] }); add(g, torG(0.12, 0.025, 6, 14, Math.PI * 1.5), ir, x, 3 - off - n * 0.16 - 0.06, 0, { rz: Math.PI }); }
    return { group: g };
  }, ['chain', 'hanging', 'old', 'dungeon']);

  R('cfu_brazier', 'Bronze brazier with fire', () => {
    const g = new T.Group(), br = metal(P.bronze);
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; C(g, 0.025, 0.035, 0.75, br, Math.cos(a) * 0.17, 0.36, Math.sin(a) * 0.17, { rz: Math.cos(a) * 0.25, rx: -Math.sin(a) * 0.25 }); }
    add(g, geo('brazG', () => lathe([[0.05, 0], [0.26, 0.05], [0.33, 0.22], [0.35, 0.24], [0.3, 0.2], [0, 0.18]], 18)), br, 0, 0.68, 0);
    add(g, sphG(0.24, 10), glow(0xff5a1a, 1.4), 0, 0.86, 0, { s: [1, 0.25, 1] });
    const fs = [flame(g, 0, 0.86, 0, 2.2), flame(g, 0.1, 0.86, 0.05, 1.3), flame(g, -0.09, 0.86, -0.05, 1.5)];
    ticker(g, fs); return { group: g };
  }, ['brazier', 'fire', 'bronze', 'ancient']);

  R('cfu_glyph_mural', 'Carved glyph mural (☀ ☾ ★ ♦ ✿ ♥)', () => {
    const g = new T.Group(), st = mat(0x5f554d, { roughness: 0.95 }), br = metal(P.bronze);
    B(g, 2.4, 1.8, 0.12, st, 0, 1.5, 0); for (const [w, h, x, y] of [[2.6, 0.12, 0, 2.43], [2.6, 0.12, 0, 0.57], [0.12, 1.98, -1.25, 1.5], [0.12, 1.98, 1.25, 1.5]]) B(g, w, h, 0.18, br, x, y, 0.02);
    const glyphs = ['☀', '☾', '★', '♦', '✿', '♥'], cols = ['#fde68a', '#c4b5fd', '#fde68a', '#67e8f9', '#f9a8d4', '#fca5a5'], ms = [];
    glyphs.forEach((ch, i) => { const m = new T.MeshBasicMaterial({ map: glyphTex(ch, cols[i]), transparent: true, depthWrite: false, blending: T.AdditiveBlending }); ms.push(m); add(g, planeG(0.62, 0.62), m, -0.75 + (i % 3) * 0.75, 1.88 - Math.floor(i / 3) * 0.72, 0.07); });
    ticker(g, [(t) => ms.forEach((m, i) => { m.opacity = 0.65 + 0.35 * Math.sin(t * 1.6 + i * 1.1); })]);
    return { group: g };
  }, ['mural', 'glyph', 'symbols', 'carved', 'puzzle']);

  R('cfu_wall_carving', 'Ancient stone wall carving (glowing)', () => {
    const g = new T.Group(); B(g, 2.1, 2.7, 0.14, mat(0x4f4640), 0, 1.35, 0);
    const m = new T.MeshStandardMaterial({ map: carvingTex('tree'), emissive: 0xffffff, emissiveMap: carvingTex('tree'), emissiveIntensity: 0.55, roughness: 0.9 }); add(g, planeG(1.9, 2.5), m, 0, 1.35, 0.075);
    return { group: g };
  }, ['carving', 'relief', 'ancient', 'wall', 'cocoa']);
  R('cfu_wall_carving_machine', 'Ancient wall carving: the first machine', () => {
    const g = new T.Group(); B(g, 2.1, 2.7, 0.14, mat(0x4f4640), 0, 1.35, 0);
    const m = new T.MeshStandardMaterial({ map: carvingTex('machine'), emissive: 0xffffff, emissiveMap: carvingTex('machine'), emissiveIntensity: 0.55, roughness: 0.9 }); add(g, planeG(1.9, 2.5), m, 0, 1.35, 0.075);
    return { group: g };
  }, ['carving', 'relief', 'ancient', 'wall', 'gears']);
  R('cfu_wall_carving_stars', 'Ancient wall carving: the founders’ stars', () => {
    const g = new T.Group(); B(g, 2.1, 2.7, 0.14, mat(0x4f4640), 0, 1.35, 0);
    const m = new T.MeshStandardMaterial({ map: carvingTex('stars'), emissive: 0xffffff, emissiveMap: carvingTex('stars'), emissiveIntensity: 0.55, roughness: 0.9 }); add(g, planeG(1.9, 2.5), m, 0, 1.35, 0.075);
    return { group: g };
  }, ['carving', 'relief', 'ancient', 'wall', 'stars']);

  // --- the founders ---
  function founder(item, name, role, robe, bronze) {
    return () => {
      const g = new T.Group(), st = mat(0x9a8f84, { roughness: 0.9 }), body = bronze ? metal(0xa77b45, 0.45) : mat(0xc9bfb2, { roughness: 0.85 }), robeM = bronze ? metal(robe, 0.5) : mat(robe, { roughness: 0.85 });
      B(g, 1.4, 0.25, 1.4, mat(0x6f655c), 0, 0.125, 0); B(g, 1.15, 0.85, 1.15, st, 0, 0.67, 0); B(g, 1.3, 0.12, 1.3, mat(0x6f655c), 0, 1.15, 0);
      const pl = new T.MeshStandardMaterial({ map: textTex(name + '\n' + role, { bg: '#b8860b', fg: '#2a1a10', w: 512, h: 200, size: 84, radius: 18 }), metalness: 0.4, roughness: 0.4 }); add(g, planeG(0.9, 0.36), pl, 0, 0.7, 0.58);
      const f = new T.Group(); f.position.y = 1.21; g.add(f);
      for (const x of [-0.13, 0.13]) { C(f, 0.08, 0.09, 0.5, body, x, 0.25, 0); add(f, sphG(0.1, 10), body, x, 0.04, 0.05, { s: [1, 0.6, 1.5] }); }
      add(f, geo('robeG', () => lathe([[0.001, 0], [0.33, 0], [0.3, 0.3], [0.25, 0.65], [0.18, 0.85], [0.001, 0.88]], 18)), robeM, 0, 0.35, 0);
      add(f, sphG(0.17, 12), robeM, 0, 1.15, 0, { s: [1.5, 0.6, 1.1] });
      add(f, sphG(0.27, 18), body, 0, 1.5, 0); add(f, sphG(0.28, 16), robeM, 0, 1.58, -0.04, { s: [1, 0.75, 1] });
      for (const x of [-0.09, 0.09]) add(f, sphG(0.035, 8), mat(0x2a211c), x, 1.53, 0.24);
      add(f, torG(0.08, 0.018, 6, 12, Math.PI), mat(0x2a211c), 0, 1.44, 0.245, { rz: Math.PI });
      // arms holding the item in front
      for (const s of [-1, 1]) C(f, 0.06, 0.07, 0.48, body, s * 0.22, 0.98, 0.16, { rx: -1.0, rz: s * 0.25 });
      const it = new T.Group(); it.position.set(0, 0.95, 0.38); f.add(it);
      if (item === 'pod') { add(it, sphG(0.14, 12), mat(0xc2702d), 0, 0.05, 0, { s: [0.8, 1.5, 0.8] }); for (let i = 0; i < 4; i++) add(it, torG(0.11, 0.012, 4, 12), mat(0x9a4f1c), 0, 0.05, 0, { ry: i * Math.PI / 4, s: [1, 1.9, 1] }); }
      else if (item === 'book') { B(it, 0.34, 0.06, 0.26, mat(0x6d28d9), 0, 0, 0); B(it, 0.32, 0.04, 0.24, mat(P.cream), 0, 0.04, 0); }
      else if (item === 'spoon') { C(it, 0.02, 0.02, 0.6, metal(P.gold, 0.3), 0, 0.25, 0); add(it, sphG(0.08, 10), metal(P.gold, 0.3), 0, 0.6, 0, { s: [1, 1.4, 0.5] }); }
      else if (item === 'gear') { add(it, gearGeo(0.18, 10, 0.06), metal(P.gold, 0.3), 0, 0.08, 0); }
      else if (item === 'scroll') { C(it, 0.06, 0.06, 0.42, mat(P.cream), 0, 0.02, 0, { rz: Math.PI / 2 }); for (const s of [-1, 1]) C(it, 0.07, 0.07, 0.04, metal(P.gold), s * 0.22, 0.02, 0, { rz: Math.PI / 2 }); }
      else if (item === 'star') { const sh = new T.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 0.07 : 0.17; i ? sh.lineTo(Math.cos(a) * q, Math.sin(a) * q) : sh.moveTo(Math.cos(a) * q, Math.sin(a) * q); } add(it, geo('starG', () => new T.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }).translate(0, 0, -0.025)), glow(0xfacc15, 1.2), 0, 0.18, 0); C(it, 0.015, 0.015, 0.2, metal(P.gold), 0, 0, 0); }
      return { group: g };
    };
  }
  const FOUNDERS = [['pod', 'MAYA', 'the grower', 0x8a5a33, true], ['book', 'BENU', 'the scholar', 0x4c3a8a, false], ['spoon', 'LILA', 'the chef', 0xa04a5a, true],
    ['gear', 'OSKAR', 'the inventor', 0x5a6a7a, false], ['scroll', 'RAVI', 'the explorer', 0x3a6a5a, true], ['star', 'NOOR', 'the dreamer', 0x6d28d9, false]];
  for (const [item, name, role, robe, bz] of FOUNDERS) R('cfu_founder_' + name.toLowerCase(), `Founder statue — ${name[0] + name.slice(1).toLowerCase()} (${role})`, founder(item, name, role, robe, bz), ['statue', 'founder', 'zungga', 'history', item]);

  R('cfu_zungga_banner', 'Purple Zungga banner with golden star', () => {
    const g = new T.Group(); C(g, 0.06, 0.06, 3.3, metal(P.gold, 0.3), 0, 5.0, 0.08, { rz: Math.PI / 2 }); for (const s of [-1, 1]) add(g, sphG(0.1, 10), metal(P.gold, 0.3), s * 1.68, 5.0, 0.08);
    const pg = new T.PlaneGeometry(3.0, 4.1, 8, 1); const p = pg.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 2.2) * 0.05); pg.computeVertexNormals();
    const m = new T.MeshStandardMaterial({ map: bannerTex(), roughness: 0.9, side: T.DoubleSide, emissive: 0xffffff, emissiveMap: bannerTex(), emissiveIntensity: 0.18 });
    add(g, pg, m, 0, 2.95, 0.14);
    for (let i = 0; i < 7; i++) { C(g, 0.012, 0.012, 0.25, metal(P.gold), -1.35 + i * 0.45, 0.78, 0.14); add(g, sphG(0.04, 8), metal(P.gold), -1.35 + i * 0.45, 0.64, 0.14); }
    return { group: g };
  }, ['banner', 'zungga', 'purple', 'star', 'flag']);

  R('cfu_round_table', 'Round stone table with engraved plaque', () => {
    const g = new T.Group(), st = mat(0x8a8076, { roughness: 0.9 });
    C(g, 0.55, 0.75, 0.25, st, 0, 0.125, 0, { seg: 24 }); C(g, 0.38, 0.45, 0.6, st, 0, 0.55, 0, { seg: 20 }); C(g, 1.35, 1.25, 0.18, st, 0, 0.94, 0, { seg: 40 });
    add(g, torG(1.33, 0.03, 6, 48), metal(P.gold, 0.3), 0, 1.03, 0, { rx: Math.PI / 2 });
    add(g, planeG(1.9, 1.9), new T.MeshStandardMaterial({ map: plaqueTex(), roughness: 0.6, metalness: 0.2, emissive: 0xffffff, emissiveMap: plaqueTex(), emissiveIntensity: 0.15 }), 0, 1.035, 0, { rx: -Math.PI / 2 });
    const fs = [];
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + 0.5, x = Math.cos(a) * 1.1, z = Math.sin(a) * 1.1; C(g, 0.08, 0.08, 0.04, metal(P.gold), x, 1.05, z); C(g, 0.04, 0.045, 0.22 + i * 0.05, mat(P.cream), x, 1.17 + i * 0.025, z); fs.push(flame(g, x, 1.29 + i * 0.05, z, 0.6)); }
    ticker(g, fs); return { group: g };
  }, ['table', 'round', 'stone', 'plaque', 'history']);

  R('cfu_candelabra', 'Tall bronze candelabra', () => {
    const g = new T.Group(), br = metal(P.bronze); C(g, 0.22, 0.28, 0.08, br, 0, 0.04, 0); C(g, 0.035, 0.05, 1.5, br, 0, 0.8, 0); add(g, sphG(0.07, 10), br, 0, 0.9, 0);
    B(g, 0.8, 0.04, 0.04, br, 0, 1.45, 0); const fs = [];
    for (const x of [-0.4, 0, 0.4]) { const y = x ? 1.55 : 1.62; C(g, 0.06, 0.04, 0.08, br, x, y - 0.06, 0); C(g, 0.035, 0.035, 0.2, mat(P.cream), x, y + 0.08, 0); fs.push(flame(g, x, y + 0.18, 0, 0.55)); if (x) C(g, 0.015, 0.015, 0.12, br, x, 1.5, 0); }
    ticker(g, fs); return { group: g };
  }, ['candles', 'candelabra', 'light', 'bronze']);

  R('cfu_carved_column', 'Carved stone column with glowing rune band', () => {
    const g = new T.Group(), st = mat(0x8a8076, { roughness: 0.9, flatShading: true }), h = 4.2;
    B(g, 1.0, 0.3, 1.0, mat(0x6f655c), 0, 0.15, 0); C(g, 0.44, 0.5, 0.2, st, 0, 0.4, 0, { seg: 12 });
    C(g, 0.38, 0.42, h - 1.0, st, 0, h / 2, 0, { seg: 12 }); C(g, 0.5, 0.4, 0.3, st, 0, h - 0.35, 0, { seg: 12 }); B(g, 1.0, 0.2, 1.0, mat(0x6f655c), 0, h - 0.1, 0);
    for (const y of [0.62, h - 0.62]) add(g, torG(0.41, 0.04, 6, 24), metal(P.gold, 0.3), 0, y, 0, { rx: Math.PI / 2 });
    const rt = runeStripTex('#a78bfa'); const m = new T.MeshBasicMaterial({ map: rt, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    add(g, cylG(0.41, 0.41, 0.3, 24, true), m, 0, h * 0.62, 0);
    return { group: g };
  }, ['column', 'pillar', 'carved', 'stone', 'runes']);

  // --- the recipe vault ---
  R('cfu_scroll_shelf', 'Shelf of golden recipe scrolls', () => {
    const g = new T.Group(), wd = mat(0x4a2e1c), r = rng(12);
    for (const x of [-1.3, 1.3]) B(g, 0.12, 3.0, 0.6, wd, x, 1.5, 0); B(g, 2.7, 3.0, 0.05, mat(0x3a2416), 0, 1.5, -0.28); B(g, 2.8, 0.14, 0.66, wd, 0, 3.05, 0);
    add(g, octG(0.14), glow(0xfacc15, 1.4), 0, 3.3, 0, { s: [1, 1.5, 1] });
    for (const y of [0.1, 0.8, 1.5, 2.2]) { B(g, 2.5, 0.06, 0.56, wd, 0, y, 0);
      for (let i = 0; i < 9; i++) { const x = -1.1 + i * 0.275, L = 0.42 + r() * 0.08, yy = y + 0.1 + (i % 3 === 1 ? 0.13 : 0);
        C(g, 0.075, 0.075, L, mat(P.cream, { roughness: 0.8 }), x, yy, 0.02, { rx: Math.PI / 2, seg: 10 });
        C(g, 0.085, 0.085, 0.05, glow(0xd4a017, 0.5), x, yy, 0.02 + L / 2, { rx: Math.PI / 2, seg: 10 }); } }
    return { group: g };
  }, ['scrolls', 'shelf', 'recipes', 'gold', 'vault']);

  R('cfu_recipe_pedestal', 'Pedestal with a golden recipe box', () => {
    const g = new T.Group(), st = mat(0x8a8076, { roughness: 0.9 }), au = metal(P.gold, 0.25);
    B(g, 0.9, 0.2, 0.9, mat(0x6f655c), 0, 0.1, 0); C(g, 0.3, 0.34, 0.85, st, 0, 0.62, 0, { seg: 12 }); B(g, 0.8, 0.14, 0.8, mat(0x6f655c), 0, 1.11, 0);
    const box = new T.Group(); box.position.y = 1.18; g.add(box);
    B(box, 0.5, 0.28, 0.36, au, 0, 0.14, 0); add(box, cylG(0.18, 0.18, 0.5, 16, false), au, 0, 0.28, 0, { rz: Math.PI / 2, s: [1, 1, 1] }).scale.set(1, 1, 1);
    B(box, 0.52, 0.02, 0.02, glow(0xfde68a, 2), 0, 0.29, 0.18); add(box, octG(0.06), glow(0xef4444, 1.2), 0, 0.15, 0.19);
    const ring = add(g, torG(0.42, 0.015, 6, 36), glow(0xfde68a, 2), 0, 1.6, 0, { rx: Math.PI / 2 });
    const lbl = new T.MeshStandardMaterial({ map: textTex('SECRET RECIPE', { bg: '#b8860b', fg: '#2a1a10', w: 512, h: 120, size: 60, radius: 14 }), metalness: 0.4, roughness: 0.4 }); add(g, planeG(0.6, 0.14), lbl, 0, 0.9, 0.31);
    ticker(g, [(t) => { ring.rotation.z = t * 0.6; ring.position.y = 1.62 + Math.sin(t * 1.4) * 0.06; }]);
    return { group: g };
  }, ['pedestal', 'recipe', 'gold', 'box', 'treasure']);

  R('cfu_gold_stack', 'Stack of gold bars and coins', () => {
    const g = new T.Group(), au = metal(0xe0b028, 0.25), bar = geo('barG', () => { const sh = new T.Shape(); sh.moveTo(-0.16, 0); sh.lineTo(0.16, 0); sh.lineTo(0.12, 0.09); sh.lineTo(-0.12, 0.09); sh.closePath(); return new T.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false }).translate(0, 0, -0.06); });
    let n = 0; for (let L = 0; L < 3; L++) for (let i = 0; i < 3 - L; i++) for (let k = 0; k < 2; k++) { add(g, bar, au, (i - (2 - L) / 2) * 0.34, L * 0.09, (k - 0.5) * 0.14 * 1.7, { ry: Math.PI / 2 * 0, s: [1, 1, 1.4] }); n++; }
    const coin = metal(0xf2c230, 0.3), r = rng(5);
    for (let s = 0; s < 5; s++) { const a = s * 1.3, x = Math.cos(a) * 0.6, z = Math.sin(a) * 0.45, h = 3 + ((r() * 6) | 0); C(g, 0.07, 0.07, h * 0.02, coin, x, h * 0.01, z, { seg: 14 }); }
    for (let i = 0; i < 6; i++) C(g, 0.07, 0.07, 0.02, coin, (r() - 0.5) * 1.4, 0.01, (r() - 0.5) * 1.0, { rx: (r() - 0.5) * 0.3, seg: 14 });
    return { group: g };
  }, ['gold', 'bars', 'coins', 'treasure', 'vault']);

  R('cfu_big_safe', 'Big ancient safe', () => {
    const g = new T.Group(), steel = metal(0x6b7280, 0.35), au = metal(P.gold, 0.3);
    for (const x of [-0.75, 0.75]) for (const z of [-0.45, 0.45]) C(g, 0.08, 0.1, 0.16, au, x, 0.08, z);
    B(g, 1.9, 2.2, 1.2, steel, 0, 1.26, 0); B(g, 1.6, 1.9, 0.08, metal(0x7c838f, 0.3), 0, 1.26, 0.62);
    for (const [w, h, x, y] of [[1.95, 0.08, 0, 2.38], [1.95, 0.08, 0, 0.17], [0.08, 2.2, -0.96, 1.26], [0.08, 2.2, 0.96, 1.26]]) B(g, w, h, 1.24, au, x, y, 0);
    add(g, cylG(0.3, 0.3, 0.08, 32), au, 0, 1.45, 0.68, { rx: Math.PI / 2 }); add(g, cylG(0.22, 0.22, 0.1, 32), mat(0x1f2937), 0, 1.45, 0.7, { rx: Math.PI / 2 });
    for (let i = 0; i < 4; i++) B(g, 0.06, 0.55, 0.06, au, 0, 1.45, 0.76, { rz: i * Math.PI / 4 });
    B(g, 0.07, 0.4, 0.1, au, 0.62, 1.2, 0.7);
    add(g, planeG(0.9, 0.24), new T.MeshStandardMaterial({ map: textTex('ZUNGGA', { bg: '#d4a017', fg: '#2a1a10', w: 512, h: 128, size: 90, radius: 14 }), metalness: 0.5, roughness: 0.35 }), 0, 2.0, 0.67);
    return { group: g };
  }, ['safe', 'vault', 'gold', 'secure']);

  // --- the secret chamber ---
  R('cfu_magic_book_altar', 'Altar with the glowing open magic book', () => {
    const g = new T.Group(), st = mat(0x7a6f66, { roughness: 0.9 }), au = metal(P.gold, 0.25);
    add(g, geo('altarG', () => lathe([[0, 0], [0.75, 0], [0.75, 0.15], [0.5, 0.25], [0.38, 0.4], [0.34, 0.9], [0.5, 1.02], [0.6, 1.1], [0, 1.1]], 24)), st);
    add(g, torG(0.36, 0.035, 6, 28), au, 0, 0.6, 0, { rx: Math.PI / 2 }); add(g, torG(0.6, 0.03, 6, 32), au, 0, 1.1, 0, { rx: Math.PI / 2 });
    const rm = new T.MeshBasicMaterial({ map: runeStripTex('#67e8f9'), transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }); add(g, cylG(0.37, 0.37, 0.22, 24, true), rm, 0, 0.78, 0);
    const lec = new T.Group(); lec.position.set(0, 1.2, 0); lec.rotation.x = 0.35; g.add(lec);
    B(lec, 0.95, 0.06, 0.66, mat(0x4c1d95, { roughness: 0.6 }), 0, 0, 0);
    const page = glow(0xfff4d6, 1.3), pages = [];
    for (const s of [-1, 1]) { const pg = B(lec, 0.42, 0.06, 0.58, page, s * 0.22, 0.06, 0, { rz: -s * 0.1 }); pages.push(pg); }
    const flip = new T.Group(); flip.position.set(0, 0.1, 0); lec.add(flip); const fp = B(flip, 0.4, 0.01, 0.56, page, 0.2, 0, 0);
    const txt = new T.MeshBasicMaterial({ map: runeStripTex('#7c3aed'), transparent: true, depthWrite: false }); for (const s of [-1, 1]) for (let i = 0; i < 4; i++) add(lec, planeG(0.34, 0.05), txt, s * 0.22, 0.095 + 0.01, -0.18 + i * 0.12, { rx: -Math.PI / 2 });
    const glowS = new T.Sprite(new T.SpriteMaterial({ map: sparkTex(), color: 0xc4b5fd, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.8 })); glowS.scale.set(2.2, 2.2, 1); glowS.position.set(0, 1.5, 0); g.add(glowS);
    // floating glyph rings
    const rings = [];
    [[1.0, 2.0, '#c4b5fd'], [1.4, 2.7, '#67e8f9'], [0.75, 3.35, '#fde68a']].forEach(([r, y, col], i) => {
      const t2 = runeStripTex(col).clone(); t2.needsUpdate = true; t2.repeat.set(Math.max(1, Math.round(r * 2)), 1);
      const m = new T.MeshBasicMaterial({ map: t2, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, opacity: 0.95 });
      const ring = add(g, cylG(r, r, 0.26, 40, true), m, 0, y, 0); ring.rotation.x = (i - 1) * 0.18; rings.push(ring);
      add(ring, torG(r, 0.012, 4, 48), glow(col === '#67e8f9' ? P.cyan : col === '#fde68a' ? 0xfacc15 : 0xa78bfa, 2), 0, 0.14, 0, { rx: Math.PI / 2 });
    });
    // sparkles rising from the book
    const N = 90, pos = new Float32Array(N * 3), seeds = []; const r0 = rng(77); for (let i = 0; i < N; i++) seeds.push([r0() * Math.PI * 2, r0(), 0.2 + r0() * 0.9, 0.3 + r0() * 0.7]);
    const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3));
    const pts = new T.Points(pg, new T.PointsMaterial({ map: sparkTex(), color: 0xe9d5ff, size: 0.16, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); pts.frustumCulled = false; g.add(pts);
    ticker(g, [(t) => {
      rings.forEach((rg, i) => { rg.rotation.y = t * (0.3 + i * 0.15) * (i % 2 ? -1 : 1); rg.position.y = [2.0, 2.7, 3.35][i] + Math.sin(t * 0.9 + i) * 0.08; });
      flip.rotation.z = -Math.max(0, Math.sin(t * 0.5)) * 2.9; void fp;
      glowS.material.opacity = 0.6 + Math.sin(t * 2) * 0.2; page.emissiveIntensity = 1.2 + Math.sin(t * 2) * 0.25;
      for (let i = 0; i < N; i++) { const [a, ph, rad, sp] = seeds[i], f = (t * sp * 0.25 + ph) % 1, aa = a + t * 0.6 * sp; pos[i * 3] = Math.cos(aa) * rad * (0.4 + f); pos[i * 3 + 1] = 1.35 + f * 3.2; pos[i * 3 + 2] = Math.sin(aa) * rad * (0.4 + f); }
      pg.attributes.position.needsUpdate = true;
    }]);
    return { group: g };
  }, ['book', 'magic', 'altar', 'glow', 'secret', 'spell']);

  function bigCrystal(col, seed) {
    return () => {
      const g = new T.Group(), r = rng(seed), cm = glow(col, 1.25), pale = glow(new T.Color(col).lerp(new T.Color(0xffffff), 0.45).getHex(), 1.5);
      add(g, geo('rockBase', () => new T.DodecahedronGeometry(0.9, 0)), mat(0x463d52, { roughness: 1, flatShading: true }), 0, 0.2, 0, { s: [1.4, 0.45, 1.1] });
      const spec = [[0, 0, 0, 3.0, 0.42], [0.55, 0.2, 0.35, 2.0, 0.3], [-0.55, -0.15, -0.3, 2.2, 0.32], [0.3, -0.5, -0.4, 1.4, 0.24], [-0.4, 0.45, 0.4, 1.2, 0.22], [0.75, -0.25, 0.1, 0.9, 0.18], [-0.8, 0.1, 0.2, 0.8, 0.16]];
      for (const [x, z, tilt, h, rad] of spec) { const me = add(g, geo('cryG', () => new T.OctahedronGeometry(0.5, 0).scale(1, 2.6, 1).translate(0, 1.3, 0)), r() > 0.7 ? pale : cm, x, 0.15, z); me.scale.set(rad * 2, h / 2.6, rad * 2); me.rotation.set(tilt * 0.5 + (r() - 0.5) * 0.1, r() * 3, (x > 0 ? -1 : 1) * Math.abs(x) * 0.45); }
      return { group: g };
    };
  }
  R('cfu_big_crystal', 'Big glowing crystal formation (purple)', bigCrystal(P.violet, 21), ['crystal', 'big', 'glow', 'purple', 'magic']);
  R('cfu_big_crystal_cyan', 'Big glowing crystal formation (cyan)', bigCrystal(P.cyan, 33), ['crystal', 'big', 'glow', 'cyan', 'magic']);

  R('cfu_cocoa_grinder', 'Ancient stone cocoa grinder (turning)', () => {
    const g = new T.Group(), st = mat(0x8a8076, { roughness: 0.95 }), br = metal(P.bronze), wd = mat(0x5e3e22);
    C(g, 1.3, 1.4, 0.7, st, 0, 0.35, 0, { seg: 28 }); add(g, torG(1.3, 0.06, 6, 40), br, 0, 0.7, 0, { rx: Math.PI / 2 });
    add(g, cylG(1.12, 1.12, 0.05, 28), mat(0x4a2a18, { roughness: 0.4 }), 0, 0.68, 0);
    C(g, 0.12, 0.12, 2.6, metal(P.iron), 0, 1.9, 0);
    for (const s of [-1, 1]) { B(g, 0.25, 3.3, 0.25, wd, s * 1.45, 1.65, 0); }
    B(g, 3.2, 0.25, 0.3, wd, 0, 3.3, 0);
    const rot = new T.Group(); g.add(rot);
    const wheel = add(rot, cylG(0.55, 0.55, 0.32, 24), st, 0.6, 1.25, 0, { rz: Math.PI / 2 }); add(rot, cylG(0.12, 0.12, 1.5, 10), metal(P.iron), 0.45, 1.25, 0, { rz: Math.PI / 2 }); void wheel;
    const top = gear(rot, 0.6, 12, 0.14, br, 0, 2.9, 0); top.rotation.x = Math.PI / 2;
    const side = gear(g, 0.45, 9, 0.12, metal(P.gold), 0, 2.9 - 0.0, 0.62); side.position.set(0, 2.6, 0.62);
    add(rot, octG(0.12), glow(P.cyan, 1.6), 0, 3.05, 0, { s: [1, 1.6, 1] });
    ticker(g, [(t) => { rot.rotation.y = t * 0.5; wheel.rotation.x = 0; side.rotation.z = -t * 0.5 * 0.6 / 0.45; }]);
    return { group: g };
  }, ['grinder', 'mill', 'cocoa', 'stone', 'machine', 'ancient']);

  // --- reservoir ---
  R('cfu_rowboat', 'Little wooden rowing boat', () => {
    const g = new T.Group(), wd = mat(0x8a5a33), dk = mat(0x5e3e22);
    const hull = add(g, geo('hullG', () => new T.SphereGeometry(1, 20, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), new T.MeshStandardMaterial({ color: 0x9a6236, roughness: 0.8, side: T.DoubleSide }), 0, 0.55, 0, { s: [1.75, 0.55, 0.68] }); void hull;
    add(g, torG(1, 0.05, 6, 32), mat(P.purple, { roughness: 0.6 }), 0, 0.55, 0, { rx: Math.PI / 2, s: [1.75, 0.68, 1] });
    for (const x of [-0.6, 0.5]) B(g, 0.3, 0.05, 1.15, wd, x, 0.4, 0);
    B(g, 0.12, 0.25, 0.2, dk, 0, 0.12, 0); B(g, 2.6, 0.1, 0.2, dk, 0, 0.05, 0);
    for (const s of [-1, 1]) { const oar = new T.Group(); oar.position.set(-0.1, 0.62, s * 0.45); oar.rotation.y = s * 0.25; g.add(oar); C(oar, 0.025, 0.025, 2.0, wd, 0, 0, 0, { rz: Math.PI / 2 }); B(oar, 0.45, 0.02, 0.16, wd, 1.1, 0, 0); }
    add(g, planeG(0.7, 0.18), decalM('boatLbl', textTex('LITTLE COCOA', { fg: '#f5e6c8', w: 512, h: 120, size: 70 }), { side: T.DoubleSide }), 0.6, 0.42, 0.62, { ry: -0.15 });
    return { group: g };
  }, ['boat', 'rowboat', 'oars', 'dock']);

  R('cfu_dock', 'Small wooden dock with lantern post', () => {
    const g = new T.Group(), wd = mat(0x7a5232), dk = mat(0x4a3220);
    for (let i = 0; i < 7; i++) B(g, 3.0, 0.08, 0.28, i % 2 ? wd : mat(0x86603a), 0, 0.1, -0.9 + i * 0.3);
    for (const z of [-0.95, 0.95]) B(g, 3.0, 0.1, 0.12, dk, 0, 0.03, z);
    for (const x of [-1.4, 1.4]) for (const z of [-1.0, 1.0]) { C(g, 0.08, 0.09, 0.8, dk, x, 0.4, z); add(g, torG(0.1, 0.025, 5, 12), mat(0xc9a46a), x, 0.55, z, { rx: Math.PI / 2 }); }
    C(g, 0.06, 0.07, 2.2, dk, -1.4, 1.1, -1.0); B(g, 0.5, 0.05, 0.05, dk, -1.18, 2.15, -1.0);
    const L = new T.Group(); L.position.set(-0.98, 1.75, -1.0); g.add(L); C(L, 0.01, 0.01, 0.2, metal(0x3a3330), 0, 0.33, 0); B(L, 0.2, 0.32, 0.2, glow(0xffc46b, 1.8), 0, 0.08, 0); add(L, coneG(0.17, 0.14, 6), metal(0x3a3330), 0, 0.3, 0); B(L, 0.22, 0.03, 0.22, metal(0x3a3330), 0, -0.09, 0);
    add(g, torG(0.2, 0.06, 6, 16), mat(0xc9a46a), 0.6, 0.18, 0.5, { rx: Math.PI / 2 }); add(g, torG(0.12, 0.05, 6, 14), mat(0xc9a46a), 0.6, 0.26, 0.5, { rx: Math.PI / 2 });
    return { group: g };
  }, ['dock', 'jetty', 'pier', 'wood', 'lantern']);

  R('cfu_crystal_ledge', 'Rock ledge with glowing crystals (wall)', () => {
    const g = new T.Group(); B(g, 1.4, 0.3, 0.6, mat(0x4a3a33, { roughness: 1 }), 0, 0.15, 0.3);
    const r = rng(41); for (let i = 0; i < 5; i++) { const col = [P.violet, P.cyan, 0xf0abfc, P.teal][i % 4]; add(g, geo('cryG2', () => new T.OctahedronGeometry(0.5, 0).scale(1, 2.6, 1).translate(0, 1.3, 0)), glow(col, 1.3), -0.5 + i * 0.25, 0.28, 0.25 + (r() - 0.5) * 0.25, { s: 0.16 + r() * 0.16, rz: (r() - 0.5) * 0.8 }); }
    return { group: g };
  }, ['crystal', 'ledge', 'wall', 'glow', 'cave']);

  // =====================================================================================================
  //  ROOM HELPERS
  // =====================================================================================================
  const prop = (c, id, x, y, z, ry = 0, s = 1, o = {}) => c.prop(id, x, y, z, ry, s, o);
  const deco = (c, id, x, y, z, ry = 0, s = 1) => c.prop(id, x, y, z, ry, s, { col: false });
  // flat floor decal
  function floorDecal(c, map, w, d, x, z, ry = 0, o = {}) { const m = decalM(o.key || map.uuid + (o.ei ?? ''), map, { emissive: o.glowCol ?? 0xffffff, ei: o.ei ?? 0.7 }); const me = add(c.g, planeG(w, d), m, x, 0.012 + (o.lift || 0), z, { rx: -Math.PI / 2 }); me.rotation.order = 'YXZ'; me.rotation.y = ry; return me; }
  // a wall-facing vertical plane; side: 'n' | 's' | 'e' | 'w' (which wall it hangs on)
  const wallRot = { n: 0, s: Math.PI, w: Math.PI / 2, e: -Math.PI / 2 };
  function wallPos(spec, side, along, inset = 0) {
    const hw = spec.w / 2 - 0.3 - inset, hd = spec.d / 2 - 0.3 - inset;
    return side === 'n' ? [along, -hd] : side === 's' ? [along, hd] : side === 'w' ? [-hw, along] : [hw, along];
  }
  function veins(c, spec, side, along, len, y0, hgt, tint = 1) {
    const t = veinTex().clone(); t.needsUpdate = true; t.repeat.set(len / 6, 1);
    const m = new T.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 1.1 * tint, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const [x, z] = wallPos(spec, side, along, 0.02); const me = add(c.g, planeG(len, hgt), m, x, y0 + hgt / 2, z, { ry: wallRot[side] }); return me;
  }
  function wallGlyph(c, spec, side, along, y, ch, col, size = 0.7) {
    const [x, z] = wallPos(spec, side, along, 0.03); return addBasic(c.g, planeG(size, size), glyphTex(ch, col), 0xffffff, x, y, z, { ry: wallRot[side] });
  }
  function runeBand(c, spec, side, along, len, y, col = '#c4b5fd') {
    const t = runeStripTex(col).clone(); t.needsUpdate = true; t.repeat.set(len / 5, 1);
    const [x, z] = wallPos(spec, side, along, 0.03); return addBasic(c.g, planeG(len, 0.32), t, 0xffffff, x, y, z, { ry: wallRot[side], opacity: 0.85 });
  }
  function cobweb(c, x, y, z, ry, s = 1) { deco(c, 'cfu_cobweb', x, y, z, ry, s); }
  // cobwebs in the 4 top corners of a room
  function cornerWebs(c, spec, h) {
    const hx = spec.w / 2 - 0.3, hz = spec.d / 2 - 0.32;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) deco(c, 'cfu_cobweb', sx * hx, h - 1.25, sz * hz, sx < 0 ? 0 : Math.PI);
  }
  function pointLight(c, x, y, z, col, i = 14, d = 16) { const p = new T.PointLight(col, i, d, 1.6); p.position.set(x, y, z); c.g.add(p); return p; }
  // wooden beam (col:false) between two points at height y
  function beam(c, x0, z0, x1, z1, y, t = 0.28, m = mat(0x5e3e22)) { const L = Math.hypot(x1 - x0, z1 - z0); const me = add(c.g, boxG(L, t, t), m, (x0 + x1) / 2, y + t / 2, (z0 + z1) / 2, { ry: -Math.atan2(z1 - z0, x1 - x0) }); return me; }

  // =====================================================================================================
  //  ROOMS
  // =====================================================================================================

  // 1 · Hidden Entrance — arrival from the secret spiral stairs / slide
  D.hidden_entrance = (c, spec) => {
    const h = spec.h, hx = spec.w / 2 - 0.3, hz = spec.d / 2 - 0.3, door = (spec.doors && spec.doors[0] ? spec.doors[0].at : 4), sh = spec.shaft || { x: 0, z: 0.7, r: 2.75 };
    const wood = mat(0x5e3e22, { roughness: 0.9 });
    // the stone sign on the north wall
    prop(c, 'cfu_stone_sign', 0, 0, -hz + 0.38, 0, 1);
    // old timber frame: posts tight to the walls + ceiling beams
    for (const z of [-5, 6]) { for (const s of [-1, 1]) c.box(0.26, h - 0.3, 0.26, s * (hx - 0.13), 0, z, wood, { cast: false }); beam(c, -hx, z, hx, z, h - 0.6, 0.3, wood); }
    for (const s of [-1, 1]) beam(c, s * (hx - 0.16), -hz, s * (hx - 0.16), hz, h - 0.6, 0.24, wood);
    for (const s of [-1, 1]) add(c.g, boxG(0.12, 0.9, 0.12), wood, s * (hx - 0.5), h - 0.9, -5 + 0.3, { rz: s * 0.7 });
    // hanging lanterns from the beams
    for (const [x, z] of [[-2.6, -5], [2.6, -5], [-1.6, 6], [2.4, 6]]) deco(c, 'cfu_hanging_lantern', x, h - 0.6 - 1.4, z);
    // dusty crates & barrels in the corners (clear of the shaft and the slide run-out)
    prop(c, 'cfu_crate', -hx + 0.55, 0, -hz + 0.55, 0.1); deco(c, 'cfu_crate', -hx + 0.55, 0.9, -hz + 0.55, -0.3, 0.75); prop(c, 'cfu_barrel', -hx + 0.5, 0, -hz + 1.6, 0); prop(c, 'cfu_barrel', -hx + 1.5, 0, -hz + 0.5, 0.4, 0.9);
    prop(c, 'cfu_barrel', hx - 0.5, 0, -hz + 0.5, 0); prop(c, 'cfu_barrel', hx - 0.5, 0, -hz + 1.4, 1, 0.95); prop(c, 'cfu_crate', hx - 0.55, 0, -hz + 2.5, -0.2, 0.9); deco(c, 'cfu_sack', hx - 1.4, 0, -hz + 0.5, 0.5, 0.9);
    prop(c, 'cfu_crate', -hx + 0.55, 0, hz - 0.55, 0.3); prop(c, 'cfu_barrel', -hx + 1.5, 0, hz - 0.45, 0, 0.9); deco(c, 'cfu_sack', -hx + 0.55, 0.9, hz - 0.55, 1.2, 0.7);
    prop(c, 'cfu_crate', hx - 0.55, 0, hz - 0.55, -0.15, 0.85); prop(c, 'cfu_sack', hx - 1.45, 0, hz - 0.45, 2.2, 0.9);
    // small glowing touches
    deco(c, 'glow_mushroom_patch', -hx + 0.6, 0, -1.6, 0, 0.7); deco(c, 'glow_mushroom_patch', hx - 0.5, 0, -hz + 3.4, 1, 0.6);
    deco(c, 'cave_crystal', -hx + 1.4, 0, -hz + 1.4, 0.4, 0.45); deco(c, 'cave_crystal_cyan', hx - 1.3, 0, hz - 1.3, 0.2, 0.4);
    // gold footprints + dashed path from the stairs/slide to the east door
    const pts = [[-3.2, 3.6], [-1.6, 4.9], [0.6, 5.0], [2.6, 4.5], [4.6, door]]; let side = 1;
    for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 0.55)), a = Math.atan2(bx - ax, bz - az);
      for (let k = 0; k < n; k++) { const f = (k + 0.5) / n, x = ax + (bx - ax) * f + Math.cos(a) * 0.12 * side, z = az + (bz - az) * f - Math.sin(a) * 0.12 * side; floorDecal(c, footTex(), 0.16, 0.32, x, z, a + Math.PI, { key: 'foot', ei: 0.9, glowCol: 0xffd75a }); side = -side; } }
    const dash = glow(0xd4a017, 0.6); for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 0.7)), a = Math.atan2(bx - ax, bz - az); for (let k = 0; k < n; k++) { const f = (k + 0.5) / n; add(c.g, boxG(0.07, 0.01, 0.3), dash, ax + (bx - ax) * f, 0.006, az + (bz - az) * f, { ry: a }); } }
    // a glowing arrow + label over the east door
    const lbl = new T.MeshStandardMaterial({ map: textTex('THIS WAY  →', { bg: '#2a1f1a', fg: '#fde68a', glow: '#fbbf24', w: 512, h: 120, size: 64, radius: 16 }), emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.8 }); lbl.emissiveMap = lbl.map;
    add(c.g, planeG(1.4, 0.33), lbl, hx - 0.02, 3.2, door, { ry: -Math.PI / 2 });
    runeBand(c, spec, 'w', -1.5, 8, 3.6); runeBand(c, spec, 's', 0, 6, 3.6, '#fde68a');
    cornerWebs(c, spec, h);
    void sh;
  };

  // 2 · Secret Spiral Staircase — frame at the lower pit floor; upper floor at spec.upperFloorY
  D.spiral_staircase = (c, spec) => {
    const U = spec.upperFloorY ?? 4, hx = spec.w / 2 - 0.3, hz = spec.d / 2 - 0.3, sp = spec.spiral || { x: 0.25, z: 0, r: 2.4 }, H = spec.h;
    // pit (under the upper floor slab, 3.5 m high): carved pillars in the corners + crystal clusters
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { prop(c, 'cfu_rune_pillar', sx * (hx - 0.5), 0, sz * (hz - 0.5), 0, 1.0); }
    prop(c, 'crystal_cluster', -hx + 1.7, 0, -hz + 0.9, 0.3, 0.8); prop(c, 'crystal_cluster', -hx + 1.7, 0, hz - 0.9, 2.1, 0.8);
    prop(c, 'crystal_cluster', hx - 1.0, 0, -hz + 1.8, 1.2, 0.75); prop(c, 'crystal_cluster', hx - 1.0, 0, hz - 1.9, 4, 0.75);
    deco(c, 'cave_crystal_cyan', -hx + 0.5, 0, 0, 0, 0.6); deco(c, 'cave_crystal_pink', -hx + 0.5, 0, 1.2, 1, 0.45); deco(c, 'glow_mushroom_patch', -hx + 0.8, 0, -1.5, 0, 0.8);
    deco(c, 'glow_mushroom_patch', 3.6, 0, hz - 0.6, 2, 0.7); deco(c, 'glow_mushroom_patch', 3.6, 0, -hz + 0.6, 1, 0.7);
    for (const side of ['n', 's']) for (const a of [-4, 4]) wallGlyph(c, spec, side, a, 2.2, side === 'n' ? 'ᛟ' : 'ᚨ', '#c4b5fd', 0.8);
    runeBand(c, spec, 'w', 0, 9, 2.8, '#67e8f9'); veins(c, spec, 'n', 0, 10, 0.2, 3.0, 0.8); veins(c, spec, 's', 0, 10, 0.2, 3.0, 0.8);
    pointLight(c, -4.8, 2.6, 0, 0xa78bfa, 10, 12);
    // upper floor (y = U): pillars in the corners, crystal ledges, chains, runes
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) prop(c, 'cfu_rune_pillar', sx * (hx - 0.6), U, sz * (hz - 0.6), 0, 1.3);
    prop(c, 'crystal_cluster', 3.2, U, -hz + 0.7, 0.5, 0.75); prop(c, 'crystal_cluster', 3.2, U, hz - 0.7, 2.5, 0.75); prop(c, 'crystal_cluster', hx - 0.8, U, 0, 1.5, 0.8);
    deco(c, 'cave_crystal', -3.2, U, -hz + 0.45, 0.3, 0.5); deco(c, 'cave_crystal_cyan', -3.2, U, hz - 0.45, 0.3, 0.5);
    for (const [side, a, y] of [['n', -1.5, U + 2.6], ['s', 1.5, U + 2.6], ['e', -2.8, U + 3.0], ['e', 2.8, U + 3.0], ['n', 3.5, U + 3.4], ['s', -3.5, U + 3.4]]) { const [x, z] = wallPos(spec, side, a); deco(c, 'cfu_crystal_ledge', x, y, z, wallRot[side]); }
    for (const [x, z] of [[-4.2, -3.6], [4.6, -3.0], [4.6, 3.0], [-4.2, 3.6]]) deco(c, 'cfu_hanging_chain', x, H - 0.3 - 3.0, z, x * z);
    for (const side of ['n', 's', 'e']) runeBand(c, spec, side, 0, side === 'e' ? 8 : 10, U + 3.9, '#c4b5fd');
    for (const [side, a, ch, col] of [['n', -4, '☾', '#c4b5fd'], ['n', 0.25, '★', '#fde68a'], ['s', 0.25, '☀', '#fde68a'], ['s', 4, '♦', '#67e8f9'], ['e', -1.4, '✿', '#f9a8d4'], ['e', 1.4, '♥', '#fca5a5']]) wallGlyph(c, spec, side, a, U + 2.0, ch, col, 0.9);
    veins(c, spec, 'e', 0, 9, U + 0.2, 4.4, 0.7);
    cornerWebs(c, spec, H);
    void sp;
  };

  // 3 · Forgotten Tunnel Network — maze of rock pillars: decorate walls & pillar faces only
  D.tunnel_network = (c, spec) => {
    const hx = spec.w / 2 - 0.3, hz = spec.d / 2 - 0.3, h = spec.h, wood = mat(0x5e3e22, { roughness: 0.9 });
    const P2 = spec.pillars || [];
    // mine-door frames at the three doors (posts tight beside the door, beam above)
    const frameAt = (x, z, alongX) => { for (const s of [-1, 1]) c.box(0.24, 3.0, 0.24, alongX ? x + s * 1.48 : x, 0, alongX ? z : z + s * 1.48, wood, { cast: false }); add(c.g, boxG(alongX ? 3.3 : 0.3, 0.3, alongX ? 0.3 : 3.3), wood, x, 3.15, z); };
    frameAt(-hx + 0.13, 0, false); frameAt(hx - 0.13, -0.5, false); frameAt(0, hz - 0.13, true);
    // beams spanning the gaps between pillars / walls (posts sunk into the rock faces)
    for (const [x0, z0, x1, z1] of [[-6, -3.75, -4.25, -3.75], [-0.75, -1.25, 2, -1.25], [-0.75, 3.4, 2, 3.4], [5.5, -7, 7.25, -7], [10, 6.5, hx, 6.5], [-6, 6.4, -4.25, 6.4], [-hx, -6.5, -9, -6.5], [-hx, 7, -9, 7]]) {
      if (Math.abs(x1 - x0) < 0.3) continue; beam(c, x0, z0, x1, z1, 3.2, 0.26, wood);
      for (const [px, pz] of [[x0, z0], [x1, z1]]) add(c.g, boxG(0.22, 3.2, 0.22), wood, px + (px === x0 ? -0.1 : 0.1), 1.6, pz);
    }
    // rails: west door → centre → south door, and a spur to the cart dead-end in the north
    const rail = (x, z, ry, n) => { for (let i = 0; i < n; i++) deco(c, 'cfu_rails', x + Math.cos(ry) * i * 4, 0, z - Math.sin(ry) * i * 4, ry); };
    rail(-hx + 2, 0, 0, 3); rail(0.6, 1.6, -Math.PI / 2, 2); deco(c, 'cfu_rails', 0.6, 0, 8.4, -Math.PI / 2);   // along x, then along z (south)
    deco(c, 'cfu_rails', -3, 0, -7.6, -Math.PI / 2);
    // mine carts in the dead ends
    prop(c, 'cfu_mine_cart', -3, 0, -hz + 1.25, Math.PI / 2, 1);
    deco(c, 'cfu_rails', 4.5, 0, hz - 0.95, 0); prop(c, 'cfu_mine_cart', 4.5, 0, hz - 0.95, 0, 1);
    // glowing mushrooms + small crystals hugging pillar corners and walls (no colliders)
    const r = rng(17);
    for (const p of P2) { for (const [sx, sz] of [[-1, -1], [1, 1], [1, -1], [-1, 1]]) { if (r() < 0.45) continue; const x = p.x + sx * (p.w / 2 + 0.18), z = p.z + sz * (p.d / 2 + 0.18); if (Math.abs(x) > hx - 0.2 || Math.abs(z) > hz - 0.2) continue; deco(c, r() < 0.5 ? 'glow_mushroom_patch' : (r() < 0.5 ? 'cave_crystal_cyan' : 'cave_crystal'), x, 0, z, r() * 6, r() < 0.5 ? 0.35 : 0.3); } }
    for (const [x, z, id] of [[-hx + 0.3, -8.5, 'glow_mushroom_patch'], [hx - 0.3, 8.5, 'glow_mushroom_patch'], [-hx + 0.3, 9.5, 'cave_crystal_pink'], [hx - 0.3, -9.5, 'cave_crystal_indigo'], [6, -hz + 0.3, 'glow_mushroom_patch'], [-8, hz - 0.3, 'cave_crystal_cyan']]) deco(c, id, x, 0, z, r() * 6, 0.35);
    // crystal ledges high on pillar faces + walls
    for (const p of P2) { if (r() < 0.3) continue; deco(c, 'cfu_crystal_ledge', p.x, 2.6 + r() * 0.6, p.z + p.d / 2 + 0.02, 0, 0.8); }
    // hanging lanterns under some beams, cobwebs in corners
    for (const [x, z] of [[-5.1, -3.75], [0.6, -1.25], [0.6, 3.4], [6.4, -7]]) deco(c, 'cfu_hanging_lantern', x, 3.2 - 1.4, z);
    cornerWebs(c, spec, h);
    for (const p of P2) cobweb(c, p.x + p.w / 2 + 0.02, h - 1.25, p.z + p.d / 2, Math.PI / 2, 0.9);
    veins(c, spec, 'n', 0, 22, 0.4, 3.4, 0.6); veins(c, spec, 's', -6, 9, 0.4, 3.2, 0.6);
  };

  // 4 · Ancient Machinery Hall — machines along the walls, the centre aisle stays open
  D.machinery_hall = (c, spec) => {
    const hx = spec.w / 2 - 0.3, hz = spec.d / 2 - 0.3, h = spec.h, cu = metal(P.copper, 0.35), br = metal(P.bronze);
    // north wall
    prop(c, 'cfu_gear_wall', -8, 0, -hz + 0.02, 0);
    prop(c, 'cfu_boiler', 3.6, 0, -hz + 1.35, 0);
    prop(c, 'cfu_piston', 7.6, 0, -hz + 0.9, 0); prop(c, 'cfu_piston', 10.2, 0, -hz + 0.9, 0);
    prop(c, 'cfu_ancient_gear', -12.4, 0, -hz + 0.6, 0, 1.1);
    // south wall
    prop(c, 'cfu_conveyor', -6.5, 0, hz - 0.75, 0);
    prop(c, 'cfu_lever_panel', 3.6, 0, hz - 0.55, Math.PI);
    c.interact({ x: 3.6, z: hz - 1.6, r: 1.8, label: 'Pull the big lever (whoosh!)', fn: () => { burstAt = clock; } });
    prop(c, 'cfu_boiler', -12.3, 0, hz - 1.35, 0, 0.95);
    prop(c, 'cfu_piston', 8.4, 0, hz - 0.9, Math.PI); prop(c, 'cfu_piston', 11, 0, hz - 0.9, Math.PI);
    // machine islands between the walls and the aisle (aisle z −2.5 … +3 stays open)
    prop(c, 'cfu_cocoa_grinder', -4.5, 0, -6.0, 0); prop(c, 'cfu_gear_tower', 8.2, 0, -6.0, 0, 0.8);
    prop(c, 'cfu_conveyor', 6.0, 0, 6.6, 0); prop(c, 'cfu_cocoa_grinder', -6.5, 0, 6.0, 0.6);
    // east wall: the giant gear tower at the end of the aisle + a gear wall
    prop(c, 'cfu_gear_tower', hx - 0.65, 0, 0.25, -Math.PI / 2);
    prop(c, 'cfu_gear_wall', hx - 0.02, 0, -6.6, -Math.PI / 2, 0.95);
    prop(c, 'cfu_gear_wall', -hx + 0.02, 0, -6.6, Math.PI / 2, 0.95);
    deco(c, 'cfu_wall_carving_machine', -hx + 0.08, 0.8, 8.6, Math.PI / 2, 1);
    // pipes along the walls and across the ceiling
    const pipe = (x0, z0, x1, z1, y, r = 0.22, m = cu) => { const L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0); add(c.g, cylG(r, r, L, 14), m, (x0 + x1) / 2, y, (z0 + z1) / 2).rotation.set(Math.PI / 2, a, 0, 'YXZ'); for (let k = 0; k <= L; k += 3) add(c.g, cylG(r * 1.35, r * 1.35, 0.14, 14), br, x0 + (x1 - x0) * (k / L), y, z0 + (z1 - z0) * (k / L)).rotation.set(Math.PI / 2, a, 0, 'YXZ'); };
    const vpipe = (x, z, y0, y1, r = 0.18) => { add(c.g, cylG(r, r, y1 - y0, 12), cu, x, (y0 + y1) / 2, z); add(c.g, sphG(r * 1.25, 10), br, x, y1, z); };
    pipe(-hx, -hz + 0.35, hx, -hz + 0.35, 5.6); pipe(-hx, -hz + 0.8, hx, -hz + 0.8, 6.15, 0.16, br);
    pipe(-hx, hz - 0.35, hx, hz - 0.35, 5.6); pipe(-hx, hz - 0.8, hx, hz - 0.8, 6.15, 0.16, br);
    for (const x of [-4.5, 6.5]) pipe(x, -hz, x, hz, 6.35, 0.26);
    pipe(-hx + 0.35, -hz, -hx + 0.35, hz, 5.0, 0.18); pipe(hx - 0.35, -hz, hx - 0.35, hz, 5.0, 0.18);
    vpipe(-11.9, hz - 0.35, 4.9, 5.6); vpipe(7.6, -hz + 0.35, 3.6, 5.6, 0.12); vpipe(10.2, -hz + 0.35, 3.6, 5.6, 0.12);
    for (const [x, z] of [[-4.5, -hz + 0.35], [6.5, hz - 0.35], [-hx + 0.35, 4]]) { const v = new T.Group(); v.position.set(x, z === 4 ? 5.0 : 5.6, z); c.g.add(v); add(v, torG(0.32, 0.04, 6, 20), mat(0xb91c1c, { roughness: 0.5 }), 0, 0, z === 4 ? 0 : 0.35, {}); }
    // steam puffing from pipe joints (+ a whoosh when the lever is pulled)
    let clock = 0, burstAt = -99;
    const sg = new T.Group(); c.g.add(sg);
    const st = [steam(sg, -4.5, 6.0, -hz + 0.6, 4, 1.0, 0.25, 0.5, 1), steam(sg, 6.5, 6.0, hz - 0.6, 4, 1.0, 0.25, 0.45, 2), steam(sg, 0, 5.8, hz - 0.35, 3, 1.0, 0.22, 0.55, 3)];
    const burst = steam(sg, 3.6, 2.6, hz - 1.0, 6, 2.6, 0.45, 0.9, 4);
    c.tick((t) => { clock = t; st.forEach((f) => f(t)); const k = t - burstAt; sg.children.slice(-6).forEach((m) => { m.visible = k < 3; }); if (k < 3) burst(t); }, sg);
    // a few crates & tools along the walls, crystals for warmth
    prop(c, 'cfu_crate', -hx + 0.55, 0, 2.6, 0.2, 0.9); prop(c, 'cfu_barrel', -hx + 0.5, 0, 3.7, 0); prop(c, 'cfu_crate', hx - 0.55, 0, 8.6, -0.3);
    deco(c, 'cave_crystal_cyan', hx - 0.5, 0, 9.7, 0.4, 0.5); deco(c, 'cave_crystal', -hx + 0.5, 0, -9.8, 0.3, 0.5);
    for (const side of ['n', 's']) runeBand(c, spec, side, 0, 26, 4.6, '#fde68a');
    cornerWebs(c, spec, h);
  };

  // 5 · Chocolate Reservoir — dock, boat, stalagmites and crystals round the swimmable pool
  D.chocolate_reservoir = (c, spec) => {
    const hx = spec.w / 2 - 0.3, hz = spec.d / 2 - 0.3, h = spec.h, pl = spec.pool || { x: 0.5, z: 0.25, w: 24, d: 7.5 };
    const px0 = pl.x - pl.w / 2 - 0.4, px1 = pl.x + pl.w / 2 + 0.4;   // rim outer edges (x)
    // west side: the dock (flat, walkable, no colliders) + moored boat
    deco(c, 'cfu_dock', px0 - 1.5, 0, -0.6, 0);
    prop(c, 'cfu_rowboat', px0 - 4.2, 0, -1.0, Math.PI / 2);
    deco(c, 'cfu_crate', px0 - 0.6, 0.14, -1.3, 0.3, 0.55); deco(c, 'cfu_barrel', px0 - 2.4, 0.14, 0.1, 0, 0.6);
    const rope = add(c.g, cylG(0.02, 0.02, 1.4, 6), mat(0xc9a46a), px0 - 3.6, 0.55, -0.4, { rz: Math.PI / 2 - 0.25 }); void rope;
    // stalagmites, crystals and mushrooms in the corners / along the end walls
    prop(c, 'stalagmites', -hx + 0.9, 0, -hz + 0.9, 0.4, 0.8); prop(c, 'stalagmites', -hx + 0.9, 0, hz - 0.9, 2.1, 0.7);
    prop(c, 'stalagmites', hx - 0.9, 0, -hz + 0.9, 1.3, 0.8);
    prop(c, 'cfu_big_crystal', hx - 1.0, 0, -1.6, 0.6, 0.65); prop(c, 'cfu_big_crystal_cyan', hx - 1.0, 0, 1.6, 2.2, 0.6);
    prop(c, 'crystal_cluster', -hx + 0.8, 0, -2.6, 1, 0.75); prop(c, 'crystal_cluster', hx - 0.8, 0, hz - 0.8, 3, 0.7);
    deco(c, 'cave_crystal_cyan', -hx + 0.5, 0, 4.4, 0.4, 0.5); deco(c, 'cave_crystal_pink', hx - 2.4, 0, -hz + 0.45, 0.5, 0.45);
    for (const [x, z] of [[-hx + 1.9, -hz + 0.5], [-hx + 0.5, 0.2], [hx - 2.2, hz - 0.5], [hx - 0.5, -3.4], [-6, hz - 0.35], [4, hz - 0.35], [-12, -hz + 0.35], [12, hz - 0.35]]) deco(c, 'glow_mushroom_patch', x, 0, z, x, 0.6);
    // stalactites from the ceiling (above walkways — out of reach) + glowing veins on the walls
    for (const [x, z, s] of [[-15, -4.6, 0.7], [-9, 5.2, 0.6], [-1, -5.2, 0.55], [9, 5.2, 0.6], [16, -4.6, 0.7], [16, 4.6, 0.6], [-16, 4.6, 0.6]]) deco(c, 'stalactites', x, h - 1.8 * s - 0.2, z, x, s);
    veins(c, spec, 'n', -12, 12, 0.3, 5.5); veins(c, spec, 'n', 13, 10, 0.3, 5.5); veins(c, spec, 's', -6, 18, 0.3, 5.5); veins(c, spec, 'w', -3.5, 5, 0.3, 5.5); veins(c, spec, 'e', 0, 8, 0.3, 5.5);
    for (const [side, a, y] of [['n', -15, 3.8], ['n', 0.5, 4.4], ['n', 16, 3.6], ['s', -10, 3.6], ['s', 2, 4.0], ['s', 17, 3.8], ['w', -3.5, 3.4], ['e', 4.5, 3.4]]) { const [x, z] = wallPos(spec, side, a); deco(c, 'cfu_crystal_ledge', x, y, z, wallRot[side]); }
    // a little sign at the jetty
    const lbl = new T.MeshStandardMaterial({ map: textTex('CHOCOLATE RESERVOIR\nswim at your own sweetness', { bg: '#3b2a20', fg: '#fde68a', w: 768, h: 220, size: 70, radius: 18 }), roughness: 0.8, side: T.DoubleSide });
    c.box(0.1, 1.3, 0.1, px0 - 0.25, 0, 1.4, 0x4a3220, { cast: false }); add(c.g, planeG(1.1, 0.32), lbl, px0 - 0.25, 1.45, 1.4, { ry: Math.PI / 2 });
    void px1; cornerWebs(c, spec, h);
  };

  // 6 · Old Ingredient Vault — dusty storage
  D.ingredient_vault = (c, spec) => {
    const hx = spec.w / 2 - 0.3, hz = spec.d / 2 - 0.3, h = spec.h;
    // shelves of glowing ingredient jars (north + west walls)
    prop(c, 'cfu_ingredient_shelf', -4.9, 0, -hz + 0.27, 0); prop(c, 'cfu_ingredient_shelf', -2.3, 0, -hz + 0.27, 0); prop(c, 'cfu_ingredient_shelf', 0.3, 0, -hz + 0.27, 0);
    prop(c, 'cfu_ingredient_shelf', -hx + 0.27, 0, -3.6, Math.PI / 2); prop(c, 'cfu_ingredient_shelf', -hx + 0.27, 0, 3.6, Math.PI / 2);
    // barrels & clay jars
    for (const [x, z, s] of [[2.2, -hz + 0.5, 1], [3.1, -hz + 0.5, 0.95], [4.0, -hz + 0.5, 1], [2.65, -hz + 1.3, 0.9], [hx - 0.5, -hz + 0.5, 1], [hx - 1.4, -hz + 0.5, 0.95]]) prop(c, 'cfu_barrel', x, 0, z, x, s);
    deco(c, 'cfu_barrel', 3.55, 1.0, -hz + 0.5, 0.5, 0.9);
    for (const [x, z, s] of [[-hx + 0.45, -hz + 0.45, 1], [-1.6, hz - 0.4, 1.1], [-0.8, hz - 0.4, 0.9], [0.0, hz - 0.45, 1.2], [-hx + 0.45, 0.2, 1]]) prop(c, 'cfu_clay_jar', x, 0, z, x * 2, s);
    // sacks of cocoa beans (south-west), crates (south-east)
    for (const [x, z, r] of [[-hx + 0.5, hz - 0.5, 0], [-hx + 1.3, hz - 0.45, 1], [-hx + 2.1, hz - 0.5, 2], [-hx + 0.6, hz - 1.3, 3]]) prop(c, 'cfu_sack', x, 0, z, r, 1);
    deco(c, 'cfu_sack', -hx + 0.9, 0.7, hz - 0.6, 1.4, 0.8);
    prop(c, 'cfu_crate', 3.0, 0, hz - 0.55, 0.1); prop(c, 'cfu_crate', 4.0, 0, hz - 0.55, -0.2); deco(c, 'cfu_crate', 3.5, 0.9, hz - 0.55, 0.4, 0.85); prop(c, 'cfu_crate', hx - 0.55, 0, hz - 0.55, 0.3);
    prop(c, 'cfu_barrel', hx - 0.5, 0, hz - 1.6, 0, 0.9);
    // the old balance scale on its table + a spilled sack
    prop(c, 'cfu_scale', -2.2, 0, 0.8, 0.2, 1);
    deco(c, 'cfu_sack', -3.7, 0, 1.6, 0.9, 0.85);
    deco(c, 'cfu_hanging_lantern', -2.2, h - 0.3 - 1.4, 0.8); deco(c, 'cfu_hanging_lantern', 3.4, h - 0.3 - 1.4, -3.5);
    deco(c, 'glow_mushroom_patch', 1.2, 0, -hz + 0.4, 0, 0.5); deco(c, 'cave_crystal_cyan', hx - 0.4, 0, 3.2, 0, 0.35);
    cornerWebs(c, spec, h);
    for (const [x, z, ry] of [[-hx + 0.3, -5.8, Math.PI / 2], [-hx + 0.3, 1.4, Math.PI / 2], [1.5, -hz + 0.3, 0], [-3.6, -hz + 0.3, 0]]) cobweb(c, x, h - 1.25, z, ry, 0.9);
    const lbl = new T.MeshStandardMaterial({ map: textTex('OLD INGREDIENT VAULT', { bg: '#3b2a20', fg: '#f5d77a', border: '#b8860b', w: 768, h: 140, size: 70, radius: 16 }), roughness: 0.8 });
    const [x, z] = wallPos(spec, 's', -0.2, 0.02); add(c.g, planeG(2.4, 0.44), lbl, x, 2.9, z, { ry: Math.PI });
  };

  // 7 · Puzzle Corridor — murals, glyph tiles and braziers on the edges only
  D.puzzle_corridor = (c, spec) => {
    const hx = spec.w / 2 - 0.3, hz = spec.d / 2 - 0.3, h = spec.h, pdx = spec.puzzleDoorsX || [1, -7, 17], vx = spec.vaultDoorX ?? -15;
    const north = (spec.doors || []).find((d) => d.side === 'n'), nx = north ? north.at : 5;
    const free = (x, side) => pdx.every((p) => Math.abs(x - p) > 3.6) && !(side === 's' && Math.abs(x - vx) < 4.4) && !(side === 'n' && Math.abs(x - nx) < 2.4) && x > -hx + 3.6 && x < hx - 0.6;
    // glyph murals on both walls
    for (let x = -hx + 4.6; x < hx - 1; x += 3.4) for (const side of ['n', 's']) { if (!free(x - 1.3, side) || !free(x + 1.3, side)) continue; const [mx, mz] = wallPos(spec, side, x, 0.08); deco(c, 'cfu_glyph_mural', mx, 0, mz, wallRot[side] + Math.PI * 0, 1); }
    // braziers against the walls
    for (let x = -hx + 4.0; x < hx - 0.6; x += 5.2) for (const side of ['n', 's']) { const xx = x + (side === 's' ? 2.6 : 0); if (!free(xx, side) || xx > hx - 0.6) continue; const [bx, bz] = wallPos(spec, side, xx, 0.38); prop(c, 'cfu_brazier', bx, 0, bz, 0, 0.9); }
    // glowing glyph tiles along the centre line (flat)
    const glyphs = ['☀', '☾', '★', '♦', '✿', '♥'], cols = ['#fde68a', '#c4b5fd', '#fde68a', '#67e8f9', '#f9a8d4', '#fca5a5'];
    const tileM = mat(0x5a4f47, { roughness: 0.9 }); let gi = 0;
    for (let x = -hx + 4.5; x < hx - 1; x += 2.2) { if (!free(x, 'n') || !free(x, 's')) continue; add(c.g, boxG(1.1, 0.02, 1.1), tileM, x, 0.01, 0); const k = gi++ % 6; floorDecal(c, glyphTex(glyphs[k], cols[k]), 0.9, 0.9, x, 0, 0, { key: 'gt' + k, ei: 1.0, lift: 0.012 }); }
    // rune bands high on the walls, a carving on the east end wall
    runeBand(c, spec, 'n', -18, 22, 3.6, '#fde68a'); runeBand(c, spec, 's', 8, 22, 3.6, '#c4b5fd'); runeBand(c, spec, 's', -26, 12, 3.6, '#c4b5fd'); runeBand(c, spec, 'n', 24, 12, 3.6, '#fde68a');
    deco(c, 'cfu_wall_carving_stars', hx - 0.08, 0.6, 0, -Math.PI / 2, 1);
    // gentle arrows near the vault door opening
    const lbl = new T.MeshStandardMaterial({ map: textTex('SECRET RECIPE VAULT ↓', { bg: '#1e1b2e', fg: '#fde68a', glow: '#fbbf24', w: 768, h: 120, size: 60, radius: 16 }), emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.8 }); lbl.emissiveMap = lbl.map;
    const [lx, lz] = wallPos(spec, 's', vx, 0.02); add(c.g, planeG(2.2, 0.34), lbl, lx, 3.75, lz, { ry: Math.PI });
    cornerWebs(c, spec, h);
  };

  // 8 · Hall of Founders — statues, banner, round table, columns
  D.hall_of_founders = (c, spec) => {
    const hx = spec.w / 2 - 0.3, hz = spec.d / 2 - 0.3, h = spec.h;
    // the big banner on the back (west) wall, flanked by candelabras
    deco(c, 'cfu_zungga_banner', -hx + 0.05, 0, 0, Math.PI / 2, 1.05);
    prop(c, 'cfu_candelabra', -hx + 0.8, 0, -2.6, 0); prop(c, 'cfu_candelabra', -hx + 0.8, 0, 2.6, 0);
    // six founders: three on the north side facing south, three on the south side facing north
    const names = FOUNDERS.map((f) => 'cfu_founder_' + f[1].toLowerCase());
    [-9, -3, 3].forEach((x, i) => { prop(c, names[i], x, 0, -hz + 1.6, 0); prop(c, names[i + 3], x, 0, hz - 1.6, Math.PI); });
    // wall carvings above / behind the statues, candles at their feet
    [-9, -3, 3].forEach((x, i) => { const ids = ['cfu_wall_carving', 'cfu_wall_carving_machine', 'cfu_wall_carving_stars']; deco(c, ids[i], x, 3.0, -hz + 0.08, 0, 1); deco(c, ids[2 - i], x, 3.0, hz - 0.08, Math.PI, 1); });
    // the round stone table in the middle
    prop(c, 'cfu_round_table', 0, 0, 0, 0);
    // carved columns (kept off the door → centre walk)
    for (const [x, z] of [[-11.5, -7.5], [-11.5, 7.5], [10.5, 4.5], [10.5, 11]]) prop(c, 'cfu_carved_column', x, 0, z, 0, 1.4);
    // floor: a ring of gold inlay around the table, a purple runner from the door
    const inlay = add(c.g, geo('inlay', () => new T.RingGeometry(3.2, 3.4, 64)), glow(P.gold, 0.5), 0, 0.012, 0, { rx: -Math.PI / 2 }); void inlay;
    const runner = mat(0x4c1d95, { roughness: 0.9 }); add(c.g, boxG(10, 0.02, 1.8), runner, -hx + 5.2, 0.01, 0); add(c.g, boxG(9.9, 0.022, 1.5), mat(0x6d28d9, { roughness: 0.9 }), -hx + 5.2, 0.011, 0);
    for (const s of [-1, 1]) add(c.g, boxG(10, 0.024, 0.08), glow(P.gold, 0.4), -hx + 5.2, 0.012, s * 0.8);
    // candles on the floor near the statues (no colliders) + crystals in the far corners
    const cm = mat(P.cream); const fl = [], fg = new T.Group(); c.g.add(fg);
    for (const x of [-9, -3, 3]) for (const sz of [-1, 1]) for (const dx of [-0.85, 0.85]) { const z = sz * (hz - 1.6) - sz * 0.0, zz = z + (sz < 0 ? 0.25 : -0.25); add(c.g, cylG(0.05, 0.05, 0.22, 10), cm, x + dx, 0.11, zz); fl.push(flame(fg, x + dx, 0.22, zz, 0.5)); }
    c.tick((t) => fl.forEach((f) => f(t)), fg);
    prop(c, 'cfu_big_crystal', -hx + 1.0, 0, -hz + 1.0, 0.4, 0.6); prop(c, 'cfu_big_crystal_cyan', -hx + 1.0, 0, hz - 1.0, 1.4, 0.6);
    deco(c, 'cfu_wall_carving', hx - 0.08, 0.8, 6, -Math.PI / 2, 1);
    runeBand(c, spec, 'n', 0, 26, 5.6, '#fde68a'); runeBand(c, spec, 's', 0, 26, 5.6, '#fde68a'); runeBand(c, spec, 'w', 0, 26, 5.6, '#c4b5fd');
    const lbl = new T.MeshStandardMaterial({ map: textTex('HALL OF FOUNDERS', { bg: '#3b0f80', fg: '#f2c230', border: '#d4a017', w: 768, h: 140, size: 76, radius: 16 }), emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.8 }); lbl.emissiveMap = lbl.map;
    add(c.g, planeG(3.2, 0.58), lbl, hx - 0.02, 3.6, -10.2, { ry: -Math.PI / 2 });
    cornerWebs(c, spec, h);
  };

  // 9 · Secret Recipe Vault — scrolls, golden recipe boxes, gold and a big safe
  D.recipe_vault = (c, spec) => {
    const hx = spec.w / 2 - 0.3, hz = spec.d / 2 - 0.3, h = spec.h;
    const nDoor = (spec.doors || []).find((d) => d.side === 'n'), nx = nDoor ? nDoor.at : 0.5;
    // scroll shelves on the west wall, the north wall (east of the door) and the east wall (south of the door)
    for (const z of [-7.2, -4.4, 3.4, 6.2]) prop(c, 'cfu_scroll_shelf', -hx + 0.32, 0, z, Math.PI / 2);
    for (const x of [nx + 4.2, nx + 7.0]) prop(c, 'cfu_scroll_shelf', x, 0, -hz + 0.32, 0);
    for (const x of [nx - 4.6, nx - 7.4]) prop(c, 'cfu_scroll_shelf', x, 0, -hz + 0.32, 0);
    for (const z of [4.6, 7.4]) prop(c, 'cfu_scroll_shelf', hx - 0.32, 0, z, -Math.PI / 2);
    // the big safe on the south wall between banners
    prop(c, 'cfu_big_safe', 0, 0, hz - 0.65, Math.PI);
    for (const x of [-2.7, 2.7]) deco(c, 'cfu_zungga_banner', x, 0.4, hz - 0.05, Math.PI, 0.6);
    // pedestals with golden recipe boxes (off the north → east walk)
    for (const [x, z] of [[-5, -4.5], [-5, 4.5], [5, 5], [-1.5, 6.2]]) prop(c, 'cfu_recipe_pedestal', x, 0, z, 0);
    // gold everywhere in the corners
    for (const [x, z, r] of [[-hx + 1.0, hz - 1.0, 0.3], [hx - 1.0, hz - 1.0, 1.2], [-hx + 1.0, -hz + 1.0, 2], [hx - 1.0, -hz + 1.0, 0.7], [-7.4, 0.2, 0.4], [2.3, hz - 0.8, 1.4], [-2.3, hz - 0.8, 0.1]]) prop(c, 'cfu_gold_stack', x, 0, z, r, 1.1);
    // a golden floor star in the middle + velvet rope posts round the safe
    floorDecal(c, plaqueTex(), 2.4, 2.4, 0.5, 2.2, 0, { key: 'vplaque', ei: 0.35 });
    const au = metal(P.gold, 0.25), vel = mat(0x7f1d1d, { roughness: 0.8 });
    for (const x of [-1.6, 1.6]) { c.cyl(0.05, 0.05, 0.95, x, 0, hz - 2.0, au, { seg: 10 }); add(c.g, sphG(0.08, 10), au, x, 0.98, hz - 2.0); C(c.g, 0.13, 0.16, 0.06, au, x, 0.03, hz - 2.0); }
    add(c.g, cylG(0.03, 0.03, 3.2, 8), vel, 0, 0.82, hz - 2.0, { rz: Math.PI / 2 });
    deco(c, 'cfu_hanging_lantern', -5, h - 0.3 - 1.4, 0); deco(c, 'cfu_hanging_lantern', 5, h - 0.3 - 1.4, 5);
    for (const side of ['n', 's', 'w']) runeBand(c, spec, side, 0, 20, 4.6, '#fde68a');
    const lbl = new T.MeshStandardMaterial({ map: textTex('SECRET RECIPE VAULT', { bg: '#2a1a10', fg: '#f2c230', border: '#d4a017', w: 768, h: 140, size: 76, radius: 16 }), emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.8 }); lbl.emissiveMap = lbl.map;
    const [lx, lz] = wallPos(spec, 's', 0, 0.02); add(c.g, planeG(3.0, 0.55), lbl, lx, 3.6, lz, { ry: Math.PI });
    const lbl2 = new T.MeshStandardMaterial({ map: textTex('↓ THE SECRET CHAMBER', { bg: '#1e1b2e', fg: '#c4b5fd', glow: '#a78bfa', w: 768, h: 120, size: 60, radius: 16 }), emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.8 }); lbl2.emissiveMap = lbl2.map;
    add(c.g, planeG(1.9, 0.3), lbl2, hx - 0.02, 3.4, -0.5, { ry: -Math.PI / 2 });
    cornerWebs(c, spec, h);
  };

  // 10 · The Secret Chamber — the glowing magic book on its ring platform
  D.secret_chamber = (c, spec) => {
    const hx = spec.w / 2 - 0.3, hz = spec.d / 2 - 0.3, h = spec.h;
    const st = mat(0x7a6f66, { roughness: 0.9 }), st2 = mat(0x6a6058, { roughness: 0.9 }), au = metal(P.gold, 0.25);
    // ring platform: three low steps (0.16 m each)
    [[5.0, 0.16, st2], [4.0, 0.32, st], [3.0, 0.48, st2]].forEach(([r, y, m]) => { c.cyl(r, r, y, 0, 0, 0, m, { seg: 48 }); add(c.g, torG(r, 0.03, 6, 64), au, 0, y, 0, { rx: Math.PI / 2 }); });
    const ringT = runeStripTex('#67e8f9').clone(); ringT.needsUpdate = true; ringT.repeat.set(3, 1);
    const ringM = new T.MeshBasicMaterial({ map: ringT, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    const top = add(c.g, geo('platRing', () => { const g = new T.RingGeometry(2.1, 2.7, 64, 1); const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getY(i), p.getX(i)), rr = Math.hypot(p.getX(i), p.getY(i)); uv.setXY(i, (a / (Math.PI * 2) + 0.5), (rr - 2.1) / 0.6); } return g; }), ringM, 0, 0.495, 0, { rx: -Math.PI / 2 });
    const floorT = runeStripTex('#c4b5fd').clone(); floorT.needsUpdate = true; floorT.repeat.set(6, 1);
    const outer = add(c.g, geo('floorRing', () => { const g = new T.RingGeometry(5.6, 6.3, 96, 1); const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getY(i), p.getX(i)), rr = Math.hypot(p.getX(i), p.getY(i)); uv.setXY(i, (a / (Math.PI * 2) + 0.5), (rr - 5.6) / 0.7); } return g; }), new T.MeshBasicMaterial({ map: floorT, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }), 0, 0.015, 0, { rx: -Math.PI / 2 });
    c.tick((t) => { top.rotation.z = t * 0.15; outer.rotation.z = -t * 0.06; }, top); outer.userData.dynamic = true;
    // the altar with the glowing book on top
    prop(c, 'cfu_magic_book_altar', 0, 0.48, 0, Math.PI / 2, 1);
    // four small crystal obelisks on the top step
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; prop(c, i % 2 ? 'cave_crystal_cyan' : 'cave_crystal', Math.cos(a) * 2.45, 0.48, Math.sin(a) * 2.45, a, 0.55, { shrink: 0.5 }); }
    // big crystals around the walls (kept clear of the west door lane)
    for (const [x, z, id, s] of [[-hx + 1.4, -hz + 1.4, 'cfu_big_crystal', 0.9], [-hx + 1.4, hz - 1.4, 'cfu_big_crystal_cyan', 0.9], [hx - 1.4, -hz + 1.4, 'cfu_big_crystal_cyan', 1.0], [hx - 1.4, hz - 1.4, 'cfu_big_crystal', 1.0],
      [0, -hz + 1.1, 'cfu_big_crystal', 0.85], [0, hz - 1.1, 'cfu_big_crystal_cyan', 0.85], [hx - 1.1, 0, 'cfu_big_crystal', 1.15], [-7, -hz + 1.0, 'cfu_big_crystal_cyan', 0.6], [7, hz - 1.0, 'cfu_big_crystal', 0.6], [7, -hz + 1.0, 'cfu_big_crystal_cyan', 0.6], [-7, hz - 1.0, 'cfu_big_crystal', 0.6]]) prop(c, id, x, 0, z, x + z, s);
    // carved columns + ancient carvings
    for (const [x, z] of [[-9, -7], [-9, 7], [9, -7], [9, 7]]) prop(c, 'cfu_carved_column', x, 0, z, 0, 1.6);
    for (const [side, a, id] of [['n', -10.5, 'cfu_wall_carving'], ['n', 3.6, 'cfu_wall_carving_stars'], ['s', -3.6, 'cfu_wall_carving_machine'], ['s', 10.5, 'cfu_wall_carving'], ['e', -6, 'cfu_wall_carving_stars'], ['e', 6, 'cfu_wall_carving_machine']]) { const [x, z] = wallPos(spec, side, a, 0.08); deco(c, id, x, 1.2, z, wallRot[side], 1.15); }
    for (const side of ['n', 's', 'e']) runeBand(c, spec, side, 0, side === 'e' ? 22 : 28, 6.2, '#67e8f9');
    veins(c, spec, 'n', 0, 28, 0.2, 8.4, 0.6); veins(c, spec, 's', 0, 28, 0.2, 8.4, 0.6); veins(c, spec, 'e', 0, 23, 0.2, 8.4, 0.6);
    // shared crystal glow pulses gently
    const pulseA = glow(P.violet, 1.25), pulseB = glow(P.cyan, 1.25); const pg = new T.Group(); c.g.add(pg);
    c.tick((t) => { pulseA.emissiveIntensity = 1.15 + Math.sin(t * 1.1) * 0.25; pulseB.emissiveIntensity = 1.15 + Math.sin(t * 1.1 + 1.5) * 0.25; }, pg);
    // floating motes in the whole chamber
    const N = 120, pos = new Float32Array(N * 3), sd = []; const r = rng(99); for (let i = 0; i < N; i++) sd.push([(r() - 0.5) * (spec.w - 3), r() * (h - 1), (r() - 0.5) * (spec.d - 3), r() * 6]);
    const mg = new T.BufferGeometry(); mg.setAttribute('position', new T.BufferAttribute(pos, 3));
    const motes = new T.Points(mg, new T.PointsMaterial({ map: sparkTex(), color: 0x9bd8ff, size: 0.12, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); motes.frustumCulled = false; c.g.add(motes);
    c.tick((t) => { for (let i = 0; i < N; i++) { const [x, y, z, ph] = sd[i]; pos[i * 3] = x + Math.sin(t * 0.3 + ph) * 0.4; pos[i * 3 + 1] = 0.3 + ((y + t * 0.15) % (h - 1)); pos[i * 3 + 2] = z + Math.cos(t * 0.25 + ph) * 0.4; } mg.attributes.position.needsUpdate = true; }, motes);
    const lbl = new T.MeshStandardMaterial({ map: textTex('THE SECRET CHAMBER', { bg: '#1e1b2e', fg: '#c4b5fd', glow: '#a78bfa', border: '#7c3aed', w: 768, h: 140, size: 76, radius: 16 }), emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.8 }); lbl.emissiveMap = lbl.map;
    add(c.g, planeG(3.2, 0.58), lbl, 0, 7.6, -hz + 0.02);
  };
})();
