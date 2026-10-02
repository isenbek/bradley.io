import { existsSync, readFileSync, statSync } from "fs"
import { join } from "path"
import Link from "next/link"
import type { Metadata } from "next"
import { BarStrip, RampKey, RowChart, type ChartTick, type StripDatum } from "../_charts"
import { BetaMeasured } from "../_measured"
import { FilterHash } from "@/components/papers/FilterHash"
import { StudyCard, type PaperFile, type ResolvedNote } from "@/components/papers/StudyCard"
import { imageSize } from "@/components/papers/image-size"
import {
  ABSTRACT_NOTES,
  DOMAIN_FALLBACK,
  STATUS_ORDER,
  cleanTitle,
  dayMonthYear,
  domainLabel,
  hasResults,
  isAgentAuthored,
  isSafeId,
  isWithdrawn,
  monthYear,
  statusTag,
  type Figure,
  type PapersData,
} from "@/components/papers/study"

export const revalidate = 3600

// The description, the share text and the JSON-LD live in layout.tsx, once.
// Only the title is set here, so the root template makes it "Papers | ...".
export const metadata: Metadata = { title: "Papers" }

/** The radio group's name. FilterHash listens for it; the CSS does not need it. */
const FILTER = "papers-domain"

function load(): PapersData | null {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "public/data/papers-data.json"), "utf-8")
    ) as PapersData
  } catch {
    return null
  }
}

/**
 * A public path from the data file, or null unless the file is really there.
 * 43 of 45 figures and one PDF existed on 2026-10-02; this is what keeps the
 * other cards from showing a broken image or a button to a 404.
 */
function inPublic(url: string | null | undefined): string | null {
  if (!url || !url.startsWith("/") || url.includes("..")) return null
  return existsSync(join(process.cwd(), "public", url)) ? url : null
}

/** A PDF that is really on disk, with its size, so the link can say it. */
function paperIn(url: string | null | undefined): PaperFile | null {
  const src = inPublic(url)
  if (!src) return null
  try {
    return { src, bytes: statSync(join(process.cwd(), "public", src)).size }
  } catch {
    return null
  }
}

/** A figure that is really on disk, with the size its own header states. */
function figureIn(url: string | null | undefined): Figure | null {
  const src = inPublic(url)
  if (!src) return null
  const size = imageSize(join(process.cwd(), "public", src))
  return { src, width: size?.width ?? null, height: size?.height ?? null }
}

/**
 * The provenance chip. The shared BetaMeasured prints the file name and the
 * date as two flex items, and at 320px the second one wraps to a line that
 * starts with a comma. Passing children as ONE item lets the text wrap like
 * text, and the date is kept whole.
 */
