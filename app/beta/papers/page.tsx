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
  studies: Study[]
}

/** Em dashes are banned in shipped text; the source titles are full of them. */
const clean = (s: string) => s.replace(/\s*—\s*/g, ": ")

/**
 * Nine distinct status strings come out of the pipeline. Map them onto the
 * kit's three tag states rather than inventing colours: `live` for work that is
 * finished, `warn` for work in flight, `fail` for work that was abandoned.
 *
 * Withdrawn reads as `fail` because that is the kit's "this did not hold" state
 * and a withdrawn study is exactly that. It is not an error.
 */
function statusTag(status: string): string {
  const s = status.toLowerCase()
  if (s === "withdrawn") return "fail"
  if (s.startsWith("complete") || s === "published" || s === "accepted") return "live"
  return "warn"
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
  const featured = sorted.filter((s) => s.hasPaper || s.previewImage).slice(0, 12)
  const withPaper = d.studies.filter((s) => s.hasPaper && s.paperUrl)
  const withViz = d.studies.filter((s) => s.previewImage)

  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/beta">bradley.io</Link>
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
        <b>Most of this is unfinished.</b> {withPaper.length} of {d.totalStudies} have a written
        paper; {withViz.length} have a figure. The rest are notes with an abstract and a method,
        and each one carries its own status below.
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
              <span className={`tag ${statusTag(s.status)}`}>{s.status}</span>{" "}
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
                    <span className={`tag ${statusTag(s.status)}`}>{s.status}</span>
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
