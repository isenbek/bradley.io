"use client"

// TEMPORARY — the pinned documents panel on /junior. Delete at teardown.
//
// Polls the index every 20s so a doc written mid-session appears without a
// reload. Deliberately NOT socket.io: the wargames socket server is a separate
// long-lived process with its own concerns, and wiring a temporary page into it
// buys nothing here — a doc landing 20 seconds late costs nothing, and polling
// can't break anything already running.

import { useCallback, useEffect, useRef, useState } from "react"
import { FileText, Download, RefreshCw, X } from "lucide-react"

type Doc = {
  slug: string
  title: string
  summary: string
  updated: string
  bytes: number
  mtime: number
}

function sizeOf(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

export function JuniorDocs() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [open, setOpen] = useState<Doc | null>(null)
  const [html, setHtml] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const seen = useRef<Set<string>>(new Set())
  const [fresh, setFresh] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/junior/docs", { cache: "no-store" })
      if (!res.ok) return
      const data: { docs: Doc[] } = await res.json()
      // Mark anything we hadn't seen before, so a doc appearing mid-session is
      // visibly new rather than silently sliding into the list.
      const isFirst = seen.current.size === 0
      const added = new Set<string>()
      for (const d of data.docs) {
        const key = `${d.slug}:${d.mtime}`
        if (!isFirst && !seen.current.has(key)) added.add(d.slug)
        seen.current.add(key)
      }
      setDocs(data.docs)
      if (added.size) setFresh(added)
    } catch {
      // A failed poll is not worth surfacing — the next one is 20s away.
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 20_000)
    return () => clearInterval(t)
  }, [load])

  async function view(doc: Doc) {
    setOpen(doc)
    setLoading(true)
    setHtml("")
    try {
      const res = await fetch(`/api/junior/docs/${doc.slug}?format=html`, { cache: "no-store" })
      setHtml(res.ok ? await res.text() : "<p>Could not load this document.</p>")
    } catch {
      setHtml("<p>Could not load this document.</p>")
    } finally {
      setLoading(false)
    }
  }

  if (!docs.length) return null

  return (
    <section className="v3-section v3-jr-docsec">
      <div className="v3-wrap">
        <div className="v3-cardhead">
          <FileText size={17} strokeWidth={2.4} aria-hidden />
          <h2>Documents</h2>
          <span className="v3-cardhead__meta">written as we go · updates on its own</span>
        </div>

        <ul className="v3-jr-docs">
          {docs.map((d) => (
            <li key={d.slug} className={`v3-jr-doc${fresh.has(d.slug) ? " v3-jr-doc--new" : ""}`}>
              <button type="button" className="v3-jr-doc__main" onClick={() => view(d)}>
                <span className="v3-jr-doc__title">
                  {d.title}
                  {fresh.has(d.slug) && <span className="v3-jr-doc__badge">updated</span>}
                </span>
                {d.summary && <span className="v3-jr-doc__sum">{d.summary}</span>}
                <span className="v3-jr-doc__meta">
                  {d.updated && <>{d.updated} · </>}
                  {sizeOf(d.bytes)} · markdown
                </span>
              </button>
              <a
                className="v3-jr-doc__dl"
                href={`/api/junior/docs/${d.slug}?format=md&download=1`}
                aria-label={`Download ${d.title} as markdown`}
              >
                <Download size={15} strokeWidth={2.4} aria-hidden />
              </a>
            </li>
          ))}
        </ul>

        {open && (
          <div className="v3-jr-reader" role="dialog" aria-modal="true" aria-label={open.title}>
            <div className="v3-jr-reader__bar">
              <span className="v3-jr-reader__title">{open.title}</span>
              <a
                className="v3-jr-reader__act"
                href={`/api/junior/docs/${open.slug}?format=md&download=1`}
              >
                <Download size={13} strokeWidth={2.4} aria-hidden /> markdown
              </a>
              <button type="button" className="v3-jr-reader__act" onClick={() => setOpen(null)}>
                <X size={13} strokeWidth={2.4} aria-hidden /> close
              </button>
            </div>
            <div className="v3-jr-reader__body">
              {loading ? (
                <p className="v3-jr-reader__loading">
                  <RefreshCw size={14} strokeWidth={2.4} aria-hidden /> loading…
                </p>
              ) : (
                // Content is our own markdown from docs/junior/, not user input.
                <div className="v3-md" dangerouslySetInnerHTML={{ __html: html }} />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
