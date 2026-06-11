import { readFileSync } from "fs"
import { join } from "path"
import Link from "next/link"
import { ArrowRight, BarChart3, Plane, Zap } from "lucide-react"
import type { AIPilotData } from "@/components/ai-pilot/types"
import { V3Reveal } from "@/components/v3/V3Reveal"
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
            <V3Reveal eager>
              <h1>
                Every flight, on the <span className="v3-accent">record.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
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

      {/* RELATED READING ================================================ */}
      <section className="v3-section v3-section--paper" style={{ paddingTop: 56 }}>
        <div className="v3-wrap">
          <div className="v3-sec-head" style={{ marginBottom: 24 }}>
            <div className="v3-sec-head__num">RELATED · KEEP READING</div>
            <h2 style={{ marginBottom: 8 }}>This page is the receipts.</h2>
            <p>
              Two longer reads built on the same data — the argument, and the bottom-up
              cost model.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                Icon: Zap,
                tag: "Thesis",
                tagColor: "coral" as const,
                title: "The Shift",
                blurb:
                  "How AI rewrites the economics of building software. Five sections of evidence.",
                href: "/the-shift",
              },
              {
                Icon: BarChart3,
                tag: "Receipts",
                tagColor: "green" as const,
                title: "Cost Analysis",
                blurb:
                  "What 117 days of solo + Claude actually cost vs the 9.5-person team it replaced.",
                href: "/cost-analysis",
              },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="v3-panel"
                style={{
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "var(--v3-r-sm)",
                      background: "var(--v3-blue-50)",
                      color: "var(--v3-blue-600)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <card.Icon size={20} strokeWidth={2.25} />
                  </div>
                  <span className={`v3-pill v3-pill--${card.tagColor}`}>{card.tag}</span>
                </div>
                <h3
                  className="v3-font-display"
                  style={{ fontWeight: 700, fontSize: 22, marginBottom: 6 }}
                >
                  {card.title}
                </h3>
                <p style={{ fontSize: 14.5, color: "var(--v3-ink)", marginBottom: 12 }}>
                  {card.blurb}
                </p>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "var(--font-v3-mono), monospace",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--v3-blue-700)",
                  }}
                >
                  Read <ArrowRight size={13} strokeWidth={2.25} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
