"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { HeatmapDay } from "./types";

interface ActivityHeatmapProps {
  data: HeatmapDay[];
}

const CELL_SIZE = 12;
const CELL_GAP = 2;
const INTENSITY_COLORS = [
  "var(--color-muted)",
  "#9ae6b4",
  "#48bb78",
  "#2f855a",
  "#0f4c75",
];

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    day: HeatmapDay;
  } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Parse dates and organize by week
    const days = data.map((d) => ({
      ...d,
      date: new Date(d.date + "T00:00:00"),
    }));

    // Sort by date
    days.sort((a, b) => a.date.getTime() - b.date.getTime());

    const firstDate = days[0].date;
    const lastDate = days[days.length - 1].date;

    // Calculate weeks from first date
    const firstWeek = d3.timeWeek.floor(firstDate);
    const numWeeks =
      d3.timeWeek.count(firstWeek, d3.timeWeek.ceil(lastDate)) + 1;

    const width = numWeeks * (CELL_SIZE + CELL_GAP) + 40;
    const height = 7 * (CELL_SIZE + CELL_GAP) + 30;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Day labels
    const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
    svg
      .selectAll(".day-label")
      .data(dayLabels)
      .enter()
      .append("text")
      .attr("x", 0)
      .attr("y", (_, i) => i * (CELL_SIZE + CELL_GAP) + 25 + CELL_SIZE / 2)
      .attr("text-anchor", "start")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "9px")
      .attr("fill", "currentColor")
      .attr("opacity", 0.5)
      .text((d) => d);

    // Month labels
    const months = d3.timeMonths(firstDate, lastDate);
    svg
      .selectAll(".month-label")
      .data(months)
      .enter()
      .append("text")
      .attr("x", (d) => {
        const weekOffset = d3.timeWeek.count(firstWeek, d);
        return weekOffset * (CELL_SIZE + CELL_GAP) + 30;
      })
      .attr("y", 12)
      .attr("font-size", "9px")
      .attr("fill", "currentColor")
      .attr("opacity", 0.5)
      .text((d) => d3.timeFormat("%b")(d));

    // Create a map for quick lookup (use original data to keep date as string)
    const dayMap = new Map(
      data.map((d) => [d.date, d])
    );

    // Generate all dates in range
    const allDates = d3.timeDays(firstDate, d3.timeDay.offset(lastDate, 1));

    // Draw cells
    svg
      .selectAll(".day-cell")
      .data(allDates)
      .enter()
      .append("rect")
      .attr("x", (d) => {
        const weekOffset = d3.timeWeek.count(firstWeek, d);
        return weekOffset * (CELL_SIZE + CELL_GAP) + 30;
      })
      .attr("y", (d) => d.getDay() * (CELL_SIZE + CELL_GAP) + 20)
      .attr("width", CELL_SIZE)
      .attr("height", CELL_SIZE)
      .attr("rx", 2)
      .attr("fill", (d) => {
        const key = d3.timeFormat("%Y-%m-%d")(d);
        const dayData = dayMap.get(key);
        return INTENSITY_COLORS[dayData?.intensity ?? 0];
      })
      .attr("stroke", "var(--color-border)")
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        const key = d3.timeFormat("%Y-%m-%d")(d);
        const dayData = dayMap.get(key);
        if (dayData) {
          const rect = (event.target as SVGRectElement).getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (containerRect) {
            setTooltip({
              x: rect.left - containerRect.left + CELL_SIZE / 2,
              y: rect.top - containerRect.top - 4,
              day: dayData,
            });
          }
        }
      })
      .on("mouseleave", () => setTooltip(null));
  }, [data]);

  return (
    <div ref={containerRef} className="relative">
      <div className="overflow-x-auto pb-2">
        <svg
          ref={svgRef}
          className="w-full min-w-[600px]"
          style={{ height: "auto" }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2 text-xs text-muted-foreground">
        <span>Less</span>
        {INTENSITY_COLORS.map((color, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none bg-popover text-popover-foreground border rounded-md shadow-md px-3 py-2 text-xs -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-mono font-bold">{tooltip.day.date}</div>
          <div>
            {tooltip.day.count.toLocaleString()} messages
          </div>
          <div>{tooltip.day.sessions} sessions</div>
          <div>{tooltip.day.toolCalls.toLocaleString()} tool calls</div>
        </div>
      )}
    </div>
  );
}
