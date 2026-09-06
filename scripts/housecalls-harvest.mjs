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

import { makeProviders, mockProviders } from "./housecalls-providers.mjs"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const PRIV = path.join(ROOT, "data", "housecalls")
const RAW = path.join(PRIV, "raw")

// Operator config (committed, public-safe): who runs this machine and where.
// Platform config (private dir, per-box): how this box reaches the harvest
// platform. The split is the franchise seam: a new operator edits these two
// files and the site copy; the method below stays identical.
const OP = JSON.parse(readFileSync(path.join(ROOT, "lib", "housecalls", "operator.json"), "utf8"))
const PLATFORM_PATH = path.join(PRIV, "platform.json")
if (!existsSync(PLATFORM_PATH)) {
  console.error(`missing ${PLATFORM_PATH}: create it with {"cbcli": "<path>", "workspace_id": "<ws_...>"}`)
  process.exit(1)
}
const PLATFORM = JSON.parse(readFileSync(PLATFORM_PATH, "utf8"))
const CBCLI = PLATFORM.cbcli
const WORKSPACE = PLATFORM.workspace_id
const STATE = OP.territory.state
const COUNTIES = path.join(ROOT, "public", OP.territory.counties_file)
const MAP_OUT = path.join(ROOT, "public", "data", "housecalls-map.json")
const RIG_OUT = path.join(ROOT, "public", "data", "housecalls-rig.json")
const PINS_OUT = path.join(ROOT, "public", "data", "housecalls-pins.json")
const PIN_STAGES = ["identified", "qualified", "drafted", "contacted", "replied"]

const MAP_STAGES = new Set(["identified", "qualified", "drafted", "contacted", "replied"])

// ---------- small utils ----------

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

function geocode(P, query, cache) {
  if (query in cache) return cache[query]
  let hit = null
  try {
    hit = P.geocode(query)
    /* provider failures leave the prospect unmapped, never crash the harvest */
  } catch {}
  // Cache successes only: a transient failure cached forever poisons every
  // future run (it silently unmapped Grand Rapids itself on day one).
  if (hit) cache[query] = hit
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

// ---------- auto-qualification (docs/housecalls/qualification-rubric.md) ----------

const RUBRIC_VERSION = 1
// Letter bindings and the conflicts list are per-operator (lib/housecalls/
// operator.json): the flagship's conflicts are the GR consulting field +
// platform relationships.
const LETTER_BY_CATEGORY = OP.rubric.letter_by_category
const CONFLICTS = OP.rubric.conflicts.map((s) => new RegExp(s, "i"))
// Public bodies buy through procurement; cold email can disqualify a bid.
const GOV_RE = /\b(county|city of|township|state of|school district|village of|public schools|dept\.? of|department of)\b/i
// Home-turf geoids for the +2 local score (flagship: Kent and the ring around it).
const WEST_MI = new Set(OP.territory.home_county_geoids)

const daysBetween = (a, b) => Math.abs(new Date(a) - new Date(b)) / 86400000

/**
 * Apply rubric v1 to one prospect. Pure function: returns the rubric record;
 * the caller decides what to write. Only ever proposes identified -> qualified;
 * drafted and contacted remain human gates (doctrine).
 */
function evaluateRubric(p, today = new Date().toISOString()) {
  const rec = {
    version: RUBRIC_VERSION,
    evaluated_at: today.slice(0, 10),
    gates: {},
    disqualified: null,
    lane: "email",
    score: 0,
    letter: null,
    pass: false,
  }

  const name = p.name ?? ""
  if (CONFLICTS.some((re) => re.test(name))) {
    rec.disqualified = "conflict"
    return rec
  }
  if (p.gov === true || GOV_RE.test(name)) {
    rec.lane = "rfp" // rerouted, never cold-emailed; not a rubric qualification
    return rec
  }

  const cat = p.signal_category ?? null
  const fresh = p.signal_seen_at ? daysBetween(p.signal_seen_at, today) : Infinity
  rec.gates.g1_signal = Boolean(p.signal && p.signal_url && cat in LETTER_BY_CATEGORY && fresh <= 90)
  rec.gates.g2_letter = cat in LETTER_BY_CATEGORY
  rec.gates.g3_contact = Boolean(p.contact?.name && p.contact?.email)
  rec.gates.g4_fit = p.fit_floor !== false

  rec.letter = rec.gates.g2_letter ? LETTER_BY_CATEGORY[cat] : null
  rec.score =
    (cat === "legacy" || p.challenging === true ? 3 : 0) +
    (cat === "cloud" ? 2 : 0) +
    (WEST_MI.has(p.county ?? "") ? 2 : 0) +
    (cat === "hiring" ? 1 : 0) +
    (fresh <= 30 ? 1 : 0) +
    (p.warm === true ? 1 : 0)
  rec.pass = Object.values(rec.gates).every(Boolean)
  return rec
}

/** Evaluate every identified prospect; flip passers to qualified with the
 *  audit trail on the row. Never touches any stage past identified. */
function autoQualify(prospects, today = new Date().toISOString()) {
  let flipped = 0
  for (const p of Object.values(prospects)) {
    if (p.stage !== "identified" || p.disqualified) continue
    const rec = evaluateRubric(p, today)
    p.rubric = rec
    if (rec.disqualified) p.disqualified = rec.disqualified
    if (rec.lane === "rfp") p.lane = "rfp"
    if (rec.pass) {
      p.stage = "qualified"
      p.stage_since = today.slice(0, 10)
      flipped++
    }
  }
  return flipped
}

// ---------- contact-discovery queue (rubric G3) ----------

/**
 * The rubric's G3 parking lot: prospects that pass every gate EXCEPT the named
 * human. Derived, never authored; written PRIVATE (it is a list of companies
 * we are researching, which is nobody's business until a letter exists).
 * Ordered by score desc, then oldest signal first (first found, first served).
 */
function deriveContactQueue(prospects) {
  return Object.values(prospects)
    .filter(
      (p) =>
        p.stage === "identified" &&
        !p.disqualified &&
        p.lane !== "rfp" &&
        p.rubric?.gates?.g1_signal &&
        p.rubric?.gates?.g2_letter &&
        p.rubric?.gates?.g4_fit &&
        !p.rubric?.gates?.g3_contact
    )
    .sort(
      (a, b) =>
        (b.rubric.score ?? 0) - (a.rubric.score ?? 0) ||
        String(a.signal_seen_at ?? "9999").localeCompare(String(b.signal_seen_at ?? "9999"))
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      score: p.rubric.score,
      letter: p.rubric.letter,
      signal: p.signal,
      signal_url: p.signal_url,
      county: p.county ?? null,
      discovery_job: p.discovery_job?.job_id ?? null,
    }))
}

