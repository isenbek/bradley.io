import type { SiteStats } from "@/lib/site-data"

/**
 * The site-index panel shared by the home page and /about.
 *
 * One component so the two pages cannot disagree about what a number is
 * called. The labels say what is counted: "Transcript records" is every line
 * of a session transcript (prompts, tool results, reply blocks), not messages
 * somebody typed. The period the activity numbers cover is printed under the
 * table from stats.coverage, which the pipeline writes; a file from before
 * 2026-10-02 has none, and the panel says so instead of implying a lifetime.
 *
 * Dates are sliced from the ISO string, never run through toLocaleDateString,
 * so the server and the browser cannot disagree about the day.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function plainDate(iso: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "")
  if (!m) return null
  const month = MONTHS[Number(m[2]) - 1]
  return month ? `${Number(m[3])} ${month} ${m[1]}` : null
}

export function SiteStatsPanel({ stats, streak = false }: { stats: SiteStats; streak?: boolean }) {
  const cov = stats.coverage
  const since = plainDate(cov?.since)
  const through = plainDate(cov?.through)

  return (
    <div className="panel">
      <div className="panel-face">
        <div className="panel-bar">
          <b>Site index</b>
          <span>regenerated every 4 hours</span>
          {cov?.stale ? <span className="tag warn">stale</span> : null}
        </div>
        <table className="readout">
          <tbody>
            <tr>
              <td>Projects indexed</td>
              <td className="num">{stats.totalProjects.toLocaleString("en-US")}</td>
            </tr>
            <tr>
              <td>Claude Code sessions</td>
              <td className="num">{stats.totalSessions.toLocaleString("en-US")}</td>
            </tr>
            <tr>
              <td>Transcript records</td>
              <td className="num">{stats.totalMessages.toLocaleString("en-US")}</td>
            </tr>
            <tr>
              <td>Active days</td>
              <td className="num">{stats.activeDays.toLocaleString("en-US")}</td>
            </tr>
            {streak ? (
              <tr>
                <td>Current streak</td>
                <td className="num">{stats.streak.toLocaleString("en-US")} d</td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <p className="beta-stats-note">
          {cov?.stale && cov.staleReason ? `${cov.staleReason} ` : null}
          {since && through
            ? `Sessions, records and days cover ${since} through ${through}. The record began in July 2026 and earlier months are incomplete.`
            : "This data file does not record what period its totals cover."}
        </p>
      </div>
    </div>
  )
}
