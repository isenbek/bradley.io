#!/usr/bin/env python3
"""
motion_delta.py - illumination-robust motion trigger for a UVC webcam on a Pi.

Pipeline:
    lock camera -> grayscale + blur (+ downsample) -> normalize -> compare
    -> per-pixel/global threshold -> morph open -> blob-area gate -> trigger

Two NORMALIZE methods (remove lighting before the diff):
    "none"         passthrough
    "affine"       global gain+offset fit of frame -> reference (closed-form LSQ).
                   Cancels any change explainable by one scalar gain + offset.
                   Cheap; assumes roughly uniform lighting change.
    "divide_blur"  divide by a large-sigma gaussian, rescaled to luminance units.
                   Removes NON-uniform illumination (a shadow sweeping the frame)
                   that affine can't. Slightly more compute, more robust.

Two COMPARE backends (the decision rule):
    "frame_diff"   abs(curr - prev) vs a global threshold. Closest to your
                   current approach, just normalized + blob-gated.
    "ema_bg"       running EMA background model with per-pixel variance.
                   A pixel fires only when it beats its OWN noise floor (k*sigma),
                   so chronically noisy regions (screens, flicker) self-mute and
                   slow lighting drift is absorbed for free. Recommended.

All 6 (NORMALIZE x COMPARE) combinations are valid; A/B them with --normalize
and --compare on the same scene.

Deps:  sudo apt install python3-opencv v4l-utils     (or pip install opencv-python)
"""

import argparse
import os
import subprocess
import time
from datetime import datetime

import cv2
import numpy as np

# ----------------------------------------------------------------------------
# CONFIG
# ----------------------------------------------------------------------------
DEVICE_PATH  = "/dev/video0"   # for v4l2-ctl
DEVICE_INDEX = 0               # for cv2.VideoCapture
CAP_W, CAP_H = 1280, 720       # capture resolution (MJPG)

# --- camera lock (kills auto-exposure / auto-WB fighting the scene) ---
# UVC control names drift between kernels; we try every spelling and ignore misses.
# auto_exposure: 1 = Manual, 3 = Aperture-priority(auto).  exposure_auto: same idea, older.
AUTO_OFF = [
    ("auto_exposure", 1),
    ("exposure_auto", 1),
    ("white_balance_automatic", 0),
    ("white_balance_temperature_auto", 0),
    ("focus_automatic_continuous", 0),
    ("focus_auto", 0),
    ("backlight_compensation", 0),
]
# Fixed manual values once auto is off. Tune EXPOSURE to your room, then leave it.
MANUAL_SET = [
    ("exposure_time_absolute", 250),   # newer name; units are device-specific
    ("exposure_absolute", 250),        # older name
    ("white_balance_temperature", 4600),
    ("gain", 0),
]

# --- preprocessing ---
DOWNSAMPLE   = 2     # process at 1/N resolution for speed; 1 = full res
BLUR_KSIZE   = 5     # gaussian kernel (odd); kills speckle before the diff
DIVIDE_SIGMA = 25.0  # lowpass sigma for divide_blur (illumination scale)

# --- decision ---
DIFF_THRESH  = 18.0  # frame_diff: |delta| (0..255) above this = changed pixel
K_SIGMA      = 4.0   # ema_bg: pixel fires if residual > K_SIGMA * sigma
EMA_ALPHA    = 0.02  # background learning rate (smaller = slower to adapt)
VAR_FLOOR    = 9.0   # min per-pixel variance (sigma>=3); stops cold-pixel hypersensitivity
WARMUP       = 30    # ema_bg: frames to learn background before triggering

# --- blob gate (in PROCESSED/downsampled pixels) ---
MORPH_KSIZE   = 3
MIN_BLOB_AREA = 250  # smallest contiguous changed region that counts as motion

# --- screen masks (FULL-RES x,y,w,h rects to ignore). Use --mark-screens to fill. ---
SCREEN_MASKS = [
    # (470, 480, 320, 210),   # example: main monitor
    # (560, 560, 190, 150),   # example: laptop
]

