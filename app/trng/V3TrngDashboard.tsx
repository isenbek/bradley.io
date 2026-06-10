"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ExternalLink } from "lucide-react"
import {
  getBattery,
  getContinuous,
  getHealth,
  getLatestMetric,
  getRandomHex,
  getStats,
  type BatteryRow,
  type ContinuousHealth,
  type HealthResponse,
  type MetricRow,
  type StatsResponse,
} from "@/components/trng"

function compactBytes(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + " TB"
  if (n >= 1e9) return (n / 1e9).toFixed(2) + " GB"
  if (n >= 1e6) return (n / 1e6).toFixed(2) + " MB"
  if (n >= 1e3) return (n / 1e3).toFixed(2) + " KB"
  return `${n} B`
}

function batteryClass(r: BatteryRow): "pass" | "warn" | "fail" {
  if (r.total_failures > 0) return "fail"
  if (r.practrand_anomalies > 1) return "warn"
  return "pass"
}

interface GaugeProps {
  label: string
  value: number
  target: number
  min: number
  max: number
  decimals?: number
  suffix?: string
  better?: "closer" | "lower" | "higher"
}

function Gauge({
  label,
  value,
  target,
  min,
  max,
  decimals = 3,
  suffix = "",
  better = "closer",
}: GaugeProps) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  const targetPct = Math.max(0, Math.min(100, ((target - min) / (max - min)) * 100))

  const delta = Math.abs(value - target)
  const range = max - min
  const grade: "good" | "ok" | "bad" =
    better === "closer"
      ? delta < range * 0.02
        ? "good"
        : delta < range * 0.08
        ? "ok"
        : "bad"
      : better === "lower"
      ? value < target
        ? "good"
        : value < target * 2
        ? "ok"
        : "bad"
      : value > target
      ? "good"
      : value > target * 0.95
      ? "ok"
      : "bad"

  return (
    <div className="v3-gauge">
      <div className="v3-gauge__head">
        <span>{label}</span>
        <span className="v3-gauge__target">
          target {target}
          {suffix}
        </span>
      </div>
      <div className={`v3-gauge__val v3-gauge__val--${grade}`}>
        {value.toFixed(decimals)}
        {suffix ? <span className="v3-gauge__suffix">{suffix}</span> : null}
      </div>
      <div className="v3-gauge__track">
        <div
          className={`v3-gauge__fill v3-gauge__fill--${grade}`}
          style={{ width: `${pct}%`, top: 0, bottom: 0 }}
        />
        <div className="v3-gauge__target-mark" style={{ left: `${targetPct}%` }} />
      </div>
    </div>
  )
}

function LiveBits() {
  const [hex, setHex] = useState("")
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const ctrl = new AbortController()
    const tick = async () => {
      try {
        const r = await getRandomHex(64, ctrl.signal)
        if (mounted.current) setHex(r.hex)
      } catch {
        /* ignore */
      }
    }
    tick()
    const id = setInterval(tick, 4_000)
    return () => {
      mounted.current = false
      ctrl.abort()
      clearInterval(id)
    }
  }, [])

  return (
    <article className="v3-panel" style={{ padding: 0, overflow: "hidden" }}>
      <div className="v3-bits">
        <div className="v3-bits__head">
          <span>/random/hex · live · refresh 4s</span>
          <span className="v3-live v3-live--ok">
            <span className="v3-live__dot" aria-hidden />
            streaming
          </span>
        </div>
        <div className="v3-bits__stream">
          {hex || "fetching entropy…"}
        </div>
      </div>
    </article>
  )
}

