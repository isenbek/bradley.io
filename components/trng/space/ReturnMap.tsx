"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { RefreshCw } from "lucide-react"
import { getEntropyBytes } from "@/components/trng"

const N = 256 // one cell per byte value
const SAMPLE_BYTES = 24_000

// Plot each consecutive pair (byteₙ, byteₙ₊₁) as a cell. True randomness
// scatters uniformly; a weak PRNG leaves a visible lattice or diagonal.
export default function ReturnMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const render = useCallback((bytes: Uint8Array) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const counts = new Uint32Array(N * N)
    let max = 0
    for (let i = 0; i < bytes.length - 1; i++) {
      const idx = bytes[i] * N + bytes[i + 1]
      const c = ++counts[idx]
      if (c > max) max = c
    }

    const img = ctx.createImageData(N, N)
    const logMax = Math.log(1 + max)
    for (let i = 0; i < counts.length; i++) {
      const t = logMax > 0 ? Math.log(1 + counts[i]) / logMax : 0
      const o = i * 4
      // dark ink → Bio Blue → bright cyan
      img.data[o] = Math.round(12 + t * 60)
      img.data[o + 1] = Math.round(20 + t * 200)
      img.data[o + 2] = Math.round(30 + t * 225)
      img.data[o + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
  }, [])

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError(false)
      try {
        const bytes = await getEntropyBytes(SAMPLE_BYTES, signal)
        if (signal?.aborted) return
        render(bytes)
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError(true)
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [render]
  )

  useEffect(() => {
    const ctrl = new AbortController()
    load(ctrl.signal)
    return () => ctrl.abort()
  }, [load])

  return (
    <div className="v3-espace-viz">
      <div className="v3-espace-viz__controls v3-espace-viz__controls--end">
        <button type="button" className="v3-espace-btn" onClick={() => load()} disabled={loading}>
          <RefreshCw size={13} strokeWidth={2.4} className={loading ? "v3-spin" : ""} />
          Resample
        </button>
      </div>
      <div className="v3-espace-square">
        {error ? <div className="v3-espace-fallback">decay source unreachable</div> : null}
        <canvas ref={canvasRef} width={N} height={N} className="v3-espace-square__canvas" />
      </div>
      <p className="v3-espace-caption">
        <strong>The return map.</strong> Each pixel is a consecutive byte pair
        (value <em>n</em> across, value <em>n+1</em> up). Real entropy paints an
        even haze — every pairing equally likely. A flawed generator would etch
        diagonal lines or a grid here; this stays featureless.
      </p>
    </div>
  )
}
