import Link from "next/link"
import { Radio, ArrowLeft } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { WorldEventBus } from "@/components/dragonfli/worldevent/WorldEventBus"

export default function WorldEventPage() {
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
                <Radio size={14} strokeWidth={2.25} />
                worldevent · live
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                Every sense, <span className="v3-accent">one firehose.</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                Not a feed — a <strong>nervous system</strong>. Every sensor in the garage
                broadcasts a schema-tagged <code>worldevent/1</code> envelope onto one UDP wire,
                and this is the live, type-agnostic view of it: which event types are firing,
                from which hosts, how fast, and a rolling tail of everything happening in the
                world right now. Plug in a new sense and it just appears here.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* BOARD ========================================================= */}
      <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 16 }}>
        <div className="v3-wrap">
          <WorldEventBus />
        </div>
      </section>
    </>
  )
}
