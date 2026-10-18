#!/usr/bin/env node
// Rebuild studio/assets/catalog.json from every registered prop (keeps usedIn / extra fields of existing entries).
//   node tools/build_catalog.mjs
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), file = path.join(root, 'studio/assets/catalog.json');
const server = http.createServer((req, res) => { const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); fs.createReadStream(p).pipe(res); }).listen(0);
const browser = await chromium.launch(); const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/studio/asset-review.html?list=1`);
const { list, missing } = await page.waitForFunction(() => window.__done, null, { timeout: 60000 }).then((h) => h.jsonValue());
await browser.close(); server.close();
const old = JSON.parse(fs.readFileSync(file, 'utf8')), byId = Object.fromEntries(old.props.map((p) => [p.id, p]));
const FILE = { home: 'home', bank: 'bank', transport: 'transport', tech: 'tech' };
const props = list.map((a) => ({ ...(byId[a.id] || {}), id: a.id, label: a.label, category: a.cat, file: byId[a.id]?.file || (a.cat === 'factory' ? `studio/worlds/chocolate-factory/${a.id.startsWith('cfl_') ? 'living' : a.id.startsWith('cfu_') ? 'dress-under' : a.id.startsWith('cf1_') ? 'dress-first' : 'dress-ground'}.js` : null) || `studio/assets/${a.cat === 'sets' && !byId[a.id] ? 'places' : FILE[a.cat] || a.cat}.js`, tags: a.tags.length ? a.tags : byId[a.id]?.tags || [], usedIn: byId[a.id]?.usedIn || [] }));
fs.writeFileSync(file, JSON.stringify({ ...old, props }, null, 2) + '\n');
console.log(`${props.length} props (${props.length - old.props.length >= 0 ? '+' : ''}${props.length - old.props.length})${missing.length ? ' · files not found: ' + missing.join(', ') : ''}`);
