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
  category: string
  createdAt: string
}

interface PapersData {
  generated: string
  totalStudies: number
  totalReferences: number
  categories: Record<string, number>
  studies: Study[]
}

/** Em dashes are banned in shipped text; the source titles carry them. */
const clean = (s: string) => s.replace(/\s*—\s*/g, ": ")

export default function BetaPapersPage() {
  const d = JSON.parse(
    readFileSync(join(process.cwd(), "public/data/papers-data.json"), "utf-8")
  ) as PapersData

  const cats = Object.entries(d.categories)
    .sort((a, b) => b[1] - a[1])
    .map(([name, n]) => ({ label: name, value: n, display: `${n}` }))

  const recent = [...d.studies]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 15)

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
        {d.totalStudies} research notes across {Object.keys(d.categories).length} domains. Most are
        drafts and are marked as such.
      </p>

      <RampKey low="fewer" high="more" />

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>By domain</b>
            <span>{d.totalStudies} studies</span>
          </div>
          <RowChart caption="Studies per domain" data={cats} />
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>Most recent</h2>
      </div>

      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="Recent studies">
          <table>
            <thead>
              <tr>
                <th>Study</th>
                <th>Domain</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((s) => (
                <tr key={s.slug}>
                  <td className="name">{clean(s.title)}</td>
                  <td>{s.category}</td>
                  <td>
                    <span className={`tag ${s.status === "published" ? "live" : "warn"}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tbl-foot">
            <span>
              {recent.length} of {d.totalStudies} shown
            </span>
          </div>
        </div>
      </div>

      <BetaMeasured generated={d.generated} source="papers-data.json" />
    </div>
  )
}
