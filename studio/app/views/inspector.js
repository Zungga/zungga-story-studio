// Inspector: Scene · Characters · Camera · Props · Lighting & look · Text · Sound · FX.
// Every value shows whether it is Auto (made by the stager) or Manual (changed by you), with Reset to auto.
import { h, clear, icon, btn, toast, select, row, slider, num, toggle, chips, color, modal, clone } from '../ui.js';
import { api } from '../api.js';
import { wordsOf, setTiming, pretty, ANIMS } from './timeline.js';
import { musicSection } from './music.js';
import { placeLabel } from './story.js';

export const TABS = [['scene', 'Scene'], ['characters', 'Characters'], ['camera', 'Camera'], ['props', 'Props'], ['look', 'Lighting'], ['text', 'Text'], ['sound', 'Sound'], ['fx', 'FX']];
const EXPRS = ['neutral', 'smile', 'big_smile', 'sad', 'surprised', 'thinking', 'worried', 'determined', 'idea', 'stern', 'confused', 'dizzy', 'angry'];
const MOVES = [['push_in', 'Push in'], ['pull_back', 'Pull back'], ['hold', 'Hold'], ['pan', 'Pan'], ['orbit', 'Orbit'], ['low_angle', 'Low angle'], ['dolly_forward', 'Dolly forward'], ['fixed', 'Placed (start → end)']];
const LIGHTS = {
  'Warm home': { brightness: 0.52, warmth: 0.72, saturation: 0.6, glow: 0.5, dof: 0.46, vignette: 0.48, sun: 0.6, sunAngle: 35, sunHeight: 0.45, ambient: 0.45 },
  'Bright day': { brightness: 0.5, warmth: 0.5, saturation: 0.6, glow: 0.3, dof: 0.35, vignette: 0.35, sun: 0.6, sunAngle: 30, sunHeight: 0.8, ambient: 0.55 },
  'Golden hour': { brightness: 0.48, warmth: 0.9, saturation: 0.66, glow: 0.72, dof: 0.5, vignette: 0.55, sun: 0.7, sunAngle: 75, sunHeight: 0.18, ambient: 0.35 },
  Evening: { brightness: 0.38, warmth: 0.75, saturation: 0.5, glow: 0.55, dof: 0.5, vignette: 0.65, sun: 0.3, sunAngle: 95, sunHeight: 0.12, ambient: 0.3 },
  Night: { brightness: 0.27, warmth: 0.22, saturation: 0.38, glow: 0.6, dof: 0.45, vignette: 0.75, sun: 0.1, sunAngle: 140, sunHeight: 0.5, ambient: 0.2 },
  'Rainy grey': { brightness: 0.4, warmth: 0.32, saturation: 0.35, glow: 0.25, dof: 0.35, vignette: 0.6, sun: 0.1, ambient: 0.35 },
  'Soft dream': { brightness: 0.45, warmth: 0.68, saturation: 0.5, glow: 0.85, dof: 0.6, vignette: 0.7, sun: 0.15, ambient: 0.25 },
};
const TIMES = { morning: 'Bright day', day: 'Bright day', 'golden hour': 'Golden hour', evening: 'Evening', night: 'Night' };
const r2 = (v) => Math.round(v * 100) / 100;
const deg = (r) => Math.round((r || 0) * 180 / Math.PI);

export function renderInspector(E, el) {
  const sc = E.story.scenes[E.si]; if (!sc) return;
  const keepScroll = el.querySelector('.insp-body')?.scrollTop || 0;
  const body = h('div.insp-body');
  const ctx = mk(E, sc);
  const tabsEl = h('div.tabs', TABS.map(([k, l]) => h('button.tab' + (E.tab === k ? '.on' : ''), { onclick: () => { E.tab = k; E.savePref(); renderInspector(E, el); } }, l)));
  ({ scene: sceneTab, characters: charTab, camera: camTab, props: propsTab, look: lookTab, text: textTab, sound: soundTab, fx: fxTab }[E.tab] || sceneTab)(ctx, body);
  clear(el, tabsEl, selBar(ctx), body);
  body.scrollTop = keepScroll;
}

// ---------- shared context: set values (with undo), live sliders, word pickers ----------
function mk(E, sc) {
  const si = E.si;
  const set = (label, fn, opts) => E.commit(label, (st) => fn(st.scenes[si], st), opts);
  let liveBefore = null, liveBusy = false, liveAgain = false;
  const pushLive = async () => { if (liveBusy) { liveAgain = true; return; } liveBusy = true; await E.eng.update(E.story); liveBusy = false; if (liveAgain) { liveAgain = false; pushLive(); } };
  // slider-friendly: preview while dragging, one undo step when let go
  const live = (label, fn) => (v, final) => {
    if (!liveBefore) liveBefore = JSON.stringify(E.story);
    if (!final) { fn(E.story.scenes[si], v, E.story); pushLive(); return; }
    E.story = JSON.parse(liveBefore); liveBefore = null; set(label, (s, st) => fn(s, v, st), { rerenderInspector: false });
  };
  const words = () => wordsOf(E, si);
  const wordSel = (value, onchange, none = '— not on a word —') => select([['', none], ...words().map((w) => [w.spec, `${w.spec}  (${w.s.toFixed(1)}s)`])], value || '', (v) => onchange(v || null), { style: { fontSize: '12px' } });
  const tLocal = () => E.eng.time - E.eng.timeline[si].start;
  const cast = E.story.cast, actorIds = Object.keys(sc.actors || {});
  const props = () => E.lib.props.filter((p) => !['sets'].includes(p.category)).concat(E.lib.uploads);
  return { E, sc, si, set, live, words, wordSel, tLocal, cast, actorIds, props };
}
const sec = (title, kids, right = null) => h('div.isec', h('div.isec-h', h('h4', title), right), kids);
const badge = (auto) => h('span.badge.' + (auto ? 'auto' : 'manual'), auto ? 'Auto' : 'Manual');

