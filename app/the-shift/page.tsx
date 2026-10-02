import { readFileSync } from "fs"
import { join } from "path"
import Link from "next/link"
import type { Metadata } from "next"
import { coverageText, loadPilotData, longDate, tokens } from "../_pilot-data"
import { RowChart, RampKey } from "../_charts"
import { BetaMeasured } from "../_measured"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "The shift",
  description:
    "Five things that changed when the tooling changed: domain coverage, velocity, time allocation, context and ecosystem, each with the number behind it.",
}

/**
 * cost-model.json is a FROZEN case study of one fixed window, not a live
 * figure (see app/cost-analysis/page.tsx and the `frozen` block in the file).
 * The pilot data on this page is live. The page has to keep the two apart.
 */
interface CostModel {
  generated: string
  frozen?: {
    asOf?: string
    window?: { start?: string; end?: string }
    coverage?: {
      commitsInWindow?: number
      commitsInWindowRepos?: number
      /** The day the in-window commit count was taken (after the window closed). */
      commitsInWindowCountedOn?: string
      /** The instant the full-history count stops. */
      commitsFullHistoryThrough?: string
    }
  }
  timespan: { start?: string; end?: string; days: number; activeDays: number }
  actual: { teamSize: number; commits: number; repos: number; projects: number }
  legacy: { roles: { count: number }[] }
  comparison: { costSavingsPercent: number; timeCompression: string }
  issues: { opened: number; closed: number }
}

/**
 * The shift.
 *
 * v3 argued this over 1,075 lines. The argument was fine; the length was the
 * problem, because each claim was made three times: once as a heading, once as
 * a paragraph, and once as a number. Only the number is evidence, so the number
 * is what is left, with a sentence to say what it is evidence of.
 */
