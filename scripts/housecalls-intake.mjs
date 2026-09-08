#!/usr/bin/env node
// Direct-research intake for the House Calls prospect base.
//
// Reads a JSON array of researched rows and merges them into
// data/housecalls/prospects.json as stage=identified, geocoding city ->
// lon/lat via the vendored Census gazetteer and county GEOID via
// point-in-polygon over public/data/mi-counties.json (the same sources
// the harvest uses). Existing ids are never touched: this tool only ever
// ADDS identified rows; qualification stays the harvest's job and
// drafted/contacted stay human gates.
//
// Row shape (everything else is preserved verbatim onto the prospect):
//   { name, city, signal, signal_url, signal_category, signal_seen_at,
//     url?, county?, sector?, curation_note?, via? }
// A row missing name, signal, signal_url, signal_category, or
// signal_seen_at is refused: an unsourced prospect is not a prospect.
//
// usage:
//   node scripts/housecalls-intake.mjs <rows.json> [--dry-run]
//   node scripts/housecalls-intake.mjs --selftest

import { readFileSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const PROSPECTS = path.join(ROOT, "data", "housecalls", "prospects.json")
const PLACES = path.join(ROOT, "lib", "housecalls", "places.json")
const COUNTIES = path.join(ROOT, "public", "data", "mi-counties.json")

const idFor = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12)

export function inRing(lon, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

export function countyFor(lon, lat, features) {
  for (const f of features) {
    const g = f.geometry
    const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates
    for (const rings of polys) {
      if (inRing(lon, lat, rings[0]) && !rings.slice(1).some((r) => inRing(lon, lat, r)))
        return f.properties.geoid
    }
  }
  return null
}

export function validateRow(r) {
  const missing = ["name", "signal", "signal_url", "signal_category", "signal_seen_at"]
    .filter((k) => !r?.[k])
  return missing.length ? `missing ${missing.join(", ")}` : null
}

export function buildProspect(r, { place, county, now }) {
  return {
    id: idFor(r.name),
    name: r.name,
    url: r.url ?? null,
    city: r.city ?? null,
    location: r.city ?? null,
    county: r.county ?? county ?? null,
    sector: r.sector ?? "agriculture",
    signal: r.signal,
    signal_url: r.signal_url,
    signal_category: r.signal_category,
    signal_seen_at: r.signal_seen_at,
    contact: r.contact ?? null,
    stage: "identified",
    needs_review: true,
    curation_note: r.curation_note ?? null,
    source: {
      harvested_at: now,
      via: r.via ?? "direct research",
      geocoded: place ? `${r.city} via gazetteer` : r.county ? "county supplied" : "unmapped",
    },
  }
}

function selftest() {
  let pass = 0
  let fail = 0
  const t = (name, ok) => (ok ? pass++ : (fail++, console.error(`FAIL ${name}`)))

  const square = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]
  t("point in ring", inRing(5, 5, square))
  t("point outside ring", !inRing(15, 5, square))
  const features = [
    { properties: { geoid: "26999" }, geometry: { type: "Polygon", coordinates: [square] } },
  ]
  t("countyFor hits", countyFor(5, 5, features) === "26999")
  t("countyFor misses", countyFor(50, 5, features) === null)
  t("hole excludes", countyFor(5, 5, [{
    properties: { geoid: "x" },
    geometry: { type: "Polygon", coordinates: [square, [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]] },
  }]) === null)
  t("validate refuses unsourced", validateRow({ name: "A" })?.includes("signal_url"))
  t("validate passes a full row", validateRow({
    name: "A", signal: "s", signal_url: "u", signal_category: "farm", signal_seen_at: "2026-09-08",
  }) === null)
  const p = buildProspect(
    { name: "Test Farm", city: "hart", signal: "s", signal_url: "u", signal_category: "farm", signal_seen_at: "2026-09-08" },
    { place: { lon: 1, lat: 2 }, county: "26127", now: "T" },
  )
  t("prospect enters as identified", p.stage === "identified" && p.needs_review === true)
  t("prospect id is 12 hex", /^[0-9a-f]{12}$/.test(p.id))
  t("sector defaults to agriculture", p.sector === "agriculture")
  t("supplied county wins over geocode", buildProspect(
    { name: "X", county: "26001", signal: "s", signal_url: "u", signal_category: "farm", signal_seen_at: "2026-09-08" },
    { place: null, county: "26999", now: "T" },
  ).county === "26001")

  console.log(`intake selftest: ${pass} passed, ${fail} failed`)
  if (fail) process.exit(1)
}

function main() {
  if (process.argv.includes("--selftest")) return selftest()
  const file = process.argv[2]
  if (!file) {
    console.error("usage: housecalls-intake.mjs <rows.json> [--dry-run] | --selftest")
    process.exit(1)
  }
  const dry = process.argv.includes("--dry-run")
  const rows = JSON.parse(readFileSync(file, "utf8"))
  const prospects = JSON.parse(readFileSync(PROSPECTS, "utf8"))
  const places = JSON.parse(readFileSync(PLACES, "utf8")).places
  const counties = JSON.parse(readFileSync(COUNTIES, "utf8")).features
  const now = new Date().toISOString()

  let added = 0
  let skipped = 0
  for (const r of rows) {
    const bad = validateRow(r)
    if (bad) {
      console.error(`refused "${r?.name ?? "?"}": ${bad}`)
      process.exitCode = 1
      continue
    }
    const id = idFor(r.name)
    if (prospects[id]) {
      console.log(`skip (exists): ${r.name}`)
      skipped++
      continue
    }
    const place = r.city ? places[r.city.toLowerCase()] ?? null : null
    const county = place ? countyFor(place.lon, place.lat, counties) : null
    const p = buildProspect(r, { place, county, now })
    if (!p.county) console.error(`warning: ${r.name} has no county (pin will not map)`)
    prospects[id] = p
    added++
    console.log(`add ${id} ${r.name} [${p.county ?? "??"}] ${r.signal_category}`)
  }
  if (!dry) writeFileSync(PROSPECTS, JSON.stringify(prospects, null, 1) + "\n")
  console.log(`${dry ? "DRY RUN: " : ""}${added} added, ${skipped} skipped, total ${Object.keys(prospects).length}`)
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) main()
