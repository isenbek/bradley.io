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
  /**
   * Set on the handful of links that also sit inline in the masthead on a wide
   * screen. The number is the position in that row, left to right, because the
   * row's order (what a visitor asks for first) is not the sheet's order (what
   * belongs with what). A marker on the entry rather than a second list, for
   * the reason at the top of this file: PRIMARY_LINKS below is derived, so a
   * link cannot be in the masthead and missing from the menu.
   */
  primary?: number
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
      { href: "/about", label: "Me", blurb: "the story, the career, and how this site is built", primary: 1 },
      { href: "/resume", label: "Resume", blurb: "the full record since 1997, and the PDF" },
      { href: "/ask", label: "Ask", blurb: "questions about my work, answered by Claude from the resume" },
      { href: "/services", label: "Services", blurb: "five practices, three ways to engage" },
      { href: "/contact", label: "Contact", blurb: "the inbox, and what helps a first email", primary: 4 },
      { href: "/projects", label: "Projects", blurb: "the curated bench: chips, platforms, instruments, math", primary: 3 },
      { href: "/housecalls", label: "House Calls", blurb: "business development, run by an AI, logged in the open" },
    ],
  },
  {
    title: "The evidence",
    links: [
      { href: "/work", label: "Work", blurb: "client projects, and four GitHub orgs counted", primary: 2 },
      { href: "/ai-pilot", label: "AI pilot", blurb: "the licence: sessions, models, ratings" },
      { href: "/cost-analysis", label: "Cost analysis", blurb: "what the work costs, modelled" },
      { href: "/the-shift", label: "The shift", blurb: "what changed when the tooling changed" },
      { href: "/papers", label: "Papers", blurb: "research notes, figures, and what held" },
      { href: "/mcp", label: "MCP catalog", blurb: "the servers, their tools, and the fleet" },
    ],
  },
  {
    title: "Running instruments",
    links: [
      // First, because it is the index of the rest: one page that says which of
      // the entries under it are answering right now.
      { href: "/bench", label: "The bench", blurb: "every live page on this server, and whether it is up" },
      { href: "/trng", label: "Hotbits", blurb: "true random numbers from radioactive decay" },
      { href: "/sdr", label: "SDR", blurb: "the scanner stack and what it is hearing" },
      { href: "/fleet", label: "Fleet", blurb: "node health across the cluster" },
      { href: "/dragonfli", label: "Dragonfli", blurb: "airspace, GPS, and the perception bus" },
      { href: "/visitors", label: "Knock knock", blurb: "who has been trying the doors, across every site here" },
      { href: "/6502", label: "6502", blurb: "the transistor-level chip and its archive" },
      { href: "/meatball", label: "Meatball", blurb: "the sensory robot: sight, sound, memory" },
    ],
  },
  {
    // Three pages that had no inbound link at all. They are not evidence and
    // they are not instruments reading hardware: each one is a thing the reader
    // operates, so they get a group that says so.
    title: "Things to operate",
    links: [
      { href: "/terminal", label: "Terminal", blurb: "the portfolio as a command line: type help" },
      { href: "/bio-mark", label: "Bio mark", blurb: "the wordmark taken apart: drag the dot" },
      { href: "/preferences", label: "Preferences", blurb: "what your device will let a page use" },
    ],
  },
]

/** Every link, flattened. */
export const NAV_LINKS: NavLink[] = NAV.flatMap((g) => g.links)

/** The masthead row, in its own order. Derived, never listed. */
export const PRIMARY_LINKS: NavLink[] = NAV_LINKS.filter((l) => l.primary !== undefined).sort(
  (a, b) => (a.primary ?? 0) - (b.primary ?? 0),
)

/**
 * Whether a path is inside a link's section: the page itself, or anything
 * under it. "/projects/prime-zoo" is in Projects; "/workshop" is not in Work,
 * which is why this compares against the href plus a slash and not a prefix.
 */
export function inSection(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * The routes that wear the kit, derived from the nav rather than listed twice.
 *
 * components/SiteChrome.tsx reads this to decide which shell to render. Anything
 * not in here, including every route with no nav entry at all, gets v3.
 */
/**
 * Kit routes that do not earn a menu entry.
 *
 * Sub-pages of something already in the nav: putting them in NAV would list
 * four Dragonfli entries where one belongs, and leaving them out of KIT_ROUTES
 * would give a child page v3 chrome under a kit parent, which is worse than
 * either. So they are named here, deliberately and visibly.
 */
const KIT_EXTRA = [
  "/dragonfli/airspace",
  "/dragonfli/gps",
  "/dragonfli/worldevent",
  "/meatball/log",
  "/meatball/memory",
  "/eyes",
  "/meatball/notes/senses",
  "/meatball/notes/listening",
  "/meatball/notes/motion",
  "/projects/prime-orchestra",
  "/projects/prime-zoo",
  "/projects/prime-atlas",
  "/projects/zeta-forge",
  "/projects/storm-plates",
  "/projects/critical-collapse",
  "/projects/computer-tree",
  "/projects/turfy",
  "/housecalls/plain",
  "/housecalls/network",
  "/housecalls/docs",
  "/housecalls/tools/quote",
  "/housecalls/tools/change-order",
  "/housecalls/tools/photos",
  "/housecalls/tools/materials",
  "/housecalls/tools",
  "/housecalls/tools/cards",
] as const

export const KIT_ROUTES: ReadonlySet<string> = new Set([
  ...NAV_LINKS.filter((l) => !l.legacy).map((l) => l.href),
  ...KIT_EXTRA,
])

/** The label for a path, for breadcrumbs. Null for the home page itself. */
export function navLabel(pathname: string): string | null {
  if (pathname === "/") return null
  return NAV_LINKS.find((l) => l.href === pathname)?.label ?? null
}
