// Timeline: Scenes · Words · Camera · Actions · Expressions · Voice · Sound FX · Music · Text (· Lighting).
// Drag a clip to re-time it — with "Snap to word" it lands exactly on a spoken word, so it follows the voice if a line is re-made.
import { h, $, clear, icon, btn, toast } from '../ui.js';
import { menu } from './editor.js';

const ANIMS = ['idle', 'talk', 'walk', 'run', 'wave', 'think', 'cheer', 'count', 'point', 'give', 'arms_crossed', 'hands_on_hips', 'hip_point_front', 'hip_point_up', 'hip_point_side', 'sit', 'sit_sad'];
const pad = (n) => String(n).padStart(2, '0');

// ---------- word timing helpers (shared with the inspector) ----------
export function wordsOf(E, si) {
  const e = E.eng.timeline[si]; if (!e) return [];
  const list = E.words[`scene-${pad(e.scene.id)}.wav`], counts = {};
  const tag = (w) => { const k = w.toLowerCase().replace(/[^a-z0-9']/g, ''); counts[k] = (counts[k] || 0) + 1; return counts[k] > 1 ? `${w.replace(/[^A-Za-z0-9']/g, '')}#${counts[k]}` : w.replace(/[^A-Za-z0-9']/g, ''); };
  if (list && list.length) return list.map(([w, s, en]) => ({ w, spec: tag(w), s, e: en }));
  const ws = e.scene.narration.split(/\s+/).filter(Boolean), buf = E.eng.audioFor(si), len = buf ? buf.duration : Math.max(0.5, e.dur - 0.7);   // no timings yet: spread evenly
  return ws.map((w, i) => ({ w, spec: tag(w), s: i / ws.length * len, e: (i + 0.9) / ws.length * len, est: true }));
}
// put a time (seconds inside scene si) on an object: snapped to the nearest word, or as a fraction of the scene
export function setTiming(E, obj, si, tLocal, keys = ['word', 'offset', 'at'], snap = E.snap) {
  const [kw, ko, ka] = keys, e = E.eng.timeline[si];
  if (snap) { const ws = wordsOf(E, si); if (ws.length) { let best = ws[0]; for (const w of ws) if (Math.abs(w.s - tLocal) < Math.abs(best.s - tLocal)) best = w; obj[kw] = best.spec; delete obj[ko]; delete obj[ka]; return best; } }
  obj[ka] = Math.round(Math.max(0, Math.min(1, tLocal / e.dur)) * 1000) / 1000; delete obj[kw]; delete obj[ko]; return null;
}

