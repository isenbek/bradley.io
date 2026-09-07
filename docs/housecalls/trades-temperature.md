---
title: "Trades temperature report v1"
project: housecalls
status: RESEARCH v2 (digs 2026-09-06 + 2026-09-07, verbatim voices added)
created: 2026-09-06
---

# The temperature of the trades, first reading

Brad's brief: before building free field apps (the electronic tradeshow
giveaway), find out whether the trades are busy, hiring, or tired, learn
their business cycle, and rank what would actually hit. First dig done
2026-09-06; sources at the bottom. A deeper board-reading pass (actual
thread archaeology on r/electricians, ContractorTalk, HVAC-Talk) is the
known next layer; this v1 is the shape of the landscape.

## The temperature: tired AND worried, depending who you ask

The 2026 trades run on a paradox worth understanding before giving them
anything:

- **Employed techs are tired.** Structural shortage everywhere: more
  openings than qualified people in all three big trades, and the
  electrician shortage is being called a life-or-death threat to the data
  center boom. Peak-season HVAC techs log 50 to 60 hour weeks; the
  overtime culture is the complaint, not the exception.
- **Small operators are worried.** Residential demand has declined
  through 2026 with cautious consumers and slowing new-system sales; the
  advice circulating is to lean on service and repair for margin. Solo
  and small-shop threads are about where the leads went (a current Mike
  Holt thread is literally titled around work slowing down and what
  platforms people use to find it).
- **New blood is arriving.** A Gen Z wave is entering the trades, which
  means a cohort that expects tools on the phone and has no loyalty to
  paper or to legacy software.

So a giveaway meets two moods: save the tired ones time, or help the
worried ones win work. The best candidates below do one or the other in
their first thirty seconds of use.

## The business cycle (differs by trade, rhymes everywhere)

- **Summer is the grind**: exterior construction, roofing, paving; HVAC
  cooling season. Long days, max overtime.
- **Winter is the thinking season**: exterior and residential work slow
  from roughly November through March; bid competition peaks because
  fewer jobs are awarded; February is when crews staff up for spring.
  (Michigan winters sharpen all of this, with heating emergencies as the
  HVAC/plumbing counter-cycle.)
- **Implication for the giveaway**: ship in early winter. Slow season
  means phones in hands, bid season means quoting tools are top of mind,
  and a free tool discovered in January is a habit by the spring rush.

## The money mood: subscription fatigue is real and measurable

The field-service SaaS incumbents are hated in exactly the way the House
Calls doctrine predicts: the big platform runs 5 to 10 times the price of
the mid-tier ones, BBB complaints document termination fees from $5K to
nearly $40K, and small shops consistently report paying for features they
never use. "Your technology costs should be going down" is not a slogan
to these readers; it is their software bill.

## Prior art, and the honest lesson in it

The giveaway play already exists: a major FSM vendor ships a free offline
electrical toolkit (conduit bending, wire sizing, voltage drop) as a lead
funnel, and the calculator niche is saturated on the app stores.
Meanwhile the photo-documentation pain has a well-funded subscription
answer (per-user, per-month) whose own marketing admits most contractors
drown in thousands of disorganized photos.

Lesson: do not build calculators, and do not fight the dispatch/CRM moat.
Differentiate on what the funnels cannot copy: **no account, no lead
capture, no subscription, works offline, keeps data on the phone.** A
giveaway that harvests emails is a booth babe; a giveaway that respects
the tradesperson is a brand.

## The shortlist, ranked by would-hit

1. **The truck quote pad.** Line items in, a clean professional quote out
   (print, text, or PDF), prices readable from the street, zero account,
   stored on the phone. Hits the worried mood dead center, lands in bid
   season, and carries the posted-prices ethos into their hands. Small
   build on the existing PWA stack.
2. **The change-order pad.** Scope change + photo + customer signature on
   the phone, one PDF, done. Unpaid change orders are lost money every
   tradesperson has felt; nothing this narrow exists un-bundled from a
   platform. Small build.
3. **The job photo stamper.** Offline PWA: photo in, job label + time +
   location stamped on, zip export by job. The subscription incumbent's
   pain, minus the per-user bill. Medium build.
4. **The material list voice pad.** Talk the list in the truck, get a
   clean printable list. The one candidate with an honest AI angle, which
   makes it a demo of the whole House Calls thesis. Medium build.

