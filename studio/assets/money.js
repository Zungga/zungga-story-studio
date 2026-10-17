/* Zungga Story Studio — money props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box, logoTex, mascotTex, decal, label, cyl, sphere } = ZA;
  const NOTE = { 100: { c: '#b9a4e8', ink: '#4c2f8f', w: 0.142, h: 0.066, word: 'One Hundred Rupees' },
                 50: { c: '#7fd3e6', ink: '#0d5e72', w: 0.135, h: 0.066, word: 'Fifty Rupees' },
                 20: { c: '#c9e27a', ink: '#556b12', w: 0.129, h: 0.063, word: 'Twenty Rupees' },
                 10: { c: '#c79a6b', ink: '#5c3814', w: 0.123, h: 0.063, word: 'Ten Rupees' },
                 500: { c: '#b9b6a3', ink: '#3f4034', w: 0.150, h: 0.066, word: 'Five Hundred Rupees' },
                 200: { c: '#f6b04a', ink: '#7a3a06', w: 0.146, h: 0.066, word: 'Two Hundred Rupees' } };

  function noteTex(v, back) {
    const n = NOTE[v];
    return tex((g, W, H) => {
      const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, n.c); gr.addColorStop(1, '#ffffff');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.strokeStyle = n.ink; g.globalAlpha = 0.18; g.lineWidth = 2;
      for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(W * (back ? 0.3 : 0.68), H / 2, 30 + i * 7, 18 + i * 4, 0, 0, Math.PI * 2); g.stroke(); }
      g.globalAlpha = 1; g.lineWidth = 8; g.strokeRect(10, 10, W - 20, H - 20);
      g.fillStyle = n.ink; g.textBaseline = 'middle';
      if (!back) {
        g.font = `700 ${H * 0.36}px ${FONT}`; g.textAlign = 'left'; g.fillText(`₹${v}`, W * 0.06, H * 0.42);
        g.font = `600 ${H * 0.1}px ${FONT}`; g.fillText(n.word, W * 0.07, H * 0.75);
        g.textAlign = 'right'; g.font = `700 ${H * 0.16}px ${FONT}`; g.fillText(`${v}`, W * 0.94, H * 0.2);
        g.beginPath(); g.arc(W * 0.68, H * 0.5, H * 0.24, 0, Math.PI * 2); g.globalAlpha = 0.85; g.fillStyle = '#ffffffaa'; g.fill();
        g.globalAlpha = 1; g.fillStyle = n.ink; g.textAlign = 'center'; g.font = `700 ${H * 0.13}px ${FONT}`; g.fillText('ZUNGGA', W * 0.68, H * 0.5);
      } else {
        g.textAlign = 'center'; g.font = `700 ${H * 0.42}px ${FONT}`; g.fillText(`${v}`, W * 0.72, H * 0.5);
        g.font = `600 ${H * 0.1}px ${FONT}`; g.fillText('PLAY MONEY · STORY PROP', W * 0.3, H * 0.82);
      }
    }, 1024, Math.round(1024 * n.h / n.w));
  }
  function note(v) {
    const n = NOTE[v], g = new T.Group();
    const geo = new T.PlaneGeometry(n.w, n.h, 24, 4);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) / n.w + 0.5) * Math.PI) * 0.004);   // gentle paper bend
    geo.computeVertexNormals();
    const front = mesh(geo, new T.MeshStandardMaterial({ map: noteTex(v, false), roughness: 0.9, side: T.FrontSide }), g);
    const back = mesh(geo, new T.MeshStandardMaterial({ map: noteTex(v, true), roughness: 0.9, side: T.BackSide }), g);
    back.material.map.wrapS = T.RepeatWrapping; back.material.map.repeat.x = -1;
    g.rotation.x = -Math.PI / 2; const wrap = new T.Group(); wrap.add(g); g.position.y = 0.003;
    return { group: wrap, phys: { shape: 'box', size: [n.w, 0.002, n.h], mass: 0.001, flutter: true } };
  }
  function notes30() {   // there is no ₹30 note in India: ₹20 + ₹10 fanned together reads as "thirty"
    const g = new T.Group(), a = ZAssets.build('note_20').group, b = ZAssets.build('note_10').group;
    a.rotation.y = 0.18; b.position.set(0.02, 0.003, 0.015); b.rotation.y = -0.12; g.add(a, b); return { group: g };
  }
  function coin(v = 5) {
    const g = new T.Group(), r = v === 5 ? 0.0115 : 0.0135, h = 0.0022;
    const face = tex((c, W, H) => {
      const gr = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2); gr.addColorStop(0, '#fde68a'); gr.addColorStop(1, '#d4a017');
      c.fillStyle = gr; c.fillRect(0, 0, W, H); c.strokeStyle = '#a16207'; c.lineWidth = 10; c.beginPath(); c.arc(W / 2, H / 2, W * 0.42, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#854d0e'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 ${W * 0.4}px ${FONT}`; c.fillText(`₹${v}`, W / 2, H / 2 + 6);
    }, 256, 256);
    const edge = mat(0xd4a017, { metalness: 0.75, roughness: 0.3 }), faceM = new T.MeshStandardMaterial({ map: face, metalness: 0.6, roughness: 0.35 });
    mesh(new T.CylinderGeometry(r, r, h, 40), [edge, faceM, faceM], g, 0, h / 2, 0);
    return { group: g, phys: { shape: 'cylinder', r, h, mass: 0.006 } };
  }
  function coinBox() {   // open-topped tin the coins drop into
    const g = new T.Group(), W = 0.16, H = 0.1, D = 0.12, t = 0.004, m = mat(Z.blue, { metalness: 0.35, roughness: 0.4 });
    mesh(new T.BoxGeometry(W, t, D), m, g, 0, t / 2, 0);
    for (const [w, d, x, z] of [[W, t, 0, D / 2], [W, t, 0, -D / 2], [t, D, W / 2, 0], [t, D, -W / 2, 0]]) mesh(new T.BoxGeometry(w, H, d), m, g, x, H / 2, z);
    const lab = tex((c, Wd, Hd) => { c.fillStyle = hex(Z.yellow); c.fillRect(0, 0, Wd, Hd); c.fillStyle = hex(Z.ink); c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'MY SAVINGS', Wd * 0.9, 70); c.fillText('MY SAVINGS', Wd / 2, Hd / 2); }, 512, 160);
    mesh(new T.PlaneGeometry(W * 0.8, H * 0.32), new T.MeshStandardMaterial({ map: lab }), g, 0, H * 0.55, D / 2 + t / 2 + 0.0005);
    return { group: g, walls: { w: W, h: H, d: D, t } };
  }
  ZAssets.register('money', 'note_100', '₹100 note', () => note(100), ["note", "rupee", "100"]);
  ZAssets.register('money', 'note_50', '₹50 note', () => note(50), ["note", "rupee", "50"]);
  ZAssets.register('money', 'note_20', '₹20 note', () => note(20), ["note", "rupee", "20"]);
  ZAssets.register('money', 'note_10', '₹10 note', () => note(10), ["note", "rupee", "10"]);
  ZAssets.register('money', 'notes_30', '₹30 (₹20 + ₹10)', notes30, ["notes", "rupee", "30"]);
  ZAssets.register('money', 'coin_5', '₹5 coin', () => coin(5), ["coin", "rupee", "5", "physics"]);
  ZAssets.register('money', 'coin_box', 'Savings tin', coinBox, ["tin", "box", "savings", "physics"]);

  /* ------------------------------------------------------------------ more money ------------------------------------------------------------------ */
  const seeded = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
  // per-build caches, so a pile of 80 notes shares a handful of canvases instead of making 160
  function noteKit() {
    const M = {}, G = {};
    const mats = (v) => M[v] || (M[v] = (() => {
      const f = new T.MeshStandardMaterial({ map: noteTex(v, false), roughness: 0.9, side: T.FrontSide });
      const bt = noteTex(v, true); bt.wrapS = T.RepeatWrapping; bt.repeat.x = -1;
      return [f, new T.MeshStandardMaterial({ map: bt, roughness: 0.9, side: T.BackSide })];
    })());
    const geo = (v, bend) => { const k = v + ':' + bend; if (G[k]) return G[k]; const n = NOTE[v], g = new T.PlaneGeometry(n.w, n.h, 16, 3), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) / n.w + 0.5) * Math.PI) * bend); g.computeVertexNormals(); return (G[k] = g); };
    // a loose note lying flat (front up), like note() but sharing materials
    return (v, bend = 0.003) => { const [f, b] = mats(v), gg = geo(v, bend), inner = new T.Group(), wrap = new T.Group();
      mesh(gg, f, inner); mesh(gg, b, inner); inner.rotation.x = -Math.PI / 2; inner.position.y = 0.0004; wrap.add(inner); return wrap; };
  }

  // ---- coins: faces drawn so the text reads upright from the front (cylinder cap UVs are rotated 90°) ----
  const COIN = { 1: { r: 0.01095, h: 0.00145, m: 'silver' }, 2: { r: 0.01175, h: 0.0018, m: 'silver' },
                 5: { r: 0.0115, h: 0.0022, m: 'gold' }, 10: { r: 0.0135, h: 0.0021, m: 'bi' } };
  const GOLD = ['#fff4b8', '#f7c948', '#c68a12'], SILVER = ['#ffffff', '#d5dbe3', '#8e99a8'];
  function metalFill(c, W, H, cols, r) { const gr = c.createRadialGradient(W * 0.38, H * 0.34, W * 0.02, W / 2, H / 2, r); gr.addColorStop(0, cols[0]); gr.addColorStop(0.55, cols[1]); gr.addColorStop(1, cols[2]); c.fillStyle = gr; c.beginPath(); c.arc(W / 2, H / 2, r, 0, Math.PI * 2); c.fill(); }
  function emb(c, draw, dark, light, mid, o = 3) { c.fillStyle = dark; draw(o, o); c.fillStyle = light; draw(-o * 0.7, -o * 0.7); c.fillStyle = mid; draw(0, 0); }
  function beads(c, W, H, rr, n, dot, col) { c.fillStyle = col; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; c.beginPath(); c.arc(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr, dot, 0, Math.PI * 2); c.fill(); } }
  function arcText(c, W, H, text, rr, mid, size, col, bottom) {
    c.save(); c.font = `700 ${size}px ${FONT}`; c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle';
    const widths = [...text].map((ch) => c.measureText(ch).width + size * 0.08), total = widths.reduce((a, b) => a + b, 0);
    let a = mid - (bottom ? -1 : 1) * total / rr / 2;
    [...text].forEach((ch, i) => { const da = widths[i] / rr, ac = a + (bottom ? -1 : 1) * da / 2;
      c.save(); c.translate(W / 2 + Math.cos(ac) * rr, H / 2 + Math.sin(ac) * rr); c.rotate(ac + (bottom ? -Math.PI / 2 : Math.PI / 2)); c.fillText(ch, 0, 0); c.restore(); a += (bottom ? -1 : 1) * da; });
    c.restore();
  }
  const capXform = (c, W, H, tails) => tails ? c.setTransform(0, 1, -1, 0, W, 0) : c.setTransform(0, -1, 1, 0, 0, H);
  function coinFace(v, tails) {
    const s = COIN[v];
    return tex((c, W, H) => {
      capXform(c, W, H, tails); const R = W / 2;
      const main = s.m === 'silver' ? SILVER : GOLD, ink = s.m === 'silver' ? '#5b6676' : '#8a5a06';
      metalFill(c, W, H, main, R);
      if (s.m === 'bi') metalFill(c, W, H, SILVER, R * 0.6);
      c.strokeStyle = ink; c.globalAlpha = 0.55; c.lineWidth = 7; c.beginPath(); c.arc(W / 2, H / 2, R * 0.9, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
      if (s.m === 'bi') { c.lineWidth = 5; c.strokeStyle = '#7b6a3a'; c.beginPath(); c.arc(W / 2, H / 2, R * 0.6, 0, Math.PI * 2); c.stroke(); }
      beads(c, W, H, R * 0.83, 56, 3.2, s.m === 'silver' ? '#9aa4b2' : '#b07a10');
      const inkC = s.m === 'bi' ? '#56606e' : ink, lite = s.m === 'silver' ? '#ffffff' : '#fff7d1';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      if (!tails) {
        c.font = `700 ${R * (v === 10 ? 0.62 : 0.72)}px ${FONT}`; emb(c, (dx, dy) => c.fillText(`₹${v}`, W / 2 + dx, H / 2 + 8 + dy), inkC, lite, s.m === 'gold' ? '#d9a21e' : '#aab4c2');
        arcText(c, W, H, 'ZUNGGA', R * 0.7, -Math.PI / 2, R * 0.13, inkC);
      } else {
        c.font = `700 ${R * 0.85}px ${FONT}`; emb(c, (dx, dy) => c.fillText(`${v}`, W / 2 + dx, H / 2 - R * 0.06 + dy), inkC, lite, s.m === 'gold' ? '#d9a21e' : '#aab4c2');
        c.font = `700 ${R * 0.15}px ${FONT}`; c.fillStyle = inkC; c.fillText(v === 1 ? 'RUPEE' : 'RUPEES', W / 2, H / 2 + R * 0.46);
        arcText(c, W, H, '2026', R * 0.7, -Math.PI / 2, R * 0.12, inkC);
      }
    }, 512, 512);
  }
  function edgeTex(base, dark, n = 90) {
    return tex((c, W, H) => { c.fillStyle = base; c.fillRect(0, 0, W, H); c.fillStyle = dark; for (let i = 0; i < n; i++) c.fillRect(i * W / n, 0, W / n * 0.45, H); }, 1024, 16);
  }
  function coinKit() {
    const K = {};
    return (v) => K[v] || (K[v] = (() => {
      const s = COIN[v], col = s.m === 'silver' ? 0xc9d1db : 0xe0aa2a, m = { metalness: 0.55, roughness: 0.32 };
      const side = new T.MeshStandardMaterial({ map: edgeTex(s.m === 'silver' ? '#d3dae2' : '#e3ad2c', s.m === 'silver' ? '#8e99a8' : '#a8740d', v === 10 ? 0 : 110), ...m });
      return { geo: new T.CylinderGeometry(s.r, s.r, s.h, 48), mats: [side, new T.MeshStandardMaterial({ map: coinFace(v, false), ...m }), new T.MeshStandardMaterial({ map: coinFace(v, true), ...m })], col, s };
    })());
  }
  const coinMesh = (kit, v, parent, x = 0, y = 0, z = 0) => { const k = kit(v); return mesh(k.geo, k.mats, parent, x, y + k.s.h / 2, z); };
  function coinN(v) { const g = new T.Group(), s = COIN[v]; coinMesh(coinKit(), v, g); return { group: g, phys: { shape: 'cylinder', r: s.r, h: s.h, mass: 0.004 + v * 0.0006 } }; }

  // ---- the Zungga coin: heads = the real logo struck in gold, tails = big Z + "1 ZUNGGA", reeded edge ----
  function whenLogo(cb) {
    const t = logoTex(), ok = () => t.image && t.image.width > 0 && (t.image.complete !== false);
    if (ok()) { cb(t.image); return; }
    let n = 0; const iv = setInterval(() => { if (ok() || ++n > 200) { clearInterval(iv); if (ok()) cb(t.image); } }, 50);
  }
  function goldField(c, W, H) {
    const R = W / 2;
    metalFill(c, W, H, ['#fff2b0', '#e9b53a', '#a8700c'], R);
    const rim = c.createLinearGradient(0, 0, W, H); rim.addColorStop(0, '#fff6cf'); rim.addColorStop(0.5, '#d49b22'); rim.addColorStop(1, '#8a5a06');
    c.lineWidth = R * 0.1; c.strokeStyle = rim; c.beginPath(); c.arc(W / 2, H / 2, R * 0.94, 0, Math.PI * 2); c.stroke();
    const f = c.createRadialGradient(W * 0.42, H * 0.38, R * 0.05, W / 2, H / 2, R * 0.86); f.addColorStop(0, '#fff1a8'); f.addColorStop(0.6, '#f2c449'); f.addColorStop(1, '#d39a1f');
    c.fillStyle = f; c.beginPath(); c.arc(W / 2, H / 2, R * 0.86, 0, Math.PI * 2); c.fill();
    c.lineWidth = 6; c.strokeStyle = '#9a6a0a'; c.beginPath(); c.arc(W / 2, H / 2, R * 0.86, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 3; c.strokeStyle = '#fff3c4'; c.beginPath(); c.arc(W / 2, H / 2, R * 0.875, Math.PI * 0.9, Math.PI * 1.6); c.stroke();
    beads(c, W, H, R * 0.79, 72, 5, '#b8820f'); beads(c, W, H, R * 0.79, 72, 2.6, '#ffe9a0');
  }
  function drawHeads(c, W, H, img) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); capXform(c, W, H, false); goldField(c, W, H);
    const R = W / 2;
    if (!img) { c.font = `700 ${R}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; emb(c, (dx, dy) => c.fillText('Z', W / 2 + dx, H / 2 + dy), '#8a5a06', '#fff6cf', '#e8b53a', 6); return; }
    const lw = R * 1.3, lh = lw * img.height / img.width, cw = Math.ceil(lw), ch = Math.ceil(lh);
    const layer = (fn) => { const o = document.createElement('canvas'); o.width = cw; o.height = ch; const g = o.getContext('2d'); fn(g); return o; };
    const sil = (col) => layer((g) => { g.drawImage(img, 0, 0, cw, ch); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, cw, ch); });
    const gold = layer((g) => {
      g.filter = 'grayscale(1) contrast(1.15) brightness(1.35)'; g.drawImage(img, 0, 0, cw, ch); g.filter = 'none';
      g.globalCompositeOperation = 'multiply'; const gr = g.createLinearGradient(0, 0, cw, ch); gr.addColorStop(0, '#ffd76a'); gr.addColorStop(1, '#d9961a'); g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
      g.globalCompositeOperation = 'destination-in'; g.drawImage(img, 0, 0, cw, ch);
    });
    const x = W / 2 - cw / 2, y = H / 2 - ch / 2 + R * 0.02;
    c.drawImage(sil('#6e4705'), x + 5, y + 5); c.drawImage(sil('#fff7d6'), x - 3, y - 3); c.drawImage(gold, x, y);
  }
  function drawTails(c, W, H) {
    capXform(c, W, H, true); goldField(c, W, H);
    const R = W / 2; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `700 ${R * 0.95}px ${FONT}`; emb(c, (dx, dy) => c.fillText('Z', W / 2 + dx, H / 2 - R * 0.1 + dy), '#6e4705', '#fff7d6', '#efbd45', 7);
    c.font = `700 ${R * 0.17}px ${FONT}`; emb(c, (dx, dy) => c.fillText('1 ZUNGGA', W / 2 + dx, H / 2 + R * 0.5 + dy), '#6e4705', '#fff7d6', '#c98c14', 2);
    arcText(c, W, H, 'LEARN · CREATE · GROW', R * 0.68, -Math.PI / 2, R * 0.085, '#8a5a06');
    for (const a of [Math.PI * 0.8, Math.PI * 0.2]) { c.save(); c.translate(W / 2 + Math.cos(a) * R * 0.66, H / 2 + Math.sin(a) * R * 0.66); c.fillStyle = '#9a6a0a'; c.font = `700 ${R * 0.12}px ${FONT}`; c.fillText('★', 0, 0); c.restore(); }
  }
  function zunggaCoin() {
    const g = new T.Group(), r = 0.0125, h = 0.0026;
    const heads = tex((c, W, H) => drawHeads(c, W, H, null), 1024, 1024);
    whenLogo((img) => { const cv = heads.image; drawHeads(cv.getContext('2d'), cv.width, cv.height, img); heads.needsUpdate = true; });
    const tails = tex(drawTails, 1024, 1024);
    const m = { metalness: 0.6, roughness: 0.28 }, gold = new T.MeshStandardMaterial({ color: 0xf0bd45, ...m });
    const edge = edgeTex('#eab53c', '#9a6a0a', 150); edge.wrapS = T.RepeatWrapping;
    mesh(new T.CylinderGeometry(r, r, h, 64), [new T.MeshStandardMaterial({ map: edge, ...m }), new T.MeshStandardMaterial({ map: heads, ...m }), new T.MeshStandardMaterial({ map: tails, ...m })], g, 0, h / 2, 0);
    for (const y of [h, 0]) { const t = mesh(new T.TorusGeometry(r - 0.0005, 0.00042, 8, 72), gold, g, 0, y, 0); t.rotation.x = Math.PI / 2; }   // raised rims
    return { group: g, phys: { shape: 'cylinder', r, h, mass: 0.008 } };
  }

  // ---- coin tower: userData.setCount(n), setOn(true) = double height ----
  function coinStack() {
    const g = new T.Group(), kit = coinKit(), rnd = seeded(11), MAX = 40, s = COIN[5], coins = [];
    for (let i = 0; i < MAX; i++) { const c = coinMesh(kit, 5, g, (rnd() - 0.5) * 0.0016, i * s.h, (rnd() - 0.5) * 0.0016); c.rotation.y = rnd() * 6.28; coins.push(c); }
    g.userData.setCount = (n) => coins.forEach((c, i) => { c.visible = i < n; });
    g.userData.setOn = (on) => g.userData.setCount(on ? 24 : 12);
    g.userData.setCount(12);
    return { group: g };
  }

  // ---- note stacks: a tied bundle of notes with visible edges ----
  function edgeLines(v, rnd) {
    const n = NOTE[v];
    return tex((c, W, H) => {
      c.fillStyle = '#efeadb'; c.fillRect(0, 0, W, H);
      const rows = 70;
      for (let i = 0; i < rows; i++) { const y = i * H / rows, k = rnd(); c.fillStyle = k < 0.5 ? n.c : k < 0.8 ? '#ffffff' : n.ink; c.globalAlpha = k < 0.8 ? 0.85 : 0.35; c.fillRect(0, y, W, H / rows * (0.45 + rnd() * 0.3)); }
      c.globalAlpha = 1;
    }, 512, 256);
  }
  function bandLoop(w, h, d, x, parent, col) {   // a thin elastic band hugging the stack's cross-section (in the y-z plane at x)
    const hy = h / 2 + 0.0007, hz = d / 2 + 0.0007, rc = 0.0025, pts = [];
    for (const [cy, cz, a0] of [[hy - rc, hz - rc, 0], [hy - rc, -hz + rc, Math.PI / 2], [-hy + rc, -hz + rc, Math.PI], [-hy + rc, hz - rc, Math.PI * 1.5]])
      for (let k = 0; k <= 4; k++) { const a = a0 + k / 4 * Math.PI / 2; pts.push(new T.Vector3(x, h / 2 + cy + Math.sin(a) * rc, cz + Math.cos(a) * rc)); }
    return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 80, 0.0011, 6, true), mat(col, { roughness: 0.5 }), parent);
  }
  function bundle(v = 500, count = 200, seed = 5) {
    const g = new T.Group(), n = NOTE[v], h = count * 0.000108, rnd = seeded(seed);
    const top = new T.MeshStandardMaterial({ map: noteTex(v, false), roughness: 0.85 });
    const bt = noteTex(v, true); const bot = new T.MeshStandardMaterial({ map: bt, roughness: 0.85 });
    const ex = new T.MeshStandardMaterial({ map: edgeLines(v, rnd), roughness: 0.9 }), ez = new T.MeshStandardMaterial({ map: edgeLines(v, rnd), roughness: 0.9 });
    mesh(new T.BoxGeometry(n.w, h, n.h), [ex, ex, top, bot, ez, ez], g, 0, h / 2, 0);
    // paper band in the middle: "₹500 × 200 = ₹1,00,000"
    const total = (v * count).toLocaleString('en-IN');
    const bandT = tex((c, W, H) => {
      c.fillStyle = '#fbf6e6'; c.fillRect(0, 0, W, H); c.fillStyle = '#c2410c'; c.fillRect(0, 0, W * 0.08, H); c.fillRect(W * 0.92, 0, W * 0.08, H);
      c.translate(W / 2, H / 2); c.rotate(-Math.PI / 2); c.fillStyle = '#3f2a12'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `700 ${W * 0.3}px ${FONT}`; c.fillText(`₹${total}`, 0, -W * 0.13); c.font = `600 ${W * 0.17}px ${FONT}`; c.fillText(`₹${v} × ${count}`, 0, W * 0.2);
    }, 160, 330);
    const bandSide = new T.MeshStandardMaterial({ color: 0xf6efda, roughness: 0.8 }), bandTop = new T.MeshStandardMaterial({ map: bandT, roughness: 0.8 });
    mesh(new T.BoxGeometry(0.034, h + 0.0012, n.h + 0.0012), [bandSide, bandSide, bandTop, bandSide, bandSide, bandSide], g, 0, h / 2, 0);
    for (const x of [-n.w * 0.33, n.w * 0.33]) bandLoop(n.w, h, n.h, x, g, 0x9f2f12);
    return g;
  }
  function bundle1Lakh() { const g = bundle(500, 200, 5); const n = NOTE[500]; return { group: g, phys: { shape: 'box', size: [n.w, 0.022, n.h], mass: 0.2, yOffset: 0.011 } }; }
  function moneyBrick() {
    const g = new T.Group(), rnd = seeded(23), h = 200 * 0.000108 + 0.0014;
    for (let i = 0; i < 5; i++) { const b = bundle(500, 200, 5 + i * 7); b.position.set((rnd() - 0.5) * 0.004, i * h, (rnd() - 0.5) * 0.004); b.rotation.y = (rnd() - 0.5) * 0.04; g.add(b); }
    return { group: g, phys: { shape: 'box', size: [0.15, h * 5, 0.066], mass: 1, yOffset: h * 2.5 } };
  }

  // ---- loose money ----
  function moneyBunch() {
    const g = new T.Group(), kit = noteKit(), vals = [100, 50, 200, 500, 100, 200, 500];
    vals.forEach((v, i) => {
      const piv = new T.Group(), nt = kit(v, 0.002);
      nt.position.set(NOTE[v].w * 0.44, i * 0.0011, 0); piv.add(nt);
      piv.rotation.y = 0.9 - i * 0.28; piv.rotation.z = 0.004 * i; piv.position.set(-0.05, 0, 0.04); g.add(piv);
    });
    return { group: g };
  }
  function moneyPile() {
    const g = new T.Group(), kit = noteKit(), ck = coinKit(), rnd = seeded(97), R = 0.24, H = 0.11;
    const core = mesh(new T.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xc9c2a2, { roughness: 0.9 }), g); core.scale.set(R * 0.92, H * 0.92, R * 0.92);
    const VAL = [500, 500, 500, 200, 200, 100, 100, 50, 20, 10], up = new T.Vector3(0, 1, 0);
    const place = (obj, rr, a, lift, spin) => {
      const x = Math.cos(a) * rr * R, z = Math.sin(a) * rr * R, y = H * Math.sqrt(Math.max(0, 1 - rr * rr));
      const nrm = new T.Vector3(x / (R * R), y / (H * H), z / (R * R)).normalize();
      obj.quaternion.setFromUnitVectors(up, nrm).multiply(new T.Quaternion().setFromAxisAngle(up, spin));
      obj.position.set(x, y + lift, z); g.add(obj);
    };
    for (let i = 0; i < 78; i++) { const rr = Math.min(0.98, Math.pow(rnd(), 0.8)), v = VAL[Math.floor(rnd() * VAL.length)]; place(kit(v, 0.006), rr, rnd() * 6.283, -0.006 + i * 0.00008, rnd() * 6.283); }
    for (let i = 0; i < 3; i++) { const b = bundle(i === 1 ? 200 : 500, 100, 31 + i); place(b, 0.25 + i * 0.25, 0.8 + i * 2.1, -0.004, rnd() * 3); }
    for (let i = 0; i < 34; i++) {
      const v = [5, 10, 5, 2, 1, 10][i % 6], c = new T.Group(); coinMesh(ck, v, c);
      if (i < 24) place(c, Math.min(0.97, Math.pow(rnd(), 0.7)), rnd() * 6.283, 0.0005, rnd() * 6.283);
      else { const a = rnd() * 6.283, rr = R * (1.02 + rnd() * 0.25); c.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); c.rotation.y = rnd() * 6; g.add(c); }   // a few rolled away
    }
    return { group: g };
  }

  // ---- wallet: brown leather bifold, setOn(true) opens it to show the notes ----
  function wallet() {
    const g = new T.Group(), inner = new T.Group(); g.add(inner);
    const W = 0.115, D = 0.09, t = 0.0075;
    const grain = tex((c, Wd, Hd) => { c.fillStyle = '#7a4524'; c.fillRect(0, 0, Wd, Hd); const rnd = seeded(3); for (let i = 0; i < 1800; i++) { c.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,220,180,0.07)'; c.beginPath(); c.arc(rnd() * Wd, rnd() * Hd, 1 + rnd() * 2.5, 0, 6.3); c.fill(); } }, 256, 256);
    grain.wrapS = grain.wrapT = T.RepeatWrapping; grain.repeat.set(14, 14);
    const leather = new T.MeshStandardMaterial({ map: grain, roughness: 0.55 }), lining = new T.MeshStandardMaterial({ map: grain, color: 0xd9a777, roughness: 0.6 });
    const stitch = (w, d, inset) => tex((c, Wd, Hd) => { c.strokeStyle = '#f3dcb4'; c.lineWidth = 4; c.setLineDash([14, 9]); const ix = inset / w * Wd, iy = inset / d * Hd; c.beginPath(); c.roundRect(ix, iy, Wd - 2 * ix, Hd - 2 * iy, 14); c.stroke(); }, 512, Math.round(512 * d / w));
    const flat = (w, d, texr, parent, x, y, z) => { const m = mesh(new T.PlaneGeometry(w, d), new T.MeshStandardMaterial({ map: texr, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), parent, x, y, z); m.rotation.x = -Math.PI / 2; m.castShadow = false; return m; };
    const leaf = (parent, x0, yTop) => { const m = mesh(roundBox(W, t, D, 0.003), leather, parent, x0, yTop - t / 2, 0); return m; };
    // left leaf (stays on the table)
    leaf(inner, -W / 2, t); flat(W, D, stitch(W, D, 0.005), inner, -W / 2, t + 0.0003, 0);
    // right leaf on a hinge at x = 0, y = t
    const hinge = new T.Group(); hinge.position.set(0, t, 0); inner.add(hinge);
    leaf(hinge, W / 2, 0);
    const outer = flat(W, D, stitch(W, D, 0.005), hinge, W / 2, -t - 0.0003, 0); outer.rotation.x = Math.PI / 2;   // stitching on the outside (top when closed)
    const brand = mesh(new T.PlaneGeometry(0.05, 0.016), new T.MeshStandardMaterial({ map: tex((c, Wd, Hd) => { c.fillStyle = '#4a2410'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 ${Hd * 0.7}px ${FONT}`; c.fillText('ZUNGGA', Wd / 2, Hd / 2 + 3); }, 256, 80), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), hinge, W / 2, -t - 0.0004, -0.02);
    brand.rotation.x = Math.PI / 2; brand.rotation.z = Math.PI; brand.castShadow = false;
    cylSpine(inner);
    function cylSpine(p) { const s = mesh(new T.CylinderGeometry(t, t, D - 0.004, 16, 1, false, Math.PI, Math.PI), leather, p, 0, t, 0); s.rotation.x = Math.PI / 2; s.rotation.y = Math.PI / 2; }
    // inside: notes in the long pocket + card slots (only visible when open)
    const insides = new T.Group(); inner.add(insides);
    const kit = noteKit();
    [[100, -0.026], [200, -0.032], [500, -0.038]].forEach(([v, z], i) => { const nt = kit(v, 0.0015); nt.position.set(-0.004 + i * 0.006, t + 0.0006 + i * 0.0004, z); insides.add(nt); });
    for (const sx of [-1, 1]) {
      mesh(roundBox(W - 0.008, 0.0016, D * 0.55, 0.0007), lining, insides, sx * W / 2, t + 0.0022, D * 0.2);
      for (let k = 0; k < 3; k++) { const y = t + 0.0034 + k * 0.0006, z = D * 0.1 + k * 0.012;
        if (sx > 0 && k < 2) box(0.085, 0.0007, 0.054, [Z.purple, 0x0ea5e9][k], insides, sx * W / 2, y - 0.0003, z - 0.004 + 0.02, 0.0003);
        mesh(roundBox(W - 0.012, 0.0012, D * 0.55 - k * 0.012 - 0.012, 0.0005), leather, insides, sx * W / 2, y, z + (D * 0.55 - k * 0.012) / 2 - D * 0.27 + 0.004);
        flat(W - 0.012, 0.004, stitch(W - 0.012, 0.004, 0.0008), insides, sx * W / 2, y + 0.0007, z - D * 0.27 + 0.0055 + 0.012 * 0);
      }
    }
    g.userData.setOn = (on) => { hinge.rotation.z = on ? 0.05 : Math.PI; insides.visible = !!on; inner.position.x = on ? 0 : W / 2; };
    g.userData.setOn(false);
    return { group: g };
  }

  // ---- cloth money sack tied at the top, ₹ printed on the belly ----
  function moneyBag() {
    const g = new T.Group();
    const prof = new T.SplineCurve([[0.001, 0], [0.07, 0.006], [0.118, 0.035], [0.14, 0.09], [0.135, 0.15], [0.11, 0.2], [0.07, 0.238], [0.04, 0.262], [0.036, 0.275], [0.048, 0.292], [0.07, 0.315], [0.082, 0.33]].map(([x, y]) => new T.Vector2(x, y))).getPoints(48);
    const geo = new T.LatheGeometry(prof, 56, Math.PI, Math.PI * 2), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(x, z);
      const k = y > 0.2 ? (y > 0.28 ? 0.14 : 0.06 * (y - 0.2) / 0.08) : 0.012, f = 1 + k * Math.sin(a * 9 + y * 20); p.setX(i, x * f); p.setZ(i, z * f); }
    geo.computeVertexNormals();
    let vBelly = 0; prof.forEach((q, i) => { if (q.x > prof[Math.round(vBelly * (prof.length - 1))].x) vBelly = i / (prof.length - 1); });
    const cloth = tex((c, W, H) => {
      c.fillStyle = '#d8b680'; c.fillRect(0, 0, W, H);
      c.globalAlpha = 0.16; c.strokeStyle = '#7a5428'; c.lineWidth = 1.5;
      for (let x = 0; x < W; x += 6) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      for (let y = 0; y < H; y += 6) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      c.globalAlpha = 1; const cy = H * (1 - vBelly) + H * 0.04;
      c.fillStyle = '#f6e7c4'; c.beginPath(); c.ellipse(W / 2, cy, W * 0.075, H * 0.14, 0, 0, 6.3); c.fill();
      c.lineWidth = 6; c.strokeStyle = '#8a5a2b'; c.stroke();
      c.fillStyle = '#7c2d12'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 ${H * 0.22}px ${FONT}`; c.fillText('₹', W / 2, cy + 6);
    }, 1024, 512);
    const sack = mesh(geo, new T.MeshStandardMaterial({ map: cloth, roughness: 0.95, side: T.DoubleSide }), g);
    const rope = mat(0x8b5e34, { roughness: 0.85 });
    const tie = mesh(new T.TorusGeometry(0.039, 0.0065, 10, 36), rope, g, 0, 0.27, 0); tie.rotation.x = Math.PI / 2;
    sphere(0.011, 0x8b5e34, g, 0.004, 0.27, 0.04).material = rope;
    for (const [a, l] of [[0.35, 0.07], [-0.25, 0.055]]) { const e = mesh(new T.CylinderGeometry(0.0045, 0.0045, l, 8), rope, g, Math.sin(a) * l / 2 + 0.004, 0.27 - Math.cos(a) * l / 2, 0.044); e.rotation.z = a; }
    sack.receiveShadow = true;
    return { group: g };
  }

  ZAssets.register('money', 'note_500', '₹500 note', () => note(500), ["note", "rupee", "500"]);
  ZAssets.register('money', 'note_200', '₹200 note', () => note(200), ["note", "rupee", "200"]);
  ZAssets.register('money', 'coin_1', '₹1 coin', () => coinN(1), ["coin", "rupee", "1", "physics"]);
  ZAssets.register('money', 'coin_2', '₹2 coin', () => coinN(2), ["coin", "rupee", "2", "physics"]);
  ZAssets.register('money', 'coin_10', '₹10 coin', () => coinN(10), ["coin", "rupee", "10", "physics"]);
  ZAssets.register('money', 'money_bunch', 'Bunch of notes', moneyBunch, ["notes", "cash", "bunch"]);
  ZAssets.register('money', 'money_pile', 'Pile of money', moneyPile, ["notes", "coins", "pile", "rich", "treasure"]);
  ZAssets.register('money', 'bundle_1lakh', '₹1 lakh bundle', bundle1Lakh, ["bundle", "lakh", "cash", "500"]);
  ZAssets.register('money', 'money_brick', 'Brick of cash (₹5 lakh)', moneyBrick, ["bundle", "lakh", "cash", "brick"]);
  ZAssets.register('money', 'zungga_coin', 'Zungga gold coin', zunggaCoin, ["coin", "zungga", "gold", "physics"]);
  ZAssets.register('money', 'coin_stack', 'Stack of coins', coinStack, ["coins", "stack", "tower", "savings"]);
  ZAssets.register('money', 'wallet', 'Leather wallet', wallet, ["wallet", "purse", "leather"]);
  ZAssets.register('money', 'money_bag', 'Money sack', moneyBag, ["bag", "sack", "treasure"]);
})();
