#!/usr/bin/env bash
# Regenerate the live-data OG share-card images before a build so they reflect
# the current state. FAULT-TOLERANT: any step that fails leaves the existing
# committed image untouched. A deploy must never ship a blank/broken card.
#
#   public/lab/og-card.png        <- crop of the live /eyes camera frame
#   public/dragonfli/og-card.png  <- radar scope from the live ADS-B feed
#
# (public/turfy/og-card.png is a static teardown photo, not refreshed here.)
#
# THE LAB CARD ONLY REFRESHES FROM A LIVE FRAME (2026-10-02). The camera went
# offline on 2026-09-11 and /eyes.png kept serving that last frame, so every
# deploy re-encoded the same three-week-old picture and committed a fresh
# 681 KB copy of it. Now the step asks /api/eyes/meta when the frame was
# captured and skips, saying so, unless it is younger than CARD_EYES_MAX_AGE_S.
# If the capture time cannot be read, it also skips: no proof the frame is
# live means no refresh.
#
# Overrides (all optional; the defaults are what deploy.sh uses):
#   CARD_BASE             site to fetch from            (https://bradley.io)
#   CARD_EYES_META        capture-time endpoint         ($CARD_BASE/api/eyes/meta)
#   CARD_EYES_MAX_AGE_S   oldest frame worth cropping   (900 = 15 min; the
#                         camera timer fires every 60 s when it is running)
#   CARD_LAB_OUT          where the lab card is written (public/lab/og-card.png)
#   CARD_SKIP_DRAGONFLI   set to 1 to skip the dragonfli card (for testing)
set -uo pipefail
cd "$(dirname "$0")/.."
BASE="${CARD_BASE:-https://bradley.io}"
EYES_META_URL="${CARD_EYES_META:-$BASE/api/eyes/meta}"
EYES_MAX_AGE_S="${CARD_EYES_MAX_AGE_S:-900}"
LAB_OUT="${CARD_LAB_OUT:-public/lab/og-card.png}"
case "$EYES_MAX_AGE_S" in
  ''|*[!0-9]*) EYES_MAX_AGE_S=900 ;;
esac

echo "  ▸ Refreshing live card images..."

# Sets LAB_EPOCH (capture time, unix seconds) and LAB_AGE (seconds since then).
# Returns non-zero, leaving both empty, if the capture time cannot be read.
LAB_EPOCH=""
LAB_AGE=""
lab_frame_age() {
  local meta epoch now
  meta="$(curl -fsS --max-time 8 "$EYES_META_URL" 2>/dev/null)" || return 1
  epoch="$(printf '%s' "$meta" \
    | sed -n 's/.*"epoch"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p' \
    | head -n 1)"
  [ -n "$epoch" ] || return 1
  now="$(date +%s)"
  LAB_EPOCH="$epoch"
  LAB_AGE=$(( now - epoch ))
  return 0
}

# 93784 -> "1 d 2 h", 4000 -> "1 h 6 min", 59 -> "59 s"
human_age() {
  local s="$1"
  if   [ "$s" -ge 86400 ]; then echo "$(( s / 86400 )) d $(( (s % 86400) / 3600 )) h"
  elif [ "$s" -ge 3600 ];  then echo "$(( s / 3600 )) h $(( (s % 3600) / 60 )) min"
  elif [ "$s" -ge 60 ];    then echo "$(( s / 60 )) min"
  else                          echo "${s} s"
  fi
}

# --- lab: crop the live camera frame, only if the frame really is live ---
refresh_lab_card() {
  if ! command -v convert >/dev/null 2>&1; then
    echo "    ⚠ imagemagick 'convert' not found: keeping existing lab card"
    return 0
  fi
  if ! lab_frame_age; then
    echo "    ⚠ lab card SKIPPED: could not read the frame's capture time from $EYES_META_URL"
    echo "      (no proof the camera is live). Keeping the existing card; nothing new to commit."
    return 0
  fi
  local captured
  captured="$(date -u -d "@$LAB_EPOCH" '+%Y-%m-%d %H:%M UTC' 2>/dev/null || echo "epoch $LAB_EPOCH")"
  if [ "$LAB_AGE" -lt 0 ]; then
    echo "    ⚠ lab card SKIPPED: the frame's capture time ($captured) is in the future."
    echo "      Keeping the existing card; nothing new to commit."
    return 0
  fi
  if [ "$LAB_AGE" -gt "$EYES_MAX_AGE_S" ]; then
    echo "    ⚠ lab card SKIPPED: the /eyes frame is stale. Captured $captured, $(human_age "$LAB_AGE") ago;"
    echo "      the limit is $(human_age "$EYES_MAX_AGE_S"). The camera is not live. Keeping the existing card; nothing new to commit."
    return 0
  fi

  local tmp
  tmp="$(mktemp)"
  if curl -fsS --max-time 12 "$BASE/eyes.png" -o "$tmp" && [ -s "$tmp" ]; then
    mkdir -p "$(dirname "$LAB_OUT")"
    if convert "$tmp" -resize 850x -gravity center -crop 840x458+0+15 +repage \
         -modulate 108,110 -quality 92 "png:$LAB_OUT.tmp" 2>/dev/null; then
      mv -f "$LAB_OUT.tmp" "$LAB_OUT"
      echo "    ✓ lab card refreshed (frame captured $captured, $(human_age "$LAB_AGE") ago)"
    else
      echo "    ⚠ lab crop failed: keeping existing"
    fi
  else
    echo "    ⚠ /eyes fetch failed: keeping existing lab card"
  fi
  rm -f "$tmp" "$LAB_OUT.tmp" 2>/dev/null || true
  return 0
}
refresh_lab_card || true

# --- dragonfli: radar plot from live aircraft (self-guards; never overwrites on failure) ---
if [ "${CARD_SKIP_DRAGONFLI:-0}" = "1" ]; then
  echo "    (dragonfli card skipped: CARD_SKIP_DRAGONFLI=1)"
else
  python3 scripts/gen_dragonfli_card.py 2>&1 | sed 's/^/    /' || true
fi

exit 0
