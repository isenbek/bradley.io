import { readFileSync } from "fs"
import { join } from "path"

interface TimelineMin {
  totalRepos: number
  totalCommits: number
  firstCommit: string
  latestCommit: string
  languages: Record<string, number>
  phases: { name: string }[]
}

function compact(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k"
  return String(n)
}

function span(firstISO: string, latestISO: string): string {
  const first = new Date(firstISO).getTime()
  const last = new Date(latestISO).getTime()
  const days = (last - first) / 86_400_000
  if (days < 60) return `${Math.round(days)}d`
  if (days < 730) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(1)}yr`
}

/**
 * Loads a mission timeline JSON and returns the bits the OG card needs.
 * Returns null if the file is missing — caller renders a fallback card.
 */
export function loadMissionTimeline(filename: string): TimelineMin | null {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "public/data", filename), "utf-8")
    )
  } catch {
    return null
  }
}

/** Headline tag chips for the OG: repos · commits · span · phases */
export function missionTags(t: TimelineMin): string[] {
  return [
    `${t.totalRepos} repos`,
    `${compact(t.totalCommits)} commits`,
    span(t.firstCommit, t.latestCommit),
    `${t.phases.length} phase${t.phases.length === 1 ? "" : "s"}`,
  ]
}
