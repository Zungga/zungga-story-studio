/* Zungga Story Studio — nature props, ported from the Play-mode island (drive-portfolio/js/game.js):
 * the same low-poly tree species (oak, pine, birch, maple), bushes, rocks and flowers, built at story scale. */
(() => {
  'use strict';
  const { T, mat, mesh, tex, box, decal, cyl, sphere } = ZA;
  const flat = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...o });
  // seeded random so a prop looks the same every time it is built (video frames stay identical between renders)
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function jitter(geo, amt, r) {                                 // irregular low-poly crowns (as in the game)
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) p.setXYZ(k, p.getX(k) + (r() * 2 - 1) * amt, p.getY(k) + (r() * 2 - 1) * amt, p.getZ(k) + (r() * 2 - 1) * amt);
    geo.computeVertexNormals(); return geo;
  }
  const M4 = (x, y, z, sx = 1, sy = sx, sz = sx, ry = 0) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(0, ry, 0)), new T.Vector3(sx, sy, sz));
  // species recipes copied from the game (game units ≈ metres; story trees are scaled down a little)
  const SPECIES = {
    oak: { trunk: (r) => [[new T.CylinderGeometry(0.4, 0.6, 3.2, 7), M4(0, 1.6, 0)], [new T.CylinderGeometry(0.16, 0.24, 1.8, 5), M4(0.7, 3.0, 0)]],
      crown: (r) => [[jitter(new T.IcosahedronGeometry(2.4, 1), 0.3, r), M4(0, 4.8, 0)], [jitter(new T.IcosahedronGeometry(1.8, 1), 0.25, r), M4(1.6, 4.2, 0.6)], [jitter(new T.IcosahedronGeometry(1.7, 1), 0.25, r), M4(-1.4, 4.4, -0.7)], [jitter(new T.IcosahedronGeometry(1.5, 1), 0.2, r), M4(0.2, 6.1, 0.3)]],
      trunkCol: 0x5c3d24, crowns: [0x3f8f3a, 0x4c9a3c, 0x5aa646, 0x3a7f34] },
    pine: { trunk: (r) => [[new T.CylinderGeometry(0.28, 0.42, 3, 6), M4(0, 1.5, 0)]],
      crown: (r) => [[jitter(new T.ConeGeometry(2.6, 3.4, 8), 0.15, r), M4(0, 3.2, 0)], [jitter(new T.ConeGeometry(2.1, 3.0, 8), 0.15, r), M4(0, 5.0, 0, 1, 1, 1, 0.4)], [jitter(new T.ConeGeometry(1.5, 2.6, 8), 0.12, r), M4(0, 6.6, 0, 1, 1, 1, 0.8)], [new T.ConeGeometry(0.8, 1.8, 7), M4(0, 8.0, 0)]],
      trunkCol: 0x6b4423, crowns: [0x1f6f3a, 0x2b7a3f, 0x24603a, 0x317f45] },
    birch: { trunk: (r) => [[new T.CylinderGeometry(0.2, 0.28, 5.2, 6), M4(0, 2.6, 0)]],
      crown: (r) => [[jitter(new T.IcosahedronGeometry(1.5, 1), 0.2, r), M4(0, 5.6, 0, 1, 1.35, 1)], [jitter(new T.IcosahedronGeometry(1.1, 1), 0.18, r), M4(0.5, 4.6, 0.3, 1, 1.2, 1)]],
      trunkCol: 0xeceae2, crowns: [0x9cc94d, 0xb6d35a, 0x8dbf47] },
    maple: { trunk: (r) => [[new T.CylinderGeometry(0.32, 0.48, 3, 6), M4(0, 1.5, 0)]],
      crown: (r) => [[jitter(new T.DodecahedronGeometry(2.3, 0), 0.25, r), M4(0, 4.4, 0, 1.15, 0.95, 1.15)], [jitter(new T.DodecahedronGeometry(1.6, 0), 0.2, r), M4(0.9, 5.4, -0.4)]],
      trunkCol: 0x5a3a22, crowns: [0xe8590c, 0xf08c00, 0xd9480f, 0xf59f00, 0xc92a2a] },
  };
  let seedN = 7;
  function tree(kind, scale = 0.62) {
    return () => {
      const sp = SPECIES[kind], r = rng(seedN += 101), g = new T.Group(), inner = new T.Group(); inner.scale.setScalar(scale); g.add(inner);
      for (const [geo, m] of sp.trunk(r)) { const me = new T.Mesh(geo.applyMatrix4(m), flat(sp.trunkCol)); me.castShadow = true; me.receiveShadow = true; inner.add(me); }
      sp.crown(r).forEach(([geo, m], i) => { const me = new T.Mesh(geo.applyMatrix4(m), flat(sp.crowns[i % sp.crowns.length])); me.castShadow = true; me.receiveShadow = true; inner.add(me); });
      return { group: g };
    };
  }
  function bush() { const r = rng(seedN += 37), g = new T.Group(); [[0, 0.32, 0, 0.45], [0.35, 0.25, 0.1, 0.32], [-0.3, 0.24, -0.05, 0.3]].forEach(([x, y, z, s], i) => { const me = new T.Mesh(jitter(new T.IcosahedronGeometry(1, 1), 0.15, r), flat([0x2f7d32, 0x3b8f3e, 0x4f9d48][i % 3])); me.position.set(x, y, z); me.scale.set(s * 1.2, s * 0.85, s * 1.2); me.castShadow = true; g.add(me); }); return { group: g }; }
  function rock() { const r = rng(seedN += 53), g = new T.Group(), me = new T.Mesh(jitter(new T.DodecahedronGeometry(0.35, 0), 0.06, r), flat(0x9aa0a6, { roughness: 1 })); me.position.y = 0.18; me.scale.set(1.2, 0.7, 1); me.castShadow = true; g.add(me); return { group: g }; }
  function flowers() {   // a small flower patch
    const r = rng(seedN += 71), g = new T.Group();
    for (let i = 0; i < 14; i++) {
      const x = (r() - 0.5) * 0.9, z = (r() - 0.5) * 0.6, h = 0.12 + r() * 0.1;
      const st = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, h, 4), mat(0x3f8f3a)); st.position.set(x, h / 2, z); g.add(st);
      const fl = new T.Mesh(new T.IcosahedronGeometry(0.035, 0), flat([0xff4f8b, 0xfcc72c, 0xffffff, 0x7c5cf2][i % 4])); fl.position.set(x, h, z); g.add(fl);
    }
    return { group: g };
  }
  function plantPot() {   // a leafy houseplant in a terracotta pot (living rooms, shop corners)
    const r = rng(seedN += 89), g = new T.Group();
    const pot = new T.Mesh(new T.CylinderGeometry(0.17, 0.12, 0.3, 24), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })); pot.position.y = 0.15; pot.castShadow = true; g.add(pot);
    const rim = new T.Mesh(new T.TorusGeometry(0.17, 0.015, 8, 24), new T.MeshStandardMaterial({ color: 0xf2efe9, roughness: 0.6 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.3; g.add(rim);
    const leafG = new T.SphereGeometry(1, 12, 8); leafG.scale(0.05, 0.012, 0.13);
    const leafM = [0x3f8f3a, 0x4c9a3c, 0x5aa646, 0x2f7d32].map((c) => new T.MeshStandardMaterial({ color: c, roughness: 0.55, side: T.DoubleSide }));
    for (let i = 0; i < 22; i++) {
      const a = i * 2.4 + r() * 0.5, h = 0.32 + r() * 0.45, out = 0.06 + r() * 0.14;
      const stem = new T.Mesh(new T.CylinderGeometry(0.005, 0.006, h - 0.25, 4), leafM[0]); stem.position.set(Math.cos(a) * out * 0.5, 0.25 + (h - 0.25) / 2, Math.sin(a) * out * 0.5); stem.rotation.set(Math.sin(a) * out * 2, 0, -Math.cos(a) * out * 2); g.add(stem);
      const leaf = new T.Mesh(leafG, leafM[i % 4]); leaf.position.set(Math.cos(a) * out, h, Math.sin(a) * out); leaf.rotation.set(0.5 + r() * 0.5, -a + Math.PI / 2, 0.3); leaf.castShadow = true; g.add(leaf);
    }
    return { group: g };
  }
  ZAssets.register('nature', 'plant_pot', 'Houseplant', plantPot, ['plant', 'indoor', 'home']);
  for (const k of Object.keys(SPECIES)) ZAssets.register('nature', 'tree_' + k, `Tree (${k})`, tree(k), ['tree', 'nature', k, 'outdoor']);
  ZAssets.register('nature', 'bush', 'Bush', bush, ['bush', 'nature', 'outdoor']);
  ZAssets.register('nature', 'rock', 'Rock', rock, ['rock', 'nature', 'outdoor']);
  ZAssets.register('nature', 'flowers', 'Flower patch', flowers, ['flowers', 'nature', 'outdoor']);
  /* ---------- more nature: palm, banyan, grass, pond, sky elements, critters, backdrop ---------- */
  const shade = (o) => { o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
  const fm = (geo, c, parent, x = 0, y = 0, z = 0, o = {}) => mesh(geo, flat(c, o), parent, x, y, z);
  // hash-based jitter: duplicate seam vertices move together, so no cracks
  function hjitter(geo, amt, seed = 1, keepY0 = false, fall = null) {
    const p = geo.attributes.position, h = (a) => { const v = Math.sin(a * 12.9898 + seed * 78.233) * 43758.5453; return (v - Math.floor(v)) * 2 - 1; };
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), y = p.getY(k), z = p.getZ(k), key = Math.round(x * 997) + Math.round(y * 991) * 3.1 + Math.round(z * 983) * 7.3;
      const a = amt * (fall ? fall(y) : 1);
      p.setXYZ(k, x + h(key) * a, keepY0 && Math.abs(y) < 1e-4 ? y : y + h(key + 1.7) * a, z + h(key + 3.3) * a);
    }
    geo.computeVertexNormals(); return geo;
  }

  // a palm frond: long feathered leaf along +x, drooping, with zig-zag leaflets
  function frondGeo(len, wid, droop) {
    const nx = 14, g = new T.PlaneGeometry(len, wid, nx, 4); g.rotateX(-Math.PI / 2); g.translate(len / 2, 0, 0);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const ix = k % (nx + 1), iy = Math.floor(k / (nx + 1)), u = Math.min(1, Math.max(0, p.getX(k) / len));
      let z = p.getZ(k) * Math.sin(Math.PI * Math.min(1, Math.pow(u, 0.6)));
      if ((iy === 0 || iy === 4) && ix % 2) z *= 0.5;
      p.setXYZ(k, p.getX(k), -droop * u * u - Math.abs(z) * 0.45, z);
    }
    g.computeVertexNormals(); return g;
  }
  function palmTree() {
    const g = new T.Group(), H = 4.6, n = 12, lean = 0.9, pt = (u) => [lean * u * u, H * u];
    for (let i = 0; i < n; i++) {
      const [x0, y0] = pt(i / n), [x1, y1] = pt((i + 1) / n), L = Math.hypot(x1 - x0, y1 - y0), r = 0.17 - 0.06 * (i / n);
      const seg = fm(new T.CylinderGeometry(r * 0.86, r, L * 1.04, 9), i % 2 ? 0x8b6b4a : 0x7a5b3d, g, (x0 + x1) / 2, (y0 + y1) / 2, 0);
      seg.rotation.z = -Math.atan2(x1 - x0, y1 - y0);
    }
    fm(new T.CylinderGeometry(0.2, 0.26, 0.18, 9), 0x6e5136, g, 0, 0.09, 0);
    const [cx, cy] = pt(1), crown = new T.Group(); crown.position.set(cx, cy, 0); g.add(crown);
    fm(new T.IcosahedronGeometry(0.2, 0), 0x5c7d2a, crown, 0, 0.05, 0);
    const greens = [0x3f9a3a, 0x4caf50, 0x358a34, 0x5cb85c];
    for (let i = 0; i < 9; i++) {
      const piv = new T.Group(); piv.rotation.y = i * (Math.PI * 2 / 9) + 0.2; piv.position.y = 0.08; crown.add(piv);
      const len = 2.3 + (i % 3) * 0.3, f = mesh(frondGeo(len, 0.85, 1.0 + (i % 2) * 0.3), flat(greens[i % 4], { side: T.DoubleSide }), piv);
      f.rotation.z = 0.45 + (i % 3) * 0.12;
    }
    for (let i = 0; i < 4; i++) { const p = new T.Group(); p.rotation.y = i * 1.6 + 0.6; p.position.y = 0.25; crown.add(p); const f = mesh(frondGeo(1.2, 0.5, 0.2), flat(0x6cc04a, { side: T.DoubleSide }), p); f.rotation.z = 1.05; }
    [[0.17, -0.12, 0.05], [-0.06, -0.14, 0.16], [-0.1, -0.15, -0.13], [0.07, -0.2, -0.12], [0.02, -0.2, 0.18]].forEach(([x, y, z], i) => fm(new T.IcosahedronGeometry(0.11, 1), i % 2 ? 0x6b4a1e : 0x7d9a2f, crown, x, y, z));
    return { group: g };
  }

  function banyanTree() {
    const g = new T.Group(), r = rng(911), bark = 0x7d6a58, barkD = 0x6a5847;
    fm(new T.CylinderGeometry(0.45, 0.7, 3.4, 9), bark, g, 0, 1.7, 0);
    [[0.35, 0.2, -0.3], [-0.35, 0.15, 0.3], [0.1, -0.4, 0.4]].forEach(([dx, dz, rz]) => { const b = fm(new T.CylinderGeometry(0.22, 0.38, 2.6, 7), barkD, g, dx, 1.2, dz); b.rotation.set(dz * 0.5, 0, rz); });
    const limb = (x0, y0, z0, x1, y1, z1, rad, c = bark) => {
      const a = new T.Vector3(x0, y0, z0), b = new T.Vector3(x1, y1, z1), d = b.clone().sub(a), m = fm(new T.CylinderGeometry(rad * 0.7, rad, d.length(), 7), c, g);
      m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m;
    };
    limb(0, 3.0, 0, -2.4, 4.1, 0.3, 0.3); limb(0, 3.1, 0, 1.0, 4.4, -1.2, 0.26); limb(0, 3.2, 0, -0.8, 4.4, -1.4, 0.24); limb(0, 3.2, 0, 0.4, 4.6, 1.2, 0.24);
    limb(0.3, 2.62, 0, 3.0, 2.78, 0.1, 0.17);                       // the swing branch (horizontal, along +x)
    limb(2.4, 2.75, 0.05, 3.0, 3.9, 0.4, 0.12);
    const greens = [0x2f7d32, 0x3b8f3e, 0x2a6e2e, 0x4f9d48];
    const blobs = [[0, 4.9, 0, 1.7], [-2.2, 4.4, 0.3, 1.5], [2.3, 4.3, 0.2, 1.4], [1.0, 4.6, -1.3, 1.4], [-1.0, 4.6, -1.4, 1.4], [-0.9, 4.5, 1.2, 1.3], [1.1, 4.5, 1.2, 1.3], [-3.2, 4.1, -0.4, 1.0], [3.2, 4.0, -0.4, 1.0], [0, 5.5, 0.3, 1.1]];
    blobs.forEach(([x, y, z, s], i) => { const m = new T.Mesh(hjitter(new T.IcosahedronGeometry(s, 1), 0.16, i + 9), flat(greens[i % 4])); m.position.set(x, y, z); m.scale.set(1.15, 0.62, 1.0); g.add(m); });
    // aerial roots hanging to the ground (kept clear of the swing)
    const roots = [[-2.6, 3.8, 0.4], [-2.0, 3.9, -0.6], [-1.4, 4.0, 0.9], [-3.3, 3.6, -0.2], [-0.9, 4.0, -1.5], [1.2, 4.0, -1.5], [0.6, 4.1, -1.2], [3.2, 3.6, -0.6], [3.4, 3.6, 0.5], [-1.6, 4.0, -1.3], [1.6, 4.0, 1.4], [-0.6, 4.0, 1.3], [2.6, 3.7, -1.0], [-2.8, 3.7, 1.0]];
    roots.forEach(([x, top, z], i) => {
      const thick = i % 4 === 0, rad = thick ? 0.07 : 0.025 + r() * 0.015, len = thick ? top : top * (0.45 + r() * 0.5);
      fm(new T.CylinderGeometry(rad * 0.8, rad, len, 5), thick ? barkD : 0x8a7560, g, x, top - len / 2, z);
      if (thick) fm(new T.CylinderGeometry(rad * 1.2, rad * 2.2, 0.25, 6), barkD, g, x, 0.12, z);
    });
    // rope swing
    const sw = new T.Group(); sw.position.set(1.75, 2.7, 0.03); g.add(sw);
    const L = 2.2, rope = mat(0xc9a66b, { roughness: 0.9 });
    [-0.26, 0.26].forEach((x) => { mesh(new T.CylinderGeometry(0.014, 0.014, L, 6), rope, sw, x, -L / 2, 0); const k = mesh(new T.TorusGeometry(0.17, 0.02, 6, 16), rope, sw, x, 0, 0); k.rotation.y = Math.PI / 2; k.scale.setScalar(0.5); });
    box(0.66, 0.05, 0.24, 0xc0722f, sw, 0, -L - 0.02, 0, 0.015);
    sw.rotation.x = 0;
    g.userData.tick = (t) => { sw.rotation.x = Math.sin(t * 1.7) * 0.32; };
    return { group: shade(g) };
  }

  function grassPatch() {
    const g = new T.Group(), r = rng(4242), N = 900, R = 0.6;
    const blade = new T.BufferGeometry();
    blade.setAttribute('position', new T.Float32BufferAttribute([-0.012, 0, 0, 0.012, 0, 0, -0.008, 0.5, 0.03, 0.008, 0.5, 0.03, 0, 1, 0.11], 3));
    blade.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]); blade.computeVertexNormals();
    const im = new T.InstancedMesh(blade, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: T.DoubleSide }), N);
    const cols = [0x4caf50, 0x5cb85c, 0x3f9a3a, 0x7cc84a, 0x2f8a35, 0x8fd14f].map((c) => new T.Color(c));
    for (let i = 0; i < N; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * (0.85 + 0.15 * Math.sin(a * 5)), h = 0.13 + r() * 0.16 * (1 - d / R * 0.5);
      const m = new T.Matrix4().compose(new T.Vector3(Math.cos(a) * d, 0.01, Math.sin(a) * d), new T.Quaternion().setFromEuler(new T.Euler((r() - 0.5) * 0.4, r() * Math.PI * 2, (r() - 0.5) * 0.4)), new T.Vector3(1 + r() * 0.6, h, 1));
      im.setMatrixAt(i, m); im.setColorAt(i, cols[Math.floor(r() * cols.length)]);
    }
    im.castShadow = true; im.receiveShadow = true; g.add(im);
    const base = fm(new T.CylinderGeometry(R * 0.98, R + 0.02, 0.02, 24), 0x4e7d2c, g, 0, 0.01, 0); base.scale.z = 1;
    return { group: g };
  }

  function pond() {
    const g = new T.Group(), r = rng(5150), rad = (a) => 1 + 0.1 * Math.sin(3 * a + 0.5) + 0.05 * Math.cos(5 * a);
    const shp = new T.Shape(), K = 48;
    for (let i = 0; i <= K; i++) { const a = i / K * Math.PI * 2, d = rad(a); i ? shp.lineTo(Math.cos(a) * d * 1.1, Math.sin(a) * d * 0.75) : shp.moveTo(Math.cos(a) * d * 1.1, Math.sin(a) * d * 0.75); }
    const wg = new T.ShapeGeometry(shp, 8); wg.rotateX(-Math.PI / 2);
    const bed = mesh(wg.clone(), mat(0x2a6f8f), g, 0, 0.012, 0); bed.scale.set(1.04, 1, 1.04);
    mesh(wg, mat(0x4fb3dc, { roughness: 0.12, metalness: 0.15 }), g, 0, 0.04, 0);
    const greys = [0x9aa0a6, 0xb0b5ba, 0x8a9096, 0xa7a19a];
    for (let i = 0; i < 30; i++) {
      const a = i / 30 * Math.PI * 2 + r() * 0.08, d = rad(a) + 0.05, s = 0.085 + r() * 0.05;
      const st = new T.Mesh(hjitter(new T.DodecahedronGeometry(s, 1), s * 0.12, i + 5), flat(greys[i % 4], { roughness: 1 }));
      st.position.set(Math.cos(a) * d * 1.1, s * 0.4, Math.sin(a) * d * 0.75); st.scale.set(1.35, 0.6, 1.05); st.rotation.y = r() * 3; g.add(st);
    }
    const padG = new T.CircleGeometry(0.15, 20, 0.35, Math.PI * 2 - 0.35); padG.rotateX(-Math.PI / 2);
    const pads = [[-0.45, 0.2, 1, 0.3], [-0.2, 0.32, 0.7, 2.1], [0.35, -0.25, 0.9, 4], [-0.55, -0.15, 0.75, 1.2], [0.6, 0.15, 0.6, 5.2]].map(([x, z, s, ry], i) => {
      const p = mesh(padG, mat(i % 2 ? 0x3d9b45 : 0x5cb85c, { side: T.DoubleSide }), g, x, 0.048, z); p.scale.setScalar(s); p.rotation.y = ry; return p;
    });
    // a lotus on the first pad
    const lotus = new T.Group(); lotus.position.set(-0.45, 0.05, 0.2); g.add(lotus);
    const petalG = new T.SphereGeometry(1, 10, 8); petalG.scale(0.022, 0.012, 0.05); petalG.translate(0, 0, 0.04);
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 8; i++) { const p = mesh(petalG, mat(ring ? 0xffc2dc : 0xff7eb6), lotus, 0, 0.02 + ring * 0.01, 0); p.rotation.set(0, i * Math.PI / 4 + ring * 0.4, 0); p.rotateX(-0.5 - ring * 0.5); }
    sphere(0.018, 0xfacc15, lotus, 0, 0.035, 0, 12);
    // ripples
    const rings = [0, 1, 2].map(() => { const m = new T.Mesh(new T.TorusGeometry(1, 0.008, 6, 48), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(0.25, 0.046, 0.05); g.add(m); return m; });
    g.userData.tick = (t) => {
      rings.forEach((m, k) => { const s = (t * 0.3 + k / 3) % 1; const sc = 0.04 + s * 0.45; m.scale.set(sc, sc, 1); m.material.opacity = 0.55 * (1 - s); });
      pads.forEach((p, i) => { p.position.y = 0.048 + Math.sin(t * 1.4 + i) * 0.003; });
    };
    g.userData.tick(0);
    return { group: g };
  }

  function cloudsProp() {
    const g = new T.Group(), cm = mat(0xffffff, { roughness: 1, emissive: 0xdde6f5, emissiveIntensity: 0.35 });
    const puffs = [[0, 0, 0, 0.5], [0.45, -0.06, 0.02, 0.38], [-0.45, -0.08, 0.05, 0.36], [0.2, 0.24, 0, 0.38], [-0.22, 0.2, -0.05, 0.34], [0.78, -0.13, 0, 0.25], [-0.74, -0.13, 0, 0.24], [0, -0.1, 0.25, 0.3]];
    const defs = [[-1.6, 3.15, 0, 1.0], [1.5, 3.6, -0.6, 0.85], [0.1, 2.75, 0.5, 0.7]];
    const cl = defs.map(([x, y, z, s]) => { const c = new T.Group(); c.position.set(x, y, z); c.scale.setScalar(s); g.add(c); puffs.forEach(([px, py, pz, pr]) => { const m = mesh(new T.SphereGeometry(pr, 20, 14), cm, c, px, py, pz); m.scale.y = 0.82; m.castShadow = false; }); return c; });
    g.userData.tick = (t) => cl.forEach((c, k) => { c.position.x = defs[k][0] + Math.sin(t * 0.09 + k * 2.1) * 0.7; c.position.y = defs[k][1] + Math.sin(t * 0.4 + k) * 0.04; });
    return { group: g };
  }

  function sunRainbow() {
    const g = new T.Group(), cols = [0xff6b6b, 0xffa94d, 0xffd43b, 0x69db7c, 0x4dabf7, 0x748ffc, 0xb197fc];
    cols.forEach((c, i) => { const m = mesh(new T.TorusGeometry(2.4 - i * 0.13, 0.072, 10, 64, Math.PI), mat(c, { roughness: 0.5, emissive: c, emissiveIntensity: 0.15 }), g, 0, 0, 0); m.scale.z = 0.6; });
    const cm = mat(0xffffff, { roughness: 1, emissive: 0xdde6f5, emissiveIntensity: 0.3 });
    [-1.98, 1.98].forEach((x) => [[0, 0.12, 0.05, 0.32], [0.3, 0.08, 0.1, 0.24], [-0.3, 0.08, 0.1, 0.24], [0, 0.32, 0, 0.24]].forEach(([px, py, pz, pr]) => { const m = mesh(new T.SphereGeometry(pr, 18, 12), cm, g, x + px, py, pz); m.scale.y = 0.85; }));
    const sun = new T.Group(); sun.position.set(-1.75, 2.7, -0.15); g.add(sun);
    const sm = mat(0xffd43b, { emissive: 0xffc61a, emissiveIntensity: 0.5, roughness: 0.5 });
    const disc = mesh(new T.CylinderGeometry(0.45, 0.45, 0.12, 40), sm, sun); disc.rotation.x = Math.PI / 2;
    const face = tex((c, W, H) => {
      c.fillStyle = '#3b2a1a'; [[0.36, 0.42], [0.64, 0.42]].forEach(([x, y]) => { c.beginPath(); c.ellipse(W * x, H * y, W * 0.045, H * 0.065, 0, 0, 7); c.fill(); });
      c.fillStyle = '#ffffff'; [[0.375, 0.4], [0.655, 0.4]].forEach(([x, y]) => { c.beginPath(); c.arc(W * x, H * y, W * 0.016, 0, 7); c.fill(); });
      c.fillStyle = 'rgba(255,120,120,0.6)'; [[0.26, 0.58], [0.74, 0.58]].forEach(([x, y]) => { c.beginPath(); c.ellipse(W * x, H * y, W * 0.07, H * 0.04, 0, 0, 7); c.fill(); });
      c.strokeStyle = '#3b2a1a'; c.lineWidth = W * 0.035; c.lineCap = 'round'; c.beginPath(); c.arc(W * 0.5, H * 0.52, W * 0.15, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
    }, 512, 512);
    decal(face, 0.8, 0.8, sun, 0, 0, 0.065);
    const rays = new T.Group(); sun.add(rays);
    for (let i = 0; i < 12; i++) { const ry = mesh(new T.ConeGeometry(0.08, 0.24, 10), sm, rays, Math.cos(i * Math.PI / 6) * 0.62, Math.sin(i * Math.PI / 6) * 0.62, 0); ry.rotation.z = i * Math.PI / 6 - Math.PI / 2; ry.scale.z = 0.5; }
    g.userData.tick = (t) => { rays.rotation.z = t * 0.25; const s = 1 + Math.sin(t * 2) * 0.03; rays.scale.set(s, s, 1); };
    return { group: g };
  }

  function butterflies() {
    const g = new T.Group();
    const fore = new T.Shape(); fore.moveTo(0, 0); fore.bezierCurveTo(0.02, 0.05, 0.075, 0.075, 0.085, 0.04); fore.bezierCurveTo(0.088, 0.012, 0.04, -0.004, 0, 0);
    const hind = new T.Shape(); hind.moveTo(0, 0); hind.bezierCurveTo(0.05, -0.004, 0.068, -0.04, 0.048, -0.064); hind.bezierCurveTo(0.026, -0.076, 0.004, -0.03, 0, 0);
    const wingGeo = (shape, sx, inner) => { const ge = new T.ShapeGeometry(shape, 12); if (inner) { ge.scale(0.74, 0.74, 1); ge.translate(0.012, shape === fore ? 0.006 : -0.006, 0); } ge.scale(sx * 1.35, 1.35, 1); ge.rotateX(Math.PI / 2); return ge; };
    const kinds = [[0xff922b, 0x2b1d14, 0xffe8cc], [0x4dabf7, 0x1c2a4a, 0xe7f5ff], [0xf783ac, 0x5a1f3a, 0xfff0f6]];
    const fl = kinds.map(([c, edge, dot], k) => {
      const b = new T.Group(); g.add(b);
      const body = mesh(new T.CapsuleGeometry(0.008, 0.06, 4, 8), mat(0x2b2118), b); body.rotation.x = Math.PI / 2;
      sphere(0.011, 0x2b2118, b, 0, 0.002, 0.042, 10);
      [-1, 1].forEach((s) => { const an = mesh(new T.CylinderGeometry(0.0015, 0.0015, 0.05, 4), mat(0x2b2118), b, s * 0.01, 0.018, 0.062); an.rotation.set(0.9, 0, -s * 0.35); sphere(0.004, 0x2b2118, b, s * 0.02, 0.034, 0.08, 6); });
      const wings = [-1, 1].map((s) => {
        const w = new T.Group(); w.position.x = s * 0.005; b.add(w);
        for (const sh of [fore, hind]) {
          mesh(wingGeo(sh, s, false), mat(edge, { side: T.DoubleSide, roughness: 0.7 }), w);
          mesh(wingGeo(sh, s, true), mat(c, { side: T.DoubleSide, roughness: 0.6, emissive: c, emissiveIntensity: 0.15 }), w, 0, 0.0015, 0);
        }
        const d = mesh(new T.CircleGeometry(0.009, 12), mat(dot, { side: T.DoubleSide }), w, s * 0.085, 0.003, 0.07); d.rotation.x = -Math.PI / 2;
        return w;
      });
      return { b, wings, p: k * 2.1, x0: (k - 1) * 0.7 };
    });
    g.userData.tick = (t) => fl.forEach(({ b, wings, p, x0 }) => {
      const a = 0.25 + Math.sin(t * 17 + p) * 0.85;
      wings[1].rotation.z = a; wings[0].rotation.z = -a;
      const x = x0 + Math.sin(t * 0.45 + p) * 0.6, z = Math.cos(t * 0.35 + p) * 0.5, y = 1.0 + 0.18 * Math.sin(t * 1.1 + p * 1.3) + 0.03 * Math.sin(t * 17 + p + 1);
      b.position.set(x, y, z);
      b.rotation.set(-0.15, Math.atan2(0.27 * Math.cos(t * 0.45 + p), -0.175 * Math.sin(t * 0.35 + p)), Math.sin(t * 0.8 + p) * 0.2);
    });
    g.userData.tick(0);
    return { group: g };
  }

  function birdsWire() {
    const g = new T.Group(), wood = 0x8a6a4a, sag = 0.22, top = 3.1, half = 2.0;
    [-half, half].forEach((x) => {
      fm(new T.CylinderGeometry(0.07, 0.095, 3.2, 10), wood, g, x, 1.6, 0);
      box(0.08, 0.08, 0.75, 0x6e5136, g, x, 3.0, 0, 0.01);
      [-0.28, 0.28].forEach((z) => cyl(0.025, 0.03, 0.07, 0xf1f3f5, g, x, 3.075, z, 12));
    });
    const wireY = (x) => top - sag * (1 - (x / half) ** 2);
    [-0.28, 0.28].forEach((z) => { const pts = []; for (let i = 0; i <= 20; i++) { const x = -half + i / 20 * half * 2; pts.push(new T.Vector3(x, wireY(x), z)); } mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.008, 6), mat(0x2b2b2b, { roughness: 0.5 }), g); });
    // [body, head, beak, wing, belly]
    const kinds = [[0x5b3a29, 0x1f1a1a, 0xfacc15, 0xf1f1f1, 0x7a5240], [0xa0703f, 0x7a5230, 0x3a2a1a, 0x6b4a2a, 0xe8d6b8], [0x1e88e5, 0x1565c0, 0xe8590c, 0x1976d2, 0xf08c00], [0x9aa3b5, 0x6b7a99, 0x4a4a4a, 0x7d8699, 0xc2c8d6]];
    const heads = [];
    [-1.15, -0.45, 0.3, 1.05].forEach((x, i) => {
      const [bc, hc, kc, wc, bel] = kinds[i], b = new T.Group(); b.position.set(x, wireY(x), 0.28); b.rotation.y = [0.5, -0.3, 0.2, -0.6][i]; b.scale.setScalar(1.6); g.add(b);
      const body = sphere(0.055, bc, b, 0, 0.065, 0, 18); body.scale.set(0.95, 0.95, 1.3);
      const belly = sphere(0.045, bel, b, 0, 0.055, 0.022, 16); belly.scale.set(0.9, 0.95, 1.1);
      [-1, 1].forEach((s) => { const w = sphere(0.035, wc, b, s * 0.045, 0.07, -0.01, 12); w.scale.set(0.35, 0.75, 1.5); w.rotation.x = 0.25; });
      const tail = box(0.045, 0.012, 0.07, bc, b, 0, 0.05, -0.085, 0.005); tail.rotation.x = -0.45;
      const h = new T.Group(); h.position.set(0, 0.125, 0.035); b.add(h); heads.push(h);
      sphere(0.038, hc, h, 0, 0, 0, 16);
      const bk = mesh(new T.ConeGeometry(0.011, 0.035, 8), mat(kc), h, 0, -0.004, 0.045); bk.rotation.x = Math.PI / 2;
      [-1, 1].forEach((s) => { sphere(0.009, 0xffffff, h, s * 0.022, 0.008, 0.026, 8); sphere(0.0055, 0x111111, h, s * 0.025, 0.009, 0.032, 8); });
      [-1, 1].forEach((s) => cyl(0.003, 0.003, 0.025, 0xd9a05b, b, s * 0.015, 0.012, 0.01, 5));
    });
    g.userData.tick = (t) => heads.forEach((h, i) => { h.rotation.y = Math.sin(t * 0.8 + i * 1.7) * 0.5 * (Math.sin(t * 0.3 + i) > 0 ? 1 : 0.3); h.rotation.x = Math.sin(t * 1.3 + i * 2.3) * 0.12; });
    return { group: g };
  }

  function fallenLeaves() {
    const g = new T.Group(), r = rng(1234);
    const oval = new T.Shape(); oval.moveTo(0, -0.05); oval.quadraticCurveTo(0.038, -0.005, 0, 0.05); oval.quadraticCurveTo(-0.038, -0.005, 0, -0.05);
    const maple = new T.Shape(); { const n = 10; for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + i / n * Math.PI * 2, d = i % 2 ? 0.022 : (i === 5 ? 0.025 : 0.05); i ? maple.lineTo(Math.cos(a) * d, Math.sin(a) * d) : maple.moveTo(Math.cos(a) * d, Math.sin(a) * d); } }
    const prep = (s) => { const ge = new T.ShapeGeometry(s, 8); const p = ge.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, p.getX(k) ** 2 * 6 + p.getY(k) ** 2 * 2); ge.rotateX(-Math.PI / 2); ge.computeVertexNormals(); return ge; };
    const cols = [0xe8590c, 0xf08c00, 0xd9480f, 0xfab005, 0xc92a2a, 0xa0522d, 0xf59f00].map((c) => new T.Color(c));
    [[oval, 46], [maple, 34]].forEach(([s, N], gi) => {
      const im = new T.InstancedMesh(prep(s), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, side: T.DoubleSide, flatShading: true }), N);
      for (let i = 0; i < N; i++) {
        const a = r() * Math.PI * 2, d = Math.pow(r(), 0.7) * 0.95, sc = 0.9 + r() * 0.8;
        im.setMatrixAt(i, new T.Matrix4().compose(new T.Vector3(Math.cos(a) * d * 1.2, 0.004 + (i + gi * 50) * 0.0004, Math.sin(a) * d * 0.9), new T.Quaternion().setFromEuler(new T.Euler((r() - 0.5) * 0.25, r() * Math.PI * 2, (r() - 0.5) * 0.25)), new T.Vector3(sc, sc, sc)));
        im.setColorAt(i, cols[Math.floor(r() * cols.length)]);
      }
      im.castShadow = true; im.receiveShadow = true; g.add(im);
    });
    return { group: g };
  }

  function mountains() {
    const g = new T.Group();
    const peak = (x, z, h, rad, c, snow, seed) => {
      const geo = new T.ConeGeometry(rad, h, 9, 5); geo.translate(0, h / 2, 0);
      hjitter(geo, rad * 0.12, seed, true, (y) => 1 - y / h);
      const p = geo.attributes.position; for (let k = 0; k < p.count; k++) if (p.getY(k) < 0) p.setY(k, 0);
      geo.computeVertexNormals();
      const m = fm(geo, c, g, x, 0, z, { roughness: 1 }); m.castShadow = false;
      if (snow) { const cap = fm(new T.ConeGeometry(rad * 0.3, h * 0.3, 9, 1), 0xf8f9fc, g, x, h * 0.85 + 0.01, z, { roughness: 1 }); cap.scale.set(1.12, 1.0, 1.12); cap.castShadow = false; }
    };
    [[-5.2, -2.24, 6.5, 4.4, 0x9fa8da, 1], [-0.96, -2.52, 8.0, 5.0, 0xa5a9d8, 1], [3.68, -2.31, 7.0, 4.6, 0x98a2d6, 1], [6.88, -1.96, 5.0, 3.4, 0xb0b6e0, 0], [-7.36, -1.82, 4.6, 3.2, 0xb0b6e0, 0]].forEach((d, i) => peak(d[0], d[1], d[2], d[3], d[4], d[5], i + 3));
    [[-3.36, -0.56, 3.8, 3.6, 0x8fc1b5], [1.28, -0.7, 4.4, 3.8, 0x86b8ac], [5.44, -0.42, 3.4, 3.2, 0x9ccbbf], [-6.72, 0.0, 2.8, 2.6, 0x9ccbbf]].forEach((d, i) => peak(d[0], d[1], d[2], d[3], d[4], 0, i + 20));
    [[-4.96, 1.12, 1.8, 2.6, 0xa9d8a5], [-1.12, 1.26, 2.0, 3.0, 0xb2deaa], [3.04, 1.19, 1.7, 2.7, 0xa9d8a5], [6.56, 1.33, 1.4, 2.2, 0xb2deaa]].forEach((d, i) => peak(d[0], d[1], d[2], d[3], d[4], 0, i + 40));
    return { group: g };
  }

  ZAssets.register('nature', 'palm_tree', 'Coconut palm', palmTree, ['tree', 'palm', 'coconut', 'beach', 'outdoor']);
  ZAssets.register('nature', 'banyan_tree', 'Banyan tree with swing', banyanTree, ['tree', 'banyan', 'swing', 'village', 'outdoor']);
  ZAssets.register('nature', 'grass_patch', 'Grass patch', grassPatch, ['grass', 'lawn', 'nature', 'outdoor']);
  ZAssets.register('nature', 'pond', 'Lily pond', pond, ['pond', 'water', 'lotus', 'nature', 'outdoor']);
  ZAssets.register('nature', 'clouds', 'Clouds', cloudsProp, ['clouds', 'sky', 'weather', 'outdoor']);
  ZAssets.register('nature', 'sun_rainbow', 'Sun and rainbow', sunRainbow, ['sun', 'rainbow', 'sky', 'backdrop']);
  ZAssets.register('nature', 'butterflies', 'Butterflies', butterflies, ['butterfly', 'insects', 'garden', 'outdoor']);
  ZAssets.register('nature', 'birds_wire', 'Birds on a wire', birdsWire, ['birds', 'wire', 'pole', 'street', 'outdoor']);
  ZAssets.register('nature', 'fallen_leaves', 'Fallen leaves', fallenLeaves, ['leaves', 'autumn', 'ground', 'outdoor']);
  ZAssets.register('nature', 'mountains', 'Mountains backdrop', mountains, ['mountains', 'hills', 'backdrop', 'landscape']);
  /*@@NEW@@*/
})();
