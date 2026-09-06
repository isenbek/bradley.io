---
title: "House Calls maps: the fleet-mesh maps plan"
project: housecalls
status: DRAFT for Brad's review
created: 2026-09-06
---

# Maps on the hunt page

Brad's ask: "We'll add maps," fed by the fleet mesh. This is the plan. The
short version: every piece already exists and every piece is self-hosted. The
map is assembly, not invention.

## What the map shows (the product)

One MapLibre board on /housecalls, panel ground, three layers that arrive in
phases:

1. **The territory** (P1): West Michigan with Kent County forward. County/city
   choropleth of prospect density from the harvest: where the hunt is looking,
   and how hard. This is the public face of "harvest every possible business."
2. **The pins** (P2): individual prospect pins at coarse position (city or ZIP
   centroid, never an address) colored by pipeline stage. A named pin only for
   a company whose relevant fact is already public (their own posting), same
   rule as the ledger.
3. **The rig** (P3): the hunt's own telemetry as a side panel, not a map layer:
   our workspace's job counts by status, last-harvest timestamp, discovery
   counts over time. The machine showing its own work.

## Ground rules

- **PII stays hidden.** Coordinates for unnamed prospects are centroid-snapped
  (city or ZIP). Exact locations only for facts the company itself published.
- **Rig telemetry is scoped to OUR workspace** (`ws_86a68391f69c4247`), never
  the platform's global queue. What the CB fleet is doing for other tenants is
  not ours to publish.
- **Kit color law applies** (CLAUDE.md + chart-theme): density is ONE hue
  light-to-dark (`SEQUENTIAL_HEX`, already OKLab-monotonic); pipeline stages
  are the fixed categorical order via `MAP_INK` (ocean, burnt, mustard,
  forest); blue means active, orange means attention, red appears only if an
  assertion fails. MapLibre paint cannot read CSS vars, so all hex comes from
  `lib/beta/chart-theme.ts` and nowhere else.
- **Anti-cloud, end to end.** No Mapbox, no Google, no third-party tile CDN.

## The pieces, all in hand

| Piece | What we use | Status |
|---|---|---|
| Base tiles | `https://dragonfli.tinymachines.ai/tiles/services/great-lakes`: self-hosted planetiler vector tiles, OpenMapTiles schema, CORS open, already centered on GR (`GR_CENTER` in `components/dragonfli/airspace/style.ts`) | LIVE, serving /dragonfli today |
| Renderer | MapLibre GL, already a runtime dep; dark-ink style pattern proven in `airspaceStyle` | LIVE |
| Colors | `lib/beta/chart-theme.ts` (`MAP_INK`, `SEQUENTIAL_HEX`, `mapRamp`) | LIVE |
| Geocoding | `cbgeo` (v0.4.3): `search`, `lookup`, `reverse` | LIVE, cbcli-verified |
| Prospect source | cbintel workspace jobs + artifacts (`ws_86a68391f69c4247`) | first crawl in queue |
| Rollup pattern | cbelections `prospecting counties` ("per-county rollup: the pin maps' feed") as the reference shape for our own rollup | studied, not reused directly |
| County boundaries | `cbdistricts` service, or vendor a one-time Census cartographic boundary file for MI counties into `public/data/` | pick during P1 |

Note on "the mesh": `mesh.campaignbrain.dev` is the worker mesh gateway
(WebSocket, no OpenAPI). We do not talk to it directly; cbintel jobs ARE the
mesh access. If Brad wants live mesh telemetry later, `cbcli top` is the
cockpit and P3 can proxy a scoped slice.

## Data flow (the same shape as every instrument on the site)

```
cbintel crawl/graph jobs (workspace ws_86a68391f69c4247)
        │  scripts/housecalls-harvest.mjs  (cron/deploy-time, uses cbcli)
        ▼
prospects.json (PRIVATE, repo-ignored: names, urls, contacts, provenance)
        │  geocode once via cbgeo, cache results; coarsen to centroid
        ▼
public/data/housecalls.json        (ledger + counters, machine-fed)
public/data/housecalls-map.json    (county rollups + coarse pins, NO PII)
        │  committed by deploy.sh (public/ is staged)
        ▼
/housecalls page: ledger (exists) + MapLibre board (new)
```

Key property: the PUBLIC artifacts are aggregates. The private prospect file
never enters `public/` and never leaves the box; the pipeline is the PII
firewall, enforced by path, not by discipline.

## Phases

**P1: territory choropleth.** Build `scripts/housecalls-harvest.mjs` (poll
workspace → normalize prospects → rollup by county/city), the map component
(`components/housecalls/HuntMap.tsx`, `dynamic(ssr:false)` like every GL
board), county boundaries decision, one sequential-hue density layer, ledger
goes machine-fed as a side effect. Ships as soon as the first crawl returns
usable prospects.

**P2: stage pins.** Centroid-snapped pins colored by stage (identified /
qualified / drafted / contacted / replied), `MAP_INK` categorical, hover card
with the public-facts-only summary. Needs the tracker schema settled (shaped by
real crawl output, per doctrine).

**P3: rig telemetry.** Our-workspace job stats panel beside the map; maybe a
small "last harvest" pulse. Pure cbintel `jobs list` filtered to our workspace.

## Open questions for Brad

1. County choropleth from `cbdistricts`, or vendor Census boundaries into the
   repo (fully self-contained, anti-cloud-est option)?
2. Does the harvest script run on cron (fresh map daily) or only at deploy?
   Cron means committing `public/data` changes outside deploy.sh's flow, same
   pattern question as the /eyes timer.
3. P2 stage vocabulary: adopt the ledger's kinds, or a dedicated pipeline
   enum? (Recommend dedicated: ledger kinds are narrative, stages are state.)
