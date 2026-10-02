import type { Metadata } from "next"

/**
 * /projects: share-card text. The page sets its own title and description and
 * carries its own JSON-LD (in page.tsx, so it describes /projects only and is
 * not repeated on every page under /projects/*); this carries the Open Graph
 * and Twitter blocks, which Next does not derive from them.
 *
 * No count in any of it. The old text said "86+ projects", which was the size
 * of a generated index that no longer exists, and a share card is cached for
 * days: the number on the page is computed from the cards, this one would rot.
 */

const DESCRIPTION =
  "What is on the bench: chips rebuilt from their own dies, data platforms, instruments reading real hardware, math instruments that run in the browser, and a few ideas that might not ship."

export const metadata: Metadata = {
  title: "Projects · bio·bradley.io",
  description: DESCRIPTION,
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Projects · bio·bradley.io",
    description: DESCRIPTION,
    url: "https://bradley.io/projects",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects · bio·bradley.io",
    description: DESCRIPTION,
  },
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children
}
