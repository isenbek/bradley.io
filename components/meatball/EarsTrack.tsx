"use client"

import { useEffect, useState } from "react"
import { Pager, usePager } from "./Pager"
import {
  InstrumentHead,
  InstrumentNote,
  When,
  useInstrument,
} from "@/components/kit/InstrumentStatus"
import { FRESHNESS, relOrAbs, toMs } from "@/lib/instrument-status"

// The level meters move, so a running listener is polled fast. A stopped one
// has nothing new to say, and re-reading the same 23 KB every 1.2 s for it is
// load for no information: it is asked every 10 s instead, which is still
// often enough to notice it come back within one beat.
const POLL_LIVE_MS = 1200
const POLL_IDLE_MS = 10_000

interface Mic {
  name: string
  dev: string
  baseline: number
  level: number
  state: string
  spectrum: number[]
  last: { text: string; ts: string } | null
  ts: string
}
interface Ev {
  ts: string
  mic: string
  text: string
  level: number
}

// `frozen`: the listener is not running, so this card is its last report and
// not a live level. The state word and the meter's "now" are worded as past.
function MicCard({ m, now, frozen }: { m: Mic; now: number | null; frozen: boolean }) {
  const listening = m.state === "listening"
  const lo = m.baseline - 6
  const hi = m.baseline + 24
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100))
  const spec = m.spectrum?.length ? m.spectrum : [0]
  const mn = Math.min(...spec)
  const mx = Math.max(...spec, mn + 1)

  return (
    <div className="beta-mic">
      <div className="beta-mic__head">
        <span className="beta-mic__name">{m.name}</span>
        <span className={`beta-mic__state${listening && !frozen ? " is-on" : ""}`}>
          <span className="beta-mic__dot" aria-hidden />
          {frozen ? "last report" : listening ? "listening" : "idle"}
        </span>
      </div>
      <div className="beta-mic__meta">
        floor {m.baseline.toFixed(0)} · {frozen ? "then" : "now"} {m.level.toFixed(0)} dBFS
      </div>
      <div className="beta-meter" title="level vs floor; mark = trigger threshold">
        <div
          className="beta-meter__fill"
          style={{ width: `${pct(m.level)}%`, background: listening ? "var(--color-orange)" : "var(--color-mustard)" }}
        />
        <div className="beta-meter__thr" style={{ left: `${pct(m.baseline + 10)}%` }} />
      </div>
      <div className="beta-fft" aria-hidden>
        {spec.map((v, i) => (
          <span
            key={i}
            className="beta-fft__bar"
            style={{ height: `${Math.max(3, ((v - mn) / (mx - mn)) * 100)}%` }}
          />
        ))}
      </div>
      {m.last?.text ? (
        <div className="beta-mic__heard">
          🗣 &ldquo;{m.last.text}&rdquo;{" "}
          <span className="beta-mic__heard-ago">· {relOrAbs(m.last.ts, now)}</span>
        </div>
      ) : null}
    </div>
  )
}

export function EarsTrack() {
  const [mics, setMics] = useState<Mic[]>([])
  const [events, setEvents] = useState<Ev[]>([])
  // The latest poll failed.
  const [dead, setDead] = useState(false)
  // The first poll has come back, one way or the other.
  const [asked, setAsked] = useState(false)

  useEffect(() => {
    let mounted = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = async () => {
      // Assume idle until an answer proves the listener is writing.
      let delay = POLL_IDLE_MS
      if (document.visibilityState !== "hidden") {
        try {
          const r = await fetch("/api/ears", { cache: "no-store" })
          const d = await r.json()
          if (!mounted) return
          const list: Mic[] = d.mics || []
          setMics(list)
          setEvents(d.events || [])
          setDead(false)
          const heard = Math.max(0, ...list.map((m) => toMs(m.ts) ?? 0))
          if (heard > 0 && (Date.now() - heard) / 1000 <= FRESHNESS.ears.offlineAfterS) {
            delay = POLL_LIVE_MS
          }
        } catch {
          if (mounted) setDead(true)
        }
        if (mounted) setAsked(true)
      }
      // Always rescheduled, whatever happened above, so the board recovers by
      // itself when the listener returns or the tab comes back.
      if (mounted) timer = setTimeout(tick, delay)
    }
    tick()
    return () => {
      mounted = false
      if (timer) clearTimeout(timer)
    }
  }, [])

  const feed = usePager(events, 10)

  // Last heard is the newest status any mic wrote. The listener rewrites each
  // one about once a second, and /api/ears serves the files for as long as they
  // exist, so the stamp inside them is the only sign of whether it is running.
  const newest = Math.max(0, ...mics.map((m) => toMs(m.ts) ?? 0)) || null
  const inst = useInstrument("ears", { lastHeard: newest, error: dead, pending: !asked })
  const live = inst.reading?.state === "live"
  const frozen = inst.reading !== null && !live

  return (
    <>
    <InstrumentHead name="Mic listener" status={inst}>
      {frozen && (
        <InstrumentNote>
          {newest == null ? (
            <>
              <b>The mic listener has nothing to report.</b> It has written no status files, so
              there are no levels to show.
            </>
          ) : (
            <>
              <b>The mic listener is not running.</b> Its last report was{" "}
              <When at={newest} now={inst.now} />. The levels and spectra below are that last
              report, frozen. Nothing is being heard right now.
            </>
          )}{" "}
          This board keeps asking and resumes by itself when the listener does.
        </InstrumentNote>
      )}
    </InstrumentHead>
    <div className="beta-ears">
      <div className="beta-ears-grid">
        {mics.map((m) => (
          <MicCard key={m.name} m={m} now={inst.now} frozen={frozen} />
        ))}
      </div>
      {events.length ? (
        <div className="beta-feed">
          <div className="beta-feed__head">
            {frozen ? "last transcriptions on record" : "recent transcriptions"}
          </div>
          {feed.slice.map((e, i) => (
            <div key={`${e.ts}-${i}`} className="beta-feed__row">
              <span className="beta-feed__mic">{e.mic}</span>
              <span className="beta-feed__text">&ldquo;{e.text}&rdquo;</span>
              <span className="beta-feed__ago">{relOrAbs(e.ts, inst.now)}</span>
            </div>
          ))}
          <Pager {...feed} onPage={feed.setPage} unit="lines" />
        </div>
      ) : (
        <p className="beta-motion-note">
          {live
            ? "no transcriptions yet. Speak near a mic and it'll trip the floor and land here"
            : "no transcriptions on record"}
        </p>
      )}
    </div>
    </>
  )
}
