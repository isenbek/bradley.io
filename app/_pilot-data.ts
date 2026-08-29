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

export interface PilotLicense {
  number: string
  class: string
  issued: string
  expires: string
  totalSessions: number
  totalMessages: number
  totalCostUSD: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheTokens: number
  modelCount: number
  projectCount: number
}

export interface PilotData {
  generated: string
  pipelineVersion: string
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
    totalCostUSD: number
    cacheEfficiency: number
    dailyTokens: { date: string; tokens: number }[]
  }
  streaks: {
    current: number
    longest: number
    peakDay: string
    peakDayCount: number
    totalActiveDays: number
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
