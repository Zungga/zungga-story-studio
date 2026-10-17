/* Zungga Story Studio — brand props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box, logoTex, mascotTex, decal, label, cyl, sphere } = ZA;
  const SRC = document.currentScript && document.currentScript.src;
  const LOGO_URL = SRC ? new URL('brand/zungga-logo.png', SRC).href : 'assets/brand/zungga-logo.png';
  function zunggaLogo() {   // the real Zungga logo (assets/brand/zungga-logo.png) on a white card
    const g = new T.Group();
    const t = logoTex();   // shared + preloaded (assets/core.js)
    const W = 0.44, H = W * 755 / 920;
    mesh(new T.BoxGeometry(W + 0.06, H + 0.06, 0.02), mat(0xffffff), g, 0, H / 2 + 0.03, 0);
    mesh(new T.PlaneGeometry(W, H), new T.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.5 }), g, 0, H / 2 + 0.03, 0.0105).castShadow = false;
    return { group: g };
  }
  ZAssets.register('brand', 'zungga_logo', 'Zungga logo', zunggaLogo, ["logo", "brand", "end card"]);
  /* ------------------------------------------------------------------ more brand props ------------------------------------------------------------------ */
  const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const std = (o) => new T.MeshStandardMaterial({ roughness: 0.7, ...o });
  const plane = (map, w, h, parent, x = 0, y = 0, z = 0, o = {}) => { const m = mesh(new T.PlaneGeometry(w, h), std({ map, ...o }), parent, x, y, z); m.castShadow = false; return m; };
  const txt = (c, s, x, y, size, col = '#1f1a33', weight = 700, align = 'center', maxW = 0) => { c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle'; c.font = `${weight} ${size}px ${FONT}`; if (maxW) fitText(c, s, maxW, size, weight); c.fillText(s, x, y); };
  const LOGO_AR = 755 / 920, MASCOT_AR = 459 / 398;
  const GOLD = () => mat(0xf6c445, { metalness: 0.45, roughness: 0.25, emissive: 0x4a3200, emissiveIntensity: 0.35 });
  // a curved picture: a sphere patch facing +z (u spans the patch, so the whole texture fits it)
  function spherePatch(map, r, phiLen, thetaStart, thetaLen, parent, x = 0, y = 0, z = 0) {
    const m = mesh(new T.SphereGeometry(r, 24, 16, Math.PI / 2 - phiLen / 2, phiLen, thetaStart, thetaLen), std({ map, transparent: true, roughness: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), parent, x, y, z);
    m.castShadow = false; return m;
  }
  function roundShape(pts, rr) {
    const s = new T.Shape(), n = pts.length;
    for (let i = 0; i < n; i++) {
      const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n], da = Math.hypot(a[0] - p[0], a[1] - p[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1]), r = Math.min(rr, da / 2.2, db / 2.2);
      const p1 = [p[0] + (a[0] - p[0]) / da * r, p[1] + (a[1] - p[1]) / da * r], p2 = [p[0] + (b[0] - p[0]) / db * r, p[1] + (b[1] - p[1]) / db * r];
      if (i === 0) s.moveTo(p1[0], p1[1]); else s.lineTo(p1[0], p1[1]); s.quadraticCurveTo(p[0], p[1], p2[0], p2[1]);
    }
    s.closePath(); return s;
  }
  const starShape = (n, ro, ri) => { const s = new T.Shape(); for (let i = 0; i < n * 2; i++) { const a = Math.PI / 2 + i * Math.PI / n, r = i % 2 ? ri : ro; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } s.closePath(); return s; };
  const extrude = (shape, depth, bevel = 0.002) => { const g = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 8 }); g.translate(0, 0, -depth / 2); return g; };

  // ---- shiny trophy with the logo on a medallion ----
  function zunggaTrophy() {
    const g = new T.Group(), gold = GOLD();
    box(0.2, 0.06, 0.2, 0x4c1d95, g, 0, 0.03, 0, 0.01);
    box(0.15, 0.05, 0.15, 0x2e1065, g, 0, 0.085, 0, 0.008);
    const pl = tex((c, W, H) => { c.fillStyle = '#f6c445'; c.beginPath(); c.roundRect(0, 0, W, H, 18); c.fill(); txt(c, 'ZUNGGA CHAMPION', W / 2, H / 2 + 3, H * 0.5, '#4c1d95', 700, 'center', W * 0.9); }, 512, 110);
    plane(pl, 0.17, 0.036, g, 0, 0.03, 0.101, { metalness: 0.3, roughness: 0.35 });
    cyl(0.03, 0.04, 0.02, 0xf6c445, g, 0, 0.12, 0).material = gold;
    cyl(0.012, 0.016, 0.07, 0xf6c445, g, 0, 0.165, 0).material = gold;
    sphere(0.022, 0xf6c445, g, 0, 0.2, 0).material = gold;
    const prof = [[0.0, 0], [0.02, 0], [0.04, 0.01], [0.065, 0.04], [0.08, 0.08], [0.085, 0.12], [0.09, 0.15], [0.095, 0.155], [0.088, 0.155], [0.082, 0.12], [0.0, 0.11]].map(([x, y]) => new T.Vector2(x, y));
    const cup = mesh(new T.LatheGeometry(prof, 40), gold, g, 0, 0.205, 0);
    for (const s of [-1, 1]) { const h = mesh(new T.TorusGeometry(0.045, 0.008, 10, 24, Math.PI * 1.1), gold, g, s * 0.085, 0.3, 0); h.rotation.z = s > 0 ? -Math.PI / 2 - 0.15 : Math.PI / 2 + 0.15; }
    const med = cyl(0.045, 0.045, 0.006, 0xfff7e6, g, 0, 0.3, 0.085, 32); med.rotation.x = Math.PI / 2; med.material = mat(0xfff7e6, { roughness: 0.4 });
    const ring = mesh(new T.TorusGeometry(0.045, 0.004, 8, 32), gold, g, 0, 0.3, 0.086);
    decal(logoTex(), 0.075, 0.075 * LOGO_AR, g, 0, 0.3, 0.0895);
    for (const [x, y, s] of [[-0.06, 0.39, 0.012], [0.065, 0.375, 0.009]]) { const st = mesh(extrude(starShape(4, s, s * 0.35), 0.002, 0.001), mat(0xffffff, { emissive: 0xfff3b0, emissiveIntensity: 0.8 }), g, x, y, 0.06); st.castShadow = false; }
    return { group: g };
  }

  // ---- flag on a pole: tick(t) waves the cloth ----
  function zunggaFlag() {
    const g = new T.Group(), PH = 2.3, FW = 0.9, FH = 0.6, fy = PH - 0.08 - FH / 2;
    cyl(0.16, 0.18, 0.08, 0x9aa3ae, g, 0, 0.04, 0, 32);
    cyl(0.018, 0.022, PH, 0xf1f5f9, g, 0, PH / 2, 0, 16).material = mat(0xf1f5f9, { metalness: 0.4, roughness: 0.3 });
    sphere(0.035, 0xf6c445, g, 0, PH + 0.03, 0).material = GOLD();
    const bg = tex((c, W, H) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); c.fillStyle = hex(Z.purple); c.fillRect(0, 0, W * 0.09, H); c.fillStyle = hex(Z.pink); c.beginPath(); c.moveTo(W * 0.09, H); for (let x = 0; x <= 1; x += 0.02) c.lineTo(W * (0.09 + x * 0.91), H * (0.9 + Math.sin(x * 9) * 0.03)); c.lineTo(W, H); c.fill(); c.fillStyle = hex(Z.yellow); c.beginPath(); c.moveTo(W * 0.09, 0); for (let x = 0; x <= 1; x += 0.02) c.lineTo(W * (0.09 + x * 0.91), H * (0.08 + Math.sin(x * 9 + 2) * 0.025)); c.lineTo(W, 0); c.fill(); }, 1024, 683);
    const flagGeo = new T.PlaneGeometry(FW, FH, 30, 14); flagGeo.translate(FW / 2 + 0.02, 0, 0);
    const lw = 0.44, lh = lw * LOGO_AR, logoGeo = new T.PlaneGeometry(lw, lh, 16, 10); logoGeo.translate(0.02 + FW * 0.55, 0, 0);
    const flag = mesh(flagGeo, std({ map: bg, side: T.DoubleSide, roughness: 0.85 }), g, 0, fy, 0);
    const logo = mesh(logoGeo, std({ map: logoTex(), transparent: true, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }), g, 0, fy, 0); logo.castShadow = false;
    const base = [flagGeo, logoGeo].map((gg) => Float32Array.from(gg.attributes.position.array));
    const wave = (x, y, t) => { const k = (x - 0.02) / FW; return Math.max(0, k) * (0.05 * Math.sin(x * 7 - t * 5 + y * 1.8) + 0.02 * Math.sin(x * 13 - t * 8.3)); };
    g.userData.tick = (t) => { [flagGeo, logoGeo].forEach((gg, j) => { const p = gg.attributes.position, b = base[j]; for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1]; p.setXYZ(i, x - Math.abs(wave(x, y, t)) * 0.3, y - (x - 0.02) * 0.03, wave(x, y, t)); } p.needsUpdate = true; gg.computeVertexNormals(); }); };
    g.userData.tick(0);
    return { group: g };
  }

  // ---- bunch of 6 balloons tied to a little gift weight: tick(t) bob and sway ----
  function zunggaBalloons() {
    const g = new T.Group(), cols = [Z.purple, Z.pink, Z.yellow, Z.purple, Z.pink, Z.yellow], logos = [true, false, true, false, true, false];
    box(0.08, 0.07, 0.08, Z.pink, g, 0, 0.035, 0, 0.008);
    box(0.083, 0.071, 0.02, Z.yellow, g, 0, 0.035, 0, 0.004); box(0.02, 0.071, 0.083, Z.yellow, g, 0, 0.035, 0, 0.004);
    const A = [[-0.3, 0.06, 1.25], [-0.12, 0.2, 1.5], [0.1, 0.08, 1.38], [0.3, -0.05, 1.2], [-0.16, -0.22, 1.18], [0.2, -0.24, 1.45]];
    const strM = mat(0xf8fafc, { roughness: 0.5 }), items = [];
    A.forEach(([az, ax, L], i) => {
      const piv = new T.Group(); piv.position.y = 0.07; g.add(piv);
      const str = mesh(new T.CylinderGeometry(0.0015, 0.0015, 1, 4), strM, piv); str.castShadow = false;
      const bal = new T.Group(); piv.add(bal);
      const R = 0.15, b = mesh(new T.SphereGeometry(R, 32, 24), mat(cols[i], { roughness: 0.22, metalness: 0.05 }), bal, 0, R * 1.15, 0); b.scale.y = 1.15;
      cyl(0.006, 0.014, 0.02, cols[i], bal, 0, 0.005, 0, 12);
      sphere(0.025, 0xffffff, bal, -0.05, R * 1.15 + 0.08, 0.11).material = mat(0xffffff, { transparent: true, opacity: 0.45, roughness: 0.1 });
      if (logos[i]) { const holder = new T.Group(); holder.position.y = R * 1.15; holder.scale.y = 1.15; bal.add(holder); const w = new T.Mesh(new T.SphereGeometry(R * 0.985, 24, 16, Math.PI / 2 - 0.7, 1.4, 0.9, 1.25), mat(0xffffff, { roughness: 0.3 })); w.visible = false; spherePatch(logoTex(), R * 1.004, 1.25, 0.95, 1.15, holder); }
      items.push({ piv, str, bal, az, ax, L, i });
    });
    g.userData.tick = (t) => { for (const o of items) { const L = o.L + 0.025 * Math.sin(t * 1.6 + o.i * 1.3); o.piv.rotation.set(o.ax + 0.04 * Math.sin(t * 1.1 + o.i * 2.1), 0, o.az + 0.05 * Math.sin(t * 1.3 + o.i)); o.str.scale.y = L; o.str.position.y = L / 2; o.bal.position.y = L; o.bal.rotation.set(-o.ax * 0.5, 0.2 * Math.sin(t * 0.7 + o.i), -o.az * 0.5); } };
    g.userData.tick(0);
    return { group: g };
  }

  // ---- wrapped gift: setOn(true) = lid off, confetti bursting out ----
  function zunggaGift() {
    const g = new T.Group(), S = 0.3, t = 0.012, pink = mat(Z.pink, { roughness: 0.5 }), rib = mat(Z.yellow, { roughness: 0.35 }), rx = 0.07;
    const paper = tex((c, W, H) => { c.fillStyle = hex(Z.pink); c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = 16; y < H; y += 48) for (let x = (y / 48) % 2 ? 40 : 16; x < W; x += 48) { c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fill(); } }, 512, 512);
    const pm = std({ map: paper, roughness: 0.5 });
    mesh(new T.BoxGeometry(S, t, S), pm, g, 0, t / 2, 0);
    for (const [w, d, x, z] of [[S, t, 0, S / 2 - t / 2], [S, t, 0, -S / 2 + t / 2], [t, S, S / 2 - t / 2, 0], [t, S, -S / 2 + t / 2, 0]]) mesh(new T.BoxGeometry(w, S, d), pm, g, x, S / 2, z);
    mesh(new T.BoxGeometry(S - 2 * t, 0.004, S - 2 * t), mat(0xfde68a), g, 0, t + 0.002, 0);
    for (const z of [S / 2 + 0.002, -S / 2 - 0.002]) mesh(new T.BoxGeometry(0.045, S, 0.004), rib, g, rx, S / 2, z);
    mesh(new T.BoxGeometry(0.004, S, 0.045), rib, g, S / 2 + 0.002, S / 2, 0); mesh(new T.BoxGeometry(0.004, S, 0.045), rib, g, -S / 2 - 0.002, S / 2, 0);
    const card = box(0.15, 0.13, 0.004, 0xffffff, g, -0.06, S * 0.48, S / 2 + 0.004, 0.0015);
    decal(logoTex(), 0.13, 0.13 * LOGO_AR, g, -0.06, S * 0.48, S / 2 + 0.0075);
    // lid with ribbon cross and a bow
    const lid = new T.Group(); g.add(lid);
    mesh(roundBox(S + 0.02, 0.06, S + 0.02, 0.006), pm, lid, 0, 0.03, 0);
    mesh(new T.BoxGeometry(0.045, 0.062, S + 0.024), rib, lid, rx, 0.03, 0); mesh(new T.BoxGeometry(S + 0.024, 0.062, 0.045), rib, lid, 0, 0.03, 0);
    for (const s of [-1, 1]) { const lp = mesh(new T.TorusGeometry(0.045, 0.014, 10, 24), rib, lid, rx + s * 0.045, 0.085, 0); lp.scale.set(1, 0.7, 0.5); lp.rotation.z = s * 0.35; const tl = box(0.03, 0.004, 0.09, Z.yellow, lid, rx + s * 0.03, 0.062, 0.05, 0.001); tl.rotation.y = s * 0.4; tl.material = rib; }
    sphere(0.022, Z.yellow, lid, rx, 0.075, 0).material = rib;
    // confetti burst (visible when open)
    const burst = new T.Group(); g.add(burst); const rnd = seeded(31), CC = [Z.purple, Z.pink, Z.yellow, Z.blue, Z.green, Z.orange, 0xffffff];
    const n = 150, im = new T.InstancedMesh(new T.PlaneGeometry(0.022, 0.012), mat(0xffffff, { side: T.DoubleSide, roughness: 0.5 }), n), o = new T.Object3D(), col = new T.Color();
    for (let i = 0; i < n; i++) { const h = rnd(), a = rnd() * Math.PI * 2, rr = (0.03 + h * 0.3) * Math.sqrt(rnd()); o.position.set(Math.cos(a) * rr, S * 0.6 + h * 0.55, Math.sin(a) * rr); o.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, col.set(CC[i % CC.length])); }
    im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; if (im.computeBoundingBox) im.computeBoundingBox(); burst.add(im);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, pts = []; for (let j = 0; j <= 12; j++) { const f = j / 12; pts.push(new T.Vector3(Math.cos(a) * (0.02 + f * 0.22) + Math.sin(f * 12 + k) * 0.02, S * 0.7 + f * 0.4 - f * f * 0.15, Math.sin(a) * (0.02 + f * 0.22) + Math.cos(f * 12 + k) * 0.02)); } mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.003, 5), mat(CC[k]), burst); }
    const star = mesh(extrude(starShape(5, 0.05, 0.022), 0.012, 0.004), mat(Z.yellow, { emissive: 0xfacc15, emissiveIntensity: 0.4 }), burst, 0, S + 0.08, 0);
    g.userData.setOn = (on) => { burst.visible = !!on; if (on) { lid.position.set(0.36, 0.105, 0.06); lid.rotation.set(0.1, -0.4, -1.25); } else { lid.position.set(0, S - 0.02, 0); lid.rotation.set(0, 0, 0); } };
    g.userData.setOn(false);
    return { group: g };
  }

  // ---- sticker sheet with mascot / logo stickers (lies flat; one sticker peeling up) ----
  function zunggaStickers() {
    const g = new T.Group(), face = new T.Group(); face.rotation.x = -Math.PI / 2; face.position.y = 0.002; g.add(face);
    const W = 0.2, H = 0.28;
    const sheet = tex((c, Wd, Hd) => { c.fillStyle = '#f5f3ff'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = hex(Z.purple); c.fillRect(0, 0, Wd, Hd * 0.1); txt(c, 'ZUNGGA STICKERS', Wd / 2, Hd * 0.05, Hd * 0.045, '#ffffff', 700, 'center', Wd * 0.9); c.strokeStyle = '#ddd6fe'; c.setLineDash([10, 8]); c.lineWidth = 3; c.strokeRect(20, Hd * 0.12, Wd - 40, Hd * 0.85); }, 512, 717);
    mesh(new T.BoxGeometry(W, H, 0.0015), [mat(0xffffff), mat(0xffffff), mat(0xffffff), mat(0xffffff), std({ map: sheet }), mat(0xffffff)], face, 0, 0, 0);
    const z0 = 0.0012, white = mat(0xffffff, { roughness: 0.4 });
    const disc = (r, x, y, parent = face) => { const d = mesh(new T.CylinderGeometry(r, r, 0.0008, 40), white, parent, x, y, z0); d.rotation.x = Math.PI / 2; return d; };
    // logo sticker (rounded rectangle)
    mesh(roundBox(0.12, 0.1, 0.001, 0.0004), white, face, -0.02, 0.07, z0); decal(logoTex(), 0.11, 0.11 * LOGO_AR, face, -0.02, 0.07, z0 + 0.0008);
    // mascot stickers
    for (const [x, y, r, bg] of [[0.06, 0.0, 0.032, Z.yellow], [-0.055, -0.035, 0.036, Z.blue]]) { disc(r, x, y); const c2 = mesh(new T.CircleGeometry(r * 0.88, 40), mat(bg, { roughness: 0.4 }), face, x, y, z0 + 0.0006); c2.castShadow = false; decal(mascotTex(), r * 1.3, r * 1.3 * MASCOT_AR, face, x, y, z0 + 0.001); }
    // stars, heart, text sticker
    for (const [x, y, s, c] of [[0.07, 0.115, 0.022, Z.yellow], [0.075, -0.075, 0.018, Z.pink], [-0.075, -0.1, 0.016, Z.green]]) mesh(extrude(starShape(5, s, s * 0.45), 0.0006, 0.0006), mat(c, { roughness: 0.4 }), face, x, y, z0);
    const heart = new T.Shape(); heart.moveTo(0, -0.018); heart.bezierCurveTo(-0.03, 0.002, -0.014, 0.022, 0, 0.01); heart.bezierCurveTo(0.014, 0.022, 0.03, 0.002, 0, -0.018);
    mesh(extrude(heart, 0.0006, 0.0006), mat(0xef4444, { roughness: 0.4 }), face, 0.0, -0.06, z0);
    const wow = label('WOW!', { w: 256, h: 128, bg: hex(Z.orange), fg: '#ffffff', size: 90, radius: 40 });
    mesh(roundBox(0.06, 0.03, 0.001, 0.0004), white, face, 0.02, -0.105, z0); plane(wow, 0.056, 0.026, face, 0.02, -0.105, z0 + 0.0008, { transparent: true });
    // peeling mascot sticker: hinged on its left edge, right edge lifting
    const peel = new T.Group(); peel.position.set(0.035, 0.07 - 0.12, z0 + 0.0004); peel.rotation.y = -0.7; face.add(peel);
    const pr = 0.026; disc(pr, pr, 0, peel).position.z = 0; const c3 = mesh(new T.CircleGeometry(pr * 0.88, 40), mat(Z.pink, { roughness: 0.4 }), peel, pr, 0, 0.0006); c3.castShadow = false; decal(mascotTex(), pr * 1.3, pr * 1.3 * MASCOT_AR, peel, pr, 0, 0.001);
    return { group: g };
  }

  // ---- plush toy of the mascot: a soft, chubby "Z" with a happy face ----
  function zunggaPlush() {
    const g = new T.Group(), k = 0.14;
    const P = [[-0.55, 1], [0.6, 1], [0.6, 0.52], [0.05, -0.5], [0.6, -0.5], [0.6, -1], [-0.6, -1], [-0.6, -0.55], [-0.08, 0.5], [-0.55, 0.5]].map(([x, y]) => [x * k, y * k]);
    const geo = new T.ExtrudeGeometry(roundShape(P, 0.045), { depth: 0.05, bevelEnabled: true, bevelSize: 0.022, bevelThickness: 0.03, bevelSegments: 8, curveSegments: 10 });
    geo.translate(0, 0, -0.025);
    const pos = geo.attributes.position, cols = new Float32Array(pos.count * 3), c = new T.Color(), stops = [[0, '#6d4bd8'], [0.35, '#e8458b'], [0.65, '#fb8a3c'], [1, '#fbc531']];
    for (let i = 0; i < pos.count; i++) { const f = (pos.getY(i) / k + 1.15) / 2.3; let j = 0; while (j < stops.length - 2 && f > stops[j + 1][0]) j++; const a = stops[j], b = stops[j + 1], u = Math.min(1, Math.max(0, (f - a[0]) / (b[0] - a[0]))); c.set(a[1]).lerp(new T.Color(b[1]), u); cols.set([c.r, c.g, c.b], i * 3); }
    geo.setAttribute('color', new T.BufferAttribute(cols, 3)); geo.computeVertexNormals();
    const fabric = mat(0xffffff, { vertexColors: true, roughness: 0.95 });
    const body = mesh(geo, fabric, g, 0, k + 0.05, 0);
    const faceT = tex((cx, W, H) => { cx.lineCap = 'round'; cx.strokeStyle = '#1f1a33'; cx.lineWidth = 26; for (const x of [W * 0.3, W * 0.7]) { cx.beginPath(); cx.arc(x, H * 0.48, W * 0.09, Math.PI * 1.1, Math.PI * 1.9); cx.stroke(); } cx.beginPath(); cx.arc(W / 2, H * 0.48, W * 0.14, Math.PI * 0.15, Math.PI * 0.85); cx.stroke(); cx.fillStyle = 'rgba(236,72,153,0.45)'; for (const x of [W * 0.16, W * 0.84]) { cx.beginPath(); cx.ellipse(x, H * 0.66, W * 0.07, H * 0.06, 0, 0, Math.PI * 2); cx.fill(); } }, 512, 400);
    const fd = decal(faceT, 0.11, 0.086, g, 0.0, k + 0.05 + 0.75 * k, 0.057);
    // stitched seam around the front edge hint + little feet
    for (const s of [-1, 1]) { const f = sphere(0.03, 0x6d4bd8, g, s * 0.045, 0.022, 0.02); f.scale.set(1.2, 0.7, 1.4); f.material = mat(0x5b3fc4, { roughness: 0.95 }); }
    // sparkle star + dashes (like the logo)
    const sp = mesh(extrude(starShape(4, 0.025, 0.008), 0.012, 0.004), mat(0x2ab7c9, { roughness: 0.9 }), g, 0.12, 0.13, 0.0);
    [[0.11, 0.37, 0.4, 0x2ab7c9], [0.135, 0.34, 0.9, Z.pink], [0.145, 0.3, 1.45, Z.orange]].forEach(([x, y, r, col]) => { const d = mesh(new T.CapsuleGeometry(0.007, 0.025, 4, 8), mat(col, { roughness: 0.9 }), g, x, y, 0); d.rotation.z = -r; });
    const tagT = label('ZUNGGA', { w: 256, h: 96, bg: '#ffffff', fg: '#7c3aed', size: 60 });
    const tag = mesh(new T.PlaneGeometry(0.035, 0.016), std({ map: tagT, side: T.DoubleSide }), g, -0.088, 0.06, 0.03); tag.rotation.y = -0.6;
    return { group: g };
  }

  // ---- freestanding "ZUNGGA" sign that lights up: setOn(true) = glow on ----
  function zunggaSignboard() {
    const g = new T.Group(), W = 1.5, H = 0.5, y = 1.45;
    for (const s of [-1, 1]) { box(0.06, y, 0.06, 0x2e1065, g, s * 0.62, y / 2, 0, 0.01); box(0.3, 0.04, 0.2, 0x2e1065, g, s * 0.62, 0.02, 0, 0.01); }
    box(W, H, 0.1, 0x2e1065, g, 0, y, 0, 0.02);
    const LET = 'ZUNGGA', LC = ['#5b2bb5', '#16b3c4', '#f59e0b', '#ec4899', '#8b5cf6', '#16b3c4'];
    const draw = (lit) => (c, Wd, Hd) => { c.fillStyle = lit ? '#000000' : '#1e0b4b'; c.fillRect(0, 0, Wd, Hd); c.font = `700 ${Hd * 0.7}px ${FONT}`; c.textBaseline = 'middle'; c.textAlign = 'left';
      const ws = [...LET].map((ch) => c.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) + 18 * 5; let x = Wd * 0.62 - tot / 2;
      [...LET].forEach((ch, i) => { if (!lit) { c.lineWidth = 14; c.strokeStyle = '#ffffff'; c.lineJoin = 'round'; c.strokeText(ch, x, Hd * 0.55); } c.fillStyle = lit ? '#ffffff' : LC[i]; if (lit) { c.shadowColor = LC[i]; c.shadowBlur = 30; c.fillStyle = LC[i]; c.fillText(ch, x, Hd * 0.55); c.shadowBlur = 0; c.fillStyle = 'rgba(255,255,255,0.55)'; } c.fillText(ch, x, Hd * 0.55); x += ws[i] + 18; }); };
    const base = tex(draw(false), 1536, 480), glow = tex(draw(true), 1536, 480);
    const face = plane(base, W - 0.06, H - 0.06, g, 0, y, 0.051, { emissive: 0xffffff, emissiveMap: glow, emissiveIntensity: 0, roughness: 0.5 });
    const mas = decal(mascotTex(), 0.3, 0.3 * MASCOT_AR, g, -0.52, y, 0.053); mas.material.emissive = new T.Color(0xffffff); mas.material.emissiveMap = mascotTex(); mas.material.emissiveIntensity = 0;
    const bulbM = mat(0xfff3c4, { emissive: 0xffd36b, emissiveIntensity: 0, roughness: 0.3 }), bulbs = [], nb = 26;
    for (let i = 0; i < nb; i++) { const f = i / nb, per = 2 * (W + H), d = f * per; let bx, by; if (d < W) { bx = -W / 2 + d; by = H / 2; } else if (d < W + H) { bx = W / 2; by = H / 2 - (d - W); } else if (d < 2 * W + H) { bx = W / 2 - (d - W - H); by = -H / 2; } else { bx = -W / 2; by = -H / 2 + (d - 2 * W - H); } const b = mesh(new T.SphereGeometry(0.016, 12, 8), bulbM, g, bx * 0.97, y + by * 0.9, 0.06); b.castShadow = false; }
    const light = new T.PointLight(0xffd9a0, 0, 3, 2); light.position.set(0, y, 0.6); g.add(light);
    g.userData.setOn = (on) => { face.material.emissiveIntensity = on ? 1.6 : 0; mas.material.emissiveIntensity = on ? 0.6 : 0; bulbM.emissiveIntensity = on ? 2.2 : 0; light.intensity = on ? 2.5 : 0; };
    g.userData.setOn(false);
    return { group: g };
  }

  // ---- baseball cap with the logo on the front panel ----
  function zunggaCap() {
    const g = new T.Group(), r = 0.095, sy = 0.85, base = 0.012;
    const panels = tex((c, W, H) => { c.fillStyle = hex(Z.purple); c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(30,10,70,0.5)'; c.lineWidth = 4; for (let i = 0; i < 6; i++) { const x = (i + 0.5) / 6 * W; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } c.fillStyle = 'rgba(30,10,70,0.6)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc((i + 0.25) / 6 * W, H * 0.2, 5, 0, Math.PI * 2); c.fill(); } c.fillRect(0, H - 10, W, 10); }, 512, 256);
    const crown = new T.Group(); crown.position.y = base; crown.scale.y = sy; g.add(crown);
    mesh(new T.SphereGeometry(r, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), std({ map: panels, roughness: 0.9, side: T.DoubleSide }), crown);
    sphere(0.012, Z.yellow, crown, 0, r, 0).scale.y = 0.6;
    spherePatch(logoTex(), r * 1.004, 0.95, 0.5, 0.75, crown);
    // curved brim
    const s = new T.Shape(); const N = 24;
    for (let i = 0; i <= N; i++) { const a = i / N * Math.PI; const x = -Math.cos(a) * r, y = Math.sin(a) * (r + 0.075); i ? s.lineTo(x, y) : s.moveTo(x, y); }
    for (let i = N; i >= 0; i--) { const a = i / N * Math.PI; s.lineTo(-Math.cos(a) * r * 0.99, Math.sin(a) * r * 0.9); }
    const bg = new T.ExtrudeGeometry(s, { depth: 0.004, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 2, curveSegments: 8 });
    bg.rotateX(Math.PI / 2); const p = bg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, p.getY(i) - 1.6 * x * x - 0.12 * Math.max(0, z - r * 0.8)); } bg.computeVertexNormals();
    mesh(bg, mat(Z.yellow, { roughness: 0.8 }), g, 0, base + 0.006, 0);
    return { group: g };
  }

  // ---- phone on a stand showing the Zungga app home screen ----
  function zunggaPhoneApp() {
    const g = new T.Group(), PW = 0.075, PH = 0.158, a = -0.3;
    box(0.1, 0.012, 0.09, 0xcbd5e1, g, 0, 0.006, -0.01, 0.004);
    box(0.08, 0.02, 0.008, 0xcbd5e1, g, 0, 0.02, 0.028, 0.003);
    const sup = box(0.06, 0.11, 0.008, 0xcbd5e1, g, 0, 0.06, -0.035, 0.003); sup.rotation.x = a;
    const ph = new T.Group(); ph.position.set(0, 0.014, 0.018); ph.rotation.x = a; g.add(ph);
    box(PW, PH, 0.009, 0x1f1a33, ph, 0, PH / 2, 0, 0.007);
    const app = tex((c, W, H) => {
      const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#7c3aed'); gr.addColorStop(0.55, '#c026d3'); gr.addColorStop(1, '#ec4899'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      txt(c, '9:41', 40, 34, 30, '#ffffff', 600, 'left'); c.fillStyle = '#fff'; c.fillRect(W - 90, 24, 50, 20);
      c.fillStyle = '#ffffff'; c.beginPath(); c.roundRect(30, 70, W - 60, 300, 36); c.fill();
      txt(c, 'Hi, Explorer!', W / 2, 420, 46, '#ffffff', 700);
      const tiles = [['Stories', '#f59e0b'], ['Maths', '#22c55e'], ['Words', '#38bdf8'], ['Games', '#ef4444'], ['Draw', '#f472b6'], ['Music', '#8b5cf6']];
      tiles.forEach(([n, col], i) => { const x = 40 + (i % 2) * ((W - 100) / 2 + 20), y = 470 + Math.floor(i / 2) * 170, w = (W - 100) / 2; c.fillStyle = col; c.beginPath(); c.roundRect(x, y, w, 150, 28); c.fill(); c.fillStyle = 'rgba(255,255,255,0.9)';
        const cx = x + w / 2, cy = y + 60;
        if (i === 0) { c.fillRect(cx - 40, cy - 25, 36, 50); c.fillRect(cx + 4, cy - 25, 36, 50); } else if (i === 1) txt(c, '1+2', cx, cy, 52, '#fff'); else if (i === 2) txt(c, 'ABC', cx, cy, 50, '#fff'); else if (i === 3) { c.beginPath(); c.roundRect(cx - 30, cy - 30, 60, 60, 12); c.fill(); c.fillStyle = col; for (const [dx, dy] of [[-14, -14], [14, 14], [0, 0]]) { c.beginPath(); c.arc(cx + dx, cy + dy, 7, 0, 7); c.fill(); } } else if (i === 4) { c.lineWidth = 12; c.lineCap = 'round'; c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(cx - 40, cy + 10); c.bezierCurveTo(cx - 15, cy - 40, cx + 15, cy + 40, cx + 40, cy - 10); c.stroke(); } else { c.beginPath(); c.arc(cx - 15, cy + 20, 14, 0, 7); c.arc(cx + 25, cy + 12, 14, 0, 7); c.fill(); c.fillRect(cx - 4, cy - 30, 8, 50); c.fillRect(cx + 36, cy - 38, 8, 50); c.fillRect(cx - 4, cy - 38, 48, 10); }
        txt(c, n, cx, y + 125, 32, '#ffffff', 700); });
      c.fillStyle = '#facc15'; c.beginPath(); c.roundRect(60, H - 180, W - 120, 80, 40); c.fill(); txt(c, '▶  PLAY', W / 2, H - 140, 40, '#1f1a33', 700);
      txt(c, 'Learn · Play · Grow', W / 2, H - 55, 30, '#ffffff', 600);
    }, 512, 1110);
    plane(app, PW - 0.006, PH - 0.008, ph, 0, PH / 2, 0.0047, { emissive: 0xffffff, emissiveMap: app, emissiveIntensity: 0.55, roughness: 0.25 });
    const sw = PW - 0.006, sh = PH - 0.008, top = PH / 2 + sh / 2;
    decal(logoTex(), 0.05, 0.05 * LOGO_AR, ph, 0, top - (70 + 150) / 1110 * sh, 0.0051);
    cyl(0.0025, 0.0025, 0.001, 0x000000, ph, 0, PH - 0.006, 0.0052, 12).rotation.x = Math.PI / 2;
    return { group: g };
  }

  // ---- roll-up banner: logo, "Learn · Play · Grow", mascot ----
  function zunggaBanner() {
    const g = new T.Group(), W = 0.8, H = 2.0, y0 = 0.12;
    box(0.86, 0.11, 0.2, 0xc0c7d0, g, 0, 0.065, 0, 0.03).material = mat(0xc0c7d0, { metalness: 0.4, roughness: 0.35 });
    for (const x of [-0.3, 0.3]) box(0.05, 0.012, 0.36, 0x6b7280, g, x, 0.006, 0, 0.004);
    cyl(0.008, 0.008, H, 0x9aa3ae, g, 0, y0 + H / 2, -0.03, 8);
    box(W + 0.02, 0.025, 0.03, 0x9aa3ae, g, 0, y0 + H + 0.01, 0, 0.008);
    const art = tex((c, Wd, Hd) => {
      const gr = c.createLinearGradient(0, 0, 0, Hd); gr.addColorStop(0, '#7c3aed'); gr.addColorStop(0.6, '#c026d3'); gr.addColorStop(1, '#ec4899'); c.fillStyle = gr; c.fillRect(0, 0, Wd, Hd);
      c.fillStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc((i * 137) % Wd, (i * 263) % Hd, 18 + (i % 4) * 10, 0, 7); c.fill(); }
      c.fillStyle = '#ffffff'; c.beginPath(); c.roundRect(Wd * 0.08, Hd * 0.04, Wd * 0.84, Hd * 0.28, 40); c.fill();
      const words = [['Learn', '#facc15'], ['Play', '#ffffff'], ['Grow', '#facc15']];
      words.forEach(([w, col], i) => { txt(c, w, Wd / 2, Hd * (0.39 + i * 0.075), Wd * 0.2, col, 700); if (i < 2) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(Wd / 2, Hd * (0.427 + i * 0.075), 9, 0, 7); c.fill(); } });
      txt(c, 'Learn · Play · Grow', Wd / 2, Hd * 0.6, Wd * 0.075, '#ffffff', 600, 'center', Wd * 0.86);
      c.fillStyle = '#facc15'; c.beginPath(); c.roundRect(Wd * 0.12, Hd * 0.9, Wd * 0.76, Hd * 0.06, 40); c.fill(); txt(c, 'Stories for curious kids', Wd / 2, Hd * 0.93, Wd * 0.06, '#4c1d95', 700, 'center', Wd * 0.7);
    }, 640, 1600);
    plane(art, W, H, g, 0, y0 + H / 2, 0, { side: T.FrontSide });
    mesh(new T.PlaneGeometry(W, H), mat(0xe5e7eb), g, 0, y0 + H / 2, -0.001).rotation.y = Math.PI;
    decal(logoTex(), 0.6, 0.6 * LOGO_AR, g, 0, y0 + H * (1 - 0.18), 0.003);
    decal(mascotTex(), 0.36, 0.36 * MASCOT_AR, g, 0, y0 + H * 0.25, 0.003);
    return { group: g };
  }

  ZAssets.register('brand', 'zungga_trophy', 'Zungga trophy', zunggaTrophy, ['brand', 'trophy', 'prize', 'winner', 'zungga']);
  ZAssets.register('brand', 'zungga_flag', 'Zungga flag', zunggaFlag, ['brand', 'flag', 'pole', 'zungga']);
  ZAssets.register('brand', 'zungga_balloons', 'Zungga balloons', zunggaBalloons, ['brand', 'balloons', 'party', 'birthday', 'zungga']);
  ZAssets.register('brand', 'zungga_gift', 'Zungga gift box', zunggaGift, ['brand', 'gift', 'present', 'surprise', 'confetti', 'zungga']);
  ZAssets.register('brand', 'zungga_stickers', 'Zungga sticker sheet', zunggaStickers, ['brand', 'stickers', 'zungga']);
  ZAssets.register('brand', 'zungga_plush', 'Zungga mascot plush', zunggaPlush, ['brand', 'plush', 'soft toy', 'mascot', 'zungga']);
  ZAssets.register('brand', 'zungga_signboard', 'Zungga light-up sign', zunggaSignboard, ['brand', 'sign', 'signboard', 'neon', 'zungga']);
  ZAssets.register('brand', 'zungga_cap', 'Zungga cap', zunggaCap, ['brand', 'cap', 'hat', 'zungga']);
  ZAssets.register('brand', 'zungga_phone_app', 'Zungga app on phone', zunggaPhoneApp, ['brand', 'phone', 'app', 'mobile', 'zungga']);
  ZAssets.register('brand', 'zungga_banner', 'Zungga roll-up banner', zunggaBanner, ['brand', 'banner', 'standee', 'zungga']);
  /*@@NEW@@*/
})();
