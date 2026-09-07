/**
 * Photo stamper's pure logic (selftested in
 * scripts/housecalls-quote-selftest.mjs): what gets burned into the
 * pixels, and what the exported files are called. The burn is the product:
 * a proof photo whose label, time, and place cannot drift away from it in
 * a text thread.
 */

export interface StampFix {
  lat: number | null
  lon: number | null
}

/** 5 decimals is about a meter: right for "which house", honest about not
 *  being a survey. */
export const fmtCoord = (lat: number, lon: number): string =>
  `${lat.toFixed(5)}, ${lon.toFixed(5)}`

/** The lines burned onto the photo, top to bottom. */
export function stampLines(job: string, when: Date, fix: StampFix): string[] {
  const lines: string[] = []
  if (job.trim()) lines.push(job.trim())
  const d = when
  const pad = (n: number) => String(n).padStart(2, "0")
  lines.push(
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
  if (fix.lat != null && fix.lon != null) lines.push(fmtCoord(fix.lat, fix.lon))
  return lines
}

/** Filesystem-safe slug for a job label. */
export const jobSlug = (job: string): string =>
  job
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "job"

/** One photo's name inside the export. */
export const photoFilename = (job: string, takenAtIso: string, seq: number): string =>
  `${jobSlug(job)}-${takenAtIso.slice(0, 16).replace(/[:T]/g, "").replace(/-/g, "")}-${String(seq).padStart(2, "0")}.jpg`

/** The zip's own name. */
export const zipFilename = (job: string): string => `${jobSlug(job)}-photos.zip`
