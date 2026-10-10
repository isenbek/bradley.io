import Link from "next/link"
import type { Metadata } from "next"
import { ArrowUpRight } from "lucide-react"
import { peekNow } from "@/components/live/now-snapshot"
import { BenchCard, BenchGrid, type BenchItem } from "@/components/projects/BenchCard"
import { LinkCard } from "@/components/home/LinkCard"
import atlasPic from "@/components/projects/thumbs/prime-atlas.webp"
import zetaPic from "@/components/projects/thumbs/zeta-forge.webp"
import orchestraPic from "@/components/projects/thumbs/prime-orchestra.webp"
import zooPic from "@/components/projects/thumbs/prime-zoo.webp"
import stormPic from "@/components/projects/thumbs/storm-plates.webp"
import collapsePic from "@/components/projects/thumbs/critical-collapse.webp"
import treePic from "@/components/projects/thumbs/computer-tree.webp"

export const metadata: Metadata = {
  title: "Projects",
  description:
    "What is on the bench: chips rebuilt from their own dies, instruments reading real hardware, math instruments that run in the browser, and a few ideas that might not ship.",
  alternates: { canonical: "/projects" },
}

/**
 * Projects: the bench, curated.
 *
 * This page has been three things. First an index over 84 generated cards,
 * then 236 generated dossiers, then three cards and a paragraph explaining
 * where the rest had gone. None of the three was a list a person had chosen.
 * This one is: every card below was put here by hand, goes to a page that
 * exists, and says one specific thing about what is behind it.
 *
 * The rule for getting a card: there is something to open, and enough behind
 * it to be worth the space. Small experiments go in the sketches list at the
 * end, as a line each; a project with a private repository and no page
 * (Zephyr) is named there with nothing to open, because a link that goes
 * nowhere is a brochure.
 *
 * WEIGHT. The page opens on the chips, with one die photograph and two cards
 * printed larger, because that is the work with the most behind it. Every
 * other group fills its rows (two by two, or three by three) so nothing sits
 * alone at the end of a row looking like an afterthought.
 *
 * PICTURES. The die plate is visual6502's photograph (public/6502), with its
 * credit line under it. The six math thumbnails are screenshots of the
 * instruments themselves, taken from public/*.html on this server, cropped to
 * 640 by 400 and kept in components/projects/thumbs. Retake them if an
 * instrument's look changes.
 *
 * WHERE THE WORDS CAME FROM. The six math instruments carry the copy the old
 * home page's PrimalitySuite panel and Critical Collapse promo had (git show
 * 4618109:components/home/PrimalitySuite.tsx, 4618109:app/page.tsx). Hotbits,
 * Knock knock and the 6502 keep the lines this page already had. Meatball,
 * Dragonfli, Fleet and the trades tools use the ledes of their own pages.
 * The last group's heading and first sentence are the old /lab page's.
 *
 * WHAT THE DOTS ARE. An instrument card prints components/live LiveDot with
 * its words: filled and "is live" only while that instrument's row of
 * /api/now is live on the reader's clock, hollow and "is offline" otherwise.
 * Nothing on this page is lit by anything except a real answer. The server's
 * snapshot (peekNow) goes in with the cards, so an instrument that was
 * already offline says so in the HTML instead of "checking" (BenchDot). That
 * makes the page dynamic, as /bench is: a cached page would carry an old
 * snapshot. The detail (last heard, the reading, why not) is /bench.
 *
 * The die data behind the first group is other people's (visual6502.org and
 * Quietust, CC BY-NC-SA) and the group says so; the one die photograph here
 * carries its own credit line, as on app/6502.
 */

export const dynamic = "force-dynamic"

interface Group {
  id: string
  title: string
  count: number
}

const CHIPS_FEATURE: BenchItem[] = [
  {
    href: "/6502",
    title: "The 6502",
    kind: "simulator",
    line: "A transistor-level simulation of the chip that made home computing affordable. One 6502 was decapped, photographed and traced by hand; this runs those 3,510 transistors, solved to a fixed point twice per clock cycle. Plus a link-checked archive of everything the visual6502 team left behind.",
    tech: ["Rust", "WebAssembly", "WebGL2"],
    more: [{ href: "https://tinymachines.ai/6502", label: "Run it at tinymachines.ai" }],
  },
  {
    href: "https://tinymachines.ai/nes",
    title: "The NES, from the transistors up",
    kind: "console",
    line: "A working console in the browser, assembled from fast chip models that are derived from, and checked against, switch-level simulations of its two chips. Sound and a simulated composite video path included. To play, you supply the cartridge file, and it never leaves your browser.",
    tech: ["Rust", "WebAssembly"],
    more: [{ href: "https://tinymachines.ai/nes/play", label: "Play it" }],
  },
]

