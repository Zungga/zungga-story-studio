#!/usr/bin/env node
/*
 * Zungga Story Studio — the local app server (no dependencies beyond Node itself).
 *   ./start.sh            (or: node tools/server.mjs)  → http://localhost:8790/studio/app.html
 * Serves the studio pages and runs everything heavy on this Mac, one job at a time:
 * story AI (mlx-lm), voice clips (Qwen3-TTS), word timing (Whisper) and video renders (headless Chrome + ffmpeg).
 * Projects live in projects/<id>/ (story.json, draft.json, voice/, exports/, history/) and stay local (gitignored).
 */
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn, execFile } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = +(process.env.PORT || 8790), HOST = process.env.HOST || '127.0.0.1';
const P = (...a) => path.join(root, ...a);
const PROJECTS = P('projects'), SETTINGS = P('settings.local.json');
fs.mkdirSync(PROJECTS, { recursive: true });
const { stage, check } = await import(pathToFileURL(P('studio/js/stage.js')).href);

// ---------- settings (local, never committed) ----------
const DEFAULTS = {
  storyModel: 'mlx-community/Qwen2.5-7B-Instruct-4bit',
  whisperModel: 'mlx-community/whisper-base.en-mlx',
  python: '.venv/bin/python',
  world: 'toon', voice: 'boy-calm', pauseAfter: 0.7,
  render: { preset: '1080x1920', width: 1080, height: 1920, fps: 30, quality: 'final', subtitles: true, endCard: true },
  brand: { subtitlesBottom: true, overlaysTop: true, noTopDown: true, endCardLogo: true, rainForSad: true, closeUpOnMention: true },
  historyLimit: 60,
};
function settings() { try { return deepMerge(structuredClone(DEFAULTS), JSON.parse(fs.readFileSync(SETTINGS, 'utf8'))); } catch { return structuredClone(DEFAULTS); } }
function deepMerge(a, b) { for (const [k, v] of Object.entries(b || {})) a[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' ? deepMerge(a[k], v) : v; return a; }
const python = () => { const p = settings().python; return path.isAbsolute(p) ? p : P(p); };

// ---------- helpers ----------
const readJSON = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJSON = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive: true }); const tmp = f + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(v, null, 2)); fs.renameSync(tmp, f); };
const slug = (s) => String(s || 'story').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'story';
const pdir = (id) => { if (!/^[a-z0-9-]+$/.test(id)) throw httpError(400, 'Bad project id'); const d = path.join(PROJECTS, id); if (!fs.existsSync(path.join(d, 'project.json'))) throw httpError(404, 'No such project'); return d; };
function httpError(code, msg) { const e = new Error(msg); e.code = code; return e; }
function body(req, limit = 200 * 1024 * 1024) {
  return new Promise((resolve, reject) => { const ch = []; let n = 0; req.on('data', (c) => { n += c.length; if (n > limit) { reject(httpError(413, 'Too big')); req.destroy(); } else ch.push(c); }); req.on('end', () => resolve(Buffer.concat(ch))); req.on('error', reject); });
}
const jsonBody = async (req) => { const b = await body(req, 20 * 1024 * 1024); return b.length ? JSON.parse(b.toString('utf8')) : {}; };
function send(res, code, data) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
const run = (cmd, args, opts = {}) => new Promise((resolve) => execFile(cmd, args, { timeout: 20000, ...opts }, (err, stdout, stderr) => resolve({ ok: !err, out: String(stdout || '').trim(), err: String(stderr || err?.message || '').trim() })));

