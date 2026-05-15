"use client"

import { TRNGCard } from "./TRNGCard"

export function RecentAdditions() {
  return (
    <section className="pb-8 sm:pb-10">
      <div className="container-page">
        <div className="mb-6 sm:mb-8 flex items-end justify-between gap-4">
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-[3px] mb-1"
              style={{ color: "var(--brand-primary)" }}
            >
              Recent Additions
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Fresh from the workbench.
            </h2>
          </div>
          <div
            className="hidden sm:block font-mono text-[10px] uppercase tracking-widest text-right"
            style={{ color: "var(--brand-muted)" }}
          >
            Live experiments
            <br />
            from the lab
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <TRNGCard />
          {/* Dragonfly / ADSB / GPS card lands here next */}
        </div>
      </div>
    </section>
  )
}
