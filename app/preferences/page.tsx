import type { Metadata } from "next"
import Link from "next/link"
import { PreferencesClient } from "@/components/preferences/PreferencesClient"

export const metadata: Metadata = {
  title: "Preferences: device capabilities",
  description:
    "Scope every hook, sensor, and capability your device exposes, and save it to local PWA userspace. Host local, think global.",
  robots: { index: false, follow: false },
}

export default function PreferencesPage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Preferences</span>
          </span>
        </nav>
        <h1>Device capabilities</h1>
      </div>

      <p className="lede">
        A first-principles scan of every sensor, radio and platform hook this browser exposes.
        Probe the live readings, then save a snapshot: it persists to this device&apos;s IndexedDB
        and never reaches a server.
      </p>

      <div className="prose beta-sec">
        <p>
          There is also a <a href="/preferences/standalone.html">standalone module</a>, which is
          the same scan in one file with no framework behind it.
        </p>
      </div>
        <PreferencesClient />
    </div>
  )
}
