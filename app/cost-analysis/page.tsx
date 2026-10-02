import Link from "next/link"
import { BarStrip, LineChart, RowChart, RampKey, type ChartTick } from "../_charts"
import { BetaMeasured } from "../_measured"
import { costNum, costUsd, costUsdTick, costWindow, loadCostModel, utcStamp } from "../_cost-model"
import { ShiftFigure, ShiftKind } from "@/components/shift/ShiftFigure"
import { ShiftRows } from "@/components/shift/ShiftRows"

export const revalidate = 3600

// Metadata lives in ./layout.tsx, with the structured data, so the title and
// the share card are written in one place.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "2025-12-01" to "1 Dec". Sliced, never parsed into a Date. */
function shortDay(iso: string): string {
  const month = MONTHS[Number(iso.slice(5, 7)) - 1]
  return month ? `${Number(iso.slice(8, 10))} ${month}` : iso
}

/**
 * Cost analysis.
 *
 * The page is a dated case study (see app/_cost-model.ts) and says so before
 * anything else. Under that it is a dashboard again: the cumulative cost curve
 * and the weekly series the previous site had and the port dropped, drawn from
 * the frozen file's own weekly rows.
 *
 * The one rule every figure here keeps: RECORDED and MODELLED are never told
 * apart by colour alone. A recorded panel says "recorded" in its bar; a
 * modelled one says "modelled"; on the curve, where both share a plot, the
 * modelled line is dashed and both are named in the legend.
 */
