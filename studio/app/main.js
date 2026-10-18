// Zungga Story Studio — app shell: top bar (project, saved, undo/redo, steps, library, settings, jobs), left menu, router.
import { h, $, clear, icon, btn, toast, fmtBytes, promptBox } from './ui.js';
import { api, connect, onEvent, jobs } from './api.js';

const VIEWS = {
  home: () => import('./views/home.js'), idea: () => import('./views/idea.js'), room: () => import('./views/room.js'), story: () => import('./views/story.js'), build: () => import('./views/build.js'),
  studio: () => import('./views/editor.js'), generate: () => import('./views/generate.js'), library: () => import('./views/library.js'), settings: () => import('./views/settings.js'),
};
const STEPS = [['idea', 'Idea', 'idea'], ['room', 'Writers\' Room', 'users'], ['story', 'Story', 'story'], ['build', 'Build', 'build'], ['studio', 'Studio', 'studio'], ['generate', 'Generate', 'generate']];

export const app = {
  project: null, library: null, settings: null, view: null, route: null,
  go(hash) { location.hash = hash; },
  async lib(force = false) { if (!this.library || force) this.library = await api.library(); return this.library; },
  async conf(force = false) { if (!this.settings || force) this.settings = await api.settings(); return this.settings; },
  setSaved(state) { const el = $('#saved'); if (!el) return; el.className = 'saved ' + state; clear(el, icon(state === 'saved' ? 'check' : state === 'error' ? 'x' : 'clock', 15), state === 'saved' ? 'Saved' : state === 'saving' ? 'Saving…' : state === 'error' ? 'Not saved' : 'Unsaved'); },
  setUndo(canUndo, canRedo) { const u = $('#undo'), r = $('#redo'); if (u) u.disabled = !canUndo; if (r) r.disabled = !canRedo; },
  async setProject(id) {
    if (!id) { this.project = null; return null; }
    if (this.project?.project?.id !== id) this.project = await api.project(id);
    return this.project;
  },
  async reloadProject() { if (this.project) this.project = await api.project(this.project.project.id); return this.project; },
  async patchProject(patch) { if (!this.project) return; this.project.project = await api.patch(`/api/projects/${this.project.project.id}`, patch); renderTop(); },
};
window.__app = app;

// ---------- top bar ----------
function renderTop() {
  const r = app.route || {}, p = app.project?.project, inProject = !!(p && r.pid);
  clear($('#top'),
    h('a.logo', { href: '#/' }, h('img', { src: 'assets/brand/zungga-logo.png', alt: 'Zungga' }), h('span', 'Story Studio')),
    inProject ? h('div.pname', { title: 'Rename', onclick: async () => { const n = await promptBox('Rename project', 'Name', p.name); if (n) { await app.patchProject({ name: n }); } } }, h('span', p.name), icon('wand', 14)) : null,
    inProject ? h('div#saved.saved.saved', icon('check', 15), 'Saved') : null,
    inProject && r.view === 'studio' ? h('div.undo', h('button#undo.icon-btn', { title: 'Undo (⌘Z)', disabled: true, onclick: () => app.view?.undo?.() }, icon('undo')), h('button#redo.icon-btn', { title: 'Redo (⇧⌘Z)', disabled: true, onclick: () => app.view?.redo?.() }, icon('redo'))) : null,
    inProject ? h('nav.steps', STEPS.map(([k, label, ic], i) => [i ? h('span.sep', '›') : null, h('a.step' + (r.view === k ? '.on' : ''), { href: `#/p/${p.id}/${k}` }, icon(ic, 16), label)])) : h('div.spacer'),
    h('div.top-right',
      h('div#jobsBtn.jobs-btn', { onclick: toggleJobs, title: 'Jobs' }, icon('refresh', 16), h('span#jobsCount', '0')),
      h('a.top-link' + (r.view === 'library' ? '.on' : ''), { href: '#/library' }, icon('library', 16), 'Library'),
      h('a.top-link' + (r.view === 'settings' ? '.on' : ''), { href: '#/settings' }, icon('settings', 16), 'Settings')));
  renderJobsBtn();
}

// ---------- jobs indicator ----------
function renderJobsBtn() {
  const all = [...jobs.values()], active = all.filter((j) => j.status === 'running' || j.status === 'queued');
  const b = $('#jobsBtn'); if (!b) return;
  b.classList.toggle('busy', active.length > 0); $('#jobsCount').textContent = active.length ? String(active.length) : all.length ? '✓' : '0';
  const run = active.find((j) => j.status === 'running'); b.title = run ? `${run.title} — ${Math.round(run.progress * 100)}%` : 'Jobs';
  if ($('#jobsPanel')) renderJobsPanel();
}
function toggleJobs() { const p = $('#jobsPanel'); if (p) return p.remove(); document.body.append(h('div#jobsPanel.jobs-panel')); renderJobsPanel(); setTimeout(() => document.addEventListener('mousedown', function off(e) { if (!e.target.closest('#jobsPanel,#jobsBtn')) { $('#jobsPanel')?.remove(); document.removeEventListener('mousedown', off); } }), 0); }
function renderJobsPanel() {
  const all = [...jobs.values()].sort((a, b) => b.created - a.created).slice(0, 20);
  clear($('#jobsPanel'), h('h4', 'Jobs'), all.length ? all.map((j) => h('div.job.' + j.status,
    h('div.job-top', h('b', j.title), h('span.job-st', j.status === 'running' ? Math.round(j.progress * 100) + '%' : j.status)),
    h('div.bar', h('i', { style: { width: (j.status === 'done' ? 100 : j.progress * 100) + '%' } })),
    h('div.job-msg', j.error ? j.error.split('\n').slice(-1)[0] : j.message),
    (j.status === 'running' || j.status === 'queued') ? btn('Cancel', () => api.post(`/api/jobs/${j.id}/cancel`), 'small ghost') : null,
    j.status === 'failed' ? h('details', h('summary', 'Details'), h('pre', (j.log || []).slice(-15).join('\n'))) : null)) : h('p.muted', 'Nothing running. Voice, story AI and video jobs show up here.'));
}

