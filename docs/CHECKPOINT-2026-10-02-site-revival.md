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

### sysforge.ai in the forge design (2026-10-03)

- **sysforge.ai now wears the owner's "working forge" design:** anvil and
  sparks, slag ticker, riveted shop-floor plates, five-step process,
  tempering chart, the smiths, the warranty, and a light/dark switch.
- **The earlier page's content is merged into it:** the interactive job
  board, the counted numbers (as "hallmarks"), the roadmap, the four
  promises as the warranty's fine print, the investor card
  (hello@sysforge.ai), the disclaimer, and the linked family strip.
- **Fonts are self-hosted;** the favicon and share card are the anvil.
- **The design export** is kept in the private sysforge-site repo
  (`design-source/`). The copy in this repo's `docs/` stays untracked,
  because this repo is public.

### Site routing audit, and the docket (2026-10-03)

- **The audit:** every hostname this box serves, plus a crawl of 11 sites
  and about 28,000 links. The family sites route cleanly; the problems sit
  around the edges.
- **The report and the work list** are in the private
  `isenbek/meatball-labs` repo (`docs/SITE-ROUTING-AUDIT.md`). They stay out
  of this repo because they name internal hosts and services that are down.
- **Next, in order:**
  1. The routing fixes.
  2. The owner's five: one kit across the sites, a device/user handshake,
     first-party tracking, SEO and sharing, one header and footer.

### The Nominate-AI deep dive, continued (2026-10-03)

- **cbmodels and FQL** (its federated query layer) were read in full and
  written up as the data half of the core.
- **The core triad** was named, and the services were sorted into packs
  that could be bundled and sold, with the first offer recommended.
- **All findings are in the private `Nominate-AI/infrastructure` docs,**
  next to the earlier core explainer and the boundary map. The analysis
  data and scripts live on `/mnt/ursa`. None of it belongs in this repo,
  which is public.

### The routing fixes (2026-10-03)

All four routing items on the docket are done. The details stay in the
private audit report.

- **TerraPulse's API** had stopped answering while its health check still
  said OK. One route walked the data disk on every request until every
  worker was stuck. It now keeps a cached answer, and 60 simultaneous
  requests take milliseconds. Fixed in its own repo.
- **TerraPulse backups** keep 7 days. The backup disk had filled up and the
  nightly backup was failing.
- **housecalls.bradley.io is off** and redirects to bradley.io. The House
  Calls section on bradley.io itself is unchanged.
- **18 dead hostnames retired.** They answer "410 Gone", and the old
  configs are kept for undo.
- **Broken links on tinymachines.ai fixed.** The 6502 tool and article pages
  now root their relative links. bradley.io's 6502 links point straight at
  the new address (v1.0.422).
- **Next:** the owner's five, starting with one kit across the sites.

### The family org model (2026-10-04)

- **meatball.ai becomes the Thought Lab,** the top level for every lab site,
  each shown in its own style. **bradley.io is Brad:** his work, his client
  projects, and a door to the lab.
- **The notes, thoughts and 11 open questions** are in the private
  `isenbek/meatball-labs` repo (`docs/ORG-MODEL.md`).
- **Next session:** the owner answers those questions; then meatball.ai's
  directory, bradley.io's client section, and the shared base kit.

### The two hubs, built (2026-10-04)

- **bradley.io's top level is Me / Work / Projects,** the owner's call: three
  bold doors under the home headline, above the fold at every width (Me for
  hiring, Work for clients, Projects for builders). The masthead reads Me,
  Work, Projects, Contact (v1.0.423).
- **The client projects moved onto /work:** TerraPulse and Campaign Brain
  large, then tinychase, Nominate.AI and MyFinalWishes (still named, not
  linked). The commit record follows as "The record". /projects keeps the
  lab; its "Platforms" group is now "Tools" (v1.0.424).
- **/projects has a door to the Thought Lab** at meatball.ai (v1.0.425).
- **meatball.ai's house is the lab directory:** tinymachines, SysForge,
  hotbits, amy.io and snailmail.ai (slots held) and the boneyard, each card
  in its own site's style; a "Brad's work is next door" strip to bradley.io;
  12 retired hostnames in the boneyard, epitaphs still to write.
- **deploy.sh fix:** it no longer stops when untracked files sit outside
  its paths and nothing is staged.
- **Still open:** questions 1 to 3 (cjgaldes.com, isenbek.io, the
  tinymachines side projects), 7 (the resume rule) and the rest in
  ORG-MODEL.md; then the shared base kit, header and footer.

### The family base kit, started (2026-10-04)

