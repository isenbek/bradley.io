import Link from "next/link"
import type { Metadata } from "next"
import { QuotePad } from "@/components/housecalls/QuotePad"
import { BackupPanel } from "@/components/housecalls/BackupPanel"

const DESCRIPTION =
  "A free quote pad for trade workers: line items in, a professional quote out, printable or textable from the truck. No account, no signup, and nothing leaves your phone."

export const metadata: Metadata = {
  title: "The Truck Quote Pad",
  description: DESCRIPTION,
  alternates: { canonical: "/housecalls/tools/quote" },
  openGraph: {
    title: "The truck quote pad, free",
    description: DESCRIPTION,
    url: "https://bradley.io/housecalls/tools/quote",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The truck quote pad, free",
    description: DESCRIPTION,
  },
}

/**
 * The first House Calls giveaway (docs/housecalls/truck-pad-plan.md and the
 * trades-temperature report): the electronic form of a tradeshow giveaway.
 * Built as a surface on the flagship per the incubator pattern; may graduate
 * to its own app later, per the parked promotion decisions.
 */
export default function QuotePadPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "@id": "https://bradley.io/housecalls/tools/quote",
            name: "The Truck Quote Pad",
            url: "https://bradley.io/housecalls/tools/quote",
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
              <span aria-current="page">Truck Quote Pad</span>
            </span>
          </nav>
          <h1>Quote it from the truck.</h1>
        </div>

        <p className="lede">
          Line items in, a professional quote out: print it, text it, done. Free, no account, no
          signup, and nothing you type ever leaves your phone. Set your shop once; it remembers.
        </p>

        <QuotePad />

        <BackupPanel />

        <div className="prose beta-sec">
          <h2>The fine print, which is short</h2>
          <p>
            This tool is a gift from the people at <Link href="/housecalls">House Calls</Link>,
            where an AI hunts for honest work in public and the prices are readable from the
            street. There is no catch: no account to make, no emails collected, no upsell coming.
            Your shop details and your quotes are stored on your own device and nowhere else,
            which also means clearing your browser clears them. Print the ones that matter.
          </p>
        </div>
      </div>
    </>
  )
}
