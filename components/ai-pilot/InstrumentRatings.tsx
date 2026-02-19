"use client";

import { motion } from "framer-motion";
import type { InstrumentRating } from "./types";

interface InstrumentRatingsProps {
  ratings: Record<string, InstrumentRating>;
}

const DOMAIN_COLORS: Record<string, string> = {
  "Data Engineering": "var(--brand-info)",
  Frontend: "var(--brand-secondary)",
  Backend: "var(--brand-success)",
  DevOps: "var(--brand-warning)",
  "IoT / Edge": "var(--brand-primary)",
  "AI / ML": "var(--brand-glow-secondary)",
  Systems: "var(--brand-steel)",
  Security: "var(--brand-error)",
};

export function InstrumentRatings({ ratings }: InstrumentRatingsProps) {
  const sorted = Object.entries(ratings).sort(([, a], [, b]) => b.score - a.score);

  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-xs sm:text-sm font-medium" style={{ color: "var(--brand-muted)" }}>
        Domain Instrument Ratings
      </h3>
      {sorted.map(([domain, rating], index) => {
        const color = DOMAIN_COLORS[domain] || "var(--brand-primary)";
        return (
          <motion.div
            key={domain}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="space-y-1.5"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                <span className="font-medium">{domain}</span>
              </div>
              <span className="font-mono text-xs" style={{ color: "var(--brand-muted)" }}>
                {rating.score}/100
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--brand-border)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${rating.score}%` }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              />
            </div>
            {rating.matchedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {rating.matchedKeywords.slice(0, 5).map((kw) => (
                  <span
                    key={kw}
                    className="inline-block rounded-full px-2 py-0.5 text-[10px] font-mono"
                    style={{
                      background: "color-mix(in srgb, var(--brand-steel) 15%, transparent)",
                      color: "var(--brand-muted)",
                    }}
                  >
                    {kw}
                  </span>
                ))}
                {rating.matchedKeywords.length > 5 && (
                  <span className="text-[10px]" style={{ color: "var(--brand-muted)" }}>
                    +{rating.matchedKeywords.length - 5} more
                  </span>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
