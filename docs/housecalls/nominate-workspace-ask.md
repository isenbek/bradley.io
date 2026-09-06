---
title: "The Nominate workspace ask"
project: housecalls
status: DRAFT awaiting Brad's edit and send (prerequisite 2 of the pilot plan)
created: 2026-09-06
---

# The Campaign Brain conversation

Prerequisite 2, the one only Brad can have. The pilot support plan wants
the answer "in writing, even if the writing is one text message." This doc
is the brief plus a sendable draft, sized for the relationship: a note
between people who already build together, not a vendor negotiation.

## The brief (for Brad, not for sending)

**What we use today:** one workspace on cbintel for the flagship's harvest.
Volume so far: 22 crawl jobs in two days, plus cbgeo lookups that cache
forever. This is rounding-error load, and presumably already blessed since
the access exists.

**What the pilot needs:** one more workspace, same shape, same
rounding-error volume, operated by a person Nominate has never met, under
Brad's vouching. That last clause is the actual ask: it is not more
compute, it is extending trust to a third party.

**What the future might need (flag now, decide later):** if the network
grows past the pilot, either per-operator workspaces under some real
arrangement (billing, caps, terms), or House Calls builds its pluggable
harvest seam and CB becomes one backend among possible others. Naming this
now prevents the awkward version of the conversation later.

**What Nominate gets:** housecalls.bradley.io is a public, working,
documented showcase of the platform doing real commercial discovery, with
the pipeline code visible and the rig telemetry live on the page. If the
kit ever ships to more operators, CB is its native harvest backend, with
whatever commercial arrangement makes sense negotiated when there is
something real to negotiate over.

**The fallback, held honestly:** if the answer is no or not-now, the kit
grows a harvest interface and the pilot leans on manual curation plus
public sources at stand-up. Slower, no hard feelings, and the ask should
say so, because a pressure-free ask between friends gets an honest answer.

## The draft (Brad's voice, edit freely)

Subject: House Calls + a second workspace, five-minute ask

{RECIPIENT},

Quick one about Campaign Brain. You may have seen what I have been running
at housecalls.bradley.io: my own business development, in the open, with
the harvest riding a cbintel workspace. Volume is tiny (twenty-some crawl
jobs in two days) and it has behaved itself in the shared queue.

It is working well enough that I am going to hand the same machine to one
trusted engineer in another city as a pilot. For that I need one thing and
want to flag a second:

1. A second workspace, same shape as mine, for the pilot. Same
   rounding-error volume. They operate it; I vouch for them; if that vouch
   ever feels wrong to you, pull it and I will back you.

2. Flagging only, no answer needed now: if this ever grows past one pilot,
   we should design the real arrangement (billing, caps, whatever makes
   sense) before it matters. I am not asking for free rides at scale; I am
   asking for one workspace now and an honest conversation later.

If the answer is no or not-now, genuinely fine: the kit will grow a
pluggable harvest layer anyway, and the pilot can start slower without CB.
But CB is the native fit, the hunt page is a live public demo of your
platform doing real work, and I would rather build with it than around it.

A one-line yes on the workspace is all I need in writing.

{SIGNATURE}

P.S. Drafted by the AI I run, like everything on that page; reviewed and
sent by me.

## After the answer

- **Yes:** get the workspace id, the pilot puts it in their private
  platform.json on day one, and the support plan's prerequisite 2 closes.
- **Not-now:** the harvest-seam abstraction moves from "future" to "before
  the pilot weekend" on the kit's work list, and the stand-up checklist's
  phase 0 line about platform access gets rewritten honestly.
- Either way, the answer lands in this doc under a dated heading, because
  the plan asked for it in writing.
