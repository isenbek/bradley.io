"use client"

import { useEffect, useMemo, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { getMetricsWindow, type MetricRow } from "@/components/trng"

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

const clamp = (v: number, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v))

// Each 5-min quality window becomes a point: bias × entropy × chi.
function rowsToCloud(rows: MetricRow[]): { positions: Float32Array; colors: Float32Array } {
  const n = rows.length
  const positions = new Float32Array(n * 3)
  const colors = new Float32Array(n * 3)
  rows.forEach((r, i) => {
    const o = i * 3
    positions[o] = clamp(r.bias / 0.03)
    positions[o + 1] = clamp((r.ent_bpb - 7.8) / 0.1)
    positions[o + 2] = clamp((r.chi_pct / 100) * 2 - 1)
    // recency ramp: oldest = deep blue, newest = warm accent
    const t = n > 1 ? i / (n - 1) : 1
    colors[o] = 0.1 + 0.9 * t
    colors[o + 1] = 0.55 + 0.1 * t
    colors[o + 2] = 1 - 0.7 * t
  })
  return { positions, colors }
}

function Axes() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const L = 1.25
    // x, y, z axes through origin
    const verts = new Float32Array([
      -L, 0, 0, L, 0, 0, 0, -L, 0, 0, L, 0, 0, 0, -L, 0, 0, L,
    ])
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3))
    return g
  }, [])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#2a6c84" transparent opacity={0.5} />
    </lineSegments>
  )
}

function Cloud({ positions, colors }: { positions: Float32Array; colors: Float32Array }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    return g
  }, [positions, colors])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <points geometry={geometry}>
      <pointsMaterial vertexColors size={0.055} sizeAttenuation transparent opacity={0.95} depthWrite={false} />
    </points>
  )
}

export default function MetricsPhaseSpace() {
  const [cloud, setCloud] = useState<{ positions: Float32Array; colors: Float32Array } | null>(null)
  const [n, setN] = useState(0)
  const [error, setError] = useState(false)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()
    const load = async () => {
      try {
        const w = await getMetricsWindow("24h", ctrl.signal)
        if (!mounted) return
        setCloud(rowsToCloud(w.rows ?? []))
        setN(w.rows?.length ?? 0)
        setError(false)
      } catch (e) {
        if (mounted && (e as Error).name !== "AbortError") setError(true)
      }
    }
    load()
    const id = setInterval(load, 30_000)
    return () => {
      mounted = false
      ctrl.abort()
      clearInterval(id)
    }
  }, [])

  return (
    <div className="v3-espace-viz">
      <div className="v3-espace-canvas v3-espace-canvas--tall">
        {error ? <div className="v3-espace-fallback">metrics unreachable</div> : null}
        <Canvas camera={{ position: [2.3, 1.7, 2.3], fov: 50 }} dpr={[1, 2]}>
          <Axes />
          {cloud ? <Cloud positions={cloud.positions} colors={cloud.colors} /> : null}
          <OrbitControls
            enablePan={false}
            autoRotate={!reduced}
            autoRotateSpeed={0.6}
            enableDamping
            dampingFactor={0.08}
            minDistance={1.8}
            maxDistance={7}
          />
        </Canvas>
        <div className="v3-espace-canvas__hint" aria-hidden>
          {n} windows · last 24h · live
        </div>
      </div>
      <div className="v3-espace-axes">
        <span><b className="ax-x" />X · bias</span>
        <span><b className="ax-y" />Y · entropy (bits/byte)</span>
        <span><b className="ax-z" />Z · χ² p-value</span>
        <span className="v3-espace-axes__ramp">old → now</span>
      </div>
      <p className="v3-espace-caption">
        <strong>Quality, drifting in real time.</strong> Each dot is one 5-minute
        window of the source&apos;s health — bias, Shannon entropy, and the χ²
        uniformity p-value — colored from oldest (blue) to newest (amber). A
        healthy TRNG hovers in a tight knot near the origin; sustained drift in
        any direction is the first sign of trouble.
      </p>
    </div>
  )
}
