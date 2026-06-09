import { readFileSync } from "fs"
import { join } from "path"
import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "MCP Catalog — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

function loadStats() {
  try {
    const d = JSON.parse(
      readFileSync(join(process.cwd(), "public/data/mcp-catalog.json"), "utf-8")
    )
    return d.stats ?? { totalServices: 0, totalEndpoints: 0, totalCategories: 0 }
  } catch {
    return { totalServices: 0, totalEndpoints: 0, totalCategories: 0 }
  }
}

export default function OG() {
  const s = loadStats()
  return ogV3ImageResponse({
    eyebrow: "Campaign Brain · MCP",
    title: `${s.totalServices} services. ${s.totalEndpoints} endpoints.`,
    subtitle:
      "FastAPI microservices for AI, data, communication, infrastructure, and business — all open via MCP to LLM agents.",
    tags: ["AI", "Data", "Comms", "Infra", "Business"],
    accent: "blue",
    cta: "Browse catalog →",
  })
}
