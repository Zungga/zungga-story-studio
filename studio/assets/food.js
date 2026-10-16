/* Zungga Story Studio — food props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box } = ZA;
  function chips() {
    const g = new T.Group(), W = 0.16, H = 0.22, D = 0.07;
    const geo = new T.BoxGeometry(W, H, D, 12, 16, 6), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / (W / 2), y = p.getY(i) / (H / 2);
      let z = p.getZ(i) * Math.cos(x * Math.PI / 2.4) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(y), 6)), 0.6);
      if (Math.abs(y) > 0.9) z = Math.sign(p.getZ(i)) * 0.002 * (1 + Math.sin(x * 40));            // crimped seal
      p.setZ(i, z);
    }
    geo.computeVertexNormals();
    const front = tex((c, Wd, Hd) => {
      const gr = c.createLinearGradient(0, 0, 0, Hd); gr.addColorStop(0, '#f97316'); gr.addColorStop(1, '#dc2626');
      c.fillStyle = gr; c.fillRect(0, 0, Wd, Hd);
      for (let y = 0; y < Hd; y += 22) { c.fillStyle = '#ffffff22'; c.fillRect(0, y, Wd, 4); }
      c.fillStyle = '#facc15'; c.beginPath(); c.ellipse(Wd / 2, Hd * 0.62, Wd * 0.34, Hd * 0.18, -0.2, 0, Math.PI * 2); c.fill();
      for (let i = 0; i < 5; i++) { c.fillStyle = '#fde68a'; c.beginPath(); c.ellipse(Wd * (0.32 + i * 0.09), Hd * (0.6 + (i % 2) * 0.05), 30, 18, i, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#d97706'; c.lineWidth = 3; c.stroke(); }
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, 'CRUNCHY', Wd * 0.85, 120); c.lineWidth = 12; c.strokeStyle = hex(Z.ink); c.strokeText('CRUNCHY', Wd / 2, Hd * 0.25); c.fillText('CRUNCHY', Wd / 2, Hd * 0.25);
      c.font = `600 52px ${FONT}`; c.fillText('Masala Chips', Wd / 2, Hd * 0.38);
      c.fillStyle = hex(Z.ink); c.font = `700 46px ${FONT}`; c.fillText('₹20', Wd * 0.8, Hd * 0.88);
    }, 512, 704);
    const side = mat(0xdc2626, { roughness: 0.35, metalness: 0.2 }), foil = new T.MeshStandardMaterial({ map: front, roughness: 0.35, metalness: 0.15 });
    mesh(geo, [side, side, side, side, foil, foil], g, 0, H / 2, 0);
    return { group: g, phys: { shape: 'box', size: [W, H, D * 0.6], mass: 0.05 } };
  }
  function juice() {
    const g = new T.Group(), W = 0.065, H = 0.105, D = 0.042;
    const label = (back) => tex((c, Wd, Hd) => {
      c.fillStyle = '#fde047'; c.fillRect(0, 0, Wd, Hd); c.fillStyle = '#f59e0b'; c.beginPath(); c.arc(Wd * 0.5, Hd * 0.6, Wd * 0.3, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#16a34a'; c.beginPath(); c.ellipse(Wd * 0.62, Hd * 0.36, Wd * 0.12, Wd * 0.05, -0.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = hex(Z.ink); c.textAlign = 'center'; c.textBaseline = 'middle'; fitText(c, back ? '200 ml' : 'MANGO', Wd * 0.9, 90); c.fillText(back ? '200 ml' : 'MANGO', Wd / 2, Hd * 0.16);
      c.font = `600 40px ${FONT}`; c.fillText(back ? 'Fruit drink' : 'JUICE', Wd / 2, Hd * 0.9);
    }, 320, 512);
    const plain = mat(0xfde047, { roughness: 0.5 });
    mesh(new T.BoxGeometry(W, H, D), [plain, plain, plain, plain, new T.MeshStandardMaterial({ map: label(false), roughness: 0.5 }), new T.MeshStandardMaterial({ map: label(true), roughness: 0.5 })], g, 0, H / 2, 0);
    const fold = mesh(new T.CylinderGeometry(0.0001, D / 2, 0.012, 4, 1).rotateY(Math.PI / 4).scale(W / D * 1.0, 1, 1), plain, g, 0, H + 0.006, 0);
    fold.scale.set(1, 1, 1);
    const straw = new T.Group(); straw.position.set(W * 0.28, H, 0); g.add(straw);
    mesh(new T.CylinderGeometry(0.002, 0.002, 0.06, 8), mat(Z.pink), straw, 0, 0.03, 0).rotation.z = -0.25;
    return { group: g, phys: { shape: 'box', size: [W, H, D], mass: 0.2 } };
  }
  ZAssets.register('food', 'chips', 'Chips packet', chips, ["snack", "packet", "recess"]);
  ZAssets.register('food', 'juice', 'Juice box', juice, ["drink", "mango", "straw"]);
})();
