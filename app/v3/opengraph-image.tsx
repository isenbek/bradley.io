import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "bio·bradley.io — v3 brand refactor"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "v3 · brand refresh",
    title: "A fresh, fluid identity.",
    subtitle:
      "Hardware hacker, data architect, AI pilot. Anti-cloud, host local, think global.",
    tags: ["Bio Blue", "Bricolage", "Hanken", "Baloo 2"],
    accent: "blue",
    cta: "Preview the system →",
  })
}
