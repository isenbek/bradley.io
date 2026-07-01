import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Meatball's logbook — what it noticed · bradley.io",
  description:
    "A live log of every motion Meatball's cameras caught and the vision model named: the cropped region, the label, the camera, and the time. Built as it happens.",
  alternates: { canonical: "/meatball/log" },
  robots: { index: false },
  openGraph: {
    title: "Meatball's logbook — what it noticed",
    description: "A live event log of motion the cameras caught and qwen3-vl named.",
    url: "https://bradley.io/meatball/log",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meatball's logbook — what it noticed",
    description: "A live event log of motion the cameras caught and qwen3-vl named.",
  },
}

export default function LogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
