import Link from "next/link"
import { ArrowLeft, Hammer, Compass, MousePointerClick, Sigma } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { ProjectEmbed } from "@/components/projects/ProjectEmbed"
import { PrimeCompanions } from "@/components/projects/PrimeCompanions"

const CHANNELS = [
  {
    k: "CH·s",
    q: "Where are you standing?",
    title: "The input plane",
    body:
      "Pick your s by dragging, with the critical strip drawn as an amber band, the ½ line as a dashed fault, the first zeros as cyan dots, and the pole at s = 1 marked with an ×. Drag near a zero and it snaps. East of the strip the raw series converges; inside it, never.",
  },
  {
    k: "CH·Σ",
    q: "What does the sum actually do?",
    title: "The walk",
    body:
      "Every term becomes one arrow: length n⁻ᔆ, angle −t·ln n. Laid head to tail they walk the output plane. When the shrink beats the spin the walk lands, and where it lands is ζ(s). A zero is simply the walk that comes home to the origin.",
  },
]

const MOVES = [
  {
    n: "σ",
    title: "The shrink knob",
    body:
      "The real part sets how fast each arrow shortens. Above 1 the shrink always wins and the walk converges. That is the whole of Euler's spring, and the reason it only flows east of the wall.",
  },
  {
    n: "t",
    title: "The spin knob",
    body:
      "The imaginary part sets how fast each arrow rotates, against a logarithmic clock. It is the same log-clock the orchestra's waves read, which is why zeta's zeros turn into the primes' frequencies.",
  },
  {
    n: "η",
    title: "The bridge",
    body:
      "Flip the signs to the alternating series and rescale by 1/(1 − 2¹⁻ˢ). The same terms now land inside the strip. Analytic continuation stops being a spell and becomes a move you can watch.",
  },
]

const TRY = [
  "Start at s = 2, the Basel point. The walk spirals tight and lands on π²/6. Now slide toward the wall at re(s) = 1 and watch the landing get lazier until it stops landing at all.",
  "Jump to s = 1, the pole. The arrows stop shrinking fast enough to ever finish: the harmonic series, seen as a walk that escapes.",
  "Go to ½ + γ₁i and let all six hundred arrows out. The spiral closes back onto the origin. That is a zero of zeta, drawn rather than asserted. Then try ½ + 20i, on the line but not a zero, and watch it miss.",
  "Switch from the η bridge to the raw series inside the strip. Same terms, same s, and now the walk just drifts. The bridge is doing real work.",
]

export default function ZetaForgePage() {
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
                <Hammer size={14} strokeWidth={2.25} />
                zeta forge · frontier math
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                Build zeta <span className="v3-accent">one arrow at a time.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                ζ(s) = Σ n⁻ˢ is usually handed to you as a finished object. Here it is manufactured
                in front of you: each term is an arrow, laid head to tail, and the point the walk
                lands on <strong>is</strong> the value. Drag s around the complex plane and watch
                convergence, the pole, and the zeros stop being definitions and start being things
                that visibly happen.
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
              src="/zeta-forge.html"
              title="Zeta Forge: build the zeta function one term at a time"
              initialHeight={1250}
            />
          </V3Reveal>
          <p className="v3-po-cap">
            One HTML file, no build step, no network. The amber crosshair is a guard: ζ(s) computed
            independently by Euler–Maclaurin, so you can see the walk agree with it rather than
            take the drawing on faith.
          </p>
        </div>
      </section>

      {/* THE CHANNELS ================================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <Compass size={18} strokeWidth={2.2} />
              <h2>Two channels</h2>
            </div>
          </V3Reveal>
          <div className="v3-po-grid">
            {CHANNELS.map((c, i) => (
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

      {/* THE THREE KNOBS =============================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <Sigma size={18} strokeWidth={2.2} />
              <h2>Three moves, and the whole picture</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <p className="v3-po-lede">
              Everything the forge does reduces to two knobs and one trick. Once those are physical
              rather than symbolic, most of the mystery around analytic continuation goes with them.
            </p>
          </V3Reveal>
          <div className="v3-po-grid">
            {MOVES.map((m, i) => (
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

      {/* PLAY IT ======================================================= */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <MousePointerClick size={18} strokeWidth={2.2} />
              <h2>Forge it</h2>
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

      {/* MAPS ONTO THE ATLAS =========================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <Sigma size={18} strokeWidth={2.2} />
              <h2>Three landmarks, made playable</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <div className="v3-po-math">
              <p>
                The forge is the western end of the{" "}
                <Link href="/projects/prime-atlas">atlas</Link>, turned into something you can
                operate. Three of its landmarks stop being scenery here:
              </p>
              <code className="v3-po-eq">
                raw series = EULER SPRING · strip edge = CONVERGENCE WALL · η rescale = CONTINUATION BRIDGE
              </code>
              <p>
                The spring is the walk landing while σ &gt; 1. The wall is the exact place it stops
                landing. The bridge is the sign flip and rescale that carries the <em>value</em>{" "}
                across a wall the <em>series</em> cannot cross. That gap between what continues and
                what does not is the whole reason the Riemann Hypothesis is hard, and here you can
                watch it open up.
              </p>
              <p>
                Once a zero is a closed spiral rather than a claim, the{" "}
                <Link href="/projects/prime-orchestra">orchestra</Link> follows naturally: each of
                those zeros becomes one wave, and the waves add up to the primes.
              </p>
            </div>
          </V3Reveal>
        </div>
      </section>

      <PrimeCompanions current="zeta-forge" />
    </div>
  )
}
