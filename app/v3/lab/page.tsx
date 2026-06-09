import Link from "next/link"
import { ArrowRight, FlaskConical } from "lucide-react"
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

      {/* FOOTNOTE ====================================================== */}
      <section className="v3-section v3-section--paper">
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
