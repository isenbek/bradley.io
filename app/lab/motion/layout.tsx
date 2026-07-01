import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Teaching the eyes to ignore a box fan — field note · bradley.io",
  description:
    "A box fan fooled both of a salvaged home server's senses at once. How we fixed the visual half: locking the camera's auto-exposure/white-balance galaxy, then an adaptive per-cell variance gate (the fan raises its own bar and self-mutes) plus blob gating. Every number from the live rig.",
  alternates: { canonical: "/lab/motion" },
  openGraph: {
    title: "Teaching the eyes to ignore a box fan",
    description:
      "Lock the camera, then let every cell set its own bar: an adaptive motion gate that self-mutes a fan, monitors, and lighting blips. A field note, every number from a live run.",
    url: "https://bradley.io/lab/motion",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Teaching the eyes to ignore a box fan",
    description:
      "Lock the camera, then let every cell set its own bar: an adaptive motion gate that self-mutes a fan, monitors, and lighting blips. A field note, every number from a live run.",
  },
}

export default function MotionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "@id": "https://bradley.io/lab/motion",
            url: "https://bradley.io/lab/motion",
            headline: "Teaching the eyes to ignore a box fan",
            description:
              "Locking the camera's auto-exposure/white-balance, then an adaptive per-cell variance gate plus blob gating — a motion pipeline that self-mutes a box fan. Every number from the live rig.",
            author: { "@id": "https://bradley.io/#person" },
            publisher: { "@id": "https://bradley.io/#person" },
            mainEntityOfPage: "https://bradley.io/lab/motion",
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Lab", item: "https://bradley.io/lab" },
                { "@type": "ListItem", position: 3, name: "Teaching the eyes to ignore a box fan", item: "https://bradley.io/lab/motion" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
