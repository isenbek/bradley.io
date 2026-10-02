"use client"

import { useEffect, useRef, useState } from "react"
import {
  InstrumentHead,
  InstrumentNote,
  When,
  useInstrument,
} from "@/components/kit/InstrumentStatus"
import { FRESHNESS, absDateTime, relOrAbs, toMs } from "@/lib/instrument-status"

interface Latest {
  ts: string
  cam: string
  delta: number
  w: number
  h: number
  grid: number[]
  bbox: number[] | null
  peak: number[] | null
}
interface Cam {
  name: string
  latest: Latest
  history: { ts: string; delta: number }[]
  label: { label: string; delta: number; ts: string } | null
}

const FLOOR = 6 // motion threshold above the sensor-noise floor (~4 to 6)

function CamPanel({ cam, now }: { cam: Cam; now: number | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { latest, history, name } = cam
  // Each camera is judged on its own clock. One can be current while the other
  // has been unplugged for months, and the board's one status tag cannot say
  // that, so a camera whose last comparison is late says so on its own panel.
  const capturedMs = toMs(latest?.ts)
  const late =
    now != null && capturedMs != null && (now - capturedMs) / 1000 > FRESHNESS.motion.staleAfterS
  // The images are keyed on the comparison's own timestamp rather than on the
  // poll, so a frame that has not changed is not fetched again every 10 s.
  const nonce = capturedMs ?? 0

  useEffect(() => {
    const c = canvasRef.current
    if (!c || !latest?.grid?.length) return
    const { w, h, grid, bbox } = latest
    c.width = w
    c.height = h
    const ctx = c.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = grid[y * w + x]
        const a = Math.min(0.72, Math.max(0, (v - 8) / 60))
        if (a <= 0.02) continue
        const heat = Math.min(1, v / 80)
        ctx.fillStyle = `rgba(255, ${Math.round(190 - 150 * heat)}, 50, ${a})`
        ctx.fillRect(x, y, 1, 1)
      }
    }
    if (bbox) {
      ctx.strokeStyle = "rgba(255, 90, 90, 0.95)"
      ctx.lineWidth = 0.35
      ctx.strokeRect(bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1])
    }
  }, [latest])

  const deltas = history.map((r) => r.delta)
  const max = Math.max(8, ...deltas)
  const pts =
    deltas.length > 1
      ? deltas
          .map((d, i) => `${((i / (deltas.length - 1)) * 100).toFixed(2)},${(100 - (d / max) * 100).toFixed(2)}`)
          .join(" ")
      : ""
  const cur = latest?.delta ?? 0
  const moving = cur > FLOOR

  return (
    <div className="beta-motioncam">
      <div className="beta-motioncam__head">
        <span className="beta-motioncam__name">{name}</span>
        <span className="beta-motioncam__peak">
          {late && capturedMs != null
            ? `captured ${absDateTime(capturedMs)}`
            : `peak ${max.toFixed(1)} · ${deltas.length} samples`}
        </span>
      </div>
      <div className="beta-motioncam__imgs">
        <div className="beta-motion__frame">
          <img src={`/delta-frame.jpg?cam=${name}&t=${nonce}`} alt={`${name} camera frame with motion heatmap`} />
          <canvas ref={canvasRef} className="beta-motion__heat" />
          <span className={`beta-motion__badge${moving ? " is-moving" : ""}`}>
            <span className="beta-motion__dot" aria-hidden />Δ {cur.toFixed(1)} · {moving ? "motion" : "still"}
          </span>
          {cam.label?.label ? (
            <span className="beta-motion__seen">
              👁 {cam.label.label}{" "}
              <span className="beta-motion__seen-ago">· {relOrAbs(cam.label.ts, now)}</span>
            </span>
          ) : null}
        </div>
        <div className="beta-motion__frame">
          <img src={`/delta-diff.jpg?cam=${name}&t=${nonce}`} alt={`${name} subtracted difference image`} />
          <span className="beta-motion__sublabel">subtracted</span>
        </div>
      </div>
      {pts ? (
        <svg className="beta-motion__curve" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <polyline points={pts} fill="none" />
        </svg>
      ) : null}
    </div>
  )
}

export function MotionTrack() {
  const [cams, setCams] = useState<Cam[]>([])
  // The latest poll failed.
  const [dead, setDead] = useState(false)
  // The first poll has come back, one way or the other.
  const [asked, setAsked] = useState(false)

  useEffect(() => {
    let mounted = true
    const tick = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const r = await fetch("/api/delta", { cache: "no-store" })
        if (!r.ok) throw new Error("offline")
        const d = await r.json()
        if (!mounted) return
        const list: Cam[] = d.cams || []
        setCams(list)
        setDead(false)
      } catch {
        if (mounted) setDead(true)
      }
      if (mounted) setAsked(true)
    }
    tick()
    const id = setInterval(tick, 10000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  // Last heard is the newest comparison from any camera. /api/delta answers 200
  // for as long as the files exist, so the timestamp inside them is the only
  // thing that says whether the tracker is still running.
  const newest = Math.max(0, ...cams.map((c) => toMs(c.latest?.ts) ?? 0)) || null
  const inst = useInstrument("motion", { lastHeard: newest, error: dead, pending: !asked })
  const live = inst.reading?.state === "live"

  return (
    <>
      <InstrumentHead name="Motion tracker" status={inst}>
        {inst.reading && !live && (
          <InstrumentNote>
            {newest == null ? (
              <>
                <b>The motion tracker has nothing to report.</b> Its data files are missing or
                unreadable.
              </>
            ) : (
              <>
                <b>The motion tracker is not running.</b> It last compared frames{" "}
                <When at={newest} now={inst.now} />. The frames, heatmaps and curves below are
                from then, kept because they are the last true reading, and each camera is
                labelled with its own capture time.
              </>
            )}{" "}
            This board asks again every 10 seconds and resumes by itself when the tracker does.
          </InstrumentNote>
        )}
      </InstrumentHead>
      {cams.length > 0 && (
        <div className="beta-motion-grid">
          {cams.map((c) => (
            <CamPanel key={c.name} cam={c} now={inst.now} />
          ))}
          <p className="beta-motion-note">
            each camera, every ~10s · left = frame + heatmap (where it changed) · right = the raw
            subtraction · line = motion over time
          </p>
        </div>
      )}
    </>
  )
}
