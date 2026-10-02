"use client"

import { useEffect, useState } from "react"
import { Pager, usePager } from "./Pager"
import {
  InstrumentHead,
  InstrumentNote,
  When,
  useInstrument,
} from "@/components/kit/InstrumentStatus"
import { relOrAbs } from "@/lib/instrument-status"
import { useSenses } from "./senses"

interface Ev {
  ts: string
  cam: string
  label: string
  delta: number
  img: string
}

function Thumb({ img, label }: { img: string; label: string }) {
  const [ok, setOk] = useState(true)
  if (!img || !ok) return <div className="beta-log__thumb beta-log__thumb--missing">no preview</div>
  return (
    <img
      className="beta-log__thumb"
      src={`/event-thumb.jpg?f=${encodeURIComponent(img)}`}
      alt={label}
      loading="lazy"
      onError={() => setOk(false)}
    />
  )
}

// The row's own timestamp. Date and time, because the log is not always today:
// a bare "10:50 PM" on a three-week-old entry reads as last night.
function stamp(ts: string): string {
  return new Date(ts).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
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

  // A log's newest entry being old proves nothing by itself: perhaps nothing
  // moved. What the reader needs is whether the thing that WRITES the log is
  // still running, and that is the motion tracker's heartbeat.
  const { senses, asked, error } = useSenses()
  const inst = useInstrument("motion", { lastHeard: senses?.motion, error, pending: !asked })
  const live = inst.reading?.state === "live"

  const head = (
    <InstrumentHead name="Motion log" status={inst}>
      {inst.reading && !live && (
        <InstrumentNote>
          <b>Nothing new is being logged.</b> The motion tracker that writes this log{" "}
          {inst.lastHeardMs != null ? (
            <>
              last ran <When at={inst.lastHeardMs} now={inst.now} />
            </>
          ) : (
            <>is not reporting</>
          )}
          .{" "}
          {events.length > 0
            ? "The entries below are the record up to then, each with its own time."
            : "There are no entries on record."}{" "}
          This page keeps asking and resumes by itself when the tracker does.
        </InstrumentNote>
      )}
    </InstrumentHead>
  )

  if (loaded && events.length === 0) {
    return (
      <>
        {head}
        {live && (
          <div className="beta-log__empty">
            Nothing logged yet. The cameras have been still. Walk past one and Meatball will note
            what it saw, right here.
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {head}
      <ol className="beta-log">
        {pager.slice.map((e, i) => (
          <li key={`${e.ts}-${i}`} className="beta-log__row">
            <Thumb img={e.img} label={e.label} />
            <div className="beta-log__body">
              <div className="beta-log__label">👁 {e.label}</div>
              <div className="beta-log__meta">
                {e.cam} · Δ {Number(e.delta).toFixed(1)} · {relOrAbs(e.ts, inst.now)}
              </div>
            </div>
            <time className="beta-log__time" dateTime={e.ts}>
              {stamp(e.ts)}
            </time>
          </li>
        ))}
      </ol>
      <Pager {...pager} onPage={pager.setPage} unit="events" />
    </>
  )
}
