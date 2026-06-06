import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card"

export const runtime = "nodejs"
export const alt = "Hotbits TRNG — Radioactive-decay random number generator"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OG() {
  return ogImageResponse({
    eyebrow: "Hotbits TRNG",
    title: "Entropy from decay.",
    subtitle:
      "Live status for the Hotbits true random number generator — entropy harvested from radioactive decay on a Pi 4 Geiger counter.",
    tags: ["Hardware", "Live", "Pi 4", "Geiger"],
    accent: "green",
  })
}
