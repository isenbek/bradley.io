/**
 * The chat's settings, all in one place, all overridable from the environment.
 *
 * Nothing here is a secret. The key itself is read in app/api/chat/route.ts
 * from process.env.ANTHROPIC_API_KEY and goes nowhere but the request header.
 *
 * MODEL. claude-opus-5-5 by default. The first impression a hiring manager
 * gets from this page is the quality of one answer, and at this volume (a
 * few dozen questions a day at most, under a two-dollar ceiling) the price
 * difference to a smaller model is cents. CHAT_MODEL overrides it.
 *
 * MAX TOKENS. 1000 by default. On Claude Opus 5.5 thinking cannot be turned
 * off and counts toward max_tokens, so the cap has to leave room for it above
 * an answer the prompt keeps near 120 words; a cut-off first answer to a
 * hiring manager costs more than the cent it saves. Only the worst-case
 * reservation grows with it; the bill is the tokens actually written.
 * CHAT_MAX_TOKENS overrides it.
 *
 * PRICES are US dollars per million tokens, from the claude-api skill's model
 * table (cached 2026-09-25) and its prompt-caching notes: a 5-minute cache
 * write costs 1.25x the input price; a cache read costs 0.1x, except on Claude
 * Opus 5.5 (0.05x, $0.20) and Claude Fable 5.1 ($0.25). A model missing from
 * the table is priced at the most expensive row, so a typo in CHAT_MODEL
 * spends the budget faster, never slower.
 */

export interface Price {
  input: number
  output: number
  cacheWrite: number
  cacheRead: number
}

function price(input: number, output: number, cacheRead?: number): Price {
  return { input, output, cacheWrite: input * 1.25, cacheRead: cacheRead ?? input * 0.1 }
}

export const PRICES: Record<string, Price> = {
  "claude-fable-5-1": price(10, 50, 0.25),
  "claude-fable-5": price(10, 50),
  "claude-opus-5-5": price(4, 20, 0.2),
  "claude-opus-5": price(5, 25),
  "claude-opus-4-8": price(5, 25),
  "claude-opus-4-7": price(5, 25),
  "claude-opus-4-6": price(5, 25),
  "claude-sonnet-5-5": price(2, 10, 0.2),
  "claude-sonnet-5": price(2, 10),
  "claude-sonnet-4-6": price(3, 15),
  "claude-haiku-4-5": price(1, 5),
}

/** The dearest row, for any model the table does not know. */
export const PRICE_CEILING: Price = Object.values(PRICES).reduce((a, b) => ({
  input: Math.max(a.input, b.input),
  output: Math.max(a.output, b.output),
  cacheWrite: Math.max(a.cacheWrite, b.cacheWrite),
  cacheRead: Math.max(a.cacheRead, b.cacheRead),
}))

export function priceFor(model: string | undefined | null): Price {
  if (!model) return PRICE_CEILING
  if (PRICES[model]) return PRICES[model]
  // A served model id can carry a provider prefix or a date suffix; match the
  // longest known id it starts with or contains.
  const hit = Object.keys(PRICES)
    .sort((a, b) => b.length - a.length)
    .find((id) => model.includes(id))
  return hit ? PRICES[hit] : PRICE_CEILING
}

function num(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === "") return fallback
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export interface ChatConfig {
  model: string
  maxTokens: number
  /** Global spend ceiling per UTC day, US dollars. */
  dailyUsd: number
  perHour: number
  perDay: number
  /** Longest question accepted, in characters. */
  maxInput: number
  /** Longest earlier answer accepted back from the browser, in characters. */
  maxEcho: number
  /** Messages sent to the model, counting the new question. */
  maxTurns: number
  stateDir: string
  /** Milliseconds before the upstream call is abandoned. */
  timeoutMs: number
}

export function chatConfig(): ChatConfig {
  return {
    model: (process.env.CHAT_MODEL || "claude-opus-5-5").trim(),
    maxTokens: Math.round(num("CHAT_MAX_TOKENS", 1000, 128, 2000)),
    dailyUsd: num("CHAT_DAILY_USD", 2, 0, 50),
    // At least 1: to switch the chat off, unset the key or set CHAT_DAILY_USD=0.
    perHour: Math.round(num("CHAT_PER_HOUR", 8, 1, 100)),
    perDay: Math.round(num("CHAT_PER_DAY", 20, 1, 500)),
    maxInput: 600,
    maxEcho: 2400,
    maxTurns: 6,
    stateDir: (process.env.CHAT_STATE_DIR || "/mnt/ursa/bradleyio/state/chat").trim(),
    timeoutMs: 45_000,
  }
}

/** Where a visitor is sent when the chat cannot answer. */
export const CONTACT_EMAIL = "brad@bradley.io"
export const RESUME_PATH = "/resume"
export const RESUME_PDF_PATH = "/resume.pdf"
