import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "War Games",
  description:
    "Interactive WOPR terminal — play the classic WarGames scenario against an AI opponent powered by local Ollama inference.",
  alternates: { canonical: "/wargames" },
  openGraph: {
    title: "War Games | bradley.io",
    description:
      "Interactive WOPR terminal — play the classic WarGames scenario against an AI opponent.",
    url: "https://bradley.io/wargames",
  },
}

export default function WargamesLayout({ children }: { children: React.ReactNode }) {
  return children
}
