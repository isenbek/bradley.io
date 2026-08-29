import Link from "next/link"
import type { Metadata } from "next"
import { loadPilotData, tokens } from "../_pilot-data"
import { RowChart, RampKey } from "../_charts"
import { BetaMeasured } from "../_measured"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "AI pilot licence",
  description:
    "The AI pilot record: sessions, models flown, competency ratings and token economy, computed from the session logs rather than claimed.",
}

export default function BetaAiPilotPage() {
  const d = loadPilotData()
  const { license: L } = d

  // Models are keyed by id, but several ids share a display name, so labelling
  // by displayName alone silently merges rows that are different models.
  const models = d.typeRatings
    .filter((m) => m.costShare > 0)
    .map((m) => ({
      label: m.modelId.replace(/^claude-/, ""),
      value: m.costShare,
      display: `${m.costShare.toFixed(1)}%`,
    }))

  const instruments = Object.entries(d.instrumentRatings)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([name, r]) => ({ label: name, value: r.score, display: `${r.score}` }))

  const competency = [...d.competencyRadar]
    .sort((a, b) => b.score - a.score)
    .map((c) => ({ label: c.axis, value: c.score, display: `${c.score}` }))

  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">AI pilot</span>
          </span>
        </nav>
        <h1>AI pilot licence</h1>
      </div>

      <p className="lede">
        Every figure here is computed from the session logs. None of it is self-assessed.
      </p>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>{L.number}</b>
            <span>
              class {L.class} · issued {L.issued}
            </span>
          </div>
          <table className="readout">
            <tbody>
              <tr>
                <td>Sessions</td>
                <td className="num">{L.totalSessions.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Messages</td>
                <td className="num">{L.totalMessages.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Projects</td>
                <td className="num">{L.projectCount.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Models flown</td>
                <td className="num">{L.modelCount.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Active days</td>
                <td className="num">{d.streaks.totalActiveDays.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Longest streak</td>
                <td className="num">{d.streaks.longest.toLocaleString()} d</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <BetaMeasured generated={d.generated} source="ai-pilot-data.json" />

      <div className="prose beta-sec">
        <h2>Ratings</h2>
        <p>
          Instrument ratings are keyword coverage over the session transcripts, so they measure
          what the work touched rather than how well it went. Competency scores come from the same
          logs and are capped at 100.
        </p>
      </div>

      <RampKey low="lower" high="higher" />

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Ratings</b>
            <span>0 to 100</span>
          </div>
          <RowChart caption="By instrument" data={instruments} />
          <RowChart caption="By competency" data={competency} />
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>Fleet</h2>
        <p>
          Share of output tokens by model. {d.pilotingStyle.label} piloting style:{" "}
          {d.pilotingStyle.collaborative}% collaborative, {d.pilotingStyle.planFirst}% plan first.
        </p>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Type ratings</b>
            <span>share of cost</span>
          </div>
          <RowChart caption="By model" data={models} />
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>Token economy</h2>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Tokens</b>
            <span>cumulative</span>
          </div>
          <table className="readout">
            <tbody>
              <tr>
                <td>Input</td>
                <td className="num" title={L.totalInputTokens.toLocaleString()}>
                  {tokens(L.totalInputTokens)}
                </td>
              </tr>
              <tr>
                <td>Output</td>
                <td className="num" title={L.totalOutputTokens.toLocaleString()}>
                  {tokens(L.totalOutputTokens)}
                </td>
              </tr>
              <tr>
                <td>Cache read</td>
                <td className="num" title={d.tokenEconomy.totalCacheReadTokens.toLocaleString()}>
                  {tokens(d.tokenEconomy.totalCacheReadTokens)}
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

      <p className="quiet">
        Token counts are abbreviated. Hover any of them for the exact figure.{" "}
        <Link href="/pilot-analytics">Pilot analytics</Link> cuts the same record by project,
        by hour and by day.
      </p>
    </div>
  )
}
