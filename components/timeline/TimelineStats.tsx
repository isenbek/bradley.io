"use client"

import { GitBranch, Code2, Clock, Languages } from "lucide-react"

interface TimelineStatsProps {
  totalRepos: number
  totalCommits: number
  firstCommit: string
  latestCommit: string
  languageCount: number
}

export function TimelineStats({
  totalRepos,
  totalCommits,
  firstCommit,
  latestCommit,
  languageCount,
}: TimelineStatsProps) {
  const start = new Date(firstCommit)
  const end = new Date(latestCommit)
  const months = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
  )
  const timeSpan = months >= 12 ? `${Math.round(months / 12)}+ years` : `${months} months`

  const stats = [
    { icon: GitBranch, label: "Repos", value: totalRepos },
    { icon: Code2, label: "Commits", value: totalCommits.toLocaleString() },
    { icon: Clock, label: "Span", value: timeSpan },
    { icon: Languages, label: "Languages", value: languageCount },
  ]

  return (
    <div className="flex flex-wrap gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-mono"
          style={{
            background:
              "color-mix(in srgb, var(--brand-primary) 8%, transparent)",
            border:
              "1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)",
          }}
        >
          <stat.icon
            className="w-4 h-4"
            style={{ color: "var(--brand-primary)" }}
          />
          <span style={{ color: "var(--brand-muted)" }}>{stat.label}</span>
          <span className="font-bold">{stat.value}</span>
        </div>
      ))}
    </div>
  )
}
