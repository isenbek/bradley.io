// public/data/activity.json (scripts/data.sh): commits a day in the kit and its apps, read from their git logs at
// build time. One fetch per page load, shared.
import { useEffect, useState } from "react";

export interface Activity {
  generated: string;
  what: string;
  days: { t: string; v: number }[];
  repos: Record<string, { repo: string; commits60: number; tag: string | null }>;
}

let pending: Promise<Activity | null> | null = null;
const load = () => (pending ??= fetch("/data/activity.json", { cache: "no-cache" }).then((r) => (r.ok ? (r.json() as Promise<Activity>) : null)).catch(() => null));

export function useActivity(): Activity | null {
  const [a, setA] = useState<Activity | null>(null);
  useEffect(() => { let dead = false; void load().then((x) => { if (!dead) setA(x); }); return () => { dead = true; }; }, []);
  return a;
}
