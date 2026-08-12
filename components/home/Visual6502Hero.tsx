"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Cpu, Library } from "lucide-react"

// Home hero panel for the Visual 6502 rebuild (6502.tinymachines.ai).
//
// The right-hand well is a DIE MOTIF, not live data — there is no endpoint to
// poll here. It's a stylised mask stack (metal over poly over diffusion) whose
// contacts light on a two-phase clock, which is the one thing about it that is
// honest: a real 6502 settles its nodes twice per cycle, on φ1 and φ2.

const COLS = 13
const ROWS = 7

/** Fixed-seed LCG so the contact layout is identical on server and client. */
function layout() {
  let s = 6502
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  const cells: { x: number; y: number; r: number; k: number }[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (rnd() > 0.62) {
        cells.push({ x: c, y: r, r: rnd() > 0.78 ? 3.1 : 2.2, k: Math.floor(rnd() * 7) })
      }
    }
  }
  return cells
}

export function Visual6502Hero() {
  const cells = useMemo(layout, [])
  const [phase, setPhase] = useState(0)

  // Two-phase clock. Parked entirely when the tab is hidden or the visitor has
  // asked for reduced motion.
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduce) return
    const id = setInterval(() => {
      if (document.visibilityState === "hidden") return
      setPhase((p) => (p + 1) % 14)
    }, 620)
    return () => clearInterval(id)
  }, [])

  const W = COLS * 26 + 20
  const H = ROWS * 26 + 20

  return (
    <article className="v3-mos-hero">
      <div className="v3-mos-hero__glow" aria-hidden />

      <div className="v3-mos-hero__body">
        <span className="v3-mos-hero__eyebrow">
          <Cpu size={13} strokeWidth={2.4} />
          new · transistor-level, from the real die
        </span>
        <h2 className="v3-mos-hero__title">
          The 6502,<br />
          <span className="v3-mos-hero__accent">switch by switch.</span>
        </h2>
        <p className="v3-mos-hero__lede">
          Nothing in it models what a 6502 does. There are wires and switches, traced from a
          photograph of a decapped die, and the behaviour falls out of them. Every register you
          read is pulled back out of storage nodes; every cycle count is emergent.
        </p>

        <div className="v3-mos-hero__stats">
          <div className="v3-mos-hero__stat">
            <span className="v3-mos-hero__stat-val">3,510</span>
            <span className="v3-mos-hero__stat-label">switches solved</span>
          </div>
          <div className="v3-mos-hero__stat">
            <span className="v3-mos-hero__stat-val">83,227</span>
            <span className="v3-mos-hero__stat-label">triangles of die</span>
          </div>
          <div className="v3-mos-hero__stat">
            <span className="v3-mos-hero__stat-val">1,725</span>
            <span className="v3-mos-hero__stat-label">nodes verified</span>
          </div>
          <div className="v3-mos-hero__stat">
            <span className="v3-mos-hero__stat-val">
              94<span className="v3-mos-hero__stat-unit">×</span>
            </span>
            <span className="v3-mos-hero__stat-label">the original JS</span>
          </div>
        </div>

        <div className="v3-mos-hero__cta">
          <a
            href="https://6502.tinymachines.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="v3-mos-hero__btn v3-mos-hero__btn--primary"
          >
            Run the chip <ArrowRight size={14} strokeWidth={2.5} />
          </a>
          <Link href="/6502" className="v3-mos-hero__btn v3-mos-hero__btn--ghost">
            <Library size={14} strokeWidth={2.4} /> The 6502 archive
          </Link>
        </div>
      </div>

      <div className="v3-mos-hero__viz">
        <div className="v3-mos-hero__viz-head">
          <span className="v3-mos-hero__clk">
            <span className="v3-mos-hero__clk-dot" aria-hidden />
            {phase % 2 === 0 ? "φ1" : "φ2"}
          </span>
          <span className="v3-mos-hero__viz-label">six mask layers</span>
        </div>

        <svg
          className="v3-mos-hero__die"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Stylised illustration of a chip die: metal traces over polysilicon with contacts lighting on a two-phase clock."
        >
          {/* diffusion — the substrate wash */}
          {Array.from({ length: ROWS }, (_, r) => (
            <rect
              key={`d${r}`}
              x={6}
              y={12 + r * 26}
              width={W - 12}
              height={11}
              rx={3}
              fill="#123c2c"
              opacity={0.45}
            />
          ))}
          {/* polysilicon — vertical */}
          {Array.from({ length: COLS }, (_, c) => (
            <rect
              key={`p${c}`}
              x={14 + c * 26}
              y={6}
              width={5}
              height={H - 12}
              rx={2}
              fill="#8a5b2b"
              opacity={0.55}
            />
          ))}
          {/* metal — horizontal, translucent, sits on top exactly as on silicon */}
          {Array.from({ length: ROWS }, (_, r) => (
            <rect
              key={`m${r}`}
              x={4}
              y={9 + r * 26}
              width={W - 8}
              height={7}
              rx={3}
              fill="#9fd8f5"
              opacity={0.16}
            />
          ))}
          {/* contacts — lit when high on this half-cycle */}
          {cells.map((cell, i) => {
            const high = (cell.k + phase) % 7 < 3
            return (
              <circle
                key={i}
                cx={16.5 + cell.x * 26}
                cy={17.5 + cell.y * 26}
                r={cell.r}
                fill={high ? "#5fe8ff" : "#1d4257"}
                opacity={high ? 0.95 : 0.7}
                style={high ? { filter: "drop-shadow(0 0 4px #5fe8ff)" } : undefined}
              />
            )
          })}
        </svg>

        <div className="v3-mos-hero__viz-foot">
          <span>die motif · illustration</span>
          <span>built on visual6502</span>
        </div>
      </div>
    </article>
  )
}
