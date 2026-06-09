"use client"

import { useState } from "react"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  TrendingDown,
  Users,
  Zap,
} from "lucide-react"

interface Role {
  title: string
  count: number
  annualSalary: number
  loadedCost: number
  halfTime?: boolean
}

interface TSEntry {
  week: string
  weekStart: string
  commits: number
  cumulativeCommits: number
  messages: number
  sessions: number
  toolCalls: number
  issuesOpened: number
  issuesClosed: number
  cumulativeIssuesOpened: number
  cumulativeIssuesClosed: number
  cumulativeCostActual: number
  cumulativeCostLegacy: number
}

export interface CostModel {
  generated: string
  scope: string
  timespan: { start: string; end: string; days: number; activeDays: number }
  actual: {
    teamSize: number
    sessions: number
    messages: number
    toolCalls: number
    commits: number
    repos: number
    projects: number
    operatorCost: number
    aiCost: number
    totalCost: number
    domains: { name: string; score: number }[]
    skills: { name: string; count: number }[]
    topProjects: { name: string; sessions: number; messages: number }[]
  }
  legacy: {
    roles: Role[]
    teamSize: number
    estimatedMonths: { low: number; high: number }
    personMonths: { low: number; high: number }
    costPerPersonMonth: number
    totalCost: { low: number; high: number }
    overheadMultiplier: number
  }
  comparison: {
    costSavingsPercent: number
    velocityMultiplier: number
    timeCompression: string
  }
  industryBenchmarks: {
    locPerDevPerDay: { low: number; high: number }
    codingTimePercent: number
    meetingTimePercent: number
    codeReviewPercent: number
    aiProductivityMultiplier: { conservative: number; aggressive: number }
    studies: { source: string; finding: string }[]
  }
  timeSeries: TSEntry[]
  issues: {
    opened: number
    closed: number
    bugs: number
    features: number
    other: number
  }
}

const fmt = (n: number) => n.toLocaleString("en-US")
const fmtK = (n: number) =>
  `$${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 0 })}K`

