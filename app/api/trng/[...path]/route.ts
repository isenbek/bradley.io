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
      signal: AbortSignal.timeout(30_000),
    })
    // Read as bytes, not text() — /random/{bytes,raw,archive} are octet-streams
    // and text-decoding mangles them (wrong length, replacement chars). Bytes
    // pass JSON endpoints through unharmed too (content-type stays JSON).
    const buf = await upstream.arrayBuffer()
    const headers = new Headers({
      "content-type": upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    })
    // Forward geiger's informational headers (archive offset/size, conditioning).
    for (const h of ["x-geiger-conditioning", "x-geiger-archive", "x-archive-offset", "x-archive-size"]) {
      const v = upstream.headers.get(h)
      if (v) headers.set(h, v)
    }
    return new Response(buf, { status: upstream.status, headers })
  } catch (err) {
    return Response.json(
      { error: "upstream_fetch_failed", message: (err as Error).message },
      { status: 502 }
    )
  }
}
