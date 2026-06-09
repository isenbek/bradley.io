import { readFileSync } from "fs"
import { join } from "path"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { NominateTimeline } from "@/lib/nominate-timeline-types"
import { MissionTimeline } from "../_timeline/MissionTimeline"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "tinymachines — Lab Timeline | bio·bradley.io",
  description:
    "Development timeline of the tinymachines lab — hardware, signals, agentic experiments. 60+ repos across 9 phases.",
  alternates: { canonical: "/projects/tinymachines" },
  openGraph: {
    title: "tinymachines — Lab Timeline",
    description:
      "Hardware, signals, agentic experiments — the lab umbrella behind SDR, TRNG, Dragonfli, and more.",
    url: "https://bradley.io/projects/tinymachines",
    type: "article",
  },
}

function loadTimeline(): NominateTimeline | null {
  try {
    return JSON.parse(
      readFileSync(
        join(process.cwd(), "public/data/tinymachines-timeline.json"),
        "utf-8"
      )
    )
  } catch {
    return null
  }
}

export default function V3TinyMachinesTimeline() {
  const data = loadTimeline()
  if (!data) notFound()

  return (
    <MissionTimeline
      displayName="tinymachines"
      eyebrow="Lab umbrella"
      accent="gold"
      lede="The garage-lab umbrella. ESP32 mesh, software-defined radio, true randomness from radioactive decay, ADS-B receivers — all the hardware-meets-AI experiments live here."
      data={data}
    />
  )
}
