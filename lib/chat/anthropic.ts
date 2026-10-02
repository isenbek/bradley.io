/**
 * The one call to the Claude API: POST /v1/messages with stream: true, read
 * as server-sent events with fetch.
 *
 * WHY FETCH AND NOT THE SDK. The site keeps its runtime dependencies small on
 * purpose (CLAUDE.md), and this is a single endpoint with a single event loop.
 * The request shape, headers and event types follow the claude-api skill's
 * raw-HTTP reference (curl/examples.md, "Streaming (SSE)").
 *
 * REQUEST CHOICES, per the same skill:
 *   - Claude Opus 5.5 has no temperature (sampling parameters 400) and thinking
 *     cannot be turned off; output_config.effort is the control. "low" is the
 *     skill's starting point for chat. Older models that still take
 *     temperature get 0.2 instead of an effort they would reject.
 *   - thinking counts toward max_tokens, so max_tokens is sized above the
 *     answer itself; the prompt asks for brevity.
 *   - The system prompt is one block with cache_control: ephemeral (5-minute
 *     TTL). Opus 5.5's minimum cacheable prefix is 512 tokens; this one is
 *     several thousand.
 *   - Server-side refusal fallback, fallbacks: "default" with the
 *     server-side-fallback-2026-07-01 beta, on the models the skill lists for
 *     it. If the API rejects the beta (400), the call is retried once without
 *     it. CHAT_FALLBACKS=off turns it off.
 *
 * COST. usage.iterations, when present, is the per-attempt record (a fallback
 * attempt bills at the fallback model's rates); otherwise the top-level usage.
 * Each attempt is priced at its own model when the API names it, and at the
 * dearer of the requested and served models when it does not.
 */

import { priceFor, type Price } from "./config"

export interface ChatTurn {
  role: "user" | "assistant"
  content: string
}

export interface Usage {
  input_tokens?: number
  output_tokens?: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
  iterations?: (Usage & { type?: string; model?: string })[]
}

export interface StreamOutcome {
  /** True when the API answered 200 and the stream ended with message_stop. */
  ok: boolean
  /** HTTP status of the upstream response, 0 when it never answered. */
  status: number
  stopReason: string | null
  model: string | null
  usage: Usage
  /** True once any usage arrived, i.e. the request reached the model. */
  billed: boolean
  fellBack: boolean
  /** Upstream error type (never the body), for the log. */
  errorType?: string
}

const API_URL = "https://api.anthropic.com/v1/messages"
const FALLBACK_BETA = "server-side-fallback-2026-07-01"

/** Models the skill says take fallbacks: "default" on the Claude API. */
function takesFallbacks(model: string): boolean {
  if (process.env.CHAT_FALLBACKS === "off") return false
  return /^claude-(opus-5-5|opus-5|fable-5-1|sonnet-5-5)$/.test(model)
}

/** Models that reject effort, or still take temperature. */
function samplingModel(model: string): { effort: boolean; temperature: boolean } {
  if (/haiku-4-5/.test(model)) return { effort: false, temperature: true }
  if (/(opus|sonnet)-4-6/.test(model)) return { effort: true, temperature: true }
  return { effort: true, temperature: false }
}

export function buildRequest(opts: {
  model: string
  maxTokens: number
  system: string
  messages: ChatTurn[]
  fallbacks: boolean
}): { headersExtra: Record<string, string>; body: Record<string, unknown> } {
  const { model, maxTokens, system, messages, fallbacks } = opts
  const s = samplingModel(model)
  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    stream: true,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages,
  }
  if (s.effort) body.output_config = { effort: "low" }
  if (s.temperature) body.temperature = 0.2
  const headersExtra: Record<string, string> = {}
  if (fallbacks) {
    body.fallbacks = "default"
    headersExtra["anthropic-beta"] = FALLBACK_BETA
  }
  return { headersExtra, body }
}

function maxMerge(into: Usage, from: Usage | undefined): void {
  if (!from) return
  for (const k of [
    "input_tokens",
    "output_tokens",
    "cache_creation_input_tokens",
    "cache_read_input_tokens",
  ] as const) {
    const v = from[k]
    if (typeof v === "number" && v > (into[k] ?? 0)) into[k] = v
  }
  if (Array.isArray(from.iterations) && from.iterations.length) into.iterations = from.iterations
}

function costOne(u: Usage, p: Price): number {
  return (
    ((u.input_tokens ?? 0) * p.input +
      (u.output_tokens ?? 0) * p.output +
      (u.cache_creation_input_tokens ?? 0) * p.cacheWrite +
      (u.cache_read_input_tokens ?? 0) * p.cacheRead) /
    1_000_000
  )
}

function dearer(a: Price, b: Price): Price {
  return a.input + a.output >= b.input + b.output ? a : b
}

/** US dollars for one response, from its usage fields. */
export function costOf(usage: Usage, requested: string, served: string | null): number {
  const fallbackPrice = dearer(priceFor(requested), priceFor(served ?? requested))
  if (Array.isArray(usage.iterations) && usage.iterations.length) {
    return usage.iterations.reduce(
      (s, it) => s + costOne(it, it.model ? priceFor(it.model) : fallbackPrice),
      0,
    )
  }
  return costOne(usage, served ? priceFor(served) : fallbackPrice)
}

