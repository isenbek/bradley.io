import Link from "next/link"
import { peekNow } from "@/components/live/now-snapshot"
import { listDocSlugs } from "@/lib/housecalls/docs"
import { BenchBoard, type BenchInstrument, type BenchPage } from "@/components/projects/BenchBoard"

/**
 * The bench: every page this server serves, and whether its instrument is up.
 *
 * The old site had /lab, a hub of 24 cards in six groups ("Things that might
 * not ship."), and when it went, discovery went with it: the menu sheet was
 * the only index, and two dozen pages had no entry in it. This is the hub
 * again, done as an inventory and not as a showcase. Its one job is "is it
 * up, and where is it". The curated list, with reasons to open things, is
 * /projects.
 *
 * TWO GROUNDS, ON PURPOSE. The instruments are on a panel, because whether a
 * Geiger counter is answering is the machine talking: components/projects
 * BenchBoard, fed by the same peekNow() snapshot and the same /api/now poll
 * the home page's "Running now" panel uses. Everything else is a list of
 * pages a person wrote, so it is on paper, in kit rails.
 *
 * EVERY PAGE, ONCE. Each route under app/ that renders a page appears in
 * exactly one list below. The count in the lede is the length of those lists,
 * so it cannot drift from them; what CAN drift is a new route that nobody adds
 * here. Adding a page to the site means adding a line to this file, the same
 * way it means adding one to app/_nav.ts.
 *
 * Not listed one by one: /housecalls/docs/<slug>. The paperwork index lists
 * its own documents, and the lede counts them from the same source that page
 * and its static params use (lib/housecalls/docs listDocSlugs), so the claim
 * "every page" stays true without 35 more lines here. Also not listed: the
 * two specimen pages (zz-*), which are deleted before release, and
 * /pilot-analytics, which is a permanent redirect to /ai-pilot now.
 *
 * WHERE THE BLURBS CAME FROM. The old /lab hub's own lines where a page had
 * one (git show 4618109:app/lab/page.tsx): Dragonfli, the airspace map, the
 * GPS track, the bus, SDR, Meatball, the three field notes, the device
 * scanner. The menu's blurbs (app/_nav.ts) for the pages the menu lists, except
 * House Calls (the page's own lede, which says business development) and the AI
 * pilot (its own description). Each page's own lede or description for the rest.
 *
 * force-dynamic because the snapshot is of this moment: a statically cached
 * bench would print an hour-old "as of" until the first poll replaced it.
 */

export const dynamic = "force-dynamic"

const INSTRUMENTS: BenchInstrument[] = [
  {
    id: "activity",
    name: "Claude Code, on this host",
    pages: [
      {
        href: "/ai-pilot",
        name: "AI pilot",
        blurb: "The whole record: the licence, the days, the models flown, the mission log, the token economy.",
      },
    ],
  },
  {
    id: "firewall",
    name: "Edge firewall and scanner trap",
    pages: [
      {
        href: "/visitors",
        name: "Knock knock",
        blurb: "Who has been trying the doors, across every site this box serves.",
      },
    ],
  },
  {
    id: "geiger",
    name: "Geiger counter",
    pages: [
      {
        href: "/trng",
        name: "Hotbits",
        blurb: "Random bits from radioactive decay, health-tested as they arrive.",
      },
    ],
  },
  {
    id: "bus",
    name: "Perception bus",
    pages: [
      {
        href: "/dragonfli",
        name: "Dragonfli",
        blurb: "1090 MHz ADS-B receiver: radar, registry, predictor.",
      },
      {
        href: "/dragonfli/airspace",
        name: "Airspace map",
        blurb: "Full-map ADS-B view: tracks, trails, layer toggles.",
      },
      {
        href: "/dragonfli/gps",
        name: "GPS ground track",
        blurb: "Receiver fixes on a vector map: skyplot, signal arrivals.",
      },
      {
        href: "/dragonfli/worldevent",
        name: "WorldEvent bus",
        blurb: "The lab's UDP firehose decoded live: ADS-B, GPS, mesh, NTP.",
      },
    ],
    note: "The radar, the airspace map and the GPS board each judge their own receiver on the page. The tag here is the bus that carries them.",
  },
  {
    id: "cameras",
    name: "Meatball's camera",
    pages: [
      {
        href: "/meatball",
        name: "Meatball",
        blurb: "A salvaged server that sees, hears, and introduces itself.",
      },
      {
        href: "/eyes",
        name: "Eyes",
        blurb: "The newest still from the camera on this box, and when it was taken.",
      },
      {
        href: "/meatball/log",
        name: "The event log",
        blurb: "Every motion the cameras caught and the vision model named.",
      },
      {
        href: "/meatball/memory",
        name: "What it remembers",
        blurb: "Motion and speech events folded onto one timeline.",
      },
    ],
    note: "The log and the memory judge the motion tracker on their own pages. The tag here is the camera.",
  },
  {
    id: "fleet",
    name: "Fleet collector",
    pages: [
      {
        href: "/fleet",
        name: "Fleet",
        blurb: "Per-node vitals for the boxes behind the bus: disk, temperature, load, uplink.",
      },
    ],
  },
  {
    id: "sdr",
    name: "SDR control plane",
    pages: [
      {
        href: "/sdr",
        name: "SDR",
        blurb: "Software-defined radio scanner: bands, soaks, top frequencies.",
      },
    ],
  },
  { id: "build", name: "This build", pages: [] },
]

