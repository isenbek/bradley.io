import { ImageResponse } from "next/og"
import {
  BIO_LOGO_BODY_PATH,
  BIO_LOGO_BOWL_PATH,
  BIO_LOGO_DOT,
  BIO_LOGO_GROUP_TRANSFORM,
  BIO_LOGO_VIEWBOX,
} from "@/lib/bio-logo-path"

/** Tint a hex color toward white by ~22% — used for the i-dot accent in OG cards. */
function lighten(hex: string): string {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return hex
  const mix = (c: number) => Math.round(c + (255 - c) * 0.28)
  const r = mix(parseInt(m[1], 16))
  const g = mix(parseInt(m[2], 16))
  const b = mix(parseInt(m[3], 16))
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`
}

export const OG_V3_SIZE = { width: 1200, height: 630 }
export const OG_V3_CONTENT_TYPE = "image/png"

type V3Accent = "blue" | "coral" | "gold" | "green"

const ACCENTS: Record<V3Accent, { primary: string; ink: string; chip: string }> = {
  blue:  { primary: "#13B8F3", ink: "#065673", chip: "rgba(19, 184, 243, 0.12)" },
  coral: { primary: "#EE766C", ink: "#7A2A22", chip: "rgba(238, 118, 108, 0.14)" },
  gold:  { primary: "#EDB427", ink: "#7C5605", chip: "rgba(237, 180, 39, 0.16)" },
  green: { primary: "#169E73", ink: "#0F7355", chip: "rgba(22, 158, 115, 0.14)" },
}

export interface OgCardV3Config {
  eyebrow: string
  title: string
  subtitle?: string
  tags?: string[]
  accent?: V3Accent
  cta?: string
  /** Optional data-URI (e.g. a mascot) rendered on the right side of the card. */
  image?: string
  /** Frame the image as a photo card (rounded corners + border + shadow). */
  imageFrame?: boolean
}

/**
 * V3 share card — light Bio Blue palette, paper background, friendly wordmark.
 * Counterpart to lib/og-card.tsx (dark) used by the v1/v2 routes.
 */
export function ogV3ImageResponse(cfg: OgCardV3Config): ImageResponse {
  const accent = ACCENTS[cfg.accent ?? "blue"]

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
            "radial-gradient(circle at 15% 15%, #FBFAF5 0%, #F4F2E9 60%, #ECE9DC 100%)",
          fontFamily: "system-ui, sans-serif",
          color: "#252521",
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
            height: 6,
            background: `linear-gradient(90deg, ${accent.primary}, ${accent.ink} 60%, ${accent.primary})`,
          }}
        />

        {/* Blueprint dotted grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(8, 116, 155, 0.16) 1.4px, transparent 1.4px)",
            backgroundSize: "30px 30px",
            opacity: 0.5,
          }}
        />

        {/* Brand mark — top-left, stacked identity block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 4,
            zIndex: 1,
          }}
        >
          <svg
            width="160"
            height="84"
            viewBox={BIO_LOGO_VIEWBOX}
            preserveAspectRatio="xMidYMid meet"
          >
            <g transform={BIO_LOGO_GROUP_TRANSFORM}>
              <path d={BIO_LOGO_BODY_PATH} fill={accent.primary} />
              <path d={BIO_LOGO_BOWL_PATH} fill={accent.primary} />
              <circle
                cx={BIO_LOGO_DOT.cx}
                cy={BIO_LOGO_DOT.cy}
                r={BIO_LOGO_DOT.r}
                fill={lighten(accent.primary)}
              />
            </g>
          </svg>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "#252521",
              lineHeight: 1,
              marginTop: 4,
            }}
          >
            bradley<span style={{ color: accent.primary }}>.io</span>
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: accent.ink,
              marginTop: 6,
            }}
          >
            Bradley S. Isenbek · Frontier Technologist
          </div>
        </div>

        {/* Optional image on the right — a bare mascot, or a framed photo card */}
        {cfg.image ? (
          cfg.imageFrame ? (
            <div
              style={{
                position: "absolute",
                right: 52,
                top: 168,
                display: "flex",
                borderRadius: 20,
                overflow: "hidden",
                border: `4px solid ${accent.primary}`,
                boxShadow: `0 26px 50px -18px ${accent.ink}99`,
                zIndex: 1,
              }}
            >
              <img src={cfg.image} width={430} height={234} alt="" />
            </div>
          ) : (
            <img
              src={cfg.image}
              width={420}
              height={229}
              alt=""
              style={{ position: "absolute", right: 44, top: 198, zIndex: 1 }}
            />
          )
        ) : null}

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            zIndex: 1,
            maxWidth: cfg.image ? 620 : 900,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: accent.ink,
            }}
          >
            <div style={{ display: "flex", width: 36, height: 3, background: accent.primary }} />
            {cfg.eyebrow}
          </div>

          <div
            style={{
              fontSize: cfg.image ? 60 : 76,
              fontWeight: 800,
              lineHeight: 1.03,
              letterSpacing: "-0.035em",
              color: "#252521",
            }}
          >
            {cfg.title}
          </div>

          {cfg.subtitle ? (
            <div
              style={{
                fontSize: 28,
                fontWeight: 500,
                lineHeight: 1.35,
                color: "#33332E",
                maxWidth: 880,
              }}
            >
              {cfg.subtitle}
            </div>
          ) : null}
        </div>

        {/* Bottom row — tags + CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {(cfg.tags ?? []).map((t) => (
              <div
                key={t}
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  padding: "8px 18px",
                  borderRadius: 999,
                  background: accent.chip,
                  color: accent.ink,
                  border: `1px solid ${accent.primary}33`,
                }}
              >
                {t}
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              padding: "14px 26px",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${accent.primary}, ${accent.ink})`,
              color: "#FFFFFF",
              boxShadow: `0 14px 30px -10px ${accent.primary}80`,
              letterSpacing: "0.01em",
            }}
          >
            {cfg.cta ?? "Read more →"}
          </div>
        </div>
      </div>
    ),
    OG_V3_SIZE
  )
}
