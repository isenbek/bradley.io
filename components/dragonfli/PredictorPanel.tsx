"use client"

import { motion } from "framer-motion"
import { Brain } from "lucide-react"
import type { PredictStatus } from "./api"

function formatAge(s: number): string {
  const m = s / 60
  if (m < 60) return `${m.toFixed(0)}m`
  const h = m / 60
  if (h < 24) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

export function PredictorPanel({ status }: { status: PredictStatus | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-2xl p-5 sm:p-7"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain size={14} style={{ color: "var(--brand-primary)" }} />
          <h3 className="text-sm font-medium font-mono uppercase tracking-wide" style={{ color: "var(--brand-muted)" }}>
            Density Predictor
          </h3>
        </div>
        <span
          className="font-mono text-[10px] px-2 py-0.5 rounded"
          style={{
            background: status?.model_loaded
              ? "color-mix(in srgb, var(--brand-success, #22c55e) 15%, transparent)"
              : "color-mix(in srgb, var(--brand-error) 15%, transparent)",
            color: status?.model_loaded ? "var(--brand-success, #22c55e)" : "var(--brand-error)",
          }}
        >
          {status?.model_loaded ? "model loaded" : "not loaded"}
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="trained" value={formatDate(status?.model_meta?.trained_at)} sub={status?.model_meta?.model_version ?? ""} />
        <Stat
          label="cache age"
          value={status ? formatAge(status.cache_stats.age_seconds) : "—"}
          sub={`${status?.cache_stats.historical_patterns_rows.toLocaleString() ?? 0} patterns`}
        />
        <Stat
          label="resolution"
          value={`geohash ${status?.model_meta?.geohash_precision ?? "—"}`}
          sub={`${status?.cache_stats.geohash_metadata_cells ?? 0} cells · ${status?.model_meta?.bucket_minutes ?? "—"}m buckets`}
        />
      </div>

      <div className="mt-3 font-mono text-[10px]" style={{ color: "var(--brand-muted)" }}>
        Predictor forecasts aircraft density per geohash cell + 15-minute bucket from {status?.cache_stats.historical_patterns_rows?.toLocaleString() ?? "—"} historical patterns.
      </div>
    </motion.div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "var(--brand-bg)", border: "1px solid var(--brand-border)" }}
    >
      <div className="font-mono text-[10px] uppercase tracking-wide" style={{ color: "var(--brand-muted)" }}>
        {label}
      </div>
      <div className="font-mono text-lg font-bold mt-0.5" style={{ color: "var(--brand-primary)" }}>
        {value}
      </div>
      {sub && (
        <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--brand-muted)" }}>
          {sub}
        </div>
      )}
    </div>
  )
}
