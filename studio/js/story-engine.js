/*
 * Zungga Story Studio — story engine.
 * Plays a story file (stories/<name>/story.json) as a 3D scene into one 1080×1920 output canvas:
 * places, characters (ZCharacters.person presets), props (ZAssets), timed beats, camera shots (ZCamera),
 * and 2D overlays (counter, caption, subtitles, end card) drawn INTO the canvas so recording captures them.
 *
 *   const eng = await ZStory.create({ storyDir: '../stories/pocket-money/' });
 *   eng.canvas            → the output canvas (put it on the page)
 *   eng.timeline          → [{ scene, start, dur }], eng.total (seconds)
 *   eng.step(dt)          → advance the clock by dt and draw (sequential playback / offline render)
 *   eng.seek(t)           → jump to time t (replays the scene from its start, deterministic)
 *   eng.audioFor(i)       → AudioBuffer of scene i (or null) — the page plays it
 * A scene's duration = its voice clip + the story's pause (or a words-per-second estimate if no clip yet).
 */
(() => {
  'use strict';
  const T = THREE;
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeIO = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const W = 1080, H = 1920, FPS = 30, DT = 1 / FPS;

  // where each place sits in the one shared world (sets are built once)
  const PLACES = {
    home:      { origin: [0, 0, 0], set: 'home_room', sky: 0xfff3e6 },
    shop:      { origin: [14, 0, 0], set: 'shop_counter', sky: 0xbfe3ff, ground: true },
    ground:    { origin: [-14, 0, 0], set: 'school_ground', sky: 0xbfe3ff, ground: true },
    classroom: { origin: [0, 0, -16], set: 'classroom', sky: 0xfdf2d6 },
  };

  async function create(opts) {
    const storyDir = opts.storyDir.endsWith('/') ? opts.storyDir : opts.storyDir + '/';
    const story = await (await fetch(storyDir + 'story.json', { cache: 'no-store' })).json();
    let durations = {};
    const vdir = (opts.voiceDir || 'voice') + '/';
    try { durations = await (await fetch(storyDir + vdir + 'durations.json', { cache: 'no-store' })).json(); } catch (e) { /* no voice yet */ }
    let wordsMap = {};
    try { wordsMap = await (await fetch(storyDir + vdir + 'words.json', { cache: 'no-store' })).json(); } catch (e) { /* no word timings yet */ }
    await document.fonts.load('700 60px Fredoka').catch(() => {}); await document.fonts.ready;

    // ---------- audio (decoded once; the page decides how to play it) ----------
    const actx = opts.audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const buffers = await Promise.all(story.scenes.map(async (sc) => {
      const name = `scene-${String(sc.id).padStart(2, '0')}.wav`;
      if (!durations[name]) return null;
      try { const ab = await (await fetch(storyDir + vdir + name)).arrayBuffer(); return await actx.decodeAudioData(ab); } catch (e) { return null; }
    }));
    // loudness envelope per clip (for the talking mouth + nothing else) — 60 samples a second
    const envelopes = buffers.map((b) => {
      if (!b) return null;
      const d = b.getChannelData(0), step = Math.floor(b.sampleRate / 60), out = new Float32Array(Math.ceil(d.length / step));
      for (let i = 0; i < out.length; i++) { let s = 0; for (let j = i * step; j < Math.min(d.length, (i + 1) * step); j++) s += d[j] * d[j]; out[i] = Math.sqrt(s / step); }
      const mx = Math.max(...out) || 1; for (let i = 0; i < out.length; i++) out[i] = Math.min(1, out[i] / (mx * 0.6));
      return out;
    });

    // ---------- timeline ----------
    const pause = story.voice?.pauseAfter ?? 0.7;
    let acc = 0;
    const timeline = story.scenes.map((sc, i) => {
      const words = sc.narration.split(/\s+/).length;
      const dur = (buffers[i] ? buffers[i].duration : words / 2.6) + pause + (i === story.scenes.length - 1 ? 1.8 : 0);   // last scene holds the end card a little
      const e = { scene: sc, start: acc, dur }; acc += dur; return e;
    });
    const total = acc;

    // ---------- word cues: anything can be timed to a spoken word ("word": "chips", "chips#2" = 2nd time, "offset": -0.3) ----------
    const normW = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
    function wordTime(i, spec, offset = 0) {
      const e = timeline[i], name = `scene-${String(e.scene.id).padStart(2, '0')}.wav`, list = wordsMap[name];
      const [w, nth] = String(spec).split('#'), want = normW(w), n = +(nth || 1);
      let t = null;
      if (list) { let k = 0; for (const [ww, st] of list) if (normW(ww) === want && ++k === n) { t = st; break; } }
      if (t == null) {   // no timings: estimate from the word's position in the line
        const ws = e.scene.narration.split(/\s+/).map(normW); let k = 0, idx = ws.findIndex((x) => x === want && ++k === n);
        t = idx < 0 ? 0 : idx / ws.length * (buffers[i] ? buffers[i].duration : e.dur - pause);
      }
      return clamp(t + offset, 0, e.dur);
    }
    timeline.forEach((e, i) => {
      const sc = e.scene = JSON.parse(JSON.stringify(e.scene)), f = (spec, off) => wordTime(i, spec, off) / e.dur;
      for (const b of sc.beats || []) if (b.word) b.at = f(b.word, b.offset || 0);
      for (const c of sc.camera || []) if (c.untilWord) c.until = f(c.untilWord, c.untilOffset || 0);
      for (const pr of sc.props || []) { if (pr.showWord) pr.show = f(pr.showWord, pr.showOffset || 0); if (pr.onWord) pr.on = f(pr.onWord, pr.onOffset || 0); if (pr.coins) { if (pr.coins.startWord) pr.coins.start = f(pr.coins.startWord, pr.coins.startOffset || 0); if (pr.coins.endWord) pr.coins.end = f(pr.coins.endWord, pr.coins.endOffset || 0); } }
      if (sc.counter) { const c = sc.counter; if (c.startWord) c.start = f(c.startWord, c.startOffset || 0); if (c.endWord) c.end = f(c.endWord, c.endOffset || 0); for (const st of c.steps || []) if (st.word) st.at = f(st.word, st.offset || 0); }
      if (sc.caption && sc.caption.atWord) sc.caption.at = f(sc.caption.atWord, sc.caption.atOffset || 0);
      for (const x of sc.sfx || []) if (x.word) x.at = f(x.word, x.offset || 0);
      for (const x of (sc.weather && sc.weather.thunder) || []) if (typeof x === 'object' && x.word) x.at = f(x.word, x.offset || 0);
    });

    // ---------- sound effects: one list of cues for the page (live) and the renderer (ffmpeg) ----------
    const sfxBase = new URL('assets/sfx/', document.baseURI).href;
    const cues = [];
    timeline.forEach((e, i) => {
      const sc = e.scene;
      for (const x of sc.sfx || []) cues.push({ file: x.file, start: e.start + x.at * e.dur, vol: x.vol ?? 0.8, dur: null, loop: false });
      if (sc.ambience) cues.push({ file: sc.ambience.file, start: e.start, vol: sc.ambience.vol ?? 0.5, dur: e.dur, loop: true });
      if (sc.weather && sc.weather.thunder) for (const th of sc.weather.thunder) { const at = typeof th === 'object' ? th.at : th; cues.push({ file: 'thunder.wav', start: e.start + at * e.dur + 0.35, vol: 0.35, dur: null, loop: false }); }
      for (const pr of sc.props || []) if (pr.coins && pr.coins.sound) for (let k = 0; k < pr.coins.count; k++) {
        const fk = pr.coins.start + (k + 1) / pr.coins.count * (pr.coins.end - pr.coins.start);
        cues.push({ file: pr.coins.sound, start: e.start + fk * e.dur + 0.28, vol: pr.coins.vol ?? 0.35, dur: null, loop: false });
      }
    });
    const sfxBuffers = {};
    await Promise.all([...new Set(cues.map((c) => c.file))].map(async (f) => { try { sfxBuffers[f] = await actx.decodeAudioData(await (await fetch(sfxBase + f)).arrayBuffer()); } catch (err) { console.warn('sfx missing', f); } }));

    // ---------- renderer + output canvas ----------
    const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(W, H, false);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.VSMShadowMap;   // soft, blurred shadows
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = T.SRGBColorSpace;
    const out = document.createElement('canvas'); out.width = W; out.height = H; const g2 = out.getContext('2d');
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(40, W / H, 0.02, 200);
    const hemi = new T.HemisphereLight(0xeaf2ff, 0xb59a7a, 1.1); scene.add(hemi);
    const sun = new T.DirectionalLight(0xfff0dc, 2.4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02; sun.shadow.radius = 9; sun.shadow.blurSamples = 16;
    Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 40 }); scene.add(sun, sun.target);
    const fill = new T.DirectionalLight(0xcfe0ff, 0.6); scene.add(fill, fill.target);
    const spot = new T.SpotLight(0xfff2d8, 0, 10, 0.45, 0.6, 1.2); spot.castShadow = false; scene.add(spot, spot.target);   // soft-mood key light
    const windowGlow = new T.PointLight(0xffc98a, 0, 7, 1.6); scene.add(windowGlow);                                    // warm bounce from the window

    // ---------- cinematic finish: depth of field, soft glow (bloom), warm grade, vignette ----------
    const RT = (w, h, depth) => { const t = new T.WebGLRenderTarget(w, h, { type: T.HalfFloatType, samples: depth ? 4 : 0 }); if (depth) { t.depthTexture = new T.DepthTexture(w, h); t.depthTexture.type = T.FloatType; } return t; };
    const rtScene = RT(W, H, true), rtSharp = RT(W, H, false), rtA = RT(W / 2, H / 2), rtB = RT(W / 2, H / 2), rtC = RT(W / 4, H / 4), rtD = RT(W / 4, H / 4);
    const quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), quadScene = new T.Scene(), quad = new T.Mesh(new T.PlaneGeometry(2, 2)); quadScene.add(quad);
    const vtx = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    const copyM = new T.ShaderMaterial({ uniforms: { tSrc: { value: null }, uThresh: { value: 0 } }, vertexShader: vtx, depthTest: false, depthWrite: false,
      fragmentShader: 'uniform sampler2D tSrc; uniform float uThresh; varying vec2 vUv; void main(){ vec3 c = texture2D(tSrc, vUv).rgb; if (uThresh > 0.0) { float l = dot(c, vec3(0.299,0.587,0.114)); c *= smoothstep(uThresh, uThresh + 0.6, l); } gl_FragColor = vec4(c, 1.0); }' });
    const blurM = new T.ShaderMaterial({ uniforms: { tSrc: { value: null }, uDir: { value: new T.Vector2() } }, vertexShader: vtx, depthTest: false, depthWrite: false,
      fragmentShader: `uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tSrc, vUv).rgb * 0.227; c += (texture2D(tSrc, vUv + uDir * 1.38).rgb + texture2D(tSrc, vUv - uDir * 1.38).rgb) * 0.316;
          c += (texture2D(tSrc, vUv + uDir * 3.23).rgb + texture2D(tSrc, vUv - uDir * 3.23).rgb) * 0.070; gl_FragColor = vec4(c, 1.0); }` });
    const finalM = new T.ShaderMaterial({
      uniforms: { tSharp: { value: null }, tBlur: { value: null }, tBloom: { value: null }, tDepth: { value: null }, uNear: { value: 0.02 }, uFar: { value: 200 }, uFocus: { value: 3 }, uAperture: { value: 0.6 },
        uBloom: { value: 0.35 }, uWarm: { value: new T.Vector3(1, 1, 1) }, uVignette: { value: 0.35 }, uSat: { value: 1.05 } },
      vertexShader: vtx, depthTest: false, depthWrite: false, toneMapped: true,
      fragmentShader: `#include <packing>
        uniform sampler2D tSharp, tBlur, tBloom, tDepth; uniform float uNear, uFar, uFocus, uAperture, uBloom, uVignette, uSat; uniform vec3 uWarm; varying vec2 vUv;
        void main(){
          float z = -perspectiveDepthToViewZ(texture2D(tDepth, vUv).x, uNear, uFar);
          float coc = clamp(abs(z - uFocus) / max(z, 0.05) * uAperture * 3.0, 0.0, 1.0);
          vec3 c = mix(texture2D(tSharp, vUv).rgb, texture2D(tBlur, vUv).rgb, coc);
          c += texture2D(tBloom, vUv).rgb * uBloom;
          c *= uWarm;
          float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(l), c, uSat);
          vec2 q = vUv - 0.5; c *= 1.0 - uVignette * smoothstep(0.25, 0.85, dot(q, q) * 2.2);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` });
    function pass(mat, target) { quad.material = mat; renderer.setRenderTarget(target); renderer.render(quadScene, quadCam); }
    const LOOKS = {   // per place / mood: warmth (rgb multiplier), glow, depth-of-field strength, vignette, saturation
      home: { warm: [1.1, 1.0, 0.86], bloom: 0.55, aperture: 0.55, vignette: 0.38, sat: 1.08 },
      classroom: { warm: [1.06, 1.0, 0.92], bloom: 0.4, aperture: 0.45, vignette: 0.3, sat: 1.05 },
      shop: { warm: [1.05, 1.0, 0.93], bloom: 0.35, aperture: 0.45, vignette: 0.3, sat: 1.06 },
      ground: { warm: [1.04, 1.0, 0.95], bloom: 0.35, aperture: 0.4, vignette: 0.3, sat: 1.05 },
      rain: { warm: [0.92, 0.97, 1.06], bloom: 0.25, aperture: 0.35, vignette: 0.45, sat: 0.82 },
      soft: { warm: [1.08, 1.0, 0.9], bloom: 0.6, aperture: 0.6, vignette: 0.5, sat: 1.0 },
    };
    let look = LOOKS.home;

    // shared world: ground + all places
    const { mesh, tex } = ZAssets.helpers;
    const groundT = tex((c, w, h) => { c.fillStyle = '#d8c39a'; c.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { c.fillStyle = ['#cdb68a', '#e2cfa8', '#c4ab7d'][i % 3]; c.globalAlpha = 0.5; c.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3); } c.globalAlpha = 1; }, 512, 512);
    groundT.wrapS = groundT.wrapT = T.RepeatWrapping; groundT.repeat.set(40, 40);
    const ground = mesh(new T.PlaneGeometry(200, 200), new T.MeshStandardMaterial({ map: groundT, roughness: 1 }), scene, 0, -0.001, 0); ground.rotation.x = -Math.PI / 2; ground.castShadow = false;
    const places = {};
    for (const [name, p] of Object.entries(PLACES)) {
      const r = ZAssets.build(p.set); r.group.position.set(...p.origin); scene.add(r.group);
      const box = new T.Box3().setFromObject(r.group);
      let door = null; r.group.traverse((o) => { if (o.userData && o.userData.hinge) door = o.userData.hinge; });
      places[name] = { ...p, group: r.group, r, box, door, o: new T.Vector3(...p.origin) };
    }
    places.shop.extra = []; { // the shop gets a little street: pavement + wall behind
      const pv = mesh(new T.PlaneGeometry(5, 3.5), new T.MeshStandardMaterial({ color: 0xcfcfd4, roughness: 1 }), scene, 14, 0.003, 1.0); pv.rotation.x = -Math.PI / 2; pv.castShadow = false;
      mesh(new T.BoxGeometry(5, 3, 0.2), new T.MeshStandardMaterial({ color: 0xffd8a8, roughness: 1 }), scene, 14, 1.5, -1.25);
    }
    // outdoor places get the Play-mode island's trees, bushes and flowers around them
    const DECOR = {
      ground: [['tree_pine', -4.2, -4.0, 0.55], ['tree_oak', 0.3, -5.2, 0.6], ['tree_birch', 4.6, -4.4, 0.6], ['tree_maple', -6.2, -0.6, 0.5], ['tree_oak', 6.4, 0.8, 0.55], ['tree_pine', -5.4, 3.8, 0.5],
        ['bush', -3.0, -1.75, 1], ['bush', -1.4, -1.9, 0.9], ['bush', 3.6, -1.8, 1.1], ['flowers', 1.0, -1.55, 1], ['flowers', -2.4, 1.6, 1], ['rock', 3.2, 1.4, 1], ['bush', -4.2, 1.2, 1]],
      shop: [['tree_oak', -3.4, -0.7, 0.5], ['tree_pine', 3.6, -0.9, 0.45], ['bush', -2.7, 0.2, 1], ['bush', 2.9, 0.1, 1], ['flowers', 2.3, 1.7, 1], ['flowers', -2.2, 1.9, 1], ['tree_birch', -5.5, 2.5, 0.55], ['tree_maple', 5.8, 2.2, 0.5]],
    };
    for (const [pl, items] of Object.entries(DECOR)) for (const [id, x, z, sc] of items) {
      if (!ZAssets.has(id)) continue;
      const g = ZAssets.build(id).group; g.position.copy(places[pl].o).add(new T.Vector3(x, 0, z)); g.scale.multiplyScalar(sc); g.rotation.y = (x * 7 + z * 3) % 6.28; scene.add(g);
    }
    scene.traverse((o) => { if (o.isMesh) { o.castShadow = o.castShadow !== false; o.receiveShadow = true; } });

    // rain: falling streaks in a box around the camera (same look as the island's rain), plus thunder flashes
    const rain = (() => {
      const N = 5000, pos = new Float32Array(N * 3), seed = new Float32Array(N);
      for (let k = 0; k < N; k++) { const r = (k * 9301 + 49297) % 233280 / 233280, q = (k * 4973 + 1931) % 1000 / 1000, w = (k * 7919 + 3) % 977 / 977; pos.set([(r - 0.5) * 14, q * 9, (w - 0.5) * 14], k * 3); seed[k] = ((k * 2654435761) >>> 0) / 4294967296; }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new T.BufferAttribute(seed, 1));
      const m = new T.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: { uTime: { value: 0 }, uCam: { value: new T.Vector3() }, uAmt: { value: 1 } },
        vertexShader: `attribute float aSeed; uniform float uTime, uAmt; uniform vec3 uCam; varying float vA;
          void main(){ vec3 p = position; p.y = mod(p.y - uTime * (9.0 + 4.0 * aSeed), 9.0);
            vec3 w = vec3(uCam.x + mod(p.x - uCam.x + 7.0, 14.0) - 7.0, p.y - 0.5, uCam.z + mod(p.z - uCam.z + 7.0, 14.0) - 7.0);
            vA = step(fract(aSeed * 13.7), uAmt); vec4 mv = viewMatrix * vec4(w, 1.0);
            gl_PointSize = clamp(60.0 * (3.0 / max(-mv.z, 0.3)), 2.0, 90.0); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `varying float vA; void main(){ if (vA < 0.5) discard; vec2 c = gl_PointCoord - 0.5; if (abs(c.x) > 0.035) discard;
            gl_FragColor = vec4(0.82, 0.88, 0.97, (1.0 - abs(c.y) * 2.0) * 0.55); }`,
      });
      const pts = new T.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 5; pts.visible = false; scene.add(pts);
      return { pts, m };
    })();
    const groundMat = ground.material, groundDry = groundMat.color.clone();

    // ---------- cast (built once, reused across scenes) ----------
    const P = ZCharacters.PRESETS, cast = {};
    for (const [id, c] of Object.entries(story.cast)) {
      const cfg = { ...(P[c.preset] || {}), ...c }; delete cfg.preset;
      // cast entries: { "cast": "teacher" } = a cartoon-world preset, { "toon": "cat" } = a cartoon kind, otherwise a person preset
      const tp = cfg.cast && ZCharacters.TOON_PRESETS ? ZCharacters.TOON_PRESETS[cfg.cast] : null;
      const ch = tp ? ZCharacters.toon(tp) : cfg.toon ? ZCharacters.toon({ kind: cfg.toon, colors: cfg.colors }) : ZCharacters.person(cfg), holder = new T.Group();
      if (tp || cfg.toon) cfg.height = ch.params.height; holder.add(ch.group); holder.visible = false; scene.add(holder);
      ch.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      cast[id] = { ch, holder, cfg };
    }

    // ---------- per-scene state ----------
    let cur = -1, lt = 0, clock = 0, baseHemi = 1.1, flash = 0;
    let sceneProps = {}, beatsDone = 0, tweens = [], coins = [];
    const grip = (who) => { const [a, hand] = who.split('.'); return hand === 'L' ? cast[a].ch.rig.armL.grip : cast[a].ch.rig.armR.grip; };
    function clearGrip(gr) { while (gr.children.length) gr.remove(gr.children[0]); }
    function holdItem(actor, hand, id) {
      const gr = grip(actor + '.' + hand); clearGrip(gr); if (!id) return null;
      const obj = ZAssets.build(id).group; gr.add(obj); obj.userData.itemId = id;
      if (/^note|^notes/.test(id)) { obj.rotation.set(Math.PI / 2, 0, 0); obj.position.set(0, 0.03, 0); }           // notes shown face-on in the hand
      if (id === 'pencils_10' || id === 'question_papers') obj.rotation.set(Math.PI / 2.4, 0, 0);
      return obj;
    }

    function enterScene(i) {
      cur = i; lt = 0; beatsDone = 0; tweens = [];
      for (const p of Object.values(sceneProps)) p.obj.parent && p.obj.parent.remove(p.obj);
      for (const c of coins) c.mesh.parent && c.mesh.parent.remove(c.mesh); coins = [];
      sceneProps = {};
      const sc = timeline[i].scene, place = places[sc.place];
      scene.background = new T.Color(place.sky); scene.fog = new T.Fog(place.sky, 18, 60);
      // lights follow the place
      sun.position.copy(place.o).add(new T.Vector3(4, 9, 6)); sun.target.position.copy(place.o);
      fill.position.copy(place.o).add(new T.Vector3(-5, 4, 4)); fill.target.position.copy(place.o);
      const soft = sc.mood === 'soft', wet = sc.weather && sc.weather.type === 'rain';
      hemi.intensity = soft ? 0.45 : wet ? 0.6 : 1.1; sun.intensity = soft ? 0.5 : wet ? 0.35 : 2.4; fill.intensity = soft ? 0.25 : wet ? 0.35 : 0.6;
      rain.pts.visible = !!wet;
      if (wet) { scene.background = new T.Color(0x8d97a3); scene.fog = new T.Fog(0x8d97a3, 6, 30); groundMat.color.copy(groundDry).multiplyScalar(0.62); groundMat.roughness = 0.35; }
      else { groundMat.color.copy(groundDry); groundMat.roughness = 1; }
      baseHemi = hemi.intensity;
      look = LOOKS[wet ? 'rain' : soft ? 'soft' : sc.place] || LOOKS.home;
      renderer.toneMappingExposure = sc.place === 'home' ? 1.18 : wet ? 0.95 : 1.05;
      windowGlow.intensity = 0;
      if (sc.place === 'home') {   // afternoon sun through the window: warm key from the window side, warm bounce, golden sky tint
        sun.color.set(0xffd6a0); sun.intensity = 2.8; sun.position.copy(place.o).add(new T.Vector3(3.5, 5.5, 4.5));
        hemi.color.set(0xffe9d2); hemi.groundColor.set(0xb98a62); baseHemi = hemi.intensity = 0.95;
        windowGlow.position.copy(place.o).add(new T.Vector3(1.7, 1.8, -1.6)); windowGlow.intensity = 6;
      } else { sun.color.set(0xfff0dc); hemi.color.set(0xeaf2ff); hemi.groundColor.set(0xb59a7a); }
      spot.intensity = 0;
      if (place.door) place.door.rotation.y = 0;
      // actors
      for (const c of Object.values(cast)) { c.holder.visible = false; clearGrip(c.ch.rig.armR.grip); clearGrip(c.ch.rig.armL.grip); c.ch.setTalk(null); }
      for (const [id, a] of Object.entries(sc.actors || {})) {
        const c = cast[id]; if (!c) throw new Error('Actor not in cast: ' + id);
        c.holder.visible = true; c.holder.position.copy(place.o).add(new T.Vector3(...a.at)); c.holder.rotation.y = a.face ?? 0;
        c.ch.setSeat(a.seat == null || a.seat === false ? (sc.place === 'ground' && /^sit/.test(a.anim || '') ? 0.45 : null) : (a.seat === true ? (sc.place === 'classroom' ? 0.44 : 0.45) : a.seat));   // sit ON the bench / desk seat
        c.ch.play(a.anim || 'idle', { instant: true }); c.ch.setExpression(a.expr || 'neutral', true);
        if (a.hold) for (const [hand, item] of Object.entries(a.hold)) holdItem(id, hand, item);
      }
      if (soft && sc.actors) { const id = Object.keys(sc.actors)[0], c = cast[id]; spot.intensity = 9; spot.position.copy(c.holder.position).add(new T.Vector3(1.2, 3.2, 2.2)); spot.target.position.copy(c.holder.position).add(new T.Vector3(0, 0.8, 0)); }
      // props
      for (const p of sc.props || []) {
        if (p.endCard) continue;                                              // drawn as a 2D end card instead
        const r = ZAssets.build(p.id), obj = r.group;
        if (p.attach) { const [a, part] = p.attach.split('.'); const parent = part === 'head' ? cast[a].ch.rig.headC : cast[a].holder; parent.add(obj); obj.position.set(...(p.at || [0, 0, 0])); }
        else { scene.add(obj); obj.position.copy(place.o).add(new T.Vector3(...p.at)); }
        if (p.rot) obj.rotation.set(...p.rot);
        if (p.id === 'football' && obj.userData.tag) obj.userData.tag.rotation.y = 0.5;
        obj.visible = p.show == null; if (obj.userData.setOn) obj.userData.setOn(false);
        obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
        sceneProps[p.id] = { obj, spec: p, r };
      }
      planCamera(0);
    }

    // ---------- camera ----------
    let camSeg = -1, camPlan = null, camSegStart = 0;
    function focusBox(tokens) {
      scene.updateMatrixWorld(true);                                     // positions may have moved since the last render (seek / fast-forward)
      const box = new T.Box3(), sc = timeline[cur].scene, place = places[sc.place];
      for (const tk of tokens) {
        if (tk === '@room') { box.union(place.box.clone().expandByScalar(-0.6)); continue; }
        if (tk.startsWith('@pt:')) { const [x, y, z, r] = tk.slice(4).split(',').map(Number); const c = place.o.clone().add(new T.Vector3(x, y, z)); box.union(new T.Box3().setFromCenterAndSize(c, new T.Vector3(r * 2, r * 2, r * 2))); continue; }
        if (/^[a-z]+\.[RL]$/.test(tk) && cast[tk.split('.')[0]]) {      // what an actor holds in that hand (or the empty hand)
          const gr = grip(tk); gr.updateMatrixWorld(true); const b = new T.Box3();
          for (const ch2 of gr.children) b.union(new T.Box3().setFromObject(ch2));
          if (b.isEmpty()) b.setFromCenterAndSize(gr.getWorldPosition(new T.Vector3()), new T.Vector3(0.12, 0.12, 0.12));
          box.union(b); continue;
        }
        if (tk === '@counterTop') { const o = place.o; box.union(new T.Box3(new T.Vector3(o.x - 0.7, 1.0, o.z - 0.15), new T.Vector3(o.x + 0.7, 1.3, o.z + 0.35))); continue; }
        const [id, part] = tk.split(':');
        if (cast[id]) {
          const c = cast[id]; c.holder.updateMatrixWorld(true);
          if ((part === 'upper' || part === 'head') && (c.cfg.cast || c.cfg.toon)) {   // cartoon heads are big boxes: frame the real head
            const hb = new T.Box3().setFromObject(c.ch.rig.headC);
            if (part === 'upper') hb.expandByPoint(c.ch.rig.chest.getWorldPosition(new T.Vector3()));
            box.union(hb.expandByScalar(0.04));
          } else if (part === 'upper' || part === 'head') {
            const head = c.ch.rig.headC.getWorldPosition(new T.Vector3()), chest = c.ch.rig.chest.getWorldPosition(new T.Vector3()), r = c.cfg.height * 0.09;
            const b = new T.Box3().setFromPoints([head.clone().add(new T.Vector3(0, r * 1.1, 0)), part === 'head' ? head.clone().sub(new T.Vector3(0, r, 0)) : chest.clone().sub(new T.Vector3(0, c.cfg.height * 0.12, 0))]).expandByVector(new T.Vector3(r, 0, r));
            box.union(b);
          } else box.union(new T.Box3().setFromObject(c.ch.group));
          continue;
        }
        if (sceneProps[id]) { const o = sceneProps[id].obj, v = o.visible; o.visible = true; box.union(new T.Box3().setFromObject(o)); o.visible = v; continue; }
        if (id === 'shop_counter') { box.union(new T.Box3().setFromObject(place.group)); continue; }
      }
      if (box.isEmpty()) box.setFromCenterAndSize(place.o.clone().add(new T.Vector3(0, 1, 0)), new T.Vector3(2, 2, 2));
      return box;
    }
    function planCamera(t) {
      const sc = timeline[cur].scene, dur = timeline[cur].dur, segs = sc.camera || [{ move: 'hold', focus: Object.keys(sc.actors || {}) }];
      let k = 0, start = 0;
      for (; k < segs.length; k++) { const end = (segs[k].until ?? 1) * dur; if (t < end || k === segs.length - 1) break; start = end; }
      if (k === camSeg) return;
      camSeg = k; camSegStart = start;
      const s = segs[k], end = (s.until ?? 1) * dur;
      if (s.move === 'fixed') {   // a placed shot inside a room: pos/look relative to the place, optional slow travel to toPos/toLook
        const o = places[sc.place].o, P0 = new T.Vector3(...s.pos).add(o), L0 = new T.Vector3(...s.look).add(o);
        const P1 = s.toPos ? new T.Vector3(...s.toPos).add(o) : P0, L1 = s.toLook ? new T.Vector3(...s.toLook).add(o) : L0, d = Math.max(0.5, end - start);
        camPlan = { at: (t) => { const k = ZCamera.ease(clamp(t / d, 0, 1)); return { pos: P0.clone().lerp(P1, k), look: L0.clone().lerp(L1, k) }; } };
      } else {
        let fb = focusBox(s.focus || []);
        if (s.minSize) { const c = fb.getCenter(new T.Vector3()), sz = fb.getSize(new T.Vector3()).max(new T.Vector3(s.minSize, s.minSize, s.minSize)); fb = new T.Box3().setFromCenterAndSize(c, sz); }
        camPlan = ZCamera.plan(s.move, fb, { ...s, duration: Math.max(0.5, end - start), aspect: W / H, fov: 40 });
      }
    }

    // ---------- beats ----------
    function applyBeat(b) {
      const sc = timeline[cur].scene, place = places[sc.place];
      if (b.actor) {
        const c = cast[b.actor];
        if (b.anim) c.ch.play(b.anim); if (b.expr) c.ch.setExpression(b.expr);
        if (b.face != null) tweens.push({ kind: 'face', c, from: c.holder.rotation.y, to: b.face, t0: lt, d: 0.4 });
        if (b.hold) for (const [hand, item] of Object.entries(b.hold)) holdItem(b.actor, hand, item);
      }
      if (b.hide) clearGrip(grip(b.hide));
      if (b.door != null && place.door) tweens.push({ kind: 'door', o: place.door, from: place.door.rotation.y, to: b.door, t0: lt, d: 0.9 });
      if (b.move) {   // hand an item from one hand to another along a little arc
        const from = grip(b.move.from), to = grip(b.move.to);
        let obj = from.children.find((o) => o.userData.itemId === b.move.item) || from.children[0];
        if (!obj) { obj = ZAssets.build(b.move.item).group; obj.userData.itemId = b.move.item; from.add(obj); }
        const p0 = obj.getWorldPosition(new T.Vector3()), q0 = obj.getWorldQuaternion(new T.Quaternion());
        scene.attach(obj); tweens.push({ kind: 'pass', obj, p0, q0, to, t0: lt, d: 0.45 });
      }
    }
    function runTweens() {
      tweens = tweens.filter((tw) => {
        const k = clamp((lt - tw.t0) / tw.d, 0, 1), e = easeIO(k);
        if (tw.kind === 'face') { let d = tw.to - tw.from; d = Math.atan2(Math.sin(d), Math.cos(d)); tw.c.holder.rotation.y = tw.from + d * e; }
        if (tw.kind === 'door') tw.o.rotation.y = lerp(tw.from, tw.to, e);
        if (tw.kind === 'pass') {
          const p1 = tw.to.getWorldPosition(new T.Vector3()), p = tw.p0.clone().lerp(p1, e); p.y += Math.sin(Math.PI * e) * 0.12;
          tw.obj.position.copy(p);
          if (k >= 1) { tw.to.attach(tw.obj); tw.obj.position.set(0, /^note/.test(tw.obj.userData.itemId || '') ? 0.03 : 0, 0); }
        }
        return k < 1;
      });
    }

    // ---------- one simulation step of the current scene ----------
    function simulate(dt) {
      const e = timeline[cur], sc = e.scene, f = lt / e.dur, place = places[sc.place];
      const beats = (sc.beats || []).slice().sort((a, b) => a.at - b.at);
      while (beatsDone < beats.length && beats[beatsDone].at * e.dur <= lt) applyBeat(beats[beatsDone++]);
      // paths (walk / run in)
      for (const [id, a] of Object.entries(sc.actors || {})) {
        if (!a.path) continue;
        const c = cast[id], ks = a.path; let j = 0; while (j < ks.length - 1 && f > ks[j + 1].at) j++;
        const A = ks[j], B = ks[Math.min(j + 1, ks.length - 1)], k = B === A ? 1 : clamp((f - A.at) / (B.at - A.at), 0, 1);
        const pa = new T.Vector3(...A.pos), pb = new T.Vector3(...B.pos), pos = pa.clone().lerp(pb, k);
        c.holder.position.copy(place.o).add(pos);
        if (k < 1 && pb.distanceTo(pa) > 0.01) { const d = pb.clone().sub(pa); c.holder.rotation.y = Math.atan2(d.x, d.z); }
      }
      // props: appear / light up / coins
      for (const p of Object.values(sceneProps)) {
        const s = p.spec;
        if (s.show != null && !p.obj.visible && f >= s.show) { p.obj.visible = true; p.pop = lt; }
        if (p.pop != null) { const k = clamp((lt - p.pop) / 0.35, 0, 1), sc2 = k < 1 ? 0.6 + 0.4 * Math.sin(k * Math.PI / 2) * (1 + 0.25 * Math.sin(k * Math.PI)) : 1; p.obj.scale.setScalar(sc2); }
        if (s.on != null && p.obj.userData.setOn && f >= s.on && !p.lit) { p.obj.userData.setOn(true); p.lit = true; }
        if (s.coins) {
          const cc = s.coins, want = Math.floor(clamp((f - cc.start) / (cc.end - cc.start), 0, 1) * cc.count + 1e-6);
          while (coins.length < want) {
            const m = ZAssets.build('coin_5').group, base = p.obj.position.clone();
            const k = coins.length, jx = Math.sin(k * 12.9898) * 0.045, jz = Math.cos(k * 78.233) * 0.03;   // spread over the tin floor (same every render)
            m.position.copy(base).add(new T.Vector3(jx, 0.45, jz)); m.rotation.set(k * 0.7, k * 1.3, 0);
            scene.add(m); coins.push({ mesh: m, v: 0, floor: base.y + 0.005 + Math.floor(k / 4) * 0.0024, spin: 6 + (k % 5), yaw: k * 0.9 });
          }
        }
      }
      for (const c of coins) { if (c.mesh.position.y > c.floor) { c.v -= 9.8 * dt; c.mesh.position.y = Math.max(c.floor, c.mesh.position.y + c.v * dt); c.mesh.rotation.x += c.spin * dt; } else c.mesh.rotation.set(0.05, c.yaw, 0.04); }   // land flat, face up
      runTweens();
      // talking mouth from the voice
      if (sc.talking && envelopes[cur]) { const env = envelopes[cur], idx = Math.floor(lt * 60); cast[sc.talking].ch.setTalk(idx < env.length ? env[idx] : 0); }
      for (const [id] of Object.entries(sc.actors || {})) cast[id].ch.update(dt);
      lt += dt;
    }

    // ---------- 2D overlays ----------
    const BRAND = { purple: '#4b2a8c', teal: '#13b5c6', orange: '#f8a51b', pink: '#ff4f8b', violet: '#7c5cf2', yellow: '#fcc72c', ink: '#1f1a33' };
    const logoImg = new Image(); logoImg.src = new URL('assets/brand/zungga-logo.png', document.baseURI).href;
    function pill(x, y, w, h, r, fillStyle) { g2.fillStyle = fillStyle; g2.beginPath(); g2.roundRect(x, y, w, h, r); g2.fill(); }
    function wrapLines(text, maxW) { const words = text.split(' '), lines = []; let line = ''; for (const w of words) { const t = line ? line + ' ' + w : w; if (g2.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; } if (line) lines.push(line); return lines; }
    function drawOverlays() {
      // everything sits in a stack at the TOP, kept small, so the story below stays visible
      const e = timeline[cur], sc = e.scene, f = lt / e.dur;
      let y = 64;
      // counter
      if (sc.counter) {
        const c = sc.counter; let v;
        if (c.steps) { v = c.from; let prev = c.from; for (const st of c.steps) { if (f < st.at) break; const k2 = clamp((f - st.at) * e.dur / 0.6, 0, 1); v = Math.round(lerp(prev, st.v, easeIO(k2))); prev = st.v; } }
        else { const k = clamp((f - (c.start ?? 0)) / Math.max(0.01, (c.end ?? 0) - (c.start ?? 0)), 0, 1); v = Math.round(lerp(c.from, c.to, easeIO(k))); }
        const appear = clamp(lt / 0.4, 0, 1), yy = y - (1 - appear) * 40;
        g2.globalAlpha = appear; pill(W / 2 - 170, yy, 340, 128, 36, 'rgba(255,255,255,0.94)');
        g2.fillStyle = BRAND.purple; g2.font = '600 28px Fredoka'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; g2.fillText(c.label || '', W / 2, yy + 32);
        const grad = g2.createLinearGradient(W / 2 - 110, 0, W / 2 + 110, 0); grad.addColorStop(0, BRAND.orange); grad.addColorStop(1, BRAND.pink);
        g2.fillStyle = grad; g2.font = '700 70px Fredoka'; g2.fillText('₹' + v, W / 2, yy + 84); g2.globalAlpha = 1;
        y += 128 + 18;
      }
      // caption (key line of the scene)
      if (sc.caption && f >= sc.caption.at && f <= (sc.caption.until ?? 1)) {
        const k = clamp((f - sc.caption.at) * e.dur / 0.35, 0, 1), big = sc.caption.big;
        g2.font = `700 ${big ? 50 : 44}px Fredoka`; const lines = wrapLines(sc.caption.text, W - 300), lh = big ? 60 : 54, bh = lines.length * lh + 36;
        g2.save(); g2.globalAlpha = k; g2.translate(W / 2, y + bh / 2); g2.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k); g2.translate(-W / 2, -(y + bh / 2));
        const grad = g2.createLinearGradient(130, 0, W - 130, 0); grad.addColorStop(0, BRAND.violet); grad.addColorStop(1, BRAND.pink);
        pill(130, y, W - 260, bh, 30, grad);
        g2.fillStyle = '#fff'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; lines.forEach((l, i) => g2.fillText(l, W / 2, y + 18 + lh / 2 + i * lh));
        g2.restore();
      }
      // subtitles (the narration) at the BOTTOM, each chunk shown from its first spoken word
      const voiceDur = buffers[cur] ? buffers[cur].duration : e.dur - pause;
      const chunks = subtitleChunks(sc.narration), wl = wordsMap[`scene-${String(sc.id).padStart(2, '0')}.wav`];
      let chunk = null, wi = 0, totalW = chunks.reduce((a2, c2) => a2 + c2.n, 0), acc2 = 0;
      for (let ci = 0; ci < chunks.length; ci++) {
        const c2 = chunks[ci], t0 = wl && wl[wi] ? wl[wi][1] : acc2 / totalW * voiceDur;
        const nx = ci + 1 < chunks.length ? (wl && wl[wi + c2.n] ? wl[wi + c2.n][1] : (acc2 + c2.n) / totalW * voiceDur) : voiceDur + 0.3;
        if (lt >= t0 - 0.05 && lt < nx) { chunk = c2; break; }
        wi += c2.n; acc2 += c2.n;
      }
      if (chunk) {
        g2.font = '600 44px Fredoka'; const lines = wrapLines(chunk.text, W - 220), lh = 56, bh = lines.length * lh + 36, y0 = H - 250 - bh;
        pill(80, y0, W - 160, bh, 28, 'rgba(31,26,51,0.75)');
        g2.fillStyle = '#fff'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; lines.forEach((l, i) => g2.fillText(l, W / 2, y0 + 18 + lh / 2 + i * lh));
      }
      // end card (logo) on the last scene
      const endP = (sc.props || []).find((p) => p.endCard);
      if (endP && f >= endP.show) {
        const k = clamp((f - endP.show) * e.dur / 0.6, 0, 1);
        g2.fillStyle = `rgba(255,255,255,${0.96 * k})`; g2.fillRect(0, 0, W, H);
        if (logoImg.complete && logoImg.naturalWidth) { const lw = 760 * (0.9 + 0.1 * k), lh2 = lw * logoImg.naturalHeight / logoImg.naturalWidth; g2.globalAlpha = k; g2.drawImage(logoImg, W / 2 - lw / 2, H * 0.42 - lh2 / 2, lw, lh2); g2.globalAlpha = 1; }
      }
    }
    const chunkCache = new Map();
    function subtitleChunks(text) {
      if (chunkCache.has(text)) return chunkCache.get(text);
      const parts = text.match(/[^.?!,]+[.?!,]*/g).map((s) => s.trim()).filter(Boolean), out = [];
      let buf = '';
      for (const p of parts) { const t = buf ? buf + ' ' + p : p; if (t.split(' ').length > 9 && buf) { out.push(buf); buf = p; } else buf = t; if (/[.?!]$/.test(buf)) { out.push(buf); buf = ''; } }
      if (buf) out.push(buf);
      const res = out.map((t) => ({ text: t, n: (t.match(/[A-Za-z0-9']+/g) || []).length })); chunkCache.set(text, res); return res;
    }

    // ---------- draw ----------
    function draw() {
      planCamera(lt);
      const p = camPlan.at(lt - camSegStart); camera.position.copy(p.pos); camera.lookAt(p.look);
      const sc = timeline[cur].scene, e = timeline[cur];
      flash = 0;
      if (sc.weather && sc.weather.thunder) for (const th of sc.weather.thunder) { const at = (typeof th === 'object' ? th.at : th) * e.dur, d = lt - at; if (d >= 0 && d < 0.6) flash = Math.max(flash, Math.exp(-d * 7) * (d < 0.08 ? 1 : 0.8 + 0.2 * Math.sin(d * 60))); }
      hemi.intensity = baseHemi + flash * 2.2;
      rain.m.uniforms.uTime.value = clock; rain.m.uniforms.uCam.value.copy(camera.position);
      // scene → (copy) sharp → half-res blur (depth of field) → quarter-res glow (bloom) → final grade to the canvas
      renderer.setRenderTarget(rtScene); renderer.render(scene, camera);
      copyM.uniforms.tSrc.value = rtScene.texture; copyM.uniforms.uThresh.value = 0; pass(copyM, rtSharp);
      pass(copyM, rtA); blurM.uniforms.tSrc.value = rtA.texture; blurM.uniforms.uDir.value.set(1.6 / (W / 2), 0); pass(blurM, rtB);
      blurM.uniforms.tSrc.value = rtB.texture; blurM.uniforms.uDir.value.set(0, 1.6 / (H / 2)); pass(blurM, rtA);
      copyM.uniforms.tSrc.value = rtScene.texture; copyM.uniforms.uThresh.value = 0.85; pass(copyM, rtC);
      for (let k = 0; k < 2; k++) { blurM.uniforms.tSrc.value = rtC.texture; blurM.uniforms.uDir.value.set(2.2 / (W / 4), 0); pass(blurM, rtD); blurM.uniforms.tSrc.value = rtD.texture; blurM.uniforms.uDir.value.set(0, 2.2 / (H / 4)); pass(blurM, rtC); }
      const fu = finalM.uniforms; fu.tSharp.value = rtSharp.texture; fu.tBlur.value = rtA.texture; fu.tBloom.value = rtC.texture; fu.tDepth.value = rtScene.depthTexture;
      fu.uNear.value = camera.near; fu.uFar.value = camera.far; fu.uFocus.value = camera.position.distanceTo(p.look);
      fu.uAperture.value = look.aperture; fu.uBloom.value = look.bloom; fu.uWarm.value.set(...look.warm); fu.uVignette.value = look.vignette; fu.uSat.value = look.sat;
      pass(finalM, null);
      g2.drawImage(renderer.domElement, 0, 0, W, H);
      if (flash > 0) { g2.fillStyle = `rgba(235,240,255,${0.35 * flash})`; g2.fillRect(0, 0, W, H); }
      drawOverlays();
    }
    function sceneAt(t) { for (let i = timeline.length - 1; i >= 0; i--) if (t >= timeline[i].start) return i; return 0; }

    const api = {
      story, timeline, total, canvas: out, voiceDir: opts.voiceDir || 'voice', fps: FPS, width: W, height: H, audioContext: actx,
      get time() { return clock; }, get sceneIndex() { return cur; }, get sceneTime() { return lt; },
      audioFor: (i) => buffers[i], envelopeFor: (i) => envelopes[i],
      cues, sfxBuffer: (f) => sfxBuffers[f], sfxDir: 'studio/assets/sfx/', scene, camera,
      // advance by dt (sequential playback); crosses scene boundaries cleanly
      step(dt = DT) {
        clock = Math.min(total, clock + dt);
        const i = sceneAt(clock);
        if (i !== cur) { enterScene(i); camSeg = -1; }
        const target = clock - timeline[i].start;
        while (lt + 1e-6 < target) simulate(Math.min(DT, target - lt));
        draw();
        return { scene: i, ended: clock >= total };
      },
      // jump anywhere: re-enter that scene and fast-forward deterministically
      seek(t) {
        clock = clamp(t, 0, total); const i = sceneAt(clock);
        enterScene(i); camSeg = -1;
        const target = clock - timeline[i].start;
        while (lt + 1e-6 < target) simulate(Math.min(DT, target - lt));
        draw();
        return i;
      },
    };
    api.seek(0);
    return api;
  }
  window.ZStory = { create, PLACES };
})();
