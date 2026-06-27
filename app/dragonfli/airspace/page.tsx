import { V3Airspace } from "./V3Airspace"

// Full-bleed: the map IS the page. Title kept for SEO/a11y but visually hidden;
// navigation lives in the fixed global nav + the map's own HUD.
const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
}

export default function V3AirspacePage() {
  return (
    <div className="v3-air-full">
      <h1 style={srOnly}>The sky over Grand Rapids, mapped — live ADS-B airspace</h1>
      <V3Airspace />
    </div>
  )
}
