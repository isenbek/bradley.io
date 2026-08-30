"use client"

import { KitShell } from "@/components/KitShell"

/**
 * The site shell.
 *
 * This used to branch per route between the tinymachines style kit and the older
 * v3 design, because the two ran side by side while the port was in progress.
 * Every one of the site's routes is on the kit now, so the branch had no
 * reachable second arm and app/v3.css has been deleted.
 *
 * The one page that is deliberately not on the kit is /terminal, and it is not a
 * chrome decision: it wears kit chrome like everything else and styles only the
 * CRT inside it, from app/terminal.css, which its own route layout loads.
 *
 * `children` arrives as a prop, so the page subtree stays server-rendered. This
 * component is a client boundary; the pages inside it are not.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return <KitShell>{children}</KitShell>
}
