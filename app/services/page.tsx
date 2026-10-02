import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { LiveDot } from "@/components/live/LiveDot"
import { NowPanel } from "@/components/live/NowPanel"
import { peekNow } from "@/components/live/now-snapshot"
import type { NowId, NowSnapshot } from "@/components/live/types"
import { GOVERNMENT, ROLES } from "@/lib/resume"

// Rendered per request, as the home page is and for the same reason: the panel
// under the practices opens on the server's snapshot of four instruments, and
// from a cached page every visit would open on old readings and then correct
// itself. peekNow() never waits on the network, so a render is a few file
// reads on this host.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Services",
  description:
    "Distributed systems, data engineering, APIs, edge and IoT, and AI integration. Project, hourly or retainer, for teams in Grand Rapids and remote.",
}

/**
 * Services, with the evidence put back.
 *
 * The port to the kit cut this page to a name, four tags and one example per
 * practice, a single sentence of process and no differentiators. Two of the
 * surviving examples had also been welded together out of separate ones ("85
 * endpoints" onto "multi-carrier", "60-node cluster" onto "custom 802.11"),
 * which made each of them say something the original never did.
 *
 * What is here now, and where each part comes from:
 *
 *   Worked examples   the owner's own three per practice, verbatim from the
 *                     original page (git 63d43d0:app/services/page.tsx).
 *   Proof             two things per practice that a visitor can open today:
 *                     an instrument on this site, or a live site. Each is its
 *                     own link card. The practice row around them is not a
 *                     link: a row with two destinations has no business
 *                     sending a stray tap to either.
 *   Dots              four of those proofs report live. A LiveDot beside each
 *                     says so in one mark, with a one-line key under the
 *                     practices. The cards are named as the panel names its
 *                     rows ("Claude Code", "Perception bus") so the two match.
 *   Shapes            the prices, unchanged, with the "Best for" line each one
 *                     had on the previous site (git 4618109).
 *   Process           the four steps as a ledger, with the sentence that
 *                     mattered: discovery is unbillable.
 *   Differentiators   four. The two that make a claim about the record are not
 *                     typed here: they are read out of lib/resume.ts, so they
 *                     cannot say more than the resume does.
 *   The panel         after the differentiators, a NowPanel prints what the
 *                     four live proofs are doing right now. It is the only
 *                     machine output on the page, and the only thing on a
 *                     panel. It sits below the prices on purpose.
 *   Questions         three, in the owner's wording. The FAQPage structured
 *                     data is built from the same array on this page, so what
 *                     a search engine is told and what a visitor reads cannot
 *                     drift apart (they had: the layout held a second copy,
 *                     with the visible answers reworded from it).
 *
 * The prices stay verbatim and stay high on the page. Someone reading a
 * consultancy site is trying to find out whether they can afford it, and making
 * them ask is a way of wasting both people's time.
 */

interface Proof {
  href: string
  name: string
  line: string
  /** Leaves this site. */
  external?: boolean
  /** The instrument whose state the dot reports. Omitted for a page with no hardware behind it. */
  dot?: NowId
}

interface Practice {
  title: string
  what: string
  tags: string[]
  examples: string[]
  proof: Proof[]
}