// ---------- library (catalog, characters, voices, sounds) ----------
function presetsFrom(file, re) { const src = fs.readFileSync(P(file), 'utf8'), out = []; let m; while ((m = re.exec(src))) out.push({ id: m[1], label: m[2], role: m[3] || '', kind: m[4] || '' }); return out; }
function library() {
  const toon = presetsFrom('studio/characters/toons.js', /^ {4}(\w+):\s*\{ label: '([^']+)'(?:, role: '([^']+)')?(?:, kind: '(\w+)')?/gm);
  const people = presetsFrom('studio/characters/person.js', /^ {4}(\w+):\s*\{ label: '([^']+)'()()/gm);
  const voices = fs.readdirSync(P('selected-voices'), { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(P('selected-voices', d.name, 'voice.json'))).map((d) => {
    const v = readJSON(P('selected-voices', d.name, 'voice.json'), {});
    return { id: d.name, label: v.label || d.name, note: v.permission || v.note || '', refText: v.reproduce?.ref_text || '', hasReference: fs.existsSync(P('selected-voices', d.name, 'reference.wav')), pitch: v.reference?.median_pitch_hz || null, test: fs.existsSync(P('selected-voices', d.name, 'out', 'test.wav')) };
  });
  const files = (dir, re) => (fs.existsSync(P(dir)) ? fs.readdirSync(P(dir)).filter((f) => re.test(f)) : []);
  return {
    props: readJSON(P('studio/assets/catalog.json'), { props: [] }).props,
    uploads: files('studio/assets/uploads', /\.(png|jpe?g|webp)$/i).map((f) => ({ id: 'img:' + f, label: f.replace(/\.[^.]+$/, ''), category: 'uploads' })),
    toonPresets: toon, peoplePresets: people,
    characters: readJSON(path.join(PROJECTS, '_characters.json'), []),
    voices, sfx: files('studio/assets/sfx', /\.(mp3|wav|ogg)$/i), music: files('studio/assets/music', /\.(mp3|wav|ogg)$/i).map((f) => '../music/' + f),
    musicInfo: Object.fromEntries(files('studio/assets/music', /\.(mp3|wav|ogg)$/i).map((f) => ['../music/' + f, readJSON(P('studio/assets/music', f.replace(/\.[^.]+$/, '.json')), null)])),
    dialogues: (readJSON(P('studio/assets/dialogues/dialogues.json'), { lines: [] }).lines || []).map((l) => ({ ...l, file: '../dialogues/' + l.file })),
    places: ['home', 'shop', 'ground', 'classroom', 'bank', 'kitchen', 'bedroom', 'park', 'supermarket', 'street', 'party', 'festival', 'library', 'night_ground', 'beach', 'market', 'village', 'camp', 'sports', 'cave'],
    requests: readJSON(path.join(PROJECTS, '_library-requests.json'), []),
  };
}

// ---------- projects ----------
function listProjects() {
  return fs.readdirSync(PROJECTS, { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(PROJECTS, d.name, 'project.json'))).map((d) => {
    const pj = readJSON(path.join(PROJECTS, d.name, 'project.json'), {}), st = readJSON(path.join(PROJECTS, d.name, 'story.json'), null);
    const ex = fs.existsSync(path.join(PROJECTS, d.name, 'exports')) ? fs.readdirSync(path.join(PROJECTS, d.name, 'exports')).filter((f) => f.endsWith('.mp4')).length : 0;
    return { ...pj, scenes: st?.scenes?.length || pj.draft?.scenes?.length || 0, exports: ex, thumb: fs.existsSync(path.join(PROJECTS, d.name, 'thumb.jpg')) ? `/projects/${d.name}/thumb.jpg` : null };
  }).sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
}
function newProject({ name, prompt, world, from }) {
  let id = slug(name || prompt), k = 1; while (fs.existsSync(path.join(PROJECTS, id))) id = `${slug(name || prompt)}-${++k}`;
  const d = path.join(PROJECTS, id), now = new Date().toISOString(), s = settings();
  fs.mkdirSync(d, { recursive: true });
  const pj = { id, name: name || 'Untitled story', prompt: prompt || '', world: world || s.world, created: now, updated: now, step: 'idea' };
  if (from) {   // start from an existing story (stories/<name>) — handy for trying the editor on a finished film
    const src = P('stories', path.basename(from), 'story.json'); if (!fs.existsSync(src)) throw httpError(404, 'No such story');
    const st = readJSON(src); st.voice = st.voice || {};
    if (st.voice.defaultDir) st.voice.defaultDir = path.relative(d, path.resolve(P('stories', path.basename(from)), st.voice.defaultDir));
    else if (fs.existsSync(P('stories', path.basename(from), 'voice'))) st.voice.defaultDir = path.relative(d, P('stories', path.basename(from), 'voice'));
    if (st.voices) st.voices = st.voices.map((v) => ({ ...v, dir: path.relative(d, path.resolve(P('stories', path.basename(from)), v.dir)) }));
    writeJSON(path.join(d, 'story.json'), st); pj.name = name || st.title; pj.step = 'studio'; pj.world = Object.values(st.cast || {}).some((c) => c.cast) ? 'toon' : 'people';
  }
  writeJSON(path.join(d, 'project.json'), pj); return pj;
}
function getProject(id) {
  const d = pdir(id);
  return { project: readJSON(path.join(d, 'project.json')), story: readJSON(path.join(d, 'story.json')), draft: readJSON(path.join(d, 'draft.json')), voice: voiceState(id) };
}
function touch(id, patch = {}) { const f = path.join(pdir(id), 'project.json'), pj = { ...readJSON(f), ...patch, updated: new Date().toISOString() }; writeJSON(f, pj); return pj; }
function saveStory(id, story, label = 'Autosave') {
  const d = pdir(id), f = path.join(d, 'story.json'), prev = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null, next = JSON.stringify(story, null, 2);
  if (prev === next) return { saved: false };
  if (prev) {   // version history: keep the version being replaced
    const hd = path.join(d, 'history'); fs.mkdirSync(hd, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(path.join(hd, `${stamp}.json`), JSON.stringify({ label, saved: new Date().toISOString(), story: JSON.parse(prev) }));
    const all = fs.readdirSync(hd).sort(); for (const old of all.slice(0, Math.max(0, all.length - settings().historyLimit))) fs.rmSync(path.join(hd, old));
  }
  const tmp = f + '.tmp'; fs.writeFileSync(tmp, next); fs.renameSync(tmp, f); touch(id); broadcast({ type: 'saved', project: id });
  return { saved: true };
}
// which scenes need a (new) voice clip: missing, or the line / voice changed since it was made
function voiceState(id) {
  const d = path.join(PROJECTS, id), st = readJSON(path.join(d, 'story.json')); if (!st) return null;
  const vdir = st.voice?.defaultDir || 'voice', lines = readJSON(path.join(d, 'voice', 'lines.json'), {}), words = readJSON(path.resolve(d, vdir, 'words.json'), {});
  const scenes = st.scenes.map((sc) => {
    const name = `scene-${String(sc.id).padStart(2, '0')}.wav`, has = fs.existsSync(path.resolve(d, vdir, name));
    const stale = vdir === 'voice' && has && lines[sc.id] && (lines[sc.id].text !== sc.narration || lines[sc.id].voice !== (st.voice?.voice || 'boy-calm'));
    return { id: sc.id, has, stale: !!stale, timed: !!words[name] };
  });
  return { dir: vdir, borrowed: vdir !== 'voice', scenes, ready: scenes.every((s) => s.has && !s.stale) };
}

// ---------- jobs: one queue (the GPU does one big thing at a time), live progress over SSE ----------
const jobs = new Map(), queue = []; let running = null, jobSeq = 0;
const clients = new Set();
function broadcast(ev) { const s = `data: ${JSON.stringify(ev)}\n\n`; for (const c of clients) c.write(s); }
const pub = (j) => ({ id: j.id, type: j.type, project: j.project, title: j.title, status: j.status, progress: j.progress, message: j.message, result: j.result, error: j.error, created: j.created, started: j.started, ended: j.ended, log: j.log.slice(-40) });
function addJob(type, project, title, runFn) {
  const j = { id: `j${++jobSeq}`, type, project, title, status: 'queued', progress: 0, message: 'Waiting…', log: [], created: Date.now(), run: runFn, proc: null };
  jobs.set(j.id, j); queue.push(j); broadcast({ type: 'job', job: pub(j) }); pump(); return pub(j);
}
function update(j, patch) { Object.assign(j, patch); broadcast({ type: 'job', job: pub(j) }); }
async function pump() {
  if (running || !queue.length) return;
  const j = queue.shift(); if (j.status === 'cancelled') return pump();
  running = j; update(j, { status: 'running', started: Date.now(), message: 'Starting…' });
  try { const result = await j.run(j); if (j.status !== 'cancelled') update(j, { status: 'done', progress: 1, result, message: 'Done', ended: Date.now() }); }
  catch (e) { if (j.status !== 'cancelled') update(j, { status: 'failed', error: e.message, message: e.message.split('\n')[0].slice(0, 200), ended: Date.now() }); }
  running = null; for (const [id, x] of jobs) if (x.ended && Date.now() - x.ended > 6 * 3600e3) jobs.delete(id);
  pump();
}
// run a process for a job; onLine gets each output line (for progress)
function proc(j, cmd, args, { onLine, input, env } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: root, env: { ...process.env, PYTHONUNBUFFERED: '1', ...env } }); j.proc = p;
    let out = '', buf = '';
    const line = (l) => { if (!l.trim()) return; j.log.push(l.slice(0, 400)); if (j.log.length > 400) j.log.splice(0, 100); onLine && onLine(l); broadcast({ type: 'job', job: pub(j) }); };
    const feed = (d) => { const s = d.toString(); out += s; buf += s; const parts = buf.split(/\r|\n/); buf = parts.pop(); parts.forEach(line); };
    p.stdout.on('data', feed); p.stderr.on('data', feed);
    if (input != null) { p.stdin.write(input); p.stdin.end(); }
    p.on('error', (e) => reject(new Error(`${cmd}: ${e.message}`)));
    p.on('close', (code) => { if (buf) line(buf); j.proc = null; if (j.status === 'cancelled') return reject(new Error('Cancelled')); code === 0 ? resolve(out) : reject(new Error(lastLines(out) || `${path.basename(cmd)} exited with ${code}`)); });
  });
}
const lastLines = (s) => s.trim().split('\n').filter((l) => !/^\s*(frame|PROGRESS)/.test(l)).slice(-6).join('\n');

