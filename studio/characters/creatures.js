/*
 * Living Creatures of Zungga (creature sheet): cookie bird, jelly bee, marshmallow bunny, chocolate fish, sprinkle
 * butterfly — tiny (18–25 cm), friendly, big-eyed, each with its own way of moving.
 *   const c = ZCharacters.creature('cookie_bird' | { kind })
 *   → { group, play(clip), update(dt), ANIMATIONS, params, setExpression(), setTalk(), hold() }   (same shape as the casts)
 *   clips: idle · fly / hop / swim (their travel move) · happy
 */
(() => {
  'use strict';
  const T = THREE;
  const add = (p, g, m, x = 0, y = 0, z = 0) => { const me = new T.Mesh(g, m); me.position.set(x, y, z); me.castShadow = true; p.add(me); return me; };
  const J = (p, x = 0, y = 0, z = 0) => { const g = new T.Group(); g.position.set(x, y, z); p.add(g); return g; };
  const tex = (draw, w = 256, h = 256) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; };
  const glossy = (c, o = {}) => new T.MeshPhysicalMaterial({ color: c, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.15, ...o });
  const soft = (c, o = {}) => new T.MeshPhysicalMaterial({ color: c, roughness: 0.7, sheen: 1, sheenRoughness: 0.5, sheenColor: new T.Color(0xffffff), ...o });
  const KINDS = { cookie_bird: 'Cookie Bird', jelly_bee: 'Jelly Bee', marshmallow_bunny: 'Marshmallow Bunny', chocolate_fish: 'Chocolate Fish', sprinkle_butterfly: 'Sprinkle Butterfly' };
  let COOKIE = null, SPRINK = null;
  const cookieTex = () => COOKIE || (COOKIE = tex((g, w, h) => { g.fillStyle = '#d29a52'; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = ['#c48a44', '#dca763', '#b97c3c'][i % 3]; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); } for (let i = 0; i < 26; i++) { g.fillStyle = '#4a2a17'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 7 + Math.random() * 6, 6 + Math.random() * 5, Math.random() * 3, 0, 6.3); g.fill(); } }));
  const sprinkleTex = () => SPRINK || (SPRINK = tex((g, w, h) => { g.fillStyle = '#f3d29c'; g.fillRect(0, 0, w, h); g.fillStyle = '#fde3ef'; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.4, h * 0.4, 0, 0, 6.3); g.fill(); const C = ['#ec4899', '#facc15', '#22c55e', '#38bdf8', '#a855f7', '#fb923c']; for (let i = 0; i < 140; i++) { g.save(); g.translate(w * 0.15 + Math.random() * w * 0.7, h * 0.15 + Math.random() * h * 0.7); g.rotate(Math.random() * 3); g.fillStyle = C[i % C.length]; g.fillRect(-7, -2.5, 14, 5); g.restore(); } g.strokeStyle = '#f9a8d4'; g.lineWidth = 10; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.4, h * 0.4, 0, 0, 6.3); g.stroke(); }));

  // big cartoon eye (white, coloured iris, pupil, 2 catchlights, a lid that blinks)
  function eye(parent, r, x, y, z, iris = 0x3b2416, skin = 0xd29a52) {
    const s = J(parent, x, y, z);
    add(s, new T.SphereGeometry(r, 24, 18), glossy(0xffffff, { roughness: 0.15 })).scale.set(1, 1.1, 0.8);
    add(s, new T.SphereGeometry(r * 0.66, 20, 14), glossy(iris), 0, -r * 0.04, r * 0.56).scale.set(1, 1.1, 0.5);
    add(s, new T.SphereGeometry(r * 0.4, 16, 12), new T.MeshBasicMaterial({ color: 0x0b0705 }), 0, -r * 0.04, r * 0.72).scale.set(1, 1.1, 0.5);
    add(s, new T.SphereGeometry(r * 0.17, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff }), -r * 0.2, r * 0.2, r * 0.93);
    add(s, new T.SphereGeometry(r * 0.08, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff }), r * 0.2, -r * 0.2, r * 0.93);
    const lid = J(s); add(lid, new T.SphereGeometry(r * 1.06, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: skin, roughness: 0.6 })).scale.set(1, 1.1, 0.85); lid.rotation.x = -1.6;
    return { s, lid };
  }
  const smile = (parent, w, x, y, z, c = 0x5a2412) => { const m = add(parent, new T.TorusGeometry(w, w * 0.18, 8, 20, Math.PI), new T.MeshStandardMaterial({ color: c }), x, y, z); m.rotation.z = Math.PI; return m; };
  const blush = (parent, r, x, y, z) => { const m = add(parent, new T.CircleGeometry(r, 16), new T.MeshBasicMaterial({ color: 0xff8fa3, transparent: true, opacity: 0.55, depthWrite: false }), x, y, z); m.castShadow = false; return m; };

  function creature(opts = {}) {
    if (typeof opts === 'string') opts = { kind: opts };
    const kind = KINDS[opts.kind] ? opts.kind : 'cookie_bird', root = new T.Group(), body = J(root), eyes = [], parts = {};
    let H = 0.25;
    if (kind === 'cookie_bird') {   // 25 cm: round cookie body with chips, little wings, orange beak, crumb tuft
      H = 0.25; const ck = new T.MeshStandardMaterial({ map: cookieTex(), roughness: 0.85 });
      const b = add(body, new T.SphereGeometry(0.1, 28, 20), ck, 0, 0.12, 0); b.scale.set(1, 1.05, 0.95);
      for (let i = 0; i < 3; i++) add(body, new T.SphereGeometry(0.018, 10, 8), ck, -0.015 + i * 0.015, 0.225 + (i % 2) * 0.01, -0.01);
      add(body, new T.ConeGeometry(0.022, 0.05, 12), glossy(0xf59e0b), 0, 0.12, 0.105).rotation.x = Math.PI / 2;
      for (const s of [-1, 1]) { eyes.push(eye(body, 0.03, s * 0.042, 0.155, 0.075, 0x3b2416, 0xd29a52)); blush(body, 0.016, s * 0.07, 0.115, 0.085).rotation.y = s * 0.5; }
      parts.wings = [-1, 1].map((s) => { const w = J(body, s * 0.09, 0.13, -0.005); const m = add(w, new T.SphereGeometry(0.06, 16, 12), ck, s * 0.04, 0, 0); m.scale.set(1, 0.35, 0.7); return { w, s }; });
      for (const s of [-1, 1]) { add(body, new T.CylinderGeometry(0.006, 0.006, 0.03, 6), glossy(0xf59e0b), s * 0.03, 0.015, 0.01); add(body, new T.BoxGeometry(0.03, 0.006, 0.03), glossy(0xf59e0b), s * 0.03, 0.002, 0.02); }
      smile(body, 0.012, 0, 0.098, 0.1);
    } else if (kind === 'jelly_bee') {   // 18 cm: glossy jelly stripes, pink see-through wings, antennae
      H = 0.18; const yel = glossy(0xfacc15, { transmission: 0.15, thickness: 0.05 }), blk = glossy(0x2a1b10);
      const b = add(body, new T.SphereGeometry(0.07, 24, 18), yel, 0, 0.09, -0.02); b.scale.set(0.95, 0.95, 1.2);
      for (let i = 0; i < 3; i++) { const st = add(body, new T.TorusGeometry(0.066 - i * 0.008, 0.013, 8, 24), blk, 0, 0.09, -0.035 - i * 0.03); st.scale.set(1, 1, 0.6); }
      const hd = add(body, new T.SphereGeometry(0.058, 22, 16), yel, 0, 0.11, 0.06); void hd;
      for (const s of [-1, 1]) { eyes.push(eye(body, 0.022, s * 0.026, 0.125, 0.105, 0x2a1b10, 0xfacc15)); blush(body, 0.012, s * 0.045, 0.098, 0.1).rotation.y = s * 0.5; const an = add(body, new T.CylinderGeometry(0.003, 0.003, 0.06, 6), blk, s * 0.02, 0.18, 0.07); an.rotation.z = -s * 0.35; add(body, new T.SphereGeometry(0.009, 8, 6), blk, s * 0.031, 0.21, 0.07); }
      smile(body, 0.01, 0, 0.098, 0.115);
      const wm = new T.MeshPhysicalMaterial({ color: 0xf9a8d4, transparent: true, opacity: 0.55, roughness: 0.05, side: T.DoubleSide, iridescence: 0.6 });
      parts.wings = []; for (const s of [-1, 1]) for (const [k, sc] of [[0, 1], [1, 0.7]]) { const w = J(body, s * 0.03, 0.15, -0.02 - k * 0.03); const m = add(w, new T.CircleGeometry(0.06 * sc, 20), wm, s * 0.05 * sc, 0.01, 0); m.scale.set(1, 0.6, 1); m.rotation.x = -Math.PI / 2; m.castShadow = false; parts.wings.push({ w, s }); }
    } else if (kind === 'marshmallow_bunny') {   // 22 cm: squishy white, long ears with pink inside, holds a pink marshmallow
      H = 0.22; const mm = soft(0xfdf6f0), pink = soft(0xf9a8c4);
      const b = add(body, new T.SphereGeometry(0.075, 24, 18), mm, 0, 0.07, 0); b.scale.set(1, 0.95, 0.9);
      add(body, new T.SphereGeometry(0.065, 24, 18), mm, 0, 0.155, 0.01);
      parts.ears = [-1, 1].map((s) => { const e = J(body, s * 0.03, 0.2, 0); const m = add(e, new T.CapsuleGeometry(0.018, 0.07, 6, 12), mm, 0, 0.05, 0); m.scale.z = 0.6; const inn = add(e, new T.CapsuleGeometry(0.01, 0.05, 6, 10), pink, 0, 0.05, 0.008); inn.scale.z = 0.4; e.rotation.z = -s * 0.12; return e; });
      for (const s of [-1, 1]) { eyes.push(eye(body, 0.018, s * 0.028, 0.165, 0.058, 0x1a120c, 0xfdf6f0)); blush(body, 0.012, s * 0.045, 0.142, 0.06).rotation.y = s * 0.4; add(body, new T.SphereGeometry(0.02, 12, 10), mm, s * 0.035, 0.008, 0.035).scale.set(1, 0.6, 1.3); }
      add(body, new T.SphereGeometry(0.006, 8, 6), pink, 0, 0.15, 0.072); smile(body, 0.008, 0, 0.138, 0.07);
      add(body, roundBoxG(0.045, 0.04, 0.04), pink, 0, 0.085, 0.07); for (const s of [-1, 1]) add(body, new T.SphereGeometry(0.014, 10, 8), mm, s * 0.028, 0.09, 0.07);
      add(body, new T.SphereGeometry(0.02, 10, 8), mm, 0, 0.05, -0.07);
    } else if (kind === 'chocolate_fish') {   // 20 cm long: glossy chocolate, cream belly, waving tail
      H = 0.12; const ch = glossy(0x5b3420, { roughness: 0.2 }), cream = glossy(0xf3e2c8);
      const b = add(body, new T.SphereGeometry(0.06, 26, 18), ch, 0, 0, 0); b.scale.set(0.75, 0.95, 1.6);
      const bel = add(body, new T.SphereGeometry(0.05, 20, 14), cream, 0, -0.02, 0.01); bel.scale.set(0.6, 0.6, 1.4);
      const tailS = new T.Shape(); tailS.moveTo(0, 0); tailS.quadraticCurveTo(0.05, 0.07, 0.03, 0.09); tailS.quadraticCurveTo(0.0, 0.03, -0.03, 0.09); tailS.quadraticCurveTo(-0.05, 0.07, 0, 0);
      parts.tail = J(body, 0, 0, -0.09); const tl = add(parts.tail, new T.ShapeGeometry(tailS), new T.MeshPhysicalMaterial({ color: 0x5b3420, roughness: 0.25, clearcoat: 0.8, side: T.DoubleSide }), 0, 0, 0); tl.rotation.set(Math.PI / 2, 0, Math.PI); tl.rotation.y = Math.PI / 2; tl.rotation.set(-Math.PI / 2, Math.PI / 2, 0);
      const fin = add(body, new T.ShapeGeometry(tailS), new T.MeshPhysicalMaterial({ color: 0x4a2a17, roughness: 0.3, side: T.DoubleSide }), 0, 0.045, -0.01); fin.rotation.set(0, Math.PI / 2, 0); fin.scale.set(0.8, 0.6, 1);
      parts.fins = [-1, 1].map((s) => { const f = J(body, s * 0.04, -0.015, 0.03); const m = add(f, new T.SphereGeometry(0.025, 12, 8), ch, s * 0.015, 0, 0); m.scale.set(1, 0.2, 0.7); return { f, s }; });
      for (const s of [-1, 1]) { const e = eye(body, 0.02, s * 0.038, 0.015, 0.055, 0x2a1b10, 0x5b3420); e.s.rotation.y = s * 1.0; eyes.push(e); }
      smile(body, 0.012, 0, -0.012, 0.094, 0x2a1408);
    } else {   // sprinkle_butterfly (18 cm): iced-cookie wings with sprinkles, purple body, curly antennae
      H = 0.18; const pur = glossy(0xa855f7), wm = new T.MeshStandardMaterial({ map: sprinkleTex(), roughness: 0.6, side: T.DoubleSide });
      add(body, new T.CapsuleGeometry(0.014, 0.07, 6, 12), pur, 0, 0.08, 0);
      add(body, new T.SphereGeometry(0.024, 18, 14), pur, 0, 0.135, 0.01);
      for (const s of [-1, 1]) { eyes.push(eye(body, 0.011, s * 0.012, 0.14, 0.028, 0x1a120c, 0xa855f7)); const an = add(body, new T.TorusGeometry(0.02, 0.0025, 6, 14, Math.PI * 1.2), pur, s * 0.02, 0.175, 0.01); an.rotation.set(0, Math.PI / 2, s > 0 ? 0.3 : 2.8); }
      smile(body, 0.006, 0, 0.128, 0.033);
      parts.wings = [-1, 1].map((s) => { const w = J(body, 0, 0.09, 0); const up = add(w, new T.CircleGeometry(0.06, 24), wm, s * 0.055, 0.03, 0); up.scale.set(1, 0.85, 1); const lo = add(w, new T.CircleGeometry(0.042, 20), wm, s * 0.042, -0.035, 0); void lo; return { w, s }; });
    }
    function roundBoxG(w, h, d) { return ZA && ZA.roundBox ? ZA.roundBox(w, h, d, 0.008) : new T.BoxGeometry(w, h, d); }

    // ---------- motion ----------
    let clip = 'idle', time = Math.random() * 10;
    const MOVE = { cookie_bird: 'fly', jelly_bee: 'fly', marshmallow_bunny: 'hop', chocolate_fish: 'swim', sprinkle_butterfly: 'fly' }[kind];
    function update(dt) {
      time += dt; const t = time, moving = clip !== 'idle' && clip !== 'happy';
      const bp = (t % 3.3) / 3.3, blink = bp > 0.95 ? Math.sin((bp - 0.95) / 0.05 * Math.PI) : 0;
      for (const e of eyes) e.lid.rotation.x = -1.6 + blink * 1.55;
      if (kind === 'cookie_bird') { const flap = moving ? Math.sin(t * 22) * 0.9 : Math.max(0, Math.sin(t * 3)) * 0.15; for (const w of parts.wings) w.w.rotation.z = w.s * (0.2 + flap); body.position.y = moving ? Math.sin(t * 6) * 0.01 : Math.abs(Math.sin(t * 2.2)) * (clip === 'happy' ? 0.04 : 0.006); body.rotation.x = moving ? 0.15 : (Math.sin(t * 1.3) > 0.85 ? 0.5 : 0); }
      else if (kind === 'jelly_bee') { for (const w of parts.wings) w.w.rotation.z = w.s * Math.sin(t * 60) * 0.6; body.position.y = Math.sin(t * 3) * 0.012; body.rotation.z = Math.sin(t * 2.2) * 0.12; }
      else if (kind === 'marshmallow_bunny') { const hop = moving ? Math.max(0, Math.sin(t * 7)) : clip === 'happy' ? Math.max(0, Math.sin(t * 9)) * 0.6 : 0, sq = 1 + Math.sin(t * 2.4) * 0.03; body.position.y = hop * 0.06; body.scale.set(1 + (1 - hop) * 0.04, (moving ? 0.92 + hop * 0.14 : sq), 1 + (1 - hop) * 0.04); for (const [i, e] of parts.ears.entries()) e.rotation.x = -0.1 + Math.sin(t * 3 + i) * 0.08 - hop * 0.35; }
      else if (kind === 'chocolate_fish') { const sp = moving ? 9 : 4; parts.tail.rotation.y = Math.sin(t * sp) * 0.55; body.rotation.y = Math.sin(t * sp) * 0.08; for (const f of parts.fins) f.f.rotation.z = f.s * Math.sin(t * sp * 0.8) * 0.4; body.position.y = Math.sin(t * 1.5) * 0.01; }
      else { const flap = Math.sin(t * (moving ? 14 : 4)) * (moving ? 1.0 : 0.35); for (const w of parts.wings) w.w.rotation.y = w.s * (0.25 + flap); body.position.y = Math.sin(t * 3) * 0.015; }
    }
    const api = {
      group: root, ANIMATIONS: ['idle', MOVE, 'happy'], EXPRESSIONS: ['happy'], params: { kind: 'creature', creature: kind, label: KINDS[kind], height: H }, move: MOVE,
      play(n) { clip = n === 'walk' || n === 'run' ? MOVE : this.ANIMATIONS.includes(n) ? n : 'idle'; }, update, setExpression() {}, setTalk() {}, setSeat() {}, hold() {},
      rig: { body },
    };
    root.traverse((m) => { if (m.isMesh) m.receiveShadow = true; });
    update(0); return api;
  }
  window.ZCharacters = Object.assign(window.ZCharacters || {}, { creature, CREATURE_KINDS: KINDS });
})();
