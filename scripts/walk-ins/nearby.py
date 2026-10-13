#!/usr/bin/env python3
"""Workplaces within five miles of home, for /walk-ins, into public/data/walk-ins.json.

Inputs are PRIVATE and live off the repository (WALKINS_PRIVATE_DIR, default
/mnt/ursa/bradleyio/planning/2026-10-13-nearby): the OpenStreetMap pull
(nearby-osm.json) and a curated list of larger employers geocoded with
Nominatim (curated-geocoded.json). Both carry coordinates and exact distances.

The output carries NEITHER. Each workplace is published with a distance band
only (under 2 miles, 2 to 3.5, 3.5 to 5), because a list of exact distances
from one point is that point's location. The bands are coarse on purpose.

Kept: employers a person might walk into with a resume about AI and data:
manufacturers, engineering and software firms, insurers and banks' head
offices, health systems, universities, publishers, public bodies. Dropped:
shops, clinics, law and real-estate offices, trades, bars and the like; they
are counted in `dropped` so the cut is on the record.

Run from the repo root:  python3 scripts/walk-ins/nearby.py
"""
import json, os, re, datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRIV = Path(os.environ.get("WALKINS_PRIVATE_DIR", "/mnt/ursa/bradleyio/planning/2026-10-13-nearby"))
OUT = ROOT / "public" / "data" / "walk-ins.json"

def norm(name):
    n = re.sub(r"[^a-z0-9 ]", "", name.lower()); n = re.sub(r"^(corewell health|spectrum health) ", "", n)
    return re.sub(r"\s+", " ", n).strip()[:14]

def band(miles):
    return "under 2" if miles < 2 else "2 to 3.5" if miles < 3.5 else "3.5 to 5" if miles <= 5.05 else None

KEEP_OSM = {  # OSM category -> our kind
    "office=it": "software", "office=company": "company", "office=yes": "company", "office=commercial": "company",
    "office=engineer": "engineering", "office=aerospace": "aerospace", "office=consulting": "consulting",
    "office=government": "public body", "office=educational_institution": "education", "office=insurance": "insurance",
    "building=industrial": "manufacturing", "man_made=works": "manufacturing", "landuse=industrial": "industrial",
    "building=office": "company", "building=warehouse": "distribution", "amenity=hospital": "health system",
    "amenity=university": "university", "amenity=college": "college", "office=employment_agency": "staffing",
    "office=financial_advisor": "finance", "office=accountant": "finance", "office=security": "security",
    "healthcare=blood_donation": "health", "craft=brewery": "food and drink", "craft=distillery": "food and drink",
}
DROP_NAMES = re.compile(r"leasing office|h&r block|allstate|edward jones|keller williams|shoe repair|phone repair|ubreakifix|cleaning|roofing|roofs|electric$|deck builders|cabinetry|tailor|sew on|studios$|winery|brewing|brewery|distill|jadan james|chabad|church|ministries|salvation army|council of neighbors|conference center|campus safety|technology support|mail & print|secretary of state|passport|plasma|aesthetics|building$|title agency|advisors$|financial services|ehtc|woodland ranch|woodland mall|city hall|administration center", re.I)

osm = json.load(open(PRIV / "nearby-osm.json"))
cur = json.load(open(PRIV / "curated-geocoded.json"))
rows, dropped, seen = [], 0, set()
for r in cur:
    b = band(r["miles"])
    if not b or DROP_NAMES.search(r["name"]): continue
    seen.add(norm(r["name"].split(" (")[0]))
    rows.append({"name": r["name"], "kind": r["what"], "band": b, "source": "curated"})
for r in osm:
    b = band(r["miles"]); kind = KEEP_OSM.get(r["category"])
    key = norm(r["name"])
    if not b or not kind or DROP_NAMES.search(r["name"]) or any(key.startswith(s[:10]) or s.startswith(key[:10]) for s in seen):
        dropped += 1; continue
    seen.add(key)
    rows.append({"name": re.sub(r",\s.*(plant|products)$", "", r["name"], flags=re.I), "kind": kind, "band": b, "source": "osm"})
order = {"under 2": 0, "2 to 3.5": 1, "3.5 to 5": 2}
rows.sort(key=lambda r: (order[r["band"]], r["name"].lower()))
out = {
    "generated": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
    "centre": "home, Kentwood, Michigan", "radiusMiles": 5,
    "bands": ["under 2", "2 to 3.5", "3.5 to 5"],
    "sources": {"osm": "OpenStreetMap, named workplaces within 8,047 m, pulled 2026-10-13 (ODbL)", "curated": "larger employers known to the owner, geocoded by address with Nominatim, 2026-10-13"},
    "counts": {"kept": len(rows), "droppedFromOsm": dropped, "byBand": {b: sum(1 for r in rows if r["band"] == b) for b in order}},
    "rows": rows,
}
OUT.write_text(json.dumps(out, indent=1) + "\n")
print(f"{len(rows)} kept, {dropped} dropped; by band {out['counts']['byBand']}")
