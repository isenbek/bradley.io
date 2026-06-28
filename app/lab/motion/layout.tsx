import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Teaching the eyes to ignore a box fan — field note · bradley.io",
  description:
    "A box fan fooled both of a salvaged home server's senses at once. How we fixed the visual half: locking the camera's auto-exposure/white-balance galaxy, then an adaptive per-cell variance gate (the fan raises its own bar and self-mutes) plus blob gating. Every number from the live rig.",
  alternates: { canonical: "/lab/motion" },
  openGraph: {
    title: "Teaching the eyes to ignore a box fan",
    description:
      "Lock the camera, then let every cell set its own bar: an adaptive motion gate that self-mutes a fan, monitors, and lighting blips. A field note, every number from a live run.",
    url: "https://bradley.io/lab/motion",
    type: "article",
  },
}

export default function MotionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
