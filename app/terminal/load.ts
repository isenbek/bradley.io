/**
 * Assemble what the terminal prints. SERVER ONLY (reads the disk).
 *
 * Every field comes from a module or file that another page already reads, so
 * the terminal cannot say something the rest of the site does not:
 *
 *   build    lib/build-info.json, the same stamp the footer prints
 *   resume   lib/resume.ts, which traces every line to the owner's documents
 *   stats    public/data/site-data.json `stats`, as the home page's Site index
 *   orgs     app/work/_orgs.ts, the rollups /work draws
 *   bench    app/_nav.ts, the "Running instruments" group of the menu
 *
 * The project list in site-data.json is deliberately NOT passed through. It is
 * the pipeline's inventory of working directories and chat projects, and many
 * of its descriptions were written by a model about things it had not seen.
 * The `projects` command prints the hand-curated list instead (./commands.tsx).
 */

import buildInfo from "@/lib/build-info.json"
import {
  EARLIER_ROLES,
  EDUCATION,
  EXPERTISE,
  HEADLINE,
  RESUME_PDF,
  RESUME_UPDATED,
  ROLES,
  SUMMARY,
  type ResumeRole,
} from "@/lib/resume"
import { loadSiteDataStatic } from "@/lib/site-data"
import { NAV } from "../_nav"
import { loadOrgRollups } from "../work/_orgs"
import type { TermData, TermRole } from "./types"

function role(r: ResumeRole): TermRole {
  return {
    years: r.years,
    title: r.title,
    company: r.company,
    location: r.location,
    context: r.context,
  }
}

export async function loadTerminalData(): Promise<TermData> {
  let stats: TermData["stats"] = null
  let statsGenerated: string | null = null
  try {
    const site = await loadSiteDataStatic()
    stats = site.stats ?? null
    statsGenerated = site.generated ?? null
  } catch {
    /* The stats command says the file could not be read. */
  }

  const { orgs, expected } = loadOrgRollups()
  const orgsGenerated =
    orgs
      .map((o) => o.generated)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null

  const instruments = NAV.find((g) => g.title === "Running instruments")

  return {
    build: {
      version: buildInfo.version,
      commit: buildInfo.commitHash,
      commitFull: buildInfo.commitHashFull,
      built: buildInfo.buildTime,
    },
    resume: {
      headline: HEADLINE,
      summary: SUMMARY,
      roles: ROLES.map(role),
      earlier: EARLIER_ROLES.map(role),
      expertise: EXPERTISE,
      education: EDUCATION,
      updated: RESUME_UPDATED,
      pdf: RESUME_PDF,
    },
    stats,
    statsGenerated,
    orgs: orgs.map((o) => ({
      name: o.displayName,
      what: o.what,
      gh: o.gh,
      slug: o.slug,
      repos: o.totalRepos,
      commits: o.commitsSince,
      since: o.since,
    })),
    orgsExpected: expected,
    orgsGenerated,
    bench: (instruments?.links ?? []).map((l) => ({ href: l.href, label: l.label, blurb: l.blurb })),
  }
}
