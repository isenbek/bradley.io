import { Radio } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { V3SdrDashboard } from "./V3SdrDashboard"

export default function V3SdrPage() {
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
                <Radio size={14} strokeWidth={2.25} />
                sdr-api · spectrum, live
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                The spectrum, <span className="v3-accent">indexed.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                Live status for the rtl-sdr scanner stack — band registry, soak archive,
                top frequencies, and the job history that fed them. Polls every 30 seconds.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* DASHBOARD ====================================================== */}
      <section className="v3-section" style={{ paddingTop: 16 }}>
        <div className="v3-wrap">
          <V3SdrDashboard />
        </div>
      </section>
    </>
  )
}
