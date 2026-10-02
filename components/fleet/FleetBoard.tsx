"use client"

import { useEffect, useState } from "react"
import {
  getFleetState,
  getMedicEvents,
  type FleetState,
  type MedicAction,
  type WorldEnvelope,
} from "@/components/fleet/api"
import { RowChart } from "@/app/_charts"
import {
  InstrumentHead,
  InstrumentNote,
  InstrumentStatus,
  UpstreamSilence,
  When,
  useInstrument,
} from "@/components/kit/InstrumentStatus"
import {
  NO_MEMORY,
  ageWords,
  upstreamMemory,
  type UpstreamMemory,
} from "@/lib/instrument-status"

/**
 * Fleet health, on the style kit. All panel: every figure is a node reporting.
 *
 * The attention list uses the kit's state colours, and they mean what the kit
 * says they mean. `crit` is red because an invariant broke on that node; `warn`
 * is orange because it needs a human. Nothing else on the page is allowed to be
 * either colour, which is what makes them worth looking at.
 *
 * That includes the collector being unreachable. It used to be announced in a
 * red notice, but a host being off the network is not a broken invariant: it is
 * an instrument that is offline, which is ATTENTION, and the status tag in the
 * panel head says so in orange.
 */

const POLL_MS = 20_000

const nf = (n: number | undefined | null) => (n ?? 0).toLocaleString()

function uptime(s: number | undefined): string {
  if (!s) return "-"
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  if (d) return `${d}d ${h}h`
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}h ${m}m` : `${m}m`
}

const bytes = (n: number | undefined) => {
  if (!n) return "0 B"
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} KB`
  return `${n} B`
}

