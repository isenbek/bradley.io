import { readFileSync } from "fs"
import { join } from "path"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { NominateTimeline } from "@/lib/nominate-timeline-types"
import { MissionTimeline } from "../_timeline/MissionTimeline"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "isenbek: Personal Timeline | bio·bradley.io",
  description:
    "Personal repository timeline: solo work, side quests, and the running thread across platforms.",
  alternates: { canonical: "/projects/isenbek" },
  openGraph: {
    title: "isenbek: Personal Timeline",
    description:
      "Solo repos, side projects, and the running thread across every platform.",
    url: "https://bradley.io/projects/isenbek",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "isenbek: Personal Timeline",
    description:
      "Solo repos, side projects, and the running thread across every platform.",
  },
}

function loadTimeline(): NominateTimeline | null {
  try {
    return JSON.parse(
      readFileSync(
        join(process.cwd(), "public/data/isenbek-timeline.json"),
        "utf-8"
      )
    )
  } catch {
    return null
  }
}

export default function V3IsenbekTimeline() {
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
            "@id": "https://bradley.io/projects/isenbek",
            url: "https://bradley.io/projects/isenbek",
            name: "isenbek: Personal Timeline",
            description:
              "Personal repository timeline: solo work, side quests, and the running thread across platforms.",
            author: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Projects", item: "https://bradley.io/projects" },
                { "@type": "ListItem", position: 3, name: "isenbek", item: "https://bradley.io/projects/isenbek" },
              ],
            },
          }),
        }}
      />
      <MissionTimeline
        displayName="isenbek"
        eyebrow="Personal timeline"
        accent="green"
        lede="The solo namespace. Side projects, learning exercises, and the through-line: repos that track the career arc across every platform and lab."
        data={data}
      />
    </>
  )
}
