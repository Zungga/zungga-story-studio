#!/usr/bin/env bash
# Health check: is everything the studio needs installed and working? Prints a fix for anything that isn't.
#   ./doctor.sh
cd "$(dirname "$0")"
node --input-type=module -e '
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { execFileSync } from "node:child_process";
const root = process.cwd(), rows = []; let bad = 0;
const check = (label, ok, detail, fix, soft = false) => { rows.push([ok ? "\x1b[32m✓\x1b[0m" : soft ? "\x1b[33m!\x1b[0m" : "\x1b[31m✗\x1b[0m", label, detail, ok ? "" : fix]); if (!ok && !soft) bad++; };
const run = (c, a) => { try { return execFileSync(c, a, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 90000 }).trim(); } catch (e) { return null; } };
check("Apple Silicon Mac", process.platform === "darwin" && process.arch === "arm64", `${process.platform} ${process.arch}, ${Math.round(os.totalmem() / 2 ** 30)} GB`, "Voice + story AI need an M-series Mac (README → Other computers)");
check("Node.js 20+", +process.versions.node.split(".")[0] >= 20, process.versions.node, "brew install node");
const ff = run("ffmpeg", ["-version"]); check("ffmpeg", !!ff, ff ? ff.split("\n")[0].slice(0, 40) : "not found", "brew install ffmpeg");
const py = path.join(root, ".venv/bin/python"); check("Python environment", fs.existsSync(py), fs.existsSync(py) ? ".venv" : "missing", "./setup.sh");
if (fs.existsSync(py)) { const v = run(py, ["-c", "import mlx_audio, mlx_lm, transformers, numpy; print(\"ok\")"]); check("Python libraries", v === "ok", v === "ok" ? "mlx-audio, mlx-lm, transformers" : "import failed", ".venv/bin/pip install -r requirements.txt"); }
check("Playwright", fs.existsSync("node_modules/playwright"), fs.existsSync("node_modules/playwright") ? "installed" : "missing", "npm install && npx playwright install chromium");
const hub = process.env.HF_HOME ? path.join(process.env.HF_HOME, "hub") : path.join(os.homedir(), ".cache/huggingface/hub");
let story = "mlx-community/Qwen2.5-7B-Instruct-4bit"; try { story = JSON.parse(fs.readFileSync("settings.local.json", "utf8")).storyModel || story; } catch {}
const has = (m) => { const d = path.join(hub, "models--" + m.replace("/", "--")); if (!fs.existsSync(path.join(d, "snapshots"))) return false; const b = fs.existsSync(path.join(d, "blobs")) ? fs.readdirSync(path.join(d, "blobs")) : []; return fs.readdirSync(path.join(d, "snapshots")).some((s) => fs.readdirSync(path.join(d, "snapshots", s)).length > 1) && !b.some((x) => x.endsWith(".incomplete")); };
check("Story AI model", has(story), story, "./setup.sh (or it downloads on first use)", true);
check("Voice model", has("mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit"), "Qwen3-TTS 1.7B Base 8bit", "./setup.sh");
check("Word-timing model", has("mlx-community/whisper-base.en-mlx") && has("openai/whisper-base.en"), "Whisper base.en", "./setup.sh");
const voices = fs.readdirSync("selected-voices").filter((d) => fs.existsSync(`selected-voices/${d}/voice.json`)), noRef = voices.filter((d) => !fs.existsSync(`selected-voices/${d}/reference.wav`));
check("Voice recordings", !noRef.length, noRef.length ? `missing: ${noRef.join(", ")}` : `${voices.length} voices`, "copy selected-voices/<name>/reference.wav from your private backup (README → Voices)");
const df = run("df", ["-k", root]); const free = df ? +df.split("\n")[1].split(/\s+/)[3] / 2 ** 20 : 0;
check("Free disk (10 GB+)", free > 10, `${free.toFixed(0)} GB free`, "free up some space", true);
const port = process.env.PORT || 8790, up = run("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", `http://localhost:${port}/api/health`]);
check("Studio server", up === "200", up === "200" ? `running on :${port}` : "not running", "./start.sh", true);
for (const [s, l, d, f] of rows) console.log(` ${s} ${l.padEnd(22)} ${d}${f ? `\n     fix: \x1b[36m${f}\x1b[0m` : ""}`);
console.log(bad ? `\n${bad} thing(s) to fix.` : "\nAll good.");
process.exit(bad ? 1 : 0);
'
