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
      className="flex flex-wrap items-center justify-center gap-4 md:gap-8 rounded-lg border bg-muted/30 px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-medium">
          <span className="font-mono font-bold text-primary">
            {streaks.current}
          </span>{" "}
          day streak
        </span>
      </div>

      <div className="hidden sm:block h-4 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium">
          <span className="font-mono font-bold text-primary">
            {streaks.longest}
          </span>{" "}
          longest streak
        </span>
      </div>

      <div className="hidden sm:block h-4 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-teal-500" />
        <span className="text-sm font-medium">
          <span className="font-mono font-bold text-primary">
            {streaks.totalActiveDays}
          </span>{" "}
          active days
        </span>
      </div>

      {streaks.peakDayCount > 0 && (
        <>
          <div className="hidden md:block h-4 w-px bg-border" />
          <div className="text-sm text-muted-foreground">
            Peak:{" "}
            <span className="font-mono font-bold text-primary">
              {streaks.peakDayCount.toLocaleString()}
            </span>{" "}
            msgs on {streaks.peakDay}
          </div>
        </>
      )}
    </motion.div>
  );
}