# --- output ---
SAVE_DIR  = "triggers"   # triggered frames saved here (None to disable)
COOLDOWN  = 2.0          # seconds to suppress repeat triggers after one fires


# ----------------------------------------------------------------------------
# CAMERA
# ----------------------------------------------------------------------------
def _v4l2_set(device, name, value):
    subprocess.run(["v4l2-ctl", "-d", device, "-c", f"{name}={value}"],
                   capture_output=True, text=True)

def lock_camera(device):
    """Disable auto-exposure / auto-WB / auto-focus, then pin manual values.
    Names that don't exist on this driver fail silently - that's expected."""
    for name, val in AUTO_OFF:
        _v4l2_set(device, name, val)
    time.sleep(0.2)  # let mode switch settle before pinning manual values
    for name, val in MANUAL_SET:
        _v4l2_set(device, name, val)

def open_camera():
    cap = cv2.VideoCapture(DEVICE_INDEX, cv2.CAP_V4L2)
    cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*"MJPG"))
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  CAP_W)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAP_H)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # always grab the freshest frame
    if not cap.isOpened():
        raise RuntimeError(f"could not open camera index {DEVICE_INDEX}")
    return cap


# ----------------------------------------------------------------------------
# PROCESSING
# ----------------------------------------------------------------------------
def prepare(frame, normalize):
    """BGR frame -> float32 grayscale, blurred, downsampled, per-frame normalized."""
    g = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    if DOWNSAMPLE > 1:
        g = cv2.resize(g, None, fx=1 / DOWNSAMPLE, fy=1 / DOWNSAMPLE,
                       interpolation=cv2.INTER_AREA)
    g = cv2.GaussianBlur(g, (BLUR_KSIZE, BLUR_KSIZE), 0).astype(np.float32)

    if normalize in ("divide_blur", "both"):
        lp = cv2.GaussianBlur(g, (0, 0), DIVIDE_SIGMA)
        g = g * (float(lp.mean()) / (lp + 1e-3))  # flatten lighting, keep lum units
    return g

def affine_align(src, ref):
    """Return src mapped into ref's photometric space: a*src + b minimizing
    ||ref - (a*src+b)||^2. Cancels a global gain+offset lighting change."""
    s = src.ravel(); r = ref.ravel()
    sm = s.mean(); rm = r.mean()
    var = ((s - sm) ** 2).mean() + 1e-6
    a = ((s - sm) * (r - rm)).mean() / var
    b = rm - a * sm
    return a * src + b

def build_screen_mask(proc_shape):
    """Bool mask (True = ignore) at processed resolution from full-res rects."""
    mask = np.zeros(proc_shape, dtype=bool)
    s = DOWNSAMPLE
    for (x, y, w, h) in SCREEN_MASKS:
        x0, y0, x1, y1 = x // s, y // s, (x + w) // s, (y + h) // s
        mask[y0:y1, x0:x1] = True
    return mask

def blob_gate(changed_u8, kernel):
    """Morph-open then keep components >= MIN_BLOB_AREA. Returns (area, mask)."""
    m = cv2.morphologyEx(changed_u8, cv2.MORPH_OPEN, kernel)
    n, _, stats, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    if n <= 1:
        return 0, m
    areas = stats[1:, cv2.CC_STAT_AREA]            # drop background label 0
    return int(areas[areas >= MIN_BLOB_AREA].sum()), m


# ----------------------------------------------------------------------------
# UTIL: interactive screen-rect picker
# ----------------------------------------------------------------------------
def mark_screens():
    cap = open_camera()
    ok, frame = cap.read()
    cap.release()
    if not ok:
        raise RuntimeError("no frame for --mark-screens")
    rois = cv2.selectROIs("drag screen rects, SPACE/ENTER to add, ESC to finish",
                          frame, showCrosshair=False)
    cv2.destroyAllWindows()
    print("\nSCREEN_MASKS = [")
    for (x, y, w, h) in rois:
        print(f"    ({x}, {y}, {w}, {h}),")
    print("]")


