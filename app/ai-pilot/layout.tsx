import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Pilot License | Bradley.io",
  description:
    "A living, data-driven dashboard proving AI collaboration mastery — flight hours, type ratings, instrument ratings, and mission logs mined from real Claude Code usage data.",
  openGraph: {
    title: "AI Pilot License | Bradley.io",
    description:
      "AI collaboration mastery dashboard with real usage data from 500+ Claude Code sessions.",
    type: "website",
  },
};

export default function AIPilotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
