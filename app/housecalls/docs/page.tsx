import Link from "next/link"
import type { Metadata } from "next"
import { readIndex, listDocSlugs } from "@/lib/housecalls/docs"

const DESCRIPTION =
  "The hunt's paperwork, readable where the hunt lives: every plan, letter template, rule, and recipe behind housecalls.bradley.io, rendered from the same files the repo carries."

export const metadata: Metadata = {
  title: "The Paperwork",
  description: DESCRIPTION,
  alternates: { canonical: "/housecalls/docs" },
  openGraph: {
    title: "House Calls: the paperwork",
    description: DESCRIPTION,
    url: "https://bradley.io/housecalls/docs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "House Calls: the paperwork",
    description: DESCRIPTION,
  },
}

/**
 * The doc tree, on the site: docs/housecalls/README.md is the map, so it IS
 * this page's body. Everything renders server-side from the committed files;
 * the open hunt's paperwork is readable on the open hunt's own page.
 */
export default function HuntDocsIndex() {
  const index = readIndex()
  const count = listDocSlugs().length
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://bradley.io/housecalls/docs",
            name: "House Calls: the paperwork",
            url: "https://bradley.io/housecalls/docs",
            description: DESCRIPTION,
            isPartOf: { "@type": "WebSite", name: "bradley.io", url: "https://bradley.io" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "House Calls", item: "https://bradley.io/housecalls" },
                { "@type": "ListItem", position: 3, name: "The Paperwork", item: "https://bradley.io/housecalls/docs" },
              ],
            },
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
              <span aria-current="page">The Paperwork</span>
            </span>
          </nav>
          <h1>The paperwork, in the open too.</h1>
        </div>

        <p className="lede">
          {count} working documents behind the hunt: plans, letter templates, rules, and recipes,
          rendered from the same committed files the repo carries. The page you are reading is the
          folder&apos;s own map.
        </p>

        <div className="prose beta-sec" dangerouslySetInnerHTML={{ __html: index.html }} />

        <p className="hero-ctas">
          <Link className="btn" href="/housecalls">
            Back to the hunt
          </Link>
        </p>
      </div>
    </>
  )
}
