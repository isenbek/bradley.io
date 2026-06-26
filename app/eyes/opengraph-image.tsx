import { ImageResponse } from "next/og"
import { promises as fs } from "fs"
import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
// Regenerate on every fetch so a share/unfurl gets the most recent frame
// (otherwise Next bakes the build-time frame into a static OG image forever).
export const dynamic = "force-dynamic"
export const revalidate = 0

export const alt = "Eyes — the latest frame from the bradley.io box"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

const CACHE = process.env.CAM_CACHE_DIR || "/var/lib/bradley-cam"
const BLUE = "#13B8F3"

function fmtStamp(iso?: string): string {
  if (!iso) return ""
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/)
  return m ? `${m[1]} · ${m[2]}:${m[3]} UTC` : ""
}

export default async function Image() {
  let dataUrl = ""
  let stamp = ""
  try {
    const [jpg, metaRaw] = await Promise.all([
      fs.readFile(`${CACHE}/latest.jpg`),
      fs.readFile(`${CACHE}/latest.json`, "utf-8").catch(() => ""),
    ])
    dataUrl = `data:image/jpeg;base64,${jpg.toString("base64")}`
    if (metaRaw) {
      try {
        stamp = fmtStamp((JSON.parse(metaRaw) as { ts?: string }).ts)
      } catch {
        /* no stamp */
      }
    }
  } catch {
    // No frame yet — fall back to the static text card.
    return ogV3ImageResponse({
      eyebrow: "live · eyes",
      title: "A frame, once a minute.",
      subtitle:
        "A self-hosted frame grab from the attached camera — cached on the box, refreshed every minute. No stream, no cloud.",
      tags: ["v4l2", "ffmpeg", "systemd", "self-hosted"],
      accent: "blue",
      cta: "See the latest frame →",
    })
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#070b11",
          padding: 28,
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: `linear-gradient(90deg, ${BLUE}, #065673 60%, ${BLUE})`,
          }}
        />

        {/* header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 54,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "baseline", fontSize: 36, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
              bradley<span style={{ color: BLUE }}>.io</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#5f7c8a" }}>
              eyes
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {stamp ? (
              <div style={{ display: "flex", fontSize: 20, fontWeight: 600, color: "#8aa6b4" }}>{stamp}</div>
            ) : null}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "8px 16px",
                borderRadius: 999,
                background: "rgba(239,68,68,0.16)",
                border: "1px solid rgba(239,68,68,0.5)",
              }}
            >
              <div style={{ display: "flex", width: 11, height: 11, borderRadius: 999, background: "#ef4444" }} />
              <div style={{ display: "flex", fontSize: 18, fontWeight: 800, letterSpacing: "0.16em", color: "#fda4a4" }}>
                LIVE
              </div>
            </div>
          </div>
        </div>

        {/* framed photo — fixed 16:9 box, centered. The frame is normalized to
            16:9 at capture, so cover fills it exactly (no crop); the QuickCam's
            letterbox bars are baked into the frame itself. */}
        <div style={{ display: "flex", flex: 1, marginTop: 14, alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              width: 900,
              height: 506,
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 22px 55px -22px rgba(0,0,0,0.85)",
            }}
          >
            <img src={dataUrl} width={900} height={506} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      </div>
    ),
    { ...OG_V3_SIZE, headers: { "cache-control": "no-store, max-age=0, must-revalidate" } }
  )
}
