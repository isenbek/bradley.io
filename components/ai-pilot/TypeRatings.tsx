"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TypeRating } from "./types";

interface TypeRatingsProps {
  ratings: TypeRating[];
}

const PROFICIENCY_COLORS: Record<string, string> = {
  Expert: "bg-primary text-primary-foreground",
  Proficient: "bg-teal-100 text-teal-800",
  Familiar: "bg-blue-100 text-blue-800",
  Exposure: "bg-slate-100 text-slate-700",
};

function formatTokens(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

export function TypeRatings({ ratings }: TypeRatingsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        Model Type Ratings
      </h3>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {ratings.map((rating, i) => (
          <motion.div
            key={rating.modelId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-mono text-sm font-bold">
                      {rating.displayName}
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">
                      {rating.modelId}
                    </p>
                  </div>
                  <Badge
                    className={`text-[10px] ${PROFICIENCY_COLORS[rating.proficiency] || ""}`}
                  >
                    {rating.proficiency}
                  </Badge>
                </div>

                {/* Circular progress ring */}
                <div className="flex items-center justify-center my-3">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="var(--color-muted)"
                        strokeWidth="2.5"
                      />
                      <motion.circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="#0f4c75"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={`${rating.costShare * 0.974} 97.4`}
                        initial={{ strokeDasharray: "0 97.4" }}
                        animate={{
                          strokeDasharray: `${rating.costShare * 0.974} 97.4`,
                        }}
                        transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-mono text-sm font-bold">
                        {rating.costShare}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Token stats */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Input</span>
                    <span className="font-mono">
                      {formatTokens(rating.inputTokens)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Output</span>
                    <span className="font-mono">
                      {formatTokens(rating.outputTokens)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cache Read</span>
                    <span className="font-mono">
                      {formatTokens(rating.cacheReadTokens)}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">Cost</span>
                    <span className="font-mono">${rating.costUSD.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