function Measured({ generated }: { generated: string | null | undefined }) {
  const when = dayMonthYear(generated)
  return (
    <BetaMeasured source="papers-data.json">
      <span>
        <b>papers-data.json</b>,{" "}
        <span className="beta-papers-nowrap">
          {when ? `generated ${when}` : "generation date not recorded"}
        </span>
      </span>
    </BetaMeasured>
  )
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

/** Every calendar month from `from` to `to` inclusive, as "YYYY-MM". */
function monthRange(from: string, to: string): string[] {
  const out: string[] = []
  let y = Number(from.slice(0, 4))
  let m = Number(from.slice(5, 7))
  const endY = Number(to.slice(0, 4))
  const endM = Number(to.slice(5, 7))
  // Bounded: a malformed stamp must not spin this loop.
  while ((y < endY || (y === endY && m <= endM)) && out.length < 120) {
    out.push(`${y}-${String(m).padStart(2, "0")}`)
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  return out
}

const plural = (n: number, one: string, many: string): string => (n === 1 ? one : many)

function Head() {
  return (
    <div className="page-head">
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/">bradley.io</Link>
        <span>
          {" / "}
          <span aria-current="page">Papers</span>
        </span>
      </nav>
      <h1>Papers</h1>
    </div>
  )
}

export default function BetaPapersPage() {
  const d = load()

  if (!d || !Array.isArray(d.studies)) {
    return (
      <div className="page">
        <Head />
        <div className="notice">
          <b>The index is not readable right now.</b> This page is drawn from a file a pipeline
          writes, and that file is missing or malformed. Nothing is shown rather than something
          stale.
        </div>
      </div>
    )
  }

  /* ---- What is listed ---------------------------------------------------- */

  const listed = d.studies.filter((s) => !isWithdrawn(s))
  const withdrawnHere = d.studies.filter(isWithdrawn)
  const withdrawnOmitted =
    d.withdrawnPolicy === "omitted" && typeof d.withdrawnCount === "number" ? d.withdrawnCount : 0

  // Newest first. A study with no start date sorts last, not first.
  const sorted = [...listed].sort((a, b) =>
    (b.createdAt || "0000").localeCompare(a.createdAt || "0000")
  )

  // A study with a published results table leads the grid on the wide card
  // (see StudyCard). The sort is stable, so everything else stays newest first.
  const ordered = [...sorted].sort((a, b) => Number(hasResults(b)) - Number(hasResults(a)))
  const featured = ordered.filter(hasResults).length

  // A hand-written note on an abstract shows only while both of its guards
  // hold (see ABSTRACT_NOTES in components/papers/study.ts).
  const bySlug = new Map(listed.map((s) => [s.slug, s]))
  const noteFor = (slug: string, description: string): ResolvedNote | null => {
    if (!Object.prototype.hasOwnProperty.call(ABSTRACT_NOTES, slug)) return null
    const n = ABSTRACT_NOTES[slug]
    const parent = bySlug.get(n.parent)
    if (!parent || !(description ?? "").includes(n.guard)) return null
    return { before: n.before, after: n.after, parentSlug: parent.slug, parentTitle: cleanTitle(parent.title) }
  }

  const cards = ordered.map((s) => ({
    study: s,
    figure: figureIn(s.previewImage),
    paper: s.hasPaper ? paperIn(s.paperUrl) : null,
    note: noteFor(s.slug, s.description),
  }))

  /*
   * WHAT THE TWO COUNTS MEASURE. Read this before rewording them.
   *
   * shownFigures: cards with a preview image mirrored into public/. Not "has a
   * figure": the pipeline only looks in a workspace's www/ folder, and on
   * 2026-10-02 one of the two cards without a preview had figures in its paper
   * and the other had an interactive figure at the lab.
   *
   * mirroredPapers: studies whose paper PDF is published ON THIS SITE. Not
   * "has a written paper": hasPaper in the data file tests www/paper.pdf only.
   * On 2026-10-02 it was 1, while 28 of the 45 listed workspaces held a
   * compiled paper (paper/paper.pdf) and terrapulse.info served all 28. The
   * first version of this page said "1 of 45 has a written paper", which was
   * false and was contradicted by the pages its own cards link to.
   */
  const n = listed.length
  const shownFigures = cards.filter((c) => c.figure).length
  const mirroredPapers = cards.filter((c) => c.paper).length
  const byAgent = listed.filter(isAgentAuthored).length

  /* ---- Domains: counted from what is listed, not from the file's tally ---- */

  const domainCount = new Map<string, number>()
  for (const s of listed) domainCount.set(s.category, (domainCount.get(s.category) ?? 0) + 1)
  const domains = [...domainCount.entries()]
    .filter(([id]) => isSafeId(id))
    .sort((a, b) => {
      if ((a[0] === DOMAIN_FALLBACK) !== (b[0] === DOMAIN_FALLBACK))
        return a[0] === DOMAIN_FALLBACK ? 1 : -1
      return b[1] - a[1] || a[0].localeCompare(b[0])
    })
    .map(([id, count]) => ({ id, count, label: domainLabel(id) }))

  // The filter, as CSS. One rule per domain: when its radio is checked, every
  // card of another domain leaves the grid and the count line changes. Written
  // from the data so a domain the pipeline adds tomorrow filters correctly with
  // no edit here. Ids are checked by isSafeId before they reach a selector.
  const filterCss = domains
    .map(
      ({ id }) =>
        `.beta-papers-browse:has(#pf-${id}:checked) .beta-papers-card:not([data-domain="${id}"]){display:none}` +
        `.beta-papers-browse:has(#pf-${id}:checked) .beta-papers-showing [data-for="${id}"]{display:inline}`
    )
    .join("")

  /* ---- Status ------------------------------------------------------------ */

  const statusCount = new Map<string, number>()
  for (const s of listed) {
    const label = statusTag(s.status).label
    statusCount.set(label, (statusCount.get(label) ?? 0) + 1)
  }
  const statuses = [...statusCount.entries()]
    .sort((a, b) => {
      const ia = STATUS_ORDER.indexOf(a[0])
      const ib = STATUS_ORDER.indexOf(b[0])
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
    })
    .map(([label, value]) => ({ label, value }))

  /* ---- When each was started ---------------------------------------------- */

  const dated = listed.filter((s) => /^\d{4}-\d{2}/.test(s.createdAt ?? ""))
  const undated = n - dated.length
  const firstMonth = dated.reduce(
    (min, s) => (s.createdAt.slice(0, 7) < min ? s.createdAt.slice(0, 7) : min),
    "9999-12"
  )
  const lastMonth = /^\d{4}-\d{2}/.test(d.generated ?? "") ? d.generated.slice(0, 7) : firstMonth
  const months: StripDatum[] =
    dated.length > 0
      ? monthRange(firstMonth, lastMonth).map((ym) => ({
          label: `${MONTH_NAMES[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`,
          value: dated.filter((s) => s.createdAt.slice(0, 7) === ym).length,
        }))
      : []
  const monthTicks: ChartTick[] = months.map((m, i) => ({ at: i, label: m.label.slice(0, 3) }))
  const peak = months.reduce<StripDatum | null>((a, b) => (a && a.value >= b.value ? a : b), null)
  const newest = sorted.find((s) => monthYear(s.createdAt))

  return (
    <div className="page">
      <Head />

      <p className="lede">
        Research notes in environmental data science: seismology, space weather, climate,
        hydrology, and the cross-domain bits where everything starts to look the same. They are
        the workspaces of the Data Lab at{" "}
        <a href="https://terrapulse.info" target="_blank" rel="noopener noreferrer">
          TerraPulse
        </a>
        , a measured-data platform for climate and geophysical data. I am its architect.
      </p>

      {/* The caveat and what is withheld, and nothing else: the counts are in
          the panels below, once. */}
      <div className="notice">
        <b>Most of this is unfinished, and none of it is peer reviewed.</b>
        {byAgent > 0 && (
          <>
            {" "}
            {byAgent} of the {n} notes {plural(byAgent, "is", "are")} credited in the source data to
            an AI agent.
          </>
        )}
        {withdrawnHere.length > 0 && (
          <>
            {" "}
            {withdrawnHere.length} more {plural(withdrawnHere.length, "study is", "studies are")}{" "}
            withdrawn: the project that produced {plural(withdrawnHere.length, "it", "them")} took{" "}
            {plural(withdrawnHere.length, "it", "them")} off its own site, so{" "}
            {plural(withdrawnHere.length, "it appears", "they appear")} at the foot of this page by
            title only.
          </>
        )}
        {withdrawnOmitted > 0 && (
          <>
            {" "}
            {withdrawnOmitted} more {plural(withdrawnOmitted, "study is", "studies are")} not
            listed: the project that produced {plural(withdrawnOmitted, "it", "them")} withdrew{" "}
            {plural(withdrawnOmitted, "it", "them")} from its own site, so nothing from{" "}
            {plural(withdrawnOmitted, "it", "them")} is published here.
          </>
        )}
      </div>

      {/* ================================================================== */}
      <div className="prose beta-sec">
        <h2>The index, counted</h2>
      </div>

      <RampKey low="fewer" high="more" />

      {/* Three measurements, each said once. The domain counts are not here:
          the filter chips below carry them, and a chart of the same seven
          numbers one screen above the chips said nothing the chips do not. */}
      <div className="beta-papers-counts">
        <div className="panel">
          <div className="panel-face">
            <div className="panel-bar">
              <b>Where each note stands</b>
              <span>{n} listed</span>
            </div>
            <RowChart caption="Notes per status" data={statuses} />
            <p className="beta-chart__note">
              A note&rsquo;s place in the lab&rsquo;s own workflow. Accepted means the lab&rsquo;s
              internal review passed it; no journal was involved.
            </p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-face">
            <div className="panel-bar">
              <b>What is in it</b>
              <span>on this site</span>
            </div>
            <table className="readout beta-papers-readout">
              <tbody>
                <tr>
                  <td>Listed here</td>
                  <td className="num">{n}</td>
                </tr>
                <tr>
                  <td>Figure shown</td>
                  <td className="num">
                    {shownFigures} of {n}
                  </td>
                </tr>
                <tr>
                  <td>Paper PDF on this site</td>
                  <td className="num">
                    {mirroredPapers} of {n}
                  </td>
                </tr>
                {withdrawnOmitted > 0 && (
                  <tr>
                    <td>Withdrawn at source, not shown</td>
                    <td className="num">{withdrawnOmitted}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <p className="beta-chart__note">
              These count what is mirrored on this site. More of the notes have figures and a
              compiled paper in their workspace at the lab than are shown here.
            </p>
          </div>
        </div>

        <div className="panel beta-papers-counts__wide">
          <div className="panel-face">
            <div className="panel-bar">
              <b>When each was started</b>
              {newest && <span>newest {monthYear(newest.createdAt)}</span>}
            </div>
            <BarStrip
              caption={
                months.length > 0
                  ? `Notes started per month, ${months[0].label} to ${months[months.length - 1].label}`
                  : "Notes started per month"
              }
              summary={
                peak
                  ? `${dated.length} of ${n} notes carry a start date. The busiest month is ${peak.label} with ${peak.value}.`
                  : "No note carries a start date."
              }
              unit="notes"
              data={months}
              ticks={monthTicks}
              height={88}
              emptyNote="No note in the file carries a start date."
            />
            <p className="beta-chart__note">
              Counted by the date each workspace was created. Only the notes still listed are
              counted, so a month can look quieter here than it was.
              {undated > 0 &&
                ` ${undated} ${plural(undated, "note has", "notes have")} no start date in the source and ${plural(undated, "is", "are")} not drawn.`}
            </p>
          </div>
        </div>
      </div>

      <Measured generated={d.generated} />

      {/* ================================================================== */}
      <div className="prose beta-sec" id="notes">
        <h2>The notes</h2>
        <p>
          {featured > 0
            ? `The ${plural(featured, "note", "notes")} with a published results table ${plural(featured, "comes", "come")} first; the rest run newest first.`
            : "Newest first."}{" "}
          A figure opens at full size. Every card links to its workspace on terrapulse.info, where
          the work is written out.
        </p>
      </div>

      <div className="beta-papers-browse" data-papers-browse>
        <style dangerouslySetInnerHTML={{ __html: filterCss }} />

        <div
          className="beta-papers-filter"
          id="papers-filter"
          role="radiogroup"
          aria-labelledby="pf-legend"
        >
          <span className="beta-papers-filter__legend" id="pf-legend">
            Domain
          </span>
          <span className="beta-papers-filter__opt">
            <input
              className="sr-only"
              type="radio"
              name={FILTER}
              id="pf-all"
              value="all"
              defaultChecked
            />
            <label className="chip" htmlFor="pf-all">
              All <span className="beta-papers-filter__n">{n}</span>
            </label>
          </span>
          {domains.map(({ id, count, label }) => (
            <span className="beta-papers-filter__opt" key={id}>
              <input className="sr-only" type="radio" name={FILTER} id={`pf-${id}`} value={id} />
              <label className="chip" htmlFor={`pf-${id}`}>
                {label} <span className="beta-papers-filter__n">{count}</span>
              </label>
            </span>
          ))}
        </div>

        <p className="beta-papers-showing" data-showing>
          <span data-for="all">All {n} notes.</span>
          {domains.map(({ id, count, label }) => (
            <span data-for={id} key={id}>
              {count} of {n} {plural(count, "note", "notes")}: {label.toLowerCase()}.
            </span>
          ))}
        </p>

        <div className="beta-papers-grid">
          {cards.map((c) => (
            <StudyCard key={c.study.slug} {...c} />
          ))}
        </div>

        {/* With scripts on, FilterHash puts a "back to the filter" control in
            reach anywhere in the grid. With them off, this plain link at the
            foot of the grid is the way back (shown only then: kit.css). */}
        <p className="beta-papers-back">
          <a href="#papers-filter">Back to the domain filter</a>
        </p>
      </div>

      <FilterHash group={FILTER} />

      {withdrawnHere.length > 0 && (
        <details className="beta-papers-more beta-papers-withdrawn">
          <summary>
            {withdrawnHere.length} withdrawn {plural(withdrawnHere.length, "study", "studies")}, by
            title
          </summary>
          <ul>
            {withdrawnHere.map((s) => (
              <li key={s.slug}>{cleanTitle(s.title)}</li>
            ))}
          </ul>
        </details>
      )}

      <Measured generated={d.generated} />
    </div>
  )
}
