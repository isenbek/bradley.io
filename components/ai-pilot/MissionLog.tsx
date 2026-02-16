"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, Folder, Activity, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Mission } from "./types";

interface MissionLogProps {
  missions: Mission[];
}

type SortKey = "messages" | "sessions" | "complexity" | "name";

const STATUS_STYLES: Record<string, { icon: typeof Activity; color: string }> = {
  active: { icon: Activity, color: "text-green-500" },
  recent: { icon: Activity, color: "text-amber-500" },
  archived: { icon: Archive, color: "text-slate-400" },
  unknown: { icon: Folder, color: "text-slate-400" },
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Mission Log ({missions.length} projects)
        </h3>
        <Button variant="ghost" size="sm" onClick={toggleSort} className="gap-1 text-xs">
          <ArrowUpDown className="h-3 w-3" />
          Sort: {sortBy}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {sorted.map((mission, i) => {
          const StatusIcon = STATUS_STYLES[mission.status]?.icon || Folder;
          const statusColor = STATUS_STYLES[mission.status]?.color || "text-slate-400";

          return (
            <motion.div
              key={mission.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <Card className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusColor}`} />
                      <h4 className="font-mono text-sm font-medium truncate">
                        {mission.name}
                      </h4>
                    </div>
                    <Badge variant="outline" className="ml-2 text-[10px] flex-shrink-0">
                      {mission.domain}
                    </Badge>
                  </div>

                  {/* Complexity bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-muted-foreground w-16">
                      Complexity
                    </span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${mission.complexity * 10}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {mission.complexity}/10
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span>
                      <span className="font-mono font-medium text-foreground">
                        {mission.messages.toLocaleString()}
                      </span>{" "}
                      msgs
                    </span>
                    <span>
                      <span className="font-mono font-medium text-foreground">
                        {mission.sessions}
                      </span>{" "}
                      sessions
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
                          className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                      {mission.technologies.length > 5 && (
                        <span className="text-[10px] text-muted-foreground self-center">
                          +{mission.technologies.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
