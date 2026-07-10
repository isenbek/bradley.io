import { readFileSync } from "fs"
import { join } from "path"
import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Cost Analysis · bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

function loadModel() {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "public/data/cost-model.json"), "utf-8")
    )
  } catch {
    return null
  }
}

export default function OG() {
  const d = loadModel()
  const savings = d?.comparison?.costSavingsPercent ?? 95
  const velocity = d?.comparison?.velocityMultiplier ?? 570
  const actual = d?.actual?.totalCost ?? 60800
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`

  return ogV3ImageResponse({
    eyebrow: "Cost analysis · real numbers",
    title: `${savings}% cheaper. ${velocity}× faster.`,
    subtitle: `One operator + Claude shipped Campaign Brain for ${fmt(actual)}, what a 9.5-person team would quote $850K to $1.7M to build.`,
    tags: ["117 days", "1 operator", "84 repos", "15K commits"],
    accent: "green",
    cta: "See the numbers →",
  })
}
