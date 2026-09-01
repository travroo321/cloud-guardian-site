#!/usr/bin/env bash
# Render a filled proposal HTML file to PDF using headless Chromium.
#
#   ./render.sh proposal.html Rivertown_Health_IT_Proposal.pdf
#
# Chromium is used directly rather than through a library so the skill has no
# npm or pip dependency to install and nothing to keep in sync.
set -euo pipefail

SRC="${1:?usage: render.sh <input.html> <output.pdf>}"
OUT="${2:?usage: render.sh <input.html> <output.pdf>}"

find_chrome() {
  # Playwright's bundled build first (present in Claude Code sandboxes), then
  # whatever the machine has on PATH.
  for c in /opt/pw-browsers/chromium-*/chrome-linux/chrome; do
    [ -x "$c" ] && { echo "$c"; return; }
  done
  for c in google-chrome chromium chromium-browser \
           "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
    command -v "$c" >/dev/null 2>&1 && { command -v "$c"; return; }
    [ -x "$c" ] && { echo "$c"; return; }
  done
  echo ""
}

CHROME="$(find_chrome)"
if [ -z "$CHROME" ]; then
  echo "No Chromium/Chrome found. Install one, or open the HTML and print to PDF by hand." >&2
  exit 1
fi

SRC_ABS="$(cd "$(dirname "$SRC")" && pwd)/$(basename "$SRC")"
PROFILE="$(mktemp -d)"
trap 'rm -rf "$PROFILE"' EXIT

"$CHROME" \
  --headless \
  --disable-gpu \
  --no-sandbox \
  --no-pdf-header-footer \
  --user-data-dir="$PROFILE" \
  --print-to-pdf="$OUT" \
  --virtual-time-budget=10000 \
  "file://$SRC_ABS" 2>/dev/null

if [ ! -s "$OUT" ]; then
  echo "Chromium produced no PDF. Check the HTML for a syntax error." >&2
  exit 1
fi
echo "Wrote $OUT ($(du -h "$OUT" | cut -f1))"
