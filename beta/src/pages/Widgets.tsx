// /zoo/widgets: the kit's web components, each one plain JavaScript file with no framework inside, so the same file
// works in an app, a kiosk or a bare HTML page. tinychase invented them on its skunkworks page; here they show what
// each reports, beside it. The ticker and the scrubber carry real data: commits a day in bradley.io and the kit.
import { useEffect } from "react";
import { onLink } from "@tinymachines/kit/lib/router";
import "@tinymachines/kit/widgets/tc-dial.js";
import "@tinymachines/kit/widgets/tc-hold.js";
import "@tinymachines/kit/widgets/tc-compass.js";
import "@tinymachines/kit/widgets/tc-imu.js";
import "@tinymachines/kit/widgets/tc-scrub.js";
import "@tinymachines/kit/widgets/tc-ticker.js";
import { Specimen } from "../components/Specimen";
import { useActivity, type Activity } from "../activity";

const DIAL = `<tc-dial id="wb-dial" min="1" max="60" value="30" label="Window" unit="days"></tc-dial>
<p class="note">Reports: <output id="wb-dial-out">30 days</output></p>`;
const HOLD = `<tc-hold id="wb-hold" duration="1500">Hold to clear the demo</tc-hold>
<p class="note">Reports: <output id="wb-hold-out">waiting</output></p>`;
const COMPASS = `<tc-compass id="wb-compass"></tc-compass>
<p class="note">Reports: <output id="wb-compass-out">…</output></p>`;
const LEVEL = `<tc-level id="wb-level"></tc-level>
<p class="note">Reports: <output id="wb-level-out">…</output></p>`;
const GYRO = `<tc-gyro id="wb-gyro"></tc-gyro>
<p class="note">Reports: <output id="wb-gyro-out">…</output></p>`;
const ACCEL = `<tc-accel id="wb-accel"></tc-accel>
<p class="note">Reports: <output id="wb-accel-out">…</output></p>`;
const SCRUB = `<tc-scrub id="wb-scrub" label="Day" one="commit" many="commits"></tc-scrub>`;

const fmt = (t: string) => new Date(t + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });

function tickerHtml(a: Activity | null): string {
  if (!a) return `<tc-ticker label="Latest"><span>Reading the history…</span></tc-ticker>`;
  const total = a.days.reduce((s, d) => s + d.v, 0);
  const top = a.days.reduce((m, d) => (d.v > m.v ? d : m), a.days[0]);
  const lines = Object.entries(a.repos).map(([k, r]) => `<span>${k}: ${r.commits60} commits${r.tag ? `, at ${r.tag}` : ""}</span>`).join("\n  ");
  return `<tc-ticker label="bradley.io">
  <span>${total.toLocaleString("en-US")} commits in the last 60 days across bradley.io and the kit</span>
  <span>Busiest day: ${fmt(top.t)}, with ${top.v}</span>
  ${lines}
</tc-ticker>`;
}

