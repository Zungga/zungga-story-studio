// Studio editor: scene list · live 3D preview · inspector · timeline. Everything starts auto-generated and
// everything can be overridden; edits autosave, undo/redo, and re-time against the voice instantly.
import { h, $, $$, clear, icon, btn, toast, select, modal, confirmBox, fmtTime, ago, clone, debounce } from '../ui.js';
import { api } from '../api.js';
import { draftFromStory } from './story.js';
import { renderInspector, TABS } from './inspector.js';
import { renderTimeline, updatePlayhead } from './timeline.js';

const ASPECTS = { '9:16': [1080, 1920], '16:9': [1920, 1080], '1:1': [1080, 1080], '4:5': [1080, 1350] };
const QUALITY = { full: 1, half: 0.5, low: 0.34 };

export async function mount(el, { app }) {
  const pid = app.project.project.id, lib = await app.lib(), conf = await app.conf();
  let P = await app.reloadProject();
  if (!P.story) { app.go(`#/p/${pid}/build`); return {}; }
  const pref = (() => { try { return JSON.parse(localStorage.getItem('zs-ed') || '{}'); } catch { return {}; } })();
  const E = {
    pid, app, lib, conf, story: clone(P.story), eng: null, sel: { kind: 'scene' }, tab: sessionStorage.getItem('zs-tab') || pref.tab || 'scene', si: 0,
    undoStack: [], redoStack: [], words: {}, aspect: pref.aspect || aspectOf(P.story), quality: pref.quality || 'half', safe: pref.safe ?? true, grid: !!pref.grid,
    free: false, moveTool: false, loop: false, snap: pref.snap ?? true, zoom: pref.zoom || 70, compare: false, playing: false, thumbs: {}, draft: P.draft || draftFromStory(P.story, P.project),
  };
  sessionStorage.removeItem('zs-tab');
  const savePref = () => { try { localStorage.setItem('zs-ed', JSON.stringify({ tab: E.tab, aspect: E.aspect, quality: E.quality, safe: E.safe, grid: E.grid, snap: E.snap, zoom: E.zoom })); } catch { /* private mode */ } };

  // ---------- layout ----------
  const scenesEl = h('div.card.ed-scenes'), previewEl = h('div.ed-preview'), inspEl = h('div.card.ed-insp'), tlEl = h('div.card.ed-tl');
  const root = h('div.ed', scenesEl, previewEl, inspEl, tlEl); clear(el, root);
  root.style.setProperty('--tl-h', (pref.tlh || 300) + 'px');
  clear(previewEl, h('div.pv-stage', h('div.loading', h('div.spinner'), 'Building the 3D scene…')));

  // ---------- engine ----------
  async function makeEngine() {
    const [w, h0] = ASPECTS[E.aspect] || ASPECTS['9:16'], q = QUALITY[E.quality] || 0.5;
    const t = E.eng ? E.eng.time : 0; E.eng?.audioContext?.close?.().catch(() => {});
    E.eng = await ZStory.create({ storyDir: `/projects/${pid}/`, story: E.story, voiceDir: E.story.voice?.defaultDir || 'voice', width: Math.round(w * q / 2) * 2, height: Math.round(h0 * q / 2) * 2 });
    if (t) E.eng.seek(Math.min(t, E.eng.total - 0.01));
    E.vdir = E.story.voice?.defaultDir || 'voice';
    await loadWords();
  }
  async function loadWords() { try { const r = await fetch(new URL(E.vdir.replace(/\/?$/, '/') + 'words.json', location.origin + `/projects/${pid}/`), { cache: 'no-store' }); E.words = r.ok ? await r.json() : {}; } catch { E.words = {}; } }
  let updating = null, pendingUpdate = false;
  async function pushToEngine() {   // apply the edited story to the live engine (one update at a time; the latest wins)
    if (updating) { pendingUpdate = true; return updating; }
    updating = (async () => { try { await E.eng.update(E.compare ? compareStory() : E.story); } catch (e) { console.error(e); toast('Preview: ' + e.message, 'error'); } })();
    await updating; updating = null;
    if (pendingUpdate) { pendingUpdate = false; return pushToEngine(); }
    E.si = E.eng.sceneIndex; refreshAll(false);
  }

  // ---------- edits: commit → undo snapshot, mark manual, re-time, autosave ----------
  const save = debounce(async () => {
    app.setSaved('saving');
    try { await api.put(`/api/projects/${pid}/story`, E.story); app.setSaved('saved'); } catch (e) { app.setSaved('error'); toast('Could not save: ' + e.message, 'error'); }
  }, 900);
  E.commit = (label, fn, { scene = E.si, structural = false, rerenderInspector = true } = {}) => {
    const before = JSON.stringify(E.story);
    fn(E.story);
    if (JSON.stringify(E.story) === before) return;
    E.undoStack.push({ label, story: before, si: E.si }); if (E.undoStack.length > 120) E.undoStack.shift(); E.redoStack = [];
    if (scene != null && E.story.scenes[scene]) { E.story.scenes[scene].edited = true; delete E.story.scenes[scene].auto; }
    if (structural) syncDraft();
    app.setUndo(true, false); app.setSaved('dirty'); save();
    pushToEngine(); if (rerenderInspector) E.renderInspector(); E.renderTimeline(); renderScenes(); thumbLater(scene);
  };
  E.manual = (o) => { if (o && typeof o === 'object') delete o.auto; return o; };   // touched by hand → Manual badge
  function restore(entry, from, to) {
    to.push({ label: entry.label, story: JSON.stringify(E.story), si: E.si }); E.story = JSON.parse(entry.story);
    app.setUndo(E.undoStack.length > 0, E.redoStack.length > 0); app.setSaved('dirty'); save(); syncDraft();
    pushToEngine().then(() => { if (entry.si != null) seekScene(Math.min(entry.si, E.story.scenes.length - 1), false); });
    toast(`${from === E.undoStack ? 'Undid' : 'Redid'}: ${entry.label}`, 'info', 1600);
  }
  E.undo = () => { const e = E.undoStack.pop(); if (e) restore(e, E.undoStack, E.redoStack); };
  E.redo = () => { const e = E.redoStack.pop(); if (e) restore(e, E.redoStack, E.undoStack); };
  // keep the plain draft in step with scene order / lines / cast, so "Build again" and "Reset to auto" agree with the editor
  const saveDraft = debounce(() => api.put(`/api/projects/${pid}/draft`, E.draft).catch(() => {}), 1200);
  function syncDraft() {
    if (!E.draft) return; const old = new Map((E.draft.scenes || []).map((s) => [s.id, s]));
    E.draft.scenes = E.story.scenes.map((sc) => ({ ...(old.get(sc.id) || {}), id: sc.id, title: sc.title, place: sc.place, narration: sc.narration, characters: Object.keys(sc.actors || {}), talking: sc.talking }));
    for (const id of Object.keys(E.story.cast)) if (!E.draft.cast.find((c) => c.id === id)) { const c = E.story.cast[id]; E.draft.cast.push({ id, preset: c.cast || c.preset || id, label: id }); }
    saveDraft();
  }
  // the automatic version of a scene (what the stager makes from its line) — for "Reset to auto" and Auto-vs-Manual
  E.autoScene = async (id) => {
    syncDraft(); const r = await api.post(`/api/projects/${pid}/stage`, { draft: E.draft, save: false, keepEdits: false });
    return r.story.scenes.find((s) => s.id === id) || null;
  };
  let compareCache = null;
  function compareStory() { const s = clone(E.story); if (compareCache && s.scenes[E.si]) s.scenes[E.si] = { ...compareCache, id: s.scenes[E.si].id }; return s; }
  E.toggleCompare = async () => {
    E.compare = !E.compare;
    if (E.compare) { const sc = E.story.scenes[E.si]; compareCache = await E.autoScene(sc.id); if (!compareCache) { E.compare = false; return toast('No automatic version for this scene', 'error'); } }
    const t = E.eng.time; await pushToEngine(); E.eng.seek(t); renderPreviewTools(); drawBadges();
  };

  // ---------- selection + navigation ----------
  E.select = (sel, tab) => {
    E.sel = sel || { kind: 'scene' };
    if (tab) E.tab = tab;
    else if (sel?.kind === 'actor' || sel?.kind === 'beat') E.tab = sel.kind === 'beat' && sel.beatKind === 'sfx' ? 'sound' : sel.kind === 'beat' && sel.beatKind === 'text' ? 'text' : 'characters';
    else if (sel?.kind === 'prop') E.tab = 'props'; else if (sel?.kind === 'shot') E.tab = 'camera';
    E.eng.highlight(sel?.kind === 'actor' ? sel.id : sel?.kind === 'prop' ? sel.id : null);
    savePref(); E.renderInspector(); E.renderTimeline();
  };
  E.openTab = (tab) => { E.tab = tab === 'voice' ? 'sound' : tab === 'music' ? 'sound' : tab; savePref(); E.renderInspector(); };
  function seekScene(i, keepSel = true) {
    pause(); const e = E.eng.timeline[i]; if (!e) return;
    E.eng.seek(e.start + Math.min(0.6, e.dur * 0.15)); E.si = i; if (!keepSel || E.sel.kind !== 'scene') E.sel = { kind: 'scene' };
    E.eng.highlight(null); refreshAll(true);
  }
  E.seekScene = seekScene;
  E.seek = (t) => { const was = E.playing; pause(); E.eng.seek(Math.max(0, Math.min(t, E.eng.total - 0.001))); const i = E.eng.sceneIndex; const changed = i !== E.si; E.si = i; if (changed) { E.eng.highlight(null); refreshAll(true); } else { updatePlayhead(E); updateTime(); } if (was) play(); };

  // ---------- playback (audio clock drives the picture), with loop-the-scene ----------
  let sources = [], t0 = 0, ctxStart = 0, raf = 0;
  const stopAudio = () => { for (const s of sources) { try { s.stop(); } catch { /* already stopped */ } } sources = []; };
  function scheduleAudio(fromT) {
    stopAudio(); const ctx = E.eng.audioContext, eng = E.eng;
    eng.timeline.forEach((e, i) => {
      const buf = eng.audioFor(i); if (!buf) return; const off = fromT - e.start; if (off >= buf.duration) return;
      const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination);
      if (off >= 0) src.start(ctx.currentTime + 0.05, off); else src.start(ctx.currentTime + 0.05 - off); sources.push(src);
    });
    for (const c of eng.cues) {
      const buf = eng.sfxBuffer(c.file); if (!buf) continue; const end = c.start + (c.loop ? c.dur : buf.duration); if (end <= fromT) continue;
      const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = buf; src.loop = !!c.loop; src.connect(g); g.connect(ctx.destination);
      const when = ctx.currentTime + 0.05 + Math.max(0, c.start - fromT), off = Math.max(0, fromT - c.start);
      fadeGain(g.gain, c, off, when, end - Math.max(fromT, c.start));
      src.start(when, c.loop ? ((c.offset || 0) + off) % buf.duration : off); if (c.loop) src.stop(ctx.currentTime + 0.05 + (end - fromT)); sources.push(src);
    }
  }
  async function play() {
    if (E.free) setFree(false);
    const ctx = E.eng.audioContext; await ctx.resume(); let from = E.eng.time;
    if (from >= E.eng.total - 0.05) from = 0;
    if (E.loop) { const e = E.eng.timeline[E.si]; if (from < e.start || from >= e.start + e.dur - 0.05) from = e.start; }
    if (Math.abs(from - E.eng.time) > 1e-3) E.eng.seek(from);
    scheduleAudio(from); t0 = from; ctxStart = ctx.currentTime + 0.05; E.playing = true; renderPlay();
  }
  function pause() { if (!E.playing) return; E.playing = false; stopAudio(); renderPlay(); }
  E.play = play; E.pause = pause; E.toggle = () => (E.playing ? pause() : play());
  function tick() {
    raf = requestAnimationFrame(tick);
    if (!E.playing) return;
    const target = t0 + Math.max(0, E.eng.audioContext.currentTime - ctxStart), e = E.eng.timeline[E.si];
    if (E.loop && target >= e.start + e.dur) { pause(); E.eng.seek(e.start); play(); return; }
    const dt = target - E.eng.time; if (dt > 0) { const r = E.eng.step(Math.min(dt, 0.25)); if (r.ended) pause(); }
    if (E.eng.sceneIndex !== E.si) { E.si = E.eng.sceneIndex; renderScenes(); if (E.sel.kind !== 'scene') E.sel = { kind: 'scene' }; E.renderInspector(); }
    updatePlayhead(E); updateTime();
  }

  // ---------- scene list ----------
  let dragFrom = null;
  function renderScenes() {
    const tl = E.eng?.timeline || [];
    clear(scenesEl, h('div.head', h('h3', `Scenes (${E.story.scenes.length})`), btn('Add Scene', addScene, 'small ghost', 'plus')),
      h('div.slist', E.story.scenes.map((sc, i) => h('div.sitem' + (i === E.si ? '.on' : ''), {
        onclick: () => seekScene(i, false), draggable: true, ondragstart: () => (dragFrom = i), ondragover: (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }, ondragleave: (e) => e.currentTarget.classList.remove('drag-over'),
        ondrop: (e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); if (dragFrom == null || dragFrom === i) return; const f = dragFrom; dragFrom = null; E.commit('Reorder scenes', (s) => { const [m] = s.scenes.splice(f, 1); s.scenes.splice(i, 0, m); }, { scene: null, structural: true }); },
      }, h('span.n', String(i + 1)), h('div.th', { style: E.thumbs[sc.id] ? { backgroundImage: `url(${E.thumbs[sc.id]})` } : {} }),
        h('div.tx', h('b', sc.title || sc.narration.slice(0, 40)), h('small', `${tl[i] ? tl[i].dur.toFixed(1) : '…'}s · `, h('span', { class: sc.edited ? 'faint' : 'faint' }, sc.edited ? 'Manual' : 'Auto'))),
        h('button.icon-btn.sm', { title: 'Scene menu', onclick: (e) => { e.stopPropagation(); sceneMenu(e, i); } }, icon('dots', 14))))));
  }
  function sceneMenu(ev, i) {
    const sc = E.story.scenes[i];
    menu(ev, [
      ['Duplicate scene', 'copy', () => E.commit('Duplicate scene', (s) => { const c = clone(sc); c.id = Math.max(...s.scenes.map((x) => x.id)) + 1; c.title = (c.title || '') + ' (copy)'; s.scenes.splice(i + 1, 0, c); }, { scene: i + 1, structural: true })],
      ['Move up', 'up', () => i > 0 && E.commit('Move scene', (s) => { [s.scenes[i - 1], s.scenes[i]] = [s.scenes[i], s.scenes[i - 1]]; }, { scene: null, structural: true })],
      ['Move down', 'down', () => i < E.story.scenes.length - 1 && E.commit('Move scene', (s) => { [s.scenes[i + 1], s.scenes[i]] = [s.scenes[i], s.scenes[i + 1]]; }, { scene: null, structural: true })],
      null,
      ['Reset scene to auto', 'refresh', async () => { const a = await E.autoScene(sc.id); if (a) E.commit('Reset scene to auto', (s) => { s.scenes[i] = a; }, { scene: null }); }],
      ['Remake this voice line', 'mic', () => E.remakeVoice([sc.id])],
      null,
      ['Delete scene', 'trash', async () => { if (E.story.scenes.length > 1 && await confirmBox('Delete scene?', `Scene ${i + 1}: "${sc.title}"`, 'Delete', true)) E.commit('Delete scene', (s) => { s.scenes.splice(i, 1); }, { scene: null, structural: true }); }],
    ]);
  }
  async function addScene() {
    const ta = h('textarea.input', { rows: 3, placeholder: 'What the narrator says…' }), pl = select(lib.places.map((p) => [p, p]), E.story.scenes[E.si]?.place || 'home', () => {});
    const m = modal('Add a scene', [h('label.field', h('span', 'Narration'), ta), h('label.field', h('span', 'Place'), pl), h('p.small.muted', 'It is staged automatically (people, camera, props from the words). It goes after the current scene.')],
      { actions: [{ label: 'Cancel', value: null }, { label: 'Add scene', cls: 'primary', run: (c) => c({ narration: ta.value.trim(), place: pl.value }) }] });
    setTimeout(() => ta.focus(), 30);
    const v = await m.done; if (!v || !v.narration) return;
    const id = Math.max(0, ...E.story.scenes.map((s) => s.id)) + 1, at = E.si + 1, cur = E.story.scenes[E.si];
    syncDraft(); E.draft.scenes.splice(at, 0, { id, title: `Scene ${E.story.scenes.length + 1}`, place: v.place, narration: v.narration, characters: Object.keys(cur?.actors || {}).filter((a) => a === E.story.hero || !['cat', 'planet'].includes(a)).slice(0, 2) });
    const r = await api.post(`/api/projects/${pid}/stage`, { draft: E.draft, save: false, keepEdits: false });
    const staged = r.story.scenes.find((s) => s.id === id);
    E.commit('Add scene', (s) => { if (at === s.scenes.length) { const last = s.scenes[s.scenes.length - 1]; if (last) { last.props = (last.props || []).filter((p) => !p.endCard); } } s.scenes.splice(at, 0, staged); }, { scene: null, structural: true });
    await updating; seekScene(at); toast('Scene added — make its voice line in Sound → Voice line', 'ok', 4500);
  }

  // ---------- preview ----------
  let stageEl, boxEl, hitEl, overEl, playEl, toolsEl;
  function buildPreview() {
    toolsEl = h('div.pv-tools'); stageEl = h('div.pv-stage'); boxEl = h('div.pv-box'); overEl = h('div.pv-over'); hitEl = h('div.pv-hit');
    playEl = h('div.pv-play');
    boxEl.append(E.eng.canvas, overEl, hitEl, h('div.pv-badge')); stageEl.append(boxEl);
    clear(previewEl, toolsEl, stageEl, playEl); fitBox(); renderPreviewTools(); renderPlay(); drawOverlay(); bindPointer();
  }
  function fitBox() { const [w, hh] = ASPECTS[E.aspect], r = stageEl.getBoundingClientRect(), a = w / hh; let bw = r.width, bh = r.width / a; if (bh > r.height) { bh = r.height; bw = bh * a; } boxEl.style.width = Math.floor(bw) + 'px'; boxEl.style.height = Math.floor(bh) + 'px'; }
  const ro = new ResizeObserver(() => boxEl && fitBox());
  function renderPreviewTools() {
    clear(toolsEl,
      select(Object.keys(ASPECTS).map((a) => [a, a + ({ '9:16': ' (Reels)', '16:9': ' (YouTube)', '1:1': ' (Square)', '4:5': ' (Feed)' }[a] || '')]), E.aspect, async (v) => { E.aspect = v; savePref(); await reengine(); }),
      h('button.btn.small' + (E.free ? '.on' : ''), { onclick: () => setFree(!E.free), title: 'Free view: drag to orbit, scroll to zoom, shift-drag to pan (F)' }, icon(E.free ? 'orbit' : 'camera', 15), E.free ? 'Free view' : 'Camera view'),
      h('button.icon-btn' + (E.moveTool ? '.on' : ''), { title: 'Move the selected character / prop by dragging on the floor (M)', onclick: () => { E.moveTool = !E.moveTool; renderPreviewTools(); hitEl.classList.toggle('moving', E.moveTool); } }, icon('move', 16)),
      h('button.icon-btn' + (E.safe ? '.on' : ''), { title: 'Safe area (where phone apps put their buttons)', onclick: () => { E.safe = !E.safe; savePref(); renderPreviewTools(); drawOverlay(); } }, icon('safe', 16)),
      h('button.icon-btn' + (E.grid ? '.on' : ''), { title: 'Thirds grid (G)', onclick: () => { E.grid = !E.grid; savePref(); renderPreviewTools(); drawOverlay(); } }, icon('grid', 16)),
      btn('Set start', () => E.setShotEnd('start'), 'small', null, 'Use this view as the start of the current camera shot'),
      btn('Set end', () => E.setShotEnd('end'), 'small', null, 'Use this view as the end of the current camera shot (the camera travels there)'),
      h('button.btn.small' + (E.compare ? '.on' : ''), { onclick: E.toggleCompare, title: 'See the automatic version of this scene' }, E.compare ? 'Showing: Auto' : 'Auto vs Manual'),
      h('div', { style: { flex: 1 } }),
      select([['full', 'Full quality'], ['half', 'Half quality (smooth)'], ['low', 'Fast preview']], E.quality, async (v) => { E.quality = v; savePref(); await reengine(); }));
  }
  function drawOverlay() { clear(overEl, E.safe ? h('div.safe') : null, E.grid ? h('div.grid3') : null); drawBadges(); }
  function drawBadges() { const b = boxEl?.querySelector('.pv-badge'); if (!b) return; clear(b, E.free ? h('span', 'FREE VIEW') : null, E.compare ? h('span', { style: { background: '#0369a1' } }, 'AUTO version') : null, E.moveTool ? h('span', 'MOVE') : null); }
  async function reengine() { pause(); clear(stageEl, h('div.loading', h('div.spinner'), 'Rebuilding…')); await makeEngine(); buildPreview(); refreshAll(true); }
  function renderPlay() {
    if (!playEl) return;
    clear(playEl,
      h('button.icon-btn', { title: 'Previous scene (↑)', onclick: () => seekScene(Math.max(0, E.si - 1)) }, icon('prev', 15)),
      h('button.icon-btn', { title: 'Back one frame (←)', onclick: () => E.seek(E.eng.time - 1 / E.eng.fps) }, icon('stepb', 15)),
      h('button.icon-btn', { title: 'Play / pause (space)', onclick: E.toggle, style: { width: '42px', background: 'var(--p)', color: '#fff', borderColor: 'var(--p)' } }, icon(E.playing ? 'pause' : 'play', 16)),
      h('button.icon-btn', { title: 'Forward one frame (→)', onclick: () => E.seek(E.eng.time + 1 / E.eng.fps) }, icon('stepf', 15)),
      h('button.icon-btn', { title: 'Next scene (↓)', onclick: () => seekScene(Math.min(E.story.scenes.length - 1, E.si + 1)) }, icon('next', 15)),
      h('button.icon-btn' + (E.loop ? '.on' : ''), { title: 'Loop this scene (L)', onclick: () => { E.loop = !E.loop; renderPlay(); } }, icon('loop', 15)),
      h('span.time#pvtime', ''),
      h('input.range.scrub', { type: 'range', min: 0, max: E.eng.total, step: 0.01, value: E.eng.time, oninput: (e) => E.seek(+e.target.value) }));
    updateTime();
  }
  function updateTime() { const t = $('#pvtime', playEl); if (t) t.textContent = `${fmtTime(E.eng.time)} / ${fmtTime(E.eng.total)}`; const s = $('.scrub', playEl); if (s) { s.max = E.eng.total; s.value = E.eng.time; s.style.setProperty('--fill', (E.eng.time / E.eng.total * 100) + '%'); } }

  // ---------- free view camera + picking + move handles ----------
  const orbit = { yaw: 0, pitch: 0.3, dist: 4, target: null };
  function setFree(on) {
    E.free = on;
    if (on) {
      pause(); const c = E.eng.cameraNow(); orbit.target = c.look.clone(); const d = c.pos.clone().sub(c.look); orbit.dist = d.length(); orbit.yaw = Math.atan2(d.x, d.z); orbit.pitch = Math.asin(Math.max(-0.99, Math.min(0.99, d.y / orbit.dist)));
      applyOrbit();
    } else E.eng.setFreeCamera(null);
    hitEl?.classList.toggle('free', on); renderPreviewTools(); drawBadges();
  }
  function applyOrbit() {
    const T = THREE, p = orbit.target.clone().add(new T.Vector3(Math.sin(orbit.yaw) * Math.cos(orbit.pitch), Math.sin(orbit.pitch), Math.cos(orbit.yaw) * Math.cos(orbit.pitch)).multiplyScalar(orbit.dist));
    E.eng.setFreeCamera(p, orbit.target);
  }
  function ndc(e) { const r = E.eng.canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1]; }
  function bindPointer() {
    let drag = null;
    hitEl.addEventListener('pointerdown', (e) => {
      hitEl.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, moved: false, shift: e.shiftKey };
      if (E.moveTool && (E.sel.kind === 'actor' || E.sel.kind === 'prop')) { pause(); drag.move = true; drag.before = JSON.stringify(E.story); }
    });
    hitEl.addEventListener('pointermove', (e) => {
      if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      if (drag.move) {   // drag the selected thing across the floor of the place
        const [nx, ny] = ndc(e), sc = E.story.scenes[E.si], isA = E.sel.kind === 'actor', obj = isA ? sc.actors[E.sel.id] : (sc.props || [])[E.sel.i];
        if (!obj || obj.attach) return; const y = isA ? 0 : obj.at[1]; const p = E.eng.floorPoint(nx, ny, y); if (!p) return;
        obj.at = [r2(p.x), obj.at[1], r2(p.z)]; delete obj.auto; liveMove(); return;
      }
      if (E.free) {
        if (drag.shift || e.buttons === 4) { const T = THREE, right = new T.Vector3(Math.cos(orbit.yaw), 0, -Math.sin(orbit.yaw)); orbit.target.addScaledVector(right, -dx * orbit.dist * 0.0016); orbit.target.y += dy * orbit.dist * 0.0016; }
        else { orbit.yaw -= dx * 0.006; orbit.pitch = Math.max(-0.15, Math.min(1.25, orbit.pitch + dy * 0.004)); }
        drag.x = e.clientX; drag.y = e.clientY; applyOrbit();
      }
    });
    hitEl.addEventListener('pointerup', (e) => {
      const d = drag; drag = null; if (!d) return;
      if (d.move && d.moved) { const after = E.story; E.story = JSON.parse(d.before); E.commit('Move ' + (E.sel.id || 'item'), (s) => { const sc = s.scenes[E.si], src = after.scenes[E.si]; if (E.sel.kind === 'actor') sc.actors[E.sel.id].at = src.actors[E.sel.id].at; else sc.props[E.sel.i].at = src.props[E.sel.i].at; }); return; }
      if (!d.moved) {   // click: pick what's under the pointer
        const [nx, ny] = ndc(e), hit = E.eng.pick(nx, ny);
        if (hit) { const sc = E.story.scenes[E.si]; E.select(hit.kind === 'actor' ? { kind: 'actor', id: hit.id } : { kind: 'prop', id: hit.id, i: (sc.props || []).findIndex((p) => p.id === hit.id) }); } else E.select({ kind: 'scene' });
      }
    });
    hitEl.addEventListener('wheel', (e) => { if (!E.free) return; e.preventDefault(); orbit.dist = Math.max(0.3, Math.min(30, orbit.dist * Math.exp(e.deltaY * 0.0012))); applyOrbit(); }, { passive: false });
  }
  const liveMove = (() => { let busy = false; return async () => { if (busy) return; busy = true; await E.eng.update(E.story); E.eng.highlight(E.sel.id); if (E.free) applyOrbit(); busy = false; }; })();

  // Set start / Set end: the current view (free view or planned) becomes a placed camera shot
  E.currentShot = () => {
    const e = E.eng.timeline[E.si], f = (E.eng.time - e.start) / e.dur, segs = e.scene.camera || [];
    if (E.sel.kind === 'shot' && E.sel.si === E.si) return E.sel.k;
    let k = 0; for (; k < segs.length; k++) if (f < (segs[k].until ?? 1) || k === segs.length - 1) break; return k;
  };
  E.setShotEnd = async (which) => {
    const T = THREE, si = E.si, k = E.currentShot(), sc = E.story.scenes[si]; if (!sc.camera || !sc.camera[k]) { E.commit('Add camera shot', (s) => { s.scenes[si].camera = [{ move: 'hold', focus: Object.keys(sc.actors || {}) }]; }); return; }
    const o = E.eng.placeOrigin(si), now = E.eng.cameraNow(), rel = (v) => v.clone().sub(o).toArray().map(r2);
    let start = null;
    if (sc.camera[k].move !== 'fixed' && which === 'end') {   // the shot's planned start becomes the fixed start
      const free = E.eng.freeCamera, t = E.eng.time, e = E.eng.timeline[si], st = k ? (e.scene.camera[k - 1].until ?? 0) : 0;
      E.eng.setFreeCamera(null); E.eng.seek(e.start + st * e.dur + 0.01); start = E.eng.cameraNow(); E.eng.seek(t); if (free) E.eng.setFreeCamera(free.pos, free.look);
    }
    E.commit(which === 'start' ? 'Set shot start' : 'Set shot end', (s) => {
      const c = s.scenes[si].camera[k]; delete c.auto;
      if (c.move !== 'fixed') { const keep = { until: c.until, untilWord: c.untilWord, untilOffset: c.untilOffset }; for (const key of Object.keys(c)) delete c[key]; Object.assign(c, { move: 'fixed' }, keep); for (const key of Object.keys(c)) if (c[key] == null) delete c[key]; if (start) { c.pos = rel(start.pos); c.look = rel(start.look); } }
      if (which === 'start') { c.pos = rel(now.pos); c.look = rel(now.look); if (!c.toPos) { delete c.toPos; delete c.toLook; } }
      else { c.toPos = rel(now.pos); c.toLook = rel(now.look); if (!c.pos) { c.pos = c.toPos; c.look = c.toLook; } }
    });
    if (E.free) setFree(false);
    E.select({ kind: 'shot', si, k }, 'camera'); toast(which === 'start' ? 'Shot start set — the camera starts from this view' : 'Shot end set — the camera travels to this view', 'ok');
  };

  // ---------- voice ----------
  E.remakeVoice = async (ids) => {
    save.flush(); await new Promise((r) => setTimeout(r, 300));
    try { await api.post(`/api/projects/${pid}/voice`, { scenes: ids }); toast(ids?.length ? `Making voice line${ids.length > 1 ? 's' : ''} ${ids.join(', ')} — keep editing, it updates when done` : 'Making the voice…', 'info', 4500); } catch (e) { toast(e.message, 'error'); }
  };
  E.voiceState = P.voice;

  // ---------- thumbnails (scene list + timeline) ----------
  const thumbQueue = new Set(); let thumbBusy = false;
  function thumbLater(i) { if (i == null) E.story.scenes.forEach((_, k) => thumbQueue.add(k)); else thumbQueue.add(i); setTimeout(runThumbs, 600); }
  async function runThumbs() {
    if (thumbBusy || E.playing || !thumbQueue.size || updating) return; thumbBusy = true;
    const t = E.eng.time, free = E.eng.freeCamera, hi = E.sel; E.eng.setFreeCamera(null); E.eng.highlight(null);
    const c = document.createElement('canvas'); c.width = 184; c.height = 112;
    for (const i of [...thumbQueue]) {
      thumbQueue.delete(i); const e = E.eng.timeline[i]; if (!e) continue;
      E.eng.seek(e.start + Math.min(e.dur * 0.45, 2.5)); const g = c.getContext('2d'), src = E.eng.canvas, sw = src.width, sh = sw * 112 / 184;
      g.drawImage(src, 0, Math.max(0, (src.height - sh) * 0.45), sw, Math.min(sh, src.height), 0, 0, 184, 112);
      E.thumbs[e.scene.id] = c.toDataURL('image/jpeg', 0.7); await new Promise((r) => setTimeout(r, 0));
      if (E.playing) break;
    }
    E.eng.seek(t); if (free) E.eng.setFreeCamera(free.pos, free.look); E.eng.highlight(hi.kind === 'actor' || hi.kind === 'prop' ? hi.id : null); thumbBusy = false; renderScenes(); E.renderTimeline();
  }

  // ---------- version history ----------
  E.history = async () => {
    const list = await api.get(`/api/projects/${pid}/history`);
    const m = modal('Version history', h('div', list.length ? list.map((v) => h('div.item', h('span.grow', h('b', v.label || 'Autosave'), h('span.muted', ` · ${ago(v.saved)} · ${v.scenes} scenes`)), btn('Restore', async () => {
      if (!(await confirmBox('Restore this version?', 'The current version is kept in the history too, so you can come back.', 'Restore'))) return;
      const r = await api.post(`/api/projects/${pid}/history/${v.file}/restore`); E.undoStack.push({ label: 'Restore version', story: JSON.stringify(E.story), si: E.si }); E.story = r.story; app.setUndo(true, false); app.setSaved('saved'); m.close(); await pushToEngine(); seekScene(0); toast('Version restored', 'ok');
    }, 'small'))) : h('p.muted', 'No earlier versions yet — every save keeps the version before it.')), { wide: false });
  };
  E.shortcuts = () => modal('Keyboard shortcuts', h('div', [['Space', 'Play / pause'], ['← / →', 'One frame back / forward'], ['⇧← / ⇧→', 'One second back / forward'], ['↑ / ↓', 'Previous / next scene'], ['⌘Z / ⇧⌘Z', 'Undo / redo'], ['Delete', 'Delete the selected timeline item'], ['S', 'Split the camera shot at the playhead'], ['F', 'Free view on / off'], ['M', 'Move tool'], ['G', 'Thirds grid'], ['L', 'Loop this scene'], ['⌘S', 'Save now'], ['?', 'This list']].map(([k, d]) => h('div.frow', h('label', h('span.kbd', k)), h('div.fctl', d)))));

  // ---------- refresh ----------
  E.renderInspector = () => renderInspector(E, inspEl);
  E.renderTimeline = () => renderTimeline(E, tlEl);
  E.refreshScenes = renderScenes;
  function refreshAll(full = true) { renderScenes(); E.renderInspector(); E.renderTimeline(); updateTime(); if (full) renderPlay(); }

  // ---------- keyboard ----------
  function onKey(e) {
    if (e.target.closest('input, textarea, select, [contenteditable]')) { if (e.key === 'Escape') e.target.blur(); return; }
    if ($('.modal-bg')) return;
    const k = e.key, mod = e.metaKey || e.ctrlKey;
    if (mod && k.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? E.redo() : E.undo(); return; }
    if (mod && k.toLowerCase() === 's') { e.preventDefault(); save.flush(); return; }
    if (mod) return;
    const step = 1 / E.eng.fps;
    switch (k) {
      case ' ': e.preventDefault(); E.toggle(); break;
      case 'ArrowLeft': e.preventDefault(); E.seek(E.eng.time - (e.shiftKey ? 1 : step)); break;
      case 'ArrowRight': e.preventDefault(); E.seek(E.eng.time + (e.shiftKey ? 1 : step)); break;
      case 'ArrowUp': e.preventDefault(); seekScene(Math.max(0, E.si - 1)); break;
      case 'ArrowDown': e.preventDefault(); seekScene(Math.min(E.story.scenes.length - 1, E.si + 1)); break;
      case 'Delete': case 'Backspace': e.preventDefault(); E.deleteSelected?.(); break;
      case 's': case 'S': E.split?.(); break;
      case 'f': case 'F': setFree(!E.free); break;
      case 'm': case 'M': E.moveTool = !E.moveTool; renderPreviewTools(); drawBadges(); break;
      case 'g': case 'G': E.grid = !E.grid; savePref(); renderPreviewTools(); drawOverlay(); break;
      case 'l': case 'L': E.loop = !E.loop; renderPlay(); break;
      case '?': E.shortcuts(); break;
      case 'Escape': E.select({ kind: 'scene' }); break;
      default:
    }
  }
  document.addEventListener('keydown', onKey);

  // ---------- timeline height drag ----------
  E.resizeTimeline = (e) => {
    const y0 = e.clientY, h0 = parseInt(getComputedStyle(root).getPropertyValue('--tl-h')) || 300;
    const mv = (ev) => { const nh = Math.max(170, Math.min(innerHeight * 0.6, h0 - (ev.clientY - y0))); root.style.setProperty('--tl-h', nh + 'px'); };
    const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); fitBox(); try { localStorage.setItem('zs-ed', JSON.stringify({ ...JSON.parse(localStorage.getItem('zs-ed') || '{}'), tlh: parseInt(root.style.getPropertyValue('--tl-h')) })); } catch { /* ignore */ } };
    addEventListener('pointermove', mv); addEventListener('pointerup', up);
  };
  E.savePref = savePref;

  // ---------- go ----------
  await makeEngine();
  buildPreview(); ro.observe(stageEl);
  E.si = 0; refreshAll(true); raf = requestAnimationFrame(tick); thumbLater(null);
  app.setSaved('saved'); app.setUndo(false, false);
  return {
    undo: E.undo, redo: E.redo, openTab: E.openTab,
    dirty: () => app && $('#saved')?.classList.contains('dirty'), flush: () => save.flush(),
    onEvent: async (ev) => {
      if (ev.type === 'voice' && ev.project === pid) { P = await app.reloadProject(); E.voiceState = P.voice; const st = P.story; if (st?.voice) E.story.voice = st.voice; E.vdir = E.story.voice?.defaultDir || 'voice'; await E.eng.reloadVoice(E.vdir); await loadWords(); E.eng.update(E.story); refreshAll(true); toast('Voice updated — timings follow the new lines', 'ok'); }
    },
    unmount: () => { save.flush(); pause(); cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('keydown', onKey); E.eng?.audioContext?.close?.().catch(() => {}); },
  };
}

