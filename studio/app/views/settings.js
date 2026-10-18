// Settings: AI models, defaults for new projects, brand rules, storage, and the health check (same as ./doctor.sh).
import { h, clear, icon, btn, toast, select, row, toggle, slider, fmtBytes, confirmBox } from '../ui.js';
import { api } from '../api.js';

const STORY_MODELS = [['mlx-community/Qwen2.5-7B-Instruct-4bit', 'Qwen 2.5 · 7B (default, ~4 GB, fast)'], ['mlx-community/Qwen2.5-14B-Instruct-4bit', 'Qwen 2.5 · 14B (~8 GB, better stories, slower)'], ['mlx-community/Meta-Llama-3.1-8B-Instruct-4bit', 'Llama 3.1 · 8B (~4.5 GB)'], ['mlx-community/Mistral-7B-Instruct-v0.3-4bit', 'Mistral · 7B (~4 GB)']];

export async function mount(el, { app }) {
  let s = await app.conf(true), lib = await app.lib(), health = null, storage = null;
  const save = async (patch, msg = 'Saved') => { s = await api.put('/api/settings', patch); app.settings = s; toast(msg, 'ok', 1500); render(); };
  async function check() { health = null; render(); [health, storage] = await Promise.all([api.get('/api/health'), api.get('/api/storage')]); render(); }
  function render() {
    clear(el, h('div.page', { style: { maxWidth: '980px' } },
      h('div.page-head', h('div', h('h1', 'Settings'), h('p', 'Saved on this Mac only (settings.local.json, not in git).')), h('div.actions', btn('Reset to defaults', async () => { if (await confirmBox('Reset settings?', 'Models, defaults and brand rules go back to the defaults.', 'Reset')) { s = await api.post('/api/settings/reset'); app.settings = s; render(); } }, 'ghost'))),
      h('div.grid.g2', { style: { alignItems: 'start' } },
        h('div.card.pad', h('h3', { style: { marginBottom: '8px' } }, 'AI models'),
          row('Story writer', select(STORY_MODELS.concat(STORY_MODELS.some(([m]) => m === s.storyModel) ? [] : [[s.storyModel, s.storyModel]]), s.storyModel, (v) => save({ storyModel: v }, 'Story model changed — it downloads on first use'))),
          row('Writers\' Room AI', select([['local', 'Local (this Mac)'], ['cloud', 'Cloud — Claude (needs ANTHROPIC_API_KEY)']], s.roomAI || 'local', (v) => save({ roomAI: v }, v === 'cloud' ? 'Cloud selected — used when the key is set, otherwise local' : 'Local selected'))),
          row('Voice', h('span.small', 'Qwen3-TTS 1.7B (cloning) · mlx-audio')),
          row('Word timing', h('span.small', s.whisperModel)),
          row('Python', h('input.input', { value: s.python, onchange: (e) => save({ python: e.target.value }) })),
          h('p.small.muted', 'All models are open-source and run locally on Apple Silicon (MLX). Nothing is sent anywhere.')),
        h('div.card.pad', h('h3', { style: { marginBottom: '8px' } }, 'Defaults for new projects'),
          row('World', select([['toon', 'Cartoon world'], ['people', 'People']], s.world, (v) => save({ world: v }))),
          row('Voice', select(lib.voices.map((v) => [v.id, v.label]), s.voice, (v) => save({ voice: v }))),
          row('Pause after lines', slider(s.pauseAfter, (v, f) => f && save({ pauseAfter: Math.round(v * 10) / 10 }), { min: 0.2, max: 2, step: 0.1, fmt: (v) => v.toFixed(1) + 's' })),
          row('Video size', select([['1080x1920', '1080 × 1920 (vertical)'], ['720x1280', '720 × 1280'], ['1920x1080', '1920 × 1080'], ['1080x1080', '1080 × 1080']], s.render.preset, (v) => { const [w, hh] = v.split('x').map(Number); save({ render: { preset: v, width: w, height: hh } }); })),
          row('Frame rate', select([[24, '24 fps'], [30, '30 fps'], [60, '60 fps']], s.render.fps, (v) => save({ render: { fps: +v } }))),
          row('Quality', select([['final', 'Final'], ['draft', 'Draft']], s.render.quality, (v) => save({ render: { quality: v } }))),
          row('Subtitles', toggle(s.render.subtitles, (v) => save({ render: { subtitles: v } }))),
          row('End card', toggle(s.render.endCard, (v) => save({ render: { endCard: v } })))),
        h('div.card.pad', h('h3', { style: { marginBottom: '8px' } }, 'Brand rules'),
          [['subtitlesBottom', 'Narration subtitles at the bottom'], ['overlaysTop', 'Counters & captions small at the top'], ['noTopDown', 'No top-down camera shots'], ['closeUpOnMention', 'Close-up on objects and money when they are said'], ['rainForSad', 'Rain (quiet) + thunder for sad outdoor scenes'], ['endCardLogo', 'Zungga logo end card']].map(([k, l]) => row(l, toggle(s.brand[k], (v) => save({ brand: { [k]: v } })))),
          h('p.small.muted', 'Also always: no school uniforms; girls use the Mira, Tara, Mom or older-sister looks; the box kid is the main character in the cartoon world.')),
        h('div.card.pad', h('div.isec-h', h('h3', 'Storage'), btn('Refresh', check, 'small ghost', 'refresh')),
          storage ? [row('Projects', h('span', fmtBytes(storage.projects))), row('AI models', h('span', fmtBytes(storage.models))), row('Python env', h('span', fmtBytes(storage.venv))), row('Old exports', h('span', fmtBytes(storage.exports))), h('p.small.muted', `Projects: ${storage.paths.projects}`), h('p.small.muted', `Models: ${storage.paths.models}`)] : h('div.spinner'))),
      h('div.card.pad', { style: { marginTop: '16px' } }, h('div.isec-h', h('h3', 'Health check'), btn('Run again', check, 'small', 'health')),
        health ? health.checks.map((c) => h('div.check-row', h('span.dot.' + (c.ok ? 'ok' : c.id === 'm-story' ? 'warn' : 'bad')), h('div', h('b', c.label), h('div.small.muted', c.detail), !c.ok ? h('div.small', { style: { color: 'var(--bad)' } }, 'Fix: ', h('code', c.fix)) : null), c.ok ? h('span.badge.ok', icon('check', 12), 'OK') : h('span.badge.bad', 'Needs fixing'))) : h('div.loading', h('div.spinner'), 'Checking…'),
        h('p.small.muted', 'The same check runs in the terminal with ./doctor.sh.'))));
  }
  render(); check();
  return {};
}
