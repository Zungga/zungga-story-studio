/*
 * Zungga Story Studio — one adjustable person (body from the Play-mode soldier, face from the kid).
 *   const p = ZCharacters.person({ height, weight, build, age, sex, outfit, hair, skin, hairColor, glasses, mustache, colors })
 *     height   metres (1.15 … 1.95)
 *     weight   0 thin · 0.5 normal · 1 heavy
 *     build    0 narrow · 0.5 normal · 1 broad shoulders
 *     age      0 child (≈9) · 0.5 teen · 1 adult  (head size, face and proportions)
 *     sex      'm' | 'f'
 *     hair     'short' | 'side_part' | 'spiky' | 'spikes' | 'curly' | 'long' | 'bun' | 'plaits' | 'ponytail' | 'receding'   (any hairColor = a wig)
 *     wear     the wardrobe — every piece takes a color (hex), most take color2:
 *       top     { type: 'tshirt'|'shirt'|'top'|'mini_top'|'tank_top', color, color2, pattern: 'plain'|'stripes'|'checks'|'dots'|'band',
 *                 logo (mascot on the chest — default on for t-shirts and tops), sleeves: 'none'|'short'|'puff'|'long', tuck, long (kurti-length top) }
 *       layer   { type: 'hoodie'|'jacket'|'vest', color, open (show the top underneath), logo }
 *       bottom  { type: 'jeans'|'pants'|'trousers'|'shorts'|'mini_skirt'|'skirt'|'saree', color, length }
 *       shoes   { type: 'sneakers'|'formal'|'boots'|'sandals', color, color2, socks: 'none'|'ankle'|'long' }
 *       tie     { color, color2 }            dupatta { color, color2 (border) }
 *       eyewear { type: 'glasses'|'sunglasses', color }
 *     outfit   (older presets) 'school_boy' | 'school_girl' | 'teacher' | 'teacher_saree' | 'shopkeeper' | 'casual' → turned into a wear set
 *   → same API as the kid: { group, setExpression, play, setTalk, hold, update, EXPRESSIONS, ANIMATIONS }
 *   ZCharacters.PRESETS gives the ready-made cast.
 */
