---
title: "Operator stand-up checklist"
project: housecalls
status: kit documentation (the list the pilot letter promises)
created: 2026-09-06
---

# Standing up a House Calls machine

The list the pilot letter promises to send. Ordered so nothing blocks on a
later step, honest about which steps have teeth, and marked [FLAGSHIP TOO]
where the reference machine itself has not finished the step. Budget: a
weekend for phases 1 through 6, if phase 0 was really done first.

## Phase 0: decisions before the weekend

- [ ] **Territory.** Your state and your home counties (the ones that get
      the rubric's local-score bump). County lines, not vibes.
- [ ] **Domain.** The hunt runs at a subdomain of a domain you control
      (flagship: housecalls.bradley.io).
- [ ] **Hardware.** A box you own that stays on. The flagship is a plain
      Linux server running one Node service; anything modern with a real
      disk works. Host local is the product; no cloud instances.
- [ ] **Your Claude.** Your own relationship with your own AI. The kit
      hands it doctrine files; it does not include AI access.
- [ ] **Harvest platform access.** Your own workspace id. [UNRESOLVED FOR
      PILOTS: this is the Campaign Brain conversation the pitch letter's
      checklist flags. Do not start the weekend without an answer.]
- [ ] **A physical mailing address** you are willing to put in email
      footers. CAN-SPAM requires it; no address, no outbound, ever.

## Phase 1: the machine

- [ ] Linux box on your network, static LAN address, SSH keys, backups
      thought about.
- [ ] Node LTS + bun. Clone the kit repo. `bun install`.
- [ ] `bun run lint` and the dev server come up clean before you change
      anything, so the first broken thing is yours.

## Phase 2: whose machine this is

- [ ] Edit `lib/housecalls/operator.json`: your name, site, hunt host,
      state + FIPS, counties file path, home base coordinates, map zoom,
      home-county geoids, your conflicts list (competitors and
      relationships you will not pitch), letter bindings, k_anon (leave 3).
- [ ] Create `data/housecalls/platform.json`: your cbcli path and workspace
      id. It lives in the gitignored private dir; the pipeline refuses to
      run without it and tells you what it wants.
- [ ] `node scripts/housecalls-harvest.mjs --selftest`: the 8 config tests
      pass before anything else matters. (County fixtures are keyed to
      Michigan; regenerate them with your state's coordinates as part of
      this step.)

## Phase 3: your territory on the map

- [ ] `scripts/vendor-census-counties.sh` reads your state from the config
      and vendors your counties from the Census. Verify the county count
      matches your state's actual number.
- [ ] **Tiles, the honest hard step.** The basemap is a self-hosted vector
      tile server (`territory.tilejson`); the flagship serves its own
      Great Lakes tiles. You need your region served from your own metal.
      Plan an evening for it the first time.
- [ ] Map renders locally: counties dark at zero, home dot on your town.
      Dark at zero is correct; it is the honest state.

## Phase 4: the AI and its manual

- [ ] Hand your Claude the doctrine: the hunt page copy, the rules, the
      qualification rubric, the reply playbook, the letter templates, this
      checklist. The manual is executable; this step is most of "training."
- [ ] Rewrite the biography, not the machinery: page copy in your voice,
      your name, your prices (posted publicly or you are not this brand),
      the plain-English page for your own household reader.
- [ ] The four letters with your signature block and your physical address.
      Keep the {OBSERVED_SIGNAL} slot discipline: no honest signal, no
      send.

## Phase 5: the site, live

- [ ] DNS for your hunt subdomain, in every view your DNS serves (the
      flagship runs split-horizon and has to update two zone files; if you
      do too, bump both serials).
- [ ] nginx vhost proxying to the app, with a real ACME webroot location.
- [ ] Certificate via webroot. Renewals on a timer you have actually seen
      fire.
- [ ] If your tile server resolves to loopback locally, pin your hunt
      subdomain in /etc/hosts on your workstation too, or your own browser
      will block the map while the world sees it fine (Chrome refuses
      public-origin pages fetching loopback addresses; it bit the
      flagship).
- [ ] Deploy through the safe path (`./deploy.sh`: staged build, swap on
      success, rollback kept). Never build bare in the working directory of
      a live service.

## Phase 6: first harvest

- [ ] `node scripts/housecalls-harvest.mjs` runs clean end to end.
- [ ] Seed prospects honestly: targeted per-company queries, not generic
      ones (generic queries pull directories and aggregator noise; the
      flagship learned this in public on day one).
- [ ] Counties light up; pins drop; the rig panel shows your jobs. Pipeline
      runs update the live site with no deploy; deploys are for code.
- [ ] Screenshot the lit map. That is your machine's birthday.

## Phase 7: before the first message leaves (the gates)

Do not skip ahead to outbound. Every gate below is a hard stop:

- [ ] Physical address in every letter footer (phase 0's).
- [ ] Dedicated sending subdomain with SPF, DKIM, and DMARC, warmed
      gently, low volume. [FLAGSHIP TOO: this design is not finished on
      the reference machine either. Nobody sends until it is.]
- [ ] The rubric qualifies a prospect (real signal, bound letter, named
      contact with an email, fit) before a draft is even written.
- [ ] You read and sign every message. Not a formality: the pilot memo
      says your signature is your responsibility.
- [ ] The ledger entry for your first send is written the same day.

## What the kit does not include yet

Said plainly so nobody discovers it at midnight: the AI structuring pass
that turns crawl evidence into prospect rows (curation is manual, template
scripts included); reply detection (your inbox, your eyes, the playbook's
buckets); the tile server itself; and anything about money, which does not
exist in the pilot.

When every box above is checked, your row goes on the network page.
