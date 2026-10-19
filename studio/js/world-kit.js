/*
 * Zungga Story Studio — world kit: builds big connected, walkable worlds (several floors) and answers the physics
 * questions the walker asks (what is under my feet, what blocks me, where is water, which slide / lift / door is here).
 *
 *   const W = ZWorld.create(scene)            → world (floors: ground / first / under)
 *   const c = W.frame('ground', x, z, ry, y)  → a building frame: local coords, door usually at local +z
 *   c.box(w, h, d, x, y, z, colorOrMat, { ry, r, col, cast })    y = BOTTOM of the box; adds a solid collider
 *   c.col(w, h, d, x, y, z, { ry })                               collider only
 *   c.ramp(w, len, x, z, yA, yB, mat, { ry, thick })              walkable slope (yA at local −z end, yB at +z end)
 *   c.stairs({ x, z, y0, y1, w, ry, mat })                        climbs toward local −z (rotated by ry); returns the top point
 *   c.spiral({ x, z, y0, y1, r0, r1, a0, dir, per, mat })         spiral staircase around (x, z)
 *   c.wall(x1, z1, x2, z2, { h, t, y, mat, doors: [{ at, w, h }] })
 *   c.room({ x, z, y, w, d, h, t, wallMat, floorMat, doors: { n, s, e, w: [{ at, w, h }] } })   at = from the room centre
 *   c.prop(id, x, y, z, ry, s, { col })                           library prop with an automatic collider
 *   c.water(points, width, surfaceY, opts) / c.pool(x, z, w, d, surfaceY, opts)                swimmable water
 *   c.slide(points3, opts)                                        a slide the walker rides from points3[0] to the end
 *   c.elevator({ x, z, w, d, levels, side })                      a working lift (E inside / call buttons)
 *   c.door({ x, y, z, w, h, ry, kind, auto, label })              slide / swing / shelf (secret) / vault doors
 *   c.area({ id, num, name, x, z, w, d, y0, y1 }) · c.anchor(id, label, pos, look) · c.roof(obj, region) · c.tick(fn)
 */
