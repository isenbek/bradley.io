"use client"

import { useMemo, useState } from "react"
import type { AIPilotData } from "@/components/ai-pilot/types"

type TabId = "activity" | "models" | "missions" | "competency"

const TABS: { id: TabId; label: string }[] = [
  { id: "activity", label: "Activity" },
  { id: "models", label: "Models" },
  { id: "missions", label: "Missions" },
  { id: "competency", label: "Competency" },
]

function compact(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T"
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B"
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k"
  return String(n)
}

function ActivityPanel({ data }: { data: AIPilotData }) {
  const heatmap = data.activityHeatmap
  const hourly = data.hourlyDistribution
  const peakHour = hourly.peakHour
  const peakCount = hourly.peakCount

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <article className="v3-panel">
        <div className="v3-panel-head">
          Activity heatmap · {heatmap.length} days
        </div>
        <div className="v3-heatmap">
          {heatmap.map((d) => (
            <div
              key={d.date}
              className="v3-heatmap__cell"
              data-i={d.intensity}
              title={`${d.date} — ${d.count} messages, ${d.sessions} sessions`}
              aria-label={`${d.date}: ${d.count} messages`}
            />
          ))}
        </div>
        <div className="v3-heatmap__legend">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="v3-heatmap__swatch v3-heatmap__cell"
              data-i={i}
            />
          ))}
          <span>More</span>
          <span style={{ marginLeft: "auto" }}>
            Peak day: {data.streaks.peakDay} ·{" "}
            {data.streaks.peakDayCount.toLocaleString()} msgs
          </span>
        </div>
      </article>

      <article className="v3-panel">
        <div className="v3-panel-head">
          Hourly distribution · peak {peakHour}:00 ({peakCount} msgs)
        </div>
        <div className="v3-bars">
          {hourly.hours.map((h) => {
            const pct = peakCount > 0 ? (h.count / peakCount) * 100 : 0
            const isPeak = h.hour === peakHour
            return (
              <div
                key={h.hour}
                className="v3-bars__bar"
                data-peak={isPeak ? "true" : "false"}
                style={{ height: `${Math.max(pct, 4)}%` }}
                title={`${h.label} — ${h.count} messages`}
                aria-label={`${h.label}: ${h.count} messages`}
              />
            )
          })}
        </div>
        <div className="v3-bars__xaxis">
          {["0", "3", "6", "9", "12", "15", "18", "21"].map((h) => (
            <span key={h}>{h}h</span>
          ))}
        </div>
      </article>
    </div>
  )
}

