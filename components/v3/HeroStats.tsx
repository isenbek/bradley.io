"use client"

import { useEffect, useRef, useState } from "react"

interface SiteStats {
  totalProjects: number
  totalSessions: number
  totalMessages: number
  activeDays: number
  streak: number
}

/** Animate a number to its target on first viewport entry. */
function Counter({
  end,
  duration = 1800,
  suffix = "",
}: {
  end: number
  duration?: number
  suffix?: string
}) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        let start = 0
        const step = end / (duration / 16)
        const tick = () => {
          start += step
          if (start >= end) {
            setVal(end)
            return
          }
          setVal(Math.floor(start))
          requestAnimationFrame(tick)
        }
        tick()
        obs.disconnect()
      },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration])

  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  )
}

export function HeroStats({ stats }: { stats?: SiteStats }) {
  const tiles: { val: number; suffix?: string; label: string; color: string }[] = [
    {
      val: stats?.totalProjects ?? 0,
      label: "Projects",
      color: "var(--v3-blue-700)",
    },
    {
      val: stats?.totalSessions ?? 0,
      label: "AI Sessions",
      color: "var(--v3-coral-dk)",
    },
    {
      val: stats?.totalMessages ?? 0,
      label: "Messages",
      color: "var(--v3-blue-700)",
    },
    {
      val: stats?.activeDays ?? 0,
      label: "Active Days",
      color: "var(--v3-green-dk)",
    },
    {
      val: stats?.streak ?? 0,
      suffix: "d",
      label: "Streak",
      color: "var(--v3-gold-dk)",
    },
  ]

  return (
    <div className="v3-statbar v3-herostats">
      {tiles.map((t) => (
        <div key={t.label} className="v3-statbar__cell">
          <div
            className="v3-statbar__val"
            style={{ color: t.color }}
          >
            <Counter end={t.val} suffix={t.suffix} />
          </div>
          <div className="v3-statbar__lbl">{t.label}</div>
        </div>
      ))}
    </div>
  )
}
