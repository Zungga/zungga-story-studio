/* Zungga Story Studio — shop props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box } = ZA;
  function shopCounter() {   // the stationery shop
    const g = new T.Group(), W = 1.6, H = 1.0, D = 0.6;
    box(W, H, D, Z.wood, g, 0, H / 2, 0, 0.02);
    box(W + 0.06, 0.04, D + 0.06, Z.woodDark, g, 0, H + 0.02, 0, 0.01);
    const front = tex((c, Wd, Hd) => { c.fillStyle = hex(Z.orange); c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 120px ${FONT}`; c.fillText('Pens · Pencils · Books', Wd / 2, Hd / 2); }, 1600, 300);
    mesh(new T.PlaneGeometry(W * 0.92, 0.2), new T.MeshStandardMaterial({ map: front }), g, 0, 0.78, D / 2 + 0.001);
    // glass display case on the counter
    const caseG = new T.Group(); caseG.position.set(0.4, H + 0.04, 0); g.add(caseG);
    mesh(new T.BoxGeometry(0.6, 0.25, 0.4), glassMat(), caseG, 0, 0.125, 0).castShadow = false;
    for (let i = 0; i < 6; i++) box(0.06, 0.03 + (i % 3) * 0.02, 0.1, [Z.pink, Z.blue, Z.green][i % 3], caseG, -0.22 + i * 0.09, 0.03, 0, 0.004);   // erasers / sharpeners
    // pencil jar + price card
    const jar = new T.Group(); jar.position.set(-0.5, H + 0.04, 0.05); g.add(jar);
    mesh(new T.CylinderGeometry(0.05, 0.045, 0.11, 24, 1, true), glassMat({ side: T.DoubleSide }), jar, 0, 0.055, 0).castShadow = false;
    for (let i = 0; i < 9; i++) { const p = ZAssets.build('pencil').group; p.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.3; p.rotation.y = i; p.position.set(Math.cos(i * 2.1) * 0.02, 0.09, Math.sin(i * 2.1) * 0.02); jar.add(p); }
    const card = tex((c, Wd, Hd) => { c.fillStyle = '#fff'; c.fillRect(0, 0, Wd, Hd); c.strokeStyle = hex(Z.ink); c.lineWidth = 8; c.strokeRect(6, 6, Wd - 12, Hd - 12); c.fillStyle = hex(Z.ink); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 70px ${FONT}`; c.fillText('Pencil ₹3', Wd / 2, Hd / 2); }, 512, 200);
    const cardM = mesh(new T.PlaneGeometry(0.16, 0.063), new T.MeshStandardMaterial({ map: card, side: T.DoubleSide }), g, -0.32, H + 0.08, 0.15); cardM.rotation.x = -0.4;
    // back shelf + signboard
    box(W, 1.5, 0.04, Z.woodDark, g, 0, 1.25, -1.03, 0.01);                                                          // open shelf: back panel
    for (const x of [-W / 2, W / 2]) box(0.04, 1.5, 0.3, Z.woodDark, g, x, 1.25, -0.89, 0.01);                     // sides
    for (let s = 0; s < 4; s++) box(W, 0.03, 0.3, Z.woodDark, g, 0, 0.52 + s * 0.38, -0.89, 0.006);               // shelves
    for (let s = 0; s < 3; s++) for (let i = 0; i < 9; i++) { const h = 0.2 + ((i * 7 + s * 3) % 5) * 0.025; box(0.13, h, 0.2, [Z.blue, Z.pink, Z.yellow, Z.green, Z.purple][(i + s) % 5], g, -0.68 + i * 0.17, 0.535 + s * 0.38 + h / 2, -0.88, 0.008); }
    const sign = tex((c, Wd, Hd) => { const gr = c.createLinearGradient(0, 0, Wd, 0); gr.addColorStop(0, hex(Z.purple)); gr.addColorStop(1, hex(Z.pink)); c.fillStyle = gr; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 150px ${FONT}`; c.fillText('STATIONERY', Wd / 2, Hd / 2); }, 1600, 300);
    box(W + 0.2, 0.34, 0.06, Z.purple, g, 0, 2.05, -0.9, 0.01);
    mesh(new T.PlaneGeometry(W + 0.12, 0.28), new T.MeshStandardMaterial({ map: sign }), g, 0, 2.05, -0.865);
    return { group: g, phys: { shape: 'box', size: [W, H + 0.04, D], mass: 0, yOffset: (H + 0.04) / 2 }, top: H + 0.04 };
  }
  ZAssets.register('shop', 'shop_counter', 'Stationery shop counter', shopCounter, ["shop", "counter", "stationery"]);
})();
