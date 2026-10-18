#!/usr/bin/env node
// Export the walkable Chocolate Factory as a static folder (no studio server needed) — used by the island game:
//   node tools/export_world.mjs ../drive-portfolio/factory
// Copies vendor/three.min.js + studio/world.html and exactly the scripts it loads, the brand images and mix.json.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), out = path.resolve(process.argv[2] || 'export/factory');
const html = fs.readFileSync(path.join(root, 'studio/world.html'), 'utf8');
const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
const files = new Set(['studio/world.html', 'studio/assets/mix.json']);
for (const s of srcs) files.add(path.normalize(path.join('studio', s)));
for (const f of fs.readdirSync(path.join(root, 'studio/assets/brand'))) files.add(path.join('studio/assets/brand', f));
fs.rmSync(out, { recursive: true, force: true });
let bytes = 0, n = 0;
for (const f of files) { const src = path.join(root, f); if (!fs.existsSync(src)) { console.warn('missing', f); continue; } const dst = path.join(out, f); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); bytes += fs.statSync(src).size; n++; }
// cache-bust: every script in the exported page gets ?v=<export time>, so browsers never mix old and new files
{ const v = Date.now().toString(36), page = path.join(out, 'studio/world.html'); fs.writeFileSync(page, fs.readFileSync(page, 'utf8').replace(/<script src="([^"?]+)"/g, `<script src="$1?v=${v}"`)); }
fs.writeFileSync(path.join(out, 'README.txt'), 'Zungga Chocolate Factory — exported from github.com/Zungga/zungga-story-studio (tools/export_world.mjs). Open studio/world.html (served over http).\n');
console.log(`${n} files, ${(bytes / 1048576).toFixed(1)} MB → ${out}`);
