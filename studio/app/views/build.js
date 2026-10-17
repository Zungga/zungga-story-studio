// Build: stage the story automatically, sort out anything the library doesn't have (build / substitute / skip),
// make the voice clips and time every word. Then on to the Studio.
import { h, clear, icon, btn, toast, select, confirmBox } from '../ui.js';
import { api, waitJob } from '../api.js';
import { draftFromStory, placeLabel } from './story.js';

export async function mount(el, { app }) {
  const pid = app.project.project.id, lib = await app.lib(), conf = await app.conf();
  let P = await app.reloadProject(), draft = P.draft || draftFromStory(P.story, P.project), staged = null, report = null, voiceJob = null;
  const skip = new Set();

  async function restage(keepEdits = true) {
    const r = await api.post(`/api/projects/${pid}/stage`, { draft, keepEdits }); staged = r.story; report = r.report; P = await app.reloadProject(); render();
  }
  async function makeVoice(opts = {}) {
    try {
      const j = await api.post(`/api/projects/${pid}/voice`, { voice: draft.voice || staged?.voice?.voice || conf.voice, ...opts }); voiceJob = j; render();
      await waitJob(j.id, (jj) => { voiceJob = jj; const b = el.querySelector('#vprog'); if (b) { b.querySelector('b').textContent = jj.message; b.querySelector('i').style.width = Math.round(jj.progress * 100) + '%'; } });
      toast('Voice ready, every word timed', 'ok');
    } catch (e) { toast(e.message, 'error'); }
    voiceJob = null; P = await app.reloadProject(); render();
  }
  function fixIssue(it, how, value) {
    if (it.kind === 'prop') { for (const [i, s] of draft.scenes.entries()) if (!it.scene || i === it.scene - 1) s.objects = (s.objects || []).flatMap((o) => (o.toLowerCase() === it.name ? (how === 'sub' ? [value] : []) : [o])); }
    if (it.kind === 'place' && how === 'sub') draft.scenes[it.scene - 1].place = value;
    if (it.kind === 'place' && how === 'skip') draft.scenes[it.scene - 1].place = it.chosen;
    if (it.kind === 'character' && it.preset && how === 'sub') { const c = draft.cast.find((x) => x.id === it.name); if (c) c.preset = value; }
    if (it.kind === 'character' && !it.preset) { for (const s of draft.scenes) s.characters = (s.characters || []).filter((c) => c !== it.name); }
    api.put(`/api/projects/${pid}/draft`, draft).then(() => restage());
  }

  function render() {
    const st = staged || P.story, vs = P.voice, voices = lib.voices, cur = draft?.voice || st?.voice?.voice || conf.voice, vinfo = voices.find((v) => v.id === cur);
    const missing = (report?.missing || []).filter((m) => !skip.has(m.kind + m.name + m.scene)), warnings = report?.warnings || [];
    const nProps = st ? st.scenes.reduce((n, s) => n + (s.props || []).length, 0) : 0, nShots = st ? st.scenes.reduce((n, s) => n + (s.camera || []).length, 0) : 0;
    clear(el, h('div.page', { style: { maxWidth: '1000px' } },
      h('div.page-head', h('div', h('h1', 'Build'), h('p', 'Everything is set up automatically from the story and the asset library. You can change any of it in the Studio.')),
        h('div.actions', btn('Back to the story', () => app.go(`#/p/${pid}/story`), '', 'story'), btn('Open the Studio', () => app.go(`#/p/${pid}/studio`), 'primary', 'studio'))),

      h('div.card.pad', h('div.isec-h', h('h3', '1 · Stage the scenes'), st ? h('span.badge.ok', icon('check', 12), 'Staged') : h('span.badge.warn', 'Not yet')),
        st ? h('p.muted', `${st.scenes.length} scenes · ${Object.keys(st.cast).length} characters · ${nProps} props · ${nShots} camera shots · actions and expressions timed to words`) : h('p.muted', 'Positions, actions, expressions, props, camera shots, counters, rain and the end card are picked from the story.'),
        h('div', { style: { display: 'flex', gap: '8px' } }, btn(st ? 'Build again (keeps scenes you changed by hand)' : 'Build the scenes', () => restage(true), st ? '' : 'primary', 'wand'),
          st ? btn('Rebuild everything from scratch', async () => { if (await confirmBox('Rebuild everything?', 'Every scene is staged again automatically. Changes you made by hand in the Studio are replaced (they stay in Version history).', 'Rebuild', true)) restage(false); }, 'ghost danger') : null)),

      report ? h('div.card.pad', { style: { marginTop: '14px' } }, h('div.isec-h', h('h3', '2 · Missing things'), missing.length ? h('span.badge.warn', `${missing.length} to sort out`) : h('span.badge.ok', icon('check', 12), 'Nothing missing')),
        missing.length ? missing.map((it) => h('div.issue',
          h('div', h('b', it.kind === 'prop' ? `“${it.name}”` : it.kind === 'place' ? `Place “${it.name}”` : `Character “${it.name}”`), h('div.small.muted', it.scene ? `Scene ${it.scene} · ` : '', it.kind === 'prop' ? 'not in the library yet' : it.kind === 'place' ? `not built yet — using ${placeLabel(it.chosen)} for now` : it.preset ? `look “${it.preset}” isn't in the library` : 'not in the cast')),
          h('div', { style: { display: 'flex', gap: '6px', alignItems: 'center' } },
            it.kind !== 'character' || it.preset ? btn('Build it', async () => { await api.post('/api/library/requests', { name: it.name, kind: it.kind, project: pid, note: `Scene ${it.scene || '-'}: needed for "${draft.title}"` }); toast(`Asked for “${it.name}” — it's in Library → Requests. Using a stand-in until it's built.`, 'ok', 5000); skip.add(it.kind + it.name + it.scene); render(); }, 'small', 'wand') : null,
            (it.suggestions || []).length ? select([['', 'Use instead…'], ...it.suggestions.map((s) => [s.id, s.label])], '', (v) => v && fixIssue(it, 'sub', v), { style: { width: '170px', padding: '5px 26px 5px 9px', fontSize: '12px' } }) : null,
            btn('Skip', () => { skip.add(it.kind + it.name + it.scene); if (it.kind !== 'place') fixIssue(it, 'skip'); else render(); }, 'small ghost')))) : h('p.muted', 'Every object, place and character the story needs is in the library.'),
        warnings.length ? [h('div.section-title', 'Checks'), warnings.map((w) => h('div.issue', h('div', h('b', `Scene ${w.scene}`), h('div.small.muted', w.text)), h('span.badge.warn', 'Check')))] : null) : null,

      h('div.card.pad', { style: { marginTop: '14px' } }, h('div.isec-h', h('h3', '3 · Voice and word timing'), vs?.ready ? h('span.badge.ok', icon('check', 12), vs.borrowed ? 'Using the original story’s voice' : 'Ready') : h('span.badge.warn', vs ? `${vs.scenes.filter((s) => !s.has || s.stale).length} lines to make` : 'Build first')),
        h('div.frow', h('label', 'Voice'), h('div.fctl', select(voices.map((v) => [v.id, `${v.label}${v.hasReference ? '' : ' (recording missing on this Mac)'}`]), cur, async (v) => { draft.voice = v; await api.put(`/api/projects/${pid}/draft`, draft); if (P.story) { P.story.voice = { ...(P.story.voice || {}), voice: v }; await api.put(`/api/projects/${pid}/story?label=Voice changed`, P.story); } P = await app.reloadProject(); render(); })), btn('Hear it', () => new Audio(`/selected-voices/${cur}/reference.wav`).play(), 'small ghost', 'volume')),
        vinfo?.note ? h('p.small', { style: { color: 'var(--warn)' } }, '⚠ ', vinfo.note) : cur === 'narrator' ? h('p.small', { style: { color: 'var(--warn)' } }, '⚠ This voice was cloned from a downloaded clip — publishing needs the speaker’s permission.') : null,
        vs ? h('div', vs.scenes.map((s) => h('div.vrow', h('b', `#${s.id}`), h('span.muted', (st.scenes.find((x) => x.id === s.id)?.narration || '').slice(0, 90)), s.has && !s.stale ? h('span.badge.ok', 'Voiced') : s.stale ? h('span.badge.warn', 'Line changed') : h('span.badge.bad', 'No clip'), s.timed ? h('span.badge.ok', 'Words timed') : h('span.badge.warn', 'Not timed')))) : null,
        voiceJob ? h('div#vprog', { style: { marginTop: '10px' } }, h('b', voiceJob.message || 'Starting…'), h('div.bar', h('i', { style: { width: Math.round((voiceJob.progress || 0) * 100) + '%' } }))) :
          h('div', { style: { display: 'flex', gap: '8px', marginTop: '12px' } }, btn(vs?.borrowed ? 'Make this project’s own voice' : vs?.ready ? 'Re-time the words' : 'Make the voice', () => makeVoice(vs?.ready && !vs.borrowed ? { scenes: [] } : {}), vs?.ready ? '' : 'primary', 'mic'),
            vs && !vs.borrowed ? btn('Remake every line', async () => { if (await confirmBox('Remake every line?', 'All voice clips are made again (3 takes each, best kept). This takes a few minutes.', 'Remake')) makeVoice({ scenes: st.scenes.map((s) => s.id) }); }, 'ghost') : null),
        h('p.small.muted', { style: { marginTop: '8px' } }, 'Each line is made 3 times and the take closest to the voice’s pitch and pace is kept. Whisper then finds when every word is said, so the camera, actions and sounds land on the words.')),

      h('div', { style: { display: 'flex', justifyContent: 'flex-end', marginTop: '18px' } }, btn('Open the Studio', () => app.go(`#/p/${pid}/studio`), 'primary big', 'studio'))));
  }
  if (!P.story && draft) await restage(true); else render();
  if (P.story && draft && !report) { const r = await api.post(`/api/projects/${pid}/stage`, { draft, save: false }); report = { missing: r.report.missing, warnings: (await api.post(`/api/projects/${pid}/check`, {})).warnings }; render(); }
  return {};
}