export function FleetBoard() {
  const [state, setState] = useState<FleetState | null>(null)
  const [medic, setMedic] = useState<WorldEnvelope<MedicAction>[]>([])
  // The first poll has come back, one way or the other.
  const [asked, setAsked] = useState(false)
  // The latest poll for the collector's state failed.
  const [down, setDown] = useState(false)
  // When the state on screen was read, epoch ms.
  const [stateAt, setStateAt] = useState<number | null>(null)
  // What the proxy remembers about a collector that is not answering.
  const [memory, setMemory] = useState<UpstreamMemory>(NO_MEMORY)

  useEffect(() => {
    const ac = new AbortController()
    const poll = async () => {
      const [s, m] = await Promise.allSettled([
        getFleetState(ac.signal),
        getMedicEvents(ac.signal),
      ])
      if (ac.signal.aborted) return
      if (s.status === "fulfilled") {
        setState(s.value)
        setStateAt(Date.now())
        setDown(false)
      } else {
        setDown(true)
        setMemory(upstreamMemory([s.reason]))
      }
      if (m.status === "fulfilled") setMedic(m.value ?? [])
      setAsked(true)
    }
    poll()
    const timer = setInterval(poll, POLL_MS)
    return () => {
      ac.abort()
      clearInterval(timer)
    }
  }, [])

  // Last heard is the newest message the collector received off the bus: the
  // moment the state was read, less the age the collector reported for it. With
  // no state at all, it is whatever the proxy remembers.
  const lastHeard =
    state && stateAt != null && typeof state.last_recv_age_s === "number"
      ? stateAt - state.last_recv_age_s * 1000
      : memory.lastOkMs
  const inst = useInstrument("fleet", { lastHeard, error: down, pending: !asked })
  const notLive = inst.reading !== null && inst.reading.state !== "live"

  // Nothing to show: the first poll is still out, or the collector has never
  // answered this tab. The poll keeps running either way.
  if (!state) {
    return (
      <>
        <div className="prose beta-sec">
          <h2>The bus</h2>
        </div>
        <InstrumentHead name="Collector" status={inst}>
          {!asked ? (
            <InstrumentNote>Reading the bus.</InstrumentNote>
          ) : (
            <InstrumentNote>
              <b>The collector is not answering.</b>{" "}
              <UpstreamSilence status={inst} watchingSinceMs={memory.watchingSinceMs} /> This page
              reads the collector on another host, so this means the link or the collector is
              down. It says nothing about the nodes themselves. This board asks again every 20
              seconds and resumes by itself when the collector answers.
            </InstrumentNote>
          )}
        </InstrumentHead>
      </>
    )
  }

  const nodes = Object.values(state.nodes ?? {}).sort((a, b) =>
    a.host.localeCompare(b.host)
  )
  const fresh = nodes.filter((n) => !n.stale)
  const attention = state.attention ?? []

  const counts = Object.entries(state.counts ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([k, v]) => ({ label: k, value: v, display: nf(v) }))

  return (
    <>
      <div className="prose beta-sec">
        <h2>The bus</h2>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar beta-inst-bar">
            <b>Collector</b>
            <InstrumentStatus status={inst} />
          </div>
          {notLive && (
            <InstrumentNote>
              {down ? (
                <>
                  <b>The collector has stopped answering.</b> The figures and the node table below
                  are its last report, read <When at={stateAt} now={inst.now} />, and say nothing
                  about the nodes now.
                </>
              ) : (
                <>
                  <b>The collector is answering, but the bus is quiet.</b> No node has sent it a
                  message since <When at={inst.lastHeardMs} now={inst.now} />. Each row below is
                  that node&apos;s last report, not its current state.
                </>
              )}{" "}
              This board asks again every 20 seconds and resumes by itself.
            </InstrumentNote>
          )}
          <table className="readout">
            <tbody>
              <tr>
                <td>Nodes reporting</td>
                <td className="num">
                  {fresh.length} / {nodes.length}
                </td>
              </tr>
              <tr>
                <td>Last message</td>
                {/* Off the ticking clock, so it keeps counting while the
                    collector is not answering instead of freezing at the last
                    value it reported. */}
                <td className="num">
                  {ageWords(inst.reading?.ageS ?? state.last_recv_age_s ?? 0)} ago
                </td>
              </tr>
              <tr>
                <td>Collector uptime</td>
                <td className="num">{uptime(state.uptime_s)}</td>
              </tr>
              <tr>
                <td>Received</td>
                <td className="num">{bytes(state.bytes_in)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {attention.length > 0 && (
        <>
          <div className="prose beta-sec">
            <h2>Needs a human</h2>
          </div>
          {attention.map((a) => (
            <div
              className={`notice ${a.severity === "crit" ? "fail" : ""}`}
              key={`${a.node}-${a.severity}`}
            >
              <b>
                {a.node}: {a.severity}
              </b>{" "}
              {a.reasons.join(". ")}
            </div>
          ))}
        </>
      )}

      <div className="prose beta-sec">
        <h2>Nodes</h2>
        <p>
          Each row is a node reporting for itself. A stale one has stopped sending, which is a
          different thing from a node that is reporting a problem.
        </p>
      </div>

      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="Fleet nodes">
          <table>
            <thead>
              <tr>
                <th>Node</th>
                <th className="num">Disk</th>
                <th className="num">Temp</th>
                <th className="num">Load</th>
                <th className="num">Wi-Fi</th>
                <th className="num">Uptime</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => {
                const d = n.data ?? {}
                const diskHot = (d.disk_pct ?? 0) >= 90
                return (
                  <tr key={n.host}>
                    <td className="name">{n.host}</td>
                    <td className="num">{d.disk_pct != null ? `${d.disk_pct}%` : "-"}</td>
                    <td className="num">{d.temp_c != null ? `${d.temp_c.toFixed(0)}C` : "-"}</td>
                    <td className="num">{d.load1 != null ? d.load1.toFixed(2) : "-"}</td>
                    <td className="num">{d.wifi_dbm != null ? `${d.wifi_dbm} dBm` : "-"}</td>
                    <td className="num">{uptime(d.uptime_s)}</td>
                    <td>
                      <span
                        className={`tag ${n.stale ? "warn" : diskHot ? "fail" : "live"}`}
                      >
                        {n.stale
                          ? `stale ${Math.round(n.age_s)}s`
                          : diskHot
                            ? "disk critical"
                            : "ok"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="tbl-foot">
            <span>
              {fresh.length} reporting, {nodes.length - fresh.length} stale
            </span>
          </div>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>Traffic</h2>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Bus events</b>
            <span>by schema</span>
          </div>
          <RowChart
            caption="Messages received per schema"
            data={counts}
            emptyNote="No events counted yet."
          />
        </div>
      </div>

      {medic.length > 0 && (
        <>
          <div className="prose beta-sec">
            <h2>Self-healing</h2>
            <p>
              What the medic did about it. `armed` means it was allowed to act; `acted` means it
              did.
            </p>
          </div>
          <div className="ledger">
            <div className="scroller" tabIndex={0} role="region" aria-label="Medic actions">
              <table>
                <thead>
                  <tr>
                    <th>Node</th>
                    <th>Remedy</th>
                    <th>Detail</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {/* events.jsonl yields WorldEnvelopes; the action is under .data */}
                  {medic.slice(0, 20).map((e, i) => {
                    const m = e.data
                    if (!m) return null
                    return (
                      <tr key={`${m.node}-${m.remedy}-${i}`}>
                        <td className="name">{m.node}</td>
                        <td>{m.remedy}</td>
                        <td>{m.detail}</td>
                        <td>
                          <span className={`tag ${m.acted ? "live" : m.armed ? "warn" : ""}`}>
                            {m.acted ? "acted" : m.armed ? "armed" : "observed"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )
}
