// TEMPORARY — serve the recovery image + config backup for /junior.
// Delete at teardown.
//
// ⚠️ These files contain SECRETS: the WireGuard private key, the root password
// hash, ssh host keys and the NextDNS profile ID. They are gated by the same
// PIN cookie as the rest of /junior and must never be linked publicly.
//
// The filename is matched against the actual directory listing rather than
// being concatenated into a path, so traversal is structurally impossible.

import { createReadStream } from "node:fs"
import { readdir, stat } from "node:fs/promises"
import { join } from "node:path"
import { Readable } from "node:stream"
import { cookies } from "next/headers"
import { JUNIOR_COOKIE, verifyToken } from "@/lib/junior-session"

export const dynamic = "force-dynamic"

const DIR = "/mnt/ursa/build/openwrt-rpi5/recovery"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const jar = await cookies()
  if (!verifyToken(jar.get(JUNIOR_COOKIE)?.value)) {
    return new Response(null, { status: 401 })
  }

  const { file } = await params

  let names: string[]
  try {
    names = await readdir(DIR)
  } catch {
    // /mnt/ursa cold-spins; a slow or absent mount is a 503, not a 404.
    return new Response("recovery store unavailable", { status: 503 })
  }
  const match = names.find((n) => n === file)
  if (!match) return new Response("not found", { status: 404 })

  const path = join(DIR, match)
  let size: number
  try {
    size = (await stat(path)).size
  } catch {
    return new Response("unavailable", { status: 503 })
  }

  const isText = match.endsWith(".txt") || match === "sha256sums"
  const stream = Readable.toWeb(createReadStream(path)) as ReadableStream

  return new Response(stream, {
    headers: {
      "Content-Type": isText ? "text/plain; charset=utf-8" : "application/octet-stream",
      "Content-Length": String(size),
      "Content-Disposition": `${isText ? "inline" : "attachment"}; filename="${match}"`,
      "Cache-Control": "no-store",
    },
  })
}
