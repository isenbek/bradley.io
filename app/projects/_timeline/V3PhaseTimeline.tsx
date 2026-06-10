"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { TimelinePhase, TimelineRepo } from "@/lib/nominate-timeline-types"
import { langColor } from "./lang-colors"

const PHASE_COLORS: Record<string, string> = {
  systems: "#0A96C7",   // deep blue
  "ai-ml": "#A855F7",   // violet
  data: "#13B8F3",      // bio blue
  hardware: "#EE766C",  // coral
  creative: "#EDB427",  // gold
  research: "#169E73",  // green
}

function phaseColor(category: string): string {
  return PHASE_COLORS[category] ?? "#13B8F3"
}

function formatPhaseRange(startISO: string, endISO: string, isCurrent: boolean): string {
  const s = new Date(startISO)
  const e = new Date(endISO)
  const fmtMY = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
  const fmtM = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })
  const fmtMD = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    })

  if (isCurrent) return `${fmtMY(s)} – Present`
  if (s.getUTCFullYear() === e.getUTCFullYear() && s.getUTCMonth() === e.getUTCMonth()) {
    if (s.getUTCDate() === e.getUTCDate()) return fmtMD(s)
    return fmtMY(s)
  }
  if (s.getUTCFullYear() === e.getUTCFullYear()) return `${fmtM(s)} – ${fmtMY(e)}`
  return `${fmtMY(s)} – ${fmtMY(e)}`
}

function RepoCard({ repo, color }: { repo: TimelineRepo; color: string }) {
  return (
    <Link
      href={`/projects/${repo.name}`}
      className="v3-repocard"
      style={{
        ["--v3-phase-color" as string]: color,
        ["--v3-lang-color" as string]: langColor(repo.language),
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div className="v3-repocard__head">
        <span className="v3-repocard__name">{repo.name}</span>
        <span className="v3-repocard__lang">{repo.language || "—"}</span>
      </div>
      {repo.description ? (
        <p className="v3-repocard__desc">{repo.description}</p>
      ) : (
        <p
          className="v3-repocard__desc"
          style={{ color: "var(--v3-slate)", fontStyle: "italic" }}
        >
          no description
        </p>
      )}
      <div className="v3-repocard__foot">
        <span>{repo.commits.toLocaleString()} commits</span>
        <span>
          {new Date(repo.lastCommit).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          })}
        </span>
      </div>
    </Link>
  )
}

export function V3PhaseTimeline({
  phases,
  repos,
}: {
  phases: TimelinePhase[]
  repos: TimelineRepo[]
}) {
  const reversed = [...phases].reverse()
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  const repoMap = new Map(repos.map((r) => [r.name, r]))

  return (
    <div className="v3-phases">
      {reversed.map((phase, i) => {
        const color = phaseColor(phase.category)
        const isOpen = openIdx === i
        const phaseRepos = phase.repos
          .map((name) => repoMap.get(name))
          .filter(Boolean) as TimelineRepo[]
        const rangeLabel = formatPhaseRange(phase.startDate, phase.endDate, i === 0)

        return (
          <div
            key={`${phase.name}-${i}`}
            className="v3-phase"
            style={{ ["--v3-phase-color" as string]: color }}
          >
            <div className="v3-phase__rail">
              <span className="v3-phase__dot" aria-hidden />
            </div>
            <div>
              <div className="v3-phase__range">{rangeLabel}</div>
              <h3 className="v3-phase__name">{phase.name}</h3>
              <p className="v3-phase__desc">{phase.description}</p>

              {phase.milestones.length > 0 ? (
                <div className="v3-phase__milestones">
                  {phase.milestones.map((m, j) => (
                    <div key={`${m.date}-${j}`} className="v3-phase__milestone">
                      <span className="v3-phase__milestone-date">
                        {new Date(m.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                      </span>
                      <span className="v3-phase__milestone-title">{m.title}</span>
                      <span className="v3-phase__milestone-repo">{m.repo}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {phaseRepos.length > 0 ? (
                <>
                  <button
                    type="button"
                    className="v3-phase__toggle"
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    <ChevronRight
                      size={13}
                      strokeWidth={2.25}
                      className="v3-phase__chev"
                      data-open={isOpen}
                    />
                    {phase.repos.length} repo{phase.repos.length === 1 ? "" : "s"}
                  </button>
                  {isOpen ? (
                    <div className="v3-phase__repos">
                      {phaseRepos.map((repo) => (
                        <RepoCard key={repo.name} repo={repo} color={color} />
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
