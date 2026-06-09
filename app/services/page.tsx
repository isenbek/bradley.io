import Link from "next/link"
import { V3Reveal } from "@/components/v3/V3Reveal"

const SERVICES = [
  {
    title: "Distributed Systems Architecture",
    description:
      "Systems that move billions of records with high availability, fault tolerance, and a deploy script that fits on one screen.",
    skills: ["Distributed Databases", "Message Queues", "Load Balancing", "Fault Tolerance"],
    examples: [
      "Search infrastructure at Fortune 500 scale",
      "High-volume messaging platforms",
      "Multi-region data replication",
    ],
  },
  {
    title: "Data Engineering",
    description:
      "Pipelines that ingest, transform, and serve — real-time and batch, without a cloud provider on the bill.",
    skills: ["ETL Pipelines", "Data Warehousing", "Stream Processing", "Analytics"],
    examples: [
      "4.9B data point integration",
      "Snowflake data architectures",
      "Real-time reporting backends",
    ],
  },
  {
    title: "API Design & Development",
    description:
      "REST and WebSocket APIs with auth, rate limiting, and monitoring baked in from the first commit.",
    skills: ["FastAPI", "REST", "WebSocket", "GraphQL"],
    examples: [
      "85-endpoint API orchestration",
      "Multi-carrier messaging integrations",
      "Real-time event streaming",
    ],
  },
  {
    title: "Edge Computing & IoT",
    description:
      "AI and data on resource-constrained devices. Custom protocols, mesh radios, salvaged hardware where it makes sense.",
    skills: ["Raspberry Pi", "Custom Protocols", "Mesh Networks", "Low-Power Systems"],
    examples: [
      "60-node Pi cluster",
      "Custom 802.11 protocols",
      "LoRa mesh deployments",
    ],
  },
  {
    title: "AI/ML Integration",
    description:
      "Production-grade ML — sub-100ms inference, multi-provider orchestration, the unglamorous plumbing that keeps it safe in prod.",
    skills: ["LLM Integration", "Model Deployment", "Vector Search", "ML Pipelines"],
    examples: [
      "Multi-provider AI orchestration",
      "Sub-100ms inference pipelines",
      "Self-improving systems",
    ],
  },
]

const ENGAGEMENTS = [
  {
    type: "Project-based",
    description: "Fixed scope, defined deliverables",
    range: "$25K – $100K",
    ideal: "Specific initiatives with clear requirements",
  },
  {
    type: "Hourly consulting",
    description: "Flexible, as-needed expertise",
    range: "$150 – $275/hr",
    ideal: "Technical guidance and architecture review",
  },
  {
    type: "Retainer",
    description: "Dedicated monthly support",
    range: "$15K – $50K/mo",
    ideal: "Ongoing partnership, continuous improvement",
  },
]

const STEPS = [
  { step: "1", title: "Discovery", desc: "Understand the problem deeply before proposing solutions." },
  { step: "2", title: "Design", desc: "Architecture that balances elegance with practicality." },
  { step: "3", title: "Build", desc: "Iterative development with continuous feedback." },
  { step: "4", title: "Deliver", desc: "Documentation, handoff, knowledge transfer." },
]

const DIFFS = [
  {
    color: "blue" as const,
    title: "Production experience",
    desc: "Systems processing billions of records at Fortune-500 scale, not prototypes.",
  },
  {
    color: "coral" as const,
    title: "Maker mentality",
    desc: "Creative problem-solving sharpened on 60-node Pi clusters and salvaged hardware.",
  },
  {
    color: "gold" as const,
    title: "Full stack",
    desc: "From low-level protocols to cloud architecture to ML pipelines — one head, one accountability.",
  },
  {
    color: "green" as const,
    title: "Security cleared",
    desc: "Led classified government projects under the highest security standards.",
  },
]

