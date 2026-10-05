import type { Metadata } from "next"

/**
 * The Computer Tree's metadata. The title is absolute with the site's suffix
 * written out, for the reason app/projects/turfy/layout.tsx gives: the
 * /projects layout's plain title ends the root template for its children.
 */
const TITLE = "The Computer Tree, 1945 to 2025"
const DESC =
  "The US Army's 1961 family tree of the electronic computer, transcribed and grown one ring per decade to 2025: 542 machines and 614 lineage links from ENIAC to Fugaku, the H100 and the TPU. Pick any machine and trace its line back to the root. The dataset and its data card are free to take."

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | Bradley Isenbek` },
  description: DESC,
  alternates: { canonical: "/projects/computer-tree" },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: "https://bradley.io/projects/computer-tree",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
  },
}

export default function ComputerTreeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            "@id": "https://bradley.io/projects/computer-tree",
            url: "https://bradley.io/projects/computer-tree",
            name: TITLE,
            description: DESC,
            temporalCoverage: "1945/2025",
            version: "1.0",
            keywords: ["history of computing", "computer lineage", "ENIAC", "graph", "dataset"],
            distribution: [
              { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: "https://bradley.io/computer-tree/nodes.csv" },
              { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: "https://bradley.io/computer-tree/edges.csv" },
              {
                "@type": "DataDownload",
                encodingFormat: "application/json",
                contentUrl: "https://bradley.io/computer-tree/computer_tree.json",
              },
            ],
            creator: { "@id": "https://bradley.io/#person" },
            isPartOf: { "@id": "https://bradley.io/#website" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                { "@type": "ListItem", position: 2, name: "Projects", item: "https://bradley.io/projects" },
                { "@type": "ListItem", position: 3, name: "The Computer Tree", item: "https://bradley.io/projects/computer-tree" },
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
