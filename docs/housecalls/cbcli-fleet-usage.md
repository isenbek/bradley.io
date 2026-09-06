---
title: "How the hunt uses the cbcli fleet"
project: housecalls
status: kit documentation; measured behavior, not marketing
updated: 2026-09-06
---

# The cbcli fleet, as the hunt actually uses it

Campaign Brain is a fleet of FastAPI services at `*.campaignbrain.dev`,
driven from this box by `cbcli` (a pyenv shim at
`~/.pyenv/shims/cbcli`). This doc records which services the hunt touches,
exactly how, and everything learned the hard way. Where the harvest seam
(`scripts/housecalls-providers.mjs`) wraps a service, the pipeline never
calls cbcli directly; the provider does.

## The discovery flow (always, before any body call)

cbcli is self-describing, and guessing endpoints wastes time:

```
cbcli services                     what exists
cbcli spec <svc>                   resources + operations for one service
cbcli describe <svc> <res> -c <cmd>   the REAL body/header params
cbcli <svc> <res> <cmd> --params '{json}'   the call itself
```

Universal gotchas, all hit in practice:

- **Method twins**: `cbintel jobs get` is a PIPELINE getter; the job
  getter is `jobs get-get`. Read the spec, not the intuition.
- `--json` exists only on introspection verbs.
- DELETE-shaped calls need `--yes`.
- An HTML response means auth failure, not a missing endpoint.
- Public routes carry a ~120s edge cap; `--route dc1` has a cert
  mismatch, so stay on the public hostnames.
- Services declaring `local_url` refuse on a decommissioned box; this
  machine uses the public routes only.

## cbintel: the crawl engine (via the `cbintel` crawl provider)

What the hunt uses: `workspaces jobs` (list our workspace's job ids),
`jobs get-get` (one job), `jobs crawl` (dispatch: `workspace_id`, `query`,
`prompt_type: "investigative"`, `max_urls`). Our workspace id lives in the
private `data/housecalls/platform.json`, never in committed code.

**Result shape (measured):** a completed job's `result` is a POINTER. The
payload lives on files.campaignbrain.dev:

```
result.result_url  →  .../cbintel-jobs/<job>/crawl_result.json
                      .../cbintel-jobs/<job>/analysis/evaluation.json
                      .../cbintel-jobs/<job>/pages/<hash>.txt
```

`fetchArtifacts` on the provider formalizes this. `ai_summary` and
`top_insights` are empty without enhanced mode. `evaluation.json` carries
`page_scores` with `similarity`/`is_relevant`, and `is_relevant` is
generous to the point of uselessness: dictionaries score relevant.

**The settled verdict on crawl quality (18-job experiment, 2026-09-06):**
the search layer under the crawler favors the non-commercial web
(Marginalia-style). That makes it genuinely good at TOPICAL hunts (the
day-one cloud-repatriation crawl found real essays and a usable
directory) and structurally wrong for COMPANY lookups: eighteen
per-company crawls returned zero pages about their subjects. Signal hunts
for named companies are done by direct research now; cbintel crawls are
reserved for topical/trend/directory work and the RFP watcher's
solicitation sweep.

**Queue behavior:** shared workers, platform-wide FIFO-ish queue that
drains at roughly 55 jobs/hour with bursts to ~110. Our 18-job batch
waited ~5 hours behind ~360 jobs. Poll with `jobs list --params
'{"status":"queued","limit":1}'` and read `total`; note the
`workspace_id` filter on that listing is IGNORED (verified), so counting
"ours" means get-get on our own ids.

## cbgeo: geocoding (via the `cbgeo` geocode provider)

One call shape: `search list --params '{"q":"City, State","limit":1}'`,
Nominatim-ish rows (lat/lon sometimes strings; the provider normalizes).
The pipeline caches SUCCESSES forever in the private geocache and never
caches failures: a transient failure cached as null once unmapped Grand
Rapids itself for a run. Note the fleet-independent alternative shipped
2026-09-06: the `census` provider (vendored Gazetteer) answers the same
"City, State" question from a local file.

## cbfiles (files.campaignbrain.dev): artifact storage

Read-only from our side, plain HTTPS GETs of the crawl artifact paths
above, no cbcli involved. Raw copies always land in
`data/housecalls/raw/` before anything reads them.

## cbemail: probed 2026-09-06, retired from transport

`spec cbemail` reveals it is a BYO-mailbox bridge: `sessions create`
takes an address, an app password, and IMAP/SMTP hosts, then `send` /
`mailbox` drive that mailbox from CB's side (nice touches: `--in-reply-to`
threading, batch send). Retired for the hunt's outbound on privacy
grounds: the letterhead promises correspondence is private, and routing
Brad's mailbox password and mail through a third-party session is the
wrong trade. Outbound design rides Proton Bridge locally instead
(sending-domain-design.md). cbemail remains the documented fallback if
the Proton plan check fails.

## cb-catalog (the MCP server): use with suspicion

`search_services` returns nothing for multi-word queries (single
keywords only; validate with a control query that must hit).
The catalog's endpoint counts have been badly stale (44 services / 275
endpoints listed against a live 84 / 3,891 once); when it matters, fetch
a service's `openapi.json` directly. The MCP server also drops off some
sessions entirely; cbcli is the dependable path.

## cbelections: the architecture donor

Not called by the hunt day-to-day, but its prospecting flow (work units →
cbintel jobs → reconcile → candidates with provenance → county rollups)
is the blueprint the hunt's pipeline copied: same
job-pointer-artifact shape, same rollup-to-map pattern.

## The seam, one line

Everything above that the pipeline depends on sits behind two interfaces
in `scripts/housecalls-providers.mjs` (`crawl`, `geocode`), selected in
`platform.json`. The fleet is the default backend, not a dependency: the
`manual` + `census` providers run the whole kit with no platform at all.
