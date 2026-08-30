/* global process */
import createMDX from '@next/mdx'
import { readFileSync } from 'node:fs'

/**
 * One redirect per retired project dossier, pointing at /projects.
 *
 * The seven hand-built instrument pages under /projects/<name> are excluded:
 * they still exist as real routes and a redirect would shadow them.
 */
function retiredDossierRedirects() {
  const KEPT = new Set([
    'turfy', 'prime-orchestra', 'prime-zoo', 'prime-atlas',
    'zeta-forge', 'storm-plates', 'critical-collapse',
    // Already redirected to /work above; listing them here would duplicate.
    'isenbek', 'tinymachines', 'nominate-ai', 'sysforge-ai',
  ])
  // BOTH sources, because the dossiers had two. site-data.json carried 85
  // curated projects; the other ~150 came from the four mission timelines,
  // which is what the deleted allTimelineRepoSlugs() walked. Reading only the
  // first left /projects/cbship and /projects/junior falling through to the
  // home page.
  const slugs = new Set()
  const files = [
    'site-data.json',
    'isenbek-timeline.json',
    'tinymachines-timeline.json',
    'nominate-ai-timeline.json',
    'sysforge-ai-timeline.json',
  ]
  try {
    for (const f of files) {
      let data
      try {
        data = JSON.parse(readFileSync(`./public/data/${f}`, 'utf-8'))
      } catch {
        continue // one missing timeline is not a build failure
      }
      for (const p of data.projects || []) if (p?.slug) slugs.add(p.slug)
      for (const r of data.repos || []) if (r?.name) slugs.add(r.name)
    }
    return [...slugs]
      .filter((slug) => !KEPT.has(slug))
      .map((slug) => ({
        source: `/projects/${slug}`,
        destination: '/projects',
        permanent: true,
      }))
  } catch {
    // No data file is not a build failure: the pages are gone either way, and
    // not-found.tsx still catches them.
    return []
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      // v3 was the preview prefix; after the swap the canonical URL is the
      // bare path. Permanent redirects preserve any bookmarks / shared links.
      { source: '/v3', destination: '/', permanent: true },
      { source: '/v3/:path*', destination: '/:path*', permanent: true },

      // Same story one design later: /beta was where the style-kit rebuild was
      // previewed, and at the cutover those eleven pages took the canonical
      // paths. Every /beta URL shared while it was a preview keeps working.
      //
      // These sit AFTER the /v3 rules and before nothing: order only matters
      // against another rule that could match the same path, and none can.
      { source: '/beta', destination: '/', permanent: true },
      { source: '/beta/:path*', destination: '/:path*', permanent: true },

      // ---- The v3 retirement, 2026-08-29 -------------------------------
      // /lab is gone. Its three field notes were the Meatball write-ups and
      // moved under the project they belong to; the index itself described a
      // catalog that no longer exists.
      { source: '/lab/senses', destination: '/meatball/notes/senses', permanent: true },
      { source: '/lab/listening', destination: '/meatball/notes/listening', permanent: true },
      { source: '/lab/motion', destination: '/meatball/notes/motion', permanent: true },
      { source: '/lab/bio-mark', destination: '/bio-mark', permanent: true },
      { source: '/lab', destination: '/meatball', permanent: true },
      // Anything else under /lab was the catalog.
      { source: '/lab/:path*', destination: '/projects', permanent: true },

      // The four org dossier pages are superseded by /work, which answers the
      // same question from the same commit data in one screen.
      { source: '/projects/isenbek', destination: '/work', permanent: true },
      { source: '/projects/tinymachines', destination: '/work', permanent: true },
      { source: '/projects/nominate-ai', destination: '/work', permanent: true },
      { source: '/projects/sysforge-ai', destination: '/work', permanent: true },

      // The 236 retired per-repository dossiers, named one by one.
      //
      // A `/projects/:slug` catch-all is NOT usable here: Next matches redirects
      // BEFORE filesystem routes, so it would swallow the seven hand-built
      // instrument pages that still live at /projects/<name>.
      //
      // Without an explicit rule these would still not 404: app/not-found.tsx
      // calls permanentRedirect("/"), so every unknown path lands on the home
      // page. That is a poor destination for 236 URLs a crawler already knows,
      // and search engines read a mass redirect to the root as a soft 404.
      // /projects is the topical answer, and it says in as many words what
      // happened to them.
      //
      // Generated from the same site-data.json that generated the pages, so the
      // list cannot drift from what actually existed.
      ...retiredDossierRedirects(),
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // SAMEORIGIN (not DENY) so the site can frame its own self-contained
          // tools (e.g. /lab/bio-mark embeds /bio-mark.html); still blocks
          // cross-origin framing (clickjacking protection intact).
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Allow first-party (self) access to device capabilities — the maps
          // show "you are here" (geolocation) and the /preferences sensor scanner
          // probes camera/mic/motion sensors. Cross-origin embeds stay blocked.
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self), accelerometer=(self), gyroscope=(self), magnetometer=(self), fullscreen=(self), clipboard-read=(self), clipboard-write=(self)' },
        ],
      },
    ]
  },
  // Staged builds: deploy.sh sets NEXT_DIST_DIR so a build lands in a scratch
  // directory and is swapped into .next only after it SUCCEEDS. Without this a
  // failed build corrupts the directory systemd is actively serving — which on
  // 2026-08-15 left bradley.io serving HTML with a 500 on its stylesheet.
  // `next start` runs with NEXT_DIST_DIR unset, so it always reads .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',

  trailingSlash: false,
}

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: ['remark-gfm'],
    rehypePlugins: [],
  },
})

export default withMDX(nextConfig)
