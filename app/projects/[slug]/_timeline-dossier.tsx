import Link from "next/link"
import { ArrowLeft, ArrowUpRight, GitBranch } from "lucide-react"
import { langColor } from "../_timeline/lang-colors"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { CommitPulse } from "./_commit-pulse"
import type { TimelineMatch } from "../_timeline-lookup"

/**
 * Lightweight dossier for repos that exist only in a mission timeline JSON
 * (no entry in `site-data.json`). Same visual shell as the full dossier but
 * smaller — pulls everything from the timeline `repo` record.
 *
 * The shared `CommitPulse` expects a `Project` shape, so we shim a minimal
 * object that satisfies the parts it reads.
 */
export function TimelineRepoDossier({ match }: { match: TimelineMatch }) {
  const { org, orgSlug, repo } = match
  const accent = langColor(repo.language)

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io" },
      { "@type": "ListItem", position: 2, name: "Projects", item: "https://bradley.io/projects" },
      {
        "@type": "ListItem",
        position: 3,
        name: org,
        item: `https://bradley.io/projects/${orgSlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: repo.name,
        item: `https://bradley.io/projects/${repo.name}`,
      },
    ],
  }

  // Shim that satisfies CommitPulse's `Project` reads. Only the fields it
  // actually touches need to be present.
  const shim = {
    slug: repo.name,
    name: repo.name,
    sources: {
      github: {
        repo: `${orgSlug}/${repo.name}`,
        language: repo.language,
        lastPush: repo.lastCommit?.slice(0, 10) ?? "",
      },
    },
  } as never

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* HEADER ========================================================= */}
      <header className="v3-section" style={{ paddingTop: 72, paddingBottom: 16 }}>
        <div className="v3-wrap">
          <Link href={`/projects/${orgSlug}`} className="v3-detail-back">
            <ArrowLeft size={14} strokeWidth={2.25} /> {org} timeline
          </Link>

          <div className="v3-detail-meta">
            <span
              className="v3-pcard__cat"
              style={{
                ["--v3-pcard-color" as string]: accent,
                // Language hues vary too much to map per-color — use
                // charcoal for guaranteed ≥4.5:1 on the 10%-tint background.
                ["--v3-pcard-ink" as string]: "var(--v3-charcoal)",
              }}
            >
              {org}
            </span>
            <span
              className="v3-pill v3-pill--blue"
              title="Repository entry sourced from the mission timeline"
            >
              repo · timeline-only
            </span>
            {repo.phase ? (
              <span
                className="v3-pill v3-pill--gold"
                style={{
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 11,
                }}
              >
                {repo.phase}
              </span>
            ) : null}
          </div>

          <V3Reveal eager>
            <h1 className="v3-detail-name">
              {repo.name.length <= 4 ? `${orgSlug}/${repo.name}` : repo.name}
            </h1>
          </V3Reveal>
          <V3Reveal eager>
            <p className="v3-detail-tag">
              {repo.description ||
                `Repository in the ${org} timeline.`}
            </p>
          </V3Reveal>
        </div>
      </header>

      {/* VITALS STRIP =================================================== */}
      <section style={{ padding: "8px 0 32px" }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-statbar">
              <div className="v3-statbar__cell">
                <div
                  className="v3-statbar__val"
                  style={{ color: "var(--v3-blue-700)" }}
                >
                  {repo.commits.toLocaleString()}
                </div>
                <div className="v3-statbar__lbl">Commits</div>
              </div>
              <div className="v3-statbar__cell">
                <div
                  className="v3-statbar__val"
                  style={{ color: accent }}
                >
                  {repo.language || "—"}
                </div>
                <div className="v3-statbar__lbl">Language</div>
              </div>
              <div className="v3-statbar__cell">
                <div
                  className="v3-statbar__val"
                  style={{
                    color: "var(--v3-gold-dk)",
                    fontSize: 22,
                  }}
                >
                  {fmtMonth(repo.firstCommit)}
                </div>
                <div className="v3-statbar__lbl">First commit</div>
              </div>
              <div className="v3-statbar__cell">
                <div
                  className="v3-statbar__val"
                  style={{
                    color: "var(--v3-green-dk)",
                    fontSize: 22,
                  }}
                >
                  {fmtMonth(repo.lastCommit)}
                </div>
                <div className="v3-statbar__lbl">Last commit</div>
              </div>
            </div>
          </V3Reveal>
        </div>
      </section>

      {/* COMMIT PULSE + DETAILS ========================================= */}
      <section className="v3-section" style={{ paddingTop: 8 }}>
        <div className="v3-wrap">
          <div className="v3-twocol">
            {/* MAIN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <V3Reveal>
                <CommitPulse project={shim} />
              </V3Reveal>

              {repo.description ? (
                <V3Reveal delay={40}>
                  <article className="v3-panel">
                    <div className="v3-panel-head">About</div>
                    <p className="v3-prose">{repo.description}</p>
                  </article>
                </V3Reveal>
              ) : null}

              <V3Reveal delay={80}>
                <article
                  className="v3-panel"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--v3-blue-50), var(--v3-white) 60%, var(--v3-paper))",
                  }}
                >
                  <div className="v3-panel-head">From the mission timeline</div>
                  <p
                    style={{
                      fontSize: 14.5,
                      color: "var(--v3-ink)",
                      lineHeight: 1.55,
                      marginBottom: 14,
                    }}
                  >
                    This repo lives inside the{" "}
                    <Link
                      href={`/projects/${orgSlug}`}
                      style={{
                        color: "var(--v3-blue-700)",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      {org}
                    </Link>{" "}
                    development timeline. Open the timeline to see how it fits into
                    the broader phase milestones.
                  </p>
                  <Link
                    href={`/projects/${orgSlug}`}
                    className="v3-btn v3-btn--primary"
                  >
                    Open {org} timeline →
                  </Link>
                </article>
              </V3Reveal>
            </div>

            {/* SIDEBAR */}
            <aside className="v3-twocol__side">
              <V3Reveal>
                <article className="v3-panel">
                  <div className="v3-panel-head">GitHub</div>
                  <a
                    href={`https://github.com/${orgSlug}/${repo.name}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: "var(--font-v3-mono), monospace",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--v3-charcoal)",
                      textDecoration: "none",
                      wordBreak: "break-all",
                    }}
                  >
                    <GitBranch size={16} strokeWidth={2.25} />
                    {orgSlug}/{repo.name}
                    <ArrowUpRight size={13} strokeWidth={2.25} />
                  </a>
                  <div
                    style={{
                      marginTop: 10,
                      fontFamily: "var(--font-v3-mono), monospace",
                      fontSize: 11,
                      color: "var(--v3-slate)",
                    }}
                  >
                    Last push {repo.lastCommit?.slice(0, 10)}
                  </div>
                </article>
              </V3Reveal>

              <V3Reveal delay={60}>
                <Link
                  href="/projects"
                  className="v3-btn v3-btn--ghost"
                  style={{ justifyContent: "center" }}
                >
                  ← All projects
                </Link>
              </V3Reveal>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}

function fmtMonth(iso: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}
