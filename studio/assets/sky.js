/* Zungga Story Studio — sky props, ported from the Play-mode island (drive-portfolio/js/game.js "Sky" section,
 * glowing particles and weather): the day/night sky backdrop, sun, moon, twinkling star field, Mars / Jupiter /
 * Saturn / the black hole from the night sky, falling snow and rain, firefly swarm and cave spores.
 * Particles run in shaders whose only input is uTime = t, so every frame is exact. */
(() => {
  'use strict';
  const { T, tex } = ZA;
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function add(geo, m, x = 0, y = 0, z = 0, parent, shadow = false) { const me = new T.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = shadow; me.receiveShadow = false; parent.add(me); return me; }
  const glowTex = (inner, outer) => tex((g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, 256, 256);
  function glowSprite(texture, s, parent, y = 0, opacity = 1, additive = true) {
    const sp = new T.Sprite(new T.SpriteMaterial({ map: texture, transparent: true, opacity, depthWrite: false, toneMapped: false, blending: additive ? T.AdditiveBlending : T.NormalBlending }));
    sp.scale.set(s, s, 1); sp.position.y = y; parent.add(sp); return sp;
  }
  const basic = (o) => new T.MeshBasicMaterial({ ...o });

  /* ---------- the sky dome as a curved backdrop (day; setOn(true) = night with the Milky Way) ---------- */
  const lerpC = (a, b, k) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * k));
  const rgbOf = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  function skyTexture(night) {
    return tex((g, W, H) => {
      const dTop = rgbOf(0x4f9fe8), dBot = rgbOf(0xd6ecff), nTop = rgbOf(0x02030b), nBot = rgbOf(0x101632);
      for (let y = 0; y < H; y++) {   // same curve as the game's dome shader: h = elevation*1.6 + 0.08
        const e = (1 - y / H) * 0.62, h = Math.min(1, Math.max(0, e * 1.6 + 0.08));
        const c = night ? lerpC(nBot, nTop, Math.pow(h, 0.55)) : lerpC(dBot, dTop, Math.pow(h, 0.8));
        g.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; g.fillRect(0, y, W, 1);
      }
      const r = rng(night ? 41 : 17);
      if (!night) {   // the sun's warm halo + white disc
        const sx = W * 0.68, sy = H * 0.3;
        let gr = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.55); gr.addColorStop(0, 'rgba(255,191,115,0.55)'); gr.addColorStop(1, 'rgba(255,191,115,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
        gr = g.createRadialGradient(sx, sy, 0, sx, sy, 34); gr.addColorStop(0, 'rgba(255,250,235,1)'); gr.addColorStop(0.6, 'rgba(255,235,190,1)'); gr.addColorStop(1, 'rgba(255,235,190,0)'); g.fillStyle = gr; g.fillRect(sx - 40, sy - 40, 80, 80);
      } else {        // Milky Way band (purple → white, dusty) + stars
        g.save(); g.translate(W / 2, H / 2); g.rotate(-0.42);
        for (let k = 0; k < 900; k++) {
          const x = (r() - 0.5) * W * 1.4, y = (r() + r() + r() - 1.5) * H * 0.16, rad = 6 + r() * 26;
          const gr = g.createRadialGradient(x, y, 0, x, y, rad), w = r();
          gr.addColorStop(0, w < 0.5 ? 'rgba(130,110,200,0.10)' : 'rgba(240,220,255,0.08)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        }
        g.fillStyle = 'rgba(5,5,15,0.35)'; for (let k = 0; k < 120; k++) { g.beginPath(); g.ellipse((r() - 0.5) * W * 1.3, (r() - 0.5) * H * 0.12, 10 + r() * 30, 3 + r() * 6, 0, 0, 6.3); g.fill(); }
        g.restore();
        for (let k = 0; k < 900; k++) { const big = r() < 0.06, s = big ? 1.6 + r() : 0.6 + r() * 0.7, warm = r(); g.fillStyle = warm < 0.5 ? `rgba(191,217,255,${0.5 + r() * 0.5})` : `rgba(255,230,191,${0.5 + r() * 0.5})`; g.beginPath(); g.arc(r() * W, r() * H * 0.92, s, 0, 6.3); g.fill(); }
      }
    }, 2048, 768);
  }
  function skyDome() {
    const group = new T.Group(), R = 12, H = 9;
    const day = skyTexture(false), night = skyTexture(true);
    const m = basic({ map: day, side: T.DoubleSide, fog: false });
    add(new T.CylinderGeometry(R, R, H, 64, 1, true, Math.PI - 1.15, 2.3), m, 0, H / 2, 0, group);
    group.userData.setOn = (on) => { m.map = on ? night : day; m.needsUpdate = true; };
    return { group };
  }

  /* ---------- sun ---------- */
  function sun() {
    const group = new T.Group(), c = new T.Group(); c.position.y = 0.55; group.add(c);
    add(new T.SphereGeometry(0.5, 32, 20), basic({ color: 0xffe27a, toneMapped: false }), 0, 0, 0, c);
    const h1 = glowSprite(glowTex('rgba(255,226,140,0.85)', 'rgba(255,191,115,0.35)'), 2.4, c, 0, 0.9, false);
    const h2 = glowSprite(glowTex('rgba(255,191,115,0.30)', 'rgba(255,150,80,0.10)'), 4.2, c, 0, 0.8, false);
    group.userData.tick = (t) => { const k = 1 + 0.05 * Math.sin(t * 1.6); h1.scale.set(2.6 * k, 2.6 * k, 1); h2.scale.set(5 / k, 5 / k, 1); };
    return { group };
  }

  /* ---------- moon (craters + cool glow) ---------- */
  function moon() {
    const group = new T.Group(), c = new T.Group(); c.position.y = 0.55; group.add(c); const r = rng(23);
    const mt = tex((g, w, h) => { g.fillStyle = '#e9e6dc'; g.fillRect(0, 0, w, h); for (let k = 0; k < 70; k++) { const x = r() * w, y = r() * h, rad = 4 + r() * 30; g.fillStyle = `rgba(120,115,105,${0.08 + r() * 0.22})`; g.beginPath(); g.arc(x, y, rad, 0, 6.3); g.fill(); g.strokeStyle = 'rgba(255,255,250,0.12)'; g.lineWidth = 2; g.beginPath(); g.arc(x - 1, y - 1, rad, 3.6, 5.4); g.stroke(); } }, 512, 256);
    const ball = add(new T.SphereGeometry(0.5, 32, 20), basic({ map: mt }), 0, 0, 0, c);
    const glow = glowSprite(glowTex('rgba(200,215,255,0.45)', 'rgba(140,160,255,0.12)'), 2.6, c, 0, 0.7, false);
    group.userData.tick = (t) => { ball.rotation.y = t * 0.05; };
    return { group };
  }

  /* ---------- star field (twinkling points on a curved sheet of sky) ---------- */
  function starField() {
    const group = new T.Group(), r = rng(99), N = 700, pos = new Float32Array(N * 3), seed = new Float32Array(N), size = new Float32Array(N);
    for (let k = 0; k < N; k++) {
      const a = Math.PI + (r() - 0.5) * 2.3, y = 1 + r() * 7, R = 10 + r() * 1.5;
      pos.set([Math.sin(a) * R, y, Math.cos(a) * R], k * 3); seed[k] = r() * 100; size[k] = r() < 0.06 ? 2.6 + r() : 1.0 + r();
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new T.BufferAttribute(seed, 1)); g.setAttribute('aSize', new T.BufferAttribute(size, 1));
    const m = new T.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 } },
      vertexShader: 'attribute float aSeed; attribute float aSize; uniform float uTime; varying float vTw; varying float vS; void main(){ vTw = 0.55 + 0.45*sin(uTime*(1.5+fract(aSeed)*2.5) + aSeed); vS = fract(aSeed*7.13); vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = clamp(aSize * 60.0 / -mv.z, 1.0, 14.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vTw; varying float vS; void main(){ vec2 c = gl_PointCoord-0.5; float d = length(c); if(d>0.5) discard; vec3 col = mix(vec3(0.75,0.85,1.0), vec3(1.0,0.9,0.75), vS); gl_FragColor = vec4(col, (1.0-d*2.0)*vTw); }',
    });
    const pts = new T.Points(g, m); pts.frustumCulled = false; group.add(pts);
    group.userData.tick = (t) => { m.uniforms.uTime.value = t; };
    return { group };
  }

  /* ---------- planets + black hole (the night-sky celestial objects) ---------- */
  const bands = (cols, seed) => { const r = rng(seed); return tex((g, w, h) => { const bh = h / cols.length; cols.forEach((c, k) => { g.fillStyle = c; g.fillRect(0, k * bh, w, bh + 1); }); g.globalAlpha = 0.25; for (let k = 0; k < 40; k++) { g.fillStyle = cols[k % cols.length]; g.fillRect(0, r() * h, w, 1 + r() * 5); } }, 256, 128); };
  function planet(R, matOpts, extra) {
    return () => {
      const group = new T.Group(), c = new T.Group(); c.position.y = R * 1.05; group.add(c);
      const ball = add(new T.SphereGeometry(R, 32, 20), basic(matOpts()), 0, 0, 0, c);
      if (extra) extra(c, R);
      group.userData.tick = (t) => { ball.rotation.y = t * 0.15; };
      return { group };
    };
  }
  function saturnRing(c, R) {
    const ringTex = tex((g, w, h) => { for (let x = 0; x < w; x++) { const a = (0.25 + 0.6 * Math.abs(Math.sin(x * 0.09))) * (x > w * 0.55 && x < w * 0.6 ? 0.1 : 1); g.fillStyle = `rgba(230,215,175,${a})`; g.fillRect(x, 0, 1, h); } }, 512, 8);
    const r0 = R * 10 / 7.5, r1 = R * 18 / 7.5, ringGeo = new T.RingGeometry(r0, r1, 96), uv = ringGeo.attributes.uv, pp = ringGeo.attributes.position;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, (Math.hypot(pp.getX(k), pp.getY(k)) - r0) / (r1 - r0), 0.5);
    const ring = add(ringGeo, basic({ map: ringTex, side: T.DoubleSide, transparent: true }), 0, 0, 0, c); ring.rotation.x = 1.12; ring.rotation.y = 0.3;
  }
  function blackHole() {
    const group = new T.Group(), c = new T.Group(), k = 0.03; c.position.y = 0.6; group.add(c);   // game: core 13, disk 14–52 → ×0.03
    add(new T.SphereGeometry(13 * k, 32, 20), basic({ color: 0x000000 }), 0, 0, 0, c);
    const r = rng(5);
    const diskTex = tex((g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, w * 0.18, w / 2, h / 2, w / 2);
      gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.18, 'rgba(255,214,140,0.95)'); gr.addColorStop(0.45, 'rgba(255,120,50,0.7)'); gr.addColorStop(0.75, 'rgba(160,40,120,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-out';
      for (let q = 0; q < 60; q++) { g.strokeStyle = `rgba(0,0,0,${0.05 + r() * 0.2})`; g.lineWidth = 1 + r() * 3; g.beginPath(); g.arc(w / 2, h / 2, w * (0.2 + r() * 0.28), r() * 6, r() * 6); g.stroke(); }
    }, 512, 512);
    const tilt = new T.Group(); tilt.rotation.x = 1.35; c.add(tilt);
    const disk = add(new T.RingGeometry(14 * k, 52 * k, 128), basic({ map: diskTex, side: T.DoubleSide, transparent: true, depthWrite: false }), 0, 0, 0, tilt);
    glowSprite(glowTex('rgba(255,190,120,0.0)', 'rgba(255,160,90,0.35)'), 70 * k, c, 0, 0.9);
    add(new T.RingGeometry(13.2 * k, 15.2 * k, 96), basic({ color: 0xffd8a0, side: T.DoubleSide, transparent: true, opacity: 0.9 }), 0, 0, 0.01, c);
    group.userData.tick = (t) => { disk.rotation.z = t * 0.5; };
    return { group };
  }

  /* ---------- weather: falling snow / rain (shader loops, pure in t) ---------- */
  function precip(mode) {
    return () => {
      const group = new T.Group(), r = rng(mode ? 77 : 33), N = mode ? 600 : 700, BW = 4, BH = 5, pos = new Float32Array(N * 3), seed = new Float32Array(N);
      for (let k = 0; k < N; k++) { pos.set([(r() - 0.5) * BW, r() * BH, (r() - 0.5) * BW], k * 3); seed[k] = r(); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new T.BufferAttribute(seed, 1));
      const m = new T.ShaderMaterial({
        transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 }, uMode: { value: mode } },
        vertexShader: `attribute float aSeed; uniform float uTime, uMode;
          void main(){
            vec3 p = position;
            float spd = uMode < 0.5 ? 8.0 + 3.0 * aSeed : 0.7 + 0.5 * aSeed;
            p.y = mod(p.y - uTime * spd, ${BH.toFixed(1)});
            if (uMode > 0.5) { p.x += sin(uTime * 0.9 + aSeed * 40.0) * 0.25; p.z += cos(uTime * 0.7 + aSeed * 30.0) * 0.25; }
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = clamp((uMode < 0.5 ? 220.0 : 70.0) / max(-mv.z, 0.5), 1.5, uMode < 0.5 ? 42.0 : 18.0);
            gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform float uMode;
          void main(){
            vec2 c = gl_PointCoord - 0.5; float a; vec3 col;
            if (uMode < 0.5) { if (abs(c.x) > 0.06) discard; a = (1.0 - abs(c.y) * 2.0) * 0.8; col = vec3(0.55, 0.66, 0.86); }
            else { float d = length(c); if (d > 0.5) discard; a = 1.0 - d * 1.6; col = vec3(1.0); }
            gl_FragColor = vec4(col, a); }`,
      });
      const pts = new T.Points(g, m); pts.frustumCulled = false; group.add(pts);
      group.userData.tick = (t) => { m.uniforms.uTime.value = t; };
      return { group };
    };
  }

  /* ---------- glowing particles: fireflies (woods at night) + cave spores ---------- */
  function glowPoints(list, seedFn, colA, colB, size, wob) {
    const N = list.length, pos = new Float32Array(N * 3), seed = new Float32Array(N);
    list.forEach((p, k) => { pos.set(p, k * 3); seed[k] = seedFn() * 100; });
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new T.BufferAttribute(seed, 1));
    const m = new T.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 }, uA: { value: new T.Color(colA) }, uB: { value: new T.Color(colB) } },
      vertexShader: `attribute float aSeed; uniform float uTime; varying float vB; varying float vM;
        void main(){
          vec3 p = position + vec3(sin(uTime*0.5 + aSeed)*${(1.6 * wob).toFixed(2)}, sin(uTime*0.9 + aSeed*1.7)*${(0.6 * wob).toFixed(2)}, cos(uTime*0.4 + aSeed*2.3)*${(1.6 * wob).toFixed(2)});
          vB = pow(max(sin(uTime*1.7 + aSeed*3.0), 0.0), 2.0); vM = fract(aSeed*0.37);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = clamp(${size.toFixed(1)} * (40.0 / -mv.z), 1.0, 26.0);
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uOpacity; uniform vec3 uA, uB; varying float vB; varying float vM;
        void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
          gl_FragColor = vec4(mix(uA, uB, vM), pow(1.0 - d*2.0, 1.5) * (0.35 + vB) * uOpacity); }`,
    });
    const pts = new T.Points(g, m); pts.frustumCulled = false; return { pts, m };
  }
  function fireflies() {
    const group = new T.Group(), r = rng(311), list = [];
    for (let k = 0; k < 60; k++) { const a = r() * 6.28, rad = Math.sqrt(r()) * 3; list.push([Math.cos(a) * rad, 0.6 + r() * 3, Math.sin(a) * rad]); }
    const f = glowPoints(list, r, 0xd9f99d, 0xfde68a, 5, 0.5); group.add(f.pts);
    group.userData.tick = (t) => { f.m.uniforms.uTime.value = t; };
    group.userData.setOn = (on) => { f.m.uniforms.uOpacity.value = on ? 1 : 0; };
    return { group };
  }
  function caveSpores() {
    const group = new T.Group(), r = rng(812), list = [];
    for (let k = 0; k < 140; k++) { const a = r() * 6.28, rad = Math.sqrt(r()) * 4; list.push([Math.cos(a) * rad, 0.5 + r() * 4, Math.sin(a) * rad]); }
    const f = glowPoints(list, r, 0xc4b5fd, 0x67e8f9, 4, 0.4); group.add(f.pts);
    group.userData.tick = (t) => { f.m.uniforms.uTime.value = t; };
    return { group };
  }

  const R = (id, label, fn, tags) => ZAssets.register('sky', id, label, fn, tags);
  R('sky_dome', 'Sky backdrop (day / night)', skyDome, ['sky', 'backdrop', 'day', 'night', 'milky way']);
  R('sky_sun', 'Sun (glowing)', sun, ['sun', 'sky', 'day', 'sunny']);
  R('sky_moon', 'Moon', moon, ['moon', 'sky', 'night']);
  R('star_field', 'Twinkling stars', starField, ['stars', 'sky', 'night']);
  R('planet_mars', 'Mars (red planet)', planet(0.3, () => ({ color: 0xd9653b })), ['planet', 'mars', 'space', 'sky']);
  R('planet_jupiter', 'Jupiter (striped planet)', planet(0.6, () => ({ map: bands(['#d8b48a', '#b07a4e', '#efd9b4', '#9c6b45', '#e6c9a0', '#c48b5a'], 3) })), ['planet', 'jupiter', 'space', 'sky']);
  R('planet_saturn', 'Saturn (ringed planet)', planet(0.4, () => ({ map: bands(['#e8d7a6', '#cdb27a', '#f2e6c2', '#bfa06a'], 4) }), saturnRing), ['planet', 'saturn', 'rings', 'space', 'sky']);
  R('black_hole', 'Black hole', blackHole, ['black hole', 'space', 'sky', 'galaxy']);
  R('snowfall', 'Falling snow', precip(1), ['snow', 'snowflakes', 'winter', 'weather']);
  R('rainfall', 'Falling rain', precip(0), ['rain', 'raindrops', 'weather', 'monsoon']);
  R('firefly_swarm', 'Fireflies', fireflies, ['fireflies', 'night', 'woods', 'glow']);
  R('cave_spores', 'Glowing cave spores', caveSpores, ['spores', 'cave', 'glow', 'magic']);
})();
