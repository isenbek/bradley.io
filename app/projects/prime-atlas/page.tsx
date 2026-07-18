import Link from "next/link"
import { ArrowLeft, Map, Compass, Layers, MousePointerClick } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { ProjectEmbed } from "@/components/projects/ProjectEmbed"
import { PrimeCompanions } from "@/components/projects/PrimeCompanions"

const REGIONS = [
  {
    k: "WEST",
    title: "Analytic highlands",
    body:
      "Where the Euler spring runs, ζ as a product over the primes. It only flows for re(s) > 1: past the Convergence Wall the product diverges. The Continuation Bridge carries the function over that wall, but not the product structure, and that asymmetry is the whole predicament in one picture.",
  },
  {
    k: "CENTER",
    title: "Critical canyon",
    body:
      "The strip where every nontrivial zero is proven to live, with the critical line as the fault down the middle and the orchestra's 300 residents marked along it. The Line itself is a theorem. Full occupancy is the Riemann Hypothesis, and only about 41 to 42 percent is proven.",
  },
  {
    k: "EAST",
    title: "Pastures and grazing fields",
    body:
      "Proven country up north, PNT and Dirichlet and Green–Tao. Conjectured country down south, the Hardy–Littlewood grazing fields where the k-tuple conjecture feeds the species pens. The Aqueduct runs east from the canyon carrying the explicit formula.",
  },
  {
    k: "OFFSHORE",
    title: "Function-field isle",
    body:
      "The Riemann Hypothesis, proven, in the geometric analogue: Weil in 1948, Deligne in 1974. It sits across a strait labeled the missing geometry over ℤ. The answer exists in a neighboring world and nobody has built the boat.",
  },
]

const GROUND = [
  { c: "#6fe08f", label: "PROVEN", body: "Theorems. You can stand on it." },
  { c: "#ffb454", label: "CONJECTURED", body: "Believed, load-bearing, unproven." },
  { c: "#4f8fd8", label: "DARK ROOM", body: "Nobody knows. The Hilbert–Pólya chair sits empty." },
  { c: "#ff4f7b", label: "CLIFF · NO-GO", body: "Proven impassable. The parity barrier is the big one." },
  { c: "#3fe0d0", label: "INSTRUMENT", body: "Something on this site you can actually run." },
  { c: "#8fa3ab", label: "EMPIRICAL", body: "Computed, not proven. Every zero ever checked." },
  { c: "#5b6d74", label: "PLANNED", body: "Backlog. The GAPFORMER rig is a drill site, not a result." },
]

const TRY = [
  "Tap the Convergence Wall, then the Lookalike Swamp. Together they say something brutal: any proof of RH has to use the Euler product at re = ½, on the far side of a wall the product cannot cross.",
  "Follow the amber duct arcing over the top from the Euler Spring to the Coverage Court. Hardy–Littlewood constants are Euler products in miniature, so that structure reaches the zoo without passing through the canyon or needing a single zero.",
  "Walk south to the Parity Cliff and look across at the Twin Den. Bounded gaps at 246 is an outpost on this side of the cliff. The last stretch to 2 is below the cliff face, and sieve methods provably cannot climb down it.",
]

export default function PrimeAtlasPage() {
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
                <Map size={14} strokeWidth={2.25} />
                primality atlas · frontier math
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                A terrain map of the <span className="v3-accent">territory around the primes.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                Twenty-nine landmarks across seven kinds of ground, from the Euler spring to the
                parity cliff. It draws what is proven, what is merely believed, what nobody knows,
                and, most usefully, what has been proven <strong>impossible</strong> by the methods
                we have. The{" "}
                <Link href="/projects/prime-orchestra">orchestra</Link> and the{" "}
                <Link href="/projects/prime-zoo">zoo</Link> are both marked on it, because the map
                came first and the instruments were built where it pointed.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* THE MAP ======================================================== */}
      <section className="v3-section" style={{ paddingTop: 6, paddingBottom: 10 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <ProjectEmbed
              src="/prime-atlas.html"
              title="Primality Atlas: an interactive terrain map of prime-number theory"
              fixed
            />
          </V3Reveal>
          <p className="v3-po-cap">
            Drag to pan, wheel or pinch to zoom, tap any landmark for its dossier. Hand-drawn SVG,
            no map library, no tiles.{" "}
            <a href="/prime-atlas.html" target="_blank" rel="noreferrer">
              Open it full screen
            </a>{" "}
            for the whole territory at once.
          </p>
        </div>
      </section>

      {/* THE REGIONS =================================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <Compass size={18} strokeWidth={2.2} />
              <h2>Read the terrain</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <p className="v3-po-lede">
              The geography is not decorative. Water runs downhill from the Euler spring, and where
              a channel stops is exactly where a method stops.
            </p>
          </V3Reveal>
          <div className="v3-po-grid">
            {REGIONS.map((r, i) => (
              <V3Reveal key={r.k} delay={100 + i * 55}>
                <div className="v3-po-card">
                  <span className="v3-po-card__k">{r.k}</span>
                  <h3>{r.title}</h3>
                  <p>{r.body}</p>
                </div>
              </V3Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* THE LEGEND ==================================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-cardhead">
              <Layers size={18} strokeWidth={2.2} />
              <h2>Seven kinds of ground</h2>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <p className="v3-po-lede">
              Most maps of a field draw only the results. This one gives equal weight to the dark
              rooms and the no-go cliffs, because in number theory the barriers are theorems too,
              and they are the part that tells you where not to spend a decade.
            </p>
          </V3Reveal>
          <div className="v3-atlas-legend">
            {GROUND.map((g, i) => (
              <V3Reveal key={g.label} delay={90 + i * 40}>
                <div className="v3-atlas-legend__row">
                  <span className="v3-atlas-legend__sw" style={{ background: g.c }} aria-hidden />
                  <span className="v3-atlas-legend__lbl">{g.label}</span>
                  <span className="v3-atlas-legend__body">{g.body}</span>
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
              <h2>Three walks worth taking</h2>
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

      <PrimeCompanions current="prime-atlas" />
    </div>
  )
}
