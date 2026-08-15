import { createHmac, timingSafeEqual, randomUUID } from "crypto"

// ---------------------------------------------------------------------------
// TEMPORARY — session helpers for the unlisted /junior walkthrough page.
// Delete this file (and app/junior, app/api/junior, components/junior) at
// teardown. See docs/junior-teardown.md.
//
// The page fronts a WRITABLE shell on this host, so the gate is deliberately
// more than a client-side "if (pin === ...)": the PIN never reaches the
// browser, the cookie is an HMAC nobody can forge without JUNIOR_SECRET, and
// failed attempts are rate-limited per IP.
// ---------------------------------------------------------------------------

export const JUNIOR_COOKIE = "junior_session"

/** Session lifetime. Short on purpose — this whole page is a few hours' work. */
const TTL_MS = 8 * 60 * 60 * 1000

function secret(): string | null {
  const s = process.env.JUNIOR_SECRET
  return s && s.length >= 16 ? s : null
}

export function juniorPin(): string | null {
  const p = process.env.JUNIOR_PIN
  return p && p.length >= 4 ? p : null
}

/** Length-safe, timing-safe string compare. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8")
  const bb = Buffer.from(b, "utf8")
  // timingSafeEqual throws on length mismatch, so compare a digest of each:
  // equal-length inputs by construction, and the digest leaks nothing.
  const ad = createHmac("sha256", "len").update(ab).digest()
  const bd = createHmac("sha256", "len").update(bb).digest()
  return timingSafeEqual(ad, bd)
}

function sign(payload: string): string {
  const s = secret()
  if (!s) throw new Error("JUNIOR_SECRET not configured")
  return createHmac("sha256", s).update(payload).digest("hex")
}

/** Mint a cookie value: `<id>.<expiry>.<hmac>`. */
export function mintToken(): string {
  const payload = `${randomUUID()}.${Date.now() + TTL_MS}`
  return `${payload}.${sign(payload)}`
}

/** Verify a cookie value. Returns false for tampered, expired or malformed. */
export function verifyToken(token: string | undefined | null): boolean {
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 3) return false
  const [id, exp, mac] = parts
  if (!secret()) return false

  let expected: string
  try {
    expected = sign(`${id}.${exp}`)
  } catch {
    return false
  }
  if (mac.length !== expected.length) return false
  if (!timingSafeEqual(Buffer.from(mac, "utf8"), Buffer.from(expected, "utf8"))) return false

  const expiry = Number(exp)
  return Number.isFinite(expiry) && Date.now() < expiry
}

// --- failed-attempt throttle ------------------------------------------------
// In-process and therefore reset by a deploy; fine for a page that lives for a
// day. Slows an 8-digit guessing run from "minutes" to "geological".

type Bucket = { fails: number; until: number }
const buckets = new Map<string, Bucket>()

const MAX_FAILS = 6
const LOCKOUT_MS = 10 * 60 * 1000

export function throttleCheck(ip: string): { allowed: boolean; retryAfterSec: number } {
  const b = buckets.get(ip)
  if (b && b.until > Date.now()) {
    return { allowed: false, retryAfterSec: Math.ceil((b.until - Date.now()) / 1000) }
  }
  return { allowed: true, retryAfterSec: 0 }
}

export function throttleFail(ip: string): void {
  const b = buckets.get(ip) ?? { fails: 0, until: 0 }
  b.fails += 1
  if (b.fails >= MAX_FAILS) {
    b.until = Date.now() + LOCKOUT_MS
    b.fails = 0
  }
  buckets.set(ip, b)
}

export function throttleReset(ip: string): void {
  buckets.delete(ip)
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}
