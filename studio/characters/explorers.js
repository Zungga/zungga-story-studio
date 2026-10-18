/*
 * Zungga Explorers — the five hero kids from the character bible (Kai, Rio, Tara, Mira, Jax), drawn in code
 * in a soft, big-eyed animated-film style. Same API as the other casts:
 *   const k = ZCharacters.explorer('rio' | {preset:'rio', outfit:'detective', ...})
 *   → { group, play, setExpression, setTalk, setSeat, hold, update, EXPRESSIONS, ANIMATIONS, params, rig }
 * Faces: 3D eyes (iris, pupil, two catchlights), lids that blink/squint, shaped brows, a painted mouth that changes
 * with every expression and opens with the voice. Hair is sculpted from tapered locks. Outfits follow each sheet.
 */
(() => {
  'use strict';
  const T = THREE;
  const lerp = (a, b, k) => a + (b - a) * k, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), smooth = (k) => k * k * (3 - 2 * k);
  const SCRIPT = document.currentScript && document.currentScript.src;
  // ---------- small helpers ----------
  function add(p, geo, m, x = 0, y = 0, z = 0) { const me = new T.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; p.add(me); return me; }
  const J = (p, x = 0, y = 0, z = 0) => { const g = new T.Group(); g.position.set(x, y, z); p.add(g); return g; };
  function canvasTex(draw, w = 256, h = 256) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; }
  let FAB = null;   // fine fabric weave bump
  function fabric() { if (FAB) return FAB; FAB = canvasTex((g, w, h) => { const im = g.createImageData(w, h); let s = 99; for (let i = 0; i < im.data.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const x = (i / 4) % w, y = Math.floor(i / 4 / w); const v = 128 + ((x + y) % 4 < 2 ? 18 : -18) + (s % 30) - 15; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); }, 128, 128); FAB.colorSpace = T.NoColorSpace; FAB.wrapS = FAB.wrapT = T.RepeatWrapping; FAB.repeat.set(8, 8); return FAB; }
  const cloth = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.82, bumpMap: fabric(), bumpScale: 0.6, ...o });
  const denim = (c) => cloth(c, { roughness: 0.9, bumpScale: 1.1 });
  const plastic = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.42, ...o });
  const skinMat = (c) => new T.MeshPhysicalMaterial({ color: c, roughness: 0.55, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new T.Color(0xffd6c0), clearcoat: 0.05 });
  const hairMat = (c) => new T.MeshPhysicalMaterial({ color: c, roughness: 0.48, sheen: 0.9, sheenRoughness: 0.35, sheenColor: new T.Color(c).lerp(new T.Color(0xffffff), 0.35), clearcoat: 0.15, clearcoatRoughness: 0.5 });
  // lathe body with elliptical cross-section: prof = [[r, y], ...] bottom→top
  function lathe(prof, sx = 1, sz = 1, seg = 40, phiStart = 0, phiLen = Math.PI * 2) {
    const g = new T.LatheGeometry(prof.map(([r, y]) => new T.Vector2(Math.max(r, 0.0005), y)), seg, phiStart, phiLen);
    g.scale(sx, 1, sz); g.computeVertexNormals(); return g;
  }
  // tapered tube along a curve (hair locks, laces, straps)
  function taper(curve, r0, r1 = 0.0004, seg = 20, rad = 8, flat = 1) {
    const pos = [], idx = [], uv = [], N = seg, fr = curve.computeFrenetFrames(N, false);
    for (let i = 0; i <= N; i++) { const t = i / N, p = curve.getPointAt(t), r = lerp(r0, r1, Math.pow(t, 0.9)), n = fr.normals[i], b = fr.binormals[i];
      for (let j = 0; j <= rad; j++) { const a = j / rad * Math.PI * 2, c = Math.cos(a) * r, s = Math.sin(a) * r * flat; pos.push(p.x + n.x * c + b.x * s, p.y + n.y * c + b.y * s, p.z + n.z * c + b.z * s); uv.push(j / rad, t); } }
    for (let i = 0; i < N; i++) for (let j = 0; j < rad; j++) { const a = i * (rad + 1) + j, b2 = a + rad + 1; idx.push(a, b2, a + 1, b2, b2 + 1, a + 1); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const curve3 = (...pts) => new T.CatmullRomCurve3(pts.map((p) => V(...p)));
  function roundBox(w, h, d, r = 0.01) {
    r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4); const s = new T.Shape(), x = w / 2 - r, y = h / 2 - r;
    s.moveTo(-x, -h / 2); s.lineTo(x, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -y); s.lineTo(w / 2, y); s.quadraticCurveTo(w / 2, h / 2, x, h / 2); s.lineTo(-x, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, y); s.lineTo(-w / 2, -y); s.quadraticCurveTo(-w / 2, -h / 2, -x, -h / 2);
    const g = new T.ExtrudeGeometry(s, { depth: Math.max(1e-4, d - 2 * r), bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 4, curveSegments: 6 }); g.center(); g.computeVertexNormals(); return g;
  }
  const seeded = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
  // flat decal (emblem / print) on a garment, facing +z
  function decal(p, tex, w, h, x, y, z, ry = 0) { const m = add(p, new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -4, depthWrite: false }), x, y, z); m.rotation.y = ry; m.castShadow = false; return m; }

  // ---------- emblems (canvas) ----------
  const EMB = {
    bolt: (col = '#ffc83d', edge = '#e07b00') => canvasTex((g, W, H) => { g.translate(W / 2, H / 2); g.beginPath(); const P = [[0.08, -0.48], [-0.3, 0.06], [-0.02, 0.06], [-0.14, 0.48], [0.3, -0.1], [0.02, -0.1], [0.16, -0.48]]; P.forEach(([x, y], i) => (i ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H))); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = W * 0.04; g.strokeStyle = edge; g.stroke(); }, 256, 256),
    letter: (L, fill = '#ffffff', edge = null, font = 'Georgia, serif', heart = null) => canvasTex((g, W, H) => { g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${H * 0.82}px ${font}`; if (edge) { g.lineWidth = W * 0.08; g.strokeStyle = edge; g.strokeText(L, W / 2, H * 0.54); } g.fillStyle = fill; g.fillText(L, W / 2, H * 0.54); if (heart) { g.fillStyle = heart; const hx = W * 0.8, hy = H * 0.8, s = W * 0.09; g.beginPath(); g.moveTo(hx, hy + s); g.bezierCurveTo(hx - s * 2, hy - s * 0.4, hx - s * 0.6, hy - s * 1.6, hx, hy - s * 0.5); g.bezierCurveTo(hx + s * 0.6, hy - s * 1.6, hx + s * 2, hy - s * 0.4, hx, hy + s); g.fill(); } }, 256, 256),
    zcircle: (ring = '#ffd166', inner = '#1e88e5', z = '#ffd166') => canvasTex((g, W, H) => { g.beginPath(); g.arc(W / 2, H / 2, W * 0.46, 0, 6.3); g.fillStyle = ring; g.fill(); g.beginPath(); g.arc(W / 2, H / 2, W * 0.36, 0, 6.3); g.fillStyle = inner; g.fill(); g.fillStyle = z; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${H * 0.52}px Arial Black, Arial, sans-serif`; g.fillText('Z', W / 2, H * 0.54); }, 256, 256),
    tgeo: () => canvasTex((g, W, H) => { g.fillStyle = '#19b6c8'; g.font = `900 ${H * 0.62}px Arial Black, Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('T', W / 2, H * 0.48); g.strokeStyle = '#7b2fbe'; g.lineWidth = 6; for (const [x, y, r] of [[0.2, 0.25, 0.06], [0.82, 0.3, 0.05], [0.75, 0.8, 0.07], [0.22, 0.78, 0.05]]) { g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; g.lineTo((x + Math.cos(a) * r) * W, (y + Math.sin(a) * r) * H); } g.closePath(); g.stroke(); } }, 256, 256),
    shieldJ: () => canvasTex((g, W, H) => { g.translate(W / 2, H / 2); g.beginPath(); g.moveTo(0, -H * 0.44); g.lineTo(W * 0.38, -H * 0.3); g.lineTo(W * 0.32, H * 0.15); g.lineTo(0, H * 0.45); g.lineTo(-W * 0.32, H * 0.15); g.lineTo(-W * 0.38, -H * 0.3); g.closePath(); g.fillStyle = '#7a1414'; g.fill(); g.lineWidth = 10; g.strokeStyle = '#f2d7b0'; g.stroke(); g.fillStyle = '#f2d7b0'; g.font = `900 ${H * 0.46}px Georgia`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('J', 0, H * 0.02); }, 256, 256),
    badge: () => canvasTex((g, W, H) => { g.beginPath(); g.arc(W / 2, H / 2, W * 0.45, 0, 6.3); g.fillStyle = '#d4a017'; g.fill(); g.beginPath(); g.arc(W / 2, H / 2, W * 0.34, 0, 6.3); g.fillStyle = '#8a5a12'; g.fill(); g.fillStyle = '#fde68a'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 - Math.PI / 2, r = (i % 2 ? 0.12 : 0.28) * W; g.lineTo(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r); } g.fill(); }, 128, 128),
  };

  // ---------- the five explorers (from the character bible) ----------
  const SK = { kai: 0xe9a777, rio: 0xeaa678, tara: 0xe5a173, mira: 0xebab7e, jax: 0xd9925f };
  const PRESETS = {
    kai: { label: 'Kai — The Curious Leader', role: 'leader', H: 1.37, build: 1.0, skin: SK.kai, hair: 'messy', hairColor: 0x4a2b1a, brow: 0x3a2214, eyes: 0x5a3416,
      outfit: { kind: 'hoodie', top: 0x1e5fd0, top2: 0x1650b4, trim: 0xffd166, zip: true, emblem: 'kai', bottom: 'jeans', pants: 0x243447, shoe: 0x1e5fd0, shoe2: 0xffffff, stripe: 0xffd166, pack: 0x243447, packEmblem: 'kai', watch: 0x111827 } },
    rio: { label: 'Rio — The Energetic Spark', role: 'spark', H: 1.35, build: 0.95, skin: SK.rio, hair: 'spiky', hairColor: 0x3d2416, brow: 0x2f1c10, eyes: 0x5a3416, freckles: true,
      outfit: { kind: 'jacket', top: 0xff6a00, top2: 0xf3eadb, tee: 0x1ea6ff, teeEmblem: 'bolt', emblemR: true, bottom: 'shorts', pants: 0x2b2b2b, shoe: 0xff6a00, shoe2: 0xffffff, pack: 0x2b2b2b, packEmblem: 'bolt', band: 0xff6a00 } },
    tara: { label: 'Tara — The Logical Observer', role: 'observer', H: 1.32, build: 0.9, skin: SK.tara, hair: 'ponytail', hairColor: 0x17131c, brow: 0x17131c, eyes: 0x4a2a14, female: true, glasses: 0x7b2fbe,
      outfit: { kind: 'hoodie_open', top: 0x14b3c8, top2: 0x7b2fbe, tee: 0xf8f8f8, teeEmblem: 'tgeo', bottom: 'cargo', pants: 0x2d3047, stitch: 0x19b6c8, shoe: 0x14b3c8, shoe2: 0xffffff, accent: 0x7b2fbe, pack: 0x6b4fbf, pack2: 0x14b3c8, packEmblem: 'tara', watch: 0x2d3047, tie: 0x14b3c8 } },
    mira: { label: 'Mira — The Creative Imaginer', role: 'imaginer', H: 1.32, build: 0.9, skin: SK.mira, hair: 'wavy', hairColor: 0x4b2c1b, brow: 0x3a2214, eyes: 0x5a3416, female: true, clip: 0xff6fa6,
      outfit: { kind: 'hoodie', top: 0xff6fa6, top2: 0xf35d97, trim: 0xffffff, emblem: 'mira', bottom: 'jeans_rolled', pants: 0x4e7bb5, patch: 0xff6fa6, shoe: 0x7b61ff, shoe2: 0xffffff, hightop: true, pack: 0x7b61ff, packEmblem: 'mira', bracelet: true } },
    jax: { label: 'Jax — The Powerhouse & Protector', role: 'protector', H: 1.5, build: 1.35, skin: SK.jax, hair: 'flattop', hairColor: 0x2e1a10, brow: 0x24140c, eyes: 0x3d2414, heavyBrow: true,
      outfit: { kind: 'jacket_jax', top: 0xc0282d, top2: 0x3b1f17, tee: 0x2e2a2a, bottom: 'cargo', pants: 0x3b1f17, stitch: 0x5a3a2a, shoe: 0x4a2a1c, shoe2: 0xc0282d, boots: true, belt: 0x3a2418, buckle: 'J', gloves: 0x2a2220, patch: true } },
    // ---- the workers of the Zungga Chocolate Factory (worker sheet) ----
    ben: { label: 'Ben — Cookie Baker', role: 'baker', H: 1.36, build: 1.05, skin: 0xe9a777, hair: 'messy', hairColor: 0x5a3220, brow: 0x3a2214, eyes: 0x5a3416, hat: { kind: 'chef' }, prop: 'tray',
      outfit: { kind: 'worker', top: 0xf8f4ec, apron: 0x6b3a1f, bottom: 'pants', pants: 0x3b2a20, shoe: 0x5b3420, shoe2: 0xf3e2c8 } },
    lulu: { label: 'Lulu — Candy Artist', role: 'candy artist', H: 1.3, build: 0.9, skin: 0xebab7e, hair: 'buns', hairColor: 0x3a2214, brow: 0x2a180e, eyes: 0x4a2a14, female: true, clips: [0xff6fa6, 0x7bd3f7], prop: 'lollipop',
      outfit: { kind: 'worker', top: 0xf9a8d4, apron: 0x7c3aed, bottom: 'pants', pants: 0x6d28d9, shoe: 0xec4899, shoe2: 0xffffff } },
    ollie: { label: 'Ollie — Dough Master', role: 'dough master', H: 1.35, build: 1.0, skin: 0xd9925f, hair: 'curly', hairColor: 0x2b1a12, brow: 0x24150d, eyes: 0x3a2214, hat: { kind: 'chef' }, prop: 'dough',
      outfit: { kind: 'worker', top: 0xf8f4ec, apron: 0xe58a1f, bottom: 'pants', pants: 0x4a3426, shoe: 0x6b4423, shoe2: 0xf3e2c8 } },
    penny: { label: 'Penny — Packaging Pro', role: 'packaging', H: 1.31, build: 0.92, skin: 0xe9a777, hair: 'ponytail', hairColor: 0x4a2b1a, brow: 0x3a2214, eyes: 0x4a2a14, female: true, glasses: 0x1f1a17, hat: { kind: 'cap', color: 0x4d7c3a }, prop: 'box',
      outfit: { kind: 'worker', top: 0x5f9a3a, apron: 0x3f6b2a, bottom: 'pants', pants: 0x3b2a20, shoe: 0x4d7c3a, shoe2: 0xffffff, tie: 0x4d7c3a } },
    moss: { label: 'Moss — Garden Keeper', role: 'gardener', H: 1.28, build: 1.0, skin: 0xb9b07a, hair: 'leafy', hairColor: 0x4f7a2a, brow: 0x3f5a22, eyes: 0x3a4a1a, elfEars: true, freckles: true, prop: 'can',
      outfit: { kind: 'worker', top: 0xe9dfc4, overalls: 0x3f6b2a, bottom: 'pants', pants: 0x3f6b2a, shoe: 0x5b3420, shoe2: 0x8a5a33, boots: true } },
    rosie: { label: 'Rosie — Receptionist', role: 'receptionist', H: 1.32, build: 0.9, skin: 0xebab7e, hair: 'wavy', hairColor: 0x3a2214, brow: 0x2a180e, eyes: 0x4a2a14, female: true, hat: { kind: 'bow', color: 0x7c3aed }, prop: 'bell',
      outfit: { kind: 'worker', top: 0xf8f4ec, blazer: 0x6d28d9, bottom: 'pants', pants: 0x3b0764, shoe: 0x7c3aed, shoe2: 0xffffff } },
    bruno: { label: 'Bruno — Security Guard', role: 'security', H: 1.42, build: 1.32, skin: 0xd9925f, hair: 'short', hairColor: 0x2b1a12, brow: 0x24150d, eyes: 0x3a2214, heavyBrow: true, mustache: 0x2b1a12, hat: { kind: 'police', color: 0x1e3a8a }, prop: 'radio',
      outfit: { kind: 'worker', top: 0x1e3a8a, uniform: true, bottom: 'pants', pants: 0x172554, shoe: 0x111827, shoe2: 0x111827, belt: 0x111827, boots: true } },
    pip: { label: 'Pip — Train Assistant', role: 'train assistant', H: 1.3, build: 0.95, skin: 0xe9a777, hair: 'messy', hairColor: 0x5a3220, brow: 0x3a2214, eyes: 0x5a3416, hat: { kind: 'striped', color: 0x1d4ed8 }, scarf: 0xdc2626, prop: 'flag',
      outfit: { kind: 'worker', top: 0xf8f4ec, overalls: 0x1d4ed8, bottom: 'pants', pants: 0x1d4ed8, shoe: 0x5b3420, shoe2: 0xffffff } },
    nibbles: { label: 'Nibbles — Lab Helper', role: 'lab helper', H: 1.27, build: 0.92, skin: 0xe9b08a, hair: 'short', hairColor: 0x5a3220, brow: 0x3a2214, eyes: 0x3a2214, elfEars: true, glasses: 0x22c55e, hat: { kind: 'beanie', color: 0x7c3aed }, prop: 'flask',
      outfit: { kind: 'worker', top: 0x7c3aed, coat: true, bottom: 'pants', pants: 0x4c1d95, shoe: 0x7c3aed, shoe2: 0xffffff } },
    bubbles: { label: 'Bubbles — Cleaner', role: 'cleaner', H: 1.34, build: 1.38, skin: 0xe9a777, hair: 'short', hairColor: 0x4a2b1a, brow: 0x3a2214, eyes: 0x4a2a14, hat: { kind: 'bandana', color: 0x0891b2 }, prop: 'broom',
      outfit: { kind: 'worker', top: 0xf8f4ec, overalls: 0x0e7490, bottom: 'pants', pants: 0x0e7490, shoe: 0x0e7490, shoe2: 0xffffff } },
    tink: { label: 'Tink — Maintenance Expert', role: 'maintenance', H: 1.35, build: 1.0, skin: 0xe2a172, hair: 'messy', hairColor: 0x4a2b1a, brow: 0x3a2214, eyes: 0x5a3416, hat: { kind: 'goggles', color: 0x6b4423 }, prop: 'wrench',
      outfit: { kind: 'worker', top: 0xd6b98c, overalls: 0x6b4423, bottom: 'pants', pants: 0x6b4423, shoe: 0x3b2416, shoe2: 0x6b4423, belt: 0x3b2416, boots: true } },
    vanilla: { label: 'Vanilla — Quality Inspector', role: 'quality inspector', H: 1.3, build: 0.9, skin: 0xebab7e, hair: 'wavy', hairColor: 0x6b3a1f, brow: 0x4a2814, eyes: 0x4a2a14, female: true, glasses: 0xec4899, hat: { kind: 'chef', color: 0xffffff }, prop: 'magnifier',
      outfit: { kind: 'worker', top: 0xf8f4ec, apron: 0xf472b6, bottom: 'pants', pants: 0x6b3a1f, shoe: 0xec4899, shoe2: 0xffffff } },
  };
  // detective look (the second sheet): beige trench coat, waistcoat, shirt + coloured tie, dark trousers, magnifying glass
  const DETECTIVE_TIE = { kai: 0x6d3fc0, rio: 0x6b3a1e, tara: 0x14b3c8, mira: 0xe9658f, jax: 0xc0282d };

  // ---------- face: mouth painted on a curved layer ----------
  function mouthTex(m) {   // m: { c curve -1..1, o open 0..1, w width, teeth, tongue, asym, frown }
    return canvasTex((g, W, H) => {
      g.clearRect(0, 0, W, H); const cx = W / 2, cy = H * 0.45, hw = W * 0.21 * m.w, open = m.o, curve = m.c, a = m.asym || 0;
      const lc = [cx - hw, cy - curve * H * 0.14 - a * H * 0.06], rc = [cx + hw, cy - curve * H * 0.14 + a * H * 0.06];
      g.lineCap = 'round'; g.lineJoin = 'round';
      if (open < 0.06) {   // closed mouth: a soft line with dimples
        g.strokeStyle = '#7a3826'; g.lineWidth = H * 0.04; g.beginPath(); g.moveTo(...lc); g.quadraticCurveTo(cx, cy + curve * H * 0.16, ...rc); g.stroke();
        if (curve > 0.3) { g.lineWidth = H * 0.02; for (const [x, y, s] of [[lc[0], lc[1], -1], [rc[0], rc[1], 1]]) { g.beginPath(); g.arc(x + s * W * 0.012, y - H * 0.01, H * 0.025, s > 0 ? -0.6 : Math.PI - 0.6 + 1.2, s > 0 ? 0.6 : Math.PI + 0.6); g.stroke(); } }
        return;
      }
      const top = cy - open * H * 0.06 + curve * H * 0.0, bot = cy + open * H * 0.62 + curve * H * 0.12;
      g.beginPath(); g.moveTo(...lc); g.bezierCurveTo(cx - hw * 0.5, top - curve * H * 0.02, cx + hw * 0.5, top - curve * H * 0.02, ...rc); g.bezierCurveTo(cx + hw * 0.6, bot, cx - hw * 0.6, bot, ...lc); g.closePath();
      g.fillStyle = '#5a1e1a'; g.fill(); g.save(); g.clip();
      if (m.teeth) { g.fillStyle = '#fbf6ef'; g.fillRect(cx - hw * 1.1, top - H * 0.05, hw * 2.2, H * (0.06 + open * 0.05)); if (m.teeth === 2) g.fillRect(cx - hw * 1.1, bot - H * 0.045, hw * 2.2, H * 0.05); }
      if (m.tongue || open > 0.45) { g.fillStyle = '#e06a6a'; g.beginPath(); g.ellipse(cx + a * hw * 0.3, bot + H * 0.01, hw * 0.55, H * (0.04 + open * 0.06), 0, 0, Math.PI * 2); g.fill(); }
      g.restore(); g.strokeStyle = '#7a3220'; g.lineWidth = H * 0.018; g.beginPath(); g.moveTo(...lc); g.bezierCurveTo(cx - hw * 0.5, top - curve * H * 0.02, cx + hw * 0.5, top - curve * H * 0.02, ...rc); g.bezierCurveTo(cx + hw * 0.6, bot, cx - hw * 0.6, bot, ...lc); g.closePath(); g.stroke();
    }, 256, 128);
  }
  // expression = brows + lids + eyes + mouth (+ head tilt)
  const EXPR = {
    neutral:    { by: 0, bt: 0, lt: 0.1, lb: 0, pupil: 1, m: { c: 0.25, o: 0, w: 0.8 } },
    smile:      { by: 0.15, bt: -0.05, lt: 0.08, lb: 0.25, pupil: 1, m: { c: 0.75, o: 0, w: 0.95 } },
    big_smile:  { by: 0.3, bt: -0.1, lt: 0.05, lb: 0.35, pupil: 1.05, m: { c: 0.9, o: 0.45, w: 1.1, teeth: 1 } },
    excited:    { by: 0.55, bt: -0.12, lt: 0, lb: 0.2, pupil: 1.12, m: { c: 0.85, o: 0.7, w: 1.1, teeth: 1, tongue: 1 } },
    laughing:   { by: 0.4, bt: -0.15, lt: 0.55, lb: 0.6, pupil: 1, m: { c: 0.95, o: 0.85, w: 1.2, teeth: 1, tongue: 1 }, tilt: -0.08 },
    sad:        { by: 0.1, bt: -0.45, lt: 0.35, lb: 0, pupil: 1.05, m: { c: -0.7, o: 0, w: 0.75 }, look: [0, -0.25] },
    surprised:  { by: 0.75, bt: -0.1, lt: -0.05, lb: 0, pupil: 0.85, m: { c: 0, o: 0.55, w: 0.45 } },
    shocked:    { by: 0.9, bt: -0.2, lt: -0.1, lb: 0, pupil: 0.7, m: { c: -0.2, o: 0.95, w: 0.65, teeth: 2 } },
    thinking:   { by: 0.25, bt: 0.2, lt: 0.25, lb: 0.2, pupil: 1, m: { c: 0.1, o: 0, w: 0.6, asym: 0.6 }, look: [0.35, 0.35], tilt: 0.08, browAsym: 0.4 },
    worried:    { by: 0.35, bt: -0.55, lt: 0.12, lb: 0, pupil: 1.05, m: { c: -0.45, o: 0.12, w: 0.7, teeth: 1 } },
    determined: { by: -0.15, bt: 0.45, lt: 0.32, lb: 0.25, pupil: 1, m: { c: 0.35, o: 0, w: 0.85, asym: 0.25 } },
    confused:   { by: 0.2, bt: 0, lt: 0.2, lb: 0.1, pupil: 1, m: { c: -0.25, o: 0.05, w: 0.6, asym: -0.5 }, tilt: 0.12, browAsym: 0.7 },
    angry:      { by: -0.3, bt: 0.75, lt: 0.35, lb: 0.3, pupil: 0.95, m: { c: -0.5, o: 0.5, w: 0.95, teeth: 2 } },
    stern:      { by: -0.2, bt: 0.55, lt: 0.35, lb: 0.2, pupil: 1, m: { c: -0.2, o: 0, w: 0.75 } },
    proud:      { by: 0.1, bt: 0.1, lt: 0.35, lb: 0.35, pupil: 1, m: { c: 0.75, o: 0, w: 1.0, asym: 0.3 }, tilt: -0.05, chin: -0.12 },
    cheeky:     { by: 0.2, bt: 0.2, lt: 0.3, lb: 0.35, pupil: 1, m: { c: 0.7, o: 0.25, w: 0.95, teeth: 1, asym: 0.6 }, browAsym: 0.8, wink: 1 },
    focused:    { by: -0.1, bt: 0.3, lt: 0.3, lb: 0.25, pupil: 0.95, m: { c: 0.05, o: 0, w: 0.6 } },
    idea:       { by: 0.7, bt: -0.15, lt: -0.05, lb: 0.15, pupil: 1.1, m: { c: 0.8, o: 0.4, w: 0.9, teeth: 1 }, look: [0.1, 0.4] },
    shy:        { by: 0.25, bt: -0.3, lt: 0.35, lb: 0.3, pupil: 1.05, m: { c: 0.5, o: 0, w: 0.55, asym: 0.3 }, look: [-0.3, -0.25], tilt: 0.12, blush: 1 },
    confident:  { by: 0.05, bt: 0.25, lt: 0.25, lb: 0.3, pupil: 1, m: { c: 0.8, o: 0.3, w: 1.0, teeth: 1, asym: 0.35 } },
    dizzy:      { by: 0.3, bt: -0.3, lt: 0.4, lb: 0, pupil: 0.8, m: { c: -0.3, o: 0.3, w: 0.7, asym: 0.5 }, tilt: 0.15 },
    protective: { by: -0.1, bt: 0.45, lt: 0.25, lb: 0.15, pupil: 1, m: { c: -0.1, o: 0, w: 0.8 } },
    playful:    { by: 0.35, bt: 0, lt: 0.15, lb: 0.35, pupil: 1.05, m: { c: 0.75, o: 0.3, w: 0.9, teeth: 1, tongue: 1, asym: 0.4 }, tilt: 0.08 },
    calm:       { by: 0.05, bt: 0, lt: 0.3, lb: 0.2, pupil: 1, m: { c: 0.45, o: 0, w: 0.7 } },
  };

  // =====================================================================================
  function explorer(opts = {}) {
    if (typeof opts === 'string') opts = { preset: opts };
    const P0 = PRESETS[opts.preset || 'kai'] || PRESETS.kai, P = { ...P0, ...opts, outfit: { ...P0.outfit, ...(opts.outfit_colors || {}) } };
    const detective = opts.outfit === 'detective', fem = !!P.female, H = P.H, B = P.build, id = opts.preset || 'kai';
    if (P.hat && ['chef', 'cap', 'striped', 'police', 'beanie', 'bandana'].includes(P.hat.kind) && ['messy', 'spiky', 'curly', 'flattop'].includes(P.hair)) P.hair = 'short';   // hair tucked under the hat
    const root = new T.Group(), skin = skinMat(P.skin), skinDark = skinMat(new T.Color(P.skin).multiplyScalar(0.82).getHex());
    // proportions (big head, short torso, sturdy legs)
    const headH = 0.37 * (H / 1.35) ** 0.3, headW = headH * 1.0, legLen = H * 0.415, hipW = 0.1 * B ** 0.85, shW = 0.158 * B ** 0.9 * (H / 1.35) ** 0.4, torsoH = H - legLen - headH - 0.01, chestD = 0.09 * B ** 0.9;
    const body = J(root), hips = J(body, 0, legLen, 0), spine = J(hips, 0, 0.02, 0), chest = J(spine, 0, torsoH * 0.5, 0), neck = J(chest, 0, torsoH * 0.5 - 0.02, 0), head = J(neck, 0, 0.02, 0.008), headC = J(head, 0, headH * 0.43, 0);
    const O = P.outfit;

    // ---------- head ----------
    function deformHead(g) { const hp = g.attributes.position;
    for (let i = 0; i < hp.count; i++) {   // soft cartoon skull: full cheeks, rounded chin, flatter back
      let x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i);
      const cheek = Math.max(0, 1 - ((y + 0.3) / 0.45) ** 2) * (0.6 + 0.4 * Math.max(0, z)) * 0.14;
      x *= 1 + cheek; z *= 1 + cheek * 0.4 * Math.max(0, z); if (y < -0.25) { const k = (y + 0.25) / 0.75; x *= 1 - k * k * 0.3; z *= 1 - k * k * 0.1; }
      if (y > 0.2) { x *= 1 + (y - 0.2) * 0.06; }
      if (z < 0) z *= 0.94; if (y < 0) y *= 0.84; hp.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals(); return g; }
    const hg = deformHead(new T.SphereGeometry(1, 64, 48)); const skull = add(headC, hg, skin); skull.scale.set(headW / 2, headH / 2, headH * 0.48);
    if (P.elfEars) for (const s of [-1, 1]) { const ear = add(headC, new T.ConeGeometry(0.03, 0.13, 16), skin, s * headW * 0.56, headH * 0.04, -headH * 0.03); ear.rotation.set(0, 0, -s * 1.15); ear.scale.z = 0.45; const inner = add(ear, new T.ConeGeometry(0.018, 0.09, 12), skinDark, 0, -0.005, 0.008); inner.castShadow = false; }
    else for (const s of [-1, 1]) { const ear = add(headC, new T.SphereGeometry(1, 20, 14), skin, s * headW * 0.5, -headH * 0.02, -headH * 0.02); ear.scale.set(0.022, 0.034, 0.016); const inner = add(ear, new T.SphereGeometry(0.6, 14, 10), skinDark, s * 0.25, 0, 0.3); inner.castShadow = false; }
    const nose = add(headC, new T.SphereGeometry(1, 24, 16), skin, 0, -headH * 0.11, headH * 0.46); nose.scale.set(headW * 0.062, headH * 0.048, headH * 0.055);
    // face paint layer (mouth, blush, freckles) — a slice of a slightly bigger head
    const faceLayer = (thetaS, thetaL, phiS, phiL) => deformHead(new T.SphereGeometry(1.006, 48, 24, phiS, phiL, thetaS, thetaL));
    const mouthGeo = faceLayer(Math.PI * 0.58, Math.PI * 0.15, Math.PI * 0.3, Math.PI * 0.4);
    const mouthMat = new T.MeshStandardMaterial({ transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const mouth = add(headC, mouthGeo, mouthMat); mouth.scale.copy(skull.scale); mouth.castShadow = false;
    // blush + freckles
    const blushTex = canvasTex((g, W, H2) => { for (const x of [0.2, 0.8]) { const gr = g.createRadialGradient(W * x, H2 * 0.5, 2, W * x, H2 * 0.5, W * 0.16); gr.addColorStop(0, 'rgba(240,110,100,0.55)'); gr.addColorStop(1, 'rgba(240,110,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H2); }
      if (P.freckles) { g.fillStyle = 'rgba(140,72,44,0.8)'; const r = seeded(7); for (const x of [0.27, 0.73]) for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(W * (x + (r() - 0.5) * 0.12), H2 * (0.3 + (r() - 0.5) * 0.22), 3.2, 0, 6.3); g.fill(); } } }, 256, 128);
    const blush = add(headC, faceLayer(Math.PI * 0.5, Math.PI * 0.16, Math.PI * 0.18, Math.PI * 0.64), new T.MeshStandardMaterial({ map: blushTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })); blush.scale.copy(skull.scale); blush.castShadow = false;
    const blushBase = 0.55;

    // ---------- eyes ----------
    const eyeR = headH * 0.108, eyeX = headW * 0.215, eyeY = headH * 0.02, eyeZ = headH * 0.36;
    const irisTex = canvasTex((g, W, H2) => {   // polar layout: v = 0 centre → 1 edge (for the cap uv)
      const ic = new T.Color(P.eyes), light = '#' + ic.clone().lerp(new T.Color(0xd9a35a), 0.55).getHexString(), dark = '#' + ic.clone().multiplyScalar(0.45).getHexString();
      const gr = g.createLinearGradient(0, 0, 0, H2); gr.addColorStop(0, '#050302'); gr.addColorStop(0.38, '#050302'); gr.addColorStop(0.42, dark); gr.addColorStop(0.62, '#' + ic.getHexString()); gr.addColorStop(0.82, light); gr.addColorStop(0.93, dark); gr.addColorStop(1, '#1a0f08');
      g.fillStyle = gr; g.fillRect(0, 0, W, H2); g.globalAlpha = 0.18; g.strokeStyle = '#000'; for (let i = 0; i < 70; i++) { g.beginPath(); g.moveTo(i * W / 70, H2 * 0.42); g.lineTo(i * W / 70 + 2, H2 * 0.9); g.stroke(); } g.globalAlpha = 1;
    }, 256, 128);
    const scleraM = new T.MeshPhysicalMaterial({ color: 0xfdfbf8, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 });
    const irisM = new T.MeshPhysicalMaterial({ map: irisTex, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 });
    const lidM = skin, lashM = new T.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.7 });
    const glintM = new T.MeshBasicMaterial({ color: 0xffffff });
    const eyes = [-1, 1].map((s) => {
      const socket = J(headC, s * eyeX, eyeY, eyeZ); socket.rotation.y = s * 0.16;
      const ball = J(socket); add(ball, new T.SphereGeometry(eyeR, 40, 28), scleraM).scale.set(1, 1.08, 0.9);
      const iris = add(ball, new T.SphereGeometry(eyeR * 1.002, 40, 12, 0, Math.PI * 2, 0, 0.78), irisM); iris.rotation.x = Math.PI / 2; iris.scale.set(1, 1.08, 0.9); iris.castShadow = false;
      // two catchlights fixed to the head (they don't roll with the eye)
      const g1 = add(socket, new T.SphereGeometry(eyeR * 0.17, 12, 8), glintM, -eyeR * 0.28, eyeR * 0.32, eyeR * 0.86); g1.castShadow = false;
      const g2 = add(socket, new T.SphereGeometry(eyeR * 0.08, 10, 6), glintM, eyeR * 0.25, -eyeR * 0.22, eyeR * 0.88); g2.castShadow = false;
      const glints = [g1, g2];
      // lids: upper + lower shells that rotate over the ball
      const upper = J(socket), lower = J(socket);
      const lidG = new T.SphereGeometry(eyeR * 1.1, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
      add(upper, lidG, lidM).scale.set(1.03, 1.1, 0.96); const lg = new T.SphereGeometry(eyeR * 1.09, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.5); const lo = add(lower, lg, lidM); lo.rotation.x = Math.PI; lo.scale.set(1.03, 1.08, 0.94);
      // lash line on the upper lid edge (+ flicks for the girls)
      const lash = add(upper, new T.TorusGeometry(eyeR * 1.06, eyeR * (fem ? 0.085 : 0.05), 6, 32, Math.PI), lashM, 0, 0, 0); lash.rotation.set(Math.PI / 2, 0, 0); lash.scale.set(1.03, 0.96, 1);
      if (fem) for (let k = 0; k < 3; k++) { const fl = add(upper, new T.ConeGeometry(eyeR * 0.07, eyeR * 0.45, 5), lashM, s * eyeR * (0.75 + k * 0.12), eyeR * 0.05, eyeR * (0.45 - k * 0.25)); fl.rotation.set(0, 0, -s * (1.1 + k * 0.2)); }
      return { s, socket, ball, upper, lower, iris, glints };
    });
    // brows: thick arched tubes (Jax: heavy and low)
    const browM = hairMat(P.brow);
    const brows = [-1, 1].map((s) => {
      const piv = J(headC, s * eyeX * 1.02, eyeY + eyeR * (P.heavyBrow ? 1.25 : 1.42), eyeZ + eyeR * 0.5);
      const th = P.heavyBrow ? 0.012 : 0.0085, len = eyeR * (P.heavyBrow ? 1.55 : 1.35);
      const c = curve3([-len * s, -0.003, -0.006], [0, 0.006, 0.006], [len * s * 0.9, -0.008, -0.004]);
      add(piv, taper(c, th, th * 0.45, 16, 8, 0.6), browM); piv.rotation.y = s * 0.2; return { s, piv, y0: piv.position.y };
    });

    // ---------- hair ----------
    const hairG = J(headC), hm = hairMat(P.hairColor), hmDark = hairMat(new T.Color(P.hairColor).multiplyScalar(0.7).getHex()), swayers = [];
    const R = headH * 0.5, cap = (scale = 1.04, front = 0.95, nape = 2.25, m = hm) => { const thetaL = (front + nape) / 2, tilt = (nape - front) / 2; const c = add(hairG, new T.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, thetaL), m); c.scale.set(headW / 2 * scale, headH / 2 * scale, headH * 0.49 * scale); c.rotation.x = -tilt; return c; };   // front / nape = hairline angles from the top (radians)
    const onHead = (u, v, out = 1.0) => { // u: around (0 = front), v: from top (0) to ears (1) → point on the skull surface
      const th = v * Math.PI * 0.55, ph = u; return V(Math.sin(th) * Math.sin(ph) * headW / 2 * out, Math.cos(th) * headH / 2 * out, Math.sin(th) * Math.cos(ph) * headH * 0.49 * out); };
    function lock(from, ctrl, tip, r0, m = hm, flat = 0.7) { const g = taper(new T.CatmullRomCurve3([from, ctrl, tip]), r0, r0 * 0.05, 14, 7, flat); return add(hairG, g, m); }
    const rnd = seeded(id.length * 31 + 7);
    if (P.hair === 'spiky' || P.hair === 'messy') {   // Rio: big messy spikes, bangs swept to one side; Kai: softer, fuller
      cap(1.05, 0.85, 2.0); cap(1.03, 1.05, 2.35, hmDark);
      const n = P.hair === 'spiky' ? 64 : 56;
      for (let i = 0; i < n; i++) {
        const u = (i / n) * Math.PI * 2 + rnd() * 0.25, frontness = Math.cos(u), v = 0.15 + rnd() * 0.45 - Math.max(0, frontness) * 0.08;
        const base = onHead(u, v, 0.98), outDir = base.clone().normalize();
        const len = (P.hair === 'spiky' ? 0.09 : 0.075) + rnd() * 0.04 + (frontness > 0.4 ? 0.02 : 0);
        let dir = outDir.clone().add(V(0, 0.55, 0)).normalize();
        if (frontness > 0.35) dir = V(-0.55 + rnd() * 0.3, -0.15 + rnd() * 0.3, 0.75).normalize();   // bangs swept to the left over the forehead
        if (frontness < -0.3) dir = V(outDir.x * 0.6, 0.35 + rnd() * 0.3, -0.75).normalize();          // back: spikes sweep back
        const tip = base.clone().addScaledVector(dir, len), ctrl = base.clone().lerp(tip, 0.5).addScaledVector(outDir, 0.012).add(V(0, 0.01, 0));
        lock(base, ctrl, tip, 0.036 + rnd() * 0.016, rnd() < 0.25 ? hmDark : hm, 0.85);
      }
      for (let i = 0; i < 11; i++) { const u = -0.95 + i * 0.19 + rnd() * 0.06, base = onHead(u, 0.27, 0.99), tip = base.clone().add(V(-0.045 - rnd() * 0.02, -0.04 - rnd() * 0.035, 0.05)); lock(base, base.clone().lerp(tip, 0.5).add(V(0, 0.02, 0.012)), tip, 0.032, hm, 0.8); }   // fringe swept to one side
    } else if (P.hair === 'flattop') {   // Jax: rugged short flat-top with spikes, darker faded sides
      cap(1.035, 0.8, 2.1, hmDark);
      for (let i = 0; i < 130; i++) { const u = rnd() * Math.PI * 2, v = Math.sqrt(rnd()) * 0.5, b = onHead(u, v, 1.0), topY = headH * 0.58 + (Math.cos(u) > 0.5 ? 0.012 : 0); if (b.y > topY - 0.01) continue; const tip = V(b.x * 1.04, topY + rnd() * 0.012, b.z * 1.04 + 0.006); lock(b.clone().multiplyScalar(0.97), b.clone().lerp(tip, 0.5).multiplyScalar(1.01), tip, 0.026, rnd() < 0.3 ? hmDark : hm, 0.9); }
      for (let i = 0; i < 7; i++) { const x = -headW * 0.32 + i * headW * 0.1, b = V(x, headH * 0.44, headH * 0.36), tip = b.clone().add(V(0.01, 0.035, 0.03)); lock(b, b.clone().lerp(tip, 0.5), tip, 0.02, hm); }
    } else if (P.hair === 'ponytail') {   // Tara: pulled back, side-swept bangs, high ponytail with a teal scrunchie
      cap(1.04, 0.78, 2.2); cap(1.025, 1.15, 2.45);
      for (let i = 0; i < 8; i++) { const base = onHead(-0.2 + i * 0.12, 0.18, 1.0), tip = base.clone().add(V(-0.05 + i * 0.004, -0.06 - (i % 3) * 0.01, 0.03)); lock(base, base.clone().lerp(tip, 0.4).add(V(0.0, 0.02, 0.02)), tip, 0.02); }
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const b = onHead(s * (1.2 + i * 0.12), 0.55, 1.0), tip = b.clone().add(V(s * 0.012, -0.07 - i * 0.015, 0.012)); lock(b, b.clone().lerp(tip, 0.5), tip, 0.014); }
      const tie = J(hairG, 0, headH * 0.42, -headH * 0.44); add(tie, new T.TorusGeometry(0.032, 0.014, 10, 24), cloth(O.tie || 0x14b3c8, { bumpScale: 1.5 })).rotation.x = 0.9;
      const tail = J(tie, 0, 0, -0.01); swayers.push({ g: tail, k: 0, amp: 0.12 });
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, ox = Math.cos(a) * 0.016, oy = Math.sin(a) * 0.012; const c = new T.CatmullRomCurve3([V(ox, oy, 0), V(ox * 1.6, oy - 0.05, -0.08), V(ox * 1.2 + 0.01, -0.17, -0.1), V(ox * 0.5 + (i % 3 - 1) * 0.02, -0.29, -0.06)]); add(tail, taper(c, 0.022, 0.002, 18, 7, 0.8), i % 4 ? hm : hmDark); }
    } else if (P.hair === 'wavy') {   // Mira: long wavy hair past the shoulders, side part, a pink star clip
      cap(1.05, 0.62, 2.25); cap(1.035, 1.2, 2.6);
      { const prof = []; for (let k = 0; k <= 14; k++) { const t = k / 14; prof.push(new T.Vector2(headW * (0.5 + 0.18 * Math.sin(t * Math.PI * 0.9) + 0.08 * t), headH * 0.48 - t * (headH * 0.5 + 0.3))); }
        const vg = new T.LatheGeometry(prof.map((p) => new T.Vector2(Math.max(p.x, 0.01), p.y)), 64, Math.PI * 0.62, Math.PI * 1.76), vp = vg.attributes.position;
        for (let i = 0; i < vp.count; i++) { const x = vp.getX(i), y = vp.getY(i), z = vp.getZ(i), a = Math.atan2(x, z), w = 1 + 0.035 * Math.sin(a * 7 + y * 18) + 0.02 * Math.sin(y * 30); vp.setXYZ(i, x * w, y, z * w * 0.82 - 0.012); }
        vg.computeVertexNormals(); const vol = add(hairG, vg, hm); vol.material = hm; }
      const strands = 30;
      for (let i = 0; i < strands; i++) {
        const u = Math.PI * 0.55 + (i / (strands - 1)) * Math.PI * 0.9 + (rnd() - 0.5) * 0.08;   // around the back half, ear to ear
        const b = onHead(u, 0.35 + rnd() * 0.2, 1.0), out = V(b.x, 0, b.z).normalize(), len = 0.3 + rnd() * 0.06, pts = [];
        for (let k = 0; k <= 6; k++) { const t = k / 6, w = Math.sin(t * Math.PI * 2.2 + i) * 0.022 * t; pts.push(V(b.x + out.x * (0.02 + t * 0.05) + w * out.z, b.y - t * len, b.z + out.z * (0.02 + t * 0.05) - w * out.x)); }
        const g = taper(new T.CatmullRomCurve3(pts), 0.03 + rnd() * 0.01, 0.014, 24, 10, 0.8); add(hairG, g, rnd() < 0.3 ? hmDark : hm);
      }
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {   // face-framing curls in front of the shoulders
        const b = onHead(s * (1.05 + i * 0.1), 0.55, 1.01), pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push(V(b.x + s * (0.012 + Math.sin(t * 7 + i) * 0.014), b.y - t * (0.26 + i * 0.012), b.z + 0.02 + t * 0.03 - i * 0.008)); }
        add(hairG, taper(new T.CatmullRomCurve3(pts), 0.026, 0.012, 22, 10, 0.85), i % 2 ? hm : hmDark);
      }
      for (let i = 0; i < 8; i++) { const base = onHead(0.5 - i * 0.12, 0.1, 1.0), tip = base.clone().add(V(-0.07 + i * 0.006, -0.05 + i * 0.006, 0.03)); lock(base, base.clone().lerp(tip, 0.45).add(V(0, 0.025, 0.025)), tip, 0.028, hm, 0.85); }   // fringe swept to one side (side part)
      if (P.clip) { const st = new T.Shape(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 0.014 : 0.034; k ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, Math.sin(a) * r); } const clip = add(hairG, new T.ExtrudeGeometry(st, { depth: 0.012, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 }), plastic(P.clip), -headW * 0.4, headH * 0.3, headH * 0.15); clip.rotation.set(0, -0.9, 0.3); }
    }
    if (P.glasses) {   // round purple frames
      const gm = plastic(P.glasses, { roughness: 0.3 });
      for (const e of eyes) { const r = add(headC, new T.TorusGeometry(eyeR * 1.22, 0.0055, 10, 40), gm, e.s * eyeX * 1.02, eyeY, eyeZ + eyeR * 1.25); r.rotation.y = e.s * 0.16; r.scale.y = 0.95; }
      { const br = add(headC, new T.CylinderGeometry(0.004, 0.004, eyeX * 2 - eyeR * 2.4, 8), gm, 0, eyeY + eyeR * 0.35, eyeZ + eyeR * 1.4); br.rotation.z = Math.PI / 2; }
      for (const s of [-1, 1]) { const arm = add(headC, new T.CylinderGeometry(0.0035, 0.0035, headH * 0.42, 6), gm, s * (eyeX + eyeR * 1.25), eyeY + eyeR * 0.3, eyeZ - headH * 0.12); arm.rotation.x = Math.PI / 2; }
    }

    // workers' hair styles
    if (P.hair === 'short') { cap(1.035, 0.8, 2.15); for (let i = 0; i < 9; i++) { const base = onHead(-0.45 + i * 0.11, 0.2, 1.0), tip = base.clone().add(V(0.004, -0.03, 0.025)); lock(base, base.clone().lerp(tip, 0.5).add(V(0, 0.01, 0.01)), tip, 0.022); } }
    else if (P.hair === 'curly') { cap(1.04, 0.85, 2.2); for (let i = 0; i < 70; i++) { const u = rnd() * Math.PI * 2, v = 0.08 + rnd() * 0.5; if (Math.cos(u) > 0.55 && v > 0.35) continue; const b = onHead(u, v, 1.03); add(hairG, new T.SphereGeometry(0.026 + rnd() * 0.012, 10, 8), rnd() < 0.3 ? hmDark : hm, b.x, b.y, b.z); } }
    else if (P.hair === 'buns') {   // two big buns on top (Lulu) with candy clips
      cap(1.04, 0.75, 2.25); cap(1.025, 1.15, 2.45);
      for (const s2 of [-1, 1]) { const b = onHead(s2 * 0.75, 0.22, 1.0); const bun = add(hairG, new T.SphereGeometry(0.075, 24, 18), hm, b.x * 1.05, b.y + 0.05, b.z * 0.6); bun.scale.set(1, 0.95, 1);
        for (let k = 0; k < 6; k++) { const a2 = k / 6 * Math.PI * 2; const sw = add(hairG, new T.TorusGeometry(0.05, 0.012, 6, 16), hmDark, b.x * 1.05, b.y + 0.05, b.z * 0.6); sw.rotation.set(a2, a2 * 0.5, 0); }
        const clip = add(hairG, new T.SphereGeometry(0.022, 12, 10), plastic((P.clips || [0xff6fa6])[s2 > 0 ? 1 : 0] || 0xff6fa6, { roughness: 0.25 }), b.x * 1.25, b.y + 0.01, b.z * 0.8 + 0.03); clip.scale.set(1, 1, 0.6); }
      for (let i = 0; i < 9; i++) { const base = onHead(-0.45 + i * 0.11, 0.17, 1.0), tip = base.clone().add(V(0.004, -0.045, 0.03)); lock(base, base.clone().lerp(tip, 0.5).add(V(0, 0.012, 0.012)), tip, 0.022); }
    } else if (P.hair === 'leafy') {   // Moss: leaves instead of hair
      cap(1.04, 0.8, 2.15, hmDark); const leafM = plastic(P.hairColor, { roughness: 0.55, side: T.DoubleSide }), leafM2 = plastic(new T.Color(P.hairColor).lerp(new T.Color(0xb5e36a), 0.35).getHex(), { roughness: 0.55, side: T.DoubleSide });
      const leafS = new T.Shape(); leafS.moveTo(0, 0); leafS.quadraticCurveTo(0.03, 0.04, 0, 0.1); leafS.quadraticCurveTo(-0.03, 0.04, 0, 0);
      for (let i = 0; i < 70; i++) { const u = rnd() * Math.PI * 2, v = rnd() * 0.55, b = onHead(u, v, 0.98); if (Math.cos(u) > 0.5 && v > 0.32) continue; const lf = add(hairG, new T.ShapeGeometry(leafS), rnd() < 0.5 ? leafM : leafM2, b.x, b.y, b.z); lf.lookAt(b.clone().multiplyScalar(2).add(V(0, 0.1, 0))); lf.rotateX(-1.2 + rnd() * 0.5); lf.scale.setScalar(0.9 + rnd() * 0.6); }
    }
    // hats + head wear
    const HT = P.hat;
    if (HT) {
      const hc = HT.color ?? 0xffffff, hatM = cloth(hc), top = headH * 0.5, zFront = headH * 0.46;
      const dome = (scale = 1.08, h = 0.9, m = hatM) => { const d = add(headC, new T.SphereGeometry(1, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.5), m, 0, headH * 0.06); d.scale.set(headW / 2 * scale, headH / 2 * h, headH * 0.49 * scale); return d; };
      const zBadge = (w, y, z, ring = '#ffd166', inner = '#7c3aed') => decal(headC, EMB.zcircle(ring, inner, ring), w, w, 0, y, z);
      if (HT.kind === 'chef') {
        const band = add(headC, new T.CylinderGeometry(headW * 0.5, headW * 0.49, headH * 0.22, 32, 1, true), cloth(0xffffff, { side: T.DoubleSide }), 0, top * 0.82, -0.005);
        for (let k = 0; k < 7; k++) { const a2 = k / 7 * Math.PI * 2; add(headC, new T.SphereGeometry(headW * 0.24, 18, 14), cloth(0xffffff), Math.sin(a2) * headW * 0.24, top + headH * 0.18, Math.cos(a2) * headW * 0.22 - 0.005); }
        add(headC, new T.SphereGeometry(headW * 0.3, 20, 16), cloth(0xffffff), 0, top + headH * 0.28, 0); zBadge(headH * 0.2, top * 0.82, headW * 0.5 + 0.004); void band;
      } else if (HT.kind === 'cap' || HT.kind === 'striped') {
        const m = HT.kind === 'striped' ? new T.MeshStandardMaterial({ map: canvasTex((g, w, h) => { for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#' + new T.Color(hc).getHexString(); g.fillRect(i * w / 12, 0, w / 12, h); } }, 256, 64), roughness: 0.8 }) : hatM;
        dome(1.1, 0.95, m); const visor = add(headC, new T.CylinderGeometry(headW * 0.42, headW * 0.42, 0.012, 24, 1, false, -Math.PI / 2, Math.PI), HT.kind === 'striped' ? cloth(hc) : hatM, 0, headH * 0.16, headH * 0.32); visor.rotation.x = 0.15; visor.scale.z = 0.8;
        add(headC, new T.SphereGeometry(0.014, 8, 6), hatM, 0, top + headH * 0.04, 0); zBadge(headH * 0.2, headH * 0.33, zFront * 1.0);
      } else if (HT.kind === 'police') {
        const crown = add(headC, new T.CylinderGeometry(headW * 0.58, headW * 0.5, headH * 0.24, 32), hatM, 0, top * 0.95, -0.01); crown.rotation.x = -0.12;
        add(headC, new T.CylinderGeometry(headW * 0.51, headW * 0.51, headH * 0.06, 32), plastic(0x111827), 0, top * 0.78, -0.005);
        const visor = add(headC, new T.CylinderGeometry(headW * 0.4, headW * 0.4, 0.012, 24, 1, false, -Math.PI / 2, Math.PI), plastic(0x111827, { roughness: 0.25 }), 0, headH * 0.26, headH * 0.34); visor.rotation.x = 0.25; visor.scale.z = 0.7;
        decal(headC, EMB.badge(), headH * 0.18, headH * 0.18, 0, top * 0.98, headW * 0.56);
      } else if (HT.kind === 'beanie') { dome(1.1, 1.05); const fold = add(headC, new T.TorusGeometry(headW * 0.53, 0.02, 10, 36), cloth(new T.Color(hc).multiplyScalar(0.85).getHex()), 0, headH * 0.12, 0); fold.rotation.x = Math.PI / 2; fold.scale.y = 0.98; zBadge(headH * 0.18, headH * 0.27, zFront * 1.04); }
      else if (HT.kind === 'bandana') { dome(1.08, 0.88); for (const s2 of [-1, 1]) { const kn = add(headC, new T.SphereGeometry(0.03, 12, 10), hatM, s2 * 0.025, headH * 0.15, -headH * 0.5); kn.scale.set(1.2, 0.8, 0.7); } zBadge(headH * 0.16, headH * 0.3, zFront * 1.02, '#ffffff', '#0e7490'); }
      else if (HT.kind === 'bow') { const band = add(headC, new T.TorusGeometry(headW * 0.5, 0.012, 8, 36, Math.PI), cloth(hc), 0, headH * 0.22, -0.01); band.rotation.set(-0.3, 0, 0); for (const s2 of [-1, 1]) { const lp = add(headC, new T.SphereGeometry(0.045, 14, 10), cloth(hc), -headW * 0.32 + s2 * 0.04, top * 0.86, headH * 0.12); lp.scale.set(1.2, 0.8, 0.45); } add(headC, new T.SphereGeometry(0.018, 10, 8), cloth(new T.Color(hc).multiplyScalar(0.8).getHex()), -headW * 0.32, top * 0.86, headH * 0.15); }
      else if (HT.kind === 'goggles') { const band = add(headC, new T.TorusGeometry(headW * 0.52, 0.012, 8, 40), cloth(hc), 0, headH * 0.3, 0); band.rotation.x = Math.PI / 2 - 0.25; for (const s2 of [-1, 1]) { const ln = add(headC, new T.CylinderGeometry(0.04, 0.04, 0.03, 20), plastic(0x8a6a3a, { metalness: 0.5, roughness: 0.3 }), s2 * 0.05, headH * 0.36, headH * 0.4); ln.rotation.x = Math.PI / 2 - 0.4; const gl2 = add(headC, new T.CircleGeometry(0.032, 20), new T.MeshPhysicalMaterial({ color: 0x9fd8ff, roughness: 0.05, clearcoat: 1 }), s2 * 0.05, headH * 0.37, headH * 0.42); gl2.rotation.x = -0.4; } }
    }
    if (P.mustache) for (const s2 of [-1, 1]) { const mu = add(headC, new T.SphereGeometry(1, 16, 12), hairMat(P.mustache), s2 * headW * 0.075, -headH * 0.165, headH * 0.445); mu.scale.set(headW * 0.085, headH * 0.04, headH * 0.04); mu.rotation.z = s2 * 0.25; }

    // ---------- neck + torso ----------
    add(neck, new T.CylinderGeometry(0.042 * B ** 0.5, 0.047 * B ** 0.5, 0.07, 20), skin, 0, 0.0, 0);
    const prof = (k = 1) => [[hipW * 1.0 * k, -0.02], [hipW * 1.02 * k, torsoH * 0.12], [shW * 0.72 * k, torsoH * 0.45], [shW * 0.86 * k, torsoH * 0.78], [shW * 0.82 * k, torsoH * 0.92], [0.05 * k, torsoH * 1.0]];
    const TZ = chestD / (shW * 0.86);   // depth squash
    const topG = (k, phiS = 0, phiL = Math.PI * 2) => { const g = lathe(prof(k), 1, TZ, 48, phiS, phiL); g.translate(0, -torsoH * 0.5, 0); return g; };
    const torsoGrp = J(chest, 0, 0, 0);
    // garments
    const topM = cloth(O.top), top2M = cloth(O.top2 || O.top), teeM = cloth(O.tee || O.top), trimM = cloth(O.trim || O.top2 || O.top);
    const frontZ = chestD * 1.02;
    const kind = detective ? 'detective' : O.kind;
    if (kind === 'worker') {   // shirt + apron / overalls / lab coat / blazer / uniform
      add(torsoGrp, topG(1.0), topM);
      const zDecal = (w, x, y, z, ring = '#ffd166', inner = '#7c3aed') => decal(torsoGrp, EMB.zcircle(ring, inner, ring), w, w, x, y, z);
      if (O.apron) { const am = cloth(O.apron); add(torsoGrp, roundBox(shW * 1.15, torsoH * 0.62, 0.014, 0.012), am, 0, -torsoH * 0.12, frontZ * 1.06); for (const s2 of [-1, 1]) { const st = add(torsoGrp, new T.CylinderGeometry(0.006, 0.006, torsoH * 0.35, 6), am, s2 * shW * 0.42, torsoH * 0.33, frontZ * 0.85); st.rotation.set(-0.35, 0, s2 * 0.25); } zDecal(0.07, 0, torsoH * 0.02, frontZ * 1.11, '#ffd166', '#' + new T.Color(O.apron).multiplyScalar(0.7).getHexString()); }
      if (O.overalls) { const om = cloth(O.overalls); add(torsoGrp, roundBox(shW * 1.0, torsoH * 0.5, 0.016, 0.012), om, 0, -torsoH * 0.2, frontZ * 1.05); for (const s2 of [-1, 1]) { const st = taper(curve3([s2 * shW * 0.4, torsoH * 0.06, frontZ * 1.05], [s2 * shW * 0.55, torsoH * 0.5, frontZ * 0.6], [s2 * shW * 0.5, torsoH * 0.48, -chestD * 0.8], [s2 * shW * 0.35, -torsoH * 0.1, -chestD * 1.05]), 0.014, 0.013, 16, 6, 0.4); add(torsoGrp, st, om); add(torsoGrp, new T.SphereGeometry(0.009, 8, 6), plastic(0xfacc15, { metalness: 0.5 }), s2 * shW * 0.4, torsoH * 0.04, frontZ * 1.1); } zDecal(0.065, 0, -torsoH * 0.18, frontZ * 1.1); }
      if (O.coat) { const cm = cloth(0xffffff, { side: T.DoubleSide }); const coat = add(spine, lathe([[hipW * 1.32, -legLen * 0.3], [hipW * 1.22, -0.02], [hipW * 1.12, torsoH * 0.12], [shW * 0.8, torsoH * 0.5], [shW * 0.92, torsoH * 0.82], [shW * 0.86, torsoH * 0.95], [0.06, torsoH * 1.02]], 1, TZ * 1.12, 48, 0.5, Math.PI * 2 - 1.0), cm); void coat; decal(torsoGrp, EMB.zcircle('#ffd166', '#7c3aed', '#ffd166'), 0.035, 0.035, -shW * 0.6, torsoH * 0.22, frontZ * 1.12, -0.4); }
      if (O.blazer) { const bm = cloth(O.blazer, { side: T.DoubleSide }); add(torsoGrp, topG(1.08, 0.55, Math.PI * 2 - 1.1), bm); for (const s2 of [-1, 1]) { const lap = add(torsoGrp, new T.BoxGeometry(0.04, torsoH * 0.42, 0.01), cloth(new T.Color(O.blazer).multiplyScalar(0.8).getHex()), s2 * 0.045, torsoH * 0.18, frontZ * 1.08); lap.rotation.set(-0.08, s2 * -0.4, s2 * 0.3); } decal(torsoGrp, EMB.zcircle('#ffd166', '#3b0764', '#ffd166'), 0.035, 0.035, -shW * 0.6, torsoH * 0.22, frontZ * 1.06, -0.4); }
      if (O.uniform) { for (const s2 of [-1, 1]) add(torsoGrp, roundBox(0.055, 0.04, 0.008, 0.004), cloth(new T.Color(O.top).multiplyScalar(0.75).getHex()), s2 * shW * 0.45, torsoH * 0.18, frontZ * 1.0); decal(torsoGrp, EMB.badge(), 0.045, 0.045, -shW * 0.45, torsoH * 0.26, frontZ * 1.04, -0.3); decal(torsoGrp, EMB.zcircle('#ffd166', '#1e3a8a', '#ffd166'), 0.035, 0.035, shW * 0.45, torsoH * 0.27, frontZ * 1.03, 0.3); }
      if (O.tie) { add(torsoGrp, new T.SphereGeometry(0.011, 10, 8), cloth(O.tie), 0, torsoH * 0.42, frontZ * 0.98); }
      if (P.scarf) { const sc = add(neck, new T.ConeGeometry(0.06, 0.08, 4), cloth(P.scarf), 0, -0.03, 0.035); sc.rotation.set(Math.PI + 0.3, Math.PI / 4, 0); sc.scale.z = 0.4; const kn = add(neck, new T.TorusGeometry(0.048, 0.015, 8, 20), cloth(P.scarf), 0, 0.0, 0); kn.rotation.x = Math.PI / 2; }
    } else if (kind === 'hoodie' || kind === 'detective') {
      add(torsoGrp, topG(kind === 'detective' ? 1.0 : 1.06), kind === 'detective' ? cloth(0xffffff) : topM);
    } else {
      add(torsoGrp, topG(1.0), teeM);   // tee underneath the open jacket / hoodie
    }
    if (kind === 'hoodie') {
      { const _m = add(torsoGrp, new T.TorusGeometry(hipW * 1.0, 0.016, 10, 40), trimM, 0, -torsoH * 0.5 + 0.012, 0); _m.scale.set(1.06, TZ * 1.06, 1); _m.rotation.x = Math.PI / 2; }
      const hood = add(torsoGrp, new T.TorusGeometry(0.075, 0.032, 14, 32), topM, 0, torsoH * 0.44, -0.035); hood.rotation.x = Math.PI / 2 + 0.25; hood.scale.set(1.3, 1, 1);
      const back = add(torsoGrp, new T.SphereGeometry(0.07, 20, 14), topM, 0, torsoH * 0.38, -chestD * 0.95); back.scale.set(1.6, 0.9, 0.6);
      const pocket = add(torsoGrp, roundBox(shW * 1.1, torsoH * 0.22, 0.012, 0.01), top2M, 0, -torsoH * 0.22, frontZ * 1.0); pocket.rotation.x = -0.05;
      for (const s of [-1, 1]) add(torsoGrp, new T.CylinderGeometry(0.004, 0.004, torsoH * 0.28, 6), cloth(O.trim || 0xffffff), s * 0.022, torsoH * 0.22, frontZ * 0.98).rotation.x = 0.1;
      if (O.zip) add(torsoGrp, new T.BoxGeometry(0.007, torsoH * 0.9, 0.006), plastic(0xd1d5db, { metalness: 0.6 }), 0, 0, frontZ * 0.995);
      const em = O.emblem === 'kai' ? EMB.zcircle('#ffd166', '#1e5fd0', '#ffd166') : O.emblem === 'mira' ? EMB.letter('M', '#ffffff', null, 'Georgia, serif') : null;
      if (em) decal(torsoGrp, em, O.emblem === 'mira' ? 0.13 : 0.075, O.emblem === 'mira' ? 0.13 : 0.075, O.emblem === 'kai' ? 0.045 : 0, O.emblem === 'kai' ? torsoH * 0.22 : torsoH * 0.12, frontZ * 1.03);
    }
    if (kind === 'hoodie_open' || kind === 'jacket' || kind === 'jacket_jax') {
      const gap = kind === 'jacket_jax' ? 0.55 : 0.75, jk = add(torsoGrp, topG(1.08, gap / 2 + Math.PI * 0, Math.PI * 2 - gap), topM); jk.rotation.y = 0;   // open at the front (+z)
      jk.material = topM; jk.material.side = T.DoubleSide;
      for (const s of [-1, 1]) { const ed = add(torsoGrp, new T.BoxGeometry(0.016, torsoH * 0.92, 0.012), kind === 'hoodie_open' ? top2M : trimM.clone(), s * Math.sin(gap / 2) * shW * 0.86, 0, frontZ * 1.04); ed.material = kind === 'jacket' ? cloth(0xffffff) : top2M; ed.rotation.z = s * 0.05; }
      { const _m = add(torsoGrp, new T.TorusGeometry(hipW * 1.05, 0.016, 10, 40), kind === 'jacket' ? cloth(0xf3eadb) : top2M, 0, -torsoH * 0.5 + 0.012, 0); _m.scale.set(1.06, TZ * 1.06, 1); _m.rotation.x = Math.PI / 2; }
      // collar / hood
      const collar = add(torsoGrp, new T.TorusGeometry(0.07, kind === 'hoodie_open' ? 0.03 : 0.022, 12, 32), kind === 'jacket_jax' ? top2M : kind === 'jacket' ? cloth(0xf3eadb) : topM, 0, torsoH * 0.46, -0.01); collar.rotation.x = Math.PI / 2 + 0.3; collar.scale.set(1.25, 1, 1);
      if (kind === 'hoodie_open') { const back = add(torsoGrp, new T.SphereGeometry(0.07, 20, 14), topM, 0, torsoH * 0.38, -chestD * 0.95); back.scale.set(1.6, 0.9, 0.6); }
      // tee print
      const te = O.teeEmblem === 'bolt' ? EMB.bolt() : O.teeEmblem === 'tgeo' ? EMB.tgeo() : null;
      if (te) decal(torsoGrp, te, 0.1, 0.1, 0, torsoH * 0.12, frontZ * 1.0);
      if (kind === 'jacket') decal(torsoGrp, EMB.letter('R', '#ffffff', '#c2410c', 'Arial Black, Arial'), 0.04, 0.04, -shW * 0.55, torsoH * 0.22, frontZ * 0.92, -0.35);
      if (kind === 'hoodie_open') decal(torsoGrp, EMB.zcircle('#ffd166', '#7b2fbe', '#ffd166'), 0.035, 0.035, -shW * 0.58, torsoH * 0.22, frontZ * 0.9, -0.35);
      if (kind === 'jacket_jax' && O.patch) decal(torsoGrp, EMB.shieldJ(), 0.05, 0.05, shW * 0.62, torsoH * 0.2, frontZ * 0.88, 0.4);
    }
    if (kind === 'detective') {   // waistcoat + tie under a long trench coat (built on the hips so it hangs to the knees)
      const vest = add(torsoGrp, topG(1.03, 0.55, Math.PI * 2 - 1.1), cloth(0x3a3330)); vest.material.side = T.DoubleSide;
      for (let i = 0; i < 3; i++) add(torsoGrp, new T.SphereGeometry(0.006, 8, 6), plastic(0x1f1a17), 0.012, -torsoH * 0.05 - i * 0.04, frontZ * 1.0);
      const tie = DETECTIVE_TIE[id] || 0x7c3aed; add(torsoGrp, new T.SphereGeometry(0.011, 10, 8), cloth(tie), 0, torsoH * 0.42, frontZ * 0.98); const bl = add(torsoGrp, new T.CylinderGeometry(0.009, 0.02, torsoH * 0.38, 4), cloth(tie), 0, torsoH * 0.22, frontZ * 1.02); bl.scale.z = 0.35;
      decal(torsoGrp, EMB.badge(), 0.032, 0.032, -shW * 0.58, torsoH * 0.22, frontZ * 1.18, -0.3);
    }
    // backpack (not with the trench coat)
    if (O.pack && !detective) {
      const pk = J(torsoGrp, 0, torsoH * 0.05, -chestD * 1.05 - 0.05);
      add(pk, roundBox(shW * 1.25, torsoH * 0.82, 0.1, 0.04), plastic(O.pack, { roughness: 0.7 }));
      add(pk, roundBox(shW * 0.95, torsoH * 0.36, 0.035, 0.02), plastic(O.pack2 || new T.Color(O.pack).multiplyScalar(0.8).getHex(), { roughness: 0.7 }), 0, -torsoH * 0.12, -0.055);
      const pe = O.packEmblem === 'bolt' ? EMB.bolt() : O.packEmblem === 'kai' ? EMB.zcircle('#ffd166', '#243447', '#ffd166') : O.packEmblem === 'mira' ? EMB.letter('M', '#ffb6d1', null, 'Georgia, serif', '#ff6fa6') : O.packEmblem === 'tara' ? EMB.letter('T', '#ffd166', '#2d3047', 'Arial Black, Arial') : null;
      if (pe) { const d = decal(pk, pe, 0.09, 0.09, 0, torsoH * 0.08, -0.052); d.rotation.y = Math.PI; }
      for (const s of [-1, 1]) { const st = taper(curve3([s * shW * 0.45, torsoH * 0.38, 0.05], [s * shW * 0.55, torsoH * 0.5, 0.11], [s * shW * 0.62, torsoH * 0.2, chestD * 2.05], [s * shW * 0.55, -torsoH * 0.25, chestD * 2.1]), 0.012, 0.011, 16, 6, 0.35); add(pk, st, plastic(new T.Color(O.pack).multiplyScalar(0.7).getHex(), { roughness: 0.75 })); }
    }

    // ---------- arms ----------
    const upperL = 0.16 * (H / 1.35), foreL = 0.14 * (H / 1.35), armR0 = 0.033 * B ** 1.0, sleeveM = kind === 'jacket' ? cloth(O.top2) : kind === 'detective' ? cloth(0xc9a774) : kind === 'worker' && O.coat ? cloth(0xffffff) : kind === 'worker' && O.blazer ? cloth(O.blazer) : topM;
    function limb(r0, r1, L, m, seg = 24) { const g = new T.CapsuleGeometry((r0 + r1) / 2, L, 8, seg); g.translate(0, -L / 2, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = clamp(-p.getY(i) / L, 0, 1), s = lerp(r0, r1, k) / ((r0 + r1) / 2); p.setX(i, p.getX(i) * s); p.setZ(i, p.getZ(i) * s); } g.computeVertexNormals(); return g; }
    function makeArm(s) {
      const sh = J(chest, s * shW * 0.95, torsoH * 0.36, 0);
      const upper = J(sh); add(upper, limb(armR0 * 1.25, armR0 * 1.05, upperL, sleeveM), sleeveM); add(upper, new T.SphereGeometry(armR0 * 1.35, 20, 14), sleeveM).scale.set(1, 1.05, 1);
      const fore = J(upper, 0, -upperL, 0); add(fore, new T.SphereGeometry(armR0 * 1.08, 16, 12), sleeveM);
      add(fore, limb(armR0 * 1.06, armR0 * 0.98, foreL * 0.82, sleeveM), sleeveM);
      const cuffM = kind === 'worker' ? sleeveM : kind === 'hoodie' || kind === 'hoodie_open' ? trimM : kind === 'jacket' ? cloth(0xff6a00) : kind === 'detective' ? cloth(0xb08d5a) : top2M;
      add(fore, new T.CylinderGeometry(armR0 * 1.02, armR0 * 1.0, 0.03, 18), cuffM, 0, -foreL * 0.82, 0);
      // hand: soft palm, four fingers, thumb
      const hand = J(fore, 0, -foreL * 0.95, 0), handM = O.gloves && !detective ? cloth(O.gloves) : skin;
      const palm = add(hand, new T.SphereGeometry(1, 20, 14), handM, 0, -0.03, 0); palm.scale.set(0.042, 0.045, 0.021);
      const fingers = J(hand, 0, -0.06, 0);
      for (let k = 0; k < 4; k++) { const f = J(fingers, (k - 1.5) * 0.0145 * -s, 0, 0.002); add(f, new T.CapsuleGeometry(0.0072, 0.022 - Math.abs(k - 1.5) * 0.003, 4, 8), skin, 0, -0.012, 0); f.rotation.x = 0.35; }
      const thumb = J(hand, s * -0.028, -0.025, 0.01); add(thumb, new T.CapsuleGeometry(0.008, 0.02, 4, 8), skin, 0, -0.012, 0); thumb.rotation.set(0.3, 0, s * 0.8);
      if (O.watch && s === -1 && !detective) { const w = add(fore, new T.CylinderGeometry(armR0 * 1.08, armR0 * 1.08, 0.016, 18), plastic(O.watch), 0, -foreL * 0.74, 0); const face = add(fore, roundBox(0.024, 0.026, 0.012, 0.004), plastic(0x0f172a, { emissive: 0x2563eb, emissiveIntensity: 0.25 }), 0, -foreL * 0.74, armR0 * 1.1); face.castShadow = false; }
      if (O.band && s === 1) add(fore, new T.CylinderGeometry(armR0 * 1.08, armR0 * 1.08, 0.015, 18), plastic(O.band), 0, -foreL * 0.72, 0);
      if (O.bracelet && s === 1) for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; add(fore, new T.SphereGeometry(0.0055, 8, 6), plastic([0xff6fa6, 0xffd166, 0x7b61ff, 0x6ec1ff][k % 4]), Math.cos(a) * armR0 * 1.05, -foreL * 0.74, Math.sin(a) * armR0 * 1.05); }
      const grip = J(hand, 0, -0.055, 0.02);
      return { sh, upper, fore, hand, fingers, thumb, grip, finger: null };
    }
    const armL = makeArm(-1), armR = makeArm(1);
    // pointing finger (index stays straight when pointing)
    for (const A of [armL, armR]) A.finger = A.fingers.children[0];

    // ---------- legs ----------
    const thighL = legLen * 0.47, shinL = legLen * 0.4, legR0 = 0.05 * B ** 0.95;
    const pantsM = O.bottom.startsWith('jeans') ? denim(O.pants) : cloth(O.pants);
    const pelvisM = detective ? cloth(0x2b2a2e) : pantsM;
    const pelvis = add(hips, lathe([[0.01, -0.07], [hipW * 0.9, -0.06], [hipW * 1.0, 0.0], [hipW * 1.0, 0.04]], 1, TZ * 1.05, 40), pelvisM); pelvis.position.y = -0.01;
    if (O.belt && !detective) { { const _m = add(hips, new T.TorusGeometry(hipW * 1.0, 0.012, 8, 40), cloth(O.belt), 0, 0.028, 0); _m.scale.set(1.02, TZ * 1.08, 1); _m.rotation.x = Math.PI / 2; } const bk = add(hips, roundBox(0.045, 0.034, 0.01, 0.004), plastic(0x8a6a3a, { metalness: 0.6, roughness: 0.35 }), 0, 0.028, hipW * TZ * 1.08 + 0.004); if (O.buckle) decal(hips, EMB.letter(O.buckle, '#3b2416', null, 'Georgia'), 0.026, 0.026, 0, 0.028, hipW * TZ * 1.08 + 0.01); }
    function makeLeg(s) {
      const hip = J(hips, s * hipW * 0.5, -0.03, 0), thigh = J(hip), shin = J(thigh, 0, -thighL, 0), foot = J(shin, 0, -shinL, 0);
      const short = !detective && O.bottom === 'shorts', pm = detective ? cloth(0x2b2a2e) : pantsM;
      add(thigh, limb(legR0 * 1.18, legR0 * 1.02, thighL, pm), pm);
      add(shin, new T.SphereGeometry(legR0 * (short ? 0.82 : 1.02), 16, 12), short ? skin : pm);
      add(shin, limb(short ? legR0 * 0.78 : legR0 * 1.0, short ? legR0 * 0.62 : legR0 * 0.98, shinL * 0.86, short ? skin : pm), short ? skin : pm);
      if (short) add(thigh, new T.CylinderGeometry(legR0 * 1.22, legR0 * 1.25, 0.03, 18), pm, 0, -thighL * 0.82, 0);
      if (!detective && (O.bottom === 'cargo' || O.bottom === 'shorts')) { const pk = add(thigh, roundBox(0.022, 0.07, 0.05, 0.008), pm, s * legR0 * 1.1, -thighL * 0.55, 0); if (O.stitch) { const st = add(thigh, new T.BoxGeometry(0.003, 0.06, 0.04), cloth(O.stitch), s * legR0 * 1.24, -thighL * 0.55, 0); st.castShadow = false; } }
      if (!detective && O.bottom === 'jeans_rolled') { add(shin, new T.CylinderGeometry(legR0 * 1.12, legR0 * 1.1, 0.04, 18), denim(new T.Color(O.pants).lerp(new T.Color(0xffffff), 0.35).getHex()), 0, -shinL * 0.8, 0); if (O.patch && s === 1) { const hp2 = decal(shin, EMB.letter('♥', '#' + new T.Color(O.patch).getHexString(), null, 'Arial'), 0.05, 0.05, 0, -0.01, legR0 * 1.0); hp2.rotation.x = -0.1; } }
      // shoe: chunky sole, coloured upper, white toe, laces (Jax: boots)
      const sh = J(foot, 0, -0.005, 0.03), soleM = plastic(O.boots ? 0x2b1a12 : 0xf8f8f8, { roughness: 0.6 }), upM = cloth(O.shoe, { roughness: 0.6 }), up2M = cloth(O.shoe2, { roughness: 0.6 });
      const L = O.boots ? 0.21 : 0.2, Wd = O.boots ? 0.095 : 0.085;
      add(sh, roundBox(Wd * 1.04, 0.026, L, 0.012), soleM, 0, -0.063, 0.0);
      const upper = add(sh, roundBox(Wd * 0.94, 0.06, L * 0.86, 0.026), upM, 0, -0.025, -0.012);
      const toe = add(sh, new T.SphereGeometry(1, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), O.boots ? upM : soleM, 0, -0.055, L * 0.28); toe.scale.set(Wd * 0.46, 0.035, L * 0.24); toe.rotation.x = -Math.PI / 2 + 0.25;
      const collarH = O.hightop || O.boots ? 0.085 : 0.05; add(sh, new T.CylinderGeometry(legR0 * 1.15, legR0 * 1.25, collarH, 18), O.boots ? up2M : upM, 0, -0.01 + collarH * 0.4, -0.03);
      for (let k = 0; k < 4; k++) add(sh, new T.BoxGeometry(Wd * 0.45, 0.006, 0.008), plastic(0xffffff), 0, -0.002 - k * 0.008, 0.02 + k * 0.017).rotation.x = -0.6;
      if (O.stripe) { const stp = add(sh, new T.BoxGeometry(0.004, 0.012, L * 0.55), plastic(O.stripe), s * Wd * 0.5, -0.035, 0); stp.rotation.x = -0.25; }
      if (!O.boots) { const swoosh = add(sh, new T.BoxGeometry(0.004, 0.014, L * 0.4), up2M, -s * Wd * 0.5, -0.04, -0.01); swoosh.rotation.x = 0.3; }
      return { hip, thigh, shin, foot };
    }
    const legL = makeLeg(-1), legR = makeLeg(1);
    // trench coat (detective): long open coat with lapels and a belt, hanging from the shoulders
    if (detective) {
      const coatM = cloth(0xc9a774, { side: T.DoubleSide }), coatG = lathe([[hipW * 1.5, -legLen * 0.55], [hipW * 1.32, -0.02], [hipW * 1.15, torsoH * 0.12], [shW * 0.78, torsoH * 0.5], [shW * 0.92, torsoH * 0.82], [shW * 0.86, torsoH * 0.95], [0.06, torsoH * 1.02]], 1, TZ * 1.12, 48, 0.42, Math.PI * 2 - 0.84);
      const coat = add(spine, coatG, coatM); coat.position.y = 0.0;
      for (const s of [-1, 1]) { const lap = add(chest, new T.BoxGeometry(0.05, torsoH * 0.5, 0.01), cloth(0xb8955f), s * 0.05, torsoH * 0.18, frontZ * 1.12); lap.rotation.set(-0.1, s * -0.4, s * 0.35); }
      { const _m = add(spine, new T.TorusGeometry(hipW * 1.22, 0.014, 8, 40), cloth(0xa9864f), 0, 0.05, 0); _m.scale.set(1.04, TZ * 1.12, 1); _m.rotation.x = Math.PI / 2; }
      for (let i = 0; i < 2; i++) for (const s of [-1, 1]) add(spine, new T.SphereGeometry(0.008, 8, 6), plastic(0x5a4026), s * 0.06, torsoH * (0.2 - i * 0.18), frontZ * 1.16);
    }

    // ---------- animation (same clip names as the other casts, plus a few from the sheets) ----------
    const upD = V(0, -1, 0), tmpQ = new T.Quaternion(), mtx = new T.Matrix4();
    function ik(A, target, pole) {   // two-bone IK in chest space → [rx, ry, rz, bend]
      const S = A.sh.position.clone(), d = target.clone().sub(S), dist = clamp(d.length(), 0.02, (upperL + foreL) * 0.995), dir = d.normalize();
      const a = Math.acos(clamp((upperL * upperL + dist * dist - foreL * foreL) / (2 * upperL * dist), -1, 1)), bend = Math.PI - Math.acos(clamp((upperL * upperL + foreL * foreL - dist * dist) / (2 * upperL * foreL), -1, 1));
      const pp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize(), axis = dir.clone().cross(pp).normalize();
      const upDir = dir.clone().applyAxisAngle(axis, -a);   // rotate away from the pole side for the elbow
      const ylocal = upDir.clone().negate(), zlocal = pp.clone().sub(ylocal.clone().multiplyScalar(pp.dot(ylocal))).normalize(), xlocal = ylocal.clone().cross(zlocal).normalize();
      mtx.makeBasis(xlocal, ylocal, zlocal); tmpQ.setFromRotationMatrix(mtx); const e = new T.Euler().setFromQuaternion(tmpQ, 'XYZ'); return [e.x, e.y, e.z, -bend];
    }
    const chin = V(0, torsoH * 0.5 + 0.05, chestD * 1.4), IKP = {
      thinkR: ik(armR, chin.clone().add(V(0.015, 0, 0.02)), V(0.5, -1, 0.4)),
      crossR: ik(armR, V(-shW * 0.55, torsoH * 0.2, chestD * 1.35), V(1, -0.6, 0.2)), crossL: ik(armL, V(shW * 0.55, torsoH * 0.14, chestD * 1.6), V(-1, -0.6, 0.2)),
      hipR: ik(armR, V(hipW * 1.15, -torsoH * 0.38, chestD * 0.3), V(1, -0.2, -0.4)), hipL: ik(armL, V(-hipW * 1.15, -torsoH * 0.38, chestD * 0.3), V(-1, -0.2, -0.4)),
      countR: ik(armR, V(0.03, torsoH * 0.0, chestD * 2.6), V(0.8, -1, 0)), countL: ik(armL, V(-0.03, torsoH * 0.0, chestD * 2.6), V(-0.8, -1, 0)),
      shieldR: ik(armR, V(0.03, torsoH * 0.5 + headH * 0.75, chestD * 2.2), V(1, 0, 0.3)),
      chinL: ik(armL, chin.clone().add(V(-0.01, -0.02, 0.02)), V(-0.5, -1, 0.4)),
    };
    const A0R = [0.05, 0, 0.18, -0.2], A0L = [0.05, 0, -0.18, -0.2];
    const zero = () => ({ y: 0, rx: 0, ry: 0, rz: 0, sx: 0, sy: 0, hx: 0, hy: 0, hz: 0, aL: A0L.slice(), aR: A0R.slice(), tL: [0, 0], tR: [0, 0], sit: 0, pointR: 0, pointL: 0, thumbR: 0, fist: 0, peaceR: 0 });
    const CLIPS = {
      idle(t, p) { const b = Math.sin(t * 2); p.y = b * 0.004; p.sx = b * 0.012; p.hy = Math.sin(t * 0.45) * 0.1; p.hx = Math.sin(t * 0.33) * 0.03; p.aL[2] = -0.18 - b * 0.02; p.aR[2] = 0.18 + b * 0.02; },
      talk(t, p) { CLIPS.idle(t, p); p.hx += Math.sin(t * 5) * 0.035; p.hz = Math.sin(t * 2.3) * 0.05; p.aR = [-0.55 - Math.max(0, Math.sin(t * 2.2)) * 0.35, 0.1, 0.3, -1.0]; },
      walk(t, p) { const w = t * 6.5, s = Math.sin(w), c = Math.abs(Math.cos(w)); p.y = c * 0.02; p.rz = s * 0.03; p.ry = s * 0.06; p.tL = [s * 0.55, s > 0 ? 0 : -s * 0.9]; p.tR = [-s * 0.55, s < 0 ? 0 : s * 0.9]; p.aL = [-s * 0.5, 0, -0.12, -0.35]; p.aR = [s * 0.5, 0, 0.12, -0.35]; },
      run(t, p) { const w = t * 10, s = Math.sin(w), c = Math.abs(Math.cos(w)); p.y = c * 0.05; p.rx = 0.15; p.ry = s * 0.1; p.tL = [s * 0.95, 0.3 + Math.max(0, -s) * 1.3]; p.tR = [-s * 0.95, 0.3 + Math.max(0, s) * 1.3]; p.aL = [-s * 0.9, 0, -0.2, -1.4]; p.aR = [s * 0.9, 0, 0.2, -1.4]; },
      wave(t, p) { CLIPS.idle(t, p); p.aR = [-0.3, 0, 2.5, -0.5 + Math.sin(t * 9) * 0.35]; p.hz = -0.08; },
      think(t, p) { CLIPS.idle(t, p); p.aR = IKP.thinkR.slice(); p.hz = 0.1; p.hx = -0.1; },
      cheer(t, p) { const j = Math.max(0, Math.sin(t * 6)); p.y = j * 0.12; p.aL = [0, 0, -2.7, -0.3]; p.aR = [0, 0, 2.7, -0.3]; p.tL = [j * 0.4, j * 0.8]; p.tR = [j * 0.4, j * 0.8]; p.fist = 1; },
      count(t, p) { CLIPS.idle(t, p); p.aR = IKP.countR.slice(); p.aL = IKP.countL.slice(); p.hx = 0.25; p.aR[3] += Math.sin(t * 6) * 0.1; },
      point(t, p) { CLIPS.idle(t, p); p.aR = [-1.45, 0.1, 0.2, -0.1]; p.pointR = 1; },
      give(t, p) { CLIPS.idle(t, p); p.aR = [-1.0, 0, 0.12, -0.4]; p.hx = 0.05; },
      arms_crossed(t, p) { CLIPS.idle(t, p); p.aR = IKP.crossR.slice(); p.aL = IKP.crossL.slice(); p.hx = -0.06; p.fist = 1; },
      hands_on_hips(t, p) { CLIPS.idle(t, p); p.aR = IKP.hipR.slice(); p.aL = IKP.hipL.slice(); p.hy *= 0.5; p.fist = 1; },
      hip_point_front(t, p) { CLIPS.idle(t, p); p.aL = IKP.hipL.slice(); p.aR = [-1.45, 0, 0.15, -0.05]; p.pointR = 1; p.hy = -0.05; },
      hip_point_up(t, p) { CLIPS.idle(t, p); p.aL = IKP.hipL.slice(); p.aR = [-0.3, 0, 2.7, -0.1]; p.pointR = 1; p.hx = -0.18; },
      hip_point_side(t, p) { CLIPS.idle(t, p); p.aL = IKP.hipL.slice(); p.aR = [-0.1, 0, 1.55, -0.05]; p.pointR = 1; p.hy = 0.35; },
      thumbs_up(t, p) { CLIPS.idle(t, p); p.aR = [-0.9, 0, 0.35, -1.6]; p.thumbR = 1; p.fist = 1; p.hz = -0.06; },
      peace(t, p) { CLIPS.idle(t, p); p.aR = [-0.35, 0, 0.45, -2.2]; p.peaceR = 1; p.hz = -0.06; },
      jump(t, p) { const k = (t * 1.6) % 1, j = Math.sin(k * Math.PI); p.y = j * 0.25; p.aL = [0, 0, -2.6, -0.2]; p.aR = [0, 0, 2.6, -0.2]; p.tL = [0.6 * j, 1.2 * j]; p.tR = [0.3 * j, 0.9 * j]; },
      look_far(t, p) { CLIPS.idle(t, p); p.aR = IKP.shieldR.slice(); p.hx = -0.08; p.hy = 0.15; },
      hand_on_chin(t, p) { CLIPS.idle(t, p); p.aL = IKP.chinL.slice(); p.hz = -0.08; },
      victory(t, p) { CLIPS.idle(t, p); p.aR = [0, 0, 2.6, -0.2]; p.fist = 1; p.y = Math.max(0, Math.sin(t * 5)) * 0.03; p.hz = -0.06; },
      // work clips (factory workers)
      stir(t, p) { CLIPS.idle(t, p); const a2 = t * 3.2; p.aR = [-1.05 + Math.sin(a2) * 0.2, 0, 0.25 + Math.cos(a2) * 0.2, -0.8]; p.aL = [-1.0 + Math.sin(a2) * 0.2, 0, -0.25 + Math.cos(a2) * 0.2, -0.8]; p.rz = Math.sin(a2) * 0.04; p.hx = 0.18; p.fist = 1; },
      carry(t, p) { CLIPS.walk(t, p); p.aL = [-1.1, 0, -0.15, -0.75]; p.aR = [-1.1, 0, 0.15, -0.75]; p.hx = -0.04; },
      carry_idle(t, p) { CLIPS.idle(t, p); p.aL = [-1.1, 0, -0.15, -0.75]; p.aR = [-1.1, 0, 0.15, -0.75]; },
      hammer(t, p) { CLIPS.idle(t, p); const k = Math.max(0, Math.sin(t * 6)); p.aR = [-2.1 + k * 1.2, 0, 0.2, -0.5 - k * 0.6]; p.aL = [-0.9, 0, -0.2, -0.7]; p.hx = 0.22; p.fist = 1; },
      type(t, p) { CLIPS.idle(t, p); const k = Math.sin(t * 14) * 0.05; p.aR = [-0.95 + k, 0, 0.12, -1.1]; p.aL = [-0.95 - k, 0, -0.12, -1.1]; p.hx = 0.2; },
      sweep(t, p) { CLIPS.idle(t, p); const s2 = Math.sin(t * 3); p.aR = [-0.65 + s2 * 0.3, 0, 0.35, -0.5]; p.aL = [-0.9 + s2 * 0.2, 0, -0.05, -0.9]; p.ry = s2 * 0.25; p.hx = 0.2; p.fist = 1; },
      greet(t, p) { CLIPS.idle(t, p); p.aR = [-0.3, 0, 2.3, -0.6 + Math.sin(t * 8) * 0.3]; p.hz = -0.08; p.hy = Math.sin(t * 0.8) * 0.15; },
      sit(t, p) { CLIPS.idle(t, p); p.sit = 1; p.aL = [-0.45, 0, -0.25, -0.55]; p.aR = [-0.45, 0, 0.25, -0.55]; },
      sit_sad(t, p) { CLIPS.sit(t, p); p.hx = 0.28; p.rx = 0.14; p.aL = [-0.55, 0, -0.08, -0.9]; p.aR = [-0.55, 0, 0.08, -0.9]; },
    };

    // ---------- face state ----------
    const face = { cur: { ...EXPR.neutral, m: { ...EXPR.neutral.m } }, target: EXPR.neutral, blink: 0, nextBlink: 2.5, talk: 0, mouthKey: '' };
    const mouthCache = new Map();
    function setMouth(m, talk) {
      const o = clamp(m.o + talk * (0.75 - m.o * 0.4), 0, 1), key = [m.c.toFixed(1), (Math.round(o * 8) / 8).toFixed(2), (m.w || 1).toFixed(1), m.teeth || (talk > 0.15 ? 1 : 0), m.tongue ? 1 : 0, (m.asym || 0).toFixed(1)].join('|');
      if (key === face.mouthKey) return; face.mouthKey = key;
      if (!mouthCache.has(key)) mouthCache.set(key, mouthTex({ c: m.c, o, w: m.w || 1, teeth: m.teeth || (talk > 0.15 ? 1 : 0), tongue: m.tongue, asym: m.asym || 0 }));
      mouthMat.map = mouthCache.get(key); mouthMat.needsUpdate = true;
    }
    function applyFace(dt, time) {
      const c = face.cur, t = face.target, k = clamp(dt * 9, 0, 1);
      for (const key of ['by', 'bt', 'lt', 'lb', 'pupil']) c[key] = lerp(c[key] ?? 0, t[key] ?? 0, k);
      c.tilt = lerp(c.tilt || 0, t.tilt || 0, k); c.browAsym = lerp(c.browAsym || 0, t.browAsym || 0, k); c.blush = lerp(c.blush || 0, t.blush || 0, k); c.wink = lerp(c.wink || 0, t.wink || 0, k);
      c.lx = lerp(c.lx || 0, (t.look || [0, 0])[0], k); c.ly = lerp(c.ly || 0, (t.look || [0, 0])[1], k);
      // blink every few seconds (deterministic from time)
      const bp = (time % 3.7) / 3.7, blink = bp > 0.96 ? Math.sin((bp - 0.96) / 0.04 * Math.PI) : 0;
      for (const e of eyes) {
        const wink = e.s === 1 ? c.wink : 0, top = clamp(c.lt + blink * (1 - c.lt) + wink * 0.9, -0.2, 1), bot = clamp(c.lb, 0, 1);
        e.upper.rotation.x = lerp(-1.05, 0.78, top); e.lower.rotation.x = lerp(1.15, 0.45, bot * 0.6); for (const gl of e.glints) gl.visible = top < 0.62;
        e.ball.rotation.set(-c.ly * 0.35, c.lx * 0.45, 0); e.iris.scale.setScalar(1).multiply(V(1, 1.08, 0.9)); e.ball.scale.setScalar(1);
      }
      for (const b of brows) { const asym = b.s === 1 ? c.browAsym : 0; b.piv.position.y = b.y0 + (c.by + asym * 0.4) * eyeR * 0.7 - Math.max(0, c.bt) * eyeR * 0.15; b.piv.rotation.z = b.s * c.bt * 0.55 - b.s * asym * 0.25; }
      head.rotation.z += c.tilt;
      blush.material.opacity = blushBase + c.blush * 0.45;
      setMouth(t.m, face.talk);
    }

    // ---------- runtime ----------
    let clip = 'idle', clipT = 0, prev = null, blend = 1, last = zero(), time = 0, seat = null, talkDriven = false, exprName = 'neutral';
    const lerpP = (a, b, k) => { const out = {}; for (const key in b) out[key] = Array.isArray(b[key]) ? b[key].map((v, i) => lerp(a[key][i], v, k)) : lerp(a[key], b[key], k); return out; };
    function apply(p) {
      const sitting = p.sit > 0.01;
      body.position.y = p.y + (sitting && seat != null ? (seat - legLen + 0.06) * p.sit : -0.0);
      body.rotation.set(p.rx * 0.5, p.ry * 0.5, p.rz * 0.5);
      spine.rotation.set(p.rx * 0.5 + p.sit * -0.05, p.ry * 0.5, p.rz * 0.5); chest.position.y = torsoH * 0.5 + p.sx * 0.0;
      head.rotation.set(p.hx, p.hy, p.hz);
      for (const [A, a, pt, isR] of [[armL, p.aL, p.pointL, false], [armR, p.aR, p.pointR, true]]) {
        A.upper.rotation.set(a[0], a[1], a[2]); A.fore.rotation.set(a[3], 0, 0);
        const fist = p.fist, thumbUp = isR && p.thumbR > 0.5, peace = isR && p.peaceR > 0.5;
        A.fingers.children.forEach((f, i) => { const straight = (pt > 0.5 && i === 0) || (peace && i < 2); f.rotation.x = straight ? 0.05 : lerp(0.35, 1.9, Math.max(fist, pt > 0.5 || peace ? 1 : 0)); });
        A.thumb.rotation.set(thumbUp ? -0.2 : 0.3, 0, (isR ? 1 : -1) * (thumbUp ? -0.6 : 0.8));
      }
      // legs: thigh swing + knee bend; sitting folds both
      for (const [L, tt] of [[legL, p.tL], [legR, p.tR]]) { L.thigh.rotation.x = -tt[0] - p.sit * 1.5; L.shin.rotation.x = tt[1] + p.sit * 1.5; L.foot.rotation.x = -tt[1] * 0.3; }
      for (const s of swayers) s.g.rotation.x = Math.sin(time * 2.2 + s.k) * s.amp - p.rx * 0.5;
    }
    function update(dt) {
      time += dt; clipT += dt;
      const p = zero(); CLIPS[clip](clipT, p);
      blend = Math.min(1, blend + dt / 0.3);
      const pose = prev && blend < 1 ? lerpP(prev, p, smooth(blend)) : p;
      apply(pose); last = pose;
      if (clip === 'talk' && !talkDriven) face.talk = Math.max(0, Math.sin(time * 13) * 0.6 + Math.sin(time * 7.3) * 0.4) * 0.8; else if (!talkDriven) face.talk = 0;
      applyFace(dt, time);
    }
    const api = {
      group: root, EXPRESSIONS: Object.keys(EXPR), ANIMATIONS: Object.keys(CLIPS),
      params: { kind: 'explorer', preset: id, label: P.label, height: H, outfit: detective ? 'detective' : 'casual' },
      get expression() { return exprName; }, get animation() { return clip; },
      setExpression(n, instant = false) { const e = EXPR[n] || EXPR.neutral; exprName = EXPR[n] ? n : 'neutral'; face.target = e; if (instant) { face.cur = { ...e, m: { ...e.m } }; } },
      play(n, opt = {}) { if (!CLIPS[n]) n = 'idle'; if (opt.instant) { clip = n; clipT = 0; prev = null; blend = 1; return; } if (n === clip) return; prev = last; clip = n; clipT = 0; blend = 0; },
      setTalk(level) { talkDriven = level != null; face.talk = clamp(level || 0, 0, 1); },
      setSeat(h) { seat = h; },
      hold(obj, hand = 'R') { const g = (hand === 'R' ? armR : armL).grip; while (g.children.length) g.remove(g.children[0]); if (obj) g.add(obj); },
      update,
      rig: { hips, spine, chest, neck, head, headC, armL, armR, legL, legR },
    };
    // detective: a magnifying glass in the right hand (the sheet pose)
    if (detective) {
      const mg = new T.Group(); add(mg, new T.CylinderGeometry(0.01, 0.012, 0.11, 10), plastic(0x1f1a17), 0, -0.02, 0);
      const ring = add(mg, new T.TorusGeometry(0.045, 0.008, 10, 32), plastic(0x1f1a17), 0, 0.075, 0); ring.rotation.y = Math.PI / 2;
      const lens = add(mg, new T.CircleGeometry(0.044, 32), new T.MeshPhysicalMaterial({ color: 0xdff4ff, transmission: 0.8, transparent: true, opacity: 0.45, roughness: 0.05 }), 0, 0.075, 0); lens.rotation.y = Math.PI / 2;
      api.hold(mg, 'R');
    }
    // the worker's tool (from the sheet)
    if (P.prop) {
      const g = new T.Group(), M2 = (c, o) => plastic(c, o);
      const front = (o) => { const f = J(chest, 0, -torsoH * 0.1, chestD * 2.4); f.add(o); return f; };
      if (P.prop === 'tray') { add(g, new T.CylinderGeometry(0.15, 0.15, 0.012, 24), M2(0x9ca3af, { metalness: 0.6, roughness: 0.3 })); for (let k = 0; k < 6; k++) add(g, new T.CylinderGeometry(0.035, 0.035, 0.014, 14), M2(0xd9a05b), Math.cos(k) * 0.08, 0.012, Math.sin(k) * 0.08); front(g); }
      else if (P.prop === 'box') { add(g, roundBox(0.18, 0.12, 0.14, 0.01), M2(0x7c3aed)); add(g, new T.BoxGeometry(0.19, 0.125, 0.025), M2(0xfacc15)); add(g, new T.BoxGeometry(0.025, 0.125, 0.145), M2(0xfacc15)); front(g); }
      else if (P.prop === 'dough') { const d = add(g, new T.SphereGeometry(0.08, 18, 14), M2(0xf5e1b8, { roughness: 0.8 })); d.scale.set(1.4, 0.7, 1); add(g, new T.CylinderGeometry(0.12, 0.1, 0.06, 20, 1, true), M2(0xc0c7d0, { metalness: 0.5, side: T.DoubleSide }), 0, -0.02, 0); front(g); }
      else if (P.prop === 'magnifier') { add(g, new T.CylinderGeometry(0.01, 0.012, 0.11, 10), M2(0x1f1a17), 0, -0.02, 0); const r = add(g, new T.TorusGeometry(0.045, 0.008, 10, 32), M2(0xec4899), 0, 0.075, 0); r.rotation.y = Math.PI / 2; api.hold(g, 'R'); const cb = new T.Group(); add(cb, roundBox(0.16, 0.2, 0.012, 0.006), M2(0x8a5a33)); add(cb, new T.PlaneGeometry(0.13, 0.15), new T.MeshStandardMaterial({ color: 0xffffff }), 0, -0.01, 0.007); api.hold(cb, 'L'); }
      else if (P.prop === 'lollipop') { add(g, new T.CylinderGeometry(0.006, 0.006, 0.22, 8), M2(0xffffff), 0, 0.05, 0); const pop = add(g, new T.CylinderGeometry(0.06, 0.06, 0.02, 24), M2(0xec4899, { roughness: 0.25 }), 0, 0.17, 0); pop.rotation.x = Math.PI / 2; api.hold(g, 'R'); }
      else if (P.prop === 'can') { add(g, new T.CylinderGeometry(0.06, 0.07, 0.12, 16), M2(0x16a34a, { metalness: 0.3 }), 0, -0.06, 0.02); const sp = add(g, new T.CylinderGeometry(0.008, 0.014, 0.14, 8), M2(0x16a34a), 0, -0.03, 0.1); sp.rotation.x = 1.0; api.hold(g, 'R'); }
      else if (P.prop === 'bell') { add(g, new T.SphereGeometry(0.035, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M2(0xd4a017, { metalness: 0.7, roughness: 0.25 })); api.hold(g, 'L'); }
      else if (P.prop === 'radio') { add(g, roundBox(0.04, 0.09, 0.025, 0.006), M2(0x111827)); add(g, new T.CylinderGeometry(0.004, 0.004, 0.06, 6), M2(0x111827), 0.012, 0.07, 0); api.hold(g, 'R'); }
      else if (P.prop === 'flag') { add(g, new T.CylinderGeometry(0.005, 0.005, 0.3, 8), M2(0x8a5a33), 0, 0.08, 0); add(g, new T.PlaneGeometry(0.12, 0.08), new T.MeshStandardMaterial({ color: 0x16a34a, side: T.DoubleSide }), 0.06, 0.19, 0); api.hold(g, 'R'); }
      else if (P.prop === 'flask') { add(g, new T.SphereGeometry(0.045, 16, 12), new T.MeshPhysicalMaterial({ color: 0xa855f7, transparent: true, opacity: 0.85, roughness: 0.05, emissive: 0x7c3aed, emissiveIntensity: 0.4 }), 0, 0.02, 0); add(g, new T.CylinderGeometry(0.014, 0.016, 0.05, 10), new T.MeshPhysicalMaterial({ color: 0xe9d5ff, transparent: true, opacity: 0.6 }), 0, 0.075, 0); api.hold(g, 'R'); }
      else if (P.prop === 'broom') { add(g, new T.CylinderGeometry(0.008, 0.008, 0.62, 8), M2(0x8a5a33), 0, -0.12, 0); const br = add(g, new T.ConeGeometry(0.07, 0.14, 12), M2(0xd6a64f, { roughness: 0.9 }), 0, -0.47, 0); br.rotation.x = Math.PI; api.hold(g, 'R'); }
      else if (P.prop === 'wrench') { add(g, new T.BoxGeometry(0.018, 0.16, 0.012), M2(0x9ca3af, { metalness: 0.7, roughness: 0.3 }), 0, 0.05, 0); const hd = add(g, new T.TorusGeometry(0.022, 0.009, 8, 16, Math.PI * 1.5), M2(0x9ca3af, { metalness: 0.7 }), 0, 0.14, 0); hd.rotation.z = Math.PI * 0.25; api.hold(g, 'R'); }
    }
    api.setExpression('neutral', true); update(0);
    root.traverse((m) => { if (m.isMesh && m.castShadow !== false) m.castShadow = true; });
    return api;
  }

  window.ZCharacters = Object.assign(window.ZCharacters || {}, { explorer, EXPLORER_PRESETS: PRESETS, EXPLORER_EXPRESSIONS: Object.keys(EXPR) });
})();
