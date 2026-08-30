import Link from "next/link"
import { Compass, Layers, MousePointerClick } from "lucide-react"
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
            <span aria-current="page">Prime Atlas</span>
          </span>
        </nav>
        <h1>A terrain map of the territory around the primes</h1>
      </div>

      <p className="lede">
          Twenty-nine landmarks across seven kinds of ground, from the Euler spring to the
          parity cliff. It draws what is proven, what is merely believed, what nobody knows,
          and, most usefully, what has been proven <strong>impossible</strong> by the methods
          we have. The{" "}
          <Link href="/projects/prime-orchestra">orchestra</Link> and the{" "}
          <Link href="/projects/prime-zoo">zoo</Link> are both marked on it, because the map
          came first and the instruments were built where it pointed.
      </p>
      {/* HEADER ========================================================= */}

      {/* THE MAP ======================================================== */}
      <section className="beta-note-sec" style={{ paddingTop: 6, paddingBottom: 10 }}>
        <div >
          <ProjectEmbed
              src="/prime-atlas.html"
              title="Primality Atlas: an interactive terrain map of prime-number theory"
              fixed
            />
          <p className="quiet">
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
      <section className="beta-note-sec" style={{ paddingTop: 24 }}>
        <div >
          <div className="beta-sechead">
              <Compass size={18} strokeWidth={2.2} />
              <h2>Read the terrain</h2>
            </div>
          <p className="lede">
              The geography is not decorative. Water runs downhill from the Euler spring, and where
              a channel stops is exactly where a method stops.
            </p>
          <div className="piece-grid">
            {REGIONS.map((r) => (
              <div className="rail" key={r.k}>
                  <span className="beta-proj-k">{r.k}</span>
                  <h3>{r.title}</h3>
                  <p>{r.body}</p>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE LEGEND ==================================================== */}
      <section className="beta-note-sec" style={{ paddingTop: 24 }}>
        <div >
          <div className="beta-sechead">
              <Layers size={18} strokeWidth={2.2} />
              <h2>Seven kinds of ground</h2>
            </div>
          <p className="lede">
              Most maps of a field draw only the results. This one gives equal weight to the dark
              rooms and the no-go cliffs, because in number theory the barriers are theorems too,
              and they are the part that tells you where not to spend a decade.
            </p>
          <div className="beta-legend">
            {GROUND.map((g) => (
              <div className="beta-legend__row" key={g.label}>
                  <span className="beta-legend__sw" style={{ background: g.c }} aria-hidden />
                  <span className="beta-legend__lbl">{g.label}</span>
                  <span className="beta-legend__body">{g.body}</span>
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
              <h2>Three walks worth taking</h2>
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

      <PrimeCompanions current="prime-atlas" />
    </div>
  )
}
