#!/usr/bin/env bash
# Speak a line in a saved voice, exactly reproduced by cloning that voice's reference clip.
#   ./selected-voices/speak.sh girl "Your line here" out-name
# Needs: python3 -m venv .venv && .venv/bin/pip install mlx-audio==0.5.8   (run once in the project folder)
set -euo pipefail
cd "$(dirname "$0")/.."
VOICE="$1"; TEXT="$2"; OUT="${3:-line}"
CFG="selected-voices/$VOICE/voice.json"
MODEL=$(python3 -c "import json;print(json.load(open('$CFG'))['reproduce']['model'])")
REFTEXT=$(python3 -c "import json;print(json.load(open('$CFG'))['reproduce']['ref_text'])")
PY="${PYTHON:-.venv/bin/python}"
"$PY" -m mlx_audio.tts.generate --model "$MODEL" --lang_code english \
  --ref_audio "selected-voices/$VOICE/reference.wav" --ref_text "$REFTEXT" \
  --text "$TEXT" --output_path "selected-voices/$VOICE/out" --file_prefix "$OUT"
