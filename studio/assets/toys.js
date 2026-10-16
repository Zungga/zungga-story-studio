/* Zungga Story Studio — toys props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box } = ZA;
  function football(withTag = true) {
    const g = new T.Group(), r = 0.11;
    const geo = new T.IcosahedronGeometry(r, 5).toNonIndexed();
    const ico = new T.IcosahedronGeometry(1, 0), dirs = [], ip = ico.attributes.position;
    for (let i = 0; i < ip.count; i++) { const v = new T.Vector3().fromBufferAttribute(ip, i).normalize(); if (!dirs.some((d) => d.distanceTo(v) < 1e-3)) dirs.push(v); }
    const p = geo.attributes.position, cols = [], ctr = new T.Vector3();
    for (let i = 0; i < p.count; i += 3) {
      ctr.set(0, 0, 0); for (let k = 0; k < 3; k++) ctr.add(new T.Vector3().fromBufferAttribute(p, i + k)); ctr.normalize();
      const dark = dirs.some((d) => d.dot(ctr) > 0.955);   // 12 small black pentagon patches
      for (let k = 0; k < 3; k++) cols.push(...(dark ? [0.1, 0.1, 0.14] : [0.97, 0.97, 0.98]));
    }
    geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
    const ball = mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.4 }), g, 0, r, 0);
    if (withTag) {
      const tag = new T.Group(); tag.position.set(r * 0.55, r * 1.75, r * 0.55); g.add(tag);
      const t = tex((c, W, H) => { c.fillStyle = hex(Z.yellow); c.beginPath(); c.roundRect(4, 4, W - 8, H - 8, 30); c.fill(); c.fillStyle = hex(Z.ink); c.beginPath(); c.arc(50, H / 2, 16, 0, Math.PI * 2); c.fill(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 ${H * 0.55}px ${FONT}`; c.fillText('₹150', W * 0.58, H * 0.54); }, 512, 220);
      mesh(new T.BoxGeometry(0.1, 0.043, 0.002), [mat(Z.yellow), mat(Z.yellow), mat(Z.yellow), mat(Z.yellow), new T.MeshStandardMaterial({ map: t }), new T.MeshStandardMaterial({ map: t })], tag);
      const string = new T.Mesh(new T.CylinderGeometry(0.0008, 0.0008, 0.09, 4), mat(Z.ink)); string.position.set(-0.04, -0.035, 0); string.rotation.z = 0.7; tag.add(string);
      g.userData.tag = tag;
    }
    return { group: g, phys: { shape: 'sphere', r, mass: 0.43 } };
  }
  ZAssets.register('toys', 'football', 'Football + ₹150 tag', () => football(true), ["ball", "sport", "price tag", "physics"]);
})();
