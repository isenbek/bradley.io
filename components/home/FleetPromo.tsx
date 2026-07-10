"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, HeartPulse } from "lucide-react"

// Live promo for the /fleet Fleet Health page. Polls the token-injecting
// /api/fleet proxy once (same-origin; the bearer stays server-side), derives a
// nodes/healthy/attention chip, and turns the dot amber when anything is flagged
// (red-ish for crit). Visibility-gated; hides the chip if worldsink is quiet.
type FleetChip = {
  total: number
  healthy: number
  warn: number
  crit: number
} | null

export function FleetPromo() {
  const [chip, setChip] = useState<FleetChip>(null)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()
    const tick = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const r = await fetch("/api/fleet/state.json", {
          cache: "no-store",
          signal: ctrl.signal,
        })
        const j = await r.json()
        if (!mounted || j.error) return
        const total = Object.keys(j.nodes ?? {}).length
        if (total === 0) return
        const att: { severity?: string }[] = j.attention ?? []
        const crit = att.filter((a) => a.severity === "crit").length
        const warn = att.filter((a) => a.severity === "warn").length
        setChip({ total, healthy: Math.max(0, total - att.length), warn, crit })
      } catch {
        /* worldsink offline — leave the chip hidden */
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

  const parts = chip
    ? [
        `${chip.total} node${chip.total === 1 ? "" : "s"}`,
        `${chip.healthy} healthy`,
        chip.crit > 0
          ? `${chip.crit} crit`
          : chip.warn > 0
            ? `${chip.warn} warn`
            : null,
      ].filter(Boolean)
    : []

  const flagged = chip != null && (chip.crit > 0 || chip.warn > 0)

  return (
    <Link href="/fleet" className="v3-air-promo" style={{ marginTop: 14 }}>
      <span className="v3-air-promo__ico">
        <HeartPulse size={20} strokeWidth={2.2} />
      </span>
      <span className="v3-air-promo__body">
        <span className="v3-air-promo__eyebrow">live · fleet health</span>
        <span className="v3-air-promo__title">The collector fleet, watched</span>
        <span className="v3-air-promo__blurb">
          Per-node vitals for the boxes behind the WorldEvent bus (disk, temp, uplink,
          services) with an attention layer that flags trouble and a self-healing medic
          that fixes it and logs what it did.
        </span>
      </span>
      <span className="v3-air-promo__right">
        {parts.length > 0 ? (
          <span className="v3-air-promo__count">
            <span
              className="v3-air-promo__dot"
              aria-hidden
              style={
                flagged
                  ? { background: "#f59e0b", boxShadow: "0 0 8px #f59e0b" }
                  : undefined
              }
            />
            {parts.join(" · ")}
          </span>
        ) : null}
        <ArrowRight className="v3-air-promo__arrow" size={18} strokeWidth={2.4} />
      </span>
    </Link>
  )
}
