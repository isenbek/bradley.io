"use client"

import { useEffect, useState } from "react"
import {
  getBands,
  getFleetChannels,
  getHealth,
  getJobs,
  getSoak,
  getSoakSummary,
  type Band,
  type FleetChannels,
  type HealthResponse,
  type Job,
  type SoakBand,
  type SoakSummary,
} from "@/components/sdr/api"
import { RowChart, RampKey } from "@/app/_charts"

/**
 * The SDR scanner stack, on the style kit. All panel: it is a radio reporting.
 *
 * Everything here is read from the control plane on bali.lan through the app's
 * own proxy. Nothing is computed in the browser except formatting.
 */

const POLL_MS = 60_000

const nf = (n: number | undefined | null) => (n ?? 0).toLocaleString()

/** Hz to the unit a radio person would actually say. */
function freq(hz: number | null | undefined): string {
  if (hz == null) return "-"
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(3)} GHz`
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(1)} kHz`
  return `${hz} Hz`
}

function jobTag(status: string): "live" | "warn" | "fail" {
  const s = status.toLowerCase()
  if (s.includes("fail") || s.includes("error")) return "fail"
  if (s.includes("run") || s.includes("active")) return "warn"
  return "live"
}

export function SdrBoard() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [bands, setBands] = useState<Band[]>([])
  const [soak, setSoak] = useState<SoakBand[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [chans, setChans] = useState<FleetChannels | null>(null)
  const [summary, setSummary] = useState<SoakSummary | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const ac = new AbortController()

    const poll = async () => {
      const r = await Promise.allSettled([
        getHealth(ac.signal),
        getBands(ac.signal),
        getSoak(ac.signal),
        getJobs(ac.signal),
        getFleetChannels(ac.signal),
      ])
      if (ac.signal.aborted) return
      const [h, b, s, j, c] = r
      if (h.status === "fulfilled") setHealth(h.value)
      if (b.status === "fulfilled") setBands(b.value ?? [])
      if (s.status === "fulfilled") setSoak(s.value ?? [])
      if (j.status === "fulfilled") setJobs(j.value ?? [])
      if (c.status === "fulfilled") setChans(c.value)
      setErr(r.every((x) => x.status === "rejected") ? "the control plane is not answering" : null)

      // The busiest band's frequency detail, fetched only once there is a band
      // to ask about. Chained rather than parallel because the band name is not
      // known until /soak answers.
      if (s.status === "fulfilled" && s.value?.length) {
        const top = [...s.value].sort((a, b2) => b2.n_hits - a.n_hits)[0]
        try {
          const sum = await getSoakSummary(top.band, ac.signal)
          if (!ac.signal.aborted) setSummary(sum)
        } catch {
          /* One band's detail missing just hides that panel. Worth being quiet
             about: when the control plane is down every other call has already
             failed too, and the page says so once at the top. */
        }
      }
    }

    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => {
      ac.abort()
      clearInterval(timer)
    }
  }, [])

  if (err && !health && !bands.length) {
    return (
      <div className="notice fail">
        <b>The control plane is not answering.</b> The scanners run on bali.lan and this page reads
        them across the network, so this means the link or the daemon is down rather than the radio
        hearing nothing.
      </div>
    )
  }

  const topFreqs = (summary?.top ?? [])
    .slice(0, 12)
    .map((f) => ({ label: freq(f.freq_hz), value: f.n, display: nf(f.n) }))

  const channelRows = chans
    ? Object.entries(chans.channels_global)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([ch, n]) => ({ label: `ch ${ch}`, value: n, display: nf(n) }))
    : []

  const soakRows = [...soak].sort((a, b) => b.n_hits - a.n_hits)

  return (
    <>
      <div className="prose beta-sec">
        <h2>The stack</h2>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Control plane</b>
            <span>
              <span className={`tag ${health?.status === "ok" ? "live" : "warn"}`}>
                {health?.status ?? "unknown"}
              </span>
            </span>
          </div>
          <table className="readout">
            <tbody>
              <tr>
                <td>Version</td>
                <td className="num">{health?.version ?? "-"}</td>
              </tr>
              <tr>
                <td>Bands configured</td>
                <td className="num">{nf(bands.length)}</td>
              </tr>
              <tr>
                <td>Bands with archived hits</td>
                <td className="num">{nf(soak.length)}</td>
              </tr>
              <tr>
                <td>Jobs recorded</td>
                <td className="num">{nf(jobs.length)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {topFreqs.length > 0 && (
        <>
          <div className="prose beta-sec">
            <h2>What it is hearing</h2>
            <p>
              The busiest archived band, by how often each frequency came back above threshold.
            </p>
          </div>
          <RampKey low="fewer hits" high="more" />
          <div className="panel">
            <div className="panel-face">
              <div className="panel-bar">
                <b>{summary?.band}</b>
                <span>{nf(summary?.n_hits)} hits</span>
              </div>
              <RowChart caption="Hits per frequency" data={topFreqs} />
            </div>
          </div>
        </>
      )}

      {channelRows.length > 0 && (
        <>
          <div className="prose beta-sec">
            <h2>Zigbee occupancy</h2>
            <p>
              802.15.4 channels 11 to 26, counted across every listening node. A busy channel here
              is where the mesh traffic actually is, not where it was configured to be.
            </p>
          </div>
          <div className="panel">
            <div className="panel-face">
              <div className="panel-bar">
                <b>Channel census</b>
                <span>
                  {chans?.active_channels_global?.length ?? 0} active of {channelRows.length}
                </span>
              </div>
              <RowChart caption="Frames seen per channel" data={channelRows} />
            </div>
          </div>
        </>
      )}

      <div className="prose beta-sec">
        <h2>The archive</h2>
      </div>

      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="Soak archive by band">
          <table>
            <thead>
              <tr>
                <th>Band</th>
                <th className="num">Hits</th>
                <th className="num">Days</th>
                <th>First seen</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {soakRows.map((s) => (
                <tr key={s.band}>
                  <td className="name">{s.band}</td>
                  <td className="num">{nf(s.n_hits)}</td>
                  <td className="num">{nf(s.dates?.length)}</td>
                  <td>{s.first_seen?.slice(0, 10) ?? "-"}</td>
                  <td>{s.last_seen?.slice(0, 10) ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tbl-foot">
            <span>{soakRows.length} bands with archived hits</span>
          </div>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>Recent jobs</h2>
      </div>

      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="Job history">
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Scanner</th>
                <th className="num">Duration</th>
                <th>Started</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.slice(0, 12).map((j) => (
                <tr key={j.id}>
                  <td className="name">{j.name}</td>
                  <td>{j.scanner}</td>
                  <td className="num">{j.duration_s != null ? `${nf(j.duration_s)}s` : "-"}</td>
                  <td>{j.started_at?.slice(0, 16).replace("T", " ") ?? "-"}</td>
                  <td>
                    <span className={`tag ${jobTag(j.status)}`}>{j.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tbl-foot">
            <span>
              {Math.min(12, jobs.length)} of {jobs.length}
            </span>
          </div>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>Band registry</h2>
      </div>

      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="Band registry">
          <table>
            <thead>
              <tr>
                <th>Band</th>
                <th>Scanner</th>
                <th className="num">From</th>
                <th className="num">To</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {bands.map((b) => (
                <tr key={b.id}>
                  <td className="name">{b.name}</td>
                  <td>{b.scanner}</td>
                  <td className="num">{freq(b.lo_hz)}</td>
                  <td className="num">{freq(b.hi_hz)}</td>
                  <td>
                    <span className={`tag ${b.enabled ? "live" : ""}`}>
                      {b.enabled ? "enabled" : "off"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tbl-foot">
            <span>{bands.length} configured</span>
          </div>
        </div>
      </div>
    </>
  )
}
