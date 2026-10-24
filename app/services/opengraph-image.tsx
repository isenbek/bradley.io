import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "Services · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  return ogKitImageResponse({
    eyebrow: "Services",
    title: "Build what cloud-shaped consultants can't.",
    sentence:
      "Distributed systems, data pipelines, edge & IoT, AI/ML integration. Project, hourly, or retainer.",
  })
}
