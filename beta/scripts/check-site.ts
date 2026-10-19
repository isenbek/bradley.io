// The done-check, in headless Chrome, against a built dist/ (scripts/serve.ts) or the live site: every page opens with
// no error and the frame carries the name and the mark; the Menu lists the doors; the zoo renders every specimen with
// its markup read back; the busy portal covers and settles; every widget on the bench is a defined custom element and
// the scrubber has the real data; the sensors page has its tiles; the account service answers and offers passkeys;
// a theme pick survives a reload; the app opens offline. Ends in ALL OK or a failure.
//   bun run scripts/check-site.ts [origin]      default http://127.0.0.1:4451
import puppeteer, { type Page } from "puppeteer-core";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const origin = (process.argv[2] ?? "http://127.0.0.1:4451").replace(/\/$/, "");
let fails = 0;
const ok = (good: boolean, what: string) => { if (!good) fails++; console.log(`${good ? "OK  " : "FAIL"} ${what}`); };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME ?? "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-gpu"] });
const ctx = await browser.createBrowserContext();
const page: Page = await ctx.newPage();
const errors: string[] = [];
let offline = false;
page.on("pageerror", (e) => errors.push(e.message));
// Run locally (kit check serves the build on 127.0.0.1), the 6502 console refuses to be framed: its frame-ancestors
// names bradley.io and beta.bradley.io only, as it should. Whether Chrome logs that before the check ends is timing,
// so the refusal is not counted locally; against the live site it is still a failure.
const local = /^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(origin);
const framedOffSite = (t: string) => local && /^Framing 'https:\/\/tinymachines\.ai\/' violates the following Content Security Policy directive: "frame-ancestors/.test(t);
page.on("console", (m) => { const t = m.text(); if (m.type() === "error" && !offline && !/401|Not signed in/.test(t) && !framedOffSite(t)) errors.push(t); });
await page.setViewport({ width: 390, height: 844 });
const text = (sel: string) => page.evaluate((s) => document.querySelector(s)?.textContent?.trim() ?? "", sel);
const count = (sel: string) => page.evaluate((s) => document.querySelectorAll(s).length, sel);
const clickText = (sel: string, t: string) => page.evaluate((s, t) => { const el = [...document.querySelectorAll<HTMLElement>(s)].find((e) => e.textContent?.includes(t)); el?.click(); return !!el; }, sel, t);

