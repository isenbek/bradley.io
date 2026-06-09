import { loadSiteDataStatic } from "@/lib/site-data"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { V3ProjectGrid } from "./V3ProjectGrid"

export const revalidate = 3600

export default async function V3ProjectsPage() {
  const data = await loadSiteDataStatic()
  const projects = [...data.projects].sort((a, b) => {
    // featured first, then by lastActivity desc
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1
    return (b.lastActivity ?? "").localeCompare(a.lastActivity ?? "")
  })

  const stats = data.stats

  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head">
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "-80px", top: "-40px" }} />
        <div className="v3-blob v3-blob--2" aria-hidden style={{ right: "200px", top: "200px" }} />
        <div className="v3-blob v3-blob--3" aria-hidden style={{ right: "60px", top: "300px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <span className="v3-eyebrow">Projects · what's on the bench</span>
            </V3Reveal>
            <V3Reveal delay={80}>
              <h1>
                {stats.totalProjects}+ things <span className="v3-accent">on the bench.</span>
              </h1>
            </V3Reveal>
            <V3Reveal delay={140}>
              <p className="v3-page-head__lede">
                Hardware, AI, data pipelines, distributed systems, frontier research — most shipped
                with Claude as co-pilot, all self-hosted.
              </p>
            </V3Reveal>

            <V3Reveal delay={200}>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  marginTop: 28,
                  flexWrap: "wrap",
                }}
              >
                <span className="v3-pill v3-pill--blue">
                  {stats.totalSessions} AI sessions
                </span>
                <span className="v3-pill v3-pill--green">
                  {stats.totalMessages.toLocaleString()} messages
                </span>
                <span className="v3-pill v3-pill--gold">{stats.activeDays} active days</span>
              </div>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* GRID =========================================================== */}
      <section className="v3-section" style={{ paddingTop: 16 }}>
        <div className="v3-wrap">
          <V3ProjectGrid projects={projects} />
        </div>
      </section>
    </>
  )
}
