import { cookies } from "next/headers"
import { JUNIOR_COOKIE, verifyToken } from "@/lib/junior-session"
import { JuniorGate } from "@/components/junior/JuniorGate"
import { JuniorConsole } from "@/components/junior/JuniorConsole"

// TEMPORARY — the whole /junior tree gets deleted at teardown.
// See docs/junior-teardown.md.
export const dynamic = "force-dynamic"

export default async function JuniorPage() {
  const jar = await cookies()
  const authed = verifyToken(jar.get(JUNIOR_COOKIE)?.value)

  if (!authed) return <JuniorGate />
  return <JuniorConsole />
}
