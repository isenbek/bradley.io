#!/usr/bin/env node
/**
 * House Calls send tool (docs/housecalls/sending-domain-design.md).
 *
 * THE HUMAN'S BUTTON. Never wired to automation: Claude drafts, Brad runs
 * this, and the default is a dry run that prints the exact message and every
 * gate's verdict. Nothing transmits without --send.
 *
 *   node scripts/housecalls-send.mjs --to a@b.com --subject "..." \
 *        --letter docs/housecalls/out/acme.txt --prospect <id> [--send]
 *   node scripts/housecalls-send.mjs --test --to me@gmail.com ...   seed test
 *   node scripts/housecalls-send.mjs --selftest
 *
 * Gates, in order, all hard:
 *   1. suppression list (address or whole domain): the no that lasts forever
 *   2. one email ever per address (outbox history), independent of stage
 *   3. prospect stage must be "drafted" (the human-approved stage);
 *      --test (seed tests to our own accounts) skips 2 and 3 only
 *   4. no unfilled {SLOTS}, no em dashes, plain text only
 *   5. compliance footer appended: physical address + disclosure + binding no
 *   6. five sends per day, forever (design: never resemble bulk)
 *
 * Transport is localhost Proton Bridge (SMTP), config in the PRIVATE dir:
 * data/housecalls/sending.json = { host, port, user, pass, from, from_name,
 * physical_address }. nodemailer is imported lazily so dry runs work before
 * the Bridge exists.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const PRIV = path.join(ROOT, "data", "housecalls")
const OP = JSON.parse(readFileSync(path.join(ROOT, "lib", "housecalls", "operator.json"), "utf8"))

const SUPPRESSION = path.join(PRIV, "suppression.json")
const OUTBOX = path.join(PRIV, "outbox.json")
const SENDING = path.join(PRIV, "sending.json")
const PROSPECTS = path.join(PRIV, "prospects.json")
const DAILY_CAP = 5

const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fallback)
const writeJson = (p, obj) => writeFileSync(p, JSON.stringify(obj, null, 1) + "\n")

// ---------- gates (pure, selftested) ----------

/** Gate 1: the suppression list only grows and always wins. */
export function suppressionHit(addr, sup) {
  const a = addr.toLowerCase()
  const domain = a.split("@")[1] ?? ""
  for (const e of sup.entries ?? []) {
    if (e.address && e.address.toLowerCase() === a) return `address suppressed (${e.reason}, ${e.date})`
    if (e.domain && e.domain.toLowerCase() === domain) return `domain suppressed (${e.reason}, ${e.date})`
  }
  return null
}

/** Gate 2: one email ever per address, no matter which prospect row it rode. */
export function priorSend(addr, outbox) {
  const a = addr.toLowerCase()
  return (outbox.sent ?? []).find((s) => s.to.toLowerCase() === a) ?? null
}

/** Gate 3: only the human-approved stage may leave the building. */
export function stageGate(prospect) {
  if (!prospect) return "prospect id not found"
  if (prospect.stage !== "drafted") return `stage is "${prospect.stage}", only "drafted" sends (one-way ratchet)`
  return null
}

/** Gate 4: the letter itself. */
export function letterProblems(body) {
  const problems = []
  const slots = body.match(/\{[A-Z_]+\}/g)
  if (slots) problems.push(`unfilled slots: ${[...new Set(slots)].join(" ")}`)
  if (body.includes("\u2014")) problems.push("em dash in shipped text")
  if (/<[a-z][\s\S]*>/i.test(body) && /<\/(p|div|a|html|body)>/i.test(body)) problems.push("looks like HTML; letters are plain text")
  if (!body.trim()) problems.push("empty body")
  return problems
}

/** Gate 5: the compliance footer, appended, never optional. */
export function withFooter(body, cfg) {
  const address = cfg?.physical_address ?? "{PHYSICAL_ADDRESS}"
  return (
    body.trimEnd() +
    "\n\n--\n" +
    `${OP.operator.name} · ${address}\n` +
    `Drafted by the AI I operate; reviewed and signed by me. The whole\n` +
    `operation is public at https://${OP.operator.hunt_host}\n` +
    `Reply "no" and you will never hear from us again. That is binding\n` +
    `and we log it.\n`
  )
}

/** Gate 6: five a day, forever. */
export function overDailyCap(outbox, now = new Date()) {
  const today = now.toISOString().slice(0, 10)
  const n = (outbox.sent ?? []).filter((s) => s.at.slice(0, 10) === today).length
  return n >= DAILY_CAP ? `daily cap reached (${n}/${DAILY_CAP}); speed is for replies, not cold sends` : null
}

// ---------- selftest ----------