// voice: make every missing / changed line, then time the words (make_voice.py runs align_words.py at the end)
function voiceJob(id, { scenes, voice, takes } = {}) {
  const d = pdir(id), st = readJSON(path.join(d, 'story.json'));
  if (!st) throw httpError(400, 'This project has no story yet');
  const v = voice || st.voice?.voice || settings().voice;
  if (!fs.existsSync(P('selected-voices', v, 'reference.wav'))) throw httpError(400, `The voice "${v}" has no reference.wav on this Mac (see README → Voices)`);
  return addJob('voice', id, `Voice · ${st.title}`, async (j) => {
    if (st.voice?.defaultDir && st.voice.defaultDir !== 'voice') { delete st.voice.defaultDir; delete st.voices; }   // the project gets its own clips from now on
    st.voice = { ...(st.voice || {}), voice: v }; writeJSON(path.join(d, 'story.json'), st);
    const vd = path.join(d, 'voice'); fs.mkdirSync(vd, { recursive: true });
    const lines = readJSON(path.join(vd, 'lines.json'), {}), want = scenes ? new Set(scenes.map(Number)) : null;
    const todo = st.scenes.filter((sc) => { const f = path.join(vd, `scene-${String(sc.id).padStart(2, '0')}.wav`); return (want ? want.has(sc.id) : true) && (want || !fs.existsSync(f) || lines[sc.id]?.text !== sc.narration || lines[sc.id]?.voice !== v); });
    for (const sc of todo) fs.rmSync(path.join(vd, `scene-${String(sc.id).padStart(2, '0')}.wav`), { force: true });
    let done = 0; const n = Math.max(1, todo.length);
    update(j, { message: todo.length ? `Making ${todo.length} voice line${todo.length > 1 ? 's' : ''}…` : 'All lines are up to date — timing words…' });
    await proc(j, python(), [P('tools/make_voice.py'), d, '--voice', v, '--takes', String(takes || 3)], {
      env: { PYTHON: python() },
      onLine: (l) => {
        if (/^(made|reference) scene/.test(l)) { done++; update(j, { progress: 0.9 * done / n, message: `Voice line ${done} of ${n} done` }); }
        else if (/take \d/.test(l)) update(j, { message: `Line ${done + 1} of ${n}: ${l.trim()}` });
        else if (/^total/.test(l)) update(j, { progress: 0.9, message: 'Timing every word…' });
      },
    });
    for (const sc of st.scenes) lines[sc.id] = { text: sc.narration, voice: v };
    writeJSON(path.join(vd, 'lines.json'), lines); touch(id); broadcast({ type: 'voice', project: id });
    return { voice: voiceState(id) };
  });
}

