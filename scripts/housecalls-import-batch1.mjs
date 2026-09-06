// One-off curated import: first prospects from the day-one crawl's Clutch
// manufacturing directory page. All stage "identified", no signal claimed
// (a directory listing is not an OBSERVED_SIGNAL), needs_review true.
import { readFileSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
const F = "/home/bisenbek/projects/bradleyio/data/housecalls/prospects.json"
const idFor = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12)
const SRC = {
  job_id: "job_05944c29f65746e0",
  harvested_at: "2026-09-06T10:26:00Z",
  via: "clutch.co Grand Rapids manufacturing directory (crawled page)",
}
const BATCH = [
  ["IdX Corporation", "Grand Rapids", "1,000-9,999 staff per directory"],
  ["Design Manufacturing, LLC", "Walker", "50-249 staff per directory"],
  ["Roskam Baking Company", "Grand Rapids", "directory: based in Grand Rapids"],
  ["JR Automation", "Holland", "large automation integrator"],
  ["Light Metals Corporation", "Wyoming", "aluminum extrusion"],
  ["Extol, Inc", "Zeeland", "plastics welding equipment, founded 1985"],
  ["Pliant Plastics Corporation", "Muskegon", "plastics manufacturer"],
  ["Fab Masters Company, Inc", null, "fabrication, city unverified"],
  ["Kent Quality Foods", "Grand Rapids", "food manufacturer"],
  ["Tecomet", null, "precision manufacturing, local site unverified"],
  ["Litehouse Inc", "Lowell", "food manufacturer, Lowell MI plant"],
  ["Contract Source & Assembly", "Grand Rapids", "directory: in Grand Rapids"],
]
const prospects = JSON.parse(readFileSync(F, "utf8"))
let added = 0
for (const [name, city, note] of BATCH) {
  const id = idFor(name)
  if (id in prospects) continue
  prospects[id] = {
    id, name, url: null, city,
    location: city, county: null,
    sector: "manufacturing",
    signal: null, signal_url: null, signal_category: null, signal_seen_at: null,
    contact: null, stage: "identified", needs_review: true,
    curation_note: note, source: SRC,
  }
  added++
}
writeFileSync(F, JSON.stringify(prospects, null, 1) + "\n")
console.log(`imported ${added} curated prospects (total ${Object.keys(prospects).length})`)
