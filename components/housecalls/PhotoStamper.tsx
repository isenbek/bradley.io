"use client"

import { useEffect, useRef, useState } from "react"
import { zipSync } from "fflate"
import { photoFilename, stampLines, zipFilename } from "./photo-stamp"

/**
 * The job photo stamper: third House Calls giveaway
 * (trades-temperature shortlist #3). Photo in; job label, time, and GPS
 * burned into the pixels; gallery grouped by job; the whole job exports as
 * one zip. Photos live in IndexedDB on the device, nothing uploads, and
 * the canvas re-encode strips hidden EXIF as a side effect: what the photo
 * says is exactly what you can see on it.
 */

interface StoredPhoto {
  id: string
  job: string
  taken_at: string
  lat: number | null
  lon: number | null
  dataUrl: string
}

const IDB_NAME = "hc-photos"
const IDB_STORE = "photos"
const MAX_SIDE = 1600
const JPEG_Q = 0.82

function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => {
      const s = req.result.createObjectStore(IDB_STORE, { keyPath: "id" })
      s.createIndex("job", "job")
    }
    req.onsuccess = () => res(req.result)
    req.onerror = () => rej(req.error)
  })
}
async function idbAll(): Promise<StoredPhoto[]> {
  const db = await idb()
  return new Promise((res, rej) => {
    const r = db.transaction(IDB_STORE).objectStore(IDB_STORE).getAll()
    r.onsuccess = () => res(r.result as StoredPhoto[])
    r.onerror = () => rej(r.error)
  })
}
async function idbPut(p: StoredPhoto): Promise<void> {
  const db = await idb()
  return new Promise((res, rej) => {
    const r = db.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).put(p)
    r.onsuccess = () => res()
    r.onerror = () => rej(r.error)
  })
}
async function idbDel(id: string): Promise<void> {
  const db = await idb()
  return new Promise((res, rej) => {
    const r = db.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).delete(id)
    r.onsuccess = () => res()
    r.onerror = () => rej(r.error)
  })
}

