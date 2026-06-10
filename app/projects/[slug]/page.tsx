import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Bot, GitBranch, MessageSquare } from "lucide-react"
import { CommitPulse } from "./_commit-pulse"
import { GitHubCard, SourceContribution, VitalsStrip } from "./_vitals"
import { loadSiteDataStatic } from "@/lib/site-data"
import type { CategoryId } from "@/lib/project-categories"
import { V3_CATEGORY } from "../_categories"
import { V3Reveal } from "@/components/v3/V3Reveal"

export const revalidate = 3600

export async function generateStaticParams() {
  const data = await loadSiteDataStatic()
  return data.projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await loadSiteDataStatic()
  const project = data.projects.find((p) => p.slug === slug)

  if (!project) {
    return { title: "Project not found", robots: { index: false, follow: false } }
  }

  const description = project.tagline || project.description?.slice(0, 160) || ""

  return {
    title: `${project.name} — Projects`,
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: `${project.name} | bio·bradley.io`,
      description,
      url: `https://bradley.io/projects/${slug}`,
      type: "article",
    },
  }
}

function formatDate(iso: string, withYear = false) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
    timeZone: "UTC",
  })
}

export default async function V3ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await loadSiteDataStatic()
  const project = data.projects.find((p) => p.slug === slug)

  if (!project) notFound()

  const cat = V3_CATEGORY[project.category as CategoryId] ?? V3_CATEGORY.systems
  const related = data.activityFeed
    .filter((a) => a.projectSlug === project.slug)
    .slice(0, 15)
  // If a project has no per-slug activity items (most don't), fall back to
  // showing recent activity from same-category peers so the panel isn't empty.
  const relatedFallback =
    related.length === 0
      ? data.activityFeed
          .filter((a) => a.category === project.category && a.projectSlug !== project.slug)
          .slice(0, 10)
      : []

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
      { "@type": "ListItem", position: 2, name: "Projects", item: "https://bradley.io/projects" },
      {
        "@type": "ListItem",
        position: 3,
        name: project.name,
        item: `https://bradley.io/projects/${slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* HEADER ========================================================= */}
      <header className="v3-section" style={{ paddingTop: 72, paddingBottom: 24 }}>
        <div className="v3-wrap">
          <Link href="/projects" className="v3-detail-back">
            <ArrowLeft size={14} strokeWidth={2.25} /> All projects
          </Link>

          <div className="v3-detail-meta">
            <span
              className="v3-pcard__cat"
              style={{ ["--v3-pcard-color" as string]: cat.color }}
            >
              {cat.label}
            </span>
            <span className={`v3-status v3-status--${project.status}`}>
              <span className="v3-status__dot" aria-hidden />
              {project.status}
            </span>
            {project.isResearch ? (
              <span className="v3-pcard__research">research</span>
            ) : null}
            {project.isFeatured ? (
              <span className="v3-pill v3-pill--blue">featured</span>
            ) : null}
          </div>

          <V3Reveal>
            <h1 className="v3-detail-name">{project.name}</h1>
          </V3Reveal>
          <V3Reveal delay={80}>
            <p className="v3-detail-tag">{project.tagline}</p>
          </V3Reveal>
        </div>
      </header>

      {/* VITALS STRIP =================================================== */}
      <section style={{ padding: "0 0 32px" }}>
        <div className="v3-wrap">
          <V3Reveal>
            <VitalsStrip project={project} />
          </V3Reveal>
        </div>
      </section>

      {/* MAIN + SIDEBAR ================================================== */}
      <section className="v3-section" style={{ paddingTop: 8 }}>
        <div className="v3-wrap">
          <div className="v3-twocol">
            {/* MAIN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <V3Reveal>
                <CommitPulse project={project} />
              </V3Reveal>

              <V3Reveal delay={30}>
                <article className="v3-panel">
                  <div className="v3-panel-head">Where the work came from</div>
                  <SourceContribution project={project} />
                </article>
              </V3Reveal>

              {project.description && project.description !== project.tagline ? (
                <V3Reveal delay={40}>
                  <article className="v3-panel">
                    <div className="v3-panel-head">About</div>
                    <p className="v3-prose">{project.description}</p>
                  </article>
                </V3Reveal>
              ) : null}

              {/* Some projects expose claudeInvolvement (optional field on
                  ProjectSource.claudeCode notes); skipping unless present. */}

              {project.technologies.length > 0 ? (
                <V3Reveal delay={60}>
                  <article className="v3-panel">
                    <div className="v3-panel-head">Tech stack</div>
                    <div className="v3-skills">
                      {project.technologies.map((tech) => (
                        <span key={tech} className="v3-skill">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </article>
                </V3Reveal>
              ) : null}

              {related.length > 0 || relatedFallback.length > 0 ? (
                <V3Reveal delay={120}>
                  <article className="v3-panel">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 6,
                      }}
                    >
                      <div className="v3-panel-head" style={{ marginBottom: 0 }}>
                        {related.length > 0
                          ? `Recent activity · ${related.length}`
                          : `${cat.label} · same category`}
                      </div>
                      {relatedFallback.length > 0 ? (
                        <span
                          style={{
                            fontFamily: "var(--font-v3-mono), monospace",
                            fontSize: 10.5,
                            color: "var(--v3-slate)",
                          }}
                        >
                          peer activity
                        </span>
                      ) : null}
                    </div>
                    <div className="v3-activity">
                      {(related.length > 0 ? related : relatedFallback).map((item, i) => {
                        const iconMod =
                          item.type === "claude-web"
                            ? "v3-activity__icon--web"
                            : item.type === "github"
                            ? "v3-activity__icon--gh"
                            : ""
                        const Icon =
                          item.type === "claude-code"
                            ? Bot
                            : item.type === "claude-web"
                            ? MessageSquare
                            : GitBranch
                        return (
                          <div key={`${item.type}-${i}`} className="v3-activity__item">
                            <div className={`v3-activity__icon ${iconMod}`.trim()}>
                              <Icon size={15} strokeWidth={2.25} />
                            </div>
                            <div>
                              <div className="v3-activity__title">{item.title}</div>
                              {item.description ? (
                                <div className="v3-activity__desc">{item.description}</div>
                              ) : null}
                              <div className="v3-activity__date">{formatDate(item.date, true)}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </article>
                </V3Reveal>
              ) : null}
            </div>

            {/* SIDEBAR */}
            <aside className="v3-twocol__side">
              {project.sources.github ? (
                <V3Reveal>
                  <GitHubCard project={project} />
                </V3Reveal>
              ) : null}

              <V3Reveal delay={project.sources.github ? 60 : 0}>
                <div className="v3-panel">
                  <div className="v3-panel-head">Stats</div>
                  <div className="v3-stat-row">
                    <span className="v3-stat-row__label">Messages</span>
                    <span className="v3-stat-row__value">
                      {project.totalMessages.toLocaleString()}
                    </span>
                  </div>
                  <div className="v3-stat-row">
                    <span className="v3-stat-row__label">Last activity</span>
                    <span className="v3-stat-row__value">
                      {formatDate(project.lastActivity, true)}
                    </span>
                  </div>
                  <div className="v3-stat-row">
                    <span className="v3-stat-row__label">Status</span>
                    <span className="v3-stat-row__value" style={{ textTransform: "lowercase" }}>
                      {project.status}
                    </span>
                  </div>
                </div>
              </V3Reveal>

              <V3Reveal delay={80}>
                <div className="v3-panel">
                  <div className="v3-panel-head">Sources</div>
                  {project.sources.claudeCode ? (
                    <div className="v3-source-row">
                      <div className="v3-source-row__icon">
                        <Bot size={16} strokeWidth={2.25} />
                      </div>
                      <div>
                        <div className="v3-source-row__name">Claude Code</div>
                        <div className="v3-source-row__detail">
                          {project.sources.claudeCode.totalSessions} sessions ·{" "}
                          {project.sources.claudeCode.totalMessages.toLocaleString()} msgs
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {project.sources.claudeWeb ? (
                    <div className="v3-source-row">
                      <div
                        className="v3-source-row__icon"
                        style={{
                          background: "#FBE6E3",
                          color: "var(--v3-coral-dk)",
                        }}
                      >
                        <MessageSquare size={16} strokeWidth={2.25} />
                      </div>
                      <div>
                        <div className="v3-source-row__name">Claude Web</div>
                        <div className="v3-source-row__detail">
                          {project.sources.claudeWeb.conversationCount} convos ·{" "}
                          {project.sources.claudeWeb.totalMessages.toLocaleString()} msgs
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {project.sources.github ? (
                    <div className="v3-source-row">
                      <div
                        className="v3-source-row__icon"
                        style={{
                          background: "var(--v3-paper)",
                          color: "var(--v3-slate)",
                        }}
                      >
                        <GitBranch size={16} strokeWidth={2.25} />
                      </div>
                      <div>
                        <div className="v3-source-row__name">
                          <a
                            href={`https://github.com/${project.sources.github.repo}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            style={{ color: "inherit", textDecoration: "none" }}
                          >
                            {project.sources.github.repo} ↗
                          </a>
                        </div>
                        <div className="v3-source-row__detail">
                          {project.sources.github.language}
                          {typeof project.sources.github.stars === "number"
                            ? ` · ★ ${project.sources.github.stars}`
                            : ""}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </V3Reveal>

              <V3Reveal delay={140}>
                <Link
                  href="/projects"
                  className="v3-btn v3-btn--ghost"
                  style={{ justifyContent: "center" }}
                >
                  ← Back to all projects
                </Link>
              </V3Reveal>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
