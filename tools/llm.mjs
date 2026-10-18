// One door to the language model for the Writers' Room.
//   cloud: Claude via the Anthropic API when ANTHROPIC_API_KEY is set in the environment (never stored in the project)
//   local: mlx-lm's OpenAI-style server on this Mac (started on first use, kept running)
// chat(messages, opts) → text        json(messages, opts) → parsed object (retries + repair)
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const LOCAL_PORT = 8799;
let localProc = null, localReady = null;

export function backend(settings) {
  const want = settings.roomAI || 'local';
  if (want === 'cloud' && process.env.ANTHROPIC_API_KEY) return 'cloud';
  return 'local';
}
export const cloudAvailable = () => !!process.env.ANTHROPIC_API_KEY;

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

export async function chat(messages, { root, settings, maxTokens = 400, temperature = 0.8, system } = {}) {
  const sys = system || (messages[0]?.role === 'system' ? messages[0].content : '');
  const rest = messages.filter((m) => m.role !== 'system');
  if (backend(settings) === 'cloud') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: settings.roomCloudModel || 'claude-sonnet-5-5', max_tokens: maxTokens, temperature, system: sys, messages: mergeRoles(rest) }),
      signal: AbortSignal.timeout(180000),
    });
    const d = await r.json(); if (!r.ok) throw new Error('Cloud AI: ' + (d.error?.message || r.status));
    return d.content.map((c) => c.text || '').join('').trim();
  }
  await ensureLocal(root, settings);
  const r = await fetch(`http://127.0.0.1:${LOCAL_PORT}/v1/chat/completions`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'system', content: sys }, ...mergeRoles(rest)], max_tokens: maxTokens, temperature, top_p: 0.92 }),
    signal: AbortSignal.timeout(300000),
  });
  const d = await r.json(); if (!r.ok) throw new Error('Local AI: ' + JSON.stringify(d).slice(0, 200));
  return (d.choices?.[0]?.message?.content || '').trim();
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
