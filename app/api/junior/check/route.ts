import { cookies } from "next/headers"
import { JUNIOR_COOKIE, verifyToken } from "@/lib/junior-session"

// TEMPORARY — subrequest target for nginx `auth_request` in front of the ttyd
// websocket at /junior/pty. nginx treats 2xx as pass and 401/403 as deny, so
// this is the only thing standing between the internet and the shell.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const jar = await cookies()
  const ok = verifyToken(jar.get(JUNIOR_COOKIE)?.value)
  return new Response(null, { status: ok ? 204 : 401 })
}
