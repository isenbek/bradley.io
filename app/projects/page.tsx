import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Three things worth looking at: a transistor-level 6502, a random number generator fed by radioactive decay, and a log of who has been knocking.",
  alternates: { canonical: "/projects" },
}

/**
 * Projects, cut to three.
 *
 * This page used to be an index over 236 generated dossiers, one per repository
 * across four GitHub orgs. That inventory answered "what repos exist", which
 * `/work` now answers better and in one screen, so the dossiers are gone.
 *
 * What is left is the short list of things that are actually worth opening: each
 * one is running, each one has something to look at, and each one is a page
 * rather than a directory entry.
 */

const PROJECTS = [
  {
    href: "/6502",
    title: "The 6502",
    what: "A transistor-level simulation of the chip that made home computing affordable.",
    detail:
      "One 6502 was decapped, photographed and traced by hand. This runs those 3,510 transistors, solved to a fixed point twice per clock cycle, and checks itself against the original simulator bit for bit. Plus a link-checked archive of everything the visual6502 team left behind.",
  },
  {
    href: "/trng",
    title: "Hotbits",
    what: "Random numbers from radioactive decay, tested continuously.",
    detail:
      "A Geiger counter, a Raspberry Pi, and a comparison of one gap between decay events with the next. Nothing generates a number. The bias cancels by symmetry rather than by correction, and NIST SP 800-90B runs on every sample as it arrives.",
  },
  {
    href: "/visitors",
    title: "Knock knock",
    what: "Everything that has tried the doors on this host, across every site it serves.",
    detail:
      "Three tiers fused into one view: dropped at the edge by the router, trapped at the door by the scanner trap, and served. Almost all of it is automated. Visitors are coarsened to a /24 on purpose; the scanners are not.",
  },
]

export default function ProjectsPage() {
  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Projects</span>
          </span>
        </nav>
        <h1>Projects</h1>
      </div>

      <p className="lede">
        Three things worth opening. All three are running right now, and all three show their own
        working rather than describing it.
      </p>

      <div className="piece-grid">
        {PROJECTS.map((p) => (
          <div className="rail" key={p.href}>
            <h3>{p.title}</h3>
            <p>{p.what}</p>
            <p className="quiet">{p.detail}</p>
            <p>
              <Link className="btn btn-primary" href={p.href}>
                Open it
              </Link>
            </p>
          </div>
        ))}
      </div>

      <div className="prose beta-sec">
        <h2>What used to be here</h2>
        <p>
          An index over 236 generated dossiers, one per repository. That answered which repositories
          exist, which is a question <Link href="/work">the work page</Link> now answers in one
          screen and from the same commit data. Keeping both meant maintaining an inventory nobody
          reads in order to say something already said better elsewhere.
        </p>
        <p>
          The hand-built instrument pages did not go anywhere:{" "}
          <Link href="/projects/prime-orchestra">Prime Orchestra</Link>,{" "}
          <Link href="/projects/prime-zoo">Prime Zoo</Link>,{" "}
          <Link href="/projects/prime-atlas">Prime Atlas</Link>,{" "}
          <Link href="/projects/critical-collapse">Critical Collapse</Link>,{" "}
          <Link href="/projects/zeta-forge">Zeta Forge</Link>,{" "}
          <Link href="/projects/storm-plates">Storm Plates</Link> and{" "}
          <Link href="/projects/turfy">Turfy</Link> are all still where they were.
        </p>
      </div>
    </div>
  )
}
