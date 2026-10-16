/* Zungga Story Studio — school props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box } = ZA;
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
})();
