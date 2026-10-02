import Link from "next/link"
import buildInfo from "@/lib/build-info.json"
import { longDate, type PilotData } from "@/app/_pilot-data"
import { LiveDot } from "@/components/live/LiveDot"
import type { NowSnapshot } from "@/components/live/types"
import { SIGNED_ON } from "./content"

/**
 * "How this site is built": the working partnership, stated plainly.
 *
 * The owner's words for it were "this website is our website, you and me",
 * and the original site had a "Claude as Co-Developer" section whose one
 * sentence of copy was "Claude is used as a collaborative development
 * partner, not just a code completion tool" (63d43d0:app/page.tsx). That
 * phrase is reused below. The rest is kept to what can be checked:
 *
 *   who does what       CLAUDE.md (the deploy path, "the user verifies on the
 *                       live site") and the session record at /ai-pilot.
 *                       "Writes most of the code" points at that record and
 *                       not at git: every commit here is authored under one
 *                       identity, so the repository cannot show it.
 *   the pipelines       Claude writes and maintains them; cron runs them (the
 *                       panel beside this block says "regenerated every 4
 *                       hours", which is that timer). The list says exactly
 *                       that and not "runs the pipelines".
 *   sessions, models,   public/data/ai-pilot-data.json: license.totalSessions,
 *   the period          license.modelCount, coverage.since and .through. That
 *                       record is every project on this machine, not this site
 *                       alone, and the sentence says so. It is complete only
 *                       from coverage.recordingBegan (the months before hold
 *                       just the logs still on disk that day, and subagent
 *                       logs are never counted), so the count is "at least",
 *                       and the sentence names the date it becomes complete.
 *   the version number  lib/build-info.json. deploy.sh bumps the patch version
 *                       once per run, before the build, so v1.0.N is the Nth
 *                       RUN of the deploy script. A run whose build failed
 *                       still used a number, so it is not called a count of
 *                       deploys.
 *   the two rules       The first is scoped to numbers a pipeline counted,
 *                       because the prose above it carries his own numbers
 *                       (60 Raspberry Pis, 4.9 billion data points) with no
 *                       chip; a reader can check it on this page, where every
 *                       panel carries its file and period. The second is
 *                       stated as the practice and nothing more: a reader
 *                       cannot see a review, so no anecdote about one is told.
 *
 * Every number is read at render, so the block cannot go stale by itself. If
 * the data file ever lacks a period, the sentence drops the dates instead of
 * inventing them.
 *
 * THE SIGNATURE IS GATED. See SIGNED_ON in ./content.ts: the "Signed" row is
 * rendered only once he has read the block and a date is set there.
 *
 * On paper, because it is two people saying something. The panel beside it
 * (under it on a narrow screen) is passed in by the page: the site index, which
 * is the machine's side of the same statement. The one live thing in it is the
 * dot under Claude's name, which is lit only while a Claude Code session is
 * known to be writing on this host (components/live/LiveDot.tsx). It starts
 * from the server's snapshot, so if /api/now never answers it still settles
 * on "no activity seen" by the browser's clock instead of "checking" for ever.
 */

const nf = (n: number) => n.toLocaleString("en-US")

export function Built({
  pilot,
  receipts,
  initial,
}: {
  pilot: PilotData
  /** The panel that backs the statement: the site index and its chip. */
  receipts: React.ReactNode
  /** The server's /api/now snapshot (peekNow), for the dot under Claude's name. */
  initial?: NowSnapshot | null
}) {
  const since = longDate(pilot.coverage?.since)
  const through = longDate(pilot.coverage?.through)
  const began = longDate(pilot.coverage?.recordingBegan)
  const run = /^v?\d+\.\d+\.(\d+)$/.exec(buildInfo.version)?.[1] ?? null
  const signed = longDate(SIGNED_ON)

  return (
    <section className="beta-about-built" aria-labelledby="about-built">
      <div className="prose beta-sec">
        <h2 id="about-built">How this site is built</h2>
      </div>

      <div className="beta-about-built__cols">
        <div className="beta-about-built__said">
          <div className="prose">
            <p>Two of us build this site, and the split is plain.</p>
          </div>

          <div className="beta-about-pair">
            <div className="rail">
              <h3>Bradley Isenbek</h3>
              <p className="beta-about-pair__sub">Grand Rapids, Michigan</p>
              <ul className="beta-about-does">
                <li>Decides what gets built</li>
                <li>Checks the result on the live site</li>
                <li>Puts his name on what goes out</li>
              </ul>
            </div>
            <div className="rail">
              <h3>Claude</h3>
              <p className="beta-about-pair__sub">
                <LiveDot label initial={initial} />
              </p>
              <ul className="beta-about-does">
                <li>
                  Writes most of the code, in sessions logged at{" "}
                  <Link href="/ai-pilot">/ai-pilot</Link>
                </li>
                <li>Writes and maintains the data pipelines, which run on a timer</li>
                <li>Runs the deploys</li>
              </ul>
            </div>
          </div>

          <div className="prose">
            <p>
              Claude is Anthropic&apos;s model, working here as Claude Code: a collaborative
              development partner, not just a code completion tool. The sessions are counted in
              public. <Link href="/ai-pilot">The AI pilot record</Link> shows{" "}
              {began ? "at least " : ""}
              {nf(pilot.license.totalSessions)} of them on {nf(pilot.license.modelCount)} models
              {since && through ? `, from ${since} through ${through}` : ""}, across every project
              on this machine and not this site alone
              {began ? `. Recording began on ${began}, so the months before it are incomplete` : ""}
              .
              {run
                ? ` The version in the footer counts runs of the deploy script: this is number ${nf(Number(run))}.`
                : ""}
            </p>
            <p>
              Two rules keep it honest. A number a pipeline counted does not appear without the
              file it came from and the period it covers. And work is reviewed adversarially before
              it ships: a second pass reads it with one job, to find what is wrong.
            </p>
          </div>

          {signed ? (
            <p className="beta-about-sig">
              <span className="beta-about-sig__label">Signed {signed}</span>
              <b>Bradley Isenbek</b>
              <b>Claude</b>
            </p>
          ) : null}
        </div>

        <div className="beta-about-built__receipts">{receipts}</div>
      </div>
    </section>
  )
}
