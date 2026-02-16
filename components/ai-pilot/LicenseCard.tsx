"use client";

import { motion } from "framer-motion";
import type { LicenseData } from "./types";
import { FlightHoursCounter } from "./FlightHoursCounter";

interface LicenseCardProps {
  license: LicenseData;
}

const CLASS_COLORS: Record<string, string> = {
  ATP: "text-amber-500",
  Commercial: "text-teal-500",
  Private: "text-blue-500",
  Student: "text-slate-500",
};

export function LicenseCard({ license }: LicenseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-1"
    >
      {/* Inner card */}
      <div className="rounded-xl bg-background/80 backdrop-blur p-6 md:p-8">
        {/* Header */}
        <div className="text-center border-b border-primary/20 pb-4 mb-6">
          <div className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-muted-foreground font-mono">
            Federal AI Aviation Authority
          </div>
          <h2 className="text-lg md:text-xl font-bold mt-1 tracking-tight">
            AI Pilot License
          </h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="font-mono text-sm text-muted-foreground">
              {license.number}
            </span>
            <span
              className={`font-mono text-sm font-bold ${CLASS_COLORS[license.class] || "text-primary"}`}
            >
              CLASS {license.class}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <FlightHoursCounter
            value={license.totalSessions}
            label="Flight Sessions"
          />
          <FlightHoursCounter
            value={license.totalMessages}
            label="Total Messages"
          />
          <FlightHoursCounter
            value={license.totalCostUSD}
            label="API Investment"
            prefix="$"
            decimals={0}
          />
          <FlightHoursCounter
            value={license.projectCount}
            label="Projects"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-primary/20 text-xs text-muted-foreground font-mono">
          <div>
            <span className="uppercase tracking-wide">Issued: </span>
            {license.issued}
          </div>
          <div>
            <span className="uppercase tracking-wide">Expires: </span>
            {license.expires}
          </div>
          <div>
            <span className="uppercase tracking-wide">Models: </span>
            {license.modelCount}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