function selftest() {
  const sup = {
    entries: [
      { address: "no@corp.com", date: "2026-09-01", reason: "no" },
      { domain: "angry.com", date: "2026-09-02", reason: "anger" },
    ],
  }
  const outbox = {
    sent: [
      { to: "once@corp.com", at: "2026-09-06T10:00:00Z" },
      ...Array.from({ length: 5 }, (_, i) => ({ to: `cap${i}@x.com`, at: "2026-09-06T11:00:00Z" })),
    ],
  }
  const footer = withFooter("Body.", { physical_address: "123 Main St, Grand Rapids, MI" })
  const cases = [
    ["suppressed address refuses", suppressionHit("NO@corp.com", sup) !== null],
    ["suppressed domain refuses", suppressionHit("anyone@angry.com", sup) !== null],
    ["clean address passes suppression", suppressionHit("ok@fine.com", sup) === null],
    ["one-email-ever refuses a second", priorSend("ONCE@corp.com", outbox) !== null],
    ["unfilled slot refuses", letterProblems("Dear {FIRST_NAME}, hi").length === 1],
    ["em dash refuses", letterProblems("well \u2014 no").length === 1],
    ["clean plain text passes", letterProblems("A fine letter.\nSigned.").length === 0],
    ["footer carries address + binding no + hunt host",
      footer.includes("123 Main St") && footer.includes("binding") && footer.includes(OP.operator.hunt_host)],
    ["daily cap refuses the sixth", overDailyCap(outbox, new Date("2026-09-06T12:00:00Z")) !== null],
    ["cap resets next day", overDailyCap(outbox, new Date("2026-09-07T12:00:00Z")) === null],
    ["stage gate wants drafted", stageGate({ stage: "qualified" }) !== null && stageGate({ stage: "drafted" }) === null],
    ["missing prospect refuses", stageGate(undefined) !== null],
  ]
  let ok = true
  for (const [name, pass] of cases) {
    console.log(`${pass ? "PASS" : "FAIL"} send: ${name}`)
    ok &&= pass
  }
  process.exit(ok ? 0 : 1)
}

// ---------- main ----------

function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? null : process.argv[i + 1]
}
const flag = (name) => process.argv.includes(`--${name}`)

async function main() {
  if (flag("selftest")) return selftest()

  const to = arg("to")
  const subject = arg("subject")
  const letterPath = arg("letter")
  const prospectId = arg("prospect")
  const isTest = flag("test")
  const reallySend = flag("send")

  if (!to || !subject || !letterPath) {
    console.error("usage: --to <addr> --subject <s> --letter <file> [--prospect <id>] [--test] [--send]")
    process.exit(2)
  }

  mkdirSync(PRIV, { recursive: true })
  const sup = readJson(SUPPRESSION, { entries: [] })
  const outbox = readJson(OUTBOX, { sent: [] })
  const prospects = readJson(PROSPECTS, {})
  const cfg = readJson(SENDING, null)

  const refusals = []
  const hit = suppressionHit(to, sup)
  if (hit) refusals.push(`SUPPRESSED: ${hit}`)
  if (!isTest) {
    const prior = priorSend(to, outbox)
    if (prior) refusals.push(`ONE EMAIL EVER: already wrote this address on ${prior.at.slice(0, 10)}`)
    if (!prospectId) refusals.push("no --prospect id (real sends ride a prospect row; --test for seed tests)")
    else {
      const sg = stageGate(prospects[prospectId])
      if (sg) refusals.push(`STAGE: ${sg}`)
    }
  }
  const body = readFileSync(letterPath, "utf8")
  for (const p of letterProblems(body)) refusals.push(`LETTER: ${p}`)
  const cap = overDailyCap(outbox)
  if (cap) refusals.push(`CAP: ${cap}`)
  if (!cfg) refusals.push("no data/housecalls/sending.json (host, port, user, pass, from, from_name, physical_address)")
  else if (!cfg.physical_address) refusals.push("sending.json has no physical_address (CAN-SPAM: no address, no outbound)")

  const message = withFooter(body, cfg)
  console.log("=".repeat(60))
  console.log(`To: ${to}\nSubject: ${subject}\nFrom: ${cfg ? `${cfg.from_name} <${cfg.from}>` : "(unconfigured)"}`)
  console.log("-".repeat(60))
  console.log(message)
  console.log("=".repeat(60))

  if (refusals.length) {
    console.error(`\nREFUSED (${refusals.length}):`)
    for (const r of refusals) console.error(`  ✗ ${r}`)
    process.exit(1)
  }
  if (!reallySend) {
    console.log("\nDRY RUN: every gate passed. Add --send to transmit. The human presses the button.")
    return
  }

  const { default: nodemailer } = await import("nodemailer")
  const transport = nodemailer.createTransport({
    host: cfg.host ?? "127.0.0.1",
    port: cfg.port ?? 1025,
    secure: false,
    auth: { user: cfg.user, pass: cfg.pass },
    tls: { rejectUnauthorized: false }, // Proton Bridge uses a local self-signed cert
  })
  const info = await transport.sendMail({
    from: `"${cfg.from_name}" <${cfg.from}>`,
    to,
    subject,
    text: message,
  })

  outbox.sent.push({
    to,
    subject,
    at: new Date().toISOString(),
    message_id: info.messageId ?? null,
    prospect: prospectId ?? null,
    test: isTest,
  })
  writeJson(OUTBOX, outbox)

  if (!isTest && prospectId && prospects[prospectId]) {
    prospects[prospectId].stage = "contacted"
    prospects[prospectId].stage_since = new Date().toISOString().slice(0, 10)
    prospects[prospectId].contacted_at = new Date().toISOString()
    writeJson(PROSPECTS, prospects)
    console.log(`prospect ${prospectId} → contacted`)
  }
  console.log(`SENT ${info.messageId ?? ""}`)
  console.error("Now: run the harvest to refresh the map, and write the ledger entry TODAY.")
}

main()
