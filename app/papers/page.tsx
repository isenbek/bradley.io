import { readFileSync } from "fs"
import { join } from "path"
import Link from "next/link"
import type { Metadata } from "next"
import { RowChart, RampKey } from "../_charts"
import { BetaMeasured } from "../_measured"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Papers",
  description:
    "Research notes across seismology, space weather, climate and hydrology, with the cross-domain clustering work that connects them.",
}

interface Study {
  slug: string
  title: string
  description: string
  status: string
  author: string
  category: string
  createdAt: string
  hasPaper: boolean
  hasViz: boolean
  previewImage: string | null
  paperUrl: string | null
  dataFileCount: number
  references?: { title?: string; url?: string }[]
  /** Set by the pipeline from 2026-10-02; absent on an older papers-data.json. */
  withdrawn?: boolean
  resultsSummary?: {
    totalStreams: number
    clustered: number
    highlights: { label: string; category: string; cv: number; events: number; verdict: string }[]
  }
}

interface PapersData {
  generated: string
  totalStudies: number
  categories: Record<string, number>
  /** Studies the source project took off its own site. Absent on older data. */
  withdrawnCount?: number
  /** "omitted": not in `studies` at all. "listed": in `studies`, title only. */
  withdrawnPolicy?: string
  studies: Study[]
}

/** Em dashes are banned in shipped text; the source titles are full of them. */
const clean = (s: string) => s.replace(/\s*—\s*/g, ": ")

type StatusTag = { cls: "" | "live" | "warn"; label: string }

const FINISHED = "live" as const
const IN_FLIGHT = "warn" as const
const NEUTRAL = "" as const

/**
 * Every status the pipeline can emit, mapped on purpose. Three tag states:
 * `live` for work that is finished, `warn` for work in flight, and the plain
 * neutral tag for everything else.
 *
 * Withdrawn is NEUTRAL. A withdrawn study is a decision that was taken, not an
 * assertion that failed (red) and not something waiting on anyone (orange).
 * Before 2026-10-02 "withdrawn" rendered red and "withdrawn-permanent" fell
 * through to orange; both were wrong.
 *
 * The first block is the pipeline's public vocabulary (STATUS_PUBLIC in
 * scripts/papers-pipeline.py). The second block is the raw strings an older
 * papers-data.json still carries, so the page reads correctly on either file.
 * The label is what is shown: a raw workflow string is never printed.
 */
const STATUS: Record<string, StatusTag> = {
  draft: { cls: IN_FLIGHT, label: "draft" },
  active: { cls: IN_FLIGHT, label: "active" },
  "in review": { cls: IN_FLIGHT, label: "in review" },
  "in revision": { cls: IN_FLIGHT, label: "in revision" },
  complete: { cls: FINISHED, label: "complete" },
  accepted: { cls: FINISHED, label: "accepted" },
  published: { cls: FINISHED, label: "published" },
  withdrawn: { cls: NEUTRAL, label: "withdrawn" },
  unknown: { cls: NEUTRAL, label: "status unknown" },

  "withdrawn-permanent": { cls: NEUTRAL, label: "withdrawn" },
  "revision-in-progress": { cls: IN_FLIGHT, label: "in revision" },
  "draft-complete-pending-audit": { cls: IN_FLIGHT, label: "in review" },
  "draft-complete-pending-hed-dek": { cls: IN_FLIGHT, label: "in review" },
}

function statusTag(status: string | null | undefined): StatusTag {
  const s = (status ?? "").trim().toLowerCase()
  // Own keys only: a status of "constructor" must not find Object.prototype.
  if (Object.prototype.hasOwnProperty.call(STATUS, s)) return STATUS[s]
  // Any other withdrawn-* variant is still withdrawn, and still neutral.
  if (s.startsWith("withdrawn")) return { cls: NEUTRAL, label: "withdrawn" }
  // The tenth raw string: a draft rewritten and waiting on another review round.
  if (s.startsWith("rewritten")) return { cls: IN_FLIGHT, label: "in review" }
  // Anything this page was not told about gets no colour and no guess.
  return { cls: NEUTRAL, label: "status unknown" }
}

/**
 * Withdrawn at source: the project that produced the study took it off its own
 * site. Such a study is never featured and its figure is never shown, whatever
 * the data file carries. The pipeline already withholds those (WITHDRAWN_POLICY
 * in scripts/papers-pipeline.py); the status test is here so that an older
 * papers-data.json, which still lists them with figures, renders the same way.
 */
function isWithdrawn(s: Study): boolean {
  return s.withdrawn === true || statusTag(s.status).label === "withdrawn"
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const t = statusTag(status)
  return <span className={t.cls ? `tag ${t.cls}` : "tag"}>{t.label}</span>
}

