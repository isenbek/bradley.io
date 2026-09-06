// One-off: per-company SIGNAL crawls for every prospect without an observed
// signal. Generic queries proved to pull directories and aggregator noise
// (2026-09-06 verdict), so each job is scoped to ONE named company. The job
// id lands on the row as signal_job for traceability; results are curated by
// hand (or the future structuring pass), never trusted to the extractor.
//
// Skips rows that already carry a signal or a pending signal_job, so re-runs
// are safe and never double-spend the shared crawl queue.
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { makeProviders } from "./housecalls-providers.mjs"
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const F = path.join(ROOT, "data", "housecalls", "prospects.json")
const OP = JSON.parse(readFileSync(path.join(ROOT, "lib", "housecalls", "operator.json"), "utf8"))
const P = makeProviders(JSON.parse(readFileSync(path.join(ROOT, "data", "housecalls", "platform.json"), "utf8")))

const prospects = JSON.parse(readFileSync(F, "utf8"))
let sent = 0
for (const p of Object.values(prospects)) {
  if (p.signal || p.signal_job) continue
  const where = p.city ? `${p.city}, ${OP.territory.state}` : `near ${OP.territory.home.label}, ${OP.territory.state}`
  const query =
    `Recent news, press coverage, and open job postings for the company ` +
    `"${p.name}" in ${where}. I want: their own careers page and any current ` +
    `data, IT, or engineering openings; news stories naming them (expansion, ` +
    `new plant, ERP or system modernization, cloud or IT costs, hiring, ` +
    `leadership changes); and their official website. Only pages about this ` +
    `specific company.`
  try {
    const res = P.crawl.dispatch(query, { max_urls: 12 })
    p.signal_job = { job_id: res.job_id, submitted_at: new Date().toISOString() }
    console.log(`signal crawl dispatched: ${res.job_id} for ${p.name}`)
    sent++
  } catch (e) {
    console.error(`FAILED for ${p.name}: ${String(e).slice(0, 200)}`)
  }
}
writeFileSync(F, JSON.stringify(prospects, null, 1) + "\n")
console.log(`dispatched ${sent} signal crawls`)
