---
title: "Harvest seam abstraction plan"
project: housecalls
status: PLAN; builds on a Nominate "not-now", or leisurely on a "yes"
created: 2026-09-06
---

# The pluggable harvest layer

The Nominate ask promises that a no is a fine answer because "the kit will
grow a pluggable harvest layer anyway." This plan is that promise costed
out, so the fallback is an execution and not a scramble.

## What actually touches Campaign Brain (measured, not assumed)

Six call sites, two concerns, one loose thread:

| Concern | Where | Calls |
| --- | --- | --- |
| **Crawl** | harvest main loop | list workspace jobs; get one job |
| | harvest `dispatchDiscovery` | dispatch a crawl |
| | signal-crawls script | dispatch a crawl |
| | rfp-watch `--hunt` | dispatch a crawl |
| **Geocode** | harvest `geocode()` | one cbgeo search |
| *(loose thread)* | manual curation | plain HTTPS fetch of result artifacts from cbfiles |

cbemail is already off the list (the sending design moved transport to
Proton). The geocache sits ABOVE the geocode call and caches successes
forever, so a provider swap never re-spends lookups already made.

## The seam: two interfaces, one file

`scripts/housecalls-providers.mjs`, exporting factories keyed by
`platform.json`'s new `providers` block (per-box choice, like everything
else in that file):

```json
{ "providers": { "crawl": "cbintel", "geocode": "cbgeo" } }
```

**CrawlProvider** (shapes are exactly what the pipeline consumes today):

```
listJobs()                → [job_id, ...]
getJob(id)                → { job_id, status, completed_at, result }
dispatch(query, opts)     → { job_id }
fetchArtifacts(job, dir)  → saves crawl_result / evaluation / pages, returns paths
```

`fetchArtifacts` is new and overdue: it formalizes the curl-the-result-url
step that has been manual since the first crawl landed, CB-backed or not.

**GeocodeProvider**:

```
geocode(query) → { lon, lat } | null
```

## The backends worth having

**Crawl:**
- `cbintel`: today's behavior, extracted verbatim. The native fit.
- `manual`: the honest degraded mode for a pilot without a workspace. A
  jobs directory the operator drops files into (a URL list, a pasted
  page); `listJobs` reads the directory, `dispatch` writes a request file
  a human fulfills. Zero external dependencies; the curation discipline is
  identical.
- `mock`: fixture-driven, for the selftests. Worth building even on a
  Nominate yes: today the selftests cover the pure functions, and a mock
  provider lets the MAIN LOOP be tested end to end for the first time.
- Named for later, not built now: a self-hosted SearXNG + fetcher backend
  (fully anti-cloud discovery), and a session-Claude backend, which would
  also close the structuring-gap seam since the model that finds pages can
  emit prospect rows.

**Geocode:**
- `cbgeo`: today's behavior.
- `census` (BUILT 2026-09-06): better than the plan imagined. The Census
  *geocoder API* turned out to be address-only (city queries: no match),
  but the Census *Gazetteer* is vendorable: places + county subdivisions
  merged into `lib/housecalls/places.json` by
  `scripts/vendor-census-places.sh` (1,491 Michigan entries, incorporated
  places outranking townships on name collisions), making geocoding a
  local dictionary hit with NO network at harvest time. A/B against the
  live cache: agreement everywhere except Holland, which genuinely
  straddles the Ottawa/Allegan line (both answers are defensible), and
  Ada, which only the subdivisions file knows (hence the merge). An
  unknown city returns an honest null, never a guess.
- `nominatim-public`: OSM's public instance, 1 request/second usage
  policy. Fine at our volume with the forever-cache; a good third option.

## What stays OUTSIDE the seam, by design

The rubric, the conservative extraction, the PII firewall, the stage
ratchet, k-anonymity, the geocache format, and every rule on the page.
Providers are dumb transports. A backend can change where pages and
coordinates come from; it can never change what the machine is allowed to
do with them.

## Execution and cost

1. Extract the five call sites behind the two interfaces; `cbintel` and
   `cbgeo` backends are cut-and-paste of existing code (half a day,
   including re-running all six selftest suites).
2. `mock` provider + first main-loop selftests (2h, pays for itself).
3. `manual` crawl provider + `census` geocode provider (2h combined; the
   census API is one HTTPS GET).
4. Checklist and operator-config docs updated: phase 0's "platform
   access" line becomes "choose your providers," with cbintel as the
   recommended default where a workspace exists.

Total: about one day, same as the template extraction, and the two days
compose: do this first and the template ships with the seam in it.

## Triggers

- **Nominate says not-now:** this plan executes before the pilot weekend
  (the ask's after-the-answer section already promises exactly that).
- **Nominate says yes:** steps 1 and 2 still happen at leisure, because
  the mock provider improves the tests and the seam keeps the yes from
  ever becoming load-bearing dependence. Steps 3 and 4 wait until a
  pilot actually needs them.
