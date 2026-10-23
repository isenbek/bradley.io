import { EventLog } from "@/components/meatball/EventLog"
import { PageHead } from "@/components/page"

export default function Page() {
  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: "Meatball", href: "/meatball" }, { label: "Event log" }]}
        title="What it noticed"
        lede={
          <>
            Every motion event, transcription and greeting the machine logged, newest first. Written as it happened, not summarised after.
          </>
        }
      />

      <EventLog />
    </div>
  )
}
