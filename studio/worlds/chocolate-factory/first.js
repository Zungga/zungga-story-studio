/* Zungga Chocolate Factory — FIRST FLOOR (operations deck, y = 13): the deck on its columns, 11 rooms joined by
 * cookie-path corridors, the glass Visitor Observation Balcony right above the Main Plaza, the hidden bookshelf room
 * in the Recipe Library, and the two towers (stairs wrapped round a working lift) that join it to the ground floor.
 * Room furniture comes from ZFactory.dress[<room id>] (dress-first.js). */
(() => {
  'use strict';
  const TH = 5.3;   // tower half-size (the towers hold a 30-person lift)
  const T = THREE;
  function subtract(rects, h) {   // rects/h: [x0, z0, x1, z1]
    const out = [];
    for (const r of rects) {
      if (h[0] >= r[2] || h[2] <= r[0] || h[1] >= r[3] || h[3] <= r[1]) { out.push(r); continue; }
      if (h[1] > r[1]) out.push([r[0], r[1], r[2], h[1]]);
      if (h[3] < r[3]) out.push([r[0], h[3], r[2], r[3]]);
      const z0 = Math.max(r[1], h[1]), z1 = Math.min(r[3], h[3]);
      if (h[0] > r[0]) out.push([r[0], z0, h[0], z1]);
      if (h[2] < r[2]) out.push([h[2], z0, r[2], z1]);
    }
    return out;
  }
  const FLOORS = { recipe_library: 0x9a6b45, executive_office: 0x7c4a8c, control_room_f1: 0x334155, innovation_lab: 0x6d5bd0, quality_lab: 0xe9d8c4, meeting_hall: 0x8b5a3c, security_center: 0x1f2a44, hall_of_fame: 0xa0703f, training_room: 0xb98a5a, first_aid: 0xcfe8d5, archive_room: 0x8a6a4a };
  const WALLS = { recipe_library: 0xe9d3b0, executive_office: 0xe9d5ff, control_room_f1: 0x94a3b8, innovation_lab: 0xddd6fe, quality_lab: 0xfdf2e9, meeting_hall: 0xf3d9b8, security_center: 0x9fb0c8, hall_of_fame: 0xf5deb3, training_room: 0xf3e6d0, first_aid: 0xe7f6ea, archive_room: 0xe7d7bd };

  function build(W) {
    const L = ZFactory.layout, F = L.first, Y = F.y, c = W.frame('first', 0, 0, 0, Y), M = W.M, G = L.ground;
    const deckM = new T.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.85 });
    // ---------- the deck slab (holes: glass balcony, the two towers, the hidden shaft room) ----------
    const O = F.outline, gl = F.balcony.glass, hid = F.hidden;
    let slabs = [[O.x0, O.z0, O.x1, O.z1]];
    slabs = subtract(slabs, [gl.x0, gl.z0, gl.x1, gl.z1]);
    for (const t of G.towers) slabs = subtract(slabs, [t.x - TH, t.z - TH, t.x + TH, t.z + TH]);
    slabs = subtract(slabs, [hid.x0, hid.z0, hid.x1, hid.z1]);
    for (const [x0, z0, x1, z1] of slabs) { const me = c.box(x1 - x0, 0.6, z1 - z0, (x0 + x1) / 2, -0.6, (z0 + z1) / 2, deckM, { cast: false }); me.castShadow = false; }
    // the deck's rim + underside lights
    c.box(O.x1 - O.x0 + 0.4, 0.5, 0.4, 0, -0.75, O.z1 + 0.1, 0x5b2a86, { col: false, cast: false }); c.box(O.x1 - O.x0 + 0.4, 0.5, 0.4, 0, -0.75, O.z0 - 0.1, 0x5b2a86, { col: false, cast: false });
    for (let x = O.x0 + 6; x <= O.x1 - 6; x += 12) for (let z = O.z0 + 6; z <= O.z1 - 2; z += 12) { if (x > gl.x0 && x < gl.x1 && z > gl.z0 && z < gl.z1) continue; const lm = new T.Mesh(new T.CylinderGeometry(0.35, 0.35, 0.08, 14), M(0xfff6dd, { emissive: 0xffe2a8, emissiveIntensity: 1.4 })); lm.position.set(x, -0.64, z); c.g.add(lm); }
    // the glass floor of the balcony: walkable, see-through, framed
    {
      const glass = new T.Mesh(new T.BoxGeometry(gl.x1 - gl.x0, 0.12, gl.z1 - gl.z0), new T.MeshStandardMaterial({ color: 0xcdeeff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false }));
      glass.position.set((gl.x0 + gl.x1) / 2, -0.06, (gl.z0 + gl.z1) / 2); glass.userData.noBake = true; c.g.add(glass); c.col(gl.x1 - gl.x0, 0.12, gl.z1 - gl.z0, (gl.x0 + gl.x1) / 2, -0.12, (gl.z0 + gl.z1) / 2, { nocam: true });
      const fr = M(0xd4a017, { metalness: 0.5, roughness: 0.35 });
      for (let x = gl.x0; x <= gl.x1 + 0.01; x += 4.333) c.box(0.12, 0.06, gl.z1 - gl.z0, x, 0, (gl.z0 + gl.z1) / 2, fr, { col: false, cast: false });
      for (let z = gl.z0; z <= gl.z1 + 0.01; z += 3.75) c.box(gl.x1 - gl.x0, 0.06, 0.12, (gl.x0 + gl.x1) / 2, 0, z, fr, { col: false, cast: false });
      // purple railing around the glass so it reads as "the balcony" (gaps to walk onto the glass)
      for (const z of [gl.z0, gl.z1]) for (const [a, b] of [[gl.x0, -3], [3, gl.x1]]) { const me = new T.Mesh(new T.BoxGeometry(b - a, 0.08, 0.08), M(0x7c3aed)); me.position.set((a + b) / 2, 1.0, z); c.g.add(me); for (let x = a; x <= b; x += 2) c.box(0.06, 1.0, 0.06, x, 0, z, 0x7c3aed, { col: false, cast: false }); }
    }
    // cookie-path floors (corridors + balcony walkway)
    const st = ZA.tex((g, w, h) => { g.fillStyle = '#d9a86c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) { g.fillStyle = (i + k) % 2 ? '#e8bd7e' : '#dcae70'; g.beginPath(); g.roundRect(i * 64 + 4, k * 64 + 4, 56, 56, 10); g.fill(); } }, 256, 256); st.wrapS = st.wrapT = T.RepeatWrapping;
    const pathRect = (x0, z0, x1, z1) => { const t = st.clone(); t.needsUpdate = true; t.repeat.set((x1 - x0) / 3, (z1 - z0) / 3); const me = new T.Mesh(new T.PlaneGeometry(x1 - x0, z1 - z0), new T.MeshStandardMaterial({ map: t, roughness: 0.85 })); me.rotation.x = -Math.PI / 2; me.position.set((x0 + x1) / 2, 0.012, (z0 + z1) / 2); me.receiveShadow = true; c.g.add(me); };
    for (const k of F.corridors) pathRect(k.x0, k.z0, k.x1, k.z1);
    const B = F.balcony; pathRect(B.x0, B.z0, B.x1, gl.z0); pathRect(B.x0, gl.z1, B.x1, B.z1); pathRect(B.x0, gl.z0, gl.x0, gl.z1); pathRect(gl.x1, gl.z0, B.x1, gl.z1);

    // ---------- rooms ----------
    const H = F.wallH, DW = 2.2, DH = 3;
    for (const r of F.rooms) {
      const w = r.x1 - r.x0, d = r.z1 - r.z0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, f = c.frame(cx, cz);
      const doors = { n: [], s: [], e: [], w: [] }; for (const [side, at] of r.doors) doors[side].push({ at, w: DW, h: DH });
      // the library's east wall is shared with the office; its west part holds the hidden room (built below)
      const outer = (side) => (side === 'n' && r.z0 <= -53.9) || (side === 'w' && r.x0 <= -36.9) || (side === 'e' && r.x1 >= 36.9) || (side === 's' && r.z1 >= 5.9);
      const win = (side, L2) => outer(side) ? Array.from({ length: Math.floor(L2 / 4.5) }, (_, i) => ({ at: -L2 / 2 + (i + 0.5) * L2 / Math.floor(L2 / 4.5), w: 1.6, h: 1.6, y: 2.1, glow: 0xdff3ff })) : [];
      f.room({ w: w - 0.26, d: d - 0.26, h: H, y: 0, floor: false, wallMat: M(WALLS[r.id] || 0xf1e3cf, { roughness: 0.9 }), doors, windows: { n: win('n', w), s: win('s', w), e: win('e', d), w: win('w', d) } });
      const fl = new T.Mesh(new T.PlaneGeometry(w - 0.25, d - 0.25), M(FLOORS[r.id] || 0xd9b58c, { roughness: 0.75 })); fl.rotation.x = -Math.PI / 2; fl.position.y = 0.015; fl.receiveShadow = true; f.g.add(fl);
      // door frames + room sign over the main door
      for (const [side, at] of r.doors) {
        const [px, pz, ry] = side === 'n' ? [at, -d / 2, 0] : side === 's' ? [at, d / 2, 0] : side === 'e' ? [w / 2, at, Math.PI / 2] : [-w / 2, at, Math.PI / 2];
        const df = f.frame(px, pz, ry); for (const sx of [-1, 1]) df.box(0.22, DH + 0.2, 0.4, sx * (DW / 2 + 0.11), 0, 0, 0x5b2a86, { col: false }); df.box(DW + 0.66, 0.3, 0.4, 0, DH, 0, 0x5b2a86, { col: false });
        df.doubleDoor({ x: 0, z: 0, w: DW, h: DH, color: (WALLS[r.id] && new T.Color(WALLS[r.id]).multiplyScalar(0.7).getHex()) || 0x7c3aed, label: r.name });
      }
      const main = r.doors[0], [sx2, sz2, sr] = main[0] === 'n' ? [main[1], -d / 2 - 0.15, Math.PI] : main[0] === 's' ? [main[1], d / 2 + 0.15, 0] : main[0] === 'e' ? [w / 2 + 0.15, main[1], Math.PI / 2] : [-w / 2 - 0.15, main[1], -Math.PI / 2];
      const sg = new T.Mesh(new T.PlaneGeometry(Math.min(w - 2, 6.5), 0.75), new T.MeshStandardMaterial({ map: ZA.label(`${r.num} · ${r.name.toUpperCase()}`, { w: 1024, h: 120, bg: '#3b0764', fg: '#ffd84a', size: 70, radius: 24 }), roughness: 0.6 })); sg.position.set(sx2, DH + 0.75, sz2); sg.rotation.y = sr; f.g.add(sg);
      f.ceiling(w, d, 0, H, 0, M(0xf6eee2, { roughness: 0.95 }), { t: 0.3 });   // sealed (the ceiling lets the sun through: no shadow)
      for (let lx = -w / 2 + 3; lx <= w / 2 - 3; lx += 6) for (let lz = -d / 2 + 3; lz <= d / 2 - 3; lz += 6) { const lp = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 0.06, 16), M(0xfff6dd, { emissive: 0xfff1c9, emissiveIntensity: 1.2 })); lp.position.set(lx, H - 0.04, lz); f.g.add(lp); }
      c.area({ id: r.id, num: r.num, name: r.name, x: cx, z: cz, w, d, y0: -0.5, y1: H + 2 });
      const spec = { id: r.id, name: r.name, w, d, h: H, y: 0, doors: r.doors.map(([side, at]) => ({ side, at, w: DW })), floor: 'first' };
      if (r.id === 'recipe_library') spec.hidden = { x0: hid.x0 - cx, x1: hid.x1 - cx, z0: hid.z0 - cz, z1: hid.z1 - cz, shelf: { x: hid.shelf.x - cx, z: hid.shelf.z - cz } };
      if (ZFactory.dress[r.id]) W.dressRun(() => ZFactory.dress[r.id](f.frame(0, 0, 0, 0.015), spec));
      for (const [side, at] of r.doors) {   // each door → the middle of the room (and 3 m outside it) stays walkable
        const ns = side === 'n' || side === 's', half = ns ? d / 2 : w / 2, sgn = side === 's' || side === 'e' ? 1 : -1, len = half + 3;
        W.lanes.push(ns ? { x: cx + at, z: cz + sgn * (half + 3 - len / 2), ry: 0, hw: 1.3, hd: len / 2, y: F.y } : { x: cx + sgn * (half + 3 - len / 2), z: cz + at, ry: Math.PI / 2, hw: 1.3, hd: len / 2, y: F.y });
      }
    }
    if (ZFactory.dress.observation_balcony) { const bz = (F.balcony.z0 + F.balcony.z1) / 2; try { W.dressRun(() => ZFactory.dress.observation_balcony(c.frame(0, bz), { id: 'observation_balcony', w: F.balcony.x1 - F.balcony.x0, d: F.balcony.z1 - F.balcony.z0, glass: { x0: gl.x0, x1: gl.x1, z0: gl.z0 - bz, z1: gl.z1 - bz }, doorsNorth: F.rooms.filter((r) => Math.abs(r.z1 - F.balcony.z0) < 0.1).map((r) => (r.x0 + r.x1) / 2), doorsSouth: F.rooms.filter((r) => Math.abs(r.z0 - F.balcony.z1) < 0.1).map((r) => (r.x0 + r.x1) / 2), towersX: G.towers.map((t) => t.x + (t.x < 0 ? 3.5 : -3.5)), floor: 'first' })); } catch (e) { console.error('dress balcony', e); } }
    // the outer walls of the balcony band (west/east of the towers are the towers themselves) + corridor ends
    c.area({ id: B.id, num: B.num, name: B.name, x: 0, z: (B.z0 + B.z1) / 2, w: B.x1 - B.x0, d: B.z1 - B.z0, y0: -0.5, y1: 6 });
    for (const k of F.corridors) c.ceiling(k.x1 - k.x0, k.z1 - k.z0, (k.x0 + k.x1) / 2, H, (k.z0 + k.z1) / 2, M(0xf6eee2), { t: 0.3 });
    { c.ceiling(B.x1 - B.x0, B.z1 - B.z0, 0, H, (B.z0 + B.z1) / 2, M(0xf6eee2), { t: 0.3 });   // the balcony: a glass skylight in the middle of its ceiling
      const sky = new T.Mesh(new T.PlaneGeometry(gl.x1 - gl.x0, gl.z1 - gl.z0), new T.MeshStandardMaterial({ color: 0xcdeeff, emissive: 0x9fd8ff, emissiveIntensity: 0.35, transparent: true, opacity: 0.85 })); sky.rotation.x = Math.PI / 2; sky.position.set((gl.x0 + gl.x1) / 2, H - 0.16, (gl.z0 + gl.z1) / 2); c.g.add(sky); }
    for (const k of F.corridors) c.area({ id: k.id, num: 0, name: k.name, x: (k.x0 + k.x1) / 2, z: (k.z0 + k.z1) / 2, w: k.x1 - k.x0, d: k.z1 - k.z0, y0: -0.5, y1: 6 });
    // low parapet walls where the deck edge is open (corridor ends, balcony ends beside the towers)
    const parapet = (x1, z1, x2, z2) => c.wall(x1, z1, x2, z2, { h: H, t: 0.3, mat: M(0xe9d3b0), windows: [{ at: Math.hypot(x2 - x1, z2 - z1) / 2, w: Math.min(2.4, Math.hypot(x2 - x1, z2 - z1) - 0.6), h: 1.6, y: 2.2, glow: 0xdff3ff }] });
    const nc = F.corridors.find((k) => k.id === 'north_corridor'), scr = F.corridors.find((k) => k.id === 'south_corridor');
    for (const sx of [-1, 1]) { const x = sx * (O.x1 - 0.3); parapet(x, nc.z0, x, nc.z1); }                  // north corridor ends
    const tw0 = G.towers[0]; for (const sx of [-1, 1]) { const x = sx * (O.x1 - 0.3); parapet(x, B.z0, x, tw0.z - TH); parapet(x, tw0.z + TH, x, B.z1); }   // balcony band beside the towers
    parapet(scr.x0, O.z1 - 0.1, scr.x1, O.z1 - 0.1);                                                          // south corridor end

    // ---------- hidden room behind the bookshelf (library's north-west corner) ----------
    W.keepOut = (W.keepOut || []).concat({ x0: hid.x0 - 0.5, x1: hid.x1 + 0.5, z0: hid.z0 - 0.5, z1: hid.z1 + 0.5, y: Y }, { x0: hid.x1, x1: hid.x1 + 4, z0: hid.shelf.z - 2, z1: hid.shelf.z + 2, y: Y });
    {
      const hx = (hid.x0 + hid.x1) / 2, hz = (hid.z0 + hid.z1) / 2, f = c.frame(0, 0);
      const wallM = M(WALLS.recipe_library, { roughness: 0.9 });
      // east wall (x = shelf.x) with the shelf-door gap, south wall solid
      f.wall(hid.x1, hid.z0, hid.x1, hid.z1, { h: H, t: 0.25, mat: wallM, doors: [{ at: hid.shelf.z - hid.z0, w: 1.5, h: 2.6 }] });
      f.wall(hid.x0, hid.z1, hid.x1, hid.z1, { h: H, t: 0.25, mat: wallM });
      // the secret bookshelf door (swings into the hidden room when you pull the red book)
      const shelf = new T.Group();
      { const fr = new T.Mesh(new T.BoxGeometry(1.5, 2.6, 0.35), M(0x6b3f22)); fr.position.y = 1.3; shelf.add(fr);
        const cols = [0x991b1b, 0x1d4ed8, 0x15803d, 0xa16207, 0x6d28d9, 0x0f766e, 0xb45309];
        for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) { const bk = new T.Mesh(new T.BoxGeometry(0.12, 0.42 + ((i * 7 + row) % 3) * 0.06, 0.26), M(row === 2 && i === 4 ? 0xdc2626 : cols[(i + row * 3) % cols.length], row === 2 && i === 4 ? { emissive: 0x7f1d1d, emissiveIntensity: 0.5 } : {})); bk.position.set(-0.6 + i * 0.15, 0.32 + row * 0.6 + 0.21, 0.05); shelf.add(bk); }
        for (let row = 0; row <= 4; row++) { const sh = new T.Mesh(new T.BoxGeometry(1.45, 0.05, 0.3), M(0x8a5a33)); sh.position.set(0, 0.1 + row * 0.6, 0.02); shelf.add(sh); } }
      const D = c.door({ x: hid.x1 + 0.12, y: 0, z: hid.shelf.z, w: 1.5, h: 2.6, ry: Math.PI / 2, kind: 'shelf', auto: false, label: 'Pull the old red book', mesh: shelf });
      { const red = shelf.children.find((m) => m.material && m.material.color && m.material.color.getHex() === 0xdc2626); if (red) { red.material = red.material.clone(); c.tick((t) => { red.material.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.5; }, red); }
        const spk = new T.Group(); spk.position.set(hid.x1 + 0.45, 1.6, hid.shelf.z); c.g.add(spk); const sm = new T.MeshBasicMaterial({ color: 0xffd84a }); const sps = Array.from({ length: 6 }, () => { const m = new T.Mesh(new T.OctahedronGeometry(0.04), sm); spk.add(m); return m; });
        c.tick((t) => sps.forEach((m, i) => { const a = t * 1.4 + i; m.position.set(Math.sin(a * 1.3) * 0.25, Math.sin(a) * 0.5, Math.cos(a) * 0.5); m.rotation.y = t * 3; }), spk);
        const note = new T.Mesh(new T.PlaneGeometry(1.2, 0.8), new T.MeshStandardMaterial({ map: ZA.label('“The red book opens the way…”', { w: 512, h: 340, bg: '#f5e6c8', fg: '#5b3420', size: 40, radius: 20 }) })); note.position.set(hid.x1 + 0.16, 2.0, hid.shelf.z + 2.4); note.rotation.y = Math.PI / 2; c.g.add(note); }
      void D;
      // floor of the hidden room around the shaft opening (the spiral's landing is built with the shaft)
      const S = G.shaft;
      ZFactory.holed(c.frame(hx, hz), hid.x1 - hid.x0, hid.z1 - hid.z0, { x: S.x - hx, z: S.z - hz, r: S.r + 0.05 }, (ww, dd, x, z) => c.frame(hx, hz).box(ww, 0.6, dd, x, -0.6, z, 0x5b4636, { cast: false }));
      const bridge = c.box(0.9, 0.6, 1.6, hid.x1 - 0.55, -0.6, hid.shelf.z, 0x5b4636, { cast: false }); void bridge;
      // dusty little lamp + cobwebs feel
      const lamp = new T.Mesh(new T.SphereGeometry(0.16, 12, 10), M(0xffd27a, { emissive: 0xffb347, emissiveIntensity: 1.4 })); lamp.position.set(hid.x0 + 0.5, 2.6, hid.z0 + 0.5); c.g.add(lamp);
      c.frame((hid.x0 + hid.x1) / 2, (hid.z0 + hid.z1) / 2).ceiling(hid.x1 - hid.x0, hid.z1 - hid.z0, 0, H, 0, M(0x5b4636), { t: 0.3 });
      c.area({ id: hid.id, num: hid.num, name: hid.name, x: hx, z: hz, w: hid.x1 - hid.x0, d: hid.z1 - hid.z0, y0: -2, y1: 6 });
      if (ZFactory.dress.hidden_access) { try { W.dressRun(() => ZFactory.dress.hidden_access(c.frame(hx, hz), { id: hid.id, w: hid.x1 - hid.x0, d: hid.z1 - hid.z0, shaft: { x: S.x - hx, z: S.z - hz, r: S.r + 0.1 }, shelf: { x: hid.x1 - hx, z: hid.shelf.z - hz }, floor: 'first' })); } catch (e) { console.error('dress hidden', e); } }
    }

    // ---------- deck columns down to the ground ----------
    { const g = W.frame('ground'), cols = [];   // columns stand where the ground below is free (never in the river, on a road, a bridge or a building)
      for (const [x, z] of G.deckColumns || cols) { g.cyl(0.65, 0.8, Y - 0.6, x, 0, z, 0xb7793f, { seg: 18 }); g.cyl(1.1, 0.9, 0.6, x, Y - 1.2, z, 0x5b2a86, { col: false }); g.cyl(1.0, 1.0, 0.4, x, 0, z, 0x5b2a86, { col: false }); } }

    // ---------- the two towers: square stairs wound round a lift, door on the balcony side at both levels ----------
    for (const tw of G.towers) tower(W, tw, Y);

    for (const a of F.anchors) c.anchor(a[0], a[1], [a[2][0], a[2][1] - Y, a[2][2]], [a[3][0], a[3][1] - Y, a[3][2]]);
  }

  // tower local frame: door side = local +x. 2·TH square outside, walls 0.5, a big lift (5.6 × 5.6 m, ~30 people) in the middle,
  // 4 long flights of 18 steps round the lift shaft: W → S → E → N (so the top arrives on the north side, away from the doors).
  function tower(W, tw, Y) {
    const ry = tw.door === 'e' ? 0 : Math.PI, gf = W.frame('ground', tw.x, tw.z, ry), M = W.M;
    const half = TH, t = 0.5, inner = half - t, sh = 3.0, top = Y + 4.6, DW = 2.6, stoneM = new T.MeshStandardMaterial({ color: 0xc08a5a, roughness: 0.9 });
    // walls: three solid sides + the door side with a wide door at the ground and one at the first floor
    gf.wall(-half + t / 2, -half + t / 2, half - t / 2, -half + t / 2, { h: top, t, mat: stoneM });
    gf.wall(-half + t / 2, half - t / 2, half - t / 2, half - t / 2, { h: top, t, mat: stoneM });
    gf.wall(-half + t / 2, -half + t / 2, -half + t / 2, half - t / 2, { h: top, t, mat: stoneM });
    gf.wall(half - t / 2, -half + t / 2, half - t / 2, half - t / 2, { h: Y, t, mat: stoneM, doors: [{ at: half - t / 2, w: DW, h: 3.0 }] });           // ground door (in front of the lift)
    gf.wall(half - t / 2, -half + t / 2, half - t / 2, half - t / 2, { h: top - Y, y: Y, t, mat: stoneM, doors: [{ at: half - t / 2, w: DW, h: 3.0 }] });
    for (const yy of [0, Y]) gf.frame(half - t / 2, 0, Math.PI / 2, yy).doubleDoor({ x: 0, z: 0, w: DW, h: 3.0, color: 0x6d28d9, label: 'Lift' });
    // ground floor of the tower
    gf.box(2 * inner, 0.1, 2 * inner, 0, 0, 0, 0xd6b38a, { cast: false });
    // flights: one full turn round the shaft
    const NP = 18, NF = 4, run = 2 * sh / NP, rise = Y / (NP * NF), mid = (sh + inner) / 2, mat = 0xcaa27a, OFF = 1;
    const flights = [[sh, -mid, Math.PI / 2], [-mid, -sh, Math.PI], [-sh, mid, -Math.PI / 2], [mid, sh, 0]];   // start point + direction for N, W, S, E sides
    const corners = [[-mid, -mid], [-mid, mid], [mid, mid], [mid, -mid]];                                       // NW, SW, SE, NE (landing after each side)
    let y = 0.1;
    for (let k = 0; k < NF; k++) {
      const q = (k + OFF) % 4, [sx, sz, r] = flights[q]; gf.stairs({ x: sx, z: sz, y0: y, y1: y + rise * NP, w: inner - sh - 0.02, ry: r, rise, run, mat, rails: false });
      y += rise * NP; const [cx, cz] = corners[q]; if (k < NF - 1) gf.box(inner - sh - 0.02, 0.3, inner - sh - 0.02, cx, y - 0.3, cz, 0xb08a62, { cast: false });
    }
    // top landing at Y on the W, S and E sides (the N side is the last flight coming up)
    const lw = inner - sh, slabT = 0.1;   // thin, so there is head room above the last flights
    gf.box(lw, slabT, 2 * inner, -mid, Y - slabT, 0, 0x8a5a3a, { cast: false });              // west strip (incl. NW + SW corners)
    gf.box(2 * sh, slabT, lw, 0, Y - slabT, mid, 0x8a5a3a, { cast: false });                 // south middle
    gf.box(lw, slabT, inner + sh, mid, Y - slabT, (inner - sh) / 2 - 0, 0x8a5a3a, { cast: false });   // east strip from SE corner up to the shaft's north edge
    gf.box(lw, slabT, lw, mid, Y - slabT, -mid, 0x8a5a3a, { cast: false });                  // NE corner (in front of the top door)
    // railing beside the stair opening on the north side at the top
    gf.box(0.08, 1.0, lw, sh + 0.05, Y, -mid, 0x7c3aed, { col: true, cast: false });
    // the big lift in the middle, door facing local +x (= the tower door side)
    gf.elevator({ x: 0, z: 0, w: 2 * sh - 0.4, d: 2 * sh - 0.4, doorW: 2.6, levels: [0.1, Y], names: ['Ground floor', 'First floor'], color: 0x7c3aed, side: Math.PI / 2 });
    // roof cone + flag
    const roof = new T.Mesh(new T.ConeGeometry(half * 1.5, 5.2, 4), M(0x6d28d9, { roughness: 0.55 })); roof.rotation.y = Math.PI / 4; roof.position.y = top + 2.6; roof.castShadow = true; gf.g.add(roof);
    gf.roof(roof, { w: 2 * inner, d: 2 * inner, y0: -1, y1: top + 1 }); gf.col(2 * half, 0.4, 2 * half, 0, top, 0, { tag: 'roof' });
    const sign = new T.Mesh(new T.PlaneGeometry(2.6, 0.6), new T.MeshStandardMaterial({ map: ZA.label('LIFT · STAIRS', { w: 512, h: 120, bg: '#3b0764', fg: '#ffd84a', size: 64, radius: 20 }) })); sign.position.set(half + 0.02, 3.3, 0); sign.rotation.y = Math.PI / 2; gf.g.add(sign);
    const sign2 = sign.clone(); sign2.position.y = Y + 3.1; gf.g.add(sign2);
    gf.area({ id: tw.id, num: 0, name: tw.id === 'tower_west' ? 'West tower (lift + stairs)' : 'East tower (lift + stairs)', x: 0, z: 0, w: 2 * half, d: 2 * half, y0: -0.5, y1: top });
  }

  ZFactory.buildFirst = build;
})();
