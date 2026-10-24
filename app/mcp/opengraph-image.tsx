import { readFileSync } from "fs"
import { join } from "path"
import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "MCP Catalog · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

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
  return ogKitImageResponse({
    eyebrow: "Campaign Brain · MCP",
    title: `${s.totalServices} services. ${s.totalEndpoints} endpoints.`,
    sentence:
      "FastAPI microservices for AI, data, communication, infrastructure, and business: all open via MCP to LLM agents.",
  })
}
