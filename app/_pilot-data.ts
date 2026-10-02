import { readFileSync } from "fs"
import { join } from "path"

/**
 * The AI pilot record, read once and shared by /beta/ai-pilot and
 * /beta/pilot-analytics.
 *
 * Both pages are views on the same file. Reading it in two places invites the
 * two of them to disagree about what "sessions" means, which is the drift this
 * codebase already keeps one copy of every other fact to avoid.
 */

/**
 * What the published numbers cover. Written by scripts/ai-pilot-pipeline.py from
 * pipeline 2.0.0 on; a data file older than that has no coverage object, and
 * every reader has to cope with its absence.
 */
export interface PilotCoverage {
  /** First day in the durable record, "YYYY-MM-DD". */
  since: string
  /** Last day in the durable record, "YYYY-MM-DD". */
  through: string
  source: string
  note?: string
  /** The day the durable record started being kept. Earlier days are partial. */
  recordingBegan?: string
  dayTimezone?: string
  hourTimezone?: string
  rollingWindow?: { sections: string[]; filesSampled?: number; note?: string }
}

/**
 * Cost at API list price. `totalUSD` is null whenever it cannot be computed
 * correctly, and `reason` says why. The parts are never a total.
 */
export interface PilotCost {
  totalUSD: number | null
  reason: string | null
  basis?: string
  pricesAsOf?: string
  unpricedModels?: string[]
}

export interface PilotLicense {
  number: string
  class: string
  issued: string
  expires: string
  totalSessions: number
  totalMessages: number
  /** null (or, in old files, 0) means not computed. Render it with usd(). */
  totalCostUSD: number | null
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheTokens: number
  modelCount: number
  projectCount: number
}

export interface PilotData {
  generated: string
  pipelineVersion: string
  coverage?: PilotCoverage
  license: PilotLicense
  typeRatings: {
    modelId: string
    displayName: string
    outputTokens: number
    costShare: number
    proficiency: string
  }[]
  activityHeatmap: { date: string; count: number; sessions: number; toolCalls: number }[]
  hourlyDistribution: {
    hours: { hour: number; label: string; count: number }[]
    peakHour: number
    peakCount: number
    /** Zone the hours are in. Absent in old files, whose hours were UTC. */
    timezone?: string
  }
  instrumentRatings: Record<string, { score: number; hits: number; keywordCoverage: number }>
  competencyRadar: { axis: string; score: number; detail: string }[]
  pilotingStyle: {
    directive: number
    collaborative: number
    planFirst: number
    iterate: number
    label: string
    description: string
  }
  missionLog: {
    name: string
    sessions: number
    messages: number
    complexity: number
    domain: string
    status: string
    lastActive: string
  }[]
  tokenEconomy: {
    totalInputTokens: number
    totalOutputTokens: number
    totalCacheReadTokens: number
    totalCacheCreateTokens: number
    /** null (or, in old files, 0) means not computed. Render it with usd(). */
    totalCostUSD: number | null
    cost?: PilotCost
    cacheEfficiency: number
    dailyTokens: { date: string; tokens: number }[]
  }
  streaks: {
    current: number
    longest: number
    peakDay: string
    peakDayCount: number
    totalActiveDays: number
    /** Zone the days are in. Absent in old files. */
    timezone?: string
  }
  skillsCloud: { name: string; count: number; category: string }[]
}

export function loadPilotData(): PilotData {
  const raw = readFileSync(join(process.cwd(), "public/data/ai-pilot-data.json"), "utf-8")
  return JSON.parse(raw) as PilotData
}

/**
 * Compact a token count.
 *
 * These run to twelve digits (77,561,541,786 cache tokens), and a number that
 * long is read as "a lot" rather than as a quantity. The exact figure stays
 * available in the title attribute wherever this is used.
 */
export function tokens(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString()
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

/**
 * "2026-03-08" to "8 March 2026".
 *
 * Sliced out of the string, never through Date: a "YYYY-MM-DD" parsed as a Date
 * is midnight UTC, and formatting that in a zone west of Greenwich prints the
 * day before. Returns null for anything that is not a date, so the caller has
 * to decide what to say instead.
 */
export function longDate(iso: string | null | undefined): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "")
  if (!m) return null
  const month = MONTHS[Number(m[2]) - 1]
  if (!month) return null
  return `${Number(m[3])} ${month} ${m[1]}`
}

/**
 * The sentence both pages print about what the totals cover.
 *
 * A total means nothing without the period it was counted over. The pipeline
 * writes the period into the file; this turns it into prose, and says so
 * plainly when the file is too old to carry one.
 */
export function coverageText(d: PilotData): string {
  const since = longDate(d.coverage?.since)
  const through = longDate(d.coverage?.through)
  if (!since || !through) return "This data file does not record what period its totals cover."

  const began = longDate(d.coverage?.recordingBegan)
  const partial = began
    ? ` That record has been kept since ${began}. From before then it holds only the sessions whose logs were still on disk, so the earlier months are incomplete.`
    : ""
  return `Totals cover the period since ${since}, through ${through}, read from the durable activity record.${partial}`
}

/** What a page prints where a cost would go and there is none. Never "$0". */
export const COST_NOT_COMPUTED = "not computed"

/**
 * A cost in dollars, or null when there is no cost to show.
 *
 * Null and undefined mean the pipeline could not compute it. Zero is treated
 * the same way on purpose: files written before pipeline 2.0.0 carry 0 where
 * the logs simply had no cost field, and no record with billions of tokens in
 * it cost nothing. Callers print `usd(v) ?? COST_NOT_COMPUTED`.
 */
export function usd(v: number | null | undefined): string | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}
