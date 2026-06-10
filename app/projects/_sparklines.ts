import { readFileSync } from "fs"
import { join } from "path"

interface TimelineRepo {
  name: string
  firstCommit: string
  lastCommit: string
  commits: number
}

interface CommitDay {
  date: string
  commits: number
  intensity: number
}

interface TimelineFile {
  org: string
  activityHeatmap: CommitDay[]
  repos: TimelineRepo[]
}

const TIMELINE_FILES = [
  "nominate-ai-timeline.json",
  "tinymachines-timeline.json",
  "isenbek-timeline.json",
  "sysforge-ai-timeline.json",
] as const

const NUM_BUCKETS = 16

export interface SparkData {
  buckets: number[]
  /** Max bucket value (for client-side scaling). */
  max: number
}

/**
 * Build a `Map<slug, SparkData>` of compact per-project weekly activity
 * arrays. For projects whose slug matches a repo in one of the four mission
 * timelines, the array is sampled from that timeline's `activityHeatmap`
 * filtered to the repo's first/last-commit window and aggregated into
 * `NUM_BUCKETS` buckets. Projects without a match get no entry.
 */
export function buildSparklines(slugs: string[]): Map<string, SparkData> {
  const out = new Map<string, SparkData>()
  if (slugs.length === 0) return out

  const want = new Set(slugs)
  for (const fname of TIMELINE_FILES) {
    let data: TimelineFile
    try {
      data = JSON.parse(
        readFileSync(join(process.cwd(), "public/data", fname), "utf-8")
      )
    } catch {
      continue
    }
    const heatmap = data.activityHeatmap ?? []
    for (const repo of data.repos ?? []) {
      if (!want.has(repo.name) || out.has(repo.name)) continue
      const firstT = new Date(repo.firstCommit).getTime()
      const lastT = new Date(repo.lastCommit).getTime()
      const spanMs = Math.max(86_400_000, lastT - firstT)
      const bucketMs = spanMs / NUM_BUCKETS
      const buckets = new Array(NUM_BUCKETS).fill(0)
      for (const d of heatmap) {
        const t = new Date(d.date + "T00:00:00Z").getTime()
        if (t < firstT || t > lastT) continue
        const idx = Math.min(NUM_BUCKETS - 1, Math.floor((t - firstT) / bucketMs))
        buckets[idx] += d.commits
      }
      const max = Math.max(...buckets, 1)
      out.set(repo.name, { buckets, max })
    }
  }
  return out
}
