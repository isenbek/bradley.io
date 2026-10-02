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
import { newer, useSenses } from "./senses"

interface Corr {
  type: string
  text?: string
  mic?: string
  label?: string
  cam?: string
  ts: string
}
interface Moment {
  id: string
  ts: string
  type: "motion" | "speech"
  cam: string
  label?: string | null
  delta?: number
  text?: string | null
  mic?: string | null
  level?: number
  before_img?: string | null
  during_img?: string | null
  after_img?: string | null
  diff_img?: string | null
  correlated: Corr[]
}

function Frame({ img, tag, variant }: { img?: string | null; tag: string; variant?: string }) {
  return (
    <figure className={`beta-mem__frame${variant ? ` beta-mem__frame--${variant}` : ""}`}>
      {img ? (
        <img src={`/moment-img.jpg?f=${encodeURIComponent(img)}`} alt={tag} loading="lazy" />
      ) : (
        <div className="beta-mem__frame-missing">no frame</div>
      )}
      <figcaption>{tag}</figcaption>
    </figure>
  )
}

function MomentCard({ m, now }: { m: Moment; now: number | null }) {
  const isMotion = m.type === "motion"
  const title = isMotion ? m.label || "movement" : m.text || ""
  return (
    <div className="beta-memcard">
      <div className="beta-memcard__head">
        <span className="beta-memcard__icon">{isMotion ? "👁" : "🗣"}</span>
        <span className="beta-memcard__title">{isMotion ? title : `“${title}”`}</span>
        <span className="beta-memcard__meta">
          {isMotion ? `${m.cam} · Δ${Number(m.delta ?? 0).toFixed(0)}` : `${m.mic} mic`} ·{" "}
          {relOrAbs(m.ts, now)}
        </span>
      </div>
      <div className={`beta-memcard__strip${isMotion && m.diff_img ? " beta-memcard__strip--4" : ""}`}>
        <Frame img={m.before_img} tag="before" />
        <Frame img={m.during_img} tag={isMotion ? "motion" : "scene"} />
        {isMotion && m.diff_img ? <Frame img={m.diff_img} tag="subtracted" variant="diff" /> : null}
        <Frame img={m.after_img} tag="after" />
      </div>
      {m.correlated?.length ? (
        <div className="beta-memcard__corr">
          <span className="beta-memcard__corr-lead">↳ around it:</span>
          {m.correlated.map((c, i) => (
            <span key={i} className="beta-memcard__corr-item">
              {c.type === "speech" ? `🗣 “${c.text}”` : `👁 ${c.label}`}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function MemoryTimeline() {
  const [moments, setMoments] = useState<Moment[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    const tick = async () => {
      if (document.visibilityState === "hidden") return
      try {
        const r = await fetch("/api/moments", { cache: "no-store" })
        const d = await r.json()
        if (mounted) {
          setMoments(d.moments || [])
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

  const pager = usePager(moments, 10)

  // A memory is a log, and a log's newest entry being old proves nothing by
  // itself. What the reader needs is whether the senses that FEED it are still
  // running: a moment is made from motion or from speech, so the newer of those
  // two heartbeats is when the memory could last have grown.
  const { senses, asked, error } = useSenses()
  const inst = useInstrument("motion", {
    lastHeard: newer(senses?.motion, senses?.ears),
    error,
    pending: !asked,
  })
  const live = inst.reading?.state === "live"

  const head = (
    <InstrumentHead name="Memory" status={inst}>
      {inst.reading && !live && (
        <InstrumentNote>
          <b>Nothing new is being remembered.</b> The senses that feed this memory{" "}
          {inst.lastHeardMs != null ? (
            <>
              last reported <When at={inst.lastHeardMs} now={inst.now} />
            </>
          ) : (
            <>are not reporting</>
          )}
          .{" "}
          {moments.length > 0
            ? "The moments below are what it kept up to then, each with its own time."
            : "There are no moments on record."}{" "}
          This page keeps asking and resumes by itself when the senses do.
        </InstrumentNote>
      )}
    </InstrumentHead>
  )

  if (loaded && moments.length === 0) {
    return (
      <>
        {head}
        {live && (
          <div className="beta-log__empty">
            No moments yet. Once motion or speech happens, the scene before &amp; after each event
            lands here, with anything heard or seen nearby lined up alongside it.
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {head}
      <div className="beta-mem">
        {pager.slice.map((m) => (
          <MomentCard key={m.id} m={m} now={inst.now} />
        ))}
      </div>
      <Pager {...pager} onPage={pager.setPage} unit="moments" />
    </>
  )
}
