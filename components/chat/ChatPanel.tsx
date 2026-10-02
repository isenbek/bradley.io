"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * The chat on /ask. The conversation is machine output, so it sits on a panel;
 * the question box is the visitor writing, so it sits on paper under it.
 *
 * Talks to app/api/chat/route.ts: GET once on load for whether the chat is on
 * and how many questions are left; POST per question, read as NDJSON while it
 * streams. When the chat is off, at its limit, or out of budget, the panel
 * says so in the same box the answers would fill, and the ways in (resume,
 * PDF, email) are links, so nothing moves when the state changes.
 *
 * Accessibility: the transcript is role="log" (polite); the answer being
 * written carries aria-busy until it is complete, so a screen reader reads it
 * once, whole, instead of a word at a time. Enter sends, Shift+Enter is a new
 * line, Escape stops an answer.
 */

type Role = "user" | "assistant"

interface Msg {
  id: number
  role: Role
  content: string
  /** A calm system notice (limit, off, error) shown as an answer. */
  notice?: boolean
  note?: string
  streaming?: boolean
}

interface Remaining {
  hour: number
  day: number
}

type Status = "loading" | "on" | "off" | "closed" | "budget"

const DISCLOSURE = "Claude, an AI, answering from Bradley's resume. It can be wrong; the resume is the record."

const SUGGESTIONS = [
  "What is Bradley working on now?",
  "Is he looking for a full-time role?",
  "What has he built with AI?",
  "How large were the data systems he ran?",
]

const MAX_INPUT = 600
const HISTORY = 6

/* ------------------------------------------------------------------------ */
/* Text: paragraphs, "- " lists, and links to evidence. No HTML is injected. */

const LINK = /(https:\/\/[^\s<>"]+|mailto:[^\s<>"]+|[\w.+-]+@bradley\.io|\/[a-z0-9][a-z0-9\-/]*(?:\.pdf)?)/gi
const TRAIL = /[.,;:!?)\]]+$/

function linkify(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  let last = 0
  let n = 0
  for (const m of text.matchAll(LINK)) {
    const at = m.index ?? 0
    const before = at > 0 ? text[at - 1] : " "
    let token = m[0]
    // A site path only counts at the start of a word ("see /resume"), not
    // inside one ("and/or").
    if (token.startsWith("/") && !/[\s("'[]/.test(before)) continue
    const trail = token.match(TRAIL)?.[0] ?? ""
    if (trail) token = token.slice(0, -trail.length)
    if (!token || token === "/") continue
    if (at > last) out.push(text.slice(last, at))
    let href = token
    if (/^[\w.+-]+@bradley\.io$/i.test(token)) href = `mailto:${token}`
    const external = href.startsWith("https://")
    out.push(
      <a
        key={`${key}-${n++}`}
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {token.replace(/^mailto:/, "")}
      </a>,
    )
    if (trail) out.push(trail)
    last = at + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function Rich({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim())
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split("\n").filter((l) => l.trim())
        if (lines.length && lines.every((l) => /^\s*[-*] /.test(l))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{linkify(l.replace(/^\s*[-*] /, ""), `${i}-${j}`)}</li>
              ))}
            </ul>
          )
        }
        return <p key={i}>{linkify(b, String(i))}</p>
      })}
    </>
  )
}

/* ------------------------------------------------------------------------ */

function remainingLabel(r: Remaining | null, status: Status): string {
  if (status === "loading") return "Checking"
  if (status === "off") return "Not switched on"
  if (status === "closed") return "Closed"
  if (status === "budget") return "Resting until tomorrow"
  if (!r) return ""
  const left = Math.min(r.hour, r.day)
  if (left <= 0) return "None left for now"
  return `${left} left${r.hour <= r.day ? " this hour" : " today"}`
}

