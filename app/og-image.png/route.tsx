import { ImageResponse } from "next/og"

export const runtime = "nodejs"

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          background: "linear-gradient(135deg, #1C1412 0%, #0D0B0A 50%, #1A1520 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #00F5FF, #FF6B35, #00F5FF)",
          }}
        />

        {/* Logo area */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #00F5FF 0%, #FF6B35 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 800,
              color: "#1C1412",
            }}
          >
            B
          </div>
          <span style={{ fontSize: "28px", fontWeight: 700, color: "#E8E2D9" }}>
            bradley<span style={{ color: "#00F5FF", fontWeight: 400 }}>.io</span>
          </span>
        </div>

        {/* Title */}
        <div style={{ fontSize: "56px", fontWeight: 800, lineHeight: 1.1, marginBottom: "24px", display: "flex", flexDirection: "column" }}>
          <span style={{ color: "#E8E2D9" }}>Hardware hacker.</span>
          <span style={{ color: "#00F5FF" }}>Data architect.</span>
          <span style={{ color: "#FF6B35" }}>AI pilot.</span>
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: "22px", color: "#9CA3AF", lineHeight: 1.5, maxWidth: "700px" }}>
          Building at the intersection of enterprise scale and maker culture — from ESP32 mesh networks to Fortune 500 data warehouses.
        </div>

        {/* Bottom badges */}
        <div style={{ display: "flex", gap: "12px", marginTop: "40px" }}>
          {["AI Engineering", "Edge Computing", "Data Architecture", "IoT"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#00F5FF",
                background: "rgba(0, 245, 255, 0.1)",
                border: "1px solid rgba(0, 245, 255, 0.2)",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
