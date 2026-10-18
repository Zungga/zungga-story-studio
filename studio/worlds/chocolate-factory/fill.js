/* Zungga Chocolate Factory — fill every room so it looks full (the rooms are big now): theme props along the walls
 * (facing into the room) and on the open floor, and rows of chairs / desks where a room needs them. A prop is only
 * placed where nothing else stands, never in a doorway lane, never in the pool, never in the room's middle. */
(() => {
  'use strict';
  const T = THREE;
  const THEMES = {
    // first floor
    executive_office: { wall: ['cf1_bookshelf', 'cf1_trophy_shelf', 'cf1_window_seat', 'plant_pot', 'cf1_bookshelf_b'], floor: ['cf1_armchair_pink', 'cf_coffee_table', 'cf1_armchair_teal', 'cf_floor_globe', 'cf1_round_table', 'cf1_sofa'] },
    control_room_f1: { wall: ['cf1_monitor_wall', 'cf1_lever_panel', 'cf1_status_tower', 'cf1_lockers'], floor: ['cf1_control_console', 'cf1_operator_chair', 'cf1_map_board', 'cf1_control_console'] },
    recipe_library: { wall: ['cf1_bookshelf', 'cf1_bookshelf_b', 'cf1_bookshelf_narrow', 'cf1_archive_boxes', 'cf1_bookshelf'], floor: ['cf1_reading_table', 'cf1_bookshelf_low', 'cf1_drafting_table', 'cf1_scroll_basket', 'cf1_bookshelf_low'] },
    innovation_lab: { wall: ['cf1_flask_bench', 'cf1_bubble_tank', 'cf1_invention_machine'], floor: ['cf1_tesla_coil', 'cf1_holo_table', 'cf1_friendly_robot', 'cf1_tesla_coil'] },
    quality_lab: { living: ['cfl_conveyor'], wall: ['cf1_sample_rack', 'cf1_microscope_bench', 'cf1_scale_table'], floor: ['cf1_tasting_table', 'cf1_mini_conveyor', 'cf1_tasting_table'] },
    meeting_hall: { wall: ['plant_pot', 'cf1_lockers', 'plant_pot'], rows: { id: 'cf1_chair', dx: 1.25, dz: 1.5, face: Math.PI, from: 0.15, to: 0.85 } },
    security_center: { wall: ['cf1_monitor_wall_b', 'cf1_key_cabinet', 'cf1_lockers', 'cf1_monitor_wall'], floor: ['cf1_control_console', 'cf1_operator_chair', 'cf1_map_board'] },
    hall_of_fame: { wall: ['cf1_trophy_shelf', 'plant_pot'], floor: ['cf1_pedestal_cup', 'cf1_pedestal_star', 'cf1_pedestal_bar', 'cf1_pedestal_medal', 'cf1_cocoa_statue'] },
    training_room: { wall: ['cf1_practice_machine', 'plant_pot', 'cf1_practice_machine'], rows: { id: 'cf1_training_desk', dx: 3.2, dz: 2.6, face: Math.PI, from: 0.25, to: 0.85 } },
    first_aid: { wall: ['cf1_med_bed', 'cf1_privacy_curtain', 'cf1_med_bed', 'cf1_med_cabinet', 'cf1_water_cooler'], floor: ['cf1_bean_bag', 'plant_pot', 'cf1_bean_bag'] },
    archive_room: { wall: ['cf1_archive_shelf', 'cf1_filing_cabinet', 'cf1_filing_cabinet_teal', 'cf1_archive_shelf'], floor: ['cf1_archive_shelf', 'cf1_doc_cart', 'cf1_archive_shelf'] },
    // ground floor
    candy_lab: { living: ['cfl_candy_machine'], wall: ['cf_candy_shelf', 'cf_syrup_tubes', 'cf_lab_bench', 'cf_candy_shelf'], floor: ['cf_lollipop_press', 'cf_gumball_machine', 'cf_swirl_machine', 'cf_cotton_candy_machine'] },
    marshmallow_workshop: { living: ['cfl_marshmallow_fluffer'], wall: ['cf_marshmallow_sack', 'cf_marshmallow_conveyor', 'cf_marshmallow_sack'], floor: ['cf_marshmallow_puffer', 'cf_marshmallow_pile', 'cf_cushion', 'cf_marshmallow_tower'] },
    cookie_bakery: { living: ['cfl_cookie_oven', 'cfl_cookie_printer'], wall: ['cf_brick_oven', 'cf_cookie_rack', 'cf_flour_sack', 'cf_cookie_rack'], floor: ['cf_dough_table', 'cf_stand_mixer', 'cf_cookie_jar'] },
    chocolate_kitchen: { living: ['cfl_choco_mixer', 'cfl_conveyor'], wall: ['cf_choco_mold_rack', 'cf_tempering_table', 'cf_choco_mold_rack'], floor: ['cf_choco_vat', 'cf_cocoa_grinder', 'cf_choco_bar_stack', 'cf_choco_vat'] },
    ingredient_warehouse: { living: ['cfl_packing_machine', 'cfl_ingredient_elevator'], wall: ['cf_storage_rack', 'cf_crate_stack', 'cf_storage_rack'], floor: ['cf_pallet_sacks', 'cf_crate_stack', 'cf_milk_cans', 'cf_hand_truck', 'cf_pallet_sacks'] },
    machine_workshop: { wall: ['cf_workbench', 'cf_tool_cabinet', 'cf_workbench'], floor: ['cf_robot_arm', 'cf_conveyor_parts', 'cf_robot_arm'] },
    choco_office: { wall: ['cf_bookshelf', 'cf_trophy_cabinet', 'cf_bookshelf'], floor: ['cf_sofa', 'cf_coffee_table', 'cf_floor_globe'] },
    workers_cafe: { living: ['cfl_choco_fountain'], wall: ['cf_vending_machine', 'plant_pot', 'cf_hot_choco_dispenser'], floor: ['cf_cafe_table_set', 'cf_cafe_table_set', 'cf_cafe_table_set'] },
    // underground
    hidden_entrance: { wall: ['cfu_crate', 'cfu_barrel', 'cfu_crate', 'cfu_sack'] },
    tunnel_network: { wall: ['cfu_crate', 'cfu_barrel', 'cfu_mine_cart', 'cfu_sack'] },
    machinery_hall: { wall: ['cfu_boiler', 'cfu_lever_panel', 'cfu_piston', 'cfu_boiler'], floor: ['cfu_gear_tower', 'cfu_ancient_gear', 'cfu_piston', 'cfu_conveyor', 'cfu_ancient_gear'] },
    chocolate_reservoir: { wall: ['cfu_barrel', 'cave_crystal', 'cfu_crate', 'cave_crystal_pink'] },
    ingredient_vault: { wall: ['cfu_ingredient_shelf', 'cfu_barrel', 'cfu_clay_jar', 'cfu_ingredient_shelf'], floor: ['cfu_sack', 'cfu_barrel', 'cfu_crate', 'cfu_scale'] },
    puzzle_corridor: { wall: ['cfu_brazier', 'cfu_carved_column', 'cfu_brazier'] },
    hall_of_founders: { wall: ['cfu_carved_column', 'cfu_candelabra', 'cfu_carved_column'] },
    recipe_vault: { wall: ['cfu_scroll_shelf', 'cfu_big_safe', 'cfu_scroll_shelf'], floor: ['cfu_recipe_pedestal', 'cfu_gold_stack', 'cfu_recipe_pedestal'] },
    secret_chamber: { wall: ['cfu_big_crystal', 'cfu_big_crystal_cyan', 'cfu_big_crystal'] },
  };

  function fill(W) {
    const L = ZFactory.layout, G = L.ground, F = L.first, U = L.under, M = W.M;
    const keep = W.keepOut || [];
    const near = (x, z, r) => W.cols.filter((c) => c.on && Math.abs(c.x - x) < c.hx + c.hz + r + 1 && Math.abs(c.z - z) < c.hx + c.hz + r + 1);
    // is the rotated rect (world centre, half sizes, rotation) clear at floor height y?
    function clear(x, z, hx, hz, ry, y) {
      for (const c of near(x, z, Math.max(hx, hz))) { if (c.y1 < y + 0.15 || c.y0 > y + 2) continue; const dx = c.x - x, dz = c.z - z, co = Math.cos(ry), si = Math.sin(ry), lx = dx * co - dz * si, lz = dx * si + dz * co, dr = c.ry - ry, px = Math.abs(c.hx * Math.cos(dr)) + Math.abs(c.hz * Math.sin(dr)), pz = Math.abs(c.hx * Math.sin(dr)) + Math.abs(c.hz * Math.cos(dr)); if (Math.abs(lx) < hx + px + 0.25 && Math.abs(lz) < hz + pz + 0.25) return false; }
      for (const Ln of W.lanes) { if (Math.abs(Ln.y - y) > 1.5) continue; const co = Math.cos(Ln.ry), si = Math.sin(Ln.ry), dx = x - Ln.x, dz = z - Ln.z, lx = dx * co - dz * si, lz = dx * si + dz * co, r = Math.max(hx, hz); if (Math.abs(lx) < Ln.hw + r && Math.abs(lz) < Ln.hd + r) return false; }
      for (const k of keep) { if (Math.abs(k.y - y) > 2) continue; if (x + hx > k.x0 && x - hx < k.x1 && z + hz > k.z0 && z - hz < k.z1) return false; }
      return true;
    }
    const sizeCache = {};
    function size(id) { if (!sizeCache[id]) { const o = ZAssets.build(id).group; o.updateMatrixWorld(true); const b = ZA.frameBox ? ZA.frameBox(o) : new T.Box3().setFromObject(o); sizeCache[id] = b.isEmpty() ? [0.6, 0.6, 1] : [(b.max.x - b.min.x) / 2, (b.max.z - b.min.z) / 2, b.max.y - Math.max(0, b.min.y)]; } return sizeCache[id]; }
    // one room: rect in its own frame (local x0..x1, z0..z1), frame f at floor level; walls listed as 'n','s','e','w'
    function room(f, rect, theme, h, walls = ['n', 's', 'e', 'w']) {
      const y = f.oy, cxL = (rect.x0 + rect.x1) / 2, czL = (rect.z0 + rect.z1) / 2, cr = Math.min(3, Math.min(rect.x1 - rect.x0, rect.z1 - rect.z0) * 0.2);
      const put = (id, lx, lz, r) => { if (!ZAssets.has(id)) return false; const [hx, hz, hh] = size(id); if (hh > h - 0.2) return false; const ex = Math.abs(hx * Math.cos(r)) + Math.abs(hz * Math.sin(r)), ez = Math.abs(hx * Math.sin(r)) + Math.abs(hz * Math.cos(r));
        if (lx - ex < rect.x0 || lx + ex > rect.x1 || lz - ez < rect.z0 || lz + ez > rect.z1) return false;
        if (Math.hypot(lx - cxL, lz - czL) < cr + Math.max(hx, hz)) return false;   // keep the middle open
        const [wx, wz] = f.W(lx, lz); if (!clear(wx, wz, hx, hz, f.ry + r, y)) return false; f.prop(id, lx, 0, lz, r, 1, { shrink: 0.9 }); return true; };
      if (theme.living) {   // the living machines stand by the back wall, facing whoever comes in
        theme.living.forEach((id, i) => { if (!ZAssets.has(id)) return; const [, hz] = size(id), lz = rect.z0 + hz + 0.9, w = rect.x1 - rect.x0;
          for (const f2 of [0, 0.22, -0.22, 0.38, -0.38, 0.12, -0.12]) { const lx = cxL + (i ? -1 : 1) * Math.abs(f2) * w * (f2 < 0 ? -1 : 1) + (theme.living.length > 1 ? (i ? -1 : 1) * w * 0.2 : 0); if (put(id, lx, lz, 0)) break; } }); }
      if (theme.wall) { let k = 0; const step = 0.5;
        for (const side of walls) { const ns = side === 'n' || side === 's', a0 = ns ? rect.x0 : rect.z0, a1 = ns ? rect.x1 : rect.z1, r = { n: 0, s: Math.PI, w: Math.PI / 2, e: -Math.PI / 2 }[side];
          for (let a = a0 + 0.8; a < a1 - 0.8; a += step) { const id = theme.wall[k % theme.wall.length]; if (!ZAssets.has(id)) { k++; continue; } const [hx, hz] = size(id), off = hz + 0.3;
            const lx = ns ? a + hx : side === 'w' ? rect.x0 + off : rect.x1 - off, lz = ns ? (side === 'n' ? rect.z0 + off : rect.z1 - off) : a + hx;
            if (put(id, lx, lz, r)) { k++; a += hx * 2 + 0.5; } } } }
      if (theme.rows) { const R = theme.rows; if (ZAssets.has(R.id)) { const z0 = rect.z0 + (rect.z1 - rect.z0) * R.from, z1 = rect.z0 + (rect.z1 - rect.z0) * R.to; for (let z = z0; z <= z1; z += R.dz) for (let x = rect.x0 + 1.2; x <= rect.x1 - 1.2; x += R.dx) put(R.id, x, z, R.face); } }
      if (theme.floor) { let k = 0; const gx = 4.2, gz = 4.2;
        for (let z = rect.z0 + 2.4; z < rect.z1 - 2; z += gz) for (let x = rect.x0 + 2.4; x < rect.x1 - 2; x += gx) { const id = theme.floor[k % theme.floor.length]; if (put(id, x + ((k * 7) % 3 - 1) * 0.4, z, ((k * 3) % 4) * Math.PI / 2)) k++; } }
    }
    const ROT = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 };
    W.dressRun(() => {
      for (const b of G.buildings) { const th = THEMES[b.id]; if (!th || b.round) continue; const sw = b.door === 'e' || b.door === 'w', w = sw ? b.d : b.w, d = sw ? b.w : b.d, f = W.frame('ground', b.x, b.z, ROT[b.door], 0.125);
        room(f, { x0: -w / 2 + 0.35, x1: w / 2 - 0.35, z0: -d / 2 + 0.35, z1: d / 2 - 0.35 }, th, b.h - 0.3); }
      for (const r of F.rooms) { const th = THEMES[r.id]; if (!th) continue; const f = W.frame('first', (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 0, F.y + 0.015), w = r.x1 - r.x0, d = r.z1 - r.z0;
        room(f, { x0: -w / 2 + 0.4, x1: w / 2 - 0.4, z0: -d / 2 + 0.4, z1: d / 2 - 0.4 }, th, F.wallH - 0.3); }
      for (const r of U.rooms) { const th = THEMES[r.id]; if (!th) continue; const base = r.spiral ? r.spiral.y0 : r.y, f = W.frame('under', (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 0, base), w = r.x1 - r.x0, d = r.z1 - r.z0;
        room(f, { x0: -w / 2 + 0.5, x1: w / 2 - 0.5, z0: -d / 2 + 0.5, z1: d / 2 - 0.5 }, th, r.h - 0.3); }
    });
  }
  ZFactory.fill = fill;
  const finish0 = ZFactory.finish;
  ZFactory.finish = (W) => { fill(W); return finish0 ? finish0(W) : W.clearLanes(); };
})();
