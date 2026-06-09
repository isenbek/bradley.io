"use client"

import { motion } from "framer-motion"
import { AnimatedSection } from "@/components/ui/AnimatedSection"
import { PageHeader } from "@/components/mdx/PageHeader"
import { StatGrid } from "@/components/mdx/StatGrid"
import { FeatureCard, FeatureGrid } from "@/components/mdx/FeatureCard"
import { CalloutBox } from "@/components/mdx/CalloutBox"
import { IntegrationBadges } from "@/components/mdx/IntegrationBadges"

// --- Color Swatch ---
function ColorSwatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex flex-col">
      <div
        className="w-full h-20 rounded-lg border border-sf-steel/15 mb-3"
        style={{ background: `var(${cssVar})` }}
      />
      <div className="text-sm font-bold text-sf-white">{name}</div>
      <div className="text-xs font-mono text-sf-muted">{cssVar}</div>
    </div>
  )
}

// --- Section Wrapper ---
function Section({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="py-16 border-b border-sf-steel/10">
      <AnimatedSection className="container-page">
        <h2 className="text-3xl font-extrabold text-sf-white mb-2">{title}</h2>
        <div className="w-16 h-1 bg-gradient-to-r from-sf-orange to-sf-cyan rounded-full mb-10" />
        {children}
      </AnimatedSection>
    </section>
  )
}

