"use client"

import * as LucideIcons from "lucide-react"
import { clsx } from "clsx"
import { AnimatedSection } from "@/components/ui/AnimatedSection"

type IconName = keyof typeof LucideIcons

interface PageHeaderProps {
  icon: IconName
  title: string
  status: "production" | "development" | "planned"
  tagline: string
}

const statusConfig = {
  production: { label: "Production", color: "bg-sf-success text-white" },
  development: { label: "In Development", color: "bg-sf-warning text-white" },
  planned: { label: "Planned", color: "bg-sf-muted text-white" },
}

export function PageHeader({ icon, title, status, tagline }: PageHeaderProps) {
  const IconComponent = LucideIcons[icon] as React.ComponentType<{ className?: string }>
  const statusInfo = statusConfig[status]

  return (
    <AnimatedSection className="container-page py-12">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4">
          {IconComponent && (
            <div className="p-3 bg-sf-orange/10 rounded-xl border border-sf-orange/20">
              <IconComponent className="w-8 h-8 text-sf-orange" />
            </div>
          )}
          <h1 className="font-display text-3xl md:text-4xl font-bold text-sf-white">
            {title}
          </h1>
        </div>
        <span
          className={clsx(
            "px-3 py-1 text-sm font-medium rounded-full w-fit",
            statusInfo.color
          )}
        >
          {statusInfo.label}
        </span>
      </div>
      <p className="text-lg md:text-xl text-sf-steel max-w-3xl">
        {tagline}
      </p>
    </AnimatedSection>
  )
}
