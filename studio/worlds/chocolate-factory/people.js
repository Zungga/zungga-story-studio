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
    function place(P) { const s = W.support(P.x, P.z, P.floorY + 0.5, 0.8).y; P.y = s > -1e8 ? s : P.floorY; P.ch.group.position.set(P.x, P.y, P.z); P.ch.group.rotation.y = P.yaw; }

    // ---------------- who works where ----------------
    const C = [0x5b3420, 0x7a4426, 0x8a5a3a];
    // Chocolate Kitchen: three chocolatiers stirring the vats, one carrying moulds between the vats and the tables
    add('chocolate_kitchen', W_.chocolatier(C[0]), [[-2.2, -2.4, 9, 'stir', Math.PI]]);
    add('chocolate_kitchen', W_.chocolatier(C[1]), [[2.4, -2.2, 9, 'stir', Math.PI]]);
    add('chocolate_kitchen', W_.chocolatier(C[2]), [[0, 3.5, 2, 'carry_idle'], [0, -1, 2, 'carry_idle'], [-1.8, 0.5, 2, 'carry_idle']], { hold: 'tray', walkClip: 'carry' });
    // Cookie Bakery: a baker between the ovens and the counter, a cashier
    add('cookie_bakery', W_.baker(), [[-2.5, -2.5, 3, 'give', Math.PI], [2.2, 1.5, 3, 'give', 0]], { hold: 'tray', walkClip: 'carry' });
    add('cookie_bakery', W_.baker(), [[1.5, -0.5, 6, 'talk', 0]]);
    // Candy Lab: two scientists
    add('candy_lab', W_.scientist(0xec4899), [[-2, -2.2, 5, 'think', Math.PI], [2, -2.2, 5, 'count', Math.PI]]);
    add('candy_lab', W_.scientist(0x8b5cf6), [[1.6, 1.2, 4, 'point', Math.PI / 2], [0, 3.5, 2, 'idle'], [-1.6, 0.5, 3, 'type', Math.PI]], { hold: 'jar' });
    // Marshmallow Workshop
    add('marshmallow_workshop', W_.chocolatier(0xf9a8d4), [[-2, -2, 6, 'give', Math.PI]]);
    add('marshmallow_workshop', W_.crew(0xf472b6), [[0, 3.6, 2, 'carry_idle'], [1.8, -1.2, 2, 'carry_idle']], { hold: 'crate', walkClip: 'carry' });
    // Ingredient Warehouse: a crew moving crates in a loop
    add('ingredient_warehouse', W_.crew(), [[0, 4, 1.5, 'carry_idle'], [-2.5, -2.5, 1.5, 'carry_idle'], [2.5, -2.5, 1.5, 'carry_idle']], { hold: 'crate', walkClip: 'carry', speed: 1.2 });
    add('ingredient_warehouse', W_.crew(0x0ea5e9), [[2.2, 0.5, 7, 'count', Math.PI / 2]]);
    // Machine Workshop: engineers
    add('machine_workshop', W_.engineer(), [[-1.8, -2.4, 8, 'hammer', Math.PI]], { hold: 'wrench' });
    add('machine_workshop', W_.engineer(0xf97316), [[2, -1.5, 4, 'type', Math.PI], [1, 3, 3, 'think', 0]]);
    // Factory Control Room (ground): operators at the round console
    add('control_room', W_.operator(), [[-2.2, -1.6, 10, 'type', Math.PI * 0.8]]);
    add('control_room', W_.operator(0x7c3aed), [[2.2, -1.6, 10, 'type', -Math.PI * 0.8]]);
    // Mr. Choco's ground-floor office
    add('choco_office', W_.boss(), [[3, 0, 6, 'think', Math.PI], [5.5, 2, 4, 'arms_crossed', 0]]);
    // Workers' Café: barista + customers chatting
    add('workers_cafe', W_.barista(), [[0, -2.6, 6, 'stir', Math.PI], [1.6, -2.6, 4, 'give', 0]]);
    add('workers_cafe', W_.crew(0x8b5cf6), [[-2.6, 1.2, 12, 'talk', Math.PI / 2]]);
    add('workers_cafe', W_.chocolatier(0x7a4426), [[-1.4, 1.2, 12, 'talk', -Math.PI / 2]]);
    add('workers_cafe', W_.engineer(0x22c55e), [[2.8, 2.2, 10, 'talk', Math.PI]]);
    // the station: ticket clerk + passengers waiting for the train (station frame: world axes; platform top 0.5)
    add('express_station', W_.clerk(), [[-8.4, -0.4, 10, 'talk', 0]]);
    for (let i = 0; i < 4; i++) add('express_station', W_.visitor(i), [[-2 + i * 2.6, 1.2 + (i % 2) * 0.6, 8 + i, i % 2 ? 'talk' : 'idle', Math.PI * 0.05]]);
    // garden: the gardener with a watering can on a stroll, two kids playing
    add('choco_garden', W_.gardener(), [[-6, 3, 3, 'give', Math.PI], [-6, -4, 3, 'give', 0], [-1, 0.5, 3, 'give', Math.PI / 2]], { hold: 'can' });
    add('choco_garden', W_.visitor(4), [[-4, 4, 1, 'cheer'], [2, 4.5, 1, 'wave'], [-1, -5, 1, 'cheer']], { speed: 1.6, walkClip: 'run' });
    add('choco_garden', W_.visitor(5), [[2, 4.5, 1, 'wave'], [-1, -5, 1, 'cheer'], [-4, 4, 1, 'cheer']], { speed: 1.6, walkClip: 'run' });
    // the gate guard, waving at visitors
    { const E = G.entrance; add('main_entrance', W_.guard(), [[(E.gate / 2 + 1.2), 4.2, 8, 'wave', 0], [(E.gate / 2 + 1.2), 4.2, 8, 'hands_on_hips', 0]]); }
    // visitors strolling around the Main Plaza (between the benches and the lamps)
    for (let i = 0; i < 6; i++) { const R = G.plaza.r * 0.71, a0 = i / 6 * Math.PI * 2, pts = []; for (let k = 0; k < 10; k++) { const a = a0 + (k / 10) * Math.PI * 2 * (i % 2 ? 1 : -1); pts.push([Math.sin(a) * R, Math.cos(a) * R, k % 5 === 4 ? 3 : 0.01, k % 5 === 4 ? 'talk' : 'idle']); } add('main_plaza', W_.visitor(i + 1), pts.map((p) => [p[0], p[1] + 0, p[2], p[3]]), { speed: 0.95 }); }
    // ---- first floor ----
    add('executive_office', W_.boss(), [[0, -3.5, 8, 'think', Math.PI], [3, -1, 5, 'arms_crossed', Math.PI / 2], [-2, 1, 4, 'hip_point_front', 0]]);
    add('control_room_f1', W_.operator(), [[-3, -2.5, 12, 'type', Math.PI]]); add('control_room_f1', W_.operator(0x0ea5e9), [[3, -2.5, 12, 'type', Math.PI]]);
    add('security_center', W_.guard(), [[0, -2.5, 10, 'type', Math.PI], [2, 1.5, 4, 'think', Math.PI / 2]]);
    add('meeting_hall', W_.boss(), [[0, -4, 10, 'talk', 0], [1.5, -4, 6, 'point', 0]]);
    for (let i = 0; i < 4; i++) add('meeting_hall', W_.visitor(i + 2), [[-3 + i * 2, 1.5, 12, i % 2 ? 'idle' : 'think', Math.PI]]);
    add('quality_lab', W_.scientist(0xfacc15), [[-2, -2, 6, 'give', Math.PI], [2, -2, 6, 'count', Math.PI]]);
    add('quality_lab', W_.chocolatier(0x8a5a3a), [[1.5, 1.5, 9, 'talk', Math.PI]]);
    add('innovation_lab', W_.scientist(0x14b8a6), [[-1.5, -2, 5, 'think', Math.PI], [1.5, 1, 5, 'point', Math.PI / 2]]);
    add('training_room', W_.trainer(), [[0, -3.2, 10, 'point', 0], [1.5, -3.2, 6, 'talk', 0]]);
    for (let i = 0; i < 3; i++) add('training_room', W_.crew(C[i]), [[-2 + i * 2, 1, 12, 'think', Math.PI]]);
    add('first_aid', W_.nurse(), [[-2.5, -1.5, 4, 'give', Math.PI], [2.5, -1.5, 4, 'count', Math.PI], [0, 2.5, 3, 'idle']]);
    add('archive_room', W_.clerk(), [[-2, -2.5, 3, 'carry_idle'], [2, -2.5, 3, 'carry_idle'], [0, 2, 2, 'carry_idle']], { hold: 'files', walkClip: 'carry' });
    add('recipe_library', W_.trainer(), [[4, 2, 6, 'think', Math.PI], [9, 3, 5, 'count', Math.PI / 2]]);
    add('hall_of_fame', W_.visitor(0), [[-2, -1, 6, 'point', Math.PI], [2, -1, 6, 'think', Math.PI]]);
    { const B = F.balcony, gz0 = B.glass.z0 - (B.z0 + B.z1) / 2; for (let i = 0; i < 4; i++) add('observation_balcony', W_.visitor(i + 3), [[-20 + i * 12, gz0 - 1.5, 9, i % 2 ? 'point' : 'idle', 0], [-14 + i * 12, gz0 - 1.5, 6, 'talk', 0]], { speed: 0.8 }); }

    const NEAR = 60;
    return {
      list: crew,
      update(t, dt, player) {
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
