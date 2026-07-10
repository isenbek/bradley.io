"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"

type Row = Record<string, string | number | null>
interface Analytics {
  generated: string
  summary: {
    sessions: number
    turns: number
    tool_calls: number
    input_tokens: number
    output_tokens: number
    cache_read_tokens: number
    cache_creation_tokens: number
    first_ts: string | null
    last_ts: string | null
  }
  by_model: Row[]
  by_tool: Row[]
  by_project: Row[]
  by_host: Row[]
  weekly: Row[]
  daily: Row[]
  hourly: Row[]
  top_sessions: Row[]
}

const nf = new Intl.NumberFormat("en-US")
const n = (v: unknown) => (typeof v === "number" ? nf.format(v) : "—")
function toks(v: unknown): string {
  const x = typeof v === "number" ? v : 0
  if (x >= 1e9) return (x / 1e9).toFixed(2) + "B"
  if (x >= 1e6) return (x / 1e6).toFixed(1) + "M"
  if (x >= 1e3) return (x / 1e3).toFixed(0) + "k"
  return String(x)
}
const shortDate = (s: unknown) =>
  typeof s === "string" ? s.slice(5, 10) : "—" // MM-DD from YYYY-MM-DD

// Minimal SVG column chart — boring on purpose.
function Columns({ data, value, label, color = "var(--v3-blue-600)", height = 90 }: {
  data: Row[]
  value: (r: Row) => number
  label: (r: Row) => string
  color?: string
  height?: number
}) {
  const vals = data.map(value)
  const max = Math.max(1, ...vals)
  const w = 100 / Math.max(1, data.length)
  return (
    <div className="v3-cols" style={{ height }}>
      {data.map((r, i) => {
        const h = (value(r) / max) * 100
        return (
          <div key={i} className="v3-cols__bar" title={`${label(r)} · ${nf.format(value(r))}`}>
            <span style={{ height: `${h}%`, background: color, width: `${Math.min(w * 0.7, 3)}%` }} />
          </div>
        )
      })}
    </div>
  )
}

