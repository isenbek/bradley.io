"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useGpsStream } from "@/components/dragonfli/gps/stream"
import { BUS_GPS, busLastHeard } from "@/components/dragonfli/api"
import {
  InstrumentHead,
  InstrumentNote,
  When,
  useInstrument,
} from "@/components/kit/InstrumentStatus"
import { Skyplot } from "@/components/dragonfli/gps/Skyplot"
import { SnrBars } from "@/components/dragonfli/gps/SnrBars"
import { FixJitter } from "@/components/dragonfli/gps/FixJitter"

// MapLibre touches window, so load it client-only and route-scoped.
const GroundTrack = dynamic(() => import("@/components/dragonfli/gps/GroundTrack"), {
  ssr: false,
  loading: () => (
    <div className="beta-gps-map-wrap">
      <div className="beta-gps-map-note">
        <span className="beta-gps-empty__dot" aria-hidden />
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

  // The stream hook cycles offline -> connecting -> offline while it retries a
  // dead socket. Latch "down" across those retries so the status tag does not
  // flicker back to "checking" every time it tries again; only an opened socket
  // ("searching" or "live") clears it.
  const [down, setDown] = useState(false)
  useEffect(() => {
    if (status === "offline") setDown(true)
    else if (status === "live" || status === "searching") setDown(false)
  }, [status])

  // Last heard, from the stream itself: the newest fix or satellite frame. The
  // receiver stamps both in epoch seconds.
  const streamHeard = Math.max(tpv?.ts ?? 0, agg?.ts ?? 0) || null

  // When the stream has nothing to go on (socket down, or open and silent),
  // the perception bus still knows when it last saw a GPS event from the same
  // receiver. Asked once a minute for as long as that is the case, and not at
  // all while the stream is delivering.
  const [busAt, setBusAt] = useState<number | null>(null)
  const needBus = streamHeard == null && (down || status === "searching" || status === "live")
  useEffect(() => {
    if (!needBus) return
    let alive = true
    const ask = () =>
      busLastHeard(BUS_GPS).then((at) => {
        if (alive && at != null) setBusAt(at)
      })
    ask()
    const id = setInterval(ask, 60_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [needBus])

  const inst = useInstrument("gps", {
    lastHeard: streamHeard ?? busAt,
    error: down,
    pending: !down && status === "connecting" && streamHeard == null,
  })
  const notLive = inst.reading !== null && inst.reading.state !== "live"

  return (
    <div className="beta-gps">
      <InstrumentHead name="GPS receiver" status={inst}>
        {notLive && (
          <InstrumentNote>
            {down ? (
              <>
                <b>The receiver&apos;s stream is not answering</b>, so there is no fix and no
                constellation to draw.
              </>
            ) : (
              <>
                <b>The stream is connected, but the receiver is not sending.</b> There is no fix
                and no constellation to draw.
              </>
            )}{" "}
            {inst.lastHeardMs != null ? (
              <>
                {streamHeard == null
                  ? "The last GPS event this network's perception bus recorded from it arrived "
                  : "It was last heard "}
                <When at={inst.lastHeardMs} now={inst.now} />.{" "}
              </>
            ) : null}
            The panels below are empty for that reason. This page keeps retrying the stream and
            resumes by itself when the receiver does.
          </InstrumentNote>
        )}
      </InstrumentHead>

      {/* HUD strip */}
      <div className="beta-gps-hud">
        <span className={`beta-gps-hud__status is-${status}`}>
          <span className="beta-gps-hud__dot" aria-hidden />
          {STATUS_LABEL[status] ?? status}
        </span>
        <span className="beta-gps-hud__stat">
          <b>{agg?.n_used ?? 0}</b>/{agg?.n_visible ?? 0} sats
        </span>
        <span className="beta-gps-hud__stat">
          mode <b>{tpv ? (tpv.mode === 3 ? "3D" : "2D") : "-"}</b>
        </span>
        <span className="beta-gps-hud__stat">
          HDOP <b>{agg?.hdop != null ? agg.hdop.toFixed(1) : "-"}</b>
        </span>
        <span className="beta-gps-hud__stat beta-gps-hud__stat--wide">
          {tpv ? `${tpv.lat.toFixed(5)}, ${tpv.lon.toFixed(5)}` : "no position"}
        </span>
      </div>

      {/* Panels */}
      <div className="beta-gps-grid">
        <Skyplot sats={sats} agg={agg} offline={notLive} />
        <SnrBars sats={sats} agg={agg} offline={notLive} />
        <FixJitter history={history} offline={notLive} />
      </div>

      <article className="beta-gps-map-panel">
        <GroundTrack history={history} tpv={tpv} sats={sats} offline={notLive} />
      </article>
    </div>
  )
}
