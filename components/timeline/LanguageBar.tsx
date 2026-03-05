"use client"

import { useState } from "react"

interface LanguageBarProps {
  languages: Record<string, number>
}

const LANGUAGE_COLORS: Record<string, string> = {
  Python: "var(--brand-info)",
  TypeScript: "var(--brand-primary)",
  JavaScript: "var(--brand-warning)",
  Go: "var(--brand-secondary)",
  Rust: "var(--brand-steel)",
  Shell: "var(--brand-muted)",
}

export function LanguageBar({ languages }: LanguageBarProps) {
  const [hoveredLang, setHoveredLang] = useState<string | null>(null)

  const sorted = Object.entries(languages).sort(([, a], [, b]) => b - a)
  const total = sorted.reduce((sum, [, count]) => sum + count, 0)

  const top5 = sorted.slice(0, 5)
  const otherCount = sorted.slice(5).reduce((sum, [, count]) => sum + count, 0)
  const segments = otherCount > 0 ? [...top5, ["Other", otherCount] as [string, number]] : top5

  return (
    <div>
      <div
        className="flex rounded-lg overflow-hidden h-3"
        style={{ background: "var(--brand-bg-alt)" }}
      >
        {segments.map(([lang, count]) => {
          const pct = (count / total) * 100
          if (pct < 1) return null
          const color =
            LANGUAGE_COLORS[lang] ||
            "color-mix(in srgb, var(--brand-primary) 40%, var(--brand-muted))"
          return (
            <div
              key={lang}
              className="relative cursor-pointer transition-opacity"
              style={{
                width: `${pct}%`,
                background: color,
                opacity: hoveredLang && hoveredLang !== lang ? 0.4 : 1,
              }}
              onMouseEnter={() => setHoveredLang(lang)}
              onMouseLeave={() => setHoveredLang(null)}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {segments.map(([lang, count]) => {
          const pct = ((count / total) * 100).toFixed(1)
          const color =
            LANGUAGE_COLORS[lang] ||
            "color-mix(in srgb, var(--brand-primary) 40%, var(--brand-muted))"
          return (
            <div
              key={lang}
              className="flex items-center gap-1.5 text-xs font-mono cursor-pointer"
              onMouseEnter={() => setHoveredLang(lang)}
              onMouseLeave={() => setHoveredLang(null)}
              style={{
                opacity: hoveredLang && hoveredLang !== lang ? 0.4 : 1,
              }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: color }}
              />
              <span>{lang}</span>
              <span style={{ color: "var(--brand-muted)" }}>
                {count} ({pct}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
