"use client"

import { motion } from "framer-motion"
import { ShieldCheck, ShieldAlert } from "lucide-react"
import type { ContinuousHealth } from "./api"

function Row({
  label,
  value,
  detail,
  ok,
}: {
  label: string
  value: string
  detail: string
  ok: boolean
}) {
  const color = ok ? "var(--brand-success, #22c55e)" : "var(--brand-error)"
  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3"
      style={{ background: "var(--brand-bg)", border: "1px solid var(--brand-border)" }}
    >
      <div className="flex items-center gap-3">
        {ok ? <ShieldCheck size={18} color={color} /> : <ShieldAlert size={18} color={color} />}
        <div>
          <div className="font-mono text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
            {label}
          </div>
          <div className="font-mono text-[10px]" style={{ color: "var(--brand-muted)" }}>
            {detail}
          </div>
        </div>
      </div>
      <div className="font-mono text-sm font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

export function NISTPanel({ cont }: { cont: ContinuousHealth | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-2xl p-5 sm:p-7"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium font-mono uppercase tracking-wide" style={{ color: "var(--brand-muted)" }}>
          NIST SP 800-90B Continuous Health
        </h3>
        <span
          className="font-mono text-[10px] px-2 py-0.5 rounded"
          style={{
            background: (cont?.fails_last_24h ?? 0) === 0
              ? "color-mix(in srgb, var(--brand-success, #22c55e) 15%, transparent)"
              : "color-mix(in srgb, var(--brand-error) 15%, transparent)",
            color: (cont?.fails_last_24h ?? 0) === 0 ? "var(--brand-success, #22c55e)" : "var(--brand-error)",
          }}
        >
          {cont?.fails_last_24h ?? 0} fails / 24h
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Row
          label="Repetition Count Test"
          detail={`cutoff ${cont?.rct.cutoff ?? "—"} · max run ${cont?.rct.max_run_seen ?? "—"}`}
          value={`run ${cont?.rct.current_run_length ?? "—"}`}
          ok={!!cont && cont.rct.current_run_length < cont.rct.cutoff}
        />
        <Row
          label="Adaptive Proportion Test"
          detail={`window ${cont?.apt.window_size ?? "—"} · cutoff ${cont?.apt.cutoff ?? "—"}`}
          value={cont?.apt.last_verdict?.[0]?.toUpperCase() ?? "—"}
          ok={cont?.apt.last_verdict?.[0] === "pass"}
        />
      </div>

      <div className="mt-3 font-mono text-[10px]" style={{ color: "var(--brand-muted)" }}>
        Per-bit health tests run continuously on every byte leaving the pool. RCT fails on
        improbably long runs; APT fails when a value appears too often in a rolling window.
      </div>
    </motion.div>
  )
}
