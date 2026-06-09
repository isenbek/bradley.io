import { readFileSync } from "fs"
import { join } from "path"
import { FlaskConical } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { V3PapersFilter, type Study } from "./V3PapersFilter"

export const revalidate = 3600

interface PapersData {
  generated: string
  totalStudies: number
  totalReferences: number
  categories: Record<string, number>
  studies: Study[]
}

function loadPapers(): PapersData | null {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "public/data/papers-data.json"), "utf-8")
    )
  } catch {
    return null
  }
}

export default function V3PapersPage() {
  const data = loadPapers()

  if (!data) {
    return (
      <section className="v3-section">
        <div className="v3-wrap">
          <div className="v3-empty">Papers index unavailable. Try again shortly.</div>
        </div>
      </section>
    )
  }

  const domainCount = Object.keys(data.categories).length

  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head">
        <div className="v3-blob v3-blob--2" aria-hidden style={{ right: "-40px", top: "0px" }} />
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "240px", top: "200px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <span
                className="v3-pill v3-pill--coral"
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <FlaskConical size={14} strokeWidth={2.25} />
                TerraPulse · research papers
              </span>
            </V3Reveal>
            <V3Reveal delay={80}>
              <h1>
                Open data, <span className="v3-accent">open notes.</span>
              </h1>
            </V3Reveal>
            <V3Reveal delay={140}>
              <p className="v3-page-head__lede">
                Active research in environmental data science — seismology, space weather,
                climate, hydrology, and the cross-domain bits where everything starts to look
                the same. All studies built on open government data.
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
              <div className="v3-statbar__cell" style={{ ["--v3-statbar-color" as string]: "var(--v3-coral-dk)" }}>
                <div className="v3-statbar__val">{data.totalStudies}</div>
                <div className="v3-statbar__lbl">Studies</div>
              </div>
              <div className="v3-statbar__cell" style={{ ["--v3-statbar-color" as string]: "var(--v3-blue-600)" }}>
                <div className="v3-statbar__val">{data.totalReferences}</div>
                <div className="v3-statbar__lbl">References</div>
              </div>
              <div className="v3-statbar__cell" style={{ ["--v3-statbar-color" as string]: "var(--v3-gold-dk)" }}>
                <div className="v3-statbar__val">{domainCount}</div>
                <div className="v3-statbar__lbl">Domains</div>
              </div>
            </div>
          </V3Reveal>
        </div>
      </section>

      {/* FILTER + GRID ================================================== */}
      <section className="v3-section" style={{ paddingTop: 16 }}>
        <div className="v3-wrap">
          <V3PapersFilter studies={data.studies} categories={data.categories} />
        </div>
      </section>
    </>
  )
}
