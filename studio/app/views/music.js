// Background music: find free tracks on the internet (Openverse — Jamendo, Freesound, Wikimedia), keep them with
// their licence credit, and choose WHICH PART plays: drag the story-length window over the waveform — the end
// follows the story's length by itself.
import { h, clear, icon, btn, toast, chips, modal, slider, row, fmtTime } from '../ui.js';
import { api } from '../api.js';

const MOODS = ['happy', 'fun', 'upbeat', 'ukulele', 'children', 'inspiring', 'adventure', 'calm', 'piano', 'acoustic', 'lullaby', 'sad'];   // single words: the library matches every word you type
const name = (f) => String(f || '').replace(/^.*\//, '').replace(/-[0-9a-f]{6}\.(mp3|wav|ogg)$/, '').replace(/\.(mp3|wav|ogg)$/, '').replace(/[-_]/g, ' ');

// ---------- picker: search + preview + use, or pick one already downloaded ----------
export function pickMusic(app) {
  return new Promise((resolve) => {
    const st = { q: 'happy', credit: 'ok', page: 1, tab: 'find' }, preview = new Audio(); preview.preload = 'none';
    let playing = null;
    const body = h('div', { style: { minHeight: '420px' } });
    const m = modal('Background music', body, { wide: true, onClose: () => { preview.pause(); } });
    const done = (v) => { preview.pause(); m.close(); resolve(v); };
    const play = (id, url, b) => { if (playing === id) { preview.pause(); playing = null; b.replaceChildren(icon('play', 14)); return; } preview.src = url; preview.play().catch(() => toast('Can’t play this preview', 'error')); playing = id; body.querySelectorAll('.pv-btn').forEach((x) => x.replaceChildren(icon('play', 14))); b.replaceChildren(icon('pause', 14)); };
    async function use(t, b) {
      b.disabled = true; b.textContent = 'Downloading…';
      try { const credit = await api.post('/api/music/download', { id: t.id }); await app.lib(true); toast(`Added “${t.title}”`, 'ok'); done(credit); }
      catch (e) { toast(e.message, 'error', 6000); b.disabled = false; b.textContent = 'Use'; }
    }
    async function search() {
      const list = body.querySelector('#mres'); clear(list, h('div.loading', h('div.spinner'), 'Searching free music…'));
      try {
        const r = await api.get(`/api/music/search?q=${encodeURIComponent(st.q)}&credit=${st.credit}&page=${st.page}`);
        clear(list, r.results.length ? r.results.map((t) => h('div.item', { style: { cursor: 'default', alignItems: 'center' } },
          h('button.icon-btn.sm.pv-btn', { title: 'Listen', onclick: (e) => play(t.id, t.url, e.currentTarget) }, icon('play', 14)),
          h('span.grow', h('b', t.title), h('span.muted', ` · ${t.creator} · ${fmtTime(t.duration).replace(/\.\d$/, '')} · ${t.source}`), t.genres.length ? h('div.small.faint', t.genres.slice(0, 4).join(', ')) : null),
          h('span.badge.' + (t.needsCredit ? 'p' : 'ok'), { title: t.attribution }, t.needsCredit ? `CC BY ${t.licenseVersion || ''} · credit` : t.license === 'cc0' ? 'CC0 · no credit' : 'Public domain'),
          h('a.icon-btn.sm', { href: t.landing, target: '_blank', rel: 'noopener', title: 'Open the original page' }, icon('eye', 14)),
          btn('Use', (e) => use(t, e.currentTarget), 'small primary'))) : h('p.muted', 'Nothing found — try fewer or other words (every word must match).'),
          h('div', { style: { display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px' } },
            st.page > 1 ? btn('‹ Previous', () => { st.page--; search(); }, 'small') : null, h('span.small.muted', { style: { alignSelf: 'center' } }, `Page ${st.page} of ${Math.min(r.pages, 50)} · ${r.count} tracks`), st.page < r.pages ? btn('Next ›', () => { st.page++; search(); }, 'small') : null));
      } catch (e) { clear(list, h('div.empty', h('b', 'Couldn’t reach the music library'), h('span', e.message))); }
    }
    async function render() {
      const lib = await app.lib();
      const qIn = h('input.input', { value: st.q, placeholder: 'mood, instrument or style…', onkeydown: (e) => { if (e.key === 'Enter') { st.q = e.target.value; st.page = 1; search(); } } });
      clear(body,
        h('div.tabs', { style: { border: 0, padding: '0 0 12px' } }, [['find', 'Find free music'], ['mine', `My music (${lib.music.length})`]].map(([k, l]) => h('button.tab' + (st.tab === k ? '.on' : ''), { onclick: () => { st.tab = k; render(); } }, l))),
        st.tab === 'find' ? [
          h('div', { style: { display: 'flex', gap: '8px' } }, qIn, btn('Search', () => { st.q = qIn.value; st.page = 1; search(); }, 'primary', 'zoomin')),
          h('div', { style: { margin: '10px 0' } }, chips(MOODS.map((x) => [x, x]), [st.q], (v) => { st.q = v; st.page = 1; render(); }, { multi: false })),
          h('div', { style: { display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '8px' } }, chips([['ok', 'Free for commercial use (credit added for you)'], ['none', 'No credit needed only (fewer songs)']], [st.credit], (v) => { st.credit = v; st.page = 1; render(); }, { multi: false })),
          h('div#mres'),
          h('p.small.muted', { style: { marginTop: '10px' } }, 'Only licences that allow commercial videos and cutting the music: CC0, public domain and CC BY (needs a credit line — the studio saves it and puts it next to every video). Listen before using: some tracks have vocals.'),
        ] : h('div', lib.music.length ? lib.music.map((f) => { const c = lib.musicInfo?.[f]; return h('div.item', { style: { cursor: 'default' } },
          h('button.icon-btn.sm.pv-btn', { onclick: (e) => play(f, `/studio/assets/music/${f.replace('../music/', '')}`, e.currentTarget) }, icon('play', 14)),
          h('span.grow', h('b', c?.title || name(f)), c ? h('span.muted', ` · ${c.creator} · ${c.needsCredit ? 'CC BY' : c.license}`) : h('span.muted', ' · your file')),
          btn('Use', () => done(c || { file: f, title: name(f) }), 'small primary'),
          h('button.icon-btn.sm', { title: 'Delete from this Mac', onclick: async () => { await api.del('/api/music/' + encodeURIComponent(f.replace('../music/', ''))); await app.lib(true); render(); } }, icon('trash', 13))); }) : h('p.muted', 'No music yet. Find some, or drop your own royalty-free .mp3 files into studio/assets/music/.')));
      if (st.tab === 'find') search();
    }
    render();
  });
}

// ---------- the part chooser: whole-track waveform + a story-length window you drag ----------
export function musicTrimmer(E, onStart) {
  const mu = E.story.music, total = E.eng.total, buf = E.eng.sfxBuffer(mu.file);
  const wrap = h('div', { style: { position: 'relative', userSelect: 'none' } });
  if (!buf) { wrap.append(h('p.small.muted', 'Loading the track…')); setTimeout(() => E.renderInspector(), 800); return wrap; }
  const dur = buf.duration, W = 320, H = 64, cv = h('canvas', { width: W * 2, height: H * 2, style: { width: '100%', height: H + 'px', display: 'block', borderRadius: '8px', background: '#fff8e8', cursor: 'grab' } });
  const label = h('div.small.muted', { style: { display: 'flex', justifyContent: 'space-between', marginTop: '4px' } });
  let start = Math.min(mu.start || 0, Math.max(0, dur - Math.min(total, dur)));
  const peaks = (() => { const d = buf.getChannelData(0), n = W * 2, step = Math.floor(d.length / n), p = new Float32Array(n); for (let x = 0; x < n; x++) { let m = 0; for (let i = x * step, e = i + step; i < e; i += 16) m = Math.max(m, Math.abs(d[i] || 0)); p[x] = m; } const mx = Math.max(...p) || 1; return p.map((v) => v / mx); })();
  const winW = Math.min(1, total / dur);   // window = the story's length on the track
  function draw() {
    const g = cv.getContext('2d'), w = cv.width, hh = cv.height, x0 = start / dur * w, ww = winW * w;
    g.clearRect(0, 0, w, hh);
    for (let x = 0; x < w; x++) { const inWin = x >= x0 && x <= x0 + ww, v = peaks[x] * (hh / 2 - 4); g.fillStyle = inWin ? '#f59e0b' : '#e7d9b8'; g.fillRect(x, hh / 2 - v, 1, Math.max(1, v * 2)); }
    g.fillStyle = 'rgba(124,58,237,0.12)'; g.fillRect(x0, 0, ww, hh); g.strokeStyle = '#7c3aed'; g.lineWidth = 4; g.strokeRect(x0 + 2, 2, ww - 4, hh - 4);
    g.fillStyle = '#7c3aed'; g.fillRect(x0, 0, 6, hh);
    const end = Math.min(dur, start + total);
    clear(label, h('span', `Starts at ${fmtTime(start)}`), h('span', total > dur ? `track is shorter than the story — it loops` : `ends at ${fmtTime(end)} (follows the story)`), h('span', `track ${fmtTime(dur)}`));
  }
  let drag = null;
  cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); const r = cv.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, inside = px >= start / dur && px <= start / dur + winW; drag = { x: e.clientX, s0: inside ? start : Math.max(0, Math.min(dur - winW * dur, px * dur - winW * dur / 2)) }; start = drag.s0; draw(); cv.style.cursor = 'grabbing'; });
  cv.addEventListener('pointermove', (e) => { if (!drag) return; const r = cv.getBoundingClientRect(); start = Math.max(0, Math.min(Math.max(0, dur - winW * dur), drag.s0 + (e.clientX - drag.x) / r.width * dur)); draw(); });
  cv.addEventListener('pointerup', () => { if (!drag) return; drag = null; cv.style.cursor = 'grab'; onStart(Math.round(start * 10) / 10); });
  draw(); wrap.append(cv, label); return wrap;
}

