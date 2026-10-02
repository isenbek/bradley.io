import Link from "next/link"
import type { Metadata } from "next"
import { loadSiteDataStatic } from "@/lib/site-data"
import { peekNow } from "@/components/live/now-snapshot"
import type { NowId } from "@/components/live/types"
import { DieFigure } from "@/components/home/DieFigure"
import { HeroChips, type OrgTotals } from "@/components/home/HeroChips"
import { LinkCard } from "@/components/home/LinkCard"
import { OrgCards } from "@/components/home/OrgCards"
import { RunningNow } from "@/components/home/RunningNow"
import { SelectedWork, WORK_CHECKED } from "@/components/home/SelectedWork"
import { RESUME_PDF } from "@/lib/resume"
import { SiteStatsPanel } from "./_site-stats"
import { AUTHOR_AUDIT, auditTotals, isoYear, loadOrgRollups } from "./work/_orgs"

// Rendered per request, not cached for an hour as it used to be. The second
// thing on this page is "Running now", and its first paint is the server's
// snapshot: served from an hour-old cache, every visit would open on stale
// readings and then flash the real ones a moment later. peekNow() never waits
// on the network (see components/live/now-snapshot.ts), so a render costs a few
// file reads on this host.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Bradley Isenbek: edge hardware, data architecture, AI",
  description:
    "AI systems architect and data engineer in Grand Rapids, Michigan. Edge and IoT, production data pipelines, and AI in the parts of a system where it has to hold.",
}

/**
 * The instruments the front page accounts for. The build is in the hero rail
 * and the footer already. RunningNow gives the answering ones rows and names
 * the silent ones once (components/home/RunningNow.tsx).
 */
const NOW_ROWS: NowId[] = ["activity", "firewall", "geiger", "bus", "cameras", "fleet", "sdr"]

/** The three field notes under /meatball/notes, titled as their own pages title them. */
const NOTES = [
  {
    href: "/meatball/notes/senses",
    title: "I gave a junk-pile eyes, ears, and a voice",
    blurb: "Field note 01. The salvaged bill of materials, the traps that cost an hour each, and talking to it out loud.",
  },
  {
    href: "/meatball/notes/listening",
    title: "The math of listening",
    blurb: "Field note 02. DSP from raw samples to a working voice gate, every number from a live run.",
  },
  {
    href: "/meatball/notes/motion",
    title: "Teaching the eyes to ignore a box fan",
    blurb: "Field note 03. One cheap fan fooled both senses, and what it took to make them stop caring.",
  },
]

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "2026-10-02" as "2 Oct 2026", sliced from the string so no timezone can move the day. */
function shortDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  const month = MONTHS[Number(m[2]) - 1]
  return month ? `${Number(m[3])} ${month} ${m[1]}` : iso
}

/**
 * A provenance chip whose text is one sentence. The kit's .measured is a flex
 * row that wraps its children as whole items, so a sentence given as a bare
 * text node beside the <b> drops under the mark on a phone. One child and no
 * wrap keeps the mark beside the first line (the same fix NowPanel uses).
 * app/_measured.tsx is still used below where its default "file, generated
 * date" form is all that is needed.
 */
function Measured({ children }: { children: React.ReactNode }) {
  return (
    <p className="measured beta-home-measured">
      <span>{children}</span>
    </p>
  )
}

/**
 * The front door.
 *
 * In order: who is speaking (the hero, with a rail of measured facts), proof
 * that a real machine is behind the page (the live block, fed by one
 * snapshot), six pieces of work worth a click, one photograph, the record
 * (four organisations and the session index), and two ways in. The previous version of this file had a headline, three boxes and
 * five integers, and linked to none of the instruments this server runs.
 *
 * WHAT IS NOT HERE, AND WHY.
 * The motto ("Anti-cloud. Host local, think global.") is in the colophon under
 * every page, so the hero does not say it a second time.
 * The three "threads" boxes (edge, data, AI) are one sentence now, above the
 * work that shows them: three boxes of adjectives were the inert part.
 * The activity feed is not rendered. On 2026-10-02 site-data.json's
 * activityFeed held 50 rows: 48 were "Claude Code: N transcript records", one
 * per day, and two were "Activity on <repo>". That is a counter with a date on
 * it, not a list of things that shipped. A day-by-day commit log stood in for
 * it for one round and was cut: it was a third view of the same commit counts
 * the hero and the org panels already give, and it named nothing.
 *
 * EACH FACT ONCE. Claude Code minutes are in the pulse panel, sessions and
 * active days in the site index under the record, commit volume in the org
 * panels, the commits under the owner's own name in the hero. No number is
 * printed twice in two forms.
 *
 * ON THE STRUCTURE. .prose wraps the text runs ONLY, and the kit components
 * sit outside it as siblings. .prose is serif at 68ch with `> h2` child rules,
 * and `.prose > ul` carries a padding-left that beats .rail-list's own reset,
 * so a component nested inside it comes out subtly wrong in a way that is hard
 * to see and easy to ship. Alternating prose blocks with component blocks is
 * also exactly what the page is: something a person wrote, then something a
 * machine measured, then back.
 *
 * NOTHING JUMPS WHEN THE LIVE DATA ARRIVES. Both live panels are given the
 * server's snapshot, so they are full height before any script runs; the hero
 * chips sit in grid cells of their own; the die's frame holds its shape before
 * the image loads.
 */
