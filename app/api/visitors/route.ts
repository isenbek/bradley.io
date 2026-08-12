import { readFile } from "fs/promises"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SNAPSHOT =
  process.env.VISITORS_SNAPSHOT ?? "/var/lib/bradley-cam/visitors.json"

/**
 * Serves the aggregation snapshot written by scripts/visitors_collector.py.
 * The route deliberately does no parsing of its own — if the collector has
 * never run, that is a visible "collector offline" state rather than an
 * empty-looking page pretending there were no visitors.
 */
export async function GET() {
  try {
    const raw = await readFile(SNAPSHOT, "utf-8")
    return new NextResponse(raw, {
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=60, stale-while-revalidate=300",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "collector-offline", snapshot: SNAPSHOT },
      { status: 503 }
    )
  }
}