/**
 * Dispatch discovery crawls for the top of the queue. EXPLICITLY GATED
 * behind --discover N (shared workers; we do not spray jobs by default).
 * The job id lands on the prospect row so the main loop routes its result to
 * raw/discovery-*.json instead of the prospect extractor.
 */
function dispatchDiscovery(P, prospects, queue, n) {
  let sent = 0
  for (const q of queue) {
    if (sent >= n) break
    if (q.discovery_job) continue
    const p = prospects[q.id]
    const query =
      `Who leads engineering, data, or IT at "${p.name}"` +
      (p.city ? ` in ${p.city}, ${STATE}` : ` in ${STATE}`) +
      `: names, titles, and contact paths. Team page, leadership page, LinkedIn, ` +
      `and the contact on their job posting if any.`
    const res = P.crawl.dispatch(query, { max_urls: 10 })
    p.discovery_job = { job_id: res.job_id, submitted_at: new Date().toISOString() }
    console.log(`discovery dispatched: ${res.job_id} for ${p.name}`)
    sent++
  }
  return sent
}

// ---------- the harvest loop (extracted so the mock provider can test it) ----------

/**
 * Walk every job the crawl provider knows, route completed results (owned
 * discovery/signal jobs to raw only; unowned through the conservative
 * extractor), and geocode new rows. Pure over its inputs except through
 * saveRaw, so the selftest can run the REAL loop on mock providers.
 */