// "Selected:" bar — what you're editing, Auto/Manual, Reset to auto, Apply to all scenes
function selBar(c) {
  const { E, sc, si } = c, s = E.sel;
  let label = `Scene ${si + 1} · ${sc.title || ''}`, auto = !sc.edited, reset = null, apply = null;
  if (s.kind === 'actor' && sc.actors?.[s.id]) { label = `${s.id} in scene ${si + 1}`; auto = !!sc.actors[s.id].auto || !sc.edited; reset = async () => { const a = await E.autoScene(sc.id); if (!a) return; c.set('Reset character to auto', (x) => { if (a.actors?.[s.id]) x.actors[s.id] = a.actors[s.id]; x.beats = (x.beats || []).filter((b) => b.actor !== s.id).concat((a.beats || []).filter((b) => b.actor === s.id)); }); }; }
  else if (s.kind === 'prop') { const p = (sc.props || [])[s.i]; if (p) { label = `Prop · ${p.id}`; auto = !!p.auto; } }
  else if (s.kind === 'shot' && s.si === si) { const cam = sc.camera?.[s.k]; if (cam) { label = `Camera shot ${s.k + 1} · ${cam.move === 'fixed' ? 'Placed' : pretty(cam.move)}`; auto = !!cam.auto; } reset = async () => { const a = await E.autoScene(sc.id); if (a) c.set('Reset camera to auto', (x) => { x.camera = a.camera; }); }; }
  else if (s.kind === 'beat' && s.si === si) { label = s.beatKind === 'sfx' ? 'Sound effect' : s.beatKind === 'text' ? (s.what === 'caption' ? 'Caption' : 'Money counter') : s.beatKind === 'expr' ? 'Expression change' : 'Action'; const b = s.beatKind === 'sfx' ? sc.sfx?.[s.k] : s.beatKind === 'text' ? null : sc.beats?.[s.k]; auto = !!b?.auto; }
  if (E.tab === 'look') { label = `Lighting & look · scene ${si + 1}`; auto = !sc.light; reset = sc.light ? () => c.set('Lighting back to auto', (x) => { delete x.light; }) : null; apply = sc.light ? () => E.commit('Lighting on every scene', (st) => { for (const x of st.scenes) { x.light = clone(sc.light); x.edited = true; } }, { scene: null }) : null; }
  if (E.tab === 'fx') { label = `Effects · scene ${si + 1}`; auto = !sc.fx; reset = sc.fx ? () => c.set('Effects off', (x) => { delete x.fx; }) : null; apply = sc.fx ? () => E.commit('Effects on every scene', (st) => { for (const x of st.scenes) { x.fx = { ...(x.fx || {}), transition: sc.fx.transition, transitionOut: sc.fx.transitionOut }; x.edited = true; } }, { scene: null }) : null; }
  if (s.kind === 'scene' && !['look', 'fx'].includes(E.tab)) reset = sc.edited ? async () => { const a = await E.autoScene(sc.id); if (a) c.set('Reset scene to auto', (x, st) => { st.scenes[si] = a; }, { scene: null }); } : null;
  return h('div.selbar', h('span', 'Selected:'), h('b.grow', label), badge(auto),
    apply ? h('button.link-btn', { onclick: apply, title: 'Use these settings on every scene' }, 'All scenes') : null,
    reset ? h('button.link-btn', { onclick: reset, title: 'Go back to what the studio picked automatically' }, icon('refresh', 13), 'Reset to auto') : null);
}

// ---------- Scene ----------
function sceneTab(c, body) {
  const { E, sc, set, live } = c, wet = sc.weather?.type === 'rain';
  body.append(
    sec('Scene settings', [
      row('Title', h('input.input', { value: sc.title || '', onchange: (e) => set('Scene title', (s) => { s.title = e.target.value; }) })),
      row('Place', select(E.lib.places.map((p) => [p, placeLabel(p)]), sc.place, (v) => set('Change place', (s) => { s.place = v; }, { structural: true }))),
      row('Mood', select([['', 'Normal'], ['soft', 'Soft / dreamy (spotlight)']], sc.mood || '', (v) => set('Change mood', (s) => { if (v) s.mood = v; else delete s.mood; }))),
      row('Season', select([['', 'Auto'], ['spring', 'Spring 🌸'], ['summer', 'Summer ☀'], ['autumn', 'Autumn 🍂 (leaves on the ground)'], ['winter', 'Winter ❄ (snow)']], sc.season || '', (v) => set('Season', (s) => { if (v) s.season = v; else delete s.season; }))),
      row('Weather', select([['clear', 'Clear'], ['rain', 'Rain'], ['snow', 'Snow']], sc.weather?.type || 'clear', (v) => set('Change weather', (s) => { if (v === 'snow') { s.weather = { type: 'snow' }; if (s.ambience?.file === 'rain-loop.wav') delete s.ambience; return; } if (v === 'rain') { s.weather = { type: 'rain', thunder: s.weather?.thunder || [] }; s.ambience = s.ambience || { file: 'rain-loop.wav', vol: 0.12 }; } else { delete s.weather; if (s.ambience?.file === 'rain-loop.wav') delete s.ambience; } }))),
      wet ? row('Thunder', h('div', { style: { display: 'grid', gap: '4px', width: '100%' } }, (sc.weather.thunder || []).map((th, k) => h('div.fctl', c.wordSel(typeof th === 'object' ? th.word : '', (w) => set('Thunder timing', (s) => { s.weather.thunder[k] = w ? { word: w, offset: 0.2 } : 0.3; })), h('button.icon-btn.sm', { onclick: () => set('Remove thunder', (s) => { s.weather.thunder.splice(k, 1); }) }, icon('x', 13)))), h('button.link-btn', { onclick: () => set('Add thunder', (s) => { s.weather.thunder = s.weather.thunder || []; const x = {}; setTiming(E, x, c.si, c.tLocal(), ['word', 'offset', 'at']); s.weather.thunder.push(x.word ? { word: x.word, offset: 0.2 } : x.at); }) }, '+ Thunder flash at the playhead'))) : null,
      row('Time of day', select([['', 'Auto (from the place)'], ...Object.keys(TIMES).map((t) => [t, pretty(t)])], sc.light?.time || '', (v) => set('Time of day', (s) => { if (!v) { delete s.light; return; } s.light = { ...LIGHTS[TIMES[v]], preset: TIMES[v], time: v }; }))),
      row('Pause after line', slider(sc.extraTime || 0, live('Pause after line', (s, v) => { s.extraTime = r2(v); if (!v) delete s.extraTime; }), { min: 0, max: 4, step: 0.1, fmt: (v) => `+${v.toFixed(1)}s` })),
      row('Talking', select([['', 'Nobody (narration)'], ...c.actorIds.map((id) => [id, id])], sc.talking || '', (v) => set('Who talks', (s) => { if (v) s.talking = v; else delete s.talking; }))),
    ]),
    sec('Narration', [h('textarea.input', { rows: 4, onchange: (e) => set('Edit narration', (s) => { s.narration = e.target.value.trim(); }, { structural: true }) }, sc.narration), voiceStatus(c)]),
    sec('Scene', h('div.chips', btn('Duplicate', () => E.commit('Duplicate scene', (st) => { const d = clone(sc); d.id = Math.max(...st.scenes.map((x) => x.id)) + 1; st.scenes.splice(c.si + 1, 0, d); }, { scene: null, structural: true }), 'small', 'copy'),
      btn('Apply place & weather to all', () => E.commit('Place & weather everywhere', (st) => { for (const x of st.scenes) { x.place = sc.place; if (sc.weather) x.weather = clone(sc.weather); else delete x.weather; x.edited = true; } }, { scene: null, structural: true }), 'small ghost'))));
}
function voiceStatus(c) {
  const { E, sc } = c, v = E.voiceState?.scenes?.find((x) => x.id === sc.id), borrowed = E.voiceState?.borrowed;
  const changed = !v || !v.has || v.stale || (E.voiceState && E.voiceState.scenes.length !== E.story.scenes.length);
  return h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' } },
    borrowed ? h('span.badge.p', 'Voice from the original story') : v?.has && !v.stale ? h('span.badge.ok', 'Voiced') : h('span.badge.warn', v?.stale ? 'Line changed — remake the voice' : 'No voice clip yet'),
    btn(borrowed ? 'Make this project’s voice' : 'Remake this voice line', () => E.remakeVoice(borrowed ? [] : [sc.id]), changed ? 'small primary' : 'small', 'mic'),
    E.eng.audioFor(c.si) ? btn('Play line', () => { const ctx = E.eng.audioContext, s = ctx.createBufferSource(); s.buffer = E.eng.audioFor(c.si); s.connect(ctx.destination); ctx.resume(); s.start(); }, 'small ghost', 'play') : null);
}

