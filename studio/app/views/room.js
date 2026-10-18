// Writers' Room: between Idea and Story. Cast description → personas → hidden mystery → closed world →
// live in-character session (you are the Director, above everyone) → episodes outline → script → Story.
import { h, $, clear, icon, btn, toast, select, row, modal, confirmBox, chips } from '../ui.js';
import { api, waitJob } from '../api.js';

const STAGES = [['setup', 'Setup'], ['personas', 'Personas'], ['mystery', 'Mystery'], ['world', 'World'], ['discussion', 'Room'], ['outline', 'Outline'], ['scenes', 'Script'], ['done', 'Story']];
const BEATS = ['joy', 'excitement', 'fear', 'sadness', 'anger', 'mistake', 'guilt', 'apology', 'pride', 'surprise'];
const EMO_TO_BEAT = { happy: 'joy', excited: 'excitement', scared: 'fear', worried: 'fear', sad: 'sadness', angry: 'anger', guilty: 'guilt', proud: 'pride', surprised: 'surprise' };

export async function mount(el, { app }) {
  const pid = app.project.project.id;
  let R = await api.get(`/api/projects/${pid}/room`), leftTab = 'setup', rightTab = 'solution', busy = null, openCard = null, epSel = 1;
  const lib = await app.lib();
  const root = h('div.room'); clear(el, root);
  const style = h('style', `
    .room { position:absolute; inset:0; display:grid; grid-template-columns: 360px minmax(380px,1fr) 380px; gap:10px; padding:10px; }
    .room .col { display:flex; flex-direction:column; min-height:0; }
    .room .scroll { overflow:auto; padding:12px 14px; flex:1; }
    .stagebar { display:flex; gap:4px; padding:10px; flex-wrap:wrap; border-bottom:1px solid var(--line); align-items:center; }
    .stagebar .st { font-size:12px; padding:4px 9px; border-radius:99px; background:#f1effa; color:var(--muted); font-weight:600; }
    .stagebar .st.done { background:#eaf8ef; color:var(--ok); } .stagebar .st.on { background:var(--p); color:#fff; }
    .chat { flex:1; overflow:auto; padding:14px; display:flex; flex-direction:column; gap:8px; background:#fbfaff; }
    .msg { display:grid; grid-template-columns:34px 1fr; gap:9px; align-items:start; }
    .msg .av { width:34px; height:34px; border-radius:50%; display:grid; place-items:center; color:#fff; font:600 13px Fredoka; }
    .msg .bub { background:#fff; border:1px solid var(--line); border-radius:4px 14px 14px 14px; padding:8px 11px; font-size:14px; line-height:1.45; }
    .msg .nm { font-size:12px; font-weight:700; margin-bottom:2px; }
    .msg.narrator .bub { background:#fff8e8; border-color:#fde7b0; font-style:italic; } .msg.system .bub { background:#f1f5f9; color:#475569; font-size:13px; }
    .msg.director .bub { background:#7c3aed; color:#fff; border-color:#7c3aed; border-radius:14px 4px 14px 14px; } .msg.director { grid-template-columns:1fr 34px; } .msg.director .av { order:2; } .msg.director .nm { color:#ede9fe; }
    .composer { display:flex; gap:8px; padding:10px; border-top:1px solid var(--line); align-items:flex-end; }
    .composer textarea { flex:1; min-height:44px; max-height:140px; }
    .pcard { border:1px solid var(--line); border-radius:12px; margin-bottom:8px; overflow:hidden; background:#fff; }
    .pcard .ph { display:flex; align-items:center; gap:8px; padding:9px 10px; cursor:pointer; }
    .pcard .dot { width:12px; height:12px; border-radius:50%; } .pcard .pb { padding:6px 12px 12px; border-top:1px solid var(--line); display:grid; gap:6px; }
    .pcard label { font-size:11px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:.04em; } .pcard .sug { color:#d97706; }
    .kv { font-size:13px; margin:4px 0; } .kv b { color:var(--muted); font-weight:600; }
    .emo td, .emo th { padding:4px 5px; font-size:12px; text-align:center; border-bottom:1px solid var(--line); } .emo th { color:var(--muted); font-weight:600; }
    .typing { font-size:12px; color:var(--muted); padding:0 14px 8px; }
  `);
  const cols = [h('div.card.col'), h('div.card.col'), h('div.card.col')]; root.append(style, ...cols);
  const chatEl = h('div.chat');

  const refresh = async () => { R = await api.get(`/api/projects/${pid}/room`); render(); };
  async function job(url, body = {}, label) {
    try { busy = label; render(); const j = await api.post(url, body); if (j && j.id) await waitJob(j.id, (jj) => { busy = `${label} — ${jj.message || ''}`; const b = $('#roombusy', root); if (b) b.textContent = busy; }); }
    catch (e) { toast(e.message, 'error', 7000); }
    busy = null; await refresh();
  }
  const put = async (url, data) => { R = await api.put(url, data); render(); };
  const stageIdx = (s) => STAGES.findIndex(([k]) => k === s);

  // ---------- left: setup / cast / world ----------
  function setupPanel() {
    const s = R.setup, f = (k, v) => { s[k] = v; saveSetup(); };
    const ta = (k, rows, ph) => h('textarea.input', { rows, placeholder: ph, oninput: (e) => f(k, e.target.value) }, s[k] || '');
    return h('div',
      h('label.field', h('span', 'Story topic / premise'), ta('premise', 3, 'e.g. The Missing Recipe of the Chocolate Factory: five kids visit a chocolate factory; the secret recipe vanishes; they turn detective…')),
      h('label.field', h('span', 'Characters — who are the heroes, the other main characters, who else is there; strengths and weaknesses'), ta('castText', 8, 'Heroes: Kai (curious leader), Rio (energetic, rushes in)…\nMain: Tara (logical, slow to speak), Mira (creative), Jax (strong, short temper, secretly soft)…\nAdults: Mr. Coco the owner (kind, forgetful), Chef Bella (strict, secretive), Guard Raju (sleepy)…')),
      h('label.field', h('span', 'The world (one closed place for the whole story)'), ta('worldText', 3, 'e.g. A big old chocolate factory: entrance hall, cocoa room, mixing hall with giant vats, tasting lab, recipe vault, loading yard…')),
      h('div.field', h('span', 'Reference images (optional) — how the place / characters should look'),
        h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } }, (s.refs || []).map((r) => h('img', { src: `/projects/${pid}/refs/${r}`, style: { width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' } })),
          h('label.btn.small', icon('upload', 14), 'Add image', h('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, onchange: async (e) => { const fl = e.target.files[0]; if (!fl) return; R = await api.upload(`/api/projects/${pid}/room/refs?name=${encodeURIComponent(fl.name)}`, fl); render(); } })))),
      h('div.grid', { style: { gridTemplateColumns: '1fr 1fr', gap: '8px' } },
        h('label.field', h('span', 'Theme / lesson'), h('input.input', { value: s.theme || '', placeholder: 'teamwork, honesty…', oninput: (e) => f('theme', e.target.value) })),
        h('label.field', h('span', 'Tone'), h('input.input', { value: s.tone || '', oninput: (e) => f('tone', e.target.value) })),
        h('label.field', h('span', 'Length (minutes)'), h('input.input', { type: 'number', min: 1, max: 90, value: s.minutes, oninput: (e) => f('minutes', +e.target.value || 30) })),
        h('label.field', h('span', 'Episode length (seconds)'), h('input.input', { type: 'number', min: 20, max: 600, value: s.episodeSec, oninput: (e) => f('episodeSec', +e.target.value || 60) }))),
      h('div.field', h('span', 'AI for the room'), h('div.small', R.ai === 'cloud' ? 'Cloud (Claude) — best for long stories' : 'Local model on this Mac', ' · ', R.cloudAvailable ? h('a', { href: '#/settings' }, 'change in Settings') : h('span.muted', 'cloud needs ANTHROPIC_API_KEY in the environment'))),
      h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' } },
        btn(R.personas.length ? 'Re-create personas' : 'Create personas', async () => { if (R.personas.length && !(await confirmBox('Re-create all personas?', 'The cast cards are rebuilt from the description. Your edits to the cards will be replaced.', 'Re-create'))) return; job(`/api/projects/${pid}/room/personas`, {}, 'Creating personas'); }, 'primary', 'users'),
        btn('Start fresh', async () => { if (await confirmBox('Start fresh?', 'The conversation, mystery, world, outline and script are cleared. Your setup text stays.', 'Start fresh', true)) { R = await api.post(`/api/projects/${pid}/room/fresh`, { keepPersonas: false }); render(); } }, 'ghost', 'refresh'),
        btn('Skip to Story', () => app.go(`#/p/${pid}/story`), 'ghost')));
  }
  let setupTimer = null; const saveSetup = () => { clearTimeout(setupTimer); setupTimer = setTimeout(() => api.put(`/api/projects/${pid}/room/setup`, R.setup).catch(() => {}), 600); };
  function castPanel() {
    const addTa = h('textarea.input', { rows: 2, placeholder: 'Add a character: e.g. "Inspector Vega — a strict food inspector who seems suspicious but is actually helping"' });
    return h('div',
      R.personas.length ? R.personas.map((p) => personaCard(p)) : h('p.muted', 'No personas yet — write the cast description in Setup and press "Create personas".'),
      h('div.field', { style: { marginTop: '10px' } }, h('span', 'Add a persona'), addTa, btn('Add', () => { if (addTa.value.trim()) job(`/api/projects/${pid}/room/personas`, { only: addTa.value.trim() }, 'Adding a persona'); }, 'small', 'plus')));
  }
  function personaCard(p) {
    const open = openCard === p.id, sug = new Set(p.suggested || []);
    const lab = (k, t) => h('label', { class: sug.has(k) ? 'sug' : '' }, t, sug.has(k) ? ' · suggested' : '');
    const edit = {}, inp = (k, v, rows = 1) => (edit[k] = rows > 1 ? h('textarea.input', { rows }, v) : h('input.input', { value: v }));
    const list = (a) => (a || []).join(', '), lines = (a, f) => (a || []).map(f).join('\n');
    return h('div.pcard', h('div.ph', { onclick: () => { openCard = open ? null : p.id; render(); } }, h('span.dot', { style: { background: p.color } }), h('b', p.name), h('span.badge.p', p.kind), p.isCulprit ? h('span.badge.bad', { title: 'Only you can see this' }, 'culprit') : null, h('span.small.muted', { style: { marginLeft: 'auto' } }, p.role.slice(0, 40)), icon(open ? 'up' : 'down', 14)),
      open ? h('div.pb',
        h('div.grid', { style: { gridTemplateColumns: '1fr 1fr 70px', gap: '6px' } }, h('div', lab('name', 'Name'), inp('name', p.name)), h('div', lab('kind', 'Type'), (edit.kind = select(['hero', 'main', 'supporting', 'adult', 'suspect'], p.kind, () => {}))), h('div', lab('age', 'Age'), inp('age', p.age))),
        h('div', lab('role', 'Role'), inp('role', p.role)), h('div', lab('goal', 'Goal in this story'), inp('goal', p.goal, 2)), h('div', lab('plotPart', 'Part in the plot'), inp('plotPart', p.plotPart, 2)),
        h('div', lab('strengths', 'Strengths (comma separated)'), inp('strengths', list(p.strengths))), h('div', lab('weaknesses', 'Weaknesses'), inp('weaknesses', list(p.weaknesses))),
        h('div', lab('fear', 'Fear'), inp('fear', p.fear)), h('div', lab('secret', 'Secret'), inp('secret', p.secret)),
        h('div', lab('arc', 'Emotional arc: start → turn → end'), inp('arc', `${p.arc.start} → ${p.arc.turn} → ${p.arc.end}`, 2)),
        h('div', lab('emotions', 'Emotional moments (one per line: beat: moment)'), inp('emotions', lines(p.emotions, (e) => `${e.beat}: ${e.moment}`), 4)),
        h('div', lab('voiceStyle', 'How they talk'), inp('voiceStyle', p.voiceStyle)), h('div', lab('catchphrases', 'Catchphrases (comma separated)'), inp('catchphrases', list(p.catchphrases))),
        h('div', lab('relationships', 'Relationships (one per line: name: feeling)'), inp('relationships', lines(p.relationships, (r) => `${r.with}: ${r.feeling}`), 3)),
        h('div', lab('look', 'Look'), inp('look', p.look)), h('div', h('label', 'Studio voice'), (edit.voice = select(lib.voices.map((v) => [v.id, v.label]), p.voice, () => {}))),
        h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
          btn('Save', async () => {
            const g = (k) => edit[k].value, sp = (v) => v.split(',').map((x) => x.trim()).filter(Boolean), ln = (v) => v.split('\n').map((x) => x.trim()).filter(Boolean);
            const [a1, a2, a3] = g('arc').split('→').map((x) => x.trim());
            const data = { name: g('name'), kind: g('kind'), age: +g('age') || p.age, role: g('role'), goal: g('goal'), plotPart: g('plotPart'), strengths: sp(g('strengths')), weaknesses: sp(g('weaknesses')), fear: g('fear'), secret: g('secret'), arc: { start: a1 || '', turn: a2 || '', end: a3 || '' },
              emotions: ln(g('emotions')).map((x) => { const [b, ...m] = x.split(':'); return { beat: b.trim().toLowerCase(), moment: m.join(':').trim() }; }), voiceStyle: g('voiceStyle'), catchphrases: sp(g('catchphrases')), relationships: ln(g('relationships')).map((x) => { const [w, ...f] = x.split(':'); return { with: w.trim(), feeling: f.join(':').trim() }; }), look: g('look'), voice: g('voice') };
            const changed = Object.keys(data).filter((k) => JSON.stringify(data[k]) !== JSON.stringify(p[k]));
            await put(`/api/projects/${pid}/room/personas/${p.id}`, data); toast('Saved', 'ok', 1200);
            if (R.outline && changed.length) impactAsk(p);
          }, 'small primary', 'check'),
          btn('Delete', async () => { if (await confirmBox(`Delete ${p.name}?`, 'They leave the cast. If the story is already written, you can rewrite the affected episodes next.', 'Delete', true)) { const imp = R.outline ? await api.get(`/api/projects/${pid}/room/impact/${p.id}`) : null; R = await api.del(`/api/projects/${pid}/room/personas/${p.id}`); render(); if (imp && imp.episodes.length) impactAsk(p, imp); } }, 'small ghost danger', 'trash'))) : null);
  }
  async function impactAsk(p, imp) {
    imp = imp || await api.get(`/api/projects/${pid}/room/impact/${p.id}`);
    if (!imp.episodes.length) return;
    const m = modal('Update the story?', h('div', h('p', `${p.name} appears in episode${imp.episodes.length > 1 ? 's' : ''} ${imp.episodes.join(', ')}${imp.steps.length ? ` and plan steps ${imp.steps.join(', ')}` : ''}.`), h('p.muted', 'Rewrite those episodes so the change shows? Everything else stays as it is.')),
      { actions: [{ label: 'Not now', value: false }, { label: `Rewrite ${imp.episodes.length} episode${imp.episodes.length > 1 ? 's' : ''}`, cls: 'primary', value: true }] });
    if (await m.done) job(`/api/projects/${pid}/room/rewrite`, { episodes: imp.episodes }, 'Rewriting episodes');
  }
  function worldPanel() {
    const w = R.world; const note = h('input.input', { placeholder: 'Change request, e.g. "add a secret tunnel under the vault"' });
    if (!w) return h('div', h('p.muted', 'The world is designed after the mystery (it needs to know where the clues are).'), R.bible ? btn('Design the world', () => job(`/api/projects/${pid}/room/world`, {}, 'Designing the world'), 'primary', 'pin') : null);
    return h('div', h('h3', w.name), h('p.small.muted', w.description), w.style ? h('p.small', 'Style: ', w.style) : null,
      w.rooms.map((r) => h('div.pcard', h('div.pb', { style: { borderTop: 0 } }, h('b', r.name), h('div.small.muted', r.description), h('div.small', h('b', 'In it: '), (r.props || []).join(', ')), h('div.small', h('b', 'Mood: '), `${r.mood || ''} · ${r.lighting || ''}`), h('div.small', h('b', 'Connects to: '), (r.connects || []).join(', '))))),
      h('div.field', note, btn('Redesign the world', () => job(`/api/projects/${pid}/room/world`, { note: note.value }, 'Redesigning the world'), 'small')),
      h('p.small.muted', 'Next build step: these areas become one connected 3D map, so every camera angle is full.'));
  }

  // ---------- middle: the live room ----------
  function msgEl(m) {
    const p = R.personas.find((x) => x.id === m.who), nm = m.who === 'director' ? 'You (Director)' : m.who === 'showrunner' ? 'Showrunner' : m.who === 'narrator' ? 'Narrator' : p?.name || m.who;
    const col = m.who === 'director' ? '#4c1d95' : m.who === 'showrunner' ? '#334155' : m.who === 'narrator' ? '#b45309' : p?.color || '#64748b';
    const cls = m.who === 'director' ? 'director' : m.who === 'narrator' ? 'narrator' : m.kind === 'system' ? 'system' : '';
    return h('div.msg' + (cls ? '.' + cls : ''), h('div.av', { style: { background: col } }, m.who === 'director' ? '★' : m.who === 'narrator' ? '✎' : m.who === 'showrunner' ? 'SR' : nm[0]), h('div.bub', h('div.nm', { style: { color: m.who === 'director' ? undefined : col } }, nm, m.step ? h('span.muted', { style: { fontWeight: 400 } }, ` · step ${m.step}${m.room ? ' · ' + m.room : ''}`) : ''), m.text.split(/(\*[^*]+\*)/).map((t) => (/^\*.*\*$/.test(t) ? h('i', { style: { color: '#64748b' } }, t.slice(1, -1)) : t))));
  }
  function nextAction() {
    const st = R.stage;
    if (st === 'setup') return btn('Create personas', () => job(`/api/projects/${pid}/room/personas`, {}, 'Creating personas'), 'primary', 'users');
    if (st === 'personas') return btn('Design the mystery', () => job(`/api/projects/${pid}/room/mystery`, {}, 'Designing the mystery'), 'primary', 'zoomin');
    if (st === 'mystery') return btn('Design the world', () => job(`/api/projects/${pid}/room/world`, {}, 'Designing the world'), 'primary', 'pin');
    if (st === 'world' || st === 'discussion') {
      if (R.running) return btn('Pause the room', () => api.post(`/api/projects/${pid}/room/stop`), '', 'pause');
      const left = R.plan.length - R.planStep;
      return h('div', { style: { display: 'flex', gap: '6px' } }, left > 0 ? btn(R.planStep ? 'Continue the room' : 'Start the room', async () => { await api.post(`/api/projects/${pid}/room/run`, {}); await refresh(); }, 'primary', 'play') : null, left > 0 ? btn('One step', async () => { await api.post(`/api/projects/${pid}/room/run`, { steps: 1 }); await refresh(); }, 'ghost') : null,
        R.planStep > 0 ? btn('Make the outline', () => job(`/api/projects/${pid}/room/outline`, {}, 'Making the outline'), left > 0 ? 'ghost' : 'primary', 'story') : null);
    }
    if (st === 'outline') return btn('Write the scenes', () => job(`/api/projects/${pid}/room/script`, {}, 'Writing the scenes'), 'primary', 'text');
    if (st === 'scenes' || st === 'done') return handoffBtn();
    return null;
  }
  function handoffBtn() {
    const ws = select([['humans', 'Realistic kids'], ['explorers', 'Zungga Explorers'], ['toon', 'Cartoon world'], ['people', 'People']], app.project.project.world || 'humans', () => {}, { style: { width: 'auto' } });
    return h('div', { style: { display: 'flex', gap: '6px', alignItems: 'center' } }, ws, btn('Send to Story', async () => { try { const r = await api.post(`/api/projects/${pid}/room/handoff`, { world: ws.value }); toast(`${r.scenes} script lines sent to the Story step`, 'ok'); app.project = null; app.go(`#/p/${pid}/story`); } catch (e) { toast(e.message, 'error'); } }, 'primary', 'check'));
  }
  function middle() {
    const ix = stageIdx(R.stage);
    const comp = h('textarea.input', { placeholder: R.stage === 'setup' || R.stage === 'personas' ? 'Your ideas for the story — post as many as you like, then create personas / design the mystery…' : 'Direct the room: change the plan, push a character, add a twist… (Enter to send, Shift+Enter for a new line)' });
    const send = async () => { const t = comp.value.trim(); if (!t) return; comp.value = ''; try { await api.post(`/api/projects/${pid}/room/director`, { text: t }); } catch (e) { toast(e.message, 'error'); } };
    comp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
    clear(chatEl, R.messages.length ? R.messages.map(msgEl) : h('div.empty', h('h3', 'The Writers\' Room'), h('p', 'Describe the story and the characters on the left. The characters will plan it live here — and you can step in any time as the Director.')));
    clear(cols[1],
      h('div.stagebar', STAGES.map(([k, l], i) => h('span.st' + (i < ix ? '.done' : i === ix ? '.on' : ''), l)), h('span', { style: { flex: 1 } }), busy ? h('span#roombusy.small.muted', busy) : nextAction()),
      chatEl, R.running ? h('div.typing', '… the room is talking (you can interrupt any time)') : null,
      h('div.composer', comp, btn('Send', send, 'primary', 'next')));
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  // ---------- right: hidden solution / plan / outline / emotions / script ----------
  function rightPanel() {
    const tabs = [['solution', 'Solution 🔒'], ['plan', 'Plan'], ['outline', 'Episodes'], ['emotions', 'Emotions'], ['script', 'Script']];
    let body;
    if (rightTab === 'solution') {
      const b = R.bible;
      body = b ? h('div', h('p.small.muted', 'Only you see this — the kid personas don\'t know it.'), h('div.kv', h('b', 'Culprit: '), b.culprit), h('div.kv', h('b', 'Motive: '), b.motive), h('div.kv', h('b', 'How: '), b.how),
        h('div.section-title', 'Clues'), b.clues.map((c) => h('div.kv', h('b', c.id + ' '), `${c.clue} — in ${c.where}, found by ${c.foundBy} (${c.how})`)),
        h('div.section-title', 'Red herrings'), b.redHerrings.map((r) => h('div.kv', `${r.clue} → suspects ${r.suspect}; cleared by ${r.clearedBy}`)),
        h('div.kv', h('b', 'Reveal: '), b.reveal), h('div.kv', h('b', 'Lesson: '), b.lesson),
        btn('Redesign the mystery', async () => { const note = prompt('What should change? (optional)') || ''; job(`/api/projects/${pid}/room/mystery`, { note }, 'Redesigning the mystery'); }, 'small ghost')) : h('p.muted', 'The hidden solution appears here after "Design the mystery".');
    } else if (rightTab === 'plan') {
      body = R.plan.length ? h('div', R.plan.map((s, i) => h('div.kv', { style: { opacity: i < R.planStep ? 0.55 : 1, fontWeight: i === R.planStep ? 700 : 400 } }, i < R.planStep ? '✓ ' : i === R.planStep ? '▶ ' : '· ', `${s.step}. [${s.room}] ${s.goal}`, s.clue ? h('span.badge.p', { style: { marginLeft: '4px' } }, s.clue) : null, h('span.small.muted', ` — ${s.emotion}`)))) : h('p.muted', 'The plan of story steps appears with the mystery.');
    } else if (rightTab === 'outline') {
      body = R.outline ? h('div', R.outline.episodes.map((e) => h('div.pcard', h('div.pb', { style: { borderTop: 0 } }, h('b', `Episode ${e.n}: ${e.title}`), h('div.small.muted', e.summary), e.scenes.map((sc) => h('div.small', `• [${sc.room}] ${sc.what}`)))))) : h('p.muted', 'Episodes appear after "Make the outline".');
    } else if (rightTab === 'emotions') {
      const have = {}; for (const p of R.personas) have[p.id] = new Set();
      for (const e of R.outline?.episodes || []) for (const sc of e.scenes) for (const [n, f] of Object.entries(sc.feelings || {})) { const p = R.personas.find((x) => x.name.toLowerCase() === n.toLowerCase()); if (p) for (const b of BEATS) if (String(f).toLowerCase().includes(b) || EMO_TO_BEAT[String(f).toLowerCase()] === b) have[p.id].add(b); }
      for (const sc of Object.values(R.script || {})) for (const l of sc.lines || []) { const p = R.personas.find((x) => x.name.toLowerCase() === String(l.who).toLowerCase()); const b = EMO_TO_BEAT[String(l.emotion).toLowerCase()]; if (p && b) have[p.id].add(b); if (p && /sorry|apolog/i.test(l.text)) have[p.id].add('apology'); if (p && /my fault|i messed|mistake/i.test(l.text)) have[p.id].add('mistake'); }
      body = h('div', h('p.small.muted', 'Which feelings each character goes through (from the episodes and script). Planned moments from their cards are ◦.'),
        h('table.emo', { style: { width: '100%', borderCollapse: 'collapse' } }, h('tr', h('th', ''), BEATS.map((b) => h('th', b.slice(0, 4)))),
          R.personas.filter((p) => p.kind === 'hero' || p.kind === 'main').map((p) => h('tr', h('td', { style: { textAlign: 'left', fontWeight: 600, color: p.color } }, p.name), BEATS.map((b) => h('td', have[p.id].has(b) ? '●' : p.emotions.some((e) => e.beat === b) ? '◦' : ''))))),
        h('p.small.muted', 'Tell the room in chat if someone needs a missing moment, e.g. "Jax needs a guilt moment in episode 6".'));
    } else {
      const eps = R.outline?.episodes || [];
      const ep = eps.find((e) => e.n === epSel) || eps[0];
      body = ep ? h('div', select(eps.map((e) => [e.n, `Episode ${e.n}: ${e.title}`]), ep.n, (v) => { epSel = +v; render(); }),
        ep.scenes.map((sc) => h('div', h('div.section-title', `${sc.title || sc.room}`), (R.script[sc.id]?.lines || []).map((l, li) => h('div.kv', h('b', { style: { color: R.personas.find((p) => p.name.toLowerCase() === String(l.who).toLowerCase())?.color } }, `${l.who}: `), h('span', { contenteditable: 'true', onblur: async (e) => { if (e.target.textContent !== l.text) { l.text = e.target.textContent; await api.put(`/api/projects/${pid}/room/script/${sc.id}`, R.script[sc.id]); } } }, l.text), h('span.small.muted', ` (${l.emotion}${l.camera ? ' · ' + l.camera : ''})`))), !R.script[sc.id] ? h('p.small.muted', 'Not written yet.') : null))) : h('p.muted', 'The script appears after "Write the scenes".');
    }
    clear(cols[2], h('div.tabs', tabs.map(([k, l]) => h('button.tab' + (rightTab === k ? '.on' : ''), { onclick: () => { rightTab = k; render(); } }, l))), h('div.scroll', body));
  }
  function render() {
    clear(cols[0], h('div.tabs', [['setup', 'Setup'], ['cast', `Cast (${R.personas.length})`], ['world', 'World']].map(([k, l]) => h('button.tab' + (leftTab === k ? '.on' : ''), { onclick: () => { leftTab = k; render(); } }, l))),
      h('div.scroll', leftTab === 'setup' ? setupPanel() : leftTab === 'cast' ? castPanel() : worldPanel()));
    middle(); rightPanel();
  }
  if (R.personas.length && leftTab === 'setup' && R.stage !== 'setup') leftTab = 'cast';
  render();
  return {
    onEvent: async (ev) => {
      if (ev.project !== pid) return;
      if (ev.type === 'room-msg') { R.messages.push(ev.msg); chatEl.append(msgEl(ev.msg)); chatEl.scrollTop = chatEl.scrollHeight; }
      if (ev.type === 'room-state') { const keep = chatEl.scrollTop; R = await api.get(`/api/projects/${pid}/room`); const ae = document.activeElement; if (ae && ae.closest('.room') && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT' || ae.isContentEditable)) { rightPanel(); return; } render(); chatEl.scrollTop = keep; }
    },
  };
}
