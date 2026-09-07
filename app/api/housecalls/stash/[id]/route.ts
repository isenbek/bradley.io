import { NextRequest, NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync, existsSync } from "node:fs"
import path from "node:path"

export const runtime = "nodejs"

/**
 * The zero-knowledge stash (housecalls-harness P2; plan at
 * /housecalls/docs/local-harness-plan). Stores ONE encrypted envelope per
 * stash id: the body is AES-GCM ciphertext produced on the user's device
 * from their twelve words, and this server can verify its shape (HCV1
 * magic, hash, size) without being able to read a byte of the content.
 * The entire directory is other people's ciphertext.
 *
 * Rules, mirroring the engine's sync seatbelt:
 *   - id is 64 hex chars (derived from the seed, unguessable, no accounts)
 *   - PUT accepted only when x-stash-version > stored version
 *   - body must open with the HCV1 magic and match x-stash-sha256
 *   - 4MB cap, one write per id per 10 seconds
 */

const STASH_DIR = path.join(process.cwd(), "data", "housecalls-stash")
const MAX_BYTES = 4 * 1024 * 1024
const MIN_WRITE_GAP_MS = 10_000
const ID_RE = /^[0-9a-f]{64}$/

interface Meta {
  version: number
  sha256: string
  bytes: number
  updated_at: string
}

const metaPath = (id: string) => path.join(STASH_DIR, `${id}.json`)
const blobPath = (id: string) => path.join(STASH_DIR, `${id}.bin`)

function readMeta(id: string): Meta | null {
  try {
    return JSON.parse(readFileSync(metaPath(id), "utf8"))
  } catch {
    return null
  }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  if (!ID_RE.test(id)) return NextResponse.json({ error: "bad id" }, { status: 400 })
  const meta = readMeta(id)
  if (!meta || !existsSync(blobPath(id))) {
    return NextResponse.json({ error: "no stash" }, { status: 404 })
  }
  const blob = readFileSync(blobPath(id))
  return new NextResponse(new Uint8Array(blob), {
    headers: {
      "content-type": "application/octet-stream",
      "x-stash-version": String(meta.version),
      "x-stash-sha256": meta.sha256,
      "cache-control": "no-store",
    },
  })
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  if (!ID_RE.test(id)) return NextResponse.json({ error: "bad id" }, { status: 400 })

  const version = Number(req.headers.get("x-stash-version"))
  if (!Number.isInteger(version) || version < 1) {
    return NextResponse.json({ error: "x-stash-version must be a positive integer" }, { status: 400 })
  }
  const claimed = (req.headers.get("x-stash-sha256") ?? "").toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(claimed)) {
    return NextResponse.json({ error: "x-stash-sha256 required" }, { status: 400 })
  }

  const body = Buffer.from(await req.arrayBuffer())
  if (body.length > MAX_BYTES) {
    return NextResponse.json({ error: `stash over ${MAX_BYTES} bytes` }, { status: 413 })
  }
  // The envelope format is public; its contents are not. Shape-check only.
  if (body.length < 17 || body.subarray(0, 4).toString("latin1") !== "HCV1") {
    return NextResponse.json({ error: "not an HCV1 envelope" }, { status: 400 })
  }
  const actual = createHash("sha256").update(body).digest("hex")
  if (actual !== claimed) {
    return NextResponse.json({ error: "sha256 mismatch" }, { status: 400 })
  }

  const existing = readMeta(id)
  if (existing) {
    // The engine's seatbelt, server side: strictly newer wins; a stale
    // phone pulls first instead of clobbering a newer backup blindly.
    if (version <= existing.version) {
      return NextResponse.json(
        { error: "stale version; pull first", stored_version: existing.version },
        { status: 409 }
      )
    }
    const age = Date.now() - statSync(metaPath(id)).mtimeMs
    if (age < MIN_WRITE_GAP_MS) {
      return NextResponse.json({ error: "one write per 10s" }, { status: 429 })
    }
  }

  mkdirSync(STASH_DIR, { recursive: true })
  const meta: Meta = { version, sha256: actual, bytes: body.length, updated_at: new Date().toISOString() }
  // Atomic-enough on one filesystem: temp then rename, blob before meta so
  // a crash between the two leaves the OLD meta pointing at... the old
  // blob is gone in that window, so meta LAST means a reader may briefly
  // see old meta + new blob; hash check on read is the client's guard.
  const tmpBlob = blobPath(id) + ".tmp"
  writeFileSync(tmpBlob, body)
  renameSync(tmpBlob, blobPath(id))
  const tmpMeta = metaPath(id) + ".tmp"
  writeFileSync(tmpMeta, JSON.stringify(meta))
  renameSync(tmpMeta, metaPath(id))

  return NextResponse.json({ ok: true, version, sha256: actual, bytes: body.length })
}
