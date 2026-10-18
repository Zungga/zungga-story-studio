/*
 * Zungga Story Studio — world soundscape, made live with WebAudio (no files needed, like the island game's synth sounds).
 *   const A = ZWorldAudio.create()     A.start() on the first click/key (browsers need a gesture)
 *   A.level(name, 0..1)                continuous beds: water, fountain, waterfall, birds, vats, machines, beeps, bakery,
 *                                      cafe, lab, puff, warehouse, cave, magic, train  (eased, so just set targets every frame)
 *   A.play(name, vol)                  one-shots: door, doorClose, splash, whistle, chime, step
 *   A.muted = true/false
 */
(() => {
  'use strict';
  function create() {
    let ctx = null, master = null, noise = null, pink = null; const beds = {}, want = {};
    const api = { muted: false, started: false, mix: {} };   // mix: per-sound multipliers (1 = default) + master
    const now = () => ctx.currentTime;
    function noiseBuf(kind = 'white') {
      const b = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), d = b.getChannelData(0);
      if (kind === 'white') for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      else { let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048; d[i] = (b0 + b1 + b2 + w * 0.02) * 2.2; } }
      return b;
    }
    const src = (buf, rate = 1) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate; s.start(now() + Math.random() * 0.05); return s; };
    const filt = (type, f, q = 0.7) => { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };
    const gain = (v = 0) => { const g = ctx.createGain(); g.gain.value = v; return g; };
    const lfo = (rate, depth, target, offset = 0) => { const o = ctx.createOscillator(), g = gain(depth); o.frequency.value = rate; o.connect(g); g.connect(target); o.start(); if (offset) target.value = offset; return o; };
    function chain(...nodes) { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes[nodes.length - 1]; }
    // scheduled little events inside a bed (bird chirps, clanks, drips, cup clinks, beeps…)
    const timers = [];
    function every(bed, min, max, fn) { const t = { next: 0, bed, min, max, fn }; timers.push(t); }

    // ---------- the beds ----------
    const BUILD = {
      water() {   // a mild, babbling brook (not surf): soft high trickle + little water "blips"
        const out = gain(0); const s = src(pink, 1), bp = filt('bandpass', 1700, 1.2), g2 = gain(0.35); chain(s, bp, g2, out); lfo(0.6, 0.08, g2.gain, 0.35);
        every('water', 0.05, 0.22, () => { const o = ctx.createOscillator(), g = gain(0), t = now(), f = 380 + Math.random() * 700; o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * (1.4 + Math.random() * 0.6), t + 0.06); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 + Math.random() * 0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.1); });
        return out; },
      fountain() { const out = gain(0); const s = src(noise), bp = filt('bandpass', 1800, 0.5), g2 = gain(0.5); chain(s, bp, g2, out); lfo(5.3, 0.15, g2.gain, 0.5); return out; },
      waterfall() { const out = gain(0); const s = src(pink, 0.9), lp = filt('lowpass', 1400), g2 = gain(1.2); chain(s, lp, g2, out); const s2 = src(noise), bp = filt('bandpass', 3200, 0.4), g3 = gain(0.2); chain(s2, bp, g3, out); return out; },
      birds() { const out = gain(0); const bg = src(noise), hp = filt('highpass', 5000), g2 = gain(0.015); chain(bg, hp, g2, out);
        every('birds', 0.25, 1.6, () => { const o = ctx.createOscillator(), g = gain(0), f0 = 2200 + Math.random() * 2200, t = now(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); const n = 1 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) { o.frequency.exponentialRampToValueAtTime(f0 * (1.25 + Math.random() * 0.5), t + 0.05 + i * 0.11); o.frequency.exponentialRampToValueAtTime(f0, t + 0.1 + i * 0.11); } g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 0.02); g.gain.setValueAtTime(0.18, t + n * 0.11); g.gain.linearRampToValueAtTime(0, t + n * 0.11 + 0.06); o.connect(g); g.connect(out); o.start(t); o.stop(t + n * 0.11 + 0.1); });
        return out; },
      vats() { const out = gain(0); const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 48; const lp = filt('lowpass', 180), g2 = gain(0.35); chain(o, lp, g2, out); o.start(); lfo(0.4, 0.12, g2.gain, 0.35);
        every('vats', 0.15, 0.7, () => { const o2 = ctx.createOscillator(), g = gain(0), t = now(), f = 140 + Math.random() * 200; o2.frequency.setValueAtTime(f, t); o2.frequency.exponentialRampToValueAtTime(f * 2.4, t + 0.09); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o2.connect(g); g.connect(out); o2.start(t); o2.stop(t + 0.14); });   // chocolate "bloops"
        return out; },
      machines() { const out = gain(0); const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 62; const lp = filt('lowpass', 300), g2 = gain(0.12); chain(o, lp, g2, out); o.start();
        every('machines', 0.45, 0.65, () => { const s = ctx.createBufferSource(), bp = filt('bandpass', 2400 + Math.random() * 1500, 6), g = gain(0), t = now(); s.buffer = noise; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); chain(s, bp, g, out); s.start(t); s.stop(t + 0.2); });   // clank
        return out; },
      beeps() { const out = gain(0); const hum = ctx.createOscillator(); hum.frequency.value = 120; const g0 = gain(0.03); chain(hum, g0, out); hum.start();
        every('beeps', 0.3, 1.4, () => { const o = ctx.createOscillator(), g = gain(0), t = now(); o.type = 'square'; o.frequency.value = [880, 1175, 1320, 1568, 988][Math.floor(Math.random() * 5)]; g.gain.setValueAtTime(0.06, t); g.gain.setValueAtTime(0, t + 0.07 + Math.random() * 0.1); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.2); });
        return out; },
      bakery() { const out = gain(0); const s = src(pink, 0.6), lp = filt('lowpass', 400), g2 = gain(0.5); chain(s, lp, g2, out);
        every('bakery', 0.04, 0.3, () => { const s2 = ctx.createBufferSource(), hp = filt('highpass', 1500), g = gain(0), t = now(); s2.buffer = noise; g.gain.setValueAtTime(0.25 * Math.random(), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); chain(s2, hp, g, out); s2.start(t, Math.random()); s2.stop(t + 0.04); });   // crackle
        return out; },
      cafe() { const out = gain(0); for (let v = 0; v < 3; v++) { const s = src(pink, 1), bp = filt('bandpass', 400 + v * 230, 3), g2 = gain(0.25); chain(s, bp, g2, out); lfo(2 + v * 1.3, 0.22, g2.gain, 0.25); }
        every('cafe', 1.2, 4, () => { const o = ctx.createOscillator(), g = gain(0), t = now(); o.frequency.value = 2600 + Math.random() * 900; g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.4); });   // cups
        return out; },
      lab() { const out = gain(0); const o = ctx.createOscillator(); o.frequency.value = 220; const g0 = gain(0.02); chain(o, g0, out); o.start();
        every('lab', 0.08, 0.4, () => { const o2 = ctx.createOscillator(), g = gain(0), t = now(), f = 500 + Math.random() * 900; o2.frequency.setValueAtTime(f, t); o2.frequency.exponentialRampToValueAtTime(f * 1.8, t + 0.05); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07); o2.connect(g); g.connect(out); o2.start(t); o2.stop(t + 0.08); });   // bubbles
        return out; },
      puff() { const out = gain(0); every('puff', 1.2, 2.5, () => { const s = ctx.createBufferSource(), lp = filt('lowpass', 900), g = gain(0), t = now(); s.buffer = pink; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); chain(s, lp, g, out); s.start(t, Math.random()); s.stop(t + 1); }); const o = ctx.createOscillator(); o.frequency.value = 70; const g0 = gain(0.05); chain(o, g0, out); o.start(); return out; },
      warehouse() { const out = gain(0); const s = src(pink, 0.5), lp = filt('lowpass', 200), g2 = gain(0.35); chain(s, lp, g2, out);
        every('warehouse', 2, 5, () => { const o = ctx.createOscillator(), g = gain(0), t = now(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.2); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.32); });   // crate thump
        return out; },
      cave() { const out = gain(0); const s = src(pink, 0.4), lp = filt('lowpass', 260), g2 = gain(0.8); chain(s, lp, g2, out); lfo(0.07, 0.4, g2.gain, 0.6);
        const dl = ctx.createDelay(1), fb = gain(0.45); dl.delayTime.value = 0.32; dl.connect(fb); fb.connect(dl); dl.connect(out);
        every('cave', 0.6, 2.4, () => { const o = ctx.createOscillator(), g = gain(0), t = now(), f = 900 + Math.random() * 1400; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.08); g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.connect(g); g.connect(out); g.connect(dl); o.start(t); o.stop(t + 0.14); });   // drips with echo
        return out; },
      magic() { const out = gain(0); [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { const o = ctx.createOscillator(), g2 = gain(0.04); o.frequency.value = f; chain(o, g2, out); o.start(); lfo(0.15 + i * 0.07, 0.035, g2.gain, 0.04); });
        every('magic', 0.3, 1.2, () => { const o = ctx.createOscillator(), g = gain(0), t = now(); o.frequency.value = 1500 + Math.random() * 2500; g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.85); });   // sparkles
        return out; },
      train() { const out = gain(0); const s = src(noise), bp = filt('bandpass', 380, 1.5), g2 = gain(0); chain(s, bp, g2, out); const o = ctx.createOscillator(), og = gain(0); o.frequency.value = 3.2; o.connect(og); og.gain.value = 0.55; og.connect(g2.gain); o.start(); g2.gain.value = 0.55; api._trainLfo = o; const r = ctx.createOscillator(); r.type = 'sawtooth'; r.frequency.value = 40; const rl = filt('lowpass', 120), rg = gain(0.2); chain(r, rl, rg, out); r.start(); return out; },
    };
    function bed(name) { if (!beds[name] && BUILD[name]) { const out = BUILD[name](); out.connect(master); beds[name] = out; } return beds[name]; }

    // ---------- one-shots ----------
    const SHOT = {
      door(v = 1) { const t = now(), s = ctx.createBufferSource(), bp = filt('bandpass', 700, 8), g = gain(0); s.buffer = noise; bp.frequency.setValueAtTime(500, t); bp.frequency.linearRampToValueAtTime(1100, t + 0.35); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35 * v, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45); chain(s, bp, g, master); s.start(t); s.stop(t + 0.5); },   // creak
      doorClose(v = 1) { const t = now(), o = ctx.createOscillator(), g = gain(0); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.15); g.gain.setValueAtTime(0.5 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.25); },   // thump
      splash(v = 1) { const t = now(), s = ctx.createBufferSource(), lp = filt('lowpass', 2200), g = gain(0); s.buffer = noise; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.7 * v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); chain(s, lp, g, master); s.start(t); s.stop(t + 0.75); },
      whistle(v = 1) { const t = now(); for (const f of [740, 932]) { const o = ctx.createOscillator(), g = gain(0); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16 * v, t + 0.08); g.gain.setValueAtTime(0.16 * v, t + 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2); o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.25); } },
      chime(v = 1) { const t = now(); [784, 1047, 1319].forEach((f, i) => { const o = ctx.createOscillator(), g = gain(0); o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + i * 0.09); g.gain.exponentialRampToValueAtTime(0.15 * v, t + i * 0.09 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.9); o.connect(g); g.connect(master); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 1); }); },
      step(v = 1) { const t = now(), s = ctx.createBufferSource(), lp = filt('lowpass', 500), g = gain(0); s.buffer = pink; g.gain.setValueAtTime(0.12 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08); chain(s, lp, g, master); s.start(t, Math.random() * 2); s.stop(t + 0.1); },
    };

    api.start = () => {
      if (api.started) { if (ctx.state === 'suspended') ctx.resume(); return; }
      ctx = new (window.AudioContext || window.webkitAudioContext)(); master = gain(0.8); const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
      noise = noiseBuf('white'); pink = noiseBuf('pink'); api.started = true;
    };
    api.level = (name, v) => { want[name] = v; };
    api.play = (name, v = 1) => { if (!api.started || api.muted || !SHOT[name]) return; SHOT[name](Math.max(0, Math.min(2, v * (api.mix[name] ?? 1)))); };
    api.trainSpeed = (k) => { if (api._trainLfo) api._trainLfo.frequency.setTargetAtTime(0.5 + k * 4, now(), 0.3); };
    api.update = (dt) => {
      if (!api.started) return;
      master.gain.setTargetAtTime(api.muted ? 0 : (api.mix.master ?? 0.8), now(), 0.1);
      for (const [name, v] of Object.entries(want)) { if (v > 0.002 || beds[name]) { const b = bed(name); if (b) b.gain.setTargetAtTime(Math.max(0, v * (api.mix[name] ?? 1)), now(), 0.6); } }
      const t = now();
      for (const tm of timers) { const lv = (want[tm.bed] || 0) * (api.mix[tm.bed] ?? 1); if (lv < 0.01) continue; if (t >= tm.next) { tm.fn(); tm.next = t + tm.min + Math.random() * (tm.max - tm.min); } }
    };
    return api;
  }
  window.ZWorldAudio = { create };
})();
