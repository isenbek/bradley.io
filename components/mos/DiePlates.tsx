"use client"

import { useState } from "react"
import { Maximize2 } from "lucide-react"
import { Lightbox } from "./Lightbox"

// The two full-die photographs. The thumbnails are 1300px; the lightbox pulls
// a 2800px plate instead, and only once you actually open it.
const PLATES = [
  {
    key: "surface",
    tag: "surface",
    src: "/6502/die-surface.webp",
    full: "/6502/die-surface-full.webp",
    alt: "The full MOS 6502 die photographed from above: a dense green-gold grid of circuitry ringed by 40 bond pads",
    cap: (
      <>
        The die as it came out of the package, metal still on. The ring of dark circles is the 40
        bond pads; the &ldquo;65 0&rdquo; near the left edge is etched into the silicon itself.
      </>
    ),
    lbCap: "MOS 6502 rev D · surface, metal still on · visual6502, CC BY-NC-SA 3.0",
  },
  {
    key: "substrate",
    tag: "substrate",
    src: "/6502/die-substrate.webp",
    full: "/6502/die-substrate-full.webp",
    alt: "The same 6502 die after the metal and polysilicon layers were stripped, showing the pale diffusion regions beneath",
    cap: (
      <>
        The same die with the metal and polysilicon stripped off, exposing the diffusion. Aligning
        this to the surface shot is what makes buried contacts recoverable.
      </>
    ),
    lbCap: "MOS 6502 rev D · substrate, metal and poly etched off · visual6502, CC BY-NC-SA 3.0",
  },
]

export function DiePlates() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <>
      <div className="beta-dies">
        {PLATES.map((p, n) => (
          <figure key={p.key} className="beta-die">
            <button
              type="button"
              className="beta-die__frame beta-die__frame--btn"
              onClick={() => setOpen(n)}
              aria-label={`Open the ${p.tag} plate full screen`}
            >
              <img src={p.src} alt={p.alt} width={1300} height={1417} decoding="async" />
              <span className="beta-die__tag">{p.tag}</span>
              <span className="beta-die__zoom">
                <Maximize2 size={14} strokeWidth={2.4} /> zoom
              </span>
            </button>
            <figcaption>{p.cap}</figcaption>
          </figure>
        ))}
      </div>

      {open != null ? (
        <Lightbox
          src={PLATES[open].full}
          alt={PLATES[open].alt}
          caption={PLATES[open].lbCap}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </>
  )
}
