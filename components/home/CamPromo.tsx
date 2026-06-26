"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Camera } from "lucide-react"

// Live promo card for the /cam page. Polls the snapshot meta for the newest
// frame's age (cheap same-origin endpoint; visibility-gated).
export function CamPromo() {
  const [epoch, setEpoch] = useState<number | null>(null)
  const [ago, setAgo] = useState("")

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()
    const tick = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const r = await fetch("/api/cam/meta", { cache: "no-store", signal: ctrl.signal })
        if (!r.ok) throw new Error("no frame")
        const m = await r.json()
        if (mounted) setEpoch(m.epoch)
      } catch {
        /* no frame yet — leave the chip hidden */
      }
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => {
      mounted = false
      ctrl.abort()
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (epoch == null) return
    const fmt = () => {
      const s = Math.max(0, Math.round(Date.now() / 1000 - epoch))
      setAgo(s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`)
    }
    fmt()
    const id = setInterval(fmt, 1000)
    return () => clearInterval(id)
  }, [epoch])

  return (
    <Link href="/cam" className="v3-air-promo" style={{ marginTop: 14 }}>
      <span className="v3-air-promo__ico">
        <Camera size={20} strokeWidth={2.2} />
      </span>
      <span className="v3-air-promo__body">
        <span className="v3-air-promo__eyebrow">live · camera</span>
        <span className="v3-air-promo__title">A frame from the box, once a minute</span>
        <span className="v3-air-promo__blurb">
          A self-hosted still grabbed off the attached camera with ffmpeg, cached on the metal and
          served same-origin — no stream, no cloud.
        </span>
      </span>
      <span className="v3-air-promo__right">
        {epoch != null ? (
          <span className="v3-air-promo__count">
            <span className="v3-air-promo__dot" aria-hidden />
            {ago}
          </span>
        ) : null}
        <ArrowRight className="v3-air-promo__arrow" size={18} strokeWidth={2.4} />
      </span>
    </Link>
  )
}
