"use client"

import type { BigIdea } from "@/lib/site-data"
import { categoryMap, type CategoryId } from "@/lib/project-categories"

interface BigIdeasProps {
  ideas?: BigIdea[]
}

export function BigIdeas({ ideas }: BigIdeasProps) {
  if (!ideas || ideas.length === 0) return null

  return (
    <section
      className="py-8 sm:py-12"
      style={{ borderBottom: "1px solid var(--brand-border)" }}
    >
      <div className="container-page">
        <div className="mb-5 sm:mb-8">
          <div
            className="text-xs font-semibold uppercase tracking-[3px] mb-1"
            style={{ color: "var(--brand-primary)" }}
          >
            Big Ideas
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            What&apos;s brewing.
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {ideas.map((idea, i) => {
            const cat = categoryMap[idea.category as CategoryId]
            const color = cat?.color || "var(--brand-primary)"

            return (
              <div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "var(--brand-bg-alt)",
                  border: "1px solid var(--brand-border)",
                }}
              >
                <div className="h-[3px] w-full" style={{ background: color }} />
                <div className="p-4 sm:p-5">
                  {cat && (
                    <span
                      className="text-[9px] font-semibold uppercase tracking-[2px] font-mono"
                      style={{ color }}
                    >
                      {cat.label}
                    </span>
                  )}
                  <h3 className="text-base font-bold mt-1.5 mb-2">
                    {idea.title}
                  </h3>
                  <p
                    className="text-[13px] leading-relaxed mb-3"
                    style={{ color: "var(--brand-muted)" }}
                  >
                    {idea.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {idea.repos.map((repo) => (
                      <span
                        key={repo}
                        className="text-[10px] font-mono px-2 py-0.5 rounded"
                        style={{
                          color,
                          background: `color-mix(in srgb, ${color} 10%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
                        }}
                      >
                        {repo}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