function collectJobs(P, prospects, geocache, saveRaw) {
  const jobIds = P.crawl.listJobs()
  const stats = { total: jobIds.length, pending: 0, completed: 0, extracted: 0, byStatus: {}, lastCompleted: null }
  for (const jobId of jobIds) {
    const job = P.crawl.getJob(jobId)
    stats.byStatus[job.status] = (stats.byStatus[job.status] ?? 0) + 1
    if (job.status !== "completed") {
      stats.pending++
      continue
    }
    stats.completed++
    if (job.completed_at && (!stats.lastCompleted || job.completed_at > stats.lastCompleted)) stats.lastCompleted = job.completed_at
    // Discovery jobs answer "who do we talk to", not "who exists": raw only,
    // never through the prospect extractor.
    const owner = Object.values(prospects).find((p) => p.discovery_job?.job_id === jobId)
    if (owner) {
      saveRaw(`discovery-${jobId}`, job)
      owner.discovery_job.completed_at = job.completed_at ?? new Date().toISOString()
      continue
    }
    // Signal jobs are per-company evidence hunts: raw only, curated by hand
    // (an evidence page about company A must never mint a row for company B).
    const sigOwner = Object.values(prospects).find((p) => p.signal_job?.job_id === jobId)
    if (sigOwner) {
      saveRaw(`signal-${jobId}`, job)
      sigOwner.signal_job.completed_at = job.completed_at ?? new Date().toISOString()
      continue
    }
    saveRaw(jobId, job)
    for (const row of extractProspects(job)) {
      if (row.id in prospects) continue // never clobber human-touched rows
      if (row.location) {
        const geo = geocode(P, `${row.location}, ${STATE}`, geocache)
        if (geo) row.county = countyFor(geo.lon, geo.lat)
      }
      prospects[row.id] = row
      stats.extracted++
    }
  }
  return stats
}

// ---------- RFP lane tracker (rubric: gov buys through procurement) ----------

/**
 * Solicitations are not prospects: they are public documents with deadlines
 * and their own lifecycle. data/housecalls/rfps.json is the register, HAND
 * EDITED for now (SIGMA VSS / BidNet need Brad-side registration and the state
 * portal 403s bots). The pipeline validates it, derives aggregates, and
 * refuses to let a deadline pass silently.
 *
 * Status lifecycle: watching -> preparing -> submitted -> won | lost | no_bid.
 * Public disclosure: AGGREGATES ONLY by default (bid strategy in sealed
 * procurement is competitive information; the open-hunt brand does not require
 * tipping rivals mid-bid). Naming entries publicly is Brad's call, per entry,
 * after award.
 */
const RFP_STATUSES = ["watching", "preparing", "submitted", "won", "lost", "no_bid"]
const RFP_OPEN = new Set(["watching", "preparing", "submitted"])

function rfpSeed() {
  return {
    updated: new Date().toISOString().slice(0, 10),
    note: "Hand-edited register. BLOCKED on Brad: vendor registration at SIGMA VSS (state) and BidNet/MITN (local govs).",
    rfps: [],
  }
}

function analyzeRfps(reg, today = new Date().toISOString().slice(0, 10)) {
  const valid = []
  const problems = []
  for (const r of reg.rfps ?? []) {
    if (!RFP_STATUSES.includes(r.status)) {
      problems.push(`rfp ${r.id ?? r.title ?? "?"}: unknown status "${r.status}" (skipped)`)
      continue
    }
    valid.push(r)
    if ((r.status === "watching" || r.status === "preparing") && r.due && r.due < today) {
      problems.push(`rfp OVERDUE: "${r.title}" was due ${r.due} and is still ${r.status}`)
    }
  }
  const open = valid.filter((r) => RFP_OPEN.has(r.status))
  const dueSoon = open
    .filter((r) => r.due && r.due >= today && r.status !== "submitted")
    .sort((a, b) => a.due.localeCompare(b.due))
  const byStatus = {}
  for (const r of valid) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
  return {
    open: open.length,
    by_status: byStatus,
    next_due: dueSoon[0]?.due ?? null,
    next_due_title: dueSoon[0]?.title ?? null,
    problems,
  }
}

// ---------- P2 pin writer (docs/housecalls/p2-pin-schema.md) ----------

/** Area-weighted centroid of a county's largest outer ring, verified to sit
 *  inside the county; falls back to the ring's vertex mean, else null. */
