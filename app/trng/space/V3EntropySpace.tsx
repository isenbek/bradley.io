"use client"

import dynamic from "next/dynamic"
import { useSharedEntropy } from "@/components/trng/space/use-entropy"

// One modest pull of true decay entropy feeds the cube, return map, and raster.
// The radioactive pool refills slowly, so the whole page shares this buffer
// rather than each widget draining the source independently.
const SHARED_BYTES = 6144

function Loading({ label }: { label: string }) {
  return (
    <div className="v3-espace-loading">
      <span className="v3-espace-loading__dot" aria-hidden />
      initializing {label}…
    </div>
  )
}

// Each WebGL/canvas viz is client-only and route-scoped — three.js never
// touches the server bundle or any other page.
const EntropyCube = dynamic(() => import("@/components/trng/space/EntropyCube"), {
  ssr: false,
  loading: () => <Loading label="the 3D field" />,
})
const ReturnMap = dynamic(() => import("@/components/trng/space/ReturnMap"), {
  ssr: false,
  loading: () => <Loading label="the return map" />,
})
const BitRaster = dynamic(() => import("@/components/trng/space/BitRaster"), {
  ssr: false,
  loading: () => <Loading label="the bit raster" />,
})
const MetricsPhaseSpace = dynamic(
  () => import("@/components/trng/space/MetricsPhaseSpace"),
  { ssr: false, loading: () => <Loading label="phase space" /> }
)

function SectionHead({ n, kicker, title }: { n: string; kicker: string; title: string }) {
  return (
    <header className="v3-espace-head">
      <span className="v3-espace-head__num">{n}</span>
      <div>
        <span className="v3-espace-head__kicker">{kicker}</span>
        <h2 className="v3-espace-head__title">{title}</h2>
      </div>
    </header>
  )
}

export function V3EntropySpace() {
  const { bytes, status, regenerate } = useSharedEntropy(SHARED_BYTES)

  return (
    <div className="v3-espace">
      {/* HERO — the cube */}
      <section className="v3-section v3-espace-section">
        <div className="v3-wrap">
          <SectionHead n="01" kicker="the geometry of randomness" title="Entropy, in three dimensions" />
          <article className="v3-panel v3-espace-panel">
            <EntropyCube bytes={bytes} status={status} onRegenerate={regenerate} />
          </article>
        </div>
      </section>

      {/* 2-up: return map + bit raster */}
      <section className="v3-section v3-espace-section">
        <div className="v3-wrap">
          <div className="v3-espace-grid">
            <div>
              <SectionHead n="02" kicker="short-range correlation" title="The return map" />
              <article className="v3-panel v3-espace-panel">
                <ReturnMap bytes={bytes} status={status} onRegenerate={regenerate} />
              </article>
            </div>
            <div>
              <SectionHead n="03" kicker="raw, scrolling, structureless" title="The bit raster" />
              <article className="v3-panel v3-espace-panel">
                <BitRaster bytes={bytes} status={status} onRegenerate={regenerate} />
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* phase space — fed by cheap /metrics JSON, not the entropy pool */}
      <section className="v3-section v3-espace-section">
        <div className="v3-wrap">
          <SectionHead n="04" kicker="health, over the last 24 hours" title="Quality phase-space" />
          <article className="v3-panel v3-espace-panel">
            <MetricsPhaseSpace />
          </article>
        </div>
      </section>
    </div>
  )
}
