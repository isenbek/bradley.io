"use client"

import { ReactNode } from "react"
import { Info, AlertTriangle, Lightbulb, CheckCircle } from "lucide-react"
import { clsx } from "clsx"
import { AnimatedSection } from "@/components/ui/AnimatedSection"

type CalloutType = "info" | "warning" | "tip" | "success"

interface CalloutBoxProps {
  type: CalloutType
  title?: string
  children: ReactNode
}

const typeConfig = {
  info: {
    icon: Info,
    bgColor: "bg-sf-info/10",
    borderColor: "border-sf-info",
    iconColor: "text-sf-info",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-sf-warning/10",
    borderColor: "border-sf-warning",
    iconColor: "text-sf-warning",
  },
  tip: {
    icon: Lightbulb,
    bgColor: "bg-sf-cyan/10",
    borderColor: "border-sf-cyan",
    iconColor: "text-sf-cyan",
  },
  success: {
    icon: CheckCircle,
    bgColor: "bg-sf-success/10",
    borderColor: "border-sf-success",
    iconColor: "text-sf-success",
  },
}

export function CalloutBox({ type, title, children }: CalloutBoxProps) {
  const config = typeConfig[type]
  const IconComponent = config.icon

  return (
    <AnimatedSection className="container-page py-4">
      <div
        className={clsx(
          "rounded-xl p-6 border-l-4",
          config.bgColor,
          config.borderColor
        )}
      >
        <div className="flex items-start gap-4">
          <IconComponent className={clsx("w-6 h-6 shrink-0 mt-0.5", config.iconColor)} />
          <div className="flex-1">
            {title && (
              <h4 className="font-display font-bold text-sf-white mb-2">{title}</h4>
            )}
            <div className="text-sf-steel [&>p]:mb-0">{children}</div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}
