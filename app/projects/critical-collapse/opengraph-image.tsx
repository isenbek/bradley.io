import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt =
  "Critical Collapse: a live numerical relativity lab that solves Einstein's equations in your browser and finds a black hole on the knife edge. bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "critical collapse · numerical relativity",
    title: "A black hole, forged on the knife edge.",
    subtitle:
      "Einstein's equations, integrating live on your device. Tune a scalar pulse to the boundary between dispersal and collapse, and watch the echoes appear.",
    tags: ["γ ≈ 0.374", "Δ ≈ 3.4453", "live GR solver", "canvas"],
    accent: "coral",
    cta: "Run the collapse →",
  })
}
