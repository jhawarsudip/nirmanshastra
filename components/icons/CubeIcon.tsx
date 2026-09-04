import { motion } from 'framer-motion'

export function CubeIcon({ size = 48, animated = false }: { size?: number; animated?: boolean }) {
  const faceProps = (delay: number) => ({
    animate: { opacity: animated ? [1, 0.35, 1] : (1 as number | number[]) },
    transition: { duration: 0.45, ease: 'easeOut' as const, delay },
  })

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Isometric test cube — top face */}
      <motion.polygon points="24,7 39,15.5 24,24 9,15.5" stroke="#1F4E79" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" {...faceProps(0)} />
      {/* Left face */}
      <motion.polygon points="9,15.5 24,24 24,41 9,32.5" stroke="#1F4E79" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" {...faceProps(0.08)} />
      {/* Right face */}
      <motion.polygon points="39,15.5 24,24 24,41 39,32.5" stroke="#1F4E79" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" {...faceProps(0.16)} />
      {/* 150mm gauge tick on the top edge */}
      <text x="24" y="19.5" fontSize="6" fill="#1F4E79" fontFamily="monospace" opacity="0.75" textAnchor="middle">150</text>
    </svg>
  )
}
