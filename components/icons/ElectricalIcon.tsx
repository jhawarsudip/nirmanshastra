import { motion } from 'framer-motion'

export function ElectricalIcon({ size = 48, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Conduit line */}
      <line x1="4" y1="28" x2="20" y2="28" stroke="#D99A06" strokeWidth="2" strokeLinecap="square" vectorEffect="non-scaling-stroke" />
      {/* Conduit end cap */}
      <line x1="4" y1="23" x2="4" y2="33" stroke="#D99A06" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {/* Lightning bolt — double-flicker on hover */}
      <motion.polyline
        points="32,7 22,28 31,28 23,44"
        stroke="#D99A06"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        animate={{ opacity: animated ? [1, 0.08, 0.9, 0.08, 1] : 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </svg>
  )
}
