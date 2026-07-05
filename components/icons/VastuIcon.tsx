import { motion } from 'framer-motion'

export function VastuIcon({ size = 48, animated = false }: { size?: number; animated?: boolean }) {
  const cx = 24, cy = 24, rOuter = 20, rInner = 6
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={rOuter} stroke="#C9A84C" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      {/* Inner hub */}
      <circle cx={cx} cy={cy} r={rInner} stroke="#C9A84C" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {/* 8 cardinal + intercardinal spokes */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 - 90) * Math.PI / 180
        return (
          <line
            key={i}
            x1={parseFloat((cx + rInner * Math.cos(a)).toFixed(2))}
            y1={parseFloat((cy + rInner * Math.sin(a)).toFixed(2))}
            x2={parseFloat((cx + rOuter * Math.cos(a)).toFixed(2))}
            y2={parseFloat((cy + rOuter * Math.sin(a)).toFixed(2))}
            stroke="#C9A84C"
            strokeWidth={i === 0 ? 1.8 : 1}
            vectorEffect="non-scaling-stroke"
          />
        )
      })}
      {/* North pointer — rises slightly on hover like a compass finding north */}
      <motion.polygon
        points={`${cx},2 ${cx - 3},9 ${cx + 3},9`}
        fill="#C9A84C"
        animate={{ y: animated ? [0, -2.5, 0] : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </svg>
  )
}
