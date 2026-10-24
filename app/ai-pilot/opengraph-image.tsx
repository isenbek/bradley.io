import { readFileSync } from "fs"
import { join } from "path"
import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "AI pilot licence · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

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
  const projects = l.projectCount ?? 0

  return ogKitImageResponse({
    eyebrow: `${l.class ?? "ATP"} · ${l.number ?? ""}`,
    title: "AI pilot licence.",
    note: `${sessions.toLocaleString("en-US")} sessions · ${projects} projects`,
    sentence:
      "Public flight log of every commit, session, and message shipped with Claude as co-pilot.",
  })
}
