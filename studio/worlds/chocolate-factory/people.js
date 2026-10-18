/* Zungga Chocolate Factory — the people who work and visit here, each doing their job on a little routine:
 * chocolatiers stirring the vats, bakers carrying trays, warehouse crews moving crates, engineers hammering,
 * operators typing at consoles, café staff and customers, the station clerk, a gardener, the gate guard, visitors on
 * the plaza and the balcony. Nobody goes underground (nobody knows it is there).
 *   const crowd = ZFactory.people(W)   → crowd.update(t, dt, player)   (only people near the player are animated)
 * A route is a list of stops [x, z, wait (s), clip, face] in the area's own frame (buildings: door at local +z;
 * first-floor rooms / outdoor places: world axes, centred on the place). One stop = stands there doing the clip. */
(() => {
  'use strict';
  const T = THREE;
  const ROT = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 };
  const LOOK = (base, o = {}) => ({ ...ZCharacters.TOON_PRESETS[base], look: { ...ZCharacters.TOON_PRESETS[base].look, ...o } });
  // outfits (box-folk: different heights, colours and hats)
  const W_ = {
    chocolatier: (c) => LOOK('shop_owner', { top: 0xfef3c7, top2: c || 0x5b3420, head: 0x8b5a3c, hat: 'none' }),
    baker: () => LOOK('shop_owner', { top: 0xffffff, top2: 0xf59e0b, head: 0xfbbf24 }),
    scientist: (c) => LOOK('engineer', { top: 0xffffff, hatColor: c || 0xec4899, head: c || 0xec4899 }),
    crew: (c) => LOOK('road_worker', { hatColor: 0xfacc15, head: c || 0xa16207 }),
    engineer: (c) => LOOK('engineer', { top: 0x60a5fa, head: c || 0x0ea5e9 }),
    operator: (c) => LOOK('it_specialist', { top: c || 0x334155 }),
    barista: () => LOOK('grocer', { top2: 0x7c3aed, head: 0xec4899 }),
    clerk: () => LOOK('bus_driver', { top: 0xfacc15, head: 0x7c3aed }),
    guard: () => LOOK('security_guard'),
    gardener: () => LOOK('grocer', { top2: 0x16a34a, head: 0x84cc16, hat: 'cap', hatColor: 0x16a34a }),
    boss: () => LOOK('bank_manager', { head: 0x7c3aed, top: 0x5b2a86 }),
    nurse: () => LOOK('teacher', { top: 0xe0f2fe, top2: 0x22c55e, head: 0x14b8a6 }),
    trainer: () => LOOK('teacher'),
    visitor: (i) => LOOK(['dad', 'mom', 'grandpa', 'grandma', 'friend_boy', 'friend_girl', 'best_friend', 'friend_girl2', 'little_sister'][i % 9]),
  };
  // what people carry
  const crate = () => { const g = new T.Group(); const b = new T.Mesh(ZA.roundBox(0.34, 0.26, 0.26, 0.03), new T.MeshStandardMaterial({ color: 0xb7793f, roughness: 0.8 })); b.position.y = 0.13; g.add(b); const s = new T.Mesh(new T.BoxGeometry(0.36, 0.04, 0.28), new T.MeshStandardMaterial({ color: 0x7a4a26 })); s.position.y = 0.2; g.add(s); return g; };
  const tray = () => { const g = new T.Group(); const t = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.03, 20), new T.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.5, roughness: 0.3 })); g.add(t); for (let i = 0; i < 5; i++) { const ck = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.02, 14), new T.MeshStandardMaterial({ color: 0xd9a05b })); ck.position.set(Math.cos(i * 1.3) * 0.11, 0.025, Math.sin(i * 1.3) * 0.11); g.add(ck); } return g; };
  const jar = () => { const g = new T.Group(); const j = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.14, 14), new T.MeshStandardMaterial({ color: 0xf472b6, transparent: true, opacity: 0.85, roughness: 0.1 })); j.position.y = 0.07; g.add(j); return g; };
  const files = () => { const g = new T.Group(); for (let i = 0; i < 3; i++) { const f = new T.Mesh(new T.BoxGeometry(0.24, 0.05, 0.3), new T.MeshStandardMaterial({ color: [0xfacc15, 0x60a5fa, 0xf472b6][i] })); f.position.y = 0.05 * i + 0.025; g.add(f); } return g; };
  const can = () => { const g = new T.Group(); const c = new T.Mesh(new T.CylinderGeometry(0.07, 0.08, 0.14, 14), new T.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.3 })); c.position.y = 0.07; g.add(c); return g; };
  const wrench = () => { const g = new T.Group(); const h = new T.Mesh(new T.BoxGeometry(0.03, 0.22, 0.03), new T.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.7, roughness: 0.3 })); h.position.y = 0.1; g.add(h); return g; };
  const HOLD = { crate, tray, jar, files, can, wrench };

  function people(W) {
    const L = ZFactory.layout, G = L.ground, F = L.first, crew = [];
    const bld = (id) => G.buildings.find((b) => b.id === id), room = (id) => F.rooms.find((r) => r.id === id);
    // area frames → world
    function frameOf(at) {
      const b = bld(at); if (b) { const ry = ROT[b.door], co = Math.cos(ry), si = Math.sin(ry); const w = b.door === 'e' || b.door === 'w' ? b.d : b.w, d = b.door === 'e' || b.door === 'w' ? b.w : b.d; return { floor: 'ground', ry, w, d, to: (x, z) => [b.x + x * co + z * si, b.z - x * si + z * co] }; }
      const r = room(at); if (r) { const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2; return { floor: 'first', ry: 0, w: r.x1 - r.x0, d: r.z1 - r.z0, to: (x, z) => [cx + x, cz + z] }; }
      const p = L.places.find((q) => q.id === at); if (p) return { floor: p.floor, ry: 0, w: p.w, d: p.d, to: (x, z) => [p.x + x, p.z + z] };
      return null;
    }
    let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    function add(at, look, route, o = {}) {
      const fr = frameOf(at); if (!fr) return;
      const ch = ZCharacters.toon(look); ch.group.scale.setScalar(o.scale || 1);
      ch.group.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.userData.dynamic = true; } }); ch.group.userData.dynamic = true;
      if (o.hold) { const h = HOLD[o.hold](); if (o.hold === 'crate' || o.hold === 'tray' || o.hold === 'files') { h.position.set(0, o.hold === 'tray' ? 0.62 : 0.5, 0.26); ch.group.add(h); } else ch.hold(h, 'R'); }
      W.floors[fr.floor].add(ch.group);
      const stops = route.map(([x, z, wait = 2, clip = 'idle', face]) => { const [wx, wz] = fr.to(x, z); return { x: wx, z: wz, wait, clip, face: face == null ? null : face + fr.ry }; });
      const P = { ch, stops, i: 0, x: stops[0].x, z: stops[0].z, y: fr.floor === 'first' ? F.y : 0, yaw: stops[0].face ?? 0, wait: stops[0].wait * rnd(), walking: false, speed: o.speed || 1.05, walkClip: o.walkClip || 'walk', floorY: fr.floor === 'first' ? F.y : 0, fr };
      P.ch.play(stops[0].clip, { instant: true }); crew.push(P); place(P);
    }
    function place(P) { const s = P.fixedY != null ? P.fixedY : W.support(P.x, P.z, P.floorY + 0.5, 0.8).y; P.y = s > -1e8 ? s : P.floorY; P.ch.group.position.set(P.x, P.y, P.z); P.ch.group.rotation.y = P.yaw; }

    // the named workers of Zungga (worker sheet), in the Explorer look
    function named(at, preset, route, o = {}) {
      if (!ZCharacters.explorer || !ZCharacters.EXPLORER_PRESETS[preset]) return;
      const fr = frameOf(at); if (!fr) return;
      const ch = ZCharacters.explorer({ preset }); ch.group.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.userData.dynamic = true; } }); ch.group.userData.dynamic = true;
      W.floors[fr.floor].add(ch.group);
      const stops = route.map(([x, z, wait = 2, clip = 'idle', face]) => { const [wx, wz] = fr.to(x, z); return { x: wx, z: wz, wait, clip, face: face == null ? null : face + fr.ry }; });
      const P = { ch, stops, i: 0, x: stops[0].x, z: stops[0].z, y: 0, yaw: stops[0].face ?? 0, wait: stops[0].wait * rnd(), walking: false, speed: o.speed || 1.0, walkClip: o.walkClip || 'walk', floorY: fr.floor === 'first' ? F.y : 0, fr, name: preset };
      P.ch.play(stops[0].clip, { instant: true }); P.ch.setExpression(o.expr || 'smile', true); crew.push(P); place(P);
    }
    // Rosie's reception desk just inside the main gate
    { const E = G.entrance, f = W.frame('ground', E.x + 4.6, E.z - 10.9, 0);   // just inside the golden gate, beside the path, facing the visitors coming in f.box(2.6, 1.05, 0.9, -0, 0, 0, 0x6d28d9, { r: 0.08 }); f.box(2.8, 0.08, 1.05, 0, 1.05, 0, 0xfacc15, { col: false });
      const sg = new T.Mesh(new T.PlaneGeometry(2.2, 0.45), new T.MeshStandardMaterial({ map: ZA.label('WELCOME TO ZUNGGA!', { w: 1024, h: 210, bg: '#fde68a', fg: '#3b0764', size: 110, radius: 30 }) })); sg.position.set(0, 0.6, 0.46); f.g.add(sg); }
    { const E = G.entrance; named('main_entrance', 'rosie', [[4.6, -11.9, 7, 'greet', 0], [4.1, -12.0, 5, 'talk', 0.25]]); named('main_entrance', 'bruno', [[E.gate / 2 + 1.8, 4.5, 6, 'hands_on_hips', 0], [E.gate / 2 + 6, 6, 3, 'wave', 0], [E.gate / 2 + 1.8, 4.5, 4, 'arms_crossed', 0]], { expr: 'calm' }); }
    named('choco_garden', 'moss', [[-7, 4, 3, 'give', Math.PI], [-7, -5, 3, 'give', 0], [-2, 1, 3, 'give', Math.PI / 2]]);
    named('express_station', 'pip', [[-4, 1.6, 5, 'wave', 0.2], [5, 1.6, 4, 'point', 0.2], [0, 1.6, 4, 'wave', 0.1]]);
    { const R = G.plaza.r * 0.52, pts = []; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; pts.push([Math.sin(a) * R, Math.cos(a) * R, 4, 'sweep', a + Math.PI / 2]); } named('main_plaza', 'bubbles', pts, { speed: 0.6 }); }

    // ---------------- who works where ----------------
    const C = [0x5b3420, 0x7a4426, 0x8a5a3a];
    // the station: ticket clerk + passengers waiting for the train (station frame: world axes; platform top 0.5)
    add('express_station', W_.clerk(), [[-8.4, -0.4, 10, 'talk', 0]]);
    for (let i = 0; i < 4; i++) add('express_station', W_.visitor(i), [[-2 + i * 2.6, 1.2 + (i % 2) * 0.6, 8 + i, i % 2 ? 'talk' : 'idle', Math.PI * 0.05]]);
    // garden: the gardener with a watering can on a stroll, two kids playing
    add('choco_garden', W_.visitor(4), [[-4, 4, 1, 'cheer'], [2, 4.5, 1, 'wave'], [-1, -5, 1, 'cheer']], { speed: 1.6, walkClip: 'run' });
    add('choco_garden', W_.visitor(5), [[2, 4.5, 1, 'wave'], [-1, -5, 1, 'cheer'], [-4, 4, 1, 'cheer']], { speed: 1.6, walkClip: 'run' });
    // the gate guard, waving at visitors
    // visitors strolling around the Main Plaza (between the benches and the lamps)
    for (let i = 0; i < 6; i++) { const R = G.plaza.r * 0.71, a0 = i / 6 * Math.PI * 2, pts = []; for (let k = 0; k < 10; k++) { const a = a0 + (k / 10) * Math.PI * 2 * (i % 2 ? 1 : -1); pts.push([Math.sin(a) * R, Math.cos(a) * R, k % 5 === 4 ? 3 : 0.01, k % 5 === 4 ? 'talk' : 'idle']); } add('main_plaza', W_.visitor(i + 1), pts.map((p) => [p[0], p[1] + 0, p[2], p[3]]), { speed: 0.95 }); }
    { const B = F.balcony, gz0 = B.glass.z0 - (B.z0 + B.z1) / 2; for (let i = 0; i < 4; i++) add('observation_balcony', W_.visitor(i + 3), [[-20 + i * 12, gz0 - 1.5, 9, i % 2 ? 'point' : 'idle', 0], [-14 + i * 12, gz0 - 1.5, 6, 'talk', 0]], { speed: 0.8 }); }

    // ---------------- jobs: every worker stands at a real machine / desk in their room and works it ----------------
    const roomRect = (at) => { const b = bld(at); if (b) return { x0: b.x - b.w / 2, x1: b.x + b.w / 2, z0: b.z - b.d / 2, z1: b.z + b.d / 2, y: 0.13 }; const r = room(at); if (r) return { x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y: F.y }; return null; };
    const usedP = new Set(), usedS = new Set(), missed = [];
    function findProp(at, re) { const R = roomRect(at); if (!R) return null; const cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2;
      const list = (W.placed || []).filter((q) => re.test(q.id) && !usedP.has(q) && q.obj.visible !== false && q.x > R.x0 && q.x < R.x1 && q.z > R.z0 && q.z < R.z1 && Math.abs(q.y - R.y) < 1.2).sort((a2, b2) => Math.hypot(a2.x - cx, a2.z - cz) - Math.hypot(b2.x - cx, b2.z - cz));
      if (!list.length) return null; usedP.add(list[0]); return { q: list[0], R }; }
    function standBy(f, gap = 0.55) { const { q, R } = f, fx = Math.sin(q.ry), fz = Math.cos(q.ry), rx = Math.cos(q.ry), rz = -Math.sin(q.ry);
      for (const side of [1, -1]) for (const [axis, lat] of [[0, 0], [0, 0.8], [0, -0.8], [1, 0]]) { const d = (axis ? q.hx : q.hz) + gap, x = axis ? q.x + rx * d * side : q.x + fx * d * side + rx * lat, z = axis ? q.z + rz * d * side : q.z + fz * d * side + rz * lat;
        if (x < R.x0 + 0.5 || x > R.x1 - 0.5 || z < R.z0 + 0.5 || z > R.z1 - 0.5) continue; const t = { x, z }; W.push(t, 0.3, R.y, 1.1, 0.42); if (Math.hypot(t.x - x, t.z - z) < 0.05) return { x, z, face: Math.atan2(q.x - x, q.z - z) }; }
      return null; }
    function spawnAt(R, kind, look, stops, o = {}) {
      const ch = kind === 'exp' ? ZCharacters.explorer({ preset: look }) : ZCharacters.toon(look); ch.group.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.userData.dynamic = true; } }); ch.group.userData.dynamic = true;
      if (o.hold && kind !== 'exp') { const hh = HOLD[o.hold](); if (o.hold === 'crate' || o.hold === 'tray' || o.hold === 'files') { hh.position.set(0, o.hold === 'tray' ? 0.62 : 0.5, 0.26); ch.group.add(hh); } else ch.hold(hh, 'R'); }
      const floor = R.y > 9 ? 'first' : 'ground'; W.floors[floor].add(ch.group);
      const P = { ch, stops, i: 0, x: stops[0].x, z: stops[0].z, y: R.y, yaw: stops[0].face ?? 0, wait: stops[0].wait * rnd(), walking: false, speed: o.speed || 0.95, walkClip: o.walkClip || 'walk', floorY: floor === 'first' ? F.y : 0, fr: null, seat: o.seat };
      if (o.seat) { ch.setSeat(o.seat.h); P.fixedY = o.seat.y; }
      P.ch.play(stops[0].clip, { instant: true }); if (kind === 'exp') P.ch.setExpression(o.expr || 'smile', true); crew.push(P); place(P); return P;
    }
    function job(at, kind, look, specs, o = {}) {   // specs: [[regex, clip, seconds], …] — one stop at each machine found
      const stops = []; let R = null;
      for (const [re, clip, wait] of specs) { const f = findProp(at, re); if (!f) continue; const sp = standBy(f); if (!sp) continue; R = f.R; stops.push({ x: sp.x, z: sp.z, wait, clip, face: sp.face }); }
      if (stops.length) spawnAt(R, kind, look, stops, o); else missed.push(at + ':' + specs.map((q) => q[0].source).join(','));
    }
    function sitIn(at, looks, near, clip = 'sit') {   // people sitting on the room's real chairs / benches / sofas (closest to `near` first: the front rows)
      const R = roomRect(at); if (!R) return; const seats = (W.seats || []).filter((st) => !usedS.has(st) && st.x > R.x0 && st.x < R.x1 && st.z > R.z0 && st.z < R.z1 && Math.abs(st.y - R.y) < 1.2);
      const fp = near && (W.placed || []).find((q) => near.test(q.id) && q.x > R.x0 && q.x < R.x1 && q.z > R.z0 && q.z < R.z1);
      if (fp) seats.sort((a2, b2) => Math.hypot(a2.x - fp.x, a2.z - fp.z) - Math.hypot(b2.x - fp.x, b2.z - fp.z));
      const stride = fp ? 1 : Math.max(1, Math.floor(seats.length / looks.length)), skip = fp ? 2 : 0;   // leave the very front seats free for the kid
      looks.forEach((look, i) => { const st = seats[skip + i * stride + (fp && i % 3 === 2 ? 1 : 0) + Math.floor(i / 3) * (fp ? 1 : 0)]; if (!st) { missed.push(at + ':seat'); return; } usedS.add(st); st.taken = true; spawnAt(R, 'toon', look, [{ x: st.x, z: st.z, wait: 1e9, clip, face: st.ry }], { seat: st }); });
    }
    const TN = 'toon', XP = 'exp';
    // ground floor
    job('chocolate_kitchen', TN, W_.chocolatier(C[0]), [[/cfl_choco_mixer|cf_choco_vat/, 'stir', 12]]);
    job('chocolate_kitchen', TN, W_.chocolatier(C[1]), [[/cf_choco_vat|cfl_choco_mixer/, 'stir', 12]]);
    job('chocolate_kitchen', TN, W_.chocolatier(C[2]), [[/cf_tempering_table|cf_choco_mold_rack/, 'give', 6], [/cfl_conveyor|cf_choco_bar_conveyor/, 'give', 6]], { hold: 'tray', walkClip: 'carry' });
    job('cookie_bakery', XP, 'ben', [[/cfl_cookie_oven|cf_brick_oven/, 'carry_idle', 6], [/cf_cookie_display|cf_cookie_rack/, 'carry_idle', 5]], { walkClip: 'carry' });
    job('cookie_bakery', XP, 'ollie', [[/cf_dough_table|cf_stand_mixer/, 'stir', 14]], { expr: 'focused' });
    job('cookie_bakery', TN, W_.baker(), [[/cfl_cookie_printer|cf_brick_oven/, 'type', 10]]);
    job('candy_lab', XP, 'lulu', [[/cfl_candy_machine|cf_lollipop_press/, 'give', 8], [/cf_swirl_machine|cf_gumball_machine/, 'count', 6]]);
    job('candy_lab', TN, W_.scientist(0xec4899), [[/cf_lab_bench|cf_syrup_tubes/, 'stir', 12]]);
    job('candy_lab', TN, W_.scientist(0x8b5cf6), [[/cf_syrup_tubes|cf_candy_shelf|cf_lab_bench/, 'type', 10]]);
    job('marshmallow_workshop', TN, W_.chocolatier(0xf9a8d4), [[/cfl_marshmallow_fluffer|cf_marshmallow_puffer/, 'give', 10]]);
    job('marshmallow_workshop', TN, W_.crew(0xf472b6), [[/cf_marshmallow_conveyor|cf_marshmallow_pile/, 'carry_idle', 4], [/cf_marshmallow_sack|cf_marshmallow_puffer/, 'carry_idle', 4]], { hold: 'crate', walkClip: 'carry' });
    job('ingredient_warehouse', XP, 'penny', [[/cfl_packing_machine/, 'give', 10]]);
    job('ingredient_warehouse', TN, W_.crew(), [[/cf_storage_rack|cf_pallet_sacks/, 'carry_idle', 3], [/cfl_ingredient_elevator|cf_crate_stack/, 'carry_idle', 3]], { hold: 'crate', walkClip: 'carry', speed: 1.2 });
    job('machine_workshop', XP, 'tink', [[/cf_workbench/, 'hammer', 12]], { expr: 'focused' });
    job('machine_workshop', TN, W_.engineer(), [[/cf_robot_arm|cf_pump_machine/, 'type', 10]]);
    job('machine_workshop', TN, W_.engineer(0xf97316), [[/cf_workbench|cf_tool_cabinet/, 'hammer', 10]], { hold: 'wrench' });
    job('control_room', TN, W_.operator(), [[/cf_control_desk|cf_lever_panel/, 'type', 15]]);
    job('control_room', TN, W_.operator(0x7c3aed), [[/cf_control_desk|cf_big_monitor/, 'type', 15]]);
    job('choco_office', TN, W_.boss(), [[/cf_boss_desk/, 'type', 12], [/cf_bookshelf|cf_trophy_cabinet/, 'think', 6]]);
    job('workers_cafe', TN, W_.barista(), [[/cf_coffee_machine|cf_cafe_counter|cf_hot_choco_dispenser/, 'stir', 10]]);
    for (let i = 0; i < 3; i++) job('workers_cafe', TN, W_.visitor(i + 4), [[/cf_cafe_table_set/, 'talk', 12]]);
    // first floor
    job('control_room_f1', TN, W_.operator(), [[/cf1_control_console/, 'type', 15]]); job('control_room_f1', TN, W_.operator(0x0ea5e9), [[/cf1_control_console/, 'type', 15]]);
    job('security_center', TN, W_.guard(), [[/cf1_monitor_wall|cf1_control_console/, 'type', 12], [/cf1_map_board/, 'think', 6]]);
    job('quality_lab', XP, 'vanilla', [[/cfl_conveyor|cf1_mini_conveyor/, 'think', 8], [/cf1_tasting_table/, 'count', 6]], { expr: 'focused' });
    job('quality_lab', TN, W_.scientist(0xfacc15), [[/cf1_microscope_bench|cf1_scale_table|cf1_sample_rack/, 'type', 12]]);
    job('innovation_lab', XP, 'nibbles', [[/cf1_flask_bench|cf1_bubble_tank/, 'stir', 10], [/cf1_holo_table/, 'point', 6]], { expr: 'excited' });
    job('innovation_lab', TN, W_.scientist(0x14b8a6), [[/cf1_invention_machine|cf1_tesla_coil/, 'type', 12]]);
    job('recipe_library', TN, W_.trainer(), [[/cf1_bookshelf$|cf1_bookshelf_b/, 'point', 6], [/cf1_drafting_table|cf1_archive_boxes/, 'count', 6]]);
    job('training_room', TN, W_.trainer(), [[/cf1_whiteboard|cf1_practice_machine/, 'point', 12]]);
    job('first_aid', TN, W_.nurse(), [[/cf1_med_cabinet/, 'give', 6], [/cf1_med_bed/, 'count', 6]]);
    job('archive_room', TN, W_.clerk(), [[/cf1_filing_cabinet/, 'count', 6], [/cf1_archive_shelf/, 'carry_idle', 5]], { hold: 'files', walkClip: 'carry' });
    job('executive_office', TN, W_.boss(), [[/cf1_exec_desk/, 'type', 14], [/cf1_bookshelf|cf1_trophy_shelf/, 'think', 6]]);
    job('meeting_hall', TN, W_.boss(), [[/cf1_podium|cf1_stage_screen/, 'talk', 14]]);
    job('hall_of_fame', TN, W_.visitor(0), [[/cf1_pedestal/, 'point', 6], [/cf1_cocoa_statue/, 'think', 6]]);
    sitIn('meeting_hall', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (i % 3 === 1 ? W_.crew(C[i % 3]) : i % 3 === 2 ? W_.chocolatier(C[i % 3]) : W_.visitor(i))), /cf1_podium|cf1_stage_screen/);
    [W_.crew(C[0]), W_.crew(C[1]), W_.chocolatier(0xf9a8d4)].forEach((lk) => job('training_room', TN, lk, [[/cf1_training_desk/, 'type', 1e9]]));
    job('training_room', TN, W_.crew(C[2]), [[/cf1_practice_machine/, 'hammer', 1e9]]);
    sitIn('recipe_library', [W_.visitor(2), W_.scientist(0x7c3aed)]);
    sitIn('executive_office', [W_.visitor(1)]);
    sitIn('first_aid', [W_.crew(0x8b5cf6)]);

    // ---------------- living creatures (creature sheet) ----------------
    const life = [];
    function critter(kind, floor, step) { if (!ZCharacters.creature) return null; const c = ZCharacters.creature(kind); c.group.scale.setScalar(1.25); c.group.traverse((m) => { if (m.isMesh) m.userData.dynamic = true; }); c.group.userData.dynamic = true; W.floors[floor].add(c.group); const L = { c, floor, step, t: rnd() * 10, s: {} }; life.push(L); return L; }
    const trees = (W.treeSpots || []).slice(), PR = G.plaza.r;
    // cookie birds: perch on a tree top, then fly to another tree
    for (let i = 0; i < Math.min(10, trees.length); i++) { const L = critter('cookie_bird', 'ground', (L, dt) => {
      const s = L.s; if (!s.at) { s.at = trees[Math.floor(rnd() * trees.length)]; s.wait = 2 + rnd() * 6; L.c.play('idle'); }
      if (s.fly) { s.k = Math.min(1, s.k + dt * s.v); const k = s.k, x = s.from[0] + (s.to[0] - s.from[0]) * k, z = s.from[1] + (s.to[1] - s.from[1]) * k, y = 3.4 * s.from[2] + (3.4 * s.to[2] - 3.4 * s.from[2]) * k + Math.sin(k * Math.PI) * 3; L.c.group.position.set(x, y, z); L.c.group.rotation.y = Math.atan2(s.to[0] - s.from[0], s.to[1] - s.from[1]); if (k >= 1) { s.fly = false; s.at = s.to; s.wait = 3 + rnd() * 8; L.c.play('idle'); } return; }
      L.c.group.position.set(s.at[0] + 0.3, 3.4 * s.at[2] + 0.4, s.at[1]); if ((s.wait -= dt) <= 0) { let to = trees[Math.floor(rnd() * trees.length)]; for (let k = 0; k < 5 && Math.hypot(to[0] - s.at[0], to[1] - s.at[1]) > 35; k++) to = trees[Math.floor(rnd() * trees.length)]; s.from = s.at; s.to = to; s.k = 0; s.v = 4 / Math.max(4, Math.hypot(to[0] - s.at[0], to[1] - s.at[1])); s.fly = true; L.c.play('fly'); } }); void L; }
    // flower spots for bees + butterflies: plaza flower beds, the garden, the stalls ring
    const flowers = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; flowers.push([G.plaza.x + Math.sin(a) * PR * 0.44, G.plaza.z + Math.cos(a) * PR * 0.44]); }
    for (let i = 0; i < 6; i++) flowers.push([G.garden.x - G.garden.w / 2 + 4 + rnd() * (G.garden.w - 8), G.garden.z - G.garden.d / 2 + 3 + rnd() * (G.garden.d - 6)]);
    for (let i = 0; i < 9; i++) { const home = flowers[i % flowers.length], r = 0.6 + rnd() * 0.6; critter('jelly_bee', 'ground', (L, dt) => { L.t += dt; const a = L.t * (0.8 + (i % 3) * 0.3); L.c.group.position.set(home[0] + Math.cos(a) * r, 0.9 + Math.sin(L.t * 1.7) * 0.25, home[1] + Math.sin(a) * r); L.c.group.rotation.y = -a; L.c.play('fly'); }); }
    for (let i = 0; i < 12; i++) { const home = flowers[(i * 3) % flowers.length]; critter('sprinkle_butterfly', 'ground', (L, dt) => { const s = L.s; if (!s.to || Math.hypot(s.to[0] - s.x, s.to[1] - s.z) < 0.3) { s.x = s.x ?? home[0]; s.z = s.z ?? home[1]; s.to = [home[0] + (rnd() - 0.5) * 9, home[1] + (rnd() - 0.5) * 9]; } const dx = s.to[0] - s.x, dz = s.to[1] - s.z, d = Math.hypot(dx, dz) || 1; s.x += dx / d * dt * 1.1; s.z += dz / d * dt * 1.1; L.t += dt; L.c.group.position.set(s.x, 1.1 + Math.sin(L.t * 2.3) * 0.45, s.z); L.c.group.rotation.y = Math.atan2(dx, dz); L.c.play('fly'); }); }
    // marshmallow bunnies hopping on the garden lawn, around the plaza and in the marshmallow workshop
    const mw = bld('marshmallow_workshop'), hopAreas = [[G.garden.x, G.garden.z, G.garden.w / 2 - 2, G.garden.d / 2 - 2], [G.plaza.x, G.plaza.z + PR * 0.3, PR * 0.25, PR * 0.15], [mw.x, mw.z, mw.w / 2 - 3, mw.d / 2 - 3]];
    for (let i = 0; i < 8; i++) { const A = hopAreas[i % 3]; critter('marshmallow_bunny', 'ground', (L, dt) => { const s = L.s; if (s.x == null) { s.x = A[0]; s.z = A[1]; } if (!s.to || s.wait > 0) { s.wait = (s.wait ?? 0) - dt; if (s.wait <= 0 && !s.to) { s.to = [A[0] + (rnd() * 2 - 1) * A[2], A[1] + (rnd() * 2 - 1) * A[3]]; L.c.play('hop'); } if (!s.to) { L.c.play('idle'); } }
      if (s.to) { const dx = s.to[0] - s.x, dz = s.to[1] - s.z, d = Math.hypot(dx, dz); if (d < 0.1) { s.to = null; s.wait = 1 + rnd() * 4; } else { s.x += dx / d * Math.min(d, dt * 0.9); s.z += dz / d * Math.min(d, dt * 0.9); L.c.group.rotation.y = Math.atan2(dx, dz); } }
      const y = W.support(s.x, s.z, 1, 1.2).y; L.c.group.position.set(s.x, y > -50 ? y : 0, s.z); }); }
    // chocolate fish swimming along the river (now and then a jump) + a few in the underground reservoir
    { const curve = new T.CatmullRomCurve3(G.river.points.map(([x, z]) => new T.Vector3(x, 0, z))), surf = G.river.surf;
      for (let i = 0; i < 10; i++) { const off = (rnd() - 0.5) * 5, sp = 0.006 + rnd() * 0.006, dir = i % 2 ? 1 : -1; critter('chocolate_fish', 'ground', (L, dt) => { const s = L.s; s.u = ((s.u ?? rnd()) + dir * sp * dt + 1) % 1; const p = curve.getPointAt(s.u), tg = curve.getTangentAt(s.u); L.t += dt; const jump = Math.max(0, Math.sin(L.t * 0.7 + i * 1.3)) ** 12; L.c.group.position.set(p.x - tg.z * off, surf - 0.1 + jump * 0.9, p.z + tg.x * off); L.c.group.rotation.set(-jump * 0.6 * dir, Math.atan2(tg.x * dir, tg.z * dir), 0); L.c.play('swim'); }); }
      const R = L.under.rooms.find((r) => r.id === 'chocolate_reservoir'), pl = R.pool, cx = (pl.x0 + pl.x1) / 2, cz = (pl.z0 + pl.z1) / 2;
      for (let i = 0; i < 4; i++) { const rx = (pl.x1 - pl.x0) / 2 - 2 - i, rz = (pl.z1 - pl.z0) / 2 - 1.5 - i * 0.4; critter('chocolate_fish', 'under', (L, dt) => { L.t += dt; const a = L.t * 0.25 + i * 1.6; L.c.group.position.set(cx + Math.cos(a) * rx, R.y - 0.4, cz + Math.sin(a) * rz); L.c.group.rotation.y = Math.atan2(-Math.sin(a) * rx, Math.cos(a) * rz); L.c.play('swim'); }); } }

    // customers at every treat stall (the sellers stand behind the counters, from the island)
    for (const st of (W.placed || []).filter((p) => p.id.startsWith('stall_'))) {
      const fx = Math.sin(st.ry), fz = Math.cos(st.ry), rx = Math.cos(st.ry), rz = -Math.sin(st.ry), n = 2;
      for (let k = 0; k < n; k++) {
        const off = (k - (n - 1) / 2) * 1.3, x = st.x + fx * (st.hz + 1.3) + rx * off, z = st.z + fz * (st.hz + 1.3) + rz * off, face = st.ry + Math.PI;
        const awayX = x + fx * 6 + rx * (k ? 4 : -4), awayZ = z + fz * 6 + rz * (k ? 4 : -4);
        const fr = { floor: 'ground', ry: 0, w: 1, d: 1, to: (a2, b2) => [a2, b2] };
        const look = W_.visitor(Math.floor(rnd() * 9)), ch = ZCharacters.toon(look); ch.group.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.userData.dynamic = true; } }); ch.group.userData.dynamic = true; W.floors.ground.add(ch.group);
        const stops = [{ x, z, wait: 7 + rnd() * 6, clip: k ? 'give' : 'talk', face }, { x: awayX, z: awayZ, wait: 4 + rnd() * 4, clip: 'idle', face: null }];
        const P = { ch, stops, i: 0, x, z, y: 0, yaw: face, wait: rnd() * 6, walking: false, speed: 0.9, walkClip: 'walk', floorY: 0, fr }; P.ch.play(stops[0].clip, { instant: true }); crew.push(P); place(P); void fr;
      }
    }

    const NEAR = 60;
    return {
      list: crew,
      missed,
      life,
      update(t, dt, player) {
        for (const L of life) { const g = L.c.group, p = g.position; const on = !player || ((L.floor === 'under') === (player.y < -3) && Math.hypot(p.x - player.x, p.z - player.z) < 55); g.visible = on; if (!on && L.s.at !== undefined && !L.s.fly) continue; L.step(L, dt); if (on) L.c.update(dt); }
        for (const P of crew) {
          const near = !player || (Math.hypot(P.x - player.x, P.z - player.z) < NEAR && Math.abs(P.floorY - (player.y > 9 ? F.y : 0)) < 2 && player.y > -3);
          P.ch.group.visible = near; if (!near) continue;
          const st = P.stops[P.i];
          if (!P.walking) {
            if (P.stops.length > 1 && (P.wait -= dt) <= 0) { P.i = (P.i + 1) % P.stops.length; P.walking = true; P.ch.play(P.walkClip); }
            else if (st.face != null) P.yaw += Math.atan2(Math.sin(st.face - P.yaw), Math.cos(st.face - P.yaw)) * Math.min(1, dt * 4);
          } else {
            const nx = P.stops[P.i], dx = nx.x - P.x, dz = nx.z - P.z, d = Math.hypot(dx, dz);
            if (d < 0.08) { P.walking = false; P.wait = nx.wait; P.ch.play(nx.clip); }
            else { const sp = Math.min(d, P.speed * dt); P.x += dx / d * sp; P.z += dz / d * sp; const ty = Math.atan2(dx, dz); P.yaw += Math.atan2(Math.sin(ty - P.yaw), Math.cos(ty - P.yaw)) * Math.min(1, dt * 8); }
          }
          // the player can't walk through people
          if (player) { const ex = player.x - P.x, ez = player.z - P.z, ed = Math.hypot(ex, ez); if (ed < 0.62 && Math.abs(player.y - P.y) < 1) { player.x = P.x + ex / (ed || 1) * 0.62; player.z = P.z + ez / (ed || 1) * 0.62; } }
          place(P); P.ch.update(dt);
        }
      },
    };
  }
  ZFactory.people = people;
})();
