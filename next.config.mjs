/* global process */
import createMDX from '@next/mdx'

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
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self), accelerometer=(self), gyroscope=(self), magnetometer=(self), ambient-light-sensor=(self)' },
        ],
      },
    ]
  },
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