// render: the Generate panel's options → tools/render_video.mjs
function renderJob(id, o = {}) {
  const d = pdir(id), st = readJSON(path.join(d, 'story.json')); if (!st) throw httpError(400, 'No story to render');
  const w = Math.round(+o.width || 1080), h = Math.round(+o.height || 1920);
  if (w < 240 || h < 240 || w > 3840 || h > 3840) throw httpError(400, 'Size must be between 240 and 3840 pixels');
  const out = (o.fileName ? slug(o.fileName) : `${slug(st.title)}-${w}x${h}${o.quality === 'draft' ? '-draft' : ''}`) + '.mp4';
  const args = [P('tools/render_video.mjs'), id, '--dir', path.relative(root, d), '--outdir', path.relative(root, path.join(d, 'exports')), '--out', out, '--progress', '1',
    '--w', String(w - (w % 2)), '--h', String(h - (h % 2)), '--fps', String([24, 30, 60].includes(+o.fps) ? +o.fps : 30), '--quality', o.quality === 'draft' ? 'draft' : 'final',
    '--subs', o.subtitles === false ? '0' : '1', '--endcard', o.endCard === false ? '0' : '1'];
  if (o.from) args.push('--from', String(o.from)); if (o.to) args.push('--to', String(o.to));
  if (o.voiceDir) args.push('--voice', String(o.voiceDir));
  return addJob('render', id, `Video · ${st.title} · ${w}×${h}`, async (j) => {
    let file = null;
    await proc(j, process.execPath, args, { onLine: (l) => { const m = l.match(/^PROGRESS (\d+) (\d+)/); if (m) update(j, { progress: +m[1] / +m[2], message: `Frame ${m[1]} of ${m[2]}` }); const o2 = l.match(/^OUTPUT (.+)/); if (o2) file = o2[1].trim(); } });
    if (!file) throw new Error('The renderer did not report a file');
    const meta = { file: '/' + file, name: path.basename(file), width: w, height: h, fps: +o.fps || 30, quality: o.quality || 'final', made: new Date().toISOString(), from: o.from || null, to: o.to || null };
    const mc = st.music?.file ? (readJSON(P('studio/assets/music', path.basename(st.music.file).replace(/\.[^.]+$/, '.json'))) || st.music.credit) : null;
    if (mc) { meta.music = { title: mc.title, creator: mc.creator, license: mc.license, credit: mc.text, start: st.music.start || 0 }; if (mc.text) fs.writeFileSync(P(file).replace(/\.mp4$/, '.credits.txt'), mc.text + '\n'); }
    writeJSON(P(file).replace(/\.mp4$/, '.json'), meta);
    // a thumbnail for the project card
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '1.5', '-i', P(file), '-frames:v', '1', '-vf', 'scale=360:-2', path.join(d, 'thumb.jpg')]);
    touch(id); return meta;
  });
}

// story AI: prompt → a draft (title, cast, scenes with narration). Local model via mlx-lm (tools/story_ai.py).
function storyJob(id, input) {
  const d = pdir(id), s = settings(), lib = library();
  const req = { ...input, model: input.model || s.storyModel, world: input.world || readJSON(path.join(d, 'project.json')).world || s.world,
    presets: (input.world || s.world) === 'people' ? lib.peoplePresets : lib.toonPresets, places: lib.places, props: lib.props.map((p) => p.label) };
  return addJob('story', id, input.redoScene ? `Story AI · redo scene ${input.redoScene}` : 'Story AI · writing', async (j) => {
    update(j, { message: 'Loading the story model (the first time downloads it, ~4 GB)…' });
    const out = await proc(j, python(), [P('tools/story_ai.py')], { input: JSON.stringify(req), onLine: (l) => { if (/^STATUS /.test(l)) update(j, { message: l.slice(7) }); const m = l.match(/^PROGRESS ([\d.]+)/); if (m) update(j, { progress: +m[1] }); } });
    const m = out.match(/^RESULT (.+)$/m); if (!m) throw new Error('The story model gave no result');
    const res = JSON.parse(m[1]);
    if (input.redoScene && input.draft) { const dr = structuredClone(input.draft); dr.scenes[input.redoScene - 1] = { ...dr.scenes[input.redoScene - 1], ...res.scene, locked: false }; return { draft: dr }; }
    return { draft: res.draft };
  });
}

function voiceToolJob(title, args, after) {
  return addJob('voice-tool', null, title, async (j) => { const out = await proc(j, python(), [P('tools/voice_tools.py'), ...args]); const m = out.match(/^RESULT (.+)$/m); const r = m ? JSON.parse(m[1]) : {}; return after ? after(r) : r; });
}

