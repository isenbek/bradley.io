#!/usr/bin/env bash
# cam-snap.sh — grab a single frame from one of the attached cameras and publish
# it atomically to the cache dir. Invoked once per minute by bradley-cam.timer,
# round-robin cycling whichever cameras are plugged in (a new frame from the
# "next" camera each run).
#
#   CAM_CACHE_DIR  where latest.{jpg,png,json} are written (default /var/lib/bradley-cam)
#   CAM_DEVICES    optional ':'-separated device list to override auto-detect
#                  (default: each camera's primary capture node via /dev/v4l/by-id)
#   CAM_MAXW       cap the captured width; pick the largest MJPEG size at or below
#                  it per camera (default 1280 — keeps the BRIO at 720p, etc.)
set -euo pipefail

CACHE_DIR="${CAM_CACHE_DIR:-/var/lib/bradley-cam}"
MAXW="${CAM_MAXW:-1280}"
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

mkdir -p "$CACHE_DIR"
TMP="${CACHE_DIR}/.latest.tmp.jpg"
TMP_PNG="${CACHE_DIR}/.latest.tmp.png"
TS_FILE="${CACHE_DIR}/.stamp.txt"
trap 'rm -f "$TMP" "$TMP_PNG" "$TS_FILE"' EXIT

# ── Discover cameras ────────────────────────────────────────────────────────
# One stable node per physical camera: the "-video-index0" by-id symlink is the
# primary capture interface and survives replug / renumber (it carries a serial).
declare -a DEVICES
if [[ -n "${CAM_DEVICES:-}" ]]; then
  IFS=':' read -r -a DEVICES <<< "$CAM_DEVICES"
else
  for s in /dev/v4l/by-id/*-video-index0; do
    [[ -e "$s" ]] || continue
    # keep only true capture nodes
    if v4l2-ctl -d "$s" --all 2>/dev/null | grep -A4 "Device Caps" | grep -qi "Video Capture"; then
      DEVICES+=("$s")
    fi
  done
fi
[[ ${#DEVICES[@]} -gt 0 ]] || { echo "cam-snap: no capture devices found" >&2; exit 1; }

# ── Pick this run's camera (round-robin) ────────────────────────────────────
IDX_FILE="${CACHE_DIR}/.camidx"
PREV=$(cat "$IDX_FILE" 2>/dev/null || echo -1)
[[ "$PREV" =~ ^-?[0-9]+$ ]] || PREV=-1
IDX=$(( (PREV + 1) % ${#DEVICES[@]} ))
echo "$IDX" > "$IDX_FILE"
DEV="${DEVICES[$IDX]}"

# Friendly camera name from the v4l2 card type.
CARD=$(v4l2-ctl -d "$DEV" -D 2>/dev/null | grep -i 'Card type' | sed 's/.*: //' | tr -d '\r')
case "$CARD" in
  *BRIO*) NAME="Logitech BRIO" ;;
  *0990*) NAME="Logitech QuickCam Pro 9000" ;;
  "")     NAME="camera ${IDX}" ;;
  *)      NAME="$CARD" ;;
esac

# Largest MJPEG size at or below MAXW (fallback: largest MJPEG offered).
SIZES=$(v4l2-ctl -d "$DEV" --list-formats-ext 2>/dev/null | awk '
  /\[[0-9]+\]:/ { mjpg = ($0 ~ /MJPG/) }
  mjpg && /Size: Discrete/ { print $3 }')
CAP=$(echo "$SIZES" | awk -Fx -v max="$MAXW" 'NF==2 && $1<=max' | sort -t x -k1,1n | tail -1)
[[ -n "$CAP" ]] || CAP=$(echo "$SIZES" | awk -Fx 'NF==2' | sort -t x -k1,1n | tail -1)
[[ -n "$CAP" ]] || CAP="640x480"

# ── Capture ─────────────────────────────────────────────────────────────────
# select=gte(n,4) discards the first few frames so auto-exposure settles before
# we keep one — older UVC cams (the QuickCam) hand back a dark first frame.
ffmpeg -hide_banner -loglevel error -y \
  -f v4l2 -input_format mjpeg -video_size "$CAP" -i "$DEV" \
  -vf "select=gte(n\,4)" -frames:v 1 -q:v 3 "$TMP"

# Serialize the same frame as a PNG (file→file, no second camera open) with a
# faint "bradley.io · <timestamp>" caption baked into the bottom-right corner.
# The JPEG stays clean — the live /eyes page draws its own HTML timestamp HUD.
STAMP="bradley.io · $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
printf '%s' "$STAMP" > "$TS_FILE"
ffmpeg -hide_banner -loglevel error -y -i "$TMP" \
  -vf "drawtext=fontfile=${FONT}:textfile=${TS_FILE}:fontsize=18:fontcolor=white@0.42:shadowcolor=black@0.45:shadowx=1:shadowy=1:x=w-tw-16:y=h-th-14" \
  "$TMP_PNG"

# Atomic publish — readers never see a half-written file.
mv -f "$TMP" "${CACHE_DIR}/latest.jpg"
mv -f "$TMP_PNG" "${CACHE_DIR}/latest.png"
trap 'rm -f "$TS_FILE"' EXIT

BYTES=$(stat -c%s "${CACHE_DIR}/latest.jpg")
# JSON-escape the camera name (it can contain quotes/backslashes).
NAME_ESC=$(printf '%s' "$NAME" | sed 's/\\/\\\\/g; s/"/\\"/g')
printf '{"ts":"%s","epoch":%s,"size":"%s","bytes":%s,"device":"%s","camIndex":%s,"camCount":%s}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$(date +%s)" "$CAP" "$BYTES" "$NAME_ESC" "$IDX" "${#DEVICES[@]}" \
  > "${CACHE_DIR}/latest.json"
