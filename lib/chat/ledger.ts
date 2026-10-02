/**
 * The chat's cap, on disk: a spend ledger per UTC day and a per-visitor book.
 *
 * WHY FILES. The ceiling has to survive a restart and a deploy, or a deploy
 * would hand the day a fresh two dollars. Small JSON files in CHAT_STATE_DIR
 * do that without a database. Every read-modify-write here is synchronous, so
 * inside the one Node process that serves the site no other request can run
 * between the read and the write: the check and the reservation are one step.
 *
 * FAILING CLOSED. Every path that cannot prove the cap holds says no:
 *   - the directory cannot be created or written: closed, no API call;
 *   - a ledger file exists but will not parse: closed (a corrupt ledger is
 *     not an empty one);
 *   - any exception at all inside reserve(): closed.
 *
 * RESERVATIONS. Before the API is called, the most the request could cost is
 * reserved against the day. After the stream ends the reservation is replaced
 * by what the usage fields say it did cost. A reservation that is never
 * settled (the process died mid-answer) is counted as spent at its estimate
 * once it is fifteen minutes old, so a crash can only make the day stricter.
 *
 * PRIVACY. Visitor addresses are never written. The book keys on a salted
 * SHA-256 of the address; the salt is random, made once, and stays in the
 * state directory with mode 0600.
 *
 * No Next.js imports, so the test scripts can drive it with bun directly.
 */

import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

const HOUR = 3_600_000
const DAY = 24 * HOUR
const STALE_RESERVATION = 15 * 60_000

export interface Limits {
  dailyUsd: number
  perHour: number
  perDay: number
}

export interface Remaining {
  hour: number
  day: number
}

export type Denial = {
  ok: false
  reason: "closed" | "budget" | "hour" | "day"
  retryAfterSec?: number
  remaining?: Remaining
}

/** key and at identify the visitor's recorded hit, so an unbilled failure can hand it back. */
export type Grant = { ok: true; id: string; key: string; at: number; remaining: Remaining }

interface Reservation {
  usd: number
  at: number
}

export interface LedgerDay {
  day: string
  spentUsd: number
  calls: number
  reserved: Record<string, Reservation>
}

interface VisitorBook {
  hits: Record<string, number[]>
}

export function utcDay(now: number): string {
  return new Date(now).toISOString().slice(0, 10)
}

function ledgerFile(dir: string, day: string): string {
  return path.join(dir, `spend-${day}.json`)
}

function visitorFile(dir: string): string {
  return path.join(dir, "visitors.json")
}

/** Missing file: the fallback. Present but unreadable or corrupt: throws. */
function readJson<T>(file: string, fallback: T): T {
  let raw: string
  try {
    raw = fs.readFileSync(file, "utf8")
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return fallback
    throw e
  }
  return JSON.parse(raw) as T
}

