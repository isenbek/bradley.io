// /zoo: every component in the kit, rendered live with the exact markup that produced it. The idea and the Specimen
// are tinychase's widget zoo (2026-09-25); this one holds only what the kit ships, so any app can use every piece.
import { useEffect, useState } from "react";
import { onLink } from "@tinymachines/kit/lib/router";
import { LabBanner } from "@tinymachines/kit/components/LabBanner";
import { StatusTag } from "@tinymachines/kit/components/StatusTag";
import { BusyPortal, BusyFace } from "@tinymachines/kit/components/BusyPortal";
import { ShareButton } from "@tinymachines/kit/components/ShareButton";
import { PWAInstallButton } from "@tinymachines/kit/components/PWAInstallButton";
import { Specimen } from "../components/Specimen";
import { useActivity } from "../activity";

const SECTIONS = [
  { id: "foundations", title: "Foundations" },
  { id: "controls", title: "Controls" },
  { id: "readouts", title: "Readouts" },
  { id: "states", title: "States" },
  { id: "frame", title: "The frame" },
];

function BusyDemo() {
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!busy) return; const t = setTimeout(() => setBusy(false), 3000); return () => clearTimeout(t); }, [busy]);
  return (
    <>
      <p><button type="button" className="btn quiet" onClick={() => setBusy(true)} disabled={busy}>Hold the view for 3 seconds</button></p>
      <BusyPortal busy={busy} label="Reading the last 60 days…">
        <section className="panel" style={{ minHeight: 160 }}><h2>The view being read</h2><p>What the reader has in front of them. While the next one loads it stays here, blurred, and cannot be tapped.</p></section>
      </BusyPortal>
    </>
  );
}

/** The busy face covers the whole content pane (the kit's .busy-cover is position: fixed), so it is shown on demand
 *  for three seconds and then removed, as a real first load would settle. Shown for good, it blocked the page. */
function BusyFaceDemo() {
  const [on, setOn] = useState(false);
  useEffect(() => { if (!on) return; const t = setTimeout(() => setOn(false), 3000); return () => clearTimeout(t); }, [on]);
  return (
    <>
      <p><button type="button" className="btn quiet" onClick={() => setOn(true)} disabled={on}>Show a first load for 3 seconds</button></p>
      {on ? <BusyFace label="Reading for the first time…" /> : null}
    </>
  );
}

function SegDemo() {
  const [v, setV] = useState("30");
  return (
    <div className="seg" role="group" aria-label="Window">
      {["7", "30", "60"].map((d) => <button key={d} type="button" aria-pressed={v === d} onClick={() => setV(d)}>{d} days</button>)}
    </div>
  );
}

