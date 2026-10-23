import Link from "next/link"
import type { Metadata } from "next"
import { EyesLive } from "@/components/eyes/EyesLive"
import { PageHead, Section } from "@/components/page"

export const metadata: Metadata = {
  title: "Eyes",
  description: "The newest still from the camera on the bradley.io box, with the time it was captured.",
  robots: { index: false, follow: false },
}

export default function EyesPage() {
  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: "Eyes" }]}
        title="A frame, once a minute"
        lede={
          <>
            The newest still from the camera on the bradley.io server, taken once a minute and kept
            on the machine itself. The panel below says when the frame was taken, and says so
            plainly when the camera has stopped.
          </>
        }
      />

      <Section>
        <p>
          No stream, no cloud, no third party in the middle: just the most recent frame, also at{" "}
          <Link href="/eyes.png">/eyes.png</Link>.
        </p>
      </Section>

      <EyesLive />
    </div>
  )
}
