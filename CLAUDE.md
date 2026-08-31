# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bradley.io — personal/consultancy site for AI Data Engineering, edge computing, and IoT integration. One repo, one directory. The public face is a set of prose pages (services, about, papers) interleaved with **live instruments**: dashboards that read real hardware on this network (a Geiger counter, an ADS-B receiver, GPS, the meatball robot's cameras, the router's drop logs).

## Design System

**The site runs the tinymachines style kit, sitewide.** The kit is vendored at `app/beta/kit/` (`tokens.css`, `components.css`, `fonts.css`, 28 woff2) from `~/projects/tinymachines/public/style/`; resync with `scripts/sync-style-kit.sh`, provenance in `app/beta/kit/VENDORED-FROM.md`. It is published at https://tinymachines.ai/style with the normative specimen zoo at `/style/zoo`.

The rules that constrain day-to-day work:

1. **Paper is documentation, panel is the machine talking.** Prose renders on paper (`--color-paper`); anything computed by a pipeline renders on panel (`--color-panel`). This is a semantic distinction, not a theme.
2. **No light/dark mode, no theme toggle — deliberately.** The site is a single-ground design. `app/kit.css` pins the ground under `[data-theme]` and carries the reasoning as a comment. Only the bio-mark iframe still reads the attribute.
3. **Red means an assertion failed and nothing else.** Blue is ACTIVE, orange is ATTENTION. Never a decorative red series; magnitude gets one hue light→dark (never a rainbow); categorical hues come in fixed order (ocean, burnt, mustard, forest), never generated from a hash.
4. **No em dashes in shipped text.**
5. **Fix the component, don't fork it.** bradley.io-specific rules go in `app/kit.css` (classes prefixed `beta-*`), never edits inside `app/beta/kit/`.
6. Fonts are the kit's: **Archivo** (display) + **IBM Plex Sans/Mono/Serif**, self-hosted, `@import`ed via `globals.css`. No Google Fonts at build or runtime.

Charts and MapLibre colour come from `lib/beta/chart-theme.ts` — one source. MapLibre paint properties **cannot read CSS variables** (GL-evaluated), so that file carries the tokens as literal hex (`MAP_INK`, `SEQUENTIAL_HEX`); regenerate them if `--color-ocean`/`--color-panel` ever change.

**One deliberate exception:** `/terminal`'s CRT is styled by route-scoped `app/terminal.css` (classes `term*`) with literal phosphor colours — a monitor is not part of a palette. The page's chrome is still the kit.

**History:** two earlier design systems are gone. The v1 multi-theme system (`sf-*` utilities, `--brand-*` vars, Deep Sea/Analog-Future/Horizon) survives only in `app/globals.css` legacy token blocks and `app/_legacy/`. The v3 "Bio Blue" design (`app/v3.css`, `--v3-*` tokens, `components/v3/`) was **deleted 2026-08-30** — reaching for a `--v3-*` token renders unstyled without erroring.

