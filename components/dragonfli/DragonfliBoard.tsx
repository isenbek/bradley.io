"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  getActive,
  getHealth,
  getReceiver,
  getRegistryStats,
  type ActiveResponse,
  type HealthResponse,
  type ReceiverFix,
  type RegistryStats,
} from "@/components/dragonfli/api"
import { RowChart, RampKey } from "@/app/_charts"

/**
 * Dragonfli, on the style kit. All panel: an antenna reporting what it heard.
 *
 * The aircraft table is the point of the page, so it refreshes on a short timer
 * while everything else rides the same poll. Five seconds matches how fast
 * ADS-B position messages actually arrive; going faster would just re-render
 * the same rows.
 */

const POLL_MS = 5_000

const nf = (n: number | undefined | null) => (n ?? 0).toLocaleString()

function uptime(s: number | undefined): string {
  if (!s) return "-"
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d) return `${d}d ${h}h`
  return h ? `${h}h ${m}m` : `${m}m`
}

/** A duration a person can read. 917853 s is not a number, it is 10.6 days. */
function since(s: number | undefined | null): string {
  if (s == null) return "-"
  if (s < 90) return `${Math.round(s)} s`
  if (s < 5400) return `${Math.round(s / 60)} min`
  if (s < 172800) return `${(s / 3600).toFixed(1)} h`
  return `${(s / 86400).toFixed(1)} days`
}

/**
 * The decoder answers `status: "ok"` about ITSELF: the process is up and the
 * socket is open. It says nothing about whether an aircraft has been heard.
 * This receiver reported "ok" while its last message was ten days old, which is
 * a working decoder attached to a dead antenna. Treat a long silence as the
 * headline it is.
 */
const STALE_AFTER_S = 3600

/** Feet, as an altitude is actually read. */
const ft = (n: number | null | undefined) => (n == null ? "-" : `${Math.round(n).toLocaleString()} ft`)

