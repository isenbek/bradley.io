"use client"

/**
 * Browser glue for the House Calls local harness (P3 of
 * docs/housecalls/local-harness-plan.md). Lazily loads two vendored wasm
 * modules from /harness/ (the hc-engine brain, ~280KB, and duckdb-wasm,
 * about an 8MB download once) and wires them together:
 *
 *   engine emits SQL + owns crypto  ->  duckdb-wasm executes
 *   snapshot bytes <- CHECKPOINT + copyFileToBuffer
 *   persistence: encrypted-at-nothing LOCAL copy in IndexedDB (works on
 *   every browser; OPFS fast-path is a later optimization), plus the
 *   optional zero-knowledge stash on the server via the engine's Vault.
 *
 * Nothing here ever sees key bytes: words go into the engine's Vault,
 * ciphertext comes out.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const DB_FILE = "hc.db"
const IDB_NAME = "hc-harness"
const IDB_STORE = "db-bytes"

// Dynamic import of runtime URLs without bundler interference.
const importUrl = (u: string): Promise<any> => new Function("u", "return import(u)")(u)

// ---- tiny IndexedDB byte store (universal local persistence) ----

function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => res(req.result)
    req.onerror = () => rej(req.error)
  })
}
async function idbGet(key: string): Promise<Uint8Array | null> {
  const db = await idb()
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(key)
    tx.onsuccess = () => res(tx.result ? new Uint8Array(tx.result) : null)
    tx.onerror = () => rej(tx.error)
  })
}
async function idbSet(key: string, bytes: Uint8Array): Promise<void> {
  const db = await idb()
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).put(bytes.buffer.slice(0), key)
    tx.onsuccess = () => res()
    tx.onerror = () => rej(tx.error)
  })
}

// ---- the harness ----

export interface Harness {
  engine: any
  query(templateName: string, params?: unknown[]): Promise<Record<string, unknown>[]>
  exec(rawSql: string): Promise<void>
  snapshot(): Promise<Uint8Array>
  restoreFromBytes(bytes: Uint8Array): Promise<void>
  persistLocal(): Promise<void>
  counts(): Promise<{ quotes: number; change_orders: number }>
  importFromLocalStorage(): Promise<{ imported: string[] }>
}

let singleton: Promise<Harness> | null = null

export function loadHarness(onStep?: (msg: string) => void): Promise<Harness> {
  singleton ??= build(onStep ?? (() => {}))
  return singleton
}

async function build(step: (msg: string) => void): Promise<Harness> {
  step("Loading the engine (about 300KB)")
  const engine = await importUrl("/harness/hc_engine.js")
  await engine.default("/harness/hc_engine_bg.wasm")

  step("Loading the database (about an 8MB download, once; it stays on your device)")
  const duckdb = await importUrl("/harness/duckdb/duckdb-bundled.mjs")
  const worker = new Worker("/harness/duckdb/duckdb-browser-eh.worker.js")
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING)
  const db = new duckdb.AsyncDuckDB(logger, worker)
  await db.instantiate("/harness/duckdb/duckdb-eh.wasm")

  step("Opening your local store")
  const saved = await idbGet(DB_FILE).catch(() => null)
  if (saved) await db.registerFileBuffer(DB_FILE, saved)
  await db.open({ path: DB_FILE })
  let conn = await db.connect()

  const exec = async (rawSql: string) => {
    await conn.query(rawSql)
  }
  const query = async (templateName: string, params: unknown[] = []) => {
    const sql: string = engine.stmt(templateName)
    if (params.length === 0) {
      const t = await conn.query(sql)
      return t.toArray().map((r: any) => r.toJSON())
    }
    const stmt = await conn.prepare(sql)
    try {
      const t = await stmt.query(...params)
      return t.toArray().map((r: any) => r.toJSON())
    } finally {
      await stmt.close()
    }
  }

  // Migrations: read the stamp (absent on fresh), apply what's missing.
  let from = 0
  try {
    const rows = await query("read_version")
    from = rows.length ? Number(rows[0].value) : 0
  } catch {
    from = 0
  }
  for (const sql of engine.migrations_from(from)) await exec(sql)

  const snapshot = async () => {
    await conn.query("CHECKPOINT")
    return (await db.copyFileToBuffer(DB_FILE)) as Uint8Array
  }
  const persistLocal = async () => {
    await idbSet(DB_FILE, await snapshot())
  }
  const restoreFromBytes = async (bytes: Uint8Array) => {
    await conn.close()
    await db.registerFileBuffer(DB_FILE, bytes)
    await db.open({ path: DB_FILE })
    conn = await db.connect()
    await idbSet(DB_FILE, bytes)
  }
  const counts = async () => {
    const q = await conn.query("SELECT count(*) AS n FROM quotes")
    const c = await conn.query("SELECT count(*) AS n FROM change_orders")
    return { quotes: Number(q.toArray()[0].n), change_orders: Number(c.toArray()[0].n) }
  }

  const importFromLocalStorage = async () => {
    const imported: string[] = []
    const read = (k: string) => {
      try {
        const raw = localStorage.getItem(k)
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    }
    const shop = read("hc-quote-shop")
    if (shop?.name) {
      await query("upsert_shop", [
        shop.name ?? "", shop.phone ?? "", shop.email ?? "", shop.city ?? "",
        shop.license ?? "", shop.insured ?? "", shop.deposit_pct ?? "", shop.valid_days ?? "", shop.terms ?? "",
      ])
      imported.push("shop")
    }
    const draft = read("hc-quote-draft")
    if (draft?.items?.some((it: any) => it.desc || Number(it.unit) > 0)) {
      const totalCents = draft.items.reduce((s: number, it: any) => {
        const unit = Math.round(Number(String(it.unit).replace(/[$,\s]/g, "")) * 100) || 0
        const qty = Number(it.qty) || 0
        return s + Math.round(qty * unit)
      }, 0)
      await query("insert_quote", [
        `q_${Date.now().toString(36)}`, new Date().toISOString(),
        draft.customer ?? "", draft.address ?? "", draft.scope ?? "",
        draft.exclusions ?? "", draft.notes ?? "", draft.deposit_pct ?? "",
        draft.valid_until ?? "", JSON.stringify(draft.items), totalCents,
      ])
      imported.push("current quote draft")
    }
    const co = read("hc-co-draft")
    if (co?.description) {
      const cents = (co.mode === "deduct" ? -1 : 1) * (Math.round(Number(String(co.amount).replace(/[$,\s]/g, "")) * 100) || 0)
      await query("insert_co", [
        `co_${Date.now().toString(36)}`, co.co_number ?? "", new Date().toISOString(),
        co.customer ?? "", co.address ?? "", co.job_ref ?? "",
        co.description ?? "", co.reason ?? "", cents, co.days ?? "",
        co.signed_name ?? "", co.signed_date ?? "", co.signature ?? null,
        co.photos?.length ? JSON.stringify(co.photos) : null,
      ])
      imported.push("current change order")
    }
    await persistLocal()
    return { imported }
  }

  return { engine, query, exec, snapshot, restoreFromBytes, persistLocal, counts, importFromLocalStorage }
}

// ---- the stash (transport half; version rules live in the engine) ----

export async function stashPut(h: Harness, vault: any): Promise<{ version: number }> {
  const bytes = await h.snapshot()
  const envelope: Uint8Array = vault.encrypt(bytes)
  const sha: string = h.engine.sha256_hex(envelope)
  const id: string = vault.stash_id()
  const localVersion = Number(localStorage.getItem("hc-stash-version") ?? "0") + 1
  const res = await fetch(`/api/housecalls/stash/${id}`, {
    method: "PUT",
    headers: { "x-stash-version": String(localVersion), "x-stash-sha256": sha },
    body: new Uint8Array(envelope) as unknown as BodyInit,
  })
  if (res.status === 409) {
    const j = await res.json()
    throw new Error(`A newer backup exists (version ${j.stored_version}). Restore first, then back up.`)
  }
  if (!res.ok) throw new Error(`backup failed: ${(await res.json()).error ?? res.status}`)
  localStorage.setItem("hc-stash-version", String(localVersion))
  return { version: localVersion }
}

export async function stashPull(h: Harness, vault: any): Promise<{ version: number }> {
  const id: string = vault.stash_id()
  const res = await fetch(`/api/housecalls/stash/${id}`)
  if (res.status === 404) throw new Error("No backup found for these words.")
  if (!res.ok) throw new Error(`restore failed: ${res.status}`)
  const envelope = new Uint8Array(await res.arrayBuffer())
  const claimed = res.headers.get("x-stash-sha256")
  if (claimed && h.engine.sha256_hex(envelope) !== claimed) throw new Error("backup arrived corrupted; try again")
  const bytes: Uint8Array = vault.decrypt(envelope)
  await h.restoreFromBytes(bytes)
  const version = Number(res.headers.get("x-stash-version") ?? "1")
  localStorage.setItem("hc-stash-version", String(version))
  return { version }
}
