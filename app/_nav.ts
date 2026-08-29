/**
 * The site's navigation, in one place.
 *
 * The menu, the shell and the route-to-chrome decision all read this. Upstream's
 * rule is the reason: ten hand-copied nav lists had already drifted three ways
 * before anyone noticed, because a nav missing one link still looks exactly like
 * a nav. Here it is load-bearing beyond tidiness, because KIT_ROUTES below is
 * derived from the same list that renders the menu: a page cannot end up in the
 * menu but wearing the wrong chrome, or vice versa.
 *
 * The descriptions are not decoration. The kit's .menu-item renders a label and
 * a line under it, and a menu that says only "Analytics" makes the reader open
 * the page to find out whether it is the one they wanted.
 */

export interface NavLink {
  href: string
  label: string
  /** The line under the label in the menu sheet. Lower case, no full stop. */
  blurb: string
  /**
   * True for a route that still runs the v3 design. These are reachable and
   * linked, they just have not been ported, and marking them keeps them out of
   * KIT_ROUTES so they keep their own chrome.
   */
  legacy?: boolean
}

export interface NavGroup {
  /** Heading on the group in the menu sheet. */
  title: string
  links: NavLink[]
}

export const NAV: NavGroup[] = [
  {
    title: "The site",
    links: [
      { href: "/", label: "Home", blurb: "what I build and who it is for" },
      { href: "/about", label: "About", blurb: "the bio, the timeline, the numbers" },
      { href: "/services", label: "Services", blurb: "five practices, three ways to engage" },
      { href: "/contact", label: "Contact", blurb: "the inbox, and what helps a first email" },
    ],
  },
  {
    title: "The evidence",
    links: [
      { href: "/work", label: "Work", blurb: "four GitHub orgs, commit history rolled up" },
      { href: "/ai-pilot", label: "AI pilot", blurb: "the licence: sessions, models, ratings" },
      { href: "/pilot-analytics", label: "Pilot analytics", blurb: "the same record, cut finer" },
      { href: "/cost-analysis", label: "Cost analysis", blurb: "what the work costs, modelled" },
      { href: "/the-shift", label: "The shift", blurb: "what changed when the tooling changed" },
      { href: "/papers", label: "Papers", blurb: "research notes, figures, and what held" },
      { href: "/mcp", label: "MCP catalog", blurb: "the servers, their tools, and the fleet" },
    ],
  },
  {
    // Not ported to the kit. Still live, still linked, still indexed: they are
    // the running instruments and the archive, and dropping them to tidy up the
    // design would trade real content for consistency.
    title: "Running instruments",
    links: [
      { href: "/trng", label: "Hotbits", blurb: "true random numbers from radioactive decay", legacy: true },
      { href: "/sdr", label: "SDR", blurb: "the scanner stack and what it is hearing", legacy: true },
      { href: "/fleet", label: "Fleet", blurb: "node health across the cluster", legacy: true },
      { href: "/dragonfli", label: "Dragonfli", blurb: "airspace, GPS, and the perception bus", legacy: true },
      { href: "/visitors", label: "Knock knock", blurb: "who has been trying the doors, across every site here" },
      { href: "/6502", label: "6502", blurb: "the transistor-level chip and its archive", legacy: true },
      { href: "/meatball", label: "Meatball", blurb: "the sensory robot: sight, sound, memory", legacy: true },
      { href: "/projects", label: "Projects", blurb: "the full dossier archive", legacy: true },
      { href: "/lab", label: "Lab", blurb: "the experiment catalog", legacy: true },
    ],
  },
]

/** Every link, flattened. */
export const NAV_LINKS: NavLink[] = NAV.flatMap((g) => g.links)

/**
 * The routes that wear the kit, derived from the nav rather than listed twice.
 *
 * components/SiteChrome.tsx reads this to decide which shell to render. Anything
 * not in here, including every route with no nav entry at all, gets v3.
 */
export const KIT_ROUTES: ReadonlySet<string> = new Set(
  NAV_LINKS.filter((l) => !l.legacy).map((l) => l.href)
)

/** The label for a path, for breadcrumbs. Null for the home page itself. */
export function navLabel(pathname: string): string | null {
  if (pathname === "/") return null
  return NAV_LINKS.find((l) => l.href === pathname)?.label ?? null
}
