"use client"

import { useState } from "react"
import { Maximize2 } from "lucide-react"
import { Lightbox } from "@/components/mos/Lightbox"

/**
 * DieFigure: the 6502 die on the front page, with a surface / substrate switch.
 *
 * The two plates are the full-die photographs /6502 shows side by side
 * (components/mos/DiePlates.tsx): the same files, the same alt text, the same
 * captions, the same lightbox (components/mos/Lightbox.tsx) and the same frame,
 * tag and zoom classes. What is different here is the arrangement: one frame,
 * both plates stacked in it, and the reader chooses which is up. The plates
 * are the same crop of the same die, so the switch reads as the metal coming
 * off. Nothing switches by itself: the previous home page crossfaded these on
 * a 4.2 second timer, and a picture that changes while you are reading its
 * caption is a picture arguing with you.
 *
 * NOTHING MOVES WHEN IT LOADS OR SWITCHES. The frame carries the photographs'
 * aspect ratio, so it has its final height before either file arrives. Both
 * images are loading="lazy" and both are fetched when the frame nears the
 * viewport (the hidden one is hidden with `visibility`, which does not defer a
 * lazy image the way display:none does), so the first press shows a picture
 * and not an empty frame. Both captions share one grid cell, so the figure is
 * as tall as the longer of the two whichever is showing.
 *
 * THE CREDIT IS PART OF THE FIGURE. The photographs are the visual6502 team's,
 * CC BY-NC-SA 3.0, and the line that says so is inside the figcaption: it
 * cannot be dropped by a caller that places the figure somewhere new. It
 * links the source (the team's 6502 image page, the address /6502 uses) and
 * the licence deed, as the licence asks.
 *
 * The controls are the kit's .chip with aria-pressed, the same toggle as every
 * other switch on the site.
 */

// Kept word for word with components/mos/DiePlates.tsx. If that file ever
// exports its PLATES, import them here and delete this copy.
const PLATES = [
  {
    key: "surface",
    label: "Surface",
    src: "/6502/die-surface.webp",
    full: "/6502/die-surface-full.webp",
    alt: "The full MOS 6502 die photographed from above: a dense green-gold grid of circuitry ringed by 40 bond pads",
    cap: "The die as it came out of the package, metal still on. The ring of dark circles is the 40 bond pads; the “65 0” near the left edge is etched into the silicon itself.",
    lbCap: "MOS 6502 rev D · surface, metal still on · visual6502, CC BY-NC-SA 3.0",
  },
  {
    key: "substrate",
    label: "Substrate",
    src: "/6502/die-substrate.webp",
    full: "/6502/die-substrate-full.webp",
    alt: "The same 6502 die after the metal and polysilicon layers were stripped, showing the pale diffusion regions beneath",
    cap: "The same die with the metal and polysilicon stripped off, exposing the diffusion. Aligning this to the surface shot is what makes buried contacts recoverable.",
    lbCap: "MOS 6502 rev D · substrate, metal and poly etched off · visual6502, CC BY-NC-SA 3.0",
  },
] as const

export function DieFigure() {
  const [i, setI] = useState(0)
  const [open, setOpen] = useState(false)
  const plate = PLATES[i]

  return (
    <figure className="beta-die beta-home-die">
      <div className="chips" role="group" aria-label="Die layer">
        {PLATES.map((p, n) => (
          <button
            key={p.key}
            type="button"
            className="chip"
            aria-pressed={n === i}
            onClick={() => setI(n)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="beta-die__frame beta-die__frame--btn beta-home-die__frame"
        onClick={() => setOpen(true)}
        aria-label={`Open the ${plate.key} plate full screen`}
      >
        {PLATES.map((p, n) => (
          <img
            key={p.key}
            src={p.src}
            alt={n === i ? p.alt : ""}
            aria-hidden={n === i ? undefined : true}
            width={1300}
            height={1417}
            loading="lazy"
            decoding="async"
            className={n === i ? "is-on" : undefined}
          />
        ))}
        <span className="beta-die__tag">{plate.key}</span>
        <span className="beta-die__zoom">
          <Maximize2 size={14} strokeWidth={2.4} aria-hidden="true" /> zoom
        </span>
      </button>

      <figcaption>
        <span className="beta-home-die__caps">
          {PLATES.map((p, n) => (
            <span key={p.key} aria-hidden={n === i ? undefined : true}>
              {p.cap}
            </span>
          ))}
        </span>
        <span className="beta-home-die__credit">
          MOS 6502 rev D. Photographs: the visual6502 team,{" "}
          <a href="http://visual6502.org/images/6502/index.html" rel="noopener noreferrer">
            visual6502.org
          </a>
          ,{" "}
          <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/" rel="license noopener noreferrer">
            CC BY-NC-SA 3.0
          </a>
          .
        </span>
      </figcaption>

      {open ? (
        <Lightbox
          src={plate.full}
          alt={plate.alt}
          caption={plate.lbCap}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </figure>
  )
}
