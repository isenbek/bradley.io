import { FAMILY } from "@/components/kit/family-data"

/**
 * The rel for a link that leaves this site.
 *
 * Every outbound link opens with "noopener noreferrer": the page we link to
 * learns nothing about where its reader came from. Except the family. A link
 * to meatball.ai, sysforge.ai or tinymachines.ai is a door between our own
 * sites, and the family's first-party measure (docket item 7: nginx logs,
 * no cookie, no pixel) counts a door only when the receiving site's log sees
 * where the reader came from. Browsers send just the origin across sites
 * (strict-origin-when-cross-origin), never the path, so keeping it costs the
 * reader nothing they would not already send to any other site.
 *
 * The family comes from the registry (./components/kit/family-data.ts), so a
 * new family site gets the same treatment without an edit here.
 */
const FAMILY_HOSTS = new Set(
  FAMILY.flatMap((f) => (f.href ? [new URL(f.href).hostname, `www.${new URL(f.href).hostname}`] : [])),
)

export function externalRel(href: string): string {
  try {
    return FAMILY_HOSTS.has(new URL(href).hostname) ? "noopener" : "noopener noreferrer"
  } catch {
    return "noopener noreferrer"
  }
}