// Horizontal bar rows (reuses the .v3-freq-row look) for ranked lists.
function BarList({ data, label, value, color = "var(--v3-coral)" }: {
  data: Row[]
  label: (r: Row) => string
  value: (r: Row) => number
  color?: string
}) {
  const max = Math.max(1, ...data.map(value))
  return (
    <div>
      {data.map((r, i) => {
        const v = value(r)
        return (
          <div key={i} className="v3-freq-row">
            <div className="v3-freq-row__head">
              <span className="v3-freq-row__hz">{label(r)}</span>
              <span className="v3-freq-row__n">{nf.format(v)}</span>
            </div>
            <div className="v3-freq-row__track">
              <div className="v3-freq-row__fill" style={{ width: `${Math.max((v / max) * 100, 2)}%`, background: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function V3PilotAnalytics() {
  const [d, setD] = useState<Analytics | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    fetch("/api/pilot-analytics", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setD)
      .catch(() => setErr(true))
  }, [])

  if (err) return <div className="v3-empty">analytics not built yet: run scripts/claude-activity-viz.py</div>
  if (!d) return <div className="v3-empty">loading…</div>

  const s = d.summary
  const stats = [
    { lbl: "Sessions", val: n(s.sessions), color: "var(--v3-blue-700)" },
    { lbl: "Turns", val: n(s.turns), color: "var(--v3-coral-dk)" },
    { lbl: "Tool calls", val: n(s.tool_calls), color: "var(--v3-green-dk)" },
    { lbl: "Output tok", val: toks(s.output_tokens), color: "var(--v3-gold-dk)" },
    { lbl: "Input tok", val: toks(s.input_tokens), color: "var(--v3-blue-700)" },
    { lbl: "Cache read", val: toks(s.cache_read_tokens), color: "var(--v3-slate)" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* SUMMARY */}
      <article className="v3-panel" style={{ background: "linear-gradient(135deg, var(--v3-white) 0%, var(--v3-paper) 100%)" }}>
        <div className="v3-cardhead" style={{ marginBottom: 14 }}>
          <div className="v3-panel-head" style={{ marginBottom: 0 }}>Overview</div>
          <div className="v3-cardhead__meta">
            {shortDate(s.first_ts?.slice(0, 10))}…{s.last_ts?.slice(0, 10)} · updated {d.generated.slice(0, 16).replace("T", " ")}
          </div>
        </div>
        <div className="v3-statgrid">
          {stats.map((x) => (
            <div key={x.lbl} className="v3-statgrid__cell">
              <div className="v3-statgrid__val" style={{ color: x.color }}>{x.val}</div>
              <div className="v3-statgrid__lbl">{x.lbl}</div>
            </div>
          ))}
        </div>
      </article>

      {/* WEEKLY CADENCE */}
      <article className="v3-panel">
        <div className="v3-panel-head">Assistant turns · by week</div>
        <Columns data={d.weekly} value={(r) => Number(r.turns) || 0} label={(r) => String(r.week)} />
        <div className="v3-cols__axis">
          <span>{shortDate(d.weekly[0]?.week)}</span>
          <span>{shortDate(d.weekly[d.weekly.length - 1]?.week)}</span>
        </div>
      </article>

      {/* MODEL + TOOLS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
        <article className="v3-panel">
          <div className="v3-panel-head">By model</div>
          <table className="v3-tbl">
            <thead><tr><th>model</th><th>turns</th><th>out</th><th>in</th></tr></thead>
            <tbody>
              {d.by_model.map((r, i) => (
                <tr key={i}>
                  <td>{String(r.model)}</td>
                  <td>{n(r.turns)}</td>
                  <td>{toks(r.out_tokens)}</td>
                  <td>{toks(r.in_tokens)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
        <article className="v3-panel">
          <div className="v3-panel-head">Top tools</div>
          <BarList data={d.by_tool.slice(0, 12)} label={(r) => String(r.tool_name)} value={(r) => Number(r.calls) || 0} />
        </article>
      </div>

      {/* PROJECTS */}
      <article className="v3-panel">
        <div className="v3-panel-head">By project · top 30</div>
        <div style={{ overflowX: "auto" }}>
          <table className="v3-tbl">
            <thead><tr><th>project</th><th>sessions</th><th>asst turns</th><th>output tok</th></tr></thead>
            <tbody>
              {d.by_project.map((r, i) => (
                <tr key={i}>
                  <td>{String(r.project)}</td>
                  <td>{n(r.sessions)}</td>
                  <td>{n(r.asst_turns)}</td>
                  <td>{toks(r.out_tokens)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {/* HOURLY */}
      <article className="v3-panel">
        <div className="v3-panel-head">Activity by hour (UTC)</div>
        <Columns data={d.hourly} value={(r) => Number(r.turns) || 0} label={(r) => `${r.hour}:00`} color="var(--v3-green-dk)" />
        <div className="v3-cols__axis"><span>00</span><span>12</span><span>23</span></div>
      </article>

      {/* TOP SESSIONS */}
      <article className="v3-panel">
        <div className="v3-panel-head">Heaviest sessions · by output tokens</div>
        <div style={{ overflowX: "auto" }}>
          <table className="v3-tbl">
            <thead><tr><th>started</th><th>project</th><th>host</th><th>dur (m)</th><th>turns</th><th>tools</th><th>out</th></tr></thead>
            <tbody>
              {d.top_sessions.map((r, i) => (
                <tr key={i}>
                  <td>{String(r.started)}</td>
                  <td>{String(r.project)}</td>
                  <td>{String(r.host)}</td>
                  <td>{n(r.duration_min)}</td>
                  <td>{n(r.turns)}</td>
                  <td>{n(r.tool_calls)}</td>
                  <td>{toks(r.output_tokens)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {/* DOWNLOAD */}
      <article className="v3-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="v3-panel-head" style={{ marginBottom: 4 }}>Raw export</div>
          <div className="v3-font-mono" style={{ fontSize: 13, color: "var(--v3-ink)" }}>
            Parquet bundle (turns · tool_calls · sessions) for offline analysis
          </div>
        </div>
        <a href="/api/pilot-analytics/download" className="v3-btn v3-btn--coral" style={{ gap: 6 }}>
          <Download size={14} strokeWidth={2.25} /> claude-activity-export.zip
        </a>
      </article>
    </div>
  )
}
