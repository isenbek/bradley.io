"use client"

import { BarStrip, type ChartTick } from "@/app/_charts"
import { useNow } from "@/components/kit/InstrumentStatus"

/**
 * HourStrips: the record by hour of day, with the present hour marked.
 *
 *   <HourStrips hours={d.hourlyDistribution.hours} zone="America/Detroit" />
 *
 * Two BarStrips over the same 24 buckets: transcript records written in each
 * hour (when the work happens) and sessions started in each hour (when it
 * begins). The first is omitted for a data file too old to carry `records`.
 *
 * THE MARK. The buckets are hours of the day in `zone`, the zone the pipeline
 * bucketed them in, so the bar that means "now" is the hour it is now IN THAT
 * ZONE, wherever the reader is. A reader in Berlin at 21:00 sees the 15:00 bar
 * marked, which is the true statement: this is the hour of the working day
 * the record is in at the moment you are reading it. The reader's own wall
 * clock would point at the wrong bar for everyone outside the zone.
 *
 * It is client-only, as every clock on this site is
 * (components/kit/DeployedAgo.tsx): the server renders the strips with no
 * mark, and an effect adds it after mount and moves it when the hour turns.
 * The mark takes the place of a tick label in a row of fixed height, so
 * nothing shifts when it arrives.
 *
 * PROPS
 *   hours   PilotData["hourlyDistribution"]["hours"]
 *   zone    an IANA zone name. An unknown zone draws the strips unmarked.
 */

interface Hour {
  hour: number
  label: string
  count: number
  records?: number
}

/** The hour of the day, 0 to 23, that `ms` falls in for `zone`. Null if the zone is unknown. */
function hourIn(zone: string, ms: number): number | null {
  try {
    const text = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date(ms))
    const h = Number.parseInt(text, 10)
    return Number.isInteger(h) && h >= 0 && h <= 23 ? h : null
  } catch {
    return null
  }
}

const nf = (n: number) => n.toLocaleString("en-US")

export function HourStrips({ hours, zone }: { hours: Hour[]; zone: string }) {
  // Null on the server and on the first client render. Checked once a minute.
  const now = useNow(60_000)
  const current = now === null ? null : hourIn(zone, now)
  const index = current === null ? -1 : hours.findIndex((h) => h.hour === current)
  const highlight = index >= 0 ? { index, label: "now" } : undefined

  if (!hours.length) return null

  const zoneText = zone.replace(/_/g, " ")
  const ticks: ChartTick[] = hours
    .map((h, i) => ({ at: i, label: h.label, hour: h.hour }))
    .filter((t) => t.hour % 6 === 0)
    .map(({ at, label }) => ({ at, label }))

  const hasRecords = hours.some((h) => typeof h.records === "number")
  const byRecords = hours.reduce((a, b) => ((b.records ?? 0) > (a.records ?? 0) ? b : a), hours[0])
  const byStarts = hours.reduce((a, b) => (b.count > a.count ? b : a), hours[0])

  return (
    <div className="beta-pilot-pair">
      {hasRecords && (
        <BarStrip
          caption={`Transcript records by hour of day (${zoneText})`}
          summary={`The busiest hour of the day is ${byRecords.label} ${zoneText}, with ${nf(byRecords.records ?? 0)} transcript records over the whole period.`}
          unit="records"
          data={hours.map((h) => ({ label: `${h.label} ${zoneText}`, value: h.records ?? 0 }))}
          ticks={ticks}
          highlight={highlight}
        />
      )}
      <BarStrip
        caption={`Sessions started by hour of day (${zoneText})`}
        summary={`Sessions start most often at ${byStarts.label} ${zoneText}: ${nf(byStarts.count)} of them over the whole period.`}
        unit="sessions"
        data={hours.map((h) => ({ label: `${h.label} ${zoneText}`, value: h.count }))}
        ticks={ticks}
        highlight={highlight}
      />
    </div>
  )
}
