/* Zungga Story Studio — sports & outdoor-gym props, ported from the Play-mode island (drive-portfolio/js/game.js
 * "sports & gym" section): floodlight towers, the football pitch + goals + ball, basketball court + hoops + ball,
 * cricket ground + pitch + stumps, beach badminton court + net + racket + shuttle, and every outdoor-gym station.
 * Game units are metres already; sizes are kept as in the game. */
(() => {
  'use strict';
  const { T, tex } = ZA;
  const gmat = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });   // the game's mat()
  function add(geo, m, x = 0, y = 0, z = 0, parent, shadow = true) {
    const me = new T.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = shadow; me.receiveShadow = true; parent.add(me); return me;
  }
  // a ground-markings patch: canvas drawn like the game's field(), laid flat
  function field(w, l, draw, res = 1024) {
    const t = tex((g, W, H) => draw(g, W, H), res, Math.round(res * l / w));
    return new T.MeshStandardMaterial({ map: t, roughness: 0.95 });
  }
  const flatPatch = (w, l, m, parent, y = 0.02) => { const p = add(new T.PlaneGeometry(w, l), m, 0, y, 0, parent, false); p.rotation.x = -Math.PI / 2; return p; };
  const ironMat = () => gmat(0x2b2f3a, { metalness: 0.5, roughness: 0.5 });
  const radial = (inner, outer) => tex((g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, inner); gr.addColorStop(0.45, outer); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, 256, 256);
  const netMat = (op = 0.55) => new T.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: op });

  /* ---------- floodlight tower (lit after dark) ---------- */
  function floodlightInto(parent, x, z, tx, tz, pool = true) {
    const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(tx - x, tz - z); parent.add(g);
    add(new T.CylinderGeometry(0.14, 0.2, 9, 12), ironMat(), 0, 4.5, 0, g);
    add(new T.CylinderGeometry(0.4, 0.5, 0.2, 12), ironMat(), 0, 0.1, 0, g);
    const head = new T.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xfff3d6, emissiveIntensity: 0.1, roughness: 0.5 });
    const frame = add(new T.BoxGeometry(1.3, 0.6, 0.25), gmat(0x343a40, { metalness: 0.4 }), 0, 9.1, -0.05, g);
    frame.rotation.x = 0.35;
    const lamp = add(new T.BoxGeometry(1.2, 0.5, 0.06), head, 0, 9.12, 0.09, g, false); lamp.rotation.x = 0.35;
    const pm = new T.MeshBasicMaterial({ map: radial('rgba(255,210,140,0.95)', 'rgba(255,180,100,0.35)'), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
    let p = null;
    if (pool) { p = add(new T.PlaneGeometry(14, 14), pm, 0, 0.06, 7, g, false); p.rotation.x = -Math.PI / 2; p.renderOrder = 1; p.userData.sky = true; }
    return (on) => { head.emissiveIntensity = on ? 4 : 0.1; pm.opacity = on ? 0.55 : 0; };
  }
  function floodlightTower() {
    const group = new T.Group(), set = floodlightInto(group, 0, 0, 0, 10);
    group.userData.setOn = set; return { group };
  }
  const lightsAll = (fns) => (on) => fns.forEach((f) => f(on));

  /* ---------- ⚽ football ---------- */
  const FB = { L: 38, W: 24 };
  function footballPatch(parent) {
    return flatPatch(FB.L + 4, FB.W + 4, field(FB.L + 4, FB.W + 4, (g, W, H) => {
      for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#3f9a3a' : '#48a843'; g.fillRect(i * W / 10, 0, W / 10, H); }
      const sx = W / (FB.L + 4), m = 2 * sx; g.strokeStyle = '#fff'; g.lineWidth = 6;
      g.strokeRect(m, m, W - 2 * m, H - 2 * m); g.beginPath(); g.moveTo(W / 2, m); g.lineTo(W / 2, H - m); g.stroke();
      g.beginPath(); g.arc(W / 2, H / 2, 4.5 * sx, 0, 6.3); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 2, H / 2, 6, 0, 6.3); g.fill();
      for (const s of [0, 1]) g.strokeRect(s ? W - m - 5 * sx : m, H / 2 - 6 * sx, 5 * sx, 12 * sx);
    }), parent, 0.025);
  }
  // goal: mouth faces +z (in the game the posts sit at z ±3 and the net bulges outward)
  function goalInto(parent, x = 0, z = 0, ry = 0) {
    const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
    const post = gmat(0xffffff, { roughness: 0.4 });
    for (const xx of [-3, 3]) add(new T.CylinderGeometry(0.07, 0.07, 2.4, 12), post, xx, 1.2, 0, g);
    add(new T.CylinderGeometry(0.07, 0.07, 6.14, 12).rotateZ(Math.PI / 2), post, 0, 2.4, 0, g);
    for (const xx of [-3, 3]) { const b = add(new T.CylinderGeometry(0.03, 0.03, 1.5, 6).rotateX(Math.PI / 2), post, xx, 0.03, -0.75, g); b.castShadow = false; }
    add(new T.BoxGeometry(6, 2.4, 1.5, 8, 4, 3), netMat(0.5), 0, 1.2, -0.75, g, false);
    return g;
  }
  const footballTex = () => tex((g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) { const x = (i + (r % 2) * 0.5) * w / 6, y = (r + 0.5) * h / 4; g.beginPath(); for (let k = 0; k < 5; k++) { const a = k * 1.2566 - 1.57; g.lineTo(x + Math.cos(a) * 15, y + Math.sin(a) * 12); } g.fill(); } }, 512, 256);
  function ballMesh(r, t, parent) { const b = add(new T.SphereGeometry(r, 24, 16), new T.MeshStandardMaterial({ map: t, roughness: 0.55 }), 0, r, 0, parent); return b; }
  function footballPitch() { const group = new T.Group(); footballPatch(group); return { group }; }
  function footballGoal() { const group = new T.Group(); goalInto(group); return { group }; }
  function pitchFootball() { const group = new T.Group(); ballMesh(0.11, footballTex(), group); return { group }; }   // game ball is 0.22 r; real size 0.11
  function footballGround() {
    const group = new T.Group(); footballPatch(group);
    goalInto(group, -FB.L / 2, 0, Math.PI / 2); goalInto(group, FB.L / 2, 0, -Math.PI / 2);
    // net bulges outward: goals were built with the net at -z (behind the mouth)
    ballMesh(0.22, footballTex(), group);
    const L = [[-22, -15], [22, -15], [-22, 15], [22, 15]].map(([x, z]) => floodlightInto(group, x, z, 0, 0));
    group.userData.setOn = lightsAll(L); return { group };
  }

  /* ---------- 🏀 basketball ---------- */
  const BB = { L: 26, W: 15 };
  function bbPatch(parent) {
    return flatPatch(BB.W + 3, BB.L + 3, field(BB.W + 3, BB.L + 3, (g, W, H) => {
      g.fillStyle = '#2b5f9e'; g.fillRect(0, 0, W, H); const s = W / (BB.W + 3), m = 1.5 * s;
      g.fillStyle = '#d9822b'; g.fillRect(m, m, W - 2 * m, H - 2 * m);
      g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeRect(m, m, W - 2 * m, H - 2 * m);
      g.beginPath(); g.moveTo(m, H / 2); g.lineTo(W - m, H / 2); g.stroke(); g.beginPath(); g.arc(W / 2, H / 2, 1.8 * s, 0, 6.3); g.stroke();
      for (const e of [0, 1]) { const y0 = e ? H - m : m, d = e ? -1 : 1; g.strokeRect(W / 2 - 2.45 * s, e ? H - m - 5.8 * s : m, 4.9 * s, 5.8 * s); g.beginPath(); g.arc(W / 2, y0 + d * 1.6 * s, 6.75 * s, e ? Math.PI : 0, e ? 2 * Math.PI : Math.PI); g.stroke(); }
    }, 512), parent, 0.025);
  }
  // hoop: pole at z=0, arm reaching +z to the backboard, rim in front of it
  function hoopInto(parent, x = 0, z = 0, ry = 0) {
    const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
    const grey = gmat(0x495057, { metalness: 0.4, roughness: 0.5 });
    add(new T.CylinderGeometry(0.1, 0.12, 3.9, 12), grey, 0, 1.95, 0, g);
    add(new T.CylinderGeometry(0.3, 0.34, 0.12, 16), grey, 0, 0.06, 0, g);
    add(new T.BoxGeometry(0.1, 0.1, 1.1), grey, 0, 3.85, 0.55, g, false);
    const boardTex = tex((c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e03131'; c.lineWidth = 14; c.strokeRect(7, 7, w - 14, h - 14); c.lineWidth = 10; c.strokeRect(w * 0.34, h * 0.42, w * 0.32, h * 0.4); }, 512, 300);
    add(new T.BoxGeometry(1.8, 1.05, 0.05), new T.MeshStandardMaterial({ map: boardTex, transparent: true, opacity: 0.9, roughness: 0.3 }), 0, 3.45, 1.1, g);
    add(new T.TorusGeometry(0.23, 0.02, 8, 24).rotateX(Math.PI / 2), gmat(0xf76707, { roughness: 0.4 }), 0, 3.05, 1.5, g, false);
    add(new T.BoxGeometry(0.06, 0.04, 0.2), gmat(0xf76707), 0, 3.05, 1.2, g, false);
    add(new T.CylinderGeometry(0.23, 0.15, 0.4, 12, 2, true), netMat(0.7), 0, 2.84, 1.5, g, false);
    return g;
  }
  const bbTex = () => tex((g, w, h) => { g.fillStyle = '#e8590c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1a1a1a'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(w / 4, 0); g.bezierCurveTo(w * 0.36, h * 0.3, w * 0.36, h * 0.7, w / 4, h); g.moveTo(w * 3 / 4, 0); g.bezierCurveTo(w * 0.64, h * 0.3, w * 0.64, h * 0.7, w * 3 / 4, h); g.stroke(); }, 256, 128);
  function basketballCourt() { const group = new T.Group(); bbPatch(group); return { group }; }
  function basketballHoop() { const group = new T.Group(); hoopInto(group); return { group }; }
  function basketball() { const group = new T.Group(); ballMesh(0.12, bbTex(), group); return { group }; }
  function basketballGround() {
    const group = new T.Group(); bbPatch(group);
    hoopInto(group, 0, -(BB.L / 2 + 1.0), 0); hoopInto(group, 0, BB.L / 2 + 1.0, Math.PI);
    ballMesh(0.12, bbTex(), group);
    const L = [[-10, -9], [10, 9]].map(([x, z]) => floodlightInto(group, x, z, 0, 0));
    group.userData.setOn = lightsAll(L); return { group };
  }

  /* ---------- 🏏 cricket ---------- */
  // stumps: three stumps + bail; setOn(true) = BOWLED (the set flies over, as in the game)
  function stumpsInto(parent, x = 0, z = 0, ry = 0) {
    const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
    const inner = new T.Group(); g.add(inner);
    const wood = gmat(0xf1e3c6, { roughness: 0.6 });
    for (const xx of [-0.11, 0, 0.11]) { add(new T.CylinderGeometry(0.02, 0.02, 0.71, 10), wood, xx, 0.355, 0, inner); add(new T.ConeGeometry(0.02, 0.05, 8).rotateX(Math.PI), wood, xx, -0.01, 0, inner, false); }
    add(new T.BoxGeometry(0.11, 0.02, 0.02), wood, -0.055, 0.72, 0, inner, false); add(new T.BoxGeometry(0.11, 0.02, 0.02), wood, 0.055, 0.72, 0, inner, false);
    return (on) => inner.rotation.set(on ? 0.6 : 0, 0, on ? 0.4 : 0);
  }
  function pitchStripInto(parent) {
    return flatPatch(22, 3, field(22, 3, (g, W, H) => { g.fillStyle = '#d8c48f'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(160,130,80,0.25)'; for (let i = 0; i < 60; i++) g.fillRect((i * 97) % W, (i * 53) % H, 18, 3); g.fillStyle = '#fff'; for (const x of [0.09, 0.91]) g.fillRect(W * x, 0, 5, H); g.fillRect(W * 0.03, H * 0.15, 4, H * 0.7); g.fillRect(W * 0.97, H * 0.15, 4, H * 0.7); }, 1024), parent, 0.03);
  }
  function cricketStumps() { const group = new T.Group(), set = stumpsInto(group); group.userData.setOn = set; return { group }; }
  function cricketPitch() {
    const group = new T.Group(); pitchStripInto(group);
    const a = stumpsInto(group, -10.6, 0, Math.PI / 2), b = stumpsInto(group, 10.6, 0, Math.PI / 2);
    group.userData.setOn = (on) => b(on); return { group };
  }
  function cricketGround() {
    const group = new T.Group(), R = 26;
    const grass = add(new T.CircleGeometry(R, 64), gmat(0x6cbf4f, { roughness: 1 }), 0, 0.022, 0, group, false); grass.rotation.x = -Math.PI / 2;
    add(new T.TorusGeometry(R - 0.4, 0.07, 6, 96).rotateX(Math.PI / 2), gmat(0xffffff), 0, 0.08, 0, group, false);
    pitchStripInto(group);
    stumpsInto(group, -10.6, 0, Math.PI / 2); const bat = stumpsInto(group, 10.6, 0, Math.PI / 2);
    const L = [[-27, 0], [27, 0], [0, -27], [0, 27]].map(([x, z]) => floodlightInto(group, x, z, 0, 0));
    group.userData.setOn = lightsAll(L); return { group };
  }

  /* ---------- 🏸 beach badminton ---------- */
  function badmintonNetInto(parent) {
    const g = new T.Group(); parent.add(g);
    const white = gmat(0xffffff, { roughness: 0.5 });
    for (const s of [-1, 1]) { add(new T.CylinderGeometry(0.04, 0.04, 1.55, 10), white, s * 3.35, 0.78, 0, g); add(new T.CylinderGeometry(0.1, 0.12, 0.06, 12), gmat(0x495057), s * 3.35, 0.03, 0, g); }
    add(new T.PlaneGeometry(6.7, 0.76, 20, 3), new T.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.75, side: T.DoubleSide }), 0, 1.17, 0, g, false);
    add(new T.BoxGeometry(6.7, 0.05, 0.012), white, 0, 1.55, 0, g, false);
    return g;
  }
  function badmintonNet() { const group = new T.Group(); badmintonNetInto(group); return { group }; }
  function badmintonCourt() {
    const group = new T.Group();
    const sand = add(new T.CircleGeometry(13, 48), gmat(0xead9a6, { roughness: 1 }), 0, 0.03, 0, group, false); sand.rotation.x = -Math.PI / 2;
    const court = flatPatch(6.1, 13.4, field(6.1, 13.4, (g, W, H) => { g.clearRect(0, 0, W, H); g.strokeStyle = '#1c7ed6'; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, H - 8); g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.moveTo(W / 2, 4); g.lineTo(W / 2, H - 4); g.stroke(); }, 256), group, 0.04);
    court.material.transparent = true;
    badmintonNetInto(group);
    return { group };
  }
  function racketInto(parent) {
    const g = new T.Group(); parent.add(g);
    const black = gmat(0x212529, { roughness: 0.4, metalness: 0.3 });
    add(new T.CylinderGeometry(0.016, 0.016, 0.16, 10), gmat(0x1c7ed6, { roughness: 0.8 }), 0, 0.08, 0, g);     // grip
    add(new T.CylinderGeometry(0.008, 0.012, 0.32, 8), black, 0, 0.32, 0, g);                                    // shaft
    add(new T.TorusGeometry(0.13, 0.012, 8, 28), black, 0, 0.6, 0, g).scale.set(0.82, 1, 1);
    const strings = tex((c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(240,240,240,0.95)'; c.lineWidth = 3; for (let i = 8; i < w; i += 18) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } }, 256, 256);
    const s = add(new T.CircleGeometry(0.125, 28), new T.MeshStandardMaterial({ map: strings, transparent: true, side: T.DoubleSide, depthWrite: false }), 0, 0.6, 0, g, false); s.scale.set(0.82, 1, 1);
    return g;
  }
  function badmintonRacket() { const group = new T.Group(); racketInto(group); return { group }; }
  function shuttlecock() {
    const group = new T.Group(), g = new T.Group(); g.scale.setScalar(0.62); group.add(g);
    add(new T.SphereGeometry(0.04, 16, 12), gmat(0xf8f9fa, { roughness: 0.6 }), 0, 0.04, 0, g);
    add(new T.CylinderGeometry(0.041, 0.041, 0.02, 16), gmat(0x1c7ed6), 0, 0.06, 0, g, false);
    add(new T.CylinderGeometry(0.065, 0.03, 0.12, 16, 1, true), new T.MeshStandardMaterial({ color: 0xffffff, side: T.DoubleSide, roughness: 0.7 }), 0, 0.13, 0, g, false);
    return { group };
  }

  /* ---------- 💪 outdoor gym ---------- */
  const gymM = () => gmat(0x495057, { metalness: 0.6, roughness: 0.4 }), padM = () => gmat(0x1c7ed6, { roughness: 0.7 }), plateM = () => gmat(0x111111, { roughness: 0.5 });
  function beltTex() { const t = tex((c, w, h) => { c.fillStyle = '#16181b'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a2e33'; for (let y = 0; y < h; y += 32) c.fillRect(0, y, w, 6); }, 64, 256); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1, 3); return t; }
  // treadmill: setOn(true) = running (belt moves, console lights)
  function treadmillInto(parent, handles = true) {
    const g = new T.Group(); parent.add(g);
    add(new T.BoxGeometry(0.9, 0.18, 2.1), gymM(), 0, 0.09, 0, g);
    const bt = beltTex(); add(new T.BoxGeometry(0.75, 0.02, 1.9), new T.MeshStandardMaterial({ map: bt, roughness: 0.8 }), 0, 0.19, 0, g, false);
    for (const s of [-0.4, 0.4]) add(new T.BoxGeometry(0.05, 1.2, 0.05), gymM(), s, 0.75, 0.95, g, false);
    if (handles) for (const s of [-0.4, 0.4]) add(new T.BoxGeometry(0.05, 0.05, 0.6), gymM(), s, 1.1, 0.65, g, false);
    add(new T.BoxGeometry(0.85, 0.3, 0.12), padM(), 0, 1.35, 0.95, g, false);
    const scr = new T.MeshStandardMaterial({ color: 0x0b1d2a, emissive: 0x22d3ee, emissiveIntensity: 0, roughness: 0.4 });
    const sc = add(new T.PlaneGeometry(0.4, 0.16), scr, 0, 1.37, 0.885, g, false); sc.rotation.y = Math.PI;
    let on = false;
    g.userData.setOn = (v) => { on = !!v; scr.emissiveIntensity = on ? 1.2 : 0; };
    g.userData.tick = (t) => { bt.offset.y = on ? -t * 1.6 : 0; };
    return g;
  }
  function gymTreadmill(handles) { return () => { const group = new T.Group(), tm = treadmillInto(group, handles); group.userData.setOn = tm.userData.setOn; group.userData.tick = tm.userData.tick; return { group }; }; }
  function benchPressInto(parent) {
    const g = new T.Group(); parent.add(g);
    add(new T.BoxGeometry(0.4, 0.45, 1.5), padM(), 0, 0.32, 0, g);
    add(new T.BoxGeometry(0.3, 0.1, 1.3), gymM(), 0, 0.05, 0, g);
    for (const s of [-0.6, 0.6]) { add(new T.BoxGeometry(0.06, 1.2, 0.06), gymM(), s, 0.6, -0.55, g, false); add(new T.BoxGeometry(0.06, 0.06, 0.12), gymM(), s, 1.1, -0.5, g, false); }
    const bar = new T.Group(); bar.position.set(0, 1.15, -0.55); g.add(bar);
    add(new T.CylinderGeometry(0.02, 0.02, 1.8, 10).rotateZ(Math.PI / 2), gymM(), 0, 0, 0, bar, false);
    for (const s of [-0.75, 0.75]) add(new T.CylinderGeometry(0.2, 0.2, 0.08, 20).rotateZ(Math.PI / 2), plateM(), s, 0, 0, bar);
    return g;
  }
  function pullupInto(parent) {
    const g = new T.Group(); parent.add(g);
    for (const s of [-0.7, 0.7]) add(new T.CylinderGeometry(0.05, 0.05, 2.6, 12), gymM(), s, 1.3, 0, g);
    add(new T.CylinderGeometry(0.025, 0.025, 1.4, 10).rotateZ(Math.PI / 2), gymM(), 0, 2.55, 0, g, false);
    return g;
  }
  function dumbbellInto(parent, x = 0, y = 0.06, z = 0, k = 1) {
    const d = new T.Group(); d.position.set(x, y, z); d.scale.setScalar(k); parent.add(d);
    add(new T.CylinderGeometry(0.015, 0.015, 0.22, 8).rotateZ(Math.PI / 2), gymM(), 0, 0, 0, d, false);
    for (const s of [-0.1, 0.1]) add(new T.CylinderGeometry(0.06, 0.06, 0.05, 14).rotateZ(Math.PI / 2), plateM(), s, 0, 0, d);
    return d;
  }
  function dumbbellRackInto(parent) {
    const g = new T.Group(); parent.add(g);
    add(new T.BoxGeometry(1.6, 0.7, 0.4), gymM(), 0, 0.35, 0, g);
    for (let i = 0; i < 5; i++) dumbbellInto(g, -0.6 + i * 0.3, 0.76, 0, 1.0);
    return g;
  }
  const simple = (fn) => () => { const group = new T.Group(); fn(group); return { group }; };
  function outdoorGym() {
    const group = new T.Group();
    const fl = add(new T.PlaneGeometry(26, 18), gmat(0x343a40, { roughness: 1 }), 0, 0.03, 0, group, false); fl.rotation.x = -Math.PI / 2;
    const at = (o, x, z, ry) => { o.position.set(x, 0, z); o.rotation.y = ry; return o; };
    const t1 = at(treadmillInto(group, true), -8, -4, 0), t2 = at(treadmillInto(group, false), -8, 4, Math.PI);
    at(benchPressInto(group), -2, -4, 0); at(pullupInto(group), 4, -4, 0);
    const rack = at(dumbbellRackInto(group), -4, 4, Math.PI); rack.position.z = 4.6;
    group.userData.setOn = (on) => { t1.userData.setOn(on); t2.userData.setOn(on); };
    group.userData.tick = (t) => { t1.userData.tick(t); t2.userData.tick(t); };
    return { group };
  }

  const R = (id, label, fn, tags) => ZAssets.register('sports', id, label, fn, tags);
  R('floodlight_tower', 'Floodlight tower', floodlightTower, ['floodlight', 'light', 'stadium', 'sports', 'night', 'outdoor']);
  R('football_goal', 'Football goal', footballGoal, ['football', 'goal', 'net', 'sports', 'outdoor']);
  R('football_pitch', 'Football pitch markings', footballPitch, ['football', 'pitch', 'field', 'ground', 'sports']);
  R('pitch_football', 'Football (match ball)', pitchFootball, ['football', 'ball', 'sports']);
  R('football_ground', 'Football ground (pitch, goals, lights)', footballGround, ['football', 'pitch', 'goal', 'stadium', 'sports', 'set']);
  R('basketball_court', 'Basketball court', basketballCourt, ['basketball', 'court', 'sports']);
  R('basketball_hoop', 'Basketball hoop', basketballHoop, ['basketball', 'hoop', 'basket', 'sports', 'outdoor']);
  R('basketball', 'Basketball', basketball, ['basketball', 'ball', 'sports']);
  R('basketball_ground', 'Basketball court with hoops', basketballGround, ['basketball', 'court', 'hoop', 'sports', 'set']);
  R('cricket_stumps', 'Cricket stumps', cricketStumps, ['cricket', 'stumps', 'wicket', 'sports']);
  R('cricket_pitch', 'Cricket pitch', cricketPitch, ['cricket', 'pitch', 'wicket', 'sports']);
  R('cricket_ground', 'Cricket ground', cricketGround, ['cricket', 'ground', 'stadium', 'sports', 'set']);
  R('badminton_net', 'Badminton net', badmintonNet, ['badminton', 'net', 'sports', 'beach']);
  R('badminton_court', 'Beach badminton court', badmintonCourt, ['badminton', 'court', 'beach', 'sand', 'sports', 'set']);
  R('badminton_racket', 'Badminton racket', badmintonRacket, ['badminton', 'racket', 'sports']);
  R('shuttlecock', 'Shuttlecock', shuttlecock, ['badminton', 'shuttle', 'shuttlecock', 'sports']);
  R('gym_treadmill', 'Treadmill', gymTreadmill(true), ['gym', 'treadmill', 'exercise', 'running', 'fitness']);
  R('gym_treadmill_compact', 'Treadmill (no handrails)', gymTreadmill(false), ['gym', 'treadmill', 'exercise', 'fitness']);
  R('gym_bench_press', 'Bench press', simple(benchPressInto), ['gym', 'bench press', 'weights', 'barbell', 'fitness']);
  R('gym_pullup_bar', 'Pull-up bar', simple(pullupInto), ['gym', 'pull-up', 'bar', 'fitness', 'outdoor']);
  R('gym_dumbbell_rack', 'Dumbbell rack', simple(dumbbellRackInto), ['gym', 'dumbbells', 'weights', 'rack', 'fitness']);
  R('gym_dumbbell', 'Dumbbell', simple((g) => dumbbellInto(g, 0, 0.06, 0, 1.4)), ['gym', 'dumbbell', 'weights', 'fitness']);
  R('outdoor_gym', 'Outdoor gym', outdoorGym, ['gym', 'exercise', 'fitness', 'outdoor', 'set']);
})();
