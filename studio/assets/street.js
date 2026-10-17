/* Zungga Story Studio — island market street (ported from the drive-portfolio island game, js/game.js).
 * Food stalls, shops, the market arch, the Island Bank ATM, fairy lights strung across the street, stall lanterns,
 * the two kinds of island lamps, the island bench and signs. Game scale is already real metres (bench seat 0.5 m, doors 2.3 m).
 * setOn(on) = "after dark": lanterns, windows, signs and lamps glow (the game's nightGlow values). */
(() => {
  'use strict';
  const { T, mat, mesh, tex } = ZA;

  // ---------- local helpers (mirroring the game's add / mat / label / glowTex) ----------
  const gm = (c, o = {}) => mat(c, { roughness: 0.85, ...o });
  const add = (geo, m, x = 0, y = 0, z = 0, parent) => mesh(geo, m, parent, x, y, z);
  const seeded = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
  const GFONT = 'system-ui, sans-serif';
  const label = (text, fg, bg, w = 512, h = 128, font = 800) => tex((c, W, H) => {
    if (bg) { c.fillStyle = bg; c.fillRect(0, 0, W, H); }
    c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
    let fs = Math.floor(H * 0.62); c.font = `${font} ${fs}px ${GFONT}`;
    while (c.measureText(text).width > W - 24 && fs > 12) { fs -= 2; c.font = `${font} ${fs}px ${GFONT}`; }
    c.fillText(text, W / 2, H / 2 + 2);
  }, w, h);
  const radial = (stops, s = 128) => tex((g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, s, s);
  const glowTex = (inner, outer) => radial([[0, inner], [0.35, outer], [1, 'rgba(0,0,0,0)']], 256);
  // day/night switch list for one prop
  function nightSet() {
    const L = [];
    return {
      std(m, day, night) { L.push({ m, day, night }); m.emissiveIntensity = day; return m; },
      basic(m, max, min = 0) { L.push({ m, max, min, b: true }); m.opacity = min; return m; },
      pool(o, parent) { L.push({ o, parent }); return o; },   // ground light pools only exist while lit (keeps the prop's bounds tight)
      set(on) { for (const g of L) { if (g.o) { if (on) g.parent.add(g.o); else g.parent.remove(g.o); } else if (g.b) g.m.opacity = on ? g.max : g.min; else g.m.emissiveIntensity = on ? g.night : g.day; } },
    };
  }
  const signMat = (N, t) => N.std(new T.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.7 }), 0, 0.85);
  const glowStd = (N, c, day = 0.1, night = 2.4) => N.std(new T.MeshStandardMaterial({ color: 0xfff4d6, emissive: c, emissiveIntensity: day }), day, night);
  const litMat = (N, c, night = 0.6) => N.std(gm(c, { roughness: 0.6, emissive: c, emissiveIntensity: 0 }), 0, night);
  const flat = (m) => { m.castShadow = false; return m; };
  const woodMat = () => gm(0x9c6b3f, { roughness: 0.8 }), ironMat = () => gm(0x2b2f3a, { metalness: 0.5, roughness: 0.5 });
  // a soft additive pool of light on the ground (only visible when on)
  function lightPool(N, g, size, x, z, max, tx) {
    const m = N.basic(new T.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }), max);
    const p = flat(add(new T.PlaneGeometry(size, size).rotateX(-Math.PI / 2), m, x, 0.1, z, null)); p.receiveShadow = false; p.renderOrder = 1; return N.pool(p, g);
  }
  function halo(N, g, x, y, z, s, inner, outer, max) {
    const sp = new T.Sprite(N.basic(new T.SpriteMaterial({ map: glowTex(inner, outer), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }), max));
    sp.position.set(x, y, z); sp.scale.set(s, s, 1); g.add(sp); return sp;
  }
  const finish = (g, N, on = false) => { g.userData.setOn = (v) => N.set(!!v); N.set(on); return { group: g }; };
  const warmPool = () => radial([[0, 'rgba(255,210,140,0.95)'], [0.45, 'rgba(255,180,100,0.35)'], [1, 'rgba(0,0,0,0)']]);

  // stall lantern: a bulb on a short cord (game lines 2571–2596)
  function lantern(N, g, x, y, z, poolAt) {
    add(new T.SphereGeometry(0.15, 12, 8), glowStd(N, 0xffb84d, 0.2, 4.2), x, y, z, g);
    flat(add(new T.CylinderGeometry(0.012, 0.012, 0.35, 4).translate(0, 0.2, 0), gm(0x222222), x, y, z, g));
    halo(N, g, x, y, z, 1.6, 'rgba(255,210,140,0.95)', 'rgba(255,170,80,0.3)', 1);
    if (poolAt) lightPool(N, g, 9, poolAt[0], poolAt[1], 1, warmPool());
  }

  // ---------- food stalls (game lines 884–909), each with its lantern ----------
  const STALLS = [
    ['masala_dosa', 'MASALA DOSA', '#f59f00', ['dosa', 'masala dosa']], ['chai', 'CHAI', '#c2410c', ['chai', 'tea stall']], ['fresh_fruits', 'FRESH FRUITS', '#2f9e44', ['fruit stall', 'fruits']],
    ['spices', 'SPICES', '#e03131', ['spices', 'spice']], ['ice_cream', 'ICE CREAM', '#f783ac', ['kulfi', 'ice cream stall']], ['juice', 'JUICE', '#74b816', ['sugarcane', 'juice stall']],
    ['biryani', 'BIRYANI', '#f08c00', ['biryani']], ['books', 'BOOKS', '#1971c2', ['book stall', 'second-hand books']], ['toys', 'TOYS', '#7048e8', ['toy stall']],
    ['flowers', 'FLOWERS', '#f06595', ['jasmine', 'garlands', 'flower stall']], ['pani_puri', 'PANI PURI', '#0ca678', ['pani puri', 'golgappa']], ['filter_coffee', 'FILTER COFFEE', '#795548', ['filter coffee', 'coffee stall']],
    ['bakery', 'BAKERY', '#e8590c', ['bakery', 'puffs', 'buns']], ['crafts', 'CRAFTS', '#9c36b5', ['crafts', 'pottery']], ['clothes', 'CLOTHES', '#3b5bdb', ['clothes stall', 'sarees', 'scarves']],
  ];
  const goodsCols = [0xe03131, 0xfab005, 0x82c91e, 0xf76707, 0xffffff, 0xae3ec9];
  function stall(i, name, col) {
    const g = new T.Group(), N = nightSet(), rnd = seeded(31 + i * 17);
    const counterM = N.std(gm(0xa47148, { emissive: 0xffb36b, emissiveIntensity: 0 }), 0, 0.45);
    add(new T.BoxGeometry(3.8, 1.0, 1.1), counterM, 0, 0.5, 0.9, g);                                    // counter
    flat(add(new T.BoxGeometry(3.8, 0.08, 1.2), gm(new T.Color(col).getHex()), 0, 1.04, 0.9, g));
    const wood = woodMat();
    for (const [px, pz] of [[-1.85, 1.4], [1.85, 1.4], [-1.85, -1.2], [1.85, -1.2]]) flat(add(new T.CylinderGeometry(0.06, 0.06, 2.7, 6), wood, px, 1.35, pz, g));
    const stripes = tex((c, w, h) => { for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#ffffff' : col; c.fillRect(k * w / 8, 0, w / 8, h); } }, 128, 16);
    const canopyM = N.std(new T.MeshStandardMaterial({ map: stripes, emissiveMap: stripes, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.8 }), 0, 0.55);
    add(new T.BoxGeometry(4.3, 0.08, 3.2), canopyM, 0, 2.85, 0.15, g).rotation.x = 0.22;
    flat(add(new T.PlaneGeometry(3.4, 0.62), signMat(N, label(name, '#fff', col)), 0, 3.35, 1.62, g)).rotation.x = -0.08;
    const goodsGeo = new T.IcosahedronGeometry(0.16, 0);
    for (let k = 0; k < 9; k++) flat(add(goodsGeo, litMat(N, goodsCols[(k + i) % goodsCols.length], 0.9), -1.4 + (k % 5) * 0.7 + (rnd() - 0.5) * 0.2, 1.2, 0.7 + Math.floor(k / 5) * 0.4, g));
    flat(add(new T.BoxGeometry(3.6, 0.9, 0.5), gm(0x6b4f35), 0, 0.45, -1.0, g));                           // back shelf
    lantern(N, g, 0, 2.45, 1.25, [0, 2.4]);
    return finish(g, N);
  }
  STALLS.forEach(([id, name, col, words], i) => ZAssets.register('street', 'stall_' + id, name.charAt(0) + name.slice(1).toLowerCase() + ' stall', () => stall(i, name, col), ['stall', 'market', 'street', 'food', ...words]));

  // ---------- shops at the street ends (game lines 910–923 + lanterns 2578–2581) ----------
  const SHOPS = [['grocery', 'GROCERY', '#2f9e44', 0xfff3bf], ['cafe', 'CAFÉ', '#c2410c', 0xffe8cc], ['pharmacy', 'PHARMACY', '#1c7ed6', 0xe7f5ff], ['tea_house', 'TEA HOUSE', '#9c36b5', 0xf3d9fa]];
  function shop(name, col, wallC) {
    const g = new T.Group(), N = nightSet(), s = new T.Group(); s.position.z = 1; g.add(s);   // shift so the building is centred
    const wall = N.std(gm(wallC, { emissive: 0xffd8a8, emissiveIntensity: 0 }), 0, 0.32);
    add(new T.BoxGeometry(9, 7, 8), wall, 0, 3.5, -1, s);
    add(new T.BoxGeometry(9.4, 0.4, 8.4), gm(0x868e96), 0, 7.2, -1, s);
    flat(add(new T.PlaneGeometry(6.5, 1.1), signMat(N, label(name, '#fff', col)), 0, 4.6, 3.02, s));
    flat(add(new T.PlaneGeometry(5.6, 2.4), glowStd(N, 0xffe8a3, 0.25, 2.2), 0, 1.6, 3.02, s));          // shop window
    for (const wx of [-2.6, 2.6]) flat(add(new T.PlaneGeometry(1.4, 1.2), glowStd(N, 0xffd08a, 0.05, 2), wx, 5.9, 3.02, s));
    flat(add(new T.BoxGeometry(7, 0.08, 1.6), gm(new T.Color(col).getHex()), 0, 3.3, 3.6, s)).rotation.x = 0.3;
    for (const lx of [-3.4, 3.4]) lantern(N, s, lx, 3.0, 3.5, [lx, 5]);
    return finish(g, N);
  }
  SHOPS.forEach(([id, name, col, wallC]) => ZAssets.register('street', 'island_shop_' + id, 'Island shop: ' + name, () => shop(name, col, wallC), ['shop', 'market', 'street', 'building', id.replace('_', ' ')]));

  // ---------- market arch (game lines 881–883) ----------
  ZAssets.register('street', 'market_arch', 'Market Street arch', () => {
    const g = new T.Group(), N = nightSet(), wood = woodMat();
    const arch = tex((c, w, h) => { const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#ea580c'); gr.addColorStop(1, '#db2777'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = `900 64px ${GFONT}`; c.textAlign = 'center'; c.fillText('MARKET STREET', w / 2, h * 0.66); }, 768, 110);
    for (const sx of [-6.5, 6.5]) add(new T.BoxGeometry(0.8, 6.5, 0.8), wood, sx, 3.25, 0, g);
    const sm = signMat(N, arch);
    add(new T.BoxGeometry(14.5, 1.5, 0.4), [wood, wood, wood, wood, sm, sm], 0, 6.6, 0, g);
    return finish(g, N);
  }, ['arch', 'gate', 'market', 'street', 'sign']);

  // ---------- Island Bank ATM (game lines 924–932) ----------
  ZAssets.register('street', 'island_atm', 'Island Bank ATM', () => {
    const g = new T.Group(), N = nightSet();
    add(new T.BoxGeometry(1.1, 2.0, 0.8), gm(0x1c7ed6, { roughness: 0.5 }), 0, 1.0, 0, g);
    flat(add(new T.PlaneGeometry(0.62, 0.42), glowStd(N, 0x74c0fc, 0.8, 2.4), 0, 1.35, 0.41, g));
    flat(add(new T.BoxGeometry(0.5, 0.06, 0.2), gm(0xadb5bd), 0, 0.95, 0.45, g));
    flat(add(new T.PlaneGeometry(1.0, 0.32), signMat(N, label('ISLAND BANK · ATM', '#fff', '#1864ab')), 0, 1.86, 0.41, g));
    return finish(g, N);
  }, ['atm', 'bank', 'cash', 'street']);

  // ---------- the neighbourhood lamp post (game lines 1075–1095) ----------
  function lampPost(N, g, x = 0, z = 0) {
    const iron = ironMat();
    add(new T.CylinderGeometry(0.08, 0.12, 3.6, 8), iron, x, 1.8, z, g);
    add(new T.CylinderGeometry(0.22, 0.26, 0.2, 8), iron, x, 0.1, z, g);
    add(new T.CylinderGeometry(0.16, 0.08, 0.22, 8), iron, x, 3.52, z, g);
    flat(add(new T.SphereGeometry(0.28, 14, 10), glowStd(N, 0xffd08a, 0.15, 3), x, 3.78, z, g));
    halo(N, g, x, 3.78, z, 2.6, 'rgba(255,220,160,0.9)', 'rgba(255,190,110,0.25)', 0.85);
    lightPool(N, g, 10, x, z, 0.7, radial([[0, 'rgba(255,214,150,0.95)'], [0.4, 'rgba(255,190,110,0.4)'], [1, 'rgba(255,170,90,0)']]));
  }
  ZAssets.register('street', 'island_lamp_post', 'Island lamp post', () => { const g = new T.Group(), N = nightSet(); lampPost(N, g); return finish(g, N); }, ['lamp', 'lamp post', 'light', 'park', 'street']);

  // ---------- the ring-road street lamp with an arm (game lines 742–779) ----------
  ZAssets.register('street', 'island_street_lamp', 'Island street lamp (arm)', () => {
    const g = new T.Group(), N = nightSet(), m = gm(0x2b2f3a, { metalness: 0.6, roughness: 0.4 }), p = new T.Group(); p.position.x = -1.1; g.add(p);
    add(new T.CylinderGeometry(0.11, 0.17, 6.2, 8), m, 0, 3.1, 0, p);
    add(new T.BoxGeometry(2.4, 0.12, 0.12), m, 1.1, 6.1, 0, p);
    add(new T.CylinderGeometry(0.3, 0.36, 0.3, 8), m, 0, 0.15, 0, p);
    flat(add(new T.BoxGeometry(0.9, 0.16, 0.5), N.std(new T.MeshStandardMaterial({ color: 0xfff5dc, emissive: 0xffc46b, emissiveIntensity: 0.15 }), 0.15, 3.2), 2.2, 5.98, 0, p));
    lightPool(N, p, 13, 2.4, 0, 0.6, radial([[0, 'rgba(255,214,150,0.9)'], [0.45, 'rgba(255,190,110,0.35)'], [1, 'rgba(255,170,90,0)']]));
    return finish(g, N);
  }, ['street lamp', 'streetlight', 'lamp', 'road']);

  // ---------- fairy lights strung across the street between two lamp posts (game lines 933–940, 1068) ----------
  ZAssets.register('street', 'market_string_lights', 'String lights across the street', () => {
    const g = new T.Group(), N = nightSet();
    for (const x of [-8, 8]) lampPost(N, g, x, 0);
    const pts = [];
    for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push(new T.Vector3(-8 + t * 16, 3.6 - Math.sin(t * Math.PI) * 0.7 + 0.12, 0)); }
    flat(add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 48, 0.015, 4), gm(0x222222), 0, 0, 0, g));
    const bulbM = glowStd(N, 0xffd43b, 0.3, 3.5), bg = new T.SphereGeometry(0.11, 8, 6);
    for (let k = 0; k < 9; k++) { const t = k / 8; flat(add(bg, bulbM, -8 + t * 16, 3.6 - Math.sin(t * Math.PI) * 0.7, 0, g)); }
    return finish(g, N);
  }, ['fairy lights', 'string lights', 'lights', 'festival', 'market']);

  // ---------- a single stall lantern (bulb on its cord) ----------
  ZAssets.register('street', 'stall_lantern', 'Stall lantern', () => {
    const g = new T.Group(), N = nightSet();
    lantern(N, g, 0, 0.15, 0, null);
    flat(add(new T.BoxGeometry(0.3, 0.03, 0.03), gm(0x6b4f35), 0, 0.53, 0, g));           // the bit of stall frame it hangs from
    return finish(g, N);
  }, ['lantern', 'bulb', 'stall', 'light']);

  // ---------- island bench (game lines 849–856) ----------
  ZAssets.register('street', 'island_bench', 'Island bench', () => {
    const g = new T.Group(), wood = woodMat(), iron = ironMat();
    add(new T.BoxGeometry(1.8, 0.08, 0.5), wood, 0, 0.5, 0, g); add(new T.BoxGeometry(1.8, 0.4, 0.06), wood, 0, 0.8, -0.25, g);
    for (const sx of [-0.8, 0.8]) flat(add(new T.BoxGeometry(0.08, 0.47, 0.46), iron, sx, 0.24, 0, g));
    return { group: g };
  }, ['bench', 'park bench', 'seat']);

  // ---------- signs ----------
  ZAssets.register('street', 'island_park_sign', 'ISLAND PARK sign', () => {
    const g = new T.Group(), N = nightSet();
    flat(add(new T.PlaneGeometry(4, 1), signMat(N, label('ISLAND PARK', '#fff', '#2b8a3e')), 0, 2.2, 0.08, g));
    add(new T.BoxGeometry(0.15, 1.8, 0.15), woodMat(), 0, 0.9, 0, g);
    add(new T.BoxGeometry(4.04, 1.04, 0.06), woodMat(), 0, 2.2, 0.04, g);               // back board so the sign isn't paper-thin
    return finish(g, N);
  }, ['park sign', 'sign', 'park']);
  ZAssets.register('street', 'island_zone_sign', 'Zone billboard (ABOUT ME)', () => {   // game lines 602–622
    const g = new T.Group(), N = nightSet(), plain = gm(0xf1f3f5);
    const t = tex((c, w, h) => {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#7c3aed'; c.fillRect(0, 0, w, 36); c.fillRect(0, h - 36, w, 36);
      c.fillStyle = '#15131f'; c.textAlign = 'center'; c.font = `900 120px ${GFONT}`; c.fillText('ABOUT ME', w / 2, h * 0.58);
      c.font = `600 40px ${GFONT}`; c.fillStyle = '#5b6475'; c.fillText('park on the pad to open', w / 2, h * 0.82);
    }, 1024, 512);
    add(new T.BoxGeometry(14, 7, 0.5), [plain, plain, plain, plain, new T.MeshStandardMaterial({ map: t, roughness: 0.7 }), plain], 0, 6.5, 0, g);
    for (const px of [-6, 6]) add(new T.BoxGeometry(0.6, 3, 0.6), gm(0x868e96), px, 1.5, 0, g);
    return finish(g, N);
  }, ['billboard', 'sign', 'about me']);

  // ---------- street paving piece (game line 879) ----------
  ZAssets.register('street', 'market_paving', 'Market street paving', () => {
    const g = new T.Group();
    const t = tex((c, w, h) => { c.fillStyle = '#8a8577'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 3; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(0, i * h / 8); c.lineTo(w, i * h / 8); c.stroke(); for (let k = 0; k < 8; k++) { const x = (k + (i % 2) * 0.5) * w / 8; c.beginPath(); c.moveTo(x, i * h / 8); c.lineTo(x, (i + 1) * h / 8); c.stroke(); } } }, 512, 512);
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(3.5, 2.75);
    add(new T.BoxGeometry(14, 0.04, 11), new T.MeshStandardMaterial({ map: t, roughness: 0.9 }), 0, 0.02, 0, g);
    return { group: g };
  }, ['paving', 'pavement', 'street floor']);
})();
