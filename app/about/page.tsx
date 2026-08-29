import Link from "next/link"
import type { Metadata } from "next"
import { loadSiteDataStatic } from "@/lib/site-data"
import { BetaMeasured } from "../_measured"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "About",
  description:
    "Bradley Isenbek: AI systems architect and data engineer in Grand Rapids, Michigan. Fifteen years of secure, large-scale data systems for government and enterprise.",
}

export default async function BetaAboutPage() {
  const data = await loadSiteDataStatic()
  const { about, stats } = data

  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">About</span>
          </span>
        </nav>
        <h1>Bradley S. Isenbek</h1>
      </div>

      <p className="lede">
        AI systems architect, machine learning engineer, frontier technologist. Grand Rapids,
        Michigan, in the field since 2009.
      </p>

      <div className="prose beta-sec">
        <p>{about.bio}</p>

        <h2>Where the time went</h2>
      </div>

      {/* The kit's ledger, which is a table with a scroller and a foot. Four
          roles, most recent first, with the year span in its own column so it
          stays scannable rather than buried in a sentence. */}
      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="Career timeline">
          <table>
            <thead>
              <tr>
                <th>Years</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {about.timeline.map((entry, i) => (
                <tr key={`${entry.year}-${i}`}>
                  <td className="name">{entry.year}</td>
                  <td>
                    <b>{entry.title.replace(/\s*—\s*/, ": ")}</b>
                    <br />
                    {entry.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>By the numbers</h2>
      </div>

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Site index</b>
            <span>regenerated each deploy</span>
          </div>
          <table className="readout">
            <tbody>
              <tr>
                <td>Repositories indexed</td>
                <td className="num">{stats.totalProjects.toLocaleString()}</td>
              </tr>
              <tr>
                <td>AI sessions</td>
                <td className="num">{stats.totalSessions.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Messages exchanged</td>
                <td className="num">{stats.totalMessages.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Active days</td>
                <td className="num">{stats.activeDays.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <BetaMeasured generated={data.generated} source="site-data.json" />

      <p className="quiet">
        <Link href="/work">The commit-level record</Link> is on the work page.{" "}
        <Link href="/contact">Get in touch</Link> if any of it is relevant to what you are
        building.
      </p>
    </div>
  )
}