export default function BetaCostPage() {
  const d = loadCostModel()
  const { frozen, start: winStart, end: winEnd, label: windowLabel, recorded } = costWindow(d)
  const cover = frozen?.coverage

  /* ---- The modelled team ------------------------------------------------ */
  const legacyTotal = d.legacy.roles.reduce((s, r) => s + r.loadedCost * r.count, 0)
  const legacyHeads = d.legacy.roles.reduce((s, r) => s + r.count, 0)
  const roles = [...d.legacy.roles]
    .sort((a, b) => b.loadedCost * b.count - a.loadedCost * a.count)
    .map((r) => ({
      label: r.count > 1 ? `${r.title} x${r.count}` : r.title,
      value: r.loadedCost * r.count,
      display: costUsd(r.loadedCost * r.count),
    }))
  const halfTimeRoles = d.legacy.roles.filter((r) => r.halfTime).length

  const legacyLow = d.legacy.totalCost?.low
  const legacyHigh = d.legacy.totalCost?.high
  const legacyMid =
    typeof legacyLow === "number" && typeof legacyHigh === "number"
      ? (legacyLow + legacyHigh) / 2
      : null
  const months = d.legacy.estimatedMonths
  const rate = d.legacy.costPerPersonMonth
  // What the modelled range was built from, so the percentage below says what
  // it is a percentage of.
  const legacyBasis =
    typeof d.legacy.teamSize === "number" && typeof rate === "number" && months
      ? ` (${d.legacy.teamSize} people for ${months.low} to ${months.high} months at ${costUsd(rate)} per person-month)`
      : ""

  /* ---- The recorded column ---------------------------------------------- */
  const domains = [...d.actual.domains]
    .sort((a, b) => b.score - a.score)
    .map((x) => ({ label: x.name, value: x.score, display: `${x.score}` }))

  // The commit counts carry their own dates: the in-window count was retaken
  // after the window closed, because the recorded version was generated before
  // its last day had ended.
  const commitsCountedOn = cover?.commitsInWindowCountedOn
  const snapshotThrough = utcStamp(cover?.commitsSnapshotThrough)
  const fullHistoryThrough = utcStamp(cover?.commitsFullHistoryThrough)
  const recount = cover?.commitsInWindowRecount

  /* ---- The weekly series ------------------------------------------------ */
  const ts = d.timeSeries ?? []
  const weeks = ts.length
  const last = ts.at(-1)
  const weekTicks: ChartTick[] = ts
    .map((t, i) => ({ at: i, label: shortDay(t.weekStart) }))
    .filter((_, i) => i % 4 === 0)

  // The curve. Both lines are a flat rate accumulated week by week: the
  // pipeline spread actual.totalCost over the weeks of the window, and the
  // modelled midpoint over the modelled midpoint duration. Nothing here is
  // recomputed except the two differences a reader would otherwise do by hand.
  const costGap = last ? last.cumulativeCostLegacy - last.cumulativeCostActual : 0
  // The same comparison inside the window: recorded against where the modelled
  // line stood when the window closed, not against the whole modelled job.
  const windowGapPct =
    last && last.cumulativeCostLegacy > 0
      ? (1 - last.cumulativeCostActual / last.cumulativeCostLegacy) * 100
      : null
  const weeklyActual = last && weeks ? last.cumulativeCostActual / weeks : 0
  const weeklyLegacy = last && weeks ? last.cumulativeCostLegacy / weeks : 0
  // How long the modelled job runs at that rate: the midpoint cost over the
  // weekly rate. The curve stops at week 17 of it.
  const modelledWeeks = legacyMid !== null && weeklyLegacy > 0 ? Math.round(legacyMid / weeklyLegacy) : null

  // Weekly commits. The last ISO week of the window is a short one.
  const commitTotal = ts.reduce((s, t) => s + t.commits, 0)
  const busiest = ts.reduce<(typeof ts)[number] | null>((m, t) => (!m || t.commits > m.commits ? t : m), null)
  const quietest = ts.reduce<(typeof ts)[number] | null>((m, t) => (!m || t.commits < m.commits ? t : m), null)
  // Days of the last ISO week that fall inside the window, from the two date
  // strings alone (both are in the same month in this file; a window that ends
  // in a later month than its last Monday simply gets no "short week" note).
  const lastWeekDays =
    last && last.weekStart.slice(0, 7) === winEnd.slice(0, 7)
      ? Number(winEnd.slice(8, 10)) - Number(last.weekStart.slice(8, 10)) + 1
      : null

  // Issues. Two strips, opened over closed, whose tallest bars happen to be
  // close (298 and 309), so the two rows read on nearly one scale; each strip
  // prints its own tallest value. The difference of the two cumulative counts
  // is the backlog the window added.
  const issueGap = last ? last.cumulativeIssuesOpened - last.cumulativeIssuesClosed : 0
  const closedAhead = ts.filter((t) => t.issuesClosed > t.issuesOpened)

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
        {d.timespan.days} days of one real project. A bottom-up bill of materials, not a vendor
        pitch deck.
      </p>

      {/* This is a dated case study. Say so before anything else: a reader who
          takes these for current figures has been misled even if every number
          is right. */}
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
        <b>Read this first.</b> One side of everything below is recorded: real sessions and real
        commits, with cost at a flat monthly rate for the operator and for the AI plan rather than
        from invoices. The other side is a model, priced at market salary plus a 1.4x loading for a
        team that was never hired. It is an estimate of an alternative, not a record of one. Every
        figure says which side it is on, and on the curve the modelled line is the dashed one.
      </div>

      {/* ================================================================
          THE CURVE
          ================================================================ */}
      {last && weeks > 1 && (
        <>
          <div className="prose beta-sec">
            <h2>The curve</h2>
            <p>
              Two lines over the same {weeks} weeks. The lower one is the recorded work at flat
              rates, {costUsd(weeklyActual)} a week. The upper one is the modelled team,{" "}
              {costUsd(weeklyLegacy)} a week. Both are straight because both are rates, not
              invoices. What separates them is the slope.
            </p>
          </div>

          <ShiftFigure
            kind="both"
            source="cost-model.json"
            note={`, timeSeries, ${weeks} ISO weeks, ${windowLabel}, frozen as recorded ${recorded}`}
          >
            <div className="panel">
              <div className="panel-face">
                <div className="panel-bar">
                  <b>Cumulative cost</b>
                  <span className="beta-shift-kinds">
                    <ShiftKind kind="recorded" />
                    <ShiftKind kind="modelled" />
                  </span>
                </div>
                <div className="beta-shift-curve">
                  <LineChart
                    caption={`Cumulative cost in US dollars by ISO week, ${windowLabel}`}
                    summary={`By ${last.week} the recorded work has cost ${costUsd(last.cumulativeCostActual)} at flat rates and the modelled team ${costUsd(last.cumulativeCostLegacy)}, a difference of ${costUsd(costGap)}. The modelled team was never hired.`}
                    x={ts.map((t) => t.week)}
                    series={[
                      {
                        name: "Recorded work, flat rates",
                        values: ts.map((t) => t.cumulativeCostActual),
                      },
                      {
                        name: "Modelled team, never hired",
                        values: ts.map((t) => t.cumulativeCostLegacy),
                      },
                    ]}
                    ticks={weekTicks}
                    format={costUsd}
                    formatTick={costUsdTick}
                    gap={{ label: `${costUsd(costGap)} apart` }}
                    height={260}
                  />
                </div>
                <p className="beta-chart__note">
                  The gap at week {weeks} is spend to date, not a saving
                  {modelledWeeks !== null
                    ? `: in the model the team is ${weeks} weeks into a job of about ${modelledWeeks} and has not shipped`
                    : ""}
                  . The solid line is {costUsd(d.actual.operatorCost)} of operator time and{" "}
                  {costUsd(d.actual.aiCost)} of AI plan, spread evenly over the window. The dashed
                  line is the midpoint of the modelled cost
                  {legacyMid !== null ? `, ${costUsd(legacyMid)},` : ""} spread evenly over the
                  midpoint of the modelled duration.
                </p>
              </div>
            </div>
          </ShiftFigure>
        </>
      )}

      {/* ================================================================
          THE WEEKS
          ================================================================ */}
      {last && weeks > 1 && (
        <>
          <div className="prose beta-sec">
            <h2>What the weeks held</h2>
            <p>
              A cost line at a flat rate says nothing about whether anything was built. These two
              do. Neither involves the model: both are counts of things that happened.
            </p>
          </div>

          <div className="beta-shift-two">
            <ShiftFigure
              kind="recorded"
              source="cost-model.json"
              note={`, timeSeries.commits, all authors, ${windowLabel}${commitsCountedOn ? `, counted ${commitsCountedOn}` : ""}`}
            >
              <div className="panel">
                <div className="panel-face">
                  <div className="panel-bar">
                    <b>Commits per week</b>
                    <ShiftKind kind="recorded" />
                  </div>
                  <BarStrip
                    caption={`Commits per ISO week, all authors${
                      typeof cover?.commitsInWindowRepos === "number"
                        ? `, all ${cover.commitsInWindowRepos} org repositories`
                        : ""
                    }, UTC days`}
                    summary={`${costNum(commitTotal)} commits over ${weeks} weeks${
                      busiest && quietest
                        ? `. The busiest week, ${busiest.week}, had ${costNum(busiest.commits)}; the quietest, ${quietest.week}, had ${costNum(quietest.commits)}`
                        : ""
                    }.`}
                    data={ts.map((t) => ({
                      label: `${t.week}, week of ${t.weekStart}`,
                      value: t.commits,
                    }))}
                    unit="commits"
                    ticks={weekTicks}
                    height={150}
                  />
                  <p className="beta-chart__note">
                    {costNum(commitTotal)} commits in {weeks} weeks
                    {typeof cover?.commitDaysInWindow === "number"
                      ? `, on ${cover.commitDaysInWindow} of the window’s ${d.timespan.days} days`
                      : ""}
                    . The count includes every author: other contributors, and the upstream history
                    of forked repositories.
                    {lastWeekDays !== null && lastWeekDays < 7
                      ? ` The last bar is a ${lastWeekDays}-day week: the window closes mid-week.`
                      : ""}
                  </p>
                </div>
              </div>
            </ShiftFigure>

            <ShiftFigure
              kind="recorded"
              source="cost-model.json"
              note={`, timeSeries issues, cb* repositories, ${windowLabel}, fetched ${recorded}`}
            >
              <div className="panel">
                <div className="panel-face">
                  <div className="panel-bar">
                    <b>Issues per week</b>
                    <ShiftKind kind="recorded" />
                  </div>
                  <BarStrip
                    caption="GitHub issues opened per ISO week, cb* repositories"
                    summary={`${costNum(last.cumulativeIssuesOpened)} issues opened over ${weeks} weeks.`}
                    data={ts.map((t) => ({
                      label: `${t.week}, week of ${t.weekStart}`,
                      value: t.issuesOpened,
                    }))}
                    unit="opened"
                    height={54}
                  />
                  <BarStrip
                    caption="GitHub issues closed per ISO week, cb* repositories"
                    summary={`${costNum(last.cumulativeIssuesClosed)} issues closed over ${weeks} weeks.`}
                    data={ts.map((t) => ({
                      label: `${t.week}, week of ${t.weekStart}`,
                      value: t.issuesClosed,
                    }))}
                    unit="closed"
                    ticks={weekTicks}
                    height={54}
                  />
                  <p className="beta-chart__note">
                    {costNum(last.cumulativeIssuesOpened)} opened and{" "}
                    {costNum(last.cumulativeIssuesClosed)} closed: closing never caught up, and the
                    backlog grew by {costNum(issueGap)}.
                    {closedAhead.length === 1
                      ? ` One week closed more than it opened, ${closedAhead[0].week} (${costNum(closedAhead[0].issuesClosed)} against ${costNum(closedAhead[0].issuesOpened)}).`
                      : ""}{" "}
                    The fetch read at most 500 issues per repository.
                  </p>
                </div>
              </div>
            </ShiftFigure>
          </div>
        </>
      )}

      {/* ================================================================
          THE TWO COLUMNS
          ================================================================ */}
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
              counted {costNum(cover.commitsInWindowAtSnapshot)}. The count taken on{" "}
              {commitsCountedOn}, after the window closed, is {costNum(cover.commitsInWindow)}.
              {typeof recount?.commits === "number" && recount.countedOn
                ? ` A count of the same days on ${recount.countedOn} gives ${costNum(recount.commits)}, because one repository’s history was rewritten in between.`
                : ""}
            </p>
          )}
      </div>

      <div className="beta-shift-two">
        <ShiftFigure
          kind="recorded"
          source="cost-model.json"
          note={`, actual and issues, ${windowLabel}, recorded ${recorded}`}
        >
          <div className="panel">
            <div className="panel-face">
              <div className="panel-bar">
                <b>What happened</b>
                <ShiftKind kind="recorded" />
              </div>
              <table className="readout">
                <tbody>
                  <tr>
                    <td>Team size</td>
                    <td className="num">{d.actual.teamSize}</td>
                  </tr>
                  {typeof cover?.commitsInWindow === "number" && (
                    <tr>
                      <td>Commits in the window, all authors</td>
                      <td className="num">{costNum(cover.commitsInWindow)}</td>
                    </tr>
                  )}
                  <tr>
                    <td>Commits, full history, all authors</td>
                    <td className="num">{costNum(d.actual.commits)}</td>
                  </tr>
                  <tr>
                    <td>cb* repositories active in the window</td>
                    <td className="num">{costNum(d.actual.repos)}</td>
                  </tr>
                  <tr>
                    <td>Issues opened, cb*</td>
                    <td className="num">{costNum(d.issues.opened)}</td>
                  </tr>
                  <tr>
                    <td>Issues closed, cb*</td>
                    <td className="num">{costNum(d.issues.closed)}</td>
                  </tr>
                  <tr>
                    <td>Operator, flat rate</td>
                    <td className="num">{costUsd(d.actual.operatorCost)}</td>
                  </tr>
                  <tr>
                    <td>AI plan, flat rate</td>
                    <td className="num">{costUsd(d.actual.aiCost)}</td>
                  </tr>
                  <tr>
                    <td>
                      <b>Total</b>
                    </td>
                    <td className="num">
                      <b>{costUsd(d.actual.totalCost)}</b>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="beta-chart__note">
                {typeof cover?.commitsInWindowRepos === "number"
                  ? `In the window: all ${cover.commitsInWindowRepos} org repositories${commitsCountedOn ? `, counted ${commitsCountedOn}` : ""}. `
                  : ""}
                Full history: the {d.actual.repos} cb* repositories active in the window, from
                their first commits{fullHistoryThrough ? ` to ${fullHistoryThrough}` : ""}. Both
                commit counts include every author: other contributors, and the upstream history
                of forked repositories.
              </p>
            </div>
          </div>
        </ShiftFigure>

        {typeof d.legacy.teamSize === "number" &&
          typeof rate === "number" &&
          months &&
          typeof legacyLow === "number" &&
          typeof legacyHigh === "number" &&
          legacyMid !== null && (
            <ShiftFigure
              kind="modelled"
              source="cost-model.json"
              note=", legacy: assumptions written into the model, not observations"
            >
              <div className="panel">
                <div className="panel-face">
                  <div className="panel-bar">
                    <b>What it was compared with</b>
                    <ShiftKind kind="modelled" />
                  </div>
                  <table className="readout">
                    <tbody>
                      <tr>
                        <td>Team size, one seat at half time</td>
                        <td className="num">{d.legacy.teamSize}</td>
                      </tr>
                      <tr>
                        <td>Duration, months</td>
                        <td className="num">
                          {months.low} to {months.high}
                        </td>
                      </tr>
                      {d.legacy.personMonths && (
                        <tr>
                          <td>Person-months</td>
                          <td className="num">
                            {d.legacy.personMonths.low} to {d.legacy.personMonths.high}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td>Rate per person-month</td>
                        <td className="num">{costUsd(rate)}</td>
                      </tr>
                      <tr>
                        <td>Cost at {months.low} months</td>
                        <td className="num">{costUsd(legacyLow)}</td>
                      </tr>
                      <tr>
                        <td>Cost at {months.high} months</td>
                        <td className="num">{costUsd(legacyHigh)}</td>
                      </tr>
                      <tr>
                        <td>
                          <b>Midpoint</b>
                        </td>
                        <td className="num">
                          <b>{costUsd(legacyMid)}</b>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="beta-chart__note">Nobody was hired and nothing was invoiced.</p>
                </div>
              </div>
            </ShiftFigure>
          )}
      </div>

      {/* ================================================================
          THE MODELLED TEAM
          ================================================================ */}
      <div className="prose beta-sec">
        <h2>The modelled team</h2>
        <p>
          {legacyHeads} people at {costUsd(legacyTotal)} a year fully loaded. Salary figures are
          market rate; the 1.4x loading covers benefits, tax and overhead.
          {halfTimeRoles > 0
            ? ` That is every seat at full time; the cost model counts ${halfTimeRoles === 1 ? "one of them" : `${halfTimeRoles} of them`} at half time.`
            : ""}
        </p>
      </div>

      <RampKey low="lower cost" high="higher" />

      <ShiftFigure
        kind="modelled"
        labels="long"
        source="cost-model.json"
        note=", legacy.roles: market salary times 1.4, per year, as written into the model"
      >
        <div className="panel">
          <div className="panel-face">
            <div className="panel-bar">
              <b>Loaded cost by role, annual</b>
              <ShiftKind kind="modelled" />
            </div>
            <RowChart caption="Fully loaded annual cost in US dollars, by role" data={roles} />
          </div>
        </div>
      </ShiftFigure>

      {/* ================================================================
          THE GAP
          ================================================================ */}
      <div className="prose beta-sec">
        <h2>The gap</h2>
        <p>
          {d.comparison.costSavingsPercent}% below the modelled cost of the whole job
          {legacyMid !== null && typeof legacyLow === "number" && typeof legacyHigh === "number"
            ? `: ${costUsd(d.actual.totalCost)} recorded over the window against ${costUsd(legacyMid)}, the midpoint of a modelled ${costUsd(legacyLow)} to ${costUsd(legacyHigh)}${legacyBasis}`
            : ""}
          . That assumes the work of the window was the whole job.
          {last && windowGapPct !== null
            ? ` When the window closed the modelled line stood at ${costUsd(last.cumulativeCostLegacy)}; against that, the gap is ${windowGapPct.toFixed(1)}%.`
            : ""}{" "}
          Either figure inherits the model&rsquo;s assumptions entirely.
        </p>
        <p>
          The pipeline also computed a time compression of &ldquo;
          {d.comparison.timeCompression.replace("->", "to")}&rdquo; and a velocity multiplier of{" "}
          {d.comparison.velocityMultiplier.toLocaleString("en-US")}x. Neither is a headline here.
          Both divide by {d.timespan.activeDays} active days, the days with a recorded AI session
          {cover?.claudeRecordStart ? `, in a record that only begins ${cover.claudeRecordStart}` : ""}
          {typeof cover?.commitDaysInWindow === "number"
            ? `, while commits by all authors landed on ${cover.commitDaysInWindow} of the window’s ${d.timespan.days} days`
            : ""}
          . A ratio built on {d.timespan.activeDays} overstates.
        </p>

        <h2>What the work covered</h2>
        <p>
          {/* The explicit space is load-bearing: a JSX text run that starts with a space
              and holds an entity loses the space in this toolchain. */}
          The model prices {d.legacy.roles.length}{" "}
          job titles. This is the same ground scored from the other side: how much of each
          domain&rsquo;s vocabulary turns up in project notes, plan files and the technologies
          named in session logs. It shows breadth of work touched, not depth of expertise.
        </p>
      </div>

      <ShiftFigure
        kind="recorded"
        labels="mid"
        source="cost-model.json"
        note={`, actual.domains, keyword coverage over recent session logs, as recorded ${recorded}`}
      >
        <div className="panel">
          <div className="panel-face">
            <div className="panel-bar">
              <b>Domain coverage, 0 to 100</b>
              <ShiftKind kind="recorded" />
            </div>
            <ShiftRows
              caption={`Keyword coverage by domain, recent session logs as recorded ${recorded}`}
              data={domains}
              max={100}
              axis={["0", "50", "100"]}
            />
          </div>
        </div>
      </ShiftFigure>

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

      <div className="prose beta-sec">
        <h2>What this is evidence for</h2>
        <p>
          The numbers are here. The argument they belong to is on{" "}
          <Link href="/the-shift">the shift</Link>: what changed about teams, cadence, coordination
          and context when the tooling changed, and what one case study can and cannot show about
          it.
        </p>
      </div>

      <div className="beta-shift-endchip">
        {frozen ? (
          <BetaMeasured source="cost-model.json">
            <span>
              <b>cost-model.json</b>, frozen case study of {winStart} to {winEnd}, recorded{" "}
              {recorded}
            </span>
          </BetaMeasured>
        ) : (
          <BetaMeasured generated={d.generated} source="cost-model.json" />
        )}
      </div>
    </div>
  )
}
