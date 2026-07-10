import { Activity } from "lucide-react"
import { V3PilotAnalytics } from "./V3PilotAnalytics"

export default function PilotAnalyticsPage() {
  return (
    <>
      <header className="v3-page-head" style={{ paddingBottom: 24 }}>
        <div className="v3-blob v3-blob--2" aria-hidden style={{ right: "-60px", top: "-20px" }} />
        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <span
              className="v3-pill v3-pill--coral"
              style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}
            >
              <Activity size={14} strokeWidth={2.25} />
              claude activity · internal
            </span>
            <h1>
              The work, <span className="v3-accent">counted.</span>
            </h1>
            <p className="v3-page-head__lede">
              Every Claude Code session across the fleet, flattened for analysis: turns, token
              flow, tool usage, projects, and cadence. Built from the local + DC-1 session logs.
            </p>
          </div>
        </div>
      </header>

      <section className="v3-section" style={{ paddingTop: 8 }}>
        <div className="v3-wrap">
          <V3PilotAnalytics />
        </div>
      </section>
    </>
  )
}
