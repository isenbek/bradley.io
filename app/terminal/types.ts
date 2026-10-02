/**
 * What the terminal is given to print.
 *
 * Types only, so the client component can import this file without pulling
 * `fs` into the browser. The values are assembled on the server by ./load.ts
 * and handed to the terminal as one prop: the browser never downloads the
 * site's data files to answer a command, and nothing a command prints is typed
 * into the component by hand unless ./commands.tsx says where it came from.
 */

import type { SiteStats } from "@/lib/site-data"

export interface TermRole {
  years: string
  title: string
  company: string
  location?: string
  context?: string
}

export interface TermOrg {
  name: string
  what: string
  gh?: string
  /** Anchor on /work. */
  slug: string
  repos: number
  /** Commits dated on or after `since`, whoever wrote them. See app/work/_orgs.ts. */
  commits: number
  /** ISO day of the owner's first commit in the org. */
  since: string
}

export interface TermLink {
  href: string
  label: string
  blurb: string
}

export interface TermData {
  build: {
    version: string
    commit: string
    commitFull: string
    /** ISO. When the build that served this page was made. */
    built: string
  }
  resume: {
    headline: string
    summary: string[]
    /** 2014 to the present. */
    roles: TermRole[]
    /** 1997 to 2014. */
    earlier: TermRole[]
    expertise: { area: string; items: string[] }[]
    education: { what: string; where: string }[]
    /** "YYYY-MM-DD", the date on the PDF. */
    updated: string
    pdf: string
  }
  /** Null when site-data.json could not be read. */
  stats: SiteStats | null
  /** ISO. When the pipeline wrote site-data.json. */
  statsGenerated: string | null
  orgs: TermOrg[]
  /** How many org timelines there should be; fewer in `orgs` means a file did not parse. */
  orgsExpected: number
  /** ISO. The newest of the timeline files' own stamps. */
  orgsGenerated: string | null
  /** The "Running instruments" group of the site menu, in menu order. */
  bench: TermLink[]
}
