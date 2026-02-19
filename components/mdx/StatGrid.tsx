"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import * as LucideIcons from "lucide-react"

type IconName = keyof typeof LucideIcons

interface Stat {
  value: string
  label: string
  icon?: IconName
}

interface StatGridProps {
  stats: Stat[]
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { y: 20 },
  visible: { y: 0 },
}

export function StatGrid({ stats }: StatGridProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "0px 0px 100px 0px" })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
      className="container-page py-8"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
            ? (LucideIcons[stat.icon] as React.ComponentType<{ className?: string }>)
            : null

          return (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-sf-dark-alt rounded-xl p-6 shadow-sm border border-sf-steel/15 text-center"
            >
              {IconComponent && (
                <IconComponent className="w-6 h-6 text-sf-orange mx-auto mb-2" />
              )}
              <div className="text-stat text-sf-orange">{stat.value}</div>
              <div className="text-sm font-medium text-sf-muted mt-1">
                {stat.label}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
