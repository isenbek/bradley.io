"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import {
  Zap, Clock, MessageSquare, Database, ArrowRight,
  GitBranch, Shield, Cpu, Brain, Server, Layers, Radio,
  BarChart3, RefreshCw, TrendingUp,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LicenseData {
  totalSessions: number
  totalMessages: number
  projectCount: number
  totalCacheTokens: number
  totalInputTokens: number
  totalOutputTokens: number
}

interface InstrumentRatings {
  [domain: string]: {
    score: number
    hits: number
    matchedKeywords: string[]
    keywordCoverage: number
  }
}

interface StreaksData {
  current: number
  longest: number
  peakDay: string
  peakDayCount: number
  peakWeek: string
  peakWeekCount: number
  totalActiveDays: number
}

interface TokenEconomy {
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheCreateTokens: number
  cacheEfficiency: number
}

interface MissionEntry {
  name: string
  sessions: number
  messages: number
  domain: string
  status: string
}

interface AIPilotData {
  license: LicenseData
  instrumentRatings: InstrumentRatings
  streaks: StreaksData
  tokenEconomy: TokenEconomy
  missionLog: MissionEntry[]
}

interface CostModelData {
  legacy: {
    teamSize: number
    annualCost: number
    sprintVelocity: number
    onboardingWeeks: number
    meetingPercent: number
    codingPercent: number
    reviewPercent: number
    testingPercent: number
    planningPercent: number
    adminPercent: number
  }
  aiAssisted: {
    productivePercent: number
    planningPercent: number
    deployPercent: number
  }
}

// ---------------------------------------------------------------------------
// FadeSection — scroll-triggered reveal
// ---------------------------------------------------------------------------

function FadeSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Animated Counter
// ---------------------------------------------------------------------------

function Counter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
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

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

// ---------------------------------------------------------------------------
// Radar Chart — pure SVG
// ---------------------------------------------------------------------------

interface RadarDomain {
  label: string
  score: number
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

function RadarChart({ domains }: { domains: RadarDomain[] }) {
  const n = domains.length
  const cx = 200
  const cy = 200
  const maxR = 160
  const levels = [20, 40, 60, 80, 100]

  const angleStep = (2 * Math.PI) / n
  // Start from top (-PI/2)
  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2
    const r = (value / 100) * maxR
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  const gridPaths = levels.map((level) => {
    const pts = Array.from({ length: n }, (_, i) => getPoint(i, level))
    return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z"
  })

  const dataPoints = domains.map((d, i) => getPoint(i, d.score))
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z"

  const axisEnds = Array.from({ length: n }, (_, i) => getPoint(i, 100))
  const labelPoints = Array.from({ length: n }, (_, i) => getPoint(i, 118))

  return (
    <svg viewBox="0 0 400 400" className="w-full max-w-[400px] mx-auto">
      <defs>
        <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0.05" />
        </radialGradient>
      </defs>

      {/* Grid levels */}
      {gridPaths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="var(--brand-border)"
          strokeWidth="1"
          opacity={0.5 + i * 0.1}
        />
      ))}

