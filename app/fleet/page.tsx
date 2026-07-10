import { HeartPulse } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { V3FleetDashboard } from "./V3FleetDashboard"

export default function V3FleetPage() {
  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head" style={{ paddingBottom: 28 }}>
        <div className="v3-blob v3-blob--2" aria-hidden style={{ right: "-60px", top: "-20px" }} />
        <div className="v3-blob v3-blob--3" aria-hidden style={{ right: "200px", top: "200px" }} />

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
                <HeartPulse size={14} strokeWidth={2.25} />
                worldsink · fleet health, live
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                The fleet, <span className="v3-accent">watched.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                Live health for the collector fleet behind the WorldEvent bus: per-node
                vitals, an attention layer that flags trouble, and a self-healing medic
                that remediates and logs what it did. Polls every 10 seconds.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* DASHBOARD ====================================================== */}
      <section className="v3-section" style={{ paddingTop: 16 }}>
        <div className="v3-wrap">
          <V3FleetDashboard />
        </div>
      </section>
    </>
  )
}
