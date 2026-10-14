import { useEffect, useState } from "react";

/** GET a JSON document once, then every `pollMs` while the page is visible. null until it answers; `failed` after a miss. */
export function useJson<T>(url: string, pollMs = 0): { data: T | null; failed: boolean } {
  const [s, set] = useState<{ data: T | null; failed: boolean }>({ data: null, failed: false });
  useEffect(() => {
    const ac = new AbortController();
    const go = () => {
      if (document.visibilityState === "hidden") return;
      fetch(url, { signal: ac.signal, cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(new Error(String(r.status)))))
        .then((data) => { if (!ac.signal.aborted) set({ data, failed: false }); })
        .catch(() => { if (!ac.signal.aborted) set((p) => ({ data: p.data, failed: true })); });
    };
    go();
    const id = pollMs ? setInterval(go, pollMs) : 0;
    return () => { ac.abort(); if (id) clearInterval(id); };
  }, [url, pollMs]);
  return s;
}
