import type { NextRequest } from "next/server"
import { chatConfig, CONTACT_EMAIL, RESUME_PATH, RESUME_PDF_PATH } from "@/lib/chat/config"
import { peek, reserve, settle } from "@/lib/chat/ledger"
import { costOf, fallbacksEnabledFor, streamAnswer, worstCaseUsd, type ChatTurn } from "@/lib/chat/anthropic"
import { systemPrompt } from "@/lib/chat/prompt"
import { StreamRedactor } from "@/lib/chat/redact"

/**
 * /api/chat: questions about Bradley, answered by Claude from his resume and
 * this site, under a hard cap.
 *
 *   GET   whether the chat can take a question, and how many this visitor
 *         has left. The page calls it once on load.
 *   POST  { messages: [{ role, content }, ...] } -> a stream of NDJSON lines:
 *           {"t":"text","v":"..."}     a piece of the answer
 *           {"t":"reset","v":"..."}    discard what streamed; show this instead
 *           {"t":"done","remaining":{"hour":n,"day":n},"note"?:"..."}
 *         or, when the chat will not call the API, a JSON refusal with a
 *         status (400, 429, 503) and the same calm message shape:
 *           {"ok":false,"code":"...","message":"...","email":"...","remaining"?:{...}}
 *
 * THE CAP, three layers, each failing closed (lib/chat/ledger.ts):
 *   1. per visitor: CHAT_PER_HOUR (8) an hour and CHAT_PER_DAY (20) a day;
 *   2. per question: 600 characters, and only the last 6 messages go upstream;
 *   3. global: CHAT_DAILY_USD (2.00) a UTC day, from the API's usage fields.
 * No key, an unwritable state directory, or an unreadable ledger: no call.
 *
 * THE CLIENT ADDRESS. nginx resolves the real client address (real_ip from
 * the gateway's X-Forwarded-For) and passes it as X-Real-IP. That header is
 * read first. Failing it, the LAST X-Forwarded-For entry, the one nginx
 * appended; the leftmost entries are whatever the client claimed.
 *
 * Upstream error bodies are never forwarded or logged: only a status and an
 * error type go to the journal.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BODY = 24_000

function clientIp(req: NextRequest): string {
  const real = req.headers.get("x-real-ip")?.trim()
  if (real) return real
  const xff = req.headers.get("x-forwarded-for")
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean)
    if (parts.length) return parts[parts.length - 1]
  }
  return "unknown"
}

const WAYS_IN = `The resume is the record: ${RESUME_PATH}, or the PDF at ${RESUME_PDF_PATH}. Or email Bradley at ${CONTACT_EMAIL}.`

const MESSAGES = {
  off: `The chat is not switched on yet. ${WAYS_IN}`,
  closed: `The chat cannot take questions right now. ${WAYS_IN}`,
  budget: `The chat has used today's budget and is resting until tomorrow (UTC). ${WAYS_IN}`,
  hour: "That is the limit of questions for this hour.",
  day: "That is the limit of questions for today.",
  long: "Questions are limited to 600 characters. Could you shorten it?",
  bad: "That request did not look like a question.",
  upstream: `The answer did not come through. Please try again in a minute. ${WAYS_IN}`,
  refusal: `I can't answer that one here. ${WAYS_IN}`,
} as const

function refuse(status: number, code: keyof typeof MESSAGES, extra: Record<string, unknown> = {}): Response {
  let message: string = MESSAGES[code]
  if ((code === "hour" || code === "day") && typeof extra.retryAfterSec === "number") {
    const mins = Math.max(1, Math.ceil(extra.retryAfterSec / 60))
    const when = mins >= 90 ? `about ${Math.round(mins / 60)} hours` : `about ${mins} minutes`
    message = `${message} You can ask again in ${when}. ${WAYS_IN}`
  }
  const headers: Record<string, string> = { "cache-control": "no-store" }
  if (typeof extra.retryAfterSec === "number") headers["retry-after"] = String(extra.retryAfterSec)
  return Response.json({ ok: false, code, message, email: CONTACT_EMAIL, ...extra }, { status, headers })
}

export async function GET(req: NextRequest) {
  const cfg = chatConfig()
  const limits = { perHour: cfg.perHour, perDay: cfg.perDay, maxInput: cfg.maxInput }
  // No key: say so, and touch nothing on disk.
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { status: "off", message: MESSAGES.off, remaining: null, limits, email: CONTACT_EMAIL },
      { headers: { "cache-control": "no-store" } },
    )
  }
  // "Budget left" means room for one more worst-case question, the same test
  // POST applies, so the page never offers a question the server will refuse.
  const minUsd = worstCaseUsd({
    model: cfg.model,
    systemChars: systemPrompt().length,
    turnChars: cfg.maxInput,
    maxTokens: cfg.maxTokens,
    fallbacks: fallbacksEnabledFor(cfg.model),
  })
  const state = peek({
    dir: cfg.stateDir,
    ip: clientIp(req),
    now: Date.now(),
    limits: { dailyUsd: cfg.dailyUsd, perHour: cfg.perHour, perDay: cfg.perDay },
    minUsd,
  })
  let status: "on" | "closed" | "budget" = "on"
  if (!state.writable) status = "closed"
  else if (!state.budgetLeft) status = "budget"
  return Response.json(
    {
      status,
      message: status === "on" ? null : MESSAGES[status],
      remaining: state.remaining,
      limits,
      email: CONTACT_EMAIL,
    },
    { headers: { "cache-control": "no-store" } },
  )
}

/** The history the browser sent, checked and trimmed to what goes upstream. */
function parseTurns(raw: unknown, maxInput: number, maxEcho: number, maxTurns: number): ChatTurn[] | "long" | null {
  if (!raw || typeof raw !== "object") return null
  const list = (raw as { messages?: unknown }).messages
  if (!Array.isArray(list) || list.length === 0 || list.length > 40) return null
  const turns: ChatTurn[] = []
  for (const m of list) {
    if (!m || typeof m !== "object") return null
    const { role, content } = m as { role?: unknown; content?: unknown }
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null
    const text = content.trim()
    if (!text) return null
    turns.push({ role, content: text })
  }
  const last = turns[turns.length - 1]
  if (last.role !== "user") return null
  if (last.content.length > maxInput) return "long"
  let kept = turns.slice(-maxTurns)
  while (kept.length && kept[0].role !== "user") kept = kept.slice(1)
  // Roles must alternate; drop anything that does not.
  const clean: ChatTurn[] = []
  for (const t of kept) {
    if (clean.length && clean[clean.length - 1].role === t.role) return null
    const cap = t.role === "user" ? maxInput : maxEcho
    clean.push({ role: t.role, content: t.content.slice(0, cap) })
  }
  return clean
}

