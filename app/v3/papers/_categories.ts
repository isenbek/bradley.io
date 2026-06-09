export type PaperCatId =
  | "seismology"
  | "space-weather"
  | "climate"
  | "cross-domain"
  | "radiation"
  | "hydrology"
  | "research"

export const PAPER_CATEGORY: Record<PaperCatId, { label: string; color: string }> = {
  seismology:    { label: "Seismology",    color: "#EE766C" }, // coral
  "space-weather": { label: "Space Weather", color: "#13B8F3" }, // bio blue
  climate:       { label: "Climate",       color: "#169E73" }, // green
  "cross-domain": { label: "Cross-Domain", color: "#EDB427" }, // gold
  radiation:     { label: "Radiation",     color: "#A855F7" }, // violet
  hydrology:     { label: "Hydrology",     color: "#0A96C7" }, // deep blue
  research:      { label: "Research",      color: "#6B6B62" }, // slate
}
