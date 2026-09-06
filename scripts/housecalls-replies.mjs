#!/usr/bin/env node
/**
 * House Calls reply poller (docs/housecalls/reply-playbook.md).
 *
 * Watches the hunt mailbox over localhost Proton Bridge IMAP, matches
 * inbound mail to our outbox, classifies each reply into the playbook's
 * buckets, and queues the work. IT NEVER SENDS ANYTHING. Replies are
 * drafted by the AI and sent by the human, like everything else.
 *
 *   node scripts/housecalls-replies.mjs             poll + classify + queue
 *   node scripts/housecalls-replies.mjs --apply     also perform SAFE moves
 *   node scripts/housecalls-replies.mjs --selftest
 *
 * Buckets (playbook): 1 no · 2 not-now · 3 question · 4 yes · 5 referral ·
 * 6 anger · 7 autoreply/OOO · 8 bounce · 0 unclassified (human reads it).
 *
 * The ONLY automated state changes, and only under --apply, chosen because
 * their failure mode is "we never email someone we could have," which is
 * the direction the doctrine already leans:
 *   - a CONFIDENT plain no with no question in it: suppression entry +
 *     prospect closed (playbook: send NOTHING back).
 *   - a hard bounce: contact marked bad so the discovery queue re-opens.
 * Everything else (including anger: the playbook owes ONE apology first,
 * and a suppression entry would block the human from sending it) waits for
 * a human. Buckets 3/4/5 print the 4-working-hour draft SLA.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const PRIV = path.join(ROOT, "data", "housecalls")
const SENDING = path.join(PRIV, "sending.json")
const OUTBOX = path.join(PRIV, "outbox.json")
const PROSPECTS = path.join(PRIV, "prospects.json")
const SUPPRESSION = path.join(PRIV, "suppression.json")
const REPLIES = path.join(PRIV, "replies.json")

const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fallback)
const writeJson = (p, obj) => writeFileSync(p, JSON.stringify(obj, null, 1) + "\n")

// ---------- classification (pure, selftested, conservative) ----------

const BUCKET_LABEL = {
  0: "unclassified (human reads it)",
  1: "no (closed forever)",
  2: "not now (human judges deferral vs polite no)",
  3: "question (draft due in 4 working hours)",
  4: "yes (fastest bucket in the book)",
  5: "referral (ask permission to use their name)",
  6: "anger (ONE apology, then closed; human sends it)",
  7: "autoreply/OOO (flips nothing)",
  8: "bounce (contact is bad; back to discovery)",
}

/**
 * Classify one inbound message. Returns { bucket, confident, hasQuestion }.
 * Order matters: machine mail first, then the human buckets, hardest words
 * first. Conservative on purpose: when in doubt, bucket 0 and a human reads
 * it; a misfiled reply costs minutes, an automated wrong move costs trust.
 */