// 1. every page
for (const p of ["/", "/contact", "/zoo", "/zoo/widgets", "/sensors", "/start", "/theme", "/app", "/account", "/files", "/share", "/nowhere"]) {
  await page.goto(`${origin}${p}`, { waitUntil: "networkidle0" });
  const h1 = await text("main h1"), brand = await text("header .brand");
  const logo = await page.evaluate(() => (document.querySelector("header .brand img") as HTMLImageElement | null)?.naturalWidth ?? 0);
  const wide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  ok(h1.length > 0 && brand === "bradley.io" && logo > 0 && !wide, `${p}: "${h1}", brand "${brand}", logo ${logo}px, ${wide ? "SCROLLS SIDEWAYS" : "fits a phone"}`);
}
ok((await page.title()) === "Not here · bradley.io", `an unknown address says Not here (${await page.title()})`);
await page.goto(`${origin}/`, { waitUntil: "networkidle0" });
await page.click("header .menu-btn"); await sleep(300);
const doors = await page.evaluate(() => [...(document.getElementById("tc-menu")?.shadowRoot?.querySelectorAll("button, a") ?? [])].map((b) => b.textContent?.trim() ?? "").filter(Boolean));
ok(doors.some((d) => d.startsWith("The kit")) && doors.some((d) => d.startsWith("bradley.io")) && doors.some((d) => d.startsWith("You")), `the Menu lists the doors: ${doors.slice(0, 4).join(" | ")}`);
// the ten scenes (isenbek/bradley.io #3 to #9), in order, and no frame before the reader presses
await page.goto(`${origin}/`, { waitUntil: "networkidle0" }); await sleep(800);
const scenes = await page.$$eval("main .bio-scene", (els) => els.map((e) => e.id));
ok(scenes.join(",") === "door,claim,two-days,parts,depth,edge,record,craft,process,ask", `the ten scenes in order: ${scenes.join(", ")}`);
ok((await count("main iframe")) === 0, "nothing is framed before the reader presses");
ok(/33,\d{3}/.test(await text("#door")), `scene 1 carries the commit count: ${(await text("#door .bio-proofs li:nth-child(2) .bio-cap")).slice(0, 80)}`);
await page.waitForFunction(() => document.querySelectorAll(".bio-now__rows li").length > 0, { timeout: 20_000 }).catch(() => null);
ok((await count(".bio-now__rows li")) > 0, `Running now answers through /api/now (${await count(".bio-now__rows li")} instruments)`);
await page.waitForFunction(() => /\d/.test(document.querySelector(".bio-live__n b")?.textContent ?? ""), { timeout: 20_000 }).catch(() => null);
ok(/\d+\s*of \d+ services up/.test(await text(".bio-live__n")), `scene 4's live number: "${await text(".bio-live__n")}"`);
ok((await count("#record .bio-months rect")) >= 12, "scene 7 draws the commits a month");
ok((await count("#craft .bio-shelf li")) >= 5, "scene 8 lists the family");
await page.waitForFunction(() => document.querySelectorAll("#craft .bio-mark").length >= 5, { timeout: 10_000 }).catch(() => null);
ok((await count("#craft .bio-mark")) >= 5, `scene 8 draws the sites as their own marks (${await count("#craft .bio-mark")})`);
// the zoom: Beginner by default, Builder shows the stack tags, kept across a reload
const z0 = await page.evaluate(() => document.documentElement.dataset.zoom);
const cap0 = await text("#depth .bio-cap");
const tags0 = await count(".bio-tags .bio-tag");
await page.evaluate(() => [...document.querySelectorAll<HTMLButtonElement>(".bio-zoom button")].find((b) => b.textContent === "Builder")?.click()); await sleep(300);
const cap1 = await text("#depth .bio-cap");
const tags1 = await count(".bio-tags .bio-tag");
ok(z0 === "beginner" && cap0 !== cap1 && tags1 > tags0, `the zoom: Beginner by default, Builder changes the captions and shows the stack (${tags0} to ${tags1} tags)`);
await page.reload({ waitUntil: "networkidle0" }); await sleep(400);
ok((await page.evaluate(() => document.documentElement.dataset.zoom)) === "builder", "the zoom is kept across a reload");
await page.evaluate(() => [...document.querySelectorAll<HTMLButtonElement>(".bio-zoom button")].find((b) => b.textContent === "Beginner")?.click());
// Die Runner boots on a press into a frame
await page.evaluate(() => [...document.querySelectorAll<HTMLButtonElement>("#depth button")].find((b) => /Boot/.test(b.textContent ?? ""))?.click());
await page.waitForSelector("#depth iframe", { timeout: 10_000 }).catch(() => null);
ok((await count("#depth iframe")) === 1, "Boot puts the console in a frame");
await page.goto(`${origin}/contact`, { waitUntil: "networkidle0" });
ok((await count('a[href^="mailto:brad@bradley.io"]')) >= 1, "the contact page has the inbox");

