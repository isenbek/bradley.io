# Illumination-robust motion-delta trigger

Goal: snap frames, diff consecutive ones, fire an event on enough change — without
false triggers from lighting shifts and screens.

## Why not "increase contrast on the delta"

The delta is dark because most of the frame genuinely didn't change — that's correct.
Contrast-stretching it multiplies real motion **and** the lighting residual + sensor/JPEG
speckle by the same factor. SNR is unchanged; you've just made the threshold harder to
place. All the leverage is **upstream of the subtraction** (kill lighting before you diff)
or **in the decision rule** (per-pixel adaptive threshold + blob gating) — never on the
delta itself.

The two failure causes need different fixes:

| Cause | Nature | Fix |
|---|---|---|
| Lighting shift (global lift in your img 5) | photometric — scene unchanged | normalize before diff |
| Screens / monitors | real pixel change | mask region or adaptive per-pixel threshold |

No brightness trick fixes screens; no mask fixes lighting. You want both.

## Pipeline

```
lock camera  ->  grayscale + blur (+ downsample)  ->  normalize  ->  compare
            ->  per-pixel/global threshold  ->  morph-open  ->  blob-area gate  ->  trigger
```

### 1. Lock the camera (biggest single win, zero compute)

If auto-exposure (AGC) and auto-white-balance are on, the webcam re-meters every time a
screen flickers or something bright enters frame — a whole-frame photometric delta you
then have to fight in software. Disable both. Control names drift between kernels, so the
script tries every spelling and ignores misses; verify with `--probe`:

```bash
python3 motion_delta.py --probe        # dump v4l2 controls, confirm what stuck
```

`auto_exposure=1` (manual) / `auto_exposure=3` (auto) on UVC; older drivers use
`exposure_auto`. WB is `white_balance_automatic` (newer) or
`white_balance_temperature_auto` (older). Tune `exposure_time_absolute` to your room once,
then leave it. This alone likely kills most of your false triggers.

### 2. Normalize before diffing

Two methods, **validated on your sample frame** with synthetic lighting changes
(% of pixels flagged changed; lower = better when there's no real motion):

| normalize | uniform gain+offset | non-uniform light (ramp+spot) |
|---|---|---|
| `none` | **100.00%** (your bug) | 0.29% |
| `affine` | **0.00%** | 0.44% |
| `divide_blur` | 99.74% | **0.00%** |
| `both` (recommended) | **0.00%** | **0.00%** |

- **`affine`** — closed-form least-squares fit of `a·frame + b` to the reference. Cancels
  any change explainable by one global gain + offset. Perfect on a *uniform* lift (your
  img 5 looks close to this), useless on spatially-varying light.
- **`divide_blur`** — divide by a large-σ gaussian, rescaled to luminance units.
  Illumination is low spatial frequency, scene texture is high; dividing out the lowpass
  removes *non-uniform* lighting (a shadow sweeping half the frame) but leaves a uniform
  *additive* offset largely intact.
- **`both`** — divide_blur then affine. Composing them zeros **both** failure modes
  (0.00% / 0.00% above). This is the default. Cost is one extra blur + a cheap regression
  per frame.

Real-motion sanity check (intruder blob, no lighting change): all modes preserve the
localized change — normalization removes lighting, not motion.

### 3. Compare (the decision rule)

- **`frame_diff`** — `abs(curr − prev)` vs a global threshold `DIFF_THRESH`. Closest to your
  current setup, now normalized + blob-gated.
- **`ema_bg`** (recommended) — running EMA background model with **per-pixel variance**.
  A pixel fires only when its residual beats *its own* historical noise floor
  (`K_SIGMA·σ`). Chronically noisy regions — screens, a flickering light — raise their own
  bar and self-mute, no manual masking. Slow lighting drift is absorbed into the background
  for free. `WARMUP` frames learn the model before triggering is armed.

### 4. Reject speckle, require a real blob

Light blur before the diff kills the sparse compression/sensor speckle visible in your
delta samples. Then morphological open + connected-components: only a contiguous region
≥ `MIN_BLOB_AREA` fires. A single hot pixel never triggers; a person-sized region does.

### 5. Screen masking (optional, complements ema_bg)

`ema_bg` already suppresses static screens via their high per-pixel variance. For a hard
guarantee, add rectangles to `SCREEN_MASKS` — zeroed in the delta before the blob gate.
Pick them interactively:

```bash
python3 motion_delta.py --mark-screens   # drag rects, SPACE to add, ESC to finish
                                          # prints a SCREEN_MASKS = [...] block to paste
```

Breaks only if the camera moves. (`ema_bg` doesn't — it re-learns.)

## Quick start

```bash
sudo apt install python3-opencv v4l-utils
python3 motion_delta.py                       # defaults: normalize=both, compare=ema_bg
```

Wire your event into `on_trigger(frame, area)` at the bottom (POST, GPIO, enqueue…).
Triggered frames are saved to `triggers/` for tuning.

## A/B on your actual scene

Same scene, swap one knob at a time:

```bash
python3 motion_delta.py --normalize affine      --compare frame_diff --show
python3 motion_delta.py --normalize divide_blur --compare ema_bg     --show
python3 motion_delta.py --normalize both        --compare ema_bg     --show
```

`--show` draws the gated delta (needs a display; drop it over SSH and watch the
`[TRIGGER]` log + `triggers/` instead).

## Tuning cheatsheet

| Symptom | Knob |
|---|---|
| Still triggers on lights | confirm `--probe` shows auto-exposure/WB off; use `--normalize both` |
| Screens still fire | add `SCREEN_MASKS`; or raise `K_SIGMA`; or lower `EMA_ALPHA` (slower adapt) |
| Misses slow/small motion | lower `MIN_BLOB_AREA`; lower `K_SIGMA`/`DIFF_THRESH`; raise resolution (`DOWNSAMPLE=1`) |
| Too twitchy on speckle | raise `BLUR_KSIZE`; raise `MIN_BLOB_AREA` |
| Real motion gets "learned away" before firing | lower `EMA_ALPHA` |
| CPU bound on the Pi | raise `DOWNSAMPLE`; `ema_bg` + `both` is still cheap at 1/2 res |

`K_SIGMA·σ` with `VAR_FLOOR` (σ ≥ 3) means a pixel needs ~`K_SIGMA·3 = 12` levels of change
minimum even in dead-quiet regions — that floor is what stops cold pixels from being
hypersensitive. Adjust `VAR_FLOOR` if your sensor is noisier/cleaner than that.
