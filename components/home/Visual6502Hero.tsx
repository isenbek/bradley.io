"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Cpu, Library } from "lucide-react"

// Home hero panel for the Visual 6502 rebuild (6502.tinymachines.ai).
//
// The right-hand well holds the actual thing: two identically-cropped bands of
// the visual6502 team's die photographs, the second shot after the metal and
// polysilicon were etched off. They are pixel-aligned, so slowly crossfading
// between them reads as the metal dissolving to show what is underneath —
// which is exactly what happened to the physical chip.
const PLATES = [
  {
    key: "surface",
    label: "surface",
    src: "/6502/hero-surface.webp",
    alt: "A band of the MOS 6502 die photographed from above, dense gold-green circuitry with the 65-D marking visible",
  },
  {
    key: "substrate",
    label: "substrate",
    src: "/6502/hero-substrate.webp",
    alt: "The same band of the 6502 die after the metal and polysilicon layers were stripped, showing pale diffusion regions",
  },
]

export function Visual6502Hero() {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    const id = setInterval(() => {
      if (document.visibilityState === "hidden") return
      setI((n) => (n + 1) % PLATES.length)
    }, 4200)
    return () => clearInterval(id)
  }, [])

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
            {PLATES[i].label}
          </span>
          <span className="v3-mos-hero__viz-label">MOS 6502 rev D</span>
        </div>

        <div className="v3-mos-hero__die">
          {PLATES.map((pl, n) => (
            <img
              key={pl.key}
              src={pl.src}
              alt={n === i ? pl.alt : ""}
              aria-hidden={n === i ? undefined : true}
              width={1000}
              height={617}
              decoding="async"
              className={`v3-mos-hero__plate${n === i ? " is-on" : ""}`}
            />
          ))}
        </div>

        <div className="v3-mos-hero__viz-foot">
          <span>decapped 2009</span>
          <span>die: visual6502</span>
        </div>
      </div>
    </article>
  )
}
