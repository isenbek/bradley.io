"use client";

import { cn } from "@/lib/utils";
import { SkillBadge } from "./SkillBadge";
import type { ProjectSummary } from "./types";

interface ProjectCardProps {
  project: ProjectSummary;
  variant?: "professional" | "adventure";
}

export function ProjectCard({
  project,
  variant = "professional",
}: ProjectCardProps) {
  const complexityBars = Math.min(project.complexity_score, 10);

  return (
    <article
      className={cn(
        "group rounded-lg border p-5 transition-all hover:shadow-md",
        variant === "professional" &&
          "border-slate-200 bg-white hover:border-teal-300",
        variant === "adventure" &&
          "border-slate-200 bg-white hover:border-amber-300"
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-slate-900 truncate">
            {project.name}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-1">
            {project.tagline}
          </p>
        </div>

        {/* Complexity indicator */}
        <div className="flex items-center gap-1 flex-shrink-0" title={`Complexity: ${complexityBars}/10`}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-3 w-1 rounded-sm transition-colors",
                i < complexityBars
                  ? variant === "professional"
                    ? "bg-teal-500"
                    : "bg-amber-500"
                  : "bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>

      {/* Purpose */}
      <p className="mb-4 text-sm text-slate-600 line-clamp-2">
        {project.purpose}
      </p>

      {/* Highlight */}
      <div
        className={cn(
          "mb-4 rounded-md p-3 text-sm",
          variant === "professional" ? "bg-teal-50" : "bg-amber-50"
        )}
      >
        <span className="font-medium text-slate-700">Key Achievement: </span>
        <span className="text-slate-600">{project.resume_highlight}</span>
      </div>

      {/* Technologies */}
      <div className="flex flex-wrap gap-1.5">
        {project.technologies.slice(0, 6).map((tech) => (
          <SkillBadge
            key={tech}
            name={tech}
            variant={variant}
            size="sm"
          />
        ))}
        {project.technologies.length > 6 && (
          <span className="px-2 py-0.5 text-xs text-slate-400">
            +{project.technologies.length - 6} more
          </span>
        )}
      </div>

      {/* Claude involvement */}
      {project.claude_involvement && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block h-4 w-4 rounded bg-gradient-to-br from-orange-400 to-orange-600" />
          <span>Claude: {project.claude_involvement}</span>
        </div>
      )}

      {/* Role badge */}
      <div className="mt-3 flex items-center justify-between">
        <span
          className={cn(
            "text-xs uppercase tracking-wide",
            variant === "professional" ? "text-teal-600" : "text-amber-600"
          )}
        >
          {project.role}
        </span>
        <span className="text-xs text-slate-400">{project.project_dir}</span>
      </div>
    </article>
  );
}
