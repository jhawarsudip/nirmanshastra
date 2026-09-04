import { motion } from 'framer-motion'

export function BillingIcon({ size = 48, animated = false }: { size?: number; animated?: boolean }) {
  const lineProps = (delay: number) => ({
    animate: { opacity: animated ? [1, 0.25, 1] : (1 as number | number[]) },
    transition: { duration: 0.45, ease: 'easeOut' as const, delay },
  })

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Running-account bill sheet outline */}
      <rect x="10" y="6" width="28" height="36" stroke="#1F4E79" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {/* BOQ line items — staggered opacity pulse on hover */}
      <motion.line x1="15" y1="15" x2="33" y2="15" stroke="#1F4E79" strokeWidth="1.5" vectorEffect="non-scaling-stroke" {...lineProps(0)} />
      <motion.line x1="15" y1="21" x2="33" y2="21" stroke="#1F4E79" strokeWidth="1.5" vectorEffect="non-scaling-stroke" {...lineProps(0.06)} />
      <motion.line x1="15" y1="27" x2="27" y2="27" stroke="#1F4E79" strokeWidth="1.5" vectorEffect="non-scaling-stroke" {...lineProps(0.12)} />
      {/* Net-payable rule + total */}
      <line x1="15" y1="33" x2="33" y2="33" stroke="#1F4E79" strokeWidth="1" vectorEffect="non-scaling-stroke" opacity="0.5" />
      <text x="24" y="39.5" fontSize="8" fill="#1F4E79" fontFamily="monospace" opacity="0.85" textAnchor="middle">₹</text>
    </svg>
  )
}
