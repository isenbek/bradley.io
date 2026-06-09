import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card"

export const runtime = "nodejs"
export const alt = "Research Papers — Seismology, space weather, climate analysis"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OG() {
  return ogImageResponse({
    eyebrow: "TerraPulse Research",
    title: "Patterns hiding in plain data.",
    subtitle:
      "Active studies in seismology, space weather, climate, and cross-domain environmental statistics — open data, reproducible methods.",
    tags: ["Seismology", "Space weather", "Climate", "Open data"],
    accent: "green",
    cta: "Read research →",
  })
}
