import { ImageResponse } from "next/og"

export const runtime = "nodejs"
export const size = { width: 512, height: 512 }
export const contentType = "image/png"

export default function Icon512() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1C1412",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            width: 352,
            height: 352,
            borderRadius: 76,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #00F5FF 0%, #FF6B35 100%)",
            color: "#0B1215",
            fontSize: 224,
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