const PRACTICES: Practice[] = [
  {
    title: "Distributed systems",
    what: "Systems that move billions of records with high availability and fault tolerance.",
    tags: ["Distributed databases", "Message queues", "Load balancing", "Fault tolerance"],
    examples: [
      "Search infrastructure at TransUnion scale",
      "High-volume messaging platforms",
      "Multi-region data replication",
    ],
    proof: [
      {
        href: "/dragonfli/worldevent",
        name: "Perception bus",
        line: "A schema-tagged UDP firehose from every sensor on the network, decoded as it arrives.",
        dot: "bus",
      },
      {
        href: "/visitors",
        name: "Knock knock",
        line: "Router drops, scanner traps and access logs from every site this host serves, fused into one view.",
        dot: "firewall",
      },
    ],
  },
  {
    title: "Data engineering",
    what: "Pipelines that ingest, transform and serve, real time and batch, without a cloud bill.",
    tags: ["ETL", "Warehousing", "Stream processing", "Analytics"],
    examples: [
      "4.9B data point integration",
      "Snowflake data architectures",
      "Real-time reporting backends",
    ],
    proof: [
      {
        href: "https://terrapulse.info/",
        name: "TerraPulse",
        line: "A measured-data platform for climate and geophysical data. I am its architect.",
        external: true,
      },
      {
        href: "/papers",
        name: "Papers",
        line: "Research notes across seismology, space weather, climate and hydrology, written on that data.",
      },
    ],
  },
  {
    title: "API design",
    what: "REST and WebSocket APIs with auth, rate limiting and monitoring from the first commit.",
    tags: ["FastAPI", "REST", "WebSocket", "GraphQL"],
    examples: [
      "85-endpoint API orchestration",
      "Multi-carrier messaging integrations",
      "Real-time event streaming",
    ],
    proof: [
      {
        href: "https://terrapulse.info/mcp",
        name: "TerraPulse\u2019s MCP server",
        line: "Public and read-only: an AI agent can query the measured data directly, with no key.",
        external: true,
      },
      {
        href: "https://tinymachines.ai/6502/api",
        name: "The 6502 API",
        line: "A transistor-level 6502 over HTTP, one half-cycle at a time. Stateless: the whole machine travels in each request, and an MCP endpoint sits beside it.",
        external: true,
      },
    ],
  },
  {
    title: "Edge and IoT",
    what: "AI and data on constrained devices: custom protocols, mesh radios, salvaged hardware.",
    tags: ["Raspberry Pi", "Custom protocols", "Mesh networks", "Low power"],
    examples: ["60-node Pi cluster", "Custom 802.11 protocols", "LoRa mesh deployments"],
    proof: [
      {
        href: "/trng",
        name: "Hotbits",
        line: "Random numbers from radioactive decay: a Geiger counter and a Raspberry Pi.",
        dot: "geiger",
      },
      {
        href: "/dragonfli",
        name: "Dragonfli",
        line: "A Raspberry Pi and a 1090 MHz ADS-B receiver in the garage. Every aircraft listed is one this antenna heard directly.",
      },
    ],
  },
  {
    title: "AI integration",
    what: "Production ML: sub-100ms inference, multi-provider orchestration, the plumbing that keeps it safe.",
    tags: ["LLM integration", "Model deployment", "Vector search", "ML pipelines"],
    examples: [
      "Multi-provider AI orchestration",
      "Sub-100ms inference pipelines",
      "Self-improving systems",
    ],
    proof: [
      {
        href: "/ai-pilot",
        name: "Claude Code on this host",
        line: "The AI pilot record: every working session with a frontier model and the models used, computed from the session logs.",
        dot: "activity",
      },
      {
        href: "https://tinychase.com/",
        name: "tinychase",
        line: "Small models on measured public data, running in your browser. I engineered it.",
        external: true,
      },
    ],
  },
]

const ENGAGEMENTS = [
  {
    type: "Project",
    what: "Fixed scope, defined deliverables",
    range: "$25K to $100K",
    ideal: "Specific initiatives with clear requirements",
  },
  {
    type: "Hourly",
    what: "Flexible, as-needed expertise",
    range: "$150 to $275/hr",
    ideal: "Technical guidance and architecture review",
  },
  {
    type: "Retainer",
    what: "Dedicated monthly support",
    range: "$15K to $50K/mo",
    ideal: "Ongoing partnership and continuous improvement",
  },
]

/** `note` is a fact about the step that the intro states in words; it is printed as a tag on the row. */
const STEPS: { title: string; what: string; note?: string }[] = [
  {
    title: "Discovery",
    what: "Understand the problem deeply before proposing solutions.",
    note: "Unbillable",
  },
  { title: "Design", what: "Architecture that balances elegance with practicality." },
  { title: "Build", what: "Iterative development with continuous feedback." },
  { title: "Deliver", what: "Documentation, handoff, and knowledge transfer." },
]

