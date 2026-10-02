import { readFileSync } from "fs"
import { join } from "path"

/**
 * The four mission timelines, rolled up to the org.
 *
 * Reads public/data/<slug>-timeline.json, written by
 * scripts/nominate-timeline-pipeline.py. Those files stay the one copy of the
 * fact: every number this module returns is a sum over what they contain.
 *
 * ---------------------------------------------------------------------------
 * WHAT THE PIPELINE COUNTS, AND WHY THIS MODULE CUTS IT
 *
 * The pipeline counts every commit in every repository of an org, whoever
 * wrote it. Three things follow, all measured on 2026-10-02 from the
 * pipeline's own cache (.<slug>-timeline-cache.json, which keeps the author of
 * each commit) and from the GitHub API (`fork`, `private` per repository):
 *
 *   1. FORKS AND IMPORTS CARRY OTHER PEOPLE'S HISTORY. tinymachines holds a
 *      fork of ripgrep whose log starts in 2016; isenbek holds nine forks, the
 *      oldest from 2014; and some private repositories began as imports of
 *      other projects' logs. `firstCommit` in each file is therefore the
 *      date of somebody else's commit. Until this was noticed the page said
 *      "2014 to now" and drew yearly bars for years in which the owner had
 *      not committed anything to these orgs.
 *
 *   2. THE OWNER'S OWN HISTORY IN EACH ORG HAS A CLEAN START. Before the dates
 *      in `since` below there is not one commit under his name; after them
 *      there are. So `since` is a real boundary, it is a historical fact that
 *      cannot go stale, and everything this module reports as "commits" is
 *      counted from it. What lies before it is reported separately as
 *      `upstreamBefore` and is never drawn.
 *
 *   3. INSIDE THE PERIOD THE COUNT IS STILL NOT PURELY HIS. It includes fork
 *      and import commits dated after `since`, other authors, and commits a
 *      script made (deploy.sh writes a version bump and a build
 *      stamp on every deploy of this site; Sysforge-AI's repository has had a
 *      nightly catalog refresh as its only commit since March 2026). The
 *      timeline files publish no author, so this cannot be subtracted here.
 *      AUTHOR_AUDIT is the dated measurement the page prints instead.
 *
 * The honest fix is in the pipeline, not here: emit `fork`, `private` and an
 * author-filtered count per repository and per day. When it does, `since`,
 * LISTED and AUTHOR_AUDIT can all be deleted and derived.
 *
 * ---------------------------------------------------------------------------
 * WHICH REPOSITORIES ARE NAMED
 *
 * `listed` is an allowlist, so it fails closed: a repository the pipeline
 * finds tomorrow is counted and not named until somebody adds it here. A name
 * is on the list only if the GitHub API said the repository was public and
 * not a fork on 2026-10-02, its log is the owner's own (one public repository
 * in tinymachines is an import of another project's history and is left off),
 * and the name is not a person's. Nominate-AI and Sysforge-AI are private
 * throughout and list nothing.
 *
 * ---------------------------------------------------------------------------
 * FOR OTHER PAGES (the home page's org cards)
 *
 * Every field on OrgRollup is already cut at `since`, including the three
 * that keep their older names: `firstCommit`, `totalCommits` and
 * `activityHeatmap` carry the same values as `since`, `commitsSince` and
 * `ownHeatmap`. That is deliberate. Callers written before the cut (the home
 * page, the chart specimens) read the old names, and a page that printed the
 * file's own first commit would say "2014 to now" again. What the files
 * literally contain is under `file`, and only the method note on /work
 * should ever print it.
 *
 * Anchors on /work are the slugs: /work#nominate-ai, /work#tinymachines,
 * /work#isenbek, /work#sysforge-ai, and /work#counting for the method note.
 */

export interface CommitDay {
  date: string
  commits: number
  repos: number
  intensity: number
}

/** One repository that may be named on the page. */
export interface RepoRow {
  name: string
  /** Empty when GitHub recorded no primary language. */
  language: string
  commits: number
  /** ISO days, sliced from the pipeline's stamps. */
  firstCommit: string
  lastCommit: string
  /**
   * The repository's own GitHub description, and only that: text the pipeline
   * marks `descriptionSource: "github"`. Model-written summaries are left out,
   * because several of them are wrong about what the repository is.
   */
  description: string
  url: string
}

