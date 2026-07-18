import Link from "next/link"
import {
  ArrowLeft,
  Activity,
  Microscope,
  MousePointerClick,
  ShieldCheck,
  Sigma,
} from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { ProjectEmbed } from "@/components/projects/ProjectEmbed"
import { PrimeCompanions } from "@/components/projects/PrimeCompanions"

const CHANNELS = [
  {
    k: "CH·A",
    q: "Can this pattern exist at all?",
    title: "Coverage engine",
    body:
      "Type a gap pattern, say 0, 2, 6, 8, and the residue rows show what it occupies mod 2, 3, 5, 7, 11, 13. Fill an entire row and every position in that class is forced composite: the constellation is dead, with at most one occurrence ever. Escape every row and it lives, and the Hardy–Littlewood count comes along for the ride.",
  },
  {
    k: "CH·B1",
    q: "Which residue class is winning?",
    title: "Chebyshev race",
    body:
      "Primes that are 3 mod 4 have led primes that are 1 mod 4 for most of recorded arithmetic, though the lead flips infinitely often. The amber overlay says why: half of π(√x), the prime-power mass quietly parked in the 1s class. Subtract it and the residual is zero music around nothing.",
  },
  {
    k: "CH·B2",
    q: "Does a prime remember the last one?",
    title: "Gap transition matrix",
    body:
      "Row is the residue of pₙ, column is pₙ₊₁, cell is the row percentage. A memoryless sequence reads a flat 1/φ(q) everywhere. This one does not: the diagonal is dark, because primes avoid repeating their own residue class. Lemke Oliver and Soundararajan, 2016.",
  },
]

const GUARDS = [
  {
    k: "CH·A",
    title: "Singular series",
    body:
      "The amber curve is S·∫dx/lnᵏx, the Hardy–Littlewood prediction for that exact pattern. If the white staircase tracks it, the structure is real rather than a shape you talked yourself into.",
  },
  {
    k: "CH·B1",
    title: "Prime-power mass",
    body:
      "½·π(√x), the bias that is pure bookkeeping: every odd p² is 1 mod 4. The race hugs it, so the famous Chebyshev bias mostly is the ψ-to-π correction, not a mystery.",
  },
  {
    k: "CH·B2",
    title: "The fair die",
    body:
      "Flat 1/φ(q), printed under every cell as a delta. Any structure worth reporting has to beat a fair die, and switching the modulus tells you whether it beat base 10 instead.",
  },
]

const TRY = [
  "Type 0, 2, 4 into CH·A. The lamp goes red: the pattern covers every cell mod 3, so 3, 5, 7 is the only occurrence that will ever exist. Change it to 0, 2, 6 and it turns green.",
  "Try the penta trap, 0, 2, 4, 6, 8. It looks as harmless as the quad next to it and dies on mod 5.",
  "In CH·B2, walk the modulus from 10 to 3 to 8 to 12. The dark diagonal survives every costume change, so it is residue structure and not a base-10 artifact. Then push the window to the top ten percent and watch it fade toward fair, glacially.",
]

export default function PrimeZooPage() {
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
                <Microscope size={14} strokeWidth={2.25} />
                primality zoo · frontier math
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                Three instruments for the <span className="v3-accent">structure hiding in the primes.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                The <Link href="/projects/prime-orchestra">Prime Orchestra</Link> plays the primes
                back out of the zeros of zeta. The zoo runs the other direction: it sieves two
                million integers in your browser and interrogates the raw sequence. Which
                constellations of primes are even allowed to exist, which residue class is ahead in
                a two-century-old race, and whether one prime remembers the last one.
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
              src="/prime-zoo.html"
              title="Primality Zoo: three field instruments for prime structure"
              initialHeight={1600}
            />
          </V3Reveal>
          <p className="v3-po-cap">
            One HTML file, no build step, no network. The sieve to 2,000,000 runs on load, so the
            first paint takes a beat and everything after it is instant.
          </p>
        </div>
      </section>

      {/* THE CHANNELS ================================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <Activity size={18} strokeWidth={2.2} />
              <h2>Three channels, three questions</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <p className="v3-po-lede">
              Wing A asks what patterns the primes permit. Wing B asks how they distribute
              themselves once permitted. Both wings run off the same sieve, live, with no
              precomputed answers.
            </p>
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

      {/* THE GUARDS ==================================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <ShieldCheck size={18} strokeWidth={2.2} />
              <h2>Every channel carries a guard</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <p className="v3-po-lede">
              Prime data is unusually good at looking meaningful. So each scope plots an
              independent prediction next to the measurement: the boring answer, drawn in the same
              units. If the data does not separate from its guard, there is nothing to report.
            </p>
          </V3Reveal>
          <div className="v3-po-grid">
            {GUARDS.map((g, i) => (
              <V3Reveal key={g.k} delay={100 + i * 55}>
                <div className="v3-po-card">
                  <span className="v3-po-card__k">{g.k}</span>
                  <h3>{g.title}</h3>
                  <p>{g.body}</p>
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
              <Sigma size={18} strokeWidth={2.2} />
              <h2>What the lamp is actually testing</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <div className="v3-po-math">
              <p>
                A pattern is <strong>admissible</strong> when it never covers a full residue class.
                For every prime p, count the distinct residues the offsets land on:
              </p>
              <code className="v3-po-eq">ν(p) = |&#123; oᵢ mod p &#125;| &lt; p, for every prime p</code>
              <p>
                One p with ν(p) = p and the pattern is finished: every candidate position is
                divisible by p, so at most one occurrence survives, and only when p itself sits in
                the pattern. That is the red lamp.
              </p>
              <p>
                Clear the test and Hardy–Littlewood gives the density, with the singular series S
                collecting a correction from every prime at once:
              </p>
              <code className="v3-po-eq">
                S = Π_p (1 − ν(p)/p) / (1 − 1/p)ᵏ &nbsp;·&nbsp; count(x) ≈ S · ∫₂ˣ dt/(ln t)ᵏ
              </code>
              <p>
                Admissibility is decidable in a millisecond. Whether an admissible pattern actually
                recurs forever is open for every k ≥ 2, twin primes included. The instrument can
                tell you a constellation is dead. It cannot tell you one is alive.
              </p>
            </div>
          </V3Reveal>
        </div>
      </section>

      <PrimeCompanions current="prime-zoo" />
    </div>
  )
}
