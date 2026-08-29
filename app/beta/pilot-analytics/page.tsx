import Link from "next/link"
import type { Metadata } from "next"
import { loadPilotData, tokens } from "../_pilot-data"
import { RowChart, HeatGrid, RampKey } from "../_charts"
import { BetaMeasured } from "../_measured"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Pilot analytics",
  description:
    "The AI session record cut by project, by hour of day and by day: where the time went and what it produced.",
}

export default function BetaPilotAnalyticsPage() {
  const d = loadPilotData()

  const byProject = [...d.missionLog]
    .sort((a, b) => b.messages - a.messages)
    .slice(0, 12)
    .map((m) => ({ label: m.name, value: m.messages, display: m.messages.toLocaleString() }))

  const byHour = d.hourlyDistribution.hours.map((h) => ({
    label: h.label,
    value: h.count,
  }))

  const days = d.activityHeatmap.map((a) => ({ label: a.date, value: a.count }))

  const skills = d.skillsCloud
    .slice(0, 12)
    .map((s) => ({ label: s.name, value: s.count, display: s.count.toLocaleString() }))

  const peak = d.hourlyDistribution.hours.find((h) => h.hour === d.hourlyDistribution.peakHour)

  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/beta">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Pilot analytics</span>
          </span>
        </nav>
        <h1>Pilot analytics</h1>
      </div>

      <p className="lede">
        The same session record as the <Link href="/beta/ai-pilot">licence</Link>, cut by project,
        by hour and by day.
      </p>

      <RampKey low="fewer" high="more" />

      <div className="prose beta-sec">
        <h2>By project</h2>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Messages per project</b>
            <span>
              top {byProject.length} of {d.missionLog.length}
            </span>
          </div>
          <RowChart caption="Messages exchanged" data={byProject} />
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>By hour</h2>
        <p>
          Sessions started, by hour of day. Peak is {peak?.label ?? "unknown"} with{" "}
          {d.hourlyDistribution.peakCount.toLocaleString()}.
        </p>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Hour of day</b>
            <span>local time</span>
          </div>
          <HeatGrid caption="Sessions per hour, 00:00 to 23:00" data={byHour} />
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>By day</h2>
        <p>
          {d.streaks.totalActiveDays} active days. The busiest was {d.streaks.peakDay} at{" "}
          {d.streaks.peakDayCount.toLocaleString()} messages.
        </p>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Daily volume</b>
            <span>{days.length} days recorded</span>
          </div>
          <HeatGrid caption="Messages per active day" data={days} />
          <p className="beta-chart__note">
            One cell per day the logs recorded activity, in order. Days with no activity are not
            shown, so the spacing is not a calendar and gaps between runs do not appear.
          </p>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>What came up</h2>
        <p>
          Technologies by how often they appear in the transcripts. This counts mentions, not
          proficiency.
        </p>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Skills cloud</b>
            <span>
              top {skills.length} of {d.skillsCloud.length}
            </span>
          </div>
          <RowChart caption="Mentions in session transcripts" data={skills} />
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>Totals</h2>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Token economy</b>
            <span>pipeline {d.pipelineVersion}</span>
          </div>
          <table className="readout">
            <tbody>
              <tr>
                <td>Input</td>
                <td className="num" title={d.tokenEconomy.totalInputTokens.toLocaleString()}>
                  {tokens(d.tokenEconomy.totalInputTokens)}
                </td>
              </tr>
              <tr>
                <td>Output</td>
                <td className="num" title={d.tokenEconomy.totalOutputTokens.toLocaleString()}>
                  {tokens(d.tokenEconomy.totalOutputTokens)}
                </td>
              </tr>
              <tr>
                <td>Cache read</td>
                <td className="num" title={d.tokenEconomy.totalCacheReadTokens.toLocaleString()}>
                  {tokens(d.tokenEconomy.totalCacheReadTokens)}
                </td>
              </tr>
              <tr>
                <td>Cache created</td>
                <td className="num" title={d.tokenEconomy.totalCacheCreateTokens.toLocaleString()}>
                  {tokens(d.tokenEconomy.totalCacheCreateTokens)}
                </td>
              </tr>
              <tr>
                <td>Cache efficiency</td>
                <td className="num">{d.tokenEconomy.cacheEfficiency.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <BetaMeasured generated={d.generated} source="ai-pilot-data.json" />
    </div>
  )
}
