import { ImageResponse } from "next/og"

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
          background: "#1C1412",
          borderRadius: 32,
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #00F5FF 0%, #FF6B35 100%)",
            color: "#0B1215",
            fontSize: 84,
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
