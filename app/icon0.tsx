/*
 * Recoloured onto the style kit at the cutover. The tile is --color-ink and the
 * mark is --color-mustard, which is exactly the masthead die: the favicon is a
 * miniature of the thing at the top of the page, so the tab and the header
 * agree. The i-dot takes --color-accent, which is what the three-piece split in
 * lib/bio-logo-path.ts is for.
 *
 * Hex, not var(): satori rasterises these and resolves no custom properties.
 * If tokens.css moves, these move by hand. Also expect the old blue icon to
 * hang around in browser tabs for days; favicons cache hard.
 */
import { ImageResponse } from "next/og"
import {
  BIO_LOGO_BODY_PATH,
  BIO_LOGO_BOWL_PATH,
  BIO_LOGO_DOT,
  BIO_LOGO_GROUP_TRANSFORM,
  BIO_LOGO_VIEWBOX,
} from "@/lib/bio-logo-path"

export const runtime = "nodejs"
export const size = { width: 192, height: 192 }
export const contentType = "image/png"

export default function Icon192() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#16150F",
          borderRadius: 40,
        }}
      >
        <svg width="140" height="74" viewBox={BIO_LOGO_VIEWBOX} preserveAspectRatio="xMidYMid meet">
          <g transform={BIO_LOGO_GROUP_TRANSFORM}>
            <path d={BIO_LOGO_BODY_PATH} fill="#D2B771" />
            <path d={BIO_LOGO_BOWL_PATH} fill="#D2B771" />
            <circle cx={BIO_LOGO_DOT.cx} cy={BIO_LOGO_DOT.cy} r={BIO_LOGO_DOT.r} fill="#D06B40" />
          </g>
        </svg>
      </div>
    ),
    size
  )
}
