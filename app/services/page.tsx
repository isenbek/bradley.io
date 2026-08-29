import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Services",
  description:
    "Distributed systems, data engineering, APIs, edge and IoT, and AI integration. Project, hourly or retainer, for teams in Grand Rapids and remote.",
}

/**
 * Services, cut down.
 *
 * v3 carried five practices with a paragraph, four skill tags and three worked
 * examples each, then four process steps whose descriptions restated their own
 * titles, then four differentiators. Most of it was the same claim in different
 * words. What survives is what a client cannot get from anywhere else on the
 * page: the practice names, the tags, one real example each, and the prices.
 *
 * The prices stay verbatim and stay high on the page. Someone reading a
 * consultancy site is trying to find out whether they can afford it, and making
 * them ask is a way of wasting both people's time.
 */

const PRACTICES = [
  {
    title: "Distributed systems",
    what: "Systems that move billions of records with high availability and fault tolerance.",
    tags: ["Distributed databases", "Message queues", "Load balancing", "Fault tolerance"],
    example: "Search infrastructure at Fortune 500 scale",
  },
  {
    title: "Data engineering",
    what: "Pipelines that ingest, transform and serve, real time and batch, without a cloud bill.",
    tags: ["ETL", "Warehousing", "Stream processing", "Analytics"],
    example: "4.9 billion data points integrated for model training",
  },
  {
    title: "API design",
    what: "REST and WebSocket APIs with auth, rate limiting and monitoring from the first commit.",
    tags: ["FastAPI", "REST", "WebSocket", "GraphQL"],
    example: "85-endpoint API orchestration across multiple carriers",
  },
  {
    title: "Edge and IoT",
    what: "AI and data on constrained devices: custom protocols, mesh radios, salvaged hardware.",
    tags: ["Raspberry Pi", "Custom protocols", "Mesh networks", "Low power"],
    example: "60-node Pi cluster running custom 802.11",
  },
  {
    title: "AI integration",
    what: "Production ML: sub-100ms inference, multi-provider orchestration, the plumbing that keeps it safe.",
    tags: ["LLM integration", "Model deployment", "Vector search", "ML pipelines"],
    example: "Multi-provider AI orchestration in production",
  },
]

const ENGAGEMENTS = [
  {
    type: "Project",
    range: "$25K to $100K",
    ideal: "Fixed scope, defined deliverables, clear requirements",
  },
  {
    type: "Hourly",
    range: "$150 to $275/hr",
    ideal: "Technical guidance and architecture review",
  },
  {
    type: "Retainer",
    range: "$15K to $50K/mo",
    ideal: "Ongoing partnership and continuous improvement",
  },
]

const FAQ = [
  {
    q: "Do you provide AI and data-engineering consulting in Grand Rapids?",
    a: "Yes. I am based in Forest Hills, Michigan and work with teams across Grand Rapids and Kent County, on site or remote, on AI integration, data pipelines and production systems at scale.",
  },
  {
    q: "What is edge computing, and can you build it for a West Michigan business?",
    a: "Edge computing runs data processing on local hardware instead of a distant cloud, which cuts latency and cloud bills. I design and build edge and IoT systems for businesses in Grand Rapids, Ada, Cascade and the wider Kent County area.",
  },
  {
    q: "Do you work on site in the Grand Rapids area?",
    a: "Yes. I can work on site across Kent County when it helps, and remotely for everything else.",
  },
]

export default function BetaServicesPage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Services</span>
          </span>
        </nav>
        <h1>Services</h1>
      </div>

      <p className="lede">
        Five practices, one practitioner. From low-level protocols to ML pipelines, with one head
        and one line of accountability.
      </p>

      <div className="piece-grid">
        {PRACTICES.map((p) => (
          <div className="rail" key={p.title}>
            <h3>{p.title}</h3>
            <p>{p.what}</p>
            <p className="chips">
              {p.tags.map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </p>
            <p className="quiet">{p.example}</p>
          </div>
        ))}
      </div>

      <div className="prose beta-sec">
        <h2>Three shapes, and what they cost</h2>
      </div>

      <div className="ledger">
        <div className="scroller" tabIndex={0} role="region" aria-label="Engagement types">
          <table>
            <thead>
              <tr>
                <th>Shape</th>
                <th>Range</th>
                <th>Fits</th>
              </tr>
            </thead>
            <tbody>
              {ENGAGEMENTS.map((e) => (
                <tr key={e.type}>
                  <td className="name">{e.type}</td>
                  <td>{e.range}</td>
                  <td>{e.ideal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2>How it goes</h2>
        <p>
          Discovery, then design, then build, then handover with the documentation written. No
          step is a surprise and none of them is theatre.
        </p>

        <h2>Questions I get</h2>
      </div>

      {/* An accordion rather than three paragraphs. These answer real search
          queries and have to stay on the page for that, but a visitor who came
          for the prices should not have to scroll past them. */}
      <div className="beta-faq">
        {FAQ.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>

      <p className="hero-ctas">
        <Link className="btn btn-primary" href="/contact">
          Start a conversation
        </Link>
      </p>
    </div>
  )
}
