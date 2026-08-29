import { readFileSync } from "fs"
import { join } from "path"
import Link from "next/link"
import type { Metadata } from "next"
import { RowChart, RampKey } from "../_charts"
import { BetaMeasured } from "../_measured"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Cost analysis",
  description:
    "What one operator with AI tooling cost against a modelled conventional team, over one real project and three months of commit history.",
}

interface CostModel {
  generated: string
  scope: string
  timespan: { start: string; end: string; days: number; activeDays: number }
  actual: {
    teamSize: number
    sessions: number
    messages: number
    commits: number
    repos: number
    projects: number
    operatorCost: number
    aiCost: number
    totalCost: number
    domains: { name: string; score: number }[]
  }
  legacy: {
    roles: { title: string; count: number; annualSalary: number; loadedCost: number }[]
    [k: string]: unknown
  }
  comparison: { costSavingsPercent: number; velocityMultiplier: number; timeCompression: string }
  industryBenchmarks: { studies: { source: string; finding: string }[] }
  issues: { opened: number; closed: number; bugs: number; features: number; other: number }
}

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`

export default function BetaCostPage() {
  const d = JSON.parse(
    readFileSync(join(process.cwd(), "public/data/cost-model.json"), "utf-8")
  ) as CostModel

  const legacyTotal = d.legacy.roles.reduce((s, r) => s + r.loadedCost * r.count, 0)
  const legacyHeads = d.legacy.roles.reduce((s, r) => s + r.count, 0)

  const roles = [...d.legacy.roles]
    .sort((a, b) => b.loadedCost * b.count - a.loadedCost * a.count)
    .map((r) => ({
      label: r.count > 1 ? `${r.title} x${r.count}` : r.title,
      value: r.loadedCost * r.count,
      display: usd(r.loadedCost * r.count),
    }))

  const domains = [...d.actual.domains]
    .sort((a, b) => b.score - a.score)
    .map((x) => ({ label: x.name, value: x.score, display: `${x.score}` }))

  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Cost analysis</span>
          </span>
        </nav>
        <h1>Cost analysis</h1>
      </div>

      <p className="lede">
        One operator with AI tooling, against a modelled conventional team, over{" "}
        {d.timespan.days} days of one real project.
      </p>

      {/* The honest caveat goes above the numbers, not in a footnote under them.
          One side of this comparison was measured and the other was modelled,
          and a reader who learns that after seeing "95% savings" has already
          formed the impression. */}
      <div className="notice">
        <b>Read this first.</b> The left column is measured: real sessions, real commits, real
        invoices. The right column is a model, priced at market salary plus a 1.4x loading for a
        team that was never hired. It is an estimate of an alternative, not a record of one.
      </div>

      <div className="prose beta-sec">
        <h2>The two columns</h2>
        <p>Scope: {d.scope}.</p>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Measured</b>
            <span>
              {d.timespan.start} to {d.timespan.end}
            </span>
          </div>
          <table className="readout">
            <tbody>
              <tr>
                <td>Team size</td>
                <td className="num">{d.actual.teamSize}</td>
              </tr>
              <tr>
                <td>Commits</td>
                <td className="num">{d.actual.commits.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Repositories</td>
                <td className="num">{d.actual.repos.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Issues opened</td>
                <td className="num">{d.issues.opened.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Issues closed</td>
                <td className="num">{d.issues.closed.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Operator cost</td>
                <td className="num">{usd(d.actual.operatorCost)}</td>
              </tr>
              <tr>
                <td>AI cost</td>
                <td className="num">{usd(d.actual.aiCost)}</td>
              </tr>
              <tr>
                <td>
                  <b>Total</b>
                </td>
                <td className="num">
                  <b>{usd(d.actual.totalCost)}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>The modelled team</h2>
        <p>
          {legacyHeads} people at {usd(legacyTotal)} a year fully loaded. Salary figures are market
          rate; the 1.4x loading covers benefits, tax and overhead.
        </p>
      </div>

      <RampKey low="lower cost" high="higher" />

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Loaded cost by role</b>
            <span>annual</span>
          </div>
          <RowChart caption="Fully loaded annual cost" data={roles} />
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>The gap</h2>
        <p>
          {d.comparison.costSavingsPercent}% lower cost over the window, and{" "}
          {d.comparison.timeCompression.replace("->", "to")} in elapsed time. Both figures compare a
          measured column against a modelled one and inherit that model&rsquo;s assumptions
          entirely.
        </p>
        <p>
          The velocity multiplier the pipeline computes is{" "}
          {d.comparison.velocityMultiplier.toLocaleString()}x. It is not quoted as a headline here,
          because it divides by an active-day count of {d.timespan.activeDays}, and a ratio with a
          denominator that small is arithmetic rather than evidence.
        </p>

        <h2>What the work covered</h2>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Domain coverage</b>
            <span>0 to 100</span>
          </div>
          <RowChart caption="Keyword coverage by domain" data={domains} />
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>What the research says</h2>
        <p>
          Published findings on AI-assisted development, for calibration against the single project
          above.
        </p>
      </div>

      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="Industry studies">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Finding</th>
              </tr>
            </thead>
            <tbody>
              {d.industryBenchmarks.studies.map((s) => (
                <tr key={s.source}>
                  <td className="name">{s.source}</td>
                  <td>{s.finding}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BetaMeasured generated={d.generated} source="cost-model.json" />
    </div>
  )
}
