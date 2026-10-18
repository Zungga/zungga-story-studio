/*
 * Zungga Chocolate Factory — the layout of all three floors, taken from the three master blueprints.
 * World units are metres. North = −z, east = +x. The box kid is 1.08 m tall.
 *   ground floor  y = 0     (factory city; blueprint "Master blueprint — top view (ground floor)")
 *   first floor   y = 13    (operations deck above the city; its glass Observation Balcony looks down on the Main Plaza)
 *   underground   y = −10 / −14 / −17   (the forgotten foundation; reached only through the bookshelf in the Recipe Library)
 * Every builder, the minimap, the walk-through page and the story stager read this one file.
 */
(() => {
  'use strict';
  const FIRST_Y = 13, UG1 = -10, UG2 = -14, UG3 = -17;
  const L = {
    id: 'chocolate_factory', name: 'Zungga Chocolate Factory',
    levels: { ground: 0, first: FIRST_Y, under1: UG1, under2: UG2, under3: UG3 },
    bounds: { x0: -58.6, x1: 58.6, z0: -60, z1: 57 },

    // ---------------- ground floor ----------------
    ground: {
      plaza: { num: 1, id: 'main_plaza', name: 'Main Plaza', x: 0, z: -12, r: 11, ring: [11, 15] },
      boulevard: { num: 2, id: 'cookie_boulevard', name: 'Cookie Boulevard', loop: { x0: -29.5, x1: 28, z0: -36, z1: 18, r: 8, w: 4 } },
      // buildings: centre, size, which side the door is on, roof style, colours; `h` = wall height
      buildings: [
        { num: 3, id: 'candy_lab', name: 'Candy Lab', x: 18.3, z: -22.7, w: 16, d: 16, door: 'w', h: 5, style: 'candy', wall: 0xf9a8d4, roof: 0xdb2777 },
        { num: 4, id: 'marshmallow_workshop', name: 'Marshmallow Workshop', x: -19.5, z: -21.4, w: 16, d: 16, door: 'e', h: 5, style: 'marshmallow', wall: 0xfdf2f8, roof: 0xf9a8d4 },
        { num: 5, id: 'cookie_bakery', name: 'Cookie Bakery', x: 38, z: 5.7, w: 14, d: 15, door: 'w', h: 5, style: 'bakery', wall: 0xf3d3a2, roof: 0xb7793f },
        { num: 6, id: 'chocolate_kitchen', name: 'Chocolate Kitchen', x: -41.6, z: 7.6, w: 18, d: 16, door: 'e', h: 5.5, style: 'kitchen', wall: 0x8b5a3c, roof: 0x5b3420 },
        { num: 8, id: 'ingredient_warehouse', name: 'Ingredient Warehouse', x: -42.2, z: -30.2, w: 16, d: 16, door: 'e', h: 6, style: 'warehouse', wall: 0xc9a77c, roof: 0x4d7c3a },
        { num: 9, id: 'machine_workshop', name: 'Machine Workshop', x: 42.2, z: -33.4, w: 16, d: 16, door: 'w', h: 6, style: 'machine', wall: 0x64748b, roof: 0x3b4a7a },
        { num: 10, id: 'choco_office', name: "Mr. Choco's Office", x: -34.7, z: -47.5, w: 18, d: 11, door: 's', h: 5, style: 'office', wall: 0xe9d5ff, roof: 0x6d28d9 },
        { num: 11, id: 'control_room', name: 'Factory Control Room', x: 0, z: -47, w: 16, d: 16, door: 's', h: 6, style: 'dome', round: 8, wall: 0xa0673f, roof: 0x7a4a2a },
        { num: 12, id: 'workers_cafe', name: "Workers' Café", x: 31.5, z: 26, w: 14, d: 12, door: 'n', h: 4.5, style: 'cafe', wall: 0xf6c28b, roof: 0xd9622b },
      ],
      station: { num: 7, id: 'express_station', name: 'Chocolate Express Station', x: -37.8, z: 31.5, w: 20, d: 7 },
      garden: { num: 13, id: 'choco_garden', name: 'Chocolate Garden', x: 36, z: -48, w: 18, d: 14 },
      entrance: { id: 'main_entrance', name: 'Main Entrance', x: 0, z: 30, w: 20, d: 6, gate: 6, outer: { x: 0, z: 45, r: 8 } },
      // chocolate river (west → east), ends in the waterfall pool under the Machine Workshop's aqueduct
      river: { width: 5, surf: -0.45, bed: -1.7, points: [[-60, -8.8], [-49.1, -7.6], [-37.8, -4.4], [-26.5, -1.9], [-16.4, 2.5], [-8.2, 5.0], [0, 5.7], [8.8, 4.4], [17.6, 1.3], [26.5, -3.2], [34, -7.6], [40.3, -11.3], [43.5, -14]] },
      pool: { x: 43.5, z: -14, r: 4.2 },
      aqueduct: { x: 43.5, z0: -25.4, z1: -17.5, y: 5.2 },
      bridges: [
        { x: 0, z: 5.7, len: 9, w: 6, ry: 0, kind: 'grand' },        // the main boulevard bridge
        { x: -29.5, z: -2.6, len: 8, w: 4.5, ry: 0.22, kind: 'road' },
        { x: 28, z: -4.1, len: 8, w: 4.5, ry: -0.5, kind: 'road' },
        { x: -13.2, z: 3.8, len: 7, w: 2.4, ry: 0.42, kind: 'wood' },
        { x: 13.5, z: 2.9, len: 7, w: 2.4, ry: -0.3, kind: 'wood' },
        { x: -49.5, z: -7.7, len: 7, w: 2.4, ry: 0.1, kind: 'wood' },
      ],
      track: { x0: -54, x1: 54, z0: -57, z1: 37, r: 10 },
      wall: { h: 3.2 },
      // the two lift + stair towers up to the first floor (round towers at both ends of the Observation Balcony)
      towers: [{ id: 'tower_west', x: -35, z: -16, door: 'e' }, { id: 'tower_east', x: 35, z: -16, door: 'w' }],
      deckColumns: [[-8, -31], [8, -31], [-21, -8], [21, -8], [-24, -50], [24, -51], [-14, 4.5], [14, 4.5]],
      // the hidden shaft from the library bookshelf passes through Mr. Choco's office as a sealed stone pillar
      shaft: { x: -34, z: -50.3, r: 2.45 },
      // small cookie paths (polylines) besides the loop / boulevards
      paths: [
        [[0, 27], [0, 3]],                     // entrance → plaza (main boulevard, over the grand bridge)
        [[0, -27], [0, -39]],                  // plaza → control room
        [[-34.2, -30.2], [-31.5, -30.2]],      // warehouse door
        [[34.2, -33.4], [30, -33.4]],          // machine workshop door
        [[-34.7, -42], [-34.7, -38]],          // office door → loop
        [[30.5, -41], [28, -36]],              // garden gate → loop corner
        [[31, 5.7], [30, 5.7]],                // bakery door
        [[-32.6, 7.6], [-31.5, 7.6]],          // kitchen door
        [[-11.5, -21.4], [-10.6, -20]],        // marshmallow door → plaza ring
        [[10.3, -22.7], [9.6, -21]],           // candy lab door → plaza ring
        [[-13.2, 3.8], [-9, -1.5]], [[-13.2, 3.8], [-16.5, 9], [-18, 16]],   // footbridge west
        [[13.5, 2.9], [9.5, -2]], [[13.5, 2.9], [17, 9], [18, 16]],          // footbridge east
        [[-49.5, -7.7], [-50.5, -2], [-50.5, 4]], [[-49.5, -7.7], [-48.5, -14]],
        [[0, 33], [0, 40]],                    // gate → outer plaza (crosses the track)
        [[-35, -12.5], [-35, -8], [-31.5, -8]], [[35, -12.5], [35, -11.5], [30, -11.5]],
      ],
      anchors: [
        ['C01', 'Main Entrance (hero shot)', [0, 3.2, 52], [0, 4, 28]],
        ['C02', 'Cookie Boulevard (facing north)', [0, 2.2, 24], [0, 2.4, 0]],
        ['C03', 'Main Plaza (wide view)', [14, 7, 4], [0, 1, -12]],
        ['C04', 'Chocolate River bridge (centre)', [6, 2.2, 13], [0, 0.6, 5.7]],
        ['C05', 'Marshmallow Workshop entrance', [-4, 2, -18], [-11.5, 2.2, -21.4]],
        ['C06', 'Candy Lab entrance', [4, 2, -20], [10.3, 2.2, -22.7]],
        ['C07', 'Cookie Bakery entrance', [24, 2, 8], [31, 2.2, 5.7]],
        ['C08', 'Chocolate Kitchen entrance', [-25, 2, 11], [-32.6, 2.2, 7.6]],
        ['C09', 'Chocolate Express Station', [-30, 2.6, 41], [-38, 1.5, 32]],
        ['C10', 'Ingredient Warehouse entrance', [-26, 2.2, -27], [-34.2, 2.2, -30.2]],
        ['C11', 'Machine Workshop entrance', [26, 2.2, -30], [34.2, 2.6, -33.4]],
        ['C12', "Workers' Café entrance", [31.5, 2, 13], [31.5, 1.8, 21]],
        ['C13', 'Chocolate Garden view', [30, 3.5, -34], [37, 1, -48]],
      ],
    },

    // ---------------- first floor (y = 13) ----------------
    first: {
      y: FIRST_Y, outline: { x0: -37.5, x1: 37.5, z0: -56, z1: 6.5 }, wallH: 4.6,
      rooms: [   // x0..x1, z0..z1 (world). doors: side + offset along that wall from its centre
        { num: 3, id: 'recipe_library', name: 'Recipe Research Library', x0: -37, x1: -11, z0: -54, z1: -40, doors: [['s', 0], ['e', 3]] },
        { num: 1, id: 'executive_office', name: "Mr. Choco's Executive Office", x0: -11, x1: 11, z0: -56, z1: -40, doors: [['s', 0], ['w', 4], ['e', 4]] },
        { num: 2, id: 'control_room_f1', name: 'Factory Control Room', x0: 11, x1: 37, z0: -54, z1: -40, doors: [['s', 0], ['w', 3]] },
        { num: 4, id: 'innovation_lab', name: 'Innovation Lab', x0: -37, x1: -21, z0: -34, z1: -20, doors: [['n', 0], ['s', 0], ['e', 0]] },
        { num: 5, id: 'quality_lab', name: 'Quality Testing Lab', x0: -21, x1: -2.5, z0: -34, z1: -20, doors: [['n', 0], ['s', 0], ['w', 0], ['e', 0]] },
        { num: 6, id: 'meeting_hall', name: 'Staff Meeting Hall', x0: 2.5, x1: 20.5, z0: -34, z1: -20, doors: [['n', 0], ['s', 0], ['w', 0], ['e', 0]] },
        { num: 7, id: 'security_center', name: 'Security Operations Center', x0: 20.5, x1: 37, z0: -34, z1: -20, doors: [['n', 0], ['s', 0], ['w', 0]] },
        { num: 9, id: 'hall_of_fame', name: 'Hall of Fame', x0: -37, x1: -21, z0: -6, z1: 6, doors: [['n', 0], ['e', 0]] },
        { num: 10, id: 'training_room', name: 'Employee Training Room', x0: -21, x1: -3, z0: -6, z1: 6, doors: [['n', 0], ['w', 0], ['e', 0]] },
        { num: 11, id: 'first_aid', name: 'First Aid & Wellness Room', x0: 3, x1: 21, z0: -6, z1: 6, doors: [['n', 0], ['w', 0], ['e', 0]] },
        { num: 12, id: 'archive_room', name: 'Archive Room', x0: 21, x1: 37, z0: -6, z1: 6, doors: [['n', 0], ['w', 0]] },
      ],
      corridors: [
        { id: 'north_corridor', name: 'Cookie Path (north corridor)', x0: -37, x1: 37, z0: -40, z1: -34 },
        { id: 'centre_corridor', name: 'Cookie Path (centre)', x0: -2.5, x1: 2.5, z0: -34, z1: -20 },
        { id: 'south_corridor', name: 'Cookie Path (south)', x0: -3, x1: 3, z0: -6, z1: 6.5 },
      ],
      balcony: { num: 8, id: 'observation_balcony', name: 'Visitor Observation Balcony', x0: -31.5, x1: 31.5, z0: -20, z1: -6, glass: { x0: -26, x1: 26, z0: -16, z1: -8.5 } },
      hidden: { num: 13, id: 'hidden_access', name: 'Hidden Access to Underground', x0: -37, x1: -31, z0: -54, z1: -47, shelf: { x: -31, z: -50.3 } },
      anchors: [
        ['F1-A', 'Library entrance view', [-24, 15.2, -36], [-24, 14.2, -47]],
        ['F1-B', "Mr. Choco's office front view", [0, 15.5, -37], [0, 14, -50]],
        ['F1-C', 'Control room wide view', [24, 16.5, -38.5], [24, 14, -48]],
        ['F1-D', 'Observation balcony centre view', [0, 16.5, -19], [0, 13, -10]],
        ['F1-E', 'Balcony left side view', [-28, 15.5, -13], [-10, 13.5, -14]],
        ['F1-F', 'Balcony right side view', [28, 15.5, -13], [10, 13.5, -14]],
        ['F1-G', 'Hidden entrance (bookshelf close-up)', [-27, 14.6, -49], [-31, 14.4, -51]],
      ],
    },

    // ---------------- underground ----------------
    under: {
      rooms: [
        { num: 1, id: 'hidden_entrance', name: 'Hidden Entrance', x0: -39.5, x1: -28.5, z0: -58.5, z1: -43.5, y: UG1, h: 5 },
        { num: 2, id: 'spiral_staircase', name: 'Secret Spiral Staircase', x0: -26, x1: -12.5, z0: -52, z1: -41, y: UG1, h: 5, spiral: { x: -19, z: -46.5, y0: UG2, y1: UG1 } },
        { num: 3, id: 'tunnel_network', name: 'Forgotten Tunnel Network', x0: -11.5, x1: 11.5, z0: -57, z1: -36, y: UG2, h: 4.5 },
        { num: 4, id: 'machinery_hall', name: 'Ancient Machinery Hall', x0: 13, x1: 42, z0: -58.5, z1: -36, y: UG2, h: 7 },
        { num: 5, id: 'chocolate_reservoir', name: 'Chocolate Reservoir', x0: -26, x1: 13, z0: -35, z1: -22, y: UG2, h: 7, pool: { x0: -18, x1: 6, z0: -32, z1: -24.5 } },
        { num: 6, id: 'ingredient_vault', name: 'Old Ingredient Vault', x0: -44, x1: -28, z0: -34, z1: -19, y: UG2, h: 4.5 },
        { num: 7, id: 'puzzle_corridor', name: 'Puzzle Corridor', x0: -28, x1: 34, z0: -20, z1: -14, y: UG2, h: 4.5 },
        { num: 8, id: 'hall_of_founders', name: 'Hall of Founders', x0: -60, x1: -31, z0: -18, z1: 12, y: UG2, h: 6.5 },
        { num: 9, id: 'recipe_vault', name: 'Secret Recipe Vault', x0: -24, x1: -1, z0: -11, z1: 12, y: UG2, h: 6 },
        { num: 10, id: 'secret_chamber', name: 'The Secret Chamber', x0: 4, x1: 34, z0: -12.5, z1: 12, y: UG3, h: 9 },
      ],
      anchors: [
        ['U-01', 'Hidden entrance (arrival)', [-31, UG1 + 2.2, -45], [-34, UG1 + 1, -53]],
        ['U-02', 'Secret spiral staircase', [-13.5, UG1 + 2.6, -42.5], [-19, UG1 - 1.5, -46.5]],
        ['U-03', 'Forgotten tunnels', [0, UG2 + 2, -38], [0, UG2 + 1, -50]],
        ['U-04', 'Ancient machinery hall', [15, UG2 + 3.5, -38], [32, UG2 + 2, -50]],
        ['U-05', 'Chocolate reservoir', [10, UG2 + 3.5, -23.5], [-6, UG2, -28]],
        ['U-06', 'Old ingredient vault', [-30, UG2 + 2, -18.5], [-38, UG2 + 1, -28]],
        ['U-07', 'Puzzle corridor', [-24, UG2 + 2, -17], [10, UG2 + 1.4, -17]],
        ['U-08', 'Hall of founders', [-33, UG2 + 3, 9], [-48, UG2 + 2, -4]],
        ['U-09', 'Secret recipe vault door', [-12, UG2 + 2, -15.5], [-12, UG2 + 1.8, -10.5]],
        ['U-10', 'The secret chamber', [6, UG3 + 4, 9], [20, UG3 + 1.5, -1]],
      ],
    },
  };
  // ---------- spread it out: the blueprints are drawn tight; the real factory is spacious (like the island) ----------
  //   K = distance scale for every position on all three floors (keeps the floors lined up above each other)
  //   B = size scale for ground-floor buildings (bigger rooms, but much more open land between them)
  const K = 2, B = 1.4; L.scale = { K, B };
  const sx = (o, keys) => { for (const k of keys) if (o[k] != null) o[k] *= K; };
  { const G = L.ground;
    sx(G.plaza, ['x', 'z', 'r']); G.plaza.ring = G.plaza.ring.map((v) => v * K);
    sx(G.boulevard.loop, ['x0', 'x1', 'z0', 'z1', 'r']); G.boulevard.loop.w = 6.5;
    for (const b of G.buildings) { b.x *= K; b.z *= K; b.w *= B; b.d *= B; b.h = Math.round(b.h * 1.25 * 10) / 10; if (b.round) b.round *= B; }
    for (const o of [G.station, G.garden]) { o.x *= K; o.z *= K; o.w *= B; o.d *= B; }
    G.entrance.x *= K; G.entrance.z *= K; G.entrance.w *= 1.3; G.entrance.gate = 8; G.entrance.outer = { x: G.entrance.outer.x * K, z: G.entrance.outer.z * K, r: 12 };
    G.river.points = G.river.points.map(([x, z]) => [x * K, z * K]); G.river.width = 9; G.river.points[0][0] = -96;   // springs up inside the walls (no train crossing)
    sx(G.pool, ['x', 'z']); G.pool.r = 7;
    for (const b of G.bridges) { b.x *= K; b.z *= K; }
    sx(G.track, ['x0', 'x1', 'z0', 'z1', 'r']);
    for (const t of G.towers) { t.x *= K; t.z *= K; }
    sx(G.shaft, ['x', 'z']);
    G.paths = G.paths.map((pts) => pts.map(([x, z]) => [x * K, z * K]));
    for (const a of G.anchors) { a[2] = [a[2][0] * K, a[2][1] * 1.6, a[2][2] * K]; a[3] = [a[3][0] * K, a[3][1], a[3][2] * K]; }
    const mw = G.buildings.find((x) => x.id === 'machine_workshop'); G.aqueduct = { x: G.pool.x, z0: mw.z + mw.d / 2, z1: G.pool.z - G.pool.r + 0.6, y: 7 };
    // Mr. Choco's office must hold the secret shaft (it comes down from the library above) with room to spare
    const of = G.buildings.find((x) => x.id === 'choco_office'); of.x = G.shaft.x + 2; if (of.z - of.d / 2 > G.shaft.z - G.shaft.r - 1.2) of.z = G.shaft.z - G.shaft.r - 1.2 + of.d / 2;
    G.deckColumns = null;   // placed automatically where the ground is free (first.js)
    L.bounds = { x0: L.bounds.x0 * K, x1: L.bounds.x1 * K, z0: L.bounds.z0 * K, z1: L.bounds.z1 * K };
  }
  { const F = L.first; sx(F.outline, ['x0', 'x1', 'z0', 'z1']); F.wallH = 5.5;
    for (const r of F.rooms) { sx(r, ['x0', 'x1', 'z0', 'z1']); r.doors = r.doors.map(([sd, at]) => [sd, at * K]); }
    for (const k of F.corridors) sx(k, ['x0', 'x1', 'z0', 'z1']);
    sx(F.balcony, ['x0', 'x1', 'z0', 'z1']); sx(F.balcony.glass, ['x0', 'x1', 'z0', 'z1']);
    sx(F.hidden, ['x0', 'x1', 'z0', 'z1']); F.hidden.shelf = { x: F.hidden.x1, z: L.ground.shaft.z };
    for (const a of F.anchors) { a[2] = [a[2][0] * K, a[2][1] + 1.2, a[2][2] * K]; a[3] = [a[3][0] * K, a[3][1], a[3][2] * K]; }
  }
  { const U = L.under;
    for (const r of U.rooms) { sx(r, ['x0', 'x1', 'z0', 'z1']); r.h = Math.round(r.h * 1.3 * 10) / 10; if (r.spiral) sx(r.spiral, ['x', 'z']); if (r.pool) sx(r.pool, ['x0', 'x1', 'z0', 'z1']); }
    for (const a of U.anchors) { a[2] = [a[2][0] * K, a[2][1] + 0.6, a[2][2] * K]; a[3] = [a[3][0] * K, a[3][1], a[3][2] * K]; }
  }

  // every place (all floors) as one list, for the story stager and the walk-through checklist
  L.places = [
    { ...L.ground.plaza, floor: 'ground', w: L.ground.plaza.r * 2, d: L.ground.plaza.r * 2 },
    { num: 2, id: 'cookie_boulevard', name: 'Cookie Boulevard', floor: 'ground', x: 0, z: L.ground.boulevard.loop.z1, w: 80, d: 7 },
    ...L.ground.buildings.map((b) => ({ num: b.num, id: b.id, name: b.name, floor: 'ground', x: b.x, z: b.z, w: b.w, d: b.d })),
    { ...L.ground.station, floor: 'ground' }, { ...L.ground.garden, floor: 'ground' },
    { num: 0, id: 'main_entrance', name: 'Main Entrance', floor: 'ground', x: L.ground.entrance.x, z: L.ground.entrance.z, w: L.ground.entrance.w, d: 8 },
    ...L.first.rooms.map((r) => ({ num: r.num, id: r.id, name: r.name, floor: 'first', x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, w: r.x1 - r.x0, d: r.z1 - r.z0 })),
    { num: 8, id: 'observation_balcony', name: 'Visitor Observation Balcony', floor: 'first', x: 0, z: (L.first.balcony.z0 + L.first.balcony.z1) / 2, w: L.first.balcony.x1 - L.first.balcony.x0, d: L.first.balcony.z1 - L.first.balcony.z0 },
    { num: 13, id: 'hidden_access', name: 'Hidden Access to Underground', floor: 'first', x: (L.first.hidden.x0 + L.first.hidden.x1) / 2, z: (L.first.hidden.z0 + L.first.hidden.z1) / 2, w: L.first.hidden.x1 - L.first.hidden.x0, d: L.first.hidden.z1 - L.first.hidden.z0 },
    ...L.under.rooms.map((r) => ({ num: r.num, id: r.id, name: r.name, floor: 'under', x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, w: r.x1 - r.x0, d: r.z1 - r.z0, y: r.y })),
  ];
  // where a story scene in each place stands (actors gather here; the camera comes from +z). Mostly the room centre.
  const SPOT = { main_plaza: [0, 0.05, -4.2], cookie_boulevard: [0, 0.05, 18], main_entrance: [0, 0.05, 38.5], express_station: [-37.8, 0.5, 32.2], choco_garden: [32, 0.05, -46],
    choco_office: [-37.5, 0.13, -46.5], control_room: [0, 0.13, -48.5], observation_balcony: [0, 13, -18.2], hidden_access: [-32.2, 13, -48.2],
    hidden_entrance: [-31.5, -10, -47], spiral_staircase: [-23.6, -10, -44], tunnel_network: [0.5, -14, -42], chocolate_reservoir: [-6, -14, -23.6], puzzle_corridor: [-20, -14, -17.5], recipe_vault: [-12.5, -14, 2], secret_chamber: [16, -17, 3] };
  const OUT_BOX = { main_plaza: { x0: -13, x1: 13, z0: -25, z1: 0.5, y0: 0.5, y1: 7 }, cookie_boulevard: { x0: -12, x1: 12, z0: 9, z1: 25, y0: 0.5, y1: 6 }, main_entrance: { x0: -12, x1: 12, z0: 34.5, z1: 51, y0: 0.5, y1: 7 },
    choco_garden: { x0: 27.6, x1: 44.4, z0: -54.4, z1: -41.6, y0: 0.5, y1: 5 }, express_station: { x0: -47.5, x1: -28, z0: 28.5, z1: 44, y0: 1.0, y1: 4.1 }, observation_balcony: { x0: -31, x1: 31, z0: -19.6, z1: -6.4, y0: FIRST_Y + 0.5, y1: FIRST_Y + 7 } };
  for (const k of Object.keys(SPOT)) { SPOT[k][0] *= K; SPOT[k][2] *= K; }
  for (const k of Object.keys(OUT_BOX)) { const o = OUT_BOX[k]; o.x0 *= K; o.x1 *= K; o.z0 *= K; o.z1 *= K; }
  const OUTDOOR = new Set(['main_plaza', 'cookie_boulevard', 'main_entrance', 'express_station', 'choco_garden', 'observation_balcony']);
  for (const p of L.places) {
    p.spot = SPOT[p.id] || [p.x, p.floor === 'first' ? FIRST_Y : p.floor === 'under' ? p.y : 0.13, p.z];
    p.outdoor = OUTDOOR.has(p.id); p.dark = p.floor === 'under';
    p.storyId = 'cf_' + p.id;
    // inside rooms the story camera stays within the walls (outdoor places: no limit)
    const b = L.ground.buildings.find((x) => x.id === p.id), u = L.under.rooms.find((x) => x.id === p.id), f = L.first.rooms.find((x) => x.id === p.id);
    if (b) p.room = { x0: b.x - b.w / 2 + 0.5, x1: b.x + b.w / 2 - 0.5, z0: b.z - b.d / 2 + 0.5, z1: b.z + b.d / 2 - 0.5, y0: 0.4, y1: b.h - 0.3 };
    else if (f) p.room = { x0: f.x0 + 0.5, x1: f.x1 - 0.5, z0: f.z0 + 0.5, z1: f.z1 - 0.5, y0: FIRST_Y + 0.4, y1: FIRST_Y + 9 };
    else if (OUT_BOX[p.id]) p.room = OUT_BOX[p.id];
    else if (u) p.room = { x0: u.x0 + 0.6, x1: u.x1 - 0.6, z0: u.z0 + 0.6, z1: u.z1 - 0.6, y0: u.y + 0.4, y1: u.y + u.h - 0.4 };
  }
  // other names stories use for these places (Writers' Room drafts, typed stories)
  L.aliases = { entrance: 'main_entrance', 'entrance hall': 'main_entrance', gate: 'main_entrance', 'main gate': 'main_entrance', plaza: 'main_plaza', fountain: 'main_plaza', boulevard: 'cookie_boulevard', 'cookie road': 'cookie_boulevard',
    'mixing hall': 'chocolate_kitchen', 'mixing room': 'chocolate_kitchen', 'chocolate room': 'chocolate_kitchen', 'factory floor': 'chocolate_kitchen', 'tasting room': 'quality_lab', 'testing lab': 'quality_lab', 'recipe vault': 'recipe_vault', vault: 'recipe_vault',
    "owner's office": 'executive_office', "owners office": 'executive_office', office: 'executive_office', 'control room': 'control_room', library: 'recipe_library', 'recipe library': 'recipe_library', archive: 'archive_room', 'storage room': 'ingredient_warehouse', storage: 'ingredient_warehouse', warehouse: 'ingredient_warehouse',
    'cocoa bean room': 'ingredient_warehouse', 'loading yard': 'express_station', station: 'express_station', train: 'express_station', cafe: 'workers_cafe', 'café': 'workers_cafe', canteen: 'workers_cafe', garden: 'choco_garden', bakery: 'cookie_bakery', workshop: 'machine_workshop', 'meeting room': 'meeting_hall', balcony: 'observation_balcony', 'first aid': 'first_aid', 'hall of fame': 'hall_of_fame', 'secret room': 'secret_chamber', tunnel: 'tunnel_network', tunnels: 'tunnel_network', underground: 'hidden_entrance', 'secret passage': 'hidden_entrance' };
  const root = typeof window !== 'undefined' ? window : globalThis;   // also loads in Node (the story stager)
  root.ZFactory = Object.assign(root.ZFactory || {}, { layout: L, dress: (root.ZFactory && root.ZFactory.dress) || {} });
})();
