#!/usr/bin/env node
/**
 * Selftest fixture generator (pilot-support-plan.md, prerequisite 3).
 *
 * The harvest pipeline's selftests need real coordinates in real counties,
 * which used to be hardcoded Michigan. This derives them from the operator
 * config + vendored counties instead, so a new territory runs:
 *
 *   scripts/vendor-census-counties.sh        (their state's boundaries)
 *   node scripts/housecalls-fixtures.mjs     (this)
 *   node scripts/housecalls-harvest.mjs --selftest
 *
 * and the whole suite is theirs. Writes lib/housecalls/fixtures.json:
 *   cases        3 in-county points + 1 outside-everything point, each
 *                VERIFIED by the same ray-cast the pipeline uses
 *   home         the operator's home base + its county geoid (in the home
 *                set by the config selftest's own guarantee)
 *   other_geoid  a county far from home and NOT in the home set, for
 *                fixtures that need "somewhere that scores no local bonus"
 */

import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OP = JSON.parse(readFileSync(path.join(ROOT, "lib", "housecalls", "operator.json"), "utf8"))
const counties = JSON.parse(readFileSync(path.join(ROOT, "public", OP.territory.counties_file), "utf8"))
const OUT = path.join(ROOT, "lib", "housecalls", "fixtures.json")

// Same point-in-polygon as the pipeline, so a fixture can never disagree
// with the code it tests about what "inside" means.
function inRing(lon, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates)
const inCounty = (lon, lat, f) =>
  polysOf(f.geometry).some((rings) => inRing(lon, lat, rings[0]) && rings.slice(1).every((h) => !inRing(lon, lat, h)))
const countyAt = (lon, lat) => counties.features.find((f) => inCounty(lon, lat, f)) ?? null

/** A point verifiably inside the county: centroid of the largest ring, with
 *  a bbox grid scan as the fallback for concave shapes. */
function interiorPoint(f) {
  const ring = polysOf(f.geometry)
    .map((rings) => rings[0])
    .sort((a, b) => b.length - a.length)[0]
  let sx = 0
  let sy = 0
  for (const [x, y] of ring) {
    sx += x
    sy += y
  }
  const c = [sx / ring.length, sy / ring.length]
  if (inCounty(c[0], c[1], f)) return c
  const lons = ring.map((p) => p[0])
  const lats = ring.map((p) => p[1])
  const [minX, maxX, minY, maxY] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)]
  for (let i = 1; i < 40; i++)
    for (let j = 1; j < 40; j++) {
      const x = minX + ((maxX - minX) * i) / 40
      const y = minY + ((maxY - minY) * j) / 40
      if (inCounty(x, y, f)) return [x, y]
    }
  throw new Error(`no interior point found for ${f.properties.name}`)
}

const round5 = (n) => Math.round(n * 1e5) / 1e5

// Home: the operator's own base, whose county membership the config selftest
// already guarantees.
const home = OP.territory.home
const homeCounty = countyAt(home.lon, home.lat)
if (!homeCounty) throw new Error("operator home base is not inside any vendored county; fix operator.json first")
if (!OP.territory.home_county_geoids.includes(homeCounty.properties.geoid))
  throw new Error(`home base county ${homeCounty.properties.geoid} is not in home_county_geoids; fix operator.json first`)

// Other: the farthest county centroid from home that is NOT in the home set.
const dist = (f) => {
  const p = interiorPoint(f)
  return Math.hypot(p[0] - home.lon, p[1] - home.lat)
}
const homeSet = new Set(OP.territory.home_county_geoids)
const away = counties.features.filter((f) => !homeSet.has(f.properties.geoid)).sort((a, b) => dist(b) - dist(a))
if (away.length === 0) throw new Error("every county is a home county; fixtures need one that is not")
const other = away[0]
const middle = away[Math.floor(away.length / 2)]

// Outside: step west of the whole state's bounding box until nothing claims it.
let minLon = Infinity
let midLat = 0
for (const f of counties.features)
  for (const rings of polysOf(f.geometry))
    for (const [x, y] of rings[0]) {
      if (x < minLon) minLon = x
      midLat += 0 // lat picked from home below; bbox scan kept lon-only
    }
midLat = home.lat
let outside = null
for (let step = 0.5; step <= 5; step += 0.5) {
  const cand = [minLon - step, midLat]
  if (!countyAt(cand[0], cand[1])) {
    outside = cand
    break
  }
}
if (!outside) throw new Error("could not find a point outside every county")

const mk = (f) => {
  const p = interiorPoint(f)
  return { name: `${f.properties.name} county interior`, lon: round5(p[0]), lat: round5(p[1]), want: f.properties.geoid }
}
const fixtures = {
  generated: new Date().toISOString(),
  state_fips: OP.territory.state_fips,
  cases: [
    { name: `home base (${home.label})`, lon: home.lon, lat: home.lat, want: homeCounty.properties.geoid },
    mk(other),
    mk(middle),
    { name: "outside every county (open water or next state)", lon: round5(outside[0]), lat: round5(outside[1]), want: null },
  ],
  home: { geoid: homeCounty.properties.geoid, lon: home.lon, lat: home.lat },
  other_geoid: other.properties.geoid,
}

// Verify every case against the same code that will test with them.
for (const c of fixtures.cases) {
  const got = countyAt(c.lon, c.lat)?.properties.geoid ?? null
  if (got !== c.want) throw new Error(`fixture self-check failed: ${c.name} got ${got}, want ${c.want}`)
}

writeFileSync(OUT, JSON.stringify(fixtures, null, 1) + "\n")
console.log(`wrote ${path.relative(ROOT, OUT)} for state ${fixtures.state_fips}:`)
for (const c of fixtures.cases) console.log(`  ${c.want ?? "null "}  ${c.name} (${c.lon}, ${c.lat})`)
console.log(`  home ${fixtures.home.geoid} | other ${fixtures.other_geoid}`)
