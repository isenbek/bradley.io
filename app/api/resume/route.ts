import { resumeDocument } from "@/lib/resume-mcp"

/**
 * GET /api/resume: the resume as one JSON document.
 *
 * The original site served this path until the February 2026 rewrite (it read
 * docs/autoresume/resume-integration.json). This one reads lib/resume.ts, the
 * same data /resume renders, so the page, the PDF link and this JSON cannot
 * disagree. Static: rebuilt on each deploy, and `generated` is that time.
 *
 * The headers below survive prerendering: Next 16's app-route template stores
 * the handler's headers with the cached body and only adds its own
 * Cache-Control when the response has none.
 */

export const dynamic = "force-static"

export function GET() {
  return Response.json(resumeDocument(), {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  })
}
