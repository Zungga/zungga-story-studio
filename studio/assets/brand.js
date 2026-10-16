/* Zungga Story Studio — brand props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box } = ZA;
  const SRC = document.currentScript && document.currentScript.src;
  const LOGO_URL = SRC ? new URL('brand/zungga-logo.png', SRC).href : 'assets/brand/zungga-logo.png';
  function zunggaLogo() {   // the real Zungga logo (assets/brand/zungga-logo.png) on a white card
    const g = new T.Group();
    const t = new T.TextureLoader().load(LOGO_URL); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    const W = 0.44, H = W * 755 / 920;
    mesh(new T.BoxGeometry(W + 0.06, H + 0.06, 0.02), mat(0xffffff), g, 0, H / 2 + 0.03, 0);
    mesh(new T.PlaneGeometry(W, H), new T.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.5 }), g, 0, H / 2 + 0.03, 0.0105).castShadow = false;
    return { group: g };
  }
  ZAssets.register('brand', 'zungga_logo', 'Zungga logo', zunggaLogo, ["logo", "brand", "end card"]);
})();