export async function POST(req: NextRequest) {
  const cfg = chatConfig()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return refuse(503, "off")

  let raw: unknown
  try {
    const text = await req.text()
    if (text.length > MAX_BODY) return refuse(400, "long")
    raw = JSON.parse(text)
  } catch {
    return refuse(400, "bad")
  }
  const turns = parseTurns(raw, cfg.maxInput, cfg.maxEcho, cfg.maxTurns)
  if (turns === "long") return refuse(400, "long")
  if (!turns || !turns.length) return refuse(400, "bad")

  const system = systemPrompt()
  const fallbacks = fallbacksEnabledFor(cfg.model)
  const estimate = worstCaseUsd({
    model: cfg.model,
    systemChars: system.length,
    turnChars: turns.reduce((s, t) => s + t.content.length, 0),
    maxTokens: cfg.maxTokens,
    fallbacks,
  })

  const grant = reserve({
    dir: cfg.stateDir,
    ip: clientIp(req),
    estimateUsd: estimate,
    now: Date.now(),
    limits: { dailyUsd: cfg.dailyUsd, perHour: cfg.perHour, perDay: cfg.perDay },
  })
  if (!grant.ok) {
    const status = grant.reason === "closed" || grant.reason === "budget" ? 503 : 429
    return refuse(status, grant.reason, {
      ...(grant.retryAfterSec !== undefined ? { retryAfterSec: grant.retryAfterSec } : {}),
      ...(grant.remaining ? { remaining: grant.remaining } : {}),
    })
  }

  const encoder = new TextEncoder()
  const upstream = new AbortController()
  const timer = setTimeout(() => upstream.abort(), cfg.timeoutMs)
  req.signal.addEventListener("abort", () => upstream.abort())

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true
      const send = (obj: unknown) => {
        if (!open) return
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`))
        } catch {
          open = false
        }
      }
      const redactor = new StreamRedactor()
      let sent = 0

      const result = await streamAnswer({
        apiKey,
        model: cfg.model,
        maxTokens: cfg.maxTokens,
        system,
        messages: turns,
        signal: upstream.signal,
        onText: (delta) => {
          const safe = redactor.push(delta)
          if (safe) {
            sent += safe.length
            send({ t: "text", v: safe })
          }
        },
      })
      clearTimeout(timer)

      // Settle the spend first, whatever happened to the answer. Usage that
      // never arrived on a request that may have reached the model (a 200
      // with no usage, or an abort before the headers came back) is charged
      // at the reservation, which was the worst case.
      let usd = 0
      if (result.billed) {
        usd = costOf(result.usage, cfg.model, result.model)
        if (!result.ok) usd = Math.max(usd, estimate)
      } else if (result.status === 200 || result.errorType === "aborted") {
        usd = estimate
      }
      // The API answered with an error status, or could not be reached at all,
      // and nothing was billed: the site failed, not the visitor, so the
      // question is handed back to their count.
      const refunded = !result.billed && usd === 0 && result.status !== 200
      let remaining = grant.remaining
      try {
        settle({
          dir: cfg.stateDir,
          id: grant.id,
          usd,
          now: Date.now(),
          ...(refunded ? { refund: { key: grant.key, at: grant.at } } : {}),
        })
        if (refunded) {
          remaining = {
            hour: Math.min(cfg.perHour, grant.remaining.hour + 1),
            day: Math.min(cfg.perDay, grant.remaining.day + 1),
          }
        }
      } catch {
        console.error("[chat] ledger settle failed; reservation stays counted at its estimate")
      }
      console.log(
        `[chat] status=${result.status} stop=${result.stopReason ?? "-"} model=${result.model ?? "-"}` +
          ` fallback=${result.fellBack ? 1 : 0} usd=${usd.toFixed(5)}` +
          (result.errorType ? ` error=${result.errorType}` : ""),
      )

      if (result.stopReason === "refusal") {
        redactor.end()
        send({ t: "reset", v: MESSAGES.refusal })
      } else if (!result.ok && sent === 0) {
        redactor.end()
        send({ t: "reset", v: MESSAGES.upstream })
      } else {
        const tail = redactor.end()
        if (tail) send({ t: "text", v: tail })
      }
      const note =
        result.stopReason === "max_tokens"
          ? `That answer was cut short. The full record is at ${RESUME_PATH}.`
          : !result.ok && sent > 0
            ? "The answer stopped partway. Please ask again."
            : undefined
      send({ t: "done", remaining, ...(note ? { note } : {}) })
      open = false
      try {
        controller.close()
      } catch {
        /* the visitor left */
      }
    },
    cancel() {
      upstream.abort()
    },
  })

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      // nginx buffers proxied responses by default; this lets each line through.
      "x-accel-buffering": "no",
    },
  })
}
