#!/usr/bin/env bash
# Regenerate the live-data OG share-card images before a build so they reflect
# the current state. FAULT-TOLERANT: any step that fails leaves the existing
# committed image untouched — a deploy must never ship a blank/broken card.
#
#   public/lab/og-card.png        <- crop of the live /eyes camera frame
#   public/dragonfli/og-card.png  <- radar scope from the live ADS-B feed
#
# (public/turfy/og-card.png is a static teardown photo — not refreshed here.)
set -uo pipefail
cd "$(dirname "$0")/.."
BASE="${CARD_BASE:-https://bradley.io}"

echo "  ▸ Refreshing live card images..."

# --- lab: crop the live camera frame ---
if command -v convert >/dev/null 2>&1; then
  tmp="$(mktemp)"
  if curl -fsS --max-time 12 "$BASE/eyes.png" -o "$tmp" && [ -s "$tmp" ]; then
    if convert "$tmp" -resize 850x -gravity center -crop 840x458+0+15 +repage \
         -modulate 108,110 -quality 92 public/lab/og-card.png.tmp 2>/dev/null; then
      mv -f public/lab/og-card.png.tmp public/lab/og-card.png
      echo "    ✓ lab card refreshed"
    else
      echo "    ⚠ lab crop failed — keeping existing"
    fi
  else
    echo "    ⚠ /eyes fetch failed — keeping existing lab card"
  fi
  rm -f "$tmp" public/lab/og-card.png.tmp 2>/dev/null || true
else
  echo "    ⚠ imagemagick 'convert' not found — keeping existing lab card"
fi

# --- dragonfli: radar plot from live aircraft (self-guards; never overwrites on failure) ---
python3 scripts/gen_dragonfli_card.py 2>&1 | sed 's/^/    /' || true

exit 0