// ---------- Characters ----------
function charTab(c, body) {
  const { E, sc, set } = c, sel = E.sel.kind === 'actor' && sc.actors?.[E.sel.id] ? E.sel.id : null;
  const notIn = Object.keys(c.cast).filter((id) => !sc.actors?.[id]);
  body.append(sec('In this scene', [
    c.actorIds.map((id) => h('div.item' + (sel === id ? '.on' : ''), { onclick: () => E.select({ kind: 'actor', id }) }, icon('user', 15), h('span.grow', id), h('span.small.muted', pretty(sc.actors[id].anim || 'idle')), badge(!!sc.actors[id].auto || !sc.edited))),
    h('div.fctl', { style: { marginTop: '8px' } },
      notIn.length ? select([['', '+ Bring someone into this scene…'], ...notIn.map((id) => [id, id])], '', (id) => id && set('Add character', (s) => { s.actors = s.actors || {}; const n = Object.keys(s.actors).length; s.actors[id] = { at: [r2(-0.7 + n * 0.6), 0, 0.6], face: 0, anim: 'idle', expr: 'smile' }; }, { structural: true })) : null,
      btn('New character', () => newCastMember(c), 'small ghost', 'plus')),
  ]));
  if (!sel) { body.append(h('p.muted.small', 'Click a character in the preview or the list to change where they stand, what they do and wear.')); return; }
  const a = sc.actors[sel], beats = (sc.beats || []).map((b, k) => [b, k]).filter(([b]) => b.actor === sel), fr = E.eng.timeline[c.si];
  body.append(
    sec('Position', [
      row('Place', h('div.xyz', [0, 1, 2].map((k) => num(a.at[k], (v) => set('Move ' + sel, (s) => { s.actors[sel].at[k] = v ?? 0; delete s.actors[sel].auto; }), { step: 0.05, w: 62 }))), h('button.icon-btn.sm' + (E.moveTool ? '.on' : ''), { title: 'Drag on the preview (M)', onclick: () => { E.moveTool = !E.moveTool; document.querySelector('.pv-hit')?.classList.toggle('moving', E.moveTool); E.renderInspector(); } }, icon('move', 14))),
      row('Facing', slider(deg(a.face), c.live('Turn ' + sel, (s, v) => { s.actors[sel].face = r2(v * Math.PI / 180); delete s.actors[sel].auto; }), { min: -180, max: 180, step: 5, fmt: (v) => `${v}°` })),
      row('Sitting', select([['auto', 'Auto'], ['yes', 'Sits on the seat'], ['no', 'Stands']], a.seat === true ? 'yes' : a.seat === false ? 'no' : typeof a.seat === 'number' ? 'yes' : 'auto', (v) => set('Sitting', (s) => { const x = s.actors[sel]; if (v === 'auto') delete x.seat; else x.seat = v === 'yes'; if (v === 'yes' && !/^sit/.test(x.anim || '')) x.anim = 'sit'; if (v === 'no' && /^sit/.test(x.anim || '')) x.anim = 'idle'; delete x.auto; }))),
    ]),
    sec('At the start of the scene', [
      row('Action', select(ANIMS.map((n) => [n, pretty(n)]), a.anim || 'idle', (v) => set('Start action', (s) => { s.actors[sel].anim = v; delete s.actors[sel].auto; }))),
      row('Expression', select(EXPRS.map((n) => [n, pretty(n)]), a.expr || 'neutral', (v) => set('Start expression', (s) => { s.actors[sel].expr = v; delete s.actors[sel].auto; }))),
      row('Right hand', holdSel(c, a.hold?.R, (v) => set('Hold (right)', (s) => { const x = s.actors[sel]; x.hold = { ...(x.hold || {}) }; if (v) x.hold.R = v; else delete x.hold.R; if (!Object.keys(x.hold).length) delete x.hold; }))),
      row('Left hand', holdSel(c, a.hold?.L, (v) => set('Hold (left)', (s) => { const x = s.actors[sel]; x.hold = { ...(x.hold || {}) }; if (v) x.hold.L = v; else delete x.hold.L; if (!Object.keys(x.hold).length) delete x.hold; }))),
      row('Talking', toggle(sc.talking === sel, (on) => set('Talking', (s) => { if (on) s.talking = sel; else if (s.talking === sel) delete s.talking; }), 'Mouth moves with the voice')),
    ]),
    sec('Actions & expressions on the timeline', [
      beats.length ? beats.map(([b, k]) => h('div.item' + (E.sel.kind === 'beat' && E.sel.k === k ? '.on' : ''), { onclick: () => E.select({ kind: 'beat', beatKind: b.expr && !b.anim ? 'expr' : 'act', si: c.si, k }, 'characters') },
        h('span.small.muted', { style: { width: '74px' } }, b.word ? `“${b.word}”` : `${((b.at ?? 0) * fr.dur).toFixed(1)}s`),
        b.anim ? select(ANIMS.map((n) => [n, pretty(n)]), b.anim, (v) => set('Change action', (s) => { s.beats[k].anim = v; delete s.beats[k].auto; }), { style: { fontSize: '12px', padding: '4px 24px 4px 6px' } }) : null,
        b.expr ? select(EXPRS.map((n) => [n, pretty(n)]), b.expr, (v) => set('Change expression', (s) => { s.beats[k].expr = v; delete s.beats[k].auto; }), { style: { fontSize: '12px', padding: '4px 24px 4px 6px' } }) : null,
        b.hold ? h('span.grow.small', 'holds ' + Object.values(b.hold)[0]) : null, b.face != null ? h('span.grow.small', `turns ${deg(b.face)}°`) : null,
        c.wordSel(b.word, (w) => set('Re-time', (s) => { const x = s.beats[k]; if (w) { x.word = w; delete x.at; } else { delete x.word; x.at = r2(c.tLocal() / fr.dur); } delete x.auto; })),
        h('button.icon-btn.sm', { title: 'Delete', onclick: (e) => { e.stopPropagation(); set('Delete action', (s) => { s.beats.splice(k, 1); }); } }, icon('x', 13)))) : h('p.small.muted', 'Nothing yet — they keep their starting action.'),
      h('div.chips', { style: { marginTop: '6px' } },
        btn('+ Action here', () => addBeat(c, { actor: sel, anim: 'wave' }), 'small'), btn('+ Expression here', () => addBeat(c, { actor: sel, expr: 'big_smile' }), 'small'),
        btn('+ Turn here', () => addBeat(c, { actor: sel, face: a.face || 0 }), 'small ghost'), btn('+ Pick up here', () => addBeat(c, { actor: sel, hold: { R: 'pencil' } }), 'small ghost')),
    ]),
    sec('Walk path', [
      (a.path || []).map((p, k) => h('div.item', { style: { cursor: 'default' } }, h('span.small', { style: { width: '50px' } }, `${Math.round(p.at * 100)}%`), h('div.xyz', [0, 2].map((j) => num(p.pos[j], (v) => set('Walk path', (s) => { s.actors[sel].path[k].pos[j] = v ?? 0; }), { step: 0.1, w: 58 }))), num(r2(p.at), (v) => set('Walk timing', (s) => { s.actors[sel].path[k].at = Math.max(0, Math.min(1, v ?? 0)); s.actors[sel].path.sort((x, y) => x.at - y.at); }), { step: 0.05, w: 56 }), h('button.icon-btn.sm', { onclick: () => set('Remove stop', (s) => { s.actors[sel].path.splice(k, 1); if (s.actors[sel].path.length < 2) delete s.actors[sel].path; }) }, icon('x', 13)))),
      h('div.chips', { style: { marginTop: '6px' } },
        btn('Walk in from the side', () => set('Walk in', (s) => { const x = s.actors[sel], f = Math.max(0.15, Math.min(0.5, 1.6 / fr.dur)); x.path = [{ at: 0, pos: [r2(x.at[0] + 2.4), 0, r2(x.at[2] + 0.6)] }, { at: r2(f), pos: x.at.slice() }]; x.anim = 'walk'; s.beats = (s.beats || []).concat([{ actor: sel, anim: 'idle', at: r2(f) }]); delete x.auto; }), 'small'),
        btn('+ Stop at the playhead', () => set('Add walk stop', (s) => { const x = s.actors[sel]; x.path = x.path || [{ at: 0, pos: x.at.slice() }]; x.path.push({ at: r2(c.tLocal() / fr.dur), pos: [r2(x.at[0] + 0.6), 0, x.at[2]] }); x.path.sort((p, q) => p.at - q.at); }), 'small ghost'),
        a.path ? btn('No walking', () => set('Remove walk', (s) => { delete s.actors[sel].path; }), 'small ghost danger') : null),
    ]),
    outfitSec(c, sel),
    sec('', btn(`Remove ${sel} from this scene`, () => { E.select({ kind: 'scene' }); set('Remove character', (s) => { delete s.actors[sel]; s.beats = (s.beats || []).filter((b) => b.actor !== sel); if (s.talking === sel) delete s.talking; }, { structural: true }); }, 'small ghost danger', 'trash')));
}
function holdSel(c, value, onchange) { return select([['', 'Nothing'], ...c.props().filter((p) => !['furniture', 'sets', 'nature', 'brand', 'shop'].includes(p.category)).map((p) => [p.id, p.label])], value || '', (v) => onchange(v || null)); }
function addBeat(c, b) { let k = -1; c.set('Add to timeline', (s) => { s.beats = s.beats || []; setTiming(c.E, b, c.si, c.tLocal()); s.beats.push(b); k = s.beats.length - 1; }); setTimeout(() => c.E.select({ kind: 'beat', beatKind: b.expr ? 'expr' : 'act', si: c.si, k }, 'characters'), 0); }
function newCastMember(c) {
  const { E } = c, toon = E.story.world !== 'people' && Object.values(E.story.cast).some((x) => x.cast), list = (toon ? E.lib.toonPresets : E.lib.peoplePresets).concat(E.lib.characters.filter((x) => (x.world || 'toon') === (toon ? 'toon' : 'people')).map((x) => ({ id: 'custom:' + x.id, label: x.label + ' (yours)', custom: x })));
  const nameIn = h('input.input', { placeholder: 'e.g. ravi' }), pick = select(list.map((p) => [p.id, p.label]), list[0]?.id, () => {});
  modal('New character', [h('label.field', h('span', 'Look'), pick), h('label.field', h('span', 'Name in this story (one word)'), nameIn)], { actions: [{ label: 'Cancel', value: null }, { label: 'Add to scene', cls: 'primary', run: (close) => {
    const p = list.find((x) => x.id === pick.value); let id = (nameIn.value || p.label).toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '') || 'friend'; while (E.story.cast[id]) id += '_2';
    const entry = p.custom ? { [toon ? 'cast' : 'preset']: p.custom.base, ...(p.custom.look ? { look: p.custom.look } : {}), ...(p.custom.colors ? { colors: p.custom.colors } : {}), ...(p.custom.wear ? { wear: p.custom.wear } : {}) } : toon ? { cast: p.id } : { preset: p.id };
    c.set('New character', (s, st) => { st.cast[id] = entry; s.actors = s.actors || {}; s.actors[id] = { at: [r2(0.6 - Object.keys(s.actors).length * 0.5), 0, 0.7], face: 0, anim: 'idle', expr: 'smile' }; }, { structural: true }); close(); setTimeout(() => E.select({ kind: 'actor', id }), 50);
  } }] });
}
// outfit & colours, for this scene only or for the whole story
function outfitSec(c, id) {
  const { E, sc } = c, ce = E.story.cast[id] || {}, scope = E.outfitScope || 'story', a = sc.actors[id], Z = window.ZCharacters;
  const src = scope === 'scene' ? a : ce, setO = (label, fn) => c.set(label, (s, st) => fn(scope === 'scene' ? s.actors[id] : st.cast[id]), { scene: scope === 'scene' ? c.si : null });
  const scopeChips = chips([['story', 'Whole story'], ['scene', 'This scene only']], [scope], (v) => { E.outfitScope = v; E.renderInspector(); }, { multi: false });
  const kids = [scopeChips];
  if (ce.cast) {
    const tp = Z.TOON_PRESETS[ce.cast] || {}, kind = tp.kind;
    if (kind === 'boxkid' || kind === 'cat') {
      const keys = kind === 'boxkid' ? [['head', 'Head box', 0x9442c8], ['face', 'Face', 0xf6cdb4], ['cap', 'Cap', 0xf6912a], ['overalls', 'Overalls', 0xf07a24], ['sole', 'Shoes', 0x5b2a9c]] : [['body', 'Fur', 0xf9c623], ['belly', 'Belly', 0x2c6bcf], ['blue', 'Details', 0x2a62c4]];
      for (const [k, l, d] of keys) kids.push(h('div.swatch-row', l, color(src.colors?.[k] ?? ce.colors?.[k] ?? tp.colors?.[k] ?? d, (v, final) => final && setO('Colour · ' + l, (o) => { o.colors = { ...(o.colors || {}), [k]: v }; }))));
    } else if (kind === 'folk') {
      const look = { ...(tp.look || {}), ...(ce.look || {}), ...(scope === 'scene' ? a.look || {} : {}) }, opts = (k) => [...new Set(Object.values(Z.TOON_PRESETS).map((p) => p.look?.[k]).filter((x) => typeof x === 'string'))];
      for (const [k, l] of [['outfit', 'Top'], ['bottomType', 'Bottom'], ['hair', 'Hair'], ['hat', 'Hat']]) kids.push(row(l, select([['', '—'], ...opts(k).map((x) => [x, pretty(x)])], look[k] || '', (v) => setO('Outfit · ' + l, (o) => { o.look = { ...(o.look || {}), [k]: v || undefined }; }))));
      for (const [k, l] of [['head', 'Head box'], ['face', 'Skin'], ['top', 'Top colour'], ['top2', 'Second colour'], ['bottom', 'Bottom colour'], ['shoe', 'Shoes'], ['hairColor', 'Hair colour']]) if (look[k] != null || ['top', 'bottom', 'head'].includes(k)) kids.push(h('div.swatch-row', l, color(look[k] ?? 0x888888, (v, final) => final && setO('Colour · ' + l, (o) => { o.look = { ...(o.look || {}), [k]: v }; }))));
    } else kids.push(h('p.small.muted', 'The idea planet keeps its shiny pink-to-purple look.'));
  } else {
    const P = Z.PRESETS[ce.preset] || {}, wear = { ...(P.wear || {}), ...(ce.wear || {}), ...(scope === 'scene' ? a.wear || {} : {}) }, WT = Z.WEAR_TYPES || {};
    for (const [k, l] of [['top', 'Top'], ['layer', 'Layer'], ['bottom', 'Bottom'], ['shoes', 'Shoes']]) {
      const w = wear[k] || {};
      kids.push(row(l, h('div.fctl', select((WT[k] || []).map((x) => [x, pretty(x)]), w.type || (k === 'layer' ? 'none' : ''), (v) => setO('Outfit · ' + l, (o) => { o.wear = { ...(o.wear || {}), [k]: { ...w, ...((o.wear || {})[k] || {}), type: v } }; })), color(w.color ?? 0x888888, (v, final) => final && setO('Colour · ' + l, (o) => { o.wear = { ...(o.wear || {}), [k]: { ...w, ...((o.wear || {})[k] || {}), color: v } }; })))));
    }
    kids.push(h('p.small.muted', 'Every t-shirt carries the Zungga logo. No school uniforms.'));
  }
  if ((scope === 'scene' && (a.look || a.colors || a.wear)) || (scope === 'story' && (ce.look || ce.colors || ce.wear))) kids.push(h('button.link-btn', { onclick: () => setO('Outfit back to default', (o) => { delete o.look; delete o.colors; delete o.wear; }) }, icon('refresh', 13), 'Back to their usual look'));
  return sec('Outfit & colours', kids);
}

