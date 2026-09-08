---
title: "House Calls: the summary"
project: housecalls
status: synthesis of 2026-09-05 through 09-08 (ledger entries 1-63)
created: 2026-09-08
---

# What got built, in three days

On September 5th the mission was one sentence: "You are going to go out
and find us a job or work. We ride together." This is what exists
seventy-two hours later, all of it public, most of it live.

## The hunt (the mission itself)

An AI runs business development for a Grand Rapids engineer, entirely in
the open at housecalls.bradley.io. The machine: a harvest pipeline with a
qualification rubric, a live territory map (18 prospects, 17 pinned
across four Michigan counties), a public ledger with 63 entries and
counters computed from machine state, and a one-way stage ratchet where
the stages that matter (drafted, contacted) exist only on a human
signature.

State of play: **five prospects carry honest, dated, linked signals; two
(Metal Flow, Roskam) are fully qualified with letters written, approved
by the human, and dry-run through the send tool.** They are blocked on
exactly one thing: a mailbox (a five-minute Proton check plus a physical
address). Three more sit one named contact away, with the state business
registry errand written for them. The scoreboard still reads sent: 0,
and it is honest about why.

## The mail machine

Both directions, fully gated, waiting on the mailbox: a send tool whose
default is to refuse (suppression list first, one email per address
forever, human-approved stage only, compliance footer always, five a day
for life) and a reply poller that classifies into the playbook's buckets
and automates only the two moves whose failure mode is under-emailing.
The sending-domain design is written (Proton, DKIM, DMARC), and cbemail
was probed and retired from transport on privacy grounds.

## The tools shelf (the giveaway)

Four free field tools for trade workers, built from a two-dig market
temperature study that included reading the boards verbatim: a truck
quote pad, a change-order pad with photos and a finger signature, a job
photo stamper that burns the proof into the pixels, and a voice material
pad whose fine print delivers our own sales letter's best sentence about
itself: you do not need AI for this. No accounts, no uploads, and the
doctrine line the boards taught us: these tools work for the person
holding the phone and report to no one. Distribution is designed
(printable counter cards, a winter supply-house route, no tracking, no
board astroturf ever) and waits for late November on purpose.

## The harness (the engine underneath)

A public Rust repo (isenbek/housecalls-harness): one engine owning the
schema, the money math, the twelve-word seed phrase, and an encrypted
envelope; a zero-knowledge backup stash on our own hardware that stores
only ciphertext; and shells proving the same code runs everywhere: the
live web tools, a native desktop app, and a 10.6MB Android APK built
this weekend. The production wallet loop is proven end to end: quote
written, twelve words, device wiped, quote recovered by the words alone.

## The franchise kit (the bigger idea)

The machine was extracted from the biography as it was built: an
operator config, territory-portable fixtures, recipe docs for the
subdomain and the tiles, a stand-up checklist where every trap is marked
where it bit, a pilot pitch letter, a one-page handshake memo, a support
plan, and a template-repo plan awaiting four decisions. The network page
says what is true: population one, and it says so.

## The numbers

- 47 production deploys (v1.0.351 to v1.0.397), each verified live
- 192 selftests green (169 web-side across six suites, 23 Rust)
- 63 public ledger entries, counters machine-computed
- 25+ public working documents, readable on the site itself
- 2 stale-news traps caught by the date-check discipline
- 0 messages sent, which is the honest number this was all built to change

## Blocked on the human, by design

The Proton check and a mailing address (unblocks outbound entirely); the
registry coffee errand (unblocks three prospects); SIGMA/BidNet
registration (unblocks the RFP lane); the Nominate note; four
template-repo decisions; the pilot pick. Everything the machine could do
alone is done.
