/* Zungga Story Studio — seasonal trees & weather bits, ported from the Play-mode island (drive-portfolio/js/game.js
 * "Seasons + weather"): the same oak / pine / birch / maple / bush shapes as nature.js, recoloured with the game's
 * seasonTint() rules (spring blossom, summer green maple, autumn gold, winter frost), the snowy ground, frozen ice,
 * falling spring petals / autumn leaves, and an oak that runs through the four seasons. */
(() => {
  'use strict';
  const { T, mat } = ZA;
  const flat = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...o });
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  // welded jitter: vertices that share a position move together (no cracks between low-poly facets)
  function jitter(geo, amt, r) {
    const p = geo.attributes.position, seed = r() * 100, h = (a) => { const v = Math.sin(a * 12.9898 + seed * 78.233) * 43758.5453; return (v - Math.floor(v)) * 2 - 1; };
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k), key = Math.round(x * 997) + Math.round(y * 991) * 3.1 + Math.round(z * 983) * 7.3; p.setXYZ(k, x + h(key) * amt, y + h(key + 1.7) * amt, z + h(key + 3.3) * amt); }
    geo.computeVertexNormals(); return geo;
  }
  const M4 = (x, y, z, sx = 1, sy = sx, sz = sx, ry = 0) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(0, ry, 0)), new T.Vector3(sx, sy, sz));
  // game species (game.js lines 699–735)
  const SPECIES = {
    oak: { trunk: () => [[new T.CylinderGeometry(0.4, 0.6, 3.2, 7), M4(0, 1.6, 0)], [new T.CylinderGeometry(0.16, 0.24, 1.8, 5), M4(0.7, 3.0, 0)]],
      crown: (r) => [[jitter(new T.IcosahedronGeometry(2.4, 1), 0.3, r), M4(0, 4.8, 0)], [jitter(new T.IcosahedronGeometry(1.8, 1), 0.25, r), M4(1.6, 4.2, 0.6)], [jitter(new T.IcosahedronGeometry(1.7, 1), 0.25, r), M4(-1.4, 4.4, -0.7)], [jitter(new T.IcosahedronGeometry(1.5, 1), 0.2, r), M4(0.2, 6.1, 0.3)]],
      trunkCol: 0x5c3d24, crowns: [0x3f8f3a, 0x4c9a3c, 0x5aa646, 0x3a7f34] },
    pine: { trunk: () => [[new T.CylinderGeometry(0.28, 0.42, 3, 6), M4(0, 1.5, 0)]],
      crown: (r) => [[jitter(new T.ConeGeometry(2.6, 3.4, 8), 0.15, r), M4(0, 3.2, 0)], [jitter(new T.ConeGeometry(2.1, 3.0, 8), 0.15, r), M4(0, 5.0, 0, 1, 1, 1, 0.4)], [jitter(new T.ConeGeometry(1.5, 2.6, 8), 0.12, r), M4(0, 6.6, 0, 1, 1, 1, 0.8)], [new T.ConeGeometry(0.8, 1.8, 7), M4(0, 8.0, 0)]],
      trunkCol: 0x6b4423, crowns: [0x1f6f3a, 0x2b7a3f, 0x24603a, 0x317f45] },
    birch: { trunk: () => [[new T.CylinderGeometry(0.2, 0.28, 5.2, 6), M4(0, 2.6, 0)]],
      crown: (r) => [[jitter(new T.IcosahedronGeometry(1.5, 1), 0.2, r), M4(0, 5.6, 0, 1, 1.35, 1)], [jitter(new T.IcosahedronGeometry(1.1, 1), 0.18, r), M4(0.5, 4.6, 0.3, 1, 1.2, 1)]],
      trunkCol: 0xeceae2, crowns: [0x9cc94d, 0xb6d35a, 0x8dbf47] },
    maple: { trunk: () => [[new T.CylinderGeometry(0.32, 0.48, 3, 6), M4(0, 1.5, 0)]],
      crown: (r) => [[jitter(new T.DodecahedronGeometry(2.3, 0), 0.25, r), M4(0, 4.4, 0, 1.15, 0.95, 1.15)], [jitter(new T.DodecahedronGeometry(1.6, 0), 0.2, r), M4(0.9, 5.4, -0.4)]],
      trunkCol: 0x5a3a22, crowns: [0xe8590c, 0xf08c00, 0xd9480f, 0xf59f00, 0xc92a2a] },
    bush: { trunk: () => [],
      crown: (r) => [[jitter(new T.IcosahedronGeometry(1, 1), 0.15, r), M4(0, 0.52, 0, 0.75, 0.55, 0.75)], [jitter(new T.IcosahedronGeometry(1, 1), 0.15, r), M4(0.56, 0.4, 0.16, 0.52, 0.4, 0.52)], [jitter(new T.IcosahedronGeometry(1, 1), 0.15, r), M4(-0.48, 0.38, -0.08, 0.48, 0.38, 0.48)]],
      trunkCol: 0x5c3d24, crowns: [0x2f7d32, 0x3b8f3e, 0x4f9d48, 0x2c6e30] },
  };
  // the game's seasonTint (game.js 3555–3569); r is the per-crown random in 0..1
  const SNOW = new T.Color(0xf1f5f9), TMPC = new T.Color();
  function seasonTint(kind, key, out, r) {
    if (key === 'summer') return kind === 'maple' ? out.set(r < 0.5 ? 0x4c9a3c : 0x5aa646) : out;
    if (key === 'spring') {
      if (kind === 'maple' || (kind === 'oak' && r < 0.22) || (kind === 'bush' && r < 0.1)) return out.set([0xf783ac, 0xfcc2d7, 0xfaa2c1, 0xffdeeb][Math.floor(r * 40) % 4]);
      return kind === 'pine' ? out.offsetHSL(0, 0, 0.04) : out.lerp(TMPC.set(0x9be36b), 0.35);
    }
    if (key === 'autumn') {
      if (kind === 'pine') return out.offsetHSL(0, -0.05, -0.02);
      if (kind === 'maple') return out;
      if (kind === 'birch') return out.set(r < 0.5 ? 0xfcc419 : 0xffd43b);
      if (kind === 'oak') return out.set([0xe8590c, 0xf59f00, 0xd9480f, 0xfab005, 0xb5651d][Math.floor(r * 50) % 5]);
      return out.lerp(TMPC.set(0xb5651d), 0.45);
    }
    return kind === 'pine' ? out.lerp(SNOW, 0.45) : out.lerp(TMPC.set(0x8d7b6a), 0.4).lerp(SNOW, 0.7);
  }
  // per-crown r values chosen so each tree shows the season's typical mix (e.g. one pink crown on a spring oak)
  const RS = { oak: [0.5, 0.1, 0.62, 0.31], pine: [0.2, 0.4, 0.6, 0.8], birch: [0.3, 0.7, 0.5], maple: [0.3, 0.71, 0.5], bush: [0.4, 0.05, 0.7] };
  const SEASON_KEYS = ['spring', 'summer', 'autumn', 'winter'];
  const crownColors = (kind, key) => SPECIES[kind].crowns.slice(0, SPECIES[kind].crown(rng(1)).length).map((c, i) => seasonTint(kind, key, new T.Color(c), RS[kind][i] ?? 0.5));

  function snowDisc(parent, r) {   // the ground under a winter tree goes white (groundMat uSnow)
    const d = new T.Mesh(new T.CircleGeometry(r, 28), mat(0xeef2f8, { roughness: 1 })); d.rotation.x = -Math.PI / 2; d.position.y = 0.012; d.receiveShadow = true; parent.add(d);
  }
  let seedN = 501;
  function buildTree(kind, key, scale = 0.62) {
    const sp = SPECIES[kind], r = rng(seedN += 97), g = new T.Group(), inner = new T.Group(); inner.scale.setScalar(kind === 'bush' ? 1 : scale); g.add(inner);
    const tcol = new T.Color(sp.trunkCol); if (key === 'winter' && kind !== 'birch') tcol.lerp(TMPC.set(0x8d7b6a), 0.2);
    for (const [geo, m] of sp.trunk()) { const me = new T.Mesh(geo.applyMatrix4(m), flat(tcol)); me.castShadow = true; me.receiveShadow = true; inner.add(me); }
    const cols = crownColors(kind, key), mats = [];
    sp.crown(r).forEach(([geo, m], i) => { const mm = flat(cols[i]); mats.push(mm); const me = new T.Mesh(geo.applyMatrix4(m), mm); me.castShadow = true; me.receiveShadow = true; inner.add(me); });
    if (key === 'winter') snowDisc(g, kind === 'bush' ? 1.0 : 2.2);
    return { g, mats };
  }
  const tree = (kind, key) => () => ({ group: buildTree(kind, key).g });

  // an oak that runs through spring → summer → autumn → winter (blending like paintFoliage); setOn(true) holds winter
  function seasonCycle() {
    const { g, mats } = buildTree('oak', 'summer'), table = SEASON_KEYS.map((k) => crownColors('oak', k));
    const snow = new T.Mesh(new T.CircleGeometry(2.2, 28), new T.MeshStandardMaterial({ color: 0xeef2f8, roughness: 1, transparent: true, opacity: 0 })); snow.rotation.x = -Math.PI / 2; snow.position.y = 0.012; g.add(snow);
    let hold = false; const PER = 6;   // seconds per season; 1 s blend at the end of each
    const paint = (a, b, k) => mats.forEach((m, i) => m.color.copy(table[a][i]).lerp(table[b][i], k));
    paint(1, 1, 1);
    g.userData.setOn = (on) => { hold = !!on; if (hold) { paint(3, 3, 1); snow.material.opacity = 1; } };
    g.userData.tick = (t) => {
      if (hold) return;
      const u = t / PER, i = Math.floor(u) % 4, f = u - Math.floor(u), k = f < 0.83 ? 0 : (f - 0.83) / 0.17, s = k * k * (3 - 2 * k), j = (i + 1) % 4;
      paint(i, j, s); snow.material.opacity = (i === 3 ? 1 - s : 0) + (j === 3 ? s : 0);
    };
    return { group: g };
  }

  /* ---------- snowy ground, frozen ice ---------- */
  function snowPatch() {
    const g = new T.Group(), r = rng(66);
    const base = new T.CircleGeometry(2, 40), p = base.attributes.position;
    for (let k = 1; k < p.count; k++) { const f = 0.9 + r() * 0.2; p.setXY(k, p.getX(k) * f, p.getY(k) * f); }
    const d = new T.Mesh(base, mat(0xeef2f8, { roughness: 1 })); d.rotation.x = -Math.PI / 2; d.position.y = 0.01; d.receiveShadow = true; g.add(d);
    for (let i = 0; i < 6; i++) { const m = new T.Mesh(jitter(new T.IcosahedronGeometry(1, 1), 0.08, r), flat(i % 2 ? 0xf1f5f9 : 0xe7edf5)); const a = i * 1.05 + r(), rad = 0.4 + r() * 1.1; m.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad); const s = 0.25 + r() * 0.3; m.scale.set(s * 1.3, s * 0.45, s); m.castShadow = true; m.receiveShadow = true; g.add(m); }
    return { group: g };
  }
  function frozenIce() {
    const g = new T.Group(), r = rng(12);
    const iceTex = ZA.tex((c, w, h) => { c.fillStyle = '#cfe8f7'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 3; for (let k = 0; k < 18; k++) { let x = r() * w, y = r() * h; c.beginPath(); c.moveTo(x, y); for (let s = 0; s < 4; s++) { x += (r() - 0.5) * 140; y += (r() - 0.5) * 140; c.lineTo(x, y); } c.stroke(); } c.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 40; k++) { c.beginPath(); c.ellipse(r() * w, r() * h, 20 + r() * 60, 6 + r() * 10, r() * 3, 0, 6.3); c.fill(); } }, 512, 512);
    const ice = new T.Mesh(new T.CircleGeometry(2.5, 48), new T.MeshStandardMaterial({ map: iceTex, roughness: 0.15, metalness: 0.1 })); ice.rotation.x = -Math.PI / 2; ice.position.y = 0.03; ice.scale.set(1.4, 1, 1); ice.receiveShadow = true; g.add(ice);
    const rim = new T.Mesh(new T.TorusGeometry(2.55, 0.12, 6, 48), flat(0xeef2f8)); rim.rotation.x = Math.PI / 2; rim.scale.set(1.4, 1, 1); rim.position.y = 0.03; g.add(rim);
    return { group: g };
  }

  /* ---------- drifting spring petals / autumn leaves (game "drift" shader, pure in t) ---------- */
  function drift(leaf) {
    return () => {
      const group = new T.Group(), r = rng(leaf ? 9 : 19), N = 160, BW = 4, BH = 4, pos = new Float32Array(N * 3), seed = new Float32Array(N);
      for (let k = 0; k < N; k++) { pos.set([(r() - 0.5) * BW, r() * BH, (r() - 0.5) * BW], k * 3); seed[k] = r(); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new T.BufferAttribute(seed, 1));
      const m = new T.ShaderMaterial({
        transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 }, uLeaf: { value: leaf ? 1 : 0 } },
        vertexShader: `attribute float aSeed; uniform float uTime; varying float vRot; varying float vS;
          void main(){
            vec3 p = position;
            p.y = mod(p.y - uTime * (0.35 + aSeed * 0.3), ${BH.toFixed(1)});
            p.x += sin(uTime * 0.8 + aSeed * 50.0) * 0.4; p.z += cos(uTime * 0.6 + aSeed * 37.0) * 0.4;
            vRot = uTime * (1.5 + aSeed * 3.0) + aSeed * 20.0; vS = fract(aSeed * 91.3);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = clamp(150.0 / max(-mv.z, 0.5), 1.5, 22.0);
            gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform float uLeaf; varying float vRot; varying float vS;
          void main(){
            vec2 c = gl_PointCoord - 0.5; float s = sin(vRot), co = cos(vRot);
            c = mat2(co, -s, s, co) * c; c.x *= 2.2 * (0.6 + 0.4 * abs(sin(vRot * 0.7)));
            if (length(c) > 0.5) discard;
            vec3 petal = mix(vec3(1.0, 0.62, 0.78), vec3(1.0, 0.86, 0.92), vS);
            vec3 leaf = mix(vec3(0.91, 0.35, 0.05), vec3(0.98, 0.69, 0.13), vS);
            gl_FragColor = vec4(mix(petal, leaf, uLeaf), 0.95); }`,
      });
      const pts = new T.Points(geo, m); pts.frustumCulled = false; group.add(pts);
      group.userData.tick = (t) => { m.uniforms.uTime.value = t; };
      return { group };
    };
  }

  const R = (id, label, fn, tags) => ZAssets.register('seasons', id, label, fn, tags);
  R('spring_blossom_tree', 'Spring blossom tree (pink)', tree('maple', 'spring'), ['tree', 'spring', 'blossom', 'pink', 'season']);
  R('spring_oak', 'Spring oak (fresh green, a pink bough)', tree('oak', 'spring'), ['tree', 'spring', 'oak', 'season']);
  R('spring_birch', 'Spring birch', tree('birch', 'spring'), ['tree', 'spring', 'birch', 'season']);
  R('spring_pine', 'Spring pine', tree('pine', 'spring'), ['tree', 'spring', 'pine', 'season']);
  R('spring_bush', 'Spring bush (with blossom)', tree('bush', 'spring'), ['bush', 'spring', 'season']);
  R('summer_maple', 'Summer maple (green)', tree('maple', 'summer'), ['tree', 'summer', 'maple', 'season']);
  R('autumn_oak', 'Autumn oak (orange & gold)', tree('oak', 'autumn'), ['tree', 'autumn', 'oak', 'season', 'fall']);
  R('autumn_birch', 'Autumn birch (yellow)', tree('birch', 'autumn'), ['tree', 'autumn', 'birch', 'season', 'fall']);
  R('autumn_pine', 'Autumn pine', tree('pine', 'autumn'), ['tree', 'autumn', 'pine', 'season']);
  R('autumn_bush', 'Autumn bush (brown)', tree('bush', 'autumn'), ['bush', 'autumn', 'season', 'fall']);
  R('winter_oak', 'Winter oak (frosted)', tree('oak', 'winter'), ['tree', 'winter', 'snow', 'oak', 'season']);
  R('winter_pine', 'Snowy pine', tree('pine', 'winter'), ['tree', 'winter', 'snow', 'pine', 'christmas', 'season']);
  R('winter_birch', 'Winter birch (frosted)', tree('birch', 'winter'), ['tree', 'winter', 'snow', 'birch', 'season']);
  R('winter_maple', 'Winter maple (frosted)', tree('maple', 'winter'), ['tree', 'winter', 'snow', 'maple', 'season']);
  R('winter_bush', 'Snowy bush', tree('bush', 'winter'), ['bush', 'winter', 'snow', 'season']);
  R('season_cycle_tree', 'Four-seasons oak (changes colour)', seasonCycle, ['tree', 'seasons', 'spring', 'summer', 'autumn', 'winter']);
  R('snow_patch', 'Snowy ground patch', snowPatch, ['snow', 'winter', 'ground']);
  R('frozen_ice', 'Frozen ice sheet', frozenIce, ['ice', 'frozen', 'winter', 'river']);
  R('falling_petals', 'Falling blossom petals', drift(false), ['petals', 'blossom', 'spring', 'falling']);
  R('falling_leaves', 'Falling autumn leaves', drift(true), ['leaves', 'autumn', 'falling', 'fall']);
})();
