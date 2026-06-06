import { ImageResponse } from "next/og"

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
          background: "linear-gradient(135deg, #1C1412 0%, #0D0B0A 100%)",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #00F5FF 0%, #FF6B35 100%)",
            color: "#0B1215",
            fontSize: 76,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          B
        </div>
      </div>
    ),
    size
  )
}
