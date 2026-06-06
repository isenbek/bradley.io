import { readFileSync } from "fs"
import { join } from "path"
import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card"

export const runtime = "nodejs"
export const alt = "Project — bradley.io"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

interface ProjectMeta {
  slug: string
  name: string
  tagline?: string
  description?: string
  category?: string
  totalSessions?: number
  totalMessages?: number
}

function loadProjects(): ProjectMeta[] {
  try {
    const data = JSON.parse(
      readFileSync(join(process.cwd(), "public/data/site-data.json"), "utf-8")
    )
    return data.projects || []
  } catch {
    return []
  }
}

const CATEGORY_ACCENT: Record<string, "cyan" | "orange" | "blue" | "green" | "purple" | "amber"> = {
  hardware: "orange",
  ai: "purple",
  data: "blue",
  research: "green",
  infra: "cyan",
  creative: "amber",
}

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = loadProjects().find((p) => p.slug === slug)

  if (!project) {
    return ogImageResponse({
      eyebrow: "Project",
      title: "bradley.io",
      subtitle: "Project not found.",
      accent: "cyan",
    })
  }

  const accent = CATEGORY_ACCENT[project.category ?? ""] ?? "cyan"
  const subtitle =
    project.tagline ||
    project.description?.slice(0, 180) ||
    "A project shipped with Claude as co-pilot."

  const tags = [
    project.category ? project.category.toUpperCase() : null,
    project.totalSessions ? `${project.totalSessions} sessions` : null,
    project.totalMessages ? `${project.totalMessages.toLocaleString()} msgs` : null,
  ].filter(Boolean) as string[]

  return ogImageResponse({
    eyebrow: "Project",
    title: project.name,
    subtitle,
    tags,
    accent,
    cta: "View project →",
  })
}