// 2. the zoo
await page.goto(`${origin}/zoo`, { waitUntil: "networkidle0" }); await sleep(500);
const specs = await page.$$eval(".zoo-spec", (els) => els.map((e) => ({ id: e.id, code: (e.querySelector(".zoo-code code")?.textContent ?? "").length })));
ok(specs.length >= 20 && specs.every((s) => s.code > 10), `the zoo renders ${specs.length} specimens, every one with its markup read back`);
ok((await page.$$eval("#bars .bars i", (b) => b.length)) === 60, "the per-day bars carry 60 real days");
// nothing on the zoo may hold a cover once the page has loaded: the cover is fixed across the whole pane
ok(!(await page.evaluate(() => !!document.querySelector(".busy-cover"))), "nothing covers the zoo once it has loaded");
await clickText("button", "Hold the view for 3 seconds"); await sleep(600);
const covered = await page.evaluate(() => !!document.querySelector("#busy .busy-cover"));
await sleep(3200);
const settled = await page.evaluate(() => !document.querySelector(".busy-cover"));
ok(covered && settled, `the busy portal covers the view (${covered}) and settles by itself (${settled})`);
await clickText("button", "Show a first load for 3 seconds"); await sleep(600);
const faceOn = await page.evaluate(() => !!document.querySelector(".busy-cover"));
await sleep(3200);
const faceOff = await page.evaluate(() => !document.querySelector(".busy-cover"));
ok(faceOn && faceOff, `the busy face shows on demand (${faceOn}) and clears by itself (${faceOff})`);

// 3. the widget bench
await page.goto(`${origin}/zoo/widgets`, { waitUntil: "networkidle0" }); await sleep(800);
const defined = await page.evaluate(() => ["tc-ticker", "tc-scrub", "tc-dial", "tc-hold", "tc-compass", "tc-level", "tc-gyro", "tc-accel"].map((t) => [t, !!customElements.get(t) && !!document.querySelector(t)]));
ok(defined.every(([, d]) => d), `every widget is defined and on the page: ${defined.map(([t, d]) => `${t}${d ? "" : " MISSING"}`).join(", ")}`);
const scrubN = await page.evaluate(() => ((document.getElementById("wb-scrub") as unknown as { data?: unknown[] })?.data ?? []).length);
ok(scrubN === 60, `the scrubber has the 60 real days (${scrubN})`);

// the knob is inside the dial's shadow root (role=slider); arrow keys there step it, and the page's readout follows
await page.evaluate(() => (document.getElementById("wb-dial")?.shadowRoot?.querySelector(".dial") as HTMLElement | null)?.focus());
await page.keyboard.press("ArrowUp"); await page.keyboard.press("ArrowUp"); await sleep(200);
ok(/^3[12] days/.test(await text("#wb-dial-out")), `the dial steps with the arrow keys and reports it: ${await text("#wb-dial-out")}`);

// 4. sensors, sign-in, a theme, offline
await page.goto(`${origin}/sensors`, { waitUntil: "networkidle0" });
const tiles = await page.evaluate(() => document.querySelectorAll("tc-gps, tc-motion, tc-sound, tc-battery, tc-network, tc-clock, tc-compass").length);
ok(tiles >= 6, `the sensors page has ${tiles} tiles`);
const auth = await page.evaluate(async () => { const r = await fetch("/api/v1/auth"); return r.ok ? r.json() : r.status; });
ok((auth as { passkey?: boolean })?.passkey === true, `the account service answers and offers passkeys: ${JSON.stringify(auth)}`);
await page.goto(`${origin}/account`, { waitUntil: "networkidle0" });
ok(/passkey/i.test(await text("main")), "the account page offers a passkey");
// beta's own API (api/, the kit's kitapi), through the same /api/ the pages use: the base routes, as this app at HEAD
const head = Bun.spawnSync(["git", "rev-parse", "--short", "HEAD"]).stdout.toString().trim();
const base = await page.evaluate(async () => {
  const get = (p: string) => fetch(p, { cache: "no-store" }).then((r) => r.ok ? r.json() : { status: r.status }).catch(() => null);
  return { health: await get("/api/v1/health"), about: await get("/api/v1/about"), whoami: await get("/api/v1/whoami") };
}) as { health: { ok?: boolean; app?: string } | null; about: { id?: string; commit?: string; kitapi?: string } | null; whoami: { signed_in?: boolean } | null };
ok(base.health?.ok === true && base.health.app === "bradleyio", `the API answers /api/v1/health (${JSON.stringify(base.health)})`);
ok(base.about?.id === "bradleyio" && base.about.commit === head, `/api/v1/about: ${base.about?.id} at ${base.about?.commit ?? "no answer"} (HEAD ${head}), kitapi ${base.about?.kitapi}`);
ok(base.whoami?.signed_in === false, `/api/v1/whoami, signed out: nobody (${JSON.stringify(base.whoami)})`);

