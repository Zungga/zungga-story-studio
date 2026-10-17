// Library: assets (3D previews), characters + character maker, voices (hear, test, add), add asset (picture upload) + requests.
import { h, clear, icon, btn, toast, select, row, color, chips, modal, confirmBox, ago, clone } from '../ui.js';
import { api, waitJob } from '../api.js';
import { pretty } from './timeline.js';

// one small offscreen renderer makes every thumbnail; one live viewer shows the selected thing turning
let R = null;
function renderer() {
  if (R) return R; const T = THREE, r = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true }); r.setPixelRatio(1); r.setSize(256, 256); r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.ACESFilmicToneMapping;
  const scene = new T.Scene(); scene.add(new T.HemisphereLight(0xffffff, 0xd6c3a8, 1.4)); const sun = new T.DirectionalLight(0xffeedd, 2.4); sun.position.set(2, 4, 3); scene.add(sun);
  const cam = new T.PerspectiveCamera(30, 1, 0.01, 100); R = { r, scene, cam }; return R;
}
function frameObj(cam, obj, yaw = 0.6) { const T = THREE, b = ZA.frameBox(obj), c = b.getCenter(new T.Vector3()), s = b.getSize(new T.Vector3()).length() || 1; cam.position.set(c.x + Math.sin(yaw) * s * 1.5, c.y + s * 0.45, c.z + Math.cos(yaw) * s * 1.5); cam.lookAt(c); }
function build(kind, spec) {
  const Z = window.ZCharacters;
  if (kind === 'prop') return spec.startsWith('img:') ? null : ZAssets.build(spec).group;
  if (kind === 'toon') { const tp = Z.TOON_PRESETS[spec.base || spec]; const o = spec.base ? { ...tp, look: { ...(tp.look || {}), ...(spec.look || {}) }, colors: { ...(tp.colors || {}), ...(spec.colors || {}) } } : tp; const ch = Z.toon(o); ch.setExpression?.('smile', true); return ch.group; }
  const P = Z.PRESETS[spec.base || spec]; const ch = Z.person(spec.base ? { ...P, wear: { ...(P.wear || {}), ...(spec.wear || {}) } } : P); return ch.group;
}
const thumbCache = {};
function thumb(kind, spec, key) {
  if (thumbCache[key]) return thumbCache[key];
  try { const { r, scene, cam } = renderer(), obj = build(kind, spec); if (!obj) return null; scene.add(obj); frameObj(cam, obj); r.render(scene, cam); scene.remove(obj); return (thumbCache[key] = r.domElement.toDataURL('image/png')); } catch (e) { console.warn(e); return null; }
}
function viewer(kind, spec) {
  const T = THREE, box = h('div.viewer3d'), r = new T.WebGLRenderer({ antialias: true, alpha: true }); r.setPixelRatio(Math.min(2, devicePixelRatio)); r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.ACESFilmicToneMapping; box.append(r.domElement);
  const scene = new T.Scene(); scene.add(new T.HemisphereLight(0xffffff, 0xd6c3a8, 1.3)); const sun = new T.DirectionalLight(0xffeedd, 2.6); sun.position.set(2, 4, 3); scene.add(sun);
  const cam = new T.PerspectiveCamera(30, 1, 0.01, 100); let obj = null, ch = null, yaw = 0.5, raf = 0, last = performance.now(), drag = null;
  const set = (k, s) => { if (obj) scene.remove(obj); try { obj = build(k, s); } catch (e) { obj = null; } if (obj) scene.add(obj); };
  set(kind, spec);
  box.addEventListener('pointerdown', (e) => { drag = e.clientX; box.setPointerCapture(e.pointerId); }); box.addEventListener('pointermove', (e) => { if (drag != null) { yaw -= (e.clientX - drag) * 0.01; drag = e.clientX; } }); box.addEventListener('pointerup', () => (drag = null));
  const loop = (now) => { raf = requestAnimationFrame(loop); if (!box.isConnected) { cancelAnimationFrame(raf); r.dispose(); return; } const w = box.clientWidth; if (w && r.domElement.width !== Math.round(w * r.getPixelRatio())) r.setSize(w, w, false); const dt = (now - last) / 1000; last = now; if (drag == null) yaw += dt * 0.4; if (obj) { frameObj(cam, obj, yaw); obj.traverse?.(() => {}); } r.render(scene, cam); };
  raf = requestAnimationFrame(loop); box.set = set; return box;
}

