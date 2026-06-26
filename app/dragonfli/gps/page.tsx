import Link from "next/link"
import { Satellite, ArrowLeft } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { V3Gps } from "./V3Gps"

export default function GpsPage() {
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
                <Satellite size={14} strokeWidth={2.25} />
                gps · live
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                The sky, <span className="v3-accent">from the ground up.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                Live GNSS off the same receiver that feeds the airspace map — a skyplot of every
                satellite in view by signal strength, the SNR spectrum, the fix-precision cloud,
                and the ground track on a self-hosted vector basemap. Fed by the Dragonfli{" "}
                <code>/stream</code> firehose.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* BOARD ========================================================= */}
      <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 16 }}>
        <div className="v3-wrap">
          <V3Gps />
        </div>
      </section>
    </>
  )
}
