"use client";

import { motion } from "framer-motion";
import { Flame, Trophy, Calendar } from "lucide-react";
import type { StreakData } from "./types";

interface StreakBannerProps {
  streaks: StreakData;
}

export function StreakBanner({ streaks }: StreakBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 md:gap-8 rounded-lg px-3 py-2 sm:px-4 sm:py-3"
      style={{
        background: "color-mix(in srgb, var(--brand-bg-alt) 60%, transparent)",
        border: "1px solid var(--brand-border)",
      }}
    >
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4" style={{ color: "var(--brand-warning)" }} />
        <span className="text-xs sm:text-sm font-medium">
          <span className="font-mono font-bold" style={{ color: "var(--brand-primary)" }}>
            {streaks.current}
          </span>{" "}
          day streak
        </span>
      </div>

      <div className="hidden sm:block h-4 w-px" style={{ background: "var(--brand-border)" }} />

      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4" style={{ color: "var(--brand-warning)" }} />
        <span className="text-xs sm:text-sm font-medium">
          <span className="font-mono font-bold" style={{ color: "var(--brand-primary)" }}>
            {streaks.longest}
          </span>{" "}
          longest streak
        </span>
      </div>

      <div className="hidden sm:block h-4 w-px" style={{ background: "var(--brand-border)" }} />

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" style={{ color: "var(--brand-secondary)" }} />
        <span className="text-xs sm:text-sm font-medium">
          <span className="font-mono font-bold" style={{ color: "var(--brand-primary)" }}>
            {streaks.totalActiveDays}
          </span>{" "}
          active days
        </span>
      </div>

      {streaks.peakDayCount > 0 && (
        <>
          <div className="hidden md:block h-4 w-px" style={{ background: "var(--brand-border)" }} />
          <div className="text-sm" style={{ color: "var(--brand-muted)" }}>
            Peak:{" "}
            <span className="font-mono font-bold" style={{ color: "var(--brand-primary)" }}>
              {streaks.peakDayCount.toLocaleString()}
            </span>{" "}
            msgs on {streaks.peakDay}
          </div>
        </>
      )}
    </motion.div>
  );
}
