"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  BUS_ADSB,
  adsbLastHeard,
  busLastHeard,
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
import {
  InstrumentHead,
  InstrumentNote,
  InstrumentStatus,
  When,
  useInstrument,
} from "@/components/kit/InstrumentStatus"
import { FRESHNESS } from "@/lib/instrument-status"

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
  if (s < 1) return "under 1 s"
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
 * headline it is. How long is too long lives in the one freshness table,
 * lib/instrument-status.ts, under "adsb".
 */

/**
 * How often to ask the perception bus when it last carried an ADS-B event.
 * Always asked, not only when the API is down: the API's own "last event" is
 * the last bus envelope of ANY kind (GPS frames arrive every second), so it
 * cannot say whether the antenna is hearing aircraft. The bus keeps a time
 * per schema and can. A minute is fine against a ten-minute stale threshold.
 */
const BUS_ASK_MS = 60_000

/** The later of two times, either of which may be unknown. */
const later = (a: number | null, b: number | null) =>
  a != null && b != null ? Math.max(a, b) : (a ?? b)

/** Feet, as an altitude is actually read. */
const ft = (n: number | null | undefined) => (n == null ? "-" : `${Math.round(n).toLocaleString()} ft`)

export function DragonfliBoard() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [rx, setRx] = useState<ReceiverFix | null>(null)
  const [active, setActive] = useState<ActiveResponse | null>(null)
  const [registry, setRegistry] = useState<RegistryStats | null>(null)
  // The first poll has come back, one way or the other.
  const [asked, setAsked] = useState(false)
  // The latest poll got no answer from any endpoint.
  const [down, setDown] = useState(false)
  // When /health was last read, epoch ms: its last_event_age_s counts from here.
  const [healthAt, setHealthAt] = useState<number | null>(null)
  // The newest ADS-B frame the decoder has shown this tab, epoch ms: the newest
  // last_seen among tracked aircraft, kept as a running maximum so it does not
  // fall back when the last aircraft times out of the list.
  const [apiAt, setApiAt] = useState<number | null>(null)
  // The last ADS-B event the perception bus saw, epoch ms.
  const [busAt, setBusAt] = useState<number | null>(null)
  const busAskedAt = useRef(0)

  useEffect(() => {
    const ac = new AbortController()
    const poll = async () => {
      const busDue = Date.now() - busAskedAt.current > BUS_ASK_MS
      if (busDue) busAskedAt.current = Date.now()
      // The bus rides along with the API calls, so the first judgement is made
      // with both in hand and the tag does not flash "no data" in between. It
      // never rejects and gives up by itself after a few seconds.
      const [r, bus] = await Promise.all([
        Promise.allSettled([
          getHealth(ac.signal),
          getReceiver(ac.signal),
          getActive(ac.signal),
          getRegistryStats(ac.signal),
        ]),
        busDue ? busLastHeard(BUS_ADSB, ac.signal) : Promise.resolve(null),
      ])
      if (ac.signal.aborted) return
      const [h, rcv, a, reg] = r
      if (h.status === "fulfilled") {
        setHealth(h.value)
        setHealthAt(Date.now())
      }
      if (rcv.status === "fulfilled") setRx(rcv.value)
      if (a.status === "fulfilled") {
        setActive(a.value)
        const seen = adsbLastHeard(a.value?.aircraft, null)
        if (seen != null) setApiAt((prev) => later(prev, seen))
      }
      if (reg.status === "fulfilled") setRegistry(reg.value)
      // A bus that had nothing to say (not asked, unreadable, or no ADS-B on
      // record) leaves the last known time standing.
      if (bus != null) setBusAt(bus)
      setDown(r.every((x) => x.status === "rejected"))
      setAsked(true)
    }
    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => {
      ac.abort()
      clearInterval(timer)
    }
  }, [])

  // Last heard is the last ADS-B frame, and only that: the decoder's tracked
  // aircraft or the bus's ADS-B schemas, whichever is newer (see
  // adsbLastHeard). /health's last_event_age_s is not used for this. It is the
  // last bus envelope of any kind, and it stays under a second on GPS frames
  // alone while the 1090 radio is dead.
  const lastHeard = later(apiAt, busAt)
  const fromBus = busAt != null && (apiAt == null || busAt >= apiAt)
  const inst = useInstrument("adsb", { lastHeard, error: down, pending: !asked })

  const links = (
    <p className="quiet">
      <Link href="/dragonfli/airspace">Airspace map</Link> ·{" "}
      <Link href="/dragonfli/gps">GPS</Link> ·{" "}
      <Link href="/dragonfli/worldevent">The perception bus</Link>
    </p>
  )

  // Nothing to show: the first poll is still out, or the API has never answered
  // this tab. The poll keeps running either way, so this resolves itself.
  if (!health) {
    return (
      <>
        <div className="prose beta-sec">
          <h2>The receiver</h2>
        </div>
        <InstrumentHead name="1090 MHz" status={inst}>
          {!asked ? (
            <InstrumentNote>Asking the receiver.</InstrumentNote>
          ) : !down ? (
            <InstrumentNote>
              <b>The receiver&apos;s API answered, but not its health endpoint</b>, so this board
              cannot say what the antenna is hearing and shows nothing rather than guess. It asks
              again every 5 seconds.
            </InstrumentNote>
          ) : (
            <InstrumentNote>
              <b>The receiver&apos;s API is not answering</b>, so there is no aircraft table to
              show.{" "}
              {busAt != null ? (
                <>
                  The last ADS-B message this network&apos;s perception bus recorded from the
                  antenna arrived <When at={busAt} now={inst.now} />.{" "}
                </>
              ) : null}
              The antenna and its decoder run on a Pi in the garage and this page reads them
              across the network. Nothing here says whether anything is flying. This board asks
              again every 5 seconds and resumes by itself when the receiver answers.
            </InstrumentNote>
          )}
        </InstrumentHead>
        {links}
      </>
    )
  }

  // Seconds since the antenna was heard, off the ticking clock, so it keeps
  // counting while nothing answers instead of freezing at the last report.
  // Null when there is no ADS-B on record anywhere; /health's event age is not
  // a stand-in for it.
  const ageS = inst.reading?.ageS ?? null
  const stale = inst.reading !== null && inst.reading.state !== "live"
  // The decoder restarted and has received nothing since: its counters are
  // zeros, not totals, and the notice has to say which.
  const neverSinceStart = !health.received
  // Seconds since the box sent an envelope of any kind, counted on from when
  // /health was read. This is the link, not the antenna.
  const busEventAgeS =
    typeof health.last_event_age_s === "number" && healthAt != null
      ? health.last_event_age_s + Math.max(0, ((inst.now ?? healthAt) - healthAt) / 1000)
      : null
  // The partial failure: GPS and clock frames still arriving, no ADS-B. The
  // bus's own "a quiet minute is unusual" threshold is the test for arriving.
  const boxTalking = busEventAgeS != null && busEventAgeS <= FRESHNESS.worldevent.staleAfterS

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

      {stale && !down && ageS != null && (
        <div className="notice">
          <b>No aircraft heard for {since(ageS)}.</b> The decoder is running and reports itself
          healthy, which is a claim about the process rather than about the antenna.{" "}
          {neverSinceStart
            ? `It has received no events at all since it started ${uptime(health.uptime_s)} ago, so the zeros below mean the box is not delivering, not that the sky is empty.`
            : boxTalking
              ? `The box itself is still talking: its last event of any kind (GPS and clock frames, mostly) arrived ${since(busEventAgeS)} ago. So the link is up, and what has gone quiet is the 1090 side: the radio, its decoder or, for a short gap overnight, the sky itself. The event count below keeps climbing because it counts those other frames too.`
              : "The counts below are the totals it accumulated before it went quiet, so treat them as a record and not as a picture of the sky right now."}
          {fromBus
            ? " The last-heard time comes from the perception bus, a second reader of the same antenna, because the decoder is tracking no aircraft to take it from."
            : ""}
        </div>
      )}

      {/* No ADS-B time from either source. That is not the same as a silent
          antenna, and the notice does not claim it is. */}
      {stale && !down && ageS == null && (
        <div className="notice">
          <b>No ADS-B message on record.</b> The decoder is tracking no aircraft right now, and the
          perception bus, the second reader this board asks, has no ADS-B time to give. So this
          board cannot say when the antenna was last heard, and says that rather than guess.{" "}
          {neverSinceStart
            ? `The decoder has received no events of any kind since it started ${uptime(health.uptime_s)} ago.`
            : boxTalking
              ? `The box itself is talking: its last event of any kind (GPS and clock frames, mostly) arrived ${since(busEventAgeS)} ago.`
              : ""}
        </div>
      )}

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar beta-inst-bar">
            <b>1090 MHz</b>
            <span className="beta-inst-tags">
              <InstrumentStatus status={inst} />
              {/* The decoder's claim about its own process, labelled as that.
                  Shown only while it is the one saying it. */}
              {!down ? (
                <span className={`tag ${health.status === "ok" ? "live" : "warn"}`}>
                  decoder {health.status}
                </span>
              ) : null}
            </span>
          </div>
          {down && (
            <InstrumentNote>
              <b>The receiver&apos;s API has stopped answering.</b> The figures and the aircraft
              table below are its last report, read <When at={healthAt} now={inst.now} />, and are
              not a picture of the sky now. This board asks again every 5 seconds and resumes by
              itself.
            </InstrumentNote>
          )}
          <table className="readout">
            <tbody>
              <tr>
                <td>Aircraft tracked right now</td>
                <td className="num">{nf(health.n_aircraft_active ?? active?.count)}</td>
              </tr>
              <tr>
                <td>Last ADS-B message</td>
                <td className="num">{ageS != null ? `${since(ageS)} ago` : "none on record"}</td>
              </tr>
              {/* The next two count every envelope the box sends, GPS and clock
                  frames included, and are labelled so. They show the link is
                  up; only the row above says the antenna is hearing aircraft. */}
              <tr>
                <td>Last bus event, any kind</td>
                <td className="num">
                  {busEventAgeS != null
                    ? `${since(busEventAgeS)} ago`
                    : "none since the decoder started"}
                </td>
              </tr>
              <tr>
                <td>Bus events received, all kinds</td>
                <td className="num">{nf(health?.received)}</td>
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
              ? ageS != null
                ? "Nothing, because the receiver has heard nothing at all since it went quiet. This table is not empty because the sky is."
                : "Nothing is being tracked. Whether that is an empty sky or a silent antenna, this board cannot tell right now."
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

      {links}
    </>
  )
}
