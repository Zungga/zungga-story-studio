/* Zungga Chocolate Factory — The Amazing Living Machines (machine sheet): ten cheerful machines with faces that blink,
 * look around and smile while they work. Registered as library props (cfl_…) so stories can use them too.
 *   cookie oven · chocolate mixer · candy machine · marshmallow fluffer · conveyor belt · chocolate fountain ·
 *   packing machine · cookie printer · ingredient elevator · (+ ZFactory.faceOn(obj) puts a face on the vault door) */
(() => {
  'use strict';
  const T = THREE, { mat, mesh, roundBox, tex } = ZA;
  const P = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.45, ...o });
  const brass = () => P(0xc8952f, { metalness: 0.75, roughness: 0.3 }), copper = () => P(0xc06a3a, { metalness: 0.7, roughness: 0.3 }), purple = () => P(0x6d28d9, { roughness: 0.4 }), dark = () => P(0x2a1b10);
  const box = (g, w, h, d, m, x, y, z, r = 0.04) => mesh(roundBox(w, h, d, r), m, g, x, y, z);
  const cyl = (g, rt, rb, h, m, x, y, z, seg = 28) => mesh(new T.CylinderGeometry(rt, rb, h, seg), m, g, x, y, z);
  const sph = (g, r, m, x, y, z, seg = 24) => mesh(new T.SphereGeometry(r, seg, Math.round(seg * 0.75)), m, g, x, y, z);
  // pipes: a tube along points
  const pipe = (g, pts, r = 0.05, m = brass()) => { const c = new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(...p))); const me = new T.Mesh(new T.TubeGeometry(c, 24, r, 10), m); me.castShadow = true; g.add(me); return me; };
  // ---------- a face: two big eyes (blink + look around) and a smile ----------
  function face(g, { x = 0, y = 1, z = 0.5, s = 1, lid = 0x6d28d9, ry = 0 }) {
    const f = new T.Group(); f.position.set(x, y, z); f.rotation.y = ry; f.scale.setScalar(s); f.userData.dynamic = true; g.add(f);
    const eyes = [-1, 1].map((sd) => {
      const e = new T.Group(); e.position.set(sd * 0.16, 0, 0); f.add(e);
      const w = mesh(new T.SphereGeometry(0.12, 24, 18), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.15, clearcoat: 1 }), e); w.scale.set(1, 1.15, 0.6);
      const look = new T.Group(); e.add(look);
      const ir = mesh(new T.SphereGeometry(0.075, 20, 14), P(0x3b2416, { roughness: 0.2 }), look, 0, -0.01, 0.055); ir.scale.set(1, 1.1, 0.5);
      const pu = mesh(new T.SphereGeometry(0.045, 16, 12), new T.MeshBasicMaterial({ color: 0x0b0705 }), look, 0, -0.01, 0.075); pu.scale.set(1, 1.1, 0.5);
      mesh(new T.SphereGeometry(0.022, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff }), look, -0.025, 0.03, 0.098);
      const lidG = new T.Group(); e.add(lidG); const L = mesh(new T.SphereGeometry(0.128, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), P(lid, { roughness: 0.5 }), lidG); L.scale.set(1, 1.15, 0.66); lidG.rotation.x = -1.65;
      return { look, lidG };
    });
    const m = mesh(new T.TorusGeometry(0.11, 0.022, 10, 24, Math.PI), P(0x5a1e1a), f, 0, -0.2, 0.03); m.rotation.z = Math.PI;
    for (const sd of [-1, 1]) { const b = mesh(new T.CircleGeometry(0.045, 16), new T.MeshBasicMaterial({ color: 0xff8fa3, transparent: true, opacity: 0.6, depthWrite: false }), f, sd * 0.27, -0.13, 0.04); b.castShadow = false; }
    const seed = Math.random() * 10;
    return (t) => { const tt = t + seed, bp = (tt % 3.6) / 3.6, bl = bp > 0.95 ? Math.sin((bp - 0.95) / 0.05 * Math.PI) : 0; for (const e of eyes) { e.lidG.rotation.x = -1.65 + bl * 1.6; e.look.position.set(Math.sin(tt * 0.5) * 0.025, Math.sin(tt * 0.37) * 0.015, 0); } m.scale.y = 1 + Math.sin(tt * 2) * 0.08; };
  }
  const reg = (id, label, fn, tags) => { if (!ZAssets.has(id)) ZAssets.register('factory', id, label, fn, ['living', 'machine', ...tags]); };

  // 1 · cookie oven: purple body, brass pipes, glowing mouth, cookies rolling out on a little belt
  reg('cfl_cookie_oven', 'Living cookie oven', () => {
    const g = new T.Group(); box(g, 1.6, 1.4, 1.1, purple(), 0, 0.8, 0, 0.18); box(g, 1.7, 0.12, 1.2, brass(), 0, 0.1, 0);
    const mouth = mesh(new T.CircleGeometry(0.42, 32, 0, Math.PI), P(0xff9a3c, { emissive: 0xff7a1a, emissiveIntensity: 1.4 }), g, 0, 0.42, 0.56); mesh(new T.TorusGeometry(0.44, 0.05, 10, 32, Math.PI), brass(), g, 0, 0.42, 0.56); void mouth;
    pipe(g, [[-0.7, 1.4, -0.3], [-0.7, 1.9, -0.3], [-0.2, 2.0, -0.3], [-0.2, 1.5, -0.3]], 0.06); pipe(g, [[0.75, 0.4, 0], [0.95, 0.6, 0], [0.95, 1.3, 0], [0.7, 1.4, 0]], 0.05);
    cyl(g, 0.12, 0.12, 0.05, P(0xffffff), 0.6, 1.25, 0.56).rotation.x = Math.PI / 2;
    const belt = box(g, 0.9, 0.06, 0.6, dark(), 0, 0.18, 0.9, 0.02); void belt; const cookies = []; for (let i = 0; i < 4; i++) { const ck = cyl(g, 0.08, 0.08, 0.025, P(0xd9a05b), 0, 0.23, 0.6 + i * 0.15, 16); cookies.push(ck); }
    const ft = face(g, { y: 1.12, z: 0.56, s: 1.15, lid: 0x5b21b6 });
    g.userData.tick = (t) => { ft(t); cookies.forEach((c, i) => { c.position.z = 0.62 + ((t * 0.18 + i * 0.15) % 0.6); }); g.children[2].material.emissiveIntensity = 1.2 + Math.sin(t * 6) * 0.25; };
    return { group: g };
  }, ['oven', 'bakery', 'cookies']);
  // 2 · chocolate mixer: copper pot of swirling chocolate with a stirring paddle
  reg('cfl_choco_mixer', 'Living chocolate mixer', () => {
    const g = new T.Group(); cyl(g, 0.75, 0.6, 1.0, copper(), 0, 0.55, 0, 40); mesh(new T.TorusGeometry(0.76, 0.05, 10, 40), brass(), g, 0, 1.05, 0).rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) { const lg = cyl(g, 0.05, 0.07, 0.3, brass(), Math.cos(i * 2.1) * 0.5, 0.12, Math.sin(i * 2.1) * 0.5); void lg; }
    const swirl = tex((c, w, h) => { c.fillStyle = '#5b3420'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a5a3a'; c.lineWidth = 10; c.beginPath(); for (let a = 0; a < 18; a += 0.1) { const r = a * 7; c.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); } c.stroke(); }, 256, 256);
    const top = mesh(new T.CircleGeometry(0.72, 40), new T.MeshStandardMaterial({ map: swirl, roughness: 0.25 }), g, 0, 1.0, 0); top.rotation.x = -Math.PI / 2;
    const paddle = new T.Group(); paddle.position.set(0, 1.0, 0); g.add(paddle); cyl(paddle, 0.03, 0.03, 0.9, brass(), 0.25, 0.25, 0); box(paddle, 0.06, 0.3, 0.2, brass(), 0.25, -0.15, 0, 0.02);
    pipe(g, [[0.6, 1.3, -0.3], [0.9, 1.7, -0.3], [0.2, 1.9, -0.2], [0.1, 1.4, 0]], 0.05);
    const gauge = cyl(g, 0.12, 0.12, 0.04, P(0xf8fafc), 0.7, 0.85, 0.35); gauge.rotation.set(Math.PI / 2, 0, 0.6);
    const ft = face(g, { y: 0.6, z: 0.66, s: 1.0, lid: 0x9a4a22 });
    g.userData.tick = (t) => { ft(t); top.rotation.z = t * 0.8; paddle.rotation.y = t * 1.2; };
    return { group: g };
  }, ['mixer', 'chocolate', 'kitchen', 'vat']);
  // 3 · candy machine: pink body, glass dome of candies, striped awning, a tray of candy
  reg('cfl_candy_machine', 'Living candy machine', () => {
    const g = new T.Group(); box(g, 1.3, 1.2, 1.0, P(0xec4899), 0, 0.65, 0, 0.14); box(g, 1.4, 0.1, 1.1, brass(), 0, 0.08, 0);
    const dome = sph(g, 0.5, new T.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.05 }), 0, 1.3, 0, 32); dome.scale.y = 0.85;
    const C = [0xef4444, 0xfacc15, 0x22c55e, 0x3b82f6, 0xa855f7, 0xfb923c]; const balls = []; for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 0.12 + (i % 5) * 0.06; balls.push(sph(g, 0.06, P(C[i % 6], { roughness: 0.25 }), Math.cos(a) * r, 1.12 + (i % 4) * 0.07, Math.sin(a) * r * 0.8, 12)); }
    const awn = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 1.2, 16, 1, true, 0, Math.PI), new T.MeshStandardMaterial({ map: tex((c, w, h) => { for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#ec4899'; c.fillRect(i * w / 10, 0, w / 10, h); } }, 256, 32), side: T.DoubleSide })); awn.rotation.set(0, 0, Math.PI / 2); awn.position.set(0, 1.2, 0.55); g.add(awn);
    box(g, 0.9, 0.08, 0.4, brass(), 0, 0.25, 0.65, 0.02); for (let i = 0; i < 8; i++) box(g, 0.08, 0.06, 0.08, P(C[i % 6]), -0.32 + i * 0.09, 0.32, 0.65, 0.02);
    const ft = face(g, { y: 0.75, z: 0.51, s: 1.0, lid: 0xbe185d });
    g.userData.tick = (t) => { ft(t); balls.forEach((b, i) => { b.position.y = 1.12 + (i % 4) * 0.07 + Math.abs(Math.sin(t * 4 + i)) * 0.04; }); };
    return { group: g };
  }, ['candy', 'lab', 'machine']);
  // 4 · marshmallow fluffer: purple + brass base, glass globe of puffing marshmallows, a spout
  reg('cfl_marshmallow_fluffer', 'Living marshmallow fluffer', () => {
    const g = new T.Group(); cyl(g, 0.55, 0.65, 0.7, purple(), 0, 0.35, 0, 32); mesh(new T.TorusGeometry(0.58, 0.05, 10, 32), brass(), g, 0, 0.72, 0).rotation.x = Math.PI / 2;
    const globe = sph(g, 0.6, new T.MeshPhysicalMaterial({ color: 0xfff0f6, transparent: true, opacity: 0.35, roughness: 0.05 }), 0, 1.3, 0, 32);
    const puffs = []; for (let i = 0; i < 14; i++) { const a = i * 2.1, r = 0.1 + (i % 4) * 0.1; const pf = sph(g, 0.13, new T.MeshPhysicalMaterial({ color: i % 3 ? 0xfdf6f0 : 0xf9c8dc, roughness: 0.7, sheen: 1 }), Math.cos(a) * r, 1.05 + (i % 3) * 0.17, Math.sin(a) * r, 16); puffs.push(pf); }
    const sp = cyl(g, 0.12, 0.16, 0.4, brass(), 0.55, 0.45, 0.35); sp.rotation.z = -1.1; box(g, 0.35, 0.05, 0.3, P(0xf9a8d4), 0.85, 0.2, 0.45, 0.02);
    pipe(g, [[-0.5, 0.6, -0.3], [-0.8, 1.2, -0.3], [-0.45, 1.85, -0.1]], 0.05);
    const ft = face(g, { y: 1.3, z: 0.6, s: 1.0, lid: 0xf9a8d4 }); void globe;
    g.userData.tick = (t) => { ft(t); puffs.forEach((p, i) => p.scale.setScalar(1 + Math.sin(t * 2.5 + i) * 0.12)); };
    return { group: g };
  }, ['marshmallow', 'fluffer']);
  // 5 · conveyor belt: purple side panel with a face, rollers, chocolate blocks gliding along
  reg('cfl_conveyor', 'Living conveyor belt', () => {
    const g = new T.Group(); const L = 3.2;
    for (const sd of [-1, 1]) box(g, L, 0.35, 0.1, purple(), 0, 0.75, sd * 0.4, 0.04);
    box(g, L, 0.06, 0.75, dark(), 0, 0.85, 0, 0.02); for (let i = -3; i <= 3; i++) { cyl(g, 0.06, 0.06, 0.8, brass(), i * 0.5, 0.82, 0).rotation.x = Math.PI / 2; }
    for (const x of [-L / 2 + 0.2, L / 2 - 0.2]) for (const sd of [-1, 1]) box(g, 0.1, 0.7, 0.1, brass(), x, 0.35, sd * 0.38, 0.02);
    const blocks = []; for (let i = 0; i < 6; i++) blocks.push(box(g, 0.32, 0.14, 0.32, P(0x5b3420, { roughness: 0.3 }), 0, 0.95, 0, 0.03));
    const ft = face(g, { x: -0.6, y: 0.72, z: 0.46, s: 0.75, lid: 0x5b21b6 });
    g.userData.tick = (t) => { ft(t); blocks.forEach((b, i) => { b.position.x = -L / 2 + 0.25 + ((t * 0.35 + i * L / 6) % (L - 0.5)); }); };
    return { group: g };
  }, ['conveyor', 'belt', 'chocolate']);
  // 6 · chocolate fountain: tiers of flowing chocolate, purple + gold base with jewels, a happy face on the bowl
  reg('cfl_choco_fountain', 'Living chocolate fountain', () => {
    const g = new T.Group(); cyl(g, 0.9, 1.0, 0.3, purple(), 0, 0.15, 0, 40); mesh(new T.TorusGeometry(0.95, 0.05, 10, 40), brass(), g, 0, 0.3, 0).rotation.x = Math.PI / 2;
    for (let i = 0; i < 8; i++) sph(g, 0.06, P([0xa855f7, 0xec4899, 0x22d3ee][i % 3], { roughness: 0.15, metalness: 0.3 }), Math.cos(i * 0.785) * 0.98, 0.18, Math.sin(i * 0.785) * 0.98, 12);
    const choc = P(0x6b3a1f, { roughness: 0.2 }); const bowl = cyl(g, 0.8, 0.5, 0.5, choc, 0, 0.55, 0, 40); void bowl;
    cyl(g, 0.12, 0.14, 0.9, brass(), 0, 0.9, 0); cyl(g, 0.5, 0.3, 0.25, choc, 0, 1.3, 0, 32); cyl(g, 0.28, 0.18, 0.2, choc, 0, 1.6, 0, 24); sph(g, 0.14, brass(), 0, 1.82, 0);
    const curtain = new T.Mesh(new T.CylinderGeometry(0.5, 0.75, 0.55, 32, 1, true), new T.MeshStandardMaterial({ color: 0x7a4426, roughness: 0.2, transparent: true, opacity: 0.85, side: T.DoubleSide })); curtain.position.y = 1.0; g.add(curtain);
    const ft = face(g, { y: 0.6, z: 0.72, s: 1.0, lid: 0x5b3420 });
    g.userData.tick = (t) => { ft(t); curtain.rotation.y = t * 0.6; curtain.scale.set(1 + Math.sin(t * 4) * 0.02, 1, 1 + Math.cos(t * 4) * 0.02); };
    return { group: g };
  }, ['fountain', 'chocolate']);
  // 7 · packing machine: brass box with a ribbon bow on top, gift boxes riding out on a belt
  reg('cfl_packing_machine', 'Living packing machine', () => {
    const g = new T.Group(); box(g, 1.4, 1.3, 1.0, P(0x8a6a3a, { metalness: 0.4, roughness: 0.4 }), 0, 0.75, 0, 0.12); box(g, 1.5, 0.1, 1.1, brass(), 0, 0.08, 0);
    for (const sd of [-1, 1]) { const lp = sph(g, 0.16, P(0xfacc15), sd * 0.16, 1.5, 0, 16); lp.scale.set(1.3, 0.7, 0.5); } sph(g, 0.07, P(0xf59e0b), 0, 1.5, 0, 12);
    box(g, 1.0, 0.06, 0.5, dark(), 0.9, 0.35, 0.2, 0.02); const gifts = []; for (let i = 0; i < 3; i++) { const gb = new T.Group(); box(gb, 0.22, 0.18, 0.22, P(0xf8e7b8), 0, 0.09, 0, 0.02); box(gb, 0.23, 0.185, 0.04, P(0xfacc15), 0, 0.09, 0, 0.005); gb.position.set(0, 0.38, 0.2); g.add(gb); gifts.push(gb); }
    const ft = face(g, { y: 0.85, z: 0.51, s: 1.0, lid: 0x6b4423 });
    g.userData.tick = (t) => { ft(t); gifts.forEach((b, i) => { b.position.x = 0.5 + ((t * 0.2 + i * 0.3) % 0.9); }); };
    return { group: g };
  }, ['packing', 'gifts', 'boxes']);
  // 8 · cookie printer: teal body with a chef hat, printing Z cookies onto a belt
  reg('cfl_cookie_printer', 'Living cookie printer', () => {
    const g = new T.Group(); box(g, 1.4, 1.0, 0.9, P(0x0f766e), 0, 0.85, 0, 0.12); box(g, 1.6, 0.1, 1.0, brass(), 0, 0.3, 0);
    const hat = new T.Group(); hat.position.set(0, 1.35, 0); g.add(hat); cyl(hat, 0.25, 0.25, 0.2, P(0xffffff), 0, 0.1, 0); for (let i = 0; i < 5; i++) sph(hat, 0.14, P(0xffffff), Math.cos(i * 1.26) * 0.13, 0.3, Math.sin(i * 1.26) * 0.13, 14);
    box(g, 1.2, 0.05, 0.6, dark(), 0, 0.4, 0.62, 0.02); const zT = tex((c, w, h) => { c.fillStyle = '#d9a05b'; c.beginPath(); c.arc(w / 2, h / 2, w * 0.46, 0, 6.3); c.fill(); c.fillStyle = '#7c3aed'; c.font = `900 ${h * 0.6}px Arial Black`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Z', w / 2, h * 0.54); }, 128, 128);
    const cookies = []; for (let i = 0; i < 4; i++) { const ck = mesh(new T.CircleGeometry(0.1, 24), new T.MeshStandardMaterial({ map: zT }), g, 0, 0.44, 0.62); ck.rotation.x = -Math.PI / 2; cookies.push(ck); }
    const ft = face(g, { y: 0.9, z: 0.46, s: 0.95, lid: 0x115e59 });
    g.userData.tick = (t) => { ft(t); cookies.forEach((c, i) => { c.position.x = -0.5 + ((t * 0.25 + i * 0.3) % 1.1); }); hat.rotation.z = Math.sin(t * 2) * 0.05; };
    return { group: g };
  }, ['cookie', 'printer', 'bakery']);
  // 9 · ingredient elevator: tall cabinet with shelves of bowls moving up and down, face at the top
  reg('cfl_ingredient_elevator', 'Living ingredient elevator', () => {
    const g = new T.Group(); const H = 2.4; for (const sd of [-1, 1]) box(g, 0.12, H, 0.8, P(0x1e3a8a), sd * 0.55, H / 2, 0, 0.04); box(g, 1.2, 0.15, 0.85, P(0x1e3a8a), 0, H, 0, 0.05); box(g, 1.25, 0.12, 0.9, brass(), 0, 0.06, 0);
    const shelves = []; for (let i = 0; i < 3; i++) { const sh = new T.Group(); g.add(sh); box(sh, 1.0, 0.04, 0.7, brass(), 0, 0, 0, 0.01); const bowl = cyl(sh, 0.18, 0.12, 0.12, P(0xd1d5db, { metalness: 0.5 }), 0, 0.08, 0, 20); void bowl; sph(sh, 0.12, P([0xf5e6c8, 0x7a4426, 0xfde68a][i], { roughness: 0.9 }), 0, 0.13, 0, 14).scale.y = 0.5; shelves.push(sh); }
    pipe(g, [[0.62, 0.3, -0.3], [0.85, 1.2, -0.3], [0.62, 2.2, -0.3]], 0.05);
    const ft = face(g, { y: H - 0.3, z: 0.42, s: 0.9, lid: 0x1e3a8a });
    g.userData.tick = (t) => { ft(t); shelves.forEach((s, i) => { s.position.y = 0.3 + ((t * 0.25 + i * 0.6) % 1.8); }); };
    return { group: g };
  }, ['elevator', 'ingredients', 'warehouse']);

  // a face on something that already exists (the round vault door); returns the tick
  ZFactory.faceOn = (obj, o) => face(obj, o);
})();
