"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import {
  StatusHero,
  StatsCounters,
  SoakArchive,
  TopFrequencies,
  BandRegistry,
  JobHistory,
  getHealth,
  getBands,
  getSoak,
  getJobs,
  type HealthResponse,
  type Band,
  type SoakBand,
  type Job,
} from "@/components/sdr"

export default function SDRPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [bands, setBands] = useState<Band[]>([])
  const [soak, setSoak] = useState<SoakBand[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    let mounted = true
    const ctrl = new AbortController()

    const load = async () => {
      const results = await Promise.allSettled([
        getHealth(ctrl.signal),
        getBands(ctrl.signal),
        getSoak(ctrl.signal),
        getJobs(ctrl.signal),
      ])
      if (!mounted) return
      const [h, b, s, j] = results
      if (h.status === "fulfilled") setHealth(h.value)
      if (b.status === "fulfilled") setBands(b.value)
      if (s.status === "fulfilled") setSoak(s.value)
      if (j.status === "fulfilled") setJobs(j.value)
      setError(h.status === "rejected")
    }

    load()
    const id = setInterval(load, 30_000)

    return () => {
      mounted = false
      ctrl.abort()
      clearInterval(id)
    }
  }, [])

  return (
    <div className="pt-16 sm:pt-20 pb-10 sm:pb-16">
      <div className="container-page space-y-4 sm:space-y-6">
        <StatusHero health={health} soak={soak} error={error} />
        <StatsCounters soak={soak} bands={bands} jobs={jobs} />
        <SoakArchive soak={soak} />
        <TopFrequencies soak={soak} />
        <BandRegistry bands={bands} />
        <JobHistory jobs={jobs} />

        <div
          className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
        >
          <div>
            <div className="font-mono text-xs uppercase tracking-wide mb-1" style={{ color: "var(--brand-muted)" }}>
              Build your own
            </div>
            <div className="text-sm" style={{ color: "var(--brand-text)" }}>
              rtl-sdr · bash + C scanners · systemd templated units · SQLite hit store
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="https://sdr.tinymachines.ai/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono uppercase tracking-wide"
              style={{
                background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
                color: "var(--brand-primary)",
                border: "1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)",
              }}
            >
              API <ExternalLink size={11} />
            </Link>
            <Link
              href="https://github.com/tinymachines/sdr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-mono uppercase tracking-wide"
              style={{
                background: "var(--brand-bg)",
                color: "var(--brand-text)",
                border: "1px solid var(--brand-border)",
              }}
            >
              Source <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
