#!/usr/bin/env node
/**
 * House Calls harvest pipeline (docs/housecalls/maps-plan.md).
 *
 *   cbintel workspace jobs ──▶ data/housecalls/  (PRIVATE, gitignored)
 *                                 raw/<job>.json   full job results, untouched
 *                                 prospects.json   normalized prospect rows
 *                                 geocache.json    cbgeo lookups, cached forever
 *                              ──▶ public/data/housecalls-map.json  (PUBLIC)
 *                                 county rollups + total only. NO PII.
 *
 * The PII firewall is the path: nothing below a county rollup is ever written
 * under public/. Stage enum (maps-plan.md): identified → qualified → drafted →
 * contacted → replied → won | closed; won and closed leave the map.
 *
 * Run:  node scripts/housecalls-harvest.mjs            harvest + rollup
 *       node scripts/housecalls-harvest.mjs --selftest county PIP + rollup test
 *
 * The EXTRACTION SEAM below is deliberately conservative until the first crawl
 * completes and shows its real result shape; raw results are always saved for
 * inspection either way.
 */

import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const CBCLI = "/home/bisenbek/.pyenv/shims/cbcli"
const WORKSPACE = "ws_86a68391f69c4247"
const PRIV = path.join(ROOT, "data", "housecalls")
const RAW = path.join(PRIV, "raw")
const COUNTIES = path.join(ROOT, "public", "data", "mi-counties.json")
const MAP_OUT = path.join(ROOT, "public", "data", "housecalls-map.json")
const RIG_OUT = path.join(ROOT, "public", "data", "housecalls-rig.json")

const MAP_STAGES = new Set(["identified", "qualified", "drafted", "contacted", "replied"])

// ---------- small utils ----------

const cb = (args) => {
  const out = execFileSync(CBCLI, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 })
  return JSON.parse(out)
}

const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fallback)
const writeJson = (p, obj) => writeFileSync(p, JSON.stringify(obj, null, 1) + "\n")
const idFor = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12)

// ---------- county point-in-polygon (vendored Census GeoJSON) ----------

