// One-off curated import #2: the West Michigan CEO Council roster (Grand
// Rapids Chamber, public page) from the cloud-cost crawl. Membership is a
// public fact and gives us named leaders, but it is NOT an observed need
// signal, so signal stays null. Contact leads carry name + null email:
// rubric G3 needs both, so these rows stay in the discovery queue until an
// email path is found. Also updates the existing Roskam row with its CEO.
import { readFileSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
const F = "/home/bisenbek/projects/bradleyio/data/housecalls/prospects.json"
const idFor = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12)
const SRC = {
  job_id: "job_ddae82a8ba5c4193",
  harvested_at: "2026-09-06T10:45:20Z",
  via: "West Michigan CEO Council roster, Grand Rapids Chamber (crawled public page)",
}
// name, city, sector, lead, note
const BATCH = [
  ["RoMan Manufacturing, Inc", "Grand Rapids", "manufacturing", "Nelson Sanchez",
    "resistance welding transformers; classic legacy-industrial fit; lead is President & CEO per roster"],
  ["Metal Flow Corporation", "Holland", "manufacturing", "Kelly Springer",
    "deep-draw metal forming; lead is President & CEO per roster"],
  ["Hascall Steel Company", "Grandville", "manufacturing", "Chris Van Wingerden",
    "steel service center; roster also lists 'Hassel Steel' (Courtney Collison), likely the same firm misspelled"],
  ["Behler-Young", "Grand Rapids", "distribution", "Doug Young",
    "HVAC/P wholesale distributor, data-heavy ops; roster lists TWO chief execs (Doug Young, Aaron Vandergalien), possibly a transition"],
  ["Feyen Zylstra", "Grand Rapids", "industrial-services", "Nate Koetje",
    "industrial electrical contractor with an industrial-tech practice; lead is CEO per roster"],
  ["Erhardt Construction Company", "Ada", "construction", "Ben Wickstrom",
    "commercial builder; lead is President & CEO per roster"],
]
const prospects = JSON.parse(readFileSync(F, "utf8"))
let added = 0
for (const [name, city, sector, lead, note] of BATCH) {
  const id = idFor(name)
  if (id in prospects) continue
  prospects[id] = {
    id, name, url: null, city,
    location: city, county: null,
    sector,
    signal: null, signal_url: null, signal_category: null, signal_seen_at: null,
    contact: { name: lead, email: null },
    stage: "identified", needs_review: true,
    curation_note: note, source: SRC,
  }
  added++
}
// Roskam Baking Company rebranded Roskam Foods; the roster names its CEO.
const roskam = prospects[idFor("Roskam Baking Company")]
if (roskam && !roskam.contact) {
  roskam.contact = { name: "Miguel Moreno", email: null }
  roskam.curation_note += "; CEO Miguel Moreno per WM CEO Council roster (now branded Roskam Foods)"
}
writeFileSync(F, JSON.stringify(prospects, null, 1) + "\n")
console.log(`imported ${added} curated prospects (total ${Object.keys(prospects).length})`)
