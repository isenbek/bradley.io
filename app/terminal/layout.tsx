import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terminal",
  description:
    "Interactive CLI portfolio — explore projects, skills, and experience through a command-line interface.",
  alternates: { canonical: "/terminal" },
  openGraph: {
    title: "Terminal | bradley.io",
    description:
      "Interactive CLI portfolio — explore projects, skills, and experience via command line.",
    url: "https://bradley.io/terminal",
  },
}

export default function TerminalLayout({ children }: { children: React.ReactNode }) {
  return children
}