Not on the list, deliberately: calculators (saturated), anything with
scheduling or dispatch (the moat fight), anything needing a server-side
account (the differentiator is that there is none).

## Two synergies worth saying out loud

- **Behler-Young, a live prospect, IS an HVAC supply distributor.** The
  physical tradeshow giveaway happens at supply-house counters; a QR card
  at a counter is the paper form of this idea. The hunt and the giveaway
  can shake hands someday, carefully and honestly.
- Every app carries one quiet line: "free, from the people at
  housecalls.bradley.io, where the prices are public." The app is the
  demo, same as the letters.

## What Brad decides next

1. Which candidate ships first (recommendation: the truck quote pad, for
   the winter bid season, target early December).
2. Which trade to court first (recommendation: electricians; biggest
   online community, loudest shortage spotlight).
3. The name on the tin: House Calls branding makes it a network asset per
   the franchise sketch.

## The voices (dig two, 2026-09-07: the boards verbatim)

Read with a real browser across r/electricians, r/HVAC, r/Plumbing, and
r/Construction (top of the month plus targeted thread dives). What the
first dig inferred, the second heard said out loud.

**The villain has a name, and it is not AI; it is AI pointed AT them.**
The incumbent field-service platform is rolling out AI that records
technicians' customer conversations, scores them, and schedules "film
review" of their own calls. The trade's verdict, verbatim and upvoted:
"Ivy League grads and MBAs making products for the trades is the biggest
problem here." "It's literally a product designed by your least favorite
customer." "I would actually quit on the spot." "Coach you to sell...
time to put away the gauges and get a job at a car dealership."
"ServiceTitan is the product. To your boss." A robot patrol dog on a
jobsite drew the same fury: "the wealthy want to keep tabs on the labor,"
and a crew that "almost walked off the job for being asked to use their
phones for risk assessment."

**Implication, now doctrine for the shelf:** the meaningful line is not
free versus paid; it is FOR the person holding the phone versus REPORTING
ON them. Our tools never phone home, and that is not a privacy nicety, it
is the difference between a tool and a supervisor. Say it plainly
wherever the tools are described.

**The quote pad's market, in their words.** Solo plumbers asked exactly
our question ("Solo guys, how are you sending quotes to customers?") and
the honest answers were Word templates, free invoice apps, and this
warning about the incumbents: "jobber and housecall pro are overkill for
what you described and you'll resent paying." Churn threads ("Good Bye
Service Titan": invoices losing line items, "everyone is sick and tired
of it") confirm the money mood from dig one at street level.

**Distribution, settled by what we saw.** Those same ask-for-an-app
threads are visibly polluted with astroturf: founders posting as casual
users, "I know the owners," a comment already removed by moderators. A
House Calls self-post would read as more of the same and deserve the
same. So the shelf does not market itself on the boards, period: supply
house counter cards, word of mouth, and the open-hunt page carry it, and
if it ever appears on a board it is a real person recommending it
unprompted, which pollution makes MORE valuable, not less.

**Kinship worth knowing.** The trades police their own upsellers: in a
thread about a 50-year-old water heater, a self-described sales-shop
plumber wrote "keep this unit until it no longer works. New will just
create issues sooner for the only sake of having new." That is the
legacy-rescue letter's ethic in their voice, and it extends to hardware:
HVAC techs raging at a manufacturer offering buyback credits instead of
stocking parts for six-year-old units. Repair-over-replace is a shared
value, not a pitch we are importing.

**Candidate noted, not promised:** parts-wait misery (three-month parts,
techs driving nine hours) came up unprompted; a parts-chase tracker may
be a future shelf tool if a giveaway-shaped version exists.

## Sources

- Blue Collar Recruits 2026 trade pay/demand comparison; Fortune on the
  electrician shortage vs the data-center boom.
- Mike Holt forums (work-slowdown and lead-platform threads).
- FieldPulse / Projul / Rivetops 2026 FSM pricing comparisons; BBB
  termination-fee complaints as reported there.
- Housecall Pro free Electrical Toolkit page (the prior-art funnel);
  CompanyCam marketing (the photo-pain admission).
- Labor Finders / Knowify / Foundation Software on construction
  seasonality and winter bid season.
