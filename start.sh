#!/usr/bin/env bash
# Start Zungga Story Studio and open it in the browser.
#   ./start.sh              → http://localhost:8790/studio/app.html
#   PORT=9000 ./start.sh    → another port
#   ./start.sh --no-open    → don't open the browser
set -euo pipefail
cd "$(dirname "$0")"
PORT=${PORT:-8790}
[[ -d node_modules ]] || { echo "First run? Do ./setup.sh first."; exit 1; }
if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Something is already running on port $PORT — opening it (stop it, or use PORT=9000 ./start.sh)."
  [[ "${1:-}" == "--no-open" ]] || open "http://localhost:$PORT/studio/app.html"; exit 0
fi
[[ "${1:-}" == "--no-open" ]] || ( sleep 1.2; open "http://localhost:$PORT/studio/app.html" ) &
exec env PORT="$PORT" node tools/server.mjs
