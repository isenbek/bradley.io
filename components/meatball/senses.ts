"use client"

import { useEffect, useState } from "react"

/**
 * Meatball's heartbeats: when each sense last wrote anything.
 *
 * Every meatball route serves files out of one cache directory and answers 200
 * for as long as the file exists, so none of them can tell a running service
 * from one that stopped three weeks ago. /api/eyes/meta adds the file mtimes,
 * and this hook is how the boards read them.
 *
 * It matters most for the two boards that are LOGS (the event log, the memory
 * timeline). A log's newest entry being old proves nothing: maybe nothing
 * happened. Whether the thing that writes the log is still running is a
 * separate fact, and it is the one the reader needs.
 */
export interface Senses {
  /** latest.jpg: the snapshot timer, one frame a minute. A heartbeat. */
  camera: string | null
  /** delta-*-latest.json: the motion tracker, every ~10 s. A heartbeat. */
  motion: string | null
  /** ears-*.json: the mic listener, about once a second. A heartbeat. */
  ears: string | null
  /** greet-status.json: written on state changes only. Not a heartbeat. */
  greeter: string | null
  /** events.jsonl: appended when motion is named. Not a heartbeat. */
  events: string | null
  /** moments.jsonl: appended when a moment is kept. Not a heartbeat. */
  moments: string | null
}

export interface CameraMeta {
  ts?: string
  epoch?: number
  size?: string
  device?: string
}

export interface SensesState {
  senses: Senses | null
  /** latest.json's own fields, when there is a frame. */
  meta: CameraMeta | null
  /** The first attempt has come back, one way or the other. */
  asked: boolean
  /** The latest attempt failed, or the server did not report heartbeats. */
  error: boolean
}

/**
 * Poll the heartbeats. Never stops, so a board recovers by itself when the
 * hardware comes back. The route answers 503 when there is no frame but still
 * carries `senses`, so the body is read whatever the status.
 */
export function useSenses(pollMs = 15_000): SensesState {
  const [state, setState] = useState<SensesState>({
    senses: null,
    meta: null,
    asked: false,
    error: false,
  })

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()
    const tick = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const r = await fetch("/api/eyes/meta", { cache: "no-store", signal: ctrl.signal })
        const d = (await r.json()) as (CameraMeta & { senses?: Senses }) | null
        if (!mounted) return
        const senses = d?.senses ?? null
        setState({
          senses,
          meta: r.ok && d ? d : null,
          asked: true,
          // No heartbeats in the answer means nothing to judge by, which is an
          // error for these boards, not "live".
          error: senses == null,
        })
      } catch {
        if (mounted) setState((s) => ({ ...s, asked: true, error: true }))
      }
    }
    tick()
    const id = setInterval(tick, pollMs)
    return () => {
      mounted = false
      ctrl.abort()
      clearInterval(id)
    }
  }, [pollMs])

  return state
}

/** The newer of two ISO stamps, or whichever one exists. */
export function newer(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b ?? null
  if (!b) return a
  return Date.parse(a) >= Date.parse(b) ? a : b
}
