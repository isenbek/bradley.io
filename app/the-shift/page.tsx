import { readFileSync } from "fs"
import { join } from "path"
import { Zap } from "lucide-react"
import type { AIPilotData } from "@/components/ai-pilot/types"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { V3ShiftPage } from "./V3ShiftPage"
import type { CostModel } from "../cost-analysis/V3CostDashboard"

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

function loadCost(): CostModel | null {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "public/data/cost-model.json"), "utf-8")
    )
  } catch {
    return null
  }
}

export default function V3TheShiftPage() {
  const pilot = loadPilot()
  const cost = loadCost()

  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head" style={{ paddingBottom: 28 }}>
        <div className="v3-blob v3-blob--2" aria-hidden style={{ right: "-60px", top: "-20px" }} />
        <div className="v3-blob v3-blob--3" aria-hidden style={{ right: "240px", top: "200px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <span
                className="v3-pill v3-pill--coral"
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <Zap size={14} strokeWidth={2.25} />
                Thesis · the shift
              </span>
            </V3Reveal>
            <V3Reveal delay={80}>
              <h1>
                How AI rewrites the economics of <span className="v3-accent">building software.</span>
              </h1>
            </V3Reveal>
            <V3Reveal delay={140}>
              <p className="v3-page-head__lede">
                Five sections of evidence, not vibes. Teams collapsing into soloists.
                Sprints stretching into streams. Meetings replaced by messages. The cache
                effect. Compound velocity.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* THESIS ========================================================= */}
      <section className="v3-section" style={{ paddingTop: 8 }}>
        <div className="v3-wrap">
          <V3ShiftPage pilot={pilot} cost={cost} />
        </div>
      </section>
    </>
  )
}
