"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Share2 } from "lucide-react"

// Live promo for the WorldEvent bus — the bus itself is the story, so one card
// covers every sense (this replaced separate mesh + chrony promos that each
// polled the API and both linked here). Polls /api/worldevent (cheap,
// same-origin) once, pulls the active type count plus the two richest samples
// (mesh.rssi_map, chrony.tracking), and shows a combined live chip. Visibility-
// gated so it doesn't poll in the background. Hides the chip if the bus is quiet.
type BusChip = {
  senses: number
  nodes: number | null
  offsetUs: number | null
  synced: boolean
} | null

function fmtOffset(us: number): string {
  if (Math.abs(us) >= 1000) return `${(us / 1000).toFixed(2)} ms`
  return `${us >= 0 ? "+" : ""}${us.toFixed(0)} µs`
}

export function WorldEventPromo() {
  const [chip, setChip] = useState<BusChip>(null)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()
    const tick = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const r = await fetch("/api/worldevent", { cache: "no-store", signal: ctrl.signal })
        const j = await r.json()
        const types: { type: string; sample?: Record<string, unknown> }[] = j.types ?? []
        if (!mounted || types.length === 0) return

        const mesh = types.find((t) => t.type === "mesh.rssi_map")?.sample as
          | { nodes?: unknown[]; units?: number }
          | undefined
        const nodes =
          mesh && Array.isArray(mesh.nodes) ? mesh.units ?? mesh.nodes.length : null

        const ch = types.find((t) => t.type === "chrony.tracking")?.sample as
          | { system_time_offset?: number; leap_status?: string }
          | undefined
        const off = typeof ch?.system_time_offset === "number" ? ch.system_time_offset : null
        const offsetUs = off == null ? null : off * 1e6
        const synced =
          off != null && Math.abs(off) < 1e-3 && (ch?.leap_status ?? "Normal") === "Normal"

        setChip({ senses: types.length, nodes, offsetUs, synced })
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

  const parts = chip
    ? [
        `${chip.senses} sense${chip.senses === 1 ? "" : "s"}`,
        chip.nodes != null ? `${chip.nodes} nodes` : null,
        chip.offsetUs != null ? fmtOffset(chip.offsetUs) : null,
      ].filter(Boolean)
    : []

  return (
    <Link href="/dragonfli/worldevent" className="v3-air-promo" style={{ marginTop: 14 }}>
      <span className="v3-air-promo__ico">
        <Share2 size={20} strokeWidth={2.2} />
      </span>
      <span className="v3-air-promo__body">
        <span className="v3-air-promo__eyebrow">live · worldevent bus</span>
        <span className="v3-air-promo__title">The perception bus</span>
        <span className="v3-air-promo__blurb">
          One schema-tagged UDP firehose carrying everything the lab senses: a wireless
          mesh mapped by RSSI, chrony holding true time, ADS-B, GPS. Decoded live; new
          senses just appear.
        </span>
      </span>
      <span className="v3-air-promo__right">
        {parts.length > 0 ? (
          <span className="v3-air-promo__count">
            <span
              className="v3-air-promo__dot"
              aria-hidden
              style={
                chip && (chip.offsetUs == null || chip.synced)
                  ? undefined
                  : { background: "#f59e0b", boxShadow: "0 0 8px #f59e0b" }
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
