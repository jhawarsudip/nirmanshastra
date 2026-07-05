import React from 'react'
import { motion } from 'framer-motion'

export function InteriorIcon({ size = 48, animated = false }: { size?: number; animated?: boolean }) {
  const tiles: React.ReactElement[] = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const delay = (row * 3 + col) * 0.03
      tiles.push(
        <motion.rect
          key={`${row}-${col}`}
          x={4 + col * 14}
          y={4 + row * 14}
          width={12}
          height={12}
          stroke="#B08968"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
          animate={{ opacity: animated ? [0.6, 1] : 1 }}
          transition={{ duration: 0.28, ease: 'easeOut', delay: animated ? delay : 0 }}
        />
      )
    }
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {tiles}
    </svg>
  )
}