const centroidCache = {}
function countyCentroid(geoid) {
  if (geoid in centroidCache) return centroidCache[geoid]
  countyFeatures ??= readJson(COUNTIES, { features: [] }).features
  const f = countyFeatures.find((x) => x.properties.geoid === geoid)
  let best = null
  if (f) {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates
    let bestArea = -1
    for (const rings of polys) {
      const ring = rings[0]
      let a = 0
      let cx = 0
      let cy = 0
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const w = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
        a += w
        cx += (ring[j][0] + ring[i][0]) * w
        cy += (ring[j][1] + ring[i][1]) * w
      }
      if (Math.abs(a) > bestArea) {
        bestArea = Math.abs(a)
        best = a === 0 ? null : [cx / (3 * a), cy / (3 * a)]
        if (!best || countyFor(best[0], best[1]) !== geoid) {
          const mx = ring.reduce((s, p) => s + p[0], 0) / ring.length
          const my = ring.reduce((s, p) => s + p[1], 0) / ring.length
          best = countyFor(mx, my) === geoid ? [mx, my] : best
        }
      }
    }
  }
  if (best && countyFor(best[0], best[1]) !== geoid) best = null
  centroidCache[geoid] = best
  return best
}

/** Deterministic jitter from the prospect id: up to ~800m, stable across
 *  publishes, pure de-overlap (carries zero location information). */
function jitterFor(id, lat) {
  const h = createHash("sha256").update(id).digest()
  const angle = (h.readUInt16BE(0) / 65535) * 2 * Math.PI
  const meters = 100 + (h.readUInt16BE(2) / 65535) * 700
  const dLat = (meters * Math.cos(angle)) / 111320
  const dLon = (meters * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180))
  return [dLon, dLat]
}

/**
 * Prospects -> public pins. Every schema invariant is asserted here; a
 * violation drops the pin (stderr), never ships it.
 *   - position: city centroid (via resolveCity) else county centroid; never an
 *     address. Jitter applied only if the point stays in its county.
 *   - label/fact only when a human set `public: true` on the prospect after
 *     verifying the fact is the company's own public statement.
 *   - sector on anonymous pins only when >= K share the (sector, city) cell.
 */
