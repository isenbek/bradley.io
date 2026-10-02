import { readFileSync } from "fs"
import { join } from "path"

/**
 * The cost model, read once and shared by /cost-analysis and /the-shift.
 *
 * public/data/cost-model.json is a FROZEN case study, not a regenerated figure:
 * one fixed window (2025-12-01 to 2026-03-26), recorded once, and no longer
 * rewritten (scripts/cost-model-pipeline.py refuses to overwrite a file that
 * carries a top-level `frozen` object). The `frozen` block says when and why,
 * `frozen.coverage` says what each count actually covers, `frozen.notes` says
 * what each field means, and `frozen.corrections` lists what was changed after
 * the window closed. Both pages have to keep saying so.
 *
 * Two things in this file are easy to misread, and both pages lean on them:
 *
 * 1. RECORDED versus MODELLED. `actual` is what was recorded (commits, issues,
 *    sessions), with cost at flat monthly rates rather than invoices. `legacy`
 *    is a model of a team that was never hired. Every figure built from this
 *    file has to say which side each mark is on.
 *
 * 2. `timespan.activeDays` (34) is days with a recorded Claude Code session,
 *    and that record only begins 2026-02-09. It is not days worked: commits
 *    landed on all 116 days. `comparison.velocityMultiplier` and
 *    `comparison.timeCompression` are built on it and overstate, so neither
 *    page headlines them.
 *
 * Everything under `frozen` is optional in the types so a file without the
 * block still renders.
 */

export interface CostWeek {
  /** ISO week, "2025-W49". */
  week: string
  /** The Monday the week starts on, "YYYY-MM-DD". */
  weekStart: string
  /** Commits in the week across every org repository, UTC days. */
  commits: number
  cumulativeCommits: number
  /** All recorded Claude Code activity. Zero before 2026-02-09 means no record. */
  messages: number
  sessions: number
  toolCalls: number
  issuesOpened: number
  issuesClosed: number
  cumulativeIssuesOpened: number
  cumulativeIssuesClosed: number
  /** actual.totalCost spread evenly over the weeks of the window. */
  cumulativeCostActual: number
  /** The midpoint modelled cost spread evenly over the midpoint modelled duration. */
  cumulativeCostLegacy: number
}

export interface CostModelFrozen {
  asOf?: string
  window?: { start?: string; end?: string }
  reason?: string
  frozenOn?: string
  coverage?: {
    calendarDays?: number
    /** First day of the Claude Code session record the model read. */
    claudeRecordStart?: string
    claudeRecordEnd?: string
    claudeActiveDays?: number
    /** Days in the window with at least one commit. */
    commitDaysInWindow?: number
    commitsInWindow?: number
    commitsInWindowRepos?: number
    /** The day the in-window commit count was taken (after the window closed). */
    commitsInWindowCountedOn?: string
    /** What the 2026-03-26 version counted, and the instant its commit source stopped. */
    commitsInWindowAtSnapshot?: number
    commitsSnapshotThrough?: string
    /** A later count of the same window from the regenerated timeline. */
    commitsInWindowRecount?: { countedOn?: string; commits?: number }
    commitsFullHistory?: number
    commitsFullHistoryRepos?: number
    commitsFullHistoryStart?: string
    /** The instant the full-history count stops. */
    commitsFullHistoryThrough?: string
  }
  notes?: Record<string, string>
}

export interface CostModel {
  generated: string
  scope: string
  frozen?: CostModelFrozen
  timespan: { start: string; end: string; days: number; activeDays: number }
  actual: {
    teamSize: number
    sessions: number
    messages: number
    toolCalls?: number
    commits: number
    repos: number
    projects: number
    operatorCost: number
    aiCost: number
    totalCost: number
    domains: { name: string; score: number }[]
  }
  legacy: {
    roles: {
      title: string
      count: number
      annualSalary: number
      loadedCost: number
      halfTime?: boolean
    }[]
    teamSize?: number
    estimatedMonths?: { low: number; high: number }
    personMonths?: { low: number; high: number }
    costPerPersonMonth?: number
    totalCost?: { low: number; high: number }
    overheadMultiplier?: number
  }
  comparison: { costSavingsPercent: number; velocityMultiplier: number; timeCompression: string }
  industryBenchmarks: {
    codingTimePercent?: number
    meetingTimePercent?: number
    codeReviewPercent?: number
    studies: { source: string; finding: string }[]
  }
  timeSeries?: CostWeek[]
  issues: { opened: number; closed: number; bugs: number; features: number; other: number }
}

export function loadCostModel(): CostModel {
  const raw = readFileSync(join(process.cwd(), "public/data/cost-model.json"), "utf-8")
  return JSON.parse(raw) as CostModel
}

/** Whole dollars, in a fixed locale so the server and the browser agree. */
export const costUsd = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`

/** A count, thousands-separated, in a fixed locale. */
export const costNum = (n: number): string => n.toLocaleString("en-US")

/** Axis money: "$0", "$200k". Only for round tick values. */
export const costUsdTick = (n: number): string => (n === 0 ? "$0" : `$${Math.round(n / 1000)}k`)

/**
 * "2026-03-26T05:00:02Z" to "2026-03-26 05:00 UTC". Sliced, never parsed, and
 * only for a stamp that says it is UTC; anything else is shown as its date.
 */
export function utcStamp(s: string | undefined): string | null {
  if (!s) return null
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*Z$/.test(s)
    ? `${s.slice(0, 10)} ${s.slice(11, 16)} UTC`
    : s.slice(0, 10)
}

/**
 * The fixed facts both pages print about the case study, resolved once so the
 * two pages cannot word the window or the recording date differently.
 */
export function costWindow(d: CostModel): {
  frozen: CostModelFrozen | undefined
  start: string
  end: string
  /** "2025-12-01 to 2026-03-26" */
  label: string
  /** The date the numbers were recorded. Sliced, never parsed. */
  recorded: string
} {
  const frozen = d.frozen
  const start = frozen?.window?.start ?? d.timespan.start
  const end = frozen?.window?.end ?? d.timespan.end
  return {
    frozen,
    start,
    end,
    label: `${start} to ${end}`,
    recorded: frozen?.asOf ?? d.generated?.slice(0, 10) ?? "an unrecorded date",
  }
}
