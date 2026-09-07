import Link from "next/link"
import type { Metadata } from "next"
import { PhotoStamper } from "@/components/housecalls/PhotoStamper"

const DESCRIPTION =
  "A free job-photo stamper for trade workers: the job label, time, and GPS burned into every photo, grouped by job, exported as one zip. No account, no per-user bill, nothing uploads."

export const metadata: Metadata = {
  title: "The Job Photo Stamper",
  description: DESCRIPTION,
  alternates: { canonical: "/housecalls/tools/photos" },
  openGraph: {
    title: "The job photo stamper, free",
    description: DESCRIPTION,
    url: "https://bradley.io/housecalls/tools/photos",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The job photo stamper, free",
    description: DESCRIPTION,
  },
}

/**
 * Third tool on the shelf (trades-temperature shortlist #3): the
 * photo-documentation pain, minus the per-user subscription. The burn is
 * the product; the canvas re-encode also strips hidden metadata, so what a
 * photo says is exactly what you can see on it.
 */
export default function PhotoStamperPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/housecalls/tools/photos",
            name: "The Job Photo Stamper",
            url: "https://bradley.io/housecalls/tools/photos",
            description: DESCRIPTION,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Any (web)",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            isPartOf: { "@type": "WebSite", name: "bradley.io", url: "https://bradley.io" },
          }),
        }}
      />
      <div className="page">
        <div className="page-head">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">bradley.io</Link>
            <span>
              {" / "}
              <Link href="/housecalls">House Calls</Link>
              {" / "}
              <span aria-current="page">Photo Stamper</span>
            </span>
          </nav>
          <h1>The photo is the proof. Stamp it.</h1>
        </div>

        <p className="lede">
          Before, during, after: every job photo gets the job label, the time, and the location
          burned into the picture itself, so the proof cannot drift away from it. Grouped by job,
          out as one zip. Free, no account, and nothing uploads anywhere.
        </p>

        <PhotoStamper />

        <div className="prose beta-sec">
          <h2>The fine print, short as ever</h2>
          <p>
            Third gift from the people at <Link href="/housecalls">House Calls</Link>. Photos live
            on your own device and nowhere else; the stamping also scrubs the photo&apos;s hidden
            metadata, so what it says is exactly what anyone can see on it. Location goes on the
            stamp only if you grant it, and a photo without GPS is still a stamped photo. Export
            the jobs that matter; clearing your browser clears the rest.
          </p>
        </div>
      </div>
    </>
  )
}
