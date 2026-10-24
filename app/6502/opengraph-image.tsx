import { readFileSync } from "fs"
import { join } from "path"
import { ogKitImageResponse, OG_KIT_SIZE, OG_KIT_CONTENT_TYPE } from "@/lib/og-card-kit"

export const runtime = "nodejs"
export const alt = "The 6502, switch by switch · bradley.io"
export const size = OG_KIT_SIZE
export const contentType = OG_KIT_CONTENT_TYPE

export default function OG() {
  // A band of the real decapped die (visual6502, CC BY-NC-SA 3.0) — the
  // "6502-D" marking sits in the top-left of this crop.
  const die = `data:image/jpeg;base64,${readFileSync(
    join(process.cwd(), "public/6502/og-die.jpg")
  ).toString("base64")}`

  return ogKitImageResponse({
    eyebrow: "preservation · silicon archaeology",
    title: "The 6502, switch by switch.",
    sentence:
      "A 1975 processor simulated from a photograph of its own die, and a link-checked archive of everything around it.",
    image: die,
    imageFrame: true,
  })
}