export function DragonfliBoard() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [rx, setRx] = useState<ReceiverFix | null>(null)
  const [active, setActive] = useState<ActiveResponse | null>(null)
  const [registry, setRegistry] = useState<RegistryStats | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    const poll = async () => {
      const r = await Promise.allSettled([
        getHealth(ac.signal),
        getReceiver(ac.signal),
        getActive(ac.signal),
        getRegistryStats(ac.signal),
      ])
      if (ac.signal.aborted) return
      const [h, rcv, a, reg] = r
      if (h.status === "fulfilled") setHealth(h.value)
      if (rcv.status === "fulfilled") setRx(rcv.value)
      if (a.status === "fulfilled") setActive(a.value)
      if (reg.status === "fulfilled") setRegistry(reg.value)
      setErr(r.every((x) => x.status === "rejected") ? "the receiver is not answering" : null)
    }
    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => {
      ac.abort()
      clearInterval(timer)
    }
  }, [])

  if (err && !health) {
    return (
      <div className="notice fail">
        <b>The receiver is not answering.</b> The antenna and its decoder run on a Pi in the
        garage and this page reads them across the network. Nothing here says whether anything is
        flying.
      </div>
    )
  }

  const ageS = health?.last_event_age_s ?? 0
  const stale = ageS > STALE_AFTER_S

  const craft = (active?.aircraft ?? [])
    .slice()
    .sort((a, b) => (b.last_seen ?? 0) - (a.last_seen ?? 0))

  const withPos = craft.filter((c) => c.lat != null && c.lon != null)

  const types = Object.entries(registry?.aircraft_by_type ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k, v]) => ({ label: k, value: v, display: nf(v) }))

  const makers = Object.entries(registry?.top_manufacturers ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k, v]) => ({ label: k, value: v, display: nf(v) }))

  return (
    <>
      <div className="prose beta-sec">
        <h2>The receiver</h2>
      </div>

      {stale && (
        <div className="notice">
          <b>Nothing heard for {since(ageS)}.</b> The decoder is running and reports itself
          healthy, which is a claim about the process rather than about the antenna. The counts
          below are the totals it accumulated before it went quiet, so treat them as a record and
          not as a picture of the sky right now.
        </div>
      )}

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>1090 MHz</b>
            <span>
              <span className={`tag ${stale ? "warn" : health?.status === "ok" ? "live" : "warn"}`}>
                {stale ? "no signal" : (health?.status ?? "unknown")}
              </span>
            </span>
          </div>
          <table className="readout">
            <tbody>
              <tr>
                <td>Aircraft in the air now</td>
                <td className="num">{nf(health?.n_aircraft_active ?? active?.count)}</td>
              </tr>
              <tr>
                <td>Messages received</td>
                <td className="num">{nf(health?.received)}</td>
              </tr>
              <tr>
                <td>Last message</td>
                <td className="num">{since(ageS)} ago</td>
              </tr>
              <tr>
                <td>Decoder uptime</td>
                <td className="num">{uptime(health?.uptime_s)}</td>
              </tr>
              <tr>
                <td>Parse errors</td>
                <td className="num">{nf(health?.parse_errors)}</td>
              </tr>
              <tr>
                <td>Dropped, queue full</td>
                <td className="num">{nf(health?.queue_full_drops)}</td>
              </tr>
            </tbody>
          </table>
          {rx && (
            <p className="beta-chart__note">
              Antenna fix: {rx.lat?.toFixed(4)}, {rx.lon?.toFixed(4)} at {ft(rx.alt_msl)}, from{" "}
              {nf(rx.n_used)} satellites, HDOP {rx.hdop?.toFixed(1)}.
              {rx.is_stale ? " The fix is stale." : ""}
            </p>
          )}
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>Overhead now</h2>
        <p>
          {craft.length === 0
            ? stale
              ? "Nothing, because the receiver has heard nothing at all since it went quiet. This table is not empty because the sky is."
              : "Nothing overhead at the moment. The antenna hears roughly 150 miles in good conditions and less through weather."
            : `Every aircraft the antenna can currently hear. ${withPos.length} of ${craft.length} are reporting a position; the rest are transmitting an identity without one.`}
        </p>
      </div>

      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="Aircraft overhead">
          <table>
            <thead>
              <tr>
                <th>Callsign</th>
                <th>Aircraft</th>
                <th className="num">Altitude</th>
                <th className="num">Speed</th>
                <th className="num">Signal</th>
                <th>Operator</th>
              </tr>
            </thead>
            <tbody>
              {craft.slice(0, 30).map((c) => (
                <tr key={c.icao}>
                  <td className="name">{c.callsign?.trim() || c.icao}</td>
                  <td>
                    {[c.enrich?.manufacturer, c.enrich?.model].filter(Boolean).join(" ") ||
                      c.enrich?.type ||
                      "unidentified"}
                  </td>
                  <td className="num">{ft(c.alt_baro ?? c.alt_geom)}</td>
                  <td className="num">{c.speed != null ? `${Math.round(c.speed)} kt` : "-"}</td>
                  <td className="num">{c.rssi_db != null ? `${c.rssi_db.toFixed(1)} dB` : "-"}</td>
                  <td>{c.enrich?.owner ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tbl-foot">
            <span>
              {Math.min(30, craft.length)} of {craft.length} heard
            </span>
            <Link href="/dragonfli/airspace">The map</Link>
          </div>
        </div>
      </div>

      {(types.length > 0 || makers.length > 0) && (
        <>
          <div className="prose beta-sec">
            <h2>The registry</h2>
            <p>
              {nf(registry?.total_aircraft)} aircraft in the FAA registry this decoder looks
              against. This is the whole registry, not what is overhead.
            </p>
          </div>

          <RampKey low="fewer" high="more" />

          <div className="panel">
            <div className="panel-face">
              <div className="panel-bar">
                <b>Registry</b>
                <span>{nf(registry?.total_aircraft)} aircraft</span>
              </div>
              <RowChart caption="By airframe type" data={types} />
              <RowChart caption="By manufacturer" data={makers} />
            </div>
          </div>
        </>
      )}

      <p className="quiet">
        <Link href="/dragonfli/airspace">Airspace map</Link> ·{" "}
        <Link href="/dragonfli/gps">GPS</Link> ·{" "}
        <Link href="/dragonfli/worldevent">The perception bus</Link>
      </p>
    </>
  )
}
