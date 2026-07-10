import Link from "next/link"
import { Boxes, ArrowLeft } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { V3EntropySpace } from "./V3EntropySpace"

export default function V3EntropySpacePage() {
  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head" style={{ paddingBottom: 24 }}>
        <div className="v3-blob v3-blob--3" aria-hidden style={{ right: "-60px", top: "0px" }} />
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "220px", top: "200px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <Link href="/trng" className="v3-espace-back">
                <ArrowLeft size={14} strokeWidth={2.4} /> back to the TRNG dashboard
              </Link>
            </V3Reveal>
            <V3Reveal>
              <span
                className="v3-pill v3-pill--green"
                style={{ padding: "8px 16px", fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}
              >
                <Boxes size={14} strokeWidth={2.25} />
                entropy space · live 3D
              </span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                What does randomness <span className="v3-accent">look like?</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                Live bytes from a radioactive-decay source, rendered as point
                clouds you can rotate. True entropy fills space as a structureless
                mist, and a deterministic PRNG, plotted the same way, can&apos;t
                hide its hidden planes. Drag any plot to explore.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      <V3EntropySpace />
    </>
  )
}
