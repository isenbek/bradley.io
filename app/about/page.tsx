"use client"

import { useEffect, useState } from "react"
import { Calendar, Code, Cpu, Database } from "lucide-react"
import type { SiteData } from "@/lib/site-data"

export default function AboutPage() {
  const [data, setData] = useState<SiteData | null>(null)

  useEffect(() => {
    fetch("/data/site-data.json")
      .then((r) => r.json())
      .then(setData)
  }, [])

  const about = data?.about
  const stats = data?.stats

  return (
    <div className="pt-20 sm:pt-24 pb-10 sm:pb-16">
      <section className="container-page text-center mb-8 sm:mb-16">
        <div
          className="text-xs font-semibold uppercase tracking-[3px] mb-3"
          style={{ color: "var(--brand-secondary)" }}
        >
          About
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          Brad Bradley
        </h1>
        <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--brand-muted)" }}>
          Frontier Technologist — Grand Rapids, MI
        </p>
      </section>

      <div className="container-page grid lg:grid-cols-[1fr_300px] gap-6 sm:gap-10">
        {/* Main */}
        <div className="space-y-8">
          {/* Bio */}
          <div
            className="rounded-xl p-5 sm:p-8"
            style={{
              background: "var(--brand-bg-alt)",
              border: "1px solid var(--brand-border)",
            }}
          >
            <h2 className="text-lg font-bold mb-4">Bio</h2>
            <p className="leading-relaxed" style={{ color: "var(--brand-muted)" }}>
              {about?.bio || "Loading..."}
            </p>
          </div>

          {/* Timeline */}
          <div
            className="rounded-xl p-5 sm:p-8"
            style={{
              background: "var(--brand-bg-alt)",
              border: "1px solid var(--brand-border)",
            }}
          >
            <h2 className="text-lg font-bold mb-6">Timeline</h2>
            <div className="space-y-6">
              {(about?.timeline || []).map((entry, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--brand-primary) 25%, transparent)",
                      }}
                    >
                      <Calendar className="w-4 h-4" style={{ color: "var(--brand-primary)" }} />
                    </div>
                    {i < (about?.timeline.length || 0) - 1 && (
                      <div className="w-px flex-1 mt-2" style={{ background: "var(--brand-border)" }} />
                    )}
                  </div>
                  <div className="pb-6">
                    <div className="text-xs font-mono mb-1" style={{ color: "var(--brand-primary)" }}>
                      {entry.year}
                    </div>
                    <div className="text-base font-bold mb-1">{entry.title}</div>
                    <div className="text-sm" style={{ color: "var(--brand-muted)" }}>
                      {entry.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div
            className="rounded-xl p-4 sm:p-6"
            style={{
              background: "var(--brand-bg-alt)",
              border: "1px solid var(--brand-border)",
            }}
          >
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "var(--brand-muted)" }}>
              By the Numbers
            </h3>
            <div className="space-y-4">
              {[
                { label: "Projects", value: stats?.totalProjects || 0, icon: Code },
                { label: "AI Sessions", value: stats?.totalSessions || 0, icon: Cpu },
                { label: "Messages", value: (stats?.totalMessages || 0).toLocaleString(), icon: Database },
                { label: "Active Days", value: stats?.activeDays || 0, icon: Calendar },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <stat.icon className="w-4 h-4" style={{ color: "var(--brand-primary)" }} />
                  <span className="text-sm flex-1" style={{ color: "var(--brand-muted)" }}>{stat.label}</span>
                  <span className="font-mono font-bold text-sm">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div
            className="rounded-xl p-4 sm:p-6"
            style={{
              background: "var(--brand-bg-alt)",
              border: "1px solid var(--brand-border)",
            }}
          >
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "var(--brand-muted)" }}>
              Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(about?.skills || []).map((skill) => (
                <span
                  key={skill}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg"
                  style={{
                    background: "color-mix(in srgb, var(--brand-primary) 8%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)",
                    color: "var(--brand-primary)",
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
