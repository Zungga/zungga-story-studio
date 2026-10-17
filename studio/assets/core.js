/*
 * Zungga Story Studio — asset library core.
 * Category files (assets/<category>.js) call ZAssets.register(...). Stories refer to props by id,
 * so any prop already in the library is reused automatically by every new story.
 */
(() => {
  'use strict';
  const T = THREE;

  // Placeholder palette — swap for the real Zungga brand colours when they arrive (one place only).
  const Z = {
    purple: 0x7c3aed, pink: 0xec4899, yellow: 0xfacc15, orange: 0xfb923c, green: 0x22c55e, blue: 0x38bdf8,
    ink: 0x1f1a33, cream: 0xfff7e6, wood: 0xc08a52, woodDark: 0x8a5a33, steel: 0x9aa3ae, white: 0xf8fafc,
  };
  const FONT = '"Fredoka", system-ui, sans-serif';
  const hex = (c) => '#' + c.toString(16).padStart(6, '0');

  const mat = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.65, metalness: 0, ...o });
  const glassMat = (o = {}) => new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0, transmission: 0.85, thickness: 0.01, transparent: true, opacity: 0.45, ...o });
  function mesh(geo, m, parent, x = 0, y = 0, z = 0) {
    const me = new T.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true;
    if (parent) parent.add(me); return me;
  }
  function tex(draw, w = 512, h = 256) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  function fitText(g, text, maxW, size, weight = 700) {
    let s = size; g.font = `${weight} ${s}px ${FONT}`;
    while (g.measureText(text).width > maxW && s > 8) { s -= 2; g.font = `${weight} ${s}px ${FONT}`; }
    return s;
  }
  // rounded box: every edge softened (playful look)
  function roundBox(w, h, d, r = 0.02, seg = 4) {
    r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
    const sw = w - 2 * r, sh = h - 2 * r, e = Math.min(sw, sh) * 0.001;
    const s = new T.Shape();
    s.moveTo(-sw / 2 + e, -sh / 2); s.lineTo(sw / 2 - e, -sh / 2); s.lineTo(sw / 2, -sh / 2 + e); s.lineTo(sw / 2, sh / 2 - e);
    s.lineTo(sw / 2 - e, sh / 2); s.lineTo(-sw / 2 + e, sh / 2); s.lineTo(-sw / 2, sh / 2 - e); s.lineTo(-sw / 2, -sh / 2 + e); s.closePath();
    const g = new T.ExtrudeGeometry(s, { depth: Math.max(1e-4, d - 2 * r), bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: seg, curveSegments: 2 });
    g.center(); g.computeVertexNormals(); return g;
  }
  const box = (w, h, d, c, parent, x, y, z, r = 0.01) => mesh(roundBox(w, h, d, r), mat(c), parent, x, y, z);


  // the real Zungga logo / mascot as textures (loaded once, as soon as the page loads, so renders have them)
  const BASE = document.currentScript && document.currentScript.src ? new URL('.', document.currentScript.src).href : 'assets/';
  const IMG = {};
  function imgTex(file) { if (!IMG[file]) { const t = new T.TextureLoader().load(BASE + 'brand/' + file); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; IMG[file] = t; } return IMG[file]; }
  const logoTex = () => imgTex('zungga-logo.png'), mascotTex = () => imgTex('zungga-mascot.png');   // logo is 920×755, mascot is square-ish
  logoTex(); mascotTex();
  // a flat decal (transparent picture) facing +z, centred at (x, y, z) on parent
  function decal(texture, w, h, parent, x = 0, y = 0, z = 0) { const m = mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), parent, x, y, z); m.castShadow = false; return m; }
  // a canvas-drawn label/sign texture with centred text
  function label(text, { w = 512, h = 160, bg = '#ffffff', fg = '#1f1a33', size = 80, weight = 700, radius = 0 } = {}) {
    return tex((g, W, H) => { g.fillStyle = bg; if (radius) { g.beginPath(); g.roundRect(0, 0, W, H, radius); g.fill(); } else g.fillRect(0, 0, W, H); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; fitText(g, text, W * 0.9, size, weight); g.fillText(text, W / 2, H / 2 + 4); }, w, h);
  }
  const cyl = (rt, rb, h, c, parent, x, y, z, seg = 24) => mesh(new T.CylinderGeometry(rt, rb, h, seg), mat(c), parent, x, y, z);
  const sphere = (r, c, parent, x, y, z, seg = 24) => mesh(new T.SphereGeometry(r, seg, Math.round(seg * 0.75)), mat(c), parent, x, y, z);

  // bounding box for framing a prop in previews: skips sky pieces (moon, stars…) marked userData.sky = true
  function frameBox(obj) {
    obj.updateMatrixWorld(true); const box = new T.Box3(), b = new T.Box3();
    (function walk(o) { if (o.userData && o.userData.sky) return; if ((o.isMesh || o.isPoints || o.isInstancedMesh) && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); if (o.isInstancedMesh) b.setFromObject(o); box.union(b); } for (const c of o.children) walk(c); })(obj);
    return box.isEmpty() ? new T.Box3().setFromObject(obj) : box;
  }

  const REG = {};
  window.ZA = { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box, logoTex, mascotTex, decal, label, cyl, sphere, frameBox };
  window.ZAssets = {
    palette: Z,
    helpers: { mat, mesh, tex, roundBox },
    register(cat, id, label, fn, tags = []) { if (REG[id]) throw new Error('Duplicate prop id: ' + id); REG[id] = { id, label, cat, fn, tags }; },
    get list() { return Object.values(REG).map(({ id, label, cat, tags }) => ({ id, label, cat, tags })); },
    has: (id) => !!REG[id],
    build(id) { const a = REG[id]; if (!a) throw new Error('Unknown prop: ' + id); const r = a.fn(); r.group.userData.propId = id; return r; },
    find(q) { q = q.toLowerCase(); return this.list.filter((a) => a.id.includes(q) || a.label.toLowerCase().includes(q) || a.tags.some((t) => t.includes(q))); },
  };
})();
