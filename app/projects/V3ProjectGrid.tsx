"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Bot, GitBranch, MessageSquare } from "lucide-react"
import type { Project } from "@/lib/site-data"
import type { CategoryId } from "@/lib/project-categories"
import { V3_CATEGORY } from "./_categories"

const ORDER: CategoryId[] = ["hardware", "ai-ml", "data", "systems", "creative"]

export function V3ProjectGrid({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<CategoryId | null>(null)

  const counts = useMemo(() => {
    const c = {} as Record<CategoryId, number>
    for (const id of ORDER) c[id] = 0
    for (const p of projects) c[p.category] = (c[p.category] ?? 0) + 1
    return c
  }, [projects])

  const visible = active ? projects.filter((p) => p.category === active) : projects

  return (
    <>
      {/* FILTER */}
      <div className="v3-filter" role="tablist" aria-label="Filter projects by category">
        <button
          type="button"
          data-active={active === null}
          onClick={() => setActive(null)}
          role="tab"
          aria-selected={active === null}
        >
          All <span className="v3-filter__count">({projects.length})</span>
        </button>
        {ORDER.map((id) => {
          const cat = V3_CATEGORY[id]
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              data-active={isActive}
              data-color
              onClick={() => setActive(isActive ? null : id)}
              style={{ ["--v3-filter-color" as string]: cat.color }}
              role="tab"
              aria-selected={isActive}
            >
              {cat.label} <span className="v3-filter__count">({counts[id] ?? 0})</span>
            </button>
          )
        })}
      </div>

      {/* GRID */}
      {visible.length === 0 ? (
        <div className="v3-empty">No projects in this category yet.</div>
      ) : (
        <div className="v3-project-grid" style={{ marginTop: 28 }}>
          {visible.map((p) => {
            const cat = V3_CATEGORY[p.category] ?? V3_CATEGORY.systems
            return (
              <Link
                key={p.slug}
                href={`/projects/${p.slug}`}
                className="v3-pcard"
                style={{ ["--v3-pcard-color" as string]: cat.color }}
              >
                <div className="v3-pcard__bar" aria-hidden />
                <div className="v3-pcard__body">
                  <div className="v3-pcard__row">
                    <span className="v3-pcard__cat">{cat.label}</span>
                    {p.isResearch ? (
                      <span className="v3-pcard__research">research</span>
                    ) : null}
                  </div>
                  <h3 className="v3-pcard__title">{p.name}</h3>
                  <p className="v3-pcard__tagline">{p.tagline}</p>
                  {p.technologies.length > 0 ? (
                    <div className="v3-pcard__tech">
                      {p.technologies.slice(0, 4).map((t) => (
                        <span key={t} className="v3-pcard__chip">
                          {t}
                        </span>
                      ))}
                      {p.technologies.length > 4 ? (
                        <span className="v3-pcard__more">
                          +{p.technologies.length - 4}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="v3-pcard__foot">
                    {p.sources.claudeCode ? (
                      <span className="v3-pcard__source">
                        <Bot size={11} strokeWidth={2.25} /> Code
                      </span>
                    ) : null}
                    {p.sources.claudeWeb ? (
                      <span className="v3-pcard__source">
                        <MessageSquare size={11} strokeWidth={2.25} /> Web
                      </span>
                    ) : null}
                    {p.sources.github ? (
                      <span className="v3-pcard__source">
                        <GitBranch size={11} strokeWidth={2.25} /> GitHub
                      </span>
                    ) : null}
                    <span className="v3-pcard__msgs">
                      {p.totalMessages.toLocaleString()} msgs
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