const CHIPS_MORE: BenchItem[] = [
  {
    href: "https://tinymachines.ai/autopsy",
    title: "The autopsy",
    kind: "analysis",
    line: "Games taken apart by running them. A pipeline plays a cartridge, names the routines its rules recognise from what they did at run time, and writes a listing that assembles back to the cartridge byte for byte. Published as shape only: no ROM data.",
    tech: ["Rust", "WebAssembly", "Python"],
  },
  {
    href: "https://github.com/tinymachines/halfphi",
    title: "halfphi",
    kind: "library",
    state: "early",
    line: "The simulation engine, extracted as its own MIT library: switch-level simulation and analysis of chip netlists traced from die photographs. Five chips load through the same calls.",
    tech: ["Rust", "MIT licence"],
  },
  {
    href: "https://tinymachines.ai/nes/bench",
    title: "The NES bench",
    kind: "hardware",
    state: "in progress",
    line: "An unmodified NES-001 on the desk with a controller-port bridge, relays and an oscilloscope under one script, so the real part and the model can be driven by the same inputs and compared.",
    tech: ["Arduino UNO", "Raspberry Pi 4", "SCPI", "KiCad"],
    more: [{ href: "https://github.com/tinymachines/nes-bench", label: "The repository" }],
  },
]

const PLATFORMS: BenchItem[] = [
  {
    href: "https://tinymachines.ai/style",
    title: "The tinymachines style kit",
    kind: "design system",
    line: "The design system this site wears: tokens, plain-CSS components and a zoo of normative specimens. Its first rule is the one you are looking at. Paper is documentation; a dark panel is the machine talking.",
    tech: ["CSS custom properties", "No framework"],
    more: [{ href: "https://tinymachines.ai/style/zoo", label: "The specimen zoo" }],
  },
  {
    href: "/housecalls/tools",
    title: "Free tools for the trades",
    kind: "field tools",
    line: "A quote pad, a change-order pad with signature, a job photo stamper and a voice material list. No app store, no account, no subscription, and nothing you type, sign or photograph uploads anywhere. They work for the person holding the phone and report to no one.",
    tech: ["Browser only", "Works without signal"],
    more: [{ href: "/housecalls", label: "House Calls" }],
  },
]

const INSTRUMENTS: BenchItem[] = [
  {
    href: "/trng",
    title: "Hotbits",
    kind: "entropy source",
    line: "Random numbers from radioactive decay, tested continuously. A Geiger counter, a Raspberry Pi, and a comparison of one gap between decay events with the next. Nothing generates a number.",
    tech: ["Geiger counter", "Raspberry Pi", "NIST SP 800-90B"],
    dot: "geiger",
  },
  {
    href: "/meatball",
    title: "Meatball",
    kind: "sensory machine",
    line: "A caseless home server built from other people's cast-offs, taught to see, hear, think and speak. Every model runs on the metal and nothing touches the cloud.",
    tech: ["Salvaged GPUs", "Local LLM", "Whisper"],
    dot: "cameras",
    more: [{ href: "/meatball/notes/senses", label: "Field notes" }],
  },
  {
    href: "/dragonfli",
    title: "Dragonfli",
    kind: "airspace receiver",
    line: "A Raspberry Pi, a 1090 MHz ADS-B receiver and an FAA registry lookup, running in the garage. Every aircraft is one this antenna heard directly. Nothing is fetched from a flight-tracking service.",
    tech: ["ADS-B", "GPS", "MapLibre", "UDP"],
    dot: "bus",
    more: [
      { href: "/dragonfli/airspace", label: "Airspace map" },
      { href: "/dragonfli/worldevent", label: "The perception bus" },
    ],
  },
  {
    href: "/visitors",
    title: "Knock knock",
    kind: "door log",
    line: "Everything that has tried the doors on this host, across every site it serves. Three tiers fused into one view: dropped at the edge by the router, trapped at the door by the scanner trap, and served. Almost all of it is automated.",
    tech: ["nginx", "OpenWrt"],
    dot: "firewall",
  },
  {
    href: "/fleet",
    title: "Fleet",
    kind: "node health",
    line: "Every node in the cluster reports for itself over a UDP bus: disk, temperature, load, radio and uplink. This reads the collector that fuses them.",
    tech: ["UDP bus"],
    dot: "fleet",
  },
]

