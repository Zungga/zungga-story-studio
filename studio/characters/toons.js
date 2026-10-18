/*
 * Zungga Story Studio — the cartoon cast (plush / felt look), consistent across every video.
 *   const c = ZCharacters.toon({ kind: 'cat' | 'boxkid' | 'planet', colors })
 *   → same API as ZCharacters.person: { group, setExpression, play, setTalk, setSeat, hold, update, EXPRESSIONS, ANIMATIONS, params, rig }
 * Colours are sampled from the Zungga character art.
 * cat     — round yellow creature, blue belly, blue-tipped ears, three soft hair tufts, ball-tipped tail
 * boxkid  — purple box-head kid, peach face, orange cap + overalls (pencil + wrench in the pocket)
 * planet  — shiny pink-magenta-lilac planet with a glowing ring, a hair curl, a bubble antenna and bubbles
 * Expressions include confused, dizzy (spinning eyes + stars) and angry (face turns red, smoke puffs).
 * Arms have elbows, so poses like hand-on-hip + pointing (front / up / side) work.
 */
(() => {
  'use strict';
  const T = THREE;
  const SRC = document.currentScript && document.currentScript.src;
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // the Zungga "Z" mascot badge that every cartoon wears (one shared texture)
  let LOGO = null;
  function logoMat() {
    if (!LOGO) { const t = new T.TextureLoader().load(SRC ? new URL('../assets/brand/zungga-mascot.png', SRC).href : 'assets/brand/zungga-mascot.png'); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
      LOGO = new T.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.25, roughness: 0.55, polygonOffset: true, polygonOffsetFactor: -2 }); }
    return LOGO;
  }
  // put the badge at point p (parent space), facing along normal n, size = width in metres
  function badge(parent, size, p, n = new T.Vector3(0, 0, 1)) {
    const m = new T.Mesh(new T.PlaneGeometry(size, size * 459 / 398), logoMat()); m.position.copy(p);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), n.clone().normalize()); m.castShadow = false; m.receiveShadow = true; parent.add(m); return m;
  }
  const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt)), smooth = (t) => t * t * (3 - 2 * t);
  function canvasTex(draw, w = 256, h = 256) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; }
  function add(parent, geo, mat, x = 0, y = 0, z = 0) { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
  const J = (parent, x = 0, y = 0, z = 0) => { const g = new T.Group(); g.position.set(x, y, z); parent.add(g); return g; };

  // colours from the reference art
  const PAL = {
    catBody: 0xf9c623, catBelly: 0x2c6bcf, catBlue: 0x2a62c4,
    boxHead: 0x9442c8, boxFace: 0xf6cdb4, cap: 0xf6912a, overalls: 0xf07a24, shoeSole: 0x5b2a9c,
    brow: 0x3b2416, iris: '#311a17',
  };

  // ---------- plush felt material: soft sheen + a fine fuzzy bump ----------
  let FUZZ = null;
  function fuzz() {
    if (FUZZ) return FUZZ;
    FUZZ = canvasTex((g, w, h) => { const im = g.createImageData(w, h); let s = 12345; for (let i = 0; i < im.data.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const v = 110 + (s % 90); im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); }, 256, 256);
    FUZZ.colorSpace = T.NoColorSpace; FUZZ.wrapS = FUZZ.wrapT = T.RepeatWrapping; FUZZ.repeat.set(6, 6); return FUZZ;
  }
  const felt = (c, o = {}) => new T.MeshPhysicalMaterial({ color: c, roughness: 0.88, sheen: 0.6, sheenRoughness: 0.55, sheenColor: new T.Color(c).lerp(new T.Color(0xffffff), 0.18), bumpMap: fuzz(), bumpScale: 0.5, ...o });
  const gloss = (c, o = {}) => new T.MeshPhysicalMaterial({ color: c, roughness: 0.25, clearcoat: 0.6, ...o });
  function roundBox(w, h, d, r = 0.04, seg = 5) {
    r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);   // a bevel can't be thicker than the box
    const s = new T.Shape(), x = w / 2 - r, y = h / 2 - r;
    s.moveTo(-x, -h / 2); s.lineTo(x, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -y); s.lineTo(w / 2, y); s.quadraticCurveTo(w / 2, h / 2, x, h / 2);
    s.lineTo(-x, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, y); s.lineTo(-w / 2, -y); s.quadraticCurveTo(-w / 2, -h / 2, -x, -h / 2);
    const g = new T.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: seg, curveSegments: 10 });
    g.center(); g.computeVertexNormals(); return g;
  }
  // a soft hair tuft: a teardrop that bends over at the tip (dense felt lock, not a spike)
  function tuft(len, rad, bend) {
    const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new T.Vector2(Math.max(0.0004, rad * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.7) * (1 - 0.3 * t)), t * len)); }
    const g = new T.LatheGeometry(pts, 20), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const t = p.getY(i) / len; p.setZ(i, p.getZ(i) + bend * len * t * t); p.setY(i, p.getY(i) - Math.abs(bend) * len * 0.25 * t * t * t); }
    g.computeVertexNormals(); return g;
  }

  // ---------- shared cartoon face ----------
  const EXPR = {
    neutral: { smile: 0.35, open: 0.0, width: 1, browY: 0, browTilt: 0, lidUp: 0.95, lidLow: 0.05, gaze: [0, 0] },
    smile: { smile: 0.8, open: 0.25, width: 1.05, browY: 0.04, browTilt: 0.05, lidUp: 0.92, lidLow: 0.15, gaze: [0, 0] },
    big_smile: { smile: 1, open: 0.85, width: 1.12, browY: 0.1, browTilt: 0.1, lidUp: 0.88, lidLow: 0.2, gaze: [0, 0] },
    sad: { smile: -0.7, open: 0.0, width: 0.9, browY: -0.02, browTilt: -0.4, lidUp: 0.7, lidLow: 0.05, gaze: [0, -0.3] },
    surprised: { smile: 0, open: 1, width: 0.7, browY: 0.3, browTilt: 0.05, lidUp: 1.1, lidLow: 0, gaze: [0, 0.05] },
    thinking: { smile: 0.2, open: 0.0, width: 0.85, browY: 0.12, browTilt: 0.25, lidUp: 0.9, lidLow: 0.1, gaze: [0.35, 0.4], browAsym: 0.2 },
    worried: { smile: -0.35, open: 0.2, width: 0.85, browY: 0.08, browTilt: -0.45, lidUp: 0.95, lidLow: 0.05, gaze: [-0.2, 0] },
    determined: { smile: 0.4, open: 0, width: 0.95, browY: -0.05, browTilt: 0.35, lidUp: 0.8, lidLow: 0.2, gaze: [0, 0] },
    idea: { smile: 0.95, open: 0.7, width: 1.05, browY: 0.3, browTilt: 0.1, lidUp: 1.08, lidLow: 0.15, gaze: [0, 0.35] },
    stern: { smile: -0.2, open: 0, width: 0.9, browY: -0.08, browTilt: 0.45, lidUp: 0.82, lidLow: 0.2, gaze: [0, 0] },
    confused: { smile: -0.1, open: 0.12, width: 0.6, browY: 0.12, browTilt: 0.1, lidUp: 0.92, lidLow: 0.1, gaze: [0.3, 0.25], browAsym: 0.45, browTwist: 0.5, tilt: 0.14 },
    dizzy: { smile: 0.1, open: 0.35, width: 0.8, browY: 0.15, browTilt: -0.2, lidUp: 0.95, lidLow: 0.05, gaze: [0, 0], dizzy: 1, wobble: 1 },
    angry: { smile: -0.6, open: 0.3, width: 0.95, browY: -0.12, browTilt: 0.75, lidUp: 0.75, lidLow: 0.3, gaze: [0, 0], angry: 1 },
  };
  function makeFace(parent, o) {
    const M = {
      white: new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.12, clearcoat: 1 }),
      iris: new T.MeshPhysicalMaterial({ map: canvasTex((g, w, h) => { const gr = g.createRadialGradient(w / 2, h * 0.55, w * 0.05, w / 2, h / 2, w / 2); gr.addColorStop(0, '#6b4028'); gr.addColorStop(0.55, PAL.iris); gr.addColorStop(1, '#0e0705'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#060302'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.27, 0, Math.PI * 2); g.fill(); }, 128, 128), roughness: 0.05, clearcoat: 1 }),
      spiral: new T.MeshBasicMaterial({ transparent: true, map: canvasTex((g, w, h) => { g.strokeStyle = '#3b2416'; g.lineWidth = 9; g.beginPath(); for (let a = 0; a < 14; a += 0.05) { const r = a * 4.2; const x = w / 2 + Math.cos(a) * r, y = h / 2 + Math.sin(a) * r; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }, 128, 128) }),
      hl: new T.MeshBasicMaterial({ color: 0xffffff }),
      brow: new T.MeshStandardMaterial({ color: o.brow ?? PAL.brow, roughness: 0.6 }),
      mouth: new T.MeshStandardMaterial({ color: 0x5a1a1f, roughness: 0.7 }), tongue: new T.MeshStandardMaterial({ color: 0xf06a7a, roughness: 0.5 }),
      line: new T.MeshStandardMaterial({ color: 0x3b2416, roughness: 0.6 }),
    };
    const eR = o.eyeR, eyes = [-1, 1].map((s) => {
      const x = s * o.sep, z = o.surfZ(x, o.eyeY), sock = J(parent, x, o.eyeY, z - eR * 0.35); sock.rotation.y = s * 0.12 + (o.eyeYaw || 0) * s;
      const ball = J(sock);
      const w = add(ball, new T.SphereGeometry(eR, 32, 24), M.white); w.scale.set(1, 1.18, 0.62);
      const irisG = J(ball, 0, 0, eR * 0.5);
      const ir = add(irisG, new T.SphereGeometry(eR * 0.68, 32, 24), M.iris); ir.scale.set(1, 1.15, 0.28);
      const h1 = add(irisG, new T.SphereGeometry(eR * 0.2, 12, 10), M.hl, -eR * 0.24, eR * 0.3, eR * 0.17); h1.scale.z = 0.4;
      const h2 = add(irisG, new T.SphereGeometry(eR * 0.09, 10, 8), M.hl, eR * 0.22, -eR * 0.2, eR * 0.17); h2.scale.z = 0.4;
      const spin = add(ball, new T.CircleGeometry(eR * 0.85, 32), M.spiral, 0, 0, eR * 0.64); spin.visible = false; spin.castShadow = false;
      const up = J(sock), lo = J(sock);
      const lu = add(up, new T.SphereGeometry(eR * 1.05, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), o.lid); lu.scale.set(1, 1.18, 0.66);
      const ll = add(lo, new T.SphereGeometry(eR * 1.04, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), o.lid); ll.scale.set(1, 1.18, 0.65);
      if (o.lashes) for (let k = 0; k < 3; k++) { const l = add(up, new T.CapsuleGeometry(eR * 0.06, eR * 0.32, 4, 6), M.line, s * eR * (0.55 + k * 0.17), eR * (1.05 - k * 0.12), eR * 0.3); l.rotation.z = -s * (0.5 + k * 0.35); }
      return { sock, irisG, up, lo, s, spin, iris: [ir, h1, h2] };
    });
    const brows = [-1, 1].map((s) => {
      const x = s * o.sep, y = o.eyeY + eR * 1.55, g = J(parent, x, y, o.surfZ(x, y) + eR * 0.02); g.rotation.y = s * 0.12;
      const c = new T.CatmullRomCurve3([new T.Vector3(-eR * 0.55, -eR * 0.08, 0), new T.Vector3(0, eR * 0.1, eR * 0.05), new T.Vector3(eR * 0.55, -eR * 0.08, 0)]);
      add(g, new T.TubeGeometry(c, 16, eR * 0.12, 8), M.brow); return g;
    });
    const mz = o.surfZ(0, o.mouthY), mouth = J(parent, 0, o.mouthY, mz + 0.002); mouth.rotation.x = o.mouthTilt ?? -0.15;
    const mw = o.mouthW ?? eR * 0.9, line = add(mouth, new T.BufferGeometry(), M.line);
    const openG = J(mouth, 0, 0, -0.003), shape = new T.Shape(); shape.moveTo(-1, 0); shape.bezierCurveTo(-0.5, 0.18, 0.5, 0.18, 1, 0); shape.bezierCurveTo(0.8, -1.2, -0.8, -1.2, -1, 0);
    add(openG, new T.ShapeGeometry(shape, 24), M.mouth); add(openG, new T.CircleGeometry(0.42, 20), M.tongue, 0, -0.55, 0.002).scale.set(1.1, 0.5, 1);
    const cur = { ...EXPR.neutral, browAsym: 0, browTwist: 0, dizzy: 0, angry: 0, tilt: 0, wobble: 0 }, target = { ...cur };
    let blinkT = 0.8 + Math.random() * 3, blinkK = 0, talk = 0, talkTarget = 0;
    function lip(smile, width, open, wave) {
      const w = mw * width, c = -smile * mw * 0.35, wv = wave * mw * 0.12;
      const curve = new T.CatmullRomCurve3([new T.Vector3(-w, smile * mw * 0.12, 0), new T.Vector3(-w * 0.5, c * 0.75 + wv, 0.003), new T.Vector3(0, c - wv, 0.004), new T.Vector3(w * 0.5, c * 0.75 + wv, 0.003), new T.Vector3(w, smile * mw * 0.12, 0)]);
      line.geometry.dispose(); line.geometry = new T.TubeGeometry(curve, 20, mw * 0.06 * (1 + open * 0.2), 8); line.visible = open < 0.08;
    }
    const KEYS = ['smile', 'open', 'width', 'browY', 'browTilt', 'lidUp', 'lidLow', 'browAsym', 'browTwist', 'dizzy', 'angry', 'tilt', 'wobble'];
    return {
      cur,
      set(n, instant) { Object.assign(target, { browAsym: 0, browTwist: 0, dizzy: 0, angry: 0, tilt: 0, wobble: 0 }, EXPR[n]); if (instant) { Object.assign(cur, target); cur.gaze = target.gaze.slice(); } },
      talk(v) { talkTarget = v; },
      update(dt, time) {
        for (const k of KEYS) cur[k] = damp(cur[k], target[k] ?? 0, 10, dt);
        cur.gaze = [damp(cur.gaze[0], target.gaze[0], 8, dt), damp(cur.gaze[1], target.gaze[1], 8, dt)];
        talk = damp(talk, talkTarget, 18, dt);
        const open = Math.min(1, cur.open + talk * 0.8);
        lip(cur.smile, cur.width, open, cur.browTwist);
        openG.visible = open >= 0.08; openG.scale.set(mw * cur.width * (0.75 + 0.25 * Math.abs(cur.smile)), mw * (0.25 + open * 0.95), 1); openG.rotation.z = cur.smile < -0.2 ? Math.PI : 0;
        blinkT -= dt; if (blinkT <= 0) { blinkK = 1; blinkT = 2.2 + Math.random() * 3; }
        blinkK = Math.max(0, blinkK - dt * 7); const close = cur.dizzy > 0.5 ? 0 : Math.sin(Math.min(1, blinkK) * Math.PI);
        for (const e of eyes) {
          e.up.rotation.x = lerp(1.6, -0.75, Math.min(1.12, lerp(cur.lidUp, 0, close))); e.lo.rotation.x = lerp(0.8, -0.15, cur.lidLow);
          e.irisG.position.set(cur.gaze[0] * eR * 0.28, cur.gaze[1] * eR * 0.28 + Math.sin(time * 0.6) * eR * 0.02, eR * 0.5);
          const dz = cur.dizzy > 0.5; e.spin.visible = dz; e.iris.forEach((m) => (m.visible = !dz)); e.spin.rotation.z = time * 6 * e.s;
        }
        // brows: height, inner-up/down tilt, one-brow-up (asym) and a crooked twist for "confused"
        brows.forEach((b, i) => { const s = i ? 1 : -1; b.position.y = o.eyeY + eR * (1.55 + cur.browY * 1.2 + (i ? cur.browAsym : -cur.browAsym * 0.4)); b.rotation.z = s * cur.browTilt * 0.8 + (i ? cur.browTwist * 0.5 : 0); });   // + tilt = inner ends down (angry / determined), − = inner ends up (sad / worried)
      },
    };
  }

  // ---------- arms with an elbow: upper → fore → mitten hand (+ a pointing finger) ----------
  function makeArm(parent, s, o) {
    const sh = J(parent, s * o.x, o.y, o.z ?? 0), upper = J(sh);
    const L1 = o.len * 0.5, L2 = o.len * 0.5, r = o.r;
    add(upper, new T.CapsuleGeometry(r, L1, 8, 16), o.mat, 0, -L1 / 2, 0);
    const fore = J(upper, 0, -L1, 0);
    add(fore, new T.SphereGeometry(r * 1.02, 16, 12), o.mat);
    add(fore, new T.CapsuleGeometry(r * 0.97, L2 - r * 0.6, 8, 16), o.mat, 0, -L2 / 2, 0);
    if (o.cuff) add(fore, new T.CylinderGeometry(r * 1.22, r * 1.22, L2 * 0.26, 20), o.cuff, 0, -L2 * 0.62, 0);
    const hand = J(fore, 0, -L2, 0);
    const mit = add(hand, new T.SphereGeometry(r * 1.45, 20, 16), o.hand, 0, -r * 0.3, 0); mit.scale.set(1, 1.08, 0.85);
    add(hand, new T.SphereGeometry(r * 0.6, 12, 10), o.hand, -s * r * 1.1, r * 0.1, r * 0.6);
    const finger = add(hand, new T.CapsuleGeometry(r * 0.38, r * 1.3, 6, 10), o.hand, 0, -r * 1.75, r * 0.15); finger.visible = false;
    const grip = J(hand, 0, -r * 0.9, r * 0.9);
    return { sh, upper, fore, hand, grip, finger, L1, L2 };
  }
  // two-bone IK: put the hand on targetW with the elbow pointing toward poleW → [ux, uy, uz, fx]
  function ik(A, targetW, poleW) {
    A.upper.rotation.set(0, 0, 0); A.fore.rotation.set(0, 0, 0); A.upper.updateMatrixWorld(true);
    const S = A.upper.getWorldPosition(new T.Vector3()), L1 = A.L1, L2 = A.L2 + 0.02;
    const toT = targetW.clone().sub(S), d = clamp(toT.length(), Math.abs(L1 - L2) + 1e-3, (L1 + L2) * 0.995), dir = toT.normalize();
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const pole = poleW.clone().normalize(), pp = pole.sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
    const E = S.clone().addScaledVector(dir, a).addScaledVector(pp, h), Tc = S.clone().addScaledVector(dir, d);
    const u = E.clone().sub(S).normalize(), f = Tc.clone().sub(E).normalize();
    const z = f.clone().sub(u.clone().multiplyScalar(f.dot(u))); if (z.lengthSq() < 1e-8) z.set(0, 0, 1); z.normalize();
    const y = u.clone().negate(), x = new T.Vector3().crossVectors(y, z);
    const q = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z)).premultiply(A.sh.getWorldQuaternion(new T.Quaternion()).invert());
    const e = new T.Euler().setFromQuaternion(q, 'XYZ');
    return [e.x, e.y, e.z, -Math.acos(clamp(u.dot(f), -1, 1))];
  }

  // ---------- planet gradient (pink → magenta → lilac, peach underside, sparkles) ----------
  function planetTex() {   // pink at the top melting into purple at the bottom, sparkles on top
    return canvasTex((g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);   // top of the ball = top of the texture
      gr.addColorStop(0, '#ff5fb0'); gr.addColorStop(0.28, '#ff66c8'); gr.addColorStop(0.5, '#e05ae0'); gr.addColorStop(0.72, '#a64ff0'); gr.addColorStop(1, '#7436e8');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.6})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * 1.8, 0, 6.3); g.fill(); }
      g.globalAlpha = 0.18; for (let i = 0; i < 4; i++) { g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.beginPath(); g.arc(w * (0.25 + i * 0.17), h * 0.45, w * 0.32, 0.5, 1.3); g.stroke(); } g.globalAlpha = 1;
    }, 512, 512);
  }

  // ---------- character builders ----------
  const BUILD = {
    cat(root, col) {
      const C = { body: PAL.catBody, belly: PAL.catBelly, blue: PAL.catBlue, ...col };
      const K = 0.56, H = 0.95 * K, M = { body: felt(C.body), belly: felt(C.belly), dark: felt(C.blue) };   // a helper: about half the hero's height
      const body = J(root), torso = J(body, 0, 0.09, 0); body.scale.setScalar(K);
      const RX = 0.36, RY = 0.43, RZ = 0.34, cy = 0.42;
      const egg = new T.SphereGeometry(1, 64, 48), ep = egg.attributes.position;
      for (let i = 0; i < ep.count; i++) { const y = ep.getY(i); const k = y > 0 ? 1 - 0.12 * y * y : 1 + 0.06 * (1 - (1 + y) * (1 + y)); ep.setX(i, ep.getX(i) * k); ep.setZ(i, ep.getZ(i) * k); }
      egg.computeVertexNormals();
      const bm = add(torso, egg, M.body, 0, cy, 0); bm.scale.set(RX, RY, RZ);
      const surfZ = (x, y) => { const yy = (y - cy) / RY, xx = x / RX, k = yy > 0 ? 1 - 0.12 * yy * yy : 1; const r2 = 1 - xx * xx / (k * k) - yy * yy; return r2 > 0 ? Math.sqrt(r2) * RZ * k : 0; };
      const belly = add(torso, new T.SphereGeometry(1, 48, 32), M.belly, 0, cy - 0.12, RZ * 0.42); belly.scale.set(RX * 0.74, RY * 0.6, RZ * 0.62);
      const face = makeFace(torso, { eyeR: 0.07, sep: 0.105, eyeY: cy + 0.15, mouthY: cy + 0.035, surfZ, lid: M.body, mouthW: 0.08, eyeYaw: 0.05 });
      { const c = new T.Vector3(0, cy - 0.12, RZ * 0.42), r = new T.Vector3(RX * 0.74, RY * 0.6, RZ * 0.62), x = 0, y = cy - 0.1, k = 1 - (x / r.x) ** 2 - ((y - c.y) / r.y) ** 2, z = c.z + r.z * Math.sqrt(Math.max(0, k));
        badge(torso, 0.11, new T.Vector3(x, y, z + 0.002), new T.Vector3((x - c.x) / r.x ** 2, (y - c.y) / r.y ** 2, (z - c.z) / r.z ** 2)); }
      for (const s of [-1, 1]) {   // cat ears: rounded triangles with a blue tip and a blue inner patch
        const ear = J(torso, s * 0.2, cy + 0.33, -0.02); ear.rotation.set(-0.05, 0, -s * 0.38);
        const e1 = add(ear, new T.ConeGeometry(0.085, 0.2, 28), M.body, 0, 0.08, 0); e1.scale.z = 0.6;
        const e2 = add(ear, new T.ConeGeometry(0.045, 0.1, 24), M.dark, 0, 0.135, 0.004); e2.scale.z = 0.62;
        const e3 = add(ear, new T.ConeGeometry(0.045, 0.1, 20), M.dark, 0, 0.07, 0.03); e3.scale.set(1, 1, 0.25);
      }
      // three dense, soft hair tufts on top (curl forward and out)
      const hair = [];
      for (const [x, ry, rz, len, rad] of [[0.005, 0.2, -0.1, 0.17, 0.062], [-0.06, 0.6, 0.55, 0.13, 0.05], [0.07, -0.5, -0.6, 0.13, 0.05]]) { const t = add(torso, tuft(len, rad, 0.7), M.body, x, cy + RY * 0.86, 0.01); t.rotation.set(-0.25, ry, rz); hair.push({ m: t, rx: -0.25, rz, k: hair.length }); }
      const tailC = new T.CatmullRomCurve3([new T.Vector3(0, 0.12, -RZ * 0.85), new T.Vector3(0.1, 0.08, -RZ * 1.15), new T.Vector3(0.28, 0.12, -RZ * 1.1), new T.Vector3(0.38, 0.22, -RZ * 0.8)]);
      const tail = J(torso); add(tail, new T.TubeGeometry(tailC, 24, 0.02, 10), M.body); add(tail, new T.SphereGeometry(0.05, 20, 16), M.belly, 0.38, 0.23, -RZ * 0.78);
      const armOpt = { x: RX * 0.78, y: cy - 0.02, z: RZ * 0.5, len: 0.27, r: 0.042, mat: M.body, hand: M.body };
      const armL = makeArm(torso, -1, armOpt), armR = makeArm(torso, 1, armOpt);
      const feet = [-1, 1].map((s) => { const f = J(body, s * 0.13, 0, 0.02); const fm = add(f, new T.SphereGeometry(1, 28, 20), M.body, 0, 0.055, 0.03); fm.scale.set(0.08, 0.06, 0.11); const sole = add(f, new T.SphereGeometry(1, 24, 16), M.dark, 0, 0.018, 0.035); sole.scale.set(0.075, 0.02, 0.1); return f; });
      return { H, body, torso, head: torso, face, armL, armR, feet, tail, hair, sitH: 0.1 * K, tintMats: [M.body], headTop: () => torso.localToWorld(new T.Vector3(0, cy + RY * 1.1, 0)),
        chin: () => torso.localToWorld(new T.Vector3(0, cy - 0.02, surfZ(0, cy - 0.02) + 0.04)), chest: () => torso.localToWorld(new T.Vector3(0, cy - 0.1, surfZ(0, cy - 0.1) + 0.14)),
        hip: (s) => torso.localToWorld(new T.Vector3(s * RX * 0.95, cy - 0.16, 0.08)), headFollows: false };
    },
    boxkid(root, col) {
      const C = { head: PAL.boxHead, face: PAL.boxFace, cap: PAL.cap, overalls: PAL.overalls, sole: PAL.shoeSole, ...col };
      const H = 1.08, M = { head: felt(C.head), face: felt(C.face, { bumpScale: 0.25 }), cap: felt(C.cap), over: felt(C.overalls), sole: felt(C.sole), btn: gloss(0xf2c27a) };
      const body = J(root), hips = J(body, 0, 0.3, 0), chest = J(hips, 0, 0.05, 0);
      // two separate legs (overall trouser legs) with a small gap, chunky orange shoes with purple soles + toe caps
      const legs = [-1, 1].map((s) => {
        const leg = J(hips, s * 0.105, 0, 0);
        add(leg, new T.CapsuleGeometry(0.05, 0.14, 8, 16), M.over, 0, -0.12, 0);
        add(leg, roundBox(0.12, 0.1, 0.19, 0.045), M.cap, 0, -0.245, 0.03);
        add(leg, roundBox(0.13, 0.035, 0.2, 0.016), M.sole, 0, -0.288, 0.03);
        const toe = add(leg, new T.SphereGeometry(1, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), M.sole, 0, -0.27, 0.095); toe.scale.set(0.06, 0.04, 0.035); toe.rotation.x = 0.2;
        return leg;
      });
      add(chest, roundBox(0.3, 0.26, 0.22, 0.09), M.head, 0, 0.13, 0);
      const skirt = add(hips, new T.CylinderGeometry(0.16, 0.19, 0.16, 32), M.over, 0, 0.02, 0); skirt.scale.z = 0.8;
      add(chest, roundBox(0.26, 0.17, 0.05, 0.03), M.over, 0, 0.12, 0.095);
      add(chest, roundBox(0.15, 0.08, 0.02, 0.012), M.over, 0, 0.09, 0.125);
      const pencil = J(chest, -0.03, 0.13, 0.12); add(pencil, new T.CylinderGeometry(0.008, 0.008, 0.08, 8), gloss(0xfcd34d)); add(pencil, new T.ConeGeometry(0.008, 0.02, 8), gloss(0x3b2416), 0, 0.05, 0);
      const wrench = J(chest, 0.035, 0.135, 0.12); wrench.rotation.z = -0.15; add(wrench, new T.BoxGeometry(0.012, 0.07, 0.006), gloss(0x9ca3af, { metalness: 0.7 })); add(wrench, new T.TorusGeometry(0.014, 0.005, 6, 12, Math.PI * 1.4), gloss(0x9ca3af, { metalness: 0.7 }), 0, 0.045, 0);
      for (const s of [-1, 1]) { const st = add(chest, roundBox(0.035, 0.16, 0.02, 0.008), M.over, s * 0.1, 0.2, 0.08); st.rotation.x = -0.15; add(chest, new T.SphereGeometry(0.016, 14, 10), M.btn, s * 0.1, 0.19, 0.12); }
      const neck = J(chest, 0, 0.27, 0), head = J(neck, 0, 0.18, 0);
      add(head, roundBox(0.42, 0.36, 0.36, 0.07), M.head);
      add(head, roundBox(0.37, 0.305, 0.04, 0.055), M.face, 0, -0.005, 0.17);   // big face, thin purple border
      const face = makeFace(head, { eyeR: 0.056, sep: 0.082, eyeY: 0.025, mouthY: -0.08, surfZ: () => 0.192, lid: M.face, mouthW: 0.062 });
      // the cap sits ON the head (raised so it doesn't sink in), brim forward, button + loop on top
      const cap = J(head, 0, 0.215, 0.02); cap.rotation.x = -0.16;
      const dome = add(cap, new T.SphereGeometry(0.205, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), M.cap); dome.scale.set(1.1, 0.8, 1.06);
      add(cap, new T.CylinderGeometry(0.226, 0.226, 0.03, 40, 1, true), M.cap, 0, 0.012, 0).scale.z = 0.95;   // band
      const brim = add(cap, new T.CylinderGeometry(0.2, 0.2, 0.025, 40, 1, false, -1.1, 2.2), M.cap, 0, 0.006, 0.06); brim.scale.set(1, 1, 1.3);
      add(cap, new T.SphereGeometry(0.026, 14, 10), M.cap, 0, 0.165, 0);
      add(cap, new T.TorusGeometry(0.022, 0.008, 8, 16), M.cap, 0, 0.2, 0);
      badge(cap, 0.07, new T.Vector3(0, 0.075, 0.198), new T.Vector3(0, 0.45, 1));   // Zungga badge on the cap
      const armOpt = { x: 0.19, y: 0.22, z: 0.02, len: 0.3, r: 0.045, mat: M.head, hand: M.head, cuff: M.over };
      const armL = makeArm(chest, -1, armOpt), armR = makeArm(chest, 1, armOpt);
      return { H, body, torso: chest, head, face, armL, armR, legs, sitH: 0.3, tintMats: [M.face], headTop: () => head.localToWorld(new T.Vector3(0, 0.42, 0)),
        chin: () => head.localToWorld(new T.Vector3(0.02, -0.17, 0.2)), chest: () => chest.localToWorld(new T.Vector3(0, 0.12, 0.27)),
        hip: (s) => hips.localToWorld(new T.Vector3(s * 0.2, 0.04, 0.05)), headFollows: true };
    },
    planet(root, col) {
      const H = 1.25, R = 0.2;
      const body = J(root, 0, 0.95, 0);
      const ptex = planetTex(); const shell = new T.MeshPhysicalMaterial({ map: ptex, emissiveMap: ptex, emissive: 0xffffff, emissiveIntensity: 0.22, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.9, iridescenceIOR: 1.35, sheen: 0.6, sheenColor: new T.Color(0xffd6f5) });
      add(body, new T.SphereGeometry(R, 64, 48), shell);
      const halo = add(body, new T.SphereGeometry(R * 1.12, 32, 24), new T.MeshBasicMaterial({ color: 0xe48cff, transparent: true, opacity: 0.12, blending: T.AdditiveBlending, depthWrite: false })); halo.castShadow = false;
      const ringM = new T.MeshPhysicalMaterial({ color: 0xfff1d6, emissive: 0xffd9f0, emissiveIntensity: 1.6, roughness: 0.3, transparent: true, opacity: 0.92 });
      const ring = J(body); ring.rotation.set(Math.PI / 2 + 0.42, 0.18, -0.22);
      const ringIn = J(ring); add(ringIn, new T.TorusGeometry(R * 1.55, R * 0.04, 12, 96), ringM);
      const ant = J(body, -R * 0.38, R * 0.84, 0.02); ant.rotation.z = 0.35;
      add(ant, new T.CylinderGeometry(R * 0.04, R * 0.05, R * 0.6, 8), shell, 0, R * 0.25, 0);
      add(ant, new T.SphereGeometry(R * 0.2, 24, 16), new T.MeshPhysicalMaterial({ color: 0xc9a6ff, emissive: 0x9fb8ff, emissiveIntensity: 0.5, roughness: 0.05, clearcoat: 1, iridescence: 1, transparent: true, opacity: 0.9 }), 0, R * 0.62, 0);
      const curl = add(body, tuft(R * 1.0, R * 0.3, -1.0), shell, R * 0.3, R * 0.82, 0); curl.rotation.set(0, 1.6, -0.5); const hair = [{ m: curl, rx: 0, rz: -0.5, k: 0, big: true }];   // a soft hair curl on top
      const surfZ = (x, y) => Math.sqrt(Math.max(0, R * R - x * x - y * y));
      { const d = new T.Vector3(0.42, -0.5, 0.76).normalize(); badge(body, 0.06, d.clone().multiplyScalar(R * 1.004), d); }
      const lidM = new T.MeshPhysicalMaterial({ color: 0xe9a0f0, emissive: 0xb06cff, emissiveIntensity: 0.3, roughness: 0.2 });
      const face = makeFace(body, { eyeR: 0.048, sep: 0.07, eyeY: 0.035, mouthY: -0.065, surfZ, lid: lidM, mouthW: 0.045, brow: 0x5a2d7a, mouthTilt: -0.4 });
      const bubbleM = new T.MeshPhysicalMaterial({ color: 0xffd6ff, emissive: 0xff9df0, emissiveIntensity: 0.5, roughness: 0.05, iridescence: 1, transparent: true, opacity: 0.6 });
      const bubbles = []; for (let i = 0; i < 6; i++) { const b = add(body, new T.SphereGeometry(R * (0.08 + (i % 3) * 0.04), 16, 12), bubbleM); b.castShadow = false; bubbles.push({ m: b, k: i / 6 }); }
      const sp = new T.BufferGeometry(), N = 70, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) pos.set([(Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.4], i * 3);
      sp.setAttribute('position', new T.BufferAttribute(pos, 3));
      const sparkles = new T.Points(sp, new T.PointsMaterial({ color: 0xffd6ff, size: 0.013, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false })); body.add(sparkles);
      body.add(new T.PointLight(0xd68cff, 0.9, 1.6, 2));
      const gL = J(body, -R * 1.3, -R * 0.4, R * 0.4), gR = J(body, R * 1.3, -R * 0.4, R * 0.4);
      const fake = (g) => ({ sh: g, upper: g, fore: g, hand: g, grip: g, finger: null, L1: 0, L2: 0 });
      return { H, body, torso: body, head: body, face, armL: fake(gL), armR: fake(gR), hair, ring: ringIn, bubbles, sparkles, floating: true, tintMats: [shell], headTop: () => body.localToWorld(new T.Vector3(0, R * 1.3, 0)),
        chin: () => body.localToWorld(new T.Vector3(0, -R, R)), chest: () => body.localToWorld(new T.Vector3(0, 0, R * 1.5)), hip: (s) => body.localToWorld(new T.Vector3(s * R, -R, 0)), headFollows: false };
    },
    // ---------- the box-folk: everyone in the world shares the hero's box-head design ----------
    // look: { age: kid|teen|adult|old, build (0.8–1.3), head, face, top, top2, bottom, shoe, hairColor, outfit, bottomType, hair, hat, extras:[], prop }
    folk(root, col, L) {
      const AGE = { kid: { hw: 0.42, hh: 0.36, th: 0.26, tw: 0.3, leg: 0.17, arm: 0.3 }, teen: { hw: 0.42, hh: 0.36, th: 0.33, tw: 0.31, leg: 0.26, arm: 0.36 },
        adult: { hw: 0.44, hh: 0.38, th: 0.42, tw: 0.34, leg: 0.36, arm: 0.44 }, old: { hw: 0.44, hh: 0.38, th: 0.38, tw: 0.35, leg: 0.3, arm: 0.4, hunch: 0.16 } }[L.age || 'adult'];
      const bk = L.build ?? 1, tw = AGE.tw * bk, td = AGE.tw * 0.72 * bk, hw = AGE.hw, hh = AGE.hh, hd = hh;
      const M = { head: felt(L.head ?? 0x3b82f6), face: felt(L.face ?? 0xf6cdb4, { bumpScale: 0.25 }), top: felt(L.top ?? 0xffffff), top2: felt(L.top2 ?? 0x1f2a52),
        bottom: felt(L.bottom ?? 0x334155), shoe: felt(L.shoe ?? 0x2b2b30), sole: felt(0x2a2a30), hair: felt(L.hairColor ?? 0x2b1a12), gold: gloss(0xf2c14e, { metalness: 0.6 }), dark: felt(0x222228), white: felt(0xf8f8f8), silver: gloss(0xdfe6ee, { metalness: 0.5 }) };
      const shoeH = 0.09, hipY = shoeH + AGE.leg;
      const body = J(root), hips = J(body, 0, hipY, 0), chest = J(hips, 0, 0.04, 0);
      if (AGE.hunch) chest.rotation.x = AGE.hunch;
      const bt = L.bottomType || 'pants', longDress = bt === 'long_dress', dress = bt === 'dress' || longDress;
      // legs: trousers / shorts / bare legs under a dress
      const legs = [-1, 1].map((s) => {
        const leg = J(hips, s * tw * 0.3, 0, 0), legM = dress || bt === 'shorts' ? M.face : M.bottom;
        if (!longDress) add(leg, new T.CapsuleGeometry(0.045 * Math.min(1.2, bk), AGE.leg - 0.05, 8, 16), legM, 0, -AGE.leg / 2, 0);
        if (bt === 'shorts') add(leg, new T.CapsuleGeometry(0.06 * bk, AGE.leg * 0.25, 8, 16), M.bottom, 0, -AGE.leg * 0.18, 0);
        add(leg, roundBox(0.12, shoeH, 0.19, 0.04), M.shoe, 0, -AGE.leg - shoeH / 2 + 0.01, 0.03);
        add(leg, roundBox(0.13, 0.03, 0.2, 0.012), M.sole, 0, -AGE.leg - shoeH + 0.022, 0.03);
        return leg;
      });
      // torso + outfit
      const ot = L.outfit || 'tshirt', topY = AGE.th / 2;
      const torsoM = ot === 'suit' || ot === 'pilot' ? M.top2 : M.top;
      add(chest, roundBox(tw, AGE.th, td, 0.08), torsoM, 0, topY, 0);
      const fz = td / 2;   // front of the torso
      const waist = add(hips, new T.CylinderGeometry(tw * 0.5, tw * 0.55, 0.1, 32), dress ? M.bottom : M.bottom, 0, 0.02, 0); waist.scale.z = 0.78;
      if (dress) { const len = longDress ? AGE.leg + 0.02 : AGE.leg * 0.55, sk = add(hips, new T.CylinderGeometry(tw * 0.55, tw * (longDress ? 0.68 : 0.78), len, 36, 1, true), M.bottom, 0, 0.04 - len / 2, 0); sk.scale.z = 0.8; sk.material.side = T.DoubleSide; }
      if (ot === 'overalls') {
        add(chest, roundBox(tw * 0.85, AGE.th * 0.62, 0.05, 0.03), M.top2, 0, AGE.th * 0.42, fz - 0.005);
        add(chest, roundBox(tw * 0.48, AGE.th * 0.3, 0.02, 0.012), M.top2, 0, AGE.th * 0.32, fz + 0.025);
        for (const s of [-1, 1]) { add(chest, roundBox(0.035, AGE.th * 0.55, 0.02, 0.008), M.top2, s * tw * 0.33, AGE.th * 0.72, fz - 0.01); add(chest, new T.SphereGeometry(0.016, 14, 10), M.gold, s * tw * 0.33, AGE.th * 0.7, fz + 0.025); }
      }
      if (ot === 'shirt' || ot === 'suit' || ot === 'pilot' || ot === 'cardigan') {   // collar (+ tie)
        for (const s of [-1, 1]) { const c = add(chest, new T.BoxGeometry(0.07, 0.04, 0.012), ot === 'shirt' || ot === 'cardigan' ? M.top : M.white, s * 0.04, AGE.th - 0.02, fz - 0.01); c.rotation.set(-0.3, 0, s * 0.5); }
      }
      if (ot === 'suit' || ot === 'pilot') {   // shirt V + lapels on the jacket
        const v = add(chest, new T.CircleGeometry(0.075, 3), M.white, 0, AGE.th - 0.07, fz + 0.002); v.rotation.z = -Math.PI / 2; v.scale.set(1.2, 0.9, 1);
        for (let i = 0; i < 2; i++) add(chest, new T.SphereGeometry(0.014, 12, 8), ot === 'pilot' ? M.gold : M.dark, 0.01, AGE.th * (0.42 - i * 0.16), fz + 0.012);
        if (ot === 'pilot') { const w = add(chest, new T.BoxGeometry(0.08, 0.018, 0.006), M.gold, -tw * 0.25, AGE.th * 0.72, fz + 0.008); add(chest, new T.SphereGeometry(0.014, 10, 8), M.gold, -tw * 0.25, AGE.th * 0.72, fz + 0.012); }
      }
      if ((L.extras || []).includes('tie') || ot === 'suit' || ot === 'pilot') {
        const tie = J(chest, 0, AGE.th - 0.035, fz + 0.012); add(tie, new T.SphereGeometry(0.014, 12, 8), M.top2.color.getHex() === M.white.color.getHex() ? M.dark : felt(L.tie ?? 0xc0392b));
        const blade = add(tie, new T.CylinderGeometry(0.012, 0.025, AGE.th * 0.45, 4), felt(L.tie ?? 0xc0392b), 0, -AGE.th * 0.24, 0); blade.scale.z = 0.3;
      }
      if ((L.extras || []).includes('id_card')) {   // staff ID card on a lanyard (bank, office)
        const ly = felt(L.lanyard ?? 0x7c3aed);
        for (const s of [-1, 1]) { const st = add(chest, new T.CylinderGeometry(0.004, 0.004, AGE.th * 0.42, 6), ly, s * 0.035, AGE.th * 0.74, fz + 0.008); st.rotation.z = s * 0.22; }
        add(chest, roundBox(0.05, 0.065, 0.006, 0.006), M.white, 0, AGE.th * 0.5, fz + 0.012);
        add(chest, new T.BoxGeometry(0.036, 0.016, 0.002), ly, 0, AGE.th * 0.52, fz + 0.016);
        add(chest, new T.BoxGeometry(0.03, 0.006, 0.002), M.dark, 0, AGE.th * 0.485, fz + 0.016);
      }
      if (ot === 'hoodie') {
        const hood = add(chest, new T.SphereGeometry(1, 24, 16), M.top, 0, AGE.th * 0.92, -td * 0.42); hood.scale.set(tw * 0.42, AGE.th * 0.22, td * 0.32);
        add(chest, roundBox(tw * 0.62, AGE.th * 0.28, 0.02, 0.02), felt(new T.Color(L.top ?? 0xffffff).multiplyScalar(0.85).getHex()), 0, AGE.th * 0.22, fz + 0.006);
        for (const s of [-1, 1]) add(chest, new T.CylinderGeometry(0.004, 0.004, 0.08, 6), M.white, s * 0.025, AGE.th * 0.82, fz + 0.01);
      }
      if (ot === 'cardigan') { add(chest, new T.BoxGeometry(0.035, AGE.th * 0.96, 0.01), M.top2, 0, AGE.th / 2, fz + 0.003); for (let i = 0; i < 3; i++) add(chest, new T.SphereGeometry(0.012, 10, 8), M.gold, 0.03, AGE.th * (0.25 + i * 0.22), fz + 0.01); }
      if (ot === 'apron') { add(chest, roundBox(tw * 0.8, AGE.th * 0.95 + 0.12, 0.02, 0.015), M.top2, 0, AGE.th * 0.42 - 0.06, fz + 0.006); add(chest, roundBox(tw * 0.4, AGE.th * 0.18, 0.012, 0.01), felt(new T.Color(L.top2 ?? 0x1f2a52).multiplyScalar(0.8).getHex()), 0, AGE.th * 0.2, fz + 0.018); }
      if (ot === 'hi_vis') {   // reflective safety vest
        const vest = felt(0xff8a1f); add(chest, roundBox(tw * 1.03, AGE.th * 0.9, td * 1.04, 0.07), vest, 0, AGE.th * 0.47, 0);
        for (const y of [0.3, 0.55]) add(chest, new T.BoxGeometry(tw * 1.05, 0.025, td * 1.06), M.silver, 0, AGE.th * y, 0);
      }
      if (ot === 'kurti') { const k = add(hips, new T.CylinderGeometry(tw * 0.56, tw * 0.66, AGE.leg * 0.55, 32, 1, true), M.top, 0, -AGE.leg * 0.22, 0); k.scale.z = 0.8; k.material.side = T.DoubleSide;
        const dup = add(chest, new T.TorusGeometry(tw * 0.42, 0.025, 8, 24, Math.PI), felt(L.top2 ?? 0xff4f8b), 0, AGE.th * 0.86, fz * 0.3); dup.rotation.set(0.25, 0, Math.PI); }
      if (ot === 'shawl') { const sh = add(chest, roundBox(tw * 1.08, AGE.th * 0.45, td * 1.06, 0.06), M.top2, 0, AGE.th * 0.8, 0); }
      { const zOut = ot === 'hi_vis' ? td * 0.52 + 0.004 : ot === 'apron' || ot === 'overalls' ? fz + 0.022 : ot === 'shawl' ? td * 0.53 + 0.004 : fz + 0.004;
        badge(chest, L.age === 'kid' ? 0.055 : 0.06, new T.Vector3(tw * 0.24, AGE.th * (ot === 'shawl' ? 0.42 : ot === 'apron' ? 0.55 : 0.68), zOut)); }
      // neck + box head with the peach face panel
      const neck = J(chest, 0, AGE.th + 0.01, 0), head = J(neck, 0, hh / 2 + 0.01, 0);
      if (AGE.hunch) head.rotation.x = -AGE.hunch * 0.6;
      add(head, roundBox(hw, hh, hd, 0.07), M.head);
      const pw = hw * 0.88, ph = hh * 0.85;
      add(head, roundBox(pw, ph, 0.04, 0.055), M.face, 0, -0.005, hd / 2 - 0.01);
      const faceZ = hd / 2 + 0.012, female = !!L.female, ex = L.extras || [];
      const face = makeFace(head, { eyeR: L.age === 'kid' ? 0.056 : 0.052, sep: pw * 0.22, eyeY: ph * 0.08, mouthY: -ph * 0.27, surfZ: () => faceZ, lid: M.face, mouthW: 0.05, lashes: female, brow: ex.includes('grey_brows') ? 0xbfbfbf : undefined });
      // hair (on the box) and hats
      const top = hh / 2, hair = L.hair || 'none';
      const slab = (w, h, d, x, y, z) => add(head, roundBox(w, h, d, Math.min(h, d) * 0.45), M.hair, x, y, z);
      if (['short', 'bun', 'pigtails', 'long', 'ponytail', 'spiky', 'side'].includes(hair)) {
        slab(hw * 1.03, 0.035, hd * 1.03, 0, top + 0.005, 0);
        const fr = J(head, hair === 'side' ? -0.05 : 0, top - 0.008, hd / 2 + 0.005); fr.rotation.z = hair === 'side' ? 0.18 : 0;
        const fg = add(fr, new T.CapsuleGeometry(0.022, (hair === 'side' ? hw * 0.55 : hw * 0.66), 6, 12), M.hair); fg.rotation.z = Math.PI / 2;
        for (const s2 of [-1, 1]) add(head, roundBox(0.03, hh * 0.32, hd * 0.6, 0.012), M.hair, s2 * (hw / 2 + 0.006), top - hh * 0.14, -hd * 0.1);   // sideburns
      }
      if (hair === 'spiky') for (let i = -2; i <= 2; i++) { const c = add(head, new T.ConeGeometry(0.04, 0.09, 10), M.hair, i * 0.075, top + 0.07, (i % 2) * 0.05); c.rotation.z = -i * 0.18; }
      if (hair === 'bun' || hair === 'grey_bun') { if (hair === 'grey_bun') slab(hw * 1.04, 0.06, hd * 1.04, 0, top + 0.01, 0); add(head, new T.SphereGeometry(0.085, 20, 14), M.hair, 0, top + 0.07, -hd * 0.25); }
      if (hair === 'pigtails') for (const s of [-1, 1]) { add(head, new T.SphereGeometry(0.07, 18, 12), M.hair, s * (hw / 2 + 0.035), top - 0.05, -0.02); add(head, new T.SphereGeometry(0.03, 12, 8), felt(L.accent ?? 0xff4f8b), s * (hw / 2 + 0.01), top - 0.0, 0.01); }
      if (hair === 'long') { slab(hw * 1.06, hh * 1.25, 0.06, 0, top - hh * 0.55, -hd / 2 - 0.02); for (const s of [-1, 1]) slab(0.05, hh * 0.85, hd * 0.9, s * (hw / 2 + 0.015), top - hh * 0.38, -0.02); }
      if (hair === 'ponytail') { add(head, new T.SphereGeometry(0.06, 16, 12), M.hair, 0, top - 0.02, -hd / 2 - 0.03); add(head, new T.CapsuleGeometry(0.04, 0.14, 6, 12), M.hair, 0, top - 0.13, -hd / 2 - 0.05); }
      if (hair === 'grey_rim') { for (const s of [-1, 1]) slab(0.045, hh * 0.45, hd * 0.85, s * (hw / 2 + 0.012), hh * 0.08, -0.03); slab(hw * 0.95, hh * 0.4, 0.045, 0, hh * 0.08, -hd / 2 - 0.012); }
      const hat = L.hat || 'none';
      if (hat === 'cap') { const cap = J(head, 0, top + 0.038, 0.02); cap.rotation.x = -0.16; const dm = add(cap, new T.SphereGeometry(hw * 0.49, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), felt(L.hatColor ?? 0xf6912a)); dm.scale.set(1.1, 0.8, 1.06); const br = add(cap, new T.CylinderGeometry(hw * 0.47, hw * 0.47, 0.025, 40, 1, false, -1.1, 2.2), dm.material, 0, 0.006, 0.06); br.scale.set(1, 1, 1.3); }
      if (hat === 'driver' || hat === 'pilot') {   // peaked uniform cap with a badge
        const hc = felt(L.hatColor ?? (hat === 'pilot' ? 0x1b2a4a : 0x1e40af)), cap = J(head, 0, top + 0.045, 0);
        add(cap, new T.CylinderGeometry(hw * 0.5, hw * 0.46, 0.09, 32), hc, 0, 0.03, 0);
        add(cap, new T.CylinderGeometry(hw * 0.47, hw * 0.47, 0.022, 32), hat === 'pilot' ? M.gold : M.dark, 0, -0.005, 0);
        const visor = add(cap, new T.CylinderGeometry(hw * 0.46, hw * 0.46, 0.015, 32, 1, false, -0.9, 1.8), M.dark, 0, -0.02, 0.05); visor.scale.z = 1.25; visor.rotation.x = 0.15;
        add(cap, new T.SphereGeometry(0.022, 12, 8), M.gold, 0, 0.04, hw * 0.5);
      }
      if (hat === 'hard_hat') {
        const hc = felt(L.hatColor ?? 0xfacc15, { roughness: 0.4, sheen: 0.2 }), cap = J(head, 0, top + 0.02, 0);
        const dm = add(cap, new T.SphereGeometry(hw * 0.56, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), hc); dm.scale.set(1, 0.72, 1);
        add(cap, new T.CylinderGeometry(hw * 0.66, hw * 0.66, 0.018, 36), hc, 0, 0.005, 0.02);
        add(cap, new T.BoxGeometry(0.035, 0.03, hw * 1.05), hc, 0, hw * 0.39, 0);
      }
      // face extras
      if (ex.includes('glasses') || ex.includes('sunglasses')) {
        const gm = gloss(ex.includes('sunglasses') ? 0x111111 : (L.glassColor ?? 0x2b2b30), { metalness: 0.4 });
        for (const s of [-1, 1]) { const rim = add(head, new T.TorusGeometry(0.06, 0.008, 8, 28), gm, s * pw * 0.22, ph * 0.08, faceZ + 0.03); if (ex.includes('sunglasses')) add(head, new T.CircleGeometry(0.058, 24), gloss(0x1a1a22), s * pw * 0.22, ph * 0.08, faceZ + 0.031); }
        add(head, new T.BoxGeometry(0.05, 0.01, 0.01), gm, 0, ph * 0.11, faceZ + 0.03);
      }
      if (ex.includes('moustache')) { const mc = new T.CatmullRomCurve3([new T.Vector3(-0.055, -0.01, 0), new T.Vector3(-0.02, 0.008, 0.006), new T.Vector3(0.02, 0.008, 0.006), new T.Vector3(0.055, -0.01, 0)]); add(head, new T.TubeGeometry(mc, 16, 0.014, 8), ex.includes('grey_brows') ? felt(0xd4d4d4) : M.hair, 0, -ph * 0.17, faceZ + 0.008); }
      if (ex.includes('beard')) { const bd = add(head, roundBox(pw * 0.5, ph * 0.14, 0.025, 0.012), M.hair, 0, -ph * 0.47, faceZ - 0.004); }   // a small chin beard under the mouth
      if (ex.includes('blush')) for (const s of [-1, 1]) { const b = add(head, new T.CircleGeometry(0.025, 16), new T.MeshBasicMaterial({ color: 0xff8fa8, transparent: true, opacity: 0.55 }), s * pw * 0.33, -ph * 0.12, faceZ + 0.002); b.castShadow = false; }
      if (ex.includes('headset')) {
        const hm = gloss(0x1f2937); const arc = add(head, new T.TorusGeometry(hw * 0.56, 0.012, 8, 32, Math.PI), hm, 0, 0.02, 0); arc.rotation.y = Math.PI / 2;
        for (const s of [-1, 1]) add(head, new T.CylinderGeometry(0.045, 0.045, 0.03, 20), hm, s * (hw / 2 + 0.02), 0.0, 0).rotation.z = Math.PI / 2;
        const mic = new T.CatmullRomCurve3([new T.Vector3(hw / 2 + 0.035, -0.01, 0.01), new T.Vector3(hw / 2 + 0.035, -0.09, hd * 0.3), new T.Vector3(hw / 2 + 0.01, -ph * 0.35, faceZ)]); add(head, new T.TubeGeometry(mic, 12, 0.006, 6), hm);
      }
      const armOpt = { x: tw / 2 + 0.04, y: AGE.th - 0.04, z: 0.01, len: AGE.arm, r: 0.042 * Math.min(1.15, bk), mat: torsoM, hand: M.head, cuff: ot === 'pilot' ? M.gold : null };
      const armL = makeArm(chest, -1, armOpt), armR = makeArm(chest, 1, armOpt);
      // something to hold
      const pr = L.prop;
      if (pr === 'book') { const b = J(armL.grip); add(b, roundBox(0.12, 0.16, 0.03, 0.006), felt(0x2563eb), 0, 0, 0); add(b, new T.BoxGeometry(0.11, 0.15, 0.032), M.white, 0.005, 0, 0); b.rotation.set(0.2, 0.4, 0); }
      if (pr === 'laptop') { const lp = J(armL.grip); lp.rotation.set(0.1, 0, 0.1); add(lp, roundBox(0.2, 0.014, 0.14, 0.006), M.silver, 0, 0, 0.05); }
      if (pr === 'clipboard') { const c = J(armL.grip); add(c, roundBox(0.12, 0.16, 0.01, 0.005), felt(0xb5835a), 0, 0, 0); add(c, new T.BoxGeometry(0.1, 0.12, 0.012), M.white, 0, -0.01, 0.002); }
      if (pr === 'blueprint') { const c = J(armL.grip); add(c, new T.CylinderGeometry(0.025, 0.025, 0.26, 16), felt(0x60a5fa), 0, 0, 0).rotation.z = 1.2; }
      if (pr === 'cane') { const c = J(armL.grip); add(c, new T.CylinderGeometry(0.012, 0.012, hipY + AGE.th * 0.4, 8), felt(0x7c4a24), 0, -(hipY + AGE.th * 0.4) / 2 + 0.02, 0.01); add(c, new T.TorusGeometry(0.035, 0.012, 8, 16, Math.PI), felt(0x7c4a24), 0.035, 0.02, 0.01); }
      if (pr === 'wrench') { const c = J(armL.grip); add(c, new T.BoxGeometry(0.02, 0.16, 0.01), M.silver); add(c, new T.TorusGeometry(0.025, 0.008, 6, 12, Math.PI * 1.4), M.silver, 0, 0.09, 0); }
      if (pr === 'shovel') { const c = J(armL.grip); add(c, new T.CylinderGeometry(0.012, 0.012, 0.7, 8), felt(0x7c4a24), 0, -0.25, 0.02); add(c, roundBox(0.12, 0.14, 0.012, 0.01), M.silver, 0, -0.62, 0.03); }
      const H = hipY + 0.04 + AGE.th + hh + 0.03 + (hat !== 'none' ? 0.08 : 0);
      return { H, body, torso: chest, head, face, armL, armR, legs, sitH: hipY, tintMats: [M.face], headTop: () => head.localToWorld(new T.Vector3(0, hh / 2 + 0.08, 0)),
        chin: () => head.localToWorld(new T.Vector3(0.02, -hh / 2 + 0.01, hd / 2 + 0.02)), chest: () => chest.localToWorld(new T.Vector3(0, AGE.th * 0.48, td / 2 + 0.07)),
        hip: (s) => hips.localToWorld(new T.Vector3(s * (tw / 2 + 0.03), 0.05, 0.04)), headFollows: true };
    },
  };
  const KINDS = { cat: 'Yellow cat', boxkid: 'Box kid', planet: 'Planet buddy', folk: 'Box folk' };

  function toon(o = {}) {
    const kind = o.kind || 'cat', root = new T.Group(), B = BUILD[kind](root, o.colors || {}, o.look || {});
    root.traverse((m) => { if (m.isMesh) { m.castShadow = m.castShadow !== false; m.receiveShadow = true; } });
    root.updateMatrixWorld(true);
    const hasArms = !B.floating;
    // poses solved for this body with the elbow IK
    const P = {};
    if (hasArms) {
      const ch = B.chest(), chin = B.chin(), out = (s) => new T.Vector3(s, -0.4, -0.6);
      P.thinkR = ik(B.armR, chin, new T.Vector3(0.3, -1, 0.3));
      P.countR = ik(B.armR, ch.clone().add(new T.Vector3(0.035, 0, 0)), new T.Vector3(1, -1.2, -0.3)); P.countL = ik(B.armL, ch.clone().add(new T.Vector3(-0.035, 0, 0)), new T.Vector3(-1, -1.2, -0.3));
      P.crossR = ik(B.armR, ch.clone().add(new T.Vector3(-0.13, 0.01, -0.02)), new T.Vector3(1, -0.5, -0.2)); P.crossL = ik(B.armL, ch.clone().add(new T.Vector3(0.13, -0.02, -0.05)), new T.Vector3(-1, -0.5, -0.2));
      P.hipR = ik(B.armR, B.hip(1), out(1)); P.hipL = ik(B.armL, B.hip(-1), out(-1));   // hand on hip, elbow out
      for (const A of [B.armR, B.armL]) { A.upper.rotation.set(0, 0, 0); A.fore.rotation.set(0, 0, 0); }
    }
    const R0 = [0, 0, 0.25, -0.12], L0 = [0, 0, -0.25, -0.12];
    const zero = () => ({ y: 0, rx: 0, ry: 0, rz: 0, hx: 0, hy: 0, hz: 0, aL: L0.slice(), aR: R0.slice(), fL: 0, fR: 0, lift: [0, 0], tail: 0, sit: 0, pointR: 0, pointL: 0 });
    const CLIPS = {
      idle(t, p) { const b = Math.sin(t * 2); p.y = b * 0.006; p.rz = Math.sin(t * 0.7) * 0.025; p.hy = Math.sin(t * 0.45) * 0.12; p.hx = Math.sin(t * 0.33) * 0.04; p.aL[2] = -0.25 - b * 0.03; p.aR[2] = 0.25 + b * 0.03; p.tail = Math.sin(t * 1.6) * 0.3; },
      talk(t, p) { CLIPS.idle(t, p); p.hx += Math.sin(t * 5) * 0.04; p.hz = Math.sin(t * 2.3) * 0.05; p.aR = [-0.5 - Math.max(0, Math.sin(t * 2.2)) * 0.4, 0, 0.35, -0.6]; },
      walk(t, p) { const w = t * 7, s = Math.sin(w), c = Math.abs(Math.cos(w)); p.y = c * 0.025; p.rz = s * 0.06; p.fL = s * 0.09; p.fR = -s * 0.09; p.lift = [Math.max(0, s) * 0.04, Math.max(0, -s) * 0.04]; p.aL = [s * 0.6, 0, -0.3, -0.3]; p.aR = [-s * 0.6, 0, 0.3, -0.3]; p.tail = s * 0.5; },
      run(t, p) { CLIPS.walk(t * 1.6, p); p.rx = 0.12; p.y *= 1.8; p.aL[3] = p.aR[3] = -1.2; },
      wave(t, p) { CLIPS.idle(t, p); p.aR = [-0.45, 0, 2.2, -0.35 + Math.sin(t * 9) * 0.35]; p.hz = 0.08; },
      think(t, p) { CLIPS.idle(t, p); if (P.thinkR) p.aR = P.thinkR.slice(); p.hz = 0.1; p.hx = -0.08; },
      cheer(t, p) { const j = Math.max(0, Math.sin(t * 6)); p.y = j * 0.12; p.aL = [0, 0, -2.6, -0.2]; p.aR = [0, 0, 2.6, -0.2]; p.lift = [j * 0.03, j * 0.03]; },
      count(t, p) { CLIPS.idle(t, p); if (P.countR) { p.aR = P.countR.slice(); p.aL = P.countL.slice(); } p.hx = 0.2; p.aR[3] += Math.sin(t * 6) * 0.08; },
      point(t, p) { CLIPS.idle(t, p); p.aR = [-1.5, 0, 0.15, 0]; p.pointR = 1; },
      give(t, p) { CLIPS.idle(t, p); p.aR = [-1.1, 0, 0.1, -0.25]; p.hx = 0.05; },
      arms_crossed(t, p) { CLIPS.idle(t, p); if (P.crossR) { p.aR = P.crossR.slice(); p.aL = P.crossL.slice(); } p.hx = -0.05; },
      // hand on hip + pointing with the other hand
      hands_on_hips(t, p) { CLIPS.idle(t, p); if (P.hipR) { p.aR = P.hipR.slice(); p.aL = P.hipL.slice(); } p.hy *= 0.5; },
      hip_point_front(t, p) { CLIPS.idle(t, p); if (P.hipL) p.aL = P.hipL.slice(); p.aR = [-1.45, -0.1, 0.12, -0.05]; p.pointR = 1; p.hy = -0.05; p.rz = -0.04; },
      hip_point_up(t, p) { CLIPS.idle(t, p); if (P.hipL) p.aL = P.hipL.slice(); p.aR = [-0.4, 0, 2.6, -0.05]; p.pointR = 1; p.hx = -0.18; },
      raise_pass(t, p) { CLIPS.idle(t, p); if (P.hipL) p.aL = P.hipL.slice(); p.aR = [0.05, 0, 2.95, -0.04]; p.hx = -0.2; p.y = Math.sin(t * 3) * 0.008; },   // holds something high in the right hand for everyone to see
      hip_point_side(t, p) { CLIPS.idle(t, p); if (P.hipL) p.aL = P.hipL.slice(); p.aR = [-0.15, 0, 1.55, -0.05]; p.pointR = 1; p.hy = 0.35; },
      sit(t, p) { CLIPS.idle(t, p); p.sit = 1; p.aL = [-0.4, 0, -0.35, -0.5]; p.aR = [-0.4, 0, 0.35, -0.5]; },
      sit_sad(t, p) { CLIPS.sit(t, p); p.hx = 0.25; p.rx = 0.12; p.aL = [-0.5, 0, -0.1, -0.8]; p.aR = [-0.5, 0, 0.1, -0.8]; },
      // movement clips for walking around worlds (jump / fall / swim / slide / climb)
      jump(t, p) { p.aL = [-0.3, 0, -2.3, -0.3]; p.aR = [-0.3, 0, 2.3, -0.3]; p.fL = 0.06; p.fR = -0.04; p.lift = [0.05, 0.03]; p.hx = -0.08; },
      fall(t, p) { const w = Math.sin(t * 14) * 0.25; p.aL = [0, 0, -1.6 + w, -0.2]; p.aR = [0, 0, 1.6 - w, -0.2]; p.fL = 0.05; p.fR = -0.05; p.lift = [0.04, 0.02]; },
      swim(t, p) { const w = t * 5, s = Math.sin(w), c = Math.cos(w); p.rx = 1.15; p.hx = -0.9; p.aL = [-1.6 - s * 1.4, 0, -0.35 + c * 0.3, -0.25]; p.aR = [-1.6 + s * 1.4, 0, 0.35 - c * 0.3, -0.25]; p.fL = Math.sin(w * 1.5) * 0.08; p.fR = -Math.sin(w * 1.5) * 0.08; p.y = Math.sin(t * 2) * 0.02; },
      tread(t, p) { const s = Math.sin(t * 4); p.aL = [-0.4, 0, -1.0 + s * 0.3, -0.4]; p.aR = [-0.4, 0, 1.0 - s * 0.3, -0.4]; p.fL = s * 0.06; p.fR = -s * 0.06; p.y = Math.sin(t * 2) * 0.02; p.hx = -0.1; },
      // work clips for people doing their jobs (factory workers, shopkeepers…)
      stir(t, p) { CLIPS.idle(t, p); const a = t * 3.2; p.aR = [-1.15 + Math.sin(a) * 0.25, 0, 0.25 + Math.cos(a) * 0.25, -0.7]; p.aL = [-1.1 + Math.sin(a) * 0.25, 0, -0.25 + Math.cos(a) * 0.25, -0.7]; p.rz = Math.sin(a) * 0.05; p.hx = 0.15; },
      carry(t, p) { CLIPS.walk(t, p); p.aL = [-1.25, 0, -0.18, -0.55]; p.aR = [-1.25, 0, 0.18, -0.55]; p.hx = -0.05; },
      carry_idle(t, p) { CLIPS.idle(t, p); p.aL = [-1.25, 0, -0.18, -0.55]; p.aR = [-1.25, 0, 0.18, -0.55]; },
      hammer(t, p) { CLIPS.idle(t, p); const k = Math.max(0, Math.sin(t * 6)); p.aR = [-2.2 + k * 1.3, 0, 0.2, -0.4 - k * 0.6]; p.aL = [-0.9, 0, -0.2, -0.6]; p.hx = 0.2; },
      type(t, p) { CLIPS.idle(t, p); const k = Math.sin(t * 14) * 0.05; p.aR = [-1.0 + k, 0, 0.15, -0.9]; p.aL = [-1.0 - k, 0, -0.15, -0.9]; p.hx = 0.18; },
      slide(t, p) { p.sit = 1; p.rx = -0.25; p.aL = [-0.2, 0, -2.0, -0.2]; p.aR = [-0.2, 0, 2.0, -0.2]; p.hx = -0.15; p.hz = Math.sin(t * 3) * 0.06; },
    };
    // angry: tint toward red + smoke puffs above the head; dizzy: stars circling the head
    const tints = (B.tintMats || []).map((m) => ({ m, c: m.color ? m.color.clone() : null, e: m.emissive ? m.emissive.clone() : null, ei: m.emissiveIntensity }));
    const RED = new T.Color(0xff3b2e), smokeM = new T.MeshStandardMaterial({ color: 0x8a8a90, roughness: 1, transparent: true, opacity: 0.6, depthWrite: false });
    const fx = new T.Group(); root.add(fx);
    const puffs = Array.from({ length: 7 }, (_, i) => { const m = add(fx, new T.SphereGeometry(0.035 + (i % 3) * 0.012, 14, 10), smokeM); m.castShadow = false; return { m, k: i / 7, x: (i % 2 ? 1 : -1) * (0.03 + (i % 3) * 0.03) }; });
    const starM = new T.MeshBasicMaterial({ color: 0xffd23f, side: T.DoubleSide }), starShape = new T.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 0.012 : 0.03; i ? starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const stars = Array.from({ length: 3 }, () => { const m = add(fx, new T.ShapeGeometry(starShape), starM); m.castShadow = false; return m; });

    let clip = 'idle', clipT = 0, prev = null, blend = 1, last = zero(), time = 0, seat = null, talkDriven = false;
    const lerpP = (a, b, k) => { const out = {}; for (const key in b) out[key] = Array.isArray(b[key]) ? b[key].map((v, i) => lerp(a[key][i], v, k)) : lerp(a[key], b[key], k); return out; };
    function apply(p) {
      const fc = B.face.cur, wob = fc.wobble * Math.sin(time * 4) * 0.09;
      B.body.position.y = (B.floating ? 0.95 + Math.sin(time * 1.6) * 0.03 : 0) + p.y + (p.sit && seat != null ? (seat - (B.sitH || 0)) * p.sit : 0);
      B.body.rotation.set(p.rx, p.ry, p.rz + wob);
      const hz = p.hz + fc.tilt;
      if (B.headFollows) B.head.rotation.set(p.hx, p.hy, hz); else B.torso.rotation.set(p.hx * 0.5, p.hy * 0.4, hz * 0.5);
      if (hasArms) {
        for (const [A, a, pt] of [[B.armL, p.aL, p.pointL], [B.armR, p.aR, p.pointR]]) { A.upper.rotation.set(a[0], a[1], a[2]); A.fore.rotation.set(a[3], 0, 0); if (A.finger) A.finger.visible = pt > 0.5; }
      }
      if (B.feet) B.feet.forEach((f, i) => { f.position.z = 0.02 + (i ? p.fR : p.fL) + p.sit * 0.12; f.position.y = p.lift[i] + p.sit * 0.03; });
      if (B.legs) B.legs.forEach((l, i) => { l.rotation.x = -(i ? p.fR : p.fL) * 3 - p.sit * 1.4; l.position.y = p.lift[i]; });
      if (B.tail) B.tail.rotation.y = p.tail;
      if (B.hair) B.hair.forEach((h) => { const w = Math.sin(time * 2.6 + h.k * 1.3), a = h.big ? 0.22 : 0.18; h.m.rotation.x = h.rx + w * a; h.m.rotation.z = h.rz + Math.sin(time * 1.9 + h.k * 2.1) * a * 0.7; });
      if (B.ring) B.ring.rotation.z = time * 0.6;
      if (B.bubbles) B.bubbles.forEach((b, i) => { const k = (time * 0.18 + b.k) % 1; b.m.position.set(0.12 + Math.sin(i * 2 + time) * 0.04, -0.15 - k * 0.45, 0.12); b.m.scale.setScalar(1 - k * 0.6); b.m.material.opacity = 0.6 * (1 - k); });
      if (B.sparkles) B.sparkles.rotation.y = time * 0.3;
      // expression effects
      root.updateMatrixWorld(true);
      const local = root.worldToLocal(B.headTop());
      tints.forEach((t) => { if (t.c) t.m.color.copy(t.c).lerp(RED, fc.angry * 0.55); if (t.e) { t.m.emissive.copy(t.e).lerp(RED, fc.angry * 0.6); t.m.emissiveIntensity = t.ei + fc.angry * 0.25; } });
      puffs.forEach((pf) => { const k = (time * 0.7 + pf.k) % 1; pf.m.visible = fc.angry > 0.4; pf.m.position.set(local.x + pf.x * (1 + k), local.y + k * 0.22, local.z - 0.02); pf.m.scale.setScalar(0.5 + k * 1.1); });
      smokeM.opacity = 0.55 * clamp(fc.angry, 0, 1);
      stars.forEach((s, i) => { const a = time * 2.5 + i * 2.1; s.visible = fc.dizzy > 0.5; s.position.set(local.x + Math.cos(a) * 0.16, local.y - 0.02 + Math.sin(a * 2) * 0.01, local.z + Math.sin(a) * 0.16); s.rotation.z = time * 3; });
    }
    function update(dt) {
      time += dt; clipT += dt;
      const p = zero(); CLIPS[clip](clipT, p);
      blend = Math.min(1, blend + dt / 0.3);
      const pose = prev && blend < 1 ? lerpP(prev, p, smooth(blend)) : p;
      apply(pose); last = pose;
      if (clip === 'talk' && !talkDriven) B.face.talk(Math.max(0, Math.sin(time * 13) * 0.6 + Math.sin(time * 7.3) * 0.4) * 0.9); else if (!talkDriven) B.face.talk(0);
      B.face.update(dt, time);
    }
    let exprName = 'neutral';
    const api = {
      group: root, EXPRESSIONS: Object.keys(EXPR), ANIMATIONS: Object.keys(CLIPS),
      params: { kind, label: KINDS[kind], height: B.H }, get expression() { return exprName; }, get animation() { return clip; },
      setExpression(n, instant = false) { if (!EXPR[n]) throw new Error('Unknown expression ' + n); exprName = n; B.face.set(n, instant); },
      play(n, opt = {}) { if (!CLIPS[n]) throw new Error('Unknown animation ' + n); if (opt.instant) { clip = n; clipT = 0; prev = null; blend = 1; return; } if (n === clip) return; prev = last; clip = n; clipT = 0; blend = 0; },
      setTalk(level) { talkDriven = level != null; B.face.talk(clamp(level || 0, 0, 1)); },
      setSeat(h) { seat = h; },
      hold(obj, hand = 'R') { const g = (hand === 'R' ? B.armR : B.armL).grip; while (g.children.length) g.remove(g.children[0]); if (obj) g.add(obj); },
      update,
      rig: { headC: B.head, chest: B.torso, armL: B.armL, armR: B.armR, hips: B.body },
    };
    api.setExpression('neutral', true); update(0);
    return api;
  }
  // the cast: the 3 heroes + the people of the box-head world (different heights, suits and colours)
  const SKIN = { peach: 0xf6cdb4, light: 0xfbe0cc, tan: 0xe2a77f, brown: 0xb97a55, deep: 0x8a5638 };
  const TOON_PRESETS = {
    hero:         { label: 'Hero (box kid)', role: 'main character', kind: 'boxkid' },
    helper_cat:   { label: 'Helper cat', role: 'helps with physical things', kind: 'cat' },
    idea_planet:  { label: 'Idea planet', role: 'helps with ideas', kind: 'planet' },
    friend_boy:   { label: 'Friend (boy)', role: 'friend', kind: 'folk', look: { age: 'kid', head: 0x2f8fe8, face: SKIN.tan, outfit: 'hoodie', top: 0x14b8a6, bottomType: 'shorts', bottom: 0x1e3a8a, shoe: 0xffffff, hair: 'spiky', hairColor: 0x2b1a12, extras: ['blush'] } },
    friend_girl:  { label: 'Friend (girl)', role: 'friend', kind: 'folk', look: { age: 'kid', female: true, head: 0xff6fae, face: SKIN.peach, outfit: 'tshirt', top: 0xfcc72c, bottomType: 'dress', bottom: 0xfcc72c, shoe: 0x7c3aed, hair: 'pigtails', hairColor: 0x3b2416, accent: 0x7c3aed, extras: ['blush'] } },
    best_friend:  { label: 'Best friend', role: 'friend', kind: 'folk', look: { age: 'kid', head: 0x22c55e, face: SKIN.brown, outfit: 'tshirt', top: 0xef4444, bottomType: 'pants', bottom: 0x334155, shoe: 0xf8f8f8, hair: 'short', hairColor: 0x1a120c } },
    friend_girl2: { label: 'Friend (girl 2)', role: 'friend', kind: 'folk', look: { age: 'kid', female: true, head: 0x14b8a6, face: SKIN.light, outfit: 'hoodie', top: 0x8b5cf6, bottomType: 'pants', bottom: 0x1e293b, shoe: 0xff6fae, hair: 'ponytail', hairColor: 0x5a3a22, extras: ['glasses', 'blush'], glassColor: 0x7c3aed } },
    little_sister:{ label: 'Little sister', role: 'family', kind: 'folk', look: { age: 'kid', female: true, build: 0.9, head: 0xf59e0b, face: SKIN.peach, outfit: 'tshirt', top: 0xff6fae, bottomType: 'dress', bottom: 0xff6fae, shoe: 0xffffff, hair: 'pigtails', hairColor: 0x2b1a12, accent: 0xfcc72c, extras: ['blush'] } },
    dad:          { label: 'Dad', role: 'family', kind: 'folk', look: { age: 'adult', build: 1.1, head: 0x2563eb, face: SKIN.tan, outfit: 'shirt', top: 0xdbeafe, bottomType: 'pants', bottom: 0x374151, shoe: 0x3b2416, hair: 'side', hairColor: 0x1a120c, extras: ['moustache', 'tie'], tie: 0x1e3a8a } },
    mom:          { label: 'Mom', role: 'family', kind: 'folk', look: { age: 'adult', female: true, head: 0xd946ef, face: SKIN.peach, outfit: 'kurti', top: 0x7c5cf2, top2: 0xff4f8b, bottomType: 'pants', bottom: 0xf5e6c8, shoe: 0x8a5a33, hair: 'long', hairColor: 0x1a120c } },
    teacher:      { label: 'Teacher', role: 'school', kind: 'folk', look: { age: 'adult', female: true, head: 0x0ea5e9, face: SKIN.brown, outfit: 'cardigan', top: 0x16a34a, top2: 0xf8fafc, bottomType: 'dress', bottom: 0x4b2a8c, shoe: 0x3b2416, hair: 'bun', hairColor: 0x2b1a12, extras: ['glasses'], prop: 'book' } },
    bus_driver:   { label: 'Bus driver', role: 'work', kind: 'folk', look: { age: 'adult', build: 1.2, head: 0xf97316, face: SKIN.tan, outfit: 'shirt', top: 0x93c5fd, bottomType: 'pants', bottom: 0x1e3a8a, shoe: 0x111827, hat: 'driver', extras: ['moustache'] } },
    shop_owner:   { label: 'Shop owner', role: 'work', kind: 'folk', look: { age: 'adult', build: 1.25, head: 0x84cc16, face: SKIN.brown, outfit: 'apron', top: 0xfef3c7, top2: 0xb45309, bottomType: 'pants', bottom: 0x57534e, shoe: 0x3b2416, hair: 'grey_rim', hairColor: 0x9ca3af, extras: ['moustache', 'glasses'], prop: 'clipboard' } },
    road_worker:  { label: 'Road worker', role: 'work', kind: 'folk', look: { age: 'adult', build: 1.15, head: 0xa16207, face: SKIN.deep, outfit: 'hi_vis', top: 0x1f2937, bottomType: 'pants', bottom: 0x1e3a8a, shoe: 0x78350f, hat: 'hard_hat', hatColor: 0xfacc15, prop: 'shovel' } },
    pilot:        { label: 'Pilot', role: 'work', kind: 'folk', look: { age: 'adult', female: true, head: 0x6366f1, face: SKIN.peach, outfit: 'pilot', top: 0xffffff, top2: 0x1b2a4a, bottomType: 'pants', bottom: 0x1b2a4a, shoe: 0x111827, hat: 'pilot', hair: 'none', tie: 0x1b2a4a } },
    engineer:     { label: 'Engineer', role: 'work', kind: 'folk', look: { age: 'adult', female: true, head: 0xec4899, face: SKIN.tan, outfit: 'shirt', top: 0x60a5fa, bottomType: 'pants', bottom: 0x334155, shoe: 0x3b2416, hat: 'hard_hat', hatColor: 0xf8fafc, prop: 'blueprint' } },
    it_specialist:{ label: 'IT specialist', role: 'work', kind: 'folk', look: { age: 'adult', head: 0x10b981, face: SKIN.light, outfit: 'hoodie', top: 0x334155, bottomType: 'pants', bottom: 0x1e293b, shoe: 0xffffff, hair: 'short', hairColor: 0x3b2416, extras: ['glasses', 'headset'], prop: 'laptop' } },
    grandpa:      { label: 'Grandpa', role: 'family', kind: 'folk', look: { age: 'old', head: 0x8b5cf6, face: SKIN.tan, outfit: 'cardigan', top: 0x92400e, top2: 0xfef3c7, bottomType: 'pants', bottom: 0x57534e, shoe: 0x3b2416, hair: 'grey_rim', hairColor: 0xd4d4d4, extras: ['moustache', 'glasses', 'grey_brows'], prop: 'cane' } },
    bank_teller:  { label: 'Bank teller', role: 'bank', kind: 'folk', look: { age: 'adult', female: true, head: 0x7c3aed, face: SKIN.peach, outfit: 'shirt', top: 0xe0f2fe, bottomType: 'pants', bottom: 0x1e293b, shoe: 0x111827, hair: 'bun', hairColor: 0x1a120c, extras: ['tie', 'id_card'], tie: 0x7c3aed, lanyard: 0x7c3aed } },
    bank_manager: { label: 'Bank manager', role: 'bank', kind: 'folk', look: { age: 'adult', build: 1.1, head: 0x0f766e, face: SKIN.tan, outfit: 'suit', top: 0x1f2937, top2: 0xffffff, bottomType: 'pants', bottom: 0x1f2937, shoe: 0x111827, hair: 'side', hairColor: 0x1a120c, extras: ['glasses', 'id_card'], tie: 0x7c3aed, lanyard: 0x0f766e, prop: 'clipboard' } },
    security_guard:{ label: 'Security guard', role: 'bank', kind: 'folk', look: { age: 'adult', build: 1.2, head: 0x475569, face: SKIN.brown, outfit: 'shirt', top: 0x1e3a8a, bottomType: 'pants', bottom: 0x1e293b, shoe: 0x111827, hat: 'driver', hatColor: 0x1e3a8a, extras: ['moustache', 'id_card'], lanyard: 0xfacc15 } },
    grocer:       { label: 'Grocer', role: 'shop', kind: 'folk', look: { age: 'adult', build: 1.2, head: 0xf59e0b, face: SKIN.tan, outfit: 'apron', top: 0xfef9c3, top2: 0x16a34a, bottomType: 'pants', bottom: 0x57534e, shoe: 0x3b2416, hair: 'short', hairColor: 0x1a120c, extras: ['moustache'], prop: 'clipboard' } },
    vegetable_seller:{ label: 'Vegetable seller', role: 'shop', kind: 'folk', look: { age: 'adult', female: true, head: 0x16a34a, face: SKIN.deep, outfit: 'kurti', top: 0xf97316, top2: 0x16a34a, bottomType: 'long_dress', bottom: 0xf97316, shoe: 0x8a5a33, hair: 'bun', hairColor: 0x1a120c } },
    grandma:      { label: 'Grandma', role: 'family', kind: 'folk', look: { age: 'old', female: true, head: 0xf43f5e, face: SKIN.peach, outfit: 'shawl', top: 0x9d174d, top2: 0xfcc72c, bottomType: 'long_dress', bottom: 0x9d174d, shoe: 0x8a5a33, hair: 'grey_bun', hairColor: 0xd4d4d4, extras: ['glasses', 'grey_brows'], prop: 'cane' } },
  };
  window.ZCharacters = Object.assign(window.ZCharacters || {}, { toon, TOON_KINDS: KINDS, TOON_PALETTE: PAL, TOON_PRESETS });
})();
