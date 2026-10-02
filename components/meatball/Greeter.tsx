"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  InstrumentHead,
  InstrumentNote,
  When,
  useInstrument,
} from "@/components/kit/InstrumentStatus"
import { useSenses } from "./senses"

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
  trigger?: "manual" | "motion"
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
      if (d.status && (d.status.state === "idle" || d.status.state === "done")) {
        setBusy(false)
      }
      return d.status?.state
    } catch {
      return null
    }
  }, [])

  // steady heartbeat: surfaces auto-greets (motion-triggered) too, not just clicks
  useEffect(() => {
    fetchState()
    poll.current = setInterval(fetchState, 3000)
    return () => {
      if (poll.current) clearInterval(poll.current)
    }
  }, [fetchState])

  const sayHi = useCallback(async () => {
    setBusy(true)
    setResult(null)
    try {
      const r = await fetch("/api/greet", { method: "POST" })
      if (r.status !== 409 && !r.ok) {
        setBusy(false)
        return
      }
    } catch {
      setBusy(false)
      return
    }
    fetchState()
  }, [fetchState])

  const live = status?.state === "speaking" || status?.state === "listening"
  const phase = status ? PHASE[status.state] : ""

  // The greeter has no heartbeat of its own: it writes its status only when its
  // state changes, so an idle greeter and a dead one look the same from here.
  // What it cannot work without is the mic listener, because that is how it
  // hears a reply (greet.py reads the listener's transcript, never the mics).
  // The listener DOES heartbeat, about once a second, so that is the status
  // shown, and it is named as the listener's rather than passed off as the
  // greeter's own.
  const { senses, asked, error } = useSenses()
  const inst = useInstrument("ears", { lastHeard: senses?.ears, error, pending: !asked })
  const canHear = inst.reading?.state === "live"

  return (
    <>
    <InstrumentHead name="Presence probe" status={inst}>
      {inst.reading && !canHear && (
        <InstrumentNote>
          <b>Meatball cannot do this right now.</b> It hears a reply through the always-on mic
          listener,{" "}
          {inst.lastHeardMs != null ? (
            <>
              which last reported <When at={inst.lastHeardMs} now={inst.now} />
            </>
          ) : (
            <>which has not reported at all</>
          )}
          . The button is off until the listener is back, so that a request is not left waiting
          for a machine that cannot hear the answer.
          {result ? " The verdict below is its last one, with the time it was reached." : ""}
        </InstrumentNote>
      )}
    </InstrumentHead>
    <div className="beta-greet">
      <div className="beta-greet__row">
        <button className="beta-greet__btn" onClick={sayHi} disabled={busy || live || !canHear}>
          <span className="beta-greet__wave" aria-hidden>
            👋
          </span>
          {live ? "introducing…" : "Introduce yourself"}
        </button>
        {live ? (
          <span className="beta-greet__live">
            <span className="beta-greet__pulse" aria-hidden />
            {phase}
          </span>
        ) : null}
      </div>

      {result && !live ? (
        <div className={`beta-greet__verdict${result.present ? " is-person" : " is-empty"}`}>
          <span className="beta-greet__face" aria-hidden>
            {result.present ? "🙂" : "🦗"}
          </span>
          <div className="beta-greet__verdict-body">
            <strong>
              {result.present ? "Probably a person" : "Probably nobody"}
              {result.trigger === "motion" ? (
                <span className="beta-greet__trig">👁 saw movement, asked on its own</span>
              ) : null}
            </strong>
            {result.present && result.name ? (
              <span className="beta-greet__name">
                nice to meet you, {result.name}
              </span>
            ) : null}
            {/* A verdict is a reading, and a reading says when it was taken. */}
            <span className="beta-greet__trig">
              verdict reached <When at={result.ts} now={inst.now} />
            </span>
            {result.heard ? (
              <span className="beta-greet__heard">
                heard {result.mic ? `(${result.mic} mic)` : ""}: &ldquo;{result.heard}&rdquo;
              </span>
            ) : (
              <span className="beta-greet__heard beta-greet__heard--quiet">no reply in the room</span>
            )}
          </div>
        </div>
      ) : null}

      <p className="beta-greet__note">
        Meatball says hi through the Altec Lansings, then listens on the always-on mics. A reply →
        probably a person. Silence → probably not. It also does this on its own when the cameras
        catch someone, the simplest sensor there is.
      </p>
    </div>
    </>
  )
}