// Your files, signed out: a picked file is kept on this device and opens; a file shared from another app (the Share
// menu's multipart POST, taken by the service worker) lands there too
const sample = join(mkdtempSync(join(tmpdir(), "beta-check-")), "hello.txt");
writeFileSync(sample, "hello from beta's check\n");
const names = () => page.evaluate(() => [...document.querySelectorAll(".kfiles li")].map((li) => `${li.querySelector(".open")?.textContent} | ${li.querySelector(".state")?.textContent}`));
const waitName = async (n: string) => { let r: string[] = []; for (let i = 0; i < 40 && !r.some((x) => x.startsWith(n)); i++) { await sleep(250); r = await names(); } return r; };
await page.goto(`${origin}/files`, { waitUntil: "networkidle0" });
const input = await page.evaluateHandle(() => document.querySelector("tc-pick")!.shadowRoot!.querySelector("input.files"));
await (input as unknown as { uploadFile(p: string): Promise<void> }).uploadFile(sample);
let rows = await waitName("hello.txt");
ok(rows.some((r) => /^hello\.txt \| On this device/.test(r)), `your files: a picked file is kept on this device (${rows.join("; ")})`);
await clickText(".kfiles .open", "hello.txt");
await page.waitForSelector(".kfile-view pre", { timeout: 4000 }).catch(() => null);
ok((await text(".kfile-view pre")).startsWith("hello from beta's check"), "your files: opening it shows what it holds");
await page.goto(`${origin}/app`, { waitUntil: "networkidle0" });
await page.evaluate(() => navigator.serviceWorker.ready);
const landed = await page.evaluate(async () => {
  const form = new FormData();
  form.append("files", new File(["shared from another app\n"], "shared note.txt", { type: "text/plain" }));
  const r = await fetch("/share", { method: "POST", body: form });
  return new URL(r.url).pathname + new URL(r.url).search;
});
await page.goto(`${origin}${landed}`, { waitUntil: "networkidle0" });
await page.waitForFunction(() => /Open it in Your files/.test(document.querySelector("main")?.textContent ?? ""), { timeout: 8000 }).catch(() => null);
ok(/Open it in Your files/.test(await text("main")), `share: the share page says the file went to Your files (${landed})`);
await page.goto(`${origin}/files`, { waitUntil: "networkidle0" });
rows = await waitName("shared note.txt");
ok(rows.some((r) => r.startsWith("shared note.txt")), `share: it is in Your files (${rows.join("; ")})`);
await page.goto(`${origin}/theme`, { waitUntil: "networkidle0" });
ok(await clickText(".theme-pick", "Instrument"), "the theme page offers Instrument"); await sleep(200);
await page.goto(`${origin}/zoo`, { waitUntil: "domcontentloaded" });
const early = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
ok(early === "rgb(11, 11, 10)", `a theme pick survives a reload with no light flash (${early})`);
await page.goto(`${origin}/app`, { waitUntil: "networkidle0" }); await sleep(1500);
await page.reload({ waitUntil: "networkidle0" }); await sleep(1000);
offline = true; await page.setOfflineMode(true);
await page.goto(`${origin}/zoo/widgets`, { waitUntil: "domcontentloaded" }).catch(() => null); await sleep(500);
ok((await text("main h1")) === "Widget bench", `offline: the bench opens from the cache ("${await text("main h1")}")`);
await page.setOfflineMode(false); offline = false;

ok(errors.length === 0, errors.length ? `page errors: ${errors.join(" | ").slice(0, 600)}` : "no page errors anywhere");
await browser.close();
console.log(fails ? `check-site: ${fails} FAILED` : "check-site: ALL OK");
process.exit(fails ? 1 : 0);
