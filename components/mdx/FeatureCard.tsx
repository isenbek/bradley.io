"use client"

import * as LucideIcons from "lucide-react"
import { AnimatedSection } from "@/components/ui/AnimatedSection"
import { ReactNode } from "react"

type IconName = keyof typeof LucideIcons

interface FeatureCardProps {
  icon: IconName
  title: string
  description: string
  children?: ReactNode
}

export function FeatureCard({ icon, title, description, children }: FeatureCardProps) {
  const IconComponent = LucideIcons[icon] as React.ComponentType<{ className?: string }>

  return (
    <AnimatedSection className="bg-sf-dark-alt rounded-xl p-6 shadow-sm border border-sf-steel/15 hover:border-sf-orange/30 hover:shadow-lg transition-all">
      <div className="flex items-start gap-4">
        {IconComponent && (
          <div className="p-2 bg-sf-orange/10 rounded-lg shrink-0 border border-sf-orange/20">
            <IconComponent className="w-6 h-6 text-sf-orange" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold text-sf-white mb-2">
            {title}
          </h3>
          <p className="text-sf-muted leading-relaxed">
            {description}
          </p>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </AnimatedSection>
  )
}

interface FeatureGridProps {
  children: ReactNode
}

export function FeatureGrid({ children }: FeatureGridProps) {
  return (
    <div className="container-page py-8">
      <div className="grid md:grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  )
}
