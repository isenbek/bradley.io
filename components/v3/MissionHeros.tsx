import { readFileSync } from "fs"
import { join } from "path"
import Link from "next/link"
import { ArrowRight, GitBranch } from "lucide-react"

interface TimelineRepoSummary {
  name: string
  firstCommit: string
  lastCommit: string
  commits: number
}

interface CommitDay {
  date: string
  commits: number
  intensity: number
}

interface TimelineFile {
  generated: string
  org: string
  totalRepos: number
  totalCommits: number
  firstCommit: string
  latestCommit: string
  languages: Record<string, number>
  activityHeatmap: CommitDay[]
  phases: { name: string }[]
  repos: TimelineRepoSummary[]
}

interface MissionMeta {
  slug: string
  file: string
  /** Pill accent on the hero card. */
  accent: "blue" | "coral" | "gold" | "green"
  eyebrow: string
  /** Display name (e.g. "tinymachines" not "Tinymachines"). */
  displayName: string
  /** GitHub org URL — only renders when set. */
  gh?: string
  lede: string
}

const MISSIONS: MissionMeta[] = [
  {
    slug: "nominate-ai",
    file: "nominate-ai-timeline.json",
    accent: "blue",
    eyebrow: "Platform",
    displayName: "Nominate-AI",
    gh: "https://github.com/Nominate-AI",
    lede: "AI-native sourcing platform — pipelines, vector search, agents.",
  },
  {
    slug: "tinymachines",
    file: "tinymachines-timeline.json",
    accent: "gold",
    eyebrow: "Lab umbrella",
    displayName: "tinymachines",
    gh: "https://github.com/tinymachines",
    lede: "Hardware hacks, signals, radioactive entropy, ADS-B, mesh.",
  },
  {
    slug: "isenbek",
    file: "isenbek-timeline.json",
    accent: "green",
    eyebrow: "Personal",
    displayName: "isenbek",
    gh: "https://github.com/isenbek",
    lede: "Solo namespace — side projects, the through-line, this site.",
  },
  {
    slug: "sysforge-ai",
    file: "sysforge-ai-timeline.json",
    accent: "coral",
    eyebrow: "Consulting",
    displayName: "Sysforge-AI",
    lede: "AI consulting & development firm. Frontier integrations.",
  },
]

function loadTimeline(file: string): TimelineFile | null {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "public/data", file), "utf-8")
    )
  } catch {
    return null
  }
}

function compact(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k"
  return String(n)
}

function span(firstISO: string, lastISO: string): string {
  const days = (new Date(lastISO).getTime() - new Date(firstISO).getTime()) / 86_400_000
  if (days < 60) return `${Math.round(days)}d`
  if (days < 730) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(1)}yr`
}

/**
 * Inline mini activity strip from the org's activity heatmap, bucketed into
 * 24 weeks. Renders as a colored intensity strip across the bottom of each
 * hero card. Reads color from `--v3-mission-color` set inline on the parent.
 */
function ActivityStrip({ heatmap }: { heatmap: CommitDay[] }) {
  if (heatmap.length === 0) return null
  const BUCKETS = 24
  // Use the most recent year of activity
  const sorted = [...heatmap].sort((a, b) => a.date.localeCompare(b.date))
  const first = new Date(sorted[0].date + "T00:00:00Z").getTime()
  const last = new Date(sorted[sorted.length - 1].date + "T00:00:00Z").getTime()
  const bucketMs = Math.max(86_400_000, (last - first) / BUCKETS)
  const buckets = new Array(BUCKETS).fill(0)
  for (const d of sorted) {
    const t = new Date(d.date + "T00:00:00Z").getTime()
    const idx = Math.min(BUCKETS - 1, Math.floor((t - first) / bucketMs))
    buckets[idx] += d.commits
  }
  const max = Math.max(...buckets, 1)
  return (
    <svg
      viewBox={`0 0 ${BUCKETS * 4} 16`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: 16, display: "block" }}
      aria-hidden
    >
      {buckets.map((n, i) => {
        const h = Math.max((n / max) * 16, n > 0 ? 1.5 : 0)
        return (
          <rect
            key={i}
            x={i * 4}
            y={16 - h}
            width={3}
            height={h}
            rx={0.5}
            fill="var(--v3-mission-color)"
            opacity={n > 0 ? 1 : 0.16}
          />
        )
      })}
    </svg>
  )
}

const ACCENT_TO_VAR: Record<MissionMeta["accent"], string> = {
  blue: "var(--v3-blue-500)",
  coral: "var(--v3-coral)",
  gold: "var(--v3-gold)",
  green: "var(--v3-green)",
}

// Dark text variant of each accent — for the eyebrow pill text + CTA text
// that lives on the cream card. Each clears 4.5:1 against cream.
const ACCENT_INK_TO_VAR: Record<MissionMeta["accent"], string> = {
  blue: "var(--v3-blue-ink)",
  coral: "var(--v3-coral-dk)",
  gold: "var(--v3-gold-dk)",
  green: "var(--v3-green-dk)",
}

/**
 * Mission timeline hero cards — 4-up grid above ActivityPulse on home.
 * Reads every mission timeline JSON server-side so totals are always live.
 */
export function MissionHeros() {
  const data = MISSIONS.map((m) => ({ meta: m, tl: loadTimeline(m.file) })).filter(
    (x): x is { meta: MissionMeta; tl: TimelineFile } => x.tl !== null
  )
  if (data.length === 0) return null

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 16,
      }}
    >
      {data.map(({ meta, tl }) => {
        const accentColor = ACCENT_TO_VAR[meta.accent]
        const accentInk = ACCENT_INK_TO_VAR[meta.accent]
        return (
          <article
            key={meta.slug}
            className="v3-mission-hero"
            style={
              {
                ["--v3-mission-color" as string]: accentColor,
                ["--v3-mission-ink" as string]: accentInk,
              } as React.CSSProperties
            }
          >
            <div className="v3-mission-hero__bar" aria-hidden />
            <Link
              href={`/projects/${meta.slug}`}
              className="v3-mission-hero__body"
              aria-label={`Explore the ${meta.displayName} timeline`}
            >
              <div className="v3-mission-hero__row">
                <span className="v3-mission-hero__eyebrow">{meta.eyebrow}</span>
              </div>
              <h3 className="v3-mission-hero__name">{meta.displayName}</h3>
              <p className="v3-mission-hero__lede">{meta.lede}</p>

              <div className="v3-mission-hero__stats">
                {[
                  { lbl: "Repos", val: tl.totalRepos.toLocaleString() },
                  { lbl: "Commits", val: compact(tl.totalCommits) },
                  { lbl: "Phases", val: tl.phases.length },
                  { lbl: "Span", val: span(tl.firstCommit, tl.latestCommit) },
                ].map((s) => (
                  <div key={s.lbl} className="v3-mission-hero__stat">
                    <div className="v3-mission-hero__stat-val">{s.val}</div>
                    <div className="v3-mission-hero__stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>

              <ActivityStrip heatmap={tl.activityHeatmap} />

              <div className="v3-mission-hero__cta">
                Explore timeline <ArrowRight size={13} strokeWidth={2.5} />
              </div>
            </Link>
            {meta.gh ? (
              <a
                href={meta.gh}
                target="_blank"
                rel="noopener noreferrer"
                className="v3-mission-hero__gh"
                title={`GitHub · ${meta.displayName}`}
              >
                <GitBranch size={11} strokeWidth={2.25} />
                org
              </a>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
