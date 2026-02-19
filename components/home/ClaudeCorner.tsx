"use client"

import { Bot } from "lucide-react"
import type { ClaudeCorner as ClaudeCornerData } from "@/lib/site-data"

const moodAccents: Record<ClaudeCornerData["mood"], string> = {
  excited: "var(--brand-warning)",
  reflective: "var(--brand-info)",
  impressed: "var(--brand-primary)",
  curious: "var(--brand-secondary)",
  amused: "var(--brand-success)",
}

export function ClaudeCorner({ data }: { data?: ClaudeCornerData }) {
  if (!data) return null

  const accent = moodAccents[data.mood] || "var(--brand-primary)"

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--brand-bg-alt)",
        border: "1px solid var(--brand-border)",
      }}
    >
      <div className="h-[3px] w-full" style={{ background: accent }} />
      <div className="p-5 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: `color-mix(in srgb, ${accent} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${accent} 25%, transparent)`,
            }}
          >
            <Bot className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div>
            <h3 className="text-sm font-bold">Claude&apos;s Corner</h3>
            <span
              className="text-[10px] font-mono uppercase tracking-widest"
              style={{ color: accent }}
            >
              {data.mood}
            </span>
          </div>
        </div>

        <blockquote
          className="text-sm sm:text-base leading-relaxed mb-4"
          style={{
            color: "var(--brand-steel)",
            borderLeft: `3px solid color-mix(in srgb, ${accent} 40%, transparent)`,
            paddingLeft: "1rem",
          }}
        >
          &ldquo;{data.quote}&rdquo;
        </blockquote>

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono" style={{ color: "var(--brand-muted)" }}>
            {data.context}
          </span>
          <span className="text-[11px] font-mono" style={{ color: "var(--brand-muted)" }}>
            {new Date(data.generatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