### Tech Stack
- **Framework**: Next.js 16, App Router, Turbopack
- **Language**: TypeScript strict; React 19 (Server Components by default)
- **Styling**: Tailwind CSS 4 (`@theme` in `globals.css` compiles the kit's tokens) + the kit's plain-CSS components
- **Maps**: MapLibre GL (`/dragonfli/gps`, `/dragonfli/airspace`)
- **Packages**: **bun** (`bun.lock` is in git; systemd still runs Node for `next start`). 12 runtime dependencies — kept deliberately small, verify anything new is actually needed
- **Wargames**: standalone Socket.io server (`wargames-server.js`, port 3333) with Ollama-powered WOPR; not currently linked from any page

### Project Structure
```
bradleyio/
├── app/                    # App Router; every dir here = one kit route (37 total)
│   ├── (prose)             #   about, services, contact, papers, work, projects
│   ├── (pilot analytics)   #   ai-pilot, pilot-analytics, cost-analysis, the-shift
│   │                       #   (data from app/_pilot-data, charts from app/_charts)
│   ├── (instruments)       #   trng, visitors, 6502, dragonfli/*, meatball/*,
│   │                       #   eyes, fleet, sdr, mcp, preferences, bio-mark
│   ├── terminal/           #   CLI portfolio; own terminal.css (see above)
│   ├── api/                #   route handlers proxying local services (trng,
│   │                       #   visitors, worldevent, sdr, fleet, meatball feeds)
│   ├── beta/kit/           #   the VENDORED style kit — never edit, resync
│   ├── _nav.ts             #   NAV + KIT_ROUTES; every new route registers here
│   ├── kit.css             #   bradley.io's own beta-* rules on top of the kit
│   ├── terminal.css        #   the CRT
│   └── _legacy/            #   v1 site, excluded from tsconfig/eslint/routing;
│                           #   contains dangling imports — never un-exclude
├── components/
│   ├── KitShell.tsx        # the one shell: skip link, KitNav, footer w/ version
│   ├── KitNav.tsx          # masthead + menu (sets html.menu-open, --app-head-h)
│   ├── SiteChrome.tsx      # thin wrapper → KitShell (the v3 branch is gone)
│   ├── kit/                # BioLogo, BioMarkFrame, DeployedAgo
│   ├── dragonfli/          # airspace map, GPS board, worldevent bus + decoders
│   ├── meatball/ mos/      # robot boards; 6502 die plates
│   ├── trng/ visitors/     # Hotbits board; Knock-knock board
│   ├── eyes/ fleet/ sdr/   # live instrument boards
│   ├── projects/           # instrument embeds + companion cards
│   └── preferences/ pwa/   # capability scanner; service worker
├── lib/                    # bio-logo-path, time-ago, build-info, og-cards,
│   └── beta/chart-theme.ts # THE chart/map colour source
├── scripts/                # data pipelines (activity, pilot, mcp-catalog,
│                           # visitors/worldevent collectors), vendor/sync helpers
├── public/data/            # pipeline output the pages read (committed by deploy)
├── wargames-server.js      # standalone Socket.io + Ollama server (PM2)
├── ecosystem.config.js     # PM2 config (wargames only)
├── bradley-io.service      # systemd unit (Next.js production)
└── deploy.sh               # THE deploy path — see below
```

## Development Commands

```bash
bun install            # Install dependencies (prefer bun over npm)
npm run dev            # Next.js + wargames server (concurrently)
npm run dev:next       # Next.js dev only (port 32221)
npm run build          # Production build (don't run bare in the working dir!)
npm run lint           # eslint .
```

## Deployment

**Anti-Cloud. Host Local, Think Global.**

```bash
./deploy.sh            # commit, bump, push, build into .next-staging, swap on
                       # success only, systemd restart, HTTP + stylesheet check
```

- **Next.js**: systemd service `bradley-io` on port 32221
- **Wargames**: PM2 process `bradley-io-wargames`
- **Nginx**: `bradley.io` and `new.bradley.io` proxy to 127.0.0.1:32221
- **Never bare-build in the working directory** — it swaps `.next` under the live service and 404s the CSS for real visitors. deploy.sh stages safely and keeps `.next-previous` for rollback.
- deploy.sh commits `public/` + build-info + package.json/bun.lock, but **NOT `next.config.mjs` or other root files** — commit those by hand or the deployed site and the repo disagree.
- `next.config.mjs` also **generates ~310 redirects** (retired dossiers, `/lab`, `/trng/space`, `/v3/*`); after editing it, re-verify a few redirects, not just that routes return 200.
- The user verifies on the **live site** via the footer version pill — deploy after every batch of changes.

## Key Conventions

1. **Kit classes + kit tokens only** (`panel`, `prose`, `rail`, `ledger`, `readout`, `btn`, `tag`, `crumb`, `page-head`; `--color-*`, `--text-*`, `--u`). Site-specific additions are `beta-*` classes in `app/kit.css`. Never hardcode hex in components — the exceptions are `lib/beta/chart-theme.ts` (MapLibre, documented) and `app/terminal.css` (the CRT, documented).
2. Every page renders inside `KitShell` automatically via `SiteChrome` in the root layout. New routes must be added to `NAV` or `KIT_EXTRA` in `app/_nav.ts`.
3. Bare `<h2>` outside `.prose` renders at body size (Tailwind preflight) — wrap text runs in `.prose`. Kit components sit as **siblings** of `.prose`, not children.
4. Mobile: clamp grid columns with `min(Xpx, 100%)`, never `minmax(300px, 1fr)`; wide content scrolls in its own container. Verify at 320/360/390/414.
5. **Relative times are client-only** (`components/kit/DeployedAgo.tsx` pattern): render a deterministic absolute date at SSR, upgrade in an effect. `timeAgo()` at SSR put React #418 on every page for months.
6. `toLocaleDateString` defaults to local tz — pass `timeZone: "UTC"` for `"YYYY-MM-DD"` inputs, or better, slice the ISO string.
7. React 19 / Next 16: `useRef` needs an initial value; event handlers need `"use client"`; private `_folder/` escapes routing but TS + eslint still walk it (needs explicit excludes).
8. Data flows: pages read `public/data/*.json` written by `scripts/*` pipelines — don't hand-edit those files. Timeline lookups go through the helpers, never re-read the JSONs.

## Contact & Resources

- **GitHub**: https://github.com/tinymachines
- **Repo**: https://github.com/isenbek/bradley.io
