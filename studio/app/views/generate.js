// Generate: render the final MP4 on this Mac (headless Chrome on the GPU + ffmpeg), with a gallery of everything made.
import { h, clear, icon, btn, toast, select, row, toggle, num, slider, fmtBytes, ago, confirmBox } from '../ui.js';
import { api, waitJob, jobs } from '../api.js';

const PRESETS = [['1080x1920', '1080 × 1920', 'Reels · Shorts · TikTok', [1080, 1920]], ['720x1280', '720 × 1280', 'Smaller vertical', [720, 1280]], ['1920x1080', '1920 × 1080', 'YouTube', [1920, 1080]], ['1080x1080', '1080 × 1080', 'Square post', [1080, 1080]], ['custom', 'Custom', 'Any size', null]];

export async function mount(el, { app }) {
  const pid = app.project.project.id, conf = await app.conf(), lib = await app.lib();
  let P = await app.reloadProject(); if (!P.story) { app.go(`#/p/${pid}/build`); return {}; }
  const story = P.story, n = story.scenes.length;
  const st = { preset: conf.render?.preset || '1080x1920', width: conf.render?.width || 1080, height: conf.render?.height || 1920, fps: conf.render?.fps || 30, quality: conf.render?.quality || 'final', from: 1, to: n, subtitles: story.options?.subtitles ?? conf.render?.subtitles ?? true, endCard: story.options?.endCard ?? conf.render?.endCard ?? true, music: story.music?.file || '', musicVol: story.music?.vol ?? 0.12, voiceDir: '', fileName: '' };
  let gallery = [], running = [...jobs.values()].find((j) => j.project === pid && j.type === 'render' && ['running', 'queued'].includes(j.status));
  const est = () => { const secs = P.story.scenes.reduce((a, s) => a + Math.max(2, (s.narration || '').split(/\s+/).length / 2.6 + 0.7), 0) * ((st.to - st.from + 1) / n), px = st.width * st.height / (1080 * 1920); return Math.max(10, secs * st.fps / 30 * px * (st.quality === 'draft' ? 0.35 : 0.6)); };
  async function loadGallery() { gallery = await api.get(`/api/projects/${pid}/exports`); }
  async function go() {
    // music & subtitle choices are part of the story, so the Studio preview matches the video
    const s2 = { ...P.story, options: { ...(P.story.options || {}), subtitles: st.subtitles, endCard: st.endCard } };
    if (st.music) s2.music = { ...(P.story.music?.file === st.music ? P.story.music : { start: 0, fadeIn: 0.6, fadeOut: 2, ...(lib.musicInfo?.[st.music]?.text ? { credit: lib.musicInfo[st.music] } : {}) }), file: st.music, vol: st.musicVol }; else delete s2.music;   // keeps the chosen part + credit
    if (JSON.stringify(s2) !== JSON.stringify(P.story)) { await api.put(`/api/projects/${pid}/story?label=Generate settings`, s2); P = await app.reloadProject(); }
    const ids = P.story.scenes.map((s) => s.id);
    try {
      running = await api.post(`/api/projects/${pid}/render`, { width: st.width, height: st.height, fps: st.fps, quality: st.quality, subtitles: st.subtitles, endCard: st.endCard, from: st.from > 1 ? ids[st.from - 1] : null, to: st.to < n ? ids[st.to - 1] : null, voiceDir: st.voiceDir || undefined, fileName: st.fileName || undefined });
      render(); await waitJob(running.id, (j) => { running = j; const b = el.querySelector('#rprog'); if (b) { b.querySelector('b').textContent = j.status === 'queued' ? 'Waiting for another job to finish…' : j.message; b.querySelector('i').style.width = Math.round(j.progress * 100) + '%'; } });
    } catch (e) { toast(e.message, 'error', 8000); }
    running = null; await loadGallery(); render();
  }
  function render() {
    const vs = P.voice, voices = (P.story.voices || []).map((v) => [v.dir, v.label]);
    clear(el, h('div.page',
      h('div.page-head', h('div', h('h1', 'Generate'), h('p', `${P.story.title} · ${n} scenes`)), h('div.actions', btn('Open the exports folder', () => api.post(`/api/projects/${pid}/reveal`), '', 'folder'))),
      h('div.grid', { style: { gridTemplateColumns: '1.1fr 1fr', alignItems: 'start' } },
        h('div.card.pad',
          h('h3', { style: { marginBottom: '10px' } }, 'Video settings'),
          h('div.grid', { style: { gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '12px' } }, PRESETS.map(([id, label, note, wh]) => h('div.preset' + (st.preset === id ? '.on' : ''), { onclick: () => { st.preset = id; if (wh) [st.width, st.height] = wh; render(); } },
            h('div.shape', { style: wh ? { width: (wh[0] > wh[1] ? 44 : 44 * wh[0] / wh[1]) + 'px', height: (wh[1] >= wh[0] ? 44 : 44 * wh[1] / wh[0]) + 'px' } : { width: '30px', height: '30px', borderRadius: '50%' } }), h('b', label), h('small.muted', note)))),
          st.preset === 'custom' ? row('Size', h('div.fctl', num(st.width, (v) => (st.width = v || 1080), { step: 2, w: 90 }), '×', num(st.height, (v) => (st.height = v || 1920), { step: 2, w: 90 }))) : null,
          row('Frame rate', select([[24, '24 fps (film)'], [30, '30 fps (standard)'], [60, '60 fps (smooth)']], st.fps, (v) => { st.fps = +v; render(); })),
          row('Quality', select([['final', 'Final (best, slower)'], ['draft', 'Draft (quick check)']], st.quality, (v) => { st.quality = v; render(); })),
          row('Scenes', h('div.fctl', select(P.story.scenes.map((s, i) => [i + 1, `${i + 1}. ${s.title}`]), st.from, (v) => { st.from = +v; if (st.to < st.from) st.to = st.from; render(); }), 'to', select(P.story.scenes.map((s, i) => [i + 1, `${i + 1}. ${s.title}`]), st.to, (v) => { st.to = +v; if (st.from > st.to) st.from = st.to; render(); }))),
          row('Voice', voices.length ? select([['', 'Project voice'], ...voices], st.voiceDir, (v) => (st.voiceDir = v)) : h('span', vs?.borrowed ? 'From the original story' : (lib.voices.find((v) => v.id === P.story.voice?.voice)?.label || P.story.voice?.voice || '—'), vs && !vs.ready ? h('span.badge.warn', { style: { marginLeft: '8px' } }, 'some lines need a voice') : null)),
          row('Subtitles', toggle(st.subtitles, (v) => (st.subtitles = v), 'Burn in the narration at the bottom')),
          row('Music', select([['', 'None'], ...lib.music.map((f) => [f, f.replace(/^.*\//, '')]), ...lib.sfx.filter((f) => /waves|wind/.test(f)).map((f) => [f, f + ' (ambient)'])], st.music, (v) => { st.music = v; render(); })),
          st.music ? row('Music volume', slider(st.musicVol, (v) => (st.musicVol = v), { max: 0.6 })) : null,
          st.music ? h('p.small.muted', { style: { margin: '0 0 6px 122px' } }, P.story.music?.file === st.music ? `Plays from ${Math.floor((P.story.music.start || 0) / 60)}:${String(Math.floor((P.story.music.start || 0) % 60)).padStart(2, '0')} of the track — change the part in Studio → Sound.` : 'Plays from the start of the track — choose the part in Studio → Sound.', (lib.musicInfo?.[st.music]?.license === 'by') ? h('span', { style: { color: 'var(--warn)', display: 'block' } }, 'Credit needed: ' + lib.musicInfo[st.music].text) : null) : null,
          h('div', { style: { margin: '0 0 6px 122px' } }, btn('Find free music…', async () => { const { pickMusic } = await import('./music.js'); const c = await pickMusic(app); if (c) { await app.lib(true); Object.assign(lib, app.library); st.music = c.file; render(); } }, 'small ghost', 'music')),
          row('End card', toggle(st.endCard, (v) => (st.endCard = v), 'Zungga logo at the end')),
          row('File name', h('input.input', { value: st.fileName, placeholder: `${slug(P.story.title)}-${st.width}x${st.height}${st.quality === 'draft' ? '-draft' : ''}`, oninput: (e) => (st.fileName = e.target.value) }), h('span.muted', '.mp4')),
          h('div', { style: { marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' } },
            running ? h('div#rprog', { style: { flex: 1 } }, h('b', running.message || 'Starting…'), h('div.bar', h('i', { style: { width: Math.round((running.progress || 0) * 100) + '%' } })), btn('Cancel', async () => { await api.post(`/api/jobs/${running.id}/cancel`); }, 'small ghost', null)) :
              [btn('Generate video', go, 'primary big', 'generate'), h('span.muted.small', `About ${Math.round(est() / 60) || '<1'} min on this Mac · ${st.width}×${st.height} · ${st.fps} fps`)])),
        h('div', h('h3', { style: { margin: '4px 0 10px' } }, `Videos (${gallery.length})`),
          gallery.length ? gallery.map((v) => h('div.card.vcard', { style: { marginBottom: '14px' } },
            h('video', { src: v.file + '?t=' + Date.parse(v.made), controls: true, preload: 'metadata', playsInline: true }),
            h('div', { style: { padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
              h('div', { style: { flex: 1, minWidth: '140px' } }, h('b', v.name), v.music?.credit ? h('div.small', { style: { color: v.music.license === 'by' ? 'var(--warn)' : 'var(--muted)' }, title: 'Put this in the post description' }, v.music.credit) : null, h('div.small.muted', `${v.width ? `${v.width}×${v.height} · ${v.fps} fps · ` : ''}${v.quality === 'draft' ? 'draft · ' : ''}${fmtBytes(v.size)} · ${ago(v.made)}`)),
              h('a.btn.small', { href: v.file, download: v.name }, icon('download', 14), 'Download'),
              btn('', async () => { if (await confirmBox('Delete video?', v.name, 'Delete', true)) { await api.del(`/api/projects/${pid}/exports/${encodeURIComponent(v.name)}`); await loadGallery(); render(); } }, 'small ghost danger', 'trash', 'Delete')))) : h('div.card.pad.muted', 'Your videos appear here. They are saved in projects/' + pid + '/exports/.')))));
  }
  await loadGallery(); render();
  if (running) waitJob(running.id, (j) => { running = j; const b = el.querySelector('#rprog'); if (b) { b.querySelector('b').textContent = j.message; b.querySelector('i').style.width = Math.round(j.progress * 100) + '%'; } }).catch(() => {}).finally(async () => { running = null; await loadGallery(); render(); });
  return {};
}
const slug = (s) => String(s || 'story').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
