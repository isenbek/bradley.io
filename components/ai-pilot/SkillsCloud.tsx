"use client";

import { motion } from "framer-motion";
import type { SkillTag } from "./types";

interface SkillsCloudProps {
  skills: SkillTag[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Data Engineering": "bg-blue-50 text-blue-700 border-blue-200",
  Frontend: "bg-teal-50 text-teal-700 border-teal-200",
  Backend: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DevOps: "bg-orange-50 text-orange-700 border-orange-200",
  "IoT / Edge": "bg-pink-50 text-pink-700 border-pink-200",
  "AI / ML": "bg-purple-50 text-purple-700 border-purple-200",
  Systems: "bg-slate-50 text-slate-700 border-slate-200",
  Security: "bg-red-50 text-red-700 border-red-200",
  General: "bg-gray-50 text-gray-700 border-gray-200",
};

export function SkillsCloud({ skills }: SkillsCloudProps) {
  const maxCount = Math.max(...skills.map((s) => s.count), 1);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        Skills Cloud ({skills.length} technologies)
      </h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, i) => {
          const sizeClass =
            skill.count > maxCount * 0.7
              ? "text-sm px-3 py-1.5"
              : skill.count > maxCount * 0.4
                ? "text-xs px-2.5 py-1"
                : "text-[11px] px-2 py-0.5";

          return (
            <motion.span
              key={skill.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
              className={`inline-flex items-center gap-1 rounded-full border font-mono transition-colors hover:shadow-sm ${sizeClass} ${CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.General}`}
            >
              {skill.name}
              <span className="opacity-50 text-[9px]">({skill.count})</span>
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
