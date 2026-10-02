import Link from "next/link"
import { loadTerminalData } from "./load"
import { RunWord } from "./RunWord"
import { V3Terminal } from "./V3Terminal"

/* The stats and the org counts are read from files the pipelines rewrite
   between deploys, so the page is rebuilt hourly like /work. */
export const revalidate = 3600

export default async function TerminalPage() {
  const data = await loadTerminalData()

  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <span aria-current="page">Terminal</span>
          </span>
        </nav>
        <h1>The site, as a shell</h1>
      </div>

      <p className="lede">
        Everything on this site, reachable by typing. Start with <RunWord c="help" />.
      </p>

      {/* PERMANENT ISLAND, decided 2026-08-30.
          Every other instrument was ported to the kit; this one is not going to
          be. A terminal that adopts the page's serif prose and paper ground
          stops reading as a terminal, and reading as a terminal is the entire
          job of this component. The seam here is the design, not unfinished
          work. Its styles live in app/terminal.css, loaded by this route's
          layout and nowhere else. */}
      <div className="term-island">
        <V3Terminal data={data} />
      </div>

      {/* Paper: a person wrote this, about the machine above it. */}
      <div className="prose beta-sec">
        <h2>What is real in there</h2>
        <p>
          All of it. <RunWord c="now" /> and <RunWord c="ping" /> ask this server what its instruments are
          doing at the moment you press Enter, and an instrument that is switched off is printed as
          offline. <RunWord c="stats" />, <RunWord c="work" /> and <RunWord c="uptime" /> read the same files
          as the pages they summarise. <RunWord c="wopr" /> dials a real server on this machine, a
          homage to <i>WarGames</i>{" "}that was added the day after this site&rsquo;s first commit, in
          August 2025: its set pieces are scripted and the rest is answered by a language model
          running here, not in a cloud. When that server is down the command says so and stops.{" "}
          <RunWord c="matrix" /> is just for fun.
        </p>
      </div>
    </div>
  )
}