- **One registry and one skeleton** in the private `isenbek/meatball-labs`
  repo (`family/`): `family.json` lists the family's sites and their nine
  hues; `base.css` is the shared masthead, footer and dots, skinned per site
  by variables; `build.py` writes them into the sites and refuses stale
  deploys (`--check`).
- **meatball.ai and sysforge.ai** wear the shared masthead and footer. On a
  phone their links now keep a scrolling row instead of disappearing.
- **bradley.io's footer dots** read the registry (`scripts/sync-family.sh`,
  v1.0.426); its masthead and footer stay the tinymachines kit's.
- **tinymachines.ai** has the contract; its own session decides.
- **Next:** hues for hotbits, amy.io and snailmail.ai when they land; then
  docket item 8 (SEO and share cards).

### SEO and share cards, started (2026-10-04)

- **Audit:** bradley.io and tinymachines.ai already had title, description,
  canonical, a share card, structured data, robots.txt and a sitemap.
  sysforge.ai lacked the canonical, structured data, robots and sitemap;
  meatball.ai had none of it, and its title sat inside the body.
- **The family kit now writes all of it** for the two static sites from
  `family/seo.json` (private `isenbek/meatball-labs`): the head block, the
  structured data (SysForge names Meatball Labs as its parent), robots.txt
  and sitemap.xml. meatball.ai's head is fixed and it has its own share card
  and icons. Both live.
- **tinymachines.ai reads the family registry** too (its own session, on
  beta and deploying): a change to the family list now means resyncing
  bradley.io and tinymachines.ai before their deploys.
- **Open:** whether bradley.io's and tinymachines.ai's structured data
  should name Meatball Labs as parent (the owner's call).

### First-party tracking, started (2026-10-04)

- **No new tracker.** The /visitors collector already read every nginx log
  on the box (bots split from people, page reads, visits, no IP kept). It
  now also writes a **family** section: reads and visits per family site,
  the outside sites that sent readers (host names only), and **doors**:
  clicks from one family site to another. No cookie, pixel or script.
- **First 30 days:** tinymachines.ai 13,994 reads in 5,518 visits;
  bradley.io 9,794 in 4,298; sysforge.ai and meatball.ai are two days old
  (378 and 177). One door crossing so far.
- **Links into the family keep their referrer** (`lib/external-rel.ts`,
  v1.0.427); every other outbound link still sends none. Without it, doors
  from bradley.io were invisible.
- **Next:** a family panel on /visitors (unlisted), then the device
  handshake (item 6).

### The family panel on /visitors (2026-10-04)

- **/visitors shows the family** (v1.0.430): one row per family site with
  its dot, pages read, visits, the first day in the window and the top
  outside referrer, then a Doors table of crossings between family sites.
- **Shipped in three passes:** the doors began as a bar chart that cut the
  site names, so they became a table; a missing space and "1 crossings"
  were fixed.
- **The local preview server did not hydrate any page** this session, so
  client-side boards were verified on the live site instead.
- **Next:** the device handshake (item 6). The doors will mean more after a
  few days of traffic.

### The device handshake, started (2026-10-04)

- **A visitor's own choices follow them between family sites** (docket
  item 6, live on meatball.ai and sysforge.ai). Today the only choice is the
  theme (Auto, Light, Dark).
- **No identity, nothing server-side.** The choice is kept in the visitor's
  browser and rides family links after the `#` (`#fam=theme.dark`), which
  browsers never send to a server; the receiving page applies it before
  paint, keeps it, and cleans the address bar. Only listed choices are
  accepted, defaults are not sent, and a link's own anchor is never touched.
- **Only sites that run it receive it** (`"handshake": true` in the family
  registry), so bradley.io and tinymachines.ai never get a stray `#fam=`.
- **Verified live:** Dark on meatball.ai, click through, sysforge.ai opens
  dark; its server log never sees the choice.
- **Open:** what choice, if any, bradley.io and tinymachines.ai would carry
  (both single-ground, no theme switch).

### Hues for hotbits, amy.io and snailmail.ai (2026-10-04)

- **Sage is hotbits** (linking to tinymachines.ai/hotbits), **Spruce is
  amy.io**, **Rose is snailmail.ai**, held as *reserved*: named in every
  footer but not a link, since the site is retired. Moss and Plum stay open.
- **Live on meatball.ai, sysforge.ai and bradley.io** (v1.0.431); the house
  cards name their hues, and the style guide now takes each hue's owner from
  the family registry (it had shown Ochre as open).
- **bradley.io:** the visitor collector counts tinymachines.ai once even
  though hotbits shares its host, /visitors keeps tinymachines.ai's own hue,
  and amy.io joins the family view.
- **tinymachines.ai must resync** the registry before its next deploy; its
  session has the details.
