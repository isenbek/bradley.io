"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { TimelinePhase, TimelineRepo } from "@/lib/nominate-timeline-types"
import { RepoCard } from "./RepoCard"

const PHASE_COLORS: Record<string, string> = {
  systems: "var(--brand-steel)",
  "ai-ml": "var(--brand-secondary)",
  data: "var(--brand-info)",
  hardware: "var(--brand-primary)",
  creative: "var(--brand-warning)",
}

function getPhaseColor(category: string): string {
  return PHASE_COLORS[category] || "var(--brand-primary)"
}

interface PhaseTimelineProps {
  phases: TimelinePhase[]
  repos: TimelineRepo[]
}

export function PhaseTimeline({ phases, repos }: PhaseTimelineProps) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)

  const repoMap = new Map(repos.map((r) => [r.name, r]))

  return (
    <div className="space-y-0">
      {phases.map((phase, i) => {
        const color = getPhaseColor(phase.category)
        const isExpanded = expandedPhase === phase.name
        const phaseRepos = phase.repos
          .map((name) => repoMap.get(name))
          .filter(Boolean) as TimelineRepo[]

        const startLabel = new Date(phase.startDate).toLocaleDateString(
          "en-US",
          { month: "short", year: "numeric" }
        )
        const endLabel = new Date(phase.endDate).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        })

        return (
          <div key={phase.name} className="flex gap-4 sm:gap-6">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className="w-3 h-3 rounded-full shrink-0 mt-1"
                style={{
                  background: color,
                  boxShadow: `0 0 8px color-mix(in srgb, ${color} 50%, transparent)`,
                }}
              />
              {i < phases.length - 1 && (
                <div
                  className="w-px flex-1"
                  style={{
                    background: `linear-gradient(to bottom, ${color}, var(--brand-border))`,
                  }}
                />
              )}
            </div>

            {/* Phase card */}
            <div className="pb-8 sm:pb-10 flex-1 min-w-0">
              <div className="text-xs font-mono mb-1" style={{ color }}>
                {startLabel} &ndash; {endLabel}
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">
                {phase.name}
              </h3>
              <p
                className="text-sm leading-relaxed mb-3"
                style={{ color: "var(--brand-muted)" }}
              >
                {phase.description}
              </p>

              {/* Milestones */}
              {phase.milestones.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {phase.milestones.map((m, j) => (
                    <div
                      key={j}
                      className="flex items-start gap-2 text-xs"
                    >
                      <span
                        className="font-mono shrink-0"
                        style={{ color }}
                      >
                        {new Date(m.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span style={{ color: "var(--brand-muted)" }}>
                        {m.title}
                      </span>
                      <span
                        className="font-mono opacity-50 shrink-0"
                        style={{ color: "var(--brand-muted)" }}
                      >
                        {m.repo}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Repo badges + expand */}
              <button
                onClick={() =>
                  setExpandedPhase(isExpanded ? null : phase.name)
                }
                className="flex items-center gap-1.5 text-xs font-mono cursor-pointer"
                style={{ color }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                {phase.repos.length} repos
              </button>

              {/* Expanded repo grid */}
              {isExpanded && phaseRepos.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                  {phaseRepos.map((repo) => (
                    <RepoCard
                      key={repo.name}
                      repo={repo}
                      phaseColor={color}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
