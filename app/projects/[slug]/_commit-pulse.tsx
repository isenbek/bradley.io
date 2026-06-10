import { Activity, GitBranch } from "lucide-react"
import type { Project } from "@/lib/site-data"
import { findTimelineRepo } from "../_timeline-lookup"

function fmtSpan(firstISO: string, lastISO: string): string {
  const days = (new Date(lastISO).getTime() - new Date(firstISO).getTime()) / 86_400_000
  if (days < 60) return `${Math.round(days)} days`
  if (days < 730) return `${Math.round(days / 30)} months`
  return `${(days / 365).toFixed(1)} years`
}

function fmtMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

/**
 * Per-project commit history pulse.
 *
 * Two modes:
 *   A. Project found in a mission timeline → render a real heatmap of the
 *      project's active window using that timeline's daily activity, plus
 *      commit count, language, lifespan, and avg commits/day.
 *   B. Project only has a github source (lastPush, language, stars) → render
 *      a small "GitHub lifeline" with just the last push as a sparkline-ish
 *      lone dot.
 */
export function CommitPulse({ project }: { project: Project }) {
  const match = findTimelineRepo(project.slug)

  // ---------- Mode A: rich data via timeline match ----------
  if (match) {
    const { repo, activityHeatmap: heatmap, org } = match
    const firstT = new Date(repo.firstCommit).getTime()
    const lastT = new Date(repo.lastCommit).getTime()
    const spanDays = Math.max(1, (lastT - firstT) / 86_400_000)
    const cpd = repo.commits / spanDays

    // Filter org heatmap to this repo's active window
    const inWindow = heatmap.filter((d) => {
      const t = new Date(d.date + "T00:00:00Z").getTime()
      return t >= firstT && t <= lastT
    })

    // Bucket into weeks for compact display (max 52 cells)
    const totalWeeks = Math.min(52, Math.ceil(spanDays / 7))
    const cells = Array.from({ length: totalWeeks }, () => 0)
    const cellMaxByCount = new Array(totalWeeks).fill(0)
    inWindow.forEach((d) => {
      const t = new Date(d.date + "T00:00:00Z").getTime()
      const bucket = Math.min(
        totalWeeks - 1,
        Math.floor(((t - firstT) / 86_400_000) / 7)
      )
      cells[bucket] += d.commits
      cellMaxByCount[bucket] = Math.max(cellMaxByCount[bucket], d.commits)
    })
    const maxCell = Math.max(...cells, 1)

    return (
      <article className="v3-panel">
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 14,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-v3-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: "var(--v3-blue-700)",
            }}
          >
            <Activity size={14} strokeWidth={2.25} />
            Commit pulse · {org}
          </div>
          <span
            style={{
              fontFamily: "var(--font-v3-mono), monospace",
              fontSize: 11,
              color: "var(--v3-slate)",
            }}
            title="Activity from the parent timeline filtered to this repo's lifespan; org-wide intensity, not per-repo daily."
          >
            org-window activity ⓘ
          </span>
        </div>

        {/* Weekly intensity grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${totalWeeks}, 1fr)`,
            gap: 3,
            padding: 10,
            background: "var(--v3-cloud)",
            border: "1px solid var(--v3-line)",
            borderRadius: "var(--v3-r-md)",
          }}
        >
          {cells.map((n, i) => {
            const intensity =
              n === 0
                ? 0
                : n < maxCell * 0.25
                ? 1
                : n < maxCell * 0.5
                ? 2
                : n < maxCell * 0.75
                ? 3
                : 4
            return (
              <div
                key={i}
                className="v3-cheat__cell"
                data-i={intensity}
                style={{ height: 14, width: "100%", borderRadius: 2 }}
                title={`Week ${i + 1} · ${n} commits in window`}
              />
            )
          })}
        </div>

        {/* Vital numbers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 14,
            marginTop: 16,
          }}
        >
          {[
            { lbl: "Commits", val: repo.commits.toLocaleString() },
            { lbl: "Span", val: fmtSpan(repo.firstCommit, repo.lastCommit) },
            { lbl: "Avg / day", val: cpd >= 1 ? cpd.toFixed(1) : cpd.toFixed(2) },
            { lbl: "Language", val: repo.language || "—" },
            { lbl: "Phase", val: repo.phase || "—" },
          ].map((s) => (
            <div
              key={s.lbl}
              style={{
                padding: "10px 12px",
                background: "var(--v3-cloud)",
                border: "1px solid var(--v3-line)",
                borderRadius: "var(--v3-r-md)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--v3-slate)",
                  fontWeight: 700,
                }}
              >
                {s.lbl}
              </div>
              <div
                className="v3-font-display"
                style={{
                  fontWeight: 800,
                  fontSize: 16,
                  letterSpacing: "-0.01em",
                  color: "var(--v3-charcoal)",
                  marginTop: 4,
                  fontVariantNumeric: "tabular-nums",
                  wordBreak: "break-word",
                }}
              >
                {s.val}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 10,
            fontFamily: "var(--font-v3-mono), monospace",
            fontSize: 11,
            color: "var(--v3-slate)",
          }}
        >
          <span>first commit {fmtMonth(repo.firstCommit)}</span>
          <span>last commit {fmtMonth(repo.lastCommit)}</span>
        </div>
      </article>
    )
  }

  // ---------- Mode B: github source only (no historical pulse) ----------
  const gh = project.sources.github
  if (!gh) return null

  return (
    <article className="v3-panel">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          fontFamily: "var(--font-v3-mono), monospace",
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: "var(--v3-blue-700)",
        }}
      >
        <GitBranch size={14} strokeWidth={2.25} />
        Commit pulse
      </div>
      <p style={{ fontSize: 13.5, color: "var(--v3-ink)", lineHeight: 1.55 }}>
        This repository lives outside the mission timelines, so a full commit
        history isn&apos;t mirrored locally. Latest push:{" "}
        <strong style={{ color: "var(--v3-charcoal)" }}>{gh.lastPush}</strong>.
        Open the repo for the full history.
      </p>
      <a
        href={`https://github.com/${gh.repo}`}
        target="_blank"
        rel="noopener noreferrer"
        className="v3-btn v3-btn--ghost"
        style={{ marginTop: 12, gap: 6 }}
      >
        View {gh.repo} ↗
      </a>
    </article>
  )
}