/** Write beside, then rename over: a reader never sees half a file. */
function writeJson(file: string, data: unknown): void {
  const tmp = `${file}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data), { mode: 0o600 })
  fs.renameSync(tmp, file)
}

/**
 * True when the directory exists (or can be made) and a file can be written
 * into it and removed again. Called before every reservation, so a sandbox
 * that turns read-only under a running process is caught on the next question.
 */
export function stateWritable(dir: string): boolean {
  try {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
    const probe = path.join(dir, `.probe-${process.pid}`)
    fs.writeFileSync(probe, "ok")
    fs.unlinkSync(probe)
    return true
  } catch {
    return false
  }
}

function salt(dir: string): string {
  const file = path.join(dir, "salt")
  try {
    const s = fs.readFileSync(file, "utf8").trim()
    if (s.length >= 32) return s
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e
  }
  const s = crypto.randomBytes(32).toString("hex")
  fs.writeFileSync(file, s, { mode: 0o600 })
  return s
}

export function visitorKey(dir: string, ip: string): string {
  return crypto.createHash("sha256").update(`${salt(dir)}|${ip}`).digest("hex").slice(0, 32)
}

function loadDay(dir: string, day: string): LedgerDay {
  const d = readJson<LedgerDay>(ledgerFile(dir, day), { day, spentUsd: 0, calls: 0, reserved: {} })
  if (typeof d.spentUsd !== "number" || !Number.isFinite(d.spentUsd) || typeof d.reserved !== "object") {
    throw new Error("ledger malformed")
  }
  return d
}

/** Fold reservations older than the stale limit into spent, at their estimate. */
function expireStale(d: LedgerDay, now: number): void {
  for (const [id, r] of Object.entries(d.reserved)) {
    if (now - r.at > STALE_RESERVATION) {
      d.spentUsd += r.usd
      delete d.reserved[id]
    }
  }
}

function committed(d: LedgerDay): number {
  return d.spentUsd + Object.values(d.reserved).reduce((s, r) => s + r.usd, 0)
}

function loadBook(dir: string, now: number): VisitorBook {
  const b = readJson<VisitorBook>(visitorFile(dir), { hits: {} })
  if (!b || typeof b.hits !== "object") throw new Error("visitor book malformed")
  for (const [k, list] of Object.entries(b.hits)) {
    const kept = Array.isArray(list) ? list.filter((t) => typeof t === "number" && now - t < DAY) : []
    if (kept.length) b.hits[k] = kept
    else delete b.hits[k]
  }
  return b
}

function remainingFrom(hits: number[], now: number, limits: Limits): Remaining {
  const lastHour = hits.filter((t) => now - t < HOUR).length
  return {
    hour: Math.max(0, limits.perHour - lastHour),
    day: Math.max(0, limits.perDay - hits.length),
  }
}

/**
 * Check every limit and, if all pass, record the question and reserve its
 * worst-case cost, in one synchronous step.
 */
export function reserve(opts: {
  dir: string
  ip: string
  estimateUsd: number
  now: number
  limits: Limits
}): Grant | Denial {
  const { dir, ip, estimateUsd, now, limits } = opts
  try {
    if (!stateWritable(dir)) return { ok: false, reason: "closed" }
    if (!(estimateUsd > 0) || !Number.isFinite(estimateUsd)) return { ok: false, reason: "closed" }

    const day = utcDay(now)
    const ledger = loadDay(dir, day)
    expireStale(ledger, now)

    const book = loadBook(dir, now)
    const key = visitorKey(dir, ip)
    const hits = book.hits[key] ?? []
    const before = remainingFrom(hits, now, limits)

    // With a limit of 0 there is no earlier hit to wait out, so no retry time.
    const retry = (list: number[], span: number) =>
      list.length ? Math.max(1, Math.ceil((Math.min(...list) + span - now) / 1000)) : undefined
    if (before.day <= 0) {
      return { ok: false, reason: "day", retryAfterSec: retry(hits, DAY), remaining: before }
    }
    if (before.hour <= 0) {
      return {
        ok: false,
        reason: "hour",
        retryAfterSec: retry(hits.filter((t) => now - t < HOUR), HOUR),
        remaining: before,
      }
    }
    if (committed(ledger) + estimateUsd > limits.dailyUsd) {
      writeJson(ledgerFile(dir, day), ledger)
      return { ok: false, reason: "budget", remaining: before }
    }

    const id = `${day}.${crypto.randomBytes(8).toString("hex")}`
    ledger.reserved[id] = { usd: estimateUsd, at: now }
    book.hits[key] = [...hits, now]
    writeJson(ledgerFile(dir, day), ledger)
    writeJson(visitorFile(dir), book)
    return { ok: true, id, key, at: now, remaining: remainingFrom(book.hits[key], now, limits) }
  } catch {
    return { ok: false, reason: "closed" }
  }
}

/**
 * Replace a reservation with the measured cost. Throws on a write failure so
 * the caller can log it; the reservation then stays on disk and is counted at
 * its estimate, which is the conservative outcome.
 */
export function settle(opts: {
  dir: string
  id: string
  usd: number
  now: number
  /** The visitor's hit to hand back: the request never reached the model. */
  refund?: { key: string; at: number }
}): LedgerDay {
  const { dir, id, usd, now, refund } = opts
  const day = id.slice(0, 10)
  const ledger = loadDay(dir, day)
  delete ledger.reserved[id]
  ledger.spentUsd += Number.isFinite(usd) && usd > 0 ? usd : 0
  ledger.calls += 1
  expireStale(ledger, now)
  writeJson(ledgerFile(dir, day), ledger)
  if (refund) {
    const book = loadBook(dir, now)
    const list = book.hits[refund.key] ?? []
    const i = list.indexOf(refund.at)
    if (i >= 0) {
      list.splice(i, 1)
      if (list.length) book.hits[refund.key] = list
      else delete book.hits[refund.key]
      writeJson(visitorFile(dir), book)
    }
  }
  return ledger
}

/**
 * What the page shows before a question is asked: whether the chat can take
 * one at all, and how many this visitor has left. Read only; never throws.
 */
export function peek(opts: { dir: string; ip: string; now: number; limits: Limits; minUsd: number }): {
  writable: boolean
  budgetLeft: boolean
  remaining: Remaining
} {
  const { dir, ip, now, limits, minUsd } = opts
  const none = { hour: 0, day: 0 }
  try {
    if (!stateWritable(dir)) return { writable: false, budgetLeft: false, remaining: none }
    const ledger = loadDay(dir, utcDay(now))
    expireStale(ledger, now)
    const book = loadBook(dir, now)
    const hits = book.hits[visitorKey(dir, ip)] ?? []
    return {
      writable: true,
      budgetLeft: committed(ledger) + minUsd <= limits.dailyUsd,
      remaining: remainingFrom(hits, now, limits),
    }
  } catch {
    return { writable: false, budgetLeft: false, remaining: none }
  }
}
