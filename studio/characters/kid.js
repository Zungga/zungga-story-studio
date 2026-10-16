/*
 * Zungga Story Studio — main character: a stylised schoolkid (boy, with a girl variant on the same rig).
 *   const kid = ZCharacters.kid({ variant: 'boy' | 'girl', skin, hair });
 *   kid.group                 → add to the scene (feet at y = 0, facing +z)
 *   kid.setExpression(name)   → neutral, smile, big_smile, sad, surprised, thinking, worried, determined, idea
 *   kid.play(name)            → idle, talk, walk, run, sit, sit_sad, wave, think, cheer, count, point
 *   kid.setTalk(level 0..1)   → mouth opening (a story can drive this from the voice clip's loudness)
 *   kid.hold(object3D, hand)  → put a prop in a hand ('R' or 'L')
 *   kid.update(dt)            → call every frame
 * Everything is procedural (no external model), sized in metres (~1.42 m tall).
 */
(() => {
  'use strict';
  const T = THREE;
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
  const smooth = (t) => t * t * (3 - 2 * t);

  function canvasTex(draw, w = 256, h = 256) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  function add(parent, geo, mat, x = 0, y = 0, z = 0) { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
  const J = (parent, x = 0, y = 0, z = 0) => { const g = new T.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const cap = (r, len, seg = 16) => new T.CapsuleGeometry(r, len, 8, seg);
  const lathe = (pts, seg = 48) => new T.LatheGeometry(pts.map(([r, y]) => new T.Vector2(r, y)), seg);

  function kid(o = {}) {
    const variant = o.variant || 'boy', girl = variant === 'girl';
    // ---------------- materials ----------------
    const skinC = new T.Color(o.skin ?? 0xc58a60);
    const M = {
      skin: new T.MeshPhysicalMaterial({ color: skinC, roughness: 0.6, sheen: 0.25, sheenColor: new T.Color(0xffc4a8), sheenRoughness: 0.7 }),
      skinDark: new T.MeshPhysicalMaterial({ color: skinC.clone().multiplyScalar(0.82), roughness: 0.6 }),
      lip: new T.MeshStandardMaterial({ color: skinC.clone().lerp(new T.Color(0x8a3b3b), 0.45), roughness: 0.45 }),
      mouthIn: new T.MeshStandardMaterial({ color: 0x4a1418, roughness: 0.8 }),
      tongue: new T.MeshStandardMaterial({ color: 0xd8656e, roughness: 0.5 }),
      teeth: new T.MeshStandardMaterial({ color: 0xfbfaf6, roughness: 0.3 }),
      eyeWhite: new T.MeshPhysicalMaterial({ color: 0xfbfbfb, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 }),
      lash: new T.MeshStandardMaterial({ color: 0x120c0a, roughness: 0.6 }),
      hair: new T.MeshPhysicalMaterial({ color: o.hair ?? 0x17110e, roughness: 0.42, sheen: 0.8, sheenColor: new T.Color(0x7a5a48), sheenRoughness: 0.35 }),
      brow: new T.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.7 }),
      shirt: new T.MeshPhysicalMaterial({ color: 0xf7f8fb, roughness: 0.82, sheen: 0.4, sheenColor: new T.Color(0xdfe6ff) }),
      navy: new T.MeshPhysicalMaterial({ color: 0x1f2a52, roughness: 0.85, sheen: 0.3, sheenColor: new T.Color(0x5566aa) }),
      sock: new T.MeshStandardMaterial({ color: 0xf2f3f6, roughness: 0.9 }),
      shoe: new T.MeshPhysicalMaterial({ color: 0x15151a, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
      sole: new T.MeshStandardMaterial({ color: 0x2b2b30, roughness: 0.8 }),
      belt: new T.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.5 }),
      buckle: new T.MeshStandardMaterial({ color: 0xc9ccd4, metalness: 0.85, roughness: 0.25 }),
      ribbon: new T.MeshStandardMaterial({ color: 0x2b3d8f, roughness: 0.6 }),
      blush: new T.MeshBasicMaterial({ color: 0xff6f7a, transparent: true, opacity: 0, depthWrite: false }),
    };
    const irisTex = canvasTex((g, W, H) => {
      const cx = W / 2, cy = H / 2, R = W / 2;
      const gr = g.createRadialGradient(cx, cy, R * 0.15, cx, cy, R); gr.addColorStop(0, '#6b3d1e'); gr.addColorStop(0.6, '#3a2010'); gr.addColorStop(0.9, '#1f120a'); gr.addColorStop(1, '#0d0806');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 0.35; g.strokeStyle = '#a5683a'; g.lineWidth = 2;
      for (let i = 0; i < 70; i++) { const a = (i / 70) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.32, cy + Math.sin(a) * R * 0.32); g.lineTo(cx + Math.cos(a) * R * (0.7 + Math.random() * 0.2), cy + Math.sin(a) * R * (0.7 + Math.random() * 0.2)); g.stroke(); }
      g.globalAlpha = 1; g.fillStyle = '#050403'; g.beginPath(); g.arc(cx, cy, R * 0.34, 0, Math.PI * 2); g.fill();
    }, 256, 256);
    const irisM = new T.MeshPhysicalMaterial({ map: irisTex, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02 });

    const root = new T.Group();
    const body = J(root);                                         // whole-body offset (bob, sit height)

    // ---------------- skeleton ----------------
    const hips = J(body, 0, 0.7, 0);
    const spine = J(hips, 0, 0.06, 0);
    const chest = J(spine, 0, 0.2, 0);
    const neck = J(chest, 0, 0.175, 0);
    const head = J(neck, 0, 0.045, 0);

    // ---------------- pelvis / shorts / belt ----------------
    const pelvis = add(hips, lathe([[0.001, -0.09], [0.1, -0.085], [0.138, -0.05], [0.142, 0.02], [0.137, 0.075], [0.001, 0.08]]), M.navy, 0, 0, 0);
    pelvis.scale.z = 0.74;
    const beltM = add(hips, new T.CylinderGeometry(0.139, 0.139, 0.03, 48, 1, true), M.belt, 0, 0.065, 0); beltM.scale.z = 0.75;
    add(hips, new T.BoxGeometry(0.045, 0.032, 0.01), M.buckle, 0, 0.065, 0.104);

    // ---------------- torso (shirt) ----------------
    const torso = add(spine, lathe([[0.001, -0.02], [0.132, -0.02], [0.14, 0.06], [0.152, 0.16], [0.158, 0.26], [0.15, 0.33], [0.115, 0.375], [0.06, 0.39], [0.001, 0.392]]), M.shirt, 0, 0, 0);
    torso.scale.z = 0.7;
    const shirtTail = add(spine, new T.CylinderGeometry(0.135, 0.142, 0.05, 48, 1, true), M.shirt, 0, -0.01, 0); shirtTail.scale.z = 0.74;   // tucked-in shirt folds over the belt
    // collar
    for (const s of [-1, 1]) {
      const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(s * 0.06, 0.012); sh.lineTo(s * 0.03, -0.055); sh.closePath();
      const col = add(chest, new T.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 2 }), M.shirt, s * 0.008, 0.185, 0.072);
      col.rotation.x = -0.35; col.rotation.y = s * 0.45;
    }
    for (let i = 0; i < 4; i++) add(spine, new T.SphereGeometry(0.0055, 10, 8), M.shirt, 0, 0.05 + i * 0.075, 0.108 - Math.max(0, i - 2) * 0.004);   // buttons
    // pocket with school emblem
    const emblem = canvasTex((g, W, H) => { g.fillStyle = '#f7f8fb'; g.fillRect(0, 0, W, H); g.strokeStyle = '#d9dde8'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6); g.fillStyle = '#2b3d8f'; g.beginPath(); g.moveTo(W * 0.5, H * 0.18); g.lineTo(W * 0.78, H * 0.3); g.lineTo(W * 0.72, H * 0.66); g.lineTo(W * 0.5, H * 0.82); g.lineTo(W * 0.28, H * 0.66); g.lineTo(W * 0.22, H * 0.3); g.closePath(); g.fill(); g.fillStyle = '#facc15'; g.font = `700 ${W * 0.3}px Fredoka, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Z', W / 2, H * 0.5); }, 128, 140);
    const pocket = add(spine, new T.PlaneGeometry(0.06, 0.065), new T.MeshStandardMaterial({ map: emblem, roughness: 0.85 }), 0.062, 0.24, 0.1); pocket.rotation.y = 0.32;
    // tie (boy) / bow (girl)
    const tieTex = canvasTex((g, W, H) => { g.fillStyle = '#1f2a52'; g.fillRect(0, 0, W, H); g.strokeStyle = '#facc15'; g.lineWidth = 9; for (let i = -H; i < H * 2; i += 46) { g.beginPath(); g.moveTo(0, i); g.lineTo(W, i + W); g.stroke(); } }, 128, 512);
    const tieM = new T.MeshStandardMaterial({ map: tieTex, roughness: 0.7 });
    if (!girl) {
      const knot = add(chest, new T.SphereGeometry(0.017, 16, 12), tieM, 0, 0.162, 0.1); knot.scale.set(1, 0.85, 0.7);
      const ts = new T.Shape(); ts.moveTo(-0.012, 0); ts.lineTo(0.012, 0); ts.lineTo(0.024, -0.2); ts.lineTo(0, -0.225); ts.lineTo(-0.024, -0.2); ts.closePath();
      const blade = add(chest, new T.ExtrudeGeometry(ts, { depth: 0.004, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 1 }), tieM, 0, 0.152, 0.1);
      blade.rotation.x = -0.08;
      const uv = blade.geometry.attributes.uv, bp = blade.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, bp.getX(i) / 0.05 + 0.5, bp.getY(i) / 0.23 + 1);
    } else {
      for (const s of [-1, 1]) { const b = add(chest, new T.SphereGeometry(0.03, 16, 12), M.ribbon, s * 0.026, 0.165, 0.098); b.scale.set(1, 0.6, 0.35); }
      add(chest, new T.SphereGeometry(0.012, 12, 10), M.ribbon, 0, 0.165, 0.103);
    }
    // ID card on a lanyard
    const card = canvasTex((g, W, H) => { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.fillStyle = '#2b3d8f'; g.fillRect(0, 0, W, H * 0.28); g.fillStyle = '#fff'; g.font = `700 ${H * 0.13}px Fredoka, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ZUNGGA SCHOOL', W / 2, H * 0.15); g.fillStyle = '#cbd5e1'; g.fillRect(W * 0.08, H * 0.36, W * 0.32, H * 0.5); g.fillStyle = '#1f2a52'; g.font = `600 ${H * 0.12}px Fredoka, sans-serif`; g.textAlign = 'left'; g.fillText('STUDENT', W * 0.46, H * 0.5); g.fillText('CLASS VI', W * 0.46, H * 0.72); }, 256, 160);
    const lanyard = new T.Mesh(new T.TorusGeometry(0.085, 0.004, 6, 40, Math.PI), M.ribbon); lanyard.rotation.set(0.15, 0, Math.PI); lanyard.position.set(0, 0.18, 0.045); lanyard.scale.set(0.9, 1.25, 1); chest.add(lanyard);
    const idCard = add(chest, new T.BoxGeometry(0.055, 0.035, 0.003), [M.shirt, M.shirt, M.shirt, M.shirt, new T.MeshStandardMaterial({ map: card, roughness: 0.4 }), M.shirt], girl ? 0 : -0.045, 0.06, 0.112);
    idCard.rotation.x = -0.1;

    // ---------------- neck ----------------
    add(neck, new T.CylinderGeometry(0.04, 0.046, 0.08, 24), M.skin, 0, 0.025, 0.005);

    // ---------------- head ----------------
    const R = 0.145;
    const headGeo = new T.SphereGeometry(1, 96, 72), hp = headGeo.attributes.position;
    const gauss = (x, y, z, cx, cy, cz, s) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2) / (s * s));
    for (let i = 0; i < hp.count; i++) {
      let x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i);
      x *= 0.96; z *= 0.97; y *= 0.97;
      if (y < 0) { const k = -y; x *= 1 - 0.16 * k * k; z *= 1 - 0.05 * k * k; y *= 1 - 0.04 * k; if (z > 0) z += 0.03 * k * k * Math.max(0, z); }     // round, soft jaw (kid proportions)
      const cheek = Math.max(gauss(x, y, z, 0.55, -0.28, 0.66, 0.32), gauss(x, y, z, -0.55, -0.28, 0.66, 0.32));
      const n = Math.hypot(x, y, z) || 1; x += x / n * cheek * 0.045; y += y / n * cheek * 0.045; z += z / n * cheek * 0.045;    // round cheeks
      const brow = gauss(x, y, z, 0, 0.3, 0.9, 0.35); z += brow * 0.02;
      if (z < -0.2 && y > -0.2) z *= 1.04;                                                                                   // fuller back of head
      hp.setXYZ(i, x * R, y * R, z * R);
    }
    headGeo.computeVertexNormals();
    const headC = J(head, 0, R * 0.9, 0);
    add(headC, headGeo, M.skin);
    // ears
    for (const s of [-1, 1]) {
      const ear = J(headC, s * R * 0.9, -R * 0.05, -R * 0.06); ear.rotation.y = s * 0.25;
      const e = add(ear, new T.SphereGeometry(1, 24, 16), M.skin); e.scale.set(R * 0.1, R * 0.24, R * 0.16);
      const ei = add(ear, new T.SphereGeometry(1, 16, 12), M.skinDark, s * R * 0.03, 0, R * 0.02); ei.scale.set(R * 0.05, R * 0.15, R * 0.09);
    }
    // nose
    const nose = add(headC, new T.SphereGeometry(1, 24, 18), M.skin, 0, -R * 0.2, R * 0.955); nose.scale.set(R * 0.085, R * 0.075, R * 0.085);
    for (const s of [-1, 1]) { const ns = add(headC, new T.SphereGeometry(1, 12, 10), M.skinDark, s * R * 0.042, -R * 0.245, R * 0.985); ns.scale.set(R * 0.022, R * 0.014, R * 0.014); }
    // blush
    const blush = [-1, 1].map((s) => { const b = new T.Mesh(new T.CircleGeometry(R * 0.16, 24), M.blush); b.position.set(s * R * 0.55, -R * 0.22, R * 0.82); b.rotation.y = s * 0.6; headC.add(b); return b; });

    // eyes: white ball, iris cap (gaze), fixed highlights, upper + lower lids that blink
    const eyeR = R * 0.27;
    const eyes = [-1, 1].map((s) => {
      const socket = J(headC, s * R * 0.36, R * 0.05, R * 0.66);
      const ball = J(socket);
      add(ball, new T.SphereGeometry(eyeR, 32, 24), M.eyeWhite);
      const th = 0.78, irisG = new T.SphereGeometry(eyeR * 1.004, 40, 16, 0, Math.PI * 2, 0, th), ip = irisG.attributes.position, iuv = irisG.attributes.uv;
      for (let i = 0; i < ip.count; i++) { const x = ip.getX(i), y = ip.getY(i), z = ip.getZ(i), t = Math.acos(Math.min(1, y / (eyeR * 1.004))) / th, a = Math.atan2(z, x); iuv.setXY(i, 0.5 + 0.5 * t * Math.cos(a), 0.5 + 0.5 * t * Math.sin(a)); }
      const iris = add(ball, irisG, irisM); iris.rotation.x = Math.PI / 2;
      const hl1 = new T.Mesh(new T.SphereGeometry(eyeR * 0.11, 12, 10), new T.MeshBasicMaterial({ color: 0xffffff })); hl1.position.set(-eyeR * 0.28, eyeR * 0.2, eyeR * 0.96); socket.add(hl1);
      const hl2 = new T.Mesh(new T.SphereGeometry(eyeR * 0.05, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff })); hl2.position.set(eyeR * 0.26, -eyeR * 0.24, eyeR * 0.95); socket.add(hl2);
      const upper = J(socket), lower = J(socket);
      add(upper, new T.SphereGeometry(eyeR * 1.04, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.skin);
      const lash = add(upper, new T.TorusGeometry(eyeR * 1.045, eyeR * 0.06, 8, 40, Math.PI), M.lash); lash.rotation.x = Math.PI / 2;
      add(lower, new T.SphereGeometry(eyeR * 1.03, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.skin);
      socket.rotation.y = s * 0.12;
      return { socket, ball, upper, lower };
    });
    // eyebrows (tube along a soft arch; expressions move and tilt them)
    const brows = [-1, 1].map((s) => {
      const g = J(headC, s * R * 0.36, R * 0.42, R * 0.88); g.rotation.y = s * 0.3;
      const curve = new T.CatmullRomCurve3([new T.Vector3(-R * 0.17, -R * 0.02, 0), new T.Vector3(-R * 0.05, R * 0.03, R * 0.01), new T.Vector3(R * 0.08, R * 0.03, R * 0.0), new T.Vector3(R * 0.18, -R * 0.03, -R * 0.03)]);
      const m = add(g, new T.TubeGeometry(curve, 20, R * 0.021, 8), M.brow); m.scale.x = s;
      return g;
    });
    // mouth: lips line (smile / frown), plus an open mouth with teeth + tongue
    const mouth = J(headC, 0, -R * 0.43, R * 0.865); mouth.rotation.x = -0.3;
    let lipLine = add(mouth, new T.BufferGeometry(), M.lip);
    const openG = J(mouth, 0, 0, -R * 0.005);
    const openShape = new T.Shape(); openShape.moveTo(-1, 0); openShape.bezierCurveTo(-0.6, 0.12, 0.6, 0.12, 1, 0); openShape.bezierCurveTo(0.7, -1.1, -0.7, -1.1, -1, 0);
    const openMesh = add(openG, new T.ShapeGeometry(openShape, 24), M.mouthIn);
    const teeth = add(openG, new T.PlaneGeometry(1.15, 0.17), M.teeth, 0, -0.08, 0.002);
    const tongue = add(openG, new T.CircleGeometry(0.5, 20), M.tongue, 0, -0.52, 0.001); tongue.scale.set(0.9, 0.34, 1);
    openG.scale.set(R * 0.2, R * 0.1, 1);
    function buildLip(smile, width, open) {
      const w = R * width, c = -smile * R * 0.08, y0 = open > 0.05 ? R * 0.006 : 0;
      const zf = R * 0.012 + Math.max(0, -smile) * R * 0.03;                       // frowns sit a touch further out so the arc stays on the skin
      const curve = new T.CatmullRomCurve3([new T.Vector3(-w, y0 + smile * R * 0.02, -R * 0.02 + zf), new T.Vector3(-w * 0.5, y0 + c * 0.75, zf), new T.Vector3(0, y0 + c, zf + R * 0.005), new T.Vector3(w * 0.5, y0 + c * 0.75, zf), new T.Vector3(w, y0 + smile * R * 0.02, -R * 0.02 + zf)]);
      lipLine.geometry.dispose(); lipLine.geometry = new T.TubeGeometry(curve, 24, R * (0.016 + open * 0.004), 8);
    }

    // hair: a lumpy cap whose edge tucks inside the head along a hairline, plus a side-swept fringe
    const hairG = new T.SphereGeometry(R * 1.08, 96, 48, 0, Math.PI * 2, 0, Math.PI * 0.8), hg = hairG.attributes.position;
    const hairline = (a) => {   // a = angle around the head (0 = front)
      const front = Math.cos(a), side = Math.abs(Math.sin(a));
      if (girl) return front > 0 ? lerp(0.05, 0.62, front) : lerp(0.05, -0.75, -front);
      return front > 0 ? lerp(0.12, 0.58, Math.pow(front, 1.5)) : lerp(0.12, -0.5, Math.pow(-front, 0.8));
    };
    for (let i = 0; i < hg.count; i++) {
      let x = hg.getX(i) / R, y = hg.getY(i) / R, z = hg.getZ(i) / R;
      x *= 0.95; z *= 1.0;
      const a = Math.atan2(x, z), hl = hairline(a);
      let r = 1;
      const band = Math.min(1, Math.max(0, (y - hl + 0.06) / 0.12)), sb = band * band * (3 - 2 * band);
      if (sb <= 0) r = 0.7;                                                                                  // below the hairline: hidden deep inside the head
      else { const k = sb; r = lerp(0.7, 1, Math.pow(k, 0.35)) + 0.035 * Math.sin(x * 9 + z * 4) * Math.sin(y * 7 + x * 3) * k + (y > 0.5 ? 0.03 : 0) + (girl ? 0 : 0.02 * Math.max(0, y)); }
      if (y < 0 && Math.cos(a) < 0) { x *= 1 - 0.12 * (-y); }
      hg.setXYZ(i, x * R * r, y * R * r * (girl ? 1.0 : 1.02), z * R * r);
    }
    hairG.computeVertexNormals();
    add(headC, hairG, M.hair, 0, R * 0.02, -R * 0.01);
    const fringe = J(headC, 0, R * 0.66, R * 0.66);
    const strand = (len, w) => { const g2 = new T.ConeGeometry(w, len, 10, 6), p2 = g2.attributes.position; for (let i = 0; i < p2.count; i++) { const y = p2.getY(i) / len + 0.5; p2.setZ(i, p2.getZ(i) + Math.pow(1 - y, 2) * len * 0.35); p2.setX(i, p2.getX(i) * 1.6); } g2.computeVertexNormals(); return g2; };
    if (!girl) {
      for (let k = 0; k < 7; k++) {
        const t = (k - 3) / 3, m = add(fringe, strand(R * (0.42 - Math.abs(t) * 0.06), R * 0.14), M.hair, t * R * 0.45 + R * 0.04, -Math.abs(t) * R * 0.08, -Math.abs(t) * R * 0.2);
        m.rotation.set(Math.PI + 0.95, t * 0.4, -0.7 + t * 0.1);                                               // swept to one side
      }
    } else {
      for (let k = 0; k < 6; k++) { const t = (k - 2.5) / 2.5, m = add(fringe, strand(R * 0.36, R * 0.13), M.hair, t * R * 0.44, -R * 0.02, -Math.abs(t) * R * 0.12); m.rotation.set(Math.PI + 0.3, t * 0.3, t * 0.4); }
      for (const s of [-1, 1]) {                                                                                 // two plaits with ribbons
        const plait = J(headC, s * R * 0.78, -R * 0.35, -R * 0.45);
        for (let k = 0; k < 7; k++) { const b = add(plait, new T.SphereGeometry(R * (0.17 - k * 0.012), 16, 12), M.hair, s * R * 0.04 * k, -R * 0.22 * k, -R * 0.02 * k); b.scale.set(1, 1.15, 1); }
        for (const t of [-1, 1]) { const bow = add(plait, new T.SphereGeometry(R * 0.12, 14, 10), M.ribbon, s * R * 0.3 + t * R * 0.1, -R * 1.5, 0); bow.scale.set(1.2, 0.6, 0.5); }
      }
    }

    // ---------------- arms & hands ----------------
    function makeArm(s) {
      const sh = J(chest, s * 0.142, 0.115, 0);
      add(sh, new T.SphereGeometry(0.056, 24, 18), M.shirt).scale.set(1, 0.95, 0.85);
      const upper = J(sh);
      add(upper, lathe([[0.001, 0.02], [0.05, 0.015], [0.058, -0.04], [0.057, -0.095], [0.054, -0.108], [0.045, -0.11]], 32), M.shirt, 0, 0, 0);   // short puffed sleeve
      add(upper, cap(0.034, 0.12), M.skin, 0, -0.11, 0);
      const fore = J(upper, 0, -0.2, 0);
      add(fore, new T.SphereGeometry(0.035, 16, 12), M.skin);
      add(fore, cap(0.032, 0.13), M.skin, 0, -0.085, 0);
      const hand = J(fore, 0, -0.18, 0);
      const palm = add(hand, new T.SphereGeometry(1, 20, 16), M.skin, 0, -0.03, 0); palm.scale.set(0.032, 0.04, 0.017);
      const fingers = [];
      for (let f = 0; f < 4; f++) {
        const base = J(hand, s * (-0.021 + f * 0.014), -0.062, 0.004);
        const len = [0.026, 0.03, 0.029, 0.023][f];
        add(base, cap(0.0075, len), M.skin, 0, -len / 2, 0);
        const tip = J(base, 0, -len - 0.004, 0); add(tip, cap(0.007, len * 0.75), M.skin, 0, -len * 0.38, 0);
        fingers.push({ base, tip });
      }
      const thumb = J(hand, s * 0.028, -0.025, 0.012); thumb.rotation.set(0.2, 0, -s * 0.7);
      add(thumb, cap(0.009, 0.022), M.skin, 0, -0.016, 0);
      const grip = J(hand, 0, -0.07, 0.02);   // where held props attach
      return { sh, upper, fore, hand, fingers, thumb, grip };
    }
    const armL = makeArm(-1), armR = makeArm(1);

    // ---------------- legs ----------------
    function makeLeg(s) {
      const hip = J(hips, s * 0.07, -0.05, 0);
      const thigh = J(hip);
      add(thigh, new T.CylinderGeometry(0.068, 0.072, 0.2, 24, 1, true), M.navy, 0, -0.08, 0);                     // shorts leg
      add(thigh, new T.TorusGeometry(0.068, 0.006, 6, 24), M.navy, 0, -0.18, 0).rotation.x = Math.PI / 2;
      add(thigh, cap(0.05, 0.18), M.skin, 0, -0.17, 0);
      const shin = J(thigh, 0, -0.3, 0);
      add(shin, new T.SphereGeometry(0.048, 16, 12), M.skin);
      add(shin, cap(0.043, 0.13), M.skin, 0, -0.08, 0);
      add(shin, new T.CylinderGeometry(0.046, 0.04, 0.17, 20), M.sock, 0, -0.2, 0);                                 // socks
      add(shin, new T.TorusGeometry(0.046, 0.005, 6, 20), M.navy, 0, -0.13, 0).rotation.x = Math.PI / 2;           // sock stripe
      const foot = J(shin, 0, -0.3, 0);
      const sg = new T.SphereGeometry(1, 28, 18), sp = sg.attributes.position;
      for (let i = 0; i < sp.count; i++) { if (sp.getY(i) < -0.3) sp.setY(i, -0.3 - (sp.getY(i) + 0.3) * 0.2); }
      sg.computeVertexNormals();
      const shoe = add(foot, sg, M.shoe, 0, -0.025, 0.04); shoe.scale.set(0.052, 0.048, 0.1);
      const sole = add(foot, new T.BoxGeometry(0.1, 0.014, 0.2), M.sole, 0, -0.058, 0.04); sole.geometry = new T.CapsuleGeometry(0.05, 0.1, 4, 16).rotateX(Math.PI / 2).scale(1, 0.14, 1);
      return { hip, thigh, shin, foot };
    }
    const legL = makeLeg(-1), legR = makeLeg(1);
    root.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    blush.forEach((b) => { b.castShadow = false; });

    // ---------------- expressions ----------------
    const EXPR = {
      neutral:    { smile: 0.15, open: 0, width: 0.2, browY: 0, browTilt: 0, lidUp: 0.95, lidLow: 0.1, blush: 0, gaze: [0, 0] },
      smile:      { smile: 0.7, open: 0, width: 0.24, browY: 0.05, browTilt: 0.05, lidUp: 0.9, lidLow: 0.3, blush: 0.25, gaze: [0, 0] },
      big_smile:  { smile: 0.9, open: 0.75, width: 0.27, browY: 0.12, browTilt: 0.1, lidUp: 0.85, lidLow: 0.45, blush: 0.4, gaze: [0, 0] },
      sad:        { smile: -0.6, open: 0, width: 0.18, browY: -0.02, browTilt: -0.35, lidUp: 0.62, lidLow: 0.05, blush: 0, gaze: [0, -0.25] },
      surprised:  { smile: 0, open: 0.85, width: 0.13, browY: 0.32, browTilt: 0.05, lidUp: 1.15, lidLow: 0, blush: 0, gaze: [0, 0.05] },
      thinking:   { smile: -0.1, open: 0, width: 0.15, browY: 0.12, browTilt: 0.25, lidUp: 0.85, lidLow: 0.15, blush: 0, gaze: [0.35, 0.35], browAsym: 0.18 },
      worried:    { smile: -0.35, open: 0.12, width: 0.17, browY: 0.08, browTilt: -0.45, lidUp: 0.9, lidLow: 0.05, blush: 0, gaze: [-0.2, -0.05] },
      determined: { smile: 0.35, open: 0, width: 0.2, browY: -0.05, browTilt: 0.35, lidUp: 0.78, lidLow: 0.25, blush: 0, gaze: [0, 0], smirk: 0.4 },
      idea:       { smile: 0.8, open: 0.55, width: 0.22, browY: 0.3, browTilt: 0.1, lidUp: 1.12, lidLow: 0.2, blush: 0.3, gaze: [0, 0.3] },
    };
    const cur = { ...EXPR.neutral, browAsym: 0, smirk: 0 }, target = { ...cur };
    let exprName = 'neutral', talk = 0, talkTarget = 0, blinkT = 2.5, blinkK = 0;
    const setExpression = (n) => { if (!EXPR[n]) throw new Error('Unknown expression ' + n); exprName = n; Object.assign(target, { browAsym: 0, smirk: 0 }, EXPR[n]); };

    function applyFace(dt, time) {
      for (const k of ['smile', 'open', 'width', 'browY', 'browTilt', 'lidUp', 'lidLow', 'blush', 'browAsym', 'smirk']) cur[k] = damp(cur[k], target[k] ?? 0, 10, dt);
      cur.gaze = [damp(cur.gaze[0], target.gaze[0], 8, dt), damp(cur.gaze[1], target.gaze[1], 8, dt)];
      // talking adds mouth movement on top of the expression
      talk = damp(talk, talkTarget, 18, dt);
      const open = Math.min(1, cur.open + talk * 0.75);
      buildLip(cur.smile, cur.width + talk * 0.02, open);
      lipLine.rotation.z = cur.smirk * 0.12;
      openG.visible = open > 0.04;
      openG.scale.set(R * (cur.width * 0.95 + 0.02), R * (0.04 + open * 0.22), 1);
      openG.position.y = -R * open * 0.01;
      teeth.visible = cur.smile > 0.3;
      // blink every few seconds (double blink sometimes)
      blinkT -= dt; if (blinkT <= 0) { blinkK = 1; blinkT = 2 + Math.random() * 3.5; if (Math.random() < 0.2) setTimeout(() => { blinkK = 1; }, 220); }
      blinkK = Math.max(0, blinkK - dt * 7);
      const close = Math.sin(Math.min(1, blinkK) * Math.PI);
      eyes.forEach((e, i) => {
        const up = lerp(cur.lidUp, 0, close), low = cur.lidLow;
        e.upper.rotation.x = lerp(1.55, -0.85, Math.min(1.15, up));                                       // 1.55 = closed, -0.85 = open
        e.lower.rotation.x = lerp(0.75, -0.2, low);
        // gaze + tiny saccades
        const sx = Math.sin(time * 0.7 + i) * 0.02, sy = Math.sin(time * 0.53) * 0.015;
        e.ball.rotation.y = cur.gaze[0] * 0.5 + sx; e.ball.rotation.x = -cur.gaze[1] * 0.45 + sy;
      });
      brows.forEach((b, i) => { const s = i ? 1 : -1; b.position.y = R * (0.42 + cur.browY * 0.35 + (i ? cur.browAsym : -cur.browAsym * 0.3) * 0.3); b.rotation.z = -s * cur.browTilt * 0.9; });
      M.blush.opacity = cur.blush * 0.55;
    }

    // ---------------- body animation (procedural clips, blended) ----------------
    let clip = 'idle', clipT = 0, prevPose = null, blendT = 1;
    const jointsList = { hips, spine, chest, neck, head, sh: [armL.sh, armR.sh], up: [armL.upper, armR.upper], fo: [armL.fore, armR.fore], ha: [armL.hand, armR.hand], th: [legL.thigh, legR.thigh], sn: [legL.shin, legR.shin], ft: [legL.foot, legR.foot] };
    function zeroPose() { return { bodyY: 0, hipsY: 0.7, hipsRx: 0, hipsRy: 0, hipsRz: 0, spineRx: 0, spineRy: 0, chestRx: 0, chestRz: 0, neckRx: 0, neckRy: 0, headRx: 0, headRy: 0, headRz: 0, upRx: [0, 0], upRz: [-0.07, 0.07], upRy: [0, 0], foRx: [-0.25, -0.25], foRy: [1.25, -1.25], haRx: [0, 0], haRz: [0, 0], thRx: [0, 0], thRz: [0, 0], snRx: [0, 0], ftRx: [0, 0], curl: [0.35, 0.35] }; }
    const CLIPS = {
      idle(t, p) { const b = Math.sin(t * 1.6); p.hipsY += b * 0.003; p.chestRx = b * 0.012; p.hipsRz = Math.sin(t * 0.45) * 0.02; p.headRy = Math.sin(t * 0.37) * 0.12; p.headRx = Math.sin(t * 0.29) * 0.04; p.upRz = [-0.1 - b * 0.01, 0.1 + b * 0.01]; p.thRz = [0.02, -0.02]; },
      talk(t, p) { CLIPS.idle(t, p); p.headRx += Math.sin(t * 5.1) * 0.03; p.headRz = Math.sin(t * 2.3) * 0.04; p.upRx = [-0.35 - Math.max(0, Math.sin(t * 2.2)) * 0.25, 0]; p.foRx = [-0.9, -0.3]; p.upRz = [-0.25, 0.12]; },
      walk(t, p) { const s = Math.sin(t * 6.5), c = Math.abs(Math.cos(t * 6.5)); p.hipsY += c * 0.025; p.hipsRy = s * 0.08; p.spineRy = -s * 0.08; p.thRx = [s * 0.5, -s * 0.5]; p.snRx = [Math.max(0, -s) * 0.9, Math.max(0, s) * 0.9]; p.ftRx = [-Math.max(0, -s) * 0.3, -Math.max(0, s) * 0.3]; p.upRx = [-s * 0.5, s * 0.5]; p.foRx = [-0.35 - Math.max(0, s) * 0.3, -0.35 - Math.max(0, -s) * 0.3]; p.headRy = 0; },
      run(t, p) { const s = Math.sin(t * 10), c = Math.abs(Math.cos(t * 10)); p.bodyY = c * 0.06; p.hipsRy = s * 0.15; p.spineRx = 0.22; p.spineRy = -s * 0.2; p.thRx = [s * 0.9 - 0.15, -s * 0.9 - 0.15]; p.snRx = [Math.max(0, -s) * 1.6 + 0.2, Math.max(0, s) * 1.6 + 0.2]; p.upRx = [-s * 0.9, s * 0.9]; p.foRx = [-1.3, -1.3]; p.headRx = -0.15; p.curl = [0.9, 0.9]; },
      sit(t, p) { p.hipsY = 0.47; p.thRx = [-1.5, -1.5]; p.snRx = [1.45, 1.45]; p.thRz = [0.08, -0.08]; p.spineRx = -0.05; p.upRx = [-0.35, -0.35]; p.foRx = [-0.9, -0.9]; p.upRz = [-0.05, 0.05]; p.haRx = [0.3, 0.3]; const b = Math.sin(t * 1.6); p.chestRx = b * 0.01; p.headRy = Math.sin(t * 0.35) * 0.1; },
      sit_sad(t, p) { CLIPS.sit(t, p); p.spineRx = 0.32; p.chestRx = 0.12; p.neckRx = 0.35; p.headRx = 0.2; p.headRy = 0; p.upRx = [-0.65, -0.65]; p.upRz = [0.15, -0.15]; p.foRx = [-1.2, -1.2]; p.haRz = [-0.4, 0.4]; },
      wave(t, p) { CLIPS.idle(t, p); p.upRz = [-0.1, 2.5]; p.upRx = [0, -0.2]; p.foRx = [-0.25, -0.35]; p.foRy = [1.25, Math.sin(t * 9) * 0.5]; p.haRz = [0, Math.sin(t * 9) * 0.25]; p.headRz = 0.08; p.curl = [0.35, 0]; },
      think(t, p) { CLIPS.idle(t, p); p.upRx = [-0.1, -0.85]; p.upRy = [0, -0.59]; p.upRz = [-0.07, -1.57]; p.foRx = [-0.25, -2.26]; p.foRy = [1.25, 0]; p.haRx = [0, -0.3]; p.headRz = 0.08; p.headRy = -0.12; p.headRx = -0.1 + Math.sin(t * 0.8) * 0.02; p.curl = [0.4, 0.75]; },   // hand on chin (solved pose)
      cheer(t, p) { const j = Math.max(0, Math.sin(t * 5)); p.bodyY = j * 0.12; p.upRz = [-2.7, 2.7]; p.upRx = [0, 0]; p.foRx = [-0.3, -0.3]; p.thRx = [-j * 0.4, -j * 0.4]; p.snRx = [j * 0.8, j * 0.8]; p.headRx = -0.15; p.curl = [0.9, 0.9]; },
      count(t, p) { CLIPS.idle(t, p); p.upRx = [0, 0]; p.upRy = [0.15, -0.15]; p.upRz = [1.02, -1.02]; p.foRx = [-1.8, -1.8]; p.foRy = [0.06, -0.06]; p.haRx = [-0.2, -0.2 + Math.sin(t * 6) * 0.08]; p.neckRx = 0.25; p.headRx = 0.25; p.headRy = 0; p.curl = [0.55, 0.55]; },   // both hands in front of the chest (solved pose)
      point(t, p) { CLIPS.idle(t, p); p.upRx = [0, -1.45]; p.upRz = [-0.1, 0.1]; p.foRx = [-0.25, -0.05]; p.curl = [0.35, 0]; p.headRy = 0; },
    };
    const play = (n) => { if (!CLIPS[n]) throw new Error('Unknown animation ' + n); if (n === clip) return; prevPose = lastPose; clip = n; clipT = 0; blendT = 0; talkTarget = n === 'talk' ? talkTarget : talkTarget; };
    let lastPose = zeroPose();
    function lerpPose(a, b, k) { const o = {}; for (const key in b) o[key] = Array.isArray(b[key]) ? b[key].map((v, i) => lerp(a[key][i], v, k)) : lerp(a[key], b[key], k); return o; }
    function applyPose(p) {
      body.position.y = p.bodyY; hips.position.y = p.hipsY;
      hips.rotation.set(p.hipsRx, p.hipsRy, p.hipsRz); spine.rotation.set(p.spineRx, p.spineRy, 0); chest.rotation.set(p.chestRx, 0, p.chestRz);
      neck.rotation.set(p.neckRx, p.neckRy, 0); head.rotation.set(p.headRx, p.headRy, p.headRz);
      [armL, armR].forEach((A, i) => {
        A.upper.rotation.set(p.upRx[i], p.upRy[i], p.upRz[i]); A.fore.rotation.set(p.foRx[i], p.foRy[i], 0); A.hand.rotation.set(p.haRx[i], 0, p.haRz[i]);
        A.fingers.forEach((f, k) => { const c = p.curl[i] * (1 + k * 0.08); f.base.rotation.x = -c * 1.1; f.tip.rotation.x = -c * 1.3; });
        A.thumb.rotation.x = 0.2 - p.curl[i] * 0.6;
      });
      [legL, legR].forEach((L, i) => { L.thigh.rotation.set(p.thRx[i], 0, p.thRz[i]); L.shin.rotation.x = p.snRx[i]; L.foot.rotation.x = p.ftRx[i]; });
    }
    let time = 0;
    function update(dt) {
      time += dt; clipT += dt;
      const p = zeroPose(); CLIPS[clip](clipT, p);
      blendT = Math.min(1, blendT + dt / 0.35);
      const pose = prevPose && blendT < 1 ? lerpPose(prevPose, p, smooth(blendT)) : p;
      applyPose(pose); lastPose = pose;
      if (clip === 'talk') talkTarget = Math.max(0, Math.sin(time * 13) * 0.6 + Math.sin(time * 7.3) * 0.4) * 0.9;
      else if (!talkDriven) talkTarget = 0;
      applyFace(dt, time);
    }
    let talkDriven = false;
    function setTalk(level) { talkDriven = level != null; talkTarget = Math.max(0, Math.min(1, level || 0)); }
    function hold(obj, hand = 'R') { const g = hand === 'R' ? armR.grip : armL.grip; while (g.children.length) g.remove(g.children[0]); if (obj) g.add(obj); }
    setExpression('neutral'); update(0);
    return { group: root, setExpression, play, setTalk, hold, update, get expression() { return exprName; }, get animation() { return clip; }, EXPRESSIONS: Object.keys(EXPR), ANIMATIONS: Object.keys(CLIPS), rig: { hips, spine, chest, neck, head, headC, armL, armR, legL, legR } };
  }
  window.ZCharacters = { kid };
})();
