"use client"

import { useState, useEffect, useRef } from "react"
import { useInView } from "framer-motion"
import {
  DollarSign, Users, Zap, Clock, TrendingDown, BarChart3,
  ArrowRight, ChevronDown, ChevronUp, BookOpen,
} from "lucide-react"
import { timeAgo } from "@/lib/time-ago"

// --- Types ---
interface Role {
  title: string
  count: number
  annualSalary: number
  loadedCost: number
  halfTime?: boolean
}

interface CostModel {
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
  timeSeries: {
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
  }[]
  issues: {
    opened: number
    closed: number
    bugs: number
    features: number
    other: number
  }
}

// --- Animated Counter ---
function Counter({ end, suffix = "", prefix = "", duration = 2000 }: {
  end: number; suffix?: string; prefix?: string; duration?: number
}) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          let start = 0
          const step = end / (duration / 16)
          const tick = () => {
            start += step
            if (start >= end) { setVal(end); return }
            setVal(Math.floor(start))
            requestAnimationFrame(tick)
          }
          tick()
          obs.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration])

  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>
}

// --- Fade Section ---
function FadeSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" })

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
      }}
    >
      {children}
    </div>
  )
}

// --- Cost Waterfall Bar ---
function WaterfallBar({ label, value, max, color, delay = 0 }: {
  label: string; value: number; max: number; color: string; delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const pct = (value / max) * 100

  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">{label}</span>
        <span className="text-xs font-mono" style={{ color }}>${(value / 1000).toLocaleString("en-US", { maximumFractionDigits: 0 })}K</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--brand-bg)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: isInView ? `${pct}%` : "0%",
            background: color,
            transition: `width 1s ease-out ${delay}s`,
          }}
        />
      </div>
    </div>
  )
}

// --- Role Row ---
function RoleRow({ role }: { role: Role }) {
  const monthly = Math.round(role.loadedCost / 12)
  const label = role.halfTime ? "½" : `${role.count}x`
  return (
    <div
      className="flex items-center justify-between py-2.5 px-3 rounded-lg"
      style={{ background: "color-mix(in srgb, var(--brand-bg) 50%, transparent)" }}
    >
      <div className="flex items-center gap-3">
        <span
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
          style={{
            background: "color-mix(in srgb, var(--brand-secondary) 12%, transparent)",
            color: "var(--brand-secondary)",
          }}
        >
          {label}
        </span>
        <span className="text-sm font-medium">{role.title}</span>
      </div>
      <div className="text-right">
        <div className="text-sm font-mono font-semibold">${role.loadedCost.toLocaleString("en-US")}<span className="text-[10px] font-normal" style={{ color: "var(--brand-muted)" }}>/yr</span></div>
        <div className="text-[10px] font-mono" style={{ color: "var(--brand-muted)" }}>${monthly.toLocaleString("en-US")}/mo</div>
      </div>
    </div>
  )
}

// --- Time Breakdown Donut ---
function TimeDonut({ segments, size = 120 }: {
  segments: { label: string; pct: number; color: string }[]
  size?: number
}) {
  const r = size / 2 - 8
  const circumference = 2 * Math.PI * r
  let offset = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((s) => {
        const dash = (s.pct / 100) * circumference
        const gap = circumference - dash
        const thisOffset = offset
        offset += dash
        return (
          <circle
            key={s.label}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="12"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-thisOffset}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
        )
      })}
    </svg>
  )
}

// --- Number formatting helpers ---
const fmt = (n: number) => n.toLocaleString("en-US")
const fmtK = (n: number) => `$${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 0 })}K`

