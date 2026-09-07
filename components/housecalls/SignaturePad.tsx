"use client"

import { useEffect, useRef } from "react"

/**
 * A finger-signature canvas for the field tools: draw, clear, and the
 * result leaves as a PNG data URL through onChange. Listeners are attached
 * NATIVELY in the effect rather than through React's delegated handlers:
 * a drawing surface wants raw pointer events (and the delegated path
 * proved unreliable for exactly this case in production testing,
 * 2026-09-06). The back-buffer is scaled for devicePixelRatio so a
 * signature is not fuzzy on the phone it was signed on. `initial`
 * restores a saved draft once on mount.
 */
export function SignaturePad({ initial, onChange }: { initial?: string | null; onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#111"
    if (initial) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height)
      img.src = initial
    }

    let drawing = false
    let dirty = Boolean(initial)
    const pos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const down = (e: PointerEvent) => {
      e.preventDefault()
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {
        /* synthetic or already-released pointers cannot be captured; drawing works regardless */
      }
      drawing = true
      const p = pos(e)
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      // A dot counts as ink: tap-signers exist.
      ctx.lineTo(p.x + 0.1, p.y + 0.1)
      ctx.stroke()
      dirty = true
    }
    const move = (e: PointerEvent) => {
      if (!drawing) return
      const p = pos(e)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
    }
    const up = () => {
      if (!drawing) return
      drawing = false
      if (dirty) onChangeRef.current(canvas.toDataURL("image/png"))
    }
    canvas.addEventListener("pointerdown", down)
    canvas.addEventListener("pointermove", move)
    canvas.addEventListener("pointerup", up)
    canvas.addEventListener("pointercancel", up)
    return () => {
      canvas.removeEventListener("pointerdown", down)
      canvas.removeEventListener("pointermove", move)
      canvas.removeEventListener("pointerup", up)
      canvas.removeEventListener("pointercancel", up)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (canvas && ctx) {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
    }
    onChangeRef.current(null)
  }

  return (
    <div className="beta-co-sig">
      <canvas ref={canvasRef} className="beta-co-sig__canvas" aria-label="Customer signature area: sign with a finger" />
      <button type="button" className="btn" onClick={clear}>
        Clear signature
      </button>
    </div>
  )
}
