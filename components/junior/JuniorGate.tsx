"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, LoaderCircle } from "lucide-react"
import { BioLogo } from "@/components/v3/BioLogo"

// TEMPORARY — PIN gate for the /junior walkthrough page.
// The PIN is never shipped to the browser; this posts it and lets the server
// decide. Delete with the rest of the /junior tree at teardown.

export function JuniorGate() {
  const router = useRouter()
  const [pin, setPin] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || pin.length < 4) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/junior/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.ok) {
        router.refresh()
        return
      }
      setError(data?.error ?? "Wrong PIN.")
      setPin("")
    } catch {
      setError("Network error — try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="v3-jr-gate">
      <form className="v3-jr-gate__card" onSubmit={submit}>
        <div className="v3-jr-gate__mark" aria-hidden>
          <BioLogo />
        </div>

        <h1>
          <Lock size={18} strokeWidth={2.4} aria-hidden /> Private session
        </h1>
        <p>Enter the PIN you were given over the phone.</p>

        <input
          className="v3-jr-gate__input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          aria-label="PIN"
          placeholder="••••••••"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 12))}
        />

        <button className="v3-btn v3-btn--primary v3-jr-gate__go" type="submit" disabled={busy || pin.length < 4}>
          {busy ? <LoaderCircle size={15} strokeWidth={2.6} className="v3-jr-spin" aria-hidden /> : null}
          {busy ? "Checking…" : "Unlock"}
        </button>

        {error ? (
          <p className="v3-jr-gate__err" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  )
}
