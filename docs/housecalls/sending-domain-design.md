---
title: "Sending-domain design"
project: housecalls
status: TRANSPORT LIVE 2026-09-09 (Bridge was already on the box; sending.json wired + SMTP verified); waits on the physical address line + the subdomain identity errand
created: 2026-09-06
---

# The sending domain

The last unbuilt gate before any letter can leave. Designed from two things
learned by probing, not assuming:

1. **cbemail is a bring-your-own-mailbox bridge, not a sending platform.**
   `sessions create` takes an address, a password (app password), and
   IMAP/SMTP servers; `send` and `mailbox` then drive that mailbox from
   Campaign Brain's side. The identity, domain, and reputation are entirely
   ours to build. cbemail is an arm, not an identity.
2. **bradley.io already runs Proton Mail.** Live today: MX to
   mail.protonmail.ch, SPF `include:_spf.protonmail.ch mx ~all`, DMARC
   `p=quarantine`, and a protonmail-verification record. The root domain has
   existing mail reputation and existing protection.

## The identity

**`brad@housecalls.bradley.io`**, display name "Brad Isenbek (House Calls)".

- The address is the disclosure: the domain in the From line IS the page
  that explains the whole operation. A prospect who hovers the sender is
  one click from the ledger.
- A dedicated subdomain keeps the hunt's sending reputation separate from
  the root, where Brad's real mail lives. If the hunt's reputation is ever
  dinged, bradley.io mail is untouched.
- Reply-To: the same address. No noreply anything, ever; replies are the
  entire point.

## Transport: the decision

| | A. Proton (extend what exists) | B. Small mailbox host (Migadu-class) | C. Self-hosted SMTP from home |
| --- | --- | --- | --- |
| Fit | Add housecalls.bradley.io as a domain on the existing Proton account | New account, custom domain, standard IMAP/SMTP | Full doctrine purity |
| Sending IPs | Proton's, well-run | Provider's shared pool, decent | Home IP: AT&T passthrough, no rDNS control, port 25 risk |
| Works with cbemail directly | No: Proton has no plain IMAP/SMTP; needs Proton Bridge (runs on OUR box) or SMTP-submission tokens (plan-dependent) | Yes: plain IMAP/SMTP with an app password | Yes, but nothing will accept our mail |
| Correspondence privacy | Strongest: E2E at rest, and with Bridge the plaintext handling stays on our metal | Provider holds the mailbox; CB session holds the password | Strongest, but moot |
| Cost | Already paying (plan features need checking) | ~$20 to $90 per year | Free and useless |

**Recommendation: A.** Extend the Proton account with the subdomain and send
from our own box through Proton Mail Bridge (a local process that exposes
IMAP/SMTP on localhost). The sending script then lives here, next to the
pipeline, and the correspondence plumbing never leaves the shop except
through Proton. This retires cbemail from the transport role on privacy
grounds: routing Brad's correspondence and mailbox password through a
third-party session is the wrong trade when the letterhead promises
"correspondence is private." cbemail remains the tool if option A's plan
check fails and we land on B.

What A requires Brad to check in his Proton settings (five minutes): plan
supports additional domains or subdomains; Bridge is included (Mail Plus and
up); add housecalls.bradley.io; create the brad@ address; generate the DKIM
records Proton issues per domain.

## DNS (written the day transport is confirmed)

All in BOTH BIND views, both serials bumped, `named-checkzone`, `rndc
reload`, same as every zone edit here. For option A, on
housecalls.bradley.io:

- `MX` at the subdomain, Proton's two MX hosts (Proton shows exact values
  when the domain is added).
- `TXT` SPF: `v=spf1 include:_spf.protonmail.ch -all` (hard fail; this
  subdomain sends only through Proton).
- Three `CNAME` DKIM selectors (protonmail._domainkey etc.), values issued
  by Proton at domain setup.
