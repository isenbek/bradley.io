import { createHash } from "crypto"
import { readFileSync } from "fs"
import { join } from "path"

/**
 * The AI pilot record, read once and shared by every page that quotes it:
 * /ai-pilot (the licence, which now holds what /pilot-analytics used to),
 * /the-shift and /about.
 *
 * They are all views on the same file. Reading it in two places invites two of
 * them to disagree about what "sessions" means, which is the drift this
 * codebase already keeps one copy of every other fact to avoid.
 *
 * EXPORTS
 *   loadPilotData()      public/data/ai-pilot-data.json, typed
 *   loadToolUsage(d)     calls per tool, and how far the counts can be trusted
 *   publicMissions(d)    the mission log without the names this site does not print
 *   publicSkills(d)      the technology mentions without the names the count gets wrong
 *   coverageText(d)      the sentence about what period the totals cover
 *   tokens, usd, COST_NOT_COMPUTED, longDate, shortDate, daysInclusive
 *   LICENCE_CLASSES, TYPE_RATINGS   the pipeline's thresholds, for the page to state
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
  /** What each counted thing is, in the pipeline's own words. */
  definitions?: { message?: string; session?: string; project?: string; tokens?: string }
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
  /** Prompts and tool results. With totalAssistantRecords it sums to totalMessages. */
  totalUserRecords?: number
  totalAssistantRecords?: number
  /** Model responses: one per API call, however many log lines it wrote. */
  totalApiCalls?: number
  totalToolCalls?: number
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
    /** Model responses. Absent in files older than pipeline 2.0.0. */
    apiCalls?: number
    inputTokens?: number
    outputTokens: number
    /**
     * Share of OUTPUT TOKENS, in percent. The name is historical: it has never
     * been a share of cost (scripts/ai-pilot-pipeline.py, compute_type_ratings).
     */
    costShare: number
    proficiency: string
    /** First and last UTC day the model appears in the record. */
    firstDay?: string
    lastDay?: string
  }[]
  activityHeatmap: { date: string; count: number; sessions: number; toolCalls: number }[]
  hourlyDistribution: {
    /** `count` is sessions started in that hour; `records` is transcript records written. */
    hours: { hour: number; label: string; count: number; records?: number }[]
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
    toolCalls?: number
    complexity: number
    domain: string
    technologies?: string[]
    status: string
    firstActive?: string
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
    longestStart?: string
    longestEnd?: string
    peakDay: string
    peakDayCount: number
    /** The Monday the busiest calendar week starts on, and its record count. */
    peakWeek?: string
    peakWeekCount?: number
    /** The day the streaks were counted up to. */
    asOf?: string
    totalActiveDays: number
    /** Zone the days are in. Absent in old files. */
    timezone?: string
  }
  skillsCloud: { name: string; count: number; category: string }[]
  /**
   * Calls per tool over the whole record, most used first. NOT WRITTEN YET: the
   * pipeline computes it (activity_db.py, _tools) and does not publish it. When
   * it does, loadToolUsage() reads it from here and stops using the fallback.
   */
  toolUsage?: { tool: string; calls: number }[]
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

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/**
 * "2026-05-28" to "28 May". For rows whose caption already states the year.
 * Sliced from the string for the same reason as longDate. Null if not a date.
 */
export function shortDate(iso: string | null | undefined): string | null {
  const m = /^\d{4}-(\d{2})-(\d{2})/.exec(iso ?? "")
  if (!m) return null
  const month = SHORT_MONTHS[Number(m[1]) - 1]
  return month ? `${Number(m[2])} ${month}` : null
}

/** Whole days from `a` to `b`, both "YYYY-MM-DD", counting both ends. Null if either is not a date. */
export function daysInclusive(a: string | null | undefined, b: string | null | undefined): number | null {
  const ta = Date.parse(`${(a ?? "").slice(0, 10)}T00:00:00Z`)
  const tb = Date.parse(`${(b ?? "").slice(0, 10)}T00:00:00Z`)
  if (!Number.isFinite(ta) || !Number.isFinite(tb) || tb < ta) return null
  return Math.round((tb - ta) / 86_400_000) + 1
}

