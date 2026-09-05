---
title: "Cloud-exit pitch letter (template)"
project: housecalls
status: DRAFT, awaiting Brad's edit and signature
created: 2026-09-05
---

# The cloud-exit letter

The first outreach template for the House Calls hunt. One email per prospect,
personalized in the two SLOT lines, sent by Brad from his own address. Nothing in
this file gets sent verbatim by anyone but him.

## The slots

- `{FIRST_NAME}`, `{COMPANY}`: obvious.
- `{OBSERVED_SIGNAL}`: **the load-bearing line.** One sentence naming the specific,
  public thing that made us write THIS company. A job posting, a press mention, a
  tech-stack fingerprint. If we cannot write this line honestly, we do not send
  the email. Examples:
  - "Your team is hiring a senior data engineer, which usually means a pipeline is hurting."
  - "You mentioned cloud costs in your Q2 shareholder letter, and I read those."
- `{PHYSICAL_ADDRESS}`: required in the footer by CAN-SPAM. Brad supplies a
  business mailing address (a PO box is fine) before the first send.

## Subject lines (pick per target, test over time)

1. `The cloud bill math, run for {COMPANY}`
2. `Your workloads could run on hardware you own`
3. `A plumber for {COMPANY}'s data`

## The letter

---

{FIRST_NAME},

{OBSERVED_SIGNAL}

I am a data engineer in Grand Rapids. For fifteen years I have built the systems
behind billions of records for enterprise and government: a messaging platform
that holds 99.9% uptime across millions of messages, a data platform that
integrated 4.9 billion data points from more than 10,000 sources. These days I
run every one of my own workloads on hardware I own, and I think {COMPANY} might
benefit from the same math.

Companies that moved predictable workloads off the public cloud in the last two
years report infrastructure savings of 30 to 60 percent, and not just startups:
GEICO cut compute cost per core in half, and 37signals banked about ten million
dollars over five years. The trick is knowing which workloads to move and which
to leave where they are. That is a plumbing job, not a moonshot.

Here is what an engagement looks like. I look at your workloads and your bill,
then tell you in writing what should move, what should stay, and what it costs,
with the numbers shown. If nothing should move, I tell you that too, and the
conversation cost you one meeting. My rates are public at bradley.io/services:
$150 to $275 an hour, projects $25K to $100K. No surprises is the product.

Full disclosure, because it is the whole point: this letter was drafted by an AI
that I operate, every word of it was reviewed and signed by me, and the entire
operation is documented in the open at housecalls.bradley.io. We are out to
prove AI can be used for good, at a reasonable price.

If the cloud bill has been on your mind, reply and I will bring the wrench.

Bradley Isenbek
bradley.io · Grand Rapids, Michigan
{PHYSICAL_ADDRESS}

P.S. If this is not relevant, one reply saying so and you will never hear from
us again. That is a promise, and it is logged.

---

## Rules of engagement (from the doctrine)

- Draft-for-approval: Brad reads, edits, signs, sends. The AI never sends.
- One email per prospect. A no, or silence after one follow-up window Brad sets,
  closes the thread forever.
- No cold SMS, ever (TCPA). SMS is only for people who gave us a number.
- Send from a dedicated subdomain (not bradley.io root) with SPF/DKIM/DMARC,
  warmed up slowly, low daily volume.
- Every send, reply, and outcome gets a ledger entry on /housecalls, with the
  prospect anonymized until they reply.

## Claims audit (every number has a source)

| Claim | Source |
|---|---|
| 15 years, billions of records, government/enterprise | Brad's resume / site-data.json bio |
| 99.9% uptime messaging platform, millions of messages | resume, 2022-present role |
| 4.9B data points, 10,000+ sources | resume, 2018-2022 role |
| 30-60% savings range | 2026 repatriation coverage (Hivelocity, Northflank, byteiota roundups) |
| GEICO 50% per-core, 37signals ~$10M/5yr | same coverage; both companies have discussed this publicly |
| Rates | bradley.io/services, live |