// --- SVG Line Chart Helper ---
function buildSmoothPath(points: { x: number; y: number }[]): string {
  return points.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`
    const prev = points[i - 1]
    const cpx = (prev.x + p.x) / 2
    return `${acc} C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`
  }, "")
}

type TSEntry = CostModel["timeSeries"][number]

// --- Cost Curve Chart ---
function CostCurveChart({ timeSeries }: { timeSeries: TSEntry[] }) {
  const w = 700, h = 220, padL = 60, padR = 20, padT = 20, padB = 40
  const chartW = w - padL - padR
  const chartH = h - padT - padB
  const n = timeSeries.length

  // Short 4-week projection beyond "now" to hint at divergence
  const lastLegacy = timeSeries[n - 1].cumulativeCostLegacy
  const legacyRate = lastLegacy / n
  const projWeeks = 4
  const totalWeeks = n + projWeeks

  const projectedLegacyMax = lastLegacy + legacyRate * projWeeks
  const maxCost = projectedLegacyMax * 1.15

  const xScale = (i: number) => padL + (i / (totalWeeks - 1)) * chartW
  const yScale = (v: number) => padT + chartH - (v / maxCost) * chartH

  const legacyPoints = Array.from({ length: totalWeeks }, (_, i) => ({
    x: xScale(i),
    y: yScale(i < n ? timeSeries[i].cumulativeCostLegacy : legacyRate * (i + 1)),
  }))

  const actualPoints = timeSeries.map((d, i) => ({
    x: xScale(i),
    y: yScale(d.cumulativeCostActual),
  }))

  const actualPath = buildSmoothPath(actualPoints)

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: yScale(f * maxCost),
    label: `$${((f * maxCost) / 1000).toFixed(0)}K`,
  }))

  // X-axis labels (every 4 weeks)
  const xLabels = timeSeries
    .filter((_, i) => i % 4 === 0)
    .map((d, i) => ({
      x: xScale(i * 4),
      label: d.week.replace(/^\d{4}-/, ""),
    }))

  return (
    <div
      className="rounded-xl p-4 sm:p-5"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" style={{ color: "var(--brand-primary)" }} />
          <span className="text-sm font-bold">Cumulative Cost Over Time</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded" style={{ background: "var(--brand-secondary)" }} />
            <span className="text-[10px] font-mono" style={{ color: "var(--brand-muted)" }}>Legacy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded" style={{ background: "var(--brand-primary)" }} />
            <span className="text-[10px] font-mono" style={{ color: "var(--brand-muted)" }}>AI-Assisted</span>
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: "220px" }}>
        {/* Grid lines */}
        {yTicks.map((t) => (
          <g key={t.label}>
            <line x1={padL} y1={t.y} x2={w - padR} y2={t.y} stroke="var(--brand-border)" strokeWidth="1" />
            <text x={padL - 8} y={t.y + 4} textAnchor="end" fill="var(--brand-muted)" fontSize="10" fontFamily="monospace">{t.label}</text>
          </g>
        ))}
        {/* X labels */}
        {xLabels.map((t) => (
          <text key={t.label} x={t.x} y={h - 8} textAnchor="middle" fill="var(--brand-muted)" fontSize="9" fontFamily="monospace">{t.label}</text>
        ))}
        {/* "Now" marker */}
        <line x1={xScale(n - 1)} y1={padT} x2={xScale(n - 1)} y2={h - padB} stroke="var(--brand-border)" strokeWidth="1" strokeDasharray="4,4" />
        <text x={xScale(n - 1)} y={padT - 5} textAnchor="middle" fill="var(--brand-muted)" fontSize="9" fontFamily="monospace">NOW</text>
        {/* Legacy curve (dashed after "now") */}
        <path d={buildSmoothPath(legacyPoints.slice(0, n))} fill="none" stroke="var(--brand-secondary)" strokeWidth="2.5" />
        <path d={buildSmoothPath(legacyPoints.slice(n - 1))} fill="none" stroke="var(--brand-secondary)" strokeWidth="2" strokeDasharray="6,4" opacity="0.5" />
        {/* Actual curve */}
        <path d={actualPath} fill="none" stroke="var(--brand-primary)" strokeWidth="2.5" />
        {/* End dots */}
        <circle cx={actualPoints[n - 1].x} cy={actualPoints[n - 1].y} r="4" fill="var(--brand-primary)" />
        <circle cx={legacyPoints[n - 1].x} cy={legacyPoints[n - 1].y} r="4" fill="var(--brand-secondary)" />
        {/* Gap annotation */}
        <line
          x1={xScale(n - 1) + 12} y1={actualPoints[n - 1].y}
          x2={xScale(n - 1) + 12} y2={legacyPoints[n - 1].y}
          stroke="var(--brand-warning)" strokeWidth="2"
        />
        <text
          x={xScale(n - 1) + 20}
          y={(actualPoints[n - 1].y + legacyPoints[n - 1].y) / 2 + 4}
          fill="var(--brand-warning)" fontSize="11" fontWeight="bold" fontFamily="monospace"
        >
          ${((timeSeries[n - 1].cumulativeCostLegacy - timeSeries[n - 1].cumulativeCostActual) / 1000).toFixed(0)}K saved
        </text>
      </svg>
    </div>
  )
}

// --- Velocity Chart (commits + sessions) ---
function VelocityChart({ timeSeries }: { timeSeries: TSEntry[] }) {
  const w = 400, h = 180, padL = 10, padR = 10, padT = 10, padB = 30
  const chartW = w - padL - padR
  const chartH = h - padT - padB
  const n = timeSeries.length
  const maxCommits = Math.max(...timeSeries.map((d) => d.commits), 1)
  const barW = (chartW / n) * 0.7
  const gap = (chartW / n) * 0.3

  return (
    <div
      className="rounded-xl p-4 sm:p-5"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" style={{ color: "var(--brand-warning)" }} />
          <span className="text-sm font-bold">Weekly Commit Velocity</span>
        </div>
        <span className="text-[10px] font-mono" style={{ color: "var(--brand-muted)" }}>
          {fmt(timeSeries.reduce((s, d) => s + d.commits, 0))} total
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: "180px" }}>
        {timeSeries.map((d, i) => {
          const barH = (d.commits / maxCommits) * chartH
          const x = padL + i * (barW + gap)
          const y = padT + chartH - barH
          return (
            <g key={d.week}>
              <rect
                x={x} y={y} width={barW} height={barH}
                rx="3"
                fill={d.sessions > 0
                  ? "var(--brand-primary)"
                  : "color-mix(in srgb, var(--brand-warning) 60%, transparent)"
                }
                opacity={d.sessions > 0 ? 0.9 : 0.5}
              />
              {i % 4 === 0 && (
                <text x={x + barW / 2} y={h - 8} textAnchor="middle" fill="var(--brand-muted)" fontSize="8" fontFamily="monospace">
                  {d.week.replace(/^\d{4}-/, "")}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="flex items-center gap-4 mt-1 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--brand-primary)" }} />
          <span className="text-[9px] font-mono" style={{ color: "var(--brand-muted)" }}>With Claude</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm opacity-50" style={{ background: "var(--brand-warning)" }} />
          <span className="text-[9px] font-mono" style={{ color: "var(--brand-muted)" }}>Pre-Claude</span>
        </div>
      </div>
    </div>
  )
}

// --- Issues Chart ---
function IssuesChart({ timeSeries, issues }: { timeSeries: TSEntry[]; issues: CostModel["issues"] }) {
  const w = 400, h = 180, padL = 10, padR = 10, padT = 10, padB = 30
  const chartW = w - padL - padR
  const chartH = h - padT - padB
  const n = timeSeries.length
  const maxIssues = Math.max(...timeSeries.map((d) => Math.max(d.issuesOpened, d.issuesClosed)), 1)
  const barW = (chartW / n) * 0.35
  const groupW = chartW / n

  return (
    <div
      className="rounded-xl p-4 sm:p-5"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: "var(--brand-info)" }} />
          <span className="text-sm font-bold">Issues Throughput</span>
        </div>
        <span className="text-[10px] font-mono" style={{ color: "var(--brand-muted)" }}>
          {fmt(issues.opened)} opened · {fmt(issues.closed)} closed
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: "180px" }}>
        {timeSeries.map((d, i) => {
          const openH = (d.issuesOpened / maxIssues) * chartH
          const closeH = (d.issuesClosed / maxIssues) * chartH
          const x = padL + i * groupW
          return (
            <g key={d.week}>
              <rect
                x={x} y={padT + chartH - openH} width={barW} height={openH}
                rx="2" fill="var(--brand-info)" opacity="0.7"
              />
              <rect
                x={x + barW + 2} y={padT + chartH - closeH} width={barW} height={closeH}
                rx="2" fill="var(--brand-success, #22c55e)" opacity="0.7"
              />
              {i % 4 === 0 && (
                <text x={x + groupW / 2} y={h - 8} textAnchor="middle" fill="var(--brand-muted)" fontSize="8" fontFamily="monospace">
                  {d.week.replace(/^\d{4}-/, "")}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="flex items-center gap-4 mt-1 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--brand-info)", opacity: 0.7 }} />
          <span className="text-[9px] font-mono" style={{ color: "var(--brand-muted)" }}>Opened</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--brand-success, #22c55e)", opacity: 0.7 }} />
          <span className="text-[9px] font-mono" style={{ color: "var(--brand-muted)" }}>Closed</span>
        </div>
        <span className="text-[9px] font-mono" style={{ color: "var(--brand-muted)" }}>
          {issues.bugs} bugs · {issues.features} features
        </span>
      </div>
    </div>
  )
}

// --- Main Page ---
export default function CostAnalysisPage() {
  const [data, setData] = useState<CostModel | null>(null)
  const [showAllRoles, setShowAllRoles] = useState(false)
  const [showStudies, setShowStudies] = useState(false)

  useEffect(() => {
    fetch("/data/cost-model.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) {
    return (
      <div className="pt-20 sm:pt-24 pb-10 sm:pb-16 container-page">
        <div className="space-y-4">
          <div className="h-48 rounded-2xl animate-pulse" style={{ background: "var(--brand-bg-alt)" }} />
          <div className="h-10 rounded-lg animate-pulse max-w-md" style={{ background: "var(--brand-bg-alt)" }} />
          <div className="h-96 rounded-lg animate-pulse" style={{ background: "var(--brand-bg-alt)" }} />
        </div>
      </div>
    )
  }

  const legacyMid = Math.round((data.legacy.totalCost.low + data.legacy.totalCost.high) / 2)
  const actualCost = data.actual.totalCost
  const legacyMonthsMid = Math.round((data.legacy.estimatedMonths.low + data.legacy.estimatedMonths.high) / 2)

  const legacyTimeBreakdown = [
    { label: "Writing code", pct: data.industryBenchmarks.codingTimePercent, color: "var(--brand-primary)" },
    { label: "Meetings", pct: data.industryBenchmarks.meetingTimePercent, color: "var(--brand-secondary)" },
    { label: "Code review", pct: data.industryBenchmarks.codeReviewPercent, color: "var(--brand-info)" },
    { label: "Testing/QA", pct: 15, color: "var(--brand-warning)" },
    { label: "Admin/other", pct: 18, color: "var(--brand-steel)" },
  ]

  const aiTimeBreakdown = [
    { label: "Productive output", pct: 85, color: "var(--brand-primary)" },
    { label: "Planning/review", pct: 10, color: "var(--brand-info)" },
    { label: "Deploy/ops", pct: 5, color: "var(--brand-steel)" },
  ]

  return (
    <div className="pt-20 sm:pt-24 pb-10 sm:pb-16">
      {/* ===== HERO ===== */}
      <section className="container-page mb-10 sm:mb-16">
        <FadeSection>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--brand-primary) 25%, transparent)",
              }}
            >
              <DollarSign className="w-5 h-5" style={{ color: "var(--brand-primary)" }} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[3px]" style={{ color: "var(--brand-primary)" }}>
                {data.scope}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                Cost Analysis
              </h1>
            </div>
          </div>
          <p className="text-base sm:text-lg max-w-[640px] mb-8" style={{ color: "var(--brand-muted)" }}>
            What does it actually cost to build enterprise software with AI?
            Real numbers from {data.timespan.days} days of Campaign Brain development.
          </p>

          {/* Hero stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Legacy Estimate", value: fmtK(legacyMid), sub: `${data.legacy.teamSize}-person team · ${legacyMonthsMid} months`, color: "var(--brand-secondary)" },
              { label: "Actual Cost", value: `$${fmt(actualCost)}`, sub: `$${fmt(data.actual.operatorCost)} + $${fmt(data.actual.aiCost)} AI`, color: "var(--brand-primary)" },
              { label: "Velocity", value: `${data.comparison.velocityMultiplier}x`, sub: `${data.timespan.activeDays} active days`, color: "var(--brand-warning)" },
              { label: "Cost Reduction", value: `${data.comparison.costSavingsPercent}%`, sub: `$${fmt(legacyMid - actualCost)} saved`, color: "var(--brand-success, #22c55e)" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-4"
                style={{
                  background: "var(--brand-bg-alt)",
                  border: "1px solid var(--brand-border)",
                }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-[2px] mb-2" style={{ color: s.color }}>
                  {s.label}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums">{s.value}</div>
                <div className="text-[11px] font-mono mt-1" style={{ color: "var(--brand-muted)" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </FadeSection>
      </section>

      {/* ===== LIFECYCLE CURVES ===== */}
      {data.timeSeries && data.timeSeries.length > 0 && (
        <section className="container-page mb-10 sm:mb-16">
          <FadeSection>
            <div className="text-xs font-semibold uppercase tracking-[3px] mb-1" style={{ color: "var(--brand-primary)" }}>
              Live Data
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
              The curves don&apos;t lie.
            </h2>

            {/* Cost curves */}
            <CostCurveChart timeSeries={data.timeSeries} />

            {/* Velocity + Issues */}
            <div className="grid lg:grid-cols-2 gap-4 mt-4">
              <VelocityChart timeSeries={data.timeSeries} />
              <IssuesChart timeSeries={data.timeSeries} issues={data.issues} />
            </div>
          </FadeSection>
        </section>
      )}

      {/* ===== WHAT WAS BUILT ===== */}
      <section className="container-page mb-10 sm:mb-16">
        <FadeSection>
          <div className="text-xs font-semibold uppercase tracking-[3px] mb-1" style={{ color: "var(--brand-primary)" }}>
            Output
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
            What was shipped.
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { val: data.actual.projects, label: "Projects", color: "var(--brand-primary)" },
              { val: data.actual.repos, label: "Repositories", color: "var(--brand-secondary)" },
              { val: data.actual.commits, label: "Commits", color: "var(--brand-warning)" },
              { val: data.actual.sessions, label: "Sessions", color: "var(--brand-info)" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-4 text-center"
                style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
              >
                <div className="text-3xl sm:text-4xl font-extrabold tabular-nums" style={{ color: s.color }}>
                  <Counter end={s.val} />
                </div>
                <div className="text-[10px] font-medium uppercase tracking-widest mt-1" style={{ color: "var(--brand-muted)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Top projects */}
          <div
            className="mt-4 rounded-xl p-4 sm:p-5"
            style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
          >
            <div className="text-xs font-bold uppercase tracking-[2px] mb-3" style={{ color: "var(--brand-muted)" }}>
              Top Campaign Brain Projects
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.actual.topProjects.slice(0, 9).map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: "color-mix(in srgb, var(--brand-bg) 50%, transparent)" }}
                >
                  <span className="text-sm font-mono font-semibold">{p.name}</span>
                  <span className="text-[10px] font-mono" style={{ color: "var(--brand-muted)" }}>
                    {fmt(p.sessions)}s · {fmt(p.messages)}m
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Domain coverage */}
          <div
            className="mt-4 rounded-xl p-4 sm:p-5"
            style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
          >
            <div className="text-xs font-bold uppercase tracking-[2px] mb-3" style={{ color: "var(--brand-muted)" }}>
              Domain Coverage — One Person
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {data.actual.domains.map((d) => (
                <div key={d.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{d.name}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: "var(--brand-primary)" }}>{d.score}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--brand-bg)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${d.score}%`,
                        background: d.score >= 70 ? "var(--brand-primary)" : d.score >= 50 ? "var(--brand-warning)" : "var(--brand-steel)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeSection>
      </section>

      {/* ===== LEGACY COST BREAKDOWN ===== */}
      <section className="container-page mb-10 sm:mb-16">
        <FadeSection>
          <div className="text-xs font-semibold uppercase tracking-[3px] mb-1" style={{ color: "var(--brand-secondary)" }}>
            Legacy Model
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            What this would cost.
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--brand-muted)" }}>
            Traditional team required to build equivalent output. Salaries are US market, fully loaded (1.4x base for benefits, taxes, overhead).
          </p>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Team roster */}
            <div
              className="rounded-xl p-4 sm:p-5"
              style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} />
                <span className="text-sm font-bold">Required Team</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{
                  color: "var(--brand-secondary)",
                  background: "color-mix(in srgb, var(--brand-secondary) 10%, transparent)",
                }}>
                  {data.legacy.teamSize} people
                </span>
              </div>
              <div className="space-y-1.5">
                {(showAllRoles ? data.legacy.roles : data.legacy.roles.slice(0, 4)).map((role, i) => (
                  <RoleRow key={i} role={role} />
                ))}
                {data.legacy.roles.length > 4 && (
                  <button
                    onClick={() => setShowAllRoles(!showAllRoles)}
                    className="flex items-center gap-1 text-xs font-semibold mt-2 cursor-pointer"
                    style={{ color: "var(--brand-primary)" }}
                  >
                    {showAllRoles ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showAllRoles ? "Show less" : `+${data.legacy.roles.length - 4} more roles`}
                  </button>
                )}
              </div>
            </div>

            {/* Cost waterfall */}
            <div
              className="rounded-xl p-4 sm:p-5"
              style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4" style={{ color: "var(--brand-warning)" }} />
                <span className="text-sm font-bold">Cost Comparison</span>
              </div>
              <div className="space-y-4">
                <WaterfallBar label="Legacy (low)" value={data.legacy.totalCost.low} max={data.legacy.totalCost.high} color="var(--brand-secondary)" delay={0} />
                <WaterfallBar label="Legacy (high)" value={data.legacy.totalCost.high} max={data.legacy.totalCost.high} color="var(--brand-secondary)" delay={0.2} />
                <WaterfallBar label="AI-Assisted (actual)" value={actualCost} max={data.legacy.totalCost.high} color="var(--brand-primary)" delay={0.4} />
              </div>

              <div
                className="mt-6 rounded-lg p-4 text-center"
                style={{
                  background: "color-mix(in srgb, var(--brand-primary) 5%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--brand-primary) 15%, transparent)",
                }}
              >
                <div className="text-3xl sm:text-4xl font-extrabold" style={{ color: "var(--brand-primary)" }}>
                  <Counter end={data.comparison.costSavingsPercent} suffix="%" />
                </div>
                <div className="text-xs font-medium uppercase tracking-widest mt-1" style={{ color: "var(--brand-muted)" }}>
                  Cost Reduction
                </div>
              </div>
            </div>
          </div>
        </FadeSection>
      </section>

      {/* ===== TIME BREAKDOWN ===== */}
      <section className="container-page mb-10 sm:mb-16">
        <FadeSection>
          <div className="text-xs font-semibold uppercase tracking-[3px] mb-1" style={{ color: "var(--brand-warning)" }}>
            Time Economics
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
            Where time goes.
          </h2>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Legacy time */}
            <div
              className="rounded-xl p-5 sm:p-6"
              style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} />
                <span className="text-sm font-bold">Legacy Developer Day</span>
              </div>
              <div className="flex items-center gap-6">
                <TimeDonut segments={legacyTimeBreakdown} />
                <div className="space-y-1.5 flex-1">
                  {legacyTimeBreakdown.map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                        <span className="text-xs">{s.label}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold">{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 text-center text-xs font-mono" style={{ color: "var(--brand-muted)" }}>
                ~{Math.round(8 * data.industryBenchmarks.codingTimePercent / 100)}h of actual coding per 8h day
              </div>
            </div>

            {/* AI-assisted time */}
            <div
              className="rounded-xl p-5 sm:p-6"
              style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4" style={{ color: "var(--brand-primary)" }} />
                <span className="text-sm font-bold">AI-Assisted Day</span>
              </div>
              <div className="flex items-center gap-6">
                <TimeDonut segments={aiTimeBreakdown} />
                <div className="space-y-1.5 flex-1">
                  {aiTimeBreakdown.map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                        <span className="text-xs">{s.label}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold">{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 text-center text-xs font-mono" style={{ color: "var(--brand-muted)" }}>
                No meetings. No standups. No context switching.
              </div>
            </div>
          </div>

          {/* Timeline compression */}
          <div
            className="mt-4 rounded-xl p-5 sm:p-6"
            style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-4 h-4" style={{ color: "var(--brand-primary)" }} />
              <span className="text-sm font-bold">Timeline Compression</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[2px] mb-2" style={{ color: "var(--brand-secondary)" }}>
                  Legacy Timeline
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: legacyMonthsMid }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-8 rounded"
                      style={{
                        background: i < 2
                          ? "color-mix(in srgb, var(--brand-steel) 20%, transparent)"
                          : i < legacyMonthsMid - 1
                            ? "color-mix(in srgb, var(--brand-secondary) 25%, transparent)"
                            : "color-mix(in srgb, var(--brand-warning) 25%, transparent)",
                        border: "1px solid var(--brand-border)",
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] font-mono" style={{ color: "var(--brand-muted)" }}>Month 1</span>
                  <span className="text-[9px] font-mono" style={{ color: "var(--brand-muted)" }}>Month {legacyMonthsMid}</span>
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-[2px] mb-2" style={{ color: "var(--brand-primary)" }}>
                  AI-Assisted Timeline
                </div>
                <div className="flex gap-1">
                  <div
                    className="h-8 rounded"
                    style={{
                      width: `${Math.min(100, (data.timespan.days / (legacyMonthsMid * 30)) * 100)}%`,
                      background: "color-mix(in srgb, var(--brand-primary) 30%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--brand-primary) 40%, transparent)",
                    }}
                  />
                </div>
                <div className="mt-1">
                  <span className="text-[9px] font-mono" style={{ color: "var(--brand-muted)" }}>
                    {data.timespan.days} days ({data.timespan.activeDays} active)
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <span className="text-lg sm:text-xl font-extrabold" style={{ color: "var(--brand-primary)" }}>
                {data.comparison.velocityMultiplier}x
              </span>
              <span className="text-sm ml-2" style={{ color: "var(--brand-muted)" }}>velocity multiplier</span>
            </div>
          </div>
        </FadeSection>
      </section>

      {/* ===== INDUSTRY RESEARCH ===== */}
      <section className="container-page mb-10 sm:mb-16">
        <FadeSection>
          <div className="text-xs font-semibold uppercase tracking-[3px] mb-1" style={{ color: "var(--brand-info)" }}>
            Research
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-6">
            Industry benchmarks.
          </h2>

          <div
            className="rounded-xl p-5 sm:p-6"
            style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
          >
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: "var(--brand-info)" }}>
                  {data.industryBenchmarks.locPerDevPerDay.low}-{data.industryBenchmarks.locPerDevPerDay.high}
                </div>
                <div className="text-[10px] font-medium uppercase tracking-widest mt-1" style={{ color: "var(--brand-muted)" }}>
                  LOC/dev/day
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: "var(--brand-info)" }}>
                  {data.industryBenchmarks.codingTimePercent}%
                </div>
                <div className="text-[10px] font-medium uppercase tracking-widest mt-1" style={{ color: "var(--brand-muted)" }}>
                  Time spent coding
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: "var(--brand-info)" }}>
                  {data.industryBenchmarks.aiProductivityMultiplier.conservative}x–{data.industryBenchmarks.aiProductivityMultiplier.aggressive}x
                </div>
                <div className="text-[10px] font-medium uppercase tracking-widest mt-1" style={{ color: "var(--brand-muted)" }}>
                  AI Productivity Range
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowStudies(!showStudies)}
              className="flex items-center gap-1.5 text-xs font-mono cursor-pointer"
              style={{ color: "var(--brand-muted)" }}
            >
              {showStudies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <BookOpen className="w-3 h-3" />
              {data.industryBenchmarks.studies.length} published studies
              <ArrowRight className="w-3 h-3" />
            </button>

            {showStudies && (
              <div className="mt-3 space-y-2">
                {data.industryBenchmarks.studies.map((s) => (
                  <div
                    key={s.source}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
                    style={{ background: "color-mix(in srgb, var(--brand-bg) 50%, transparent)" }}
                  >
                    <span className="text-xs font-semibold shrink-0 w-36">{s.source}</span>
                    <span className="text-xs" style={{ color: "var(--brand-muted)" }}>{s.finding}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeSection>
      </section>

      {/* ===== BOTTOM LINE ===== */}
      <section className="container-page">
        <FadeSection>
          <div
            className="rounded-2xl p-6 sm:p-10 text-center"
            style={{
              background: "color-mix(in srgb, var(--brand-primary) 5%, transparent)",
              border: "1px solid color-mix(in srgb, var(--brand-primary) 15%, transparent)",
            }}
          >
            <div className="text-xs font-semibold uppercase tracking-[3px] mb-3" style={{ color: "var(--brand-primary)" }}>
              Bottom Line
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              {fmt(data.actual.messages)} messages. ${fmt(actualCost)} total.
            </h2>
            <p className="text-base sm:text-lg max-w-[560px] mx-auto mb-6" style={{ color: "var(--brand-muted)" }}>
              One person with Claude built what a {data.legacy.teamSize}-person team would quote
              {" "}{fmtK(data.legacy.totalCost.low)}–{fmtK(data.legacy.totalCost.high)}{" "}
              to deliver in {data.legacy.estimatedMonths.low}–{data.legacy.estimatedMonths.high} months.
              Shipped in {data.timespan.days} days.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/ai-pilot"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all"
                style={{ background: "var(--brand-primary)", color: "var(--brand-bg)" }}
              >
                View AI Pilot Dashboard <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/the-shift"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all"
                style={{
                  border: "1px solid color-mix(in srgb, var(--brand-secondary) 30%, transparent)",
                  color: "var(--brand-secondary)",
                }}
              >
                Read: The Shift <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </FadeSection>
      </section>

      {/* Last updated */}
      <div className="text-center py-6">
        <span className="text-[10px] font-mono tracking-wide opacity-60" style={{ color: "var(--brand-muted)" }}>
          updated {timeAgo(data.generated)}
        </span>
      </div>
    </div>
  )
}
