import { MemoryTimeline } from "@/components/meatball/MemoryTimeline"
import { PageHead } from "@/components/page"

export default function Page() {
  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: "Meatball", href: "/meatball" }, { label: "Memory" }]}
        title="What it remembers"
        lede={
          <>
            Faces it has named, voices it has heard, and the moments it decided were worth keeping. The
            memory is a file on a salvaged drive, not a service.
          </>
        }
      />

      <MemoryTimeline />
    </div>
  )
}
