"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface FlightHoursCounterProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function FlightHoursCounter({
  value,
  label,
  prefix = "",
  suffix = "",
  decimals = 0,
}: FlightHoursCounterProps) {
  const formatVal = useCallback(
    (v: number) =>
      decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString(),
    [decimals]
  );

  const [display, setDisplay] = useState(() => formatVal(value));
  const prevValue = useRef(value);

  // Animate only on value *changes* (e.g. SWR refresh), not on initial mount
  useEffect(() => {
    if (prevValue.current === value) {
      setDisplay(formatVal(value));
      return;
    }

    const from = prevValue.current;
    const to = value;
    prevValue.current = value;
    const duration = 1000;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(formatVal(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    const guard = setTimeout(() => setDisplay(formatVal(to)), duration + 100);
    return () => clearTimeout(guard);
  }, [value, formatVal]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="font-mono text-2xl md:text-3xl font-bold text-primary">
        {prefix}
        {display}
        {suffix}
      </div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
        {label}
      </div>
    </motion.div>
  );
}
