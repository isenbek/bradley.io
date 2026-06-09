"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowRight,
  BarChart3,
  Brain,
  Clock,
  Cpu,
  Database,
  GitBranch,
  Layers,
  MessageSquare,
  Radio,
  RefreshCw,
  Server,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react"
import type { AIPilotData } from "@/components/ai-pilot/types"
import type { CostModel } from "../cost-analysis/V3CostDashboard"

interface RadarDomain {
  label: string
  score: number
}

// --- Counter ---
function Counter({
  end,
  suffix = "",
  duration = 1500,
}: {
  end: number
  suffix?: string
  duration?: number
}) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        let start = 0
        const step = end / (duration / 16)
        const tick = () => {
          start += step
          if (start >= end) {
            setVal(end)
            return
          }
          setVal(Math.floor(start))
          requestAnimationFrame(tick)
        }
        tick()
        obs.disconnect()
      },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration])

  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  )
}

// --- Radar Chart ---
function RadarChart({ domains }: { domains: RadarDomain[] }) {
  const n = Math.max(domains.length, 3)
  const cx = 200,
    cy = 200,
    maxR = 150
  const levels = [20, 40, 60, 80, 100]
  const angleStep = (2 * Math.PI) / n
  const getPoint = (i: number, v: number) => {
    const a = angleStep * i - Math.PI / 2
    const r = (v / 100) * maxR
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  }

  const gridPaths = levels.map((lev) =>
    domains
      .map((_, i) => getPoint(i, lev))
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
      .join(" ") + " Z"
  )

  const dataPoints = domains.map((d, i) => getPoint(i, d.score))
  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z"
  const axisEnds = domains.map((_, i) => getPoint(i, 100))
  const labelPoints = domains.map((_, i) => getPoint(i, 122))

  return (
    <svg viewBox="0 0 400 400" style={{ width: "100%", maxWidth: 400, margin: "0 auto", display: "block" }}>
      <defs>
        <radialGradient id="v3-radar-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--v3-blue-500)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--v3-blue-500)" stopOpacity="0.05" />
        </radialGradient>
      </defs>

      {gridPaths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="var(--v3-line)"
          strokeWidth="1"
          opacity={0.4 + i * 0.12}
        />
      ))}

      {axisEnds.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          stroke="var(--v3-line)"
          strokeWidth="1"
          opacity="0.35"
        />
      ))}

      <path d={dataPath} fill="url(#v3-radar-fill)" stroke="var(--v3-blue-600)" strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--v3-blue-600)" />
      ))}

      {labelPoints.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={p.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--v3-slate)"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
          fontWeight="600"
        >
          <tspan>{domains[i].label}</tspan>
          <tspan
            x={p.x}
            dy="14"
            fill="var(--v3-blue-700)"
            fontSize="12"
            fontWeight="800"
          >
            {domains[i].score}
          </tspan>
        </text>
      ))}
    </svg>
  )
}

// --- Donut Chart ---
interface DonutSlice {
  label: string
  value: number
  color: string
}

function DonutChart({ slices, centerLabel }: { slices: DonutSlice[]; centerLabel: string }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0)
  const r = 80,
    cx = 100,
    cy = 100,
    stroke = 28
  const c = 2 * Math.PI * r

  let cumulative = 0

  return (
    <div style={{ textAlign: "center" }}>
      <svg
        viewBox="0 0 200 200"
        style={{ width: "100%", maxWidth: 180, margin: "0 auto", display: "block" }}
      >
        {slices.map((slice, i) => {
          const pct = slice.value / total
          const dashLen = pct * c
          const dashOff = -(cumulative / total) * c
          cumulative += slice.value
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth={stroke}
              strokeDasharray={`${dashLen} ${c - dashLen}`}
              strokeDashoffset={dashOff}
              transform={`rotate(-90 ${cx} ${cy})`}
              opacity="0.9"
            />
          )
        })}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill="var(--v3-charcoal)"
          fontSize="16"
          fontWeight="800"
          fontFamily="ui-monospace, monospace"
        >
          {centerLabel}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          fill="var(--v3-slate)"
          fontSize="8.5"
          fontWeight="600"
          letterSpacing="0.18em"
        >
          ALLOCATED
        </text>
      </svg>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "6px 14px",
          marginTop: 12,
          fontFamily: "var(--font-v3-mono), monospace",
          fontSize: 11,
          color: "var(--v3-slate)",
        }}
      >
        {slices.map((s, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: s.color,
                flexShrink: 0,
              }}
            />
            {s.label} {s.value}%
          </span>
        ))}
      </div>
    </div>
  )
}

