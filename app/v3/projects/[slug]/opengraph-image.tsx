import { readFileSync } from "fs"
import { join } from "path"
import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Project — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

interface ProjectMeta {
  slug: string
  name: string
  tagline?: string
  description?: string
  category?: string
  status?: string
  technologies?: string[]
  totalMessages?: number
  isResearch?: boolean
}

function loadProjects(): ProjectMeta[] {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "public/data/site-data.json"), "utf-8")
    ).projects ?? []
  } catch {
    return []
  }
}

const CATEGORY_ACCENT: Record<string, "blue" | "coral" | "gold" | "green"> = {
  hardware: "coral",
  "ai-ml": "coral",
  data: "blue",
  systems: "green",
  creative: "gold",
}

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = loadProjects().find((p) => p.slug === slug)

  if (!project) {
    return ogV3ImageResponse({
      eyebrow: "Project",
      title: "bio·bradley.io",
      subtitle: "Project not found.",
      accent: "blue",
      cta: "Browse projects →",
    })
  }

  const accent = CATEGORY_ACCENT[project.category ?? ""] ?? "blue"
  const subtitle =
    project.tagline ||
    project.description?.slice(0, 180) ||
    "A project shipped with Claude as co-pilot."

  const tags = [
    project.category ? project.category.toUpperCase() : null,
    project.status ? project.status : null,
    project.totalMessages ? `${project.totalMessages.toLocaleString()} msgs` : null,
  ].filter(Boolean) as string[]

  return ogV3ImageResponse({
    eyebrow: "Project",
    title: project.name,
    subtitle,
    tags,
    accent,
    cta: "View project →",
  })
}
