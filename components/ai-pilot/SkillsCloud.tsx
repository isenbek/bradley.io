"use client";

import { motion } from "framer-motion";
import type { SkillTag } from "./types";

interface SkillsCloudProps {
  skills: SkillTag[];
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Data Engineering": { bg: "color-mix(in srgb, var(--brand-info) 10%, transparent)", text: "var(--brand-info)", border: "color-mix(in srgb, var(--brand-info) 25%, transparent)" },
  Frontend: { bg: "color-mix(in srgb, var(--brand-secondary) 10%, transparent)", text: "var(--brand-secondary)", border: "color-mix(in srgb, var(--brand-secondary) 25%, transparent)" },
  Backend: { bg: "color-mix(in srgb, var(--brand-success) 10%, transparent)", text: "var(--brand-success)", border: "color-mix(in srgb, var(--brand-success) 25%, transparent)" },
  DevOps: { bg: "color-mix(in srgb, var(--brand-warning) 10%, transparent)", text: "var(--brand-warning)", border: "color-mix(in srgb, var(--brand-warning) 25%, transparent)" },
  "IoT / Edge": { bg: "color-mix(in srgb, var(--brand-primary) 10%, transparent)", text: "var(--brand-primary)", border: "color-mix(in srgb, var(--brand-primary) 25%, transparent)" },
  "AI / ML": { bg: "color-mix(in srgb, var(--brand-glow-secondary) 10%, transparent)", text: "var(--brand-glow-secondary)", border: "color-mix(in srgb, var(--brand-glow-secondary) 25%, transparent)" },
  Systems: { bg: "color-mix(in srgb, var(--brand-steel) 10%, transparent)", text: "var(--brand-steel)", border: "color-mix(in srgb, var(--brand-steel) 25%, transparent)" },
  Security: { bg: "color-mix(in srgb, var(--brand-error) 10%, transparent)", text: "var(--brand-error)", border: "color-mix(in srgb, var(--brand-error) 25%, transparent)" },
  General: { bg: "color-mix(in srgb, var(--brand-steel) 8%, transparent)", text: "var(--brand-steel)", border: "color-mix(in srgb, var(--brand-steel) 20%, transparent)" },
};

export function SkillsCloud({ skills }: SkillsCloudProps) {
  const maxCount = Math.max(...skills.map((s) => s.count), 1);

  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-xs sm:text-sm font-medium" style={{ color: "var(--brand-muted)" }}>
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

          const colors = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.General;

          return (
            <motion.span
              key={skill.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
              className={`inline-flex items-center gap-1 rounded-full font-mono transition-colors ${sizeClass}`}
              style={{
                background: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`,
              }}
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
