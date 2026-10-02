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
import {
  InstrumentHead,
  InstrumentNote,
  InstrumentStatus,
  UpstreamSilence,
  When,
  useInstrument,
} from "@/components/kit/InstrumentStatus"
import { NO_MEMORY, upstreamMemory, type UpstreamMemory } from "@/lib/instrument-status"

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
  // The first poll has come back, one way or the other.
  const [asked, setAsked] = useState(false)
  // The latest poll got no answer from any endpoint.
  const [down, setDown] = useState(false)
  // When the instrument was last heard, epoch ms: the time of the newest decay
  // event in the daemon's log when /health says, otherwise the last answer.
  const [heardAt, setHeardAt] = useState<number | null>(null)
  // What the proxy remembers about a box that is not answering.
  const [memory, setMemory] = useState<UpstreamMemory>(NO_MEMORY)
  const seedsAsked = useRef(false)

  useEffect(() => {
    const ac = new AbortController()

    // Once per page, the first time the box is answering. Replayed seeds cannot
    // drain the pool, but there is still no reason to re-ask for a sample nobody
    // is watching change. It is asked from the poll rather than at mount so a
    // board that loaded while the box was down still gets its sample when the
    // box comes back; a failed ask clears the flag and the next poll retries.
    const askSeeds = () => {
      if (seedsAsked.current) return
      seedsAsked.current = true
      fetch("/api/trng/v1/seeds", { signal: ac.signal, cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (ac.signal.aborted) return
          if (Array.isArray(d?.seeds) && d.seeds.length) setSeeds(d.seeds)
          else seedsAsked.current = false
        })
        .catch(() => {
          /* the sample is a nicety; its absence is not an error */
          seedsAsked.current = false
        })
    }

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
        const at = Date.now()
        const results = [h, s, m, c, b]
        // Only a total failure is "down". A single endpoint being out should
        // grey out its own panel, not blank the page.
        const allDown = results.every((r) => r.status === "rejected")
        if (h.status === "fulfilled") {
          setHealth(h.value)
          // events_csv_age_s is how long since the logger wrote a decay event,
          // which is the instrument's own clock rather than the API's.
          const age = h.value?.events_csv_age_s
          setHeardAt(typeof age === "number" && age >= 0 ? at - age * 1000 : at)
        } else if (!allDown) {
          // The box answered something, just not /health.
          setHeardAt(at)
        }
        if (s.status === "fulfilled") setStats(s.value)
        // /metrics/latest wraps the row: { row: MetricRow | null }
        if (m.status === "fulfilled") setMetric(m.value?.row ?? null)
        if (c.status === "fulfilled") setCont(c.value)
        if (b.status === "fulfilled") setBattery(b.value?.rows ?? [])
        setDown(allDown)
        if (!allDown) askSeeds()
        if (allDown) {
          setMemory(
            upstreamMemory(results.map((r) => (r.status === "rejected" ? r.reason : null)))
          )
        }
        setAsked(true)
      } catch {
        if (!ac.signal.aborted) {
          setDown(true)
          setAsked(true)
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

  const inst = useInstrument("geiger", {
    lastHeard: heardAt ?? memory.lastOkMs,
    error: down,
    pending: !asked,
  })
  const notLive = inst.reading !== null && inst.reading.state !== "live"
  const hasData = Boolean(health || stats || metric || cont || battery.length)

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

  // Nothing to show: either the first poll is still out, or the box has never
  // answered this tab. Say which, in the panel, instead of drawing a board of
  // zeros. The poll above keeps running either way, so this resolves itself.
  if (!hasData) {
    return (
      <>
        <div className="prose beta-sec">
          <h2>The source</h2>
        </div>
        <InstrumentHead name="Geiger daemon" status={inst}>
          {!asked ? (
            <InstrumentNote>Asking the Geiger box.</InstrumentNote>
          ) : (
            <InstrumentNote>
              <b>The Geiger box is not answering.</b>{" "}
              <UpstreamSilence status={inst} watchingSinceMs={memory.watchingSinceMs} /> The
              counter and its API run on separate hardware and this page reads them over the
              network, so this means the link or the daemon is down, not that the source stopped
              decaying. This board asks again every 30 seconds and resumes by itself when the box
              answers.
            </InstrumentNote>
          )}
        </InstrumentHead>
      </>
    )
  }

  return (
    <>
      <div className="prose beta-sec">
        <h2>The source</h2>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar beta-inst-bar">
            <b>Geiger daemon</b>
            <span className="beta-inst-tags">
              <InstrumentStatus status={inst} />
              {/* The daemon's own verdict on itself: logger running, event log
                  fresh, pool not empty. Not healthy is a stalled instrument,
                  which is ATTENTION, so it is orange and not red. Shown only
                  when /health actually answered; no answer is not "unhealthy". */}
              {health && !down ? (
                <span className={`tag ${health.healthy ? "live" : "warn"}`}>
                  {health.healthy ? "healthy" : "unhealthy"}
                </span>
              ) : null}
            </span>
          </div>
          {notLive && (
            <InstrumentNote>
              {down ? (
                <>
                  <b>The Geiger box has stopped answering.</b> Every figure on this page is the
                  last one it gave before that
                </>
              ) : (
                <>
                  <b>The daemon is answering, but its decay log has gone quiet.</b> The figures
                  below are real and are older than they look
                </>
              )}
              {inst.lastHeardMs != null ? (
                <>
                  : last heard <When at={inst.lastHeardMs} now={inst.now} />
                </>
              ) : null}
              . This board keeps asking every 30 seconds and resumes by itself.
            </InstrumentNote>
          )}
          {/* A dash, not a zero, for anything that was not read: "0 B" and
              "stopped" are claims, and an endpoint that did not answer makes
              no claim. */}
          <table className="readout">
            <tbody>
              <tr>
                <td>Logger service</td>
                <td className="num">
                  {health ? (health.logger_service_active ? "active" : "stopped") : "-"}
                </td>
              </tr>
              <tr>
                <td>Event log age</td>
                <td className="num">{health ? `${num(health.events_csv_age_s)} s` : "-"}</td>
              </tr>
              <tr>
                <td>Fresh pool</td>
                <td className="num">{stats ? compactBytes(stats.fresh_bytes ?? 0) : "-"}</td>
              </tr>
              <tr>
                <td>Consumed, all time</td>
                <td className="num">{stats ? compactBytes(stats.consumed_bytes ?? 0) : "-"}</td>
              </tr>
              <tr>
                <td>Archive</td>
                <td className="num">{stats ? compactBytes(stats.bits_bin_size_bytes ?? 0) : "-"}</td>
              </tr>
              <tr>
                <td>Rejection window</td>
                <td className="num">{stats ? `${num(stats.reject_us)} µs` : "-"}</td>
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
            <p className="beta-chart__note">
              {down
                ? "no metric window was read before the box stopped answering"
                : "waiting for the first metric window"}
            </p>
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