const r2 = (v) => Math.round(v * 100) / 100;
// volume with the music's fade in / fade out, from wherever playback starts (off = seconds into the cue, left = seconds still to play)
export function fadeGain(gain, c, off, when, left) {
  const v = c.vol, fi = c.fadeIn || 0, fo = c.fadeOut || 0, total = off + left;
  const at = (t) => v * Math.min(fi > 0 ? Math.min(1, t / fi) : 1, fo > 0 ? Math.min(1, Math.max(0, (total - t) / fo)) : 1);
  gain.setValueAtTime(at(off), when);
  if (fi > 0 && off < fi) gain.linearRampToValueAtTime(v, when + (fi - off));
  if (fo > 0) { const s = Math.max(off, total - fo); gain.setValueAtTime(at(s), when + (s - off)); gain.linearRampToValueAtTime(0, when + left); }
}
function aspectOf(st) { const f = st.format || {}; const w = f.width || 1080, hh = f.height || 1920; return w > hh ? '16:9' : w === hh ? '1:1' : '9:16'; }
export function menu(ev, items) {
  document.querySelector('.menu')?.remove();
  const m = h('div.menu', items.map((it) => (it ? h('button', { onclick: () => { m.remove(); it[2](); } }, icon(it[1], 15), it[0]) : h('hr'))));
  document.body.append(m); const r = m.getBoundingClientRect(); m.style.left = Math.min(ev.clientX, innerWidth - r.width - 8) + 'px'; m.style.top = Math.min(ev.clientY, innerHeight - r.height - 8) + 'px';
  setTimeout(() => document.addEventListener('mousedown', function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('mousedown', off); } }), 0);
}
export { TABS };
