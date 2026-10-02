import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"
import {
  DOMAIN_FALLBACK,
  domainLabel,
  isWithdrawn,
  type PapersData,
} from "@/components/papers/study"

export const runtime = "nodejs"
export const alt = "Papers · bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

/** The card's photo frame is 430 by 234. A figure is used only if it fits it. */
const FRAME = 430 / 234
const FIT = 0.03

/**
 * A real figure for the card: the newest listed study whose PNG is within 3%
 * of the frame's shape, so the plot is never visibly stretched. Width and
 * height come from the PNG header. Ten of the files named .png are JPEGs and
 * are skipped by the signature test rather than guessed at.
 */
function pickFigure(studies: PapersData["studies"]): string | undefined {
  const newestFirst = [...studies].sort((a, b) =>
    (b.createdAt || "0000").localeCompare(a.createdAt || "0000")
  )
  for (const s of newestFirst) {
    const url = s.previewImage
    if (!url || !url.startsWith("/") || url.includes("..")) continue
    const file = join(process.cwd(), "public", url)
    if (!existsSync(file)) continue
    const buf = readFileSync(file)
    const isPng = buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47
    if (!isPng) continue
    const w = buf.readUInt32BE(16)
    const h = buf.readUInt32BE(20)
    if (!w || !h || Math.abs(w / h / FRAME - 1) > FIT) continue
    return `data:image/png;base64,${buf.toString("base64")}`
  }
  return undefined
}

function loadStats() {
  try {
    const d = JSON.parse(
      readFileSync(join(process.cwd(), "public/data/papers-data.json"), "utf-8")
    ) as PapersData
    // The same two counts the page prints: what is listed, and how many of
    // those have a figure file that is really on disk.
    const listed = d.studies.filter((s) => !isWithdrawn(s))
    const figures = listed.filter(
      (s) => s.previewImage && existsSync(join(process.cwd(), "public", s.previewImage))
    ).length
    const count = new Map<string, number>()
    for (const s of listed) count.set(s.category, (count.get(s.category) ?? 0) + 1)
    const tags = [...count.entries()]
      .filter(([id]) => id !== DOMAIN_FALLBACK)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 3)
      .map(([id]) => domainLabel(id))
    return { notes: listed.length, figures, tags, image: pickFigure(listed) }
  } catch {
    return { notes: 0, figures: 0, tags: [] as string[], image: undefined }
  }
}

export default function OG() {
  const s = loadStats()
  // Not "open data": on 2026-10-02 the lab had withdrawn 38 studies, because
  // their data does not allow commercial use or because the source was
  // rejected and its data deleted (scripts/papers-pipeline.py), and the page
  // counts them. The card states what is listed, in the same two numbers the
  // page prints.
  return ogV3ImageResponse({
    eyebrow: "Papers · TerraPulse lab",
    title:
      s.notes > 0 ? `${s.notes} research notes. ${s.figures} figures.` : "Research notes, with figures.",
    subtitle: "From seismology to space weather. Mostly drafts, each with its status.",
    tags: s.tags,
    accent: "coral",
    cta: "Browse the notes →",
    image: s.image,
    imageFrame: Boolean(s.image),
  })
}
