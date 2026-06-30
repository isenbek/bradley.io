"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"

// Live promo for the WorldEvent bus, fronted by its chrony.tracking sense. Polls
// /api/worldevent (cheap, same-origin), pulls the last chrony.tracking sample,
// and shows a live clock-offset chip. Visibility-gated so it doesn't poll in the
// background. Hides the chip if the bus is quiet.
type ChronyChip = { offsetUs: number; stratum: number | string; synced: boolean } | null

function fmtOffset(us: number): string {
  if (Math.abs(us) >= 1000) return `${(us / 1000).toFixed(2)} ms`
  return `${us >= 0 ? "+" : ""}${us.toFixed(0)} µs`
}

export function ChronyPromo() {
  const [chip, setChip] = useState<ChronyChip>(null)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()
    const tick = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const r = await fetch("/api/worldevent", { cache: "no-store", signal: ctrl.signal })
        const j = await r.json()
        const ch = (j.types ?? []).find((t: { type: string }) => t.type === "chrony.tracking")
        const s = ch?.sample
        if (mounted && s && typeof s.system_time_offset === "number") {
          const offsetUs = s.system_time_offset * 1e6
          const synced = Math.abs(s.system_time_offset) < 1e-3 && (s.leap_status ?? "Normal") === "Normal"
          setChip({ offsetUs, stratum: s.stratum ?? "?", synced })
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
        <Clock size={20} strokeWidth={2.2} />
      </span>
      <span className="v3-air-promo__body">
        <span className="v3-air-promo__eyebrow">live · worldevent bus</span>
        <span className="v3-air-promo__title">The clock, disciplined</span>
        <span className="v3-air-promo__blurb">
          How tightly the box holds true time — chrony&apos;s NTP sync as a live panel:
          clock offset, stratum, skew, and the root-distance error bound. Another sense on the
          perception bus.
        </span>
      </span>
      <span className="v3-air-promo__right">
        {chip ? (
          <span className="v3-air-promo__count">
            <span
              className="v3-air-promo__dot"
              aria-hidden
              style={chip.synced ? undefined : { background: "#f59e0b", boxShadow: "0 0 8px #f59e0b" }}
            />
            {fmtOffset(chip.offsetUs)} · S{chip.stratum}
          </span>
        ) : null}
        <ArrowRight className="v3-air-promo__arrow" size={18} strokeWidth={2.4} />
      </span>
    </Link>
  )
}
