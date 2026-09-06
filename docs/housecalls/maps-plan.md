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
| County boundaries | **VENDORED** (Brad's call, 2026-09-06): `public/data/mi-counties.json`, 83 MI counties from Census cartographic boundaries 2023 1:500k (public domain), properties {geoid, name}, 5-decimal coords, ~407KB. Refresh: `scripts/vendor-census-counties.sh` | DONE |

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
qualified / drafted / contacted / replied). Schema and PII mechanics are
settled in `p2-pin-schema.md`, including a correction to this plan: five
stages are an ordered progression, so pins take the SEQUENTIAL_HEX ramp with
radius as secondary encoding, NOT MAP_INK categorical (four hues cannot carry
five stages, and stages are not categories anyway). Extraction seam still
needs real crawl output before the writer side lands.

**P3: rig telemetry.** Our-workspace job stats panel beside the map; maybe a
small "last harvest" pulse. Pure cbintel `jobs list` filtered to our workspace.

## Decisions

1. **County boundaries: VENDORED** (Brad, 2026-09-06). Census files in the
   repo, zero runtime dependence on census.gov. See the table above.
2. **OPEN: harvest cadence.** Cron (fresh map daily) vs deploy-time only. Cron
   means committing `public/data` changes outside deploy.sh's flow, same
   pattern question as the /eyes timer. Decide when the pipeline script lands.
3. **Stage vocabulary: DEDICATED ENUM** (Brad adopted the recommendation,
   2026-09-06). Ledger kinds stay narrative; pipeline stages are state:

   ```
   identified   harvested, nothing verified yet
   qualified    a human-checkable signal exists (the OBSERVED_SIGNAL test)
   drafted      a letter exists, awaiting Brad's signature
   contacted    Brad sent it (date logged)
   replied      they answered, any polarity
   won          signed engagement
   closed       out, forever: a no, a bounce, or our one-email promise expired
   ```

   One-way ratchet except closed, which is reachable from anywhere. `closed`
   is terminal and honored permanently (the no-means-no-forever rule is a
   stage, not a note). Map pins render stages on the SEQUENTIAL_HEX ramp with
   radius as secondary encoding (see p2-pin-schema.md for the correction);
   `won` and `closed` leave the map (won goes to the ledger as narrative,
   closed is nobody's business).