(() => {
  'use strict';
  const T = THREE, CELL = 4;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function create(scene) {
    const placed = [], seats = [], details = [], doorKeys = new Set(), ceilings = [], floors = {}, cols = [], grid = new Map(), terrains = [], waters = [], slides = [], interacts = [], areas = [], anchors = [], ticks = [], roofs = [], elevators = [], doors = [];
    for (const n of ['under', 'ground', 'first', 'shaft']) { floors[n] = new T.Group(); floors[n].name = n; scene.add(floors[n]); }
    const matCache = new Map();
    const M = (c, o = {}) => { if (c && c.isMaterial) return c; const k = c + JSON.stringify(o); if (!matCache.has(k)) matCache.set(k, new T.MeshStandardMaterial({ color: c, roughness: 0.75, ...o })); return matCache.get(k); };

    // ---------- colliders ----------
    function addCol(c) {
      c.c = Math.cos(c.ry || 0); c.s = Math.sin(c.ry || 0); c.on = c.on !== false;
      const ex = Math.abs(c.hx * c.c) + Math.abs(c.hz * c.s), ez = Math.abs(c.hx * c.s) + Math.abs(c.hz * c.c);
      c.ax0 = c.x - ex; c.ax1 = c.x + ex; c.az0 = c.z - ez; c.az1 = c.z + ez;
      for (let i = Math.floor(c.ax0 / CELL); i <= Math.floor(c.ax1 / CELL); i++) for (let k = Math.floor(c.az0 / CELL); k <= Math.floor(c.az1 / CELL); k++) { const key = i + ',' + k; if (!grid.has(key)) grid.set(key, []); grid.get(key).push(c); }
      cols.push(c); return c;
    }
    // world → collider local
    const toLocal = (c, x, z) => { const dx = x - c.x, dz = z - c.z; return [dx * c.c - dz * c.s, dx * c.s + dz * c.c]; };
    const topAt = (c, lz) => c.kind === 'ramp' ? c.ra + (c.rb - c.ra) * clamp((lz + c.hz) / (2 * c.hz), 0, 1) : c.y1;
    function near(x0, z0, x1, z1) {
      const out = new Set();
      for (let i = Math.floor(Math.min(x0, x1) / CELL); i <= Math.floor(Math.max(x0, x1) / CELL); i++) for (let k = Math.floor(Math.min(z0, z1) / CELL); k <= Math.floor(Math.max(z0, z1) / CELL); k++) { const l = grid.get(i + ',' + k); if (l) for (const c of l) if (c.on) out.add(c); }
      return out;
    }

    // ---------- frames (local building coordinates) ----------
    function frame(floor, ox = 0, oz = 0, ry = 0, oy = 0, parent) {
      const g = new T.Group(); g.position.set(ox, oy, oz); g.rotation.y = ry; (parent || floors[floor]).add(g);
      const co = Math.cos(ry), si = Math.sin(ry);
      const W = (x, z) => [ox + x * co + z * si, oz - x * si + z * co];   // local → world (matches Object3D rotation.y)
      const f = {
        floor, g, ox, oy, oz, ry, W, M,
        frame: (x, z, r = 0, y = 0) => { const [wx, wz] = W(x, z); return frame(floor, wx, wz, ry + r, oy + y); },
        col(w, h, d, x, y, z, o = {}) { const [wx, wz] = W(x, z); return addCol({ x: wx, z: wz, hx: w / 2, hz: d / 2, y0: oy + y, y1: oy + y + h, ry: ry + (o.ry || 0), kind: 'box', tag: o.tag, nocam: o.nocam }); },
        box(w, h, d, x, y, z, m, o = {}) {
          const geo = o.r ? ZA.roundBox(w, h, d, o.r) : new T.BoxGeometry(w, h, d);
          const me = new T.Mesh(geo, M(m)); me.position.set(x, y + h / 2, z); me.rotation.y = o.ry || 0; me.castShadow = o.cast !== false; me.receiveShadow = true; (o.parent || g).add(me);
          if (o.col !== false) me.userData.col = f.col(w, h, d, x, y, z, o);
          return me;
        },
        cyl(rt, rb, h, x, y, z, m, o = {}) {
          const me = new T.Mesh(new T.CylinderGeometry(rt, rb, h, o.seg || 24, 1, !!o.open), M(m, o.side ? { side: T.DoubleSide } : {})); me.position.set(x, y + h / 2, z); me.castShadow = o.cast !== false; me.receiveShadow = true; (o.parent || g).add(me);
          if (o.col !== false) { const r = Math.max(rt, rb) * 0.86; f.col(r * 2, h, r * 2, x, y, z, { ry: Math.PI / 4 }); f.col(r * 2, h, r * 2, x, y, z); }
          return me;
        },
        ramp(w, len, x, z, yA, yB, m, o = {}) {
          const th = o.thick ?? 0.25, dy = yB - yA, L = Math.hypot(len, dy), a = Math.atan2(dy, len);
          const me = new T.Mesh(new T.BoxGeometry(w, th, L), M(m)); me.position.set(x, (yA + yB) / 2 - th / 2 * Math.cos(a), z); me.rotation.order = 'YXZ'; me.rotation.y = o.ry || 0; me.rotation.x = -a;
          me.castShadow = true; me.receiveShadow = true; (o.parent || g).add(me);
          const [wx, wz] = W(x, z); addCol({ x: wx, z: wz, hx: w / 2, hz: len / 2, y0: oy + Math.min(yA, yB) - th - (o.under ?? 0.2), y1: oy + Math.max(yA, yB), ry: ry + (o.ry || 0), kind: 'ramp', ra: oy + yA, rb: oy + yB });
          return me;
        },
        // straight flight; climbs toward local −z of its own rotation. Returns { x, z, y } of the top edge (in this frame).
        stairs({ x, z, y0, y1, w = 1.6, ry: r = 0, rise = 0.18, run = 0.32, mat = 0xc9a27a, side = 0x8a5a33, rails = true }) {
          const n = Math.max(1, Math.round((y1 - y0) / rise)), h = (y1 - y0) / n, sg = f.frame(x, z, r);
          for (let i = 0; i < n; i++) { const top = h * (i + 1); sg.box(w, top, run, 0, y0, -run * (i + 0.5), i % 2 ? mat : M(mat, { color: new T.Color(mat).multiplyScalar(0.94) }), { r: 0, cast: i % 3 === 0 }); }
          if (rails) for (const sx of [-1, 1]) {
            const L = n * run, hh = y1 - y0, rl = new T.Mesh(new T.BoxGeometry(0.08, 0.08, Math.hypot(L, hh)), M(side)); rl.position.set(sx * (w / 2 - 0.04), y0 + hh / 2 + 0.9, -L / 2); rl.rotation.x = Math.atan2(hh, L); sg.g.add(rl);
            for (let i = 0; i <= n; i += 3) sg.box(0.05, 0.9, 0.05, sx * (w / 2 - 0.04), y0 + h * i + 0.02, -run * i - run / 2, side, { col: false, cast: false });
            const [cx, cz] = sg.W(sx * (w / 2 + 0.05), -n * run / 2);   // sloped rail collider: 1 m above the steps all the way up
            addCol({ x: cx, z: cz, hx: 0.05, hz: n * run / 2, y0: sg.oy + y0, y1: sg.oy + y1 + 1, ry: sg.ry, kind: 'ramp', ra: sg.oy + y1 + 1, rb: sg.oy + y0 + 1, nocam: true });
          }
          const [ex, ez] = [x - Math.sin(r) * n * run, z - Math.cos(r) * n * run]; return { x: ex, z: ez, y: y1, n };
        },
        spiral({ x, z, y0, y1, r0 = 0.5, r1 = 2.2, a0 = 0, dir = 1, per = 18, rise = 0.2, mat = 0xbfa07a, column = 0x8a7a66, rail = 0x6b4f3a, wallR = 0, wallY0, wallY1, noColumn = false, landing = 0 }) {
          const n = Math.max(2, Math.round((y1 - y0) / rise)), h = (y1 - y0) / n, da = (Math.PI * 2 / per) * dir, rm = (r0 + r1) / 2, wd = r1 - r0, arc = Math.abs(da) * r1 * 1.08;
          for (let i = 0; i < n; i++) {
            const a = a0 + da * (i + 0.5), px = x + Math.sin(a) * rm, pz = z + Math.cos(a) * rm;
            const me = new T.Mesh(new T.BoxGeometry(wd, h * 1.0 + 0.12, arc), M(mat)); me.position.set(px, y0 + h * (i + 1) - (h + 0.12) / 2, pz); me.rotation.y = a; me.castShadow = i % 4 === 0; me.receiveShadow = true; g.add(me);
            const [wx, wz] = W(px, pz); addCol({ x: wx, z: wz, hx: wd / 2, hz: arc / 2 * 0.98, y0: oy + y0 + h * (i + 1) - 0.35, y1: oy + y0 + h * (i + 1), ry: ry + a, kind: 'box', tag: 'step' });
          }
          for (let i = n; i < n + landing; i++) {   // flat landing steps after the top
            const a = a0 + da * (i + 0.5), px = x + Math.sin(a) * rm, pz = z + Math.cos(a) * rm;
            const me = new T.Mesh(new T.BoxGeometry(wd, 0.3, arc), M(mat)); me.position.set(px, y1 - 0.15, pz); me.rotation.y = a; me.receiveShadow = true; g.add(me);
            const [wx, wz] = W(px, pz); addCol({ x: wx, z: wz, hx: wd / 2, hz: arc / 2 * 0.98, y0: oy + y1 - 0.3, y1: oy + y1, ry: ry + a, kind: 'box', tag: 'step' });
          }
          if (!noColumn) f.cyl(r0, r0, y1 - y0 + 1.2, x, y0, z, column, { seg: 20 });
          if (wallR) { const segs = 28, wy0 = wallY0 ?? y0 - 0.2, wy1 = wallY1 ?? y1 + 2.4; for (let k = 0; k < segs; k++) { const a = k / segs * Math.PI * 2, wl = 2 * Math.PI * wallR / segs + 0.1; f.box(0.4, wy1 - wy0, wl, x + Math.sin(a) * (wallR + 0.2), wy0, z + Math.cos(a) * (wallR + 0.2), rail, { ry: a + Math.PI / 2, cast: false, nocam: false }); } }
          return { n, h, aEnd: a0 + da * n };
        },
        // a wall from (x1,z1) to (x2,z2) with door gaps; `at` = distance of the door centre from (x1,z1)
        wall(x1, z1, x2, z2, { h = 3, t = 0.25, y = 0, mat = 0xf1e3cf, doors = [], windows = [], col = true, cast = true } = {}) {
          const L = Math.hypot(x2 - x1, z2 - z1), ux = (x2 - x1) / L, uz = (z2 - z1) / L, a = Math.atan2(ux, uz) - Math.PI / 2;
          const cuts = doors.map((d) => [d.at - d.w / 2, d.at + d.w / 2, d.h ?? 2.4, d.y ?? 0]).sort((p, q) => p[0] - q[0]);
          let s = 0; const seg = (s0, s1, yb, hh) => { if (s1 - s0 < 0.02 || hh <= 0.01) return; const mid = (s0 + s1) / 2; f.box(s1 - s0, hh, t, x1 + ux * mid, y + yb, z1 + uz * mid, mat, { ry: a, col, cast }); };
          for (const [c0, c1, dh, dy] of cuts) { seg(s, c0, 0, h); seg(c0, c1, 0, dy); seg(c0, c1, dy + dh, h - dy - dh); s = c1; }
          seg(s, L, 0, h);
          for (const wdw of windows) {   // glowing panes on both faces of the wall
            const cx = x1 + ux * wdw.at, cz = z1 + uz * wdw.at, nx = -uz, nz = ux, rot = Math.atan2(nx, nz);
            const pm = M(wdw.glow ?? 0xfff1c9, { emissive: wdw.glow ?? 0xffd890, emissiveIntensity: 0.6 });
            for (const sd of [1, -1]) { const gl = new T.Mesh(new T.PlaneGeometry(wdw.w, wdw.h), pm); gl.position.set(cx + nx * sd * (t / 2 + 0.01), y + (wdw.y ?? 1.6), cz + nz * sd * (t / 2 + 0.01)); gl.rotation.y = rot + (sd < 0 ? Math.PI : 0); g.add(gl); }
          }
          return L;
        },
        // a room centred at (x, z): floor slab (top at y) + 4 walls with door gaps; doors.{n,s,e,w}: [{ at, w, h }] (at from the wall centre)
        room({ x = 0, z = 0, y = 0, w, d, h = 3.2, t = 0.25, wallMat = 0xf1e3cf, floorMat = 0xd9b58c, doors = {}, floor = true, slab = 0.3, windows = {} }) {
          if (floor) f.box(w, slab, d, x, y - slab, z, floorMat, { cast: false });
          const X0 = x - w / 2, X1 = x + w / 2, Z0 = z - d / 2, Z1 = z + d / 2, dd = (k, L) => (doors[k] || []).map((o) => ({ ...o, at: L / 2 + (o.at || 0) })), ww = (k, L) => (windows[k] || []).map((o) => ({ ...o, at: L / 2 + (o.at || 0) }));
          f.wall(X0, Z0, X1, Z0, { h, t, y, mat: wallMat, doors: dd('n', w), windows: ww('n', w) });
          f.wall(X0, Z1, X1, Z1, { h, t, y, mat: wallMat, doors: dd('s', w), windows: ww('s', w) });
          f.wall(X0, Z0, X0, Z1, { h, t, y, mat: wallMat, doors: dd('w', d), windows: ww('w', d) });
          f.wall(X1, Z0, X1, Z1, { h, t, y, mat: wallMat, doors: dd('e', d), windows: ww('e', d) });
          return { X0, X1, Z0, Z1 };
        },
        prop(id, x, y, z, r = 0, s = 1, o = {}) {
          if (!ZAssets.has(id)) return null;
          const p = ZAssets.build(id), obj = p.group; obj.scale.multiplyScalar(s); obj.updateMatrixWorld(true);
          const bb = ZA.frameBox ? ZA.frameBox(obj) : new T.Box3().setFromObject(obj);
          obj.position.set(x, y, z); obj.rotation.y = r; (o.parent || g).add(obj);
          { const [wx2, wz2] = W(x, z), sc2 = obj.scale.x; placed.push({ id, obj, x: wx2, y: oy + y, z: wz2, ry: ry + r, hx: bb.isEmpty() ? 0.4 : (bb.max.x - bb.min.x) / 2, hz: bb.isEmpty() ? 0.4 : (bb.max.z - bb.min.z) / 2, top: bb.isEmpty() ? 1 : bb.max.y, s: sc2 });
            const SEAT = /bench|chair|sofa|armchair|throne|window_seat|bean_bag|cushion|stool/.test(id) && !/table|desk/.test(id); if (SEAT && o.seat !== false) seats.push({ id, x: wx2, y: oy + y, z: wz2, ry: ry + r, h: /bean_bag|cushion/.test(id) ? 0.3 : /sofa|armchair|throne/.test(id) ? 0.48 : 0.45, w: bb.isEmpty() ? 1 : bb.max.x - bb.min.x }); }
          if (obj.userData.tick || p.tick) { obj.userData.dynamic = true; const tk = obj.userData.tick || p.tick; ticks.push((t) => { if (obj.visible) tk(t); }); details.push(obj); }
          if (o.col !== false && !bb.isEmpty()) {
            const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2, cr = Math.cos(r), sr = Math.sin(r);
            const shrink = o.shrink ?? 0.85;
            if ((bb.max.x - bb.min.x) * shrink > 9 || (bb.max.z - bb.min.z) * shrink > 9) console.warn(`world prop ${id} has a very big collider (${(bb.max.x - bb.min.x).toFixed(1)} × ${(bb.max.z - bb.min.z).toFixed(1)} m) — check its scale`);
            f.col((bb.max.x - bb.min.x) * shrink, Math.min(o.colH ?? 99, bb.max.y - Math.max(0, bb.min.y)), (bb.max.z - bb.min.z) * shrink, x + cx * cr + cz * sr, y + Math.max(0, bb.min.y), z - cx * sr + cz * cr, { ry: r });
          }
          return obj;
        },
        water(points, width, surf, o = {}) {
          const wp = points.map(([x, z]) => W(x, z));
          for (let i = 0; i < wp.length - 1; i++) waters.push({ kind: 'seg', ax: wp[i][0], az: wp[i][1], bx: wp[i + 1][0], bz: wp[i + 1][1], hw: width / 2, surf: oy + surf, deep: o.deep ?? 5, flow: o.flow ?? 0.6 });
          if (o.visual !== false) g.add(riverMesh(points, width + (o.overlap ?? 0.6), surf, o));
        },
        pool(x, z, w, d, surf, o = {}) {
          const [wx, wz] = W(x, z); waters.push({ kind: 'rect', x: wx, z: wz, hx: w / 2, hz: d / 2, c: Math.cos(ry + (o.ry || 0)), s: Math.sin(ry + (o.ry || 0)), surf: oy + surf, deep: o.deep ?? 5, round: !!o.round });
          if (o.visual !== false) { const me = new T.Mesh(o.round ? new T.CircleGeometry(w / 2, 40) : new T.PlaneGeometry(w, d), chocoWater(o)); me.rotation.x = -Math.PI / 2; me.rotation.z = o.ry || 0; me.position.set(x, surf, z); me.receiveShadow = true; me.userData.dynamic = true; g.add(me); }
        },
        // points: [[x, y, z], …] in this frame; the rider follows them from the first to the last
        slide(points, o = {}) {
          const v = points.map(([x, y, z]) => { const [wx, wz] = W(x, z); return new T.Vector3(wx, oy + y, wz); });
          const curve = new T.CatmullRomCurve3(v, false, 'centripetal'), L = curve.getLength();
          slides.push({ curve, L, start: v[0], dir: v[1].clone().sub(v[0]).setY(0).normalize(), name: o.name || 'Slide', exit: o.exit ?? 4 });
          // visual: a half-pipe chute along the curve (built in world space → add to the floor group)
          const segs = Math.max(24, Math.round(L * 4)), wdt = o.w ?? 1.1, prof = 9, pos = [], idx = [];
          for (let i = 0; i <= segs; i++) {
            const t = i / segs, p = curve.getPointAt(t), tg = curve.getTangentAt(t), side = new T.Vector3(-tg.z, 0, tg.x).normalize(), up = new T.Vector3().crossVectors(side, tg).normalize();
            for (let k = 0; k <= prof; k++) { const a = Math.PI * (k / prof), q = p.clone().addScaledVector(side, Math.cos(a) * wdt / 2).addScaledVector(up, -Math.sin(a) * wdt * 0.32 + wdt * 0.12); pos.push(q.x, q.y, q.z); }
          }
          for (let i = 0; i < segs; i++) for (let k = 0; k < prof; k++) { const a = i * (prof + 1) + k, b = a + prof + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
          const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
          const me = new T.Mesh(geo, M(o.color ?? 0xff6fae, { side: T.DoubleSide, roughness: 0.35 })); me.castShadow = true; me.receiveShadow = true; floors[floor].add(me);
          // supports
          for (let i = 1; i < 8; i++) { const p = curve.getPointAt(i / 8); if (p.y - (o.groundY ?? oy) > 0.6) { const s2 = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, p.y - (o.groundY ?? oy)), M(0xd1d5db)); s2.position.set(p.x, ((o.groundY ?? oy) + p.y) / 2, p.z); floors[floor].add(s2); } }
          return curve;
        },
        // a lift: cabin platform moving between levels (frame-relative y values); doors on the `side` (local +z by default)
        elevator({ x, z, w = 2.2, d = 2.2, doorW, levels, names = [], color = 0x7c3aed, side = 0 }) {
          const eg = f.frame(x, z, side), cab = new T.Group(); eg.g.add(cab);
          const floorM = M(0xd4c2a8), wallM = M(color, { roughness: 0.5 }), glass = M(0xbfe8ff, { transparent: true, opacity: 0.25, roughness: 0.1 });
          // cabin: floor + back/side walls (move with it) + ceiling light
          const plat = new T.Mesh(new T.BoxGeometry(w - 0.1, 0.2, d - 0.1), floorM); plat.position.y = -0.1; plat.receiveShadow = true; cab.add(plat);
          for (const [px, pz, pw, pd] of [[0, -d / 2 + 0.05, w, 0.1], [-w / 2 + 0.05, 0, 0.1, d], [w / 2 - 0.05, 0, 0.1, d]]) { const m2 = new T.Mesh(new T.BoxGeometry(pw, 2.6, pd), glass); m2.position.set(px, 1.3, pz); cab.add(m2); }
          const lamp = new T.Mesh(new T.BoxGeometry(w - 0.1, 0.12, d - 0.1), M(0xfff6dd, { emissive: 0xfff1c9, emissiveIntensity: 1 })); lamp.position.y = 2.66; cab.add(lamp);
          const [wx, wz] = W(x, z), platCol = addCol({ x: wx, z: wz, hx: (w - 0.1) / 2, hz: (d - 0.1) / 2, y0: oy + levels[0] - 0.2, y1: oy + levels[0], ry: ry + side, kind: 'box', tag: 'lift' });
          // shaft walls (static, full height) with an opening on the door side at every level
          const top = levels[levels.length - 1] + 3, bot = levels[0] - 0.3;
          eg.box(w + 0.4, top - bot, 0.2, 0, bot, -d / 2 - 0.1, color, { cast: false });
          eg.box(0.2, top - bot, d + 0.4, -w / 2 - 0.1, bot, 0, color, { cast: false }); eg.box(0.2, top - bot, d + 0.4, w / 2 + 0.1, bot, 0, color, { cast: false });
          // front: wall pieces between the door openings
          const dw = Math.min(doorW || 1.4, w - 0.4);
          for (let i = 0; i < levels.length; i++) {
            const y0 = levels[i], y1n = i < levels.length - 1 ? levels[i + 1] : top;
            eg.box(w + 0.4, Math.max(0.01, y1n - y0 - 2.5), 0.2, 0, y0 + 2.5, d / 2 + 0.1, color, { cast: false });
            eg.box((w + 0.4 - dw) / 2, 2.5, 0.2, -(dw / 2 + (w + 0.4 - dw) / 4), y0, d / 2 + 0.1, color, { cast: false }); eg.box((w + 0.4 - dw) / 2, 2.5, 0.2, (dw / 2 + (w + 0.4 - dw) / 4), y0, d / 2 + 0.1, color, { cast: false });
          }
          if (levels[0] > -99) eg.box(w + 0.4, 0.01, 0.2, 0, bot - 0.01, d / 2 + 0.1, color, { col: false, cast: false });
          // landing doors: two sliding panels per level
          const panels = levels.map((y0) => { const ps = [-1, 1].map((sx) => { const m2 = new T.Mesh(new T.BoxGeometry(dw / 2, 2.45, 0.08), M(0xe5e7eb, { metalness: 0.5, roughness: 0.3 })); m2.position.set(sx * dw / 4, y0 + 1.225, d / 2 + 0.16); eg.g.add(m2); return m2; }); const c2 = eg.col(dw, 2.45, 0.12, 0, y0, d / 2 + 0.16); return { ps, col: c2, open: 0, y0 }; });
          const L = { ry: ry + side, cab, levels: levels.map((v) => oy + v), names, pos: oy + levels[0], target: oy + levels[0], wait: 0, platCol, panels, x: wx, z: wz, w, d, speed: 2.4, base: oy, eg,
            call(i) { L.target = L.levels[clamp(i, 0, L.levels.length - 1)]; },
            next() { const i = L.levels.findIndex((v) => Math.abs(v - L.pos) < 0.05); L.call(i < 0 ? 0 : (i + 1) % L.levels.length); },
            atLevel() { return L.levels.findIndex((v) => Math.abs(v - L.pos) < 0.02); },
            inside(p) { const [lx, lz] = toLocal({ x: wx, z: wz, c: Math.cos(ry + side), s: Math.sin(ry + side) }, p.x, p.z); return Math.abs(lx) < w / 2 && Math.abs(lz) < d / 2 && Math.abs(p.y - L.pos) < 1.2; },
            update(dt) {
              const lvl = L.atLevel(), arrived = lvl >= 0 && Math.abs(L.target - L.pos) < 0.001;
              L.panels.forEach((p, i) => { const want = arrived && i === lvl ? 1 : 0; p.open = clamp(p.open + Math.sign(want - p.open) * dt * 1.6, 0, 1); p.ps.forEach((m2, k) => { m2.position.x = (k ? 1 : -1) * (dw / 4 + p.open * dw / 2 * 0.95); }); p.col.on = p.open < 0.85; });
              if (!arrived && L.panels.every((p) => p.open < 0.02)) { const step = Math.sign(L.target - L.pos) * Math.min(Math.abs(L.target - L.pos), L.speed * dt); L.pos += step; }
              cab.position.y = L.pos - oy; platCol.y1 = L.pos; platCol.y0 = L.pos - 0.2;
            } };
          cab.userData.dynamic = true; panels.forEach((p) => p.ps.forEach((m2) => { m2.userData.dynamic = true; }));
          elevators.push(L);
          // E inside = go to the next level; call buttons at every landing
          interacts.push({ test: (p) => L.inside(p), label: () => `Lift → ${L.names[(Math.max(0, L.atLevel()) + 1) % L.levels.length] || 'next floor'}`, fn: () => L.next() });
          levels.forEach((y0, i) => { const [bx, bz] = eg.W(dw / 2 + 0.5, d / 2 + 0.6); const btn = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.04, 16), M(0xfacc15, { emissive: 0xf59e0b, emissiveIntensity: 0.8 })); btn.rotation.x = Math.PI / 2; btn.position.set(dw / 2 + 0.45, y0 + 1.2, d / 2 + 0.23); eg.g.add(btn);
            interacts.push({ test: (p) => Math.hypot(p.x - bx, p.z - bz) < 1.6 && Math.abs(p.y - (oy + y0)) < 1.2 && !L.inside(p), label: () => 'Call the lift', fn: () => L.call(i) }); });
          return L;
        },
        door({ x, y = 0, z, w = 1.4, h = 2.4, ry: r = 0, kind = 'slide', auto = true, manual = false, label = 'Open', color = 0x8a5a33, t = 0.12, mesh, swing = 1, range = 2.6, onChange }) {
          const dg = f.frame(x, z, r, y), [wx, wz] = W(x, z);
          const leaf = mesh || new T.Mesh(new T.BoxGeometry(w, h, t), M(color)); leaf.castShadow = true; const pivot = new T.Group(); dg.g.add(pivot); pivot.add(leaf);
          if (kind === 'swing' || kind === 'shelf' || kind === 'vault') { pivot.position.x = -w / 2; leaf.position.set(w / 2, mesh ? 0 : h / 2, 0); } else leaf.position.set(0, mesh ? 0 : h / 2, 0);
          pivot.userData.dynamic = true; leaf.userData.dynamic = true;
          const col = dg.col(w, h, t + 0.1, 0, 0, 0);
          const D = { open: 0, want: 0, kind, auto, x: wx, z: wz, y: oy + y, col, pivot, leaf, w,
            update(dt, player) {
              if (D.holdUntil && performance.now() < D.holdUntil) D.want = 1;   // held open (the bus gates while the bus passes)
              else if (D.auto && player) { const w2 = Math.hypot(player.x - wx, player.z - wz) < range && Math.abs(player.y - D.y) < 2 ? 1 : 0; if (w2 !== D.want) { if (onChange) onChange(w2, D); if (typeof dispatchEvent === 'function' && player) dispatchEvent(new CustomEvent('zworld-door', { detail: { open: w2, x: wx, y: D.y, z: wz, kind } })); } D.want = w2; }
              D.open = clamp(D.open + Math.sign(D.want - D.open) * dt * (kind === 'vault' ? 0.5 : 1.8), 0, 1);
              if (kind === 'slide') leaf.position.x = D.open * w * 0.98; else if (kind === 'vault') { pivot.rotation.y = -D.open * 1.7; leaf.rotation.z = D.open * 3; } else pivot.rotation.y = -D.open * (kind === 'shelf' ? 1.35 : 1.5) * swing;
              col.on = D.open < 0.6;
            } };
          doors.push(D);
          if (!auto && !manual) interacts.push({ test: (p) => Math.hypot(p.x - wx, p.z - wz) < 2.2 && Math.abs(p.y - D.y) < 1.5, label: () => (D.want ? 'Close' : label), fn: () => { D.want = D.want ? 0 : 1; } });
          return D;
        },
        // a pair of doors in a doorway (the library's classroom door, recoloured + named); they open as you come near and close behind you
        doubleDoor({ x, y = 0, z, ry: r = 0, w = 2.4, h = 3, color = 0x7c3aed, label = '', key }) {
          const [wx, wz] = W(x, z), k = key || `${Math.round(wx * 2)},${Math.round(wz * 2)},${Math.round(oy + y)}`; if (doorKeys.has(k)) return null; doorKeys.add(k);
          const leaf = (i) => {
            let g;
            if (ZAssets.has('classroom_door')) {
              const src = ZAssets.build('classroom_door').group, hinge = src.userData.hinge; g = hinge.children[0]; hinge.remove(g); g.position.set(0, 0, 0);
              g.traverse((o) => { if (!o.isMesh) return; const m = o.material; if (m.map && o.geometry.type === 'PlaneGeometry') { o.material = new T.MeshStandardMaterial({ map: ZA.label(i === 0 && label ? label.toUpperCase() : 'ZUNGGA', { w: 512, h: 190, bg: '#fff7e6', fg: '#3b0764', size: 80, radius: 18 }) }); } else if (m.color && !m.transmission && m.metalness < 0.5) o.material = M(color, { roughness: 0.5 }); });
              g.scale.set((w / 2) / 1.0, h / 2.1, 1.4);
            } else { g = new T.Mesh(new T.BoxGeometry(w / 2, h, 0.08), M(color)); g.position.y = h / 2; }
            return g;
          };
          const L = frame(floor, ...W(x, z), ry + r, oy + y).door({ x: -w / 4, z: 0, w: w / 2, h, ry: 0, kind: 'swing', auto: true, mesh: leaf(0), swing: -1 });
          const off = [Math.cos(r) * w / 2, -Math.sin(r) * w / 2];   // the right leaf: hinge on the other jamb
          void off;
          const R = frame(floor, ...W(x, z), ry + r + Math.PI, oy + y).door({ x: -w / 4, z: 0, w: w / 2, h, ry: 0, kind: 'swing', auto: true, mesh: leaf(1), swing: 1 });
          API.lanes.push({ x: wx, z: wz, ry: ry + r, hw: w / 2 + 0.25, hd: 1.0, y: oy + y, h: h + 0.5 });   // the doorway itself, full height
          return [L, R];
        },
        interact({ x, y = 0, z, r = 1.6, label, fn }) { const [wx, wz] = W(x, z); interacts.push({ test: (p) => Math.hypot(p.x - wx, p.z - wz) < r && Math.abs(p.y - (oy + y)) < 1.6, label: () => label, fn }); },
        area({ id, num, name, x = 0, z = 0, w, d, y0 = -1, y1 = 6, shape = 'rect', color }) {
          const pts = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([a, b]) => W(x + a, z + b));
          const [cx, cz] = W(x, z); const A = { id, num, name, floor, x: cx, z: cz, w, d, ry, y0: oy + y0, y1: oy + y1, pts, color }; areas.push(A); return A;
        },
        anchor(id, label, pos, look) { const [px, pz] = W(pos[0], pos[2]), [lx, lz] = W(look[0], look[2]); anchors.push({ id, label, floor, pos: [px, oy + pos[1], pz], look: [lx, oy + look[1], lz] }); },
        // a roof (or ceiling) hidden while the player is inside the region (local rect)
        roof(obj, { x = 0, z = 0, w, d, y0 = -0.5, y1 = 8 }) { obj.userData.dynamic = true; const [cx, cz] = W(x, z); roofs.push({ obj, x: cx, z: cz, hx: w / 2, hz: d / 2, c: Math.cos(ry), s: Math.sin(ry), y0: oy + y0, y1: oy + y1 }); },
        tick(fn, obj) { if (obj) obj.userData.dynamic = true; ticks.push(fn); },
        ceiling(w, d, x, y, z, m, o = {}) { const me = f.box(w, o.t ?? 0.5, d, x, y, z, m, { cast: false, ...o }); me.userData.dynamic = true; ceilings.push(me); return me; },
      };
      return f;
    }

    // ---------- water look: flowing chocolate ----------
    const waterMats = [];
    function chocoWater(o = {}) {
      const t = ZA.tex((c, w, h) => { c.fillStyle = '#6b3a1f'; c.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { const x = Math.random() * w, y = Math.random() * h, r = 6 + Math.random() * 30; const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, Math.random() < 0.5 ? 'rgba(160,96,58,0.55)' : 'rgba(70,34,16,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); } c.strokeStyle = 'rgba(214,160,110,0.35)'; c.lineWidth = 3; for (let i = 0; i < 40; i++) { const y = Math.random() * h; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += 16) c.lineTo(x, y + Math.sin(x / 40 + i) * 6); c.stroke(); } }, 512, 512);
      t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(o.rep ?? 1, o.rep ?? 1);
      const m = new T.MeshStandardMaterial({ side: T.DoubleSide, map: t, color: o.color ?? 0xffffff, roughness: 0.28, metalness: 0.05, emissive: o.glow ?? 0x000000, emissiveIntensity: o.glow ? 0.35 : 0 });
      waterMats.push({ t, speed: o.flow ?? 0.6 }); return m;
    }
    function riverMesh(points, width, surf, o) {
      const curve = new T.CatmullRomCurve3(points.map(([x, z]) => new T.Vector3(x, surf, z)), false, 'centripetal');
      const segs = Math.max(20, Math.round(curve.getLength() * 1.5)), pos = [], uv = [], idx = []; let acc = 0, prev = null;
      for (let i = 0; i <= segs; i++) { const p = curve.getPointAt(i / segs), tg = curve.getTangentAt(i / segs), sx = -tg.z, sz = tg.x; if (prev) acc += p.distanceTo(prev); prev = p; pos.push(p.x + sx * width / 2, surf, p.z + sz * width / 2, p.x - sx * width / 2, surf, p.z - sz * width / 2); uv.push(0, acc / width, 1, acc / width); }
      for (let i = 0; i < segs; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      if (geo.attributes.normal.array[1] < 0) { const n = geo.attributes.normal.array; for (let i = 0; i < n.length; i++) n[i] = -n[i]; idx.reverse(); geo.setIndex(idx); }
      const me = new T.Mesh(geo, chocoWater(o)); me.receiveShadow = true; me.userData.dynamic = true; return me;
    }

    // ---------- queries for the walker ----------
    function terrainAt(x, z) { let best = -Infinity; for (const tr of terrains) if (x >= tr.x0 && x <= tr.x1 && z >= tr.z0 && z <= tr.z1) best = Math.max(best, tr.fn(x, z)); return best; }
    const API = {
      placed, seats, floors, cols, ceilings, areas, anchors, slides, elevators, doors, waters, interacts, ticks, roofs, frame, M,
      terrain(fn, x0, z0, x1, z1) { terrains.push({ fn, x0, z0, x1, z1 }); },
      // dressing (furniture) is marked, so walkways can be cleared of it later without touching walls, floors or doors
      lanes: [],
      dressRun(fn, ...frames) {
        const n0 = cols.length, kids = {}, fk = frames.filter(Boolean).map((f) => [f.g, f.g.children.length]);
        for (const k of Object.keys(floors)) kids[k] = floors[k].children.length;
        try { fn(); } catch (e) { console.error('dress', e); }
        for (let i = n0; i < cols.length; i++) cols[i].dress = true;
        const mark = (o) => { o.userData.dress = true; };
        for (const k of Object.keys(floors)) for (let i = kids[k]; i < floors[k].children.length; i++) mark(floors[k].children[i]);
        for (const [g, n] of fk) for (let i = n; i < g.children.length; i++) mark(g.children[i]);
      },
      // lane = { x, z, ry, hw, hd, y } (centre, rotation, half width, half depth, floor height)
      clearLanes(list = API.lanes) {
        let nc = 0, nm = 0;
        const inLane = (L, x, z, ex, ez, r) => { const c = Math.cos(L.ry), s2 = Math.sin(L.ry), dx = x - L.x, dz = z - L.z, lx = dx * c - dz * s2, lz = dx * s2 + dz * c, dr = r - L.ry, px = Math.abs(ex * Math.cos(dr)) + Math.abs(ez * Math.sin(dr)), pz = Math.abs(ex * Math.sin(dr)) + Math.abs(ez * Math.cos(dr)); return Math.abs(lx) < L.hw + px && Math.abs(lz) < L.hd + pz; };
        for (const L of list) for (const c of cols) { if (!c.dress || !c.on) continue; if (c.y1 < L.y + 0.3 || c.y0 > L.y + (L.h || 1.7)) continue; if (inLane(L, c.x, c.z, c.hx, c.hz, c.ry)) { c.on = false; nc++; } }
        const box = new T.Box3(), ctr = new T.Vector3(), sz = new T.Vector3();
        const units = []; for (const k of Object.keys(floors)) floors[k].traverse((o) => { if (!o.userData.dress) return; o.traverse((m) => { if (m === o && !o.isMesh && !o.userData.propId) return; if (m.userData.propId || (m.isMesh && !(m.parent && m.parent.userData && m.parent.userData.propId))) units.push(m); }); });
        for (const u of new Set(units)) { if (!u.visible) continue; u.updateWorldMatrix(true, true); box.setFromObject(u); if (box.isEmpty()) continue; box.getCenter(ctr); box.getSize(sz);
          for (const L of list) { if (box.max.y < L.y + 0.18 || box.min.y > L.y + (L.h || 1.7)) continue; if (inLane(L, ctr.x, ctr.z, sz.x / 2, sz.z / 2, 0)) { u.visible = false; if (u.userData.col) u.userData.col.on = false; nm++; break; } } }
        return { colliders: nc, meshes: nm };
      },
      terrainAt,
      // highest walkable surface under (x, z) that is not above feet + step
      support(x, z, feet, step) {
        let best = -Infinity, tag = null; const tr = terrainAt(x, z); if (tr <= feet + step) best = tr;
        for (const c of near(x, z, x, z)) { const [lx, lz] = toLocal(c, x, z); if (Math.abs(lx) > c.hx + 0.04 || Math.abs(lz) > c.hz + 0.04) continue; const top = topAt(c, lz); if (top <= feet + step && top > best) { best = top; tag = c.tag; } }
        return { y: best, tag };
      },
      // the lowest solid bottom above the head (ceilings), for jumps
      ceiling(x, z, feet, head) { let best = Infinity; for (const c of near(x, z, x, z)) { if (c.kind === 'ramp') continue; const [lx, lz] = toLocal(c, x, z); if (Math.abs(lx) > c.hx || Math.abs(lz) > c.hz) continue; if (c.y0 >= feet + 0.3 && c.y0 < best) best = c.y0; } return best; },
      // push a circle (radius r) out of everything that is too tall to step onto
      push(p, r, feet, height, step) {
        let hit = false;
        for (let it = 0; it < 3; it++) {
          let moved = false;
          for (const c of near(p.x - r, p.z - r, p.x + r, p.z + r)) {
            if (c.y0 >= feet + height - 0.05 || c.y1 <= feet + step) continue;
            if (c.y0 > feet + step && c.y0 >= feet + height - 0.18) continue;   // a little head room tolerance under slabs/beams
            const [lx, lz] = toLocal(c, p.x, p.z), qx = clamp(lx, -c.hx, c.hx), qz = clamp(lz, -c.hz, c.hz);
            if (c.kind === 'ramp' && topAt(c, qz) <= feet + step) continue;
            if (c.y0 > feet + step + 0.2 && (Math.abs(lx) > c.hx || Math.abs(lz) > c.hz)) continue;   // overhead things only stop the head when you are under them (stairs below landings)
            let dx = lx - qx, dz = lz - qz, d2 = dx * dx + dz * dz;
            if (d2 >= r * r) continue;
            let nx, nz, pen;
            if (d2 > 1e-9) { const d = Math.sqrt(d2); nx = dx / d; nz = dz / d; pen = r - d; }
            else { const ox = c.hx - Math.abs(lx), oz = c.hz - Math.abs(lz); if (ox < oz) { nx = Math.sign(lx) || 1; nz = 0; pen = ox + r; } else { nx = 0; nz = Math.sign(lz) || 1; pen = oz + r; } }
            // local → world normal
            const wx = nx * c.c + nz * c.s, wz = -nx * c.s + nz * c.c;
            p.x += wx * pen; p.z += wz * pen; moved = hit = true;
          }
          if (!moved) break;
        }
        return hit;
      },
      // first hit along a ray (for the camera); ignores thin rails (nocam)
      ray(o, dir, maxD) {
        let best = maxD; const e = o.clone().addScaledVector(dir, maxD);
        for (const c of near(Math.min(o.x, e.x), Math.min(o.z, e.z), Math.max(o.x, e.x), Math.max(o.z, e.z))) {
          if (c.nocam || c.tag === 'lift') continue;
          const [lx, lz] = toLocal(c, o.x, o.z), dlx = dir.x * c.c - dir.z * c.s, dlz = dir.x * c.s + dir.z * c.c;
          let t0 = 0, t1 = best; const top = c.kind === 'ramp' ? Math.max(c.ra, c.rb) : c.y1;
          for (const [p0, d0, lo, hi] of [[lx, dlx, -c.hx, c.hx], [o.y, dir.y, c.y0, top], [lz, dlz, -c.hz, c.hz]]) {
            if (Math.abs(d0) < 1e-9) { if (p0 < lo || p0 > hi) { t0 = Infinity; break; } continue; }
            let a = (lo - p0) / d0, b = (hi - p0) / d0; if (a > b) [a, b] = [b, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) break;
          }
          if (t0 <= t1 && t0 < best && t0 > 0.05) best = t0;
        }
        for (let t = 0.5; t < best; t += 0.5) { const q = o.clone().addScaledVector(dir, t); if (terrainAt(q.x, q.z) > q.y - 0.2 && o.y > terrainAt(o.x, o.z)) { best = Math.max(0.3, t - 0.5); break; } }
        return best;
      },
      waterAt(x, z, y) {   // y: only water whose body reaches down to y counts (so rooms under the river stay dry)
        let surf = -Infinity, flow = null;
        for (const w of waters) {
          if (y != null && y < w.surf - w.deep) continue;
          if (w.kind === 'seg') { const vx = w.bx - w.ax, vz = w.bz - w.az, L2 = vx * vx + vz * vz, t = clamp(((x - w.ax) * vx + (z - w.az) * vz) / L2, 0, 1), dx = x - (w.ax + vx * t), dz = z - (w.az + vz * t); if (dx * dx + dz * dz < w.hw * w.hw && w.surf > surf) { surf = w.surf; const L = Math.sqrt(L2); flow = [vx / L * w.flow, vz / L * w.flow]; } }
          else { const dx = x - w.x, dz = z - w.z, lx = dx * w.c - dz * w.s, lz = dx * w.s + dz * w.c; const inside = w.round ? lx * lx + lz * lz < w.hx * w.hx : Math.abs(lx) < w.hx && Math.abs(lz) < w.hz; if (inside && w.surf > surf) { surf = w.surf; flow = null; } }
        }
        return surf > -Infinity ? { surf, flow } : null;
      },
      areaAt(p) { let best = null; for (const a of areas) { if (p.y < a.y0 || p.y > a.y1) continue; const dx = p.x - a.x, dz = p.z - a.z, c = Math.cos(a.ry), s = Math.sin(a.ry), lx = dx * c - dz * s, lz = dx * s + dz * c; if (Math.abs(lx) <= a.w / 2 && Math.abs(lz) <= a.d / 2 && (!best || a.w * a.d < best.w * best.d)) best = a; } return best; },
      // draw small details (and run animated props) only within `range` of the camera — like the island game
      cull(cam, range = 55) {
        const v = new T.Vector3(), r2 = range * range;
        if (!API._cullInit) { API._cullInit = true; for (const o of details) { o.userData.cullPos = o.userData.dressChunk ? o.geometry.boundingSphere.center.clone().applyMatrix4(o.matrixWorld) : o.getWorldPosition(new T.Vector3()); o.userData.cullOn = o.visible; } }
        for (const o of details) { if (!o.userData.cullOn) continue; const p = o.userData.cullPos, R = (o.userData.cullR || 0); const dx = p.x - cam.x, dz = p.z - cam.z, dy = Math.abs(p.y - cam.y);
          const sameFloor = dy < (o.userData.dressChunk ? 7 + R * 0.2 : 9) || cam.y > 30; o.visible = sameFloor && Math.sqrt(dx * dx + dz * dz) - R < (o.userData.dressChunk ? Math.min(range, 32) : range); }
        void v;
      },
      update(t, dt, player) {
        for (const L of elevators) L.update(dt);
        for (const D of doors) D.update(dt, player);
        for (const m of waterMats) m.t.offset.y -= dt * m.speed * 0.25;
        for (const f of ticks) f(t, dt);
        if (player) for (const r of roofs) { const dx = player.x - r.x, dz = player.z - r.z, lx = dx * r.c - dz * r.s, lz = dx * r.s + dz * r.c; r.obj.visible = !(Math.abs(lx) < r.hx && Math.abs(lz) < r.hz && player.y > r.y0 && player.y < r.y1); }
      },
      // merge static meshes by material, per 40 m chunk → far fewer draw calls (doors, lifts, water and anything with a tick stay separate)
      bake(root) {
        root.updateMatrixWorld(true);
        const buckets = new Map(), kill = [];
        const key = (m) => [m.type, m.color && m.color.getHex(), m.roughness, m.metalness, m.emissive && m.emissive.getHex(), m.emissiveIntensity, m.map && m.map.uuid, m.transparent, m.opacity, m.side, m.vertexColors, m.flatShading].join('|');
        root.traverse((o) => {
          if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || o.material.isShaderMaterial) return;
          for (let p = o; p; p = p.parent) if (p.userData && (p.userData.dynamic || p.userData.noBake)) return;
          if (!o.visible) return;
          const g = o.geometry; if (!g.attributes.position || !g.attributes.normal) return;
          const c = new T.Vector3(); if (!g.boundingSphere) g.computeBoundingSphere(); c.copy(g.boundingSphere.center).applyMatrix4(o.matrixWorld);
          let isDress = false; for (let p = o; p; p = p.parent) if (p.userData && p.userData.dress) { isDress = true; break; }
          const ch = isDress ? 24 : 40, k = key(o.material) + '#' + Math.floor(c.x / ch) + ',' + Math.floor(c.z / ch) + ',' + Math.floor(c.y / 12) + (o.castShadow ? 's' : '') + (isDress ? 'D' : '');
          if (!buckets.has(k)) buckets.set(k, { mat: o.material, list: [], cast: o.castShadow, parent: root, dress: isDress });
          buckets.get(k).list.push(o); kill.push(o);
        });
        let n = 0;
        for (const b of buckets.values()) {
          if (b.list.length < 2) { kill.splice(kill.indexOf(b.list[0]), 1); continue; }
          const pos = [], nor = [], uv = [], hasUV = b.list.every((o) => o.geometry.attributes.uv), col = b.mat.vertexColors ? [] : null;
          const nm = new T.Matrix3();
          for (const o of b.list) {
            const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, C = g.attributes.color;
            nm.getNormalMatrix(o.matrixWorld); const v = new T.Vector3();
            for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); pos.push(v.x, v.y, v.z); v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z); if (hasUV) uv.push(U.getX(i), U.getY(i)); if (col) { if (C) col.push(C.getX(i), C.getY(i), C.getZ(i)); else col.push(1, 1, 1); } }
          }
          const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); if (hasUV) geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); if (col) geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
          geo.computeBoundingSphere(); geo.computeBoundingBox();
          const me = new T.Mesh(geo, b.mat); me.castShadow = b.cast; me.receiveShadow = true; me.matrixAutoUpdate = false; b.parent.add(me); n++;
          if (b.dress) { me.userData.dressChunk = true; me.userData.cullR = geo.boundingSphere.radius; details.push(me); }   // furniture: drawn near the camera, on its own floor
        }
        for (const o of kill) o.parent && o.parent.remove(o);
        // small things that could not be merged (signs, labels…) are only drawn near the camera
        const sp = new T.Sphere();
        root.traverse((o) => { if (!o.isMesh || !o.matrixAutoUpdate || o.isInstancedMesh) return; for (let p = o; p; p = p.parent) if (p.userData && (p.userData.dynamic || p.userData.noBake)) return; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); sp.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld); if (sp.radius < 3) details.push(o); });
        return { merged: kill.length, meshes: n };
      },
    };
    return API;
  }
  window.ZWorld = { create };
})();