export default function Widgets() {
  const act = useActivity();

  useEffect(() => {
    const on = (id: string, ev: string, f: (el: HTMLElement & Record<string, unknown>) => string) => {
      const el = document.getElementById(id) as (HTMLElement & Record<string, unknown>) | null;
      const out = document.getElementById(`${id}-out`);
      if (!el || !out) return () => {};
      const h = () => { out.textContent = f(el); };
      el.addEventListener(ev, h);
      return () => el.removeEventListener(ev, h);
    };
    const offs = [
      on("wb-dial", "input", (el) => `${el.value} days`),
      on("wb-dial", "change", (el) => `${el.value} days (let go)`),
      on("wb-hold", "confirm", () => "confirmed. Nothing was cleared: this is a demo."),
      on("wb-compass", "input", (el) => `${el.heading}°`),
      on("wb-level", "input", (el) => `pitch ${el.pitch}°, roll ${el.roll}°, ${el.tilt}° off level`),
      on("wb-gyro", "input", (el) => { const r = el.rate as Record<string, number>; return `spin ${Math.round(r.spin)}, tip ${Math.round(r.tip)}, roll ${Math.round(r.roll)}, in all ${Math.round(r.total)}° a second`; }),
      on("wb-accel", "input", (el) => { const f = el.force as Record<string, number>; return `${f.push.toFixed(2)} g (x ${f.x.toFixed(2)}, y ${f.y.toFixed(2)}, z ${f.z.toFixed(2)}), hardest ${f.peak.toFixed(2)} g`; }),
    ];
    return () => offs.forEach((f) => f());
  }, []);

  useEffect(() => {
    const s = document.getElementById("wb-scrub") as (HTMLElement & { data: { t: string; v: number }[] }) | null;
    if (s && act) s.data = act.days;
  }, [act]);

  return (
    <article className="zoo">
      <p className="kicker">bradley.io · <a href="/zoo" onClick={onLink}>widget zoo</a> · <b>widget bench</b></p>
      <h1>Widget bench</h1>
      <p className="lede">The kit's interactive widgets. Each is one plain JavaScript file, a web component with no framework inside, so the same file works in an app, a kiosk or a bare HTML page. Try them: each one reports what it read, beside it. The motion widgets need a phone.</p>

      <section className="zoo-sec">
        <Specimen id="tc-ticker" title="Ticker" status="shipped" used="the sensors page" html={tickerHtml(act)}
          note="A line of short items that crawls across. It stops under a finger, a pointer or keyboard focus, and has its own Pause, because moving text must always be stoppable. With reduced motion asked for it never moves and shows one item at a time with Back and Next. The numbers are real, from bradley.io's and the kit's git logs." />
        <Specimen id="tc-scrub" title="Day scrubber" status="draft" html={SCRUB}
          note="Run a finger along a strip of counts per day. The day under it and its count read out in large type above, so nobody has to aim at a bar a few pixels wide. Arrow keys step a day, Page Up and Page Down a week. Real data: commits a day over the last 60 days." />
        <Specimen id="tc-dial" title="Dial" status="draft" html={DIAL}
          note="A rotary knob for a number, such as how many days a page covers. Drag round it, turn the mouse wheel while it has focus (never while you scroll past), or use the arrow keys. A phone gives a small tick at each tenth of the way." />
        <Specimen id="tc-hold" title="Hold to confirm" status="draft" html={HOLD}
          note="For an action that cannot be undone. The button fills while held and drains if let go early; Space or Enter held down works the same. A single tap cannot trigger it by accident, and there is no dialog to wave through." />
        <Specimen id="tc-compass" title="Compass" status="shipped" used="the sensors page" html={COMPASS}
          note="Which way the phone points, live. On an iPhone it asks first. Where there is no compass it is a direction picker: drag the needle, or use the arrow keys (Shift for ten degrees)." />
        <Specimen id="tc-level" title="Tilt (bubble level)" status="shipped" used="the sensors page" html={LEVEL}
          note="How far the phone is from flat: the bubble sits toward the raised side and turns green at level. Where there is no tilt sensor it is a picker: drag the bubble, or use the arrow keys (Home for level)." />
        <Specimen id="tc-gyro" title="Gyroscope" status="shipped" used="the sensors page" html={GYRO}
          note="How fast the phone is being turned, in degrees a second, one bar for each way it can turn. Each number is the fastest since the last, so a quick flick is not lost. A desktop has none, and the widget says so." />
        <Specimen id="tc-accel" title="Accelerometer" status="shipped" used="the sensors page" html={ACCEL}
          note="How hard the phone is being pushed, in g, with gravity taken out, and which way: the dot leaves a short trail. In a car it shows braking, speeding up and cornering. A desktop has none, and the widget says so." />
      </section>
      <p className="src">The widgets are <code>@tinymachines/kit/widgets/tc-*.js</code>. Import the file and use the element; there is nothing else to wire. The whole sensor wall is on <a href="/sensors" onClick={onLink}>Sensors</a>.</p>
    </article>
  );
}
