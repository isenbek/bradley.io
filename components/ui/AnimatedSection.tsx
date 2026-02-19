"use client"

import { motion, useInView } from "framer-motion"
import { useRef, ReactNode } from "react"

interface AnimatedSectionProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function AnimatedSection({ children, delay = 0, className }: AnimatedSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "0px 0px 100px 0px" })

  return (
    <motion.div
      ref={ref}
      initial={{ y: 20 }}
      animate={isInView ? { y: 0 } : { y: 20 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