// ---------- health check (also used by doctor.sh) ----------
async function health() {
  const checks = [], add = (id, label, ok, detail, fix) => checks.push({ id, label, ok, detail, fix });
  add('mac', 'Apple Silicon Mac', process.platform === 'darwin' && process.arch === 'arm64', `${process.platform} ${process.arch} · ${Math.round(os.totalmem() / 2 ** 30)} GB memory`, 'Voice and story AI use MLX, which needs an M-series Mac. Rendering still works elsewhere.');
  add('node', 'Node.js 20+', +process.versions.node.split('.')[0] >= 20, process.versions.node, 'brew install node');
  const ff = await run('ffmpeg', ['-version']); add('ffmpeg', 'ffmpeg', ff.ok, ff.ok ? ff.out.split('\n')[0].slice(0, 60) : 'not found', 'brew install ffmpeg');
  const py = fs.existsSync(python()); add('venv', 'Python environment (.venv)', py, py ? python() : 'missing', './setup.sh');
  if (py) {
    const mods = await run(python(), ['-c', 'import mlx, mlx_audio, mlx_lm, transformers, numpy; print(mlx.__version__ if hasattr(mlx,"__version__") else "ok")'], { timeout: 60000 });
    add('pylibs', 'Python libraries (mlx-audio, mlx-lm, transformers)', mods.ok, mods.ok ? 'installed' : mods.err.split('\n').pop(), './setup.sh');
  }
  const pw = fs.existsSync(P('node_modules', 'playwright')); add('playwright', 'Playwright (headless Chrome for renders)', pw, pw ? 'installed' : 'missing', 'npm install && npx playwright install chromium');
  const hub = process.env.HF_HOME ? path.join(process.env.HF_HOME, 'hub') : path.join(os.homedir(), '.cache', 'huggingface', 'hub');
  const has = (m) => {   // fully downloaded: a snapshot with its config, and no half-finished files
    const d = path.join(hub, 'models--' + m.replace('/', '--')); if (!fs.existsSync(path.join(d, 'snapshots'))) return false;
    const snaps = fs.readdirSync(path.join(d, 'snapshots')); const blobs = fs.existsSync(path.join(d, 'blobs')) ? fs.readdirSync(path.join(d, 'blobs')) : [];
    return snaps.some((s) => fs.readdirSync(path.join(d, 'snapshots', s)).length > 1) && !blobs.some((b) => b.endsWith('.incomplete'));
  };
  const s = settings();
  add('m-story', `Story AI model`, has(s.storyModel), s.storyModel, './setup.sh  (or it downloads on first use)');
  add('m-tts', 'Voice model (Qwen3-TTS)', has('mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit'), 'mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit', './setup.sh');
  add('m-whisper', 'Word timing model (Whisper)', has(s.whisperModel) && has('openai/whisper-base.en'), s.whisperModel, './setup.sh');
  const lib = library(), noRef = lib.voices.filter((v) => !v.hasReference).map((v) => v.id);
  add('voices', 'Voice reference recordings', !noRef.length, noRef.length ? `missing: ${noRef.join(', ')}` : `${lib.voices.length} voices ready`, 'Copy selected-voices/<name>/reference.wav from your private backup (README → Voices)');
  const df = await run('df', ['-k', root]); const free = df.ok ? +df.out.split('\n')[1].split(/\s+/)[3] * 1024 : 0;
  add('disk', 'Free disk space (10 GB+)', free > 10 * 2 ** 30, `${(free / 2 ** 30).toFixed(1)} GB free`, 'Free up space — models need ~8 GB, renders ~50 MB a minute');
  return { ok: checks.every((c) => c.ok || ['m-story'].includes(c.id)), checks };
}
async function storage() {
  const size = async (p) => { const r = await run('du', ['-sk', p]); return r.ok ? +r.out.split(/\s/)[0] * 1024 : 0; };
  const hub = path.join(os.homedir(), '.cache', 'huggingface', 'hub');
  return { projects: await size(PROJECTS), exports: await size(P('exports')), models: fs.existsSync(hub) ? await size(hub) : 0, venv: fs.existsSync(P('.venv')) ? await size(P('.venv')) : 0, paths: { projects: PROJECTS, models: hub, root } };
}

// ---------- static files ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const PUBLIC = ['studio', 'vendor', 'stories', 'projects', 'exports', 'selected-voices', 'docs'];
function serveStatic(req, res, pathname) {
  if (pathname === '/' || pathname === '/studio' || pathname === '/studio/') { res.writeHead(302, { Location: '/studio/app.html' }); return res.end(); }
  const p = path.normalize(path.join(root, decodeURIComponent(pathname)));
  const top = path.relative(root, p).split(path.sep)[0];
  if (!p.startsWith(root + path.sep) || !PUBLIC.includes(top) || /(^|\/)\.|\.local\.json$|\.env/.test(path.relative(root, p))) { res.writeHead(404); return res.end('Not found'); }
  fs.stat(p, (err, st) => {
    if (err || st.isDirectory()) { res.writeHead(404); return res.end('Not found'); }
    const type = TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream', range = req.headers.range;
    if (range && /^bytes=/.test(range)) {   // video seeking in the output gallery
      const [a, b] = range.slice(6).split('-'), start = +a || 0, end = b ? +b : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      return fs.createReadStream(p, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Cache-Control': /\/(projects|exports)\//.test(pathname) || pathname.endsWith('.json') ? 'no-store' : 'no-cache', 'Accept-Ranges': 'bytes' });
    fs.createReadStream(p).pipe(res);
  });
}

// ---------- API routes ----------
const routes = [];
const route = (method, pattern, fn) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn });

