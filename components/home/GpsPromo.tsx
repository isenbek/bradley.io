import Link from "next/link"
import { ArrowRight, Satellite } from "lucide-react"

// Static promo for the GPS board. No live chip on purpose: the only GPS signal
// is the dragonfli /stream firehose (heavy), and the feed is fix-dead until
// tinymachines/adsb#2 — a "0 sats" chip would be noise. Add a live count once
// the feed produces fixes.
export function GpsPromo() {
  return (
    <Link href="/dragonfli/gps" className="v3-air-promo" style={{ marginTop: 14 }}>
      <span className="v3-air-promo__ico">
        <Satellite size={20} strokeWidth={2.2} />
      </span>
      <span className="v3-air-promo__body">
        <span className="v3-air-promo__eyebrow">live · gps board</span>
        <span className="v3-air-promo__title">The sky, from the ground up</span>
        <span className="v3-air-promo__blurb">
          Live GNSS off the same receiver as the airspace map: a satellite skyplot by signal
          strength, the SNR spectrum, the fix-precision cloud, and the ground track on a
          self-hosted vector basemap.
        </span>
      </span>
      <span className="v3-air-promo__right">
        <ArrowRight className="v3-air-promo__arrow" size={18} strokeWidth={2.4} />
      </span>
    </Link>
  )
}
