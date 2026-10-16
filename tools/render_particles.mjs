#!/usr/bin/env node
/*
 * Record the particle-morph video (1080×1920, 30 fps) — bird → fish → butterfly → elephant → fox → person → tree → rocket → Zungga logo.
 *   node tools/render_particles.mjs green     → exports/particles-green.mp4  (path to the beach, beach-waves sound)
 *   node tools/render_particles.mjs plain     → exports/particles-plain.mp4  (brand-purple backdrop)
 *   node tools/render_particles.mjs dark      → exports/particles-dark.mp4   (black centre, purple edges)
 * A soft whoosh plays on every morph. Needs ffmpeg + `npm install` (Playwright).
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), bg = ['plain', 'dark'].includes(process.argv[2]) ? process.argv[2] : 'green';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => { const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(`http://localhost:${server.address().port}/studio/particles.html?bg=${bg}&render=1`);
await page.waitForFunction(() => window.__render, null, { timeout: 120000 });
const info = await page.evaluate(() => ({ fps: __render.fps, total: __render.total, frames: __render.frames, morphs: __render.morphTimes }));
fs.mkdirSync(path.join(root, 'exports'), { recursive: true });
const out = path.join(root, 'exports', `particles-${bg}.mp4`), sfx = (f) => path.join(root, 'studio/assets/sfx', f);
// audio: waves bed (green) + a soft whoosh at each morph
const inputs = [], filters = [];
if (bg === 'green') { inputs.push('-stream_loop', '-1', '-i', sfx('beach-waves.mp3')); filters.push(`[1:a]atrim=duration=${info.total.toFixed(2)},volume=0.35,afade=t=in:d=1,afade=t=out:st=${(info.total - 1.2).toFixed(2)}:d=1.2[a1]`); }
for (const t of info.morphs) { const k = inputs.filter((x) => x === '-i').length + 1; inputs.push('-i', sfx('kite-wind.mp3')); const d = Math.round(Math.max(0, t - 0.15) * 1000); filters.push(`[${k}:a]atrim=duration=1.4,afade=t=out:st=0.9:d=0.5,volume=0.22,adelay=${d}|${d}[a${k}]`); }
const labels = filters.map((f) => f.slice(f.lastIndexOf('['))).join('');
const filter = filters.join(';') + `;${labels}amix=inputs=${filters.length}:normalize=0,alimiter=limit=0.95,apad[aout]`;
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(info.fps), '-c:v', 'mjpeg', '-i', '-', ...inputs, '-filter_complex', filter, '-map', '0:v', '-map', '[aout]', '-shortest',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-r', String(info.fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let f = 0; f < info.frames; f++) { const url = await page.evaluate((f) => __render.frame(f), f); if (!ff.stdin.write(Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'))) await new Promise((r) => ff.stdin.once('drain', r)); }
ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await browser.close(); server.close();
console.log(`Saved ${path.relative(root, out)} (${info.total.toFixed(1)} s, rendered in ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
