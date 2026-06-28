import Link from "next/link"
import { ArrowLeft, Brain } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { MemoryTimeline } from "@/components/meatball/MemoryTimeline"

export default function MeatballMemoryPage() {
  return (
    <div className="v3-longform">
      <header className="v3-page-head" style={{ paddingBottom: 16 }}>
        <div className="v3-blob v3-blob--3" aria-hidden style={{ right: "-60px", top: "-30px", width: 320, height: 320 }} />
        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <Link href="/meatball" className="v3-air-back">
                <ArrowLeft size={14} strokeWidth={2.4} /> back to Meatball
              </Link>
            </V3Reveal>
            <V3Reveal>
              <span className="v3-pill v3-pill--gold" style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}>
                <Brain size={14} strokeWidth={2.25} />
                multimodal memory
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                Moments, <span className="v3-accent">lined up.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                Meatball&apos;s two timelines — what it saw move and what it heard said — folded onto
                one. Every event keeps the scene <em>before</em> and <em>after</em> it, plus anything
                from the other sense that happened nearby. This is the substrate for relating image
                patches to speech over time. Newest first, updating live.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 28 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <MemoryTimeline />
          </V3Reveal>
        </div>
      </section>
    </div>
  )
}