/**
 * The two claims about the record, read from the resume instead of retyped.
 *
 * The previous site titled the second one "Security cleared" and said "led
 * classified government projects". The resume says less, and the resume is the
 * document the owner signed off: one classified project, as lead developer, at
 * one employer, in a stated period, and work in secure environments. It does
 * not say he holds a clearance today, so neither does this page. The card
 * takes the resume's own section title and its first two lines. If a line is
 * reworded in lib/resume.ts the card follows it; if the lines are removed, the
 * card is not rendered at all.
 */
const TRANSUNION = ROLES.find((r) => r.company.startsWith("TransUnion"))
const SCALE_LINE = TRANSUNION?.bullets.find((b) => b.includes("billions of records"))
const GOVERNMENT_LINES = [
  GOVERNMENT.find((g) => g.includes("classified project")),
  GOVERNMENT.find((g) => g.includes("secure environments")),
].filter((g): g is string => Boolean(g))

interface Diff {
  title: string
  /** Lines quoted from the resume, shown as one quotation. */
  quote?: string[]
  /** Where and when the quoted line happened. */
  cite?: string
  body: string
  href: string
  go: string
  external?: boolean
}

const DIFFS: Diff[] = [
  ...(SCALE_LINE && TRANSUNION
    ? [
        {
          title: "Production experience",
          quote: [SCALE_LINE],
          cite: `${TRANSUNION.company}, ${TRANSUNION.years}`,
          body: "Production systems, not just prototypes.",
          href: "/resume",
          go: "Read the resume",
        },
      ]
    : []),
  ...(GOVERNMENT_LINES.length
    ? [
        {
          title: "Government and classified work",
          quote: GOVERNMENT_LINES,
          cite: "The resume, Government and classified work",
          body: "If your work carries a clearance requirement, say so in the first email.",
          href: "/resume",
          go: "The section in the resume",
        },
      ]
    : []),
  {
    title: "Maker mentality",
    body: "Creative problem-solving from building 60-node Pi clusters on salvaged hardware. In the lab now: a 6502 simulated transistor by transistor from photographs of its die, and an NES console that runs fast models of its two chips, each derived from and checked against a switch-level simulation. Lab work, not for sale.",
    href: "https://tinymachines.ai/",
    go: "tinymachines.ai",
    external: true,
  },
  {
    title: "Full stack",
    body: "From low-level protocols to cloud architecture to ML pipelines. One head, one accountability.",
    href: "/work",
    go: "The work record",
  },
]

/** The sections, for the row of jumps under the lede. Ids are on the headings. */
const JUMPS = [
  { id: "practices", label: "Practices" },
  { id: "prices", label: "Prices" },
  { id: "process", label: "Process" },
  { id: "different", label: "What is different" },
  { id: "questions", label: "Questions" },
]

/**
 * The three questions, in the owner's wording (git 4618109, where the visible
 * answers and the structured data were one array). They are one array again:
 * the accordion and the FAQPage JSON-LD below are both built from this.
 */
const FAQ = [
  {
    q: "Do you provide AI and data-engineering consulting in Grand Rapids?",
    a: "Yes. I'm based in Forest Hills, Michigan and work with teams across Grand Rapids and Kent County, on-site or remote, on AI integration, data pipelines, and production systems at scale.",
  },
  {
    q: "What is edge computing, and can you build it for a West Michigan business?",
    a: "Edge computing runs data processing on local hardware instead of a distant cloud, cutting latency and cloud bills. I design and build edge and IoT systems for businesses in Grand Rapids, Ada, Cascade, and the wider Kent County area.",
  },
  {
    q: "Do you work on-site in the Grand Rapids area?",
    a: "Yes. As a Forest Hills-based technologist I can work on-site across Kent County when it helps, and remotely for everything else.",
  },
]

/** The four proofs with hardware behind them, as /api/now names them. The panel shows these rows. */
const INSTRUMENTS: NowId[] = ["activity", "firewall", "geiger", "bus"]

const two = (n: number) => String(n).padStart(2, "0")