/**
 * The licence class thresholds, copied from compute_license in
 * scripts/ai-pilot-pipeline.py so the page can state the rule instead of
 * leaving "ATP" to sound like a judgement. A class is a volume band and
 * nothing more. If the pipeline's numbers change, change these with them.
 */
export const LICENCE_CLASSES: { name: string; long: string; above: number }[] = [
  { name: "ATP", long: "Airline transport", above: 300_000 },
  { name: "Commercial", long: "Commercial", above: 100_000 },
  { name: "Private", long: "Private", above: 10_000 },
  { name: "Student", long: "Student", above: 0 },
]

/**
 * The type rating bands, copied from compute_type_ratings in the same script:
 * a model's share of all output tokens, in percent.
 */
export const TYPE_RATINGS: { name: string; above: number }[] = [
  { name: "Expert", above: 50 },
  { name: "Proficient", above: 20 },
  { name: "Familiar", above: 5 },
  { name: "Exposure", above: 0 },
]

/**
 * Project directories this site does not print, as SHA-256 hashes of the
 * lowercased directory name. The mission log is a list of directory names
 * straight off the disk, and not every directory is a public project. The
 * names are hashed so that this file, which is public source, does not print
 * them either. A withheld mission stays in every total (it is part of the
 * record); only its row is left out, and the page says how many rows were.
 *
 * To withhold another: printf '%s' name | sha256sum, and add the hash.
 *
 * The right place for this list is the pipeline, so the name never reaches a
 * file under public/. Until it moves there, it is here, in one place.
 */
const WITHHELD_PROJECT_HASHES = new Set([
  "ee4dc494a4ac7c0249d22bb6e312e3ef78673bc310574b489415fb8c8d604df4",
  "8fdd880f097cddfef86895d2c48f649e943bed14639f0ad29671508b536c9fc1",
])

const isWithheld = (name: string): boolean =>
  WITHHELD_PROJECT_HASHES.has(createHash("sha256").update(name.toLowerCase()).digest("hex"))

/**
 * Directories printed as one row and not by name. Every repository in the
 * Nominate-AI organisation is private, and /work gives its totals without
 * naming one; a mission log that named fourteen of its directories, each with
 * its own days and message count, would say more than that page does. So the
 * directories whose names begin "cb" are summed into a single row. Twelve of
 * the fourteen in the current file are Nominate-AI repositories by
 * public/data/nominate-ai-timeline.json; the row's wording says "most".
 */
const GROUPED_PREFIX = "cb"

export interface MissionRow {
  /** Unique key: the directory name, or "group:cb" for the grouped row. */
  key: string
  /** The directory name, or null for the grouped row. */
  name: string | null
  /** How many directories the row stands for: 1, or more for the grouped row. */
  dirs: number
  sessions: number
  messages: number
  firstActive?: string
  lastActive: string
}

/**
 * The mission log as the page prints it: withheld directories dropped, the
 * grouped ones summed into one row at the position of their sum, and the
 * rest as they are, busiest first by messages.
 */
export function publicMissions(d: PilotData): {
  missions: MissionRow[]
  withheld: number
  grouped: number
} {
  const kept = d.missionLog.filter((m) => !isWithheld(m.name))
  const inGroup = kept.filter((m) => m.name.toLowerCase().startsWith(GROUPED_PREFIX))
  const rows: MissionRow[] = kept
    .filter((m) => !m.name.toLowerCase().startsWith(GROUPED_PREFIX))
    .map((m) => ({
      key: m.name,
      name: m.name,
      dirs: 1,
      sessions: m.sessions,
      messages: m.messages,
      firstActive: m.firstActive,
      lastActive: m.lastActive,
    }))
  if (inGroup.length) {
    const firsts = inGroup.map((m) => m.firstActive).filter((x): x is string => !!x).sort()
    const lasts = inGroup.map((m) => m.lastActive).filter(Boolean).sort()
    rows.push({
      key: `group:${GROUPED_PREFIX}`,
      name: null,
      dirs: inGroup.length,
      sessions: inGroup.reduce((s, m) => s + m.sessions, 0),
      messages: inGroup.reduce((s, m) => s + m.messages, 0),
      firstActive: firsts[0],
      lastActive: lasts.at(-1) ?? "",
    })
  }
  rows.sort((a, b) => b.messages - a.messages)
  return { missions: rows, withheld: d.missionLog.length - kept.length, grouped: inGroup.length }
}

