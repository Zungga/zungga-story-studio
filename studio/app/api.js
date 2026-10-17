// Talks to tools/server.mjs. Every call returns parsed JSON or throws an Error with the server's message.
async function call(method, url, data, raw = false) {
  const opts = { method, headers: {} };
  if (data !== undefined) { if (raw) opts.body = data; else { opts.body = JSON.stringify(data); opts.headers['Content-Type'] = 'application/json'; } }
  const r = await fetch(url, opts); let j = null; try { j = await r.json(); } catch { /* not json */ }
  if (!r.ok) throw new Error(j?.error || `${r.status} ${r.statusText}`);
  return j;
}
export const api = {
  get: (u) => call('GET', u), post: (u, d = {}) => call('POST', u, d), put: (u, d) => call('PUT', u, d), patch: (u, d) => call('PATCH', u, d), del: (u) => call('DELETE', u),
  upload: (u, file) => call('POST', u, file, true),
  projects: () => call('GET', '/api/projects'),
  project: (id) => call('GET', `/api/projects/${id}`),
  library: () => call('GET', '/api/library'),
  settings: () => call('GET', '/api/settings'),
};

// live events (jobs, saves, voice) — one EventSource for the whole app, re-connects by itself
const listeners = new Set(); export const jobs = new Map();
export function onEvent(fn) { listeners.add(fn); return () => listeners.delete(fn); }
let es = null;
export function connect() {
  if (es) return; es = new EventSource('/api/events');
  es.onmessage = (m) => {
    const ev = JSON.parse(m.data);
    if (ev.type === 'hello') { jobs.clear(); for (const j of ev.jobs) jobs.set(j.id, j); }
    if (ev.type === 'job') jobs.set(ev.job.id, ev.job);
    for (const fn of listeners) fn(ev);
  };
  es.onerror = () => { for (const fn of listeners) fn({ type: 'offline' }); };
  es.onopen = () => { for (const fn of listeners) fn({ type: 'online' }); };
}
// wait for a job to finish; onProgress(job) on every update
export function waitJob(id, onProgress) {
  return new Promise((resolve, reject) => {
    const check = (j) => { if (!j || j.id !== id) return; onProgress && onProgress(j); if (j.status === 'done') { off(); resolve(j.result); } else if (j.status === 'failed' || j.status === 'cancelled') { off(); reject(new Error(j.error || j.message || j.status)); } };
    const off = onEvent((ev) => ev.type === 'job' && check(ev.job));
    check(jobs.get(id));
  });
}
