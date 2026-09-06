---
title: "Operator config: the franchise seam"
project: housecalls
status: SHIPPED with the extraction pass, 2026-09-06
created: 2026-09-06
---

# The operator config

Step 1 of the franchise sketch: every knob that makes this machine *Brad's*
machine, itemized out of the code into config. A new operator changes two
files and the site copy; the method stays identical, and the selftests verify
the config before the pipeline will run with it.

## The two files

**`lib/housecalls/operator.json`** (committed, public-safe): who runs the
machine and where.

| Key | Flagship value | What it controls |
| --- | --- | --- |
| `operator.name` / `site` / `hunt_host` | Bradley Isenbek / bradley.io / housecalls.bradley.io | identity, links |
| `territory.state` / `state_fips` | Michigan / 26 | geocode queries, Census vendoring |
| `territory.counties_file` | /data/mi-counties.json | choropleth + point-in-county |
| `territory.tilejson` | dragonfli great-lakes tiles | the basemap (per-region) |
| `territory.home` | Grand Rapids, -85.67, 42.96 | map center + the blue home dot |
| `territory.map_zoom` | 6.2 | initial framing |
| `territory.home_county_geoids` | Kent + the ring | the rubric's +2 local score |
| `rubric.conflicts` | GR consulting field + platform relations | disqualification regexes |
| `rubric.letter_by_category` | the four pitch letters | signal category to letter binding |
| `privacy.k_anon` | 3 | sector suppression threshold on anonymous pins |

**`data/housecalls/platform.json`** (private dir, gitignored, per-box): how
this box reaches the harvest platform: `cbcli` path and `workspace_id`. Not
secrets exactly, but per-installation and never bundled into the client. The
pipeline refuses to run without it and says what to create.

## Who reads what

- `scripts/housecalls-harvest.mjs`: both files. 8 config selftests run before
  everything else (41 total now): required fields, home base actually inside
  a home county, letter bindings shaped like slugs, conflicts compile.
- `scripts/housecalls-signal-crawls.mjs`: both files (state in queries).
- `components/housecalls/HuntMap.tsx`: operator.json only (tiles, center,
  zoom, counties file, aria label). The old import from the dragonfli
  airspace instrument is gone; the hunt map has no cross-instrument
  dependencies.
- `scripts/vendor-census-counties.sh`: operator.json (state_fips + output
  path). Set a new state, re-run, get that state's choropleth.

## What is method, not config (deliberately unconfigurable)

The stage enum and its one-way ratchet, the rubric gates and scoring weights,
the government-lane rule (GOV_RE), jitter bounds, the PII firewall by path,
stage colors/radii (pins.ts derives from the kit), and every rule on the
public page. A franchise where operators can turn off "no means no" is not
this franchise.

## What a new operator still edits by hand

Page copy (`app/housecalls/*.tsx`: the operator's own voice and name), the
four letters (their signature, their address), the ledger (their steps), DNS,
nginx, cert, and their own hardware. The kit hands over machinery, not
biography.

## Known limits, honest

- Selftest county fixtures (Grand Rapids/Detroit/Traverse City coordinates)
  are keyed to Michigan's boundaries; a new territory regenerates them along
  with the counties file.
- The batch import scripts (`housecalls-import-batch*.mjs`) are preserved
  history, still hardwired to this repo's paths on purpose.
- The tile server is self-hosted per the doctrine; a distant operator needs
  their own region's tiles, not a config edit alone.
