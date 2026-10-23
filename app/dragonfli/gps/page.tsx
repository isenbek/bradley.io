import { V3Gps } from "./V3Gps"
import { PageHead } from "@/components/page"

export default function Page() {
  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: "Dragonfli", href: "/dragonfli" }, { label: "GPS" }]}
        title="The receiver's own fix"
        lede={
          <>
            Where the antenna thinks it is, and which satellites it is using to decide. A skyplot of the constellation overhead.
          </>
        }
      />

      <V3Gps />
    </div>
  )
}
