import Link from "next/link"
import { ArrowLeft, ScrollText } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { EventLog } from "@/components/meatball/EventLog"

export default function MeatballLogPage() {
  return (
    <div className="v3-longform">
      <header className="v3-page-head" style={{ paddingBottom: 16 }}>
        <div className="v3-blob v3-blob--2" aria-hidden style={{ right: "-60px", top: "-30px", width: 320, height: 320 }} />
        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <Link href="/meatball" className="v3-air-back">
                <ArrowLeft size={14} strokeWidth={2.4} /> back to Meatball
              </Link>
            </V3Reveal>
            <V3Reveal>
              <span className="v3-pill v3-pill--gold" style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}>
                <ScrollText size={14} strokeWidth={2.25} />
                the logbook
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                What Meatball <span className="v3-accent">noticed.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                A running log of every motion the cameras caught and the vision model named: the
                cropped region, what it was, which camera, and when. Newest first, updating live.
                Built as it happens.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 28 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <EventLog />
          </V3Reveal>
        </div>
      </section>
    </div>
  )
}
