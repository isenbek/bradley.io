"use client";

import { motion } from "framer-motion";
import type { LicenseData } from "./types";
import { FlightHoursCounter } from "./FlightHoursCounter";

interface LicenseCardProps {
  license: LicenseData;
}

const CLASS_COLORS: Record<string, string> = {
  ATP: "var(--brand-warning)",
  Commercial: "var(--brand-secondary)",
  Private: "var(--brand-info)",
  Student: "var(--brand-steel)",
};

export function LicenseCard({ license }: LicenseCardProps) {
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
          <div className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.3em] uppercase font-mono" style={{ color: "var(--brand-muted)" }}>
            Federal AI Aviation Authority
          </div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold mt-1 tracking-tight">
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

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <FlightHoursCounter value={license.totalSessions} label="Flight Sessions" />
          <FlightHoursCounter value={license.totalMessages} label="Total Messages" />
          <FlightHoursCounter value={license.totalCostUSD} label="API Investment" prefix="$" decimals={0} />
          <FlightHoursCounter value={license.projectCount} label="Projects" />
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
        </div>
      </div>
    </motion.div>
  );
}
