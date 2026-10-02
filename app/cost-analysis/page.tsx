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
    "What one operator with AI tooling cost against a modelled conventional team: a frozen case study of one real project, 2025-12-01 to 2026-03-26.",
}

/**
 * cost-model.json is a FROZEN case study, not a live figure: one fixed window,
 * recorded once, no longer regenerated (scripts/cost-model-pipeline.py refuses
 * to overwrite it). The `frozen` block says when and why, and `frozen.coverage`
 * says what the counts actually cover. Everything in it is optional here so a
 * file without the block still renders.
 */
interface CostModelFrozen {
  asOf?: string
  window?: { start?: string; end?: string }
  reason?: string
  coverage?: {
    claudeRecordStart?: string
    commitDaysInWindow?: number
    commitsInWindow?: number
    commitsInWindowRepos?: number
    /** The day the in-window commit count was taken (after the window closed). */
    commitsInWindowCountedOn?: string
    /** What the 2026-03-26 version counted, and the instant its commit source stopped. */
    commitsInWindowAtSnapshot?: number
    commitsSnapshotThrough?: string
    /** A later count of the same window from the live timeline. */
    commitsInWindowRecount?: { countedOn?: string; commits?: number }
    commitsFullHistoryThrough?: string
  }
}

/**
 * "2026-03-26T05:00:02Z" to "2026-03-26 05:00 UTC". Sliced, never parsed, and
 * only for a stamp that says it is UTC; anything else is shown as its date.
 */
function utcStamp(s: string | undefined): string | null {
  if (!s) return null
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*Z$/.test(s)
    ? `${s.slice(0, 10)} ${s.slice(11, 16)} UTC`
    : s.slice(0, 10)
}

interface CostModel {
  generated: string
  scope: string
  frozen?: CostModelFrozen
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
    roles: {
      title: string
      count: number
      annualSalary: number
      loadedCost: number
      halfTime?: boolean
    }[]
    teamSize?: number
    estimatedMonths?: { low: number; high: number }
    costPerPersonMonth?: number
    totalCost?: { low: number; high: number }
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

  const frozen = d.frozen
  const cover = frozen?.coverage
  const winStart = frozen?.window?.start ?? d.timespan.start
  const winEnd = frozen?.window?.end ?? d.timespan.end
  // The date the numbers were recorded. Sliced from the ISO string, never
  // parsed: the stamp has no zone, so a Date would shift it across midnight.
  const recorded = frozen?.asOf ?? d.generated?.slice(0, 10) ?? "an unrecorded date"

  // The commit counts carry their own dates: the in-window count was retaken
  // after the window closed, because the recorded version was generated before
  // its last day had ended.
  const commitsCountedOn = cover?.commitsInWindowCountedOn
  const snapshotThrough = utcStamp(cover?.commitsSnapshotThrough)
  const fullHistoryThrough = utcStamp(cover?.commitsFullHistoryThrough)
  const recount = cover?.commitsInWindowRecount

  const legacyLow = d.legacy.totalCost?.low
  const legacyHigh = d.legacy.totalCost?.high
  const legacyMid =
    typeof legacyLow === "number" && typeof legacyHigh === "number"
      ? (legacyLow + legacyHigh) / 2
      : null
  // What the modelled range was built from, so the percentage below says what
  // it is a percentage of.
  const legacyBasis =
    typeof d.legacy.teamSize === "number" &&
    typeof d.legacy.costPerPersonMonth === "number" &&
    d.legacy.estimatedMonths
      ? ` (${d.legacy.teamSize} people for ${d.legacy.estimatedMonths.low} to ${d.legacy.estimatedMonths.high} months at ${usd(d.legacy.costPerPersonMonth)} per person-month)`
      : ""
  const halfTimeRoles = d.legacy.roles.filter((r) => r.halfTime).length

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

      {/* This is a dated case study. Say so before anything else: a reader who
          takes these for live figures has been misled even if every number is
          right. */}
      {frozen ? (
        <div className="notice">
          <b>A frozen case study, not a live figure.</b> This page describes one fixed window,{" "}
          {winStart} to {winEnd}, as recorded on {recorded}. Nothing on it updates. The AI session
          logs it was computed from have since moved past that window, so the session figures cannot
          be recomputed. Commit counts can still be recounted
          {commitsCountedOn ? `, and the in-window count below was, on ${commitsCountedOn}` : ""}.
        </div>
      ) : (
        <div className="notice">
          <b>One fixed window.</b> This page describes {winStart} to {winEnd}, as generated on{" "}
          {recorded}.
        </div>
      )}

