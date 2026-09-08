import { NextRequest, NextResponse } from "next/server";

// OAuth 2 redirect target for the John Deere sandbox integration.
// Stores nothing: it renders the one-time authorization code for the
// operator to paste into `node scripts/housecalls-deere.mjs exchange`.
// The token exchange happens offline with the app secret, which never
// touches this server process.

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const code = p.get("code") ?? "";
  const state = p.get("state") ?? "";
  const error = p.get("error") ?? "";
  const errorDescription = p.get("error_description") ?? "";

  const body = error
    ? `<h1>Authorization did not complete</h1>
       <p><code>${esc(error)}</code> ${esc(errorDescription)}</p>`
    : code
      ? `<h1>Authorization code received</h1>
         <p>Paste this into the exchange command. It is single-use and
         expires in minutes; this page stored nothing.</p>
         <pre>${esc(code)}</pre>
         <p>state: <code>${esc(state)}</code></p>
         <pre>node scripts/housecalls-deere.mjs exchange --code ${esc(code)}</pre>`
      : `<h1>Deere OAuth callback</h1>
         <p>Nothing to see: this endpoint only receives authorization
         redirects from signin.johndeere.com and stores nothing.</p>`;

  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Deere OAuth callback</title>
<style>body{font-family:ui-monospace,monospace;max-width:40rem;margin:3rem auto;padding:0 1rem;background:#fdfcf9;color:#1c1c1c}pre{background:#14171a;color:#e8e8e8;padding:.75rem;overflow-x:auto;word-break:break-all;white-space:pre-wrap}</style>
</head><body>${body}</body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
