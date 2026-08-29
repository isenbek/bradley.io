import { readFileSync } from "fs"
import { join } from "path"

/**
 * The four mission timelines, rolled up to the org.
 *
 * Deliberately org-level only. v3 also generated a dossier per repository, 236
 * SSG pages of them, and those are moving to the PUBLIC repo. What a client
 * wants from this page is the shape of ten years of work, not a directory of it.
 *
 * Reads the same four JSON files as components/v3/MissionHeros.tsx. They stay
 * the one copy of the fact; nothing here re-derives a total the pipeline already
 * computed.
 */

export interface CommitDay {
  date: string
  commits: number
  repos: number
  intensity: number
}

export interface OrgRollup {
  slug: string
  /** Display name, cased as the org writes it. */
  displayName: string
  /** What the org is, in one clause. */
  what: string
  gh?: string
  totalRepos: number
  totalCommits: number
  firstCommit: string
  latestCommit: string
  /** Language name to repo count, already sorted, largest first. */
  languages: [string, number][]
  activityHeatmap: CommitDay[]
  /** ISO stamp the pipeline wrote into the file. */
  generated: string
}

interface TimelineFile {
  generated: string
  org: string
  totalRepos: number
  totalCommits: number
  firstCommit: string
  latestCommit: string
  languages: Record<string, number>
  activityHeatmap: CommitDay[]
}

const MISSIONS = [
  {
    slug: "nominate-ai",
    file: "nominate-ai-timeline.json",
    displayName: "Nominate-AI",
    gh: "https://github.com/Nominate-AI",
    what: "AI-native sourcing platform: pipelines, vector search, agents",
  },
  {
    slug: "tinymachines",
    file: "tinymachines-timeline.json",
    displayName: "tinymachines",
    gh: "https://github.com/tinymachines",
    what: "the lab umbrella: edge hardware, radios, simulators, this design kit",
  },
  {
    slug: "isenbek",
    file: "isenbek-timeline.json",
    displayName: "isenbek",
    gh: "https://github.com/isenbek",
    what: "personal and client work, including this site",
  },
  {
    slug: "sysforge-ai",
    file: "sysforge-ai-timeline.json",
    displayName: "sysforge-ai",
    what: "systems tooling and infrastructure",
  },
] as const

/**
 * Load all four rollups, largest first by commit count.
 *
 * A file that will not parse is skipped rather than fatal, and the caller is
 * told how many arrived, because a page that silently renders three orgs where
 * there are four looks exactly like a page that renders four.
 */
export function loadOrgRollups(): { orgs: OrgRollup[]; expected: number } {
  const orgs: OrgRollup[] = []

  for (const m of MISSIONS) {
    try {
      const raw = readFileSync(join(process.cwd(), "public/data", m.file), "utf-8")
      const d = JSON.parse(raw) as TimelineFile
      orgs.push({
        slug: m.slug,
        displayName: m.displayName,
        what: m.what,
        gh: "gh" in m ? m.gh : undefined,
        totalRepos: d.totalRepos ?? 0,
        totalCommits: d.totalCommits ?? 0,
        firstCommit: d.firstCommit ?? "",
        latestCommit: d.latestCommit ?? "",
        languages: Object.entries(d.languages ?? {}).sort((a, b) => b[1] - a[1]),
        activityHeatmap: d.activityHeatmap ?? [],
        generated: d.generated ?? "",
      })
    } catch {
      /* Missing or malformed file: skip it, and let `expected` show the gap. */
    }
  }

  orgs.sort((a, b) => b.totalCommits - a.totalCommits)
  return { orgs, expected: MISSIONS.length }
}

/** Year label from an ISO stamp, or an empty string. Never throws on bad input. */
export function isoYear(iso: string): string {
  if (!iso) return ""
  const y = new Date(iso).getUTCFullYear()
  return Number.isFinite(y) ? String(y) : ""
}
