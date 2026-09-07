---
title: "Truck quote pad: build plan"
project: housecalls
status: BUILDING (v1 surface, incubator pattern); two promotion decisions parked for Brad
created: 2026-09-06
---

# The truck quote pad

First giveaway from the trades-temperature shortlist: line items in, a
professional quote out, on a phone, in a truck, free. This plan records how
it gets built and why it starts where it starts.

## The prior art, and what it taught

Brad pointed at Nominate-AI/cbapex: a thirteen-app family with a vendored
kit (auth, mesh, health, feedback, PWA plumbing), one fleet-credential
holder (`server/mesh.ts`), per-app theming with measured color separation,
a components zoo, and a documented app-spawner
(`cbtemplates/create.sh apex ...`). Two of its lessons govern this build:

1. **The incubator doctrine, followed to the letter.** The family's own
   APP-PROMOTION doc says surfaces start INSIDE an existing app and
   graduate to their own repo, port, and host when they earn it, and the
   promotion doc's first line of real work is "carry the surface, it moves
   essentially verbatim." So the pad starts as a surface on
   housecalls.bradley.io (public repo, public build, zero new infra), and
   graduation is a later, documented, one-evening move.
2. **Operator decisions come first, so they are parked, not guessed.**
   Promotion needs a name (the cb* convention would suggest something like
   cbquote, but naming names the brand) and a host (housecalls-flavored vs
   campaignbrain.dev family). Both queued on Brad's board; neither blocks
   the surface.

## Fleet leverage map (what the mesh adds, when)

v1 deliberately calls NOTHING at runtime: the giveaway differentiator from
the temperature report is no account, no lead capture, offline, data stays
on the phone. The fleet earns its way in at v2+, each behind the same
seam thinking as the harvest:

| Fleet piece | What it would add | When |
| --- | --- | --- |
| cbfiles | "send a link" quotes (shareable hosted copy) | v2, opt-in per quote |
| cbapex kit frame | the family shell, if/when promoted | at graduation |
| cbauth/cbonboard | only if a pro ever WANTS sync across devices | v3, never required |
| mesh services | template/price-book sync for House Calls network operators | franchise-era |

## v1 scope (this build)

Route: `/housecalls/tools/quote` on the existing site (PWA already:
installable, service worker, offline). One client component, localStorage
only, kit styling.

**The shop block** (saved once, on the phone): business name, phone,
email, city, license number, insured line, default deposit percent,
default valid-for days, standard terms line. Research says license numbers
are legally required on bids in AZ/FL/OR and expected everywhere.

**The quote**: customer, job address, scope, line items (description,
qty, unit price, auto-extended), exclusions, notes, deposit percent,
valid-until (defaults today + 14). Totals compute live.

**Out the door**: print (browser print = PDF, print CSS hides the site
chrome), copy-as-text for texting it, Web Share where the phone offers it.

**The promise, printed on the page**: free, no account, no signup,
nothing leaves your phone. From the people at housecalls.bradley.io,
where the prices are public.

## Not in v1

Saved quote history (v1.1, still local), share links (v2, cbfiles), any
server anything, any AI anything (the material-list voice pad is the AI
candidate, deliberately a different app).

## Verification

Selftests for the money math (module-level pure functions), Playwright at
390px, print output eyeballed, em-dash zeroes, and the standing rule:
deploy and check the live page.
