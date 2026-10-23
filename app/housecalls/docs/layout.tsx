import type { Metadata } from "next"

// Kept out of search and tinypeek (Brad, 2026-10-23): the paperwork is
// readable here for anyone who follows a link from /housecalls, but it is
// working planning, not something to be found. robots.txt disallows the
// path too (app/robots.ts), and app/sitemap.ts leaves it out.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function HouseCallsDocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
