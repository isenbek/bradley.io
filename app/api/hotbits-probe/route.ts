import { promises as fs } from "fs"
import path from "path"

const UPSTREAM = "https://hotbits.tinymachines.ai/health"
// .next/cache is in the systemd unit's ReadWritePaths; PrivateTmp=true rules out /tmp.
const MARKER = path.join(process.cwd(), ".next", "cache", "hotbits-status.json")

export const dynamic = "force-dynamic"

interface MarkerState {
  status: number
  up: boolean
  checked_at_iso: string
  transitioned_at_iso?: string
  prev_up?: boolean
}

async function readPrev(): Promise<MarkerState | null> {
  try {
    const buf = await fs.readFile(MARKER, "utf-8")
    return JSON.parse(buf) as MarkerState
  } catch {
    return null
  }
}

export async function GET() {
  const now = new Date().toISOString()
  let status = 0
  try {
    const upstream = await fetch(UPSTREAM, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    })
    status = upstream.status
  } catch {
    status = 0
  }

  const up = status === 200
  const prev = await readPrev()
  const flipped = prev && prev.up !== up

  const state: MarkerState = {
    status,
    up,
    checked_at_iso: now,
    prev_up: prev?.up,
    transitioned_at_iso: flipped ? now : prev?.transitioned_at_iso,
  }

  await fs.mkdir(path.dirname(MARKER), { recursive: true })
  await fs.writeFile(MARKER, JSON.stringify(state, null, 2))

  if (flipped) {
    // Surfaces in journalctl -u bradley-io
    console.log(
      `[hotbits-probe] TRANSITION ${prev?.up ? "UP→DOWN" : "DOWN→UP"} ` +
        `status=${status} at=${now}`
    )
  }

  return Response.json(state)
}
