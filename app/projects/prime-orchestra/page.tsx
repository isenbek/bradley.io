import Link from "next/link"
import { ArrowLeft, ArrowRight, Activity, AudioWaveform, Sigma, MousePointerClick, Microscope } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { ProjectEmbed } from "@/components/projects/ProjectEmbed"

const CHANNELS = [
  {
    k: "CH·1",
    title: "Reconstruction",
    body:
      "The running sum ψ_N(x) in cyan against the true prime staircase, dashed. A live RMS-error readout tells you how close the chorus has gotten. Wheel to zoom, drag to pan, click to drop a probe.",
  },
  {
    k: "CH·2",
    title: "The wave",
    body:
      "Zero number N on its own: one pure chirp with its ±envelope, the harmonic you just added. This is the single voice the reconstruction folds in.",
  },
  {
    k: "CH·3",
    title: "Convergence",
    body:
      "The value at your probe point as a function of N. Watch it hunt toward the true height and overshoot, the signature of conditional convergence.",
  },
  {
    k: "CH·4",
    title: "Return map",
    body:
      "Each step plotted as (ψ at N−1, ψ at N) against the diagonal. The reconstruction spirals in on a fixed point rather than settling clean.",
  },
]

const TRY = [
  "Hit ▶ RESOLVE and let the zeros pour in. It starts slow for the first fifteen so you can watch the primes precipitate out of noise, then accelerates.",
  "Drag and zoom CH·1 to chase a single prime, then click to set the probe and watch CH·3 converge on that exact point.",
  "Flip LOG X. On a log axis every chirp becomes a pure sine wave, which is the real reason the formula works: the zeros are frequencies.",
]

export default function PrimeOrchestraPage() {
  return (
    <div className="v3-po">
      {/* HEADER ========================================================= */}
      <header className="v3-page-head" style={{ paddingBottom: 16 }}>
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "-70px", top: "-30px" }} />
        <div className="v3-blob v3-blob--3" aria-hidden style={{ right: "180px", top: "220px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <Link href="/projects" className="v3-air-back">
                <ArrowLeft size={14} strokeWidth={2.4} /> back to projects
              </Link>
            </V3Reveal>
            <V3Reveal>
              <span
                className="v3-pill v3-pill--blue"
                style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}
              >
                <Sigma size={14} strokeWidth={2.25} />
                prime orchestra · frontier math
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                The primes, played by the <span className="v3-accent">zeros of zeta.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                Every prime leaves a step in the counting staircase, and Riemann&rsquo;s explicit
                formula says that staircase is <strong>exactly</strong> a sum of waves, one for each
                nontrivial zero of the zeta function. This is that sum, live: feed the zeros in one at
                a time and watch the primes resolve out of pure harmonics.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* THE INSTRUMENT ================================================= */}
      <section className="v3-section" style={{ paddingTop: 6, paddingBottom: 10 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <ProjectEmbed
              src="/prime-orchestra.html"
              title="Prime Orchestra: a Riemann explicit-formula instrument"
            />
          </V3Reveal>
          <p className="v3-po-cap">
            Fully self-contained: one HTML file, no build step, no network. The first 300 nontrivial
            zeros are baked in (γ₁ = 14.1347…, γ₃₀₀ = 541.8474…).
          </p>
        </div>
      </section>

      {/* THE CHANNELS ================================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <Activity size={18} strokeWidth={2.2} />
              <h2>Four channels, one signal</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <p className="v3-po-lede">
              Riemann rebuilds Chebyshev&rsquo;s staircase ψ(x) as <code>x</code> minus a chorus of
              waves, one per zero ρ = ½ ± iγ. The four scopes show the same signal from four angles.
            </p>
          </V3Reveal>
          <div className="v3-po-grid">
            {CHANNELS.map((c, i) => (
              <V3Reveal key={c.k} delay={100 + i * 55}>
                <div className="v3-po-card">
                  <span className="v3-po-card__k">{c.k}</span>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              </V3Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TRY THIS ====================================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <MousePointerClick size={18} strokeWidth={2.2} />
              <h2>Play it</h2>
            </div>
          </V3Reveal>
          <div className="v3-po-try">
            <ol>
              {TRY.map((t, i) => (
                <V3Reveal key={i} delay={80 + i * 55}>
                  <li>
                    <span className="v3-po-try__n">{i + 1}</span>
                    <span>{t}</span>
                  </li>
                </V3Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* THE MATH ====================================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <AudioWaveform size={18} strokeWidth={2.2} />
              <h2>The formula, spelled out</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <div className="v3-po-math">
              <p>The Riemann–von Mangoldt explicit formula, exactly what the top scope plots:</p>
              <code className="v3-po-eq">ψ(x) = x − Σ_ρ x^ρ/ρ − log(2π) − ½·log(1 − x⁻²)</code>
              <p>
                Zeros come in conjugate pairs, so each pair collapses into one real wave whose
                frequency is the zero&rsquo;s height γ:
              </p>
              <code className="v3-po-eq">W_k(x) = −(2√x / |ρ_k|) · cos(γ_k · log x − α_k)</code>
              <p>
                Truncate at 300 zeros and you get ψ_N(x). It never fully converges: the explicit
                formula converges only conditionally, in zero order, as N → ∞. The ringing at each
                prime jump is Gibbs&rsquo; phenomenon, a truncated Fourier series meeting a
                discontinuity. That is the demonstration, not a defect.
              </p>
            </div>
          </V3Reveal>
        </div>
      </section>

      {/* COMPANION ===================================================== */}
      <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 48 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <Link href="/projects/prime-zoo" className="v3-air-promo">
              <span className="v3-air-promo__ico"><Microscope size={20} strokeWidth={2.2} /></span>
              <span className="v3-air-promo__body">
                <span className="v3-air-promo__eyebrow">companion instrument</span>
                <span className="v3-air-promo__title">Primality Zoo: the structure hiding in the primes</span>
                <span className="v3-air-promo__blurb">
                  The other direction. Three field instruments over a live two-million sieve: which
                  prime constellations can exist, which residue class is winning, and whether one
                  prime remembers the last.
                </span>
              </span>
              <span className="v3-air-promo__right"><ArrowRight className="v3-air-promo__arrow" size={18} strokeWidth={2.4} /></span>
            </Link>
          </V3Reveal>
        </div>
      </section>
    </div>
  )
}
