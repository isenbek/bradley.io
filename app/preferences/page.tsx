import type { Metadata } from "next"
import { PreferencesClient } from "@/components/preferences/PreferencesClient"
import { PageHead, Section } from "@/components/page"

export const metadata: Metadata = {
  title: "Preferences: device capabilities",
  description:
    "Scope every hook, sensor, and capability your device exposes, and save it to local PWA userspace. Host local, think global.",
  robots: { index: false, follow: false },
}

export default function PreferencesPage() {
  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: "Preferences" }]}
        title="Device capabilities"
        lede={
          <>
            A scan of every sensor, radio and feature this browser offers. Try the live readings,
            then save a snapshot. It stays on this device and never reaches a server.
          </>
        }
      />

      <Section>
        <p>
          There is also a <a href="/preferences/standalone.html">standalone module</a>, which is
          the same scan in one file with no framework behind it.
        </p>
      </Section>
      <PreferencesClient />
    </div>
  )
}
