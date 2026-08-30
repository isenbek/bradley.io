import Link from "next/link"
import { Activity, AudioWaveform, MousePointerClick } from "lucide-react"
import { ProjectEmbed } from "@/components/projects/ProjectEmbed"
import { PrimeCompanions } from "@/components/projects/PrimeCompanions"

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
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <Link href="/projects">Projects</Link>
          </span>
          <span>
            {" / "}
            <span aria-current="page">Prime Orchestra</span>
          </span>
        </nav>
        <h1>The primes, played by the zeros of zeta</h1>
      </div>

      <p className="lede">
          Every prime leaves a step in the counting staircase, and Riemann&rsquo;s explicit
          formula says that staircase is <strong>exactly</strong> a sum of waves, one for each
          nontrivial zero of the zeta function. This is that sum, live: feed the zeros in one at
          a time and watch the primes resolve out of pure harmonics.
      </p>
      {/* HEADER ========================================================= */}

      {/* THE INSTRUMENT ================================================= */}
      <section className="beta-note-sec" style={{ paddingTop: 6, paddingBottom: 10 }}>
        <div >
          <ProjectEmbed
              src="/prime-orchestra.html"
              title="Prime Orchestra: a Riemann explicit-formula instrument"
            />
          <p className="quiet">
            Fully self-contained: one HTML file, no build step, no network. The first 300 nontrivial
            zeros are baked in (γ₁ = 14.1347…, γ₃₀₀ = 541.8474…).
          </p>
        </div>
      </section>

      {/* THE CHANNELS ================================================== */}
      <section className="beta-note-sec" style={{ paddingTop: 24 }}>
        <div >
          <div className="beta-sechead">
              <Activity size={18} strokeWidth={2.2} />
              <h2>Four channels, one signal</h2>
            </div>
          <p className="lede">
              Riemann rebuilds Chebyshev&rsquo;s staircase ψ(x) as <code>x</code> minus a chorus of
              waves, one per zero ρ = ½ ± iγ. The four scopes show the same signal from four angles.
            </p>
          <div className="piece-grid">
            {CHANNELS.map((c) => (
              <div className="rail" key={c.k}>
                  <span className="beta-proj-k">{c.k}</span>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRY THIS ====================================================== */}
      <section className="beta-note-sec" style={{ paddingTop: 24 }}>
        <div >
          <div className="beta-sechead">
              <MousePointerClick size={18} strokeWidth={2.2} />
              <h2>Play it</h2>
            </div>
          <div className="beta-steps">
            <ol>
              {TRY.map((t, i) => (
                <li key={i}>
                    <span className="beta-steps__n">{i + 1}</span>
                    <span>{t}</span>
                  </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* THE MATH ====================================================== */}
      <section className="beta-note-sec" style={{ paddingTop: 24 }}>
        <div >
          <div className="beta-sechead">
              <AudioWaveform size={18} strokeWidth={2.2} />
              <h2>The formula, spelled out</h2>
            </div>
          <div className="prose beta-sec">
              <p>The Riemann–von Mangoldt explicit formula, exactly what the top scope plots:</p>
              <div className="code"><pre>ψ(x) = x − Σ_ρ x^ρ/ρ − log(2π) − ½·log(1 − x⁻²)</pre></div>
              <p>
                Zeros come in conjugate pairs, so each pair collapses into one real wave whose
                frequency is the zero&rsquo;s height γ:
              </p>
              <div className="code"><pre>W_k(x) = −(2√x / |ρ_k|) · cos(γ_k · log x − α_k)</pre></div>
              <p>
                Truncate at 300 zeros and you get ψ_N(x). It never fully converges: the explicit
                formula converges only conditionally, in zero order, as N → ∞. The ringing at each
                prime jump is Gibbs&rsquo; phenomenon, a truncated Fourier series meeting a
                discontinuity. That is the demonstration, not a defect.
              </p>
            </div>
        </div>
      </section>

      <PrimeCompanions current="prime-orchestra" />
    </div>
  )
}
