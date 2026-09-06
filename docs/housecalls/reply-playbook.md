---
title: "Reply-handling playbook"
project: housecalls
status: DRAFT for Brad's review
created: 2026-09-06
---

# When they write back

Every reply lands in exactly one bucket, every bucket has one move, and the
moves never improvise past the doctrine: the AI drafts, Brad signs, no means
no forever, and correspondence is private.

## The privacy correction, first

The front page said prospects stay "a number until they reply," which read as
if replying earns you a public name. Wrong, and fixed: **replying is a private
act.** Correspondence never appears on the ledger or the map with a name
attached. A prospect is named publicly only under the public-fact rule (their
own posting, their own press), by their consent, or in a jointly agreed
announcement after a win. The ledger logs that A reply arrived and its bucket,
never who.

## The buckets

**1. No.** "Not interested," "remove me," or any recognizable no.
Move: stage `closed`, forever, same hour. Send NOTHING back: the P.S. promised
"you will never hear from us again," and a confirmation email is hearing from
us again. Exception: a no that contains a direct question gets the question
answered once, ending with confirmation that they are closed out.
Ledger: "a no arrived; honored, logged, closed forever."

**2. Not now.** Two different animals, split on their words:
- Explicit deferral with a date shape ("try us in Q2", "after the ERP
  go-live"): that is consent to ONE future contact at that time. Log
  `defer_until` on the row, stage stays `replied`, calendar it. The future
  email opens by quoting their own invitation.
- Bare "not now" with no invitation: that is a polite no. Closed forever.

**3. A question.** "How would this work?", "What do you charge?" (they get the
same numbers that are posted), "Is this real?"
Move: draft the answer within 4 working hours, plain voice, no pressure, one
question back at most. Goal is a conversation, not a close. Brad signs and
sends same day.

**4. A yes.** Meeting request or "call me."
Move: fastest bucket in the book. Draft a scheduling reply offering two
concrete times same-day; Brad sends. The AI preps a one-page brief for Brad:
the signal, the letter sent, the public facts on file, the likely
{ONE_BORING_JOB}. Brad takes the meeting personally; the AI never attends,
never speaks for him live.

**5. A referral.** "Talk to Jane in IT."
Move: thank the referrer AND ask permission to use their name in one line
("May I tell Jane you pointed me her way?"). With permission: warm letter to
Jane naming the referrer. Without: Jane gets a normal signal-based letter, no
name dropped. The referrer's thread stays open at `replied`.

**6. Anger or a spam accusation.**
Move: one apology, no argument, no defense of the model. Closed forever, same
as a no. AND logged honestly on the public ledger (anonymized): "someone told
us off; they were right that unsolicited email is unsolicited; closed
forever." The open-hunt brand only works if the misses are logged too.

**7. Autoreply / out-of-office.** Not a reply. Stage does not flip. Note the
return date; nothing re-sends before it, and nothing re-sends after it either
(one email is one email); it only delays a bucket-2 deferral we already had.

**8. Bounce.** Not a reply. Hard bounce: the address is wrong, back to the
contact-discovery queue (the one case where a "second email" is really the
first). Soft bounce twice: same. Mailbox hygiene matters for the sending
domain's reputation, so bounces get processed the day they happen.

## Mechanics

- **Stage flips**: buckets 1-6 flip `contacted` to `replied` (then to `closed`
  or onward as the thread resolves). 7 and 8 flip nothing.
- **SLA**: reply drafted within 4 working hours of arrival; Brad sends same
  working day. Speed is respect, and it is also the best conversion lever we
  own.
- **Disclosure continues**: every reply carries the one-line footer that an AI
  drafted it and a human signed it, same as the letters. The disclosure is the
  brand; it does not stop at message one.
- **SMS**: only if they hand over a number and invite it, and then only for
  logistics ("running 5 late"), never for pitching. (TCPA, and taste.)
- **Detection**: manual for now (Brad's inbox). When cbemail polling lands,
  the pipeline flags new replies and queues draft work; the buckets and moves
  above do not change, only the plumbing that notices.
- **Every bucket writes a ledger entry**, anonymized, same day.

## Reply skeletons (voice-matched, for speed; Brad edits every send)

Bucket 3 (question):
> {FIRST_NAME}, fair question. {ANSWER, two paragraphs max, numbers included.}
> If it is easier to talk it through, I will take 20 minutes whenever suits;
> if not, the whole operation is documented at housecalls.bradley.io.
> (Drafted by the AI I operate; reviewed and signed by me.)

Bucket 4 (yes):
> {FIRST_NAME}, glad to. {TIME_1} or {TIME_2} this week both work; if neither
> does, name one and I will make it fit. Nothing to prepare on your end.
> (Drafted by the AI I operate; reviewed and signed by me.)

Bucket 5 (referral ask):
> Thank you, that is genuinely helpful. May I tell {REFERRAL_NAME} you pointed
> me their way, or would you rather I leave your name out of it?
> (Drafted by the AI I operate; reviewed and signed by me.)

## Out of scope here

What happens after `won` (kickoff, contracting, the jointly-agreed public
announcement) is its own document when we need it. This playbook ends where
the engagement begins.
