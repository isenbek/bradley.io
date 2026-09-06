---
title: "Template-repo extraction plan"
project: housecalls
status: PLAN awaiting Brad's four decisions; execution is ~a day once decided
created: 2026-09-06
---

# Extracting the kit from bradley.io

Prerequisite 1 of the pilot support plan, and the only one that is a
decision before it is work. Today the kit is tangled inside bradley.io's
repository with Brad's biography, his other instruments, and his deploy
path. A pilot needs a repo they can clone that contains the machine and
nothing personal. This plan makes the untangling mechanical.

## The shape: a standalone runnable site, not a drop-in

**Recommendation: the template is a complete minimal Next.js site** with
the tinymachines style kit vendored, one stub home page, and the full House
Calls instrument mounted, runnable with `bun install && bun run dev` on
clone. The alternative (a drop-in package for an existing Next site) fails
the actual audience: the stand-up checklist already assumes the pilot gets
a site out of this, and most pilots will not have a Next 16 app lying
around. One repo, batteries included, biography sold separately.

## Upstream and drift: the style-kit precedent

The flagship stays the source of truth; the template is a vendored
downstream, exactly like `app/beta/kit/` is vendored from tinymachines
today. Concretely:

- `kit-manifest.json` in bradley.io lists every kit-owned path.
- `scripts/sync-housecalls-kit.sh` copies manifest paths into a template
  working clone, shows the diff, and commits with provenance, mirroring
  `sync-style-kit.sh`. Drift stays visible instead of silent.
- Kit changes land in bradley.io first (the flagship is where they get
  proven), then sync outward. "The second operator's problems are the
  kit's bugs" already forces this direction of flow.

## The manifest, drafted

**Goes to the template (genericized where marked):**

| Path | Notes |
| --- | --- |
| `app/housecalls/{page,plain,network}` | copy genericized: {OPERATOR} slots + TODO markers keyed to checklist phase 4 |
| `app/housecalls/*/opengraph-image.tsx` + `lib/og-card-v3.tsx` | works as-is |
| `components/housecalls/*` | as-is (already config-driven) |
| `lib/housecalls/operator.json` | ships as `operator.example.json`; real one is the pilot's first edit |
| `lib/housecalls/fixtures.json` | NOT shipped; generated per territory |
| `scripts/housecalls-*.mjs` (harvest, send, replies, ledger, rfp-watch, fixtures, signal-crawls) | as-is |
| `scripts/vendor-census-counties.sh` | as-is (config-driven) |
| `housecalls-rfp.{service,timer}` | user/paths templated |
| `docs/housecalls/` KIT docs | rubric, reply playbook, the 4 letter templates, operator-config, stand-up checklist, subdomain recipe, tile recipe, sending-domain design, letter-ammo (structure only, their citations are theirs) |
| `public/data/` seeds | empty ledger (one mission-entry slot), empty map/pins/rig; counties regenerated |
| `data/housecalls/` | .gitignore + empty suppression register + platform.json.example |
| minimal site scaffold | kit CSS (resynced from tinymachines), minimal KitShell/nav, stub home, `deploy.sh` with SERVICE/PORT variables at top, package.json with `bun run selftest` running all six suites |

**Stays in bradley.io (flagship-only):**
everything else on the site; the batch import scripts (preserved history);
the FLAGSHIP business docs: franchise sketch, pilot pitch letter, pilot
terms memo, support plan, this plan; the live ledger with its entries; the
flagship's operator.json, fixtures, and data.

## The four decisions (Brad's, before the day of work)

1. **Where it lives.** `isenbek/housecalls-kit` or under the tinymachines
   org. Recommendation: tinymachines, since the style kit it vendors
   already lives there and the network page can link it as shared
   infrastructure rather than one person's repo.
2. **Visibility.** Recommendation: public. The hunt runs in the open, the
   doctrine docs are already in a public repo, and a pilot pitch that
   says "read the code first" is on brand.
3. **License.** The sharp one. An OSS license means anyone can run the
   method without the network, which is either the brand spreading or the
   product leaking depending on the future money design. Recommendation:
   public but NO license file initially (source-visible, all rights
   reserved by default), revisit with counsel at the money conversation,
   which term 12 of the pilot memo already schedules. Do not pick MIT
   casually on extraction day.
4. **The template's name on the tin.** `housecalls-kit` assumes decision
   1 from the franchise sketch (House Calls is the franchisable name).
   Confirming the kit's repo name effectively confirms the brand name;
   say so out loud before pushing the button.

## Execution, once decided (~a day)

1. Scaffold the minimal site; resync style kit from tinymachines (2h).
2. Copy manifest paths; genericize the three pages and the unit files;
   write `operator.example.json` + `platform.json.example` (3h).
3. Generalize `deploy.sh`; add the `selftest` package script (1h).
4. **Acceptance test, the part that makes it real:** on a clean checkout,
   configure a NON-Michigan state (Ohio), run the vendor script, the
   fixture generator, and all six selftest suites with a dummy
   `platform.json` (the config selftest only checks shape, `ws_template`
   passes). Green suite on a second state proves the extraction; the
   config-driven work from this week was building exactly this moment
   (2h).
5. Write `kit-manifest.json` + `sync-housecalls-kit.sh` in bradley.io;
   first sync is the initial template commit (1h).

## What this plan does not do

It does not move anything today. It waits for the four decisions, then the
day. And it does not solve prerequisite 2 (the Nominate workspace answer);
a pilot with a perfect template and no workspace still cannot harvest.
