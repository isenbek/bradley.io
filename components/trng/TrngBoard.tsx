"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  getBattery,
  getContinuous,
  getHealth,
  getLatestMetric,
  getStats,
  type BatteryRow,
  type ContinuousHealth,
  type HealthResponse,
  type MetricRow,
  type StatsResponse,
} from "@/components/trng"

/**
 * Hotbits, on the style kit.
 *
 * The whole page is machine output, so it is all panel. The only paper is the
 * prose in app/trng/page.tsx.
 *
 * ENTROPY IS SCARCE, and that governs what this page is allowed to ask for.
 *
 * /random/* is GONE: it answers 410 now, because the pool refills at ~75
 * bytes/min and the endpoint was open to anyone. Exclusive bytes moved behind a
 * bearer key at hotbits.tinymachines.ai/v1/bytes.
 *
 * So the live sample below comes from /v1/seeds, which is public precisely
 * because it CANNOT drain the pool: it replays real decay data from an
 * append-only stream. The bits are real and they are not exclusive, and the
 * panel says both rather than implying a freshness it does not have.
 */

const POLL_MS = 30_000

function compactBytes(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + " TB"
  if (n >= 1e9) return (n / 1e9).toFixed(2) + " GB"
  if (n >= 1e6) return (n / 1e6).toFixed(2) + " MB"
  if (n >= 1e3) return (n / 1e3).toFixed(2) + " KB"
  return `${n} B`
}

/** Battery verdict as one of the kit's three tag states. */
function batteryTag(r: BatteryRow): "live" | "warn" | "fail" {
  if (r.total_failures > 0) return "fail"
  if (r.practrand_anomalies > 1) return "warn"
  return "live"
}

const num = (n: number | undefined | null, d = 0) =>
  n === undefined || n === null ? "-" : n.toLocaleString(undefined, {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })

export function TrngBoard() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [metric, setMetric] = useState<MetricRow | null>(null)
  const [cont, setCont] = useState<ContinuousHealth | null>(null)
  const [battery, setBattery] = useState<BatteryRow[]>([])
  const [seeds, setSeeds] = useState<number[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const seedsAsked = useRef(false)

  useEffect(() => {
    const ac = new AbortController()

    const poll = async () => {
      try {
        const [h, s, m, c, b] = await Promise.allSettled([
          getHealth(ac.signal),
          getStats(ac.signal),
          getLatestMetric(ac.signal),
          getContinuous(ac.signal),
          getBattery(30, ac.signal),
        ])
        if (ac.signal.aborted) return
        if (h.status === "fulfilled") setHealth(h.value)
        if (s.status === "fulfilled") setStats(s.value)
        // /metrics/latest wraps the row: { row: MetricRow | null }
        if (m.status === "fulfilled") setMetric(m.value?.row ?? null)
        if (c.status === "fulfilled") setCont(c.value)
        if (b.status === "fulfilled") setBattery(b.value?.rows ?? [])
        // Only a total failure is an error. A single endpoint being down
        // should grey out its own panel, not blank the page.
        setErr(
          [h, s, m, c, b].every((r) => r.status === "rejected")
            ? "the instrument is not answering"
            : null
        )
      } catch {
        if (!ac.signal.aborted) setErr("the instrument is not answering")
      }
    }

    poll()
    const timer = setInterval(poll, POLL_MS)

    // Once, ever. Replayed seeds cannot drain the pool, but there is still no
    // reason to re-ask for a sample nobody is watching change.
    if (!seedsAsked.current) {
      seedsAsked.current = true
      fetch("/api/trng/v1/seeds", { signal: ac.signal, cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => !ac.signal.aborted && setSeeds(d?.seeds ?? null))
        .catch(() => {
          /* the sample is a nicety; its absence is not an error */
        })
    }

    return () => {
      ac.abort()
      clearInterval(timer)
    }
  }, [])

  const online = health?.healthy ?? false
  const poolPct = useMemo(() => {
    if (!stats?.fresh_bytes || !stats?.low_water_bytes) return null
    return Math.min(100, (stats.fresh_bytes / (stats.low_water_bytes * 4)) * 100)
  }, [stats])

  // Quality measures, each against the value a perfect source would give.
  const quality = metric
    ? [
        { label: "Entropy", value: metric.ent_bpb, target: 8, unit: " bpb", d: 4 },
        { label: "Ones", value: metric.ones_pct, target: 50, unit: "%", d: 3 },
        { label: "Bias", value: metric.bias, target: 0, unit: "", d: 5 },
        { label: "Chi-square", value: metric.chi_pct, target: 50, unit: "%", d: 2 },
        { label: "Serial correlation", value: metric.lag1_bits, target: 0, unit: "", d: 5 },
      ]
    : []

  const batteryRows = battery.slice(0, 10)

  if (err && !stats && !health) {
    return (
      <div className="notice fail">
        <b>The instrument is not answering.</b> The Geiger counter and its API run on separate
        hardware; this page reads them over the network, so this means the link or the daemon is
        down, not that the source stopped decaying.
      </div>
    )
  }

  return (
    <>
      <div className="prose beta-sec">
        <h2>The source</h2>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Geiger daemon</b>
            <span>
              <span className={`tag ${online ? "live" : "fail"}`}>
                {online ? "healthy" : "unhealthy"}
              </span>
            </span>
          </div>
          <table className="readout">
            <tbody>
              <tr>
                <td>Logger service</td>
                <td className="num">
                  {health?.logger_service_active ? "active" : "stopped"}
                </td>
              </tr>
              <tr>
                <td>Event log age</td>
                <td className="num">{num(health?.events_csv_age_s)} s</td>
              </tr>
              <tr>
                <td>Fresh pool</td>
                <td className="num">{compactBytes(stats?.fresh_bytes ?? 0)}</td>
              </tr>
              <tr>
                <td>Consumed, all time</td>
                <td className="num">{compactBytes(stats?.consumed_bytes ?? 0)}</td>
              </tr>
              <tr>
                <td>Archive</td>
                <td className="num">{compactBytes(stats?.bits_bin_size_bytes ?? 0)}</td>
              </tr>
              <tr>
                <td>Rejection window</td>
                <td className="num">{num(stats?.reject_us)} µs</td>
              </tr>
            </tbody>
          </table>
          {poolPct !== null && (
            <p className="beta-chart__note">
              The pool refills at roughly 3 bytes a second and is drawn down by every request, so
              /random answers 503 rather than blocking when it runs low. Currently{" "}
              {poolPct.toFixed(0)}% of the comfortable mark.
            </p>
          )}
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>Quality</h2>
        <p>
          Measured over the most recent window. Each figure is shown against what a perfect source
          would produce, which is the only thing that makes a number like 7.9998 mean anything.
        </p>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Latest window</b>
            <span>
              {metric ? `${compactBytes(metric.window_bytes)} · ${num(metric.window_deltas)} deltas` : "waiting"}
            </span>
          </div>
          {quality.length ? (
            <table className="readout">
              <tbody>
                {quality.map((q) => (
                  <tr key={q.label}>
                    <td>{q.label}</td>
                    <td className="num">
                      {num(q.value, q.d)}
                      {q.unit}
                    </td>
                    <td className="num" style={{ color: "var(--color-glass-muted)" }}>
                      ideal {num(q.target, q.target === 0 ? 0 : 0)}
                      {q.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="quiet">waiting for the first metric window…</p>
          )}
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>Continuous health</h2>
        <p>
          NIST SP 800-90B runs two tests on every sample as it arrives: a repetition count, and an
          adaptive proportion test over a sliding window. Either one failing means the source is
          producing something other than noise, and the bits are discarded.
        </p>
      </div>

      {cont?.available ? (
        <div className="panel">
          <div className="panel-face">
            <div className="panel-bar">
              <b>800-90B</b>
              <span>{num(cont.total_bits_processed)} bits processed</span>
            </div>
            <table className="readout">
              <tbody>
                <tr>
                  <td>
                    Repetition count{" "}
                    <span className={`tag ${cont.rct.failed_ever ? "fail" : "live"}`}>
                      {cont.rct.failed_ever ? "failed" : "passing"}
                    </span>
                  </td>
                  <td className="num">
                    {num(cont.rct.max_run_seen)} / {num(cont.rct.cutoff)}
                  </td>
                </tr>
                <tr>
                  <td>
                    Adaptive proportion{" "}
                    <span className={`tag ${cont.apt.failed_ever ? "fail" : "live"}`}>
                      {cont.apt.failed_ever ? "failed" : "passing"}
                    </span>
                  </td>
                  <td className="num">
                    {num(cont.apt.position_in_window)} / {num(cont.apt.window_size)}
                  </td>
                </tr>
                <tr>
                  <td>Failures, last 24h</td>
                  <td className="num">{num(cont.fails_last_24h)}</td>
                </tr>
              </tbody>
            </table>
            <p className="beta-chart__note">
              Max run seen against the cutoff: the first number is the longest identical run the
              source has ever produced, the second is where the test calls it broken. These are
              all-time marks, so a repetition-count tag reading &ldquo;failed&rdquo; means it tripped at
              some point over {num(cont.total_bits_processed)} bits, not that it is failing now.
              The current run is {num(cont.rct.current_run_length)}.
            </p>
          </div>
        </div>
      ) : (
        <p className="quiet">no continuous-health snapshot</p>
      )}

      <div className="prose beta-sec">
        <h2>Test batteries</h2>
        <p>
          Longer runs of PractRand, Rabbit and Alphabit over archived output. These take hours and
          are run periodically rather than continuously.
        </p>
      </div>

      {batteryRows.length ? (
        <div className="ledger">
          <div className="scroller" tabIndex={0} role="region" aria-label="Battery history">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th className="num">Bits</th>
                  <th className="num">Entropy</th>
                  <th className="num">PractRand</th>
                  <th className="num">Rabbit</th>
                  <th className="num">Alphabit</th>
                  <th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {batteryRows.map((r) => (
                  <tr key={r.ts_iso}>
                    <td className="name">{r.ts_iso.slice(0, 16).replace("T", " ")}</td>
                    <td className="num">{compactBytes(r.window_bytes)}</td>
                    <td className="num">{num(r.ent_bpb, 4)}</td>
                    <td className="num">{compactBytes(r.practrand_max_bytes)}</td>
                    <td className="num">
                      {num(r.rabbit_pass)}/{num(r.rabbit_n_stats)}
                    </td>
                    <td className="num">
                      {num(r.alphabit_pass)}/{num(r.alphabit_n_stats)}
                    </td>
                    <td>
                      <span className={`tag ${batteryTag(r)}`}>
                        {r.total_failures > 0
                          ? `${r.total_failures} failed`
                          : r.practrand_anomalies > 1
                            ? `${r.practrand_anomalies} anomalies`
                            : "clean"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="tbl-foot">
              <span>
                {batteryRows.length} of {battery.length} runs
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="quiet">no battery history</p>
      )}

      <div className="prose beta-sec">
        <h2>A live sample</h2>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>From the stream</b>
            <span>replayed, not exclusive</span>
          </div>
          {seeds?.length ? (
            <pre className="beta-bits">
              {seeds.slice(0, 12).map((n) => n.toString(16).padStart(12, "0")).join(" ")}
            </pre>
          ) : (
            <p className="quiet">the seed stream did not answer</p>
          )}
          <p className="beta-chart__note">
            Real decay data, replayed from an append-only stream, so these bytes are not exclusive
            to you and are not drawn from the fresh pool. The endpoint that did hand out exclusive
            bytes was open to anyone and answered 410 by the time it was costing 75 bytes a minute:
            it now needs a key, at hotbits.tinymachines.ai/v1/bytes.
          </p>
        </div>
      </div>

    </>
  )
}
