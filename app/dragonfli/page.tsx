import { Plane } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { V3DragonfliDashboard } from "./V3DragonfliDashboard"

export default function V3DragonfliPage() {
  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head" style={{ paddingBottom: 28 }}>
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "-80px", top: "-40px" }} />
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
                dragonfli · 1090 MHz live
              </span>
            </V3Reveal>
            <V3Reveal delay={80}>
              <h1>
                Watch the sky, <span className="v3-accent">locally.</span>
              </h1>
            </V3Reveal>
            <V3Reveal delay={140}>
              <p className="v3-page-head__lede">
                A Raspberry Pi, a 1090 MHz ADS-B receiver, and an FAA registry lookup
                running in the garage. Polar radar, live tracks, and a trajectory predictor
                — refreshed every 5 seconds.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* DASHBOARD ====================================================== */}
      <section className="v3-section" style={{ paddingTop: 16 }}>
        <div className="v3-wrap">
          <V3DragonfliDashboard />
        </div>
      </section>
    </>
  )
}
