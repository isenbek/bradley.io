import { Calendar, Code, Cpu, Database, Flame } from "lucide-react"
import { loadSiteDataStatic } from "@/lib/site-data"
import { V3Reveal } from "@/components/v3/V3Reveal"

export const revalidate = 3600

export default async function V3AboutPage() {
  const data = await loadSiteDataStatic()
  const { about, stats } = data

  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head">
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "-80px", top: "-40px" }} />
        <div className="v3-blob v3-blob--3" aria-hidden style={{ right: "120px", top: "180px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal eager>
              <span className="v3-eyebrow">About · the human behind it</span>
            </V3Reveal>
            <V3Reveal eager>
              <h1>
                Bradley S. <span className="v3-accent">Isenbek</span>
              </h1>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__lede">
                AI Systems Architect · Machine Learning Engineer · Frontier Technologist.
              </p>
            </V3Reveal>
            <V3Reveal eager>
              <p className="v3-page-head__loc">📍 Grand Rapids, MI · est. 2009 in the field</p>
            </V3Reveal>

            <p className="sr-only">
              Bradley Isenbek (also known as Brad Isenbek and Bradley S. Isenbek) is a frontier
              technologist, AI systems architect, and data engineer based in Grand Rapids, Michigan.
            </p>
          </div>
        </div>
      </header>

      {/* BIO + TIMELINE + SIDEBAR ====================================== */}
      <section className="v3-section" style={{ paddingTop: 16 }}>
        <div className="v3-wrap">
          <div className="v3-twocol">
            {/* MAIN COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <V3Reveal eager>
                <article className="v3-panel">
                  <div className="v3-panel-head">Bio</div>
                  <p className="v3-prose">{about.bio}</p>
                </article>
              </V3Reveal>

              <V3Reveal delay={80}>
                <article className="v3-panel">
                  <div className="v3-panel-head">Timeline</div>
                  <div className="v3-timeline">
                    {about.timeline.map((entry, i) => (
                      <div key={`${entry.year}-${i}`} className="v3-timeline__entry">
                        <div className="v3-timeline__rail">
                          <div className="v3-timeline__dot">
                            <Calendar size={14} strokeWidth={2.25} />
                          </div>
                        </div>
                        <div>
                          <div className="v3-timeline__year">{entry.year}</div>
                          <div className="v3-timeline__title">{entry.title}</div>
                          <div className="v3-timeline__desc">{entry.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </V3Reveal>
            </div>

            {/* SIDEBAR */}
            <aside className="v3-twocol__side">
              <V3Reveal>
                <div className="v3-panel">
                  <div className="v3-panel-head">By the numbers</div>
                  {[
                    { label: "Projects", value: stats.totalProjects, Icon: Code },
                    { label: "AI sessions", value: stats.totalSessions, Icon: Cpu },
                    {
                      label: "Messages",
                      value: stats.totalMessages.toLocaleString(),
                      Icon: Database,
                    },
                    { label: "Active days", value: stats.activeDays, Icon: Calendar },
                    { label: "Streak", value: stats.streak, Icon: Flame },
                  ].map(({ label, value, Icon }) => (
                    <div key={label} className="v3-stat-row">
                      <Icon className="v3-stat-row__icon" size={16} />
                      <span className="v3-stat-row__label">{label}</span>
                      <span className="v3-stat-row__value">{value}</span>
                    </div>
                  ))}
                </div>
              </V3Reveal>

              <V3Reveal delay={100}>
                <div className="v3-panel">
                  <div className="v3-panel-head">Skills</div>
                  <div className="v3-skills">
                    {about.skills.map((skill) => (
                      <span key={skill} className="v3-skill">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </V3Reveal>

              <V3Reveal delay={160}>
                <div
                  className="v3-panel"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--v3-blue-500), var(--v3-blue-700))",
                    color: "#fff",
                    borderColor: "transparent",
                  }}
                >
                  <div
                    className="v3-panel-head"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    Working together
                  </div>
                  <p
                    className="v3-font-display"
                    style={{
                      fontWeight: 700,
                      fontSize: 20,
                      lineHeight: 1.2,
                      letterSpacing: "-0.01em",
                      marginBottom: 14,
                    }}
                  >
                    Got a build that lives on the seam?
                  </p>
                  <a
                    href="/contact"
                    className="v3-btn"
                    style={{
                      background: "#fff",
                      color: "var(--v3-blue-700)",
                      fontWeight: 700,
                    }}
                  >
                    Book a call →
                  </a>
                </div>
              </V3Reveal>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
