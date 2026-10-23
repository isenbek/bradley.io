import { buildTmManifest } from "@/lib/tm-manifest"

/** The link manifest (lib/tm-manifest.ts), built once at build time. */
export const dynamic = "force-static"

export function GET() {
  return Response.json(buildTmManifest())
}
