"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, ExternalLink, HeartPulse, Wrench } from "lucide-react"
import {
  getFleetState,
  getMedicEvents,
  type FleetState,
  type FleetNode,
  type MedicAction,
  type WorldEnvelope,
} from "@/components/fleet/api"

type Sev = "ok" | "warn" | "crit" | "stale"

function fmtAge(s: number | null | undefined): string {
  if (s == null) return "—"
  if (s < 60) return `${Math.round(s)}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function fmtUptime(s: number | null | undefined): string {
  if (s == null) return "—"
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  if (d > 0) return `${d}d ${h}h`
  const m = Math.floor((s % 3600) / 60)
  return `${h}h ${m}m`
}

function fmtBytes(n: number | null | undefined): string {
  if (n == null) return "—"
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} kB`
  return `${n} B`
}

// Per-vital thresholds → a severity tint. Higher disk/temp is worse; weaker wifi
// (more negative dBm) is worse.
function diskSev(pct?: number): Sev {
  if (pct == null) return "ok"
  if (pct >= 93) return "crit"
  if (pct >= 85) return "warn"
  return "ok"
}
function tempSev(c?: number): Sev {
  if (c == null) return "ok"
  if (c >= 72) return "crit"
  if (c >= 62) return "warn"
  return "ok"
}
function wifiSev(dbm?: number | null): Sev {
  if (dbm == null) return "ok"
  if (dbm <= -78) return "crit"
  if (dbm <= -68) return "warn"
  return "ok"
}
const sevColor: Record<Sev, string> = {
  ok: "var(--v3-green-dk)",
  warn: "var(--v3-gold-dk)",
  crit: "var(--v3-coral-dk)",
  stale: "var(--v3-slate)",
}

// A node's overall severity = its attention severity if flagged, else stale, else ok.
function nodeSev(n: FleetNode, att?: string): Sev {
  if (att === "crit") return "crit"
  if (att === "warn") return "warn"
  if (n.stale) return "stale"
  return "ok"
}