function ModelsPanel({ data }: { data: AIPilotData }) {
  const ratings = [...data.typeRatings].sort((a, b) => b.costShare - a.costShare)
  const economy = data.tokenEconomy

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <article className="v3-panel">
        <div className="v3-panel-head">Type ratings · models flown</div>
        <div>
          {ratings.map((r) => (
            <div key={r.modelId} className="v3-model">
              <div className="v3-model__name">
                <span className="v3-model__lbl">{r.displayName}</span>
                <span className="v3-model__sub">
                  {compact(r.inputTokens + r.outputTokens)} tokens ·{" "}
                  {(r.costShare * 100).toFixed(1)}% of usage
                </span>
              </div>
              <div className="v3-model__share">
                <div
                  className="v3-model__share-fill"
                  style={{ width: `${Math.max(r.costShare * 100, 2)}%` }}
                />
              </div>
              <div className="v3-model__prof">{r.proficiency}</div>
            </div>
          ))}
        </div>
      </article>

      <article className="v3-panel">
        <div className="v3-panel-head">Token economy</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14,
          }}
        >
          {[
            { lbl: "Input", val: compact(economy.totalInputTokens) },
            { lbl: "Output", val: compact(economy.totalOutputTokens) },
            { lbl: "Cache read", val: compact(economy.totalCacheReadTokens) },
            { lbl: "Cache create", val: compact(economy.totalCacheCreateTokens) },
            {
              lbl: "Cache efficiency",
              val: `${(economy.cacheEfficiency * 100).toFixed(1)}%`,
            },
            { lbl: "Web searches", val: economy.webSearches.toLocaleString() },
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
              <div className="v3-stylemix__lbl">{s.lbl}</div>
              <div
                className="v3-font-display"
                style={{
                  fontWeight: 800,
                  fontSize: 24,
                  color: "var(--v3-blue-700)",
                  marginTop: 4,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {s.val}
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}

function MissionsPanel({ data }: { data: AIPilotData }) {
  const missions = [...data.missionLog]
    .sort((a, b) => b.complexity - a.complexity)
    .slice(0, 20)

  return (
    <article className="v3-panel">
      <div className="v3-panel-head">
        Mission log · top {missions.length} by complexity
      </div>
      <div>
        {missions.map((m) => (
          <div key={m.name} className="v3-mission">
            <div>
              <div className="v3-mission__name">{m.name}</div>
              <div className="v3-mission__meta">
                <span>{m.domain}</span>
                <span>· {m.sessions} sessions</span>
                <span>· {m.messages.toLocaleString()} msgs</span>
                <span>· {m.status}</span>
              </div>
              {m.technologies.length > 0 ? (
                <div className="v3-mission__tech">
                  {m.technologies.slice(0, 8).map((t) => (
                    <span key={t} className="v3-mission__chip">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="v3-mission__complexity">
              complexity {m.complexity.toFixed(1)}
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

function CompetencyPanel({ data }: { data: AIPilotData }) {
  const axes = data.competencyRadar
  const maxScore = Math.max(...axes.map((a) => a.score), 1)
  const style = data.pilotingStyle

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 22,
      }}
    >
      <article className="v3-panel">
        <div className="v3-panel-head">Competency profile</div>
        <div>
          {axes.map((a) => (
            <div key={a.axis} className="v3-score">
              <div className="v3-score__lbl">{a.axis}</div>
              <div
                className="v3-score__track"
                title={a.detail}
              >
                <div
                  className="v3-score__fill"
                  style={{ width: `${(a.score / maxScore) * 100}%` }}
                />
              </div>
              <div className="v3-score__val">{a.score}</div>
            </div>
          ))}
        </div>
      </article>

      <article className="v3-panel">
        <div className="v3-panel-head">Piloting style</div>
        <p
          className="v3-font-display"
          style={{
            fontWeight: 700,
            fontSize: 20,
            color: "var(--v3-charcoal)",
            letterSpacing: "-0.015em",
            marginBottom: 6,
          }}
        >
          {style.label}
        </p>
        <p
          style={{
            fontSize: 14,
            color: "var(--v3-ink)",
            lineHeight: 1.55,
            marginBottom: 18,
          }}
        >
          {style.description}
        </p>
        <div className="v3-stylemix">
          {[
            { lbl: "Directive", val: style.directive },
            { lbl: "Collaborative", val: style.collaborative },
            { lbl: "Plan first", val: style.planFirst },
            { lbl: "Iterate", val: style.iterate },
          ].map((s) => (
            <div key={s.lbl} className="v3-stylemix__cell">
              <div className="v3-stylemix__lbl">{s.lbl}</div>
              <div className="v3-stylemix__val">
                {Math.round(s.val * 100)}
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--v3-slate)",
                    marginLeft: 4,
                  }}
                >
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  )
}

export function V3PilotDashboard({ data }: { data: AIPilotData }) {
  const [tab, setTab] = useState<TabId>("activity")

  const issuedFmt = useMemo(
    () =>
      new Date(data.license.issued).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }),
    [data.license.issued]
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* LICENSE CARD ==================================================== */}
      <div className="v3-license">
        <div className="v3-license__head">
          <div className="v3-license__brand">
            FAA · Federation of AI Aviation · {data.license.number}
          </div>
          <div className="v3-license__class">{data.license.class}</div>
        </div>
        <div className="v3-license__name">Bradley Isenbek</div>
        <div className="v3-license__role">
          Airline Transport · Multi-engine · Instrument rated
        </div>

        <div className="v3-license__grid">
          <div className="v3-license__stat">
            <span className="v3-license__stat-lbl">Sessions</span>
            <span className="v3-license__stat-val">
              {data.license.totalSessions.toLocaleString()}
            </span>
            <span className="v3-license__stat-sub">total flights</span>
          </div>
          <div className="v3-license__stat">
            <span className="v3-license__stat-lbl">Messages</span>
            <span className="v3-license__stat-val">
              {data.license.totalMessages.toLocaleString()}
            </span>
            <span className="v3-license__stat-sub">across all flights</span>
          </div>
          <div className="v3-license__stat">
            <span className="v3-license__stat-lbl">Cache tokens</span>
            <span className="v3-license__stat-val">
              {compact(data.license.totalCacheTokens)}
            </span>
            <span className="v3-license__stat-sub">read + create</span>
          </div>
          <div className="v3-license__stat">
            <span className="v3-license__stat-lbl">Projects</span>
            <span className="v3-license__stat-val">
              {data.license.projectCount}
            </span>
            <span className="v3-license__stat-sub">
              · {data.license.modelCount} models flown
            </span>
          </div>
        </div>

        <div className="v3-license__meta">
          <span>Issued {issuedFmt}</span>
          <span>Expires {data.license.expires}</span>
        </div>
      </div>

      {/* STREAK BANNER =================================================== */}
      <article
        className="v3-panel"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 16,
          alignItems: "center",
          background:
            "linear-gradient(135deg, #FCF2D8 0%, var(--v3-white) 60%, var(--v3-paper))",
        }}
      >
        {[
          { lbl: "Current streak", val: `${data.streaks.current}d` },
          { lbl: "Longest streak", val: `${data.streaks.longest}d` },
          { lbl: "Active days", val: data.streaks.totalActiveDays },
          {
            lbl: "Peak day",
            val: data.streaks.peakDayCount.toLocaleString(),
            sub: data.streaks.peakDay,
          },
        ].map((s) => (
          <div key={s.lbl}>
            <div className="v3-stylemix__lbl">{s.lbl}</div>
            <div
              className="v3-font-display"
              style={{
                fontWeight: 800,
                fontSize: 28,
                color: "var(--v3-gold-dk)",
                marginTop: 4,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {s.val}
            </div>
            {s.sub ? (
              <div
                style={{
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 11,
                  color: "var(--v3-slate)",
                  marginTop: 2,
                }}
              >
                {s.sub}
              </div>
            ) : null}
          </div>
        ))}
      </article>

      {/* TABS ============================================================ */}
      <div className="v3-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            data-active={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT ====================================================== */}
      <div>
        {tab === "activity" && <ActivityPanel data={data} />}
        {tab === "models" && <ModelsPanel data={data} />}
        {tab === "missions" && <MissionsPanel data={data} />}
        {tab === "competency" && <CompetencyPanel data={data} />}
      </div>
    </div>
  )
}
