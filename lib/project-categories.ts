export type CategoryId = "hardware" | "ai-ml" | "data" | "systems" | "creative"

export interface ProjectCategory {
  id: CategoryId
  label: string
  color: string
  icon: string
}

export const categories: ProjectCategory[] = [
  { id: "hardware", label: "Hardware & Edge", color: "var(--brand-primary)", icon: "Cpu" },
  { id: "ai-ml", label: "AI & Language", color: "var(--brand-secondary)", icon: "Brain" },
  { id: "data", label: "Data Engineering", color: "var(--brand-info)", icon: "Database" },
  { id: "systems", label: "Systems & Infra", color: "var(--brand-steel)", icon: "Server" },
  { id: "creative", label: "Creative & Research", color: "var(--brand-warning)", icon: "Lightbulb" },
]

export const categoryMap = Object.fromEntries(
  categories.map((c) => [c.id, c])
) as Record<CategoryId, ProjectCategory>
