"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface Status {
  state: "idle" | "speaking" | "listening" | "done"
  nonce?: number
  verdict?: string
  heard?: string | null
  name?: string | null
}
interface Result {
  present: boolean
  verdict: string
  heard: string | null
  name: string | null
  mic: string | null
  ts: string
  nonce?: number
}

const PHASE: Record<string, string> = {
  speaking: "saying hello…",
  listening: "listening for a reply…",
  idle: "",
  done: "",
}

export function Greeter() {
  const [status, setStatus] = useState<Status | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const poll = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchState = useCallback(async () => {
    try {
      const r = await fetch("/api/greet", { cache: "no-store" })
      const d = await r.json()
      setStatus(d.status)
      setResult(d.result)
      // stop fast-polling once the run settles
      if (d.status && (d.status.state === "idle" || d.status.state === "done")) {
        setBusy(false)
        if (poll.current) {
          clearInterval(poll.current)
          poll.current = null
        }
      }
      return d.status?.state
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    fetchState()
    return () => {
      if (poll.current) clearInterval(poll.current)
    }
  }, [fetchState])

  const sayHi = useCallback(async () => {
    setBusy(true)
    setResult(null)
    try {
      const r = await fetch("/api/greet", { method: "POST" })
      if (r.status === 409) {
        setBusy(true) // already running — just watch it
      } else if (!r.ok) {
        setBusy(false)
        return
      }
    } catch {
      setBusy(false)
      return
    }
    // poll the watcher until it settles
    if (poll.current) clearInterval(poll.current)
    poll.current = setInterval(fetchState, 800)
  }, [fetchState])

  const live = status?.state === "speaking" || status?.state === "listening"
  const phase = status ? PHASE[status.state] : ""

  return (
    <div className="v3-greet">
      <div className="v3-greet__row">
        <button className="v3-greet__btn" onClick={sayHi} disabled={busy || live}>
          <span className="v3-greet__wave" aria-hidden>
            👋
          </span>
          {live ? "introducing…" : "Introduce yourself"}
        </button>
        {live ? (
          <span className="v3-greet__live">
            <span className="v3-greet__pulse" aria-hidden />
            {phase}
          </span>
        ) : null}
      </div>

      {result && !live ? (
        <div className={`v3-greet__verdict${result.present ? " is-person" : " is-empty"}`}>
          <span className="v3-greet__face" aria-hidden>
            {result.present ? "🙂" : "🦗"}
          </span>
          <div className="v3-greet__verdict-body">
            <strong>{result.present ? "Probably a person" : "Probably nobody"}</strong>
            {result.present && result.name ? (
              <span className="v3-greet__name">
                nice to meet you, {result.name}
              </span>
            ) : null}
            {result.heard ? (
              <span className="v3-greet__heard">
                heard {result.mic ? `(${result.mic} mic)` : ""}: &ldquo;{result.heard}&rdquo;
              </span>
            ) : (
              <span className="v3-greet__heard v3-greet__heard--quiet">no reply in the room</span>
            )}
          </div>
        </div>
      ) : null}

      <p className="v3-greet__note">
        Meatball says hi through the Altec Lansings, then listens on the always-on mics. A reply →
        probably a person. Silence → probably not. The simplest sensor there is.
      </p>
    </div>
  )
}
