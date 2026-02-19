"use client";

import { motion } from "framer-motion";
import type { PilotingStyle as PilotingStyleType } from "./types";

interface PilotingStyleProps {
  style: PilotingStyleType;
}

export function PilotingStyle({ style }: PilotingStyleProps) {
  const clamp = (v: number) => Math.max(10, Math.min(90, v));
  const dotX = clamp(style.collaborative);
  const dotY = clamp(style.planFirst);

  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-xs sm:text-sm font-medium" style={{ color: "var(--brand-muted)" }}>
        Piloting Style
      </h3>

      <div className="text-center mb-3 sm:mb-4">
        <div className="text-xl sm:text-2xl font-bold" style={{ color: "var(--brand-primary)" }}>{style.label}</div>
        <p className="text-xs sm:text-sm mt-1 max-w-md mx-auto" style={{ color: "var(--brand-muted)" }}>
          {style.description}
        </p>
      </div>

      {/* 2x2 Quadrant */}
      <div
        className="relative mx-auto max-w-sm aspect-square rounded-lg overflow-hidden"
        style={{
          border: "1px solid var(--brand-border)",
          background: "color-mix(in srgb, var(--brand-bg-alt) 50%, transparent)",
        }}
      >
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wide" style={{ color: "var(--brand-muted)" }}>
          Plan-First
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wide" style={{ color: "var(--brand-muted)" }}>
          Iterate
        </div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wide [writing-mode:vertical-lr] rotate-180" style={{ color: "var(--brand-muted)" }}>
          Directive
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wide [writing-mode:vertical-lr]" style={{ color: "var(--brand-muted)" }}>
          Collaborative
        </div>

        <div className="absolute left-1/2 top-[15%] bottom-[15%] w-px" style={{ background: "var(--brand-border)" }} />
        <div className="absolute top-1/2 left-[15%] right-[15%] h-px" style={{ background: "var(--brand-border)" }} />

        <div className="absolute top-[20%] left-[20%] text-[10px] font-medium opacity-40" style={{ color: "var(--brand-muted)" }}>Commander</div>
        <div className="absolute top-[20%] right-[20%] text-[10px] font-medium opacity-40 text-right" style={{ color: "var(--brand-muted)" }}>Strategist</div>
        <div className="absolute bottom-[20%] left-[20%] text-[10px] font-medium opacity-40" style={{ color: "var(--brand-muted)" }}>Tactician</div>
        <div className="absolute bottom-[20%] right-[20%] text-[10px] font-medium opacity-40 text-right" style={{ color: "var(--brand-muted)" }}>Explorer</div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.5, stiffness: 200 }}
          className="absolute w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${15 + dotX * 0.7}%`,
            top: `${15 + (100 - dotY) * 0.7}%`,
            background: "var(--brand-primary)",
            boxShadow: "0 0 12px color-mix(in srgb, var(--brand-primary) 40%, transparent)",
          }}
          title={`${style.label}: ${style.directive}% directive, ${style.planFirst}% plan-first`}
        />
      </div>

      {/* Score bars */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4 text-xs">
        {[
          { label: "Directive", value: style.directive, color: "var(--brand-primary)" },
          { label: "Collaborative", value: style.collaborative, color: "var(--brand-secondary)" },
          { label: "Plan-First", value: style.planFirst, color: "var(--brand-warning)" },
          { label: "Iterate", value: style.iterate, color: "var(--brand-warning)" },
        ].map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between mb-1">
              <span style={{ color: "var(--brand-muted)" }}>{bar.label}</span>
              <span className="font-mono">{bar.value}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--brand-border)" }}>
              <div className="h-full rounded-full" style={{ width: `${bar.value}%`, background: bar.color, opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
