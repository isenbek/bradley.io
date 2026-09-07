"use client"

import { useEffect, useRef } from "react"

/**
 * A finger-signature canvas for the field tools: draw, clear, and the
 * result leaves as a PNG data URL through onChange. Pointer events cover
 * finger, stylus, and mouse alike; the canvas back-buffer is scaled for
 * devicePixelRatio so a signature is not fuzzy on the phone it was signed
 * on. Value is uncontrolled by design (a signature is not re-rendered
 * keystroke state); `initial` restores a saved draft once on mount.
 */
export function SignaturePad({ initial, onChange }: { initial?: string | null; onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const dirty = useRef(false)

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
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height)
        dirty.current = true
      }
      img.src = initial
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  const start = (e: React.PointerEvent) => {
    e.preventDefault()
    canvasRef.current?.setPointerCapture(e.pointerId)
    drawing.current = true
    const ctx = canvasRef.current?.getContext("2d")
    const p = pos(e)
    ctx?.beginPath()
    ctx?.moveTo(p.x, p.y)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext("2d")
    const p = pos(e)
    ctx?.lineTo(p.x, p.y)
    ctx?.stroke()
    dirty.current = true
  }
  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    if (dirty.current && canvasRef.current) onChange(canvasRef.current.toDataURL("image/png"))
  }
  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    dirty.current = false
    onChange(null)
  }

  return (
    <div className="beta-co-sig">
      <canvas
        ref={canvasRef}
        className="beta-co-sig__canvas"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        aria-label="Customer signature area: sign with a finger"
      />
      <button type="button" className="btn" onClick={clear}>
        Clear signature
      </button>
    </div>
  )
}
