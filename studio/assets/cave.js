/* Zungga Story Studio — cave props, ported from the Play-mode island (drive-portfolio/js/game.js): the rocky cave
 * entrance with night-glowing runes (CAVE), and THE CORE secret cavern — glowing crystals, bioluminescent mushrooms,
 * stalagmites / stalactites, the tunnel, the glowing-vein floor, the glow lake, the AI-brain hologram on its dais,
 * the four milestone exhibits and the Core Crystal. The entrance is full size (metres, as in the game); cavern
 * pieces built at game scale are halved so they sit well next to 1.4–1.7 m characters. */
(() => {
  'use strict';
  const { T, tex } = ZA;
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  const gmat = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
  const flat = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true, ...o });
  function add(geo, m, x = 0, y = 0, z = 0, parent, shadow = true) { const me = new T.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = shadow; me.receiveShadow = true; parent.add(me); return me; }
  function jitter(geo, amt, r) { // welded (no cracks)
    const p = geo.attributes.position, seed = r() * 100, h = (a) => { const v = Math.sin(a * 12.9898 + seed * 78.233) * 43758.5453; return (v - Math.floor(v)) * 2 - 1; };
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k), key = Math.round(x * 997) + Math.round(y * 991) * 3.1 + Math.round(z * 983) * 7.3; p.setXYZ(k, x + h(key) * amt, y + h(key + 1.7) * amt, z + h(key + 3.3) * amt); }
    geo.computeVertexNormals(); return geo;
  }
  const lumpy = (geo, amt) => { // the game's deterministic bumps
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k), n = Math.sin(x * 0.61 + z * 0.23) * Math.cos(y * 0.73 - x * 0.31) + 0.5 * Math.sin(z * 1.37 + y * 0.9), f = 1 + n * amt; p.setXYZ(k, x * f, y * (y > 0.3 ? f : 1), z * f); }
    geo.computeVertexNormals(); return geo;
  };
  const glowTex = (inner, outer) => tex((g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, 256, 256);
  function sprite(map, sx, sy, parent, x = 0, y = 0, z = 0, additive = true, opacity = 1) {
    const s = new T.Sprite(new T.SpriteMaterial({ map, transparent: true, opacity, depthWrite: false, blending: additive ? T.AdditiveBlending : T.NormalBlending })); s.scale.set(sx, sy, 1); s.position.set(x, y, z); parent.add(s); return s;
  }
  const veinTex = (seed = 3) => {
    const r = rng(seed), t = tex((g, w, h) => {
      g.fillStyle = '#1b1726'; g.fillRect(0, 0, w, h);
      for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(${40 + r() * 30 | 0},${35 + r() * 20 | 0},${60 + r() * 30 | 0},0.5)`; g.fillRect(r() * w, r() * h, 2 + r() * 12, 2 + r() * 12); }
      g.lineWidth = 2.5; g.shadowBlur = 8;
      for (let k = 0; k < 26; k++) { const c = k % 3 ? '#a855f7' : '#22d3ee'; g.strokeStyle = c; g.shadowColor = c; g.globalAlpha = 0.35 + r() * 0.45; let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 8; s++) { x += (r() - 0.5) * 120; y += (r() - 0.5) * 120; g.lineTo(x, y); } g.stroke(); }
      g.globalAlpha = 1;
    }, 512, 512);
    t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  };
  const floorMat = (rx, ry) => { const t = veinTex(); t.repeat.set(rx, ry); return new T.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.95 }); };
  const stoneMat = () => flat(0x4a4260);
  const CCOLS = [0xa855f7, 0x22d3ee, 0xec4899, 0x818cf8], SCOLS = [0x22d3ee, 0xe879f9, 0x67e8f9, 0xa3e635];

  /* ---------- cave entrance (full size) — setOn(true) = night: runes + the purple glow inside light up ---------- */
  function caveEntrance() {
    const group = new T.Group(), r = rng(195), P = (al, b) => ({ x: -b, z: al });   // al: out of the mouth (+z), b: sideways
    const rockMat = flat(0x7d8088), mossMat = flat(0x55704a);
    const rock = (al, b, y, rad, sy = 1, m = rockMat) => { const p = P(al, b), me = add(jitter(new T.DodecahedronGeometry(rad, 1), rad * 0.12, r), m, p.x, y, p.z, group); me.scale.set(0.9 + r() * 0.25, sy, 0.9 + r() * 0.25); me.rotation.set(r() * 3, r() * 3, r() * 3); return me; };
    for (const s of [-1, 1]) {
      for (const al of [1.2, 3.8, 6.4]) rock(al, s * 5.7, 1.4, 2.4, 0.95);
      for (const al of [2, 5.5]) rock(al, s * 4.8, 4.1, 2.1, 0.9, mossMat);
      rock(-1, s * 8.5, 1.8, 3.4, 0.8); rock(3, s * 9.5, 1.2, 2.6, 0.7, mossMat);
    }
    for (const al of [1.5, 4.6]) for (const b of [-2.3, 2.3]) rock(al, b, 5.5, 2.5, 0.75);
    rock(7.2, 0, 5.3, 2.4, 0.7, mossMat);
    for (const b of [-4.5, 0, 4.5]) rock(-3, b, 2.4, 3.8, 0.9);
    rock(-7, 0, 3, 4.6, 0.9, mossMat); rock(-2, 0, 6.6, 4.2, 0.7);
    const mouth = P(3.8, 0);
    add(new T.BoxGeometry(6.4, 4.4, 7), new T.MeshBasicMaterial({ color: 0x030206, side: T.BackSide }), mouth.x, 2.2, mouth.z, group, false);
    const deep = sprite(glowTex('rgba(190,120,255,0.9)', 'rgba(120,60,220,0.25)'), 4, 3, group, 0, 1.6, 1.2, true, 0.12);
    const glyphs = ['ᚠ', 'ᚱ', 'ᛟ', 'ᚨ', 'ᛉ', 'ᛞ'], runes = [];
    [[8.4, -3.9, 1.3], [8.4, 3.9, 1.6], [8.7, -3.2, 3.3], [8.7, 3.4, 3.0], [9.4, 0, 5.2], [8.0, -5.6, 2.4]].forEach(([al, b, y], k) => {
      const m = new T.MeshBasicMaterial({ map: tex((c, w, h) => { c.fillStyle = '#fff'; c.font = '700 96px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#c084fc'; c.shadowBlur = 18; c.fillText(glyphs[k], w / 2, h / 2); }, 128, 128), color: 0xc084fc, transparent: true, opacity: 0.08, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
      const p = P(al, b); add(new T.PlaneGeometry(1.1, 1.1), m, p.x, y, p.z, group, false); runes.push(m);
    });
    for (const [al, b] of [[10.5, -5], [11.5, 5.5], [13, -7.5], [9.5, 7.2], [14, 3]]) {
      const p = P(al, b), s = 1.2 + r() * 0.6, me = add(jitter(new T.IcosahedronGeometry(1, 1), 0.15, r), flat(0x2f7d32), p.x, s * 0.5, p.z, group); me.scale.set(s * 1.2, s * 0.8, s * 1.2);
    }
    let on = false;
    group.userData.setOn = (v) => { on = !!v; deep.material.opacity = on ? 0.55 : 0.12; };
    group.userData.tick = (t) => runes.forEach((m, k) => { m.opacity = on ? 0.6 + 0.35 * Math.sin(t * 2 + k) : 0.08; });
    return { group };
  }

  /* ---------- crystals (unlit, so they glow) ---------- */
  function crystalMesh(color, s, parent, x = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const geo = new T.OctahedronGeometry(0.5, 0).scale(1, 2.6, 1).translate(0, 0.9, 0);
    const me = add(geo, new T.MeshBasicMaterial({ color }), x, 0, z, parent, false); me.scale.setScalar(s); me.rotation.set(rx, ry, rz); return me;
  }
  function crystal(color) {
    return () => {
      const group = new T.Group(), r = rng(color & 0xffff);
      add(jitter(new T.DodecahedronGeometry(0.32, 0), 0.04, r), stoneMat(), 0, 0.1, 0, group).scale.set(1.2, 0.5, 1);
      crystalMesh(color, 0.55, group, 0, 0, 0.12, 0.4, -0.08);
      const c = new T.Color(color), halo = sprite(glowTex(`rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},0.6)`, `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},0.15)`), 2, 2, group, 0, 0.75, 0);
      group.userData.tick = (t) => { const k = 1 + 0.12 * Math.sin(t * 2.2 + (color & 7)); halo.scale.set(2 * k, 2 * k, 1); };
      return { group };
    };
  }
  function crystalCluster() {
    const group = new T.Group(), r = rng(48);
    add(jitter(new T.DodecahedronGeometry(0.8, 1), 0.08, r), stoneMat(), 0, 0.15, 0, group).scale.set(1.3, 0.35, 1.1);
    for (let k = 0; k < 7; k++) { const a = k * 0.9 + r(), d = k ? 0.3 + r() * 0.5 : 0; crystalMesh(CCOLS[k % 4], (k ? 0.3 + r() * 0.3 : 0.7), group, Math.cos(a) * d, Math.sin(a) * d, (r() - 0.5) * (k ? 1 : 0.2), r() * 6, (r() - 0.5) * (k ? 1 : 0.2)); }
    const halo = sprite(glowTex('rgba(200,140,255,0.5)', 'rgba(120,200,255,0.15)'), 3.5, 3.5, group, 0, 1, 0);
    group.userData.tick = (t) => { const k = 1 + 0.1 * Math.sin(t * 1.8); halo.scale.set(3.5 * k, 3.5 * k, 1); };
    return { group };
  }

  /* ---------- glowing mushrooms ---------- */
  function shroom(parent, x, z, s, color, ry = 0, tilt = 0) {
    const g = new T.Group(); g.position.set(x, 0, z); g.rotation.set(tilt, ry, tilt * 0.5); g.scale.setScalar(s); parent.add(g);
    add(new T.CylinderGeometry(0.08, 0.13, 0.7, 10).translate(0, 0.35, 0), gmat(0xe7e0f5), 0, 0, 0, g);
    add(new T.SphereGeometry(0.42, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 0.66, 0), new T.MeshBasicMaterial({ color }), 0, 0, 0, g, false);
    add(new T.CircleGeometry(0.42, 20).rotateX(Math.PI / 2).translate(0, 0.66, 0), new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(0.6) }), 0, 0, 0, g, false);
    return g;
  }
  function glowMushroom() { const group = new T.Group(); shroom(group, 0, 0, 1, SCOLS[0]); return { group }; }
  function glowMushroomPatch() {
    const group = new T.Group(), r = rng(71);
    for (let k = 0; k < 8; k++) { const a = k * 2.3, d = k ? 0.35 + r() * 0.7 : 0; shroom(group, Math.cos(a) * d, Math.sin(a) * d, k ? 0.45 + r() * 0.5 : 1.1, SCOLS[k % 4], r() * 6, (r() - 0.5) * 0.4); }
    return { group };
  }

  /* ---------- stalagmites / stalactites ---------- */
  function stalagmites() {
    const group = new T.Group(), r = rng(40), sm = stoneMat();
    add(jitter(new T.DodecahedronGeometry(1.4, 1), 0.1, r), sm, 0, 0, 0, group).scale.set(1.1, 0.25, 0.8);
    [[0, 0, 0.55, 2.6], [0.8, 0.3, 0.4, 1.6], [-0.7, -0.2, 0.45, 1.9], [0.3, -0.6, 0.3, 1.0], [-0.4, 0.6, 0.28, 0.9]].forEach(([x, z, s, h]) => { const me = add(new T.ConeGeometry(1, 1, 7).translate(0, 0.5, 0), sm, x, 0, z, group); me.scale.set(s, h, s); me.rotation.y = r() * 6; });
    return { group };
  }
  function stalactites() {
    const group = new T.Group(), r = rng(41), sm = stoneMat(), top = 3;
    add(lumpy(new T.BoxGeometry(3.4, 0.6, 2.2, 6, 2, 4), 0.08), sm, 0, top + 0.3, 0, group);
    [[0, 0, 0.35, 2.4], [0.9, 0.4, 0.3, 1.5], [-0.8, -0.3, 0.32, 1.8], [0.4, -0.6, 0.2, 1.0], [-1.2, 0.5, 0.22, 1.2], [1.3, -0.4, 0.2, 0.8]].forEach(([x, z, s, h]) => { const me = add(new T.ConeGeometry(1, 1, 7).rotateX(Math.PI).translate(0, -0.5, 0), sm, x, top, z, group); me.scale.set(s, h, s); me.rotation.y = r() * 6; });
    // keep the lowest tip on the floor line (bottom at y = 0)
    group.children.forEach((c) => { c.position.y -= top - 2.4; });
    return { group };
  }

  /* ---------- tunnel section + vein floor + way-out ---------- */
  function caveTunnel() {
    const group = new T.Group(), R = 5.5, L = 12;
    const rock = new T.MeshStandardMaterial({ color: 0x3b3550, roughness: 1, flatShading: true, side: T.DoubleSide });
    add(lumpy(new T.CylinderGeometry(R, R, L, 22, 4, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2), 0.06), rock, 0, 0, 0, group, false);
    const fl = add(new T.PlaneGeometry(R * 2, L), floorMat(1.2, L / 9), 0, 0.01, 0, group, false); fl.rotation.x = -Math.PI / 2;
    return { group };
  }
  function veinFloor() { const group = new T.Group(); const f = add(new T.CircleGeometry(5, 48), floorMat(1, 1), 0, 0.01, 0, group, false); f.rotation.x = -Math.PI / 2; return { group }; }
  function wayOut() {
    const group = new T.Group();
    const glow = add(new T.CircleGeometry(5.5, 32, 0, Math.PI), new T.MeshBasicMaterial({ map: glowTex('rgba(255,250,235,1)', 'rgba(255,236,200,0.75)'), transparent: true }), 0, 0, 0, group, false); glow.scale.set(1, 1.05, 1);
    const sign = tex((c, w, h) => { c.fillStyle = 'rgba(20,16,36,0.85)'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '800 54px system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('↑  WAY OUT  ↑', w / 2, h * 0.66); }, 512, 96);
    const es = add(new T.PlaneGeometry(5, 0.95), new T.MeshBasicMaterial({ map: sign, transparent: true }), 0, 0.03, 5.7, group, false); es.rotation.x = -Math.PI / 2;
    return { group };
  }

  /* ---------- bioluminescent lake (half game size) ---------- */
  function glowLake() {
    const group = new T.Group(), R = 4.5, r = rng(9);
    const wt = tex((c, w, h) => { c.fillStyle = '#0b1d3a'; c.fillRect(0, 0, w, h); for (let k = 0; k < 160; k++) { c.strokeStyle = `rgba(34,211,238,${0.15 + r() * 0.4})`; c.lineWidth = 1 + r() * 3; c.beginPath(); c.ellipse(r() * w, r() * h, 10 + r() * 40, 3 + r() * 8, 0, 0, 6.3); c.stroke(); } }, 512, 512);
    wt.wrapS = wt.wrapT = T.RepeatWrapping; wt.repeat.set(2, 2);
    const water = add(new T.CircleGeometry(R, 48), new T.MeshStandardMaterial({ map: wt, emissiveMap: wt, emissive: 0x22d3ee, emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.2 }), 0, 0.12, 0, group, false); water.rotation.x = -Math.PI / 2;
    add(new T.TorusGeometry(R + 0.15, 0.3, 6, 48), stoneMat(), 0, 0.1, 0, group).rotation.x = Math.PI / 2;
    group.userData.tick = (t) => { wt.offset.set(Math.sin(t * 0.2) * 0.1, t * 0.03); };
    return { group };
  }

  /* ---------- THE CORE: brain hologram, dais, Core Crystal ---------- */
  function brainInto(parent) {
    const brain = new T.Group(); parent.add(brain); const r = rng(900), pts = [], N = 900;
    for (let k = 0; k < N; k++) {
      const side = k % 2 ? 1 : -1, th = Math.acos(r() * 2 - 1), ph = r() * Math.PI * 2;
      const x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph), fold = 1 + 0.08 * Math.sin(th * 9 + ph * 5) + 0.05 * Math.sin(ph * 11);
      pts.push(new T.Vector3((x * 2.2 * fold + side * 2.25) * (x * side < -0.6 ? 0.9 : 1), y * 2.6 * fold, z * 3.4 * fold));
    }
    const geo = new T.BufferGeometry().setFromPoints(pts), cols = new Float32Array(N * 3), tc = new T.Color(), white = new T.Color(0xffffff);
    pts.forEach((p, k) => tc.set(p.z > 0 ? 0x67e8f9 : 0xe879f9).lerp(white, r() * 0.3).toArray(cols, k * 3));
    geo.setAttribute('color', new T.BufferAttribute(cols, 3));
    brain.add(new T.Points(geo, new T.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false })));
    const seg = []; for (let k = 0; k < N; k += 3) { const a = pts[k]; for (let j = k + 1; j < Math.min(N, k + 60); j++) if (a.distanceTo(pts[j]) < 0.9) { seg.push(a, pts[j]); break; } }
    brain.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(seg), new T.LineBasicMaterial({ color: 0x8b9cf8, transparent: true, opacity: 0.55, depthWrite: false })));
    const label = sprite(tex((c, w, h) => { c.textAlign = 'center'; c.fillStyle = '#e0f2fe'; c.shadowColor = '#22d3ee'; c.shadowBlur = 20; c.font = '900 92px system-ui, sans-serif'; c.fillText('THE CORE', w / 2, 110); c.font = '600 34px system-ui, sans-serif'; c.fillStyle = '#c4b5fd'; c.fillText('where it all started', w / 2, 170); }, 512, 200), 10, 3.9, brain, 0, 5.2, 0, false);
    label.material.color.set(0xffffff);
    return brain;
  }
  function coreBrain() {
    const group = new T.Group(), s = new T.Group(); s.scale.setScalar(0.5); group.add(s);
    const brain = brainInto(s); brain.position.y = 2.75;
    group.userData.tick = (t) => { brain.rotation.y = t * 0.3; brain.position.y = 2.75 + Math.sin(t * 1.2) * 0.15; };
    return { group };
  }
  function coreHologram() {
    const group = new T.Group(), s = new T.Group(); s.scale.setScalar(0.5); group.add(s);
    const dais = add(new T.CircleGeometry(8, 64), new T.MeshBasicMaterial({ map: tex((c, w, h) => {
      c.fillStyle = '#0d0b18'; c.fillRect(0, 0, w, h); c.translate(w / 2, h / 2); c.strokeStyle = '#67e8f9'; c.shadowColor = '#22d3ee'; c.shadowBlur = 12;
      for (const r of [0.47, 0.36, 0.2]) { c.lineWidth = r === 0.47 ? 8 : 3; c.beginPath(); c.arc(0, 0, w * r, 0, Math.PI * 2); c.stroke(); }
      c.lineWidth = 3;
      for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * w * 0.2, Math.sin(a) * w * 0.2); c.lineTo(Math.cos(a) * w * 0.36, Math.sin(a) * w * 0.36); c.stroke(); c.beginPath(); c.arc(Math.cos(a) * w * 0.36, Math.sin(a) * w * 0.36, 6, 0, Math.PI * 2); c.fillStyle = '#e879f9'; c.fill(); }
    }, 512, 512), transparent: true }), 0, 0.04, 0, s, false);
    dais.rotation.x = -Math.PI / 2;
    add(new T.CylinderGeometry(1.4, 3.2, 9, 32, 1, true), new T.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.18, depthWrite: false, side: T.DoubleSide }), 0, 4.5, 0, s, false);
    const brain = brainInto(s); brain.position.y = 12;
    group.userData.tick = (t) => { brain.rotation.y = t * 0.3; brain.position.y = 12 + Math.sin(t * 1.2) * 0.3; };
    return { group };
  }
  function coreCrystal() {
    const group = new T.Group(), cg = new T.Group(); cg.scale.setScalar(0.6); cg.position.y = 1.8 * 0.6 + 0.2; group.add(cg);
    const inner = add(new T.OctahedronGeometry(0.9, 0), new T.MeshBasicMaterial({ color: 0xf5d0fe }), 0, 0, 0, cg, false); inner.scale.set(1, 1.7, 1);
    const wire = add(new T.OctahedronGeometry(1.25, 0), new T.MeshBasicMaterial({ color: 0xc084fc, wireframe: true, transparent: true, opacity: 0.8 }), 0, 0, 0, cg, false); wire.scale.set(1, 1.7, 1);
    sprite(glowTex('rgba(240,200,255,0.9)', 'rgba(168,85,247,0.3)'), 6, 6, cg);
    const base = cg.position.y;
    group.userData.tick = (t) => { inner.rotation.y = t * 0.9; wire.rotation.y = -t * 0.5; cg.position.y = base + Math.sin(t * 2) * 0.08; };
    return { group };
  }

  /* ---------- the milestone exhibits (pedestal, colour ring, glass top, light beam, caption) ---------- */
  const gold = () => new T.MeshStandardMaterial({ color: 0xf5c542, metalness: 0.45, roughness: 0.3, emissive: 0x6a4800, emissiveIntensity: 0.5 });
  const shell = () => gmat(0xf1f3f5, { roughness: 0.4 }), dark = () => gmat(0x1e1b2e, { roughness: 0.5 });
  const MODELS = {
    trophy(g) {
      const G = gold();
      add(new T.BoxGeometry(1.6, 0.4, 1.6), dark(), 0, 0.2, 0, g);
      add(new T.CylinderGeometry(0.18, 0.3, 0.9, 16), G, 0, 0.85, 0, g);
      add(new T.LatheGeometry([[0.15, 0], [0.7, 0.2], [0.95, 0.8], [1.0, 1.5], [0.9, 1.52]].map(([x, y]) => new T.Vector2(x, y)), 32), G, 0, 1.3, 0, g);
      for (const s of [-1, 1]) { const h = add(new T.TorusGeometry(0.4, 0.07, 8, 20, Math.PI), G, s * 0.98, 2.15, 0, g); h.rotation.z = s * -Math.PI / 2; }
      const top = add(new T.OctahedronGeometry(0.3), G, 0, 3.2, 0, g);
      return (t) => { top.rotation.y = t * 1.2; };
    },
    bp(g) {
      add(new T.BoxGeometry(2.0, 1.3, 0.5), shell(), 0, 1.3, 0, g);
      const scr = tex((c, w, h) => { c.fillStyle = '#05131a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#34d399'; c.lineWidth = 6; c.shadowColor = '#34d399'; c.shadowBlur = 10; c.beginPath(); for (let x = 0; x <= w; x += 4) { const t = (x % 128) / 128; const y = h * 0.55 - (t > 0.3 && t < 0.36 ? (t - 0.3) * 1800 : t > 0.36 && t < 0.42 ? (0.42 - t) * 1800 - 20 : Math.sin(t * 6.28) * 6); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }, 256, 128);
      scr.wrapS = T.RepeatWrapping;
      add(new T.PlaneGeometry(1.7, 0.95), new T.MeshBasicMaterial({ map: scr }), 0, 1.35, 0.26, g, false);
      const cuff = add(new T.TorusGeometry(0.55, 0.22, 10, 28), gmat(0x4c6ef5, { roughness: 0.6 }), 1.6, 0.6, 0.4, g); cuff.rotation.y = 0.6; cuff.scale.set(1, 1, 1.6);
      add(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0.9, 1.0, 0), new T.Vector3(1.3, 0.4, 0.3), new T.Vector3(1.5, 0.75, 0.4)]), 16, 0.04, 6), dark(), 0, 0, 0, g, false);
      const led = new T.MeshStandardMaterial({ color: 0xff4d6d, emissive: 0xff2d55, emissiveIntensity: 1.5 });
      add(new T.SphereGeometry(0.12, 12, 8), led, -0.75, 1.75, 0.26, g, false);
      return (t) => { scr.offset.x = t * 0.5; led.emissiveIntensity = 0.6 + 1.4 * Math.max(0, Math.sin(t * 6)); };
    },
    maze(g) {
      add(new T.BoxGeometry(4.2, 0.2, 4.2), dark(), 0, 0.1, 0, g);
      const wallM = gmat(0x818cf8, { emissive: 0x4338ca, emissiveIntensity: 0.4 });
      for (const [x, z, w, d] of [[-2, -2, 4.2, 0], [-2, 2, 4.2, 0], [-2, -2, 0, 4.2], [2, -2, 0, 4.2], [-1, -2, 0, 2.6], [0, -0.6, 0, 2.6], [1, -2, 0, 2.6], [-2, 1, 1.4, 0], [0.4, 1, 1.6, 0]]) add(new T.BoxGeometry(Math.max(w, 0.15), 0.5, Math.max(d, 0.15)), wallM, x + w / 2, 0.45, z + d / 2, g, false);
      const bot = new T.Group(); g.add(bot);
      add(new T.BoxGeometry(0.5, 0.25, 0.6), gmat(0xf59f00), 0, 0.42, 0, bot, false);
      add(new T.SphereGeometry(0.09, 8, 6), gmat(0x22d3ee, { emissive: 0x22d3ee, emissiveIntensity: 2 }), 0, 0.6, 0.2, bot, false);
      const path = [[-1.5, -1.5], [-1.5, 0.6], [-0.5, 0.6], [-0.5, -1.5], [0.5, -1.5], [0.5, 0.5], [1.5, 0.5], [1.5, 1.5], [-1.5, 1.5]];
      const lens = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1])), total = lens.reduce((a, b) => a + b, 0);
      return (t) => {
        let d = (t * 0.9) % total, i = 0; while (d > lens[i]) { d -= lens[i]; i++; }
        const [x0, z0] = path[i], [x1, z1] = path[i + 1], k = d / lens[i];
        bot.position.set(x0 + (x1 - x0) * k, 0, z0 + (z1 - z0) * k); bot.rotation.y = Math.atan2(x1 - x0, z1 - z0);
      };
    },
    robo(g) {
      const r = rng(77);
      add(new T.BoxGeometry(3.4, 0.12, 2.4), gmat(0x0f7b4a, { roughness: 0.6 }), 0, 0.3, 0, g);
      for (let k = 0; k < 7; k++) add(new T.BoxGeometry(0.3 + r() * 0.4, 0.14, 0.3 + r() * 0.3), dark(), -1.4 + r() * 1.7, 0.42, -0.9 + r() * 1.8, g, false);
      for (let k = 0; k < 6; k++) add(new T.BoxGeometry(0.9, 0.02, 0.03), gmat(0xfcc419, { metalness: 0.8, roughness: 0.3 }), -1.2 + r() * 1.4, 0.37, -1 + r() * 2, g, false);
      const base = new T.Group(); base.position.set(1.05, 0.36, 0); g.add(base);
      add(new T.CylinderGeometry(0.42, 0.5, 0.3, 16), gmat(0xff922b), 0, 0.15, 0, base);
      const sh = new T.Group(); sh.position.y = 0.3; base.add(sh);
      add(new T.BoxGeometry(0.22, 1.3, 0.22), gmat(0xf1f3f5), 0, 0.65, 0, sh);
      const el = new T.Group(); el.position.y = 1.3; sh.add(el);
      add(new T.SphereGeometry(0.17, 12, 8), gmat(0xff922b), 0, 0, 0, el);
      add(new T.BoxGeometry(0.18, 1.0, 0.18), gmat(0xf1f3f5), 0, 0.5, 0, el);
      for (const s of [-1, 1]) add(new T.BoxGeometry(0.05, 0.28, 0.08), dark(), s * 0.08, 1.1, 0, el);
      return (t) => { base.rotation.y = Math.sin(t * 0.6) * 0.9; sh.rotation.z = Math.sin(t * 0.9) * 0.35; el.rotation.z = -0.5 + Math.sin(t * 1.1) * 0.4; };
    },
  };
  function exhibit(kind, color, caption) {
    return () => {
      const group = new T.Group(), s = new T.Group(); s.scale.setScalar(0.5); group.add(s); const col = new T.Color(color);
      add(new T.CylinderGeometry(2.7, 3.1, 1, 10), gmat(0x2b2540, { roughness: 0.6 }), 0, 0.5, 0, s);
      add(new T.TorusGeometry(3.2, 0.09, 6, 48), new T.MeshBasicMaterial({ color: col }), 0, 0.06, 0, s, false).rotation.x = Math.PI / 2;
      add(new T.CylinderGeometry(2.6, 2.6, 0.06, 40), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35 }), 0, 1.02, 0, s, false);
      const beam = add(new T.CylinderGeometry(0.6, 3.0, 14, 24, 1, true), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.08, depthWrite: false, side: T.DoubleSide }), 0, 8, 0, s, false); beam.userData.sky = true;
      const g = new T.Group(); g.position.set(0, 1.05, 0); g.scale.setScalar(1.1); s.add(g);
      const anim = MODELS[kind](g);
      sprite(tex((c, w, h) => {
        c.fillStyle = 'rgba(10,8,24,0.75)'; c.fillRect(0, 0, w, h); c.strokeStyle = color; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
        c.fillStyle = '#fff'; c.textAlign = 'center'; let fs = 46; c.font = `800 ${fs}px system-ui, sans-serif`;
        while (c.measureText(caption).width > w - 40 && fs > 22) { fs -= 2; c.font = `800 ${fs}px system-ui, sans-serif`; }
        c.fillText(caption, w / 2, h * 0.62);
      }, 768, 110), 8.4, 1.2, s, 0, 6.4, 0, false);
      group.userData.tick = anim;
      return { group };
    };
  }

  const R = (id, label, fn, tags) => ZAssets.register('cave', id, label, fn, tags);
  R('cave_entrance', 'Cave entrance (glowing runes)', caveEntrance, ['cave', 'entrance', 'rocks', 'runes', 'secret', 'adventure']);
  R('cave_crystal', 'Glowing crystal (purple)', crystal(CCOLS[0]), ['crystal', 'gem', 'cave', 'glow', 'purple']);
  R('cave_crystal_cyan', 'Glowing crystal (cyan)', crystal(CCOLS[1]), ['crystal', 'gem', 'cave', 'glow', 'blue']);
  R('cave_crystal_pink', 'Glowing crystal (pink)', crystal(CCOLS[2]), ['crystal', 'gem', 'cave', 'glow', 'pink']);
  R('cave_crystal_indigo', 'Glowing crystal (indigo)', crystal(CCOLS[3]), ['crystal', 'gem', 'cave', 'glow']);
  R('crystal_cluster', 'Crystal cluster', crystalCluster, ['crystals', 'gems', 'cave', 'glow', 'treasure']);
  R('glow_mushroom', 'Glowing mushroom', glowMushroom, ['mushroom', 'cave', 'glow', 'magic']);
  R('glow_mushroom_patch', 'Glowing mushroom patch', glowMushroomPatch, ['mushrooms', 'cave', 'glow', 'magic']);
  R('stalagmites', 'Stalagmites', stalagmites, ['stalagmite', 'cave', 'rock']);
  R('stalactites', 'Stalactites (hanging rock)', stalactites, ['stalactite', 'cave', 'rock', 'ceiling']);
  R('cave_tunnel', 'Cave tunnel section', caveTunnel, ['cave', 'tunnel', 'underground']);
  R('cave_vein_floor', 'Glowing-vein cave floor', veinFloor, ['cave', 'floor', 'glow', 'underground']);
  R('cave_way_out', 'Cave exit glow + WAY OUT sign', wayOut, ['cave', 'exit', 'way out', 'sign']);
  R('glow_lake', 'Glowing cave lake', glowLake, ['lake', 'cave', 'glow', 'water', 'underground']);
  R('core_hologram', 'THE CORE — brain hologram on its dais', coreHologram, ['core', 'brain', 'hologram', 'ai', 'cave']);
  R('core_brain', 'Brain hologram (THE CORE)', coreBrain, ['brain', 'hologram', 'ai', 'mind']);
  R('core_crystal', 'The Core Crystal', coreCrystal, ['crystal', 'core', 'secret', 'treasure', 'magic']);
  R('core_exhibit_trophy', 'Exhibit — Smart India Hackathon trophy', exhibit('trophy', '#f59f00', '1st PRIZE · SMART INDIA HACKATHON'), ['exhibit', 'trophy', 'prize', 'hackathon', 'cave']);
  R('core_exhibit_bp', 'Exhibit — non-invasive BP device', exhibit('bp', '#10b981', 'NON-INVASIVE BP DEVICE'), ['exhibit', 'bp', 'device', 'health', 'cave']);
  R('core_exhibit_maze', 'Exhibit — AGV maze solver', exhibit('maze', '#6366f1', 'AGV MAZE SOLVER · 2022'), ['exhibit', 'maze', 'robot', 'agv', 'cave']);
  R('core_exhibit_robot', 'Exhibit — robot arm (where it started)', exhibit('robo', '#ea580c', 'WHERE IT STARTED · ROBOTICS'), ['exhibit', 'robot', 'arm', 'robotics', 'cave']);
})();