function inRing(lon, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function inPolygon(lon, lat, rings) {
  if (!inRing(lon, lat, rings[0])) return false
  for (let h = 1; h < rings.length; h++) if (inRing(lon, lat, rings[h])) return false
  return true
}

let countyFeatures = null
function countyFor(lon, lat) {
  countyFeatures ??= readJson(COUNTIES, { features: [] }).features
  for (const f of countyFeatures) {
    const g = f.geometry
    const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates
    if (polys.some((p) => inPolygon(lon, lat, p))) return f.properties.geoid
  }
  return null
}

// ---------- geocoding (cbgeo, cached forever) ----------

function geocode(query, cache) {
  if (query in cache) return cache[query]
  let hit = null
  try {
    const res = cb(["cbgeo", "search", "list", "--params", JSON.stringify({ q: query, limit: 1 })])
    const row = Array.isArray(res) ? res[0] : (res.results ?? res.features ?? [])[0]
    if (row) {
      const lon = Number(row.lon ?? row.longitude ?? row.geometry?.coordinates?.[0])
      const lat = Number(row.lat ?? row.latitude ?? row.geometry?.coordinates?.[1])
      if (Number.isFinite(lon) && Number.isFinite(lat)) hit = { lon, lat }
    }
  } catch {
    /* geocode failures leave the prospect unmapped, never crash the harvest */
  }
  cache[query] = hit
  return hit
}

// ---------- the extraction seam ----------

/**
 * Turn one completed cbintel job result into prospect rows.
 *
 * DELIBERATELY CONSERVATIVE: the real crawl result shape is unknown until the
 * first job completes (doctrine: shape the tracker around cbintel's output,
 * don't invent a schema). Raw results are saved regardless, so a wrong guess
 * here loses nothing. Finalize after inspecting data/housecalls/raw/.
 */
function extractProspects(job) {
  const r = job.result
  if (!r || typeof r !== "object") return []
  const candidates = r.prospects ?? r.companies ?? r.entities ?? r.results ?? r.items ?? r.pages ?? []
  if (!Array.isArray(candidates)) return []
  const rows = []
  for (const c of candidates) {
    if (!c || typeof c !== "object") continue
    const name = c.name ?? c.company ?? c.title ?? null
    const url = c.url ?? c.link ?? c.source_url ?? null
    if (!name && !url) continue
    rows.push({
      id: idFor(url ?? name),
      name,
      url,
      location: c.location ?? c.address ?? c.city ?? null,
      signal: c.signal ?? c.summary ?? c.snippet ?? null,
      stage: "identified",
      needs_review: true,
      source: { job_id: job.job_id, harvested_at: job.completed_at ?? null },
    })
  }
  return rows
}

// ---------- rollup + public write ----------

function rollup(prospects, pendingJobs) {
  const counties = {}
  let mapped = 0
  for (const p of Object.values(prospects)) {
    if (!MAP_STAGES.has(p.stage) || !p.county) continue
    counties[p.county] = (counties[p.county] ?? 0) + 1
    mapped++
  }
  const note =
    mapped > 0
      ? `updated ${new Date().toISOString().slice(0, 10)}`
      : pendingJobs > 0
        ? "first harvest queued"
        : "no harvest yet"
  return { generated: new Date().toISOString(), total: mapped, note, counties }
}

// ---------- selftest ----------

function selftest() {
  const cases = [
    { name: "Grand Rapids", lon: -85.6681, lat: 42.9634, want: "26081" }, // Kent
    { name: "Detroit", lon: -83.0458, lat: 42.3314, want: "26163" }, // Wayne
    { name: "Traverse City", lon: -85.6206, lat: 44.7631, want: "26055" }, // Grand Traverse
    { name: "Lake Michigan (open water)", lon: -86.8, lat: 43.5, want: null },
  ]
  let ok = true
  for (const c of cases) {
    const got = countyFor(c.lon, c.lat)
    const pass = got === c.want
    ok &&= pass
    console.log(`${pass ? "PASS" : "FAIL"} ${c.name}: ${got} (want ${c.want})`)
  }
  const fixture = {
    a: { stage: "identified", county: "26081" },
    b: { stage: "qualified", county: "26081" },
    c: { stage: "won", county: "26081" }, // leaves the map
    d: { stage: "closed", county: "26163" }, // leaves the map
    e: { stage: "contacted", county: "26163" },
  }
  const r = rollup(fixture, 0)
  const rollupOk = r.total === 3 && r.counties["26081"] === 2 && r.counties["26163"] === 1
  ok &&= rollupOk
  console.log(`${rollupOk ? "PASS" : "FAIL"} rollup: total=${r.total} counties=${JSON.stringify(r.counties)}`)
  process.exit(ok ? 0 : 1)
}

// ---------- main ----------

function main() {
  if (process.argv.includes("--selftest")) return selftest()

  mkdirSync(RAW, { recursive: true })
  const prospects = readJson(path.join(PRIV, "prospects.json"), {})
  const geocache = readJson(path.join(PRIV, "geocache.json"), {})

  const listing = cb(["cbintel", "workspaces", "jobs", "--params", JSON.stringify({ workspace_id: WORKSPACE })])
  const jobIds = Array.isArray(listing)
    ? listing
    : (listing.jobs ?? listing.job_ids ?? []).map((j) => (typeof j === "string" ? j : j.job_id))

  let pending = 0
  let completed = 0
  let extracted = 0
  const byStatus = {}
  let lastCompleted = null
  for (const jobId of jobIds) {
    const job = cb(["cbintel", "jobs", "get-get", "--params", JSON.stringify({ job_id: jobId })])
    byStatus[job.status] = (byStatus[job.status] ?? 0) + 1
    if (job.status !== "completed") {
      pending++
      continue
    }
    completed++
    if (job.completed_at && (!lastCompleted || job.completed_at > lastCompleted)) lastCompleted = job.completed_at
    writeJson(path.join(RAW, `${jobId}.json`), job)
    for (const row of extractProspects(job)) {
      if (row.id in prospects) continue // never clobber human-touched rows
      if (row.location) {
        const geo = geocode(`${row.location}, Michigan`, geocache)
        if (geo) row.county = countyFor(geo.lon, geo.lat)
      }
      prospects[row.id] = row
      extracted++
    }
  }

  writeJson(path.join(PRIV, "prospects.json"), prospects)
  writeJson(path.join(PRIV, "geocache.json"), geocache)
  const map = rollup(prospects, pending)
  writeJson(MAP_OUT, map)

  // Rig telemetry: OUR workspace only, aggregates only (maps-plan.md P3).
  writeJson(RIG_OUT, {
    generated: new Date().toISOString(),
    jobs: { total: jobIds.length, ...byStatus },
    last_completed_at: lastCompleted,
    prospects_on_file: Object.keys(prospects).length,
    mapped: map.total,
  })

  console.log(
    `jobs: ${jobIds.length} (${completed} completed, ${pending} pending) | ` +
      `new prospects: ${extracted} | total on file: ${Object.keys(prospects).length} | ` +
      `mapped: ${map.total} | wrote ${path.relative(ROOT, MAP_OUT)}`
  )
}

main()
