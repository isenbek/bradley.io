import { readFileSync } from "fs"
import { join } from "path"
import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "AI Pilot License — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

function loadLicense() {
  try {
    const d = JSON.parse(
      readFileSync(join(process.cwd(), "public/data/ai-pilot-data.json"), "utf-8")
    )
    return d.license ?? {}
  } catch {
    return {}
  }
}

export default function OG() {
  const l = loadLicense()
  const sessions = l.totalSessions ?? 0
  const messages = (l.totalMessages ?? 0).toLocaleString()
  const projects = l.projectCount ?? 0

  return ogV3ImageResponse({
    eyebrow: `${l.class ?? "ATP"} · ${l.number ?? ""}`,
    title: "AI Pilot License.",
    subtitle:
      "Public flight log of every commit, session, and message shipped with Claude as co-pilot.",
    tags: [`${sessions} sessions`, `${messages} msgs`, `${projects} projects`],
    accent: "blue",
    cta: "Open dashboard →",
  })
}
