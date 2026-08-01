# PRIMALITY — Project Brief
*Handoff doc. Context seed for continuing exploration of prime structure, the Riemann explicit formula, and spectral number theory.*

---

## WHO
Spicy — hacker by trade (Python/TS, distributed systems, LLM pipelines). Learns
top-down/conceptually; notation is being acquired bottom-up via code equivalents
(see `math-cheatsheet.md`). Strong instincts for invariance-hunting, coordinate
independence, and dependency structure. Prefers dev-speak analogies (serialization,
config files, AM radio, bandwidth) over formal exposition.

## THE CONCEPTUAL ARC SO FAR
The journey, in order — each step was derived, not just told:

1. **Base-independence.** Divisibility tricks (last digit for 2/5, digit sums for
   3/9) are artifacts of base 10 ≡ 0, 1, or −1 mod d. Primality itself is
   base-independent. *Slogan: the base is the serialization format; primes are the data.*
2. **Prime index pₙ.** The ordering of primes is coordinate-free. No closed-form
   for pₙ; PNT gives pₙ ≈ n·ln n. Prime-counting function π(x) is the inverse view.
3. **Gaps.** The gap sequence (pₙ₊₁ − pₙ) is also universal. Zhang 2013: some gap
   ≤ 70M recurs infinitely (first finite bound ever); Polymath8 + Maynard → 246.
   Sieve "parity problem" blocks the road to 2 (twin primes). Large-gap side:
   Ford–Green–Konyagin–Maynard–Tao. 2016 Lemke Oliver–Soundararajan: consecutive
   primes avoid repeating last digits — a real gap correlation wearing a digit costume.
4. **Explicit formula / wave-particle duality.** ψ(x) = x − Σ_ρ x^ρ/ρ − log 2π − ½log(1−x⁻²).
   Primes = interference pattern of waves, one per zeta zero. Discrete AND wavelike;
   Fourier duality is exact and runs both directions (primes → FFT → zeros).
5. **Random matrix / quantum chaos.** Montgomery–Dyson tea story; zero spacings
   match GUE (uranium nuclei energy levels). Hilbert–Pólya: zeros may be eigenvalues
   of an unknown quantum operator; Berry–Keating: primes ↔ periodic orbits, log p = period.
6. **Scale structure.** Zeros aren't a fractal set but are statistically
   self-similar after unfolding; log|ζ| on the critical line is a log-correlated
   field (Fyodorov–Hiary–Keating), same universality class as 2D GFF / multiplicative chaos.
7. **Wave anatomy.** Each zero ρ = ½+iγ is one AM transmission:
   W(x) = −2√x/|ρ| · cos(γ·log x − arg ρ). Chirp in linear x, pure sinusoid in log x.
   γ = frequency, ½ = envelope exponent (√x), arg ρ = phase. RH ⟺ all envelopes equal.
   i is the oscillation engine (Euler's formula); π is a supporting constant.
8. **Origins.** Additive origin 0; multiplicative origin 1 (empty product — also why
   1 isn't prime). ψ starts accumulating at x=2 with jump log 2. −log 2π offset = ζ′(0)/ζ(0);
   trivial zeros (−2,−4,…) tune the curve near x=1.
9. **Convergence dynamics.** Partial sums ψ_N(x₀) ring at discontinuities (Gibbs),
   settle mid-gap; convergence is conditional (zero order matters), never flatlines.
   Return map (ψ_{N−1}, ψ_N) = Takens lag-1 embedding; orbit spirals into fixed
   point on the diagonal; incommensurate frequencies (LI conjecture) ⇒ never repeats.
10. **Bandwidth.** Resolving primes near x needs zeros up to γ ≈ 2πx/ln x.
    N(T) ≈ (T/2π)log(T/2π) − T/2π is the seating chart. Verified live in the tool:
    ~270 zeros to articulate primes to 500 (γ₂₇₀ ≈ 500.3).
11. **RH approach envelope.** Zero-free regions (stalled since Vinogradov–Korobov 1958);
    proportion on line (~41–42%, Conrey lineage); spectral/Hilbert–Pólya (deep, no theorems);
    function-field RH proven (Weil/Deligne) — the geometric hint; equivalences
    (Nyman–Beurling, Li, Lagarias). De Bruijn–Newman: RH ⟺ Λ ≤ 0; Rodgers–Tao 2018
    proved Λ ≥ 0 (RH is "barely true" if true); Polymath15: Λ ≤ 0.2. The pinch: Λ ∈ [0, 0.2].
12. **Dependency structure.** Waves aren't causal history — holographic, all span
    the whole line. Real forward dependency: primes ≤ √x fully determine primality ≤ x.
    Counting fluctuations are log-correlated ⇒ effectively infinite memory, every scale contributes.

## THE TOOL — prime-orchestra.html (v: 300 zeros, range 2–500)
Single-file HTML/canvas instrument. See `README-orchestra.md` for internals.
- **CH·1** ψ(x) reconstruction vs true staircase; prime/prime-power markers; probe
  crosshair (click); wheel/pinch zoom, drag pan; Z+/Z−/⌖PROBE/reset; RMS error readout.
- **CH·2** isolated wave (last added) with √x envelope; LOG X toggle (chirp → sinusoid).
- **CH·3** convergence trace ψ_N(x₀) vs N at probe.
- **CH·4** return map (ψ_{N−1}, ψ_N), lag-1 embedding, fixed point on diagonal.
- Slider N = 0…300; RESOLVE auto-play; first 300 zeros hardcoded (mpmath, 9 decimals).

## OPEN THREADS (the backlog)
- **Wavelets between steps** — the structured hum where waves "cancel" mid-gap:
  Gibbs ringing vs conditional-convergence breathing vs genuine signal. (Promised "tomorrow.")
- **CH·5 candidate:** gap return map — gap(n) vs gap(n+1) scatter, where the 2016
  consecutive-gap correlation lives. Offered, not yet built.
- **Approach tree visualization** — map the RH assault routes as an actual graph artifact.
- **Notation bootcamp** — continue bottom-up notation learning via code↔notation diffs.
- **Folding hypothesis** — Spicy's standing gut claim: dependency/folding structure
  in the gap sequence. Partially vindicated (gap correlations, log-correlated field,
  quantum-chaos framing). Worth stress-testing with real embeddings of gap data.
- Possible: prime races / Chebyshev bias demo; Fourier-transform-the-primes demo
  (recover zeros from prime data live); Lehmer pairs; N(T) seating-chart overlay.

## HOUSE STYLE
Dark navy / cyan / amber "instrument" aesthetic (blueprint-oscilloscope), monospace,
channel labels (CH·1…), readouts in small caps. Explanations: lead with the concept,
one hacker analogy, then the math; formulas always paired with runnable-style code.