/** Downscale + burn the stamp band into the pixels. */
async function stampPhoto(file: File, job: string, fix: { lat: number | null; lon: number | null }): Promise<StoredPhoto> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = url
    })
    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(img, 0, 0, w, h)

    const when = new Date()
    const lines = stampLines(job, when, fix)
    const fontPx = Math.max(14, Math.round(w * 0.024))
    ctx.font = `${fontPx}px ui-monospace, Menlo, monospace`
    const pad = Math.round(fontPx * 0.6)
    const lineH = Math.round(fontPx * 1.35)
    const bandH = pad * 2 + lineH * lines.length
    ctx.fillStyle = "rgba(0,0,0,0.62)"
    ctx.fillRect(0, h - bandH, Math.min(w, pad * 2 + Math.max(...lines.map((l) => ctx.measureText(l).width))), bandH)
    ctx.fillStyle = "#fff"
    lines.forEach((l, i) => ctx.fillText(l, pad, h - bandH + pad + lineH * (i + 1) - Math.round(fontPx * 0.3)))

    return {
      id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      job: job.trim(),
      taken_at: when.toISOString(),
      lat: fix.lat,
      lon: fix.lon,
      dataUrl: canvas.toDataURL("image/jpeg", JPEG_Q),
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

const dataUrlBytes = (d: string): Uint8Array => {
  const b64 = d.slice(d.indexOf(",") + 1)
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export function PhotoStamper() {
  const [job, setJob] = useState("")
  const [photos, setPhotos] = useState<StoredPhoto[]>([])
  const [gps, setGps] = useState<{ lat: number | null; lon: number | null; status: string }>({ lat: null, lon: null, status: "off" })
  const [busy, setBusy] = useState("")
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    try {
      setJob(localStorage.getItem("hc-photo-job") ?? "")
    } catch {
      /* blocked storage: the job label just starts blank */
    }
    idbAll().then((all) => setPhotos(all.sort((a, b) => b.taken_at.localeCompare(a.taken_at)))).catch(() => {})
    if (navigator.geolocation) {
      setGps((g) => ({ ...g, status: "locating" }))
      navigator.geolocation.getCurrentPosition(
        (p) => setGps({ lat: p.coords.latitude, lon: p.coords.longitude, status: "on" }),
        () => setGps({ lat: null, lon: null, status: "off" }),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      )
    }
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem("hc-photo-job", job)
    } catch {
      /* blocked storage forgets the label; stamping still works */
    }
  }, [job])

  const jobs = [...new Set(photos.map((p) => p.job).filter(Boolean))]
  const currentJobPhotos = photos.filter((p) => p.job === job.trim())

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(`Stamping ${files.length} photo${files.length === 1 ? "" : "s"}`)
    try {
      const added: StoredPhoto[] = []
      for (const f of Array.from(files)) {
        try {
          const p = await stampPhoto(f, job, gps)
          await idbPut(p)
          added.push(p)
        } catch {
          /* one unreadable photo never sinks the batch */
        }
      }
      setPhotos((prev) => [...added.reverse(), ...prev])
    } finally {
      setBusy("")
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const remove = async (id: string) => {
    await idbDel(id).catch(() => {})
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  const exportZip = () => {
    const set = currentJobPhotos.length ? currentJobPhotos : photos
    if (!set.length) return
    setBusy("Building the zip")
    try {
      const entries: Record<string, Uint8Array> = {}
      const ordered = [...set].sort((a, b) => a.taken_at.localeCompare(b.taken_at))
      ordered.forEach((p, i) => {
        entries[photoFilename(p.job || "job", p.taken_at, i + 1)] = dataUrlBytes(p.dataUrl)
      })
      const zipped = zipSync(entries, { level: 0 }) // jpegs do not re-compress
      const blob = new Blob([zipped.buffer as ArrayBuffer], { type: "application/zip" })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = zipFilename(job || "job")
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
    } finally {
      setBusy("")
    }
  }

  const shareJob = async () => {
    const set = currentJobPhotos.length ? currentJobPhotos : photos
    if (!set.length || !("share" in navigator)) return
    try {
      const files = set.map(
        (p, i) => new File([dataUrlBytes(p.dataUrl).buffer as ArrayBuffer], photoFilename(p.job || "job", p.taken_at, i + 1), { type: "image/jpeg" })
      )
      await navigator.share({ files })
    } catch {
      /* user cancelled or files unsupported; the zip path remains */
    }
  }

  return (
    <div className="beta-qp">
      <div className="panel">
        <div className="panel-face">
          <div className="panel-bar">
            <b>Job photos</b>
            <span className="tag">{gps.status === "on" ? "GPS on" : gps.status === "locating" ? "GPS…" : "GPS off"}</span>
          </div>
          <div className="beta-qp-grid">
            <label className="beta-qp-field beta-qp-field--wide">
              <span>Job label (burned onto every photo)</span>
              <input value={job} onChange={(e) => setJob(e.target.value)} placeholder="Smith - 123 Main St" />
            </label>
            {jobs.length > 1 ? (
              <p className="beta-co-photos beta-qp-field--wide">
                {jobs.slice(0, 6).map((j) => (
                  <button key={j} className="btn" onClick={() => setJob(j)}>{j}</button>
                ))}
              </p>
            ) : null}
          </div>
          <p className="hero-ctas beta-qp-actions">
            <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
              + Photos
            </button>
            <button className="btn" onClick={exportZip} disabled={!photos.length}>
              Download zip{currentJobPhotos.length ? ` (${currentJobPhotos.length})` : ""}
            </button>
            {typeof navigator !== "undefined" && "share" in navigator ? (
              <button className="btn" onClick={shareJob} disabled={!photos.length}>Share job</button>
            ) : null}
          </p>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => addFiles(e.target.files)} />
          {busy ? <p className="beta-qp-shopline">{busy}…</p> : null}

          <div className="beta-ps-gallery">
            {(currentJobPhotos.length ? currentJobPhotos : photos).map((p) => (
              <figure className="beta-ps-shot" key={p.id}>
                <img src={p.dataUrl} alt={`Stamped job photo: ${p.job || "no job"} ${p.taken_at.slice(0, 16)}`} />
                <button aria-label="Delete photo" onClick={() => remove(p.id)}>×</button>
              </figure>
            ))}
          </div>
          {!photos.length ? (
            <p className="beta-qp-shopline">
              No photos yet. The label, the time, and the location get burned into each one, so the
              proof cannot drift away from the picture in a text thread.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