export function V3FleetDashboard() {
  const [state, setState] = useState<FleetState | null>(null)
  const [medics, setMedics] = useState<WorldEnvelope<MedicAction>[]>([])
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    let ctrl = new AbortController()

    const safe = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        return await fn()
      } catch {
        return null
      }
    }

    const load = async () => {
      if (typeof document !== "undefined" && document.hidden) return
      ctrl = new AbortController()
      const st = await safe(() => getFleetState(ctrl.signal))
      const md = await safe(() => getMedicEvents(ctrl.signal))
      if (!mounted) return
      if (st) setState(st)
      if (md) setMedics(md)
      setError(st === null)
      setLastUpdated(Date.now())
    }

    load()
    const id = setInterval(load, 10_000)
    return () => {
      mounted = false
      ctrl.abort()
      clearInterval(id)
    }
  }, [])

  const attMap = useMemo(() => {
    const m = new Map<string, { severity: string; reasons: string[] }>()
    for (const a of state?.attention ?? [])
      m.set(a.node, { severity: a.severity, reasons: a.reasons })
    return m
  }, [state])

  // Nodes sorted worst-first (crit → warn → stale → ok), then by id.
  const nodes = useMemo(() => {
    const rank: Record<Sev, number> = { crit: 0, warn: 1, stale: 2, ok: 3 }
    const arr = Object.values(state?.nodes ?? {})
    return arr
      .map((n) => ({ n, sev: nodeSev(n, attMap.get(n.data.node)?.severity) }))
      .sort((a, b) => rank[a.sev] - rank[b.sev] || a.n.data.node.localeCompare(b.n.data.node))
  }, [state, attMap])

  const rollup = useMemo(() => {
    let ok = 0,
      warn = 0,
      crit = 0,
      stale = 0
    for (const { sev } of nodes) {
      if (sev === "crit") crit++
      else if (sev === "warn") warn++
      else if (sev === "stale") stale++
      else ok++
    }
    return { total: nodes.length, ok, warn, crit, stale }
  }, [nodes])

  // Medic history: prefer the events feed (rolling last-100); if empty, fall back
  // to the single latest medic.action carried in state.
  const medicFeed = useMemo(() => {
    const fromEvents = [...medics].reverse() // newest first
    if (fromEvents.length > 0) return fromEvents.slice(0, 6)
    const latest = state?.latest?.["medic.action"]
    return latest ? [latest as unknown as WorldEnvelope<MedicAction>] : []
  }, [medics, state])

  const busOnline = state != null && !error && state.last_recv_age_s < 30
  const counts = useMemo(
    () =>
      Object.entries(state?.counts ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 9),
    [state]
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* STATUS + ROLLUP =============================================== */}
      <article
        className="v3-panel"
        style={{
          background:
            "linear-gradient(135deg, var(--v3-white) 0%, var(--v3-paper) 100%)",
        }}
      >
        <div className="v3-cardhead" style={{ marginBottom: 18 }}>
          <div className={`v3-live ${busOnline ? "v3-live--ok" : "v3-live--err"}`}>
            <span className="v3-live__dot" aria-hidden />
            {busOnline
              ? `worldsink · live · recv ${fmtAge(state?.last_recv_age_s)}`
              : "worldsink · offline"}
          </div>
          <div className="v3-cardhead__meta">
            {state
              ? `uptime ${fmtUptime(state.uptime_s)} · ${fmtBytes(state.bytes_in)} in`
              : "loading…"}
            {lastUpdated ? ` · updated ${fmtAge((Date.now() - lastUpdated) / 1000)}` : ""}
          </div>
        </div>

        <div className="v3-fleet-rollup">
          {[
            { lbl: "Nodes", val: rollup.total, color: "var(--v3-blue-700)" },
            { lbl: "Healthy", val: rollup.ok, color: "var(--v3-green-dk)" },
            { lbl: "Warn", val: rollup.warn, color: "var(--v3-gold-dk)" },
            { lbl: "Crit", val: rollup.crit, color: "var(--v3-coral-dk)" },
            { lbl: "Stale", val: rollup.stale, color: "var(--v3-slate)" },
          ].map((s) => (
            <div key={s.lbl} className="v3-fleet-rollup__cell">
              <div
                className="v3-font-display"
                style={{
                  fontWeight: 800,
                  fontSize: 34,
                  color: s.color,
                  letterSpacing: "-0.025em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.val}
              </div>
              <div
                className="v3-font-mono"
                style={{
                  fontSize: 10.5,
                  color: "var(--v3-slate)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  marginTop: 4,
                }}
              >
                {s.lbl}
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* ATTENTION BANNER ============================================== */}
      {state && state.attention.length > 0 ? (
        <article className="v3-panel v3-fleet-att">
          <div
            className="v3-panel-head"
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}
          >
            <Activity size={15} strokeWidth={2.25} />
            Needs attention · {state.attention.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {state.attention.map((a) => (
              <div
                key={a.node}
                className="v3-fleet-att__row"
                data-sev={a.severity}
              >
                <span className="v3-fleet-att__node">{a.node}</span>
                <span className="v3-fleet-att__sev" data-sev={a.severity}>
                  {a.severity}
                </span>
                <span className="v3-fleet-att__reasons">{a.reasons.join(" · ")}</span>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {/* NODE HEALTH GRID ============================================== */}
      <article className="v3-panel">
        <div
          className="v3-panel-head"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <HeartPulse size={15} strokeWidth={2.25} />
          Collector fleet · {rollup.total} node{rollup.total === 1 ? "" : "s"}
        </div>
        {nodes.length === 0 ? (
          <div className="v3-empty">{error ? "worldsink offline" : "loading…"}</div>
        ) : (
          <div className="v3-fleet-grid">
            {nodes.map(({ n, sev }) => {
              const d = n.data
              const svc = d.services ?? {}
              return (
                <div key={d.node} className="v3-fleet-node" data-sev={sev}>
                  <div className="v3-fleet-node__top">
                    <span className="v3-fleet-node__lamp" data-sev={sev} aria-hidden />
                    <span className="v3-fleet-node__id">{d.node}</span>
                    <span className="v3-fleet-node__age">
                      {n.stale ? "stale" : fmtAge(n.age_s)}
                    </span>
                  </div>

                  <div className="v3-fleet-vitals">
                    <div className="v3-fleet-vital">
                      <span className="v3-fleet-vital__lbl">disk</span>
                      <span
                        className="v3-fleet-vital__val"
                        style={{ color: sevColor[diskSev(d.disk_pct)] }}
                      >
                        {d.disk_pct != null ? `${d.disk_pct}%` : "—"}
                      </span>
                    </div>
                    <div className="v3-fleet-vital">
                      <span className="v3-fleet-vital__lbl">temp</span>
                      <span
                        className="v3-fleet-vital__val"
                        style={{ color: sevColor[tempSev(d.temp_c)] }}
                      >
                        {d.temp_c != null ? `${d.temp_c.toFixed(0)}°` : "—"}
                      </span>
                    </div>
                    <div className="v3-fleet-vital">
                      <span className="v3-fleet-vital__lbl">wifi</span>
                      <span
                        className="v3-fleet-vital__val"
                        style={{ color: sevColor[wifiSev(d.wifi_dbm)] }}
                      >
                        {d.wifi_dbm != null ? `${d.wifi_dbm}` : "—"}
                      </span>
                    </div>
                    <div className="v3-fleet-vital">
                      <span className="v3-fleet-vital__lbl">load</span>
                      <span className="v3-fleet-vital__val">
                        {d.load1 != null ? d.load1.toFixed(2) : "—"}
                      </span>
                    </div>
                    <div className="v3-fleet-vital">
                      <span className="v3-fleet-vital__lbl">uplink</span>
                      <span
                        className="v3-fleet-vital__val"
                        style={{
                          color:
                            d.uplink === "up"
                              ? "var(--v3-green-dk)"
                              : "var(--v3-coral-dk)",
                        }}
                      >
                        {d.uplink ?? "—"}
                      </span>
                    </div>
                    <div className="v3-fleet-vital">
                      <span className="v3-fleet-vital__lbl">up</span>
                      <span className="v3-fleet-vital__val">
                        {fmtUptime(d.uptime_s)}
                      </span>
                    </div>
                  </div>

                  <div className="v3-fleet-svc">
                    {["drainer", "mesh", "bt"].map((k) => {
                      const active = (svc[k] ?? "") === "active"
                      return (
                        <span
                          key={k}
                          className="v3-fleet-svc__chip"
                          data-active={active}
                          title={`${k}: ${svc[k] ?? "unknown"}`}
                        >
                          <span className="v3-fleet-svc__dot" aria-hidden />
                          {k}
                        </span>
                      )
                    })}
                    {d.spool_db_mb != null ? (
                      <span className="v3-fleet-svc__spool">
                        spool {d.spool_db_mb.toFixed(0)}MB
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </article>

      {/* MEDIC + BUS COUNTS (two cols) ================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 22,
        }}
      >
        <article className="v3-panel">
          <div
            className="v3-panel-head"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Wrench size={15} strokeWidth={2.25} />
            Auto-medic
          </div>
          {medicFeed.length === 0 ? (
            <div className="v3-empty">no remediation actions</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {medicFeed.map((e, i) => {
                const m = e.data
                return (
                  <div key={e.id ?? i} className="v3-fleet-medic">
                    <div className="v3-fleet-medic__head">
                      <span className="v3-fleet-medic__node">{m.node}</span>
                      <span className="v3-fleet-medic__remedy">{m.remedy}</span>
                      <span
                        className="v3-fleet-medic__badge"
                        data-on={m.acted}
                      >
                        {m.acted ? "acted" : m.armed ? "armed" : "idle"}
                      </span>
                    </div>
                    <div className="v3-fleet-medic__detail">{m.detail}</div>
                  </div>
                )
              })}
            </div>
          )}
        </article>

        <article className="v3-panel">
          <div className="v3-panel-head">Bus event counts</div>
          {counts.length === 0 ? (
            <div className="v3-empty">no events</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {counts.map(([type, n]) => (
                <div key={type} className="v3-fleet-count">
                  <span className="v3-fleet-count__type">{type}</span>
                  <span className="v3-fleet-count__n">{n.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      {/* CTA ========================================================== */}
      <article
        className="v3-panel"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div className="v3-panel-head" style={{ marginBottom: 4 }}>
            worldsink
          </div>
          <div
            className="v3-font-mono"
            style={{ fontSize: 13, color: "var(--v3-ink)" }}
          >
            WorldEvent bus sink · per-node health · attention gating · self-healing medic
          </div>
        </div>
        <a
          href="https://github.com/tinymachines/sdr"
          target="_blank"
          rel="noopener noreferrer"
          className="v3-btn v3-btn--ghost"
          style={{ gap: 6 }}
        >
          Source <ExternalLink size={13} strokeWidth={2.25} />
        </a>
      </article>
    </div>
  )
}
