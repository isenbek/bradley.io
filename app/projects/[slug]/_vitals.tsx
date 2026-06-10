import { Bot, Clock, GitBranch, MessageSquare, Star } from "lucide-react"
import type { Project } from "@/lib/site-data"

function timeSince(iso: string): { label: string; tone: "ok" | "warn" | "stale" } {
  const t = new Date(iso).getTime()
  const days = (Date.now() - t) / 86_400_000
  if (days < 1) return { label: "today", tone: "ok" }
  if (days < 7) return { label: `${Math.round(days)}d ago`, tone: "ok" }
  if (days < 30) return { label: `${Math.round(days)}d ago`, tone: "warn" }
  if (days < 365) return { label: `${Math.round(days / 30)}mo ago`, tone: "warn" }
  return { label: `${(days / 365).toFixed(1)}yr ago`, tone: "stale" }
}

function compact(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k"
  return String(n)
}

/** 4-tile vitals strip: messages · sessions · sources · last touched. */
export function VitalsStrip({ project }: { project: Project }) {
  const sources = project.sources
  const sessions =
    (sources.claudeCode?.totalSessions ?? 0) +
    (sources.claudeWeb?.conversationCount ?? 0)
  const sourceCount = [sources.claudeCode, sources.claudeWeb, sources.github].filter(Boolean)
    .length
  const touched = timeSince(project.lastActivity)
  const touchedColor =
    touched.tone === "ok"
      ? "var(--v3-green-dk)"
      : touched.tone === "warn"
      ? "var(--v3-gold-dk)"
      : "var(--v3-coral-dk)"

  return (
    <div className="v3-statbar">
      <div className="v3-statbar__cell">
        <div className="v3-statbar__val" style={{ color: "var(--v3-blue-700)" }}>
          {compact(project.totalMessages)}
        </div>
        <div className="v3-statbar__lbl">Messages</div>
      </div>
      <div className="v3-statbar__cell">
        <div className="v3-statbar__val" style={{ color: "var(--v3-coral-dk)" }}>
          {sessions}
        </div>
        <div className="v3-statbar__lbl">Sessions</div>
      </div>
      <div className="v3-statbar__cell">
        <div className="v3-statbar__val" style={{ color: "var(--v3-gold-dk)" }}>
          {sourceCount}
        </div>
        <div className="v3-statbar__lbl">Sources</div>
      </div>
      <div className="v3-statbar__cell">
        <div className="v3-statbar__val" style={{ color: touchedColor, fontSize: 22 }}>
          {touched.label}
        </div>
        <div className="v3-statbar__lbl">Last touched</div>
      </div>
    </div>
  )
}

/** Stacked horizontal bar showing message split across sources. */
export function SourceContribution({ project }: { project: Project }) {
  const cc = project.sources.claudeCode?.totalMessages ?? 0
  const cw = project.sources.claudeWeb?.totalMessages ?? 0
  // GitHub doesn't expose a "messages" — approximate with a fixed presence weight
  // so it shows on the bar when present.
  const gh = project.sources.github ? Math.max(Math.round((cc + cw) * 0.06), 1) : 0
  const total = cc + cw + gh || 1

  type Seg = { lbl: string; n: number; color: string; Icon: typeof Bot }
  const segs: Seg[] = []
  if (cc) segs.push({ lbl: "Claude Code", n: cc, color: "var(--v3-blue-600)", Icon: Bot })
  if (cw)
    segs.push({
      lbl: "Claude Web",
      n: cw,
      color: "var(--v3-coral)",
      Icon: MessageSquare,
    })
  if (gh) segs.push({ lbl: "GitHub", n: gh, color: "var(--v3-slate)", Icon: GitBranch })

  if (segs.length === 0) return null

  return (
    <div>
      <div
        style={{
          display: "flex",
          height: 14,
          borderRadius: "var(--v3-r-pill)",
          overflow: "hidden",
          border: "1px solid var(--v3-line)",
          background: "var(--v3-paper)",
        }}
      >
        {segs.map((s) => {
          const pct = (s.n / total) * 100
          return (
            <div
              key={s.lbl}
              title={`${s.lbl}: ${s.n.toLocaleString()} (${pct.toFixed(1)}%)`}
              style={{ width: `${pct}%`, background: s.color }}
            />
          )
        })}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 14px",
          marginTop: 12,
          fontFamily: "var(--font-v3-mono), monospace",
          fontSize: 11.5,
          color: "var(--v3-slate)",
        }}
      >
        {segs.map((s) => {
          const pct = (s.n / total) * 100
          return (
            <span
              key={s.lbl}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: s.color,
                }}
              />
              <s.Icon size={12} strokeWidth={2.25} />
              {s.lbl}
              <strong style={{ color: "var(--v3-charcoal)" }}>
                {s.n >= 1000 ? `${(s.n / 1000).toFixed(1)}k` : s.n}
              </strong>
              <span style={{ opacity: 0.65 }}>{pct.toFixed(0)}%</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** GitHub repo card — shown when a github source exists. */
export function GitHubCard({ project }: { project: Project }) {
  const gh = project.sources.github
  if (!gh) return null

  return (
    <article
      className="v3-panel"
      style={{
        background:
          "linear-gradient(135deg, var(--v3-cloud), var(--v3-white) 60%, var(--v3-paper))",
      }}
    >
      <div className="v3-panel-head">GitHub</div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--v3-r-sm)",
            background: "var(--v3-paper)",
            border: "1px solid var(--v3-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--v3-charcoal)",
          }}
        >
          <GitBranch size={18} strokeWidth={2.25} />
        </div>
        <a
          href={`https://github.com/${gh.repo}`}
          target="_blank"
          rel="noreferrer noopener"
          style={{
            fontFamily: "var(--font-v3-mono), monospace",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--v3-charcoal)",
            textDecoration: "none",
            wordBreak: "break-all",
          }}
        >
          {gh.repo} ↗
        </a>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
          gap: 10,
        }}
      >
        {typeof gh.stars === "number" ? (
          <div className="v3-stat-row" style={{ padding: "8px 0" }}>
            <Star size={14} strokeWidth={2.25} color="var(--v3-gold-dk)" />
            <span className="v3-stat-row__label">Stars</span>
            <span className="v3-stat-row__value">{gh.stars}</span>
          </div>
        ) : null}
        {gh.language ? (
          <div className="v3-stat-row" style={{ padding: "8px 0" }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "var(--v3-blue-500)",
                marginRight: 6,
              }}
              aria-hidden
            />
            <span className="v3-stat-row__label">Language</span>
            <span className="v3-stat-row__value">{gh.language}</span>
          </div>
        ) : null}
        {gh.lastPush ? (
          <div className="v3-stat-row" style={{ padding: "8px 0" }}>
            <Clock size={14} strokeWidth={2.25} color="var(--v3-slate)" />
            <span className="v3-stat-row__label">Last push</span>
            <span className="v3-stat-row__value">{gh.lastPush}</span>
          </div>
        ) : null}
      </div>
    </article>
  )
}
