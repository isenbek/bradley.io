---
title: "Qualification rubric: the identified-to-qualified gate"
project: housecalls
status: DRAFT for Brad's review
created: 2026-09-06
rubric_version: 1
---

# When does a harvested prospect become qualified?

The stage enum (maps-plan.md) says qualified means "a human-checkable signal
exists (the OBSERVED_SIGNAL test)." This rubric makes that operational: four
gates, all binary, all must pass; then a priority score that orders the
qualified pile but never gates it. The AI applies the rubric and records its
work on the prospect row; Brad audits rather than re-derives.

## The four gates (all must pass)

**G1. The signal test.** One specific, public, honestly-citable fact that makes
THIS company worth writing to, captured with its URL and date. The test is
literal: can we write the letter's {OBSERVED_SIGNAL} line without stretching?
If not, the prospect stays identified. Signal categories, one per letter:

| category | example signal | letter |
|---|---|---|
| cloud | public statement about cloud costs, repatriation, or infra spend | pitch-cloud-exit |
| legacy | old tech named in a posting or the press (AS/400, VB6, "our custom system", 20-year-old ERP) | pitch-legacy-rescue |
| hiring | live posting for a data/AI/platform role | pitch-hiring-signal |
| ai | public AI initiative, AI role open 90+ days, or a visibly dead pilot | pitch-honest-ai |

**G2. A problem we sell.** The signal maps to one of the four letters. A
company that is interesting but has no letter is a watchlist row, not a
qualified prospect.

**G3. A reachable human.** A named person in a relevant seat, with a working
email found or plausibly findable. No person yet: the prospect goes to the
contact-discovery queue and stays identified. (We write to people, not to
info@ addresses.)

**G4. The fit floor.** The engagement could plausibly clear $10K (the bottom
of the posted project range is $25K; hourly makes small starts possible).
Sole proprietors and micro-shops fail the floor unless their signal is
extraordinary. OPEN for Brad: any industries we decline outright.

## Hard disqualifiers (override everything)

- **`closed` on file.** No means no, forever. A re-harvested closed prospect
  is discarded at extraction, not re-argued here.
- **Conflicts.** The Grand Rapids AI consulting field (Augusto, Opinosis,
  licens.io, Senna) and any current Nominate/CB client relationship. OPEN for
  Brad: anything else that belongs on this list.
- **Government entities.** Not disqualified, REROUTED: public bodies buy
  through procurement (SIGMA VSS / BidNet), and cold-emailing around an open
  solicitation can disqualify a future bid. They get a `gov` flag and live in
  the RFP lane, never the cold-email lane.
- **Stale signal.** A signal older than 90 days fails G1; the prospect drops
  back to identified until a fresh signal appears.

## Priority score (orders the pile, never gates)

Start at 0; the score decides who gets the next letter drafted, nothing else.

| points | for | why |
|---|---|---|
| +3 | weird, old, or challenging (legacy category, strange stack, "nobody will touch it") | the doctrine's stated preference |
| +2 | cloud-exit signal | the flagship lane nobody local owns |
| +2 | West Michigan / Kent County | on-site possible, local-first doctrine |
| +1 | posted demand (they are already spending on the problem) | highest close rate |
| +1 | signal fresher than 30 days | strike while it hurts |
| +1 | warm path (mutual contact, prior thread, they follow the site) | reply rate |

Ties break toward the older signal (first found, first served).

## Who flips the stage

- **The AI qualifies autonomously** when all four gates are machine-checkable,
  and writes a `rubric` object on the private prospect row: signal text, URL,
  seen date, category, score, per-gate results, `rubric_version`. Qualification
  is internal and pre-outreach; the audit trail makes it cheap to reverse.
- **Brad's gates stay Brad's**: `drafted` requires a letter that exists;
  `contacted` requires that Brad actually sent it. Nothing in this rubric
  touches those.
- A spot-check that finds a bad qualification demotes the row AND patches the
  rubric (bump `rubric_version`, note the case), so the same mistake cannot
  recur silently.

## Worked example (from day-one recon)

Steelcase: G1 pass (live "Data Analytics Engineer" posting, URL + date on
file; category: hiring). G2 pass (pitch-hiring-signal). G3 pending (need the
hiring manager, not HR; contact-discovery queue). G4 pass. No disqualifiers.
Score: +2 local, +1 posted demand, +1 fresh = 4. Verdict: qualified the moment
G3 resolves, and the letter is already drafted.

## Open for Brad

1. Industry exclusions for G4/conflicts (gambling? MLM? crypto? none?).
2. Anything to add to the conflicts list.
3. Comfort level with autonomous qualification as scoped above, or prefer
   every stage flip on your desk to start.
