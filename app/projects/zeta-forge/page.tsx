import Link from "next/link"
import { Compass, MousePointerClick, Sigma } from "lucide-react"
import { ProjectEmbed } from "@/components/projects/ProjectEmbed"
import { PrimeCompanions } from "@/components/projects/PrimeCompanions"
import { PageHead, Section } from "@/components/page"

const CHANNELS = [
  {
    k: "CH·s",
    q: "Where are you standing?",
    title: "The input plane",
    body:
      "Pick your s by dragging, with the critical strip drawn as an amber band, the ½ line as a dashed fault, the first zeros as cyan dots, and the pole at s = 1 marked with an ×. Drag near a zero and it snaps. East of the strip the raw series converges. Inside it, it never does.",
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
    <div className="page">
      <PageHead
        crumbs={[{ label: "Projects", href: "/projects" }, { label: "Zeta Forge" }]}
        title="Build zeta one arrow at a time"
        lede={
          <>
            ζ(s) = Σ n⁻ˢ is usually handed to you as a finished object. Here it is manufactured
            in front of you: each term is an arrow, laid head to tail, and the point the walk
            lands on <strong>is</strong> the value. Drag s around the complex plane and watch
            convergence, the pole, and the zeros stop being definitions and start being things
            that visibly happen.
          </>
        }
      />

      {/* THE INSTRUMENT ================================================= */}
      <ProjectEmbed
          src="/zeta-forge.html"
          title="Zeta Forge: build the zeta function one term at a time"
          initialHeight={1250}
        />
      <p className="quiet">
        One HTML file, no build step, no network. The amber crosshair is a guard: ζ(s) computed
        independently by Euler–Maclaurin, so you can see the walk agree with it rather than
        take the drawing on faith.
      </p>

      {/* THE CHANNELS ================================================== */}
      <Section title="Two channels" icon={<Compass size={18} strokeWidth={2.2} />} />
      <div className="piece-grid">
        {CHANNELS.map((c) => (
          <div className="rail" key={c.k}>
              <span className="beta-proj-k">{c.k}</span>
              <h3>{c.title}</h3>
              <p className="beta-proj-q">{c.q}</p>
              <p>{c.body}</p>
            </div>
        ))}
      </div>

      {/* THE THREE KNOBS =============================================== */}
      <Section title="Three moves, and the whole picture" icon={<Sigma size={18} strokeWidth={2.2} />}>
        <p>
          Everything the forge does reduces to two knobs and one trick. Once those are
          physical rather than symbolic, most of the mystery around analytic continuation
          goes with them.
        </p>
      </Section>
      <div className="piece-grid">
        {MOVES.map((m) => (
          <div className="rail" key={m.n}>
              <span className="beta-proj-k">{m.n}</span>
              <h3>{m.title}</h3>
              <p>{m.body}</p>
            </div>
        ))}
      </div>

      {/* PLAY IT ======================================================= */}
      <Section title="Forge it" icon={<MousePointerClick size={18} strokeWidth={2.2} />} />
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

      {/* MAPS ONTO THE ATLAS =========================================== */}
      <Section title="Three landmarks, made playable" icon={<Sigma size={18} strokeWidth={2.2} />}>
        <p>
          The forge is the western end of the{" "}
          <Link href="/projects/prime-atlas">atlas</Link>, turned into something you can
          operate. Three of its landmarks stop being scenery here:
        </p>
        <div className="code"><pre>
          raw series = EULER SPRING · strip edge = CONVERGENCE WALL · η rescale = CONTINUATION BRIDGE
        </pre></div>
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
      </Section>

      <PrimeCompanions current="zeta-forge" />
    </div>
  )
}