route('GET', '/api/health', async () => health());
route('GET', '/api/settings', async () => settings());
route('PUT', '/api/settings', async (req) => { const b = await jsonBody(req); const cur = readJSON(SETTINGS, {}); writeJSON(SETTINGS, deepMerge(cur, b)); return settings(); });
route('POST', '/api/settings/reset', async () => { fs.rmSync(SETTINGS, { force: true }); return settings(); });
route('GET', '/api/storage', async () => storage());
route('GET', '/api/library', async () => library());
route('POST', '/api/library/requests', async (req) => { const b = await jsonBody(req), f = path.join(PROJECTS, '_library-requests.json'), all = readJSON(f, []); const r = { id: Date.now().toString(36), name: String(b.name || '').slice(0, 80), kind: b.kind || 'prop', note: String(b.note || '').slice(0, 500), project: b.project || null, created: new Date().toISOString(), status: 'requested' }; all.push(r); writeJSON(f, all); return r; });
route('DELETE', '/api/library/requests/:rid', async (req, q, m) => { const f = path.join(PROJECTS, '_library-requests.json'); writeJSON(f, readJSON(f, []).filter((r) => r.id !== m.rid)); return { ok: true }; });
route('PUT', '/api/library/characters', async (req) => { const b = await jsonBody(req); if (!Array.isArray(b)) throw httpError(400, 'Expected a list'); writeJSON(path.join(PROJECTS, '_characters.json'), b); return b; });
route('POST', '/api/library/upload', async (req, q) => {   // a picture to use as a flat prop (standee) in scenes
  const name = slug(path.basename(q.get('name') || 'image', path.extname(q.get('name') || ''))) + (path.extname(q.get('name') || '.png').toLowerCase().match(/^\.(png|jpe?g|webp)$/) ? path.extname(q.get('name')).toLowerCase() : '.png');
  const buf = await body(req, 15 * 1024 * 1024); fs.mkdirSync(P('studio/assets/uploads'), { recursive: true }); fs.writeFileSync(P('studio/assets/uploads', name), buf);
  return { id: 'img:' + name, label: name };
});
route('POST', '/api/voices', async (req, q) => {   // add a voice from a recording (10–20 s of clear speech); the words are found automatically
  const name = slug(q.get('name') || 'voice'); if (fs.existsSync(P('selected-voices', name))) throw httpError(409, 'A voice with that name exists');
  const buf = await body(req, 50 * 1024 * 1024), dir = P('selected-voices', name); fs.mkdirSync(dir, { recursive: true });
  const raw = path.join(dir, 'upload' + (path.extname(q.get('file') || '.wav') || '.wav')); fs.writeFileSync(raw, buf);
  const conv = await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-t', '20', '-ac', '1', '-ar', '24000', path.join(dir, 'reference.wav')], { timeout: 60000 }); fs.rmSync(raw, { force: true });
  if (!conv.ok) { fs.rmSync(dir, { recursive: true, force: true }); throw httpError(400, 'Could not read that audio file'); }
  writeJSON(path.join(dir, 'voice.json'), { name, label: q.get('label') || name, selected: new Date().toISOString().slice(0, 10), engine: 'Qwen3-TTS via mlx-audio 0.5.8 (local, Apple Silicon)', language: 'english', permission: q.get('permission') || 'Make sure the speaker agreed to this use before publishing.', reproduce: { model: 'mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit', ref_audio: 'reference.wav', ref_text: q.get('text') || '', speed: 1.0 }, reference: { file: 'reference.wav', sample_rate: 24000 } });
  if (q.get('text')) return { id: name };
  return voiceToolJob(`Voice · hearing "${name}"`, ['transcribe', name]);
});
route('POST', '/api/voices/:vid/test', async (req, q, m) => { const b = await jsonBody(req); if (!fs.existsSync(P('selected-voices', path.basename(m.vid), 'voice.json'))) throw httpError(404, 'No such voice'); return voiceToolJob(`Voice · test ${m.vid}`, ['test', path.basename(m.vid), String(b.text || 'Hello! This is how I sound in a Zungga story.').slice(0, 400)]); });

