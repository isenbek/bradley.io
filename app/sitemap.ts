import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://bradley.io"
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1.0, lastModified: now },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
    { url: `${base}/projects`, changeFrequency: "weekly", priority: 0.9, lastModified: now },
    { url: `${base}/6502`, changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: `${base}/projects/prime-orchestra`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
    { url: `${base}/projects/prime-zoo`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
    { url: `${base}/projects/prime-atlas`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
    { url: `${base}/projects/zeta-forge`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
    { url: `${base}/projects/storm-plates`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
    { url: `${base}/projects/critical-collapse`, changeFrequency: "monthly", priority: 0.7, lastModified: now },
    { url: `${base}/services`, changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: `${base}/ai-pilot`, changeFrequency: "daily", priority: 0.7, lastModified: now },
    // New at the style-kit cutover: the four GitHub orgs rolled up. It replaces
    // what the per-repository dossiers under /projects used to answer, so it
    // carries their weight rather than /projects' 0.9.
    { url: `${base}/work`, changeFrequency: "weekly", priority: 0.8, lastModified: now },
    { url: `${base}/pilot-analytics`, changeFrequency: "daily", priority: 0.6, lastModified: now },
    { url: `${base}/mcp`, changeFrequency: "weekly", priority: 0.7, lastModified: now },
    { url: `${base}/papers`, changeFrequency: "weekly", priority: 0.8, lastModified: now },
    { url: `${base}/cost-analysis`, changeFrequency: "weekly", priority: 0.8, lastModified: now },
    { url: `${base}/the-shift`, changeFrequency: "monthly", priority: 0.8, lastModified: now },
    { url: `${base}/terminal`, changeFrequency: "monthly", priority: 0.5, lastModified: now },
    { url: `${base}/trng`, changeFrequency: "daily", priority: 0.6, lastModified: now },
    { url: `${base}/dragonfli`, changeFrequency: "daily", priority: 0.6, lastModified: now },
    { url: `${base}/dragonfli/airspace`, changeFrequency: "daily", priority: 0.5, lastModified: now },
    { url: `${base}/dragonfli/gps`, changeFrequency: "daily", priority: 0.5, lastModified: now },
    { url: `${base}/dragonfli/worldevent`, changeFrequency: "daily", priority: 0.5, lastModified: now },
    { url: `${base}/sdr`, changeFrequency: "daily", priority: 0.6, lastModified: now },
    { url: `${base}/meatball`, changeFrequency: "daily", priority: 0.6, lastModified: now },
    // /style-guide was retired with the v3 swap; its source is in git history.
    // /eyes and /meatball/{log,memory} stay out — noindex by design.
  ]

  // The timeline org pages and the 236 per-repository dossiers were generated
  // here until 2026-08-29. Both are gone: /work replaced the org pages, and the
  // dossiers were retired with the rest of the v3 layer. A sitemap that keeps
  // advertising them is worse than one that omits them, because it invites a
  // crawler to a 404 and then tells it the page changes weekly.
  return staticPages
}
