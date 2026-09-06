"use client"

import { useEffect, useState } from "react"
import { timeAgo } from "@/lib/time-ago"

/**
 * The rig: the hunt's own telemetry (maps-plan.md P3).
 *
 * Reads public/data/housecalls-rig.json, written by the harvest pipeline from
 * cbintel, scoped strictly to the House Calls workspace. What the platform is
 * doing for anyone else never reaches this file, so it can never reach this
 * panel. public/ serves from the working dir at runtime, so the panel goes
 * fresh the moment the pipeline runs; no deploy needed.
 *
 * Everything renders client-side after the fetch, so relative times are safe
 * here (no SSR HTML to go stale; see components/kit/DeployedAgo.tsx history).
 */

interface RigData {
  generated: string
  jobs: { total: number } & Record<string, number>
  last_completed_at: string | null
  prospects_on_file: number
  contact_queue?: number
  mapped: number
}

const JOB_STATES = ["queued", "running", "completed", "failed"] as const

export function RigPanel() {
  const [rig, setRig] = useState<RigData | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch("/data/housecalls-rig.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setRig)
      .catch(() => setFailed(true))
  }, [])

  return (
    <div className="panel">
      <div className="panel-face">
        <div className="panel-bar">
          <b>The rig</b>
          <span>{rig ? `read ${timeAgo(rig.generated)}` : failed ? "telemetry unavailable" : "reading…"}</span>
        </div>
        {rig ? (
          <table className="readout">
            <tbody>
              <tr>
                <td>Harvest jobs</td>
                <td className="num">{rig.jobs.total}</td>
              </tr>
              {JOB_STATES.filter((s) => (rig.jobs[s] ?? 0) > 0).map((s) => (
                <tr key={s}>
                  <td>
                    {" "}
                    {s}
                    {s === "failed" ? (
                      <>
                        {" "}
                        <span className="tag warn">attention</span>
                      </>
                    ) : null}
                  </td>
                  <td className="num">{rig.jobs[s]}</td>
                </tr>
              ))}
              <tr>
                <td>Prospects on file</td>
                <td className="num">{rig.prospects_on_file}</td>
              </tr>
              {typeof rig.contact_queue === "number" ? (
                <tr>
                  <td>Awaiting contact discovery</td>
                  <td className="num">{rig.contact_queue}</td>
                </tr>
              ) : null}
              <tr>
                <td>On the map</td>
                <td className="num">{rig.mapped}</td>
              </tr>
              <tr>
                <td>Last completed harvest</td>
                <td className="num">{rig.last_completed_at ? timeAgo(rig.last_completed_at) : "none yet"}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="beta-chart__note">
            {failed
              ? "The telemetry file is not answering. The rig may still be fine; the wire is not."
              : "Reading the rig…"}
          </p>
        )}
      </div>
    </div>
  )
}
