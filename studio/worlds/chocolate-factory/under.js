/* Zungga Chocolate Factory — UNDERGROUND (the forgotten foundation). Reached only through the bookshelf in the
 * Recipe Library: a secret spiral staircase (with a spiral slide in its core) runs from the first floor (y 13) through
 * Mr. Choco's office pillar down to the Hidden Entrance (y −10). Then: Secret Spiral Staircase down to y −14,
 * tunnels, machinery hall, the swimmable Chocolate Reservoir, the old vault, the Puzzle Corridor (three puzzle doors),
 * the Hall of Founders, the round door of the Secret Recipe Vault and the stairs down to the Secret Chamber (y −17).
 * Room decoration comes from ZFactory.dress[<room id>] (dress-under.js). */
(() => {
  'use strict';
  const T = THREE;
  function rockTex(base = '#4a3a33', line = '#2a201c') {
    const t = ZA.tex((c, W, H) => { c.fillStyle = base; c.fillRect(0, 0, W, H); for (let r = 0; r < 7; r++) for (let k = 0; k < 5; k++) { const x = (k + (r % 2) * 0.5) * W / 5, y = r * H / 7; c.fillStyle = ['#56443b', '#4d3d35', '#5d4a40', '#463830'][(r + k) % 4]; c.beginPath(); c.roundRect(x + 3, y + 3, W / 5 - 6, H / 7 - 6, 8); c.fill(); } c.strokeStyle = line; c.lineWidth = 2; for (let i = 0; i < 40; i++) { c.beginPath(); const x = Math.random() * W, y = Math.random() * H; c.moveTo(x, y); c.lineTo(x + Math.random() * 20 - 10, y + Math.random() * 20 - 10); c.stroke(); } }, 256, 256);
    t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }

  function build(W) {
    const L = ZFactory.layout, U = L.under, G = L.ground, F = L.first, c = W.frame('under'), sh = W.frame('shaft'), M = W.M, P = (v) => v * L.scale.K;
    const wallTex = rockTex(), floorTex = rockTex('#6b5a4c', '#3b2e26'); wallTex.repeat.set(3, 1); floorTex.repeat.set(6, 6);
    const rock = new T.MeshStandardMaterial({ map: wallTex, roughness: 0.95 }), floorM = new T.MeshStandardMaterial({ map: floorTex, roughness: 0.9 }), ceilM = new T.MeshStandardMaterial({ color: 0x2f2522, roughness: 1 });
    const R = Object.fromEntries(U.rooms.map((r) => [r.id, r]));
    const torch = (x, y, z) => { const g = new T.Group(); const st = new T.Mesh(new T.CylinderGeometry(0.05, 0.07, 0.5, 8), M(0x5b3420)); st.position.y = 0.25; g.add(st); const fl = new T.Mesh(new T.ConeGeometry(0.12, 0.32, 10), M(0xffb347, { emissive: 0xff8c1a, emissiveIntensity: 2 })); fl.position.y = 0.62; g.add(fl); g.position.set(x, y, z); c.g.add(g); c.tick((t) => { fl.scale.set(1 + Math.sin(t * 13 + x) * 0.12, 1 + Math.sin(t * 9 + z) * 0.18, 1); }, fl); return g; };
    const light = (x, y, z, col = 0xffa04a, i = 26, d = 22) => { const p = new T.PointLight(col, i, d, 1.6); p.position.set(x, y, z); c.g.add(p); return p; };

    // a rock room: floor slab, walls with doors ({ side, at, w, h, y }), ceiling (optionally with a square hole)
    function rockRoom(r, doors, o = {}) {
      const w = r.x1 - r.x0, d = r.z1 - r.z0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, y0 = o.base ?? r.y, h = o.h ?? r.h, f = c.frame(cx, cz, 0, y0);
      if (o.floor !== false) { if (o.floorHole) ZFactory.holed(f, w, d, o.floorHole, (ww, dd, x, z) => f.box(ww, 0.5, dd, x, -0.5, z, floorM, { cast: false })); else f.box(w, 0.5, d, 0, -0.5, 0, floorM, { cast: false }); }
      const D = { n: [], s: [], e: [], w: [] }; for (const dr of doors) D[dr.side].push({ at: dr.at, w: dr.w ?? 2.4, h: dr.h ?? 2.8, y: dr.y ?? 0 });
      f.room({ w, d, h, y: 0, t: 0.6, floor: false, wallMat: rock, doors: D });
      for (const dr of doors) { if (dr.noDoor) continue; const half = dr.side === 'n' || dr.side === 's' ? d / 2 : w / 2, ns = dr.side === 'n' || dr.side === 's';   // old wooden doors in every doorway
        const px = ns ? dr.at : (dr.side === 'e' ? half : -half), pz = ns ? (dr.side === 's' ? half : -half) : dr.at; f.frame(px, pz, ns ? 0 : Math.PI / 2, dr.y ?? 0).doubleDoor({ x: 0, z: 0, w: dr.w ?? 2.4, h: dr.h ?? 2.8, color: 0x7a4a26, label: r.name }); }
      if (o.ceilingHole) ZFactory.holed(f, w + 1.2, d + 1.2, o.ceilingHole, (ww, dd, x, z) => f.ceiling(ww, dd, x, h, z, ceilM, { t: 0.6 })); else f.ceiling(w + 1.2, d + 1.2, 0, h, 0, ceilM, { t: 0.6 });
      c.area({ id: r.id, num: r.num, name: r.name, x: cx, z: cz, w, d, y0: y0 - 1.5, y1: y0 + h });
      return { f, w, d, cx, cz, y0, h };
    }
    // a short straight tunnel between two rooms (axis-aligned), floor at y
    function tunnel(x0, z0, x1, z1, y, wd = 3.2, h = 3.4) {
      const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0), L2 = Math.abs(alongX ? x1 - x0 : z1 - z0) + 0.8, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, f = c.frame(cx, cz, alongX ? Math.PI / 2 : 0, y);
      f.box(wd + 1.2, 0.5, L2, 0, -0.5, 0, floorM, { cast: false });
      for (const sx of [-1, 1]) f.box(0.6, h, L2, sx * (wd / 2 + 0.3), 0, 0, rock);
      f.ceiling(wd + 1.2, L2, 0, h, 0, ceilM, { t: 0.6 });
      return f;
    }
    const dress = (id, f, spec) => {
      if (ZFactory.dress[id]) W.dressRun(() => ZFactory.dress[id](f, spec), f);
      const cx = f.ox, cz = f.oz, w = spec.w, d = spec.d;   // every doorway → the middle of the room stays walkable
      for (const dr of spec.doors || []) { const ns = dr.side === 'n' || dr.side === 's', half = ns ? d / 2 : w / 2, sgn = dr.side === 's' || dr.side === 'e' ? 1 : -1, len = half + 2.5;
        W.lanes.push(ns ? { x: cx + dr.at, z: cz + sgn * (half + 2.5 - len / 2), ry: 0, hw: 1.5, hd: len / 2, y: f.oy + (dr.y || 0) } : { x: cx + sgn * (half + 2.5 - len / 2), z: cz + dr.at, ry: Math.PI / 2, hw: 1.5, hd: len / 2, y: f.oy + (dr.y || 0) }); }
    };
    const specOf = (r, extra = {}) => ({ id: r.id, name: r.name, w: r.x1 - r.x0, d: r.z1 - r.z0, h: r.h, y: 0, floor: 'under', ...extra });

    // ---------- the secret shaft: library (y 13) → Hidden Entrance (y −10) ----------
    const S = G.shaft, top = F.y, bot = U.rooms[0].y;
    {
      const per = 14, rise = 0.2, n = Math.round((top - bot) / rise), da = Math.PI * 2 / per, frac = (n / per) % 1;
      const aEnd = Math.PI / 3, a0 = aEnd - frac * Math.PI * 2;
      sh.spiral({ x: S.x, z: S.z, y0: bot, y1: top, r0: 1.1, r1: 2.3, a0, dir: 1, per, rise, mat: 0x8d7b6a, rail: 0x6e5a4b, wallR: S.r, wallY0: -5, wallY1: top - 0.6, noColumn: true, landing: 6 });
      // little platform in the core at the top, next to the slide start
      sh.cyl(1.05, 1.05, 0.3, S.x, top - 0.3, S.z, 0x6e5a4b, { seg: 20 });
      // golden guardrails round the opening: only the top landing (stairs down + the slide in the core) is open, so the
      // rest of the hidden room's floor is safe — the rail runs on the floor rim (outer) and round the core platform (inner)
      { const aOpen0 = aEnd - 0.12, aOpen1 = aEnd + 6 * da + 0.05, span = Math.PI * 2 - (aOpen1 - aOpen0), gold = M(0xd4a017, { metalness: 0.7, roughness: 0.3 });
        for (const [rr, segs] of [[S.r + 0.02, 30], [1.08, 12]]) {
          for (let k = 0; k < segs; k++) {
            const a = aOpen1 + span * (k + 0.5) / segs, wl = span * rr / segs + 0.04, px = S.x + Math.sin(a) * rr, pz = S.z + Math.cos(a) * rr;
            const bar = new T.Mesh(new T.BoxGeometry(0.07, 0.07, wl), gold); bar.position.set(px, top + 1.0, pz); bar.rotation.y = a + Math.PI / 2; sh.g.add(bar);
            const mid = new T.Mesh(new T.BoxGeometry(0.04, 0.04, wl), gold); mid.position.set(px, top + 0.5, pz); mid.rotation.y = a + Math.PI / 2; sh.g.add(mid);
            sh.col(0.12, 1.05, wl, px, top, pz, { ry: a + Math.PI / 2, nocam: true });
          }
          for (let k = 0; k <= segs; k++) { const a = aOpen1 + span * k / segs; sh.box(0.07, 1.04, 0.07, S.x + Math.sin(a) * rr, top, S.z + Math.cos(a) * rr, gold, { col: false, cast: false }); }
        }
      }
      // spiral slide down the core (8 turns), shooting out into the Hidden Entrance at the bottom
      const pts = [], turns = 8, N = turns * 12, aS = aEnd + Math.PI * 0.45, rS = 0.55, yS = top + 0.3, yE = bot + 0.55;
      for (let i = 0; i <= N; i++) { const a = aS - (i / N) * turns * Math.PI * 2, y = yS - (yS - yE) * (i / N); pts.push([S.x + Math.sin(a) * rS, y, S.z + Math.cos(a) * rS]); }
      const aOut = a0 - 0.8;   // where the bottom steps are still high overhead
      const aLast = aS - turns * Math.PI * 2; void aLast;
      pts.push([S.x + Math.sin(aOut) * 1.6, yE - 0.15, S.z + Math.cos(aOut) * 1.6], [S.x + Math.sin(aOut) * 3.2, bot + 0.25, S.z + Math.cos(aOut) * 3.2], [S.x + Math.sin(aOut) * 4.4, bot + 0.2, S.z + Math.cos(aOut) * 4.4]);
      sh.slide(pts, { name: 'Secret spiral slide', color: 0x7c3aed, w: 0.9, groundY: bot });
      // keep the shaft foot and the slide's landing path free of furniture
      W.keepOut = (W.keepOut || []).concat({ x0: S.x - S.r - 1, x1: S.x + S.r + 1, z0: S.z - S.r - 1, z1: S.z + S.r + 1, y: bot });
      { const ex = S.x + Math.sin(aOut) * 4.4, ez = S.z + Math.cos(aOut) * 4.4, mx = (S.x + ex) / 2, mz = (S.z + ez) / 2, len = Math.hypot(ex - S.x, ez - S.z) + 5; W.lanes.push({ x: mx, z: mz, ry: Math.atan2(ex - S.x, ez - S.z), hw: 1.8, hd: len / 2, y: bot }); }
      // a sign at the top
      const sg = new T.Mesh(new T.PlaneGeometry(1.4, 0.4), new T.MeshStandardMaterial({ map: ZA.label('↓ THE FORGOTTEN FOUNDATION', { w: 512, h: 140, bg: '#1e1b2e', fg: '#c4b5fd', size: 44, radius: 16 }) })); sg.position.set(S.x + 1.2, top + 2.2, F.hidden.z0 + 0.14); sh.g.add(sg);
      // torches down the shaft
      for (let y = 0; y < top - bot; y += 4.5) { const a = a0 + y * 0.9; const tx = S.x + Math.sin(a) * (S.r - 0.1), tz = S.z + Math.cos(a) * (S.r - 0.1); const tg = new T.Group(); const fl = new T.Mesh(new T.ConeGeometry(0.1, 0.28, 10), M(0xffb347, { emissive: 0xff8c1a, emissiveIntensity: 2 })); fl.position.set(tx, bot + y + 2.0, tz); tg.add(fl); sh.g.add(tg); }
      const pl = new T.PointLight(0xffb060, 18, 14, 1.6); pl.position.set(S.x, top - 3, S.z); sh.g.add(pl); const pl2 = new T.PointLight(0xffb060, 18, 14, 1.6); pl2.position.set(S.x, (top + bot) / 2, S.z); sh.g.add(pl2);
      W.frame('shaft').area({ id: 'secret_shaft', num: 0, name: 'Secret shaft (spiral stairs + slide)', x: S.x, z: S.z, w: 5, d: 5, y0: bot + 1.2, y1: top - 0.4 });
    }

    // ---------- 1 · Hidden Entrance (y −10) ----------
    { const r = R.hidden_entrance, k = rockRoom(r, [{ side: 'e', at: P(-47) - (r.z0 + r.z1) / 2, w: 3.2, h: 3.2 }], { ceilingHole: { x: S.x - (r.x0 + r.x1) / 2, z: S.z - (r.z0 + r.z1) / 2, r: S.r + 0.6 } });
      torch(r.x0 + 0.5, r.y + 1.8, r.z1 - 3); torch(r.x1 - 0.5, r.y + 1.8, r.z0 + 3); light((r.x0 + r.x1) / 2, r.y + 3.5, r.z1 - 3);
      dress(r.id, k.f, specOf(r, { shaft: { x: S.x - k.cx, z: S.z - k.cz, r: S.r + 0.3 }, doors: [{ side: 'e', at: P(-47) - k.cz }] })); }
    tunnel(R.hidden_entrance.x1, P(-47), R.spiral_staircase.x0, P(-47), U.rooms[0].y);

    // ---------- 2 · Secret Spiral Staircase (y −10 → −14) ----------
    { const r = R.spiral_staircase, sp = r.spiral, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, base = sp.y0, h = r.y + r.h - base;
      const k = rockRoom({ ...r, h }, [{ side: 'w', at: P(-47) - cz, y: r.y - base, w: 3.2, h: 3.2 }, { side: 'e', at: P(-46.5) - cz, w: 3.2, h: 3.2 }], { base, floorHole: null });
      // the upper floor (y −10) with a round-ish hole for the spiral
      ZFactory.holed(c.frame(cx, cz, 0, r.y), r.x1 - r.x0, r.z1 - r.z0, { x: sp.x - cx, z: sp.z - cz, r: 2.25 }, (ww, dd, x, z) => c.frame(cx, cz, 0, r.y).box(ww, 0.5, dd, x, -0.5, z, floorM, { cast: false }));
      // railing round the hole (open on the side where the stairs arrive)
      const rf = c.frame(sp.x, sp.z, 0, r.y);
      for (const [x, z, w2, d2] of [[0, -2.35, 4.8, 0.1], [2.35, 0, 0.1, 4.8], [0, 2.35, 4.8, 0.1]]) rf.box(w2, 1.0, d2, x, 0, z, 0x8a6a4a, { cast: false });
      c.frame(0, 0).spiral({ x: sp.x, z: sp.z, y0: base, y1: r.y, r0: 0.45, r1: 2.2, a0: Math.PI / 2, dir: 1, per: 14, rise: 0.2, mat: 0x9a8574, column: 0x6e5a4b });
      torch(r.x1 - 0.5, base + 1.8, cz + 2.5); torch(r.x0 + 0.5, r.y + 1.8, cz + 3); light(sp.x, r.y + 2.5, sp.z, 0xc4b5fd, 20, 16);
      dress(r.id, k.f, specOf(r, { h, base: base - k.y0, spiral: { x: sp.x - cx, z: sp.z - cz, r: 2.4 }, upperFloorY: r.y - base, doors: [{ side: 'w', at: P(-47) - cz, y: r.y - base }, { side: 'e', at: P(-46.5) - cz }] })); }
    tunnel(R.spiral_staircase.x1, P(-46.5), R.tunnel_network.x0, P(-46.5), -14);

    // ---------- 3 · Forgotten Tunnel Network (maze of rock pillars) ----------
    { const r = R.tunnel_network, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
      const k = rockRoom(r, [{ side: 'w', at: P(-46.5) - cz, w: 3.2, h: 3.2 }, { side: 'e', at: P(-47) - cz, w: 3.2, h: 3.2 }, { side: 's', at: 0 - cx, w: 3.2, h: 3.2 }]);
      const pillars = [[-7.5, -53, 3, 6], [-7.5, -39.5, 3, 4], [-2.5, -49, 3.5, 3], [-2.5, -41, 3.5, 4.5], [3.5, -54, 4, 3], [3.5, -45.5, 3, 5], [8.5, -40, 3, 5], [8.5, -52.5, 2.5, 4]].map(([x, z, w2, d2]) => [P(x), P(z), P(w2), P(d2)]);
      for (const [x, z, w2, d2] of pillars) { c.box(w2, r.h, d2, x, r.y, z, rock); }
      for (const [x, z] of [[-10.8, -50], [-4.6, -44], [1, -38], [6, -50], [10.8, -44]]) torch(P(x), r.y + 1.7, P(z));
      light(P(-5), r.y + 3, P(-46), 0xffa04a, 30, 24); light(P(5), r.y + 3, P(-41), 0xffa04a, 30, 24);
      dress(r.id, k.f, specOf(r, { pillars: pillars.map(([x, z, w2, d2]) => ({ x: x - cx, z: z - cz, w: w2, d: d2 })), doors: [{ side: 'w', at: P(-46.5) - cz }, { side: 'e', at: P(-47) - cz }, { side: 's', at: 0 - cx }] })); }
    tunnel(R.tunnel_network.x1, P(-47), R.machinery_hall.x0, P(-47), -14);
    tunnel(0, R.tunnel_network.z1, 0, R.chocolate_reservoir.z0, -14);

    // ---------- 4 · Ancient Machinery Hall ----------
    { const r = R.machinery_hall, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, k = rockRoom(r, [{ side: 'w', at: P(-47) - cz, w: 3.2, h: 3.2 }]);
      for (const [x, z] of [[r.x0 + 0.4, P(-42)], [r.x1 - 0.4, P(-42)], [cx, r.z0 + 0.4], [cx, r.z1 - 0.4]]) torch(x, r.y + 2.2, z);
      light(cx, r.y + 5, cz, 0xffb060, 40, 30);
      dress(r.id, k.f, specOf(r, { doors: [{ side: 'w', at: P(-47) - cz }] })); }

    // ---------- 5 · Chocolate Reservoir (swimmable pool) ----------
    { const r = R.chocolate_reservoir, p = r.pool, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, w = r.x1 - r.x0, d = r.z1 - r.z0, f = c.frame(cx, cz, 0, r.y);
      const doors = [{ side: 'n', at: 0 - cx, w: 3.2, h: 3.2 }, { side: 'w', at: P(-26) - cz, w: 3.2, h: 3.2 }, { side: 's', at: P(8) - cx, w: 3.2, h: 3.2 }];
      const k = rockRoom(r, doors, { floor: false });
      // floor around the pool + the basin
      const px = (p.x0 + p.x1) / 2 - cx, pz = (p.z0 + p.z1) / 2 - cz, pw = p.x1 - p.x0, pd = p.z1 - p.z0;
      const rects = [[-w / 2, -d / 2, w / 2, pz - pd / 2], [-w / 2, pz + pd / 2, w / 2, d / 2], [-w / 2, pz - pd / 2, px - pw / 2, pz + pd / 2], [px + pw / 2, pz - pd / 2, w / 2, pz + pd / 2]];
      for (const [x0, z0, x1, z1] of rects) if (x1 - x0 > 0.05 && z1 - z0 > 0.05) f.box(x1 - x0, 0.5, z1 - z0, (x0 + x1) / 2, -0.5, (z0 + z1) / 2, floorM, { cast: false });
      f.box(pw, 0.4, pd, px, -2.6, pz, 0x3b2a20, { cast: false });                         // basin bed (2.2 m down)
      for (const [x, z, w2, d2] of [[px, pz - pd / 2 - 0.15, pw + 0.6, 0.3], [px, pz + pd / 2 + 0.15, pw + 0.6, 0.3], [px - pw / 2 - 0.15, pz, 0.3, pd], [px + pw / 2 + 0.15, pz, 0.3, pd]]) f.box(w2, 2.2, d2, x, -2.2, z, rock, { cast: false });
      for (const [x, z, w2, d2] of [[px, pz - pd / 2 - 0.2, pw + 0.8, 0.4], [px, pz + pd / 2 + 0.2, pw + 0.8, 0.4], [px - pw / 2 - 0.2, pz, 0.4, pd + 0.8], [px + pw / 2 + 0.2, pz, 0.4, pd + 0.8]]) f.box(w2, 0.04, d2, x, 0, z, 0x8a7360, { cast: false, col: false });   // rim stones (flush, so you can climb out)
      f.pool(px, pz, pw, pd, -0.3, { flow: 0.25, glow: 0x2a1408 });
      W.keepOut = (W.keepOut || []).concat({ x0: cx + px - pw / 2 - 1.2, x1: cx + px + pw / 2 + 1.2, z0: cz + pz - pd / 2 - 1.2, z1: cz + pz + pd / 2 + 1.2, y: r.y });
      // two chocolate waterfalls pouring from the back wall into the pool
      const fallM = new T.MeshStandardMaterial({ color: 0x7a4426, roughness: 0.3, transparent: true, opacity: 0.95, emissive: 0x2a1408, emissiveIntensity: 0.4, side: T.DoubleSide });
      for (const x of [px - P(6), px + P(6)]) { const fall = new T.Mesh(new T.PlaneGeometry(1.6, r.h - 0.6, 1, 8), fallM); fall.position.set(x, (r.h - 0.6) / 2 - 0.45, pz - pd / 2 + 0.05); f.g.add(fall); fall.userData.dynamic = true; const lip = new T.Mesh(new T.BoxGeometry(2.2, 0.4, 1.0), rock); lip.position.set(x, r.h - 0.8, pz - pd / 2 - 0.3); f.g.add(lip); }
      f.tick((t) => { fallM.opacity = 0.9 + Math.sin(t * 4) * 0.05; }, null);
      for (const [x, z] of [[r.x0 + 0.5, P(-30)], [r.x1 - 0.5, P(-30)], [P(-10), r.z1 - 0.5], [P(6), r.z0 + 0.5]]) torch(x, r.y + 2.3, z);
      light(cx - 6, r.y + 5, cz, 0xffb060, 36, 30); light(cx + 8, r.y + 5, cz, 0xffb060, 30, 26);
      W.frame('under').area({ id: 'reservoir_pool', num: 5, name: 'Chocolate Reservoir (pool)', x: (p.x0 + p.x1) / 2, z: (p.z0 + p.z1) / 2, w: pw, d: pd, y0: r.y - 3, y1: r.y + 1 });
      dress(r.id, k.f, specOf(r, { pool: { x: px, z: pz, w: pw, d: pd }, doors: doors.map((o) => ({ ...o })) })); }
    tunnel(R.chocolate_reservoir.x0, P(-26), R.ingredient_vault.x1, P(-26), -14);
    tunnel(P(8), R.chocolate_reservoir.z1, P(8), R.puzzle_corridor.z0, -14);

    // ---------- 6 · Old Ingredient Vault ----------
    { const r = R.ingredient_vault, cz = (r.z0 + r.z1) / 2, k = rockRoom(r, [{ side: 'e', at: P(-26) - cz, w: 3.2, h: 3.2 }]);
      torch(r.x0 + 0.5, r.y + 1.8, cz); torch(r.x1 - 0.5, r.y + 1.8, cz - 5); light((r.x0 + r.x1) / 2, r.y + 3, cz, 0xffa04a, 22, 18);
      dress(r.id, k.f, specOf(r, { doors: [{ side: 'e', at: P(-26) - cz }] })); }

    // ---------- 7 · Puzzle Corridor (three puzzle doors) ----------
    { const r = R.puzzle_corridor, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, d = r.z1 - r.z0;
      W.lanes.push({ x: cx, z: cz, ry: Math.PI / 2, hw: 1.8, hd: (r.x1 - r.x0) / 2, y: r.y });   // the corridor's walkway, end to end
      const k = rockRoom(r, [{ side: 'n', at: P(8) - cx, w: 3.2, h: 3.2 }, { side: 's', at: P(-12) - cx, w: 3.4, h: 3.4, noDoor: true }, { side: 'w', at: P(-16.5) - cz, w: 3.2, h: 3.2 }]);
      const glyphs = ['☀', '☾', '★', '♦', '✿', '♥'];
      [[P(4), 0], [P(-4), 1], [P(20), 2]].forEach(([x, gi]) => {
        const f = c.frame(x, cz, Math.PI / 2, r.y);   // a rock wall across the corridor with a door gap
        f.wall(-d / 2, 0, d / 2, 0, { h: r.h, t: 0.6, mat: rock, doors: [{ at: d / 2, w: 2.2, h: 2.8 }] });
        const leaf = new T.Group(); const slab = new T.Mesh(new T.BoxGeometry(2.2, 2.8, 0.3), M(0x4c1d95, { roughness: 0.5 })); slab.position.y = 1.4; leaf.add(slab);
        const wheel = new T.Mesh(new T.TorusGeometry(0.55, 0.08, 10, 30), M(0xfacc15, { emissive: 0xb45309, emissiveIntensity: 0.6 })); wheel.position.set(0, 1.5, 0.17); leaf.add(wheel);
        const marks = []; for (let i = 0; i < 3; i++) { const m = new T.Mesh(new T.CircleGeometry(0.12, 16), M(0x6b7280, { emissive: 0x000000 })); m.position.set(-0.45 + i * 0.45, 2.45, 0.16); leaf.add(m); marks.push(m); }
        const sgn = new T.Mesh(new T.PlaneGeometry(0.6, 0.6), new T.MeshBasicMaterial({ map: ZA.label(glyphs[gi * 2], { w: 128, h: 128, bg: '#4c1d95', fg: '#fde68a', size: 90 }), transparent: true })); sgn.position.set(0, 1.5, 0.18); leaf.add(sgn);
        const D = f.door({ x: 0, z: 0, w: 2.2, h: 2.8, kind: 'slide', auto: true, mesh: leaf }); D.auto = false; D.want = 0;
        let turns = 0;
        const [wx, wz] = f.W(0, 0);
        W.interacts.push({ test: (p) => Math.hypot(p.x - wx, p.z - wz) < 2.4 && Math.abs(p.y - r.y) < 1.5 && D.want === 0, label: () => `Turn the puzzle wheel (${turns}/3)`, fn: () => { turns++; wheel.rotation.z -= Math.PI * 2 / 3; marks.forEach((m, i) => { m.material = M(i < turns ? 0x22c55e : 0x6b7280, i < turns ? { emissive: 0x16a34a, emissiveIntensity: 1 } : {}); }); if (turns >= 3) D.want = 1; } });
        torch(x - 1.6, r.y + 2.0, r.z0 + 0.45); torch(x + 1.6, r.y + 2.0, r.z0 + 0.45);
      });
      for (const [x, col] of [[-20, 0xffa04a], [-2, 0xc4b5fd], [12, 0xffa04a], [28, 0xc4b5fd], [-26, 0xc4b5fd], [22, 0xffa04a]]) light(P(x), r.y + 3, cz, col, 26, 22);
      dress(r.id, k.f, specOf(r, { puzzleDoorsX: [P(4) - cx, P(-4) - cx, P(20) - cx], vaultDoorX: P(-12) - cx, doors: [{ side: 'n', at: P(8) - cx }, { side: 's', at: P(-12) - cx }, { side: 'w', at: P(-16.5) - cz }] })); }
    tunnel(R.hall_of_founders.x1, P(-16.5), R.puzzle_corridor.x0, P(-16.5), -14);
    // the round vault door at the start of the tunnel down to the vault
    { const f = tunnel(P(-12), R.puzzle_corridor.z1, P(-12), R.recipe_vault.z0, -14, 3.4, 3.6);
      const leaf = new T.Group(); const disc = new T.Mesh(new T.CylinderGeometry(1.55, 1.55, 0.45, 40), M(0x9ca3af, { metalness: 0.75, roughness: 0.3 })); disc.rotation.x = Math.PI / 2; disc.position.set(0, 1.6, 0); leaf.add(disc);
      const ring = new T.Mesh(new T.TorusGeometry(1.2, 0.08, 10, 40), M(0xd4a017, { metalness: 0.7, roughness: 0.3 })); ring.position.set(0, 1.6, 0.25); leaf.add(ring);
      if (ZFactory.faceOn) { const ftk = ZFactory.faceOn(leaf, { y: 2.35, z: 0.3, s: 1.3, lid: 0x6b7280 }); c.tick(ftk); }   // the vault door is alive too (it keeps the secrets)
      const wheel = new T.Group(); for (let i = 0; i < 6; i++) { const sp = new T.Mesh(new T.BoxGeometry(0.08, 1.4, 0.08), M(0x4b5563, { metalness: 0.7 })); sp.rotation.z = i * Math.PI / 3; wheel.add(sp); } const hub = new T.Mesh(new T.CylinderGeometry(0.18, 0.18, 0.2, 16), M(0xd4a017, { metalness: 0.7 })); hub.rotation.x = Math.PI / 2; wheel.add(hub); wheel.position.set(0, 1.6, 0.32); leaf.add(wheel);
      const D = f.door({ x: 0, z: -(R.recipe_vault.z0 - R.puzzle_corridor.z1) / 2 + 0.6, w: 3.2, h: 3.4, kind: 'vault', auto: false, label: 'Spin the vault wheel', mesh: leaf });
      f.tick((t, dt) => { wheel.rotation.z += (D.want ? 2.5 : 0) * (dt || 0.016) * (D.open < 1 ? 1 : 0); }, wheel);
      const [wx, wz] = f.W(0, -(R.recipe_vault.z0 - R.puzzle_corridor.z1) / 2 + 0.6); W.anchors.push({ id: 'U-09b', label: 'Vault door close-up', floor: 'under', pos: [wx + 2.4, -14 + 1.8, wz - 3], look: [wx, -14 + 1.6, wz] }); }

    // ---------- 8 · Hall of Founders ----------
    { const r = R.hall_of_founders, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, k = rockRoom(r, [{ side: 'e', at: P(-16.5) - cz, w: 3.2, h: 3.2 }]);
      for (const [x, z] of [[r.x0 + 0.5, cz - 6], [r.x0 + 0.5, cz + 6], [r.x1 - 0.5, cz + 4], [cx - 6, r.z1 - 0.5], [cx + 6, r.z1 - 0.5]]) torch(x, r.y + 2.4, z);
      light(cx, r.y + 4.5, cz, 0xffb060, 34, 28);
      dress(r.id, k.f, specOf(r, { doors: [{ side: 'e', at: P(-16.5) - cz }] })); }

    // ---------- 9 · Secret Recipe Vault ----------
    { const r = R.recipe_vault, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, k = rockRoom(r, [{ side: 'n', at: P(-12) - cx, w: 3.4, h: 3.4, noDoor: true }, { side: 'e', at: 0 - cz, w: 3.2, h: 3.2 }]);
      for (const [x, z] of [[r.x0 + 0.5, cz], [r.x1 - 0.5, cz - 6], [cx - 5, r.z1 - 0.5], [cx + 5, r.z1 - 0.5]]) torch(x, r.y + 2.4, z);
      light(cx, r.y + 4.2, cz, 0xffc070, 32, 24);
      dress(r.id, k.f, specOf(r, { doors: [{ side: 'n', at: P(-12) - cx }, { side: 'e', at: 0 - cz }] })); }
    // the stairs down from the vault to the secret chamber (y −14 → −17), in a passage
    { const y0 = R.secret_chamber.y, y1 = R.recipe_vault.y, xa = R.recipe_vault.x1, xb = R.secret_chamber.x0, L2 = xb - xa, f = c.frame((xa + xb) / 2, 0, 0, 0);
      f.box(L2 + 1.2, 0.5, 4.4, 0, y0 - 0.5, 0, floorM, { cast: false });
      for (const sz of [-1, 1]) f.box(L2 + 1.2, y1 + 3.8 - y0, 0.6, 0, y0, sz * 1.9, rock);
      f.ceiling(L2 + 1.2, 4.4, 0, y1 + 3.6, 0, ceilM, { t: 0.6 });
      const st = f.stairs({ x: L2 / 2, z: 0, y0, y1, w: 3.2, ry: Math.PI / 2, rise: 3 / 17, run: 0.3, mat: 0x8a7360, side: 0x6e5a4b, rails: false });
      const flat = L2 - st.n * 0.3; f.box(flat + 0.6, 0.5, 3.2, -L2 / 2 + flat / 2 - 0.3, y1 - 0.5, 0, floorM, { cast: false }); }
    // ---------- 10 · The Secret Chamber (y −17) ----------
    { const r = R.secret_chamber, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, k = rockRoom(r, [{ side: 'w', at: 0 - cz, w: 3.2, h: 3.6 }]);
      // a shaft of blue light from the ceiling onto the centre
      const beam = new T.Mesh(new T.CylinderGeometry(2.2, 3.4, r.h, 32, 1, true), new T.MeshBasicMaterial({ color: 0x9bd8ff, transparent: true, opacity: 0.12, depthWrite: false, side: T.DoubleSide })); beam.position.set(cx, r.y + r.h / 2, cz); beam.userData.dynamic = true; c.g.add(beam);
      c.tick((t) => { beam.material.opacity = 0.1 + Math.sin(t * 1.3) * 0.03; }, null);
      light(cx, r.y + 6, cz, 0x8ec5ff, 60, 30); light(cx - 9, r.y + 3, cz + 6, 0xc084fc, 22, 18); light(cx + 9, r.y + 3, cz - 6, 0x67e8f9, 22, 18);
      dress(r.id, k.f, specOf(r, { doors: [{ side: 'w', at: 0 - cz }] })); }

    for (const a of U.anchors) c.anchor(a[0], a[1], a[2], a[3]);
  }
  ZFactory.buildUnder = build;
  // after all three floors: clear every walkway of furniture (call before baking)
  ZFactory.finish = (W) => W.clearLanes();
})();