- `TXT _dmarc.housecalls.bradley.io`: start `v=DMARC1; p=none;
  rua=mailto:brad@housecalls.bradley.io; adkim=s; aspf=s` for two weeks of
  reports, then `p=quarantine`, then `p=reject`. Strict alignment from day
  one: exactly one sender exists, so nothing legitimate can misalign.
- Proton's verification TXT for the subdomain.
- Root stays as it is (already SPF'd and DMARC quarantined); no root
  changes needed.

MTA-STS and TLS-RPT: skipped deliberately at this volume; revisit if the
network ever makes this domain load-bearing.

## Warm-up, sized honestly

This is not bulk mail and must never resemble it. The one-email rule keeps
natural volume near single digits per week, which is below any warm-up
threshold that matters. The discipline that does matter:

- Week one: seed tests only. Send to our own Gmail, Outlook, and Yahoo test
  accounts; verify DKIM=pass, SPF=pass, DMARC aligned in the raw headers;
  run one message through a header-scoring tool; fix everything before a
  real prospect sees anything.
- Cap five outbound per day regardless of pipeline pressure, forever. Speed
  is for replies, not for cold sends.
- Plain text letters, no tracking pixels, no link shorteners, no images.
  We do not measure opens; we are not that kind of operation, and pixels
  hurt both deliverability and the brand.

## The compliance block (in every message, non-negotiable)

The letter templates gain a fixed footer, filled at send time:

1. Brad's physical mailing address ({PHYSICAL_ADDRESS}, still waiting).
2. The disclosure line: drafted by the AI Brad operates, reviewed and
   signed by him, with the housecalls.bradley.io link.
3. The opt-out that matches the doctrine: "Reply 'no' and you will never
   hear from us again. That is binding and we log it." A working reply IS
   the CAN-SPAM opt-out mechanism at this volume, and honoring it within
   ten business days is law; our standard is same hour.

## Suppression, enforced in code

`data/housecalls/suppression.json` (private dir): one entry per address and
per domain-when-they-ask, with date and reason (no, anger, bounce-hard).
Any future send tooling refuses an address on the list before any other
check runs, and the stage ratchet (`closed` is terminal) backs it at the
prospect level. The list only grows; nothing expires off it.

## Reply plumbing

Bridge exposes IMAP locally, so a poller on this box can watch the mailbox
and flag new replies for bucketing per the playbook. Manual first (Brad's
mail client sees the same mailbox); the poller is a later convenience, not a
gate. Bounces surface the same way and get processed same day, per the
playbook.

## The test sequence, in order

1. Brad: Proton plan check, add subdomain, create address, hand me the DKIM
   values and MX targets.
2. Me: DNS in both views; verify from outside (dig against public
   resolvers) and from Proton's domain checker.
3. Bridge installed on this box as a service; a 30-line send script next to
   the pipeline (nodemailer via localhost Bridge), with the suppression
   check and the footer baked in; NOT wired to any automation.
4. Seed tests to our own accounts; headers verified; score checked.
5. Two weeks of DMARC p=none reports while the first real letters await
   signatures; then quarantine.
6. First real send: Brad presses the button on a signed letter to a
   qualified prospect. The ledger entry writes itself the same day.

## Status addendum, 2026-09-09

The transport turned out to already exist: this box runs a headless
Proton Mail Bridge as a user service (the operator's protonapi rig sits
on its IMAP side). `sending.json` is now wired to it, credentials from
the operator's own config, SMTP auth verified against localhost:1025.
The send tool's full gate chain was exercised end to end and refuses on
exactly one thing: the empty physical address. Interim From identity is
the account's own address; the subdomain identity above remains the
target and is a five-minute Proton-settings errand plus one staged DNS
edit. Seed tests (step 4) run the day the address line lands, before
any real letter.

## What this design waits on

Brad: the Proton plan check (or the call to go option B), the physical
address, and the signatures that everything already waited on. Nothing else
blocks; the DNS and the script are an afternoon once the account side
exists.
