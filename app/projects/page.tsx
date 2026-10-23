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
import { JumpNav, PageHead, Section } from "@/components/page"

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
    line: "The chip that made home computers affordable, simulated one transistor at a time. A team opened up a real 6502, photographed it and traced every wire by hand. This runs their trace: 3,510 transistors, updated twice per clock tick. It also keeps an archive of everything that team published, with every link checked.",
    tech: ["Rust", "WebAssembly", "WebGL2"],
    more: [{ href: "https://tinymachines.ai/6502", label: "Run it at tinymachines.ai" }],
  },
  {
    href: "https://tinymachines.ai/nes",
    title: "The NES, from the transistors up",
    kind: "console",
    line: "A working Nintendo in the browser. Its two chips run as fast models, and each model is checked against a slower one that copies the real chip wire for wire. It has sound and the fuzz of an old TV signal. You bring the game file, and it never leaves your browser.",
    tech: ["Rust", "WebAssembly"],
    more: [{ href: "https://tinymachines.ai/nes/play", label: "Play it" }],
  },
]

const CHIPS_MORE: BenchItem[] = [
  {
    href: "https://tinymachines.ai/autopsy",
    title: "The autopsy",
    kind: "analysis",
    line: "Old games taken apart by playing them. A program runs the game, watches what each piece of code does, and names the pieces it recognises. The result is a readable listing that rebuilds the original game exactly. Only the structure is published, never the game itself.",
    tech: ["Rust", "WebAssembly", "Python"],
  },
  {
    href: "https://github.com/tinymachines/halfphi",
    title: "halfphi",
    kind: "library",
    state: "early",
    line: "The simulation engine on its own, as a free open-source library. It runs and analyses chips traced from photographs of their silicon. Five chips load the same way.",
    tech: ["Rust", "MIT licence"],
  },
  {
    href: "https://tinymachines.ai/nes/bench",
    title: "The NES bench",
    kind: "hardware",
    state: "in progress",
    line: "A stock Nintendo on the desk, wired so one script can press its buttons and measure its signals. The real console and the simulation get the same inputs, and their outputs are compared.",
    tech: ["Arduino UNO", "Raspberry Pi 4", "SCPI", "KiCad"],
    more: [{ href: "https://github.com/tinymachines/nes-bench", label: "The repository" }],
  },
]

const PLATFORMS: BenchItem[] = [
  {
    href: "https://tinymachines.ai/style",
    title: "The tinymachines style kit",
    kind: "design system",
    line: "The design system this site is built with: colours, type and plain-CSS components, with a gallery of every piece. Its first rule is the one you are looking at. Light paper is for writing. A dark panel is a machine reporting.",
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
    line: "Truly random numbers from radioactive decay, tested around the clock. A Geiger counter clicks, a Raspberry Pi times the gaps between clicks, and each gap is compared with the next. No formula makes up a number.",
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
    line: "Everything that has knocked on this server, across every site it hosts. One view, three outcomes: blocked by the router, caught by a trap for scanners, or let in. Almost all of it is bots.",
    tech: ["nginx", "OpenWrt"],
    dot: "firewall",
  },
  {
    href: "/fleet",
    title: "Fleet",
    kind: "node health",
    line: "Every computer in the house network reports its own health: disk, temperature, load, radio and internet link. This page shows them all in one place.",
    tech: ["UDP bus"],
    dot: "fleet",
  },
]

const MATH: BenchItem[] = [
  {
    href: "/projects/prime-atlas",
    title: "Primality Atlas",
    kind: "the map",
    line: "Prime-number theory drawn as a map you can explore, with twenty-nine landmarks. It shows what is proven, what is only believed, what nobody knows, and what has been proven impossible.",
    tech: ["One HTML file", "No network requests"],
    pic: { ...atlasPic, alt: "The Primality Atlas: a dark terrain map of prime-number theory, its landmarks drawn as labelled rings and squares across coloured regions of proven, conjectured and open ground" },
  },
  {
    href: "/projects/zeta-forge",
    title: "Zeta Forge",
    kind: "the workbench",
    line: "Build the zeta function, ζ(s) = Σ n⁻ˢ, one term at a time. Each term is an arrow. Where the arrows end up is the value. A zero is a walk that comes back to where it started.",
    tech: ["One HTML file", "No network requests"],
    pic: { ...zetaPic, alt: "Zeta Forge: the partial sums of the zeta series drawn as a walk of short arrows that spirals in to a point, with the step count and the running value printed under it" },
  },
  {
    href: "/projects/prime-orchestra",
    title: "Prime Orchestra",
    kind: "the reconstruction",
    line: "Rebuild the count of prime numbers from waves, one at a time. Each wave comes from a zero of the Riemann zeta function. Add enough of them and the primes appear out of pure harmonics.",
    tech: ["One HTML file", "No network requests"],
    pic: { ...orchestraPic, alt: "Prime Orchestra: the true prime staircase drawn as a rising line over a field of vertical marks, one at each prime, with the wave controls beneath" },
  },
  {
    href: "/projects/prime-zoo",
    title: "Primality Zoo",
    kind: "the field instruments",
    line: "Three tools for looking at the first two million numbers. Test whether a pattern of primes can exist at all. Watch primes race to fill different remainders. See how a prime's last digit tends not to repeat in the next one.",
    tech: ["One HTML file", "No network requests"],
    pic: { ...zooPic, alt: "Primality Zoo: a grid of residue rows for one prime pattern, cells lit where the pattern occupies a class, above a chart of the counted occurrences against the predicted curve" },
  },
  {
    href: "/projects/storm-plates",
    title: "Storm Plates",
    kind: "the weather",
    line: "The oldest way to find primes, drawn as waves in six pictures. Each prime sends a wave under a bridge of numbered planks. Where a crest breaks a plank, that number is out. The planks left standing are prime. The last picture shows the same storm two ways: once from primes, once from zeros.",
    tech: ["One HTML file", "No network requests"],
    pic: { ...stormPic, alt: "Storm Plates: one swell drawn under a row of numbered planks, the planks it breaks marked, with a second plate of stacked swells below" },
  },
  {
    href: "/projects/critical-collapse",
    title: "Critical Collapse",
    kind: "numerical relativity",
    line: "Einstein's equations, solved live on your device. Tune a pulse of energy to the edge between flying apart and collapsing into a black hole. Narrow in on the tipping point, and measure the universal constant γ ≈ 0.374 yourself.",
    tech: ["In the browser", "No external requests"],
    pic: { ...collapsePic, alt: "Critical Collapse: an amber ring of field energy seen from above, beside plots of the field and the horizon signal over radius, with the amplitude slider below" },
  },
]

