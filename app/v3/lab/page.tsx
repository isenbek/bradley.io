import Link from "next/link"
import {
  ArrowRight,
  Atom,
  BarChart3,
  BookOpen,
  FlaskConical,
  GitBranch,
  Plane,
  Radio,
  Server,
  TerminalSquare,
  Zap,
} from "lucide-react"
import { loadSiteDataStatic } from "@/lib/site-data"
import type { CategoryId } from "@/lib/project-categories"
import { V3_CATEGORY } from "../projects/_categories"
import { V3Reveal } from "../_components/V3Reveal"

export const revalidate = 3600

export default async function V3LabPage() {
  const data = await loadSiteDataStatic()
  const research = data.projects
    .filter((p) => p.isResearch)
    .sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""))

  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head">
        <div className="v3-blob v3-blob--3" aria-hidden style={{ right: "-40px", top: "-20px", width: 360, height: 360 }} />
        <div className="v3-blob v3-blob--2" aria-hidden style={{ right: "260px", top: "200px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <span
                className="v3-pill v3-pill--gold"
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <FlaskConical size={14} strokeWidth={2.25} />
                Lab · frontier experiments
              </span>
            </V3Reveal>
            <V3Reveal delay={80}>
              <h1>
                Things that <span className="v3-accent">might not ship.</span>
              </h1>
            </V3Reveal>
            <V3Reveal delay={140}>
              <p className="v3-page-head__lede">
                Hardware hacks, signal toys, AI agents off the leash. The room where the next
                product gets sketched — and most of the sketches stay sketches.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* GRID =========================================================== */}
      <section className="v3-section" style={{ paddingTop: 16 }}>
        <div className="v3-wrap">
          {research.length === 0 ? (
            <div className="v3-empty">Nothing in the lab right now. Check back soon.</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 20,
              }}
            >
              {research.map((p, i) => {
                const cat = V3_CATEGORY[p.category as CategoryId] ?? V3_CATEGORY.systems
                return (
                  <V3Reveal key={p.slug} delay={i * 70}>
                    <Link
                      href={`/v3/projects/${p.slug}`}
                      className="v3-pcard"
                      style={{ ["--v3-pcard-color" as string]: "var(--v3-gold)" }}
                    >
                      <div className="v3-pcard__bar" aria-hidden />
                      <div className="v3-pcard__body" style={{ gap: 14, padding: "24px 26px" }}>
                        <div className="v3-pcard__row">
                          <span
                            className="v3-pcard__cat"
                            style={{ ["--v3-pcard-color" as string]: cat.color }}
                          >
                            {cat.label}
                          </span>
                          <span className={`v3-status v3-status--${p.status}`}>
                            <span className="v3-status__dot" aria-hidden />
                            {p.status}
                          </span>
                        </div>

                        <h3 className="v3-pcard__title" style={{ fontSize: 22 }}>
                          {p.name}
                        </h3>
                        <p className="v3-pcard__tagline" style={{ fontSize: 14.5 }}>
                          {p.tagline}
                        </p>
                        {p.description && p.description !== p.tagline ? (
                          <p
                            style={{
                              fontSize: 13.5,
                              color: "var(--v3-slate)",
                              lineHeight: 1.55,
                            }}
                          >
                            {p.description}
                          </p>
                        ) : null}

                        {p.technologies.length > 0 ? (
                          <div className="v3-pcard__tech">
                            {p.technologies.map((t) => (
                              <span key={t} className="v3-pcard__chip">
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="v3-pcard__foot">
                          <span className="v3-pcard__msgs">
                            {p.totalMessages.toLocaleString()} messages
                          </span>
                          <span
                            style={{
                              marginLeft: "auto",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontFamily: "var(--font-v3-mono), monospace",
                              fontSize: 11,
                              fontWeight: 600,
                              color: "var(--v3-gold-dk)",
                            }}
                          >
                            Open notes <ArrowRight size={12} strokeWidth={2.25} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </V3Reveal>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* LAB HUB ======================================================= */}
      <section className="v3-section v3-section--paper" style={{ paddingTop: 56 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head">
              <div className="v3-sec-head__num">02 / EVERYTHING IN THE LAB</div>
              <h2>The rest of the bench.</h2>
              <p>
                Live dashboards, hardware demos, catalogs, and the long-form mission
                timelines for the multi-year platforms. Each one is its own page —
                no aggregator, no marketing wrapper.
              </p>
            </div>
          </V3Reveal>

          {[
            {
              title: "Operational dashboards",
              accent: "var(--v3-blue-500)",
              items: [
                {
                  Icon: Plane,
                  title: "AI Pilot License",
                  blurb: "Live flight log — sessions, missions, models, tokens.",
                  href: "/v3/ai-pilot",
                  tag: "Flagship",
                  tagColor: "blue" as const,
                },
                {
                  Icon: Zap,
                  title: "The Shift",
                  blurb: "Thesis — how AI rewrites the economics of building.",
                  href: "/v3/the-shift",
                  tag: "Read",
                  tagColor: "coral" as const,
                },
                {
                  Icon: BarChart3,
                  title: "Cost Analysis",
                  blurb: "117 days, 1 operator vs the 9.5-person team it replaced.",
                  href: "/v3/cost-analysis",
                  tag: "Receipts",
                  tagColor: "green" as const,
                },
              ],
            },
            {
              title: "Hardware demos",
              accent: "var(--v3-coral)",
              items: [
                {
                  Icon: Plane,
                  title: "Dragonfli",
                  blurb: "1090 MHz ADS-B receiver — radar, registry, predictor.",
                  href: "/v3/dragonfli",
                  tag: "Live",
                  tagColor: "green" as const,
                },
                {
                  Icon: Radio,
                  title: "sdr-api",
                  blurb: "Software-defined radio scanner — bands, soaks, top freqs.",
                  href: "/v3/sdr",
                  tag: "Live",
                  tagColor: "green" as const,
                },
                {
                  Icon: Atom,
                  title: "HOTBITS TRNG",
                  blurb: "Random bits from radioactive decay — NIST-tested.",
                  href: "/v3/trng",
                  tag: "Live",
                  tagColor: "green" as const,
                },
                {
                  Icon: TerminalSquare,
                  title: "Terminal",
                  blurb: "Interactive CLI portfolio — type help and poke around.",
                  href: "/v3/terminal",
                  tag: "CLI",
                  tagColor: "blue" as const,
                },
              ],
            },
            {
              title: "Catalogs & writings",
              accent: "var(--v3-gold-dk)",
              items: [
                {
                  Icon: Server,
                  title: "MCP Catalog",
                  blurb: "Campaign Brain's 44 FastAPI services indexed for LLM agents.",
                  href: "/v3/mcp",
                  tag: "Beta",
                  tagColor: "gold" as const,
                },
                {
                  Icon: BookOpen,
                  title: "Papers",
                  blurb: "TerraPulse research — 72 studies across 7 domains, open data.",
                  href: "/v3/papers",
                  tag: "Research",
                  tagColor: "coral" as const,
                },
              ],
            },
            {
              title: "Mission timelines",
              accent: "var(--v3-green-dk)",
              items: [
                {
                  Icon: GitBranch,
                  title: "Nominate-AI",
                  blurb: "87 repos, 10k+ commits, AI-synthesized phase milestones.",
                  href: "/projects/nominate-ai",
                  tag: "v1 page",
                  tagColor: "blue" as const,
                  external: true,
                },
                {
                  Icon: GitBranch,
                  title: "Sysforge-AI",
                  blurb: "AI consulting & development firm — phase-based timeline.",
                  href: "/projects/sysforge-ai",
                  tag: "v1 page",
                  tagColor: "blue" as const,
                  external: true,
                },
                {
                  Icon: GitBranch,
                  title: "tinymachines",
                  blurb: "The lab umbrella — hardware, signals, agentic experiments.",
                  href: "/projects/tinymachines",
                  tag: "v1 page",
                  tagColor: "blue" as const,
                  external: true,
                },
                {
                  Icon: GitBranch,
                  title: "isenbek",
                  blurb: "Personal timeline — career arc across the platforms.",
                  href: "/projects/isenbek",
                  tag: "v1 page",
                  tagColor: "blue" as const,
                  external: true,
                },
              ],
            },
          ].map((group) => (
            <V3Reveal key={group.title}>
              <div style={{ marginTop: 36 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 2,
                      background: group.accent,
                      borderRadius: 2,
                    }}
                    aria-hidden
                  />
                  <h3
                    className="v3-font-display"
                    style={{
                      fontWeight: 700,
                      fontSize: 20,
                      letterSpacing: "-0.015em",
                      color: "var(--v3-charcoal)",
                    }}
                  >
                    {group.title}
                  </h3>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 14,
                  }}
                >
                  {group.items.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="v3-panel"
                      style={{
                        display: "block",
                        textDecoration: "none",
                        color: "inherit",
                        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "var(--v3-r-sm)",
                            background:
                              "color-mix(in srgb, " + group.accent + " 12%, transparent)",
                            color: group.accent,
                            border:
                              "1px solid color-mix(in srgb, " +
                              group.accent +
                              " 22%, transparent)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <item.Icon size={18} strokeWidth={2.25} />
                        </div>
                        <span className={"v3-pill v3-pill--" + item.tagColor}>
                          {item.tag}
                        </span>
                      </div>
                      <h4
                        className="v3-font-display"
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          letterSpacing: "-0.005em",
                          marginBottom: 6,
                          color: "var(--v3-charcoal)",
                        }}
                      >
                        {item.title}
                        {"external" in item && item.external ? (
                          <span
                            style={{
                              fontFamily: "var(--font-v3-mono), monospace",
                              fontSize: 11,
                              color: "var(--v3-slate)",
                              marginLeft: 6,
                            }}
                          >
                            ↗
                          </span>
                        ) : null}
                      </h4>
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--v3-ink)",
                          lineHeight: 1.5,
                        }}
                      >
                        {item.blurb}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </V3Reveal>
          ))}
        </div>
      </section>

      {/* FOOTNOTE ====================================================== */}
      <section className="v3-section" style={{ paddingTop: 56 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div
              className="v3-panel"
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 20,
                alignItems: "center",
                padding: "28px 32px",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--v3-gold), var(--v3-gold-dk))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <FlaskConical size={26} strokeWidth={2.25} />
              </div>
              <div>
                <div
                  className="v3-font-display"
                  style={{ fontWeight: 700, fontSize: 19, marginBottom: 4 }}
                >
                  Lab notes welcome.
                </div>
                <p style={{ fontSize: 14.5, color: "var(--v3-ink)" }}>
                  Got a wild experiment, a signal you can't explain, or a thing you want
                  built — bring it. Half the lab is conversations that started this way.
                </p>
              </div>
              <Link href="/v3/contact" className="v3-btn v3-btn--coral">
                Get in touch →
              </Link>
            </div>
          </V3Reveal>
        </div>
      </section>
    </>
  )
}
