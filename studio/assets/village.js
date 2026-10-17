/* Zungga Story Studio — island village (ported from the drive-portfolio island game, js/game.js lines 944–971).
 * Homes (six wall/roof colour pairs), the thatched mud hut, picket fence and the dirt lane with its lamps.
 * Real metres (doors 2.3 m). setOn(on) = evening: windows glow warm (the game's night values). */
(() => {
  'use strict';
  const { T, mat, mesh, tex } = ZA;
  const gm = (c, o = {}) => mat(c, { roughness: 0.85, ...o });
  const add = (geo, m, x = 0, y = 0, z = 0, parent) => mesh(geo, m, parent, x, y, z);
  const flat = (m) => { m.castShadow = false; return m; };
  const seeded = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
  function jitter(geo, amt, rnd) { const p = geo.attributes.position; for (let k = 0; k < p.count; k++) p.setXYZ(k, p.getX(k) + (rnd() * 2 - 1) * amt, p.getY(k) + (rnd() * 2 - 1) * amt, p.getZ(k) + (rnd() * 2 - 1) * amt); geo.computeVertexNormals(); return geo; }
  // windows: emissive day 0.05 → night 2.6
  const winMat = () => new T.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffc078, emissiveIntensity: 0.05 });
  const switchable = (g, mats, day, night, on = false) => { g.userData.setOn = (v) => { for (const m of mats) m.emissiveIntensity = v ? night : day; }; g.userData.setOn(on); return { group: g }; };

  // ---------- homes ----------
  const HOMES = [['red', 0xfff4e6, 0xc92a2a], ['blue', 0xe3fafc, 0x1864ab], ['purple', 0xfff0f6, 0x5f3dc4], ['green', 0xf4fce3, 0x2b8a3e], ['orange', 0xfff9db, 0xd9480f], ['grey', 0xe5dbff, 0x495057]];
  function home(wallC, roofC) {
    const g = new T.Group(), s = new T.Group(); s.position.z = -1; g.add(s);   // fence sits 5.4 m in front; centre the whole plot
    const wm = winMat();
    add(new T.BoxGeometry(8, 4.6, 7), gm(wallC), 0, 2.3, 0, s);
    const roof = add(new T.ConeGeometry(6.4, 3.4, 4), gm(roofC), 0, 6.3, 0, s); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.85;
    flat(add(new T.BoxGeometry(1.3, 2.3, 0.1), gm(0x5c3d2e), 0, 1.15, 3.52, s));
    for (const wx of [-2.5, 2.5]) flat(add(new T.PlaneGeometry(1.3, 1.1), wm, wx, 2.6, 3.53, s));
    add(new T.BoxGeometry(0.7, 1.6, 0.7), gm(0x868e96), 2.2, 7.0, -1, s);                                    // chimney
    const white = gm(0xf8f9fa), pk = new T.BoxGeometry(0.1, 0.7, 0.1);
    for (let f = -3.6; f <= 3.6; f += 0.9) if (Math.abs(f) > 1) flat(add(pk, white, f, 0.35, 5.4, s));      // picket fence (gap for the gate)
    return switchable(g, [wm], 0.05, 2.6);
  }
  HOMES.forEach(([id, wallC, roofC]) => ZAssets.register('village', 'village_home_' + id, `Village home (${id} roof)`, () => home(wallC, roofC), ['house', 'home', 'village', 'cottage', id + ' roof']));

  // ---------- hut (all the game's huts are the same build) ----------
  ZAssets.register('village', 'village_hut', 'Thatched mud hut', () => {
    const g = new T.Group(), wm = winMat(), rnd = seeded(97);
    add(new T.CylinderGeometry(3, 3.1, 2.6, 18), gm(0xb08055, { roughness: 1 }), 0, 1.3, 0, g);
    add(jitter(new T.ConeGeometry(4, 3, 14, 2), 0.12, rnd), gm(0xd4a24c, { roughness: 1, flatShading: true }), 0, 4.0, 0, g);
    flat(add(new T.BoxGeometry(1.1, 1.9, 0.2), gm(0x3b2a1a), 0, 0.95, 2.95, g));
    flat(add(new T.PlaneGeometry(0.7, 0.6), wm, 1.8, 1.6, 2.45, g)).rotation.y = 0.6;
    return switchable(g, [wm], 0.05, 2.6);
  }, ['hut', 'thatched hut', 'mud hut', 'village', 'cottage']);

  // ---------- picket fence piece ----------
  ZAssets.register('village', 'village_picket_fence', 'Picket fence (3.6 m)', () => {
    const g = new T.Group(), white = gm(0xf8f9fa), pk = new T.BoxGeometry(0.1, 0.7, 0.1);
    for (let k = 0; k < 5; k++) add(pk, white, -1.8 + k * 0.9, 0.35, 0, g);
    return { group: g };
  }, ['fence', 'picket fence', 'village']);

  // ---------- dirt lane segment with its lamps (game lines 946–947, 1069) ----------
  ZAssets.register('village', 'village_lane', 'Village dirt lane with lamps', () => {
    const g = new T.Group(), N = [];
    const t = tex((c, w, h) => { c.fillStyle = '#c8b48a'; c.fillRect(0, 0, w, h); const r = seeded(5); for (let k = 0; k < 500; k++) { c.fillStyle = k % 2 ? 'rgba(120,95,60,0.18)' : 'rgba(255,240,210,0.2)'; c.beginPath(); c.arc(r() * w, r() * h, 1 + r() * 4, 0, 7); c.fill(); } }, 512, 512);
    add(new T.BoxGeometry(19, 0.03, 8), new T.MeshStandardMaterial({ map: t, roughness: 1 }), 0, 0.015, 0, g);
    const iron = gm(0x2b2f3a, { metalness: 0.5, roughness: 0.5 });
    for (const z of [-5.2, 5.2]) {
      add(new T.CylinderGeometry(0.08, 0.12, 3.6, 8), iron, 0, 1.8, z, g); add(new T.CylinderGeometry(0.22, 0.26, 0.2, 8), iron, 0, 0.1, z, g); add(new T.CylinderGeometry(0.16, 0.08, 0.22, 8), iron, 0, 3.52, z, g);
      const hm = new T.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffd08a, emissiveIntensity: 0.15 }); N.push(hm);
      flat(add(new T.SphereGeometry(0.28, 14, 10), hm, 0, 3.78, z, g));
    }
    return switchable(g, N, 0.15, 3);
  }, ['lane', 'village lane', 'dirt road', 'path']);
})();
