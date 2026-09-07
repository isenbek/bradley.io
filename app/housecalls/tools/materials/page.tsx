import Link from "next/link"
import type { Metadata } from "next"
import { MaterialPad } from "@/components/housecalls/MaterialPad"

const DESCRIPTION =
  "A free voice material pad for trade workers: say the list in the truck, get a clean printable supply-house list. No account, no signup, and the clever part is honestly not AI."

export const metadata: Metadata = {
  title: "The Voice Material Pad",
  description: DESCRIPTION,
  alternates: { canonical: "/housecalls/tools/materials" },
  openGraph: {
    title: "The voice material pad, free",
    description: DESCRIPTION,
    url: "https://bradley.io/housecalls/tools/materials",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The voice material pad, free",
    description: DESCRIPTION,
  },
}

/**
 * Fourth tool, and the shelf's thesis demo: the honest-AI letter promises
 * "you do not need AI for this" as the most valuable sentence we sell, so
 * this page delivers it about itself, in public.
 */
export default function MaterialPadPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/housecalls/tools/materials",
            name: "The Voice Material Pad",
            url: "https://bradley.io/housecalls/tools/materials",
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
              <span aria-current="page">Material Pad</span>
            </span>
          </nav>
          <h1>Say the list. Hand over the list.</h1>
        </div>

        <p className="lede">
          Talk the material list into the phone from the truck: three boxes of romex twelve two,
          twenty feet of half inch EMT, a roll of tape. Out comes a clean list with a checkbox
          column, ready to print, text, or hand across the supply-house counter. Free, no account,
          and the draft never leaves your phone.
        </p>

        <MaterialPad />

        <div className="prose beta-sec">
          <h2>You do not need AI for this</h2>
          <p>
            That sentence is the most valuable thing the people behind this page sell, so here it
            is about our own tool: the turning-your-ramble-into-a-list part is plain deterministic
            rules, running on this page, the same way every time, no model involved. The one piece
            that is machine learning is the microphone itself, which uses your browser&apos;s
            built-in speech service; on many phones that means the browser maker processes the
            audio. If that bothers you, type the ramble instead: the pad works identically, and
            typing is the only part we can make promises about. The rest of the deal is the usual
            one from <Link href="/housecalls">House Calls</Link>: no account, nothing collected,
            everything on your device.
          </p>
        </div>
      </div>
    </>
  )
}
