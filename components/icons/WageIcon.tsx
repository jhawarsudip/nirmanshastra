export function WageIcon({ size = 48 }: { size?: number; animated?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Muster-roll / wage register sheet */}
      <rect x="9" y="7" width="26" height="34" rx="1.5" stroke="#1F4E79" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {/* Attendance grid — column rule + tally rows */}
      <line x1="24" y1="7" x2="24" y2="41" stroke="#1F4E79" strokeWidth="1.5" opacity="0.55" vectorEffect="non-scaling-stroke" />
      <line x1="13" y1="14" x2="20" y2="14" stroke="#1F4E79" strokeWidth="1.5" opacity="0.75" vectorEffect="non-scaling-stroke" />
      <line x1="13" y1="20" x2="20" y2="20" stroke="#1F4E79" strokeWidth="1.5" opacity="0.75" vectorEffect="non-scaling-stroke" />
      <line x1="13" y1="26" x2="20" y2="26" stroke="#1F4E79" strokeWidth="1.5" opacity="0.75" vectorEffect="non-scaling-stroke" />
      {/* Rupee mark in the amount column */}
      <text x="29.5" y="26" fontSize="12" fill="#1F4E79" fontFamily="monospace" textAnchor="middle">₹</text>
    </svg>
  )
}
