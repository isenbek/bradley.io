import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { listDocSlugs, readDoc } from "@/lib/housecalls/docs"

/**
 * One document from the hunt's paperwork, server-rendered from its
 * committed markdown. Status and dates come from the file's own front
 * matter; the body is the file, nothing added, nothing hidden.
 */

export function generateStaticParams() {
  return listDocSlugs().map((slug) => ({ slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const doc = readDoc(slug)
  if (!doc) return {}
  const title = doc.title
  const description = `House Calls working document: ${doc.title}. ${doc.status}`.slice(0, 160)
  return {
    title,
    description,
    alternates: { canonical: `/housecalls/docs/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://bradley.io/housecalls/docs/${slug}`,
      type: "article",
    },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function HuntDocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = readDoc(slug)
  if (!doc) notFound()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "@id": `https://bradley.io/housecalls/docs/${doc.slug}`,
            headline: doc.title,
            url: `https://bradley.io/housecalls/docs/${doc.slug}`,
            isPartOf: { "@type": "CollectionPage", "@id": "https://bradley.io/housecalls/docs" },
            author: { "@id": "https://bradley.io/#person" },
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
              <Link href="/housecalls/docs">The Paperwork</Link>
              {" / "}
              <span aria-current="page">{doc.slug}</span>
            </span>
          </nav>
          <h1>{doc.title}</h1>
        </div>

        <p className="lede">
          {doc.status ? <span className="tag">{doc.status}</span> : null}
          {doc.updated ? <span className="tag">{doc.updated}</span> : null}
        </p>

        <div className="prose beta-sec" dangerouslySetInnerHTML={{ __html: doc.html }} />

        <p className="hero-ctas">
          <Link className="btn" href="/housecalls/docs">
            All the paperwork
          </Link>
          <Link className="btn" href="/housecalls">
            Back to the hunt
          </Link>
        </p>
      </div>
    </>
  )
}
