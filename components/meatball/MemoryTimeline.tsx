"use client"

import { useEffect, useState } from "react"
import { Pager, usePager } from "./Pager"

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

function ago(ts: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.round(s / 60)}m ago`
  return `${Math.round(s / 3600)}h ago`
}

function Frame({ img, tag, variant }: { img?: string | null; tag: string; variant?: string }) {
  return (
    <figure className={`v3-mem__frame${variant ? ` v3-mem__frame--${variant}` : ""}`}>
      {img ? (
        <img src={`/moment-img.jpg?f=${encodeURIComponent(img)}`} alt={tag} loading="lazy" />
      ) : (
        <div className="v3-mem__frame-missing">—</div>
      )}
      <figcaption>{tag}</figcaption>
    </figure>
  )
}

function MomentCard({ m }: { m: Moment }) {
  const isMotion = m.type === "motion"
  const title = isMotion ? m.label || "movement" : m.text || ""
  return (
    <div className="v3-mem-card">
      <div className="v3-mem-card__head">
        <span className="v3-mem-card__icon">{isMotion ? "👁" : "🗣"}</span>
        <span className="v3-mem-card__title">{isMotion ? title : `“${title}”`}</span>
        <span className="v3-mem-card__meta">
          {isMotion ? `${m.cam} · Δ${Number(m.delta ?? 0).toFixed(0)}` : `${m.mic} mic`} · {ago(m.ts)}
        </span>
      </div>
      <div className={`v3-mem-card__strip${isMotion && m.diff_img ? " v3-mem-card__strip--4" : ""}`}>
        <Frame img={m.before_img} tag="before" />
        <Frame img={m.during_img} tag={isMotion ? "motion" : "scene"} />
        {isMotion && m.diff_img ? <Frame img={m.diff_img} tag="subtracted" variant="diff" /> : null}
        <Frame img={m.after_img} tag="after" />
      </div>
      {m.correlated?.length ? (
        <div className="v3-mem-card__corr">
          <span className="v3-mem-card__corr-lead">↳ around it:</span>
          {m.correlated.map((c, i) => (
            <span key={i} className="v3-mem-card__corr-item">
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

  if (loaded && moments.length === 0) {
    return (
      <div className="v3-log__empty">
        No moments yet — once motion or speech happens, the scene before &amp; after each event lands
        here, with anything heard or seen nearby lined up alongside it.
      </div>
    )
  }

  return (
    <>
      <div className="v3-mem">
        {pager.slice.map((m) => (
          <MomentCard key={m.id} m={m} />
        ))}
      </div>
      <Pager {...pager} onPage={pager.setPage} unit="moments" />
    </>
  )
}
