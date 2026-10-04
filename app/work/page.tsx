import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import {
  AUTHOR_AUDIT,
  auditTotals,
  loadOrgRollups,
  type OrgRollup,
  type RepoRow,
} from "./_orgs"
import {
  BarStrip,
  CalendarHeat,
  RowChart,
  Sparkline,
  monthBuckets,
  weekBuckets,
  type ChartTick,
  type DayDatum,
  type RowDatum,
} from "../_charts"
import { BetaMeasured } from "../_measured"
import { CHART_INK, SERIES } from "@/lib/beta/chart-theme"
import { BenchGrid } from "@/components/projects/BenchCard"
import { CLIENTS_FEATURED, CLIENTS_MORE } from "./_clients"

/**
 * /work: the client projects first, then four GitHub organisations, counted
 * from their commit logs.
 *
 * The client projects (app/work/_clients.ts) open the page because /work is
 * the door a client takes from the home page (Me, Work, Projects; the
 * owner's top level, 2026-10-04). The record under them is the evidence.
 *
 * Each org is one board on a panel: four figures, a year of days, the months
 * since the first commit under the owner's name, and the language mix. Under
 * it, for the two orgs with public repositories, the most recently active of
 * them as cards. The way the count is cut (app/work/_orgs.ts has it in full)
 * is said once, at the bottom (#counting), and not repeated per org.
 *
 * What is NOT here, on purpose:
 *
 *   Per-repository sparklines. The timeline files hold daily counts per
 *   ORGANISATION only. The previous site drew a strip on every repo card by
 *   windowing the org's activity to the repo's lifespan, which showed other
 *   repositories' commits under each name. A card here draws the one thing the
 *   file does know per repository: when its first and last commits were.
 *
 *   Development phases. Every phase name in the files is either the
 *   pipeline's fallback ("Phase 12") or written by a small model about a batch
 *   of seven repositories grouped by creation date. The real names are
 *   generic, some descriptions are wrong, and the orgs are covered unevenly.
 *
 *   Repository names for Nominate-AI and Sysforge-AI. Both are private
 *   throughout: figures, calendar and languages only.
 */

export const revalidate = 3600

const DAY = 86_400_000
const WEEKS = 52
const CARD_CAP = 12
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

/** Fixed locale, so the server's output never depends on where it runs. */
const nf = (n: number): string => n.toLocaleString("en-US")
const ms = (iso: string): number =>
  Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))
const isoDay = (t: number): string => new Date(t).toISOString().slice(0, 10)

