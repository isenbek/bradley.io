import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Entropy Space — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "entropy space · live 3D",
    title: "What does randomness look like?",
    subtitle:
      "Rotatable point clouds of live radioactive-decay entropy — true noise fills space, a broken PRNG can't hide its planes.",
    tags: ["Three.js", "RANDU", "point cloud", "live"],
    accent: "green",
    cta: "Rotate the entropy →",
  })
}
