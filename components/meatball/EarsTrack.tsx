"use client"

import { useEffect, useState } from "react"
import { Pager, usePager } from "./Pager"

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

function ago(ts: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.round(s / 60)}m ago`
  return `${Math.round(s / 3600)}h ago`
}

function MicCard({ m }: { m: Mic }) {
  const listening = m.state === "listening"
  const lo = m.baseline - 6
  const hi = m.baseline + 24
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100))
  const spec = m.spectrum?.length ? m.spectrum : [0]
  const mn = Math.min(...spec)
  const mx = Math.max(...spec, mn + 1)

  return (
    <div className="v3-ears-mic">
      <div className="v3-ears-mic__head">
        <span className="v3-ears-mic__name">{m.name}</span>
        <span className={`v3-ears-mic__state${listening ? " is-on" : ""}`}>
          <span className="v3-ears-mic__dot" aria-hidden />
          {listening ? "listening" : "idle"}
        </span>
      </div>
      <div className="v3-ears-mic__meta">
        floor {m.baseline.toFixed(0)} · now {m.level.toFixed(0)} dBFS
      </div>
      <div className="v3-ears-meter" title="level vs floor; mark = trigger threshold">
        <div
          className="v3-ears-meter__fill"
          style={{ width: `${pct(m.level)}%`, background: listening ? "var(--v3-coral, #EE766C)" : "var(--v3-gold)" }}
        />
        <div className="v3-ears-meter__thr" style={{ left: `${pct(m.baseline + 10)}%` }} />
      </div>
      <div className="v3-ears-fft" aria-hidden>
        {spec.map((v, i) => (
          <span
            key={i}
            className="v3-ears-fft__bar"
            style={{ height: `${Math.max(3, ((v - mn) / (mx - mn)) * 100)}%` }}
          />
        ))}
      </div>
      {m.last?.text ? (
        <div className="v3-ears-mic__heard">
          🗣 &ldquo;{m.last.text}&rdquo; <span className="v3-ears-mic__heard-ago">· {ago(m.last.ts)}</span>
        </div>
      ) : null}
    </div>
  )
}

export function EarsTrack() {
  const [mics, setMics] = useState<Mic[]>([])
  const [events, setEvents] = useState<Ev[]>([])
  const [dead, setDead] = useState(false)

  useEffect(() => {
    let mounted = true
    const tick = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const r = await fetch("/api/ears", { cache: "no-store" })
        const d = await r.json()
        if (!mounted) return
        setMics(d.mics || [])
        setEvents(d.events || [])
        setDead(!(d.mics && d.mics.length))
      } catch {
        if (mounted) setDead(true)
      }
    }
    tick()
    const id = setInterval(tick, 1200)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  const feed = usePager(events, 10)

  if (dead) return <div className="v3-motion__dead-box">mic listener offline</div>

  return (
    <div className="v3-ears">
      <div className="v3-ears-grid">
        {mics.map((m) => (
          <MicCard key={m.name} m={m} />
        ))}
      </div>
      {events.length ? (
        <div className="v3-ears-feed">
          <div className="v3-ears-feed__head">recent transcriptions</div>
          {feed.slice.map((e, i) => (
            <div key={`${e.ts}-${i}`} className="v3-ears-feed__row">
              <span className="v3-ears-feed__mic">{e.mic}</span>
              <span className="v3-ears-feed__text">&ldquo;{e.text}&rdquo;</span>
              <span className="v3-ears-feed__ago">{ago(e.ts)}</span>
            </div>
          ))}
          <Pager {...feed} onPage={feed.setPage} unit="lines" />
        </div>
      ) : (
        <p className="v3-motion-note">
          no transcriptions yet — speak near a mic and it&apos;ll trip the floor and land here
        </p>
      )}
    </div>
  )
}
