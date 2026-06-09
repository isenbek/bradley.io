import { readFileSync } from "fs"
import { join } from "path"
import {
  ArrowUpRight,
  Briefcase,
  Cpu,
  Database,
  Globe,
  Hash,
  Lock,
  MessageSquare,
  Server,
  Shield,
} from "lucide-react"
import { timeAgo } from "@/lib/time-ago"
import { V3Reveal } from "../_components/V3Reveal"

export const revalidate = 3600

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

type CatId = "ai" | "data" | "communication" | "infrastructure" | "business"

const CAT_STYLE: Record<
  CatId,
  { color: string; Icon: typeof Cpu }
> = {
  ai:             { color: "#EE766C", Icon: Cpu },           // coral
  data:           { color: "#13B8F3", Icon: Database },      // bio blue
  communication:  { color: "#169E73", Icon: MessageSquare }, // green
  infrastructure: { color: "#EDB427", Icon: Shield },        // gold
  business:       { color: "#A855F7", Icon: Briefcase },     // violet
}

function loadCatalog(): McpCatalog | null {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "public/data/mcp-catalog.json"), "utf-8")
    )
  } catch {
    return null
  }
}

export default function V3McpPage() {
  const catalog = loadCatalog()

  if (!catalog) {
    return (
      <section className="v3-section">
        <div className="v3-wrap">
          <div className="v3-empty">Catalog unavailable. Try again shortly.</div>
        </div>
      </section>
    )
  }

  const { stats, categories } = catalog

  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head">
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "-80px", top: "-40px" }} />
        <div className="v3-blob v3-blob--3" aria-hidden style={{ right: "160px", top: "220px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <span
                className="v3-pill v3-pill--blue"
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <Server size={14} strokeWidth={2.25} />
                Campaign Brain · MCP catalog
              </span>
            </V3Reveal>
            <V3Reveal delay={80}>
              <h1>
                Services, <span className="v3-accent">indexed.</span>
              </h1>
            </V3Reveal>
            <V3Reveal delay={140}>
              <p className="v3-page-head__lede">
                {stats.totalServices} FastAPI microservices powering Campaign Brain — AI, data,
                communication, infrastructure, and business operations. All open via MCP to LLM
                agents.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* STAT BAR ======================================================= */}
      <section style={{ padding: "0 0 24px" }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-statbar">
              <div
                className="v3-statbar__cell"
                style={{ ["--v3-statbar-color" as string]: "var(--v3-blue-600)" }}
              >
                <div className="v3-statbar__val">{stats.totalServices}</div>
                <div className="v3-statbar__lbl">Services</div>
              </div>
              <div
                className="v3-statbar__cell"
                style={{ ["--v3-statbar-color" as string]: "var(--v3-coral-dk)" }}
              >
                <div className="v3-statbar__val">{stats.totalEndpoints}</div>
                <div className="v3-statbar__lbl">Endpoints</div>
              </div>
              <div
                className="v3-statbar__cell"
                style={{ ["--v3-statbar-color" as string]: "var(--v3-gold-dk)" }}
              >
                <div className="v3-statbar__val">{stats.totalCategories}</div>
                <div className="v3-statbar__lbl">Categories</div>
              </div>
            </div>
          </V3Reveal>
        </div>
      </section>

      {/* CATEGORIES ===================================================== */}
      <section className="v3-section" style={{ paddingTop: 24 }}>
        <div className="v3-wrap">
          <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
            {categories.map((cat) => {
              const style = CAT_STYLE[cat.id as CatId] ?? {
                color: "var(--v3-blue-500)",
                Icon: Server,
              }
              const endpointSum = cat.services.reduce((s, x) => s + x.endpointCount, 0)
              return (
                <section key={cat.id}>
                  <V3Reveal>
                    <div
                      className="v3-cathead"
                      style={{ ["--v3-cat-color" as string]: style.color }}
                    >
                      <div className="v3-cathead__ico">
                        <style.Icon size={22} strokeWidth={2.25} />
                      </div>
                      <div>
                        <div className="v3-cathead__name">{cat.name}</div>
                        <div className="v3-cathead__meta">
                          {cat.services.length} services · {endpointSum} endpoints
                        </div>
                      </div>
                    </div>
                  </V3Reveal>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {cat.services.map((svc, i) => (
                      <V3Reveal key={svc.id} delay={i * 35}>
                        <article
                          className="v3-svc"
                          style={{ ["--v3-svc-color" as string]: style.color }}
                        >
                          <div className="v3-svc__bar" aria-hidden />
                          <div className="v3-svc__body">
                            <div className="v3-svc__head">
                              <span className="v3-svc__id">{svc.id}</span>
                              <span className="v3-svc__count">
                                <Hash size={11} strokeWidth={2.5} />
                                {svc.endpointCount}
                              </span>
                            </div>
                            <h3 className="v3-svc__name">{svc.name}</h3>
                            <p className="v3-svc__desc">{svc.description}</p>
                            {svc.capabilities.length > 0 ? (
                              <div className="v3-svc__caps">
                                {svc.capabilities.map((c) => (
                                  <span key={c} className="v3-svc__cap">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                            <div className="v3-svc__auth">
                              <Lock size={11} strokeWidth={2.5} />
                              <span>{svc.auth}</span>
                              {svc.url ? (
                                <a
                                  href={svc.url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="v3-svc__url"
                                >
                                  open <ArrowUpRight size={11} strokeWidth={2.5} />
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      </V3Reveal>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </section>

      {/* FOOTER NOTE =================================================== */}
      <section className="v3-section v3-section--paper" style={{ paddingTop: 56 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div
              className="v3-panel"
              style={{
                textAlign: "center",
                padding: "32px 28px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                  color: "var(--v3-blue-700)",
                }}
              >
                <Globe size={16} strokeWidth={2.25} />
                <span
                  className="v3-font-display"
                  style={{ fontWeight: 700, fontSize: 16 }}
                >
                  All services hosted at <code style={{ fontFamily: "var(--font-v3-mono), monospace", fontSize: 14 }}>*.campaignbrain.dev</code>
                </span>
              </div>
              <div
                className="v3-font-mono"
                style={{ fontSize: 11, color: "var(--v3-slate)", letterSpacing: "0.06em" }}
              >
                catalog updated {timeAgo(catalog.generated)}
              </div>
            </div>
          </V3Reveal>
        </div>
      </section>
    </>
  )
}
