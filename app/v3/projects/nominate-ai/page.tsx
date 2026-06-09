import { readFileSync } from "fs"
import { join } from "path"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { NominateTimeline } from "@/lib/nominate-timeline-types"
import { MissionTimeline } from "../_timeline/MissionTimeline"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Nominate-AI — Platform Timeline | bio·bradley.io",
  description:
    "Full development timeline of the Nominate-AI platform — 115 repos, 17k+ commits, AI-synthesized into phase-based milestones.",
  alternates: { canonical: "/v3/projects/nominate-ai" },
  openGraph: {
    title: "Nominate-AI — Platform Timeline",
    description:
      "Three years across 115 repos and 17k+ commits, indexed by phase.",
    url: "https://bradley.io/v3/projects/nominate-ai",
    type: "article",
  },
}

function loadTimeline(): NominateTimeline | null {
  try {
    return JSON.parse(
      readFileSync(
        join(process.cwd(), "public/data/nominate-ai-timeline.json"),
        "utf-8"
      )
    )
  } catch {
    return null
  }
}

export default function V3NominateAITimeline() {
  const data = loadTimeline()
  if (!data) notFound()

  return (
    <MissionTimeline
      displayName="Nominate-AI"
      eyebrow="Platform timeline"
      accent="blue"
      lede="The AI-native sourcing platform — multi-tenant pipelines, vector search, agent orchestration, and the messaging layer that powers it all."
      data={data}
    />
  )
}
