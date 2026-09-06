#!/bin/bash
# Vendor the operator's state PLACE centroids from the US Census Gazetteer
# into lib/housecalls/places.json, for the `census` geocode provider: a
# city-level geocoder that is a local file lookup, no API, no key, no
# network at harvest time (the counties treatment, applied to geocoding).
#
# Source: Census Gazetteer national places file (public domain). Each place
# carries an interior point (INTPTLAT/INTPTLONG). Where one base name has
# several flavors (city, village, township, CDP), the vendor keeps the most
# municipal one, so runtime lookup stays a dumb dictionary hit.
set -euo pipefail

YEAR=2024
BASE="https://www2.census.gov/geo/docs/maps-data/data/gazetteer/${YEAR}_Gazetteer"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
CFG="$REPO/lib/housecalls/operator.json"
STATEFP=$(node -p "require('$CFG').territory.state_fips")
OUT="$REPO/lib/housecalls/places.json"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# Two files: incorporated places + CDPs, AND county subdivisions (townships,
# unincorporated communities like Ada). Places outrank subdivisions when a
# base name appears in both.
echo "Fetching gazetteer places + county subdivisions (state fips $STATEFP)"
curl -sSf --retry 3 "$BASE/${YEAR}_Gaz_place_national.zip" -o "$WORK/places.zip"
curl -sSf --retry 3 "$BASE/${YEAR}_Gaz_cousubs_national.zip" -o "$WORK/cousubs.zip"
unzip -q "$WORK/places.zip" -d "$WORK/places"
unzip -q "$WORK/cousubs.zip" -d "$WORK/cousubs"

node - "$WORK" "$OUT" "$STATEFP" "$YEAR" <<'EOF'
const { readFileSync, writeFileSync, readdirSync } = require("node:fs")
const path = require("node:path")
const [work, out, statefp, year] = process.argv.slice(2)

const readGaz = (dir) => {
  const txt = readdirSync(dir).find((f) => f.endsWith(".txt"))
  return readFileSync(path.join(dir, txt), "utf8").split("\n")
}
const lines = readGaz(path.join(work, "places"))
// Most-municipal-wins when one base name has several flavors.
const RANK = [
  [/ city$/i, 5], [/ village$/i, 4], [/ borough$/i, 4], [/ town$/i, 4],
  [/ charter township$/i, 3], [/ township$/i, 2], [/ CDP$/i, 1],
]
const flavor = (name) => {
  for (const [re, rank] of RANK) if (re.test(name)) return { rank, base: name.replace(re, "") }
  return { rank: 0, base: name }
}

const places = {}
let rows = 0
// Places rank 10..1x above county subdivisions 0..9, so an incorporated
// "X city" always beats an "X township" while townships still fill gaps.
const ingest = (gazLines, rankBoost) => {
  const hdr = gazLines[0].trim().split("\t").map((h) => h.trim())
  const [g, n, la, lo] = [hdr.indexOf("GEOID"), hdr.indexOf("NAME"), hdr.indexOf("INTPTLAT"), hdr.indexOf("INTPTLONG")]
  if ([g, n, la, lo].includes(-1)) throw new Error(`gazetteer header changed: ${hdr.join(",")}`)
  for (const line of gazLines.slice(1)) {
    const f = line.split("\t")
    if (f.length < hdr.length) continue
    if (!f[g].trim().startsWith(statefp)) continue
    rows++
    const name = f[n].trim()
    const { rank, base } = flavor(name)
    const key = base.toLowerCase()
    const lon = Number(f[lo])
    const lat = Number(f[la])
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue
    const score = rank + rankBoost
    if (!(key in places) || places[key].rank < score) {
      places[key] = { lon: Math.round(lon * 1e5) / 1e5, lat: Math.round(lat * 1e5) / 1e5, name, rank: score }
    }
  }
}
ingest(lines, 10)
ingest(readGaz(path.join(work, "cousubs")), 0)
for (const p of Object.values(places)) delete p.rank

writeFileSync(out, JSON.stringify({
  generated: new Date().toISOString(),
  state_fips: statefp,
  source: `US Census Gazetteer places ${year} (public domain), interior points`,
  places,
}, null, 1) + "\n")
console.log(`${rows} gazetteer rows -> ${Object.keys(places).length} unique places -> ${out}`)
EOF

# Self-check: the operator's own home label must resolve.
node -e "
const OP = require('$CFG')
const P = require('$OUT')
const hit = P.places[OP.territory.home.label.toLowerCase()]
if (!hit) { console.error('SELF-CHECK FAIL: home label not in places file'); process.exit(1) }
console.log('self-check:', OP.territory.home.label, '->', JSON.stringify(hit))
"
