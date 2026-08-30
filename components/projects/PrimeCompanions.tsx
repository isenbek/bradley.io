import Link from "next/link"
import { ArrowRight, Hammer, Map, Microscope, Sigma, Waves } from "lucide-react"

/**
 * The PRIMALITY instruments cross-link to each other. Each page renders this
 * with its own slug so it promotes the rest of the suite.
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
    slug: "zeta-forge",
    Icon: Hammer,
    title: "Zeta Forge: build zeta one arrow at a time",
    blurb:
      "Every term of ζ(s) = Σ n⁻ˢ becomes an arrow. Laid head to tail they walk the complex plane, and where the walk lands is the value. A zero is the walk that comes home.",
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
  {
    slug: "storm-plates",
    Icon: Waves,
    title: "Storm Plates: the sieve, drawn as weather",
    blurb:
      "One wave per prime rolls under a plank bridge and every crest breaks the plank it lands on. Record gaps become pile-ups, twins become coordinated calms, and the zeros turn up as a second transcription of the same water.",
  },
]

export function PrimeCompanions({ current }: { current: string }) {
  const others = INSTRUMENTS.filter((i) => i.slug !== current)

  return (
    <section className="beta-note-sec" style={{ paddingTop: 8, paddingBottom: 48 }}>
      <div className="beta-promo-stack">
        {others.map(({ slug, Icon, title, blurb }) => (
          <Link key={slug} href={`/projects/${slug}`} className="beta-promo">
            <span className="beta-promo__ico">
              <Icon size={20} strokeWidth={2.2} />
            </span>
            <span className="beta-promo__body">
              <span className="beta-promo__eyebrow">companion instrument</span>
              <span className="beta-promo__title">{title}</span>
              <span className="beta-promo__blurb">{blurb}</span>
            </span>
            <span className="beta-promo__right">
              <ArrowRight className="beta-promo__arrow" size={18} strokeWidth={2.4} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
