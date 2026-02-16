"use client";

import { cn } from "@/lib/utils";

interface SkillBadgeProps {
  name: string;
  count?: number;
  variant?: "default" | "professional" | "adventure";
  size?: "sm" | "md";
}

export function SkillBadge({
  name,
  count,
  variant = "default",
  size = "md",
}: SkillBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-mono transition-colors",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        variant === "default" &&
          "bg-slate-100 text-slate-700 hover:bg-slate-200",
        variant === "professional" &&
          "bg-teal-50 text-teal-700 hover:bg-teal-100",
        variant === "adventure" &&
          "bg-amber-50 text-amber-700 hover:bg-amber-100"
      )}
    >
      {name}
      {count !== undefined && count > 1 && (
        <span className="text-xs opacity-60">({count})</span>
      )}
    </span>
  );
}
