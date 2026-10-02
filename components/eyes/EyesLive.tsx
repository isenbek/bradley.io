"use client"

import { useEffect, useRef, useState } from "react"
import {
  InstrumentHead,
  InstrumentNote,
  When,
  useInstrument,
} from "@/components/kit/InstrumentStatus"
import { absDateTime, ageWords } from "@/lib/instrument-status"

// Frame viewer. Polls /api/eyes/meta for the newest snapshot epoch and only
// swaps the <img> when a fresh frame has actually landed (cache-busted by epoch),
// so we never re-fetch the same JPEG. Visibility-gated.
//
// /api/eyes answers 200 for as long as latest.jpg exists, which is for ever. So
// "the route answered" says nothing about whether the camera is attached, and
// this used to print "live" over a frame that was three weeks old. The frame's
// own capture time is the only thing that knows, so that is what decides the
// status, and a stale frame stays on screen (it is still a true photograph)
// labelled with when it was taken instead of how fresh the page is.
interface Meta {
  ts: string
  epoch: number
  size: string
  bytes: number
  device: string
}

const POLL_MS = 15_000

export function EyesLive() {
  const [meta, setMeta] = useState<Meta | null>(null)
  const [src, setSrc] = useState<string | null>(null)
  // The latest attempt to read the frame's metadata failed.
  const [err, setErr] = useState(false)
  // The first attempt has come back, one way or the other.
  const [asked, setAsked] = useState(false)
  const epochRef = useRef<number>(0)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()
    const tick = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const r = await fetch("/api/eyes/meta", { cache: "no-store", signal: ctrl.signal })
        if (!r.ok) throw new Error("no frame")
        const m: Meta = await r.json()
        if (!mounted) return
        setErr(false)
        setMeta(m)
        if (m.epoch !== epochRef.current) {
          epochRef.current = m.epoch
          setSrc(`/api/eyes?t=${m.epoch}`)
        }
      } catch {
        if (mounted) setErr(true)
      }
      if (mounted) setAsked(true)
    }
    tick()
    // Keeps running whatever the answer, so the board picks the camera back up
    // by itself when frames resume.
    const id = setInterval(tick, POLL_MS)
    return () => {
      mounted = false
      ctrl.abort()
      clearInterval(id)
    }
  }, [])

  // epoch is in seconds; the status hook normalises it.
  const inst = useInstrument("camera", {
    lastHeard: meta?.epoch,
    error: err,
    pending: !asked,
    tickMs: 5_000,
  })
  const live = inst.reading?.state === "live"
  const capturedMs = inst.lastHeardMs

  return (
    <InstrumentHead name="Camera" status={inst}>
      {inst.reading && !live && (
        <InstrumentNote>
          {capturedMs == null ? (
            <>
              <b>The camera has no frame to give.</b> The snapshot file is missing or unreadable,
              so there is nothing to show.
            </>
          ) : inst.reading.state === "stale" ? (
            <>
              <b>The newest frame is late.</b> The camera normally delivers one a minute, and this
              one was captured <When at={capturedMs} now={inst.now} />.
            </>
          ) : (
            <>
              <b>The camera is not delivering frames.</b> The picture below is the last one it
              took, captured <When at={capturedMs} now={inst.now} />. It is not the room as it is
              now.
            </>
          )}{" "}
          This page checks every 15 seconds and resumes by itself when frames do.
        </InstrumentNote>
      )}

      <div className="beta-cam">
        {src ? (
          <img
            className="beta-cam__frame"
            src={src}
            alt={
              live
                ? "Live camera frame from the bradley.io box"
                : capturedMs != null
                  ? `Camera frame from the bradley.io box, captured ${absDateTime(capturedMs)}`
                  : "Camera frame from the bradley.io box"
            }
          />
        ) : (
          <div className="beta-cam__warm">
            {asked ? (
              "no frame to show"
            ) : (
              <>
                <span className="beta-cam__warm-dot" aria-hidden />
                asking for the newest frame
              </>
            )}
          </div>
        )}

        {/* The blue dot is ACTIVE, so it is shown only while the frame is. */}
        {live && (
          <div className="beta-cam__hud beta-cam__hud--tl">
            <span className="beta-cam__live">
              <span className="beta-cam__dot" aria-hidden />
              live
            </span>
          </div>
        )}

        {meta && (
          <div className="beta-cam__hud beta-cam__hud--tr">
            <span className="beta-cam__meta">{meta.device}</span>
            <span className="beta-cam__meta beta-cam__meta--dim">{meta.size}</span>
          </div>
        )}

        {meta && capturedMs != null && (
          <div className="beta-cam__hud beta-cam__hud--b">
            {live && inst.reading?.ageS != null ? (
              <>
                <span className="beta-cam__cap">captured {ageWords(inst.reading.ageS)} ago</span>
                <span className="beta-cam__cap beta-cam__cap--dim">· new frame every ~60s</span>
              </>
            ) : (
              <span className="beta-cam__cap">captured {absDateTime(capturedMs)}</span>
            )}
          </div>
        )}
      </div>
    </InstrumentHead>
  )
}
