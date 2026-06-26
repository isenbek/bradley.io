import Link from "next/link"
import { Camera, ArrowLeft } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { CamLive } from "@/components/cam/CamLive"

export default function CamPage() {
  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head" style={{ paddingBottom: 20 }}>
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "-80px", top: "-40px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <Link href="/" className="v3-air-back">
                <ArrowLeft size={14} strokeWidth={2.4} /> back home
              </Link>
            </V3Reveal>
            <V3Reveal>
              <span
                className="v3-pill v3-pill--blue"
                style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}
              >
                <Camera size={14} strokeWidth={2.25} />
                live · camera
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                A frame, <span className="v3-accent">once a minute.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                A live still from the camera attached to the bradley.io box — grabbed with{" "}
                <code>ffmpeg</code> straight off <code>/dev/video0</code> once a minute, cached on
                the metal, and served same-origin. No stream, no cloud, no third party in the
                middle. Just the most recent frame.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* FRAME ========================================================= */}
      <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 16 }}>
        <div className="v3-wrap">
          <article className="v3-panel v3-cam-panel">
            <CamLive />
          </article>
        </div>
      </section>
    </>
  )
}
