/* Zungga Story Studio — toys props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box, logoTex, mascotTex, decal, label, cyl, sphere } = ZA;
  function football(withTag = true) {
    const g = new T.Group(), r = 0.11;
    const geo = new T.IcosahedronGeometry(r, 5).toNonIndexed();
    const ico = new T.IcosahedronGeometry(1, 0), dirs = [], ip = ico.attributes.position;
    for (let i = 0; i < ip.count; i++) { const v = new T.Vector3().fromBufferAttribute(ip, i).normalize(); if (!dirs.some((d) => d.distanceTo(v) < 1e-3)) dirs.push(v); }
    const p = geo.attributes.position, cols = [], ctr = new T.Vector3();
    for (let i = 0; i < p.count; i += 3) {
      ctr.set(0, 0, 0); for (let k = 0; k < 3; k++) ctr.add(new T.Vector3().fromBufferAttribute(p, i + k)); ctr.normalize();
      const dark = dirs.some((d) => d.dot(ctr) > 0.955);   // 12 small black pentagon patches
      for (let k = 0; k < 3; k++) cols.push(...(dark ? [0.1, 0.1, 0.14] : [0.97, 0.97, 0.98]));
    }
    geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
    const ball = mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.4 }), g, 0, r, 0);
    if (withTag) {
      const tag = new T.Group(); tag.position.set(r * 0.55, r * 1.75, r * 0.55); g.add(tag);
      const t = tex((c, W, H) => { c.fillStyle = hex(Z.yellow); c.beginPath(); c.roundRect(4, 4, W - 8, H - 8, 30); c.fill(); c.fillStyle = hex(Z.ink); c.beginPath(); c.arc(50, H / 2, 16, 0, Math.PI * 2); c.fill(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 ${H * 0.55}px ${FONT}`; c.fillText('₹150', W * 0.58, H * 0.54); }, 512, 220);
      mesh(new T.BoxGeometry(0.1, 0.043, 0.002), [mat(Z.yellow), mat(Z.yellow), mat(Z.yellow), mat(Z.yellow), new T.MeshStandardMaterial({ map: t }), new T.MeshStandardMaterial({ map: t })], tag);
      const string = new T.Mesh(new T.CylinderGeometry(0.0008, 0.0008, 0.09, 4), mat(Z.ink)); string.position.set(-0.04, -0.035, 0); string.rotation.z = 0.7; tag.add(string);
      g.userData.tag = tag;
    }
    return { group: g, phys: { shape: 'sphere', r, mass: 0.43 } };
  }
  ZAssets.register('toys', 'football', 'Football + ₹150 tag', () => football(true), ["ball", "sport", "price tag", "physics"]);

  /* ---------- small local helpers ---------- */
  const V3 = (x, y, z) => new T.Vector3(x, y, z);
  const asMat = (c) => (typeof c === 'number' ? mat(c) : c);
  function tube(pts, r, c, parent, closed = false, seg = 64, rad = 8) {
    const curve = new T.CatmullRomCurve3(pts.map((p) => V3(...p)), closed);
    return mesh(new T.TubeGeometry(curve, seg, r, rad, closed), asMat(c), parent);
  }
  function lathe(prof, c, parent, x = 0, y = 0, z = 0, seg = 32) {
    const m = asMat(c); m.side = T.DoubleSide;
    return mesh(new T.LatheGeometry(prof.map(([r, h]) => new T.Vector2(r, h)), seg), m, parent, x, y, z);
  }
  const soft = (c, o = {}) => mat(c, { roughness: 1, ...o });

  /* ---------- kite: Indian patang with a fluttering ribbon tail ---------- */
  function kite() {
    const g = new T.Group(), S = 0.38, half = S * Math.SQRT1_2, cy = 0.66;
    const paper = tex((c, W, H) => {
      c.fillStyle = '#facc15'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#ec4899'; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, H); c.closePath(); c.fill();   // upper half of the diamond
      c.fillStyle = '#7c3aed'; c.beginPath(); c.arc(W / 2, H / 2, W * 0.13, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = 10; c.beginPath(); c.arc(W / 2, H / 2, W * 0.13, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#22c55e'; c.beginPath(); c.moveTo(0, H); c.lineTo(W * 0.22, H); c.lineTo(0, H * 0.78); c.closePath(); c.fill();   // bottom corner patch
      c.strokeStyle = 'rgba(31,26,51,0.35)'; c.lineWidth = 8; c.strokeRect(4, 4, W - 8, H - 8);
    }, 512, 512);
    const sail = mesh(new T.PlaneGeometry(S, S), new T.MeshStandardMaterial({ map: paper, side: T.DoubleSide, roughness: 0.8 }), g, 0, cy, 0);
    sail.rotation.z = Math.PI / 4;
    const bamboo = 0xd9b36c;
    cyl(0.0035, 0.0035, 2 * half, bamboo, g, 0, cy, 0.005, 8);                                                       // spine (kaanp)
    tube([[-half, cy, 0.006], [-half / 2, cy + 0.06, 0.008], [0, cy + 0.085, 0.009], [half / 2, cy + 0.06, 0.008], [half, cy, 0.006]], 0.003, bamboo, g, false, 32, 6);   // bow
    const tri = new T.Shape(); tri.moveTo(0, 0.02); tri.lineTo(-0.055, -0.05); tri.lineTo(0.055, -0.05); tri.closePath();
    mesh(new T.ShapeGeometry(tri), new T.MeshStandardMaterial({ color: Z.pink, side: T.DoubleSide, roughness: 0.8 }), g, 0, cy - half, 0.001);   // paper tail (puchhi)
    // ribbon tail: a chain of nested pivots so the flutter travels down it
    const segs = [], L = 0.045; let parent = new T.Group(); parent.position.set(0, cy - half - 0.05, 0.002); g.add(parent);
    for (let i = 0; i < 7; i++) {
      const piv = new T.Group(); parent.add(piv); if (i) piv.position.y = -L;
      mesh(new T.PlaneGeometry(0.026, L), new T.MeshStandardMaterial({ color: i % 2 ? Z.yellow : Z.purple, side: T.DoubleSide, roughness: 0.8 }), piv, 0, -L / 2, 0);
      segs.push(piv); parent = piv;
    }
    g.userData.tick = (t) => { segs.forEach((s, i) => { s.rotation.z = 0.22 * Math.sin(t * 5 - i * 0.8); s.rotation.y = 0.35 * Math.sin(t * 3.2 - i * 0.6); }); };
    g.userData.tick(0);
    return { group: g };
  }

  /* ---------- cricket bat + ball ---------- */
  function cricketBat() {
    const g = new T.Group(), willow = 0xeccb93;
    box(0.108, 0.56, 0.034, willow, g, 0, 0.28, 0, 0.012);                                                           // blade
    box(0.062, 0.48, 0.03, 0xdcb67a, g, 0, 0.3, -0.02, 0.014);                                                       // spine on the back
    const sh = cyl(0.02, 0.052, 0.06, willow, g, 0, 0.585, 0, 24); sh.scale.z = 0.33;                                // shoulders
    cyl(0.015, 0.015, 0.29, 0xe7d3a6, g, 0, 0.735, 0, 16);                                                           // cane handle
    cyl(0.0175, 0.0175, 0.22, Z.blue, g, 0, 0.765, 0, 20);                                                           // rubber grip
    for (let i = 0; i < 7; i++) mesh(new T.TorusGeometry(0.0176, 0.0016, 6, 20), mat(0x0284c7), g, 0, 0.67 + i * 0.03, 0).rotation.x = Math.PI / 2;
    sphere(0.018, Z.blue, g, 0, 0.875, 0, 16).scale.y = 0.6;
    decal(logoTex(), 0.08, 0.066, g, 0, 0.49, 0.0175);
    const lab = decal(label('ZUNGGA', { w: 640, h: 160, bg: '#7c3aed', fg: '#ffffff', size: 110, radius: 40 }), 0.26, 0.065, g, 0, 0.24, 0.0175);
    lab.rotation.z = Math.PI / 2;
    return { group: g, phys: { shape: 'box', size: [0.108, 0.88, 0.05], mass: 1.2, yOffset: 0.44 } };
  }
  function cricketBall() {
    const g = new T.Group(), r = 0.036;
    const leather = tex((c, W, H) => {
      const gr = c.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#b91c1c'); gr.addColorStop(0.5, '#c62828'); gr.addColorStop(1, '#b91c1c');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = '#8f1515'; c.fillRect(0, H / 2 - 5, W, 10);
      c.fillStyle = '#f5ead2'; for (let x = 0; x < W; x += 12) { c.fillRect(x, H / 2 - 16, 6, 5); c.fillRect(x, H / 2 + 11, 6, 5); }
    }, 1024, 512);
    const b = new T.Group(); b.position.y = r; b.rotation.set(0.35, 0.4, 0.55); g.add(b);
    mesh(new T.SphereGeometry(r, 32, 24), new T.MeshStandardMaterial({ map: leather, roughness: 0.35 }), b);
    mesh(new T.TorusGeometry(r, 0.0011, 6, 48), mat(0x8f1515), b).rotation.x = Math.PI / 2;
    return { group: g, phys: { shape: 'sphere', r, mass: 0.16 } };
  }

  /* ---------- toy car (front faces +z) ---------- */
  function toyCar() {
    const g = new T.Group(), red = 0xef4444;
    box(0.14, 0.06, 0.28, red, g, 0, 0.056, 0, 0.024);                                                               // body
    mesh(roundBox(0.124, 0.036, 0.13, 0.012), mat(0x7dd3fc, { roughness: 0.15, metalness: 0.1 }), g, 0, 0.1, -0.025);   // window band
    box(0.126, 0.02, 0.136, red, g, 0, 0.125, -0.025, 0.009);                                                        // roof
    for (const x of [-0.064, 0.064]) box(0.012, 0.04, 0.012, red, g, x, 0.1, 0.035, 0.004);                       // A-pillars
    box(0.03, 0.003, 0.1, Z.yellow, g, 0, 0.0865, 0.085, 0.001);                                                     // bonnet stripe
    for (const z of [-0.145, 0.145]) box(0.15, 0.018, 0.02, 0xe2e8f0, g, 0, 0.034, z, 0.008);                       // bumpers
    for (const x of [-0.046, 0.046]) {
      const hl = sphere(0.012, 0xfff3b0, g, x, 0.062, 0.139, 16); hl.scale.z = 0.5; hl.material.emissive = new T.Color(0xffe680); hl.material.emissiveIntensity = 0.4;
      const tl = sphere(0.01, 0xdc2626, g, x, 0.062, -0.139, 16); tl.scale.z = 0.5;
    }
    box(0.05, 0.016, 0.004, Z.ink, g, 0, 0.058, 0.14, 0.003);                                                        // grille
    decal(label('ZUNGGA', { w: 384, h: 128, bg: '#facc15', fg: '#1f1a33', size: 80, radius: 14 }), 0.05, 0.016, g, 0, 0.034, 0.156);
    for (const s of [1, -1]) { const d = decal(label('7', { w: 256, h: 256, bg: '#ffffff', fg: '#1f1a33', size: 180, radius: 128 }), 0.038, 0.038, g, s * 0.0705, 0.058, 0.0); d.rotation.y = s * Math.PI / 2; }
    for (const x of [-0.068, 0.068]) for (const z of [-0.085, 0.09]) {
      const w = new T.Group(); w.position.set(x, 0.032, z); w.rotation.z = Math.PI / 2; g.add(w);
      cyl(0.032, 0.032, 0.026, 0x1f2937, w, 0, 0, 0, 24);
      cyl(0.017, 0.017, 0.028, 0xe2e8f0, w, 0, 0, 0, 16);
    }
    return { group: g, phys: { shape: 'box', size: [0.15, 0.135, 0.3], mass: 0.3, yOffset: 0.068 } };
  }

  /* ---------- teddy bear, sitting ---------- */
  function teddyBear() {
    const g = new T.Group(), fur = soft(0xc98b55), light = soft(0xf1d2a8), ink = soft(Z.ink, { roughness: 0.3 });
    const S = (r, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = mesh(new T.SphereGeometry(r, 28, 20), m, g, x, y, z); o.scale.set(sx, sy, sz); return o; };
    const cap = (r, l, m, x, y, z, rx, rz) => { const o = mesh(new T.CapsuleGeometry(r, l, 8, 16), m, g, x, y, z); o.rotation.set(rx, 0, rz); return o; };
    S(0.09, fur, 0, 0.11, 0, 1, 1.15, 0.9);                                                                          // body
    S(0.058, light, 0, 0.1, 0.05, 1, 1.15, 0.55);                                                                    // belly
    for (const s of [-1, 1]) {
      cap(0.037, 0.06, fur, s * 0.055, 0.037, 0.065, Math.PI / 2 - 0.1, s * -0.12);                                  // legs, out front
      const pad = mesh(new T.CircleGeometry(0.025, 24), light, g, s * 0.062, 0.042, 0.133); pad.rotation.y = s * -0.12;
      cap(0.028, 0.06, fur, s * 0.09, 0.135, 0.025, -0.5, s * 0.55);                                                 // arms
      S(0.03, fur, s * 0.055, 0.318, -0.005, 1, 1, 0.6);                                                             // ears
      S(0.018, light, s * 0.055, 0.316, 0.008, 1, 1, 0.4);
      S(0.0095, ink, s * 0.028, 0.276, 0.066);                                                                       // eyes
      S(0.003, soft(0xffffff), s * 0.028 + 0.003, 0.279, 0.075);
    }
    S(0.075, fur, 0, 0.255, 0.005);                                                                                  // head
    S(0.033, light, 0, 0.237, 0.064, 1.1, 0.85, 0.8);                                                                // muzzle
    S(0.012, ink, 0, 0.25, 0.09, 1.3, 0.9, 0.8);                                                                     // nose
    const smile = mesh(new T.TorusGeometry(0.012, 0.0018, 6, 16, Math.PI), ink, g, 0, 0.232, 0.088); smile.rotation.z = Math.PI;
    const bowM = soft(Z.pink, { roughness: 0.6 });
    S(0.013, bowM, 0, 0.192, 0.075);
    for (const s of [-1, 1]) { const c = mesh(new T.ConeGeometry(0.022, 0.04, 16), bowM, g, s * 0.024, 0.192, 0.07); c.rotation.z = s * Math.PI / 2; c.scale.z = 0.5; }
    return { group: g, phys: { shape: 'box', size: [0.24, 0.35, 0.24], mass: 0.4, yOffset: 0.17 } };
  }

  /* ---------- spinning top (lattu) with its string ---------- */
  function spinningTop() {
    const g = new T.Group(), tilt = new T.Group(), spin = new T.Group(); g.add(tilt); tilt.add(spin);
    const bands = tex((c, W, H) => {
      const cols = ['#ef4444', '#facc15', '#22c55e', '#38bdf8', '#7c3aed', '#facc15', '#ec4899', '#fb923c'];
      cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(0, (i * H) / cols.length, W, H / cols.length + 1); });
      c.fillStyle = '#ffffff'; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc((i + 0.5) * W / 8, H * 0.69, 9, 0, Math.PI * 2); c.fill(); }   // dots (show the spin)
      c.fillStyle = 'rgba(31,26,51,0.8)'; for (let i = 0; i < 4; i++) c.fillRect(i * W / 4, H * 0.25, 10, H * 0.3);
    }, 512, 512);
    lathe([[0.002, 0.012], [0.012, 0.018], [0.025, 0.032], [0.034, 0.048], [0.036, 0.055], [0.032, 0.062], [0.014, 0.066], [0.009, 0.068], [0.009, 0.079], [0, 0.082]],
      new T.MeshStandardMaterial({ map: bands, roughness: 0.45 }), spin, 0, 0, 0, 32);
    cyl(0.0018, 0.0005, 0.013, Z.steel, spin, 0, 0.0065, 0, 8).material = mat(0xcbd5e1, { metalness: 0.6, roughness: 0.3 });   // iron nail tip
    // string lying on the floor, with a bottle-cap stopper
    tube([[0.045, 0.002, 0.03], [0.09, 0.002, 0.07], [0.15, 0.002, 0.04], [0.19, 0.002, 0.09], [0.24, 0.002, 0.06], [0.27, 0.002, 0.1]], 0.0017, 0xf5efe0, g, false, 48, 5);
    cyl(0.011, 0.011, 0.005, Z.orange, g, 0.278, 0.0025, 0.105, 16);
    g.userData.tick = (t) => { spin.rotation.y = t * 22; tilt.rotation.x = 0.05 * Math.sin(t * 2.3); tilt.rotation.z = 0.05 * Math.cos(t * 2.3); };
    g.userData.tick(0);
    return { group: g };
  }

  /* ---------- lettered blocks Z-U-N-G-G-A, stacked as a little pyramid ---------- */
  function blocks() {
    const g = new T.Group(), s = 0.06;
    const spec = [['Z', Z.purple, -0.064, 0, 0.06], ['U', Z.orange, 0, 0, -0.05], ['N', Z.green, 0.064, 0, 0.1], ['G', Z.blue, -0.033, 1, -0.08], ['G', Z.pink, 0.033, 1, 0.07], ['A', Z.yellow, 0, 2, -0.12]];
    for (const [ch, col, x, row, ry] of spec) {
      const b = new T.Group(); b.position.set(x, s / 2 + row * s, 0); b.rotation.y = ry; g.add(b);
      box(s, s, s, col, b, 0, 0, 0, 0.006);
      const face = label(ch, { w: 256, h: 256, bg: '#fff7e6', fg: hex(col), size: 200, radius: 40 });
      decal(face, s * 0.8, s * 0.8, b, 0, 0, s / 2 + 0.0006);
      const side = decal(face, s * 0.8, s * 0.8, b, s / 2 + 0.0006, 0, 0); side.rotation.y = Math.PI / 2;
      const top = decal(label('★', { w: 256, h: 256, bg: '#fff7e6', fg: hex(col), size: 170, radius: 40 }), s * 0.8, s * 0.8, b, 0, s / 2 + 0.0006, 0); top.rotation.x = -Math.PI / 2;
    }
    return { group: g };
  }

  /* ---------- skipping rope lying on the floor ---------- */
  function skippingRope() {
    const g = new T.Group();
    const stripes = tex((c, W, H) => { c.fillStyle = '#ec4899'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(0, 0); c.lineTo(W * 0.3, 0); c.lineTo(W * 0.8, H); c.lineTo(W * 0.5, H); c.closePath(); c.fill(); }, 64, 64);
    stripes.wrapS = stripes.wrapT = T.RepeatWrapping; stripes.repeat.set(160, 1);
    tube([[-0.3, 0.014, 0.15], [-0.32, 0.005, 0.08], [-0.42, 0.005, -0.04], [-0.3, 0.005, -0.2], [-0.05, 0.005, -0.25], [0.12, 0.005, -0.17], [0.33, 0.005, -0.22], [0.44, 0.005, -0.04], [0.32, 0.005, 0.08], [0.3, 0.014, 0.15]],
      0.0045, new T.MeshStandardMaterial({ map: stripes, roughness: 0.7 }), g, false, 160, 8);
    for (const x of [-0.3, 0.3]) {
      const h = new T.Group(); h.position.set(x, 0.016, 0.21); h.rotation.set(Math.PI / 2, 0, 0); h.rotation.z = x > 0 ? 0.15 : -0.15; g.add(h);
      cyl(0.016, 0.013, 0.12, Z.purple, h, 0, 0, 0, 20);
      sphere(0.017, Z.purple, h, 0, 0.06, 0, 20).scale.y = 0.6;
      cyl(0.011, 0.011, 0.01, Z.yellow, h, 0, -0.064, 0, 16);
      for (let i = 0; i < 4; i++) mesh(new T.TorusGeometry(0.0145, 0.002, 6, 20), mat(Z.yellow), h, 0, -0.035 + i * 0.022, 0).rotation.x = Math.PI / 2;
    }
    return { group: g };
  }

  /* ---------- toy drone (quadcopter); tick spins the propellers ---------- */
  function toyDrone() {
    const g = new T.Group(), props = [];
    box(0.1, 0.035, 0.13, Z.white, g, 0, 0.07, 0, 0.015);
    box(0.072, 0.012, 0.092, Z.purple, g, 0, 0.09, 0, 0.006);
    const top = decal(logoTex(), 0.056, 0.046, g, 0, 0.0965, 0); top.rotation.x = -Math.PI / 2;
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const mx = sx * 0.13, mz = sz * 0.13, arm = box(0.16, 0.012, 0.018, Z.white, g, sx * 0.075, 0.075, sz * 0.075, 0.005);
      arm.rotation.y = -Math.atan2(sz, sx);
      cyl(0.016, 0.016, 0.026, Z.ink, g, mx, 0.086, mz, 20);
      mesh(new T.TorusGeometry(0.064, 0.0035, 6, 40), mat(sz > 0 ? Z.orange : Z.purple), g, mx, 0.1, mz).rotation.x = Math.PI / 2;   // prop guard
      const p = new T.Group(); p.position.set(mx, 0.103, mz); g.add(p);
      const blade = box(0.112, 0.003, 0.014, sz > 0 ? Z.orange : 0x64748b, p, 0, 0, 0, 0.0014); blade.rotation.x = 0.15;
      sphere(0.007, Z.ink, p, 0, 0.003, 0, 12);
      props.push({ p, dir: sx * sz, off: (sx + 2 * sz) * 0.7 });
      const led = sphere(0.005, sz > 0 ? 0x22c55e : 0xef4444, g, sx * 0.13, 0.072, sz * 0.13 + sz * 0.018, 10); led.material.emissive = led.material.color.clone(); led.material.emissiveIntensity = 0.9;
    }
    for (const x of [-0.045, 0.045]) {
      for (const z of [-0.04, 0.04]) box(0.008, 0.045, 0.008, 0xcbd5e1, g, x, 0.031, z, 0.003);
      box(0.012, 0.012, 0.15, 0xcbd5e1, g, x, 0.006, 0, 0.005);
    }
    sphere(0.017, Z.ink, g, 0, 0.05, 0.058, 16);
    const lens = cyl(0.008, 0.008, 0.006, 0x38bdf8, g, 0, 0.05, 0.075, 16); lens.rotation.x = Math.PI / 2; lens.material.roughness = 0.1;
    g.userData.tick = (t) => { for (const { p, dir, off } of props) p.rotation.y = off + dir * t * 31; };
    g.userData.tick(0);
    return { group: g };
  }

  /* ---------- board game: Snakes & Ladders box + board ---------- */
  function boardGame() {
    const g = new T.Group();
    const lid = tex((c, W, H) => {
      const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#fde047'); gr.addColorStop(1, '#fb923c'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = '#7c3aed'; c.fillRect(0, 0, W, 54); c.fillRect(0, H - 54, W, 54);
      c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 34px ${FONT}`; c.fillText('ZUNGGA GAMES', W / 2, 29); c.fillText('AGES 4+  ·  2–4 PLAYERS', W / 2, H - 27);
      // ladder
      c.save(); c.translate(W * 0.78, H * 0.62); c.rotate(0.25); c.strokeStyle = '#8a5a33'; c.lineWidth = 16; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-40, -230); c.lineTo(-40, 230); c.moveTo(40, -230); c.lineTo(40, 230); c.stroke();
      for (let y = -200; y <= 200; y += 50) { c.beginPath(); c.moveTo(-40, y); c.lineTo(40, y); c.stroke(); } c.restore();
      // snake
      c.strokeStyle = '#16a34a'; c.lineWidth = 46; c.lineCap = 'round'; c.beginPath(); c.moveTo(W * 0.12, H * 0.9); c.bezierCurveTo(W * 0.5, H * 0.75, W * 0.0, H * 0.55, W * 0.35, H * 0.45); c.stroke();
      c.strokeStyle = '#facc15'; c.lineWidth = 8; c.setLineDash([18, 22]); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#16a34a'; c.beginPath(); c.ellipse(W * 0.37, H * 0.43, 46, 36, -0.4, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; for (const dx of [-14, 14]) { c.beginPath(); c.arc(W * 0.37 + dx, H * 0.41, 10, 0, 7); c.fill(); }
      c.fillStyle = '#1f1a33'; for (const dx of [-12, 16]) { c.beginPath(); c.arc(W * 0.37 + dx, H * 0.41, 5, 0, 7); c.fill(); }
      c.strokeStyle = '#ef4444'; c.lineWidth = 5; c.beginPath(); c.moveTo(W * 0.41, H * 0.45); c.lineTo(W * 0.46, H * 0.47); c.stroke();
      // title
      c.fillStyle = '#1f1a33'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 14; c.strokeStyle = '#ffffff'; c.lineJoin = 'round';
      for (const [txt, y] of [['SNAKES', H * 0.18], ['& LADDERS', H * 0.3]]) { fitText(c, txt, W * 0.86, 120); c.strokeText(txt, W / 2, y); c.fillStyle = '#7c3aed'; c.fillText(txt, W / 2, y); }
    }, 1024, 1024);
    const bx = new T.Group(); bx.position.set(-0.215, 0, 0); bx.rotation.y = 0.18; g.add(bx);
    box(0.38, 0.05, 0.38, Z.purple, bx, 0, 0.025, 0, 0.006);
    mesh(new T.PlaneGeometry(0.372, 0.372), new T.MeshStandardMaterial({ map: lid, roughness: 0.5 }), bx, 0, 0.0505, 0).rotation.x = -Math.PI / 2;
    decal(label('SNAKES & LADDERS', { w: 1024, h: 128, bg: '#7c3aed', fg: '#ffffff', size: 90 }), 0.34, 0.042, bx, 0, 0.025, 0.1905);
    const board = tex((c, W, H) => {
      const n = 10, cs = W / n, cols = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa'];
      for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) {
        const row = n - 1 - r, num = row * n + (row % 2 ? n - k : k + 1);
        c.fillStyle = cols[(r + k) % cols.length]; c.fillRect(k * cs, r * cs, cs, cs);
        c.fillStyle = '#1f1a33'; c.font = `600 ${cs * 0.3}px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(String(num), k * cs + 6, r * cs + 4);
      }
      c.strokeStyle = 'rgba(31,26,51,0.25)'; c.lineWidth = 2; for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * cs, 0); c.lineTo(i * cs, H); c.moveTo(0, i * cs); c.lineTo(W, i * cs); c.stroke(); }
      const ladder = (x1, y1, x2, y2) => { const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(x2 - x1, y2 - y1); c.save(); c.translate(x1, y1); c.rotate(a); c.strokeStyle = '#8a5a33'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -18); c.lineTo(L, -18); c.moveTo(0, 18); c.lineTo(L, 18); c.stroke(); for (let s = 20; s < L; s += 34) { c.beginPath(); c.moveTo(s, -18); c.lineTo(s, 18); c.stroke(); } c.restore(); };
      const snake = (pts, col) => { c.strokeStyle = col; c.lineWidth = 22; c.lineCap = 'round'; c.beginPath(); c.moveTo(...pts[0]); c.bezierCurveTo(...pts[1], ...pts[2], ...pts[3]); c.stroke(); c.fillStyle = col; c.beginPath(); c.arc(...pts[0], 20, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(pts[0][0] - 7, pts[0][1] - 5, 5, 0, 7); c.arc(pts[0][0] + 7, pts[0][1] - 5, 5, 0, 7); c.fill(); };
      ladder(150, 900, 260, 560); ladder(560, 760, 720, 420); ladder(820, 400, 880, 90); ladder(260, 420, 140, 140);
      snake([[480, 120], [700, 260], [300, 400], [460, 640]], '#16a34a'); snake([[880, 560], [620, 700], [960, 820], [700, 960]], '#ef4444'); snake([[340, 600], [120, 650], [420, 760], [200, 960]], '#7c3aed');
    }, 1024, 1024);
    const bd = new T.Group(); bd.position.set(0.215, 0, 0.02); bd.rotation.y = -0.08; g.add(bd);
    box(0.4, 0.012, 0.4, 0x1d4ed8, bd, 0, 0.006, 0, 0.004);
    mesh(new T.PlaneGeometry(0.38, 0.38), new T.MeshStandardMaterial({ map: board, roughness: 0.6 }), bd, 0, 0.0122, 0).rotation.x = -Math.PI / 2;
    const pips = tex((c, W, H) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); c.fillStyle = '#ef4444'; for (const [x, y] of [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]]) { c.beginPath(); c.arc(x * W, y * H, W * 0.1, 0, 7); c.fill(); } }, 128, 128);
    const die = mesh(new T.BoxGeometry(0.018, 0.018, 0.018), new T.MeshStandardMaterial({ map: pips, roughness: 0.4 }), bd, 0.06, 0.0212, 0.14); die.rotation.y = 0.5;
    for (const [col, x, z] of [[Z.pink, -0.12, 0.13], [Z.green, -0.07, 0.15], [Z.yellow, 0.1, -0.05]]) {
      cyl(0.004, 0.008, 0.02, col, bd, x, 0.022, z, 16); sphere(0.0065, col, bd, x, 0.035, z, 12);
    }
    return { group: g };
  }

  /* ---------- yo-yo ---------- */
  function yoyo() {
    const g = new T.Group(), r = 0.03, m = mat(Z.purple, { roughness: 0.3 });
    const yo = new T.Group(); yo.position.y = r; yo.rotation.x = Math.PI / 2; g.add(yo);
    const prof = [[0.004, 0.0015], [0.012, 0.002], [0.025, 0.006], [0.03, 0.011], [0.029, 0.016], [0.022, 0.0185], [0, 0.0185]];
    lathe(prof, m, yo); lathe(prof, m, yo).scale.y = -1;
    cyl(0.0035, 0.0035, 0.004, 0xe2e8f0, yo, 0, 0, 0, 12);
    const star = tex((c, W, H) => { c.fillStyle = '#facc15'; c.beginPath(); c.arc(W / 2, H / 2, W * 0.47, 0, 7); c.fill(); c.fillStyle = '#ec4899'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? W * 0.16 : W * 0.38; c.lineTo(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr); } c.closePath(); c.fill(); }, 256, 256);
    for (const s of [1, -1]) { const d = decal(star, 0.036, 0.036, g, 0, r, s * 0.0187); if (s < 0) d.rotation.y = Math.PI; }
    tube([[0, 0.004, 0], [0.03, 0.002, 0.02], [0.07, 0.002, -0.015], [0.12, 0.002, 0.03], [0.17, 0.002, -0.005], [0.2, 0.002, 0.0]], 0.0012, 0xf5efe0, g, false, 48, 5);
    mesh(new T.TorusGeometry(0.011, 0.0013, 6, 24), mat(0xf5efe0), g, 0.211, 0.002, 0).rotation.x = Math.PI / 2;
    return { group: g };
  }

  ZAssets.register('toys', 'kite', 'Kite (patang)', kite, ['patang', 'kite', 'sankranti', 'sky', 'tick']);
  ZAssets.register('toys', 'cricket_bat', 'Cricket bat', cricketBat, ['cricket', 'bat', 'sport']);
  ZAssets.register('toys', 'cricket_ball', 'Cricket ball', cricketBall, ['cricket', 'ball', 'sport', 'physics']);
  ZAssets.register('toys', 'toy_car', 'Toy car', toyCar, ['car', 'toy', 'vehicle']);
  ZAssets.register('toys', 'teddy_bear', 'Teddy bear', teddyBear, ['teddy', 'bear', 'soft toy', 'plush']);
  ZAssets.register('toys', 'spinning_top', 'Spinning top (lattu)', spinningTop, ['lattu', 'top', 'spin', 'tick']);
  ZAssets.register('toys', 'blocks', 'Letter blocks Z-U-N-G-G-A', blocks, ['blocks', 'letters', 'abc', 'zungga']);
  ZAssets.register('toys', 'skipping_rope', 'Skipping rope', skippingRope, ['rope', 'skipping', 'exercise']);
  ZAssets.register('toys', 'toy_drone', 'Toy drone', toyDrone, ['drone', 'quadcopter', 'toy', 'tick']);
  ZAssets.register('toys', 'board_game', 'Snakes & Ladders board game', boardGame, ['board game', 'snakes', 'ladders', 'dice']);
  ZAssets.register('toys', 'yoyo', 'Yo-yo', yoyo, ['yoyo', 'toy']);
})();
