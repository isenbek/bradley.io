"use client"

import { useMemo, useState } from "react"

// Shared client-side pagination for Meatball's polling lists (events, moments,
// transcriptions). Newest-first lists keep page 1 = freshest; the page index is
// held across polls so incoming data doesn't yank the reader back to the top.
export function usePager<T>(items: T[], perPage = 10) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / perPage))
  const clamped = Math.min(page, pageCount - 1)
  const slice = useMemo(
    () => items.slice(clamped * perPage, clamped * perPage + perPage),
    [items, clamped, perPage],
  )
  return {
    page: clamped,
    setPage,
    pageCount,
    slice,
    total: items.length,
    perPage,
  }
}

export function Pager({
  page,
  pageCount,
  total,
  perPage,
  onPage,
  unit = "items",
}: {
  page: number
  pageCount: number
  total: number
  perPage: number
  onPage: (p: number) => void
  unit?: string
}) {
  if (total <= perPage) return null
  const from = page * perPage + 1
  const to = Math.min(total, page * perPage + perPage)
  return (
    <div className="v3-pager">
      <button
        className="v3-pager__btn"
        onClick={() => onPage(page - 1)}
        disabled={page <= 0}
        aria-label="previous page"
      >
        ‹ prev
      </button>
      <span className="v3-pager__count">
        {from}–{to} of {total} {unit} · page {page + 1}/{pageCount}
      </span>
      <button
        className="v3-pager__btn"
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount - 1}
        aria-label="next page"
      >
        next ›
      </button>
    </div>
  )
}