export async function mount(el, { app, extra }) {
  let lib = await app.lib(true), tab = sessionStorage.getItem('zs-libtab') || 'assets', cat = 'all', selA = null, selC = null;
  const go = (t) => { tab = t; sessionStorage.setItem('zs-libtab', t); render(); };
  function render() {
    clear(el, h('div.page', { style: { maxWidth: '1240px' } },
      h('div.page-head', h('div', h('h1', 'Library'), h('p', 'Everything the studio can put in a story — all drawn in code, so it renders the same on any Mac.'))),
      h('div.tabs', { style: { border: 0, padding: '0 0 14px' } }, [['assets', 'Assets'], ['characters', 'Characters'], ['sounds', 'Sounds & dialogues'], ['voices', 'Voices'], ['add', 'Add asset & requests']].map(([k, l]) => h('button.tab' + (tab === k ? '.on' : ''), { onclick: () => go(k) }, l))),
      ({ assets, characters, sounds, voices, add }[tab])()));
  }
  // ---------- assets ----------
  function assets() {
    const items = lib.props.concat(lib.uploads), cats = ['all', ...new Set(items.map((p) => p.category))], shown = items.filter((p) => cat === 'all' || p.category === cat);
    selA = selA && items.find((p) => p.id === selA.id) ? selA : shown[0];
    const grid = h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' } }, shown.map((p) => h('div.card.lcard' + (selA?.id === p.id ? '.on' : ''), { onclick: () => { selA = p; render(); } },
      h('div.lthumb', { style: p.id.startsWith('img:') ? { backgroundImage: `url(assets/uploads/${p.id.slice(4)})`, backgroundSize: 'contain' } : {} }, p.id.startsWith('img:') ? null : h('img', { src: thumb('prop', p.id, 'p:' + p.id) || '', style: { width: '100%' }, alt: '' })),
      h('b.small', p.label), h('span.small.muted', pretty(p.category)))));
    return h('div.grid', { style: { gridTemplateColumns: '1fr 320px', alignItems: 'start' } },
      h('div', chips(cats.map((c) => [c, pretty(c)]), [cat], (v) => { cat = v; selA = null; render(); }, { multi: false }), h('div', { style: { height: '12px' } }), grid),
      selA ? h('div.card.pad', { style: { position: 'sticky', top: '10px' } }, selA.id.startsWith('img:') ? h('img', { src: `assets/uploads/${selA.id.slice(4)}`, style: { width: '100%', borderRadius: '12px' } }) : viewer('prop', selA.id),
        h('h3', { style: { margin: '10px 0 2px' } }, selA.label), h('div.small.muted', `id: ${selA.id} · ${pretty(selA.category)}`),
        selA.tags ? h('div.chips', { style: { marginTop: '8px' } }, selA.tags.map((t) => h('span.chip', t))) : null,
        selA.usedIn?.length ? h('p.small.muted', 'Used in: ' + selA.usedIn.join(', ')) : null,
        h('p.small.muted', 'Add it to a scene from Studio → Props, or just say it in the narration — the studio finds it.')) : null);
  }
  // ---------- characters + maker ----------
  function characters() {
    const toon = lib.toonPresets.map((p) => ({ ...p, world: 'toon' })), people = lib.peoplePresets.map((p) => ({ ...p, world: 'people' })), mine = lib.characters;
    const card = (key, kind, spec, label, sub, onclick, on) => h('div.card.lcard' + (on ? '.on' : ''), { onclick }, h('div.lthumb', h('img', { src: thumb(kind, spec, key) || '', style: { width: '100%' }, alt: '' })), h('b.small', label), h('span.small.muted', sub));
    return h('div.grid', { style: { gridTemplateColumns: '1fr 360px', alignItems: 'start' } },
      h('div',
        h('div.section-title', { style: { marginTop: 0 } }, 'Your characters'),
        mine.length ? h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' } }, mine.map((c) => card('m:' + c.id + JSON.stringify(c), c.world === 'people' ? 'person' : 'toon', c, c.label, `based on ${c.base}`, () => { selC = clone(c); render(); }, selC?.id === c.id))) : h('p.muted.small', 'None yet — pick any character below and press “Make my own version”.'),
        h('div.section-title', 'Cartoon world'), h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' } }, toon.map((p) => card('t:' + p.id, 'toon', p.id, p.label, p.role, () => { selC = { base: p.id, world: 'toon', label: p.label, preset: true }; render(); }, selC?.preset && selC.base === p.id))),
        h('div.section-title', 'People'), h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' } }, people.map((p) => card('h:' + p.id, 'person', p.id, p.label, 'person', () => { selC = { base: p.id, world: 'people', label: p.label, preset: true }; render(); }, selC?.preset && selC.base === p.id)))),
      selC ? maker() : h('div.card.pad.muted', 'Pick a character to see it turn, or to make your own version (new colours and clothes).'));
  }
  function maker() {
    const c = selC, Z = window.ZCharacters, isToon = c.world !== 'people', kind = isToon ? 'toon' : 'person', v = viewer(kind, c.preset ? c.base : c);
    const upd = () => v.set(kind, c.preset ? c.base : c);
    const kids = [v, h('h3', { style: { margin: '10px 0 6px' } }, c.preset ? c.label : 'Character maker')];
    if (c.preset) { kids.push(h('p.small.muted', isToon ? (Z.TOON_PRESETS[c.base]?.role || '') : 'Person'), btn('Make my own version', () => { selC = { id: null, base: c.base, world: c.world, label: c.label + ' (mine)' }; render(); }, 'primary', 'wand')); return h('div.card.pad', { style: { position: 'sticky', top: '10px' } }, kids); }
    kids.push(row('Name', h('input.input', { value: c.label, oninput: (e) => (c.label = e.target.value) })));
    if (isToon) {
      const tp = Z.TOON_PRESETS[c.base] || {}, k = tp.kind;
      if (k === 'boxkid' || k === 'cat') for (const [key, l, d] of k === 'boxkid' ? [['head', 'Head box', 0x9442c8], ['face', 'Face', 0xf6cdb4], ['cap', 'Cap', 0xf6912a], ['overalls', 'Overalls', 0xf07a24], ['sole', 'Shoes', 0x5b2a9c]] : [['body', 'Fur', 0xf9c623], ['belly', 'Belly', 0x2c6bcf], ['blue', 'Details', 0x2a62c4]]) kids.push(h('div.swatch-row', l, color(c.colors?.[key] ?? d, (val) => { c.colors = { ...(c.colors || {}), [key]: val }; upd(); })));
      else if (k === 'folk') {
        const look = { ...(tp.look || {}), ...(c.look || {}) }, opts = (key) => [...new Set(Object.values(Z.TOON_PRESETS).map((p) => p.look?.[key]).filter((x) => typeof x === 'string'))];
        for (const [key, l] of [['outfit', 'Top'], ['bottomType', 'Bottom'], ['hair', 'Hair'], ['hat', 'Hat']]) kids.push(row(l, select([['', '—'], ...opts(key).map((x) => [x, pretty(x)])], look[key] || '', (val) => { c.look = { ...(c.look || {}), [key]: val || undefined }; upd(); })));
        for (const [key, l] of [['head', 'Head box'], ['face', 'Skin'], ['top', 'Top colour'], ['top2', 'Second colour'], ['bottom', 'Bottom colour'], ['shoe', 'Shoes'], ['hairColor', 'Hair colour']]) kids.push(h('div.swatch-row', l, color(look[key] ?? 0x888888, (val) => { c.look = { ...(c.look || {}), [key]: val }; upd(); })));
      } else kids.push(h('p.small.muted', 'The idea planet keeps its look.'));
    } else {
      const P = Z.PRESETS[c.base] || {}, WT = Z.WEAR_TYPES || {};
      for (const [key, l] of [['top', 'Top'], ['layer', 'Layer'], ['bottom', 'Bottom'], ['shoes', 'Shoes']]) { const w = { ...((P.wear || {})[key] || {}), ...((c.wear || {})[key] || {}) }; kids.push(row(l, h('div.fctl', select((WT[key] || []).map((x) => [x, pretty(x)]), w.type || (key === 'layer' ? 'none' : ''), (val) => { c.wear = { ...(c.wear || {}), [key]: { ...w, type: val } }; upd(); render(); }), color(w.color ?? 0x888888, (val) => { c.wear = { ...(c.wear || {}), [key]: { ...w, ...((c.wear || {})[key] || {}), color: val } }; upd(); })))); }
      kids.push(h('p.small.muted', 'No school uniforms. Every t-shirt carries the Zungga logo.'));
    }
    kids.push(h('div.chips', { style: { marginTop: '12px' } }, btn('Save character', async () => {
      const list = clone(lib.characters); c.id = c.id || (c.label || 'character').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') + '_' + Date.now().toString(36).slice(-4);
      const i = list.findIndex((x) => x.id === c.id); if (i >= 0) list[i] = c; else list.push(c);
      await api.put('/api/library/characters', list); lib = await app.lib(true); toast('Saved — add it to a story from Story → Cast or Studio → Characters', 'ok', 4500); render();
    }, 'primary', 'check'), c.id ? btn('Delete', async () => { if (!(await confirmBox('Delete character?', c.label, 'Delete', true))) return; await api.put('/api/library/characters', lib.characters.filter((x) => x.id !== c.id)); lib = await app.lib(true); selC = null; render(); }, 'ghost danger', 'trash') : null));
    return h('div.card.pad', { style: { position: 'sticky', top: '10px' } }, kids);
  }
  // ---------- sounds + dialogues (from the resume game and the studio) ----------
  let who = 'all', au = null;
  function sounds() {
    const play = (src) => { if (au) au.pause(); au = new Audio(src); au.play(); };
    const groups = ['all', ...new Set((lib.dialogues || []).map((d) => d.kind))], dl = (lib.dialogues || []).filter((d) => who === 'all' || d.kind === who);
    const kindName = { shop: 'Shop sellers', isl: 'Islanders', cust: 'Customers', thanks: 'Thank-yous', race: 'Race', atm: 'ATM', narrator: 'Narrator' };
    return h('div.grid', { style: { gridTemplateColumns: '320px 1fr', alignItems: 'start' } },
      h('div.card.pad', h('h3', { style: { marginBottom: '8px' } }, `Sound effects (${lib.sfx.length})`),
        lib.sfx.map((f) => h('div.item', h('button.icon-btn.sm', { onclick: () => play('assets/sfx/' + f) }, icon('play', 13)), h('span.grow', f.replace(/\.(mp3|wav)$/, '').replace(/-/g, ' ')))),
        h('p.small.muted', 'Use them in Studio → Sound → Sound effects, on any word.')),
      h('div.card.pad', h('h3', { style: { marginBottom: '8px' } }, `Dialogues (${(lib.dialogues || []).length})`),
        chips(groups.map((g) => [g, g === 'all' ? 'All' : kindName[g] || g]), [who], (v) => { who = v; render(); }, { multi: false }),
        h('div', { style: { marginTop: '10px' } }, dl.map((d) => h('div.item', h('button.icon-btn.sm', { onclick: () => play('assets/dialogues/' + d.file.replace('../dialogues/', '')) }, icon('play', 13)), h('span.grow', { style: { whiteSpace: 'normal' } }, h('b', d.who), d.moment ? h('span.muted', ` · ${d.moment}`) : null, h('div.small', `“${d.text}”`))))),
        h('p.small.muted', 'Voice lines from the resume game (shop sellers, islanders, customers). Add one to a scene in Studio → Sound → Sound effects (🗣 entries).')));
  }
  // ---------- voices ----------
  function voices() {
    const testText = h('input.input', { value: 'Hi! I saved a little every day, and look what I bought.' });
    return h('div',
      h('div.grid', { style: { gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' } }, lib.voices.map((v) => h('div.card.pad',
        h('div.isec-h', h('h3', v.label), v.hasReference ? h('span.badge.ok', 'Ready') : h('span.badge.bad', 'Recording missing')),
        h('p.small.muted', v.refText ? `“${v.refText.slice(0, 120)}${v.refText.length > 120 ? '…' : ''}”` : 'No transcript yet'),
        v.pitch ? h('p.small.muted', `Pitch about ${v.pitch} Hz`) : null,
        v.id === 'narrator' || v.note ? h('p.small', { style: { color: 'var(--warn)' } }, '⚠ ', v.note || 'Cloned from a downloaded clip — publishing needs the speaker’s permission.') : null,
        h('div.chips', v.hasReference ? btn('Hear the original', () => new Audio(`/selected-voices/${v.id}/reference.wav`).play(), 'small', 'volume') : null,
          v.hasReference ? btn('Try a line', async () => { try { const j = await api.post(`/api/voices/${v.id}/test`, { text: testText.value }); toast('Making the line…', 'info'); const r = await waitJob(j.id); new Audio(r.file + '?t=' + Date.now()).play(); lib = await app.lib(true); } catch (e) { toast(e.message, 'error'); } }, 'small', 'mic') : null,
          v.test ? btn('Last test', () => new Audio(`/selected-voices/${v.id}/out/test.wav?t=${Date.now()}`).play(), 'small ghost', 'play') : null)))),
      h('div.card.pad', { style: { marginTop: '16px' } }, row('Test line', testText), h('p.small.muted', 'Voices are cloned on this Mac with Qwen3-TTS from each voice’s reference recording. The recordings are private and not in git — copy selected-voices/<name>/reference.wav from your backup on a new Mac.')),
      h('div.card.pad', { style: { marginTop: '16px' } }, h('h3', 'Add a voice'), addVoiceForm()));
  }
  function addVoiceForm() {
    const name = h('input.input', { placeholder: 'e.g. girl-bright' }), label = h('input.input', { placeholder: 'e.g. Bright girl (12)' }), file = h('input', { type: 'file', accept: 'audio/*' }), text = h('textarea.input', { rows: 2, placeholder: 'Optional: exactly what is said in the recording (left empty, Whisper writes it down)' }), perm = h('input', { type: 'checkbox' });
    return h('div', row('Short name', name), row('Label', label), row('Recording', file), h('p.small.muted', '10–20 seconds of one person speaking clearly, no music.'), row('Words', text), h('label.toggle', perm, h('span.tlabel', 'The speaker agreed to be used for Zungga videos')),
      h('div', { style: { marginTop: '10px' } }, btn('Add voice', async () => {
        if (!name.value.trim() || !file.files[0]) return toast('Give it a name and choose a recording', 'error');
        if (!perm.checked) return toast('Please confirm the speaker agreed', 'error');
        try {
          const q = new URLSearchParams({ name: name.value.trim(), label: label.value || name.value, file: file.files[0].name, text: text.value.trim(), permission: 'Speaker agreed (' + new Date().toISOString().slice(0, 10) + ')' });
          const r = await api.upload('/api/voices?' + q, file.files[0]); if (r.id && !r.status) { toast('Voice added', 'ok'); } else { toast('Listening to the recording…', 'info'); await waitJob(r.id); toast('Voice added', 'ok'); }
          lib = await app.lib(true); render();
        } catch (e) { toast(e.message, 'error'); }
      }, 'primary', 'upload')));
  }
  // ---------- add asset + requests ----------
  function add() {
    const file = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp' });
    return h('div.grid.g2', { style: { alignItems: 'start' } },
      h('div.card.pad', h('h3', 'Upload a picture'), h('p.muted.small', 'A PNG with a transparent background works best (a sign, a drawing, a poster). It stands in the scene like a cut-out.'), file,
        h('div', { style: { marginTop: '10px' } }, btn('Upload', async () => { const f = file.files[0]; if (!f) return; try { const r = await api.upload('/api/library/upload?name=' + encodeURIComponent(f.name), f); lib = await app.lib(true); toast(`Added “${r.label}” — find it under Uploads`, 'ok'); cat = 'uploads'; go('assets'); } catch (e) { toast(e.message, 'error'); } }, 'primary', 'upload')),
        h('p.small.muted', { style: { marginTop: '14px' } }, 'New 3D props are drawn in code (studio/assets/*.js + catalog.json) so every render is identical. Ask for one below and it gets built.')),
      h('div.card.pad', h('div.isec-h', h('h3', `Requests (${lib.requests.length})`), btn('New request', () => {
        const n = h('input.input'), note = h('textarea.input', { rows: 3 });
        modal('Request a new asset', [h('label.field', h('span', 'What?'), n), h('label.field', h('span', 'Notes'), note)], { actions: [{ label: 'Cancel', value: null }, { label: 'Save', cls: 'primary', run: async (close) => { if (!n.value.trim()) return; await api.post('/api/library/requests', { name: n.value.trim(), note: note.value }); lib = await app.lib(true); close(); render(); } }] });
      }, 'small', 'plus')),
        lib.requests.length ? lib.requests.slice().reverse().map((r) => h('div.item', { style: { cursor: 'default' } }, h('span.grow', h('b', r.name), h('span.muted', ` · ${r.kind}${r.project ? ' · ' + r.project : ''} · ${ago(r.created)}`), r.note ? h('div.small.muted', r.note) : null), h('span.badge.warn', r.status), h('button.icon-btn.sm', { title: 'Remove', onclick: async () => { await api.del('/api/library/requests/' + r.id); lib = await app.lib(true); render(); } }, icon('x', 13)))) : h('p.muted.small', 'Nothing requested. The Build step adds requests here when a story mentions something the library doesn’t have.')));
  }
  render();
  return {};
}
