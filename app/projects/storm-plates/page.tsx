import Link from "next/link"
import { ArrowLeft, Waves, Compass, MousePointerClick, Sigma } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { ProjectEmbed } from "@/components/projects/ProjectEmbed"
import { PrimeCompanions } from "@/components/projects/PrimeCompanions"

const CHANNELS = [
  {
    k: "PL·swell",
    q: "What is a prime, as weather?",
    title: "One prime, one wave",
    body:
      "Prime p is a swell of wavelength exactly p. Every crest lands on a multiple of p and breaks that plank, except plank p itself, which is where the swell was born. The crests never drift: the surge is animated but the phase stays pinned to n ≡ 0 mod p.",
  },
  {
    k: "PL·calm",
    q: "So what is a prime number?",
    title: "A plank the whole storm missed",
    body:
      "A plank drowns if any crest reaches it, so it survives only by standing at a node of every active swell at once. Survival is a conjunction, and that conjunction is the entire sieve. Everything else on this page is a consequence of it.",
  },
]

const PLATES = [
  {
    n: "I·II",
    title: "The swell and the stack",
    body:
      "First a single wave under the bridge, then four of them superposed. Every gap below 60 is made by swells 2, 3, 5, 7 alone, because nothing larger has surfaced yet. Mute one and false survivors flood in: a muted wave is a hallucinated prime.",
  },
  {
    n: "III·IV",
    title: "Pile-up and calm",
    body:
      "The record gap at 113 is constructive interference: thirteen planks in a row under at least one crest, each tagged with the swell that took it. Twins are the opposite sign. At 29 and 31 every swell sits at a node twice, so small gaps are not sharp peaks but coordinated misses.",
  },
  {
    n: "V·VI",
    title: "Surfacing, and the duality",
    body:
      "Swell p breaks its first fresh plank at p², so the storm at x holds exactly π(√x) waves and mean gap ln x falls out of that crowding. The last plate puts the two transcriptions side by side: one square wave per prime, or one tone per zeta zero.",
  },
]

const TRY = [
  "Start on plate I and cycle the swell through 2, 3, 5, 7. Watch the wavelength track p exactly, and watch plank p stay green while all its multiples snap.",
  "On plate II, mute swell 5. Twenty-five, thirty-five and fifty-five stand back up as counterfeit primes, and the Mertens guard in the stat line drifts away from the real survivor count.",
  "Read the killer tags under the record gap on plate III. Swell 2 does half the work; the long wavelengths 7 and 11 turn up only for the planks nobody else could reach.",
  "On plate V, follow the amber staircase. Each step is a new swell surfacing at p², which is why the water gets rougher the farther out on the bridge you walk.",
  "Finish on plate VI and look at both clocks at once. The left ticks in n, the right in log x, and the compression rightward is the whole reason the zeros speak in logarithms.",
]

export default function StormPlatesPage() {
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
                <Waves size={14} strokeWidth={2.25} />
                storm plates · frontier math
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                The sieve, drawn as <span className="v3-accent">weather.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                Lay the integers out as a plank bridge and let one wave per prime roll under it.
                Each crest breaks the plank it lands on, and the planks that survive are the primes.
                Six cartoon plates take that one picture and push it until record gaps, twin primes
                and the zeta zeros all fall out of it.
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
              src="/storm-plates.html"
              title="Storm Plates: wave presentations of the sieve"
              initialHeight={2300}
            />
          </V3Reveal>
          <p className="v3-po-cap">
            One HTML file, no build step, no network. Every broken plank is re-derived by trial
            division against a live sieve rather than painted in, and each plate carries its own
            guard: Mertens density, the record gap at 113, the π(√x) staircase, the first three
            zeta zeros.
          </p>
        </div>
      </section>

      {/* THE CHANNELS ================================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <Compass size={18} strokeWidth={2.2} />
              <h2>The whole idea, twice</h2>
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

      {/* SIX PLATES ==================================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <Waves size={18} strokeWidth={2.2} />
              <h2>Six plates, one storm</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <p className="v3-po-lede">
              The plates are ordered so each one only needs the one before it. Nothing here requires
              complex analysis until the very last panel, and by then the analysis is just a second
              way of drawing what you have already watched happen.
            </p>
          </V3Reveal>
          <div className="v3-po-grid">
            {PLATES.map((m, i) => (
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
              <h2>Watch the water</h2>
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

      {/* THE BRIDGE TO THE OTHERS ====================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <Sigma size={18} strokeWidth={2.2} />
              <h2>Two transcriptions of the same water</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <div className="v3-po-math">
              <p>
                Plate VI is where this page hands off. The sieve can be written as one square wave
                per prime, periodic in n, or as one tone per zeta zero, periodic in log x:
              </p>
              <code className="v3-po-eq">
                Euler side · ∏ₚ (1 − p⁻ˢ)⁻¹ ⟷ explicit formula · Σ_ρ cos(γ·log x)
              </code>
              <p>
                Neither side is the storm; both are exact transcriptions of it. The{" "}
                <Link href="/projects/prime-orchestra">orchestra</Link> plays the right-hand side
                and reassembles the prime staircase out of those tones, while the{" "}
                <Link href="/projects/prime-zoo">zoo</Link> stays on the left and asks which
                constellations the swells can even permit. The twin plate here is the zoo&rsquo;s
                habitat law wearing water: offset {"{0, 2}"} lives because no residue row of any
                swell covers it.
              </p>
              <p>
                Where those tones come from is a separate question, answered on the{" "}
                <Link href="/projects/zeta-forge">forge</Link>, and where all of it sits relative to
                what is actually proven is the <Link href="/projects/prime-atlas">atlas</Link>.
              </p>
            </div>
          </V3Reveal>
        </div>
      </section>

      <PrimeCompanions current="storm-plates" />
    </div>
  )
}
