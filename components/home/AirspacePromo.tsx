"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Map as MapIcon } from "lucide-react"
import { getActive } from "@/components/dragonfli/api"

// Live promo card under the HOTBITS hero. Polls the Dragonfli ADS-B receiver
// for the current active-aircraft count (cheap, CORS-open endpoint; gated on
// tab visibility so it doesn't poll in the background).
export function AirspacePromo() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()
    const tick = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const r = await getActive(ctrl.signal)
        if (mounted) setCount(r.count)
      } catch {
        /* receiver offline — leave the chip hidden */
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
    <Link href="/dragonfli/airspace" className="v3-air-promo" style={{ marginTop: 14 }}>
      <span className="v3-air-promo__ico">
        <MapIcon size={20} strokeWidth={2.2} />
      </span>
      <span className="v3-air-promo__body">
        <span className="v3-air-promo__eyebrow">live · airspace map</span>
        <span className="v3-air-promo__title">The sky over Grand Rapids, mapped</span>
        <span className="v3-air-promo__blurb">
          Live ADS-B aircraft on a self-hosted vector map: 15-min density forecast,
          trajectory ribbons, and an RSSI reception bloom.
        </span>
      </span>
      <span className="v3-air-promo__right">
        {count != null ? (
          <span className="v3-air-promo__count">
            <span className="v3-air-promo__dot" aria-hidden />
            {count} up now
          </span>
        ) : null}
        <ArrowRight className="v3-air-promo__arrow" size={18} strokeWidth={2.4} />
      </span>
    </Link>
  )
}