export default async function Home() {
  const [data, initial] = await Promise.all([loadSiteDataStatic(), peekNow()])
  const stats = data.stats
  const { orgs, expected } = loadOrgRollups()
  const audit = auditTotals()

  // The newest day the timeline files cover, and the roll-up across all four.
  const timelinesAt = orgs.map((o) => o.generated).filter(Boolean).sort().at(-1) ?? ""
  // `since` is the first commit under the owner's name in each org: the forks'
  // older history is cut in app/work/_orgs.ts and is in no number on this page.
  const firsts = orgs.map((o) => o.since).filter(Boolean).sort()
  const latests = orgs.map((o) => o.latestCommit).filter(Boolean).sort()
  const totals: OrgTotals | null = orgs.length
    ? {
        orgs: orgs.length,
        ownCommits: audit.owner,
        auditedOn: AUTHOR_AUDIT.measured,
        sinceYear: isoYear(firsts[0] ?? ""),
        latestCommit: latests.at(-1) ?? "",
      }
    : null
  const repos = orgs.reduce((s, o) => s + o.totalRepos, 0)
  const commits = orgs.reduce((s, o) => s + o.commitsSince, 0)
  const nf = (n: number) => n.toLocaleString("en-US")

  return (
    <div className="page">
      <div className="hero beta-home-hero">
        <h1 className="hero-title">
          Hardware hacker.
          <br />
          Data architect.
          <br />
          AI pilot.
        </h1>
        <p className="lede">
          I build at the seam where enterprise scale meets maker culture: ESP32 mesh networks,
          Fortune 500 data warehouses, and a lot of Claude as co-pilot. This site runs on my own
          hardware, and the panels below are this server and the instruments around it reporting
          in.
        </p>
        <div className="hero-ctas">
          <Link className="btn btn-primary" href="/services">
            What I do
          </Link>
          <Link className="btn btn-ghost" href="/contact">
            Start a conversation
          </Link>
        </div>
        <p className="quiet beta-home-where">
          <b>Bradley Isenbek.</b> Forest Hills, Michigan. On site across Grand Rapids and Kent
          County, remote everywhere else.
        </p>
        <p className="beta-resume-hire">
          <span>
            <b>Open to full-time roles</b> in AI systems and data architecture.{" "}
            <Link href="/resume">The resume</Link>, or <a href={RESUME_PDF}>the PDF</a>.
          </span>
        </p>
        <HeroChips totals={totals} />
      </div>

      {/* The panel's own bar says "Running now" to the eye. This is the same
          heading for the document outline, which a panel bar is not part of. */}
      <h2 className="sr-only">Running now</h2>
      <RunningNow initial={initial} ids={NOW_ROWS} />

      <div className="prose beta-sec">
        <h2>Selected work</h2>
        <p>
          Three threads, one practice: edge hardware, data architecture, and AI piloting. Each
          ships its own systems, but they cross-pollinate: the lab feeds the consulting, the
          consulting funds the lab. Six places to see it.
        </p>
      </div>

      <SelectedWork />
      <Measured>
        <b>Each figure</b> is from that project&apos;s own repository or live API, checked{" "}
        {shortDate(WORK_CHECKED)}
      </Measured>

      <div className="prose beta-sec">
        <h2>The 6502, switch by switch</h2>
      </div>

      <div className="beta-home-silicon">
        <DieFigure />
        <div className="beta-home-silicon__words">
          <div className="prose">
            <p>
              Nothing in it models what a 6502 does. There are wires and switches, traced from a
              photograph of a decapped die, and the behaviour falls out of them. Every register
              you read is pulled back out of storage nodes; every cycle count is emergent.
            </p>
            <p>
              The photograph is not mine. The visual6502 team decapped a 6502, photographed the
              die, traced every polygon by hand, and gave the result away. I rebuilt the engine on
              their trace, and keep a second copy of their archive on hardware I control.
            </p>
          </div>

          <div className="panel">
            <div className="panel-face">
              <div className="panel-bar">
                <b>The engine</b>
                <span>MOS 6502, from the die</span>
              </div>
              <table className="readout">
                <tbody>
                  <tr>
                    <td>Switches solved each half-cycle</td>
                    <td className="num">3,510</td>
                  </tr>
                  <tr>
                    <td>Wires between them</td>
                    <td className="num">1,725</td>
                  </tr>
                  <tr>
                    <td>Half-cycles matched to the reference, every node</td>
                    <td className="num">3,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <Measured>
            <b>tinymachines/6502</b>: its README and its golden-trace test, checked{" "}
            {shortDate(WORK_CHECKED)}
          </Measured>

          <div className="beta-home-row">
            <Link className="btn btn-ghost" href="/6502">
              The chip and its archive
            </Link>
            <a
              className="btn btn-ghost"
              href="https://tinymachines.ai/6502"
              target="_blank"
              rel="noopener noreferrer"
            >
              Run it at tinymachines.ai
            </a>
          </div>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>The record</h2>
        <p>
          Four GitHub organisations, counted rather than described
          {totals ? (
            <>
              : {nf(commits)} commits in {nf(repos)} repositories since {totals.sinceYear},{" "}
              {nf(totals.ownCommits)} of them under my name
            </>
          ) : null}
          . Each organisation&apos;s count starts at my first commit in it, and what is still in
          the count that I did not type is <Link href="/work#counting">spelled out on the work
          page</Link>. Under them, the index of my Claude Code sessions, with the period it covers.
          Anything older is on the <Link href="/resume">resume</Link>.
        </p>
      </div>

      <OrgCards orgs={orgs} end={timelinesAt.slice(0, 10)} />
      <Measured>
        <b>public/data/*-timeline.json</b>
        {timelinesAt ? `, generated ${shortDate(timelinesAt)}` : ", generation date not recorded"}.
        Every author is counted. Each strip has its own scale, and its last month is still in
        progress
        {orgs.length < expected ? `. ${expected - orgs.length} of ${expected} files did not load` : ""}
      </Measured>

      {/* Panel, because every number in it came out of a pipeline rather than
          off a slide. The chip underneath names the file and when it last ran;
          the panel's own note says what period the counts cover. */}
      <div className="beta-home-index">
        <SiteStatsPanel stats={stats} streak />
      </div>
      <Measured>
        <b>public/data/site-data.json</b>, generated {shortDate(data.generated)}
      </Measured>

      <ul className="rail-list beta-home-more">
        <li>
          <Link href="/work">Work</Link>
          <span>The four orgs, commit history and language mix rolled up.</span>
        </li>
        <li>
          <Link href="/ai-pilot">AI pilot licence</Link>
          <span>Sessions, models, and what the tooling is actually rated at.</span>
        </li>
        <li>
          <Link href="/cost-analysis">Cost analysis</Link>
          <span>What this way of working costs, modelled against the alternative.</span>
        </li>
      </ul>

      <div className="prose beta-sec">
        <h2>Got a build that needs the seam-runner?</h2>
        <p>
          If you have hardware that needs to talk to a warehouse, or a warehouse that needs to
          talk to an agent, that&apos;s the room I work in.
        </p>
      </div>

      <div className="beta-home-paths">
        <LinkCard href="/contact" title="Start a conversation" go="/contact">
          The inbox, and what helps a first email. Let&apos;s sketch it.
        </LinkCard>
        <LinkCard href="/resume" title="Read the resume" go="/resume">
          The full record since 1997, and the PDF.
        </LinkCard>
      </div>

      <div className="prose beta-sec">
        <h3>Also on this server</h3>
      </div>

      <ul className="rail-list beta-home-more">
        <li>
          <Link href="/bench">The bench</Link>
          <span>Every live page on this server, and whether it is up.</span>
        </li>
        <li>
          <Link href="/projects#math">Five instruments, one territory</Link>
          <span>
            A map of prime-number theory and four machines built where it pointed. All five run in
            the browser, no dependencies, no network. Beside them, a black hole solved in your
            browser.
          </span>
        </li>
        <li>
          <Link href="/bio-mark">The bio mark, decomposed</Link>
          <span>The wordmark taken apart: drag the dot.</span>
        </li>
        {NOTES.map((n) => (
          <li key={n.href}>
            <Link href={n.href}>{n.title}</Link>
            <span>{n.blurb}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
