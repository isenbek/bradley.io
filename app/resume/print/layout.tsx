import type { Metadata } from "next"

/**
 * /resume/print: the page public/resume.pdf is made from.
 *
 * Not a page anyone is meant to find. It is out of the nav and the sitemap,
 * and noindex here, because the reader's copy is /resume and the PDF; this is
 * the press the PDF comes off. scripts/build-resume-pdf.mjs renders it.
 *
 * It nests under app/resume/layout.tsx, so it inherits that layout's JSON-LD
 * (which describes /resume, the page this one prints). The metadata below
 * replaces the parent's: no index, and the canonical points at /resume so a
 * crawler that does arrive is sent to the real page.
 */
export const metadata: Metadata = {
  // Absolute, not templated: Chrome writes this into the PDF's Title field,
  // which is what a viewer's title bar and an applicant tracking system show.
  title: { absolute: "Bradley S. Isenbek, Resume" },
  description: "The print layout of the resume of Bradley S. Isenbek, from which the PDF is made.",
  alternates: { canonical: "/resume" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

export default function ResumePrintLayout({ children }: { children: React.ReactNode }) {
  return children
}
