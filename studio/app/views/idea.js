// Idea: a prompt → the local story AI writes a draft (title, cast, scenes). Accept it on the Story page, or redo.
import { h, clear, btn, toast, chips, select, slider, row } from '../ui.js';
import { api, waitJob } from '../api.js';

export async function mount(el, { app }) {
  const P = app.project, lib = await app.lib(), conf = await app.conf();
  const pj = P.project, prev = P.draft;
  const st = { prompt: pj.prompt || prev?.prompt || '', scenes: prev?.scenes?.length || 6, world: pj.world || conf.world, hero: '', tone: ['warm'], notes: '' };
  const status = h('div'), prompt = h('textarea.input', { rows: 5, placeholder: 'What happens? Who is it about? What should kids feel or learn?', oninput: (e) => (st.prompt = e.target.value) }, st.prompt);
  const heroOpts = () => [['', 'Let the AI pick'], ...(st.world === 'people' ? lib.peoplePresets : lib.toonPresets).map((p) => [p.id, p.label + (p.role ? ` — ${p.role}` : '')])];
  let heroSel = select(heroOpts(), st.hero, (v) => (st.hero = v));
  const heroBox = h('div', heroSel);
  const write = async () => {
    if (!st.prompt.trim()) return toast('Type an idea first', 'error');
    await api.patch(`/api/projects/${pj.id}`, { prompt: st.prompt, world: st.world });
    const j = await api.post(`/api/projects/${pj.id}/story-ai`, { prompt: st.prompt, scenes: st.scenes, world: st.world, hero: st.hero || undefined, tone: st.tone.join(', ') });
    goBtn.disabled = true;
    try {
      const res = await waitJob(j.id, (jj) => clear(status, h('div.card.pad', h('b', jj.message), h('div.bar', h('i', { style: { width: Math.round(jj.progress * 100) + '%' } })))));
      const draft = { ...res.draft, voice: conf.voice };
      await api.put(`/api/projects/${pj.id}/draft`, draft); await api.patch(`/api/projects/${pj.id}`, { name: draft.title });
      app.project = null; app.go(`#/p/${pj.id}/story`);
    } catch (e) { clear(status, h('div.card.pad', h('b', { style: { color: 'var(--bad)' } }, 'The story AI stopped: '), e.message)); goBtn.disabled = false; }
  };
  const goBtn = btn('Write the story', write, 'primary big', 'sparkle');
  clear(el, h('div.page', { style: { maxWidth: '860px' } },
    h('div.page-head', h('div', h('h1', 'Idea'), h('p', 'The story AI runs on this Mac (open-source model, no internet needed). You can accept, redo, or change every scene after.'))),
    h('div.card.pad',
      h('label.field', h('span', 'Your idea'), prompt),
      row('Scenes', slider(st.scenes, (v) => (st.scenes = v), { min: 3, max: 14, step: 1, fmt: (v) => `${v} scenes (~${Math.round(v * 7)} s)` })),
      row('World', chips([['toon', 'Cartoon world (box kid + helpers)'], ['people', 'People']], [st.world], (v) => { st.world = v; heroSel = select(heroOpts(), '', (x) => (st.hero = x)); clear(heroBox, heroSel); mount2(); }, { multi: false })),
      row('Main character', heroBox),
      row('Feel', chips(['warm', 'funny', 'exciting', 'gentle', 'surprising', 'thoughtful'], st.tone, (v) => (st.tone = v))),
      h('div', { style: { display: 'flex', gap: '10px', marginTop: '16px', alignItems: 'center' } }, goBtn, prev ? btn('Keep the current story', () => app.go(`#/p/${pj.id}/story`), 'big') : null, btn('Write it myself', async () => { if (!prev) await api.put(`/api/projects/${pj.id}/draft`, { title: pj.name, world: st.world, hero: st.world === 'toon' ? 'hero' : 'rio', cast: [st.world === 'toon' ? { id: 'hero', preset: 'hero', label: 'Hero (box kid)' } : { id: 'rio', preset: 'rio', label: 'Rio' }], scenes: [{ title: 'Scene 1', place: 'home', narration: '', characters: [] }], voice: conf.voice }); app.project = null; app.go(`#/p/${pj.id}/story`); }, 'ghost big')),
      h('p.small.muted', { style: { marginTop: '12px' } }, `Model: ${conf.storyModel} (change it in Settings). The first run loads the model (~10 s); later runs are quicker.`)),
    status));
  function mount2() { /* world switch re-renders the chips state only */ el.querySelectorAll('.chips')[0]?.querySelectorAll('.chip').forEach((c, i) => c.classList.toggle('on', ['toon', 'people'][i] === st.world)); }
  return {};
}
