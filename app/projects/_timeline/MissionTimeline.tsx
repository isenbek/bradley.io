import Link from "next/link"
import { ArrowLeft, GitBranch } from "lucide-react"
import type { NominateTimeline } from "@/lib/nominate-timeline-types"
import { timeAgo } from "@/lib/time-ago"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { V3TimelineStats } from "./V3TimelineStats"
import { V3LanguageBar } from "./V3LanguageBar"
import { V3CommitHeatmap } from "./V3CommitHeatmap"
import { V3PhaseTimeline } from "./V3PhaseTimeline"

interface Props {
  /** Display name for hero h1 (e.g. "Nominate-AI", "tinymachines") */
  displayName: string
  /** Short org/tag for eyebrow pill (e.g. "Platform timeline", "Lab umbrella") */
  eyebrow: string
  /** One-sentence pitch under the h1 */
  lede: string
  data: NominateTimeline
  /** Pill color for the eyebrow — blue | coral | gold | green */
  accent?: "blue" | "coral" | "gold" | "green"
}

export function MissionTimeline({
  displayName,
  eyebrow,
  lede,
  data,
  accent = "blue",
}: Props) {
  const firstYear = new Date(data.firstCommit).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })

  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head" style={{ paddingBottom: 28 }}>
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "-80px", top: "-40px" }} />
        <div className="v3-blob v3-blob--3" aria-hidden style={{ right: "200px", top: "200px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <Link
                href="/projects"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  color: "var(--v3-slate)",
                  textDecoration: "none",
                  marginBottom: 12,
                }}
              >
                <ArrowLeft size={13} strokeWidth={2.25} /> All projects
              </Link>
            </V3Reveal>
            <V3Reveal delay={40}>
              <span
                className={`v3-pill v3-pill--${accent}`}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <GitBranch size={14} strokeWidth={2.25} />
                {eyebrow}
              </span>
            </V3Reveal>
            <V3Reveal delay={100}>
              <h1>{displayName}</h1>
            </V3Reveal>
            <V3Reveal delay={160}>
              <p className="v3-page-head__lede">{lede}</p>
            </V3Reveal>
            <V3Reveal delay={220}>
              <p
                style={{
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  color: "var(--v3-slate)",
                  marginTop: 16,
                }}
              >
                {data.totalRepos} repos · {data.totalCommits.toLocaleString()} commits · since{" "}
                {firstYear} · updated {timeAgo(data.generated)}
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* STAT STRIP ====================================================== */}
      <section style={{ padding: "0 0 32px" }}>
        <div className="v3-wrap">
          <V3Reveal>
            <V3TimelineStats
              totalRepos={data.totalRepos}
              totalCommits={data.totalCommits}
              firstCommit={data.firstCommit}
              latestCommit={data.latestCommit}
              languageCount={Object.keys(data.languages).length}
            />
          </V3Reveal>
        </div>
      </section>

      {/* COMMIT HEATMAP ================================================= */}
      {data.activityHeatmap && data.activityHeatmap.length > 0 ? (
        <section className="v3-section" style={{ paddingTop: 16, paddingBottom: 48 }}>
          <div className="v3-wrap">
            <V3Reveal>
              <div className="v3-sec-head" style={{ marginBottom: 20 }}>
                <div className="v3-sec-head__num">01 / ACTIVITY</div>
                <h2 style={{ marginBottom: 8 }}>Commit activity.</h2>
                <p>One year of commits across every repo in the platform.</p>
              </div>
            </V3Reveal>
            <V3Reveal delay={60}>
              <V3CommitHeatmap data={data.activityHeatmap} />
            </V3Reveal>
          </div>
        </section>
      ) : null}

      {/* LANGUAGE BAR =================================================== */}
      <section
        className="v3-section v3-section--paper"
        style={{ paddingTop: 56, paddingBottom: 48 }}
      >
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head" style={{ marginBottom: 20 }}>
              <div className="v3-sec-head__num">02 / LANGUAGE MIX</div>
              <h2 style={{ marginBottom: 8 }}>What it&apos;s built in.</h2>
              <p>
                Repository language distribution across all{" "}
                {data.totalRepos.toLocaleString()} repos.
              </p>
            </div>
          </V3Reveal>
          <V3Reveal delay={60}>
            <article className="v3-panel">
              <V3LanguageBar languages={data.languages} />
            </article>
          </V3Reveal>
        </div>
      </section>

      {/* PHASE TIMELINE ================================================= */}
      <section className="v3-section" style={{ paddingTop: 56 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head" style={{ marginBottom: 28 }}>
              <div className="v3-sec-head__num">03 / PHASES</div>
              <h2 style={{ marginBottom: 8 }}>Development phases.</h2>
              <p>
                {data.phases.length === 1
                  ? "A single phase so far — but actively growing."
                  : `${data.phases.length} AI-synthesized phases, newest first. Click any phase to expand its repos.`}
              </p>
            </div>
          </V3Reveal>
          <V3Reveal delay={60}>
            <V3PhaseTimeline phases={data.phases} repos={data.repos} />
          </V3Reveal>
        </div>
      </section>
    </>
  )
}
