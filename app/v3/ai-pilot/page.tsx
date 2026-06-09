import { readFileSync } from "fs"
import { join } from "path"
import { Plane } from "lucide-react"
import type { AIPilotData } from "@/components/ai-pilot/types"
import { V3Reveal } from "../_components/V3Reveal"
import { V3PilotDashboard } from "./V3PilotDashboard"

export const revalidate = 3600

function loadPilot(): AIPilotData | null {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "public/data/ai-pilot-data.json"), "utf-8")
    )
  } catch {
    return null
  }
}

export default function V3AIPilotPage() {
  const data = loadPilot()

  if (!data) {
    return (
      <section className="v3-section">
        <div className="v3-wrap">
          <div className="v3-empty">
            Flight data unavailable. Run{" "}
            <code
              style={{
                fontFamily: "var(--font-v3-mono), monospace",
                background: "var(--v3-paper)",
                padding: "2px 8px",
                borderRadius: 6,
                border: "1px solid var(--v3-line)",
              }}
            >
              python scripts/ai-pilot-pipeline.py
            </code>{" "}
            to generate it.
          </div>
        </div>
      </section>
    )
  }

  const generatedFmt = new Date(data.generated).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  })

  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head" style={{ paddingBottom: 32 }}>
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "-100px", top: "-40px" }} />
        <div className="v3-blob v3-blob--2" aria-hidden style={{ right: "240px", top: "200px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <span
                className="v3-pill v3-pill--blue"
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <Plane size={14} strokeWidth={2.25} />
                AI Pilot License · live flight log
              </span>
            </V3Reveal>
            <V3Reveal delay={80}>
              <h1>
                Every flight, on the <span className="v3-accent">record.</span>
              </h1>
            </V3Reveal>
            <V3Reveal delay={140}>
              <p className="v3-page-head__lede">
                Public dashboard for work shipped with Claude as co-pilot — sessions,
                missions, models flown, and the token economy that pays for the runway.
              </p>
            </V3Reveal>
            <V3Reveal delay={200}>
              <p
                style={{
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  color: "var(--v3-slate)",
                  marginTop: 18,
                }}
              >
                generated {generatedFmt} · pipeline v{data.pipelineVersion}
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* DASHBOARD ====================================================== */}
      <section className="v3-section" style={{ paddingTop: 16 }}>
        <div className="v3-wrap">
          <V3PilotDashboard data={data} />
        </div>
      </section>
    </>
  )
}
