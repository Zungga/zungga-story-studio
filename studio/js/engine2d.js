/*
 * Zungga Story Studio — 2D story engine (vector puppets + layered painted-in-code backgrounds).
 * Same interface as ZStory (story-engine.js), so studio/player.html and tools/render_video.mjs work unchanged:
 *   const eng = await Z2D.create({ storyDir, voiceDir });  eng.step(dt) · eng.seek(t) · eng.canvas · eng.timeline · eng.cues …
 * Story files set "engine": "2d". Positions are world pixels (ground line y = 1560); the camera pans/zooms with parallax layers.
 */
(() => {
  'use strict';
  const W = 1080, H = 1920, FPS = 30, DT = 1 / FPS, GROUND = 1560, WORLD_W = 1600;
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const { paint, shade, rrect, ell } = Z2D;
  const P = () => new Path2D();
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  // ================= props (drawn centred on x,y; size = width in world px) =================
  const PROPS = {
    note_100: { w: 150, draw: (g) => note(g, 150, '#c4b5fd', '#7c3aed', '₹100') },
    note_50: { w: 140, draw: (g) => note(g, 140, '#a5f3fc', '#0891b2', '₹50') },
    notes_30: { w: 150, draw: (g) => { g.save(); g.rotate(-0.12); note(g, 140, '#fdba74', '#c2410c', '₹20'); g.restore(); g.save(); g.translate(10, 12); g.rotate(0.1); note(g, 135, '#d6b98c', '#8a5a33', '₹10'); g.restore(); } },
    chips: { w: 120, draw: (g) => { const b = P(); b.moveTo(-55, -80); b.lineTo(55, -80); b.quadraticCurveTo(62, 0, 52, 80); b.lineTo(-52, 80); b.quadraticCurveTo(-62, 0, -55, -80); paint(g, b, '#f97316', [-60, -80, 60, 80]);
      g.fillStyle = '#fde047'; g.fillRect(-55, -84, 110, 10); g.fillRect(-55, 74, 110, 10); g.fillStyle = '#ffffff'; g.font = '800 26px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('CRUNCHY', 0, -26);
      g.font = '600 15px Fredoka, sans-serif'; g.fillText('Masala Chips', 0, -4); g.fillStyle = '#fde68a'; g.beginPath(); g.ellipse(0, 36, 34, 24, 0, 0, 7); g.fill(); g.fillStyle = '#f59e0b'; for (const [x, y] of [[-12, 30], [8, 38], [14, 26]]) { g.beginPath(); g.ellipse(x, y, 9, 6, 0.4, 0, 7); g.fill(); } } },
    juice: { w: 90, draw: (g) => { paint(g, rrect(-40, -70, 80, 140, 8), '#facc15', [-40, -70, 40, 70]); g.strokeStyle = '#ec4899'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(18, -70); g.lineTo(30, -120); g.stroke();
      g.fillStyle = '#1f2937'; g.font = '800 20px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('MANGO', 0, -30); g.fillStyle = '#f97316'; g.beginPath(); g.arc(0, 12, 22, 0, 7); g.fill(); g.fillStyle = '#16a34a'; g.beginPath(); g.ellipse(12, -10, 10, 5, -0.6, 0, 7); g.fill(); g.fillStyle = '#1f2937'; g.font = '700 14px Fredoka, sans-serif'; g.fillText('JUICE', 0, 56); } },
    football: { w: 150, draw: (g) => { const gr = g.createRadialGradient(-25, -25, 10, 0, 0, 75); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#cbd5e1'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 72, 0, 7); g.fill();
      g.fillStyle = '#1f2937'; const pent = (x, y, r, rot) => { g.beginPath(); for (let i = 0; i < 5; i++) { const a = rot + i / 5 * Math.PI * 2; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); };
      pent(0, 0, 20, -Math.PI / 2); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; pent(Math.cos(a) * 55, Math.sin(a) * 55, 15, a); } g.strokeStyle = '#94a3b8'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 72, 0, 7); g.stroke();
      g.save(); g.translate(62, -60); g.rotate(0.3); paint(g, rrect(0, -18, 78, 36, 8), '#fcd34d', [0, -18, 78, 18]); g.fillStyle = '#1f2937'; g.font = '800 22px Fredoka, sans-serif'; g.textAlign = 'left'; g.fillText('₹150', 12, 8); g.restore(); } },
    coin_5: { w: 40, draw: (g) => { const gr = g.createRadialGradient(-6, -6, 2, 0, 0, 20); gr.addColorStop(0, '#fde68a'); gr.addColorStop(1, '#d4a017'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.fill(); g.fillStyle = '#854d0e'; g.font = '800 14px Fredoka'; g.textAlign = 'center'; g.fillText('₹5', 0, 5); } },
  };
  function note(g, w, c, d, label) { const h = w * 0.48; paint(g, rrect(-w / 2, -h / 2, w, h, 6), c, [-w / 2, -h / 2, w / 2, h / 2]); g.strokeStyle = d; g.lineWidth = 3; g.strokeRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);
    g.fillStyle = d; g.font = `800 ${Math.round(w * 0.2)}px Fredoka, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, -w * 0.1, 2); g.beginPath(); g.arc(w * 0.3, 0, h * 0.24, 0, 7); g.globalAlpha = 0.35; g.fill(); g.globalAlpha = 1; g.textBaseline = 'alphabetic'; }

  // ================= places: layered backgrounds (parallax factor per layer) =================
  const PLACES = {
    home: {
      back(g, st) {
        let gr = g.createLinearGradient(0, 300, 0, 1250); gr.addColorStop(0, '#ffe2c4'); gr.addColorStop(1, '#f7c99e'); g.fillStyle = gr; g.fillRect(-400, -200, 2400, 1460);
        // window with glowing sky + sheer curtains
        g.fillStyle = '#ffffff'; g.fillRect(1120, 480, 340, 520); gr = g.createLinearGradient(0, 500, 0, 980); gr.addColorStop(0, '#fff6dd'); gr.addColorStop(1, '#ffd79a'); g.fillStyle = gr; g.fillRect(1140, 500, 300, 480);
        g.fillStyle = '#ffffff'; g.fillRect(1284, 500, 12, 480); g.fillRect(1140, 730, 300, 12);
        for (const [x0, dir] of [[1070, 1], [1440, -1]]) { const c = P(); c.moveTo(x0, 440); for (let i = 0; i <= 8; i++) c.lineTo(x0 + dir * (i % 2 ? 90 : 70), 440 + i * 100); c.lineTo(x0, 1240); c.closePath(); g.fillStyle = 'rgba(255,250,240,0.85)'; g.fill(c); }
        g.fillStyle = '#9a6b42'; g.fillRect(1040, 425, 450, 16);
        // picture frame + clock + door
        paint(g, rrect(640, 560, 190, 230, 6), '#b8865a', [640, 560, 830, 790]); g.fillStyle = '#f6efe4'; g.fillRect(656, 576, 158, 198);
        for (const [x, w, h, c] of [[700, 120, 120, '#8aa0b8'], [770, 110, 95, '#e7a07c'], [735, 80, 60, '#9db7a9']]) { g.fillStyle = c; g.beginPath(); g.moveTo(x - w / 2, 750); g.lineTo(x, 750 - h); g.lineTo(x + w / 2, 750); g.fill(); }
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(470, 560, 56, 0, 7); g.fill(); g.strokeStyle = '#3b2416'; g.lineWidth = 6; g.stroke(); g.lineWidth = 7; g.beginPath(); g.moveTo(470, 560); g.lineTo(470, 520); g.moveTo(470, 560); g.lineTo(500, 560); g.stroke();
        paint(g, rrect(110, 640, 270, 600, 8), '#9a6b42', [110, 640, 380, 1240]); g.fillStyle = '#d4a017'; g.beginPath(); g.arc(345, 960, 12, 0, 7); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 4; g.strokeRect(140, 680, 210, 230); g.strokeRect(140, 950, 210, 250);
        // skirting + wooden floor
        g.fillStyle = '#e9b98c'; g.fillRect(-400, 1238, 2400, 22);
        gr = g.createLinearGradient(0, 1260, 0, 2300); gr.addColorStop(0, '#c08a5a'); gr.addColorStop(1, '#a87348'); g.fillStyle = gr; g.fillRect(-400, 1260, 2400, 1200);
        g.strokeStyle = 'rgba(80,45,20,0.25)'; g.lineWidth = 3; for (let y = 1300; y < 2400; y += 70) { g.beginPath(); g.moveTo(-400, y); g.lineTo(2000, y); g.stroke(); }
        // sofa + plant
        paint(g, rrect(540, 960, 600, 200, 40), '#7c3aed', [540, 960, 1140, 1160]); paint(g, rrect(510, 1060, 660, 190, 40), '#8b46f0', [510, 1060, 1170, 1250]);
        paint(g, rrect(600, 1000, 170, 130, 30), '#fcd34d', [600, 1000, 770, 1130]); paint(g, rrect(910, 1000, 170, 130, 30), '#f5efe6', [910, 1000, 1080, 1130]);
        paint(g, rrect(1480, 1100, 120, 140, 18), '#ffffff', [1480, 1100, 1600, 1240]); leaves(g, 1540, 1100, 1.1);
        // rug
        g.fillStyle = '#14b8a6'; g.beginPath(); g.ellipse(820, 1600, 620, 150, 0, 0, 7); g.fill(); g.strokeStyle = '#facc15'; g.lineWidth = 14; g.beginPath(); g.ellipse(820, 1600, 540, 120, 0, 0, 7); g.stroke();
      },
      light(g, st) {   // warm sun shafts from the window + a golden glow
        g.save(); g.globalCompositeOperation = 'screen';
        for (let i = 0; i < 3; i++) { const s = P(); s.moveTo(1150 + i * 90, 520); s.lineTo(1260 + i * 90, 520); s.lineTo(820 + i * 160, 1700); s.lineTo(600 + i * 160, 1700); s.closePath(); g.fillStyle = `rgba(255,214,150,${0.16 - i * 0.03})`; g.fill(s); }
        const rg = g.createRadialGradient(1290, 740, 30, 1290, 740, 900); rg.addColorStop(0, 'rgba(255,220,160,0.55)'); rg.addColorStop(1, 'rgba(255,220,160,0)'); g.fillStyle = rg; g.fillRect(-400, -200, 2400, 2600); g.restore();
      },
      front(g) { g.save(); g.filter = 'blur(10px)'; leaves(g, 1420, 2050, 2.2); g.restore(); },
      look: { warm: 'rgba(255,170,90,0.10)', vignette: 0.35 },
    },
    shop: {
      back(g) {
        let gr = g.createLinearGradient(0, 0, 0, 500); gr.addColorStop(0, '#7cc4ff'); gr.addColorStop(1, '#cfe8ff'); g.fillStyle = gr; g.fillRect(-400, -200, 2400, 700);
        g.fillStyle = '#ffd8a8'; g.fillRect(-400, 380, 2400, 1040);
        for (let x = -400; x < 2000; x += 160) { g.fillStyle = 'rgba(0,0,0,0.04)'; g.fillRect(x, 380, 6, 1040); }
        // shop interior: shelves with books
        g.fillStyle = '#6b3f1f'; g.fillRect(430, 660, 840, 520);
        const cols = ['#2563eb', '#ec4899', '#facc15', '#22c55e', '#7c3aed', '#f97316'];
        for (let r = 0; r < 3; r++) { g.fillStyle = '#4a2a14'; g.fillRect(430, 800 + r * 150, 840, 14); for (let i = 0; i < 16; i++) { const h = 90 + ((i * 7 + r * 3) % 5) * 10; g.fillStyle = cols[(i + r) % 6]; g.fillRect(450 + i * 51, 800 + r * 150 - h, 40, h); } }
        // awning + sign
        for (let i = 0; i < 9; i++) { const a = P(); a.moveTo(400 + i * 100, 540); a.lineTo(500 + i * 100, 540); a.lineTo(500 + i * 100, 650); a.quadraticCurveTo(450 + i * 100, 690, 400 + i * 100, 650); a.closePath(); g.fillStyle = i % 2 ? '#ffffff' : '#f97316'; g.fill(a); }
        gr = g.createLinearGradient(400, 0, 1300, 0); gr.addColorStop(0, '#7c3aed'); gr.addColorStop(1, '#ec4899'); g.fillStyle = gr; g.beginPath(); g.roundRect(440, 400, 820, 120, 20); g.fill();
        g.fillStyle = '#ffffff'; g.font = '800 72px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('STATIONERY', 850, 485);
        // pavement
        gr = g.createLinearGradient(0, 1400, 0, 2300); gr.addColorStop(0, '#d6d3d1'); gr.addColorStop(1, '#bdb8b3'); g.fillStyle = gr; g.fillRect(-400, 1400, 2400, 1100);
        g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = 3; for (let x = -400; x < 2000; x += 200) { g.beginPath(); g.moveTo(x, 1400); g.lineTo(x - 120, 2400); g.stroke(); }
        for (const x of [260, 1440]) { paint(g, rrect(x - 60, 1300, 120, 120, 16), '#b45309', [x - 60, 1300, x + 60, 1420]); leaves(g, x, 1300, 1.2); }
      },
      counter(g) {   // drawn in front of the shopkeeper
        paint(g, rrect(460, 1080, 780, 330, 14), '#c08a52', [460, 1080, 1240, 1410]); g.fillStyle = '#8a5a33'; g.fillRect(450, 1064, 800, 26);
        g.fillStyle = '#f97316'; g.fillRect(500, 1180, 700, 70); g.fillStyle = '#ffffff'; g.font = '700 40px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('Pens · Pencils · Books', 850, 1228);
        // pencil jar + price card on the counter
        g.fillStyle = 'rgba(200,230,255,0.6)'; g.fillRect(500, 960, 70, 105); for (let i = 0; i < 6; i++) { g.save(); g.translate(512 + i * 9, 1000); g.rotate(-0.12 + i * 0.05); g.fillStyle = '#fbbf24'; g.fillRect(-4, -90, 8, 90); g.fillStyle = '#ec4899'; g.fillRect(-4, -98, 8, 10); g.restore(); }
        g.save(); g.translate(640, 1030); g.rotate(-0.05); paint(g, rrect(-70, -34, 140, 64, 6), '#ffffff', [-70, -34, 70, 30]); g.fillStyle = '#1f1a33'; g.font = '800 30px Fredoka, sans-serif'; g.textAlign = 'center'; g.fillText('Pencil ₹3', 0, 10); g.restore();
      },
      look: { warm: 'rgba(255,190,120,0.06)', vignette: 0.28 },
    },
    ground: {
      back(g, st) {
        const wet = st.rain;
        let gr = g.createLinearGradient(0, -200, 0, 1100); gr.addColorStop(0, wet ? '#7d8794' : '#5aa7ee'); gr.addColorStop(1, wet ? '#b8bec6' : '#cfe8ff'); g.fillStyle = gr; g.fillRect(-400, -200, 2400, 1400);
        if (!wet) { g.fillStyle = 'rgba(255,255,255,0.85)'; for (const [x, y, s] of [[300, 260, 1], [1100, 180, 1.3], [1500, 330, 0.9]]) for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + k * 50 * s, y + Math.sin(k * 2) * 18, (40 + (k % 3) * 14) * s, 0, 7); g.fill(); } }
        else { g.fillStyle = 'rgba(90,98,110,0.6)'; for (const [x, y, s] of [[200, 200, 1.4], [900, 120, 1.8], [1500, 260, 1.3]]) for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x + k * 60 * s, y + Math.sin(k * 2) * 20, (55 + (k % 3) * 18) * s, 0, 7); g.fill(); } }
      },
      far(g, st) {   // distant tree line (parallax 0.6)
        const d = st.rain ? '#4a6b4f' : '#3f8f46';
        for (let i = -3; i < 22; i++) { g.fillStyle = i % 2 ? d : shade(d, 1.12); g.beginPath(); g.arc(i * 95, 1000 - (i % 3) * 30, 110 + (i % 4) * 20, 0, 7); g.fill(); }
      },
      mid(g, st) {
        const wet = st.rain;
        // compound wall
        g.fillStyle = wet ? '#cfc5b0' : '#f1e3c6'; g.fillRect(-400, 1000, 2400, 250); g.fillStyle = wet ? '#b9ae98' : '#e3d2ae'; for (let x = -400; x < 2000; x += 180) g.fillRect(x, 1000, 10, 250); g.fillRect(-400, 990, 2400, 20);
        // grass + path
        let gr = g.createLinearGradient(0, 1240, 0, 2300); gr.addColorStop(0, wet ? '#4f7d43' : '#6abf4b'); gr.addColorStop(1, wet ? '#3e6636' : '#4f9d3a'); g.fillStyle = gr; g.fillRect(-400, 1240, 2400, 1200);
        g.fillStyle = wet ? '#9c8b70' : '#e9cf9c'; g.beginPath(); g.moveTo(560, 1240); g.lineTo(1040, 1240); g.lineTo(1400, 2400); g.lineTo(200, 2400); g.closePath(); g.fill();
        if (wet) { g.fillStyle = 'rgba(150,170,190,0.45)'; for (const [x, y, w] of [[700, 1700, 160], [1050, 1880, 120], [520, 2000, 140]]) { g.beginPath(); g.ellipse(x, y, w, w * 0.22, 0, 0, 7); g.fill(); } }
        // big tree on the right
        paint(g, rrect(1300, 640, 80, 620, 30), '#7c5532', [1300, 640, 1380, 1260]);
        for (const [x, y, r] of [[1340, 560, 230], [1180, 660, 160], [1500, 650, 170], [1340, 760, 170]]) { g.fillStyle = wet ? '#3d7a3f' : '#3f9142'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.5, 0, 7); g.fill(); }
        for (const x of [180, 420, 1520]) leaves(g, x, 1250, 1.3, wet ? '#3d7a3f' : '#4c9a3c');
      },
      bench(g) {   // front view bench (drawn in front of the wall, behind a sitting character's front)
        g.fillStyle = '#334155'; for (const x of [560, 1040]) { g.fillRect(x - 12, 1340, 24, 230); g.fillRect(x - 12, 1080, 24, 260); }
        for (let i = 0; i < 3; i++) paint(g, rrect(520, 1110 + i * 60, 560, 40, 8), '#c08a52', [520, 1110, 1080, 1290]);
        paint(g, rrect(500, 1320, 600, 42, 10), '#b47a45', [500, 1320, 1100, 1362]);
      },
      look: { warm: 'rgba(255,200,140,0.04)', vignette: 0.3 },
    },
  };
  function leaves(g, x, y, s = 1, col = '#4c9a3c') { for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.32; g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.fillStyle = i % 2 ? col : shade(col, 1.18); g.beginPath(); g.ellipse(0, -70 * s, 22 * s, 75 * s, 0, 0, 7); g.fill(); g.restore(); } }

  async function create(opts) {
    const storyDir = opts.storyDir.endsWith('/') ? opts.storyDir : opts.storyDir + '/', vdir = (opts.voiceDir || 'voice') + '/';
    const story = await (await fetch(storyDir + 'story.json', { cache: 'no-store' })).json();
    let durations = {}, wordsMap = {};
    try { durations = await (await fetch(storyDir + vdir + 'durations.json', { cache: 'no-store' })).json(); } catch (e) {}
    try { wordsMap = await (await fetch(storyDir + vdir + 'words.json', { cache: 'no-store' })).json(); } catch (e) {}
    await document.fonts.load('700 60px Fredoka').catch(() => {}); await document.fonts.ready;
    const actx = opts.audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const buffers = await Promise.all(story.scenes.map(async (sc) => { const name = `scene-${String(sc.id).padStart(2, '0')}.wav`; if (!durations[name]) return null; try { return await actx.decodeAudioData(await (await fetch(storyDir + vdir + name)).arrayBuffer()); } catch (e) { return null; } }));
    const envelopes = buffers.map((b) => { if (!b) return null; const d = b.getChannelData(0), st = Math.floor(b.sampleRate / 60), out = new Float32Array(Math.ceil(d.length / st)); for (let i = 0; i < out.length; i++) { let s = 0; for (let j = i * st; j < Math.min(d.length, (i + 1) * st); j++) s += d[j] * d[j]; out[i] = Math.sqrt(s / st); } const mx = Math.max(...out) || 1; for (let i = 0; i < out.length; i++) out[i] = Math.min(1, out[i] / (mx * 0.6)); return out; });
    const pause = story.voice?.pauseAfter ?? 0.7;
    let acc = 0;
    const timeline = story.scenes.map((sc, i) => { const dur = (buffers[i] ? buffers[i].duration : sc.narration.split(/\s+/).length / 2.6) + pause + (i === story.scenes.length - 1 ? 1.2 : 0); const e = { scene: JSON.parse(JSON.stringify(sc)), start: acc, dur }; acc += dur; return e; });
    const total = acc;
    // word cues (same rules as the 3D engine)
    const normW = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
    function wordTime(i, spec, off = 0) {
      const e = timeline[i], list = wordsMap[`scene-${String(e.scene.id).padStart(2, '0')}.wav`], [w, nth] = String(spec).split('#'), want = normW(w), n = +(nth || 1); let t = null;
      if (list) { let k = 0; for (const [ww, st] of list) if (normW(ww) === want && ++k === n) { t = st; break; } }
      if (t == null) { const ws = e.scene.narration.split(/\s+/).map(normW); let k = 0; const idx = ws.findIndex((x) => x === want && ++k === n); t = idx < 0 ? 0 : idx / ws.length * (buffers[i] ? buffers[i].duration : e.dur - pause); }
      return clamp(t + off, 0, e.dur);
    }
    timeline.forEach((e, i) => {
      const sc = e.scene, f = (w, o) => wordTime(i, w, o || 0) / e.dur;
      for (const b of sc.beats || []) if (b.word) b.at = f(b.word, b.offset);
      for (const c of sc.camera || []) if (c.untilWord) c.until = f(c.untilWord, c.untilOffset);
      for (const pr of sc.props || []) if (pr.showWord) pr.show = f(pr.showWord, pr.showOffset);
      if (sc.counter) for (const st of sc.counter.steps || []) if (st.word) st.at = f(st.word, st.offset);
      if (sc.caption && sc.caption.atWord) sc.caption.at = f(sc.caption.atWord, sc.caption.atOffset);
      for (const x of sc.sfx || []) if (x.word) x.at = f(x.word, x.offset);
      for (const x of (sc.weather && sc.weather.thunder) || []) if (typeof x === 'object' && x.word) x.at = f(x.word, x.offset);
    });
    const cues = [];
    timeline.forEach((e) => { const sc = e.scene;
      for (const x of sc.sfx || []) cues.push({ file: x.file, start: e.start + x.at * e.dur, vol: x.vol ?? 0.6, dur: null, loop: false });
      if (sc.ambience) cues.push({ file: sc.ambience.file, start: e.start, vol: sc.ambience.vol ?? 0.12, dur: e.dur, loop: true });
      for (const th of (sc.weather && sc.weather.thunder) || []) cues.push({ file: 'thunder.wav', start: e.start + (typeof th === 'object' ? th.at : th) * e.dur + 0.35, vol: 0.35, dur: null, loop: false }); });
    const sfxBase = new URL('assets/sfx/', document.baseURI).href, sfxBuffers = {};
    await Promise.all([...new Set(cues.map((c) => c.file))].map(async (f) => { try { sfxBuffers[f] = await actx.decodeAudioData(await (await fetch(sfxBase + f)).arrayBuffer()); } catch (e) {} }));

    // ---------- cast ----------
    const cast = {};
    let sd = 1; for (const [id, c] of Object.entries(story.cast)) { cast[id] = { p: Z2D.puppet({ ...c, seed: sd++ }), cfg: c }; }
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H; const g = canvas.getContext('2d');
    const probe = document.createElement('canvas').getContext('2d');   // layout pass: puppet anchors in world space

    // ---------- scene state ----------
    let cur = -1, lt = 0, clock = 0, beatsDone = 0, held = {}, tweens = [], camSeg = -1, camPlan = null, camSegStart = 0;
    const actorsOf = () => timeline[cur].scene.actors || {};
    function enter(i) {
      cur = i; lt = 0; beatsDone = 0; held = {}; tweens = []; camSeg = -1;
      for (const [id, a] of Object.entries(actorsOf())) { const c = cast[id]; c.facing = a.face ?? 1; c.x = a.at[0]; c.y = a.at[1] ?? GROUND; c.p.setSeat(a.seat ?? null); c.p.playNow(a.anim || 'idle'); c.p.setExpression(a.expr || 'neutral', true); c.p.setTalk(null); if (a.hold) for (const [h, item] of Object.entries(a.hold)) held[id + '.' + h] = item; }
    }
    const scaleOf = (id) => (cast[id].cfg.size ?? (cast[id].p.kind === 'kid' ? 560 : 560));
    function layoutAnchors(id) { const c = cast[id]; probe.setTransform(1, 0, 0, 1, 0, 0); c.p.draw(probe, c.x, c.y, scaleOf(id), c.facing); return c.p; }
    function focusRect(tokens) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const addR = (cx, cy, rx, ry) => { x0 = Math.min(x0, cx - rx); y0 = Math.min(y0, cy - ry); x1 = Math.max(x1, cx + rx); y1 = Math.max(y1, cy + ry); };
      const sc = timeline[cur].scene;
      for (const tk of tokens) {
        if (tk === '@wide') { addR(800, 1150, 560, 520); continue; }
        const [id, part] = tk.split(/[:.]/), c = cast[id];
        if (c) { const p = layoutAnchors(id);
          if (/\.[RL]$/.test(tk)) { const a = p.anchor(tk.endsWith('R') ? 'handR' : 'handL'); addR(a.x, a.y, 110, 90); }
          else if (part === 'head') { const a = p.anchor('head'); addR(a.x, a.y + a.r * 0.1, a.r * 1.35, a.r * 1.35); }
          else if (part === 'upper') { const a = p.anchor('head'), b = p.anchor('chest'); addR(a.x, a.y, a.r * 1.4, a.r * 1.3); addR(b.x, b.y, b.r, b.r * 0.6); }
          else { const a = p.anchor('body'); addR(a.x, a.y, a.r * 0.55, a.r * 1.05); }
          continue; }
        const pr = (sc.props || []).find((q) => q.id === id); if (pr) { const w = (PROPS[pr.id]?.w || 120) * (pr.scale || 1); addR(pr.at[0], pr.at[1], w * 0.6, w * 0.6); }
      }
      if (x0 > x1) addR(800, 1150, 560, 520);
      return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
    }
    function camFor(rect, fit, off = [0, 0]) {   // zoom so the rect fills `fit` of the frame width (and fits the height)
      let z = Math.min(fit * W / Math.max(1, rect.w), fit * 1.15 * H / Math.max(1, rect.h)); z = clamp(z, W / WORLD_W * 1.02, 6);
      const hw = W / 2 / z, cx = clamp(rect.x + off[0], -200 + hw, 1800 - hw), cy = rect.y + off[1];
      return { z, x: cx, y: cy };
    }
    function planCam() {
      const e = timeline[cur], sc = e.scene, segs = sc.camera || [{ focus: ['@wide'], fit: 0.9 }];
      let k = 0, start = 0; for (; k < segs.length; k++) { const end = (segs[k].until ?? 1) * e.dur; if (lt < end || k === segs.length - 1) break; start = end; }
      if (k === camSeg) return; camSeg = k; camSegStart = start;
      const s = segs[k], end = (s.until ?? 1) * e.dur, rect = focusRect(s.focus || ['@wide']), fit = Array.isArray(s.fit) ? s.fit : [s.fit ?? 0.8, s.fit ?? 0.8];
      camPlan = { a: camFor(rect, fit[0], s.offset), b: camFor(rect, fit[1], s.offset2 || s.offset), d: Math.max(0.4, end - start), pan: s.pan || 0 };
    }
    function camAt() { const k = easeIO(clamp((lt - camSegStart) / camPlan.d, 0, 1)), a = camPlan.a, b = camPlan.b; return { z: lerp(a.z, b.z, k), x: lerp(a.x, b.x, k) + camPlan.pan * (k - 0.5), y: lerp(a.y, b.y, k) }; }

    function applyBeat(b) {
      if (b.actor) { const c = cast[b.actor]; if (b.anim) c.p.play(b.anim); if (b.expr) c.p.setExpression(b.expr); if (b.face != null) c.facing = b.face; if (b.hold) for (const [h, item] of Object.entries(b.hold)) held[b.actor + '.' + h] = item; }
      if (b.hide) delete held[b.hide];
      if (b.move) { const item = held[b.move.from] || b.move.item; delete held[b.move.from]; tweens.push({ item, from: b.move.from, to: b.move.to, t0: lt, d: 0.45 }); }
    }
    function simulate(dt) {
      const e = timeline[cur], sc = e.scene, beats = (sc.beats || []).slice().sort((a, b) => a.at - b.at);
      while (beatsDone < beats.length && beats[beatsDone].at * e.dur <= lt) applyBeat(beats[beatsDone++]);
      if (sc.talking && envelopes[cur]) { const env = envelopes[cur], idx = Math.floor(lt * 60); cast[sc.talking].p.setTalk(idx < env.length ? env[idx] : 0); }
      for (const id of Object.keys(actorsOf())) cast[id].p.update(dt);
      tweens = tweens.filter((tw) => { if (lt - tw.t0 >= tw.d) { held[tw.to] = tw.item; return false; } return true; });
      lt += dt;
    }

    // ---------- drawing ----------
    function drawProp(id, x, y, scale = 1, rot = 0) { const pr = PROPS[id]; if (!pr) return; g.save(); g.translate(x, y); g.rotate(rot); g.scale(scale, scale); pr.draw(g); g.restore(); }
    function rain(t, z) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = 'rgba(220,230,245,0.45)'; g.lineWidth = 2.5; const r = rng(99);
      for (let i = 0; i < 420; i++) { const x = r() * (W + 200) - 100, sp = 1400 + r() * 700, y = ((r() * H + t * sp) % (H + 200)) - 100, len = 30 + r() * 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + len); g.stroke(); }
      g.fillStyle = 'rgba(70,85,100,0.18)'; g.fillRect(0, 0, W, H); g.restore(); }
    function draw() {
      planCam(); const cam = camAt(), e = timeline[cur], sc = e.scene, place = PLACES[sc.place], st = { rain: sc.weather?.type === 'rain' }, f = lt / e.dur;
      g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      const layer = (par, fn) => { if (!fn) return; const z = 1 + (cam.z - 1) * par; g.setTransform(z, 0, 0, z, W / 2 - (800 + (cam.x - 800) * par) * z, H / 2 - (1150 + (cam.y - 1150) * par) * z); fn(g, st); };
      layer(0.25, place.back && sc.place === 'ground' ? place.back : null);
      if (sc.place !== 'ground') layer(1, place.back);
      layer(0.6, place.far); layer(0.85, sc.place === 'ground' ? place.mid : null);
      const camM = () => g.setTransform(cam.z, 0, 0, cam.z, W / 2 - cam.x * cam.z, H / 2 - cam.y * cam.z);
      if (sc.place === 'ground') { camM(); place.bench(g); }
      camM();
      // props on the set
      if (!place.counter) for (const pr of sc.props || []) { if (pr.show != null && f < pr.show) continue; const pop = pr.show != null ? clamp((f - pr.show) * e.dur / 0.3, 0, 1) : 1; drawProp(pr.id, pr.at[0], pr.at[1], (pr.scale || 1) * (0.6 + 0.4 * easeIO(pop)), pr.rot || 0); }
      // characters (shopkeeper goes behind the counter)
      const ids = Object.keys(actorsOf()), behind = ids.filter((id) => actorsOf()[id].behind), front = ids.filter((id) => !actorsOf()[id].behind);
      const drawActor = (id) => { const c = cast[id]; c.p.draw(g, c.x, c.y, scaleOf(id), c.facing); };
      behind.forEach(drawActor); if (place.counter) place.counter(g);
      if (place.counter) for (const pr of sc.props || []) { if (pr.show != null && f < pr.show) continue; const pop = pr.show != null ? clamp((f - pr.show) * e.dur / 0.3, 0, 1) : 1; drawProp(pr.id, pr.at[0], pr.at[1], (pr.scale || 1) * (0.6 + 0.4 * easeIO(pop)), pr.rot || 0); }
      front.forEach(drawActor);
      // held items + items flying between hands (positions from the layout pass in world space)
      for (const [key, item] of Object.entries(held)) { const [id, h] = key.split('.'); if (!cast[id] || !actorsOf()[id]) continue; const a = layoutAnchors(id).anchor(h === 'L' ? 'handL' : 'handR'); camM(); drawProp(item, a.x, a.y, (PROPS[item]?.w || 100) > 120 ? 0.85 : 1, -0.15); }
      for (const tw of tweens) { const [ia, ha] = tw.from.split('.'), [ib, hb] = tw.to.split('.'), A = layoutAnchors(ia).anchor(ha === 'L' ? 'handL' : 'handR'), B = layoutAnchors(ib).anchor(hb === 'L' ? 'handL' : 'handR'), k = easeIO(clamp((lt - tw.t0) / tw.d, 0, 1)); camM(); drawProp(tw.item, lerp(A.x, B.x, k), lerp(A.y, B.y, k) - Math.sin(Math.PI * k) * 60, 0.85, -0.15); }
      layer(1, place.light);
      layer(1.3, place.front);
      // look: warm grade, rain, thunder flash, vignette
      g.setTransform(1, 0, 0, 1, 0, 0);
      if (place.look?.warm && !st.rain) { g.fillStyle = place.look.warm; g.fillRect(0, 0, W, H); }
      if (st.rain) rain(clock, cam.z);
      let flash = 0; for (const th of sc.weather?.thunder || []) { const d = lt - (typeof th === 'object' ? th.at : th) * e.dur; if (d >= 0 && d < 0.6) flash = Math.max(flash, Math.exp(-d * 7)); }
      if (flash) { g.fillStyle = `rgba(235,240,255,${0.45 * flash})`; g.fillRect(0, 0, W, H); }
      const vg = g.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H * 0.5, H * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(20,10,5,${place.look?.vignette ?? 0.3})`); g.fillStyle = vg; g.fillRect(0, 0, W, H);
      overlays();
    }
    // ---------- overlays (same look as the 3D videos: counter + caption on top, subtitles at the bottom) ----------
    const BR = { purple: '#4b2a8c', orange: '#f8a51b', pink: '#ff4f8b', violet: '#7c5cf2' };
    function pill(x, y, w, h, r, fs) { g.fillStyle = fs; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); }
    function wrap(text, maxW) { const ws = text.split(' '), out = []; let line = ''; for (const w of ws) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }
    const chunkCache = new Map();
    function chunksOf(text) { if (chunkCache.has(text)) return chunkCache.get(text); const parts = text.match(/[^.?!,]+[.?!,]*/g).map((s) => s.trim()).filter(Boolean), out = []; let buf = ''; for (const p of parts) { const t = buf ? buf + ' ' + p : p; if (t.split(' ').length > 9 && buf) { out.push(buf); buf = p; } else buf = t; if (/[.?!]$/.test(buf)) { out.push(buf); buf = ''; } } if (buf) out.push(buf); const r = out.map((t) => ({ text: t, n: (t.match(/[A-Za-z0-9']+/g) || []).length })); chunkCache.set(text, r); return r; }
    function overlays() {
      const e = timeline[cur], sc = e.scene, f = lt / e.dur; let y = 64;
      if (sc.counter) { const c = sc.counter; let v = c.from, prev = c.from; for (const s2 of c.steps || []) { if (f < s2.at) break; v = Math.round(lerp(prev, s2.v, easeIO(clamp((f - s2.at) * e.dur / 0.6, 0, 1)))); prev = s2.v; }
        pill(W / 2 - 170, y, 340, 128, 36, 'rgba(255,255,255,0.94)'); g.fillStyle = BR.purple; g.font = '600 28px Fredoka'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(c.label || '', W / 2, y + 32);
        const gr = g.createLinearGradient(W / 2 - 110, 0, W / 2 + 110, 0); gr.addColorStop(0, BR.orange); gr.addColorStop(1, BR.pink); g.fillStyle = gr; g.font = '700 70px Fredoka'; g.fillText('₹' + v, W / 2, y + 84); y += 146; }
      if (sc.caption && f >= sc.caption.at && f <= (sc.caption.until ?? 1)) { g.font = '700 46px Fredoka'; const ls = wrap(sc.caption.text, W - 300), bh = ls.length * 56 + 36; const gr = g.createLinearGradient(130, 0, W - 130, 0); gr.addColorStop(0, BR.violet); gr.addColorStop(1, BR.pink); pill(130, y, W - 260, bh, 30, gr); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; ls.forEach((l, i) => g.fillText(l, W / 2, y + 18 + 28 + i * 56)); }
      const vd = buffers[cur] ? buffers[cur].duration : e.dur - pause, chunks = chunksOf(sc.narration), wl = wordsMap[`scene-${String(sc.id).padStart(2, '0')}.wav`];
      let wi = 0, chunk = null, tot = chunks.reduce((a, c) => a + c.n, 0), ac = 0;
      for (let ci = 0; ci < chunks.length; ci++) { const c = chunks[ci], t0 = wl && wl[wi] ? wl[wi][1] : ac / tot * vd, nx = ci + 1 < chunks.length ? (wl && wl[wi + c.n] ? wl[wi + c.n][1] : (ac + c.n) / tot * vd) : vd + 0.3; if (lt >= t0 - 0.05 && lt < nx) { chunk = c; break; } wi += c.n; ac += c.n; }
      if (chunk) { g.font = '600 44px Fredoka'; const ls = wrap(chunk.text, W - 220), bh = ls.length * 56 + 36, y0 = H - 250 - bh; pill(80, y0, W - 160, bh, 28, 'rgba(31,26,51,0.75)'); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; ls.forEach((l, i) => g.fillText(l, W / 2, y0 + 18 + 28 + i * 56)); }
      g.textBaseline = 'alphabetic';
    }
    const sceneAt = (t) => { for (let i = timeline.length - 1; i >= 0; i--) if (t >= timeline[i].start) return i; return 0; };
    const api = {
      story, timeline, total, canvas, fps: FPS, width: W, height: H, audioContext: actx, voiceDir: opts.voiceDir || 'voice',
      get time() { return clock; }, get sceneIndex() { return cur; }, get sceneTime() { return lt; },
      audioFor: (i) => buffers[i], envelopeFor: (i) => envelopes[i], cues, sfxBuffer: (f) => sfxBuffers[f], sfxDir: 'studio/assets/sfx/',
      step(dt = DT) { clock = Math.min(total, clock + dt); const i = sceneAt(clock); if (i !== cur) enter(i); const target = clock - timeline[i].start; while (lt + 1e-6 < target) simulate(Math.min(DT, target - lt)); draw(); return { scene: i, ended: clock >= total }; },
      seek(t) { clock = clamp(t, 0, total); const i = sceneAt(clock); enter(i); const target = clock - timeline[i].start; while (lt + 1e-6 < target) simulate(Math.min(DT, target - lt)); draw(); return i; },
    };
    api.seek(0);
    return api;
  }
  window.Z2D = Object.assign(window.Z2D || {}, { create, PROPS2D: PROPS, PLACES2D: PLACES });
})();