/** An anchor that knows whether it leaves the site. External links open a new tab and say so. */
function Door({
  href,
  external,
  className,
  children,
}: {
  href: string
  external?: boolean
  className?: string
  children: React.ReactNode
}) {
  return external ? (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (another site, opens in a new tab)</span>
    </a>
  ) : (
    <Link className={className} href={href}>
      {children}
    </Link>
  )
}

function Arrow({ external }: { external?: boolean }) {
  return external ? (
    <ArrowUpRight size={14} strokeWidth={2.2} aria-hidden="true" />
  ) : (
    <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
  )
}

/**
 * One proof: a small link card, the whole of it the link. It wears the kit's
 * .rail and the site's shared .beta-linkcard (the faint offset shadow that
 * turns to ink under the pointer and the detent press), so it answers the
 * pointer exactly as the cards on the home page do. The dot, when the proof is
 * an instrument, starts from the server's snapshot and then follows the poll.
 */
function ProofCard({ x, initial }: { x: Proof; initial: NowSnapshot | null }) {
  return (
    <Door href={x.href} external={x.external} className="rail beta-linkcard beta-services-proof">
      <span className="beta-services-proof__name">
        <b>{x.name}</b>
        {x.dot ? <LiveDot of={x.dot} initial={initial} /> : null}
        <span className="beta-services-proof__arrow">
          <Arrow external={x.external} />
        </span>
      </span>
      <span className="beta-services-proof__line">{x.line}</span>
    </Door>
  )
}

export default async function BetaServicesPage() {
  const initial = await peekNow()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": "https://bradley.io/services#faq",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      <ServicesBody initial={initial} />
    </>
  )
}

