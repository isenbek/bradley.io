import Link from "next/link"
import type { Metadata } from "next"
import { ChangeOrderPad } from "@/components/housecalls/ChangeOrderPad"

const DESCRIPTION =
  "A free change-order pad for trade workers: describe the change, snap a photo, get it signed on the spot, print or text it. No account, no signup, nothing leaves your phone."

export const metadata: Metadata = {
  title: "The Change-Order Pad",
  description: DESCRIPTION,
  alternates: { canonical: "/housecalls/tools/change-order" },
  openGraph: {
    title: "The change-order pad, free",
    description: DESCRIPTION,
    url: "https://bradley.io/housecalls/tools/change-order",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The change-order pad, free",
    description: DESCRIPTION,
  },
}

/**
 * Second tool on the shelf (trades-temperature shortlist #2). Unpaid change
 * orders are money every tradesperson has lost; the fix is a signature
 * before the work, and the phone is already in their pocket.
 */
export default function ChangeOrderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/housecalls/tools/change-order",
            name: "The Change-Order Pad",
            url: "https://bradley.io/housecalls/tools/change-order",
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
              <span aria-current="page">Change-Order Pad</span>
            </span>
          </nav>
          <h1>Get the change signed. Before the work.</h1>
        </div>

        <p className="lede">
          Found something behind the wall? Describe the change, snap a photo, name the price, and
          get a signature on the spot: print it or text it, done. Free, no account, and nothing
          you type or sign ever leaves the phone.
        </p>

        <ChangeOrderPad />

        <div className="prose beta-sec">
          <h2>The fine print, still short</h2>
          <p>
            Another gift from the people at <Link href="/housecalls">House Calls</Link>. Same deal
            as <Link href="/housecalls/tools/quote">the quote pad</Link>, whose shop setup this
            tool shares: no account, no emails collected, everything stored on your own device and
            nowhere else. A signed change order is worth paper; print the ones that matter.
          </p>
        </div>
      </div>
    </>
  )
}
