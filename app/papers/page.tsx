"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  FileText, ExternalLink, FlaskConical, Database,
  BookOpen, ChevronDown, ChevronRight,
} from "lucide-react"

interface ResultHighlight {
  label: string
  category: string
  cv: number
  events: number
  verdict: string
}

interface Reference {
  arxivId: string
  title: string
  abstract: string
  published: string
  url: string
}

interface Study {
  slug: string
  title: string
  description: string
  status: string
  author: string
  category: string
  createdAt: string
  hasPaper: boolean
  hasViz: boolean
  previewImage: string | null
  paperUrl: string | null
  dataFileCount: number
  refPaperCount: number
  references: Reference[]
  resultsSummary?: {
    totalStreams: number
    clustered: number
    highlights: ResultHighlight[]
  }
}

interface PapersData {
  generated: string
  totalStudies: number
  totalReferences: number
  categories: Record<string, number>
  studies: Study[]
}

const CATEGORY_STYLES: Record<string, { color: string; label: string }> = {
  seismology: { color: "var(--brand-secondary)", label: "Seismology" },
  "space-weather": { color: "var(--brand-primary)", label: "Space Weather" },
  climate: { color: "var(--brand-info)", label: "Climate" },
  "cross-domain": { color: "var(--brand-warning)", label: "Cross-Domain" },
  radiation: { color: "var(--brand-steel)", label: "Radiation" },
  hydrology: { color: "var(--brand-info)", label: "Hydrology" },
  research: { color: "var(--brand-muted)", label: "Research" },
}

