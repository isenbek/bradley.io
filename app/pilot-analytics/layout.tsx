import type { Metadata } from "next"

// Private internal analytics — unlinked + noindex. The aggregates contain
// project names + token counts, so keep it out of search + the public sitemap.
export const metadata: Metadata = {
  title: "Claude Activity Analytics",
  robots: { index: false, follow: false },
}

export default function PilotAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