export interface OrgRollup {
  slug: string
  /** Display name, cased as the org writes it. */
  displayName: string
  /** What the org is, in one clause. */
  what: string
  gh?: string
  totalRepos: number
  /** Same as `commitsSince`. Kept under this name for existing callers. */
  totalCommits: number
  /** Same as `since`. Kept under this name for existing callers. */
  firstCommit: string
  latestCommit: string
  /** Language name to repo count, already sorted, largest first. */
  languages: [string, number][]
  /** Same as `ownHeatmap`. Kept under this name for existing callers. */
  activityHeatmap: CommitDay[]
  /** ISO stamp the pipeline wrote into the file. */
  generated: string
  /**
   * What the file itself says, upstream history included. For the method note
   * on /work and nowhere else: these are not the owner's span or count.
   */
  file: { firstCommit: string; totalCommits: number }

  /** ISO day of the first commit under the owner's name in this org. */
  since: string
  /** The heatmap from `since` on. This is what the page draws. */
  ownHeatmap: CommitDay[]
  /** Commits dated on or after `since`. */
  commitsSince: number
  /** Commits dated before `since`: upstream history, none of it the owner's. */
  upstreamBefore: number
  /**
   * Repositories that may be named, most recent commit first. Null when the
   * org is private throughout and nothing is listed.
   */
  listed: RepoRow[] | null
}

interface TimelineRepo {
  name: string
  description?: string
  language?: string
  commits?: number
  firstCommit?: string
  lastCommit?: string
  descriptionSource?: string
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
  repos?: TimelineRepo[]
}

interface Mission {
  slug: string
  file: string
  displayName: string
  gh?: string
  what: string
  /** First commit under the owner's name. Pipeline cache, 2026-10-02. */
  since: string
  /** Public, non-fork, own-history repositories. GitHub API, 2026-10-02. */
  listed?: string[]
}

const MISSIONS: Mission[] = [
  {
    slug: "nominate-ai",
    file: "nominate-ai-timeline.json",
    displayName: "Nominate-AI",
    gh: "https://github.com/Nominate-AI",
    what: "AI-native sourcing platform: pipelines, vector search, agents",
    since: "2025-04-14",
  },
  {
    slug: "tinymachines",
    file: "tinymachines-timeline.json",
    displayName: "tinymachines",
    gh: "https://github.com/tinymachines",
    what: "the lab umbrella: edge hardware, radios, simulators, this design kit",
    since: "2025-03-11",
    listed: [
      "2a03", "2c02", "6502", "addai", "ari", "bilder", "blossom", "classic-rock", "curly",
      "esp32", "gcombinatr", "halfphi", "hotbits", "llisp", "nes", "nes-bench", "nes-bus",
      "ntsc-crt", "psjson", "public", "resume", "rpi5-arm-assembly", "rustforhaters", "scream",
      "shelldown", "sovereign", "spydr", "vectl", "watr", "yeet",
    ],
  },
  {
    slug: "isenbek",
    file: "isenbek-timeline.json",
    displayName: "isenbek",
    gh: "https://github.com/isenbek",
    what: "the solo namespace: this site, House Calls, side projects",
    since: "2025-01-15",
    listed: ["bradley.io", "housecalls", "housecalls-harness", "vite-react-chakra-starter"],
  },
  {
    slug: "sysforge-ai",
    file: "sysforge-ai-timeline.json",
    displayName: "Sysforge-AI",
    what: "the consulting firm's organisation: one private repository, its own site",
    since: "2026-02-15",
  },
]

