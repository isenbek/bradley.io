import Link from "next/link"
import type { Metadata } from "next"
import { loadSiteDataStatic } from "@/lib/site-data"
import { BetaMeasured } from "./_measured"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Bradley Isenbek: edge hardware, data architecture, AI",
  description:
    "AI systems architect and data engineer in Grand Rapids, Michigan. Edge and IoT, production data pipelines, and AI in the parts of a system where it has to hold.",
}

/**
 * Beta home.
 *
 * Four sections where v3 had eight. The four that went were the ones fed by
 * /projects and /lab: a counted pile, a shipping log, an active-projects grid
 * and a currently-building list. All four answered "what has he been doing
 * lately", which is not the question someone arrives on a consultancy front page
 * with, and none of them survive those two routes leaving.
 *
 * On the structure: .prose wraps the text runs ONLY, and the kit components sit
 * outside it as siblings. That is not fussiness. .prose is serif at 68ch with
 * `> h2` child rules, and `.prose > ul` carries a padding-left that beats
 * .rail-list's own reset, so a component nested inside it comes out subtly wrong
 * in a way that is hard to see and easy to ship. Alternating prose blocks with
 * component blocks is also exactly what the page is: something a person wrote,
 * then something a machine measured, then back.
 */
export default async function BetaHome() {
  const data = await loadSiteDataStatic()
  const stats = data.stats

  return (
    <div className="page">
      <div className="hero">
        <p className="eyebrow">Edge hardware · data · AI</p>
        <p className="hero-title">
          Hardware hacker.
          <br />
          Data architect.
          <br />
          AI pilot.
        </p>
        <p className="lede">
          I build at the seam where enterprise scale meets maker culture: ESP32 mesh networks,
          Fortune 500 data warehouses, and the plumbing that keeps AI safe in production.
        </p>
        <div className="hero-ctas">
          <Link className="btn btn-primary" href="/beta/services">
            What I do
          </Link>
          <Link className="btn btn-ghost" href="/beta/contact">
            Start a conversation
          </Link>
        </div>
        <p className="quiet">
          Forest Hills, Michigan. On site across Grand Rapids and Kent County, remote everywhere
          else.
        </p>
      </div>

      <div className="prose beta-sec">
        <h2>Three threads, one practice</h2>
      </div>

      <div className="piece-grid">
        <div className="rail">
          <h3>Edge and hardware</h3>
          <p>
            ESP32 mesh, SDR scanner stacks, TRNG generators, Pi clusters. Production hardware on
            local power, with real signals and real latency budgets.
          </p>
        </div>
        <div className="rail">
          <h3>Data architecture</h3>
          <p>
            Pipelines, warehouses, telemetry. Fortune 500 scale without a cloud provider on the
            bill: systemd, Postgres, NATS, and a deploy script that fits on one screen.
          </p>
        </div>
        <div className="rail">
          <h3>AI piloting</h3>
          <p>
            Claude as co-pilot for work that ships, not demos. Workflow design, agent harnesses,
            and the unglamorous plumbing that makes them safe in prod.
          </p>
        </div>
      </div>

      {/* Panel, because every number below came out of a pipeline rather than
          off a slide. The measured chip underneath names the file that produced
          them and when it last ran. */}
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
              <tr>
                <td>Current streak</td>
                <td className="num">{stats.streak.toLocaleString()} d</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <BetaMeasured generated={data.generated} source="site-data.json" />

      <div className="prose beta-sec">
        <h2>The record</h2>
        <p>
          Four GitHub organisations, ten years of commits, and the AI sessions that produced a
          growing share of them. It is all counted rather than described.
        </p>
      </div>

      <ul className="rail-list">
        <li>
          <Link href="/beta/work">Work</Link>
          <span>the four orgs, commit history and language mix rolled up</span>
        </li>
        <li>
          <Link href="/beta/ai-pilot">AI pilot licence</Link>
          <span>sessions, models, and what the tooling is actually rated at</span>
        </li>
        <li>
          <Link href="/beta/cost-analysis">Cost analysis</Link>
          <span>what this way of working costs, modelled against the alternative</span>
        </li>
      </ul>
    </div>
  )
}