const HISTORY: BenchItem[] = [
  {
    href: "/projects/computer-tree",
    title: "The Computer Tree",
    kind: "dataset",
    line: "The US Army's 1961 family tree of the computer, copied out and grown one ring per decade to 2025. It holds 542 machines, from ENIAC to Fugaku. Pick one and the tree traces its ancestry. The data is free to take, with its known gaps written down.",
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
    line: "An AI sprinkler brain that falls back to the old timer. It sits beside a 1990s Rain Bird controller and waters by the weather. It only takes over while it is provably healthy. If anything fails, relays hand the lawn back to the Rain Bird.",
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
    line: "A tiny programming language for programs that improve themselves. It has 32 basic instructions. Some of them ask a local AI model to write code, and to rewrite it after an error.",
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
    line: "A network of AI devices that talk to each other directly over raw Wi-Fi signals, with no ordinary internet plumbing. The code is private, so there is nothing here to open.",
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

      <PageHead
        crumbs={[{ label: "Projects" }]}
        title="Projects"
        lede={
          <>
            {TOTAL} things on the bench. Chips rebuilt from their own dies, instruments reading real
            hardware, math you can operate, and a few ideas that might not ship. Most were built
            with Claude as co-pilot. The sites run on my own servers, and the code is on GitHub.
          </>
        }
      />

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
          Artisanal intelligence, hand-rolled. Meatball Labs is the home lab where the side projects
          get dreamed up and built. Each of its sites keeps its own style.
        </LinkCard>
      </div>

      <JumpNav items={GROUPS.map((g) => ({ id: g.id, label: g.title, count: g.count }))} />

      <section id="chips" className="beta-bench-group" aria-labelledby="chips-h">
        <Section id="chips-h" title="Chips and consoles">
          <p>
            A processor and a games console, simulated from photographs of their actual silicon,
            not from a description of what they should do. The wiring maps were traced by the
            visual6502 project and by Quietust, and are theirs (CC BY-NC-SA). I built the engines
            that run them, the tests that keep every fast engine faithful to the exact one, and the
            bench that sets a real console beside the simulation. It all lives at{" "}
            <a href="https://tinymachines.ai" rel="noopener">
              tinymachines.ai
            </a>
            .
          </p>
        </Section>

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
        <Section id="platforms-h" title="Tools">
          <p>
            Things other people can use: the design system under this page, and four tools for
            people who work out of a truck. The platforms I architect and build for clients are
            on <Link href="/work">the work page</Link>.
          </p>
        </Section>
        <BenchGrid items={PLATFORMS} pairs />
      </section>

      <section id="instruments" className="beta-bench-group" aria-labelledby="instruments-h">
        <Section id="instruments-h" title="Instruments on this server">
          <p>
            Dashboards that read real hardware on this network: a Geiger counter, radios, cameras, a
            router. Hardware goes away, and when it does the page says so. Each card carries a dot:
            filled means the instrument is answering right now, hollow means it is not. The detail
            is on <Link href="/bench">the bench</Link>.
          </p>
        </Section>
        <BenchGrid items={INSTRUMENTS} initial={initial} />
      </section>

      <section id="math" className="beta-bench-group" aria-labelledby="math-h">
        <Section id="math-h" title="Math instruments">
          <p>
            A map of prime-number theory, and four tools built from it. Build the zeta function,
            hear its zeros play the primes, test the primes directly, and watch the oldest
            prime-finding method run as weather. All five run in your browser with nothing to
            install and nothing fetched. The sixth is Einstein's gravity, also solved in your
            browser.
          </p>
        </Section>
        <BenchGrid items={MATH} />
      </section>

      <section id="history" className="beta-bench-group" aria-labelledby="history-h">
        <Section id="history-h" title="History">
          <p>
            Where the machines came from. A lineage chart drawn in 1961, carried forward to the
            processors in your pocket and the supercomputers at the top of the list.
          </p>
        </Section>
        <BenchGrid items={HISTORY} />
      </section>

      <section id="ideas" className="beta-bench-group" aria-labelledby="ideas-h">
        <Section id="ideas-h" title="Things that might not ship">
          <p>
            Hardware hacks, radio toys and AI experiments. This is where the next product gets
            sketched. Most sketches stay sketches.
          </p>
        </Section>
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

      <Section className="beta-bench-out" title="The rest">
        <p>
          This is the short list. <Link href="/bench">The bench</Link> lists every page this server
          serves and says which instruments are up. <Link href="/work">The work page</Link> has the
          client projects, and counts every repository across four GitHub organisations from the
          commit log. The lab itself is at <a href="https://meatball.ai">meatball.ai</a>.
        </p>
      </Section>
    </div>
  )
}