const K_ANON = OP.privacy.k_anon
function emitPins(prospects, resolveCity) {
  const candidates = []
  let dropped = 0
  for (const p of Object.values(prospects)) {
    if (!PIN_STAGES.includes(p.stage)) continue
    const cityKey = p.city ? p.city.toLowerCase().trim() : null
    let base = cityKey ? resolveCity(p.city) : null
    let county = p.county ?? null
    if (base && !county) county = countyFor(base[0], base[1])
    if (!base && county) base = countyCentroid(county)
    if (!base || !county) {
      dropped++
      continue
    }
    const [dLon, dLat] = jitterFor(p.id, base[1])
    const jittered = [base[0] + dLon, base[1] + dLat]
    const pos = countyFor(jittered[0], jittered[1]) === county ? jittered : base
    if (countyFor(pos[0], pos[1]) !== county) {
      dropped++
      console.error(`pin dropped (county mismatch): ${p.id}`)
      continue
    }
    candidates.push({
      id: p.id,
      stage: p.stage,
      pos: [Number(pos[0].toFixed(5)), Number(pos[1].toFixed(5))],
      county,
      label: p.public === true ? (p.name ?? null) : null,
      sector: p.sector ?? null,
      cityKey,
      named: p.public === true,
      since: String(p.stage_since ?? p.source?.harvested_at ?? new Date().toISOString()).slice(0, 10),
      fact: p.public === true ? (p.fact ?? p.signal ?? null) : null,
    })
  }
  // k-anonymity: anonymous pins publish sector only in cells of K_ANON or more
  const cells = {}
  for (const c of candidates) {
    if (!c.named && c.sector) {
      const key = `${c.sector}|${c.cityKey ?? c.county}`
      cells[key] = (cells[key] ?? 0) + 1
    }
  }
  const pins = candidates.map((c) => {
    const key = `${c.sector}|${c.cityKey ?? c.county}`
    const sector = c.named ? c.sector : c.sector && (cells[key] ?? 0) >= K_ANON ? c.sector : null
    return { id: c.id, stage: c.stage, pos: c.pos, county: c.county, label: c.label, sector, since: c.since, fact: c.fact }
  })
  if (dropped) console.error(`pins dropped by position rules: ${dropped}`)
  return pins
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
  // County fixtures are territory-specific and GENERATED, never hardcoded:
  // scripts/housecalls-fixtures.mjs derives them from the operator config +
  // vendored counties, so a new territory regenerates instead of editing.
  const FX = readJson(path.join(ROOT, "lib", "housecalls", "fixtures.json"), null)
  if (!FX) {
    console.error("FAIL fixtures: lib/housecalls/fixtures.json missing; run node scripts/housecalls-fixtures.mjs")
    process.exit(1)
  }
  const H = FX.home.geoid // in the home set (local-score bonus applies)
  const O = FX.other_geoid // far away, no local bonus
  // Operator config integrity: the franchise seam only works if every knob
  // the method reads is actually present.
  const cfg = [
    ["fixtures match this territory", FX.state_fips === OP.territory.state_fips],
    ["operator.name", typeof OP.operator?.name === "string" && OP.operator.name.length > 0],
    ["territory state + fips", typeof OP.territory?.state === "string" && /^\d{2}$/.test(OP.territory?.state_fips ?? "")],
    ["counties_file matches fips", OP.territory.counties_file.includes("counties") && existsSync(COUNTIES)],
    ["home base in a home county", OP.territory.home_county_geoids.includes(countyFor(OP.territory.home.lon, OP.territory.home.lat))],
    ["every letter binding is a slug", Object.values(OP.rubric.letter_by_category).every((s) => /^pitch-[a-z-]+$/.test(s))],
    ["conflicts compile as regexes", CONFLICTS.length === OP.rubric.conflicts.length],
    ["k_anon sane", Number.isInteger(K_ANON) && K_ANON >= 2],
    ["platform config loaded", typeof CBCLI === "string" && /^ws_/.test(WORKSPACE)],
  ]
  let ok = true
  for (const [name, pass] of cfg) {
    console.log(`${pass ? "PASS" : "FAIL"} config: ${name}`)
    ok &&= pass
  }
  // The census geocode backend is optional until selected, but if its
  // vendored places file exists it must put the home label in a home county.
  if (existsSync(path.join(ROOT, "lib", "housecalls", "places.json"))) {
    const CP = makeProviders({ cbcli: "/bin/false", workspace_id: "ws_selftest", providers: { crawl: "cbintel", geocode: "census" } })
    const hit = CP.geocode(`${OP.territory.home.label}, ${STATE}`)
    const censusOk = Boolean(hit) && OP.territory.home_county_geoids.includes(countyFor(hit.lon, hit.lat))
    console.log(`${censusOk ? "PASS" : "FAIL"} config: census geocode resolves home into a home county`)
    ok &&= censusOk
  }
  for (const c of FX.cases) {
    const got = countyFor(c.lon, c.lat)
    const pass = got === c.want
    ok &&= pass
    console.log(`${pass ? "PASS" : "FAIL"} ${c.name}: ${got} (want ${c.want})`)
  }
  const fixture = {
    a: { stage: "identified", county: H },
    b: { stage: "qualified", county: H },
    c: { stage: "won", county: H }, // leaves the map
    d: { stage: "closed", county: O }, // leaves the map
    e: { stage: "contacted", county: O },
  }
  const r = rollup(fixture, 0)
  const rollupOk = r.total === 3 && r.counties[H] === 2 && r.counties[O] === 1
  ok &&= rollupOk
  console.log(`${rollupOk ? "PASS" : "FAIL"} rollup: total=${r.total} counties=${JSON.stringify(r.counties)}`)

  // The REAL harvest loop on mock providers: the seam's first dividend is
  // that the main loop is testable at all (harvest-seam-plan.md step 2).
  const MP = mockProviders({
    jobs: {
      j_generic: {
        job_id: "j_generic", status: "completed", completed_at: "2026-09-06T02:00:00Z",
        result: { companies: [{ name: "Loop Test Co", location: "Home City" }, { name: "Existing Row Co" }] },
      },
      j_disc: { job_id: "j_disc", status: "completed", completed_at: "2026-09-06T03:00:00Z", result: {} },
      j_sig: { job_id: "j_sig", status: "completed", completed_at: "2026-09-06T04:00:00Z", result: {} },
      j_wait: { job_id: "j_wait", status: "queued" },
    },
    geocodes: { [`Home City, ${STATE}`]: { lon: FX.home.lon, lat: FX.home.lat } },
  })
  const keepId = idFor("Existing Row Co")
  const loopProspects = {
    [keepId]: { id: keepId, name: "KEEP ME", stage: "qualified" },
    own1: { id: "own1", name: "Discovery Owner", stage: "identified", discovery_job: { job_id: "j_disc" } },
    own2: { id: "own2", name: "Signal Owner", stage: "identified", signal_job: { job_id: "j_sig" } },
    q1: { id: "q1", name: "Dispatch Co", city: "Home City" },
  }
  const rawSaved = {}
  const loopCache = {}
  const st = collectJobs(MP, loopProspects, loopCache, (name, job) => (rawSaved[name] = job.job_id))
  const newRow = loopProspects[idFor("Loop Test Co")]
  dispatchDiscovery(MP, loopProspects, [{ id: "q1" }], 1)
  const loopChecks = [
    ["loop counts every status", st.total === 4 && st.completed === 3 && st.pending === 1 && st.byStatus.queued === 1],
    ["discovery result routes raw-only + stamps owner", rawSaved["discovery-j_disc"] === "j_disc" && Boolean(loopProspects.own1.discovery_job.completed_at)],
    ["signal result routes raw-only + stamps owner", rawSaved["signal-j_sig"] === "j_sig" && Boolean(loopProspects.own2.signal_job.completed_at)],
    ["generic result saved raw under its own id", rawSaved["j_generic"] === "j_generic"],
    ["extractor minted exactly the new row", st.extracted === 1 && newRow?.stage === "identified" && newRow?.needs_review === true],
    ["existing row never clobbered", loopProspects[keepId].name === "KEEP ME"],
    ["geocode wired through the provider + cached", newRow?.county === H && `Home City, ${STATE}` in loopCache],
    ["last completed tracked", st.lastCompleted === "2026-09-06T04:00:00Z"],
    ["dispatch rides the provider + stamps the row", MP.dispatched.length === 1 && loopProspects.q1.discovery_job?.job_id === "job_mock_1"],
  ]
  for (const [name, pass] of loopChecks) {
    console.log(`${pass ? "PASS" : "FAIL"} loop: ${name}`)
    ok &&= pass
  }

  // every county must yield a centroid inside itself
  countyFeatures ??= readJson(COUNTIES, { features: [] }).features
  const bad = countyFeatures.filter((f) => !countyCentroid(f.properties.geoid))
  console.log(`${bad.length === 0 ? "PASS" : "FAIL"} county centroids: ${countyFeatures.length - bad.length}/${countyFeatures.length}`)
  ok &&= bad.length === 0

  // jitter: deterministic and bounded
  const j1 = jitterFor("fixture000001", 43)
  const j2 = jitterFor("fixture000001", 43)
  const meters = Math.hypot(j1[0] * 111320 * Math.cos((43 * Math.PI) / 180), j1[1] * 111320)
  const jitterOk = j1[0] === j2[0] && j1[1] === j2[1] && meters > 50 && meters < 900
  console.log(`${jitterOk ? "PASS" : "FAIL"} jitter: deterministic, ${meters.toFixed(0)}m`)
  ok &&= jitterOk

  // pin writer invariants ("Home City" is an opaque token; only resolveCity
  // gives it meaning, at the fixture home-base coordinates)
  const gr = [FX.home.lon, FX.home.lat]
  const resolveCity = (city) => (city === "Home City" ? gr : null)
  const P = (id, extra) => ({
    id,
    stage: "identified",
    name: `Co ${id}`,
    city: "Home City",
    county: H,
    sector: "manufacturing",
    source: { harvested_at: "2026-09-06T01:00:00Z" },
    ...extra,
  })
  const pins = emitPins(
    {
      a: P("pa"),
      b: P("pb"),
      c: P("pc"),
      d: P("pd", { sector: "retail" }), // lone (retail, home city) cell
      e: P("pe", { stage: "won" }), // leaves the map
      f: P("pf", { city: null, county: null }), // unmappable: dropped
      g: P("pg", { public: true, fact: "their own posting", stage: "drafted" }),
      h: P("ph", { city: null }), // county-centroid fallback
    },
    resolveCity
  )
  const byId = Object.fromEntries(pins.map((p) => [p.id, p]))
  const checks = [
    ["count (won + unmappable excluded)", pins.length === 6],
    ["k-anon met: 3x (manufacturing, home city) publish sector", byId.pa?.sector === "manufacturing"],
    ["k-anon not met: lone retail cell hides sector", byId.pd?.sector === null],
    ["anonymous pin has no label/fact", byId.pa?.label === null && byId.pa?.fact === null],
    ["public pin carries label+fact", byId.pg?.label === "Co pg" && byId.pg?.fact === "their own posting"],
    ["since is a date", byId.pa?.since === "2026-09-06"],
    ["jittered pin stays in the home county", byId.pa && countyFor(byId.pa.pos[0], byId.pa.pos[1]) === H],
    ["county-fallback pin lands in the home county", byId.ph && countyFor(byId.ph.pos[0], byId.ph.pos[1]) === H],
    ["no two pins share a position", new Set(pins.map((p) => p.pos.join(","))).size === pins.length],
  ]
  for (const [name, pass] of checks) {
    console.log(`${pass ? "PASS" : "FAIL"} pins: ${name}`)
    ok &&= pass
  }

  // auto-qualification (rubric v1)
  const TODAY = "2026-09-06T12:00:00Z"
  const Q = (id, extra) => ({
    id,
    stage: "identified",
    name: `Widget Co ${id}`,
    county: H,
    signal: "hiring a data engineer",
    signal_url: "https://example.com/posting",
    signal_category: "hiring",
    signal_seen_at: "2026-09-01",
    contact: { name: "Pat Doe", email: "pat@example.com" },
    ...extra,
  })
  const qp = {
    pass: Q("q1"),
    noContact: Q("q2", { contact: null }),
    stale: Q("q3", { signal_seen_at: "2026-05-01" }),
    gov: Q("q4", { name: "City of Wyoming water dept" }),
    conflict: Q("q5", { name: "Augusto Digital" }),
    legacy: Q("q6", { signal_category: "legacy", county: O }),
    alreadyDrafted: Q("q7", { stage: "drafted" }),
  }
  const flips = autoQualify(qp, TODAY)
  const qc = [
    ["all-gates prospect qualifies", qp.pass.stage === "qualified" && qp.pass.stage_since === "2026-09-06"],
    ["exactly the passers flip", flips === 2],
    ["missing contact stays identified (g3)", qp.noContact.stage === "identified" && qp.noContact.rubric.gates.g3_contact === false],
    ["stale signal fails g1", qp.stale.stage === "identified" && qp.stale.rubric.gates.g1_signal === false],
    ["gov rerouted to rfp lane, not qualified", qp.gov.stage === "identified" && qp.gov.lane === "rfp"],
    ["conflict disqualified", qp.conflict.stage === "identified" && qp.conflict.disqualified === "conflict"],
    ["legacy scores 3+1fresh=4, hiring+local 2+1+1=4", qp.legacy.rubric.score === 4 && qp.pass.rubric.score === 4],
    ["letter bound from category", qp.pass.rubric.letter === "pitch-hiring-signal" && qp.legacy.rubric.letter === "pitch-legacy-rescue"],
    ["human stages untouched", qp.alreadyDrafted.stage === "drafted" && !qp.alreadyDrafted.rubric],
  ]
  for (const [name, pass] of qc) {
    console.log(`${pass ? "PASS" : "FAIL"} rubric: ${name}`)
    ok &&= pass
  }

  // contact-discovery queue: derived from the post-qualification rows above.
  // qp.noContact is the only g3-only failure; stale/gov/conflict/qualified all
  // stay out. Add a second g3 case to prove score ordering.
  qp.noContact2 = Q("q8", { contact: null, signal_category: "legacy" })
  autoQualify({ noContact2: qp.noContact2 }, TODAY)
  const queue = deriveContactQueue(qp)
  const cqc = [
    ["only g3-blocked rows queue", queue.length === 2 && queue.every((r) => ["q2", "q8"].includes(r.id))],
    ["ordered by score desc", queue[0]?.id === "q8" && queue[0]?.score === 6 && queue[1]?.id === "q2"],
    ["row carries the work context", queue[0]?.letter === "pitch-legacy-rescue" && Boolean(queue[0]?.signal_url)],
  ]
  for (const [name, pass] of cqc) {
    console.log(`${pass ? "PASS" : "FAIL"} queue: ${name}`)
    ok &&= pass
  }

  // RFP lane analysis
  const rfp = analyzeRfps(
    {
      rfps: [
        { id: "r1", title: "County data warehouse", status: "watching", due: "2026-09-20" },
        { id: "r2", title: "City GIS modernization", status: "preparing", due: "2026-09-10" },
        { id: "r3", title: "State portal rebuild", status: "submitted", due: "2026-09-02" },
        { id: "r4", title: "Slipped one", status: "watching", due: "2026-09-01" },
        { id: "r5", title: "Old win", status: "won", due: "2026-06-01" },
        { id: "r6", title: "Bad row", status: "someday" },
      ],
    },
    "2026-09-06"
  )
  const rc = [
    ["open counts watching+preparing+submitted", rfp.open === 4],
    ["next due is earliest FUTURE non-submitted", rfp.next_due === "2026-09-10" && rfp.next_due_title === "City GIS modernization"],
    ["overdue watching flagged", rfp.problems.some((p) => p.includes("OVERDUE") && p.includes("Slipped one"))],
    ["unknown status rejected", rfp.problems.some((p) => p.includes("unknown status")) && !rfp.by_status.someday],
    ["won tallied but not open", rfp.by_status.won === 1],
  ]
  for (const [name, pass] of rc) {
    console.log(`${pass ? "PASS" : "FAIL"} rfp: ${name}`)
    ok &&= pass
  }
  process.exit(ok ? 0 : 1)
}

