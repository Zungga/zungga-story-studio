/* Zungga Story Studio — money props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box } = ZA;
  const NOTE = { 100: { c: '#b9a4e8', ink: '#4c2f8f', w: 0.142, h: 0.066, word: 'One Hundred Rupees' },
                 50: { c: '#7fd3e6', ink: '#0d5e72', w: 0.135, h: 0.066, word: 'Fifty Rupees' },
                 20: { c: '#c9e27a', ink: '#556b12', w: 0.129, h: 0.063, word: 'Twenty Rupees' },
                 10: { c: '#c79a6b', ink: '#5c3814', w: 0.123, h: 0.063, word: 'Ten Rupees' } };

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
})();
