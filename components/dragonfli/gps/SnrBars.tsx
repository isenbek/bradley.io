"use client"

import { snrT, type Sat, type SatAgg } from "./stream"

// Per-satellite signal-strength spectrum. Bars sorted by SNR; used sats lit.
const MAX_SNR = 50

export function SnrBars({ sats, agg }: { sats: Sat[]; agg: SatAgg | null }) {
  const sorted = [...sats].sort((a, b) => b.snr - a.snr)
  return (
    <div className="beta-gps-panel">
      <div className="beta-gps-panel__head">
        <span className="beta-gps-panel__title">Signal</span>
        <span className="beta-gps-panel__sub">SNR · dB-Hz</span>
      </div>
      <div className="beta-gps-snr">
        {sorted.length > 0 ? (
          <div className="beta-gps-snr__bars">
            {sorted.map((s) => {
              const t = snrT(s.snr)
              return (
                <div key={s.prn} className="beta-gps-snr__col" title={`PRN ${s.prn} · ${s.snr} dB-Hz`}>
                  <div className="beta-gps-snr__track">
                    <div
                      className={`beta-gps-snr__fill${s.used ? " is-used" : ""}`}
                      style={{ height: `${Math.min(100, (s.snr / MAX_SNR) * 100)}%`, opacity: 0.45 + t * 0.55 }}
                    />
                  </div>
                  <div className="beta-gps-snr__prn">{s.prn}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="beta-gps-empty">
            <span className="beta-gps-empty__dot" aria-hidden />
            {agg ? `${agg.n_used}/${agg.n_visible} used · awaiting per-satellite SNR` : "awaiting signal"}
          </div>
        )}
      </div>
    </div>
  )
}
