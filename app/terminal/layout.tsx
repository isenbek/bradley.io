import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terminal — bio·bradley.io",
  description:
    "Interactive CLI portfolio — type `help` to start. About, skills, projects, repos, experience, contact, all via commands.",
  alternates: { canonical: "/terminal" },
  openGraph: {
    title: "Terminal — bio·bradley.io",
    description:
      "Interactive CLI portfolio. Type `help` to start poking around.",
    url: "https://bradley.io/terminal",
    type: "website",
  },
}

export default function V3TerminalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
