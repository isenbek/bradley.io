// beta/public/data/record.json: the numbers scenes 1 and 7 show, computed by the MAIN site's own code
// (app/work/_orgs.ts: the four orgs, cut at the first commit under the owner's name, and the author audit) and its
// pipeline files (public/data/site-data.json), so beta.bradley.io and bradley.io can never disagree. Run from the
// repository root by beta/scripts/data.sh at build time.
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";
import { AUTHOR_AUDIT, auditTotals, loadOrgRollups } from "../../app/work/_orgs";

const root = process.cwd();
const { orgs } = loadOrgRollups();
const audit = auditTotals();
const site = JSON.parse(readFileSync(join(root, "public/data/site-data.json"), "utf-8"));
const stats = site.stats ?? {};

// commits a month, all four orgs summed, from each org's heatmap cut at `since`
const months = new Map<string, number>();
for (const o of orgs) for (const d of o.ownHeatmap) months.set(d.date.slice(0, 7), (months.get(d.date.slice(0, 7)) ?? 0) + d.commits);
const series = [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, commits]) => ({ month, commits }));

const firsts = orgs.map((o) => o.since).filter(Boolean).sort();
const out = {
  generated: new Date().toISOString(),
  orgs: orgs.map((o) => ({ slug: o.slug, name: o.displayName, since: o.since, latestCommit: o.latestCommit, commits: o.commitsSince, repos: o.totalRepos })),
  orgCount: orgs.length,
  since: firsts[0] ?? "",
  // the author audit: commits under the owner's own name across all four orgs, counted on its date
  ownCommits: audit.owner,
  auditedOn: AUTHOR_AUDIT.measured,
  repos: orgs.reduce((s, o) => s + o.totalRepos, 0),
  timelinesAt: orgs.map((o) => o.generated).filter(Boolean).sort().at(-1) ?? "",
  sessions: stats.totalSessions ?? null,
  streak: stats.streak ?? null,
  sessionsSince: stats.coverage?.since ?? null,
  siteDataAt: site.generated ?? null,
  months: series,
};
mkdirSync(join(root, "beta/public/data"), { recursive: true });
writeFileSync(join(root, "beta/public/data/record.json"), JSON.stringify(out, null, 1) + "\n");
console.log(`wrote beta/public/data/record.json: ${out.ownCommits} own commits across ${out.orgCount} orgs since ${out.since}, ${series.length} months`);
