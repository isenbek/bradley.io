"use client"

import { useEffect, useState } from "react"
import { Server, Cpu, Database, MessageSquare, Shield, Briefcase, Lock, Globe, Hash } from "lucide-react"

interface McpService {
  id: string
  name: string
  url: string
  description: string
  auth: string
  capabilities: string[]
  endpointCount: number
}

interface McpCategory {
  id: string
  name: string
  services: McpService[]
}

interface McpCatalog {
  generated: string
  stats: { totalServices: number; totalEndpoints: number; totalCategories: number }
  categories: McpCategory[]
}

const categoryStyles: Record<string, { color: string; icon: React.ReactNode }> = {
  ai: { color: "var(--brand-primary)", icon: <Cpu className="w-5 h-5" /> },
  data: { color: "var(--brand-info)", icon: <Database className="w-5 h-5" /> },
  communication: { color: "var(--brand-secondary)", icon: <MessageSquare className="w-5 h-5" /> },
  infrastructure: { color: "var(--brand-steel)", icon: <Shield className="w-5 h-5" /> },
  business: { color: "var(--brand-warning)", icon: <Briefcase className="w-5 h-5" /> },
}

function ServiceCard({ service, catColor }: { service: McpService; catColor: string }) {
  return (
    <div
      className="rounded-xl overflow-hidden hover:-translate-y-1 transition-all h-full flex flex-col"
      style={{
        background: "var(--brand-bg-alt)",
        border: "1px solid var(--brand-border)",
      }}
    >
      <div className="h-[3px] w-full" style={{ background: catColor }} />
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-[10px] font-semibold uppercase tracking-[1.5px] font-mono"
            style={{ color: catColor }}
          >
            {service.id}
          </span>
          <div className="flex items-center gap-1.5">
            <Hash className="w-3 h-3" style={{ color: "var(--brand-muted)" }} />
            <span className="text-[11px] font-mono" style={{ color: "var(--brand-muted)" }}>
              {service.endpointCount} endpoints
            </span>
          </div>
        </div>

        <h3 className="text-base font-bold mb-2">{service.name}</h3>
        <p className="text-[13px] leading-relaxed mb-4 flex-1" style={{ color: "var(--brand-muted)" }}>
          {service.description}
        </p>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {service.capabilities.map((cap) => (
            <span
              key={cap}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{
                color: catColor,
                background: `color-mix(in srgb, ${catColor} 10%, transparent)`,
                border: `1px solid color-mix(in srgb, ${catColor} 20%, transparent)`,
              }}
            >
              {cap}
            </span>
          ))}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-1.5 mt-auto">
          <Lock className="w-3 h-3" style={{ color: "var(--brand-muted)" }} />
          <span className="text-[11px] font-mono" style={{ color: "var(--brand-muted)" }}>
            {service.auth}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function McpPage() {
  const [catalog, setCatalog] = useState<McpCatalog | null>(null)

  useEffect(() => {
    fetch("/data/mcp-catalog.json")
      .then((r) => r.json())
      .then(setCatalog)
  }, [])

  return (
    <div className="pt-20 sm:pt-24 pb-10 sm:pb-16">
      <div className="container-page">
        {/* Hero */}
        <div className="mb-10 sm:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--brand-primary) 25%, transparent)",
              }}
            >
              <Server className="w-5 h-5" style={{ color: "var(--brand-primary)" }} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[3px]" style={{ color: "var(--brand-primary)" }}>
                Campaign Brain
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                MCP Service Catalog
              </h1>
            </div>
          </div>
          <p className="text-base sm:text-lg max-w-[640px]" style={{ color: "var(--brand-muted)" }}>
            22 FastAPI microservices powering Campaign Brain — AI, data, communication,
            infrastructure, and business operations. All accessible via MCP for LLM agents.
          </p>
        </div>

        {/* Stats Bar */}
        {catalog && (
          <div
            className="grid grid-cols-3 gap-4 rounded-xl p-4 sm:p-6 mb-10 sm:mb-16"
            style={{
              background: "var(--brand-bg-alt)",
              border: "1px solid var(--brand-border)",
            }}
          >
            {[
              { val: catalog.stats.totalServices, label: "Services", color: "var(--brand-primary)" },
              { val: catalog.stats.totalEndpoints, label: "Endpoints", color: "var(--brand-secondary)" },
              { val: catalog.stats.totalCategories, label: "Categories", color: "var(--brand-warning)" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-4xl font-extrabold tabular-nums" style={{ color: s.color }}>
                  {s.val}
                </div>
                <div className="text-[10px] sm:text-xs font-medium uppercase tracking-widest mt-0.5" style={{ color: "var(--brand-muted)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Categories */}
        {!catalog ? (
          <div className="py-16 text-center" style={{ color: "var(--brand-muted)" }}>
            Loading catalog...
          </div>
        ) : (
          <div className="space-y-12 sm:space-y-16">
            {catalog.categories.map((cat) => {
              const style = categoryStyles[cat.id] || categoryStyles.infrastructure
              return (
                <section key={cat.id}>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{
                        background: `color-mix(in srgb, ${style.color} 12%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${style.color} 25%, transparent)`,
                        color: style.color,
                      }}
                    >
                      {style.icon}
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{cat.name}</h2>
                      <span className="text-[11px] font-mono" style={{ color: "var(--brand-muted)" }}>
                        {cat.services.length} services · {cat.services.reduce((sum, s) => sum + s.endpointCount, 0)} endpoints
                      </span>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.services.map((service) => (
                      <ServiceCard key={service.id} service={service} catColor={style.color} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* Footer note */}
        {catalog && (
          <div
            className="mt-12 sm:mt-16 rounded-xl p-5 sm:p-8 text-center"
            style={{
              background: "var(--brand-bg-alt)",
              border: "1px solid var(--brand-border)",
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Globe className="w-4 h-4" style={{ color: "var(--brand-primary)" }} />
              <span className="text-sm font-bold">All services hosted at *.nominate.ai</span>
            </div>
            <p className="text-[13px]" style={{ color: "var(--brand-muted)" }}>
              Catalog last updated {new Date(catalog.generated).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
