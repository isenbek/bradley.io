// Scene 4, the parts (issue #6): the kits as cards, and one live number. The part names come from sysforge.ai's shop
// floor (site/index.html, #floor, c6e71e4); the number is bradley.io /api/fleet-up, which asks the Campaign Brain MCP
// mesh catalog server-side (services registered on the mesh with a heartbeat in the last ten minutes).
import { Builder, Cap, Chip } from "../components/bits";
import { useJson } from "../lib/json";

const KITS: { name: string; line: string; parts: string[]; runs: string[] }[] = [
  { name: "Service kit", line: "A new service starts with its contract, its health check and its place on the mesh already done.", parts: ["Financial workflows", "Document generation"], runs: ["FastAPI", "Python"] },
  { name: "Integration kit", line: "The systems a business already runs, spoken to in one way: books, banks, booking, mail.", parts: ["Financial workflows", "OSINT workflows"], runs: ["FastAPI", "Rust"] },
  { name: "UI kit", line: "TinyKit: bun-installable, renders on every device, installs to a home screen and works offline.", parts: ["The frame", "Themes", "Passkey sign-in"], runs: ["TypeScript", "React", "Vite"] },
  { name: "MCP kit", line: "Every service describes itself to an AI agent, so a job can be planned from the parts that exist.", parts: ["Model orchestration", "The service catalog"], runs: ["MCP", "FastAPI"] },
  { name: "Data kit", line: "Data read where it lives, by byte range or in place, with no warehouse in the middle.", parts: ["Districts engine", "Coverage mapping"], runs: ["DuckDB", "Polars", "tinygrad"] },
];

interface FleetUp { at: string; up: number; registered: number; listed: number; freshSeconds: number }

export function S4Parts() {
  const { data, failed } = useJson<FleetUp>("/api/fleet-up", 60_000);
  return (
    <section className="bio-scene" id="parts" aria-labelledby="parts-h">
      <h2 id="parts-h">The parts.</h2>
      <p className="bio-lead">Sysforge is the platform; CampaignBrain was its first build, on my own dime, and drove the design. Everything that was not carrying a vertical is Sysforge material now.</p>
      <div className="bio-cards bio-cards--5">
        {KITS.map((k) => (
          <article key={k.name} className="panel bio-kit">
            <h3>{k.name}</h3>
            <p>{k.line}</p>
            <p className="bio-kit__parts">{k.parts.join(" · ")}</p>
            <Builder><p className="bio-tags">{k.runs.map((r) => <span key={r} className="bio-tag">{r}</span>)}</p></Builder>
          </article>
        ))}
      </div>
      <div className="bio-live" aria-live="polite">
        <p className="bio-live__n"><b>{data ? data.up : failed ? "?" : "…"}</b><span>{data ? `of ${data.listed} services up right now` : failed ? "the count did not answer just now" : "asking the fleet"}</span></p>
        <Cap beginner={<>Each one is a part a new job can use today.</>}
             builder={<>Up means registered on the mesh with a worker heartbeat in the last {data ? data.freshSeconds / 60 : 10} minutes; {data ? `${data.registered} of the ${data.listed}` : "most of the"} services in the catalog are registered.</>} />
        <Chip from="bradley.io /api/fleet-up, the CampaignBrain MCP mesh catalog" at={data?.at} />
      </div>
      <p className="bio-aside">Aside: <a href="https://snailmail.ai">snailmail.ai</a> is my own assistant for email and agent traffic, built from the same parts.</p>
      <p><a href="https://sysforge.ai">The long version is at sysforge.ai</a>.</p>
    </section>
  );
}
