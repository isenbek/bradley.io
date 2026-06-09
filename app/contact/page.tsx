import Link from "next/link"
import {
  ChevronRight,
  Clock,
  Github,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"

const METHODS = [
  {
    name: "Email",
    detail: "brad@bradley.io",
    href: "mailto:brad@bradley.io",
    Icon: Mail,
    color: "" as const,
  },
  {
    name: "GitHub",
    detail: "@isenbek",
    href: "https://github.com/isenbek",
    Icon: Github,
    color: "" as const,
    external: true,
  },
  {
    name: "GitHub (lab handle)",
    detail: "@tinymachines",
    href: "https://github.com/tinymachines",
    Icon: Github,
    color: "" as const,
    external: true,
  },
] as const

const FACTS = [
  {
    title: "Grand Rapids, MI",
    desc: "Eastern time. In-person friendly inside the GR/Detroit/Chicago triangle.",
    Icon: MapPin,
  },
  {
    title: "~24h reply",
    desc: "Most weekdays. Weekends are reserved for the lab — but I do peek.",
    Icon: Clock,
  },
  {
    title: "NDAs welcome",
    desc: "Comfortable with classified-adjacent work, security review, and signed MNDAs.",
    Icon: ShieldCheck,
  },
]

const WHAT_TO_SEND = [
  {
    title: "What you're building.",
    desc: "Two sentences is plenty. Skip the company pitch — go straight to the system.",
  },
  {
    title: "What hurts right now.",
    desc: "The specific failure, the slow query, the box that won't talk. The reason you're reaching out today and not last month.",
  },
  {
    title: "What success looks like.",
    desc: "A metric, a date, an outcome — anything more concrete than \"AI strategy.\"",
  },
  {
    title: "Constraints if any.",
    desc: "On-prem only? Budget ceiling? Security clearance required? Tell me up front so neither of us wastes a call.",
  },
]

export default function V3ContactPage() {
  return (
    <>
      {/* HEADER ========================================================= */}
      <header className="v3-page-head">
        <div className="v3-blob v3-blob--1" aria-hidden style={{ right: "-80px", top: "-40px" }} />
        <div className="v3-blob v3-blob--2" aria-hidden style={{ right: "240px", top: "200px" }} />

        <div className="v3-wrap">
          <div className="v3-page-head__lockup">
            <V3Reveal>
              <span className="v3-eyebrow">Contact · open inbox</span>
            </V3Reveal>
            <V3Reveal delay={80}>
              <h1>
                Drop me a <span className="v3-accent">line.</span>
              </h1>
            </V3Reveal>
            <V3Reveal delay={140}>
              <p className="v3-page-head__lede">
                Project, second opinion, weird hardware question, or just a hello — all welcome.
                Email is the front door; GitHub is the side door; both lead to the same room.
              </p>
            </V3Reveal>
          </div>
        </div>
      </header>

      {/* METHODS + FACTS ================================================ */}
      <section className="v3-section" style={{ paddingTop: 8 }}>
        <div className="v3-wrap">
          <div className="v3-twocol">
            {/* METHODS */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <V3Reveal>
                <article className="v3-panel">
                  <div className="v3-panel-head">Reach me</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {METHODS.map((m) => {
                      const isFirst = m.name === "Email"
                      const cls = isFirst
                        ? "v3-method"
                        : m.detail.includes("tinymachines")
                        ? "v3-method v3-method--gold"
                        : "v3-method v3-method--coral"
                      const external = "external" in m && m.external
                      return (
                        <a
                          key={m.detail}
                          href={m.href}
                          className={cls}
                          {...(external
                            ? { target: "_blank", rel: "noreferrer noopener" }
                            : {})}
                        >
                          <div className="v3-method__icon">
                            <m.Icon size={20} strokeWidth={2.25} />
                          </div>
                          <div>
                            <div className="v3-method__name">{m.name}</div>
                            <div className="v3-method__detail">{m.detail}</div>
                          </div>
                          <ChevronRight size={18} className="v3-method__chev" />
                        </a>
                      )
                    })}
                  </div>
                </article>
              </V3Reveal>

              {/* WHAT TO SEND */}
              <V3Reveal delay={80}>
                <article className="v3-panel">
                  <div className="v3-panel-head">What helps a first email</div>
                  <p
                    className="v3-prose"
                    style={{ fontSize: 15, marginBottom: 22 }}
                  >
                    None of this is required — but a paragraph hitting these four points means
                    I can reply with something useful instead of a follow-up question.
                  </p>
                  <ol className="v3-numbered">
                    {WHAT_TO_SEND.map((x) => (
                      <li key={x.title}>
                        <div>
                          <div className="v3-numbered__title">{x.title}</div>
                          <div className="v3-numbered__desc">{x.desc}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </article>
              </V3Reveal>
            </div>

            {/* SIDEBAR */}
            <aside className="v3-twocol__side">
              <V3Reveal>
                <div className="v3-panel">
                  <div className="v3-panel-head">Quick facts</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {FACTS.map((f) => (
                      <div
                        key={f.title}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "32px 1fr",
                          gap: 12,
                          alignItems: "start",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "var(--v3-r-sm)",
                            background: "var(--v3-blue-50)",
                            color: "var(--v3-blue-600)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <f.Icon size={16} strokeWidth={2.25} />
                        </div>
                        <div>
                          <div
                            className="v3-font-display"
                            style={{
                              fontWeight: 700,
                              fontSize: 14.5,
                              color: "var(--v3-charcoal)",
                              marginBottom: 2,
                            }}
                          >
                            {f.title}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: "var(--v3-ink)",
                              lineHeight: 1.5,
                            }}
                          >
                            {f.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </V3Reveal>

              <V3Reveal delay={100}>
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
                    Engagement shapes
                  </div>
                  <p
                    className="v3-font-display"
                    style={{
                      fontWeight: 700,
                      fontSize: 19,
                      lineHeight: 1.25,
                      marginBottom: 12,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Project, hourly, or retainer.
                  </p>
                  <p
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      color: "rgba(255,255,255,0.85)",
                      marginBottom: 18,
                    }}
                  >
                    Pricing and fit examples for each are on the services page — useful background
                    if you're not sure which shape you need.
                  </p>
                  <Link
                    href="/services"
                    className="v3-btn"
                    style={{
                      background: "#fff",
                      color: "var(--v3-blue-700)",
                      fontWeight: 700,
                    }}
                  >
                    See services →
                  </Link>
                </div>
              </V3Reveal>

              <V3Reveal delay={160}>
                <div className="v3-panel" style={{ padding: "18px 20px" }}>
                  <div
                    className="v3-panel-head"
                    style={{ marginBottom: 8 }}
                  >
                    Prefer chat?
                  </div>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: "var(--v3-ink)",
                      lineHeight: 1.55,
                      marginBottom: 12,
                    }}
                  >
                    Open a GitHub issue on any of my repos and tag @isenbek — totally fine
                    for technical conversations.
                  </p>
                  <a
                    href="https://github.com/isenbek"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="v3-btn v3-btn--ghost"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <MessageCircle size={15} strokeWidth={2.25} />
                    Open an issue
                  </a>
                </div>
              </V3Reveal>
            </aside>
          </div>
        </div>
      </section>

      {/* CTA STRIP ====================================================== */}
      <section className="v3-section v3-section--paper" style={{ paddingTop: 56 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div
              className="v3-panel"
              style={{
                textAlign: "center",
                padding: "48px 28px",
                background:
                  "linear-gradient(135deg, var(--v3-blue-50), var(--v3-white) 60%, var(--v3-paper))",
              }}
            >
              <h2
                className="v3-font-display"
                style={{
                  fontSize: "clamp(26px, 3.8vw, 36px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  margin: "0 0 12px",
                }}
              >
                One paragraph. That&apos;s all I need.
              </h2>
              <p
                style={{
                  maxWidth: 540,
                  margin: "0 auto 24px",
                  color: "var(--v3-ink)",
                  fontSize: 15,
                  lineHeight: 1.55,
                }}
              >
                Bring the problem. I&apos;ll bring the questions. Worst case you walk away
                with a clearer picture of what to do next — and that&apos;s free.
              </p>
              <a
                href="mailto:brad@bradley.io?subject=hello%20bradley"
                className="v3-btn v3-btn--primary"
              >
                brad@bradley.io →
              </a>
            </div>
          </V3Reveal>
        </div>
      </section>
    </>
  )
}
