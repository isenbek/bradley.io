// The build-time data the scenes read (beta/scripts/data.sh writes public/data/*.json), one fetch each per page.
import { useEffect, useState } from "react";

export interface Record {
  generated: string;
  orgs: { slug: string; name: string; since: string; latestCommit: string; commits: number; repos: number }[];
  orgCount: number;
  since: string;
  ownCommits: number;
  auditedOn: string;
  repos: number;
  timelinesAt: string;
  sessions: number | null;
  streak: number | null;
  sessionsSince: string | null;
  siteDataAt: string | null;
  months: { month: string; commits: number }[];
}

const cache = new Map<string, Promise<unknown>>();
function load<T>(url: string): Promise<T | null> {
  if (!cache.has(url)) cache.set(url, fetch(url, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  return cache.get(url) as Promise<T | null>;
}

export function useData<T>(url: string): T | null {
  const [v, set] = useState<T | null>(null);
  useEffect(() => { let dead = false; void load<T>(url).then((x) => { if (!dead) set(x); }); return () => { dead = true; }; }, [url]);
  return v;
}

export const useRecord = () => useData<Record>("/data/record.json");
