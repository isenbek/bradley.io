// The bio·mark vector x-ray is a fully self-contained interactive HTML doc
// (embedded geometry, vanilla JS + inline SVG). Serve it as a static asset and
// embed it full-bleed — it's self-branded, so the site nav/footer are chrome
// enough. Lives at /bio-mark.html in public/.
export default function BioMarkPage() {
  return (
    <div className="v3-embed-stage">
      <iframe
        src="/bio-mark.html"
        title="The bio mark — chords, offsets & the implied infinity (interactive vector x-ray)"
        className="v3-embed-stage__frame"
      />
    </div>
  )
}
