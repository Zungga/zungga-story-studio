// Story: the draft, scene by scene. Accept · redo all · redo one scene · edit · add · delete · reorder (drag) · lock.
import { h, clear, icon, btn, toast, select, chips, confirmBox, debounce, clone } from '../ui.js';
import { api, waitJob } from '../api.js';

const MOODS = [['', 'Auto (from the words)'], ['happy', 'Happy'], ['sad', 'Sad'], ['worried', 'Worried'], ['idea', 'Idea!'], ['surprised', 'Surprised'], ['soft', 'Soft / gentle']];

export async function mount(el, { app }) {
  const P = app.project, lib = await app.lib(), conf = await app.conf(), pid = P.project.id;
  let d = P.draft ? clone(P.draft) : draftFromStory(P.story, P.project);
  if (!d) { app.go(`#/p/${pid}/idea`); return {}; }
  d.scenes.forEach((s) => (s._k = s._k || Math.random().toString(36).slice(2)));
  // every scene keeps its own id (its voice clip is scene-<id>.wav), so reordering never mixes up clips
  const ensureIds = () => { const seen = new Set(); let next = Math.max(0, ...d.scenes.map((s) => +s.id || 0)) + 1; for (const s of d.scenes) { if (!s.id || seen.has(s.id)) s.id = next++; seen.add(s.id); } };
  ensureIds();
  const presets = () => (d.world === 'people' ? lib.peoplePresets : lib.toonPresets).concat(lib.characters.filter((c) => (c.world || 'toon') === (d.world || 'toon')).map((c) => ({ id: c.id, label: c.label + ' (yours)', custom: c })));
  const save = debounce(async () => { app.setSaved('saving'); try { await api.put(`/api/projects/${pid}/draft`, strip(d)); app.setSaved('saved'); } catch (e) { app.setSaved('error'); } }, 700);
  const changed = (rerender = false) => { ensureIds(); app.setSaved('dirty'); save(); if (rerender) render(); };
  let busy = false;

  async function ai(body, label) {
    if (busy) return null; busy = true; const bar = h('div.card.pad', h('b', label), h('div.bar', h('i')));
    el.querySelector('.page').prepend(bar);
    try { const j = await api.post(`/api/projects/${pid}/story-ai`, body); return await waitJob(j.id, (jj) => { bar.querySelector('b').textContent = `${label} — ${jj.message}`; bar.querySelector('i').style.width = Math.round(jj.progress * 100) + '%'; }); }
    catch (e) { toast(e.message, 'error'); return null; } finally { busy = false; bar.remove(); }
  }
  const redoAll = async () => {
    const res = await ai({ prompt: d.prompt || P.project.prompt || d.title, scenes: d.scenes.length, world: d.world }, 'Writing a new version');
    if (!res) return;
    const nd = res.draft, locked = d.scenes.map((s, i) => (s.locked ? [i, s] : null)).filter(Boolean);
    nd.scenes.forEach((s, k) => { s._k = Math.random().toString(36).slice(2); s.id = d.scenes[k]?.id; });
    for (const [i, s] of locked) nd.scenes[i] = s;                        // locked scenes stay exactly as they were
    for (const c of d.cast) if (!nd.cast.find((x) => x.id === c.id) && locked.some(([, s]) => (s.characters || []).includes(c.id))) nd.cast.push(c);
    d = { ...d, ...nd, voice: d.voice }; changed(true); toast('New version written — locked scenes were kept', 'ok');
  };
  const redoScene = async (i) => {
    const res = await ai({ redoScene: i + 1, draft: strip(d), world: d.world }, `Rewriting scene ${i + 1}`);
    if (!res) return; d = { ...d, scenes: res.draft.scenes.map((s, k) => ({ ...s, id: d.scenes[k]?.id, _k: d.scenes[k]?._k || s._k })) }; changed(true);
  };
  const accept = async () => {
    if (d.scenes.some((s) => !String(s.narration || '').trim())) return toast('Every scene needs a narration line', 'error');
    save.flush(); await api.put(`/api/projects/${pid}/draft`, strip(d));
    app.go(`#/p/${pid}/build`);
  };

  // drag to reorder
  let dragFrom = null;
  function render() {
    const castIds = d.cast.map((c) => c.id), labelOf = (id) => d.cast.find((c) => c.id === id)?.label || id;
    clear(el, h('div.page',
      h('div.page-head', h('div', h('h1', d.title || 'Story'), h('p', `${d.scenes.length} scenes · ${d.world === 'people' ? 'People' : 'Cartoon world'} · narrated by ${labelOf(d.hero)}`)),
        h('div.actions', btn('Redo whole story', async () => { if (await confirmBox('Write a new version?', 'The story AI writes the whole story again. Locked scenes stay as they are.', 'Redo')) redoAll(); }, '', 'refresh'),
          btn('Add scene', () => { d.scenes.push({ title: `Scene ${d.scenes.length + 1}`, place: d.scenes.at(-1)?.place || 'home', narration: '', characters: [d.hero], _k: Math.random().toString(36).slice(2) }); changed(true); }, '', 'plus'),
          btn('Accept story → Build', accept, 'primary', 'check'))),
      h('div.grid', { style: { gridTemplateColumns: '1fr 300px', alignItems: 'start' } },
        h('div', h('label.field', h('span', 'Title'), h('input.input', { value: d.title || '', oninput: (e) => { d.title = e.target.value; changed(); } })),
          d.scenes.map((s, i) => h('div.card.scard' + (s.locked ? '.locked' : ''), {
            draggable: true, ondragstart: (e) => { dragFrom = i; e.dataTransfer.effectAllowed = 'move'; }, ondragover: (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }, ondragleave: (e) => e.currentTarget.classList.remove('drag-over'),
            ondrop: (e) => { e.preventDefault(); if (dragFrom == null || dragFrom === i) return; const [m] = d.scenes.splice(dragFrom, 1); d.scenes.splice(i, 0, m); dragFrom = null; changed(true); },
          },
            h('div.snum', String(i + 1), h('button.icon-btn.sm' + (s.locked ? '.on' : ''), { title: s.locked ? 'Locked: redo keeps this scene' : 'Lock this scene', onclick: () => { s.locked = !s.locked; changed(true); } }, icon(s.locked ? 'lock' : 'unlock', 14)),
              h('button.icon-btn.sm', { title: 'Move up', disabled: i === 0, onclick: () => { [d.scenes[i - 1], d.scenes[i]] = [d.scenes[i], d.scenes[i - 1]]; changed(true); } }, icon('up', 14)),
              h('button.icon-btn.sm', { title: 'Move down', disabled: i === d.scenes.length - 1, onclick: () => { [d.scenes[i + 1], d.scenes[i]] = [d.scenes[i], d.scenes[i + 1]]; changed(true); } }, icon('down', 14)),
              h('span', { title: 'Drag to reorder', style: { cursor: 'grab', color: 'var(--faint)' } }, icon('drag', 16))),
            h('div.sbody',
              h('div.srow', h('input.input', { value: s.title || '', style: { flex: '1', fontWeight: 600 }, oninput: (e) => { s.title = e.target.value; changed(); } }),
                select(lib.places.map((p) => [p, placeLabel(p)]).concat(lib.places.includes(s.place) ? [] : [[s.place, `${s.place} (not in the library)`]]), s.place, (v) => { s.place = v; changed(); }, { style: { width: '150px' } }),
                select(MOODS, s.mood || '', (v) => { s.mood = v || null; changed(); }, { style: { width: '150px' } })),
              h('textarea.input', { rows: 2, placeholder: 'What the narrator says in this scene…', oninput: (e) => { s.narration = e.target.value; e.target.nextSibling.textContent = wc(s.narration); changed(); } }, s.narration || ''),
              h('small.muted', wc(s.narration)),
              h('div.srow', h('span.small.muted', 'In this scene:'), chips(castIds.map((id) => [id, labelOf(id)]), s.characters || [], (v) => { s.characters = v; changed(); })),
              h('div.srow', h('span.small.muted', 'Things we see:'), h('input.input', { value: (s.objects || []).join(', '), placeholder: 'e.g. football, coin box (anything said in the line is found automatically)', style: { flex: 1 }, onchange: (e) => { s.objects = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); changed(); } })),
              h('div.srow', { style: { justifyContent: 'flex-end' } },
                btn('Redo this scene', () => redoScene(i), 'small', 'refresh'),
                btn('Duplicate', () => { d.scenes.splice(i + 1, 0, { ...clone(s), id: null, locked: false, _k: Math.random().toString(36).slice(2) }); changed(true); }, 'small ghost', 'copy'),
                btn('Delete', async () => { if (d.scenes.length > 1 && await confirmBox('Delete scene?', `Scene ${i + 1}: "${s.title}"`, 'Delete', true)) { d.scenes.splice(i, 1); changed(true); } }, 'small ghost danger', 'trash')))))),
        castPanel())));
  }
  function castPanel() {
    const pl = presets();
    return h('div.card.pad', { style: { position: 'sticky', top: '10px' } }, h('h3', { style: { marginBottom: '8px' } }, 'Cast'),
      h('label.field', h('span', 'Narrator / main character'), select(d.cast.map((c) => [c.id, c.label || c.id]), d.hero, (v) => { d.hero = v; changed(true); })),
      d.cast.map((c, i) => h('div.item', { style: { cursor: 'default' } },
        h('input.input', { value: c.label || c.id, style: { flex: 1, padding: '5px 8px' }, title: 'Name used in the studio', onchange: (e) => { c.label = e.target.value; changed(); } }),
        select(pl.map((p) => [p.id, p.label]), c.custom || c.preset, (v) => { const cp = pl.find((p) => p.id === v); if (cp?.custom) { c.preset = cp.custom.base; c.custom = v; c.look = cp.custom.look; c.colors = cp.custom.colors; c.wear = cp.custom.wear; } else { c.preset = v; delete c.custom; delete c.look; delete c.colors; delete c.wear; } changed(); }, { style: { width: '120px', padding: '5px 26px 5px 8px', fontSize: '12px' } }),
        h('button.icon-btn.sm', { title: 'Remove from the cast', disabled: c.id === d.hero, onclick: () => { d.cast.splice(i, 1); for (const s of d.scenes) s.characters = (s.characters || []).filter((x) => x !== c.id); changed(true); } }, icon('x', 14)))),
      h('div', { style: { marginTop: '10px' } }, select([['', '+ Add a character…'], ...pl.filter((p) => !d.cast.some((c) => c.preset === p.id && !c.custom)).map((p) => [p.id, p.label])], '', (v) => {
        if (!v) return; const cp = pl.find((p) => p.id === v); let id = v.replace(/[^a-z0-9_]/gi, '_').toLowerCase(), k = 2; while (d.cast.some((c) => c.id === id)) id = `${v}_${k++}`;
        d.cast.push(cp.custom ? { id, preset: cp.custom.base, custom: v, label: cp.custom.label, look: cp.custom.look, colors: cp.custom.colors, wear: cp.custom.wear } : { id, preset: v, label: cp.label }); changed(true);
      })),
      h('p.small.muted', { style: { marginTop: '10px' } }, d.world === 'toon' ? 'Cartoon world: the box kid is the main character, the yellow cat helps with physical things, the flying planet helps with ideas.' : 'People: girls use the Mira, Tara, Mom or older sister looks.'));
  }
  render();
  return { flush: () => save.flush(), dirty: () => false };
}
const wc = (t) => { const n = (String(t || '').match(/[A-Za-z0-9']+/g) || []).length; return `${n} words · about ${Math.max(1, Math.round(n / 2.6))} s`; };
export const placeLabel = (p) => ({ home: 'Home', shop: 'Shop', ground: 'School ground / outdoors', classroom: 'Classroom', bank: 'Bank', kitchen: 'Kitchen', bedroom: 'Bedroom', park: 'Park', supermarket: 'Supermarket', street: 'Street + bus stop', party: 'Birthday party', festival: 'Festival street (Diwali)', library: 'Library', night_ground: 'Playground at night', beach: 'Beach', market: 'Market street (food stalls)', village: 'Village (homes & huts)', camp: 'Campsite (campfire)', sports: 'Sports ground', cave: 'Cave' }[p] || p);
const strip = (d) => JSON.parse(JSON.stringify(d, (k, v) => (k === '_k' ? undefined : v)));
// a project that started from a finished story has no draft: make one from its scenes
export function draftFromStory(story, pj) {
  if (!story) return null;
  return {
    title: story.title, world: story.world || (Object.values(story.cast || {}).some((c) => c.cast) ? 'toon' : 'people'), hero: story.hero || Object.keys(story.cast || {})[0], prompt: pj?.prompt || '', voice: story.voice?.voice,
    cast: Object.entries(story.cast || {}).map(([id, c]) => ({ id, preset: c.cast || c.preset || id, label: id[0].toUpperCase() + id.slice(1), ...(c.look ? { look: c.look } : {}), ...(c.colors ? { colors: c.colors } : {}), ...(c.wear ? { wear: c.wear } : {}) })),
    scenes: story.scenes.map((s) => ({ id: s.id, title: s.title, place: s.place, narration: s.narration, characters: Object.keys(s.actors || {}), talking: s.talking, mood: s.mood === 'soft' ? 'soft' : null })),
  };
}