/**
 * Who wrote the commits, measured once, for the four organisations together.
 *
 * The timeline files carry no author, so the page cannot compute this. It was
 * counted on the date below from the pipeline's cache, which keeps the author
 * name of every commit, and it is printed on the page as a dated measurement,
 * never as a live number. `total` is what the four files summed to that day,
 * so the page can show the measurement and today's total side by side without
 * pretending they are the same run.
 *
 * Only the sum over all four is kept, here and on the page. A per-organisation
 * split would describe who works in private repositories, and that is not this
 * site's to publish.
 *
 *   owner     author name is one of the owner's own git identities
 *   claude    author name is "Claude" or "Claude Code"
 *   others    any other name, dated on or after `since`: fork and import
 *             history inside the period, and other authors
 *   upstream  dated before `since` (no owner commit among them)
 *
 * owner + claude + others + upstream === total.
 */
export interface AuthorCount {
  total: number
  owner: number
  claude: number
  others: number
  upstream: number
}

export const AUTHOR_AUDIT: { measured: string; all: AuthorCount } = {
  measured: "2026-10-02",
  all: { total: 47_394, owner: 33_881, claude: 845, others: 3_954, upstream: 8_714 },
}

/** The audit over all four orgs. Kept as a function for existing callers. */
export function auditTotals(): AuthorCount {
  return { ...AUTHOR_AUDIT.all }
}

/** A string that starts with a real ISO day ("2026-10-02..."). */
function isIsoDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) && Number.isFinite(Date.parse(v.slice(0, 10)))
}

/** A repository description, with the dashes the site does not print removed. */
function cleanDescription(text: string): string {
  return text
    .replace(/\s*[\u2014\u2013]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim()
}

function listRepos(m: Mission, repos: TimelineRepo[]): RepoRow[] | null {
  if (!m.listed) return null
  const allow = new Set(m.listed)
  return repos
    .filter((r) => allow.has(r.name))
    .map((r) => ({
      name: r.name,
      language: r.language && r.language !== "Unknown" ? r.language : "",
      commits: r.commits ?? 0,
      firstCommit: (r.firstCommit ?? "").slice(0, 10),
      lastCommit: (r.lastCommit ?? "").slice(0, 10),
      description:
        r.descriptionSource === "github" && r.description ? cleanDescription(r.description) : "",
      url: `https://github.com/${m.displayName}/${r.name}`,
    }))
    .sort((a, b) => b.lastCommit.localeCompare(a.lastCommit) || b.commits - a.commits)
}

/**
 * Load all four rollups, largest first by commits since each org's own start.
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
      // The page counts back from the file's own stamp; a file without a
      // parseable one falls back to its latest commit, and with neither it is
      // skipped like a file that did not parse (the page then says so).
      const generated = [d.generated, d.latestCommit].find(isIsoDate)
      if (!generated) throw new Error(`${m.file}: no usable date`)
      const heat = d.activityHeatmap ?? []
      const ownHeatmap = heat.filter((h) => h.date >= m.since)
      const commitsSince = ownHeatmap.reduce((s, h) => s + (h.commits ?? 0), 0)
      const upstreamBefore = heat
        .filter((h) => h.date < m.since)
        .reduce((s, h) => s + (h.commits ?? 0), 0)

      orgs.push({
        slug: m.slug,
        displayName: m.displayName,
        what: m.what,
        gh: m.gh,
        totalRepos: d.totalRepos ?? 0,
        totalCommits: commitsSince,
        firstCommit: m.since,
        latestCommit: d.latestCommit ?? "",
        languages: Object.entries(d.languages ?? {}).sort((a, b) => b[1] - a[1]),
        activityHeatmap: ownHeatmap,
        generated,
        file: { firstCommit: d.firstCommit ?? "", totalCommits: d.totalCommits ?? 0 },
        since: m.since,
        ownHeatmap,
        commitsSince,
        upstreamBefore,
        listed: listRepos(m, d.repos ?? []),
      })
    } catch {
      /* Missing or malformed file: skip it, and let `expected` show the gap. */
    }
  }

  orgs.sort((a, b) => b.commitsSince - a.commitsSince)
  return { orgs, expected: MISSIONS.length }
}

/** Year label from an ISO stamp, or an empty string. Never throws on bad input. */
export function isoYear(iso: string): string {
  if (!iso) return ""
  const y = new Date(iso).getUTCFullYear()
  return Number.isFinite(y) ? String(y) : ""
}
