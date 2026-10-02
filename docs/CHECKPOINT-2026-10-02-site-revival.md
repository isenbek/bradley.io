---
title: "Checkpoint: the site revival, 2026-10-02"
status: phases 1, 3 and 4 live (v1.0.415); phase 2 waits on the owner
---

# Checkpoint: the site revival, 2026-10-02

The owner said the site "feels like a downgrade" and asked for the lost
content back, life in the UI, true numbers, and working automation. This
is where that stands, written so the next session can pick it up cold.

## Live now (v1.0.415)

- **Phase 1, truth first.** Activity totals come from the durable
  DuckDB record (`scripts/activity_db.py`), not rolling session logs.
  AI enrichment goes through `scripts/ai_client.py`, which logs every
  failure and never caches one. The cost model is a frozen case study
  of 2025-12-01 to 2026-03-26. Every instrument shows LIVE, STALE or
  OFFLINE (`lib/instrument-status.ts`), never red. Papers honour the
  source's withdrawal flag.
- **Phases 3 and 4, content and life.** A new home page with measured
  hero chips, a Running now panel, the activity pulse, selected work,
  the 6502 die, and organisation cards. About carries the original
  story, the career since 1997, and a signed "How this site is built".
  Also: `/bench` (every live page and its status), a curated
  `/projects`, Turfy restored, the AI pilot licence as a document with
  `/pilot-analytics` folded in, the shift and cost argument back,
  papers as cards, richer services, contact, work and terminal,
  desktop navigation, and the footer colophon.
- **WOPR.** `/terminal`'s `wopr` command uses bradley.io's own
  `/socket.io/`. nginx caps connections per visitor, and the server
  caps questions per visitor and in total.

## Method

Every item was built by one agent, then reviewed by another at four
widths, attacked in code, and fact-checked, then repaired before
integration. Survey data, results and nginx backups are in
`/mnt/ursa/bradleyio/planning/2026-10-02/`.

## Waiting on the owner

- **Phase 2, the resume update.** Then an MCP resume server and a chat
  on the Claude API with a tight cap, which needs an API key. Open
  questions: whether Campaign Brain is an employer, client or venture,
  and whether it may be named; whether SysForge and VictoryText are
  current; TerraPulse and tinychase credit; whether the site may say
  he is open to roles; the die-image licence; remote versus local;
  the salary floor.
- **Content calls, with defaults in force.** A held papers study; 37
  machine-written project descriptions; "one operator" in the cost
  study; the masthead dot's colour; `/eyes` and `/visitors` on
  `/bench`; whether Turfy is still designed, not built.
- **Hardware.** The Geiger box, the SDR and fleet box, and the token
  box are off the network. The cameras and microphones are unplugged.

## Follow-ups

- The timeline pipeline should emit per-repo weekly buckets for
  sparklines.
- Papers need thumbnails, a findings summary, and a severe-weather
  domain.
- `LineSeries.dashed` and `RowChart.max` in `app/_charts.tsx`.
- The Lightbox needs a focus trap.
- The `cjgaldes.com` mirror needs three component patches before its
  `ai-pilot-data.json` exclude can go.
