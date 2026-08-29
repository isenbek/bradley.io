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
    "The Model Context Protocol servers running here, with their live tool lists, and the Campaign Brain REST fleet behind them.",
}

interface McpServer {
  id: string
  name: string
  url: string
  transport: string
  auth: string
  what: string
  reachable: boolean
  note?: string
  tools: { name: string; description: string }[]
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
  sources: { unifiedSpec: string; metadata: string }
  stats: {
    totalServices: number
    totalEndpoints: number
    totalCategories: number
    mcpServers: number
    mcpServersReachable: number
    fleetServices: number
    fleetEndpoints: number
    uncataloguedServices: number
  }
  mcpServers: McpServer[]
  categories: { id: string; name: string; services: Service[] }[]
  uncatalogued: { id: string; endpointCount: number }[]
}

const clean = (s: string) => s.replace(/\s*—\s*/g, ": ")

export default function BetaMcpPage() {
  const d = JSON.parse(
    readFileSync(join(process.cwd(), "public/data/mcp-catalog.json"), "utf-8")
  ) as McpData
  const st = d.stats

  const byCategory = d.categories
    .map((c) => ({
      label: c.name,
      value: c.services.reduce((s, x) => s + x.endpointCount, 0),
      display: `${c.services.length} svc`,
    }))
    .sort((a, b) => b.value - a.value)

  // Answered, but would not enumerate: an auth gate rather than an outage.
  // Counted rather than written into the copy, so the sentence cannot go stale
  // the first time a server gains or drops a credential requirement.
  const gated = d.mcpServers.filter((s) => s.reachable && s.tools.length === 0).length

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
        {st.mcpServers} Model Context Protocol servers, and the {st.fleetServices}-service REST
        fleet behind them.
      </p>

      <div className="prose beta-sec">
        <h2>The MCP servers</h2>
        <p>
          Each was asked for its tool list when this page was built, so what is below is what the
          server answered with, not what a README claims.
          {gated > 0
            ? ` ${gated} of the ${st.mcpServers} require a credential and answered by refusing, which is the
               correct behaviour and is recorded as such rather than as an outage.`
            : ""}
        </p>
      </div>

      <div className="beta-orggrid">
        {d.mcpServers.map((s) => (
          <div className="panel" key={s.id}>
            <div className="panel-face">
              <div className="panel-bar">
                <b>{s.name}</b>
                <span>
                  {s.transport} · {s.auth}
                </span>
              </div>

              <p className="beta-org__what">{s.what}</p>

              <table className="readout">
                <tbody>
                  <tr>
                    <td>Endpoint</td>
                    <td className="num beta-url">{s.url.replace(/^https:\/\//, "")}</td>
                  </tr>
                  <tr>
                    <td>Answered</td>
                    <td className="num">{s.reachable ? "yes" : "no"}</td>
                  </tr>
                  <tr>
                    <td>Tools listed</td>
                    <td className="num">{s.tools.length || "not enumerated"}</td>
                  </tr>
                </tbody>
              </table>

              {s.tools.length > 0 ? (
                <div className="beta-tools">
                  {s.tools.map((t) => (
                    <div className="beta-tool" key={t.name}>
                      <b>{t.name}</b>
                      <span>{clean(t.description)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="beta-chart__note">{s.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="prose beta-sec">
        <h2>The REST fleet</h2>
        <p>
          {st.fleetServices} services exposing {st.fleetEndpoints.toLocaleString()} operations,
          counted from the unified OpenAPI spec. {st.totalServices} of them carry descriptions and
          are grouped below.
        </p>
      </div>

      {st.uncataloguedServices > 0 && (
        <div className="notice">
          <b>{st.uncataloguedServices} services are not described here.</b> They exist in the spec
          and their endpoints are counted in the fleet total, but the catalog has no name or
          description for them yet, so they are not in the groups below. The grouped figures
          therefore cover {st.totalEndpoints.toLocaleString()} of{" "}
          {st.fleetEndpoints.toLocaleString()} operations.
        </div>
      )}

      <RampKey low="fewer endpoints" high="more" />

      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>By group</b>
            <span>endpoints</span>
          </div>
          <RowChart caption="Operations per group" data={byCategory} />
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
                    <th className="num">Ops</th>
                    <th>Auth</th>
                  </tr>
                </thead>
                <tbody>
                  {c.services.map((s) => (
                    <tr key={s.id}>
                      <td className="name">{s.name}</td>
                      <td>{clean(s.description)}</td>
                      <td className="num">{s.endpointCount || "-"}</td>
                      <td>{s.auth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="tbl-foot">
                <span>{c.services.length} services</span>
              </div>
            </div>
          </div>
        </section>
      ))}

      <BetaMeasured generated={d.generated} source="mcp-catalog.json" />
      <p className="quiet">
        Service list and endpoint counts from{" "}
        <a href={d.sources.unifiedSpec} target="_blank" rel="noopener noreferrer">
          the unified OpenAPI spec
        </a>
        . Tool lists probed live at build time.
      </p>
    </div>
  )
}