interface Shelf {
  title: string
  pages: BenchPage[]
}

const SHELVES: Shelf[] = [
  {
    title: "Dashboards",
    pages: [
      { href: "/work", name: "Work", blurb: "Four GitHub orgs, commit history rolled up." },
      { href: "/cost-analysis", name: "Cost analysis", blurb: "What the work costs, modelled." },
      { href: "/the-shift", name: "The shift", blurb: "What changed when the tooling changed." },
      { href: "/papers", name: "Papers", blurb: "Research notes, figures, and what held." },
      { href: "/mcp", name: "MCP catalog", blurb: "The servers, their tools, and the fleet." },
    ],
  },
  {
    title: "Chips and math",
    pages: [
      { href: "/6502", name: "The 6502", blurb: "The transistor-level chip and its archive." },
      {
        href: "/projects/prime-atlas",
        name: "Primality Atlas",
        blurb: "A terrain map of the territory around the primes.",
      },
      { href: "/projects/zeta-forge", name: "Zeta Forge", blurb: "Build zeta one arrow at a time." },
      {
        href: "/projects/prime-orchestra",
        name: "Prime Orchestra",
        blurb: "The primes, played by the zeros of zeta.",
      },
      {
        href: "/projects/prime-zoo",
        name: "Primality Zoo",
        blurb: "The structure hiding in the primes.",
      },
      {
        href: "/projects/storm-plates",
        name: "Storm Plates",
        blurb: "The prime sieve drawn as weather.",
      },
      {
        href: "/projects/critical-collapse",
        name: "Critical Collapse",
        blurb: "A black hole solved in your browser.",
      },
      {
        href: "/projects/computer-tree",
        name: "The Computer Tree",
        blurb: "The 1961 family tree of the computer, grown to 2025.",
      },
    ],
  },
  {
    title: "Field notes",
    pages: [
      {
        href: "/meatball/notes/senses",
        name: "Senses",
        blurb: "Wiring the eyes, ears, and voice rig.",
      },
      {
        href: "/meatball/notes/listening",
        name: "Listening",
        blurb: "Teaching the box to hear over its own fans.",
      },
      {
        href: "/meatball/notes/motion",
        name: "Motion",
        blurb: "The box-fan problem and the variance gate.",
      },
      {
        href: "/projects/turfy",
        name: "Turfy",
        blurb: "An AI sprinkler brain that fails back to dumb.",
      },
    ],
  },
  {
    title: "House Calls",
    pages: [
      {
        href: "/housecalls",
        name: "House Calls",
        blurb: "Business development for the practice, run by an AI and logged in the open.",
      },
      {
        href: "/housecalls/plain",
        name: "The plain-English version",
        blurb: "No jargon: what is changing, and why it matters to your wallet.",
      },
      {
        href: "/housecalls/network",
        name: "The network",
        blurb: "The map of who runs the machine where. Population: one.",
      },
      {
        href: "/housecalls/docs",
        name: "The paperwork",
        blurb: "The working documents behind the hunt: plans, templates, rules, recipes. Each is its own page.",
      },
      {
        href: "/housecalls/tools",
        name: "Free tools for the trades",
        blurb: "Four field tools. No account, and nothing uploads.",
      },
      {
        href: "/housecalls/tools/quote",
        name: "The truck quote pad",
        blurb: "Line items in, a professional quote out.",
      },
      {
        href: "/housecalls/tools/change-order",
        name: "The change-order pad",
        blurb: "Photo, price, and a signature before the work.",
      },
      {
        href: "/housecalls/tools/photos",
        name: "The job photo stamper",
        blurb: "Job, time, and location burned into every photo.",
      },
      {
        href: "/housecalls/tools/materials",
        name: "The voice material pad",
        blurb: "Say the list in the truck; hand a printed one across the counter.",
      },
      {
        href: "/housecalls/tools/cards",
        name: "The counter cards",
        blurb: "A letter sheet of eight cards for supply-house counters.",
      },
    ],
  },
  {
    title: "Things to operate",
    pages: [
      {
        href: "/terminal",
        name: "Terminal",
        blurb: "The portfolio as a command line: type help.",
      },
      {
        href: "/preferences",
        name: "Device scanner",
        blurb: "Every sensor, hook, and doohickey your device exposes.",
      },
      {
        href: "/bio-mark",
        name: "The bio mark",
        blurb: "The wordmark taken apart: drag the dot.",
      },
    ],
  },
  {
    title: "The person",
    pages: [
      { href: "/", name: "Home", blurb: "What I build and who it is for." },
      { href: "/about", name: "About", blurb: "The bio, the timeline, the numbers." },
      { href: "/resume", name: "Resume", blurb: "The full record since 1997, and the PDF." },
      { href: "/services", name: "Services", blurb: "Five practices, three ways to engage." },
      { href: "/contact", name: "Contact", blurb: "The inbox, and what helps a first email." },
      { href: "/projects", name: "Projects", blurb: "The curated bench, with reasons to open things." },
    ],
  },
]

