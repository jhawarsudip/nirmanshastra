import { motion } from 'framer-motion'

export function StructureIcon({ size = 48, animated = false }: { size?: number; animated?: boolean }) {
  const dotProps = (delay: number) => ({
    animate: { opacity: animated ? [1, 0.25, 1] : (1 as number | number[]) },
    transition: { duration: 0.45, ease: 'easeOut' as const, delay },
  })

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Column cross-section outline */}
      <rect x="8" y="8" width="32" height="32" stroke="#1F4E79" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {/* Corner rebar dots — staggered opacity pulse on hover */}
      <motion.circle cx="13" cy="13" r="3" fill="#1F4E79" {...dotProps(0)} />
      <motion.circle cx="35" cy="13" r="3" fill="#1F4E79" {...dotProps(0.06)} />
      <motion.circle cx="13" cy="35" r="3" fill="#1F4E79" {...dotProps(0.12)} />
      <motion.circle cx="35" cy="35" r="3" fill="#1F4E79" {...dotProps(0.18)} />
      {/* Column grid label */}
      <text x="20" y="29" fontSize="8" fill="#1F4E79" fontFamily="monospace" opacity="0.7">C1</text>
    </svg>
  )
}
