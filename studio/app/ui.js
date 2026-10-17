// Small DOM helpers for the studio (no framework): h() builds elements, plus toasts, modals and form fields.
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// h('div.card#main', { onclick, title, style: {...}, dataset: {...} }, child, [children], 'text')
export function h(tag, attrs, ...kids) {
  if (attrs == null || typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs)) { if (attrs != null) kids.unshift(attrs); attrs = {}; }
  const [, name = 'div', rest = ''] = tag.match(/^([a-z0-9-]*)(.*)$/i);
  const el = document.createElement(name || 'div');
  for (const m of rest.matchAll(/([.#])([\w-]+)/g)) m[1] === '.' ? el.classList.add(m[2]) : (el.id = m[2]);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'class') el.className += ' ' + v;
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  add(el, kids); return el;
}
function add(el, kids) { for (const k of kids.flat(Infinity)) if (k != null && k !== false) el.append(k instanceof Node ? k : document.createTextNode(String(k))); }
export function clear(el, ...kids) { el.replaceChildren(); add(el, kids); return el; }

// icons: tiny inline SVGs (stroke style, like the mockup)
const ICONS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z', idea: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z',
  story: 'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7', build: 'M12 2l9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5', studio: 'M3 5h18v14H3zM3 9h18M8 5l-2 4M14 5l-2 4M20 5l-2 4',
  generate: 'M6 4l14 8-14 8z', library: 'M4 4h4v16H4zM10 4h4v16h-4zM16 5l4-1 3 15-4 1z', settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3', redo: 'M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3', plus: 'M12 5v14M5 12h14', check: 'M5 12l5 5L20 7', x: 'M6 6l12 12M18 6L6 18',
  play: 'M7 4l13 8-13 8z', pause: 'M7 4h4v16H7zM13 4h4v16h-4z', prev: 'M6 5v14M19 5L9 12l10 7z', next: 'M18 5v14M5 5l10 7-10 7z', stepb: 'M15 6l-6 6 6 6', stepf: 'M9 6l6 6-6 6',
  loop: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3', grid: 'M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18', safe: 'M4 4h16v16H4zM8 7h8v10H8z',
  camera: 'M3 7h4l2-3h6l2 3h4v13H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', orbit: 'M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M2 12c0-3 4.5-5 10-5s10 2 10 5-4.5 5-10 5S2 15 2 12', move: 'M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20',
  scissors: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12', trash: 'M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15', magnet: 'M6 3v8a6 6 0 0 0 12 0V3h-4v8a2 2 0 0 1-4 0V3z',
  zoomin: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3M11 8v6M8 11h6', zoomout: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3M8 11h6', clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0', users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3a4 4 0 0 1 0 8M22 21a7 7 0 0 0-5-6.7', pin: 'M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  box: 'M21 8l-9-5-9 5 9 5zM3 8v8l9 5 9-5V8M12 13v8', music: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z', mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z', text: 'M4 6V4h16v2M9 20h6M12 4v16', sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  folder: 'M3 6h6l2 2h10v12H3z', copy: 'M8 8h12v12H8zM4 16V4h12', download: 'M12 3v12M7 10l5 5 5-5M4 21h16', upload: 'M12 21V9M7 14l5-5 5 5M4 3h16', refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4', unlock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 7.5-2', up: 'M12 19V5M5 12l7-7 7 7', down: 'M12 5v14M19 12l-7 7-7-7', dots: 'M12 6h.01M12 12h.01M12 18h.01',
  wand: 'M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5', history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l4 2', keyboard: 'M2 6h20v12H2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z', fx: 'M13 2L3 14h9l-1 8 10-12h-9z',
  health: 'M22 12h-4l-3 9L9 3l-3 9H2', film: 'M3 3h18v18H3zM7 3v18M17 3v18M3 8h4M3 13h4M3 18h4M17 8h4M17 13h4M17 18h4', drag: 'M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01', volume: 'M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
};
export function icon(name, size = 18) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', size); s.setAttribute('height', size); s.setAttribute('class', 'ic');
  s.innerHTML = `<path d="${ICONS[name] || ICONS.dots}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`; return s;
}
export const btn = (label, onclick, cls = '', ic = null, title = null) => h('button.btn' + (cls ? '.' + cls.split(' ').join('.') : ''), { onclick, title, type: 'button' }, ic && icon(ic, 16), label);

// toasts
export function toast(msg, kind = 'info', ms = 3200) {
  let box = $('#toasts'); if (!box) box = document.body.appendChild(h('div#toasts'));
  const t = box.appendChild(h('div.toast.' + kind, msg)); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms);
}

