import { NextRequest } from "next/server"

const TRNG_UPSTREAM = "https://hotbits.tinymachines.ai"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const search = req.nextUrl.search
  const target = `${TRNG_UPSTREAM}/${path.join("/")}${search}`

  try {
    const upstream = await fetch(target, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    })
    const body = await upstream.text()
    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    })
  } catch (err) {
    return Response.json(
      { error: "upstream_fetch_failed", message: (err as Error).message },
      { status: 502 }
    )
  }
}
