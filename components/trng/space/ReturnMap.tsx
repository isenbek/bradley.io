"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { RefreshCw } from "lucide-react"
import { getEntropyBytes } from "@/components/trng"

const N = 128 // grid = top 7 bits of each byte (keeps cells well-populated)
const SAMPLE_BYTES = 32_768 // ~2 pairs/cell → a smooth, clearly uniform haze

// Plot each consecutive pair (byteₙ, byteₙ₊₁) as a cell. True randomness
// fills the square as an even haze; a weak PRNG leaves a visible lattice or
// diagonal. Color is normalized to the *mean* count, so a uniform field
// renders as a flat blue mist with only Poisson grain — the way it should.
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
    let pairs = 0
    for (let i = 0; i < bytes.length - 1; i++) {
      const idx = (bytes[i] >> 1) * N + (bytes[i + 1] >> 1)
      counts[idx]++
      pairs++
    }

    const mean = pairs / (N * N)
    const denom = Math.max(1e-6, mean * 2.4)
    const img = ctx.createImageData(N, N)
    for (let i = 0; i < counts.length; i++) {
      const t = Math.pow(Math.min(1, counts[i] / denom), 0.85)
      const o = i * 4
      img.data[o] = Math.round(10 + t * 72)
      img.data[o + 1] = Math.round(24 + t * 176)
      img.data[o + 2] = Math.round(36 + t * 210)
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
        <strong>The return map.</strong> Each cell is a consecutive byte pair
        (value <em>n</em> across, value <em>n+1</em> up). Real entropy paints an
        even haze — every pairing equally likely. A flawed generator would etch
        diagonal lines or a grid here; this stays featureless.
      </p>
    </div>
  )
}
