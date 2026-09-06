---
title: "Pilot stand-up support plan"
project: housecalls
status: PLAN for Brad's review; activates if a pilot says yes
created: 2026-09-06
---

# Supporting the pilot's stand-up

The pitch letter promises "me, on call, for the stand-up" and the terms memo
makes it term 2. This is what that promise means in hours and deliverables,
plus the honest list of what the flagship must build BEFORE a pilot's day
one. Friend-grade and best-effort by design; anything that needs an SLA
needs the future money conversation instead.

## The boundary that shapes everything

**The flagship never holds credentials to the pilot's machine.** Support is
pairing (a call, a screen share, a shared terminal the pilot drives), never
administration. This is the terms memo's data-stays-home and
each-signs-for-their-own-machine terms wearing work clothes: if Brad can log
into it, the pilot does not fully own it, and both promises crack. The same
line the other way: the pilot's Claude runs the pilot's machine; the
flagship's Claude advises through the humans, never operates cross-machine.

## Before day one: the flagship's prerequisites

These are OUR work items, and the pilot cannot start until they exist.
Ordered by weight:

1. **The template repo decision.** Today the kit lives inside bradley.io's
   own repository, tangled with Brad's biography, his instruments, and his
   deploy path. A pilot needs either (a) a clean `housecalls-kit` template
   repo (the real answer, a day of extraction) or (b) a documented
   fork-and-delete list (the fast answer, error-prone). Decide before
   inviting anyone.
2. **The Campaign Brain workspace answer**, from Nominate, in writing even
   if the writing is one text message. Flagged in the pitch letter and the
   terms memo both; without it the harvest half of the kit is decorative.
3. **A selftest fixture generator.** The pipeline's county fixtures are
   Michigan coordinates today; the stand-up checklist tells the pilot to
   regenerate them but no tool exists. Small script: take three
   known-county coordinates for the new state plus one open-water point,
   emit the fixture block.
4. **The subdomain recipe, written down.** DNS both views, nginx with a
   real ACME location, certbot webroot, the local /etc/hosts pin for
   loopback tile servers. The flagship has done it five times and it lives
   in one head and one memory file; it belongs in the kit's docs.
5. **The tile recipe.** How the flagship's region tiles are actually
   served, and the honest options for a pilot (self-host their region the
   same way, or a documented interim). This is the checklist's "plan an
   evening" step; the plan should exist before their evening does.

## The weekend itself

- **Kickoff, 60 minutes, before anything is typed.** Walk the stand-up
  checklist end to end, confirm phase 0 is truly done, agree the order and
  the windows. The pilot shares their screen; they drive everything.
- **On-call windows, not continuous presence.** Two agreed blocks per day
  (one morning, one evening, an hour each) where Brad is reachable live;
  async in between with a same-day answer. A weekend has enough hours for
  this twice over; a stand-up that needs more than that is telling us
  something about the kit, and that finding goes in the log.
- **Who does what:** the pilot types, the flagship navigates. Every fix
  discovered lands as a kit change or a checklist edit the same weekend,
  not a verbal workaround. The rule of the whole exercise: **the second
  operator's problems are the kit's bugs.**
- **The stuck protocol:** fifteen minutes stuck alone, then ask; thirty
  minutes stuck together, then park it and move on (the checklist is
  ordered so nothing blocks on a later step); anything parked gets a named
  owner before the weekend ends.

## After the weekend: the first thirty days

- **First-harvest review, within the first week.** Their map lit, their
  rig honest, their raw results read together once so the curation
  discipline transfers (signals need sources; aggregator counts are banned;
  the rubric is not a suggestion).
- **A weekly call, thirty minutes, four weeks.** Standing agenda: what
  broke, what confused, what the ledger says, what goes back into the kit.
  After four weeks it drops to as-needed, because a pilot that still needs
  weekly support at day thirty is a kit finding too.
- **Learnings flow back per the memo:** every fix is a commit with credit.
  The pilot's name in the kit history is the currency of a free pilot.
- **The first-send gate is theirs alone.** The flagship reviews nothing
  outbound and signs nothing; phase 7 of the checklist runs on their side
  with their signature. We will happily be their seed-test recipient.

## What support is not

Not running their machine, not writing their biography, not signing or
reviewing their outbound, not holding their keys, not their compliance
counsel, and not forever: this plan covers one pilot through thirty days,
then we design whatever comes next from what the log says actually
happened.

## Activation

This plan activates when a pilot countersigns the terms memo. Between now
and then, prerequisites 1 through 5 are buildable at any time; 3, 4, and 5
are afternoons, 1 is a day, and 2 is a conversation only Brad can have.
