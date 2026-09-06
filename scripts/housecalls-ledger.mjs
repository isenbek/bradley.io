#!/usr/bin/env node
/**
 * House Calls ledger tool. The public ledger's source of truth is
 * public/data/housecalls-ledger.json; the page reads it live, so an entry
 * appears on the site the moment it is written, no deploy.
 *
 *   node scripts/housecalls-ledger.mjs add --kind recon --note "..."
 *   node scripts/housecalls-ledger.mjs sync          recompute counters only
 *   node scripts/housecalls-ledger.mjs drafts 6      set the manual counter
 *   node scripts/housecalls-ledger.mjs --selftest
 *
 * Also imported by the send tool and the reply poller, which append their
 * own entries (anonymized: sector and county at most, never a name; the
 * PII rule applies to the ledger hardest of all).
 *
 * Counters are COMPUTED from machine state, not hand-maintained:
 *   sent    = outbox.json real sends (test sends do not count)
 *   replies = matched replies in buckets 1..6 (autoreplies and bounces are
 *             not replies, per the playbook)
 *   open    = prospects sitting at stage "replied"
 *   won     = prospects at stage "won"
 *   drafts_awaiting = the one manual number (a human judges what counts as
 *             a draft awaiting a human)
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const PRIV = path.join(ROOT, "data", "housecalls")
const LEDGER = path.join(ROOT, "public", "data", "housecalls-ledger.json")

const KINDS = new Set(["mission", "recon", "draft", "build", "outreach", "reply", "won"])
const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fallback)

/** Validate one entry before it may touch the public ledger. */
export function entryProblems(kind, note) {
  const problems = []
  if (!KINDS.has(kind)) problems.push(`unknown kind "${kind}" (${[...KINDS].join(", ")})`)
  if (!note || note.trim().length < 20) problems.push("note under 20 chars; the ledger is not a status bar")
  if (note && note.includes("\u2014")) problems.push("em dash in shipped text")
  if (note && /\{[A-Z_]+\}/.test(note)) problems.push("unfilled slot in note")
  return problems
}

/** Counters from machine state. Pure over the three files' contents. */
export function computeCounters({ outbox, replies, prospects, manual }) {
  const sent = (outbox.sent ?? []).filter((s) => !s.test).length
  const replied = (replies.queue ?? []).filter((r) => r.matched && r.bucket >= 1 && r.bucket <= 6).length
  const rows = Object.values(prospects)
  return {
    sent,
    replies: replied,
    open: rows.filter((p) => p.stage === "replied").length,
    won: rows.filter((p) => p.stage === "won").length,
    drafts_awaiting: manual?.drafts_awaiting ?? 0,
  }
}

/** Append one entry and refresh counters. The one writer everything uses. */
export function appendEntry(kind, note, { date = new Date().toISOString().slice(0, 10) } = {}) {
  const problems = entryProblems(kind, note)
  if (problems.length) throw new Error(`ledger refused: ${problems.join("; ")}`)
  const ledger = readJson(LEDGER, { counters: {}, manual: { drafts_awaiting: 0 }, entries: [] })
  ledger.entries.push({ date, kind, note })
  ledger.counters = computeCounters({
    outbox: readJson(path.join(PRIV, "outbox.json"), { sent: [] }),
    replies: readJson(path.join(PRIV, "replies.json"), { queue: [] }),
    prospects: readJson(path.join(PRIV, "prospects.json"), {}),
    manual: ledger.manual,
  })
  ledger.updated = new Date().toISOString()
  writeFileSync(LEDGER, JSON.stringify(ledger, null, 1) + "\n")
  return ledger.entries.length
}

/** Recompute counters without adding an entry (after any state change). */
export function syncCounters() {
  const ledger = readJson(LEDGER, { counters: {}, manual: { drafts_awaiting: 0 }, entries: [] })
  ledger.counters = computeCounters({
    outbox: readJson(path.join(PRIV, "outbox.json"), { sent: [] }),
    replies: readJson(path.join(PRIV, "replies.json"), { queue: [] }),
    prospects: readJson(path.join(PRIV, "prospects.json"), {}),
    manual: ledger.manual,
  })
  ledger.updated = new Date().toISOString()
  writeFileSync(LEDGER, JSON.stringify(ledger, null, 1) + "\n")
  return ledger.counters
}

// ---------- selftest ----------

function selftest() {
  const cases = [
    ["valid entry passes", entryProblems("build", "A perfectly reasonable ledger note.").length === 0],
    ["unknown kind refuses", entryProblems("vibes", "A perfectly reasonable ledger note.").length === 1],
    ["short note refuses", entryProblems("build", "did stuff").length === 1],
    ["em dash refuses", entryProblems("build", "A note with a stray \u2014 in the middle of it.").length === 1],
    ["unfilled slot refuses", entryProblems("build", "Sent the letter to {COMPANY} this morning, went fine.").length === 1],
  ]
  const counters = computeCounters({
    outbox: { sent: [{ test: true }, { test: false }, {}] },
    replies: { queue: [
      { matched: true, bucket: 3 },
      { matched: true, bucket: 7 },
      { matched: false, bucket: 4 },
      { matched: true, bucket: 1 },
    ] },
    prospects: {
      a: { stage: "replied" }, b: { stage: "replied" }, c: { stage: "won" }, d: { stage: "identified" },
    },
    manual: { drafts_awaiting: 6 },
  })
  cases.push(
    ["test sends do not count", counters.sent === 2],
    ["OOO and unmatched are not replies", counters.replies === 2],
    ["open counts stage replied", counters.open === 2],
    ["won counts stage won", counters.won === 1],
    ["drafts stay manual", counters.drafts_awaiting === 6],
  )
  let ok = true
  for (const [name, pass] of cases) {
    console.log(`${pass ? "PASS" : "FAIL"} ledger: ${name}`)
    ok &&= pass
  }
  process.exit(ok ? 0 : 1)
}

// ---------- CLI ----------

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const [, , cmd] = process.argv
  const arg = (name) => {
    const i = process.argv.indexOf(`--${name}`)
    return i === -1 ? null : process.argv[i + 1]
  }
  if (process.argv.includes("--selftest")) selftest()
  else if (cmd === "add") {
    const n = appendEntry(arg("kind"), arg("note"))
    console.log(`entry ${n} on the ledger; counters synced; live now (no deploy needed)`)
  } else if (cmd === "sync") {
    console.log("counters:", JSON.stringify(syncCounters()))
  } else if (cmd === "drafts") {
    const ledger = readJson(LEDGER, { counters: {}, manual: {}, entries: [] })
    ledger.manual.drafts_awaiting = Number(process.argv[3])
    writeFileSync(LEDGER, JSON.stringify(ledger, null, 1) + "\n")
    console.log("drafts_awaiting =", ledger.manual.drafts_awaiting, "(run sync to refresh counters)")
    syncCounters()
  } else {
    console.error("usage: add --kind <k> --note <n> | sync | drafts <n> | --selftest")
    process.exit(2)
  }
}
