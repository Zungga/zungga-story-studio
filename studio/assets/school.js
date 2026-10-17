/* Zungga Story Studio — school props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box, logoTex, mascotTex, decal, label, cyl, sphere } = ZA;
  function pencil() {
    const g = new T.Group(), L = 0.175, r = 0.0038;
    const body = new T.Group(); body.rotation.z = Math.PI / 2; body.position.y = r; g.add(body);
    mesh(new T.CylinderGeometry(r, r, L * 0.82, 6), mat(Z.yellow, { roughness: 0.45 }), body, 0, 0, 0);
    mesh(new T.CylinderGeometry(r * 0.25, r, L * 0.08, 12), mat(0xf1c48f), body, 0, L * 0.45, 0);            // sharpened wood
    mesh(new T.CylinderGeometry(0.0003, r * 0.25, L * 0.025, 8), mat(0x2b2b2b), body, 0, L * 0.5125, 0);      // graphite tip
    mesh(new T.CylinderGeometry(r * 1.02, r * 1.02, L * 0.05, 14), mat(0xc0c7d0, { metalness: 0.8, roughness: 0.25 }), body, 0, -L * 0.435, 0);   // ferrule
    mesh(new T.CylinderGeometry(r * 0.98, r * 0.98, L * 0.045, 14), mat(Z.pink), body, 0, -L * 0.48, 0);      // eraser
    return { group: g, phys: { shape: 'box', size: [L, r * 1.8, r * 1.8], mass: 0.006 } };
  }
  function pencils10() {
    const g = new T.Group();
    for (let i = 0; i < 10; i++) { const p = ZAssets.build('pencil').group; p.position.set((i % 2) * 0.004, 0, (i - 4.5) * 0.0085); g.add(p); }   // all ten side by side, easy to count
    const band = mesh(new T.BoxGeometry(0.004, 0.0085, 0.088), mat(Z.pink), g, 0.03, 0.0042, 0);                                   // rubber band
    return { group: g };
  }
  function pencilBox(open = true) {
    const g = new T.Group(), W = 0.21, H = 0.032, D = 0.075, t = 0.0025, m = mat(Z.purple, { metalness: 0.3, roughness: 0.4 }), inside = mat(0xd9d4ea, { metalness: 0.3, roughness: 0.5 });
    mesh(new T.BoxGeometry(W, t, D), inside, g, 0, t / 2, 0);
    for (const [w, d, x, z] of [[W, t, 0, D / 2], [W, t, 0, -D / 2], [t, D, W / 2, 0], [t, D, -W / 2, 0]]) mesh(new T.BoxGeometry(w, H, d), m, g, x, H / 2, z);
    mesh(new T.BoxGeometry(t, H * 0.8, D - t * 2), m, g, -W * 0.3, H * 0.4, 0);                                               // compartment divider
    const hinge = new T.Group(); hinge.position.set(0, H, -D / 2); hinge.rotation.x = open ? -1.95 : 0; g.add(hinge);
    const print = tex((c, Wd, Hd) => { c.fillStyle = hex(Z.purple); c.fillRect(0, 0, Wd, Hd); for (let i = 0; i < 18; i++) { c.fillStyle = ['#facc15', '#ec4899', '#38bdf8'][i % 3]; c.beginPath(); c.arc((i * 97) % Wd, (i * 53) % Hd, 14, 0, Math.PI * 2); c.fill(); } c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 70px ${FONT}`; c.fillText('GEOMETRY BOX', Wd / 2, Hd / 2); }, 768, 280);
    mesh(new T.BoxGeometry(W + 0.004, t, D + 0.004), [m, m, new T.MeshStandardMaterial({ map: print, metalness: 0.3, roughness: 0.4 }), inside, m, m], hinge, 0, t / 2, D / 2);
    return { group: g };
  }
  function questionPapers() {
    const g = new T.Group(), W = 0.21, D = 0.297;
    const top = tex((c, Wd, Hd) => {
      c.fillStyle = '#fff'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = hex(Z.ink); c.textAlign = 'center';
      c.font = `700 52px ${FONT}`; c.fillText('UNIT TEST', Wd / 2, 90); c.font = `500 30px ${FONT}`; c.fillText('Mathematics · Class VI · Max marks: 25', Wd / 2, 140);
      c.fillRect(60, 170, Wd - 120, 3); c.textAlign = 'left'; c.font = `500 28px ${FONT}`;
      for (let i = 1; i <= 8; i++) { c.fillText(`Q${i}.`, 70, 220 + i * 70); c.fillStyle = '#9aa3ae'; c.fillRect(140, 210 + i * 70, Wd - 220, 4); c.fillStyle = hex(Z.ink); }
    }, 600, 848);
    for (let i = 0; i < 12; i++) { const s = mesh(new T.BoxGeometry(W, 0.0006, D), [mat(0xf1f5f9), mat(0xf1f5f9), i === 11 ? new T.MeshStandardMaterial({ map: top, roughness: 0.95 }) : mat(0xffffff), mat(0xffffff), mat(0xf1f5f9), mat(0xf1f5f9)], g, (Math.random() - 0.5) * 0.004, 0.0006 * i + 0.0003, (Math.random() - 0.5) * 0.004); s.rotation.y = (Math.random() - 0.5) * 0.04; }
    return { group: g, phys: { shape: 'box', size: [W, 0.008, D], mass: 0.06 } };
  }
  function lightbulb() {
    const g = new T.Group();
    const prof = [[0, 0.115], [0.02, 0.114], [0.034, 0.108], [0.04, 0.095], [0.038, 0.078], [0.03, 0.062], [0.018, 0.048], [0.015, 0.038], [0.015, 0.03]].map(([x, y]) => new T.Vector2(x, y));
    const glass = mesh(new T.LatheGeometry(prof, 40), new T.MeshPhysicalMaterial({ color: 0xfff7d6, roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.55, emissive: 0xffd34d, emissiveIntensity: 0 }), g);
    glass.castShadow = false;
    for (let i = 0; i < 5; i++) mesh(new T.TorusGeometry(0.0155, 0.0018, 6, 24), mat(0xb8bec6, { metalness: 0.85, roughness: 0.3 }), g, 0, 0.012 + i * 0.0045, 0).rotation.x = Math.PI / 2;
    mesh(new T.CylinderGeometry(0.0155, 0.012, 0.03, 24), mat(0xb8bec6, { metalness: 0.85, roughness: 0.3 }), g, 0, 0.018, 0);
    mesh(new T.CylinderGeometry(0.006, 0.004, 0.006, 16), mat(0x2b2b2b), g, 0, 0.002, 0);
    const fil = mesh(new T.TorusGeometry(0.008, 0.0008, 6, 20, Math.PI), new T.MeshStandardMaterial({ color: 0xffb020, emissive: 0xff9a00, emissiveIntensity: 0.2 }), g, 0, 0.075, 0);
    const halo = new T.Sprite(new T.SpriteMaterial({ map: tex((c, W, H) => { const gr = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); gr.addColorStop(0, 'rgba(255,225,120,0.95)'); gr.addColorStop(0.4, 'rgba(255,200,80,0.35)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, H); }, 256, 256), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 }));
    halo.position.y = 0.085; halo.scale.set(0.3, 0.3, 1); g.add(halo);
    const light = new T.PointLight(0xffd88a, 0, 3, 1.5); light.position.y = 0.085; g.add(light);
    g.userData.setOn = (on) => { glass.material.emissiveIntensity = on ? 1.6 : 0; fil.material.emissiveIntensity = on ? 4 : 0.2; halo.material.opacity = on ? 1 : 0; light.intensity = on ? 1.6 : 0; };
    return { group: g, phys: { shape: 'sphere', r: 0.04, mass: 0.03, yOffset: 0.08 } };
  }
  ZAssets.register('school', 'pencil', 'Pencil', pencil, ["stationery", "physics"]);
  ZAssets.register('school', 'pencils_10', 'Ten pencils', pencils10, ["stationery", "bundle"]);
  ZAssets.register('school', 'pencil_box_empty', 'Empty pencil box', () => pencilBox(true), ["geometry box", "stationery"]);
  ZAssets.register('school', 'question_papers', 'Question papers', questionPapers, ["exam", "test", "paper"]);
  ZAssets.register('school', 'lightbulb', 'Idea lightbulb', lightbulb, ["idea", "glow", "light"]);

  // ===================== more school props (school-home group) =====================
  const gold = () => mat(0xf2b417, { metalness: 0.55, roughness: 0.28, emissive: 0x4a2c00, emissiveIntensity: 0.35 });
  const chrome = () => mat(0xd3d9e0, { metalness: 0.6, roughness: 0.25 });
  const lathe = (pts, m, parent, x = 0, y = 0, z = 0, seg = 32) => mesh(new T.LatheGeometry(pts.map(([a, b]) => new T.Vector2(a, b)), seg), m, parent, x, y, z);
  const tmat = (t, o = {}) => new T.MeshStandardMaterial({ map: t, roughness: 0.8, ...o });
  // plain BoxGeometry with one textured face (0 +x, 1 -x, 2 +y, 3 -y, 4 +z, 5 -z)
  function faceBox(w, h, d, color, t, face, parent, x, y, z, o = {}) { const s = mat(color, o), arr = [s, s, s, s, s, s]; (Array.isArray(face) ? face : [face]).forEach((f, i) => { arr[f] = tmat(Array.isArray(t) ? t[i] : t, o); }); return mesh(new T.BoxGeometry(w, h, d), arr, parent, x, y, z); }

  function schoolBag() {
    const g = new T.Group(), W = 0.3, H = 0.4, D = 0.15, deep = 0x5b21b6;
    const body = box(W, H, D, Z.purple, g, 0, H / 2 + 0.004, 0, 0.065); body.material.roughness = 0.85;
    box(W * 0.97, 0.06, D * 0.97, deep, g, 0, 0.03, 0, 0.025);                                              // bottom panel
    box(W * 1.005, 0.02, D * 1.01, Z.yellow, g, 0, H - 0.04, 0, 0.008).scale.set(1, 1, 1);                   // top trim band
    // main zip across the front
    box(W * 0.78, 0.007, 0.006, 0x1f1a33, g, 0, H - 0.075, D / 2 + 0.002, 0.002);
    for (const x of [-0.06, 0.05]) { box(0.012, 0.022, 0.004, 0xd3d9e0, g, x, H - 0.088, D / 2 + 0.006, 0.002).material = chrome(); }
    // front pocket
    const pk = box(W * 0.8, H * 0.46, 0.055, Z.yellow, g, 0, 0.135, D / 2 + 0.015, 0.025); pk.material.roughness = 0.85;
    box(W * 0.66, 0.006, 0.006, 0x1f1a33, g, 0, 0.135 + H * 0.23 - 0.018, D / 2 + 0.043, 0.002);
    box(0.012, 0.024, 0.004, 0xd3d9e0, g, 0.06, 0.135 + H * 0.23 - 0.032, D / 2 + 0.046, 0.002).material = chrome();
    // logo patch
    box(0.13, 0.1, 0.006, 0xffffff, g, 0, 0.125, D / 2 + 0.044, 0.006);
    decal(logoTex(), 0.115, 0.094, g, 0, 0.125, D / 2 + 0.0485);
    // pink side bottle pockets
    for (const s of [-1, 1]) box(0.035, 0.15, D * 0.75, Z.pink, g, s * (W / 2 + 0.008), 0.1, 0, 0.012);
    // grab handle on top
    const hd = mesh(new T.TorusGeometry(0.035, 0.008, 10, 24, Math.PI), mat(deep), g, 0, H - 0.005, -0.02);
    // back straps (bowed tubes, flattened sideways)
    for (const s of [-1, 1]) {
      const c = new T.CatmullRomCurve3([new T.Vector3(0, H - 0.04, -D / 2 + 0.02), new T.Vector3(0, H - 0.08, -D / 2 - 0.045), new T.Vector3(0, H * 0.45, -D / 2 - 0.06), new T.Vector3(0, 0.07, -D / 2 - 0.005)]);
      const st = mesh(new T.TubeGeometry(c, 24, 0.011, 8, false), mat(deep, { roughness: 0.85 }), g, s * 0.075, 0, 0); st.scale.x = 2.4;
    }
    return { group: g };
  }

  function notebook() {
    const g = new T.Group(), W = 0.15, L = 0.21, P = 0.009, c = 0.0014;
    const ruled = tex((x, Wd, Hd) => {
      x.fillStyle = '#fffdf6'; x.fillRect(0, 0, Wd, Hd);
      x.strokeStyle = '#93c5fd'; x.lineWidth = 2; for (let y = 110; y < Hd - 20; y += 34) { x.beginPath(); x.moveTo(0, y); x.lineTo(Wd, y); x.stroke(); }
      x.strokeStyle = '#f87171'; x.lineWidth = 3; x.beginPath(); x.moveTo(78, 0); x.lineTo(78, Hd); x.stroke();
      x.fillStyle = '#1e3a8a'; x.textBaseline = 'alphabetic';
      x.font = `italic 600 38px "Comic Sans MS", "Chalkboard SE", cursive`; x.fillText('My Day', 150, 98);
      x.font = `italic 400 25px "Comic Sans MS", "Chalkboard SE", cursive`;
      const lines = ['Today I went to school', 'with Zungga. We learnt', 'about money and counting.', '10 + 10 = 20', 'I saved Rs 5 in my', 'piggy bank!'];
      lines.forEach((l, i) => x.fillText(l, 92, 104 + 34 * (i + 1)));
      x.strokeStyle = '#1e3a8a'; x.lineWidth = 2.2; x.beginPath();                                          // scribbly squiggle lines
      for (let r = 0; r < 4; r++) { const y0 = 104 + 34 * (8 + r); x.moveTo(92, y0 - 6); for (let k = 0; k < 34; k++) x.lineTo(92 + k * (r === 3 ? 6 : 11), y0 - 6 - Math.abs(Math.sin(k * 1.7 + r)) * 9); }
      x.stroke();
      x.fillStyle = '#facc15'; x.strokeStyle = '#ca8a04'; x.lineWidth = 3; x.beginPath();                    // doodle star
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 16 : 36; x.lineTo(420 + Math.cos(a) * r, 640 + Math.sin(a) * r); }
      x.closePath(); x.fill(); x.stroke();
      x.strokeStyle = '#ec4899'; x.lineWidth = 3; x.beginPath(); x.arc(330, 640, 26, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(330, 645, 14, 0.2, Math.PI - 0.2); x.stroke();
      x.fillStyle = '#ec4899'; x.fillRect(320, 630, 5, 6); x.fillRect(336, 630, 5, 6);
    }, 512, 720);
    const cover = tex((x, Wd, Hd) => {
      x.fillStyle = hex(Z.purple); x.fillRect(0, 0, Wd, Hd);
      for (let i = 0; i < 22; i++) { x.fillStyle = ['#a78bfa', '#facc15', '#ec4899'][i % 3]; x.globalAlpha = 0.5; x.beginPath(); x.arc((i * 137) % Wd, (i * 211) % Hd, 10 + (i % 4) * 6, 0, Math.PI * 2); x.fill(); }
      x.globalAlpha = 1; x.fillStyle = '#fff'; x.beginPath(); x.roundRect(70, 250, Wd - 140, 230, 26); x.fill();
      x.fillStyle = hex(Z.purple); x.textAlign = 'center'; x.font = `700 62px ${FONT}`; x.fillText('NOTEBOOK', Wd / 2, 320);
      x.fillStyle = hex(Z.ink); x.textAlign = 'left'; x.font = `500 30px ${FONT}`; x.fillText('Name:', 100, 385); x.fillText('Class:', 100, 445);
      x.fillRect(200, 390, 200, 3); x.fillRect(200, 450, 200, 3);
      x.fillStyle = '#facc15'; x.textAlign = 'center'; x.font = `700 46px ${FONT}`; x.fillText('ZUNGGA', Wd / 2, 650);
    }, 512, 720);
    mesh(new T.BoxGeometry(W, c, L), mat(0x6d28d9), g, 0, c / 2, 0);                                                     // back cover
    faceBox(W - 0.002, P, L - 0.004, 0xf3efe2, ruled, 2, g, 0.001, c + P / 2, 0, { roughness: 0.95 });                   // page block
    const hinge = new T.Group(); hinge.position.set(-W / 2, c + P, 0); g.add(hinge);
    const inside = label('Zungga  ·  ruled  ·  72 pages', { w: 512, h: 720, bg: '#ede9fe', fg: '#7c3aed', size: 30 });
    mesh(new T.BoxGeometry(W, c, L), [mat(0x6d28d9), mat(0x6d28d9), tmat(cover, { roughness: 0.6 }), tmat(inside), mat(0x6d28d9), mat(0x6d28d9)], hinge, W / 2, c / 2, 0);
    const ringM = chrome(), ringG = new T.TorusGeometry(0.0062, 0.0008, 6, 18);
    for (let i = 0; i < 17; i++) mesh(ringG, ringM, g, -W / 2 + 0.0035, (P + 2 * c) / 2, -L / 2 + 0.01 + i * (L - 0.02) / 16);
    g.userData.setOn = (on) => { hinge.rotation.z = on ? Math.PI - Math.atan2(P, W) : 0; };
    return { group: g };
  }

  function geometryBox() {
    const g = new T.Group(), W = 0.2, H = 0.024, D = 0.1, t = 0.0018;
    const tin = mat(0x2563eb, { metalness: 0.35, roughness: 0.4 }), inside = mat(0xe2e8f0, { metalness: 0.4, roughness: 0.35 });
    mesh(new T.BoxGeometry(W, t, D), inside, g, 0, t / 2, 0);
    for (const [w, d, x, z] of [[W, t, 0, D / 2], [W, t, 0, -D / 2], [t, D, W / 2, 0], [t, D, -W / 2, 0]]) mesh(new T.BoxGeometry(w, H, d), tin, g, x, H / 2, z);
    const lidPrint = tex((c, Wd, Hd) => {
      c.fillStyle = '#eff6ff'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#1d4ed8'; c.fillRect(0, 0, Wd, 70);
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 46px ${FONT}`; c.fillText('ZUNGGA GEOMETRY BOX', Wd / 2, 38);
      c.fillStyle = '#1e3a8a'; c.font = `500 24px ${FONT}`; c.textAlign = 'left';
      for (let col = 0; col < 4; col++) for (let r = 0; r < 6; r++) { const n = col + 2; c.fillText(`${n} × ${r + 1} = ${n * (r + 1)}`, 40 + col * 240, 110 + r * 52); }
    }, 1024, 420);
    const hinge = new T.Group(); hinge.position.set(0, H, -D / 2); hinge.rotation.x = -1.92; g.add(hinge);
    faceBox(W + 0.003, t, D + 0.003, 0x2563eb, lidPrint, 3, hinge, 0, t / 2, D / 2 + 0.0015, { metalness: 0.25, roughness: 0.45 });
    // set squares (transparent plastic)
    const plastic = (c) => new T.MeshStandardMaterial({ color: c, transparent: true, opacity: 0.7, roughness: 0.2, metalness: 0.05 });
    const tri = (a, b, c, x, z, ry) => {
      const s = new T.Shape(); s.moveTo(0, 0); s.lineTo(a, 0); s.lineTo(0, b); s.closePath();
      const h = new T.Path(); h.moveTo(a * 0.2, b * 0.2); h.lineTo(a * 0.58, b * 0.2); h.lineTo(a * 0.2, b * 0.58); h.closePath(); s.holes.push(h);
      const m = mesh(new T.ExtrudeGeometry(s, { depth: 0.002, bevelEnabled: false }).rotateX(-Math.PI / 2), plastic(c), g, x, t, z); m.rotation.y = ry; return m;
    };
    tri(0.085, 0.085, 0x7dd3fc, -0.095, D / 2 - 0.008, 0);
    tri(0.088, 0.05, 0xf9a8d4, 0.005, D / 2 - 0.008, 0);
    // protractor
    const ps = new T.Shape(); ps.absarc(0, 0, 0.048, 0, Math.PI, false); ps.lineTo(-0.048, 0); const ph = new T.Path(); ph.absarc(0, 0.004, 0.018, 0, Math.PI, false); ph.lineTo(0.018, 0.004); ps.holes.push(ph);
    mesh(new T.ExtrudeGeometry(ps, { depth: 0.0015, bevelEnabled: false }).rotateX(-Math.PI / 2), plastic(0xfef08a), g, 0.045, t + 0.002, 0.03);
    const pt = tex((c, Wd, Hd) => {
      c.clearRect(0, 0, Wd, Hd); c.strokeStyle = '#1f1a33'; c.fillStyle = '#1f1a33'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `600 18px ${FONT}`;
      const cx = Wd / 2, cy = Hd - 2, R = Wd / 2 - 4;
      for (let d = 0; d <= 180; d += 5) { const a = Math.PI + d * Math.PI / 180, l = d % 10 ? 10 : 20; c.lineWidth = d % 10 ? 1.5 : 2.5; c.beginPath(); c.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.lineTo(cx + Math.cos(a) * (R - l), cy + Math.sin(a) * (R - l)); c.stroke(); if (d % 30 === 0) c.fillText(String(d), cx + Math.cos(a) * (R - 36), cy + Math.sin(a) * (R - 36)); }
    }, 512, 256);
    const pp = mesh(new T.PlaneGeometry(0.096, 0.048), new T.MeshStandardMaterial({ map: pt, transparent: true, depthWrite: false }), g, 0.045, t + 0.0037, 0.03 - 0.024); pp.rotation.x = -Math.PI / 2; pp.castShadow = false;
    // 15 cm scale
    const sc = tex((c, Wd, Hd) => {
      c.fillStyle = '#fefce8'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#1f1a33'; c.textAlign = 'center'; c.font = `600 22px ${FONT}`;
      const x0 = 30, px = (Wd - 60) / 150;
      for (let mm = 0; mm <= 150; mm++) { const l = mm % 10 === 0 ? 34 : mm % 5 === 0 ? 24 : 14; c.fillRect(x0 + mm * px - 1, 0, 2, l); if (mm % 10 === 0) c.fillText(String(mm / 10), x0 + mm * px, 56); }
      c.fillStyle = '#7c3aed'; c.font = `700 22px ${FONT}`; c.fillText('ZUNGGA  ·  15 cm', Wd / 2, 92);
    }, 1024, 110);
    faceBox(0.158, 0.0018, 0.022, 0xfef3c7, sc, 2, g, 0, t + 0.0045, D / 2 - 0.016, { roughness: 0.4 });
    // compass + divider, lying in the back
    const leg = (parent, ry, tip) => {
      const lg = new T.Group(); lg.rotation.y = ry; parent.add(lg);
      mesh(new T.CylinderGeometry(0.0022, 0.0018, 0.095, 10).rotateZ(Math.PI / 2), chrome(), lg, 0.0475, 0, 0);
      if (tip === 'needle') mesh(new T.ConeGeometry(0.0012, 0.012, 8).rotateZ(-Math.PI / 2), mat(0x475569, { metalness: 0.7, roughness: 0.3 }), lg, 0.101, 0, 0);
      else { mesh(new T.CylinderGeometry(0.0035, 0.0035, 0.008, 12).rotateZ(Math.PI / 2), chrome(), lg, 0.09, 0, 0); mesh(new T.CylinderGeometry(0.0022, 0.0022, 0.03, 6).rotateZ(Math.PI / 2), mat(Z.yellow), lg, 0.098, 0, 0.0035); mesh(new T.ConeGeometry(0.0022, 0.008, 8).rotateZ(-Math.PI / 2), mat(0x2b2b2b), lg, 0.117, 0, 0.0035); }
    };
    const tool = (z, tipB, knob) => {
      const cg = new T.Group(); cg.position.set(-0.085, t + 0.01, z); g.add(cg);
      mesh(new T.CylinderGeometry(0.0045, 0.0045, 0.008, 16).rotateX(Math.PI / 2), chrome(), cg, 0, 0, 0);
      mesh(new T.CylinderGeometry(0.0022, 0.0022, 0.014, 10).rotateZ(Math.PI / 2), mat(knob), cg, -0.009, 0, 0);
      leg(cg, 0.06, 'needle'); leg(cg, -0.06, tipB);
    };
    tool(-D / 2 + 0.018, 'pencil', Z.purple); tool(-D / 2 + 0.04, 'needle', 0x1f1a33);
    return { group: g };
  }

  function crayons() {
    const g = new T.Group(), W = 0.11, H = 0.07, D = 0.03, t = 0.0015;
    const cols = [0xef4444, 0xf97316, 0xfacc15, 0x84cc16, 0x16a34a, 0x14b8a6, 0x38bdf8, 0x2563eb, 0x7c3aed, 0xec4899, 0x92400e, 0x1f2937];
    const front = tex((c, Wd, Hd) => {
      c.fillStyle = '#facc15'; c.fillRect(0, 0, Wd, Hd);
      cols.forEach((k, i) => { c.fillStyle = hex(k); c.fillRect(i * Wd / 12, 0, Wd / 12 + 1, 46); });
      c.fillStyle = hex(Z.purple); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 88px ${FONT}`; c.fillText('ZUNGGA', Wd / 2, 125);
      c.fillStyle = '#fff'; c.beginPath(); c.roundRect(Wd / 2 - 170, 175, 340, 70, 35); c.fill();
      c.fillStyle = hex(Z.ink); c.font = `700 46px ${FONT}`; c.fillText('12 CRAYONS', Wd / 2, 212);
      c.font = `500 30px ${FONT}`; c.fillText('wax crayons · safe for kids', Wd / 2, 290);
      c.strokeStyle = hex(Z.purple); c.lineWidth = 10; c.strokeRect(5, 5, Wd - 10, Hd - 10);
    }, 600, 380);
    const bm = mat(Z.yellow, { roughness: 0.7 });
    mesh(new T.BoxGeometry(W, H, t), [bm, bm, bm, bm, tmat(front, { roughness: 0.7 }), bm], g, 0, H / 2, D / 2);
    mesh(new T.BoxGeometry(W, H, t), mat(Z.purple, { roughness: 0.7 }), g, 0, H / 2, -D / 2);
    for (const s of [-1, 1]) mesh(new T.BoxGeometry(t, H, D), bm, g, s * W / 2, H / 2, 0);
    mesh(new T.BoxGeometry(W, t, D), bm, g, 0, t / 2, 0);
    const flap = new T.Group(); flap.position.set(0, H, -D / 2); flap.rotation.x = -0.55; g.add(flap);
    mesh(new T.BoxGeometry(W, 0.03, t), mat(Z.purple, { roughness: 0.7 }), flap, 0, 0.015, 0);
    const wrap = tex((c, Wd, Hd) => { c.fillStyle = '#fff'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#d4d4d4'; c.fillRect(0, Hd * 0.42, Wd, Hd * 0.16); c.fillStyle = '#222'; for (const y of [0.08, 0.14, 0.86, 0.92]) c.fillRect(0, Hd * y, Wd, 3); }, 64, 256);
    const r = 0.0043, Lc = 0.085, bodyG = new T.CylinderGeometry(r, r, Lc, 14), wrapG = new T.CylinderGeometry(r * 1.07, r * 1.07, Lc * 0.72, 14), tipG = new T.ConeGeometry(r, 0.011, 14), topG = new T.CylinderGeometry(r * 0.35, r * 0.35, 0.0008, 10);
    cols.forEach((k, i) => {
      const row = i < 6 ? 1 : 0, col = i % 6, x = (col - 2.5) * (W - 0.012) / 6, z = row ? -D / 4 + 0.001 : D / 4 - 0.001, y0 = row ? 0.014 : 0.003;
      const cm = mat(k, { roughness: 0.55 });
      mesh(bodyG, cm, g, x, y0 + Lc / 2, z);
      mesh(wrapG, tmat(wrap, { color: k, roughness: 0.7 }), g, x, y0 + Lc * 0.42, z);
      mesh(tipG, cm, g, x, y0 + Lc + 0.0055, z);
    });
    return { group: g };
  }

  function globe() {
    const g = new T.Group(), R = 0.13, tilt = 0.41;
    const world = tex((c, Wd, Hd) => {
      const gr = c.createLinearGradient(0, 0, 0, Hd); gr.addColorStop(0, '#60a5fa'); gr.addColorStop(0.5, '#2563eb'); gr.addColorStop(1, '#60a5fa'); c.fillStyle = gr; c.fillRect(0, 0, Wd, Hd);
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2;
      for (let i = 1; i < 12; i++) { c.beginPath(); c.moveTo(i * Wd / 12, 0); c.lineTo(i * Wd / 12, Hd); c.stroke(); }
      for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(0, i * Hd / 6); c.lineTo(Wd, i * Hd / 6); c.stroke(); }
      const P = ([lo, la]) => [(lo + 180) / 360 * Wd, (90 - la) / 180 * Hd];
      const land = (pts, col = '#4ade80') => { c.beginPath(); pts.map(P).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = col; c.strokeStyle = '#15803d'; c.lineWidth = 5; c.lineJoin = 'round'; c.stroke(); c.fill(); };
      land([[-165, 65], [-140, 70], [-95, 72], [-75, 62], [-60, 50], [-70, 42], [-80, 30], [-82, 26], [-97, 26], [-97, 20], [-90, 18], [-83, 10], [-78, 8], [-90, 14], [-105, 20], [-115, 30], [-124, 40], [-125, 50], [-140, 59], [-160, 58]]);
      land([[-52, 82], [-25, 80], [-20, 70], [-43, 60], [-55, 68]], '#e2e8f0');
      land([[-80, 10], [-62, 11], [-50, 2], [-35, -6], [-40, -22], [-48, -27], [-58, -38], [-65, -55], [-72, -50], [-72, -30], [-70, -18], [-80, -6]]);
      land([[-10, 36], [-9, 43], [-2, 44], [-4, 48], [2, 51], [8, 54], [10, 58], [5, 62], [15, 68], [25, 71], [40, 67], [42, 45], [28, 41], [22, 37], [15, 40], [12, 44], [4, 43]], '#86efac');
      land([[-6, 50], [2, 51], [0, 58], [-5, 58]], '#86efac');
      land([[-17, 15], [-16, 27], [-6, 35], [10, 37], [32, 31], [43, 12], [51, 11], [42, -2], [40, -15], [33, -26], [20, -35], [13, -18], [9, 4], [-8, 5]], '#fde047');
      land([[44, -13], [50, -16], [47, -25], [43, -22]], '#fde047');
      land([[42, 45], [40, 67], [70, 73], [110, 77], [140, 72], [180, 68], [178, 62], [160, 58], [142, 53], [135, 44], [128, 38], [122, 30], [120, 23], [108, 21], [106, 10], [100, 14], [98, 18], [93, 22], [88, 22], [80, 16], [77, 8], [73, 18], [68, 24], [58, 25], [57, 27], [50, 30], [36, 36]], '#4ade80');
      land([[36, 32], [43, 13], [52, 16], [59, 22], [56, 26], [48, 30]], '#fde047');
      land([[93, 22], [88, 22], [80, 16], [77, 8], [73, 18], [68, 24], [72, 30], [78, 33], [88, 28]], '#fb923c');                      // India
      land([[130, 32], [136, 35], [142, 41], [141, 36], [134, 33]]);
      land([[96, 4], [105, -6], [116, -8], [118, 0], [110, 2], [100, 6]]); land([[130, -2], [141, -3], [150, -10], [140, -9]]);
      land([[113, -22], [122, -18], [131, -12], [137, -12], [142, -11], [146, -19], [153, -27], [150, -37], [146, -39], [138, -35], [130, -32], [115, -34]], '#fb7185');
      land([[166, -35], [178, -38], [174, -46], [168, -46]]);
      c.fillStyle = '#f1f5f9'; c.fillRect(0, Hd * (160 / 180), Wd, Hd * (20 / 180));
    }, 1024, 512);
    const wood = mat(Z.woodDark, { roughness: 0.5 });
    lathe([[0, 0], [0.095, 0], [0.097, 0.008], [0.088, 0.022], [0.05, 0.03], [0.02, 0.04], [0, 0.042]], wood, g);
    cyl(0.009, 0.012, 0.03, Z.woodDark, g, 0, 0.05, 0).material = wood;
    const tg = new T.Group(); tg.position.y = 0.064; tg.rotation.z = tilt; g.add(tg);
    const C = R + 0.014;
    const arc = mesh(new T.TorusGeometry(C, 0.004, 8, 48, Math.PI), gold(), tg, 0, C, 0); arc.rotation.z = Math.PI / 2;
    sphere(0.008, Z.yellow, tg, 0, 0, 0).material = gold();
    for (const y of [0.004, 2 * C - 0.004]) cyl(0.003, 0.003, 0.02, 0, tg, 0, y + (y > C ? -0.006 : 0.006), 0).material = gold();
    const spin = new T.Group(); spin.position.y = C; tg.add(spin);
    mesh(new T.SphereGeometry(R, 48, 32), tmat(world, { roughness: 0.45 }), spin);
    g.userData.tick = (time) => { spin.rotation.y = time * 0.35; };
    return { group: g };
  }

  function reportCard() {
    const g = new T.Group(), W = 0.15, H = 0.21, t = 0.0012, th = 0.42;
    const left = tex((c, Wd, Hd) => {
      c.fillStyle = '#fffdf7'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = hex(Z.purple); c.fillRect(0, 0, Wd, 120);
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 40px ${FONT}`; c.fillText('ZUNGGA SCHOOL', Wd / 2, 60);
      c.fillStyle = hex(Z.ink); c.font = `700 56px ${FONT}`; c.fillText('REPORT CARD', Wd / 2, 330);
      c.font = `500 28px ${FONT}`; c.fillText('Term 1  ·  2026–27', Wd / 2, 380);
      c.textAlign = 'left'; c.font = `500 30px ${FONT}`;
      [['Name', 'Kavin'], ['Class', 'VI – A'], ['Roll No.', '12'], ['Attendance', '98%']].forEach(([k, v], i) => { const y = 470 + i * 58; c.fillStyle = '#64748b'; c.fillText(k + ':', 60, y); c.fillStyle = hex(Z.ink); c.font = `700 30px ${FONT}`; c.fillText(v, 240, y); c.font = `500 30px ${FONT}`; c.fillStyle = '#cbd5e1'; c.fillRect(235, y + 20, 220, 2); });
      c.strokeStyle = hex(Z.yellow); c.lineWidth = 12; c.strokeRect(12, 132, Wd - 24, Hd - 144);
    }, 512, 720);
    const right = tex((c, Wd, Hd) => {
      c.fillStyle = '#fffdf7'; c.fillRect(0, 0, Wd, Hd); c.textBaseline = 'middle';
      c.fillStyle = hex(Z.ink); c.textAlign = 'center'; c.font = `700 40px ${FONT}`; c.fillText('GRADES', Wd / 2, 60);
      c.fillStyle = '#ede9fe'; c.fillRect(40, 100, Wd - 80, 56); c.fillStyle = hex(Z.purple); c.font = `700 28px ${FONT}`; c.textAlign = 'left'; c.fillText('Subject', 60, 128); c.textAlign = 'right'; c.fillText('Grade', Wd - 60, 128);
      ['English', 'Maths', 'Science', 'Social', 'Tamil', 'Art'].forEach((s, i) => { const y = 190 + i * 56; c.fillStyle = '#e2e8f0'; c.fillRect(40, y + 26, Wd - 80, 2); c.fillStyle = hex(Z.ink); c.textAlign = 'left'; c.font = `500 30px ${FONT}`; c.fillText(s, 60, y); c.fillStyle = '#16a34a'; c.textAlign = 'right'; c.font = `700 34px ${FONT}`; c.fillText('A+', Wd - 70, y); });
      c.save(); c.translate(Wd / 2 - 60, 600); c.rotate(-0.2); c.strokeStyle = '#dc2626'; c.lineWidth = 8; c.beginPath(); c.arc(0, 0, 78, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#dc2626'; c.textAlign = 'center'; c.font = `700 80px ${FONT}`; c.fillText('A+', 0, 6); c.restore();
      c.fillStyle = '#2563eb'; c.font = `italic 600 30px "Comic Sans MS", cursive`; c.textAlign = 'left'; c.fillText('Excellent!', 300, 580);
      c.strokeStyle = '#2563eb'; c.lineWidth = 3; c.beginPath(); c.moveTo(300, 640); for (let k = 0; k < 18; k++) c.lineTo(300 + k * 8, 640 - Math.sin(k * 1.3) * 14); c.stroke();
      c.fillStyle = '#64748b'; c.font = `500 20px ${FONT}`; c.fillText('Class teacher', 300, 680);
    }, 512, 720);
    const coverM = mat(Z.purple, { roughness: 0.6 });
    for (const [s, tx] of [[-1, left], [1, right]]) {
      const pg = new T.Group(); pg.rotation.y = -s * th; g.add(pg);
      mesh(new T.BoxGeometry(W, H, t), [coverM, coverM, coverM, coverM, tmat(tx), coverM], pg, s * W / 2, H / 2, 0);
    }
    decal(logoTex(), 0.03, 0.025, g.children[0], -W / 2, H * 0.73, t / 2 + 0.0005);
    return { group: g };
  }

  function trophy() {
    const g = new T.Group(), G = gold(), base = mat(0x2a1a12, { roughness: 0.45 });
    box(0.12, 0.04, 0.12, 0, g, 0, 0.02, 0, 0.006).material = base;
    box(0.09, 0.04, 0.09, 0, g, 0, 0.06, 0, 0.005).material = base;
    const plate = label('1st', { w: 256, h: 128, bg: '#f5c542', fg: '#5a3800', size: 96 });
    mesh(new T.PlaneGeometry(0.05, 0.025), tmat(plate, { metalness: 0.35, roughness: 0.3 }), g, 0, 0.06, 0.0455);
    lathe([[0, 0], [0.032, 0], [0.032, 0.006], [0.016, 0.012], [0.008, 0.03], [0.006, 0.042], [0.012, 0.05], [0.02, 0.056], [0, 0.058]], G, g, 0, 0.08, 0);
    const cupY = 0.135;
    lathe([[0, 0], [0.018, 0.002], [0.034, 0.018], [0.048, 0.042], [0.057, 0.072], [0.062, 0.1], [0.064, 0.112], [0.058, 0.112], [0.055, 0.096], [0.05, 0.07], [0.04, 0.045], [0.02, 0.025], [0, 0.02]], G, g, 0, cupY, 0, 40).material.side = T.DoubleSide;
    for (const s of [-1, 1]) { const h = mesh(new T.TorusGeometry(0.03, 0.0055, 10, 24, Math.PI), G, g, s * 0.052, cupY + 0.066, 0); h.rotation.z = s * -Math.PI / 2; h.scale.set(1, 1.1, 1); }
    // star badge on the cup
    const st = tex((c, Wd, Hd) => { c.clearRect(0, 0, Wd, Hd); c.fillStyle = '#fff7cc'; c.strokeStyle = '#a16207'; c.lineWidth = 6; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 50 : 116; c.lineTo(Wd / 2 + Math.cos(a) * r, Hd / 2 + 6 + Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#a16207'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 70px ${FONT}`; c.fillText('1', Wd / 2, Hd / 2 + 14); }, 256, 256);
    const sd = decal(st, 0.05, 0.05, g, 0, cupY + 0.07, 0.0575); sd.rotation.x = -0.18;
    return { group: g };
  }

  function medal() {
    const g = new T.Group(), R = 0.035, G = gold();
    const face = tex((c, Wd, Hd) => {
      const gr = c.createRadialGradient(Wd * 0.4, Hd * 0.35, 10, Wd / 2, Hd / 2, Wd / 2); gr.addColorStop(0, '#fff1a8'); gr.addColorStop(0.6, '#f2b417'); gr.addColorStop(1, '#b7791f'); c.fillStyle = gr; c.fillRect(0, 0, Wd, Hd);
      c.strokeStyle = '#a16207'; c.lineWidth = 8; c.beginPath(); c.arc(Wd / 2, Hd / 2, Wd * 0.4, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#fff7cc'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 40 : 96; c.lineTo(Wd / 2 + Math.cos(a) * r, Hd / 2 + Math.sin(a) * r); } c.closePath(); c.fill();
      c.fillStyle = '#a16207'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 72px ${FONT}`; c.fillText('1', Wd / 2, Hd / 2 + 8);
    }, 256, 256);
    const fm = tmat(face, { metalness: 0.4, roughness: 0.3 });
    mesh(new T.CylinderGeometry(R, R, 0.005, 40).rotateX(Math.PI / 2), [G, fm, fm], g, 0, R, 0);
    mesh(new T.TorusGeometry(R, 0.0028, 8, 40), G, g, 0, R, 0);
    mesh(new T.TorusGeometry(0.006, 0.0016, 8, 16), G, g, 0, 2 * R + 0.004, 0);
    const rib = tex((c, Wd, Hd) => { c.fillStyle = hex(Z.purple); c.fillRect(0, 0, Wd, Hd); c.fillStyle = hex(Z.yellow); c.fillRect(Wd * 0.38, 0, Wd * 0.24, Hd); c.fillStyle = '#fff'; c.fillRect(Wd * 0.33, 0, Wd * 0.04, Hd); c.fillRect(Wd * 0.63, 0, Wd * 0.04, Hd); }, 64, 256);
    const rm = tmat(rib, { roughness: 0.6 }), L = 0.2;
    for (const s of [-1, 1]) { const st = mesh(new T.BoxGeometry(0.026, L, 0.0015), rm, g, 0, 0, -0.004); st.geometry.translate(0, L / 2, 0); st.position.set(s * 0.006, 2 * R + 0.006, -0.004 - (s > 0 ? 0.0016 : 0)); st.rotation.z = -s * 0.26; }
    box(0.03, 0.012, 0.004, 0, g, 0, 2 * R + 0.012, -0.002, 0.002).material = G;
    return { group: g };
  }

  function calculator() {
    const g = new T.Group(), W = 0.08, L = 0.14, H = 0.012;
    box(W, H, L, 0x334155, g, 0, H / 2, 0, 0.005);
    const face = tex((c, Wd, Hd) => {
      const px = Wd / W, X = (x) => (x + W / 2) * px, Y = (z) => (z + L / 2) * px;
      c.fillStyle = '#475569'; c.fillRect(0, 0, Wd, Hd);
      c.fillStyle = '#1e293b'; c.beginPath(); c.roundRect(X(-0.034), Y(-0.06), 0.068 * px, 0.036 * px, 14); c.fill();
      c.fillStyle = '#b8c9a3'; c.fillRect(X(-0.03), Y(-0.054), 0.06 * px, 0.022 * px);
      c.fillStyle = '#1f2a1a'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.font = `500 ${0.016 * px}px "Courier New", monospace`; c.fillText('1234.5', X(0.028), Y(-0.043));
      c.fillStyle = '#7c2d12'; c.fillRect(X(-0.03), Y(-0.066), 0.02 * px, 0.005 * px);
      c.fillStyle = '#e2e8f0'; c.textAlign = 'left'; c.font = `700 ${0.006 * px}px ${FONT}`; c.fillText('ZUNGGA', X(-0.033), Y(-0.0675) + 0.0025 * px * 0.2);
    }, 320, 560);
    const fp = mesh(new T.PlaneGeometry(W - 0.006, L - 0.006), tmat(face, { roughness: 0.5 }), g, 0, H + 0.0003, 0); fp.rotation.x = -Math.PI / 2;
    const keys = [['AC', '÷', '×', '−'], ['7', '8', '9', '+'], ['4', '5', '6', '%'], ['1', '2', '3', '='], ['0', '00', '.', '√']];
    const kg = roundBox(0.014, 0.004, 0.011, 0.0018), km = { n: mat(0xe2e8f0, { roughness: 0.5 }), o: mat(Z.orange, { roughness: 0.5 }), r: mat(0xef4444, { roughness: 0.5 }) };
    const xs = [-0.027, -0.009, 0.009, 0.027], zs = [-0.012, 0.005, 0.022, 0.039, 0.056];
    keys.forEach((row, ri) => row.forEach((k, ci) => mesh(kg, k === 'AC' ? km.r : (ci === 3 || ri === 0) ? km.o : km.n, g, xs[ci], H + 0.002, zs[ri])));
    const kt = tex((c, Wd, Hd) => {
      const px = Wd / 0.08; c.clearRect(0, 0, Wd, Hd); c.fillStyle = '#1f1a33'; c.textAlign = 'center'; c.textBaseline = 'middle';
      keys.forEach((row, ri) => row.forEach((k, ci) => { c.font = `700 ${(k.length > 1 ? 0.0055 : 0.0075) * px}px ${FONT}`; c.fillText(k, (xs[ci] + 0.04) * px, (zs[ri] + 0.024) * px); }));
    }, 400, 440);
    const kp = mesh(new T.PlaneGeometry(0.08, 0.088), new T.MeshStandardMaterial({ map: kt, transparent: true, depthWrite: false }), g, 0, H + 0.0042, 0.02); kp.rotation.x = -Math.PI / 2; kp.castShadow = false;
    return { group: g };
  }

  function eraserSharpener() {
    const g = new T.Group();
    const er = new T.Group(); er.position.set(-0.03, 0, 0.035); er.rotation.y = 0.35; g.add(er);
    box(0.046, 0.012, 0.022, 0xfbcfe8, er, 0.006, 0.006, 0, 0.003);
    const sl = tex((c, Wd, Hd) => { c.fillStyle = hex(Z.blue); c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 70px ${FONT}`; c.fillText('ZUNGGA', Wd / 2, Hd / 2 - 18); c.font = `500 34px ${FONT}`; c.fillText('eraser', Wd / 2, Hd / 2 + 42); }, 400, 220);
    faceBox(0.028, 0.0132, 0.0232, Z.blue, sl, 2, er, -0.004, 0.0066, 0);
    // sharpener with a pencil in it
    const sh = new T.Group(); sh.position.set(0.045, 0, -0.005); g.add(sh);
    box(0.026, 0.017, 0.014, Z.purple, sh, 0, 0.0085, 0, 0.003);
    mesh(new T.CylinderGeometry(0.0055, 0.0055, 0.002, 18).rotateZ(Math.PI / 2), mat(0x1f1a33), sh, -0.0131, 0.0085, 0);
    mesh(new T.BoxGeometry(0.02, 0.0008, 0.011), chrome(), sh, 0.001, 0.0174, 0);
    mesh(new T.CylinderGeometry(0.0022, 0.0022, 0.0012, 12), mat(0x64748b, { metalness: 0.6 }), sh, 0.006, 0.0182, 0);
    if (ZAssets.has('pencil')) { const p = ZAssets.build('pencil').group; p.position.set(0.045 - 0.0131 - 0.075, 0.0085 - 0.0038, -0.005); g.add(p); }
    // shavings: frilly cone rings with a coloured edge
    const wood = new T.MeshStandardMaterial({ color: 0xf1c48f, roughness: 0.8, side: T.DoubleSide });
    [[0.02, 0.03, 0.4, Z.yellow], [0.075, 0.025, 1.6, Z.yellow], [0.06, -0.035, 2.6, Z.yellow], [0.09, 0.0, 4.1, Z.pink]].forEach(([x, z, ry, col], i) => {
      const s = new T.Group(); s.position.set(x, 0.002, z); s.rotation.set(0.25 * (i % 2 ? 1 : -1), ry, 0.2); g.add(s);
      mesh(new T.CylinderGeometry(0.0015, 0.0085, 0.003, 22, 1, true, 0, Math.PI * 1.6), wood, s);
      mesh(new T.TorusGeometry(0.0085, 0.0007, 5, 22, Math.PI * 1.6), mat(col), s, 0, -0.0015, 0).rotation.set(Math.PI / 2, 0, Math.PI / 2);
    });
    return { group: g };
  }

  function schoolBell() {
    const g = new T.Group(), brass = mat(0xd9a640, { metalness: 0.55, roughness: 0.28, emissive: 0x3a2400, emissiveIntensity: 0.3, side: T.DoubleSide });
    const pivot = new T.Group(); pivot.position.x = 0.052; g.add(pivot);
    const bell = new T.Group(); bell.position.x = -0.052; pivot.add(bell);
    lathe([[0.052, 0], [0.053, 0.004], [0.049, 0.012], [0.04, 0.028], [0.034, 0.048], [0.03, 0.064], [0.024, 0.076], [0.013, 0.082], [0, 0.083], [0, 0.077], [0.011, 0.076], [0.021, 0.07], [0.026, 0.06], [0.03, 0.045], [0.036, 0.028], [0.044, 0.012], [0.047, 0.002]], brass, bell, 0, 0, 0, 40);
    mesh(new T.TorusGeometry(0.051, 0.0028, 8, 40).rotateX(Math.PI / 2), brass, bell, 0, 0.003, 0);
    cyl(0.012, 0.016, 0.012, 0, bell, 0, 0.088, 0).material = brass;
    lathe([[0.008, 0], [0.012, 0.006], [0.009, 0.02], [0.011, 0.05], [0.016, 0.075], [0.017, 0.09], [0.012, 0.1], [0, 0.102]], mat(Z.woodDark, { roughness: 0.45 }), bell, 0, 0.093, 0);
    const clap = new T.Group(); clap.position.y = 0.075; bell.add(clap);
    cyl(0.0015, 0.0015, 0.05, 0x475569, clap, 0, -0.025, 0);
    sphere(0.008, 0x475569, clap, 0, -0.052, 0);
    const ring = tex((c, Wd, Hd) => { c.clearRect(0, 0, Wd, Hd); c.strokeStyle = '#f59e0b'; c.lineCap = 'round'; c.lineWidth = 9; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(Wd / 2, Hd / 2, 70 + k * 34, s < 0 ? Math.PI - 0.5 : -0.5, s < 0 ? Math.PI + 0.5 : 0.5); c.stroke(); } }, 512, 320);
    const lines = decal(ring, 0.3, 0.19, g, -0.01, 0.09, 0.01); lines.visible = false;
    g.userData.setOn = (on) => { pivot.rotation.z = on ? -0.42 : 0; clap.rotation.z = on ? 0.55 : 0; lines.visible = !!on; };
    return { group: g };
  }

  ZAssets.register('school', 'school_bag', 'School bag', schoolBag, ['bag', 'backpack', 'school bag', 'stationery']);
  ZAssets.register('school', 'notebook', 'Notebook', notebook, ['notebook', 'book', 'homework', 'opens']);
  ZAssets.register('school', 'geometry_box', 'Geometry box (open)', geometryBox, ['geometry box', 'compass', 'protractor', 'scale', 'stationery']);
  ZAssets.register('school', 'crayons', 'Box of crayons', crayons, ['crayons', 'drawing', 'colours', 'art']);
  ZAssets.register('school', 'globe', 'Globe', globe, ['globe', 'world', 'earth', 'geography', 'spins']);
  ZAssets.register('school', 'report_card', 'Report card (A+)', reportCard, ['report card', 'marks', 'grades', 'exam', 'result']);
  ZAssets.register('school', 'trophy', 'Trophy (1st)', trophy, ['trophy', 'prize', 'winner', 'cup', 'award']);
  ZAssets.register('school', 'medal', 'Gold medal', medal, ['medal', 'prize', 'winner', 'award', 'gold']);
  ZAssets.register('school', 'calculator', 'Calculator', calculator, ['calculator', 'maths', 'counting']);
  ZAssets.register('school', 'eraser_sharpener', 'Eraser + sharpener', eraserSharpener, ['eraser', 'sharpener', 'stationery', 'pencil']);
  ZAssets.register('school', 'school_bell', 'School bell (hand bell)', schoolBell, ['bell', 'school bell', 'rings']);
})();
