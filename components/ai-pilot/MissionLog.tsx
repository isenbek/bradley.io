"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, Folder, Activity, Archive } from "lucide-react";
import type { Mission } from "./types";

interface MissionLogProps {
  missions: Mission[];
}

type SortKey = "messages" | "sessions" | "complexity" | "name";

const STATUS_STYLES: Record<string, { icon: typeof Activity; color: string }> = {
  active: { icon: Activity, color: "var(--brand-success)" },
  recent: { icon: Activity, color: "var(--brand-warning)" },
  archived: { icon: Archive, color: "var(--brand-steel)" },
  unknown: { icon: Folder, color: "var(--brand-steel)" },
};

export function MissionLog({ missions }: MissionLogProps) {
  const [sortBy, setSortBy] = useState<SortKey>("messages");

  const sorted = [...missions].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return (b[sortBy] as number) - (a[sortBy] as number);
  });

  const toggleSort = () => {
    const keys: SortKey[] = ["messages", "sessions", "complexity", "name"];
    const idx = keys.indexOf(sortBy);
    setSortBy(keys[(idx + 1) % keys.length]);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-medium" style={{ color: "var(--brand-muted)" }}>
          Mission Log ({missions.length} projects)
        </h3>
        <button
          onClick={toggleSort}
          className="flex items-center gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-colors"
          style={{ color: "var(--brand-steel)", background: "color-mix(in srgb, var(--brand-steel) 10%, transparent)" }}
        >
          <ArrowUpDown className="h-3 w-3" />
          Sort: {sortBy}
        </button>
      </div>

      <div className="grid gap-2 sm:gap-3 md:grid-cols-2">
        {sorted.map((mission, i) => {
          const StatusIcon = STATUS_STYLES[mission.status]?.icon || Folder;
          const statusColor = STATUS_STYLES[mission.status]?.color || "var(--brand-steel)";

          return (
            <motion.div
              key={mission.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className="rounded-xl h-full"
              style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
            >
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <StatusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" style={{ color: statusColor }} />
                    <h4 className="font-mono text-xs sm:text-sm font-medium truncate">{mission.name}</h4>
                  </div>
                  <span
                    className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      border: "1px solid var(--brand-border)",
                      color: "var(--brand-muted)",
                    }}
                  >
                    {mission.domain}
                  </span>
                </div>

                {/* Complexity bar */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] w-16" style={{ color: "var(--brand-muted)" }}>
                    Complexity
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--brand-border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${mission.complexity * 10}%`, background: "var(--brand-primary)" }}
                    />
                  </div>
                  <span className="font-mono text-[10px]" style={{ color: "var(--brand-muted)" }}>
                    {mission.complexity}/10
                  </span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 text-xs mb-2" style={{ color: "var(--brand-muted)" }}>
                  <span>
                    <span className="font-mono font-medium" style={{ color: "var(--brand-text)" }}>
                      {mission.messages.toLocaleString()}
                    </span> msgs
                  </span>
                  <span>
                    <span className="font-mono font-medium" style={{ color: "var(--brand-text)" }}>
                      {mission.sessions}
                    </span> sessions
                  </span>
                  {mission.lastActive && (
                    <span className="ml-auto">{mission.lastActive}</span>
                  )}
                </div>

                {/* Technologies */}
                {mission.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {mission.technologies.slice(0, 5).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full px-2 py-0.5 text-[10px] font-mono"
                        style={{
                          background: "color-mix(in srgb, var(--brand-steel) 15%, transparent)",
                          color: "var(--brand-muted)",
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                    {mission.technologies.length > 5 && (
                      <span className="text-[10px]" style={{ color: "var(--brand-muted)" }}>
                        +{mission.technologies.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
