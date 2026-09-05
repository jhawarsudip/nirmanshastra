export function EvmIcon({ size = 48 }: { size?: number; animated?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Axes */}
      <line x1="8" y1="8" x2="8" y2="40" stroke="#1F4E79" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <line x1="8" y1="40" x2="42" y2="40" stroke="#1F4E79" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {/* Planned Value S-curve (baseline) */}
      <path d="M8 38 C 18 36, 24 22, 42 12" stroke="#1F4E79" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.5" />
      {/* Earned Value curve — trailing the plan (the SV gap) */}
      <path d="M8 39 C 16 38, 22 30, 34 22" stroke="#1F4E79" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {/* Data point at the cut-off */}
      <circle cx="34" cy="22" r="2.4" fill="#1F4E79" />
      {/* Variance tick between the two curves */}
      <line x1="34" y1="22" x2="34" y2="15.5" stroke="#1F4E79" strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" opacity="0.7" />
    </svg>
  )
}
