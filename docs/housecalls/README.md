---
title: "House Calls docs: start here"
project: housecalls
status: the map of the doc tree, for humans
updated: 2026-09-06
---

# Start here

This folder is the paperwork of the hunt at housecalls.bradley.io: an AI
runs business development in the open, a human signs everything, and every
plan, letter, rule, and recipe lands here as a file. Twenty-three of them
now, so this page is the map. Pick yourself below.

**The complete, always-current index lives at
[housecalls.bradley.io/housecalls/docs](https://bradley.io/housecalls/docs):**
it derives from every file's front matter at build time, so it cannot go
stale the way a hand-written map can. This README is the narrative
version, organized by who is reading.

## You want the whole thing at a glance

Three synthesis docs, written on day three:
[summary.md](summary.md) (what got built),
[elevator-pitch.md](elevator-pitch.md) (the words, four listeners),
[opportunities.md](opportunities.md) (seven levers, ranked by nearness of
money).

## You are Brad, deciding what to do next

Read exactly one file: **[operator-tasks.md](operator-tasks.md)**. It is
your board, kept current, everything that waits on you and nothing that
does not. The short version has never changed: one five-minute mailbox
check and one address line unblock all of outbound.

## You are Brad, about to sign something

- The four prospect letters, with their slots and claims audits:
  [pitch-cloud-exit.md](pitch-cloud-exit.md) ·
  [pitch-legacy-rescue.md](pitch-legacy-rescue.md) ·
  [pitch-hiring-signal.md](pitch-hiring-signal.md) ·
  [pitch-honest-ai.md](pitch-honest-ai.md)
- Filled drafts with real names live in the PRIVATE dir
  (`data/housecalls/letters/`), never here. Correspondence is private;
  this folder is public.
- Before the first send ever, read
  [reply-playbook.md](reply-playbook.md) once, so the four-hour reply
  promise is one you mean.

## You are new here and want to understand the operation

1. The site itself is the front door: housecalls.bradley.io, and its
   plain-English page if you do not speak computer.
2. [qualification-rubric.md](qualification-rubric.md): how a company on a
   map becomes someone we may write to, and the gates that stop us.
3. [reply-playbook.md](reply-playbook.md): what happens when anyone
   writes back, including the promise that a no is forever.
4. [sending-domain-design.md](sending-domain-design.md): how mail will
   actually leave, and why it does not yet.

## You are a future operator (or just kit-curious)

The machine is designed to be run by someone who is not Brad, in a city
that is not Grand Rapids. In stand-up order:

1. [operator-standup.md](operator-standup.md): the weekend, phase by
   phase, with every trap the flagship hit marked in place.
2. [operator-config.md](operator-config.md): the two config files that
   make the machine yours, and what is deliberately not configurable.
3. [subdomain-recipe.md](subdomain-recipe.md) and
   [tile-recipe.md](tile-recipe.md): the two infrastructure afternoons,
   written from the running system.
4. [cbcli-fleet-usage.md](cbcli-fleet-usage.md) and
   [harvest-seam-plan.md](harvest-seam-plan.md): the harvest platform as
   actually measured, and the seam that makes it optional.

## You care about the farm vertical (priority one since 2026-09-08)

[farm-harvest-notes.md](farm-harvest-notes.md) is the record of the
statewide intake (30 MDARD-grant prospects, the contact dig, and what
was refused and why); [pitch-farm-grant.md](pitch-farm-grant.md) is the
approved letter template; [deere-sandbox.md](deere-sandbox.md) is the
Deere API errand and recipe. The strategy doc lives in the container
repo: [isenbek/housecalls](https://github.com/isenbek/housecalls),
docs/FARM-VERTICAL.md and docs/DEERE.md.

## You are interested in the bigger idea

- [franchise-sketch.md](franchise-sketch.md): Mr. Rooter for the AI
  trade, and the honest gate in front of it (win first).
- [pitch-pilot-operator.md](pitch-pilot-operator.md),
  [pilot-terms-memo.md](pilot-terms-memo.md),
  [pilot-support-plan.md](pilot-support-plan.md): the letter to the first
  pilot, the one-page handshake, and what supporting their weekend means.
- [template-repo-plan.md](template-repo-plan.md): how the kit leaves this
  website, pending four decisions.
- [nominate-workspace-ask.md](nominate-workspace-ask.md): the one
  platform conversation, drafted and waiting.

## The engineering papers (reference)

[maps-plan.md](maps-plan.md) and [p2-pin-schema.md](p2-pin-schema.md)
designed the territory map and its pins; [letter-ammo.md](letter-ammo.md)
is the bank of citable numbers letters may use, each with a source and a
date, plus the standing rule that an aggregator count is never a signal.

## How to read anything here

Every file carries front matter with a status line: DRAFT means it waits
on a human, PLAN means it is costed but not built, kit documentation means
it ships with the machine. The ledger on the public page is the timeline;
these files are the depth. When they disagree, the ledger is newer and
this folder gets corrected, in a commit you can read.