export default function V3ServicesPage() {
  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head">
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "-80px", top: "-40px" }} />
        <div className="v3-blob v3-blob--2" aria-hidden style={{ right: "200px", top: "200px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <span className="v3-eyebrow">Services · how we work together</span>
            </V3Reveal>
            <V3Reveal delay={80}>
              <h1>
                Build what cloud-shaped<br />
                consultants <span className="v3-accent">can't.</span>
              </h1>
            </V3Reveal>
            <V3Reveal delay={140}>
              <p className="v3-page-head__lede">
                15+ years architecting production systems at scale — Fortune-500 data
                infrastructure to garage-lab innovations. Same rigor, both rooms.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* SERVICES ======================================================= */}
      <section className="v3-section" style={{ paddingTop: 16 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head">
              <div className="v3-sec-head__num">01 / WHAT I DO</div>
              <h2>Five practices, one practitioner.</h2>
              <p>
                Each engagement draws from one or more of these. Nothing is bolted on after the
                fact — security, observability, and a graceful retire path come standard.
              </p>
            </div>
          </V3Reveal>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {SERVICES.map((s, i) => (
              <V3Reveal key={s.title} delay={i * 50}>
                <article className="v3-service">
                  <div className="v3-service__head">
                    <div className="v3-service__num">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3>{s.title}</h3>
                    </div>
                  </div>
                  <p className="v3-service__desc">{s.description}</p>
                  <div className="v3-chips">
                    {s.skills.map((skill) => (
                      <span key={skill} className="v3-chip-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="v3-service__examples">
                    <strong>Examples: </strong>
                    {s.examples.join(" · ")}
                  </div>
                </article>
              </V3Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ENGAGEMENTS ==================================================== */}
      <section className="v3-section v3-section--paper">
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head">
              <div className="v3-sec-head__num">02 / ENGAGEMENT MODELS</div>
              <h2>Three shapes. Pick the one that fits.</h2>
              <p>
                Most engagements start as a short scoping call, then drop into one of the shapes
                below. Hybrid arrangements are fine — say so up front.
              </p>
            </div>
          </V3Reveal>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 18,
            }}
          >
            {ENGAGEMENTS.map((m, i) => (
              <V3Reveal key={m.type} delay={i * 60}>
                <div className="v3-price">
                  <h3>{m.type}</h3>
                  <p className="v3-price__desc">{m.description}</p>
                  <div className="v3-price__range">{m.range}</div>
                  <p className="v3-price__ideal">Best for: {m.ideal}</p>
                </div>
              </V3Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS ======================================================= */}
      <section className="v3-section">
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head">
              <div className="v3-sec-head__num">03 / PROCESS</div>
              <h2>Four steps, no theater.</h2>
              <p>
                The same rhythm every time. Discovery is unbillable — if the work doesn't fit, I'll
                say so before we sign anything.
              </p>
            </div>
          </V3Reveal>

          <div className="v3-steps">
            {STEPS.map((p, i) => (
              <V3Reveal key={p.step} delay={i * 80}>
                <div className="v3-step">
                  <div className="v3-step__num">{p.step}</div>
                  <h3>{p.title}</h3>
                  <p className="v3-step__desc">{p.desc}</p>
                </div>
              </V3Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* DIFFERENTIATORS =============================================== */}
      <section className="v3-section v3-section--paper">
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head">
              <div className="v3-sec-head__num">04 / WHY ME</div>
              <h2>What you get that doesn't come standard.</h2>
              <p>
                A short list — but each one is the reason somebody hired me, not a hypothetical
                advantage.
              </p>
            </div>
          </V3Reveal>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {DIFFS.map((d, i) => (
              <V3Reveal key={d.title} delay={i * 60}>
                <article className={`v3-diff v3-diff--${d.color}`}>
                  <div className="v3-diff__bar" />
                  <div>
                    <h3>{d.title}</h3>
                    <p>{d.desc}</p>
                  </div>
                </article>
              </V3Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA ============================================================ */}
      <section className="v3-section">
        <div className="v3-wrap">
          <V3Reveal>
            <div
              className="v3-panel"
              style={{
                textAlign: "center",
                padding: "56px 32px",
                background: "linear-gradient(135deg, var(--v3-blue-50), var(--v3-white) 60%, var(--v3-paper))",
              }}
            >
              <div className="v3-sec-head__num" style={{ marginBottom: 8 }}>
                05 / NEXT
              </div>
              <h2
                className="v3-font-display"
                style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, margin: "0 0 14px" }}
              >
                Let's sketch it.
              </h2>
              <p style={{ maxWidth: 540, margin: "0 auto 28px", color: "var(--v3-ink)" }}>
                Bring the problem. I'll bring the questions. Worst case you walk away with a
                clearer picture of what to do next — and that's free.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <a href="mailto:brad@bradley.io" className="v3-btn v3-btn--primary">
                  Get in touch →
                </a>
                <Link href="/projects" className="v3-btn v3-btn--ghost">
                  View projects
                </Link>
              </div>
            </div>
          </V3Reveal>
        </div>
      </section>
    </>
  )
}