export default function BetaShiftPage() {
  const pilot = loadPilotData()
  const cost = JSON.parse(
    readFileSync(join(process.cwd(), "public/data/cost-model.json"), "utf-8")
  ) as CostModel

  const legacyHeads = cost.legacy.roles.reduce((s, r) => s + r.count, 0)

  const frozen = cost.frozen
  const cover = frozen?.coverage
  const winStart = frozen?.window?.start ?? cost.timespan.start
  const winEnd = frozen?.window?.end ?? cost.timespan.end
  const windowLabel = winStart && winEnd ? `${winStart} to ${winEnd}` : `${cost.timespan.days} days`
  // Sliced from the ISO strings, never parsed into a Date: the stamps carry no
  // zone, and a parsed one can land on the wrong side of midnight.
  const recorded = frozen?.asOf ?? cost.generated?.slice(0, 10) ?? "an unrecorded date"
  const pilotGenerated = pilot.generated ? pilot.generated.slice(0, 10) : null
  // The commit counts carry their own dates (see /cost-analysis for why the
  // in-window count was retaken after the window closed). A UTC stamp is shown
  // to the minute; anything else as its date.
  const commitsCountedOn = cover?.commitsInWindowCountedOn
  const fullThrough = cover?.commitsFullHistoryThrough
  const fullHistoryThrough = !fullThrough
    ? null
    : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*Z$/.test(fullThrough)
      ? `${fullThrough.slice(0, 10)} ${fullThrough.slice(11, 16)} UTC`
      : fullThrough.slice(0, 10)

  const domains = Object.entries(pilot.instrumentRatings)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([name, r]) => ({ label: name, value: r.score, display: `${r.score}` }))

  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">The shift</span>
          </span>
        </nav>
        <h1>The shift</h1>
      </div>

      <p className="lede">
        Five things that changed when the tooling changed, and the number behind each one.
      </p>

      <div className="notice">
        <b>One project, one operator.</b> Everything below is drawn from a single body of work. It
        is a description of what happened here, not a claim about what happens generally.
      </div>

      {/* Two sources with two clocks. The throughput panel is the frozen cost
          case study; the rest is the live pilot record. Saying "one window" for
          both was untrue. */}
      <div className="notice">
        <b>{frozen ? "Part of this page is frozen." : "Two sources."}</b> The throughput panel and
        the team comparison are a case study of one fixed window, {windowLabel}, recorded on{" "}
        {recorded}
        {frozen ? ". They are not live figures and do not update" : ""}
        {commitsCountedOn
          ? `; the in-window commit count was retaken on ${commitsCountedOn}, after the window closed`
          : ""}
        . The coverage chart and
        the message and token figures come from the pilot record
        {pilotGenerated ? `, last generated ${pilotGenerated}` : ""}, and cover its own period.
      </div>

      <div className="prose beta-sec">
        <h2>From teams to soloists</h2>
        <p>
          {legacyHeads} roles worth of surface area, covered by {cost.actual.teamSize}. The ratings
          below are keyword coverage over project notes, plan files and the technologies named in
          about the last 30 days of session logs, so they show breadth of work touched rather than
          depth of expertise.
        </p>
      </div>

      <RampKey low="lower" high="higher" />

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Domain coverage</b>
            <span>0 to 100</span>
          </div>
          <RowChart caption="Coverage by domain" data={domains} />
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>From sprints to streams</h2>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Throughput</b>
            <span>{windowLabel}</span>
          </div>
          <table className="readout">
            <tbody>
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
                  Commits, full history of the {cost.actual.repos} project repositories
                  {fullHistoryThrough ? `, to ${fullHistoryThrough}` : ""}
                </td>
                <td className="num">{cost.actual.commits.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Project repositories touched</td>
                <td className="num">{cost.actual.repos.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Issues opened</td>
                <td className="num">{cost.issues.opened.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Issues closed</td>
                <td className="num">{cost.issues.closed.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <p className="beta-chart__note">
            Issues closed trails issues opened by{" "}
            {(cost.issues.opened - cost.issues.closed).toLocaleString()}. Throughput went up; the
            backlog still grew.
          </p>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>From meetings to messages</h2>
        <p>
          {pilot.license.totalMessages.toLocaleString("en-US")} transcript records across{" "}
          {pilot.license.totalSessions} sessions and {pilot.license.projectCount} projects. The unit
          of coordination stopped being an hour on a calendar.
        </p>
        <p className="quiet">{coverageText(pilot)}</p>

        <h2>The cache effect</h2>
        <p>
          {pilot.tokenEconomy.cacheEfficiency.toFixed(1)}% of input came from cache. That is the
          whole reason a long-running context is affordable: re-reading the project each turn is
          what the cache is paying for.
        </p>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Context</b>
            <span>{longDate(pilot.coverage?.since) ? `tokens since ${longDate(pilot.coverage?.since)}` : "tokens, period not recorded"}</span>
          </div>
          <table className="readout">
            <tbody>
              <tr>
                <td>Cache read</td>
                <td
                  className="num"
                  title={pilot.tokenEconomy.totalCacheReadTokens.toLocaleString()}
                >
                  {tokens(pilot.tokenEconomy.totalCacheReadTokens)}
                </td>
              </tr>
              <tr>
                <td>Fresh input</td>
                <td className="num" title={pilot.tokenEconomy.totalInputTokens.toLocaleString()}>
                  {tokens(pilot.tokenEconomy.totalInputTokens)}
                </td>
              </tr>
              <tr>
                <td>Output</td>
                <td className="num" title={pilot.tokenEconomy.totalOutputTokens.toLocaleString()}>
                  {tokens(pilot.tokenEconomy.totalOutputTokens)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>Compound velocity</h2>
        <p>
          Tools built for one project get used by the next. That is the part that compounds, and it
          is also the part this page cannot measure: there is no counter for a script that saved an
          afternoon six months later.
        </p>
        <p>
          The cost side of the fixed window is on <Link href="/cost-analysis">cost analysis</Link>,
          including what is recorded there and what is modelled.
        </p>
      </div>

      <BetaMeasured source="cost-model.json + ai-pilot-data.json">
        <b>cost-model.json</b>
        {frozen
          ? `, frozen case study of ${windowLabel}, recorded ${recorded}`
          : `, generated ${recorded}`}
        {"; "}
        <b>ai-pilot-data.json</b>
        {pilotGenerated ? `, generated ${pilotGenerated}` : ", generation date not recorded"}
      </BetaMeasured>
    </div>
  )
}
