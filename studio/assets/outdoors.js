/* Zungga Story Studio — island outdoors (ported from the drive-portfolio island game, js/game.js).
 * park · camping · beach · landmarks · weather. Game scale is real metres already.
 * setOn(on): lights / glow after dark (lamps, signs, cave runes, campfire burning, gate highlighted, umbrella open).
 * tick(t): pure functions of t (water ripples + swells, flame flicker, pad ring pulse, boost-pad pulse, fountain jets). */
(() => {
  'use strict';
  const { T, mat, mesh, tex } = ZA;

  // ---------- local helpers ----------
  const gm = (c, o = {}) => mat(c, { roughness: 0.85, ...o });
  const flatM = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true, ...o });
  const add = (geo, m, x = 0, y = 0, z = 0, parent) => mesh(geo, m, parent, x, y, z);
  const ns = (m) => { m.castShadow = false; return m; };
  const seeded = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
  const GFONT = 'system-ui, sans-serif';
  function jitter(geo, amt, rnd) { const p = geo.attributes.position; for (let k = 0; k < p.count; k++) p.setXYZ(k, p.getX(k) + (rnd() * 2 - 1) * amt, p.getY(k) + (rnd() * 2 - 1) * amt, p.getZ(k) + (rnd() * 2 - 1) * amt); geo.computeVertexNormals(); return geo; }
  const label = (text, fg, bg, w = 512, h = 128, font = 800) => tex((c, W, H) => {
    if (bg) { c.fillStyle = bg; c.fillRect(0, 0, W, H); }
    c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
    let fs = Math.floor(H * 0.62); c.font = `${font} ${fs}px ${GFONT}`;
    while (c.measureText(text).width > W - 24 && fs > 12) { fs -= 2; c.font = `${font} ${fs}px ${GFONT}`; }
    c.fillText(text, W / 2, H / 2 + 2);
  }, w, h);
  const glowTex = (inner, outer) => tex((g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, 256, 256);
  function nightSet() {
    const L = [];
    return {
      std(m, day, night) { L.push({ m, day, night }); m.emissiveIntensity = day; return m; },
      basic(m, max, min = 0) { L.push({ m, max, min, b: true }); m.opacity = min; return m; },
      vis(o, onVis = true) { L.push({ o, onVis }); return o; },
      set(on) { for (const g of L) { if (g.o) g.o.visible = on === g.onVis; else if (g.b) g.m.opacity = on ? g.max : g.min; else g.m.emissiveIntensity = on ? g.night : g.day; } },
    };
  }
  const signMat = (N, t) => N.std(new T.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.7 }), 0, 0.85);
  const finish = (g, N, on = false) => { g.userData.setOn = (v) => N.set(!!v); N.set(on); return { group: g }; };
  const woodMat = () => gm(0x9c6b3f, { roughness: 0.8 }), ironMat = () => gm(0x2b2f3a, { metalness: 0.5, roughness: 0.5 });
  function halo(N, g, x, y, z, s, inner, outer, max, min = 0) {
    const sp = new T.Sprite(N.basic(new T.SpriteMaterial({ map: glowTex(inner, outer), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }), max, min));
    sp.position.set(x, y, z); sp.scale.set(s, s, 1); g.add(sp); return sp;
  }
  function lampPost(N, g, x, z) {   // game lines 1075–1095
    const iron = ironMat();
    add(new T.CylinderGeometry(0.08, 0.12, 3.6, 8), iron, x, 1.8, z, g); add(new T.CylinderGeometry(0.22, 0.26, 0.2, 8), iron, x, 0.1, z, g); add(new T.CylinderGeometry(0.16, 0.08, 0.22, 8), iron, x, 3.52, z, g);
    ns(add(new T.SphereGeometry(0.28, 14, 10), N.std(new T.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffd08a, emissiveIntensity: 0.15 }), 0.15, 3), x, 3.78, z, g));
    halo(N, g, x, 3.78, z, 2.6, 'rgba(255,220,160,0.9)', 'rgba(255,190,110,0.25)', 0.85);
  }
  function bench(g, x, z, ry) {   // game lines 849–856
    const b = new T.Group(); b.position.set(x, 0, z); b.rotation.y = ry; g.add(b);
    const wood = woodMat(), iron = ironMat();
    add(new T.BoxGeometry(1.8, 0.08, 0.5), wood, 0, 0.5, 0, b); add(new T.BoxGeometry(1.8, 0.4, 0.06), wood, 0, 0.8, -0.25, b);
    for (const sx of [-0.8, 0.8]) ns(add(new T.BoxGeometry(0.08, 0.47, 0.46), iron, sx, 0.24, 0, b));
  }

  // ---------- water shader (game makeWater, lines 268–339) in prop-local coordinates ----------
  // geometry must already lie in xz (rotateX(-PI/2)); mode 0 = river (foam at |z - cz| = halfW), 1 = round pool (foam at radius)
  function makeWater(o = {}) {
    return new T.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 }, uDeep: { value: new T.Color(o.deep ?? 0x0b3d5c) }, uShallow: { value: new T.Color(o.shallow ?? 0x2fa3b8) },
        uSky: { value: new T.Color(0xbfe0ff) }, uSunDir: { value: new T.Vector3(0.45, 0.8, 0.3).normalize() },
        uMode: { value: o.mode || 0 }, uCenter: { value: new T.Vector2(o.cx || 0, o.cz || 0) },
        uHalfW: { value: o.halfW || 9 }, uRadius: { value: o.radius || 6 }, uScale: { value: o.scale || 0.55 },
      },
      vertexShader: `uniform float uTime; varying vec3 vW; varying vec2 vXZ;
        void main(){ vec3 p = position; p.y += sin(p.x*0.35 + uTime*1.6)*0.06 + sin(p.z*0.6 - uTime*1.1)*0.05;
          vXZ = p.xz; vec4 wp = modelMatrix * vec4(p, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `uniform float uTime, uMode, uHalfW, uRadius, uScale; uniform vec3 uDeep, uShallow, uSky, uSunDir; uniform vec2 uCenter;
        varying vec3 vW; varying vec2 vXZ;
        vec3 waveNormal(vec2 p){ float t = uTime; vec2 d = vec2(0.0);
          vec2 q1 = p*0.9 + vec2(t*0.9, t*0.35);  d += vec2(cos(q1.x)*cos(q1.y), -sin(q1.x)*sin(q1.y))*0.9;
          vec2 q2 = p*1.7 + vec2(-t*0.6, t*1.1);  d += vec2(cos(q2.x)*cos(q2.y), -sin(q2.x)*sin(q2.y))*1.7*0.45;
          vec2 q3 = p*3.9 + vec2(t*1.8, -t*0.8);  d += vec2(cos(q3.x)*cos(q3.y), -sin(q3.x)*sin(q3.y))*3.9*0.12;
          vec2 q4 = p*8.3 + vec2(-t*2.4, t*1.9);  d += vec2(cos(q4.x)*cos(q4.y), -sin(q4.x)*sin(q4.y))*8.3*0.035;
          return normalize(vec3(-d.x*0.08, 1.0, -d.y*0.08)); }
        void main(){
          vec3 n = waveNormal(vXZ*uScale); vec3 v = normalize(cameraPosition - vW);
          float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
          float edge = clamp(uMode < 0.5 ? abs(vXZ.y - uCenter.y)/uHalfW : length(vXZ - uCenter)/uRadius, 0.0, 1.0);
          vec3 base = mix(uDeep, uShallow, smoothstep(0.35, 1.0, edge));
          vec3 col = mix(base, uSky, 0.15 + fres*0.75);
          vec3 r = reflect(-uSunDir, n); col += vec3(1.0, 0.95, 0.85) * pow(max(dot(r, v), 0.0), 160.0) * 2.2;
          float foam = smoothstep(0.82, 1.0, edge) * (0.55 + 0.45*sin(vXZ.x*1.3 + vXZ.y*0.7 + uTime*2.0 + n.x*20.0));
          col = mix(col, vec3(0.95,0.98,1.0), foam*0.75);
          gl_FragColor = vec4(col, mix(0.86, 0.97, fres));
          #include <colorspace_fragment>
        }`,
    });
  }
  const waterPlane = (w, d, m, g, x = 0, y = 0, z = 0, segW = 60, segD = 30) => { const me = add(new T.PlaneGeometry(w, d, segW, segD).rotateX(-Math.PI / 2), m, x, y, z, g); me.castShadow = false; return me; };
  const circleWater = (r, m, g, y, seg = 48) => { const me = add(new T.CircleGeometry(r, seg).rotateX(-Math.PI / 2), m, 0, y, 0, g); me.castShadow = false; return me; };

  // =============================== PARK (game lines 973–1015) ===============================
  ZAssets.register('park', 'park_gazebo', 'Park gazebo', () => {
    const g = new T.Group();
    add(new T.CylinderGeometry(4.2, 4.4, 0.25, 8), gm(0xdee2e6), 0, 0.12, 0, g);
    const white = gm(0xf8f9fa);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8; add(new T.CylinderGeometry(0.12, 0.12, 3, 8), white, Math.cos(a) * 3.6, 1.7, Math.sin(a) * 3.6, g); }
    add(new T.ConeGeometry(5, 2.2, 8), gm(0x2b8a3e), 0, 4.3, 0, g).rotation.y = Math.PI / 8;
    return { group: g };
  }, ['gazebo', 'pavilion', 'park']);

  const BEDS = [['red', 0xf03e3e], ['yellow', 0xfcc419], ['pink', 0xf783ac], ['white', 0xffffff]];
  BEDS.forEach(([id, col], b) => ZAssets.register('park', 'flower_bed_' + id, `Flower bed (${id})`, () => {
    const g = new T.Group(), rnd = seeded(11 + b * 7);
    add(new T.CylinderGeometry(2.2, 2.4, 0.3, 20), gm(0x6b4f35), 0, 0.15, 0, g);
    const im = new T.InstancedMesh(new T.IcosahedronGeometry(0.2, 0), flatM(col), 40), d = new T.Object3D();
    for (let k = 0; k < 40; k++) {
      const r = Math.sqrt(rnd()) * 2, t = rnd() * 6.28;
      d.position.set(Math.cos(t) * r, 0.42, Math.sin(t) * r); d.scale.setScalar(0.8 + rnd() * 0.5); d.updateMatrix(); im.setMatrixAt(k, d.matrix);
    }
    im.castShadow = true; g.add(im);
    return { group: g };
  }, ['flower bed', 'flowers', 'garden', 'park', id + ' flowers']));

  const pathMat = () => gm(0xe6d3a3, { roughness: 1 });
  ZAssets.register('park', 'park_path_straight', 'Park path (straight, 3 × 8 m)', () => {
    const g = new T.Group(); add(new T.BoxGeometry(3, 0.03, 8), pathMat(), 0, 0.015, 0, g); return { group: g };
  }, ['park path', 'footpath', 'path']);
  ZAssets.register('park', 'park_path_curve', 'Park path (curve of the ring)', () => {
    const g = new T.Group();
    const geo = new T.RingGeometry(16, 19, 24, 1, Math.PI / 2 - Math.PI / 8, Math.PI / 4).rotateX(-Math.PI / 2);   // a 45° piece of the 16–19 m path ring
    const me = add(geo, pathMat(), 0, 0.02, 17.5, g); me.castShadow = false;
    return { group: g };
  }, ['park path', 'curved path']);
  ZAssets.register('park', 'park_lawn', 'Park lawn with cross paths', () => {
    const g = new T.Group();
    ns(add(new T.CircleGeometry(8, 48).rotateX(-Math.PI / 2), gm(0x84cc5c, { roughness: 1 }), 0, 0.01, 0, g));
    for (const r of [0, Math.PI / 2]) { const p = add(new T.PlaneGeometry(3, 16).rotateX(-Math.PI / 2), pathMat(), 0, 0.02 + r * 0.001, 0, g); p.rotation.y = r; p.castShadow = false; }
    return { group: g };
  }, ['lawn', 'park lawn', 'grass']);

  // =============================== CAMPING (game lines 1017–1045) ===============================
  const TENTS = [['orange', 0xf76707], ['teal', 0x12b886], ['yellow', 0xfab005], ['red', 0xe03131], ['blue', 0x4263eb]];
  TENTS.forEach(([id, col]) => ZAssets.register('camping', 'tent_' + id, `Tent (${id})`, () => {
    const g = new T.Group();
    const sh = new T.Shape(); sh.moveTo(-1.6, 0); sh.lineTo(0, 2.2); sh.lineTo(1.6, 0); sh.closePath();
    const tg = new T.ExtrudeGeometry(sh, { depth: 3.4, bevelEnabled: false }); tg.translate(0, 0, -1.7);
    add(tg, gm(col, { roughness: 0.7 }), 0, 0, 0, g);
    const ds = new T.Shape(); ds.moveTo(-0.55, 0); ds.lineTo(0, 1.2); ds.lineTo(0.55, 0); ds.closePath();
    ns(add(new T.ShapeGeometry(ds), gm(0x212529), 0, 0.01, 1.72, g));
    return { group: g };
  }, ['tent', 'camping', 'camp', id + ' tent']));

  ZAssets.register('camping', 'campfire', 'Campfire', () => {
    const g = new T.Group(), N = nightSet();
    ns(add(new T.CircleGeometry(1.6, 16).rotateX(-Math.PI / 2), gm(0x495057, { roughness: 1 }), 0, 0.03, 0, g));
    for (const r of [0.5, -0.6]) add(new T.CylinderGeometry(0.14, 0.14, 1.8, 7), gm(0x5c3d2e), 0, 0.18, 0, g).rotation.set(Math.PI / 2, 0, r);
    const flame = new T.Group(); flame.position.set(0, 0.25, 0); g.add(flame); N.vis(flame);
    ns(add(new T.ConeGeometry(0.55, 1.4, 8), new T.MeshBasicMaterial({ color: 0xff8a00, transparent: true, opacity: 0.9 }), 0, 0.7, 0, flame));
    ns(add(new T.ConeGeometry(0.3, 0.9, 8), new T.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.95 }), 0, 0.5, 0, flame));
    N.vis(halo(N, g, 0, 1.2, 0, 5, 'rgba(255,170,60,0.9)', 'rgba(255,120,40,0.3)', 0.35, 0.35));
    g.userData.tick = (t) => { flame.scale.set(1 + Math.sin(t * 13) * 0.06, 1 + Math.sin(t * 9.7) * 0.15 + Math.sin(t * 23) * 0.05, 1); flame.rotation.y = t * 0.8; };
    return finish(g, N, true);
  }, ['campfire', 'bonfire', 'fire', 'camp']);

  ZAssets.register('camping', 'camp_log_seat', 'Log seat', () => {
    const g = new T.Group(); add(new T.CylinderGeometry(0.28, 0.28, 2, 9), gm(0x7a5230), 0, 0.28, 0, g).rotation.z = Math.PI / 2; return { group: g };
  }, ['log', 'log seat', 'camp']);

  // =============================== BEACH ===============================
  // sunrise / sunset decks (game lines 1047–1062, lamps 1074). Turned so the sign faces the camera; the railing + sea side is at the back.
  function deck(name) {
    const g = new T.Group(), N = nightSet(), s = new T.Group(); s.rotation.y = Math.PI; g.add(s);
    const wood = woodMat(), iron = ironMat();
    add(new T.BoxGeometry(12, 0.18, 9), gm(0xb08055), 0, 0.09, 0, s);
    for (let k = -5; k <= 5; k += 2.5) ns(add(new T.BoxGeometry(0.15, 1.0, 0.15), wood, k, 0.6, 4.4, s));
    ns(add(new T.BoxGeometry(12, 0.1, 0.12), wood, 0, 1.05, 4.4, s));
    ns(add(new T.PlaneGeometry(4.2, 1), signMat(N, label(name, '#fff', '#d9480f')), 0, 2.6, -4.36, s)).rotation.y = Math.PI;
    add(new T.BoxGeometry(4.3, 1.08, 0.06), wood, 0, 2.6, -4.32, s);
    for (const sx of [-1.6, 1.6]) ns(add(new T.BoxGeometry(0.12, 2.3, 0.12), wood, sx, 1.15, -4.3, s));
    ns(add(new T.CylinderGeometry(0.06, 0.08, 1.2, 8), iron, 4.4, 0.7, 3.4, s));                              // coin telescope
    ns(add(new T.CylinderGeometry(0.12, 0.16, 0.6, 10), iron, 4.4, 1.4, 3.6, s)).rotation.x = Math.PI / 2 - 0.2;
    for (const bx of [-3.2, 0, 3.2]) bench(s, bx, 1.2, 0);
    for (const lx of [-6.2, 6.2]) lampPost(N, s, lx, -5.5);
    return finish(g, N);
  }
  ZAssets.register('beach', 'sunrise_point_deck', 'Sunrise Point deck', () => deck('☀  SUNRISE POINT'), ['sunrise', 'viewpoint', 'deck', 'beach']);
  ZAssets.register('beach', 'sunset_point_deck', 'Sunset Point deck', () => deck('🌅  SUNSET POINT'), ['sunset', 'viewpoint', 'deck', 'beach']);

  // beach umbrella: the game's umbrella (lines 3280–3287) scaled up into a striped parasol stuck in the sand
  ZAssets.register('beach', 'beach_umbrella', 'Beach umbrella', () => {
    const g = new T.Group();
    ns(add(new T.CylinderGeometry(0.04, 0.04, 2.4, 10), gm(0xf8f9fa), 0, 1.2, 0, g));
    const st = tex((c, w, h) => { for (let k = 0; k < 10; k++) { c.fillStyle = k % 2 ? '#ffffff' : '#e03131'; c.fillRect(k * w / 10, 0, w / 10, h); } }, 256, 16);
    const can = add(new T.ConeGeometry(1.9, 0.7, 10, 1, true), new T.MeshStandardMaterial({ map: st, side: T.DoubleSide, roughness: 0.6 }), 0, 2.35, 0, g); can.receiveShadow = false;
    ns(add(new T.SphereGeometry(0.06, 10, 8), gm(0x343a40), 0, 2.72, 0, g));
    ns(add(new T.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), gm(0xead9a6, { roughness: 1 }), 0, 0, 0, g)).scale.y = 0.35;   // little sand mound
    return { group: g };
  }, ['beach umbrella', 'parasol', 'beach']);

  // sea meeting the shore: swells roll in and break into foam; the swash runs up the sand and slides back (game lines 270, 320–387)
  ZAssets.register('beach', 'sea_shore', 'Sea and shore (waves)', () => {
    const g = new T.Group();
    const m = new T.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSunDir: { value: new T.Vector3(0.45, 0.8, 0.3).normalize() } },
      vertexShader: `uniform float uTime; varying vec3 vW; varying vec2 vXZ;
        void main(){ vec3 p = position; float sea = smoothstep(-0.5, 1.5, -p.z);
          p.y += (sin(p.x*0.35 + uTime*1.6)*0.06 + sin(p.z*0.6 - uTime*1.1)*0.05) * sea;
          vXZ = p.xz; vec4 wp = modelMatrix * vec4(p, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `uniform float uTime; uniform vec3 uSunDir; const vec3 uSky = vec3(0.75, 0.88, 1.0); varying vec3 vW; varying vec2 vXZ;
        vec3 waveNormal(vec2 p){ float t = uTime; vec2 d = vec2(0.0);
          vec2 q1 = p*0.9 + vec2(t*0.9, t*0.35);  d += vec2(cos(q1.x)*cos(q1.y), -sin(q1.x)*sin(q1.y))*0.9;
          vec2 q2 = p*1.7 + vec2(-t*0.6, t*1.1);  d += vec2(cos(q2.x)*cos(q2.y), -sin(q2.x)*sin(q2.y))*1.7*0.45;
          vec2 q3 = p*3.9 + vec2(t*1.8, -t*0.8);  d += vec2(cos(q3.x)*cos(q3.y), -sin(q3.x)*sin(q3.y))*3.9*0.12;
          return normalize(vec3(-d.x*0.08, 1.0, -d.y*0.08)); }
        void main(){
          float sd = -vXZ.y + 2.0;                                 // < 0 on the sand (front), > 0 out to sea (back)
          float WT = 6.5;
          vec3 n = waveNormal(vXZ*0.6); vec3 v = normalize(cameraPosition - vW);
          float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
          // sea: deep → shallow towards the shore, swells rolling in, breaking into foam
          vec3 deep = vec3(0.039, 0.227, 0.353), shallow = vec3(0.235, 0.714, 0.776);
          vec3 base = mix(shallow, deep, smoothstep(0.0, 9.0, sd));
          vec3 sea = mix(base, uSky, 0.15 + fres*0.6);
          vec3 r = reflect(-uSunDir, n); sea += vec3(1.0, 0.95, 0.85) * pow(max(dot(r, v), 0.0), 160.0) * 2.2;
          float band = fract(sd / 4.0 + uTime / WT + 0.08 * sin(vXZ.x * 0.6));
          float crest = smoothstep(0.0, 0.07, band) * (1.0 - smoothstep(0.07, 0.42, band));
          float brk = crest * smoothstep(5.0, 0.8, sd) * (0.6 + 0.4 * sin(vXZ.x * 2.1 + vXZ.y * 1.7 + uTime * 3.0));
          sea += shallow * crest * 0.35;
          sea = mix(sea, vec3(0.95, 0.98, 1.0), brk * 0.7);
          // sand + swash
          vec3 sand = vec3(0.918, 0.851, 0.651);
          float cyc = uTime / WT + 0.04 * sin(vXZ.x * 0.5);
          float p = fract(cyc), k = floor(cyc);
          float reach = -1.6 - 1.2 * (0.5 + 0.5 * sin(vXZ.x * 0.9 + k * 1.7));
          float front = p < 0.32 ? mix(1.2, reach, 1.0 - pow(1.0 - p / 0.32, 2.0)) : mix(reach, 1.2, pow((p - 0.32) / 0.68, 1.5));
          float f = front + 0.12 * sin(vXZ.x * 4.0 + uTime * 1.3) + 0.08 * sin(vXZ.x * 9.0 - uTime * 0.9);
          float wet = step(reach, sd) * step(sd, 0.0) * (1.0 - p) * 0.8;
          sand = mix(sand, vec3(0.62, 0.53, 0.37), wet * 0.35);
          float water = smoothstep(f - 0.05, f + 0.15, sd);
          vec3 col = mix(sand, mix(vec3(0.62, 0.86, 0.9), sea, smoothstep(0.0, 1.5, sd)), water);
          float line = exp(-pow((sd - f) / 0.15, 2.0)) * (p < 0.32 ? 1.0 : 0.55);
          col = mix(col, vec3(0.97, 0.99, 1.0), line * 0.9);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const me = add(new T.PlaneGeometry(14, 12, 70, 60).rotateX(-Math.PI / 2), m, 0, 0.02, 0, g); me.castShadow = false;
    g.userData.tick = (t) => { m.uniforms.uTime.value = t; };
    return { group: g };
  }, ['sea', 'shore', 'waves', 'ocean', 'seaside']);

  ZAssets.register('beach', 'sand_patch', 'Sand patch', () => {
    const g = new T.Group(), rnd = seeded(23);
    const sh = new T.Shape(); const n = 40;
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, r = 1 + 0.08 * Math.sin(a * 3 + 1) + 0.05 * Math.sin(a * 7); const x = Math.cos(a) * r * 3, y = Math.sin(a) * r * 2; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
    const geo = new T.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.3, bevelSegments: 3 }).rotateX(-Math.PI / 2);
    add(geo, gm(0xead9a6, { roughness: 1 }), 0, 0.04, 0, g);
    for (let k = 0; k < 5; k++) ns(add(new T.SphereGeometry(0.05, 8, 6), gm([0xfff0f6, 0xffe8cc, 0xf8f9fa][k % 3]), (rnd() - 0.5) * 4, 0.1, (rnd() - 0.5) * 2.4, g)).scale.y = 0.5;   // a few shells
    return { group: g };
  }, ['sand', 'beach', 'sandy']);

  ZAssets.register('beach', 'island_river', 'River stretch', () => {   // game lines 265–343, 388–391
    const g = new T.Group(), m = makeWater({ mode: 0, halfW: 9 });
    waterPlane(24, 18, m, g, 0, 0.24, 0, 96, 24);
    for (const side of [-1, 1]) ns(add(new T.PlaneGeometry(24, 2.6).rotateX(-Math.PI / 2), gm(0xe6d3a3), 0, 0.05, side * 10.3, g));
    g.userData.tick = (t) => { m.uniforms.uTime.value = t; };
    return { group: g };
  }, ['river', 'stream', 'water']);

  // =============================== LANDMARKS ===============================
  // zone landmark buildings (buildLandmark, lines 633–655), each in its game section colour
  const LM = [
    ['house', 'Landmark house', 0x7c3aed, ['landmark house', 'big house']],
    ['blocks', 'Landmark stacked blocks', 0xdb2777, ['stacked blocks', 'block tower']],
    ['tower', 'Landmark screen tower', 0x2563eb, ['screen tower', 'tower']],
    ['stairs', 'Landmark staircase', 0x0f9f8f, ['staircase', 'steps', 'growth']],
    ['antenna', 'Landmark signal tower', 0xea580c, ['antenna', 'signal tower', 'radio tower']],
  ];
  function buildLandmark(kind, g, color) {
    const wall = gm(0xf8f9fa), accent = gm(color);
    if (kind === 0) {
      add(new T.BoxGeometry(10, 6, 9), wall, 0, 3, 0, g);
      add(new T.ConeGeometry(8, 4.5, 4), accent, 0, 8.2, 0, g).rotation.y = Math.PI / 4;
      add(new T.BoxGeometry(2, 3.4, 0.2), gm(0x495057), 0, 1.7, 4.55, g);
    } else if (kind === 1) {
      [[0, 0], [3.2, 0], [-3.2, 0], [1.6, 3.2], [-1.6, 3.2], [0, 6.4]].forEach(([x, y], j) => add(new T.BoxGeometry(3, 3, 3), j % 2 ? wall : accent, x, y + 1.5, 0, g));
    } else if (kind === 2) {
      add(new T.BoxGeometry(6, 16, 6), wall, 0, 8, 0, g);
      for (let y = 3; y < 16; y += 4) add(new T.BoxGeometry(4.6, 2.2, 0.2), gm(0x1d2433, { emissive: color, emissiveIntensity: 0.6 }), 0, y, 3.05, g);
    } else if (kind === 3) {
      for (let s = 0; s < 5; s++) add(new T.BoxGeometry(2, 2 + s * 2, 6), s % 2 ? wall : accent, -4 + s * 2, 1 + s, 0, g);
    } else {
      add(new T.CylinderGeometry(2.5, 3.5, 4, 16), wall, 0, 2, 0, g);
      add(new T.CylinderGeometry(0.4, 0.6, 12, 8), gm(0xadb5bd), 0, 10, 0, g);
      add(new T.SphereGeometry(1, 16, 16), gm(color, { emissive: color, emissiveIntensity: 1.5 }), 0, 16.5, 0, g);
      for (let r = 0; r < 3; r++) add(new T.TorusGeometry(2 + r * 1.2, 0.15, 6, 32), accent, 0, 13 - r * 1.5, 0, g).rotation.x = Math.PI / 2;
    }
  }
  LM.forEach(([id, lab, col, words], k) => ZAssets.register('landmarks', 'landmark_' + id, lab, () => { const g = new T.Group(); buildLandmark(k, g, col); return { group: g }; }, ['landmark', 'building', ...words]));

  // glowing zone pad with its pulsing ring (lines 597–600, pulse 4185–4189)
  ZAssets.register('landmarks', 'zone_pad', 'Glowing zone pad', () => {
    const g = new T.Group(), c = new T.Color(0x7c3aed);
    ns(add(new T.CylinderGeometry(9, 9, 0.3, 48), gm(c, { emissive: c, emissiveIntensity: 0.25 }), 0, 0.15, 0, g));
    const rm = gm(0xffffff, { emissive: c, emissiveIntensity: 1 });
    const ring = ns(add(new T.TorusGeometry(9.4, 0.3, 8, 64), rm, 0, 0.35, 0, g)); ring.rotation.x = Math.PI / 2;
    g.userData.tick = (t) => { const p = 0.5 + 0.5 * Math.sin(t * 3); rm.emissiveIntensity = 0.6 + p; ring.position.y = 0.35 + p * 0.25; };
    return { group: g };
  }, ['glowing pad', 'zone pad', 'checkpoint pad']);

  // the plaza fountain (lines 512–570): basins, water pools and the jets
  ZAssets.register('landmarks', 'island_fountain', 'Plaza fountain', () => {
    const g = new T.Group(), rnd = seeded(41);
    const stone = gm(0xe8e2d4, { roughness: 0.7 }), stoneDark = gm(0xb9b1a0, { roughness: 0.8 });
    ns(add(new T.CircleGeometry(8.5, 64).rotateX(-Math.PI / 2), gm(0xd8d2c4), 0, 0.01, 0, g));            // a bit of the plaza
    const lathe = (pts, m, y = 0) => add(new T.LatheGeometry(pts.map(([x, yy]) => new T.Vector2(x, yy)), 64), m, 0, y, 0, g);
    lathe([[5.5, 0], [6.4, 0], [6.5, 0.15], [6.4, 0.95], [6.15, 1.05], [5.75, 1.05], [5.55, 0.95], [5.5, 0.3]], stone);
    ns(add(new T.CircleGeometry(5.6, 48).rotateX(-Math.PI / 2), stoneDark, 0, 0.12, 0, g));
    add(new T.CylinderGeometry(0.9, 1.3, 2.0, 24), stone, 0, 1.0, 0, g);
    lathe([[0.6, 0], [2.7, 0.35], [2.85, 0.6], [2.6, 0.62], [0.9, 0.3]], stone, 2.0);
    add(new T.CylinderGeometry(0.4, 0.6, 1.1, 16), stone, 0, 3.1, 0, g);
    lathe([[0.3, 0], [1.3, 0.25], [1.4, 0.45], [1.25, 0.47], [0.4, 0.2]], stone, 3.6);
    add(new T.SphereGeometry(0.32, 16, 12), stone, 0, 4.35, 0, g);
    const pool = makeWater({ mode: 1, radius: 5.6, shallow: 0x5cc8d8, deep: 0x1b6f8f, scale: 1.2 }), pool2 = makeWater({ mode: 1, radius: 2.6, shallow: 0x7fd8e6, deep: 0x2a8fae, scale: 1.6 });
    circleWater(5.6, pool, g, 0.78); circleWater(2.6, pool2, g, 2.52, 40);
    const ringMat = new T.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0 });
    ns(add(new T.TorusGeometry(4.6, 0.12, 8, 64), ringMat, 0, 0.55, 0, g)).rotation.x = Math.PI / 2;
    const N = 1400, seed = new Float32Array(N), kind = new Float32Array(N), pos = new Float32Array(N * 3);
    for (let k = 0; k < N; k++) { seed[k] = rnd(); kind[k] = k < 600 ? -1 : Math.floor(rnd() * 8); }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new T.BufferAttribute(seed, 1)); geo.setAttribute('aKind', new T.BufferAttribute(kind, 1));
    const jetMat = new T.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 }, uNight: { value: 0 } },
      vertexShader: `attribute float aSeed; attribute float aKind; uniform float uTime; varying float vA;
        void main(){ float T = aKind < 0.0 ? 1.25 : 0.9; float t = fract(uTime / T + aSeed) * T;
          float jitter = fract(aSeed * 91.7) - 0.5, j2 = fract(aSeed * 53.3) - 0.5; vec3 p;
          if (aKind < 0.0) { float a = aSeed * 6.2831 * 13.0, sp = 0.9 + jitter * 0.6; p = vec3(cos(a) * sp * t, 4.5 + (6.4 + j2) * t - 4.9 * t * t, sin(a) * sp * t); }
          else { float a = aKind * 0.7854 + jitter * 0.05; vec2 d = vec2(cos(a), sin(a)); vec2 xz = d * (5.6 - (5.0 + j2 * 0.4) * t / T); p = vec3(xz.x, 1.0 + 6.0 * t - 7.2 * t * t, xz.y); }
          vA = smoothstep(0.0, 0.08, t / T) * (1.0 - smoothstep(0.75, 1.0, t / T));
          vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = (aKind < 0.0 ? 7.0 : 5.0) * (10.0 / -mv.z) * 1.6; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uNight; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        vec3 c = mix(vec3(0.85, 0.95, 1.0), vec3(0.45, 0.9, 1.0), uNight); gl_FragColor = vec4(c, (1.0 - d * 2.0) * vA * 0.8); }`,
    });
    const jets = new T.Points(geo, jetMat); jets.frustumCulled = false; g.add(jets);
    g.userData.tick = (t) => { pool.uniforms.uTime.value = t; pool2.uniforms.uTime.value = t; jetMat.uniforms.uTime.value = t; };
    g.userData.setOn = (on) => { ringMat.opacity = on ? 0.95 : 0; jetMat.uniforms.uNight.value = on ? 1 : 0; };   // underwater ring lights at night
    return { group: g };
  }, ['fountain', 'plaza', 'water fountain']);

  // the hidden cave outcrop (lines 781–828): rock tunnel, dark opening, glowing runes at night, bushes half-hiding it
  ZAssets.register('landmarks', 'hidden_cave', 'Hidden cave outcrop', () => {
    const g = new T.Group(), N = nightSet(), rnd = seeded(77), s = new T.Group(); s.position.z = -2; g.add(s);
    const P = (al, b) => ({ x: -b, z: al });   // al: out of the mouth (+z), b: sideways
    const rockMat = flatM(0x7d8088, { roughness: 1 }), mossMat = flatM(0x55704a, { roughness: 1 });
    const rock = (al, b, y, r, sy = 1, m = rockMat) => {
      const p = P(al, b), me = add(jitter(new T.DodecahedronGeometry(r, 1), r * 0.12, rnd), m, p.x, y, p.z, s);
      me.scale.set(0.9 + rnd() * 0.25, sy, 0.9 + rnd() * 0.25); me.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); return me;
    };
    for (const sd of [-1, 1]) {
      for (const al of [1.2, 3.8, 6.4]) rock(al, sd * 5.7, 1.4, 2.4, 0.95);
      for (const al of [2, 5.5]) rock(al, sd * 4.8, 4.1, 2.1, 0.9, mossMat);
      rock(-1, sd * 8.5, 1.8, 3.4, 0.8); rock(3, sd * 9.5, 1.2, 2.6, 0.7, mossMat);
    }
    for (const al of [1.5, 4.6]) for (const b of [-2.3, 2.3]) rock(al, b, 5.5, 2.5, 0.75);
    rock(7.2, 0, 5.3, 2.4, 0.7, mossMat);
    for (const b of [-4.5, 0, 4.5]) rock(-3, b, 2.4, 3.8, 0.9);
    rock(-7, 0, 3, 4.6, 0.9, mossMat); rock(-2, 0, 6.6, 4.2, 0.7);
    const mouth = P(3.8, 0);
    ns(add(new T.BoxGeometry(6.4, 4.4, 7), new T.MeshBasicMaterial({ color: 0x030206, side: T.BackSide }), mouth.x, 2.2, mouth.z, s));
    const deep = halo(N, s, 0, 1.6, 1.2, 1, 'rgba(190,120,255,0.9)', 'rgba(120,60,220,0.25)', 0.55, 0.12); deep.scale.set(4, 3, 1);
    const glyphs = ['ᚠ', 'ᚱ', 'ᛟ', 'ᚨ', 'ᛉ', 'ᛞ'], runes = [];
    [[8.4, -3.9, 1.3], [8.4, 3.9, 1.6], [8.7, -3.2, 3.3], [8.7, 3.4, 3.0], [9.4, 0, 5.2], [8.0, -5.6, 2.4]].forEach(([al, b, y], k) => {
      const m = new T.MeshBasicMaterial({ map: tex((c, w, h) => { c.fillStyle = '#fff'; c.font = '700 96px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#c084fc'; c.shadowBlur = 18; c.fillText(glyphs[k], w / 2, h / 2); }, 128, 128),
        color: 0xc084fc, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
      const p = P(al, b); ns(add(new T.PlaneGeometry(1.1, 1.1), m, p.x, y, p.z, s)); runes.push(m);
    });
    const bushGeo = jitter(new T.IcosahedronGeometry(1, 1), 0.15, rnd), bushM = flatM(0x2f7d32, { roughness: 1 });
    for (const [al, b] of [[10.5, -5], [11.5, 5.5], [13, -7.5], [9.5, 7.2], [14, 3]]) { const p = P(al, b), sc = 1.2 + rnd() * 0.6; add(bushGeo, bushM, p.x, sc * 0.5, p.z, s).scale.set(sc * 1.2, sc * 0.8, sc * 1.2); }
    let lit = false, lastT = 0;
    const apply = () => runes.forEach((m, k) => { m.opacity = lit ? 0.95 * (0.65 + 0.35 * Math.sin(lastT * 2 + k)) : 0; });
    g.userData.tick = (t) => { lastT = t; apply(); };
    g.userData.setOn = (on) => { lit = !!on; N.set(lit); apply(); };
    return { group: g };
  }, ['cave', 'hidden cave', 'rocks', 'runes']);

  // ramps / bridge wedge (lines 395–409)
  function wedgeGeo(pts, width) {
    const sh = new T.Shape(); sh.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
    sh.closePath();
    const g = new T.ExtrudeGeometry(sh, { depth: width, bevelEnabled: false });
    g.translate(0, 0, -width / 2); g.rotateY(-Math.PI / 2); return g;
  }
  ZAssets.register('landmarks', 'river_bridge', 'River bridge', () => {   // lines 446–462 + the river under it
    const g = new T.Group(), BR = { L: 64, W: 13, H: 4.6 }, deckMat = gm(0x868e96, { roughness: 0.7 });
    add(wedgeGeo([[0, 0], [BR.L * 0.25, BR.H], [BR.L * 0.75, BR.H], [BR.L, 0], [BR.L * 0.75, BR.H - 0.9], [BR.L * 0.25, BR.H - 0.9]], BR.W), deckMat, 0, 0, -BR.L / 2, g);
    for (const side of [-1, 1]) {
      add(new T.BoxGeometry(0.4, 1.1, BR.L * 0.5), gm(0xf8f9fa), side * (BR.W / 2 - 0.2), BR.H + 0.55, 0, g);
      for (const zz of [-BR.L * 0.25, BR.L * 0.25]) add(new T.BoxGeometry(1.4, BR.H, 1.4), deckMat, side * (BR.W / 2 - 1), BR.H / 2 - 0.45, zz, g);
    }
    ns(add(new T.BoxGeometry(0.35, 0.03, BR.L * 0.48), gm(0xffffff, { roughness: 0.6 }), 0, BR.H + 0.02, 0, g));
    const m = makeWater({ mode: 0, halfW: 9 });
    waterPlane(40, 18, m, g, 0, 0.24, 0, 120, 24);
    for (const side of [-1, 1]) ns(add(new T.PlaneGeometry(40, 2.6).rotateX(-Math.PI / 2), gm(0xe6d3a3), 0, 0.05, side * 10.3, g));
    g.userData.tick = (t) => { m.uniforms.uTime.value = t; };
    return { group: g };
  }, ['bridge', 'river bridge', 'river']);

  ZAssets.register('landmarks', 'jump_ramp', 'Jump ramp', () => {   // lines 436–445 (12 × 9 m, 2.8 m high); low end faces the camera
    const g = new T.Group(), s = new T.Group(); s.rotation.y = Math.PI; g.add(s);
    const L = 12, W = 9, H = 2.8;
    const m = add(wedgeGeo([[0, 0], [L, H], [L, 0]], W), gm(0xf59f00, { roughness: 0.6 }), 0, 0, -L / 2, s);
    const stripe = gm(0x15131f);
    for (let k = 1; k < 4; k++) { const f = k / 4; ns(add(new T.BoxGeometry(W * 0.9, 0.06, 0.5), stripe, 0, H * f + 0.04, L * f, m)).rotation.x = -Math.atan2(H, L); }
    return { group: g };
  }, ['ramp', 'jump ramp', 'stunt ramp']);

  ZAssets.register('landmarks', 'boost_pad', 'Boost pad', () => {   // lines 476–491, pulse 4171
    const g = new T.Group();
    const bt = tex((c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#22d3ee'); gr.addColorStop(1, '#a855f7');
      c.fillStyle = '#0b0a1acc'; c.fillRect(0, 0, w, h); c.fillStyle = gr; c.lineJoin = 'round';
      for (let k = 0; k < 3; k++) { const y = 70 + k * 150; c.beginPath(); c.moveTo(w * 0.15, y + 120); c.lineTo(w / 2, y); c.lineTo(w * 0.85, y + 120); c.lineTo(w * 0.85, y + 170); c.lineTo(w / 2, y + 50); c.lineTo(w * 0.15, y + 170); c.closePath(); c.fill(); }
    }, 256, 512);
    const m = new T.MeshStandardMaterial({ map: bt, emissive: 0x7c3aed, emissiveIntensity: 0.5, transparent: true });
    ns(add(new T.PlaneGeometry(5, 8).rotateX(-Math.PI / 2), m, 0, 0.07, 0, g));
    g.userData.tick = (t) => { m.emissiveIntensity = 0.4 + 0.4 * Math.sin(t * 6.67); };
    return { group: g };
  }, ['boost pad', 'boost', 'speed pad']);

  function lapGate(text) {   // lines 493–510
    const g = new T.Group(), glow = gm(0xffffff, { emissive: 0xa855f7, emissiveIntensity: 0.3 });
    for (const off of [-7.5, 7.5]) add(new T.BoxGeometry(1, 7, 1), glow, off, 3.5, 0, g);
    const t = tex((c, w, h) => { const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#6d28d9'); gr.addColorStop(1, '#ec4899'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = `900 92px ${GFONT}`; c.fillText(text, w / 2, h * 0.62); }, 1024, 160);
    add(new T.BoxGeometry(16, 1.6, 0.3), [glow, glow, glow, glow, new T.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveIntensity: 0.15, emissiveMap: t }), new T.MeshStandardMaterial({ map: t })], 0, 7.4, 0, g);
    g.userData.setOn = (on) => { glow.emissiveIntensity = on ? 1.6 : 0.3; };   // the next gate to drive through glows
    return { group: g };
  }
  ZAssets.register('landmarks', 'lap_gate_start', 'Lap gate: START / FINISH', () => lapGate('START / FINISH'), ['start', 'finish', 'finish line', 'race gate']);
  for (let i = 1; i <= 5; i++) ZAssets.register('landmarks', 'lap_gate_checkpoint_' + i, `Lap gate: CHECKPOINT ${i}`, () => lapGate(`CHECKPOINT ${i}`), ['checkpoint', 'race gate']);

  ZAssets.register('landmarks', 'island_road', 'Lap road piece with kerbs', () => {   // lines 224–253
    const g = new T.Group();
    add(new T.BoxGeometry(12, 0.04, 14), gm(0x3d4250, { roughness: 0.95 }), 0, 0.02, 0, g);
    const dash = gm(0xffffff, { roughness: 0.6 });
    for (const z of [-4.7, 2.3]) ns(add(new T.BoxGeometry(0.35, 0.02, 2.6), dash, 0, 0.05, z, g));
    const kA = gm(0xe03131), kB = gm(0xf8f9fa);
    for (const x of [-6.6, 6.6]) for (let k = 0; k < 3; k++) ns(add(new T.BoxGeometry(1.2, 0.12, 4.6), k % 2 ? kA : kB, x, 0.06, -4.6 + k * 4.6, g));
    return { group: g };
  }, ['race track', 'kerb', 'road']);

  // =============================== WEATHER: rain umbrella (lines 3278–3287) ===============================
  const UMB = [['red', 0xe03131], ['blue', 0x1c7ed6], ['yellow', 0xfab005], ['green', 0x2f9e44], ['purple', 0x7048e8], ['pink', 0xf06595], ['black', 0x212529]];
  UMB.forEach(([id, col]) => ZAssets.register('weather', 'rain_umbrella_' + id, `Rain umbrella (${id})`, () => {
    const g = new T.Group(), dark = gm(0x343a40), y0 = 0.1;
    ns(add(new T.CylinderGeometry(0.018, 0.018, 1.05, 6), dark, 0, y0 + 0.525, 0, g));
    ns(add(new T.TorusGeometry(0.05, 0.014, 6, 12, Math.PI), dark, 0.05, y0, 0, g)).rotation.z = Math.PI;     // J handle
    const cm = new T.MeshStandardMaterial({ color: col, side: T.DoubleSide, roughness: 0.6 });
    const open = add(new T.ConeGeometry(0.85, 0.32, 10, 1, true), cm, 0, y0 + 1.135, 0, g);
    const closed = add(new T.ConeGeometry(0.09, 0.75, 10), cm, 0, y0 + 0.86, 0, g); closed.rotation.x = Math.PI; open.receiveShadow = false;   // furled round the shaft
    ns(add(new T.SphereGeometry(0.03, 6, 4), dark, 0, y0 + 1.305, 0, g));
    g.userData.setOn = (on) => { open.visible = !!on; closed.visible = !on; };
    g.userData.setOn(true);
    return { group: g };
  }, ['umbrella', 'rain', id + ' umbrella']));
})();
