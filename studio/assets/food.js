/* Zungga Story Studio — food props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box, logoTex, mascotTex, decal, label, cyl, sphere } = ZA;
  function chips() {
    const g = new T.Group(), W = 0.16, H = 0.22, D = 0.07;
    const geo = new T.BoxGeometry(W, H, D, 12, 16, 6), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / (W / 2), y = p.getY(i) / (H / 2);
      let z = p.getZ(i) * Math.cos(x * Math.PI / 2.4) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(y), 6)), 0.6);
      if (Math.abs(y) > 0.9) z = Math.sign(p.getZ(i)) * 0.002 * (1 + Math.sin(x * 40));            // crimped seal
      p.setZ(i, z);
    }
    geo.computeVertexNormals();
    const front = tex((c, Wd, Hd) => {
      const gr = c.createLinearGradient(0, 0, 0, Hd); gr.addColorStop(0, '#f97316'); gr.addColorStop(1, '#dc2626');
      c.fillStyle = gr; c.fillRect(0, 0, Wd, Hd);
      for (let y = 0; y < Hd; y += 22) { c.fillStyle = '#ffffff22'; c.fillRect(0, y, Wd, 4); }
      c.fillStyle = '#facc15'; c.beginPath(); c.ellipse(Wd / 2, Hd * 0.62, Wd * 0.34, Hd * 0.18, -0.2, 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 5; i++) { c.fillStyle = '#fde68a'; c.beginPath(); c.ellipse(Wd * (0.32 + i * 0.09), Hd * (0.6 + (i % 2) * 0.05), 30, 18, i, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#d97706'; c.lineWidth = 3; c.stroke(); }
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'CRUNCHY', Wd * 0.85, 120); c.lineWidth = 12; c.strokeStyle = hex(Z.ink); c.strokeText('CRUNCHY', Wd / 2, Hd * 0.25); c.fillText('CRUNCHY', Wd / 2, Hd * 0.25);
      c.font = `600 52px ${FONT}`; c.fillText('Masala Chips', Wd / 2, Hd * 0.38);
      c.fillStyle = hex(Z.ink); c.font = `700 46px ${FONT}`; c.fillText('₹20', Wd * 0.8, Hd * 0.88);
    }, 512, 704);
    const side = mat(0xdc2626, { roughness: 0.35, metalness: 0.2 }), foil = new T.MeshStandardMaterial({ map: front, roughness: 0.35, metalness: 0.15 });
    mesh(geo, [side, side, side, side, foil, foil], g, 0, H / 2, 0);
    return { group: g, phys: { shape: 'box', size: [W, H, D * 0.6], mass: 0.05 } };
  }
  function juice() {
    const g = new T.Group(), W = 0.065, H = 0.105, D = 0.042;
    const label = (back) => tex((c, Wd, Hd) => {
      c.fillStyle = '#fde047'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#f59e0b'; c.beginPath(); c.arc(Wd * 0.5, Hd * 0.6, Wd * 0.3, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#16a34a'; c.beginPath(); c.ellipse(Wd * 0.62, Hd * 0.36, Wd * 0.12, Wd * 0.05, -0.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = hex(Z.ink); c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, back ? '200 ml' : 'MANGO', Wd * 0.9, 90); c.fillText(back ? '200 ml' : 'MANGO', Wd / 2, Hd * 0.16);
      c.font = `600 40px ${FONT}`; c.fillText(back ? 'Fruit drink' : 'JUICE', Wd / 2, Hd * 0.9);
    }, 320, 512);
    const plain = mat(0xfde047, { roughness: 0.5 });
    mesh(new T.BoxGeometry(W, H, D), [plain, plain, plain, plain, new T.MeshStandardMaterial({ map: label(false), roughness: 0.5 }), new T.MeshStandardMaterial({ map: label(true), roughness: 0.5 })], g, 0, H / 2, 0);
    const fold = mesh(new T.CylinderGeometry(0.0001, D / 2, 0.012, 4, 1).rotateY(Math.PI / 4).scale(W / D * 1.0, 1, 1), plain, g, 0, H + 0.006, 0);
    fold.scale.set(1, 1, 1);
    const straw = new T.Group(); straw.position.set(W * 0.28, H, 0); g.add(straw);
    mesh(new T.CylinderGeometry(0.002, 0.002, 0.06, 8), mat(Z.pink), straw, 0, 0.03, 0).rotation.z = -0.25;
    return { group: g, phys: { shape: 'box', size: [W, H, D], mass: 0.2 } };
  }
  ZAssets.register('food', 'chips', 'Chips packet', chips, ["snack", "packet", "recess"]);
  ZAssets.register('food', 'juice', 'Juice box', juice, ["drink", "mango", "straw"]);

  /* ---------- shared little helpers for the props below ---------- */
  const steel = () => mat(0xdfe4ea, { metalness: 0.9, roughness: 0.22 });
  const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
  function lathe(pts, m, parent, x = 0, y = 0, z = 0, seg = 36) { return mesh(new T.LatheGeometry(pts.map(([r, h]) => new T.Vector2(r, h)), seg), m, parent, x, y, z); }
  // a curved picture wrapped on a cylinder (theta 0 = front, +z), transparent
  function wrapDecal(texture, r, h, arc, parent, y, start = -arc / 2, opaque = false) {
    const m = new T.MeshStandardMaterial({ map: texture, transparent: !opaque, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: opaque });
    const me = mesh(new T.CylinderGeometry(r, r, h, 40, 1, true, start, arc), m, parent, 0, y, 0); me.castShadow = false; return me;
  }
  // a gently domed food surface (rice heap, dal, sabzi) of w × d, peak height h
  function heap(w, d, h, m, parent, x, y, z, seed = 3, lump = 0.25) {
    const rnd = seeded(seed), geo = new T.PlaneGeometry(w, d, 18, 14).rotateX(-Math.PI / 2), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / (w / 2), v = p.getZ(i) / (d / 2);
      p.setY(i, h * Math.max(0, 1 - Math.pow(Math.abs(u), 4)) * Math.max(0, 1 - Math.pow(Math.abs(v), 4)) * (1 - lump + lump * rnd()));
    }
    geo.computeVertexNormals(); return mesh(geo, m, parent, x, y, z);
  }
  const speckTex = (base, specks, n = 300, seed = 5, size = 6) => tex((c, W, H) => {
    const rnd = seeded(seed); c.fillStyle = base; c.fillRect(0, 0, W, H);
    for (let i = 0; i < n; i++) { c.fillStyle = specks[i % specks.length]; c.beginPath(); c.ellipse(rnd() * W, rnd() * H, size * (0.5 + rnd()), size * 0.5 * (0.5 + rnd()), rnd() * 3, 0, Math.PI * 2); c.fill(); }
  }, 512, 512);
  // sweep a round-ish cross section along a curve; rad(u), colour(u) -> [r,g,b]
  function sweep(curve, rad, colour, n = 48, sides = 16, shape = () => 1) {
    const fr = curve.computeFrenetFrames(n, false), pos = [], col = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, P = curve.getPointAt(u), N = fr.normals[i], B = fr.binormals[i], r = rad(u), c = colour(u);
      for (let j = 0; j <= sides; j++) {
        const a = (j / sides) * Math.PI * 2, rr = r * shape(a);
        pos.push(P.x + rr * (Math.cos(a) * N.x + Math.sin(a) * B.x), P.y + rr * (Math.cos(a) * N.y + Math.sin(a) * B.y), P.z + rr * (Math.cos(a) * N.z + Math.sin(a) * B.z));
        col.push(...c); uv.push(j / sides, u);
      }
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < sides; j++) { const a = i * (sides + 1) + j, b = a + sides + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  const rgb = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255].map((v) => Math.pow(v, 2.2));
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  // put a group's lowest point on y = 0
  function sit(g) { g.updateMatrixWorld(true); const b = new T.Box3().setFromObject(g); for (const ch of g.children) ch.position.y -= b.min.y; return g; }

  /* ---------- lunch box: steel 3-compartment; setOn(true) opens the lid ---------- */
  function lunchBox() {
    const g = new T.Group(), W = 0.2, H = 0.052, D = 0.14, t = 0.004, st = steel();
    mesh(roundBox(W, 0.008, D, 0.0035), st, g, 0, 0.004, 0);
    for (const [w, d, x, z] of [[W, t, 0, D / 2 - t / 2], [W, t, 0, -D / 2 + t / 2], [t, D, W / 2 - t / 2, 0], [t, D, -W / 2 + t / 2, 0]]) mesh(roundBox(w, H, d, 0.0018), st, g, x, H / 2, z);
    const dx = 0.012;
    mesh(roundBox(0.003, H * 0.92, D - 2 * t, 0.0012), st, g, dx, H * 0.46, 0);
    mesh(roundBox(W / 2 - dx - t, H * 0.92, 0.003, 0.0012), st, g, (dx + W / 2 - t) / 2, H * 0.46, 0);
    // food
    const L0 = -W / 2 + t, L1 = dx - 0.0015, R0 = dx + 0.0015, R1 = W / 2 - t, inD = D / 2 - t;
    heap(L1 - L0, 2 * inD, 0.016, new T.MeshStandardMaterial({ map: speckTex('#fbf6e9', ['#ffffff', '#efe6cf', '#f6efdc'], 1400, 11, 5), roughness: 0.8 }), g, (L0 + L1) / 2, H - 0.016, 0, 3, 0.35);
    heap(R1 - R0, inD - 0.0015, 0.004, new T.MeshStandardMaterial({ map: speckTex('#f1b531', ['#d98a12', '#3f8f2a', '#5a3a12', '#ffd36b'], 160, 4, 5), roughness: 0.25 }), g, (R0 + R1) / 2, H - 0.013, inD / 2 + 0.0008, 7, 0.1);
    heap(R1 - R0, inD - 0.0015, 0.012, new T.MeshStandardMaterial({ map: speckTex('#5f9a2c', ['#7cb342', '#3f7a1f', '#9ccc65'], 400, 9, 9), roughness: 0.6 }), g, (R0 + R1) / 2, H - 0.014, -inD / 2 - 0.0008, 5, 0.5);
    const rnd = seeded(21), carrot = mat(0xf97316, { roughness: 0.5 }), bean = mat(0x3f8f2a, { roughness: 0.5 }), potato = mat(0xf5d27a, { roughness: 0.6 });
    for (let i = 0; i < 14; i++) {
      const c = mesh(roundBox(0.009, 0.007, 0.009, 0.002), [carrot, bean, potato][i % 3], g, R0 + 0.01 + rnd() * (R1 - R0 - 0.02), H - 0.004 + rnd() * 0.003, -inD + 0.01 + rnd() * (inD - 0.02));
      c.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    }
    // lid on a back hinge
    const pivot = new T.Group(); pivot.position.set(0, H, -D / 2); g.add(pivot);
    const lid = new T.Group(); pivot.add(lid);
    mesh(roundBox(W + 0.004, 0.009, D + 0.004, 0.0035), st, lid, 0, 0.0045, D / 2);
    mesh(roundBox(W * 0.8, 0.003, D * 0.72, 0.0012), st, lid, 0, 0.0095, D / 2);
    const lg = decal(logoTex(), 0.07, 0.07 * 755 / 920, lid, 0, 0.0115, D / 2); lg.rotation.x = -Math.PI / 2;
    for (const x of [-0.05, 0.05]) { const clip = mesh(roundBox(0.024, 0.026, 0.006, 0.0025), mat(Z.purple, { roughness: 0.4 }), lid, x, -0.006, D + 0.004); clip.rotation.x = 0.04; }
    g.userData.setOn = (on) => { pivot.rotation.x = on ? -1.95 : 0; };
    return { group: g, phys: { shape: 'box', size: [W, H + 0.01, D], mass: 0.5 } };
  }

  /* ---------- kid's water bottle with a flip straw ---------- */
  function waterBottle() {
    const g = new T.Group(), R = 0.036;
    const pts = [[0, 0], [R * 0.8, 0], [R, 0.006], [R, 0.17], [R * 0.95, 0.178], [R * 0.86, 0.185], [0, 0.185]];
    lathe(pts, mat(Z.purple, { roughness: 0.3, metalness: 0.1 }), g);
    const band = tex((c, W, H) => {
      c.fillStyle = '#ffffff00'; c.clearRect(0, 0, W, H);
      c.fillStyle = hex(Z.yellow); c.fillRect(0, H * 0.72, W, H * 0.2);
      const rnd = seeded(3);
      for (let i = 0; i < 26; i++) { c.fillStyle = ['#ffffffcc', '#fbcfe8', '#fde68a'][i % 3]; const x = rnd() * W, y = rnd() * H * 0.68, s = 6 + rnd() * 10; c.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5, rr = k % 2 ? s * 0.45 : s; c.lineTo(x + rr * Math.sin(a), y - rr * Math.cos(a)); } c.fill(); }
      c.fillStyle = hex(Z.ink); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 ${H * 0.15}px ${FONT}`;
      c.fillText('ZUNGGA', W * 0.5, H * 0.825);
    }, 1024, 512);
    wrapDecal(band, R + 0.0006, 0.15, Math.PI * 2, g, 0.09, -Math.PI);
    wrapDecal(mascotTex(), R + 0.001, 0.07, 1.9, g, 0.105);
    // cap + flip straw
    cyl(R * 0.9, R * 0.9, 0.006, 0xf1f5f9, g, 0, 0.188);
    const capM = mat(Z.pink, { roughness: 0.35 });
    mesh(new T.CylinderGeometry(R * 0.92, R * 0.95, 0.03, 32), capM, g, 0, 0.206);
    mesh(new T.TorusGeometry(R * 0.93, 0.002, 8, 40).rotateX(Math.PI / 2), capM, g, 0, 0.221);
    const loop = mesh(new T.TorusGeometry(0.014, 0.0035, 10, 24), mat(Z.yellow, { roughness: 0.4 }), g, 0, 0.212, -R - 0.006); loop.rotation.y = 0;
    const flap = new T.Group(); flap.position.set(0, 0.222, -R * 0.55); g.add(flap); flap.rotation.x = -1.9;
    mesh(roundBox(0.03, 0.006, 0.034, 0.0025), mat(Z.yellow, { roughness: 0.4 }), flap, 0, 0.003, 0.017);
    const sp = mesh(new T.CylinderGeometry(0.0045, 0.0065, 0.026, 16), mat(0x5eead4, { roughness: 0.25, transparent: true, opacity: 0.85 }), g, 0, 0.232, 0.004); sp.rotation.x = 0.35;
    return { group: g, phys: { shape: 'cylinder', r: R, h: 0.24, mass: 0.4 } };
  }

  /* ---------- steel plate with 3 samosas + green chutney ---------- */
  function plate(r, parent, x = 0, z = 0) {
    return lathe([[0, 0.001], [r * 0.78, 0.001], [r * 0.84, 0.005], [r * 0.98, 0.016], [r, 0.018], [r * 0.985, 0.0185], [r * 0.83, 0.0075], [r * 0.78, 0.0055], [0, 0.0055]], steel(), parent, x, 0, z, 48);
  }
  function samosaGeo(R, h, seed) {
    const rnd = seeded(seed), geo = new T.ConeGeometry(R, h, 3, 6, false), p = geo.attributes.position, v = new T.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); const y01 = (v.y + h / 2) / h, rr = Math.hypot(v.x, v.z);
      if (rr > 1e-5) { const a = Math.atan2(v.z, v.x), face = Math.cos(1.5 * (a - Math.PI / 6 * 1) * 2) ; const puff = 1 + 0.12 * Math.sin(Math.PI * Math.min(1, y01 * 1.4)) * (0.6 + 0.4 * Math.abs(face)) + (rnd() - 0.5) * 0.04; v.x *= puff; v.z *= puff; }
      if (y01 < 0.02) v.y = -h / 2;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals(); geo.translate(0, h / 2, 0); return geo;
  }
  function samosaPlate() {
    const g = new T.Group(), r = 0.12;
    plate(r, g);
    const crust = new T.MeshStandardMaterial({ map: speckTex('#d99536', ['#c97d22', '#e8b05a', '#b8691a', '#f2c26e'], 500, 8, 9), roughness: 0.55 });
    for (const [x, z, ry, s] of [[-0.035, -0.03, 0.3, 1], [0.035, -0.035, 1.1, 0.96], [-0.01, 0.03, 2.0, 1.02]]) {
      const m = mesh(samosaGeo(0.042 * s, 0.062 * s, 7 + Math.round(x * 100)), crust, g, x, 0.0055, z); m.rotation.y = ry;
    }
    // chutney katori
    const k = new T.Group(); k.position.set(0.058, 0.0055, 0.045); g.add(k);
    lathe([[0, 0], [0.018, 0], [0.026, 0.016], [0.027, 0.017], [0.025, 0.017], [0.017, 0.002], [0, 0.002]], steel(), k);
    mesh(new T.CircleGeometry(0.024, 32).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ map: speckTex('#4f9a2a', ['#3c7d1c', '#6fbf3a', '#2f5f16'], 260, 6, 5), roughness: 0.2 }), k, 0, 0.0135, 0);
    return { group: g, phys: { shape: 'cylinder', r, h: 0.07, mass: 0.4 } };
  }

  /* ---------- ice-cream cone, 2 scoops + sprinkles ---------- */
  function scoop(r, color, parent, y, seed) {
    const rnd = seeded(seed), geo = new T.SphereGeometry(r, 36, 24), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), yy = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x);
      let k = 1 + 0.025 * Math.sin(a * 5 + yy * 90) + (rnd() - 0.5) * 0.015;
      if (yy < -r * 0.15) k *= 1.06 + 0.06 * Math.sin(a * 9);           // a lumpy skirt where it sits
      p.setXYZ(i, x * k, yy * (yy < 0 ? 0.6 : 0.95), z * k);
    }
    geo.computeVertexNormals(); return mesh(geo, mat(color, { roughness: 0.55 }), parent, 0, y, 0);
  }
  function iceCream() {
    const g = new T.Group(), Rc = 0.029, Hc = 0.11;
    const waffle = tex((c, W, H) => {
      c.fillStyle = '#e2a95a'; c.fillRect(0, 0, W, H); c.strokeStyle = '#b97a32'; c.lineWidth = 7;
      for (let i = -12; i < 24; i++) { c.beginPath(); c.moveTo(i * 48, 0); c.lineTo(i * 48 + H * 0.7, H); c.stroke(); c.beginPath(); c.moveTo(i * 48, H); c.lineTo(i * 48 + H * 0.7, 0); c.stroke(); }
    }, 512, 512);
    mesh(new T.ConeGeometry(Rc, Hc, 36, 1, true).rotateX(Math.PI), new T.MeshStandardMaterial({ map: waffle, roughness: 0.8, side: T.DoubleSide }), g, 0, Hc / 2, 0);
    mesh(new T.TorusGeometry(Rc, 0.0035, 10, 36).rotateX(Math.PI / 2), mat(0xd39a4c, { roughness: 0.8 }), g, 0, Hc, 0);
    scoop(0.03, 0xf9a8c9, g, Hc + 0.012, 3);
    const top = scoop(0.028, 0x7a4a2c, g, Hc + 0.05, 9);
    // sprinkles (one instanced mesh)
    const N = 46, rnd = seeded(17), sp = new T.InstancedMesh(new T.CapsuleGeometry(0.0013, 0.005, 3, 6), mat(0xffffff, { roughness: 0.4 }), N);
    const cols = [0xfacc15, 0x38bdf8, 0xffffff, 0x22c55e, 0xec4899, 0xfb923c], o = new T.Object3D(), up = new T.Vector3(0, 1, 0);
    for (let i = 0; i < N; i++) {
      const ph = rnd() * Math.PI * 2, th = rnd() * 1.15, n = new T.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th) * 0.95, Math.sin(th) * Math.sin(ph));
      o.position.copy(n).multiplyScalar(0.0285).add(new T.Vector3(0, Hc + 0.05, 0));
      o.quaternion.setFromUnitVectors(up, new T.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).cross(n).normalize()); o.updateMatrix();
      sp.setMatrixAt(i, o.matrix); sp.setColorAt(i, new T.Color(cols[i % cols.length]));
    }
    sp.castShadow = true; g.add(sp);
    sphere(0.008, 0xdc2626, g, 0.004, Hc + 0.083, 0.002).material.roughness = 0.2;
    const stem = mesh(new T.CylinderGeometry(0.0008, 0.0008, 0.014, 6), mat(0x4d7c0f), g, 0.007, Hc + 0.094, 0); stem.rotation.z = -0.5;
    return { group: g };
  }

  /* ---------- fruits ---------- */
  function apple() {
    const g = new T.Group(), pts = [];
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * Math.PI; let r = 0.04 * Math.sin(a) * (1 - 0.12 * Math.cos(a)), y = 0.0385 * (1 - Math.cos(a));
      y += 0.005 * Math.exp(-Math.pow(a / 0.35, 2)); y -= 0.009 * Math.exp(-Math.pow((Math.PI - a) / 0.4, 2));
      pts.push([Math.max(r, 0.0001 * (i === 0 || i === 28 ? 0 : 1)), y]);
    }
    pts[0][0] = 0; pts[28][0] = 0;
    const skin = tex((c, W, H) => {
      const gr = c.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, '#f2c14e'); gr.addColorStop(0.25, '#e0442e'); gr.addColorStop(0.6, '#c81e1e'); gr.addColorStop(1, '#a8141c');
      c.fillStyle = gr; c.fillRect(0, 0, W, H); const rnd = seeded(9);
      for (let i = 0; i < 90; i++) { c.strokeStyle = `rgba(${200 + rnd() * 55},${120 + rnd() * 80},60,0.25)`; c.lineWidth = 2 + rnd() * 4; const x = rnd() * W; c.beginPath(); c.moveTo(x, H * (0.5 + rnd() * 0.5)); c.lineTo(x + (rnd() - 0.5) * 10, H * rnd() * 0.5); c.stroke(); }
      for (let i = 0; i < 120; i++) { c.fillStyle = '#ffe9a855'; c.fillRect(rnd() * W, rnd() * H, 3, 3); }
    }, 512, 512);
    lathe(pts, new T.MeshStandardMaterial({ map: skin, roughness: 0.32 }), g, 0, 0, 0, 40);
    const stem = mesh(new T.CylinderGeometry(0.0016, 0.002, 0.02, 8), mat(0x6b4423), g, 0.001, 0.078, 0); stem.rotation.z = -0.25;
    const leaf = mesh(new T.SphereGeometry(1, 16, 8), mat(0x4caf50, { roughness: 0.5 }), g, 0.012, 0.083, 0.002); leaf.scale.set(0.012, 0.0018, 0.006); leaf.rotation.set(0, 0.3, 0.45);
    return { group: g, phys: { shape: 'sphere', r: 0.04, mass: 0.18 } };
  }
  function banana() {
    const g = new T.Group();
    const curve = new T.QuadraticBezierCurve3(new T.Vector3(-0.09, 0.045, 0), new T.Vector3(0, -0.035, 0), new T.Vector3(0.095, 0.05, 0));
    const Y = rgb(0xf7d23e), G = rgb(0x8fb339), Bn = rgb(0x5a3d1e);
    const geo = sweep(curve, (u) => 0.0175 * Math.pow(Math.sin(Math.PI * Math.min(Math.max(u, 0.015), 0.985)), 0.45) * (u < 0.15 ? 0.75 + u * 1.6 : 1),
      (u) => (u < 0.08 ? mix(G, Y, u / 0.08) : u > 0.97 ? Bn : mix(Y, mix(Y, G, 0.15), Math.max(0, (0.2 - u) * 3))), 56, 20, (a) => 1 + 0.07 * Math.cos(5 * a));
    const body = new T.Group(); g.add(body);
    mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.45 }), body);
    const st = mesh(new T.CylinderGeometry(0.0035, 0.005, 0.022, 10), mat(0x7a8a3a, { roughness: 0.7 }), body, -0.098, 0.054, 0); st.rotation.z = 0.95;
    mesh(new T.CylinderGeometry(0.004, 0.004, 0.003, 10), mat(0x3b2a14), body, -0.107, 0.06, 0).rotation.z = 0.95;
    body.rotation.x = -0.25;
    return { group: sit(g), phys: { shape: 'box', size: [0.2, 0.04, 0.04], mass: 0.12 } };
  }
  function mango() {
    const g = new T.Group(), geo = new T.SphereGeometry(1, 40, 28), p = geo.attributes.position, cols = [];
    const Gc = rgb(0x6aa83a), Yc = rgb(0xf6b92b), Rc = rgb(0xe8573a);
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const lx = x; x *= 0.058; y *= 0.04; z *= 0.042;
      y += 0.012 * (1 - lx * lx) - 0.006; if (lx > 0.6 && y < 0) { x += 0.008 * (lx - 0.6) * 2.5 * (-y / 0.04); }           // kidney curve + beak
      x *= 1 - 0.12 * Math.max(0, -lx);                                                                                      // fuller stem shoulder
      p.setXYZ(i, x, y, z);
      const t = (lx + 1) / 2; let c = mix(Gc, Yc, Math.min(1, t * 1.6)); if (p.getY(i) > 0.01) c = mix(c, Rc, Math.min(1, Math.max(0, (t - 0.25)) * 1.1 * Math.max(0, p.getY(i) / 0.05)));
      cols.push(...c);
    }
    geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
    mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.38 }), g);
    const st = mesh(new T.CylinderGeometry(0.0018, 0.0025, 0.012, 8), mat(0x6b4423), g, -0.054, 0.012, 0); st.rotation.z = 1.2;
    const leaf = mesh(new T.SphereGeometry(1, 16, 8), mat(0x2f7d32, { roughness: 0.5 }), g, -0.04, 0.03, 0.012); leaf.scale.set(0.03, 0.002, 0.011); leaf.rotation.set(0.2, -0.5, -0.2);
    return { group: sit(g), phys: { shape: 'sphere', r: 0.045, mass: 0.3 } };
  }

  /* ---------- 2-tier birthday cake; setOn(true) lights the candles ---------- */
  function birthdayCake() {
    const g = new T.Group(), rnd = seeded(31);
    cyl(0.165, 0.165, 0.01, 0xe9dcae, g, 0, 0.005, 0, 48).material = mat(0xe8d79f, { metalness: 0.6, roughness: 0.3 });
    const tier = (r, h, y0, body, drip, n) => {
      mesh(new T.CylinderGeometry(r, r, h, 48), mat(body, { roughness: 0.6 }), g, 0, y0 + h / 2, 0);
      const dm = mat(drip, { roughness: 0.3 });
      mesh(new T.CylinderGeometry(r + 0.003, r + 0.003, 0.012, 48), dm, g, 0, y0 + h - 0.006 + 0.001, 0);
      mesh(new T.TorusGeometry(r - 0.001, 0.004, 10, 48).rotateX(Math.PI / 2), dm, g, 0, y0 + h + 0.001, 0);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.1, len = 0.008 + rnd() * h * 0.38;
        mesh(new T.CapsuleGeometry(0.0055, len, 4, 10), dm, g, Math.sin(a) * (r + 0.002), y0 + h - 0.008 - len / 2, Math.cos(a) * (r + 0.002));
      }
      // pearl border at the base (instanced)
      const N = Math.round(r * 2 * Math.PI / 0.0105), pm = new T.InstancedMesh(new T.SphereGeometry(0.0052, 12, 8), mat(0xfff7e6, { roughness: 0.3, metalness: 0.1 }), N), o = new T.Object3D();
      for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; o.position.set(Math.sin(a) * (r + 0.003), y0 + 0.004, Math.cos(a) * (r + 0.003)); o.updateMatrix(); pm.setMatrixAt(i, o.matrix); }
      pm.castShadow = true; g.add(pm);
    };
    tier(0.13, 0.09, 0.01, 0xfff1dc, 0xf472b6, 20);
    tier(0.085, 0.07, 0.1, 0xc4b5fd, 0xfffaf0, 14);
    const words = tex((c, W, H) => { c.clearRect(0, 0, W, H); c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'HAPPY BIRTHDAY', W * 0.96, 120); c.lineWidth = 14; c.strokeStyle = '#ffffff'; c.strokeText('HAPPY BIRTHDAY', W / 2, H / 2 + 4); c.fillStyle = hex(Z.purple); c.fillText('HAPPY BIRTHDAY', W / 2, H / 2 + 4); }, 1024, 150);
    wrapDecal(words, 0.1315, 0.034, 1.75, g, 0.036);
    // cream rosettes + cherries on the top tier rim
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2, x = Math.sin(a) * 0.068, z = Math.cos(a) * 0.068;
      mesh(new T.ConeGeometry(0.009, 0.012, 8), mat(0xfffaf0, { roughness: 0.5 }), g, x, 0.176, z);
      if (i % 2 === 0) sphere(0.0065, 0xdc2626, g, x, 0.185, z, 16).material.roughness = 0.15;
    }
    // candles
    const stripe = tex((c, W, H) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); c.strokeStyle = '#ec4899'; c.lineWidth = 18; for (let i = -6; i < 12; i++) { c.beginPath(); c.moveTo(0, i * 40); c.lineTo(W, i * 40 + 80); c.stroke(); } }, 128, 256);
    const flames = [], flameO = mat(0xfb923c, { emissive: 0xff7a1a, emissiveIntensity: 2.2, transparent: true, opacity: 0.85 }), flameI = mat(0xfff3b0, { emissive: 0xffe066, emissiveIntensity: 2.5 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2, x = Math.sin(a) * 0.036, z = Math.cos(a) * 0.036, col = [0xec4899, 0x38bdf8, 0xfacc15, 0x22c55e, 0x7c3aed][i];
      const c = mesh(new T.CylinderGeometry(0.0042, 0.0042, 0.055, 16), new T.MeshStandardMaterial({ map: stripe, color: 0xffffff, roughness: 0.5 }), g, x, 0.17 + 0.0275, z);
      c.material = c.material.clone(); c.material.map = stripe; c.material.color = new T.Color(col).lerp(new T.Color(0xffffff), 0.55);
      cyl(0.0007, 0.0007, 0.007, 0x222222, g, x, 0.229, z, 6);
      const f = new T.Group(); f.position.set(x, 0.24, z); g.add(f);
      const o = mesh(new T.SphereGeometry(1, 16, 12), flameO, f); o.scale.set(0.0045, 0.011, 0.0045); o.castShadow = false;
      const ii = mesh(new T.SphereGeometry(1, 12, 8), flameI, f, 0, -0.003, 0); ii.scale.set(0.0022, 0.0055, 0.0022); ii.castShadow = false;
      f.visible = false; flames.push(f);
    }
    g.userData.setOn = (on) => { for (const f of flames) f.visible = !!on; };
    return { group: g, phys: { shape: 'cylinder', r: 0.165, h: 0.23, mass: 1.5 } };
  }

  /* ---------- 3-tier steel tiffin carrier ---------- */
  function tiffinCarrier() {
    const g = new T.Group(), R = 0.068, h = 0.064, st = steel();
    for (let i = 0; i < 3; i++) {
      const y = 0.004 + i * (h + 0.002);
      lathe([[0, 0], [R * 0.92, 0], [R, 0.006], [R, h - 0.004], [R + 0.004, h - 0.002], [R + 0.004, h], [R - 0.003, h], [R - 0.003, 0.006], [0, 0.006]], st, g, 0, y);
      mesh(new T.TorusGeometry(R + 0.0005, 0.0018, 8, 48).rotateX(Math.PI / 2), st, g, 0, y + h * 0.35);
      for (const s of [-1, 1]) { mesh(roundBox(0.012, 0.016, 0.01, 0.002), st, g, s * (R + 0.005), y + h * 0.55, 0); }
    }
    const top = 0.004 + 3 * (h + 0.002);
    lathe([[0, 0], [R + 0.004, 0], [R + 0.004, 0.004], [R * 0.85, 0.012], [R * 0.4, 0.018], [0.012, 0.019], [0.012, 0.026], [0.016, 0.028], [0, 0.03]], st, g, 0, top);
    // side bars, lock bar and handle
    const barM = mat(0xcfd6de, { metalness: 0.85, roughness: 0.3 }), Hb = top + 0.05;
    for (const s of [-1, 1]) mesh(roundBox(0.006, Hb - 0.01, 0.016, 0.0025), barM, g, s * (R + 0.013), 0.01 + (Hb - 0.01) / 2, 0);
    mesh(roundBox(2 * (R + 0.016), 0.006, 0.016, 0.0025), barM, g, 0, top + 0.033, 0);
    mesh(new T.TorusGeometry(R + 0.013, 0.0035, 10, 40, Math.PI), barM, g, 0, Hb - 0.01, 0);
    mesh(new T.CylinderGeometry(0.007, 0.007, 0.06, 16).rotateZ(Math.PI / 2), mat(Z.purple, { roughness: 0.4 }), g, 0, Hb - 0.01 + R + 0.013, 0);
    return { group: g, phys: { shape: 'cylinder', r: R + 0.02, h: Hb + R, mass: 1.2 } };
  }

  /* ---------- glass of lemonade ---------- */
  function lemonWheelTex() {
    return tex((c, W, H) => {
      c.fillStyle = '#facc15'; c.beginPath(); c.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fffbea'; c.beginPath(); c.arc(W / 2, H / 2, W * 0.45, 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 9; i++) { const a0 = i / 9 * Math.PI * 2 + 0.06, a1 = (i + 1) / 9 * Math.PI * 2 - 0.06; c.fillStyle = '#fde047'; c.beginPath(); c.moveTo(W / 2 + Math.cos((a0 + a1) / 2) * 8, H / 2 + Math.sin((a0 + a1) / 2) * 8); c.arc(W / 2, H / 2, W * 0.41, a0, a1); c.closePath(); c.fill(); }
    }, 256, 256);
  }
  function lemonade() {
    const g = new T.Group(), H = 0.13;
    lathe([[0, 0], [0.031, 0], [0.032, 0.002], [0.038, H], [0.0355, H], [0.0295, 0.008], [0, 0.008]], glassMat({ opacity: 0.35 }), g, 0, 0, 0, 40);
    const lq = mat(0xfde68a, { roughness: 0.1, transparent: true, opacity: 0.82, emissive: 0xfacc15, emissiveIntensity: 0.12 });
    mesh(new T.CylinderGeometry(0.0347, 0.0293, 0.098, 36), lq, g, 0, 0.008 + 0.049, 0);
    const ice = mat(0xf0f9ff, { roughness: 0.1, transparent: true, opacity: 0.6 });
    for (const [x, z, ry, y] of [[-0.01, 0.006, 0.4, 0.1], [0.012, -0.008, 1.0, 0.098], [0.002, 0.014, 0.2, 0.09]]) { const c = mesh(roundBox(0.02, 0.02, 0.02, 0.004), ice, g, x, y, z); c.rotation.set(0.3, ry, 0.2); }
    const wheel = lemonWheelTex(), rind = mat(0xfacc15, { roughness: 0.5 }), face = new T.MeshStandardMaterial({ map: wheel, roughness: 0.4, transparent: true });
    const sl = mesh(new T.CylinderGeometry(0.022, 0.022, 0.005, 32), [rind, face, face], g, 0.029, H - 0.006, 0.019); sl.rotation.set(Math.PI / 2, 0, 0); sl.rotation.order = 'YXZ'; sl.rotation.y = 0.55;
    const fl = mesh(new T.CylinderGeometry(0.016, 0.016, 0.004, 32), [rind, face, face], g, -0.006, 0.106, -0.012); fl.rotation.set(0.15, 0, 0.1);
    const straw = tex((c, W, Hh) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, Hh); c.fillStyle = '#ec4899'; for (let i = -4; i < 40; i++) { c.beginPath(); c.moveTo(0, i * 28); c.lineTo(W, i * 28 + 30); c.lineTo(W, i * 28 + 44); c.lineTo(0, i * 28 + 14); c.fill(); } }, 64, 1024);
    const s = mesh(new T.CylinderGeometry(0.0032, 0.0032, 0.19, 12), new T.MeshStandardMaterial({ map: straw, roughness: 0.4 }), g, -0.012, 0.1, -0.004); s.rotation.set(-0.1, 0, 0.24);
    return { group: g, phys: { shape: 'cylinder', r: 0.038, h: H, mass: 0.35 } };
  }

  /* ---------- ZUNGGA cream biscuits packet ---------- */
  function biscuitTex(back) {
    return tex((c, W, H) => {
      const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#8b5cf6'); gr.addColorStop(1, '#5b21b6'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = '#ffffff18'; for (let x = -H; x < W; x += 60) { c.beginPath(); c.moveTo(x, H); c.lineTo(x + H, 0); c.lineTo(x + H + 24, 0); c.lineTo(x + 24, H); c.fill(); }
      c.textAlign = 'center'; c.textBaseline = 'middle';
      if (!back) {
        // biscuits illustration
        for (let i = 0; i < 3; i++) {
          const x = W * 0.72 + i * 70, y = H * 0.52 - i * 6;
          c.fillStyle = '#7c4a1e'; c.beginPath(); c.ellipse(x, y + 30, 92, 34, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#fff6e0'; c.beginPath(); c.ellipse(x, y + 14, 88, 30, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#9a5b25'; c.beginPath(); c.ellipse(x, y, 92, 34, 0, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#6b3d16'; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(x - 50 + k * 20, y + ((k % 2) ? -8 : 8), 4, 0, Math.PI * 2); c.fill(); }
        }
        c.fillStyle = hex(Z.yellow); fitText(c, 'ZUNGGA', W * 0.5, 150); c.lineWidth = 14; c.strokeStyle = '#3b0764'; c.strokeText('ZUNGGA', W * 0.3, H * 0.33); c.fillText('ZUNGGA', W * 0.3, H * 0.33);
        c.fillStyle = '#ffffff'; fitText(c, 'CREAM BISCUITS', W * 0.5, 74); c.fillText('CREAM BISCUITS', W * 0.3, H * 0.6);
        c.fillStyle = '#fbcfe8'; c.beginPath(); c.roundRect(W * 0.17, H * 0.72, W * 0.26, H * 0.15, 30); c.fill(); c.fillStyle = '#831843'; c.font = `700 ${H * 0.09}px ${FONT}`; c.fillText('Vanilla', W * 0.3, H * 0.8);
        c.fillStyle = '#ffffff'; c.font = `600 ${H * 0.07}px ${FONT}`; c.fillText('₹10', W * 0.93, H * 0.12);
      } else {
        c.fillStyle = '#ffffff'; c.font = `700 ${H * 0.13}px ${FONT}`; c.fillText('ZUNGGA CREAM BISCUITS', W / 2, H * 0.22);
        c.fillStyle = '#ffffffdd'; c.fillRect(W * 0.25, H * 0.38, W * 0.5, H * 0.46); c.fillStyle = hex(Z.ink); c.font = `600 ${H * 0.07}px ${FONT}`;
        ['Net wt. 100 g', 'Made with love', 'Share with friends!'].forEach((s, i) => c.fillText(s, W / 2, H * (0.5 + i * 0.12)));
      }
    }, 1024, 360);
  }
  function biscuit(parent, x, y, z) {
    const b = new T.Group(); b.position.set(x, y, z); parent.add(b);
    const top = tex((c, W, H) => { c.fillStyle = '#a2652c'; c.fillRect(0, 0, W, H); c.strokeStyle = '#7c4a1e'; c.lineWidth = 8; c.beginPath(); c.arc(W / 2, H / 2, W * 0.42, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#7c4a1e'; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; c.beginPath(); c.arc(W / 2 + Math.cos(a) * W * 0.3, H / 2 + Math.sin(a) * H * 0.3, 7, 0, Math.PI * 2); c.fill(); } c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 ${W * 0.36}px ${FONT}`; c.fillText('Z', W / 2, H / 2 + 6); }, 256, 256);
    const side = mat(0x9a5b25, { roughness: 0.8 }), face = new T.MeshStandardMaterial({ map: top, roughness: 0.8 });
    mesh(new T.CylinderGeometry(0.024, 0.024, 0.0045, 32), [side, face, face], b, 0, 0.00225, 0);
    cyl(0.0225, 0.0225, 0.004, 0xfff6e0, b, 0, 0.0065, 0, 32);
    mesh(new T.CylinderGeometry(0.024, 0.024, 0.0045, 32), [side, face, face], b, 0, 0.01075, 0);
    return b;
  }
  function biscuitPacket() {
    const g = new T.Group(), W = 0.19, H = 0.065, D = 0.04;
    const geo = new T.BoxGeometry(W, H, D, 24, 8, 6), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / (W / 2), y = p.getY(i) / (H / 2);
      let z = p.getZ(i) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x), 10)), 0.5) * (1 - 0.08 * y * y);
      let yy = p.getY(i) * (1 - 0.06 * Math.pow(Math.abs(x), 6));
      if (Math.abs(x) > 0.93) { z = Math.sign(p.getZ(i)) * 0.0015 * (1.2 + Math.sin(y * 30)); }
      p.setXYZ(i, p.getX(i), yy, z);
    }
    geo.computeVertexNormals();
    const side = mat(0x6d28d9, { roughness: 0.35, metalness: 0.15 });
    mesh(geo, [side, side, side, side, new T.MeshStandardMaterial({ map: biscuitTex(false), roughness: 0.35, metalness: 0.1 }), new T.MeshStandardMaterial({ map: biscuitTex(true), roughness: 0.35, metalness: 0.1 })], g, 0, H / 2, 0);
    biscuit(g, 0.045, 0, 0.055);
    const b2 = biscuit(g, -0.01, 0.0, 0.06); b2.rotation.set(-1.1, 0.3, 0); b2.position.set(-0.01, 0.024, 0.04);
    return { group: g, phys: { shape: 'box', size: [W, H, D], mass: 0.12 } };
  }

  /* ---------- chocolate bar, purple wrapper, foil peeled back ---------- */
  function chocolateBar() {
    const g = new T.Group(), choc = mat(0x5a3220, { roughness: 0.35 }), choc2 = mat(0x4a2818, { roughness: 0.45 });
    // foil, crinkled, opened out
    const rnd = seeded(13), fgeo = new T.PlaneGeometry(0.075, 0.1, 18, 22).rotateX(-Math.PI / 2), fp = fgeo.attributes.position;
    for (let i = 0; i < fp.count; i++) {
      const x = fp.getX(i), z = fp.getZ(i), edge = Math.max(0, Math.abs(z) / 0.05 - 0.55);
      fp.setY(i, 0.0015 + (rnd() - 0.5) * 0.0018 + edge * edge * 0.012 * (0.6 + 0.4 * Math.sin(x * 160)) + Math.max(0, x / 0.0375 - 0.7) * 0.004);
      if (x > 0.03) fp.setX(i, x - (rnd() * 0.006) * (0.5 + 0.5 * Math.sin(z * 200)));                            // torn end
    }
    fgeo.computeVertexNormals();
    mesh(fgeo, mat(0xdde3ea, { metalness: 1, roughness: 0.28, flatShading: true, side: T.DoubleSide }), g, 0.045, 0, 0);
    // exposed chocolate: base slab + 2 × 3 segments (one broken off)
    mesh(roundBox(0.05, 0.005, 0.058, 0.0015), choc2, g, 0.048, 0.0045, 0);
    for (let cx = 0; cx < 2; cx++) for (let cz = 0; cz < 3; cz++) {
      if (cx === 1 && cz === 0) continue;
      mesh(roundBox(0.0215, 0.0055, 0.0168, 0.0022), choc, g, 0.036 + cx * 0.024, 0.0095, -0.0195 + cz * 0.0195);
    }
    const piece = new T.Group(); piece.position.set(0.098, 0, 0.042); piece.rotation.y = 0.5; g.add(piece);
    mesh(roundBox(0.022, 0.005, 0.018, 0.0015), choc2, piece, 0, 0.0025, 0); mesh(roundBox(0.0205, 0.0055, 0.0165, 0.0022), choc, piece, 0, 0.0065, 0);
    // paper sleeve
    const W = 0.11, H = 0.016, D = 0.066;
    mesh(roundBox(W, H, D, 0.004), mat(Z.purple, { roughness: 0.45 }), g, -0.032, H / 2, 0);
    const lab = tex((c, Wd, Hd) => {
      c.fillStyle = hex(Z.purple); c.fillRect(0, 0, Wd, Hd);
      c.fillStyle = '#a78bfa'; c.beginPath(); c.moveTo(0, Hd * 0.78); c.bezierCurveTo(Wd * 0.3, Hd * 0.6, Wd * 0.6, Hd * 0.98, Wd, Hd * 0.75); c.lineTo(Wd, Hd); c.lineTo(0, Hd); c.fill();
      c.fillStyle = '#5a3220'; c.beginPath(); c.moveTo(0, Hd * 0.86); c.bezierCurveTo(Wd * 0.3, Hd * 0.72, Wd * 0.6, Hd * 1.05, Wd, Hd * 0.86); c.lineTo(Wd, Hd); c.lineTo(0, Hd); c.fill();
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = hex(Z.yellow); fitText(c, 'ZUNGGA', Wd * 0.86, 230); c.lineWidth = 16; c.strokeStyle = '#3b0764'; c.strokeText('ZUNGGA', Wd / 2, Hd * 0.36); c.fillText('ZUNGGA', Wd / 2, Hd * 0.36);
      c.fillStyle = '#ffffff'; c.font = `600 ${Hd * 0.12}px ${FONT}`; c.fillText('Milk Chocolate', Wd / 2, Hd * 0.62);
    }, 1024, 600);
    const top = mesh(new T.PlaneGeometry(W - 0.006, D - 0.006), new T.MeshStandardMaterial({ map: lab, roughness: 0.45 }), g, -0.032, H + 0.0002, 0); top.rotation.x = -Math.PI / 2;
    return { group: g, phys: { shape: 'box', size: [0.16, 0.016, 0.066], mass: 0.05 } };
  }

  ZAssets.register('food', 'lunch_box', 'Steel lunch box', lunchBox, ['lunch', 'tiffin', 'school', 'opens']);
  ZAssets.register('food', 'water_bottle', 'Water bottle', waterBottle, ['bottle', 'drink', 'school']);
  ZAssets.register('food', 'samosa_plate', 'Samosa plate', samosaPlate, ['snack', 'samosa', 'chutney', 'plate']);
  ZAssets.register('food', 'ice_cream', 'Ice-cream cone', iceCream, ['dessert', 'cone', 'treat']);
  ZAssets.register('food', 'apple', 'Apple', apple, ['fruit', 'healthy']);
  ZAssets.register('food', 'banana', 'Banana', banana, ['fruit', 'healthy']);
  ZAssets.register('food', 'mango', 'Mango', mango, ['fruit', 'summer']);
  ZAssets.register('food', 'birthday_cake', 'Birthday cake', birthdayCake, ['cake', 'party', 'candles', 'celebration']);
  ZAssets.register('food', 'tiffin_carrier', 'Tiffin carrier', tiffinCarrier, ['tiffin', 'dabba', 'lunch', 'steel']);
  ZAssets.register('food', 'lemonade', 'Glass of lemonade', lemonade, ['drink', 'lemon', 'nimbu pani', 'glass']);
  ZAssets.register('food', 'biscuit_packet', 'Cream biscuits packet', biscuitPacket, ['snack', 'biscuit', 'packet']);
  ZAssets.register('food', 'chocolate_bar', 'Chocolate bar', chocolateBar, ['chocolate', 'treat', 'sweet']);
})();
