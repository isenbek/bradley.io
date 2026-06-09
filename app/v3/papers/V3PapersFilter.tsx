"use client"

import { useMemo, useState } from "react"
import { BookOpen, Database, ExternalLink, FileText, FlaskConical } from "lucide-react"
import { PAPER_CATEGORY, type PaperCatId } from "./_categories"

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

export interface Study {
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

function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

function StudyCard({ study }: { study: Study }) {
  const cat = PAPER_CATEGORY[study.category as PaperCatId] ?? PAPER_CATEGORY.research

  return (
    <article
      className="v3-study"
      style={{ ["--v3-study-color" as string]: cat.color }}
    >
      <div className="v3-study__bar" aria-hidden />
      <div className="v3-study__body">
        <div className="v3-study__row">
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="v3-study__cat">{cat.label}</span>
            <span
              className={`v3-study__status v3-study__status--${
                study.hasPaper ? "paper" : "draft"
              }`}
            >
              {study.hasPaper ? "paper" : study.status}
            </span>
          </div>
          <span className="v3-study__date">{formatMonth(study.createdAt)}</span>
        </div>

        <h3 className="v3-study__title">{study.title}</h3>
        <p className="v3-study__desc">{study.description}</p>

        {study.previewImage ? (
          <div className="v3-study__viz">
            <img
              src={study.previewImage}
              alt={`Visualization for ${study.title}`}
              loading="lazy"
            />
          </div>
        ) : null}

        {study.resultsSummary ? (
          <div className="v3-study__finding">
            <div className="v3-study__finding-head">
              <FlaskConical size={13} strokeWidth={2.25} />
              <strong>Key finding</strong>
              <span className="v3-study__finding-tally">
                {study.resultsSummary.clustered}/{study.resultsSummary.totalStreams} clustered
              </span>
            </div>
            <div className="v3-study__highlights">
              {study.resultsSummary.highlights.map((h) => (
                <div key={h.label} className="v3-study__hl">
                  <div className="v3-study__hl-lbl">{h.label}</div>
                  <div className="v3-study__hl-meta">
                    CV={h.cv} · {h.events.toLocaleString()} events
                  </div>
                  <div
                    className={`v3-study__hl-verdict ${
                      h.cv > 2
                        ? "v3-study__hl-verdict--strong"
                        : "v3-study__hl-verdict--mild"
                    }`}
                  >
                    {h.verdict}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="v3-study__actions">
          {study.hasPaper && study.paperUrl ? (
            <a
              href={study.paperUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="v3-action v3-action--pdf"
            >
              <FileText size={13} strokeWidth={2.25} /> Read PDF
            </a>
          ) : null}
          {study.hasViz ? (
            <span className="v3-action v3-action--viz">
              <FlaskConical size={13} strokeWidth={2.25} /> Interactive viz
            </span>
          ) : null}
          {study.dataFileCount > 0 ? (
            <span className="v3-action v3-action--data">
              <Database size={13} strokeWidth={2.25} /> {study.dataFileCount} data files
            </span>
          ) : null}
        </div>

        {study.references.length > 0 ? (
          <details className="v3-study__refs">
            <summary>
              <BookOpen size={12} strokeWidth={2.25} />
              {study.references.length} reference {study.references.length === 1 ? "paper" : "papers"}
            </summary>
            <ul>
              {study.references.map((ref) => (
                <li key={ref.arxivId}>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="v3-ref"
                  >
                    <div className="v3-ref__title">
                      <span>
                        {ref.title.slice(0, 110)}
                        {ref.title.length > 110 ? "…" : ""}
                      </span>
                      <ExternalLink
                        size={11}
                        strokeWidth={2.5}
                        style={{ color: "var(--v3-blue-500)", flexShrink: 0 }}
                      />
                    </div>
                    <div className="v3-ref__meta">
                      arXiv:{ref.arxivId} · {new Date(ref.published).getFullYear()}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </article>
  )
}

export function V3PapersFilter({
  studies,
  categories,
}: {
  studies: Study[]
  categories: Record<string, number>
}) {
  const [active, setActive] = useState<string | null>(null)

  const ordered = useMemo(() => {
    return [...studies].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [studies])

  const visible = active ? ordered.filter((s) => s.category === active) : ordered

  const catEntries = Object.entries(categories).sort((a, b) => b[1] - a[1])

  return (
    <>
      <div className="v3-filter" role="tablist" aria-label="Filter studies by category">
        <button
          type="button"
          data-active={active === null}
          onClick={() => setActive(null)}
          role="tab"
          aria-selected={active === null}
        >
          All <span className="v3-filter__count">({studies.length})</span>
        </button>
        {catEntries.map(([id, count]) => {
          const cat = PAPER_CATEGORY[id as PaperCatId] ?? PAPER_CATEGORY.research
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
              {cat.label} <span className="v3-filter__count">({count})</span>
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <div className="v3-empty">No studies in this domain yet.</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))",
            gap: 20,
            marginTop: 24,
          }}
        >
          {visible.map((s) => (
            <StudyCard key={s.slug} study={s} />
          ))}
        </div>
      )}
    </>
  )
}