export function classifyReply({ from = "", subject = "", text = "" }) {
  const f = from.toLowerCase()
  const s = subject.toLowerCase()
  const t = text.toLowerCase()
  const hasQuestion = /\?/.test(text)

  if (/mailer-daemon|postmaster@|double-bounce/.test(f) || /undeliver|delivery (status|failure|incomplete)|returned mail|mail delivery failed/.test(s))
    return { bucket: 8, confident: true, hasQuestion: false }
  if (/out of (the )?office|automatic reply|auto[- ]?reply|autoreply|abwesenheit|on vacation|parental leave/.test(s) || /i (am|'m) (currently )?(out of|away from) (the )?office/.test(t))
    return { bucket: 7, confident: true, hasQuestion: false }

  const angry = /\bspam\b|report(ing)? (you|this)|how did you get (my|this)|take me off your list right now|harass/i.test(text)
  if (angry) return { bucket: 6, confident: true, hasQuestion }

  const hardNo = /not interested|no,? thank(s| you)|unsubscribe|remove me|do not (contact|email)|don'?t (contact|email)|stop emailing|please stop/i.test(text)
  const bareNo = /^\s*no\.?\s*$/i.test(text.trim())
  if (hardNo || bareNo) return { bucket: 1, confident: true, hasQuestion }

  const deferral = /\b(next (quarter|month|year)|in q[1-4]|after (the|our)|try (us|again|back) (in|after)|circle back|check back|reach out in|later this year|not (right )?now|bad timing)\b/i.test(text)
  if (deferral) return { bucket: 2, confident: false, hasQuestion }

  const referral = /\b(talk to|reach out to|forward(ed)? (this|your)|best person|you want|contact) [A-Z][a-z]+\b/.test(text) || /\bour (it|technology|engineering) (director|manager|lead)\b/i.test(text)
  if (referral) return { bucket: 5, confident: false, hasQuestion }

  const yes = /\b(call me|let'?s (talk|chat|meet|connect)|happy to (talk|chat|meet)|set up (a )?(call|meeting|time)|schedule (a )?(call|meeting)|interested in (talking|learning|hearing))\b/i.test(text)
  if (yes) return { bucket: 4, confident: true, hasQuestion }

  if (hasQuestion) return { bucket: 3, confident: false, hasQuestion }
  return { bucket: 0, confident: false, hasQuestion }
}

/** Match an inbound message to our outbox: threading header first, address second. */
export function matchToOutbox({ from = "", inReplyTo = "" }, outbox) {
  const sent = outbox.sent ?? []
  if (inReplyTo) {
    const byThread = sent.find((s) => s.message_id && inReplyTo.includes(s.message_id.replace(/[<>]/g, "")))
    if (byThread) return byThread
  }
  const a = from.toLowerCase().replace(/^.*</, "").replace(/>.*$/, "").trim()
  return sent.find((s) => s.to.toLowerCase() === a) ?? null
}

/** The only moves safe to automate. Returns a list of applied-move strings. */
export function safeMoves(entry, { prospects, suppression }) {
  const moves = []
  const p = entry.prospect ? prospects[entry.prospect] : null
  if (entry.bucket === 1 && entry.confident && !entry.hasQuestion) {
    if (!suppression.entries.some((e) => e.address?.toLowerCase() === entry.from_addr)) {
      suppression.entries.push({ address: entry.from_addr, date: entry.at.slice(0, 10), reason: "no" })
      moves.push(`suppressed ${entry.from_addr} forever`)
    }
    if (p && p.stage !== "closed") {
      p.stage = "closed"
      p.stage_since = entry.at.slice(0, 10)
      moves.push(`prospect ${p.id} closed`)
    }
  }
  if (entry.bucket === 8 && p?.contact?.email) {
    p.contact = { ...p.contact, email: null, bounced: p.contact.email }
    moves.push(`prospect ${p.id} contact email cleared (bounced); discovery queue will re-open it`)
  }
  return moves
}

// ---------- selftest ----------

function selftest() {
  const C = (m) => classifyReply(m)
  const cases = [
    ["bounce by sender", C({ from: "MAILER-DAEMON@mx.x.com", text: "..." }).bucket === 8],
    ["bounce by subject", C({ subject: "Undeliverable: your note", text: "" }).bucket === 8],
    ["OOO flips nothing", C({ subject: "Automatic reply: hello", text: "back Monday" }).bucket === 7],
    ["hard no is confident", (() => { const r = C({ text: "Not interested, remove me." }); return r.bucket === 1 && r.confident })()],
    ["bare no is a no", C({ text: "No." }).bucket === 1],
    ["no WITH a question is still bucket 1 but flagged", (() => { const r = C({ text: "Not interested. How did you find us anyway?" }); return r.bucket === 6 || (r.bucket === 1 && r.hasQuestion) })()],
    ["anger beats no", C({ text: "This is spam and I am reporting you." }).bucket === 6],
    ["deferral is uncertain", (() => { const r = C({ text: "Try us again in Q2 after the ERP go-live." }); return r.bucket === 2 && !r.confident })()],
    ["referral spotted", C({ text: "You want to talk to Jane in IT, she owns this." }).bucket === 5],
    ["yes is a yes", C({ text: "Happy to talk. Call me Thursday." }).bucket === 4],
    ["plain question", C({ text: "What would this cost for a shop our size?" }).bucket === 3],
    ["silence about nothing is unclassified", C({ text: "Thanks for the note." }).bucket === 0],
  ]

  const outbox = { sent: [{ to: "pat@corp.com", message_id: "<m1@hc>", at: "2026-09-06T10:00:00Z", prospect: "p1" }] }
  cases.push(
    ["thread match wins", matchToOutbox({ from: "other@corp.com", inReplyTo: "<m1@hc>" }, outbox)?.prospect === "p1"],
    ["address match fallback", matchToOutbox({ from: "Pat <PAT@corp.com>", inReplyTo: "" }, outbox)?.prospect === "p1"],
    ["stranger matches nothing", matchToOutbox({ from: "x@else.com", inReplyTo: "" }, outbox) === null],
  )

  const prospects = { p1: { id: "p1", stage: "replied", contact: { name: "Pat", email: "pat@corp.com" } } }
  const suppression = { entries: [] }
  const noEntry = { bucket: 1, confident: true, hasQuestion: false, from_addr: "pat@corp.com", prospect: "p1", at: "2026-09-06T12:00:00Z" }
  const m1 = safeMoves(noEntry, { prospects, suppression })
  cases.push(
    ["confident plain no auto-suppresses + closes", m1.length === 2 && suppression.entries.length === 1 && prospects.p1.stage === "closed"],
    ["second application is idempotent", safeMoves(noEntry, { prospects, suppression }).length === 0],
  )
  const angerEntry = { bucket: 6, confident: true, hasQuestion: false, from_addr: "mad@corp.com", prospect: null, at: "2026-09-06T12:00:00Z" }
  const qNoEntry = { bucket: 1, confident: true, hasQuestion: true, from_addr: "curious@corp.com", prospect: null, at: "2026-09-06T12:00:00Z" }
  cases.push(
    ["anger NEVER auto-suppresses (apology owed first)", safeMoves(angerEntry, { prospects, suppression }).length === 0],
    ["a no containing a question waits for the human answer", safeMoves(qNoEntry, { prospects, suppression }).length === 0],
  )
  const bounceEntry = { bucket: 8, confident: true, hasQuestion: false, from_addr: "mailer-daemon@x", prospect: "p1", at: "2026-09-06T12:00:00Z" }
  prospects.p1.contact = { name: "Pat", email: "pat@corp.com" }
  const m2 = safeMoves(bounceEntry, { prospects, suppression })
  cases.push(["bounce clears the bad email and keeps the name", m2.length === 1 && prospects.p1.contact.email === null && prospects.p1.contact.name === "Pat"])

  let ok = true
  for (const [name, pass] of cases) {
    console.log(`${pass ? "PASS" : "FAIL"} replies: ${name}`)
    ok &&= pass
  }
  process.exit(ok ? 0 : 1)
}

// ---------- main ----------

async function main() {
  if (process.argv.includes("--selftest")) return selftest()
  const apply = process.argv.includes("--apply")

  const cfg = readJson(SENDING, null)
  if (!cfg) {
    console.error("no data/housecalls/sending.json yet: the poller needs the same mailbox the send tool uses")
    console.error('add imap_host (default 127.0.0.1) and imap_port (default 1143, Proton Bridge) beside the smtp fields')
    process.exit(1)
  }

  mkdirSync(PRIV, { recursive: true })
  const outbox = readJson(OUTBOX, { sent: [] })
  const prospects = readJson(PROSPECTS, {})
  const suppression = readJson(SUPPRESSION, { entries: [] })
  const state = readJson(REPLIES, { last_uid: 0, queue: [] })

  const { ImapFlow } = await import("imapflow")
  const { simpleParser } = await import("mailparser")
  const client = new ImapFlow({
    host: cfg.imap_host ?? "127.0.0.1",
    port: cfg.imap_port ?? 1143,
    secure: false,
    auth: { user: cfg.user, pass: cfg.pass },
    tls: { rejectUnauthorized: false }, // Proton Bridge local self-signed cert
    logger: false,
  })
  await client.connect()
  const lock = await client.getMailboxLock("INBOX")
  let newest = state.last_uid
  const fresh = []
  try {
    for await (const msg of client.fetch({ uid: `${state.last_uid + 1}:*` }, { uid: true, source: true })) {
      if (msg.uid <= state.last_uid) continue
      newest = Math.max(newest, msg.uid)
      const mail = await simpleParser(msg.source)
      const fromAddr = mail.from?.value?.[0]?.address?.toLowerCase() ?? ""
      const meta = {
        from: mail.from?.text ?? "",
        subject: mail.subject ?? "",
        text: (mail.text ?? "").slice(0, 4000),
        inReplyTo: mail.inReplyTo ?? "",
      }
      const sent = matchToOutbox(meta, outbox)
      if (!sent && !fromAddr) continue
      const cls = classifyReply(meta)
      const entry = {
        at: (mail.date ?? new Date()).toISOString(),
        uid: msg.uid,
        from_addr: fromAddr,
        subject: meta.subject,
        bucket: cls.bucket,
        bucket_label: BUCKET_LABEL[cls.bucket],
        confident: cls.confident,
        hasQuestion: cls.hasQuestion,
        prospect: sent?.prospect ?? null,
        matched: Boolean(sent),
        excerpt: meta.text.slice(0, 200),
        applied: [],
      }
      if (!sent) entry.bucket_label += " [UNMATCHED: not a reply to our outbox; probably not ours]"
      fresh.push(entry)
    }
  } finally {
    lock.release()
  }
  await client.logout()

  for (const e of fresh) {
    if (apply && e.matched) e.applied = safeMoves(e, { prospects, suppression })
    state.queue.push(e)
    const sla = [3, 4, 5].includes(e.bucket) ? " | DRAFT DUE IN 4 WORKING HOURS" : ""
    console.log(`[${e.bucket}] ${e.bucket_label}${sla}\n    from ${e.from_addr} | ${e.subject}${e.applied.length ? `\n    applied: ${e.applied.join("; ")}` : ""}`)
  }
  state.last_uid = newest
  writeJson(REPLIES, state)
  if (apply) {
    writeJson(PROSPECTS, prospects)
    writeJson(SUPPRESSION, suppression)
    // Playbook: every bucket writes a ledger entry, anonymized, same day.
    // Only under --apply (the no-flag run is a preview and writes nothing).
    const LEDGER_NOTE = {
      1: "A no arrived. Honored, logged, and closed forever; nothing goes back, exactly as the letter promised.",
      2: "A not-yet arrived; the human judges whether it carries an invitation to try again or is a polite no.",
      3: "A question arrived. An answer is being drafted; the playbook gives it four working hours.",
      4: "A yes arrived: someone wants to talk. Fastest bucket in the book; times are being offered today.",
      5: "A referral arrived. Before any name gets used, the referrer gets asked for permission to use theirs.",
      6: "Someone told us off, and they are right that unsolicited email is unsolicited. One apology goes out, then the door closes forever. Logged because the misses count too.",
      7: "An autoreply came back; not a reply, so nothing flips and nothing re-sends.",
      8: "A bounce: the address was wrong. The contact goes back to discovery; mailbox hygiene same day.",
    }
    try {
      const { appendEntry } = await import("./housecalls-ledger.mjs")
      for (const e of fresh) {
        if (!e.matched || !LEDGER_NOTE[e.bucket]) continue
        appendEntry("reply", LEDGER_NOTE[e.bucket])
      }
    } catch (err) {
      console.error(`ledger append failed (${err.message}); WRITE THE ENTRIES BY HAND TODAY`)
    }
  }
  console.log(`${fresh.length} new message(s); queue holds ${state.queue.length}.${apply ? "" : " Preview only: --apply performs safe moves and writes the ledger."}`)
}

main()
