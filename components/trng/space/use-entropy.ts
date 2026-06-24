"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getEntropyBytes } from "@/components/trng"

export type EntropyStatus = "loading" | "ready" | "pool-low"

/**
 * One shared pull of true decay entropy, fed to every visualization on the
 * page. The radioactive pool is scarce (~3 B/s, hours to refill), so the whole
 * page consumes a single modest buffer instead of each widget hammering the
 * source. `regenerate()` pulls a fresh buffer on demand (the "pour entropy"
 * buttons); while the pool is low we back off and retry rather than erroring.
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
      const b = await getEntropyBytes(targetBytes, ctrl.signal)
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

  // while the pool is low, retry quietly with a long backoff
  useEffect(() => {
    if (status !== "pool-low") return
    const id = window.setTimeout(regenerate, 25_000)
    return () => clearTimeout(id)
  }, [status, regenerate])

  return { bytes, status, regenerate }
}