const MATH: BenchItem[] = [
  {
    href: "/projects/prime-atlas",
    title: "Primality Atlas",
    kind: "the map",
    line: "Twenty-nine landmarks from the Euler spring to the parity cliff, drawn as ground you can walk: what is proven, what is merely believed, what nobody knows, and what has been proven impassable.",
    tech: ["One HTML file", "No network requests"],
    pic: { ...atlasPic, alt: "The Primality Atlas: a dark terrain map of prime-number theory, its landmarks drawn as labelled rings and squares across coloured regions of proven, conjectured and open ground" },
  },
  {
    href: "/projects/zeta-forge",
    title: "Zeta Forge",
    kind: "the workbench",
    line: "Build ζ(s) = Σ n⁻ˢ one term at a time. Each term is an arrow; where the walk lands is the value, and a zero is the walk that comes home to the origin.",
    tech: ["One HTML file", "No network requests"],
    pic: { ...zetaPic, alt: "Zeta Forge: the partial sums of the zeta series drawn as a walk of short arrows that spirals in to a point, with the step count and the running value printed under it" },
  },
  {
    href: "/projects/prime-orchestra",
    title: "Prime Orchestra",
    kind: "the reconstruction",
    line: "Rebuild the prime staircase from the nontrivial zeros of the Riemann zeta function, one wave at a time. Feed the zeros in and watch the primes resolve out of pure harmonics.",
    tech: ["One HTML file", "No network requests"],
    pic: { ...orchestraPic, alt: "Prime Orchestra: the true prime staircase drawn as a rising line over a field of vertical marks, one at each prime, with the wave controls beneath" },
  },
  {
    href: "/projects/prime-zoo",
    title: "Primality Zoo",
    kind: "the field instruments",
    line: "Three scopes over a live two-million sieve. Test whether a prime constellation can exist at all, watch the residue-class race, and read the matrix where consecutive primes avoid repeating themselves.",
    tech: ["One HTML file", "No network requests"],
    pic: { ...zooPic, alt: "Primality Zoo: a grid of residue rows for one prime pattern, cells lit where the pattern occupies a class, above a chart of the counted occurrences against the predicted curve" },
  },
  {
    href: "/projects/storm-plates",
    title: "Storm Plates",
    kind: "the weather",
    line: "The sieve as wave interference, in six plates. One swell per prime under a plank bridge: crests break planks, survivors are prime, and the last plate shows the same storm written twice, once in primes and once in zeros.",
    tech: ["One HTML file", "No network requests"],
    pic: { ...stormPic, alt: "Storm Plates: one swell drawn under a row of numbered planks, the planks it breaks marked, with a second plate of stacked swells below" },
  },
  {
    href: "/projects/critical-collapse",
    title: "Critical Collapse",
    kind: "numerical relativity",
    line: "Einstein's equations, integrating live on your device. Tune a scalar pulse to the knife edge between dispersal and collapse, bisect for the threshold, and measure the universal exponent γ ≈ 0.374 yourself.",
    tech: ["In the browser", "No external requests"],
    pic: { ...collapsePic, alt: "Critical Collapse: an amber ring of field energy seen from above, beside plots of the field and the horizon signal over radius, with the amplitude slider below" },
  },
]

const HISTORY: BenchItem[] = [
  {
    href: "/projects/computer-tree",
    title: "The Computer Tree",
    kind: "dataset",
    line: "The US Army's 1961 family tree of the computer, transcribed and grown one ring per decade to 2025. 542 machines from ENIAC to Fugaku; pick one and the tree draws its line home. The data and its card are free to take, weaknesses stated.",
    tech: ["542 machines", "614 links", "CSV and JSON"],
    pic: {
      ...treePic,
      alt: "The Computer Tree: a radial tree of computers around ENIAC, teal dots from the 1961 chart, orange dots added since, one lineage traced in blue",
    },
  },
]

const IDEAS: BenchItem[] = [
  {
    href: "/projects/turfy",
    title: "Turfy",
    kind: "hardware design",
    state: "v0.1",
    line: "An AI sprinkler brain that fails back to dumb. A weather-informed sidecar for a 1990s Rain Bird that only takes the lawn when it's provably healthy: hardware watchdog, transfer relays, fail-safe by design.",
    tech: ["Raspberry Pi", "555 watchdog", "MCP23017", "Relays"],
    pic: {
      src: "/turfy/rainbird-faceplate.webp",
      width: 952,
      height: 1269,
      alt: "The faceplate of the Rain Bird ESP-6Si controller the sidecar is designed for, with its analog scheduling dial",
    },
  },
]

/**
 * Sketches: things that exist and are small, one line each. The two with
 * public repositories link to them; Zephyr's repository is private, so it is
 * named and nothing more.
 */
interface Sketch {
  title: string
  href?: string
  year: string
  line: string
}