route('GET', '/api/projects', async () => listProjects());
route('POST', '/api/projects', async (req) => newProject(await jsonBody(req)));
route('GET', '/api/projects/:id', async (req, q, m) => getProject(m.id));
route('PATCH', '/api/projects/:id', async (req, q, m) => { const b = await jsonBody(req); delete b.id; return touch(m.id, b); });
route('POST', '/api/projects/:id/duplicate', async (req, q, m) => { const d = pdir(m.id), pj = readJSON(path.join(d, 'project.json')); const np = newProject({ name: pj.name + ' (copy)', prompt: pj.prompt, world: pj.world }); for (const f of ['story.json', 'draft.json']) if (fs.existsSync(path.join(d, f))) fs.copyFileSync(path.join(d, f), path.join(PROJECTS, np.id, f)); if (fs.existsSync(path.join(d, 'voice'))) fs.cpSync(path.join(d, 'voice'), path.join(PROJECTS, np.id, 'voice'), { recursive: true }); return touch(np.id, { step: pj.step }); });
route('DELETE', '/api/projects/:id', async (req, q, m) => {   // moved to projects/_trash, not erased
  const d = pdir(m.id), t = path.join(PROJECTS, '_trash'); fs.mkdirSync(t, { recursive: true }); fs.renameSync(d, path.join(t, `${m.id}-${Date.now()}`)); return { ok: true };
});
route('PUT', '/api/projects/:id/draft', async (req, q, m) => { const d = pdir(m.id); writeJSON(path.join(d, 'draft.json'), await jsonBody(req)); touch(m.id); return { ok: true }; });
route('PUT', '/api/projects/:id/story', async (req, q, m) => saveStory(m.id, await jsonBody(req), q.get('label') || 'Autosave'));
route('GET', '/api/projects/:id/history', async (req, q, m) => { const hd = path.join(pdir(m.id), 'history'); if (!fs.existsSync(hd)) return []; return fs.readdirSync(hd).sort().reverse().map((f) => { const h = readJSON(path.join(hd, f), {}); return { file: f, label: h.label, saved: h.saved, scenes: h.story?.scenes?.length || 0 }; }); });
route('GET', '/api/projects/:id/history/:file', async (req, q, m) => { const f = path.join(pdir(m.id), 'history', path.basename(m.file)); const h = readJSON(f); if (!h) throw httpError(404, 'No such version'); return h; });
route('POST', '/api/projects/:id/history/:file/restore', async (req, q, m) => { const h = readJSON(path.join(pdir(m.id), 'history', path.basename(m.file))); if (!h) throw httpError(404, 'No such version'); saveStory(m.id, h.story, 'Before restoring ' + (h.saved || '').slice(0, 16)); return { story: h.story }; });
route('POST', '/api/projects/:id/stage', async (req, q, m) => {   // draft → story.json (keeps locked scenes as they are)
  const b = await jsonBody(req), d = pdir(m.id), lib = library(), draft = b.draft || readJSON(path.join(d, 'draft.json'));
  if (!draft) throw httpError(400, 'No draft to build from');
  const props = lib.props.concat(lib.uploads);
  const { story, report } = stage(draft, props, { toonPresets: lib.toonPresets.map((p) => p.id), peoplePresets: lib.peoplePresets.map((p) => p.id) });
  const prev = readJSON(path.join(d, 'story.json'));
  if (prev && b.keepEdits !== false) {   // re-building keeps scenes the user already changed by hand, when their line is the same
    story.scenes = story.scenes.map((sc) => { const old = prev.scenes.find((o) => o.id === sc.id); return old && old.narration === sc.narration && old.edited ? old : sc; });
    if (prev.voice?.voice) story.voice.voice = prev.voice.voice;
  }
  writeJSON(path.join(d, 'draft.json'), draft);
  if (b.save !== false) { saveStory(m.id, story, 'Built from the story'); touch(m.id, { step: 'build', name: draft.title || readJSON(path.join(d, 'project.json')).name }); }
  return { story, report };
});
route('POST', '/api/projects/:id/check', async (req, q, m) => { const lib = library(), b = await jsonBody(req); return check(b.story || readJSON(path.join(pdir(m.id), 'story.json')), lib.props.concat(lib.uploads)); });
route('GET', '/api/projects/:id/voice', async (req, q, m) => { pdir(m.id); return voiceState(m.id); });
route('POST', '/api/projects/:id/voice', async (req, q, m) => voiceJob(m.id, await jsonBody(req)));
route('POST', '/api/projects/:id/render', async (req, q, m) => renderJob(m.id, await jsonBody(req)));
route('POST', '/api/projects/:id/story-ai', async (req, q, m) => storyJob(m.id, await jsonBody(req)));
route('GET', '/api/projects/:id/exports', async (req, q, m) => { const ed = path.join(pdir(m.id), 'exports'); if (!fs.existsSync(ed)) return []; return fs.readdirSync(ed).filter((f) => f.endsWith('.mp4')).map((f) => { const meta = readJSON(path.join(ed, f.replace(/\.mp4$/, '.json')), {}); const st = fs.statSync(path.join(ed, f)); return { name: f, file: `/projects/${m.id}/exports/${f}`, size: st.size, made: meta.made || st.mtime.toISOString(), ...meta }; }).sort((a, b) => b.made.localeCompare(a.made)); });
route('DELETE', '/api/projects/:id/exports/:file', async (req, q, m) => { const f = path.join(pdir(m.id), 'exports', path.basename(m.file)); fs.rmSync(f, { force: true }); fs.rmSync(f.replace(/\.mp4$/, '.json'), { force: true }); return { ok: true }; });
route('POST', '/api/projects/:id/reveal', async (req, q, m) => { const ed = path.join(pdir(m.id), 'exports'); fs.mkdirSync(ed, { recursive: true }); await run('open', [ed]); return { ok: true }; });
// ---------- free music (Openverse: Jamendo, Freesound, Wikimedia… — no key needed) ----------
// Only licences that allow commercial use AND editing (cutting a part to fit the video): CC0, public domain, CC BY (credit).
// No "ND" (no edits) or "NC" (non-commercial); "SA" is left out too, because it would put the whole video under the same licence.
const OV = 'https://api.openverse.org/v1/audio/', MUSIC_OK = new Set(['cc0', 'pdm', 'by']);
const LICENCE_URL = (l, v) => (l === 'cc0' ? 'https://creativecommons.org/publicdomain/zero/1.0/' : l === 'pdm' ? 'https://creativecommons.org/publicdomain/mark/1.0/' : `https://creativecommons.org/licenses/${l}/${v || '4.0'}/`);
const ovTrack = (r) => ({ id: r.id, title: r.title, creator: r.creator, duration: Math.round((r.duration || 0) / 1000), license: r.license, licenseVersion: r.license_version, licenseUrl: r.license_url || LICENCE_URL(r.license, r.license_version), source: r.source, url: r.url, landing: r.foreign_landing_url, attribution: r.attribution, genres: r.genres || [], needsCredit: r.license === 'by' });
async function ovFetch(url) { const r = await fetch(url, { headers: { 'User-Agent': 'ZunggaStoryStudio/1.0 (local)' }, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw httpError(502, `The music library answered ${r.status} — try again in a minute`); return r.json(); }
route('GET', '/api/music/search', async (req, q) => {
  const noCredit = q.get('credit') === 'none', params = new URLSearchParams({ q: q.get('q') || 'happy', page: String(Math.max(1, +q.get('page') || 1)), page_size: '20', license: noCredit ? 'cc0,pdm' : 'by,cc0,pdm' });
  if (!noCredit) params.set('category', 'music');   // public-domain music is rare, so "no credit" searches every kind of audio
  let d; try { d = await ovFetch(OV + '?' + params); } catch (e) { if (e.code) throw e; throw httpError(502, 'No internet connection, or the music library is down'); }
  return { count: d.result_count || 0, pages: d.page_count || 1, results: (d.results || []).map(ovTrack).filter((t) => MUSIC_OK.has(t.license) && t.duration >= 15) };
});
route('POST', '/api/music/download', async (req) => {
  const { id } = await jsonBody(req); if (!/^[0-9a-f-]{36}$/.test(id || '')) throw httpError(400, 'Bad track id');
  const t = ovTrack(await ovFetch(OV + id + '/')); if (!MUSIC_OK.has(t.license)) throw httpError(400, `That track's licence (${t.license}) doesn't allow use in videos`);
  const dir = P('studio/assets/music'); fs.mkdirSync(dir, { recursive: true });
  const name = `${slug(t.title)}-${slug(t.creator).slice(0, 20)}-${id.slice(0, 6)}`, out = path.join(dir, name + '.mp3');
  if (!fs.existsSync(out)) {
    const r = await fetch(t.url, { redirect: 'follow', signal: AbortSignal.timeout(120000) }); if (!r.ok) throw httpError(502, `Couldn't download the track (${r.status})`);
    const buf = Buffer.from(await r.arrayBuffer()); if (buf.length > 60 * 2 ** 20) throw httpError(413, 'That file is too big');
    const raw = path.join(dir, name + '.download'); fs.writeFileSync(raw, buf);
    const c = await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-vn', '-ac', '2', '-ar', '44100', '-b:a', '192k', out], { timeout: 120000 }); fs.rmSync(raw, { force: true });
    if (!c.ok) { fs.rmSync(out, { force: true }); throw httpError(400, 'That file is not playable audio'); }
  }
  const credit = { ...t, file: '../music/' + name + '.mp3', downloaded: new Date().toISOString(), text: t.needsCredit ? `Music: "${t.title}" by ${t.creator} (${t.source}), licensed under CC BY ${t.licenseVersion || ''} — ${t.landing || t.licenseUrl}`.replace(/\s+—/, ' —') : `Music: "${t.title}" by ${t.creator} (${t.source}) — ${t.license === 'cc0' ? 'CC0' : 'public domain'}` };
  writeJSON(path.join(dir, name + '.json'), credit);
  return credit;
});
route('DELETE', '/api/music/:file', async (req, q, m) => { const f = path.basename(m.file).replace(/\.[^.]+$/, ''); for (const ext of ['.mp3', '.json']) fs.rmSync(P('studio/assets/music', f + ext), { force: true }); return { ok: true }; });

route('GET', '/api/stories', async () => fs.readdirSync(P('stories')).filter((s) => fs.existsSync(P('stories', s, 'story.json'))).map((s) => ({ id: s, title: readJSON(P('stories', s, 'story.json'), {}).title, engine: readJSON(P('stories', s, 'story.json'), {}).engine || '3d' })));
route('GET', '/api/jobs', async () => [...jobs.values()].map(pub).sort((a, b) => b.created - a.created));
route('POST', '/api/jobs/:jid/cancel', async (req, q, m) => { const j = jobs.get(m.jid); if (!j) throw httpError(404, 'No such job'); if (['done', 'failed', 'cancelled'].includes(j.status)) return pub(j); update(j, { status: 'cancelled', message: 'Cancelled', ended: Date.now() }); if (j.proc) j.proc.kill('SIGTERM'); return pub(j); });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'), q = url.searchParams;
  if (url.pathname === '/api/events') {   // live updates: jobs, saves, voice
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    res.write(`data: ${JSON.stringify({ type: 'hello', jobs: [...jobs.values()].map(pub) })}\n\n`); clients.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 20000); req.on('close', () => { clearInterval(ping); clients.delete(res); }); return;
  }
  if (url.pathname.startsWith('/api/')) {
    for (const r of routes) {
      const m = r.method === req.method && url.pathname.match(r.re);
      if (m) { try { return send(res, 200, await r.fn(req, q, m.groups || {})); } catch (e) { return send(res, e.code >= 400 && e.code < 600 ? e.code : 500, { error: e.message }); } }
    }
    return send(res, 404, { error: 'No such API' });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  serveStatic(req, res, url.pathname);
});
server.listen(PORT, HOST, () => console.log(`Zungga Story Studio → http://localhost:${PORT}/studio/app.html`));
process.on('SIGINT', () => { for (const j of jobs.values()) if (j.proc) j.proc.kill('SIGTERM'); process.exit(0); });
