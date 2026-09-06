---
title: "Legacy-rescue pitch letter (template)"
project: housecalls
status: DRAFT, awaiting Brad's edit and signature
created: 2026-09-05
---

# The legacy-rescue letter

For the doctrine's first target: the weird, the old, the hard. Aimed at a
company visibly running something aged or strange: a job posting that mentions
VB6, RPG, FoxPro, an AS/400, a twenty-year-old ERP, "our custom system", or a
machine on the floor with its own protocol. One email, personalized in the SLOT
lines, sent by Brad from his own address.

## The slots

- `{FIRST_NAME}`, `{COMPANY}`: obvious.
- `{OBSERVED_SIGNAL}`: the load-bearing line. The specific, public thing that
  told us an old system lives there. If we cannot write it honestly, no send.
  Examples:
  - "Your maintenance posting mentions an AS/400, which tells me something
    important still runs on it."
  - "You are hiring for a system your posting calls 'legacy', which usually
    means the people who understood it are gone."
- `{PHYSICAL_ADDRESS}`: required in the footer by CAN-SPAM.

## Subject lines

1. `The system nobody at {COMPANY} wants to touch`
2. `Old software is not the problem`
3. `We like the projects everyone else turned down`

## The letter

---

{FIRST_NAME},

{OBSERVED_SIGNAL}

I am an engineer in Grand Rapids, and I want to be direct about something most
consultants will not say: I like old systems. The strange protocol, the
twenty-year-old application everyone is afraid to restart, the machine on the
shop floor that speaks its own language. For fun, I keep a transistor-level
simulation of a 1975 microchip running on the public internet. For work, I have
spent fifteen years inside large, old, critical systems for enterprise and
government, including a network of sixty small computers speaking a radio
protocol I wrote myself.

Here is what I have learned in those fifteen years: old software is usually not
the problem. The problem is that nobody left understands it, nothing is written
down, and every vendor who visits says the only cure is to rip it out and buy
theirs. A rewrite is sometimes right. It is recommended far more often than it
is right, because it is what the recommender sells.

My first step is different: I learn your system and write down what it actually
does, so the knowledge stops living in one retiring employee's head. Then you
get options in writing: keep it running safely, connect it to something modern,
or replace it, with honest numbers on each. You choose with the facts in hand.

My rates are public at bradley.io/services: $150 to $275 an hour, projects
$25K to $100K. No surprises is the product.

Full disclosure, because it is the whole point: this letter was drafted by an
AI that I operate, every word was reviewed and signed by me, and the entire
operation is documented in the open at housecalls.bradley.io. We are out to
prove AI can be used for good, at a reasonable price.

If there is a system at {COMPANY} that everyone tiptoes around, I would like to
meet it.

Bradley Isenbek
bradley.io · Grand Rapids, Michigan
{PHYSICAL_ADDRESS}

P.S. If this is not relevant, one reply saying so and you will never hear from
us again. That is a promise, and it is logged.

---

## Claims audit

| Claim | Source |
|---|---|
| 15 years, large/old/critical systems, enterprise + government | resume / site-data.json bio |
| Transistor-level 1975 chip simulation, public | bradley.io/6502, live |
| 60-node network, custom radio protocol | services page: "60-node Pi cluster running custom 802.11" |
| Rates | bradley.io/services, live |

## Rules of engagement

Same as the cloud-exit letter: draft-for-approval, one email per prospect,
no cold SMS ever, dedicated warmed sending subdomain, every step to the
/housecalls ledger with the prospect anonymous until they reply.
