import type { Metadata } from "next"

// TEMPORARY, UNLISTED. No index, no nav link, not in the sitemap, disallowed in
// robots.txt. Reachable by URL only, and gated behind a shared PIN.
export const metadata: Metadata = {
  title: "Junior · bradley.io",
  description: "Private working session.",
  robots: { index: false, follow: false, nocache: true },
}

export default function JuniorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
