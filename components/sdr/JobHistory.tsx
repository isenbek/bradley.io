"use client"

import { motion } from "framer-motion"
import { CheckCircle2, XCircle, Loader, Square } from "lucide-react"
import type { Job } from "./api"

const STATUS: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  completed: { color: "var(--brand-success, #22c55e)", icon: CheckCircle2 },
  running: { color: "var(--brand-primary)", icon: Loader },
  failed: { color: "var(--brand-error)", icon: XCircle },
  stopped: { color: "var(--brand-warning, #f59e0b)", icon: Square },
}

function duration(j: Job): string {
  if (!j.started_at) return "—"
  const start = new Date(j.started_at).getTime()
  const end = j.stopped_at ? new Date(j.stopped_at).getTime() : Date.now()
  const s = Math.max(0, (end - start) / 1000)
  if (s < 60) return `${s.toFixed(1)}s`
  if (s < 3600) return `${(s / 60).toFixed(1)}m`
  return `${(s / 3600).toFixed(1)}h`
}

function ageStr(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const h = diff / 3600_000
  if (h < 1) return `${(diff / 60_000).toFixed(0)}m ago`
  if (h < 24) return `${h.toFixed(0)}h ago`
  return `${(h / 24).toFixed(0)}d ago`
}

export function JobHistory({ jobs }: { jobs: Job[] }) {
  const sorted = [...jobs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-2xl p-5 sm:p-7"
      style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium font-mono uppercase tracking-wide" style={{ color: "var(--brand-muted)" }}>
          Recent Scan Jobs · {jobs.length}
        </h3>
      </div>

      {jobs.length === 0 ? (
        <div className="py-6 text-center font-mono text-xs" style={{ color: "var(--brand-muted)" }}>
          no jobs yet
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((j) => {
            const meta = STATUS[j.status] ?? {
              color: "var(--brand-muted)",
              icon: Square,
            }
            const Icon = meta.icon
            return (
              <div
                key={j.id}
                className="rounded-lg px-4 py-3 grid grid-cols-12 gap-3 items-center"
                style={{
                  background: "var(--brand-bg)",
                  border: "1px solid var(--brand-border)",
                }}
              >
                <div className="col-span-12 sm:col-span-5 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon size={14} style={{ color: meta.color }} className={j.status === "running" ? "animate-spin" : ""} />
                    <span className="font-mono text-sm font-bold truncate" style={{ color: "var(--brand-text)" }}>
                      #{j.id} {j.name}
                    </span>
                  </div>
                  <div className="font-mono text-[10px]" style={{ color: "var(--brand-muted)" }}>
                    scanner · {j.scanner}
                    {j.exit_code != null && j.exit_code !== 0 && ` · exit ${j.exit_code}`}
                  </div>
                </div>
                <div className="col-span-4 sm:col-span-3 font-mono text-xs" style={{ color: "var(--brand-text)" }}>
                  {duration(j)}
                  <span className="block text-[10px]" style={{ color: "var(--brand-muted)" }}>
                    duration
                  </span>
                </div>
                <div className="col-span-4 sm:col-span-2 font-mono text-xs" style={{ color: "var(--brand-text)" }}>
                  {ageStr(j.started_at)}
                  <span className="block text-[10px]" style={{ color: "var(--brand-muted)" }}>
                    started
                  </span>
                </div>
                <div className="col-span-4 sm:col-span-2 text-right">
                  <span
                    className="font-mono text-[10px] px-2 py-0.5 rounded uppercase tracking-wide"
                    style={{
                      background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
                      color: meta.color,
                    }}
                  >
                    {j.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
