"use client"

import React, { useEffect, useState } from "react"

export function MatrixRain({ active }: { active: boolean }) {
  const [columns, setColumns] = useState<React.ReactElement[]>([])
  
  useEffect(() => {
    if (!active) {
      setColumns([])
      return
    }
    
    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const columnCount = Math.floor(window.innerWidth / 20)
    const newColumns = []
    
    for (let i = 0; i < columnCount; i++) {
      const randomChars = Array.from({ length: 30 }, () => 
        chars[Math.floor(Math.random() * chars.length)]
      ).join("")
      
      const delay = Math.random() * 5
      const duration = 5 + Math.random() * 10
      
      newColumns.push(
        <div
          key={i}
          className="matrix-column"
          style={{
            left: `${i * 20}px`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            opacity: Math.random() * 0.5 + 0.5,
          }}
        >
          {randomChars}
        </div>
      )
    }
    
    setColumns(newColumns)
    
    const timer = setTimeout(() => {
      setColumns([])
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [active])
  
  if (!active) return null
  
  return (
    <div className="matrix-rain">
      {columns}
    </div>
  )
}