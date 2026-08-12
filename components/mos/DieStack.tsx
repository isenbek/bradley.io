"use client"

import { useState } from "react"

// The four images are pixel-aligned crops of the same patch of die (the
// register/ALU section), so stacking them and crossfading opacity turns the
// visual6502 team's photograph-to-polygon pipeline into something you can
// step through. All four are rendered up front — switching must be instant,
// and the payload is ~1 MB for the set.

const LAYERS = [
  {
    key: "surface",
    label: "Surface",
    src: "/6502/alu-1-surface.webp",
    alt: "Photograph of the 6502 die surface at the register and ALU section, metal traces running over the circuitry",
    cap: "The die as photographed, metal still on. Aluminium routing hides most of what is underneath, which is why one photograph is not enough.",
  },
  {
    key: "substrate",
    label: "Substrate",
    src: "/6502/alu-2-substrate.webp",
    alt: "The same patch of die after the metal and polysilicon layers were stripped away, showing diffusion regions",
    cap: "The same patch after the metal and polysilicon were etched off. What is left is diffusion: the doped silicon that forms the transistors' sources and drains.",
  },
  {
    key: "polysilicon",
    label: "Polysilicon",
    src: "/6502/alu-3-polysilicon.webp",
    alt: "The substrate image with polysilicon gate traces drawn back over it in violet",
    cap: "Polysilicon traced back over the substrate. Where poly crosses diffusion, you get a transistor gate. This alignment is the whole trick.",
  },
  {
    key: "polygons",
    label: "Polygons",
    src: "/6502/alu-4-polygons.webp",
    alt: "The finished vector polygon model of the same region, coloured by mask layer",
    cap: "The finished vector model, coloured by mask layer. About 20,000 of these were drawn by hand across the chip, and this is what actually gets simulated.",
  },
]

export function DieStack() {
  const [i, setI] = useState(0)

  return (
    <figure className="v3-mos-stack">
      <div className="v3-mos-stack__tabs" role="group" aria-label="Die layer">
        {LAYERS.map((l, n) => (
          <button
            key={l.key}
            type="button"
            className={`v3-mos-stack__tab${n === i ? " is-on" : ""}`}
            aria-pressed={n === i}
            onClick={() => setI(n)}
          >
            <span className="v3-mos-stack__tab-n">{n + 1}</span>
            {l.label}
          </button>
        ))}
      </div>

      <div className="v3-mos-stack__frame">
        {LAYERS.map((l, n) => (
          <img
            key={l.key}
            src={l.src}
            alt={n === i ? l.alt : ""}
            aria-hidden={n === i ? undefined : true}
            width={1100}
            height={882}
            decoding="async"
            className={`v3-mos-stack__img${n === i ? " is-on" : ""}`}
          />
        ))}
        <span className="v3-mos-stack__badge">register &amp; ALU section</span>
      </div>

      <figcaption className="v3-mos-stack__cap">{LAYERS[i].cap}</figcaption>
    </figure>
  )
}
