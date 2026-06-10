export type PaperCatId =
  | "seismology"
  | "space-weather"
  | "climate"
  | "cross-domain"
  | "radiation"
  | "hydrology"
  | "research"

export const PAPER_CATEGORY: Record<
  PaperCatId,
  { label: string; color: string; ink: string }
> = {
  // `color` = bright brand hue used for the v3-study__bar + gradient accents.
  // `ink`   = dark accessible variant for the v3-study__cat text label.
  seismology:      { label: "Seismology",     color: "#EE766C", ink: "#B43A30" }, // coral
  "space-weather": { label: "Space Weather",  color: "#13B8F3", ink: "#08749B" }, // bio blue
  climate:         { label: "Climate",        color: "#169E73", ink: "#0F7355" }, // green
  "cross-domain":  { label: "Cross-Domain",   color: "#EDB427", ink: "#8C6306" }, // gold
  radiation:       { label: "Radiation",      color: "#A855F7", ink: "#7E22CE" }, // violet
  hydrology:       { label: "Hydrology",      color: "#0A96C7", ink: "#08749B" }, // deep blue
  research:        { label: "Research",       color: "#6B6B62", ink: "#4A4A45" }, // slate
}