// modal: returns { el, close }; resolve with a value via close(v)
export function modal(title, body, { actions = [], wide = false, onClose } = {}) {
  let done; const p = new Promise((r) => (done = r));
  const close = (v) => { bg.remove(); onClose && onClose(v); done(v); document.removeEventListener('keydown', esc); };
  const esc = (e) => { if (e.key === 'Escape') close(null); };
  const bg = h('div.modal-bg', { onmousedown: (e) => { if (e.target === bg) close(null); } },
    h('div.modal' + (wide ? '.wide' : ''), h('div.modal-head', h('h3', title), h('button.icon-btn', { onclick: () => close(null), title: 'Close' }, icon('x'))),
      h('div.modal-body', body), actions.length ? h('div.modal-foot', actions.map((a) => btn(a.label, () => (a.run ? a.run(close) : close(a.value ?? a.label)), a.cls || ''))) : null));
  document.body.append(bg); document.addEventListener('keydown', esc);
  return { el: bg, close, done: p };
}
export async function confirmBox(title, text, okLabel = 'OK', danger = false) {
  const m = modal(title, h('p', text), { actions: [{ label: 'Cancel', value: false }, { label: okLabel, value: true, cls: danger ? 'danger' : 'primary' }] }); return !!(await m.done);
}
export async function promptBox(title, label, value = '') {
  const inp = h('input.input', { value }); const m = modal(title, h('label.field', h('span', label), inp), { actions: [{ label: 'Cancel', value: null }, { label: 'OK', cls: 'primary', run: (c) => c(inp.value) }] });
  setTimeout(() => { inp.focus(); inp.select(); }, 30); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') m.close(inp.value); }); return m.done;
}

// fields: label + control, onchange(value)
export function select(options, value, onchange, attrs = {}) {
  const el = h('select.input', { ...attrs, onchange: (e) => onchange(e.target.value) }, options.map((o) => { const [v, l] = Array.isArray(o) ? o : typeof o === 'object' ? [o.value, o.label] : [o, o]; return h('option', { value: v, selected: String(v) === String(value) }, l); }));
  return el;
}
export const row = (label, control, extra = null) => h('div.frow', h('label', label), h('div.fctl', control), extra);
export function slider(value, onchange, { min = 0, max = 1, step = 0.01, fmt = (v) => Math.round(v * 100) + '%', live = true } = {}) {
  const out = h('span.sval', fmt(value));
  const inp = h('input.range', { type: 'range', min, max, step, value, oninput: (e) => { out.textContent = fmt(+e.target.value); if (live) onchange(+e.target.value, false); }, onchange: (e) => onchange(+e.target.value, true) });
  const pct = () => inp.style.setProperty('--fill', ((inp.value - min) / (max - min) * 100) + '%'); inp.addEventListener('input', pct); pct();
  return h('div.slider', inp, out);
}
export function num(value, onchange, { step = 0.05, min = null, max = null, w = 64 } = {}) {
  return h('input.input.num', { type: 'number', step, min, max, value: value ?? '', style: { width: w + 'px' }, onchange: (e) => onchange(e.target.value === '' ? null : +e.target.value) });
}
export function toggle(on, onchange, label = '') {
  return h('label.toggle', h('input', { type: 'checkbox', checked: !!on, onchange: (e) => onchange(e.target.checked) }), h('span.track', h('span.knob')), label && h('span.tlabel', label));
}
export function chips(options, values, onchange, { multi = true } = {}) {
  const set = new Set(values || []);
  return h('div.chips', options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return h('button.chip' + (set.has(v) ? '.on' : ''), { type: 'button', onclick: () => { if (multi) { set.has(v) ? set.delete(v) : set.add(v); onchange([...set]); } else onchange(v); } }, l); }));
}
export const color = (value, onchange) => h('input.color', { type: 'color', value: hex(value), oninput: (e) => onchange(parseInt(e.target.value.slice(1), 16), false), onchange: (e) => onchange(parseInt(e.target.value.slice(1), 16), true) });
export const hex = (v) => (typeof v === 'number' ? '#' + v.toString(16).padStart(6, '0') : typeof v === 'string' && v.startsWith('#') ? v : '#888888');
export const fmtTime = (t) => { t = Math.max(0, t || 0); const m = Math.floor(t / 60), s = t - m * 60; return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`; };
export const fmtBytes = (b) => (b > 2 ** 30 ? (b / 2 ** 30).toFixed(1) + ' GB' : b > 2 ** 20 ? (b / 2 ** 20).toFixed(0) + ' MB' : Math.round(b / 1024) + ' KB');
export const ago = (iso) => { const s = (Date.now() - new Date(iso)) / 1000; return s < 60 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' days ago'; };
export const clone = (o) => JSON.parse(JSON.stringify(o));
export const debounce = (fn, ms) => { let t; const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; d.flush = (...a) => { clearTimeout(t); fn(...a); }; return d; };
