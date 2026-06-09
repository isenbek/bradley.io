import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Terminal — bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

export default function OG() {
  return ogV3ImageResponse({
    eyebrow: "Terminal · interactive CLI",
    title: "$ whoami",
    subtitle:
      "Poke around the portfolio the old-fashioned way. Type help, hit enter, see what happens.",
    tags: ["bash", "REPL", "CRT", "history"],
    accent: "blue",
    cta: "Open the shell →",
  })
}
