"use client"

import { useEffect, useRef, useState } from "react"
import { getEntropyBytes } from "@/components/trng"

const W = 160 // bits per row
const H = 120 // rows
const BAND = 5 // new rows per tick
const BYTES_PER_TICK = (W * BAND) / 8 // 100
const TICK_MS = 1400

// A live, scrolling texture of raw decay bits — on = Bio Blue, off = ink.
// New entropy pours in at the bottom and scrolls up: a hypnotic, ever-
// changing field that never repeats.
export default function BitRaster() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // start dark
    ctx.fillStyle = "#0a0f15"
    ctx.fillRect(0, 0, W, H)

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const ctrl = new AbortController()
    let stopped = false

    const drawBand = (bytes: Uint8Array, rows: number) => {
      const band = ctx.createImageData(W, rows)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < W; c++) {
          const bit = r * W + c
          const byte = bytes[bit >> 3] ?? 0
          const on = (byte >> (7 - (bit & 7))) & 1
          const o = (r * W + c) * 4
          band.data[o] = on ? 38 : 10
          band.data[o + 1] = on ? 178 : 16
          band.data[o + 2] = on ? 240 : 24
          band.data[o + 3] = 255
        }
      }
      // scroll existing image up by `rows`, then drop the new band at the bottom
      ctx.globalCompositeOperation = "copy"
      ctx.drawImage(ctx.canvas, 0, -rows)
      ctx.globalCompositeOperation = "source-over"
      ctx.putImageData(band, 0, H - rows)
    }

    const tick = async () => {
      if (stopped || document.visibilityState === "hidden") return
      try {
        const bytes = await getEntropyBytes(BYTES_PER_TICK, ctrl.signal)
        if (stopped) return
        drawBand(bytes, BAND)
        setError(false)
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError(true)
      }
    }

    // initial full-screen fill so it doesn't start mostly black
    const seed = async () => {
      try {
        const bytes = await getEntropyBytes((W * H) / 8, ctrl.signal)
        if (stopped) return
        drawBand(bytes, H)
      } catch {
        /* ignore — ticks will fill in */
      }
    }
    seed()

    const id = reduced ? null : window.setInterval(tick, TICK_MS)
    return () => {
      stopped = true
      ctrl.abort()
      if (id) clearInterval(id)
    }
  }, [])

  return (
    <div className="v3-espace-viz">
      <div className="v3-espace-raster">
        {error ? <div className="v3-espace-fallback">decay source unreachable</div> : null}
        <canvas ref={canvasRef} width={W} height={H} className="v3-espace-raster__canvas" />
      </div>
      <p className="v3-espace-caption">
        <strong>Raw bits, live.</strong> Each pixel is one bit straight off the
        conditioned pool — blue for 1, ink for 0 — scrolling up as fresh decay
        arrives. No pattern forms because there is none to form: this texture
        will never repeat for as long as the isotope decays.
      </p>
    </div>
  )
}
