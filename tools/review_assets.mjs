#!/usr/bin/env node
/*
 * Contact sheet of library assets, for checking how they look.
 *   node tools/review_assets.mjs <category> [out.png] [--ids a,b] [--yaw 0.6] [--pitch 0.45]
 * Prints each asset's size (metres) and any build errors.
 */
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), opt = (k) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : null; };
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const cat = pos[0] || '', out = pos[1] || path.join(root, 'exports', `review-${cat || 'all'}.png`);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => { const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1556, height: 900 } });
page.on('pageerror', (e) => console.error('page error:', e.message));
const q = new URLSearchParams({ cat }); for (const k of ['ids', 'yaw', 'pitch', 'files']) if (opt(k)) q.set(k, opt(k));
await page.goto(`http://localhost:${server.address().port}/studio/asset-review.html?${q}`);
const done = await page.waitForFunction(() => window.__done, null, { timeout: 120000 }).then((h) => h.jsonValue());
fs.mkdirSync(path.dirname(out), { recursive: true });
await page.locator('#grid').screenshot({ path: out });
await browser.close(); server.close();
if (done.missing.length) console.log('files not found (fine if not written yet):', done.missing.join(', '));
for (const r of done.results) console.log(r.error ? `✗ ${r.id}: ${r.error}` : `✓ ${r.id}  ${r.size.join(' × ')} m`);
console.log(`${done.count} assets → ${out}`);
