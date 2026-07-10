"use client"

import { useEffect, useState } from "react"
import { Pager, usePager } from "./Pager"

interface Ev {
  ts: string
  cam: string
  label: string
  delta: number
  img: string
}

function Thumb({ img, label }: { img: string; label: string }) {
  const [ok, setOk] = useState(true)
  if (!img || !ok) return <div className="v3-log__thumb v3-log__thumb--missing">no preview</div>
  return (
    <img
      className="v3-log__thumb"
      src={`/event-thumb.jpg?f=${encodeURIComponent(img)}`}
      alt={label}
      loading="lazy"
      onError={() => setOk(false)}
    />
  )
}

function ago(ts: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.round(s / 60)}m ago`
  if (s < 86400) return `${Math.round(s / 3600)}h ago`
  return `${Math.round(s / 86400)}d ago`
}

export function EventLog() {
  const [events, setEvents] = useState<Ev[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    const tick = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const r = await fetch("/api/events", { cache: "no-store" })
        const d = await r.json()
        if (mounted) {
          setEvents(d.events || [])
          setLoaded(true)
        }
      } catch {
        if (mounted) setLoaded(true)
      }
    }
    tick()
    const id = setInterval(tick, 8000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  const pager = usePager(events, 10)

  if (loaded && events.length === 0) {
    return (
      <div className="v3-log__empty">
        Nothing logged yet. The cameras have been still. Walk past one and Meatball will note what
        it saw, right here.
      </div>
    )
  }

  return (
    <>
      <ol className="v3-log">
        {pager.slice.map((e, i) => (
          <li key={`${e.ts}-${i}`} className="v3-log__row">
            <Thumb img={e.img} label={e.label} />
            <div className="v3-log__body">
              <div className="v3-log__label">👁 {e.label}</div>
              <div className="v3-log__meta">
                {e.cam} · Δ {Number(e.delta).toFixed(1)} · {ago(e.ts)}
              </div>
            </div>
            <time className="v3-log__time" dateTime={e.ts}>
              {new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </time>
          </li>
        ))}
      </ol>
      <Pager {...pager} onPage={pager.setPage} unit="events" />
    </>
  )
}