export function renderTimeline(E, el) {
  E.split = () => split(E); E.deleteSelected = () => deleteSelected(E);
  const eng = E.eng, tl = eng.timeline, Z = E.zoom, W = Math.max(eng.total * Z + 80, 400), story = E.story;
  const scroll = $('.tl-scroll', el), keep = scroll ? [scroll.scrollLeft, scroll.scrollTop] : [0, 0];
  const isSel = (s) => { const a = E.sel; return a.kind === s.kind && a.si === s.si && a.k === s.k && (a.beatKind || null) === (s.beatKind || null) && (a.what || null) === (s.what || null); };
  const X = (t) => t * Z;
  const clip = (cls, t0, t1, label, sel, opts = {}) => h('div.clip.' + cls + (sel && isSel(sel) ? '.sel' : '') + (opts.auto ? '.auto' : ''), {
    style: { left: X(t0) + 'px', width: Math.max(opts.min || 14, X(t1 - t0)) + 'px', ...(opts.style || {}) }, title: opts.title || label,
    onpointerdown: (ev) => startDrag(ev, sel, opts), onclick: (ev) => { ev.stopPropagation(); if (opts.onclick) opts.onclick(); else if (sel) { if (sel.si != null && sel.si !== E.si) E.seekScene(sel.si); E.select(sel); } },
  }, opts.icon ? icon(opts.icon, 12) : null, label, opts.resize ? h('span.handle.r', { onpointerdown: (ev) => { ev.stopPropagation(); startResize(ev, sel); } }) : null);

  const tracks = [
    ['Scenes', 'film', '', tl.map((e, i) => clip('scene' + (i === E.si ? '.cur' : ''), e.start, e.start + e.dur, `${i + 1} · ${e.scene.title || ''}`, null, { onclick: () => E.seekScene(i, false), style: E.thumbs[e.scene.id] ? { backgroundImage: `linear-gradient(90deg,#ede9fef2 0,#ede9fecc 60%,#ede9fe55), url(${E.thumbs[e.scene.id]})`, backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x' } : {} }))],
    ['Words', 'text', '.short', tl.map((e, i) => wordsOf(E, i).map((w) => h('div.clip.word', { style: { left: X(e.start + w.s) + 'px', width: Math.max(6, X(w.e - w.s) - 1) + 'px', opacity: w.est ? 0.55 : 1, padding: X(w.e - w.s) < 22 ? '0' : null }, title: w.est ? `${w.w} (estimated — make the voice to time it exactly)` : `${w.w} · ${w.s.toFixed(2)}s`, onclick: (ev) => { ev.stopPropagation(); E.seek(e.start + w.s); } }, X(w.e - w.s) < 22 ? '' : w.w)))],
    ['Camera', 'camera', '', tl.map((e, i) => { let prev = 0; return (e.scene.camera || []).map((c, k) => { const u = c.until ?? 1, a = e.start + prev * e.dur, b = e.start + (k === e.scene.camera.length - 1 ? 1 : u) * e.dur; prev = u; return clip('cam' + (c.move === 'fixed' ? '.fixed' : ''), a, b, camLabel(c), { kind: 'shot', si: i, k }, { auto: story.scenes[i]?.camera?.[k]?.auto, icon: 'camera', resize: k < e.scene.camera.length - 1 }); }); })],
    ['Actions', 'user', '', tl.map((e, i) => [
      ...(e.scene.beats || []).map((b, k) => (b.anim || b.hold || b.move || b.face != null || b.hide ? clip('act', e.start + b.at * e.dur, e.start + b.at * e.dur + 1.1, `${b.actor || b.move?.item || ''}${b.actor ? ': ' : ' '}${b.anim ? pretty(b.anim) : b.hold ? 'holds ' + Object.values(b.hold)[0] : b.move ? 'passes' : b.hide ? 'puts away' : 'turns'}`, { kind: 'beat', beatKind: 'act', si: i, k }, { auto: story.scenes[i]?.beats?.[k]?.auto, drag: true }) : null))])],
    ['Expressions', 'heart', '.short', tl.map((e, i) => (e.scene.beats || []).map((b, k) => (b.expr ? clip('expr', e.start + b.at * e.dur, e.start + b.at * e.dur + 0.8, `${b.actor}: ${pretty(b.expr)}`, { kind: 'beat', beatKind: 'expr', si: i, k }, { auto: story.scenes[i]?.beats?.[k]?.auto, drag: true }) : null)))],
    ['Voice', 'mic', '', tl.map((e, i) => { const buf = eng.audioFor(i); return buf ? h('canvas.tl-wave', { width: Math.max(2, Math.round(X(buf.duration))), height: 26, style: { left: X(e.start) + 'px', width: X(buf.duration) + 'px' }, dataset: { wave: i } }) : h('div.clip', { style: { left: X(e.start) + 'px', width: X(e.dur - 0.7) + 'px', background: '#f3f4f6', color: '#9ca3af', border: '1px dashed #d1d5db' }, onclick: () => { E.seekScene(i); E.openTab('sound'); } }, 'No voice yet'); })],
    ['Sound FX', 'volume', '', tl.map((e, i) => [
      ...(e.scene.sfx || []).map((x, k) => clip('sfx', e.start + x.at * e.dur, e.start + x.at * e.dur + Math.min(3, eng.sfxBuffer(x.file)?.duration || 1), name(x.file), { kind: 'beat', beatKind: 'sfx', si: i, k }, { auto: story.scenes[i]?.sfx?.[k]?.auto, drag: true, icon: 'volume' })),
      e.scene.ambience ? clip('sfx', e.start, e.start + e.dur, `Ambience · ${name(e.scene.ambience.file)}`, { kind: 'beat', beatKind: 'amb', si: i, k: 0 }, { style: { opacity: 0.6, top: '17px', bottom: '3px', fontSize: '10px' }, onclick: () => { E.seekScene(i); E.openTab('sound'); } }) : null,
      ...((e.scene.weather && e.scene.weather.thunder) || []).map((th) => { const at = typeof th === 'object' ? th.at : th; return clip('sfx', e.start + at * e.dur, e.start + at * e.dur + 1.2, 'Thunder', null, { icon: 'fx', onclick: () => { E.seekScene(i); E.openTab('scene'); }, style: { top: '4px', bottom: '17px', fontSize: '10px' } }); }),
      ...(e.scene.props || []).filter((p) => p.coins).map((p) => clip('sfx', e.start + p.coins.start * e.dur, e.start + p.coins.end * e.dur + 0.3, `Coins ×${p.coins.count}`, null, { icon: 'volume', onclick: () => { E.seekScene(i); E.select({ kind: 'prop', id: p.id, i: story.scenes[i].props.findIndex((q) => q.id === p.id) }); } }))])],
    ['Music', 'music', '.short', story.music?.file ? musicClip(E, X, eng.total) : h('div.clip', { style: { left: '4px', width: '170px', background: 'transparent', color: 'var(--faint)', border: '1px dashed var(--line2)' }, onclick: () => E.openTab('sound') }, '+ Add background music')],
    ['Text', 'text', '', tl.map((e, i) => [
      e.scene.caption ? clip('text', e.start + (e.scene.caption.at ?? 0) * e.dur, e.start + e.dur, `“${e.scene.caption.text}”`, { kind: 'beat', beatKind: 'text', what: 'caption', si: i, k: 0 }, { auto: story.scenes[i]?.caption?.auto, drag: true, icon: 'text' }) : null,
      e.scene.counter ? clip('text', e.start, e.start + 0.8, `${e.scene.counter.label}: ₹${e.scene.counter.from}`, { kind: 'beat', beatKind: 'text', what: 'counter', si: i, k: 0 }, { style: { top: '4px', bottom: '17px', fontSize: '10px' } }) : null,
      ...((e.scene.counter && e.scene.counter.steps) || []).map((st, k) => clip('text', e.start + st.at * e.dur, e.start + st.at * e.dur + 0.7, `→ ₹${st.v}`, { kind: 'beat', beatKind: 'text', what: 'step', si: i, k }, { drag: true, style: { top: '17px', bottom: '3px', fontSize: '10px' } })),
      ...(e.scene.props || []).filter((p) => p.endCard).map((p) => clip('text', e.start + (p.show ?? 0.8) * e.dur, e.start + e.dur, 'End card · Zungga logo', null, { onclick: () => { E.seekScene(i); E.openTab('text'); } }))])],
  ];
  if (E.showLight) tracks.push(['Lighting', 'sun', '.short', tl.map((e, i) => clip('light', e.start, e.start + e.dur, story.scenes[i]?.light ? (story.scenes[i].light.preset || 'Custom light') : 'Auto light', null, { onclick: () => { E.seekScene(i); E.openTab('look'); } }))]);

  const ticks = []; const stepS = Z > 60 ? 1 : Z > 25 ? 2 : 5;
  for (let t = 0; t <= eng.total + 0.01; t += 1) { ticks.push(h('i', { style: { left: X(t) + 'px', height: t % stepS === 0 ? '8px' : '4px' } })); if (t % (stepS * (Z > 60 ? 1 : 2)) === 0 || t === 0) ticks.push(h('span', { style: { left: X(t) + 'px' } }, `${t}s`)); }
  const ruler = h('div.tl-ruler', { style: { width: W + 'px' }, onpointerdown: (ev) => scrubStart(ev) }, ticks);
  const inner = h('div.tl-inner', { style: { width: W + 'px' }, onclick: (ev) => { if (ev.target.classList.contains('tl-track')) { const r = inner.getBoundingClientRect(); E.seek((ev.clientX - r.left) / Z); } } },
    ruler, tracks.map(([, , cls, kids]) => h('div.tl-track' + cls, kids)), h('div.playhead'));
  const sc2 = h('div.tl-scroll', { onscroll: (ev) => { heads.scrollTop = ev.target.scrollTop; } }, inner);
  const heads = h('div.tl-heads', tracks.map(([label, ic, cls]) => h('div.tl-head' + cls, icon(ic, 15), label)));
  const sel = E.sel, canDelete = ['shot', 'beat'].includes(sel.kind) && sel.beatKind !== 'amb';
  clear(el, h('div.tl-resize', { onpointerdown: E.resizeTimeline }),
    h('div.tl-tools',
      btn('Add track', (ev) => addMenu(E, ev), 'small', 'plus'),
      btn('Split', () => E.split(), 'small ghost', 'scissors', 'Split the camera shot at the playhead (S)'),
      h('button.btn.small.ghost', { disabled: !canDelete, onclick: () => E.deleteSelected(), title: 'Delete the selected clip (Delete)' }, icon('trash', 15), 'Delete'),
      h('button.btn.small' + (E.snap ? '.on' : ''), { onclick: () => { E.snap = !E.snap; E.savePref(); renderTimeline(E, el); }, title: 'Dragged clips land exactly on spoken words' }, icon('magnet', 15), 'Snap to word'),
      h('span.grow'),
      btn('', () => E.history(), 'small ghost', 'history', 'Version history'),
      btn('', () => E.shortcuts(), 'small ghost', 'keyboard', 'Keyboard shortcuts (?)'),
      h('button.icon-btn.sm', { title: 'Zoom out', onclick: () => setZoom(E, el, E.zoom / 1.3) }, icon('zoomout', 15)),
      h('input.range', { type: 'range', min: 8, max: 200, value: E.zoom, oninput: (ev) => setZoom(E, el, +ev.target.value) }),
      h('button.icon-btn.sm', { title: 'Zoom in', onclick: () => setZoom(E, el, E.zoom * 1.3) }, icon('zoomin', 15)),
      h('button.btn.small.ghost', { onclick: () => { const w = sc2.clientWidth - 40; setZoom(E, el, w / E.eng.total); }, title: 'Fit the whole story' }, 'Fit')),
    h('div.tl-wrap', heads, sc2));
  sc2.scrollLeft = keep[0]; sc2.scrollTop = keep[1];
  const rng = $('.tl-tools .range', el); rng.style.setProperty('--fill', ((E.zoom - 8) / 192 * 100) + '%');
  drawWaves(E, inner); updatePlayhead(E, false);

  // ---------- drag to re-time ----------
  function scrubStart(ev) { const r = inner.getBoundingClientRect(); const mv = (e2) => E.seek(Math.max(0, (e2.clientX - r.left) / Z)); mv(ev); const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }; addEventListener('pointermove', mv); addEventListener('pointerup', up); }
  function startDrag(ev, s, opts) {
    if (!opts.drag || !s || ev.button !== 0) return;
    const node = ev.currentTarget, x0 = ev.clientX, left0 = parseFloat(node.style.left); let moved = false;
    const mv = (e2) => { const dx = e2.clientX - x0; if (Math.abs(dx) > 3) moved = true; if (moved) node.style.left = (left0 + dx) + 'px'; };
    const up = (e2) => {
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up); if (!moved) return;
      const t = (left0 + e2.clientX - x0) / Z, si = s.si, e = tl[si], tLocal = Math.max(0, Math.min(e.dur - 0.05, t - e.start));
      E.commit('Move on the timeline', (st) => { const o = target(st, s); if (!o) return; delete o.auto; const keys = s.what === 'caption' ? ['atWord', 'atOffset', 'at'] : ['word', 'offset', 'at']; setTiming(E, o, si, tLocal, keys); }, { scene: si });
      setTimeout(() => E.select(s), 0);
    };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  }
  function startResize(ev, s) {   // camera shot length: drag its right edge
    const node = ev.target.parentElement, x0 = ev.clientX, w0 = node.offsetWidth, left = parseFloat(node.style.left);
    const mv = (e2) => { node.style.width = Math.max(14, w0 + e2.clientX - x0) + 'px'; };
    const up = (e2) => {
      removeEventListener('pointermove', mv); removeEventListener('pointerup', up);
      const e = tl[s.si], tLocal = Math.max(0.2, Math.min(e.dur - 0.2, (left + w0 + e2.clientX - x0) / Z - e.start));
      E.commit('Change shot length', (st) => { const c = st.scenes[s.si].camera[s.k]; delete c.auto; setTiming(E, c, s.si, tLocal, ['untilWord', 'untilOffset', 'until']); }, { scene: s.si });
    };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  }
}
// the story object a timeline selection points at
export function target(st, s) {
  const sc = st.scenes[s.si]; if (!sc) return null;
  if (s.kind === 'shot') return sc.camera?.[s.k];
  if (s.beatKind === 'sfx') return sc.sfx?.[s.k];
  if (s.beatKind === 'text') return s.what === 'caption' ? sc.caption : s.what === 'counter' ? sc.counter : sc.counter?.steps?.[s.k];
  if (s.kind === 'beat') return sc.beats?.[s.k];
  return null;
}
function setZoom(E, el, z) { E.zoom = Math.max(8, Math.min(200, z)); E.savePref(); renderTimeline(E, el); }
export function updatePlayhead(E, follow = true) {
  const ph = document.querySelector('.ed-tl .playhead'); if (!ph) return; const x = E.eng.time * E.zoom; ph.style.left = x + 'px';
  if (follow && E.playing) { const sc = document.querySelector('.ed-tl .tl-scroll'); if (sc && (x < sc.scrollLeft || x > sc.scrollLeft + sc.clientWidth - 60)) sc.scrollLeft = x - 80; }
}
const waveCache = new WeakMap();
function drawWaves(E, inner) {
  for (const cv of inner.querySelectorAll('canvas[data-wave]')) {
    const buf = E.eng.audioFor(+cv.dataset.wave); if (!buf) continue; const g = cv.getContext('2d'), w = cv.width, hh = cv.height;
    let peaks = waveCache.get(buf); if (!peaks || peaks.length !== w) { const d = buf.getChannelData(0), step = Math.max(1, Math.floor(d.length / w)); peaks = new Float32Array(w); for (let x = 0; x < w; x++) { let m = 0; for (let i = x * step, e = Math.min(d.length, i + step); i < e; i += 8) m = Math.max(m, Math.abs(d[i])); peaks[x] = m; } waveCache.set(buf, peaks); }
    const mx = Math.max(...peaks) || 1; g.fillStyle = '#10b981';
    for (let x = 0; x < w; x++) { const v = peaks[x] / mx * (hh / 2 - 1); g.fillRect(x, hh / 2 - v, 1, Math.max(1, v * 2)); }
  }
}
function addMenu(E, ev) {
  const si = E.si, e = E.eng.timeline[si], tLocal = E.eng.time - e.start, sc = E.story.scenes[si], who = E.sel.kind === 'actor' ? E.sel.id : sc.talking || E.story.hero || Object.keys(sc.actors || {})[0];
  const addBeat = (b, label, kind) => { let k = -1; E.commit(label, (st) => { const s = st.scenes[si]; s.beats = s.beats || []; setTiming(E, b, si, tLocal); s.beats.push(b); k = s.beats.length - 1; }); setTimeout(() => E.select({ kind: 'beat', beatKind: kind, si, k }), 0); };
  menu(ev, [
    who ? [`Action for ${who} here`, 'user', () => addBeat({ actor: who, anim: 'wave' }, 'Add action', 'act')] : null,
    who ? [`Expression for ${who} here`, 'heart', () => addBeat({ actor: who, expr: 'big_smile' }, 'Add expression', 'expr')] : null,
    ['Camera cut here (split shot)', 'scissors', () => E.split()],
    ['Sound effect here', 'volume', () => { let k = -1; E.commit('Add sound effect', (st) => { const s = st.scenes[si], x = { file: E.lib.sfx[0] || 'coin-register.mp3', vol: 0.5 }; setTiming(E, x, si, tLocal); s.sfx = s.sfx || []; s.sfx.push(x); k = s.sfx.length - 1; }); setTimeout(() => E.select({ kind: 'beat', beatKind: 'sfx', si, k }), 0); }],
    ['Caption here', 'text', () => { E.commit('Add caption', (st) => { const s = st.scenes[si]; s.caption = { text: 'New caption' }; setTiming(E, s.caption, si, tLocal, ['atWord', 'atOffset', 'at']); }); setTimeout(() => E.select({ kind: 'beat', beatKind: 'text', what: 'caption', si, k: 0 }), 0); }],
    ['Money counter step here', 'plus', () => E.commit('Add counter step', (st) => { const s = st.scenes[si]; s.counter = s.counter || { from: 0, to: 0, label: 'Money', steps: [] }; s.counter.steps = s.counter.steps || []; const x = { v: s.counter.to || 0 }; setTiming(E, x, si, tLocal); s.counter.steps.push(x); })],
    null,
    [E.showLight ? 'Hide the Lighting track' : 'Show the Lighting track', 'sun', () => { E.showLight = !E.showLight; E.renderTimeline(); }],
  ].filter((x, i, a) => x !== null || (i > 0 && a[i - 1] !== null)));
}
const camLabel = (c) => (c.move === 'fixed' ? 'Placed shot' : pretty(c.move)) + (c.focus && c.focus.length ? ' · ' + c.focus.slice(0, 2).join(', ').replace(/:/g, ' ') : '');
export const pretty = (s) => String(s || '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const name = (f) => String(f || '').replace(/^.*\//, '').replace(/\.(mp3|wav|ogg)$/, '').replace(/[-_]/g, ' ');
export { ANIMS };

// split the camera shot under the playhead into two (the new one starts here, same settings)
function split(E) {
  const si = E.si, e = E.eng.timeline[si], tLocal = E.eng.time - e.start, segs = e.scene.camera || [];
  if (!segs.length) return; const f = tLocal / e.dur; let k = 0; for (; k < segs.length; k++) if (f < (segs[k].until ?? 1) || k === segs.length - 1) break;
  const prevEnd = k ? (segs[k - 1].until ?? 0) : 0, end = k === segs.length - 1 ? 1 : (segs[k].until ?? 1);
  if (f - prevEnd < 0.03 || end - f < 0.03) return toast('Too close to a cut — move the playhead a little', 'error');
  E.commit('Split camera shot', (st) => { const c = st.scenes[si].camera[k], copy = JSON.parse(JSON.stringify(c)); delete c.auto; delete copy.auto; setTiming(E, c, si, tLocal, ['untilWord', 'untilOffset', 'until']); st.scenes[si].camera.splice(k + 1, 0, copy); });
  setTimeout(() => E.select({ kind: 'shot', si, k: k + 1 }), 0);
}
function deleteSelected(E) {
  const s = E.sel; if (!['shot', 'beat'].includes(s.kind) || s.beatKind === 'amb') return;
  E.commit('Delete', (st) => {
    const sc = st.scenes[s.si]; if (!sc) return;
    if (s.kind === 'shot') { if ((sc.camera || []).length <= 1) return toast('A scene needs at least one camera shot', 'error'); const removed = sc.camera.splice(s.k, 1)[0]; const prev = sc.camera[s.k - 1]; if (prev && s.k === sc.camera.length) { delete prev.until; delete prev.untilWord; delete prev.untilOffset; } else if (prev && removed) { for (const key of ['until', 'untilWord', 'untilOffset']) { if (removed[key] != null) prev[key] = removed[key]; else delete prev[key]; } } }
    else if (s.beatKind === 'sfx') sc.sfx.splice(s.k, 1);
    else if (s.beatKind === 'text') { if (s.what === 'caption') delete sc.caption; else if (s.what === 'counter') delete sc.counter; else sc.counter.steps.splice(s.k, 1); }
    else sc.beats.splice(s.k, 1);
  }, { scene: s.si });
  E.select({ kind: 'scene' });
}

// the music bar: shows the part of the track under the story; drag it sideways to use an earlier / later part
function musicClip(E, X, total) {
  const mu = E.story.music, buf = E.eng.sfxBuffer(mu.file), w = Math.max(40, X(total));
  const label = () => `♪ ${String(mu.credit?.title || mu.file.replace(/^.*\//, '').replace(/-[0-9a-f]{6}\.mp3$|\.mp3$/, '').replace(/[-_]/g, ' '))} · from ${fmt(mu.start || 0)} · drag to change the part`;
  const cv = h('canvas', { width: Math.round(Math.min(w, 4000)), height: 20, style: { position: 'absolute', inset: '0', width: '100%', height: '100%', opacity: 0.55, pointerEvents: 'none' } });
  const txt = h('span', { style: { position: 'relative' } }, label());
  const el = h('div.clip.music', { style: { left: '0px', width: w + 'px', cursor: 'ew-resize' }, title: 'Drag sideways to choose which part of the music plays (the end follows the story)' }, cv, txt);
  let start = mu.start || 0;
  const draw = () => { if (!buf) return; const g = cv.getContext('2d'), d = buf.getChannelData(0), sr = buf.sampleRate, n = cv.width; g.clearRect(0, 0, n, 20); g.fillStyle = '#b45309';
    for (let x = 0; x < n; x++) { const t = (start + x / n * total) % buf.duration, i0 = Math.floor(t * sr); let m = 0; for (let i = i0, e = i0 + Math.floor(total / n * sr); i < e; i += 64) m = Math.max(m, Math.abs(d[i % d.length])); g.fillRect(x, 10 - m * 9, 1, Math.max(1, m * 18)); } };
  draw();
  el.addEventListener('pointerdown', (ev) => {
    if (!buf) return; ev.preventDefault(); el.setPointerCapture(ev.pointerId); const x0 = ev.clientX, s0 = start, pxPerSec = X(1);
    const mv = (e) => { start = Math.max(0, Math.min(Math.max(0, buf.duration - Math.min(total, buf.duration)), s0 - (e.clientX - x0) / pxPerSec)); draw(); txt.textContent = label().replace(/from [^·]+/, `from ${fmt(start)} `); };
    const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); if (Math.abs(start - s0) > 0.05) E.commit('Music start', (st) => { st.music.start = Math.round(start * 10) / 10; }, { scene: null }); else E.openTab('sound'); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up);
  });
  return el;
}
const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