function ChipsDemo() {
  const [on, setOn] = useState<Set<string>>(new Set(["kit", "hotbits"]));
  const flip = (k: string) => setOn((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  return <div className="chips">{["kit", "tinychase", "astrostack", "hotbits"].map((k) => <button key={k} type="button" aria-pressed={on.has(k)} onClick={() => flip(k)}>{k}</button>)}</div>;
}

export default function Zoo() {
  const act = useActivity();
  const days = act?.days ?? [];
  const max = Math.max(1, ...days.map((d) => d.v));
  const total = days.reduce((a, d) => a + d.v, 0);
  return (
    <article className="zoo">
      <p className="kicker">bradley.io · <b>widget zoo</b></p>
      <h1>Widget zoo</h1>
      <p className="lede">Every component in the kit, rendered live with the exact markup that produced it. Each is marked <b>shipped</b> (an app uses it), <b>draft</b> (built, waiting for a page) or <b>idea</b>. Open <b>Markup</b> under any of them for the code; it is read back from the page, so it cannot drift from what you see.</p>
      <nav className="zoo-jump" aria-label="Sections">
        {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}
        <a href="/zoo/widgets" onClick={onLink}>Widget bench →</a>
      </nav>

      <section id="foundations" className="zoo-sec">
        <h2>Foundations</h2>
        <Specimen id="kicker" title="Kicker, title and lede" status="shipped" used="every page of every app"
          note="The page's identity. The kicker says where you are, small and muted, with the current level in bold. The title says what it is, and the lede is one paragraph of what it holds.">
          <p className="kicker">myapp · <b>the page</b></p>
          <h1 style={{ fontSize: 40 }}>The page</h1>
          <p className="lede">One paragraph that says what this page holds and why a reader would want it.</p>
        </Specimen>
        <Specimen id="buttons" title="Buttons" status="shipped" used="every app"
          note="Two kinds only: solid for the one action that matters on a view, quiet for the rest. Every target is at least 44 pixels tall.">
          <p className="controls"><a className="btn" href="#buttons">Do the thing</a><button type="button" className="btn quiet">Something else</button></p>
        </Specimen>
        <Specimen id="sheet" title="Sheet and panel" status="shipped" used="tinychase, AstroStack, hotbits"
          note="The two surfaces. A sheet holds one task and a panel holds a section of a page. Neither has a border: the ground around them is the edge.">
          <section className="sheet"><h3>A sheet</h3><p>One task, such as signing in.</p></section>
          <section className="panel"><h2>A panel</h2><p>A section of a page.</p></section>
        </Specimen>
        <Specimen id="cards" title="Cards" status="shipped" used="tinychase's Home"
          note="A link to another page, as a tile. The border darkens on hover and focus, never the fill.">
          <ul className="grid3"><li><a className="card" href="/zoo/widgets" onClick={onLink}><b>Widget bench</b><code>/zoo/widgets</code></a></li><li><a className="card" href="/sensors" onClick={onLink}><b>Sensors</b><code>/sensors</code></a></li></ul>
        </Specimen>
        <Specimen id="ink" title="Ink block" status="shipped" used="tinychase's kiosks"
          note="The one dark block on a light page, for the single figure the page is about. Its numbers take the warm highlight.">
          <div className="ink"><p className="k">Commits, last 60 days</p><p><b className="n" style={{ fontSize: 34 }}>{act ? total.toLocaleString("en-US") : "…"}</b> across bradley.io and the kit</p></div>
        </Specimen>
      </section>

      <section id="controls" className="zoo-sec">
        <h2>Controls</h2>
        <Specimen id="toggle" title="Toggle row" status="shipped" used="the account page"
          note="A checkbox with its label and a line of what it does. The whole row is the target.">
          <label className="toggle"><input type="checkbox" defaultChecked /><span><b>Location</b><small>Use this device's position on maps</small></span></label>
        </Specimen>
        <Specimen id="seg" title="Segmented control" status="shipped" used="tinychase's kiosks, hotbits' dice and lottery"
          note="One of a few choices, as real buttons with aria-pressed. The chosen one is ink-filled, never a second hue.">
          <SegDemo />
        </Specimen>
        <Specimen id="chips" title="Chips" status="shipped" used="tinychase's kiosks"
          note="Several of a few choices at once. A chosen chip gets the ink border and bold type, so the state is not colour alone.">
          <ChipsDemo />
        </Specimen>
        <Specimen id="controls-row" title="Controls row" status="shipped" used="every app"
          note="Labelled controls in one row that wraps on a phone. The label is muted, the control is not.">
          <div className="controls"><label className="ctl"><span>How many</span><input type="number" defaultValue={5} min={1} max={20} style={{ width: "5em", minHeight: 44, font: "inherit" }} /></label><button type="button" className="btn">Go</button></div>
        </Specimen>
      </section>

      <section id="readouts" className="zoo-sec">
        <h2>Readouts</h2>
        <Specimen id="stat" title="Stat" status="shipped" used="tinychase, AstroStack, hotbits"
          note="One measured number, its name above and its unit small beside it.">
          <div className="row"><div className="stat"><p className="k">Busiest day</p><p className="v">{act ? Math.max(...act.days.map((d) => d.v)) : "…"}<small>commits</small></p></div><div className="stat"><p className="k">Kit version</p><p className="v">{act?.repos.kit?.tag ?? "…"}</p></div></div>
        </Specimen>
        <Specimen id="bars" title="Per-day bars" status="shipped" used="every tinychase dex page"
          note="Counts per day, one bar each, no axis: the headline above carries the number. Days with none are grey, not missing. These are real: commits a day in bradley.io and the kit.">
          <div className="bars" role="img" aria-label={`Commits a day, last 60 days: ${total} in all`}>{days.map((d) => <i key={d.t} className={d.v ? "" : "none"} style={{ height: `${d.v ? (100 * d.v) / max : 4}%` }} title={`${d.t}: ${d.v}`} />)}</div>
        </Specimen>
        <Specimen id="legend" title="Legend" status="shipped" used="tinychase's kiosks"
          note="Swatches in the categorical order, each with its word. Lines get a thin swatch.">
          <p className="legend"><span><i style={{ background: "var(--c1)" }} />first series</span><span><i style={{ background: "var(--c2)" }} />second</span><span><i style={{ background: "var(--c3)" }} />third</span><span><i className="l" style={{ background: "var(--c0)" }} />context</span></p>
        </Specimen>
        <Specimen id="status-tags" title="Status tags" status="shipped" used="tinychase's dex pages, AstroStack, hotbits"
          note="What kind of thing is on screen: measured, a model's output, or wild data. Read-only. Each has a glyph and a word, so colour is never the only signal.">
          <p className="controls"><StatusTag kind="measured" /><StatusTag kind="model" /><StatusTag kind="wild" /></p>
        </Specimen>
        <Specimen id="src" title="Source line" status="shipped" used="every app, at the foot of a page"
          note="Where the page's numbers come from, small and muted, at the end. A page's claims are measured, and this says how.">
          <p className="src">Commits from each repository's git log, read when this site was built{act ? ` (${act.generated.slice(0, 16).replace("T", " ")} UTC)` : ""}.</p>
        </Specimen>
      </section>

      <section id="states" className="zoo-sec">
        <h2>States</h2>
        <Specimen id="busy" title="Busy portal" status="shipped" used="every tinychase page that loads"
          note="The one loading state. While the next view loads the last one stays on screen, blurred and inert, under a card saying what is being read. It waits 180 ms so a quick load never flashes it, and it follows the load and nothing else, so it always settles.">
          <BusyDemo />
        </Specimen>
        <Specimen id="busy-face" title="Busy face" status="shipped" used="tinychase's first loads"
          note="The same card when there is nothing on screen yet: it stands over the pane alone until the first load settles.">
          <BusyFaceDemo />
        </Specimen>
        <Specimen id="notice" title="Notices" status="shipped" used="tinychase (offline, the lab banner)"
          note="At most one per page. The offline notice says the view is from memory; the lab banner goes, word for word, on every page that shows a model's output.">
          <p className="offline">Offline: showing the last result this device saw.</p>
          <LabBanner />
        </Specimen>
      </section>

      <section id="frame" className="zoo-sec">
        <h2>The frame</h2>
        <p className="note">One header and one footer for every page. They are shown in place, at the top and bottom of this page.</p>
        <Specimen id="share" title="Share button and panel" status="shipped" used="every app"
          note="Opens the share panel for what is on screen: the phone's own Share menu, copy, save, Messages, Email, the social sites, and a QR code written from the standard with no library.">
          <p className="controls"><ShareButton /></p>
        </Specimen>
        <Specimen id="install" title="Install button" status="shipped" used="every app's This app page"
          note="Offers to install the app where the browser allows it, and says what to do where it does not (Safari: Share, then Add to Home Screen).">
          <p className="controls"><PWAInstallButton /></p>
        </Specimen>
        <Specimen id="doors" title="Menu: doors and rooms" status="shipped" used="every app"
          note="Tap Menu and a sheet rises with the app's doors, each one line and a count. A door opens its room of pages. Plain JavaScript, a web component (widgets/tc-doors.js); the inventory is the app's own, from defineApp.">
          <p className="controls"><button type="button" className="btn quiet" onClick={() => document.getElementById("tc-menu")?.setAttribute("open", "")}>Open the Menu</button></p>
        </Specimen>
        <Specimen id="header" title="Header" status="shipped" used="every app" markupOf=".tc-head"
          note="Logo and name on the left, one Menu button on the right. Every link lives in the Menu, so the header never wraps." />
        <Specimen id="footer" title="Footer" status="shipped" used="every app" markupOf=".tc-foot"
          note="Who is signed in, and the build: its version, commit and how long ago." />
      </section>
    </article>
  );
}