// --- Compound Velocity Flow ---
function CompoundFlow() {
  const nodes = [
    { label: "Sessions", x: 60, y: 50 },
    { label: "Pipelines", x: 200, y: 50 },
    { label: "Dashboards", x: 340, y: 50 },
    { label: "Insights", x: 275, y: 155 },
    { label: "Build more", x: 125, y: 155 },
  ]
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 0],
  ]

  return (
    <svg
      viewBox="0 0 400 210"
      style={{ width: "100%", maxWidth: 500, margin: "0 auto", display: "block" }}
    >
      <defs>
        <marker
          id="v3-flow-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--v3-coral)" opacity="0.7" />
        </marker>
      </defs>

      {edges.map(([from, to], i) => (
        <line
          key={i}
          x1={nodes[from].x}
          y1={nodes[from].y}
          x2={nodes[to].x}
          y2={nodes[to].y}
          stroke="var(--v3-coral)"
          strokeWidth="1.5"
          opacity="0.45"
          markerEnd="url(#v3-flow-arrow)"
        />
      ))}

      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.x}
            cy={n.y}
            r="32"
            fill="color-mix(in srgb, var(--v3-coral) 10%, white)"
            stroke="var(--v3-coral)"
            strokeWidth="1.5"
            opacity="0.85"
          />
          <text
            x={n.x}
            y={n.y + 4}
            textAnchor="middle"
            fill="var(--v3-charcoal)"
            fontSize="10.5"
            fontWeight="700"
            fontFamily="ui-monospace, monospace"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

// --- Section Header ---
function SectionHeader({
  tag,
  title,
}: {
  tag: string
  title: string
}) {
  return (
    <div className="v3-sec-head" style={{ marginBottom: 28 }}>
      <div className="v3-sec-head__num">{tag}</div>
      <h2 style={{ marginBottom: 0 }}>{title}</h2>
    </div>
  )
}

const REPLACED_ROLES = [
  { role: "Backend Engineer", Icon: Server },
  { role: "Frontend Engineer", Icon: Layers },
  { role: "AI/ML Engineer", Icon: Brain },
  { role: "Security Engineer", Icon: Shield },
  { role: "DevOps Engineer", Icon: RefreshCw },
  { role: "Data Engineer", Icon: Database },
  { role: "IoT Specialist", Icon: Radio },
  { role: "Systems Programmer", Icon: Cpu },
] as const

