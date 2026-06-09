import { Atom } from "lucide-react"
import { V3Reveal } from "../_components/V3Reveal"
import { V3TrngDashboard } from "./V3TrngDashboard"

export default function V3TrngPage() {
  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head" style={{ paddingBottom: 28 }}>
        <div className="v3-blob v3-blob--3" aria-hidden style={{ right: "-60px", top: "0px" }} />
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "220px", top: "200px" }} />

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
                <Atom size={14} strokeWidth={2.25} />
                hotbits · radioactive entropy
              </span>
            </V3Reveal>
            <V3Reveal delay={80}>
              <h1>
                Random, from radioactive <span className="v3-accent">decay.</span>
              </h1>
            </V3Reveal>
            <V3Reveal delay={140}>
              <p className="v3-page-head__lede">
                A CAJOE Geiger counter, a Raspberry Pi, and a Δt₁/Δt₂ comparison turn cosmic
                noise into NIST-tested bits. Polls fast for the pool, slower for the labs.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* DASHBOARD ====================================================== */}
      <section className="v3-section" style={{ paddingTop: 16 }}>
        <div className="v3-wrap">
          <V3TrngDashboard />
        </div>
      </section>
    </>
  )
}