      {/* Axis lines */}
      {axisEnds.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          stroke="var(--brand-border)"
          strokeWidth="1"
          opacity="0.4"
        />
      ))}

      {/* Data area */}
      <path d={dataPath} fill="url(#radar-fill)" stroke="var(--brand-primary)" strokeWidth="2" />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--brand-primary)" />
      ))}

      {/* Labels */}
      {labelPoints.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={p.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--brand-muted)"
          fontSize="11"
          fontFamily="var(--font-mono)"
          fontWeight="600"
        >
          <tspan>{domains[i].label}</tspan>
          <tspan x={p.x} dy="14" fill="var(--brand-primary)" fontSize="12" fontWeight="800">
            {domains[i].score}
          </tspan>
        </text>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Donut Chart — pure SVG
// ---------------------------------------------------------------------------

interface DonutSlice {
  label: string
  value: number
  color: string
}

function DonutChart({ slices, label }: { slices: DonutSlice[]; label: string }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0)
  const r = 80
  const cx = 100
  const cy = 100
  const strokeWidth = 28

  let cumulative = 0
  const circumference = 2 * Math.PI * r

  return (
    <div className="text-center">
      <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto">
        {slices.map((slice, i) => {
          const pct = slice.value / total
          const dashLen = pct * circumference
          const dashOffset = -(cumulative / total) * circumference
          cumulative += slice.value
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              opacity="0.85"
            />
          )
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--brand-text)" fontSize="14" fontWeight="800" fontFamily="var(--font-mono)">
          {label}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--brand-muted)" fontSize="9" fontWeight="600">
          TIME ALLOCATION
        </text>
      </svg>
      <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: slice.color }} />
            <span style={{ color: "var(--brand-muted)" }}>{slice.label} {slice.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Flow Diagram — pure SVG
// ---------------------------------------------------------------------------

function CompoundVelocityFlow() {
  const nodes = [
    { label: "Sessions", x: 50, y: 50, icon: "msg" },
    { label: "Pipelines", x: 200, y: 50, icon: "git" },
    { label: "Dashboards", x: 350, y: 50, icon: "bar" },
    { label: "Insights", x: 275, y: 150, icon: "brain" },
    { label: "More Building", x: 125, y: 150, icon: "zap" },
  ]

  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
  ]

  return (
    <svg viewBox="0 0 400 210" className="w-full max-w-[500px] mx-auto">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--brand-primary)" opacity="0.6" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map(([from, to], i) => (
        <line
          key={i}
          x1={nodes[from].x}
          y1={nodes[from].y}
          x2={nodes[to].x}
          y2={nodes[to].y}
          stroke="var(--brand-primary)"
          strokeWidth="1.5"
          opacity="0.3"
          markerEnd="url(#arrow)"
        />
      ))}

      {/* Nodes */}
      {nodes.map((node, i) => (
        <g key={i}>
          <circle cx={node.x} cy={node.y} r="28" fill="color-mix(in srgb, var(--brand-primary) 8%, transparent)" stroke="var(--brand-primary)" strokeWidth="1.5" opacity="0.7" />
          <text
            x={node.x}
            y={node.y + 4}
            textAnchor="middle"
            fill="var(--brand-text)"
            fontSize="10"
            fontWeight="700"
            fontFamily="var(--font-mono)"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------

function SectionHeader({
  tag,
  title,
  tagColor = "var(--brand-primary)",
}: {
  tag: string
  title: string
  tagColor?: string
}) {
  return (
    <div className="mb-6 sm:mb-8">
      <div
        className="text-[10px] sm:text-xs font-semibold uppercase tracking-[3px] mb-1.5"
        style={{ color: tagColor }}
      >
        {tag}
      </div>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h2>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card wrapper
// ---------------------------------------------------------------------------

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{
        background: "var(--brand-bg-alt)",
        border: "1px solid var(--brand-border)",
      }}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Role Replacement Badge
// ---------------------------------------------------------------------------

const REPLACED_ROLES = [
  { role: "Backend Engineer", icon: Server },
  { role: "Frontend Engineer", icon: Layers },
  { role: "AI/ML Engineer", icon: Brain },
  { role: "Security Engineer", icon: Shield },
  { role: "DevOps Engineer", icon: RefreshCw },
  { role: "Data Engineer", icon: Database },
  { role: "IoT Specialist", icon: Radio },
  { role: "Systems Programmer", icon: Cpu },
]

// ---------------------------------------------------------------------------
// Default cost model (fallback when cost-model.json is not yet available)
// ---------------------------------------------------------------------------

const DEFAULT_COST_MODEL: CostModelData = {
  legacy: {
    teamSize: 5,
    annualCost: 750000,
    sprintVelocity: 5,
    onboardingWeeks: 4,
    meetingPercent: 20,
    codingPercent: 35,
    reviewPercent: 12,
    testingPercent: 15,
    planningPercent: 8,
    adminPercent: 10,
  },
  aiAssisted: {
    productivePercent: 85,
    planningPercent: 10,
    deployPercent: 5,
  },
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TheShiftPage() {
  const [pilotData, setPilotData] = useState<AIPilotData | null>(null)
  const [costModel, setCostModel] = useState<CostModelData>(DEFAULT_COST_MODEL)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const pilotRes = await fetch("/data/ai-pilot-data.json")
        if (pilotRes.ok) {
          const data = await pilotRes.json()
          setPilotData(data)
        }
      } catch {
        // pilot data unavailable
      }

      try {
        const costRes = await fetch("/data/cost-model.json")
        if (costRes.ok) {
          const data = await costRes.json()
          setCostModel(data)
        }
      } catch {
        // cost model not built yet — use defaults
      }

      setLoading(false)
    }

    loadData()
  }, [])

  // Derived stats from pilot data
  const messages = pilotData?.license.totalMessages ?? 135232
  const projects = pilotData?.license.projectCount ?? 75
  const sessions = pilotData?.license.totalSessions ?? 237
  const activeDays = pilotData?.streaks.totalActiveDays ?? 34
  const peakDayCount = pilotData?.streaks.peakDayCount ?? 29092
  const longestStreak = pilotData?.streaks.longest ?? 23
  const cacheEfficiency = pilotData?.tokenEconomy.cacheEfficiency ?? 96.5
  const avgMessagesPerSession = sessions > 0 ? Math.round(messages / sessions) : 571
  const missionCount = pilotData?.missionLog?.length ?? 75

  // Domain data for radar
  const domainIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    "Backend": Server,
    "AI / ML": Brain,
    "Security": Shield,
    "Systems": Cpu,
    "Data Engineering": Database,
    "Frontend": Layers,
    "IoT / Edge": Radio,
    "DevOps": RefreshCw,
  }

  const radarDomains: RadarDomain[] = pilotData
    ? Object.entries(pilotData.instrumentRatings).map(([label, data]) => ({
        label: label.replace(" / ", "/"),
        score: data.score,
        icon: domainIcons[label] ?? Zap,
      }))
    : [
        { label: "Backend", score: 91, icon: Server },
        { label: "AI/ML", score: 73, icon: Brain },
        { label: "Security", score: 65, icon: Shield },
        { label: "Systems", score: 60, icon: Cpu },
        { label: "Frontend", score: 50, icon: Layers },
        { label: "Data Eng", score: 46, icon: Database },
        { label: "IoT/Edge", score: 45, icon: Radio },
        { label: "DevOps", score: 41, icon: RefreshCw },
      ]

  // Donut slices
  const legacySlices: DonutSlice[] = [
    { label: "Coding", value: costModel.legacy.codingPercent, color: "var(--brand-primary)" },
    { label: "Meetings", value: costModel.legacy.meetingPercent, color: "var(--brand-error, #ef4444)" },
    { label: "Testing", value: costModel.legacy.testingPercent, color: "var(--brand-secondary)" },
    { label: "Code Review", value: costModel.legacy.reviewPercent, color: "var(--brand-info)" },
    { label: "Planning", value: costModel.legacy.planningPercent, color: "var(--brand-warning)" },
    { label: "Admin", value: costModel.legacy.adminPercent, color: "var(--brand-steel)" },
  ]

  const aiSlices: DonutSlice[] = [
    { label: "Productive Output", value: costModel.aiAssisted.productivePercent, color: "var(--brand-primary)" },
    { label: "Planning/Review", value: costModel.aiAssisted.planningPercent, color: "var(--brand-secondary)" },
    { label: "Deployment", value: costModel.aiAssisted.deployPercent, color: "var(--brand-info)" },
  ]

  if (loading) {
    return (
      <div className="pt-20 sm:pt-24 pb-10 sm:pb-16">
        <div className="container-page">
          <div className="space-y-4 sm:space-y-6">
            <div className="h-48 rounded-2xl animate-pulse" style={{ background: "var(--brand-bg-alt)" }} />
            <div className="h-12 rounded-lg animate-pulse max-w-md" style={{ background: "var(--brand-bg-alt)" }} />
            <div className="h-96 rounded-lg animate-pulse" style={{ background: "var(--brand-bg-alt)" }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-20 sm:pt-24 pb-10 sm:pb-16">
      {/* ================================================================ */}
      {/* HERO                                                             */}
      {/* ================================================================ */}
      <section className="container-page mb-12 sm:mb-16">
        <FadeSection>
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 sm:mb-6 text-xs sm:text-sm font-medium"
            style={{
              background: "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)",
              color: "var(--brand-primary)",
            }}
          >
            <Zap className="w-3.5 h-3.5" />
            Thesis
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-4 sm:mb-6">
            The Shift
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl leading-relaxed max-w-[700px] mb-8" style={{ color: "var(--brand-steel)" }}>
            How AI rewrites the economics of building software.
          </p>

          {/* Stat row */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl p-4 sm:p-6"
            style={{
              background: "var(--brand-bg-alt)",
              border: "1px solid var(--brand-border)",
            }}
          >
            {[
              { val: messages, label: "Messages", color: "var(--brand-primary)" },
              { val: projects, label: "Projects", color: "var(--brand-secondary)" },
              { val: radarDomains.length, label: "Domains", color: "var(--brand-warning)" },
              { val: activeDays, label: "Active Days", color: "var(--brand-info)" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-4xl font-extrabold tabular-nums" style={{ color: s.color }}>
                  <Counter end={s.val} />
                </div>
                <div
                  className="text-[10px] sm:text-xs font-medium uppercase tracking-widest mt-0.5"
                  style={{ color: "var(--brand-muted)" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </FadeSection>
      </section>

      {/* ================================================================ */}
      {/* SECTION 1: From Teams to Soloists                                */}
      {/* ================================================================ */}
      <section className="container-page mb-12 sm:mb-20">
        <FadeSection>
          <SectionHeader tag="01 / Domain Coverage" title="From Teams to Soloists." tagColor="var(--brand-primary)" />
        </FadeSection>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-start">
          {/* Radar chart */}
          <FadeSection>
            <Card className="p-5 sm:p-8">
              <RadarChart domains={radarDomains} />
            </Card>
          </FadeSection>

          {/* Copy + role badges */}
          <FadeSection>
            <div className="space-y-6">
              <Card className="p-5 sm:p-6">
                <p className="text-base sm:text-lg leading-relaxed mb-4" style={{ color: "var(--brand-steel)" }}>
                  One person covering <span className="font-bold" style={{ color: "var(--brand-text)" }}>{radarDomains.length} engineering domains</span>.
                  Legacy model: <span className="font-bold" style={{ color: "var(--brand-text)" }}>4-6 specialists</span>.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--brand-muted)" }}>
                  AI doesn&apos;t just make you faster at what you already know. It makes adjacent
                  domains accessible. Security, DevOps, systems programming — domains that
                  previously required dedicated hires become reachable with the right copilot.
                </p>
              </Card>

              <Card className="p-5 sm:p-6">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[2px] mb-4"
                  style={{ color: "var(--brand-secondary)" }}
                >
                  Roles consolidated
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {REPLACED_ROLES.map(({ role, icon: Icon }) => (
                    <div
                      key={role}
                      className="flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg"
                      style={{
                        background: "color-mix(in srgb, var(--brand-primary) 5%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--brand-primary) 12%, transparent)",
                      }}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-primary)" }} />
                      <span style={{ color: "var(--brand-steel)" }}>{role}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 2: From Sprints to Streams                               */}
      {/* ================================================================ */}
      <section
        className="py-10 sm:py-16 mb-12 sm:mb-20"
        style={{
          background: "var(--brand-bg-alt)",
          borderTop: "1px solid var(--brand-border)",
          borderBottom: "1px solid var(--brand-border)",
        }}
      >
        <div className="container-page">
          <FadeSection>
            <SectionHeader tag="02 / Velocity" title="From Sprints to Streams." tagColor="var(--brand-secondary)" />
          </FadeSection>

          {/* Stats row */}
          <FadeSection>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { val: longestStreak, suffix: "d", label: "Longest Streak", color: "var(--brand-secondary)" },
                { val: peakDayCount, label: "Peak Day Messages", color: "var(--brand-primary)" },
                { val: avgMessagesPerSession, label: "Avg Msgs/Session", color: "var(--brand-warning)" },
                { val: sessions, label: "Total Sessions", color: "var(--brand-info)" },
              ].map((s) => (
                <Card key={s.label} className="p-4 text-center">
                  <div className="text-xl sm:text-3xl font-extrabold tabular-nums" style={{ color: s.color }}>
                    <Counter end={s.val} suffix={s.suffix} />
                  </div>
                  <div
                    className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest mt-1"
                    style={{ color: "var(--brand-muted)" }}
                  >
                    {s.label}
                  </div>
                </Card>
              ))}
            </div>
          </FadeSection>

          {/* Comparison bars */}
          <FadeSection>
            <Card className="p-5 sm:p-6">
              <div className="space-y-6">
                {/* Sprint model */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" style={{ color: "var(--brand-muted)" }} />
                      <span className="text-xs font-bold uppercase tracking-[2px]" style={{ color: "var(--brand-muted)" }}>
                        Sprint cadence
                      </span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: "var(--brand-muted)" }}>
                      ~{costModel.legacy.sprintVelocity} stories / 2 weeks
                    </span>
                  </div>
                  <div
                    className="h-3 rounded-full overflow-hidden"
                    style={{ background: "color-mix(in srgb, var(--brand-border) 50%, transparent)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: "25%",
                        background: "var(--brand-steel)",
                        opacity: 0.6,
                      }}
                    />
                  </div>
                </div>

                {/* AI-assisted model */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" style={{ color: "var(--brand-primary)" }} />
                      <span className="text-xs font-bold uppercase tracking-[2px]" style={{ color: "var(--brand-primary)" }}>
                        AI-assisted
                      </span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: "var(--brand-primary)" }}>
                      Continuous deployment
                    </span>
                  </div>
                  <div
                    className="h-3 rounded-full overflow-hidden"
                    style={{ background: "color-mix(in srgb, var(--brand-border) 50%, transparent)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: "95%",
                        background: "linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))",
                      }}
                    />
                  </div>
                </div>

                <p className="text-sm leading-relaxed pt-2" style={{ color: "var(--brand-muted)" }}>
                  The sprint model assumes work arrives in discrete batches. AI-assisted
                  development is continuous — deploy when ready, iterate in real-time, no
                  ceremony between idea and production.
                </p>
              </div>
            </Card>
          </FadeSection>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 3: From Meetings to Messages                             */}
      {/* ================================================================ */}
      <section className="container-page mb-12 sm:mb-20">
        <FadeSection>
          <SectionHeader tag="03 / Time Allocation" title="From Meetings to Messages." tagColor="var(--brand-warning)" />
        </FadeSection>

        {/* Big stat callout */}
        <FadeSection>
          <Card className="p-5 sm:p-8 mb-8 text-center">
            <div className="text-3xl sm:text-5xl md:text-6xl font-extrabold tabular-nums mb-2" style={{ color: "var(--brand-primary)" }}>
              <Counter end={messages} />{" "}
              <span className="text-lg sm:text-2xl font-medium" style={{ color: "var(--brand-muted)" }}>messages.</span>
            </div>
            <div className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-4" style={{ color: "var(--brand-secondary)" }}>
              0{" "}
              <span className="text-lg sm:text-2xl font-medium" style={{ color: "var(--brand-muted)" }}>meetings.</span>
            </div>
            <p className="text-sm max-w-lg mx-auto" style={{ color: "var(--brand-muted)" }}>
              Every message is productive output. No standups, no retros, no &ldquo;can you
              see my screen?&rdquo; — just building.
            </p>
          </Card>
        </FadeSection>

        {/* Donut comparison */}
        <FadeSection>
          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="p-5 sm:p-6">
              <div
                className="text-[10px] font-semibold uppercase tracking-[2px] mb-4 text-center"
                style={{ color: "var(--brand-steel)" }}
              >
                Legacy Dev Team
              </div>
              <DonutChart slices={legacySlices} label="35%" />
              <p className="text-xs text-center mt-4 font-mono" style={{ color: "var(--brand-muted)" }}>
                35% coding time. 65% overhead.
              </p>
            </Card>

            <Card className="p-5 sm:p-6">
              <div
                className="text-[10px] font-semibold uppercase tracking-[2px] mb-4 text-center"
                style={{ color: "var(--brand-primary)" }}
              >
                AI-Assisted Solo
              </div>
              <DonutChart slices={aiSlices} label="85%" />
              <p className="text-xs text-center mt-4 font-mono" style={{ color: "var(--brand-muted)" }}>
                85% productive output. Meetings eliminated.
              </p>
            </Card>
          </div>
        </FadeSection>
      </section>

      {/* ================================================================ */}
      {/* SECTION 4: The Cache Effect                                      */}
      {/* ================================================================ */}
      <section
        className="py-10 sm:py-16 mb-12 sm:mb-20"
        style={{
          background: "var(--brand-bg-alt)",
          borderTop: "1px solid var(--brand-border)",
          borderBottom: "1px solid var(--brand-border)",
        }}
      >
        <div className="container-page">
          <FadeSection>
            <SectionHeader tag="04 / Context" title="The Cache Effect." tagColor="var(--brand-info)" />
          </FadeSection>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Big stat */}
            <FadeSection>
              <Card className="p-6 sm:p-8 flex flex-col items-center justify-center text-center h-full">
                <div
                  className="text-5xl sm:text-7xl font-extrabold tabular-nums mb-3"
                  style={{ color: "var(--brand-primary)" }}
                >
                  {cacheEfficiency}
                  <span className="text-2xl sm:text-4xl">%</span>
                </div>
                <div
                  className="text-xs font-semibold uppercase tracking-[3px] mb-4"
                  style={{ color: "var(--brand-muted)" }}
                >
                  Cache Efficiency
                </div>

                {/* Visual bar */}
                <div className="w-full max-w-xs">
                  <div
                    className="h-4 rounded-full overflow-hidden"
                    style={{ background: "color-mix(in srgb, var(--brand-border) 50%, transparent)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${cacheEfficiency}%`,
                        background: "linear-gradient(90deg, var(--brand-primary), var(--brand-info))",
                      }}
                    />
                  </div>
                </div>
              </Card>
            </FadeSection>

            {/* Comparison points */}
            <FadeSection>
              <div className="space-y-4">
                <Card className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: "color-mix(in srgb, var(--brand-error, #ef4444) 10%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--brand-error, #ef4444) 20%, transparent)",
                      }}
                    >
                      <Clock className="w-5 h-5" style={{ color: "var(--brand-error, #ef4444)" }} />
                    </div>
                    <div>
                      <div className="text-sm font-bold mb-1">Legacy Onboarding</div>
                      <div className="text-2xl font-extrabold mb-1" style={{ color: "var(--brand-error, #ef4444)" }}>
                        2-6 weeks
                      </div>
                      <p className="text-xs" style={{ color: "var(--brand-muted)" }}>
                        New team member ramp-up. Context lost at every handoff.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)",
                      }}
                    >
                      <Zap className="w-5 h-5" style={{ color: "var(--brand-primary)" }} />
                    </div>
                    <div>
                      <div className="text-sm font-bold mb-1">AI Context Loading</div>
                      <div className="text-2xl font-extrabold mb-1" style={{ color: "var(--brand-primary)" }}>
                        Instant
                      </div>
                      <p className="text-xs" style={{ color: "var(--brand-muted)" }}>
                        No knowledge loss between projects. The conversation IS the knowledge base.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <p className="text-sm leading-relaxed" style={{ color: "var(--brand-steel)" }}>
                    96.5% of tokens are served from cache. That means the AI retains
                    virtually all context from prior work — project structure,
                    decisions, patterns. No re-explaining. No documentation lag. The
                    entire codebase is always loaded.
                  </p>
                </Card>
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 5: Compound Velocity                                     */}
      {/* ================================================================ */}
      <section className="container-page mb-12 sm:mb-20">
        <FadeSection>
          <SectionHeader tag="05 / Ecosystem" title="Compound Velocity." tagColor="var(--brand-secondary)" />
        </FadeSection>

        <FadeSection>
          <Card className="p-5 sm:p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <CompoundVelocityFlow />
                <p className="text-xs text-center mt-4 font-mono" style={{ color: "var(--brand-muted)" }}>
                  Self-reinforcing build cycle
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-base sm:text-lg leading-relaxed" style={{ color: "var(--brand-steel)" }}>
                  <span className="font-bold" style={{ color: "var(--brand-text)" }}>{missionCount} projects</span> aren&apos;t{" "}
                  {missionCount} isolated efforts — they&apos;re an interconnected ecosystem.
                </p>

                <div className="space-y-3">
                  {[
                    { label: "Sessions generate code", detail: `${messages.toLocaleString()} messages of building`, icon: MessageSquare },
                    { label: "Code feeds pipelines", detail: "Automated data aggregation and deployment", icon: GitBranch },
                    { label: "Pipelines power dashboards", detail: "Real-time analytics from AI usage data", icon: BarChart3 },
                    { label: "Dashboards surface insights", detail: "Patterns visible across all projects", icon: TrendingUp },
                    { label: "Insights accelerate building", detail: "Each cycle faster than the last", icon: ArrowRight },
                  ].map(({ label, detail, icon: Icon }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          background: "color-mix(in srgb, var(--brand-secondary) 10%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--brand-secondary) 18%, transparent)",
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: "var(--brand-secondary)" }} />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{label}</div>
                        <div className="text-xs" style={{ color: "var(--brand-muted)" }}>{detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </FadeSection>
      </section>

      {/* ================================================================ */}
      {/* CLOSING — CTA / TLDR                                             */}
      {/* ================================================================ */}
      <section className="container-page">
        <FadeSection>
          <Card className="p-6 sm:p-10 text-center">
            <div className="h-[3px] w-16 mx-auto mb-6 rounded-full" style={{ background: "var(--brand-primary)" }} />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mb-4">
              The old model isn&apos;t broken.
              <br />
              <span style={{ color: "var(--brand-primary)" }}>It&apos;s just no longer the only option.</span>
            </h2>
            <p className="text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-6" style={{ color: "var(--brand-muted)" }}>
              AI doesn&apos;t replace developers. It changes the ratio. One person with the
              right tools can now cover the ground that once required a team — faster,
              with less overhead, and with perfect context retention.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/ai-pilot"
                className="px-6 py-3 rounded-lg text-sm font-semibold transition-all inline-flex items-center justify-center gap-2"
                style={{
                  background: "var(--brand-primary)",
                  color: "var(--brand-bg)",
                }}
              >
                See the data <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/projects"
                className="px-6 py-3 rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-2"
                style={{
                  border: "1px solid color-mix(in srgb, var(--brand-secondary) 30%, transparent)",
                  color: "var(--brand-secondary)",
                }}
              >
                View projects <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </Card>
        </FadeSection>
      </section>
    </div>
  )
}
