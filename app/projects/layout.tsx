import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Hardware, AI, data pipelines, distributed systems, and frontier research — all powered by intensive human-AI collaboration with Claude.",
  openGraph: {
    title: "Projects | bradley.io",
    description:
      "Hardware, AI, data pipelines, distributed systems, and frontier research projects.",
    url: "https://bradley.io/projects",
  },
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children
}