// ---------- left menu ----------
async function renderSide() {
  const r = app.route || {}, pid = r.pid;
  const link = (hash, label, ic, on) => h('a.side-link' + (on ? '.on' : ''), { href: hash }, icon(ic, 18), label);
  const studioLinks = pid ? [['scene', 'Scenes', 'film'], ['characters', 'Characters', 'users'], ['scene', 'Places', 'pin'], ['props', 'Props', 'box'], ['sound', 'Sounds', 'music'], ['voice', 'Voices', 'mic'], ['fx', 'Effects', 'fx'], ['text', 'Text & Captions', 'text'], ['music', 'Music', 'music']] : [];
  const side = clear($('#side'),
    h('button.new-btn', { onclick: newProject }, icon('plus', 18), 'New Project'),
    link('#/', 'Home', 'home', r.view === 'home'),
    link('#/templates', 'Templates', 'copy', r.view === 'templates'),
    pid ? h('div.side-group', link(`#/p/${pid}/studio`, 'Studio', 'studio', r.view === 'studio'),
      h('div.side-sub', studioLinks.map(([tab, label, ic]) => h('a.side-link.sub', { href: `#/p/${pid}/studio`, onclick: (e) => { if (r.view === 'studio') { e.preventDefault(); app.view?.openTab?.(tab); } else sessionStorage.setItem('zs-tab', tab); } }, icon(ic, 16), label)))) : null,
    h('div.side-fill'),
    link('#/library', 'Assets Library', 'library', r.view === 'library'),
    link('#/', 'My Projects', 'folder', false),
    link('#/settings', 'Settings', 'settings', r.view === 'settings'),
    h('div#storage.storage', h('b', 'Storage'), h('div.bar', h('i')), h('small', '…')));
  try { const s = await api.get('/api/storage'); const used = s.projects + s.models + s.venv; $('#storage small').textContent = `${fmtBytes(s.projects)} projects · ${fmtBytes(s.models)} AI models`; $('#storage i').style.width = Math.min(100, used / (40 * 2 ** 30) * 100) + '%'; } catch { /* offline */ }
  return side;
}

export async function newProject() {
  const name = await promptBox('New project', 'What should we call it? (you can change it later)', 'My new story');
  if (name == null) return;
  const p = await api.post('/api/projects', { name: name || 'Untitled story' }); app.project = null; app.go(`#/p/${p.id}/idea`);
}

// ---------- router ----------
function parse() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'p' && parts[1]) return { view: parts[2] || 'studio', pid: parts[1], extra: parts.slice(3) };
  if (parts[0] === 'templates') return { view: 'home', templates: true };
  return { view: parts[0] && VIEWS[parts[0]] ? parts[0] : 'home' };
}
let seq = 0;
async function route() {
  const r = parse(), my = ++seq;
  if (app.view?.canLeave && !(await app.view.canLeave())) return;
  try { app.view?.unmount?.(); } catch (e) { console.error(e); }
  app.view = null; app.route = r;
  document.body.dataset.view = r.view;
  if (r.pid) { try { await app.setProject(r.pid); } catch (e) { toast(e.message, 'error'); app.go('#/'); return; } } else app.project = null;
  renderTop(); renderSide();
  const main = clear($('#main'), h('div.loading', h('div.spinner'), 'Loading…'));
  try {
    const mod = await VIEWS[r.view](); if (my !== seq) return;
    clear(main); app.view = (await mod.mount(main, { ...r, app })) || {};
    if (r.pid && STEPS.some(([k]) => k === r.view) && app.project.project.step !== r.view) app.patchProject({ step: r.view }).catch(() => {});
  } catch (e) { console.error(e); clear(main, h('div.empty', h('h2', 'Something went wrong'), h('pre', e.stack || e.message))); }
}
addEventListener('hashchange', route);
connect();
onEvent((ev) => {
  if (ev.type === 'job' || ev.type === 'hello') renderJobsBtn();
  if (ev.type === 'job' && ev.job.status === 'done' && ev.job.type === 'render') toast(`Video ready: ${ev.job.result?.name}`, 'ok', 6000);
  if (ev.type === 'job' && ev.job.status === 'failed') toast(`${ev.job.title} failed: ${(ev.job.error || '').split('\n').pop().slice(0, 140)}`, 'error', 8000);
  if (ev.type === 'offline') document.body.classList.add('offline'); if (ev.type === 'online') document.body.classList.remove('offline');
  app.view?.onEvent?.(ev);
});
addEventListener('beforeunload', (e) => { if (app.view?.dirty?.()) { app.view.flush?.(); e.preventDefault(); e.returnValue = ''; } });
route();
