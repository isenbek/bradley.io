"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Share2 } from "lucide-react"

// Live promo for the WorldEvent bus, fronted by its richest sense: the mesh
// RSSI graph. Polls /api/worldevent (cheap, same-origin), pulls the last
// mesh.rssi_map sample, and shows a live "N nodes · mean dBm" chip. Visibility-
// gated so it doesn't poll in the background. Hides the chip if the bus is quiet.
type MeshChip = { nodes: number; mean: number } | null

export function MeshPromo() {
  const [chip, setChip] = useState<MeshChip>(null)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()
    const tick = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const r = await fetch("/api/worldevent", { cache: "no-store", signal: ctrl.signal })
        const j = await r.json()
        const mesh = (j.types ?? []).find((t: { type: string }) => t.type === "mesh.rssi_map")
        const s = mesh?.sample
        if (mounted && s && Array.isArray(s.nodes) && Array.isArray(s.links)) {
          const rssis = s.links.map((l: { rssi: number }) => l.rssi).filter((v: number) => typeof v === "number")
          const mean = rssis.length ? rssis.reduce((a: number, b: number) => a + b, 0) / rssis.length : 0
          setChip({ nodes: s.units ?? s.nodes.length, mean: Math.round(mean) })
        }
      } catch {
        /* bus offline — leave the chip hidden */
      }
    }
    tick()
    const id = setInterval(tick, 15000)
    return () => {
      mounted = false
      ctrl.abort()
      clearInterval(id)
    }
  }, [])

  return (
    <Link href="/dragonfli/worldevent" className="v3-air-promo" style={{ marginTop: 14 }}>
      <span className="v3-air-promo__ico">
        <Share2 size={20} strokeWidth={2.2} />
      </span>
      <span className="v3-air-promo__body">
        <span className="v3-air-promo__eyebrow">live · worldevent bus</span>
        <span className="v3-air-promo__title">The mesh, mapped by signal</span>
        <span className="v3-air-promo__blurb">
          A wireless mesh as a live node-link graph — every node placed, every link colored
          by RSSI. One sense on the perception bus, where new senses just appear.
        </span>
      </span>
      <span className="v3-air-promo__right">
        {chip ? (
          <span className="v3-air-promo__count">
            <span className="v3-air-promo__dot" aria-hidden />
            {chip.nodes} nodes · {chip.mean} dBm
          </span>
        ) : null}
        <ArrowRight className="v3-air-promo__arrow" size={18} strokeWidth={2.4} />
      </span>
    </Link>
  )
}
