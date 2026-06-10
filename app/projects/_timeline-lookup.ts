import { readFileSync } from "fs"
import { join } from "path"

export interface TimelineRepoEntry {
  name: string
  description: string
  language: string
  commits: number
  firstCommit: string
  lastCommit: string
  phase: string
}

interface CommitDay {
  date: string
  commits: number
  repos: number
  intensity: 0 | 1 | 2 | 3 | 4
}

export interface TimelineMatch {
  org: string
  orgSlug: string
  repo: TimelineRepoEntry
  activityHeatmap: CommitDay[]
}

const TIMELINE_FILES = [
  { slug: "nominate-ai", file: "nominate-ai-timeline.json" },
  { slug: "tinymachines", file: "tinymachines-timeline.json" },
  { slug: "isenbek", file: "isenbek-timeline.json" },
  { slug: "sysforge-ai", file: "sysforge-ai-timeline.json" },
] as const

/** Walk all four mission timelines looking for a repo whose name matches `slug`. */
export function findTimelineRepo(slug: string): TimelineMatch | null {
  for (const { slug: orgSlug, file } of TIMELINE_FILES) {
    try {
      const data = JSON.parse(
        readFileSync(join(process.cwd(), "public/data", file), "utf-8")
      )
      const repo = data.repos?.find((r: TimelineRepoEntry) => r.name === slug)
      if (repo) {
        return {
          org: data.org,
          orgSlug,
          repo,
          activityHeatmap: data.activityHeatmap ?? [],
        }
      }
    } catch {
      /* file missing, keep looking */
    }
  }
  return null
}

/** Return every repo slug from every mission timeline (for `generateStaticParams`). */
export function allTimelineRepoSlugs(): string[] {
  const slugs = new Set<string>()
  for (const { file } of TIMELINE_FILES) {
    try {
      const data = JSON.parse(
        readFileSync(join(process.cwd(), "public/data", file), "utf-8")
      )
      for (const repo of data.repos ?? []) {
        if (repo?.name) slugs.add(repo.name)
      }
    } catch {
      /* skip */
    }
  }
  return Array.from(slugs)
}
