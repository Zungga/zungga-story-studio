/*
 * Zungga Story Studio — the Drive-My-Portfolio game's garage (game.js 1517–1693) + its toys and pickups
 * (kite 2299–2319, spinning top 2386–2390, frisbee & ball 3186–3189, collectible star 1467–1470, knock-over cone & crate 1451–1458).
 * Real-world metres, front +z, bottom at y = 0. No brand marks on any car (as in the game).
 */
(() => {
  'use strict';
  const { T, mat: zmat, mesh, tex } = ZA;
  const mat = (c, o = {}) => zmat(c, { roughness: 0.85, ...o });   // the game's mat() default roughness
  function add(geo, m, x = 0, y = 0, z = 0, parent, shadow = true) { const me = mesh(geo, m, parent, x, y, z); me.castShadow = shadow; return me; }

  // ======================= cars =======================
  function buildCar(kind, color = 0x5b5cf6) {
    const group = new T.Group(), model = new T.Group(), body = new T.Group(); group.add(model); model.add(body);
    const paint = new T.MeshPhysicalMaterial({ color, metalness: 0.35, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, emissive: new T.Color(color).multiplyScalar(0.35), emissiveIntensity: 0.18 });
    const black = mat(0x14141b, { roughness: 0.55 }), carbon = mat(0x24242e, { roughness: 0.3, metalness: 0.5 });
    const glass = new T.MeshPhysicalMaterial({ color: 0x0e1220, metalness: 0.3, roughness: 0.05, clearcoat: 1 });
    const chrome = mat(0xeef1f5, { metalness: 1, roughness: 0.12 }), cream = mat(0xf3ead2, { roughness: 0.45 });
    const lightMat = mat(0xffffff, { emissive: 0xeaf4ff, emissiveIntensity: 1.4 }), drlMat = mat(0xffffff, { emissive: 0x7dd3fc, emissiveIntensity: 2 });
    const tailMat = mat(0xff1f3d, { emissive: 0xff1030, emissiveIntensity: 1.1 });
    const tyreMat = mat(0x111114, { roughness: 0.9 }), rimMat = mat(0x2a2c35, { metalness: 0.85, roughness: 0.25 });
    const spokeMat = mat(0xc9ced8, { metalness: 0.95, roughness: 0.18 }), caliperMat = mat(0xec4899, { roughness: 0.4 });
    function bodyPart(pts, width, material, bevel) {
      const sh = new T.Shape(); sh.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) sh.lineTo(pts[k][0], pts[k][1]);
      sh.closePath();
      const g = new T.ExtrudeGeometry(sh, { depth: width, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3 });
      g.translate(0, 0, -width / 2); g.rotateY(-Math.PI / 2);
      return add(g, material, 0, 0, 0, body);
    }
    function tube(a, b, r, m) {
      const d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const me = add(new T.CylinderGeometry(r, r, d.length(), 8), m, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, body, false);
      me.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
      return me;
    }
    function addWheels(list, o) {
      const tyre = new T.CylinderGeometry(o.r, o.r, o.w, 26).rotateZ(Math.PI / 2);
      for (const [x, z] of list) {
        const pivot = new T.Group(); pivot.position.set(x, o.r, z); model.add(pivot);
        if (o.caliper) add(new T.BoxGeometry(0.12, 0.24, 0.3), o.caliper, x < 0 ? 0.1 : -0.1, 0.14, 0, pivot, false);
        const w = add(tyre, tyreMat, 0, 0, 0, pivot);
        o.style(w, x < 0 ? -1 : 1, o);
      }
    }
    const spokes = (n, rim, spoke, len = 0.66) => (w, s, o) => {
      add(new T.CylinderGeometry(o.r * 0.74, o.r * 0.74, o.w + 0.02, 22).rotateZ(Math.PI / 2), rim, 0, 0, 0, w, false);
      for (let k = 0; k < n; k++) { const sp = add(new T.BoxGeometry(o.w + 0.03, 0.06, len), spoke, 0, 0, 0, w, false); sp.rotation.x = (k * Math.PI) / n; }
    };

    if (kind === 'coupe') {
      bodyPart([[-2.25, 0.32], [-2.32, 0.62], [-2.28, 0.98], [-1.95, 1.07], [-1.15, 1.09], [1.05, 1.05], [2.05, 0.9], [2.36, 0.72], [2.39, 0.5], [2.28, 0.3]], 1.94, paint, 0.09);
      bodyPart([[-1.2, 1.07], [-0.44, 1.54], [0.3, 1.57], [1.04, 1.07]], 1.6, glass, 0.05);
      bodyPart([[-0.52, 1.52], [-0.4, 1.61], [0.28, 1.63], [0.4, 1.55]], 1.46, carbon, 0.04);
      add(new T.BoxGeometry(0.9, 0.24, 0.1), black, 0, 0.6, 2.4, body, false);
      for (const sx of [-1, 1]) {
        add(new T.BoxGeometry(0.42, 0.3, 0.1), black, sx * 0.74, 0.5, 2.36, body, false);
        add(new T.BoxGeometry(0.56, 0.11, 0.12), lightMat, sx * 0.66, 0.84, 2.25, body, false).rotation.y = sx * 0.25;
        add(new T.BoxGeometry(0.42, 0.035, 0.1), drlMat, sx * 0.66, 0.76, 2.28, body, false);
        add(new T.BoxGeometry(0.08, 0.13, 2.7), carbon, sx * 1.03, 0.38, 0, body);
        add(new T.BoxGeometry(0.04, 0.2, 0.42), black, sx * 1.04, 0.74, 0.98, body, false);
        add(new T.BoxGeometry(0.22, 0.12, 0.3), paint, sx * 1.02, 1.17, 0.78, body);
        add(new T.BoxGeometry(0.62, 0.12, 0.08), tailMat, sx * 0.62, 0.9, -2.44, body, false);
        for (const ex of [0.44, 0.62]) add(new T.CylinderGeometry(0.075, 0.075, 0.2, 12), chrome, sx * ex, 0.4, -2.36, body, false).rotation.x = Math.PI / 2;
      }
      add(new T.BoxGeometry(2.05, 0.05, 0.3), carbon, 0, 0.3, 2.3, body);
      add(new T.BoxGeometry(1.5, 0.2, 0.32), carbon, 0, 0.38, -2.24, body);
      add(new T.BoxGeometry(1.75, 0.05, 0.28), carbon, 0, 1.14, -2.02, body);
      addWheels([[-1.06, 1.42], [1.06, 1.42], [-1.06, -1.38], [1.06, -1.38]], { r: 0.5, w: 0.42, caliper: caliperMat, style: spokes(5, rimMat, spokeMat, 0.66) });
    } else if (kind === 'super') {
      bodyPart([[-2.35, 0.3], [-2.42, 0.72], [-2.15, 0.9], [-1.25, 0.94], [0.95, 0.84], [2.2, 0.52], [2.46, 0.38], [2.4, 0.26]], 2.04, paint, 0.08);
      bodyPart([[-0.95, 0.9], [-0.25, 1.3], [0.4, 1.31], [1.3, 0.84]], 1.4, glass, 0.06);
      bodyPart([[-2.05, 0.9], [-0.95, 0.9], [-0.3, 1.24], [-1.5, 1.06]], 1.05, carbon, 0.04);
      for (const sx of [-1, 1]) {
        add(new T.BoxGeometry(0.62, 0.05, 0.12), lightMat, sx * 0.72, 0.56, 2.33, body, false).rotation.y = sx * 0.35;
        add(new T.BoxGeometry(0.06, 0.36, 1.1), black, sx * 1.04, 0.62, -0.55, body, false);
        add(new T.BoxGeometry(0.08, 0.1, 3.4), carbon, sx * 1.04, 0.32, 0, body);
        add(new T.BoxGeometry(0.06, 0.45, 0.06), carbon, sx * 0.62, 1.15, -2.0, body);
        add(new T.BoxGeometry(0.06, 0.32, 0.5), carbon, sx * 1.08, 1.4, -2.0, body);
      }
      add(new T.BoxGeometry(2.16, 0.07, 0.5), carbon, 0, 1.4, -2.0, body);
      add(new T.BoxGeometry(1.95, 0.05, 0.06), tailMat, 0, 0.78, -2.43, body, false);
      add(new T.BoxGeometry(1.7, 0.24, 0.3), carbon, 0, 0.36, -2.3, body);
      add(new T.BoxGeometry(2.1, 0.05, 0.4), carbon, 0, 0.27, 2.35, body);
      add(new T.CylinderGeometry(0.11, 0.11, 0.2, 14), chrome, 0, 0.46, -2.4, body, false).rotation.x = Math.PI / 2;
      addWheels([[-1.1, 1.5], [1.1, 1.5], [-1.1, -1.45], [1.1, -1.45]], { r: 0.52, w: 0.46, caliper: mat(0xfacc15, { roughness: 0.4 }), style: spokes(10, mat(0x111216, { metalness: 0.9, roughness: 0.3 }), mat(0x3a3d46, { metalness: 0.9, roughness: 0.2 }), 0.7) });
    } else if (kind === 'classic') {
      bodyPart([[-2.2, 0.42], [-2.32, 0.82], [-1.95, 0.96], [1.6, 0.98], [2.2, 0.86], [2.26, 0.42]], 1.68, paint, 0.14);
      bodyPart([[-1.45, 0.96], [-1.05, 1.5], [0.55, 1.5], [0.95, 0.96]], 1.58, glass, 0.08);
      bodyPart([[-1.15, 1.47], [-1.05, 1.62], [0.55, 1.62], [0.66, 1.47]], 1.5, cream, 0.06);
      for (const sx of [-1, 1]) {
        for (const fz of [1.35, -1.3]) { const f = add(new T.SphereGeometry(1, 20, 12), paint, sx * 0.9, 0.72, fz, body); f.scale.set(0.3, 0.42, 0.92); }
        const hl = add(new T.CylinderGeometry(0.16, 0.16, 0.08, 18), lightMat, sx * 0.62, 0.82, 2.26, body, false); hl.rotation.x = Math.PI / 2;
        add(new T.TorusGeometry(0.17, 0.035, 6, 18), chrome, sx * 0.62, 0.82, 2.3, body, false);
        const tl = add(new T.CylinderGeometry(0.11, 0.11, 0.06, 14), tailMat, sx * 0.66, 0.78, -2.28, body, false); tl.rotation.x = Math.PI / 2;
        add(new T.BoxGeometry(0.03, 0.05, 2.9), chrome, sx * 0.86, 0.62, 0, body, false);
      }
      for (const z of [2.36, -2.34]) add(new T.BoxGeometry(1.86, 0.15, 0.18), chrome, 0, 0.42, z, body);
      add(new T.BoxGeometry(0.9, 0.26, 0.05), chrome, 0, 0.64, 2.3, body, false);
      for (let k = -3; k <= 3; k++) add(new T.BoxGeometry(0.03, 0.24, 0.06), black, k * 0.12, 0.64, 2.31, body, false);
      add(new T.BoxGeometry(0.06, 0.08, 0.3), chrome, 0, 1.0, 1.9, body, false);
      const white = mat(0xf8f9fa, { roughness: 0.6 });
      addWheels([[-0.92, 1.35], [0.92, 1.35], [-0.92, -1.3], [0.92, -1.3]], { r: 0.42, w: 0.3, style: (w, s, o) => {
        add(new T.CylinderGeometry(o.r * 0.78, o.r * 0.78, o.w + 0.01, 22).rotateZ(Math.PI / 2), white, 0, 0, 0, w, false);
        add(new T.CylinderGeometry(o.r * 0.5, o.r * 0.5, o.w + 0.03, 20).rotateZ(Math.PI / 2), chrome, 0, 0, 0, w, false);
        add(new T.BoxGeometry(o.w + 0.05, 0.05, o.r * 0.8), black, 0, 0, 0, w, false);
      } });
    } else if (kind === 'buggy') {
      bodyPart([[-1.55, 0.62], [-1.7, 1.0], [-1.25, 1.06], [1.1, 0.96], [1.85, 0.78], [1.8, 0.6]], 1.36, paint, 0.1);
      const cage = mat(0x1f2129, { metalness: 0.6, roughness: 0.4 });
      const P = [[-0.62, 1.0, 0.75], [0.62, 1.0, 0.75], [-0.62, 1.0, -1.2], [0.62, 1.0, -1.2]];
      const Q = [[-0.5, 2.05, 0.15], [0.5, 2.05, 0.15], [-0.5, 2.05, -1.0], [0.5, 2.05, -1.0]];
      for (let k = 0; k < 4; k++) tube(P[k], Q[k], 0.055, cage);
      tube(Q[0], Q[1], 0.055, cage); tube(Q[2], Q[3], 0.055, cage); tube(Q[0], Q[2], 0.055, cage); tube(Q[1], Q[3], 0.055, cage);
      tube(Q[0], P[3], 0.045, cage); tube([-0.62, 1.0, 0.75], [-0.95, 0.75, 1.75], 0.05, cage); tube([0.62, 1.0, 0.75], [0.95, 0.75, 1.75], 0.05, cage);
      tube([-0.95, 0.75, 1.75], [0.95, 0.75, 1.75], 0.05, cage);
      for (const sx of [-0.3, 0.3]) { add(new T.BoxGeometry(0.46, 0.12, 0.5), black, sx, 1.0, -0.35, body); add(new T.BoxGeometry(0.46, 0.6, 0.12), black, sx, 1.28, -0.62, body); }
      add(new T.BoxGeometry(0.9, 0.5, 0.7), mat(0x6c757d, { metalness: 0.7, roughness: 0.35 }), 0, 1.15, -1.45, body);
      for (const sx of [-0.22, 0.22]) tube([sx, 1.2, -1.75], [sx, 1.6, -2.05], 0.06, chrome);
      add(new T.BoxGeometry(1.0, 0.12, 0.14), cage, 0, 2.12, 0.15, body, false);
      for (let k = -1.5; k <= 1.5; k++) add(new T.BoxGeometry(0.16, 0.09, 0.05), lightMat, k * 0.22, 2.12, 0.23, body, false);
      for (const sx of [-1, 1]) {
        add(new T.CylinderGeometry(0.12, 0.12, 0.08, 14), lightMat, sx * 0.48, 0.92, 1.82, body, false).rotation.x = Math.PI / 2;
        add(new T.BoxGeometry(0.16, 0.1, 0.05), tailMat, sx * 0.5, 0.95, -1.75, body, false);
        for (const z of [1.3, -1.2]) tube([sx * 0.55, 0.7, z], [sx * 1.0, 0.62, z], 0.04, cage);
      }
      const spare = add(new T.TorusGeometry(0.42, 0.17, 8, 18), tyreMat, 0, 1.55, -1.95, body); spare.rotation.x = 0.25;
      addWheels([[-1.14, 1.3], [1.14, 1.3], [-1.14, -1.2], [1.14, -1.2]], { r: 0.62, w: 0.55, style: (w, s, o) => {
        add(new T.CylinderGeometry(o.r * 0.55, o.r * 0.55, o.w + 0.02, 16).rotateZ(Math.PI / 2), mat(0xadb5bd, { metalness: 0.8, roughness: 0.3 }), 0, 0, 0, w, false);
        add(new T.BoxGeometry(o.w + 0.04, 0.08, o.r * 0.9), black, 0, 0, 0, w, false);
        for (let k = 0; k < 14; k++) { const th = (k / 14) * Math.PI * 2; const b = add(new T.BoxGeometry(o.w * 1.02, 0.1, 0.18), tyreMat, 0, Math.cos(th) * o.r, Math.sin(th) * o.r, w, false); b.rotation.x = th; }
      } });
    } else if (kind === 'bike') {
      const frame = mat(0x2b2f3a, { metalness: 0.6, roughness: 0.35 });
      bodyPart([[-0.1, 0.72], [0.05, 0.98], [0.55, 1.0], [0.72, 0.82], [0.42, 0.68]], 0.34, paint, 0.04);
      bodyPart([[-0.78, 0.84], [-0.72, 0.95], [-0.08, 0.95], [-0.02, 0.84]], 0.28, black, 0.03);
      bodyPart([[-1.08, 0.8], [-1.02, 0.97], [-0.72, 0.92], [-0.72, 0.8]], 0.24, paint, 0.03);
      bodyPart([[0.58, 0.72], [0.76, 1.18], [0.92, 1.14], [0.98, 0.72]], 0.38, paint, 0.04);
      bodyPart([[0.78, 1.16], [0.86, 1.38], [0.92, 1.36], [0.9, 1.14]], 0.3, glass, 0.02);
      add(new T.BoxGeometry(0.3, 0.36, 0.5), mat(0x6c757d, { metalness: 0.7, roughness: 0.35 }), 0, 0.52, 0.08, body);
      tube([0, 0.38, 0.92], [0, 1.1, 0.66], 0.035, chrome); tube([0, 0.45, 0], [0, 0.36, -0.82], 0.04, frame);
      tube([0.14, 0.42, -0.05], [0.17, 0.62, -0.95], 0.05, chrome);
      tube([-0.34, 1.12, 0.62], [0.34, 1.12, 0.62], 0.025, black);
      add(new T.CylinderGeometry(0.08, 0.08, 0.06, 14), lightMat, 0, 1.0, 0.99, body, false).rotation.x = Math.PI / 2;
      add(new T.BoxGeometry(0.16, 0.06, 0.04), tailMat, 0, 0.92, -1.1, body, false);
      addWheels([[0, 0.94], [0, -0.84]], { r: 0.36, w: 0.14, style: spokes(6, rimMat, spokeMat, 0.5) });
    }
    // setOn = headlights at full night brightness (game: light 1.4 → 3.5, tail 1.1 → 2.6)
    group.userData.setOn = (on) => { lightMat.emissiveIntensity = on ? 3.5 : 1.4; tailMat.emissiveIntensity = on ? 2.6 : 1.1; drlMat.emissiveIntensity = on ? 3 : 2; };
    return { group, body, paint };
  }

  // the rider (game.js 1678–1681): the islander body, helmet in the bike's paint
  function rider(paint) {
    const cm = (c) => (c && c.isMaterial ? c : zmat(c, { roughness: 0.75 }));
    const o = { shirt: 0x1f2937, pants: 0x111827, skin: 0xc68642, helmet: paint };
    const g = new T.Group();
    const legs = [-0.1, 0.1].map((x) => { const p = new T.Group(); p.position.set(x, 0.92, 0); g.add(p); add(new T.BoxGeometry(0.15, 0.86, 0.17).translate(0, -0.43, 0), cm(o.pants), 0, 0, 0, p); add(new T.BoxGeometry(0.16, 0.08, 0.27), cm(0x22222a), 0, -0.88, 0.04, p, false); return p; });
    const upper = new T.Group(); upper.position.y = 0.92; g.add(upper);
    add(new T.BoxGeometry(0.42, 0.58, 0.24), cm(o.shirt), 0, 0.3, 0, upper);
    add(new T.CylinderGeometry(0.05, 0.06, 0.1, 8), cm(o.skin), 0, 0.64, 0, upper, false);
    add(new T.SphereGeometry(0.14, 14, 10), cm(o.skin), 0, 0.78, 0, upper);
    add(new T.SphereGeometry(0.2, 16, 12), cm(o.helmet), 0, 0.8, 0, upper);
    const arms = [-0.27, 0.27].map((x) => { const p = new T.Group(); p.position.set(x, 0.56, 0); upper.add(p); add(new T.BoxGeometry(0.1, 0.58, 0.11).translate(0, -0.29, 0), cm(o.shirt), 0, 0, 0, p, false); add(new T.SphereGeometry(0.06, 8, 6), cm(o.skin), 0, -0.62, 0, p, false); return p; });
    upper.rotation.x = 0.55; legs[0].rotation.x = legs[1].rotation.x = -1.15; legs[0].rotation.z = -0.28; legs[1].rotation.z = 0.28;
    arms[0].rotation.x = arms[1].rotation.x = -1.2; arms[0].rotation.z = -0.15; arms[1].rotation.z = 0.15;
    return g;
  }

  const CARS = [
    ['coupe', 'Sports coupe (game car)', ['car', 'sports car', 'coupe']],
    ['super', 'Hypercar with rear wing (game car)', ['car', 'supercar', 'hypercar', 'race car']],
    ['classic', 'Classic 50s cruiser, chrome (game car)', ['car', 'vintage', 'classic', 'old car']],
    ['buggy', 'Dune buggy with roll cage (game car)', ['car', 'buggy', 'off-road', 'beach']],
  ];
  for (const [k, label, tags] of CARS) ZAssets.register('transport', 'game_car_' + k, label, () => buildCar(k), ['vehicle', ...tags]);
  ZAssets.register('transport', 'game_bike', 'Sport motorbike with helmeted rider (game)', () => {
    const r = buildCar('bike'); const p = rider(r.paint); p.position.set(0, 0.04, -0.36); r.body.add(p); return { group: r.group };
  }, ['vehicle', 'motorbike', 'bike', 'rider', 'helmet']);
  ZAssets.register('transport', 'game_bike_parked', 'Sport motorbike, no rider (game)', () => ({ group: buildCar('bike').group }), ['vehicle', 'motorbike', 'bike']);

  // ======================= toys =======================
  const woodMat = () => mat(0x9c6b3f, { roughness: 0.8 });
  const segs = (n, rad, c, parent) => { const m = new T.MeshStandardMaterial({ color: c, roughness: 0.7 }), geo = new T.CylinderGeometry(rad, rad, 1, 5); return Array.from({ length: n }, () => { const s = mesh(geo, m, parent); s.castShadow = false; return s; }); };
  const UP = new T.Vector3(0, 1, 0);
  const placeSeg = (s, p, q) => { const d = new T.Vector3().subVectors(q, p); s.position.copy(p).addScaledVector(d, 0.5); s.scale.set(1, Math.max(d.length(), 1e-4), 1); s.quaternion.setFromUnitVectors(UP, d.normalize()); };

  // kite (game.js 2299–2319): four-colour diamond, white centre, bamboo cross, pink ribbon tail with 4 bows. Scaled 0.5 (game kite is 1.7 m).
  ZAssets.register('toys', 'game_kite', 'Four-colour diamond kite with bow tail (game)', () => {
    const group = new T.Group(), k = new T.Group(), S = 0.5; group.add(k);
    const sh = new T.Shape(); sh.moveTo(0, 0.95); sh.lineTo(0.62, 0.05); sh.lineTo(0, -0.75); sh.lineTo(-0.62, 0.05); sh.closePath();
    const geo = new T.ShapeGeometry(sh), uv = geo.attributes.uv, p = geo.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + 0.62) / 1.24, (p.getY(i) + 0.75) / 1.7);
    const map = tex((c, w, h) => {   // canvas y is flipped vs uv: top of canvas = top of kite
      c.fillStyle = '#e03131'; c.fillRect(0, 0, w / 2, h * 0.53); c.fillStyle = '#fab005'; c.fillRect(w / 2, 0, w / 2, h * 0.53);
      c.fillStyle = '#1c7ed6'; c.fillRect(0, h * 0.53, w / 2, h); c.fillStyle = '#7048e8'; c.fillRect(w / 2, h * 0.53, w / 2, h);
      c.fillStyle = '#fff'; c.beginPath(); c.arc(w / 2, h * 0.53, w * 0.09, 0, Math.PI * 2); c.fill();
    }, 256, 256);
    add(geo, new T.MeshStandardMaterial({ map, side: T.DoubleSide, roughness: 0.7 }), 0, 0, 0, k, false);
    add(new T.BoxGeometry(0.03, 1.7, 0.03), woodMat(), 0, 0.1, 0.01, k, false);
    add(new T.BoxGeometry(1.24, 0.03, 0.03), woodMat(), 0, 0.05, 0.01, k, false);
    k.scale.setScalar(S);
    const tail = segs(13, 0.012, 0xf06595, group);
    const bows = [0xffd43b, 0x82c91e, 0x22d3ee, 0xf783ac].map((c) => add(new T.PlaneGeometry(0.11, 0.06), new T.MeshStandardMaterial({ color: c, side: T.DoubleSide, roughness: 0.7 }), 0, 0, 0, group, false));
    const H0 = 13 * 0.16 * 0.55 + 0.75 * S;   // lift so the tail tip just reaches the ground
    const a = new T.Vector3(), b = new T.Vector3();
    const tp = (i, t) => [Math.sin(t * 4 + i * 0.7) * 0.12, -0.75 * S - i * 0.16 * 0.55, -i * 0.05];
    group.userData.tick = (t) => {
      k.position.set(0, H0, 0); k.rotation.z = Math.sin(t * 1.9) * 0.12;
      const base = new T.Vector3(0, -0.75 * S, 0).applyEuler(k.rotation); const ox = base.x, oy = H0 + base.y;
      for (let i = 0; i < tail.length; i++) { const P = tp(i, t), Q = tp(i + 1, t); a.set(P[0] + ox, P[1] + 0.75 * S + oy, P[2]); b.set(Q[0] + ox, Q[1] + 0.75 * S + oy, Q[2]); placeSeg(tail[i], a, b); }
      bows.forEach((bw, i) => { const P = tp(3 + i * 3, t); bw.position.set(P[0] + ox, P[1] + 0.75 * S + oy, P[2]); bw.rotation.y = Math.sin(t * 3 + i) * 0.4; });
    };
    group.userData.tick(0);
    return { group };
  }, ['kite', 'patang', 'toy', 'wind']);

  // spinning top (game.js 2386–2403): red cone, yellow disc, wooden knob. Scaled to a real 12 cm top. setOn(true) = it topples over.
  ZAssets.register('toys', 'game_top', 'Spinning top — red and yellow (game)', () => {
    const group = new T.Group(), g = new T.Group(), S = 0.3; group.add(g);
    add(new T.ConeGeometry(0.16, 0.22, 16).rotateX(Math.PI), mat(0xe03131, { roughness: 0.5 }), 0, 0.11, 0, g, false);
    add(new T.CylinderGeometry(0.17, 0.16, 0.06, 16), mat(0xfab005), 0, 0.23, 0, g, false);
    add(new T.CylinderGeometry(0.02, 0.02, 0.12, 8), woodMat(), 0, 0.31, 0, g, false);
    add(new T.BoxGeometry(0.02, 0.061, 0.17), mat(0xe03131, { roughness: 0.5 }), 0.08, 0.23, 0, g, false);   // one red mark on the disc so the spin reads on camera
    g.scale.setScalar(S);
    let fallen = false;
    group.userData.tick = (t) => {
      if (fallen) { g.rotation.set(0, 0.6, 1.3); g.position.set(0.05, 0.045, 0); return; }
      g.position.set(0, 0, 0); g.rotation.set(Math.sin(t * 6) * 0.06, t * 40, Math.cos(t * 6) * 0.06);
    };
    group.userData.setOn = (on) => { fallen = !!on; group.userData.tick(0); };
    group.userData.tick(0);
    return { group };
  }, ['top', 'lattu', 'spinning', 'toy']);

  // frisbee & ball (game.js 3186–3189)
  ZAssets.register('toys', 'game_frisbee', 'Pink frisbee (game)', () => {
    const group = new T.Group();
    add(new T.CylinderGeometry(0.16, 0.14, 0.035, 20), mat(0xe64980, { roughness: 0.4 }), 0, 0.0175, 0, group);
    add(new T.TorusGeometry(0.155, 0.015, 6, 20).rotateX(Math.PI / 2), mat(0xfcc2d7), 0, 0.0175, 0, group, false);
    return { group };
  }, ['frisbee', 'disc', 'fetch', 'toy']);
  ZAssets.register('toys', 'game_ball', 'Lime play ball (game)', () => {
    const group = new T.Group(); add(new T.SphereGeometry(0.09, 20, 14), mat(0xc0eb75, { roughness: 0.6 }), 0, 0.09, 0, group); return { group };
  }, ['ball', 'fetch', 'toy']);

  // collectible star (game.js 1467–1470, spin/bob 4119–4120): golden glowing octahedron. Scaled 0.5 (game: 1.8 m).
  ZAssets.register('toys', 'collect_star', 'Collectible golden star gem (game pickup)', () => {
    const group = new T.Group();
    const m = add(new T.OctahedronGeometry(0.45), mat(0xffd43b, { emissive: 0xffb700, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.4 }), 0, 0.65, 0, group);
    group.userData.tick = (t) => { m.rotation.y = 2 * t; m.position.y = 0.65 + Math.sin(t * 2.5) * 0.175; };
    group.userData.tick(0);
    return { group };
  }, ['star', 'collectible', 'gem', 'pickup', 'bonus', 'game']);

  // knock-over props (game.js 1451–1458): orange cone on a square base, wooden crate. Scaled 0.5 (game: 1.4 m).
  ZAssets.register('toys', 'game_cone', 'Orange traffic cone (game knock-over prop)', () => {
    const group = new T.Group(), m = mat(0xff922b);
    add(new T.ConeGeometry(0.275, 0.7, 12), m, 0, 0.35, 0, group); add(new T.BoxGeometry(0.6, 0.06, 0.6), m, 0, 0.03, 0, group);
    return { group };
  }, ['cone', 'traffic cone', 'obstacle']);
  ZAssets.register('toys', 'game_crate', 'Wooden crate (game knock-over prop)', () => {
    const group = new T.Group(); add(new T.BoxGeometry(0.7, 0.7, 0.7), mat(0xc08552), 0, 0.35, 0, group); return { group };
  }, ['crate', 'box', 'obstacle']);
})();
