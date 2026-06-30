import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "WorldEvent bus — bio·bradley.io",
  description:
    "The perception bus: a live, schema-tagged firehose of everything the sensors notice — every event type, host, and rate on one wire. A new sense, not a single feed.",
  alternates: { canonical: "/dragonfli/worldevent" },
  openGraph: {
    title: "WorldEvent — every sense, one firehose",
    description:
      "A live, type-agnostic view of the worldevent/1 perception bus — event types, hosts, throughput, and a rolling tail of everything happening in the world.",
    url: "https://bradley.io/dragonfli/worldevent",
    type: "website",
  },
}

export default function WorldEventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
