import { ImageResponse } from "next/og"

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

type Accent = "cyan" | "orange" | "blue" | "green" | "purple" | "amber"

const ACCENTS: Record<Accent, { primary: string; secondary: string; tag: string }> = {
  cyan:   { primary: "#00F5FF", secondary: "#FF6B35", tag: "rgba(0, 245, 255, 0.12)" },
  orange: { primary: "#FF6B35", secondary: "#A3E635", tag: "rgba(255, 107, 53, 0.12)" },
  blue:   { primary: "#2563EB", secondary: "#3730A3", tag: "rgba(37, 99, 235, 0.12)" },
  green:  { primary: "#22C55E", secondary: "#06B6D4", tag: "rgba(34, 197, 94, 0.12)" },
  purple: { primary: "#A855F7", secondary: "#EC4899", tag: "rgba(168, 85, 247, 0.12)" },
  amber:  { primary: "#F59E0B", secondary: "#EF4444", tag: "rgba(245, 158, 11, 0.12)" },
}

export interface OgCardConfig {
  eyebrow: string
  title: string
  subtitle?: string
  tags?: string[]
  accent?: Accent
}

export function ogImageResponse(cfg: OgCardConfig): ImageResponse {
  const accent = ACCENTS[cfg.accent ?? "cyan"]

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          background:
            "radial-gradient(circle at 15% 20%, #1a2530 0%, #0B1215 55%, #050709 100%)",
          fontFamily: "system-ui, sans-serif",
          color: "#E8E2D9",
          position: "relative",
        }}
      >
        {/* Top accent gradient bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: `linear-gradient(90deg, ${accent.primary}, ${accent.secondary}, ${accent.primary})`,
          }}
        />

        {/* Subtle grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            display: "flex",
          }}
        />

        {/* Header: brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            position: "relative",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${accent.primary} 0%, ${accent.secondary} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0B1215",
              fontSize: 28,
              fontWeight: 800,
              boxShadow: `0 8px 24px ${accent.tag}`,
            }}
          >
            B
          </div>
          <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5 }}>
            bradley<span style={{ color: accent.primary, fontWeight: 400 }}>.io</span>
          </span>
        </div>

        {/* Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
            maxWidth: 980,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 3,
              color: accent.primary,
              marginBottom: 18,
            }}
          >
            {cfg.eyebrow}
          </span>
          <span
            style={{
              fontSize: cfg.title.length > 40 ? 64 : 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: "#FFFFFF",
              marginBottom: cfg.subtitle ? 22 : 0,
            }}
          >
            {cfg.title}
          </span>
          {cfg.subtitle ? (
            <span
              style={{
                fontSize: 26,
                lineHeight: 1.4,
                color: "#A3B8C3",
                maxWidth: 980,
                display: "flex",
              }}
            >
              {cfg.subtitle}
            </span>
          ) : null}
        </div>

        {/* Footer: tags */}
        <div
          style={{
            display: "flex",
            gap: 12,
            position: "relative",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {(cfg.tags ?? []).slice(0, 4).map((t) => (
              <div
                key={t}
                style={{
                  padding: "10px 18px",
                  borderRadius: 999,
                  fontSize: 17,
                  fontWeight: 600,
                  color: accent.primary,
                  background: accent.tag,
                  border: `1px solid ${accent.tag}`,
                }}
              >
                {t}
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 16,
              fontFamily: "monospace",
              color: "#8DA3B0",
              letterSpacing: 1,
            }}
          >
            bradley.io
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  )
}
