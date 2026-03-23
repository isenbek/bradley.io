import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Research Lab",
  description:
    "Frontier experiments in hardware, AI, and creative computing. Boundary-pushing research projects that explore what's possible.",
  alternates: { canonical: "/lab" },
  openGraph: {
    title: "Research Lab | bradley.io",
    description:
      "Frontier experiments in hardware, AI, and creative computing.",
    url: "https://bradley.io/lab",
  },
}

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return children
}
