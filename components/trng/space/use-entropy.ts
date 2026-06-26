"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getArchiveEntropyBytes } from "@/components/trng"

// `unavailable` covers the archive being missing / server unreachable. We keep
// the original "pool-low" label as an alias so downstream viz code that already
// branches on status stays valid; the lexical literal is misleading now (the
// pool is never touched) and should be renamed in a follow-up.
export type EntropyStatus = "loading" | "ready" | "pool-low"

/**
 * One shared archive read of decay bytes, fed to every visualization on the
 * page. Reads from /random/archive — a NON-CRYPTOGRAPHIC seek-and-read of the
 * append-only conditioned bit stream — so the viz never touches the scarce
 * fresh tip that real consumers depend on, and never 503s on a low pool. Bytes
 * are still real radioactive-decay output; they may just have been served
 * before. `regenerate()` swaps in a fresh slice (the "pour entropy" buttons +
 * BitRaster auto-regen).
 */
export function useSharedEntropy(targetBytes: number) {
  const [bytes, setBytes] = useState<Uint8Array | null>(null)
  const [status, setStatus] = useState<EntropyStatus>("loading")
  const ctrlRef = useRef<AbortController | null>(null)
  const hasData = useRef(false)

  const regenerate = useCallback(async () => {
    ctrlRef.current?.abort()
    const ctrl = new AbortController()
    ctrlRef.current = ctrl
    if (!hasData.current) setStatus("loading")
    try {
      const b = await getArchiveEntropyBytes(targetBytes, ctrl.signal)
      if (ctrl.signal.aborted) return
      hasData.current = true
      setBytes(b)
      setStatus("ready")
    } catch (e) {
      if ((e as Error).name !== "AbortError") setStatus("pool-low")
    }
  }, [targetBytes])

  // initial pull
  useEffect(() => {
    regenerate()
    return () => ctrlRef.current?.abort()
  }, [regenerate])

  // archive failures should be vanishingly rare (file present, append-only) —
  // but if one slips through, retry quietly on a long backoff.
  useEffect(() => {
    if (status !== "pool-low") return
    const id = window.setTimeout(regenerate, 25_000)
    return () => clearTimeout(id)
  }, [status, regenerate])

  return { bytes, status, regenerate }
}