// ---------- Camera ----------
function camTab(c, body) {
  const { E, sc, set } = c, cams = sc.camera || [], fr = E.eng.timeline[c.si], rc = fr.scene.camera || [];
  const k = E.sel.kind === 'shot' && E.sel.si === c.si && cams[E.sel.k] ? E.sel.k : E.currentShot();
  body.append(sec('Shot list', [
    cams.map((cam, i) => { const a = i ? (rc[i - 1]?.until ?? 0) : 0, b = i === cams.length - 1 ? 1 : (rc[i]?.until ?? 1); return h('div.item' + (i === k ? '.on' : ''), { onclick: () => { E.select({ kind: 'shot', si: c.si, k: i }, 'camera'); E.seek(fr.start + a * fr.dur + 0.02); } }, h('b', `${i + 1}`), h('span.grow', cam.move === 'fixed' ? 'Placed shot' : pretty(cam.move), h('span.muted', ` · ${(cam.focus || []).slice(0, 2).join(', ')}`)), h('span.small.muted', `${(a * fr.dur).toFixed(1)}–${(b * fr.dur).toFixed(1)}s`), badge(!!cam.auto)); }),
    h('div.chips', { style: { marginTop: '6px' } }, btn('Cut here (split)', () => E.split(), 'small', 'scissors'), cams.length > 1 ? btn('Delete shot', () => { E.select({ kind: 'shot', si: c.si, k }); E.deleteSelected(); }, 'small ghost danger', 'trash') : null),
  ]));
  const cam = cams[k]; if (!cam) return;
  const S = (label, fn) => set(label, (s) => { const x = s.camera[k]; fn(x); delete x.auto; });
  const L = (label, fn) => c.live(label, (s, v) => { const x = s.camera[k]; fn(x, v); delete x.auto; });
  const focusOpts = [];
  for (const id of c.actorIds) focusOpts.push([id, id], [id + ':upper', `${id} · upper body`], [id + ':head', `${id} · face`], [id + '.R', `${id} · right hand`]);
  for (const p of sc.props || []) if (!p.endCard || p.id === 'zungga_logo') focusOpts.push([p.id, `${p.id} (prop)`]);
  focusOpts.push(['@room', 'The whole room']);
  body.append(sec(`Shot ${k + 1}`, [
    row('Move', select(MOVES, cam.move, (v) => v === 'fixed' ? E.setShotEnd('start') : S('Camera move', (x) => { x.move = v; delete x.pos; delete x.look; delete x.toPos; delete x.toLook; if (!x.focus) x.focus = c.actorIds.slice(0, 2); }))),
    cam.move === 'fixed' ? [
      row('Start', h('div.xyz', (cam.pos || []).map((v, j) => num(v, (n) => S('Camera start', (x) => { x.pos[j] = n ?? 0; }), { step: 0.1, w: 58 })))),
      row('Looks at', h('div.xyz', (cam.look || []).map((v, j) => num(v, (n) => S('Camera aim', (x) => { x.look[j] = n ?? 0; }), { step: 0.1, w: 58 })))),
      cam.toPos ? row('Travels to', h('div.xyz', cam.toPos.map((v, j) => num(v, (n) => S('Camera end', (x) => { x.toPos[j] = n ?? 0; }), { step: 0.1, w: 58 })))) : null,
      h('div.chips', btn('Set start from view', () => E.setShotEnd('start'), 'small', 'camera'), btn('Set end from view', () => E.setShotEnd('end'), 'small', 'camera'), cam.toPos ? btn('Stay still', () => S('Camera stays', (x) => { delete x.toPos; delete x.toLook; }), 'small ghost') : null),
      h('p.small.muted', 'Tip: switch the preview to Free view, frame the shot by dragging, then press Set start / Set end.'),
    ] : [
      row('Focus on', h('div', { style: { width: '100%' } }, chips(focusOpts, cam.focus || [], (v) => S('Camera focus', (x) => { x.focus = v; })))),
      ['push_in', 'pull_back'].includes(cam.move) ? row('From → to', h('div.fctl', select(['wide', 'mid', 'close'], cam.from || (cam.move === 'push_in' ? 'wide' : 'close'), (v) => S('Shot size', (x) => { x.from = v; })), '→', select(['wide', 'mid', 'close'], cam.to || (cam.move === 'push_in' ? 'close' : 'wide'), (v) => S('Shot size', (x) => { x.to = v; })))) :
        ['hold', 'orbit', 'pan'].includes(cam.move) ? row('Distance', select([['close', 'Close-up'], ['mid', 'Medium'], ['wide', 'Wide']], cam.distance || 'mid', (v) => S('Distance', (x) => { x.distance = v; }))) : null,
      row('Zoom', slider(cam.zoom ?? 1, L('Zoom', (x, v) => { x.zoom = r2(v); }), { min: 0.35, max: 2.2, step: 0.05, fmt: (v) => v < 1 ? `${Math.round((1 / v) * 100)}% closer` : v > 1 ? `${Math.round(v * 100 - 100)}% wider` : 'normal' })),
      row('Angle', slider(cam.angle ?? 20, L('Camera angle', (x, v) => { x.angle = v; }), { min: -180, max: 180, step: 5, fmt: (v) => `${v}°` })),
      row('Height', slider(cam.elevation ?? 18, L('Camera height', (x, v) => { x.elevation = v; }), { min: -5, max: 60, step: 1, fmt: (v) => `${v}°` })),
      cam.move === 'orbit' ? row('Orbit', slider(cam.degrees ?? 90, L('Orbit amount', (x, v) => { x.degrees = v; }), { min: -180, max: 180, step: 5, fmt: (v) => `${v}°` })) : null,
      cam.move === 'pan' ? row('Direction', select([['left_to_right', 'Left → right'], ['right_to_left', 'Right → left']], cam.direction || 'left_to_right', (v) => S('Pan direction', (x) => { x.direction = v; }))) : null,
      h('p.small.muted', 'No top-down shots (brand rule) — height stops at 60°.'),
    ],
    row('Speed', slider(cam.speed ?? 1, L('Camera speed', (x, v) => { x.speed = r2(v); if (v === 1) delete x.speed; }), { min: 0.5, max: 3, step: 0.1, fmt: (v) => v === 1 ? 'whole shot' : `${v.toFixed(1)}×` })),
    row('Smoothness', slider(cam.smooth ?? 1, L('Camera smoothness', (x, v) => { x.smooth = r2(v); if (v === 1) delete x.smooth; }), { min: 0, max: 1, step: 0.05 })),
    k < cams.length - 1 ? row('Cut on word', h('div.fctl', c.wordSel(cam.untilWord, (w) => S('Cut timing', (x) => { if (w) { x.untilWord = w; delete x.until; } else { delete x.untilWord; delete x.untilOffset; x.until = r2(c.tLocal() / fr.dur); } }), '— at a time —'), num(cam.untilOffset ?? 0, (v) => S('Cut offset', (x) => { x.untilOffset = v || 0; if (!v) delete x.untilOffset; }), { step: 0.05, w: 60 }))) : h('p.small.muted', 'The last shot runs to the end of the scene.'),
  ]));
}

