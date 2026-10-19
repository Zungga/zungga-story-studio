/* Zungga Story Studio — "Rio's Lemonade Stall" (pilot episode 1): the kid-size lemonade stall, lemons, cups, jug,
 * ice bucket, sugar, Mira's giant lemon sign, the ₹5 rival stall, a park gate, and the colony street set they stand in. */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box, label, cyl, sphere } = ZA;
  const put = (g, id, x, y, z, ry = 0, s = 1) => { if (!ZAssets.has(id)) return null; const o = ZAssets.build(id).group; o.position.set(x, y, z); o.rotation.y = ry; o.scale.multiplyScalar(s); g.add(o); return o; };
  const LEMON = 0xfacc15, LEMON2 = 0xfde047, WOOD = 0xc08552, WOOD2 = 0x8a5a33;

  // a smiling lemon drawn on a canvas (for signs)
  function drawLemon(c, cx, cy, r, smile = true) {
    c.save(); c.translate(cx, cy); c.rotate(-0.25);
    c.fillStyle = '#facc15'; c.beginPath(); c.ellipse(0, 0, r * 1.25, r, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(r * 1.28, 0, r * 0.16, r * 0.12, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(-r * 1.28, 0, r * 0.16, r * 0.12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(-r * 0.45, -r * 0.45, r * 0.35, r * 0.16, -0.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#16a34a'; c.beginPath(); c.ellipse(r * 0.6, -r * 1.02, r * 0.42, r * 0.17, -0.5, 0, Math.PI * 2); c.fill();
    if (smile) { c.fillStyle = '#3b2416'; for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * r * 0.38, -r * 0.08, r * 0.12, 0, Math.PI * 2); c.fill(); }
      c.strokeStyle = '#3b2416'; c.lineWidth = r * 0.1; c.lineCap = 'round'; c.beginPath(); c.arc(0, r * 0.12, r * 0.42, 0.2, Math.PI - 0.2); c.stroke();
      c.fillStyle = '#fb7185'; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * r * 0.72, r * 0.2, r * 0.16, r * 0.1, 0, 0, Math.PI * 2); c.fill(); } }
    c.restore();
  }
  const stripes = (a, b, n = 8) => tex((c, W, H) => { for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? b : a; c.fillRect(i * W / n, 0, W / n + 1, H); } }, 256, 64);

  // ---------- small props ----------
  function lemon() { const g = new T.Group(); const m = sphere(0.04, LEMON, g, 0, 0.032, 0, 16); m.scale.set(1.25, 0.82, 0.82); const t = sphere(0.009, LEMON, g, 0.05, 0.032, 0, 8); void t; return { group: g, top: 0.065 }; }
  function lemonBasket() {
    const g = new T.Group(); const b = mesh(new T.CylinderGeometry(0.17, 0.13, 0.12, 20, 1, true), mat(0xb7793f, { side: T.DoubleSide, roughness: 0.9 }), g, 0, 0.06, 0); void b;
    cyl(0.13, 0.13, 0.01, 0xa86a35, g, 0, 0.005, 0); mesh(new T.TorusGeometry(0.17, 0.012, 6, 24), mat(0x8a5a33), g, 0, 0.12, 0).rotation.x = Math.PI / 2;
    for (let i = 0; i < 9; i++) { const a = i * 2.4, r = i ? 0.075 : 0, l = ZAssets.build('lemon').group; l.position.set(Math.cos(a) * r, 0.07 + (i > 5 ? 0.04 : 0), Math.sin(a) * r); l.rotation.y = a; g.add(l); }
    return { group: g, top: 0.16 };
  }
  function lemonadeCup() {   // a paper cup of lemonade, lemon slice on the rim
    const g = new T.Group(), cupT = tex((c, W, H) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); c.fillStyle = '#facc15'; for (let i = 0; i < 6; i++) c.fillRect(i * W / 6, 0, W / 12, H); c.fillStyle = '#7c3aed'; c.fillRect(0, H * 0.42, W, H * 0.16); }, 256, 128);
    mesh(new T.CylinderGeometry(0.038, 0.028, 0.095, 20, 1, true), new T.MeshStandardMaterial({ map: cupT, side: T.DoubleSide, roughness: 0.7 }), g, 0, 0.0475, 0);
    cyl(0.028, 0.028, 0.004, 0xffffff, g, 0, 0.002, 0); cyl(0.035, 0.035, 0.004, 0xfff3a0, g, 0, 0.088, 0);
    const sl = cyl(0.022, 0.022, 0.006, LEMON2, g, 0.03, 0.094, 0); sl.rotation.z = 1.2;
    const straw = cyl(0.004, 0.004, 0.12, 0xec4899, g, -0.012, 0.12, 0); straw.rotation.z = 0.25;
    return { group: g, top: 0.1, phys: { shape: 'cyl', size: [0.038, 0.095], mass: 0.1 } };
  }
  function lemonadeJug() {
    const g = new T.Group(); mesh(new T.CylinderGeometry(0.09, 0.1, 0.26, 24, 1, true), new T.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, roughness: 0.05, side: T.DoubleSide, depthWrite: false }), g, 0, 0.13, 0).castShadow = false;
    mesh(new T.CylinderGeometry(0.086, 0.096, 0.2, 24), new T.MeshStandardMaterial({ color: 0xffe14d, emissive: 0x5a4a00, emissiveIntensity: 0.25, roughness: 0.2 }), g, 0, 0.1, 0);
    for (let i = 0; i < 4; i++) { const ic = box(0.035, 0.035, 0.035, 0xe0f7ff, g, Math.cos(i * 1.7) * 0.04, 0.18, Math.sin(i * 1.7) * 0.04, 0.008); ic.material = new T.MeshStandardMaterial({ color: 0xe0f7ff, transparent: true, opacity: 0.8, roughness: 0.05 }); ic.rotation.y = i; }
    for (let i = 0; i < 3; i++) { const s = cyl(0.03, 0.03, 0.006, LEMON2, g, Math.cos(i * 2) * 0.05, 0.08 + i * 0.05, Math.sin(i * 2) * 0.05); s.rotation.x = 1.3; }
    const h = mesh(new T.TorusGeometry(0.06, 0.012, 8, 20, Math.PI), glassMat(), g, 0.1, 0.14, 0); h.rotation.z = -Math.PI / 2;
    return { group: g, top: 0.27 };
  }
  function iceBucket() {
    const g = new T.Group(); mesh(new T.CylinderGeometry(0.12, 0.1, 0.16, 24, 1, true), mat(0xe2e8f0, { metalness: 0.35, roughness: 0.3, side: T.DoubleSide }), g, 0, 0.08, 0); cyl(0.1, 0.1, 0.01, 0x94a3b8, g, 0, 0.005, 0);
    const iceM = new T.MeshStandardMaterial({ color: 0xe0f7ff, transparent: true, opacity: 0.85, roughness: 0.05, metalness: 0.1 }), cubes = [];
    for (let i = 0; i < 14; i++) { const a = i * 2.39, r = 0.02 + (i % 4) * 0.022, c = mesh(new T.BoxGeometry(0.04, 0.04, 0.04), iceM, g, Math.cos(a) * r, 0.12 + (i % 3) * 0.02, Math.sin(a) * r); c.rotation.set(i, i * 2, 0); cubes.push(c); }
    g.userData.melt = (k) => cubes.forEach((c, i) => c.scale.setScalar(Math.max(0.15, 1 - k * (0.6 + (i % 3) * 0.15))));   // ice melting in the sun
    return { group: g, top: 0.17 };
  }
  function sugarPack() {
    const g = new T.Group(), t = tex((c, W, H) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); c.fillStyle = '#2563eb'; c.fillRect(0, 0, W, H * 0.22); c.fillRect(0, H * 0.8, W, H * 0.2); c.fillStyle = '#1e3a8a'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'SUGAR', W * 0.8, 90); c.fillText('SUGAR', W / 2, H * 0.45); c.font = `700 44px ${FONT}`; c.fillText('1 kg', W / 2, H * 0.66); }, 256, 320);
    box(0.13, 0.18, 0.07, 0xffffff, g, 0, 0.09, 0, 0.012); mesh(new T.PlaneGeometry(0.12, 0.17), new T.MeshStandardMaterial({ map: t, roughness: 0.7 }), g, 0, 0.09, 0.0365);
    return { group: g, top: 0.18 };
  }
  function paperCups() { const g = new T.Group(); for (let i = 0; i < 8; i++) { const c = mesh(new T.CylinderGeometry(0.038, 0.028, 0.095, 20, 1, true), mat(i % 2 ? 0xffffff : 0xfef3c7, { side: T.DoubleSide }), g, 0, 0.0475 + i * 0.018, 0); void c; } return { group: g, top: 0.22 }; }

  // ---------- Rio's stall (kid size: counter top at 0.78 m) ----------
  function rioStall() {
    const g = new T.Group(), W = 1.5, H = 0.78, D = 0.62;
    box(W, 0.05, D, WOOD, g, 0, H - 0.025, 0, 0.012);
    for (const [x, z] of [[-W / 2 + 0.06, -D / 2 + 0.06], [W / 2 - 0.06, -D / 2 + 0.06], [-W / 2 + 0.06, D / 2 - 0.06], [W / 2 - 0.06, D / 2 - 0.06]]) box(0.06, H - 0.05, 0.06, WOOD2, g, x, (H - 0.05) / 2, z, 0.01);
    const front = tex((c, Wd, Hd) => { c.fillStyle = '#fff7d6'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#facc15'; c.fillRect(0, 0, Wd, 26); c.fillRect(0, Hd - 26, Wd, 26);
      drawLemon(c, 120, Hd / 2 + 6, 62); drawLemon(c, Wd - 120, Hd / 2 + 6, 62);
      c.fillStyle = '#7c3aed'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, "RIO'S COOL LEMONADE", Wd - 440, 92, 800); c.fillText("RIO'S COOL LEMONADE", Wd / 2, Hd * 0.4);
      c.fillStyle = '#16a34a'; c.font = `800 64px ${FONT}`; c.fillText('₹10 a cup', Wd / 2, Hd * 0.72); }, 1400, 380);
    mesh(new T.PlaneGeometry(W - 0.04, 0.5), new T.MeshStandardMaterial({ map: front, roughness: 0.7 }), g, 0, H - 0.31, D / 2 + 0.004);
    box(W - 0.04, 0.5, 0.02, 0xfff7d6, g, 0, H - 0.31, D / 2 - 0.008, 0.004);
    // awning on poles
    const PH = 1.95; for (const x of [-W / 2 + 0.04, W / 2 - 0.04]) for (const z of [-D / 2 + 0.04, D / 2 - 0.04]) cyl(0.022, 0.022, PH, 0xf8fafc, g, x, PH / 2, z, 10);
    const aw = mesh(new T.PlaneGeometry(W + 0.3, D + 0.45), new T.MeshStandardMaterial({ map: stripes('#facc15', '#ffffff', 10), side: T.DoubleSide, roughness: 0.8 }), g, 0, PH + 0.02, 0.08); aw.rotation.x = -Math.PI / 2 + 0.22;
    const val = tex((c, Wd, Hd) => { const n = 10; for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#facc15'; c.beginPath(); c.moveTo(i * Wd / n, 0); c.lineTo((i + 1) * Wd / n, 0); c.lineTo((i + 0.5) * Wd / n, Hd); c.closePath(); c.fill(); } }, 512, 64);
    const v = mesh(new T.PlaneGeometry(W + 0.3, 0.13), new T.MeshStandardMaterial({ map: val, transparent: true, side: T.DoubleSide }), g, 0, PH - 0.1, D / 2 + 0.3); void v;
    // sign on top + bunting
    const topSign = tex((c, Wd, Hd) => { c.fillStyle = '#7c3aed'; c.beginPath(); c.roundRect(0, 0, Wd, Hd, 40); c.fill(); c.fillStyle = '#ffd84a'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'LEMONADE', Wd * 0.8, 120, 800); c.fillText('LEMONADE', Wd / 2, Hd / 2 + 4); }, 640, 180);
    mesh(new T.PlaneGeometry(0.9, 0.25), new T.MeshStandardMaterial({ map: topSign, transparent: true }), g, 0, PH + 0.32, 0.2).rotation.x = -0.12;
    // counter goods: jug, lemon basket, ice bucket, cup stack, cash box
    put(g, 'lemonade_jug', -0.48, H, -0.08); put(g, 'lemon_basket', 0.5, H, -0.1); put(g, 'ice_bucket', 0.12, H, -0.16); put(g, 'paper_cups', -0.18, H, -0.18); put(g, 'coin_box', 0.62, H, 0.16, -0.3, 1.2);
    return { group: g, top: H, phys: { shape: 'box', size: [W, H, D], mass: 0, yOffset: H / 2 }, size: [W + 0.3, PH + 0.5, D + 0.4] };
  }
  // Mira's giant smiling lemon sign (A-frame)
  function bigLemonSign() {
    const g = new T.Group(), t = tex((c, W, H) => { c.fillStyle = '#7c3aed'; c.beginPath(); c.roundRect(0, 0, W, H, 50); c.fill(); c.fillStyle = '#fff7d6'; c.beginPath(); c.roundRect(24, 24, W - 48, H - 48, 36); c.fill();
      drawLemon(c, W / 2, H * 0.4, W * 0.24);
      c.fillStyle = '#facc15'; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, x = W / 2 + Math.cos(a) * W * 0.38, y = H * 0.4 + Math.sin(a) * W * 0.34; c.save(); c.translate(x, y); c.rotate(a); c.fillRect(-4, -14, 8, 28); c.restore(); }
      c.fillStyle = '#7c3aed'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'ICE-COLD LEMONADE!', W * 0.84, 84, 800); c.fillText('ICE-COLD LEMONADE!', W / 2, H * 0.78);
      c.fillStyle = '#16a34a'; c.font = `800 60px ${FONT}`; c.fillText('₹10  ➜', W / 2, H * 0.9); }, 640, 860);
    const board = mesh(new T.PlaneGeometry(0.85, 1.15), new T.MeshStandardMaterial({ map: t, roughness: 0.7 }), g, 0, 0.72, 0.14); board.rotation.x = -0.18;
    const back = box(0.88, 1.18, 0.03, 0x7c3aed, g, 0, 0.72, 0.12, 0.01); back.rotation.x = -0.18;
    const leg = box(0.8, 1.15, 0.03, WOOD2, g, 0, 0.62, -0.16, 0.01); leg.rotation.x = 0.22;
    return { group: g, top: 1.3 };
  }
  // the rival stall across the road: lemonade for ₹5
  function rivalStall() {
    const g = new T.Group(), W = 1.7, H = 0.9, D = 0.7;
    box(W, H, D, 0xdc2626, g, 0, H / 2, 0, 0.02); box(W + 0.06, 0.05, D + 0.06, 0xffffff, g, 0, H + 0.025, 0, 0.01);
    const f = tex((c, Wd, Hd) => { c.fillStyle = '#fef2f2'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#dc2626'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'LEMONADE', Wd * 0.8, 110, 800); c.fillText('LEMONADE', Wd / 2, Hd * 0.34);
      c.fillStyle = '#facc15'; c.beginPath(); c.arc(Wd / 2, Hd * 0.72, 70, 0, Math.PI * 2); c.fill(); c.fillStyle = '#b91c1c'; c.font = `900 84px ${FONT}`; c.fillText('₹5!', Wd / 2, Hd * 0.73); }, 900, 420);
    mesh(new T.PlaneGeometry(W - 0.1, H - 0.1), new T.MeshStandardMaterial({ map: f }), g, 0, H / 2, D / 2 + 0.012);
    const PH = 2.2; for (const x of [-W / 2 + 0.05, W / 2 - 0.05]) for (const z of [-D / 2 + 0.05, D / 2 - 0.05]) cyl(0.025, 0.025, PH, 0xffffff, g, x, PH / 2, z, 10);
    const aw = mesh(new T.PlaneGeometry(W + 0.3, D + 0.5), new T.MeshStandardMaterial({ map: stripes('#dc2626', '#ffffff', 10), side: T.DoubleSide }), g, 0, PH + 0.02, 0.08); aw.rotation.x = -Math.PI / 2 + 0.22;
    const big = tex((c, Wd, Hd) => { c.fillStyle = '#facc15'; c.beginPath(); c.roundRect(0, 0, Wd, Hd, 30); c.fill(); c.fillStyle = '#b91c1c'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'ONLY ₹5 !!', Wd * 0.88, 120, 900); c.fillText('ONLY ₹5 !!', Wd / 2, Hd / 2 + 4); }, 640, 180);
    mesh(new T.PlaneGeometry(1.2, 0.34), new T.MeshStandardMaterial({ map: big, transparent: true }), g, 0, PH + 0.38, 0.25).rotation.x = -0.1;
    for (let i = 0; i < 10; i++) put(g, 'lemonade_cup', -0.6 + (i % 5) * 0.3, H + 0.05, -0.12 + Math.floor(i / 5) * 0.2);
    return { group: g, top: H + 0.05 };
  }
  // park gate: an arch with the park's name, short fence either side
  function parkGate() {
    const g = new T.Group(), GW = 3.2, GH = 3.3;
    for (const sx of [-1, 1]) { box(0.45, GH, 0.45, 0xe9d5b5, g, sx * GW / 2, GH / 2, 0, 0.04); box(0.6, 0.22, 0.6, 0xc8a97e, g, sx * GW / 2, GH + 0.11, 0, 0.03); sphere(0.18, 0x16a34a, g, sx * GW / 2, GH + 0.38, 0); }
    const t = tex((c, W, H) => { c.fillStyle = '#16a34a'; c.beginPath(); c.roundRect(0, 0, W, H, 34); c.fill(); c.fillStyle = '#fef9c3'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'COLONY PARK', W * 0.86, 120, 800); c.fillText('COLONY PARK', W / 2, H / 2 + 4); }, 900, 200);
    box(GW + 0.6, 0.6, 0.2, 0x15803d, g, 0, GH - 0.25, 0, 0.04); for (const sz of [1, -1]) { const s = mesh(new T.PlaneGeometry(GW + 0.4, 0.52), new T.MeshStandardMaterial({ map: t }), g, 0, GH - 0.25, sz * 0.105); if (sz < 0) s.rotation.y = Math.PI; }
    for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) { const x = sx * (GW / 2 + 0.5 + i * 0.75); box(0.1, 1.1, 0.1, 0x15803d, g, x, 0.55, 0, 0.02); if (i < 8) { box(0.75, 0.06, 0.05, 0x16a34a, g, x + sx * 0.375, 0.95, 0, 0.01); box(0.75, 0.06, 0.05, 0x16a34a, g, x + sx * 0.375, 0.45, 0, 0.01); } }
    return { group: g, top: GH };
  }

  // ---------- the colony street set ----------
  // local frame: Rio's stall at the origin facing +z (the camera side); the road runs along x at z −3; the park gate is across
  // the road at z −7.4 with the park behind it; the "park spot" (where the stall moves) is in front of the gate at (−0.6, 0, −6.1).
  function colonySet() {
    const g = new T.Group();
    const pave = (w, d, x, z, c = '#d6d3d1') => { const t = tex((cx, W, H) => { cx.fillStyle = c; cx.fillRect(0, 0, W, H); cx.strokeStyle = 'rgba(0,0,0,0.08)'; cx.lineWidth = 3; for (let i = 0; i <= 8; i++) { cx.beginPath(); cx.moveTo(i * W / 8, 0); cx.lineTo(i * W / 8, H); cx.stroke(); } cx.beginPath(); cx.moveTo(0, H / 2); cx.lineTo(W, H / 2); cx.stroke(); }, 512, 128); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(w / 4, 1); const m = mesh(new T.PlaneGeometry(w, d), new T.MeshStandardMaterial({ map: t, roughness: 0.95 }), g, x, 0.012, z); m.rotation.x = -Math.PI / 2; m.castShadow = false; return m; };
    // ground: warm grass beyond everything
    const gr = mesh(new T.PlaneGeometry(90, 70), mat(0x8cc063, { roughness: 1 }), g, 0, -0.01, -6); gr.rotation.x = -Math.PI / 2; gr.castShadow = false;
    pave(40, 3.2, 0, 0.4); box(40, 0.14, 0.22, 0x9ca3af, g, 0, 0.07, -1.25, 0.02);
    const road = mesh(new T.PlaneGeometry(40, 4.2), mat(0x52525b, { roughness: 1 }), g, 0, 0.006, -3.4); road.rotation.x = -Math.PI / 2; road.castShadow = false;
    for (let i = -9; i <= 9; i++) { const d = mesh(new T.PlaneGeometry(1.1, 0.12), mat(0xfafafa), g, i * 2.2, 0.01, -3.4); d.rotation.x = -Math.PI / 2; d.castShadow = false; }
    // zebra crossing to the park gate
    for (let k = 0; k < 7; k++) { const s = mesh(new T.PlaneGeometry(0.35, 3.6), mat(0xfafafa), g, -1.9 + k * 0.6, 0.011, -3.4); s.rotation.x = -Math.PI / 2; s.castShadow = false; }
    box(40, 0.14, 0.22, 0x9ca3af, g, 0, 0.07, -5.55, 0.02); pave(40, 2.0, 0, -6.6);
    // our side: colony houses behind the pavement, left and right of the stall (kept out of the middle of the shot)
    const cols = [0xfcd34d, 0xf9a8d4, 0x93c5fd, 0xa7f3d0, 0xfdba74, 0xc4b5fd, 0xfef08a, 0x99f6e4];
    for (let i = 0; i < 8; i++) { const side = i < 4 ? -1 : 1, k = i % 4, x = side * (5.5 + k * 4.2), h = 3.4 + (k % 2) * 1.0, z = 3.6;
      box(3.8, h, 3.0, cols[i], g, x, h / 2, z, 0.04); box(4.1, 0.25, 3.3, 0xb45309, g, x, h + 0.12, z, 0.03);
      box(0.95, 1.9, 0.06, 0x7c4a2a, g, x - 0.9, 0.95, z - 1.52, 0.01); for (const wx of [0.5, 1.4]) { box(0.7, 0.75, 0.05, 0xbfe6ff, g, x + wx - 0.2, 1.6, z - 1.52, 0.01); box(0.78, 0.06, 0.12, 0xffffff, g, x + wx - 0.2, 1.2, z - 1.5, 0.01); }
      box(3.8, 0.9, 0.12, 0xffffff, g, x, 0.45, z - 1.75, 0.02); put(g, 'flower_pot', x + 1.3, 0, z - 1.95) || sphere(0.2, 0x16a34a, g, x + 1.3, 0.2, z - 1.95); }
    // street life on our side
    put(g, 'island_street_lamp', -3.2, 0, -0.95) || cyl(0.05, 0.05, 3.4, 0x334155, g, -3.2, 1.7, -0.95); put(g, 'island_street_lamp', 4.6, 0, -0.95);
    put(g, 'tree_maple', -4.4, 0, 1.6, 0, 0.6); put(g, 'tree_oak', 3.6, 0, 1.9, 0, 0.55); put(g, 'scooter', 6.6, 0, 0.6, 0.8); put(g, 'bicycle', -6.2, 0, 0.5, 1.2);
    // across the road: the park — gate, fence, trees, balloons, an ice-cream cart, benches, swings beyond
    const gate = put(g, 'park_gate', -0.6, 0, -7.5); void gate;
    put(g, 'park_set', -0.6, 0, -17.5, 0, 1.0);
    for (const [x, z, id, s] of [[-7, -9.5, 'tree_oak', 0.8], [-11, -8.8, 'tree_maple', 0.75], [5.5, -9.6, 'tree_oak', 0.85], [9.8, -9.0, 'tree_pine', 0.7], [13, -10.5, 'tree_oak', 0.8], [-14, -10, 'tree_pine', 0.75], [2.8, -11.5, 'palm_tree', 0.7]]) put(g, id, x, 0, z, 0, s);
    put(g, 'zungga_balloons', 2.0, 0, -8.3, 0.4); put(g, 'zungga_balloons', -3.6, 0, -8.6, -0.6, 0.9);
    put(g, 'stall_ice_cream', 4.4, 0, -10.2, 0, 0.75); put(g, 'island_bench', -4.6, 0, -9.4, 0); put(g, 'island_bench', 7.2, 0, -9.0, 0);
    return { group: g, size: [30, 6, 22] };
  }

  const R = (id, name, fn, tags, cat = 'shop') => ZAssets.register(cat, id, name, fn, tags);
  R('lemon', 'Lemon', lemon, ['lemon', 'fruit', 'lemonade'], 'food');
  R('lemon_basket', 'Basket of lemons', lemonBasket, ['lemon', 'basket', 'lemonade'], 'food');
  R('lemonade_cup', 'Cup of lemonade', lemonadeCup, ['lemonade', 'cup', 'drink'], 'food');
  R('lemonade_jug', 'Jug of lemonade', lemonadeJug, ['lemonade', 'jug', 'drink'], 'food');
  R('ice_bucket', 'Ice bucket', iceBucket, ['ice', 'bucket', 'cold'], 'food');
  R('sugar_pack', 'Sugar packet (1 kg)', sugarPack, ['sugar', 'packet', 'grocery'], 'food');
  R('paper_cups', 'Stack of paper cups', paperCups, ['cups', 'paper cups'], 'food');
  R('rio_stall', "Rio's lemonade stall", rioStall, ['lemonade', 'stall', 'shop', 'business']);
  R('big_lemon_sign', "Mira's giant lemon sign", bigLemonSign, ['sign', 'lemonade', 'advert']);
  R('rival_stall', 'Rival lemonade stall (₹5)', rivalStall, ['lemonade', 'stall', 'competition']);
  R('park_gate', 'Park gate', parkGate, ['park', 'gate'], 'sets');
  R('colony_set', 'Colony street + park (set)', colonySet, ['set', 'street', 'park', 'colony', 'outdoor'], 'sets');
})();
