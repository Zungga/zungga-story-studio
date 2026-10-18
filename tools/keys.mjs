// Cloud AI keys (Anthropic / OpenAI) — never written into the project folder or git.
//   1. environment: ANTHROPIC_API_KEY / OPENAI_API_KEY (always wins)
//   2. macOS Keychain (service "zungga-story-studio.<provider>"); on other systems ~/.config/zungga-story-studio/keys.json (chmod 600)
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const PROVIDERS = { anthropic: { env: 'ANTHROPIC_API_KEY', label: 'Claude (Anthropic)' }, openai: { env: 'OPENAI_API_KEY', label: 'GPT (OpenAI)' } };
const MAC = process.platform === 'darwin', ACCOUNT = 'zungga-story-studio';
const FILE = path.join(os.homedir(), '.config', 'zungga-story-studio', 'keys.json');
const cache = new Map();   // provider → key (loaded once, kept in memory)

const run = (args) => new Promise((res) => execFile('security', args, (err, out) => res(err ? null : String(out).trim())));
const readFile = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; } };
function writeFile(o) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(o, null, 1), { mode: 0o600 }); fs.chmodSync(FILE, 0o600); }

async function stored(p) {
  if (cache.has(p)) return cache.get(p);
  const k = MAC ? await run(['find-generic-password', '-a', ACCOUNT, '-s', `${ACCOUNT}.${p}`, '-w']) : readFile()[p] || null;
  cache.set(p, k || null); return k || null;
}
export async function getKey(p) { return process.env[PROVIDERS[p].env] || (await stored(p)); }
export async function setKey(p, key) {
  if (!PROVIDERS[p]) throw new Error('Unknown provider');
  if (MAC) { if ((await run(['add-generic-password', '-U', '-a', ACCOUNT, '-s', `${ACCOUNT}.${p}`, '-l', `Zungga Story Studio — ${PROVIDERS[p].label}`, '-w', key])) == null) throw new Error('Could not save the key in the Keychain'); }
  else writeFile({ ...readFile(), [p]: key });
  cache.set(p, key);
}
export async function removeKey(p) {
  if (MAC) await run(['delete-generic-password', '-a', ACCOUNT, '-s', `${ACCOUNT}.${p}`]); else { const o = readFile(); delete o[p]; writeFile(o); }
  cache.set(p, null);
}
// what the UI may see: never the key itself
export async function status() {
  const out = {};
  for (const [p, d] of Object.entries(PROVIDERS)) {
    const env = process.env[d.env], k = env || (await stored(p));
    out[p] = { set: !!k, source: env ? 'environment' : k ? (MAC ? 'Keychain' : 'local file') : null, hint: k ? '…' + k.slice(-4) : '', label: d.label };
  }
  return out;
}
export const hasAny = async () => !!((await getKey('anthropic')) || (await getKey('openai')));
