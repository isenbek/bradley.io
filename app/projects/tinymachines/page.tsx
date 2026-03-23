import { readFileSync } from "fs"
import { join } from "path"
import type { Metadata } from "next"
import type { NominateTimeline } from "@/lib/nominate-timeline-types"
import { TimelineStats } from "@/components/timeline/TimelineStats"
import { LanguageBar } from "@/components/timeline/LanguageBar"
import { PhaseTimeline } from "@/components/timeline/PhaseTimeline"
import { CommitHeatmap } from "@/components/timeline/CommitHeatmap"
import { timeAgo } from "@/lib/time-ago"

export const metadata: Metadata = {
  title: "tinymachines Platform Timeline",
  description:
    "Full development timeline of tinymachines — 56 repos spanning hardware hacking, systems programming, and maker projects.",
  alternates: { canonical: "/projects/tinymachines" },
  openGraph: {
    title: "tinymachines Platform Timeline | bradley.io",
    description:
      "Full development timeline of tinymachines — hardware hacking, systems programming, and maker projects.",
    url: "https://bradley.io/projects/tinymachines",
  },
}

function loadTimeline(): NominateTimeline | null {
  try {
    const raw = readFileSync(
      join(process.cwd(), "public/data/tinymachines-timeline.json"),
      "utf-8"
    )
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default function TinymachinesPage() {
  const data = loadTimeline()

  if (!data) {
    return (
      <main className="container-page py-16 sm:py-24">
        <h1 className="text-3xl font-extrabold mb-4">tinymachines Timeline</h1>
        <p style={{ color: "var(--brand-muted)" }}>
          Timeline data not yet generated. Run{" "}
          <code className="font-mono text-sm px-1.5 py-0.5 rounded" style={{ background: "var(--brand-bg-alt)" }}>
            python3 scripts/nominate-timeline-pipeline.py --target tinymachines
          </code>{" "}
          to populate.
        </p>
      </main>
    )
  }

  return (
    <main className="container-page py-12 sm:py-20">
      {/* Hero */}
      <div className="mb-10 sm:mb-14">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="text-xs font-semibold uppercase tracking-[3px]"
            style={{ color: "var(--brand-primary)" }}
          >
            Platform Timeline
          </div>
          <span
            className="text-[10px] font-mono tracking-wide opacity-60"
            style={{ color: "var(--brand-muted)" }}
          >
            updated {timeAgo(data.generated)}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          tinymachines
        </h1>
        <p
          className="text-base sm:text-lg max-w-2xl mb-6"
          style={{ color: "var(--brand-muted)" }}
        >
          {data.totalRepos} repositories built from{" "}
          {new Date(data.firstCommit).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}{" "}
          to present. Hardware hacking, systems programming, and maker projects.
        </p>
        <TimelineStats
          totalRepos={data.totalRepos}
          totalCommits={data.totalCommits}
          firstCommit={data.firstCommit}
          latestCommit={data.latestCommit}
          languageCount={Object.keys(data.languages).length}
        />
      </div>

      {/* Commit activity heatmap */}
      {data.activityHeatmap && data.activityHeatmap.length > 0 && (
        <section className="mb-10 sm:mb-14">
          <CommitHeatmap data={data.activityHeatmap} />
        </section>
      )}

      {/* Language distribution */}
      <section className="mb-10 sm:mb-14">
        <h2 className="text-sm font-semibold uppercase tracking-[2px] mb-4" style={{ color: "var(--brand-muted)" }}>
          Language Distribution
        </h2>
        <LanguageBar languages={data.languages} />
      </section>

      {/* Phase timeline */}
      <section className="mb-10 sm:mb-14">
        <h2 className="text-sm font-semibold uppercase tracking-[2px] mb-6" style={{ color: "var(--brand-muted)" }}>
          Development Phases
        </h2>
        <PhaseTimeline phases={data.phases} repos={data.repos} />
      </section>
    </main>
  )
}
