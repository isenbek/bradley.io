import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt =
  "Critical Collapse: a live numerical relativity lab that solves Einstein's equations in your browser and finds a black hole on the knife edge. bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "critical collapse · numerical relativity",
    title: "A black hole, forged on the knife edge.",
    sentence:
      "Einstein's equations, integrating live on your device. Tune a scalar pulse to the boundary between dispersal and collapse, and watch the echoes appear.",
  })
}
