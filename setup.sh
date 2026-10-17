#!/usr/bin/env bash
# Zungga Story Studio — one-command setup for a new Mac (Apple Silicon).
#   ./setup.sh            installs everything and downloads the AI models (~9 GB, resumes if interrupted)
#   ./setup.sh --no-models   skip the model downloads (they also download on first use)
# Safe to run again: anything already installed is skipped.
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(pwd)"
say() { printf "\n\033[1;35m▸ %s\033[0m\n" "$*"; }
ok()  { printf "  \033[32m✓\033[0m %s\n" "$*"; }
warn(){ printf "  \033[33m!\033[0m %s\n" "$*"; }
die() { printf "\n\033[31m✗ %s\033[0m\n" "$*"; exit 1; }
MODELS=1; [[ "${1:-}" == "--no-models" ]] && MODELS=0

say "Checking this Mac"
[[ "$(uname -s)" == "Darwin" ]] || die "This setup is for macOS. (Rendering can work elsewhere, but voice + story AI need an Apple Silicon Mac — see README → Other computers.)"
[[ "$(uname -m)" == "arm64" ]] || die "Voice and story AI use MLX, which needs an Apple Silicon (M1/M2/M3/M4) Mac."
ok "macOS on Apple Silicon · $(( $(sysctl -n hw.memsize) / 1073741824 )) GB memory"
FREE_GB=$(df -g "$ROOT" | awk 'NR==2{print $4}')
(( FREE_GB >= 12 )) && ok "${FREE_GB} GB free" || warn "Only ${FREE_GB} GB free — models need about 9 GB"

say "Tools (Homebrew, Node, Python, ffmpeg)"
if ! command -v brew >/dev/null 2>&1; then
  warn "Homebrew not found — installing it (it may ask for your password)"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi
ok "Homebrew $(brew --version | head -1 | awk '{print $2}')"
need() { command -v "$1" >/dev/null 2>&1 || { warn "installing $2"; brew install "$2"; }; ok "$1 $($1 --version 2>&1 | head -1 | grep -oE '[0-9]+(\.[0-9]+)+' | head -1)"; }
need node node
need ffmpeg ffmpeg
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]'); (( NODE_MAJOR >= 20 )) || die "Node $NODE_MAJOR is too old — run: brew upgrade node"
# Python 3.11–3.14 (mlx wheels); prefer a brew python if the system one is missing/old
PY=""
for c in python3.13 python3.12 python3.14 python3.11 python3; do
  if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys; sys.exit(0 if (3,11) <= sys.version_info[:2] <= (3,14) else 1)' 2>/dev/null; then PY="$c"; break; fi
done
[[ -n "$PY" ]] || { warn "installing python@3.13"; brew install python@3.13; PY=python3.13; }
ok "Python $("$PY" -c 'import platform; print(platform.python_version())') ($PY)"

say "Python environment (.venv) with pinned libraries"
[[ -x .venv/bin/python ]] || "$PY" -m venv .venv
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt
.venv/bin/python -c "import mlx_audio, mlx_lm, transformers, numpy" && ok "mlx-audio, mlx-lm, transformers, numpy"

say "Node packages + headless Chrome (for rendering videos)"
npm install --no-audit --no-fund --silent
npx --yes playwright install chromium >/dev/null && ok "Playwright Chromium"

if (( MODELS )); then
  say "AI models (downloads resume if interrupted; stored in ~/.cache/huggingface)"
  STORY_MODEL=$(node -e 'try{const s=JSON.parse(require("fs").readFileSync("settings.local.json","utf8"));console.log(s.storyModel||"")}catch{console.log("")}')
  STORY_MODEL=${STORY_MODEL:-mlx-community/Qwen2.5-7B-Instruct-4bit}
  .venv/bin/python - "$STORY_MODEL" <<'PY'
import sys
from huggingface_hub import snapshot_download
models = [
    (sys.argv[1], 'Story AI'),
    ('mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit', 'Voice (Qwen3-TTS)'),
    ('mlx-community/whisper-base.en-mlx', 'Word timing (Whisper)'),
    ('openai/whisper-base.en', 'Whisper processor'),
]
for repo, label in models:
    print(f'  ↓ {label}: {repo}', flush=True)
    for attempt in range(4):
        try:
            snapshot_download(repo, allow_patterns=None if 'openai/' not in repo else ['*.json', '*.txt', '*.model'])
            print(f'  \033[32m✓\033[0m {label}', flush=True); break
        except Exception as e:
            print(f'  ! retrying ({e})', flush=True)
    else:
        sys.exit(f'Could not download {repo} — check the internet connection and run ./setup.sh again (it resumes).')
PY
else
  warn "Skipped model downloads (--no-models)"
fi

say "Voices"
MISSING=0
for d in selected-voices/*/; do
  n=$(basename "$d"); [[ -f "$d/voice.json" ]] || continue
  if [[ -f "$d/reference.wav" ]]; then ok "$n"; else warn "$n — reference.wav missing (copy it from your private backup, see README → Voices)"; MISSING=1; fi
done

mkdir -p projects
say "Done"
echo "  Start the studio:   ./start.sh"
echo "  Check everything:   ./doctor.sh"
(( MISSING )) && echo "  Voices without a recording can't make new voice lines until you copy their reference.wav." || true
