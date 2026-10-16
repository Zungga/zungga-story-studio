/* Zungga Story Studio — nature props, ported from the Play-mode island (drive-portfolio/js/game.js):
 * the same low-poly tree species (oak, pine, birch, maple), bushes, rocks and flowers, built at story scale. */
(() => {
  'use strict';
  const { T, mat } = ZA;
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
})();
