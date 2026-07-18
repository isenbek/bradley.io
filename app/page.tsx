import { ArrowRight, Bot, Atom, Droplets } from "lucide-react"
import Link from "next/link"
import { ActivityPulse } from "@/components/v3/ActivityPulse"
import { ActivityFeedList } from "@/components/v3/ActivityFeedList"
import { PrimalitySuite } from "@/components/home/PrimalitySuite"
import { HotbitsHero } from "@/components/home/HotbitsHero"
import { AirspacePromo } from "@/components/home/AirspacePromo"
import { GpsPromo } from "@/components/home/GpsPromo"
import { WorldEventPromo } from "@/components/home/WorldEventPromo"
import { FleetPromo } from "@/components/home/FleetPromo"
import { HeroStats } from "@/components/v3/HeroStats"
import { MissionHeros } from "@/components/v3/MissionHeros"
import { V3Reveal } from "@/components/v3/V3Reveal"
import { loadSiteDataStatic } from "@/lib/site-data"
import { V3_CATEGORY } from "./projects/_categories"
import type { CategoryId } from "@/lib/project-categories"

export const revalidate = 3600

export default async function V3Home() {
  const data = await loadSiteDataStatic()
  const stats = data.stats
  const feed = data.activityFeed ?? []
  const featured = (data.projects ?? []).filter((p) => p.isFeatured).slice(0, 6)

  return (
    <>
      {/* HERO ============================================================ */}
      <header className="v3-hero">
        <div className="v3-blob v3-blob--1" aria-hidden />
        <div className="v3-blob v3-blob--2" aria-hidden />
        <div className="v3-blob v3-blob--3" aria-hidden />

        <div className="v3-wrap">
          {/* Above-the-fold uses `eager` so first paint already shows them at
              full opacity — needed for a fast LCP since the h1 is the LCP
              element. The on-scroll fade still runs for everything below. */}
          <V3Reveal eager>
            <span className="v3-eyebrow">Hardware · AI · the seam between</span>
          </V3Reveal>

          <V3Reveal eager>
            <h1>
              Hardware hacker.<br />
              Data architect.<br />
              <span className="v3-accent">AI pilot.</span>
            </h1>
          </V3Reveal>

          <V3Reveal eager>
            <p className="v3-lede">
              I build at the seam where enterprise scale meets maker culture: ESP32 mesh
              networks, Fortune-500 data warehouses, and a lot of Claude as co-pilot.
              Anti-cloud, host local, think global.
            </p>
          </V3Reveal>

          <V3Reveal eager>
            <div className="v3-hero__meta">
              <Link href="/projects" className="v3-btn v3-btn--primary">
                See the work →
              </Link>
            </div>
          </V3Reveal>

          <V3Reveal delay={140}>
            <p className="v3-hero__local">
              Based in Forest Hills, Michigan · working across Grand Rapids &amp; Kent County,
              on-site or remote.
            </p>
          </V3Reveal>

          <V3Reveal delay={220}>
            <div style={{ marginTop: 36 }}>
              <HotbitsHero />
            </div>
          </V3Reveal>

          <V3Reveal delay={232}>
            <Link href="/projects/turfy" className="v3-air-promo v3-air-promo--green" style={{ marginTop: 14 }}>
              <span className="v3-air-promo__ico"><Droplets size={20} strokeWidth={2.2} /></span>
              <span className="v3-air-promo__body">
                <span className="v3-air-promo__eyebrow">
                  <span className="v3-air-promo__new">NEW</span> project · irrigation sidecar
                </span>
                <span className="v3-air-promo__title">Turfy: an AI sprinkler brain that fails back to dumb</span>
                <span className="v3-air-promo__blurb">
                  A weather-informed sidecar for a 1990s Rain Bird that only takes the lawn when it&apos;s
                  provably healthy: hardware watchdog, transfer relays, fail-safe by design.
                </span>
              </span>
              <span className="v3-air-promo__right"><ArrowRight className="v3-air-promo__arrow" size={18} strokeWidth={2.4} /></span>
            </Link>
          </V3Reveal>

          <V3Reveal delay={240}>
            <AirspacePromo />
          </V3Reveal>

          <V3Reveal delay={250}>
            <GpsPromo />
          </V3Reveal>

          <V3Reveal delay={252}>
            <WorldEventPromo />
          </V3Reveal>

          <V3Reveal delay={253}>
            <FleetPromo />
          </V3Reveal>

          <V3Reveal delay={254}>
            <Link href="/meatball" className="v3-air-promo v3-air-promo--gold" style={{ marginTop: 14 }}>
              <span className="v3-air-promo__ico"><Bot size={20} strokeWidth={2.2} /></span>
              <span className="v3-air-promo__body">
                <span className="v3-air-promo__eyebrow">project · the sensory machine</span>
                <span className="v3-air-promo__title">Meatball: eyes, ears &amp; a voice</span>
                <span className="v3-air-promo__blurb">
                  A caseless junk-pile home server taught to see, hear, think, and speak.
                  Every model on the metal. Live eye, field notes, and a WOPR you can talk to.
                </span>
              </span>
              <span className="v3-air-promo__right"><ArrowRight className="v3-air-promo__arrow" size={18} strokeWidth={2.4} /></span>
            </Link>
          </V3Reveal>

          <V3Reveal delay={258}>
            <Link href="/lab/bio-mark" className="v3-air-promo" style={{ marginTop: 14 }}>
              <span className="v3-air-promo__ico"><Atom size={20} strokeWidth={2.2} /></span>
              <span className="v3-air-promo__body">
                <span className="v3-air-promo__eyebrow">design · vector x-ray</span>
                <span className="v3-air-promo__title">The bio mark, decomposed</span>
                <span className="v3-air-promo__blurb">
                  The wordmark as pure geometry: chords, Bézier offset handles, anchors, and the
                  i-tittle plumb. Drag the dot, morph chords↔curves, measure live.
                </span>
              </span>
              <span className="v3-air-promo__right"><ArrowRight className="v3-air-promo__arrow" size={18} strokeWidth={2.4} /></span>
            </Link>
          </V3Reveal>

          <V3Reveal delay={259}>
            <PrimalitySuite />
          </V3Reveal>

          <V3Reveal delay={260}>
            <div style={{ marginTop: 18 }}>
              <div
                className="v3-sec-head__num"
                style={{
                  color: "var(--v3-slate)",
                  marginBottom: 12,
                }}
              >
                MISSION TIMELINES
              </div>
              <MissionHeros />
            </div>
          </V3Reveal>

          <V3Reveal delay={320}>
            <div style={{ marginTop: 28 }}>
              <ActivityPulse />
            </div>
          </V3Reveal>
        </div>
      </header>

      {/* STAT STRIP ====================================================== */}
      <section className="v3-section v3-section--paper" style={{ paddingTop: 56, paddingBottom: 56 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head" style={{ marginBottom: 20 }}>
              <div className="v3-sec-head__num">BY THE NUMBERS</div>
              <h2 style={{ marginBottom: 6 }}>The pile, counted.</h2>
              <p>
                Live counters across the whole pile, regenerated on every deploy.
              </p>
            </div>
          </V3Reveal>
          <V3Reveal delay={80}>
            <HeroStats stats={stats} />
          </V3Reveal>
        </div>
      </section>

      {/* RECENT WORK ===================================================== */}
      <section className="v3-section" style={{ paddingTop: 64, paddingBottom: 24 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              <div className="v3-sec-head" style={{ marginBottom: 0 }}>
                <div className="v3-sec-head__num">RECENT WORK</div>
                <h2 style={{ marginBottom: 6 }}>What's been shipping.</h2>
                <p>
                  Commits, sessions, and conversations: the live thread across every
                  project.
                </p>
              </div>
              <Link
                href="/projects"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--v3-blue-700)",
                  textDecoration: "none",
                }}
              >
                All projects <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>
          </V3Reveal>
          <V3Reveal delay={60}>
            <article className="v3-panel">
              <ActivityFeedList feed={feed} limit={15} />
            </article>
          </V3Reveal>
        </div>
      </section>

      {/* FEATURED PROJECTS =============================================== */}
      <section className="v3-section v3-section--paper" style={{ paddingTop: 56, paddingBottom: 56 }}>
        <div className="v3-wrap">
          <V3Reveal>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              <div className="v3-sec-head" style={{ marginBottom: 0 }}>
                <div className="v3-sec-head__num">FEATURED</div>
                <h2 style={{ marginBottom: 6 }}>Active projects.</h2>
                <p>The handful getting the most attention right now.</p>
              </div>
              <Link
                href="/projects"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--v3-coral-dk)",
                  textDecoration: "none",
                }}
              >
                Browse all {data.projects.length} <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>
          </V3Reveal>
          <V3Reveal delay={60}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {featured.map((p) => {
                const cat = V3_CATEGORY[p.category as CategoryId] ?? V3_CATEGORY.systems
                return (
                  <Link
                    key={p.slug}
                    href={`/projects/${p.slug}`}
                    className="v3-pcard"
                    // 6 featured cards × default-prefetched RSC payloads
                    // burns LCP-critical bandwidth; click navigation is
                    // still fast over the local origin.
                    prefetch={false}
                    style={{
                      ["--v3-pcard-color" as string]: cat.color,
                      ["--v3-pcard-ink" as string]: cat.ink,
                    }}
                  >
                    <div className="v3-pcard__bar" aria-hidden />
                    <div className="v3-pcard__body">
                      <div className="v3-pcard__row">
                        <span className="v3-pcard__cat">{cat.label}</span>
                        <span className="v3-pcard__msgs" style={{ marginLeft: 0 }}>
                          {p.totalMessages.toLocaleString()} msgs
                        </span>
                      </div>
                      <h3 className="v3-pcard__title">{p.name}</h3>
                      <p className="v3-pcard__tagline">{p.tagline}</p>
                      {p.technologies?.length ? (
                        <div className="v3-pcard__tech">
                          {p.technologies.slice(0, 4).map((t) => (
                            <span key={t} className="v3-pcard__chip">
                              {t}
                            </span>
                          ))}
                          {p.technologies.length > 4 ? (
                            <span className="v3-pcard__more">
                              +{p.technologies.length - 4}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                )
              })}
            </div>
          </V3Reveal>
        </div>
      </section>

      {/* WHAT I DO ====================================================== */}
      <section className="v3-section">
        <div className="v3-wrap">
          <V3Reveal>
            <div className="v3-sec-head">
              <div className="v3-sec-head__num">01 / WHAT I DO</div>
              <h2>From mesh radios to data warehouses.</h2>
              <p>
                Three threads, one practice. Each ships its own systems, but they cross-pollinate:
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
                  <h3>Edge & hardware</h3>
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
                  <h3>Data architecture</h3>
                </div>
                <div className="v3-feature-card__body">
                  Pipelines, warehouses, telemetry. Fortune-500 scale without a cloud provider on
                  the bill: systemd, Postgres, NATS, and a deploy script that fits on one screen.
                </div>
              </article>
            </V3Reveal>

            <V3Reveal delay={160}>
              <article className="v3-feature-card">
                <div className="v3-feature-card__top">
                  <div className="v3-feature-card__ico">∿</div>
                  <h3>AI piloting</h3>
                </div>
                <div className="v3-feature-card__body">
                  Claude as co-pilot for actual ship-it work, not demos. Workflow design,
                  agent harnesses, and the unglamorous plumbing that makes them safe in prod.
                </div>
              </article>
            </V3Reveal>
          </div>
        </div>
      </section>

      {/* RECENT ========================================================= */}
      {/* Curated teaser only — the full experiment catalog lives at /lab
          (single source of truth; this grid used to mirror all 9 cards). */}
      <section className="v3-section v3-section--paper">
        <div className="v3-wrap">
          <V3Reveal>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              <div className="v3-sec-head" style={{ marginBottom: 0 }}>
                <div className="v3-sec-head__num">02 / RECENT</div>
                <h2 style={{ marginBottom: 6 }}>Currently building.</h2>
                <p>
                  The flagship stories. The rest of the bench (radios, robots, random
                  bits) lives in the lab.
                </p>
              </div>
              <Link
                href="/lab"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--font-v3-mono), monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--v3-gold-dk)",
                  textDecoration: "none",
                }}
              >
                Everything in the lab <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
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
                blurb: "Live flight log: every session, mission, model and token shipped with Claude as co-pilot.",
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
                tag: "Hub",
                tagColor: "gold",
                title: "The Lab",
                blurb: "Live dashboards, hardware demos, the sensory robot, field notes: the full bench on one page.",
                href: "/lab",
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
