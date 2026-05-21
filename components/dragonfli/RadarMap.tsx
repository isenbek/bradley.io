"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import type { Aircraft, ReceiverFix } from "./api"

const SIZE = 360
const PAD = 16

const RANGE_OPTIONS = [
  { id: 50, label: "50nm" },
  { id: 100, label: "100nm" },
  { id: 200, label: "200nm" },
] as const

const NM_PER_DEG = 60 // 1 degree of latitude ≈ 60 nautical miles

function altColor(alt: number | null): string {
  if (alt == null) return "var(--brand-muted)"
  if (alt < 10000) return "var(--brand-warning, #f59e0b)"
  if (alt < 25000) return "var(--brand-primary)"
  return "var(--brand-secondary)"
}

interface Props {
  aircraft: Aircraft[]
  receiver: ReceiverFix | null
}

export function RadarMap({ aircraft, receiver }: Props) {
  const [rangeNm, setRangeNm] = useState<number>(100)
  const [hover, setHover] = useState<Aircraft | null>(null)

  const center = receiver ? { lat: receiver.lat, lon: receiver.lon } : null
  const cosLat = center ? Math.cos((center.lat * Math.PI) / 180) : 1

  const cx = SIZE / 2
  const cy = SIZE / 2
  const r = (SIZE - PAD * 2) / 2

  const placed = useMemo(() => {
    if (!center) return []
    return aircraft
      .filter((a) => a.lat != null && a.lon != null)
      .map((a) => {
        const dLat = (a.lat as number) - center.lat
        const dLon = (a.lon as number) - center.lon
        const yNm = dLat * NM_PER_DEG
        const xNm = dLon * NM_PER_DEG * cosLat
        const dist = Math.hypot(xNm, yNm)
        const xpx = cx + (xNm / rangeNm) * r
        const ypx = cy - (yNm / rangeNm) * r
        return { a, dist, xpx, ypx }
      })
      .filter((p) => p.dist <= rangeNm)
  }, [aircraft, center, cosLat, cx, cy, r, rangeNm])

  const rings = [0.25, 0.5, 0.75, 1.0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl p-5 sm:p-7"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-sm font-medium font-mono uppercase tracking-wide" style={{ color: "var(--brand-muted)" }}>
            Local Radar · top-down view
          </h3>
          <div className="font-mono text-[10px] mt-1" style={{ color: "var(--brand-muted)" }}>
            {placed.length} / {aircraft.length} aircraft in range
          </div>
        </div>
        <div
          className="flex gap-0.5 p-0.5 rounded-md self-end sm:self-auto"
          style={{ background: "color-mix(in srgb, var(--brand-border) 50%, transparent)" }}
        >
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setRangeNm(r.id)}
              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all"
              style={{
                background:
                  rangeNm === r.id
                    ? "color-mix(in srgb, var(--brand-primary) 20%, transparent)"
                    : "transparent",
                color: rangeNm === r.id ? "var(--brand-primary)" : "var(--brand-muted)",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center lg:items-start">
        <div className="relative" style={{ width: SIZE, height: SIZE, maxWidth: "100%" }}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto block">
            <defs>
              <radialGradient id="dragonfli-radar-bg">
                <stop offset="0%" stopColor="color-mix(in srgb, var(--brand-primary) 4%, transparent)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            <circle cx={cx} cy={cy} r={r} fill="url(#dragonfli-radar-bg)" />

            {/* Range rings */}
            {rings.map((f) => (
              <g key={f}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r * f}
                  fill="none"
                  stroke="var(--brand-border)"
                  strokeWidth={0.5}
                  strokeDasharray="2 4"
                />
                <text
                  x={cx + r * f - 2}
                  y={cy - 4}
                  textAnchor="end"
                  fontSize="8"
                  fontFamily="var(--font-mono)"
                  fill="var(--brand-muted)"
                  opacity="0.6"
                >
                  {Math.round(rangeNm * f)}
                </text>
              </g>
            ))}

            {/* Cardinal lines */}
            <line x1={cx} y1={PAD} x2={cx} y2={SIZE - PAD} stroke="var(--brand-border)" strokeWidth={0.5} />
            <line x1={PAD} y1={cy} x2={SIZE - PAD} y2={cy} stroke="var(--brand-border)" strokeWidth={0.5} />

            {/* Cardinal labels */}
            {(["N", "E", "S", "W"] as const).map((d, i) => {
              const pos = [
                [cx, PAD + 6],
                [SIZE - PAD - 4, cy + 3],
                [cx, SIZE - PAD - 2],
                [PAD + 4, cy + 3],
              ][i]
              return (
                <text
                  key={d}
                  x={pos[0]}
                  y={pos[1]}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                  fill="var(--brand-muted)"
                  opacity="0.7"
                >
                  {d}
                </text>
              )
            })}

            {/* Receiver */}
            <circle cx={cx} cy={cy} r={3} fill="var(--brand-primary)" />
            <circle cx={cx} cy={cy} r={6} fill="none" stroke="var(--brand-primary)" strokeWidth={0.5} opacity="0.4">
              <animate attributeName="r" from="6" to="14" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Aircraft */}
            {placed.map(({ a, xpx, ypx }) => {
              const color = altColor(a.alt_baro)
              const heading = a.track ?? 0
              const isHover = hover?.icao === a.icao
              return (
                <g
                  key={a.icao}
                  transform={`translate(${xpx} ${ypx}) rotate(${heading})`}
                  onMouseEnter={() => setHover(a)}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer" }}
                >
                  <polygon
                    points="0,-5 4,4 0,2 -4,4"
                    fill={color}
                    stroke={isHover ? "var(--brand-text)" : "none"}
                    strokeWidth={1}
                  />
                </g>
              )
            })}
          </svg>
        </div>

        <div className="flex-1 min-h-[120px] w-full">
          <div className="font-mono text-[10px] uppercase tracking-wide mb-2" style={{ color: "var(--brand-muted)" }}>
            {hover ? "selected" : "altitude legend"}
          </div>
          {hover ? (
            <div
              className="rounded-lg p-3 font-mono text-xs space-y-1"
              style={{ background: "var(--brand-bg)", border: "1px solid var(--brand-border)" }}
            >
              <div className="text-sm font-bold" style={{ color: "var(--brand-primary)" }}>
                {hover.callsign?.trim() || hover.icao.toUpperCase()}
              </div>
              <div style={{ color: "var(--brand-muted)" }}>
                {cleanName(hover.enrich?.owner)} · {cleanName(hover.enrich?.model)}
              </div>
              <div className="grid grid-cols-2 gap-x-3 text-[11px]" style={{ color: "var(--brand-muted)" }}>
                <span>alt · <strong style={{ color: "var(--brand-text)" }}>{hover.alt_baro?.toLocaleString() ?? "—"}ft</strong></span>
                <span>spd · <strong style={{ color: "var(--brand-text)" }}>{hover.speed != null ? Math.round(hover.speed) + "kt" : "—"}</strong></span>
                <span>trk · <strong style={{ color: "var(--brand-text)" }}>{hover.track != null ? Math.round(hover.track) + "°" : "—"}</strong></span>
                <span>vr · <strong style={{ color: "var(--brand-text)" }}>{hover.vertical_rate ?? 0} fpm</strong></span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 font-mono text-[11px]" style={{ color: "var(--brand-muted)" }}>
              <Legend color="var(--brand-warning, #f59e0b)" label="< 10,000 ft" />
              <Legend color="var(--brand-primary)" label="10,000 – 25,000 ft" />
              <Legend color="var(--brand-secondary)" label="> 25,000 ft" />
              <div className="pt-2 text-[10px]">
                Receiver at the centre · rings every {Math.round(rangeNm / 4)}nm
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      <span>{label}</span>
    </div>
  )
}

function cleanName(s: string | null | undefined): string {
  return (s ?? "").trim().replace(/\s+/g, " ")
}
