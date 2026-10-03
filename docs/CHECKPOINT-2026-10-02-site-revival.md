---
title: "Checkpoint: the site revival, 2026-10-02"
status: phases 1 to 4 live, plus site search (v1.0.419)
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

## Update, later on 2026-10-02 (v1.0.419)

### Phase 2 shipped

- **The resume is current.** `lib/resume.ts` adds this year's work under
  SysForge.ai: the prototype platform, disaster recovery, and
  MyFinalWishes, named but not linked. It also carries the chip work,
  TerraPulse, tinychase, core strengths, and availability: open to
  full-time roles in AI systems and data architecture, remote or Grand
  Rapids. The private platform is described and never named on any
  resume surface. There is no salary and no phone number.
- **The PDF is generated from the same data.** Rebuild it with
  `RESUME_BASE_URL=<url> node scripts/build-resume-pdf.mjs` whenever
  `lib/resume.ts` changes, and commit it.
- **`/api/resume` and `/api/resume/mcp`** serve the resume as JSON and
  as an MCP server with six tools.
- **`/ask`** is a Claude API chat with per-visitor limits and a $2 daily
  ceiling, and it fails closed. It stays off until `ANTHROPIC_API_KEY`
  is set in `/etc/bradley-io.env`.

### Site search

A pill in the masthead (`/` or Ctrl+K) searches every page by meaning.
The index is vectl over nomic-embed-text, run by the local Ollama. The
service is `bradley-io-search` on `127.0.0.1:32295`. The index is
`scripts/site-search/index.py`, rebuilt every 4 hours and swapped in
atomically. The environment lives at `/mnt/nom01/envs/bradleyio-search`.

### Other changes

- **WOPR** runs on bradley.io's own `/socket.io/`, rate-limited in nginx
  and in the server.
- **"How this site is built"** is signed.
- **Nominate.AI and MyFinalWishes** have cards on `/projects`.
- **The owner's calls:** Nominate-AI stays wherever the site names it,
  and the disaster-recovery setup is left alone.

### Why Hotbits and ADS-B are dark

This server's second network adapter left the 13.0.0.x network on
2026-09-28. It now sits on a second 192.168.1.0/24 network behind a
router at 192.168.1.250.

- **The Geiger box** was stranded there. A host route now reaches it.
  Its counter has logged nothing since 06:01, which needs a physical
  check.
- **The ADS-B receiver** (token), the second Geiger box, and bali are
  powered off. The ADS-B bus is broadcast-only, so this server must
  rejoin 13.0.0.x before it can hear the receiver again.
- **Diagnosis:** the memory file `project_lan_split_diagnosis`.

### Open owner questions

- The chat's API key.
- The salary floor, kept private.
- The resume length: three pages or two.
- The crawler figure: about 950 GB measured, versus "terabytes".
- Whether the router at 192.168.1.250 and the September 28 network
  change were intended.

### Later still: the Nominate-AI core

A read-only deep analysis of how the platform's core fits together (the
shared service base class and its mesh registration card, the forge
planner, the agent-state kernel, the CLI and the MCP directory). It covers
private repositories, so the write-up lives in the private
`Nominate-AI/infrastructure` repo, at `docs/NOMINATE-CORE-EXPLAINED.md`.

### meatball.ai is live, and the family is linked (v1.0.420)

- **meatball.ai** is the Meatball Labs parent site, built from the owner's
  design export (`docs/meatballai/`, left untracked here because this repo
  is public). It is static, with self-hosted fonts and no outside requests.
  Source: `~/projects/meatball-labs` (private GitHub
  `isenbek/meatball-labs`). Publish with its `deploy.sh`, which swaps
  releases atomically. nginx serves the apex and www only, with a Let's
  Encrypt certificate valid to 2027-01-01. The logo is bigger (64px on
  desktop, 48px on phones).
- **The family strip.** meatball.ai, bradley.io and tinymachines.ai all carry
  the same nine-dot strip in their footers, each with its own dot marked,
  and the three live sites linked to each other. The colours and the
  component live in the tinymachines style kit (`--color-family-*`,
  `.family`), with a specimen in the kit's zoo.
- **The kit resync.** bradley.io resynced its copy of the kit to pick the
  strip up. That brought a month of upstream fixes, notably that the menu
  no longer locks page scroll.
- **To add a family site,** put its hue, name and address in the family
  list on all three sites.


### sysforge.ai rebuilt for investors, and four family sites (2026-10-03)

- **sysforge.ai** is now a plain-language site for a first group of small
  investors. It covers what the platform does, an interactive "pick a job,
  watch it come together" board, numbers counted from the code, where the
  work stands, and a contact card. Static, self-hosted fonts, no outside
  requests. Source: `~/projects/sysforge-site` (private,
  `Sysforge-AI/sysforge-site`); publish with its `deploy.sh`.
- **The old Next.js site** (`sfproject.service`, :32236) still runs and is
  just no longer served. Rollback is the saved nginx file named in that
  repo's README.
- **The certificate** had lapsed in May because renewal checks reached the
  app and got a 404. The new config answers them; it is renewed to
  2027-01-01.
- **The family strip** now links all four sites: meatball.ai, sysforge.ai,
  bradley.io, tinymachines.ai. SysForge is the ochre dot.
- **SysForge contact** is hello@sysforge.ai (the domain's mail is on
  Proton). Confirm the address exists there before sending investors the link.
- **The SysForge vs cb\* boundary map** (all 171 repos, where to merge or
  split) is in the private `Nominate-AI/infrastructure` docs. A read-only
  mirror of the org lives at `/mnt/ursa/mirrors` with a refresh script.
  Findings stay there, not here.
