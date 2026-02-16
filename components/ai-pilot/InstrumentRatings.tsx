"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import type { InstrumentRating } from "./types";

interface InstrumentRatingsProps {
  ratings: Record<string, InstrumentRating>;
}

const DOMAIN_COLORS: Record<string, string> = {
  "Data Engineering": "bg-blue-500",
  Frontend: "bg-teal-500",
  Backend: "bg-emerald-500",
  DevOps: "bg-orange-500",
  "IoT / Edge": "bg-pink-500",
  "AI / ML": "bg-purple-500",
  Systems: "bg-slate-500",
  Security: "bg-red-500",
};

export function InstrumentRatings({ ratings }: InstrumentRatingsProps) {
  const sorted = Object.entries(ratings).sort(
    ([, a], [, b]) => b.score - a.score
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        Domain Instrument Ratings
      </h3>
      {sorted.map(([domain, rating], index) => (
        <motion.div
          key={domain}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="space-y-1.5"
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${DOMAIN_COLORS[domain] || "bg-primary"}`}
              />
              <span className="font-medium">{domain}</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {rating.score}/100
            </span>
          </div>
          <Progress value={rating.score} className="h-2" />
          {rating.matchedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {rating.matchedKeywords.slice(0, 5).map((kw) => (
                <span
                  key={kw}
                  className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
                >
                  {kw}
                </span>
              ))}
              {rating.matchedKeywords.length > 5 && (
                <span className="text-[10px] text-muted-foreground">
                  +{rating.matchedKeywords.length - 5} more
                </span>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
