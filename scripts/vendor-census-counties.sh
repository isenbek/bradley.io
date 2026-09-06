#!/bin/bash
# Vendor Michigan county boundaries from the US Census Bureau into public/data/.
#
# Source: Census cartographic boundary files (public domain), 1:500k resolution.
# Output: public/data/mi-counties.json — GeoJSON, 83 MI counties, properties
# {geoid, name}, coordinates rounded to 5 decimals (~1m precision, plenty for a
# county choropleth). Re-run this script to refresh; nothing at runtime ever
# fetches from census.gov (anti-cloud: the vendored file IS the dependency).
set -euo pipefail

YEAR=2023
URL="https://www2.census.gov/geo/tiger/GENZ${YEAR}/shp/cb_${YEAR}_us_county_500k.zip"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$REPO/public/data/mi-counties.json"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

python3 -c "import shapefile" 2>/dev/null || pip install --quiet --user pyshp

echo "Fetching $URL"
curl -sSf "$URL" -o "$WORK/counties.zip"
unzip -q "$WORK/counties.zip" -d "$WORK"

python3 - "$WORK" "$OUT" "$YEAR" <<'EOF'
import json, sys, glob
import shapefile

work, out, year = sys.argv[1], sys.argv[2], sys.argv[3]
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
    if rec.get("STATEFP") != "26":
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
    "name": f"Michigan counties, US Census cartographic boundaries {year} 1:500k (public domain)",
    "features": feats,
}
with open(out, "w") as f:
    json.dump(fc, f, separators=(",", ":"))
print(f"{len(feats)} counties -> {out}")
EOF

ls -la "$OUT"
