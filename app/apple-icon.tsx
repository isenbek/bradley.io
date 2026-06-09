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
          background: "linear-gradient(135deg, #29BFF4 0%, #13B8F3 50%, #0A96C7 100%)",
          borderRadius: 40,
        }}
      >
        <svg width="132" height="69" viewBox={BIO_LOGO_VIEWBOX} preserveAspectRatio="xMidYMid meet">
          <g transform={BIO_LOGO_GROUP_TRANSFORM}>
            <path d={BIO_LOGO_BODY_PATH} fill="#FBFAF5" />
            <path d={BIO_LOGO_BOWL_PATH} fill="#FBFAF5" />
            <circle cx={BIO_LOGO_DOT.cx} cy={BIO_LOGO_DOT.cy} r={BIO_LOGO_DOT.r} fill="#CEF0FD" />
          </g>
        </svg>
      </div>
    ),
    size
  )
}
