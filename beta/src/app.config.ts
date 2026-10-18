// Who this app is: plain data, no kit code, so vite.config.ts can import it too (for the manifest and
// /seo.json). src/app.ts hands it to the kit; main.tsx imports that first.
//
// beta.bradley.io: the simplified bradley.io, as an app on @tinymachines/kit. For now a shell: the kit's demo pages
// (the zoo, the widget bench, sensors, themes, install, sign-in) under bradley.io's mark and colours; the content comes
// in through GitHub issues on isenbek/bradley.io.
import type { AppConfig } from "@tinymachines/kit/app";

declare const __APP_VERSION__: string;
declare const __GIT_COMMIT__: string;
declare const __BUILD_DATE__: string;
const build = typeof __APP_VERSION__ === "string" ? { version: __APP_VERSION__, commit: __GIT_COMMIT__, date: __BUILD_DATE__ } : { version: "0.0.0", commit: "node", date: new Date().toISOString() };

export const APP: AppConfig = {
  name: "bradley.io",
  tagline: "production software in days, from ready-made parts",
  site: "https://beta.bradley.io",
  prefix: "bradleyio",
  yourFiles: "/files",
  logo: "/logo.svg",
  logoDark: "/logo-dark.svg",
  protocol: "web+bradleyio",
  build,
  // bradley.io's colours, from the site's style kit (app/beta/kit/tokens.css): warm datasheet paper, ink, the
  // instrument panel, and Ocean as the one brand hue. Two themes, both through the kit's contrast checks
  // (Datasheet: text 16:1, quiet text 5.4:1, brand 7.0:1; Instrument: brand 7.3:1, quiet text 6.8:1).
  theme: { default: "datasheet", extra: [
    { id: "datasheet", name: "Datasheet", colors: {
      ground: "#E8E5DD", sheet: "#F4F2EC", ink: "#16150F", ink2: "#2B2A25", mute: "#5E5B55", line: "#CFCBC0", tint: "#DDEDEF",
      brand: "#1A5A61", brandBg: "#131311", onInk: "#E9E6DE", onInkMute: "#9A9791", alert: "#8E3D1C",
      mapSea: "#DDEDEF", mapLand: "#F4F2EC", mapLine: "#8C8A85" } },
    { id: "instrument", name: "Instrument", colors: {
      ground: "#0B0B0A", sheet: "#1E1D1A", ink: "#E9E6DE", ink2: "#D6D3CB", mute: "#9A9791", line: "#34322C", tint: "#15312F",
      brand: "#5FB8C0", brandBg: "#131311", onInk: "#E9E6DE", onInkMute: "#9A9791", alert: "#E08A5E",
      mapSea: "#0B1A1C", mapLand: "#1E1D1A", mapLine: "#6E6B66" } },
  ] },
  pages: [
    { path: "/", title: "bradley.io", card: "home", index: false, kicker: "AI systems, data and the edge",
      description: "One person, a platform of ready-made parts, and Claude. Production software in days. Open for projects with local companies in Grand Rapids and Kent County." },
    { path: "/contact", title: "Start a conversation", card: "plain", index: false, kicker: "contact",
      description: "Write to brad@bradley.io: what the job is, what systems it touches, and when you need it." },
    { path: "/zoo", title: "Widget zoo", card: "plain", index: false, kicker: "every component",
      description: "Every component in the kit, rendered live with the exact markup that produced it." },
    { path: "/zoo/widgets", title: "Widget bench", card: "plain", index: false, kicker: "the web components",
      description: "The kit's interactive widgets, each one plain JavaScript file: ticker, day scrubber, dial, hold to confirm, compass, bubble level, gyroscope and accelerometer." },
    { path: "/sensors", title: "Sensors", card: "plain", index: false, kicker: "sensors",
      description: "Everything your phone can sense that a web page may read, live. Nothing is recorded or sent." },
    { path: "/start", title: "Start an app", card: "plain", index: false, kicker: "start",
      description: "From nothing to a live app on the kit: one command, one file, a check, a host." },
    { path: "/scan", title: "Scan a code", card: "plain", index: false, kicker: "scan",
      description: "Read a QR code with the camera or from a photo, on this phone, and see what it holds before anything opens." },
    { path: "/theme", title: "Themes", card: "theme", index: false, kicker: "theme",
      description: "Datasheet or Instrument, or one of your own: every theme is checked for contrast before it can be kept." },
    { path: "/app", title: "This app", card: "plain", index: false, kicker: "app", description: "Install bradley.io on your phone or computer. It works offline." },
    { path: "/account", title: "Your account", card: "plain", index: false, kicker: "account", description: "Sign in with a passkey." },
    { path: "/files", title: "Your files", card: "plain", index: false, kicker: "files", description: "Your files, kept on this device and, signed in, in your account, so every device you sign in on has them." },
    { path: "/share", title: "Shared with bradley.io", card: "plain", index: false, kicker: "share", description: "What you have shared here from other apps. It stays on your device." },
  ],
  // the API, the build data, and the main site's pages linked from "The record" door (a full load, not a route here)
  outside: /^(https?:|\/(api|data)\/)/,
  notHere: "the shell for now; the content is on its way.",
  doors: [
    { id: "site", title: "bradley.io", hint: "The site, as it is built.", pages: [
      { href: "/", title: "Home", hint: "Ten scenes, top to bottom." },
      { href: "/contact", title: "Start a conversation", hint: "brad@bradley.io, and what helps a first email." },
    ] },
    // Issue #1's pages stay on the main site until the cutover (isenbek/bradley.io #11, item 3); this door reaches them.
    // Cost Analysis first: it is the one a potential client reads. Architecture was never built (#1 waits on a sketch).
    { id: "record", title: "The record", hint: "The long versions, on the main site for now.", pages: [
      { href: "https://bradley.io/cost-analysis", title: "Cost analysis", hint: "What the work cost, counted." },
      { href: "https://bradley.io/the-shift", title: "The shift", hint: "How the way of working changed." },
      { href: "https://bradley.io/work", title: "The work", hint: "Every org, every repository, counted." },
    ] },
    { id: "kit", title: "The kit", hint: "Every piece of the app kit, working.", pages: [
      { href: "/zoo", title: "Widget zoo", hint: "Every component, live, with its markup." },
      { href: "/zoo/widgets", title: "Widget bench", hint: "Dial, hold, compass and more." },
      { href: "/sensors", title: "Sensors", hint: "Everything the phone can sense." },
      { href: "/start", title: "Start an app", hint: "One command, one file, a check, a host." },
    ] },
    { id: "you", title: "You", hint: "Your account, how the app looks, this device.", pages: [
      { href: "/account", title: "Your account", hint: "A passkey.", me: true },
      { href: "/files", title: "Your files", hint: "Kept here and in your account." },
      { href: "/scan", title: "Scan a code", hint: "A QR code, with the camera or from a photo." },
      { href: "/theme", title: "Themes", hint: "Datasheet, Instrument, or your own." },
      { href: "/share", title: "Shared with bradley.io", hint: "What other apps sent here." },
      { href: "/app", title: "This app", hint: "Install it, and it works offline." },
    ] },
  ],
  shortcuts: [
    { id: "home", label: "Home", href: "/" },
    { id: "contact", label: "Contact", href: "/contact" },
    { id: "zoo", label: "Zoo", href: "/zoo" },
    { id: "widgets", label: "Widgets", href: "/zoo/widgets" },
    { id: "sensors", label: "Sensors", href: "/sensors" },
    { id: "theme", label: "Themes", href: "/theme" },
    { id: "app", label: "This app", href: "/app" },
    { id: "account", label: "Account", href: "/account" },
  ],
  defaultShortcuts: ["home", "contact", "theme"],
};
