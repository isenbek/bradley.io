"use client";

import { motion } from "framer-motion";
import type { LicenseData, HourlyDistribution } from "./types";
import { FlightHoursCounter } from "./FlightHoursCounter";
import { timeAgo } from "@/lib/time-ago";

interface LicenseCardProps {
  license: LicenseData;
  generated?: string;
  hourlyDistribution?: HourlyDistribution;
}

const CLASS_COLORS: Record<string, string> = {
  ATP: "var(--brand-warning)",
  Commercial: "var(--brand-secondary)",
  Private: "var(--brand-info)",
  Student: "var(--brand-steel)",
};

function Sparkline({ hours }: { hours: { hour: number; count: number }[] }) {
  const max = Math.max(...hours.map((h) => h.count), 1);
  const now = new Date().getHours();
  return (
    <div className="flex items-end gap-px h-6" title="24hr activity distribution">
      {hours.map((h) => {
        const pct = Math.max(2, (h.count / max) * 100);
        const isNow = h.hour === now;
        return (
          <div
            key={h.hour}
            className="flex-1 rounded-t-sm transition-all"
            style={{
              height: `${pct}%`,
              background: isNow
                ? "var(--brand-primary)"
                : h.count > 0
                  ? "color-mix(in srgb, var(--brand-primary) 40%, transparent)"
                  : "color-mix(in srgb, var(--brand-border) 40%, transparent)",
              boxShadow: isNow ? "0 0 4px var(--brand-primary)" : "none",
            }}
          />
        );
      })}
    </div>
  );
}

function AirtimeRing({ hours }: { hours: { hour: number; count: number }[] }) {
  const total = hours.reduce((s, h) => s + h.count, 0) || 1;
  const activeHours = hours.filter((h) => h.count > 0).length;
  const pct = Math.round((activeHours / 24) * 100);
  const r = 14;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - activeHours / 24);
  return (
    <div className="flex items-center gap-2" title={`${activeHours}/24 hours active (${total} total interactions)`}>
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle
          cx="18" cy="18" r={r}
          fill="none"
          stroke="color-mix(in srgb, var(--brand-border) 50%, transparent)"
          strokeWidth="3"
        />
        <circle
          cx="18" cy="18" r={r}
          fill="none"
          stroke="var(--brand-primary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 18 18)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x="18" y="18"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="8"
          fontFamily="var(--font-mono)"
          fontWeight="bold"
          fill="var(--brand-primary)"
        >
          {pct}%
        </text>
      </svg>
      <div className="text-[10px] font-mono leading-tight" style={{ color: "var(--brand-muted)" }}>
        <div style={{ color: "var(--brand-text)" }}>{activeHours}h airtime</div>
        <div>of 24h cycle</div>
      </div>
    </div>
  );
}

export function LicenseCard({ license, generated, hourlyDistribution }: LicenseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl p-1"
      style={{
        border: "2px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)",
        background: "linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 5%, var(--brand-bg)), var(--brand-bg-alt))",
      }}
    >
      <div
        className="rounded-xl backdrop-blur p-4 sm:p-6 md:p-8"
        style={{ background: "color-mix(in srgb, var(--brand-bg) 80%, transparent)" }}
      >
        {/* Header */}
        <div
          className="text-center pb-3 mb-4 sm:pb-4 sm:mb-6"
          style={{ borderBottom: "1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)" }}
        >
          <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight">
            AI Pilot License
          </h2>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-1.5 sm:mt-2">
            <span className="font-mono text-xs sm:text-sm" style={{ color: "var(--brand-muted)" }}>
              {license.number}
            </span>
            <span
              className="font-mono text-xs sm:text-sm font-bold"
              style={{ color: CLASS_COLORS[license.class] || "var(--brand-primary)" }}
            >
              CLASS {license.class}
            </span>
          </div>
        </div>

        {/* Sparkline row */}
        {hourlyDistribution && (
          <div
            className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 px-2 py-2.5 rounded-lg"
            style={{ background: "color-mix(in srgb, var(--brand-border) 15%, transparent)" }}
          >
            {hourlyDistribution && (
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: "var(--brand-muted)" }}>
                  24hr pattern
                </div>
                <Sparkline hours={hourlyDistribution.hours} />
              </div>
            )}
            {hourlyDistribution && (
              <div className="flex-shrink-0">
                <AirtimeRing hours={hourlyDistribution.hours} />
              </div>
            )}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          <FlightHoursCounter value={license.projectCount} label="Projects" />
          <FlightHoursCounter value={license.totalSessions} label="Sessions" />
          <FlightHoursCounter value={license.totalMessages} label="Messages" />
        </div>

        {/* Footer */}
        <div
          className="flex flex-wrap items-center justify-center sm:justify-between gap-2 sm:gap-0 mt-4 pt-3 sm:mt-6 sm:pt-4 text-[10px] sm:text-xs font-mono"
          style={{
            borderTop: "1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent)",
            color: "var(--brand-muted)",
          }}
        >
          <div><span className="uppercase tracking-wide">Issued: </span>{license.issued}</div>
          <div><span className="uppercase tracking-wide">Expires: </span>{license.expires}</div>
          <div><span className="uppercase tracking-wide">Models: </span>{license.modelCount}</div>
          {generated && (
            <div className="opacity-60">updated {timeAgo(generated)}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
