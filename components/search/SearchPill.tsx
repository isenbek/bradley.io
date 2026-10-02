"use client"

import Link from "next/link"
import { useCallback, useEffect, useId, useRef, useState } from "react"

/**
 * The search pill in the masthead, and the dialog it opens.
 *
 * Search is semantic: the query is embedded by the local model and matched
 * against every page on this server in a vectl store (app/api/search, which
 * proxies scripts/site-search/server.py). So "radioactive random numbers"
 * finds /trng even though that page never uses the word "random numbers" in
 * its title.
 *
 * Open with the pill, "/" (when not typing somewhere) or Ctrl/Cmd+K.
 * Arrow keys move through results, Enter opens one, Escape closes and puts
 * focus back where it was. The dialog is modal: Tab stays inside it.
 */

type Hit = {
  path: string
  url: string
  title: string
  heading: string
  snippet: string
  score: number
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; q: string; hits: Hit[]; ms: number | null }
  | { kind: "error"; reason: string }

const REASONS: Record<string, string> = {
  busy: "Too many searches in a minute. Give it a moment.",
  "no-index": "The search index is being rebuilt. Try again shortly.",
  unavailable: "Search is not answering right now. The menu still lists every page.",
}

export function SearchPill() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [state, setState] = useState<State>({ kind: "idle" })
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const seq = useRef(0)
  const listId = useId()

  const show = useCallback(() => {
    returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setOpen(true)
  }, [])

  const hide = useCallback(() => {
    setOpen(false)
    returnTo.current?.focus?.()
  }, [])

  // Global shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (open) hide()
        else show()
      } else if (e.key === "/" && !typing && !open) {
        e.preventDefault()
        show()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, show, hide])

  // Focus the input on open; lock page scroll while open.
  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    inputRef.current?.select()
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = "hidden"
    return () => {
      html.style.overflow = prev
    }
  }, [open])

  // Debounced search.
  useEffect(() => {
    if (!open) return
    const query = q.trim()
    if (query.length < 2) {
      setState({ kind: "idle" })
      return
    }
    const my = ++seq.current
    const timer = setTimeout(async () => {
      setState({ kind: "loading" })
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&k=8`, { cache: "no-store" })
        const data = (await res.json()) as { ok?: boolean; reason?: string; results?: Hit[]; ms?: number | null }
        if (my !== seq.current) return
        if (data.ok && Array.isArray(data.results)) {
          setState({ kind: "done", q: query, hits: data.results, ms: data.ms ?? null })
          setActive(0)
        } else {
          setState({ kind: "error", reason: data.reason ?? "unavailable" })
        }
      } catch {
        if (my === seq.current) setState({ kind: "error", reason: "unavailable" })
      }
    }, 220)
    return () => clearTimeout(timer)
  }, [q, open])

  const hits = state.kind === "done" ? state.hits : []

  const onDialogKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      hide()
      return
    }
    if (e.key === "ArrowDown" && hits.length) {
      e.preventDefault()
      setActive((i) => (i + 1) % hits.length)
    } else if (e.key === "ArrowUp" && hits.length) {
      e.preventDefault()
      setActive((i) => (i - 1 + hits.length) % hits.length)
    } else if (e.key === "Enter" && hits.length && e.target === inputRef.current) {
      e.preventDefault()
      const hit = hits[active]
      if (hit) {
        setOpen(false)
        window.location.assign(hit.path)
      }
    } else if (e.key === "Tab") {
      // Keep Tab inside the dialog.
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>("input, a[href], button")
      if (!nodes || nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <>
      <button
        type="button"
        className="beta-search-pill"
        onClick={show}
        aria-haspopup="dialog"
        aria-label="Search the site"
        title="Search the site ( / or Ctrl+K )"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
          <circle cx="6.75" cy="6.75" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <line x1="10.3" y1="10.3" x2="14.25" y2="14.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
        </svg>
        <span className="beta-search-pill__label">Search</span>
        <kbd className="beta-search-pill__kbd" aria-hidden="true">
          /
        </kbd>
      </button>

      {open ? (
        <div className="beta-search" onKeyDown={onDialogKey}>
          <div className="beta-search__scrim" onClick={hide} aria-hidden="true" />
          <div
            className="beta-search__dialog panel"
            role="dialog"
            aria-modal="true"
            aria-label="Search the site"
            ref={dialogRef}
          >
            <div className="panel-face">
              <div className="panel-bar">
                <b>Search</b>
                <span>by meaning, on this server</span>
              </div>
              <div className="beta-search__field">
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                  <circle cx="6.75" cy="6.75" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <line x1="10.3" y1="10.3" x2="14.25" y2="14.25" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
                </svg>
                <input
                  ref={inputRef}
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Try: radioactive random numbers"
                  aria-label="Search query"
                  aria-controls={listId}
                  aria-activedescendant={hits.length ? `${listId}-${active}` : undefined}
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={200}
                />
                <button type="button" className="beta-search__close" onClick={hide}>
                  Esc
                </button>
              </div>

              <div className="beta-search__body" aria-live="polite">
                {state.kind === "idle" ? (
                  <p className="beta-search__note">
                    Every page on this server, searched by meaning rather than exact words. The index
                    is vectl, the embeddings come from a model running on this box, and nothing
                    leaves it.
                  </p>
                ) : null}
                {state.kind === "loading" ? <p className="beta-search__note">Searching.</p> : null}
                {state.kind === "error" ? (
                  <p className="beta-search__note">{REASONS[state.reason] ?? REASONS.unavailable}</p>
                ) : null}
                {state.kind === "done" && hits.length === 0 ? (
                  <p className="beta-search__note">
                    Nothing on this site is close to &ldquo;{state.q}&rdquo;. The{" "}
                    <Link href="/bench" onClick={() => setOpen(false)}>
                      bench
                    </Link>{" "}
                    lists every page.
                  </p>
                ) : null}
                {hits.length ? (
                  <ol className="beta-search__hits" id={listId} role="listbox" aria-label="Results">
                    {hits.map((h, i) => (
                      <li key={h.path} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                        <a
                          href={h.path}
                          className={i === active ? "is-active" : undefined}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => setOpen(false)}
                        >
                          <span className="beta-search__title">{h.title}</span>
                          <span className="beta-search__path">
                            {h.path}
                            {h.heading ? ` · ${h.heading}` : ""}
                          </span>
                          <span className="beta-search__snip">{h.snippet}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>

              <p className="beta-search__foot">
                {state.kind === "done" && state.ms !== null ? `${state.ms} ms · ` : ""}
                <kbd>↑</kbd> <kbd>↓</kbd> move · <kbd>Enter</kbd> open · <kbd>Esc</kbd> close
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
