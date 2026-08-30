"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Minus, Plus, RotateCcw, X } from "lucide-react"

const MIN = 1
const MAX = 14

export interface LightboxProps {
  /** Full-resolution source — only requested once the overlay opens. */
  src: string
  alt: string
  /** Shown bottom-left, under the plate. */
  caption?: string
  onClose: () => void
}

/**
 * Full-screen zoom/pan viewer for the die plates. Scale 1 means "fitted to the
 * viewport" (the img is object-fit: contain inside the stage), so the transform
 * only ever magnifies from that baseline.
 *
 * Zoom is anchored at the pointer: with transform-origin at 0 0, the image
 * point under the cursor is (c - t) / s, and holding it still across a scale
 * change gives t' = c - ((c - t) / s) * s'.
 */
export function Lightbox({ src, alt, caption, onClose }: LightboxProps) {
  const stage = useRef<HTMLDivElement>(null)
  const [s, setS] = useState(1)
  const [t, setT] = useState({ x: 0, y: 0 })
  const [loaded, setLoaded] = useState(false)

  // Active pointers, so one finger pans and two fingers pinch.
  const pts = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; s: number; cx: number; cy: number } | null>(null)
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)

  const zoomAt = useCallback((next: number, cx: number, cy: number) => {
    setS((cur) => {
      const ns = Math.min(MAX, Math.max(MIN, next))
      setT((ct) => {
        if (ns === MIN) return { x: 0, y: 0 }
        return { x: cx - ((cx - ct.x) / cur) * ns, y: cy - ((cy - ct.y) / cur) * ns }
      })
      return ns
    })
  }, [])

  const local = (e: { clientX: number; clientY: number }) => {
    const r = stage.current?.getBoundingClientRect()
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) }
  }

  // Esc to close; body scroll stays locked while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "+" || e.key === "=") setS((v) => Math.min(MAX, v * 1.4))
      if (e.key === "-") setS((v) => Math.max(MIN, v / 1.4))
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  // Non-passive so the page doesn't scroll behind the overlay while zooming.
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const p = local(e)
      zoomAt(s * (e.deltaY < 0 ? 1.18 : 1 / 1.18), p.x, p.y)
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [s, zoomAt])

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pts.current.size === 2) {
      const [a, b] = [...pts.current.values()]
      const r = stage.current?.getBoundingClientRect()
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        s,
        cx: (a.x + b.x) / 2 - (r?.left ?? 0),
        cy: (a.y + b.y) / 2 - (r?.top ?? 0),
      }
      drag.current = null
    } else if (pts.current.size === 1) {
      const p = local(e)
      drag.current = { x: p.x, y: p.y, tx: t.x, ty: t.y }
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pts.current.has(e.pointerId)) return
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pinch.current && pts.current.size >= 2) {
      const [a, b] = [...pts.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      const { dist, s: s0, cx, cy } = pinch.current
      if (dist > 0) zoomAt(s0 * (d / dist), cx, cy)
      return
    }
    if (drag.current && s > MIN) {
      const p = local(e)
      setT({ x: drag.current.tx + (p.x - drag.current.x), y: drag.current.ty + (p.y - drag.current.y) })
    }
  }

  const endPointer = (e: React.PointerEvent) => {
    pts.current.delete(e.pointerId)
    if (pts.current.size < 2) pinch.current = null
    if (pts.current.size === 0) drag.current = null
  }

  const reset = () => {
    setS(1)
    setT({ x: 0, y: 0 })
  }

  const body = (
    <div
      className="beta-lbx"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="beta-lbx__bar">
        <span className="beta-lbx__zoom">{s.toFixed(1)}×</span>
        <div className="beta-lbx__tools">
          <button type="button" onClick={() => setS((v) => Math.max(MIN, v / 1.5))} aria-label="Zoom out">
            <Minus size={16} strokeWidth={2.4} />
          </button>
          <button type="button" onClick={reset} aria-label="Reset zoom">
            <RotateCcw size={15} strokeWidth={2.4} />
          </button>
          <button type="button" onClick={() => setS((v) => Math.min(MAX, v * 1.5))} aria-label="Zoom in">
            <Plus size={16} strokeWidth={2.4} />
          </button>
          <button type="button" onClick={onClose} aria-label="Close" className="beta-lbx__x">
            <X size={17} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div
        ref={stage}
        className={`beta-lbx__stage${s > MIN ? " is-zoomed" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={(e) => {
          const p = local(e)
          zoomAt(s > 1.05 ? 1 : 3, p.x, p.y)
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          onLoad={() => setLoaded(true)}
          className="beta-lbx__img"
          style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${s})` }}
        />
        {loaded ? null : <span className="beta-lbx__loading">loading full plate…</span>}
      </div>

      <div className="beta-lbx__foot">
        {caption ? <span className="beta-lbx__cap">{caption}</span> : <span />}
        <span className="beta-lbx__hint">scroll or pinch to zoom · drag to pan · esc to close</span>
      </div>
    </div>
  )

  return createPortal(body, document.body)
}