// --- Smooth SVG line builder ---
function buildSmoothPath(points: { x: number; y: number }[]): string {
  return points.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`
    const prev = points[i - 1]
    const cpx = (prev.x + p.x) / 2
    return `${acc} C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`
  }, "")
}

// --- Cost Curve Chart ---
function CostCurve({ ts }: { ts: TSEntry[] }) {
  const w = 700,
    h = 240,
    padL = 64,
    padR = 70,
    padT = 24,
    padB = 40
  const chartW = w - padL - padR
  const chartH = h - padT - padB
  const n = ts.length

  const lastLegacy = ts[n - 1].cumulativeCostLegacy
  const legacyRate = lastLegacy / n
  const projWeeks = 4
  const totalWeeks = n + projWeeks
  const projectedLegacyMax = lastLegacy + legacyRate * projWeeks
  const maxCost = projectedLegacyMax * 1.15

  const xScale = (i: number) => padL + (i / (totalWeeks - 1)) * chartW
  const yScale = (v: number) => padT + chartH - (v / maxCost) * chartH

  const legacyPoints = Array.from({ length: totalWeeks }, (_, i) => ({
    x: xScale(i),
    y: yScale(i < n ? ts[i].cumulativeCostLegacy : legacyRate * (i + 1)),
  }))
  const actualPoints = ts.map((d, i) => ({
    x: xScale(i),
    y: yScale(d.cumulativeCostActual),
  }))

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: yScale(f * maxCost),
    label: `$${((f * maxCost) / 1000).toFixed(0)}K`,
  }))

  const xLabels = ts
    .filter((_, i) => i % 4 === 0)
    .map((d, i) => ({
      x: xScale(i * 4),
      label: d.week.replace(/^\d{4}-/, ""),
    }))

  const lastActualY = actualPoints[n - 1].y
  const lastLegacyY = legacyPoints[n - 1].y
  const gapMid = (lastActualY + lastLegacyY) / 2
  const savedK = (ts[n - 1].cumulativeCostLegacy - ts[n - 1].cumulativeCostActual) / 1000

  return (
    <article className="v3-panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <DollarSign size={16} strokeWidth={2.25} color="var(--v3-blue-600)" />
          <span
            className="v3-font-display"
            style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.005em" }}
          >
            Cumulative cost over time
          </span>
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
                width: 14,
                height: 3,
                background: "var(--v3-coral)",
                marginRight: 6,
                borderRadius: 2,
                verticalAlign: "middle",
              }}
            />
            Legacy
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 3,
                background: "var(--v3-blue-600)",
                marginRight: 6,
                borderRadius: 2,
                verticalAlign: "middle",
              }}
            />
            AI-assisted
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 240 }}>
        {yTicks.map((t) => (
          <g key={t.label}>
            <line
              x1={padL}
              y1={t.y}
              x2={w - padR}
              y2={t.y}
              stroke="var(--v3-line)"
              strokeWidth="1"
            />
            <text
              x={padL - 8}
              y={t.y + 4}
              textAnchor="end"
              fill="var(--v3-slate)"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
            >
              {t.label}
            </text>
          </g>
        ))}
        {xLabels.map((t) => (
          <text
            key={t.label}
            x={t.x}
            y={h - 12}
            textAnchor="middle"
            fill="var(--v3-slate)"
            fontSize="9.5"
            fontFamily="ui-monospace, monospace"
          >
            {t.label}
          </text>
        ))}
        {/* NOW marker */}
        <line
          x1={xScale(n - 1)}
          y1={padT}
          x2={xScale(n - 1)}
          y2={h - padB}
          stroke="var(--v3-mist)"
          strokeWidth="1"
          strokeDasharray="3,4"
        />
        <text
          x={xScale(n - 1)}
          y={padT - 8}
          textAnchor="middle"
          fill="var(--v3-slate)"
          fontSize="9.5"
          fontFamily="ui-monospace, monospace"
          letterSpacing="0.1em"
        >
          NOW
        </text>
        {/* Legacy curves */}
        <path
          d={buildSmoothPath(legacyPoints.slice(0, n))}
          fill="none"
          stroke="var(--v3-coral)"
          strokeWidth="2.5"
        />
        <path
          d={buildSmoothPath(legacyPoints.slice(n - 1))}
          fill="none"
          stroke="var(--v3-coral)"
          strokeWidth="2"
          strokeDasharray="5,4"
          opacity="0.55"
        />
        {/* Actual */}
        <path
          d={buildSmoothPath(actualPoints)}
          fill="none"
          stroke="var(--v3-blue-600)"
          strokeWidth="2.5"
        />
        {/* End dots */}
        <circle
          cx={actualPoints[n - 1].x}
          cy={lastActualY}
          r="4"
          fill="var(--v3-blue-600)"
        />
        <circle
          cx={legacyPoints[n - 1].x}
          cy={lastLegacyY}
          r="4"
          fill="var(--v3-coral)"
        />
        {/* Gap annotation */}
        <line
          x1={xScale(n - 1) + 12}
          y1={lastActualY}
          x2={xScale(n - 1) + 12}
          y2={lastLegacyY}
          stroke="var(--v3-gold-dk)"
          strokeWidth="2"
        />
        <text
          x={xScale(n - 1) + 20}
          y={gapMid + 4}
          fill="var(--v3-gold-dk)"
          fontSize="12"
          fontWeight="bold"
          fontFamily="ui-monospace, monospace"
        >
          ${savedK.toFixed(0)}K saved
        </text>
      </svg>
    </article>
  )
}

// --- Velocity Chart (commits bars) ---
function VelocityChart({ ts }: { ts: TSEntry[] }) {
  const w = 400,
    h = 180,
    padL = 10,
    padR = 10,
    padT = 12,
    padB = 30
  const chartW = w - padL - padR
  const chartH = h - padT - padB
  const n = ts.length
  const maxCommits = Math.max(...ts.map((d) => d.commits), 1)
  const barW = (chartW / n) * 0.7
  const gap = (chartW / n) * 0.3

  return (
    <article className="v3-panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart3 size={15} strokeWidth={2.25} color="var(--v3-gold-dk)" />
          <span
            className="v3-font-display"
            style={{ fontWeight: 700, fontSize: 14 }}
          >
            Weekly commit velocity
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-v3-mono), monospace",
            fontSize: 10.5,
            color: "var(--v3-slate)",
          }}
        >
          {fmt(ts.reduce((s, d) => s + d.commits, 0))} total
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 180 }}>
        {ts.map((d, i) => {
          const barH = (d.commits / maxCommits) * chartH
          const x = padL + i * (barW + gap)
          const y = padT + chartH - barH
          return (
            <g key={d.week}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx="3"
                fill={d.sessions > 0 ? "var(--v3-blue-600)" : "var(--v3-gold)"}
                opacity={d.sessions > 0 ? 0.9 : 0.55}
              />
              {i % 4 === 0 ? (
                <text
                  x={x + barW / 2}
                  y={h - 10}
                  textAnchor="middle"
                  fill="var(--v3-slate)"
                  fontSize="8.5"
                  fontFamily="ui-monospace, monospace"
                >
                  {d.week.replace(/^\d{4}-/, "")}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 14,
          marginTop: 4,
          fontFamily: "var(--font-v3-mono), monospace",
          fontSize: 10,
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
              background: "var(--v3-blue-600)",
              marginRight: 5,
              verticalAlign: "middle",
            }}
          />
          With Claude
        </span>
        <span>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: 2,
              background: "var(--v3-gold)",
              opacity: 0.55,
              marginRight: 5,
              verticalAlign: "middle",
            }}
          />
          Pre-Claude
        </span>
      </div>
    </article>
  )
}

// --- Issues Chart ---
function IssuesChart({
  ts,
  issues,
}: {
  ts: TSEntry[]
  issues: CostModel["issues"]
}) {
  const w = 400,
    h = 180,
    padL = 10,
    padR = 10,
    padT = 12,
    padB = 30
  const chartW = w - padL - padR
  const chartH = h - padT - padB
  const n = ts.length
  const maxIssues = Math.max(...ts.map((d) => Math.max(d.issuesOpened, d.issuesClosed)), 1)
  const groupW = chartW / n
  const barW = groupW * 0.36

  return (
    <article className="v3-panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={15} strokeWidth={2.25} color="var(--v3-blue-600)" />
          <span
            className="v3-font-display"
            style={{ fontWeight: 700, fontSize: 14 }}
          >
            Issues throughput
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-v3-mono), monospace",
            fontSize: 10.5,
            color: "var(--v3-slate)",
          }}
        >
          {fmt(issues.opened)} opened · {fmt(issues.closed)} closed
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 180 }}>
        {ts.map((d, i) => {
          const openH = (d.issuesOpened / maxIssues) * chartH
          const closeH = (d.issuesClosed / maxIssues) * chartH
          const x = padL + i * groupW
          return (
            <g key={d.week}>
              <rect
                x={x}
                y={padT + chartH - openH}
                width={barW}
                height={openH}
                rx="2"
                fill="var(--v3-blue-500)"
                opacity="0.75"
              />
              <rect
                x={x + barW + 2}
                y={padT + chartH - closeH}
                width={barW}
                height={closeH}
                rx="2"
                fill="var(--v3-green)"
                opacity="0.85"
              />
              {i % 4 === 0 ? (
                <text
                  x={x + groupW / 2}
                  y={h - 10}
                  textAnchor="middle"
                  fill="var(--v3-slate)"
                  fontSize="8.5"
                  fontFamily="ui-monospace, monospace"
                >
                  {d.week.replace(/^\d{4}-/, "")}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 14,
          marginTop: 4,
          fontFamily: "var(--font-v3-mono), monospace",
          fontSize: 10,
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
              background: "var(--v3-blue-500)",
              opacity: 0.75,
              marginRight: 5,
              verticalAlign: "middle",
            }}
          />
          Opened
        </span>
        <span>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: 2,
              background: "var(--v3-green)",
              opacity: 0.85,
              marginRight: 5,
              verticalAlign: "middle",
            }}
          />
          Closed
        </span>
        <span>
          {issues.bugs} bugs · {issues.features} features
        </span>
      </div>
    </article>
  )
}

// --- Time Donut ---
function TimeDonut({
  segments,
  size = 130,
}: {
  segments: { label: string; pct: number; color: string }[]
  size?: number
}) {
  const r = size / 2 - 8
  const c = 2 * Math.PI * r
  let off = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((s) => {
        const dash = (s.pct / 100) * c
        const gap = c - dash
        const thisOff = off
        off += dash
        return (
          <circle
            key={s.label}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-thisOff}
            strokeLinecap="butt"
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "center",
            }}
          />
        )
      })}
    </svg>
  )
}

function RoleRow({ role }: { role: Role }) {
  const monthly = Math.round(role.loadedCost / 12)
  return (
    <div className="v3-role">
      <div className="v3-role__count">
        {role.halfTime ? "½" : role.count > 1 ? `${role.count}×` : "1"}
      </div>
      <div className="v3-role__title">{role.title}</div>
      <div>
        <div className="v3-role__cost">${role.loadedCost.toLocaleString()}/yr</div>
        <div className="v3-role__cost-sub">${monthly.toLocaleString()}/mo</div>
      </div>
    </div>
  )
}

export function V3CostDashboard({ data }: { data: CostModel }) {
  const [showAllRoles, setShowAllRoles] = useState(false)
  const [showStudies, setShowStudies] = useState(false)

  const legacyMid = Math.round(
    (data.legacy.totalCost.low + data.legacy.totalCost.high) / 2
  )
  const actualCost = data.actual.totalCost
  const legacyMonthsMid = Math.round(
    (data.legacy.estimatedMonths.low + data.legacy.estimatedMonths.high) / 2
  )

  const legacyTime = [
    {
      label: "Writing code",
      pct: data.industryBenchmarks.codingTimePercent,
      color: "#13B8F3",
    },
    {
      label: "Meetings",
      pct: data.industryBenchmarks.meetingTimePercent,
      color: "#EE766C",
    },
    {
      label: "Code review",
      pct: data.industryBenchmarks.codeReviewPercent,
      color: "#A855F7",
    },
    { label: "Testing / QA", pct: 15, color: "#EDB427" },
    { label: "Admin / other", pct: 18, color: "#6B6B62" },
  ]

  const aiTime = [
    { label: "Productive output", pct: 85, color: "#13B8F3" },
    { label: "Planning / review", pct: 10, color: "#169E73" },
    { label: "Deploy / ops", pct: 5, color: "#6B6B62" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* HERO 4-UP =================================================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
        }}
      >
        {[
          {
            lbl: "Legacy estimate",
            val: fmtK(legacyMid),
            sub: `${data.legacy.teamSize}-person team · ${legacyMonthsMid} months`,
            color: "var(--v3-coral-dk)",
          },
          {
            lbl: "Actual cost",
            val: `$${fmt(actualCost)}`,
            sub: `$${fmt(data.actual.operatorCost)} ops + $${fmt(data.actual.aiCost)} AI`,
            color: "var(--v3-blue-700)",
          },
          {
            lbl: "Velocity",
            val: `${data.comparison.velocityMultiplier}×`,
            sub: `${data.timespan.activeDays} active days`,
            color: "var(--v3-gold-dk)",
          },
          {
            lbl: "Cost reduction",
            val: `${data.comparison.costSavingsPercent}%`,
            sub: `${fmtK(legacyMid - actualCost)} saved`,
            color: "var(--v3-green-dk)",
          },
        ].map((s) => (
          <div
            key={s.lbl}
            className="v3-cost-stat"
            style={{ ["--v3-cost-color" as string]: s.color }}
          >
            <div className="v3-cost-stat__lbl">{s.lbl}</div>
            <div className="v3-cost-stat__val">{s.val}</div>
            <div className="v3-cost-stat__sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* THE CURVES ================================================== */}
      <section>
        <div className="v3-sec-head" style={{ marginBottom: 24 }}>
          <div className="v3-sec-head__num">01 / LIVE DATA</div>
          <h2 style={{ marginBottom: 8 }}>The curves don&apos;t lie.</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <CostCurve ts={data.timeSeries} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            <VelocityChart ts={data.timeSeries} />
            <IssuesChart ts={data.timeSeries} issues={data.issues} />
          </div>
        </div>
      </section>

      {/* WHAT WAS SHIPPED =========================================== */}
      <section>
        <div className="v3-sec-head" style={{ marginBottom: 24 }}>
          <div className="v3-sec-head__num">02 / OUTPUT</div>
          <h2 style={{ marginBottom: 8 }}>What was shipped.</h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14,
          }}
        >
          {[
            { val: data.actual.projects, lbl: "Projects", color: "var(--v3-blue-700)" },
            { val: data.actual.repos, lbl: "Repositories", color: "var(--v3-coral-dk)" },
            { val: data.actual.commits, lbl: "Commits", color: "var(--v3-gold-dk)" },
            { val: data.actual.sessions, lbl: "Sessions", color: "var(--v3-green-dk)" },
          ].map((s) => (
            <div
              key={s.lbl}
              className="v3-panel"
              style={{ textAlign: "center", padding: "20px 12px" }}
            >
              <div
                className="v3-font-display"
                style={{
                  fontWeight: 800,
                  fontSize: 38,
                  letterSpacing: "-0.025em",
                  color: s.color,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmt(s.val)}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 10.5,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--v3-slate)",
                  marginTop: 6,
                }}
              >
                {s.lbl}
              </div>
            </div>
          ))}
        </div>

        <article className="v3-panel" style={{ marginTop: 16 }}>
          <div className="v3-panel-head">Top Campaign Brain projects</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 8,
            }}
          >
            {data.actual.topProjects.slice(0, 9).map((p) => (
              <div key={p.name} className="v3-topproj">
                <span className="v3-topproj__name">{p.name}</span>
                <span className="v3-topproj__meta">
                  {fmt(p.sessions)}s · {fmt(p.messages)}m
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="v3-panel" style={{ marginTop: 16 }}>
          <div className="v3-panel-head">Domain coverage · one person</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
            }}
          >
            {data.actual.domains.map((d) => (
              <div key={d.name} className="v3-domain">
                <div className="v3-domain__row">
                  <span className="v3-domain__lbl">{d.name}</span>
                  <span className="v3-domain__score">{d.score}</span>
                </div>
                <div className="v3-domain__track">
                  <div
                    className={
                      "v3-domain__fill " +
                      (d.score >= 70
                        ? "v3-domain__fill--hi"
                        : d.score >= 50
                        ? "v3-domain__fill--mid"
                        : "v3-domain__fill--lo")
                    }
                    style={{ width: `${d.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* LEGACY BREAKDOWN =========================================== */}
      <section>
        <div className="v3-sec-head" style={{ marginBottom: 8 }}>
          <div className="v3-sec-head__num">03 / LEGACY MODEL</div>
          <h2 style={{ marginBottom: 8 }}>What this would cost.</h2>
          <p>
            Traditional team needed to ship equivalent output. US market salaries, fully
            loaded ({data.legacy.overheadMultiplier}× base for benefits, taxes, overhead).
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {/* Team roster */}
          <article className="v3-panel">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <Users size={15} strokeWidth={2.25} color="var(--v3-coral-dk)" />
              <span
                className="v3-font-display"
                style={{ fontWeight: 700, fontSize: 15 }}
              >
                Required team
              </span>
              <span
                className="v3-pill v3-pill--coral"
                style={{ marginLeft: "auto" }}
              >
                {data.legacy.teamSize} people
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(showAllRoles ? data.legacy.roles : data.legacy.roles.slice(0, 4)).map(
                (role, i) => (
                  <RoleRow key={`${role.title}-${i}`} role={role} />
                )
              )}
              {data.legacy.roles.length > 4 ? (
                <button
                  type="button"
                  onClick={() => setShowAllRoles((v) => !v)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-v3-mono), monospace",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--v3-blue-700)",
                    padding: "8px 4px",
                  }}
                >
                  {showAllRoles ? (
                    <ChevronUp size={13} strokeWidth={2.25} />
                  ) : (
                    <ChevronDown size={13} strokeWidth={2.25} />
                  )}
                  {showAllRoles
                    ? "Show less"
                    : `+${data.legacy.roles.length - 4} more roles`}
                </button>
              ) : null}
            </div>
          </article>

          {/* Cost waterfall */}
          <article className="v3-panel">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <BarChart3 size={15} strokeWidth={2.25} color="var(--v3-gold-dk)" />
              <span
                className="v3-font-display"
                style={{ fontWeight: 700, fontSize: 15 }}
              >
                Cost comparison
              </span>
            </div>
            {[
              {
                lbl: "Legacy (low)",
                val: data.legacy.totalCost.low,
                color: "coral" as const,
              },
              {
                lbl: "Legacy (high)",
                val: data.legacy.totalCost.high,
                color: "coral" as const,
              },
              {
                lbl: "AI-assisted (actual)",
                val: actualCost,
                color: "blue" as const,
              },
            ].map((w) => (
              <div key={w.lbl} className="v3-water">
                <div className="v3-water__head">
                  <span className="v3-water__lbl">{w.lbl}</span>
                  <span
                    className="v3-water__val"
                    style={{
                      color:
                        w.color === "coral"
                          ? "var(--v3-coral-dk)"
                          : "var(--v3-blue-700)",
                    }}
                  >
                    {fmtK(w.val)}
                  </span>
                </div>
                <div className="v3-water__track">
                  <div
                    className={`v3-water__fill v3-water__fill--${w.color}`}
                    style={{
                      width: `${(w.val / data.legacy.totalCost.high) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}

            <div
              style={{
                marginTop: 18,
                padding: "20px 16px",
                textAlign: "center",
                background:
                  "linear-gradient(135deg, var(--v3-blue-50), var(--v3-white))",
                border: "1px solid var(--v3-blue-200)",
                borderRadius: "var(--v3-r-md)",
              }}
            >
              <div
                className="v3-font-display"
                style={{
                  fontWeight: 800,
                  fontSize: 44,
                  letterSpacing: "-0.025em",
                  color: "var(--v3-blue-700)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {data.comparison.costSavingsPercent}%
              </div>
              <div
                style={{
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 10.5,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--v3-slate)",
                  marginTop: 4,
                }}
              >
                Cost reduction
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* WHERE TIME GOES ============================================ */}
      <section>
        <div className="v3-sec-head" style={{ marginBottom: 24 }}>
          <div className="v3-sec-head__num">04 / TIME ECONOMICS</div>
          <h2 style={{ marginBottom: 8 }}>Where time goes.</h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {[
            {
              icon: Clock,
              iconColor: "var(--v3-coral-dk)",
              title: "Legacy developer day",
              segments: legacyTime,
              footer: `~${Math.round(
                (8 * data.industryBenchmarks.codingTimePercent) / 100
              )}h of actual coding per 8h day`,
            },
            {
              icon: Zap,
              iconColor: "var(--v3-blue-700)",
              title: "AI-assisted day",
              segments: aiTime,
              footer: "No meetings. No standups. No context switching.",
            },
          ].map((card) => (
            <article key={card.title} className="v3-panel">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <card.icon size={15} strokeWidth={2.25} color={card.iconColor} />
                <span
                  className="v3-font-display"
                  style={{ fontWeight: 700, fontSize: 15 }}
                >
                  {card.title}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  flexWrap: "wrap",
                }}
              >
                <TimeDonut segments={card.segments} />
                <div
                  style={{
                    flex: 1,
                    minWidth: 140,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {card.segments.map((s) => (
                    <div
                      key={s.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12,
                          color: "var(--v3-ink)",
                        }}
                      >
                        <span
                          style={{
                            width: 11,
                            height: 11,
                            borderRadius: 3,
                            background: s.color,
                          }}
                        />
                        {s.label}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-v3-mono), monospace",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--v3-charcoal)",
                        }}
                      >
                        {s.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 11.5,
                  textAlign: "center",
                  color: "var(--v3-slate)",
                }}
              >
                {card.footer}
              </div>
            </article>
          ))}
        </div>

        {/* Timeline compression */}
        <article className="v3-panel" style={{ marginTop: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <TrendingDown size={15} strokeWidth={2.25} color="var(--v3-green-dk)" />
            <span
              className="v3-font-display"
              style={{ fontWeight: 700, fontSize: 15 }}
            >
              Timeline compression
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--v3-coral-dk)",
                  marginBottom: 6,
                }}
              >
                Legacy timeline
              </div>
              <div className="v3-tl">
                {Array.from({ length: legacyMonthsMid }).map((_, i) => (
                  <div
                    key={i}
                    className={
                      "v3-tl__seg " +
                      (i < 2
                        ? "v3-tl__seg--start"
                        : i < legacyMonthsMid - 1
                        ? "v3-tl__seg--mid"
                        : "v3-tl__seg--end")
                    }
                  />
                ))}
              </div>
              <div className="v3-tl__lbls">
                <span>Month 1</span>
                <span>Month {legacyMonthsMid}</span>
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--v3-blue-700)",
                  marginBottom: 6,
                }}
              >
                AI-assisted timeline
              </div>
              <div className="v3-tl">
                <div
                  className="v3-tl__seg v3-tl__seg--ai"
                  style={{
                    flex: `${Math.max(
                      0.1,
                      data.timespan.days / (legacyMonthsMid * 30)
                    )} 0 0`,
                  }}
                />
                <div
                  style={{
                    flex: `${Math.max(
                      0.001,
                      1 - data.timespan.days / (legacyMonthsMid * 30)
                    )} 0 0`,
                  }}
                />
              </div>
              <div
                className="v3-tl__lbls"
                style={{ justifyContent: "flex-start" }}
              >
                <span>
                  {data.timespan.days} days · {data.timespan.activeDays} active
                </span>
              </div>
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: 18,
              fontFamily: "var(--font-v3-mono), monospace",
              fontSize: 14,
              color: "var(--v3-slate)",
            }}
          >
            <strong
              className="v3-font-display"
              style={{
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "var(--v3-blue-700)",
                marginRight: 8,
              }}
            >
              {data.comparison.velocityMultiplier}×
            </strong>
            velocity multiplier
          </div>
        </article>
      </section>

      {/* INDUSTRY BENCHMARKS ======================================== */}
      <section>
        <div className="v3-sec-head" style={{ marginBottom: 24 }}>
          <div className="v3-sec-head__num">05 / RESEARCH</div>
          <h2 style={{ marginBottom: 8 }}>Industry benchmarks.</h2>
        </div>

        <article className="v3-panel">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
              marginBottom: 18,
            }}
          >
            {[
              {
                val: `${data.industryBenchmarks.locPerDevPerDay.low}–${data.industryBenchmarks.locPerDevPerDay.high}`,
                lbl: "LOC / dev / day",
              },
              {
                val: `${data.industryBenchmarks.codingTimePercent}%`,
                lbl: "Time spent coding",
              },
              {
                val: `${data.industryBenchmarks.aiProductivityMultiplier.conservative}×–${data.industryBenchmarks.aiProductivityMultiplier.aggressive}×`,
                lbl: "AI productivity range",
              },
            ].map((s) => (
              <div key={s.lbl} style={{ textAlign: "center" }}>
                <div
                  className="v3-font-display"
                  style={{
                    fontWeight: 800,
                    fontSize: 32,
                    letterSpacing: "-0.025em",
                    color: "var(--v3-blue-700)",
                  }}
                >
                  {s.val}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-v3-mono), monospace",
                    fontSize: 10.5,
                    letterSpacing: "0.16em",
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

          <button
            type="button"
            onClick={() => setShowStudies((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-v3-mono), monospace",
              fontSize: 12,
              color: "var(--v3-slate)",
              padding: 0,
            }}
          >
            {showStudies ? (
              <ChevronUp size={13} strokeWidth={2.25} />
            ) : (
              <ChevronDown size={13} strokeWidth={2.25} />
            )}
            <BookOpen size={13} strokeWidth={2.25} />
            {data.industryBenchmarks.studies.length} published studies
            <ArrowRight size={13} strokeWidth={2.25} />
          </button>

          {showStudies ? (
            <div
              style={{
                marginTop: 14,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {data.industryBenchmarks.studies.map((s) => (
                <div key={s.source} className="v3-study-row">
                  <span className="v3-study-row__src">{s.source}</span>
                  <span className="v3-study-row__finding">{s.finding}</span>
                </div>
              ))}
            </div>
          ) : null}
        </article>
      </section>

      {/* BOTTOM LINE ================================================ */}
      <section>
        <article
          className="v3-panel"
          style={{
            background:
              "linear-gradient(135deg, var(--v3-blue-50), var(--v3-white) 50%, #E3F5EC)",
            textAlign: "center",
            padding: "48px 28px",
          }}
        >
          <div
            className="v3-sec-head__num"
            style={{ color: "var(--v3-green-dk)", marginBottom: 12 }}
          >
            06 / BOTTOM LINE
          </div>
          <h2
            className="v3-font-display"
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: "0 0 14px",
              textWrap: "balance",
            }}
          >
            {fmt(data.actual.messages)} messages. ${fmt(actualCost)} total.
          </h2>
          <p
            style={{
              maxWidth: 580,
              margin: "0 auto 24px",
              fontSize: 16,
              lineHeight: 1.55,
              color: "var(--v3-ink)",
            }}
          >
            One person with Claude built what a {data.legacy.teamSize}-person team would
            quote {fmtK(data.legacy.totalCost.low)}–{fmtK(data.legacy.totalCost.high)} to
            deliver in {data.legacy.estimatedMonths.low}–
            {data.legacy.estimatedMonths.high} months. Shipped in{" "}
            {data.timespan.days} days.
          </p>
          <a href="/ai-pilot" className="v3-btn v3-btn--primary">
            View AI Pilot dashboard →
          </a>
        </article>
      </section>
    </div>
  )
}