/**
 * Technology names the mention count cannot be trusted for.
 *
 * The pipeline counts a name wherever it occurs as a SUBSTRING of a message
 * (scripts/ai-pilot-pipeline.py: `if tech.lower() in text_lower`). For a long
 * name that is the same as counting mentions. For these five it is not: "go"
 * is inside "going" and "google", "git" inside "digit", "rust" inside "trust",
 * "spi" inside "despite", "aws" inside "draws". Published as they are, "Go"
 * tops the list at several times anything real. They are left out, and the
 * page says so, until the pipeline matches whole words.
 */
const SUBSTRING_PRONE = new Set(["go", "git", "rust", "spi", "aws"])

export function publicSkills(d: PilotData): { skills: PilotData["skillsCloud"]; dropped: string[] } {
  const dropped: string[] = []
  const skills = d.skillsCloud.filter((s) => {
    if (!SUBSTRING_PRONE.has(s.name.toLowerCase())) return true
    dropped.push(s.name)
    return false
  })
  return { skills, dropped }
}

export interface ToolUsage {
  rows: { tool: string; calls: number }[]
  /** Sum over every tool in the source, not only the rows returned. */
  total: number
  /** The file the rows came from, for the provenance chip. */
  source: string
  generated: string | null
  /** First and last day the counts cover, "YYYY-MM-DD", or null if the source does not say. */
  from: string | null
  to: string | null
  /**
   * True when the counts are the corrected ones (one per call). False when
   * they come from the raw tool-call table, which holds re-inserted rows and
   * so runs a little high: print shares from it, never counts.
   */
  exact: boolean
}

/**
 * Calls per tool.
 *
 * ai-pilot-data.json does not carry these yet (see PilotData.toolUsage). Until
 * it does, they are read from data/pilot-analytics.json, the aggregate that
 * scripts/claude-activity-viz.py writes every four hours. That file counts
 * rows of the tool-call table as they stand, and the table has no key: when
 * the exporter re-reads a log line it inserts that line's tool rows again. On
 * 2 October 2026 the raw table held 349,098 rows against 342,953 real calls,
 * 1.8 percent high, spread evenly enough that each of the twelve most used
 * tools' SHARE was within a tenth of a percentage point of its share by the
 * corrected count (Bash 74.07 against 74.15, Edit 11.15 against 11.08). So
 * from this source the page prints shares and not counts.
 *
 * Only tool names and counts are read. The same file also holds project names,
 * host names and session ids, which this function never returns.
 *
 * Null when neither source has anything, and the page then omits the section.
 */
export function loadToolUsage(d: PilotData): ToolUsage | null {
  if (Array.isArray(d.toolUsage) && d.toolUsage.length) {
    const rows = d.toolUsage.filter((t) => typeof t?.tool === "string" && t.calls > 0)
    return {
      rows,
      total: rows.reduce((s, t) => s + t.calls, 0),
      source: "ai-pilot-data.json",
      generated: d.generated,
      from: d.coverage?.since ?? null,
      to: d.coverage?.through ?? null,
      exact: true,
    }
  }
  try {
    const raw = JSON.parse(
      readFileSync(join(process.cwd(), "data/pilot-analytics.json"), "utf-8"),
    ) as {
      generated?: string
      summary?: { tool_calls?: number; first_ts?: string; last_ts?: string }
      by_tool?: { tool_name?: string; calls?: number }[]
    }
    const rows = (raw.by_tool ?? [])
      .filter((t): t is { tool_name: string; calls: number } => typeof t?.tool_name === "string" && Number(t.calls) > 0)
      .map((t) => ({ tool: t.tool_name, calls: t.calls }))
    const total = Number(raw.summary?.tool_calls)
    if (!rows.length || !(total > 0)) return null
    const day = (ts: string | undefined) => (/^\d{4}-\d{2}-\d{2}/.test(ts ?? "") ? (ts as string).slice(0, 10) : null)
    return {
      rows,
      total,
      source: "pilot-analytics.json",
      generated: raw.generated ?? null,
      from: day(raw.summary?.first_ts),
      to: day(raw.summary?.last_ts),
      exact: false,
    }
  } catch {
    return null
  }
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