      {/* The honest caveat goes above the numbers, not in a footnote under them.
          One side of this comparison was measured and the other was modelled,
          and a reader who learns that after seeing "95% savings" has already
          formed the impression. */}
      <div className="notice">
        <b>Read this first.</b> The left column is recorded: real sessions and real commits, with
        cost at a flat monthly rate for the operator and for the AI plan rather than from invoices.
        The right column is a model, priced at market salary plus a 1.4x loading for a team that
        was never hired. It is an estimate of an alternative, not a record of one.
      </div>

      <div className="prose beta-sec">
        <h2>The two columns</h2>
        <p>Scope: {d.scope}.</p>
        {typeof cover?.commitsInWindow === "number" &&
          typeof cover.commitsInWindowAtSnapshot === "number" &&
          commitsCountedOn && (
            <p>
              The in-window commit count is not the one recorded on {recorded}. That version was
              generated before the window&rsquo;s last day had ended
              {snapshotThrough ? `: its commit source stopped at ${snapshotThrough}` : ""}, and it
              counted {cover.commitsInWindowAtSnapshot.toLocaleString()}. The count taken on{" "}
              {commitsCountedOn}, after the window closed, is{" "}
              {cover.commitsInWindow.toLocaleString()}.
              {typeof recount?.commits === "number" && recount.countedOn
                ? ` A count of the same days on ${recount.countedOn} gives ${recount.commits.toLocaleString()}, because one repository's history was rewritten in between.`
                : ""}
            </p>
          )}
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Recorded</b>
            <span>
              {winStart} to {winEnd}
            </span>
          </div>
          <table className="readout">
            <tbody>
              <tr>
                <td>Team size</td>
                <td className="num">{d.actual.teamSize}</td>
              </tr>
              {typeof cover?.commitsInWindow === "number" && (
                <tr>
                  <td>
                    Commits in the window
                    {typeof cover.commitsInWindowRepos === "number"
                      ? `, all ${cover.commitsInWindowRepos} org repositories`
                      : ""}
                    {commitsCountedOn ? `, counted ${commitsCountedOn}` : ""}
                  </td>
                  <td className="num">{cover.commitsInWindow.toLocaleString()}</td>
                </tr>
              )}
              <tr>
                <td>
                  Commits, full history of the {d.actual.repos} project repositories
                  {fullHistoryThrough ? `, to ${fullHistoryThrough}` : ""}
                </td>
                <td className="num">{d.actual.commits.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Project repositories active in the window</td>
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
          {halfTimeRoles > 0
            ? ` That is every seat at full time; the cost model counts ${halfTimeRoles === 1 ? "one of them" : `${halfTimeRoles} of them`} at half time.`
            : ""}
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
          {d.comparison.costSavingsPercent}% lower cost over the window
          {legacyMid !== null && typeof legacyLow === "number" && typeof legacyHigh === "number"
            ? `: ${usd(d.actual.totalCost)} recorded against ${usd(legacyMid)}, the midpoint of a modelled ${usd(legacyLow)} to ${usd(legacyHigh)}${legacyBasis}`
            : ""}
          . The figure compares a recorded column against a modelled one and inherits that
          model&rsquo;s assumptions entirely.
        </p>
        <p>
          The pipeline also computed a time compression of &ldquo;
          {d.comparison.timeCompression.replace("->", "to")}&rdquo; and a velocity multiplier of{" "}
          {d.comparison.velocityMultiplier.toLocaleString()}x. Neither is quoted as a headline here.
          Both rest on an active-day count of {d.timespan.activeDays}, which counts days with a
          recorded AI session
          {cover?.claudeRecordStart
            ? `, and that record only begins ${cover.claudeRecordStart}`
            : ""}
          .{" "}
          {typeof cover?.commitDaysInWindow === "number"
            ? `Commits landed on ${cover.commitDaysInWindow} of the ${d.timespan.days} days in the window. `
            : ""}
          So {d.timespan.activeDays} is not the elapsed time, and a ratio built on it overstates.
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

      {frozen ? (
        <BetaMeasured source="cost-model.json">
          <b>cost-model.json</b>, frozen case study of {winStart} to {winEnd}, recorded {recorded}
        </BetaMeasured>
      ) : (
        <BetaMeasured generated={d.generated} source="cost-model.json" />
      )}
    </div>
  )
}
