"use client"

import Link from "next/link"
import { AnimatedSection } from "@/components/ui/AnimatedSection"

const serviceInfo: Record<string, { label: string; href: string }> = {
  "ai-provider": { label: "AI Provider", href: "#platform" },
  "districts": { label: "Districts", href: "#platform" },
  "radio": { label: "Radio Coverage", href: "#platform" },
  "intel": { label: "Intelligence", href: "#platform" },
  "finance": { label: "Financial Pipeline", href: "#platform" },
  "forms": { label: "Form Engine", href: "#platform" },
}

interface IntegrationBadgesProps {
  services: string[]
  title?: string
}

export function IntegrationBadges({ services, title = "Integrates with" }: IntegrationBadgesProps) {
  return (
    <AnimatedSection className="container-page py-8">
      <div className="bg-sf-dark-alt rounded-xl p-6 border border-sf-steel/15">
        <h4 className="text-sm font-medium text-sf-muted mb-4">{title}</h4>
        <div className="flex flex-wrap gap-2">
          {services.map((service) => {
            const info = serviceInfo[service] || { label: service, href: "#" }
            return (
              <Link
                key={service}
                href={info.href}
                className="px-4 py-2 bg-sf-cyan/10 hover:bg-sf-cyan/20 text-sf-cyan font-medium rounded-full text-sm transition-colors border border-sf-cyan/20"
              >
                {info.label}
              </Link>
            )
          })}
        </div>
      </div>
    </AnimatedSection>
  )
}
