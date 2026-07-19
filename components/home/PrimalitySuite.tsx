import Link from "next/link"
import { ArrowRight, Hammer, Map, Microscope, Sigma } from "lucide-react"

/**
 * The three PRIMALITY instruments presented as one suite rather than three
 * unrelated promos — a single panel, hairline-separated rows, so the homepage
 * reads them as a set that belongs together.
 */
const SUITE = [
  {
    slug: "prime-atlas",
    Icon: Map,
    role: "the map",
    title: "Primality Atlas",
    blurb:
      "Twenty-nine landmarks from the Euler spring to the parity cliff, drawn as ground you can walk: what is proven, what is merely believed, what nobody knows, and what has been proven impassable.",
  },
  {
    slug: "zeta-forge",
    Icon: Hammer,
    role: "the workbench",
    title: "Zeta Forge",
    blurb:
      "Build ζ(s) = Σ n⁻ˢ one term at a time. Each term is an arrow; where the walk lands is the value, and a zero is the walk that comes home to the origin.",
  },
  {
    slug: "prime-orchestra",
    Icon: Sigma,
    role: "the reconstruction",
    title: "Prime Orchestra",
    blurb:
      "Rebuild the prime staircase from the nontrivial zeros of the Riemann zeta function, one wave at a time. Feed the zeros in and watch the primes resolve out of pure harmonics.",
  },
  {
    slug: "prime-zoo",
    Icon: Microscope,
    role: "the field instruments",
    title: "Primality Zoo",
    blurb:
      "Three scopes over a live two-million sieve. Test whether a prime constellation can exist at all, watch the residue-class race, and read the matrix where consecutive primes avoid repeating themselves.",
  },
]

export function PrimalitySuite() {
  return (
    <div className="v3-suite">
      <div className="v3-suite__head">
        <span className="v3-suite__badge">PRIMALITY</span>
        <span className="v3-suite__headtext">
          <span className="v3-suite__title">Four instruments, one territory</span>
          <span className="v3-suite__sub">
            A map of prime-number theory and three machines built where it pointed: forge zeta,
            hear its zeros play the primes, then probe the primes directly. All four run in the
            browser, no dependencies, no network.
          </span>
        </span>
      </div>

      <div className="v3-suite__list">
        {SUITE.map(({ slug, Icon, role, title, blurb }) => (
          <Link key={slug} href={`/projects/${slug}`} className="v3-air-promo v3-suite__row">
            <span className="v3-air-promo__ico"><Icon size={20} strokeWidth={2.2} /></span>
            <span className="v3-air-promo__body">
              <span className="v3-air-promo__eyebrow">{role}</span>
              <span className="v3-air-promo__title">{title}</span>
              <span className="v3-air-promo__blurb">{blurb}</span>
            </span>
            <span className="v3-air-promo__right">
              <ArrowRight className="v3-air-promo__arrow" size={18} strokeWidth={2.4} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