/**
 * The most one request can cost: every input token written to cache at the
 * write rate, max_tokens of output, and, when fallbacks are on, a second full
 * attempt at the fallback rate (Claude Opus 4.8's, the dearer of the two the
 * skill names as Opus 5.5's targets). The system prompt is our own English, so
 * characters over three is a generous count for it. Visitor text can be
 * anything (emoji, CJK, odd scripts can each be a token or more per UTF-16
 * unit), so it is counted at one token per character.
 */
export function worstCaseUsd(opts: {
  model: string
  /** Characters of the system prompt. */
  systemChars: number
  /** Characters of every message the visitor's browser sent. */
  turnChars: number
  maxTokens: number
  fallbacks: boolean
}): number {
  const tokens = Math.ceil(opts.systemChars / 3) + opts.turnChars
  const one = (p: Price) => (tokens * p.cacheWrite + opts.maxTokens * p.output) / 1_000_000
  return one(priceFor(opts.model)) + (opts.fallbacks ? one(priceFor("claude-opus-4-8")) : 0)
}

async function once(opts: {
  apiKey: string
  model: string
  maxTokens: number
  system: string
  messages: ChatTurn[]
  fallbacks: boolean
  signal: AbortSignal
  onText: (delta: string) => void
}): Promise<StreamOutcome> {
  const { headersExtra, body } = buildRequest(opts)
  const out: StreamOutcome = {
    ok: false,
    status: 0,
    stopReason: null,
    model: null,
    usage: {},
    billed: false,
    fellBack: false,
  }
  let res: Response
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": opts.apiKey,
        "anthropic-version": "2023-06-01",
        ...headersExtra,
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    })
  } catch {
    // Aborted (visitor left, or the timeout) while waiting for headers: the
    // request may already be with the model, so the caller charges it.
    out.errorType = opts.signal.aborted ? "aborted" : "network"
    return out
  }
  out.status = res.status
  if (!res.ok || !res.body) {
    try {
      const j = (await res.json()) as { error?: { type?: string } }
      out.errorType = j?.error?.type ?? `http_${res.status}`
    } catch {
      out.errorType = `http_${res.status}`
    }
    return out
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ""
  let stopped = false
  try {
    while (!stopped) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      let sep: RegExpMatchArray | null
      while ((sep = buf.match(/\r?\n\r?\n/)) && sep.index !== undefined) {
        const block = buf.slice(0, sep.index)
        buf = buf.slice(sep.index + sep[0].length)
        const data = block
          .split(/\r?\n/)
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).trimStart())
          .join("\n")
        if (!data) continue
        let ev: Record<string, unknown>
        try {
          ev = JSON.parse(data)
        } catch {
          continue
        }
        switch (ev.type) {
          case "message_start": {
            const m = ev.message as { model?: string; usage?: Usage } | undefined
            if (m?.model) out.model = m.model
            if (m?.usage) {
              maxMerge(out.usage, m.usage)
              out.billed = true
            }
            break
          }
          case "content_block_start": {
            const b = ev.content_block as { type?: string } | undefined
            if (b?.type === "fallback") out.fellBack = true
            break
          }
          case "content_block_delta": {
            const d = ev.delta as { type?: string; text?: string } | undefined
            if (d?.type === "text_delta" && typeof d.text === "string") opts.onText(d.text)
            break
          }
          case "message_delta": {
            const d = ev.delta as { stop_reason?: string } | undefined
            if (d?.stop_reason) out.stopReason = d.stop_reason
            if (ev.usage) {
              maxMerge(out.usage, ev.usage as Usage)
              out.billed = true
            }
            break
          }
          case "message_stop":
            out.ok = true
            stopped = true
            break
          case "error": {
            const e = ev.error as { type?: string } | undefined
            out.errorType = e?.type ?? "stream_error"
            stopped = true
            break
          }
        }
      }
    }
  } catch {
    out.errorType = out.errorType ?? "stream_interrupted"
  } finally {
    try {
      await reader.cancel()
    } catch {
      /* already closed */
    }
  }
  if (Array.isArray(out.usage.iterations) && out.usage.iterations.some((i) => i.type === "fallback_message")) {
    out.fellBack = true
  }
  return out
}

/**
 * Stream one answer. Calls onText with each text delta as it arrives. Never
 * throws; never returns an upstream error body, only its type.
 */
export async function streamAnswer(opts: {
  apiKey: string
  model: string
  maxTokens: number
  system: string
  messages: ChatTurn[]
  signal: AbortSignal
  onText: (delta: string) => void
}): Promise<StreamOutcome & { fallbacksUsed: boolean }> {
  const fallbacks = takesFallbacks(opts.model)
  const first = await once({ ...opts, fallbacks })
  // A 400 on the first try with the beta on is most likely the beta itself
  // (unbilled; a 400 never reaches the model). Try once more without it.
  if (fallbacks && first.status === 400 && !first.billed) {
    const second = await once({ ...opts, fallbacks: false })
    return { ...second, fallbacksUsed: false }
  }
  return { ...first, fallbacksUsed: fallbacks }
}

export function fallbacksEnabledFor(model: string): boolean {
  return takesFallbacks(model)
}
