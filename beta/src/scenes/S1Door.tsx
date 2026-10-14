// Scene 1, the door (issue #3): the one sentence the site hangs off, three facts that prove it, the offer, two ways on.
import { onLink } from "@tinymachines/kit/lib/router";
import { app } from "@tinymachines/kit/app";
import { Cap, Chip } from "../components/bits";
import { useJson } from "../lib/json";
import type { Record } from "../data";

interface NowRow { id: string; label: string; href: string; value: string; unit: string; lastHeard: string | null; status: "live" | "stale" | "offline" | "checking"; sentence: string }
interface Now { at: string; rows: NowRow[] }

/** The instruments the main site's front door shows, in its order (app/page.tsx: NOW_ROWS); an instrument that is not answering is left out, as there. */
const IDS = ["activity", "firewall", "geiger", "bus", "cameras", "fleet"];
const MAIN = "https://bradley.io";

function RunningNow() {
  const { data, failed } = useJson<Now>("/api/now", 30_000);
  const rows = (data?.rows ?? []).filter((r) => IDS.includes(r.id) && r.status !== "offline");
  return (
    <div className="panel bio-now" aria-label="Running now, on my own hardware">
      <p className="bio-now__head"><b>Running now</b> <span>on my own hardware</span></p>
      {!data ? <p className="note">{failed ? "The main site did not answer just now." : "Asking the instruments…"}</p> : (
        <ul className="bio-now__rows">
          {rows.map((r) => (
            <li key={r.id}>
              <a href={MAIN + r.href}>{r.label}</a>
              <b>{r.value}</b>
              <span>{r.unit}</span>
            </li>
          ))}
        </ul>
      )}
      <Chip from="bradley.io /api/now, every 30 s" at={data?.at} href={`${MAIN}/bench`} />
    </div>
  );
}

export function S1Door({ record }: { record: Record | null }) {
  const b = app().build;
  return (
    <section className="bio-scene bio-door" id="door" aria-labelledby="door-h">
      <h1 id="door-h">One person, a platform of ready-made parts, and Claude. Production software in days.</h1>
      <ul className="bio-proofs">
        <li>
          <Cap beginner={<>This site is answering from my own hardware, right now.</>}
               builder={<>This site is answering from my own hardware: the Claude Code pulse, the firewall, the Geiger counter and the fleet, read live.</>} />
          <RunningNow />
        </li>
        <li>
          <p className="bio-cap"><b className="n">{record ? record.ownCommits.toLocaleString("en-US") : "…"}</b> commits under my name across {record?.orgCount ?? "four"} GitHub organisations since {record ? new Date(record.since + "T12:00:00Z").getUTCFullYear() : "2025"}.</p>
          <Chip from="the author audit over the four orgs' git history" at={record?.auditedOn} href={`${MAIN}/work`} />
        </li>
        <li>
          <p className="bio-cap">The build answering you: <b className="n">v{b.version} · {b.commit}</b>, built {ago(b.date)}.</p>
          <Chip from="this page's own build" at={b.date} />
        </li>
      </ul>
      <p className="bio-offer"><b>Open for projects with local companies.</b> On site across Grand Rapids and Kent County, remote everywhere else. Trade rates, no surprise bills.</p>
      <p className="controls">
        <a className="btn" href="/contact" onClick={onLink}>Start a conversation</a>
        <a className="btn quiet" href={`${MAIN}/resume`}>The resume</a>
      </p>
    </section>
  );
}

function ago(iso: string) {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 2) return "just now";
  if (m < 120) return `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} hours ago`;
  return `${Math.round(h / 24)} days ago`;
}
