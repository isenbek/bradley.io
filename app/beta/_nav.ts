/**
 * Beta's navigation, in one place.
 *
 * The menu, the footer and the breadcrumb labels all read this. Upstream's rule
 * is the reason: ten hand-copied nav lists had already drifted three ways before
 * anyone noticed, because a nav missing one link still looks exactly like a nav.
 *
 * The descriptions are not decoration. The kit's .menu-item renders a label and a
 * line under it, and a menu that says only "Analytics" makes the reader open the
 * page to find out whether it is the one they wanted.
 */

export interface BetaLink {
  href: string
  label: string
  /** The line under the label in the menu sheet. Lower case, no full stop. */
  blurb: string
}

export interface BetaNavGroup {
  /** Heading on the group in the menu sheet. */
  title: string
  links: BetaLink[]
}

export const BETA_NAV: BetaNavGroup[] = [
  {
    title: "The site",
    links: [
      { href: "/beta", label: "Home", blurb: "what I build and who it is for" },
      { href: "/beta/about", label: "About", blurb: "the bio, the timeline, the numbers" },
      { href: "/beta/services", label: "Services", blurb: "five practices, three ways to engage" },
      { href: "/beta/contact", label: "Contact", blurb: "the inbox, and what helps a first email" },
    ],
  },
  {
    title: "The evidence",
    links: [
      { href: "/beta/work", label: "Work", blurb: "four GitHub orgs, commit history rolled up" },
      { href: "/beta/ai-pilot", label: "AI pilot", blurb: "the licence: sessions, models, ratings" },
      { href: "/beta/pilot-analytics", label: "Pilot analytics", blurb: "the same record, cut finer" },
      { href: "/beta/cost-analysis", label: "Cost analysis", blurb: "what the work costs, modelled" },
      { href: "/beta/the-shift", label: "The shift", blurb: "what changed when the tooling changed" },
      { href: "/beta/papers", label: "Papers", blurb: "what I read, and when" },
      { href: "/beta/mcp", label: "MCP catalog", blurb: "the servers, and what each one exposes" },
    ],
  },
]

/** Every beta link, flattened. Used by the footer and by route checks. */
export const BETA_LINKS: BetaLink[] = BETA_NAV.flatMap((g) => g.links)

/** The label for a beta path, for breadcrumbs. Null for the beta home itself. */
export function betaLabel(pathname: string): string | null {
  if (pathname === "/beta") return null
  return BETA_LINKS.find((l) => l.href === pathname)?.label ?? null
}