export function V3ShiftPage({
  pilot,
  cost,
}: {
  pilot: AIPilotData | null
  cost: CostModel | null
}) {
  const messages = pilot?.license.totalMessages ?? 303000
  const projects = pilot?.license.projectCount ?? 75
  const sessions = pilot?.license.totalSessions ?? 357
  const activeDays = pilot?.streaks.totalActiveDays ?? 34
  const peakDayCount = pilot?.streaks.peakDayCount ?? 113241
  const longestStreak = pilot?.streaks.longest ?? 14
  const cacheEfficiency = pilot
    ? Math.round(pilot.tokenEconomy.cacheEfficiency * 100) / 100
    : 96.5
  const cacheEffWhole = Math.round(cacheEfficiency)
  const avgMessagesPerSession = sessions > 0 ? Math.round(messages / sessions) : 850
  const missionCount = pilot?.missionLog.length ?? projects

  // Radar — competency from pilot data
  const radarDomains: RadarDomain[] = pilot
    ? Object.entries(pilot.instrumentRatings).map(([label, d]) => ({
        label: label.replace(" / ", "/"),
        score: d.score,
      }))
    : [
        { label: "Backend", score: 91 },
        { label: "AI/ML", score: 70 },
        { label: "Security", score: 56 },
        { label: "Systems", score: 60 },
        { label: "Frontend", score: 54 },
        { label: "Data Eng", score: 46 },
        { label: "IoT/Edge", score: 43 },
        { label: "DevOps", score: 38 },
      ]

  // Time donuts — pull from cost-model when available
  const legacySlices: DonutSlice[] = cost
    ? [
        {
          label: "Coding",
          value: cost.industryBenchmarks.codingTimePercent,
          color: "#13B8F3",
        },
        {
          label: "Meetings",
          value: cost.industryBenchmarks.meetingTimePercent,
          color: "#EE766C",
        },
        {
          label: "Review",
          value: cost.industryBenchmarks.codeReviewPercent,
          color: "#A855F7",
        },
        { label: "Testing", value: 15, color: "#EDB427" },
        { label: "Admin", value: 18, color: "#6B6B62" },
      ]
    : [
        { label: "Coding", value: 35, color: "#13B8F3" },
        { label: "Meetings", value: 20, color: "#EE766C" },
        { label: "Review", value: 12, color: "#A855F7" },
        { label: "Testing", value: 15, color: "#EDB427" },
        { label: "Admin", value: 18, color: "#6B6B62" },
      ]

  const aiSlices: DonutSlice[] = [
    { label: "Productive output", value: 85, color: "#13B8F3" },
    { label: "Planning/review", value: 10, color: "#169E73" },
    { label: "Deploy/ops", value: 5, color: "#6B6B62" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
      {/* HERO STAT ROW =============================================== */}
      <article
        className="v3-panel"
        style={{
          background:
            "linear-gradient(135deg, var(--v3-blue-50), var(--v3-white) 60%, var(--v3-paper))",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 0,
          }}
        >
          {[
            {
              val: messages,
              lbl: "Messages",
              color: "var(--v3-blue-700)",
            },
            {
              val: projects,
              lbl: "Projects",
              color: "var(--v3-coral-dk)",
            },
            {
              val: radarDomains.length,
              lbl: "Domains",
              color: "var(--v3-gold-dk)",
            },
            {
              val: activeDays,
              lbl: "Active days",
              color: "var(--v3-green-dk)",
            },
          ].map((s) => (
            <div
              key={s.lbl}
              style={{ textAlign: "center", padding: "14px 8px" }}
            >
              <div
                className="v3-font-display"
                style={{
                  fontWeight: 800,
                  fontSize: 38,
                  letterSpacing: "-0.025em",
                  color: s.color,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                <Counter end={s.val} />
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
      </article>

      {/* 01 — TEAMS TO SOLOISTS ===================================== */}
      <section>
        <SectionHeader
          tag="01 / DOMAIN COVERAGE"
          title="From teams to soloists."
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
            alignItems: "start",
          }}
        >
          <article className="v3-panel" style={{ padding: "24px 20px" }}>
            <RadarChart domains={radarDomains} />
            <p
              style={{
                textAlign: "center",
                fontFamily: "var(--font-v3-mono), monospace",
                fontSize: 11,
                color: "var(--v3-slate)",
                marginTop: 10,
              }}
            >
              Domain coverage score (0–100) · radar from competency ratings
            </p>
          </article>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <article className="v3-panel">
              <p
                className="v3-prose"
                style={{ fontSize: 16, marginBottom: 14 }}
              >
                One person covering{" "}
                <strong style={{ color: "var(--v3-charcoal)" }}>
                  {radarDomains.length} engineering domains
                </strong>
                . Legacy model:{" "}
                <strong style={{ color: "var(--v3-charcoal)" }}>
                  4–6 specialists
                </strong>
                .
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--v3-ink)",
                  lineHeight: 1.55,
                }}
              >
                AI doesn&apos;t just make you faster at what you already know. It makes
                adjacent domains accessible — security, DevOps, systems programming.
                Domains that used to need a dedicated hire become reachable with the right
                co-pilot.
              </p>
            </article>

            <article className="v3-panel">
              <div className="v3-panel-head">Roles consolidated</div>
              <div className="v3-roles-grid">
                {REPLACED_ROLES.map(({ role, Icon }) => (
                  <div key={role} className="v3-rolechip">
                    <Icon size={14} strokeWidth={2.25} />
                    {role}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 02 — SPRINTS TO STREAMS ==================================== */}
      <section>
        <SectionHeader
          tag="02 / VELOCITY"
          title="From sprints to streams."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            {
              val: longestStreak,
              suffix: "d",
              lbl: "Longest streak",
              color: "var(--v3-coral-dk)",
            },
            {
              val: peakDayCount,
              lbl: "Peak day msgs",
              color: "var(--v3-blue-700)",
            },
            {
              val: avgMessagesPerSession,
              lbl: "Avg msgs / session",
              color: "var(--v3-gold-dk)",
            },
            {
              val: sessions,
              lbl: "Total sessions",
              color: "var(--v3-green-dk)",
            },
          ].map((s) => (
            <div
              key={s.lbl}
              className="v3-panel"
              style={{ textAlign: "center", padding: "16px 8px" }}
            >
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
                <Counter end={s.val} suffix={s.suffix} />
              </div>
              <div
                style={{
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 10,
                  letterSpacing: "0.14em",
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

        <article className="v3-panel">
          <div className="v3-compare">
            <div className="v3-compare__row">
              <div className="v3-compare__head">
                <span
                  className="v3-compare__lbl"
                  style={{ color: "var(--v3-slate)" }}
                >
                  <Clock size={13} strokeWidth={2.25} />
                  Sprint cadence
                </span>
                <span className="v3-compare__meta">
                  ~{cost?.legacy.teamSize ?? 9} devs · 2-week sprints
                </span>
              </div>
              <div className="v3-compare__track">
                <div className="v3-compare__fill v3-compare__fill--legacy" style={{ width: "25%" }} />
              </div>
            </div>
            <div className="v3-compare__row">
              <div className="v3-compare__head">
                <span
                  className="v3-compare__lbl"
                  style={{ color: "var(--v3-blue-700)" }}
                >
                  <Zap size={13} strokeWidth={2.25} />
                  AI-assisted
                </span>
                <span
                  className="v3-compare__meta"
                  style={{ color: "var(--v3-blue-700)" }}
                >
                  continuous deployment
                </span>
              </div>
              <div className="v3-compare__track">
                <div className="v3-compare__fill v3-compare__fill--ai" style={{ width: "95%" }} />
              </div>
            </div>
          </div>
          <p
            style={{
              fontSize: 14,
              color: "var(--v3-ink)",
              lineHeight: 1.55,
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px dashed var(--v3-line)",
            }}
          >
            The sprint model assumes work arrives in discrete batches. AI-assisted
            development is continuous — deploy when ready, iterate in real time, no
            ceremony between idea and production.
          </p>
        </article>
      </section>

      {/* 03 — MEETINGS TO MESSAGES ================================== */}
      <section>
        <SectionHeader
          tag="03 / TIME ALLOCATION"
          title="From meetings to messages."
        />

        <article className="v3-panel" style={{ marginBottom: 20 }}>
          <div className="v3-callout">
            <div className="v3-callout__num v3-callout__num--blue">
              <Counter end={messages} />
              <span className="v3-callout__word">messages.</span>
            </div>
            <div
              className="v3-callout__num v3-callout__num--coral"
              style={{ marginTop: 14 }}
            >
              0<span className="v3-callout__word">meetings.</span>
            </div>
            <p
              style={{
                fontSize: 14,
                color: "var(--v3-slate)",
                maxWidth: 460,
                margin: "20px auto 0",
              }}
            >
              Every message is productive output. No standups, no retros, no &ldquo;can
              you see my screen?&rdquo; — just building.
            </p>
          </div>
        </article>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          <article className="v3-panel">
            <div className="v3-panel-head" style={{ textAlign: "center" }}>
              Legacy dev team
            </div>
            <DonutChart
              slices={legacySlices}
              centerLabel={`${cost?.industryBenchmarks.codingTimePercent ?? 35}%`}
            />
            <p
              style={{
                textAlign: "center",
                marginTop: 12,
                fontFamily: "var(--font-v3-mono), monospace",
                fontSize: 11.5,
                color: "var(--v3-slate)",
              }}
            >
              {cost?.industryBenchmarks.codingTimePercent ?? 35}% coding. The rest is
              overhead.
            </p>
          </article>

          <article className="v3-panel">
            <div className="v3-panel-head" style={{ textAlign: "center" }}>
              AI-assisted solo
            </div>
            <DonutChart slices={aiSlices} centerLabel="85%" />
            <p
              style={{
                textAlign: "center",
                marginTop: 12,
                fontFamily: "var(--font-v3-mono), monospace",
                fontSize: 11.5,
                color: "var(--v3-slate)",
              }}
            >
              85% productive output. Meetings eliminated.
            </p>
          </article>
        </div>
      </section>

      {/* 04 — THE CACHE EFFECT ===================================== */}
      <section>
        <SectionHeader
          tag="04 / CONTEXT"
          title="The cache effect."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          <article
            className="v3-panel"
            style={{
              textAlign: "center",
              padding: "40px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              className="v3-font-display"
              style={{
                fontWeight: 800,
                fontSize: "clamp(56px, 9vw, 88px)",
                letterSpacing: "-0.035em",
                color: "var(--v3-blue-700)",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <Counter end={cacheEffWhole} />
              <span style={{ fontSize: "0.4em", marginLeft: 4 }}>%</span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-v3-mono), monospace",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--v3-slate)",
                marginTop: 14,
              }}
            >
              Cache efficiency
            </div>
            <div
              style={{
                width: "100%",
                maxWidth: 280,
                height: 8,
                background: "var(--v3-paper)",
                borderRadius: "var(--v3-r-pill)",
                marginTop: 18,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(cacheEffWhole, 100)}%`,
                  height: "100%",
                  background:
                    "linear-gradient(90deg, var(--v3-blue-400), var(--v3-blue-700))",
                  borderRadius: "var(--v3-r-pill)",
                }}
              />
            </div>
          </article>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="v3-cachepoint">
              <div className="v3-cachepoint__icon v3-cachepoint__icon--coral">
                <Clock size={20} strokeWidth={2.25} />
              </div>
              <div>
                <div className="v3-cachepoint__lbl">Legacy onboarding</div>
                <div className="v3-cachepoint__big v3-cachepoint__big--coral">2–6 weeks</div>
                <p className="v3-cachepoint__desc">
                  New team member ramp-up. Context lost at every handoff.
                </p>
              </div>
            </div>

            <div className="v3-cachepoint">
              <div className="v3-cachepoint__icon">
                <Zap size={20} strokeWidth={2.25} />
              </div>
              <div>
                <div className="v3-cachepoint__lbl">AI context loading</div>
                <div className="v3-cachepoint__big v3-cachepoint__big--blue">Instant</div>
                <p className="v3-cachepoint__desc">
                  No knowledge loss between projects. The conversation IS the knowledge
                  base.
                </p>
              </div>
            </div>

            <article className="v3-panel" style={{ padding: "16px 18px" }}>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--v3-ink)",
                  lineHeight: 1.55,
                }}
              >
                {cacheEfficiency}% of tokens are served from cache. The AI retains
                virtually all context from prior work — project structure, decisions,
                patterns. No re-explaining. No documentation lag. The entire codebase is
                always loaded.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 05 — COMPOUND VELOCITY ===================================== */}
      <section>
        <SectionHeader
          tag="05 / ECOSYSTEM"
          title="Compound velocity."
        />

        <article className="v3-panel">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 28,
              alignItems: "center",
            }}
          >
            <div>
              <CompoundFlow />
              <p
                style={{
                  textAlign: "center",
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 11,
                  color: "var(--v3-slate)",
                  marginTop: 10,
                }}
              >
                Self-reinforcing build cycle
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p
                className="v3-prose"
                style={{ fontSize: 16, marginBottom: 4 }}
              >
                <strong style={{ color: "var(--v3-charcoal)" }}>
                  {missionCount} projects
                </strong>{" "}
                aren&apos;t {missionCount} isolated efforts — they&apos;re an
                interconnected ecosystem.
              </p>
              <div className="v3-cycle">
                {[
                  {
                    Icon: MessageSquare,
                    label: "Sessions generate code",
                    detail: `${messages.toLocaleString()} messages of building`,
                  },
                  {
                    Icon: GitBranch,
                    label: "Code feeds pipelines",
                    detail: "Automated data aggregation and deployment",
                  },
                  {
                    Icon: BarChart3,
                    label: "Pipelines power dashboards",
                    detail: "Real-time analytics from AI usage data",
                  },
                  {
                    Icon: TrendingUp,
                    label: "Dashboards surface insights",
                    detail: "Patterns visible across all projects",
                  },
                  {
                    Icon: ArrowRight,
                    label: "Insights accelerate building",
                    detail: "Each cycle faster than the last",
                  },
                ].map((step) => (
                  <div key={step.label} className="v3-cycle__row">
                    <div className="v3-cycle__ico">
                      <step.Icon size={14} strokeWidth={2.25} />
                    </div>
                    <div>
                      <div className="v3-cycle__lbl">{step.label}</div>
                      <div className="v3-cycle__det">{step.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* CLOSING ===================================================== */}
      <section>
        <article
          className="v3-panel"
          style={{
            background:
              "linear-gradient(135deg, var(--v3-blue-50), var(--v3-white) 50%, #FBE6E3)",
            textAlign: "center",
            padding: "48px 28px",
          }}
        >
          <div
            style={{
              width: 64,
              height: 4,
              background: "var(--v3-blue-500)",
              borderRadius: 2,
              margin: "0 auto 22px",
            }}
          />
          <h2
            className="v3-font-display"
            style={{
              fontSize: "clamp(24px, 4vw, 36px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              margin: "0 0 12px",
              textWrap: "balance",
            }}
          >
            The old model isn&apos;t broken.{" "}
            <br />
            <span style={{ color: "var(--v3-blue-700)" }}>
              It&apos;s just no longer the only option.
            </span>
          </h2>
          <p
            style={{
              maxWidth: 540,
              margin: "0 auto 24px",
              fontSize: 16,
              lineHeight: 1.55,
              color: "var(--v3-ink)",
            }}
          >
            AI doesn&apos;t replace developers. It changes the ratio. One person with the
            right tools can now cover the ground that once required a team — faster, with
            less overhead, and with perfect context retention.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a href="/ai-pilot" className="v3-btn v3-btn--primary">
              See the data →
            </a>
            <a href="/projects" className="v3-btn v3-btn--ghost">
              View projects
            </a>
          </div>
        </article>
      </section>
    </div>
  )
}
