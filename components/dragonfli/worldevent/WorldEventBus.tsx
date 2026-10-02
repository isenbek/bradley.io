"use client"

import { useEffect, useRef, useState } from "react"
import { decoderFor, GenericSample } from "./decoders"
import { CATEGORICAL } from "./decoders/palette"
import {
  InstrumentHead,
  InstrumentNote,
  When,
  useInstrument,
} from "@/components/kit/InstrumentStatus"
import { toMs } from "@/lib/instrument-status"

// ---- snapshot shape (written by worldevent-collector.service) -------------
type WeType = {
  type: string
  count: number
  perMin: number
  perSec: number
  share: number
  lastTs: number
  ageSec: number
  firstSeen: number
  bytes: number
  spark: number[]
  series?: number[]
  sample: Record<string, unknown> | null
}
type WeHost = { host: string; count: number; ageSec: number }
type WeTail = { ts: number; type: string; host: string; id: string; summary: string }
type Snapshot = {
  offline?: boolean
  generatedAt?: string
  // Added by /api/worldevent: the newest event of any schema, and the snapshot
  // file's mtime. Optional so an older server's payload still renders.
  lastEventAt?: string | null
  snapshotAt?: string | null
  uptimeSec?: number
  source?: { port: number; transport: string; schemas: { schema: string; count: number }[] }
  totals?: {
    events: number
    bytes: number
    eventsPerSec: number
    eventsPerSecPeak: number
    distinctTypes: number
    distinctHosts: number
  }
  spark?: number[]
  types?: WeType[]
  hosts?: WeHost[]
  tail?: WeTail[]
}

const POLL_MS = 2000

// stable color per event type (hashed → hue), so each sense keeps its identity
/**
 * A schema's identity colour, from the Earth Conductor.
 *
 * This used to hash the schema name into an arbitrary hue 0-359. Two problems
 * with that, and the second is the serious one:
 *
 *  - The hues were off-palette entirely, so the busiest page on the site was
 *    the one place none of the colours came from tokens.css.
 *  - It could generate RED, and red in this palette means an assertion failed
 *    and nothing else. A gps.position card rendering red states something
 *    untrue about the bus. It could equally produce the blue that means ACTIVE
 *    or the orange that means ATTENTION.
 *
 * tokens.css says the Earth Conductor "assigns identity to a region, a bus, a
 * signal class", which is exactly this. Four hues over six schemas means two
 * repeat, and that is fine here: every card and every tail row carries its
 * schema name, so the colour is a tag beside a label rather than the encoding
 * itself. The rule about keeping categorical hues distinguishable applies where
 * colour is doing the work alone.
 */
// Schemas arrive at runtime and are not a known set, so the hue is hashed
// rather than assigned. It lands inside the categorical order either way: this
// used to hash into a raw 0-359 hue, free to produce the red that means an
// assertion failed. Every card and tail row is labelled with its schema name,
// so the colour is a tag beside a label rather than the encoding itself.
function hueFor(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 4096
  return CATEGORICAL[h % CATEGORICAL.length]
}
function fmtInt(n: number): string {
  return n.toLocaleString("en-US")
}
function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
function fmtAge(s: number): string {
  if (s < 1) return "now"
  if (s < 60) return `${Math.round(s)}s`
  if (s < 3600) return `${Math.round(s / 60)}m`
  return `${Math.round(s / 3600)}h`
}
function fmtUptime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = Math.floor(s % 60)
  if (h) return `${h}h ${m}m`
  if (m) return `${m}m ${ss}s`
  return `${ss}s`
}
// With the bus quiet the tail is no longer "just now", and a bare time of day
// on a three-day-old event reads as today. So a quiet bus gets the date too.
function clock(ts: number, withDate: boolean): string {
  const d = new Date(ts * 1000)
  const t = d.toLocaleTimeString("en-US", { hour12: false })
  if (!withDate) return t
  return `${d.toLocaleDateString("en-US", { day: "numeric", month: "short" })} ${t}`
}

/** A collector that has not rewritten its snapshot in this long has stopped. */
const COLLECTOR_STALE_S = 60

