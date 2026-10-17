/* Zungga Story Studio — transport props (Indian streets). Registered into the shared library (assets/core.js).
 * Vehicles are modelled side-on: length along x with the nose pointing +x, so the default camera (+z) sees the side. */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box, logoTex, decal, label, cyl, sphere } = ZA;
  const PI = Math.PI;
  const M = (c) => (typeof c === 'number' ? mat(c) : c);
  const tyreM = () => mat(0x26232e, { roughness: 0.9 });
  const chromeM = () => mat(0xd9dee5, { metalness: 0.8, roughness: 0.25 });
  const darkGlass = () => mat(0x23314a, { roughness: 0.12, metalness: 0.3 });
  const lampM = (c, i = 0.9) => new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.3 });

  // a cylinder between two points
  function tube(a, b, r, m, parent, seg = 12) {
    const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), L = d.length();
    const me = mesh(new T.CylinderGeometry(r, r, L, seg), M(m), parent);
    me.position.copy(A).add(B).multiplyScalar(0.5);
    me.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    return me;
  }
  // a car-style wheel: axle along z
  function wheel(r, w, parent, x, y, z, hub = 0xd9dee5) {
    const g = new T.Group(); g.position.set(x, y, z); parent.add(g);
    mesh(new T.CylinderGeometry(r, r, w, 28).rotateX(PI / 2), tyreM(), g);
    mesh(new T.TorusGeometry(r * 0.9, r * 0.1, 8, 28), tyreM(), g, 0, 0, w / 2);
    mesh(new T.TorusGeometry(r * 0.9, r * 0.1, 8, 28), tyreM(), g, 0, 0, -w / 2);
    const hm = mat(hub, { metalness: 0.6, roughness: 0.3 });
    mesh(new T.CylinderGeometry(r * 0.55, r * 0.55, w * 1.12, 24).rotateX(PI / 2), hm, g);
    mesh(new T.CylinderGeometry(r * 0.2, r * 0.2, w * 1.2, 16).rotateX(PI / 2), mat(0x475569, { metalness: 0.5 }), g);
    return g;
  }
  // extruded side profile (points in x/y), centred in z with depth d and soft bevel
  function profile(pts, d, b, color, parent, z = 0) {
    const s = new T.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath();
    const geo = new T.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 4, curveSegments: 8 });
    geo.translate(0, 0, -(d - 2 * b) / 2); geo.computeVertexNormals();
    return mesh(geo, M(color), parent, 0, 0, z);
  }
  const face = (m, rotY) => { m.rotation.y = rotY; return m; };

  /* ---------------- bicycle ---------------- */
  function bicycle() {
    const g = new T.Group(), R = 0.21, frame = mat(0xef4444, { roughness: 0.35, metalness: 0.2 }), steel = chromeM(), blk = mat(0x1f2937);
    const bikeWheel = (x) => {
      const w = new T.Group(); w.position.set(x, R, 0); g.add(w);
      mesh(new T.TorusGeometry(R - 0.02, 0.022, 10, 36), tyreM(), w);
      mesh(new T.TorusGeometry(R - 0.045, 0.009, 8, 36), steel, w);
      for (let i = 0; i < 8; i++) { const s = mesh(new T.CylinderGeometry(0.0025, 0.0025, (R - 0.05) * 2, 4), steel, w); s.rotation.z = i * PI / 8; }
      mesh(new T.CylinderGeometry(0.02, 0.02, 0.07, 12).rotateX(PI / 2), steel, w);
    };
    bikeWheel(-0.42); bikeWheel(0.42);
    const BB = [-0.06, 0.25, 0], seat = [-0.2, 0.6, 0], headT = [0.29, 0.64, 0], headB = [0.33, 0.5, 0];
    tube(BB, seat, 0.017, frame, g); tube(BB, headB, 0.02, frame, g); tube([-0.18, 0.55, 0], [0.3, 0.6, 0], 0.017, frame, g);
    tube(headB, headT, 0.022, frame, g);
    for (const z of [-0.035, 0.035]) {
      tube(BB, [-0.42, R, z], 0.011, frame, g); tube([-0.18, 0.55, 0], [-0.42, R, z], 0.011, frame, g);
      tube(headB, [0.42, R, z], 0.012, steel, g);
    }
    // fenders
    for (const x of [-0.42, 0.42]) { const f = mesh(new T.TorusGeometry(R + 0.015, 0.012, 6, 20, PI * 0.75), frame, g, x, R, 0); f.rotation.z = x < 0 ? PI * 0.25 : 0; f.scale.z = 2.4; }
    // handlebar + grips + bell
    tube(headT, [0.27, 0.76, 0], 0.014, steel, g);
    tube([0.25, 0.77, -0.22], [0.25, 0.77, 0.22], 0.011, steel, g);
    for (const z of [-0.2, 0.2]) tube([0.25, 0.77, z - 0.04], [0.25, 0.77, z + 0.04], 0.017, mat(0xfacc15), g);
    cyl(0.022, 0.026, 0.018, 0xc0c7d0, g, 0.25, 0.795, 0.12, 20).material = steel;   // bell dome
    sphere(0.006, 0x94a3b8, g, 0.25, 0.81, 0.12);
    // saddle + post
    tube(seat, [-0.21, 0.66, 0], 0.012, steel, g);
    const sd = mesh(roundBox(0.2, 0.05, 0.12, 0.022), blk, g, -0.22, 0.68, 0); sd.scale.z = 1; sd.rotation.z = 0.04;
    // crank, chainring, pedals
    mesh(new T.CylinderGeometry(0.07, 0.07, 0.012, 24).rotateX(PI / 2), steel, g, BB[0], BB[1], 0.045);
    tube([BB[0], BB[1], 0.06], [BB[0] + 0.07, BB[1] - 0.09, 0.06], 0.009, steel, g);
    tube([BB[0], BB[1], -0.06], [BB[0] - 0.07, BB[1] + 0.09, -0.06], 0.009, steel, g);
    box(0.08, 0.02, 0.06, 0x1f2937, g, BB[0] + 0.07, BB[1] - 0.09, 0.1, 0.006);
    box(0.08, 0.02, 0.06, 0x1f2937, g, BB[0] - 0.07, BB[1] + 0.09, -0.1, 0.006);
    // chain guard
    const cg = mesh(roundBox(0.38, 0.06, 0.012, 0.005), frame, g, -0.24, 0.24, 0.07); cg.rotation.z = 0.02;
    // front basket (wicker)
    const wick = tex((c, W, H) => { c.fillStyle = '#c8975a'; c.fillRect(0, 0, W, H); c.strokeStyle = '#8a5a33'; c.lineWidth = 6; for (let y = 8; y < H; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } c.lineWidth = 4; c.strokeStyle = '#a8743f'; for (let x = 10; x < W; x += 24) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } }, 256, 256);
    const wm = new T.MeshStandardMaterial({ map: wick, roughness: 0.9 });
    const bk = new T.Group(); bk.position.set(0.42, 0.74, 0); g.add(bk);
    const BW = 0.22, BH = 0.17, BD = 0.3, t = 0.01;
    mesh(new T.BoxGeometry(BW, t, BD), wm, bk, 0, -BH / 2, 0);
    for (const [w, d, x, z] of [[BW, t, 0, BD / 2], [BW, t, 0, -BD / 2], [t, BD, BW / 2, 0], [t, BD, -BW / 2, 0]]) mesh(new T.BoxGeometry(w, BH, d), wm, bk, x, 0, z);
    for (const z of [-BD / 2, BD / 2]) tube([-BW / 2, BH / 2, z], [BW / 2, BH / 2, z], 0.008, mat(0x8a5a33), bk);
    for (const x of [-BW / 2, BW / 2]) tube([x, BH / 2, -BD / 2], [x, BH / 2, BD / 2], 0.008, mat(0x8a5a33), bk);
    // kickstand
    tube([-0.14, 0.24, 0.06], [-0.24, 0.005, 0.16], 0.008, steel, g);
    return { group: g };
  }

  /* ---------------- school bus ---------------- */
  function schoolBus() {
    const g = new T.Group(), L = 8, W = 2.4, Y0 = 0.5, Y1 = 3.05, H = Y1 - Y0, yellow = 0xfbbf24, brown = '#7c2d12';
    box(L, H, W, yellow, g, 0, Y0 + H / 2, 0, 0.14);
    box(L - 0.4, 0.3, W - 0.2, 0x334155, g, 0, 0.42, 0, 0.03);                                     // under-frame
    const S = 256;
    const side = (nose, door) => tex((c, Wd, Hd) => {
      const X = (xm) => (nose > 0 ? (xm + L / 2) : (L / 2 - xm)) * S, Yp = (ym) => (Y1 - ym) * S;
      const rect = (x0, x1, y0, y1, col, r = 0) => { c.fillStyle = col; const a = Math.min(X(x0), X(x1)), b = Math.abs(X(x1) - X(x0)); c.beginPath(); c.roundRect(a, Yp(y1), b, Yp(y0) - Yp(y1), r); c.fill(); };
      // stripes
      rect(-3.95, 3.95, 1.5, 1.66, brown); rect(-3.95, 3.95, 0.78, 0.9, brown);
      // windows
      const winEnd = door ? 2.3 : 3.0;
      const n = door ? 7 : 8, step = (winEnd - (-3.75)) / n;
      for (let i = 0; i < n; i++) {
        const x0 = -3.75 + i * step + 0.06, x1 = x0 + step - 0.12;
        rect(x0, x1, 1.82, 2.72, '#334155', 18);
        const gr = c.createLinearGradient(0, Yp(2.66), 0, Yp(1.88)); gr.addColorStop(0, '#a5d8ff'); gr.addColorStop(1, '#4b6a8f');
        c.fillStyle = gr; c.beginPath(); c.roundRect(Math.min(X(x0), X(x1)) + 8, Yp(2.66), Math.abs(X(x1) - X(x0)) - 16, Yp(1.88) - Yp(2.66), 12); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); const hx = Math.min(X(x0), X(x1)) + 20; c.moveTo(hx, Yp(2.6)); c.lineTo(hx + 40, Yp(2.6)); c.lineTo(hx + 10, Yp(1.95)); c.lineTo(hx - 10, Yp(1.95)); c.fill();
        rect(x0, x1, 2.2, 2.25, '#94a3b8');   // sliding-window rail
      }
      if (door) {   // folding door near the front
        rect(2.45, 3.2, 0.62, 2.75, '#334155', 14);
        for (const [a, b] of [[2.5, 2.8], [2.85, 3.15]]) { rect(a, b, 1.55, 2.68, '#8fbbe0', 8); rect(a, b, 0.7, 1.45, '#8fbbe0', 8); }
        rect(3.3, 3.9, 1.82, 2.72, '#334155', 18); rect(3.34, 3.86, 1.88, 2.66, '#8fbbe0', 12);
      } else { rect(3.15, 3.9, 1.82, 2.72, '#334155', 18); rect(3.19, 3.86, 1.88, 2.66, '#8fbbe0', 12); }
      // wheel arches
      c.fillStyle = '#3f3a46'; for (const wx of [2.55, -2.35]) { c.beginPath(); c.arc(X(wx), Yp(0.5), 0.66 * S, PI, 0); c.fill(); }
      // lettering
      c.fillStyle = '#1f1a33'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `800 ${0.42 * S}px ${FONT}`; c.fillText('SCHOOL BUS', X(nose > 0 ? -0.2 : -0.2), Yp(1.15));
      c.fillStyle = '#fff7e6'; c.font = `700 ${0.13 * S}px ${FONT}`; c.fillText('ZUNGGA PUBLIC SCHOOL', X(-0.4), Yp(1.58));
      c.fillStyle = brown; c.font = `700 ${0.12 * S}px ${FONT}`; c.fillText('IN CASE OF EMERGENCY  ☎ 1098', X(-0.2), Yp(0.65));
    }, L * S, Math.round(H * S));
    decal(side(1, true), L, H, g, 0, Y0 + H / 2, W / 2 + 0.004);
    face(decal(side(-1, false), L, H, g, 0, Y0 + H / 2, -W / 2 - 0.004), PI);
    // front (+x)
    const fr = new T.Group(); fr.position.set(L / 2, 0, 0); g.add(fr);
    face(mesh(new T.PlaneGeometry(2.0, 1.05), darkGlass(), fr, 0.006, 2.2, 0), PI / 2);
    face(mesh(new T.PlaneGeometry(0.04, 1.05), mat(0x1f2937), fr, 0.008, 2.2, 0), PI / 2);
    face(decal(label('SCHOOL BUS', { w: 1024, h: 200, bg: '#fbbf24', fg: '#1f1a33', size: 150, weight: 800, radius: 30 }), 1.8, 0.35, fr, 0.01, 2.88, 0), PI / 2);
    face(decal(label('ZUNGGA', { w: 512, h: 128, bg: '#7c2d12', fg: '#fff7e6', size: 90, radius: 20 }), 0.7, 0.17, fr, 0.01, 1.38, 0), PI / 2);
    for (const z of [-0.85, 0.85]) {
      const hl = mesh(new T.CylinderGeometry(0.15, 0.15, 0.06, 24).rotateZ(PI / 2), lampM(0xfff7d6, 0.6), fr, 0.02, 1.0, z);
      mesh(new T.TorusGeometry(0.16, 0.025, 8, 24).rotateY(PI / 2), chromeM(), fr, 0.04, 1.0, z);
      box(0.06, 0.1, 0.2, 0xfb923c, fr, 0.02, 1.25, z * 1.12, 0.02).material = lampM(0xfb923c, 0.4);
    }
    box(0.18, 0.28, W + 0.04, 0x1f2937, fr, 0.04, 0.55, 0, 0.05);                              // bumper
    for (let i = 0; i < 4; i++) box(0.03, 0.04, 0.9, 0x94a3b8, fr, 0.01, 0.85 + i * 0.09, 0, 0.01);   // grille
    // rear (-x)
    const rr = new T.Group(); rr.position.set(-L / 2, 0, 0); g.add(rr);
    face(mesh(new T.PlaneGeometry(1.9, 0.8), darkGlass(), rr, -0.006, 2.25, 0), -PI / 2);
    face(decal(label('SCHOOL BUS', { w: 1024, h: 200, bg: '#fbbf24', fg: '#1f1a33', size: 150, weight: 800, radius: 30 }), 1.6, 0.31, rr, -0.01, 1.45, 0), -PI / 2);
    for (const z of [-0.95, 0.95]) box(0.06, 0.3, 0.16, 0xef4444, rr, -0.01, 1.0, z, 0.02).material = lampM(0xef4444, 0.5);
    box(0.18, 0.26, W + 0.04, 0x1f2937, rr, -0.04, 0.55, 0, 0.05);
    // mirrors
    for (const z of [-1, 1]) { tube([L / 2 - 0.05, 2.0, z * 1.18], [L / 2 + 0.25, 2.25, z * 1.42], 0.02, 0x1f2937, g); box(0.06, 0.3, 0.16, 0x1f2937, g, L / 2 + 0.27, 2.1, z * 1.45, 0.02); }
    // roof marker lights + rooftop vent
    for (const z of [-0.7, 0, 0.7]) box(0.08, 0.06, 0.18, 0xfb923c, g, L / 2 - 0.1, Y1 + 0.02, z, 0.02).material = lampM(0xfb923c, 0.5);
    box(0.9, 0.12, 0.8, 0xe5e7eb, g, -1, Y1 + 0.04, 0, 0.04);
    for (const x of [2.55, -2.35]) for (const z of [-1, 1]) wheel(0.5, 0.32, g, x, 0.5, z * 1.08, 0xe5e7eb);
    return { group: g };
  }

  /* ---------------- auto rickshaw ---------------- */
  function autoRickshaw() {
    const g = new T.Group(), green = 0x16a34a, yellow = 0xfacc15, blk = mat(0x1f2937);
    // lower tub (side profile)
    profile([[-1.1, 0.32], [0.55, 0.32], [0.95, 0.42], [1.05, 0.62], [1.02, 0.95], [0.9, 1.0], [0.62, 0.72], [-0.75, 0.72], [-1.12, 0.62]], 1.32, 0.05, green, g);
    box(1.9, 0.06, 1.24, 0x14532d, g, -0.15, 0.3, 0, 0.02);
    // nose cowl + front fender
    const nose = mesh(roundBox(0.4, 0.66, 0.5, 0.15), mat(green), g, 0.92, 0.75, 0); nose.rotation.z = -0.15;
    const fend = mesh(new T.TorusGeometry(0.24, 0.05, 8, 20, PI), mat(green), g, 1.18, 0.24, 0); fend.scale.z = 1.4;
    tube([1.0, 0.95, 0], [1.18, 0.24, 0], 0.03, chromeM(), g);
    mesh(new T.CylinderGeometry(0.085, 0.085, 0.06, 20).rotateZ(PI / 2), lampM(0xfff7d6, 0.7), g, 1.14, 0.78, 0);
    mesh(new T.TorusGeometry(0.09, 0.015, 8, 20).rotateY(PI / 2), chromeM(), g, 1.17, 0.78, 0);
    for (const z of [-0.18, 0.18]) sphere(0.035, 0xfb923c, g, 1.08, 0.94, z).material = lampM(0xfb923c, 0.4);
    // windscreen + frame
    const ws = mesh(new T.BoxGeometry(0.03, 0.6, 1.1), glassMat({ opacity: 0.35 }), g, 0.82, 1.32, 0); ws.rotation.z = 0.12;
    for (const z of [-0.58, 0.58]) tube([0.86, 0.98, z], [0.78, 1.66, z], 0.022, blk, g);
    tube([0.86, 1.0, -0.58], [0.86, 1.0, 0.58], 0.02, blk, g);
    // canopy (yellow roof sweeping down to the back)
    box(1.95, 0.08, 1.38, yellow, g, -0.18, 1.7, 0, 0.035);
    const back = mesh(roundBox(0.08, 0.95, 1.38, 0.035), mat(yellow), g, -1.15, 1.25, 0); back.rotation.z = -0.22;
    const lip = mesh(roundBox(0.3, 0.08, 1.38, 0.035), mat(yellow), g, -1.08, 1.68, 0); lip.rotation.z = 0.3;
    box(1.95, 0.08, 1.4, 0x111827, g, -0.18, 1.62, 0, 0.02);                                     // canopy frame
    for (const z of [-0.66, 0.66]) { tube([-0.2, 0.72, z], [-0.2, 1.64, z], 0.02, blk, g); tube([-1.0, 0.72, z], [-1.25, 1.62, z], 0.02, blk, g); }
    // rear seat + backrest, driver seat, handlebar
    box(0.5, 0.1, 1.2, 0x111827, g, -0.7, 0.82, 0, 0.04); box(0.12, 0.45, 1.2, 0x111827, g, -0.98, 1.05, 0, 0.04);
    box(0.36, 0.08, 0.4, 0x111827, g, 0.2, 0.86, 0, 0.03);
    tube([0.75, 0.98, 0], [0.62, 1.08, 0], 0.02, chromeM(), g); tube([0.6, 1.1, -0.3], [0.6, 1.1, 0.3], 0.016, chromeM(), g);
    // side lettering + checker band
    const sideT = tex((c, W, H) => { c.fillStyle = '#facc15'; c.fillRect(0, 0, W, H); c.fillStyle = '#1f1a33'; for (let i = 0; i < W / 32; i++) c.fillRect(i * 32, (i % 2) * 16, 16, 16); c.fillRect(0, 32, W, 4); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `800 52px ${FONT}`; c.fillText('ZUNGGA AUTO', W / 2, 72); }, 512, 104);
    decal(sideT, 0.95, 0.19, g, -0.25, 0.53, 0.661);
    face(decal(sideT, 0.95, 0.19, g, -0.25, 0.53, -0.661), PI);
    // mirrors
    for (const z of [-0.62, 0.62]) { tube([0.82, 1.2, z], [0.9, 1.32, z * 1.08], 0.01, blk, g); sphere(0.05, 0x1f2937, g, 0.9, 1.34, z * 1.08).scale.x = 0.4; }
    wheel(0.22, 0.14, g, 1.18, 0.22, 0, 0x16a34a);
    for (const z of [-0.6, 0.6]) wheel(0.22, 0.14, g, -0.7, 0.22, z, 0x16a34a);
    return { group: g };
  }

  /* ---------------- car (hatchback) ---------------- */
  function car() {
    const g = new T.Group(), b = 0.06, W = 1.6, body = mat(0xef4444, { roughness: 0.3, metalness: 0.25 });
    const pts = [[-1.72, 0.3], [-1.74, 0.92], [-1.62, 1.32], [-1.4, 1.42], [0.2, 1.42], [0.88, 0.96], [1.66, 0.82], [1.76, 0.62], [1.74, 0.3]];
    profile(pts, W, b, body, g);
    // side windows (dark glass slab slightly wider than the body)
    const win = [[-1.6, 0.98], [-1.52, 1.27], [-1.34, 1.35], [0.15, 1.35], [0.74, 0.98]];
    profile(win, W + 0.005, 0.0, darkGlass(), g);
    profile([[-0.42, 0.97], [-0.42, 1.36], [-0.32, 1.36], [-0.32, 0.97]], W + 0.012, 0.0, body, g);    // B-pillar
    // windscreen + rear glass (narrower slab, poking out along the slopes)
    profile([[-1.7, 0.98], [-1.6, 1.36], [-1.38, 1.44], [0.22, 1.44], [0.92, 0.99]], W * 0.82, 0.0, darkGlass(), g);
    box(1.4, 0.07, W * 0.9, 0xef4444, g, -0.6, 1.47, 0, 0.03).material = body;                      // roof cap
    // bumpers, lamps, grille, handles, mirrors
    box(0.16, 0.2, W + 0.04, 0x334155, g, 1.76, 0.4, 0, 0.06); box(0.16, 0.2, W + 0.04, 0x334155, g, -1.74, 0.4, 0, 0.06);
    for (const z of [-0.55, 0.55]) {
      const hl = mesh(roundBox(0.06, 0.12, 0.3, 0.03), lampM(0xfff7d6, 0.6), g, 1.77, 0.72, z); hl.rotation.z = -0.3;
      box(0.05, 0.16, 0.22, 0xdc2626, g, -1.79, 0.95, z * 1.1, 0.02).material = lampM(0xdc2626, 0.5);
      tube([0.62, 1.0, z * 1.47], [0.7, 1.06, z * 1.62], 0.02, 0x334155, g);
      box(0.06, 0.12, 0.16, 0xef4444, g, 0.7, 1.08, z * 1.65, 0.02).material = body;
    }
    box(0.04, 0.16, 0.6, 0x1f2937, g, 1.78, 0.56, 0, 0.02);
    face(decal(label('ZG 07', { w: 256, h: 80, bg: '#ffffff', fg: '#1f1a33', size: 56, radius: 8 }), 0.34, 0.1, g, 1.85, 0.42, 0), PI / 2);
    face(decal(label('ZG 07', { w: 256, h: 80, bg: '#ffffff', fg: '#1f1a33', size: 56, radius: 8 }), 0.34, 0.1, g, -1.83, 0.42, 0), -PI / 2);
    for (const z of [-1, 1]) for (const x of [-0.75, 0.2]) box(0.16, 0.03, 0.03, 0x1f2937, g, x, 0.9, z * (W / 2 + 0.01), 0.01);
    for (const x of [-1.15, 1.15]) for (const z of [-1, 1]) wheel(0.3, 0.2, g, x, 0.3, z * 0.72);
    return { group: g };
  }

  /* ---------------- scooter (scooty) ---------------- */
  function scooter() {
    const g = new T.Group(), teal = mat(0x14b8a6, { roughness: 0.3, metalness: 0.2 }), blk = mat(0x1f2937);
    // body side profile: leg-shield, floorboard, rear body over the back wheel
    profile([[0.36, 0.26], [0.55, 0.98], [0.44, 1.02], [0.28, 0.42], [-0.12, 0.42], [-0.18, 0.66], [-0.8, 0.74], [-0.94, 0.58], [-0.88, 0.44], [-0.36, 0.44], [-0.3, 0.26]], 0.42, 0.06, teal, g);
    box(0.62, 0.05, 0.36, 0x334155, g, 0.03, 0.43, 0, 0.015);                                       // floor mat
    // seat
    const st = mesh(roundBox(0.62, 0.1, 0.32, 0.045), blk, g, -0.5, 0.79, 0); st.rotation.z = 0.04;
    // steering column, handlebar cowl, headlamp, mirrors
    tube([0.5, 1.0, 0], [0.66, 0.22, 0], 0.03, chromeM(), g);
    const hb = mesh(roundBox(0.18, 0.12, 0.5, 0.05), teal, g, 0.52, 1.08, 0); hb.rotation.z = -0.25;
    for (const z of [-0.29, 0.29]) tube([0.5, 1.09, z], [0.5, 1.09, z * 1.3], 0.018, blk, g);
    mesh(new T.CylinderGeometry(0.06, 0.06, 0.05, 20).rotateZ(PI / 2), lampM(0xfff7d6, 0.7), g, 0.62, 1.07, 0);
    for (const z of [-0.18, 0.18]) { tube([0.48, 1.13, z], [0.44, 1.3, z * 1.25], 0.008, chromeM(), g); sphere(0.04, 0x1f2937, g, 0.44, 1.32, z * 1.25).scale.x = 0.4; }
    // front fender + wheels
    const ff = mesh(new T.TorusGeometry(0.22, 0.045, 8, 20, PI * 0.8), teal, g, 0.66, 0.2, 0); ff.rotation.z = 0.2; ff.scale.z = 1.4;
    wheel(0.2, 0.1, g, 0.66, 0.2, 0, 0x94a3b8); wheel(0.2, 0.1, g, -0.6, 0.2, 0, 0x94a3b8);
    // tail lamp, grab rail, footrest stand
    box(0.05, 0.06, 0.16, 0xef4444, g, -0.94, 0.63, 0, 0.02).material = lampM(0xef4444, 0.5);
    tube([-0.85, 0.82, -0.14], [-0.85, 0.82, 0.14], 0.012, chromeM(), g);
    tube([-0.25, 0.3, 0.12], [-0.4, 0.01, 0.2], 0.01, chromeM(), g);
    // side badge
    const bt = label('ZUNGGA', { w: 512, h: 128, bg: 'rgba(0,0,0,0)', fg: '#ffffff', size: 96, weight: 800 });
    decal(bt, 0.26, 0.065, g, -0.5, 0.6, 0.212); face(decal(bt, 0.26, 0.065, g, -0.5, 0.6, -0.212), PI);
    return { group: g };
  }

  /* ---------------- bus stop ---------------- */
  function busStop() {
    const g = new T.Group(), W = 3.2, D = 1.5, H = 2.5, steel = mat(0x475569, { metalness: 0.5, roughness: 0.4 });
    box(W + 0.3, 0.15, D + 0.3, 0xcbd5e1, g, 0, 0.075, 0, 0.02);                                    // raised platform
    for (const x of [-W / 2 + 0.1, W / 2 - 0.1]) for (const z of [-D / 2 + 0.1, D / 2 - 0.15]) box(0.08, H - 0.15, 0.08, 0x475569, g, x, 0.15 + (H - 0.15) / 2, z, 0.02).material = steel;
    const roof = mesh(roundBox(W + 0.4, 0.1, D + 0.4, 0.04), mat(Z.purple), g, 0, H + 0.05, 0.05); roof.rotation.x = 0.06;
    const fasc = label('BUS STOP', { w: 1024, h: 128, bg: '#7c3aed', fg: '#ffffff', size: 92, weight: 800 });
    decal(fasc, W, 0.38 * 0, g, 0, 0, 0).visible = false;
    box(W + 0.42, 0.26, 0.06, Z.purple, g, 0, H - 0.04, D / 2 + 0.26, 0.02);
    decal(fasc, 1.9, 0.22, g, 0, H - 0.04, D / 2 + 0.295);
    // back wall: ad panel with the Zungga logo + route map
    box(W - 0.2, 1.7, 0.05, 0xf8fafc, g, 0, 1.2, -D / 2 + 0.1, 0.01);
    const ad = tex((c, Wd, Hd) => {
      const gr = c.createLinearGradient(0, 0, Wd, Hd); gr.addColorStop(0, '#ede9fe'); gr.addColorStop(1, '#fce7f3'); c.fillStyle = gr; c.fillRect(0, 0, Wd, Hd);
      c.fillStyle = '#1f1a33'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = `700 60px ${FONT}`; c.fillText('Save a little,', Wd * 0.48, Hd * 0.35); c.fillText('every day!', Wd * 0.48, Hd * 0.52);
      c.fillStyle = '#7c3aed'; c.beginPath(); c.roundRect(Wd * 0.48, Hd * 0.66, 300, 70, 35); c.fill(); c.fillStyle = '#fff'; c.font = `700 40px ${FONT}`; c.fillText('ZUNGGA', Wd * 0.48 + 60, Hd * 0.66 + 37);
    }, 1024, 640);
    mesh(new T.PlaneGeometry(1.5, 0.94), new T.MeshStandardMaterial({ map: ad, emissive: 0xffffff, emissiveMap: ad, emissiveIntensity: 0.25 }), g, -0.65, 1.3, -D / 2 + 0.13);
    decal(logoTex(), 0.55, 0.45, g, -1.03, 1.3, -D / 2 + 0.14);
    const route = tex((c, Wd, Hd) => {
      c.fillStyle = '#fff7e6'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#1f1a33'; c.font = `700 44px ${FONT}`; c.textAlign = 'center'; c.fillText('ROUTES', Wd / 2, 60);
      const stops = ['Market', 'School', 'Bank', 'Park', 'Station'];
      c.strokeStyle = '#ec4899'; c.lineWidth = 12; c.beginPath(); c.moveTo(80, 110); c.lineTo(80, 110 + 90 * 4); c.stroke();
      stops.forEach((s, i) => { c.fillStyle = '#ffffff'; c.strokeStyle = '#ec4899'; c.lineWidth = 8; c.beginPath(); c.arc(80, 110 + i * 90, 18, 0, PI * 2); c.fill(); c.stroke(); c.fillStyle = '#1f1a33'; c.textAlign = 'left'; c.font = `600 36px ${FONT}`; c.fillText(s, 120, 122 + i * 90); });
    }, 400, 520);
    mesh(new T.PlaneGeometry(0.62, 0.8), new T.MeshStandardMaterial({ map: route }), g, 0.85, 1.3, -D / 2 + 0.13);
    // side glass panel
    mesh(new T.BoxGeometry(0.03, 1.5, D - 0.3), glassMat(), g, W / 2 - 0.1, 1.15, 0);
    // bench
    box(W - 0.6, 0.06, 0.42, 0x94a3b8, g, 0, 0.6, -D / 2 + 0.4, 0.02).material = mat(0xd9dee5, { metalness: 0.6, roughness: 0.35 });
    for (const x of [-1.1, 0, 1.1]) box(0.05, 0.45, 0.3, 0x475569, g, x, 0.37, -D / 2 + 0.4, 0.01).material = steel;
    // sign pole with round bus sign
    const px = W / 2 + 0.55;
    cyl(0.04, 0.04, 2.7, 0x475569, g, px, 1.35, D / 2, 16).material = steel;
    const sign = tex((c, Wd, Hd) => {
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(Wd / 2, Hd / 2, Wd / 2 - 4, 0, PI * 2); c.fill();
      c.strokeStyle = '#2563eb'; c.lineWidth = 36; c.beginPath(); c.arc(Wd / 2, Hd / 2, Wd / 2 - 22, 0, PI * 2); c.stroke();
      c.fillStyle = '#2563eb'; c.beginPath(); c.roundRect(Wd * 0.28, Hd * 0.22, Wd * 0.44, Hd * 0.34, 20); c.fill();     // bus icon
      c.fillStyle = '#fff'; c.fillRect(Wd * 0.32, Hd * 0.27, Wd * 0.16, Hd * 0.1); c.fillRect(Wd * 0.52, Hd * 0.27, Wd * 0.16, Hd * 0.1);
      c.fillStyle = '#1f1a33'; for (const x of [0.36, 0.64]) { c.beginPath(); c.arc(Wd * x, Hd * 0.57, 22, 0, PI * 2); c.fill(); }
      c.fillStyle = '#1f1a33'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'BUS STOP', Wd * 0.62, 96, 800); c.fillText('BUS STOP', Wd / 2, Hd * 0.74);
    }, 512, 512);
    const sm = new T.MeshStandardMaterial({ map: sign, roughness: 0.5 });
    mesh(new T.CylinderGeometry(0.33, 0.33, 0.03, 40).rotateX(PI / 2), [mat(0x2563eb), sm, mat(0xf8fafc)], g, px, 2.45, D / 2);
    return { group: g };
  }

  /* ---------------- traffic light ---------------- */
  function trafficLight() {
    const g = new T.Group(), steel = mat(0x374151, { metalness: 0.5, roughness: 0.45 });
    cyl(0.18, 0.22, 0.12, 0x374151, g, 0, 0.06, 0, 24).material = steel;
    const pole = tex((c, W, H) => { for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#111827' : '#facc15'; c.fillRect(0, i * H / 12, W, H / 12); } }, 64, 512);
    mesh(new T.CylinderGeometry(0.06, 0.06, 1.0, 20), new T.MeshStandardMaterial({ map: pole, roughness: 0.5 }), g, 0, 0.6, 0);
    cyl(0.055, 0.055, 1.6, 0x374151, g, 0, 1.9, 0, 20).material = steel;
    const hd = new T.Group(); hd.position.set(0, 3.15, 0); g.add(hd);
    box(0.36, 1.0, 0.28, 0x111827, hd, 0, 0, 0, 0.06);
    box(0.5, 1.14, 0.03, 0xfacc15, hd, 0, 0, -0.15, 0.015);                                       // yellow backboard
    const cols = [0xef4444, 0xf59e0b, 0x22c55e], lamps = [];
    cols.forEach((c, i) => {
      const y = 0.3 - i * 0.3;
      const visor = mesh(new T.CylinderGeometry(0.135, 0.135, 0.16, 24, 1, true, -PI / 2, PI).rotateX(PI / 2), mat(0x111827, { side: T.DoubleSide }), hd, 0, y, 0.2);
      visor.rotation.z = PI / 2 * 0 ; visor.geometry.rotateZ(PI / 2);
      const m = new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0, roughness: 0.25 });
      const l = mesh(new T.SphereGeometry(0.11, 24, 16, 0, PI * 2, 0, PI / 2).rotateX(PI / 2), m, hd, 0, y, 0.13); l.scale.z = 0.4;
      lamps.push(m);
    });
    const halo = [];
    cols.forEach((c, i) => { const h = mesh(new T.CircleGeometry(0.2, 32), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.35, depthWrite: false }), hd, 0, 0.3 - i * 0.3, 0.19); h.castShadow = false; halo.push(h); });
    const set = (green) => lamps.forEach((m, i) => {
      const on = green ? i === 2 : i === 0;
      m.emissiveIntensity = on ? 2.2 : 0; m.color.setHex(on ? cols[i] : new T.Color(cols[i]).multiplyScalar(0.25).getHex()); halo[i].visible = on;
    });
    set(false);
    g.userData.setOn = (on) => set(!!on);
    return { group: g };
  }

  /* ---------------- train (engine + 1 coach) on a short track ---------------- */
  function train() {
    const g = new T.Group(), S = 128, Y0 = 1.25, Y1 = 4.15, H = Y1 - Y0, W = 3.1;
    // track: ballast, sleepers (instanced), broad-gauge rails
    const len = 22;
    const ballast = mesh(new T.BoxGeometry(len, 0.12, 3.0), mat(0x8b8178, { roughness: 1 }), g, 0, 0.06, 0);
    const n = Math.floor(len / 0.6), sl = new T.InstancedMesh(roundBox(0.24, 0.1, 2.6, 0.02), mat(0xa8a29e), n); sl.castShadow = sl.receiveShadow = true;
    const m4 = new T.Matrix4(); for (let i = 0; i < n; i++) { m4.makeTranslation(-len / 2 + 0.3 + i * 0.6, 0.17, 0); sl.setMatrixAt(i, m4); } g.add(sl);
    for (const z of [-0.84, 0.84]) mesh(new T.BoxGeometry(len, 0.14, 0.08), mat(0x9ca3af, { metalness: 0.8, roughness: 0.3 }), g, 0, 0.29, z);
    const bogie = (parent, x) => {
      box(2.6, 0.35, 2.4, 0x1f2937, parent, x, 0.95, 0, 0.04);
      for (const ax of [-0.85, 0.85]) for (const z of [-0.84, 0.84]) {
        const w = mesh(new T.CylinderGeometry(0.46, 0.46, 0.14, 24).rotateX(PI / 2), mat(0x334155, { metalness: 0.5 }), parent, x + ax, 0.82, z * 1.0);
        mesh(new T.CylinderGeometry(0.2, 0.2, 0.16, 16).rotateX(PI / 2), mat(0xef4444), parent, x + ax, 0.82, z);
      }
      for (const z of [-1.25, 1.25]) box(2.2, 0.12, 0.08, 0xfacc15, parent, x, 0.95, z, 0.02);
    };
    const sideTex = (L, draw) => tex((c, Wd, Hd) => draw(c, Wd, Hd, (xm) => (xm + L / 2) * S, (ym) => (Y1 - ym) * S), L * S, Math.round(H * S));
    const win = (c, x, y, w, h, col = '#2b3a55') => { c.fillStyle = col; c.beginPath(); c.roundRect(x, y, w, h, 10); c.fill(); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x + 6, y + 6, w * 0.25, h - 12); };
    // ENGINE (+x end), red with a cream band
    const eL = 7.6, ex = 6.3, eng = new T.Group(); eng.position.x = ex; g.add(eng);
    box(eL, H, W, 0xc62828, eng, 0, Y0 + H / 2, 0, 0.22);
    box(eL - 0.6, 0.25, W - 0.6, 0x6b7280, eng, 0, Y1 + 0.08, 0, 0.08);                               // roof equipment deck
    const eSide = sideTex(eL, (c, Wd, Hd, X, Yp) => {
      c.fillStyle = '#fff1d6'; c.fillRect(0, Yp(2.15), Wd, Yp(1.75) - Yp(2.15));
      c.fillStyle = '#1f1a33'; c.fillRect(0, Yp(1.55), Wd, 8);
      win(c, X(eL / 2 - 1.05), Yp(3.75), 0.75 * S, 0.85 * S); win(c, X(-eL / 2 + 0.3), Yp(3.75), 0.75 * S, 0.85 * S);
      c.strokeStyle = '#8b1a1a'; c.lineWidth = 3; for (let i = 0; i < 14; i++) { const x = X(-2.4 + i * 0.35); c.beginPath(); c.moveTo(x, Yp(3.7)); c.lineTo(x, Yp(2.4)); c.stroke(); }   // louvres
      c.fillStyle = '#c62828'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `800 ${0.3 * S}px ${FONT}`; c.fillText('ZUNGGA RAIL  ·  ZR 2026', Wd / 2, Yp(1.95));
    });
    decal(eSide, eL, H, eng, 0, Y0 + H / 2, W / 2 + 0.004); face(decal(eSide, eL, H, eng, 0, Y0 + H / 2, -W / 2 - 0.004), PI);
    // cab face (+x)
    const cab = new T.Group(); cab.position.x = eL / 2; eng.add(cab);
    for (const z of [-0.68, 0.68]) face(mesh(new T.PlaneGeometry(1.15, 0.9), darkGlass(), cab, 0.006, 3.35, z), PI / 2);
    face(mesh(new T.PlaneGeometry(W - 0.4, 0.4), mat(0xfff1d6), cab, 0.005, 1.95, 0), PI / 2);
    mesh(new T.CylinderGeometry(0.16, 0.16, 0.12, 20).rotateZ(PI / 2), lampM(0xfff7d6, 1.0), cab, 0.05, 4.0, 0);
    for (const z of [-1.1, 1.1]) mesh(new T.CylinderGeometry(0.1, 0.1, 0.08, 16).rotateZ(PI / 2), lampM(0xfff7d6, 0.7), cab, 0.04, 1.6, z);
    box(0.25, 0.4, W + 0.1, 0x1f2937, cab, 0.08, 1.15, 0, 0.04);                                   // buffer beam
    const cow = mesh(new T.BoxGeometry(0.5, 0.4, W - 0.2), mat(0xfacc15), cab, 0.25, 0.65, 0); cow.rotation.z = -0.5;   // cow-catcher
    // pantograph
    const pg = new T.Group(); pg.position.set(-1.5, Y1 + 0.2, 0); eng.add(pg);
    tube([-0.6, 0, -0.5], [0.2, 0.6, -0.5], 0.03, 0x334155, pg); tube([-0.6, 0, 0.5], [0.2, 0.6, 0.5], 0.03, 0x334155, pg);
    tube([0.2, 0.6, -0.5], [-0.3, 1.0, -0.5], 0.03, 0x334155, pg); tube([0.2, 0.6, 0.5], [-0.3, 1.0, 0.5], 0.03, 0x334155, pg);
    tube([-0.3, 1.0, -0.8], [-0.3, 1.0, 0.8], 0.035, 0x94a3b8, pg);
    bogie(eng, -2.2); bogie(eng, 2.2);
    // COACH (behind, -x), blue with a cream window band
    const cL = 12.2, cx = -4.0, co = new T.Group(); co.position.x = cx; g.add(co);
    box(cL, H, W, 0x1e4fa1, co, 0, Y0 + H / 2, 0, 0.22);
    const roofC = mesh(new T.CylinderGeometry(W / 2 - 0.05, W / 2 - 0.05, cL - 0.3, 24, 1, false, 0, PI).rotateZ(PI / 2).rotateX(-PI / 2), mat(0x94a3b8), co, 0, Y1 - 0.12, 0); roofC.scale.set(1, 0.18, 1);
    const cSide = sideTex(cL, (c, Wd, Hd, X, Yp) => {
      c.fillStyle = '#fff1d6'; c.fillRect(0, Yp(3.55), Wd, Yp(2.25) - Yp(3.55));
      c.fillStyle = '#fbbf24'; c.fillRect(0, Yp(2.15), Wd, 10); c.fillRect(0, Yp(1.55), Wd, 10);
      for (const dx of [-cL / 2 + 0.25, cL / 2 - 1.15]) { c.fillStyle = '#163c7c'; c.beginPath(); c.roundRect(X(dx), Yp(3.6), 0.9 * S, 2.3 * S, 10); c.fill(); win(c, X(dx) + 18, Yp(3.4), 0.9 * S - 36, 0.7 * S); }
      for (let i = 0; i < 9; i++) {
        const x = X(-cL / 2 + 1.5 + i * 1.03); win(c, x, Yp(3.4), 0.8 * S, 0.95 * S);
        c.strokeStyle = '#d1d5db'; c.lineWidth = 3; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(x, Yp(3.4) + k * 0.95 * S / 5); c.lineTo(x + 0.8 * S, Yp(3.4) + k * 0.95 * S / 5); c.stroke(); }   // window bars
      }
      c.fillStyle = '#fff1d6'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `800 ${0.28 * S}px ${FONT}`; c.fillText('ZUNGGA EXPRESS', Wd / 2, Yp(1.85));
      c.font = `700 ${0.2 * S}px ${FONT}`; c.fillText('S3  ·  SLEEPER', Wd / 2, Yp(1.45));
    });
    decal(cSide, cL, H, co, 0, Y0 + H / 2, W / 2 + 0.004); face(decal(cSide, cL, H, co, 0, Y0 + H / 2, -W / 2 - 0.004), PI);
    box(0.6, 2.4, 1.2, 0x1f2937, g, (ex - eL / 2 + cx + cL / 2) / 2, Y0 + 1.3, 0, 0.05);           // gangway bellows
    for (const x of [-cL / 2 + 2.2, cL / 2 - 2.2]) bogie(co, x);
    face(mesh(new T.PlaneGeometry(1.0, 0.8), darkGlass(), co, -cL / 2 - 0.006, 3.0, 0), -PI / 2);
    for (const z of [-1.1, 1.1]) box(0.05, 0.2, 0.2, 0xef4444, co, -cL / 2 - 0.01, 1.7, z, 0.02).material = lampM(0xef4444, 0.6);
    return { group: g };
  }

  /* ---------------- aeroplane (origin at its centre) ---------------- */
  function aeroplane() {
    const g = new T.Group(), Lh = 5;
    const rad = (y) => { const u = (y + Lh) / (2 * Lh); if (u < 0.22) return 0.12 + 0.43 * Math.sin((u / 0.22) * PI / 2); if (u > 0.86) return 0.55 * Math.sqrt(Math.max(0, 1 - ((u - 0.86) / 0.14) ** 2)); return 0.55; };
    const pts = []; for (let i = 0; i <= 48; i++) { const y = -Lh + (2 * Lh * i) / 48; pts.push(new T.Vector2(Math.max(rad(y), i === 48 ? 0 : 0.001), y)); }
    const skin = tex((c, W, H) => {
      c.fillStyle = '#f8fafc'; c.fillRect(0, 0, W, H);
      const V = (v) => (1 - v) * H, U = (u) => u * W;
      c.fillStyle = '#7c3aed'; c.fillRect(U(0.68), 0, U(0.14), H); c.fillStyle = '#ec4899'; c.fillRect(U(0.645), 0, U(0.03), H); c.fillRect(U(0.825), 0, U(0.03), H);   // belly stripe
      c.fillStyle = '#7c3aed'; c.fillRect(U(0.15), V(0.12), U(0.2), V(0) - V(0.12));                // purple tail cone top
      // window rows: +z side is u = 0.5, -z side wraps at u = 0/1
      c.fillStyle = '#1e293b';
      for (let v = 0.22; v < 0.84; v += 0.026) for (const u of [0.43, 0.07, 1.07, -0.07 + 1]) { c.beginPath(); c.ellipse(U(u === 1.07 ? 0.07 - 0 : u) , V(v), 7, 10, 0, 0, PI * 2); c.fill(); }
      for (let v = 0.22; v < 0.84; v += 0.026) for (const u of [0.07 - 0.14 + 1]) { c.beginPath(); c.ellipse(U(u), V(v), 7, 10, 0, 0, PI * 2); c.fill(); }
      // doors
      c.strokeStyle = '#94a3b8'; c.lineWidth = 4; for (const v of [0.84, 0.2]) { c.strokeRect(U(0.39), V(v + 0.025), U(0.09), V(v) - V(v + 0.025)); }
      // cockpit windscreen around the top-front
      c.fillStyle = '#1e293b'; c.beginPath(); c.roundRect(U(0.3), V(0.925), U(0.4) - U(0.3) + U(0.0), V(0.9) - V(0.925), 6); c.fill();
      c.beginPath(); c.roundRect(U(0.17), V(0.925), U(0.12), V(0.9) - V(0.925), 6); c.fill();
      // name, reading tail → nose on the +z side
      c.save(); c.translate(U(0.38), V(0.52)); c.rotate(-PI / 2); c.fillStyle = '#7c3aed'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `800 ${H * 0.045}px ${FONT}`; c.fillText('ZUNGGA AIR', 0, 0); c.restore();
    }, 512, 1536);
    const lath = new T.LatheGeometry(pts, 40, -PI, PI * 2); lath.rotateZ(-PI / 2);
    mesh(lath, new T.MeshStandardMaterial({ map: skin, roughness: 0.4, metalness: 0.1 }), g);
    const white = mat(0xf1f5f9, { roughness: 0.4 }), purple = mat(Z.purple, { roughness: 0.4 });
    const flat = (pts2, depth, m, y = 0) => { const s = new T.Shape(); pts2.forEach(([x, z], i) => (i ? s.lineTo(x, z) : s.moveTo(x, z))); s.closePath(); const geo = new T.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 }); geo.rotateX(PI / 2); geo.translate(0, y + depth / 2, 0); return mesh(geo, m, g); };
    // main wing (low, swept) + tailplane
    flat([[1.1, 0.4], [-1.3, 5.0], [-2.0, 5.0], [-0.9, 0.4], [-0.9, -0.4], [-2.0, -5.0], [-1.3, -5.0], [1.1, -0.4]], 0.1, white, -0.28);
    flat([[-3.7, 0.2], [-4.5, 1.8], [-4.95, 1.8], [-4.6, 0.2], [-4.6, -0.2], [-4.95, -1.8], [-4.5, -1.8], [-3.7, -0.2]], 0.07, white, 0.12);
    for (const z of [-1, 1]) { const wl = box(0.6, 0.45, 0.06, Z.purple, g, -1.75, -0.05, z * 5.02, 0.02); wl.material = purple; wl.rotation.z = 0.35; }
    // tail fin (purple) with the logo
    const fs = new T.Shape(); [[-3.3, 0.3], [-4.55, 2.2], [-5.15, 2.2], [-4.95, 0.3]].forEach(([x, y], i) => (i ? fs.lineTo(x, y) : fs.moveTo(x, y))); fs.closePath();
    const fg = new T.ExtrudeGeometry(fs, { depth: 0.06, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 }); fg.translate(0, 0, -0.03);
    mesh(fg, purple, g);
    decal(logoTex(), 0.95, 0.78, g, -4.5, 1.3, 0.075); face(decal(logoTex(), 0.95, 0.78, g, -4.5, 1.3, -0.075), PI);
    // engines with spinning fans
    const fans = [];
    for (const z of [-1.9, 1.9]) {
      const e = new T.Group(); e.position.set(0.2, -0.62, z); g.add(e);
      mesh(new T.CylinderGeometry(0.3, 0.24, 1.2, 28, 1, true).rotateZ(-PI / 2), new T.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.3, side: T.DoubleSide }), e);
      mesh(new T.TorusGeometry(0.3, 0.04, 10, 28).rotateY(PI / 2), purple, e, 0.6, 0, 0);
      mesh(new T.CylinderGeometry(0.26, 0.26, 0.02, 24).rotateZ(PI / 2), mat(0x1e293b), e, 0.4, 0, 0);
      const fan = new T.Group(); fan.position.x = 0.45; e.add(fan); fans.push(fan);
      mesh(new T.ConeGeometry(0.09, 0.18, 16).rotateZ(-PI / 2), mat(0xf8fafc, { metalness: 0.6, roughness: 0.3 }), fan, 0.06, 0, 0);
      for (let i = 0; i < 8; i++) { const b = mesh(new T.BoxGeometry(0.02, 0.24, 0.07), mat(0x94a3b8, { metalness: 0.6 }), fan, 0, 0, 0); b.geometry.translate(0, 0.13, 0); b.rotation.x = (i * PI) / 4; }
      box(0.7, 0.3, 0.1, 0xe2e8f0, g, 0.0, -0.38, z, 0.03);                                        // pylon
    }
    g.userData.tick = (t) => { for (const f of fans) f.rotation.x = t * 18; };
    return { group: g };
  }

  /* ---------------- road crossing (6 m tileable strip) ---------------- */
  function roadCrossing() {
    const g = new T.Group(), L = 6, RW = 6.4, FP = 1.0, KH = 0.15;
    const road = tex((c, W, H) => {
      const ppm = W / L, Zp = (zm) => (RW / 2 - zm) * ppm, Xp = (xm) => (xm + L / 2) * ppm;
      c.fillStyle = '#4b4f58'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 1800; i++) { const s = (i * 7919) % 9973; c.fillStyle = `rgba(255,255,255,${0.03 + (s % 5) * 0.01})`; c.fillRect((s * 13) % W, (s * 29 + i) % H, 3, 3); }   // asphalt grain
      c.fillStyle = '#f8fafc';
      // zebra stripes: long along x, repeating across the road
      for (let zm = -RW / 2 + 0.4; zm < RW / 2 - 0.4; zm += 1.0) c.fillRect(Xp(-1.3), Zp(zm + 0.5), 2.6 * ppm, 0.5 * ppm);
      // stop lines
      c.fillRect(Xp(-2.0), Zp(0), 0.25 * ppm, (RW / 2) * ppm); c.fillRect(Xp(1.75), Zp(RW / 2), 0.25 * ppm, (RW / 2) * ppm);
      // dashed centre line + yellow edge lines
      for (const [a, b] of [[-3, -2.4], [2.4, 3]]) c.fillRect(Xp(a), Zp(0.06), (b - a) * ppm, 0.12 * ppm);
      c.fillStyle = '#facc15'; c.fillRect(0, Zp(RW / 2 - 0.15), W, 0.1 * ppm); c.fillRect(0, Zp(-RW / 2 + 0.25), W, 0.1 * ppm);
      // lane arrows
      c.fillStyle = 'rgba(248,250,252,0.9)';
      const arrow = (x, z, dir) => { c.save(); c.translate(Xp(x), Zp(z)); c.scale(dir, 1); c.beginPath(); c.moveTo(0.6 * ppm, 0); c.lineTo(0.1 * ppm, -0.3 * ppm); c.lineTo(0.1 * ppm, -0.12 * ppm); c.lineTo(-0.5 * ppm, -0.12 * ppm); c.lineTo(-0.5 * ppm, 0.12 * ppm); c.lineTo(0.1 * ppm, 0.12 * ppm); c.lineTo(0.1 * ppm, 0.3 * ppm); c.fill(); c.restore(); };
      arrow(-2.6, -1.6, 1); arrow(2.6, 1.6, -1);
    }, 1200, 1280);
    const rd = mesh(new T.PlaneGeometry(L, RW), new T.MeshStandardMaterial({ map: road, roughness: 0.92 }), g, 0, 0.004, 0); rd.rotation.x = -PI / 2;
    const kerbT = tex((c, W, H) => { const n = 12; for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? '#111827' : '#facc15'; c.fillRect(i * W / n, 0, W / n, H); } }, 512, 32);
    const tiles = tex((c, W, H) => { c.fillStyle = '#c8bfb2'; c.fillRect(0, 0, W, H); c.strokeStyle = '#a89f92'; c.lineWidth = 4; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * W / 8, 0); c.lineTo(i * W / 8, H); c.stroke(); } for (let i = 0; i <= 2; i++) { c.beginPath(); c.moveTo(0, i * H / 2); c.lineTo(W, i * H / 2); c.stroke(); } }, 1024, 256);
    for (const s of [-1, 1]) {
      const kz = s * (RW / 2 + 0.08);
      mesh(new T.BoxGeometry(L, KH, 0.16), [mat(0x9ca3af), mat(0x9ca3af), mat(0x9ca3af), mat(0x9ca3af), new T.MeshStandardMaterial({ map: kerbT }), new T.MeshStandardMaterial({ map: kerbT })], g, 0, KH / 2, kz);
      const fp = mesh(new T.BoxGeometry(L, KH - 0.01, FP), [mat(0xb8afa2), mat(0xb8afa2), new T.MeshStandardMaterial({ map: tiles, roughness: 0.9 }), mat(0xb8afa2), mat(0xb8afa2), mat(0xb8afa2)], g, 0, (KH - 0.01) / 2, s * (RW / 2 + 0.16 + FP / 2));
      // ramp-style tactile strip at the crossing
      box(2.6, 0.012, 0.4, 0xfacc15, g, 0, KH, s * (RW / 2 + 0.4), 0.004);
    }
    return { group: g };
  }

  const R = (id, lab, fn, tags) => ZAssets.register('transport', id, lab, fn, tags);
  R('bicycle', 'Kid\'s bicycle', bicycle, ['bike', 'cycle', 'vehicle', 'street']);
  R('school_bus', 'School bus', schoolBus, ['bus', 'school', 'vehicle', 'street']);
  R('auto_rickshaw', 'Auto rickshaw', autoRickshaw, ['auto', 'rickshaw', 'vehicle', 'street']);
  R('car', 'Hatchback car', car, ['car', 'vehicle', 'street']);
  R('scooter', 'Scooter', scooter, ['scooty', 'scooter', 'vehicle', 'street']);
  R('bus_stop', 'Bus stop', busStop, ['bus', 'stop', 'shelter', 'street']);
  R('traffic_light', 'Traffic light', trafficLight, ['signal', 'traffic', 'street', 'action']);
  R('train', 'Train (engine + coach)', train, ['train', 'railway', 'vehicle']);
  R('aeroplane', 'Aeroplane', aeroplane, ['plane', 'flight', 'sky', 'vehicle']);
  R('road_crossing', 'Road with zebra crossing', roadCrossing, ['road', 'zebra', 'crossing', 'street']);
})();
