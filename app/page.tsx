import Link from "next/link"
import { V3Reveal } from "@/components/v3/V3Reveal"

export default function V3Home() {
  return (
    <>
      {/* HERO ============================================================ */}
      <header className="v3-hero">
        <div className="v3-blob v3-blob--1" aria-hidden />
        <div className="v3-blob v3-blob--2" aria-hidden />
        <div className="v3-blob v3-blob--3" aria-hidden />

        <div className="v3-wrap">
          <V3Reveal>
            <span className="v3-eyebrow">v3 · Brand refresh in flight</span>
          </V3Reveal>

          <V3Reveal delay={80}>
            <h1>
              Hardware hacker.<br />
              Data architect.<br />
              <span className="v3-accent">AI pilot.</span>
            </h1>
          </V3Reveal>

          <V3Reveal delay={160}>
            <p className="v3-lede">
              I build at the seam where enterprise scale meets maker culture — ESP32 mesh
              networks, Fortune-500 data warehouses, and a lot of Claude as co-pilot.
              Anti-cloud, host local, think global.
            </p>
          </V3Reveal>

          <V3Reveal delay={220}>
            <div className="v3-hero__meta">
              <Link href="/projects" className="v3-btn v3-btn--primary">
                See the work →
              </Link>
              <Link href="/services" className="v3-btn v3-btn--ghost">
                Hire me
              </Link>
            </div>
          </V3Reveal>

          <V3Reveal delay={280}>
            <div className="v3-hero__meta" style={{ marginTop: 22 }}>
              <span className="v3-chip">
                <span className="v3-chip__dot" style={{ background: "var(--v3-blue-500)" }} />
                Bio Blue
              </span>
              <span className="v3-chip">
                <span className="v3-chip__dot" style={{ background: "var(--v3-coral)" }} />
                Coral · energetic
              </span>
              <span className="v3-chip">
                <span className="v3-chip__dot" style={{ background: "var(--v3-gold)" }} />
                Gold · warm
              </span>
              <span className="v3-chip">
                <span className="v3-chip__dot" style={{ background: "var(--v3-green)" }} />
                Green · organic
              </span>
            </div>
          </V3Reveal>
        </div>
      </header>

      {/* WHAT I DO ====================================================== */}
      <section className="v3-section">
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head">
              <div className="v3-sec-head__num">01 / WHAT I DO</div>
              <h2>From mesh radios to data warehouses.</h2>
              <p>
                Three threads, one practice. Each ships its own systems, but they cross-pollinate —
                the lab feeds the consulting, the consulting funds the lab.
              </p>
            </div>
          </V3Reveal>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            <V3Reveal>
              <article className="v3-feature-card">
                <div className="v3-feature-card__top">
                  <div className="v3-feature-card__ico">io</div>
                  <h5>Edge & hardware</h5>
                </div>
                <div className="v3-feature-card__body">
                  ESP32 mesh, SDR scanner stacks, TRNG generators, Pi clusters. Production hardware
                  on local power, real signals, real latency budgets.
                </div>
              </article>
            </V3Reveal>

            <V3Reveal delay={80}>
              <article className="v3-feature-card">
                <div className="v3-feature-card__top">
                  <div className="v3-feature-card__ico">{"{ }"}</div>
                  <h5>Data architecture</h5>
                </div>
                <div className="v3-feature-card__body">
                  Pipelines, warehouses, telemetry. Fortune-500 scale without a cloud provider on
                  the bill — systemd, Postgres, NATS, and a deploy script that fits on one screen.
                </div>
              </article>
            </V3Reveal>

            <V3Reveal delay={160}>
              <article className="v3-feature-card">
                <div className="v3-feature-card__top">
                  <div className="v3-feature-card__ico">∿</div>
                  <h5>AI piloting</h5>
                </div>
                <div className="v3-feature-card__body">
                  Claude as co-pilot for actual ship-it work — not demos. Workflow design,
                  agent harnesses, and the unglamorous plumbing that makes them safe in prod.
                </div>
              </article>
            </V3Reveal>
          </div>
        </div>
      </section>

      {/* RECENT ========================================================= */}
      <section className="v3-section v3-section--paper">
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head">
              <div className="v3-sec-head__num">02 / RECENT</div>
              <h2>Currently building.</h2>
              <p>
                A few of the systems running right now. Most are open, all are self-hosted, none
                live behind a corporate proxy.
              </p>
            </div>
          </V3Reveal>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 18,
            }}
          >
            {[
              {
                tag: "Flagship",
                tagColor: "blue",
                title: "AI Pilot License",
                blurb: "Live flight log — every session, mission, model and token shipped with Claude as co-pilot.",
                href: "/ai-pilot",
              },
              {
                tag: "Thesis",
                tagColor: "coral",
                title: "The Shift",
                blurb: "How AI rewrites the economics of building software. Five sections of evidence, not vibes.",
                href: "/the-shift",
              },
              {
                tag: "Receipts",
                tagColor: "green",
                title: "Cost Analysis",
                blurb: "What 117 days of solo + Claude actually cost vs the 9.5-person team it replaced. 95% cheaper.",
                href: "/cost-analysis",
              },
              {
                tag: "Live",
                tagColor: "green",
                title: "sdr-api",
                blurb: "Software-defined radio scanner archive — band registry, soak logs, top frequencies.",
                href: "/sdr",
              },
              {
                tag: "Live",
                tagColor: "green",
                title: "Dragonfli",
                blurb: "1090 MHz ADS-B receiver — local radar, active aircraft, FAA registry, trajectory predictor.",
                href: "/dragonfli",
              },
              {
                tag: "Live",
                tagColor: "green",
                title: "HOTBITS TRNG",
                blurb: "Random bits from radioactive decay — NIST-tested, Geiger-fed, served live.",
                href: "/trng",
              },
              {
                tag: "Beta",
                tagColor: "gold",
                title: "MCP Catalog",
                blurb: "Campaign Brain's 44 FastAPI services, indexed for LLM agents. Reading room for the MCP era.",
                href: "/mcp",
              },
              {
                tag: "Research",
                tagColor: "coral",
                title: "Papers",
                blurb: "TerraPulse research — seismology, space weather, climate, cross-domain. 72 studies, open data.",
                href: "/papers",
              },
              {
                tag: "CLI",
                tagColor: "blue",
                title: "Terminal",
                blurb: "Interactive shell into the portfolio. Same data, command-line. Type help and poke around.",
                href: "/terminal",
              },
            ].map((item, i) => (
              <V3Reveal key={item.title} delay={i * 60}>
                <Link
                  href={item.href}
                  className="v3-panel"
                  style={{
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                >
                  <span className={`v3-pill v3-pill--${item.tagColor}`}>{item.tag}</span>
                  <h3
                    className="v3-font-display"
                    style={{ fontSize: 22, fontWeight: 700, margin: "14px 0 6px" }}
                  >
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 14.5, color: "var(--v3-ink)" }}>{item.blurb}</p>
                </Link>
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
                background:
                  "linear-gradient(135deg, var(--v3-blue-50), var(--v3-white) 60%, var(--v3-paper))",
              }}
            >
              <div className="v3-sec-head__num" style={{ marginBottom: 8 }}>
                03 / WORK TOGETHER
              </div>
              <h2
                className="v3-font-display"
                style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, margin: "0 0 14px" }}
              >
                Got a build that needs the seam-runner?
              </h2>
              <p style={{ maxWidth: 540, margin: "0 auto 28px", color: "var(--v3-ink)" }}>
                If you have hardware that needs to talk to a warehouse, or a warehouse that needs to
                talk to an agent, that&apos;s the room I work in. Let&apos;s sketch it.
              </p>
              <Link href="/contact" className="v3-btn v3-btn--primary">
                Book a call →
              </Link>
            </div>
          </V3Reveal>
        </div>
      </section>
    </>
  )
}