const INSTRUMENT_PAGES = INSTRUMENTS.reduce((n, i) => n + i.pages.length, 0)
const SHELF_PAGES = SHELVES.reduce((n, s) => n + s.pages.length, 0)
/** Everything listed, plus this page. */
const TOTAL = INSTRUMENT_PAGES + SHELF_PAGES + 1

export default async function BenchPage() {
  const initial = await peekNow()
  const docs = listDocSlugs().length

  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">The bench</span>
          </span>
        </nav>
        <h1>The bench</h1>
      </div>

      <p className="lede">
        Every page on this site, in one list: {TOTAL} of them, counting this one, plus the {docs}{" "}
        documents of the House Calls paperwork, which has an index of its own. Where each one is,
        and for the {INSTRUMENT_PAGES} that sit on an instrument, whether that instrument is
        answering right now.
      </p>

      <div className="prose beta-sec">
        <h2>Instruments</h2>
        <p>
          These pages read real hardware on this network, and hardware goes away. Each instrument
          is judged against how often it is supposed to speak: live, stale or offline, with when it
          was last heard. A page stays up when its instrument does not, and says so itself.
        </p>
      </div>

      <BenchBoard initial={initial} instruments={INSTRUMENTS} />

      <div className="prose beta-sec">
        <h2>The rest of the bench</h2>
        <p>
          Dashboards, field notes, tools, and the pages about the person. Each one is its own page.
          No aggregator, no marketing wrapper.
        </p>
      </div>

      <div className="beta-bench-index">
        {SHELVES.map((s) => (
          <section className="rail" key={s.title} aria-label={s.title}>
            <h3>
              {s.title} <span className="beta-bench-count">{s.pages.length}</span>
            </h3>
            <ul className="rail-list">
              {s.pages.map((p) => (
                <li key={p.href}>
                  <Link href={p.href}>{p.name}</Link>{" "}
                  <i className="beta-bench-path">{p.href}</i>
                  <span>{p.blurb}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="prose beta-sec beta-bench-out">
        <p>
          This is the inventory. For the short list, with a reason to open each thing and the work
          that lives on other sites, see <Link href="/projects">projects</Link>.
        </p>
      </div>
    </div>
  )
}
