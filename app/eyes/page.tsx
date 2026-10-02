import Link from "next/link"
import type { Metadata } from "next"
import { EyesLive } from "@/components/eyes/EyesLive"

export const metadata: Metadata = {
  title: "Eyes",
  description: "The newest still from the camera on the bradley.io box, with the time it was captured.",
  robots: { index: false, follow: false },
}

export default function EyesPage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Eyes</span>
          </span>
        </nav>
        <h1>A frame, once a minute</h1>
      </div>

      <p className="lede">
        The newest still from the camera attached to the bradley.io box, grabbed with ffmpeg
        straight off /dev/video0 once a minute, cached on the metal and served same-origin. The
        panel below says when the frame was taken, and says so plainly when the camera has
        stopped.
      </p>

      <div className="prose beta-sec">
        <p>
          No stream, no cloud, no third party in the middle: just the most recent frame, also at{" "}
          <Link href="/eyes.png">/eyes.png</Link>.
        </p>
      </div>

        <EyesLive />
    </div>
  )
}
