---
title: "P2 pin schema: public prospect pins"
project: housecalls
status: DRAFT for Brad's review
created: 2026-09-06
---

# The pin file: public/data/housecalls-pins.json

The contract between the harvest pipeline (writer) and the hunt map (reader)
for P2 stage pins. Separate file from the P1 choropleth rollup so P1 never
breaks while P2 evolves.

## One correction to the plan, flagged loudly

maps-plan.md said stage pins render in "MAP_INK categorical order". That was
wrong twice over: there are five map stages and only four categorical hues,
and the kit's own measured finding says the four hues cannot even carry four
series safely. More fundamentally, stages are not categories. They are an
ORDERED progression, and ordered data takes a sequential ramp by law.

So: **stages map to SEQUENTIAL_HEX, five steps for five stages**, dark to
light, with pin radius as the secondary encoding (never color alone):

| stage | color | radius |
|---|---|---|
| identified | SEQUENTIAL_HEX[0] `#232F2F` | 3px |
| qualified | SEQUENTIAL_HEX[1] `#324F50` | 4px |
| drafted | SEQUENTIAL_HEX[2] `#417073` | 5px |
| contacted | SEQUENTIAL_HEX[3] `#509399` | 6px |
| replied | SEQUENTIAL_HEX[4] `#5FB8C0` | 7px |

The mass of raw harvest sits faint against the panel; a reply glows. The most
advanced pin is the brightest thing on the board except home base, which is
right. `won` and `closed` never appear (maps-plan.md stage enum).

## The file

```json
{
  "generated": "2026-09-13T12:00:00Z",
  "stages": ["identified", "qualified", "drafted", "contacted", "replied"],
  "pins": [
    {
      "id": "a3f9c2e1b807",
      "stage": "qualified",
      "pos": [-85.6712, 42.9581],
      "county": "26081",
      "label": null,
      "sector": "manufacturing",
      "since": "2026-09-11",
      "fact": null
    },
    {
      "id": "7be40d91cc25",
      "stage": "drafted",
      "pos": [-85.6528, 42.9418],
      "county": "26081",
      "label": "Steelcase",
      "sector": "manufacturing",
      "since": "2026-09-12",
      "fact": "hiring a Data Analytics Engineer, per their own posting"
    }
  ]
}
```

TypeScript contract (lands beside the component when P2 is built):

```ts
type PinStage = "identified" | "qualified" | "drafted" | "contacted" | "replied"

interface Pin {
  /** Prospect's stable hash id from the private file. Correlatable across
      publishes BY DESIGN, so the map can animate stage changes. Reveals
      nothing else. */
  id: string
  stage: PinStage
  /** Centroid-snapped [lon, lat]. See position rules. NEVER an address. */
  pos: [number, number]
  /** County geoid; must agree with pos (pipeline asserts). */
  county: string
  /** Company name, ONLY under the public-fact rule; null = anonymous. */
  label: string | null
  /** Coarse sector, ONLY when k-anonymous or named; null otherwise. */
  sector: string | null
  /** Date the pin entered its current stage (date only, never a timestamp). */
  since: string
  /** For named pins only: the one-line public fact that names them
      (their own posting, their own press). null for anonymous pins. */
  fact: string | null
}

interface PinFile {
  generated: string
  stages: PinStage[]
  pins: Pin[]
}
```

## Position rules (the PII mechanics)

1. **Snap**: `pos` is the prospect's CITY centroid (from the geocache), never
   the geocoded street address. No city on file: county centroid. Nothing on
   file: no pin (the prospect still counts in the P1 rollup via county null
   exclusion rules; unmappable prospects simply do not pin).
2. **Deterministic jitter**: pins sharing a centroid would stack, so each pin
   is offset by up to ~1km, derived from `hash(id)` (angle + radius), NOT
   random per build. Stable across publishes, carries zero location
   information, and exists purely so pins do not cover each other.
3. **County assertion**: after jitter, the pipeline re-runs point-in-polygon.
   If jitter pushed the point over a county line (or into water), it is
   dropped and the bare centroid is used.
4. **k-anonymity for sector**: an anonymous pin's `sector` is published only
   when at least k=3 pins share that (sector, city) cell. "The one furniture
   maker in Ada" is identifiable by sector alone; three of them are not.
   Named pins (public-fact rule already cleared) skip the check.
5. **`since` is a date, never a timestamp.** Send-time metadata stays private.

## Reader (map component) duties

- Render pins per the color/radius table; legend chips show all five stages
  with swatch + label so identity is never color-alone (per dataviz law).
- Hover card: label ?? "unnamed prospect", stage, county name, since, and
  `fact` when present. Nothing else exists client-side to leak.
- Stage filter chips filter pins WITHOUT recoloring survivors (color follows
  the entity, never the filter state).
- Pins draw above the choropleth, below home base.

## Writer (pipeline) duties

- Emit only MAP_STAGES prospects that pass the position rules.
- Assert every invariant above at write time; a violation drops the pin and
  logs to stderr rather than shipping a leak.
- The file is regenerated whole on every harvest; ids provide continuity.
