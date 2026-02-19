import type { CategoryId } from "./project-categories"

// --- Core Types ---

export interface ClaudeCorner {
  quote: string           // AI-generated witty commentary (~2-3 sentences)
  context: string         // What the quote references (e.g. "recent ESP32 work")
  generatedAt: string     // ISO timestamp
  mood: "excited" | "reflective" | "impressed" | "curious" | "amused"
}

export interface SiteData {
  generated: string
  stats: SiteStats
  activityFeed: ActivityItem[]
  projects: Project[]
  categories: CategorySummary[]
  about: AboutData
  labProjects: Project[]
  claudeCorner?: ClaudeCorner
}

export interface SiteStats {
  totalProjects: number
  totalSessions: number
  totalMessages: number
  activeDays: number
  streak: number
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
}

export interface Project {
  slug: string
  name: string
  tagline: string
  description: string
  category: CategoryId
  isResearch: boolean
  isFeatured: boolean
  status: "active" | "paused" | "completed" | "archived"
  technologies: string[]
  lastActivity: string
  totalMessages: number
  sources: ProjectSource
  claudeInvolvement?: string   // AI-generated description of Claude's role in this project
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
