import Link from "next/link"
import { ArrowRight, Map, Microscope, Sigma } from "lucide-react"
import { V3Reveal } from "@/components/v3/V3Reveal"

/**
 * The three PRIMALITY instruments cross-link to each other. Each page renders
 * this with its own slug so it promotes the other two.
 */
const INSTRUMENTS = [
  {
    slug: "prime-atlas",
    Icon: Map,
    title: "Primality Atlas: a terrain map of the territory",
    blurb:
      "The map the other two instruments stand on. Proven ground, conjectured pasture, dark rooms, and the cliffs that are known to be impassable. Drag, zoom, tap anything.",
  },
  {
    slug: "prime-orchestra",
    Icon: Sigma,
    title: "Prime Orchestra: the primes, played by zeta’s zeros",
    blurb:
      "Rebuild the prime staircase from the nontrivial zeros of the zeta function, one wave at a time, and watch the primes precipitate out of pure harmonics.",
  },
  {
    slug: "prime-zoo",
    Icon: Microscope,
    title: "Primality Zoo: the structure hiding in the primes",
    blurb:
      "Three field instruments over a live two-million sieve: which prime constellations can exist, which residue class is winning, and whether one prime remembers the last.",
  },
]

export function PrimeCompanions({ current }: { current: string }) {
  const others = INSTRUMENTS.filter((i) => i.slug !== current)

  return (
    <section className="v3-section" style={{ paddingTop: 8, paddingBottom: 48 }}>
      <div className="v3-wrap">
        {others.map(({ slug, Icon, title, blurb }, i) => (
          <V3Reveal key={slug} delay={i * 60}>
            <Link
              href={`/projects/${slug}`}
              className="v3-air-promo"
              style={i ? { marginTop: 14 } : undefined}
            >
              <span className="v3-air-promo__ico"><Icon size={20} strokeWidth={2.2} /></span>
              <span className="v3-air-promo__body">
                <span className="v3-air-promo__eyebrow">companion instrument</span>
                <span className="v3-air-promo__title">{title}</span>
                <span className="v3-air-promo__blurb">{blurb}</span>
              </span>
              <span className="v3-air-promo__right">
                <ArrowRight className="v3-air-promo__arrow" size={18} strokeWidth={2.4} />
              </span>
            </Link>
          </V3Reveal>
        ))}
      </div>
    </section>
  )
}
