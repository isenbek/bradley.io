"use client"

import { useEffect, useMemo, useState } from "react"
import { ExternalLink } from "lucide-react"
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
} from "@/components/sdr"

function fmtFreq(hz: number | null | undefined): string {
  if (hz == null) return "—"
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(3)} GHz`
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(3)} MHz`
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(2)} kHz`
  return `${hz} Hz`
}

function fmtTimeAgo(iso: string | null | undefined): string {
  if (!iso) return "—"
  const t = new Date(iso).getTime()
  const diff = Date.now() - t
  if (diff < 60_000) return "just now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

function jobStatusClass(status: string): string {
  const s = status?.toLowerCase() ?? ""
  if (s.includes("run")) return "v3-job__status--running"
  if (s.includes("done") || s.includes("complete") || s.includes("ok")) return "v3-job__status--done"
  if (s.includes("fail") || s.includes("error")) return "v3-job__status--failed"
  if (s.includes("queue") || s.includes("pending")) return "v3-job__status--queued"
  return "v3-job__status--other"
}

export function V3SdrDashboard() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [bands, setBands] = useState<Band[]>([])
  const [soak, setSoak] = useState<SoakBand[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [channels, setChannels] = useState<FleetChannels | null>(null)
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  // Selected soak band for top-frequencies panel
  const [selectedBand, setSelectedBand] = useState<string | null>(null)
  const [summary, setSummary] = useState<SoakSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Poll every 30s
  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()

    const safe = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        return await fn()
      } catch {
        return null
      }
    }

    const load = async () => {
      const h = await safe(() => getHealth(ctrl.signal))
      const b = await safe(() => getBands(ctrl.signal))
      const s = await safe(() => getSoak(ctrl.signal))
      const j = await safe(() => getJobs(ctrl.signal))
      // fleet/channels is a light aggregate; the other /fleet/* endpoints are
      // heavy and can 504, so we only pull channels here and hide the panel if
      // it ever fails to land.
      const c = await safe(() => getFleetChannels(ctrl.signal))
      if (!mounted) return
      if (h) setHealth(h)
      if (b) setBands(b)
      if (s) setSoak(s)
      if (j) setJobs(j)
      if (c) setChannels(c)
      setError(h === null)
      setLastUpdated(Date.now())
    }

    load()
    const id = setInterval(load, 30_000)
    return () => {
      mounted = false
      ctrl.abort()
      clearInterval(id)
    }
  }, [])

  // Auto-pick top soak band
  useEffect(() => {
    if (!selectedBand && soak.length > 0) {
      const top = [...soak].sort((a, b) => b.n_hits - a.n_hits)[0]
      setSelectedBand(top.band)
    }
  }, [soak, selectedBand])

  // Fetch summary when selectedBand changes
  useEffect(() => {
    if (!selectedBand) return
    const ctrl = new AbortController()
    let mounted = true
    setSummaryLoading(true)
    getSoakSummary(selectedBand, ctrl.signal)
      .then((s) => mounted && setSummary(s))
      .catch(() => mounted && setSummary(null))
      .finally(() => mounted && setSummaryLoading(false))
    return () => {
      mounted = false
      ctrl.abort()
    }
  }, [selectedBand])

  const totalHits = useMemo(() => soak.reduce((s, b) => s + b.n_hits, 0), [soak])
  const enabledBands = bands.filter((b) => b.enabled).length
  const runningJobs = jobs.filter((j) => /run/i.test(j.status)).length
  const recentJobs = useMemo(() => {
    return [...jobs]
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
      .slice(0, 10)
  }, [jobs])

  const topByHits = useMemo(() => [...soak].sort((a, b) => b.n_hits - a.n_hits), [soak])
  const maxFreqHit = summary?.top?.[0]?.n ?? 1

  // Zigbee 802.15.4 channel occupancy across the collector fleet
  const channelRows = useMemo(() => {
    const g = channels?.channels_global ?? {}
    const rows = Object.entries(g)
      .map(([ch, count]) => ({ ch: Number(ch), count }))
      .filter((r) => Number.isFinite(r.ch) && r.count > 0)
      .sort((a, b) => a.ch - b.ch)
    const max = Math.max(1, ...rows.map((r) => r.count))
    const total = rows.reduce((s, r) => s + r.count, 0)
    return { rows, max, total }
  }, [channels])
  const activeChannels = useMemo(
    () => [...(channels?.active_channels_global ?? [])].sort((a, b) => a - b),
    [channels]
  )
  const activeSet = useMemo(() => new Set(activeChannels), [activeChannels])
  const channelNodes = channels ? Object.keys(channels.channels_per_node ?? {}).length : 0

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
        <div className="v3-cardhead" style={{ marginBottom: 18 }}>
          <div
            className={`v3-live ${
              error || !health ? "v3-live--err" : "v3-live--ok"
            }`}
          >
            <span className="v3-live__dot" aria-hidden />
            {error || !health
              ? "offline"
              : `sdr-api · ${health.status} · db ${health.db}`}
          </div>
          <div className="v3-cardhead__meta">
            {lastUpdated
              ? `updated ${fmtTimeAgo(new Date(lastUpdated).toISOString())}`
              : "loading…"}
            {health?.version ? ` · v${health.version}` : ""}
          </div>
        </div>

        <div className="v3-statgrid">
          {[
            { lbl: "Total hits", val: totalHits.toLocaleString(), color: "var(--v3-coral-dk)" },
            { lbl: "Soak bands", val: soak.length, color: "var(--v3-blue-700)" },
            { lbl: "Bands enabled", val: `${enabledBands}/${bands.length}`, color: "var(--v3-green-dk)" },
            { lbl: "Jobs running", val: `${runningJobs}/${jobs.length}`, color: "var(--v3-gold-dk)" },
          ].map((s) => (
            <div key={s.lbl} className="v3-statgrid__cell">
              <div className="v3-statgrid__val" style={{ color: s.color }}>
                {s.val}
              </div>
              <div className="v3-statgrid__lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </article>

      {/* TOP FREQUENCIES ================================================ */}
      <article className="v3-panel">
        <div className="v3-cardhead" style={{ marginBottom: 12 }}>
          <div>
            <div className="v3-panel-head" style={{ marginBottom: 0 }}>
              Top frequencies
            </div>
            {summary ? (
              <div
                className="v3-cardhead__meta"
                style={{ marginTop: 4 }}
              >
                {summary.n_hits.toLocaleString()} hits · first{" "}
                {new Date(summary.time_range.first).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </div>
            ) : null}
          </div>

          {soak.length > 0 ? (
            <div className="v3-bandsel">
              {soak.map((b) => (
                <button
                  key={b.band}
                  type="button"
                  data-active={selectedBand === b.band}
                  onClick={() => setSelectedBand(b.band)}
                >
                  {b.band}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {summaryLoading && !summary ? (
          <div className="v3-empty">loading…</div>
        ) : summary && summary.top.length > 0 ? (
          <div>
            {summary.top.map((h, i) => {
              const pct = (h.n / maxFreqHit) * 100
              return (
                <div key={`${h.freq_hz}-${i}`} className="v3-freq-row">
                  <div className="v3-freq-row__head">
                    <span className="v3-freq-row__hz">{fmtFreq(h.freq_hz)}</span>
                    <span className="v3-freq-row__n">
                      {h.n.toLocaleString()} hits
                    </span>
                  </div>
                  <div className="v3-freq-row__track">
                    <div
                      className="v3-freq-row__fill"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="v3-empty">no data</div>
        )}
      </article>

      {/* ZIGBEE CHANNEL OCCUPANCY (802.15.4) ============================ */}
      {channels && channelRows.rows.length > 0 ? (
        <article className="v3-panel">
          <div style={{ marginBottom: 12 }}>
            <div className="v3-panel-head" style={{ marginBottom: 4 }}>
              Zigbee channel occupancy
            </div>
            <div
              style={{
                fontFamily: "var(--font-v3-mono), monospace",
                fontSize: 11,
                color: "var(--v3-slate)",
              }}
            >
              802.15.4 · {channelNodes} node{channelNodes === 1 ? "" : "s"} ·{" "}
              {channelRows.total.toLocaleString()} frames
              {activeChannels.length
                ? ` · active ${activeChannels.join(" · ")}`
                : ""}
            </div>
          </div>

          {channelRows.rows.map((r) => {
            const pct = (r.count / channelRows.max) * 100
            const active = activeSet.has(r.ch)
            return (
              <div key={r.ch} className="v3-freq-row">
                <div className="v3-freq-row__head">
                  <span className="v3-freq-row__hz">
                    ch {r.ch}
                    {active ? (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 9.5,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--v3-green-dk)",
                        }}
                      >
                        active
                      </span>
                    ) : null}
                  </span>
                  <span className="v3-freq-row__n">
                    {r.count.toLocaleString()} frames
                  </span>
                </div>
                <div className="v3-freq-row__track">
                  <div
                    className="v3-freq-row__fill"
                    style={{
                      width: `${Math.max(pct, 2)}%`,
                      opacity: active ? 1 : 0.4,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </article>
      ) : null}

      {/* SOAK ARCHIVE + JOB HISTORY (two cols) ========================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 22,
        }}
      >
        <article className="v3-panel">
          <div className="v3-panel-head">Soak archive · by band</div>
          {topByHits.length === 0 ? (
            <div className="v3-empty">no soak data</div>
          ) : (
            <div>
              {topByHits.map((b) => (
                <div key={b.band} className="v3-soak">
                  <div>
                    <div className="v3-soak__band">{b.band}</div>
                    <div className="v3-soak__meta">
                      {b.dates.length} {b.dates.length === 1 ? "day" : "days"} ·{" "}
                      first {fmtShortDate(b.first_seen)} · last{" "}
                      {fmtShortDate(b.last_seen)}
                    </div>
                    {b.dates.length > 0 ? (
                      <div className="v3-soak__dates">
                        {b.dates.slice(-6).map((d) => (
                          <span key={d} className="v3-soak__date">
                            {fmtShortDate(d)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <div className="v3-soak__hits">{b.n_hits.toLocaleString()}</div>
                    <div className="v3-soak__hits-lbl">hits</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="v3-panel">
          <div className="v3-panel-head">Job history · last 10</div>
          {recentJobs.length === 0 ? (
            <div className="v3-empty">no jobs</div>
          ) : (
            <div>
              {recentJobs.map((j) => (
                <div key={j.id} className="v3-job">
                  <div>
                    <div className="v3-job__name">{j.name}</div>
                    <div className="v3-job__meta">
                      <span>{j.scanner}</span>
                      {j.duration_s ? <span>· {j.duration_s}s</span> : null}
                      {j.created_at ? (
                        <span>· {fmtTimeAgo(j.created_at)}</span>
                      ) : null}
                      {j.exit_code != null ? <span>· exit {j.exit_code}</span> : null}
                    </div>
                  </div>
                  <span className={`v3-job__status ${jobStatusClass(j.status)}`}>
                    {j.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      {/* BAND REGISTRY ================================================== */}
      <article className="v3-panel">
        <div className="v3-panel-head">Band registry · {bands.length} configured</div>
        {bands.length === 0 ? (
          <div className="v3-empty">no bands</div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {bands.map((b) => (
              <div
                key={b.id}
                className="v3-bandcard"
                data-enabled={b.enabled ? "true" : "false"}
              >
                <span
                  className={`v3-bandcard__pill ${
                    b.enabled ? "v3-bandcard__pill--on" : "v3-bandcard__pill--off"
                  }`}
                >
                  {b.enabled ? "on" : "off"}
                </span>
                <div className="v3-bandcard__name">{b.name}</div>
                <div className="v3-bandcard__scanner">{b.scanner}</div>
                {b.lo_hz != null && b.hi_hz != null ? (
                  <div className="v3-bandcard__freq">
                    {fmtFreq(b.lo_hz)} to {fmtFreq(b.hi_hz)}
                  </div>
                ) : null}
                {b.channels && b.channels.length > 0 ? (
                  <div className="v3-bandcard__channels">
                    {b.channels.length} channel{b.channels.length === 1 ? "" : "s"}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </article>

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
            rtl-sdr · bash + C scanners · systemd templated units · SQLite hit store
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href="https://sdr.tinymachines.ai/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="v3-btn v3-btn--coral"
            style={{ gap: 6 }}
          >
            API <ExternalLink size={13} strokeWidth={2.25} />
          </a>
          <a
            href="https://github.com/tinymachines/sdr"
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
