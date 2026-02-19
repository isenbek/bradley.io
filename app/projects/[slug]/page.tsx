"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, GitBranch, MessageSquare, Bot } from "lucide-react"
import type { SiteData, Project } from "@/lib/site-data"
import { categoryMap } from "@/lib/project-categories"

function StatusBadge({ status }: { status: Project["status"] }) {
  const colors: Record<string, string> = {
    active: "var(--brand-success)",
    paused: "var(--brand-warning)",
    completed: "var(--brand-info)",
    archived: "var(--brand-muted)",
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
      style={{
        color: colors[status],
        background: `color-mix(in srgb, ${colors[status]} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${colors[status]} 25%, transparent)`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors[status] }} />
      {status}
    </span>
  )
}

export default function ProjectDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [data, setData] = useState<SiteData | null>(null)

  useEffect(() => {
    fetch("/data/site-data.json")
      .then((r) => r.json())
      .then(setData)
  }, [])

  if (!data) {
    return (
      <div className="pt-20 sm:pt-24 pb-10 sm:pb-16 container-page text-center" style={{ color: "var(--brand-muted)" }}>
        Loading...
      </div>
    )
  }

  const project = data.projects.find((p) => p.slug === slug)
  if (!project) {
    return (
      <div className="pt-20 sm:pt-24 pb-10 sm:pb-16 container-page text-center">
        <h1 className="text-2xl font-bold mb-4">Project not found</h1>
        <Link href="/projects" className="text-sm" style={{ color: "var(--brand-primary)" }}>
          <ArrowLeft className="inline w-4 h-4 mr-1" /> Back to projects
        </Link>
      </div>
    )
  }

  const cat = categoryMap[project.category]
  const relatedActivity = data.activityFeed.filter((a) => a.projectSlug === project.slug)

  return (
    <div className="pt-20 sm:pt-24 pb-10 sm:pb-16">
      <div className="container-page">
        {/* Breadcrumb */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm mb-8 hover:underline"
          style={{ color: "var(--brand-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" /> All Projects
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className="text-[10px] font-semibold uppercase tracking-[2px] px-2.5 py-1 rounded font-mono"
              style={{
                color: cat.color,
                background: `color-mix(in srgb, ${cat.color} 10%, transparent)`,
              }}
            >
              {cat.label}
            </span>
            <StatusBadge status={project.status} />
            {project.isResearch && (
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                style={{
                  color: "var(--brand-warning)",
                  background: "color-mix(in srgb, var(--brand-warning) 10%, transparent)",
                }}
              >
                research
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            {project.name}
          </h1>
          <p className="text-lg md:text-xl" style={{ color: "var(--brand-muted)" }}>
            {project.tagline}
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6 sm:gap-10">
          {/* Main content */}
          <div>
            <div
              className="rounded-xl p-5 sm:p-8 mb-6 sm:mb-8"
              style={{
                background: "var(--brand-bg-alt)",
                border: "1px solid var(--brand-border)",
              }}
            >
              <h2 className="text-lg font-bold mb-4">About</h2>
              <p className="leading-relaxed" style={{ color: "var(--brand-muted)" }}>
                {project.description}
              </p>
            </div>

            {/* AI Co-Developer Notes */}
            {project.claudeInvolvement && (
              <div
                className="rounded-xl p-5 sm:p-8 mb-6 sm:mb-8"
                style={{
                  background: "var(--brand-bg-alt)",
                  border: "1px solid var(--brand-border)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: "color-mix(in srgb, var(--brand-secondary) 12%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--brand-secondary) 25%, transparent)",
                    }}
                  >
                    <Bot className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} />
                  </div>
                  <h2 className="text-lg font-bold">AI Co-Developer Notes</h2>
                </div>
                <p className="leading-relaxed text-sm" style={{ color: "var(--brand-muted)" }}>
                  {project.claudeInvolvement}
                </p>
              </div>
            )}

            {/* Technologies */}
            <div
              className="rounded-xl p-5 sm:p-8 mb-6 sm:mb-8"
              style={{
                background: "var(--brand-bg-alt)",
                border: "1px solid var(--brand-border)",
              }}
            >
              <h2 className="text-lg font-bold mb-4">Technologies</h2>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="text-sm font-mono px-3 py-1.5 rounded-lg"
                    style={{
                      background: "color-mix(in srgb, var(--brand-primary) 8%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)",
                      color: "var(--brand-primary)",
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            {relatedActivity.length > 0 && (
              <div
                className="rounded-xl p-5 sm:p-8"
                style={{
                  background: "var(--brand-bg-alt)",
                  border: "1px solid var(--brand-border)",
                }}
              >
                <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {relatedActivity.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 pb-4"
                      style={{ borderBottom: i < relatedActivity.length - 1 ? "1px solid var(--brand-border)" : "none" }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          background: "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
                        }}
                      >
                        {item.type === "claude-code" && <Bot className="w-4 h-4" style={{ color: "var(--brand-primary)" }} />}
                        {item.type === "claude-web" && <MessageSquare className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} />}
                        {item.type === "github" && <GitBranch className="w-4 h-4" style={{ color: "var(--brand-steel)" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{item.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--brand-muted)" }}>
                          {item.description}
                        </div>
                        <div className="text-[11px] font-mono mt-1" style={{ color: "var(--brand-muted)" }}>
                          {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats card */}
            <div
              className="rounded-xl p-4 sm:p-6"
              style={{
                background: "var(--brand-bg-alt)",
                border: "1px solid var(--brand-border)",
              }}
            >
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "var(--brand-muted)" }}>
                Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--brand-muted)" }}>Total Messages</span>
                  <span className="font-mono font-bold">{project.totalMessages.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--brand-muted)" }}>Last Activity</span>
                  <span className="font-mono text-xs">
                    {new Date(project.lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Sources card */}
            <div
              className="rounded-xl p-4 sm:p-6"
              style={{
                background: "var(--brand-bg-alt)",
                border: "1px solid var(--brand-border)",
              }}
            >
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "var(--brand-muted)" }}>
                Sources
              </h3>
              <div className="space-y-3">
                {project.sources.claudeCode && (
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4" style={{ color: "var(--brand-primary)" }} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">Claude Code</div>
                      <div className="text-[11px] font-mono" style={{ color: "var(--brand-muted)" }}>
                        {project.sources.claudeCode.totalSessions} sessions · {project.sources.claudeCode.totalMessages} msgs
                      </div>
                    </div>
                  </div>
                )}
                {project.sources.claudeWeb && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">Claude Web</div>
                      <div className="text-[11px] font-mono" style={{ color: "var(--brand-muted)" }}>
                        {project.sources.claudeWeb.conversationCount} convos · {project.sources.claudeWeb.totalMessages} msgs
                      </div>
                    </div>
                  </div>
                )}
                {project.sources.github && (
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4" style={{ color: "var(--brand-steel)" }} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">GitHub</div>
                      <div className="text-[11px] font-mono" style={{ color: "var(--brand-muted)" }}>
                        {project.sources.github.repo} · {project.sources.github.language}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
