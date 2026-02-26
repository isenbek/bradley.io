"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"
import Link from "next/link"
import {
  ArrowRight, Bot, MessageSquare, GitBranch, Flame,
} from "lucide-react"
import type { SiteData, ActivityItem as ActivityItemType, Project } from "@/lib/site-data"
import { categoryMap } from "@/lib/project-categories"
import { ClaudeCorner } from "@/components/home/ClaudeCorner"
import { BigIdeas } from "@/components/home/BigIdeas"

// --- Particle Grid Background (theme-aware) ---
function ParticleGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    const resize = () => {
      canvas.width = canvas.offsetWidth * 2
      canvas.height = canvas.offsetHeight * 2
      ctx.scale(2, 2)
    }
    resize()
    window.addEventListener("resize", resize)

    const dots = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }))

    const draw = () => {
      const style = getComputedStyle(document.documentElement)
      const rgb = style.getPropertyValue("--brand-particle").trim()

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
      dots.forEach((d) => {
        d.x += d.vx
        d.y += d.vy
        if (d.x < 0 || d.x > canvas.offsetWidth) d.vx *= -1
        if (d.y < 0 || d.y > canvas.offsetHeight) d.vy *= -1
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb}, 0.25)`
        ctx.fill()
      })
      dots.forEach((a, i) => {
        dots.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(${rgb}, ${(1 - dist / 120) * 0.15})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />
}

// --- Animated Counter ---
function Counter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          let start = 0
          const step = end / (duration / 16)
          const tick = () => {
            start += step
            if (start >= end) { setVal(end); return }
            setVal(Math.floor(start))
            requestAnimationFrame(tick)
          }
          tick()
          obs.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration])

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

// --- Section Fade-In ---
function FadeSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// --- Activity Feed Item ---
function ActivityFeedItem({ item }: { item: ActivityItemType }) {
  const typeIcons: Record<string, React.ReactNode> = {
    "claude-code": <Bot className="w-4 h-4" style={{ color: "var(--brand-primary)" }} />,
    "claude-web": <MessageSquare className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} />,
    "github": <GitBranch className="w-4 h-4" style={{ color: "var(--brand-steel)" }} />,
    "milestone": <Flame className="w-4 h-4" style={{ color: "var(--brand-warning)" }} />,
  }

  const cat = item.category ? categoryMap[item.category] : null
  const timeAgo = getTimeAgo(item.date)

  return (
    <div
      className="flex items-start gap-3 py-3"
      style={{ borderBottom: "1px solid var(--brand-border)" }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: "color-mix(in srgb, var(--brand-primary) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--brand-primary) 15%, transparent)",
        }}
      >
        {typeIcons[item.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold truncate">{item.title}</span>
          {cat && (
            <span
              className="text-[9px] font-semibold uppercase tracking-[1.5px] px-1.5 py-0.5 rounded font-mono shrink-0 hidden sm:inline"
              style={{
                color: cat.color,
                background: `color-mix(in srgb, ${cat.color} 10%, transparent)`,
              }}
            >
              {cat.label}
            </span>
          )}
        </div>
        <p className="text-[13px] leading-relaxed line-clamp-1 sm:line-clamp-2" style={{ color: "var(--brand-muted)" }}>
          {item.description}
        </p>
      </div>
      <span className="text-[11px] font-mono shrink-0 mt-1 hidden sm:block" style={{ color: "var(--brand-muted)" }}>
        {timeAgo}
      </span>
    </div>
  )
}

// --- Featured Project Card ---
function FeaturedCard({ project }: { project: Project }) {
  const cat = categoryMap[project.category]

  return (
    <Link href={`/projects/${project.slug}`} className="block group">
      <div
        className="rounded-xl overflow-hidden hover:-translate-y-1 transition-all h-full"
        style={{
          background: "var(--brand-bg-alt)",
          border: "1px solid var(--brand-border)",
        }}
      >
        <div className="h-[3px] w-full" style={{ background: cat.color }} />
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[9px] font-semibold uppercase tracking-[2px] font-mono"
              style={{ color: cat.color }}
            >
              {cat.label}
            </span>
            <span className="text-[10px] font-mono" style={{ color: "var(--brand-muted)" }}>
              {project.totalMessages.toLocaleString()} msgs
            </span>
          </div>
          <h3 className="text-base font-bold mb-1 group-hover:text-[var(--brand-primary)] transition-colors">
            {project.name}
          </h3>
          <p className="text-[13px] line-clamp-2" style={{ color: "var(--brand-muted)" }}>
            {project.tagline}
          </p>
        </div>
      </div>
    </Link>
  )
}

// --- Time Ago Helper ---
function getTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return "just now"
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// --- Main Page ---
export default function HomePage() {
  const [data, setData] = useState<SiteData | null>(null)

  useEffect(() => {
    fetch("/data/site-data.json")
      .then((r) => r.json())
      .then(setData)
  }, [])

  const stats = data?.stats
  const feed = data?.activityFeed || []
  const featured = data?.projects.filter((p) => p.isFeatured) || []

  return (
    <div className="-mt-16 overflow-x-hidden">
      {/* ===== HERO ===== */}
      <section className="relative min-h-svh flex items-center overflow-hidden">
        <ParticleGrid />
        {/* Glow orbs — hidden on mobile to prevent overflow */}
        <div
          className="absolute top-[10%] right-[15%] w-[300px] h-[300px] rounded-full blur-[60px] hidden sm:block"
          style={{ background: `radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 7%, transparent), transparent 70%)` }}
        />
        <div
          className="absolute bottom-[20%] left-[10%] w-[200px] h-[200px] rounded-full blur-[50px] hidden sm:block"
          style={{ background: `radial-gradient(circle, color-mix(in srgb, var(--brand-secondary) 6%, transparent), transparent 70%)` }}
        />

        <div className="relative z-10 container-page w-full py-24 sm:py-32">
          <FadeSection>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 sm:mb-6 text-xs sm:text-sm font-medium"
              style={{
                background: "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)",
                color: "var(--brand-primary)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--brand-primary)" }} />
              Frontier Technologist
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-4 sm:mb-6">
              Hardware hacker.
              <br />
              <span style={{ color: "var(--brand-primary)" }}>Data architect.</span>
              <br />
              <span style={{ color: "var(--brand-secondary)" }}>AI pilot.</span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed max-w-[560px] mb-8 sm:mb-10" style={{ color: "var(--brand-steel)" }}>
              Building at the intersection of enterprise scale and maker culture — from
              ESP32 mesh networks to Fortune 500 data warehouses, with Claude as co-pilot.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/projects"
                className="px-6 py-3 sm:px-8 sm:py-3.5 rounded-lg text-sm sm:text-base font-semibold text-center transition-all"
                style={{
                  background: "var(--brand-primary)",
                  color: "var(--brand-bg)",
                }}
              >
                View Projects <ArrowRight className="inline w-4 h-4 ml-1" />
              </Link>
              <Link
                href="/ai-pilot"
                className="px-6 py-3 sm:px-8 sm:py-3.5 rounded-lg text-sm sm:text-base font-medium text-center transition-all"
                style={{
                  border: "1px solid color-mix(in srgb, var(--brand-secondary) 30%, transparent)",
                  color: "var(--brand-secondary)",
                }}
              >
                AI Pilot Dashboard <ArrowRight className="inline w-4 h-4 ml-1" />
              </Link>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ===== BIG IDEAS ===== */}
      <BigIdeas ideas={data?.bigIdeas} />

      {/* ===== HERO STATS ===== */}
      <section
        className="py-6 sm:py-10"
        style={{ background: "var(--brand-bg-alt)", borderTop: "1px solid var(--brand-border)", borderBottom: "1px solid var(--brand-border)" }}
      >
        <div className="container-page grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-8 text-center">
          {[
            { val: stats?.totalProjects || 12, suffix: "", label: "Projects" },
            { val: stats?.totalSessions || 847, suffix: "", label: "Sessions" },
            { val: stats?.totalMessages || 24300, suffix: "", label: "Messages", hideOnMobile: true },
            { val: stats?.activeDays || 189, suffix: "", label: "Active Days", hideOnMobile: true },
            { val: stats?.streak || 14, suffix: "d", label: "Streak" },
          ].map((s, i) => (
            <div key={i} className={s.hideOnMobile ? "hidden sm:block" : ""}>
              <div
                className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight tabular-nums"
                style={{ color: i % 2 === 0 ? "var(--brand-primary)" : "var(--brand-secondary)" }}
              >
                <Counter end={s.val} suffix={s.suffix} />
              </div>
              <div className="text-[10px] sm:text-xs font-medium mt-0.5 uppercase tracking-widest" style={{ color: "var(--brand-muted)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ACTIVITY FEED ===== */}
      <section className="py-10 sm:py-16">
        <div className="container-page">
          <FadeSection className="mb-6 sm:mb-10">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[3px] mb-1" style={{ color: "var(--brand-primary)" }}>
                  Activity
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                  Recent work.
                </h2>
              </div>
              <Link
                href="/projects"
                className="text-sm font-semibold hover:underline hidden sm:flex items-center gap-1"
                style={{ color: "var(--brand-secondary)" }}
              >
                All projects <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeSection>

          <FadeSection>
            <div>
              {feed.length === 0 ? (
                <div className="py-8 text-center" style={{ color: "var(--brand-muted)" }}>
                  Loading activity...
                </div>
              ) : (
                feed.slice(0, 15).map((item, i) => <ActivityFeedItem key={i} item={item} />)
              )}
            </div>
            {feed.length > 15 && (
              <Link
                href="/projects"
                className="block text-center text-sm font-semibold mt-4 py-3 rounded-lg transition-colors"
                style={{
                  color: "var(--brand-primary)",
                  background: "color-mix(in srgb, var(--brand-primary) 5%, transparent)",
                }}
              >
                View all activity <ArrowRight className="inline w-4 h-4 ml-1" />
              </Link>
            )}
          </FadeSection>
        </div>
      </section>

      {/* ===== CLAUDE'S CORNER ===== */}
      {data?.claudeCorner && (
        <section className="py-10 sm:py-16">
          <div className="container-page">
            <FadeSection>
              <ClaudeCorner data={data.claudeCorner} />
            </FadeSection>
          </div>
        </section>
      )}

      {/* ===== FEATURED PROJECTS ===== */}
      <section className="py-10 sm:py-16" style={{ background: "var(--brand-bg-alt)" }}>
        <div className="container-page">
          <FadeSection className="mb-6 sm:mb-10">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[3px] mb-1" style={{ color: "var(--brand-secondary)" }}>
                  Featured
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                  Active projects.
                </h2>
              </div>
              <Link
                href="/projects"
                className="text-sm font-semibold hover:underline hidden sm:flex items-center gap-1"
                style={{ color: "var(--brand-primary)" }}
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeSection>

          <FadeSection>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.length === 0 ? (
                <div className="col-span-3 py-8 text-center" style={{ color: "var(--brand-muted)" }}>
                  Loading projects...
                </div>
              ) : (
                featured.map((project) => <FeaturedCard key={project.slug} project={project} />)
              )}
            </div>
          </FadeSection>
        </div>
      </section>

    </div>
  )
}
