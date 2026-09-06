/**
 * The harvest seam (docs/housecalls/harvest-seam-plan.md): two small
 * interfaces between the pipeline and the outside world, selected by
 * platform.json's optional "providers" block:
 *
 *   { "providers": { "crawl": "cbintel", "geocode": "cbgeo" } }   (defaults)
 *
 * CrawlProvider:  listJobs() → [job_id]; getJob(id) → job;
 *                 dispatch(query, opts) → { job_id };
 *                 fetchArtifacts(job, dir) → { crawl_result, evaluation } paths
 * GeocodeProvider: geocode(query) → { lon, lat } | null
 *
 * Providers are dumb transports BY DESIGN: the rubric, the PII firewall,
 * the stage ratchet, and the geocache all live outside this file, where no
 * backend can reach them. mockProviders() exists so the pipeline's main
 * loop can be selftested without a platform at all.
 */

import { execFileSync } from "node:child_process"
import { writeFileSync, mkdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

export function makeProviders(platform) {
  const exec = (args) => JSON.parse(execFileSync(platform.cbcli, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }))
  const ws = platform.workspace_id

  const crawls = {
    cbintel: {
      listJobs() {
        const listing = exec(["cbintel", "workspaces", "jobs", "--params", JSON.stringify({ workspace_id: ws })])
        return Array.isArray(listing)
          ? listing
          : (listing.jobs ?? listing.job_ids ?? []).map((j) => (typeof j === "string" ? j : j.job_id))
      },
      getJob(jobId) {
        return exec(["cbintel", "jobs", "get-get", "--params", JSON.stringify({ job_id: jobId })])
      },
      dispatch(query, opts = {}) {
        return exec([
          "cbintel", "jobs", "crawl", "--params",
          JSON.stringify({
            workspace_id: ws,
            query,
            prompt_type: opts.prompt_type ?? "investigative",
            max_urls: opts.max_urls ?? 10,
          }),
        ])
      },
      /** Formalizes the curl-the-result-url step that was manual since the
       *  first crawl: saves crawl_result.json + evaluation.json next to the
       *  raw job record. Page texts stay on demand (they can be many). */
      async fetchArtifacts(job, dir) {
        const url = job.result?.result_url
        if (!url) return null
        mkdirSync(dir, { recursive: true })
        const grab = async (u, name) => {
          const res = await fetch(u)
          if (!res.ok) return null
          const file = path.join(dir, `${name}-${job.job_id}.json`)
          writeFileSync(file, await res.text())
          return file
        }
        const base = url.replace(/\/crawl_result\.json$/, "")
        return {
          crawl_result: await grab(url, "crawl_result"),
          evaluation: await grab(`${base}/analysis/evaluation.json`, "evaluation"),
        }
      },
    },
  }

  const geos = {
    cbgeo: {
      geocode(query) {
        const res = exec(["cbgeo", "search", "list", "--params", JSON.stringify({ q: query, limit: 1 })])
        const row = Array.isArray(res) ? res[0] : (res.results ?? res.features ?? [])[0]
        if (!row) return null
        const lon = Number(row.lon ?? row.longitude ?? row.geometry?.coordinates?.[0])
        const lat = Number(row.lat ?? row.latitude ?? row.geometry?.coordinates?.[1])
        return Number.isFinite(lon) && Number.isFinite(lat) ? { lon, lat } : null
      },
    },
    // The vendored Census Gazetteer: geocoding as a local dictionary hit, no
    // network at harvest time. Vendor with scripts/vendor-census-places.sh;
    // the pipeline only ever asks for "City, State" so that is all this
    // answers, and an unknown city is an honest null, never a guess.
    census: {
      geocode(query) {
        this._places ??= JSON.parse(readFileSync(path.join(ROOT, "lib", "housecalls", "places.json"), "utf8")).places
        const base = query.split(",")[0].trim().toLowerCase()
        const hit = this._places[base]
        return hit ? { lon: hit.lon, lat: hit.lat } : null
      },
    },
  }

  const crawlName = platform.providers?.crawl ?? "cbintel"
  const geoName = platform.providers?.geocode ?? "cbgeo"
  if (!crawls[crawlName]) throw new Error(`unknown crawl provider "${crawlName}" (have: ${Object.keys(crawls).join(", ")})`)
  if (!geos[geoName]) throw new Error(`unknown geocode provider "${geoName}" (have: ${Object.keys(geos).join(", ")})`)
  return { crawl: crawls[crawlName], geocode: geos[geoName].geocode, names: { crawl: crawlName, geocode: geoName } }
}

/** Fixture-driven providers for selftests: fx = { jobs, geocodes }. Records
 *  every dispatch and failed geocode so tests can assert on behavior. */
export function mockProviders(fx) {
  const dispatched = []
  return {
    crawl: {
      listJobs: () => Object.keys(fx.jobs ?? {}),
      getJob: (id) => fx.jobs[id],
      dispatch(query, opts = {}) {
        dispatched.push({ query, opts })
        return { job_id: `job_mock_${dispatched.length}` }
      },
      fetchArtifacts: async () => null,
    },
    geocode: (query) => fx.geocodes?.[query] ?? null,
    names: { crawl: "mock", geocode: "mock" },
    dispatched,
  }
}
