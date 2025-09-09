import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/sections/navigation";
import { Footer } from "@/components/sections/footer";
import { ThemeProvider } from "@/components/ui/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bradley.io - AI Data Engineering & Edge Computing",
  description: "Transform enterprise data strategies through intelligent edge computing. Combining Fortune 500 data architecture expertise with cutting-edge IoT integration.",
  keywords: "AI consultant, data engineering, edge computing, IoT, Grand Rapids, Michigan, data architecture, predictive analytics",
  authors: [{ name: "Bradley.io" }],
  openGraph: {
    title: "Bradley.io - AI Data Engineering & Edge Computing",
    description: "Transform enterprise data strategies through intelligent edge computing",
    type: "website",
    locale: "en_US",
    url: "https://bradley.io",
    siteName: "Bradley.io",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${firaCode.variable} font-sans antialiased`}
      >
        <ThemeProvider defaultTheme="default">
          <div className="flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