/** User and answer pairs only: notices and unanswered questions stay out. */
function historyFor(msgs: Msg[]): { role: Role; content: string }[] {
  const pairs: { role: Role; content: string }[] = []
  for (let i = 0; i < msgs.length - 1; i++) {
    const q = msgs[i]
    const a = msgs[i + 1]
    if (q.role === "user" && a.role === "assistant" && !a.notice && !a.streaming && a.content.trim()) {
      pairs.push({ role: "user", content: q.content }, { role: "assistant", content: a.content })
      i++
    }
  }
  return pairs
}

export function ChatPanel() {
  const [status, setStatus] = useState<Status>("loading")
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<Remaining | null>(null)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const nextId = useRef(1)
  const abortRef = useRef<AbortController | null>(null)
  const logRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    let alive = true
    fetch("/api/chat", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { status?: Status; message?: string | null; remaining?: Remaining | null }) => {
        if (!alive) return
        setStatus(j.status ?? "closed")
        setStatusMsg(j.message ?? null)
        setRemaining(j.remaining ?? null)
      })
      .catch(() => {
        if (!alive) return
        setStatus("closed")
        setStatusMsg(null)
      })
    return () => {
      alive = false
      abortRef.current?.abort()
    }
  }, [])

  // Keep the newest line in view while an answer streams, unless the visitor
  // has scrolled up to read something earlier.
  const stick = useRef(true)
  useEffect(() => {
    const el = logRef.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [msgs])

  const patchLast = useCallback((fn: (m: Msg) => Msg) => {
    setMsgs((prev) => (prev.length ? [...prev.slice(0, -1), fn(prev[prev.length - 1])] : prev))
  }, [])

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim()
      if (!q || busy || status !== "on") return
      if (q.length > MAX_INPUT) return
      const history = [...historyFor(msgs), { role: "user" as Role, content: q }].slice(-HISTORY)
      setMsgs((prev) => [
        ...prev,
        { id: nextId.current++, role: "user", content: q },
        { id: nextId.current++, role: "assistant", content: "", streaming: true },
      ])
      setInput("")
      setBusy(true)
      stick.current = true
      const ac = new AbortController()
      abortRef.current = ac
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: ac.signal,
        })
        const type = res.headers.get("content-type") ?? ""
        if (!res.ok || type.includes("application/json")) {
          let j: { message?: string; code?: string; remaining?: Remaining } = {}
          try {
            j = await res.json()
          } catch {
            /* fall through to the generic line */
          }
          if (j.remaining) setRemaining(j.remaining)
          if (j.code === "off" || j.code === "closed" || j.code === "budget") {
            setStatus(j.code)
            setStatusMsg(j.message ?? null)
          }
          patchLast((m) => ({
            ...m,
            streaming: false,
            notice: true,
            content: j.message ?? "The answer did not come through. The resume is the record: /resume, or email brad@bradley.io.",
          }))
          return
        }
        const reader = res.body?.getReader()
        if (!reader) throw new Error("no body")
        const dec = new TextDecoder()
        let buf = ""
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })
          let nl: number
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim()
            buf = buf.slice(nl + 1)
            if (!line) continue
            let ev: { t?: string; v?: string; remaining?: Remaining; note?: string }
            try {
              ev = JSON.parse(line)
            } catch {
              continue
            }
            if (ev.t === "text" && ev.v) {
              const v = ev.v
              patchLast((m) => ({ ...m, content: m.content + v }))
            } else if (ev.t === "reset") {
              const v = ev.v ?? ""
              patchLast((m) => ({ ...m, content: v, notice: true }))
            } else if (ev.t === "done") {
              if (ev.remaining) setRemaining(ev.remaining)
              const note = ev.note
              patchLast((m) => ({ ...m, streaming: false, ...(note ? { note } : {}) }))
            }
          }
        }
        patchLast((m) => ({ ...m, streaming: false }))
      } catch {
        patchLast((m) =>
          m.content
            ? { ...m, streaming: false, note: ac.signal.aborted ? "Stopped." : "The answer stopped partway." }
            : {
                ...m,
                streaming: false,
                notice: true,
                content: ac.signal.aborted
                  ? "Stopped."
                  : "The answer did not come through. The resume is the record: /resume, or email brad@bradley.io.",
              },
        )
      } finally {
        abortRef.current = null
        setBusy(false)
        inputRef.current?.focus()
      }
    },
    [busy, msgs, patchLast, status],
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const on = status === "on"
  const left = remaining ? Math.min(remaining.hour, remaining.day) : 0
  const canAsk = on && !busy && left > 0
  const over = input.length > MAX_INPUT

  return (
    <section className="beta-chat" aria-label="Ask about Bradley">
      <div className="panel">
        <div className="panel-face beta-chat-face">
          <div className="panel-bar">
            <b>Ask</b>
            <span className="beta-chat-left" aria-live="polite">
              {remainingLabel(remaining, status)}
            </span>
          </div>
          <p className="beta-chat-disclose">{DISCLOSURE}</p>
          <div
            className="beta-chat-log"
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Conversation"
            tabIndex={0}
            onScroll={(e) => {
              const el = e.currentTarget
              stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
            }}
          >
            {msgs.length === 0 ? (
              <div className="beta-chat-empty">
                {status === "loading" ? (
                  <p>Checking whether the chat is on.</p>
                ) : on ? (
                  <p>
                    Ask about Bradley&apos;s work, his experience, or what he is building now. Answers come
                    from the resume and this site, with links to the evidence.
                  </p>
                ) : (
                  <Rich
                    text={
                      statusMsg ??
                      "The chat cannot take questions right now. The resume is the record: /resume, or the PDF at /resume.pdf. Or email Bradley at brad@bradley.io."
                    }
                  />
                )}
              </div>
            ) : (
              msgs.map((m) => (
                <div
                  key={m.id}
                  className={`beta-chat-msg beta-chat-msg--${m.role}${m.notice ? " beta-chat-msg--notice" : ""}`}
                  aria-busy={m.streaming ? true : undefined}
                >
                  <span className="beta-chat-who">{m.role === "user" ? "You" : "Claude"}</span>
                  <div className="beta-chat-text">
                    {m.content ? (
                      m.role === "user" ? <p>{m.content}</p> : <Rich text={m.content} />
                    ) : m.streaming ? (
                      <p className="beta-chat-wait">Reading the resume</p>
                    ) : null}
                    {m.note ? <p className="beta-chat-note">{m.note}</p> : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="beta-chat-suggest" aria-label="Suggested questions" role="group">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="btn btn-ghost" disabled={!canAsk} onClick={() => ask(s)}>
            {s}
          </button>
        ))}
      </div>

      <form
        className="beta-chat-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!over) ask(input)
        }}
      >
        <div className={`field${over ? " bad" : ""}`}>
          <label htmlFor="beta-chat-q">Your question</label>
          <textarea
            id="beta-chat-q"
            ref={inputRef}
            className="input beta-chat-input"
            rows={3}
            value={input}
            disabled={!on}
            maxLength={MAX_INPUT + 200}
            placeholder={on ? "What would you like to know about Bradley?" : "The chat is not taking questions"}
            aria-describedby="beta-chat-hint"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                if (!over && canAsk) ask(input)
              } else if (e.key === "Escape" && busy) {
                e.preventDefault()
                stop()
              }
            }}
          />
          <p className="hint" id="beta-chat-hint">
            {over
              ? `Questions are limited to ${MAX_INPUT} characters; this one is ${input.length}.`
              : `Enter to send, Shift+Enter for a new line. ${input.length} of ${MAX_INPUT}.`}
          </p>
        </div>
        <div className="toolbar">
          {/* One slot: Ask, or Stop while an answer is being written, so the
              row never reflows and never carries an empty gap. */}
          {busy ? (
            <button type="button" className="btn btn-ghost" onClick={stop}>
              Stop
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={!canAsk || !input.trim() || over}>
              Ask
            </button>
          )}
          <a className="beta-chat-way" href="/resume">
            The resume
          </a>
          <a className="beta-chat-way" href="/resume.pdf">
            PDF
          </a>
          <a className="beta-chat-way" href="mailto:brad@bradley.io">
            brad@bradley.io
          </a>
        </div>
      </form>
    </section>
  )
}
