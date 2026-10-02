import type { CategoryId } from "./project-categories"

// --- Core Types ---

// Written by scripts/nightly-pipeline.py (every 4 hours, despite the name).
// The claudeCorner and bigIdeas keys and their types were removed 2026-10-02
// together with the pipeline stages that wrote them: both were model-invented
// text that no page read, and neither key had been in the file for months.

export interface SiteData {
  generated: string
  stats: SiteStats
  activityFeed: ActivityItem[]
  projects: Project[]
  categories: CategorySummary[]
  about: AboutData
  labProjects: Project[]
  /** Absent in files written before 2026-10-02. */
  aiSummary?: AiSummary
}

export interface SiteStats {
  /** Entries in `projects`, see coverage.definitions.totalProjects. */
  totalProjects: number
  totalSessions: number
  /** Transcript records, NOT messages somebody typed. See coverage.definitions. */
  totalMessages: number
  activeDays: number
  streak: number
  /** What the four activity numbers cover. Absent in files written before 2026-10-02. */
  coverage?: StatsCoverage
}

export interface StatsCoverage {
  /** First and last day covered, "YYYY-MM-DD". null only when a pre-coverage file was carried forward. */
  since: string | null
  through: string | null
  /** "claude-activity.duckdb", or "previous site-data.json" when carried forward. */
  source: string
  /** The day the durable record started; earlier months are incomplete. */
  recordingBegan?: string
  dayTimezone?: string
  /** true when the durable record could not be read and the numbers are from an earlier run. */
  stale?: boolean
  staleReason?: string
  /** One paragraph a page can print as is. */
  note: string
  /** Plain-language meaning of each stats field, keyed by field name. */
  definitions: Record<string, string>
}

/** What happened to model taglines on the run that wrote the file. */
export interface AiSummary {
  succeeded: number
  failed: number
  reused: number
  keptPrevious: number
  notAttempted: number
  skippedByLimit: number
  skippedByBudget: number
  skippedBackendsDown: number
  /** Projects with no description anywhere: tagline and description left empty. */
  noEvidence: number
  limit: number | null
  budgetMin: number
  skipped: boolean
  calls: number
  answeredByGateway: number
  answeredByOllama: number
  fallbackModel: string
  scope: string
}

export interface ActivityItem {
  type: "claude-code" | "claude-web" | "github" | "milestone"
  title: string
  description: string
  projectSlug: string | null
  category: CategoryId | null
  date: string
  metadata: Record<string, string | number>
}

export interface ProjectSource {
  claudeCode?: {
    totalSessions: number
    totalMessages: number
    lastSession: string
  }
  claudeWeb?: {
    conversationCount: number
    totalMessages: number
    lastConversation: string
  }
  github?: {
    repo: string
    stars: number
    language: string
    lastPush: string
  }
  /** Set when the description was taken from a published public/data/*-timeline.json. */
  timeline?: {
    org: string
    repo: string
    commits: number
    /** The timeline's own label for that text: "github", "ai", "reused", "kept" or "unknown". */
    descriptionSource: string
  }
}

/**
 * Where a project's text came from.
 *   claude-web  the Claude Web project's own note. Only for projects on the
 *               pipeline's publication list; every other note is withheld
 *   github      the GitHub repo's own description
 *   timeline    the repo description in a published timeline file
 *   ai          a model tagline written on this run from the description
 *   ai-cached   a model tagline written on an earlier run
 *   ai-legacy   a model-written description from before June 2026, kept because the
 *               project's own note is not cleared for publication. Not checked
 *               against anything: treat it as unverified text
 *   previous    carried over from a file that recorded no origin (much of it model text)
 *   none        there is no text
 * Descriptions are never "ai" or "ai-cached": the pipeline no longer asks a
 * model for one. "ai-legacy" and "previous" are the old ones still standing.
 */
export type TextProvenance =
  | "claude-web"
  | "github"
  | "timeline"
  | "ai"
  | "ai-cached"
  | "ai-legacy"
  | "previous"
  | "none"

export interface Project {
  slug: string
  name: string
  tagline: string
  description: string
  category: CategoryId
  isResearch: boolean
  isFeatured: boolean
  /** "recent" (active in the last 30 days, not the last 7) was already in the published data; the type had missed it. */
  status: "active" | "recent" | "paused" | "completed" | "archived"
  technologies: string[]
  lastActivity: string
  totalMessages: number
  sources: ProjectSource
  /** Absent in files written before 2026-10-02. */
  provenance?: { tagline: TextProvenance; description: TextProvenance }
  /** "default" means no keyword matched and "systems" is only the fallback. */
  categoryBasis?: "keywords" | "default"
}

export interface CategorySummary {
  id: CategoryId
  label: string
  color: string
  icon: string
  count: number
}

export interface AboutData {
  bio: string
  skills: string[]
  timeline: TimelineEntry[]
}

export interface TimelineEntry {
  year: string
  title: string
  description: string
}

// --- Data Loading ---

export async function loadSiteData(): Promise<SiteData> {
  const res = await fetch("/data/site-data.json")
  if (!res.ok) throw new Error("Failed to load site data")
  return res.json()
}

export async function loadSiteDataStatic(): Promise<SiteData> {
  const fs = await import("fs/promises")
  const path = await import("path")
  const filePath = path.join(process.cwd(), "public", "data", "site-data.json")
  const raw = await fs.readFile(filePath, "utf-8")
  return JSON.parse(raw)
}
