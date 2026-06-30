// Small framework-free geo helpers for the maps (no turf dependency).

const R = 6371000 // earth radius, metres

// Great-circle destination from (lat,lon) at a compass bearing + distance.
export function destPoint(lat: number, lon: number, bearingDeg: number, distM: number): [number, number] {
  const d = distM / R
  const br = (bearingDeg * Math.PI) / 180
  const f1 = (lat * Math.PI) / 180
  const l1 = (lon * Math.PI) / 180
  const f2 = Math.asin(Math.sin(f1) * Math.cos(d) + Math.cos(f1) * Math.sin(d) * Math.cos(br))
  const l2 = l1 + Math.atan2(Math.sin(br) * Math.sin(d) * Math.cos(f1), Math.cos(d) - Math.sin(f1) * Math.sin(f2))
  return [(l2 * 180) / Math.PI, (f2 * 180) / Math.PI]
}

// Haversine distance in metres between two [lon,lat] points.
export function distanceM(a: [number, number], b: [number, number]): number {
  const f1 = (a[1] * Math.PI) / 180
  const f2 = (b[1] * Math.PI) / 180
  const df = ((b[1] - a[1]) * Math.PI) / 180
  const dl = ((b[0] - a[0]) * Math.PI) / 180
  const h = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

// A geographic circle polygon (so it scales with zoom, unlike a pixel-radius
// circle layer) — used to draw a geolocation accuracy halo.
export function circlePolygon(lon: number, lat: number, radiusM: number, steps = 64): GeoJSON.Feature {
  const coords: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    coords.push(destPoint(lat, lon, (i / steps) * 360, radiusM))
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coords] } }
}

// Human distance string.
export function fmtDistance(m: number): string {
  if (m < 1000) return `${m.toFixed(0)} m`
  return `${(m / 1000).toFixed(m < 10000 ? 2 : 1)} km`
}