# ----------------------------------------------------------------------------
# MAIN LOOP
# ----------------------------------------------------------------------------
def run(args):
    if SAVE_DIR:
        os.makedirs(SAVE_DIR, exist_ok=True)
    lock_camera(DEVICE_PATH)
    cap = open_camera()
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (MORPH_KSIZE, MORPH_KSIZE))

    prev = None            # frame_diff reference
    bg_mean = bg_var = None  # ema_bg state
    screen_mask = None
    frame_idx = 0
    last_trigger = 0.0

    print(f"[motion_delta] normalize={args.normalize} compare={args.compare} "
          f"down={DOWNSAMPLE} -- ctrl-C to stop")

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                time.sleep(0.05)
                continue
            frame_idx += 1
            g = prepare(frame, args.normalize)
            if screen_mask is None:
                screen_mask = build_screen_mask(g.shape)

            # -------- compare --------
            if args.compare == "frame_diff":
                if prev is None:
                    prev = g
                    continue
                ref = prev
                cur = affine_align(g, ref) if args.normalize in ("affine", "both") else g
                delta = np.abs(cur - ref)
                changed = delta > DIFF_THRESH
                prev = g
                ready = True
            else:  # ema_bg
                if bg_mean is None:
                    bg_mean = g.copy()
                    bg_var = np.full_like(g, VAR_FLOOR)
                    continue
                cur = affine_align(g, bg_mean) if args.normalize in ("affine", "both") else g
                resid = cur - bg_mean
                var = np.maximum(bg_var, VAR_FLOOR)
                changed = (resid * resid) > (K_SIGMA * K_SIGMA) * var
                # update background AFTER deciding
                bg_mean = (1 - EMA_ALPHA) * bg_mean + EMA_ALPHA * cur
                bg_var = (1 - EMA_ALPHA) * bg_var + EMA_ALPHA * (resid * resid)
                ready = frame_idx > WARMUP

            # -------- mask screens, gate blobs --------
            changed[screen_mask] = False
            area, gated = blob_gate(changed.astype(np.uint8) * 255, kernel)

            triggered = ready and area >= MIN_BLOB_AREA
            now = time.time()
            if triggered and (now - last_trigger) >= COOLDOWN:
                last_trigger = now
                ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print(f"[TRIGGER] {ts}  area={area}px")
                if SAVE_DIR:
                    cv2.imwrite(f"{SAVE_DIR}/trig_{int(now)}.jpg", frame)
                on_trigger(frame, area)  # <-- your event hook

            if args.show:
                dbg = cv2.applyColorMap(gated, cv2.COLORMAP_HOT)
                cv2.putText(dbg, f"area={area}", (8, 22),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
                cv2.imshow("delta", dbg)
                if cv2.waitKey(1) & 0xFF == 27:
                    break
    except KeyboardInterrupt:
        pass
    finally:
        cap.release()
        cv2.destroyAllWindows()


def on_trigger(frame, area):
    """Replace with whatever the event should do (POST, GPIO, enqueue, etc.)."""
    pass


def parse_args():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--normalize", choices=["none", "affine", "divide_blur", "both"],
                   default="both")
    p.add_argument("--compare", choices=["frame_diff", "ema_bg"], default="ema_bg")
    p.add_argument("--show", action="store_true", help="debug window (needs a display)")
    p.add_argument("--probe", action="store_true", help="dump v4l2 controls and exit")
    p.add_argument("--mark-screens", action="store_true",
                   help="interactively pick screen rects, print config, exit")
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.probe:
        subprocess.run(["v4l2-ctl", "-d", DEVICE_PATH, "-L"])
    elif args.mark_screens:
        mark_screens()
    else:
        run(args)
