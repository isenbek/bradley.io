"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import * as d3 from "d3"
import type { CommitDay } from "@/lib/nominate-timeline-types"

interface CommitHeatmapProps {
  data: CommitDay[]
}

const INTENSITY_COLORS = [
  "var(--brand-border)",
  "color-mix(in srgb, var(--brand-primary) 20%, var(--brand-bg-alt))",
  "color-mix(in srgb, var(--brand-primary) 40%, var(--brand-bg-alt))",
  "color-mix(in srgb, var(--brand-primary) 65%, var(--brand-bg-alt))",
  "var(--brand-primary)",
]

export function CommitHeatmap({ data }: CommitHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    day: CommitDay
  } | null>(null)

  const draw = useCallback(() => {
    if (!svgRef.current || !wrapRef.current || !data.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const containerWidth = wrapRef.current.clientWidth

    const cutoff = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - 1)

    const days = data
      .map((d) => ({ ...d, date_obj: new Date(d.date + "T00:00:00") }))
      .filter((d) => d.date_obj >= cutoff)
      .sort((a, b) => a.date_obj.getTime() - b.date_obj.getTime())

    if (!days.length) return

    const firstDate = days[0].date_obj
    const lastDate = days[days.length - 1].date_obj
    const firstWeek = d3.timeWeek.floor(firstDate)
    const numWeeks =
      d3.timeWeek.count(firstWeek, d3.timeWeek.ceil(lastDate)) + 1

    const labelOffset = containerWidth < 400 ? 12 : 18
    const available = containerWidth - labelOffset - 4
    const cellPlusGap = Math.max(4, Math.floor(available / numWeeks))
    const gap = Math.max(1, Math.round(cellPlusGap * 0.18))
    const cell = cellPlusGap - gap

    const width = numWeeks * (cell + gap) + labelOffset + 2
    const height = 7 * (cell + gap) + (containerWidth < 400 ? 10 : 14)
    const topOffset = containerWidth < 400 ? 8 : 12
    const fontSize = cell <= 5 ? "5px" : cell <= 7 ? "6px" : "7px"

    svg.attr("viewBox", `0 0 ${width} ${height}`)
    svg.attr("width", width)
    svg.attr("height", height)

    if (cell >= 5) {
      const dayLabels = ["", "M", "", "W", "", "F", ""]
      svg
        .selectAll(".day-label")
        .data(dayLabels)
        .enter()
        .append("text")
        .attr("x", 0)
        .attr("y", (_, i) => i * (cell + gap) + topOffset + cell / 2)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "middle")
        .attr("font-size", fontSize)
        .attr("font-family", "var(--font-mono)")
        .style("fill", "var(--brand-muted)")
        .text((d) => d)
    }

    if (cell >= 5) {
      const months = d3.timeMonths(firstDate, lastDate)
      svg
        .selectAll(".month-label")
        .data(months)
        .enter()
        .append("text")
        .attr("x", (d) => {
          const weekOffset = d3.timeWeek.count(firstWeek, d)
          return weekOffset * (cell + gap) + labelOffset
        })
        .attr("y", topOffset - 4)
        .attr("font-size", fontSize)
        .attr("font-family", "var(--font-mono)")
        .style("fill", "var(--brand-muted)")
        .text((d) => d3.timeFormat("%b")(d))
    }

    const dayMap = new Map(data.map((d) => [d.date, d]))
    const allDates = d3.timeDays(firstDate, d3.timeDay.offset(lastDate, 1))

    svg
      .selectAll(".day-cell")
      .data(allDates)
      .enter()
      .append("rect")
      .attr("x", (d) => {
        const weekOffset = d3.timeWeek.count(firstWeek, d)
        return weekOffset * (cell + gap) + labelOffset
      })
      .attr("y", (d) => d.getDay() * (cell + gap) + topOffset)
      .attr("width", cell)
      .attr("height", cell)
      .attr("rx", cell <= 5 ? 1 : 2)
      .style("fill", (d) => {
        const key = d3.timeFormat("%Y-%m-%d")(d)
        const dayData = dayMap.get(key)
        return INTENSITY_COLORS[dayData?.intensity ?? 0]
      })
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        const key = d3.timeFormat("%Y-%m-%d")(d)
        const dayData = dayMap.get(key)
        if (dayData) {
          const rect = (
            event.target as SVGRectElement
          ).getBoundingClientRect()
          const containerRect =
            containerRef.current?.getBoundingClientRect()
          if (containerRect) {
            setTooltip({
              x: rect.left - containerRect.left + cell / 2,
              y: rect.top - containerRect.top - 4,
              day: dayData,
            })
          }
        }
      })
      .on("mouseleave", () => setTooltip(null))
  }, [data])

  useEffect(() => {
    draw()
    const observer = new ResizeObserver(draw)
    if (wrapRef.current) observer.observe(wrapRef.current)
    return () => observer.disconnect()
  }, [draw])

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl p-3 sm:p-5"
      style={{
        background: "var(--brand-bg-alt)",
        border: "1px solid var(--brand-border)",
      }}
    >
      <h3
        className="text-xs sm:text-sm font-medium mb-3"
        style={{ color: "var(--brand-muted)" }}
      >
        Commit Activity
      </h3>

      <div ref={wrapRef} className="overflow-x-auto">
        <svg ref={svgRef} className="w-full" style={{ display: "block" }} />
      </div>

      <div
        className="flex items-center justify-end gap-1 mt-2 text-[10px] font-mono"
        style={{ color: "var(--brand-muted)" }}
      >
        <span>Less</span>
        {INTENSITY_COLORS.map((color, i) => (
          <div
            key={i}
            className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
        <span>More</span>
      </div>

      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none rounded-md shadow-md px-3 py-2 text-xs -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            background: "var(--brand-bg-alt)",
            border: "1px solid var(--brand-border)",
            color: "var(--brand-text)",
          }}
        >
          <div className="font-mono font-bold">{tooltip.day.date}</div>
          <div>
            {tooltip.day.commits} commit{tooltip.day.commits !== 1 && "s"}
          </div>
          <div>
            {tooltip.day.repos} repo{tooltip.day.repos !== 1 && "s"}
          </div>
        </div>
      )}
    </div>
  )
}