export default function StyleGuidePage() {
  return (
    <div>
      {/* Header */}
      <div className="bg-sf-dark-alt border-b border-sf-steel/10">
        <div className="container-page py-16">
          <AnimatedSection>
            <div className="text-xs font-semibold text-sf-orange uppercase tracking-[3px] mb-3">
              Brand System
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
              Style Guide
            </h1>
            <p className="text-lg text-sf-steel max-w-2xl">
              The complete design system for bradley.io. Colors, typography,
              components, and patterns that define the brand.
            </p>
          </AnimatedSection>
        </div>
      </div>

      {/* ===== COLOR PALETTE ===== */}
      <Section title="Color Palette" id="colors">
        <h3 className="text-lg font-bold text-sf-white mb-4">Brand Colors</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
          <ColorSwatch name="Primary" cssVar="--brand-primary" />
          <ColorSwatch name="Deep" cssVar="--brand-deep" />
          <ColorSwatch name="Secondary" cssVar="--brand-secondary" />
          <ColorSwatch name="Steel" cssVar="--brand-steel" />
        </div>

        <h3 className="text-lg font-bold text-sf-white mb-4">Backgrounds</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
          <ColorSwatch name="Dark" cssVar="--brand-bg" />
          <ColorSwatch name="Dark Alt" cssVar="--brand-bg-alt" />
          <ColorSwatch name="Text" cssVar="--brand-text" />
          <ColorSwatch name="Muted" cssVar="--brand-muted" />
        </div>

        <h3 className="text-lg font-bold text-sf-white mb-4">Semantic Colors</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
          <ColorSwatch name="Success" cssVar="--brand-success" />
          <ColorSwatch name="Warning" cssVar="--brand-warning" />
          <ColorSwatch name="Error" cssVar="--brand-error" />
          <ColorSwatch name="Info" cssVar="--brand-info" />
        </div>

        <h3 className="text-lg font-bold text-sf-white mb-4">Gradient</h3>
        <div className="h-16 rounded-lg bg-gradient-to-r from-sf-orange to-sf-cyan mb-2" />
        <p className="text-sm font-mono text-sf-muted">
          .text-gradient — from-sf-orange to-sf-cyan
        </p>
      </Section>

      {/* ===== TYPOGRAPHY ===== */}
      <Section title="Typography" id="typography">
        <div className="grid md:grid-cols-2 gap-12 mb-10">
          <div>
            <h3 className="text-lg font-bold text-sf-white mb-4">
              Display — Outfit
            </h3>
            <div className="space-y-4">
              {[
                { weight: 300, label: "Light" },
                { weight: 400, label: "Regular" },
                { weight: 500, label: "Medium" },
                { weight: 600, label: "Semibold" },
                { weight: 700, label: "Bold" },
                { weight: 800, label: "Extrabold" },
              ].map((w) => (
                <div key={w.weight} className="flex items-baseline gap-4">
                  <span className="text-xs font-mono text-sf-muted w-20 shrink-0">
                    {w.weight}
                  </span>
                  <span
                    className="text-2xl text-sf-white font-display"
                    style={{ fontWeight: w.weight }}
                  >
                    Systems Building Systems — {w.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-sf-white mb-4">
              Mono — JetBrains Mono
            </h3>
            <div className="space-y-4">
              {[
                { weight: 400, label: "Regular" },
                { weight: 500, label: "Medium" },
              ].map((w) => (
                <div key={w.weight} className="flex items-baseline gap-4">
                  <span className="text-xs font-mono text-sf-muted w-20 shrink-0">
                    {w.weight}
                  </span>
                  <span
                    className="text-xl text-sf-cyan font-mono"
                    style={{ fontWeight: w.weight }}
                  >
                    const forge = &quot;AI&quot; — {w.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-sf-white mb-4">Heading Scale</h3>
        <div className="space-y-6 mb-10">
          <div>
            <span className="text-xs font-mono text-sf-muted">h1 — text-5xl / text-6xl</span>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-sf-white">
              The Forge
            </h1>
          </div>
          <div>
            <span className="text-xs font-mono text-sf-muted">h2 — text-4xl / text-5xl</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-sf-white">
              Platform Services
            </h2>
          </div>
          <div>
            <span className="text-xs font-mono text-sf-muted">h3 — text-2xl / text-3xl</span>
            <h3 className="text-2xl md:text-3xl font-bold text-sf-white">
              Modular Architecture
            </h3>
          </div>
          <div>
            <span className="text-xs font-mono text-sf-muted">h4 — text-xl</span>
            <h4 className="text-xl font-bold text-sf-white">
              Service Details
            </h4>
          </div>
        </div>

        <h3 className="text-lg font-bold text-sf-white mb-4">Body Text</h3>
        <p className="text-sf-steel leading-relaxed max-w-2xl mb-4">
          AI-powered automation platform that transforms how organizations
          operate. Modular. Intelligent. Built for the businesses that refuse
          to wait. Each module is an independent microservice with its own API.
        </p>
        <p className="text-sm text-sf-muted leading-relaxed max-w-2xl">
          Secondary text uses the muted color for supporting information,
          captions, and metadata. It maintains readability while establishing
          visual hierarchy.
        </p>
      </Section>

      {/* ===== STATUS BADGES ===== */}
      <Section title="Status Badges" id="badges">
        <div className="flex flex-wrap gap-4 mb-6">
          <span className="px-4 py-1.5 text-sm font-medium rounded-full bg-sf-success text-sf-white">
            Production
          </span>
          <span className="px-4 py-1.5 text-sm font-medium rounded-full bg-sf-warning text-sf-white">
            In Development
          </span>
          <span className="px-4 py-1.5 text-sm font-medium rounded-full bg-sf-muted text-sf-white">
            Planned
          </span>
        </div>
        <p className="text-sm text-sf-muted">
          Used in PageHeader to indicate the status of each service or feature.
        </p>
      </Section>

      {/* ===== BUTTONS ===== */}
      <Section title="Button Styles" id="buttons">
        <div className="flex flex-wrap gap-4 mb-8">
          <button className="bg-sf-orange text-sf-white px-6 py-3 rounded-lg text-sm font-semibold hover:shadow-[0_8px_30px_var(--brand-btn-shadow)] hover:-translate-y-0.5 transition-all">
            Primary Action
          </button>
          <button className="border border-sf-steel/30 text-sf-steel px-6 py-3 rounded-lg text-sm font-medium hover:bg-sf-cyan/5 hover:border-sf-cyan hover:text-sf-cyan transition-all">
            Outline
          </button>
          <button className="bg-sf-cyan/10 text-sf-cyan px-6 py-3 rounded-lg text-sm font-semibold border border-sf-cyan/20 hover:bg-sf-cyan/20 transition-all">
            Secondary
          </button>
          <button className="bg-sf-dark-alt text-sf-muted px-6 py-3 rounded-lg text-sm font-medium border border-sf-steel/15 hover:text-sf-white hover:border-sf-steel/30 transition-all">
            Ghost
          </button>
        </div>

        <h3 className="text-lg font-bold text-sf-white mb-4">Button Sizes</h3>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <button className="bg-sf-orange text-sf-white px-4 py-2 rounded text-xs font-semibold">
            Small
          </button>
          <button className="bg-sf-orange text-sf-white px-6 py-3 rounded-lg text-sm font-semibold">
            Default
          </button>
          <button className="bg-sf-orange text-sf-white px-10 py-4 rounded-lg text-lg font-semibold">
            Large
          </button>
        </div>
      </Section>

      {/* ===== COMPONENT SHOWCASE ===== */}
      <Section title="Component Showcase" id="components">
        <h3 className="text-lg font-bold text-sf-white mb-6">PageHeader</h3>
        <div className="bg-sf-dark rounded-xl border border-sf-steel/10 overflow-hidden mb-10">
          <PageHeader
            icon="Cpu"
            title="AI Provider"
            status="production"
            tagline="Multi-model orchestration with tenant billing. The brain of the platform."
          />
        </div>

        <h3 className="text-lg font-bold text-sf-white mb-6">StatGrid</h3>
        <div className="bg-sf-dark rounded-xl border border-sf-steel/10 overflow-hidden mb-10">
          <StatGrid
            stats={[
              { value: "20+", label: "Years of Data", icon: "Database" },
              { value: "6", label: "Platform Services", icon: "Server" },
              { value: "99%", label: "Accuracy", icon: "Target" },
              { value: "10x", label: "Faster", icon: "Zap" },
            ]}
          />
        </div>

        <h3 className="text-lg font-bold text-sf-white mb-6">FeatureCard</h3>
        <div className="bg-sf-dark rounded-xl border border-sf-steel/10 overflow-hidden mb-10">
          <FeatureGrid>
            <FeatureCard
              icon="Brain"
              title="AI Categorization"
              description="Machine learning models that understand your business logic. 99%+ confidence on transaction categorization."
            />
            <FeatureCard
              icon="Zap"
              title="Real-Time Processing"
              description="API-first integrations that connect your existing tools into a unified, intelligent pipeline."
            />
          </FeatureGrid>
        </div>

        <h3 className="text-lg font-bold text-sf-white mb-6">CalloutBox</h3>
        <div className="space-y-4 mb-10">
          <CalloutBox type="info" title="Platform Architecture">
            Every module is an independent microservice with its own API. The AI layer discovers what it needs.
          </CalloutBox>
          <CalloutBox type="tip" title="Pro Tip">
            Use the modular approach to snap services together like legos. Each one works independently.
          </CalloutBox>
          <CalloutBox type="warning" title="Important">
            Read-only mode should be used first when connecting new data sources. Build trust before enabling writes.
          </CalloutBox>
          <CalloutBox type="success" title="Deployed">
            The financial pipeline is live and processing transactions in real-time.
          </CalloutBox>
        </div>

        <h3 className="text-lg font-bold text-sf-white mb-6">IntegrationBadges</h3>
        <div className="bg-sf-dark rounded-xl border border-sf-steel/10 overflow-hidden mb-10">
          <IntegrationBadges
            services={["ai-provider", "districts", "radio", "intel", "finance", "forms"]}
            title="Platform Services"
          />
        </div>
      </Section>

      {/* ===== ANIMATION PATTERNS ===== */}
      <Section title="Animation Patterns" id="animations">
        <h3 className="text-lg font-bold text-sf-white mb-6">Fade Up (Scroll Triggered)</h3>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {[0, 0.1, 0.2].map((delay, i) => (
            <AnimatedSection key={i} delay={delay}>
              <div className="bg-sf-dark-alt rounded-xl p-6 border border-sf-steel/10 text-center">
                <div className="text-sm text-sf-muted mb-2">
                  delay: {delay}s
                </div>
                <div className="text-sf-white font-bold">
                  Animated Section {i + 1}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <h3 className="text-lg font-bold text-sf-white mb-6">Float Animation</h3>
        <div className="flex items-center justify-center gap-8 py-10 mb-10 bg-sf-dark rounded-xl border border-sf-steel/10">
          {[
            { var: "var(--brand-primary)", cls: "sf-orange" },
            { var: "var(--brand-secondary)", cls: "sf-cyan" },
            { var: "var(--brand-steel)", cls: "sf-steel" },
          ].map((color, i) => (
            <motion.div
              key={i}
              className="rounded-md"
              style={{
                width: 60,
                height: 60,
                background: `linear-gradient(135deg, color-mix(in srgb, ${color.var} 80%, transparent), color-mix(in srgb, ${color.var} 40%, transparent))`,
                border: `1px solid color-mix(in srgb, ${color.var} 25%, transparent)`,
                boxShadow: `0 0 20px color-mix(in srgb, ${color.var} 15%, transparent)`,
              }}
              animate={{ y: [0, -12, 0] }}
              transition={{
                duration: 3,
                delay: i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <h3 className="text-lg font-bold text-sf-white mb-6">Glow Pulse</h3>
        <div className="flex items-center justify-center py-10 mb-10 bg-sf-dark rounded-xl border border-sf-steel/10">
          <motion.div
            className="w-4 h-4 rounded-full bg-sf-orange"
            animate={{
              boxShadow: [
                "0 0 20px color-mix(in srgb, var(--brand-primary) 15%, transparent)",
                "0 0 40px color-mix(in srgb, var(--brand-primary) 25%, transparent)",
                "0 0 20px color-mix(in srgb, var(--brand-primary) 15%, transparent)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="ml-4 text-sm text-sf-muted">
            Used for the &quot;Systems Building Systems&quot; badge indicator
          </span>
        </div>
      </Section>

      {/* ===== SPACING & LAYOUT ===== */}
      <Section title="Spacing & Layout" id="layout">
        <h3 className="text-lg font-bold text-sf-white mb-4">Container</h3>
        <div className="mb-10">
          <div className="bg-sf-orange/10 border border-sf-orange/30 rounded-lg p-4 mb-2">
            <div className="container-page bg-sf-orange/20 rounded p-4 text-center text-sm text-sf-orange font-mono">
              .container-page — max-w-6xl mx-auto px-4 sm:px-6 lg:px-8
            </div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-sf-white mb-4">Grid Patterns</h3>
        <div className="space-y-6">
          <div>
            <p className="text-xs font-mono text-sf-muted mb-2">2-column grid (platform cards)</p>
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-sf-dark-alt rounded-lg p-4 border border-sf-steel/10 text-center text-sm text-sf-muted">
                  Card {n}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-mono text-sf-muted mb-2">3-column grid (service cards)</p>
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-sf-dark-alt rounded-lg p-4 border border-sf-steel/10 text-center text-sm text-sf-muted">
                  Card {n}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-mono text-sf-muted mb-2">4-column grid (stats)</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-sf-dark-alt rounded-lg p-4 border border-sf-steel/10 text-center text-sm text-sf-muted">
                  Stat {n}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ===== CARD PATTERNS ===== */}
      <Section title="Card Patterns" id="cards">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-sf-dark-alt rounded-xl p-7 border border-sf-steel/10">
            <h4 className="text-sm font-bold text-sf-white mb-2">Default Card</h4>
            <p className="text-xs text-sf-muted">
              bg-sf-dark-alt with border-sf-steel/10. Standard container for content.
            </p>
          </div>
          <div className="bg-sf-dark-alt rounded-xl p-7 border border-sf-orange/30 shadow-lg">
            <h4 className="text-sm font-bold text-sf-white mb-2">Hover State</h4>
            <p className="text-xs text-sf-muted">
              border-sf-orange/30 with shadow-lg. Active or highlighted state.
            </p>
          </div>
          <div className="bg-sf-dark rounded-xl p-7 border border-sf-steel/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-sf-cyan" />
            <h4 className="text-sm font-bold text-sf-white mb-2">Accent Card</h4>
            <p className="text-xs text-sf-muted">
              Top accent bar using team/section color. Used for team member cards.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== TAGS / CODE ===== */}
      <Section title="Tags & Code" id="tags">
        <h3 className="text-lg font-bold text-sf-white mb-4">Service Tags</h3>
        <div className="flex flex-wrap gap-3 mb-8">
          {["CORE", "GEO", "MEDIA", "INTEL", "FINANCE", "DOCS"].map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-semibold tracking-[2px] text-sf-cyan bg-sf-cyan/10 px-3 py-1.5 rounded font-mono"
            >
              {tag}
            </span>
          ))}
        </div>

        <h3 className="text-lg font-bold text-sf-white mb-4">Inline Code</h3>
        <p className="text-sf-steel mb-4">
          Use <code className="bg-sf-dark-alt px-1.5 py-0.5 rounded text-sm font-mono text-sf-cyan">inline code</code> for
          technical terms like <code className="bg-sf-dark-alt px-1.5 py-0.5 rounded text-sm font-mono text-sf-cyan">API endpoints</code> or
          variable names.
        </p>

        <h3 className="text-lg font-bold text-sf-white mb-4">Code Block</h3>
        <pre className="bg-sf-blue text-sf-white p-6 rounded-lg overflow-x-auto font-mono text-sm leading-relaxed">
{`const site = {
  name: "bradley.io",
  thesis: "Frontier Technologist",
  projects: 84,
  streak: "42 days",
}`}
        </pre>
      </Section>
    </div>
  )
}
