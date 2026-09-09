---
title: "Operator tasks: Brad's board"
project: housecalls
status: LIVING document; the AI updates it, the human burns it down
updated: 2026-09-06
---

# The human's board

Everything in the hunt that waits on Brad, ordered by what it unblocks.
The machine's side is built: 120 selftests green, every lane has a clock
or a watcher, and each item below links to the doc that makes it a
five-minute decision instead of an hour of archaeology.

## Unblocks outbound (the scoreboard's zeros)

- [ ] **ONE LINE UNBLOCKS EVERYTHING: the physical mailing address.**
      2026-09-09 the AI found Proton Bridge already running on this box
      (your protonapi rig), wired `data/housecalls/sending.json` to it,
      and verified SMTP auth. The full send chain now refuses on
      exactly one thing: the empty `physical_address`. Tell the AI the
      line or edit the file; it appears in every letter footer
      (CAN-SPAM). Then seed tests fire before any real letter.
- [ ] **Identity decision (not blocking seed tests):** interim From is
      `isenbek@protonmail.com`. The design's identity is
      `brad@housecalls.bradley.io`: in Proton settings, add the
      subdomain as a custom domain, create `brad@`, hand over the DKIM
      values and MX targets; DNS is a one-edit afternoon (zone files
      staged). If your plan has no free domain slot, say so and we
      pick between an upgrade and an existing bradley.io address.
      → [sending-domain-design.md](sending-domain-design.md)
- [ ] **Sign the four prospect letters** (fill `{SIGNATURE}`, review
      voice): [cloud-exit](pitch-cloud-exit.md) ·
      [legacy-rescue](pitch-legacy-rescue.md) ·
      [hiring-signal](pitch-hiring-signal.md) ·
      [honest-AI](pitch-honest-ai.md). No send happens until a prospect is
      `qualified` AND a letter is signed; the send tool enforces the rest.

## Unblocks the RFP lane

- [ ] **SIGMA VSS vendor registration** (State of Michigan) and
      **BidNet/MITN** (~200 local governments). The register, the daily
      deadline watcher, and the hunt crawl are all armed and idle without
      these accounts.

## Unblocks the story (opportunity 4, the cheapest big lever)

- [ ] **Pick the first outlet and send the story pitch** (recommendation:
      local business press first; the map is their readers' backyard).
      Fill three slots, sign, send from your own address. One at a time,
      one-week exclusive window, ledger logs it.
      → [pitch-story.md](pitch-story.md)

## Unblocks the farm vertical (month one, step 1)

- [x] ~~Review the eighteen farm letters~~ APPROVED all eighteen
      2026-09-09; stages flipped to drafted, timestamped. Twenty
      letters (18 farm + Metal Flow + Roskam) now stand behind ONE
      gate: the Proton check + physical address at the top of this
      board. When that lands, the 5/day cap spreads sends across
      four days, oldest signals (the August 20 cohort) first.
- [ ] **Two one-word calls** from the harvest skips: sawmills in or
      out (Devereaux, S&L Lumber: forestry, serious automation
      signals)? First Catch (private fish processor on tribal land)
      in or out? → [farm-harvest-notes.md](farm-harvest-notes.md)

- [ ] **Deere account errand, ~10 minutes**: create the John Deere
      account (email code lands in your inbox), accept the API
      Development License Agreement (summary in the doc; read it
      first), create the application with the answers already written
      out, and hand the AI the Application Id + Secret. Our side is
      built and tested: callback live, CLI ready, one command then
      proves the API path. Everything to paste is in the recipe.
      → [deere-sandbox.md](deere-sandbox.md)

## Unblocks the pilot / franchise track

- [ ] **Send the Nominate note** (or say skip): one more workspace for the
      pilot, future terms flagged not forced. Since the manual + census
      backends shipped, a no costs us capability we already replaced; the
      ask is purely upside now.
      → [nominate-workspace-ask.md](nominate-workspace-ask.md)
- [ ] **Four extraction decisions** for the template repo: (1) repo home,
      rec: tinymachines org; (2) visibility, rec: public; (3) license,
      rec: none-yet until counsel; (4) the name, noting that naming the
      repo names the brand. Then the extraction is one ordered day.
      → [template-repo-plan.md](template-repo-plan.md)
- [ ] **Pick the pilot** (person, not metro) and decide send timing vs
      Gate 0. The letter, terms memo, support plan, stand-up checklist,
      and both recipe docs are finished and waiting.
      → [pitch-pilot-operator.md](pitch-pilot-operator.md) ·
      [pilot-terms-memo.md](pilot-terms-memo.md) ·
      [pilot-support-plan.md](pilot-support-plan.md)

## Small but real

- [ ] **One coffee at the MiBusiness Registry** (Michigan's entity
      database; it is LARA, not the SOS): five lookups that fill the
      named-contact gap for JR Automation, Behler-Young, and Feyen
      Zylstra, plus legal-name checks before the first letters. The
      errand list and why it is human-only:
      → [mi-business-registry.md](mi-business-registry.md)

- [ ] **Rubric review**: any industries we never pitch, any names to add
      to the conflicts list (they live in
      `lib/housecalls/operator.json`).
      → [qualification-rubric.md](qualification-rubric.md)
- [ ] **Read the reply playbook once** before the first send, so the
      4-working-hour draft SLA is a promise you actually mean.
      → [reply-playbook.md](reply-playbook.md)

## Explicitly NOT on this board

Curating the 18 per-company signal crawls (the AI's job the moment they
land); anything the 120 selftests already guard; and anything above that
suddenly becomes urgent, which the AI will surface rather than let this
list hide it.

## The short version

One five-minute Proton check and one address line unblock the entire
outbound machine. Everything else is strategy at your own pace.