// preview just the chosen part of the music (no story), with its fades — stop by pressing again
let prevSrc = null;
export function previewMusic(E, seconds = 12) {
  const ctx = E.eng.audioContext, mu = E.story.music, buf = E.eng.sfxBuffer(mu.file); if (!buf) return false;
  if (prevSrc) { try { prevSrc.stop(); } catch { /* done */ } prevSrc = null; return false; }
  ctx.resume(); const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf; s.loop = true; s.connect(g); g.connect(ctx.destination);
  const t = ctx.currentTime + 0.03, v = Math.max(0.25, mu.vol ?? 0.15) ; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + (mu.fadeIn ?? 0.6)); g.gain.setValueAtTime(v, t + seconds - 1); g.gain.linearRampToValueAtTime(0, t + seconds);
  s.start(t, (mu.start || 0) % buf.duration); s.stop(t + seconds); s.onended = () => { if (prevSrc === s) prevSrc = null; E.renderInspector(); }; prevSrc = s; return true;
}
export const musicPlaying = () => !!prevSrc;

// the Sound tab's "Background music" section
export function musicSection(E, sec) {
  const mu = E.story.music, info = mu && (E.lib.musicInfo?.[mu.file] || mu.credit);
  const setMusic = (label, fn) => E.commit(label, (st) => fn(st), { scene: null });
  const choose = async () => {
    const c = await pickMusic(E.app); if (!c) return;
    E.lib = await E.app.lib();
    setMusic('Background music', (st) => { st.music = { file: c.file, vol: st.music?.vol ?? 0.12, start: 0, fadeIn: st.music?.fadeIn ?? 0.6, fadeOut: st.music?.fadeOut ?? 2, ...(c.text ? { credit: { title: c.title, creator: c.creator, license: c.license, licenseVersion: c.licenseVersion, landing: c.landing, text: c.text } } : {}) }; });
    toast('Drag the purple window to choose which part plays', 'info', 5000);
  };
  if (!mu?.file) return sec('Background music', [h('p.small.muted', 'One track under the whole story. Find free music online, then choose which part plays.'), btn('Find free music', choose, 'primary', 'music')]);
  return sec('Background music', [
    h('div.item', { style: { cursor: 'default' } }, icon('music', 15), h('span.grow', h('b', info?.title || name(mu.file)), info?.creator ? h('span.muted', ` · ${info.creator}`) : null), btn('Change', choose, 'small'), h('button.icon-btn.sm', { title: 'No music', onclick: () => setMusic('Remove music', (st) => { delete st.music; }) }, icon('x', 13))),
    h('div.small', { style: { margin: '8px 0 6px', fontWeight: 600 } }, 'Which part plays — drag the window'),
    musicTrimmer(E, (s) => setMusic('Music start', (st) => { st.music.start = s; })),
    h('div', { style: { display: 'flex', gap: '6px', margin: '8px 0' } },
      btn(musicPlaying() ? 'Stop' : 'Hear this part', () => { previewMusic(E); E.renderInspector(); }, 'small', musicPlaying() ? 'pause' : 'play'),
      btn('Play with the story', () => { E.seek(0); E.play(); }, 'small ghost', 'film'),
      mu.start ? btn('From the beginning', () => setMusic('Music start', (st) => { st.music.start = 0; }), 'small ghost') : null),
    row('Volume', slider(mu.vol ?? 0.12, (v, final) => final && setMusic('Music volume', (st) => { st.music.vol = Math.round(v * 100) / 100; }), { max: 0.6 })),
    row('Fade in', slider(mu.fadeIn ?? 0.6, (v, final) => final && setMusic('Music fade in', (st) => { st.music.fadeIn = Math.round(v * 10) / 10; }), { min: 0, max: 4, step: 0.1, fmt: (v) => v.toFixed(1) + 's' })),
    row('Fade out', slider(mu.fadeOut ?? 2, (v, final) => final && setMusic('Music fade out', (st) => { st.music.fadeOut = Math.round(v * 10) / 10; }), { min: 0, max: 6, step: 0.1, fmt: (v) => v.toFixed(1) + 's' })),
    info?.text ? h('p.small', { style: { color: info.needsCredit || info.license === 'by' ? 'var(--warn)' : 'var(--muted)', marginTop: '6px' } }, info.license === 'by' ? 'Credit needed when you post: ' : '', h('span', { style: { color: 'var(--muted)' } }, info.text)) : null,
    h('p.small.muted', 'The voice stays on top; music stays in the background. You can also drag the music on the timeline.'),
  ]);
}
