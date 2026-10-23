import { BioMarkFrame } from "@/components/kit/BioMarkFrame"
import { PageHead, Section } from "@/components/page"

// The bio·mark vector x-ray is a fully self-contained interactive HTML doc
// (embedded geometry, vanilla JS + inline SVG) served from public/bio-mark.html.
// This page frames it; the tool inside owns its own look.
export default function BioMarkPage() {
  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: "bio mark" }]}
        title="The bio mark, decomposed"
        lede={
          <>
            The bradley.io wordmark as pure geometry: the b/i/o ligature drawn as chords, Bézier offset
            handles, and anchors, with the i-tittle plumb that aligns the dot over the centre crest,
            implying the b to o connection.
          </>
        }
      />

      <Section>
        <p>
          Drag the dot to test the tolerance, morph chords against curves, and watch every
          measurement update live. The same three pieces this tool takes apart are the ones{" "}
          <code>lib/bio-logo-path.ts</code> exports, which is what lets the mark in the masthead
          carry a different colour on its body, its bowl and its dot.
        </p>
      </Section>

      {/* Self-sizing iframe: it grows to its content rather than scrolling
          inside a fixed box, so the tool never ends up with two scrollbars. */}
      <div className="beta-embed">
        <BioMarkFrame />
      </div>
    </div>
  )
}
