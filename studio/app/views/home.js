// Home: start from an idea, open a project, or start from one of the finished stories (templates).
import { h, clear, icon, btn, toast, ago, confirmBox, promptBox } from '../ui.js';
import { api } from '../api.js';

export async function mount(el, { app, templates }) {
  const [projects, stories] = await Promise.all([api.projects(), api.get('/api/stories')]);
  const idea = h('textarea.input', { placeholder: 'e.g. A boy learns that saving a little every day buys the football he dreams of…', rows: 3 });
  const start = async () => {
    const prompt = idea.value.trim();
    const p = await api.post('/api/projects', { name: prompt ? prompt.split(/[.!?]/)[0].slice(0, 48) : 'Untitled story', prompt });
    app.project = null; app.go(`#/p/${p.id}/idea`);
  };
  const tplCards = stories.filter((s) => s.engine !== '2d').map((s) => h('div.card.pcard', { onclick: async () => { const p = await api.post('/api/projects', { from: s.id, name: s.title }); toast('Copied into a new project — the original stays untouched', 'ok'); app.project = null; app.go(`#/p/${p.id}/studio`); } },
    h('div.pthumb', h('span.ph', '▶')), h('div.pinfo', h('b', s.title), h('small', 'Finished story · open a copy in the Studio'))));
  const cards = projects.map((p) => h('div.card.pcard', { onclick: () => app.go(`#/p/${p.id}/${p.step || 'studio'}`) },
    h('div.pthumb', p.thumb ? h('img', { src: p.thumb + '?t=' + Date.parse(p.updated) }) : h('span.ph', (p.name || '?')[0])),
    h('div.pinfo', h('b', p.name), h('small', `${p.scenes} scenes · ${p.exports} video${p.exports === 1 ? '' : 's'} · ${ago(p.updated)}`), h('div', h('span.badge.p', stepLabel(p.step)))),
    h('div.pact', { onclick: (e) => e.stopPropagation() },
      btn('', async () => { const n = await promptBox('Rename', 'Name', p.name); if (n) { await api.patch(`/api/projects/${p.id}`, { name: n }); app.go('#/'); location.reload(); } }, 'small ghost', 'wand', 'Rename'),
      btn('', async () => { await api.post(`/api/projects/${p.id}/duplicate`); toast('Duplicated', 'ok'); mount(clear(el), { app, templates }); }, 'small ghost', 'copy', 'Duplicate'),
      btn('', async () => { if (await confirmBox('Delete project?', `"${p.name}" moves to projects/_trash (you can get it back from there).`, 'Delete', true)) { await api.del(`/api/projects/${p.id}`); mount(clear(el), { app, templates }); } }, 'small ghost danger', 'trash', 'Delete'))));

  clear(el, h('div.page',
    templates ? null : h('div.hero-card',
      h('div', h('h1', 'What story shall we make today?'), h('p', 'Type an idea. The story AI (running on this Mac) writes the scenes, you shape them, and the studio stages, voices and films it — every choice stays yours to change.'),
        idea, h('div', { style: { display: 'flex', gap: '8px', marginTop: '10px' } }, btn('Start with this idea', start, 'primary big', 'sparkle'), btn('Write it myself', async () => { const p = await api.post('/api/projects', { name: 'My story' }); app.project = null; app.go(`#/p/${p.id}/story`); }, 'big'))),
      h('img', { src: 'assets/brand/zungga-mascot.png', style: { maxHeight: '190px', justifySelf: 'center' }, alt: '' })),
    templates ? h('div.page-head', h('div', h('h1', 'Templates'), h('p', 'Finished stories. Opening one makes a copy you can change freely.'))) : h('div.page-head', h('div', h('h1', 'My projects'), h('p', projects.length ? `${projects.length} project${projects.length > 1 ? 's' : ''}` : 'No projects yet — start with an idea above.'))),
    templates ? h('div.grid.g4', tplCards) : h('div.grid.g4', cards),
    templates ? null : [h('div.section-title', 'Or start from a finished story'), h('div.grid.g4', tplCards)]));
  idea.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) start(); });
  return {};
}
const stepLabel = (s) => ({ idea: 'Idea', story: 'Writing', build: 'Building', studio: 'In studio', generate: 'Ready to film' }[s] || 'New');