const SKETCHES: Sketch[] = [
  {
    title: "Sovereign",
    href: "https://github.com/tinymachines/sovereign",
    year: "2025",
    line: "An assembly-like agentic programming language designed for self-improving systems: 32 base instructions on a small virtual machine, with opcodes that ask a local model to write code and to rewrite it after an error.",
  },
  {
    title: "ADDAI",
    href: "https://github.com/tinymachines/addai",
    year: "2025",
    line: "A homegrown EEG monitor. Brainwave readings arrive from a NeuroSky-based headset over a serial port and are drawn live in a web page.",
  },
  {
    title: "Zephyr",
    year: "private",
    line: "A mesh network of AI nodes that talk to each other in raw 802.11 frames, without a traditional networking stack. The repository is private, so there is nothing here to open.",
  },
]

/** The jump row: a short name for each group and how many things are in it. */
const GROUPS: Group[] = [
  { id: "chips", title: "Chips", count: CHIPS_FEATURE.length + CHIPS_MORE.length },
  { id: "platforms", title: "Tools", count: PLATFORMS.length },
  { id: "instruments", title: "Instruments", count: INSTRUMENTS.length },
  { id: "math", title: "Math", count: MATH.length },
  { id: "history", title: "History", count: HISTORY.length },
  { id: "ideas", title: "Ideas", count: IDEAS.length + SKETCHES.length },
]

const TOTAL = GROUPS.reduce((n, g) => n + g.count, 0)

const ALL: { title: string; href: string }[] = [
  ...CHIPS_FEATURE,
  ...CHIPS_MORE,
  ...PLATFORMS,
  ...INSTRUMENTS,
  ...MATH,
  ...HISTORY,
  ...IDEAS,
  ...SKETCHES.filter((k): k is Sketch & { href: string } => Boolean(k.href)),
]

const DESCRIPTION =
  "What is on the bench: chips rebuilt from their own dies, instruments reading real hardware, math instruments that run in the browser, and a few ideas that might not ship."


