---
title: "Local harness plan: DuckDB + Dioxus + a seed phrase"
project: housecalls
status: PLAN, costed; awaits Brad's go + two parked decisions
created: 2026-09-06
---

# The local backend harness

Brad's direction, near-verbatim: a PWA with a resident DuckDB only the
user can read; an optional stash of that database on our server, but
encrypted at rest so it stays their data; a Dioxus harness as the
universal local backend driving as much of the app as possible on the
device, offline; recovery like a crypto wallet, just a code sequence.

This plan turns that into shaped work. The tools shelf (quote pad,
change-order pad) is the proving ground; the harness is kit IP that every
tool, and eventually every House Calls operator's tools, rides.

## Architecture: one Rust core, three shells

The harness is a **headless Rust crate** ("the engine") owning four
things: the store, the crypto, the stash sync, and migrations. It
compiles three ways:

1. **WASM module for the PWA shelf** (now): a thin wasm-bindgen bridge
   lets the existing React tools call it. The tools' UI does not change.
2. **Dioxus app shells** (later): Dioxus 0.7 builds web, desktop, and
   real Android/iOS from one component tree, with WASM bundle splitting
   and hot-patching. When a tool graduates to a store-installable app,
   the engine is already its backend.
3. **Native tests** (always): the same crate runs under plain cargo test,
   so the crypto and store logic get tested at Rust speed, not browser
   speed.

Calling it "the Dioxus harness" names shell 2's future; the engineering
truth is the engine is shell-agnostic, which is what universal means.

## The store: DuckDB, with honest browser facts

- DuckDB-WASM runs about 2MB (variant-dependent). That is real weight
  against the shelf's lightweight feel, so the harness **lazy-loads**:
  every tool keeps working with zero harness (localStorage v1 behavior),
  and the engine loads the first time a user touches history, search, or
  backup. The giveaway stays a giveaway.
- Persistence: OPFS (`opfs://` open, CHECKPOINT discipline,
  `wal_autocheckpoint` tuned) is full-strength on Chrome/Edge only;
  Safari and Firefox fall back to memory. Since tradespeople carry
  iPhones, **the persistence layer is abstracted**: on non-OPFS browsers
  the engine serializes the database and stores the encrypted bytes in
  IndexedDB on every checkpoint. Slower, identical guarantees.
- Schema: per-tool tables (shop, quotes, change_orders, photos as blobs)
  with versioned migrations owned by the engine, one direction only,
  apex-dbrunner style: the engine owns HOW a store opens and migrates;
  each tool owns WHAT is in its tables.

## The crypto: a code sequence, not an account

- First run generates a **12-word seed phrase** (BIP-39 wordlist, since
  the crypto-wallet muscle memory is the entire UX Brad pointed at).
  Shown once, with a print-a-wallet-card sheet (we are good at print
  sheets), and a blunt sentence: lose the words, lose the backup.
- Key derivation: seed phrase through Argon2id to a 256-bit key.
  Encryption: AES-GCM over the serialized database file. The key lives
  in memory for the session; the words are never stored anywhere by us.
- Restore on a new phone: type the words, the engine derives the key,
  pulls the stash, decrypts locally, opens the store. No email, no
  password, no account, which keeps the shelf's no-signup promise intact
  while adding durability.
- The public promise this enables, stated on the page when it ships:
  backup is optional, and when you use it, what leaves your phone is
  ciphertext we cannot read.

## The stash: our metal, zero knowledge

- The server stores an opaque blob plus its hash and a version counter,
  keyed by a **stash id derived from the seed** (hash of a derived public
  key), so the same words find the same stash with no registration.
- v1 seam: a small endpoint on our own hardware (anti-cloud), rate
  limited, quota'd (a few MB per stash), last-write-wins with the
  version counter guarding against a stale phone clobbering a newer
  backup blindly. cbfiles remains the alternate backend behind the same
  interface, provider-seam thinking exactly like the harvest.
- Abuse posture: blobs are small, writes are throttled, ids are
  unguessable, and there is nothing to breach worth having: the entire
  database of stashes is other people's ciphertext.

## What existing tools adopt, and when

Phase 3 migrates the quote and change-order pads' localStorage into the
engine on first activation (their JSON imports cleanly), after which
history ("every quote I wrote this winter"), search, and backup become
real features instead of impossibilities. The fine print on both pages
updates honestly: nothing leaves your phone, unless you choose backup,
and then it leaves encrypted.

## Phases and cost

| Phase | What | Cost |
| --- | --- | --- |
| P0 | Spike: Rust crate skeleton, wasm build, DuckDB opening in the browser, cargo + browser test harness | a day |
| P1 | The engine: store + migrations + seed/KDF/encrypt + serialize/restore, property test: encrypt, stash, restore, byte-identical | 2-3 days |
| P2 | Stash endpoint on our metal + sync protocol + quota/throttle | a day |
| P3 | Shelf adoption: pads migrate, history + backup UI, wallet-card print sheet | a day |
| P4 | Dioxus shells (native mobile builds) | later, on its own order |

## Risks, stated plainly

- **Weight vs feel** is the design tension; lazy-loading is the answer
  and stays a hard rule.
- **Crypto deserves adult review.** The design is deliberately boring
  (BIP-39, Argon2id, AES-GCM, no invented primitives), and before real
  users trust real backups to it, outside eyes read it. Budget that.
- **Seed-phrase honesty**: some users WILL lose the words. The card
  print, the blunt sentence, and a recovery drill in the UI are the
  mitigations; there is no back door, which is the point and must stay
  said out loud.
- **Toolchain**: Rust/wasm-pack lands on this box as new (small) infra.

## The two parked decisions (Brad's)

1. **Where it lives while public**: recommendation, a new public repo
   (working name `housecalls-harness`) since it is kit IP bigger than
   the website; note this leans on the franchise naming decision (D4)
   the same way the template repo does.
2. **Go order and phase budget**: P0 through P3 is roughly a week of
   build; say go, or stage it behind the hunt's outbound work.