export function V3TrngDashboard() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [metric, setMetric] = useState<MetricRow | null>(null)
  const [cont, setCont] = useState<ContinuousHealth | null>(null)
  const [battery, setBattery] = useState<BatteryRow[]>([])
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()

    const loadFast = async () => {
      try {
        const [h, s, c] = await Promise.all([
          getHealth(ctrl.signal),
          getStats(ctrl.signal),
          getContinuous(ctrl.signal),
        ])
        if (!mounted) return
        setHealth(h)
        setStats(s)
        setCont(c)
        setError(false)
        setLastUpdated(Date.now())
      } catch {
        if (mounted) setError(true)
      }
    }

    const loadSlow = async () => {
      try {
        const [l, b] = await Promise.all([
          getLatestMetric(ctrl.signal),
          getBattery(30, ctrl.signal),
        ])
        if (!mounted) return
        if (l?.row) setMetric(l.row)
        setBattery(b.rows ?? [])
      } catch {
        /* handled by loadFast */
      }
    }

    loadFast()
    loadSlow()
    const fast = setInterval(loadFast, 5_000)
    const slow = setInterval(loadSlow, 30_000)

    return () => {
      mounted = false
      ctrl.abort()
      clearInterval(fast)
      clearInterval(slow)
    }
  }, [])

  const isOk = !error && health?.healthy === true
  const updatedLabel = useMemo(() => {
    if (!lastUpdated) return "loading…"
    const ago = Math.floor((Date.now() - lastUpdated) / 1000)
    return ago < 5 ? "just now" : `updated ${ago}s ago`
  }, [lastUpdated])

  const rctState =
    cont?.rct.failed_ever
      ? "fail"
      : (cont && cont.rct.current_run_length / cont.rct.cutoff > 0.7) ? "warn" : "pass"
  const aptState =
    cont?.apt.failed_ever
      ? "fail"
      : "pass"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* STATUS + COUNTERS ============================================== */}
      <article
        className="v3-panel"
        style={{
          background: "linear-gradient(135deg, var(--v3-white) 0%, var(--v3-paper) 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div className={`v3-live ${isOk ? "v3-live--ok" : "v3-live--err"}`}>
            <span className="v3-live__dot" aria-hidden />
            {isOk
              ? `entropy pool · ${health!.pool_has_bytes ? "filled" : "low"} · csv ${
                  health!.events_csv_fresh ? "fresh" : "stale"
                }`
              : error
              ? "offline · upstream unreachable"
              : "loading…"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-v3-mono), monospace",
              fontSize: 11,
              color: "var(--v3-slate)",
            }}
          >
            {updatedLabel}
            {stats?.reject_us != null ? ` · reject ${stats.reject_us}µs` : ""}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 0,
          }}
        >
          {[
            {
              lbl: "Fresh pool",
              val: stats ? compactBytes(stats.fresh_bytes) : "—",
              color: "var(--v3-green-dk)",
            },
            {
              lbl: "Consumed",
              val: stats ? compactBytes(stats.consumed_bytes) : "—",
              color: "var(--v3-blue-700)",
            },
            {
              lbl: "Total bits",
              val: cont ? compactBytes(cont.total_bits_processed / 8) : "—",
              color: "var(--v3-coral-dk)",
            },
            {
              lbl: "Fails 24h",
              val: cont ? cont.fails_last_24h : "—",
              color:
                cont && cont.fails_last_24h > 0
                  ? "var(--v3-coral-dk)"
                  : "var(--v3-gold-dk)",
            },
          ].map((s) => (
            <div key={s.lbl} style={{ textAlign: "center", padding: "12px 8px" }}>
              <div
                className="v3-font-display"
                style={{
                  fontWeight: 800,
                  fontSize: 28,
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

      {/* QUALITY GAUGES ================================================= */}
      <article className="v3-panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div className="v3-panel-head" style={{ marginBottom: 0 }}>
            Statistical quality
          </div>
          {metric ? (
            <div
              style={{
                fontFamily: "var(--font-v3-mono), monospace",
                fontSize: 11,
                color: "var(--v3-slate)",
              }}
            >
              window · {metric.window_bytes.toLocaleString()} bytes
            </div>
          ) : null}
        </div>
        {metric ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
            }}
          >
            <Gauge
              label="Entropy bpb"
              value={metric.ent_bpb}
              target={8.0}
              min={7.0}
              max={8.0}
              decimals={3}
              better="higher"
            />
            <Gauge
              label="Bias"
              value={Math.abs(metric.bias)}
              target={0}
              min={0}
              max={0.05}
              decimals={4}
              better="lower"
            />
            <Gauge
              label="Ones %"
              value={metric.ones_pct}
              target={50}
              min={48}
              max={52}
              decimals={2}
              suffix="%"
            />
            <Gauge
              label="Pileup"
              value={metric.pileup_pct}
              target={0}
              min={0}
              max={10}
              decimals={2}
              suffix="%"
              better="lower"
            />
          </div>
        ) : (
          <div className="v3-empty">waiting for first metric window…</div>
        )}
      </article>

      {/* NIST CONTINUOUS HEALTH ========================================= */}
      <article className="v3-panel">
        <div className="v3-panel-head">NIST 800-90B continuous health</div>
        {cont && cont.available ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="v3-test" data-state={rctState}>
              <div className="v3-test__icon">RCT</div>
              <div>
                <div className="v3-test__name">Repetition count test</div>
                <div className="v3-test__meta">
                  run {cont.rct.current_run_length} / cutoff {cont.rct.cutoff} · max seen{" "}
                  {cont.rct.max_run_seen}
                </div>
              </div>
              <span
                className={`v3-test__verdict v3-test__verdict--${
                  cont.rct.failed_ever ? "fail" : rctState === "warn" ? "warn" : "pass"
                }`}
              >
                {cont.rct.failed_ever ? "fail" : "pass"}
              </span>
            </div>

            <div className="v3-test" data-state={aptState}>
              <div className="v3-test__icon">APT</div>
              <div>
                <div className="v3-test__name">Adaptive proportion test</div>
                <div className="v3-test__meta">
                  position {cont.apt.position_in_window} / window {cont.apt.window_size} · cutoff{" "}
                  {cont.apt.cutoff} · last [{cont.apt.last_verdict[0]} · {cont.apt.last_verdict[1]}/
                  {cont.apt.last_verdict[2]}]
                </div>
              </div>
              <span
                className={`v3-test__verdict v3-test__verdict--${
                  cont.apt.failed_ever ? "fail" : "pass"
                }`}
              >
                {cont.apt.failed_ever ? "fail" : "pass"}
              </span>
            </div>
          </div>
        ) : (
          <div className="v3-empty">no continuous-health snapshot</div>
        )}
      </article>

      {/* BATTERY HISTORY ================================================ */}
      <article className="v3-panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div className="v3-panel-head" style={{ marginBottom: 0 }}>
            Test battery · last {battery.length || 30}
          </div>
          <div
            style={{
              display: "flex",
              gap: 14,
              fontFamily: "var(--font-v3-mono), monospace",
              fontSize: 11,
              color: "var(--v3-slate)",
            }}
          >
            <span>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: "var(--v3-green)",
                  marginRight: 5,
                  verticalAlign: "middle",
                }}
              />
              pass
            </span>
            <span>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: "var(--v3-gold)",
                  marginRight: 5,
                  verticalAlign: "middle",
                }}
              />
              anomaly
            </span>
            <span>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: "var(--v3-coral)",
                  marginRight: 5,
                  verticalAlign: "middle",
                }}
              />
              fail
            </span>
          </div>
        </div>
        {battery.length === 0 ? (
          <div className="v3-empty">no battery history</div>
        ) : (
          <div className="v3-battery">
            {battery.map((r) => (
              <div
                key={r.ts_iso}
                className={`v3-battery__cell v3-battery__cell--${batteryClass(r)}`}
                title={`${r.ts_iso} · ent ${r.ent_bpb.toFixed(3)} bpb · failures ${r.total_failures}`}
              />
            ))}
          </div>
        )}
      </article>

      {/* LIVE BITS ====================================================== */}
      <LiveBits />

      {/* CTA STRIP ====================================================== */}
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
            CAJOE Geiger counter · Raspberry Pi 4 · Δt₁/Δt₂ comparison · SHA-256 conditioning
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href="https://hotbits.tinymachines.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="v3-btn v3-btn--primary"
            style={{
              background: "var(--v3-green-dk)",
              gap: 6,
            }}
          >
            API <ExternalLink size={13} strokeWidth={2.25} />
          </a>
          <a
            href="https://github.com/tinymachines/geiger"
            target="_blank"
            rel="noopener noreferrer"
            className="v3-btn v3-btn--ghost"
            style={{ gap: 6 }}
          >
            Source <ExternalLink size={13} strokeWidth={2.25} />
          </a>
        </div>
      </article>
    </div>
  )
}
