import type { MetadataRoute } from "next"
import { readFileSync } from "fs"
import { join } from "path"

function loadSiteData(): { projects: { slug: string }[] } | null {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "public/data/site-data.json"), "utf-8")
    )
  } catch {
    return null
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://bradley.io"
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1.0, lastModified: now },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: `${base}/projects`, changeFrequency: "weekly", priority: 0.9, lastModified: now },
    { url: `${base}/services`, changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: `${base}/ai-pilot`, changeFrequency: "daily", priority: 0.7, lastModified: now },
    { url: `${base}/lab`, changeFrequency: "weekly", priority: 0.6, lastModified: now },
    { url: `${base}/mcp`, changeFrequency: "weekly", priority: 0.7, lastModified: now },
    { url: `${base}/terminal`, changeFrequency: "monthly", priority: 0.5, lastModified: now },
    { url: `${base}/wargames`, changeFrequency: "monthly", priority: 0.5, lastModified: now },
    { url: `${base}/style-guide`, changeFrequency: "monthly", priority: 0.3, lastModified: now },
  ]

  // Timeline pages
  const timelineOrgs = ["nominate-ai", "tinymachines", "sysforge-ai", "isenbek"]
  const timelinePages: MetadataRoute.Sitemap = timelineOrgs.map((org) => {
    let lastModified = now
    try {
      const data = JSON.parse(
        readFileSync(join(process.cwd(), `public/data/${org}-timeline.json`), "utf-8")
      )
      if (data.generated) lastModified = new Date(data.generated)
    } catch { /* use now */ }
    return {
      url: `${base}/projects/${org}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      lastModified,
    }
  })

  // Dynamic project detail pages from site-data.json
  const siteData = loadSiteData()
  const projectPages: MetadataRoute.Sitemap = (siteData?.projects || [])
    .filter((p) => !timelineOrgs.includes(p.slug))
    .map((p) => ({
      url: `${base}/projects/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
      lastModified: now,
    }))

  return [...staticPages, ...timelinePages, ...projectPages]
}
