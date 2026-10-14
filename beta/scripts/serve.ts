// Serve a built dist/ the way nginx will on beta.bradley.io: static files, index.html for the app's routes,
// /api/v1/ passed to the account service, the rest of /api/ to the main site, (the bradley.io beta instance, 127.0.0.1:8115). For the checks; not a deploy path.
//   bun run scripts/serve.ts [dist] [port]      default dist, 4451
import { join } from "path";

const dist = process.argv[2] ?? join(import.meta.dir, "..", "dist");
const port = Number(process.argv[3] ?? 4451);
const API = process.env.BETA_API ?? "http://127.0.0.1:8115";
const MAIN = process.env.BETA_MAIN ?? "http://127.0.0.1:32221";   // the main site, for /api/now and /api/fleet-up
const TYPES: Record<string, string> = { ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json", ".html": "text/html; charset=utf-8", ".txt": "text/plain" };

Bun.serve({
  hostname: "127.0.0.1", port,
  async fetch(req) {
    const u = new URL(req.url);
    if (u.pathname.startsWith("/api/") && !u.pathname.startsWith("/api/v1/")) {
      const r = await fetch(`${MAIN}${u.pathname}${u.search}`).catch(() => null);
      return r ?? new Response("main site unreachable", { status: 502 });
    }
    if (u.pathname.startsWith("/api/")) {
      const r = await fetch(`${API}${u.pathname.slice(4)}${u.search}`, { method: req.method, headers: req.headers, body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer() }).catch(() => null);
      return r ?? new Response("account service unreachable", { status: 502 });
    }
    const f = Bun.file(join(dist, u.pathname));
    if (u.pathname !== "/" && !u.pathname.endsWith("/") && (await f.exists())) {
      const ext = u.pathname.slice(u.pathname.lastIndexOf("."));
      return new Response(f, { headers: { "content-type": TYPES[ext] ?? "application/octet-stream", ...(u.pathname.endsWith("sw.js") ? { "cache-control": "no-cache" } : {}) } });
    }
    return new Response(Bun.file(join(dist, "index.html")), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" } });
  },
});
console.log(`serving ${dist} at http://127.0.0.1:${port}; /api/ goes to ${API}`);
