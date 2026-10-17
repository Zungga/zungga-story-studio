/*
 * Zungga Story Studio — "people" props: the low-poly islanders from the Drive-My-Portfolio game
 * (drive-portfolio/js/game.js, makeHuman / poseHuman / sitHuman, addBot, race runners, kite flyers).
 * These are BACKGROUND EXTRAS (crowds, sellers behind stalls, kids in a park). The story cast uses separate characters.
 * Every islander faces +z, feet on y = 0. setOn(true) = waves hello (the game's greeting wave).
 */
(() => {
  'use strict';
  const { T, mat, mesh, tex, fitText, FONT } = ZA;

  // ---- palettes copied from the game (game.js 1807–1810) ----
  const SHIRTS = [0xe03131, 0x1971c2, 0x2f9e44, 0xf59f00, 0x9c36b5, 0x0ca678, 0xf06595, 0xf8f9fa, 0x495057, 0xfab005, 0x3b5bdb, 0xd9480f];
  const PANTS = [0x1f2937, 0x364fc7, 0x5c3d2e, 0x495057, 0x212529, 0x8d6e63, 0xdee2e6];
  const SKINS = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac, 0xa86b3c];
  const HAIRS = [0x1b1b1b, 0x3b2a1a, 0x6b4423, 0x2c2c2c, 0xd9b26f, 0x9ca3af];
  const HATS = [0xf1e3c6, 0x343a40, 0xc92a2a];
  const ADULT = 0.92, KID = 0.6;   // game body is ~1.87 m tall → 1.72 m adult, ~1.12 m kid

  function add(geo, m, x, y, z, parent, shadow = true) { const me = mesh(geo, m, parent, x, y, z); me.castShadow = shadow; return me; }
  const cm = (c) => (c && c.isMaterial ? c : mat(c, { roughness: 0.75 }));

  // ---- makeHuman (game.js 1486–1509), faithful ----
  function makeHuman(o) {
    const HG = {
      torso: new T.BoxGeometry(0.42, 0.58, 0.24), head: new T.SphereGeometry(0.14, 14, 10),
      hair: new T.SphereGeometry(0.15, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), neck: new T.CylinderGeometry(0.05, 0.06, 0.1, 8),
      leg: new T.BoxGeometry(0.15, 0.86, 0.17).translate(0, -0.43, 0), shoe: new T.BoxGeometry(0.16, 0.08, 0.27),
      arm: new T.BoxGeometry(0.1, 0.58, 0.11).translate(0, -0.29, 0), hand: new T.SphereGeometry(0.06, 8, 6),
      dress: new T.CylinderGeometry(0.22, 0.38, 0.62, 12), hat: new T.CylinderGeometry(0.17, 0.19, 0.13, 14),
      brim: new T.CylinderGeometry(0.29, 0.29, 0.02, 16), helmet: new T.SphereGeometry(0.2, 16, 12),
    };
    const g = new T.Group();
    const legs = [-0.1, 0.1].map((x) => { const p = new T.Group(); p.position.set(x, 0.92, 0); g.add(p); add(HG.leg, cm(o.pants), 0, 0, 0, p); add(HG.shoe, cm(0x22222a), 0, -0.88, 0.04, p, false); return p; });
    if (o.dress) add(HG.dress, cm(o.shirt), 0, 0.68, 0, g);
    const upper = new T.Group(); upper.position.y = 0.92; g.add(upper);
    add(HG.torso, cm(o.shirt), 0, 0.3, 0, upper);
    add(HG.neck, cm(o.skin), 0, 0.64, 0, upper, false);
    add(HG.head, cm(o.skin), 0, 0.78, 0, upper);
    if (o.helmet) add(HG.helmet, cm(o.helmet), 0, 0.8, 0, upper); else add(HG.hair, cm(o.hair), 0, 0.8, -0.012, upper, false);
    if (o.hat) { add(HG.hat, cm(o.hat), 0, 0.95, 0, upper, false); add(HG.brim, cm(o.hat), 0, 0.89, 0, upper, false); }
    const arms = [-0.27, 0.27].map((x) => { const p = new T.Group(); p.position.set(x, 0.56, 0); upper.add(p); add(HG.arm, cm(o.shirt), 0, 0, 0, p, false); add(HG.hand, cm(o.skin), 0, -0.62, 0, p, false); return p; });
    return { g, legL: legs[0], legR: legs[1], armL: arms[0], armR: arms[1], upper };
  }
  function poseHuman(h, phase, amp) {   // game.js 1510–1514
    const s = Math.sin(phase) * amp;
    h.legL.rotation.x = s; h.legR.rotation.x = -s; h.armL.rotation.x = -s * 0.9; h.armR.rotation.x = s * 0.9;
    h.armL.rotation.z = h.armR.rotation.z = 0; h.upper.rotation.x = amp * 0.12;
  }
  function sitHuman(h) { h.legL.rotation.x = h.legR.rotation.x = -1.45; h.armL.rotation.x = h.armR.rotation.x = -0.35; h.armL.rotation.z = h.armR.rotation.z = 0; h.upper.rotation.x = -0.05; }

  // a person prop: scale, a pose per frame (pure in t), and the game's greeting wave as setOn
  function person(look, { scale = ADULT, pose = null, extra = null } = {}) {
    const group = new T.Group(), h = makeHuman(look);
    h.g.scale.setScalar(scale); group.add(h.g);
    let waving = false;
    const tick = (t) => {
      if (pose) pose(h, t); else poseHuman(h, 0, 0);
      if (waving) { h.armR.rotation.x = -2.7; h.armR.rotation.z = -0.3 + Math.sin(t * 14) * 0.35; }   // game.js 1874
      if (extra) extra(t);
    };
    group.userData.tick = tick;
    group.userData.setOn = (on) => { waving = !!on; };
    group.userData.human = h;
    tick(0);
    return { group, h };
  }
  const sellerPose = (h, t) => { poseHuman(h, 0, 0); h.armL.rotation.x = -0.5 + Math.sin(t * 1.3) * 0.2; h.armR.rotation.x = -0.5 - Math.sin(t * 1.1) * 0.2; };   // game.js 1872
  const walkPose = (rate, amp = 0.55) => (h, t) => poseHuman(h, t * rate + 1.2, amp);   // +1.2: mid-stride at t = 0

  // ---- sellers: one per Market Street stall (game.js 883–889 names; looks are the game's random picks, seeded per stall) ----
  const hashStr = (str) => { let v = 7; for (const ch of str) v = (v * 31 + ch.charCodeAt(0)) >>> 0; return v; };   // game.js 1735
  function seededLook(name) {
    let s = (hashStr(name) % 2147483646) + 1; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 3; k++) rnd();
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    return { shirt: pick(SHIRTS), pants: pick(PANTS), skin: pick(SKINS), hair: pick(HAIRS), dress: rnd() < 0.3, hat: rnd() < 0.15 ? pick(HATS) : 0 };
  }
  const STALLS = ['MASALA DOSA', 'CHAI', 'FRESH FRUITS', 'SPICES', 'ICE CREAM', 'JUICE', 'BIRYANI', 'BOOKS', 'TOYS', 'FLOWERS', 'PANI PURI', 'FILTER COFFEE', 'BAKERY', 'CRAFTS', 'CLOTHES'];
  const STALL_WORDS = { 'MASALA DOSA': ['dosa seller', 'dosa wala'], CHAI: ['chai wala', 'chaiwala', 'tea seller'], 'FRESH FRUITS': ['fruit seller', 'fruit wala'], SPICES: ['spice seller'], 'ICE CREAM': ['ice cream seller', 'kulfi wala'], JUICE: ['juice seller', 'juice wala'], BIRYANI: ['biryani seller'], BOOKS: ['book seller', 'bookseller'], TOYS: ['toy seller'], FLOWERS: ['flower seller', 'flower girl', 'garland seller'], 'PANI PURI': ['pani puri wala', 'golgappa'], 'FILTER COFFEE': ['coffee seller'], BAKERY: ['baker'], CRAFTS: ['potter', 'craft seller'], CLOTHES: ['cloth seller', 'tailor'] };
  const SELLERS = [];
  for (const name of STALLS) {
    const id = 'islander_seller_' + name.toLowerCase().replace(/[^a-z]+/g, '_');
    const label = name.charAt(0) + name.slice(1).toLowerCase();
    SELLERS.push({ id, name, words: STALL_WORDS[name] });
    ZAssets.register('people', id, `${label} seller (island extra)`, () => person(seededLook(name), { pose: sellerPose }), ['islander', 'extra', 'seller', 'vendor', 'market', name.toLowerCase()]);
  }

  // ---- islanders out and about (addBot looks, game.js 1819–1828): fixed picks covering every look the game can roll ----
  const ADULTS = [
    ['islander_1', 'Islander — red shirt', { shirt: 0xe03131, pants: 0x1f2937, skin: 0xc68642, hair: 0x1b1b1b }],
    ['islander_2', 'Islander — pink dress', { shirt: 0xf06595, pants: 0x212529, skin: 0xe0ac69, hair: 0x3b2a1a, dress: true }],
    ['islander_3', 'Islander — straw hat', { shirt: 0x2f9e44, pants: 0x5c3d2e, skin: 0x8d5524, hair: 0x2c2c2c, hat: 0xf1e3c6 }],
    ['islander_4', 'Islander — blue shirt', { shirt: 0x1971c2, pants: 0xdee2e6, skin: 0xffdbac, hair: 0xd9b26f }],
    ['islander_5', 'Islander — elder, grey hair', { shirt: 0xf8f9fa, pants: 0x8d6e63, skin: 0xa86b3c, hair: 0x9ca3af }],
    ['islander_6', 'Islander — purple dress, black hat', { shirt: 0x9c36b5, pants: 0x1f2937, skin: 0xf1c27d, hair: 0x6b4423, dress: true, hat: 0x343a40 }],
    ['islander_7', 'Islander — orange shirt, red hat', { shirt: 0xd9480f, pants: 0x364fc7, skin: 0xe0ac69, hair: 0x1b1b1b, hat: 0xc92a2a }],
    ['islander_8', 'Islander — teal dress', { shirt: 0x0ca678, pants: 0x495057, skin: 0xc68642, hair: 0x2c2c2c, dress: true }],
    ['islander_9', 'Islander — grey shirt', { shirt: 0x495057, pants: 0x212529, skin: 0x8d5524, hair: 0x3b2a1a }],
    ['islander_10', 'Islander — yellow dress', { shirt: 0xfab005, pants: 0x5c3d2e, skin: 0xffdbac, hair: 0x6b4423, dress: true }],
  ];
  for (const [id, label, look] of ADULTS) ZAssets.register('people', id, label + ' (island extra)', () => person(look), ['islander', 'extra', 'crowd', 'person', look.dress ? 'woman' : 'man']);

  const KIDS = [
    ['islander_kid_1', 'Island kid — boy, blue tee', { shirt: 0x3b5bdb, pants: 0x212529, skin: 0xc68642, hair: 0x1b1b1b }],
    ['islander_kid_2', 'Island kid — girl, pink dress', { shirt: 0xf06595, pants: 0x1f2937, skin: 0xe0ac69, hair: 0x3b2a1a, dress: true }],
    ['islander_kid_3', 'Island kid — boy, orange tee', { shirt: 0xf59f00, pants: 0x364fc7, skin: 0x8d5524, hair: 0x2c2c2c }],
    ['islander_kid_4', 'Island kid — girl, green dress', { shirt: 0x2f9e44, pants: 0x495057, skin: 0xf1c27d, hair: 0x6b4423, dress: true }],
  ];
  for (const [id, label, look] of KIDS) ZAssets.register('people', id, label + ' (island extra)', () => person(look, { scale: KID }), ['islander', 'extra', 'kid', 'child', 'crowd']);

  // ---- poses ----
  ZAssets.register('people', 'islander_walking', 'Islander walking (island extra)', () => person({ shirt: 0x1971c2, pants: 0x1f2937, skin: 0xc68642, hair: 0x1b1b1b }, { pose: walkPose(1.4 * 3.4) }), ['islander', 'extra', 'walk', 'crowd']);
  ZAssets.register('people', 'islander_walking_woman', 'Islander walking, dress (island extra)', () => person({ shirt: 0xf06595, pants: 0x212529, skin: 0xe0ac69, hair: 0x3b2a1a, dress: true }, { pose: walkPose(1.3 * 3.4) }), ['islander', 'extra', 'walk', 'crowd']);
  ZAssets.register('people', 'islander_kid_walking', 'Island kid walking (island extra)', () => person({ shirt: 0xf59f00, pants: 0x364fc7, skin: 0x8d5524, hair: 0x2c2c2c }, { scale: KID, pose: walkPose(2.5 * 3.4) }), ['islander', 'extra', 'kid', 'walk']);
  ZAssets.register('people', 'islander_sitting', 'Islander sitting — hips at bench height 0.48 m (island extra)', () => {
    const r = person({ shirt: 0x2f9e44, pants: 0x5c3d2e, skin: 0xa86b3c, hair: 0x2c2c2c }, { pose: (h) => sitHuman(h) });
    r.h.g.position.y = -0.4 * ADULT;   // game seats people on benches at y = −0.4 (game.js 1833)
    return r;
  }, ['islander', 'extra', 'sit', 'bench']);
  ZAssets.register('people', 'islander_sitting_woman', 'Islander sitting, dress — hips at 0.48 m (island extra)', () => {
    const r = person({ shirt: 0x9c36b5, pants: 0x1f2937, skin: 0xf1c27d, hair: 0x6b4423, dress: true }, { pose: (h) => sitHuman(h) });
    r.h.g.position.y = -0.4 * ADULT; return r;
  }, ['islander', 'extra', 'sit', 'bench']);
  ZAssets.register('people', 'islander_lying', 'Islander lying on the ground (island extra)', () => {   // the game's lie-down pose (game.js 2081)
    const r = person({ shirt: 0x5b5cf6, pants: 0x2b3a55, skin: 0xc68642, hair: 0x1b1b1b }, { pose: (h) => { poseHuman(h, 0, 0); h.armL.rotation.z = 0.12; h.armR.rotation.z = -0.12; } });
    r.h.g.rotation.set(-Math.PI / 2, 0, 0); r.h.g.position.set(0, 0.13, -0.85);
    return r;
  }, ['islander', 'extra', 'lie', 'rest', 'sleep']);
  ZAssets.register('people', 'islander_player', 'The game player on foot — violet shirt (island extra)', () => person({ shirt: 0x5b5cf6, pants: 0x2b3a55, skin: 0xc68642, hair: 0x1b1b1b }), ['islander', 'extra', 'player']);

  // ---- race runners: Arjun, Meera, Kabir, Priya with their number tags (game.js 2422–2433), running in place ----
  const RUNNERS = [['Arjun', 0xe03131], ['Meera', 0x1c7ed6], ['Kabir', 0xf59f00], ['Priya', 0x0ca678]];
  RUNNERS.forEach(([name, shirt], i) => {
    ZAssets.register('people', 'islander_runner_' + name.toLowerCase(), `Race runner ${i + 1} · ${name} (island extra)`, () => {
      const r = person({ shirt, pants: 0x212529, skin: SKINS[(i * 2 + 1) % SKINS.length], hair: HAIRS[i % HAIRS.length], dress: i % 2 === 1 }, { pose: walkPose(5.6 * 2.6 + i * 0.3, 0.95) });
      const col = '#' + shirt.toString(16).padStart(6, '0');
      const t = tex((g, W, H) => { g.fillStyle = col; g.beginPath(); g.roundRect(4, 4, W - 8, H - 8, 26); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; fitText(g, `${i + 1} · ${name}`, W - 40, 72, 800); g.fillText(`${i + 1} · ${name}`, W / 2, H / 2 + 3); }, 512, 128);
      const tag = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
      tag.position.y = 2.25; tag.scale.set(1.5, 0.38, 1); r.h.g.add(tag);
      return r;
    }, ['islander', 'extra', 'runner', 'race', 'sport', name.toLowerCase()]);
  });

  // ---- kite flyers (game.js 2744–2777): arm raised, kite swaying high in front, string sagging, ribbon tail ----
  function kiteFlyer(look, scale, c1, c2, seed) {
    const r = person(look, { scale, pose: (h, t) => { poseHuman(h, 0, 0); h.armR.rotation.x = -2.3 + Math.sin(t * 2 + seed) * 0.1; h.armL.rotation.x = -0.6; } });
    const root = r.group, h = r.h;
    const kite = new T.Group(); root.add(kite);
    const dia = new T.Shape(); dia.moveTo(0, 0.85); dia.lineTo(0.55, 0.05); dia.lineTo(0, -0.7); dia.lineTo(-0.55, 0.05); dia.closePath();
    const top = new T.Shape(); top.moveTo(0, 0.85); top.lineTo(0.55, 0.05); top.lineTo(-0.55, 0.05); top.closePath();
    add(new T.ShapeGeometry(dia), new T.MeshStandardMaterial({ color: c1, side: T.DoubleSide, roughness: 0.7 }), 0, 0, 0, kite, false);
    add(new T.ShapeGeometry(top), new T.MeshStandardMaterial({ color: c2, side: T.DoubleSide, roughness: 0.7 }), 0, 0, 0.01, kite, false);
    kite.scale.setScalar(0.7);
    const seg = (n, rad, c, o = 1) => { const m = new T.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o }), geo = new T.CylinderGeometry(rad, rad, 1, 5); return Array.from({ length: n }, () => { const s = new T.Mesh(geo, m); root.add(s); return s; }); };
    const strSegs = seg(15, 0.006, 0xf1f3f5, 0.85), tailSegs = seg(7, 0.012, c2);
    const UP = new T.Vector3(0, 1, 0), a = new T.Vector3(), b = new T.Vector3(), d = new T.Vector3();
    const place = (s, p, q) => { d.subVectors(q, p); s.position.copy(p).addScaledVector(d, 0.5); s.scale.set(1, Math.max(d.length(), 1e-4), 1); s.quaternion.setFromUnitVectors(UP, d.normalize()); };
    const hand = new T.Vector3(), kp = new T.Vector3(), mp = new T.Vector3(), tmpM = new T.Matrix4();
    const base = r.group.userData.tick;
    root.userData.tick = (t) => {
      base(t);
      // the hand, in prop-local coordinates
      root.updateMatrixWorld(true);
      h.armR.updateWorldMatrix(true, false);
      hand.set(0, -0.62, 0).applyMatrix4(h.armR.matrixWorld).applyMatrix4(tmpM.copy(root.matrixWorld).invert());
      const sway = Math.sin(t * 0.6 + seed) * 1.0;   // game: 20 m out / 12 m up — scaled down so the prop stays framable
      kp.set(hand.x + sway, hand.y + 2.6 + Math.sin(t * 1.2 + seed) * 0.3, hand.z + 2.6);
      kite.position.copy(kp);
      kite.lookAt(root.localToWorld(hand.clone())); kite.rotateZ(Math.sin(t * 1.7 + seed) * 0.35); kite.rotateX(-0.35);
      mp.copy(hand).lerp(kp, 0.5); mp.y -= 0.5;
      for (let i = 0; i < strSegs.length; i++) {
        const q = (u) => { const A = (1 - u) * (1 - u), B = 2 * (1 - u) * u, C = u * u; return [A * hand.x + B * mp.x + C * kp.x, A * hand.y + B * mp.y + C * kp.y, A * hand.z + B * mp.z + C * kp.z]; };
        a.set(...q(i / strSegs.length)); b.set(...q((i + 1) / strSegs.length)); place(strSegs[i], a, b);
      }
      const tp = (i) => [kp.x + Math.sin(t * 4 + i) * 0.16, kp.y - 0.45 - i * 0.16, kp.z + i * 0.14];
      for (let i = 0; i < tailSegs.length; i++) { a.set(...tp(i)); b.set(...tp(i + 1)); place(tailSegs[i], a, b); }
    };
    root.userData.tick(0);
    return r;
  }
  ZAssets.register('people', 'islander_kite_flyer_kid', 'Island kid flying a kite (island extra)', () => kiteFlyer({ shirt: 0x1971c2, pants: 0x1f2937, skin: 0xc68642, hair: 0x1b1b1b }, KID, 0xe03131, 0xffd43b, 0), ['islander', 'extra', 'kid', 'kite', 'flying', 'park']);
  ZAssets.register('people', 'islander_kite_flyer', 'Islander flying a kite, dress (island extra)', () => kiteFlyer({ shirt: 0xfab005, pants: 0x5c3d2e, skin: 0xe0ac69, hair: 0x3b2a1a, dress: true }, ADULT, 0x1c7ed6, 0xf783ac, 1.7), ['islander', 'extra', 'kite', 'flying', 'beach']);
  ZAssets.register('people', 'islander_kite_flyer_kid_2', 'Island kid flying a purple kite (island extra)', () => kiteFlyer({ shirt: 0xe03131, pants: 0x364fc7, skin: 0x8d5524, hair: 0x2c2c2c }, KID, 0x7048e8, 0x82c91e, 3.4), ['islander', 'extra', 'kid', 'kite', 'flying']);

  // ---- race results hologram (game.js 2513–2540, 3361–3363): floating cyan board, bobbing + flickering ----
  ZAssets.register('people', 'race_results_holo', 'Race results hologram board', () => {
    const group = new T.Group();
    const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
    const rows = [{ name: 'YOU', t: 221.6, you: true }, { name: 'Arjun', t: 223.0 }, { name: 'Kabir', t: 227.9 }, { name: 'Meera', t: 232.4 }, { name: 'Priya', t: 235.1 }];
    const map = tex((g, W, H) => {
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, 'rgba(10,40,70,0.62)'); bg.addColorStop(1, 'rgba(40,10,70,0.55)');
      g.fillStyle = bg; g.fillRect(8, 8, W - 16, H - 16);
      g.strokeStyle = 'rgba(103,232,249,0.9)'; g.lineWidth = 3; g.shadowColor = '#22d3ee'; g.shadowBlur = 14; g.strokeRect(8, 8, W - 16, H - 16); g.shadowBlur = 0;
      for (let y = 12; y < H - 10; y += 6) { g.fillStyle = 'rgba(103,232,249,0.06)'; g.fillRect(10, y, W - 20, 2); }
      g.textAlign = 'left'; g.fillStyle = '#e0f7ff'; g.shadowColor = '#22d3ee'; g.shadowBlur = 12;
      g.font = '900 38px system-ui, sans-serif'; g.fillText('🏆 YOU WON!', 28, 58);
      g.font = '600 20px system-ui, sans-serif'; g.fillStyle = '#a5f3fc'; g.fillText(`Full lap · ${fmt(221.6)} · new personal best!`, 28, 88);
      rows.forEach((r, i) => {
        const y = 132 + i * 46;
        g.fillStyle = r.you ? 'rgba(236,72,153,0.35)' : 'rgba(103,232,249,0.08)'; g.shadowBlur = 0; g.fillRect(22, y - 30, W - 44, 40);
        g.shadowBlur = 10; g.fillStyle = r.you ? '#fff' : '#d0f4ff';
        g.font = '900 26px system-ui, sans-serif'; g.fillText(['1st', '2nd', '3rd', '4th', '5th'][i], 34, y);
        g.font = `${r.you ? 900 : 700} 26px system-ui, sans-serif`; g.fillText(r.name, 112, y);
        g.textAlign = 'right'; g.font = '700 24px system-ui, sans-serif'; g.fillText(fmt(r.t), W - 36, y); g.textAlign = 'left';
      });
      g.shadowBlur = 0; g.font = '600 17px system-ui, sans-serif'; g.fillStyle = 'rgba(165,243,252,0.85)';
      g.fillText('Walk back to START to race again', 28, H - 24);
    }, 512, 400);
    const m = new T.MeshBasicMaterial({ map, transparent: true, depthWrite: false, side: T.DoubleSide, opacity: 0.95 });
    const board = new T.Mesh(new T.PlaneGeometry(3.4, 2.65), m); board.position.y = 2.4; group.add(board);
    group.userData.tick = (t) => { board.position.y = 2.4 + Math.sin(t * 1.6) * 0.08; m.opacity = 0.88 + 0.12 * Math.sin(t * 23) * Math.sin(t * 7); };
    return { group };
  }, ['race', 'results', 'hologram', 'leaderboard', 'winner']);

})();
