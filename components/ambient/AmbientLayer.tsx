"use client";

import { FloatingLeaves } from "./FloatingLeaves";

export function AmbientLayer() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 30 }}
      aria-hidden="true"
    >
      <FloatingLeaves />
    </div>
  );
}