// `hue` is an Earth Conductor token name now, not an hsl angle. See hueFor().
function Sparkline({ data, hue, w = 120, h = 30 }: { data: number[]; hue: string; w?: number; h?: number }) {
  const max = Math.max(1, ...data)
  const n = data.length
  const step = n > 1 ? w / (n - 1) : w
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * (h - 2) - 1).toFixed(1)}`).join(" ")
  const area = `0,${h} ${pts} ${w},${h}`
  const stroke = `var(--color-${hue})`
  // The fill is the same colour at low alpha rather than a second one, so the
  // area never disagrees with the line above it.
  const fill = `color-mix(in srgb, var(--color-${hue}) 14%, transparent)`
  return (
    <svg className="beta-we-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <polygon points={area} fill={fill} stroke="none" />
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function WorldEventBus() {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let alive = true
    // `busy` and the cleared timer are what let the loop restart. The timer id
    // used to be left in place after it fired, so the "is a tick scheduled?"
    // test on becoming visible was always true and a tab that had been hidden
    // once never polled again: a board that could not recover by itself.
    let busy = false
    async function tick() {
      if (busy) return
      busy = true
      timer.current = null
      try {
        const r = await fetch("/api/worldevent", { cache: "no-store" })
        const j: Snapshot = await r.json()
        if (!alive) return
        if (r.ok && !j.offline) {
          setSnap(j)
          setStatus("live")
        } else {
          setStatus("offline")
        }
      } catch {
        if (alive) setStatus("offline")
      }
      busy = false
      if (alive && document.visibilityState !== "hidden") timer.current = setTimeout(tick, POLL_MS)
    }
    tick()
    const onVis = () => {
      if (document.visibilityState !== "hidden" && !timer.current && !busy) tick()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      alive = false
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  const t = snap?.totals
  const types = snap?.types ?? []
  const hosts = snap?.hosts ?? []
  const tail = snap?.tail ?? []
  const schemas = snap?.source?.schemas ?? []
  const gMax = Math.max(1, ...(snap?.spark ?? [0]))

  // The route answering says the COLLECTOR is up. Whether the BUS is live is a
  // different question: the newest event of any schema, as an absolute time, so
  // it stays right even if the collector dies and its ageSec values freeze.
  const lastEvent =
    toMs(snap?.lastEventAt) ??
    (types.length ? toMs(Math.max(0, ...types.map((ty) => ty.lastTs ?? 0))) : null)
  const inst = useInstrument("worldevent", {
    lastHeard: lastEvent,
    error: status === "offline",
    pending: status === "connecting" && !snap,
  })
  const busLive = inst.reading?.state === "live"
  const notLive = inst.reading !== null && !busLive
  const collectorAt = toMs(snap?.snapshotAt ?? snap?.generatedAt)
  const collectorStopped =
    inst.now != null && collectorAt != null && (inst.now - collectorAt) / 1000 > COLLECTOR_STALE_S

  return (
    <div className="beta-we">
      <InstrumentHead name="Perception bus" status={inst}>
        {notLive && (
          <InstrumentNote>
            {status === "offline" ? (
              <>
                <b>The collector&apos;s snapshot cannot be read</b>, so there is nothing current
                to show.{snap ? " What is below is the last snapshot this page received." : ""}
              </>
            ) : collectorStopped ? (
              <>
                <b>The collector has stopped writing.</b> Its last snapshot is from{" "}
                <When at={collectorAt} now={inst.now} />, and everything below is from that
                moment, including the ages, which are frozen.
              </>
            ) : (
              <>
                <b>The collector is up and listening, but nothing is talking.</b>{" "}
                {lastEvent != null ? (
                  <>
                    No producer has sent an event since <When at={lastEvent} now={inst.now} />.
                  </>
                ) : (
                  <>No producer has sent an event yet.</>
                )}{" "}
                The totals below were counted before the bus went quiet, and the zero throughput
                is a true zero.
              </>
            )}{" "}
            This page asks again every 2 seconds and resumes by itself when the bus does.
          </InstrumentNote>
        )}
      </InstrumentHead>

      {/* HUD ===================================================== */}
      {/* This dot is the COLLECTOR: the route answered, or it did not. The bus
          itself is the tag above. "bus · live" used to be printed here whenever
          the route answered, including with every producer silent. */}
      <div className="beta-we-hud">
        <span className={`beta-we-hud__status is-${status === "live" && collectorStopped ? "offline" : status}`}>
          <span className="beta-we-hud__dot" aria-hidden />
          {status === "live"
            ? collectorStopped
              ? "collector stopped"
              : "collector · up"
            : status === "offline"
              ? "collector offline"
              : "connecting"}
        </span>
        <span className="beta-we-hud__meta">
          {schemas.map((s) => (
            <code key={s.schema} className="beta-we-schema">{s.schema}</code>
          ))}
          {snap?.source ? <span className="beta-we-hud__port">UDP :{snap.source.port} · broadcast</span> : null}
          {snap?.uptimeSec != null ? <span className="beta-we-hud__up">up {fmtUptime(snap.uptimeSec)}</span> : null}
        </span>
      </div>

      {/* THROUGHPUT ============================================== */}
      <div className="beta-we-top">
        <div className="beta-we-stat">
          <span className="beta-we-stat__k">events seen</span>
          <span className="beta-we-stat__v">{fmtInt(t?.events ?? 0)}</span>
          <span className="beta-we-stat__sub">{fmtBytes(t?.bytes ?? 0)} total</span>
        </div>
        <div className="beta-we-stat">
          <span className="beta-we-stat__k">throughput</span>
          <span className="beta-we-stat__v">
            {(t?.eventsPerSec ?? 0).toFixed(1)} <small>/sec</small>
          </span>
          <span className="beta-we-stat__sub">peak {(t?.eventsPerSecPeak ?? 0).toFixed(1)}/s</span>
        </div>
        <div className="beta-we-stat">
          <span className="beta-we-stat__k">senses</span>
          <span className="beta-we-stat__v">{t?.distinctTypes ?? 0}</span>
          <span className="beta-we-stat__sub">{t?.distinctHosts ?? 0} host{(t?.distinctHosts ?? 0) === 1 ? "" : "s"}</span>
        </div>
        <div className="beta-we-stat beta-we-stat--spark">
          <span className="beta-we-stat__k">last 60s</span>
          <svg className="beta-we-topspark" viewBox="0 0 220 44" preserveAspectRatio="none" aria-hidden>
            {(snap?.spark ?? []).map((v, i, a) => {
              const bw = 220 / a.length
              const bh = (v / gMax) * 42
              return <rect key={i} x={i * bw} y={44 - bh} width={Math.max(1, bw - 1)} height={bh} rx={0.5} />
            })}
          </svg>
        </div>
      </div>

      {/* TYPES =================================================== */}
      <div className="beta-we-types">
        {types.length === 0 ? (
          <div className="beta-we-empty">
            {status === "connecting" ? (
              <>
                <span className="beta-we-hud__dot" aria-hidden /> asking the collector
              </>
            ) : (
              "no event types to show"
            )}
          </div>
        ) : (
          types.map((ty) => {
            const hue = hueFor(ty.type)
            const dec = decoderFor(ty.type)
            return (
              <div
                className={`beta-we-card${dec?.wide ? " beta-we-card--wide" : ""}${dec ? " beta-we-card--decoded" : ""}`}
                key={ty.type}
                style={{ ["--we-hue" as string]: `var(--color-${hue})` }}
              >
                <div className="beta-we-card__head">
                  <span className="beta-we-card__dot" aria-hidden />
                  <span className="beta-we-card__type">{ty.type}</span>
                  {dec ? <span className="beta-we-card__badge">decoded</span> : null}
                  <span className="beta-we-card__age">{fmtAge(ty.ageSec)}</span>
                </div>
                <div className="beta-we-card__nums">
                  <span className="beta-we-card__count">{fmtInt(ty.count)}</span>
                  <span className="beta-we-card__rate">{ty.perMin}/min · {ty.perSec.toFixed(1)}/s</span>
                </div>
                <Sparkline data={ty.spark} hue={hue} />
                <div className="beta-we-card__sharebar" aria-hidden>
                  <span style={{ width: `${Math.round(ty.share * 100)}%` }} />
                </div>
                <span className="beta-we-card__share">{(ty.share * 100).toFixed(0)}% of bus</span>
                {ty.sample ? (
                  dec ? <dec.Comp data={ty.sample} series={ty.series} /> : <GenericSample sample={ty.sample} />
                ) : null}
              </div>
            )
          })
        )}
      </div>

      {/* HOSTS + TAIL =========================================== */}
      <div className="beta-we-grid2">
        <div className="beta-we-panel">
          <h3 className="beta-we-panel__h">Producers</h3>
          <ul className="beta-we-hosts">
            {hosts.map((h) => (
              <li key={h.host}>
                <span className="beta-we-host__name">{h.host}</span>
                <span className="beta-we-host__count">{fmtInt(h.count)}</span>
                <span className="beta-we-host__age">{fmtAge(h.ageSec)}</span>
              </li>
            ))}
            {hosts.length === 0 ? <li className="beta-we-host--none">no producers yet</li> : null}
          </ul>
        </div>

        <div className="beta-we-panel">
          <h3 className="beta-we-panel__h">{busLive ? "Live tail" : "Last events heard"}</h3>
          <ul className="beta-we-tail">
            {tail.map((e, i) => (
              <li key={`${e.id}-${i}`} style={{ ["--we-hue" as string]: `var(--color-${hueFor(e.type)})` }}>
                <span className="beta-we-tail__t">{clock(e.ts, !busLive)}</span>
                <span className="beta-we-tail__type">{e.type}</span>
                <span className="beta-we-tail__sum">{e.summary}</span>
              </li>
            ))}
            {tail.length === 0 ? <li className="beta-we-tail--none">nothing heard</li> : null}
          </ul>
        </div>
      </div>
    </div>
  )
}
