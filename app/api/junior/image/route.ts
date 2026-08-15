import { createReadStream } from "fs"
import { promises as fs } from "fs"
import { Readable } from "stream"
import { cookies } from "next/headers"
import { JUNIOR_COOKIE, verifyToken } from "@/lib/junior-session"

// TEMPORARY — serves the built OpenWrt factory image behind the same PIN gate.
// bradley-io.service runs ProtectSystem=strict, which leaves the whole tree
// readable (it only blocks writes), so reading from /mnt/ursa is fine.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const IMAGE =
  process.env.JUNIOR_IMAGE_PATH ||
  "/mnt/ursa/build/openwrt-rpi5/out/openwrt-24.10.1-bcm27xx-bcm2712-rpi-5-squashfs-factory.img.gz"

const FILENAME = IMAGE.split("/").pop() || "openwrt.img.gz"

export async function GET() {
  const jar = await cookies()
  if (!verifyToken(jar.get(JUNIOR_COOKIE)?.value)) {
    return new Response("locked", { status: 401 })
  }

  let size: number
  try {
    size = (await fs.stat(IMAGE)).size
  } catch {
    // /mnt/ursa is a spinning disk that has dropped off the bus before — say so
    // rather than serving a truncated file.
    return new Response("image unavailable on this host", { status: 503 })
  }

  const stream = Readable.toWeb(createReadStream(IMAGE)) as ReadableStream<Uint8Array>

  return new Response(stream, {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Length": String(size),
      "Content-Disposition": `attachment; filename="${FILENAME}"`,
      "Cache-Control": "no-store",
    },
  })
}
