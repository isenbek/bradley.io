#!/bin/bash
# Vendor the operator's state county boundaries from the US Census Bureau into
# public/data/. State and output path come from lib/housecalls/operator.json
# (territory.state_fips / territory.counties_file), the franchise seam: a new
# operator sets their state there and re-runs this.
#
# Source: Census cartographic boundary files (public domain), 1:500k resolution.
# Output: GeoJSON with properties {geoid, name}, coordinates rounded to 5
# decimals (~1m precision, plenty for a county choropleth). Re-run to refresh;
# nothing at runtime ever fetches from census.gov (anti-cloud: the vendored
# file IS the dependency).
set -euo pipefail

YEAR=2023
URL="https://www2.census.gov/geo/tiger/GENZ${YEAR}/shp/cb_${YEAR}_us_county_500k.zip"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
CFG="$REPO/lib/housecalls/operator.json"
STATEFP=$(node -p "require('$CFG').territory.state_fips")
STATENAME=$(node -p "require('$CFG').territory.state")
OUT="$REPO/public$(node -p "require('$CFG').territory.counties_file")"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

python3 -c "import shapefile" 2>/dev/null || pip install --quiet --user pyshp

echo "Fetching $URL (state $STATEFP: $STATENAME)"
curl -sSf "$URL" -o "$WORK/counties.zip"
unzip -q "$WORK/counties.zip" -d "$WORK"

python3 - "$WORK" "$OUT" "$YEAR" "$STATEFP" "$STATENAME" <<'EOF'
import json, sys, glob
import shapefile

work, out, year, statefp, statename = sys.argv[1:6]
shp = glob.glob(f"{work}/*.shp")[0]
r = shapefile.Reader(shp)
fields = [f[0] for f in r.fields[1:]]

def rnd(coords):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], 5), round(coords[1], 5)]
    return [rnd(c) for c in coords]

feats = []
for sr in r.iterShapeRecords():
    rec = dict(zip(fields, sr.record))
    if rec.get("STATEFP") != statefp:
        continue
    geom = sr.shape.__geo_interface__
    feats.append({
        "type": "Feature",
        "properties": {"geoid": rec["GEOID"], "name": rec["NAME"]},
        "geometry": {"type": geom["type"], "coordinates": rnd(list(geom["coordinates"]))},
    })

feats.sort(key=lambda f: f["properties"]["geoid"])
fc = {
    "type": "FeatureCollection",
    "name": f"{statename} counties, US Census cartographic boundaries {year} 1:500k (public domain)",
    "features": feats,
}
with open(out, "w") as f:
    json.dump(fc, f, separators=(",", ":"))
print(f"{len(feats)} counties -> {out}")
EOF

ls -la "$OUT"
