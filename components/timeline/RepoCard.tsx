import type { TimelineRepo } from "@/lib/nominate-timeline-types"

interface RepoCardProps {
  repo: TimelineRepo
  phaseColor: string
}

export function RepoCard({ repo, phaseColor }: RepoCardProps) {
  const start = new Date(repo.firstCommit).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })
  const end = new Date(repo.lastCommit).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--brand-bg-alt)",
        border: "1px solid var(--brand-border)",
      }}
    >
      <div className="h-[3px] w-full" style={{ background: phaseColor }} />
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-sm font-bold font-mono">{repo.name}</h4>
          {repo.language && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background:
                  "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
                color: "var(--brand-primary)",
              }}
            >
              {repo.language}
            </span>
          )}
        </div>
        <p
          className="text-xs leading-relaxed mb-2 line-clamp-2"
          style={{ color: "var(--brand-muted)" }}
        >
          {repo.description}
        </p>
        <div
          className="flex items-center gap-3 text-[10px] font-mono"
          style={{ color: "var(--brand-muted)" }}
        >
          <span>{repo.commits} commits</span>
          <span>
            {start} &ndash; {end}
          </span>
        </div>
      </div>
    </div>
  )
}
