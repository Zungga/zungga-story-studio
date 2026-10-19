/* Zungga Chocolate Factory — GROUND FLOOR (factory city): terrain + chocolate river, cookie roads, bridges, the train
 * loop, the Main Plaza, the entrance, the garden, the station and the shells of every building (interiors are dressed
 * by ZFactory.dress[<id>] — see dress-ground.js). Built with the world kit (studio/js/world-kit.js). */
(() => {
  'use strict';
  const T = THREE;
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const segDist = (x, z, ax, az, bx, bz) => { const vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz))); return Math.hypot(x - ax - vx * t, z - az - vz * t); };
  const polyDist = (x, z, pts, closed) => { let d = Infinity; for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; d = Math.min(d, segDist(x, z, a[0], a[1], b[0], b[1])); } return d; };
  function rrect(x0, z0, x1, z1, r, n = 6) {
    const out = [], cs = [[x1 - r, z0 + r, -Math.PI / 2], [x1 - r, z1 - r, 0], [x0 + r, z1 - r, Math.PI / 2], [x0 + r, z0 + r, Math.PI]];
    for (const [cx, cz, a0] of cs) for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI / 2; out.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); }
    return out;
  }
  // canvas textures
  function cookieTex() {
    const t = ZA.tex((c, W, H) => {
      c.fillStyle = '#d9a86c'; c.fillRect(0, 0, W, H);
      const n = 4, s = W / n;
      for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) {
        const x = i * s + 5, y = k * s + 5, w = s - 10; c.fillStyle = (i + k) % 2 ? '#e8bd7e' : '#dfb072'; c.beginPath(); c.roundRect(x, y, w, w, 14); c.fill();
        c.strokeStyle = 'rgba(120,70,30,0.35)'; c.lineWidth = 3; c.stroke();
        for (let d = 0; d < 5; d++) { c.fillStyle = '#5b3420'; c.beginPath(); c.arc(x + 14 + ((d * 37 + i * 13 + k * 7) % (w - 28)), y + 14 + ((d * 53 + k * 19) % (w - 28)), 4 + (d % 3), 0, Math.PI * 2); c.fill(); }
      }
    }, 512, 512);
    t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }
  function grassTex() {
    const t = ZA.tex((c, W, H) => { c.fillStyle = '#7fbf55'; c.fillRect(0, 0, W, H); for (let i = 0; i < 2600; i++) { c.fillStyle = ['#74b54c', '#8acb5e', '#6aa944', '#94d168'][i % 4]; c.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 3, 5 + Math.random() * 7); } }, 512, 512);
    t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }
  function stoneTex(base = '#b98b5e', line = '#8a5f3a') {
    const t = ZA.tex((c, W, H) => { c.fillStyle = base; c.fillRect(0, 0, W, H); c.strokeStyle = line; c.lineWidth = 4; const rows = 6; for (let r = 0; r < rows; r++) { const y = r * H / rows; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); for (let k = 0; k < 4; k++) { const x = ((k + (r % 2) * 0.5) * W / 4) % W; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + H / rows); c.stroke(); } } }, 256, 256);
    t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }

  function build(W) {
    const L = ZFactory.layout, G = L.ground, c = W.frame('ground'), M = W.M;
    W.lamps = []; const lamp = (f, x, z, h) => { const [wx, wz] = f.W(x, z); W.lamps.push([wx, f.oy + h, wz]); };   // for night mode
    const riv = G.river, RW = riv.width / 2;
    // ---------- terrain ----------
    function riverD(x, z) { return polyDist(x, z, riv.points, false); }
    function height(x, z) {
      if (Math.hypot(x - G.shaft.x, z - G.shaft.z) < G.shaft.r + 0.3) return -1e9;   // the secret shaft goes straight through the ground
      const d = Math.min(riverD(x, z), Math.hypot(x - G.pool.x, z - G.pool.z) - (G.pool.r - RW), Math.hypot(x - riv.points[0][0], z - riv.points[0][1]) - (6 - RW));
      if (d > RW + 1.0) return 0;
      return riv.bed * (1 - smooth(RW - 0.3, RW + 1.0, d));
    }
    W.terrain(height, L.bounds.x0 - 8, L.bounds.z0 - 8, L.bounds.x1 + 8, L.bounds.z1 + 8);
    {
      const Bd = L.bounds, SX = Bd.x1 - Bd.x0 + 16, SZ = Bd.z1 - Bd.z0 + 16, geo = new T.PlaneGeometry(SX, SZ, Math.round(SX / 0.6), Math.round(SZ / 0.6)); geo.rotateX(-Math.PI / 2); geo.translate((Bd.x0 + Bd.x1) / 2, 0, (Bd.z0 + Bd.z1) / 2);
      const P = geo.attributes.position, col = [];
      const grass = new T.Color(0xffffff), mud = new T.Color(0x8a5a3a), wet = new T.Color(0x6b4026);
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i), z = P.getZ(i), y = height(x, z); P.setY(i, y);
        const k = smooth(-0.05, -1.0, y), cc = grass.clone().lerp(y < -0.9 ? wet : mud, Math.min(1, k * 1.4)); col.push(cc.r, cc.g, cc.b);
      }
      geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
      const gt = grassTex(); gt.repeat.set(SX / 6, SZ / 6);
      const me = new T.Mesh(geo, new T.MeshStandardMaterial({ map: gt, vertexColors: true, roughness: 0.95 })); me.receiveShadow = true; me.userData.noBake = true; c.g.add(me);
      // the factory is an island: open flat land outside the walls, a sandy beach, then the ocean all round to the misty horizon
      const icx = (L.bounds.x0 + L.bounds.x1) / 2, icz = (L.bounds.z0 + L.bounds.z1) / 2, IR = (a) => 245 + 10 * Math.sin(3 * a + 0.6) + 6 * Math.sin(7 * a + 2.1) + 4 * Math.sin(11 * a);
      W.island = { x: icx, z: icz, R: IR };
      { const N = 240, sh = new T.Shape(); for (let k = 0; k <= N; k++) { const a = k / N * Math.PI * 2, r = IR(a); const x = Math.cos(a) * r, y = -Math.sin(a) * r; k ? sh.lineTo(x, y) : sh.moveTo(x, y); }
        const lg = new T.ShapeGeometry(sh, 2); lg.rotateX(-Math.PI / 2); const gt2 = grassTex(); gt2.repeat.set(70, 70);
        const uvs = lg.attributes.uv; for (let k = 0; k < uvs.count; k++) uvs.setXY(k, (uvs.getX(k) + 260) / 520, (uvs.getY(k) + 260) / 520);
        const land = new T.Mesh(lg, new T.MeshStandardMaterial({ map: gt2, color: 0xb9dd8c, roughness: 1 })); land.position.set(icx, -0.06, icz); land.receiveShadow = true; land.userData.noBake = true; c.g.add(land);
        // beach: sand sloping from the grass down under the water
        const pos = [], idx = [], col = [], sandC = new T.Color(0xf1dfae), wetC = new T.Color(0xc9ae7c), BW = 26, RS = 4;
        for (let k = 0; k <= N; k++) { const a = k / N * Math.PI * 2, r0 = IR(a); for (let j2 = 0; j2 <= RS; j2++) { const u = j2 / RS, r = r0 - 2 + u * BW, y = -0.04 - Math.pow(u, 1.4) * 1.6; pos.push(icx + Math.cos(a) * r, y, icz - Math.sin(a) * r); const cc = sandC.clone().lerp(wetC, Math.min(1, u * 1.6)); col.push(cc.r, cc.g, cc.b); } }
        for (let k = 0; k < N; k++) for (let j2 = 0; j2 < RS; j2++) { const a0 = k * (RS + 1) + j2, b0 = a0 + RS + 1; idx.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1); }
        const bg = new T.BufferGeometry(); bg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); bg.setAttribute('color', new T.Float32BufferAttribute(col, 3)); bg.setIndex(idx); bg.computeVertexNormals();
        const beach = new T.Mesh(bg, new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: T.DoubleSide })); beach.receiveShadow = true; beach.userData.noBake = true; c.g.add(beach);
        // ocean: rippling blue (a scrolling bump texture), deeper colour far out, foam lapping at the shore
        const waveTex = ZA.tex((cx2, w, h) => { cx2.fillStyle = '#808080'; cx2.fillRect(0, 0, w, h); for (let k = 0; k < 900; k++) { const x = Math.random() * w, y = Math.random() * h, rr = 3 + Math.random() * 14, g2 = cx2.createRadialGradient(x, y, 0, x, y, rr), v = Math.random() < 0.5 ? 255 : 0; g2.addColorStop(0, `rgba(${v},${v},${v},0.22)`); g2.addColorStop(1, `rgba(${v},${v},${v},0)`); cx2.fillStyle = g2; for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) cx2.fillRect(x + ox - rr, y + oy - rr, rr * 2, rr * 2); } }, 256, 256);
        waveTex.wrapS = waveTex.wrapT = T.RepeatWrapping; waveTex.repeat.set(160, 160); const wave2 = waveTex.clone(); wave2.needsUpdate = true; wave2.repeat.set(97, 97);
        const deep = ZA.tex((cx2, w, h) => { const g2 = cx2.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g2.addColorStop(0, '#5fd0e6'); g2.addColorStop(0.16, '#36a9d8'); g2.addColorStop(0.45, '#1f7fbf'); g2.addColorStop(1, '#18609e'); cx2.fillStyle = g2; cx2.fillRect(0, 0, w, h); }, 256, 256);
        const seaM = new T.MeshStandardMaterial({ map: deep, bumpMap: waveTex, bumpScale: 1.2, roughness: 0.22, metalness: 0.15 }), sea = new T.Mesh(new T.CircleGeometry(1700, 96), seaM);
        sea.rotation.x = -Math.PI / 2; sea.position.set(icx, -0.55, icz); sea.receiveShadow = true; sea.userData.noBake = true; c.g.add(sea);
        const foamPos = [], foamIdx = []; for (let k = 0; k <= N; k++) { const a = k / N * Math.PI * 2, r = IR(a) - 2 + 0.62 * 26; for (const d of [-1.6, 2.2]) foamPos.push(Math.cos(a) * (r + d), 0, -Math.sin(a) * (r + d)); } for (let k = 0; k < N; k++) { const a0 = k * 2; foamIdx.push(a0, a0 + 2, a0 + 1, a0 + 1, a0 + 2, a0 + 3); }
        const fg = new T.BufferGeometry(); fg.setAttribute('position', new T.Float32BufferAttribute(foamPos, 3)); fg.setIndex(foamIdx);
        const foam = new T.Mesh(fg, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false, side: T.DoubleSide })); foam.position.set(icx, -0.5, icz); foam.userData.noBake = true; c.g.add(foam);
        c.tick((t) => { waveTex.offset.set(t * 0.012, t * 0.007); wave2.offset.set(-t * 0.009, t * 0.011); const w2 = Math.sin(t * 0.8); sea.position.y = -0.55 + w2 * 0.06; foam.position.y = -0.5 + w2 * 0.06; foam.scale.setScalar(1 + w2 * 0.004); foam.material.opacity = 0.32 + (w2 + 1) * 0.16; }, sea); }
    }
    // ---------- water ----------
    c.water(riv.points, riv.width, riv.surf, { overlap: 1.9, flow: 0.7, rep: 1 });
    c.pool(G.pool.x, G.pool.z, G.pool.r * 2 + 1.6, G.pool.r * 2 + 1.6, riv.surf, { round: true, flow: 0.9 });
    { const [sx0, sz0] = riv.points[0]; c.pool(sx0, sz0, 13, 13, riv.surf, { round: true, flow: 0.4 }); W.spring = { x: sx0, z: sz0, r: 6 }; }   // the chocolate spring where the river starts

    // ---------- roads ----------
    const cookie = cookieTex(), roadM = new T.MeshStandardMaterial({ map: cookie, roughness: 0.85 });
    function ribbon(pts, w, { closed = false, y = 0.035, mat = roadM, rep = 1 } = {}) {
      const P = closed ? [...pts, pts[0]] : pts, pos = [], uv = [], idx = []; let acc = 0;
      const dense = []; for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 1)); for (let k = 0; k < n; k++) dense.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]); } dense.push(P[P.length - 1]);
      let vi = 0, prevOk = false;
      for (let i = 0; i < dense.length; i++) {
        const [x, z] = dense[i], [px, pz] = dense[Math.max(0, i - 1)], [nx, nz] = dense[Math.min(dense.length - 1, i + 1)], tx = nx - px, tz = nz - pz, tl = Math.hypot(tx, tz) || 1, sx = -tz / tl, sz = tx / tl;
        if (i) acc += Math.hypot(x - px, z - pz);
        const ok = height(x + sx * w / 2, z + sz * w / 2) > -0.02 && height(x - sx * w / 2, z - sz * w / 2) > -0.02 && height(x, z) > -0.02;
        pos.push(x + sx * w / 2, y, z + sz * w / 2, x - sx * w / 2, y, z - sz * w / 2); uv.push(0, acc / w * rep, rep, acc / w * rep);
        if (i && ok && prevOk) idx.push(vi - 2, vi, vi - 1, vi - 1, vi, vi + 1);
        prevOk = ok; vi += 2;
      }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      const n = geo.attributes.normal; if (n.count && n.getY(0) < 0) { idx.reverse(); geo.setIndex(idx); geo.computeVertexNormals(); }
      const me = new T.Mesh(geo, mat); me.receiveShadow = true; c.g.add(me); return me;
    }
    const lp = G.boulevard.loop; const loopPts = rrect(lp.x0, lp.z0, lp.x1, lp.z1, lp.r, 8);
    ribbon(loopPts, lp.w, { closed: true });
    for (const p of G.paths) ribbon(p, p === G.paths[0] || p === G.paths[1] ? 7 : 3.8, { y: 0.04 });
    // plaza: paved disc + road ring
    { const ring = new T.Mesh(new T.RingGeometry(G.plaza.ring[0], G.plaza.ring[1], 72, 1), roadM); ring.rotation.x = -Math.PI / 2; ring.position.set(G.plaza.x, 0.036, G.plaza.z); ring.receiveShadow = true; c.g.add(ring);
      const st = stoneTex('#e9c99a', '#c79d6a'); st.repeat.set(5, 5); const disc = new T.Mesh(new T.CircleGeometry(G.plaza.r, 64), new T.MeshStandardMaterial({ map: st, roughness: 0.8 })); disc.rotation.x = -Math.PI / 2; disc.position.set(G.plaza.x, 0.04, G.plaza.z); disc.receiveShadow = true; c.g.add(disc);
      const op = G.entrance.outer, disc2 = new T.Mesh(new T.CircleGeometry(op.r, 48), disc.material); disc2.rotation.x = -Math.PI / 2; disc2.position.set(op.x, 0.04, op.z); disc2.receiveShadow = true; c.g.add(disc2); }

    // ---------- occupancy (for scattering trees, lamps) ----------
    const blocks = [...G.buildings.map((b) => [b.x, b.z, b.w / 2 + 1.5, b.d / 2 + 1.5]), [G.station.x, G.station.z, G.station.w / 2 + 1, G.station.d / 2 + 1.5], [G.garden.x, G.garden.z, G.garden.w / 2 + 0.5, G.garden.d / 2 + 0.5], [G.entrance.x, G.entrance.z, G.entrance.w / 2 + 1, 5], ...G.towers.map((t) => [t.x, t.z, 4.5, 4.5]), [G.shaft.x, G.shaft.z, 3, 3]];
    const trackPts = rrect(G.track.x0, G.track.z0, G.track.x1, G.track.z1, G.track.r, 8);
    function free(x, z, m = 0) {
      if (x < L.bounds.x0 + 2.5 + m || x > L.bounds.x1 - 2.5 - m || z < L.bounds.z0 + 2.5 + m || z > L.bounds.z1 - 2.5 - m) return false;
      if (riverD(x, z) < RW + 1.6 + m || Math.hypot(x - G.pool.x, z - G.pool.z) < G.pool.r + 1.6 + m) return false;
      if (polyDist(x, z, loopPts, true) < lp.w / 2 + 1 + m) return false;
      if (polyDist(x, z, trackPts, true) < 2.2 + m) return false;
      for (const p of G.paths) if (polyDist(x, z, p, false) < 2.4 + m) return false;
      if (Math.hypot(x - G.plaza.x, z - G.plaza.z) < G.plaza.ring[1] + 1 + m || Math.hypot(x - G.entrance.outer.x, z - G.entrance.outer.z) < G.entrance.outer.r + 1 + m) return false;
      for (const [bx, bz, hx, hz] of blocks) if (Math.abs(x - bx) < hx + m && Math.abs(z - bz) < hz + m) return false;
      for (const [cx, cz] of G.deckColumns || []) if (Math.hypot(x - cx, z - cz) < 1.6 + m) return false;
      for (const b of W.bridgeZones || []) if (Math.hypot(x - b.x, z - b.z) < b.r + m) return false;
      if (Math.hypot(x - riv.points[0][0], z - riv.points[0][1]) < 8.5 + m) return false;
      return true;
    }
    W.free = free;

    // ---------- bridges: climb up, cross high over the river (swim underneath), climb down ----------
    const woodM = M(0xa86b3c), woodD = M(0x7a4a26), stoneM = M(0xe2c49a), candyM = M(0xf472b6);
    const riverTan = (x, z) => { let best = null, bd = 1e9; const P = riv.points; for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz))), d = Math.hypot(x - ax - vx * t, z - az - vz * t); if (d < bd) { bd = d; const L2 = Math.hypot(vx, vz); best = { x: ax + vx * t, z: az + vz * t, tx: vx / L2, tz: vz / L2 }; } } return best; };
    W.bridgeZones = [];
    for (const b of G.bridges) {
      const rt = riverTan(b.x, b.z), ry = Math.atan2(-rt.tz, rt.tx);   // the bridge runs across the river: its local z = (sin ry, cos ry) ⟂ the flow
      const road = b.kind !== 'wood', w = b.kind === 'grand' ? 8 : road ? 7 : 3.2, H = b.kind === 'grand' ? 2.8 : 2.5, span = riv.width + 3.4, half = span / 2;
      const f = c.frame(rt.x, rt.z, ry), mat = b.kind === 'wood' ? woodM : b.kind === 'grand' ? stoneM : stoneM, trim = b.kind === 'wood' ? woodD : b.kind === 'grand' ? M(0x7c3aed) : M(0x5b2a86);
      // deck high over the water
      f.box(w, 0.4, span, 0, H - 0.4, 0, mat, { cast: true });
      let reach;
      if (road) {   // gentle ramps for the roads
        const Lr = H / Math.tan(0.3); reach = half + Lr;
        for (const sz of [-1, 1]) f.ramp(w, Lr, 0, sz * (half + Lr / 2), sz < 0 ? 0.03 : H, sz < 0 ? H : 0.03, mat, { thick: 0.4 });
      } else {        // steps for the footbridges
        const st1 = f.stairs({ x: 0, z: half + H / 0.17 * 0.3, y0: 0, y1: H, w, ry: 0, rise: 0.17, run: 0.3, mat: 0xb07a45, side: 0x7a4a26, rails: false });
        f.stairs({ x: 0, z: -half - H / 0.17 * 0.3, y0: 0, y1: H, w, ry: Math.PI, rise: 0.17, run: 0.3, mat: 0xb07a45, side: 0x7a4a26, rails: false }); reach = half + st1.n * 0.3;
      }
      // arched sides (the classic bridge look) + railings along the whole length
      const sh = new T.Shape(); sh.moveTo(-reach, 0); sh.lineTo(-half, H); sh.lineTo(half, H); sh.lineTo(reach, 0); sh.lineTo(half - 0.2, 0);
      sh.absellipse(0, 0, half - 0.2, H - 0.75, 0, Math.PI, false); sh.lineTo(-reach, 0);
      for (const sx of [-1, 1]) {
        const side = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.35, bevelEnabled: false }), trim); side.rotation.y = Math.PI / 2; side.position.set(sx * (w / 2 + 0.02) - (sx > 0 ? 0 : 0.35) + 0.175 * 0, 0, 0); side.position.x = sx * (w / 2) + (sx > 0 ? 0 : -0.35) + 0.0; side.castShadow = true; f.g.add(side);
        const railY = 1.05, pts = [[-reach, 0], [-half, H], [half, H], [reach, 0]];
        for (let k = 0; k < 3; k++) { const [z0, y0] = pts[k], [z1, y1] = pts[k + 1], L2 = Math.hypot(z1 - z0, y1 - y0); const rl = new T.Mesh(new T.BoxGeometry(0.14, 0.12, L2), trim); rl.position.set(sx * (w / 2 - 0.05), (y0 + y1) / 2 + railY, (z0 + z1) / 2); rl.rotation.x = -Math.atan2(y1 - y0, z1 - z0); f.g.add(rl);
          const n = Math.max(2, Math.round(L2 / 1.2)); for (let q = 0; q <= n; q++) { const zz = z0 + (z1 - z0) * q / n, yy = y0 + (y1 - y0) * q / n; f.box(0.1, railY, 0.1, sx * (w / 2 - 0.05), yy, zz, trim, { col: false, cast: false }); }
          const [cx2, cz2] = f.W(sx * (w / 2 - 0.05), (z0 + z1) / 2);   // rail colliders follow the slope
          W.cols.length; ZWorldAddRail(W, cx2, cz2, Math.abs(z1 - z0) / 2, ry, f.oy + (k === 1 ? H - 0.4 : Math.min(y0, y1)), y0 < y1 ? f.oy + y0 + railY : f.oy + y1 + railY, y0 < y1 ? f.oy + y1 + railY : f.oy + y0 + railY, z1 > z0 ? (y1 > y0) : (y0 > y1));
        }
        if (b.kind === 'grand') for (const sz of [-1, 1]) { f.cyl(0.12, 0.12, 2.8, sx * (w / 2 - 0.05), H, sz * half, 0x3b2416, { col: false }); const gl = new T.Mesh(new T.SphereGeometry(0.28, 16, 12), M(0xfff1c9, { emissive: 0xffd27a, emissiveIntensity: 1.2 })); gl.position.set(sx * (w / 2 - 0.05), H + 3.0, sz * half); f.g.add(gl); }
      }
      // stone abutments on both banks (solid, under the ends of the deck)
      for (const sz of [-1, 1]) f.box(w + 0.8, H - 0.4, 1.2, 0, 0, sz * (half + 0.4), M(0xb8956a), { cast: false });
      W.bridgeZones.push({ x: rt.x, z: rt.z, r: reach + 2, ry, w });
    }
    // two little chocolate boats bobbing along the river
    for (const [i, seg] of [[0, 3], [1, 8]]) {
      const bt = new T.Group(); const hull = new T.Mesh(ZA.roundBox(1.1, 0.45, 2.4, 0.2), M(i ? 0xec4899 : 0xfacc15)); hull.position.y = 0.1; bt.add(hull); const seat = new T.Mesh(new T.BoxGeometry(0.9, 0.12, 0.4), M(0xffffff)); seat.position.set(0, 0.35, 0.3); bt.add(seat);
      bt.userData.dynamic = true; c.g.add(bt);
      const curve = new T.CatmullRomCurve3(riv.points.map(([x, z]) => new T.Vector3(x, riv.surf, z)));
      c.tick((t) => { const u = ((t * 0.012 + seg * 0.09) % 0.86) + 0.04, p = curve.getPointAt(u), tg = curve.getTangentAt(u); bt.position.set(p.x + (i ? 0.8 : -0.8) * tg.z, riv.surf - 0.05 + Math.sin(t * 2 + i) * 0.04, p.z - (i ? 0.8 : -0.8) * tg.x); bt.rotation.y = Math.atan2(tg.x, tg.z); bt.rotation.z = Math.sin(t * 1.6 + i) * 0.04; }, bt);
    }

    // ---------- perimeter wall + corner towers ----------
    { const B = L.bounds, wm = new T.MeshStandardMaterial({ map: stoneTex('#c08a5a', '#8a5a33'), roughness: 0.9 }), h = G.wall.h;
      wm.map.repeat.set(8, 1);
      const top = M(0x7c3aed);
      const run = (x1, z1, x2, z2) => { c.wall(x1, z1, x2, z2, { h, t: 0.8, mat: wm }); const L2 = Math.hypot(x2 - x1, z2 - z1), n = Math.floor(L2 / 2.4); for (let i = 0; i < n; i += 2) { const k = (i + 0.5) / n; c.box(1.0, 0.6, 1.0, x1 + (x2 - x1) * k, h, z1 + (z2 - z1) * k, top, { col: false, cast: false }); } };
      run(B.x0, B.z0, B.x1, B.z0); run(B.x1, B.z0, B.x1, B.z1); run(B.x0, B.z1, -4, B.z1); run(4, B.z1, B.x1, B.z1); run(B.x0, B.z0, B.x0, B.z1);
      // south gate (closed iron gate between two pillars) — the way in from outside
      for (const sx of [-1, 1]) { c.cyl(1.1, 1.2, 4.6, sx * 4.6, 0, B.z1, 0xb7793f); c.cyl(0.9, 1.15, 1.4, sx * 4.6, 4.6, B.z1, 0x6d28d9, { col: false }); }
      // two iron gate leaves that swing open for the school bus (and for you)
      for (const sx of [-1, 1]) { const leaf = new T.Group(); for (let i = 0; i < 8; i++) { const b2 = new T.Mesh(new T.BoxGeometry(0.08, 3.1, 0.08), M(0x3b2416)); b2.position.set(-1.75 + i * 0.5, 1.55, 0); leaf.add(b2); } for (const yy of [0.4, 3.0]) { const r2 = new T.Mesh(new T.BoxGeometry(3.9, 0.14, 0.12), M(0x3b2416)); r2.position.set(0, yy, 0); leaf.add(r2); } const zb = new T.Mesh(new T.CircleGeometry(0.5, 24), new T.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.5, roughness: 0.3, side: T.DoubleSide })); zb.position.set(sx * 1.1, 1.8, 0.07); leaf.add(zb);
        const D = c.frame(sx * 2, B.z1, sx < 0 ? 0 : Math.PI).door({ x: 0, z: 0, w: 4, h: 3.2, kind: 'swing', auto: true, mesh: leaf, swing: -1, range: 7 }); W.busGate = (W.busGate || []).concat(D); }
      // the bus road from the gate out into the countryside, and the bus stop just inside
      ribbon([[0, B.z1 + 90], [0, B.z1 - 3]], 7, { y: 0.03 });
        // the road runs on to the beach and ends at a little wooden pier
        { const IS = W.island, ez = IS.z + IS.R(-Math.PI / 2), pf = c.frame(0, ez, 0); ribbon([[0, L.bounds.z1 + 88], [0, ez - 1]], 7, { y: 0.03 });
          pf.box(4, 0.25, 30, 0, 0.35, 12, 0x9a6b3f, { col: false }); for (let k = 0; k < 6; k++) for (const sx of [-1.8, 1.8]) pf.cyl(0.18, 0.18, 2.6, sx, -2.2, 0 + k * 5.5, 0x6b4a2b, { col: false });
          for (const sx of [-1.95, 1.95]) pf.box(0.12, 0.9, 30, sx, 0.6, 12, 0x6b4a2b, { col: false }); }
      { const bf = c.frame(7.5, B.z1 - 7, Math.PI); bf.box(5.2, 0.25, 2.4, 0, 2.8, 0.6, 0x6d28d9, { col: false }); for (const x of [-2.4, 2.4]) for (const z of [-0.4, 1.6]) bf.cyl(0.08, 0.08, 2.8, x, 0, z, 0xd1d5db, { col: false }); bf.col(5.2, 2.8, 0.2, 0, 0, 1.6);
        bf.box(3.2, 0.12, 0.6, 0, 0.5, 1.2, 0xb7793f); const sg = new T.Mesh(new T.PlaneGeometry(3.4, 0.9), new T.MeshStandardMaterial({ map: ZA.label('🚌 SCHOOL BUS → ISLAND', { w: 1024, h: 240, bg: '#3b0764', fg: '#ffd84a', size: 110, radius: 30 }) })); sg.position.set(0, 3.5, 0.6); sg.rotation.y = Math.PI; bf.g.add(sg); const sg2 = sg.clone(); sg2.rotation.y = 0; sg2.position.z = 0.62; bf.g.add(sg2);
        W.busStop = { x: 2.5, z: B.z1 - 8, faceZ: -1 }; blocks.push([2, B.z1 - 9, 12, 10]);   // keep trees off the bus stop + turning area
        c.interact({ x: 3.5, z: B.z1 - 7.5, r: 3.2, label: 'Ride the school bus back to the island', fn: () => dispatchEvent(new CustomEvent('zworld-bus')) }); }
      for (const [x, z] of [[B.x0, B.z0], [B.x1, B.z0], [B.x0, B.z1], [B.x1, B.z1]]) { c.cyl(1.8, 2, 5.5, x, 0, z, 0xb7793f); const cone = new T.Mesh(new T.ConeGeometry(2.2, 2.6, 16), M(0x6d28d9)); cone.position.set(x, 6.8, z); c.g.add(cone); }
    }

    // ---------- train loop + Chocolate Express ----------
    {
      const tp = trackPts, sleeper = M(0x6b4423), railC = M(0x9ca3af, { metalness: 0.6, roughness: 0.35 });
      const curve = new T.CatmullRomCurve3(tp.map(([x, z]) => new T.Vector3(x, 0, z)), true, 'centripetal'), Lc = curve.getLength(), N = Math.floor(Lc / 0.9);
      const slG = new T.BoxGeometry(2.2, 0.12, 0.32), inst = new T.InstancedMesh(slG, sleeper, N), m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(1, 1, 1);
      for (let i = 0; i < N; i++) { const u = i / N, p = curve.getPointAt(u), tg = curve.getTangentAt(u), y = Math.max(height(p.x, p.z), 0) + 0.06; q.setFromAxisAngle(new T.Vector3(0, 1, 0), Math.atan2(tg.x, tg.z)); m4.compose(new T.Vector3(p.x, y, p.z), q, sc); inst.setMatrixAt(i, m4); }
      inst.receiveShadow = true; c.g.add(inst);
      for (const off of [-0.6, 0.6]) { const pts = []; for (let i = 0; i <= 400; i++) { const u = i / 400, p = curve.getPointAt(u % 1), tg = curve.getTangentAt(u % 1); pts.push(new T.Vector3(p.x - tg.z * off, 0.2, p.z + tg.x * off)); } const rc = new T.CatmullRomCurve3(pts, true); const tube = new T.Mesh(new T.TubeGeometry(rc, 600, 0.06, 5, true), railC); tube.castShadow = false; c.g.add(tube); }
      // level crossing on the entrance road
      for (const sx of [-1, 1]) { const f = c.frame(sx * 3.4, G.track.z1 - 1.6 * sx, 0); f.cyl(0.07, 0.07, 2.2, 0, 0, 0, 0xf8fafc, { col: false }); const x1 = new T.Mesh(new T.BoxGeometry(1.0, 0.16, 0.04), M(0xdc2626)); x1.position.set(0, 2.0, 0); x1.rotation.z = 0.6; f.g.add(x1); const x2 = x1.clone(); x2.rotation.z = -0.6; f.g.add(x2); }
      // the train: engine + 3 carriages that follow each other along the loop and pause at the station
      const train = new T.Group(); train.userData.dynamic = true; c.g.add(train);
      const cars = [];
      const mkCar = (engine, colr) => {
        const g = new T.Group(), body = new T.Mesh(ZA.roundBox(1.9, 1.6, engine ? 4.2 : 3.8, 0.18), M(colr, { roughness: 0.4 })); body.position.y = 1.25; body.castShadow = true; g.add(body);
        const roof = new T.Mesh(ZA.roundBox(2.1, 0.22, engine ? 4.4 : 4.0, 0.08), M(0xfacc15, { metalness: 0.3, roughness: 0.4 })); roof.position.y = 2.15; g.add(roof);
        for (const sz of [-1, 1]) for (const sx of [-1, 1]) { const wh = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.2, 18), M(0x1f2937)); wh.rotation.z = Math.PI / 2; wh.position.set(sx * 0.95, 0.45, sz * (engine ? 1.4 : 1.2)); g.add(wh); }
        if (engine) { const boiler = new T.Mesh(new T.CylinderGeometry(0.75, 0.75, 2.2, 20), M(0x7c3aed, { roughness: 0.35 })); boiler.rotation.x = Math.PI / 2; boiler.position.set(0, 1.5, 1.2); g.add(boiler); const stack = new T.Mesh(new T.CylinderGeometry(0.28, 0.2, 0.9, 14), M(0x1f2937)); stack.position.set(0, 2.5, 1.9); g.add(stack); const lamp = new T.Mesh(new T.SphereGeometry(0.2, 12, 10), M(0xfff1c9, { emissive: 0xffe08a, emissiveIntensity: 1.5 })); lamp.position.set(0, 1.6, 2.35); g.add(lamp); }
        else for (const sx of [-1, 1]) for (let k = -1; k <= 1; k++) { const w2 = new T.Mesh(new T.PlaneGeometry(0.7, 0.6), M(0xfff1c9, { emissive: 0xffe2a8, emissiveIntensity: 0.6 })); w2.position.set(sx * 0.96, 1.5, k * 1.1); w2.rotation.y = sx * Math.PI / 2; g.add(w2); }
        train.add(g); cars.push(g);
      };
      mkCar(true, 0x6d28d9); mkCar(false, 0xec4899); mkCar(false, 0x0ea5e9); mkCar(false, 0xf97316);
      W.train = { cars };
      const stationU = (() => { let best = 0, bd = 1e9; for (let i = 0; i < 2000; i++) { const p = curve.getPointAt(i / 2000), d = Math.hypot(p.x - G.station.x, p.z - (G.station.z + 5.5)); if (d < bd) { bd = d; best = i / 2000; } } return best; })();
      const lap = 70, stop = 7;   // seconds per lap / pause at the station
      c.tick((t) => {
        const k = t % (lap + stop), run = Math.max(0, k - stop) / lap, eased = run < 0.06 ? run * run / 0.12 : run > 0.94 ? 1 - (1 - run) * (1 - run) / 0.12 : run, u0 = (stationU + eased) % 1;
        cars.forEach((car, i) => { const u = ((u0 - i * 4.4 / Lc) % 1 + 1) % 1, p = curve.getPointAt(u), tg = curve.getTangentAt(u); car.position.set(p.x, Math.max(0, height(p.x, p.z)) + 0.15, p.z); car.rotation.y = Math.atan2(tg.x, tg.z); });
      }, train);
    }

    // ---------- Main Plaza: the big chocolate fountain, lamps, benches, flower beds ----------
    {
      const f = c.frame(G.plaza.x, G.plaza.z), choc = M(0x6b3a1f, { roughness: 0.3 }), basin = M(0xe9d5b5), gold = M(0xd4a017, { metalness: 0.5, roughness: 0.35 });
      const FS = 1.6, ff = f.frame(0, 0); ff.g.scale.setScalar(FS);   // the fountain, 1.6× (colliders added below)
      f.col(4.4 * FS * 1.7, 0.7 * FS, 4.4 * FS * 1.7, 0, 0, 0, { ry: Math.PI / 4 }); f.col(4.4 * FS * 1.7, 0.7 * FS, 4.4 * FS * 1.7, 0, 0, 0);
      ff.cyl(4.2, 4.4, 0.7, 0, 0, 0, basin, { seg: 40, col: false }); const pool = new T.Mesh(new T.CircleGeometry(3.9, 40), choc); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.62; ff.g.add(pool);
      ff.cyl(0.7, 0.9, 2.4, 0, 0, 0, basin, { seg: 24, col: false }); ff.cyl(2.2, 1.6, 0.4, 0, 2.2, 0, basin, { col: false, seg: 32 }); const p2 = new T.Mesh(new T.CircleGeometry(2.0, 32), choc); p2.rotation.x = -Math.PI / 2; p2.position.y = 2.61; ff.g.add(p2);
      ff.cyl(0.4, 0.5, 1.6, 0, 2.6, 0, basin, { col: false }); ff.cyl(1.1, 0.8, 0.3, 0, 4.0, 0, basin, { col: false });
      const top = new T.Mesh(new T.SphereGeometry(0.5, 20, 14), gold); top.position.y = 4.7; ff.g.add(top);
      // falling chocolate curtains (animated)
      const fallM = new T.MeshStandardMaterial({ color: 0x7a4426, roughness: 0.25, transparent: true, opacity: 0.92, side: T.DoubleSide });
      const cur1 = new T.Mesh(new T.CylinderGeometry(2.05, 2.6, 2.0, 32, 1, true), fallM); cur1.position.y = 1.6; ff.g.add(cur1); const cur2 = new T.Mesh(new T.CylinderGeometry(1.0, 1.9, 1.4, 24, 1, true), fallM); cur2.position.y = 3.35; ff.g.add(cur2);
      f.tick((t) => { cur1.scale.set(1 + Math.sin(t * 3) * 0.015, 1, 1 + Math.cos(t * 3) * 0.015); cur2.rotation.y = t * 0.4; }, cur1); cur2.userData.dynamic = true;
      if (ZFactory.faceOn) { const ftk = ZFactory.faceOn(ff.g, { y: 1.2, z: 4.0, s: 2.2, lid: 0x5b3420 }); f.tick(ftk); }   // the living chocolate fountain smiles at the plaza
      const z = ZAssets.has('zungga_logo'); if (z) ff.prop('zungga_logo', 0, 5.0, 0, 0, 1.2, { col: false });
      const PR = G.plaza.r;
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + Math.PI / 12, r = PR * 0.82; f.prop('island_lamp_post', Math.sin(a) * r, 0, Math.cos(a) * r, a, 1, { col: false }); f.col(0.3, 3, 0.3, Math.sin(a) * r, 0, Math.cos(a) * r); lamp(f, Math.sin(a) * r, Math.cos(a) * r, 3.2); }
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, r = PR * 0.6; f.prop('bench', Math.sin(a) * r, 0, Math.cos(a) * r, a + Math.PI, 1.2); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8, r = PR * 0.44; f.prop(['flower_bed_pink', 'flower_bed_yellow', 'flower_bed_red', 'flower_bed_white'][i % 4], Math.sin(a) * r, 0, Math.cos(a) * r, a, 1, { colH: 0.4 }); }
    }

    // ---------- Main Entrance: two giant cookie towers + the ZUNGGA arch ----------
    {
      const E = G.entrance, f = c.frame(E.x, E.z), cream = M(0xf3d9b1), cookieM = M(0xd9a05b), chip = M(0x4a2a17), pinkM = M(0xf472b6);
      for (const sx of [-1, 1]) {
        const tx = sx * (E.gate / 2 + 2.6); f.cyl(2.4, 2.6, 8, tx, 0, 0, cream, { seg: 28 });
        for (let k = 0; k < 4; k++) { const ck = new T.Mesh(new T.CylinderGeometry(2.6, 2.6, 0.35, 28), cookieM); ck.position.set(tx, 1.4 + k * 1.8, 0); f.g.add(ck); for (let d = 0; d < 10; d++) { const a = d / 10 * Math.PI * 2 + k; const cp = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), chip); cp.position.set(tx + Math.sin(a) * 2.6, 1.4 + k * 1.8, Math.cos(a) * 2.6); f.g.add(cp); } }
        const dome = new T.Mesh(new T.SphereGeometry(2.7, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), pinkM); dome.position.set(tx, 8, 0); f.g.add(dome);
        const tip = new T.Mesh(new T.ConeGeometry(0.5, 1.6, 12), M(0x7c3aed)); tip.position.set(tx, 11.2, 0); f.g.add(tip);
        f.box(E.w / 2 - E.gate / 2 - 5.2, 4.5, 2.4, sx * (E.w / 2 - (E.w / 2 - E.gate / 2 - 5.2) / 2), 0, 0, 0xb7793f);
      }
      f.box(E.gate + 3, 1.8, 2.6, 0, 5.4, 0, 0x7c3aed, { col: true });   // the lintel between the towers
      // ---- the name board: framed, lit with marquee bulbs, readable from both sides, standing on the lintel ----
      { const bw = 7.6, bh = 2.3, by = 7.25, nb = f.frame(0, 0); nb.box(bw, bh, 0.5, 0, by, 0, 0x3b0764, { col: false });
        const goldF = M(0xfacc15, { metalness: 0.6, roughness: 0.3, emissive: 0x7a5a00, emissiveIntensity: 0.25 });
        for (const [w2, h2, x2, y2] of [[bw + 0.3, 0.18, 0, by - 0.09], [bw + 0.3, 0.18, 0, by + bh - 0.09], [0.18, bh, -bw / 2, by], [0.18, bh, bw / 2, by]]) nb.box(w2, h2, 0.62, x2, y2, 0, goldF, { col: false });
        const tex = ZA.label('ZUNGGA CHOCOLATE FACTORY', { w: 1024, h: 300, bg: '#3b0764', fg: '#ffd84a', size: 92, radius: 24 });
        for (const sz of [1, -1]) { const pl = new T.Mesh(new T.PlaneGeometry(bw - 0.4, bh - 0.4), new T.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35, roughness: 0.6 })); pl.position.set(0, by + bh / 2, sz * 0.32); if (sz < 0) pl.rotation.y = Math.PI; f.g.add(pl); }
        const bulbs = []; for (const sz of [1, -1]) for (let k = 0; k < 22; k++) { const u = k / 22, per = 2 * (bw + bh), d = u * per; let bx, by2; if (d < bw) { bx = -bw / 2 + d; by2 = by + bh; } else if (d < bw + bh) { bx = bw / 2; by2 = by + bh - (d - bw); } else if (d < 2 * bw + bh) { bx = bw / 2 - (d - bw - bh); by2 = by; } else { bx = -bw / 2; by2 = by + (d - 2 * bw - bh); }
          const bm = new T.Mesh(new T.SphereGeometry(0.075, 8, 6), new T.MeshStandardMaterial({ color: 0xfff1b8, emissive: 0xffc94a, emissiveIntensity: 1 })); bm.position.set(bx, by2, sz * 0.36); f.g.add(bm); bulbs.push(bm); }
        f.tick((t) => bulbs.forEach((b, k) => { b.material.emissiveIntensity = ((k + Math.floor(t * 4)) % 3 === 0) ? 2.2 : 0.5; }), bulbs[0]); }
      // ---- the golden gate: dazzling bars, opens only for a golden visitor pass (E → the kid raises the pass, energy flies to the gate) ----
      { const GH = 5.15, lw = E.gate / 2, gold = new T.MeshStandardMaterial({ color: 0xf5c518, metalness: 0.85, roughness: 0.22, emissive: 0xb07800, emissiveIntensity: 0.35 });
        const leafMesh = (side) => { const g = new T.Group(), bar = (w2, h2, d2, x2, y2) => { const m2 = new T.Mesh(new T.BoxGeometry(w2, h2, d2), gold); m2.position.set(x2, y2, 0); m2.castShadow = true; g.add(m2); };
          bar(lw, 0.16, 0.14, 0, 0.35); bar(lw, 0.16, 0.14, 0, GH - 0.55); bar(lw, 0.12, 0.12, 0, GH * 0.5); bar(0.16, GH - 0.2, 0.16, -lw / 2 + 0.08, (GH - 0.2) / 2); bar(0.16, GH - 0.2, 0.16, lw / 2 - 0.08, (GH - 0.2) / 2);
          for (let k = 1; k < 12; k++) { const x2 = -lw / 2 + k * lw / 12, rod = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, GH - 0.5, 8), gold); rod.position.set(x2, (GH - 0.5) / 2 + 0.2, 0); g.add(rod); const tip = new T.Mesh(new T.ConeGeometry(0.07, 0.3, 8), gold); tip.position.set(x2, GH - 0.15, 0); g.add(tip); }
          const ring = new T.Mesh(new T.TorusGeometry(0.62, 0.07, 10, 32), gold); ring.position.set(side * (lw / 2 - 0.75), GH * 0.5, 0); g.add(ring);
          const disc = new T.Mesh(new T.CircleGeometry(0.55, 32), new T.MeshStandardMaterial({ map: ZA.label('Z', { w: 256, h: 256, bg: '#3b0764', fg: '#ffd84a', size: 190, radius: 128 }), metalness: 0.3, roughness: 0.4 })); disc.position.copy(ring.position); disc.position.z = 0.02; g.add(disc); const disc2 = disc.clone(); disc2.rotation.y = Math.PI; disc2.position.z = -0.02; g.add(disc2);   // a Z that reads right from both sides
          for (let k = 0; k < 5; k++) { const sw = new T.Mesh(new T.TorusGeometry(0.28, 0.03, 6, 16, Math.PI), gold); sw.position.set(-lw / 2 + (k + 0.5) * lw / 5, 0.85, 0); g.add(sw); }
          return g; };
        const gf = f.frame(0, 0), opts = { kind: 'swing', auto: false, manual: true, w: lw, h: GH, t: 0.2, range: 0 };
        const DL = gf.door({ ...opts, x: -lw / 2, z: 0.2, ry: 0, mesh: leafMesh(1), swing: -1 }), DR = gf.door({ ...opts, x: lw / 2, z: 0.2, ry: Math.PI, mesh: leafMesh(1), swing: 1 });
        const sparks = new T.Group(); f.g.add(sparks); const spm = new T.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0.9 }); const sp = Array.from({ length: 26 }, (_, k) => { const m2 = new T.Mesh(new T.OctahedronGeometry(0.06), spm); m2.userData.p = [(Math.random() - 0.5) * E.gate, 0.4 + Math.random() * (GH - 0.6), (Math.random() < 0.5 ? -1 : 1) * 0.35, Math.random() * 6]; sparks.add(m2); return m2; });
        const GG = W.goldenGate = { x: E.x, z: E.z + 0.2, y: 0, w: E.gate, h: GH, leaves: [DL, DR], mat: gold, glow: 0, openT: 0,
          get isOpen() { return DL.want === 1; }, open() { DL.want = DR.want = 1; GG.openT = 0; }, close() { DL.want = DR.want = 0; } };
        f.tick((t, dt = 1 / 60) => { gold.emissiveIntensity = 0.35 + Math.sin(t * 2.2) * 0.12 + GG.glow * 2.2; sp.forEach((m2) => { const q = m2.userData.p, tw = (Math.sin(t * 3 + q[3]) + 1) / 2; m2.position.set(q[0], q[1], q[2]); m2.scale.setScalar(0.25 + tw * tw * (1.1 + GG.glow * 0.8)); m2.rotation.y = t * 2 + q[3]; }); }, sparks);
        // E near the gate (either side, while it is shut) → the pass ceremony (world.html listens for 'zworld-pass')
        W.interacts.push({ test: (p) => !GG.isOpen && !GG.busy && Math.abs(p.x - GG.x) < E.gate / 2 + 0.5 && Math.abs(p.z - GG.z) < 3.2 && p.y < 2, label: () => '✨ Show your golden visitor pass', fn: () => dispatchEvent(new CustomEvent('zworld-pass', { detail: GG })) });
        W.lanes.push({ x: E.x, z: E.z, ry: 0, hw: E.gate / 2, hd: 4, y: 0, h: GH }); }
      // ---- the outer plaza fountain: a three-tier fountain with falling water veils, jets and ripples ----
      const o = E.outer, fo = c.frame(o.x, o.z);
      { const stone = 0xeadfca, stone2 = 0xd8c7a6, waterM = new T.MeshStandardMaterial({ color: 0x7cc4ff, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.1, side: T.DoubleSide, depthWrite: false });
        fo.cyl(3.4, 3.6, 0.75, 0, 0, 0, stone, { seg: 40 }); const inner = new T.Mesh(new T.CylinderGeometry(3.05, 3.05, 0.1, 40), M(0x3b82c4, { roughness: 0.2 })); inner.position.y = 0.62; fo.g.add(inner);
        const pool = new T.Mesh(new T.CircleGeometry(3.05, 40), new T.MeshStandardMaterial({ color: 0x6fc0ff, transparent: true, opacity: 0.8, roughness: 0.05, metalness: 0.2 })); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.69; fo.g.add(pool);
        const rim = new T.Mesh(new T.TorusGeometry(3.45, 0.16, 8, 48), M(stone2)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.76; fo.g.add(rim);
        const tiers = [[0.42, 0.55, 1.7, 1.55, 1.3], [0.3, 0.38, 1.1, 2.75, 0.75]];   // [stemTop, stemBottom, height, bowlY, bowlR]
        fo.cyl(0.55, 0.75, 1.55, 0, 0.6, 0, stone2, { seg: 20 });
        const veils = [], ripples = [];
        for (const [, , , by, br] of tiers) {
          const bowl = new T.Mesh(new T.CylinderGeometry(br, br * 0.35, 0.38, 32), M(stone)); bowl.position.y = by; fo.g.add(bowl);
          const bw2 = new T.Mesh(new T.CircleGeometry(br * 0.92, 32), pool.material); bw2.rotation.x = -Math.PI / 2; bw2.position.y = by + 0.2; fo.g.add(bw2);
          const lip = new T.Mesh(new T.TorusGeometry(br, 0.07, 6, 32), M(stone2)); lip.rotation.x = Math.PI / 2; lip.position.y = by + 0.19; fo.g.add(lip);
          const fall = by + 0.18 - (by === tiers[0][3] ? 0.7 : tiers[0][3] + 0.2); const veil = new T.Mesh(new T.CylinderGeometry(br + 0.04, br + 0.22, fall, 32, 1, true), waterM); veil.position.y = by + 0.18 - fall / 2; fo.g.add(veil); veils.push(veil);
        }
        const stem2 = new T.Mesh(new T.CylinderGeometry(0.22, 0.32, 1.0, 16), M(stone2)); stem2.position.y = 1.9; fo.g.add(stem2);
        const fin = new T.Mesh(new T.SphereGeometry(0.22, 16, 12), M(0xfacc15, { metalness: 0.6, roughness: 0.3 })); fin.position.y = 3.25; fo.g.add(fin);
        // jets: droplets on arcs from the top + a centre plume
        const N = 140, dg = new T.BufferGeometry(), pos = new Float32Array(N * 3), seed = Array.from({ length: N }, (_, k) => [k / N * Math.PI * 2 * 7.3, Math.random()]);
        dg.setAttribute('position', new T.BufferAttribute(pos, 3)); const drops = new T.Points(dg, new T.PointsMaterial({ color: 0xdff2ff, size: 0.09, transparent: true, opacity: 0.9, depthWrite: false })); drops.frustumCulled = false; fo.g.add(drops);
        for (let k = 0; k < 3; k++) { const rp = new T.Mesh(new T.RingGeometry(0.8, 0.9, 40), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false })); rp.rotation.x = -Math.PI / 2; rp.position.y = 0.71; fo.g.add(rp); ripples.push(rp); }
        fo.tick((t) => {
          for (let k = 0; k < N; k++) { const [a, ph] = seed[k], u = (t * 0.55 + ph) % 1; let x, y, z;
            if (k % 4 === 0) { x = Math.sin(a) * 0.05; z = Math.cos(a) * 0.05; y = 3.35 + 1.6 * Math.sin(u * Math.PI); }   // centre plume
            else { const r = 0.2 + u * 2.1; x = Math.sin(a) * r; z = Math.cos(a) * r; y = 3.3 + u * 1.2 - u * u * 3.4; if (y < 0.7) y = 0.7; }
            pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; }
          dg.attributes.position.needsUpdate = true;
          veils.forEach((v, i) => { v.material.opacity = 0.42 + Math.sin(t * 6 + i) * 0.08; });
          ripples.forEach((rp, i) => { const u = (t * 0.4 + i / 3) % 1; rp.scale.setScalar(1 + u * 2.4); rp.material.opacity = 0.35 * (1 - u); });
        }, drops);
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { fo.prop('island_lamp_post', sx * 5.5, 0, sz * 5.5, 0, 1, { col: false }); fo.col(0.3, 3, 0.3, sx * 5.5, 0, sz * 5.5); lamp(fo, sx * 5.5, sz * 5.5, 3.2); }
    }

    // ---------- buildings (shells + roofs); interiors come from ZFactory.dress ----------
    const ROT = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 };
    for (const b of G.buildings) buildingShell(W, c, b, ROT[b.door]);

    // ---------- Chocolate Express Station ----------
    {
      const S = G.station, f = c.frame(S.x, S.z);
      f.box(S.w, 0.5, S.d, 0, 0, 0, 0xd6b38a, { cast: false });             // platform (0.5 m: step up from the road)
      for (const sx of [-S.w / 2 + 1, S.w / 2 - 1]) f.stairs({ x: sx, z: -S.d / 2 - 1.2, y0: 0, y1: 0.5, w: 2.4, ry: Math.PI, rise: 0.17, run: 0.4, rails: false });
      for (let i = -4; i <= 4; i++) f.cyl(0.18, 0.18, 4, i * 2.3, 0.5, S.d / 2 - 0.6, 0x5b2a86, { seg: 12 });
      for (let i = -4; i <= 4; i++) f.cyl(0.18, 0.18, 4, i * 2.3, 0.5, -S.d / 2 + 0.6, 0x5b2a86, { seg: 12 });
      const roof = new T.Mesh(ZA.roundBox(S.w + 1.2, 0.45, S.d + 1.6, 0.18), M(0x3b4fbf, { roughness: 0.5 })); roof.position.set(0, 4.75, 0); roof.castShadow = true; f.g.add(roof); f.col(S.w + 1.2, 0.45, S.d + 1.6, 0, 4.5, 0);
      const ridge = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, S.w + 1.2, 16, 1, false, 0, Math.PI), M(0x7c3aed)); ridge.rotation.z = Math.PI / 2; ridge.position.set(0, 4.95, 0); f.g.add(ridge);
      const sg = new T.Mesh(new T.PlaneGeometry(8, 1.2), new T.MeshStandardMaterial({ map: ZA.label('CHOCOLATE EXPRESS STATION', { w: 1024, h: 150, bg: '#facc15', fg: '#3b0764', size: 90, radius: 30 }) })); sg.position.set(0, 3.9, S.d / 2 + 0.81); f.g.add(sg); const sgb = sg.clone(); sgb.rotation.y = Math.PI; sgb.position.z = -S.d / 2 - 0.81; f.g.add(sgb);
      f.box(3, 2.6, 2.2, -6, 0.5, -1, 0xf472b6); f.box(3.2, 0.3, 2.4, -6, 3.1, -1, 0x7c3aed, { col: false });   // ticket booth
      const tw = new T.Mesh(new T.PlaneGeometry(1.6, 0.9), M(0xfff1c9, { emissive: 0xffd890, emissiveIntensity: 0.6 })); tw.position.set(-6, 2.0, 0.11); f.g.add(tw);
      for (const x of [2, 5, 8]) f.prop('bench', x, 0.5, -1.8, 0, 1.1);
      f.prop('wall_clock', 0, 3.3, -S.d / 2 + 0.75, 0, 1.4, { col: false });
      c.area({ id: S.id, num: S.num, name: S.name, x: S.x, z: S.z + 1.5, w: S.w + 2, d: S.d + 6 });
      if (ZFactory.dress[S.id]) W.dressRun(() => ZFactory.dress[S.id](f, { w: S.w, d: S.d, h: 4.5, y: 0.5, kind: 'station' }), f);
    }

    // ---------- Chocolate Garden (hedges, candy trees, a candy slide) ----------
    {
      const Gd = G.garden, f = c.frame(Gd.x, Gd.z), hedge = M(0x3f8f3a, { roughness: 1 });
      const hw = Gd.w / 2, hd = Gd.d / 2;
      f.wall(-hw, -hd, hw, -hd, { h: 1.3, t: 0.8, mat: hedge }); f.wall(-hw, -hd, -hw, hd, { h: 1.3, t: 0.8, mat: hedge }); f.wall(hw, -hd, hw, hd, { h: 1.3, t: 0.8, mat: hedge });
      f.wall(-hw, hd, hw, hd, { h: 1.3, t: 0.8, mat: hedge, doors: [{ at: 3, w: 3, h: 9 }] });
      const st = stoneTex('#e6c79c', '#c49a6c'); st.repeat.set(2, 6); const pth = new T.Mesh(new T.PlaneGeometry(2.6, Gd.d - 1), new T.MeshStandardMaterial({ map: st })); pth.rotation.x = -Math.PI / 2; pth.position.set(-hw + 3, 0.03, 0); f.g.add(pth);
      // lollipop trees + gumdrops
      const lolly = [0xec4899, 0x8b5cf6, 0xf97316, 0x22c55e, 0x0ea5e9];
      for (let i = 0; i < 9; i++) { const x = -hw + 7 + (i % 3) * 5.5, z = -hd + 4 + Math.floor(i / 3) * 5.5; if (i === 2 || i === 5) continue; /* the slide tower + its stairs stand there */ f.cyl(0.09, 0.09, 2.4, x, 0, z, 0xffffff, { col: false }); f.col(0.3, 2.4, 0.3, x, 0, z); const pop = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 0.26, 28), M(lolly[i % 5], { roughness: 0.3 })); pop.rotation.x = Math.PI / 2; pop.position.set(x, 2.9, z); pop.rotation.z = i; f.g.add(pop); const sw = new T.Mesh(new T.TorusGeometry(0.5, 0.07, 8, 28), M(0xffffff)); sw.position.set(x, 2.9, z + 0.14); f.g.add(sw); }
      for (let i = 0; i < 10; i++) { const gd = new T.Mesh(new T.SphereGeometry(0.4, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(lolly[(i + 2) % 5], { roughness: 0.25 })); gd.position.set(-hw + 1.5 + (i * 1.6) % (Gd.w - 3), 0, hd - 1.2 - (i % 2) * 0.8); f.g.add(gd); }
      f.prop('island_fountain', hw - 4, 0, hd - 4, 0, 0.2);
      // candy slide: a little tower with stairs, then a twisting slide down
      const sx = hw - 3.2, sz = -hd + 2.6, topY = 2.6;
      f.box(2.2, topY, 2.2, sx, 0, sz, 0xfacc15);
      f.stairs({ x: sx - 1.1 - 0.0, z: sz + 1.1 + topY / 0.17 * 0.3 + 0.0, y0: 0, y1: topY, w: 1.0, ry: 0, rise: 0.17, run: 0.3, mat: 0xf472b6, side: 0x7c3aed });
      for (const [px, pz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) f.cyl(0.07, 0.07, 1.0, sx + px * 1.05, topY, sz + pz * 1.05, 0x7c3aed, { col: false });
      const sL = sx - 1.1, sZ = sz;
      f.slide([[sx - 0.6, topY + 0.15, sz], [sx - 2.4, topY - 0.4, sz + 0.2], [sx - 4.2, topY - 1.1, sz + 1.6], [sx - 4.6, topY - 1.8, sz + 3.6], [sx - 3.4, 0.5, sz + 5.0], [sx - 1.6, 0.22, sz + 5.4]], { name: 'Candy slide', color: 0xec4899, groundY: 0 });
      void sL; void sZ;
      c.area({ id: Gd.id, num: Gd.num, name: Gd.name, x: Gd.x, z: Gd.z, w: Gd.w, d: Gd.d });
      if (ZFactory.dress[Gd.id]) W.dressRun(() => ZFactory.dress[Gd.id](f, { w: Gd.w, d: Gd.d, h: 3, y: 0, kind: 'garden' }), f);
    }

    // ---------- where the first-floor deck's columns stand (free ground only: never river, road, bridge or building) ----------
    { const F = L.first, O = F.outline, gl = F.balcony.glass, cols = [];
      for (let x = O.x0 + 8; x <= O.x1 - 8; x += 26) for (let z = O.z0 + 8; z <= O.z1 - 4; z += 24) { if (x > gl.x0 - 2 && x < gl.x1 + 2 && z > gl.z0 - 2 && z < gl.z1 + 2) continue; for (const [dx, dz] of [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3], [4, 4], [-4, -4], [5, -3]]) { if (free(x + dx, z + dz, 1.4)) { cols.push([x + dx, z + dz]); break; } } }
      G.deckColumns = cols; }
    // ---------- trees, bushes, lamps scattered over the free land ----------
    {
      let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const kinds = ['tree_oak', 'tree_pine', 'tree_maple', 'tree_birch', 'bush', 'bush', 'flowers'];
      let placed = 0;
      const Bd = L.bounds;
      for (let i = 0; i < 9000 && placed < 560; i++) {
        const x = Bd.x0 + 2.5 + rnd() * (Bd.x1 - Bd.x0 - 5), z = Bd.z0 + 2.5 + rnd() * (Bd.z1 - Bd.z0 - 5); const k = kinds[Math.floor(rnd() * kinds.length)], big = k.startsWith('tree');
        if (!free(x, z, big ? 1.2 : 0.3)) continue;
        // under the first-floor deck only low plants (the deck is 13 m up, trees are fine but keep it airy)
        const s = big ? 0.8 + rnd() * 0.5 : 0.8 + rnd() * 0.6;
        c.prop(k, x, 0, z, rnd() * 6.28, s, { col: false }); if (big) { c.col(0.45, 3, 0.45, x, 0, z); (W.treeSpots = W.treeSpots || []).push([x, z, s]); } placed++;
      }
      // lamps along the boulevard loop
      for (let i = 0; i < loopPts.length; i += 3) { const [x, z] = loopPts[i], [nx, nz] = loopPts[(i + 1) % loopPts.length], tx = nx - x, tz = nz - z, tl = Math.hypot(tx, tz) || 1, ox = -tz / tl * (lp.w / 2 + 0.6), oz = tx / tl * (lp.w / 2 + 0.6); if (height(x + ox, z + oz) < -0.05 || !free(x + ox, z + oz, -1.4)) continue; c.prop('island_lamp_post', x + ox, 0, z + oz, 0, 1, { col: false }); c.col(0.3, 3, 0.3, x + ox, 0, z + oz); lamp(c, x + ox, z + oz, 3.2); }
    }

    // ---------- the island's look: treat stalls with their sellers, benches + lamps along the paths, gazebos, planters ----------
    {
      let seed = 23; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const stalls = ['stall_ice_cream', 'stall_juice', 'stall_bakery', 'stall_fresh_fruits', 'stall_flowers', 'stall_toys', 'stall_filter_coffee', 'stall_chai'];
      const sellers = { stall_ice_cream: 'islander_seller_ice_cream', stall_juice: 'islander_seller_juice', stall_bakery: 'islander_seller_bakery', stall_fresh_fruits: 'islander_seller_fresh_fruits', stall_flowers: 'islander_seller_flowers', stall_toys: 'islander_seller_toys', stall_filter_coffee: 'islander_seller_filter_coffee', stall_chai: 'islander_seller_chai' };
      let k = 0; const R0 = G.plaza.ring[1] + 7;
      for (let i = 0; i < 16 && k < stalls.length; i++) {
        const a = (i / 16) * Math.PI * 2 + 0.2, x = G.plaza.x + Math.sin(a) * R0, z = G.plaza.z + Math.cos(a) * R0; if (!free(x, z, 2.5)) continue;
        const face = Math.atan2(G.plaza.x - x, G.plaza.z - z), id = stalls[k++];   // the stall faces the plaza
        c.prop(id, x, 0, z, face, 1); if (ZAssets.has(sellers[id])) c.prop(sellers[id], x - Math.sin(face) * 1.4, 0, z - Math.cos(face) * 1.4, face, 1, { col: false });
        blocks.push([x, z, 3, 3]);
      }
      // benches and lamps along every path (alternating sides, only where the ground is free)
      for (const pth of G.paths) { let acc = 0; for (let i = 0; i < pth.length - 1; i++) { const [ax, az] = pth[i], [bx, bz] = pth[i + 1], L2 = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L2, uz = (bz - az) / L2;
        for (let d = 6; d < L2; d += 11) { const side = (Math.floor((acc + d) / 11) % 2) ? 1 : -1, ox = -uz * side * 3.6, oz = ux * side * 3.6, x = ax + ux * d + ox, z = az + uz * d + oz; if (!free(x, z, 0.6)) continue;
          if ((Math.floor((acc + d) / 11) % 3) === 0) { c.prop('island_bench', x, 0, z, Math.atan2(-ox, -oz), 1); } else { c.prop('island_street_lamp', x, 0, z, Math.atan2(-ox, -oz), 1, { col: false }); c.col(0.35, 3.5, 0.35, x, 0, z); lamp(c, x, z, 4); } }
        acc += L2; } }
      // a few gazebos on the open lawns
      let gz = 0; for (let i = 0; i < 600 && gz < 4; i++) { const x = L.bounds.x0 + 15 + rnd() * (L.bounds.x1 - L.bounds.x0 - 30), z = L.bounds.z0 + 15 + rnd() * (L.bounds.z1 - L.bounds.z0 - 30); if (!free(x, z, 5.5)) continue; c.prop('park_gazebo', x, 0, z, rnd() * 6.28, 0.5); blocks.push([x, z, 5, 5]); gz++; }
      // planters + a striped awning at every building door
      const awnT = ZA.tex((g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#ec4899'; g.fillRect(i * w / 8, 0, w / 8, h); } }, 256, 64);
      for (const b of G.buildings) {
        const ry = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[b.door], dd = (b.door === 'e' || b.door === 'w' ? b.w : b.d) / 2, f = c.frame(b.x, b.z, ry);
        for (const sx of [-1, 1]) { f.cyl(0.5, 0.42, 0.6, sx * 2.6, 0, dd + 0.9, 0x8a5a33, { seg: 14 }); f.prop(['flowers', 'bush'][(b.num + (sx > 0 ? 1 : 0)) % 2], sx * 2.6, 0.55, dd + 0.9, 0, 0.7, { col: false }); }
        if (!b.round) { const aw = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 3.4, 18, 1, true, 0, Math.PI), new T.MeshStandardMaterial({ map: awnT, side: T.DoubleSide, roughness: 0.7 })); aw.rotation.set(0, 0, Math.PI / 2); aw.rotation.order = 'ZYX'; aw.position.set(0, 3.32 + 0.12, dd + 0.4); /* just over the door, below the name board */ aw.scale.set(1, 1, 0.9); f.g.add(aw); }
      }
    }

    // ---------- areas (for the minimap, the room names and the checklist) ----------
    c.area({ id: G.plaza.id, num: 1, name: G.plaza.name, x: G.plaza.x, z: G.plaza.z, w: 30, d: 30, y1: 9 });
    c.area({ id: 'cookie_boulevard', num: 2, name: 'Cookie Boulevard', x: (lp.x0 + lp.x1) / 2, z: (lp.z0 + lp.z1) / 2, w: lp.x1 - lp.x0 + 4, d: lp.z1 - lp.z0 + 4, y1: 9 });
    c.area({ id: G.entrance.id, num: 0, name: 'Main Entrance', x: 0, z: 36, w: 24, d: 18, y1: 9 });
    c.area({ id: 'chocolate_river', num: 0, name: 'Chocolate River', x: 0, z: -2, w: 1, d: 1, y0: -3, y1: -0.3 });   // tiny: river name only shows while swimming (see world page)
    for (const a of G.anchors) c.anchor(a[0], a[1], a[2], a[3]);
  }

  // ---------- one building: walls with a door, windows, floor, a roof that hides while you are inside ----------
  function buildingShell(W, c, b, ry) {
    const sideways = b.door === 'e' || b.door === 'w', w = sideways ? b.d : b.w, d = sideways ? b.w : b.d;   // local: door on +z
    const f = c.frame(b.x, b.z, ry), M = W.M, h = b.h, doorW = 2.4, doorH = 3;
    const wallM = new T.MeshStandardMaterial({ color: b.wall, roughness: 0.85 }), trim = M(b.roof);
    // the secret shaft passes through Mr. Choco's office: local position of the hole (a square around the stone pillar)
    if (b.id === 'choco_office') { const S = ZFactory.layout.ground.shaft, dx = S.x - b.x, dz = S.z - b.z, c2 = Math.cos(-ry), s2 = Math.sin(-ry); b.hole = { x: dx * c2 + dz * s2, z: -dx * s2 + dz * c2, r: S.r + 0.35 }; }
    if (b.hole) { holed(f, w + 0.4, d + 0.4, b.hole, (ww, dd, x, z) => f.box(ww, 0.12, dd, x, 0, z, 0xd8c0a0, { cast: false })); } else
    f.box(w + 0.4, 0.12, d + 0.4, 0, 0, 0, 0xd8c0a0, { cast: false });   // floor plinth (0.12 m step)
    f.box(w + 0.4, 0.12, 1.2, 0, 0, d / 2 + 0.75, 0xd8c0a0, { cast: false });   // doorstep
    if (b.round) {
      const R = b.round, n = 20;
      for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, am = (a0 + a1) / 2; if (Math.abs(Math.atan2(Math.sin(am), Math.cos(am))) < 0.17) continue; f.box(2 * Math.PI * R / n + 0.12, h, 0.4, Math.sin(am) * R, 0.12, Math.cos(am) * R, wallM, { ry: am }); }
      for (const sx of [-1, 1]) f.box(0.5, h, 0.6, sx * (doorW / 2 + 0.3), 0.12, R - 0.1, trim);
      f.box(doorW + 1.2, h - doorH, 0.5, 0, 0.12 + doorH, R - 0.1, wallM);
      f.doubleDoor({ x: 0, y: 0.12, z: R - 0.1, w: doorW, h: doorH, color: b.roof, label: b.name });
      const roof = new T.Group(); f.g.add(roof);
      const dome = new T.Mesh(new T.SphereGeometry(R + 0.4, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), M(b.roof, { roughness: 0.6 })); dome.position.y = h + 0.12; dome.scale.y = 0.55; dome.castShadow = true; roof.add(dome);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, rib = new T.Mesh(new T.TorusGeometry(R + 0.42, 0.08, 6, 24, Math.PI / 2), M(0xfacc15)); rib.position.y = h + 0.12; rib.rotation.set(0, a, Math.PI / 2); rib.scale.set(0.55, 1, 1); roof.add(rib); }
      const lan = new T.Mesh(new T.CylinderGeometry(0.8, 1, 1.4, 12), M(0x7c3aed)); lan.position.y = h + 0.12 + (R + 0.4) * 0.55 + 0.5; roof.add(lan);
      f.roof(roof, { w: 2 * R, d: 2 * R, y1: h + 4 }); f.col(2 * R, 0.4, 2 * R, 0, h + 0.12, 0, { tag: 'roof' });
    } else {
      const winY = 1.7, win = (L2) => { const n = Math.max(1, Math.floor(L2 / 4)), out = []; for (let i = 0; i < n; i++) out.push({ at: -L2 / 2 + (i + 0.5) * L2 / n, w: 1.3, h: 1.2, y: winY }); return out; };
      f.room({ w, d, h, y: 0.12, slab: 0.01, floor: false, wallMat: wallM, doors: { s: [{ at: 0, w: doorW, h: doorH }] }, windows: { n: win(w), e: win(d), w: win(d), s: win(w).filter((o) => Math.abs(o.at) > doorW) } });
      const fl = new T.Mesh(new T.PlaneGeometry(w - 0.2, d - 0.2), M(0xe7d3b8, { roughness: 0.8 })); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.125; fl.receiveShadow = true; f.g.add(fl);
      // door frame + sign
      for (const sx of [-1, 1]) f.box(0.3, doorH + 0.3, 0.45, sx * (doorW / 2 + 0.15), 0.12, d / 2, trim, { col: false });
      f.box(doorW + 0.9, 0.35, 0.5, 0, 0.12 + doorH, d / 2, trim, { col: false });
      f.doubleDoor({ x: 0, y: 0.12, z: d / 2, w: doorW, h: doorH, color: b.roof, label: b.name });
      const sg = new T.Mesh(new T.PlaneGeometry(Math.min(w - 1, 7), 0.9), new T.MeshStandardMaterial({ map: ZA.label(b.name.toUpperCase(), { w: 1024, h: 140, bg: '#3b0764', fg: '#ffd84a', size: 88, radius: 26 }), roughness: 0.6 })); sg.position.set(0, 0.12 + doorH + 1.45, d / 2 + 0.14); f.g.add(sg); /* name board above the awning */
      // roof by style
      const roof = new T.Group(); f.g.add(roof); const rm = M(b.roof, { roughness: 0.6 }), top = h + 0.12;
      const flat = new T.Mesh(new T.BoxGeometry(w + 0.8, 0.35, d + 0.8), rm); flat.position.y = top + 0.17; flat.castShadow = true; roof.add(flat);
      if (b.style === 'bakery' || b.style === 'warehouse' || b.style === 'cafe') {   // gable
        const shape = new T.Shape(); shape.moveTo(-w / 2 - 0.6, 0); shape.lineTo(w / 2 + 0.6, 0); shape.lineTo(0, Math.min(3.2, w * 0.28)); shape.closePath();
        const gab = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: d + 0.8, bevelEnabled: false }), rm); gab.position.set(0, top + 0.34, -(d + 0.8) / 2); gab.castShadow = true; roof.add(gab);
      } else if (b.style === 'marshmallow') {
        for (const [px, pz, r] of [[0, 0, 4.2], [-4.4, -3.2, 2.6], [4.2, -3, 2.8], [-3.8, 3.4, 2.3], [4, 3.6, 2.2]]) { const dm = new T.Mesh(new T.SphereGeometry(r, 26, 16, 0, Math.PI * 2, 0, Math.PI / 2), M(r > 3 ? b.roof : 0xfff1f7, { roughness: 0.9 })); dm.position.set(px, top + 0.34, pz); dm.scale.y = 0.85; dm.castShadow = true; roof.add(dm); }
      } else if (b.style === 'candy') {
        for (const [px, pz] of [[-w / 2 + 0.6, -d / 2 + 0.6], [w / 2 - 0.6, -d / 2 + 0.6], [-w / 2 + 0.6, d / 2 - 0.6], [w / 2 - 0.6, d / 2 - 0.6]]) { const tw = new T.Mesh(new T.CylinderGeometry(1.0, 1.1, 3.2, 18), M(0xfbcfe8)); tw.position.set(px, top + 1.6, pz); roof.add(tw); const cone = new T.Mesh(new T.ConeGeometry(1.35, 2.4, 18), M(0xdc2626)); cone.position.set(px, top + 4.4, pz); roof.add(cone); }
        for (const [px, pz, r] of [[-2, -1.5, 2.2], [2.6, 1.2, 1.7]]) { const g2 = new T.Mesh(new T.SphereGeometry(r, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.55, roughness: 0.1 })); g2.position.set(px, top + 0.34, pz); roof.add(g2); }
      } else if (b.style === 'kitchen' || b.style === 'machine') {
        for (const [px, pz] of [[-w / 3, -d / 4], [w / 4, -d / 3]]) { const ch = new T.Mesh(new T.CylinderGeometry(0.55, 0.7, 3.4, 14), M(b.style === 'kitchen' ? 0x7a4a2a : 0x475569)); ch.position.set(px, top + 2, pz); roof.add(ch); const rim = new T.Mesh(new T.TorusGeometry(0.58, 0.1, 6, 16), M(0xfacc15)); rim.rotation.x = Math.PI / 2; rim.position.set(px, top + 3.7, pz); roof.add(rim); }
      } else if (b.style === 'office') {
        const tw = new T.Mesh(new T.CylinderGeometry(1.4, 1.5, 3.4, 16), M(b.wall)); tw.position.set(w / 2 - 2, top + 1.7, d / 2 - 2); roof.add(tw); const cone = new T.Mesh(new T.ConeGeometry(1.9, 2.6, 16), rm); cone.position.set(w / 2 - 2, top + 4.7, d / 2 - 2); roof.add(cone);
      }
      roof.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      f.roof(roof, { w, d, y1: h + 3 });
      if (b.hole) holed(f, w, d, b.hole, (ww, dd, x, z) => f.col(ww, 0.35, dd, x, top, z, { tag: 'roof' })); else f.col(w, 0.35, d, 0, top, 0, { tag: 'roof' });
    }
    // style extras outside the walls (big enough to read from the plaza)
    if (b.style === 'bakery') { const ck = new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 0.3, 28), M(0xd9a05b)); ck.rotation.x = Math.PI / 2; ck.position.set(w / 2 - 2.2, h + 0.1, d / 2 + 0.3); f.g.add(ck); for (let i = 0; i < 7; i++) { const cp = new T.Mesh(new T.SphereGeometry(0.18, 8, 6), M(0x4a2a17)); const a = i * 2.4; cp.position.set(w / 2 - 2.2 + Math.cos(a) * (0.4 + (i % 3) * 0.35), h + 0.1 + Math.sin(a) * (0.4 + (i % 3) * 0.35), d / 2 + 0.46); f.g.add(cp); } }
    if (b.style === 'warehouse') for (const [px, pz] of [[-w / 2 - 2.2, -d / 4], [-w / 2 - 2.2, d / 4 - 1]]) { f.cyl(1.7, 1.7, 7, px, 0, pz, 0xe5e7eb, { seg: 20 }); const cap = new T.Mesh(new T.ConeGeometry(1.9, 1.4, 20), M(0x4d7c3a)); cap.position.set(px, 7.7, pz); f.g.add(cap); }
    if (b.style === 'machine') { for (const [px, py, r] of [[-w / 2 - 0.1, 3.4, 1.4], [-w / 2 - 0.1, 1.8, 0.9]]) { const gear = new T.Mesh(new T.TorusGeometry(r, 0.22, 8, 12), M(0xd4a017, { metalness: 0.6, roughness: 0.35 })); gear.position.set(px, py, d / 4); gear.rotation.y = Math.PI / 2; f.g.add(gear); f.tick((t) => { gear.rotation.x = t * (r > 1 ? 0.5 : -0.8); }, gear); } }
    if (b.style === 'cafe') for (const [px, pz] of [[-4, d / 2 + 3.2], [0, d / 2 + 4.2], [4, d / 2 + 3.2]]) { f.prop('beach_umbrella', px, 0, pz, 0, 1, { col: false }); f.col(0.4, 2.4, 0.4, px, 0, pz); f.cyl(0.6, 0.6, 0.75, px, 0, pz, 0xffffff, { col: false }); }
    // area + interior dressing
    c.area({ id: b.id, num: b.num, name: b.name, x: b.x, z: b.z, w: b.w, d: b.d, y1: b.h + 1 });
    const spec = { id: b.id, name: b.name, w, d, h, y: 0.125, door: { x: 0, z: d / 2, w: doorW }, round: b.round || 0, style: b.style, pillar: b.hole || null };   // pillar = the secret shaft through Mr. Choco's office (local x, z, half-size r): keep clear
    if (ZFactory.dress[b.id]) W.dressRun(() => ZFactory.dress[b.id](f.frame(0, 0, 0, 0.125), spec));
    if (ZFactory.dress[b.id + '_ext']) W.dressRun(() => ZFactory.dress[b.id + '_ext'](f, spec), f);
    { const [lx, lz] = f.W(0, (d / 2 + 3.5) / 2); W.lanes.push({ x: lx, z: lz, ry, hw: 1.4, hd: (d / 2 + 3.5) / 2, y: 0.12 }); }   // door → middle of the room stays walkable
  }

  // fill a w×d rectangle (centred at 0,0) with up to 4 boxes, leaving a square hole of half-size r around (hole.x, hole.z)
  function holed(f, w, d, hole, put) {
    const x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2, hx0 = Math.max(x0, hole.x - hole.r), hx1 = Math.min(x1, hole.x + hole.r), hz0 = Math.max(z0, hole.z - hole.r), hz1 = Math.min(z1, hole.z + hole.r);
    const rect = (a0, a1, b0, b1) => { if (a1 - a0 > 0.05 && b1 - b0 > 0.05) put(a1 - a0, b1 - b0, (a0 + a1) / 2, (b0 + b1) / 2); };
    rect(x0, x1, z0, hz0); rect(x0, x1, hz1, z1); rect(x0, hx0, hz0, hz1); rect(hx1, x1, hz0, hz1);
  }
  // a thin sloped rail collider along local z of a frame rotated by ry (rises toward +z when up = true)
  function ZWorldAddRail(W, x, z, hz, ry, y0, yLow, yHigh, up) { const rail = W.frame('ground', x, z, ry); const c = rail.col(0.12, 0.01, hz * 2, 0, 0, 0, { nocam: true }); c.kind = 'ramp'; c.y0 = y0 - 0.2; c.y1 = yHigh; c.ra = up ? yLow : yHigh; c.rb = up ? yHigh : yLow; }
  ZFactory.holed = holed;
  ZFactory.buildGround = build;
})();
