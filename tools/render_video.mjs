#!/usr/bin/env node
/*
 * Render a story to a frame-exact MP4 (1080×1920, 30 fps, H.264 + AAC) on this Mac.
 *   npm run render -- pocket-money            → exports/pocket-money.mp4
 *   npm run render -- pocket-money --from 5 --to 6   (only scenes 5–6, for quick checks)
 * Opens studio/player.html in headless Chrome on the GPU, steps the story one frame at a time,
 * pipes the frames into ffmpeg and lays each scene's voice clip at its exact start time.
 * Needs: ffmpeg (brew install ffmpeg) and `npm install` once (Playwright).
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), story = args.find((a) => !a.startsWith('--')) || 'pocket-money';
const opt = (k) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : null; };
// --dir projects/<id> renders a studio project; --w/--h/--fps/--quality draft|final/--subs 0/--endcard 0/--out name.mp4 come from the Generate panel
const storyDir = opt('dir') ? path.resolve(root, opt('dir')) : path.join(root, 'stories', story);
if (!storyDir.startsWith(root)) { console.error('Story folder must be inside the project'); process.exit(1); }
const outDir = opt('outdir') ? path.resolve(root, opt('outdir')) : path.join(root, 'exports');
if (!fs.existsSync(path.join(storyDir, 'story.json'))) { console.error('No story at', storyDir); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });

// tiny static server for the project folder (module scripts + fetch need http)
const types = { '.mp3': 'audio/mpeg', '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.wav': 'audio/wav', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
page.on('console', (m) => { if (m.type() === 'error') console.error('page:', m.text()); });
page.on('pageerror', (e) => console.error('page error:', e.message));
const storyJson = JSON.parse(fs.readFileSync(path.join(storyDir, 'story.json'), 'utf8'));
const voiceDir = opt('voice') || storyJson.voice?.defaultDir || 'voice';   // --voice voice-narrator renders the other voice's version
const q = new URLSearchParams({ story, render: '1', voice: voiceDir });
if (opt('dir')) q.set('dir', path.relative(root, storyDir));
for (const k of ['w', 'h', 'fps', 'subs', 'endcard']) if (opt(k) != null) q.set(k, opt(k));
await page.goto(`http://localhost:${port}/studio/player.html?${q}`);
await page.waitForFunction(() => window.__render, null, { timeout: 300000 });
const info = await page.evaluate(() => ({ fps: __render.fps, total: __render.total, timeline: __render.timeline, cues: __render.cues, sfxDir: __render.sfxDir }));
const from = opt('from') ? info.timeline.find((e) => e.id === +opt('from')) : info.timeline[0];
const to = opt('to') ? info.timeline.find((e) => e.id === +opt('to')) : info.timeline[info.timeline.length - 1];
const t0 = from.start, t1 = to.start + to.dur, first = Math.round(t0 * info.fps), last = Math.ceil(t1 * info.fps);
const partial = first > 0 || last < Math.ceil(info.total * info.fps);
const tag = !opt('voice') || voiceDir === 'voice' ? '' : '-' + path.basename(voiceDir).replace(/^voice-/, '');
const outFile = opt('out') ? path.join(outDir, path.basename(opt('out')).replace(/(\.mp4)?$/, '.mp4')) : path.join(outDir, partial ? `${story}${tag}-scenes-${from.id}-${to.id}.mp4` : `${story}${tag}.mp4`);

// audio: every scene's clip placed at its start (relative to t0)
const inputs = [], filters = [];
for (const e of info.timeline) {
  const wav = path.join(storyDir, voiceDir, `scene-${String(e.id).padStart(2, '0')}.wav`);
  if (!fs.existsSync(wav) || e.start + e.dur <= t0 || e.start >= t1) continue;
  const k = inputs.filter((x) => x === '-i').length + 1, delay = Math.max(0, Math.round((e.start - t0) * 1000)), trim = Math.max(0, t0 - e.start);
  inputs.push('-i', wav);
  filters.push(`[${k}:a]atrim=start=${trim.toFixed(3)},asetpts=PTS-STARTPTS,adelay=${delay}|${delay}[a${k}]`);
}
// sound effects / ambience at their cue times (loops are cut to length)
for (const c of info.cues || []) {
  const file = path.join(root, info.sfxDir, c.file); if (!fs.existsSync(file)) continue;
  const end = c.loop ? c.start + c.dur : c.start + 10; if (end <= t0 || c.start >= t1) continue;
  const k = inputs.filter((x) => x === '-i').length + 1, delay = Math.max(0, Math.round((c.start - t0) * 1000)), trim = Math.max(0, t0 - c.start);
  if (c.loop) inputs.push('-stream_loop', '-1'); inputs.push('-i', file);
  // music: start at its chosen point in the track (offset), fade in at the story's start and out at its end
  const len = c.loop ? Math.min(c.dur - trim, t1 - Math.max(t0, c.start)) : null, fades = [];
  if (c.fadeIn && trim < c.fadeIn) fades.push(`afade=t=in:st=0:d=${(c.fadeIn - trim).toFixed(3)}`);
  if (c.fadeOut && len != null && c.start + c.dur <= t1 + 0.01) fades.push(`afade=t=out:st=${Math.max(0, len - c.fadeOut).toFixed(3)}:d=${c.fadeOut}`);
  filters.push(`[${k}:a]aformat=channel_layouts=${c.music ? 'stereo' : 'mono'},atrim=start=${(trim + (c.offset || 0)).toFixed(3)}${c.loop ? `:duration=${len.toFixed(3)}` : ''},asetpts=PTS-STARTPTS${fades.length ? ',' + fades.join(',') : ''},volume=${c.vol},adelay=${delay}|${delay}[a${k}]`);
}
const nA = filters.length;
const filter = nA ? filters.join(';') + ';' + filters.map((f) => f.slice(f.lastIndexOf('['))).join('') + `amix=inputs=${nA}:normalize=0,alimiter=limit=0.95,apad[aout]` : null;

const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(info.fps), '-c:v', 'mjpeg', '-i', '-', ...inputs,
  ...(filter ? ['-filter_complex', filter, '-map', '0:v', '-map', '[aout]', '-c:a', 'aac', '-b:a', '192k', '-shortest'] : ['-map', '0:v']),
  '-c:v', 'libx264', ...(opt('quality') === 'draft' ? ['-preset', 'veryfast', '-crf', '28'] : ['-preset', 'medium', '-crf', '18']), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(info.fps), outFile], { stdio: ['pipe', 'inherit', 'inherit'] });

const started = Date.now();
await page.evaluate((t) => { __eng.seek(t); }, t0);
for (let f = first; f < last; f++) {
  const url = await page.evaluate((f) => { if (f > 0 && window.__lastF === f - 1) __eng.step(1 / __render.fps); else __eng.seek(f / __render.fps); window.__lastF = f; return __eng.canvas.toDataURL('image/jpeg', 0.93); }, f);
  if (!ff.stdin.write(Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
  if ((f - first) % 15 === 0) process.stdout.write(opt('progress') ? `PROGRESS ${f - first + 1} ${last - first}\n` : `\rframe ${f - first + 1}/${last - first}  `);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close(); server.close();
console.log(`\nSaved ${path.relative(root, outFile)}`); if (opt('progress')) console.log(`OUTPUT ${path.relative(root, outFile)}`); console.log(`  (${((t1 - t0)).toFixed(1)} s of video in ${((Date.now() - started) / 1000).toFixed(0)} s)`);
