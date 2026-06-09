"use client"

import { useEffect, useMemo, useState } from "react"
import { ExternalLink } from "lucide-react"
import {
  getActive,
  getHealth,
  getPredictStatus,
  getReceiver,
  getRegistryStats,
  type Aircraft,
  type HealthResponse,
  type PredictStatus,
  type ReceiverFix,
  type RegistryStats,
} from "@/components/dragonfli"

const NM_PER_DEG = 60
const SIZE = 360
const PAD = 16

const RANGE_OPTIONS = [50, 100, 200] as const

function altColor(alt: number | null): string {
  if (alt == null) return "var(--v3-mist)"
  if (alt < 10000) return "var(--v3-coral)"
  if (alt < 25000) return "var(--v3-blue-500)"
  return "var(--v3-green)"
}

function fmtUptime(s: number): string {
  if (!s || !isFinite(s)) return "—"
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  if (days > 0) return `${days}d ${hours}h`
  const mins = Math.floor((s % 3600) / 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function fmtAge(s: number): string {
  if (!s || !isFinite(s)) return "—"
  if (s < 60) return `${Math.round(s)}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function cleanName(s: string | null | undefined): string {
  return (s ?? "").trim().replace(/\s+/g, " ")
}

function fmtMfr(name: string): string {
  return cleanName(name)
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .slice(0, 24)
}

function Radar({
  aircraft,
  receiver,
}: {
  aircraft: Aircraft[]
  receiver: ReceiverFix | null
}) {
  const [rangeNm, setRangeNm] = useState<number>(100)
  const [hover, setHover] = useState<Aircraft | null>(null)

  const center = useMemo(
    () => (receiver ? { lat: receiver.lat, lon: receiver.lon } : null),
    [receiver]
  )
  const cosLat = center ? Math.cos((center.lat * Math.PI) / 180) : 1

  const cx = SIZE / 2
  const cy = SIZE / 2
  const r = (SIZE - PAD * 2) / 2

  const placed = useMemo(() => {
    if (!center) return []
    return aircraft
      .filter((a) => a.lat != null && a.lon != null)
      .map((a) => {
        const dLat = (a.lat as number) - center.lat
        const dLon = (a.lon as number) - center.lon
        const yNm = dLat * NM_PER_DEG
        const xNm = dLon * NM_PER_DEG * cosLat
        const dist = Math.hypot(xNm, yNm)
        const xpx = cx + (xNm / rangeNm) * r
        const ypx = cy - (yNm / rangeNm) * r
        return { a, dist, xpx, ypx }
      })
      .filter((p) => p.dist <= rangeNm)
  }, [aircraft, center, cosLat, cx, cy, r, rangeNm])

  const rings = [0.25, 0.5, 0.75, 1.0]

  return (
    <article className="v3-panel">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <div className="v3-panel-head" style={{ marginBottom: 4 }}>
            Local radar · top-down view
          </div>
          <div
            style={{
              fontFamily: "var(--font-v3-mono), monospace",
              fontSize: 11,
              color: "var(--v3-slate)",
            }}
          >
            {placed.length} / {aircraft.length} aircraft in range
          </div>
        </div>
        <div className="v3-radar__rangebar">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              data-active={rangeNm === opt}
              onClick={() => setRangeNm(opt)}
            >
              {opt}nm
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 380px) 1fr",
          gap: 22,
          alignItems: "start",
        }}
      >
        <div className="v3-radar">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="v3-radar__svg">
            <defs>
              <radialGradient id="v3-radar-bg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(19, 184, 243, 0.10)" />
                <stop offset="70%" stopColor="rgba(19, 184, 243, 0.03)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            <circle cx={cx} cy={cy} r={r} fill="url(#v3-radar-bg)" />

            {rings.map((f) => (
              <g key={f}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r * f}
                  fill="none"
                  stroke="var(--v3-line)"
                  strokeWidth={0.7}
                  strokeDasharray="2 4"
                />
                <text
                  x={cx + r * f - 3}
                  y={cy - 5}
                  textAnchor="end"
                  fontSize="9"
                  fontFamily="ui-monospace, monospace"
                  fill="var(--v3-slate)"
                  opacity="0.65"
                >
                  {Math.round(rangeNm * f)}
                </text>
              </g>
            ))}

            <line x1={cx} y1={PAD} x2={cx} y2={SIZE - PAD} stroke="var(--v3-line)" strokeWidth={0.7} />
            <line x1={PAD} y1={cy} x2={SIZE - PAD} y2={cy} stroke="var(--v3-line)" strokeWidth={0.7} />

            {(["N", "E", "S", "W"] as const).map((d, i) => {
              const pos = [
                [cx, PAD + 8],
                [SIZE - PAD - 4, cy + 4],
                [cx, SIZE - PAD - 2],
                [PAD + 4, cy + 4],
              ][i]
              return (
                <text
                  key={d}
                  x={pos[0]}
                  y={pos[1]}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="ui-monospace, monospace"
                  fontWeight="700"
                  fill="var(--v3-slate)"
                  opacity="0.75"
                >
                  {d}
                </text>
              )
            })}

            {/* Receiver */}
            <circle cx={cx} cy={cy} r={3.5} fill="var(--v3-blue-600)" />
            <circle
              cx={cx}
              cy={cy}
              r={7}
              fill="none"
              stroke="var(--v3-blue-500)"
              strokeWidth={1}
              opacity="0.55"
            >
              <animate attributeName="r" from="7" to="16" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.6" to="0" dur="2.4s" repeatCount="indefinite" />
            </circle>

            {/* Aircraft */}
            {placed.map(({ a, xpx, ypx }) => {
              const color = altColor(a.alt_baro)
              const heading = a.track ?? 0
              const isHover = hover?.icao === a.icao
              return (
                <g
                  key={a.icao}
                  transform={`translate(${xpx} ${ypx}) rotate(${heading})`}
                  onMouseEnter={() => setHover(a)}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer" }}
                >
                  <polygon
                    points="0,-6 5,5 0,3 -5,5"
                    fill={color}
                    stroke={isHover ? "var(--v3-charcoal)" : "none"}
                    strokeWidth={1.25}
                  />
                </g>
              )
            })}
          </svg>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontFamily: "var(--font-v3-mono), monospace",
              fontSize: 10.5,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--v3-slate)",
              fontWeight: 700,
            }}
          >
            {hover ? "selected" : "altitude legend"}
          </div>

          {hover ? (
            <div className="v3-radar__detail">
              <div className="v3-radar__detail-call">
                {hover.callsign?.trim() || hover.icao.toUpperCase()}
              </div>
              <div className="v3-radar__detail-sub">
                {cleanName(hover.enrich?.owner) || "—"} ·{" "}
                {cleanName(hover.enrich?.model) || "unknown"}
              </div>
              <div className="v3-radar__detail-grid">
                <span>
                  alt ·{" "}
                  <strong>
                    {hover.alt_baro != null ? `${hover.alt_baro.toLocaleString()}ft` : "—"}
                  </strong>
                </span>
                <span>
                  spd ·{" "}
                  <strong>
                    {hover.speed != null ? `${Math.round(hover.speed)}kt` : "—"}
                  </strong>
                </span>
                <span>
                  trk ·{" "}
                  <strong>
                    {hover.track != null ? `${Math.round(hover.track)}°` : "—"}
                  </strong>
                </span>
                <span>
                  vr ·{" "}
                  <strong>{hover.vertical_rate ?? 0} fpm</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="v3-radar__legend">
              <div className="v3-radar__legend-row">
                <span className="v3-radar__sw" style={{ background: "var(--v3-coral)" }} />
                &lt; 10,000 ft
              </div>
              <div className="v3-radar__legend-row">
                <span className="v3-radar__sw" style={{ background: "var(--v3-blue-500)" }} />
                10,000 – 25,000 ft
              </div>
              <div className="v3-radar__legend-row">
                <span className="v3-radar__sw" style={{ background: "var(--v3-green)" }} />
                &gt; 25,000 ft
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--v3-slate)" }}>
                Receiver at the centre · rings every{" "}
                {Math.round(rangeNm / 4)}nm.
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function AircraftTable({ aircraft }: { aircraft: Aircraft[] }) {
  const rows = useMemo(() => {
    return [...aircraft]
      .sort((a, b) => (b.last_seen ?? 0) - (a.last_seen ?? 0))
      .slice(0, 30)
  }, [aircraft])

  return (
    <article className="v3-panel">
      <div className="v3-panel-head">Active aircraft · last {rows.length}</div>
      {rows.length === 0 ? (
        <div className="v3-empty">no aircraft right now</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="v3-actable">
            <thead>
              <tr>
                <th>Callsign</th>
                <th>ICAO</th>
                <th>Owner / model</th>
                <th>Alt</th>
                <th>Speed</th>
                <th>Track</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.icao}>
                  <td>
                    <span className="v3-actable__call">
                      {a.callsign?.trim() || "—"}
                    </span>
                  </td>
                  <td>
                    <span className="v3-actable__icao">{a.icao.toUpperCase()}</span>
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    {cleanName(a.enrich?.owner) || "—"}
                    {a.enrich?.model ? (
                      <span style={{ color: "var(--v3-slate)" }}>
                        {" "}
                        · {cleanName(a.enrich.model)}
                      </span>
                    ) : null}
                  </td>
                  <td>
                    {a.alt_baro != null
                      ? `${a.alt_baro.toLocaleString()}ft`
                      : "—"}
                  </td>
                  <td>
                    {a.speed != null ? `${Math.round(a.speed)}kt` : "—"}
                  </td>
                  <td>
                    {a.track != null ? `${Math.round(a.track)}°` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}

function Registry({ stats }: { stats: RegistryStats | null }) {
  if (!stats) {
    return (
      <article className="v3-panel">
        <div className="v3-panel-head">FAA registry · breakdown</div>
        <div className="v3-empty">registry not loaded</div>
      </article>
    )
  }

  const total = stats.total_aircraft || 1
  const typeMax = Math.max(...Object.values(stats.aircraft_by_type), 1)
  const types = Object.entries(stats.aircraft_by_type).sort(
    (a, b) => b[1] - a[1]
  )
  const mfrs = Object.entries(stats.top_manufacturers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  return (
    <article className="v3-panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div className="v3-panel-head" style={{ marginBottom: 0 }}>
          FAA registry · breakdown
        </div>
        <div
          style={{
            fontFamily: "var(--font-v3-mono), monospace",
            fontSize: 11,
            color: "var(--v3-slate)",
          }}
        >
          {total.toLocaleString()} aircraft on file
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-v3-mono), monospace",
              fontSize: 10.5,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--v3-slate)",
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            By type
          </div>
          {types.map(([name, count], i) => {
            const variantMod =
              i === 0 ? "" : i === 1 ? " v3-rb__fill--coral" : i === 2 ? " v3-rb__fill--gold" : " v3-rb__fill--green"
            return (
              <div key={name} className="v3-rb">
                <div className="v3-rb__head">
                  <span className="v3-rb__lbl">{name}</span>
                  <span className="v3-rb__count">{count.toLocaleString()}</span>
                </div>
                <div className="v3-rb__track">
                  <div
                    className={`v3-rb__fill${variantMod}`}
                    style={{ width: `${(count / typeMax) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div>
          <div
            style={{
              fontFamily: "var(--font-v3-mono), monospace",
              fontSize: 10.5,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--v3-slate)",
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            Top manufacturers
          </div>
          {mfrs.map(([name, count]) => (
            <div
              key={name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "8px 0",
                borderBottom: "1px solid var(--v3-line)",
                fontFamily: "var(--font-v3-mono), monospace",
                fontSize: 12,
              }}
            >
              <span
                className="v3-font-display"
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: "var(--v3-charcoal)",
                  letterSpacing: "-0.005em",
                }}
              >
                {fmtMfr(name)}
              </span>
              <span style={{ color: "var(--v3-slate)" }}>
                {count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

function Predictor({ status }: { status: PredictStatus | null }) {
  return (
    <article className="v3-panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div className="v3-panel-head" style={{ marginBottom: 0 }}>
          Trajectory predictor
        </div>
        {status ? (
          <span
            className={`v3-live ${status.model_loaded ? "v3-live--ok" : "v3-live--err"}`}
            style={{ fontSize: 10.5 }}
          >
            <span className="v3-live__dot" aria-hidden />
            {status.model_loaded ? "model loaded" : "model offline"}
          </span>
        ) : null}
      </div>
      {!status ? (
        <div className="v3-empty">predictor status not loaded</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
          }}
        >
          {[
            {
              lbl: "Model version",
              val: status.model_meta?.model_version ?? "—",
              sub: status.model_meta?.trained_at?.slice(0, 10) ?? "",
            },
            {
              lbl: "Bucket / geohash",
              val: status.model_meta
                ? `${status.model_meta.bucket_minutes}m · p${status.model_meta.geohash_precision}`
                : "—",
              sub: "",
            },
            {
              lbl: "Recent rows",
              val: status.cache_stats?.recent_aircraft_rows?.toLocaleString() ?? "—",
              sub: `cache age ${
                status.cache_stats?.age_seconds
                  ? fmtAge(status.cache_stats.age_seconds)
                  : "—"
              }`,
            },
            {
              lbl: "Predictions served",
              val: status.metrics?.predictions_served?.toLocaleString() ?? "—",
              sub: `bbox: ${status.metrics?.predictions_bbox_served?.toLocaleString() ?? "—"}`,
            },
            {
              lbl: "Misses",
              val: status.metrics?.missing_cache?.toLocaleString() ?? "—",
              sub: `errors ${status.metrics?.errors ?? 0}`,
            },
            {
              lbl: "Geohash cells",
              val: status.cache_stats?.geohash_metadata_cells?.toLocaleString() ?? "—",
              sub: `historical ${status.cache_stats?.historical_patterns_rows?.toLocaleString() ?? "—"}`,
            },
          ].map((s) => (
            <div
              key={s.lbl}
              style={{
                padding: "14px 16px",
                background: "var(--v3-cloud)",
                border: "1px solid var(--v3-line)",
                borderRadius: "var(--v3-r-md)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 10.5,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--v3-slate)",
                  fontWeight: 700,
                }}
              >
                {s.lbl}
              </div>
              <div
                className="v3-font-display"
                style={{
                  fontWeight: 800,
                  fontSize: 20,
                  color: "var(--v3-blue-700)",
                  marginTop: 4,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                  wordBreak: "break-all",
                }}
              >
                {s.val}
              </div>
              {s.sub ? (
                <div
                  style={{
                    fontFamily: "var(--font-v3-mono), monospace",
                    fontSize: 10.5,
                    color: "var(--v3-slate)",
                    marginTop: 2,
                  }}
                >
                  {s.sub}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

export function V3DragonfliDashboard() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [receiver, setReceiver] = useState<ReceiverFix | null>(null)
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [registry, setRegistry] = useState<RegistryStats | null>(null)
  const [predict, setPredict] = useState<PredictStatus | null>(null)
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()

    const loadFast = async () => {
      try {
        const [h, r, a] = await Promise.all([
          getHealth(ctrl.signal),
          getReceiver(ctrl.signal),
          getActive(ctrl.signal),
        ])
        if (!mounted) return
        setHealth(h)
        setReceiver(r)
        setAircraft(a.aircraft)
        setError(false)
        setLastUpdated(Date.now())
      } catch {
        if (mounted) setError(true)
      }
    }

    const loadSlow = async () => {
      try {
        const [rs, ps] = await Promise.all([
          getRegistryStats(ctrl.signal),
          getPredictStatus(ctrl.signal),
        ])
        if (!mounted) return
        setRegistry(rs)
        setPredict(ps)
      } catch {
        /* handled by loadFast */
      }
    }

    loadFast()
    loadSlow()
    const fast = setInterval(loadFast, 5_000)
    const slow = setInterval(loadSlow, 60_000)

    return () => {
      mounted = false
      ctrl.abort()
      clearInterval(fast)
      clearInterval(slow)
    }
  }, [])

  const isOk = !error && health != null
  const rxStale = receiver?.is_stale ?? true
  const updatedLabel = lastUpdated
    ? `updated ${fmtAge((Date.now() - lastUpdated) / 1000)}`
    : "loading…"

  const counters = [
    {
      lbl: "Active aircraft",
      val: health?.n_aircraft_active?.toLocaleString() ?? "—",
      color: "var(--v3-blue-700)",
    },
    {
      lbl: "Events received",
      val: health?.received?.toLocaleString() ?? "—",
      color: "var(--v3-coral-dk)",
    },
    {
      lbl: "Parse errors",
      val: health?.parse_errors?.toLocaleString() ?? "—",
      color:
        health && health.parse_errors > 0
          ? "var(--v3-coral-dk)"
          : "var(--v3-green-dk)",
    },
    {
      lbl: "Uptime",
      val: health ? fmtUptime(health.uptime_s) : "—",
      color: "var(--v3-gold-dk)",
    },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* STATUS + STATS BAR ============================================== */}
      <article
        className="v3-panel"
        style={{
          background:
            "linear-gradient(135deg, var(--v3-white) 0%, var(--v3-paper) 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div className={`v3-live ${isOk ? "v3-live--ok" : "v3-live--err"}`}>
            <span className="v3-live__dot" aria-hidden />
            {isOk
              ? `dragonfli · ${health!.status} · rx ${
                  rxStale ? "stale" : "fresh"
                }`
              : "offline · upstream unreachable"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-v3-mono), monospace",
              fontSize: 11,
              color: "var(--v3-slate)",
            }}
          >
            {updatedLabel}
            {health?.last_event_age_s != null
              ? ` · last event ${fmtAge(health.last_event_age_s)}`
              : ""}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 0,
          }}
        >
          {counters.map((s) => (
            <div key={s.lbl} style={{ textAlign: "center", padding: "12px 8px" }}>
              <div
                className="v3-font-display"
                style={{
                  fontWeight: 800,
                  fontSize: 28,
                  letterSpacing: "-0.025em",
                  color: s.color,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.val}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 10.5,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--v3-slate)",
                  marginTop: 4,
                }}
              >
                {s.lbl}
              </div>
            </div>
          ))}
        </div>

        {receiver ? (
          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: "1px dashed var(--v3-line)",
              display: "flex",
              flexWrap: "wrap",
              gap: 18,
              fontFamily: "var(--font-v3-mono), monospace",
              fontSize: 11.5,
              color: "var(--v3-slate)",
            }}
          >
            <span>
              receiver{" "}
              <strong style={{ color: "var(--v3-charcoal)" }}>
                {receiver.lat.toFixed(4)}°, {receiver.lon.toFixed(4)}°
              </strong>
            </span>
            <span>
              alt{" "}
              <strong style={{ color: "var(--v3-charcoal)" }}>
                {Math.round(receiver.alt_msl)}m MSL
              </strong>
            </span>
            <span>
              hdop{" "}
              <strong style={{ color: "var(--v3-charcoal)" }}>
                {receiver.hdop.toFixed(2)}
              </strong>
            </span>
            {receiver.host ? <span>host {receiver.host}</span> : null}
          </div>
        ) : null}
      </article>

      {/* RADAR ========================================================== */}
      <Radar aircraft={aircraft} receiver={receiver} />

      {/* AIRCRAFT TABLE + REGISTRY ====================================== */}
      <AircraftTable aircraft={aircraft} />

      <Registry stats={registry} />

      {/* PREDICTOR ====================================================== */}
      <Predictor status={predict} />

      {/* CTA ============================================================ */}
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
            Build your own
          </div>
          <div
            style={{
              fontFamily: "var(--font-v3-mono), monospace",
              fontSize: 13,
              color: "var(--v3-ink)",
            }}
          >
            Raspberry Pi · 1090 MHz ADS-B receiver · WorldEvent UDP firehose · FAA registry enrichment
          </div>
        </div>
        <a
          href="https://dragonfli.tinymachines.ai/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="v3-btn v3-btn--primary"
          style={{ gap: 6 }}
        >
          API <ExternalLink size={13} strokeWidth={2.25} />
        </a>
      </article>

    </div>
  )
}
