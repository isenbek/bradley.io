import { readFile } from "node:fs/promises"
import { join } from "node:path"

// Serves the Parquet bundle (data/claude-activity-export.zip) for offline
// analysis. Built by scripts/claude-activity-viz.py --zip.
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const p = join(process.cwd(), "data", "claude-activity-export.zip")
    const buf = await readFile(p)
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "content-type": "application/zip",
        "content-disposition": 'attachment; filename="claude-activity-export.zip"',
        "cache-control": "no-store",
      },
    })
  } catch {
    return Response.json({ error: "not_built" }, { status: 503 })
  }
}
