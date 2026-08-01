# MATH CHEAT SHEET — HACKER EDITION
*Symbols and jargon from the prime orchestra sessions, translated to dev-speak.*

---

## THE GREEK LETTERS (variables with fixed jobs)

| Symbol | Name | What it is here |
|--------|------|-----------------|
| ζ | zeta | **The** function: `zeta(s)`. Encodes all primes at once. The whole game orbits this one function. |
| ρ | rho | A **zero** of zeta — an input where `zeta(rho) == 0`. Complex number, e.g. `0.5 + 14.13i`. One rho = one wave. |
| γ | gamma | The **imaginary part** of a zero = the wave's frequency. `rho = 0.5 + γi`. Our slider walks γ₁, γ₂, γ₃… |
| α | alpha | A **phase offset** — where the wave starts in its cycle. Just a constant per wave. |
| π | pi | Two jobs, annoyingly: the circle constant 3.14159, **and** `π(x)` = "count of primes ≤ x" (a function, nothing to do with circles). Context tells you which. |
| ψ | psi | `psi(x)` = the **prime staircase** on CH·1. Like `π(x)` but each prime p adds `log(p)` instead of 1. Calibrated so the graph has slope 1. |
| Λ | lambda (capital) | The de Bruijn–Newman constant. RH ⟺ `Λ ≤ 0`. Proven: `0 ≤ Λ ≤ 0.2`. The pinch. |
| Σ | sigma (capital) | **Sum loop.** `Σₖ f(k)` = `for k in range: total += f(k)`. That's it. That's the scary symbol. |
| Π | pi (capital) | **Product loop.** Same but `total *= f(k)`. |

---

## THE LOGIC SYMBOLS (the "A-shaped" ones)

| Symbol | Read as | Dev translation |
|--------|---------|-----------------|
| ∀ | "for all" | `all(...)` / a universally-quantified assert. `∀x: P(x)` = "P passes for every x." (Upside-down A = **A**ll.) |
| ∃ | "there exists" | `any(...)`. `∃x: P(x)` = "at least one x passes." (Backwards E = **E**xists.) |
| ∈ | "in" / "element of" | Literally Python's `in`. `x ∈ S` = `x in S`. |
| ⟺ | "if and only if" | Two-way implication. `A ⟺ B` = the statements are equivalent, each implies the other. |
| → / ⟹ | "implies" / "goes to" | Either logical implication or "approaches" (limits). Context. |
| ≈ | "approximately" | `~=`. Close enough, error shrinks. |
| ≡ | "congruent" | Modular equality: `a ≡ b (mod n)` means `a % n == b % n`. |
| \|x\| | "absolute value / magnitude" | `abs(x)`. For complex numbers: distance from origin, `sqrt(re² + im²)`. |

---

## THE FUNCTIONS

| Notation | Meaning |
|----------|---------|
| `log x`, `ln x` | Natural log (base e) — in number theory, **log always means ln**. Nobody means base 10. |
| `Li(x)` | The "expected prime count" — the smooth axis the waves oscillate around. A refined `x / ln x`. |
| `π(x)` | Actual prime count ≤ x. The staircase, unit steps. |
| `ψ(x)` | Log-weighted prime count. The staircase we plot. `ψ(x) ≈ x` is the Prime Number Theorem. |
| `N(T)` | Zero count: how many zeros have frequency γ ≤ T. The orchestra's seating chart. |
| `pₙ` | The n-th prime. `p₁=2, p₂=3, p₃=5`. Array indexing: `primes[n]`. |
| `x^ρ` | x raised to a **complex** power. This is where waves come from: `x^(0.5+γi) = √x · (cos + i·sin)(γ ln x)`. Real part → envelope, imaginary part → oscillation. |

---

## THE ACRONYMS

| Acronym | Expansion | One-liner |
|---------|-----------|-----------|
| **RH** | Riemann Hypothesis | "All nontrivial zeros have real part exactly ½." ⟺ every wave shares the same √x envelope. ⟺ primes are as orderly as possible. Open since 1859. $1M bounty. |
| **PNT** | Prime Number Theorem | `π(x) ≈ x/ln x`. Proven 1896. The zeroth-order fact; RH controls the error bars. |
| **GUE** | Gaussian Unitary Ensemble | A class of random matrices. Zeta-zero spacings statistically match GUE eigenvalues. The uranium connection. |
| **GOE** | Gaussian Orthogonal Ensemble | GUE's sibling for time-reversal-symmetric systems. Zeta is GUE, not GOE — a clue about the hidden system. |
| **LI** | Linear Independence conjecture | "No zero frequency is a rational combo of others" — no two waves ever phase-lock. Powers the prime-race results. |
| **GPY** | Goldston–Pintz–Yıldırım | The 2005 sieve that almost proved bounded gaps; Zhang supplied the missing part. |
| **ζ(s)** Euler product | `ζ(s) = Π over primes of 1/(1−p⁻ˢ)` | The identity welding zeta to the primes. The reason zeta matters at all. |

---

## PHRASES THAT SOUND SCARY BUT AREN'T

- **"Nontrivial zeros"** — the interesting zeros (complex ones). The "trivial" zeros at −2, −4, −6… are a known boring family.
- **"Critical line"** — the vertical line `re(s) = ½` where RH says all nontrivial zeros live.
- **"Critical strip"** — the region `0 < re(s) < 1` where they're proven to live. RH: strip collapses to line.
- **"Explicit formula"** — the exact equation `staircase = smooth axis − Σ waves`. What CH·1 plots.
- **"Conditional convergence"** — the sum only works if you add terms in the right order. Reorder and it breaks. (Our slider adds zeros in frequency order — the right order.)
- **"Asymptotic" / `f(x) ~ g(x)`** — ratio → 1 as x → ∞. "Equal in the limit, with shrinking relative error."
- **"Unconditional"** — proven with no unproven assumptions. Opposite: "under RH" = "assuming RH is true, then…" (a huge genre of results).
- **"Sieve"** — systematic crossing-out of multiples (Eratosthenes and its industrial descendants). The workhorse of gap theorems.
- **"Pair correlation"** — the statistics of distances between pairs of zeros. Montgomery's tea-time formula.
- **"O(...)" big-O** — same as CS big-O. Mathematicians invented it; you already speak it.

---

## THE ONE FORMULA TO RULE THEM ALL

```
ψ(x)  =  x  −  Σ_ρ  x^ρ / ρ  −  log(2π)  −  ½·log(1 − x⁻²)
         │        │                │              │
       smooth   the waves       y-offset      trivial-zero
        axis   (one per zero)   (ζ at s=0)    correction
```

Read as code:

```python
def psi(x, zeros):
    total = x - log(2*pi) - 0.5*log(1 - x**-2)
    for gamma in zeros:                      # rho = 0.5 + gamma*i
        amp   = 2*sqrt(x) / hypot(0.5, gamma)   # envelope: AM gain
        phase = atan2(gamma, 0.5)                # phase offset
        total -= amp * cos(gamma*log(x) - phase) # the wave
    return total   # → prime staircase as len(zeros) → ∞
```

Every symbol in the paper literature maps to a line in that function.
The primes are the output. The zeros are the config.
RH says the config file has no anomalies.
