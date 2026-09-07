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
  // In-memory main database; durability comes from the pack (an EXPORT
  // DATABASE parquet set packed into one byte blob) saved to IndexedDB and
  // optionally stashed encrypted. The battle-tested stable-duckdb-wasm
  // flow: COPY-created pseudo-files are what copyFileToBuffer supports.
  await db.open({})
  let conn = await db.connect()

  const packSnapshot = async (): Promise<Uint8Array> => {
    const dir = `snap_${Date.now().toString(36)}`
    await conn.query(`EXPORT DATABASE '${dir}' (FORMAT PARQUET)`)
    const names = (await db.globFiles(`${dir}/*`)).map((f: any) => f.fileName)
    const enc = new TextEncoder()
    const parts: { name: Uint8Array; bytes: Uint8Array }[] = []
    for (const n of names) parts.push({ name: enc.encode(n), bytes: await db.copyFileToBuffer(n) })
    await db.dropFiles(names).catch(() => {})
    let size = 8
    for (const p of parts) size += 2 + p.name.length + 4 + p.bytes.length
    const out = new Uint8Array(size)
    const dv = new DataView(out.buffer)
    out.set(enc.encode("HCPK"), 0)
    dv.setUint32(4, parts.length)
    let o = 8
    for (const p of parts) {
      dv.setUint16(o, p.name.length); o += 2
      out.set(p.name, o); o += p.name.length
      dv.setUint32(o, p.bytes.length); o += 4
      out.set(p.bytes, o); o += p.bytes.length
    }
    return out
  }
  const unpack = (pack: Uint8Array): { name: string; bytes: Uint8Array }[] => {
    const dv = new DataView(pack.buffer, pack.byteOffset, pack.byteLength)
    if (new TextDecoder().decode(pack.subarray(0, 4)) !== "HCPK") throw new Error("not a backup pack")
    const n = dv.getUint32(4)
    const dec = new TextDecoder()
    let o = 8
    const files = []
    for (let i = 0; i < n; i++) {
      const nl = dv.getUint16(o); o += 2
      const name = dec.decode(pack.subarray(o, o + nl)); o += nl
      const bl = dv.getUint32(o); o += 4
      files.push({ name, bytes: pack.subarray(o, o + bl) }); o += bl
    }
    return files
  }
  const importPack = async (pack: Uint8Array) => {
    const files = unpack(pack)
    for (const f of files) await db.registerFileBuffer(f.name, new Uint8Array(f.bytes))
    const dir = files[0].name.split("/")[0]
    await conn.query(`IMPORT DATABASE '${dir}'`)
    await db.dropFiles(files.map((f) => f.name)).catch(() => {})
  }

  const saved = await idbGet(DB_FILE).catch(() => null)
  if (saved) await importPack(saved)

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

  const snapshot = async () => packSnapshot()
  const persistLocal = async () => {
    await idbSet(DB_FILE, await snapshot())
  }
  const restoreFromBytes = async (bytes: Uint8Array) => {
    // A restore replaces the world: fresh in-memory db, import the pack,
    // then run any migrations newer than the backup.
    await conn.close()
    await db.open({})
    conn = await db.connect()
    await importPack(bytes)
    const rows = await query("read_version").catch(() => [])
    const v = rows.length ? Number((rows[0] as any).value) : 0
    for (const sql of engine.migrations_from(v)) await exec(sql)
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
