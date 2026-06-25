import Link from "next/link"
import { Map as MapIcon, ArrowLeft } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { V3Airspace } from "./V3Airspace"

export default function V3AirspacePage() {
  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head" style={{ paddingBottom: 20 }}>
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "-80px", top: "-40px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <Link href="/dragonfli" className="v3-air-back">
                <ArrowLeft size={14} strokeWidth={2.4} /> back to the Dragonfli dashboard
              </Link>
            </V3Reveal>
            <V3Reveal>
              <span
                className="v3-pill v3-pill--blue"
                style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}
              >
                <MapIcon size={14} strokeWidth={2.25} />
                airspace · live map
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                The sky over Grand Rapids, <span className="v3-accent">mapped.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                Live ADS-B aircraft on a self-hosted vector basemap — track-oriented and
                altitude-colored. Toggle the 15-minute density forecast, per-aircraft
                trajectory ribbons, and a signal-strength bloom that traces the receiver&apos;s
                reach. Click any aircraft for its registry card.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* MAP =========================================================== */}
      <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 16 }}>
        <div className="v3-wrap">
          <article className="v3-panel v3-air-panel">
            <V3Airspace />
          </article>
        </div>
      </section>
    </>
  )
}