(() => {
  'use strict';
  const T = THREE;
  // the Zungga mascot printed on t-shirts / hoodies (loaded once, shared by everyone)
  const SCRIPT_SRC = document.currentScript && document.currentScript.src;
  const BRAND = { url: SCRIPT_SRC ? new URL('../assets/brand/zungga-mascot.png', SCRIPT_SRC).href : 'assets/brand/zungga-mascot.png', img: null, waiters: [], loading: false };
  function withLogo(cb) {
    if (BRAND.img) return cb(BRAND.img);
    BRAND.waiters.push(cb);
    if (BRAND.loading) return; BRAND.loading = true;
    const im = new Image(); im.onload = () => { BRAND.img = im; BRAND.waiters.splice(0).forEach((f) => f(im)); }; im.onerror = () => console.warn('Zungga mascot not found at', BRAND.url); im.src = BRAND.url;
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
  const smooth = (t) => t * t * (3 - 2 * t);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function canvasTex(draw, w = 256, h = 256) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; }
  function add(parent, geo, mat, x = 0, y = 0, z = 0) { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
  const J = (parent, x = 0, y = 0, z = 0) => { const g = new T.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const lathe = (pts, seg = 40) => new T.LatheGeometry(pts.map(([r, y]) => new T.Vector2(Math.max(0.0005, r), y)), seg);
  // a limb segment that tapers from r0 to r1 over length L (hangs down from its joint), rounded at both ends
  function limb(r0, r1, L, seg = 24) {
    const pts = [[0.0005, r0 * 0.6]];
    for (let i = 1; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; pts.push([Math.sin(a) * r0, Math.cos(a) * r0 * 0.6]); }                       // rounded top
    for (let i = 1; i <= 8; i++) { const t = i / 8; pts.push([lerp(r0, r1, smooth(t)) * (1 + 0.06 * Math.sin(t * Math.PI)), -L * t]); }          // tapered, slight muscle bulge
    for (let i = 1; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; pts.push([Math.cos(a) * r1, -L - Math.sin(a) * r1 * 0.6]); }               // rounded bottom
    return lathe(pts.reverse(), seg);
  }


  let DENIM = null;
  function denimTex() {                 // light grey twill, tinted by the material colour
    if (DENIM) return DENIM;
    DENIM = canvasTex((g, w, h) => {
      g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h);
      for (let i = -h; i < w + h; i += 3) { g.strokeStyle = `rgba(255,255,255,${0.18 + Math.random() * 0.2})`; g.lineWidth = 1; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); }
      for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},0.07)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 1); }
      g.strokeStyle = 'rgba(214,160,60,0.55)'; g.setLineDash([5, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(w * 0.25, 0); g.lineTo(w * 0.25, h); g.stroke();   // outer seam stitch
    }, 128, 128);
    DENIM.wrapS = DENIM.wrapT = T.RepeatWrapping; DENIM.repeat.set(2, 3);
    return DENIM;
  }

  const SKINS = { light: 0xe3b48f, wheat: 0xd29c72, medium: 0xc58a60, tan: 0xa8714a, deep: 0x7d4f33 };
  const HAIRC = { black: 0x15100d, brown: 0x3a2618, grey: 0x8c8a86, salt: 0x5a5651, blonde: 0xd9a441, auburn: 0x7a2e1b, blue: 0x3b5bdb, pink: 0xe64980, purple: 0x7048e8, teal: 0x0ca678 };
  const BRAND_COLORS = { purple: 0x4b2a8c, teal: 0x13b5c6, orange: 0xf8a51b, pink: 0xff4f8b, violet: 0x7c5cf2, yellow: 0xfcc72c };
  const WEAR_TYPES = { top: ['tshirt', 'shirt', 'top', 'mini_top', 'tank_top'], layer: ['none', 'hoodie', 'jacket', 'vest'], bottom: ['jeans', 'pants', 'trousers', 'shorts', 'mini_skirt', 'skirt', 'saree'], shoes: ['sneakers', 'formal', 'boots', 'sandals'], eyewear: ['none', 'glasses', 'sunglasses'], pattern: ['plain', 'stripes', 'checks', 'dots', 'band'] };
  const TOP_DEF = { tshirt: { sleeves: 'short', logo: true, untuck: true }, shirt: { sleeves: 'short', logo: false, untuck: false }, top: { sleeves: 'puff', logo: true, untuck: true }, mini_top: { sleeves: 'short', logo: true, untuck: false }, tank_top: { sleeves: 'none', logo: true, untuck: true } };

  // older outfit names → a wardrobe set (so earlier presets keep working)
  function legacyWear(outfit, col, female) {
    switch (outfit) {
      case 'school_boy': return { top: { type: 'shirt', color: col.shirt, tuck: true }, tie: { color: 0x1f2a52, color2: 0xfacc15 }, bottom: { type: 'shorts', color: col.bottom }, shoes: { type: 'formal', color: col.shoe, socks: 'long' }, card: true };
      case 'school_girl': return { top: { type: 'shirt', color: col.shirt, tuck: true }, bow: true, bottom: { type: 'skirt', color: col.bottom }, shoes: { type: 'formal', color: col.shoe, socks: 'long' }, card: true };
      case 'teacher': return { top: { type: 'shirt', color: col.shirt, tuck: true, sleeves: 'long', buttons: 5 }, bottom: { type: 'trousers', color: col.bottom }, shoes: { type: 'formal', color: col.shoe }, pen: !female };
      case 'teacher_saree': return { top: { type: 'top', color: col.shirt, logo: false, tuck: true, sleeves: 'short' }, bottom: { type: 'saree', color: col.bottom }, shoes: { type: 'sandals' } };
      case 'shopkeeper': return { top: { type: 'shirt', color: col.shirt, tuck: true, collar: false, buttons: 0 }, layer: { type: 'vest', color: col.accent }, bottom: { type: 'trousers', color: col.bottom }, shoes: { type: 'formal', color: col.shoe } };
      case 'casual': return { top: { type: 'tshirt', color: col.shirt, pattern: 'band', color2: col.accent }, bottom: { type: 'pants', color: col.bottom }, shoes: { type: 'sneakers', color: col.shoe } };
      default: return null;
    }
  }
  function resolveWear(o, col, female) {
    const w0 = o.wear || legacyWear(o.outfit, col, female) || {};
    const w = { ...w0 };
    w.top = { type: 'tshirt', color: BRAND_COLORS.teal, ...(w0.top || {}) };
    const td = TOP_DEF[w.top.type] || TOP_DEF.tshirt;
    w.top = { pattern: 'plain', sleeves: td.sleeves, logo: td.logo, ...w.top };
    w.layer = w0.layer && w0.layer.type && w0.layer.type !== 'none' ? { color: BRAND_COLORS.purple, logo: true, ...w0.layer } : null;
    w.bottom = { type: 'jeans', color: 0x3b5b8c, ...(w0.bottom || {}) };
    const st = (w0.shoes && w0.shoes.type) || 'sneakers';
    w.shoes = { type: st, color: { sneakers: 0xffffff, formal: col.shoe, boots: 0x4a2a14, sandals: 0x8a5a33 }[st] ?? col.shoe, color2: BRAND_COLORS.violet, ...(w0.shoes || {}) };
    w.eyewear = w0.eyewear && w0.eyewear.type && w0.eyewear.type !== 'none' ? { color: 0x1f1f24, ...w0.eyewear } : (o.glasses ? { type: 'glasses', color: 0x1f1f24 } : null);
    w.tie = w0.tie || null; w.dupatta = w0.dupatta || null;
    const wrap = w.layer && (w.layer.type === 'hoodie' || w.layer.type === 'jacket');
    w.untuck = wrap || (w.top.tuck != null ? !w.top.tuck : td.untuck);
    w.wrap = wrap;
    return w;
  }

  function person(o = {}) {
    const H = clamp(o.height ?? 1.42, 1.0, 2.05), W = clamp(o.weight ?? 0.5, 0, 1), B = clamp(o.build ?? 0.5, 0, 1), AGE = clamp(o.age ?? 0, 0, 1);
    const female = (o.sex || 'm') === 'f';
    const outfit = o.wear ? 'custom' : (o.outfit || 'custom');
    const hairStyle = o.hair || (female ? 'plaits' : 'short');
    const col = { shirt: 0xf7f8fb, bottom: 0x1f2a52, accent: 0x2b3d8f, shoe: 0x15151a, ...(o.colors || {}) };
    const wear = resolveWear(o, col, female);
    const topW = wear.top, layerW = wear.layer, botW = wear.bottom, shoeW = wear.shoes;
    const outerW = wear.wrap ? layerW : topW;                    // what you see on the torso/arms

    // ---------------- proportions ----------------
    const headH = H / lerp(5.6, 7.3, AGE);                     // kids have big heads
    const R = headH * 0.5;                                      // head radius
    const legLen = H * (lerp(0.47, 0.5, AGE) + (female ? 0.04 : 0));        // hip height (girls: shorter top body, longer legs)
    const shoulderY = H - headH - H * lerp(0.03, 0.045, AGE);                     // shoulders below the chin
    const torsoLen = shoulderY - legLen;
    const shoulderHalf = H * lerp(0.1, 0.122, AGE) * lerp(0.9, 1.14, B) * (female ? 0.92 : 1);
    const girth = lerp(0.86, 1.5, W) * (female ? 0.96 : 1);       // body thickness
    const limbG = lerp(0.88, 1.42, W);
    const torsoR = H * 0.078 * girth * lerp(0.95, 1.05, B) * (female ? 0.9 : 1);
    const hipR = H * 0.074 * girth * (female ? lerp(0.94, 1.04, AGE) : 1);
    const thighL = legLen * 0.47, shinL = legLen * 0.45, footH = legLen * 0.08;
    const upperL = H * 0.15, foreL = H * 0.13;                  // arm lengths/thickness follow the school-guy reference (slimmer, a little shorter)
    const rArm = H * 0.025 * limbG, rFore = H * 0.0215 * limbG, rWrist = H * 0.016 * lerp(0.95, 1.2, W);
    const legK = 0.86, hipX = 0.66;                            // slimmer legs, set further apart so they read as two separate legs
    const rThigh = H * lerp(0.043, 0.05, AGE) * limbG * (female ? 1.04 : 1) * legK, rKnee = H * 0.034 * lerp(0.95, 1.25, W) * legK, rAnkle = H * 0.022 * lerp(0.95, 1.15, W) * legK;

    // ---------------- materials ----------------
    const skinC = new T.Color(SKINS[o.skin] ?? o.skin ?? SKINS.medium);
    const M = {
      skin: new T.MeshPhysicalMaterial({ color: skinC, roughness: 0.6, sheen: 0.25, sheenColor: new T.Color(0xffc4a8), sheenRoughness: 0.7 }),
      skinDark: new T.MeshStandardMaterial({ color: skinC.clone().multiplyScalar(0.82), roughness: 0.6 }),
      lip: new T.MeshStandardMaterial({ color: skinC.clone().lerp(new T.Color(0x8a3b3b), 0.45), roughness: 0.45 }),
      mouthIn: new T.MeshStandardMaterial({ color: 0x4a1418, roughness: 0.8 }), tongue: new T.MeshStandardMaterial({ color: 0xd8656e, roughness: 0.5 }), teeth: new T.MeshStandardMaterial({ color: 0xfbfaf6, roughness: 0.3 }),
      eyeWhite: new T.MeshPhysicalMaterial({ color: 0xfbfbfb, roughness: 0.15, clearcoat: 1 }), lash: new T.MeshStandardMaterial({ color: 0x120c0a, roughness: 0.6 }),
      hair: new T.MeshPhysicalMaterial({ color: HAIRC[o.hairColor] ?? o.hairColor ?? HAIRC.black, roughness: 0.45, sheen: 0.8, sheenColor: new T.Color(0x7a5a48), sheenRoughness: 0.35 }),
      shirt: new T.MeshPhysicalMaterial({ color: outerW.color, roughness: 0.82, sheen: 0.4, sheenColor: new T.Color(0xdfe6ff) }),     // sleeves, shoulders
      inner: new T.MeshPhysicalMaterial({ color: topW.color, roughness: 0.82, sheen: 0.4, sheenColor: new T.Color(0xdfe6ff) }),      // collar, buttons
      bottom: new T.MeshPhysicalMaterial({ color: botW.color, roughness: 0.85, sheen: 0.3, sheenColor: new T.Color(0x8899cc), map: botW.type === 'jeans' ? denimTex() : null }),
      accent: new T.MeshStandardMaterial({ color: col.accent, roughness: 0.6 }),
      sock: new T.MeshStandardMaterial({ color: 0xf2f3f6, roughness: 0.9 }),
      shoe: new T.MeshPhysicalMaterial({ color: shoeW.color, roughness: shoeW.type === 'sneakers' ? 0.7 : 0.4, clearcoat: shoeW.type === 'sneakers' ? 0 : 0.5, clearcoatRoughness: 0.25 }),
      sole: new T.MeshStandardMaterial({ color: 0x2b2b30, roughness: 0.8 }), white: new T.MeshStandardMaterial({ color: 0xf7f7f5, roughness: 0.6 }),
      shoe2: new T.MeshStandardMaterial({ color: shoeW.color2 ?? 0xffffff, roughness: 0.6 }),
      belt: new T.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.5 }), metal: new T.MeshStandardMaterial({ color: 0xc9ccd4, metalness: 0.85, roughness: 0.25 }),
      blush: new T.MeshBasicMaterial({ color: 0xff6f7a, transparent: true, opacity: 0, depthWrite: false }),
    };
    M.brow = new T.MeshStandardMaterial({ color: M.hair.color.clone().multiplyScalar(0.9), roughness: 0.7 });
    M.hairDS = M.hair.clone(); M.hairDS.side = T.DoubleSide;

    const root = new T.Group(), body = J(root);
    const hips = J(body, 0, legLen, 0), spine = J(hips, 0, torsoLen * 0.12, 0), chest = J(spine, 0, torsoLen * 0.46, 0);
    const neck = J(chest, 0, torsoLen * 0.42, 0), head = J(neck, 0, H * 0.035, 0);

    // ---------------- torso (one smooth piece: waist → chest → shoulders) ----------------
    const bellyK = Math.pow(Math.max(0, (W - 0.5) / 0.5), 1.2);   // tummy only on heavier bodies
    const top = M.shirt;
    const sq = (v) => v * v;
    const bellyF = (yn) => bellyK * 0.55 * Math.exp(-sq((yn - 0.24) / 0.2));
    const bustF = (x, yn) => (female && AGE > 0.45 ? 0.22 : 0) * Math.exp(-sq((yn - 0.64) / 0.1)) * Math.exp(-sq((Math.abs(x) / torsoR - 0.45) / 0.35));
    // hem: tucked shirts end at the waist; t-shirts / tops / hoodies hang over the trousers (a kurti-length top hangs further)
    const kurti = topW.type === 'top' && topW.long && !wear.wrap;
    const hemY = -torsoLen * (kurti ? 0.62 : wear.untuck ? 0.19 : 0.16);
    const thighOut = hipR * hipX + rThigh * 1.2;                // how far the thighs reach sideways — a loose hem has to cover them
    const hemR = Math.max(hipR * (kurti ? 1.3 : !wear.untuck ? 0.95 : layerW?.type === 'hoodie' ? 1.05 : topW.type === 'top' && !wear.wrap ? 1.17 : 1.1), wear.untuck ? thighOut * (kurti ? 1.12 : 1.03) : 0);
    const torsoProfile = [[0.001, hemY], [hemR, hemY + 0.002], wear.untuck ? [Math.max(hipR * (kurti ? 1.2 : 1.05), thighOut * (kurti ? 1.08 : 0.98)), -torsoLen * 0.08] : [hipR, -torsoLen * 0.05], [torsoR * (0.93 + bellyK * 0.2), torsoLen * 0.12], [torsoR * (0.95 + bellyK * 0.24), torsoLen * 0.32],
      [torsoR * (female ? 1.02 : 1.0), torsoLen * 0.55], [torsoR * 1.03, torsoLen * 0.72], [torsoR * 0.94, torsoLen * 0.84], [torsoR * 0.62, torsoLen * 0.93], [H * 0.032, torsoLen * 0.985], [0.001, torsoLen]];
    const torsoGeo = lathe(torsoProfile.map(([r, y]) => [r, y]), 56), tp = torsoGeo.attributes.position, tuv = torsoGeo.attributes.uv;
    for (let i = 0; i < tp.count; i++) {                         // belly + chest shaping pushed into the front of the torso (no separate blobs)
      const y = tp.getY(i) / torsoLen, z = tp.getZ(i);
      tuv.setY(i, (tp.getY(i) - hemY) / (torsoLen - hemY));    // v = height, so the fabric texture can paint bands, cuts and the logo
      if (wear.untuck && y < 0.1) { const t = clamp((0.1 - y) / (0.1 - hemY / torsoLen), 0, 1); tp.setZ(i, z * (1 + (kurti ? 0.4 : 0.26) * smooth(t))); }   // a loose hem sits clear of the hips
      if (z <= 0) continue;
      const z2 = tp.getZ(i);
      tp.setZ(i, z2 * (1 + bellyF(y) + bustF(tp.getX(i), y)));
    }
    torsoGeo.computeVertexNormals();
    const layerK = wear.wrap ? 1.05 : 1, zS = (0.68 + bellyK * 0.08) * layerK;
    // where the torso surface is (torso-local: origin at the hips) — used to sit buttons, strings and the dupatta on the body
    function surfZ(x, ty, front = true) {
      let r = torsoProfile[1][0];
      for (let i = 1; i < torsoProfile.length - 1; i++) { const [r0, y0] = torsoProfile[i], [r1, y1] = torsoProfile[i + 1]; if (ty >= y0 && ty <= y1) { r = lerp(r0, r1, (ty - y0) / Math.max(1e-6, y1 - y0)); break; } if (ty > y1) r = r1; }
      const base = Math.sqrt(Math.max(0, r * r - x * x)) * zS, yn = ty / torsoLen;
      return front ? base * (1 + bellyF(yn) + bustF(x, yn)) : base;
    }
    const torsoTex = paintTorso();
    M.torso = new T.MeshPhysicalMaterial({ map: torsoTex, roughness: 0.82, sheen: 0.3, sheenColor: new T.Color(0xeeeeee) });
    const torso = add(spine, torsoGeo, M.torso, 0, -torsoLen * 0.12, 0);
    const torsoFlow = wear.untuck ? { mesh: torso, top: 0 } : null;          // a loose hem / kurti folds over the thighs when sitting
    torso.scale.set(layerK > 1 ? 1.04 : 1, 1, zS);
    // shoulders: a low, wide ellipsoid that bridges the torso and the arms
    const bareShoulders = !wear.wrap && topW.sleeves === 'none';
    const yoke = add(chest, new T.SphereGeometry(1, 40, 24), bareShoulders ? M.skin : top, 0, torsoLen * 0.26, 0); yoke.scale.set(shoulderHalf * 0.98 * (layerK > 1 ? 1.04 : 1), torsoLen * 0.13 * layerK, torsoR * 0.62 * layerK);

    // ---- the torso fabric: base colour + pattern, skin cut-outs, layer details and the mascot logo ----
    function paintTorso() {
      const TW = 1024, TH = 1024, c = document.createElement('canvas'); c.width = TW; c.height = TH;
      const g = c.getContext('2d'), tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
      const css = (h) => '#' + new T.Color(h).getHexString(), shade = (h, k) => '#' + new T.Color(h).multiplyScalar(k).getHexString();
      const rowOf = (y) => (1 - (y - hemY) / (torsoLen - hemY)) * TH;
      const halfU = (w) => Math.asin(Math.min(0.95, w / 2 / (torsoR * 1.03))) / (2 * Math.PI) * TW;   // half-width in pixels of something w metres wide on the chest
      const front = (fn) => { for (const ox of [0, TW]) { g.save(); g.translate(ox, 0); fn(); g.restore(); } };   // the chest centre sits on the texture seam (u = 0 / 1)
      const skin = '#' + skinC.getHexString();
      function fabric(spec, x0, x1, y0 = 0, y1 = TH) {
        g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
        g.fillStyle = css(spec.color); g.fillRect(x0, y0, x1 - x0, y1 - y0);
        const c2 = spec.color2 != null ? css(spec.color2) : shade(spec.color, 0.7);
        if (spec.pattern === 'stripes') { g.fillStyle = c2; for (let y = 0; y < TH; y += 56) g.fillRect(x0, y, x1 - x0, 22); }
        else if (spec.pattern === 'checks') { g.fillStyle = c2; g.globalAlpha = 0.45; for (let x = -64; x < TW + 64; x += 64) g.fillRect(x, 0, 22, TH); for (let y = 0; y < TH; y += 64) g.fillRect(0, y, TW, 22); g.globalAlpha = 1; }
        else if (spec.pattern === 'dots') { g.fillStyle = c2; for (let y = 20, r = 0; y < TH; y += 44, r++) for (let x = (r % 2) * 22; x < TW + 44; x += 44) { g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); } }
        else if (spec.pattern === 'band') { g.fillStyle = c2; g.fillRect(x0, rowOf(torsoLen * 0.62), x1 - x0, rowOf(torsoLen * 0.54) - rowOf(torsoLen * 0.62)); }
        g.restore();
      }
      function logo(img, cy, w) {
        if (!img) return;
        const hw = halfU(w), h = w * img.height / img.width, ph = h / (torsoLen - hemY) * TH;
        front(() => g.drawImage(img, -hw, rowOf(cy) - ph / 2, hw * 2, ph));
      }
      function paint(img) {
        g.clearRect(0, 0, TW, TH);
        if (wear.wrap) {
          const L = layerW, hood = L.type === 'hoodie';
          fabric({ color: L.color }, 0, TW);
          g.fillStyle = shade(L.color, 0.86); g.fillRect(0, rowOf(hemY + torsoLen * 0.08), TW, TH);                       // hem rib
          if (hood && !L.open) { const pw = halfU(torsoR * 1.15), y0 = rowOf(torsoLen * 0.34), y1 = rowOf(hemY + torsoLen * 0.1);   // kangaroo pocket
            front(() => { g.fillStyle = shade(L.color, 0.93); g.beginPath(); g.moveTo(-pw * 0.7, y0); g.lineTo(pw * 0.7, y0); g.lineTo(pw, y1); g.lineTo(-pw, y1); g.closePath(); g.fill(); g.strokeStyle = shade(L.color, 0.7); g.lineWidth = 4; g.stroke(); }); }
          if (L.open) {
            const sw = halfU(torsoR * 0.62);
            fabric(topW, 0, sw); fabric(topW, TW - sw, TW);
            if (topW.logo) { g.save(); g.beginPath(); g.rect(0, 0, sw, TH); g.rect(TW - sw, 0, sw, TH); g.clip(); logo(img, torsoLen * 0.58, torsoR * 0.62); g.restore(); }
            g.fillStyle = shade(L.color, 0.6); g.fillRect(sw - 3, 0, 8, TH); g.fillRect(TW - sw - 5, 0, 8, TH);           // jacket edges
          } else {
            if (L.type === 'jacket') { g.fillStyle = '#9aa0a8'; g.fillRect(0, 0, 3, TH); g.fillRect(TW - 3, 0, 3, TH); }     // zip
            if (L.logo !== false) logo(img, torsoLen * 0.6, torsoR * (hood ? 0.95 : 0.6));
          }
          return;
        }
        fabric(topW, 0, TW);
        const tt = topW.type;
        if (tt === 'tshirt' || tt === 'top' || tt === 'mini_top' || tt === 'tank_top') { g.fillStyle = shade(topW.color, 0.85); g.fillRect(0, 0, TW, rowOf(torsoLen * 0.965)); }   // neck rib
        if (tt === 'mini_top') { g.fillStyle = skin; g.fillRect(0, rowOf(torsoLen * 0.4), TW, TH); g.fillStyle = shade(topW.color, 0.8); g.fillRect(0, rowOf(torsoLen * 0.4) - 6, TW, 6); }
        if (tt === 'tank_top') {
          g.fillStyle = skin; g.fillRect(0, 0, TW, rowOf(torsoLen * 0.8));        // straps are real 3D bands (see the outfit details)
          g.fillStyle = shade(topW.color, 0.82); g.fillRect(0, rowOf(torsoLen * 0.8), TW, 6);
        }
        if (tt === 'top') { const sw = halfU(torsoR * 0.42); front(() => { g.fillStyle = skin; g.beginPath(); g.ellipse(0, rowOf(torsoLen * 0.95), sw, rowOf(torsoLen * 0.86) - rowOf(torsoLen * 0.95), 0, 0, Math.PI * 2); g.fill(); }); }
        if (tt === 'shirt') { const px = halfU(torsoR * 0.9), pw = halfU(torsoR * 0.36), y0 = rowOf(torsoLen * 0.66), y1 = rowOf(torsoLen * 0.5);   // chest pocket on the left
          g.strokeStyle = shade(topW.color, 0.72); g.lineWidth = 3; g.strokeRect(px - pw, y0, pw * 2, y1 - y0); g.beginPath(); g.moveTo(px - pw, y0 + 14); g.lineTo(px + pw, y0 + 14); g.stroke(); }
        if (topW.logo) logo(img, torsoLen * (tt === 'mini_top' ? 0.64 : 0.6), torsoR * (tt === 'tank_top' ? 0.7 : 0.9));
      }
      paint(null);
      if (wear.wrap ? (layerW.logo !== false || (layerW.open && topW.logo)) : topW.logo) withLogo((img) => { paint(img); tex.needsUpdate = true; });
      return tex;
    }

    // buttons + collar
    const collar = (m = top) => { for (const s of [-1, 1]) { const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(s * H * 0.04, H * 0.008); sh.lineTo(s * H * 0.02, -H * 0.036); sh.closePath(); const c = add(chest, new T.ExtrudeGeometry(sh, { depth: 0.004, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 1 }), m, s * 0.005, torsoLen * 0.4, torsoR * 0.55); c.rotation.x = -0.35; c.rotation.y = s * 0.5; } };
    const buttons = (n = 4) => { for (let i = 0; i < n; i++) { const y = torsoLen * (0.08 + i * 0.13); add(spine, new T.SphereGeometry(H * 0.004, 10, 8), M.inner, 0, y, surfZ(0, y + torsoLen * 0.12) + H * 0.002); } };

    // ---------------- neck + head (face rig from the kid) ----------------
    add(neck, new T.CylinderGeometry(H * lerp(0.03, 0.027, AGE) * lerp(1, 1.25, W), H * lerp(0.034, 0.031, AGE) * lerp(1, 1.3, W), H * 0.06, 24), M.skin, 0, H * 0.012, 0.002);
    const headGeo = new T.SphereGeometry(1, 80, 60), hp = headGeo.attributes.position;
    const gauss = (x, y, z, cx, cy, cz, s) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2) / (s * s));
    const jawTaper = lerp(0.16, 0.24, AGE) * (female ? 0.9 : 1), chinFwd = lerp(0.03, 0.07, AGE), cheekPuff = lerp(0.045, 0.02, AGE) + W * 0.045;
    for (let i = 0; i < hp.count; i++) {
      let x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i);
      x *= lerp(0.96, 0.9, AGE) * lerp(1, 1.08, W); z *= 0.97; y *= lerp(0.97, 1.06, AGE);
      if (y < 0) { const k = -y; x *= 1 - jawTaper * k * k * (1 - W * 0.6); z *= 1 - 0.05 * k * k; if (z > 0) z += chinFwd * k * k * Math.max(0, z); }
      const cheek = Math.max(gauss(x, y, z, 0.55, -0.28, 0.66, 0.32), gauss(x, y, z, -0.55, -0.28, 0.66, 0.32));
      const n = Math.hypot(x, y, z) || 1; x += x / n * cheek * cheekPuff; y += y / n * cheek * cheekPuff; z += z / n * cheek * cheekPuff;
      if (W > 0.6 && y < -0.4) { const k = (W - 0.6) * 2.5 * smooth(Math.min(1, (-y - 0.4) * 2)); x *= 1 + 0.08 * k; z *= 1 + 0.06 * k; }   // double chin
      z += gauss(x, y, z, 0, 0.3, 0.9, 0.35) * 0.02;
      hp.setXYZ(i, x * R, y * R, z * R);
    }
    headGeo.computeVertexNormals();
    const headC = J(head, 0, R * 0.92, 0);
    add(headC, headGeo, M.skin);
    for (const s of [-1, 1]) { const ear = J(headC, s * R * 0.9, -R * 0.05, -R * 0.06); ear.rotation.y = s * 0.25; const e = add(ear, new T.SphereGeometry(1, 20, 14), M.skin); e.scale.set(R * 0.1, R * 0.24, R * 0.16); const ei = add(ear, new T.SphereGeometry(1, 14, 10), M.skinDark, s * R * 0.03, 0, R * 0.02); ei.scale.set(R * 0.05, R * 0.15, R * 0.09); }
    const noseS = lerp(1, 1.45, AGE);
    const nose = add(headC, new T.SphereGeometry(1, 22, 16), M.skin, 0, -R * 0.2, R * 0.955); nose.scale.set(R * 0.085 * noseS, R * 0.075 * noseS, R * 0.085 * noseS);
    if (AGE > 0.4) { const bridge = add(headC, new T.CylinderGeometry(R * 0.035, R * 0.06, R * 0.28, 12), M.skin, 0, -R * 0.06, R * 0.93); bridge.rotation.x = -0.28; }
    for (const s of [-1, 1]) { const ns = add(headC, new T.SphereGeometry(1, 12, 10), M.skinDark, s * R * 0.042 * noseS, -R * 0.245, R * 0.985); ns.scale.set(R * 0.022, R * 0.014, R * 0.014); }
    const blush = [-1, 1].map((s) => { const b = new T.Mesh(new T.CircleGeometry(R * 0.16, 24), M.blush); b.position.set(s * R * 0.55, -R * 0.22, R * 0.82); b.rotation.y = s * 0.6; headC.add(b); return b; });
    // eyes
    const eyeR = R * lerp(0.27, 0.19, AGE), irisTex = canvasTex((g, Wd, Hd) => { const cx = Wd / 2, cy = Hd / 2, r = Wd / 2; const gr = g.createRadialGradient(cx, cy, r * 0.15, cx, cy, r); gr.addColorStop(0, '#6b3d1e'); gr.addColorStop(0.6, '#3a2010'); gr.addColorStop(1, '#0d0806'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); g.globalAlpha = 0.35; g.strokeStyle = '#a5683a'; g.lineWidth = 2; for (let i = 0; i < 70; i++) { const a = (i / 70) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.32, cy + Math.sin(a) * r * 0.32); g.lineTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8); g.stroke(); } g.globalAlpha = 1; g.fillStyle = '#050403'; g.beginPath(); g.arc(cx, cy, r * 0.34, 0, Math.PI * 2); g.fill(); }, 256, 256);
    const irisM = new T.MeshPhysicalMaterial({ map: irisTex, roughness: 0.1, clearcoat: 1 });
    const eyes = [-1, 1].map((s) => {
      const socket = J(headC, s * R * lerp(0.36, 0.33, AGE), R * lerp(0.05, 0.08, AGE), R * lerp(0.66, 0.74, AGE)), ball = J(socket);
      add(ball, new T.SphereGeometry(eyeR, 28, 20), M.eyeWhite);
      const th = 0.78, ig = new T.SphereGeometry(eyeR * 1.004, 36, 14, 0, Math.PI * 2, 0, th), ip = ig.attributes.position, iuv = ig.attributes.uv;
      for (let i = 0; i < ip.count; i++) { const x = ip.getX(i), y = ip.getY(i), z = ip.getZ(i), t = Math.acos(Math.min(1, y / (eyeR * 1.004))) / th, a = Math.atan2(z, x); iuv.setXY(i, 0.5 + 0.5 * t * Math.cos(a), 0.5 + 0.5 * t * Math.sin(a)); }
      add(ball, ig, irisM).rotation.x = Math.PI / 2;
      const hl = new T.Mesh(new T.SphereGeometry(eyeR * 0.11, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff })); hl.position.set(-eyeR * 0.28, eyeR * 0.2, eyeR * 0.96); socket.add(hl);
      const upper = J(socket), lower = J(socket);
      add(upper, new T.SphereGeometry(eyeR * 1.04, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), M.skin);
      add(upper, new T.TorusGeometry(eyeR * 1.045, eyeR * (female ? 0.075 : 0.06), 8, 36, Math.PI), M.lash).rotation.x = Math.PI / 2;
      add(lower, new T.SphereGeometry(eyeR * 1.03, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.skin);
      const hl2 = new T.Mesh(new T.SphereGeometry(eyeR * 0.05, 8, 6), hl.material); hl2.position.set(eyeR * 0.22, -eyeR * 0.18, eyeR * 0.97); socket.add(hl2);
      socket.rotation.y = s * 0.12; socket.scale.y = 1.1; return { socket, ball, upper, lower };
    });
    const brows = [-1, 1].map((s) => { const g = J(headC, s * R * 0.35, R * 0.42, R * 0.88); g.rotation.y = s * 0.3; const c = new T.CatmullRomCurve3([new T.Vector3(-R * 0.17, -R * 0.02, 0), new T.Vector3(-R * 0.05, R * 0.03, R * 0.01), new T.Vector3(R * 0.08, R * 0.03, 0), new T.Vector3(R * 0.18, -R * 0.03, -R * 0.03)]); add(g, new T.TubeGeometry(c, 20, R * lerp(0.021, 0.03, AGE) * (female ? 0.75 : 1), 8), M.brow).scale.x = s; return g; });
    const mouth = J(headC, 0, -R * 0.45, R * 0.86); mouth.rotation.x = -0.3;
    const lipLine = add(mouth, new T.BufferGeometry(), M.lip);
    const openG = J(mouth, 0, 0, -R * 0.005), os = new T.Shape(); os.moveTo(-1, 0); os.bezierCurveTo(-0.6, 0.12, 0.6, 0.12, 1, 0); os.bezierCurveTo(0.7, -1.1, -0.7, -1.1, -1, 0);
    add(openG, new T.ShapeGeometry(os, 24), M.mouthIn); const teeth = add(openG, new T.PlaneGeometry(1.15, 0.17), M.teeth, 0, -0.08, 0.002); add(openG, new T.CircleGeometry(0.5, 20), M.tongue, 0, -0.52, 0.001).scale.set(0.9, 0.34, 1);
    function buildLip(smile, width, open) {
      const w = R * width, c = -smile * R * 0.08, y0 = open > 0.05 ? R * 0.006 : 0, zf = R * 0.012 + Math.max(0, -smile) * R * 0.03;
      const curve = new T.CatmullRomCurve3([new T.Vector3(-w, y0 + smile * R * 0.02, -R * 0.02 + zf), new T.Vector3(-w * 0.5, y0 + c * 0.75, zf), new T.Vector3(0, y0 + c, zf + R * 0.005), new T.Vector3(w * 0.5, y0 + c * 0.75, zf), new T.Vector3(w, y0 + smile * R * 0.02, -R * 0.02 + zf)]);
      lipLine.geometry.dispose(); lipLine.geometry = new T.TubeGeometry(curve, 24, R * (female && AGE > 0.4 ? 0.024 : 0.016) * (1 + open * 0.25), 8);
    }
    if (o.mustache) { const mc = new T.CatmullRomCurve3([new T.Vector3(-R * 0.26, -R * 0.06, -R * 0.04), new T.Vector3(-R * 0.1, R * 0.02, R * 0.01), new T.Vector3(0, R * 0.01, R * 0.02), new T.Vector3(R * 0.1, R * 0.02, R * 0.01), new T.Vector3(R * 0.26, -R * 0.06, -R * 0.04)]); add(headC, new T.TubeGeometry(mc, 24, R * 0.045, 10), M.hair, 0, -R * 0.36, R * 0.9).scale.y = 0.7; }
    if (wear.eyewear) {
      const sun = wear.eyewear.type === 'sunglasses', gr = eyeR * (sun ? 1.5 : 1.35), gm = new T.MeshStandardMaterial({ color: wear.eyewear.color ?? 0x1f1f24, roughness: 0.35, metalness: 0.4 });
      const lensM = new T.MeshPhysicalMaterial({ color: wear.eyewear.lens ?? 0x15171c, roughness: 0.05, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 });
      for (const s of [-1, 1]) {
        const rim = add(headC, new T.TorusGeometry(gr, R * (sun ? 0.026 : 0.018), 8, 32), gm, s * R * 0.34, R * 0.07, R * 0.95); rim.rotation.y = s * 0.12; rim.scale.x = sun ? 1.12 : 1;
        if (sun) { const lens = add(headC, new T.CylinderGeometry(gr, gr, R * 0.012, 32), lensM, s * R * 0.34, R * 0.07, R * 0.955); lens.rotation.set(Math.PI / 2, 0, 0); lens.rotation.order = 'YXZ'; lens.rotation.y = s * 0.12; lens.scale.x = 1.12; }
        add(headC, new T.BoxGeometry(R * 0.02, R * 0.02, R * 0.65), gm, s * R * 0.86, R * 0.07, R * 0.55);
      }
      add(headC, new T.BoxGeometry(R * 0.2, R * 0.02, R * 0.02), gm, 0, R * 0.12, R * 0.99);
    }

    // ---------------- hair ----------------
    function hairCap(lineFn, puff = 0.035) {
      const g = new T.SphereGeometry(R * 1.08, 80, 40, 0, Math.PI * 2, 0, Math.PI * 0.82), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i) / R, y = p.getY(i) / R, z = p.getZ(i) / R; x *= lerp(0.95, 0.9, AGE) * lerp(1, 1.06, W);
        const a = Math.atan2(x, z), hl = lineFn(a), band = clamp((y - hl + 0.06) / 0.12, 0, 1), sb = band * band * (3 - 2 * band);
        const r = sb <= 0 ? 0.7 : lerp(0.7, 1, Math.pow(sb, 0.35)) + puff * Math.sin(x * 9 + z * 4) * Math.sin(y * 7 + x * 3) * sb;
        p.setXYZ(i, x * R * r, y * R * r, z * R * r);
      }
      g.computeVertexNormals(); return add(headC, g, M.hair, 0, R * 0.02, -R * 0.01);
    }
    const strand = (len, w) => { const g2 = new T.ConeGeometry(w, len, 10, 6), p2 = g2.attributes.position; for (let i = 0; i < p2.count; i++) { const y = p2.getY(i) / len + 0.5; p2.setZ(i, p2.getZ(i) + Math.pow(1 - y, 2) * len * 0.35); p2.setX(i, p2.getX(i) * 1.6); } g2.computeVertexNormals(); return g2; };
    const front = (lo, hi, back, exp = 1.5) => (a) => { const f = Math.cos(a); return f > 0 ? lerp(lo, hi, Math.pow(f, exp)) : lerp(lo, back, Math.pow(-f, 0.8)); };
    if (hairStyle === 'short' || hairStyle === 'side_part' || hairStyle === 'spiky') {
      hairCap(front(0.12, 0.6, -0.5), hairStyle === 'spiky' ? 0.06 : 0.035);
      const fr = J(headC, 0, R * 0.56, R * 0.72);
      for (let k = 0; k < 7; k++) { const t = (k - 3) / 3, m = add(fr, strand(R * (0.42 - Math.abs(t) * 0.06), R * 0.14), M.hair, t * R * 0.45 + R * 0.04, -Math.abs(t) * R * 0.08, -Math.abs(t) * R * 0.2);
        if (hairStyle === 'spiky') m.rotation.set(-0.4, 0, t * 0.5); else m.rotation.set(Math.PI + 0.95, t * 0.4, (hairStyle === 'side_part' ? -0.95 : -0.7) + t * 0.1); }
    } else if (hairStyle === 'curly') {
      hairCap(front(0.16, 0.6, -0.5), 0.05);
      const N = 70;
      for (let k = 0; k < N; k++) {                                // a cloud of small curls over the top and back
        const y = 1 - (k + 0.5) / N * 1.25, r = Math.sqrt(Math.max(0, 1 - y * y)), th = k * 2.39996, x = r * Math.sin(th), z = r * Math.cos(th);
        if (z > 0.35 && y < 0.62) continue;                       // keep the forehead clear
        const c = add(headC, new T.SphereGeometry(R * (0.15 + (k % 3) * 0.018), 12, 10), M.hair, x * R * 1.0 * lerp(0.95, 0.9, AGE) * lerp(1, 1.06, W), y * R * 1.02 + R * 0.04, z * R * 1.0);
        c.scale.set(1, 0.9, 1);
      }
      const fr = J(headC, 0, R * 0.62, R * 0.7);
      for (let k = 0; k < 5; k++) { const t = (k - 2) / 2; add(fr, new T.SphereGeometry(R * 0.15, 12, 10), M.hair, t * R * 0.42, -Math.abs(t) * R * 0.1, -Math.abs(t) * R * 0.18); }
    } else if (hairStyle === 'spikes') {
      hairCap(front(0.14, 0.58, -0.5), 0.04);
      const cone = new T.ConeGeometry(R * 0.2, R * 0.62, 10), up = new T.Vector3(0, 1, 0);
      const spots = [[0, 0.95, 0.3, 0, 0.9, 0.75], [-0.35, 0.85, 0.35, -0.5, 0.8, 0.6], [0.35, 0.85, 0.35, 0.5, 0.8, 0.6], [-0.2, 0.95, -0.15, -0.3, 1, -0.4], [0.2, 0.95, -0.15, 0.3, 1, -0.4],
        [-0.6, 0.6, -0.3, -0.8, 0.6, -0.4], [0.6, 0.6, -0.3, 0.8, 0.6, -0.4], [0, 0.75, -0.6, 0, 0.5, -1], [-0.4, 0.5, -0.75, -0.4, 0.3, -1], [0.4, 0.5, -0.75, 0.4, 0.3, -1], [0, 0.9, 0.55, 0.1, 0.55, 1]];
      for (const [x, y, z, dx, dy, dz] of spots) { const m = add(headC, cone, M.hair, x * R * 0.9, y * R + R * 0.12, z * R * 0.9); m.quaternion.setFromUnitVectors(up, new T.Vector3(dx, dy, dz).normalize()); }
    } else if (hairStyle === 'receding') {
      hairCap((a) => { const f = Math.cos(a); return f > 0 ? lerp(0.0, 0.9, Math.pow(f, 0.6)) : lerp(0.0, -0.55, Math.pow(-f, 0.8)); }, 0.02);
      if (o.age > 0.6) { const top = add(headC, new T.SphereGeometry(R * 1.0, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.32), M.skin, 0, R * 0.02, R * 0.02); top.scale.set(0.97, 1, 1); }
    } else {
      hairCap(front(0.05, 0.62, -0.75), 0.03);
      const fr = J(headC, 0, R * 0.62, R * 0.7);
      for (let k = 0; k < 6; k++) { const t = (k - 2.5) / 2.5, m = add(fr, strand(R * 0.34, R * 0.14), M.hair, t * R * 0.46, -R * 0.02, -Math.abs(t) * R * 0.18); m.rotation.set(Math.PI + 0.55, t * 0.3, t * 0.5); }
      if (hairStyle === 'plaits') for (const s of [-1, 1]) { const pl = J(headC, s * R * 0.78, -R * 0.35, -R * 0.45); for (let k = 0; k < 7; k++) { const b = add(pl, new T.SphereGeometry(R * (0.17 - k * 0.012), 14, 10), M.hair, s * R * 0.04 * k, -R * 0.22 * k, -R * 0.02 * k); b.scale.set(1, 1.15, 1); } for (const t of [-1, 1]) { const bw = add(pl, new T.SphereGeometry(R * 0.12, 12, 8), M.accent, s * R * 0.3 + t * R * 0.1, -R * 1.5, 0); bw.scale.set(1.2, 0.6, 0.5); } }
      if (hairStyle === 'bun') { const bun = add(headC, new T.SphereGeometry(R * 0.36, 24, 16), M.hair, 0, R * 0.25, -R * 1.0); bun.scale.set(1, 0.85, 0.8); add(headC, new T.TorusGeometry(R * 0.3, R * 0.04, 6, 20), M.accent, 0, R * 0.25, -R * 0.85).rotation.y = 0; }
      if (hairStyle === 'long') {                                 // long wavy hair falling behind the shoulders
        const cg = new T.CylinderGeometry(R * 0.97, R * 1.22, R * 2.2, 48, 14, true, Math.PI / 2 - 0.5, Math.PI + 1.0), cp = cg.attributes.position;
        for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i), a = Math.atan2(x, z), k = 1 + 0.05 * Math.sin(y / R * 5 + a * 4) * clamp((R * 1.1 - y) / R, 0, 1); cp.setXYZ(i, x * k * lerp(0.95, 0.9, AGE) * lerp(1, 1.06, W), y, z * k); }
        cg.computeVertexNormals();
        add(headC, cg, M.hairDS, 0, -R * 0.75, -R * 0.08);
      }
      if (hairStyle === 'ponytail') { const pt = J(headC, 0, R * 0.3, -R * 0.95); for (let k = 0; k < 6; k++) add(pt, new T.SphereGeometry(R * (0.2 - k * 0.022), 14, 10), M.hair, 0, -R * 0.2 * k, -R * 0.1 * k); add(pt, new T.TorusGeometry(R * 0.14, R * 0.04, 6, 16), M.accent).rotation.x = 1.2; }
    }

    // ---------------- arms ----------------
    const sleeves = wear.wrap ? 'long' : topW.sleeves, longSleeve = sleeves === 'long', sk = wear.wrap ? 1.05 : 1;
    function makeArm(s) {
      const sh = J(chest, s * shoulderHalf * 0.9, torsoLen * 0.28, 0);
      add(sh, new T.SphereGeometry(rArm * 1.12 * sk, 24, 18), sleeves === 'none' ? M.skin : top);
      const upper = J(sh);
      if (longSleeve) add(upper, limb(rArm * 1.1 * sk, rFore * 1.12 * sk, upperL), top);
      else {
        add(upper, limb(rArm, rFore, upperL), M.skin);
        if (sleeves === 'short') add(upper, limb(rArm * 1.12, rArm * 1.08, upperL * 0.5), top);                       // short sleeve over the upper arm
        else if (sleeves === 'puff') { const pf = add(upper, new T.SphereGeometry(1, 24, 16), top, 0, -upperL * 0.12, 0); pf.scale.set(rArm * 1.45, upperL * 0.24, rArm * 1.45); }
      }
      const fore = J(upper, 0, -upperL, 0);
      add(fore, new T.SphereGeometry((longSleeve ? rFore * 1.18 * sk : rFore), 20, 14), longSleeve ? top : M.skin);
      add(fore, limb(longSleeve ? rFore * 1.16 * sk : rFore, longSleeve ? rWrist * 1.3 * sk : rWrist, foreL), longSleeve ? top : M.skin);
      if (longSleeve) add(fore, new T.CylinderGeometry(rWrist * 1.32 * sk, rWrist * 1.3 * sk, H * (wear.wrap ? 0.03 : 0.02), 20), wear.wrap ? new T.MeshStandardMaterial({ color: new T.Color(outerW.color).multiplyScalar(0.86), roughness: 0.85 }) : top, 0, -foreL + H * 0.008, 0);
      const hand = J(fore, 0, -foreL - rWrist * 0.4, 0), hs = H / 1.42;
      const palm = add(hand, new T.SphereGeometry(1, 20, 16), M.skin, 0, -0.03 * hs, 0); palm.scale.set(0.031 * hs * lerp(1, 1.15, W), 0.04 * hs, 0.016 * hs * lerp(1, 1.2, W));
      const fingers = [];
      for (let f = 0; f < 4; f++) { const base = J(hand, s * (-0.02 + f * 0.0135) * hs, -0.062 * hs, 0.004 * hs), len = [0.026, 0.03, 0.029, 0.023][f] * hs; add(base, new T.CapsuleGeometry(0.0074 * hs, len, 6, 10), M.skin, 0, -len / 2, 0); const tip = J(base, 0, -len - 0.004 * hs, 0); add(tip, new T.CapsuleGeometry(0.0068 * hs, len * 0.75, 6, 10), M.skin, 0, -len * 0.38, 0); fingers.push({ base, tip }); }
      const thumb = J(hand, s * 0.028 * hs, -0.025 * hs, 0.012 * hs); thumb.rotation.set(0.2, 0, -s * 0.7); add(thumb, new T.CapsuleGeometry(0.0088 * hs, 0.022 * hs, 6, 10), M.skin, 0, -0.016 * hs, 0);
      const grip = J(hand, 0, -0.07 * hs, 0.02 * hs);
      return { sh, upper, fore, hand, fingers, thumb, grip };
    }
    const armL = makeArm(-1), armR = makeArm(1);

    // ---------------- legs + lower outfit ----------------
    const flowy = torsoFlow ? [torsoFlow] : [];                 // skirt-like meshes that bend with the thighs
    const bt = botW.type, full = ['jeans', 'pants', 'trousers'].includes(bt), shorts = bt === 'shorts', skirt = bt === 'skirt' || bt === 'mini_skirt', saree = bt === 'saree';
    const fit = { jeans: [1.08, 1.12, 1.12, 1.42], pants: [1.15, 1.3, 1.28, 1.7], trousers: [1.12, 1.25, 1.22, 1.6] }[bt];
    const st = shoeW.type, socks = shoeW.socks ?? (st === 'sneakers' ? 'ankle' : st === 'formal' ? 'long' : 'none');
    function makeLeg(s) {
      const hip = J(hips, s * hipR * hipX, -H * 0.02, 0), thigh = J(hip);
      if (shorts) { const len = clamp(botW.length ?? 0.55, 0.25, 0.95); add(thigh, limb(rThigh, rKnee, thighL), M.skin); add(thigh, limb(rThigh * 1.06, lerp(rThigh, rKnee, len) * 1.08, thighL * len), M.bottom); }
      else if (skirt) add(thigh, limb(rThigh, rKnee, thighL), M.skin);
      else if (saree) { /* legs stay hidden inside the saree */ }
      else add(thigh, limb(rThigh * fit[0], rKnee * fit[1], thighL), M.bottom);
      const shin = J(thigh, 0, -thighL, 0);
      if (!saree) { add(shin, new T.SphereGeometry(full ? rKnee * fit[2] : rKnee, 20, 14), full ? M.bottom : M.skin); add(shin, limb(full ? rKnee * fit[2] : rKnee, full ? rAnkle * fit[3] : rAnkle, shinL), full ? M.bottom : M.skin); }
      if (bt === 'jeans') add(shin, new T.TorusGeometry(rAnkle * fit[3] * 1.02, H * 0.006, 8, 24), M.bottom, 0, -shinL * 0.95, 0).rotation.x = Math.PI / 2;   // rolled hem
      if (!full && !saree && st !== 'boots') {
        if (socks === 'long') { add(shin, new T.CylinderGeometry(rAnkle * 1.35, rAnkle * 1.2, shinL * 0.45, 20), M.sock, 0, -shinL * 0.78, 0); add(shin, new T.TorusGeometry(rAnkle * 1.36, H * 0.003, 6, 20), M.bottom, 0, -shinL * 0.56, 0).rotation.x = Math.PI / 2; }
        else if (socks === 'ankle') add(shin, new T.CylinderGeometry(rAnkle * 1.3, rAnkle * 1.22, shinL * 0.14, 20), M.sock, 0, -shinL * 0.95, 0);
      }
      if (st === 'boots') { add(shin, new T.CylinderGeometry(rAnkle * 1.85, rAnkle * 1.6, shinL * 0.32, 24), M.shoe, 0, -shinL * 0.86, 0); add(shin, new T.TorusGeometry(rAnkle * 1.85, H * 0.005, 6, 24), M.sole, 0, -shinL * 0.7, 0).rotation.x = Math.PI / 2; }
      const foot = J(shin, 0, -shinL - rAnkle * 0.5, 0);
      const sg = new T.SphereGeometry(1, 28, 18), sp = sg.attributes.position; for (let i = 0; i < sp.count; i++) if (sp.getY(i) < -0.3) sp.setY(i, -0.3 - (sp.getY(i) + 0.3) * 0.2); sg.computeVertexNormals();
      const fs = H / 1.42, fz = H * 0.03, fw = 0.05 * fs * lerp(1, 1.1, W), shoe = add(foot, sg, st === 'sandals' ? M.skin : M.shoe, 0, -footH * 0.25, fz); shoe.scale.set(fw, footH * 0.75, 0.1 * fs);
      const soleG = (k) => new T.CapsuleGeometry(0.05 * fs, 0.1 * fs, 4, 16).rotateX(Math.PI / 2).scale(1, k, 1);
      if (st === 'sandals') {
        add(foot, new T.BoxGeometry(0.1 * fs, 0.012 * fs, 0.21 * fs), new T.MeshStandardMaterial({ color: shoeW.color, roughness: 0.7 }), 0, -footH * 0.75, fz);
        const strap = add(foot, new T.TorusGeometry(fw * 1.02, H * 0.006, 6, 20, Math.PI), new T.MeshStandardMaterial({ color: shoeW.color, roughness: 0.7 }), 0, -footH * 0.55, fz + 0.03 * fs); strap.rotation.y = Math.PI / 2; strap.rotation.order = 'YXZ';
      } else if (st === 'sneakers') {
        add(foot, soleG(0.26), M.white, 0, -footH * 0.72, fz).scale.set(1.06, 1, 1.04);
        const toe = add(foot, new T.SphereGeometry(1, 20, 14), M.white, 0, -footH * 0.42, fz + 0.066 * fs); toe.scale.set(fw * 0.82, footH * 0.42, 0.04 * fs);
        for (const sd of [-1, 1]) { const stripe = add(foot, new T.BoxGeometry(0.004 * fs, footH * 0.28, 0.07 * fs), M.shoe2, sd * fw * 0.96, -footH * 0.2, fz - 0.005 * fs); stripe.rotation.x = -0.35; }
        for (let k = 0; k < 3; k++) add(foot, new T.BoxGeometry(fw * 0.8, 0.005 * fs, 0.008 * fs), M.white, 0, footH * (0.38 - k * 0.08), fz + (0.01 + k * 0.022) * fs).rotation.x = 0.5;
        add(foot, new T.TorusGeometry(rAnkle * 1.25, H * 0.006, 6, 20), M.shoe2, 0, footH * 0.35, 0).rotation.x = Math.PI / 2;
      } else add(foot, soleG(st === 'boots' ? 0.24 : 0.14), M.sole, 0, -footH * 0.75, fz);
      return { hip, thigh, shin, foot };
    }
    const legL = makeLeg(-1), legR = makeLeg(1);
    // pelvis / waistband / skirts
    if (full || shorts) {
      const prof = wear.untuck ? [[0.001, -H * 0.06], [hipR * 0.92, -H * 0.055], [hipR * 1.0, -H * 0.03], [hipR * 0.88, -H * 0.005], [0.001, 0]]    // under a loose top: only the seat
        : [[0.001, -H * 0.06], [hipR * 0.92, -H * 0.055], [hipR * 1.03, -H * 0.02], [hipR, H * 0.04], [0.001, H * 0.045]];
      const pel = add(hips, lathe(prof, 48), M.bottom); pel.scale.z = (0.72 + bellyK * 0.1) * (wear.untuck ? 0.9 : 1); pel.scale.x = wear.untuck ? 1 : Math.max(1, thighOut / (hipR * 1.03));
    }
    if ((full || shorts) && (!wear.untuck || botW.belt)) { const b = add(hips, new T.CylinderGeometry(hipR * 1.0, hipR * 1.0, H * 0.02, 48, 1, true), M.belt, 0, H * 0.035, 0); b.scale.z = 0.73 + bellyK * 0.1; add(hips, new T.BoxGeometry(H * 0.03, H * 0.022, 0.008), M.metal, 0, H * 0.035, hipR * (0.73 + bellyK * 0.1)); }
    if (skirt) {
      const mini = bt === 'mini_skirt', len = thighL * (botW.length ?? (mini ? 0.45 : 0.88)), fl = Math.max(mini ? 1.42 : 1.5, thighOut / hipR * 1.12), top0 = wear.untuck ? hemY + H * 0.03 : H * 0.04;   // under a loose top the skirt starts inside it and comes out right at the hem
      const r1 = wear.untuck ? Math.max(hemR * 1.01, thighOut * 1.04) : Math.max(hipR * 1.12, thighOut * 1.04), y1 = wear.untuck ? hemY - H * 0.008 : -H * 0.04;
      const rows = [[0.001, top0], [wear.untuck ? surfZ(0, top0, false) / zS * 0.85 : hipR * 1.04, top0], [r1, y1]];
      for (let k = 1; k <= 8; k++) { const t = k / 8; rows.push([lerp(r1, Math.max(r1, hipR * fl), t), lerp(y1, -len, t)]); }
      const skG = add(hips, lathe(rows.reverse(), 48), new T.MeshPhysicalMaterial({ color: botW.color, roughness: 0.85, sheen: 0.3, sheenColor: new T.Color(0x8899cc), side: T.DoubleSide })); skG.scale.z = wear.untuck ? zS * 1.22 : 0.82;
      flowy.push({ mesh: skG, top: top0 });
      if (mini && !wear.untuck) { const wb = add(hips, new T.CylinderGeometry(hipR * 1.06, hipR * 1.06, H * 0.018, 48, 1, true), new T.MeshStandardMaterial({ color: new T.Color(botW.color).multiplyScalar(0.75), roughness: 0.7 }), 0, H * 0.032, 0); wb.scale.z = 0.83; }
    }
    if (saree) {
      const sm = new T.MeshPhysicalMaterial({ color: botW.color, roughness: 0.7, sheen: 0.6, sheenColor: new T.Color(0xffd27a) });
      const rows = [[0.001, H * 0.05], [hipR * 1.05, H * 0.05], [hipR * 1.12, -H * 0.05]];
      for (let k = 1; k <= 16; k++) { const t = k / 16; rows.push([lerp(hipR * 1.12, hipR * 1.28, t * t), lerp(-H * 0.05, -legLen * 0.93, t)]); }
      sm.side = T.DoubleSide; const sk = add(hips, lathe(rows.reverse(), 48), sm); sk.scale.z = 0.85;
      flowy.push({ mesh: sk, top: H * 0.05 });
      const bg = new T.CylinderGeometry(hipR * 1.29, hipR * 1.29, H * 0.03, 48, 1, true); bg.translate(0, -legLen * 0.915, 0);
      const border = add(hips, bg, new T.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.6, roughness: 0.35, side: T.DoubleSide })); border.scale.z = 0.85;
      flowy.push({ mesh: border, top: H * 0.05 });
      const pallu = add(chest, new T.BoxGeometry(torsoR * 0.7, torsoLen * 1.05, H * 0.008), sm, -torsoR * 0.1, torsoLen * 0.0, torsoR * 0.72); pallu.rotation.z = 0.55;   // drape across the chest
      add(chest, new T.BoxGeometry(torsoR * 0.75, torsoLen * 1.2, H * 0.008), sm, torsoR * 0.55, torsoLen * -0.05, -torsoR * 0.7).rotation.z = 0.2;
    }

    // ---------------- outfit details ----------------
    const shirtShows = topW.type === 'shirt' && (!wear.wrap || layerW.open);
    if (shirtShows) { if (topW.collar !== false) collar(M.inner); buttons(topW.buttons ?? (wear.untuck ? 5 : 4)); }
    if (wear.tie && topW.type === 'shirt' && (!wear.wrap || layerW.open)) {
      const t1 = '#' + new T.Color(wear.tie.color ?? 0x1f2a52).getHexString(), t2 = '#' + new T.Color(wear.tie.color2 ?? 0xfacc15).getHexString();
      const tieTex = canvasTex((g, Wd, Hd) => { g.fillStyle = t1; g.fillRect(0, 0, Wd, Hd); g.strokeStyle = t2; g.lineWidth = 9; for (let i = -Hd; i < Hd * 2; i += 46) { g.beginPath(); g.moveTo(0, i); g.lineTo(Wd, i + Wd); g.stroke(); } }, 128, 512), tieM = new T.MeshStandardMaterial({ map: tieTex, roughness: 0.7 });
      const knot = add(chest, new T.SphereGeometry(H * 0.012, 16, 12), tieM, 0, torsoLen * 0.37, torsoR * 0.66); knot.scale.set(1, 0.85, 0.7);
      const ts = new T.Shape(), tw = H * 0.017, tl = torsoLen * 0.62; ts.moveTo(-tw * 0.5, 0); ts.lineTo(tw * 0.5, 0); ts.lineTo(tw, -tl * 0.9); ts.lineTo(0, -tl); ts.lineTo(-tw, -tl * 0.9); ts.closePath();
      const blade = add(chest, new T.ExtrudeGeometry(ts, { depth: 0.003, bevelEnabled: true, bevelSize: 0.0015, bevelThickness: 0.0015, bevelSegments: 1 }), tieM, 0, torsoLen * 0.35, torsoR * 0.7 + bellyK * torsoR * 0.12); blade.rotation.x = -0.08 - bellyK * 0.25;
      const uv = blade.geometry.attributes.uv, bp = blade.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, bp.getX(i) / (tw * 2) + 0.5, bp.getY(i) / tl + 1);
    }
    if (!wear.wrap && topW.type === 'tank_top') for (const s of [-1, 1]) {           // tank-top straps over the shoulders
      const x = s * shoulderHalf * 0.42, off = H * 0.006, ty0 = torsoLen * 0.58, yTop = torsoLen * 0.26 + torsoLen * 0.13 * Math.sqrt(Math.max(0, 1 - sq(x / (shoulderHalf * 0.98)))) + off;
      const c = new T.CatmullRomCurve3([new T.Vector3(x * 0.95, torsoLen * 0.2, surfZ(x * 0.95, torsoLen * 0.2 + ty0) + off), new T.Vector3(x, torsoLen * 0.3, surfZ(x, torsoLen * 0.3 + ty0) * 0.7 + off), new T.Vector3(x, yTop, 0),
        new T.Vector3(x, torsoLen * 0.3, -surfZ(x, torsoLen * 0.3 + ty0, false) * 0.7 - off), new T.Vector3(x * 0.95, torsoLen * 0.2, -surfZ(x * 0.95, torsoLen * 0.2 + ty0, false) - off)]);
      const strap = add(chest, new T.TubeGeometry(c, 30, H * 0.009, 8), M.inner); strap.scale.x = 1;
    }
    if (wear.bow) { for (const s of [-1, 1]) { const b = add(chest, new T.SphereGeometry(H * 0.021, 16, 12), M.accent, s * H * 0.018, torsoLen * 0.37, torsoR * 0.66); b.scale.set(1, 0.6, 0.35); } add(chest, new T.SphereGeometry(H * 0.009, 12, 10), M.accent, 0, torsoLen * 0.37, torsoR * 0.7); }
    if (wear.card) {
      const card = canvasTex((g, Wd, Hd) => { g.fillStyle = '#fff'; g.fillRect(0, 0, Wd, Hd); g.fillStyle = '#2b3d8f'; g.fillRect(0, 0, Wd, Hd * 0.28); g.fillStyle = '#fff'; g.font = `700 ${Hd * 0.13}px Fredoka, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ZUNGGA SCHOOL', Wd / 2, Hd * 0.15); g.fillStyle = '#cbd5e1'; g.fillRect(Wd * 0.08, Hd * 0.36, Wd * 0.32, Hd * 0.5); g.fillStyle = '#1f2a52'; g.font = `600 ${Hd * 0.12}px Fredoka, sans-serif`; g.textAlign = 'left'; g.fillText('STUDENT', Wd * 0.46, Hd * 0.6); }, 256, 160);
      add(chest, new T.BoxGeometry(H * 0.038, H * 0.024, 0.003), [M.inner, M.inner, M.inner, M.inner, new T.MeshStandardMaterial({ map: card, roughness: 0.4 }), M.inner], -torsoR * 0.45, torsoLen * 0.1, torsoR * 0.74 + bellyK * torsoR * 0.1);
    }
    if (wear.pen && shirtShows) add(chest, new T.CylinderGeometry(H * 0.003, H * 0.003, H * 0.05, 8), new T.MeshStandardMaterial({ color: 0x1d4ed8 }), torsoR * 0.42, torsoLen * 0.12, torsoR * 0.72);
    if (layerW && layerW.type === 'vest') {
      const vestM = new T.MeshPhysicalMaterial({ color: layerW.color, roughness: 0.85, sheen: 0.3 });
      const vest = add(spine, torsoGeo.clone(), vestM, 0, -torsoLen * 0.12, 0); vest.scale.set(1.035, 0.97, zS * 1.05);
      for (let i = 0; i < 3; i++) add(spine, new T.SphereGeometry(H * 0.005, 10, 8), M.metal, 0, torsoLen * (0.14 + i * 0.15), torsoR * (0.71 + bellyK * 0.4));
    }
    const lc = layerW ? new T.MeshPhysicalMaterial({ color: layerW.color, roughness: 0.85, sheen: 0.3, side: T.DoubleSide }) : null;
    if (layerW && layerW.type === 'hoodie') {
      const hood = add(chest, new T.SphereGeometry(1, 28, 18), lc, 0, torsoLen * 0.3, -torsoR * 0.52); hood.scale.set(shoulderHalf * 0.55, torsoLen * 0.2, torsoR * 0.28); hood.rotation.x = 0.25;   // hood resting on the back
      const rim = add(chest, new T.TorusGeometry(H * 0.044, H * 0.01, 10, 28), lc, 0, torsoLen * 0.43, 0); rim.rotation.x = Math.PI / 2; rim.scale.y = 0.85;
      if (!layerW.open) for (const s of [-1, 1]) {                                       // drawstrings
        const x = s * H * 0.016, ty = torsoLen * 0.33 + torsoLen * 0.58, z = surfZ(x, ty) + H * 0.004;
        add(chest, new T.CylinderGeometry(H * 0.0028, H * 0.0028, H * 0.075, 6), M.white, x, torsoLen * 0.33, z).rotation.x = -0.12;
        add(chest, new T.CylinderGeometry(H * 0.004, H * 0.004, H * 0.012, 8), M.metal, x, torsoLen * 0.33 - H * 0.04, z + H * 0.004);
      }
    }
    if (layerW && layerW.type === 'jacket') { const cl = add(chest, new T.CylinderGeometry(H * 0.04, H * 0.05, H * 0.032, 28, 1, true), lc, 0, torsoLen * 0.44, 0); cl.scale.z = 0.9; }
    // dupatta: a long scarf over both shoulders, dipping in a U across the chest, ends hanging down the back
    if (wear.dupatta) {
      const d1 = '#' + new T.Color(wear.dupatta.color ?? BRAND_COLORS.pink).getHexString(), d2 = '#' + new T.Color(wear.dupatta.color2 ?? BRAND_COLORS.yellow).getHexString();
      const dt = canvasTex((g, w, h) => { g.fillStyle = d1; g.fillRect(0, 0, w, h); g.fillStyle = d2; g.fillRect(0, 0, w * 0.1, h); g.fillRect(w * 0.9, 0, w * 0.1, h); g.globalAlpha = 0.35; for (let y = 8; y < h; y += 24) { g.beginPath(); g.arc(w / 2, y, 4, 0, Math.PI * 2); g.fill(); } }, 64, 256);
      dt.wrapT = T.RepeatWrapping;
      const off = H * 0.014, ty0 = torsoLen * 0.58, sx = shoulderHalf * 0.62;
      const F = (x, cy) => surfZ(x, cy + ty0, true) + off, Bk = (x, cy) => -(surfZ(x, cy + ty0, false) + off);
      const topY = torsoLen * 0.26 + torsoLen * 0.13 * Math.sqrt(Math.max(0, 1 - sq(sx / (shoulderHalf * 0.98)))) * layerK + off;
      const half = (s) => [new T.Vector3(s * sx * 0.95, -torsoLen * 0.62, Bk(sx * 0.95, -torsoLen * 0.62)), new T.Vector3(s * sx, torsoLen * 0.0, Bk(sx, 0)), new T.Vector3(s * sx, torsoLen * 0.26, Bk(sx, torsoLen * 0.26) * 0.7),
        new T.Vector3(s * sx, topY, 0), new T.Vector3(s * sx * 0.95, torsoLen * 0.26, F(sx * 0.95, torsoLen * 0.26) * 0.8), new T.Vector3(s * sx * 0.7, torsoLen * 0.08, F(sx * 0.7, torsoLen * 0.08)), new T.Vector3(s * sx * 0.32, -torsoLen * 0.06, F(sx * 0.32, -torsoLen * 0.06))];
      const pts = [...half(-1), new T.Vector3(0, -torsoLen * 0.1, F(0, -torsoLen * 0.1)), ...half(1).reverse()];
      const curve = new T.CatmullRomCurve3(pts), N = 120, width = H * 0.062, pos = [], uvs = [], idx = [], cen = new T.Vector3(0, torsoLen * 0.0, 0);
      for (let i = 0; i <= N; i++) {
        const t = i / N, p = curve.getPointAt(t), tg = curve.getTangentAt(t), wU = smooth(clamp((p.y - torsoLen * 0.2) / (torsoLen * 0.12), 0, 1)), n = new T.Vector3(p.x * 0.3, 0, p.z).normalize().lerp(new T.Vector3(0, 1, 0), wU).normalize();
        const side = new T.Vector3().crossVectors(tg, n).normalize();
        for (const s of [-1, 1]) { const q = p.clone().addScaledVector(side, s * width / 2); pos.push(q.x, q.y, q.z); uvs.push((s + 1) / 2, t * 8); }
        if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      }
      const dg = new T.BufferGeometry(); dg.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); dg.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2)); dg.setIndex(idx); dg.computeVertexNormals();
      add(chest, dg, new T.MeshPhysicalMaterial({ map: dt, roughness: 0.75, sheen: 0.6, sheenColor: new T.Color(0xffffff), side: T.DoubleSide }));
    }

    root.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    blush.forEach((b) => { b.castShadow = false; });

    // ---------------- face animation (same expression set as the kid) ----------------
    const EXPR = {
      neutral: { smile: 0.15, open: 0, width: 0.2, browY: 0, browTilt: 0, lidUp: 0.95, lidLow: 0.1, blush: 0, gaze: [0, 0] },
      smile: { smile: 0.7, open: 0, width: 0.24, browY: 0.05, browTilt: 0.05, lidUp: 0.9, lidLow: 0.3, blush: 0.25, gaze: [0, 0] },
      big_smile: { smile: 0.9, open: 0.75, width: 0.27, browY: 0.12, browTilt: 0.1, lidUp: 0.85, lidLow: 0.45, blush: 0.4, gaze: [0, 0] },
      sad: { smile: -0.6, open: 0, width: 0.18, browY: -0.02, browTilt: -0.35, lidUp: 0.62, lidLow: 0.05, blush: 0, gaze: [0, -0.25] },
      surprised: { smile: 0, open: 0.85, width: 0.13, browY: 0.32, browTilt: 0.05, lidUp: 1.15, lidLow: 0, blush: 0, gaze: [0, 0.05] },
      thinking: { smile: -0.1, open: 0, width: 0.15, browY: 0.12, browTilt: 0.25, lidUp: 0.85, lidLow: 0.15, blush: 0, gaze: [0.35, 0.35], browAsym: 0.18 },
      worried: { smile: -0.35, open: 0.12, width: 0.17, browY: 0.08, browTilt: -0.45, lidUp: 0.9, lidLow: 0.05, blush: 0, gaze: [-0.2, -0.05] },
      determined: { smile: 0.35, open: 0, width: 0.2, browY: -0.05, browTilt: 0.35, lidUp: 0.78, lidLow: 0.25, blush: 0, gaze: [0, 0], smirk: 0.4 },
      idea: { smile: 0.8, open: 0.55, width: 0.22, browY: 0.3, browTilt: 0.1, lidUp: 1.12, lidLow: 0.2, blush: 0.3, gaze: [0, 0.3] },
      stern: { smile: -0.2, open: 0, width: 0.19, browY: -0.08, browTilt: 0.45, lidUp: 0.8, lidLow: 0.2, blush: 0, gaze: [0, 0] },
    };
    const cur = { ...EXPR.neutral, browAsym: 0, smirk: 0 }, target = { ...cur };
    let exprName = 'neutral', talk = 0, talkTarget = 0, talkDriven = false, blinkT = 2.5, blinkK = 0;
    const setExpression = (n, instant = false) => { if (!EXPR[n]) throw new Error('Unknown expression ' + n); exprName = n; Object.assign(target, { browAsym: 0, smirk: 0 }, EXPR[n]); if (instant) { Object.assign(cur, target); cur.gaze = target.gaze.slice(); } };
    function applyFace(dt, time) {
      for (const k of ['smile', 'open', 'width', 'browY', 'browTilt', 'lidUp', 'lidLow', 'blush', 'browAsym', 'smirk']) cur[k] = damp(cur[k], target[k] ?? 0, 10, dt);
      cur.gaze = [damp(cur.gaze[0], target.gaze[0], 8, dt), damp(cur.gaze[1], target.gaze[1], 8, dt)];
      talk = damp(talk, talkTarget, 18, dt);
      const open = Math.min(1, cur.open + talk * 0.75);
      buildLip(cur.smile, cur.width + talk * 0.02, open); lipLine.rotation.z = cur.smirk * 0.12;
      openG.visible = open > 0.04; openG.scale.set(R * (cur.width * 0.95 + 0.02), R * (0.04 + open * 0.22), 1); teeth.visible = cur.smile > 0.3;
      blinkT -= dt; if (blinkT <= 0) { blinkK = 1; blinkT = 2 + Math.random() * 3.5; }
      blinkK = Math.max(0, blinkK - dt * 7); const close = Math.sin(Math.min(1, blinkK) * Math.PI);
      eyes.forEach((e, i) => { e.upper.rotation.x = lerp(1.55, -0.85, Math.min(1.15, lerp(cur.lidUp, 0, close))); e.lower.rotation.x = lerp(0.75, -0.2, cur.lidLow); e.ball.rotation.y = cur.gaze[0] * 0.5 + Math.sin(time * 0.7 + i) * 0.02; e.ball.rotation.x = -cur.gaze[1] * 0.45 + Math.sin(time * 0.53) * 0.015; });
      brows.forEach((b, i) => { const s = i ? 1 : -1; b.position.y = R * (0.42 + cur.browY * 0.35 + (i ? cur.browAsym : -cur.browAsym * 0.3) * 0.3); b.rotation.z = -s * cur.browTilt * 0.9; });
      M.blush.opacity = cur.blush * 0.55;
    }

    // ---------------- arm poses for this body: two-bone IK (shoulder → elbow → hand) with a pole that says where the elbow points ----------------
    function ikArm(A, targetW, poleW, twist = 0) {
      A.upper.rotation.set(0, 0, 0); A.fore.rotation.set(0, 0, 0); root.updateMatrixWorld(true);
      const S = A.upper.getWorldPosition(new T.Vector3()), F = A.fore.getWorldPosition(new T.Vector3()), G = A.grip.getWorldPosition(new T.Vector3());
      const L1 = S.distanceTo(F), L2 = F.distanceTo(G);
      const toT = targetW.clone().sub(S), d = clamp(toT.length(), Math.abs(L1 - L2) + 1e-3, (L1 + L2) * 0.995), dir = toT.normalize();
      const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
      const pole = poleW.clone().normalize(), pp = pole.sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
      const E = S.clone().addScaledVector(dir, a).addScaledVector(pp, h), Tc = S.clone().addScaledVector(dir, d);
      const u = E.clone().sub(S).normalize(), f = Tc.clone().sub(E).normalize();
      const z = f.clone().sub(u.clone().multiplyScalar(f.dot(u))); if (z.lengthSq() < 1e-8) z.set(0, 0, 1); z.normalize();   // the forearm folds toward local +Z
      const y = u.clone().negate(), x = new T.Vector3().crossVectors(y, z);
      const q = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z)).premultiply(A.sh.getWorldQuaternion(new T.Quaternion()).invert());
      const e = new T.Euler().setFromQuaternion(q, 'XYZ');
      return [e.x, e.y, e.z, -Math.acos(clamp(u.dot(f), -1, 1)), twist];
    }
    root.updateMatrixWorld(true);
    const frontAt = (x, cy) => surfZ(x, cy + torsoLen * 0.58);          // chest-local height → front of the body
    const chestPt = (x, cy, out) => chest.localToWorld(new T.Vector3(x, cy, frontAt(x, cy) + out));
    // think: knuckles under the chin, elbow down and slightly forward/out
    const chinPose = ikArm(armR, headC.localToWorld(new T.Vector3(R * 0.08, -R * 1.02, R * 0.5)), new T.Vector3(0.45, -1, 0.35));
    // count: both hands together in front of the chest, elbows down at the sides
    const countR = ikArm(armR, chestPt(torsoR * 0.22, torsoLen * 0.02, rFore * 3.2), new T.Vector3(1, -1.3, -0.2));
    const countL = ikArm(armL, chestPt(-torsoR * 0.22, torsoLen * 0.02, rFore * 3.2), new T.Vector3(-1, -1.3, -0.2));
    // arms crossed: forearms fold across the chest, right one in front, each hand tucked by the other elbow
    const crossR = ikArm(armR, chestPt(-shoulderHalf * 0.72, torsoLen * 0.0, rFore * 2.9), new T.Vector3(1, -0.55, -0.15), 1.4);
    const crossL = ikArm(armL, chestPt(shoulderHalf * 0.72, torsoLen * 0.1, rFore * 1.2), new T.Vector3(-1, -0.55, -0.15), -1.4);
    armR.upper.rotation.set(0, 0, 0); armR.fore.rotation.set(0, 0, 0); armL.upper.rotation.set(0, 0, 0); armL.fore.rotation.set(0, 0, 0);

    // skirts / saree bend with the thighs (and the saree with the knees), so sitting and walking don't leave a stiff cone
    function deformFlowy(p) {
      for (const fl of flowy) {
        const g = fl.mesh.geometry, pos = g.attributes.position;
        if (!fl.rest) fl.rest = pos.array.slice();
        const r = fl.rest, hipY = -H * 0.02, kneeY = hipY - thighL, seatY = hipY - rThigh * 0.9;
        for (let i = 0; i < pos.count; i++) {
          let x = r[i * 3], y = r[i * 3 + 1], z = r[i * 3 + 2];
          const wR = clamp(0.5 + x / (hipR * hipX * 2.2), 0, 1);
          const wFront = smooth(clamp(z / (hipR * 0.9) + 0.3, 0, 1));             // front panel follows the thighs, the back stays with the seat
          const start = Math.min(fl.top, hipY + H * 0.03), wDrop = smooth(clamp((start - y) / (H * 0.05), 0, 1));
          const thA = p.thRx[0] * (1 - wR) + p.thRx[1] * wR, sitK = clamp(-thA / 1.4, 0, 1);
          if (y < kneeY) {                                   // below the knee (saree): fold with the shins first
            const ks = (p.snRx[0] * (1 - wR) + p.snRx[1] * wR) * wFront, dy = y - kneeY, c = Math.cos(ks), sn = Math.sin(ks);
            y = kneeY + dy * c - z * sn; z = dy * sn + z * c;
          }
          if (z > 0) z *= 1 - 0.3 * sitK * wFront * wDrop;  // lie close on top of the thighs
          const th = thA * wFront * wDrop, dy = y - hipY, c = Math.cos(th), sn = Math.sin(th);
          let ny = hipY + dy * c - z * sn, nz = dy * sn + z * c;
          if (ny < seatY) ny = lerp(ny, seatY, sitK * (1 - wFront) * wDrop);   // the back tucks flat under the seat instead of hanging below it
          pos.setXYZ(i, x, ny, nz);
        }
        pos.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
      }
    }

    // ---------------- body clips (same names as the kid; amplitudes scale with weight) ----------------
    const heavy = W, sitY0 = shinL + footH * 0.8 + rThigh * 0.6; let sitY = sitY0;   // setSeat(h) puts the hips on a real seat of height h
    function zeroPose() { return { bodyY: 0, hipsY: legLen, hipsRx: 0, hipsRy: 0, hipsRz: 0, spineRx: 0, spineRy: 0, chestRx: 0, chestRz: 0, neckRx: 0, neckRy: 0, headRx: 0, headRy: 0, headRz: 0, upRx: [0, 0], upRz: [-0.15 - heavy * 0.1, 0.15 + heavy * 0.1], upRy: [0, 0], foRx: [-0.1, -0.1], foRy: [1.25, -1.25], haRx: [0, 0], haRz: [0, 0], thRx: [0, 0], thRz: [0.02 + heavy * 0.05, -0.02 - heavy * 0.05], snRx: [0, 0], ftRx: [0, 0], curl: [0.35, 0.35] }; }
    const spd = lerp(1, 0.82, heavy);
    const CLIPS = {
      idle(t, p) { const b = Math.sin(t * 1.6); p.hipsY += b * 0.003; p.chestRx = b * 0.012; p.hipsRz = Math.sin(t * 0.45) * 0.02; p.headRy = Math.sin(t * 0.37) * 0.12; p.headRx = Math.sin(t * 0.29) * 0.04; },
      talk(t, p) { CLIPS.idle(t, p); p.headRx += Math.sin(t * 5.1) * 0.03; p.headRz = Math.sin(t * 2.3) * 0.04; p.upRx = [-0.35 - Math.max(0, Math.sin(t * 2.2)) * 0.25, 0]; p.foRx = [-0.9, -0.2]; p.upRz[0] -= 0.15; },
      walk(t, p) { const w = t * 6.5 * spd, s = Math.sin(w), c = Math.abs(Math.cos(w)); p.hipsY += c * 0.022; p.hipsRy = s * 0.08; p.hipsRz = s * 0.03 * (1 + heavy); p.spineRy = -s * 0.08; p.thRx = [s * 0.5, -s * 0.5]; p.snRx = [Math.max(0, -s) * 0.9, Math.max(0, s) * 0.9]; p.ftRx = [-Math.max(0, -s) * 0.3, -Math.max(0, s) * 0.3]; p.upRx = [-s * 0.45, s * 0.45]; p.foRx = [-0.3 - Math.max(0, s) * 0.3, -0.3 - Math.max(0, -s) * 0.3]; },
      run(t, p) { const w = t * 10 * spd, s = Math.sin(w), c = Math.abs(Math.cos(w)); p.bodyY = c * 0.05; p.hipsRy = s * 0.12; p.spineRx = 0.2; p.spineRy = -s * 0.16; p.thRx = [s * 0.85 - 0.15, -s * 0.85 - 0.15]; p.snRx = [Math.max(0, -s) * 1.5 + 0.2, Math.max(0, s) * 1.5 + 0.2]; p.upRx = [-s * 0.85, s * 0.85]; p.foRx = [-1.3, -1.3]; p.foRy = [0, 0]; p.headRx = -0.12; p.curl = [0.9, 0.9]; },
      sit(t, p) { p.hipsY = sitY; p.thRx = [-1.5, -1.5]; p.snRx = [1.45, 1.45]; p.thRz = [0.08 + heavy * 0.1, -0.08 - heavy * 0.1]; p.spineRx = -0.05; p.upRx = [-0.35, -0.35]; p.foRx = [-0.9, -0.9]; p.haRx = [0.3, 0.3]; p.chestRx = Math.sin(t * 1.6) * 0.01; p.headRy = Math.sin(t * 0.35) * 0.1; },
      sit_sad(t, p) { CLIPS.sit(t, p); p.spineRx = 0.32; p.chestRx = 0.12; p.neckRx = 0.35; p.headRx = 0.2; p.headRy = 0; p.upRx = [-0.65, -0.65]; p.upRz = [0.15, -0.15]; p.foRx = [-1.2, -1.2]; p.haRz = [-0.4, 0.4]; },
      wave(t, p) { CLIPS.idle(t, p); p.upRz = [p.upRz[0], 2.5]; p.upRx = [0, -0.2]; p.foRx = [-0.2, -0.35]; p.foRy = [1.25, Math.sin(t * 9) * 0.5]; p.haRz = [0, Math.sin(t * 9) * 0.25]; p.headRz = 0.08; p.curl = [0.35, 0]; },
      think(t, p) { CLIPS.idle(t, p); [p.upRx[1], p.upRy[1], p.upRz[1], p.foRx[1], p.foRy[1]] = chinPose; p.haRx = [0, 0.25]; p.headRz = 0.08; p.headRy = -0.12; p.headRx = -0.1 + Math.sin(t * 0.8) * 0.02; p.curl = [0.4, 0.75]; },
      cheer(t, p) { const j = Math.max(0, Math.sin(t * 5 * spd)); p.bodyY = j * 0.12 * (1 - heavy * 0.5); p.upRz = [-2.7, 2.7]; p.upRx = [0, 0]; p.foRx = [-0.3, -0.3]; p.foRy = [0, 0]; p.thRx = [-j * 0.4, -j * 0.4]; p.snRx = [j * 0.8, j * 0.8]; p.headRx = -0.15; p.curl = [0.9, 0.9]; },
      count(t, p) { CLIPS.idle(t, p); [p.upRx[1], p.upRy[1], p.upRz[1], p.foRx[1], p.foRy[1]] = countR; [p.upRx[0], p.upRy[0], p.upRz[0], p.foRx[0], p.foRy[0]] = countL; p.haRx = [-0.2, -0.2 + Math.sin(t * 6) * 0.08]; p.neckRx = 0.25; p.headRx = 0.25; p.headRy = 0; p.curl = [0.55, 0.55]; },
      point(t, p) { CLIPS.idle(t, p); p.upRx = [0, -1.45]; p.foRx = [-0.2, -0.05]; p.foRy = [1.25, 0]; p.curl = [0.35, 0]; p.headRy = 0; },
      give(t, p) { CLIPS.idle(t, p); p.upRx = [0, -1.0]; p.upRz[1] = 0.1; p.foRx = [-0.2, -0.45]; p.foRy = [1.25, -0.3]; p.haRx = [0, 0.3]; p.curl = [0.35, 0.5]; p.headRx = 0.05; p.spineRx = 0.06; },
      arms_crossed(t, p) { CLIPS.idle(t, p); [p.upRx[1], p.upRy[1], p.upRz[1], p.foRx[1], p.foRy[1]] = crossR; [p.upRx[0], p.upRy[0], p.upRz[0], p.foRx[0], p.foRy[0]] = crossL; p.haRx = [0.2, 0.2]; p.curl = [0.8, 0.8]; p.headRx = -0.05; },
    };
    let clip = 'idle', clipT = 0, prevPose = null, blendT = 1, lastPose = zeroPose(), time = 0;
    const play = (n, opt = {}) => { if (!CLIPS[n]) throw new Error('Unknown animation ' + n); if (opt.instant) { clip = n; clipT = 0; prevPose = null; blendT = 1; return; } if (n === clip) return; prevPose = lastPose; clip = n; clipT = 0; blendT = 0; };   // instant: no blend (scene cuts)
    const lerpPose = (a, b, k) => { const out = {}; for (const key in b) out[key] = Array.isArray(b[key]) ? b[key].map((v, i) => lerp(a[key][i], v, k)) : lerp(a[key], b[key], k); return out; };
    function applyPose(p) {
      body.position.y = p.bodyY; hips.position.y = p.hipsY; hips.rotation.set(p.hipsRx, p.hipsRy, p.hipsRz); spine.rotation.set(p.spineRx, p.spineRy, 0); chest.rotation.set(p.chestRx, 0, p.chestRz);
      neck.rotation.set(p.neckRx, p.neckRy, 0); head.rotation.set(p.headRx, p.headRy, p.headRz);
      [armL, armR].forEach((A, i) => { A.upper.rotation.set(p.upRx[i], p.upRy[i], p.upRz[i]); A.fore.rotation.set(p.foRx[i], p.foRy[i], 0); A.hand.rotation.set(p.haRx[i], 0, p.haRz[i]); A.fingers.forEach((f, k) => { const c = p.curl[i] * (1 + k * 0.08); f.base.rotation.x = -c * 1.1; f.tip.rotation.x = -c * 1.3; }); A.thumb.rotation.x = 0.2 - p.curl[i] * 0.6; });
      [legL, legR].forEach((L, i) => { L.thigh.rotation.set(p.thRx[i], 0, p.thRz[i]); L.shin.rotation.x = p.snRx[i]; L.foot.rotation.x = p.ftRx[i]; });
    }
    function update(dt) {
      time += dt; clipT += dt;
      const p = zeroPose(); CLIPS[clip](clipT, p);
      blendT = Math.min(1, blendT + dt / 0.35);
      const pose = prevPose && blendT < 1 ? lerpPose(prevPose, p, smooth(blendT)) : p;
      applyPose(pose); lastPose = pose; if (flowy.length) deformFlowy(pose);
      if (clip === 'talk') talkTarget = Math.max(0, Math.sin(time * 13) * 0.6 + Math.sin(time * 7.3) * 0.4) * 0.9; else if (!talkDriven) talkTarget = 0;
      applyFace(dt, time);
    }
    const setSeat = (h) => { sitY = h == null ? sitY0 : h + rThigh * 0.95; };
    const setTalk = (level) => { talkDriven = level != null; talkTarget = clamp(level || 0, 0, 1); };
    const hold = (obj, hand = 'R') => { const g = hand === 'R' ? armR.grip : armL.grip; while (g.children.length) g.remove(g.children[0]); if (obj) g.add(obj); };
    setExpression('neutral'); update(0);
    return { group: root, setExpression, play, setTalk, setSeat, hold, update, get expression() { return exprName; }, get animation() { return clip; }, EXPRESSIONS: Object.keys(EXPR), ANIMATIONS: Object.keys(CLIPS), params: { height: H, weight: W, build: B, age: AGE, sex: female ? 'f' : 'm', outfit, hair: hairStyle, wear }, rig: { hips, spine, chest, neck, head, headC, armL, armR, legL, legR } };
  }

  // ready-made cast (everyday clothes, no uniforms) — heroes follow the Zungga character board; tweak any value
  const C = BRAND_COLORS;
  const PRESETS = {
    kai:           { label: 'Kai',            height: 1.42, weight: 0.45, build: 0.55, age: 0.15, sex: 'm', hair: 'curly', hairColor: 'brown', skin: 'wheat',
                     wear: { top: { type: 'tshirt', color: 0xffffff }, layer: { type: 'hoodie', color: 0x1d4ed8 }, bottom: { type: 'jeans', color: 0x2c4a7c }, shoes: { type: 'sneakers', color: 0x1d4ed8, color2: C.yellow } } },
    rio:           { label: 'Rio',            height: 1.4,  weight: 0.5,  build: 0.55, age: 0.12, sex: 'm', hair: 'spikes', hairColor: 'brown', skin: 'medium',
                     wear: { top: { type: 'tshirt', color: 0x2563eb }, layer: { type: 'jacket', color: C.orange, open: true }, bottom: { type: 'shorts', color: 0x3f3f46, length: 0.85 }, shoes: { type: 'sneakers', color: 0xffffff, color2: C.orange } } },
    tara:          { label: 'Tara',           height: 1.4,  weight: 0.4,  build: 0.45, age: 0.12, sex: 'f', hair: 'ponytail', skin: 'medium', colors: { accent: C.violet },
                     wear: { top: { type: 'tshirt', color: 0xffffff }, layer: { type: 'jacket', color: C.teal, open: true }, bottom: { type: 'pants', color: 0x334155 }, shoes: { type: 'sneakers', color: 0xffffff, color2: C.teal }, eyewear: { type: 'glasses', color: C.violet } } },
    mira:          { label: 'Mira',           height: 1.38, weight: 0.42, build: 0.4,  age: 0.1,  sex: 'f', hair: 'long', hairColor: 'brown', skin: 'wheat',
                     wear: { top: { type: 'tshirt' }, layer: { type: 'hoodie', color: 0xff6fae }, bottom: { type: 'jeans', color: 0x5577aa }, shoes: { type: 'sneakers', color: 0xffffff, color2: C.violet } } },
    jax:           { label: 'Jax',            height: 1.55, weight: 0.72, build: 1.0,  age: 0.35, sex: 'm', hair: 'spikes', skin: 'tan',
                     wear: { top: { type: 'tshirt', color: 0x111827 }, layer: { type: 'jacket', color: 0xb91c1c, open: true }, bottom: { type: 'pants', color: 0x3b2a20 }, shoes: { type: 'boots' } } },
    older_sister:  { label: 'Older sister',   height: 1.62, weight: 0.45, build: 0.45, age: 0.6,  sex: 'f', hair: 'long', skin: 'medium',
                     wear: { top: { type: 'top', color: C.yellow, pattern: 'dots', color2: 0xffffff }, bottom: { type: 'skirt', color: C.purple, length: 1.1 }, shoes: { type: 'sneakers', color: 0xffffff, color2: C.purple }, eyewear: { type: 'sunglasses' } } },
    older_brother: { label: 'Older brother',  height: 1.74, weight: 0.4,  build: 0.6,  age: 0.55, sex: 'm', hair: 'side_part', skin: 'medium',
                     wear: { top: { type: 'tshirt', color: C.teal }, bottom: { type: 'jeans', color: 0x1e293b }, shoes: { type: 'sneakers', color: 0x111827, color2: 0xffffff }, eyewear: { type: 'sunglasses' } } },
    mom:           { label: 'Mom',            height: 1.58, weight: 0.58, build: 0.4,  age: 1.0,  sex: 'f', hair: 'bun', skin: 'medium', colors: { accent: C.yellow },
                     wear: { top: { type: 'top', long: true, color: C.violet, pattern: 'dots', color2: C.yellow, logo: false, sleeves: 'short' }, bottom: { type: 'pants', color: 0xf5e6c8 }, dupatta: { color: C.pink, color2: C.yellow }, shoes: { type: 'sandals' } } },
    dad:           { label: 'Dad',            height: 1.72, weight: 0.62, build: 0.6,  age: 1.0,  sex: 'm', hair: 'side_part', skin: 'tan', mustache: true,
                     wear: { top: { type: 'shirt', color: 0xdbeafe, pattern: 'checks', color2: 0x60a5fa, tuck: true, sleeves: 'long' }, bottom: { type: 'trousers', color: 0x374151 }, shoes: { type: 'formal', color: 0x3b2416 } } },
    shopkeeper:    { label: 'Shopkeeper',     height: 1.66, weight: 0.85, build: 0.6,  age: 1.0,  sex: 'm', hair: 'receding', hairColor: 'salt', skin: 'tan', mustache: true,
                     wear: { top: { type: 'shirt', color: 0xf5f5f4, tuck: true }, layer: { type: 'vest', color: 0x92400e }, bottom: { type: 'trousers', color: 0x57534e }, shoes: { type: 'sandals' } } },
    bank_teller:   { label: 'Bank teller',    height: 1.62, weight: 0.45, build: 0.45, age: 0.9,  sex: 'f', hair: 'bun', skin: 'wheat',
                     wear: { top: { type: 'shirt', color: 0xe0f2fe, tuck: true }, bottom: { type: 'trousers', color: 0x1e293b }, shoes: { type: 'formal', color: 0x111827 }, tie: { color: 0x7c3aed } } },
    bank_manager:  { label: 'Bank manager',   height: 1.74, weight: 0.65, build: 0.6,  age: 1.0,  sex: 'm', hair: 'side_part', skin: 'tan', glasses: true,
                     wear: { top: { type: 'shirt', color: 0xffffff, tuck: true }, layer: { type: 'jacket', color: 0x1f2937 }, bottom: { type: 'trousers', color: 0x1f2937 }, shoes: { type: 'formal', color: 0x111827 }, tie: { color: 0x7c3aed } } },
    security_guard:{ label: 'Security guard', height: 1.76, weight: 0.75, build: 0.8,  age: 1.0,  sex: 'm', hair: 'short', skin: 'brown', mustache: true,
                     wear: { top: { type: 'shirt', color: 0x1e3a8a, tuck: true }, bottom: { type: 'trousers', color: 0x1e293b }, shoes: { type: 'boots', color: 0x111827 } } },
    grocer:        { label: 'Grocer',         height: 1.68, weight: 0.8,  build: 0.6,  age: 1.0,  sex: 'm', hair: 'short', skin: 'tan', mustache: true,
                     wear: { top: { type: 'tshirt', color: 0xfef9c3 }, layer: { type: 'vest', color: 0x16a34a }, bottom: { type: 'trousers', color: 0x57534e }, shoes: { type: 'sandals' } } },
    vegetable_seller:{ label: 'Vegetable seller', height: 1.56, weight: 0.5, build: 0.45, age: 1.0, sex: 'f', hair: 'bun', skin: 'brown',
                     wear: { top: { type: 'top', color: 0x16a34a }, bottom: { type: 'saree', color: 0xf97316 }, shoes: { type: 'sandals' } } },
  };
  window.ZCharacters = Object.assign(window.ZCharacters || {}, { person, PRESETS, SKINS, HAIRC, BRAND_COLORS, WEAR_TYPES, TOP_DEF });
})();
