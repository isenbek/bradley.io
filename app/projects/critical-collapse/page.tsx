import Link from "next/link"
import {
  ArrowLeft,
  Orbit,
  Sigma,
  Activity,
  MousePointerClick,
  Telescope,
} from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { ProjectEmbed } from "@/components/projects/ProjectEmbed"

const NUMBERS = [
  {
    k: "γ ≈ 0.374",
    q: "How big is the black hole?",
    title: "The mass exponent",
    body:
      "Cross the threshold by a hair and the hole that forms has mass M ∝ |p − p*|^γ. The exponent is universal: change the pulse shape, change the field, and you land on the same 0.374. It is a critical exponent in the exact sense that boiling water has one.",
  },
  {
    k: "Δ ≈ 3.4453",
    q: "What does the edge look like?",
    title: "The echo period",
    body:
      "Sitting exactly on the edge, the solution repeats itself as it shrinks, each copy about 31 times smaller and faster than the last, without end. Δ is the period of that repetition in log time. A fractal falling straight out of Einstein's equations, and secretly it fixes γ.",
  },
]

const STAGES = [
  {
    n: "01",
    title: "The collapse",
    body:
      "Pick an amplitude and press Run. The amber field φ(r) implodes toward the origin while the cyan 2m/r curve climbs underneath it. Below threshold the pulse passes through r = 0 and escapes to infinity; above it, 2m/r pins to 1 and a horizon snaps shut.",
  },
  {
    n: "02",
    title: "The hunt for p*",
    body:
      "This is Choptuik's actual method: bisect on the amplitude. Each trial either disperses or forms a horizon, and the boundary between the two verdicts is the critical point. Twenty-six halvings pin it to eight digits, and every digit costs one full solve of the field equations.",
  },
  {
    n: "03",
    title: "The power law",
    body:
      "Fire supercritical runs at log-spaced distances above p* and fit ln M against ln(p − p*). The slope is γ. On a uniform grid you get the ballpark, not four digits: the real measurement needed adaptive mesh refinement, which is exactly why the discovery took a supercomputer and a thesis.",
  },
]

const TRY = [
  "Drag the amplitude low and hit Run. The pulse implodes through the origin and escapes, the status turns green, and flat space is all that remains.",
  "Push the amplitude high and run again. This time 2m/r climbs to 1, the status turns red, and a black hole has formed with a definite mass.",
  "Now let the machine hunt. Press Bisect to p* and watch the bracket halve, SUB against SUPER, until the two verdicts disagree only in the eighth decimal place.",
  "It parks the slider just above p* for you. Run that and watch the lower panel: φ(0,t) rings at the origin, each oscillation faster and smaller than the one before. That ringing is the first echo.",
  "Finally run the mass-scaling study and read γ off the fit line. Compare your slope to the cyan 0.374 reference. On a laptop grid, landing anywhere near it is the whole miracle.",
]

export default function CriticalCollapsePage() {
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
            <span aria-current="page">Critical Collapse</span>
          </span>
        </nav>
      </div>

      {/* Long-form v3 body, kept as-is. See .kit-island in app/kit.css: the
          chrome is the kit's, the content still carries its own styling. */}
      <div className="v3 kit-island">
<div className="v3-po">
      {/* HEADER ========================================================= */}
      <header className="v3-page-head" style={{ paddingBottom: 16 }}>
        <div className="v3-blob v3-blob--2" aria-hidden style={{ right: "-70px", top: "-30px" }} />
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
                className="v3-pill v3-pill--coral"
                style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}
              >
                <Orbit size={14} strokeWidth={2.25} />
                numerical relativity · live GR
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                A black hole, forged on the <span className="v3-accent">knife edge.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                Choptuik's 1993 result, running live on your device. A pulse of scalar field falls
                together under its own gravity. Tuned just right, it hovers on the exact boundary
                between dispersing back to flat space and collapsing to a black hole, and on that
                boundary Einstein's equations do something nobody expected: they echo, and the mass
                obeys a power law with a universal exponent. Nothing below is pre-rendered. Your
                phone is integrating the field equations.
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
              src="/critical-collapse.html"
              title="Choptuik Critical Collapse Lab: a live 1+1D numerical relativity solver"
              initialHeight={3200}
            />
          </V3Reveal>
          <p className="v3-po-cap">
            One HTML file. An 800-point radial grid in the polar-areal gauge, SSP-RK3 in time, the
            two constraint ODEs re-solved fresh on every slice with Kreiss–Oliger dissipation for
            stability. Every line in the lab log is a genuine solve of Einstein's equations coupled
            to a massless scalar field, not a lookup. KaTeX is vendored locally, so the whole
            instrument runs with no network at all.
          </p>
        </div>
      </section>

      {/* THE TWO NUMBERS =============================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <Sigma size={18} strokeWidth={2.2} />
              <h2>Two numbers fall out of the edge</h2>
            </div>
          </V3Reveal>
          <div className="v3-po-grid">
            {NUMBERS.map((c, i) => (
              <V3Reveal key={c.k} delay={100 + i * 55}>
                <div className="v3-po-card">
                  <span className="v3-po-card__k">{c.k}</span>
                  <h3>{c.title}</h3>
                  <p className="v3-po-card__q">{c.q}</p>
                  <p>{c.body}</p>
                </div>
              </V3Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT THE MACHINE DOES ========================================= */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <Activity size={18} strokeWidth={2.2} />
              <h2>Three instruments on one solver</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <p className="v3-po-lede">
              The same field solver drives all three panels. First you watch a single collapse by
              hand, then you let the machine bisect its way to the threshold, then you make it
              measure the exponent that lives there. Each step only needs the one before it.
            </p>
          </V3Reveal>
          <div className="v3-po-grid">
            {STAGES.map((m, i) => (
              <V3Reveal key={m.n} delay={100 + i * 55}>
                <div className="v3-po-card">
                  <span className="v3-po-card__k">{m.n}</span>
                  <h3>{m.title}</h3>
                  <p>{m.body}</p>
                </div>
              </V3Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* RUN IT ======================================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <MousePointerClick size={18} strokeWidth={2.2} />
              <h2>Run it yourself</h2>
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

      {/* WHY IT MATTERS ================================================ */}
      <section className="v3-section" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <Telescope size={18} strokeWidth={2.2} />
              <h2>Why a knife edge matters</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <div className="v3-po-math">
              <p>
                The critical solution is a naked, self-similar region of spacetime where curvature
                climbs without bound. Classically it cascades through every scale on the ruler, from
                the size of a star all the way down toward the Planck length. It is the cleanest
                mathematical thread we have that runs continuously into the part of physics no theory
                has mapped, and whatever finally cuts the cascade off is, by definition, quantum
                gravity.
              </p>
              <p>
                It is also the same mathematics as boiling water. γ is a critical exponent in the
                literal sense of phase transitions, the black-hole threshold is a second-order
                transition with the mass as its order parameter, and the echoes are a discrete
                version of the scale invariance that shows up at any critical point. The universe
                reuses the pattern, and here it is running on the metal.
              </p>
              <p>
                It is one file and no build step. Read the source, change the pulse, and watch a
                different threshold assemble itself out of the same equations. More single-file
                instruments live back on the <Link href="/projects">projects index</Link>.
              </p>
            </div>
          </V3Reveal>
        </div>
      </section>
    </div>
      </div>
    </div>
  )
}
