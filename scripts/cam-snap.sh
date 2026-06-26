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

# One MJPEG frame, lightly re-encoded for consistent JPEG output.
ffmpeg -hide_banner -loglevel error -y \
  -f v4l2 -input_format mjpeg -video_size "$SIZE" -i "$DEV" \
  -frames:v 1 -q:v 3 "$TMP"

# Atomic publish — readers never see a half-written file.
mv -f "$TMP" "${CACHE_DIR}/latest.jpg"
trap - EXIT

BYTES=$(stat -c%s "${CACHE_DIR}/latest.jpg")
printf '{"ts":"%s","epoch":%s,"size":"%s","bytes":%s,"device":"Logitech BRIO"}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$(date +%s)" "$SIZE" "$BYTES" \
  > "${CACHE_DIR}/latest.json"
