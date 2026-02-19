"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AnimatedSection } from "@/components/ui/AnimatedSection"

interface NavItem {
  href: string
  title: string
}

interface PageNavProps {
  prev?: NavItem
  next?: NavItem
}

export function PageNav({ prev, next }: PageNavProps) {
  return (
    <AnimatedSection className="container-page py-12 border-t border-sf-steel/15 mt-12">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {prev ? (
          <Link
            href={prev.href}
            className="group flex items-center gap-2 p-4 rounded-xl border border-sf-steel/15 hover:border-sf-orange/30 hover:bg-sf-orange/5 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-sf-steel group-hover:text-sf-orange transition-colors" />
            <div className="text-left">
              <div className="text-sm text-sf-muted">Previous</div>
              <div className="font-display font-bold text-sf-white">{prev.title}</div>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={next.href}
            className="group flex items-center gap-2 p-4 rounded-xl border border-sf-steel/15 hover:border-sf-cyan/30 hover:bg-sf-cyan/5 transition-colors sm:text-right"
          >
            <div className="flex-1">
              <div className="text-sm text-sf-muted">Next</div>
              <div className="font-display font-bold text-sf-cyan">{next.title}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-sf-steel group-hover:text-sf-cyan transition-colors" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </AnimatedSection>
  )
}
