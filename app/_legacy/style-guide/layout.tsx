import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Style Guide",
  description:
    "Design system reference for bradley.io — theme tokens, typography, color palettes, and component patterns.",
  alternates: { canonical: "/style-guide" },
  robots: { index: false, follow: true },
}

export default function StyleGuideLayout({ children }: { children: React.ReactNode }) {
  return children
}
