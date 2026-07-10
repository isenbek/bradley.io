import type { Metadata } from "next"
import { PreferencesClient } from "@/components/preferences/PreferencesClient"

export const metadata: Metadata = {
  title: "Preferences: device capabilities",
  description:
    "Scope every hook, sensor, and capability your device exposes, and save it to local PWA userspace. Host local, think global.",
  robots: { index: false, follow: false },
}

export default function PreferencesPage() {
  return (
    <div className="container-page v3-prefs">
      <header className="v3-prefs__head">
        <p className="v3-prefs__eyebrow">/preferences · local userspace</p>
        <h1 className="v3-prefs__title">Device capabilities</h1>
        <p className="v3-prefs__lede">
          A first-principles scan of every sensor, radio, and platform hook this browser exposes. Probe live readings,
          then save a snapshot: it persists to this device&apos;s IndexedDB, never a server.{" "}
          <a className="v3-prefs__link" href="/preferences/standalone.html">open the standalone module ↗</a>
        </p>
      </header>
      <PreferencesClient />
    </div>
  )
}
