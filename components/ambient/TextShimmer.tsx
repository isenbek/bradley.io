"use client";

import { useEffect, useRef, useCallback } from "react";
import "./ambient.css";

interface TextShimmerProps {
  children: React.ReactNode;
  className?: string;
  minInterval?: number;
  maxInterval?: number;
}

export function TextShimmer({
  children,
  className = "",
  minInterval = 8000,
  maxInterval = 20000,
}: TextShimmerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const triggerShimmer = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    // Remove and re-add the active class to restart the animation
    el.classList.remove("shimmer-active");
    // Force reflow so the browser notices the class removal
    void el.offsetWidth;
    el.classList.add("shimmer-active");

    // Schedule next shimmer
    const delay = minInterval + Math.random() * (maxInterval - minInterval);
    timerRef.current = setTimeout(triggerShimmer, delay);
  }, [minInterval, maxInterval]);

  useEffect(() => {
    // Initial delay before first shimmer (3-8s after mount)
    const initialDelay = 3000 + Math.random() * 5000;
    timerRef.current = setTimeout(triggerShimmer, initialDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [triggerShimmer]);

  return (
    <span ref={ref} className={`shimmer-text ${className}`}>
      {children}
    </span>
  );
}
