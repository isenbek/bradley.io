import { readFileSync } from "fs"
import { join } from "path"
import { ogV3ImageResponse, OG_V3_SIZE, OG_V3_CONTENT_TYPE } from "@/lib/og-card-v3"

export const runtime = "nodejs"
export const alt = "Cost analysis: a frozen case study · bio·bradley.io"
export const size = OG_V3_SIZE
export const contentType = OG_V3_CONTENT_TYPE

/**
 * The share card for /cost-analysis. cost-model.json is a FROZEN case study of
 * one fixed window, so the card says so and takes every number from the file.
 *
 * It does not quote the velocity multiplier or the "9 months to 34 days"
 * compression: the page itself says both overstate (they rest on an active-day
 * count that only covers the last third of the window), and a card must not
 * headline what the page declines to. A number missing from the file is left
 * off the card; there are no fallback figures.
 */
interface CostModelForCard {
  frozen?: {
    window?: { start?: string; end?: string }
    coverage?: { commitsInWindow?: number }
  }
  timespan?: { start?: string; end?: string; days?: number }
  actual?: { teamSize?: number; totalCost?: number; repos?: number }
  legacy?: { teamSize?: number; totalCost?: { low?: number; high?: number } }
  comparison?: { costSavingsPercent?: number }
}

function loadModel(): CostModelForCard | null {
  try {
    return JSON.parse(
      readFileSync(join(process.cwd(), "public/data/cost-model.json"), "utf-8")
    ) as CostModelForCard
  } catch {
    return null
  }
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null

/** $60,800 stays exact; $855,000 reads $855K; $1,710,000 reads $1.71M. */
function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`
  if (n >= 100_000) return `$${Math.round(n / 1000)}K`
  return `$${Math.round(n).toLocaleString("en-US")}`
}

export default function OG() {
  const d = loadModel()

  const start = d?.frozen?.window?.start ?? d?.timespan?.start
  const end = d?.frozen?.window?.end ?? d?.timespan?.end
  const windowLabel = start && end ? `${start} to ${end}` : null

  const savings = num(d?.comparison?.costSavingsPercent)
  const actual = num(d?.actual?.totalCost)
  const operators = num(d?.actual?.teamSize)
  const days = num(d?.timespan?.days)
  const repos = num(d?.actual?.repos)
  const commits = num(d?.frozen?.coverage?.commitsInWindow)
  const team = num(d?.legacy?.teamSize)
  const low = num(d?.legacy?.totalCost?.low)
  const high = num(d?.legacy?.totalCost?.high)

  const title =
    savings !== null
      ? `${savings}% lower cost than a modelled team.`
      : "A recorded cost against a modelled team."

  const subtitle =
    actual !== null && operators !== null && team !== null && low !== null && high !== null
      ? `${money(actual)} recorded for ${operators} operator${operators === 1 ? "" : "s"} with AI tooling${
          days !== null ? ` over ${days} days` : ""
        }, against a ${team}-person team modelled at ${money(low)} to ${money(high)}. That team was never hired.`
      : "One column is recorded, the other is a model of a team that was never hired."

  const tags = [
    d?.frozen ? "frozen case study" : null,
    days !== null ? `${days} days` : null,
    repos !== null ? `${repos.toLocaleString("en-US")} project repos` : null,
    commits !== null ? `${commits.toLocaleString("en-US")} commits in window` : null,
  ].filter((t): t is string => t !== null)

  return ogV3ImageResponse({
    eyebrow: windowLabel ? `Case study · ${windowLabel}` : "Cost analysis · case study",
    title,
    subtitle,
    tags,
    accent: "blue",
    cta: "See the numbers →",
  })
}
