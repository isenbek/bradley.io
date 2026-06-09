import type { CategoryId } from "@/lib/project-categories"

/**
 * V3 category palette — maps the existing CategoryId values to Bio Blue
 * accent colors. Hex (not CSS vars) so it works inside style props and OG
 * cards alike.
 */
export const V3_CATEGORY: Record<
  CategoryId,
  { label: string; color: string; ink: string }
> = {
  hardware:  { label: "Hardware & Edge",     color: "#EE766C", ink: "#7A2A22" }, // coral
  "ai-ml":   { label: "AI & Language",       color: "#A855F7", ink: "#5B21B6" }, // violet
  data:      { label: "Data Engineering",    color: "#13B8F3", ink: "#065673" }, // bio blue
  systems:   { label: "Systems & Infra",     color: "#169E73", ink: "#0F7355" }, // green
  creative:  { label: "Creative & Research", color: "#EDB427", ink: "#7C5605" }, // gold
}
