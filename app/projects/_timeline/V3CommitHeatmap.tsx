import type { CommitDay } from "@/lib/nominate-timeline-types"

const CELL = 11
const GAP = 2
const LABEL_W = 18
const TOP_OFFSET = 16
const FOOT = 18

/**
 * Calendar heatmap of commits.
 * Limits to the last ~52 weeks for legibility. Each column is a week,
 * each row is a day-of-week (Sun..Sat). Colors come from the
 * .v3-cheat__cell[data-i] CSS — keeps the palette tied to v3 tokens.
 *
 * The cutoff is computed from the data's most recent commit, NOT from
 * `new Date()`. Using wall-clock time inside a server component causes
 * hydration mismatches when the ISR-cached HTML diverges from the
 * RSC payload generated on a later request — the heatmap re-rolled its
 * window between the two renders. Data-driven cutoff is stable across
 * every render of the same `data` value.
 */
export function V3CommitHeatmap({ data }: { data: CommitDay[] }) {
  // Find the most recent commit date in the data; fall back to the
  // last item if the data isn't sorted. Empty data is handled below.
  const allDays = data
    .map((d) => ({ ...d, date_obj: new Date(d.date + "T00:00:00Z") }))
    .sort((a, b) => a.date_obj.getTime() - b.date_obj.getTime())

  const latest = allDays.length > 0
    ? allDays[allDays.length - 1].date_obj
    : new Date("1970-01-01T00:00:00Z")
  const cutoff = new Date(latest)
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1)
  cutoff.setUTCHours(0, 0, 0, 0)

  const days = allDays.filter((d) => d.date_obj >= cutoff)

  if (days.length === 0) {
    return (
      <div className="v3-cheat">
        <div
          style={{
            fontFamily: "var(--font-v3-mono), monospace",
            fontSize: 12,
            color: "var(--v3-slate)",
            textAlign: "center",
          }}
        >
          no commits in the last year
        </div>
      </div>
    )
  }

  // Align first week to Sunday
  const start = new Date(days[0].date_obj)
  start.setUTCDate(start.getUTCDate() - start.getUTCDay())

  const end = new Date(days[days.length - 1].date_obj)

  const totalDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1
  const totalWeeks = Math.ceil(totalDays / 7)

  // Map iso date -> intensity
  const byDate = new Map<string, CommitDay>()
  for (const d of days) byDate.set(d.date, d)

  const monthLabels: { x: number; label: string }[] = []
  let lastMonth = -1
  for (let w = 0; w < totalWeeks; w++) {
    const dt = new Date(start)
    dt.setUTCDate(dt.getUTCDate() + w * 7)
    const m = dt.getUTCMonth()
    if (m !== lastMonth) {
      monthLabels.push({
        x: LABEL_W + w * (CELL + GAP),
        label: dt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      })
      lastMonth = m
    }
  }

  const width = LABEL_W + totalWeeks * (CELL + GAP)
  const height = TOP_OFFSET + 7 * (CELL + GAP) + FOOT

  const totalCommits = days.reduce((s, d) => s + d.commits, 0)
  const activeDays = days.filter((d) => d.commits > 0).length

  return (
    <div className="v3-cheat">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
          fontFamily: "var(--font-v3-mono), monospace",
          fontSize: 11,
          color: "var(--v3-slate)",
        }}
      >
        <span>last 52 weeks</span>
        <span>
          <strong style={{ color: "var(--v3-charcoal)" }}>{totalCommits.toLocaleString()}</strong>{" "}
          commits · {activeDays} active days
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="v3-cheat__svg" preserveAspectRatio="xMinYMid meet">
        {/* Month labels */}
        {monthLabels.map((m, i) => (
          <text
            key={`${m.label}-${i}`}
            x={m.x}
            y={11}
            fontSize="9.5"
            fontFamily="ui-monospace, monospace"
            fill="var(--v3-slate)"
            opacity={0.75}
          >
            {m.label}
          </text>
        ))}

        {/* Day-of-week labels */}
        {["", "M", "", "W", "", "F", ""].map((d, i) => (
          <text
            key={i}
            x={0}
            y={TOP_OFFSET + i * (CELL + GAP) + CELL - 1}
            fontSize="8.5"
            fontFamily="ui-monospace, monospace"
            fill="var(--v3-slate)"
            opacity={0.7}
          >
            {d}
          </text>
        ))}

        {/* Cells */}
        {Array.from({ length: totalWeeks }).flatMap((_, w) =>
          Array.from({ length: 7 }).map((_, d) => {
            const dt = new Date(start)
            dt.setUTCDate(dt.getUTCDate() + w * 7 + d)
            if (dt > end) return null
            const iso = dt.toISOString().slice(0, 10)
            const day = byDate.get(iso)
            const intensity = day?.intensity ?? 0
            const x = LABEL_W + w * (CELL + GAP)
            const y = TOP_OFFSET + d * (CELL + GAP)
            const fill =
              intensity === 0
                ? "var(--v3-line)"
                : intensity === 1
                ? "var(--v3-blue-100)"
                : intensity === 2
                ? "var(--v3-blue-300)"
                : intensity === 3
                ? "var(--v3-blue-500)"
                : "var(--v3-blue-700)"
            // Pre-build the SVG <title> as a single string. Multiple text
            // children + conditional interpolations inside an SVG <title>
            // hydrate inconsistently between the SSR HTML and the client
            // render in Next 16 / React 19 — server serialization drops
            // the text, client renders it, → React error #418. A single
            // string child is stable.
            const tipText = day
              ? `${iso} · ${day.commits} commit${day.commits === 1 ? "" : "s"}${
                  day.repos
                    ? ` across ${day.repos} repo${day.repos === 1 ? "" : "s"}`
                    : ""
                }`
              : `${iso} · 0 commits`
            return (
              <rect
                key={`${w}-${d}`}
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={2}
                fill={fill}
              >
                <title>{tipText}</title>
              </rect>
            )
          })
        )}
      </svg>

      <div className="v3-cheat__legend">
        <span>less</span>
        <span className="v3-cheat__sw">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="v3-cheat__cell" data-i={i} />
          ))}
        </span>
        <span>more</span>
        <span style={{ marginLeft: "auto" }}>
          first commit{" "}
          {new Date(days[0].date + "T00:00:00Z").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })}
        </span>
      </div>
    </div>
  )
}
