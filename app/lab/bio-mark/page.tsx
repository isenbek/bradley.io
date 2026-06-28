import Link from "next/link"
import { ArrowLeft, Atom } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { BioMarkFrame } from "@/components/v3/BioMarkFrame"

// The bio·mark vector x-ray is a fully self-contained interactive HTML doc
// (embedded geometry, vanilla JS + inline SVG) served from public/bio-mark.html.
// We frame it with a real bradley.io header + intro, then embed the tool below.
export default function BioMarkPage() {
  return (
    <>
      {/* HEADER ======================================================== */}
      <header className="v3-page-head" style={{ paddingBottom: 18 }}>
        <div className="v3-blob v3-blob--3" aria-hidden style={{ right: "-70px", top: "-30px", width: 340, height: 340 }} />
        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <Link href="/lab" className="v3-air-back">
                <ArrowLeft size={14} strokeWidth={2.4} /> back to the Lab
              </Link>
            </V3Reveal>
            <V3Reveal>
              <span
                className="v3-pill v3-pill--blue"
                style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}
              >
                <Atom size={14} strokeWidth={2.25} />
                design · vector x-ray
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                The <span className="v3-accent">bio</span> mark, decomposed.
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                The bradley.io wordmark as pure geometry: the b/i/o ligature drawn as chords, Bézier
                offset handles, and anchors — with the i-tittle plumb that aligns the dot over the
                centre crest, implying the b→o connection (the hidden ∞). Drag the dot to test the
                tolerance, morph chords↔curves, and watch every measurement update live.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* THE TOOL — self-sizing iframe (grows to its content; no nested scroll) */}
      <section className="v3-embed-stage">
        <BioMarkFrame />
      </section>
    </>
  )
}
