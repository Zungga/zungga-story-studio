#!/usr/bin/env bash
# Opens the Zungga Story Studio on this Mac (pages with modules need a local server, not file://).
cd "$(dirname "$0")/.." && PORT=${PORT:-8790}
( sleep 1; open "http://localhost:$PORT/studio/${PAGE:-playground}.html" ) &
python3 -m http.server "$PORT"
