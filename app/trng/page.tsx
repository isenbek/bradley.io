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
            A CAJOE Geiger counter, a Raspberry Pi, and a comparison of one gap between decay events
            with the next. If the first is shorter the bit is a one, if the second is shorter it is a
            zero, and equal gaps are thrown away.
          </>
        }
      />

      <Section>
        <p>
          Nothing here generates a number. The bias cancels by symmetry rather than by correction,
          which is why the raw stream is worth measuring at all: everything below is that
          measurement, taken continuously and not smoothed.
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