// ---------- main ----------

function main() {
  if (process.argv.includes("--selftest")) return selftest()

  mkdirSync(RAW, { recursive: true })
  const P = makeProviders(PLATFORM)
  const prospects = readJson(path.join(PRIV, "prospects.json"), {})
  const geocache = readJson(path.join(PRIV, "geocache.json"), {})

  const saveRaw = (name, job) => writeJson(path.join(RAW, `${name}.json`), job)
  const stats = collectJobs(P, prospects, geocache, saveRaw)
  const { pending, completed, extracted, byStatus, lastCompleted } = stats
  const jobIds = { length: stats.total }

  // County backfill: curated/imported rows arrive with a city and no county;
  // resolve through the same geocode cache so they reach the choropleth.
  for (const p of Object.values(prospects)) {
    if (!p.county && p.city) {
      const geo = geocode(P, `${p.city}, ${STATE}`, geocache)
      if (geo) p.county = countyFor(geo.lon, geo.lat)
    }
  }

  const qualified = autoQualify(prospects)

  const queue = deriveContactQueue(prospects)
  const discoverArg = process.argv.indexOf("--discover")
  if (discoverArg !== -1) {
    const n = Math.max(1, Math.min(10, Number(process.argv[discoverArg + 1]) || 3))
    dispatchDiscovery(P, prospects, queue, n)
  }
  writeJson(path.join(PRIV, "contact-queue.json"), {
    generated: new Date().toISOString(),
    count: queue.length,
    queue,
  })

  // RFP lane: validate the hand-edited register, never let a deadline slide.
  const rfpPath = path.join(PRIV, "rfps.json")
  const rfpReg = readJson(rfpPath, null) ?? rfpSeed()
  if (!existsSync(rfpPath)) writeJson(rfpPath, rfpReg)
  const rfp = analyzeRfps(rfpReg)
  for (const w of rfp.problems) console.error(w)

  writeJson(path.join(PRIV, "prospects.json"), prospects)
  writeJson(path.join(PRIV, "geocache.json"), geocache)
  const map = rollup(prospects, pending)
  writeJson(MAP_OUT, map)

  // P2 pins: city centroids resolve through the same cbgeo cache.
  const resolveCity = (city) => {
    const g = geocode(P, `${city}, ${STATE}`, geocache)
    return g ? [g.lon, g.lat] : null
  }
  const pins = emitPins(prospects, resolveCity)
  writeJson(PINS_OUT, { generated: new Date().toISOString(), stages: PIN_STAGES, pins })
  writeJson(path.join(PRIV, "geocache.json"), geocache)

  // Rig telemetry: OUR workspace only, aggregates only (maps-plan.md P3).
  writeJson(RIG_OUT, {
    generated: new Date().toISOString(),
    jobs: { total: jobIds.length, ...byStatus },
    last_completed_at: lastCompleted,
    prospects_on_file: Object.keys(prospects).length,
    contact_queue: queue.length,
    rfp_open: rfp.open,
    rfp_next_due: rfp.next_due,
    mapped: map.total,
  })

  console.log(
    `jobs: ${jobIds.length} (${completed} completed, ${pending} pending) | ` +
      `new prospects: ${extracted} | auto-qualified: ${qualified} | ` +
      `total on file: ${Object.keys(prospects).length} | ` +
      `mapped: ${map.total} | wrote ${path.relative(ROOT, MAP_OUT)}`
  )

  // Stage changes move the public scoreboard; keep it honest in the same run.
  import("./housecalls-ledger.mjs")
    .then(({ syncCounters }) => syncCounters())
    .catch((e) => console.error(`ledger counter sync failed: ${e.message}`))
}

main()
