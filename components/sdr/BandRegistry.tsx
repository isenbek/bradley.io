"use client"

import { motion } from "framer-motion"
import type { Band } from "./api"

function fmtChannels(c: number[] | null): string {
  if (!c || c.length === 0) return "—"
  if (c.length > 8) return `${c.slice(0, 4).join(", ")}… (${c.length} total)`
  return c.join(", ")
}

export function BandRegistry({ bands }: { bands: Band[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-2xl p-5 sm:p-7"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium font-mono uppercase tracking-wide" style={{ color: "var(--brand-muted)" }}>
          Band Registry · {bands.length} configured
        </h3>
      </div>

      {bands.length === 0 ? (
        <div className="py-6 text-center font-mono text-xs" style={{ color: "var(--brand-muted)" }}>
          no bands configured
        </div>
      ) : (
        <div className="space-y-2">
          {bands.map((b) => (
            <div
              key={b.id}
              className="rounded-lg px-4 py-3 grid grid-cols-12 gap-3 items-center"
              style={{ background: "var(--brand-bg)", border: "1px solid var(--brand-border)" }}
            >
              <div className="col-span-6 sm:col-span-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: b.enabled
                        ? "var(--brand-success, #22c55e)"
                        : "var(--brand-muted)",
                    }}
                  />
                  <span className="font-mono text-sm font-bold" style={{ color: "var(--brand-text)" }}>
                    {b.name}
                  </span>
                </div>
                <div className="font-mono text-[10px]" style={{ color: "var(--brand-muted)" }}>
                  scanner · {b.scanner}
                </div>
              </div>
              <div className="col-span-6 sm:col-span-6 font-mono text-[11px]" style={{ color: "var(--brand-muted)" }}>
                {b.channels ? `channels: ${fmtChannels(b.channels)}` : `${b.lo_hz} – ${b.hi_hz} Hz`}
              </div>
              <div className="col-span-12 sm:col-span-2 text-right">
                <span
                  className="font-mono text-[10px] px-2 py-0.5 rounded uppercase tracking-wide"
                  style={{
                    background: b.enabled
                      ? "color-mix(in srgb, var(--brand-success, #22c55e) 12%, transparent)"
                      : "color-mix(in srgb, var(--brand-muted) 12%, transparent)",
                    color: b.enabled ? "var(--brand-success, #22c55e)" : "var(--brand-muted)",
                  }}
                >
                  {b.enabled ? "enabled" : "disabled"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
