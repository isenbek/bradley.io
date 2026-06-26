"use client"

import dynamic from "next/dynamic"
import { useGpsStream } from "@/components/dragonfli/gps/stream"
import { Skyplot } from "@/components/dragonfli/gps/Skyplot"
import { SnrBars } from "@/components/dragonfli/gps/SnrBars"
import { FixJitter } from "@/components/dragonfli/gps/FixJitter"

// MapLibre touches window — load it client-only and route-scoped.
const GroundTrack = dynamic(() => import("@/components/dragonfli/gps/GroundTrack"), {
  ssr: false,
  loading: () => (
    <div className="v3-gps-map-wrap">
      <div className="v3-gps-map-note">
        <span className="v3-gps-empty__dot" aria-hidden />
        bringing up the map…
      </div>
    </div>
  ),
})

const STATUS_LABEL: Record<string, string> = {
  connecting: "connecting",
  live: "fix · live",
  searching: "searching",
  offline: "offline",
}

export function V3Gps() {
  const gps = useGpsStream()
  const { status, tpv, history, sats, agg } = gps

  return (
    <div className="v3-gps">
      {/* HUD strip */}
      <div className="v3-gps-hud">
        <span className={`v3-gps-hud__status is-${status}`}>
          <span className="v3-gps-hud__dot" aria-hidden />
          {STATUS_LABEL[status] ?? status}
        </span>
        <span className="v3-gps-hud__stat">
          <b>{agg?.n_used ?? 0}</b>/{agg?.n_visible ?? 0} sats
        </span>
        <span className="v3-gps-hud__stat">
          mode <b>{tpv ? (tpv.mode === 3 ? "3D" : "2D") : "—"}</b>
        </span>
        <span className="v3-gps-hud__stat">
          HDOP <b>{agg?.hdop != null ? agg.hdop.toFixed(1) : "—"}</b>
        </span>
        <span className="v3-gps-hud__stat v3-gps-hud__stat--wide">
          {tpv ? `${tpv.lat.toFixed(5)}, ${tpv.lon.toFixed(5)}` : "no position"}
        </span>
      </div>

      {/* Panels */}
      <div className="v3-gps-grid">
        <Skyplot sats={sats} agg={agg} />
        <SnrBars sats={sats} agg={agg} />
        <FixJitter history={history} />
      </div>

      <article className="v3-panel v3-gps-map-panel">
        <GroundTrack history={history} tpv={tpv} />
      </article>
    </div>
  )
}
