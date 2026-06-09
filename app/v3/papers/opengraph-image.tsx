import { readFileSync } from "fs"
import { join } from "path"
import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Papers — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

function loadStats() {
  try {
    const d = JSON.parse(
      readFileSync(join(process.cwd(), "public/data/papers-data.json"), "utf-8")
    )
    return {
      totalStudies: d.totalStudies ?? 0,
      totalReferences: d.totalReferences ?? 0,
      categoryCount: Object.keys(d.categories ?? {}).length,
    }
  } catch {
    return { totalStudies: 0, totalReferences: 0, categoryCount: 0 }
  }
}

export default function OG() {
  const s = loadStats()
  return ogV3ImageResponse({
    eyebrow: "TerraPulse · papers",
    title: `${s.totalStudies} studies. Open data.`,
    subtitle:
      "Seismology, space weather, climate, hydrology, cross-domain analysis. Notes and papers from the lab.",
    tags: ["Seismology", "Space Weather", "Climate", "Cross-domain"],
    accent: "coral",
    cta: "Read research →",
  })
}
