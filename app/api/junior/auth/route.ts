import { cookies } from "next/headers"
import {
  JUNIOR_COOKIE,
  clientIp,
  juniorPin,
  mintToken,
  safeEqual,
  throttleCheck,
  throttleFail,
  throttleReset,
} from "@/lib/junior-session"

// TEMPORARY — see lib/junior-session.ts
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: Request) {
  const ip = clientIp(req)

  const gate = throttleCheck(ip)
  if (!gate.allowed) {
    return Response.json(
      { ok: false, error: `Too many attempts. Try again in ${Math.ceil(gate.retryAfterSec / 60)} min.` },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
    )
  }

  const expected = juniorPin()
  if (!expected) {
    return Response.json({ ok: false, error: "Gate not configured on this host." }, { status: 503 })
  }

  let pin = ""
  try {
    const body = await req.json()
    pin = typeof body?.pin === "string" ? body.pin.trim() : ""
  } catch {
    return Response.json({ ok: false, error: "Bad request." }, { status: 400 })
  }

  if (!safeEqual(pin, expected)) {
    throttleFail(ip)
    return Response.json({ ok: false, error: "Wrong PIN." }, { status: 401 })
  }

  throttleReset(ip)
  const jar = await cookies()
  jar.set(JUNIOR_COOKIE, mintToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  })

  return Response.json({ ok: true })
}

/** Sign out — used by the "lock" button on the page. */
export async function DELETE() {
  const jar = await cookies()
  jar.delete(JUNIOR_COOKIE)
  return Response.json({ ok: true })
}
