# prime-orchestra.html — Technical README

Single-file, zero-dependency HTML/JS/canvas visualization of the Riemann explicit
formula. No build step, no network calls; open in any browser.

## THE MATH

Chebyshev's function (the "prime staircase"):

```
ψ(x) = Σ log p   over all prime powers p^k ≤ x
```

Riemann–von Mangoldt explicit formula (what we plot):

```
ψ(x) = x − Σ_ρ x^ρ/ρ − log(2π) − ½·log(1 − x⁻²)
```

Zeros come in conjugate pairs ρ = ½ ± iγ. Each pair contributes one real wave:

```
W_k(x) = −(2√x / |ρ_k|) · cos(γ_k·log x − α_k)
|ρ_k| = √(¼ + γ_k²),   α_k = atan2(γ_k, ½)
```

Truncating at N zeros gives ψ_N(x). Resolution limit: the top zero γ_N resolves
log-space detail ~2π/γ_N, i.e. real-space blur ~2πx/γ_N. Zeros needed to height T:
N(T) ≈ (T/2π)·log(T/2π) − T/2π + 7/8.

## DATA

- `GAMMAS[300]` — imaginary parts of the first 300 nontrivial zeros, computed via
  `mpmath.zetazero(n)` at 15 dps, embedded to 9 decimals. γ₁ = 14.134725142,
  γ₃₀₀ = 541.847437121.
- `MODS`, `PHASES` — precomputed |ρ| and α per zero.
- `PRIMES`, `JUMPS` — sieve to 500; JUMPS = all prime powers with heights log p
  and an `isPrime` flag (powers render dimmer).

## ARCHITECTURE

State: `N` (wave count), `probeX` (analysis point), `vMin/vMax` (viewport),
`logAxis` (coordinate toggle). One `render()` redraws four channels:

| Fn | Channel | Plot |
|----|---------|------|
| `drawScope()` | CH·1 | ψ_N(x) (cyan) vs true staircase (dashed) over viewport; prime markers; probe crosshair; RMS-error readout; y-axis autoscales to viewport |
| `drawWave()` | CH·2 | wave N alone (amber) + ±envelope (dashed), synced to viewport |
| `drawConv()` | CH·3 | ψ_N(probeX) vs N; past amber, future dim, true value dashed |
| `drawReturn()` | CH·4 | (ψ_{N−1}, ψ_N) return map; diagonal y=x; fixed point circled |

`convergenceTrace(x0)` computes ψ_0..ψ_300 at the probe incrementally (O(N)).

## INTERACTION

- Slider: N 0–300. ▶ RESOLVE auto-plays (slower for first 15, then accelerating).
- CH·1: wheel/pinch zoom centered on cursor, drag pan, click/tap sets probe
  (click vs drag disambiguated by 3px threshold; probe nudged off exact jumps).
- Buttons: Z+/Z− (zoom about center), ⌖ PROBE (window of 8·ln x₀ ≈ 4 average
  gaps around probe), 2–500 (reset), LOG X (log-x coordinates everywhere —
  turns chirps into pure sinusoids).

## EXTENSION POINTS

- More zeros: regenerate `GAMMAS` via `mpmath` (`zetazero(n).imag`), bump slider
  max; everything else keys off `NMAX = GAMMAS.length`.
- Larger range: raise `XMAX`; sieve and JUMPS scale automatically; mind the
  bandwidth rule (need γ_max ≳ 2π·XMAX/ln XMAX for sharp far-end).
- CH·5 (planned): prime-gap return map — scatter of (gap_n, gap_{n+1}) with
  residue-class coloring to expose the Lemke Oliver–Soundararajan correlation.
- π(x) mode: swap ψ for the unit-step staircase using Riemann's R-function and
  μ-weighted wave sum (heavier math; log-weighted ψ chosen for exactness/simplicity).

## KNOWN BEHAVIORS (not bugs)

- Reconstruction rings at jumps (Gibbs phenomenon — truncated Fourier at a
  discontinuity).
- Never fully converges at N=300; the explicit formula converges conditionally,
  in zero order, only as N→∞.
- Blur increases with x at fixed N (bandwidth limit); sharpens as N approaches
  ~270 for x near 500 — this is the demo, not a defect.
- Near x=2 the −½log(1−x⁻²) term is large; the plot starts at x=2 to stay clear
  of the x→1 blowup (cancelled only by the full infinite sum).
