import { readFileSync } from "node:fs"
import path from "node:path"
import { ImageResponse } from "next/og"
import {
  BIO_LOGO_BODY_PATH,
  BIO_LOGO_BOWL_PATH,
  BIO_LOGO_DOT,
  BIO_LOGO_GROUP_TRANSFORM,
  BIO_LOGO_VIEWBOX,
} from "@/lib/bio-logo-path"

/**
 * The share card, in the kit's style: every route's opengraph-image.tsx
 * (2026-10-23; it replaced lib/og-card-v3.tsx, the Bio Blue card).
 *
 * A datasheet page: paper ground, ink type, hairline rules in ink. Archivo
 * for the headline, Plex Mono for labels, Plex Serif for the sentence, and
 * the logo's steel as the one accent, as on the site. No gradient, no glow,
 * no pills. An image, when a card has one, sits in an ink frame beside the
 * headline, the way a figure sits on a page.
 *
 * Satori cannot read CSS variables, so the kit's tokens are literal hex here,
 * copied from app/beta/kit/tokens.css and the top of app/kit.css. Fonts are
 * TTF copies of the kit's own, latin only (lib/og-fonts/README.md): a card's
 * words must stay in that range, because a missing glyph would make next/og
 * fetch a font from the network.
 */

export const OG_KIT_SIZE = { width: 1200, height: 630 }
export const OG_KIT_CONTENT_TYPE = "image/png"

const PAPER = "#F4F2EC" // --color-paper
const INK = "#16150F" // --color-ink
const MUTED = "#6E6B66" // --color-ink-muted
const STEEL = "#41749d" // --color-family-steel (--beta-accent)
const STEEL_INK = "#375b76" // --color-accent-ink as rendered (kit.css)

const FONTS_DIR = path.join(process.cwd(), "lib/og-fonts")
const font = (f: string) => readFileSync(path.join(FONTS_DIR, f))

export interface OgKitConfig {
  /** Mono caps over the headline: what the page is. */
  eyebrow: string
  /** The headline. An array sets one entry per line. */
  title: string | string[]
  /** Set the headline in caps, as the home hero is. */
  caps?: boolean
  /** One or two sentences under the headline, in the serif. */
  sentence?: string
  /** Mono caps in the masthead, right. Short. */
  note?: string
  /** A data URI, shown beside the headline. */
  image?: string
  /** Frame the image (a photo or a figure). A drawing with its own edge goes bare. */
  imageFrame?: boolean
}

/** Headline size from its longest line and the width it has. */
function titleSize(lines: string[], narrow: boolean): number {
  const longest = Math.max(...lines.map((l) => l.length))
  const total = lines.join(" ").length
  const sizes = narrow ? [72, 60, 52, 46] : [100, 84, 70, 58]
  const n = lines.length > 1 ? longest : total
  return n <= 18 ? sizes[0] : n <= 28 ? sizes[1] : n <= 42 ? sizes[2] : sizes[3]
}

export function ogKitImageResponse(cfg: OgKitConfig): ImageResponse {
  const lines = Array.isArray(cfg.title) ? cfg.title : [cfg.title]
  const narrow = Boolean(cfg.image)
  // Three caps lines at the full size overrun the card's height and width.
  const size = cfg.caps && lines.length > 2 ? 84 : titleSize(lines, narrow)
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAPER,
          color: INK,
          padding: "52px 72px 46px",
          fontFamily: "Plex Serif",
        }}
      >
        {/* Masthead: the mark and the name, over an ink hairline. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 20,
            borderBottom: `2px solid ${INK}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg width="92" height="48" viewBox={BIO_LOGO_VIEWBOX} preserveAspectRatio="xMidYMid meet">
              <g transform={BIO_LOGO_GROUP_TRANSFORM}>
                <path d={BIO_LOGO_BODY_PATH} fill={STEEL} />
                <path d={BIO_LOGO_BOWL_PATH} fill={STEEL} />
                <circle cx={BIO_LOGO_DOT.cx} cy={BIO_LOGO_DOT.cy} r={BIO_LOGO_DOT.r} fill={STEEL} />
              </g>
            </svg>
            <div style={{ fontFamily: "Archivo", fontSize: 30, letterSpacing: "-0.01em" }}>bradley.io</div>
          </div>
          <div
            style={{
              fontFamily: "Plex Mono",
              fontSize: 18,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            {cfg.note ?? ""}
          </div>
        </div>

        <div style={{ display: "flex", flexGrow: 1, alignItems: "center", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Plex Mono",
                fontSize: 22,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: STEEL_INK,
                marginBottom: 20,
              }}
            >
              {cfg.eyebrow}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {lines.map((l) => (
                <div
                  key={l}
                  style={{
                    fontFamily: "Archivo",
                    fontSize: size,
                    lineHeight: cfg.caps ? 0.98 : 1.04,
                    letterSpacing: "-0.02em",
                    textTransform: cfg.caps ? "uppercase" : "none",
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>
          {cfg.image ? (
            <div
              // Only a framed image carries border and shadow: satori draws
              // boxShadow "none" as a black box at the card's origin.
              style={
                cfg.imageFrame
                  ? { display: "flex", flexShrink: 0, border: `2px solid ${INK}`, boxShadow: `6px 6px 0 ${INK}` }
                  : { display: "flex", flexShrink: 0 }
              }
            >
              <img src={cfg.image} width={400} height={218} alt="" style={{ objectFit: "cover" }} />
            </div>
          ) : null}
        </div>

        {cfg.sentence ? (
          <div
            style={{
              display: "flex",
              paddingTop: 20,
              borderTop: `1px solid ${INK}`,
              fontSize: 26,
              lineHeight: 1.35,
              maxHeight: 20 + 26 * 1.35 * 2 + 2,
              overflow: "hidden",
            }}
          >
            {cfg.sentence}
          </div>
        ) : null}
      </div>
    ),
    {
      ...OG_KIT_SIZE,
      fonts: [
        { name: "Archivo", data: font("Archivo-800-latin.ttf"), weight: 800, style: "normal" },
        { name: "Plex Mono", data: font("IBMPlexMono-500-latin.ttf"), weight: 500, style: "normal" },
        { name: "Plex Serif", data: font("IBMPlexSerif-400-latin.ttf"), weight: 400, style: "normal" },
      ],
    },
  )
}
