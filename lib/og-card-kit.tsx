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
 * The share card in the kit's style (2026-10-23, the home card first; the
 * other routes still use lib/og-card-v3.tsx).
 *
 * A datasheet page: paper ground, ink type, hairline rules in ink. Archivo
 * for the headline, Plex Mono for labels, Plex Serif for the sentence, and
 * the logo's steel as the one accent, as on the site. No gradient, no glow.
 *
 * Satori cannot read CSS variables, so the kit's tokens are literal hex here,
 * copied from app/beta/kit/tokens.css and the top of app/kit.css. Fonts are
 * TTF copies of the kit's own (lib/og-fonts/README.md).
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
  /** Mono caps over the headline. */
  eyebrow: string
  /** The headline, one entry per line. */
  lines: string[]
  /** One sentence under it, in the serif. */
  sentence?: string
  /** Mono caps, bottom right. */
  foot?: string
}

export function ogKitImageResponse(cfg: OgKitConfig): ImageResponse {
  const big = cfg.lines.length > 2 ? 84 : 100
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
          padding: "56px 72px 48px",
          fontFamily: "Plex Serif",
        }}
      >
        {/* Masthead: the mark and the name, over an ink hairline. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 22,
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
          <div style={{ fontFamily: "Plex Mono", fontSize: 18, letterSpacing: "0.12em", color: MUTED }}>
            {cfg.foot ?? ""}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Plex Mono",
              fontSize: 22,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: STEEL_INK,
              marginBottom: 22,
            }}
          >
            {cfg.eyebrow}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {cfg.lines.map((l) => (
              <div
                key={l}
                style={{
                  fontFamily: "Archivo",
                  fontSize: big,
                  lineHeight: 0.98,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                }}
              >
                {l}
              </div>
            ))}
          </div>
        </div>

        {cfg.sentence ? (
          <div
            style={{
              display: "flex",
              paddingTop: 22,
              borderTop: `1px solid ${INK}`,
              fontSize: 28,
              lineHeight: 1.35,
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
