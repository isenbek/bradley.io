"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { GitBranch, MessageSquare, Bot } from "lucide-react"
import type { SiteData, Project } from "@/lib/site-data"
import type { CategoryId } from "@/lib/project-categories"
import { categories, categoryMap } from "@/lib/project-categories"

function SourceBadge({ type, label }: { type: "claude-code" | "claude-web" | "github"; label: string }) {
  const icons = {
    "claude-code": <Bot className="w-3 h-3" />,
    "claude-web": <MessageSquare className="w-3 h-3" />,
    "github": <GitBranch className="w-3 h-3" />,
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full"
      style={{
        background: "color-mix(in srgb, var(--brand-primary) 8%, transparent)",
        border: "1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)",
        color: "var(--brand-primary)",
      }}
    >
      {icons[type]}
      {label}
    </span>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const cat = categoryMap[project.category]

  return (
    <Link href={`/projects/${project.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group rounded-xl overflow-hidden h-full"
        style={{
          background: "var(--brand-bg-alt)",
          border: "1px solid var(--brand-border)",
        }}
      >
        <div className="h-[3px] w-full" style={{ background: cat.color }} />
        <div className="p-6 flex flex-col gap-3 h-full">
          <div className="flex items-start justify-between">
            <div>
              <span
                className="text-[10px] font-semibold uppercase tracking-[2px] px-2 py-0.5 rounded font-mono"
                style={{
                  color: cat.color,
                  background: `color-mix(in srgb, ${cat.color} 10%, transparent)`,
                }}
              >
                {cat.label}
              </span>
            </div>
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

          <h3 className="text-lg font-bold group-hover:text-[var(--brand-primary)] transition-colors">
            {project.name}
          </h3>
          <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--brand-muted)" }}>
            {project.tagline}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{
                  background: "color-mix(in srgb, var(--brand-steel) 10%, transparent)",
                  color: "var(--brand-steel)",
                }}
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="text-[10px] font-mono" style={{ color: "var(--brand-muted)" }}>
                +{project.technologies.length - 4}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-3" style={{ borderTop: "1px solid var(--brand-border)" }}>
            {project.sources.claudeCode && <SourceBadge type="claude-code" label="Code" />}
            {project.sources.claudeWeb && <SourceBadge type="claude-web" label="Web" />}
            {project.sources.github && <SourceBadge type="github" label="GitHub" />}
            <span className="text-[11px] font-mono ml-auto" style={{ color: "var(--brand-muted)" }}>
              {project.totalMessages.toLocaleString()} msgs
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

function CategoryFilter({
  active,
  onSelect,
  counts,
}: {
  active: CategoryId | null
  onSelect: (id: CategoryId | null) => void
  counts: Record<CategoryId, number>
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible sm:pb-0 scrollbar-none">
      <button
        onClick={() => onSelect(null)}
        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all border whitespace-nowrap shrink-0"
        style={{
          background: active === null ? "var(--brand-text)" : "transparent",
          borderColor: active === null ? "var(--brand-text)" : "var(--brand-border)",
          color: active === null ? "var(--brand-bg)" : "var(--brand-steel)",
        }}
      >
        All ({Object.values(counts).reduce((a, b) => a + b, 0)})
      </button>
      {categories.map((cat) => {
        const isActive = active === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(isActive ? null : cat.id)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all border whitespace-nowrap shrink-0"
            style={{
              background: isActive ? `color-mix(in srgb, ${cat.color} 15%, transparent)` : "transparent",
              borderColor: isActive ? cat.color : "var(--brand-border)",
              color: isActive ? cat.color : "var(--brand-steel)",
            }}
          >
            {cat.label} ({counts[cat.id] || 0})
          </button>
        )
      })}
    </div>
  )
}

export default function ProjectsPage() {
  const [data, setData] = useState<SiteData | null>(null)
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null)

  useEffect(() => {
    fetch("/data/site-data.json")
      .then((r) => r.json())
      .then(setData)
  }, [])

  if (!data) {
    return (
      <div className="pt-20 sm:pt-24 pb-10 sm:pb-16 container-page text-center" style={{ color: "var(--brand-muted)" }}>
        Loading projects...
      </div>
    )
  }

  const counts = {} as Record<CategoryId, number>
  for (const cat of categories) {
    counts[cat.id] = data.projects.filter((p) => p.category === cat.id).length
  }

  const filtered = activeCategory
    ? data.projects.filter((p) => p.category === activeCategory)
    : data.projects

  return (
    <div className="pt-20 sm:pt-24 pb-10 sm:pb-16 overflow-x-hidden">
      <section className="container-page text-center mb-8 sm:mb-12">
        <div
          className="text-xs font-semibold uppercase tracking-[3px] mb-2"
          style={{ color: "var(--brand-primary)" }}
        >
          Projects
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          What I&apos;m building.
        </h1>
        <p
          className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
          style={{ color: "var(--brand-muted)" }}
        >
          Hardware, AI, data pipelines, distributed systems, and frontier research —
          all powered by intensive human-AI collaboration.
        </p>
      </section>

      <section className="container-page mb-6 sm:mb-8">
        <CategoryFilter active={activeCategory} onSelect={setActiveCategory} counts={counts} />
      </section>

      <section className="container-page">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory ?? "all"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filtered.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  )
}
