import { readFileSync } from "fs"
import { join } from "path"
import Link from "next/link"
import type { Metadata } from "next"
import { RowChart, RampKey } from "../_charts"
import { BetaMeasured } from "../_measured"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "MCP catalog",
  description:
    "The Model Context Protocol service catalog: 44 services and 275 endpoints, grouped by what they do.",
}

interface Service {
  id: string
  name: string
  url: string
  description: string
  auth: string
  capabilities: string[]
  endpointCount: number
}

interface McpData {
  generated: string
  stats: { totalServices: number; totalEndpoints: number; totalCategories: number }
  categories: { id: string; name: string; services: Service[] }[]
}

const clean = (s: string) => s.replace(/\s*—\s*/g, ": ")

export default function BetaMcpPage() {
  const d = JSON.parse(
    readFileSync(join(process.cwd(), "public/data/mcp-catalog.json"), "utf-8")
  ) as McpData

  const byCategory = d.categories
    .map((c) => ({
      label: c.name,
      value: c.services.reduce((s, x) => s + (x.endpointCount ?? 0), 0),
      display: `${c.services.length} svc`,
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/beta">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">MCP catalog</span>
          </span>
        </nav>
        <h1>MCP catalog</h1>
      </div>

      <p className="lede">
        {d.stats.totalServices} services exposing {d.stats.totalEndpoints} endpoints over the Model
        Context Protocol, in {d.stats.totalCategories} groups.
      </p>

      <RampKey low="fewer endpoints" high="more" />

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>By group</b>
            <span>endpoints</span>
          </div>
          <RowChart caption="Endpoints per group" data={byCategory} />
        </div>
      </div>

      {d.categories.map((c) => (
        <section key={c.id}>
          <div className="prose beta-sec">
            <h2>{c.name}</h2>
          </div>
          <div className="ledger">
            <div className="scroller" tabIndex={0} role="region" aria-label={c.name}>
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>What it does</th>
                    <th className="num">Endpoints</th>
                    <th>Auth</th>
                  </tr>
                </thead>
                <tbody>
                  {c.services.map((s) => (
                    <tr key={s.id}>
                      <td className="name">{s.name}</td>
                      <td>{clean(s.description)}</td>
                      <td className="num">{s.endpointCount}</td>
                      <td>{s.auth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ))}

      <BetaMeasured generated={d.generated} source="mcp-catalog.json" />
    </div>
  )
}