function StudyCard({ study }: { study: Study }) {
  const [expanded, setExpanded] = useState(false)
  const cat = CATEGORY_STYLES[study.category] || CATEGORY_STYLES.research

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--brand-bg-alt)",
        border: "1px solid var(--brand-border)",
      }}
    >
      <div className="h-[3px] w-full" style={{ background: cat.color }} />

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
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
              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{
                color: study.hasPaper ? "var(--brand-success)" : "var(--brand-warning)",
                background: study.hasPaper
                  ? "color-mix(in srgb, var(--brand-success) 10%, transparent)"
                  : "color-mix(in srgb, var(--brand-warning) 10%, transparent)",
              }}
            >
              {study.hasPaper ? "paper" : study.status}
            </span>
          </div>
          <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--brand-muted)" }}>
            {new Date(study.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold mb-2">{study.title}</h3>
        <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--brand-muted)" }}>
          {study.description}
        </p>

        {/* Preview image */}
        {study.previewImage && (
          <div className="mb-4 rounded-lg overflow-hidden" style={{ border: "1px solid var(--brand-border)" }}>
            <Image
              src={study.previewImage}
              alt={`Visualization for ${study.title}`}
              width={800}
              height={400}
              className="w-full h-auto"
              style={{ background: "var(--brand-bg)" }}
            />
          </div>
        )}

        {/* Results summary (for cross-domain paper) */}
        {study.resultsSummary && (
          <div
            className="rounded-lg p-4 mb-4"
            style={{
              background: "color-mix(in srgb, var(--brand-warning) 5%, transparent)",
              border: "1px solid color-mix(in srgb, var(--brand-warning) 15%, transparent)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-4 h-4" style={{ color: "var(--brand-warning)" }} />
              <span className="text-sm font-bold">Key Finding</span>
              <span className="text-xs font-mono" style={{ color: "var(--brand-warning)" }}>
                {study.resultsSummary.clustered}/{study.resultsSummary.totalStreams} clustered
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {study.resultsSummary.highlights.map((h) => (
                <div
                  key={h.label}
                  className="text-xs font-mono px-2 py-1.5 rounded"
                  style={{
                    background: "color-mix(in srgb, var(--brand-bg) 60%, transparent)",
                    border: "1px solid var(--brand-border)",
                  }}
                >
                  <div className="font-semibold mb-0.5" style={{ color: "var(--brand-text)" }}>
                    {h.label}
                  </div>
                  <div style={{ color: "var(--brand-muted)" }}>
                    CV={h.cv} · {h.events.toLocaleString()} events
                  </div>
                  <div
                    className="text-[9px] uppercase font-bold mt-0.5"
                    style={{ color: h.cv > 2 ? "var(--brand-secondary)" : "var(--brand-warning)" }}
                  >
                    {h.verdict}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {study.hasPaper && study.paperUrl && (
            <a
              href={study.paperUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
              style={{
                background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
                color: "var(--brand-primary)",
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              Read Paper (PDF)
            </a>
          )}
          {study.hasViz && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg"
              style={{
                background: "color-mix(in srgb, var(--brand-info) 8%, transparent)",
                color: "var(--brand-info)",
              }}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Interactive Viz
            </span>
          )}
          {study.dataFileCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg"
              style={{
                background: "color-mix(in srgb, var(--brand-steel) 8%, transparent)",
                color: "var(--brand-steel)",
              }}
            >
              <Database className="w-3.5 h-3.5" />
              {study.dataFileCount} data files
            </span>
          )}
        </div>

        {/* References accordion */}
        {study.references.length > 0 && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-xs font-mono cursor-pointer"
              style={{ color: "var(--brand-muted)" }}
            >
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <BookOpen className="w-3 h-3" />
              {study.references.length} reference papers
            </button>
            {expanded && (
              <div className="mt-2 space-y-2">
                {study.references.map((ref) => (
                  <a
                    key={ref.arxivId}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs p-2 rounded-lg transition-colors hover:bg-sf-white/5"
                    style={{ border: "1px solid var(--brand-border)" }}
                  >
                    <div className="font-semibold mb-0.5 flex items-center gap-1.5">
                      {ref.title.slice(0, 80)}{ref.title.length > 80 ? "..." : ""}
                      <ExternalLink className="w-3 h-3 shrink-0" style={{ color: "var(--brand-primary)" }} />
                    </div>
                    <div className="font-mono" style={{ color: "var(--brand-muted)" }}>
                      arXiv:{ref.arxivId} · {new Date(ref.published).getFullYear()}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PapersPage() {
  const [data, setData] = useState<PapersData | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    fetch("/data/papers-data.json")
      .then((r) => r.json())
      .then(setData)
  }, [])

  if (!data) {
    return (
      <div className="pt-20 sm:pt-24 pb-10 sm:pb-16 container-page text-center" style={{ color: "var(--brand-muted)" }}>
        Loading research...
      </div>
    )
  }

  const filtered = activeCategory
    ? data.studies.filter((s) => s.category === activeCategory)
    : data.studies

  return (
    <div className="pt-20 sm:pt-24 pb-10 sm:pb-16">
      {/* Hero */}
      <section className="container-page mb-8 sm:mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: "color-mix(in srgb, var(--brand-secondary) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--brand-secondary) 25%, transparent)",
            }}
          >
            <FlaskConical className="w-5 h-5" style={{ color: "var(--brand-secondary)" }} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[3px]" style={{ color: "var(--brand-secondary)" }}>
              TerraPulse
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              Research Papers
            </h1>
          </div>
        </div>
        <p className="text-base sm:text-lg max-w-[640px]" style={{ color: "var(--brand-muted)" }}>
          Active research in environmental data science — seismology, space weather, climate
          patterns, and cross-domain statistical analysis. All studies use open government data.
        </p>
      </section>

      {/* Stats bar */}
      <section className="container-page mb-8 sm:mb-10">
        <div
          className="grid grid-cols-3 gap-4 rounded-xl p-4 sm:p-6"
          style={{
            background: "var(--brand-bg-alt)",
            border: "1px solid var(--brand-border)",
          }}
        >
          {[
            { val: data.totalStudies, label: "Studies", color: "var(--brand-secondary)" },
            { val: data.totalReferences, label: "References", color: "var(--brand-primary)" },
            { val: Object.keys(data.categories).length, label: "Domains", color: "var(--brand-warning)" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-4xl font-extrabold tabular-nums" style={{ color: s.color }}>
                {s.val}
              </div>
              <div className="text-[10px] sm:text-xs font-medium uppercase tracking-widest mt-0.5" style={{ color: "var(--brand-muted)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category filter */}
      <section className="container-page mb-6 sm:mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveCategory(null)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all border whitespace-nowrap shrink-0"
            style={{
              background: activeCategory === null ? "var(--brand-text)" : "transparent",
              borderColor: activeCategory === null ? "var(--brand-text)" : "var(--brand-border)",
              color: activeCategory === null ? "var(--brand-bg)" : "var(--brand-steel)",
            }}
          >
            All ({data.totalStudies})
          </button>
          {Object.entries(data.categories).map(([id, count]) => {
            const cat = CATEGORY_STYLES[id] || CATEGORY_STYLES.research
            const isActive = activeCategory === id
            return (
              <button
                key={id}
                onClick={() => setActiveCategory(isActive ? null : id)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all border whitespace-nowrap shrink-0"
                style={{
                  background: isActive ? `color-mix(in srgb, ${cat.color} 15%, transparent)` : "transparent",
                  borderColor: isActive ? cat.color : "var(--brand-border)",
                  color: isActive ? cat.color : "var(--brand-steel)",
                }}
              >
                {cat.label} ({count})
              </button>
            )
          })}
        </div>
      </section>

      {/* Studies grid */}
      <section className="container-page">
        <div className="grid lg:grid-cols-2 gap-5">
          {filtered.map((study) => (
            <StudyCard key={study.slug} study={study} />
          ))}
        </div>
      </section>
    </div>
  )
}