export default function BetaPapersPage() {
  const d = JSON.parse(
    readFileSync(join(process.cwd(), "public/data/papers-data.json"), "utf-8")
  ) as PapersData

  const cats = Object.entries(d.categories)
    .sort((a, b) => b[1] - a[1])
    .map(([name, n]) => ({ label: name, value: n, display: `${n}` }))

  const sorted = [...d.studies].sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
  )

  // The ones with something to actually look at lead the page. A study with a
  // figure or a PDF is a thing you can read; the rest are a title and an
  // abstract, and putting them first buries the work that is finished.
  // A withdrawn study is never one of them.
  const shown = d.studies.filter((s) => !isWithdrawn(s))
  const featured = sorted
    .filter((s) => !isWithdrawn(s) && (s.hasPaper || s.previewImage))
    .slice(0, 12)
  const withPaper = shown.filter((s) => s.hasPaper && s.paperUrl)
  const withViz = shown.filter((s) => s.previewImage)

  // How many are withdrawn, and whether they are in the index below at all.
  // New data says so itself; older data lists them, so count them from there.
  const withdrawnListed = d.studies.length - shown.length
  const withdrawnOmitted =
    d.withdrawnPolicy === "omitted" && typeof d.withdrawnCount === "number" ? d.withdrawnCount : 0

  return (
    <div className="page">
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

      <p className="lede">
        {d.totalStudies} research notes across {Object.keys(d.categories).length} domains:
        seismology, space weather, climate, hydrology, and the cross-domain clustering work that
        connects them.
      </p>

      <div className="notice">
        <b>Most of this is unfinished.</b> {withPaper.length} of {d.totalStudies}{" "}
        {withPaper.length === 1 ? "has" : "have"} a written
        paper; {withViz.length} have a figure. The rest are notes with an abstract and a method,
        and each one carries its own status below.
        {withdrawnListed > 0 && (
          <>
            {" "}
            {withdrawnListed} of the {d.totalStudies} {withdrawnListed === 1 ? "is" : "are"}{" "}
            withdrawn: the project that produced {withdrawnListed === 1 ? "it" : "them"} took{" "}
            {withdrawnListed === 1 ? "it" : "them"} off its own site, so{" "}
            {withdrawnListed === 1 ? "it appears" : "they appear"} here by title only.
          </>
        )}
        {withdrawnOmitted > 0 && (
          <>
            {" "}
            {withdrawnOmitted} more {withdrawnOmitted === 1 ? "study is" : "studies are"} not
            listed: the project that produced {withdrawnOmitted === 1 ? "it" : "them"} withdrew{" "}
            {withdrawnOmitted === 1 ? "it" : "them"} from its own site, so nothing from{" "}
            {withdrawnOmitted === 1 ? "it" : "them"} is published here.
          </>
        )}
      </div>

      <div className="prose beta-sec">
        <h2>By domain</h2>
      </div>

      <RampKey low="fewer" high="more" />

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Studies per domain</b>
            <span>{d.totalStudies} total</span>
          </div>
          <RowChart caption="Studies per domain" data={cats} />
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>The work</h2>
        <p>Studies with a figure or a paper, most recent first.</p>
      </div>

      <div className="beta-papers">
        {featured.map((s) => (
          <article className="rail beta-paper" key={s.slug}>
            {s.previewImage && (
              <a className="beta-paper__fig" href={s.paperUrl ?? s.previewImage}>
                {/* Plain <img>: the @next/next eslint plugin is not configured in
                    this repo, so a disable comment for no-img-element is itself
                    an error, and next/image would want a loader for these. */}
                <img src={s.previewImage} alt={`Figure from ${clean(s.title)}`} loading="lazy" />
              </a>
            )}
            <h3>{clean(s.title)}</h3>
            <p className="beta-paper__meta">
              <StatusBadge status={s.status} />{" "}
              <span className="tag">{s.category}</span>
            </p>
            <p>{clean(s.description)}</p>

            {s.resultsSummary && (
              <p className="quiet">
                {s.resultsSummary.clustered} of {s.resultsSummary.totalStreams} streams clustered.
                {s.resultsSummary.highlights.slice(0, 3).map((h) => (
                  <span key={h.label}>
                    {" "}
                    {h.label}: CV {h.cv}, {h.verdict}.
                  </span>
                ))}
              </p>
            )}

            <p className="beta-paper__links">
              {s.paperUrl && (
                <a className="btn" href={s.paperUrl} target="_blank" rel="noopener noreferrer">
                  Read the paper
                </a>
              )}
              {s.dataFileCount > 0 && (
                <span className="quiet">
                  {s.dataFileCount} data {s.dataFileCount === 1 ? "file" : "files"}
                </span>
              )}
            </p>
          </article>
        ))}
      </div>

      <div className="prose beta-sec">
        <h2>Everything else</h2>
        <p>
          The full index, including notes with no figure yet.
        </p>
      </div>

      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="All studies">
          <table>
            <thead>
              <tr>
                <th>Study</th>
                <th>Domain</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s.slug}>
                  <td className="name">{clean(s.title)}</td>
                  <td>{s.category}</td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tbl-foot">
            <span>{sorted.length} studies</span>
          </div>
        </div>
      </div>

      <BetaMeasured generated={d.generated} source="papers-data.json" />
    </div>
  )
}
