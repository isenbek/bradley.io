"use client";

import { motion } from "framer-motion";
import type { PilotingStyle as PilotingStyleType } from "./types";

interface PilotingStyleProps {
  style: PilotingStyleType;
}

export function PilotingStyle({ style }: PilotingStyleProps) {
  // Position the dot on the 2x2 quadrant
  // X: directive (left) vs collaborative (right) => collaborative / 100
  // Y: plan-first (top) vs iterate (bottom) => planFirst inverted
  // Clamp to 10-90 so dot stays visible within the box
  const clamp = (v: number) => Math.max(10, Math.min(90, v));
  const dotX = clamp(style.collaborative);
  const dotY = clamp(style.planFirst); // high planFirst = top of box

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        Piloting Style
      </h3>

      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-primary">{style.label}</div>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          {style.description}
        </p>
      </div>

      {/* 2x2 Quadrant */}
      <div className="relative mx-auto max-w-sm aspect-square border rounded-lg bg-muted/20 overflow-hidden">
        {/* Axis labels */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground uppercase tracking-wide">
          Plan-First
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground uppercase tracking-wide">
          Iterate
        </div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground uppercase tracking-wide [writing-mode:vertical-lr] rotate-180">
          Directive
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground uppercase tracking-wide [writing-mode:vertical-lr]">
          Collaborative
        </div>

        {/* Grid lines */}
        <div className="absolute left-1/2 top-[15%] bottom-[15%] w-px bg-border" />
        <div className="absolute top-1/2 left-[15%] right-[15%] h-px bg-border" />

        {/* Quadrant labels */}
        <div className="absolute top-[20%] left-[20%] text-[10px] font-medium text-muted-foreground/50">
          Commander
        </div>
        <div className="absolute top-[20%] right-[20%] text-[10px] font-medium text-muted-foreground/50 text-right">
          Strategist
        </div>
        <div className="absolute bottom-[20%] left-[20%] text-[10px] font-medium text-muted-foreground/50">
          Tactician
        </div>
        <div className="absolute bottom-[20%] right-[20%] text-[10px] font-medium text-muted-foreground/50 text-right">
          Explorer
        </div>

        {/* Position dot */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.5, stiffness: 200 }}
          className="absolute w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/30 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${15 + dotX * 0.7}%`,
            top: `${15 + (100 - dotY) * 0.7}%`,
          }}
          title={`${style.label}: ${style.directive}% directive, ${style.planFirst}% plan-first`}
        />
      </div>

      {/* Score bars */}
      <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Directive</span>
            <span className="font-mono">{style.directive}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/70 rounded-full"
              style={{ width: `${style.directive}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Collaborative</span>
            <span className="font-mono">{style.collaborative}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500/70 rounded-full"
              style={{ width: `${style.collaborative}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Plan-First</span>
            <span className="font-mono">{style.planFirst}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500/70 rounded-full"
              style={{ width: `${style.planFirst}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Iterate</span>
            <span className="font-mono">{style.iterate}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500/70 rounded-full"
              style={{ width: `${style.iterate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