export default async function ProjectsPage() {
  const initial = await peekNow()

  return (
    <div className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://bradley.io/projects",
            url: "https://bradley.io/projects",
            name: "Projects · bradley.io",
            description: DESCRIPTION,
            isPartOf: { "@id": "https://bradley.io/#website" },
            about: { "@id": "https://bradley.io/#person" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Projects", item: "https://bradley.io/projects" },
              ],
            },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: ALL.length,
              itemListElement: ALL.map((it, n) => ({
                "@type": "ListItem",
                position: n + 1,
                name: it.title,
                url: it.href.startsWith("/") ? `https://bradley.io${it.href}` : it.href,
              })),
            },
          }),
        }}
      />

      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Projects</span>
          </span>
        </nav>
        <h1>Projects</h1>
      </div>

      <p className="lede">
        {TOTAL} things on the bench. Chips rebuilt from their own dies, instruments reading real
        hardware, math you can operate, and a few ideas that might not ship. Most
        shipped with Claude as co-pilot. The sites are self-hosted; the repositories are on GitHub.
      </p>

      {/* The door to the Thought Lab (owner's org model, 2026-10-04): this
          page is the lab's work as seen from bradley.io; meatball.ai is the
          lab itself, where every lab site is shown in its own style. One
          card, full width, before the groups, so a builder finds it first. */}
      <div className="beta-labdoor">
        <LinkCard
          href="https://meatball.ai"
          title="The Thought Lab"
          go="meatball.ai"
          tags={["tinymachines", "SysForge", "the weird stuff"]}
        >
          Artisanal intelligence, hand-rolled. Meatball Labs is where Spicy and Bear dream things
          up and build them, and where every lab site lives in its own style.
        </LinkCard>
      </div>

      <nav className="beta-bench-jump" aria-label="Groups on this page">
        {GROUPS.map((g) => (
          <a className="tag" href={`#${g.id}`} key={g.id}>
            {g.title} <b>{g.count}</b>
          </a>
        ))}
      </nav>

      <section id="chips" className="beta-bench-group" aria-labelledby="chips-h">
        <div className="prose beta-sec">
          <h2 id="chips-h">Chips and consoles</h2>
          <p>
            A processor and a console, simulated from photographs of their own dies and not from a
            description of what they do. The netlists were traced by the visual6502 project and by
            Quietust, and are theirs (CC BY-NC-SA). What I built is the engines that run them, the
            tests that hold every faster engine to the switch-level one, and the bench that puts a
            real console beside the model. It all lives at{" "}
            <a href="https://tinymachines.ai" rel="noopener">
              tinymachines.ai
            </a>
            .
          </p>
        </div>

        <figure className="beta-die beta-bench-plate">
          <div className="beta-die__frame">
            <img
              src="/6502/hero-surface.webp"
              width={1000}
              height={617}
              alt="A stretch of the MOS 6502 die photographed from above with its metal still on: a dense green-gold weave of wiring, with bond pads along the left edge"
              decoding="async"
            />
            <span className="beta-die__tag">MOS 6502 · surface</span>
          </div>
          <figcaption>
            Part of the 6502 die, metal still on, from the photographs the visual6502 team traced
            the chip from. The simulator in the first card runs that trace.{" "}
            <span className="beta-bench-plate__credit">
              Photograph: the visual6502 project, CC BY-NC-SA 3.0.
            </span>
          </figcaption>
        </figure>

        <BenchGrid items={CHIPS_FEATURE} pairs feature />
        <BenchGrid items={CHIPS_MORE} />
      </section>

      <section id="platforms" className="beta-bench-group" aria-labelledby="platforms-h">
        <div className="prose beta-sec">
          <h2 id="platforms-h">Tools</h2>
          <p>
            Things other people can use: the design system under this page, and four tools for
            people who work out of a truck. The platforms I architect and build for clients are
            on <Link href="/work">the work page</Link>.
          </p>
        </div>
        <BenchGrid items={PLATFORMS} pairs />
      </section>

      <section id="instruments" className="beta-bench-group" aria-labelledby="instruments-h">
        <div className="prose beta-sec">
          <h2 id="instruments-h">Instruments on this server</h2>
          <p>
            Dashboards that read real hardware on this network: a Geiger counter, radios, cameras, a
            router. Hardware goes away, and when it does the page says so. Each card carries a dot:
            filled means the instrument is answering right now, hollow means it is not. The detail
            is on <Link href="/bench">the bench</Link>.
          </p>
        </div>
        <BenchGrid items={INSTRUMENTS} initial={initial} />
      </section>

      <section id="math" className="beta-bench-group" aria-labelledby="math-h">
        <div className="prose beta-sec">
          <h2 id="math-h">Math instruments</h2>
          <p>
            A map of prime-number theory and four machines built where it pointed: forge zeta, hear
            its zeros play the primes, probe the primes directly, then watch the sieve run as
            weather. All five run in the browser, no dependencies, no network. The sixth is general
            relativity, and it is solved in your browser too.
          </p>
        </div>
        <BenchGrid items={MATH} />
      </section>

      <section id="history" className="beta-bench-group" aria-labelledby="history-h">
        <div className="prose beta-sec">
          <h2 id="history-h">History</h2>
          <p>
            Where the machines came from. A lineage chart drawn in 1961, carried forward to the
            processors in your pocket and the supercomputers at the top of the list.
          </p>
        </div>
        <BenchGrid items={HISTORY} />
      </section>

      <section id="ideas" className="beta-bench-group" aria-labelledby="ideas-h">
        <div className="prose beta-sec">
          <h2 id="ideas-h">Things that might not ship</h2>
          <p>
            Hardware hacks, signal toys, AI agents off the leash. The room where the next product
            gets sketched, and most of the sketches stay sketches.
          </p>
        </div>
        <div className="beta-bench-grid beta-bench-grid--pairs">
          {IDEAS.map((item) => (
            <BenchCard item={item} key={item.href} />
          ))}
          <section className="rail beta-bench-sketches" aria-labelledby="sketches-h">
            <h3 id="sketches-h">
              Sketches <span className="beta-bench-count">{SKETCHES.length}</span>
            </h3>
            <ul className="rail-list">
              {SKETCHES.map((k) => (
                <li key={k.title}>
                  <span className="beta-bench-sketches__head">
                    {k.href ? (
                      <a href={k.href} target="_blank" rel="noopener noreferrer">
                        {k.title}
                        <span className="sr-only"> (GitHub, opens in a new tab)</span>
                        <ArrowUpRight size={13} strokeWidth={2.2} aria-hidden="true" />
                      </a>
                    ) : (
                      <b>{k.title}</b>
                    )}
                    <span className="tag">{k.year}</span>
                  </span>
                  <span>{k.line}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <div className="prose beta-sec beta-bench-out">
        <h2>The rest</h2>
        <p>
          This is the short list. <Link href="/bench">The bench</Link> lists every page this server
          serves and says which instruments are up. <Link href="/work">The work page</Link> has the
          client projects, and counts every repository across four GitHub organisations from the
          commit log. The lab itself is at <a href="https://meatball.ai">meatball.ai</a>.
        </p>
      </div>
    </div>
  )
}