/** "2025-03-11" as "11 Mar 2025", by slicing: never the local zone. */
function fmtDay(iso: string): string {
  if (!iso || iso.length < 10) return ""
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`
}
/** "2025-03-11" as "March 2025". */
const fmtMonth = (iso: string): string =>
  iso ? `${MONTHS_LONG[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}` : ""
/** "2025-03-11" as "Mar 2025". */
const fmtMonthShort = (iso: string): string =>
  iso ? `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}` : ""

/** The timeline files say { date, commits }; the charts take { date, value }. */
const asDays = (days: OrgRollup["ownHeatmap"]): DayDatum[] =>
  days.map((d) => ({ date: d.date, value: d.commits ?? 0 }))

/**
 * Whether a file is recent enough for its last month to be called the current
 * one. A pipeline that stopped a fortnight ago has no "this month so far", and
 * the blue bar would be claiming one.
 */
function isFresh(generated: string): boolean {
  const t = Date.parse(generated)
  return Number.isFinite(t) && Date.now() - t < 2 * DAY
}

/** Top languages by repo count, with the tail folded into one row. */
function languageRows(langs: OrgRollup["languages"], top = 5): RowDatum[] {
  const head = langs.slice(0, top).map(([name, n]) => ({
    label: name,
    value: n,
    display: `${n} ${n === 1 ? "repo" : "repos"}`,
  }))
  const tail = langs.slice(top)
  if (tail.length) {
    const n = tail.reduce((s, [, v]) => s + v, 0)
    // A ninth hue is never generated; the tail folds into one row.
    head.push({ label: `Other (${tail.length})`, value: n, display: `${n} repos` })
  }
  return head
}

/**
 * Repositories the language chart does not account for. The pipeline records
 * one primary language per repository and nothing for one GitHub could not
 * classify, so the rows sum to less than the repository count.
 */
function unclassified(org: OrgRollup): number {
  const counted = org.languages.reduce((s, [, n]) => s + n, 0)
  return Math.max(0, org.totalRepos - counted)
}

/** Everything one org board needs, computed once. */
function shape(org: OrgRollup) {
  const end = org.generated.slice(0, 10)
  const start = isoDay(ms(end) - (WEEKS * 7 - 1) * DAY)
  const days = asDays(org.ownHeatmap)
  const window = days.filter((d) => d.date >= start && d.date <= end)
  const windowTotal = window.reduce((s, d) => s + d.value, 0)
  const activeDays = window.filter((d) => d.value > 0).length
  const weeks = weekBuckets(days, end, WEEKS)
  // The whole history fits in the calendar: no month strip, and the figures
  // count days since the start instead of repeating the same total twice.
  const fitsWindow = org.since >= start
  const daysSince = Math.round((ms(end) - ms(org.since)) / DAY) + 1

  // Calendar months from the month of the first own commit to the file's month.
  const monthCount =
    (Number(end.slice(0, 4)) - Number(org.since.slice(0, 4))) * 12 +
    (Number(end.slice(5, 7)) - Number(org.since.slice(5, 7))) +
    1
  const months = monthBuckets(days, end, monthCount)
  const monthPeak = months.reduce((a, b) => (b.value > a.value ? b : a), months[0])

  const byYear = new Map<string, number>()
  for (const d of days) byYear.set(d.date.slice(0, 4), (byYear.get(d.date.slice(0, 4)) ?? 0) + d.value)
  const years = [...byYear.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  return {
    end, start, window, windowTotal, activeDays, weeks, months, monthPeak, years,
    fitsWindow, daysSince,
  }
}
type Shape = ReturnType<typeof shape>

/**
 * What each org is, in the owner's words where the previous site had them.
 * Paper, so it is prose; the panels under it are the pipeline talking.
 */
const ABOUT: Record<string, ReactNode> = {
  "nominate-ai": (
    <p>
      An AI-native sourcing platform: pipelines, vector search, agents. This section names none of
      its repositories. Its service catalog is on <Link href="/mcp">/mcp</Link>.
    </p>
  ),
  tinymachines: (
    <p>
      The garage-lab umbrella. ESP32 mesh, software-defined radio, true randomness from radioactive
      decay, ADS-B receivers. All the hardware-meets-AI experiments live here. Since August 2026 so
      does the chip work: transistor-level simulations of the{" "}
      <Link href="/6502">MOS 6502</Link> and the chips of the NES, published at{" "}
      <a href="https://tinymachines.ai" target="_blank" rel="noopener noreferrer">
        tinymachines.ai
      </a>
      . The instruments on this site (<Link href="/trng">Hotbits</Link>,{" "}
      <Link href="/dragonfli">Dragonfli</Link>) are built from code in this organisation.
    </p>
  ),
  isenbek: (
    <p>
      The solo namespace. This site lives here (its source, the pipelines that write its data and
      the script that ships it), and so does <Link href="/housecalls">House Calls</Link>.
    </p>
  ),
  "sysforge-ai": (
    <p>
      SysForge.ai is the consulting firm I founded in 2024 (it is the first line of the{" "}
      <Link href="/resume">resume</Link>). Its organisation holds one private repository, the
      firm&apos;s own site. The hand-written work there was February 2026; since March every commit
      is an automated nightly catalog refresh, which is the even row the calendar shows.
    </p>
  ),
}

/** What the cards leave out, per org. The counts are computed; this is the what. */
const UNLISTED: Record<string, string> = {
  tinymachines: "private repositories, a fork of ripgrep and one imported project",
  isenbek: "forks I kept of other people's projects, and a few small repositories that are not mine to list",
}

function Panel({
  name,
  note,
  className,
  children,
}: {
  name: string
  note?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className ? `panel ${className}` : "panel"}>
      <div className="panel-face">
        <div className="panel-bar">
          <b>{name}</b>
          {note && <span>{note}</span>}
        </div>
        {children}
      </div>
    </div>
  )
}

/** One figure on a board: what it is, the number, and what qualifies it. */
function Figure({ k, v, sub }: { k: string; v: ReactNode; sub?: ReactNode }) {
  return (
    <div className="beta-work-fig">
      <dt>{k}</dt>
      <dd>
        <span className="beta-work-fig__v">{v}</span>
        {sub && <span className="beta-work-fig__sub">{sub}</span>}
      </dd>
    </div>
  )
}

/** The four figures for one org, from the same file as the charts beside them. */
function Figures({ org, s }: { org: OrgRollup; s: Shape }) {
  const single = org.totalRepos === 1
  const lang = org.languages[0]?.[0] ?? ""

  return (
    <dl className="beta-work-figs">
      <Figure
        k="Commits"
        v={nf(org.commitsSince)}
        sub={
          <>
            since {fmtDay(org.since)}
            {s.years.length > 1 &&
              s.years.map(([y, n]) => (
                <span key={y} className="beta-work-fig__year">
                  <span>{y}</span>
                  <span>{nf(n)}</span>
                </span>
              ))}
          </>
        }
      />
      {s.fitsWindow ? (
        <Figure k="Days with a commit" v={nf(s.activeDays)} sub={`of ${nf(s.daysSince)} days since the first`} />
      ) : (
        <Figure
          k={`Last ${WEEKS} weeks`}
          v={nf(s.windowTotal)}
          sub={`on ${nf(s.activeDays)} of ${WEEKS * 7} days`}
        />
      )}
      {single ? (
        <Figure k="Repository" v="1" sub={lang ? `${lang}, private` : "private"} />
      ) : (
        <Figure k="Repositories" v={nf(org.totalRepos)} />
      )}
      <Figure k="Latest commit" v={fmtDay(org.latestCommit.slice(0, 10))} />
    </dl>
  )
}

/**
 * The most recently active public repositories, as cards on a panel: the name
 * links to GitHub, the sentence is the repository's own description there,
 * and the bar is the repository's span (first to last commit) on the org's
 * own axis, from the first commit under my name to the file's date. The span
 * is the one per-repository time fact the file holds; there is no per-repo
 * daily count to draw a line from.
 */
function RepoCards({ org, repos, s }: { org: OrgRollup; repos: RepoRow[]; s: Shape }) {
  const shown = repos.slice(0, CARD_CAP)
  const moreListed = repos.length - shown.length
  const unnamed = org.totalRepos - repos.length
  const t0 = ms(org.since)
  const span = Math.max(DAY, ms(s.end) - t0)
  const at = (iso: string): number => Math.min(1, Math.max(0, (ms(iso) - t0) / span))
  const pct = (f: number): string => `${Math.round(f * 10_000) / 100}%`

  return (
    <Panel
      name="Most recently active"
      note={`${shown.length} of ${org.totalRepos}, newest commit first`}
    >
      <ul className="beta-work-cards" aria-label={`${org.displayName}: most recently active public repositories`}>
        {shown.map((r) => {
          const a = at(r.firstCommit)
          const b = at(r.lastCommit)
          const bar: CSSProperties = {
            left: pct(a),
            width: `max(3px, ${pct(b - a)})`,
            background: SERIES[0].token,
          }
          return (
            <li key={r.name} className="beta-work-card">
              <a className="beta-work-card__name" href={r.url} target="_blank" rel="noopener noreferrer">
                {r.name}
              </a>
              {r.description && <p className="beta-work-card__desc">{r.description}</p>}
              <p className="beta-work-card__facts">
                <span>{r.language || "no language"}</span>
                <span>
                  {nf(r.commits)} {r.commits === 1 ? "commit" : "commits"}
                </span>
              </p>
              <div className="beta-work-card__span" aria-hidden="true">
                <i style={{ background: CHART_INK.grid }} />
                <b style={bar} />
              </div>
              <p className="beta-work-card__dates">
                {r.firstCommit === r.lastCommit
                  ? fmtDay(r.firstCommit)
                  : `${fmtDay(r.firstCommit)} to ${fmtDay(r.lastCommit)}`}
              </p>
            </li>
          )
        })}
      </ul>
      <p className="beta-chart__note">
        Each bar runs from a repository&apos;s first commit to its last, on a line from{" "}
        {fmtDay(org.since)} to {fmtDay(s.end)}. Not shown:{" "}
        {moreListed > 0 && (
          <>
            {moreListed} older public {moreListed === 1 ? "repository" : "repositories"}, all on{" "}
            <a className="beta-work-panel-link" href={org.gh} target="_blank" rel="noopener noreferrer">
              github.com/{org.displayName}
            </a>
            , and{" "}
          </>
        )}
        {unnamed} that {unnamed === 1 ? "is" : "are"} counted and not named
        {UNLISTED[org.slug] ? `: ${UNLISTED[org.slug]}` : ""}. Descriptions are each
        repository&apos;s own, from GitHub.
      </p>
    </Panel>
  )
}

function OrgSection({ org }: { org: OrgRollup }) {
  const s = shape(org)
  const fresh = isFresh(org.generated)
  const single = org.totalRepos === 1
  const langs = languageRows(org.languages)
  const missingLang = unclassified(org)
  const lastMonth = s.months.length - 1
  const step = s.months.length > 14 ? 6 : 3
  const ticks: ChartTick[] = s.months
    .map((m, i) => ({ at: i, label: m.label }))
    .filter((_, i) => i % step === 0)
  // The whole history fits in a year: the calendar starts at the first commit
  // and stands in for the month strip, and the board is the compact one.
  const compact = s.fitsWindow
  const showMonths = !compact
  const showLangs = !single
  const calStart = compact ? org.since : s.start
  const calDays = compact ? s.window.filter((d) => d.date >= org.since) : s.window

  return (
    <section id={org.slug} className="beta-work-org" aria-labelledby={`${org.slug}-h`}>
      <div className="prose beta-sec">
        <h2 id={`${org.slug}-h`}>{org.displayName}</h2>
        {ABOUT[org.slug]}
      </div>

      <Panel
        name="Activity"
        note={`since ${fmtDay(org.since)}`}
        className={compact ? "beta-work-board beta-work-board--compact" : "beta-work-board"}
      >
        <div className="beta-work-board__top">
          <Figures org={org} s={s} />
          <div className="beta-work-board__cal">
            <CalendarHeat
              caption={
                compact
                  ? `Commits per day, since ${fmtDay(org.since)}`
                  : `Commits per day, last ${WEEKS} weeks`
              }
              summary={
                compact
                  ? `${org.displayName}: ${nf(s.windowTotal)} commits on ${s.activeDays} of ${s.daysSince} days, ${org.since} to ${s.end}.`
                  : `${org.displayName}: ${nf(s.windowTotal)} commits on ${s.activeDays} of ${WEEKS * 7} days, ${s.start} to ${s.end}.`
              }
              unit="commits"
              cellIs="one UTC day"
              days={calDays}
              start={calStart}
              end={s.end}
              emptyNote="No commits in this window."
            />
            <p className="beta-chart__note beta-work-scrollhint">
              The calendar opens at the newest week; scroll it sideways for the earlier ones.
            </p>
            {showMonths && (
              <BarStrip
                caption={`Commits per month, ${fmtMonthShort(org.since)} to ${fmtMonthShort(s.end)}`}
                summary={`${org.displayName} commits per calendar month since the first one under my name. The busiest month is ${s.monthPeak?.label ?? "none"} with ${nf(s.monthPeak?.value ?? 0)}.`}
                unit="commits"
                data={s.months}
                ticks={ticks}
                highlight={fresh && lastMonth >= 0 ? { index: lastMonth, label: "this month so far" } : undefined}
                emptyNote="No dated commits in this timeline."
              />
            )}
          </div>
        </div>

        {showLangs && (
          <div className="beta-work-board__low">
            <dl className="beta-work-figs">
              <Figure
                k="Languages"
                v={nf(org.languages.length)}
                sub={
                  missingLang > 0
                    ? `one per repository, as GitHub records it; ${nf(missingLang)} of ${nf(org.totalRepos)} have none`
                    : "one per repository, as GitHub records it"
                }
              />
            </dl>
            <RowChart
              caption="Repositories by primary language"
              data={langs}
              emptyNote="No languages recorded."
            />
          </div>
        )}
      </Panel>

      {org.listed && org.listed.length > 0 && <RepoCards org={org} repos={org.listed} s={s} />}

      <BetaMeasured generated={org.generated} source={`${org.slug}-timeline.json`}>
        <b>{org.slug}-timeline.json</b>
        generated {org.generated.slice(0, 16).replace("T", " ")} UTC. Commits by UTC day,{" "}
        {org.since} to {s.end}.
      </BetaMeasured>
    </section>
  )
}

export default function BetaWorkPage() {
  const { orgs, expected } = loadOrgRollups()

  const totalRepos = orgs.reduce((s, o) => s + o.totalRepos, 0)
  const commitsSince = orgs.reduce((s, o) => s + o.commitsSince, 0)
  const upstream = orgs.reduce((s, o) => s + o.upstreamBefore, 0)
  const totalInFiles = orgs.reduce((s, o) => s + o.file.totalCommits, 0)
  const earliest = orgs.map((o) => o.since).sort()[0] ?? ""
  const newest = orgs.map((o) => o.generated).filter(Boolean).sort().at(-1) ?? ""
  const today = newest.slice(0, 10)

  const audit = auditTotals()
  const inPeriod = audit.total - audit.upstream
  const rows = orgs.map((o) => ({ org: o, s: shape(o) }))
  const bySince = [...orgs].sort((a, b) => a.since.localeCompare(b.since))

  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Work</span>
          </span>
        </nav>
        <h1>Work</h1>
      </div>

      <p className="lede">
        The platforms I architect and build for clients, and the record behind them: four GitHub
        organisations, counted from the log rather than described.
      </p>

      <section id="clients" className="beta-bench-group" aria-labelledby="clients-h">
        <div className="prose beta-sec">
          <h2 id="clients-h">Client projects</h2>
          <p>
            Five platforms, each built for someone else: two data platforms, and three products.
            Each card opens the live site, except one product whose site stays unlinked; that card
            opens the resume.
          </p>
        </div>
        <BenchGrid items={CLIENTS_FEATURED} pairs feature />
        <BenchGrid items={CLIENTS_MORE} />
      </section>

      {/* .prose for the text run only; the panels below are siblings. */}
      <div className="prose beta-sec">
        <h2 id="record">The record</h2>
        <p>
          Four GitHub organisations, {fmtMonth(earliest)} to now: {nf(totalRepos)} repositories and{" "}
          {nf(commitsSince)} commits. Each is counted from my first commit in it{" "}
          (<a href="#counting">how</a>); work before {earliest.slice(0, 4)} is on the{" "}
          <Link href="/resume">resume</Link>.
        </p>
      </div>

      {orgs.length < expected && (
        <div className="notice fail">
          <b>Incomplete.</b> {orgs.length} of {expected} timelines loaded. The missing files did not
          parse, so the totals above are short by whatever they contain.
        </div>
      )}

      <Panel name={`Last ${WEEKS} weeks`} note={`to ${fmtDay(today)}`}>
        <table className="readout beta-work-sum">
          <thead>
            <tr>
              <th scope="col">Organisation</th>
              <th scope="col" className="num beta-work-wide">Repos</th>
              <th scope="col" className="num">Commits</th>
              <th scope="col">Per week</th>
              <th scope="col" className="beta-work-wide">Latest commit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ org, s }) => {
              const peak = Math.max(0, ...s.weeks)
              return (
                <tr key={org.slug}>
                  <td>
                    <a href={`#${org.slug}`}>{org.displayName}</a>
                  </td>
                  <td className="num beta-work-wide">{nf(org.totalRepos)}</td>
                  <td className="num">{nf(s.windowTotal)}</td>
                  <td>
                    <Sparkline
                      values={s.weeks}
                      width={160}
                      label={`${org.displayName}, commits per week, ${s.start} to ${s.end}: ${nf(s.windowTotal)} in total, busiest week ${nf(peak)}.`}
                    />
                  </td>
                  <td className="beta-work-wide">{fmtDay(org.latestCommit.slice(0, 10))}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="beta-chart__note">
          One line per organisation, each filling its own height: the shapes compare, the commit
          column carries the size.
        </p>
      </Panel>

      <div className="beta-work-orgs">
        {orgs.map((org) => (
          <OrgSection key={org.slug} org={org} />
        ))}
      </div>

      <section id="counting" className="beta-work-org" aria-labelledby="counting-h">
        <div className="prose beta-sec">
          <h2 id="counting-h">How this is counted</h2>
          <p>
            A pipeline reads every repository in the four organisations through the GitHub API and
            counts every commit in every log. It does not look at who wrote them, and that matters
            in three ways.
          </p>
          <ul>
            <li>
              <strong>Forks and imports.</strong>{" "}
              A fork arrives with its whole history:
              tinymachines holds a fork of ripgrep whose log starts in 2016, and isenbek holds forks
              that go back to 2014. So each organisation here starts at the first commit under my
              name:{" "}
              {bySince.map((o, i) => (
                <span key={o.slug}>
                  {i > 0 && (i === bySince.length - 1 ? " and " : ", ")}
                  {fmtDay(o.since)} for {o.displayName}
                </span>
              ))}
              . The {nf(upstream)} commits dated before those are in no number or chart on this page.
            </li>
            <li>
              <strong>Scripts.</strong>{" "}
              A commit made by a script counts the same as one made by
              hand. This site&apos;s deploy script writes a version bump and a build stamp every
              time it ships, and those are more than half of its log; Sysforge-AI&apos;s nightly
              refresh is the other case.
            </li>
            <li>
              <strong>Other authors.</strong>{" "}
              Inside the period the logs still hold commits under
              other names: fork and import history dated after my first commit, and other authors.
              The published data has no author field, so the charts cannot take them out. The panel
              below is the one time it was measured.
            </li>
          </ul>
          <p>
            Repositories are named only where they are public, not forks, and mine. Private ones
            are counted and not named. Days are UTC days.
          </p>
        </div>

        <Panel
          name="Author check"
          note={`all four, ${fmtDay(AUTHOR_AUDIT.measured)}`}
          className="beta-work-audit"
        >
          <table className="readout beta-work-totals">
            <tbody>
              <tr>
                <td>In the four logs that day</td>
                <td className="num">{nf(audit.total)}</td>
              </tr>
              <tr>
                <td className="beta-work-sub">before each start, left out</td>
                <td className="num">{nf(audit.upstream)}</td>
              </tr>
              <tr>
                <td className="beta-work-sub">in the period, counted</td>
                <td className="num">{nf(inPeriod)}</td>
              </tr>
              <tr>
                <td className="beta-work-sub beta-work-sub2">under my name</td>
                <td className="num">{nf(audit.owner)}</td>
              </tr>
              <tr>
                <td className="beta-work-sub beta-work-sub2">under Claude&apos;s name</td>
                <td className="num">{nf(audit.claude)}</td>
              </tr>
              <tr>
                <td className="beta-work-sub beta-work-sub2">under other names</td>
                <td className="num">{nf(audit.others)}</td>
              </tr>
            </tbody>
          </table>
          <p className="beta-chart__note">
            Counted once, by author name, from the pipeline&apos;s cache, and it does not update:
            the files on this page were generated {fmtDay(today)} and hold {nf(totalInFiles)}{" "}
            commits.
          </p>
        </Panel>

        <BetaMeasured generated={newest} source="four mission timelines">
          <b>public/data/*-timeline.json</b>
          four files, newest generated {newest.slice(0, 16).replace("T", " ")} UTC. Author check:
          pipeline cache, {AUTHOR_AUDIT.measured}.
        </BetaMeasured>
      </section>
    </div>
  )
}
