// One door to the language model for the Writers' Room.
//   anthropic: Claude (Messages API)   openai: GPT (Chat Completions)   local: mlx-lm's OpenAI-style server on this Mac
//   Settings → roomAI: 'auto' (default: Claude key → GPT key → local), 'anthropic', 'openai' or 'local'.
//   Keys come from tools/keys.mjs (environment or the macOS Keychain) — never from the project folder.
// chat(messages, opts) → text        json(messages, opts) → parsed object (retries + repair)
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { getKey } from './keys.mjs';

const LOCAL_PORT = 8799;
let localProc = null, localReady = null;

export async function backend(settings) {
  const want = settings.roomAI === 'cloud' ? 'auto' : settings.roomAI || 'auto';
  if (want === 'local') return 'local';
  const has = { anthropic: !!(await getKey('anthropic')), openai: !!(await getKey('openai')) };
  if (want !== 'auto' && has[want]) return want;
  return has.anthropic ? 'anthropic' : has.openai ? 'openai' : 'local';
}
export const cloudAvailable = async () => ({ anthropic: !!(await getKey('anthropic')), openai: !!(await getKey('openai')) });
export const AI_LABEL = { anthropic: 'Claude', openai: 'GPT', local: 'Local model' };

async function ensureLocal(root, settings) {
  if (localReady) return localReady;
  localReady = (async () => {
    try { const r = await fetch(`http://127.0.0.1:${LOCAL_PORT}/v1/models`); if (r.ok) return true; } catch { /* not running */ }
    const py = path.isAbsolute(settings.python) ? settings.python : path.join(root, settings.python);
    if (!fs.existsSync(py)) throw new Error('Python environment missing — run ./setup.sh');
    localProc = spawn(py, ['-m', 'mlx_lm', 'server', '--model', settings.storyModel, '--port', String(LOCAL_PORT), '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
    localProc.on('exit', () => { localProc = null; localReady = null; });
    for (let i = 0; i < 240; i++) {   // first start may download / load the model
      await new Promise((r) => setTimeout(r, 1000));
      try { const r = await fetch(`http://127.0.0.1:${LOCAL_PORT}/v1/models`); if (r.ok) return true; } catch { /* still loading */ }
    }
    throw new Error('The local story model did not start');
  })();
  try { return await localReady; } catch (e) { localReady = null; throw e; }
}
export function stopLocal() { if (localProc) localProc.kill(); }

export async function chat(messages, { root, settings, maxTokens = 400, temperature = 0.8, system, provider, key } = {}) {
  const sys = system || (messages[0]?.role === 'system' ? messages[0].content : '');
  const rest = messages.filter((m) => m.role !== 'system');
  const via = provider || (await backend(settings));
  if (via === 'anthropic') return anthropic(sys, rest, { key: key || (await getKey('anthropic')), model: settings.roomCloudModel || 'claude-sonnet-5-5', maxTokens, temperature });
  if (via === 'openai') return openai(sys, rest, { key: key || (await getKey('openai')), model: settings.roomOpenAIModel || 'gpt-5', maxTokens, temperature });
  await ensureLocal(root, settings);
  const r = await fetch(`http://127.0.0.1:${LOCAL_PORT}/v1/chat/completions`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'system', content: sys }, ...mergeRoles(rest)], max_tokens: maxTokens, temperature, top_p: 0.92 }),
    signal: AbortSignal.timeout(300000),
  });
  const d = await r.json(); if (!r.ok) throw new Error('Local AI: ' + JSON.stringify(d).slice(0, 200));
  return (d.choices?.[0]?.message?.content || '').trim();
}
async function anthropic(sys, rest, { key, model, maxTokens, temperature }) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: maxTokens, temperature, system: sys, messages: mergeRoles(rest) }),
    signal: AbortSignal.timeout(180000),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(r.status === 401 ? 'Claude: the API key was rejected — check it in Settings' : 'Claude: ' + (d.error?.message || r.status));
  return (d.content || []).map((c) => c.text || '').join('').trim();
}
// GPT models differ in what they accept (reasoning models refuse temperature, older ones refuse reasoning_effort):
// drop whatever a model rejects and remember it for that model
const OPENAI_DROP = new Map();
async function openai(sys, rest, { key, model, maxTokens, temperature }) {
  const drop = OPENAI_DROP.get(model) || new Set(); OPENAI_DROP.set(model, drop);
  for (let k = 0; k < 4; k++) {
    const body = { model, messages: [{ role: 'system', content: sys }, ...mergeRoles(rest)], max_completion_tokens: maxTokens + (drop.has('reasoning_effort') ? 0 : 4000), temperature, reasoning_effort: 'low' };   // reasoning tokens count toward the limit
    for (const f of drop) delete body[f];
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(240000) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) return (d.choices?.[0]?.message?.content || '').trim();
    const msg = d.error?.message || String(r.status), param = d.error?.param || (msg.match(/'(temperature|reasoning_effort|max_completion_tokens)'/) || [])[1];
    if (r.status === 400 && param && !drop.has(param)) { drop.add(param); continue; }
    throw new Error(r.status === 401 ? 'GPT: the API key was rejected — check it in Settings' : 'GPT: ' + msg);
  }
  throw new Error('GPT: the model refused every request shape');
}
// a tiny real call, so a wrong key is caught when it is saved
export async function testKey(provider, key, settings) {
  const out = await chat([{ role: 'user', content: 'Reply with the single word: ready' }], { settings, provider, key, maxTokens: 16, temperature: 0 });
  return out.slice(0, 40);
}
// the API wants alternating user/assistant turns
function mergeRoles(ms) {
  const out = [];
  for (const m of ms) { const role = m.role === 'assistant' ? 'assistant' : 'user'; if (out.length && out[out.length - 1].role === role) out[out.length - 1].content += '\n\n' + m.content; else out.push({ role, content: m.content }); }
  if (!out.length || out[0].role !== 'user') out.unshift({ role: 'user', content: 'Begin.' });
  return out;
}

export function firstJSON(text) {
  text = String(text).replace(/```(?:json)?/g, '');
  const order = text.indexOf('[') >= 0 && (text.indexOf('{') < 0 || text.indexOf('[') < text.indexOf('{')) ? ['[', '{'] : ['{', '['];   // whichever comes first
  for (const open of order) {
    let s = text.indexOf(open);
    while (s >= 0) {
      const close = open === '{' ? '}' : ']'; let depth = 0, inStr = false, esc = false;
      for (let i = s; i < text.length; i++) {
        const ch = text[i];
        if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
        if (ch === '"') inStr = true; else if (ch === open) depth++; else if (ch === close && --depth === 0) { try { return JSON.parse(text.slice(s, i + 1)); } catch { break; } }
      }
      s = text.indexOf(open, s + 1);
    }
  }
  return null;
}
export async function json(messages, opts = {}) {
  let last = '';
  for (let k = 0; k < 3; k++) {
    const msgs = k === 0 ? messages : [...messages, { role: 'assistant', content: last }, { role: 'user', content: 'That was not valid JSON. Reply again with ONLY the JSON, nothing else.' }];
    last = await chat(msgs, { ...opts, temperature: Math.max(0.3, (opts.temperature ?? 0.7) - k * 0.2) });
    const j = firstJSON(last); if (j) return j;
  }
  throw new Error('The AI did not return valid JSON. Try again.');
}
