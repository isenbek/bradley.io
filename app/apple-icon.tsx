/*
 * Steel, bradley.io's family hue (owner's call, 2026-10-04): the tile is
 * Steel's main tone (#41749D), the wordmark is the kit's paper (#F4F2EC) and
 * the i-dot is Steel's tint (#C8DAEA). The same three colours as app/icon.svg,
 * so the tab, the home-screen icon, the masthead die (.die--mark in
 * app/kit.css) and the Meatball Labs family dot agree.
 * (Until 2026-10-04 these were the masthead die, mustard on ink, while the
 * SVG favicon was still the deleted v3's blue.)
 *
 * Hex, not var(): satori rasterises these and resolves no custom properties.
 * Steel's tones come from the family style guide (meatball.ai/styleguide.html#steel).
 * Expect the old icon to hang around in browser tabs for days; favicons cache hard.
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
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#41749D",
          borderRadius: 40,
        }}
      >
        <svg width="132" height="69" viewBox={BIO_LOGO_VIEWBOX} preserveAspectRatio="xMidYMid meet">
          <g transform={BIO_LOGO_GROUP_TRANSFORM}>
            <path d={BIO_LOGO_BODY_PATH} fill="#F4F2EC" />
            <path d={BIO_LOGO_BOWL_PATH} fill="#F4F2EC" />
            <circle cx={BIO_LOGO_DOT.cx} cy={BIO_LOGO_DOT.cy} r={BIO_LOGO_DOT.r} fill="#C8DAEA" />
          </g>
        </svg>
      </div>
    ),
    size
  )
}
