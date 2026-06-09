import { readFileSync } from "fs"
import { join } from "path"
import { DollarSign } from "lucide-react"
import { timeAgo } from "@/lib/time-ago"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { V3CostDashboard, type CostModel } from "./V3CostDashboard"

export const revalidate = 3600

function loadCost(): CostModel | null {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "public/data/cost-model.json"), "utf-8")
    )
  } catch {
    return null
  }
}

export default function V3CostAnalysisPage() {
  const data = loadCost()

  if (!data) {
    return (
      <section className="v3-section">
        <div className="v3-wrap">
          <div className="v3-empty">Cost model unavailable. Try again shortly.</div>
        </div>
      </section>
    )
  }

  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head" style={{ paddingBottom: 28 }}>
        <div className="v3-blob v3-blob--2" aria-hidden style={{ right: "-60px", top: "-20px" }} />
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "240px", top: "200px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <span
                className="v3-pill v3-pill--green"
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <DollarSign size={14} strokeWidth={2.25} />
                {data.scope}
              </span>
            </V3Reveal>
            <V3Reveal delay={80}>
              <h1>
                What does it actually cost to build with <span className="v3-accent">AI?</span>
              </h1>
            </V3Reveal>
            <V3Reveal delay={140}>
              <p className="v3-page-head__lede">
                Real numbers from {data.timespan.days} days of Campaign Brain development.
                One operator. Claude as co-pilot. Bottom-up bill of materials, not a vendor
                pitch deck.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* DASHBOARD ====================================================== */}
      <section className="v3-section" style={{ paddingTop: 0 }}>
        <div className="v3-wrap">
          <V3CostDashboard data={data} />
        </div>
      </section>

      {/* UPDATED ======================================================== */}
      <section style={{ textAlign: "center", padding: "32px 0 20px" }}>
        <span
          style={{
            fontFamily: "var(--font-v3-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.08em",
            color: "var(--v3-slate)",
          }}
        >
          updated {timeAgo(data.generated)}
        </span>
      </section>
    </>
  )
}
