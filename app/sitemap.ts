import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://bradley.io"

  const staticPages = [
    { url: base, changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${base}/about`, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${base}/projects`, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${base}/services`, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${base}/ai-pilot`, changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${base}/lab`, changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${base}/mcp`, changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${base}/style-guide`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${base}/projects/nominate-ai`, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${base}/projects/tinymachines`, changeFrequency: "weekly" as const, priority: 0.8 },
  ]

  return staticPages.map((page) => ({
    ...page,
    lastModified: new Date(),
  }))
}
