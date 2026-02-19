"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Lightbulb, ArrowRight } from "lucide-react"
import type { SiteData, Project } from "@/lib/site-data"
import { categoryMap } from "@/lib/project-categories"

function LabCard({ project }: { project: Project }) {
  const cat = categoryMap[project.category]

  return (
    <Link href={`/projects/${project.slug}`}>
      <div
        className="group rounded-xl overflow-hidden hover:-translate-y-1 transition-all"
        style={{
          background: "var(--brand-bg-alt)",
          border: "1px solid var(--brand-border)",
        }}
      >
        <div className="h-[3px] w-full" style={{ background: "var(--brand-warning)" }} />
        <div className="p-5 sm:p-8">
          <div className="flex items-start justify-between mb-4">
            <span
              className="text-[10px] font-semibold uppercase tracking-[2px] px-2 py-0.5 rounded font-mono"
              style={{
                color: cat.color,
                background: `color-mix(in srgb, ${cat.color} 10%, transparent)`,
              }}
            >
              {cat.label}
            </span>
            <span
              className="text-[10px] font-semibold uppercase tracking-[2px] px-2 py-0.5 rounded font-mono"
              style={{
                color: "var(--brand-warning)",
                background: "color-mix(in srgb, var(--brand-warning) 10%, transparent)",
              }}
            >
              {project.status}
            </span>
          </div>

          <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--brand-primary)] transition-colors">
            {project.name}
          </h3>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--brand-muted)" }}>
            {project.tagline}
          </p>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--brand-muted)" }}>
            {project.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.technologies.map((tech) => (
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
          </div>

          <div
            className="flex items-center justify-between pt-4 text-sm"
            style={{ borderTop: "1px solid var(--brand-border)" }}
          >
            <span className="font-mono text-xs" style={{ color: "var(--brand-muted)" }}>
              {project.totalMessages.toLocaleString()} messages
            </span>
            <span
              className="flex items-center gap-1 font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--brand-primary)" }}
            >
              View project <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function LabPage() {
  const [data, setData] = useState<SiteData | null>(null)

  useEffect(() => {
    fetch("/data/site-data.json")
      .then((r) => r.json())
      .then(setData)
  }, [])

  const researchProjects = data?.projects.filter((p) => p.isResearch) || []

  return (
    <div className="pt-20 sm:pt-24 pb-10 sm:pb-16">
      <section className="container-page text-center mb-8 sm:mb-16">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-sm font-medium"
          style={{
            background: "color-mix(in srgb, var(--brand-warning) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--brand-warning) 30%, transparent)",
            color: "var(--brand-warning)",
          }}
        >
          <Lightbulb className="w-4 h-4" />
          Research Lab
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          The Lab
        </h1>
        <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--brand-muted)" }}>
          Frontier experiments and research projects. Things that might not ship
          but push the boundaries of what&apos;s possible with hardware, AI, and creative computing.
        </p>
      </section>

      <section className="container-page">
        {researchProjects.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--brand-muted)" }}>
            Loading research projects...
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {researchProjects.map((project) => (
              <LabCard key={project.slug} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
