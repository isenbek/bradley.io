import Link from "next/link"
import type { Metadata } from "next"
import { PageHead, Section } from "@/components/page"

const DESCRIPTION =
  "Free field tools for trade workers: a quote pad, a change-order pad with signature, a job photo stamper, and a voice material list. No accounts, no subscriptions, nothing uploads. They work for the person holding the phone and report to no one."

export const metadata: Metadata = {
  title: "Free Tools for the Trades",
  description: DESCRIPTION,
  alternates: { canonical: "/housecalls/tools" },
  openGraph: {
    title: "Free tools for the trades",
    description: DESCRIPTION,
    url: "https://bradley.io/housecalls/tools",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free tools for the trades",
    description: DESCRIPTION,
  },
}

const TOOLS = [
  {
    href: "/housecalls/tools/quote",
    name: "The truck quote pad",
    line: "Line items in, a professional quote out. Print it or text it from the driveway.",
  },
  {
    href: "/housecalls/tools/change-order",
    name: "The change-order pad",
    line: "Found something behind the wall? Photo, price, and a signature before the work.",
  },
  {
    href: "/housecalls/tools/photos",
    name: "The job photo stamper",
    line: "Job, time, and location burned into every photo. One zip per job.",
  },
  {
    href: "/housecalls/tools/materials",
    name: "The voice material pad",
    line: "Say the list in the truck, then hand a clean printed list across the counter.",
  },
]

/**
 * The shelf's front door and the counter card's QR target
 * (housecalls.bradley.io/tools redirects here). One screen, four tools,
 * the doctrine in plain sight, zero funnel.
 */
export default function ToolsIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://bradley.io/housecalls/tools",
            name: "Free tools for the trades",
            url: "https://bradley.io/housecalls/tools",
            description: DESCRIPTION,
            isPartOf: { "@type": "WebSite", name: "bradley.io", url: "https://bradley.io" },
          }),
        }}
      />
      <div className="page">
        <PageHead
          crumbs={[{ label: "House Calls", href: "/housecalls" }, { label: "Free Tools" }]}
          title="Free tools for the trades."
          lede={
            <>
              Four field tools, free forever: no app store, no account, no subscription, and nothing
              you type, sign, or photograph ever uploads anywhere. They work for the person holding
              the phone and report to no one.
            </>
          }
        />

        <h2 className="sr-only">The four tools</h2>
        <div className="piece-grid">
          {TOOLS.map((t) => (
            <Link className="rail beta-tool-rail" href={t.href} key={t.href}>
              <h3>{t.name}</h3>
              <p>{t.line}</p>
            </Link>
          ))}
        </div>

        <Section title="The catch, in full">
          <p>
            There is not one. These are the electronic form of a tradeshow giveaway from{" "}
            <Link href="/housecalls">House Calls</Link>, where an AI hunts for honest work for a
            Grand Rapids engineer, in public, with the prices readable from the street. If a tool
            saves you twenty minutes, the name on it is the whole transaction. Add this page to
            your home screen and every tool works from the truck, signal or not.
          </p>
        </Section>
      </div>
    </>
  )
}
