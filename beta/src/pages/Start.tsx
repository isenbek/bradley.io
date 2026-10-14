// /start: the path from nothing to a live app, the kit's docs/new-app.md in seven steps.
import { onLink } from "@tinymachines/kit/lib/router";

const STEPS: { title: string; text: string; code?: string }[] = [
  { title: "Make the app", text: "One command copies the kit's example app, fills in your name (also the storage prefix and the install id) and your site, pins the kit to its newest tag, makes a git repository and installs the packages. bun only; the kit installs over ssh from a private repository.",
    code: "cd ~/projects/kit && ./scripts/new-app.sh myapp ~/projects/myapp https://myapp.example.com\ncd ~/projects/myapp && bun run dev" },
  { title: "Say who the app is", text: "src/app.config.ts is plain data: the name, the tagline, the site, the logo, every page with a title and a description, the Menu's doors, the shortcuts, and the theme a new reader sees. The tab's title, the share text and the install dialog all come from it. A theme of your own is checked for contrast, and refused if its text is too faint." },
  { title: "Write the pages", text: "src/App.tsx switches on the path between the header and the footer. The kit's pages (Themes, Sensors, Share, This app, Account) are imported by path; yours go in src/pages/. Use the kiosk vocabulary the zoo shows, and read colours from the tokens, never written in: a reader's theme has to reach everything." },
  { title: "Offline and install", text: "src/sw.ts is three lines. Name the paths the app must never answer itself (your API) in `pass`, and the service worker keeps every built file and waits for the reader's Reload before updating." },
  { title: "Check it", text: "Copy the kit's scripts/check-example.ts: it drives the built site in headless Chrome, every page with no error, the frame, the Menu, a theme that survives a reload, sharing with its QR code, the sensors, offline. Add what your app does. The deploy refuses without a pass on the commit." },
  { title: "Put it online", text: "Three scripts, copied from AstroStack or hotbits: the DNS record, the nginx site and its certificate, and the deploy (build, then rsync to the web root, then compare the live service worker with the build)." },
  { title: "Keep to the rules", text: "bun only, no CDN at runtime, large type and high contrast, themes checked for contrast, and a page's claims measured, never assumed. A fix every app needs goes in the kit, checked and tagged there, never patched in one app." },
];

export default function Start() {
  return (
    <article>
      <p className="kicker">bradley.io · <b>start an app</b></p>
      <h1>Start an app</h1>
      <p className="lede">From nothing to a live app on the kit. AstroStack took an afternoon by hand; hotbits and this site came out of the command below.</p>
      <ol className="bio-steps">
        {STEPS.map((s, i) => (
          <li key={i} className="panel">
            <h2><span className="bio-n">{i + 1}</span>{s.title}</h2>
            <p>{s.text}</p>
            {s.code ? <pre className="bio-code">{s.code}</pre> : null}
          </li>
        ))}
      </ol>
      <p className="src">The full guide is the kit's <code>docs/new-app.md</code>. See every piece working first in <a href="/zoo" onClick={onLink}>the zoo</a>.</p>
    </article>
  );
}
