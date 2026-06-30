/* bradley.io — device capability scanner (first-principles, dependency-free).
 *
 * Probes every hook, sensor, jimjam and doohickey the browser exposes, renders
 * a live report into a host element, and persists snapshots + preferences to
 * IndexedDB (the local "PWA userspace"). No framework — just DOM + Web APIs, so
 * it runs identically embedded in the /preferences route or lifted out into a
 * standalone HTML file.
 *
 *   BradleyScanner.mount(element)  -> renders + wires the UI
 *   BradleyScanner.scan()         -> returns a plain snapshot object
 */
(function () {
  "use strict"

  // ---- IndexedDB userspace ------------------------------------------------
  const DB_NAME = "bio-prefs"
  const DB_VER = 1
  function openDB() {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open(DB_NAME, DB_VER)
      r.onupgradeneeded = () => {
        const db = r.result
        if (!db.objectStoreNames.contains("scans")) db.createObjectStore("scans", { keyPath: "ts" })
        if (!db.objectStoreNames.contains("prefs")) db.createObjectStore("prefs", { keyPath: "key" })
      }
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => reject(r.error)
    })
  }
  function tx(db, store, mode) {
    return db.transaction(store, mode).objectStore(store)
  }
  async function dbPut(store, value) {
    const db = await openDB()
    return new Promise((res, rej) => {
      const req = tx(db, store, "readwrite").put(value)
      req.onsuccess = () => res(req.result)
      req.onerror = () => rej(req.error)
    })
  }
  async function dbAll(store) {
    const db = await openDB()
    return new Promise((res, rej) => {
      const req = tx(db, store, "readonly").getAll()
      req.onsuccess = () => res(req.result || [])
      req.onerror = () => rej(req.error)
    })
  }
  async function dbClear(store) {
    const db = await openDB()
    return new Promise((res, rej) => {
      const req = tx(db, store, "readwrite").clear()
      req.onsuccess = () => res()
      req.onerror = () => rej(req.error)
    })
  }

  // ---- helpers ------------------------------------------------------------
  const has = (obj, key) => { try { return key in obj } catch { return false } }
  const j = (v) => (v == null ? "—" : String(v))

  // ---- probe registry -----------------------------------------------------
  // Each: { id, label, group, supported(), detail(), probe?(update) }
  // detail() returns a passive string; probe() actively reads (and may stream
  // via repeated update(str) calls). supported() gates the LED + probe button.
  const P = []
  const add = (p) => P.push(p)

  // — Device —
  add({ id: "platform", label: "Platform", group: "Device", supported: () => true, detail: () => j((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform) })
  add({ id: "cores", label: "CPU threads", group: "Device", supported: () => "hardwareConcurrency" in navigator, detail: () => j(navigator.hardwareConcurrency) })
  add({ id: "memory", label: "Device memory", group: "Device", supported: () => "deviceMemory" in navigator, detail: () => (navigator.deviceMemory ? navigator.deviceMemory + " GB" : "—") })
  add({ id: "touch", label: "Touch points", group: "Device", supported: () => "maxTouchPoints" in navigator, detail: () => j(navigator.maxTouchPoints) })
  add({ id: "screen", label: "Screen", group: "Device", supported: () => true, detail: () => `${screen.width}×${screen.height} @${window.devicePixelRatio}× · ${screen.colorDepth}-bit` })
  add({ id: "viewport", label: "Viewport", group: "Device", supported: () => true, detail: () => `${innerWidth}×${innerHeight}` })
  add({ id: "orientation", label: "Orientation", group: "Device", supported: () => "orientation" in screen, detail: () => j(screen.orientation && screen.orientation.type) })
  add({ id: "scheme", label: "Color scheme", group: "Device", supported: () => true, detail: () => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") })
  add({ id: "reduced", label: "Reduced motion", group: "Device", supported: () => true, detail: () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "yes" : "no") })
  add({ id: "online", label: "Online", group: "Device", supported: () => true, detail: () => (navigator.onLine ? "yes" : "no") })

  // — Sensors & motion —
  add({
    id: "geolocation", label: "Geolocation", group: "Sensors & motion",
    supported: () => "geolocation" in navigator, detail: () => "tap read",
    probe: (u) => navigator.geolocation.getCurrentPosition(
      (p) => u(`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)} ±${Math.round(p.coords.accuracy)}m`),
      (e) => u("denied/err: " + e.code), { enableHighAccuracy: true, timeout: 15000 }),
  })
  add({
    id: "motion", label: "Accelerometer (motion)", group: "Sensors & motion",
    supported: () => "DeviceMotionEvent" in window, detail: () => "tap stream",
    probe: async (u) => {
      if (typeof DeviceMotionEvent.requestPermission === "function") {
        const s = await DeviceMotionEvent.requestPermission().catch(() => "denied")
        if (s !== "granted") return u("permission " + s)
      }
      addEventListener("devicemotion", (e) => {
        const a = e.accelerationIncludingGravity || {}
        u(`x ${(a.x || 0).toFixed(1)} · y ${(a.y || 0).toFixed(1)} · z ${(a.z || 0).toFixed(1)} m/s²`)
      })
    },
  })
  add({
    id: "tilt", label: "Orientation (tilt)", group: "Sensors & motion",
    supported: () => "DeviceOrientationEvent" in window, detail: () => "tap stream",
    probe: async (u) => {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const s = await DeviceOrientationEvent.requestPermission().catch(() => "denied")
        if (s !== "granted") return u("permission " + s)
      }
      addEventListener("deviceorientation", (e) => u(`α ${(e.alpha || 0).toFixed(0)}° · β ${(e.beta || 0).toFixed(0)}° · γ ${(e.gamma || 0).toFixed(0)}°`))
    },
  })
  add({
    id: "light", label: "Ambient light", group: "Sensors & motion",
    supported: () => "AmbientLightSensor" in window, detail: () => "tap stream",
    probe: (u) => { try { const s = new window.AmbientLightSensor(); s.onreading = () => u(s.illuminance + " lux"); s.onerror = (e) => u("err: " + (e.error && e.error.name)); s.start() } catch (e) { u("err: " + e.name) } },
  })
  add({ id: "gyro", label: "Gyroscope (API)", group: "Sensors & motion", supported: () => "Gyroscope" in window, detail: () => "available" })
  add({ id: "mag", label: "Magnetometer (API)", group: "Sensors & motion", supported: () => "Magnetometer" in window, detail: () => "available" })

  // — Connectivity —
  add({ id: "network", label: "Network info", group: "Connectivity", supported: () => "connection" in navigator, detail: () => { const c = navigator.connection || {}; return `${c.effectiveType || "?"} · ${c.downlink || "?"}Mbps · rtt ${c.rtt || "?"}ms${c.saveData ? " · save-data" : ""}` } })
  add({ id: "bluetooth", label: "Bluetooth", group: "Connectivity", supported: () => "bluetooth" in navigator, detail: () => "tap read", probe: (u) => navigator.bluetooth.getAvailability().then((a) => u(a ? "adapter available" : "no adapter")).catch((e) => u("err: " + e.name)) })
  add({ id: "usb", label: "WebUSB", group: "Connectivity", supported: () => "usb" in navigator, detail: () => "available" })
  add({ id: "serial", label: "Web Serial", group: "Connectivity", supported: () => "serial" in navigator, detail: () => "available" })
  add({ id: "hid", label: "WebHID", group: "Connectivity", supported: () => "hid" in navigator, detail: () => "available" })
  add({ id: "nfc", label: "Web NFC", group: "Connectivity", supported: () => "NDEFReader" in window, detail: () => "available" })

  // — Media —
  add({
    id: "mediadevices", label: "Media devices", group: "Media",
    supported: () => !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices), detail: () => "tap count",
    probe: (u) => navigator.mediaDevices.enumerateDevices().then((d) => {
      const cam = d.filter((x) => x.kind === "videoinput").length
      const mic = d.filter((x) => x.kind === "audioinput").length
      const spk = d.filter((x) => x.kind === "audiooutput").length
      u(`${cam} cam · ${mic} mic · ${spk} out`)
    }).catch((e) => u("err: " + e.name)),
  })
  add({ id: "getusermedia", label: "getUserMedia", group: "Media", supported: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia), detail: () => "available" })
  add({ id: "speak", label: "Speech synthesis", group: "Media", supported: () => "speechSynthesis" in window, detail: () => `${(speechSynthesis.getVoices() || []).length} voices`, probe: (u) => { const v = speechSynthesis.getVoices(); speechSynthesis.speak(new SpeechSynthesisUtterance("Meatball meatballin'.")); u(`${v.length} voices · spoke`) } })
  add({ id: "speechrec", label: "Speech recognition", group: "Media", supported: () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window, detail: () => "available" })
  add({ id: "vibrate", label: "Vibration", group: "Media", supported: () => "vibrate" in navigator, detail: () => "tap buzz", probe: (u) => { navigator.vibrate([60, 40, 60]); u("buzzed") } })

  // — Storage & permissions —
  add({
    id: "storage", label: "Storage quota", group: "Storage & permissions",
    supported: () => !!(navigator.storage && navigator.storage.estimate), detail: () => "tap read",
    probe: (u) => navigator.storage.estimate().then((e) => u(`${(e.usage / 1048576).toFixed(1)} / ${(e.quota / 1048576).toFixed(0)} MB used`)).catch((e) => u("err: " + e.name)),
  })
  add({ id: "persisted", label: "Persistent storage", group: "Storage & permissions", supported: () => !!(navigator.storage && navigator.storage.persisted), detail: () => "tap read", probe: (u) => navigator.storage.persisted().then((p) => u(p ? "granted" : "best-effort")).catch((e) => u("err: " + e.name)) })
  add({
    id: "permissions", label: "Permissions states", group: "Storage & permissions",
    supported: () => "permissions" in navigator, detail: () => "tap query",
    probe: async (u) => {
      const names = ["geolocation", "camera", "microphone", "notifications", "accelerometer", "gyroscope", "magnetometer", "persistent-storage"]
      const out = []
      for (const n of names) {
        try { const r = await navigator.permissions.query({ name: n }); out.push(`${n}:${r.state}`) } catch { /* unsupported name */ }
      }
      u(out.join(" · ") || "none queryable")
    },
  })
  add({ id: "clipboard", label: "Clipboard", group: "Storage & permissions", supported: () => !!(navigator.clipboard && navigator.clipboard.writeText), detail: () => "available" })
  add({ id: "contacts", label: "Contacts picker", group: "Storage & permissions", supported: () => "contacts" in navigator && "ContactsManager" in window, detail: () => "available" })

  // — Platform APIs —
  add({ id: "share", label: "Web Share", group: "Platform APIs", supported: () => "share" in navigator, detail: () => "tap share", probe: (u) => navigator.share({ title: "bradley.io", url: location.origin }).then(() => u("shared")).catch((e) => u(e.name === "AbortError" ? "cancelled" : "err: " + e.name)) })
  add({ id: "wakelock", label: "Screen wake lock", group: "Platform APIs", supported: () => "wakeLock" in navigator, detail: () => "tap hold", probe: (u) => navigator.wakeLock.request("screen").then((l) => { u("held 4s"); setTimeout(() => l.release(), 4000) }).catch((e) => u("err: " + e.name)) })
  add({ id: "battery", label: "Battery", group: "Platform APIs", supported: () => "getBattery" in navigator, detail: () => "tap read", probe: (u) => navigator.getBattery().then((b) => u(`${Math.round(b.level * 100)}% · ${b.charging ? "charging" : "on battery"}`)).catch((e) => u("err: " + e.name)) })
  add({ id: "gamepad", label: "Gamepads", group: "Platform APIs", supported: () => "getGamepads" in navigator, detail: () => "tap scan", probe: (u) => { const g = [...navigator.getGamepads()].filter(Boolean); u(g.length ? g.map((x) => x.id).join(", ") : "none connected") } })
  add({ id: "webgpu", label: "WebGPU", group: "Platform APIs", supported: () => "gpu" in navigator, detail: () => "tap adapter", probe: (u) => navigator.gpu.requestAdapter().then((a) => u(a ? "adapter ok" : "no adapter")).catch((e) => u("err: " + e.name)) })
  add({ id: "webgl", label: "WebGL renderer", group: "Platform APIs", supported: () => { try { return !!document.createElement("canvas").getContext("webgl") } catch { return false } }, detail: () => { try { const gl = document.createElement("canvas").getContext("webgl"); const dbg = gl.getExtension("WEBGL_debug_renderer_info"); return dbg ? j(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)).slice(0, 42) : "masked" } catch { return "—" } } })
  add({ id: "notifications", label: "Notifications", group: "Platform APIs", supported: () => "Notification" in window, detail: () => "perm: " + (window.Notification ? Notification.permission : "—") })
  add({ id: "sw", label: "Service worker", group: "Platform APIs", supported: () => "serviceWorker" in navigator, detail: () => (navigator.serviceWorker && navigator.serviceWorker.controller ? "active" : "registered/none") })
  add({ id: "push", label: "Push API", group: "Platform APIs", supported: () => "PushManager" in window, detail: () => "available" })
  add({ id: "webauthn", label: "WebAuthn", group: "Platform APIs", supported: () => "PublicKeyCredential" in window, detail: () => "available" })
  add({ id: "idle", label: "Idle detection", group: "Platform APIs", supported: () => "IdleDetector" in window, detail: () => "available" })

  // ---- snapshot (plain object, for persistence/export) --------------------
  function scan() {
    const results = {}
    for (const p of P) {
      let detail = null
      try { detail = p.detail() } catch { detail = "err" }
      results[p.id] = { label: p.label, group: p.group, supported: !!safe(p.supported), detail }
    }
    return { ts: Date.now(), ua: navigator.userAgent, results }
  }
  const safe = (fn) => { try { return fn() } catch { return false } }

  // ---- rendering ----------------------------------------------------------
  let styled = false
  function injectStyle() {
    if (styled) return
    styled = true
    const css = `
.bsc{font-family:var(--font-v3-mono),ui-monospace,monospace;color:#c8dae4}
.bsc__top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px}
.bsc__title{font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#eaf6fb}
.bsc__actions{margin-left:auto;display:flex;gap:6px;flex-wrap:wrap}
.bsc__btn{font:inherit;font-size:11px;cursor:pointer;color:#c8dae4;background:#0e1620;border:1px solid rgba(255,255,255,.14);border-radius:7px;padding:5px 10px}
.bsc__btn:hover{border-color:#38bdf8;color:#eaf6fb}
.bsc__meta{font-size:11px;color:#6b8a99;margin-bottom:12px}
.bsc__group{margin:14px 0 6px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#5d7a88;border-top:1px solid rgba(255,255,255,.06);padding-top:10px}
.bsc__row{display:flex;align-items:center;gap:10px;padding:5px 0;font-size:12px;border-bottom:1px solid rgba(255,255,255,.04)}
.bsc__led{width:8px;height:8px;border-radius:50%;flex:none;background:#33414c}
.bsc__led.on{background:#22c55e;box-shadow:0 0 7px #22c55e}
.bsc__name{min-width:150px;color:#aebfca}
.bsc__val{margin-left:auto;text-align:right;color:#c8dae4;word-break:break-word;font-variant-numeric:tabular-nums}
.bsc__probe{font:inherit;font-size:10px;cursor:pointer;color:#38bdf8;background:transparent;border:1px solid rgba(56,189,248,.35);border-radius:6px;padding:2px 8px}
.bsc__probe:hover{background:rgba(56,189,248,.12)}`
    const el = document.createElement("style")
    el.textContent = css
    document.head.appendChild(el)
  }

  function render(host, savedCount) {
    injectStyle()
    const supported = P.filter((p) => safe(p.supported)).length
    host.innerHTML = ""
    const root = document.createElement("div")
    root.className = "bsc"
    root.innerHTML =
      `<div class="bsc__top"><div class="bsc__title">device capabilities</div>` +
      `<div class="bsc__actions">` +
      `<button class="bsc__btn" data-act="rescan">rescan</button>` +
      `<button class="bsc__btn" data-act="save">save snapshot</button>` +
      `<button class="bsc__btn" data-act="export">export</button>` +
      `<button class="bsc__btn" data-act="clear">clear</button>` +
      `</div></div>` +
      `<div class="bsc__meta">${P.length} capabilities · ${supported} supported · ${savedCount} saved snapshot${savedCount === 1 ? "" : "s"}</div>` +
      `<div class="bsc__sections"></div>`
    host.appendChild(root)

    const sections = root.querySelector(".bsc__sections")
    const groups = [...new Set(P.map((p) => p.group))]
    for (const g of groups) {
      const h = document.createElement("div")
      h.className = "bsc__group"
      h.textContent = g
      sections.appendChild(h)
      for (const p of P.filter((x) => x.group === g)) {
        const ok = safe(p.supported)
        const row = document.createElement("div")
        row.className = "bsc__row"
        const val = document.createElement("span")
        val.className = "bsc__val"
        try { val.textContent = ok ? j(p.detail()) : "unsupported" } catch { val.textContent = "err" }
        row.innerHTML = `<span class="bsc__led ${ok ? "on" : ""}"></span><span class="bsc__name">${p.label}</span>`
        if (ok && p.probe) {
          const b = document.createElement("button")
          b.className = "bsc__probe"
          b.textContent = "read"
          b.onclick = () => { val.textContent = "…"; try { p.probe((s) => (val.textContent = s)) } catch (e) { val.textContent = "err: " + e.name } }
          row.appendChild(b)
        }
        row.appendChild(val)
        sections.appendChild(row)
      }
    }

    root.querySelector('[data-act="rescan"]').onclick = () => mount(host)
    root.querySelector('[data-act="save"]').onclick = async () => { await dbPut("scans", scan()); mount(host) }
    root.querySelector('[data-act="export"]').onclick = async () => {
      const scans = await dbAll("scans")
      const blob = new Blob([JSON.stringify({ latest: scan(), history: scans }, null, 2)], { type: "application/json" })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = "bradley-io-capabilities.json"
      a.click()
      URL.revokeObjectURL(a.href)
    }
    root.querySelector('[data-act="clear"]').onclick = async () => { await dbClear("scans"); mount(host) }
  }

  async function mount(host) {
    if (typeof host === "string") host = document.querySelector(host)
    if (!host) return
    // Render immediately — never block the capability list on IndexedDB (which
    // can be slow or disabled in private/embedded contexts). The saved-snapshot
    // count is filled in asynchronously once the store responds.
    render(host, 0)
    try {
      const scans = await dbAll("scans")
      const meta = host.querySelector(".bsc__meta")
      const sup = P.filter((p) => safe(p.supported)).length
      if (meta) meta.textContent = `${P.length} capabilities · ${sup} supported · ${scans.length} saved snapshot${scans.length === 1 ? "" : "s"}`
    } catch {
      /* idb unavailable — the scan UI still works, just no persisted history */
    }
  }

  window.BradleyScanner = { mount, scan }
})()
