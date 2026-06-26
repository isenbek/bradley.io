#!/usr/bin/env bash
# cam-snap.sh — grab a single frame from the attached camera and publish it
# atomically to the cache dir. Invoked once per minute by bradley-cam.timer.
#
#   CAM_CACHE_DIR  where latest.jpg / latest.json are written (default /var/lib/bradley-cam)
#   CAM_DEVICE     v4l2 capture node (default /dev/video0 — the Logitech BRIO)
#   CAM_SIZE       capture resolution (default 1280x720)
set -euo pipefail

CACHE_DIR="${CAM_CACHE_DIR:-/var/lib/bradley-cam}"
DEV="${CAM_DEVICE:-/dev/video0}"
SIZE="${CAM_SIZE:-1280x720}"

mkdir -p "$CACHE_DIR"
TMP="${CACHE_DIR}/.latest.tmp.jpg"
trap 'rm -f "$TMP"' EXIT

TMP_PNG="${CACHE_DIR}/.latest.tmp.png"
TS_FILE="${CACHE_DIR}/.stamp.txt"
trap 'rm -f "$TMP" "$TMP_PNG" "$TS_FILE"' EXIT

# One MJPEG frame, lightly re-encoded for consistent JPEG output.
ffmpeg -hide_banner -loglevel error -y \
  -f v4l2 -input_format mjpeg -video_size "$SIZE" -i "$DEV" \
  -frames:v 1 -q:v 3 "$TMP"

# Serialize the same frame as a PNG (file→file, no second camera open) with a
# faint timestamp baked into the bottom-right corner. The JPEG stays clean — the
# live /eyes page draws its own HTML timestamp HUD over it. textfile= avoids the
# drawtext colon-escaping dance for the "HH:MM:SS" string.
STAMP="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"
printf '%s' "$STAMP" > "$TS_FILE"
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
ffmpeg -hide_banner -loglevel error -y -i "$TMP" \
  -vf "drawtext=fontfile=${FONT}:textfile=${TS_FILE}:fontsize=18:fontcolor=white@0.42:shadowcolor=black@0.45:shadowx=1:shadowy=1:x=w-tw-16:y=h-th-14" \
  "$TMP_PNG"

# Atomic publish — readers never see a half-written file.
mv -f "$TMP" "${CACHE_DIR}/latest.jpg"
mv -f "$TMP_PNG" "${CACHE_DIR}/latest.png"
trap - EXIT

BYTES=$(stat -c%s "${CACHE_DIR}/latest.jpg")
printf '{"ts":"%s","epoch":%s,"size":"%s","bytes":%s,"device":"Logitech BRIO"}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$(date +%s)" "$SIZE" "$BYTES" \
  > "${CACHE_DIR}/latest.json"