// ---------- Props ----------
function propsTab(c, body) {
  const { E, sc, set } = c, list = (sc.props || []).map((p, i) => [p, i]).filter(([p]) => !p.endCard), si = E.sel.kind === 'prop' ? E.sel.i : -1, p = (sc.props || [])[si];
  const all = c.props(), cats = [...new Set(all.map((x) => x.category))];
  const SURF = { shop: [0, 1.04, 0.12], classroom: [0.75, 0.8, 0.47], home: [0.1, 0, 1.05], ground: [0, 0, 1.6] };
  body.append(sec('Props in this scene', [
    list.length ? list.map(([q, i]) => h('div.item' + (i === si ? '.on' : ''), { onclick: () => E.select({ kind: 'prop', id: q.id, i }) }, icon('box', 15), h('span.grow', all.find((x) => x.id === q.id)?.label || q.id), q.showWord ? h('span.small.muted', `on “${q.showWord}”`) : null, badge(!!q.auto))) : h('p.small.muted', 'No props yet.'),
    h('div.fctl', { style: { marginTop: '8px' } }, select([['', '+ Add from the library…'], ...cats.flatMap((cat) => all.filter((x) => x.category === cat).map((x) => [x.id, `${pretty(cat)} · ${x.label}`]))], '', (id) => {
      if (!id) return; let i = -1; set('Add prop', (s) => { s.props = s.props || []; const base = SURF[s.place] || [0, 0, 1]; const n = s.props.filter((q) => !q.endCard).length; s.props.splice(s.props.findIndex((q) => q.endCard) >= 0 ? s.props.findIndex((q) => q.endCard) : s.props.length, 0, { id, at: [r2(base[0] - 0.3 + n * 0.3), base[1], base[2]] }); i = s.props.findIndex((q) => q.id === id); });
      setTimeout(() => E.select({ kind: 'prop', id, i }), 0);
    }), btn('Request new', () => requestAsset(c), 'small ghost', 'wand')),
  ]));
  if (!p) { body.append(h('p.small.muted', 'Click a prop in the preview or the list to move it, size it, or make it appear on a word.')); return; }
  const S = (label, fn) => set(label, (s) => { const x = s.props[si]; fn(x); delete x.auto; });
  body.append(sec(all.find((x) => x.id === p.id)?.label || p.id, [
    p.attach ? row('Attached to', h('span', p.attach.replace('.', ' · '))) : row('Place', h('div.xyz', [0, 1, 2].map((k) => num(p.at[k], (v) => S('Move prop', (x) => { x.at[k] = v ?? 0; }), { step: 0.05, w: 62 }))), h('button.icon-btn.sm' + (E.moveTool ? '.on' : ''), { title: 'Drag on the preview (M)', onclick: () => { E.moveTool = !E.moveTool; document.querySelector('.pv-hit')?.classList.toggle('moving', E.moveTool); E.renderInspector(); } }, icon('move', 14))),
    row('Rotate', slider(deg(p.rot?.[1] || 0), c.live('Rotate prop', (s, v) => { const x = s.props[si]; x.rot = [x.rot?.[0] || 0, r2(v * Math.PI / 180), x.rot?.[2] || 0]; delete x.auto; }), { min: -180, max: 180, step: 5, fmt: (v) => `${v}°` })),
    row('Size', slider(p.scale ?? 1, c.live('Resize prop', (s, v) => { const x = s.props[si]; x.scale = r2(v); if (v === 1) delete x.scale; delete x.auto; }), { min: 0.2, max: 3, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%` })),
    row('Appears', h('div.fctl', c.wordSel(p.showWord, (w) => S('Appear timing', (x) => { if (w) { x.showWord = w; x.showOffset = -0.35; delete x.show; } else { delete x.showWord; delete x.showOffset; delete x.show; } }), 'From the start'), p.showWord ? num(p.showOffset ?? 0, (v) => S('Appear offset', (x) => { x.showOffset = v || 0; }), { step: 0.05, w: 60 }) : null)),
    p.id === 'lightbulb' ? row('Lights up', c.wordSel(p.onWord, (w) => S('Light timing', (x) => { if (w) { x.onWord = w; delete x.on; } else { delete x.onWord; x.on = 0.15; } }))) : null,
    p.id === 'coin_box' ? [
      row('Coins drop', toggle(!!p.coins, (on) => S('Coins', (x) => { if (on) x.coins = { count: 8, start: 0.3, end: 0.7, sound: 'coin-register.mp3', vol: 0.3 }; else delete x.coins; }))),
      p.coins ? row('How many', num(p.coins.count, (v) => S('Coin count', (x) => { x.coins.count = Math.max(1, Math.min(30, v || 1)); }), { step: 1, w: 60 })) : null,
      p.coins ? row('From word', c.wordSel(p.coins.startWord, (w) => S('Coins start', (x) => { if (w) { x.coins.startWord = w; delete x.coins.start; } else { delete x.coins.startWord; x.coins.start = r2(c.tLocal() / E.eng.timeline[c.si].dur); } }))) : null,
      p.coins ? row('Until word', c.wordSel(p.coins.endWord, (w) => S('Coins end', (x) => { if (w) { x.coins.endWord = w; x.coins.endOffset = 0.2; delete x.coins.end; } else { delete x.coins.endWord; x.coins.end = r2(Math.min(1, c.tLocal() / E.eng.timeline[c.si].dur + 0.2)); } }))) : null,
    ] : null,
    h('div.chips', { style: { marginTop: '8px' } },
      c.actorIds[0] ? btn(`Put in ${E.story.hero && c.actorIds.includes(E.story.hero) ? E.story.hero : c.actorIds[0]}'s hand`, () => { const who = E.story.hero && c.actorIds.includes(E.story.hero) ? E.story.hero : c.actorIds[0]; E.select({ kind: 'actor', id: who }); set('Hold prop', (s) => { const pr = s.props.splice(si, 1)[0]; const b = { actor: who, hold: { R: pr.id } }; if (pr.showWord) { b.word = pr.showWord; b.offset = pr.showOffset; s.beats = (s.beats || []).concat([b]); } else { s.actors[who].hold = { ...(s.actors[who].hold || {}), R: pr.id }; } }); }, 'small') : null,
      btn('Close-up on it here', () => { E.split(); setTimeout(() => set('Close-up on prop', (s) => { const k = E.currentShot(); const cam = s.camera[k]; Object.assign(cam, { move: 'push_in', focus: [p.id], from: 'mid', to: 'close', zoom: 0.9, angle: 15, elevation: 22 }); delete cam.pos; delete cam.look; delete cam.toPos; delete cam.toLook; delete cam.auto; }), 50); }, 'small ghost', 'camera'),
      btn('Delete', () => { E.select({ kind: 'scene' }, 'props'); set('Delete prop', (s) => { s.props.splice(si, 1); }); }, 'small ghost danger', 'trash')),
  ]));
}
function requestAsset(c) {
  const n = h('input.input', { placeholder: 'e.g. skateboard, piggy bank, bicycle' }), note = h('textarea.input', { rows: 3, placeholder: 'What should it look like? Size? Colours?' });
  modal('Request a new asset', [h('label.field', h('span', 'What do you need?'), n), h('label.field', h('span', 'Notes'), note), h('p.small.muted', 'Requests show up in Library → Requests. Until it is built you can use a similar prop, or upload a picture in Library → Add asset.')],
    { actions: [{ label: 'Cancel', value: null }, { label: 'Send request', cls: 'primary', run: async (close) => { if (!n.value.trim()) return; await api.post('/api/library/requests', { name: n.value.trim(), note: note.value, kind: 'prop', project: c.E.pid }); toast('Request saved', 'ok'); close(); } }] });
}

// ---------- Lighting & look ----------
function lookTab(c, body) {
  const { E, sc, set } = c, L = sc.light || {}, base = LIGHTS[L.preset] || LIGHTS[sc.place === 'home' ? 'Warm home' : sc.weather ? 'Rainy grey' : sc.mood === 'soft' ? 'Soft dream' : 'Bright day'];
  const v = (k) => L[k] ?? base[k] ?? 0.5;
  const S = (label, k, fmt, opt = {}) => row(label, slider(v(k), c.live(label, (s, val) => { s.light = { ...(s.light || { ...base }), [k]: r2(val) }; }), { fmt, ...opt }));
  body.append(
    sec('Preset', [row('Look', select([['', sc.light ? 'Custom' : 'Auto (from the place & weather)'], ...Object.keys(LIGHTS).map((n) => [n, n])], L.preset || '', (n) => set('Lighting preset', (s) => { if (!n) delete s.light; else s.light = { ...LIGHTS[n], preset: n }; }))), !sc.light ? h('p.small.muted', 'Auto: warm afternoon light at home, grey and wet in the rain, a soft spotlight for dreamy scenes. Move any slider to take over.') : null]),
    sec('Light', [S('Brightness', 'brightness'), S('Sun strength', 'sun'), S('Sun direction', 'sunAngle', (x) => `${Math.round(x)}°`, { min: 0, max: 360, step: 5 }), S('Sun height', 'sunHeight'), S('Sky light', 'ambient'),
      row('Sun colour', color(L.sunColor || '#fff0dc', (val, final) => final && set('Sun colour', (s) => { s.light = { ...(s.light || { ...base }), sunColor: '#' + val.toString(16).padStart(6, '0') }; })))]),
    sec('Look', [S('Warmth', 'warmth'), S('Colour (saturation)', 'saturation'), S('Glow', 'glow'), S('Depth of field', 'dof'), S('Vignette', 'vignette')]),
    sec('', h('div.chips', btn('Use on every scene', () => E.commit('Lighting on every scene', (st) => { for (const x of st.scenes) { x.light = clone(sc.light || base); x.edited = true; } }, { scene: null }), 'small', 'sun'), sc.light ? btn('Back to auto', () => set('Lighting back to auto', (s) => { delete s.light; }), 'small ghost', 'refresh') : null)));
}

// ---------- Text ----------
function textTab(c, body) {
  const { E, sc, set } = c, o = E.story.options || {}, cap = sc.caption, ctr = sc.counter, last = c.si === E.story.scenes.length - 1, endP = (sc.props || []).find((p) => p.endCard);
  const setOpt = (k, val) => E.commit(k === 'subtitles' ? 'Subtitles' : 'End card', (st) => { st.options = { ...(st.options || {}), [k]: val }; }, { scene: null });
  body.append(
    sec('Subtitles', [row('Narration', toggle(o.subtitles !== false, (on) => setOpt('subtitles', on), 'Grey subtitles at the bottom')), h('p.small.muted', 'They follow the spoken words. Counters and captions stay small at the top.')]),
    sec('Caption (top)', cap ? [
      row('Text', h('input.input', { value: cap.text, onchange: (e) => set('Caption text', (s) => { s.caption.text = e.target.value; delete s.caption.auto; }) })),
      row('Shows on', c.wordSel(cap.atWord, (w) => set('Caption timing', (s) => { if (w) { s.caption.atWord = w; delete s.caption.at; } else { delete s.caption.atWord; s.caption.at = r2(c.tLocal() / E.eng.timeline[c.si].dur); } delete s.caption.auto; }), '— at the playhead —')),
      row('Big', toggle(!!cap.big, (on) => set('Caption size', (s) => { if (on) s.caption.big = true; else delete s.caption.big; }), 'Large (for the last question)')),
      btn('Remove caption', () => set('Remove caption', (s) => { delete s.caption; }), 'small ghost danger', 'trash'),
    ] : btn('+ Add a caption at the playhead', () => set('Add caption', (s) => { s.caption = { text: 'New caption' }; setTiming(E, s.caption, c.si, c.tLocal(), ['atWord', 'atOffset', 'at']); }), 'small')),
    sec('Money counter (top)', ctr ? [
      row('Label', h('input.input', { value: ctr.label || '', onchange: (e) => set('Counter label', (s) => { s.counter.label = e.target.value; }) })),
      row('Starts at ₹', num(ctr.from, (v) => set('Counter start', (s) => { s.counter.from = v ?? 0; }), { step: 1, w: 80 })),
      row('Ends at ₹', num(ctr.to, (v) => set('Counter end', (s) => { s.counter.to = v ?? 0; }), { step: 1, w: 80 })),
      (ctr.steps || []).map((st, k) => row(`Step ${k + 1}`, h('div.fctl', c.wordSel(st.word, (w) => set('Counter step timing', (s) => { const x = s.counter.steps[k]; if (w) { x.word = w; delete x.at; } else { delete x.word; x.at = r2(c.tLocal() / E.eng.timeline[c.si].dur); } })), '₹', num(st.v, (v) => set('Counter step', (s) => { s.counter.steps[k].v = v ?? 0; }), { step: 1, w: 64 }), h('button.icon-btn.sm', { onclick: () => set('Remove step', (s) => { s.counter.steps.splice(k, 1); }) }, icon('x', 13))))),
      h('div.chips', btn('+ Step at the playhead', () => set('Add counter step', (s) => { s.counter.steps = s.counter.steps || []; const x = { v: s.counter.to }; setTiming(E, x, c.si, c.tLocal()); s.counter.steps.push(x); }), 'small'), btn('Remove counter', () => set('Remove counter', (s) => { delete s.counter; }), 'small ghost danger')),
    ] : btn('+ Add a money counter', () => set('Add counter', (s) => { s.counter = { from: 100, to: 100, label: 'Money', steps: [] }; }), 'small')),
    sec('End card', [row('Zungga logo', toggle(o.endCard !== false, (on) => setOpt('endCard', on), 'At the end of the last scene')),
      last && endP ? row('Shows at', slider(endP.show ?? 0.82, c.live('End card timing', (s, v) => { s.props.find((p) => p.endCard).show = r2(v); }), { min: 0.3, max: 0.98, step: 0.01, fmt: (v) => `${(v * E.eng.timeline[c.si].dur).toFixed(1)}s` })) : null,
      last && !endP ? btn('+ Add the end card to this scene', () => set('Add end card', (s) => { s.props = (s.props || []).concat([{ id: 'zungga_logo', at: [0, 0, 1.6], show: 0.82, endCard: true }]); }), 'small') : null]));
}

// ---------- Sound ----------
function soundTab(c, body) {
  const { E, sc, set } = c, files = E.lib.sfx, music = E.story.music || null;
  body.append(
    sec('Voice line', [h('textarea.input', { rows: 3, onchange: (e) => set('Edit narration', (s) => { s.narration = e.target.value.trim(); }, { structural: true }) }, sc.narration), voiceStatus(c),
      row('Story voice', select(E.lib.voices.map((v) => [v.id, v.label + (v.hasReference ? '' : ' (missing)')]), E.story.voice?.voice || 'boy-calm', (v) => { E.commit('Change voice', (st) => { st.voice = { ...(st.voice || {}), voice: v }; }, { scene: null }); toast('Voice changed — press “Remake all lines” to hear it', 'info', 5000); })),
      btn('Remake all lines', () => E.remakeVoice(E.story.scenes.map((s) => s.id)), 'small ghost', 'mic')]),
    sec('Sound effects', [
      (sc.sfx || []).map((x, k) => h('div.item' + (E.sel.beatKind === 'sfx' && E.sel.k === k ? '.on' : ''), { style: { flexWrap: 'wrap' }, onclick: () => E.select({ kind: 'beat', beatKind: 'sfx', si: c.si, k }, 'sound') },
        select(files.map((f) => [f, nice(f)]).concat((E.lib.dialogues || []).map((d) => [d.file, `🗣 ${d.who}: ${d.text.slice(0, 38)}`])), x.file, (v) => set('Sound effect', (s) => { s.sfx[k].file = v; delete s.sfx[k].auto; }), { style: { width: '130px', fontSize: '12px', padding: '4px 24px 4px 6px' } }),
        c.wordSel(x.word, (w) => set('Sound timing', (s) => { const y = s.sfx[k]; if (w) { y.word = w; delete y.at; } else { delete y.word; y.at = r2(c.tLocal() / E.eng.timeline[c.si].dur); } })),
        h('div', { style: { width: '100%' } }, slider(x.vol ?? 0.8, c.live('Sound volume', (s, v) => { s.sfx[k].vol = r2(v); }))),
        h('button.icon-btn.sm', { onclick: (e) => { e.stopPropagation(); set('Remove sound', (s) => { s.sfx.splice(k, 1); }); } }, icon('x', 13)))),
      btn('+ Sound at the playhead', () => set('Add sound effect', (s) => { const x = { file: files[0], vol: 0.5 }; setTiming(E, x, c.si, c.tLocal()); s.sfx = (s.sfx || []).concat([x]); }), 'small'),
    ]),
    sec('Ambience (whole scene)', [row('Sound', select([['', 'None'], ...files.map((f) => [f, nice(f)])], sc.ambience?.file || '', (v) => set('Ambience', (s) => { if (v) s.ambience = { file: v, vol: s.ambience?.vol ?? 0.15 }; else delete s.ambience; }))),
      sc.ambience ? row('Volume', slider(sc.ambience.vol ?? 0.15, c.live('Ambience volume', (s, v) => { s.ambience.vol = r2(v); }))) : null,
      sc.ambience ? h('button.link-btn', { onclick: () => E.commit('Ambience everywhere', (st) => { for (const x of st.scenes) { x.ambience = clone(sc.ambience); x.edited = true; } }, { scene: null }) }, 'Use on every scene') : null,
      sc.ambience?.file === 'rain-loop.wav' ? h('p.small.muted', 'Rain stays a quiet background sound (brand rule).') : null]),
    musicSection(E, sec));
}
const nice = (f) => String(f).replace(/^.*\//, '').replace(/\.(mp3|wav|ogg)$/, '').replace(/[-_]/g, ' ');

// ---------- FX ----------
function fxTab(c, body) {
  const { E, sc, set } = c, fx = sc.fx || {}, dur = E.eng.timeline[c.si].dur;
  const setFx = (label, fn) => set(label, (s) => { s.fx = { ...(s.fx || {}) }; fn(s.fx); if (!Object.keys(s.fx).length) delete s.fx; });
  const range = (obj, key, label) => [row(label + ' from', slider(obj?.from ?? 0, c.live(label, (s, v) => { s.fx[key].from = r2(v); }), { fmt: (v) => `${(v * dur).toFixed(1)}s` })), row('to', slider(obj?.to ?? 1, c.live(label, (s, v) => { s.fx[key].to = r2(v); }), { fmt: (v) => `${(v * dur).toFixed(1)}s` }))];
  body.append(
    sec('Transitions', [row('Into this scene', select([['cut', 'Cut'], ['fade', 'Fade from black'], ['white', 'Fade from white'], ['flash', 'Flash']], fx.transition || 'cut', (v) => setFx('Transition in', (f) => { if (v === 'cut') delete f.transition; else f.transition = v; }))),
      row('Out of it', select([['cut', 'Cut'], ['fade', 'Fade to black'], ['white', 'Fade to white']], fx.transitionOut || 'cut', (v) => setFx('Transition out', (f) => { if (v === 'cut') delete f.transitionOut; else f.transitionOut = v; })))]),
    sec('Particles', [row('Type', select([['none', 'None'], ['confetti', 'Confetti'], ['sparkles', 'Sparkles'], ['leaves', 'Falling leaves'], ['hearts', 'Floating hearts']], fx.particles?.type || 'none', (v) => setFx('Particles', (f) => { if (v === 'none') delete f.particles; else f.particles = { amount: 0.5, from: 0, to: 1, ...(f.particles || {}), type: v }; }))),
      fx.particles ? [row('Amount', slider(fx.particles.amount ?? 0.5, c.live('Particle amount', (s, v) => { s.fx.particles.amount = r2(v); }))), ...range(fx.particles, 'particles', 'Particles')] : null]),
    sec('Camera shake', [row('Shake', toggle(!!fx.shake, (on) => setFx('Camera shake', (f) => { if (on) f.shake = { amount: 0.5, from: 0, to: 1 }; else delete f.shake; }))),
      fx.shake ? [row('Strength', slider(fx.shake.amount ?? 0.5, c.live('Shake strength', (s, v) => { s.fx.shake.amount = r2(v); }))), ...range(fx.shake, 'shake', 'Shake')] : null]),
    sec('Slow motion', [row('Slow-mo', toggle(!!fx.slow, (on) => setFx('Slow motion', (f) => { if (on) f.slow = { rate: 0.4, from: 0.3, to: 0.7 }; else delete f.slow; }))),
      fx.slow ? [row('Speed', slider(fx.slow.rate ?? 0.4, c.live('Slow-mo speed', (s, v) => { s.fx.slow.rate = r2(v); }), { min: 0.1, max: 0.9, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%` })), ...range(fx.slow, 'slow', 'Slow-mo'), h('p.small.muted', 'Characters move slower; the voice keeps its pace.')] : null]));
}