function ServicesBody({ initial }: { initial: NowSnapshot | null }) {
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
        More than fifteen years architecting production systems at scale, from government and
        enterprise data infrastructure to garage-lab instruments. Same rigor, both rooms.
      </p>

      <nav className="crumb beta-services-jump" aria-label="On this page">
        {JUMPS.map((j) => (
          <a href={`#${j.id}`} key={j.id}>
            {j.label}
          </a>
        ))}
      </nav>

      <div className="prose beta-sec">
        <h2 id="practices">Five practices, one practitioner</h2>
        <p>
          Each engagement draws from one or more of these. Nothing is bolted on after the fact:
          security, observability, and a graceful retire path come standard.
        </p>
      </div>

      <div className="beta-services-practices">
        {PRACTICES.map((p, i) => (
          <section className="beta-services-practice" key={p.title} aria-labelledby={`practice-${i + 1}`}>
            <div className="beta-services-what">
              <p className="beta-services-num" aria-hidden="true">
                {two(i + 1)}
              </p>
              <h3 id={`practice-${i + 1}`}>{p.title}</h3>
              <p>{p.what}</p>
              <p className="chips">
                {p.tags.map((t) => (
                  <span className="tag" key={t}>
                    {t}
                  </span>
                ))}
              </p>
            </div>

            <div>
              <h4 className="beta-services-k">Worked examples</h4>
              <ul className="beta-services-ex">
                {p.examples.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="beta-services-k">Proof you can open</h4>
              <ul className="beta-services-proofs">
                {p.proof.map((x) => (
                  <li key={x.href}>
                    <ProofCard x={x} initial={initial} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      {/* The key to the dots, one line. Both marks are drawn with the
          LiveDot's own class, so the key cannot drift from the thing it
          explains. The readings themselves are further down, after the
          prices: a visitor should not have to pass a machine to find the
          cost. */}
      <p className="quiet beta-services-key">
        <span>
          <span className="beta-services-keydot" aria-hidden="true">
            <span className="beta-live-dot" data-active="true" />
          </span>
          <span>Filled: reporting right now.</span>
        </span>
        <span>
          <span className="beta-services-keydot" aria-hidden="true">
            <span className="beta-live-dot" data-active="false" />
          </span>
          <span>
            Hollow: quiet or offline; the page still opens.{" "}
            <a href="#live">What each one reads</a>
          </span>
        </span>
      </p>

      <div className="prose beta-sec">
        <h2 id="prices">Three shapes, and what they cost</h2>
        <p>
          Most engagements start as a short scoping call, then drop into one of the shapes below.
          Hybrid arrangements are fine. Say so up front.
        </p>
      </div>

      <div className="beta-services-shapes">
        {ENGAGEMENTS.map((e) => (
          <div className="rail beta-services-shape" key={e.type}>
            <div>
              <h3>{e.type}</h3>
              <p className="beta-services-price">{e.range}</p>
            </div>
            <div>
              <p>{e.what}</p>
              <p className="beta-services-best">
                <span className="beta-services-k">Best for</span>
                {e.ideal}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="prose beta-sec">
        <h2 id="process">Four steps, no theatre</h2>
        <p>
          The same rhythm every time. Discovery is unbillable. If the work doesn&rsquo;t fit,
          I&rsquo;ll say so before we sign anything.
        </p>
      </div>

      <div className="ledger beta-services-steps">
        {/* The kit's scroller without its tab stop: these cells wrap, so the
            region never scrolls and a keyboard stop on it would do nothing. */}
        <div className="scroller">
          <table>
            <thead>
              <tr>
                <th>Step</th>
                <th>What happens</th>
              </tr>
            </thead>
            <tbody>
              {STEPS.map((s, i) => (
                <tr key={s.title}>
                  <td className="name">
                    <span className="beta-services-n">{i + 1}</span>
                    {s.title}
                  </td>
                  <td className="beta-services-wrap">
                    {s.note ? (
                      <span className="beta-services-noted">
                        <span>{s.what}</span>
                        <span className="tag">{s.note}</span>
                      </span>
                    ) : (
                      s.what
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="prose beta-sec">
        <h2 id="different">What you get that doesn&rsquo;t come standard</h2>
      </div>

      {/* Each card has one destination, so here the whole card is the link:
          the anchor is the words at the foot and its ::after covers the card
          (.beta-services-to). The look and the press are the shared
          .beta-linkcard. */}
      <div className="beta-services-diffs">
        {DIFFS.map((d) => (
          <article className="rail beta-linkcard beta-services-diff" key={d.title}>
            <h3>{d.title}</h3>
            {d.quote ? (
              <blockquote className="beta-services-quote">
                {d.quote.map((q) => (
                  <p key={q}>{q}</p>
                ))}
                {d.cite ? <footer>{d.cite}</footer> : null}
              </blockquote>
            ) : null}
            <p>{d.body}</p>
            <span className="beta-linkcard__go">
              <Door href={d.href} external={d.external} className="beta-services-to">
                {d.go}
              </Door>
              <Arrow external={d.external} />
            </span>
          </article>
        ))}
      </div>

      {/* The machine's turn: the only panel on the page. The rows are named
          as the proof cards above name them. */}
      <div className="prose beta-sec">
        <h2 id="live">Four of the proofs above report live</h2>
        <p>What each one is doing as you read, asked again every 15 seconds.</p>
      </div>

      <div className="beta-services-board">
        <NowPanel initial={initial} only={INSTRUMENTS} sentences={false} title="Those four, right now" />
      </div>

      <div className="prose beta-sec">
        <h2 id="questions">Questions I get</h2>
        <p>
          Anti-cloud means host-local, and that goes for the practice too. I&rsquo;m based in Forest
          Hills, Michigan and work with teams across Grand Rapids, Ada, Cascade, East Grand Rapids,
          Kentwood, and the wider Kent County: on-site when it helps, remote when it doesn&rsquo;t.
        </p>
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

      <div className="prose beta-sec">
        <h2>Let&rsquo;s sketch it</h2>
        <p>
          Have a project in mind? Let&rsquo;s discuss how I can help. A first email can be one
          paragraph; the contact page lists the four things that make it easy to answer.
        </p>
      </div>

      <p className="beta-services-actions">
        <Link className="btn btn-primary" href="/contact">
          Start a conversation
        </Link>
        <Link className="btn btn-ghost" href="/resume">
          Read the resume
        </Link>
      </p>
    </div>
  )
}
