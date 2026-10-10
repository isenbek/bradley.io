import Link from "next/link"
import { ComputerTree } from "@/components/computer-tree/ComputerTree"
import { externalRel } from "@/lib/external-rel"
import { computerTree } from "@/lib/computer-tree"

/**
 * The Computer Tree.
 *
 * SOURCE. public/computer-tree/: the dataset and its data card (version 1.0,
 * 2026-10-05), published beside the page so a reader can take it away. The
 * card's one change for the web: its author line no longer carries an email
 * address.
 *
 * WHAT THE PAGE CLAIMS. Only what the data card states or what the data
 * computes. Its two weaknesses (79% of the 1961 links are estimated; the
 * biggest 1961 hubs are partly a transcription artifact) are on the page in the
 * card's own terms, because a lineage chart that looks certain is the easiest
 * kind of chart to over-read.
 *
 * GROUNDS. Prose and the table of machines are documentation, on paper. The
 * tree is laid out by lib/computer-tree.ts, so it is a panel.
 */

const FILES = [
  { href: "/computer-tree/DATACARD.md", name: "DATACARD.md", what: "Sources, schema, distribution, limitations" },
  { href: "/computer-tree/nodes.csv", name: "nodes.csv", what: "One row per machine" },
  { href: "/computer-tree/edges.csv", name: "edges.csv", what: "One row per link, parent to child" },
  { href: "/computer-tree/computer_tree.json", name: "computer_tree.json", what: "Both, shaped for D3" },
]

export default function ComputerTreePage() {
  const data = computerTree()
  const { nodes, links } = data
  const chart = nodes.filter((n) => n.chart).length
  const cross = links.filter((l) => !l.primary).length
  const est = (layer: boolean) => {
    const ls = links.filter((l) => nodes[l.t].chart === layer)
    return Math.round((100 * ls.filter((l) => !l.firm).length) / ls.length)
  }
  const byRing = [...new Set(nodes.map((n) => n.ring))].sort((a, b) => a - b)

  return (
    <div className="page">
      <div className="page-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">bradley.io</Link>
          <span>
            {" / "}
            <Link href="/projects">Projects</Link>
          </span>
          <span>
            {" / "}
            <span aria-current="page">The Computer Tree</span>
          </span>
        </nav>
        <h1>The Computer Tree</h1>
      </div>

      <p className="lede">
        In 1961 the US Army drew the family tree of the electronic computer: ENIAC at the trunk,
        every machine built since hanging off a limb, rings at 1950, 1955 and 1960. This is that
        chart, transcribed, and grown one ring per decade to 2025. {nodes.length} machines,{" "}
        {links.length} links. Pick any machine and the tree draws its line back to the root.
      </p>

      <ComputerTree data={data} />

      <div className="prose beta-sec">
        <h2>How to read it</h2>
        <p>
          Every dot is a machine, a processor or a system, and its ring is the period it arrived in.
          The inner three rings are the 1961 chart&apos;s own; past them there is one ring per
          decade, and the outermost holds 2021 to 2025. Teal dots ({chart}) were transcribed from
          the 1961 chart; orange dots ({nodes.length - chart}) were added after it. A machine sits
          under its primary parent, the one the data names first. {cross} machines have a second
          parent as well; switch on <b>Cross-links</b> to see them, and watch the late rings, where
          long-running lines converge on shared processors.
        </p>
        <p>
          The tree has eight roots. ENIAC is the 1961 chart&apos;s. The other seven start families
          that descend from nothing on that chart: the HP 2116A, the Datapoint 2200, the Intel
          4004, ATI Radeon, the NVIDIA GeForce 256, Google&apos;s first TPU and the Sunway
          TaihuLight. ENIAC still reaches 458 of the {nodes.length} by some path. The longest line
          on the tree is the one it opens on: 26 machines from ENIAC to Fugaku, through SEAC, the
          SDS 940, the Xerox Alto and a run of Sun and Fujitsu SPARC machines.
        </p>
      </div>

      <div className="prose beta-sec">
        <h2>What it cannot carry</h2>
        <p>
          <b>The 1961 links are shaky.</b> The source was a low-resolution scan. Most labels are
          legible, but many branch attachments in the dense middle are not, so {est(true)}% of the
          1961 links are estimates. They are dashed. The links added since are {100 - est(false)}%
          firm. Read a dashed 1950s attachment as &ldquo;same region of the chart&rdquo;, not as
          proven ancestry. The big early lines, IAS to the IBM 701, 704, 709 and 7090, and ERA to
          the UNIVAC 1101 and 1103, are solid.
        </p>
        <p>
          <b>Some 1961 hubs are inflated.</b> LOGISTICS and RASTAC show the most children on the
          chart partly because unreadable twigs were attached to the nearest legible branch. Any
          centrality measure over the 1950s will over-rank them. IAS and the Arm Cortex-A57 are
          real hubs.
        </p>
        <p>
          Past 1960 the tree follows major lineages, not every product: Soviet and Eastern Bloc
          machines, most Japanese mainframes, SGI and MIPS, the Amiga and Atari, and early game
          consoles are among the gaps. Dates are first delivery or introduction and can differ by
          a year from other references. Check a 1950s date or ancestry against a primary source
          before citing it.
        </p>
      </div>

      <div className="prose beta-sec">
        <h2>The data</h2>
        <p>
          The dataset is a directed acyclic graph: every parent exists, there are no cycles, and no
          parent is dated more than a year after its child. Take it with you; the data card has
          the schema, the counts and how to add a decade.
        </p>
        <p>
          The tree also stands on{" "}
          <a href="https://tinymachines.ai/computer-tree" rel={externalRel("https://tinymachines.ai/computer-tree")}>
            tinymachines.ai
          </a>
          , in English and{" "}
          <a href="https://tinymachines.ai/ja/computer-tree" rel={externalRel("https://tinymachines.ai/ja/computer-tree")} hrefLang="ja">
            Japanese
          </a>
          , drawn from this same dataset.
        </p>
      </div>
      <div className="ledger beta-sec">
        <div className="scroller" tabIndex={0} role="region" aria-label="The dataset's files">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>What it holds</th>
              </tr>
            </thead>
            <tbody>
              {FILES.map((f) => (
                <tr key={f.name}>
                  <td className="name">
                    <a href={f.href} download>
                      {f.name}
                    </a>
                  </td>
                  <td>{f.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <details className="beta-sec beta-ctree-all">
        <summary>Every machine, ring by ring ({nodes.length})</summary>
        <div className="ledger">
          <div className="scroller" tabIndex={0} role="region" aria-label="Every machine on the tree">
            <table>
              <thead>
                <tr>
                  <th>Machine</th>
                  <th className="num">Year</th>
                  <th>Maker</th>
                  <th>Descends from</th>
                </tr>
              </thead>
              {byRing.map((ring, ri) => (
                <tbody key={ring}>
                  <tr>
                    <th colSpan={4} scope="rowgroup">
                      {ri === 0 ? "ENIAC" : ring === 2030 ? "2021 to 2025" : `${byRing[ri - 1] + 1} to ${ring}`}
                    </th>
                  </tr>
                  {nodes
                    .filter((n) => n.ring === ring)
                    .map((n) => (
                      <tr key={n.id}>
                        <td className="name">{n.label}</td>
                        <td className="num">{n.year ?? ""}</td>
                        <td>{n.maker === "?" ? "" : n.maker}</td>
                        <td>{n.parent === -1 ? "a root" : nodes[n.parent].label}</td>
                      </tr>
                    ))}
                </tbody>
              ))}
            </table>
          </div>
        </div>
      </details>
    </div>
  )
}
