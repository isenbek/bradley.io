import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, EyeOff } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { VisitorsBoard } from "@/components/visitors/VisitorsBoard"

// Unlisted while the tiers get built out: no index, no nav link, not in the
// sitemap. Reachable by URL only.
export const metadata: Metadata = {
  title: "Who knocked · bradley.io",
  description:
    "Every request that reached this host, in three tiers: dropped at the edge, trapped at the door, and served.",
  robots: { index: false, follow: false },
}

export default function VisitorsPage() {
  return (
    <div className="v3-longform v3-vis">
      <header className="v3-page-head" style={{ paddingBottom: 10 }}>
        <div className="v3-blob v3-blob--2" aria-hidden style={{ left: "-70px", top: "-40px", width: 330, height: 330 }} />
        <div className="v3-wrap">
          <Link href="/lab" className="v3-detail-back">
            <ArrowLeft size={14} strokeWidth={2.4} /> Lab
          </Link>

          <V3Reveal eager>
            <span className="v3-pill v3-pill--coral" style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}>
              <EyeOff size={14} strokeWidth={2.4} /> unlisted · work in progress
            </span>
          </V3Reveal>

          <V3Reveal eager>
            <h1>Who <span className="v3-accent">knocked.</span></h1>
          </V3Reveal>

          <V3Reveal eager>
            <p className="v3-page-head__lede">
              Almost everything that arrives at this host is automated. This page fuses the three
              places that see it: the OpenWrt router at the edge, which drops known-hostile
              addresses before they reach the server at all; the scanner trap in nginx, which kills
              probes for software I do not run; and the access log, which is what is left over.
              The leftovers are the people.
            </p>
          </V3Reveal>

          <V3Reveal delay={70}>
            <p className="v3-vis-privacy">
              Visitors are coarsened on purpose: a /24 network, a city, and a network operator. No
              visitor IP address is stored in the snapshot or served by the API. Unsolicited
              automated traffic gets no such courtesy and is shown in full.
            </p>
          </V3Reveal>
        </div>
      </header>

      <section className="v3-section" style={{ paddingTop: 18 }}>
        <div className="v3-wrap">
          <VisitorsBoard />
        </div>
      </section>
    </div>
  )
}
