"use client"

import { useEffect, useMemo, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { RefreshCw } from "lucide-react"
import { bytesToPoints, randuPoints, pointColors } from "./entropy-lib"
import type { EntropyStatus } from "./use-entropy"

type Source = "live" | "randu"
const MAX_POINTS = 2000

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

function PointCloud({ positions, colors }: { positions: Float32Array; colors: Float32Array }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    return g
  }, [positions, colors])
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <points geometry={geometry}>
      <pointsMaterial
        vertexColors
        size={0.02}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function CubeFrame() {
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2)), [])
  useEffect(() => () => edges.dispose(), [edges])
  return (
    <lineSegments geometry={edges}>
      <lineBasicMaterial color="#1f7a9c" transparent opacity={0.38} />
    </lineSegments>
  )
}

export default function EntropyCube({
  bytes,
  status,
  onRegenerate,
}: {
  bytes: Uint8Array | null
  status: EntropyStatus
  onRegenerate: () => void
}) {
  const [source, setSource] = useState<Source>("live")
  const [reseed, setReseed] = useState(1)
  const reduced = usePrefersReducedMotion()

  const data = useMemo(() => {
    let positions: Float32Array | null = null
    if (source === "live") {
      if (!bytes) return null
      positions = bytesToPoints(bytes, Math.min(MAX_POINTS, Math.floor(bytes.length / 3)))
    } else {
      positions = randuPoints(MAX_POINTS, reseed * 2654435761)
    }
    return { positions, colors: pointColors(positions) }
  }, [source, bytes, reseed])

  const overlay =
    source === "live" && !bytes
      ? status === "pool-low"
        ? "entropy pool replenishing — hang tight"
        : "drawing entropy…"
      : null

  return (
    <div className="v3-espace-viz">
      <div className="v3-espace-viz__controls">
        <div className="v3-seg" role="group" aria-label="Entropy source">
          <button type="button" className="v3-seg__btn" data-active={source === "live"} onClick={() => setSource("live")}>
            Live decay
          </button>
          <button type="button" className="v3-seg__btn" data-active={source === "randu"} onClick={() => setSource("randu")}>
            RANDU (broken)
          </button>
        </div>
        {source === "live" ? (
          <button type="button" className="v3-espace-btn" onClick={onRegenerate} disabled={status === "loading"}>
            <RefreshCw size={13} strokeWidth={2.4} className={status === "loading" ? "v3-spin" : ""} />
            Pour fresh entropy
          </button>
        ) : (
          <button type="button" className="v3-espace-btn" onClick={() => setReseed((n) => n + 1)}>
            <RefreshCw size={13} strokeWidth={2.4} />
            Reseed
          </button>
        )}
      </div>

      <div className="v3-espace-canvas" data-source={source}>
        {overlay ? <div className="v3-espace-fallback">{overlay}</div> : null}
        <Canvas camera={{ position: [2.6, 1.9, 2.6], fov: 48 }} dpr={[1, 2]}>
          <CubeFrame />
          {data ? <PointCloud positions={data.positions} colors={data.colors} /> : null}
          <OrbitControls
            enablePan={false}
            autoRotate={!reduced}
            autoRotateSpeed={0.5}
            enableDamping
            dampingFactor={0.08}
            minDistance={2}
            maxDistance={8}
          />
        </Canvas>
        <div className="v3-espace-canvas__hint" aria-hidden>
          drag to orbit · scroll to zoom
        </div>
      </div>

      <p className="v3-espace-caption">
        {source === "live" ? (
          <>
            <strong>Live radioactive decay.</strong> Every byte from the Geiger
            source becomes one axis of a point. True entropy has no structure —
            the cloud fills the cube as a uniform mist, with no plane, axis, or
            seam anywhere you rotate.
          </>
        ) : (
          <>
            <strong>RANDU, a deterministic PRNG.</strong> The exact same plot,
            fed by IBM&apos;s infamous LCG. Its arithmetic (z = 6y − 9x mod 1)
            forces every point onto just <strong>15 parallel planes</strong> —
            rotate until they snap into view. That hidden lattice is what
            radioactive decay does not have.
          </>
        )}
      </p>
    </div>
  )
}
