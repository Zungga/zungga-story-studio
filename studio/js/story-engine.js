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
  const FPS = 30, DT = 1 / FPS;
  // characters differ in which faces they have: fall back to a near one instead of failing
  const NEAR = { excited: 'big_smile', proud: 'smile', calm: 'smile', guilty: 'sad', scared: 'worried', happy: 'big_smile', playful: 'smile', confident: 'smile', shy: 'smile', focused: 'thinking', laughing: 'big_smile', shocked: 'surprised', cheeky: 'smile', protective: 'determined' };
  function safeExpr(ch, e, instant) { try { ch.setExpression(e, instant); } catch (err) { try { ch.setExpression(NEAR[e] || 'smile', instant); } catch (err2) { ch.setExpression('neutral', instant); } } }

  // where each place sits in the one shared world (sets are built once)
  const WORLD_OFF = [0, 0, -700];   // where connected worlds (the chocolate factory) are built, far away from the small sets
  const PLACES = {
    home:      { origin: [0, 0, 0], set: 'home_room', sky: 0xfff3e6 },
    shop:      { origin: [14, 0, 0], set: 'shop_counter', sky: 0xbfe3ff, ground: true },
    ground:    { origin: [-14, 0, 0], set: 'school_ground', sky: 0xbfe3ff, ground: true },
    classroom: { origin: [0, 0, -16], set: 'classroom', sky: 0xfdf2d6 },
    // added with the big asset pack (sets in assets/places.js); places are built only when a story uses them
    bank:        { origin: [40, 0, 0], set: 'bank_set', sky: 0xf3efe6 },
    kitchen:     { origin: [40, 0, -40], set: 'kitchen_set', sky: 0xfff3e6 },
    bedroom:     { origin: [-40, 0, 0], set: 'bedroom_set', sky: 0xfff3e6 },
    park:        { origin: [-40, 0, -40], set: 'park_set', sky: 0xbfe3ff, outdoor: true },
    supermarket: { origin: [40, 0, 40], set: 'supermarket_set', sky: 0xf6f7fb },
    street:      { origin: [0, 0, 40], set: 'street_set', sky: 0xbfe3ff, outdoor: true },
    party:       { origin: [-40, 0, 40], set: 'party_set', sky: 0xfde7f3 },
    festival:    { origin: [80, 0, 0], set: 'festival_set', sky: 0x3b2a55, outdoor: true, evening: true },
    library:     { origin: [0, 0, -40], set: 'library_set', sky: 0xf5ecdc },
    night_ground:{ origin: [-80, 0, 0], set: 'night_ground_set', sky: 0x121a33, outdoor: true, night: true },
    // the resume island's places
    beach:       { origin: [0, 0, 80], set: 'beach_set', sky: 0xbfe6ff, outdoor: true },
    market:      { origin: [80, 0, 40], set: 'market_set', sky: 0xbfe3ff, outdoor: true },
    village:     { origin: [80, 0, -40], set: 'village_set', sky: 0xbfe3ff, outdoor: true },
    camp:        { origin: [-80, 0, 40], set: 'camp_set', sky: 0x3a2f5c, outdoor: true, evening: true },
    sports:      { origin: [-80, 0, -40], set: 'sports_set', sky: 0xbfe3ff, outdoor: true },
    cave:        { origin: [0, 0, -80], set: 'cave_set', sky: 0x0b0c12, night: true },
    // Zungga pilot episodes
    colony:      { origin: [0, 0, 160], set: 'colony_set', sky: 0xbfe3ff, outdoor: true },
  };

  const ENGINE_BASE = document.currentScript && document.currentScript.src ? new URL('..', document.currentScript.src).href : '../';
  async function create(opts) {
    // default video mix (Walk the World → Mixer → Save writes studio/assets/mix.json)
    const VMIX = { voice: 1, music: 1, ambience: 1, sfx: 1 };
    try { const r = await fetch(ENGINE_BASE + 'assets/mix.json', { cache: 'no-store' }); if (r.ok) Object.assign(VMIX, (await r.json()).video || {}); } catch { /* defaults */ }
    const storyDir = opts.storyDir.endsWith('/') ? opts.storyDir : opts.storyDir + '/';
    let story = opts.story ? JSON.parse(JSON.stringify(opts.story)) : await (await fetch(storyDir + 'story.json', { cache: 'no-store' })).json();
    const W = opts.width || story.format?.width || 1080, H = opts.height || story.format?.height || 1920;
    const OPT = { subtitles: true, endCard: true, ...(opts.options || {}) };
    const optv = (k) => (opts.options && opts.options[k] != null ? opts.options[k] : story.options && story.options[k] != null ? story.options[k] : OPT[k]);
    const FPS = opts.fps || 30, DT = 1 / FPS;   // 24 / 30 / 60
    const UI = Math.sqrt(W * H / (1080 * 1920)), VW = W / UI, VH = H / UI;   // overlays are laid out on a 1080×1920-sized virtual page, scaled to the output
    let durations = {};
    let vdir = (opts.voiceDir || 'voice') + '/';
    try { durations = await (await fetch(storyDir + vdir + 'durations.json', { cache: 'no-store' })).json(); } catch (e) { /* no voice yet */ }
    let wordsMap = {};
    try { wordsMap = await (await fetch(storyDir + vdir + 'words.json', { cache: 'no-store' })).json(); } catch (e) { /* no word timings yet */ }
    await document.fonts.load('700 60px Fredoka').catch(() => {}); await document.fonts.ready;

    // ---------- audio (decoded once; the page decides how to play it) ----------
    const actx = opts.audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const clipById = {};   // scene id → { buf, env }
    async function loadClips(scenes) {
      await Promise.all(scenes.map(async (sc) => {
        const name = `scene-${String(sc.id).padStart(2, '0')}.wav`;
        if (clipById[sc.id] || !durations[name]) return;
        try { const buf = await actx.decodeAudioData(await (await fetch(storyDir + vdir + name, { cache: 'no-store' })).arrayBuffer()); clipById[sc.id] = { buf, env: envelopeOf(buf) }; } catch (e) { /* no clip */ }
      }));
    }
    // loudness envelope per clip (for the talking mouth + nothing else) — 60 samples a second
    function envelopeOf(b) {
      const d = b.getChannelData(0), step = Math.floor(b.sampleRate / 60), out = new Float32Array(Math.ceil(d.length / step));
      for (let i = 0; i < out.length; i++) { let s = 0; for (let j = i * step; j < Math.min(d.length, (i + 1) * step); j++) s += d[j] * d[j]; out[i] = Math.sqrt(s / step); }
      const mx = Math.max(...out) || 1; for (let i = 0; i < out.length; i++) out[i] = Math.min(1, out[i] / (mx * 0.6));
      return out;
    }
    await loadClips(story.scenes);
    let buffers = [], envelopes = [];

    // ---------- timeline (re-run by prepare() after every edit) ----------
    let pause = 0.7, timeline = [], total = 0, cues = [];
    function prepare() {
    pause = story.voice?.pauseAfter ?? 0.7;
    buffers = story.scenes.map((sc) => clipById[sc.id]?.buf || null); envelopes = story.scenes.map((sc) => clipById[sc.id]?.env || null);
    let acc = 0;
    timeline = story.scenes.map((sc, i) => {
      const words = sc.narration.split(/\s+/).length;
      const dur = (buffers[i] ? buffers[i].duration : words / 2.6) + pause + (i === story.scenes.length - 1 ? 1.8 : 0);   // last scene holds the end card a little
      const e = { scene: sc, start: acc, dur: dur + (sc.extraTime || 0) + (sc.pause ? sc.pause.seconds || 8 : 0), voice: buffers[i] ? buffers[i].duration : words / 2.6 }; acc += e.dur; return e;
    });
    total = acc;

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
      for (const cd of sc.cards || []) { if (cd.word) cd.at = f(cd.word, cd.offset || 0); if (cd.untilWord) cd.until = f(cd.untilWord, cd.untilOffset || 0); for (const it of cd.items || []) if (it.word) it.at = f(it.word, it.offset || 0); }
      for (const x of sc.sfx || []) if (x.word) x.at = f(x.word, x.offset || 0);
      for (const x of (sc.weather && sc.weather.thunder) || []) if (typeof x === 'object' && x.word) x.at = f(x.word, x.offset || 0);
    });

    // ---------- sound effects: one list of cues for the page (live) and the renderer (ffmpeg) ----------
    cues = [];
    timeline.forEach((e, i) => {
      const sc = e.scene;
      for (const x of sc.sfx || []) cues.push({ file: x.file, start: e.start + x.at * e.dur, vol: (x.vol ?? 0.8) * VMIX.sfx, dur: null, loop: false });
      if (sc.pause) { const p0 = e.start + e.voice + 0.25, n = sc.pause.seconds || 8; for (let k = 0; k < n; k++) cues.push({ file: 'tick.wav', start: p0 + k, vol: 0.35 * VMIX.sfx, dur: null, loop: false }); cues.push({ file: 'ding.wav', start: p0 + n - 0.05, vol: 0.5 * VMIX.sfx, dur: null, loop: false }); cues.push({ file: 'pop.wav', start: p0 - 0.15, vol: 0.45 * VMIX.sfx, dur: null, loop: false }); }
      for (const cd of sc.cards || []) if (cd.sound !== false) cues.push({ file: cd.sound || 'pop.wav', start: e.start + (cd.at || 0) * e.dur, vol: 0.4 * VMIX.sfx, dur: null, loop: false });
      if (sc.ambience) cues.push({ file: sc.ambience.file, start: e.start, vol: (sc.ambience.vol ?? 0.5) * VMIX.ambience, dur: e.dur, loop: true });
      if (sc.weather && sc.weather.thunder) for (const th of sc.weather.thunder) { const at = typeof th === 'object' ? th.at : th; cues.push({ file: 'thunder.wav', start: e.start + at * e.dur + 0.35, vol: 0.35, dur: null, loop: false }); }
      for (const pr of sc.props || []) if (pr.coins && pr.coins.sound) for (let k = 0; k < pr.coins.count; k++) {
        const fk = pr.coins.start + (k + 1) / pr.coins.count * (pr.coins.end - pr.coins.start);
        cues.push({ file: pr.coins.sound, start: e.start + fk * e.dur + 0.28, vol: (pr.coins.vol ?? 0.35) * VMIX.sfx, dur: null, loop: false });
      }
      if (story.music && story.music.file && i === 0) cues.push({ file: story.music.file, start: 0, vol: (story.music.vol ?? 0.15) * VMIX.music, dur: total, loop: true, music: true, offset: story.music.start || 0, fadeIn: story.music.fadeIn ?? 0.6, fadeOut: story.music.fadeOut ?? 2 });   // offset = where in the track the story starts
    });
    }
    prepare();
    const sfxBase = new URL('assets/sfx/', document.baseURI).href, sfxBuffers = {};
    async function loadSfx() { await Promise.all([...new Set(cues.map((c) => c.file))].filter((f) => !sfxBuffers[f]).map(async (f) => { try { sfxBuffers[f] = await actx.decodeAudioData(await (await fetch(sfxBase + f)).arrayBuffer()); } catch (err) { console.warn('sfx missing', f); } })); }
    await loadSfx();

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
      night: { warm: [0.9, 0.96, 1.12], bloom: 0.9, aperture: 0.45, vignette: 0.55, sat: 0.95 },
      evening: { warm: [1.12, 0.98, 0.88], bloom: 0.85, aperture: 0.5, vignette: 0.5, sat: 1.1 },
      bank: { warm: [1.03, 1.0, 0.97], bloom: 0.35, aperture: 0.45, vignette: 0.3, sat: 1.02 },
      kitchen: { warm: [1.08, 1.0, 0.9], bloom: 0.5, aperture: 0.5, vignette: 0.35, sat: 1.06 },
      bedroom: { warm: [1.08, 1.0, 0.9], bloom: 0.5, aperture: 0.55, vignette: 0.38, sat: 1.05 },
      park: { warm: [1.04, 1.0, 0.95], bloom: 0.35, aperture: 0.4, vignette: 0.3, sat: 1.08 },
      street: { warm: [1.04, 1.0, 0.95], bloom: 0.35, aperture: 0.4, vignette: 0.3, sat: 1.06 },
      supermarket: { warm: [1.0, 1.0, 1.0], bloom: 0.35, aperture: 0.4, vignette: 0.28, sat: 1.06 },
      party: { warm: [1.08, 1.0, 0.95], bloom: 0.6, aperture: 0.5, vignette: 0.35, sat: 1.1 },
      library: { warm: [1.1, 1.0, 0.88], bloom: 0.45, aperture: 0.55, vignette: 0.4, sat: 1.0 },
      colony: { warm: [1.09, 1.0, 0.9], bloom: 0.45, aperture: 0.38, vignette: 0.3, sat: 1.12 },   // a hot, bright summer day
    };
    if (window.ZFactory && ZFactory.layout) for (const fp of ZFactory.layout.places) if (!PLACES[fp.storyId]) PLACES[fp.storyId] = { origin: [fp.spot[0] + WORLD_OFF[0], fp.spot[1] + WORLD_OFF[1], fp.spot[2] + WORLD_OFF[2]], world: 'chocolate_factory', factory: true, sky: fp.dark ? 0x120c18 : 0xbfe3ff, outdoor: fp.outdoor, dark: fp.dark, label: fp.name, room: fp.room ? { x0: fp.room.x0 + WORLD_OFF[0], x1: fp.room.x1 + WORLD_OFF[0], z0: fp.room.z0 + WORLD_OFF[2], z1: fp.room.z1 + WORLD_OFF[2], y0: fp.room.y0, y1: fp.room.y1 } : null };
    let look = LOOKS.home;

    // shared world: ground + all places
    const { mesh, tex } = ZAssets.helpers;
    const groundT = tex((c, w, h) => { c.fillStyle = '#d8c39a'; c.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { c.fillStyle = ['#cdb68a', '#e2cfa8', '#c4ab7d'][i % 3]; c.globalAlpha = 0.5; c.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3); } c.globalAlpha = 1; }, 512, 512);
    groundT.wrapS = groundT.wrapT = T.RepeatWrapping; groundT.repeat.set(40, 40);
    const ground = mesh(new T.PlaneGeometry(200, 200), new T.MeshStandardMaterial({ map: groundT, roughness: 1 }), scene, 0, -0.001, 0); ground.rotation.x = -Math.PI / 2; ground.castShadow = false;
    const places = {};
    // a place is built the first time a story uses it (unknown / not-yet-built sets fall back to home)
    function ensurePlace(name) {
      if (places[name]) return places[name];
      const p0 = PLACES[name]; if (p0 && p0.world) return ensureWorldPlace(name, p0);
      const p = PLACES[name]; if (!p || !ZAssets.has(p.set)) { if (name !== 'home') console.warn('Place not available:', name); return ensurePlace('home'); }
      const r = ZAssets.build(p.set); r.group.position.set(...p.origin); scene.add(r.group);
      const box = new T.Box3().setFromObject(r.group);
      let door = null; r.group.traverse((o) => { if (o.userData && o.userData.hinge) door = o.userData.hinge; });
      const pl = places[name] = { ...p, name, group: r.group, r, box, door, o: new T.Vector3(...p.origin), ticks: [] };
      r.group.traverse((o) => { if (o.userData && typeof o.userData.tick === 'function') pl.ticks.push(o.userData.tick); });   // fans, clocks, flags… in the set
      if (name === 'shop') {   // the shop gets a little street: pavement + wall behind
        const pv = mesh(new T.PlaneGeometry(5, 3.5), new T.MeshStandardMaterial({ color: 0xcfcfd4, roughness: 1 }), scene, 14, 0.003, 1.0); pv.rotation.x = -Math.PI / 2; pv.castShadow = false;
        mesh(new T.BoxGeometry(5, 3, 0.2), new T.MeshStandardMaterial({ color: 0xffd8a8, roughness: 1 }), scene, 14, 1.5, -1.25);
      }
      for (const [id, x, z, sc] of DECOR[name] || []) {
        if (!ZAssets.has(id)) continue;
        const g = ZAssets.build(id).group; g.position.copy(pl.o).add(new T.Vector3(x, 0, z)); g.scale.multiplyScalar(sc); g.rotation.y = (x * 7 + z * 3) % 6.28; scene.add(g);
      }
      r.group.traverse((o) => { if (o.isMesh) { o.castShadow = o.castShadow !== false; o.receiveShadow = true; } });
      return pl;
    }
    // the Zungga Chocolate Factory: one connected 3-floor world, built once (far from the small sets); each room is a place 'cf_<id>'
    let factoryW = null;
    function ensureWorldPlace(name, p) {
      if (!factoryW) {
        if (!window.ZWorld || !window.ZFactory || !ZFactory.buildGround) { console.warn('Factory world scripts are not loaded on this page'); return ensurePlace('home'); }
        const root = new T.Group(); root.position.set(...WORLD_OFF); scene.add(root);
        const W = ZWorld.create(root); ZFactory.buildGround(W); ZFactory.buildFirst(W); ZFactory.buildUnder(W); if (ZFactory.finish) ZFactory.finish(W); for (const k of Object.keys(W.floors)) W.bake(W.floors[k]);
        root.updateMatrixWorld(true); factoryW = { W, root, last: 0 };
      }
      const o = new T.Vector3(...p.origin);
      const pl = places[name] = { ...p, name, group: factoryW.root, r: { group: factoryW.root }, box: new T.Box3().setFromCenterAndSize(o.clone().add(new T.Vector3(0, 2, 0)), new T.Vector3(10, 4, 10)), door: null, o,
        ticks: [(t) => { const dt = Math.max(0, Math.min(0.1, t - factoryW.last)) || 1 / 30; factoryW.last = t; factoryW.W.update(t, dt, null); }] };
      pl.enter = () => {   // the roof of the building we are in comes off (like a doll's house); underground hides the floors above
        const lp = { x: p.origin[0] - WORLD_OFF[0], y: p.origin[1], z: p.origin[2] - WORLD_OFF[2] };
        for (const r of factoryW.W.roofs) { const dx = lp.x - r.x, dz = lp.z - r.z, lx = dx * r.c - dz * r.s, lz = dx * r.s + dz * r.c; r.obj.visible = !(Math.abs(lx) < r.hx && Math.abs(lz) < r.hz && lp.y > r.y0 && lp.y < r.y1); }
        const F = factoryW.W.floors; F.under.visible = !!p.dark; F.ground.visible = F.first.visible = !p.dark;
      };
      return pl;
    }
    const placeOf = (name) => places[name] || ensurePlace(name);
    // outdoor places get the Play-mode island's trees, bushes and flowers around them
    const DECOR = {
      ground: [['tree_pine', -4.2, -4.0, 0.55], ['tree_oak', 0.3, -5.2, 0.6], ['tree_birch', 4.6, -4.4, 0.6], ['tree_maple', -6.2, -0.6, 0.5], ['tree_oak', 6.4, 0.8, 0.55], ['tree_pine', -5.4, 3.8, 0.5],
        ['bush', -3.0, -1.75, 1], ['bush', -1.4, -1.9, 0.9], ['bush', 3.6, -1.8, 1.1], ['flowers', 1.0, -1.55, 1], ['flowers', -2.4, 1.6, 1], ['rock', 3.2, 1.4, 1], ['bush', -4.2, 1.2, 1]],
      shop: [['tree_oak', -3.4, -0.7, 0.5], ['tree_pine', 3.6, -0.9, 0.45], ['bush', -2.7, 0.2, 1], ['bush', 2.9, 0.1, 1], ['flowers', 2.3, 1.7, 1], ['flowers', -2.2, 1.9, 1], ['tree_birch', -5.5, 2.5, 0.55], ['tree_maple', 5.8, 2.2, 0.5]],
    };
    ensurePlace('home'); for (const sc of story.scenes) ensurePlace(sc.place);

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
    // snow: soft flakes drifting down around the camera (sway, slow) — weather { type: 'snow' } or season 'winter'
    const snow = (() => {
      const N = 2600, pos = new Float32Array(N * 3), seed = new Float32Array(N);
      for (let k = 0; k < N; k++) { const r = (k * 9301 + 49297) % 233280 / 233280, q = (k * 4973 + 1931) % 1000 / 1000, w = (k * 7919 + 3) % 977 / 977; pos.set([(r - 0.5) * 14, q * 9, (w - 0.5) * 14], k * 3); seed[k] = ((k * 2654435761) >>> 0) / 4294967296; }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new T.BufferAttribute(seed, 1));
      const m = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 }, uCam: { value: new T.Vector3() } },
        vertexShader: `attribute float aSeed; uniform float uTime; uniform vec3 uCam; varying float vA;
          void main(){ vec3 p = position; p.y = mod(p.y - uTime * (0.6 + 0.5 * aSeed), 9.0); p.x += sin(uTime * (0.8 + aSeed) + aSeed * 40.0) * 0.35; p.z += cos(uTime * 0.7 + aSeed * 23.0) * 0.25;
            vec3 w = vec3(uCam.x + mod(p.x - uCam.x + 7.0, 14.0) - 7.0, p.y - 0.5, uCam.z + mod(p.z - uCam.z + 7.0, 14.0) - 7.0);
            vA = 0.6 + 0.4 * aSeed; vec4 mv = viewMatrix * vec4(w, 1.0); gl_PointSize = clamp(26.0 * (3.0 / max(-mv.z, 0.3)) * (0.6 + aSeed * 0.6), 1.5, 40.0); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard; gl_FragColor = vec4(1.0, 1.0, 1.0, (1.0 - d * 2.0) * vA); }` });
      const pts = new T.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 5; pts.visible = false; scene.add(pts);
      return { pts, m };
    })();
    // season dressing for outdoor places: a snow blanket (winter) or a carpet of fallen leaves (autumn)
    const seasonLayer = (() => {
      const snowT = tex((c, w, h) => { c.fillStyle = '#f4f8ff'; c.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { c.fillStyle = ['#e6eefb', '#ffffff', '#dfe8f7'][i % 3]; c.globalAlpha = 0.7; c.beginPath(); c.arc((i * 73) % w, (i * 151) % h, 2 + (i % 5), 0, 6.3); c.fill(); } c.globalAlpha = 1; }, 512, 512);
      snowT.wrapS = snowT.wrapT = T.RepeatWrapping; snowT.repeat.set(10, 10);
      const leafT = tex((c, w, h) => { c.clearRect(0, 0, w, h); for (let i = 0; i < 900; i++) { c.fillStyle = ['#d9622b', '#e8a33d', '#b8441f', '#c98a2c'][i % 4]; c.save(); c.translate((i * 97) % w, (i * 211) % h); c.rotate(i); c.beginPath(); c.ellipse(0, 0, 9, 4, 0, 0, 6.3); c.fill(); c.restore(); } }, 512, 512);
      leafT.wrapS = leafT.wrapT = T.RepeatWrapping; leafT.repeat.set(8, 8);
      const geo = new T.CircleGeometry(16, 48);
      const sn = new T.Mesh(geo, new T.MeshStandardMaterial({ map: snowT, roughness: 0.9 })); sn.rotation.x = -Math.PI / 2; sn.visible = false; sn.receiveShadow = true; scene.add(sn);
      const lf = new T.Mesh(geo, new T.MeshStandardMaterial({ map: leafT, transparent: true, roughness: 1, depthWrite: false })); lf.rotation.x = -Math.PI / 2; lf.visible = false; lf.receiveShadow = true; scene.add(lf);
      return { sn, lf };
    })();
    const groundMat = ground.material, groundDry = groundMat.color.clone();

    // ---------- cast (built once, reused across scenes) ----------
    const P = ZCharacters.PRESETS, cast = {};
    function buildActor(id, c, asVariant = false) {
      if (!asVariant && baseCast[id]) { scene.remove(baseCast[id].holder); for (const k of Object.keys(variants)) if (k.startsWith(id + '|')) { scene.remove(variants[k].holder); delete variants[k]; } }
      const cfg = { ...(P[c.preset] || {}), ...c }; delete cfg.preset;
      // cast entries: { "cast": "teacher" } = a cartoon-world preset, { "toon": "cat" } = a cartoon kind, otherwise a person preset
      const tp0 = cfg.cast && ZCharacters.TOON_PRESETS ? ZCharacters.TOON_PRESETS[cfg.cast] : null;
      const tp = tp0 && (cfg.look || cfg.colors) ? { ...tp0, look: { ...(tp0.look || {}), ...(cfg.look || {}) }, colors: { ...(tp0.colors || {}), ...(cfg.colors || {}) } } : tp0;   // per-story outfit / colour changes
      const ch = cfg.creature && ZCharacters.creature ? ZCharacters.creature(cfg.creature) : cfg.human && ZCharacters.human ? ZCharacters.human({ preset: cfg.human }) : cfg.explorer && ZCharacters.explorer ? ZCharacters.explorer({ preset: cfg.explorer, outfit: cfg.outfit, outfit_colors: cfg.colors }) : tp ? ZCharacters.toon(tp) : cfg.toon ? ZCharacters.toon({ kind: cfg.toon, colors: cfg.colors }) : ZCharacters.person(cfg), holder = new T.Group();   // { explorer: 'kai', outfit: 'detective' } = a Zungga Explorer
      if (tp || cfg.toon || cfg.explorer || cfg.human || cfg.creature) cfg.height = ch.params.height; holder.add(ch.group); holder.visible = false; scene.add(holder);
      ch.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      const entry = { ch, holder, cfg, src: JSON.stringify(c) };
      if (asVariant) return entry;
      cast[id] = baseCast[id] = entry;
    }
    const baseCast = {}, variants = {};   // a scene can dress someone differently: { "look": {...} } on the scene's actor builds a variant once
    function variantFor(id, a) {
      const key = id + '|' + JSON.stringify([a.look || null, a.colors || null, a.wear || null, a.outfit || null]);
      if (!variants[key]) { const c = JSON.parse(baseCast[id].src); if (a.look) c.look = { ...(c.look || {}), ...a.look }; if (a.colors) c.colors = { ...(c.colors || {}), ...a.colors }; if (a.wear) c.wear = { ...(c.wear || {}), ...a.wear }; if (a.outfit) c.outfit = a.outfit; variants[key] = buildActor(id, c, true); }
      return variants[key];
    }
    async function preloadHumans(st) { for (const c of Object.values(st.cast || {})) if (c.human && ZCharacters.loadHuman) await ZCharacters.loadHuman(c.human); }   // realistic GLB humans load once
    await preloadHumans(story);
    for (const [id, c] of Object.entries(story.cast)) buildActor(id, c);
    await preloadImages(story);

    // ---------- per-scene state ----------
    let cur = -1, lt = 0, clock = 0, baseHemi = 1.1, flash = 0, lastCam = null;
    let sceneProps = {}, beatsDone = 0, tweens = [], coins = [];
    const grip = (who) => { const [a, hand] = who.split('.'); return hand === 'L' ? cast[a].ch.rig.armL.grip : cast[a].ch.rig.armR.grip; };
    function clearGrip(gr) { while (gr.children.length) gr.remove(gr.children[0]); }
    // props: catalog ids, or "img:<file>" = an uploaded picture shown as a little standee
    const imgCache = {};
    async function preloadImages(st) {
      const ids = new Set(); for (const sc of st.scenes) { for (const p of sc.props || []) if (String(p.id).startsWith('img:')) ids.add(p.id); for (const a of Object.values(sc.actors || {})) for (const v of Object.values(a.hold || {})) if (String(v).startsWith('img:')) ids.add(v); }
      await Promise.all([...ids].filter((id) => !imgCache[id]).map((id) => new Promise((res) => { new T.TextureLoader().load(new URL('assets/uploads/' + id.slice(4), document.baseURI).href, (t) => { t.colorSpace = T.SRGBColorSpace; imgCache[id] = t; res(); }, undefined, () => res()); })));
    }
    function buildProp(id) {
      if (String(id).startsWith('img:')) {
        const t = imgCache[id]; if (!t) throw new Error('image not loaded');
        const a = t.image.width / t.image.height, h = 0.5, g = new T.Group(), m = new T.Mesh(new T.PlaneGeometry(h * a, h), new T.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.05, side: T.DoubleSide, roughness: 0.8 }));
        m.position.y = h / 2; m.castShadow = true; g.add(m); return { group: g };
      }
      return ZAssets.build(id);
    }
    function holdItem(actor, hand, id) {
      const gr = grip(actor + '.' + hand); clearGrip(gr); if (!id) return null;
      let obj; try { obj = buildProp(id).group; } catch (err) { console.warn('Unknown prop:', id); return null; } gr.add(obj); obj.userData.itemId = id;
      if (/^note|^notes/.test(id)) { obj.rotation.set(Math.PI / 2, 0, 0); obj.position.set(0, 0.03, 0); }           // notes shown face-on in the hand
      if (id === 'pencils_10' || id === 'question_papers') obj.rotation.set(Math.PI / 2.4, 0, 0);
      return obj;
    }

    function enterScene(i) {
      cur = i; lt = 0; beatsDone = 0; tweens = [];
      for (const p of Object.values(sceneProps)) p.obj.parent && p.obj.parent.remove(p.obj);
      for (const c of coins) c.mesh.parent && c.mesh.parent.remove(c.mesh); coins = [];
      sceneProps = {};
      const sc = timeline[i].scene, place = placeOf(sc.place);
      if (place.enter) place.enter();
      scene.background = new T.Color(place.sky); scene.fog = place.factory ? new T.Fog(place.sky, place.dark ? 14 : 40, place.dark ? 55 : 160) : new T.Fog(place.sky, 18, 60);
      // lights follow the place
      sun.position.copy(place.o).add(new T.Vector3(4, 9, 6)); sun.target.position.copy(place.o);
      fill.position.copy(place.o).add(new T.Vector3(-5, 4, 4)); fill.target.position.copy(place.o);
      const soft = sc.mood === 'soft', wet = sc.weather && sc.weather.type === 'rain';
      hemi.intensity = soft ? 0.45 : wet ? 0.6 : 1.1; sun.intensity = soft ? 0.5 : wet ? 0.35 : 2.4; fill.intensity = soft ? 0.25 : wet ? 0.35 : 0.6;
      rain.pts.visible = !!wet;
      const season = sc.season || null, snowy = (sc.weather && sc.weather.type === 'snow') || season === 'winter', outdoorPl = place.outdoor || ['ground', 'shop'].includes(place.name);
      snow.pts.visible = !!snowy;
      seasonLayer.sn.visible = !!(snowy && outdoorPl); seasonLayer.lf.visible = season === 'autumn' && outdoorPl && !snowy;
      seasonLayer.sn.position.copy(place.o).setY(0.012); seasonLayer.lf.position.copy(place.o).setY(0.011);
      if (wet) { scene.background = new T.Color(0x8d97a3); scene.fog = new T.Fog(0x8d97a3, 6, 30); groundMat.color.copy(groundDry).multiplyScalar(0.62); groundMat.roughness = 0.35; }
      else { groundMat.color.copy(groundDry); groundMat.roughness = 1; }
      baseHemi = hemi.intensity;
      look = LOOKS[wet ? 'rain' : soft ? 'soft' : place.night ? 'night' : place.evening ? 'evening' : place.name || sc.place] || LOOKS.home;
      renderer.toneMappingExposure = sc.place === 'home' ? 1.18 : wet ? 0.95 : 1.05;
      windowGlow.intensity = 0;
      if (sc.place === 'home') {   // afternoon sun through the window: warm key from the window side, warm bounce, golden sky tint
        sun.color.set(0xffd6a0); sun.intensity = 2.8; sun.position.copy(place.o).add(new T.Vector3(3.5, 5.5, 4.5));
        hemi.color.set(0xffe9d2); hemi.groundColor.set(0xb98a62); baseHemi = hemi.intensity = 0.95;
        windowGlow.position.copy(place.o).add(new T.Vector3(1.7, 1.8, -1.6)); windowGlow.intensity = 6;
      } else { sun.color.set(0xfff0dc); hemi.color.set(0xeaf2ff); hemi.groundColor.set(0xb59a7a); }
      if (place.dark) {   // underground: warm torchlight and glowing crystals (the world has its own lights), no sun
        sun.intensity = 0.15; sun.color.set(0xffc58a); hemi.color.set(0xb7a3ff); hemi.groundColor.set(0x3a2a20); baseHemi = hemi.intensity = 0.45; fill.intensity = 0.3; renderer.toneMappingExposure = 1.15;
      } else if (place.night) {   // moonlight + warm lamp light from the set's lamps (emissive) — still readable for kids
        sun.color.set(0xa8bcff); sun.intensity = 0.7; hemi.color.set(0x6b7bb8); hemi.groundColor.set(0x23283d); baseHemi = hemi.intensity = 0.55; fill.intensity = 0.35; renderer.toneMappingExposure = 1.1;
        windowGlow.position.copy(place.o).add(new T.Vector3(-1.5, 3, 0.5)); windowGlow.intensity = 5;
      } else if (place.evening) {   // golden dusk with diya glow
        sun.color.set(0xffb27a); sun.intensity = 1.3; sun.position.copy(place.o).add(new T.Vector3(-6, 3, 4)); hemi.color.set(0xb79ad8); hemi.groundColor.set(0x5a3b2a); baseHemi = hemi.intensity = 0.7; renderer.toneMappingExposure = 1.1;
        windowGlow.position.copy(place.o).add(new T.Vector3(0, 1.2, 1.5)); windowGlow.intensity = 6;
      } else if (['kitchen', 'bedroom', 'library', 'party'].includes(place.name)) {   // indoor homes: warm window light like home
        sun.color.set(0xffd6a0); sun.intensity = 2.6; hemi.color.set(0xffe9d2); hemi.groundColor.set(0xb98a62); baseHemi = hemi.intensity = 0.95; renderer.toneMappingExposure = 1.15;
      }
      spot.intensity = 0;
      if (snowy) { sun.color.set(0xeaf2ff); hemi.color.set(0xeef4ff); hemi.groundColor.set(0xc9d6ea); baseHemi = hemi.intensity = 1.0; if (outdoorPl) { scene.background = new T.Color(0xdfe8f2); scene.fog = new T.Fog(0xdfe8f2, 10, 45); } look = { ...look, warm: [0.97, 1.0, 1.06], sat: 0.92 }; }
      else if (season === 'autumn') { sun.color.set(0xffc58a); look = { ...look, warm: [1.12, 0.99, 0.86], sat: 1.12 }; }
      else if (season === 'spring') { look = { ...look, warm: [1.04, 1.02, 0.96], sat: 1.15, bloom: (look.bloom || 0.4) + 0.1 }; }
      else if (season === 'summer') { sun.intensity *= 1.15; look = { ...look, warm: [1.08, 1.0, 0.9], sat: 1.12 }; }
      if (sc.light) {   // manual lighting from the studio: brightness, warmth, contrast(sat), glow, depth of field, vignette, sun
        const L = sc.light; look = { ...look };
        if (L.brightness != null) renderer.toneMappingExposure = lerp(0.55, 1.75, L.brightness);
        if (L.warmth != null) { const w = (L.warmth - 0.5) * 2; look.warm = [1 + w * 0.12, 1, 1 - w * 0.16]; }
        if (L.saturation != null) look.sat = lerp(0.4, 1.5, L.saturation);
        if (L.glow != null) look.bloom = lerp(0, 1.1, L.glow);
        if (L.dof != null) look.aperture = lerp(0, 1.2, L.dof);
        if (L.vignette != null) look.vignette = lerp(0, 0.8, L.vignette);
        if (L.sun != null) sun.intensity = lerp(0, 4.5, L.sun);
        if (L.sunAngle != null) { const a = L.sunAngle * Math.PI / 180, hgt = L.sunHeight != null ? lerp(2, 12, L.sunHeight) : 8; sun.position.copy(place.o).add(new T.Vector3(Math.sin(a) * 7, hgt, Math.cos(a) * 7)); }
        if (L.sunColor) sun.color.set(L.sunColor);
        if (L.ambient != null) { hemi.intensity = lerp(0.2, 2, L.ambient); baseHemi = hemi.intensity; }
      }
      if (place.door) place.door.rotation.y = 0;
      // actors
      for (const id of Object.keys(cast)) cast[id] = baseCast[id];
      for (const id of Object.keys(cast)) if (!story.cast[id]) { scene.remove(cast[id].holder); delete cast[id]; delete baseCast[id]; }   // removed from the cast
      for (const c of [...Object.values(cast), ...Object.values(variants)]) { c.holder.visible = false; clearGrip(c.ch.rig.armR.grip); clearGrip(c.ch.rig.armL.grip); c.ch.setTalk(null); }
      for (const [id, a] of Object.entries(sc.actors || {})) if (cast[id] && (a.look || a.colors || a.wear || a.outfit)) cast[id] = variantFor(id, a);
      for (const [id, a] of Object.entries(sc.actors || {})) {
        const c = cast[id]; if (!c) { console.warn('Actor not in cast:', id); continue; }
        c.holder.visible = true; c.holder.position.copy(place.o).add(new T.Vector3(...a.at)); c.holder.rotation.y = a.face ?? 0;
        c.ch.setSeat(a.seat == null || a.seat === false ? ((sc.place === 'ground' || sc.place === 'night_ground') && /^sit/.test(a.anim || '') ? 0.45 : null) : (a.seat === true ? (sc.place === 'classroom' ? 0.44 : 0.45) : a.seat));   // sit ON the bench / desk seat
        c.ch.play(a.anim || 'idle', { instant: true }); safeExpr(c.ch, a.expr || 'neutral', true);
        if (a.hold) for (const [hand, item] of Object.entries(a.hold)) holdItem(id, hand, item);
      }
      if (soft && sc.actors) { const id = Object.keys(sc.actors)[0], c = cast[id]; spot.intensity = 9; spot.position.copy(c.holder.position).add(new T.Vector3(1.2, 3.2, 2.2)); spot.target.position.copy(c.holder.position).add(new T.Vector3(0, 0.8, 0)); }
      // props
      for (const p of sc.props || []) {
        if (p.endCard) continue;                                              // drawn as a 2D end card instead
        let r; try { r = buildProp(p.id); } catch (err) { console.warn('Unknown prop:', p.id); continue; }
        const obj = r.group;
        if (p.attach && !cast[p.attach.split('.')[0]]) continue;
        if (p.attach) { const [a, part] = p.attach.split('.'); const parent = part === 'head' ? cast[a].ch.rig.headC : cast[a].holder; parent.add(obj); obj.position.set(...(p.at || [0, 0, 0])); }
        else { scene.add(obj); obj.position.copy(place.o).add(new T.Vector3(...p.at)); }
        if (p.rot) obj.rotation.set(...p.rot);
        if (p.scale) obj.scale.multiplyScalar(p.scale);
        obj.userData.baseScale = obj.scale.x;
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
      const box = new T.Box3(), sc = timeline[cur].scene, place = placeOf(sc.place);
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
          if ((part === 'upper' || part === 'head') && (c.cfg.cast || c.cfg.toon || c.cfg.explorer) && !c.cfg.human) {   // cartoon heads are big boxes: frame the real head
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
        const o = placeOf(sc.place).o, P0 = new T.Vector3(...s.pos).add(o), L0 = new T.Vector3(...s.look).add(o);
        const P1 = s.toPos ? new T.Vector3(...s.toPos).add(o) : P0, L1 = s.toLook ? new T.Vector3(...s.toLook).add(o) : L0, d = Math.max(0.5, end - start);
        const sp = Math.max(0.2, s.speed ?? 1), sm = s.smooth ?? 1;
        camPlan = { at: (t) => { const k0 = clamp(t * sp / d, 0, 1), k = sm * ZCamera.ease(k0) + (1 - sm) * k0; return { pos: P0.clone().lerp(P1, k), look: L0.clone().lerp(L1, k) }; } };
      } else {
        let fb = focusBox(s.focus || []);
        if (s.minSize) { const c = fb.getCenter(new T.Vector3()), sz = fb.getSize(new T.Vector3()).max(new T.Vector3(s.minSize, s.minSize, s.minSize)); fb = new T.Box3().setFromCenterAndSize(c, sz); }
        camPlan = ZCamera.plan(s.move, fb, { ...s, duration: Math.max(0.5, end - start), aspect: W / H, fov: 40 });
      }
    }

    // ---------- beats ----------
    function applyBeat(b) {
      const sc = timeline[cur].scene, place = placeOf(sc.place);
      if (b.actor && !cast[b.actor]) return;
      if (b.actor) {
        const c = cast[b.actor];
        if (b.anim) c.ch.play(b.anim); if (b.expr) safeExpr(c.ch, b.expr);
        if (b.face != null) tweens.push({ kind: 'face', c, from: c.holder.rotation.y, to: b.face, t0: lt, d: 0.4 });
        if (b.hold) for (const [hand, item] of Object.entries(b.hold)) holdItem(b.actor, hand, item);
      }
      if (b.hide && cast[b.hide.split('.')[0]]) clearGrip(grip(b.hide));
      if (b.move && (!cast[b.move.from.split('.')[0]] || !cast[b.move.to.split('.')[0]])) return;
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
      const e = timeline[cur], sc = e.scene, f = lt / e.dur, place = placeOf(sc.place);
      const beats = (sc.beats || []).slice().sort((a, b) => a.at - b.at);
      while (beatsDone < beats.length && beats[beatsDone].at * e.dur <= lt) applyBeat(beats[beatsDone++]);
      // paths (walk / run in)
      for (const [id, a] of Object.entries(sc.actors || {})) {
        if (!a.path || !cast[id]) continue;
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
        if (p.pop != null) { const k = clamp((lt - p.pop) / 0.35, 0, 1), sc2 = k < 1 ? 0.6 + 0.4 * Math.sin(k * Math.PI / 2) * (1 + 0.25 * Math.sin(k * Math.PI)) : 1; p.obj.scale.setScalar(sc2 * (p.obj.userData.baseScale || 1)); }
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
      for (const p of Object.values(sceneProps)) if (p.obj.userData.tick) p.obj.userData.tick(lt);   // idle motion: fans, flags, balloons…
      for (const tk of place.ticks || []) tk(lt);
      runTweens();
      // talking mouth from the voice
      if (sc.talking && cast[sc.talking] && envelopes[cur]) { const env = envelopes[cur], idx = Math.floor(lt * 60); cast[sc.talking].ch.setTalk(idx < env.length ? env[idx] : 0); }
      const sl = sc.fx && sc.fx.slow; const rate = sl && f >= (sl.from ?? 0) && f <= (sl.to ?? 1) ? (sl.rate ?? 0.4) : 1;   // slow motion: people move slower, the voice keeps going
      for (const [id] of Object.entries(sc.actors || {})) if (cast[id]) cast[id].ch.update(dt * rate);
      lt += dt;
    }

    // ---------- 2D overlays ----------
    const BRAND = { purple: '#4b2a8c', teal: '#13b5c6', orange: '#f8a51b', pink: '#ff4f8b', violet: '#7c5cf2', yellow: '#fcc72c', ink: '#1f1a33' };
    const logoImg = new Image(); logoImg.src = new URL('assets/brand/zungga-logo.png', document.baseURI).href;
    function pill(x, y, w, h, r, fillStyle) { g2.fillStyle = fillStyle; g2.beginPath(); g2.roundRect(x, y, w, h, r); g2.fill(); }
    function wrapLines(text, maxW) { const words = text.split(' '), lines = []; let line = ''; for (const w of words) { const t = line ? line + ' ' + w : w; if (g2.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; } if (line) lines.push(line); return lines; }
    function drawOverlays() {
      g2.save(); g2.scale(UI, UI); const W = VW, H = VH;   // layout in virtual units
      try { overlaysBody(W, H); } finally { g2.restore(); }
    }
    function particles2d(W, H, sc, f) {   // confetti / sparkles / leaves / hearts drawn over the picture, same every render
      const pf = sc.fx && sc.fx.particles; if (!pf || !pf.type || pf.type === 'none') return;
      const from = pf.from ?? 0, to = pf.to ?? 1; if (f < from || f > to) return;
      const t = lt - from * timeline[cur].dur, n = Math.round((pf.amount ?? 0.5) * 120), cols = ['#ff4f8b', '#fcc72c', '#13b5c6', '#7c5cf2', '#f8a51b', '#22c55e'];
      for (let i = 0; i < n; i++) {
        const r1 = fract(Math.sin(i * 12.9898) * 43758.5), r2 = fract(Math.sin(i * 78.233) * 12543.1), r3 = fract(Math.sin(i * 3.17) * 9871.3);
        let x = r1 * W, y, a = 1;
        if (pf.type === 'sparkles') { y = r2 * H * 0.8; a = Math.max(0, Math.sin(t * (2 + r3 * 3) + i)); g2.fillStyle = `rgba(255,240,180,${a})`; const s = 6 + r3 * 10; g2.beginPath(); for (let k = 0; k < 8; k++) { const ang = k * Math.PI / 4, rr = k % 2 ? s * 0.3 : s; g2.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr); } g2.fill(); continue; }
        const speed = pf.type === 'leaves' ? 90 : pf.type === 'hearts' ? -120 : 260;
        y = ((r2 * H + t * speed * (0.6 + r3 * 0.8)) % (H + 80) + H + 80) % (H + 80) - 40; x += Math.sin(t * (1 + r3) + i) * 40;
        g2.save(); g2.translate(x, y); g2.rotate(t * (r3 - 0.5) * 6 + i);
        if (pf.type === 'confetti') { g2.fillStyle = cols[i % cols.length]; g2.fillRect(-9, -5, 18, 10); }
        else if (pf.type === 'leaves') { g2.fillStyle = ['#e07b24', '#c2410c', '#eab308', '#65a30d'][i % 4]; g2.beginPath(); g2.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2); g2.fill(); }
        else if (pf.type === 'hearts') { g2.fillStyle = cols[i % 2 ? 0 : 3]; g2.font = '40px sans-serif'; g2.fillText('♥', -12, 12); }
        g2.restore();
      }
    }
    const fract = (v) => v - Math.floor(v);
    function overlaysBody(W, H) {
      // everything sits in a stack at the TOP, kept small, so the story below stays visible
      const e = timeline[cur], sc = e.scene, f = lt / e.dur;
      particles2d(W, H, sc, f);
      const tr = sc.fx && sc.fx.transition;   // scene opens with a fade from black / white / a quick zoom-blur flash
      if (tr && tr !== 'cut' && cur > 0 && lt < 0.45) { const k = 1 - lt / 0.45; g2.fillStyle = tr === 'white' ? `rgba(255,255,255,${k})` : tr === 'flash' ? `rgba(255,250,235,${k * k})` : `rgba(0,0,0,${k})`; g2.fillRect(0, 0, W, H); }
      const trOut = sc.fx && sc.fx.transitionOut;
      if (trOut && trOut !== 'cut' && e.dur - lt < 0.4 && cur < timeline.length - 1) { const k = 1 - (e.dur - lt) / 0.4; g2.fillStyle = trOut === 'white' ? `rgba(255,255,255,${k})` : `rgba(0,0,0,${k})`; g2.fillRect(0, 0, W, H); }
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
      drawCards(W, H, sc, e, f, y);
      drawPause(W, H, sc, e);
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
      if (chunk && optv('subtitles') !== false) {
        g2.font = '600 44px Fredoka'; const lines = wrapLines(chunk.text, W - 220), lh = 56, bh = lines.length * lh + 36, y0 = H - 250 - bh;
        pill(80, y0, W - 160, bh, 28, 'rgba(31,26,51,0.75)');
        drawSpeaker(W, H, sc, e, y0 - 76);
        g2.fillStyle = '#fff'; g2.textAlign = 'center'; g2.textBaseline = 'middle'; lines.forEach((l, i) => g2.fillText(l, W / 2, y0 + 18 + lh / 2 + i * lh));
      }
      // end card (logo) on the last scene
      const endP = (sc.props || []).find((p) => p.endCard);
      if (endP && f >= endP.show && optv('endCard') !== false) {
        const k = clamp((f - endP.show) * e.dur / 0.6, 0, 1);
        g2.fillStyle = `rgba(255,255,255,${0.96 * k})`; g2.fillRect(0, 0, W, H);
        if (logoImg.complete && logoImg.naturalWidth) { const lw = 760 * (0.9 + 0.1 * k), lh2 = lw * logoImg.naturalHeight / logoImg.naturalWidth; g2.globalAlpha = k; g2.drawImage(logoImg, W / 2 - lw / 2, H * 0.42 - lh2 / 2, lw, lh2); g2.globalAlpha = 1; }
      }
    }
    // ---------- pitch overlays: info cards, the kid-answer pause, the speaker's name ----------
    const pop = (k) => { k = clamp(k, 0, 1); return k < 1 ? 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2) : 1; };   // ease-out-back 0→1
    function tile(x, y, w, h, fillTop, fillBot, r = 34) { const gr = g2.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, fillTop); gr.addColorStop(1, fillBot || fillTop); g2.save(); g2.shadowColor = 'rgba(30,15,60,0.28)'; g2.shadowBlur = 24; g2.shadowOffsetY = 8; pill(x, y, w, h, r, gr); g2.restore(); }
    function txt(t, x, y, size, color, weight = 700, align = 'center') { g2.font = `${weight} ${size}px Fredoka`; g2.fillStyle = color; g2.textAlign = align; g2.textBaseline = 'middle'; g2.fillText(t, x, y); }
    function fitTxt(t, x, y, size, maxW, color, weight = 700) { let s2 = size; g2.font = `${weight} ${s2}px Fredoka`; while (g2.measureText(t).width > maxW && s2 > 16) { s2 -= 2; g2.font = `${weight} ${s2}px Fredoka`; } txt(t, x, y, s2, color, weight); }
    function scaleAt(cx, cy, k, fn) { g2.save(); g2.translate(cx, cy); g2.scale(k, k); g2.translate(-cx, -cy); fn(); g2.restore(); }
    function drawCards(W, H, sc, e, f, yTop) {
      for (const cd of sc.cards || []) {
        const at = cd.at ?? 0, until = cd.until ?? 1; if (f < at || f > until) continue;
        const tIn = (f - at) * e.dur, tOut = (until - f) * e.dur, fade = clamp(tOut / 0.3, 0, 1), y0 = cd.y ?? Math.max(yTop, 300);
        g2.save(); g2.globalAlpha = fade;
        const items = cd.items || [], itemK = (it, i) => it.at != null ? clamp(((f - it.at) * e.dur) / 0.45, 0, 1) : clamp((tIn - i * (cd.step ?? 0.35)) / 0.45, 0, 1);
        if (cd.title) { const k = pop(tIn / 0.4); scaleAt(W / 2, y0 + 36, k, () => { g2.font = '700 40px Fredoka'; const tw = g2.measureText(cd.title).width + 80; pill(W / 2 - tw / 2, y0, tw, 72, 36, cd.titleColor || BRAND.purple); txt(cd.title, W / 2, y0 + 37, 40, '#fff'); }); }
        const yI = y0 + (cd.title ? 100 : 0);
        if (cd.style === 'row') {   // 2–4 tiles side by side: big icon, big value, small label
          const n = items.length, gap = 26, tw = Math.min(300, (W - 120 - gap * (n - 1)) / n), th = cd.h || 300, x0 = W / 2 - (n * tw + (n - 1) * gap) / 2;
          items.forEach((it, i) => { const k = itemK(it, i); if (k <= 0) return; const x = x0 + i * (tw + gap), cx = x + tw / 2;
            scaleAt(cx, yI + th / 2, pop(k), () => { tile(x, yI, tw, th, '#ffffff', it.tint || '#fff7d6'); txt(it.icon || '', cx, yI + th * 0.3, th * 0.27, '#000', 400); fitTxt(it.value || '', cx, yI + th * 0.63, 64, tw - 30, it.color || BRAND.purple, 800); fitTxt(it.label || '', cx, yI + th * 0.84, 34, tw - 26, BRAND.ink, 600); }); });
        } else if (cd.style === 'equation') {   // a sum written big: parts appear one by one, the answer last
          const parts = items, k0 = pop(tIn / 0.4); g2.font = '800 78px Fredoka'; const widths = parts.map((it) => g2.measureText(it.text).width), tot = widths.reduce((a2, b2) => a2 + b2, 0) + 24 * (parts.length - 1), bw = Math.min(W - 80, tot + 90), bh = cd.sub ? 210 : 160;
          scaleAt(W / 2, yI + bh / 2, k0, () => { tile(W / 2 - bw / 2, yI, bw, bh, '#ffffff', '#f5f0ff'); let x = W / 2 - tot / 2; const sc2 = Math.min(1, (W - 140) / tot);
            g2.save(); g2.translate(W / 2, 0); g2.scale(sc2, 1); g2.translate(-W / 2, 0);
            parts.forEach((it, i) => { const k = itemK(it, i); if (k > 0) { g2.save(); g2.globalAlpha *= clamp(k * 1.5, 0, 1); txt(it.text, x + widths[i] / 2, yI + 82 - (1 - pop(k)) * 20, 78, it.color || (it.answer ? BRAND.pink : BRAND.ink), 800); g2.restore(); } x += widths[i] + 24; });
            g2.restore(); if (cd.sub) fitTxt(cd.sub, W / 2, yI + 160, 40, bw - 60, cd.subColor || BRAND.purple, 700); });
        } else if (cd.style === 'missions') {   // the real-world mission: choose one of three, a grown-up approves
          const th = 196, gap = 22;
          items.forEach((it, i) => { const k = itemK(it, i); if (k <= 0) return; const y = yI + i * (th + gap), x = 70, w = W - 140;
            scaleAt(W / 2, y + th / 2, pop(k), () => { tile(x, y, w, th, it.top || '#ffffff', it.bot || '#fef3c7'); g2.beginPath(); g2.arc(x + 88, y + th / 2, 56, 0, Math.PI * 2); g2.fillStyle = it.color || BRAND.violet; g2.fill(); txt(String(i + 1), x + 88, y + th / 2 + 2, 62, '#fff', 800);
              txt(it.icon || '', x + 205, y + th / 2, 86, '#000', 400); g2.font = '700 40px Fredoka'; const lines = wrapLines(it.text, w - 330); lines.slice(0, 3).forEach((l, j) => txt(l, x + 265, y + th / 2 + (j - (Math.min(3, lines.length) - 1) / 2) * 48, 40, BRAND.ink, 700, 'left')); }); });
          if (cd.footer) { const k = clamp((tIn - items.length * (cd.step ?? 0.35) - 0.2) / 0.4, 0, 1); if (k > 0) { const y = yI + items.length * (th + gap) + 6; scaleAt(W / 2, y + 40, pop(k), () => { g2.font = '700 38px Fredoka'; const tw = g2.measureText(cd.footer).width + 70; pill(W / 2 - tw / 2, y, tw, 80, 40, '#16a34a'); txt(cd.footer, W / 2, y + 41, 38, '#fff'); }); } }
        } else if (cd.style === 'lesson' || cd.style === 'note') {   // a key idea on a bright card
          const k = pop(tIn / 0.45); g2.font = `700 ${cd.size || 52}px Fredoka`; const lines = wrapLines(cd.text || '', W - 260), lh = (cd.size || 52) * 1.22, bh = lines.length * lh + 80;
          scaleAt(W / 2, yI + bh / 2, k, () => { tile(110, yI, W - 220, bh, cd.top || '#fff7d6', cd.bot || '#fde68a'); lines.forEach((l, i) => txt(l, W / 2, yI + 40 + lh / 2 + i * lh, cd.size || 52, cd.color || BRAND.purple, 800)); });
        } else if (cd.style === 'badges') {   // round medals
          const n = items.length, R = 130, gap = 60, x0 = W / 2 - (n * 2 * R + (n - 1) * gap) / 2 + R;
          items.forEach((it, i) => { const k = itemK(it, i); if (k <= 0) return; const cx = x0 + i * (2 * R + gap), cy = yI + R + 10, wob = Math.sin((tIn - i * 0.35) * 5) * 0.06 * clamp(1 - tIn / 2, 0, 1);
            g2.save(); g2.translate(cx, cy); g2.rotate(wob); g2.scale(pop(k), pop(k)); g2.translate(-cx, -cy);
            for (let r2 = 0; r2 < 16; r2++) { const a2 = r2 / 16 * Math.PI * 2 + tIn * 0.4; g2.fillStyle = 'rgba(252,199,44,0.35)'; g2.beginPath(); g2.moveTo(cx, cy); g2.arc(cx, cy, R * 1.35, a2, a2 + 0.12); g2.fill(); }
            const gr = g2.createRadialGradient(cx - 30, cy - 40, 10, cx, cy, R); gr.addColorStop(0, '#fff1a8'); gr.addColorStop(1, it.color || '#f8a51b'); g2.fillStyle = gr; g2.beginPath(); g2.arc(cx, cy, R, 0, Math.PI * 2); g2.fill(); g2.lineWidth = 12; g2.strokeStyle = '#fff'; g2.stroke();
            txt(it.icon || '⭐', cx, cy - 22, 92, '#000', 400); fitTxt(it.text || '', cx, cy + 66, 34, R * 1.6, '#4b2a8c', 800); g2.restore(); });
        }
        g2.restore();
      }
    }
    // the pause: the episode stops and asks the kid; a countdown ring ticks while they answer out loud
    function drawPause(W, H, sc, e) {
      const P = sc.pause; if (!P) return false; const n = P.seconds || 8, t = lt - e.voice - 0.25; if (t < -0.2 || t > n + 0.2) return false;
      const k = clamp((t + 0.2) / 0.4, 0, 1), out = clamp((n + 0.2 - t) / 0.3, 0, 1), a = Math.min(k, out), left = Math.max(0, Math.ceil(n - t));
      g2.save(); g2.globalAlpha = a;
      const vg = g2.createLinearGradient(0, 0, 0, H); vg.addColorStop(0, 'rgba(30,10,60,0.55)'); vg.addColorStop(0.3, 'rgba(30,10,60,0.05)'); vg.addColorStop(0.62, 'rgba(30,10,60,0.0)'); vg.addColorStop(1, 'rgba(30,10,60,0.6)'); g2.fillStyle = vg; g2.fillRect(0, 0, W, H);
      const KIND = { look: ['👀', 'LOOK!', '#13b5c6'], choose: ['✋', 'CHOOSE!', '#ff4f8b'], count: ['🔢', 'COUNT!', '#f8a51b'], think: ['💭', 'THINK!', '#7c5cf2'] }[P.kind || 'think'];
      // banner + prompt
      scaleAt(W / 2, 120, pop(k), () => { pill(W / 2 - 300, 70, 600, 104, 52, '#ffffff'); txt('⏸', W / 2 - 230, 124, 52, KIND[2], 700); txt('PAUSE & ' + KIND[1], W / 2 + 30, 124, 52, BRAND.purple, 800); });
      g2.font = '800 56px Fredoka'; const lines = wrapLines(P.prompt || '', W - 160); lines.forEach((l, i) => { g2.save(); g2.shadowColor = 'rgba(0,0,0,0.5)'; g2.shadowBlur = 14; txt(l, W / 2, 240 + i * 68, 56, '#fff', 800); g2.restore(); });
      // countdown ring
      const cy = 240 + lines.length * 68 + 120, R = 96, frac = clamp(t / n, 0, 1);
      g2.beginPath(); g2.arc(W / 2, cy, R, 0, Math.PI * 2); g2.fillStyle = 'rgba(255,255,255,0.95)'; g2.fill();
      g2.lineWidth = 18; g2.strokeStyle = '#ede9fe'; g2.beginPath(); g2.arc(W / 2, cy, R - 14, 0, Math.PI * 2); g2.stroke();
      g2.strokeStyle = KIND[2]; g2.lineCap = 'round'; g2.beginPath(); g2.arc(W / 2, cy, R - 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - frac)); g2.stroke();
      const beat = 1 + 0.08 * Math.max(0, Math.cos((t % 1) * Math.PI * 2)); scaleAt(W / 2, cy, beat, () => txt(String(left), W / 2, cy + 4, 92, BRAND.purple, 800));
      txt(KIND[0], W / 2 + R + 50, cy, 70, '#000', 400);
      // choose: three picture cards · count: the items to count, one per beat
      if (P.kind === 'choose' && P.cards) {
        const tw = (W - 120 - 2 * 24) / 3, th = 380, y = H - th - 170;
        P.cards.forEach((c2, i) => { const kk = pop(clamp((t - i * 0.25) / 0.4, 0, 1)); const x = 60 + i * (tw + 24), cx = x + tw / 2;
          scaleAt(cx, y + th / 2, kk, () => { tile(x, y, tw, th, '#ffffff', c2.tint || '#f5f0ff'); g2.beginPath(); g2.arc(cx, y + 62, 46, 0, Math.PI * 2); g2.fillStyle = c2.color || BRAND.violet; g2.fill(); txt(String(i + 1), cx, y + 64, 56, '#fff', 800);
            txt(c2.icon || '', cx, y + 175, 104, '#000', 400); g2.font = '700 36px Fredoka'; wrapLines(c2.text, tw - 30).slice(0, 3).forEach((l, j) => txt(l, cx, y + 272 + j * 42, 36, BRAND.ink, 700)); }); });
        txt('Show me with your fingers! ☝️ ✌️ 🤟', W / 2, H - 120, 42, '#fff', 800);
      }
      if (P.kind === 'count' && P.count) {
        const C = P.count, N = C.n, per = Math.min(130, (W - 100) / N), x0 = W / 2 - per * N / 2 + per / 2, y = H - 470;
        for (let i = 0; i < N; i++) { const kk = pop(clamp((t - 0.3 - i * (n - 1.5) / N) / 0.35, 0, 1)); if (kk <= 0) continue; const cx = x0 + i * per;
          scaleAt(cx, y, kk, () => { txt(C.icon || '🥤', cx, y, per * 0.78, '#000', 400); pill(cx - per * 0.42, y + per * 0.48, per * 0.84, 56, 28, '#fff'); fitTxt(C.tag || '₹10', cx, y + per * 0.48 + 29, 34, per * 0.78, '#16a34a', 800); }); }
        txt(C.question || 'How much money?', W / 2, H - 260, 50, '#fff', 800); txt('? ? ?', W / 2, H - 190, 60, '#fcc72c', 800);
      }
      if (P.kind === 'look') { const bob = Math.sin(t * 5) * 14; txt(P.hint || '👀 Look carefully at the picture!', W / 2, H - 230 + bob, 48, '#fff', 800); }
      g2.restore(); return true;
    }
    function drawSpeaker(W, H, sc, e, y) {   // the speaker's name on a coloured tag just above the subtitles
      const who = sc.talking && story.cast[sc.talking], name = sc.speaker || (who && who.name) || (sc.narrator ? 'Narrator' : null); if (!name || optv('subtitles') === false || lt > e.voice + 0.3) return;
      const col = (who && who.color) || (sc.narrator ? '#4b2a8c' : BRAND.violet), k = pop(clamp(lt / 0.35, 0, 1));
      g2.font = '800 38px Fredoka'; const tw = g2.measureText(name).width + 60;
      scaleAt(110 + tw / 2, y + 30, k, () => { pill(110, y, tw, 64, 32, col); txt(name, 110 + tw / 2, y + 33, 38, '#fff', 800); });
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
    let freeCam = null;   // editor: { pos: Vector3, look: Vector3 } overrides the planned shot
    let hiBox = null;     // editor: outline of the selected actor / prop
    function draw() {
      planCamera(lt);
      const p = freeCam || camPlan.at(lt - camSegStart);
      if (!freeCam) { const rm = placeOf(timeline[cur].scene.place).room; if (rm) p.pos = new T.Vector3(Math.min(rm.x1, Math.max(rm.x0, p.pos.x)), Math.min(rm.y1, Math.max(rm.y0, p.pos.y)), Math.min(rm.z1, Math.max(rm.z0, p.pos.z))); }   // factory rooms: stay inside the walls
      camera.position.copy(p.pos); camera.lookAt(p.look); lastCam = { pos: p.pos.clone(), look: p.look.clone() };
      const fx = timeline[cur].scene.fx;
      if (fx && fx.shake && !freeCam) {   // camera shake (same every render: noise from the clock)
        const sh = fx.shake, k = typeof sh === 'object' ? sh.amount ?? 0.5 : sh, on = typeof sh !== 'object' || (lt / timeline[cur].dur >= (sh.from ?? 0) && lt / timeline[cur].dur <= (sh.to ?? 1));
        if (on && k > 0) { const n = (a) => Math.sin(clock * 37 * a) * 0.6 + Math.sin(clock * 61 * a + 1.3) * 0.4; camera.rotateX(n(1) * 0.012 * k); camera.rotateY(n(1.7) * 0.012 * k); camera.rotateZ(n(0.6) * 0.008 * k); }
      }
      if (hiBox) { hiBox.box.setFromObject(hiBox.obj); hiBox.helper.visible = true; }
      const sc = timeline[cur].scene, e = timeline[cur];
      flash = 0;
      if (sc.weather && sc.weather.thunder) for (const th of sc.weather.thunder) { const at = (typeof th === 'object' ? th.at : th) * e.dur, d = lt - at; if (d >= 0 && d < 0.6) flash = Math.max(flash, Math.exp(-d * 7) * (d < 0.08 ? 1 : 0.8 + 0.2 * Math.sin(d * 60))); }
      hemi.intensity = baseHemi + flash * 2.2;
      rain.m.uniforms.uTime.value = clock; rain.m.uniforms.uCam.value.copy(camera.position);
      snow.m.uniforms.uTime.value = clock; snow.m.uniforms.uCam.value.copy(camera.position);
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

    const ray = new T.Raycaster();
    const api = {
      get story() { return story; }, get timeline() { return timeline; }, get total() { return total; }, get cues() { return cues; },
      canvas: out, voiceDir: opts.voiceDir || 'voice', fps: FPS, width: W, height: H, audioContext: actx, options: OPT, places, PLACES,
      get time() { return clock; }, get sceneIndex() { return cur; }, get sceneTime() { return lt; },
      audioFor: (i) => buffers[i], envelopeFor: (i) => envelopes[i],
      sfxBuffer: (f) => sfxBuffers[f], sfxDir: 'studio/assets/sfx/', scene, camera,
      // ---- editing (studio) ----
      async update(next, keepTime = true) {   // apply an edited story: rebuild only characters whose look changed, re-time everything
        story = JSON.parse(JSON.stringify(next)); await preloadHumans(story);
        for (const [id, c] of Object.entries(story.cast)) if (!cast[id] || cast[id].src !== JSON.stringify(c)) buildActor(id, c);
        for (const sc of story.scenes) ensurePlace(sc.place);
        await loadClips(story.scenes); await preloadImages(story); prepare(); await loadSfx();
        const t = keepTime ? Math.min(clock, total - 0.01) : 0; cur = -1; return api.seek(Math.max(0, t));
      },
      async reloadVoice(dir) { if (dir) { vdir = dir.replace(/\/?$/, '/'); api.voiceDir = dir; } for (const k of Object.keys(clipById)) delete clipById[k]; try { durations = await (await fetch(storyDir + vdir + 'durations.json', { cache: 'no-store' })).json(); } catch (e) { durations = {}; } try { wordsMap = await (await fetch(storyDir + vdir + 'words.json', { cache: 'no-store' })).json(); } catch (e) { wordsMap = {}; } return api.update(story); },
      setFreeCamera(pos, look) { freeCam = pos ? { pos: pos.clone(), look: look.clone() } : null; draw(); },
      get freeCamera() { return freeCam; },
      cameraNow() { return lastCam && { pos: lastCam.pos.clone(), look: lastCam.look.clone() }; },
      placeOrigin(i = cur) { return placeOf(timeline[i].scene.place).o.clone(); },
      sceneStart: (i) => timeline[i].start,
      redraw() { draw(); },
      highlight(id) {   // outline an actor / prop in the preview (editor only; never on during renders)
        if (hiBox) { scene.remove(hiBox.helper); hiBox = null; }
        const obj = id && (cast[id] ? cast[id].holder : sceneProps[id] ? sceneProps[id].obj : null); if (!obj) return draw();
        const box = new T.Box3().setFromObject(obj), helper = new T.Box3Helper(box, 0xff4f8b); helper.material.depthTest = false; helper.renderOrder = 99; scene.add(helper); hiBox = { box, helper, obj }; draw();
      },
      castIds: () => Object.keys(baseCast),
      // click in the preview → which actor / prop is under the pointer (ndc −1…1)
      pick(nx, ny) {
        ray.setFromCamera(new T.Vector2(nx, ny), camera); const sc = timeline[cur].scene, objs = [];
        for (const id of Object.keys(sc.actors || {})) objs.push([id, 'actor', cast[id].holder]);
        for (const [id, p] of Object.entries(sceneProps)) if (p.obj.visible) objs.push([id, 'prop', p.obj]);
        let best = null; for (const [id, kind, o] of objs) { const hit = ray.intersectObject(o, true)[0]; if (hit && (!best || hit.distance < best.d)) best = { id, kind, d: hit.distance }; }
        return best;
      },
      // a point on the floor under the pointer, relative to the current place (for dragging things around)
      floorPoint(nx, ny, y = 0) { ray.setFromCamera(new T.Vector2(nx, ny), camera); const p = new T.Vector3(); if (!ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -y), p)) return null; return p.sub(placeOf(timeline[cur].scene.place).o); },
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
