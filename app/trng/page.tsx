import { TrngBoard } from "@/components/trng/TrngBoard"
import { PageHead, Section } from "@/components/page"

export default function TrngPage() {
  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: "Hotbits" }]}
        title="Random, from radioactive decay"
        lede={
          <>
            A Geiger counter, a Raspberry Pi, and a simple comparison. Each click is an atom
            decaying. The Pi times the gap between two clicks, then the next gap. If the first gap
            is shorter, the bit is a one. If the second is shorter, it is a zero. Equal gaps are
            thrown away.
          </>
        }
      />

      <Section>
        <p>
          No formula makes up a number here. Comparing two gaps cancels out any lean in the
          hardware by itself, with no correction applied afterwards. That is why the raw stream is
          worth measuring at all. Everything below is that measurement, taken around the clock and
          never smoothed.
        </p>
        <p>
          The same bits, drawn:{" "}
          <a href="https://tinymachines.ai/hotbits/space">the entropy views</a> live on
          tinymachines.ai, beside the instrument itself.
        </p>
      </Section>

      <TrngBoard />
    </div>
  )
}
