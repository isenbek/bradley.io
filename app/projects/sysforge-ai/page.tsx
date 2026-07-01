import { readFileSync } from "fs"
import { join } from "path"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { NominateTimeline } from "@/lib/nominate-timeline-types"
import { MissionTimeline } from "../_timeline/MissionTimeline"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Sysforge-AI — Timeline | bio·bradley.io",
  description:
    "Development timeline of Sysforge-AI — AI consulting and development firm delivering frontier AI solutions.",
  alternates: { canonical: "/projects/sysforge-ai" },
  openGraph: {
    title: "Sysforge-AI — Timeline",
    description:
      "AI consulting practice — frontier integrations, agentic pipelines, AI-augmented toolchains.",
    url: "https://bradley.io/projects/sysforge-ai",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sysforge-AI — Timeline",
    description:
      "AI consulting practice — frontier integrations, agentic pipelines, AI-augmented toolchains.",
  },
}

function loadTimeline(): NominateTimeline | null {
  try {
    return JSON.parse(
      readFileSync(
        join(process.cwd(), "public/data/sysforge-ai-timeline.json"),
        "utf-8"
      )
    )
  } catch {
    return null
  }
}

export default function V3SysforgeAITimeline() {
  const data = loadTimeline()
  if (!data) notFound()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "@id": "https://bradley.io/projects/sysforge-ai",
            url: "https://bradley.io/projects/sysforge-ai",
            name: "Sysforge-AI — Timeline",
            description:
              "Development timeline of Sysforge-AI — AI consulting and development firm delivering frontier AI solutions.",
            author: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Projects", item: "https://bradley.io/projects" },
                { "@type": "ListItem", position: 3, name: "Sysforge-AI", item: "https://bradley.io/projects/sysforge-ai" },
              ],
            },
          }),
        }}
      />
      <MissionTimeline
        displayName="Sysforge-AI"
        eyebrow="Consulting timeline"
        accent="coral"
        lede="The AI consulting & development firm. Frontier LLM integrations, agentic pipelines, and AI-augmented developer toolchains shipped to enterprise clients."
        data={data}
      />
    </>
  )
}
